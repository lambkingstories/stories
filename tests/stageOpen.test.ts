/** Which stages open: a journey that is still being made (stages with `soon`) opens its ready stages at once; a finished one goes in order. */
import { describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { noah } from '@/data/adventures/noah'
import { isExamOpen, isStageOpen, nextStageIndex } from '@/utils/adventureScore'

/** A journey that is still being made: the last four stages are not ready (`soon`). */
const partly = { ...noah, stages: noah.stages.map((s, i) => ({ ...s, soon: i >= 5 })) }
const done = (ids: number[]) => ({ stages: Object.fromEntries(ids.map((id) => [id, { stars: 3, done: true }])) })

describe('the stages of a journey that is still being made (some stages are `soon`)', () => {
  it('only the ready stages open, in any order; the others never open', () => {
    expect(partly.stages.map((_, i) => isStageOpen(partly, undefined, i))).toEqual([true, true, true, true, true, false, false, false, false])
  })
  it('the way on skips the stages that are not ready, and the exam opens when all ready stages are done', () => {
    expect(nextStageIndex(partly, undefined)).toBe(0)
    expect(nextStageIndex(partly, done([1, 2, 3]))).toBe(3)
    expect(nextStageIndex(partly, done([1, 2, 3, 4, 5]))).toBeNull()
    expect(isExamOpen(partly, done([1, 2, 3, 4]))).toBe(false)
    expect(isExamOpen(partly, done([1, 2, 3, 4, 5]))).toBe(true)
  })
})

describe('Noah is complete now: its stages go in order like those of Josef', () => {
  it('stage 2 opens after stage 1, the exam after all nine', () => {
    expect(noah.stages.some((s) => s.soon)).toBe(false)
    expect(isStageOpen(noah, undefined, 1)).toBe(false)
    expect(isStageOpen(noah, done([1]), 1)).toBe(true)
    expect(isExamOpen(noah, done([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(false)
    expect(isExamOpen(noah, done([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe(true)
  })
})

describe('a finished journey (Josef) still goes in order', () => {
  it('stage 2 opens only after stage 1 was gone through', () => {
    expect(isStageOpen(josef, undefined, 0)).toBe(true)
    expect(isStageOpen(josef, undefined, 1)).toBe(false)
    expect(isStageOpen(josef, { stages: { 1: { stars: 3, done: true } } }, 1)).toBe(true)
    expect(nextStageIndex(josef, undefined)).toBe(0)
  })
})
