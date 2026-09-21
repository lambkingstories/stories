import { ref } from 'vue'
import { isIOS } from '@/utils/platform'

/**
 * Tips through StoreKit, iOS only.
 *
 * The App Store forbids buttons or links to payment outside in-app purchase
 * on every storefront except the United States (App Review Guideline
 * 3.1.1(a)), so the iOS build cannot show the PayPal / Ko-fi buttons the web
 * and Android builds use. A tip through in-app purchase is explicitly allowed
 * ("Apps may use in-app purchase currencies to enable customers to tip the
 * developer", 3.1.1), and that is what this buys.
 *
 * `com.stories.lambking.tip` is a consumable created in App Store Connect, so
 * it can be given more than once. Until Anton has accepted the Paid Apps
 * agreement and entered bank and tax details, StoreKit returns no products at
 * all — the button then stays hidden instead of failing in front of the user.
 */
export const TIP_PRODUCT_ID = 'com.stories.lambking.tip'

export type TipStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'purchasing' | 'thanks' | 'failed'

const status = ref<TipStatus>('idle')
const priceLabel = ref('')

// Dynamic so the web and Android bundles never pull the plugin API in.
const iapApi = () => import('@choochmeque/tauri-plugin-iap-api')

async function loadTipProduct(): Promise<void> {
  if (!isIOS || status.value !== 'idle') return
  status.value = 'loading'
  try {
    const { getProducts } = await iapApi()
    const { products } = await getProducts([TIP_PRODUCT_ID], 'inapp')
    const product = products.find((p) => p.productId === TIP_PRODUCT_ID)
    if (!product) {
      status.value = 'unavailable'
      return
    }
    priceLabel.value = product.formattedPrice || ''
    status.value = 'ready'
  } catch (error) {
    console.warn('[tips] product lookup failed', error)
    status.value = 'unavailable'
  }
}

async function buyTip(): Promise<void> {
  if (status.value !== 'ready' && status.value !== 'failed' && status.value !== 'thanks') return
  status.value = 'purchasing'
  try {
    const { purchase, consumePurchase, PurchaseState } = await iapApi()
    const result = await purchase(TIP_PRODUCT_ID, 'inapp')
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
  }
}

export default function useTips() {
  return { status, priceLabel, loadTipProduct, buyTip }
}
