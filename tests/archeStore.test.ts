import { describe, expect, it } from 'vitest'
import { START_BOOSTERS, add, earned, loadBoosters, pairsOnBoard, saveBoosters, spend, topUp } from '../src/utils/archeStore'

function mem(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set('lk-arche-v1', initial)
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

describe('the helpers of the ark game', () => {
  it('starts with two of each and remembers the stock', () => {
    const s = mem()
    expect(loadBoosters(s)).toEqual(START_BOOSTERS)
    saveBoosters({ hammer: 5, swap: 0, shuffle: 3 }, s)
    expect(loadBoosters(s)).toEqual({ hammer: 5, swap: 0, shuffle: 3 })
  })

  it('survives broken data and a storage that does not work', () => {
    expect(loadBoosters(mem('{not json'))).toEqual(START_BOOSTERS)
    expect(loadBoosters(mem('{"hammer":-4,"swap":"x","shuffle":2.9}'))).toEqual({ hammer: 0, swap: 2, shuffle: 2 })
    expect(loadBoosters(null)).toEqual(START_BOOSTERS)
    expect(() => saveBoosters(START_BOOSTERS, null)).not.toThrow()
    const failing = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') } }
    expect(loadBoosters(failing)).toEqual(START_BOOSTERS)
    expect(() => saveBoosters(START_BOOSTERS, failing)).not.toThrow()
  })

  it('puts the stock up to one of each at the start of a level', () => {
    expect(topUp({ hammer: 0, swap: 4, shuffle: 0 })).toEqual({ hammer: 1, swap: 4, shuffle: 1 })
  })

  it('gives one helper for every new star, the kind goes round', () => {
    expect(earned(0, 3, 0)).toEqual(['hammer', 'swap', 'shuffle'])
    expect(earned(1, 1, 0)).toEqual(['swap'])
    expect(earned(2, 3, 2)).toEqual(['swap'])
    expect(earned(4, 2, 2)).toEqual([])
    expect(earned(4, 1, 3)).toEqual([])
  })

  it('adds and spends', () => {
    const b = add({ hammer: 1, swap: 1, shuffle: 1 }, ['hammer', 'hammer', 'swap'])
    expect(b).toEqual({ hammer: 3, swap: 2, shuffle: 1 })
    expect(spend(b, 'hammer')).toEqual({ hammer: 2, swap: 2, shuffle: 1 })
    expect(spend({ hammer: 0, swap: 1, shuffle: 1 }, 'hammer')).toBeNull()
  })

  it('counts the pairs that are on board: one for every level won', () => {
    expect(pairsOnBoard([3, 0, 1, 2], 60)).toBe(3)
    expect(pairsOnBoard([], 60)).toBe(0)
    expect(pairsOnBoard([1, 1, 1], 2)).toBe(2)
  })
})
