/**
 * LambKing Plus shown in "Ich" (Anton 21.11.2026): the card says whether the subscription runs, which plan, until when, whether it renews, and that the free version
 * is back when it ends. The store is asked again when the app comes back to the front, so the end shows without a restart.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const iap = { restorePurchases: vi.fn(), getProducts: vi.fn(), purchase: vi.fn(), acknowledgePurchase: vi.fn(), PurchaseState: { PURCHASED: 0, CANCELED: 1, PENDING: 2 } }
vi.mock('@choochmeque/tauri-plugin-iap-api', () => iap)
vi.mock('@/use/useParentalGate', () => ({ requireParent: () => Promise.resolve(true) }))

/** A signed receipt of Apple is three parts joined by dots; the middle one is the JSON with the end of the period. */
function jws(expiresDate: number | undefined): string {
  const payload = Buffer.from(JSON.stringify(expiresDate === undefined ? {} : { expiresDate })).toString('base64url')
  return `eyJhbGciOiJFUzI1NiJ9.${payload}.signature`
}

async function load() {
  vi.resetModules()
  vi.stubEnv('VITE_APP_NATIVE', 'true')
  vi.stubEnv('VITE_PREMIUM_TEASER', 'true')
  const purchases = await import('@/use/usePurchases')
  const premium = await import('@/use/usePremium')
  return { ...purchases, premium: premium.default() }
}

beforeEach(() => {
  localStorage.clear()
  Object.values(iap).forEach((f) => typeof f === 'function' && 'mockReset' in f && (f as ReturnType<typeof vi.fn>).mockReset())
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('what the store says about the subscription', () => {
  it('reads the end of the paid period from the receipt of Apple', async () => {
    const { expiryFromJws } = await load()
    expect(expiryFromJws(jws(1_800_000_000_000))).toBe(1_800_000_000_000)
    expect(expiryFromJws(jws(undefined))).toBeUndefined()
    expect(expiryFromJws('nonsense')).toBeUndefined()
    expect(expiryFromJws(undefined)).toBeUndefined()
  })

  it('gives the plan, the renewal and the end of a running subscription (iOS)', async () => {
    const { ownedFrom } = await load()
    const owned = ownedFrom([{ productId: 'com.stories.lambking.plus.month', purchaseState: 0, isAutoRenewing: true, jwsRepresentation: jws(1_800_000_000_000) }], [])
    expect(owned.plus).toBe(true)
    expect(owned.info).toMatchObject({ renews: true, until: 1_800_000_000_000 })
    expect(owned.info?.plan).toBeDefined()
  })

  it('says that a cancelled subscription does not renew', async () => {
    const { ownedFrom } = await load()
    const owned = ownedFrom([{ productId: 'com.stories.lambking.plus.year', purchaseState: 0, isAutoRenewing: false, jwsRepresentation: jws(1_800_000_000_000) }], [])
    expect(owned.info?.renews).toBe(false)
  })

  it('has no subscription when nothing live is found', async () => {
    const { ownedFrom } = await load()
    expect(ownedFrom([], [])).toMatchObject({ plus: false, info: null })
    expect(ownedFrom([{ productId: 'com.stories.lambking.plus.year', purchaseState: 2 }], [])).toMatchObject({ plus: false, info: null })
  })

  it('turns the app back into the free version when the store no longer lists the subscription', async () => {
    const { refreshOwned, premium } = await load()
    iap.restorePurchases.mockImplementation(async (type: string) =>
      type === 'subs' ? { purchases: [{ productId: 'com.stories.lambking.plus.year', purchaseState: 0, isAutoRenewing: false, jwsRepresentation: jws(1_800_000_000_000) }] } : { purchases: [] }
    )
    await refreshOwned()
    expect(premium.plusOn.value).toBe(true)
    expect(premium.plusInfo.value?.until).toBe(1_800_000_000_000)

    iap.restorePurchases.mockImplementation(async () => ({ purchases: [] }))
    await refreshOwned()
    expect(premium.plusOn.value).toBe(false)
    expect(premium.plusInfo.value).toBeNull()
  })

  it('asks the store again when the app comes back to the front, but not at every glance', async () => {
    const { refreshOwned, refreshOnResume, RESUME_ASK_MS } = await load()
    iap.restorePurchases.mockImplementation(async () => ({ purchases: [] }))
    await refreshOwned()
    expect(iap.restorePurchases).toHaveBeenCalledTimes(2)
    await refreshOnResume(Date.now() + 1000)
    expect(iap.restorePurchases).toHaveBeenCalledTimes(2)
    await refreshOnResume(Date.now() + RESUME_ASK_MS + 1000)
    expect(iap.restorePurchases).toHaveBeenCalledTimes(4)
  })
})

describe('the card in "Ich"', () => {
  const view = () => readFileSync(resolve(process.cwd(), 'src/views/app/AppProfileView.vue'), 'utf8')

  it('shows the subscription (plan, line, manage) or the free version with the way to Plus', () => {
    const s = view()
    expect(s).toContain('data-test="plus-card"')
    expect(s).toContain("plusOn ? t('app.profile.plusCardTitle') : t('app.profile.plusFreeTitle')")
    expect(s).toContain("t('app.profile.plusFreeSub')")
    expect(s).toContain("name: 'app-plus'")
  })

  it('opens the store page of the subscription only behind the parental gate', () => {
    const s = view()
    expect(s).toMatch(/async function manageSubscription\(\) \{\s*if \(await requireParent\(\)\)/)
  })

  it('is only there when something is for sale (the same switch as the locks)', () => {
    expect(view()).toContain('const showPlusCard = PREMIUM_TEASER')
  })
})
