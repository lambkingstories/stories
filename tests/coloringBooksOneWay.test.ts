/**
 * The coloring books have one place: the list `app-coloring-books`. It belongs to "Malen", except when the door in "Lesen" opened it (`?from=read`, Anton 22.11.2026):
 * then the tab bar keeps "Lesen", also for a single book that is opened from that list.
 */
import { describe, expect, it } from 'vitest'
import { routeToNav } from '@/use/useAppNav'

describe('coloring books: one way', () => {
  it('belongs to Malen, like the painting screen and a single book', () => {
    expect(routeToNav('app-coloring-books')).toBe('malen')
    expect(routeToNav('app-coloring-book')).toBe('malen')
    expect(routeToNav('app-coloring')).toBe('malen')
  })

  it('keeps "Lesen" lit when the door in "Lesen" opened the list or a book of it', () => {
    expect(routeToNav('app-coloring-books', { from: 'read' })).toBe('series')
    expect(routeToNav('app-coloring-book', { from: 'read' })).toBe('series')
    // the painting screen itself is "Malen", also from there
    expect(routeToNav('app-coloring', { from: 'read' })).toBe('malen')
    // other ways in (the painting menu, the shelf) keep "Malen"
    expect(routeToNav('app-coloring-books', { from: 'shelf' })).toBe('malen')
    expect(routeToNav('app-coloring-books', {})).toBe('malen')
  })

  it('leaves the other reading places in Lesen', () => {
    for (const name of ['app-read', 'app-all-books', 'app-books', 'app-series', 'app-goodnight']) expect(routeToNav(name)).toBe('series')
  })
})
