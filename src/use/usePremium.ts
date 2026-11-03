/**
 * Premium ("LambKing Plus") switchboard. Everything that will sit behind the
 * subscription asks this file, so turning the subscription on later is
 * one change here and not a hunt through the views.
 *
 * What is behind Plus (add a key here, then guard the feature with `hasFeature`):
 *   - `readAloud`: the books in the reading area read aloud ("Anhören" of a book). The read-aloud button inside an adventure is
 *     not asked about: the adventures sit behind Plus as a whole (see `adventure`).
 *   - `colors`: the colours beyond the 12 basic ones of every box (36 for the pencils) and the free colour picker in the coloring app
 *   - `glitter`: the glitter pencils, a tool of the coloring app
 *   - `adventure`: all the adventures (three of them are free in full,
 *     see `utils/adventureAccess`)
 *   - `allBooks`: every coloring book in full (the subscription). Without it a book shows only a few pictures
 *     (see `useBookAccess`), unless that single book was bought.
 *   - `book`: one book bought once (only used to word the sheet; what is owned is `ownedBooks`)
 *   - `family`: the games for the whole family beyond the first quiz (quiz evening, round code, activity)
 * Reading the stories, the 12 basic colours of every box and all the other tools of the coloring app are free for everybody and
 * never asked about here.
 *
 * Today nothing is for sale, so by default every feature is free and no lock is
 * shown. Build flags change that without touching code:
 *   - `VITE_PREMIUM_TEASER=true`: lock the premium features and show the "LambKing Plus" sheet when a locked item is tapped.
 *   - `VITE_PREMIUM_PREVIEW=true`: behave as a subscriber (to test the unlocked UI).
 *   - `VITE_PLUS_TEST=true`: the test build: the Plus page has a switch "Plus on / off" (kept on the device), so the locks and the
 *     unlocked app can be tried on a phone without any purchase.
 *
 * The purchase itself (StoreKit on iOS, Play Billing on Android) lives in `usePurchases`: it reads what the store says the person
 * owns and hands it in here (`setSubscribed`, `setOwnedBooks`). The buttons are on `AppPlusView.vue`, behind the parental gate.
 */
import { computed, ref } from 'vue'
import { bookProductId } from '@/data/plusProducts'

export type PremiumFeature = 'readAloud' | 'colors' | 'glitter' | 'adventure' | 'allBooks' | 'book' | 'family'

/** What the open sheet is about when it is about a book (so it can say what is missing and where to get the book). */
export interface UpsellContext {
  bookId: string
  kind: 'coloring'
  title: string
  /** How many pages (pictures) are free and how many there are, to say it in the sheet. */
  freePages: number
  totalPages: number
  /** Where the printed book can be bought, if the book has such a link. */
  shopLink?: string
}

export const PREMIUM_TEASER: boolean = import.meta.env.VITE_PREMIUM_TEASER === 'true'
export const PLUS_TEST: boolean = import.meta.env.VITE_PLUS_TEST === 'true'
const PREVIEW: boolean = import.meta.env.VITE_PREMIUM_PREVIEW === 'true'
const TEST_KEY = 'lk-plus-test-v1'

function readTest(): boolean {
  if (!PLUS_TEST) return false
  try {
    return localStorage.getItem(TEST_KEY) === '1'
  } catch {
    return false
  }
}

const owned = ref<PremiumFeature[]>([])
/** Books bought one by one (the ids of their store products, see `bookProductId`). */
const ownedBooks = ref<string[]>([])
/** True while the store says the person has an active subscription. */
const subscribed = ref(false)
/** The test switch of the test build: behave as a subscriber. */
const testPlus = ref(readTest())
const upsellContext = ref<UpsellContext | null>(null)
/** The feature the open sheet is about, `null` while the sheet is closed. */
const upsellFeature = ref<PremiumFeature | null>(null)

/** True when the person has LambKing Plus (or is allowed everything): the subscription, or the test switch. */
export function isPlus(): boolean {
  return PREVIEW || testPlus.value || subscribed.value
}

/** True when the user may use the feature right now. Free while nothing is for sale. */
export function hasFeature(feature: PremiumFeature): boolean {
  if (!PREMIUM_TEASER) return true
  return isPlus() || owned.value.includes(feature)
}

/** Replace what the user owns, e.g. after reading the store's receipt. */
export function setEntitlements(features: PremiumFeature[]) {
  owned.value = [...features]
}

/** Replace the books that were bought one by one (ids of their store products), e.g. after reading the store's receipt. */
export function setOwnedBooks(productIds: string[]) {
  ownedBooks.value = [...productIds]
}

/** The store says whether the subscription is active. */
export function setSubscribed(on: boolean) {
  subscribed.value = on
}

/** Switches Plus on or off in the test build (it does nothing in any other build). */
export function setTestPlus(on: boolean) {
  if (!PLUS_TEST) return
  testPlus.value = on
  try {
    localStorage.setItem(TEST_KEY, on ? '1' : '0')
  } catch {
    // no storage: the switch only lasts until the app is closed
  }
}

/** True when the whole of this book may be used: free while nothing is for sale, a subscriber, or bought. */
export function hasBook(bookId: string): boolean {
  return hasFeature('allBooks') || ownedBooks.value.includes(bookProductId(bookId)) || testBooks.value.includes(bookId)
}

const TEST_BOOKS_KEY = 'lk-books-test-v1'

function readTestBooks(): string[] {
  if (!PLUS_TEST) return []
  try {
    const list = JSON.parse(localStorage.getItem(TEST_BOOKS_KEY) ?? '[]') as unknown
    return Array.isArray(list) ? list.filter((b): b is string => typeof b === 'string') : []
  } catch {
    return []
  }
}

/** Digital books "bought" in the test build (ids of the books), kept on the device like the test switch. */
const testBooks = ref<string[]>(readTestBooks())

/**
 * True when this digital book (a picture book of the store) was bought. Plus does not give it: it is a purchase of its own, so it is not
 * `hasBook` (which a subscriber has for every coloring book). In the test build a purchase is only pretended (`setTestBook`).
 */
export function ownsBook(bookId: string): boolean {
  return ownedBooks.value.includes(bookProductId(bookId)) || testBooks.value.includes(bookId)
}

/** The test build pretends that a digital book was bought (or takes the purchase back); in any other build it does nothing. */
export function setTestBook(bookId: string, on: boolean) {
  if (!PLUS_TEST) return
  testBooks.value = on ? [...new Set([...testBooks.value, bookId])] : testBooks.value.filter((b) => b !== bookId)
  try {
    localStorage.setItem(TEST_BOOKS_KEY, JSON.stringify(testBooks.value))
  } catch {
    // no storage: the pretended purchase only lasts until the app is closed
  }
}

/** Open the "LambKing Plus" sheet for a locked feature (only when the teaser is on). */
export function showUpsell(feature: PremiumFeature, context?: UpsellContext) {
  if (!PREMIUM_TEASER) return
  upsellContext.value = context ?? null
  upsellFeature.value = feature
}

export default function usePremium() {
  return {
    upsellFeature,
    isOpen: computed(() => upsellFeature.value !== null),
    upsellContext,
    /** Reactive: true while the person has Plus (the page shows it). */
    plusOn: computed(() => isPlus()),
    closeUpsell: () => {
      upsellFeature.value = null
      upsellContext.value = null
    },
    hasFeature,
    hasBook,
    /** True while the person owns this digital book (reactive, so it can be used inside a computed). */
    ownsBook,
    setTestBook,
    setOwnedBooks,
    setSubscribed,
    setTestPlus,
    showUpsell,
    setEntitlements
  }
}
