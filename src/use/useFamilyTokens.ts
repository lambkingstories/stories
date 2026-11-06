/**
 * Which travel token every player of the family games has. The eight tokens (caravan, ship, camel, tent, tower, well, harp, fish) are given
 * out once: seat 1 has `tokens[0]`, seat 2 `tokens[1]` and so on. A player picks another token on the setup page; if somebody else has it,
 * the two swap, so nobody ever has the same one. The choice is kept on the device and is the same in all six games.
 */
import { ref } from 'vue'

const KEY = 'lk-family-tokens-v1'
const COUNT = 8

function fresh(): number[] {
  return Array.from({ length: COUNT }, (_, i) => i)
}

function load(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (Array.isArray(raw) && raw.length === COUNT && raw.every((x) => Number.isInteger(x) && x >= 0 && x < COUNT) && new Set(raw).size === COUNT) return raw
  } catch {
    // the standard order
  }
  return fresh()
}

/** The token of every seat (a permutation of 0 to 7); shared by all games. */
const tokens = ref<number[]>(load())

/** The token of a seat (a seat above 7 starts again). */
export function tokenOf(seat: number): number {
  const s = ((seat % COUNT) + COUNT) % COUNT
  return tokens.value[s] ?? s
}

/** Gives the seat this token; the seat that had it gets the token this seat had. */
export function setToken(seat: number, token: number): void {
  const s = ((seat % COUNT) + COUNT) % COUNT
  if (token < 0 || token >= COUNT) return
  const next = tokens.value.slice()
  const other = next.indexOf(token)
  if (other === s) return
  if (other >= 0) next[other] = next[s]!
  next[s] = token
  tokens.value = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // the choice is only kept until the app is closed
  }
}

/** Back to the standard order (for the tests). */
export function resetTokens(): void {
  tokens.value = fresh()
}

export default function useFamilyTokens() {
  return { tokens, tokenOf, setToken }
}
