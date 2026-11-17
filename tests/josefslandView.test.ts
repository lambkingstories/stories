/**
 * "Josefs Land": the finger hits what it touches. A tap on the middle of a drawn field, building or animal pen maps to exactly that thing, for
 * tablets upright and across, at scale 1 and 2, with the canvas at an offset on the page, and also when the page was resized without the game
 * being told (the canvas then has another size than the game thinks: the old 5 mm shift on a tablet).
 */
import { describe, expect, it } from 'vitest'
import { PARCELS } from '../src/utils/josefslandData'
import { clientToLocal, localToWorld, pickBox, worldToLocal, type Cam, type HitBox } from '../src/utils/josefslandView'

interface Box extends HitBox {
  id: string
}
/** Boxes as the game makes them: a field is 120 wide and 80 high above its foot point, a building 120 x 110, a pen 308 wide. */
function boxesOf(): Box[] {
  const out: Box[] = []
  for (const p of PARCELS) {
    for (const s of p.spots) {
      if (s.kind === 'plot' || s.kind === 'bed') out.push({ id: s.id, x0: s.x - 60, x1: s.x + 60, y0: s.y - 80, y1: s.y, prio: 2 })
      else if (s.kind === 'building' || s.kind === 'barn' || s.kind === 'granary') out.push({ id: s.id, x0: s.x - 60, x1: s.x + 60, y0: s.y - 110, y1: s.y, prio: 2 })
    }
    // a land piece lies behind everything
    out.push({ id: `land${p.id}`, x0: p.col * 380, x1: p.col * 380 + 368, y0: 150 + p.row * 300, y1: 150 + p.row * 300 + 288, prio: 0 })
  }
  return out
}
const SIZES: Array<[number, number]> = [[820, 1180], [1180, 820], [768, 1024], [1024, 768], [390, 800], [812, 375]]

describe('the finger and the land', () => {
  it('a tap on the middle of every field, bed and building hits exactly that one', () => {
    const boxes = boxesOf()
    for (const [W, H] of SIZES) {
      for (const dpr of [1, 2]) {
        for (const z of [0.5, 1, 1.7]) {
          // the canvas lies 37 px from the top of the page (a bar), the page is scaled by `dpr` only in the drawing buffer, never in the touch
          const rect = { left: 0, top: 37, width: W, height: H }
          const cam: Cam = { x: 700, y: 450, z }
          void dpr
          for (const b of boxes) {
            if (b.id.startsWith('land')) continue
            const cx = (b.x0 + b.x1) / 2
            const cy = (b.y0 + b.y1) / 2
            const [sx, sy] = worldToLocal(cam, W, H, cx, cy)
            if (sx < 0 || sy < 0 || sx > W || sy > H) continue
            const [lx, ly] = clientToLocal(rect, W, H, rect.left + sx, rect.top + sy)
            const [wx, wy] = localToWorld(cam, W, H, lx, ly)
            expect(wx).toBeCloseTo(cx, 5)
            expect(wy).toBeCloseTo(cy, 5)
            expect(pickBox(boxes, wx, wy)?.id).toBe(b.id)
          }
        }
      }
    }
  })

  it('the canvas is measured by the finger, not by what the game remembers: a page that grew or shrank still hits right', () => {
    const boxes = boxesOf()
    const target = boxes.find((b) => b.id === 'p1-f1')!
    const cx = (target.x0 + target.x1) / 2
    const cy = (target.y0 + target.y1) / 2
    // the game thinks the canvas is 820 x 1100, but the real canvas is 820 x 1180 (or 1060): the picture is stretched to the real size
    for (const real of [1180, 1060, 900]) {
      const W = 820
      const H = 1100
      const cam: Cam = { x: 600, y: 420, z: 1 }
      const rect = { left: 0, top: 20, width: 820, height: real }
      // where the field is seen: the game's picture is stretched by real / H
      const [sx, sy] = worldToLocal(cam, W, H, cx, cy)
      const seenX = sx * (rect.width / W)
      const seenY = sy * (rect.height / H)
      const [lx, ly] = clientToLocal(rect, W, H, rect.left + seenX, rect.top + seenY)
      const [wx, wy] = localToWorld(cam, W, H, lx, ly)
      expect(pickBox(boxes, wx, wy)?.id).toBe('p1-f1')
    }
  })

  it('a point of the world in front of a thing is not taken for a thing behind it (the lower foot line wins at the same rank)', () => {
    const a: Box = { id: 'back', x0: 0, x1: 100, y0: 0, y1: 100, prio: 2 }
    const b: Box = { id: 'front', x0: 50, x1: 150, y0: 40, y1: 140, prio: 2 }
    expect(pickBox([a, b], 70, 60)?.id).toBe('front')
    expect(pickBox([a, b], 10, 10)?.id).toBe('back')
    expect(pickBox([a, b], 500, 500)).toBeNull()
    expect(pickBox([{ ...a, prio: 3 }, b], 70, 60)?.id).toBe('back')
  })
})
