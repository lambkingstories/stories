/**
 * The pure parts of the three new games of "Stories of Jesus" (the components only draw and listen):
 * "Dig for the treasure" (`graben`, Matthew 13,44-46: a chest in the field, the most precious pearl),
 * "Sweep for the coin" (`muenze`, Luke 15,8-10: the woman lights the lamp, sweeps the house and finds her coin) and
 * "Meet the son" (`entgegen`, Luke 15,20-24: the father runs to his son, then robe, ring and shoes).
 * Places are percent of the picture (3:2). The arithmetic has no clock and no dice of its own.
 */
import { mistakeStars } from '@/utils/adventureScore'
import { COLS, ROWS, coverage } from '@/utils/wipe'
import type { Region } from '@/utils/wipe'
import type { CoinGame, CoinRound, DigGame, DigRound, MeetGame, MeetGiftId } from '@/types/adventure'

/** The height of the pictures divided by their width (3 : 2). */
const ASPECT = 2 / 3

/**
 * Stars at the end of "dig" and of "coin": the mistakes of all rounds against the number of rounds. Two rounds: up to 2 mistakes three stars, up to 5 two stars, then one
 * (the same steps as the games of Jesus heals).
 */
export function gleichnisStars(mistakes: number, rounds: number): number {
  const r = Math.max(1, rounds)
  return mistakeStars(mistakes, r, r * 2 + 1)
}

// ---------------------------------------------------------------- 1. dig for the treasure (`graben`)

export const DIG_COLS = 4
export const DIG_ROWS = 3
/** Twelve mounds, four to a row. */
export const DIG_CELLS = DIG_COLS * DIG_ROWS
/** Five pearls lie on the table. */
export const DIG_PEARLS = 5

/** The index of the mound in column `col` and row `row` (counted from 0, row by row). */
export const digIndex = (col: number, row: number): number => row * DIG_COLS + col

/** The eight directions of the arrow in an empty hole, counted anticlockwise from the east: 0 east, 1 north-east, 2 north, 3 north-west, 4 west, 5 south-west, 6 south, 7 south-east. */
export type DigDir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * The direction from one place to another (middles in percent of the 3:2 picture), rounded to the nearest of eight. Places on top of each other give east.
 * A percent of the height is shorter than a percent of the width, so the angle is worked out in the units of the picture.
 */
export function digDirection(from: { x: number; y: number }, to: { x: number; y: number }): DigDir {
  const dx = to.x - from.x
  const dy = (to.y - from.y) * ASPECT
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return 0
  const angle = (Math.atan2(-dy, dx) * 180) / Math.PI
  return ((((Math.round(angle / 45) % 8) + 8) % 8) as DigDir)
}

/** How far the arrow is turned (degrees, clockwise on the screen) when its picture points to the east. */
export const digArrowTurn = (dir: DigDir): number => -dir * 45

/** What a tap on a mound means: the mound was dug already, the chest lies under it, or the hole is empty. */
export type DigVerdict = 'again' | 'found' | 'hole'
export function digJudge(index: number, treasureIndex: number, dug: readonly boolean[]): DigVerdict {
  if (dug[index]) return 'again'
  return index === treasureIndex ? 'found' : 'hole'
}

/** The arrow of an empty hole at mound `index`: the direction to the middle of the mound over the chest. */
export function digArrow(index: number, treasureIndex: number, cells: readonly [number, number][]): DigDir {
  const a = cells[index]
  const b = cells[treasureIndex]
  if (!a || !b) return 0
  return digDirection({ x: a[0], y: a[1] }, { x: b[0], y: b[1] })
}

/**
 * Where the five pearls lie: the best one (picture 0) at place `best`, the four others (pictures 1 to 4) at the other places in their order.
 * Returns for each place the number of the picture.
 */
export function pearlOrder(best: number): number[] {
  const b = Math.min(DIG_PEARLS - 1, Math.max(0, Math.floor(best)))
  const out: number[] = []
  let other = 1
  for (let slot = 0; slot < DIG_PEARLS; slot++) out.push(slot === b ? 0 : other++)
  return out
}

/** A tap on a pearl: the most precious one is right, any other one is wrong. */
export function pearlJudge(slot: number, best: number): 'right' | 'wrong' {
  return slot === best ? 'right' : 'wrong'
}

