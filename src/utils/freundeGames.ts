/**
 * The pure parts of the two new games of "Jesus Calls His Friends" (the components only draw and listen): "Fill both boats" (Luke 5,7: both boats are filled so full that they almost sink)
 * and "Open the roof" (Mark 2,4: four friends take off the roof above Jesus and let the bed down). Places are percent of the picture (4:3) or of the boat.
 */

export type BoatResult = 'ok' | 'full'

/** One tap on a boat: a fish jumps in, or the boat is already full. */
export function boatStep(count: number, capacity: number): BoatResult {
  return count >= capacity ? 'full' : 'ok'
}

/** Both boats are full when every boat holds as many fish as the mark says. */
export function boatsFull(counts: readonly number[], capacities: readonly number[]): boolean {
  return capacities.length > 0 && capacities.every((c, i) => (counts[i] ?? 0) >= c)
}

/** The place where the fish lie in a boat: a rectangle in percent of the boat's picture. */
export interface Deck {
  x: number
  y: number
  w: number
  h: number
}

/** The middles of the `n` places for fish in the deck: up to three in one row, more in two rows (the upper row has the extra one); percent of the boat's picture. */
export function boatSlots(n: number, deck: Deck): { x: number; y: number }[] {
  if (n <= 0) return []
  const rows = n <= 3 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]
  const out: { x: number; y: number }[] = []
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++) {
      out.push({
        x: deck.x + ((i + 0.5) / count) * deck.w,
        y: deck.y + ((r + 0.5) / rows.length) * deck.h
      })
    }
  })
  return out
}

/** How deep a boat lies in the water: from nothing (empty) to `max` percent of the picture (full). */
export function boatSink(count: number, capacity: number, max: number): number {
  if (capacity <= 0) return 0
  return Math.min(1, Math.max(0, count / capacity)) * max
}

export type RoofResult = 'ok' | 'wrong'

/** One tap on a piece of the roof: the pieces above the free place come off; above the people they stay (dust would fall on them). */
export function roofStep(col: number, free: readonly number[]): RoofResult {
  return free.includes(col) ? 'ok' : 'wrong'
}

/** The hole is open when every free piece is taken off. */
export function roofOpen(removed: readonly number[], free: readonly number[]): boolean {
  return free.length > 0 && free.every((c) => removed.includes(c))
}

/** The strip of the roof in percent of the picture. */
export interface RoofArea {
  x: number
  y: number
  w: number
  h: number
}

/** Which part of the width (percent of the picture, from..to) the piece `col` of `cols` covers. */
export function colRange(col: number, cols: number, area: RoofArea): [number, number] {
  const w = area.w / cols
  return [area.x + col * w, area.x + (col + 1) * w]
}

/** Whether a figure that stands at `x` and is `w` wide (percent of the picture) lies under the piece `col`. */
export function underCol(x: number, w: number, col: number, cols: number, area: RoofArea): boolean {
  const [from, to] = colRange(col, cols, area)
  return x + w / 2 > from && x - w / 2 < to
}

/** The people (their numbers) that lie under the piece `col`; dust falls on them when it is wrongly taken off. */
export function peopleUnder(col: number, cols: number, area: RoofArea, people: readonly { x: number; w: number }[]): number[] {
  const out: number[] = []
  people.forEach((p, i) => {
    if (underCol(p.x, p.w, col, cols, area)) out.push(i)
  })
  return out
}

/** The problems of a round of the roof game (an empty list is good): the hole lies above Jesus and the bed, and no person sits under a free piece. */
export function roofRoundProblems(
  round: { cols: number; free: number[]; jesusX: number; matX: number },
  area: RoofArea,
  people: readonly { x: number; w: number }[],
  jesusW: number,
  matW: number
): string[] {
  const out: string[] = []
  const free = round.free
  if (!free.length) out.push('no free piece')
  const sorted = [...free].sort((a, b) => a - b)
  sorted.forEach((c, i) => {
    if (i > 0 && c !== sorted[i - 1]! + 1) out.push('the free pieces are not next to each other')
  })
  const covers = (x: number, w: number) => {
    const first = colRange(sorted[0] ?? 0, round.cols, area)[0]
    const last = colRange(sorted[sorted.length - 1] ?? 0, round.cols, area)[1]
    return x - w / 2 >= first - 0.01 && x + w / 2 <= last + 0.01
  }
  if (!covers(round.jesusX, jesusW * 0.5)) out.push('Jesus does not sit under the hole')
  if (!covers(round.matX, matW)) out.push('the bed does not land under the hole')
  for (const c of free) {
    const under = peopleUnder(c, round.cols, area, people)
    if (under.length) out.push(`person ${under[0]} sits under the free piece ${c}`)
  }
  return out
}
