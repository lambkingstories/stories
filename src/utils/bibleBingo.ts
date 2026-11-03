/**
 * Bible bingo: a person of the Bible is called (by name, or by three hints), and whoever has the person on the card ticks it. Whoever has a
 * whole row, column or diagonal calls "Bingo". The card has sixteen of the people in four rows. Nothing is shared between the devices: at
 * the table one person reads aloud (and may play, too), or with a round code every phone calls the people by itself. These are the pure
 * parts (the cards, the draw order, the lines), so they can be tested.
 */
import { WHO_PEOPLE } from '@/data/whoAmI'
import { shuffle } from '@/utils/familyQuiz'

export const BINGO_SIZE = 4
export const BINGO_CELLS = BINGO_SIZE * BINGO_SIZE

/** The lines that win: every row, every column and the two diagonals (positions 0 to 15, row by row). */
export const BINGO_LINES: readonly (readonly number[])[] = (() => {
  const n = BINGO_SIZE
  const at = (r: number, c: number) => r * n + c
  const lines: number[][] = []
  for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c) => at(r, c)))
  for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r) => at(r, c)))
  lines.push(Array.from({ length: n }, (_, i) => at(i, i)))
  lines.push(Array.from({ length: n }, (_, i) => at(i, n - 1 - i)))
  return lines
})()

/** A card: sixteen different people (their numbers in `WHO_PEOPLE`) in random places. */
export function makeCard(rand: () => number = Math.random, people: number = WHO_PEOPLE.length): number[] {
  return shuffle(Array.from({ length: people }, (_, i) => i), rand).slice(0, BINGO_CELLS)
}

/** The order in which the people are called. */
export function drawOrder(rand: () => number = Math.random, people: number = WHO_PEOPLE.length): number[] {
  return shuffle(Array.from({ length: people }, (_, i) => i), rand)
}

/** True when the ticked fields hold a whole line. */
export function hasBingo(marked: readonly boolean[]): boolean {
  return BINGO_LINES.some((line) => line.every((p) => marked[p]))
}

/** True when the card is really a bingo: a whole line of ticks, and every tick is a person that was called. */
export function isTrueBingo(card: readonly number[], marked: readonly boolean[], drawn: readonly number[]): boolean {
  const real = marked.map((m, p) => !!m && drawn.includes(card[p]!))
  return hasBingo(real)
}
