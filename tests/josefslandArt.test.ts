/**
 * "Josefs Land": the painted pictures. Every picture the game draws is there (no coloured box is ever shown), nothing in the folder is unused,
 * and the whole folder stays below the size that the app allows (14 MB).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, statSync } from 'fs'
import { resolve } from 'path'
import { ALL_PICTURES, LATE_PICTURES, animalPic, barnPic, buildingPic, decorPic, fieldPic, goodPic, granaryPic } from '../src/utils/josefslandArt'
import { ANIMAL_IDS, BUILDING_IDS, CROP_IDS, DECOR_IDS, GOOD_IDS } from '../src/utils/josefslandData'

const DIR = resolve(__dirname, '../public/images/spiele-gross/josefsland')

describe('the pictures of Josefs Land', () => {
  it('every picture that the game loads exists', () => {
    for (const n of [...ALL_PICTURES, ...LATE_PICTURES]) expect(existsSync(`${DIR}/${n}.webp`), n).toBe(true)
  })

  it('every picture that the game asks for by a rule is in the list that is loaded', () => {
    const all = new Set(ALL_PICTURES)
    for (const c of CROP_IDS) for (let s = 0; s < 4; s++) expect(all.has(fieldPic(c, s)), fieldPic(c, s)).toBe(true)
    for (const b of BUILDING_IDS) for (const l of [1, 3]) expect(all.has(buildingPic(b, l))).toBe(true)
    for (const l of [1, 3, 6]) {
      expect(all.has(barnPic(l))).toBe(true)
      expect(all.has(granaryPic(l))).toBe(true)
    }
    for (const a of ANIMAL_IDS) for (const e of [true, false]) expect(all.has(animalPic(a, e))).toBe(true)
    for (const g of GOOD_IDS) expect(all.has(goodPic(g)), goodPic(g)).toBe(true)
    for (const d of DECOR_IDS) expect(all.has(decorPic(d)), decorPic(d)).toBe(true)
  })

  it('there is no unused picture in the folder, and the folder is small enough', () => {
    const used = new Set([...ALL_PICTURES, ...LATE_PICTURES, 'kachel'].map((n) => `${n}.webp`))
    const files = readdirSync(DIR)
    for (const f of files) expect(used.has(f), `unused: ${f}`).toBe(true)
    const total = files.reduce((n, f) => n + statSync(`${DIR}/${f}`).size, 0)
    expect(total).toBeLessThan(14 * 1024 * 1024)
    for (const f of files) expect(statSync(`${DIR}/${f}`).size, f).toBeLessThan(700 * 1024)
  })
})
