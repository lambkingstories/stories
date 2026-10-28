/**
 * Books and series of the backend that the app does not show (not in the shelves, the coloring shelf, the search, "continue reading" or
 * by a link). The backend may still hold them, so the app leaves them out itself. To bring one back, take it out of the list below.
 *
 *  - "Buch 01 – Die Schöpfung der Welt": taken out by Anton on 21.10.2026.
 *  - the series "Gute Nacht Lilly" (`gute-nacht-lilly`): switched off for the time being by Anton on 24.10.2026.
 */
const HIDDEN_BOOK_IDS: ReadonlySet<string> = new Set(['ba-01-die-schoepfung-der-welt'])
const HIDDEN_SERIES_IDS: ReadonlySet<string> = new Set(['gute-nacht-lilly'])

export const isHiddenBook = (bookId: string): boolean => HIDDEN_BOOK_IDS.has(bookId)

export const isHiddenSeries = (seriesId: string | null | undefined): boolean => !!seriesId && HIDDEN_SERIES_IDS.has(seriesId)

/** True for a book that is hidden itself or belongs to a hidden series. */
export const isHiddenBookOrSeries = (book: { bookId: string; bookSeriesId?: string | null }): boolean =>
  isHiddenBook(book.bookId) || isHiddenSeries(book.bookSeriesId)
