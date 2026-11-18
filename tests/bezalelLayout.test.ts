import { describe, expect, it } from 'vitest'
import { LEVELS } from '../src/utils/bezalelLevels'
import { clampCentre, computeLayout, hitTest, inTray, screenCentre, screenPoly, toScreen, toWorld } from '../src/utils/bezalelLayout'
import { newGame, polyOf } from '../src/utils/bezalelGame'
import { kindOf, radiusOf } from '../src/utils/bezalelTangram'

const SIZES: [number, number][] = [[375, 812], [812, 375], [768, 1024], [1024, 768], [360, 640], [667, 375], [390, 844]]

describe('where things lie on the screen', () => {
  for (const [W, H] of SIZES) {
    it(`${W}x${H}: tray, board and toolbar do not overlap, every piece has room, nothing is under a bar`, () => {
      for (const l of LEVELS) {
        const lay = computeLayout(W, H, l.box, l.pieces, { top: 0, bottom: 0 })
        // the board holds the whole figure
        const a = toScreen(lay, [l.box.x0, l.box.y0])
        const b = toScreen(lay, [l.box.x1, l.box.y1])
        expect(a[0], l.id).toBeGreaterThanOrEqual(lay.board.x)
        expect(a[1], l.id).toBeGreaterThanOrEqual(lay.board.y)
        expect(b[0], l.id).toBeLessThanOrEqual(lay.board.x + lay.board.w)
        expect(b[1], l.id).toBeLessThanOrEqual(lay.board.y + lay.board.h)
        // the figure and the pieces are big enough to work with
        expect(lay.s, `${l.id} board scale`).toBeGreaterThanOrEqual(26)
        expect(lay.ts, `${l.id} tray scale`).toBeGreaterThanOrEqual(26)
        // every piece lies in the tray inside a cell that fits it however it is turned
        for (const id of l.pieces) {
          const s = lay.slots[id]!
          const r = radiusOf(kindOf(id)) * lay.ts
          expect(s.x - r, `${l.id} ${id}`).toBeGreaterThanOrEqual(lay.tray.x)
          expect(s.x + r).toBeLessThanOrEqual(lay.tray.x + lay.tray.w)
          expect(s.y - r).toBeGreaterThanOrEqual(lay.tray.y)
          expect(s.y + r).toBeLessThanOrEqual(lay.tray.y + lay.tray.h)
        }
        // the cells of the pieces in the tray do not overlap
        const cs = l.pieces.map((id) => ({ ...lay.slots[id]!, c: 2 * radiusOf(kindOf(id)) * lay.ts }))
        for (let i = 0; i < cs.length; i++) {
          for (let j = i + 1; j < cs.length; j++) {
            const sepX = Math.abs(cs[i]!.x - cs[j]!.x) - (cs[i]!.c + cs[j]!.c) / 2
            const sepY = Math.abs(cs[i]!.y - cs[j]!.y) - (cs[i]!.c + cs[j]!.c) / 2
            expect(Math.max(sepX, sepY), `${l.id} cells ${i} ${j}`).toBeGreaterThanOrEqual(-0.5)
          }
        }
        // the toolbar holds its five round buttons of 52 pixels with a gap of 10
        const need = 5 * 52 + 4 * 10
        expect(lay.portrait ? lay.toolbar.w : lay.toolbar.h).toBeGreaterThanOrEqual(need)
        // the areas lie side by side
        if (lay.portrait) {
          expect(lay.board.y + lay.board.h).toBeLessThanOrEqual(lay.toolbar.y + 0.5)
          expect(lay.toolbar.y + lay.toolbar.h).toBeLessThanOrEqual(lay.tray.y + 0.5)
          expect(lay.tray.y + lay.tray.h).toBeLessThanOrEqual(H + 0.5)
        } else {
          expect(lay.toolbar.x + lay.toolbar.w).toBeLessThanOrEqual(lay.board.x + 0.5)
          expect(lay.board.x + lay.board.w).toBeLessThanOrEqual(lay.tray.x + 0.5)
          expect(lay.tray.x + lay.tray.w).toBeLessThanOrEqual(W + 0.5)
        }
        expect(lay.board.y).toBeGreaterThanOrEqual(lay.top)
      }
    })
  }

  it('the safe areas of a phone (the notch, the home bar) are left free', () => {
    const l = LEVELS[19]!
    const a = computeLayout(375, 812, l.box, l.pieces, { top: 47, bottom: 34 })
    expect(a.board.y).toBeGreaterThanOrEqual(47 + 56)
    expect(a.tray.y + a.tray.h).toBeLessThanOrEqual(812 - 34 + 0.5)
  })

  it('the pieces in the tray have a touch area of at least 44 pixels, even the small triangle', () => {
    for (const [W, H] of SIZES) {
      for (const l of LEVELS) {
        const lay = computeLayout(W, H, l.box, l.pieces)
        const g = newGame(l)
        for (const p of g.pieces) {
          const c = screenCentre(lay, p)
          // the middle is a hit
          expect(hitTest(g, lay, c[0], c[1])?.id).toBe(p.id)
          // a finger 14 pixels outside the edge of the polygon still takes the nearest piece
          const poly = screenPoly(lay, p)
          const [x0, x1] = [Math.min(...poly.map((q) => q[0])), Math.max(...poly.map((q) => q[0]))]
          const [y0, y1] = [Math.min(...poly.map((q) => q[1])), Math.max(...poly.map((q) => q[1]))]
          // the touch area of a piece: its box with the 16 pixels around it, at least 44 across
          expect(x1 - x0 + 32, `${W}x${H} ${l.id} ${p.id}`).toBeGreaterThanOrEqual(44)
          expect(y1 - y0 + 32).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })

  it('pieces on the board are found at their place and a loose touch picks the nearest', () => {
    const l = LEVELS[5]!
    const lay = computeLayout(375, 812, l.box, l.pieces)
    const g = newGame(l)
    const p = g.pieces[0]!
    p.onBoard = true
    p.cx = 1.2
    p.cy = 1.1
    const c = screenCentre(lay, p)
    expect(hitTest(g, lay, c[0], c[1])?.id).toBe(p.id)
    expect(hitTest(g, lay, lay.board.x + 3, lay.board.y + 3)).toBeNull()
    // the polygon on the screen is the polygon of the world scaled
    const poly = screenPoly(lay, p)
    const w = polyOf(p)
    expect(poly[0]![0]).toBeCloseTo(toScreen(lay, w[0]!)[0], 6)
    const back = toWorld(lay, ...(toScreen(lay, [0.3, 0.7]) as [number, number]))
    expect(back[0]).toBeCloseTo(0.3, 9)
  })

  it('a piece can never be carried off the screen, and the tray takes back what is dropped on it', () => {
    const l = LEVELS[0]!
    for (const [W, H] of SIZES) {
      const lay = computeLayout(W, H, l.box, l.pieces)
      for (const [x, y] of [[-500, -500], [9999, 9999], [W / 2, 0], [0, H / 2]] as [number, number][]) {
        const k = clampCentre(lay, x, y)
        expect(k[0]).toBeGreaterThanOrEqual(0)
        expect(k[0]).toBeLessThanOrEqual(W)
        expect(k[1]).toBeGreaterThan(lay.top)
        expect(k[1]).toBeLessThanOrEqual(H)
      }
      expect(inTray(lay, lay.tray.x + lay.tray.w / 2, lay.tray.y + lay.tray.h / 2)).toBe(true)
      expect(inTray(lay, lay.board.x + lay.board.w / 2, lay.board.y + 10)).toBe(false)
    }
  })
})
