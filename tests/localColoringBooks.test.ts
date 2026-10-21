import { afterEach, describe, expect, it, vi } from 'vitest'

// the flag is read when the module is loaded, so each test loads a fresh copy with the flag it needs
async function load(flag: 'true' | 'false') {
  vi.resetModules()
  vi.stubEnv('VITE_LOCAL_TEST_BOOKS', flag)
  return import('@/data/localColoringBooks')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const ALL_IDS = [
  'ba-1-buntstift-schoepfung',
  'ba-2-buntstift-noah',
  'lokal-abraham',
  'lokal-mose',
  'lokal-jesus-wunder',
  'lokal-912-schoepfung',
  'lokal-912-david',
  'lokal-912-weihnachten',
  'lokal-912-ostern'
]

describe('local test coloring books and the backend', () => {
  it('has no local books at all without the test flag', async () => {
    const m = await load('false')
    expect(m.localColoringBooks()).toEqual([])
    expect(m.localColoringBooksMissingFrom([])).toEqual([])
  })

  it('shows all nine local books while the backend does not have them', async () => {
    const m = await load('true')
    const local = m.localColoringBooks()
    expect(local.map((b) => b.bookId)).toEqual(ALL_IDS)
    expect(m.localColoringBooksMissingFrom([{ bookId: 'ba-01-die-schoepfung-der-welt' }]).map((b) => b.bookId)).toEqual(
      local.map((b) => b.bookId)
    )
  })

  it('leaves a local book out as soon as the backend has the same book under its own id', async () => {
    const m = await load('true')
    expect(m.localBookReplacedBy('ba-1-buntstift-schoepfung')).toBe('ba-02-gott-erschafft-die-welt')
    expect(m.localBookReplacedBy('ba-2-buntstift-noah')).toBe('ba-03-noah-die-arche-und-der-regenbogen')
    const onlyBand1 = m.localColoringBooksMissingFrom([{ bookId: 'ba-02-gott-erschafft-die-welt' }])
    expect(onlyBand1.map((b) => b.bookId)).toEqual(ALL_IDS.slice(1))
    const firstTwo = m.localColoringBooksMissingFrom([
      { bookId: 'ba-02-gott-erschafft-die-welt' },
      { bookId: 'ba-03-noah-die-arche-und-der-regenbogen' }
    ])
    expect(firstTwo.map((b) => b.bookId)).toEqual(ALL_IDS.slice(2))
    // every local book has its backend id, so none shows up twice once the backend has all of them
    const backendIds = ALL_IDS.map((id) => m.localBookReplacedBy(id))
    expect(backendIds.every(Boolean)).toBe(true)
    expect(m.localColoringBooksMissingFrom(backendIds.map((bookId) => ({ bookId: bookId! })))).toEqual([])
  })

  it('gives the new books their pictures, text, Amazon link and (for 9-12) an English version', async () => {
    const m = await load('true')
    const byId = Object.fromEntries(m.localColoringBooks().map((b) => [b.bookId, b]))
    for (const id of ALL_IDS) {
      const b = byId[id]!
      expect(b.localizations.de?.content.length).toBeGreaterThan(20)
      expect(b.localizations.de?.content.every((p) => p.image && p.text && p.reference)).toBe(true)
      expect(b.etsyLink.de).toMatch(/^https:\/\/www\.amazon\.de\/dp\/B0/)
    }
    expect(byId['lokal-abraham']!.localizations.de?.content).toHaveLength(34)
    expect(byId['lokal-mose']!.localizations.de?.content).toHaveLength(34)
    expect(byId['lokal-jesus-wunder']!.localizations.de?.content).toHaveLength(44)
    expect(byId['lokal-912-weihnachten']!.localizations.en?.content).toHaveLength(30)
    expect(byId['lokal-912-weihnachten']!.etsyLink.en).toBe('https://www.amazon.com/dp/B0HK8R5V3S')
    expect(byId['lokal-abraham']!.localizations.en).toBeNull()
  })

  it('knows no replacement for an id that is not a local test book', async () => {
    const m = await load('true')
    expect(m.localBookReplacedBy('ba-02-gott-erschafft-die-welt')).toBeUndefined()
  })
})
