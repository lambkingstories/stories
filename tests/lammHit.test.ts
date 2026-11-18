/**
 * "Das verlorene Lamm": the touch areas of ALL levels. For every level and every phone/tablet format (upright and sideways): the cranks and levers have a round touch area
 * of their own (at least 44 px wide) that lies on no street (in no position of any part, also while it turns or slides), not on the lamb, the shepherd, another crank or the
 * buttons at the top; the streets and the shepherd are touch targets of at least 44 px; the building is not too small. In the real surface a tap on a crank turns it and a tap
 * on a street never does.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameLamm from '@/components/molecules/games/BigGameLamm.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '@/utils/lammLevels'
import { parseLevel, placeOf } from '@/utils/lammGame'
import { project, unproject } from '@/utils/lammView'
import {
  CELL_EXT, GAP, MIN_TARGET, STAIR_EXT, cellExt, cellReach, clearanceAt, goalReach, handleKind, hudRects, planLevel, pictureSize, posesOfGroup, spotAt, streetShapes
} from '../src/utils/lammHit'

/** upright phone, sideways phone, small phone, sideways small phone, tablets (upright and sideways) */
const FORMATS: [number, number][] = [[375, 812], [812, 375], [360, 640], [667, 375], [768, 1024], [1024, 768]]
const PHONE = (w: number, h: number) => Math.min(w, h) < 500

describe('touch areas of all levels', () => {
  for (const [W, H] of FORMATS) {
    describe(`${W} x ${H}`, () => {
      for (const def of LEVELS) {
        it(`${def.id}: the cranks have their own free touch areas`, () => {
          const m = parseLevel(def)
          const plan = planLevel(m, W, H)
          expect(plan.ok, 'every crank found a place').toBe(true)
          expect(plan.spots).toHaveLength(m.controls.length)
          const shapes = streetShapes(m, plan.view)
          const huds = hudRects(W, H)
          plan.spots.forEach((sp, i) => {
            expect(sp.r * 2, `crank ${i} is at least ${MIN_TARGET} px wide`).toBeGreaterThanOrEqual(MIN_TARGET)
            // inside the screen
            expect(sp.x - sp.r).toBeGreaterThanOrEqual(0)
            expect(sp.x + sp.r).toBeLessThanOrEqual(W)
            expect(sp.y - sp.r).toBeGreaterThanOrEqual(0)
            expect(sp.y + sp.r).toBeLessThanOrEqual(H)
            // free of every street, of the lamb, the shepherd, the gates
            const cl = clearanceAt(shapes, sp.x, sp.y)
            expect(cl.d - sp.r, `crank ${i} is ${GAP} px away from ${cl.what}`).toBeGreaterThanOrEqual(GAP - 1e-6)
            // free of the buttons at the top
            for (const [a, b, c, d] of huds) {
              const dx = Math.max(a - sp.x, 0, sp.x - c)
              const dy = Math.max(b - sp.y, 0, sp.y - d)
              expect(Math.hypot(dx, dy), `crank ${i} lies clear of the buttons`).toBeGreaterThan(sp.r)
            }
            // free of the other cranks
            plan.spots.forEach((o, k) => {
              if (k <= i) return
              expect(Math.hypot(sp.x - o.x, sp.y - o.y) - sp.r - o.r, `cranks ${i} and ${k} do not touch`).toBeGreaterThanOrEqual(GAP - 1e-6)
            })
            // the picture lies in the circle: for the widest picture (the slider, 2.3 : 1) too
            const [pw, ph] = pictureSize(sp.r, 2.31)
            expect(Math.hypot(pw, ph) / 2).toBeLessThanOrEqual(sp.r)
          })
        })

        it(`${def.id}: no tap on a street, the shepherd or at a street's corner reaches a crank; every street is a target of 44 px`, () => {
          const m = parseLevel(def)
          const plan = planLevel(m, W, H)
          const v = plan.view
          const s = v.s
          // the street target is at least 44 px wide and high (the diamond or the round reach around the middle, whichever is bigger)
          expect(Math.max(4 * CELL_EXT * s, 2 * cellReach(s))).toBeGreaterThanOrEqual(MIN_TARGET)
          expect(Math.max(2 * CELL_EXT * s, 2 * cellReach(s))).toBeGreaterThanOrEqual(MIN_TARGET)
          expect(2 * Math.max(cellReach(s), goalReach(s))).toBeGreaterThanOrEqual(MIN_TARGET)
          expect(STAIR_EXT).toBeGreaterThanOrEqual(CELL_EXT)
          // every point of the touch area of every street (the diamond in every pose, and the round reach) and of the shepherd does not hit a crank
          for (const c of m.cells) {
            const poses = c.g < 0 ? [{ rot: 0, dx: 0, dy: 0, dz: 0, on: true, open: true }] : posesOfGroup(m, c.g)
            const ext = cellExt(c)
            for (const p of poses) {
              if (!p.on) continue
              const [x, y, z] = placeOf(m, c, p)
              const zz = z + (c.stair >= 0 ? 0.5 : 0)
              const [cx, cy] = project(v, x, y, zz)
              for (const [fx, fy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]] as const) {
                const px = cx + fx * 2 * ext * s * 0.95 * (fx !== 0 && fy !== 0 ? 0.7 : 1)
                const py = cy + fy * ext * s * 0.95 * (fx !== 0 && fy !== 0 ? 0.7 : 1)
                expect(spotAt(plan.spots, px, py), `tile ${c.id} (${fx},${fy}) is not a crank`).toBe(-1)
                // and the point lies in the tile of the building: it unprojects to the tile
                const [wx, wy] = unproject(v, px, py, zz)
                expect(Math.abs(wx - x)).toBeLessThanOrEqual(ext + 1e-6)
                expect(Math.abs(wy - y)).toBeLessThanOrEqual(ext + 1e-6)
              }
              // the round reach: points on the ring
              for (let a = 0; a < 12; a++) {
                expect(spotAt(plan.spots, cx + Math.cos(a / 1.91) * cellReach(s), cy + Math.sin(a / 1.91) * cellReach(s))).toBe(-1)
              }
            }
          }
          const goal = m.cells[m.goal]!
          const [gx, gy] = project(v, goal.x, goal.y, goal.z)
          for (let a = 0; a < 12; a++) {
            expect(spotAt(plan.spots, gx + Math.cos(a / 1.91) * goalReach(s), gy - s * 0.9 + Math.sin(a / 1.91) * goalReach(s))).toBe(-1)
          }
          // every crank is hit in the middle and on its edge, and nothing else is
          plan.spots.forEach((sp, i) => {
            expect(spotAt(plan.spots, sp.x, sp.y)).toBe(i)
            expect(spotAt(plan.spots, sp.x + sp.r * 0.95, sp.y)).toBe(i)
            expect(spotAt(plan.spots, sp.x, sp.y - sp.r * 0.95)).toBe(i)
            expect(spotAt(plan.spots, sp.x + sp.r + 1, sp.y)).toBe(-1)
          })
        })

        it(`${def.id}: the building stays big enough`, () => {
          const plan = planLevel(parseLevel(def), W, H)
          const m = Math.min(W, H)
          expect(plan.view.s).toBeGreaterThanOrEqual(PHONE(W, H) ? (m > 400 ? 15 : 20) : 24)
        })
      }
    })
  }

  it('the three kinds of devices all occur (so every kind is checked)', () => {
    const kinds = new Set<string>()
    for (const def of LEVELS) {
      const m = parseLevel(def)
      for (const c of m.controls) kinds.add(handleKind(m, c))
    }
    expect([...kinds].sort()).toEqual(['hebel', 'kurbel', 'schieber'])
  })

  it('planning a level is fast (a phone must not wait)', () => {
    const t = Date.now()
    for (const def of LEVELS) planLevel(parseLevel(def), 812, 375)
    expect(Date.now() - t).toBeLessThan(1500)
  })
})

