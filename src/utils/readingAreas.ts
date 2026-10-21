// "Lesen" has three areas: Stories (the stories of the app), Books (printed books that can be bought in the store) and
// Malbücher (the coloring books). Every book of the backend belongs to exactly one of them.
import { isColoringBook } from '@/utils/coloringBook'

export type ReadingArea = 'stories' | 'books' | 'coloring'

/** The series of the backend that holds single printed books ("Einzelne Bücher"); its books are shown in "Books". */
export const BOOKS_SERIES_ID = 'einzelne-bucher'

type AreaBook = { kind?: string | null; category?: string | null; bookSeriesId?: string | null }

export function readingAreaOf(book: AreaBook | null | undefined): ReadingArea {
  if (isColoringBook(book)) return 'coloring'
  if (book?.bookSeriesId === BOOKS_SERIES_ID) return 'books'
  return 'stories'
}

/** The books of a list that belong to one area, in list order. */
export function booksOfArea<T extends AreaBook>(list: readonly T[], area: ReadingArea): T[] {
  return list.filter((b) => readingAreaOf(b) === area)
}
