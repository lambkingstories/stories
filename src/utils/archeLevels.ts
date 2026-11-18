/**
 * The levels of "Arche der Tierpaare": 60 levels in 6 chapters of ten. Pure data (no random in the building: the board of a level comes from
 * its map and its start value `seed`, see `newGame`). The maps are written as text:
 *   `.` nothing  `#` floor  `S` stone  `W` water  `K` crate (two hits)  `N` netted animal  `C` caged animal  `B` floor with a feed basket
 * The moves of each level were set with the bot of `tests/archeSim.test.ts` (it plays a level well but without foresight), so that the early levels
 * are won nearly always and the late ones about every second or third time; the test keeps that curve.
 */
import type { Goal, Level } from './archeGame'

/** The animals by name (indices into `KIND_NAMES`). */
const E = 0 // elefant
const G = 1 // giraffe
const L = 2 // loewe
const S = 3 // schaf
const D = 4 // esel
const Z = 5 // zebra
const F = 6 // frosch

const full = (cols: number, rows: number) => Array.from({ length: rows }, () => '#'.repeat(cols))

/** The maps. Every cell that is not a stone is reachable by falling or sliding (the tests check it). */
export const MAPS: Record<string, string[]> = {
  r5x6: full(5, 6),
  r6x7: full(6, 7),
  r7x7: full(7, 7),
  r7x8: full(7, 8),
  // cut corners: the board looks like a basket
  korb7: ['.#####.', '#######', '#######', '#######', '#######', '#######', '#######', '.#####.'],
  raute: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
  // crates
  kisten5: ['#####', '#####', '#K#K#', '#####', '#####', '#####'],
  kisten7: ['#######', '#######', '##K#K##', '#######', '##K#K##', '#######', '#######'],
  kistenring: ['#######', '#KKKKK#', '#K###K#', '#K###K#', '#K###K#', '#KKKKK#', '#######'],
  kistenreihe: ['#######', '#######', '#######', 'KKK#KKK', '#######', '#######', '#######', '#######'],
  // stones
  steine6: ['######', '######', '#S##S#', '######', '######', '#S##S#', '######'],
  steine7: ['#######', '#######', 'S#####S', '#######', '###S###', '#######', 'S#####S', '#######'],
  gasse: ['#######', '#######', '##S#S##', '#######', '##S#S##', '#######', '#######', '#######'],
  saeulen: ['#######', '#######', '#S###S#', '#S###S#', '#######', '#######', '#######', '#######'],
  // water
  wasser5: ['W###W', '#####', '#####', '#####', '#####', 'W###W'],
  wasserreihe: ['#######', '#######', '#######', '#######', '#######', 'WWWWWWW'],
  wassermitte: ['#######', '#######', '###W###', '##WWW##', '###W###', '#######', '#######'],
  wasserseite: ['W######', 'W######', 'W######', '#######', '#######', '#######', '#######', '#######'],
  wasserecken: ['W#####W', '#######', '#######', '#######', '#######', '#######', '#######', 'W#####W'],
  wassernetz: ['#######', '#N###N#', '###W###', '##WWW##', '###W###', '#N###N#', '#######'],
  // nets
  netze6: ['######', '######', '##NN##', '######', '##NN##', '######', '######'],
  netze7: ['#######', '#N###N#', '#######', '###N###', '#######', '#N###N#', '#######', '#######'],
  // cages
  kaefige6: ['######', '######', '#C##C#', '######', '######', '#C##C#', '######'],
  kaefige7: ['#######', '#######', '##C#C##', '#######', '###C###', '#######', '##C#C##', '#######'],
  // baskets (from the top)
  koerbe6: ['#B##B#', '######', '######', '######', '######', '######', '######'],
  koerbe7: ['#B###B#', '#######', '#######', '#######', '#######', '#######', '#######', '#######'],
  koerbewasser: ['#B###B#', '#######', '#######', '#######', '#######', '#######', 'W#####W'],
  // mixed
  mix1: ['#######', '#K###K#', '#######', '##W#W##', '#######', '#N###N#', '#######', '#######'],
  mix2: ['W#####W', '#######', '#S###S#', '#######', '##C#C##', '#######', '#K###K#', '#######'],
  mix3: ['#######', '##KWK##', '#######', '#S###S#', '#######', '##NCN##', '#######', '#######'],
  mix4: ['.#####.', '#######', '#W###W#', '#######', '#S#C#S#', '#######', '#K###K#', '.#####.'],
  mix5: ['#######', 'W#####W', '#######', '#S#N#S#', '#######', '#C###C#', '#######', 'KK###KK'],
  mix6: ['#######', '#K#W#K#', '#######', '#S#C#S#', '#######', '#N#K#N#', '#######', '#######'],
  mix7: ['W#####W', '#KS#SK#', '#######', '#N#C#N#', '#######', '#S#K#S#', '#######', 'W#####W']
}

