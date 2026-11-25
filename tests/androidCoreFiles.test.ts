import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Journey } from '../src/types/adventure'
import { CARD_ART } from '../src/data/cardArt'

// Android: the media of an adventure lie in its own Play pack, which is loaded only when the child opens the adventure. What the other screens show
// (the gold ring of the map, the cover, the medal, the card, the gift) must therefore lie in the core pack, or those screens show holes.
// (Found on Anton's phone, 25.11.2026: no gold ring on the map, because the ring lies in the folder of Josef.)
const root = resolve(__dirname, '..')
const script = readFileSync(resolve(root, 'scripts/patch-android-assetpack.mjs'), 'utf8')
const kotlin = readFileSync(resolve(root, 'scripts/android-pack/LkMedia.kt'), 'utf8')

const scriptList = (/const CORE_FILES = \[([^\]]*)\]/.exec(script)?.[1] ?? '').split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean)
const kotlinList = (/keepInCore = Regex\("[^"]*\(\?:([^)]*)\)/.exec(kotlin)?.[1] ?? '').split('|').filter(Boolean)

const modules = import.meta.glob('../src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, unknown>>
const all: Journey[] = []
for (const m of Object.values(modules)) {
  for (const v of Object.values(m)) {
    const j = v as Journey
    if (j && typeof j === 'object' && typeof j.id === 'string' && j.map && Array.isArray(j.map.stages) && !all.some((x) => x.id === j.id)) all.push(j)
  }
}
const ids = new Set(all.map((j) => j.id))

/** True when the file lies in an adventure folder (and so in an adventure pack) unless its name is on the core list. */
const inAdventurePack = (path: string): boolean => {
  const m = /^images\/abenteuer\/([^/]+)\/([^/]+)$/.exec(path)
  if (!m || !ids.has(m[1]!)) return false
  return !scriptList.some((prefix) => m[2]!.startsWith(prefix))
}

describe('Android core pack: what every screen shows lies in the core', () => {
  it('the list of the patch script and of the media server is the same', () => {
    expect(scriptList.length).toBeGreaterThan(3)
    expect(kotlinList).toEqual(scriptList)
  })

  it('finds all the adventures', () => {
    expect(all.length).toBeGreaterThanOrEqual(39)
  })

  it.each(all.map((j) => [j.id, j] as const))('%s: ring, cover, medal and gift are not in an adventure pack', (_id, journey) => {
    const files: [string, string | undefined][] = [
      ['ring', journey.map.ring],
      ['cover', journey.cover],
      ['medal', journey.medal],
      ['gift', journey.gift?.image]
    ]
    for (const [what, file] of files) {
      if (!file) continue
      expect(inAdventurePack(file), `${journey.id}: the ${what} (${file}) would lie in an adventure pack`).toBe(false)
    }
  })

  it('the front and the back of every card are in the core', () => {
    for (const [id, art] of Object.entries(CARD_ART)) {
      for (const file of [art.front, art.back]) {
        if (file) expect(inAdventurePack(file), `${id}: ${file}`).toBe(false)
      }
    }
  })
})
