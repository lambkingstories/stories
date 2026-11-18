/** `useExhibition`: hanging a finished picture up (first free place; when all are taken the newest goes to place 1) and taking it down. */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const stored = () => JSON.parse(localStorage.getItem('lk-exhibition-v1') ?? '[]') as (string | null)[]

async function fresh() {
  vi.resetModules()
  const { default: useExhibition } = await import('@/use/useExhibition')
  return useExhibition()
}

beforeEach(() => localStorage.clear())

describe('hanging a picture up', () => {
  it('uses the first free place and remembers it', async () => {
    const ex = await fresh()
    ex.hang('a')
    ex.hang('b')
    expect(stored()).toEqual(['a', 'b', null])
    expect(ex.isHung('b')).toBe(true)
    expect(ex.isHung('zzz')).toBe(false)
  })

  it('fills a gap that a taken-down picture left', async () => {
    const ex = await fresh()
    ex.fill(['a', 'b', 'c'])
    ex.unhang('b')
    expect(stored()).toEqual(['a', null, 'c'])
    ex.hang('d')
    expect(stored()).toEqual(['a', 'd', 'c'])
  })

  it('hangs a picture only once', async () => {
    const ex = await fresh()
    ex.hang('a')
    ex.hang('a')
    expect(stored()).toEqual(['a', null, null])
  })

  it('puts the newest in front when all places are taken, the others move on and the last one comes down', async () => {
    const ex = await fresh()
    ex.fill(['a', 'b', 'c'])
    ex.hang('d')
    expect(stored()).toEqual(['d', 'a', 'b'])
    expect(ex.isHung('c')).toBe(false)
  })

  it('does nothing for an empty id, and taking down a picture that does not hang changes nothing', async () => {
    const ex = await fresh()
    ex.hang('')
    ex.unhang('nobody')
    expect(stored()).toEqual([])
  })
})
