/**
 * Where a printed book can be looked at and bought: the page of the book on lambking.store (Anton 10.11.2026; the app no longer sends
 * children and parents straight to Amazon). The address of a book page is made from the title of the book on the landing page, so it is
 * kept here as a fixed list: app book → name of its page. When a title changes on the landing page, the list is changed here too (the
 * agent for the landing page reports it). Every link out of the app goes through `openExternal`, which asks the parents first.
 *
 * The pages are German books; for the English app there is no link (the old link of the backend stays when there is one).
 */
export const STORE_BOOK_BASE = 'https://lambking.store/buch/'

/** App book (backend id or local id) → name of the page on lambking.store. */
export const BOOK_PAGES: Record<string, string> = {
  // coloring books "Bibelgeschichten zum Ausmalen" (ages 9–12) and "Mit Buntstift durch die Bibel" (ages 5–8), from the backend
  'ba-11-schoepfung-gott-macht-die-welt': 'die-schoepfung-gott-macht-die-welt',
  'ba-12-david-und-goliath-mutig-mit-gott': 'david-und-goliath-mutig-mit-gott',
  'ba-13-die-weihnachtsgeschichte-jesus-ist-geboren': 'die-weihnachtsgeschichte-jesus-ist-geboren',
  'ba-14-ostern-jesus-lebt': 'ostern-jesus-lebt',
  'ba-02-gott-erschafft-die-welt': 'gott-erschafft-die-welt',
  'ba-03-noah-die-arche-und-der-regenbogen': 'noah-die-arche-und-der-regenbogen',
  // the same books as they are kept in the app
  'lokal-schoepfung': 'gott-erschafft-die-welt',
  'lokal-noah': 'noah-die-arche-und-der-regenbogen',
  'lokal-abraham': 'abraham-unterwegs-mit-gottes-versprechen',
  'lokal-mose': 'mose-mit-gott-in-die-freiheit',
  'lokal-jesus-wunder': 'mit-jesus-unterwegs-wunder-und-begegnungen',
  'lokal-912-schoepfung': 'die-schoepfung-gott-macht-die-welt',
  'lokal-912-david': 'david-und-goliath-mutig-mit-gott',
  'lokal-912-weihnachten': 'die-weihnachtsgeschichte-jesus-ist-geboren',
  'lokal-912-ostern': 'ostern-jesus-lebt',
  // the printed books of the store shown under "Lesen → Bücher"
  'der-mann-im-baum-zachaeus': 'der-mann-im-baum-zachaeus-begegnet-jesus'
}

/**
 * The coloring book that goes with an adventure (the id of the adventure → name of the page). Only where there is one (E2: "Dazu gibt
 * es ein Malbuch").
 */
export const JOURNEY_BOOKS: Record<string, string> = {
  'adam-eva': 'gott-erschafft-die-welt',
  noah: 'noah-die-arche-und-der-regenbogen',
  abraham: 'abraham-unterwegs-mit-gottes-versprechen',
  josef: 'josef-gott-laesst-dich-nicht-allein',
  mose: 'mose-mit-gott-in-die-freiheit',
  david: 'david-und-goliath-mutig-mit-gott',
  weihnachten: 'die-weihnachtsgeschichte-jesus-ist-geboren',
  wunder: 'mit-jesus-unterwegs-wunder-und-begegnungen',
  ostern: 'ostern-jesus-lebt'
}

const pageUrl = (name: string) => `${STORE_BOOK_BASE}${name}/`

/** The page of a printed book on lambking.store; without a known page (or for English) the `fallback`, which may be empty. */
export function printedBookUrl(bookId: string | undefined, fallback = '', lang: 'de' | 'en' = 'de'): string {
  const name = bookId ? BOOK_PAGES[bookId] : undefined
  return name && lang === 'de' ? pageUrl(name) : fallback
}

/** The page of the coloring book that goes with an adventure, or `null` (and for English, because the pages are German). */
export function journeyBookUrl(journeyId: string | undefined, lang: 'de' | 'en' = 'de'): string | null {
  const name = journeyId ? JOURNEY_BOOKS[journeyId] : undefined
  return name && lang === 'de' ? pageUrl(name) : null
}
