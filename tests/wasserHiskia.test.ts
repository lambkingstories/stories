import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import wasser from '@/i18n/bigGames/wasser'
import { LEVELS, WORLDS } from '@/utils/wasserLevels'

const DIR = 'public/images/spiele-gross/wasser/'
type Texts = { story: { text: string; task: string }[]; worlds: { name: string; ref: string }[]; levels: string[] }

describe('Wasser: the first world is Hezekiah\'s tunnel (not Moses any more)', () => {
  it('the world is called hiskia, its twelve levels end in the pool and none says Moses', () => {
    expect(WORLDS[0]!.id).toBe('hiskia')
    const first = LEVELS.slice(0, 12)
    expect(first.every((l) => l.world === 0 && l.vessel === 'teich' && l.id.startsWith('hiskia-'))).toBe(true)
    expect(LEVELS.some((l) => l.id.startsWith('mose'))).toBe(false)
  })

  it('texts in german, english and spanish: the story names the tunnel, no Moses, a Bible reference, twelve level names', () => {
    for (const lang of ['de', 'en', 'es'] as const) {
      const tx = wasser[lang] as unknown as Texts
      const head = [tx.story[0]!.text, tx.story[0]!.task, tx.worlds[0]!.name, tx.worlds[0]!.ref, ...tx.levels.slice(0, 12)].join(' | ')
      expect(head, lang).not.toMatch(/Mose|Moses|Moisés|Refidim|Rephidim|Felsen schlag|Strike the rock|Golpea/i)
      expect(tx.worlds[0]!.ref, lang).toMatch(/20[,:]20/)
      expect(tx.story[0]!.text, lang).toMatch(/Hiskia|Hezekiah|Ezequías/)
      expect(tx.levels.slice(0, 12).every((x) => x.trim().length > 0), lang).toBe(true)
    }
  })

  it('the pictures of the tunnel world exist, the pictures of the Moses world are gone', () => {
    for (const f of ['bg-hiskia', 'erde-hiskia', 'fels-hiskia', 'gihon', 'teich', 'hacke', 'kachel-hiskia']) expect(existsSync(DIR + f + '.webp'), f).toBe(true)
    for (const f of ['bg-mose', 'fels-zu', 'fels-auf', 'stab', 'erde-1', 'fels-1', 'kachel']) expect(existsSync(DIR + f + '.webp'), f).toBe(false)
  })
})
