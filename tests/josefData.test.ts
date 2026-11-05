/**
 * The data of "Josef" with the five new games of 5.11.2026 (Anton's game plan): the order of the games, the checkers of the new games give no problems on the real data,
 * every picture is there, the old games of these stages are gone (counting, memory, the second colouring page, the picture search), and the English words lie over the same shape.
 */
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { adventureLanguage } from '@/use/adventureLanguage'
import { embraceProblems, meetingProblems, nileCowsProblems, sheavesProblems, winePressProblems } from '@/utils/josefNeu'
import type { EmbraceGame, MeetingGame, NileCowsGame, SheavesGame, WinePressGame } from '@/utils/josefNeu'

const task = (id: number) => josef.stages.find((s) => s.id === id)!.task as unknown as Record<string, unknown> & { kind: string; hint: string }
const webpIn = (v: unknown): string[] =>
  typeof v === 'string' ? (v.endsWith('.webp') ? [v] : []) : Array.isArray(v) ? v.flatMap(webpIn) : v && typeof v === 'object' ? Object.values(v).flatMap(webpIn) : []

describe('Josef: the games', () => {
  it('has the games of the plan: two known ones (puzzle 1, colouring 6) and the five new ones', () => {
    expect(josef.stages.map((s) => s.task.kind as string)).toEqual([
      'puzzle', 'garben', 'quiz', 'weg', 'ernten', 'ausmalen', 'keltern', 'kuehenil', 'sortieren', 'quiz', 'umarmen', 'begegnung'
    ])
    // the old games of these stages are gone
    for (const k of ['zaehlen', 'memory', 'wimmelbild']) expect(josef.stages.some((s) => (s.task.kind as string) === k), k).toBe(false)
    expect(josef.stages.filter((s) => s.task.kind === 'ausmalen')).toHaveLength(1)
  })

  it('the checkers of the five new games find no problem in the real data', () => {
    expect(sheavesProblems(task(2).sheavesBow as SheavesGame)).toEqual([])
    expect(winePressProblems(task(7).winePress as WinePressGame)).toEqual([])
    expect(nileCowsProblems(task(8).nileCows as NileCowsGame)).toEqual([])
    expect(embraceProblems(task(11).embrace2 as EmbraceGame)).toEqual([])
    expect(meetingProblems(task(12).meeting as MeetingGame)).toEqual([])
  })

  it('every picture of the new games is there and not too big', () => {
    const files = [2, 7, 8, 11, 12].flatMap((id) => webpIn(task(id)))
    expect(files.length).toBeGreaterThan(30)
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('two questions after a game, three in the two told stages', () => {
    for (const s of josef.stages) expect(s.questions.length, `stage ${s.id}`).toBe(s.task.kind === 'quiz' ? 3 : 2)
  })

  it('the English words lie over the same shape: hints of the rounds and the names of the brothers', () => {
    adventureLanguage.value = 'en'
    try {
      expect(task(2).hint).toContain('sheaf')
      const hug = task(11).embrace2 as EmbraceGame
      expect(hug.rounds[0]!.hint).toContain('Benjamin')
      expect(hug.rounds[1]!.brothers.map((b) => b.name)).toContain('Naphtali')
      expect((task(12).meeting as MeetingGame).rounds[1]!.hint).toContain('two fingers')
      expect((task(7).winePress as WinePressGame).rounds[0]!.hint).toContain('Press')
      expect((task(8).nileCows as NileCowsGame).rounds[1]!.hint).toContain('fat')
    } finally {
      adventureLanguage.value = 'de'
    }
    expect((task(11).embrace2 as EmbraceGame).rounds[1]!.brothers.map((b) => b.name)).toContain('Naftali')
  })
})
