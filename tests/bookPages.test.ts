import { describe, expect, it } from 'vitest'
import { BOOK_PAGES, JOURNEY_BOOKS, journeyBookUrl, printedBookUrl } from '@/data/bookPages'
import { TIMELINE } from '@/data/adventures/timeline'

describe('printed books on lambking.store', () => {
  it('a book with a page leads to it (German), anything else keeps the old link', () => {
    expect(printedBookUrl('ba-14-ostern-jesus-lebt')).toBe('https://lambking.store/buch/ostern-jesus-lebt/')
    expect(printedBookUrl('lokal-912-david', 'https://alt')).toBe('https://lambking.store/buch/david-und-goliath-mutig-mit-gott/')
    expect(printedBookUrl('unbekannt', 'https://alt')).toBe('https://alt')
    expect(printedBookUrl(undefined)).toBe('')
    // the pages are German books: the English app keeps what it had
    expect(printedBookUrl('ba-14-ostern-jesus-lebt', 'https://alt', 'en')).toBe('https://alt')
  })

  it('every name is a plain page name, and every coloring book of an adventure is a real adventure', () => {
    const ids = new Set(TIMELINE.map((e) => e.id))
    for (const name of [...Object.values(BOOK_PAGES), ...Object.values(JOURNEY_BOOKS)]) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    for (const id of Object.keys(JOURNEY_BOOKS)) expect(ids.has(id), id).toBe(true)
    expect(journeyBookUrl('noah')).toBe('https://lambking.store/buch/noah-die-arche-und-der-regenbogen/')
    expect(journeyBookUrl('babel')).toBeNull()
    expect(journeyBookUrl('noah', 'en')).toBeNull()
  })
})
