/**
 * "Nehemias Mauer": the 60 levels in six chapters after Nehemiah 3 and 6 (the sheep gate, the tower, the fish gate, the valley gate, the spring and
 * water gates, the whole wall). A level is a skyline of column heights (with the opening of a gate under a lintel here and there); golden flags
 * mark the top of the columns. The child builds any wall that touches all the flags. The weather grows from chapter to chapter.
 */
import { newGame, type Game, type GameDef } from '@/utils/nehemiaMauerGame'

export interface LevelDef extends GameDef {
  /** 0..5 */
  chapter: number
  /** 0..9 inside the chapter */
  index: number
  /** The column heights of the skyline. */
  heights: number[]
  /** Openings of gates at the foot: [first column, width, height]. */
  gates: [number, number, number][]
  /** The left edge of the skyline in the world. */
  x0: number
  /** The word of a hint that comes with the first level of a thing (see the texts). */
  intro?: string
}

const digits = (s: string) => s.replace(/\s/g, '').split('').map((ch) => (ch >= 'a' ? ch.charCodeAt(0) - 87 : Number(ch)))

/** Wall with two towers and a gate between them. */
function gateWall(tw: number, T: number, wl: number, H: number): string {
  return String(T).repeat(tw) + String(H).repeat(wl) + String(T).repeat(tw)
}

interface Row {
  h: string
  g?: [number, number, number][]
  intro?: string
}

const ROWS: Row[][] = [
  // 1. the sheep gate: a piece of wall, calm
  [
    { h: '3', intro: 'move' },
    { h: '4' },
    { h: '33', intro: 'turn' },
    { h: '44' },
    { h: '333', intro: 'hold' },
    { h: '2345' },
    { h: '444' },
    { h: '3553' },
    { h: '5555' },
    { h: '45554' }
  ],
  // 2. the tower: tall and narrow, gusts of wind
  [
    { h: '5', intro: 'wind' },
    { h: '6' },
    { h: '55' },
    { h: '7' },
    { h: '66' },
    { h: '575' },
    { h: '8' },
    { h: '77' },
    { h: '696' },
    { h: '888' }
  ],
  // 3. the fish gate: a gate opening under a lintel, rain (slippery stones)
  [
    { h: '4444', g: [[1, 2, 2]], intro: 'gate' },
    { h: '5555', g: [[1, 2, 3]], intro: 'rain' },
    { h: '55555', g: [[2, 2, 2]] },
    { h: '666666', g: [[2, 2, 3]] },
    { h: '466664', g: [[2, 2, 3]] },
    { h: '5555555', g: [[1, 2, 2], [4, 2, 2]] },
    { h: '6666666', g: [[1, 2, 3], [4, 2, 3]] },
    { h: '7777777', g: [[2, 2, 4]] },
    { h: '577775', g: [[2, 2, 4]] },
    { h: '666666666', g: [[1, 2, 3], [4, 2, 3]] }
  ],
  // 4. the valley gate: long wall with battlements, the earth shakes now and then
  [
    { h: '444', intro: 'quake' },
    { h: '5454' },
    { h: '45454' },
    { h: '454545' },
    { h: '664466' },
    { h: '55555' },
    { h: '6464646' },
    { h: '5757575' },
    { h: '46646646' },
    { h: '55755755' }
  ],
  // 5. spring gate and water gate: towers and gates, wind and rain
  [
    { h: gateWall(1, 6, 4, 4), g: [[2, 2, 2]], intro: 'both' },
    { h: gateWall(2, 6, 4, 4), g: [[3, 2, 2]] },
    { h: gateWall(1, 7, 4, 5), g: [[2, 2, 3]] },
    { h: gateWall(2, 7, 4, 5), g: [[3, 2, 3]] },
    { h: gateWall(1, 7, 6, 4), g: [[2, 2, 2], [4, 2, 2]] },
    { h: gateWall(2, 8, 4, 5), g: [[3, 2, 3]] },
    { h: gateWall(1, 8, 6, 5), g: [[2, 2, 3], [4, 2, 3]] },
    { h: gateWall(2, 8, 6, 5), g: [[3, 2, 3], [5, 2, 3]] },
    { h: gateWall(1, 9, 4, 6), g: [[2, 2, 4]] },
    { h: gateWall(2, 9, 6, 6), g: [[3, 2, 4]] }
  ],
  // 6. the whole wall: everything together, at night
  [
    { h: '4688643', intro: 'night' },
    { h: '35799753', g: [[3, 2, 2]] },
    { h: '3579 7 5 5 3', g: [[4, 2, 2]] },
    { h: '56a8658a65', g: [[4, 2, 2]] },
    { h: '6aa66aa6', g: [[3, 2, 3]] },
    { h: '6 8 a a 8 8 a a 8 6', g: [[4, 2, 3]] },
    { h: '7 9 b 9 7 7 9 b 9 7', g: [[4, 2, 4]] },
    { h: '5 8 b 8 6 6 8 b 8 5', g: [[4, 2, 4]] },
    { h: '6 9 b b 9 9 b b 9 6', g: [[4, 2, 4]] },
    { h: '6 8 b b 8 8 b b 8 6', g: [[4, 2, 5]], intro: 'end' }
  ]
]

const WEIGHTS: number[][] = [
  [4, 4, 2, 1, 2, 0],
  [3, 4, 3, 2, 2, 1],
  [2, 3, 3, 4, 2, 1],
  [3, 4, 3, 2, 2, 1],
  [2, 3, 3, 3, 2, 2],
  [2, 3, 3, 3, 2, 2]
]
const WIND = [0, 3.4, 0, 0, 3, 3.4]
const RAIN = [false, false, true, false, true, true]
const QUAKE = [false, false, false, true, false, true]

/** The flags: at the top of the columns (every column of a narrow wall, every second one of a wide wall). */
function flags(heights: number[], x0: number): { x: number; y: number }[] {
  const n = heights.length
  const out: { x: number; y: number }[] = []
  for (let c = 0; c < n; c++) {
    if (heights[c]! <= 0) continue
    if (n > 6 && c % 2 === 1 && c !== n - 1) continue
    out.push({ x: x0 + c + 0.5, y: heights[c]! - 0.5 })
  }
  return out
}

export const LEVELS: LevelDef[] = ROWS.flatMap((rows, chapter) =>
  rows.map((r, index): LevelDef => {
    const heights = digits(r.h)
    const n = heights.length
    const width = Math.max(8, n + 4)
    const x0 = (width - n) / 2
    const gates = r.g ?? []
    let cells = heights.reduce((a, b) => a + b, 0)
    for (const [, gw, gh] of gates) cells -= gw * gh
    return {
      chapter,
      index,
      heights,
      gates,
      x0,
      width,
      base: n + 2,
      marks: flags(heights, x0),
      weights: WEIGHTS[chapter]!,
      wind: WIND[chapter]!,
      rain: RAIN[chapter]!,
      quake: QUAKE[chapter]!,
      night: chapter === 5,
      par: Math.round((cells / 2.3) * 1.5) + 2,
      seed: 5200 + chapter * 100 + index * 13,
      intro: r.intro
    }
  })
)

export const CHAPTER_COUNT = 6
export const LEVELS_PER_CHAPTER = 10

/** A new game of a level. */
export function levelGame(i: number): Game {
  return newGame(LEVELS[i]!)
}
