/**
 * Printed books of LambKing Stories that can be bought in the store (https://lambking.store). They are shown in "Lesen → Books"
 * as a pointer to the store: a picture, a short text, a look inside (the preview) and a button that leaves the app through
 * `openExternal` (which asks the parents first). The books are not read in the app. A book that is not in the store yet is marked
 * "coming soon": it shows only the preview, and the last page of the preview says that it comes soon. Books of the backend series
 * "Einzelne Bücher" are shown there as well.
 */
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
  title: { de: string; en: string }
  text: { de: string; en: string }
  /** The cover, relative to the base of the app, and its width divided by its height (a square one is 1). */
  cover: string
  coverRatio?: number
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

/** The books that can be bought digitally in the app. */
export const digitalBooks = (): StoreBook[] => storeBooks.filter((b) => !!b.digital)

export const storeBooks: StoreBook[] = [
  {
    id: 'der-mann-im-baum-zachaeus',
    series: 'Der Mann im Baum',
    title: { de: 'Zachäus begegnet Jesus', en: 'Zacchaeus meets Jesus' },
    text: {
      de: 'Ein Bilderbuch über Zachäus in Jericho. Jesus sieht jeden einzelnen Menschen, und seine Liebe kann jedes Herz verändern. Mit einem QR-Code zum Geschichts-Song.',
      en: 'A picture book about Zacchaeus in Jericho. Jesus sees every single person, and his love can change every heart. With a QR code for the story song.'
    },
    cover: 'images/buecher/zachaeus-cover.webp',
    url: STORE_URL,
    // five sample pages (the sixth of the landing page is left out, so that the end of the story stays a surprise); with the cover and
    // the page about buying the preview has seven pages
    preview: { pages: [1, 2, 3, 4, 5].map((n) => ({ src: `images/buecher/zachaeus-vorschau/seite-${n}.webp`, ratio: 1 })) },
    // the whole book: 29 pages (the cover first); the price of the store replaces this one on the phone
    digital: { price: '2,99 €', pages: digitalPages('images/buecher/zachaeus-voll-k7q2', 29), pdf: 'downloads/Der-Mann-im-Baum-Zachaeus-begegnet-Jesus-k7q2.pdf' }
  },
  {
    id: 'voelker-der-bibel-band-1',
    series: 'LambKing Books',
    // the title of the book stays German
    title: { de: 'Völker der Bibel – Band 1', en: 'Völker der Bibel – Band 1' },
    text: {
      de: 'Eine Zeitreise zu den ersten Zivilisationen: ein Bildsachbuch über die Ägypter, Kanaaniter, Philister, Israel und die Aramäer, mit großen Bildern, Karten, Zeitstrahl, Glossar und Quiz. Bibelstellen nach der Lutherbibel von 1912.',
      en: 'A time journey to the first civilisations: an illustrated non-fiction book about the Egyptians, Canaanites, Philistines, Israel and the Arameans, with large pictures, maps, a timeline, a glossary and a quiz. In German.'
    },
    cover: 'images/buecher/voelker-der-bibel/cover.webp',
    coverRatio: 0.75,
    url: STORE_URL,
    comingSoon: true,
    // two single pages and double pages of the book: the land of the pharaohs, a warrior, the Red Sea, David and Goliath, Sinai, the ark
    preview: {
      pages: [
        { src: 'images/buecher/voelker-der-bibel/seite-1.webp', ratio: 1.5009 },
        { src: 'images/buecher/voelker-der-bibel/seite-2.webp', ratio: 0.7496 },
        { src: 'images/buecher/voelker-der-bibel/seite-3.webp', ratio: 1.5009 },
        { src: 'images/buecher/voelker-der-bibel/seite-4.webp', ratio: 1.5009 },
        { src: 'images/buecher/voelker-der-bibel/seite-5.webp', ratio: 1.5009 },
        { src: 'images/buecher/voelker-der-bibel/seite-6.webp', ratio: 1.5009 }
      ]
    }
  }
]
