/**
 * Bezalel's workshop: the designer of the silhouettes. Tool for the author, not part of the app.
 *
 *   npx tsx scripts/bezalel-design.ts search [id ...]   searches the tangram arrangements that come nearest to a target drawing
 *                                                       (writes D:/Claude/Bonusspiele-Paket/bezalel/design/<id>.json)
 *   npx tsx scripts/bezalel-design.ts build             writes src/utils/bezalelLevelData.ts from the chosen arrangements
 *
 * A target is a small drawing: one character per square of the lattice, "#" a whole square, "." nothing, and a, b, c, d the half squares with
 * the filled corner at the lower left, lower right, upper left, upper right. The search (a beam search over the arrangements of the pieces
 * that touch each other, all on the lattice) finds the arrangements of the given pieces that cover most of the drawing and least outside.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { TARGETS } from './bezalel-targets'
import { atomIndex, atomNeighbours, placementsFor, solve, countKinds, type Grid, type LatticePlacement } from '../src/utils/bezalelSolve'
import { placementPoly, kindOf, type Kind, type PieceId, type Placement } from '../src/utils/bezalelTangram'

const DIR = 'D:/Claude/Bonusspiele-Paket/bezalel/design'
const IDS: Record<string, PieceId[]> = {}
export function idsOf(kinds: string): PieceId[] {
  const n: Record<string, number> = {}
  return [...kinds].map((k) => {
    n[k] = (n[k] ?? 0) + 1
    return (k === 'L' || k === 'S' ? `${k}${n[k]}` : k) as PieceId
  })
}
void IDS

const HALF: Record<string, number[]> = { '#': [0, 1, 2, 3], a: [3, 2], b: [1, 2], c: [0, 3], d: [0, 1], '.': [] }

function targetAtoms(rows: string[], pad: number): { grid: Grid; atoms: Set<number> } {
  const w = Math.max(...rows.map((r) => r.length)) + pad * 2
  const h = rows.length + pad * 2
  const grid = { w, h }
  const atoms = new Set<number>()
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    for (const k of HALF[ch] ?? []) atoms.add(atomIndex(grid, x + pad, y + pad, k))
  }))
  return { grid, atoms }
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

interface Cand {
  score: number
  placements: Placement[]
}

/** How much of the figure has its mirror image (left to right about the middle of the grid) in the figure too, 0 to 1. */
function symmetry(grid: Grid, atoms: Set<number>): number {
  let both = 0
  for (const a of atoms) {
    const k = a % 4
    const cell = (a - k) / 4
    const cx = cell % grid.w
    const cy = (cell - cx) / grid.w
    const mk = k === 1 ? 3 : k === 3 ? 1 : k
    if (atoms.has(atomIndex(grid, grid.w - 1 - cx, cy, mk))) both++
  }
  return both / atoms.size
}

function perimeter(grid: Grid, atoms: Set<number>): number {
  let n = 0
  for (const a of atoms) {
    const k = a % 4
    const cell = (a - k) / 4
    const cx = cell % grid.w
    const cy = (cell - cx) / grid.w
    const across = [[0, -1], [1, 0], [0, 1], [-1, 0]][k]!
    const inGrid = cx + across[0]! >= 0 && cy + across[1]! >= 0 && cx + across[0]! < grid.w && cy + across[1]! < grid.h
    n += 3 - atomNeighbours(grid, a).filter((x) => atoms.has(x)).length - (inGrid ? 0 : 0)
  }
  return n
}

