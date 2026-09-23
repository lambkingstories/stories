import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp, sampleBook } from './helpers.js'
import { BookView } from '../src/models/BookView.js'
import { Book } from '../src/models/Book.js'
import { UsageService } from '../src/services/UsageService.js'

let app: Awaited<ReturnType<typeof createApp>>

beforeEach(async () => {
  app = await createApp()
})

/**
 * Counting is deliberately fire-and-forget (the request never awaits the
 * Mongo write), so tests wait for the counter to land instead of assuming it
 * already has.
 */
async function waitForViews(expected: number, timeoutMs = 2000): Promise<number> {
  const deadline = Date.now() + timeoutMs
  let views = 0
  do {
    const row = await BookView.findOne({ day: UsageService.today() }).lean().exec()
    views = row?.views ?? 0
    if (views >= expected) return views
    await new Promise((resolve) => setTimeout(resolve, 20))
  } while (Date.now() < deadline)
  return views
}

describe('book detail view counter', () => {
  it('counts one view per book detail request', async () => {
    const book = await Book.create(sampleBook())

    await request(app).get(`/api/book/${book.bookId}`)
    await request(app).get(`/api/book/${book.bookId}`)
    await request(app).get(`/api/book/${book.bookId}`)

    expect(await waitForViews(3)).toBe(3)

    const rows = await BookView.find({}).lean().exec()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.day).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not count list endpoints — only the book detail page', async () => {
    await request(app).get('/api/books')
    await request(app).get('/api/categories')
    await request(app).get('/api/book-series')

    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(await BookView.countDocuments({})).toBe(0)
  })

  /**
   * The whole point of the rewrite: the app sends nothing that identifies a
   * caller, and the server stores nothing but a day and a number. If a field
   * ever creeps back into this document, the App Store privacy answers and
   * the privacy policy both become wrong — so pin the shape.
   */
  it('stores nothing but a day and a count', async () => {
    const book = await Book.create(sampleBook())
    await request(app).get(`/api/book/${book.bookId}`).set('X-User-Uuid', 'aaaa-bbbb')
    expect(await waitForViews(1)).toBe(1)

    const [row] = await BookView.find({}).lean().exec()
    const keys = Object.keys(row!).filter((k) => k !== '_id' && k !== '__v')
    expect(keys.sort()).toEqual(['createdAt', 'day', 'updatedAt', 'views'])
  })

  it('never fails the book fetch', async () => {
    const book = await Book.create(sampleBook())
    const res = await request(app).get(`/api/book/${book.bookId}`)
    expect(res.status).toBe(200)
    expect(res.body.book.bookId).toBe(book.bookId)
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
    expect(res.body.days.every((d: { views: number }) => d.views === 0)).toBe(true)
    expect(res.body.to).toBe(UsageService.today())
    expect(res.body.timezone).toBeTruthy()
    expect(res.body.totals.viewsAllTime).toBe(0)
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

  it('reports today\'s views and totals them across the range', async () => {
    const today = UsageService.today()
    await BookView.create([
      { day: today, views: 12 },
      { day: addDays(today, -1), views: 30 }
    ])

    const res = await request(app)
      .get('/api/admin/usage/daily?range=7')
      .set('Authorization', ADMIN_AUTH)

    expect(res.status).toBe(200)
    const days = res.body.days as Array<{ day: string; views: number }>
    expect(days[days.length - 1]).toEqual({ day: today, views: 12 })
    expect(days[days.length - 2]).toEqual({ day: addDays(today, -1), views: 30 })
    expect(res.body.totals.viewsToday).toBe(12)
    expect(res.body.totals.viewsInRange).toBe(42)
    expect(res.body.totals.viewsAllTime).toBe(42)
    expect(res.body.totals.peak.views).toBe(30)
  })

  it('starts an "all" range at the first recorded day', async () => {
    const today = UsageService.today()
    await BookView.create({ day: addDays(today, -3), views: 5 })

    const res = await request(app)
      .get('/api/admin/usage/daily?range=all')
      .set('Authorization', ADMIN_AUTH)

    expect(res.status).toBe(200)
    expect(res.body.from).toBe(addDays(today, -3))
    expect(res.body.days).toHaveLength(4)
    expect(res.body.totals.firstDay).toBe(addDays(today, -3))
  })
})

function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d) + delta * 86_400_000).toISOString().slice(0, 10)
}
