import { beforeEach, describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { noah } from '@/data/adventures/noah'
import type { StageTask } from '@/types/adventure'
import { jobNoteKey, paintJobsOf, readJobResults, saveJobResults } from '@/utils/paintJobs'
import { colorFamilyOf, evaluateJob, FILL_SHARE, TOOL_CODES } from '@/utils/toolMap'

/** A picture on a small grid: RGBA with `cells` painted in one colour. */
const W = 20
const H = 10
const blank = () => new Uint8ClampedArray(W * H * 4)
const painted = (cells: number[], rgb: [number, number, number] = [200, 30, 30], alpha = 255) => {
  const px = blank()
  for (const c of cells) px.set([...rgb, alpha], c * 4)
  return px
}
const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i)

describe('the colour families: light, normal and dark shades of one colour belong together', () => {
  it.each([
    ['green', [[150, 230, 120], [40, 170, 70], [20, 90, 40]]],
    ['brown', [[205, 160, 110], [139, 90, 43], [80, 50, 25]]],
    ['blue', [[150, 200, 250], [30, 90, 210], [15, 40, 110], [20, 190, 220]]],
    ['yellow', [[255, 245, 130], [250, 220, 40], [254, 239, 55]]],
    ['red', [[230, 30, 30], [150, 15, 15], [240, 90, 80]]],
    ['orange', [[255, 140, 0], [250, 160, 40]]],
    ['purple', [[130, 60, 200], [190, 140, 230], [70, 30, 110]]],
    ['pink', [[240, 120, 180], [255, 170, 190], [255, 190, 200]]]
  ] as const)('%s takes its light, normal and dark shades', (name, colors) => {
    for (const [r, g, b] of colors) expect(colorFamilyOf(r, g, b), `${name} ${r},${g},${b}`).toBe(name)
  })

  it('white, grey and almost black belong to no family', () => {
    expect(colorFamilyOf(255, 255, 255)).toBeNull()
    expect(colorFamilyOf(245, 245, 240)).toBeNull()
    expect(colorFamilyOf(128, 128, 128)).toBeNull()
    expect(colorFamilyOf(20, 20, 22)).toBeNull()
    expect(colorFamilyOf(0, 0, 0)).toBeNull()
  })

  it('the neighbours stay apart: yellow is not orange, brown is not red, blue is not green', () => {
    expect(colorFamilyOf(250, 220, 40)).not.toBe('orange')
    expect(colorFamilyOf(139, 90, 43)).not.toBe('red')
    expect(colorFamilyOf(30, 90, 210)).not.toBe('green')
    expect(colorFamilyOf(255, 140, 0)).not.toBe('yellow')
  })
})

