import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, dailySeed, dayKey, hashText, mulberry32, newCode, readCode, showCode } from '../src/utils/familyCode'
import { pickQuestions, teamOf, teamScores, type FamilyQuestion } from '../src/utils/familyQuiz'
import { ACTIVITY_WORDS } from '../src/data/activityWords'
import { buildDeck, teamOnTurn, wordsFor } from '../src/utils/familyActivity'

const pool: FamilyQuestion[] = Array.from({ length: 40 }, (_, i) => ({
  q: `Frage ${i}`,
  options: ['a', 'b', 'c'],
  answer: i % 3,
  from: 'X',
  journey: 'X',
  stage: ''
}))

describe('round codes', () => {
  it('a new code has six characters from the alphabet and is read back', () => {
    const code = newCode(40)
    expect(code).toHaveLength(6)
    expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true)
    expect(readCode(code, 40).ok).toBe(true)
  })

  it('is read in lower case, with the dash that showCode puts in and with spaces', () => {
    const code = newCode(40, () => 0.3)
    expect(showCode(code)).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/)
    expect(readCode(showCode(code).toLowerCase(), 40)).toEqual(readCode(code, 40))
    expect(readCode(` ${code.slice(0, 2)} ${code.slice(2)} `, 40).ok).toBe(true)
  })

  it('refuses a text that is no code', () => {
    expect(readCode('', 40)).toEqual({ ok: false, reason: 'format' })
    expect(readCode('ABC', 40)).toEqual({ ok: false, reason: 'format' })
    expect(readCode('ABCDE0', 40)).toEqual({ ok: false, reason: 'format' })
  })

  it('says "version" when the phone has another number of questions', () => {
    const code = newCode(40, () => 0.5)
    expect(readCode(code, 41)).toEqual({ ok: false, reason: 'version' })
  })

  it('the same code gives the same questions in the same order on every phone', () => {
    const code = newCode(40, () => 0.77)
    const a = readCode(code, 40)
    const b = readCode(code.toLowerCase(), 40)
    if (!a.ok || !b.ok) throw new Error('code not read')
    const one = pickQuestions(pool, 10, mulberry32(a.seed))
    const two = pickQuestions(pool, 10, mulberry32(b.seed))
    expect(two).toEqual(one)
    expect(new Set(one.map((q) => q.q)).size).toBe(10)
    // another code asks something else
    const other = readCode(newCode(40, () => 0.12), 40)
    if (!other.ok) throw new Error('code not read')
    expect(pickQuestions(pool, 10, mulberry32(other.seed)).map((q) => q.q)).not.toEqual(one.map((q) => q.q))
  })

  it('the numbers are fixed (every phone must work out the same ones, so they must never change)', () => {
    expect(hashText('abc')).toBe(440920331)
    const r = mulberry32(1)
    const first = [r(), r(), r()]
    const again = mulberry32(1)
    expect([again(), again(), again()]).toEqual(first)
    expect(first.every((x) => x >= 0 && x < 1)).toBe(true)
    expect(newCode(40, () => 0)).toBe('AAAAA' + CODE_ALPHABET[hashText('AAAAA:40') % 32])
  })

  it('the quiz of the day depends on the date only', () => {
    expect(dayKey(new Date(2026, 10, 3))).toBe('2026-11-03')
    expect(dailySeed(new Date(2026, 10, 3, 8))).toBe(dailySeed(new Date(2026, 10, 3, 22)))
    expect(dailySeed(new Date(2026, 10, 3))).not.toBe(dailySeed(new Date(2026, 10, 4)))
  })
})

describe('teams', () => {
  it('people sit alternately in two teams and the points are added up', () => {
    expect([0, 1, 2, 3, 4].map(teamOf)).toEqual([0, 1, 0, 1, 0])
    expect(teamScores([2, 1, 3, 0, 1])).toEqual([6, 1])
    expect(teamScores([])).toEqual([0, 0])
  })
})

describe('family activity', () => {
  it('has all three languages for every word, and no word twice', () => {
    for (const w of ACTIVITY_WORDS) {
      expect(w.de.trim()).not.toBe('')
      expect(w.en.trim()).not.toBe('')
      expect(w.es.trim()).not.toBe('')
    }
    expect(new Set(ACTIVITY_WORDS.map((w) => w.de)).size).toBe(ACTIVITY_WORDS.length)
  })

  it('takes the words of one kind in the language asked for', () => {
    const people = wordsFor('person', 'de')
    expect(people).toContain('Josef')
    expect(people).not.toContain('Arche')
    expect(wordsFor('thing', 'en')).toContain('Ark')
    expect(wordsFor('all', 'es').length).toBe(ACTIVITY_WORDS.length)
  })

  it('builds a deck of different cards with the allowed ways only, never more than there are words', () => {
    const words = wordsFor('all', 'de')
    const deck = buildDeck(words, 12, ['draw'], mulberry32(7))
    expect(deck).toHaveLength(12)
    expect(new Set(deck.map((c) => c.word)).size).toBe(12)
    expect(deck.every((c) => c.mode === 'draw')).toBe(true)
    expect(buildDeck(['A', 'B'], 5, ['act', 'explain'])).toHaveLength(2)
    expect(buildDeck(words, 0, [])).toEqual([])
    expect(buildDeck(words, 30, []).every((c) => ['explain', 'draw', 'act'].includes(c.mode))).toBe(true)
  })

  it('the teams take turns', () => {
    expect([0, 1, 2, 3, 4].map((i) => teamOnTurn(i, 3))).toEqual([0, 1, 2, 0, 1])
  })
})