/** The problems of the data of a round of `dig` (an empty list is good): twelve mounds that do not overlap and lie inside the picture, a chest in the field, five places for the pearls. */
export function digRoundProblems(round: DigRound, mound: { w: number }): string[] {
  const out: string[] = []
  if (round.kind === 'field') {
    const cells = round.cells ?? []
    if (cells.length !== DIG_CELLS) out.push(`the field needs ${DIG_CELLS} mounds`)
    const t = round.treasure
    if (!t) out.push('no treasure')
    else if (t[0] < 0 || t[0] >= DIG_COLS || t[1] < 0 || t[1] >= DIG_ROWS) out.push('the treasure lies outside the 4 x 3 grid')
    for (const [i, c] of cells.entries()) {
      if (c[0] - mound.w / 2 < 0 || c[0] + mound.w / 2 > 100 || c[1] < 0 || c[1] > 100) out.push(`mound ${i + 1} lies outside the picture`)
      for (let k = i + 1; k < cells.length; k++) {
        const d = Math.hypot(cells[k]![0] - c[0], (cells[k]![1] - c[1]) * ASPECT)
        if (d < mound.w * 0.95) out.push(`mounds ${i + 1} and ${k + 1} overlap`)
      }
    }
  } else {
    const slots = round.slots ?? []
    if (slots.length !== DIG_PEARLS) out.push(`the table needs ${DIG_PEARLS} places`)
    if (round.best === undefined || round.best < 0 || round.best >= DIG_PEARLS) out.push('the best pearl needs a place from 0 to 4')
  }
  return out
}

/** The problems of the whole game: round 1 is the field, round 2 the pearls, and five pearls are there. */
export function digProblems(game: DigGame): string[] {
  const out: string[] = []
  if (game.pearls.length !== DIG_PEARLS) out.push(`${DIG_PEARLS} pearls are needed`)
  game.rounds.forEach((r, i) => out.push(...digRoundProblems(r, game.mound).map((p) => `round ${i + 1}: ${p}`)))
  return out
}

// ---------------------------------------------------------------- 2. sweep for the coin (`muenze`)

/** The coin glints when this share of its place is swept free. */
export const COIN_REVEAL = 0.6
/** The brush of the broom: its radius is this share of the width of the picture. */
export const COIN_BRUSH = 7
/** Parts of the task per round: the lamp (1), the sweeping (8) and the lifting of the coin (1). */
export const COIN_LAMP_PARTS = 1
export const COIN_SWEEP_PARTS = 8
export const COIN_PICK_PARTS = 1
export const COIN_PARTS = COIN_LAMP_PARTS + COIN_SWEEP_PARTS + COIN_PICK_PARTS
/** So much of the whole floor swept counts as all of the sweeping parts. */
export const COIN_SWEEP_ENOUGH = 0.4

/** The place of the coin on the grid of the dust: the coin is a little bigger than its picture, and never smaller than about two cells in each direction. */
export function coinRegion(coin: readonly [number, number], w: number): Region {
  const rw = Math.max(w * 1.4, (100 / COLS) * 2.2)
  const rh = Math.max(w * 1.4 * (1 / ASPECT), (100 / ROWS) * 2.2)
  return { x: Math.max(0, coin[0] - rw / 2), y: Math.max(0, coin[1] - rh / 2), w: rw, h: rh }
}

/** The whole floor. */
export const COIN_FLOOR: Region = { x: 0, y: 0, w: 100, h: 100 }

/** The coin glints: its place is swept free by at least 60 %. */
export function coinRevealed(grid: boolean[][], region: Region): boolean {
  return coverage(grid, region) >= COIN_REVEAL
}

/** The parts of the sweeping so far (0 to 8): the share of the whole floor that is free against the share that counts as enough. */
export function coinSweepParts(floorShare: number): number {
  const k = Math.min(1, Math.max(0, floorShare) / COIN_SWEEP_ENOUGH)
  return Math.min(COIN_SWEEP_PARTS, Math.floor(k * COIN_SWEEP_PARTS))
}

/** Stars of "sweep": the same steps as `gleichnisStars`; a round in which the "Help" glimmer was used gives at most two stars. */
export function coinStars(mistakes: number, rounds: number, helped: boolean): number {
  const base = gleichnisStars(mistakes, rounds)
  return helped ? Math.min(2, base) : base
}

