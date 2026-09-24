import { ref } from 'vue'
import { isIOS } from '@/utils/platform'

/**
 * Support amounts through StoreKit, iOS only.
 *
 * The App Store forbids buttons or links to payment outside in-app purchase
 * on every storefront except the United States (App Review Guideline
 * 3.1.1(a)), so the iOS build cannot show the PayPal / Ko-fi buttons the web
 * and Android builds use. A tip through in-app purchase is explicitly allowed
 * ("Apps may use in-app purchase currencies to enable customers to tip the
 * developer", 3.1.1), and that is what these buy.
 *
 * Deliberately framed as a *tip*, never a donation: a donation to a
 * registered nonprofit may NOT go through in-app purchase (3.2.1(vi)), so a
 * "Spende" label on these products is a rejection waiting to happen.
 *
 * Each amount is its own consumable in App Store Connect, so it can be given
 * more than once. StoreKit hands out no product at all — not even in the
 * sandbox or TestFlight — until the Paid Apps agreement is active and every
 * product has left "Missing Metadata" (which needs a review screenshot).
 */
export interface TipTier {
  /** Product id in App Store Connect. */
  id: string
  /** Euro amount, used for the fallback label before StoreKit answers. */
  amount: number
}

export const TIP_TIERS: readonly TipTier[] = [
  { id: 'com.stories.lambking.support.3', amount: 3 },
  { id: 'com.stories.lambking.support.10', amount: 10 },
  { id: 'com.stories.lambking.support.20', amount: 20 },
  { id: 'com.stories.lambking.support.50', amount: 50 },
  { id: 'com.stories.lambking.support.100', amount: 100 }
]

/**
 * - `unavailable`: StoreKit has nothing to sell (see above) — a store-side
 *   state, so the sheet says so instead of "please try again".
 * - `pending`: Ask to Buy — a parent still has to approve on their device.
 */
export type TipStatus = 'idle' | 'purchasing' | 'thanks' | 'pending' | 'unavailable' | 'failed'

const status = ref<TipStatus>('idle')
/**
 * False while StoreKit returned nothing. The sheet still opens and still lists
 * the amounts: hiding the button instead created a deadlock, because Apple
 * wants a review screenshot *of the purchase UI* before it will move the
 * products out of "Missing Metadata".
 */
const storeReady = ref(false)
/** Product id → the localized price string StoreKit formats for the device. */
const priceLabels = ref<Record<string, string>>({})
/** The tier currently being bought, so only its row shows a spinner. */
const pendingId = ref('')

// Dynamic so the web and Android bundles never pull the plugin API in.
const iapApi = () => import('@choochmeque/tauri-plugin-iap-api')

let lookup: Promise<void> | null = null

/**
 * Asks StoreKit for the products. Repeats on every call until StoreKit has
 * answered with at least one, so opening the sheet again picks them up once
 * the store side is sorted — no app restart needed.
 */
function loadTipProducts(): Promise<void> {
  if (!isIOS || storeReady.value) return Promise.resolve()
  if (lookup) return lookup
  lookup = (async () => {
    try {
      const { getProducts } = await iapApi()
      const { products } = await getProducts(TIP_TIERS.map((t) => t.id), 'inapp')
      const labels: Record<string, string> = {}
      for (const p of products) {
        if (p.formattedPrice) labels[p.productId] = p.formattedPrice
      }
      priceLabels.value = labels
      storeReady.value = Object.keys(labels).length > 0
      if (!storeReady.value) console.warn('[tips] StoreKit returned no products')
    } catch (error) {
      // Includes the plain browser build, where the plugin has no host to
      // talk to. The sheet falls back to the plain euro amounts.
      console.warn('[tips] product lookup failed', error)
    } finally {
      lookup = null
    }
  })()
  return lookup
}

/**
 * The plugin rejects for every outcome but a completed purchase, with the
 * StoreKit result as the message ("Purchase cancelled by user", "Purchase is
 * pending", "Product not found", …). Cancelling is not a failure.
 */
function statusForRejection(error: unknown): TipStatus {
  const message = String((error as { message?: string })?.message ?? error)
  if (/cancel/i.test(message)) return 'idle'
  if (/pending/i.test(message)) return 'pending'
  if (/not found/i.test(message)) return 'unavailable'
  return 'failed'
}

async function buyTip(productId: string): Promise<void> {
  if (status.value === 'purchasing') return
  if (!TIP_TIERS.some((t) => t.id === productId)) return
  pendingId.value = productId
  status.value = 'purchasing'
  try {
    const { purchase, consumePurchase, PurchaseState } = await iapApi()
    const result = await purchase(productId, 'inapp')
    if (result?.purchaseState === PurchaseState.PURCHASED) {
      // No-op on iOS (StoreKit finishes the transaction itself) but keeps the
      // consumable re-purchasable wherever the plugin needs it spelled out.
      try {
        if (result.purchaseToken) await consumePurchase(result.purchaseToken)
      } catch { /* already finished */ }
      status.value = 'thanks'
      return
    }
    status.value = result?.purchaseState === PurchaseState.PENDING ? 'pending' : 'idle'
  } catch (error) {
    console.warn('[tips] purchase did not complete', error)
    status.value = statusForRejection(error)
  } finally {
    pendingId.value = ''
  }
}

/** Back to the amount list, e.g. when the modal is reopened after a thank-you. */
function resetTipStatus(): void {
  if (status.value !== 'purchasing') status.value = 'idle'
}

export default function useTips() {
  return { status, storeReady, priceLabels, pendingId, loadTipProducts, buyTip, resetTipStatus }
}
