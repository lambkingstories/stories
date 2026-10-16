/**
 * Coloring books that ship inside the app, for testing on a device before they are in the backend. They only show up in builds
 * made with `VITE_LOCAL_TEST_BOOKS=true`; a store build leaves the flag out, the pictures are taken out of it (see the plugin
 * in `vite.config.ts`) and the app knows only the books of the backend.
 *
 * The two books are the finished "Mit Buntstift durch die Bibel" books (Band 1 and 2). Text, Bible passage and pictures were
 * read from their print PDFs by `D:/Claude/ausmalbuch-import/prepare_books.py`. A book is turned into the same shape the API
 * delivers (`kind: 'coloring'`, one picture per page), so the book pages, the reader and the coloring editor treat it like
 * any other book.
 */
import type { ApiBook } from '@/types/apiBook'
import { prependBaseUrl } from '@/utils/function'
import data from '@/data/ausmalbuecherTest.json'

export const LOCAL_TEST_BOOKS_ON: boolean = import.meta.env.VITE_LOCAL_TEST_BOOKS === 'true'

interface BookData {
  bookId: string
  title: string
  pages: { n: number; title: string; reference: string; text: string }[]
}

const SERIES = 'bibelgeschichten-zum-ausmalen'

const DESCRIPTIONS: Record<string, { short: string; long: string }> = {
  schoepfung: {
    short: '36 Bilder zum Ausmalen: Gott erschafft die Welt, vom ersten Licht bis zum Garten Eden.',
    long: 'Mit Buntstift durch die Bibel, Band 1. Zu jedem Bild gibt es einen kurzen Text aus der Schöpfungsgeschichte mit der Bibelstelle. Für Kinder von 5 bis 8 Jahren.'
  },
  noah: {
    short: '40 Bilder zum Ausmalen: Noah, die Arche und der Regenbogen.',
    long: 'Mit Buntstift durch die Bibel, Band 2. Zu jedem Bild gibt es einen kurzen Text aus der Geschichte von Noah mit der Bibelstelle. Für Kinder von 5 bis 8 Jahren.'
  }
}

function toBook(folder: string, b: BookData, volume: number): ApiBook {
  const base = `images/ausmalbuecher/${folder}/`
  const cover = prependBaseUrl(`${base}cover.webp`)
  const date = `2026-10-${String(8 + volume).padStart(2, '0')}T00:00:00.000Z`
  return {
    bookId: b.bookId,
    author: 'Anton Bernt',
    category: 'Ausmalbücher',
    kind: 'coloring',
    bookSeriesId: SERIES,
    releaseDate: date,
    updatedDate: date,
    badges: ['ab 5 Jahren', 'Ausmalen'],
    previewImage: { de: cover, en: cover },
    coverImage: { de: cover, en: cover },
    attachments: [],
    localizations: {
      de: {
        title: b.title,
        shortDescription: DESCRIPTIONS[folder]!.short,
        description: DESCRIPTIONS[folder]!.long,
        content: b.pages.map((p) => ({
          page: p.n,
          title: p.title,
          image: prependBaseUrl(`${base}${String(p.n).padStart(2, '0')}.webp`),
          reference: p.reference,
          text: p.text
        }))
      },
      en: null
    },
    isPublished: true
  }
}

/** The books that ship with this build (none unless the test flag is on). */
export function localColoringBooks(): ApiBook[] {
  if (!LOCAL_TEST_BOOKS_ON) return []
  const books = data as Record<string, BookData>
  return [toBook('schoepfung', books.schoepfung!, 1), toBook('noah', books.noah!, 2)]
}
