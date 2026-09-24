import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * `tauri-plugin-iap` rejects the `purchase` promise for every StoreKit
 * outcome except a completed purchase — including the user closing Apple's
 * own sheet. These pin what the tip sheet makes of each, so a cancel never
 * shows "that did not work" again, and a store with nothing to sell is
 * asked again the next time the sheet opens.
 */
const getProducts = vi.fn()
const purchase = vi.fn()

vi.mock('@/utils/platform', () => ({ isIOS: true }))
vi.mock('@choochmeque/tauri-plugin-iap-api', () => ({
  getProducts: (...args: unknown[]) => getProducts(...args),
  purchase: (...args: unknown[]) => purchase(...args),
  consumePurchase: vi.fn(async () => {}),
  PurchaseState: { PURCHASED: 0, CANCELED: 1, PENDING: 2 }
}))

// Module-level state is the point of `useTips` (one StoreKit session for the
// whole app), so each case gets a fresh copy.
async function freshTips() {
  vi.resetModules()
  const mod = await import('@/use/useTips')
  return { ...mod.default(), TIP_TIERS: mod.TIP_TIERS }
}

const ID = 'com.stories.lambking.support.3'

beforeEach(() => {
  getProducts.mockReset()
  purchase.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('buyTip', () => {
  it('says thank you for a completed purchase', async () => {
    purchase.mockResolvedValue({ purchaseState: 0, purchaseToken: 't' })
    const tips = await freshTips()
    await tips.buyTip(ID)
    expect(tips.status.value).toBe('thanks')
    expect(tips.pendingId.value).toBe('')
  })

  it('goes quietly back to the list when the StoreKit sheet is cancelled', async () => {
    purchase.mockRejectedValue('Purchase cancelled by user')
    const tips = await freshTips()
    await tips.buyTip(ID)
    expect(tips.status.value).toBe('idle')
  })

  it('reports Ask to Buy as waiting, not as a failure', async () => {
    purchase.mockRejectedValue('Purchase is pending')
    const tips = await freshTips()
    await tips.buyTip(ID)
    expect(tips.status.value).toBe('pending')
  })

  it('tells a store with nothing to sell apart from a failed purchase', async () => {
    purchase.mockRejectedValue('Product not found')
    const tips = await freshTips()
    await tips.buyTip(ID)
    expect(tips.status.value).toBe('unavailable')

    purchase.mockRejectedValue('Purchase failed: The operation couldn’t be completed.')
    await tips.buyTip(ID)
    expect(tips.status.value).toBe('failed')
  })

  it('ignores product ids that are not one of the tiers', async () => {
    const tips = await freshTips()
    await tips.buyTip('com.example.other')
    expect(purchase).not.toHaveBeenCalled()
  })
})

describe('loadTipProducts', () => {
  it('asks StoreKit again after an empty answer, and stops once it has prices', async () => {
    getProducts.mockResolvedValueOnce({ products: [] })
    const tips = await freshTips()

    await tips.loadTipProducts()
    expect(tips.storeReady.value).toBe(false)

    getProducts.mockResolvedValueOnce({
      products: [{ productId: ID, formattedPrice: '3,00 €' }]
    })
    await tips.loadTipProducts()
    expect(tips.storeReady.value).toBe(true)
    expect(tips.priceLabels.value[ID]).toBe('3,00 €')

    await tips.loadTipProducts()
    expect(getProducts).toHaveBeenCalledTimes(2)
  })

  it('shares one lookup between callers that arrive while it runs', async () => {
    getProducts.mockResolvedValue({ products: [] })
    const tips = await freshTips()
    await Promise.all([tips.loadTipProducts(), tips.loadTipProducts()])
    expect(getProducts).toHaveBeenCalledTimes(1)
  })
})
