/**
 * Buying LambKing Plus and single coloring books: the choice of the offer, the reading of what the store says is owned, the answer
 * when the store cannot be reached, and the way a purchase runs (parental gate first, acknowledge, Plus on afterwards).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const iap = {
  restorePurchases: vi.fn(),
  getProducts: vi.fn(),
  purchase: vi.fn(),
  acknowledgePurchase: vi.fn(),
  PurchaseState: { PURCHASED: 0, CANCELED: 1, PENDING: 2 }
}
vi.mock('@choochmeque/tauri-plugin-iap-api', () => iap)

const gate = vi.fn(() => Promise.resolve(true))
vi.mock('@/use/useParentalGate', () => ({ requireParent: () => gate() }))

const phase = (micros: number, formattedPrice: string) => ({ formattedPrice, priceCurrencyCode: 'EUR', priceAmountMicros: micros, billingPeriod: 'P1Y', billingCycleCount: 1, recurrenceMode: 1 })

async function load(native = true) {
  vi.resetModules()
  vi.stubEnv('VITE_APP_NATIVE', native ? 'true' : 'false')
  vi.stubEnv('VITE_PREMIUM_TEASER', 'true')
  const purchases = await import('@/use/usePurchases')
  const premium = await import('@/use/usePremium')
  return { ...purchases, ...premium, state: purchases.default }
}

beforeEach(() => {
  localStorage.clear()
  gate.mockClear()
  gate.mockImplementation(() => Promise.resolve(true))
  Object.values(iap).forEach((f) => typeof f === 'function' && 'mockReset' in f && (f as ReturnType<typeof vi.fn>).mockReset())
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('the offer to buy on Android', () => {
  it('takes the offer of the base plan whose first phase is cheapest (an offer for new customers), and shows the regular price', async () => {
    const { pickOffer, regularPrice } = await load()
    const offers = [
      { offerToken: 'plain', basePlanId: 'jahr', pricingPhases: [phase(29_990_000, '29,99 €')] },
      { offerToken: 'intro', basePlanId: 'jahr', offerId: 'start', pricingPhases: [phase(19_990_000, '19,99 €'), phase(29_990_000, '29,99 €')] },
      { offerToken: 'month', basePlanId: 'monat', pricingPhases: [phase(3_490_000, '3,49 €')] }
    ]
    const year = pickOffer(offers, 'jahr')
    expect(year?.offerToken).toBe('intro')
    expect(regularPrice(year)).toBe('29,99 €')
    expect(pickOffer(offers, 'monat')?.offerToken).toBe('month')
    expect(pickOffer(offers, 'unknown')).toBeUndefined()
    expect(pickOffer(undefined, 'jahr')).toBeUndefined()
  })
})

describe('what the store says is owned', () => {
  it('knows Plus from an active subscription and the books from their products', async () => {
    const { ownedFrom } = await load()
    const owned = ownedFrom(
      [{ productId: 'com.stories.lambking.plus.year', purchaseState: 0 }],
      [{ productId: 'lambking_book_lokal_abraham', purchaseState: 0 }, { productId: 'com.stories.lambking.support.3', purchaseState: 0 }, { productId: 'lambking_book_lokal_mose', purchaseState: 2 }]
    )
    expect(owned).toEqual({ plus: true, books: ['lambking_book_lokal_abraham'] })
    expect(ownedFrom([{ productId: 'com.stories.lambking.plus.month', purchaseState: 1 }], []).plus).toBe(false)
    expect(ownedFrom([{ productId: 'lambking_plus', purchaseState: 0 }], []).plus).toBe(true)
  })

  it('names the product of a book without odd characters', async () => {
    const { bookProductId } = await import('@/data/plusProducts')
    expect(bookProductId('ba-03-noah-die-arche-und-der-regenbogen')).toBe('lambking_book_ba_03')
    expect(bookProductId('ba-14-ostern-jesus-lebt')).toBe('lambking_book_ba_14')
    expect(bookProductId('lokal-abraham')).toBe('lambking_book_lokal_abraham')
  })
})

describe('reading the store', () => {
  it('switches Plus and the owned books on and keeps them on the device', async () => {
    const m = await load()
    iap.restorePurchases.mockImplementation((type: string) =>
      Promise.resolve({ purchases: type === 'subs' ? [{ productId: 'com.stories.lambking.plus.year', purchaseState: 0 }] : [{ productId: 'lambking_book_lokal_abraham', purchaseState: 0 }] })
    )
    expect(await m.refreshOwned()).toBe(true)
    expect(m.isPlus()).toBe(true)
    expect(m.hasBook('lokal-abraham')).toBe(true)
    // with Plus every book is open
    expect(m.hasBook('lokal-mose')).toBe(true)
    expect(JSON.parse(localStorage.getItem('lk-plus-owned-v1')!)).toMatchObject({ plus: true, books: ['lambking_book_lokal_abraham'] })
  })

  it('opens only the bought book for a person without Plus', async () => {
    const m = await load()
    iap.restorePurchases.mockImplementation((type: string) =>
      Promise.resolve({ purchases: type === 'inapp' ? [{ productId: 'lambking_book_lokal_abraham', purchaseState: 0 }] : [] })
    )
    await m.refreshOwned()
    expect(m.isPlus()).toBe(false)
    expect(m.hasBook('lokal-abraham')).toBe(true)
    expect(m.hasBook('lokal-mose')).toBe(false)
  })

  it('switches Plus off when the store answers that nothing is owned any more', async () => {
    const m = await load()
    m.setSubscribed(true)
    iap.restorePurchases.mockResolvedValue({ purchases: [] })
    await m.refreshOwned()
    expect(m.isPlus()).toBe(false)
  })

  it('keeps what was seen last while the store cannot be reached, for two weeks', async () => {
    localStorage.setItem('lk-plus-owned-v1', JSON.stringify({ plus: true, books: [], at: Date.now() - 3 * 86_400_000 }))
    const m = await load()
    iap.restorePurchases.mockRejectedValue(new Error('no connection'))
    expect(await m.refreshOwned()).toBe(false)
    expect(m.isPlus()).toBe(true)

    localStorage.setItem('lk-plus-owned-v1', JSON.stringify({ plus: true, books: [], at: Date.now() - 20 * 86_400_000 }))
    const old = await load()
    iap.restorePurchases.mockRejectedValue(new Error('no connection'))
    await old.refreshOwned()
    expect(old.isPlus()).toBe(false)
  })

  it('does nothing outside the app from the store', async () => {
    const m = await load(false)
    expect(m.PURCHASES_AVAILABLE).toBe(false)
    expect(await m.refreshOwned()).toBe(false)
    expect(iap.restorePurchases).not.toHaveBeenCalled()
  })
})

describe('buying', () => {
  it('asks the parental gate first, buys, acknowledges and switches Plus on', async () => {
    const m = await load()
    // the test runs as Android (not iOS): one subscription with two base plans, the offer token goes with the purchase
    iap.getProducts.mockResolvedValue({ products: [{ productId: 'lambking_plus', subscriptionOfferDetails: [{ offerToken: 'tokY', basePlanId: 'jahr', pricingPhases: [phase(29_990_000, '29,99 €')] }, { offerToken: 'tokM', basePlanId: 'monat', pricingPhases: [phase(3_490_000, '3,49 €')] }] }] })
    iap.purchase.mockResolvedValue({ productId: 'lambking_plus', purchaseState: 0, purchaseToken: 'tok' })
    iap.restorePurchases.mockImplementation((type: string) => Promise.resolve({ purchases: type === 'subs' ? [{ productId: 'lambking_plus', purchaseState: 0 }] : [] }))
    await m.state().loadPlusProducts()
    expect(m.state().prices.value).toMatchObject({ year: '29,99 €', month: '3,49 €' })
    await m.buyPlus('year')
    expect(gate).toHaveBeenCalledTimes(1)
    expect(iap.purchase).toHaveBeenCalledWith('lambking_plus', 'subs', { offerToken: 'tokY' })
    expect(iap.acknowledgePurchase).toHaveBeenCalledWith('tok')
    expect(m.isPlus()).toBe(true)
    expect(m.state().status.value).toBe('done')
  })

  it('buys nothing when the parental gate is not passed', async () => {
    const m = await load()
    gate.mockImplementation(() => Promise.resolve(false))
    await m.buyBook('lokal-abraham')
    expect(iap.purchase).not.toHaveBeenCalled()
    expect(m.state().status.value).toBe('idle')
  })

  it('takes a cancelled purchase as no failure, and says when approval is pending or the store has nothing', async () => {
    const m = await load()
    expect(m.statusForRejection(new Error('Purchase cancelled by user'))).toBe('idle')
    expect(m.statusForRejection(new Error('Purchase is pending'))).toBe('pending')
    expect(m.statusForRejection(new Error('Product not found'))).toBe('unavailable')
    expect(m.statusForRejection(new Error('boom'))).toBe('failed')
  })

  it('buys one coloring book for good and opens it', async () => {
    const m = await load()
    iap.purchase.mockResolvedValue({ productId: 'lambking_book_lokal_abraham', purchaseState: 0, purchaseToken: 't' })
    iap.restorePurchases.mockImplementation((type: string) => Promise.resolve({ purchases: type === 'inapp' ? [{ productId: 'lambking_book_lokal_abraham', purchaseState: 0 }] : [] }))
    expect(m.hasBook('lokal-abraham')).toBe(false)
    await m.buyBook('lokal-abraham')
    expect(iap.purchase).toHaveBeenCalledWith('lambking_book_lokal_abraham', 'inapp', undefined)
    expect(m.hasBook('lokal-abraham')).toBe(true)
  })

  it('says "pending" when a parent still has to approve', async () => {
    const m = await load()
    iap.purchase.mockResolvedValue({ productId: 'x', purchaseState: 2, purchaseToken: '' })
    await m.buyBook('lokal-abraham')
    expect(m.state().status.value).toBe('pending')
    expect(iap.acknowledgePurchase).not.toHaveBeenCalled()
  })
})
