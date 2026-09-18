import { ref } from 'vue'

/**
 * Parental gate for the iOS App Store build. The app ships in Apple's Kids
 * Category, and App Review Guideline 1.3 allows links out of the app only
 * "behind a parental gate". `openExternal` awaits `requestParentalGate()`
 * before it hands any URL to the system browser; `ParentalGate.vue` (mounted
 * once in App.vue) renders whatever question is pending here.
 *
 * The question is a multiplication answered by typing the number, not by
 * picking from choices, so a young child can neither solve nor guess it.
 */
export interface GateQuestion {
  a: number
  b: number
}

export const gateQuestion = ref<GateQuestion | null>(null)
let pending: ((passed: boolean) => void) | null = null

// 3..9 × 3..9 → products 9..81: past counting on fingers, trivial for an adult.
export function newGateQuestion(random: () => number = Math.random): GateQuestion {
  const pick = () => 3 + Math.floor(random() * 7)
  return { a: pick(), b: pick() }
}

export function isGateAnswerCorrect(question: GateQuestion, answer: string): boolean {
  const trimmed = answer.trim()
  return /^\d+$/.test(trimmed) && Number(trimmed) === question.a * question.b
}

/** Resolves `true` once a grown-up answered correctly, `false` if they cancelled. */
export function requestParentalGate(): Promise<boolean> {
  // A second request while the gate is open (a double tap on a link) cancels
  // the first one, so its caller doesn't wait forever.
  pending?.(false)
  gateQuestion.value = newGateQuestion()
  return new Promise((resolve) => {
    pending = resolve
  })
}

export function settleParentalGate(passed: boolean): void {
  gateQuestion.value = null
  const resolve = pending
  pending = null
  resolve?.(passed)
}
