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

describe('local test coloring books and the backend', () => {
  it('has no local books at all without the test flag', async () => {
    const m = await load('false')
    expect(m.localColoringBooks()).toEqual([])
    expect(m.localColoringBooksMissingFrom([])).toEqual([])
  })

  it('shows both local books while the backend does not have them', async () => {
    const m = await load('true')
    const local = m.localColoringBooks()
    expect(local.map((b) => b.bookId)).toEqual(['ba-1-buntstift-schoepfung', 'ba-2-buntstift-noah'])
    expect(m.localColoringBooksMissingFrom([{ bookId: 'ba-01-die-schoepfung-der-welt' }]).map((b) => b.bookId)).toEqual(
      local.map((b) => b.bookId)
    )
  })

  it('leaves a local book out as soon as the backend has the same book under its own id', async () => {
    const m = await load('true')
    expect(m.localBookReplacedBy('ba-1-buntstift-schoepfung')).toBe('ba-02-gott-erschafft-die-welt')
    expect(m.localBookReplacedBy('ba-2-buntstift-noah')).toBe('ba-03-noah-die-arche-und-der-regenbogen')
    const onlyBand1 = m.localColoringBooksMissingFrom([{ bookId: 'ba-02-gott-erschafft-die-welt' }])
    expect(onlyBand1.map((b) => b.bookId)).toEqual(['ba-2-buntstift-noah'])
    const both = m.localColoringBooksMissingFrom([
      { bookId: 'ba-02-gott-erschafft-die-welt' },
      { bookId: 'ba-03-noah-die-arche-und-der-regenbogen' }
    ])
    expect(both).toEqual([])
  })

  it('knows no replacement for an id that is not a local test book', async () => {
    const m = await load('true')
    expect(m.localBookReplacedBy('ba-02-gott-erschafft-die-welt')).toBeUndefined()
  })
})