const kind = (k: number, n: number): Goal => ({ t: 'kind', kind: k, n })
const dove = (n: number): Goal => ({ t: 'dove', n })
const olive = (n: number): Goal => ({ t: 'olive', n })
const rainbow = (n: number): Goal => ({ t: 'rainbow', n })
const water: Goal = { t: 'water', n: 0 }
const crates: Goal = { t: 'crate', n: 0 }
const nets: Goal = { t: 'net', n: 0 }
const cages: Goal = { t: 'cage', n: 0 }
const basket = (n: number): Goal => ({ t: 'basket', n })
const score = (n: number): Goal => ({ t: 'score', n })
/** "Pairs": two of each animal of the level. */
const pairs = (ks: number[], n = 2): Goal[] => ks.map((k) => kind(k, n))

export interface Def {
  map: string
  kinds: number[]
  goals: Goal[]
  moves: number
  dropEvery?: number
  dropTotal?: number
  rise?: number
}

const k4 = [S, E, G, L]
const k5 = [S, E, G, L, D]
const k5b = [E, G, L, Z, F]
const k5c = [S, D, Z, F, E]
const k6 = [S, E, G, L, D, Z]
const k6b = [S, E, L, D, Z, F]
const k7 = [S, E, G, L, D, Z, F]
export const KIND_SETS = { k4, k5, k5b, k5c, k6, k6b, k7 }

