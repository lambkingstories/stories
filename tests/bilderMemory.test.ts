/**
 * The rules of the "Bilder-Memory" (big game `memory`): the boards (one per adventure, with the pictures of its stages), the cards, the tries, the
 * hint, the stars and the layout. Every picture a board needs must exist as a file.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { TIMELINE } from '../src/data/adventures/timeline'
import { CARD_ART } from '../src/data/cardArt'
import {
  MAX_PAIRS,
  MIN_PAIRS,
  allBoardsDone,
  boardsOf,
  cardLayout,
  dealCards,
  flip,
  hint,
  isUp,
  newGame,
  nextBoard,
  pairsForIndex,
  pickStages,
  seeded,
  settle,
  starsFor,
  triesFor,
  type Board,
  type Game
} from '../src/utils/bilderMemory'

const mods = import.meta.glob('/src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, any>>
const journeys = Object.values(mods)
  .flatMap((m) => Object.values(m))
  .filter((j) => j && typeof j === 'object' && j.id && Array.isArray(j.stages) && Array.isArray(j.exam))
const PUBLIC = path.resolve(__dirname, '../public')
const exists = (p: string) => fs.existsSync(path.join(PUBLIC, p))

describe('the boards', () => {
  const boards = boardsOf(journeys)

  it('has a board for every adventure on the time line, in the order of the Bible', () => {
    expect(boards.length).toBe(TIMELINE.length)
    expect(boards.map((b) => b.id)).toEqual(TIMELINE.map((e) => e.id))
    expect(boards.map((b) => b.index)).toEqual(TIMELINE.map((_, i) => i))
  })

  it('at least twenty boards, six to ten pairs, growing with the Bible', () => {
    expect(boards.length).toBeGreaterThanOrEqual(20)
    for (const b of boards) {
      expect(b.pairs, b.id).toBeGreaterThanOrEqual(MIN_PAIRS)
      expect(b.pairs, b.id).toBeLessThanOrEqual(MAX_PAIRS)
      expect(b.stages).toHaveLength(b.pairs)
    }
    for (let i = 1; i < boards.length; i++) expect(boards[i]!.pairs).toBeGreaterThanOrEqual(Math.min(boards[i - 1]!.pairs, boards[i]!.stages.length))
    expect(boards[0]!.pairs).toBe(6)
    expect(Math.max(...boards.map((b) => b.pairs))).toBe(10)
  })

  it('every picture of every board is a file, every board has its card', () => {
    for (const b of boards) {
      for (const s of b.stages) {
        expect(exists(s.image), `${b.id}: ${s.image}`).toBe(true)
        expect(s.title.trim().length, `${b.id} stage ${s.id}`).toBeGreaterThan(0)
      }
      expect(CARD_ART[b.id], b.id).toBeTruthy()
      expect(exists(b.front), `${b.id}: ${b.front}`).toBe(true)
      expect(new Set(b.stages.map((s) => s.id)).size, `${b.id}: a stage twice`).toBe(b.stages.length)
    }
  })

  it('an adventure that is not in the build has no board, one without pictures has none either', () => {
    const only = boardsOf(journeys.filter((j) => j.id === 'josef' || j.id === 'mose'))
    expect(only.map((b) => b.id)).toEqual(['josef', 'mose'])
    const poor = { id: 'noah', title: 'Noah', medal: 'm.webp', stages: [1, 2, 3].map((id) => ({ id, title: 't', ref: 'r', image: 'x.webp' })) }
    expect(boardsOf([poor])).toEqual([])
    const half = { ...poor, stages: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, title: 't', ref: 'r', image: i < 5 ? 'x.webp' : undefined })) }
    expect(boardsOf([half])[0]?.pairs).toBe(5)
  })

  it('the pairs grow with the place in the Bible', () => {
    expect(pairsForIndex(0)).toBe(6)
    expect(pairsForIndex(TIMELINE.length - 1)).toBe(10)
    const all = TIMELINE.map((_, i) => pairsForIndex(i))
    expect([...all].sort((a, b) => a - b)).toEqual(all)
  })

  it('picks stages spread over the whole story', () => {
    expect(pickStages([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 6)).toEqual([1, 3, 5, 8, 10, 12])
    expect(pickStages([1, 2, 3], 6)).toEqual([1, 2, 3])
    const lists = [7, 9, 12, 15, 16].map((len) => pickStages(Array.from({ length: len }, (_, i) => i), 8))
    for (const l of lists) expect(new Set(l).size).toBe(Math.min(8, l.length))
  })
})

describe('the cards', () => {
  it('two of every pair, mixed, the same with the same seed', () => {
    const a = dealCards(8, 42)
    expect(a).toHaveLength(16)
    for (let p = 0; p < 8; p++) expect(a.filter((c) => c.pair === p)).toHaveLength(2)
    expect(new Set(a.map((c) => c.id)).size).toBe(16)
    expect(dealCards(8, 42)).toEqual(a)
    expect(dealCards(8, 43).map((c) => c.id)).not.toEqual(a.map((c) => c.id))
    expect(a.map((c) => c.id)).not.toEqual([...a].map((c) => c.id).sort((x, y) => x - y))
  })

  it('the seeded generator stays between 0 and 1', () => {
    const r = seeded(7)
    for (let i = 0; i < 200; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

/** The ids of the two cards of a pair. */
const idsOf = (g: Game, pair: number) => g.cards.filter((c) => c.pair === pair).map((c) => c.id) as [number, number]

