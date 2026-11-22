/**
 * Printed books of LambKing Stories that can be bought in the store (https://lambking.store). They are shown in "Lesen → Books"
 * as a pointer to the store: a picture, a short text, a look inside (the preview) and a button that leaves the app through
 * `openExternal` (which asks the parents first). The books are not read in the app. A book that is not in the store yet is marked
 * "coming soon": it shows only the preview, and the last page of the preview says that it comes soon. Books of the backend series
 * "Einzelne Bücher" are shown there as well. (The coming-soon preview of "Völker der Bibel" was taken out again on 22.11.2026.)
 */
import { printedBookUrl } from '@/data/bookPages'

export const STORE_URL = 'https://lambking.store'

/** One picture of a preview; `ratio` is its width divided by its height (a double page is 1.5, a single page 0.75). */
export interface PreviewPage {
  src: string
  ratio: number
}

export interface StoreBook {
  id: string
  /** The series the printed book belongs to; shown above the title. */
  series: string
  /** The name of the series in English (shown in the English app instead of `series`). */
  seriesEn?: string
  title: { de: string; en: string }
  text: { de: string; en: string }
  /** The cover, relative to the base of the app, and its width divided by its height (a square one is 1). */
  cover: string
  coverRatio?: number
  /**
   * The English edition (Anton 22.11.2026: in English everything must be English, the cover too, and a book that is not English is not shown): the cover of the English
   * edition and its shape. A book without it is not an English book yet and does not appear in the English shelf.
   */
  coverEn?: string
  coverRatioEn?: number
  /** A look inside and the whole book for the English edition (the pictures of the book itself are in the language of the book). Until they are there, the English card has only the store button. */
  previewEn?: { pages: PreviewPage[] }
  digitalEn?: { price: string; pages: PreviewPage[]; pdf: string }
  url: string
  /** The book is announced but not for sale yet: "coming soon" instead of the store button. */
  comingSoon?: boolean
  /** A look inside: the cover, then these pictures; the last page says that the book can be bought (or that it comes soon). */
  preview?: { pages: PreviewPage[] }
  /**
   * The book can also be bought as a digital book in the app (one purchase of the store, product `bookProductId(id)`): all pages are read in the app,
   * and the whole book can be downloaded as a PDF. `price` is shown until the store has answered with its own price. The pages and the file lie
   * in folders with a code in their name (they are not listed anywhere; the purchase decides who is shown the way there).
   */
  digital?: { price: string; pages: PreviewPage[]; pdf: string }
}

/** A digital book of the store whose pages are numbered `seite-01.webp` … in a folder. */
const digitalPages = (folder: string, count: number): PreviewPage[] => Array.from({ length: count }, (_, i) => ({ src: `${folder}/seite-${String(i + 1).padStart(2, '0')}.webp`, ratio: 1 }))

/** True when the book exists in this language (a book is German always; it is English when it has an English cover and an English title). */
export const storeBookIn = (b: StoreBook, lang: 'de' | 'en'): boolean => lang === 'de' || (!!b.coverEn && !!b.title.en)

/** The books that can be bought digitally in the app. */
export const digitalBooks = (): StoreBook[] => storeBooks.filter((b) => !!b.digital)

export const storeBooks: StoreBook[] = [
  {
    id: 'der-mann-im-baum-zachaeus',
    series: 'Der Mann im Baum',
    seriesEn: 'The Man in the Tree',
    title: { de: 'Zachäus begegnet Jesus', en: 'Zacchaeus meets Jesus' },
    text: {
      de: 'Ein Bilderbuch über Zachäus in Jericho. Jesus sieht jeden einzelnen Menschen, und seine Liebe kann jedes Herz verändern. Mit einem QR-Code zum Geschichts-Song.',
      en: 'A picture book about Zacchaeus in Jericho. Jesus sees every single person, and his love can change every heart. With a QR code for the story song.'
    },
    cover: 'images/buecher/zachaeus-cover.webp',
    // the English edition: "The Man in the Tree – Zacchaeus meets Jesus!" (the front cover; the pages of the English book are not in the app yet)
    coverEn: 'images/buecher/zachaeus-cover-en.webp',
    url: printedBookUrl('der-mann-im-baum-zachaeus', STORE_URL),
    // five sample pages (the sixth of the landing page is left out, so that the end of the story stays a surprise); with the cover and
    // the page about buying the preview has seven pages
    preview: { pages: [1, 2, 3, 4, 5].map((n) => ({ src: `images/buecher/zachaeus-vorschau/seite-${n}.webp`, ratio: 1 })) },
    // the whole book: 29 pages (the cover first); the price of the store replaces this one on the phone
    digital: { price: '2,99 €', pages: digitalPages('images/buecher/zachaeus-voll-k7q2', 29), pdf: 'downloads/Der-Mann-im-Baum-Zachaeus-begegnet-Jesus-k7q2.pdf' }
  }
]