/** One list per chapter: Aufbruch, Regen, Flut, Auf dem Wasser, Taube, Regenbogen. */
export const CHAPTERS: Def[][] = [
  // chapter 1
  [
    { map: 'r5x6', kinds: k4, goals: [kind(S, 12)], moves: 10 },
    { map: 'r5x6', kinds: k4, goals: [kind(S, 10), kind(E, 10)], moves: 12 },
    { map: 'r6x7', kinds: k4, goals: [dove(1), kind(G, 10)], moves: 10 },
    { map: 'r6x7', kinds: k4, goals: [olive(1), kind(L, 12)], moves: 12 },
    { map: 'r6x7', kinds: k4, goals: [rainbow(1), kind(E, 10)], moves: 40 },
    { map: 'kisten5', kinds: k4, goals: [crates], moves: 10 },
    { map: 'steine6', kinds: k5, goals: [kind(G, 12), kind(L, 10)], moves: 18 },
    { map: 'korb7', kinds: k5, goals: [kind(D, 20), kind(S, 20)], moves: 20 },
    { map: 'koerbe6', kinds: k5, goals: [basket(2)], moves: 36, dropEvery: 6, dropTotal: 2 },
    { map: 'kisten7', kinds: k5, goals: [crates, kind(E, 20)], moves: 20 }
  ],
  // chapter 2
  [
    { map: 'wasser5', kinds: k5, goals: [water], moves: 12 },
    { map: 'wasserseite', kinds: k5, goals: [water, kind(G, 24)], moves: 20 },
    { map: 'netze6', kinds: k5, goals: [nets], moves: 12 },
    { map: 'wasserecken', kinds: k5b, goals: [water, kind(F, 12)], moves: 20 },
    { map: 'r7x7', kinds: k5, goals: [kind(S, 18), kind(E, 18), kind(G, 18), kind(L, 18)], moves: 18 },
    { map: 'r7x8', kinds: k5, goals: [dove(3), olive(2)], moves: 24 },
    { map: 'wassernetz', kinds: k5c, goals: [water, nets, kind(Z, 16)], moves: 20 },
    { map: 'koerbe7', kinds: k5, goals: [basket(2), kind(L, 10)], moves: 28, dropEvery: 5, dropTotal: 2 },
    { map: 'mix1', kinds: k5, goals: [crates, water, kind(E, 16)], moves: 14 },
    { map: 'mix1', kinds: k5b, goals: [crates, water, nets], moves: 16 }
  ],
  // chapter 3
  [
    { map: 'wasser5', kinds: k5, goals: [water], moves: 12, rise: 3 },
    { map: 'kaefige6', kinds: k5, goals: [cages], moves: 16 },
    { map: 'wasserseite', kinds: k5c, goals: [water, kind(E, 26)], moves: 24, rise: 3 },
    { map: 'kaefige7', kinds: k6, goals: [cages, kind(G, 10)], moves: 28 },
    { map: 'wasserecken', kinds: k5b, goals: [water, kind(L, 24)], moves: 24, rise: 3 },
    { map: 'mix2', kinds: k5, goals: [cages, water], moves: 24, rise: 4 },
    { map: 'koerbewasser', kinds: k5c, goals: [basket(2), water], moves: 26, dropEvery: 5, dropTotal: 2, rise: 4 },
    { map: 'mix3', kinds: k5, goals: [cages, nets, crates], moves: 16 },
    { map: 'wassermitte', kinds: k6, goals: [water, kind(S, 18), kind(D, 14)], moves: 24, rise: 2 },
    { map: 'mix4', kinds: k5b, goals: [cages, water, crates], moves: 14, rise: 4 }
  ],
  // chapter 4
  [
    { map: 'gasse', kinds: k5b, goals: [kind(E, 28), kind(Z, 28)], moves: 28 },
    { map: 'saeulen', kinds: k5, goals: [dove(4), kind(S, 28)], moves: 22 },
    { map: 'kistenring', kinds: k6, goals: [crates], moves: 26 },
    { map: 'steine7', kinds: k6b, goals: [kind(E, 16), kind(L, 16), kind(D, 16), kind(Z, 16)], moves: 28 },
    { map: 'mix5', kinds: k5, goals: [water, cages, crates], moves: 22 },
    { map: 'kistenreihe', kinds: k5c, goals: [crates, basket(3)], moves: 28, dropEvery: 5, dropTotal: 3 },
    { map: 'mix6', kinds: k5b, goals: [water, cages, nets, crates], moves: 14 },
    { map: 'raute', kinds: k5b, goals: [olive(1), kind(Z, 8)], moves: 22 },
    { map: 'mix7', kinds: k5, goals: [water, cages, nets], moves: 52, rise: 4 },
    { map: 'mix6', kinds: k6b, goals: [water, cages, nets, crates, kind(F, 20)], moves: 28, rise: 5 }
  ],
  // chapter 5
  [
    { map: 'r7x8', kinds: k5, goals: [dove(4), olive(3)], moves: 22 },
    { map: 'korb7', kinds: k5c, goals: [olive(3), dove(3)], moves: 24 },
    { map: 'kaefige7', kinds: k6, goals: [cages, dove(4)], moves: 26 },
    { map: 'koerbe7', kinds: k5, goals: [basket(4), olive(2)], moves: 34, dropEvery: 4, dropTotal: 4 },
    { map: 'mix3', kinds: k6b, goals: [cages, nets, olive(1)], moves: 40 },
    { map: 'wassermitte', kinds: k5b, goals: [water, dove(4), olive(2)], moves: 22 },
    { map: 'mix4', kinds: k6, goals: [cages, water, crates, olive(1)], moves: 28, rise: 5 },
    { map: 'steine7', kinds: k5, goals: [rainbow(1), dove(3)], moves: 36 },
    { map: 'mix5', kinds: k6b, goals: [water, cages, nets, dove(4)], moves: 28 },
    { map: 'mix7', kinds: k5, goals: [water, cages, nets, olive(1)], moves: 34, rise: 5 }
  ],
  // chapter 6
  [
    { map: 'mix1', kinds: k6b, goals: [crates, water, nets, kind(F, 30)], moves: 32 },
    { map: 'mix2', kinds: k6, goals: [cages, water, basket(1)], moves: 46, dropEvery: 5, dropTotal: 1, rise: 5 },
    { map: 'mix3', kinds: k5, goals: [cages, nets, crates, rainbow(1)], moves: 38 },
    { map: 'mix4', kinds: k6b, goals: [cages, water, crates, dove(4)], moves: 24, rise: 5 },
    { map: 'mix5', kinds: k6, goals: [water, cages, crates, basket(1)], moves: 52, dropEvery: 6, dropTotal: 1 },
    { map: 'mix6', kinds: k6b, goals: [water, cages, nets, crates, olive(1)], moves: 32, rise: 5 },
    { map: 'mix7', kinds: k5b, goals: [water, cages, nets, rainbow(1)], moves: 36, rise: 4 },
    { map: 'kistenring', kinds: k7, goals: [crates, kind(E, 14), kind(G, 14), kind(L, 14), kind(D, 14), kind(Z, 14), kind(F, 14)], moves: 34 },
    { map: 'mix5', kinds: k6, goals: [water, cages, nets, crates, olive(1), dove(1)], moves: 44, rise: 5 },
    { map: 'mix4', kinds: k6, goals: [cages, water, crates, basket(2), dove(2)], moves: 46, dropEvery: 6, dropTotal: 2, rise: 6 }
  ]
]

export const CHAPTER_COUNT = CHAPTERS.length
export const LEVELS_PER_CHAPTER = 10

/** All 60 levels in order. */
export const LEVELS: Level[] = CHAPTERS.flatMap((list, chapter) =>
  list.map((d, i): Level => {
    const id = chapter * LEVELS_PER_CHAPTER + i + 1
    const level: Level = { id, chapter, moves: d.moves, map: MAPS[d.map]!, kinds: d.kinds, goals: d.goals, seed: 1000 + id * 37 }
    if (d.dropEvery) level.dropEvery = d.dropEvery
    if (d.dropTotal) level.dropTotal = d.dropTotal
    if (d.rise) level.rise = d.rise
    return level
  })
)

/** The seeds the simulation (and the tests) play every level with. */
export const SIM_SEEDS = (level: Level, n: number): number[] => Array.from({ length: n }, (_, i) => level.seed + i * 7919)

/** The names of the chapters are texts: `app.bigGames.arche.chapters`. The animal that comes on board for a won level (a pair of it). */
export const PAIR_KIND = (levelIndex: number): number => [S, E, G, L, D, Z, F][levelIndex % 7]!