describe('the tries', () => {
  it('a pair stays open and counts one try', () => {
    const g = newGame(6, 1)
    const [a, b] = idsOf(g, 0)
    expect(flip(g, a)).toBe('first')
    expect(g.tries).toBe(0)
    expect(flip(g, b)).toBe('match')
    expect(g.tries).toBe(1)
    expect(g.found).toEqual([0])
    expect(g.up).toEqual([])
    expect(isUp(g, a)).toBe(true)
    expect(isUp(g, b)).toBe(true)
  })

  it('two cards that do not fit stay open until they are settled, and nothing else turns in between', () => {
    const g = newGame(6, 1)
    const [a] = idsOf(g, 0)
    const [b] = idsOf(g, 1)
    const [c] = idsOf(g, 2)
    flip(g, a)
    expect(flip(g, b)).toBe('miss')
    expect(g.tries).toBe(1)
    expect(g.misses).toBe(1)
    expect(flip(g, c)).toBe('ignored')
    expect(isUp(g, a) && isUp(g, b)).toBe(true)
    settle(g)
    expect(isUp(g, a) || isUp(g, b)).toBe(false)
    expect(flip(g, c)).toBe('first')
  })

  it('turning the same card twice or a found card does nothing', () => {
    const g = newGame(6, 1)
    const [a, b] = idsOf(g, 0)
    flip(g, a)
    expect(flip(g, a)).toBe('ignored')
    flip(g, b)
    expect(flip(g, a)).toBe('ignored')
    expect(flip(g, 999)).toBe('ignored')
    expect(g.tries).toBe(1)
  })

  it('finding every pair ends the game, and a perfect game takes as many tries as there are pairs', () => {
    const g = newGame(8, 5)
    for (let p = 0; p < 8; p++) {
      const [a, b] = idsOf(g, p)
      flip(g, a)
      flip(g, b)
    }
    expect(g.done).toBe(true)
    expect(g.tries).toBe(8)
    expect(starsFor(g.tries, 8)).toBe(3)
    expect(flip(g, 0)).toBe('ignored')
  })

  it('a child who only guesses still finishes, never gets stuck', () => {
    const g = newGame(10, 9)
    const rnd = seeded(3)
    let guard = 0
    while (!g.done && guard++ < 5000) {
      const free = g.cards.filter((c) => !isUp(g, c.id))
      const r = flip(g, free[Math.floor(rnd() * free.length)]!.id)
      if (r === 'miss') settle(g)
    }
    expect(g.done).toBe(true)
    expect(g.found).toHaveLength(10)
  })

  it('a player who remembers (seen cards) needs few tries', () => {
    const g = newGame(10, 11)
    let guard = 0
    while (!g.done && guard++ < 500) {
      const known = hint(g)
      if (known !== null && g.up.length === 0) {
        // a pair that is known: take both
        const a = g.cards.find((c) => c.id === known)!
        flip(g, a.id)
        flip(g, g.cards.find((c) => c.pair === a.pair && c.id !== a.id)!.id)
        continue
      }
      const fresh = g.cards.filter((c) => !isUp(g, c.id) && !g.seen.has(c.id))
      const pick = fresh[0] ?? g.cards.find((c) => !isUp(g, c.id))!
      flip(g, pick.id)
      const partner = g.up.length === 1 ? hint(g) : null
      if (partner !== null) {
        flip(g, partner)
      } else {
        const more = g.cards.filter((c) => !isUp(g, c.id) && !g.seen.has(c.id))
        flip(g, (more[0] ?? g.cards.find((c) => !isUp(g, c.id))!).id)
        if (g.up.length === 2) settle(g)
      }
    }
    expect(g.done).toBe(true)
    expect(starsFor(g.tries, 10)).toBe(3)
  })
})

