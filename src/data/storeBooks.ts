/**
 * Printed books of LambKing Stories that can be bought in the store (https://lambking.store). They are shown in "Lesen → Books"
 * as a pointer to the store: a picture, a short text and a button that leaves the app through `openExternal` (which asks the
 * parents first). The books are not read in the app. Books of the backend series "Einzelne Bücher" are shown there as well.
 */
export const STORE_URL = 'https://lambking.store'

export interface StoreBook {
  id: string
  /** The series the printed book belongs to; shown above the title. */
  series: string
  title: { de: string; en: string }
  text: { de: string; en: string }
  /** The cover, relative to the base of the app. */
  cover: string
  url: string
}

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
    url: STORE_URL
  }
]