function beam(grid: Grid, target: Set<number>, kinds: Kind[], width: number, rand: () => number): Cand[] {
  const pls = placementsFor(grid)
  const masks = new Map<LatticePlacement, bigint>()
  const touch = new Map<LatticePlacement, bigint>()
  const gain = new Map<LatticePlacement, number>()
  for (const k of Object.keys(pls) as Kind[]) {
    for (const p of pls[k]) {
      let m = 0n
      let t = 0n
      let g = 0
      const own = new Set(p.atoms)
      for (const a of p.atoms) {
        m |= 1n << BigInt(a)
        g += target.has(a) ? 1 : -1
        for (const n of atomNeighbours(grid, a)) if (!own.has(n)) t |= 1n << BigInt(n)
      }
      masks.set(p, m)
      touch.set(p, t)
      gain.set(p, g)
    }
  }
  const orders: Kind[][] = []
  const base = [...kinds]
  orders.push([...base].sort((a, b) => 'LMPQS'.indexOf(a) - 'LMPQS'.indexOf(b)))
  for (let i = 0; i < 10; i++) orders.push([...base].sort(() => rand() - 0.5))
  const results = new Map<string, Cand>()
  for (const order of orders) {
    let states: { mask: bigint; score: number; list: LatticePlacement[] }[] = [{ mask: 0n, score: 0, list: [] }]
    for (const kind of order) {
      const next = new Map<bigint, { mask: bigint; score: number; list: LatticePlacement[] }>()
      for (const st of states) {
        for (const p of pls[kind]) {
          if (masks.get(p)! & st.mask) continue
          if (st.list.length && !(touch.get(p)! & st.mask)) continue
          const mask = st.mask | masks.get(p)!
          const score = st.score + gain.get(p)!
          const old = next.get(mask)
          if (!old || old.score < score) next.set(mask, { mask, score, list: [...st.list, p] })
        }
      }
      states = [...next.values()].sort((a, b) => b.score - a.score).slice(0, width)
      if (!states.length) break
    }
    for (const st of states) {
      if (st.list.length !== kinds.length) continue
      const key = st.mask.toString()
      if (!results.has(key)) results.set(key, { score: st.score, placements: st.list.map((p) => ({ id: p.id, rot: p.rot, flip: p.flip, x: p.x, y: p.y })) })
    }
  }
  return [...results.values()].sort((a, b) => b.score - a.score)
}

/** Finds the figures with the best sum of: fit to the target, left-right symmetry (times `sym`) and a small outline (times `compact`). */
function rank(grid: Grid, res: Cand[], sym: number, compact: number): Cand[] {
  const scored = res.slice(0, 4000).map((c) => {
    const atoms = new Set<number>()
    const area = new Map<string, number>()
    void area
    for (const p of c.placements) {
      const lp = placementsFor(grid)[kindOf(p.id)].find((q) => q.rot === p.rot && q.flip === p.flip && q.x === p.x && q.y === p.y)
      if (lp) for (const a of lp.atoms) atoms.add(a)
    }
    return { c, total: c.score + sym * symmetry(grid, atoms) * 10 - compact * perimeter(grid, atoms) }
  })
  return scored.sort((a, b) => b.total - a.total).map((x) => x.c)
}

function normalise(c: Cand, ids: PieceId[], pad: number): Cand {
  // shift so that the figure starts at (0, 0) and give the pieces their ids
  const polys = c.placements.map(placementPoly)
  const x0 = Math.min(...polys.flat().map((p) => p[0]))
  const y0 = Math.min(...polys.flat().map((p) => p[1]))
  const dx = Math.round(x0)
  const dy = Math.round(y0)
  void pad
  const free = new Map<Kind, PieceId[]>()
  for (const id of ids) free.set(kindOf(id), [...(free.get(kindOf(id)) ?? []), id])
  return { score: c.score, placements: c.placements.map((p) => ({ id: free.get(kindOf(p.id))!.shift()!, rot: p.rot, flip: p.flip, x: p.x - dx, y: p.y - dy })) }
}

function search(id: string) {
  const t = TARGETS.find((x) => x.id === id)
  if (!t) throw new Error('unknown ' + id)
  const ids = idsOf(t.kinds)
  const { grid, atoms } = targetAtoms(t.rows, 1)
  const kinds = ids.map(kindOf)
  const res = rank(grid, beam(grid, atoms, kinds, t.width ?? 700, rng(7)), t.sym ?? 0.6, t.compact ?? 0.2)
  const top: Cand[] = []
  const seenShape = new Set<string>()
  for (const c of res) {
    const n = normalise(c, ids, 1)
    // the same outline can come from different pieces: keep arrangements that differ in their pieces
    const key = n.placements.map((p) => JSON.stringify(placementPoly(p))).sort().join('|')
    if (seenShape.has(key)) continue
    seenShape.add(key)
    top.push(n)
    if (top.length >= 8) break
  }
  const area = [...atoms].length
  mkdirSync(DIR, { recursive: true })
  writeFileSync(`${DIR}/${id}.json`, JSON.stringify({ id, kinds: t.kinds, rows: t.rows, targetAtoms: area, candidates: top }, null, 1))
  console.log(id, t.kinds, 'target atoms', area, 'best scores', top.slice(0, 4).map((c) => c.score).join(' '))
}

