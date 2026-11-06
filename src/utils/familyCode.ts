/**
 * Round codes for the quiz on several phones without a server: a short code decides which questions are asked and in which order, so
 * every phone that gets the same code plays the same round. Nothing is sent anywhere: each phone works it out by itself.
 *
 * A code has six characters: five for the round and one check character that depends on the number of questions the phone has. When
 * two phones have another app version (so another number of questions), the check fails and the app says so instead of silently asking
 * other questions. The "quiz of the day" works the same way with the date as the round.
 */

/** 32 characters, without 0, O, 1 and I (they are mixed up when a code is told over the table). */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_BODY = 5
export const ROUND_QUESTIONS = 10
export const DAILY_QUESTIONS = 5

/** A small, fast generator whose numbers depend only on the seed (the same seed gives the same row on every phone). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a: a number out of a text, the same on every phone. */
export function hashText(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export const checkChar = (body: string, poolSize: number) => CODE_ALPHABET[hashText(`${body}:${poolSize}`) % CODE_ALPHABET.length]!

/** A new code for a round (five characters from `rand`, one check character for `poolSize` questions). */
export function newCode(poolSize: number, rand: () => number = Math.random): string {
  let body = ''
  for (let i = 0; i < CODE_BODY; i++) body += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]
  return body + checkChar(body, poolSize)
}

/** The code the way it is shown and told: two groups of three ("K7M-4QX"). */
export const showCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`

export type CodeReading = { ok: true; code: string; seed: number } | { ok: false; reason: 'format' | 'version' }

/**
 * What a person typed: capital letters or not, with a dash or a space or not. `format` when it is no code at all (wrong length or a
 * character that is not in the alphabet), `version` when it is one but this phone has another number of questions than the phone that
 * made it.
 */
export function readCode(input: string, poolSize: number): CodeReading {
  const code = input.toUpperCase().replace(/[\s-]/g, '')
  if (code.length !== CODE_BODY + 1 || [...code].some((c) => !CODE_ALPHABET.includes(c))) return { ok: false, reason: 'format' }
  const body = code.slice(0, CODE_BODY)
  if (checkChar(body, poolSize) !== code[CODE_BODY]) return { ok: false, reason: 'version' }
  return { ok: true, code, seed: hashText(body) }
}

/** The day as it is told ("2026-11-03"), by the clock of the phone. */
export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** The seed of the quiz of the day: every phone with the same date plays the same questions. */
export const dailySeed = (d: Date = new Date()) => hashText(`tag:${dayKey(d)}`)
