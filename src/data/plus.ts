/**
 * The offer of LambKing Plus as the page for parents shows it. Until the purchase is wired up (stage 2) these are only the words on
 * the page; then the price of the store (per country, in the local money) replaces them. The introductory price is a time-limited
 * offer that is switched on in App Store Connect / Play Console (the store charges it, not the app). The page only says so while the
 * offer runs: put the last day of the offer into `introUntil` (the same day as in the stores), and the sentence goes by itself.
 */
export const plusOffer = {
  /** Price per month and per year, as text. */
  month: '3,99 €',
  year: '29,99 €',
  /** The family plan: up to five people share it (Apple Family Sharing). */
  familyMonth: '9,99 €',
  familyYear: '69,99 €',
  /** The introductory price of the family plan for the first year, or `null` when there is none (same days as `introUntil`). */
  familyIntroPrice: '49,99 €' as string | null,
  /** A malbook bought once. */
  book: '1,99 €',
  /** The introductory price for the first year (a start offer), or `null` when there is none. */
  introPrice: '19,99 €' as string | null,
  /** The last day of the introductory offer as "YYYY-MM-DD" (the whole day counts), or `null` while it has no end date. */
  introUntil: null as string | null
}

/** True while the sentence about the introductory price is shown. */
export function introRuns(now: Date = new Date()): boolean {
  if (!plusOffer.introPrice) return false
  if (!plusOffer.introUntil) return true
  const end = new Date(`${plusOffer.introUntil}T23:59:59`)
  return now.getTime() <= end.getTime()
}