function build() {
  const choicesPath = `${DIR}/choices.json`
  const choices: Record<string, number | string> = existsSync(choicesPath) ? JSON.parse(readFileSync(choicesPath, 'utf8')) : {}
  const lines: string[] = []
  const report: string[] = []
  for (const t of TARGETS) {
    // a choice may take the figure from another search: "l20c:4" (the search l20c, the fifth figure)
    const ch = choices[t.id]
    const [from, idx] = typeof ch === 'string' ? ch.split(':') : [t.id, String(ch ?? 0)]
    const file = `${DIR}/${from}.json`
    if (!existsSync(file)) {
      report.push(`${t.id}: no search yet`)
      continue
    }
    const d = JSON.parse(readFileSync(file, 'utf8')) as { candidates: Cand[] }
    const pick = d.candidates[Number(idx)]
    if (!pick) {
      report.push(`${t.id}: no candidate`)
      continue
    }
    const ids = idsOf(t.kinds)
    // the number of ways to fill the silhouette (the lattice solver)
    const polys = pick.placements.map(placementPoly)
    const w = Math.ceil(Math.max(...polys.flat().map((p) => p[0])))
    const h = Math.ceil(Math.max(...polys.flat().map((p) => p[1])))
    const grid = { w, h }
    const atoms = new Set<number>()
    for (const p of pick.placements) {
      const poly = placementPoly(p)
      for (let a = 0; a < w * h * 4; a++) {
        const cell = Math.floor(a / 4)
        const cx = cell % w
        const cy = (cell - cx) / w
        const k = a % 4
        const off = [[0.5, 1 / 6], [5 / 6, 0.5], [0.5, 5 / 6], [1 / 6, 0.5]][k]!
        const px = cx + off[0]!
        const py = cy + off[1]!
        let inside = true
        for (let i = 0; i < poly.length; i++) {
          const A = poly[i]!
          const B = poly[(i + 1) % poly.length]!
          if ((B[0] - A[0]) * (py - A[1]) - (B[1] - A[1]) * (px - A[0]) < 0) inside = false
        }
        if (inside) atoms.add(a)
      }
    }
    const sols = solve(grid, atoms, countKinds(ids), 5000)
    report.push(`${t.id} ${t.kinds} score ${pick.score} solutions ${sols.length}`)
    const sol = pick.placements.map((p) => `{ id: '${p.id}', rot: ${p.rot}, flip: ${p.flip}, x: ${p.x}, y: ${p.y} }`).join(', ')
    lines.push(`  { id: '${t.id}', pieces: [${ids.map((i) => `'${i}'`).join(', ')}], solution: [${sol}], ways: ${sols.length} }`)
  }
  const out = `/** The silhouettes of Bezalel's workshop, found by \`scripts/bezalel-design.ts\` (do not edit by hand): the pieces of a level, the way they lie in the finished figure, and how many ways the lattice solver finds. */
import type { PieceId, Placement } from './bezalelTangram'

export interface LevelData {
  id: string
  pieces: PieceId[]
  solution: Placement[]
  ways: number
}

export const LEVEL_DATA: LevelData[] = [
${lines.join(',\n')}
]
`
  writeFileSync('src/utils/bezalelLevelData.ts', out)
  console.log(report.join('\n'))
}

const [cmd, ...rest] = process.argv.slice(2)
if (cmd === 'search') {
  const ids = rest.length ? rest : TARGETS.map((t) => t.id)
  for (const id of ids) search(id)
} else if (cmd === 'build') build()
else console.log('usage: search [id ...] | build')
