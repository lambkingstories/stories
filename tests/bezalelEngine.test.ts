import { describe, expect, it } from 'vitest'
import { LEVELS, CHAPTER_COUNT, LEVELS_PER_CHAPTER } from '../src/utils/bezalelLevels'
import { AREA, area, coverage, kindOf, outlineOf, placementPoly, placementToXf, samplePoints, xfPoly, snapAngle, snapXf, type Pt } from '../src/utils/bezalelTangram'
import { solveSilhouette } from '../src/utils/bezalelSolve'
import { beginMove, endMove, hint, moveTo, newGame, pieceById, pieceInPlace, polyOf, rotate, flip, resetPieces, starsOf, undo } from '../src/utils/bezalelGame'

const key = (polys: Pt[][]) => polys.map((p) => p.map((q) => `${Math.round(q[0] * 100)},${Math.round(q[1] * 100)}`).sort().join(';')).sort().join('|')

describe('the levels of Bezalels Werkstatt', () => {
  it('there are 40 levels in 4 chapters of 10', () => {
    expect(CHAPTER_COUNT).toBe(4)
    expect(LEVELS.length).toBe(CHAPTER_COUNT * LEVELS_PER_CHAPTER)
    for (let c = 0; c < CHAPTER_COUNT; c++) expect(LEVELS.filter((l) => l.chapter === c).length).toBe(LEVELS_PER_CHAPTER)
  })

  for (const l of LEVELS) {
    it(`${l.id}: the pieces fill the figure exactly and do not overlap`, () => {
      const sum = l.pieces.reduce((n, id) => n + AREA[kindOf(id)], 0) * 4
      expect(l.polys.reduce((n, p) => n + Math.abs(area(p)), 0)).toBeCloseTo(sum / 4, 6)
      const samples = samplePoints(l.polys)
      const c = coverage(samples, l.polys)
      expect(c.covered).toBeCloseTo(1, 6)
      expect(c.overlap).toBe(0)
      expect(new Set(l.pieces).size).toBe(l.pieces.length)
    })

    it(`${l.id}: the figure is connected and has an outline`, () => {
      const o = outlineOf(l.polys)
      expect(o.edges.length).toBeGreaterThanOrEqual(3)
      expect(o.corners.length).toBeGreaterThanOrEqual(3)
      // the outline is closed: every corner point has as many edges coming in as going out
      const out = new Map<string, number>()
      for (const [a, b] of o.edges) {
        out.set(`${Math.round(a[0] * 1000)},${Math.round(a[1] * 1000)}`, (out.get(`${Math.round(a[0] * 1000)},${Math.round(a[1] * 1000)}`) ?? 0) + 1)
        out.set(`${Math.round(b[0] * 1000)},${Math.round(b[1] * 1000)}`, (out.get(`${Math.round(b[0] * 1000)},${Math.round(b[1] * 1000)}`) ?? 0) - 1)
      }
      expect([...out.values()].every((v) => v === 0)).toBe(true)
    })

    it(`${l.id}: the solver finds a way and the stored way is one of them`, () => {
      const ways = solveSilhouette(l.polys, l.pieces, 5000)
      expect(ways.length).toBeGreaterThanOrEqual(1)
      expect(ways.length).toBe(l.ways)
      const stored = key(l.solution.map(placementPoly))
      expect(ways.some((w) => key(w.map(placementPoly)) === stored)).toBe(true)
    })

    it(`${l.id}: laying the pieces nearly right finishes it with 3 stars`, () => {
      const g = newGame(l)
      expect(g.done).toBe(false)
      for (const s of l.solution) {
        const xf = placementToXf(s)
        beginMove(g, s.id)
        const p = pieceById(g, s.id)
        p.flip = xf.flip
        p.angle = xf.angle + 6 // not quite turned right: the angle clicks
        moveTo(g, s.id, xf.cx + 0.14, xf.cy - 0.12)
        endMove(g, s.id, false)
        expect(pieceInPlace(g, pieceById(g, s.id)), `${l.id} ${s.id}`).toBe(true)
      }
      expect(g.covered).toBeGreaterThan(0.97)
      expect(g.done).toBe(true)
      expect(starsOf(g)).toBe(3)
    })

    it(`${l.id}: even in the other order and a little further off the pieces click into place`, () => {
      const g = newGame(l)
      const offs: Pt[] = [[0.2, 0.17], [-0.19, 0.1], [0.05, -0.22], [-0.15, -0.18], [0.22, -0.05], [-0.1, 0.21], [0.18, 0.18]]
      ;[...l.solution].reverse().forEach((s, i) => {
        const xf = placementToXf(s)
        beginMove(g, s.id)
        const p = pieceById(g, s.id)
        p.flip = xf.flip
        p.angle = xf.angle - 9
        moveTo(g, s.id, xf.cx + offs[i % 7]![0], xf.cy + offs[i % 7]![1])
        endMove(g, s.id, false)
      })
      expect(g.done, l.id).toBe(true)
    })

    it(`${l.id}: with hints only the level is finished, with fewer stars`, () => {
      const g = newGame(l)
      let guard = 0
      while (!g.done && guard++ < 12) {
        const h = hint(g)!
        expect(h).not.toBeNull()
        const target = h.poly
        const cx = target.reduce((n, q) => n + q[0], 0) / target.length
        const cy = target.reduce((n, q) => n + q[1], 0) / target.length
        const p = pieceById(g, h.id)
        beginMove(g, h.id)
        // turn the piece to the angle of the hint (found by trying the eight turns and both mirror images)
        let placed = false
        for (const f of [false, true]) {
          if (placed) break
          for (let a = 0; a < 360 && !placed; a += 45) {
            p.angle = a
            p.flip = f
            p.cx = 0
            p.cy = 0
            const poly = xfPoly({ kind: p.kind, angle: a, flip: f, cx: 0, cy: 0 })
            const mx = poly.reduce((n, q) => n + q[0], 0) / poly.length
            const my = poly.reduce((n, q) => n + q[1], 0) / poly.length
            void mx
            void my
            // the middle of the piece is the middle of the polygon (all pieces are symmetric about their vertex mean)
            const moved = poly.map((q) => [q[0] + cx, q[1] + cy] as Pt)
            if (key([moved]) === key([target])) placed = true
          }
        }
        expect(placed).toBe(true)
        moveTo(g, h.id, cx, cy)
        endMove(g, h.id, false)
      }
      expect(g.done).toBe(true)
      expect(starsOf(g)).toBeLessThan(3)
      expect(starsOf(g)).toBeGreaterThanOrEqual(1)
    })
  }
})