describe('is a task done?', () => {
  const zone = new Uint8Array(W * H)
  for (const i of range(0, 100)) zone[i] = 1
  const noMap = new Uint8Array(W * H)

  it('a tool: 80 % of the zone painted with the tool', () => {
    const codes = new Uint8Array(W * H).fill(TOOL_CODES.felt)
    expect(evaluateJob({ codes, rgba: painted(range(0, 100)), zone, tool: 'felt' })).toMatchObject({ status: 'met', fill: 1 })
    // a gap: 79 of 100 cells are not enough, 80 are
    expect(evaluateJob({ codes, rgba: painted(range(0, 79)), zone, tool: 'felt' }).status).toBe('more')
    expect(evaluateJob({ codes, rgba: painted(range(0, 80)), zone, tool: 'felt' })).toMatchObject({ status: 'met', fill: FILL_SHARE })
  })

  it('the wrong tool is "wrong" (a good part of the zone is painted with another one), a little paint is only "more"', () => {
    const codes = new Uint8Array(W * H).fill(TOOL_CODES.pencil)
    expect(evaluateJob({ codes, rgba: painted(range(0, 100)), zone, tool: 'felt' }).status).toBe('wrong')
    expect(evaluateJob({ codes, rgba: painted(range(0, 10)), zone, tool: 'felt' }).status).toBe('more')
    expect(evaluateJob({ codes, rgba: blank(), zone, tool: 'felt' }).status).toBe('more')
  })

  it('only the paint inside the zone counts: the rest of the picture is free', () => {
    const codes = new Uint8Array(W * H)
    for (const i of range(0, 100)) codes[i] = TOOL_CODES.watercolor
    for (const i of range(100, 200)) codes[i] = TOOL_CODES.pencil
    expect(evaluateJob({ codes, rgba: painted(range(0, 200)), zone, tool: 'watercolor' }).status).toBe('met')
  })

  it('a place whose tool is not known (a picture saved before the map existed) does NOT count as right', () => {
    expect(evaluateJob({ codes: noMap, rgba: painted(range(0, 100)), zone, tool: 'pencil' }).status).toBe('wrong')
  })

  it('a colour: light, normal and dark shades of the family count; other colours and white do not', () => {
    for (const rgb of [[150, 230, 120], [40, 170, 70], [20, 90, 40]] as [number, number, number][]) {
      expect(evaluateJob({ codes: noMap, rgba: painted(range(0, 100), rgb), zone, color: 'green' }).status).toBe('met')
    }
    expect(evaluateJob({ codes: noMap, rgba: painted(range(0, 100), [30, 90, 210]), zone, color: 'green' }).status).toBe('wrong')
    expect(evaluateJob({ codes: noMap, rgba: painted(range(0, 100), [250, 250, 250]), zone, color: 'green' }).status).toBe('wrong')
    expect(evaluateJob({ codes: noMap, rgba: blank(), zone, color: 'green' }).status).toBe('more')
  })

  it('shades mixed in one zone: light, normal and dark green together are done', () => {
    const px = painted(range(0, 100), [40, 170, 70])
    for (const c of range(0, 30)) px.set([150, 230, 120, 255], c * 4)
    for (const c of range(30, 60)) px.set([20, 90, 40, 255], c * 4)
    expect(evaluateJob({ codes: noMap, rgba: px, zone, color: 'green' }).status).toBe('met')
  })

  it('both asked (tool and colour): both have to be right in a place', () => {
    const codes = new Uint8Array(W * H).fill(TOOL_CODES.pencil)
    const brown = painted(range(0, 100), [139, 90, 43])
    expect(evaluateJob({ codes, rgba: brown, zone, tool: 'pencil', color: 'brown' }).status).toBe('met')
    expect(evaluateJob({ codes: new Uint8Array(W * H).fill(TOOL_CODES.felt), rgba: brown, zone, tool: 'pencil', color: 'brown' }).status).toBe('wrong')
    expect(evaluateJob({ codes, rgba: painted(range(0, 100), [230, 30, 30]), zone, tool: 'pencil', color: 'brown' }).status).toBe('wrong')
  })

  it('a faint rest of an earlier colour does not make a task "wrong"', () => {
    const px = painted(range(0, 100), [250, 220, 40])
    for (const c of range(0, 33)) px.set([230, 30, 30, 30], c * 4)
    // the faint cells are not yellow, so 67 % are right: not done yet, but "more", not "wrong"
    expect(evaluateJob({ codes: noMap, rgba: px, zone, color: 'yellow' }).status).toBe('more')
  })
})

describe('the stars of a picture: every task that is done is one star (0 to 3)', () => {
  const stars = (statuses: ('met' | 'wrong' | 'more')[]) => statuses.filter((s) => s === 'met').length

  it('three tasks give zero to three stars', () => {
    expect(stars(['wrong', 'more', 'more'])).toBe(0)
    expect(stars(['met', 'wrong', 'more'])).toBe(1)
    expect(stars(['met', 'met', 'more'])).toBe(2)
    expect(stars(['met', 'met', 'met'])).toBe(3)
  })

  it('what is told for a task that is not done: the wrong tool, the wrong colour, both, or not enough', () => {
    const tool = { zone: 'a', tool: 'felt' as const, hint: 'x' }
    const color = { zone: 'a', color: 'blue' as const, hint: 'x' }
    const both = { zone: 'a', tool: 'felt' as const, color: 'blue' as const, hint: 'x' }
    expect(jobNoteKey(tool, 'wrong')).toBe('app.adventure.paintWrongTool')
    expect(jobNoteKey(color, 'wrong')).toBe('app.adventure.paintWrongColor')
    expect(jobNoteKey(both, 'wrong')).toBe('app.adventure.paintWrongBoth')
    expect(jobNoteKey(tool, 'more')).toBe('app.adventure.paintJobMore')
    expect(jobNoteKey(tool, 'met')).toBeNull()
  })

  it('the result of the last "done" is kept for the page that shows it', () => {
    localStorage.clear()
    expect(readJobResults('j', 1)).toEqual([])
    saveJobResults('j', 1, ['met', 'wrong', 'more'])
    expect(readJobResults('j', 1)).toEqual(['met', 'wrong', 'more'])
    expect(readJobResults('j', 2)).toEqual([])
  })
})

