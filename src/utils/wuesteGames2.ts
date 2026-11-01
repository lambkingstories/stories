/**
 * The pure parts of seven games of "The People in the Desert" (the components only draw and listen): water jugs, "Enough!", quails, Aaron's staffs, the bronze sign, the donkey and Joshua's commission.
 * Places are percent of the picture (4:3), `y` is the bottom edge of a thing.
 */

// ------------------------------------------------------------------ places
export interface Rect {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Is the point inside the rectangle (all in percent of the picture)? */
export function inRect(x: number, y: number, r: Rect): boolean {
  return x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2
}

// ------------------------------------------------------------------ water jugs
export interface JugState {
  jar: 'empty' | 'full'
  served: number[]
}
export type JugTarget = { kind: 'spring' } | { kind: 'person'; index: number }
/** What a tap did: the jug was filled, a person drank, the jug is empty (a mistake), the jug is full already, the person was served before, or nothing happened. */
export type JugResult = 'filled' | 'served' | 'empty' | 'full' | 'again'

/** The jug goes to the spring (and is full) or to a person (who drinks, if the jug is full). A person who is not thirsty in this round does not count. */
export function jugStep(state: JugState, target: JugTarget, thirsty: readonly number[]): { state: JugState; result: JugResult } {
  if (target.kind === 'spring') {
    if (state.jar === 'full') return { state, result: 'full' }
    return { state: { ...state, jar: 'full' }, result: 'filled' }
  }
  if (!thirsty.includes(target.index) || state.served.includes(target.index)) return { state, result: 'again' }
  if (state.jar === 'empty') return { state, result: 'empty' }
  return { state: { jar: 'empty', served: [...state.served, target.index] }, result: 'served' }
}

/** Everybody who was thirsty has had water. */
export function allServed(served: readonly number[], thirsty: readonly number[]): boolean {
  return thirsty.length > 0 && thirsty.every((i) => served.includes(i))
}

// ------------------------------------------------------------------ enough
export type EnoughVerdict = 'early' | 'ok' | 'late'

/** Moses is tapped: too early (the heap does not reach the mark yet), right (the mark is reached, but not by more than `over` gifts), or the people brought so many that he had to call himself. */
export function enoughVerdict(count: number, need: number, over: number): EnoughVerdict {
  if (count < need) return 'early'
  return count <= need + over ? 'ok' : 'late'
}

/** The places for the gifts of the heap: rows from a base of `base` gifts upward, each row one gift narrower; the middle of each gift (percent of the picture), `gw` the width of a gift. */
export function heapSlots(n: number, heap: { x: number; y: number; w: number }, gw: number): { x: number; y: number }[] {
  const base = Math.max(2, Math.floor(heap.w / gw))
  const out: { x: number; y: number }[] = []
  let row = 0
  let inRow = base
  let placed = 0
  while (placed < n) {
    for (let k = 0; k < inRow && placed < n; k++) {
      out.push({ x: heap.x - ((inRow - 1) * gw * 0.9) / 2 + k * gw * 0.9, y: heap.y - row * gw * 0.62 - gw * 0.5 })
      placed++
    }
    row++
    inRow = Math.max(1, inRow - 1)
  }
  return out
}

/** The height (y) of the mark: the top of the gift with the number `need`. */
export function heapMarkY(need: number, heap: { x: number; y: number; w: number }, gw: number): number {
  const s = heapSlots(need, heap, gw)
  return (s[s.length - 1]?.y ?? heap.y) - gw * 0.4
}

// ------------------------------------------------------------------ quails
/** A repeatable place for the quail number `i` on the ground (a little spread by the golden ratio, so that two quails in a row never land next to each other); `salt` changes it for another round. */
export function quailSpot(i: number, ground: { x1: number; x2: number; y1: number; y2: number }, salt = 0): { x: number; y: number } {
  const g = 0.6180339887
  const fx = ((i + 1 + salt * 0.37) * g) % 1
  const fy = ((i + 1 + salt * 0.11) * g * g * 3.1) % 1
  return { x: ground.x1 + fx * (ground.x2 - ground.x1), y: ground.y1 + fy * (ground.y2 - ground.y1) }
}

// ------------------------------------------------------------------ staffs
/** The place of the staff number `i` of `n` in the row: the foot (percent of the picture). */
export function staffSlot(i: number, n: number, row: { y: number; x1: number; x2: number }): { x: number; y: number } {
  if (n <= 1) return { x: (row.x1 + row.x2) / 2, y: row.y }
  return { x: row.x1 + (i / (n - 1)) * (row.x2 - row.x1), y: row.y }
}

// ------------------------------------------------------------------ the pole
/** The angle of the pole when the finger is at (px, py) and the foot of the pole at (bx, by): 0 = upright, negative = leaning left, in degrees, never lower than -85 or higher than 85. The picture is 4:3, so the height counts 0.75 of a width. */
export function poleAngle(bx: number, by: number, px: number, py: number): number {
  const dx = px - bx
  const dy = (by - py) / 0.75 // percent of the height to percent of the width
  const a = (Math.atan2(dx, dy) * 180) / Math.PI
  return Math.max(-85, Math.min(85, a))
}

/** The pole stands when it is within `tol` degrees of upright. */
export function poleStands(angle: number, tol = 10): boolean {
  return Math.abs(angle) <= tol
}

// ------------------------------------------------------------------ commission
/** Is Joshua near enough to the spot (distance in percent of the picture width, the height counted in widths)? */
export function dropOk(x: number, y: number, spot: { x: number; y: number }, radius: number): boolean {
  return Math.hypot(x - spot.x, (y - spot.y) * 0.75) <= radius
}

/** How far the finger has held: 0 to 1. */
export function holdShare(ms: number, need: number): number {
  return need <= 0 ? 1 : Math.min(1, Math.max(0, ms / need))
}
