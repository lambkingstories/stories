/**
 * Coloring books that ship inside the app, for testing on a device before they are in the backend. They only show up in builds
 * made with `VITE_LOCAL_TEST_BOOKS=true`; a store build leaves the flag out, the pictures are taken out of it (see the plugin
 * in `vite.config.ts`) and the app knows only the books of the backend.
 *
 * The books are the coloring books of the shop page lambking.store: the "Mit Buntstift durch die Bibel" books (5-8 years, Band 1, 2,
 * 3, 5 and 9) and the four books of "Bibelgeschichten zum Ausmalen" (9-12 years, German and English). Text, Bible passage and pictures
 * were read from their print PDFs by `D:/Claude/ausmalbuch-import/prepare_*.py` and copied in by `lokal-in-app.py`. A book is turned into the same shape the API
 * delivers (`kind: 'coloring'`, one picture per page), so the book pages, the reader and the coloring editor treat it like
 * any other book.
 */
import type { ApiBook } from '@/types/apiBook'
import { prependBaseUrl } from '@/utils/function'
import data from '@/data/ausmalbuecherTest.json'

export const LOCAL_TEST_BOOKS_ON: boolean = import.meta.env.VITE_LOCAL_TEST_BOOKS === 'true'

interface PageData {
  n: number
  title: string
  reference: string
  text: string
}

/** Data of the books added later (the first two books keep their texts in DESCRIPTIONS below). */
interface BookMeta {
  series: 'buntstift' | '912'
  volume: number
  releaseDate: string
  backendId: string
  short: string
  long: string
  titleEn?: string
  shortEn?: string
  longEn?: string
  amazonDe: string
  amazonEn: string
  badges: string[]
}

interface BookData {
  bookId: string
  title: string
  pages: PageData[]
  pagesEn?: PageData[]
  meta?: BookMeta
}

const SERIES = 'bibelgeschichten-zum-ausmalen'

/**
 * The id the same book has in the backend (`D:/Claude/ausmalbuch-import/import-baende.mjs`). As soon as the backend delivers
 * that book, the local test copy is left out so the book does not show up twice.
 */
const BACKEND_ID: Record<string, string> = {
  schoepfung: 'ba-02-gott-erschafft-die-welt',
  noah: 'ba-03-noah-die-arche-und-der-regenbogen'
}

/** The order in which the books are listed (folder names in `public/images/ausmalbuecher`). */
const ORDER = [
  'schoepfung',
  'noah',
  'abraham',
  'mose',
  'jesus-wunder',
  '912-schoepfung',
  '912-david',
  '912-weihnachten',
  '912-ostern'
] as const

/** Where the printed book is sold (from the shop page lambking.store). */
const AMAZON: Record<string, string> = {
  schoepfung: 'https://www.amazon.de/dp/B0HMX9J4Q9',
  noah: 'https://www.amazon.de/dp/B0HN1375XN'
}

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
  const meta = b.meta
  const coverEn = meta?.titleEn ? prependBaseUrl(`${base}cover-en.webp`) : cover
  const date = meta ? `${meta.releaseDate}T00:00:00.000Z` : `2026-10-${String(8 + volume).padStart(2, '0')}T00:00:00.000Z`
  const pageOf = (p: PageData) => ({
    page: p.n,
    title: p.title,
    image: prependBaseUrl(`${base}${String(p.n).padStart(2, '0')}.webp`),
    reference: p.reference,
    text: p.text
  })
  const short = meta ? meta.short : DESCRIPTIONS[folder]!.short
  const long = meta ? meta.long : DESCRIPTIONS[folder]!.long
  return {
    bookId: b.bookId,
    author: 'Anton Bernt',
    category: 'Ausmalbücher',
    kind: 'coloring',
    bookSeriesId: SERIES,
    releaseDate: date,
    updatedDate: date,
    badges: meta?.badges ?? ['ab 5 Jahren', 'Ausmalen'],
    previewImage: { de: cover, en: coverEn },
    coverImage: { de: cover, en: coverEn },
    etsyLink: { de: meta?.amazonDe ?? AMAZON[folder] ?? '', en: meta?.amazonEn ?? '' },
    attachments: [],
    localizations: {
      de: {
        title: b.title,
        shortDescription: short,
        description: long,
        content: b.pages.map(pageOf)
      },
      en:
        meta?.titleEn && b.pagesEn
          ? {
              title: meta.titleEn,
              shortDescription: meta.shortEn ?? '',
              description: meta.longEn ?? '',
              content: b.pagesEn.map(pageOf)
            }
          : null
    },
    isPublished: true
  }
}

/** The books that ship with this build (none unless the test flag is on). */
export function localColoringBooks(): ApiBook[] {
  if (!LOCAL_TEST_BOOKS_ON) return []
  const books = data as Record<string, BookData>
  return ORDER.filter((folder) => books[folder]).map((folder, i) => toBook(folder, books[folder]!, books[folder]!.meta?.volume ?? i + 1))
}

/** The ids of the local test books that the backend already has under its own id. */
export function localBookReplacedBy(bookId: string): string | undefined {
  const books = data as Record<string, BookData>
  const folder = Object.keys(books).find((k) => books[k]!.bookId === bookId)
  return folder ? (BACKEND_ID[folder] ?? books[folder]!.meta?.backendId) : undefined
}

/**
 * The local test books that are not in the given backend list yet. A book the backend has under its own id comes from the
 * backend only, so the test build never shows a coloring book twice.
 */
export function localColoringBooksMissingFrom(remote: readonly Pick<ApiBook, 'bookId'>[]): ApiBook[] {
  const ids = new Set(remote.map((b) => b.bookId))
  return localColoringBooks().filter((b) => {
    const replacement = localBookReplacedBy(b.bookId)
    return !(replacement && ids.has(replacement))
  })
}
