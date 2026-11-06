/**
 * The round code of the quiz on several phones, with the kind of questions inside it: the first character says which questions are asked
 * (0: easy, 1: medium, 2: hard, 3: mixed, 4: from the adventures), so the people who join do not have to choose anything and cannot choose
 * wrong. The rest works like `familyCode.ts`: five characters for the round, one check character that depends on how many questions this
 * phone has of that kind (another app version or language gives another number, so the check fails and the app says so).
 */
import { CODE_ALPHABET, CODE_BODY, checkChar, hashText } from './familyCode'

/** How many kinds of questions a code can name. */
export const KIND_COUNT = 5

/** A new code for a round of this kind (`poolSize` questions of that kind on this phone). */
export function newKindCode(kind: number, poolSize: number, rand: () => number = Math.random): string {
  let body = CODE_ALPHABET[Math.max(0, Math.min(KIND_COUNT - 1, kind))]!
  for (let i = 1; i < CODE_BODY; i++) body += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)]
  return body + checkChar(body, poolSize)
}

export type KindCodeReading = { ok: true; code: string; seed: number; kind: number } | { ok: false; reason: 'format' | 'version' }

/** What a person typed (capitals or not, with dash or space or not). `sizeOf(kind)` is how many questions this phone has of that kind. */
export function readKindCode(input: string, sizeOf: (kind: number) => number): KindCodeReading {
  const code = input.toUpperCase().replace(/[\s-]/g, '')
  if (code.length !== CODE_BODY + 1 || [...code].some((c) => !CODE_ALPHABET.includes(c))) return { ok: false, reason: 'format' }
  const kind = CODE_ALPHABET.indexOf(code[0]!)
  if (kind >= KIND_COUNT) return { ok: false, reason: 'format' }
  const body = code.slice(0, CODE_BODY)
  if (checkChar(body, sizeOf(kind)) !== code[CODE_BODY]) return { ok: false, reason: 'version' }
  return { ok: true, code, seed: hashText(body), kind }
}
