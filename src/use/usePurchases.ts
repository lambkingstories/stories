/**
 * Buying LambKing Plus (the subscription, per year or per month) and single coloring books through the store of the phone:
 * StoreKit on iOS, Play Billing on Android, both through `@choochmeque/tauri-plugin-iap-api`. In the browser (and on the desktop)
 * there is nothing to buy: `PURCHASES_AVAILABLE` is false and the Plus page only says where Plus can be bought.
 *
 * What the person owns is read from the store ("restore"): when the app starts, after every purchase and on the button "Käufe
 * wiederherstellen". The result is handed to `usePremium` and kept on the device (`lk-plus-owned-v1`), so that Plus keeps working
 * offline for a while (`OFFLINE_DAYS`) when the store cannot be asked. There is no server and no receipt check of our own: the
 * store is asked on the device, which is enough for an app without money at stake per person.
 *
 * Every way to spend money starts with the parental gate (`requireParent`).
 */
import { ref } from 'vue'
import { isIOS } from '@/utils/platform'
import { requireParent } from '@/use/useParentalGate'
import { PLUS_TEST, setOwnedBooks, setSubscribed, setTestBook } from '@/use/usePremium'
import { PLUS_PRODUCTS, bookProductId, isBookProduct, type PlusPlan } from '@/data/plusProducts'
import type { Product, Purchase, SubscriptionOffer } from '@choochmeque/tauri-plugin-iap-api'

/** Native shells (Tauri Android/iOS, Electron) set `VITE_APP_NATIVE=true`; only there is a store to talk to. */
export const PURCHASES_AVAILABLE: boolean = import.meta.env.VITE_APP_NATIVE === 'true'

const CACHE_KEY = 'lk-plus-owned-v1'
/** How long a purchase that was seen once is trusted while the store cannot be asked (no connection). */
export const OFFLINE_DAYS = 14

/**
 * - `purchasing`: the store sheet is open or being opened.
 * - `done` / `restored` / `nothing`: a purchase went through / an earlier purchase was found / nothing to restore.
 * - `pending`: "Ask to Buy": a parent still has to approve on their device.
 * - `unavailable`: the store has nothing to sell (not set up yet, or no connection).
 * - `failed`: anything else that went wrong. Cancelling is not a failure and goes back to `idle`.
 */
export type PurchaseStatus = 'idle' | 'purchasing' | 'done' | 'restored' | 'nothing' | 'pending' | 'unavailable' | 'failed'

const status = ref<PurchaseStatus>('idle')
/** The price of every plan and book in the money of the store ("29,99 €"), once the store has answered. */
const prices = ref<Record<string, string>>({})
/** Android: the offer to buy for each plan (the base plan with the best first price for this person). */
const offerTokens: Record<string, string> = {}

const iapApi = () => import('@choochmeque/tauri-plugin-iap-api')

// ── pure helpers (tested) ──────────────────────────────────────────────────────────────────

/** The offer of an Android subscription with this base plan whose first phase is the cheapest (an offer for new customers beats the plain plan). */
export function pickOffer(offers: SubscriptionOffer[] | undefined, basePlanId: string): SubscriptionOffer | undefined {
  const own = (offers ?? []).filter((o) => o.basePlanId === basePlanId)
  const first = (o: SubscriptionOffer) => o.pricingPhases[0]?.priceAmountMicros ?? Number.MAX_SAFE_INTEGER
  return own.sort((a, b) => first(a) - first(b))[0]
}

/** The regular price of an offer: its last phase (the first ones can be a start offer). */
export function regularPrice(offer: SubscriptionOffer | undefined): string | undefined {
  const phases = offer?.pricingPhases ?? []
  return phases[phases.length - 1]?.formattedPrice
}