describe('the tasks that are drawn by chance', () => {
  const pool = [
    { zone: 'a', tool: 'felt' as const, hint: 'A1' },
    { zone: 'a', tool: 'pencil' as const, hint: 'A2' },
    { zone: 'b', color: 'blue' as const, hint: 'B' },
    { zone: 'c', color: 'yellow' as const, hint: 'C' },
    { zone: 'd', color: 'green' as const, hint: 'D' },
    { zone: 'e', tool: 'chalk' as const, hint: 'E' }
  ]
  beforeEach(() => localStorage.clear())
  const hints = (jobs: { hint: string }[]) => jobs.map((j) => j.hint)

  it('a stage without tasks draws nothing', () => {
    expect(paintJobsOf('j', 1, undefined)).toEqual([])
    expect(paintJobsOf('j', 1, [])).toEqual([])
  })

  it('three tasks are drawn, for three different elements (never two for the same zone)', () => {
    for (let i = 0; i < 40; i++) {
      const jobs = paintJobsOf('j', 1, pool, 3, { redraw: true })
      expect(jobs).toHaveLength(3)
      expect(new Set(jobs.map((j) => j.zone)).size).toBe(3)
    }
  })

  it('a pool with fewer elements than asked gives as many as there are elements', () => {
    expect(paintJobsOf('j', 1, [pool[0]!, pool[1]!, pool[2]!], 3, { redraw: true })).toHaveLength(2)
  })

  it('the tasks drawn stay (keep painting, back from the painting screen) until the stage is entered anew', () => {
    const first = hints(paintJobsOf('j', 1, pool, 3, { redraw: true, random: () => 0.1 }))
    expect(hints(paintJobsOf('j', 1, pool, 3, { random: () => 0.9 }))).toEqual(first)
    expect(hints(paintJobsOf('j', 1, pool, 3))).toEqual(first)
    expect(hints(paintJobsOf('j', 1, pool, 3, { redraw: true, random: () => 0.9 }))).not.toEqual(first)
  })

  it('every task of the pool can come up over many starts, and a new start is never the same set twice in a row', () => {
    const seen = new Set<string>()
    let last = ''
    for (let i = 0; i < 60; i++) {
      const jobs = paintJobsOf('j', 1, pool, 3, { redraw: true })
      for (const j of jobs) seen.add(j.hint)
      const key = hints(jobs).sort().join()
      expect(key).not.toBe(last)
      last = key
    }
    expect([...seen].sort()).toEqual(['A1', 'A2', 'B', 'C', 'D', 'E'])
  })

  it('every stage keeps its own', () => {
    const a = hints(paintJobsOf('j', 1, pool, 3, { redraw: true, random: () => 0.1 }))
    const b = hints(paintJobsOf('j', 2, pool, 3, { redraw: true, random: () => 0.8 }))
    expect(hints(paintJobsOf('j', 1, pool, 3))).toEqual(a)
    expect(hints(paintJobsOf('j', 2, pool, 3))).toEqual(b)
  })

  it('a damaged or outdated note is drawn anew', () => {
    localStorage.setItem('lk-paintjobs:j:1', '[99,98]')
    expect(paintJobsOf('j', 1, pool, 3)).toHaveLength(3)
    localStorage.setItem('lk-paintjobs:j:2', 'not json')
    expect(paintJobsOf('j', 2, pool, 3)).toHaveLength(3)
  })
})

