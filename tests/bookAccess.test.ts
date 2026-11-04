import { afterEach, describe, expect, it, vi } from 'vitest'

describe('free part of a book', () => {
  it('gives a coloring book its first two pictures', async () => {
    const { freePageCount } = await import('@/use/useBookAccess')
    expect(freePageCount('coloring', 36)).toBe(2)
    expect(freePageCount('coloring', 20)).toBe(2)
    expect(freePageCount('coloring', 2)).toBe(2)
    // a book can have its own number
    expect(freePageCount('coloring', 36, 8)).toBe(8)
    expect(freePageCount('coloring', 36, 0)).toBe(0)
    expect(freePageCount('coloring', 4, 8)).toBe(4)
    expect(freePageCount('coloring', 36, null)).toBe(2)
  })

  it('shows every story in full', async () => {
    const { freePageCount } = await import('@/use/useBookAccess')
    expect(freePageCount('story', 20)).toBe(20)
    expect(freePageCount('story', 1)).toBe(1)
  })

  it('shows nothing of an empty book', async () => {
    const { freePageCount } = await import('@/use/useBookAccess')
    expect(freePageCount('coloring', 0)).toBe(0)
    expect(freePageCount('story', 0)).toBe(0)
  })
})

describe('what a person may use', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    localStorage.clear()
  })

  async function load(env: Record<string, string> = {}) {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    const access = await import('@/use/useBookAccess')
    const premium = await import('@/use/usePremium')
    const adventure = await import('@/utils/adventureAccess')
    return { ...access, ...premium, ...adventure }
  }

  it('locks nothing while nothing is for sale', async () => {
    const m = await load()
    expect(m.allowedPages('lokal-abraham', 'coloring', 30)).toBe(30)
    expect(m.isStagePlusLocked('mose', 8)).toBe(false)
    expect(m.hasFeature('readAloud')).toBe(true)
    expect(m.hasFeature('colors')).toBe(true)
    expect(m.hasFeature('glitter')).toBe(true)
  })

  it('shows a coloring book in part, except Band 1, once Plus is shown', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    expect(m.allowedPages('lokal-abraham', 'coloring', 30)).toBe(2)
    expect(m.allowedPages('ba-02-gott-erschafft-die-welt', 'coloring', 30)).toBe(30)
    expect(m.allowedPages('ba-1-buntstift-schoepfung', 'coloring', 30)).toBe(30)
    expect(m.allowedPages('ba-11-schoepfung-gott-macht-die-welt', 'coloring', 30)).toBe(30)
    expect(m.allowedPages('lokal-912-schoepfung', 'coloring', 30)).toBe(30)
    expect(m.allowedPages('ba-12-david-und-goliath-mutig-mit-gott', 'coloring', 30)).toBe(2)
    // a story is never shown in part
    expect(m.allowedPages('some-story', 'story', 12)).toBe(12)
    expect(m.hasFeature('readAloud')).toBe(false)
    expect(m.hasFeature('colors')).toBe(false)
    expect(m.hasFeature('glitter')).toBe(false)
    expect(m.hasFeature('adventure')).toBe(false)
  })

  it('opens six adventures in full (Josef, Adam und Eva, Noah, Babel, Abraham, Jakob) and every stage of any other one is behind Plus', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    expect(m.FREE_JOURNEYS).toHaveLength(6)
    for (const id of ['josef', 'adam-eva', 'noah', 'babel', 'abraham', 'jakob']) expect([0, 5, 11].map((i) => m.isStagePlusLocked(id, i)), id).toEqual([false, false, false])
    for (const id of ['mose', 'jona', 'david']) expect([0, 1, 2, 3, 11].map((i) => m.isStagePlusLocked(id, i)), id).toEqual([true, true, true, true, true])
  })

  it('opens everything for a person with Plus (the test switch of the test build)', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true', VITE_PLUS_TEST: 'true' })
    expect(m.isPlus()).toBe(false)
    m.setTestPlus(true)
    expect(m.isPlus()).toBe(true)
    expect(m.allowedPages('lokal-abraham', 'coloring', 30)).toBe(30)
    expect(m.isStagePlusLocked('mose', 8)).toBe(false)
    expect(m.hasFeature('readAloud')).toBe(true)
    expect(m.hasFeature('colors')).toBe(true)
    expect(m.hasFeature('glitter')).toBe(true)
    // remembered on the device
    expect(localStorage.getItem('lk-plus-test-v1')).toBe('1')
    const again = await load({ VITE_PREMIUM_TEASER: 'true', VITE_PLUS_TEST: 'true' })
    expect(again.isPlus()).toBe(true)
  })

  it('has no switch in any build but the test build', async () => {
    const m = await load({ VITE_PREMIUM_TEASER: 'true' })
    m.setTestPlus(true)
    expect(m.isPlus()).toBe(false)
  })
})