/** The problems of the data of a round of `coin` (an empty list is good): the coin lies inside the picture, and no thing that looks like a coin lies on the coin. */
export function coinRoundProblems(round: CoinRound, game: Pick<CoinGame, 'coin' | 'lid' | 'pebble'>): string[] {
  const out: string[] = []
  const [cx, cy] = round.coin
  if (cx < 0 || cx > 100 || cy < 0 || cy > 100) out.push('the coin lies outside the picture')
  const region = coinRegion(round.coin, game.coin.w)
  for (const d of round.decoys ?? []) {
    const w = (d.kind === 'lid' ? game.lid : game.pebble).w
    if (d.x < 0 || d.x > 100 || d.y < 0 || d.y > 100) out.push(`a ${d.kind} lies outside the picture`)
    const near = Math.hypot(d.x - cx, (d.y - cy) * ASPECT) < Math.max(region.w, w) * 0.8
    if (near) out.push(`a ${d.kind} lies on the coin`)
  }
  return out
}

/** The problems of the whole game: two rounds, the first without things that look like a coin, the second with two of them. */
export function coinProblems(game: CoinGame): string[] {
  const out: string[] = []
  game.rounds.forEach((r, i) => out.push(...coinRoundProblems(r, game).map((p) => `round ${i + 1}: ${p}`)))
  return out
}

// ---------------------------------------------------------------- 3. meet the son (`entgegen`)

export const MEET_STEPS = 12
export type Foot = 'left' | 'right'
/** The three gifts of the father in the order of the Bible. */
export const MEET_GIFTS: readonly MeetGiftId[] = ['kleid', 'ring', 'schuhe']

/** One tap on a foot: the first foot is free, then the feet must alternate (the same foot twice runs nothing and is no mistake). */
export function meetTap(steps: number, last: Foot | null, tap: Foot, total: number): { steps: number; last: Foot | null; moved: boolean } {
  if (steps >= total) return { steps, last, moved: false }
  if (last === tap) return { steps, last, moved: false }
  return { steps: steps + 1, last: tap, moved: true }
}

/** The foot that comes next (the other one); both are free at the start. */
export function meetNext(last: Foot | null): Foot | null {
  return last === null ? null : last === 'left' ? 'right' : 'left'
}

/** The place of the father (percent of the width) after `steps` of `total`: he runs from the gate to the place `meet`. */
export function meetFatherX(steps: number, total: number, from: number, meet: number): number {
  if (total <= 0) return meet
  const k = Math.min(1, Math.max(0, steps / total))
  return from + (meet - from) * k
}

/** The father has reached his son. */
export const meetArrived = (steps: number, total: number): boolean => steps >= total

/** The middle between the son and the place where the father stops: the embrace stands there. */
export const meetEmbraceX = (sonX: number, meet: number): number => (sonX + meet) / 2

/** Which picture of the son stands in the yard: all three gifts give the finished one, the robe alone gives the robe, everything else the rags. */
export function meetOutfit(given: readonly string[]): 'ragged' | 'robed' | 'dressed' {
  if (MEET_GIFTS.every((g) => given.includes(g))) return 'dressed'
  return given.includes('kleid') ? 'robed' : 'ragged'
}

/** A gift is given once; the new list, and whether it was new. */
export function meetGive(given: readonly string[], gift: string): { given: string[]; fresh: boolean } {
  if (!(MEET_GIFTS as readonly string[]).includes(gift) || given.includes(gift)) return { given: [...given], fresh: false }
  return { given: [...given, gift], fresh: true }
}

/** The problems of the data of `meet` (an empty list is good): the father runs to the right of the son and never past the gate, twelve steps, three gifts, a run and a gift round. */
export function meetProblems(game: MeetGame): string[] {
  const out: string[] = []
  if (game.steps < 6 || game.steps > 20) out.push('the run should take between 6 and 20 steps')
  if (game.meet <= game.son.x) out.push('the father stops left of the son')
  if (game.meet >= game.father.x) out.push('the father stops right of the gate')
  const ids = game.gifts.map((g) => g.id).sort()
  if (ids.join() !== [...MEET_GIFTS].sort().join()) out.push('the gifts must be robe, ring and shoes')
  if (game.rounds.map((r) => r.kind).join() !== 'run,gifts') out.push('the rounds are the run and the gifts')
  return out
}
