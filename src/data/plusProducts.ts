/**
 * The products of LambKing Plus as they have to be created in the stores. The ids here and the ids in App Store Connect / Play Console
 * must be exactly the same, or the store answers "product not found".
 *
 * Apple: one subscription group "LambKing Plus" with four auto-renewable subscriptions (year, month, and the same two for the family, with
 * "Family Sharing" switched on for the two family ones), and one non-consumable in-app purchase per coloring book (`bookProductId`).
 * Product ids cannot be changed or used again after they were created, so they are short and plain (lowercase letters, digits and
 * underscores, which both stores accept).
 * Google: one subscription `lambking_plus` with four base plans (`jahr` = P1Y, `monat` = P1M, `familie-jahr` = P1Y, `familie-monat` = P1M),
 * and one managed product per coloring book.
 */
export const PLUS_PRODUCTS = {
  ios: {
    year: 'com.stories.lambking.plus.year',
    month: 'com.stories.lambking.plus.month',
    familyYear: 'com.stories.lambking.plus.familyyear',
    familyMonth: 'com.stories.lambking.plus.familymonth'
  },
  android: { subscription: 'lambking_plus', yearPlan: 'jahr', monthPlan: 'monat', familyYearPlan: 'familie-jahr', familyMonthPlan: 'familie-monat' }
} as const

/** The four plans: one person (year, month) and the family of up to five people (year, month). */
export type PlusPlan = 'year' | 'month' | 'familyYear' | 'familyMonth'

const BOOK_PREFIX = 'lambking_book_'

/**
 * The store product that unlocks one coloring book for good. A book of the backend carries its number in its id, and that number is what
 * the product is named after ("ba-03-noah-die-arche-und-der-regenbogen" → "lambking_book_ba_03"); any other id is used in full
 * ("lokal-abraham" → "lambking_book_lokal_abraham").
 */
export function bookProductId(bookId: string): string {
  const id = bookId.toLowerCase()
  const numbered = /^([a-z]{2})-(\d+)-/.exec(id)
  const name = numbered ? `${numbered[1]}_${numbered[2]}` : id.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return BOOK_PREFIX + name
}

export const isBookProduct = (productId: string): boolean => productId.startsWith(BOOK_PREFIX)

/** Where a person manages or cancels the subscription (the stores do that, not the app). */
export const MANAGE_URL = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions'
} as const

/** Apple's standard terms of use (the "EULA"), linked on the Plus page as Apple's review asks for. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
