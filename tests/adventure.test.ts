import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { josef } from '@/data/adventures/josef'
import useAdventure from '@/use/useAdventure'
import {
  attemptStars,
  isExamOpen,
  isStageOpen,
  maxPoints,
  medalFor,
  mistakeStars,
  finalStars,
  stageStarsOf,
  nextStageIndex,
  pointsOf,
  quizStars,
  starsOf
} from '@/utils/adventureScore'

describe('stars and cups', () => {
  it('gives stars for a quiz: all right 3, half right 2, otherwise 1', () => {
    expect(quizStars(3, 3)).toBe(3)
    expect(quizStars(2, 3)).toBe(2)
    expect(quizStars(1, 3)).toBe(1)
    expect(quizStars(0, 3)).toBe(1)
    expect(quizStars(1, 2)).toBe(2)
    expect(quizStars(0, 0)).toBe(0)
  })

  it('gives stars for counting by the number of tries', () => {
    expect([1, 2, 3, 4].map(attemptStars)).toEqual([3, 2, 1, 1])
    // games with mistakes: a slip is allowed, then it costs stars
    expect([0, 1, 2, 4, 5].map((m) => mistakeStars(m))).toEqual([3, 3, 2, 2, 1])
    expect([0, 3, 4, 7, 8].map((m) => mistakeStars(m, 3, 7))).toEqual([3, 3, 2, 2, 1])
  })

  it('gives the cup from 50, 75 and 90 percent of the points', () => {
    // 42 points are possible (12 stages with 3 stars and 6 exam questions)
    expect(medalFor(42, 42)).toBe('gold')
    expect(medalFor(38, 42)).toBe('gold')
    expect(medalFor(37, 42)).toBe('silver')
    expect(medalFor(32, 42)).toBe('silver')
    expect(medalFor(31, 42)).toBe('bronze')
    expect(medalFor(21, 42)).toBe('bronze')
    expect(medalFor(20, 42)).toBeNull()
    expect(medalFor(0, 0)).toBeNull()
  })

  it('opens the stages one after the other and the exam at the end', () => {
    const p = { stages: { 1: { stars: 2, done: true }, 2: { stars: 0, done: false } } }
    expect(isStageOpen(josef, undefined, 0)).toBe(true)
    expect(isStageOpen(josef, undefined, 1)).toBe(false)
    expect(isStageOpen(josef, p, 1)).toBe(true)
    expect(isStageOpen(josef, p, 2)).toBe(false)
    expect(nextStageIndex(josef, p)).toBe(1)
    expect(isExamOpen(josef, p)).toBe(false)
    const all = { stages: Object.fromEntries(josef.stages.map((s) => [s.id, { stars: 3, done: true }])) }
    expect(isExamOpen(josef, all)).toBe(true)
    expect(nextStageIndex(josef, all)).toBeNull()
  })

  it('adds the stars and the exam to the points of a journey', () => {
    const p = { stages: { 1: { stars: 3, done: true }, 2: { stars: 2, done: true } }, exam: { correct: 5, total: 6 } }
    expect(starsOf(p)).toBe(5)
    expect(pointsOf(p)).toBe(10)
    expect(maxPoints(josef)).toBe(12 * 3 + 6)
  })
})