// ── in the real surface ────────────────────────────────────────────────────────────────────────────────────────────────────
const texts = withGameTexts(app) as { de?: object; en?: object }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: texts.de ?? {}, en: texts.en ?? {} } })

class FailingImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 0
  height = 0
  complete = false
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

interface Probe {
  run: { st: number[]; anim: unknown; stepT: number; pending: number; target: number; m: { cells: { id: number }[]; goal: number }; graph: { walk: Uint8Array } }
  spots: { x: number; y: number; r: number }[]
  view: { s: number }
  begin: (i: number) => void
  advance: (s: number) => void
  cellScreen: (id: number) => [number, number]
  handleAt: (x: number, y: number) => number
}
const probe = () => (window as unknown as { __lamm: Probe }).__lamm

describe('BigGameLamm: touching with the finger', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    window.location.hash = '#/app/spiel/lamm?probe=1'
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ lamm: true }))
    localStorage.setItem('lk-lamm-story-v1', JSON.stringify({ 0: true, 1: true, 2: true, 3: true, 4: true }))
  })

  it('in every level a tap on a crank moves its parts, and a tap on a street or on the shepherd never does', async () => {
    const w = mount(BigGameLamm, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    await w.find('[data-test="lamm-level-0"]').trigger('click')
    const p = probe()
    const canvas = w.find('canvas').element as HTMLCanvasElement
    const tap = (x: number, y: number) => canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }))
    const settle = () => {
      for (let i = 0; i < 400 && (p.run.stepT < 1 || p.run.anim); i++) p.advance(0.05)
    }
    for (let i = 0; i < LEVELS.length; i++) {
      p.begin(i)
      settle()
      const before = p.run.st.slice()
      // the streets: nothing moves (the lamb may walk)
      for (const c of p.run.m.cells) {
        const [sx, sy] = p.cellScreen(c.id)
        expect(p.handleAt(sx, sy), `level ${i + 1}: the middle of tile ${c.id} is no crank`).toBe(-1)
        tap(sx, sy)
        expect(p.run.anim, `level ${i + 1}: a tap on tile ${c.id} moves no part`).toBeNull()
        expect(p.run.pending).toBe(-1)
        settle()
        expect(p.run.st).toEqual(before)
      }
      // the shepherd
      const [gx, gy] = p.cellScreen(p.run.m.goal)
      tap(gx, gy - p.view.s * 0.9)
      settle()
      expect(p.run.st).toEqual(before)
      // the cranks
      p.spots.forEach((sp, k) => {
        expect(p.handleAt(sp.x, sp.y)).toBe(k)
        tap(sp.x + sp.r * 0.6, sp.y - sp.r * 0.5)
        expect(p.run.anim !== null || p.run.pending >= 0 || p.run.st.some((v, j) => v !== before[j]), `level ${i + 1}: a tap on crank ${k} starts a move`).toBe(true)
        settle()
        p.begin(i)
        settle()
      })
    }
    w.unmount()
  })
})
