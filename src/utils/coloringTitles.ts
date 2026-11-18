/**
 * The titles of the coloring books are long ("Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt", "Mit Buntstift durch die
 * Bibel: Noah, die Arche und der Regenbogen (Band 2)"), and they were cut off in the lists so that the name of the book could not be read.
 * Here a title is split into the series (a small heading over the group), the number of the volume and the name of the book itself, and the books are put
 * into the two age groups of the shelf ("Ab 5 Jahren" for the series 5 to 8, "Ab 9 Jahren" for the series 9 to 12). Nothing is made up: the parts are
 * the words of the title.
 */

export interface ColoringTitleParts {
  /** The series, e.g. "Mit Buntstift durch die Bibel" (empty when the title has no series part). */
  series: string
  /** The number of the volume (0 when there is none). */
  volume: number
  /** The name of the book itself: what a card shows as its title. */
  name: string
}

/** "Reihe: Band 3 - Name" (the series of ages 9 to 12); the word for "volume" in German, English and Spanish. */
const SERIES_FIRST = /^(.+?):\s*(?:Band|Volume|Vol\.|Tomo|Volumen)\s*(\d+)\s*[-–—]\s*(.+)$/i
/** "Reihe: Name (Band 3)" (the series of ages 5 to 8) */
const SERIES_LAST = /^(.+?):\s*(.+?)\s*\(\s*(?:Band|Volume|Vol\.|Tomo|Volumen)\s*(\d+)\s*\)\s*$/i
/** "Buch 01 – Name" (the first book) */
const OLD_BOOK = /^(?:Buch|Book|Libro)\s*\d+\s*[-–—]\s*(.+)$/i

export function splitColoringTitle(title: string): ColoringTitleParts {
  const s = (title ?? '').trim()
  let m = SERIES_FIRST.exec(s)
  if (m) return { series: m[1]!.trim(), volume: Number(m[2]), name: m[3]!.trim() }
  m = SERIES_LAST.exec(s)
  if (m) return { series: m[1]!.trim(), volume: Number(m[3]), name: m[2]!.trim() }
  m = OLD_BOOK.exec(s)
  if (m) return { series: '', volume: 0, name: m[1]!.trim() }
  return { series: '', volume: 0, name: s }
}

/** The title a card shows: the name of the book without series and volume. */
export function shortColoringTitle(title: string): string {
  return splitColoringTitle(title).name
}

export type ColoringAgeGroup = 'from5' | 'from9'

/**
 * The age group of a book: the badge "ab N Jahren" of the book says it ("ab 4", "ab 5", "ab 6" are the series of 5 to 8; "ab 9" and up the series of 9 to 12);
 * without such a badge the series of the title decides ("Bibelgeschichten zum Ausmalen" is the one for 9 and up).
 */
export function coloringAgeGroup(book: { badges?: string[] | null }, title = ''): ColoringAgeGroup {
  for (const b of book.badges ?? []) {
    const m = /(?:ab|from|ages?|desde)\s*(\d+)/i.exec(b)
    if (m) return Number(m[1]) >= 9 ? 'from9' : 'from5'
  }
  return /^Bibelgeschichten zum Ausmalen|^Bible Stories to Color|^Historias bíblicas para colorear/i.test(title.trim()) ? 'from9' : 'from5'
}

export interface TitledCard {
  bookId: string
  released: number
  group: ColoringAgeGroup
  parts: ColoringTitleParts
}

export interface ColoringSection<T extends TitledCard> {
  group: ColoringAgeGroup
  /** The series that the books of the section share (a small heading); empty when the books come from different series. */
  series: string
  cards: T[]
}

/**
 * The books in their sections: "Ab 5 Jahren" first, then "Ab 9 Jahren"; within a section the volumes rise (a book without a volume number by its date).
 * An empty section is left out.
 */
export function groupColoringBooks<T extends TitledCard>(cards: T[]): ColoringSection<T>[] {
  const out: ColoringSection<T>[] = []
  for (const group of ['from5', 'from9'] as const) {
    const list = cards
      .filter((c) => c.group === group)
      .sort((a, b) => {
        if (a.parts.series && a.parts.series === b.parts.series && a.parts.volume !== b.parts.volume) return a.parts.volume - b.parts.volume
        return a.released - b.released || a.bookId.localeCompare(b.bookId)
      })
    if (!list.length) continue
    // the heading is the series of the books that have one, when they all come from the same series
    const series = new Set(list.map((c) => c.parts.series).filter(Boolean))
    out.push({ group, series: series.size === 1 ? [...series][0]! : '', cards: list })
  }
  return out
}
