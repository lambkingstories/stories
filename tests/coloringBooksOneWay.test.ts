/**
 * The coloring books have one place: the list `app-coloring-books` belongs to "Malen". The door in "Lesen" leads there, and so do the
 * buttons of the painting menu and of the feature list; wherever it is opened from, the tab bar shows "Malen".
 */
import { describe, expect, it } from 'vitest'
import { routeToNav } from '@/use/useAppNav'

describe('coloring books: one way', () => {
  it('belongs to Malen, like the painting screen and a single book', () => {
    expect(routeToNav('app-coloring-books')).toBe('malen')
    expect(routeToNav('app-coloring-book')).toBe('malen')
    expect(routeToNav('app-coloring')).toBe('malen')
  })

  it('leaves the other reading places in Lesen', () => {
    for (const name of ['app-read', 'app-all-books', 'app-books', 'app-series', 'app-goodnight']) expect(routeToNav(name)).toBe('series')
  })
})
