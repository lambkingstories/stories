import { describe, expect, it } from 'vitest'
import { PAINT_TOOLS, awardProgress, newlyEarned, type AwardStats } from '@/utils/awards'

const none: AwardStats = { finishedPictures: 0, finishedBooks: 0, toolsUsed: [], paintDays: 0, booksRead: 0 }

describe('awards', () => {
  it('starts with nothing earned', () => {
    expect(awardProgress(none).every((a) => !a.earned && a.done === 0)).toBe(true)
  })

  it('earns the picture awards step by step and never shows more than the goal', () => {
    const p = (n: number) => awardProgress({ ...none, finishedPictures: n })
    expect(p(1).filter((a) => a.earned).map((a) => a.id)).toEqual(['first-picture'])
    expect(p(5).filter((a) => a.earned).map((a) => a.id)).toEqual(['first-picture', 'five-pictures'])
    const twenty = p(99).find((a) => a.id === 'twenty-pictures')!
    expect(twenty.done).toBe(20)
    expect(twenty.earned).toBe(true)
  })

  it('needs all six tools for "all tools", and both brush boxes for the brush artist', () => {
    const some = awardProgress({ ...none, toolsUsed: ['pencil', 'felt', 'oil'] })
    expect(some.find((a) => a.id === 'all-tools')!.done).toBe(3)
    expect(some.find((a) => a.id === 'brush-artist')!.done).toBe(1)
    const all = awardProgress({ ...none, toolsUsed: [...PAINT_TOOLS] })
    expect(all.find((a) => a.id === 'all-tools')!.earned).toBe(true)
    expect(all.find((a) => a.id === 'brush-artist')!.earned).toBe(true)
  })

  it('counts days and books', () => {
    const r = awardProgress({ ...none, paintDays: 3, finishedBooks: 1, booksRead: 1 })
    expect(r.filter((a) => a.earned).map((a) => a.id).sort()).toEqual(['first-book', 'first-read', 'three-days'])
  })

  it('tells what was earned just now', () => {
    expect(newlyEarned(none, { ...none, finishedPictures: 1 })).toEqual(['first-picture'])
    expect(newlyEarned({ ...none, finishedPictures: 1 }, { ...none, finishedPictures: 2 })).toEqual([])
    expect(newlyEarned({ ...none, finishedPictures: 4 }, { ...none, finishedPictures: 5 })).toEqual(['five-pictures'])
  })
})
