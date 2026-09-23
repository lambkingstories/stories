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
 * more than once. Until the Paid Apps agreement is accepted with bank and tax
 * details, StoreKit returns no products at all — the button then stays hidden
 * instead of failing in front of the user.
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

export type TipStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'purchasing' | 'thanks' | 'failed'

const status = ref<TipStatus>('idle')
/** Product id → the localized price string StoreKit formats for the device. */
const priceLabels = ref<Record<string, string>>({})
/** The tier currently being bought, so only its row shows a spinner. */
const pendingId = ref('')

// Dynamic so the web and Android bundles never pull the plugin API in.
const iapApi = () => import('@choochmeque/tauri-plugin-iap-api')

async function loadTipProducts(): Promise<void> {
  if (!isIOS || status.value !== 'idle') return
  status.value = 'loading'
  try {
    const { getProducts } = await iapApi()
    const { products } = await getProducts(TIP_TIERS.map((t) => t.id), 'inapp')
    const labels: Record<string, string> = {}
    for (const p of products) {
      if (p.formattedPrice) labels[p.productId] = p.formattedPrice
    }
    // Nothing offered means the Paid Apps agreement is still missing, or the
    // products have not cleared review yet. Either way there is nothing to sell.
    if (!Object.keys(labels).length) {
      status.value = 'unavailable'
      return
    }
    priceLabels.value = labels
    status.value = 'ready'
  } catch (error) {
    console.warn('[tips] product lookup failed', error)
    status.value = 'unavailable'
  }
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
    // Cancelled in the StoreKit sheet, or left pending (Ask to Buy).
    status.value = 'ready'
  } catch (error) {
    console.warn('[tips] purchase failed', error)
    status.value = 'failed'
  } finally {
    pendingId.value = ''
  }
}

/** Back to the amount list, e.g. when the modal is reopened after a thank-you. */
function resetTipStatus(): void {
  if (status.value === 'thanks' || status.value === 'failed') status.value = 'ready'
}

export default function useTips() {
  return { status, priceLabels, pendingId, loadTipProducts, buyTip, resetTipStatus }
}
