/**
 * Parental gate: a two-digit number written out in words that the person has to
 * type in ("dreiundvierzig" → 43). A grown-up reads it at a glance and needs no
 * calculator; a 6–8 year old cannot yet read compound number words, so a child
 * tapping around gets nowhere. It is shown before anything that leaves the app
 * (links, the share sheet) or costs money (tips, later the subscription).
 *
 * App Review Guideline 1.3 (Kids Category) and Google Play's Families policy
 * both ask for this. It is also what lets the age rating stay at 4+ even though
 * the app links to a website: the link is no longer reachable by a child.
 *
 * Usage: `if (!(await requireParent())) return`. The promise resolves `true`
 * after a correct answer and `false` when the dialog is dismissed. On the web
 * build there is nobody to protect and no store rule, so it resolves `true`
 * straight away (see `GATE_REQUIRED`).
 */
import { ref } from 'vue'

/**
 * Native shells (Tauri Android/iOS, Electron) set `VITE_APP_NATIVE=true`.
 * `VITE_PARENTAL_GATE=true` forces the gate on in a browser build for testing.
 */
export const GATE_REQUIRED: boolean =
  import.meta.env.VITE_APP_NATIVE === 'true' || import.meta.env.VITE_PARENTAL_GATE === 'true'

export interface GateChallenge {
  /** The number to type, 21–99 and never a round ten, so the word is always a compound. */
  number: number
}

const DE_UNITS = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun']
const DE_TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']
const EN_UNITS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** 21–99 as a word: "dreiundvierzig" / "forty-three". Any language but English falls back to German like the rest of the app. */
export function numberWord(n: number, locale: string): string {
  const tens = Math.floor(n / 10)
  const unit = n % 10
  if (n < 21 || n > 99 || unit === 0) return String(n)
  return locale === 'en' ? `${EN_TENS[tens]}-${EN_UNITS[unit]}` : `${DE_UNITS[unit]}und${DE_TENS[tens]}`
}

/** `rand` is injectable so the tests can pin the number. */
export function createChallenge(rand: () => number = Math.random): GateChallenge {
  // 72 numbers: 21–99 without the nine round tens.
  const index = Math.floor(rand() * 72)
  const tens = 2 + Math.floor(index / 9)
  const unit = 1 + (index % 9)
  return { number: tens * 10 + unit }
}

const isOpen = ref(false)
const challenge = ref<GateChallenge>(createChallenge())
let pending: ((ok: boolean) => void) | null = null

function settle(ok: boolean) {
  isOpen.value = false
  const resolve = pending
  pending = null
  resolve?.(ok)
}

export function requireParent(): Promise<boolean> {
  if (!GATE_REQUIRED) return Promise.resolve(true)
  // A second request while one is open replaces it; the first caller gets "no".
  pending?.(false)
  challenge.value = createChallenge()
  isOpen.value = true
  return new Promise<boolean>((resolve) => {
    pending = resolve
  })
}

export default function useParentalGate() {
  return {
    isOpen,
    challenge,
    /** Fresh numbers after a wrong answer, so trial and error never repeats the same number. */
    newChallenge: () => {
      challenge.value = createChallenge()
    },
    pass: () => settle(true),
    cancel: () => settle(false)
  }
}