describe('the pictures of the journeys that come with tasks', () => {
  const task = (j: { stages: { id: number; task: StageTask }[] }, id: number) => j.stages.find((s) => s.id === id)!.task
  const josef = journeys.find((j) => j.id === 'josef')!

  it('every picture to paint says "Male das Bild voll aus." and has zones and a pool of tasks for at least three different elements', () => {
    for (const j of [...journeys, noah]) {
      for (const s of j.stages.filter((x) => x.task.kind === 'ausmalen')) {
        const t = s.task
        expect(t.hint, `${j.id} ${s.id}`).toBe('Male das Bild voll aus.')
        expect(t.jobCount, `${j.id} ${s.id}`).toBe(3)
        expect(new Set(t.jobs!.map((x) => x.zone)).size, `${j.id} ${s.id}`).toBeGreaterThanOrEqual(3)
        for (const job of t.jobs!) {
          expect(t.zones![job.zone], `${j.id} ${s.id} ${job.zone}`).toBeTruthy()
          expect(Boolean(job.tool || job.color), `${j.id} ${s.id}: a tool and/or a colour`).toBe(true)
          expect(job.hint, `${j.id} ${s.id}`).toMatch(/^Male .*\.$/)
          expect(job.hint).not.toMatch(/egal|Rest/)
        }
        for (const [name, z] of Object.entries(t.zones!)) {
          expect(z.seeds.length, name).toBeGreaterThanOrEqual(1)
          for (const [x, y] of z.seeds) {
            expect(x, name).toBeGreaterThan(0)
            expect(x, name).toBeLessThan(100)
            expect(y, name).toBeGreaterThan(0)
            expect(y, name).toBeLessThan(100)
          }
        }
      }
    }
  })

  it('Noah 9 has seven elements: rainbow (four tools), sun, ark, clouds, meadow, tree, sky', () => {
    const t = task(noah, 9)
    expect(Object.keys(t.zones!).sort()).toEqual(['arche', 'baum', 'himmel', 'regenbogen', 'sonne', 'wiese', 'wolken'])
    expect(t.jobs!.filter((x) => x.zone === 'regenbogen').map((x) => x.tool).sort()).toEqual(['chalk', 'felt', 'pencil', 'watercolor'])
    expect(t.jobs!.find((x) => x.hint === 'Male die Wiese grün.')).toMatchObject({ zone: 'wiese', color: 'green' })
    expect(t.jobs!.find((x) => x.hint === 'Male die Arche braun mit Buntstift.')).toMatchObject({ zone: 'arche', color: 'brown', tool: 'pencil' })
    expect(t.jobs!.find((x) => x.hint === 'Male den Regenbogen mit Wasserfarbe.')).toMatchObject({ zone: 'regenbogen', tool: 'watercolor' })
  })

  it('Josef 6 and Josef 11 have five elements each (three of them are drawn)', () => {
    expect(Object.keys(task(josef, 6).zones!).sort()).toEqual(['fenster', 'gewand', 'krug', 'lichtstrahl', 'teppich'])
    expect(Object.keys(task(josef, 11).zones!).sort()).toEqual(['gewand', 'himmel', 'krug', 'rock', 'saeulen'])
  })

  it('the zones of Noah 9: five bands of the rainbow, one sun, several clouds, the hull of the ark, the meadow', () => {
    const z = task(noah, 9).zones!
    expect(z.regenbogen!.seeds).toHaveLength(5)
    expect(z.sonne!.seeds).toHaveLength(1)
    expect(z.wolken!.seeds.length).toBeGreaterThanOrEqual(4)
    expect(z.arche!.seeds.length).toBeGreaterThanOrEqual(8)
    for (const [, y] of z.regenbogen!.seeds) expect(y).toBeLessThan(25)
    expect(z.sonne!.seeds[0]![0]).toBeGreaterThan(75)
    expect(z.sonne!.seeds[0]![1]).toBeLessThan(20)
    for (const [, y] of z.arche!.seeds) {
      expect(y).toBeGreaterThan(40)
      expect(y).toBeLessThan(70)
    }
    // the meadow lies under the ark
    expect(z.wiese!.seeds[0]![1]).toBeGreaterThan(70)
  })
})
