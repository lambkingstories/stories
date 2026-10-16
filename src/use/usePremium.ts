/**
 * Premium ("LambKing Plus") switchboard. Everything that will sit behind the
 * monthly subscription asks this file, so turning the subscription on later is
 * one change here and not a hunt through the views.
 *
 * Planned features (add a key here, then guard the feature with `hasFeature`):
 *   - `pencilBox`: the big pencil box in the coloring app (more colours)
 *   - `paintBoxes`: the watercolour and oil paint boxes in the coloring app
 *   - `readAloud`: the stories read aloud
 *   - `allBooks`: every book in full (the subscription). Without it a book shows only its start
 *     (see `useBookAccess`), unless that single book was bought.
 *   - `book`: one book bought once (only used to word the sheet; what is owned is `ownedBooks`)
 *
 * Today nothing is for sale, so by default every feature is free and no lock is
 * shown. Two build flags change that without touching code:
 *   - `VITE_PREMIUM_TEASER=true`: lock the premium features and show a small
 *     "coming soon / LambKing Plus" sheet when a locked item is tapped.
 *   - `VITE_PREMIUM_PREVIEW=true`: behave as a subscriber (to test the unlocked UI).
 *
 * The purchase itself (StoreKit on iOS, Play Billing on Android) is NOT wired up
 * yet. When it is, call `setEntitlements()` with what the store says the user
 * owns, and put the purchase button in `PremiumSheet.vue` behind the parental
 * gate (`requireParent()`).
 */
import { computed, ref } from 'vue'

export type PremiumFeature = 'pencilBox' | 'paintBoxes' | 'readAloud' | 'allBooks' | 'book'

/** What the open sheet is about when it is about a book (so it can say what is missing and where to get the book). */
export interface UpsellContext {
  bookId: string
  kind: 'story' | 'coloring'
  title: string
  /** How many pages (pictures) are free and how many there are, to say it in the sheet. */
  freePages: number
  totalPages: number
  /** Where the printed book can be bought, if the book has such a link. */
  shopLink?: string
}

export const PREMIUM_TEASER: boolean = import.meta.env.VITE_PREMIUM_TEASER === 'true'
const PREVIEW: boolean = import.meta.env.VITE_PREMIUM_PREVIEW === 'true'

const owned = ref<PremiumFeature[]>([])
/** Books bought one by one (ids). */
const ownedBooks = ref<string[]>([])
const upsellContext = ref<UpsellContext | null>(null)
/** The feature the open sheet is about, `null` while the sheet is closed. */
const upsellFeature = ref<PremiumFeature | null>(null)

/** True when the user may use the feature right now. Free while nothing is for sale. */
export function hasFeature(feature: PremiumFeature): boolean {
  if (!PREMIUM_TEASER) return true
  return PREVIEW || owned.value.includes(feature)
}

/** Replace what the user owns, e.g. after reading the store's receipt. */
export function setEntitlements(features: PremiumFeature[]) {
  owned.value = [...features]
}

/** Replace the books that were bought one by one, e.g. after reading the store's receipt. */
export function setOwnedBooks(ids: string[]) {
  ownedBooks.value = [...ids]
}

/** True when the whole of this book may be used: free while nothing is for sale, a subscriber, or bought. */
export function hasBook(bookId: string): boolean {
  return hasFeature('allBooks') || ownedBooks.value.includes(bookId)
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
    closeUpsell: () => {
      upsellFeature.value = null
      upsellContext.value = null
    },
    hasFeature,
    hasBook,
    setOwnedBooks,
    showUpsell,
    setEntitlements
  }
}
