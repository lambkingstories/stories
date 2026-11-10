import { describe, expect, it } from 'vitest'
import { dailyFor, dayNumber, taskDone } from '@/use/useDaily'
import { MEMORY_VERSES } from '@/data/memoryVerses'
import { PAINT_TOOLS, awardProgress, newlyEarned, type AwardStats } from '@/utils/awards'

const none: AwardStats = { finishedPictures: 0, finishedBooks: 0, toolsUsed: [], paintDays: 0, booksRead: 0, stagesDone: 0, adventuresDone: 0, quizCorrect: 0, cardsWon: 0, dailyDays: 0 }

describe('"Heute für dich"', () => {
  it('the verse changes every day and the three kinds of task follow one another', () => {
    const d0 = new Date(2026, 10, 10)
    const days = [0, 1, 2, 3].map((i) => dailyFor(new Date(2026, 10, 10 + i)))
    expect(new Set(days.map((d) => d.verseId)).size).toBe(4)
    expect(new Set(days.slice(0, 3).map((d) => d.kind)).size).toBe(3)
    for (const d of days) expect(Object.keys(MEMORY_VERSES)).toContain(d.verseId)
    expect(dayNumber(new Date(2026, 10, 11)) - dayNumber(d0)).toBe(1)
  })

  it('the task is done by the diary of the day', () => {
    const rec = (p: Partial<{ pages: number; stages: number; pictures: number; paint: number }>) => ({ pages: p.pages ?? 0, stages: p.stages ?? 0, pictures: p.pictures ?? 0, sec: { paint: p.paint ?? 0 } })
    expect(taskDone('read', undefined)).toBe(false)
    expect(taskDone('read', rec({ pages: 2 }))).toBe(false)
    expect(taskDone('read', rec({ pages: 3 }))).toBe(true)
    expect(taskDone('play', rec({ stages: 1 }))).toBe(true)
    expect(taskDone('paint', rec({ paint: 60 }))).toBe(false)
    expect(taskDone('paint', rec({ paint: 120 }))).toBe(true)
    expect(taskDone('paint', rec({ pictures: 1 }))).toBe(true)
  })

  it('the new awards are earned by the numbers and the old ones stay as they were', () => {
    const p = (s: Partial<AwardStats>) => Object.fromEntries(awardProgress({ ...none, ...s }).map((a) => [a.id, a.earned]))
    expect(p({ stagesDone: 1 })['first-stage']).toBe(true)
    expect(p({ adventuresDone: 4 })['five-adventures']).toBe(false)
    expect(p({ adventuresDone: 5 })['five-adventures']).toBe(true)
    expect(p({ quizCorrect: 10 })['quiz-ten']).toBe(true)
    expect(p({ quizCorrect: 49 })['quiz-fifty']).toBe(false)
    expect(p({ booksRead: 5 })['five-reads']).toBe(true)
    expect(p({ cardsWon: 1 })['first-card']).toBe(true)
    expect(p({ dailyDays: 3 })['daily-three']).toBe(true)
    expect(p({ dailyDays: 9 })['daily-ten']).toBe(false)
    expect(newlyEarned(none, { ...none, dailyDays: 3 })).toEqual(['daily-three'])
    expect(PAINT_TOOLS).toHaveLength(6)
  })
})
