import { afterEach, describe, expect, it, vi } from 'vitest'

/** What was painted on a locked page of a coloring book is kept but not shown (Anton 22.11.2026). */
describe('paintings on locked pages', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    localStorage.clear()
  })

  async function load(env: Record<string, string> = {}) {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    const access = await import('@/use/artworkAccess')
    const premium = await import('@/use/usePremium')
    return { ...access, ...premium }
  }

  const ostern = (bookPage?: number) => ({ bookId: 'ba-14-ostern-jesus-lebt', bookPage })

  it('hides nothing while nothing is for sale', async () => {
    const m = await load()
    expect(m.isArtworkLocked(ostern(5))).toBe(false)
  })

  it('hides a painting on a page after the free picture, and shows the free page and blank sheets', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    expect(m.isArtworkLocked(ostern(1))).toBe(false)
    expect(m.isArtworkLocked(ostern(2))).toBe(true)
    expect(m.isArtworkLocked(ostern(35))).toBe(true)
    // a blank sheet and a page that was not opened from a book have no book
    expect(m.isArtworkLocked({})).toBe(false)
    expect(m.visibleArtworks([{}, ostern(1), ostern(3)])).toEqual([{}, ostern(1)])
  })

  it('shows every page of the book that is free in full', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    expect(m.isArtworkLocked({ bookId: 'ba-02-gott-erschafft-die-welt', bookPage: 30 })).toBe(false)
  })

  it('shows the paintings again with Plus, and hides them again when Plus is off (nothing is deleted)', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true', VITE_PLUS_TEST: 'true' })
    const list = [ostern(1), ostern(4)]
    expect(m.visibleArtworks(list)).toHaveLength(1)
    m.setTestPlus(true)
    expect(m.visibleArtworks(list)).toHaveLength(2)
    m.setTestPlus(false)
    expect(m.visibleArtworks(list)).toHaveLength(1)
    expect(list).toHaveLength(2)
  })

  it('knows the own number of free pictures of a book', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    m.rememberFreePages('ba-14-ostern-jesus-lebt', 8)
    expect(m.isArtworkLocked(ostern(8))).toBe(false)
    expect(m.isArtworkLocked(ostern(9))).toBe(true)
    m.rememberFreePages('ba-14-ostern-jesus-lebt', null)
    expect(m.isArtworkLocked(ostern(2))).toBe(true)
  })
})
