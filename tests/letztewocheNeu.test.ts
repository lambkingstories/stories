/**
 * The pure parts of the new game of "Die letzte Woche" (`utils/letztewocheNeu.ts`): "Two halves" (`gebote`, Matthew 22,37-39):
 * the turning, the places of the workbench, the two halves that make one picture, the help, the run of the help and the checks of the data.
 */
import { describe, expect, it } from 'vitest'
import {
  COMMAND_HEART_SIDE,
  COMMAND_RATIO,
  commandAt,
  commandCardsOf,
  commandHelp,
  commandHelpRun,
  commandJoined,
  commandKindOf,
  commandPlaceVerdict,
  commandProblems,
  commandRoundDone,
  commandStart,
  commandTurnBy,
  commandTurnsLeft
} from '@/utils/letztewocheNeu'
import type { CommandGame, CommandSpot } from '@/utils/letztewocheNeu'

const G = 'images/abenteuer/spiele/letztewoche/gebote/'
const GAME: CommandGame = {
  heart: { image: `${G}herz.webp`, label: 'Ein rotes Herz' },
  cards: [
    { id: 'gott-1', image: `${G}gott-1.webp`, label: 'Ein Mädchen betet', kind: 'god' },
    { id: 'naechster-1', image: `${G}naechster-1.webp`, label: 'Ein Junge teilt sein Brot', kind: 'neighbor' },
    { id: 'gott-2', image: `${G}gott-2.webp`, label: 'Eine Familie singt', kind: 'god' },
    { id: 'gott-3', image: `${G}gott-3.webp`, label: 'Eine Familie dankt', kind: 'god' },
    { id: 'naechster-2', image: `${G}naechster-2.webp`, label: 'Eine Frau trägt den Krug', kind: 'neighbor' },
    { id: 'naechster-3', image: `${G}naechster-3.webp`, label: 'Ein Mädchen bringt Suppe', kind: 'neighbor' }
  ],
  rounds: [
    {
      hint: 'a',
      pieces: [
        { card: 'naechster-1', side: 'R', turn: 90 },
        { card: 'gott-1', side: 'L', turn: 270 },
        { card: 'naechster-1', side: 'L', turn: 270 },
        { card: 'gott-1', side: 'R', turn: 90 }
      ]
    },
    {
      hint: 'b',
      pieces: [
        { card: 'gott-3', side: 'R', turn: 180 },
        { card: 'naechster-2', side: 'L', turn: 90 },
        { card: 'gott-2', side: 'L', turn: 270 },
        { card: 'naechster-3', side: 'R', turn: 180 },
        { card: 'gott-2', side: 'R', turn: 90 },
        { card: 'gott-3', side: 'L', turn: 270 },
        { card: 'naechster-3', side: 'L', turn: 90 },
        { card: 'naechster-2', side: 'R', turn: 180 }
      ]
    }
  ]
}
const clone = (): CommandGame => JSON.parse(JSON.stringify(GAME)) as CommandGame
const R1 = GAME.rounds[0]!

describe('Zwei Hälften: turning', () => {
  it('a quarter turn either way, always 0, 90, 180 or 270', () => {
    expect(commandTurnBy(0, 1)).toBe(90)
    expect(commandTurnBy(270, 1)).toBe(0)
    expect(commandTurnBy(0, -1)).toBe(270)
    expect(commandTurnBy(90, -1)).toBe(0)
    let t = 90
    for (let i = 0; i < 4; i++) t = commandTurnBy(t, 1)
    expect(t).toBe(90)
  })
  it('the quarter turns that are needed at least (with both buttons): 90 and 270 one, 180 two, 0 none', () => {
    expect([0, 90, 180, 270].map(commandTurnsLeft)).toEqual([0, 1, 2, 1])
  })
  it('a half is the picture (3:2) cut in two: 3:4; God belongs to the left half of the heart, the neighbour to the right', () => {
    expect(COMMAND_RATIO / 2).toBe(0.75)
    expect(COMMAND_HEART_SIDE).toEqual({ god: 'L', neighbor: 'R' })
  })
})

