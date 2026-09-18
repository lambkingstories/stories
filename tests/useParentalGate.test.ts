import { describe, it, expect, beforeEach } from 'vitest'
import {
  gateQuestion,
  isGateAnswerCorrect,
  newGateQuestion,
  requestParentalGate,
  settleParentalGate
} from '@/use/useParentalGate'

/**
 * The iOS build ships in Apple's Kids Category, where every link out of the
 * app must sit behind a parental gate (App Review Guideline 1.3). These pin
 * the gate's two promises: a child can't pass it by guessing, and a caller
 * always gets an answer.
 */
beforeEach(() => {
  settleParentalGate(false)
})

describe('newGateQuestion', () => {
  it('keeps both factors between 3 and 9', () => {
    expect(newGateQuestion(() => 0)).toEqual({ a: 3, b: 3 })
    expect(newGateQuestion(() => 0.9999)).toEqual({ a: 9, b: 9 })
    for (let i = 0; i < 200; i++) {
      const { a, b } = newGateQuestion()
      expect(a).toBeGreaterThanOrEqual(3)
      expect(a).toBeLessThanOrEqual(9)
      expect(b).toBeGreaterThanOrEqual(3)
      expect(b).toBeLessThanOrEqual(9)
    }
  })
})

describe('isGateAnswerCorrect', () => {
  const question = { a: 7, b: 8 }

  it('accepts the typed product, surrounding spaces included', () => {
    expect(isGateAnswerCorrect(question, '56')).toBe(true)
    expect(isGateAnswerCorrect(question, ' 56 ')).toBe(true)
  })

  it.each(['55', '', ' ', '56abc', '5.6e1', '-56', '0x38'])('rejects %j', (answer) => {
    expect(isGateAnswerCorrect(question, answer)).toBe(false)
  })
})

describe('requestParentalGate', () => {
  it('shows a question and resolves with the outcome', async () => {
    const passed = requestParentalGate()
    expect(gateQuestion.value).not.toBeNull()

    settleParentalGate(true)

    await expect(passed).resolves.toBe(true)
    expect(gateQuestion.value).toBeNull()
  })

  it('resolves false when the grown-up cancels', async () => {
    const passed = requestParentalGate()
    settleParentalGate(false)
    await expect(passed).resolves.toBe(false)
  })

  it('cancels an earlier request instead of leaving it waiting forever', async () => {
    const first = requestParentalGate()
    const second = requestParentalGate()

    await expect(first).resolves.toBe(false)
    settleParentalGate(true)
    await expect(second).resolves.toBe(true)
  })
})
