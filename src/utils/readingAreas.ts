// "Lesen" has three areas: Stories (the stories of the app), Books (printed books that can be bought in the store) and Malbücher (the
// coloring books). Every book belongs to exactly one.
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

/**
 * Where a book of the list "New for you" leads (Anton 22.11.2026): into the area where the book was put, to the place where it can be used. A coloring book opens in the area
 * of the coloring books, on its own page (paint, read, buy); a printed book opens in "Books", at its card (read, buy); a story opens on its page of the stories.
 */
export function bookDestination(book: (AreaBook & { bookId: string }) | null | undefined, bookId?: string) {
  const id = book?.bookId ?? bookId ?? ''
  switch (readingAreaOf(book)) {
    case 'coloring':
      return { name: 'app-coloring-book', params: { bookId: id } }
    case 'books':
      return { name: 'app-books', query: { book: id } }
    default:
      return { name: 'app-book', params: { bookId: id } }
  }
}
