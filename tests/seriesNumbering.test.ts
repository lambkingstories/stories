/**
 * The titles of the Talheim series start with a number. The backend holds the 63 new stories (numbered 01-63, each in the book of the
 * old story it replaces) and still the 27 old books that became superfluous, which carry their old numbers: sorted by book id, a
 * number then stands twice in the list. The list numbers the titles again in its own order; the names stay as they are.
 */
import { describe, expect, it } from 'vitest'
import { displayTitles, hasDuplicateNumbers, titleNumber, titleWithoutNumber } from '@/utils/seriesNumbering'

describe('numbers at the start of a title', () => {
  it('reads and cuts the number', () => {
    expect(titleNumber('01 – Piek und die Umarmung mit Abstand')).toBe(1)
    expect(titleNumber('16 - Der Pfau')).toBe(16)
    expect(titleNumber('Der Pfau, der immer der Schönste sein wollte')).toBeNull()
    expect(titleNumber('1000 Sterne')).toBeNull()
    expect(titleWithoutNumber('07 – Benno und die Brücke für alle')).toBe('Benno und die Brücke für alle')
    expect(titleWithoutNumber('Ohne Zahl')).toBe('Ohne Zahl')
  })

  it('finds a number that stands twice', () => {
    expect(hasDuplicateNumbers(['01 – A', '02 – B', '03 – C'])).toBe(false)
    expect(hasDuplicateNumbers(['01 – A', '02 – B', '02 – C'])).toBe(true)
    expect(hasDuplicateNumbers(['A', 'B', 'C'])).toBe(false)
  })
})

describe('displayTitles', () => {
  it('leaves a list with good numbers untouched', () => {
    const titles = ['01 – Eins', '02 – Zwei', '03 – Drei']
    expect(displayTitles(titles)).toEqual(titles)
  })

  it('leaves titles without numbers untouched', () => {
    expect(displayTitles(['Adam und Eva', 'Noah'])).toEqual(['Adam und Eva', 'Noah'])
  })

  it('numbers a list again in its order when a number stands twice, and keeps every name', () => {
    // the real case: new "16 – Sento" (book tt-17) and the old "16 – Der Pfau" (book tt-16) side by side
    const titles = [
      '15 – Suses langer Winter',
      '16 – Der Pfau, der immer der Schönste sein wollte',
      '16 – Sento darf dazugehören',
      '17 – Greta bleibt',
      '19 – Die kleine Ameise',
      '18 – Pias langer Weg nach Hause'
    ]
    const shown = displayTitles(titles)
    expect(shown).toEqual([
      '01 – Suses langer Winter',
      '02 – Der Pfau, der immer der Schönste sein wollte',
      '03 – Sento darf dazugehören',
      '04 – Greta bleibt',
      '05 – Die kleine Ameise',
      '06 – Pias langer Weg nach Hause'
    ])
    expect(hasDuplicateNumbers(shown)).toBe(false)
    // names never change
    for (let i = 0; i < titles.length; i++) expect(titleWithoutNumber(shown[i]!)).toBe(titleWithoutNumber(titles[i]!))
  })

  it('numbers 90 books (63 new and 27 old) from 01 to 90 without a gap or a double', () => {
    const titles: string[] = []
    for (let i = 1; i <= 63; i++) titles.push(`${String(i).padStart(2, '0')} – Neu ${i}`)
    for (let n = 1; n <= 27; n++) titles.push(`${n + 15} – Alt ${n}`)
    expect(hasDuplicateNumbers(titles)).toBe(true)
    const shown = displayTitles(titles)
    expect(hasDuplicateNumbers(shown)).toBe(false)
    expect(shown.map((t) => titleNumber(t))).toEqual(titles.map((_, i) => i + 1))
  })

  it('keeps a title without a number as it is and counts it in the place of the list', () => {
    expect(displayTitles(['01 – A', 'Zwischentitel', '01 – B'])).toEqual(['01 – A', 'Zwischentitel', '03 – B'])
  })

  it('uses three digits for a list of a hundred or more', () => {
    const titles = Array.from({ length: 100 }, (_, i) => `${(i % 50) + 1} – T${i}`)
    expect(displayTitles(titles)[99]).toBe('100 – T99')
    expect(displayTitles(titles)[0]).toBe('001 – T0')
  })
})
