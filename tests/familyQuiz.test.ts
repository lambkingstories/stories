import { describe, expect, it } from 'vitest'
import { buildPool, pickQuestions, playerOf, ranking, roundsFor, shuffle, type FamilyQuestion } from '../src/utils/familyQuiz'
import type { Journey } from '../src/types/adventure'

const journeys = [
  {
    id: 'a',
    title: 'Josef',
    stages: [
      { id: 1, title: 'Eins', questions: [{ q: 'Wer?', options: ['A', 'B', 'C'], answer: 1 }] },
      { id: 2, title: 'Zwei', questions: [{ q: 'Wo?', options: ['X', 'Y'], answer: 0 }], soon: true }
    ],
    exam: [{ q: 'Wann?', options: ['1', '2', '3'], answer: 2 }, { q: 'Kaputt?', options: ['1', '2'], answer: 5 }]
  }
] as unknown as Journey[]

const seq = (values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]!
}

describe('family quiz', () => {
  it('collects the questions of the stages that are ready and of the exam, without broken ones', () => {
    const pool = buildPool(journeys)
    expect(pool.map((p) => p.q)).toEqual(['Wer?', 'Wann?'])
    expect(pool[0]!.from).toBe('Josef: Eins')
    expect(pool[1]!.from).toBe('Josef')
    expect(pool[0]).toMatchObject({ journey: 'Josef', stage: 'Eins' })
    expect(pool[1]).toMatchObject({ journey: 'Josef', stage: '' })
  })

  it('with the progress only the questions of the stages and exams that were gone through are in the pool', () => {
    const both = [
      {
        id: 'a',
        title: 'Josef',
        stages: [
          { id: 1, title: 'Eins', questions: [{ q: 'Wer?', options: ['A', 'B'], answer: 1 }] },
          { id: 2, title: 'Zwei', questions: [{ q: 'Wo?', options: ['X', 'Y'], answer: 0 }] }
        ],
        exam: [{ q: 'Wann?', options: ['1', '2'], answer: 1 }]
      }
    ] as unknown as Journey[]
    const none = buildPool(both, { stageDone: () => false, examDone: () => false })
    expect(none).toEqual([])
    const first = buildPool(both, { stageDone: (_j, s) => s === 1, examDone: () => false })
    expect(first.map((p) => p.q)).toEqual(['Wer?'])
    const all = buildPool(both, { stageDone: () => true, examDone: () => true })
    expect(all.map((p) => p.q)).toEqual(['Wer?', 'Wo?', 'Wann?'])
  })

  it('shuffles without losing anything', () => {
    const out = shuffle([1, 2, 3, 4, 5], seq([0.1, 0.9, 0.4, 0.7]))
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('finds the right answer again after the options were shuffled', () => {
    const pool: FamilyQuestion[] = [{ q: 'Wer?', options: ['A', 'B', 'C', 'D'], answer: 2, from: 'x', journey: 'x', stage: '' }]
    for (let n = 0; n < 20; n++) {
      const [q] = pickQuestions(pool, 1)
      expect(q!.options[q!.answer]).toBe('C')
    }
  })

  it('uses a wording only once and never more than asked for', () => {
    const pool: FamilyQuestion[] = [
      { q: 'Gleich?', options: ['a', 'b'], answer: 0, from: 'x', journey: 'x', stage: '' },
      { q: 'Gleich?', options: ['a', 'b'], answer: 0, from: 'y', journey: 'y', stage: '' },
      { q: 'Anders?', options: ['a', 'b'], answer: 1, from: 'z', journey: 'z', stage: '' }
    ]
    expect(pickQuestions(pool, 5)).toHaveLength(2)
    expect(pickQuestions(pool, 1)).toHaveLength(1)
  })

  it('limits the rounds to what the pool can serve', () => {
    expect(roundsFor(8, 4, 100)).toBe(8)
    expect(roundsFor(8, 4, 20)).toBe(5)
    expect(roundsFor(8, 4, 3)).toBe(0)
    expect(roundsFor(5, 0, 100)).toBe(0)
  })

  it('lets the people take turns', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => playerOf(i, 3))).toEqual([0, 1, 2, 0, 1, 2])
  })

  it('ranks by score and shares a rank for the same score', () => {
    expect(ranking(['Mia', 'Papa', 'Oma'], [3, 5, 3])).toEqual([
      { name: 'Papa', score: 5, rank: 1 },
      { name: 'Mia', score: 3, rank: 2 },
      { name: 'Oma', score: 3, rank: 2 }
    ])
  })
})