describe('adventure progress', () => {
  beforeEach(() => {
    localStorage.clear()
    useAdventure().reset('t')
  })

  it('the result of the newest try replaces the old one (better or worse)', () => {
    const a = useAdventure()
    a.recordStars('t', 1, 2)
    a.recordFinal('t', 1, 2)
    a.recordQuiz('t', 1, 2)
    // a new try: its game stars count at once, the stars of the questions of the old try are gone until the new ones are in
    a.recordStars('t', 1, 1)
    expect(a.stageOf('t', 1)?.stars).toBe(1)
    expect(a.stageOf('t', 1)?.gameStars).toBe(1)
    expect(a.stageOf('t', 1)?.finalStars).toBeUndefined()
    expect(a.stageOf('t', 1)?.quizCorrect).toBeUndefined()
    a.recordFinal('t', 1, 0)
    expect(a.stageOf('t', 1)?.finalStars).toBe(0)
    a.recordQuiz('t', 1, 0)
    a.recordStars('t', 1, 3)
    expect(a.stageOf('t', 1)?.stars).toBe(3)
    a.recordStars('t', 1, 9)
    expect(a.stageOf('t', 1)?.stars).toBe(3)
  })

  it('opens the next stage only when a stage is completed, and remembers it', () => {
    const a = useAdventure()
    a.recordQuiz('t', 2, 1)
    expect(a.stageOf('t', 2)?.done).toBe(false)
    a.completeStage('t', 2)
    expect(a.stageOf('t', 2)?.done).toBe(true)
    expect(JSON.parse(localStorage.getItem('lk-adventure-v1') ?? '{}').t.stages[2].done).toBe(true)
  })

  it('keeps the better exam', () => {
    const a = useAdventure()
    a.recordExam('t', 4, 6)
    a.recordExam('t', 2, 6)
    expect(a.progressOf('t')?.exam).toEqual({ correct: 4, total: 6 })
  })
})