/** What a list of active purchases of the store says: is Plus on, and which single books are owned (ids of their products). */
export function ownedFrom(subs: Pick<Purchase, 'productId' | 'purchaseState'>[], books: Pick<Purchase, 'productId' | 'purchaseState'>[]) {
  const plusIds: string[] = [PLUS_PRODUCTS.ios.year, PLUS_PRODUCTS.ios.month, PLUS_PRODUCTS.ios.familyYear, PLUS_PRODUCTS.ios.familyMonth, PLUS_PRODUCTS.android.subscription]
  // PurchaseState.PURCHASED is 0 (not pending, not cancelled)
  const live = (p: Pick<Purchase, 'purchaseState'>) => p.purchaseState === 0
  return {
    plus: subs.some((p) => live(p) && plusIds.includes(p.productId)),
    books: [...new Set(books.filter((p) => live(p) && isBookProduct(p.productId)).map((p) => p.productId))]
  }
}

// ── what was seen last, kept on the device ───────────────────────────────────────────────

interface Cache {
  plus: boolean
  books: string[]
  at: number
}

function readCache(now = Date.now()): Cache | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cache | null
    if (!c || typeof c.at !== 'number' || now - c.at > OFFLINE_DAYS * 86_400_000) return null
    return { plus: !!c.plus, books: Array.isArray(c.books) ? c.books.filter((b) => typeof b === 'string') : [], at: c.at }
  } catch {
    return null
  }
}

function writeCache(plus: boolean, books: string[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ plus, books, at: Date.now() } satisfies Cache))
  } catch {
    // no storage: only until the app is closed
  }
}

function apply(plus: boolean, books: string[]) {
  setSubscribed(plus)
  setOwnedBooks(books)
}

// ── asking the store ────────────────────────────────────────────────────────────────────

/**
 * Reads what the store says the person owns. A store that cannot be reached (no connection) leaves what was seen last (for
 * `OFFLINE_DAYS` days); an answer, also an empty one, replaces it. Returns whether the store answered.
 */
export async function refreshOwned(): Promise<boolean> {
  if (!PURCHASES_AVAILABLE) return false
  try {
    const { restorePurchases } = await iapApi()
    const [subs, books] = await Promise.all([restorePurchases('subs'), restorePurchases('inapp')])
    const owned = ownedFrom(subs.purchases ?? [], books.purchases ?? [])
    apply(owned.plus, owned.books)
    writeCache(owned.plus, owned.books)
    return true
  } catch (error) {
    console.warn('[purchases] the store could not be asked', error)
    const cached = readCache()
    if (cached) apply(cached.plus, cached.books)
    return false
  }
}

let lookup: Promise<void> | null = null

/** Asks the store for the prices of the two plans. Repeats on every call until the store has answered. */
export function loadPlusProducts(): Promise<void> {
  if (!PURCHASES_AVAILABLE || prices.value.year) return Promise.resolve()
  if (lookup) return lookup
  lookup = (async () => {
    try {
      const { getProducts } = await iapApi()
      if (isIOS) {
        const { products } = await getProducts(Object.values(PLUS_PRODUCTS.ios), 'subs')
        const label = (p?: Product) => p?.formattedPrice
        for (const plan of ['year', 'month', 'familyYear', 'familyMonth'] as const) {
          const price = label(products.find((p) => p.productId === PLUS_PRODUCTS.ios[plan]))
          if (price) prices.value = { ...prices.value, [plan]: price }
        }
      } else {
        const { products } = await getProducts([PLUS_PRODUCTS.android.subscription], 'subs')
        const offers = products[0]?.subscriptionOfferDetails
        const plans = [
          ['year', PLUS_PRODUCTS.android.yearPlan],
          ['month', PLUS_PRODUCTS.android.monthPlan],
          ['familyYear', PLUS_PRODUCTS.android.familyYearPlan],
          ['familyMonth', PLUS_PRODUCTS.android.familyMonthPlan]
        ] as const
        for (const [plan, basePlan] of plans) {
          const offer = pickOffer(offers, basePlan)
          if (!offer) continue
          offerTokens[plan] = offer.offerToken
          const price = regularPrice(offer)
          if (price) prices.value = { ...prices.value, [plan]: price }
        }
      }
      if (!prices.value.year) console.warn('[purchases] the store returned no Plus product')
    } catch (error) {
      console.warn('[purchases] product lookup failed', error)
    } finally {
      lookup = null
    }
  })()
  return lookup
}

