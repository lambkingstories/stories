/**
 * Anton's rule for the questions after a stage (5.11.2026), for every adventure at once: two questions after a stage with a game,
 * three in a stage without one (only questions: a serious stage). The exam at the end keeps its six.
 */
import { describe, expect, it, vi } from 'vitest'
import type { Journey } from '@/types/adventure'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const modules = import.meta.glob('../src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, unknown>>
const isJourney = (v: unknown): v is Journey =>
  !!v && typeof v === 'object' && Array.isArray((v as Journey).stages) && Array.isArray((v as Journey).exam) && typeof (v as Journey).id === 'string'
const all = new Map<string, Journey>()
for (const mod of Object.values(modules)) for (const v of Object.values(mod)) if (isJourney(v)) all.set(v.id, v)

describe('questions after a stage', () => {
  it('finds the adventures', () => {
    expect(all.size).toBeGreaterThanOrEqual(29)
  })

  it.each([...all.keys()])('%s: two questions after a game, three in a stage without one; the exam has six', (id) => {
    const j = all.get(id)!
    for (const s of j.stages) {
      if (s.soon) continue
      expect(s.questions.length, `${id} stage ${s.id} (${s.task?.kind})`).toBe(s.task?.kind === 'quiz' ? 3 : 2)
    }
    expect(j.exam).toHaveLength(6)
  })
})