describe('the journeys', () => {
  it('has twelve stages in order, each with a text, a task and one to three questions', () => {
    expect(josef.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    for (const s of josef.stages) {
      expect(s.text.length).toBeGreaterThan(0)
      expect(s.ref).toMatch(/\d/)
      expect(s.questions.length).toBeGreaterThanOrEqual(1)
      expect(s.questions.length).toBeLessThanOrEqual(3)
    }
    // the two serious stages are told, not played
    expect(josef.stages[2]!.task.kind).toBe('quiz')
    expect(josef.stages[9]!.task.kind).toBe('quiz')
  })

  it('has valid questions: the right answer exists and the answers differ', () => {
    for (const q of [...josef.stages.flatMap((s) => s.questions), ...josef.exam]) {
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(new Set(q.options).size).toBe(q.options.length)
    }
    expect(josef.exam).toHaveLength(6)
  })

  it('has the pictures the tasks and the present need', () => {
    // `{n}` is a variant (1–3) of a picture
    const files = [
      ...josef.stages.flatMap((s) => [s.task.image, s.task.imageOff, s.task.background]).filter((f): f is string => !!f).map((f) => f.replace('{n}', '1')),
      josef.gift.image,
      josef.medal,
      ...josef.map.images,
      josef.map.ring
    ]
    expect(files.length).toBeGreaterThanOrEqual(8)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('has every game of the journey built: no stage is left without its game data and pictures', () => {
    const files: string[] = []
    for (const s of josef.stages) {
      const t = s.task
      if (t.kind === 'puzzle') {
        expect(t.puzzle?.cols).toBeGreaterThan(0)
        files.push(t.puzzle!.image)
      } else if (t.kind === 'weg') {
        expect(t.way!.scenes.length).toBeGreaterThanOrEqual(2)
        for (const sc of t.way!.scenes) {
          expect(['left', 'right', 'middle']).toContain(sc.goal)
          // the middle way only exists on a fork with three ways
          if (sc.goal === 'middle') expect(sc.paths).toBe(3)
        }
        files.push(t.way!.walker, ...t.way!.scenes.map((x) => x.image))
      } else if (t.kind === 'ernten') {
        const h = t.harvest!
        expect(h.count).toBeGreaterThan(0)
        files.push(h.field, h.basket, ...h.fruits, ...h.weeds)
      } else if (t.kind === 'memory') {
        const m = t.memory!
        expect(m.pairs.length).toBeGreaterThanOrEqual(3)
        files.push(m.back, ...m.pairs.map((p) => p.image))
        for (const p of m.pairs) expect(p.text.length).toBeGreaterThan(10)
      } else if (t.kind === 'sortieren') {
        const g = t.sort!
        expect(g.perBin).toBeGreaterThan(0)
        expect(new Set(g.bins.map((b) => b.id)).size).toBe(g.bins.length)
        files.push(...g.bins.flatMap((b) => [b.house, b.sack]))
      } else if (t.kind === 'wimmelbild') {
        const f = t.find!
        expect(f.finds).toHaveLength(t.count!)
        files.push(f.scene, ...f.finds.map((x) => x.image), ...f.covers.map((x) => x.image))
        for (const x of [...f.finds, ...f.covers]) {
          expect(x.x).toBeGreaterThanOrEqual(0)
          expect(x.x).toBeLessThanOrEqual(100)
          expect(x.y).toBeGreaterThan(0)
          expect(x.y).toBeLessThanOrEqual(100)
        }
      } else if (t.kind === 'zaehlen') {
        const groups = t.groups ?? [{ image: t.image!, imageOff: t.imageOff, count: t.count! }]
        expect(groups.reduce((n, g) => n + g.count, 0)).toBe(t.count)
        for (const g of groups) files.push(g.image.replace('{n}', '1'), (g.imageOff ?? g.image).replace('{n}', '1'))
      }
    }
    expect(files.length).toBeGreaterThan(40)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the questions bring a star for every right answer and take one for every wrong answer (0 to 3, one at least for those who played)', () => {
    // two questions
    expect([0, 1, 2].map((w) => finalStars(3, 2 - w, w))).toEqual([3, 2, 1])
    expect(finalStars(1, 2, 0)).toBe(3)
    expect(finalStars(1, 1, 1)).toBe(1)
    expect(finalStars(2, 1, 1)).toBe(2)
    expect(finalStars(2, 0, 2)).toBe(1)
    expect(finalStars(0, 0, 0)).toBe(0)
    expect(stageStarsOf({ stars: 3, gameStars: 3, finalStars: 2 })).toBe(2)
    expect(stageStarsOf({ stars: 3 })).toBe(3)
  })

  it('has the beads of the dotted path: one stretch per stage, lying within the map, running on from the stage to the next', () => {
    const path = josef.map.path
    expect(path).toHaveLength(josef.stages.length)
    const spots = [...josef.map.stages, josef.map.exam]
    path.forEach((seg, k) => {
      expect(seg.length, `stretch ${k + 1}`).toBeGreaterThanOrEqual(1)
      for (const [x, y] of seg) {
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(1)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(1)
      }
      // it begins near the station it leaves and ends near the one it reaches (the map is 4.68 times as wide as high)
      const near = (p: [number, number], sp: { x: number; y: number }) => Math.hypot((p[0] - sp.x) * josef.map.aspect, p[1] - sp.y)
      expect(near(seg[0]!, spots[k]!), `start ${k + 1}`).toBeLessThan(0.45)
      expect(near(seg[seg.length - 1]!, spots[k + 1]!), `end ${k + 1}`).toBeLessThan(0.45)
    })
  })

  it('has a counting game only where the picture and the number are given', () => {
    for (const s of josef.stages.filter((x) => x.task.kind === 'zaehlen' && x.task.image)) expect(s.task.count).toBeGreaterThan(0)
  })

  it('lists the journeys with unique ids', () => {
    expect(new Set(journeys.map((j) => j.id)).size).toBe(journeys.length)
  })
})

describe('the map', () => {
  it('has a spot for every stage inside the map, and one for the exam', () => {
    expect(josef.map.stages).toHaveLength(josef.stages.length)
    for (const sp of [...josef.map.stages, josef.map.exam]) {
      expect(sp.x).toBeGreaterThan(0)
      expect(sp.x).toBeLessThan(1)
      expect(sp.y).toBeGreaterThan(0)
      expect(sp.y).toBeLessThan(1)
      expect(sp.d).toBeGreaterThan(0.02)
    }
  })

  it('does not ask in the questions what the game of the same stage just asked', () => {
    // stage 2 counts the stars: its questions must not ask for their number
    const q = josef.stages[1]!.questions.map((x) => x.q.toLowerCase())
    expect(q.some((x) => x.includes('wie viele'))).toBe(false)
  })
})