/** The price of one coloring book in the money of the store (empty until the store has answered). */
export async function loadBookPrice(bookId: string): Promise<void> {
  const id = bookProductId(bookId)
  if (!PURCHASES_AVAILABLE || prices.value[id]) return
  try {
    const { getProducts } = await iapApi()
    const price = (await getProducts([id], 'inapp')).products[0]?.formattedPrice
    if (price) prices.value = { ...prices.value, [id]: price }
  } catch (error) {
    console.warn('[purchases] book price lookup failed', error)
  }
}

/** The plugin rejects for every outcome but a completed purchase, with the store's answer as the message. */
export function statusForRejection(error: unknown): PurchaseStatus {
  const message = String((error as { message?: string })?.message ?? error)
  if (/cancel/i.test(message)) return 'idle'
  if (/pending/i.test(message)) return 'pending'
  if (/not found|unavailable|no products/i.test(message)) return 'unavailable'
  return 'failed'
}

async function buy(productId: string, type: 'subs' | 'inapp', offerToken?: string): Promise<void> {
  if (status.value === 'purchasing') return
  if (!PURCHASES_AVAILABLE) {
    status.value = 'unavailable'
    return
  }
  if (!(await requireParent())) return
  status.value = 'purchasing'
  try {
    const { purchase, acknowledgePurchase, PurchaseState } = await iapApi()
    const result = await purchase(productId, type, offerToken ? { offerToken } : undefined)
    if (result?.purchaseState === PurchaseState.PENDING) {
      status.value = 'pending'
      return
    }
    if (result?.purchaseState !== PurchaseState.PURCHASED) {
      status.value = 'idle'
      return
    }
    // Google refunds a purchase that is not acknowledged within three days (a no-op on iOS)
    try {
      if (result.purchaseToken) await acknowledgePurchase(result.purchaseToken)
    } catch (error) {
      console.warn('[purchases] acknowledge failed', error)
    }
    await refreshOwned()
    status.value = 'done'
  } catch (error) {
    console.warn('[purchases] purchase did not complete', error)
    status.value = statusForRejection(error)
  }
}

/** Buys LambKing Plus: for a year or for a month, for one person or for the family. */
export async function buyPlus(plan: PlusPlan): Promise<void> {
  if (!prices.value[plan]) await loadPlusProducts()
  if (isIOS) return buy(PLUS_PRODUCTS.ios[plan], 'subs')
  const token = offerTokens[plan]
  if (!token) {
    status.value = 'unavailable'
    return
  }
  return buy(PLUS_PRODUCTS.android.subscription, 'subs', token)
}

/**
 * Buys one coloring book or one digital picture book for good. The test build (no store) pretends: after the parental gate the book counts as
 * bought on this device (`setTestBook`), so the way from the buy button to the reader can be tried.
 */
export async function buyBook(bookId: string): Promise<void> {
  if (!PURCHASES_AVAILABLE && PLUS_TEST) {
    if (status.value === 'purchasing' || !(await requireParent())) return
    setTestBook(bookId, true)
    status.value = 'done'
    return
  }
  return buy(bookProductId(bookId), 'inapp')
}

/** The button "Käufe wiederherstellen" (Apple asks for it): asks the store again and says what it found. */
export async function restoreAll(): Promise<void> {
  if (status.value === 'purchasing') return
  if (!PURCHASES_AVAILABLE) {
    status.value = 'unavailable'
    return
  }
  status.value = 'purchasing'
  const answered = await refreshOwned()
  if (!answered) {
    status.value = 'failed'
    return
  }
  const cached = readCache()
  status.value = cached && (cached.plus || cached.books.length) ? 'restored' : 'nothing'
}

export function resetPurchaseStatus(): void {
  if (status.value !== 'purchasing') status.value = 'idle'
}

export default function usePurchases() {
  return {
    status,
    prices,
    available: PURCHASES_AVAILABLE,
    loadPlusProducts,
    loadBookPrice,
    buyPlus,
    buyBook,
    restoreAll,
    resetPurchaseStatus
  }
}
