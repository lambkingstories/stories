import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'
import { USAGE_RETENTION_DAYS, UserActivity } from '../src/models/UserActivity.js'
import { UsageService } from '../src/services/UsageService.js'

const UUID_A = '11111111-2222-4333-8444-555555555555'
const UUID_B = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

let app: Awaited<ReturnType<typeof createApp>>

beforeEach(async () => {
  // The service memoises "already recorded today" per process; the shared
  // afterEach wipes the collection, so the memo has to go with it or the
  // next test's request would be skipped as a duplicate.
  UsageService.resetMemo()
  app = await createApp()
})

/**
 * Tracking is deliberately fire-and-forget (the request never awaits the
 * Mongo write), so tests wait for the row to land instead of assuming it
 * already has.
 */
async function waitForRows(expected: number, timeoutMs = 2000): Promise<number> {
  const deadline = Date.now() + timeoutMs
  let count = 0
  do {
    count = await UserActivity.countDocuments({})
    if (count >= expected) return count
    await new Promise((resolve) => setTimeout(resolve, 20))
  } while (Date.now() < deadline)
  return count
}

describe('usage tracking middleware', () => {
  it('records one row per user per day, no matter how many requests', async () => {
    await request(app).get('/api/books').set('X-User-Uuid', UUID_A)
    await request(app).get('/api/books').set('X-User-Uuid', UUID_A)
    await request(app).get('/api/categories').set('X-User-Uuid', UUID_A)
    expect(await waitForRows(1)).toBe(1)

    const rows = await UserActivity.find({}).lean().exec()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.userUuid).toBe(UUID_A)
    expect(rows[0]!.day).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('records each distinct user separately', async () => {
    await request(app).get('/api/books').set('X-User-Uuid', UUID_A)
    await request(app).get('/api/books').set('X-User-Uuid', UUID_B)
    expect(await waitForRows(2)).toBe(2)
  })

  it('ignores a missing or malformed uuid header', async () => {
    await request(app).get('/api/books')
    await request(app).get('/api/books').set('X-User-Uuid', 'not-a-uuid')
    await request(app).get('/api/books').set('X-User-Uuid', '<script>alert(1)</script>')
    // Give the (absent) writes the same chance to land as a real one.
    expect(await waitForRows(1, 300)).toBe(0)
  })

  it('does not break the request it rides on', async () => {
    const res = await request(app).get('/api/books').set('X-User-Uuid', UUID_A)
    expect(res.status).toBe(200)
  })
})

describe('GET /api/admin/usage/daily', () => {
  it('requires admin basic auth', async () => {
    const res = await request(app).get('/api/admin/usage/daily')
    expect(res.status).toBe(401)
    expect(res.headers['www-authenticate']).toMatch(/Basic/)
  })

  it('returns a zero-filled 30-day series by default', async () => {
    const res = await request(app).get('/api/admin/usage/daily').set('Authorization', ADMIN_AUTH)
    expect(res.status).toBe(200)
    expect(res.body.range).toBe('30')
    expect(res.body.days).toHaveLength(30)
    expect(res.body.days.every((d: { users: number }) => d.users === 0)).toBe(true)
    expect(res.body.to).toBe(UsageService.today())
    expect(res.body.timezone).toBeTruthy()
    expect(res.body.totals.uniqueAllTime).toBe(0)
  })

  it('honours the range presets', async () => {
    for (const [range, length] of [['7', 7], ['90', 90], ['365', 365]] as const) {
      const res = await request(app)
        .get(`/api/admin/usage/daily?range=${range}`)
        .set('Authorization', ADMIN_AUTH)
      expect(res.status).toBe(200)
      expect(res.body.days).toHaveLength(length)
    }
  })

  it('rejects an unknown range', async () => {
    const res = await request(app)
      .get('/api/admin/usage/daily?range=42')
      .set('Authorization', ADMIN_AUTH)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('counts today\'s active users and totals them across the range', async () => {
    const today = UsageService.today()
    await UserActivity.create([
      { day: today, userUuid: UUID_A },
      { day: today, userUuid: UUID_B },
      // Yesterday: one returning user + one who has not been back.
      { day: addDays(today, -1), userUuid: UUID_A },
      { day: addDays(today, -1), userUuid: 'cccccccc-dddd-4eee-8fff-000000000000' }
    ])

    const res = await request(app)
      .get('/api/admin/usage/daily?range=7')
      .set('Authorization', ADMIN_AUTH)

    expect(res.status).toBe(200)
    const days = res.body.days as Array<{ day: string; users: number }>
    expect(days[days.length - 1]).toEqual({ day: today, users: 2 })
    expect(days[days.length - 2]).toEqual({ day: addDays(today, -1), users: 2 })
    expect(res.body.totals.activeToday).toBe(2)
    // Three distinct people over the two days, not four rows.
    expect(res.body.totals.uniqueInRange).toBe(3)
    expect(res.body.totals.uniqueAllTime).toBe(3)
    expect(res.body.totals.peak.users).toBe(2)
  })

  it('starts an "all" range at the first recorded day', async () => {
    const today = UsageService.today()
    await UserActivity.create({ day: addDays(today, -3), userUuid: UUID_A })

    const res = await request(app)
      .get('/api/admin/usage/daily?range=all')
      .set('Authorization', ADMIN_AUTH)

    expect(res.status).toBe(200)
    expect(res.body.from).toBe(addDays(today, -3))
    expect(res.body.days).toHaveLength(4)
    expect(res.body.totals.firstDay).toBe(addDays(today, -3))
  })
})

describe('usage retention', () => {
  // The privacy policy promises deletion after 13 months; this pins both
  // halves of that promise — the upsert stamps `createdAt`, and startup
  // creates the TTL index that expires rows by it.
  it('stamps createdAt on the upserted row and expires rows through a TTL index', async () => {
    await request(app).get('/api/books').set('X-User-Uuid', UUID_A)
    expect(await waitForRows(1)).toBe(1)
    const [row] = await UserActivity.find({}).lean().exec()
    expect(row!.createdAt).toBeInstanceOf(Date)

    await UsageService.ensureIndexes()
    const indexes = await UserActivity.collection.indexes()
    const ttl = indexes.find((index) => index.key?.createdAt === 1)
    expect(ttl?.expireAfterSeconds).toBe(USAGE_RETENTION_DAYS * 24 * 60 * 60)
  })
})

function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d) + delta * 86_400_000).toISOString().slice(0, 10)
}