describe('the geometry', () => {
  it('the angle clicks to a multiple of 45 degrees near one and stays free otherwise', () => {
    expect(snapAngle(50)).toBe(45)
    expect(snapAngle(40)).toBe(45)
    expect(snapAngle(355)).toBe(0)
    expect(snapAngle(67)).toBe(67)
  })

  it('a piece clicks onto a corner that is near and not onto one that is far', () => {
    const near = snapXf({ kind: 'Q', angle: 0, flip: false, cx: 0.5 + 0.2, cy: 0.5 + 0.1 }, { corners: [[0, 0]], edges: [] }, 0.36)
    expect(near.cx).toBeCloseTo(0.5, 6)
    expect(near.cy).toBeCloseTo(0.5, 6)
    const far = snapXf({ kind: 'Q', angle: 0, flip: false, cx: 1.5, cy: 1.5 }, { corners: [[0, 0]], edges: [] }, 0.36)
    expect(far.cx).toBeCloseTo(1.5, 6)
  })

  it('a piece lies against an edge that is parallel and near', () => {
    // the edge y = 0 runs to the right, the inside is below it: the square lies 0.2 too high, its top edge clicks onto the line
    const sq = snapXf({ kind: 'Q', angle: 0, flip: false, cx: 5, cy: 0.5 - 0.2 }, { corners: [], edges: [{ seg: [[0, 0], [20, 0]], same: true }] }, 0.36)
    expect(Math.min(...xfPoly(sq).map((q) => q[1]))).toBeCloseTo(0, 6)
    // a piece on the wrong side of an edge of the figure does not click onto it
    const out = snapXf({ kind: 'Q', angle: 0, flip: false, cx: 5, cy: -0.5 + 0.2 }, { corners: [], edges: [{ seg: [[0, 0], [20, 0]], same: true }] }, 0.36)
    expect(out.cy).toBeCloseTo(-0.3, 6)
  })

  it('turning, mirroring, undo and a new start', () => {
    const g = newGame(LEVELS[9]!)
    const id = g.pieces.find((p) => p.kind === 'P')!.id
    const a0 = pieceById(g, id).angle
    rotate(g, id)
    expect(pieceById(g, id).angle).toBe((a0 + 45) % 360)
    flip(g, id)
    expect(pieceById(g, id).flip).toBe(true)
    expect(undo(g)).toBe(true)
    expect(pieceById(g, id).flip).toBe(false)
    expect(undo(g)).toBe(true)
    expect(pieceById(g, id).angle).toBe(a0)
    // only the parallelogram is mirrored
    const other = g.pieces.find((p) => p.kind === 'L')!.id
    flip(g, other)
    expect(pieceById(g, other).flip).toBe(false)
    beginMove(g, other)
    moveTo(g, other, 3, 3)
    endMove(g, other, false)
    expect(pieceById(g, other).onBoard).toBe(true)
    resetPieces(g)
    expect(g.pieces.every((p) => !p.onBoard)).toBe(true)
  })

  it('the stars sink with every new hint: 3, 2, 1', () => {
    const g = newGame(LEVELS[0]!)
    expect(starsOf(g)).toBe(3)
    hint(g)
    expect(starsOf(g)).toBe(2)
    // the same hint again costs nothing
    hint(g)
    expect(starsOf(g)).toBe(2)
    const first = g.hint!.id
    beginMove(g, first)
    moveTo(g, first, 50, 50)
    endMove(g, first, false)
    hint(g)
    expect(starsOf(g)).toBe(1)
    hint(g)
    hint(g)
    expect(starsOf(g)).toBe(1)
    void polyOf
  })
})