describe('Zwei Hälften: the workbench', () => {
  it('the start: every half in the tray, turned as in the data; the pictures in the order of the tray', () => {
    const s = commandStart(R1)
    expect(s.spots).toEqual(['tray', 'tray', 'tray', 'tray'])
    expect(s.turns).toEqual([90, 270, 270, 90])
    expect(commandCardsOf(R1)).toEqual(['naechster-1', 'gott-1'])
    expect(commandKindOf(GAME, 'gott-1')).toBe('god')
    expect(commandKindOf(GAME, 'x')).toBeUndefined()
  })

  it('a half must be upright, on its own side and on a free place; one that is not in the tray is gone', () => {
    const { spots, turns } = commandStart(R1)
    expect(commandPlaceVerdict(R1, turns, spots, 1, 'L')).toBe('turn')
    turns[1] = 0
    expect(commandPlaceVerdict(R1, turns, spots, 1, 'R')).toBe('side')
    expect(commandPlaceVerdict(R1, turns, spots, 1, 'L')).toBe('ok')
    spots[1] = 'L'
    expect(commandAt(spots, 'L')).toBe(1)
    expect(commandPlaceVerdict(R1, turns, spots, 1, 'L')).toBe('gone')
    turns[2] = 0
    expect(commandPlaceVerdict(R1, turns, spots, 2, 'L')).toBe('busy')
    expect(commandPlaceVerdict(R1, turns, spots, 9, 'L')).toBe('gone')
  })

  it('two halves of one picture make it whole; two of different pictures do not; one alone waits', () => {
    const spots: CommandSpot[] = ['tray', 'L', 'tray', 'tray']
    expect(commandJoined(R1, spots)).toBeNull()
    spots[3] = 'R'
    expect(commandJoined(R1, spots)).toEqual({ card: 'gott-1' })
    spots[3] = 'tray'
    spots[0] = 'R'
    expect(commandJoined(R1, spots)).toBe('mismatch')
    expect(commandRoundDone(spots)).toBe(false)
    expect(commandRoundDone(['done', 'done', 'done', 'done'])).toBe(true)
    expect(commandRoundDone([])).toBe(false)
  })
})

describe('Zwei Hälften: the help', () => {
  it('on an empty workbench: the left half of the first picture; then its right half; then the heart', () => {
    const spots: CommandSpot[] = ['tray', 'tray', 'tray', 'tray']
    expect(commandHelp(GAME, R1, spots)).toEqual({ piece: 2, side: 'L' })
    spots[2] = 'L'
    expect(commandHelp(GAME, R1, spots)).toEqual({ piece: 0, side: 'R' })
    spots[0] = 'R'
    expect(commandHelp(GAME, R1, spots)).toEqual({ sort: 'neighbor' })
    spots[0] = 'done'
    spots[2] = 'done'
    expect(commandHelp(GAME, R1, spots)).toEqual({ piece: 1, side: 'L' })
  })

  it('a right half alone on the workbench gets its left half', () => {
    const spots: CommandSpot[] = ['tray', 'tray', 'tray', 'R']
    expect(commandHelp(GAME, R1, spots)).toEqual({ piece: 1, side: 'L' })
  })

  it('nothing to do when everything is sorted', () => {
    expect(commandHelp(GAME, R1, ['done', 'done', 'done', 'done'])).toBeNull()
  })

  it('the help alone finishes both rounds without a mistake (3 steps for each picture)', () => {
    expect(commandHelpRun(GAME, GAME.rounds[0]!)).toBe(6)
    expect(commandHelpRun(GAME, GAME.rounds[1]!)).toBe(12)
  })
})

describe('Zwei Hälften: the checks of the data', () => {
  it('the sample data are in order', () => {
    expect(commandProblems(GAME)).toEqual([])
  })

  it('finds a missing half, a half that lies upright, a picture of only one commandment, a picture used twice, a ready pair in the tray', () => {
    let g = clone()
    g.rounds[0]!.pieces.pop()
    expect(commandProblems(g).join(' | ')).toMatch(/exactly two halves/)
    g = clone()
    g.rounds[0]!.pieces[0]!.turn = 0
    expect(commandProblems(g).join(' | ')).toMatch(/must lie turned/)
    g = clone()
    g.cards[1]!.kind = 'god'
    expect(commandProblems(g).join(' | ')).toMatch(/both commandments/)
    g = clone()
    g.rounds[1]!.pieces[0]!.card = 'gott-1'
    expect(commandProblems(g).join(' | ')).toMatch(/was in a round before/)
    g = clone()
    g.rounds[0]!.pieces = [
      { card: 'gott-1', side: 'L', turn: 90 },
      { card: 'gott-1', side: 'R', turn: 90 },
      { card: 'naechster-1', side: 'R', turn: 270 },
      { card: 'naechster-1', side: 'L', turn: 270 }
    ]
    expect(commandProblems(g).join(' | ')).toMatch(/lie side by side/)
  })

  it('round 2 must be harder: more halves, one upside down, two pictures of each commandment, more turning', () => {
    const g = clone()
    g.rounds[1]!.pieces.forEach((p) => (p.turn = 90))
    expect(commandProblems(g).join(' | ')).toMatch(/upside down/)
    const h = clone()
    h.rounds = [h.rounds[1]!, h.rounds[0]!]
    const out = commandProblems(h).join(' | ')
    expect(out).toMatch(/more halves than round 1/)
    expect(out).toMatch(/two pictures of each commandment/)
  })

  it('finds a picture without file or words, two pictures with the same file, a heart without picture, a single round', () => {
    const g = clone()
    g.cards[0]!.label = ' '
    g.cards[2]!.image = g.cards[1]!.image
    g.heart.image = ''
    g.rounds = [g.rounds[0]!]
    const out = commandProblems(g).join(' | ')
    expect(out).toMatch(/has no words/)
    expect(out).toMatch(/same file/)
    expect(out).toMatch(/no picture of the heart/)
    expect(out).toMatch(/at least two rounds/)
  })
})