describe('the hint', () => {
  it('knows nothing at the start', () => {
    expect(hint(newGame(6, 1))).toBeNull()
  })

  it('shows the partner of the open card when it was seen before', () => {
    const g = newGame(6, 1)
    const [a1, a2] = idsOf(g, 0)
    const [b] = idsOf(g, 1)
    flip(g, a1)
    flip(g, b)
    settle(g)
    flip(g, a2)
    // a1 was seen: it is the hint for the open a2
    expect(hint(g)).toBe(a1)
  })

  it('names a card of a pair that was seen completely', () => {
    const g = newGame(6, 1)
    const [a1, a2] = idsOf(g, 0)
    const [b1] = idsOf(g, 1)
    const [c1] = idsOf(g, 2)
    flip(g, a1)
    flip(g, b1)
    settle(g)
    flip(g, c1)
    flip(g, a2)
    settle(g)
    const h = hint(g)
    expect(h === a1 || h === a2).toBe(true)
  })

  it('says nothing for a card that has no seen partner, and while two cards are open', () => {
    const g = newGame(6, 1)
    const [a1] = idsOf(g, 0)
    const [b1] = idsOf(g, 1)
    flip(g, a1)
    expect(hint(g)).toBeNull()
    flip(g, b1)
    expect(hint(g)).toBeNull()
  })
})

describe('stars', () => {
  it('three stars up to two tries a pair, two up to three tries a pair, otherwise one', () => {
    for (const pairs of [6, 8, 9, 10]) {
      const t = triesFor(pairs)
      expect(starsFor(pairs, pairs)).toBe(3)
      expect(starsFor(t.three, pairs)).toBe(3)
      expect(starsFor(t.three + 1, pairs)).toBe(2)
      expect(starsFor(t.two, pairs)).toBe(2)
      expect(starsFor(t.two + 1, pairs)).toBe(1)
      expect(starsFor(500, pairs)).toBe(1)
    }
  })
})

describe('the whole game', () => {
  const board = (id: string, index: number): Board => ({ id, index, title: id, pairs: 6, stages: [], front: '' })
  const boards = [board('a', 4), board('b', 7), board('c', 9)]

  it('is done when every board has a star, and not before', () => {
    expect(allBoardsDone([], boards)).toBe(false)
    const levels: number[] = []
    levels[4] = 3
    levels[7] = 1
    expect(allBoardsDone(levels, boards)).toBe(false)
    levels[9] = 2
    expect(allBoardsDone(levels, boards)).toBe(true)
    expect(allBoardsDone([], [])).toBe(false)
  })

  it('the next board is the next one that is not done, going round once', () => {
    const levels: number[] = []
    expect(nextBoard(levels, boards, 4)?.id).toBe('b')
    levels[7] = 2
    expect(nextBoard(levels, boards, 4)?.id).toBe('c')
    levels[4] = 1
    expect(nextBoard(levels, boards, 9)?.id).toBe('c')
    levels[9] = 3
    expect(nextBoard(levels, boards, 9)).toBeNull()
  })
})

describe('the layout of the cards', () => {
  it('uses a full rectangle where it fits (twelve cards, a phone standing)', () => {
    const l = cardLayout(12, 343, 540, 10)
    expect(l.empty).toBe(0)
    expect(l.cols * l.rows).toBe(12)
    expect(l.cols).toBe(3)
    expect(l.w * l.cols + 10 * (l.cols - 1)).toBeLessThanOrEqual(343)
    expect(l.h * l.rows + 10 * (l.rows - 1)).toBeLessThanOrEqual(540)
  })

  it('every size fits into its box and the cards are not tiny', () => {
    const boxes: [number, number][] = [
      [343, 540],
      [340, 480],
      [700, 260],
      [760, 560],
      [1000, 700],
      [320, 420]
    ]
    for (const count of [12, 16, 18, 20]) {
      for (const [w, h] of boxes) {
        const l = cardLayout(count, w, h, 8)
        expect(l.cols * l.rows).toBeGreaterThanOrEqual(count)
        expect(l.w * l.cols + 8 * (l.cols - 1), `${count} in ${w}x${h}`).toBeLessThanOrEqual(w)
        expect(l.h * l.rows + 8 * (l.rows - 1), `${count} in ${w}x${h}`).toBeLessThanOrEqual(h + 1)
        expect(l.w / l.h).toBeGreaterThanOrEqual(0.77)
        expect(l.w / l.h).toBeLessThanOrEqual(1.31)
        expect(Math.min(l.w, l.h), `${count} in ${w}x${h}`).toBeGreaterThanOrEqual(58)
      }
    }
  })

  it('twenty cards on a phone standing are four across and five down', () => {
    const l = cardLayout(20, 343, 560, 8)
    expect([l.cols, l.rows]).toEqual([4, 5])
  })
})
