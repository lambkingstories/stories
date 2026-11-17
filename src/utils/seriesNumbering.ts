/**
 * The titles of many series start with a number ("01 – Piek und die Umarmung …"). The number is part of the title in the backend.
 * When a series list holds two books with the same number (for example when a new version of a story replaced one book but the
 * older, now superfluous books are still published), a child sees "16" twice and the order looks broken. This helper numbers the
 * titles of such a list again, in the order of the list; the names themselves stay as they are. A list whose numbers are fine is
 * left untouched.
 */

/** A leading number with a dash after it ("01 – ", "7 - "). */
const NUMBER_PREFIX = /^\s*(\d{1,3})\s*[–—-]\s*/

/** The number a title starts with, or `null` when it has none. */
export function titleNumber(title: string): number | null {
  const m = NUMBER_PREFIX.exec(title)
  return m ? Number(m[1]) : null
}

/** The title without its leading number. */
export function titleWithoutNumber(title: string): string {
  return title.replace(NUMBER_PREFIX, '')
}

/** True when two titles of the list start with the same number. */
export function hasDuplicateNumbers(titles: readonly string[]): boolean {
  const seen = new Set<number>()
  for (const t of titles) {
    const n = titleNumber(t)
    if (n === null) continue
    if (seen.has(n)) return true
    seen.add(n)
  }
  return false
}

/**
 * The titles as they are shown, for the list in its order: unchanged when no number appears twice, otherwise the number of every
 * numbered title is its place in the list (two digits at least, "01 – …").
 */
export function displayTitles(titles: readonly string[]): string[] {
  if (!hasDuplicateNumbers(titles)) return [...titles]
  const width = Math.max(2, String(titles.length).length)
  return titles.map((t, i) => (titleNumber(t) === null ? t : `${String(i + 1).padStart(width, '0')} – ${titleWithoutNumber(t)}`))
}
