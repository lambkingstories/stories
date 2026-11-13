/**
 * "Josefs Land": the texts. German, English and Spanish have the same keys, every key that the screen asks for exists, there is a text for
 * every good, building, animal, decoration, chapter, goal and daily task, and the story of the game (the Bible reference) is in the story card.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import josefsland from '../src/i18n/bigGames/josefsland'
import { ANIMAL_IDS, BUILDING_IDS, DECOR_IDS, GOOD_IDS, PARCELS } from '../src/utils/josefslandData'
import { CHAPTERS, DAILY_POOL, GOALS } from '../src/utils/josefslandGame'

function keys(o: unknown, prefix = ''): string[] {
  if (!o || typeof o !== 'object') return [prefix]
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
}
const has = (o: unknown, path: string): boolean => {
  let cur: unknown = o
  for (const p of path.split('.')) {
    if (!cur || typeof cur !== 'object' || !(p in (cur as Record<string, unknown>))) return false
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string'
}

describe('the texts of Josefs Land', () => {
  it('have the same keys in German, English and Spanish', () => {
    const de = keys(josefsland.de).sort()
    expect(keys(josefsland.en).sort()).toEqual(de)
    expect(keys(josefsland.es).sort()).toEqual(de)
  })

  it('every text is filled in, with the same {placeholders} in all three languages', () => {
    const flat = (o: unknown, p = ''): Array<[string, string]> =>
      !o || typeof o !== 'object' ? [[p, String(o)]] : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, p ? `${p}.${k}` : k))
    const de = new Map(flat(josefsland.de))
    for (const lang of ['en', 'es'] as const) {
      for (const [k, v] of flat(josefsland[lang])) {
        expect(v.trim().length, `${lang} ${k}`).toBeGreaterThan(0)
        const ph = (t: string) => (t.match(/\{(\w+)\}/g) ?? []).sort().join(',')
        expect(ph(v), `${lang} ${k}`).toBe(ph(de.get(k) ?? ''))
      }
    }
  })

  it('there is a name for every good, building, animal, decoration, kind of land, chapter, goal and daily task', () => {
    for (const lang of ['de', 'en', 'es'] as const) {
      const t = josefsland[lang]
      for (const g of GOOD_IDS) expect(has(t, `good.${g}`), `${lang} good.${g}`).toBe(true)
      for (const b of BUILDING_IDS) {
        expect(has(t, `building.${b}`)).toBe(true)
        expect(has(t, `buildingInfo.${b}`)).toBe(true)
      }
      for (const a of ANIMAL_IDS) {
        expect(has(t, `animal.${a}`)).toBe(true)
        expect(has(t, `penName.${a}`)).toBe(true)
      }
      for (const d of DECOR_IDS) expect(has(t, `decor.${d}`)).toBe(true)
      for (const p of PARCELS) {
        expect(has(t, `role.${p.role}`)).toBe(true)
        expect(has(t, `roleInfo.${p.role}`)).toBe(true)
      }
      for (const k of ['caravan', 'village', 'palace', 'hunger', 'brothers', 'dream']) expect(has(t, `kind.${k}`)).toBe(true)
      for (let c = 0; c < CHAPTERS; c++) for (const f of ['title', 'story', 'task']) expect(has(t, `chapter.${c}.${f}`), `${lang} chapter.${c}.${f}`).toBe(true)
      for (const g of GOALS) expect(has(t, `goalStat.${g.stat}`), `${lang} goalStat.${g.stat}`).toBe(true)
      for (const d of DAILY_POOL) expect(has(t, `daily.${d.id}`)).toBe(true)
      for (const r of ['coins', 'level', 'busy', 'full', 'locked', 'goods', 'max', 'none', 'wrong', 'wait']) expect(has(t, `hint.${r}`)).toBe(true)
    }
  })

  it('every text that the screen asks for with a fixed key exists', () => {
    const src = readFileSync(resolve(__dirname, '../src/components/molecules/games/BigGameJosefsLand.vue'), 'utf8')
    const used = new Set<string>()
    for (const m of src.matchAll(/\bT\('([A-Za-z0-9_.]+)'\s*[,)]/g)) used.add(m[1]!)
    expect(used.size).toBeGreaterThan(60)
    for (const k of used) expect(has(josefsland.de, k), `de ${k}`).toBe(true)
  })

  it('the story card says what it is about, names the chapter of the Bible and states the task', () => {
    expect(josefsland.de.intro.story).toContain('Josef')
    expect(josefsland.de.intro.story).toContain('1. Mose 41')
    expect(josefsland.de.intro.task).toMatch(/^Deine Aufgabe:/)
    expect(josefsland.en.intro.task).toMatch(/^Your task:/)
    expect(josefsland.es.intro.task).toMatch(/^Tu tarea:/)
  })
})
