/**
 * The logic of three games of "Alles wird neu" (`offenbarung`): "Write it in a book" (`schreiben`), "Seven letters" (`briefe`) and "All join in" (`lob`).
 * The arithmetic is pure: the checks of the data (`*Problems`) accept the samples and name what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import {
  WRITE_DONE,
  lettersFits,
  lettersGate,
  lettersLength,
  lettersPointAt,
  lettersProblems,
  lettersWalkMs,
  offDist,
  praiseProblems,
  praiseQuietest,
  praiseTap,
  praiseVolume,
  praiseZoneAt,
  writeAtWell,
  writeDips,
  writeFrac,
  writeLineYs,
  writeOnLine,
  writeProblems,
  writeStep
} from '@/utils/offenbarungNeuA'
import { LETTERS, PRAISE, WRITE } from './offenbarungSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('offDist', () => {
  it('shortens the vertical difference by the ratio of the picture', () => {
    expect(offDist({ x: 0, y: 0 }, { x: 30, y: 0 }, 1.5)).toBeCloseTo(30)
    expect(offDist({ x: 0, y: 0 }, { x: 0, y: 30 }, 1.5)).toBeCloseTo(20)
  })
})

describe('schreiben: the pen, the ink and the line', () => {
  it('the samples are playable', () => {
    expect(writeProblems(WRITE)).toEqual([])
  })

  it('the lines of a round are in the middle of the sheet', () => {
    expect(writeLineYs(WRITE, 3)).toEqual([38, 50, 62])
    expect(writeLineYs(WRITE, 5)).toEqual([26, 38, 50, 62, 74])
    expect(writeLineYs(WRITE, 1)).toEqual([50])
  })

  it('the share of the line, the band around a line and the inkwell', () => {
    expect(writeFrac(WRITE, 15)).toBe(0)
    expect(writeFrac(WRITE, 68)).toBe(1)
    expect(writeFrac(WRITE, 41.5)).toBeCloseTo(0.5)
    expect(writeFrac(WRITE, 99)).toBe(1)
    expect(writeOnLine(WRITE, { x: 40, y: 50 }, 50)).toBe(true)
    expect(writeOnLine(WRITE, { x: 40, y: 56 }, 50)).toBe(true)
    expect(writeOnLine(WRITE, { x: 40, y: 62 }, 50)).toBe(false)
    expect(writeAtWell(WRITE, { x: 88, y: 40 })).toBe(true)
    expect(writeAtWell(WRITE, { x: 70, y: 40 })).toBe(false)
  })

  it('a dip lasts for 60 percent of a line of length 1; the pen never writes farther than the ink reaches', () => {
    const a = writeStep(0, 1, 0.9, 0.6, 1)
    expect(a.w).toBeCloseTo(0.6)
    expect(a.ink).toBe(0)
    expect(a.dry).toBe(true)
    const b = writeStep(0, 1, 0.3, 0.6, 1)
    expect(b.w).toBeCloseTo(0.3)
    expect(b.ink).toBeCloseTo(0.5)
    expect(b.dry).toBe(false)
  })

  it('writing never goes back; a longer line needs more ink for the same share', () => {
    const a = writeStep(0.5, 0.5, 0.2, 0.6, 1)
    expect(a.w).toBe(0.5)
    expect(a.ink).toBe(0.5)
    const long = writeStep(0, 1, 0.3, 0.6, 1.6)
    expect(long.ink).toBeCloseTo(1 - (0.3 * 1.6) / 0.6)
  })

  it('a pen without ink writes nothing and is dry at once', () => {
    const r = writeStep(0.2, 0, 0.5, 0.6, 1)
    expect(r.w).toBe(0.2)
    expect(r.dry).toBe(true)
  })

  it('the end of the line counts from 97 percent, and then the whole line is written', () => {
    const r = writeStep(0.9, 1, WRITE_DONE, 0.6, 1)
    expect(r.w).toBe(1)
    const e = writeStep(0.9, 1, 0.96, 0.6, 1)
    expect(e.w).toBeCloseTo(0.96)
  })

  it('round 1 takes 5 dips at least, round 2 takes 14', () => {
    expect(writeDips(WRITE, WRITE.rounds[0]!)).toBe(5)
    expect(writeDips(WRITE, WRITE.rounds[1]!)).toBe(14)
  })

  it('damaged data are found', () => {
    const a = copy(WRITE)
    a.inkwellAt = { x: 50, y: 50, r: 9 }
    expect(writeProblems(a).join(' ')).toContain('inkwell touches the band')
    const b = copy(WRITE)
    b.band = 2
    expect(writeProblems(b).join(' ')).toContain('band')
    const c = copy(WRITE)
    c.rounds[1]!.lineLength = 5
    expect(writeProblems(c).join(' ')).toContain('not sensible')
    const d = copy(WRITE)
    d.rounds[1]!.lines = 3
    expect(writeProblems(d).join(' ')).toContain('more lines')
    const e = copy(WRITE)
    e.lineYs = [30, 40, 50, 60, 70]
    e.band = 6
    expect(writeProblems(e).join(' ')).toContain('too close')
    const f = copy(WRITE)
    f.inkPerDip = 0.1
    expect(writeProblems(f).join(' ')).toContain('between 0.3 and 1')
    const g = copy(WRITE)
    g.rounds[1]!.lineLength = 1.9
    g.inkPerDip = 0.3
    expect(writeProblems(g).join(' ')).toContain('sixteen dips')
  })
})

describe('briefe: the road, the gates and the letters', () => {
  it('the samples are playable', () => {
    expect(lettersProblems(LETTERS)).toEqual([])
  })

  it('the road is measured in units and a place on it is found by the share of the walk', () => {
    const len = lettersLength(LETTERS.path)
    expect(len).toBeGreaterThan(80)
    expect(lettersPointAt(LETTERS.path, 0)).toEqual({ x: 10, y: 80 })
    expect(lettersPointAt(LETTERS.path, 1)).toEqual({ x: 85, y: 70 })
    const half = lettersPointAt(LETTERS.path, 0.5)
    expect(half.x).toBeGreaterThan(10)
    expect(half.x).toBeLessThan(85)
    expect(lettersPointAt([], 0.3)).toEqual({ x: 0, y: 0 })
  })

  it('the messenger walks at the same speed on every stretch: milliseconds are the stretch times the length over the speed', () => {
    const len = lettersLength(LETTERS.path)
    expect(lettersWalkMs(LETTERS, 0, 1)).toBeCloseTo((len * 1000) / LETTERS.speed)
    expect(lettersWalkMs(LETTERS, 0.2, 0.2)).toBe(0)
    expect(lettersWalkMs(LETTERS, 0.5, 0.2)).toBeCloseTo(lettersWalkMs(LETTERS, 0.2, 0.5))
  })

  it('a letter fits only the city at the gate', () => {
    expect(lettersFits('smyrna', 'smyrna')).toBe(true)
    expect(lettersFits('smyrna', 'sardes')).toBe(false)
    const g = lettersGate(LETTERS, LETTERS.cities[0]!)
    expect(g.x).toBeGreaterThanOrEqual(10)
  })

  it('damaged data are found', () => {
    const a = copy(LETTERS)
    a.cities[2]!.at = 0.1
    expect(lettersProblems(a).join(' ')).toContain('does not come after')
    const b = copy(LETTERS)
    b.rounds[0]!.tray = ['ephesus', 'smyrna', 'pergamon']
    expect(lettersProblems(b).join(' ')).toContain('must not hold the letters in the order of the visit')
    const c = copy(LETTERS)
    c.rounds[1]!.names = true
    expect(lettersProblems(c).join(' ')).toContain('without the names')
    const d = copy(LETTERS)
    d.cities[1]!.at = 0.07
    expect(lettersProblems(d).join(' ')).toContain('too close')
    const e = copy(LETTERS)
    e.rounds[0]!.cities = ['smyrna', 'ephesus', 'pergamon']
    expect(lettersProblems(e).join(' ')).toContain('first 3 of the road')
    const f = copy(LETTERS)
    f.path = f.path.slice(0, 2)
    expect(lettersProblems(f).join(' ')).toContain('four places')
    const g = copy(LETTERS)
    g.rounds[1]!.tray = g.rounds[1]!.tray.slice(1)
    expect(lettersProblems(g).join(' ')).toContain('satchel')
  })
})

describe('lob: the groups and their song', () => {
  it('the samples are playable', () => {
    expect(praiseProblems(PRAISE)).toEqual([])
  })

  it('round 1: only the next group of the verse is right; a group that sings is no mistake', () => {
    expect(praiseTap(PRAISE.order, [], 'himmel')).toBe('ok')
    expect(praiseTap(PRAISE.order, [], 'meer')).toBe('wrong')
    expect(praiseTap(PRAISE.order, ['himmel'], 'erde')).toBe('ok')
    expect(praiseTap(PRAISE.order, ['himmel'], 'meer')).toBe('wrong')
    expect(praiseTap(PRAISE.order, ['himmel'], 'himmel')).toBe('again')
    expect(praiseTap(PRAISE.order, ['himmel', 'erde'], 'meer')).toBe('ok')
  })

  it('round 2: the song gets quieter bit by bit, never at once, and a group with an offset starts lower', () => {
    const z = PRAISE.zones[0]!
    expect(praiseVolume(z, 0)).toBe(1)
    expect(praiseVolume(z, 3500)).toBeCloseTo(0.5)
    expect(praiseVolume(z, 7000)).toBe(0)
    expect(praiseVolume(z, 99999)).toBe(0)
    const m = PRAISE.zones[2]!
    expect(praiseVolume(m, 0)).toBeCloseTo(1 - 2000 / 6000)
    let last = 1
    for (let t = 0; t <= 7000; t += 50) {
      const v = praiseVolume(z, t)
      expect(last - v).toBeLessThan(0.01)
      last = v
    }
  })

  it('the quietest group and the group at a place', () => {
    expect(praiseQuietest([0.9, 0.3, 0.6])).toBe(1)
    expect(praiseQuietest([0.5, 0.5, 0.5])).toBe(0)
    expect(praiseZoneAt(PRAISE.zones, { x: 50, y: 10 })).toBe(0)
    expect(praiseZoneAt(PRAISE.zones, { x: 50, y: 50 })).toBe(1)
    expect(praiseZoneAt(PRAISE.zones, { x: 50, y: 95 })).toBe(2)
  })

  it('damaged data are found', () => {
    const a = copy(PRAISE)
    a.order = ['himmel', 'erde', 'erde']
    expect(praiseProblems(a).join(' ')).toContain('order')
    const b = copy(PRAISE)
    b.zones[1]!.box.top = 20
    expect(praiseProblems(b).join(' ')).toContain('overlap')
    const c = copy(PRAISE)
    c.zones[0]!.fade = 40000
    expect(praiseProblems(c).join(' ')).toContain('fade')
    const d = copy(PRAISE)
    d.duration = 5000
    expect(praiseProblems(d).join(' ')).toContain('10 to 30 seconds')
    const e = copy(PRAISE)
    e.zones.forEach((z) => (z.offset = 0))
    e.zones.forEach((z) => (z.fade = 6000))
    expect(praiseProblems(e).join(' ')).toContain('same moment')
    const f = copy(PRAISE)
    f.zones[2]!.box.top = 95
    expect(praiseProblems(f).join(' ')).toContain('too low')
    const g = copy(PRAISE)
    g.rounds = [{ hint: 'x' }]
    expect(praiseProblems(g).join(' ')).toContain('two rounds')
  })
})
