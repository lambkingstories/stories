/**
 * "Das verlorene Lamm": the rules of the path puzzle (no Vue). A little lamb has lost its way; the child turns, slides, lifts and opens parts of a building of paths until
 * the lamb can walk to the shepherd. The building is a set of cells in 3D (x to the right and down on the screen, y to the left and down, z up). A cell is a floor tile
 * (or a stair). Some cells belong to a group that can be moved with a crank (turn, swing), a slider (slide, a lift is a slide upwards), a fold (a bridge that opens) or a gate.
 *
 * Two cells are joined when
 *  - they are next to each other and their floors meet at the same height (a stair has the height z at its low end and z+1 at its high end), or
 *  - they only seem to touch on the screen ("perspective", as in Monument Valley): the nearer cell N lies at F + e + k * (1, 1, 1) with e = +x or +y and k >= 1, i.e. its top
 *    meets the top of the far cell F along an edge, while it is in front of it and higher.
 * The lamb walks in the part of the building it stands in (a "component"); it never falls and nothing can be lost: every move can be undone, so there is no dead end.
 * The solver (`solveLevel`) searches all states (position of every group, part where the lamb stands) and is used by the tests to prove that every level can be won, with all
 * flowers, and that no state is a dead end.
 */

export type Dir = 0 | 1 | 2 | 3
/** The four directions in the floor plane: +x, +y, -x, -y (a stair is named by the direction of its high end). */
export const DX = [1, 0, -1, 0] as const
export const DY = [0, 1, 0, -1] as const

export type GroupKind = 'turn' | 'swing' | 'slide' | 'fold' | 'gate'

export interface ExtraCell {
  x: number
  y: number
  z: number
  stair?: Dir
  flower?: boolean
}

export interface GroupDef {
  /** One letter (a to h): the cells of the group are drawn with this letter in the layers. */
  id: string
  kind: GroupKind
  /** turn (4 states, every touch a quarter turn clockwise) and swing (2 states, a quarter turn and back): the centre of the turn in cell units (may end in .5). */
  pivot?: [number, number]
  /** slide: the step (in cells) and the number of steps; the slider runs to the end and back (a lift is a slide with a step of z). */
  step?: [number, number, number]
  n?: number
  /** Cells that are not drawn with a letter (stairs of a group). */
  extra?: ExtraCell[]
  /** The state at the start (fold: 0 = folded away, 1 = open; gate: 0 = closed, 1 = open; others: 0). */
  start?: number
}

/** A crank, slider or lever: the place where it stands (cell units, it stands still in the room) and the groups it moves (letters; one touch moves them all). */
export interface ControlDef {
  h: [number, number, number]
  g: string
}

export interface DecoDef {
  /** Name of the picture: tree, cypress, bush, rock, fence, reed. */
  s: string
  x: number
  y: number
  z: number
  /** Scale of the picture (1 = about one cell wide). */
  k?: number
  flip?: boolean
}

export interface LevelDef {
  id: string
  /** The chapter (0 to 4). */
  chapter: number
  /** The floors from z = 0 upwards, each a list of rows (y), each row a string of signs (x). See `parseLevel`. */
  layers: string[][]
  groups: GroupDef[]
  controls: ControlDef[]
  /** The fewest moves that win (checked by the tests against the solver). */
  min: number
  /** What the level shows first (a hint is told once per device). */
  intro?: 'walk' | 'stairs' | 'turn' | 'swing' | 'slide' | 'lift' | 'fold' | 'gate' | 'perspective' | 'ride' | 'link'
  deco?: DecoDef[]
  /** The moves for three stars (the best way to win with all flowers plus a little slack): written by the tests' solver, checked there. */
  par: number
}

export interface Cell {
  id: number
  /** Index of the group, -1 for a fixed cell. */
  g: number
  x: number
  y: number
  z: number
  /** The direction of the high end of a stair, -1 for a flat cell. */
  stair: number
  /** Index of the flower on this cell, -1 for none. */
  flower: number
  goal: boolean
  start: boolean
  /** A wooden floor (the cells of a group are always wooden). */
  wood: boolean
}

export interface GroupRT {
  def: GroupDef
  index: number

  /** Number of states. */
  states: number
  cells: number[]
}

export interface ControlRT {
  def: ControlDef
  index: number
  groups: number[]
}

export interface Model {
  def: LevelDef
  cells: Cell[]
  groups: GroupRT[]
  controls: ControlRT[]
  flowers: number
  start: number
  goal: number
  startState: number[]
}

/** How many groups at most and how many steps of a slider at most. */
export const MAX_GROUPS = 8

// ── reading a level ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Signs of a layer: `.` nothing, `#` fixed floor, `o` fixed floor with a flower, `w` fixed wooden floor, `S` the start, `G` the goal, `a` to `h` a cell of a group (a capital
 * letter: with a flower on it), `^ > v <` a fixed stair whose high end points to -y, +x, +y, -x.
 */
export function parseLevel(def: LevelDef): Model {
  const cells: Cell[] = []
  const groups: GroupRT[] = def.groups.map((gd, index) => ({
    def: gd,
    index,
    states: gd.kind === 'turn' ? 4 : gd.kind === 'slide' ? 2 * (gd.n ?? 1) : 2,
    cells: []
  }))
  let flowers = 0
  let start = -1
  let goal = -1
  const add = (x: number, y: number, z: number, g: number, stair: number, flower: boolean, extra: Partial<Cell> = {}): number => {
    const id = cells.length
    cells.push({ id, g, x, y, z, stair, flower: flower ? flowers++ : -1, goal: false, start: false, wood: g >= 0, ...extra })
    if (g >= 0) groups[g]!.cells.push(id)
    return id
  }
  const STAIRS: Record<string, number> = { '>': 0, v: 1, '<': 2, '^': 3 }
  def.layers.forEach((rows, z) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!
        if (ch === '.' || ch === ' ') continue
        if (ch === '#') add(x, y, z, -1, -1, false)
        else if (ch === 'o') add(x, y, z, -1, -1, true)
        else if (ch === 'w') add(x, y, z, -1, -1, false, { wood: true })
        else if (ch === 'S') start = add(x, y, z, -1, -1, false, { start: true })
        else if (ch === 'G') goal = add(x, y, z, -1, -1, false, { goal: true })
        else if (ch in STAIRS) add(x, y, z, -1, STAIRS[ch]!, false)
        else {
          const lower = ch.toLowerCase()
          const gi = def.groups.findIndex((g) => g.id === lower)
          if (gi < 0) throw new Error(`level ${def.id}: unknown sign "${ch}" at ${x},${y},${z}`)
          add(x, y, z, gi, -1, ch !== lower)
        }
      }
    })
  })
  def.groups.forEach((gd, gi) => {
    for (const e of gd.extra ?? []) add(e.x, e.y, e.z, gi, e.stair ?? -1, !!e.flower)
  })
  const controls: ControlRT[] = def.controls.map((cd, index) => ({
    def: cd,
    index,
    groups: [...cd.g].map((ch) => {
      const gi = def.groups.findIndex((x) => x.id === ch)
      if (gi < 0) throw new Error(`level ${def.id}: control ${index} moves an unknown group ${ch}`)
      return gi
    })
  }))
  if (start < 0 || goal < 0) throw new Error(`level ${def.id}: start or goal missing`)
  return { def, cells, groups, controls, flowers, start, goal, startState: def.groups.map((g) => g.start ?? 0) }
}

// ── where a cell is in a state of its group ─────────────────────────────────────────────────────────────────────────────────
export interface Pose {
  /** Quarter turns clockwise about the pivot (may be fractional while it moves). */
  rot: number
  dx: number
  dy: number
  dz: number
  /** The cells are there (a fold that is folded away has none). */
  on: boolean
  /** The gate is open (cells of other groups are always open). */
  open: boolean
}

/** The position of a slider in a state: it runs 0, 1, .. n and back (2n states). */
export function sliderPos(n: number, s: number): number {
  return s <= n ? s : 2 * n - s
}

export const NO_POSE: Pose = { rot: 0, dx: 0, dy: 0, dz: 0, on: true, open: true }

/** The pose of a group in a state. */
export function poseOf(g: GroupRT, s: number): Pose {
  const d = g.def
  switch (d.kind) {
    case 'turn':
      return { rot: s, dx: 0, dy: 0, dz: 0, on: true, open: true }
    case 'swing':
      return { rot: s, dx: 0, dy: 0, dz: 0, on: true, open: true }
    case 'slide': {
      const t = sliderPos(d.n ?? 1, s)
      const st = d.step ?? [1, 0, 0]
      return { rot: 0, dx: st[0] * t, dy: st[1] * t, dz: st[2] * t, on: true, open: true }
    }
    case 'fold':
      return { rot: 0, dx: 0, dy: 0, dz: 0, on: s === 1, open: true }
    case 'gate':
      return { rot: 0, dx: 0, dy: 0, dz: 0, on: true, open: s === 1 }
  }
}

/** The next state of a group when it is touched. */
export function nextState(g: GroupRT, s: number): number {
  return (s + 1) % g.states
}

/** A point turned about a pivot by `q` quarter turns clockwise (exact for whole turns). */
export function turnPoint(x: number, y: number, px: number, py: number, q: number): [number, number] {
  const ax = x - px
  const ay = y - py
  const r = Math.round(q)
  if (Math.abs(q - r) < 1e-9) {
    const k = ((r % 4) + 4) % 4
    if (k === 0) return [px + ax, py + ay]
    if (k === 1) return [px - ay, py + ax]
    if (k === 2) return [px - ax, py - ay]
    return [px + ay, py - ax]
  }
  const a = (q * Math.PI) / 2
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [px + ax * c - ay * s, py + ax * s + ay * c]
}

/** The (possibly fractional) place of a cell, given the pose of its group. */
export function placeOf(m: Model, c: Cell, pose: Pose): [number, number, number] {
  if (c.g < 0) return [c.x, c.y, c.z]
  const gd = m.groups[c.g]!.def
  let x = c.x
  let y = c.y
  if (pose.rot !== 0 && gd.pivot) [x, y] = turnPoint(c.x, c.y, gd.pivot[0], gd.pivot[1], pose.rot)
  return [x + pose.dx, y + pose.dy, c.z + pose.dz]
}

/** The direction of a stair cell in a pose (a turned group turns its stairs). */
export function stairDir(c: Cell, pose: Pose): number {
  if (c.stair < 0) return -1
  return (((c.stair + Math.round(pose.rot)) % 4) + 4) % 4
}

// ── the graph of one state ──────────────────────────────────────────────────────────────────────────────────────────────────
export interface Graph {
  x: Int16Array
  y: Int16Array
  z: Int16Array
  stair: Int8Array
  /** 1 when the cell is there. */
  present: Uint8Array
  /** 1 when the lamb may stand on it (there, and not behind a closed gate). */
  walk: Uint8Array
  adj: number[][]
  /** The part of the building (component) of each cell, -1 when it cannot be walked on. */
  comp: Int32Array
  /** The smallest cell of each part. */
  rep: number[]
  /** The flowers that lie in each part (bit mask). */
  flowerMask: number[]
  /** Two cells lie in the same place (the move is not allowed). */
  collide: boolean
  /** The pairs of cells that are joined only because they seem to touch on the screen (for the tests of the levels), as a flat list. */
  persp: number[]
}

const PERSP_K = 5

function key(x: number, y: number, z: number): number {
  return ((x + 64) * 256 + (y + 64)) * 256 + (z + 64)
}

/** Builds the graph of a state (the positions of all cells, which cells touch). */
export function buildGraph(m: Model, st: readonly number[]): Graph {
  const n = m.cells.length
  const gx = new Int16Array(n)
  const gy = new Int16Array(n)
  const gz = new Int16Array(n)
  const stair = new Int8Array(n).fill(-1)
  const present = new Uint8Array(n)
  const walk = new Uint8Array(n)
  const at = new Map<number, number>()
  let collide = false
  const poses = m.groups.map((g, i) => poseOf(g, st[i] ?? 0))
  for (const c of m.cells) {
    const pose = c.g < 0 ? NO_POSE : poses[c.g]!
    if (!pose.on) continue
    const [x, y, z] = placeOf(m, c, pose)
    gx[c.id] = Math.round(x)
    gy[c.id] = Math.round(y)
    gz[c.id] = Math.round(z)
    stair[c.id] = stairDir(c, pose)
    present[c.id] = 1
    walk[c.id] = pose.open ? 1 : 0
    const k = key(gx[c.id]!, gy[c.id]!, gz[c.id]!)
    if (at.has(k)) collide = true
    at.set(k, c.id)
  }
  const adj: number[][] = Array.from({ length: n }, () => [])
  const persp: number[] = []
  const link = (a: number, b: number) => {
    adj[a]!.push(b)
    adj[b]!.push(a)
  }
  /** The height of the floor of a cell at its side towards direction d (-1e9: it has no floor there: the side of a stair). */
  const edgeH = (i: number, d: number): number => {
    const s = stair[i]!
    if (s < 0) return gz[i]!
    if (d === s) return gz[i]! + 1
    if (d === (s + 2) % 4) return gz[i]!
    return -1e9
  }
  for (let i = 0; i < n; i++) {
    if (!walk[i]) continue
    const x = gx[i]!
    const y = gy[i]!
    const z = gz[i]!
    for (let d = 0; d < 4; d++) {
      const h0 = edgeH(i, d)
      if (h0 === -1e9) continue
      for (let dz = -1; dz <= 1; dz++) {
        const j = at.get(key(x + DX[d]!, y + DY[d]!, z + dz))
        // every pair is looked at from both sides: take it once, from the smaller cell
        if (j === undefined || !walk[j] || j < i) continue
        if (edgeH(j, (d + 2) % 4) === h0) link(i, j)
      }
    }
    // perspective: the cell N in front (and higher) that meets this far cell along an edge
    if (stair[i]! < 0) {
      for (let e = 0; e < 2; e++) {
        for (let k = 1; k <= PERSP_K; k++) {
          const j = at.get(key(x + DX[e]! + k, y + DY[e]! + k, z + k))
          if (j !== undefined && walk[j] && stair[j]! < 0) {
            link(i, j)
            persp.push(i, j)
          }
        }
      }
    }
  }
  // the parts
  const comp = new Int32Array(n).fill(-1)
  const rep: number[] = []
  const flowerMask: number[] = []
  for (let i = 0; i < n; i++) {
    if (!walk[i] || comp[i]! >= 0) continue
    const id = rep.length
    rep.push(i)
    let mask = 0
    const stack = [i]
    comp[i] = id
    while (stack.length) {
      const a = stack.pop()!
      const f = m.cells[a]!.flower
      if (f >= 0) mask |= 1 << f
      for (const b of adj[a]!) {
        if (comp[b]! < 0) {
          comp[b] = id
          stack.push(b)
        }
      }
    }
    flowerMask.push(mask)
  }
  return { x: gx, y: gy, z: gz, stair, present, walk, adj, comp, rep, flowerMask, collide, persp }
}

/** The way from one cell to another inside a part (shortest, as a list of cells without the first). Empty when the cell cannot be reached. */
export function pathTo(g: Graph, from: number, to: number): number[] {
  if (from === to) return []
  if (g.comp[from]! < 0 || g.comp[from] !== g.comp[to]) return []
  const prev = new Int32Array(g.adj.length).fill(-1)
  const q = [from]
  prev[from] = from
  for (let h = 0; h < q.length; h++) {
    const a = q[h]!
    if (a === to) break
    for (const b of g.adj[a]!) {
      if (prev[b]! < 0) {
        prev[b] = a
        q.push(b)
      }
    }
  }
  if (prev[to]! < 0) return []
  const out: number[] = []
  for (let a = to; a !== from; a = prev[a]!) out.push(a)
  return out.reverse()
}

// ── moves ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Touching the crank number `ci` (it moves its groups) while the lamb stands on cell `lamb`: the new state, or null when the move is not possible (the lamb stands on a floor that would
 * vanish or close, or two cells would lie in the same place).
 */
export function moveTarget(m: Model, st: readonly number[], ci: number): number[] {
  const next = st.slice()
  for (const gi of m.controls[ci]!.groups) next[gi] = nextState(m.groups[gi]!, st[gi] ?? 0)
  return next
}

export function tryMove(m: Model, st: readonly number[], ci: number, lamb: number): number[] | null {
  const next = moveTarget(m, st, ci)
  const g = buildGraph(m, next)
  if (g.collide) return null
  if (!g.walk[lamb]) return null
  return next
}

/** The number that stands for a state (mixed radix). */
export function stateKey(m: Model, st: readonly number[]): number {
  let k = 0
  for (let i = 0; i < m.groups.length; i++) k = k * 8 + (st[i] ?? 0)
  return k
}

export function won(m: Model, g: Graph, lamb: number): boolean {
  return g.comp[lamb]! >= 0 && g.comp[lamb] === g.comp[m.goal]
}

// ── the solver ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Node {
  st: number[]
  rep: number
  /** Edges: crank touched, the cell the lamb stands on, node reached. */
  out: { g: number; s: number; to: number }[]
  win: boolean
}

export interface Space {
  m: Model
  nodes: Node[]
  index: Map<string, number>
  graphs: Map<number, Graph>
  /** Fewest moves to win from each node (-1: not possible). */
  dist: Int32Array
  /** How many moves were not possible because two cells would lie in the same place (a fault of the level, must be 0). */
  collisions: number
}

export function graphOf(space: { m: Model; graphs: Map<number, Graph> }, st: readonly number[]): Graph {
  const k = stateKey(space.m, st)
  let g = space.graphs.get(k)
  if (!g) {
    g = buildGraph(space.m, st)
    space.graphs.set(k, g)
  }
  return g
}

/** All states that can be reached from the start: a node is a state of the groups plus the part of the building the lamb stands in. */
export function explore(m: Model, startState?: number[], startCell?: number, limit = 400000): Space {
  const space: Space = { m, nodes: [], index: new Map(), graphs: new Map(), dist: new Int32Array(0), collisions: 0 }
  const st0 = (startState ?? m.startState).slice()
  const g0 = graphOf(space, st0)
  const lamb0 = startCell ?? m.start
  const nodeOf = (st: number[], rep: number): number => {
    const k = `${stateKey(m, st)}:${rep}`
    const have = space.index.get(k)
    if (have !== undefined) return have
    const gr = graphOf(space, st)
    space.nodes.push({ st, rep, out: [], win: gr.comp[m.goal]! >= 0 && gr.rep[gr.comp[m.goal]!] === rep })
    space.index.set(k, space.nodes.length - 1)
    return space.nodes.length - 1
  }
  nodeOf(st0, g0.rep[g0.comp[lamb0]!]!)
  for (let h = 0; h < space.nodes.length && h < limit; h++) {
    const node = space.nodes[h]!
    const g = graphOf(space, node.st)
    const comp = g.comp[node.rep]!
    const members: number[] = []
    for (let i = 0; i < g.comp.length; i++) if (g.comp[i] === comp) members.push(i)
    for (let gi = 0; gi < m.controls.length; gi++) {
      const seen = new Set<number>()
      const next = moveTarget(m, node.st, gi)
      const ng = graphOf(space, next)
      if (ng.collide) {
        space.collisions++
        continue
      }
      for (const s of members) {
        if (!ng.walk[s]) continue
        const nrep = ng.rep[ng.comp[s]!]!
        const to = nodeOf(next, nrep)
        if (seen.has(to)) continue
        seen.add(to)
        node.out.push({ g: gi, s, to })
      }
    }
  }
  // the fewest moves to win from every node (backwards)
  const n = space.nodes.length
  const back: number[][] = Array.from({ length: n }, () => [])
  space.nodes.forEach((nd, i) => nd.out.forEach((e) => back[e.to]!.push(i)))
  const dist = new Int32Array(n).fill(-1)
  const q: number[] = []
  space.nodes.forEach((nd, i) => {
    if (nd.win) {
      dist[i] = 0
      q.push(i)
    }
  })
  for (let h = 0; h < q.length; h++) {
    const a = q[h]!
    for (const b of back[a]!) {
      if (dist[b]! < 0) {
        dist[b] = dist[a]! + 1
        q.push(b)
      }
    }
  }
  space.dist = dist
  return space
}

export interface Solution {
  /** Fewest moves to win (-1: cannot be won). */
  best: number
  /** Fewest moves to win with every flower in the bag (-1: not possible). */
  bestAll: number
  /** The moves of the best way with all flowers (crank, cell the lamb stands on). */
  way: { g: number; s: number }[]
  /** States from which the goal cannot be reached any more (must be 0). */
  deadEnds: number
  nodes: number
  collisions: number
}

/** The best ways: to the goal, and to the goal with all flowers (the lamb picks every flower in the part it stands in). */
export function solveLevel(m: Model): Solution {
  const space = explore(m)
  const full = (1 << m.flowers) - 1
  const nodeMask = (i: number): number => {
    const nd = space.nodes[i]!
    const g = graphOf(space, nd.st)
    return g.flowerMask[g.comp[nd.rep]!]!
  }
  // breadth first over (node, bag)
  const seen = new Map<number, { prev: number; g: number; s: number; d: number }>()
  const keyOf = (i: number, mask: number) => i * (full + 1) + mask
  const start = 0
  const m0 = nodeMask(start)
  seen.set(keyOf(start, m0), { prev: -1, g: -1, s: -1, d: 0 })
  const q: [number, number][] = [[start, m0]]
  let bestAll = -1
  let last = -1
  for (let h = 0; h < q.length; h++) {
    const [i, mask] = q[h]!
    const info = seen.get(keyOf(i, mask))!
    if (space.nodes[i]!.win && mask === full) {
      bestAll = info.d
      last = keyOf(i, mask)
      break
    }
    for (const e of space.nodes[i]!.out) {
      const nm = mask | nodeMask(e.to)
      const k = keyOf(e.to, nm)
      if (seen.has(k)) continue
      seen.set(k, { prev: keyOf(i, mask), g: e.g, s: e.s, d: info.d + 1 })
      q.push([e.to, nm])
    }
  }
  const way: { g: number; s: number }[] = []
  for (let k = last; k >= 0; ) {
    const info = seen.get(k)!
    if (info.prev < 0) break
    way.push({ g: info.g, s: info.s })
    k = info.prev
  }
  way.reverse()
  const deadEnds = Array.from(space.dist).filter((d) => d < 0).length
  return { best: space.dist[start]!, bestAll, way, deadEnds, nodes: space.nodes.length, collisions: space.collisions }
}

/** The extra moves that three stars allow beyond the best way. */
export function slack(best: number): number {
  return Math.max(1, Math.floor(best / 4))
}

/** The stars of a won round. */
export function starsFor(flowersGot: number, flowersAll: number, moves: number, par: number): number {
  if (flowersGot < flowersAll) return 1
  return moves <= par ? 3 : 2
}

/** The tip: which group to touch next (and where the lamb should stand), or null when the lamb can walk to the goal already. */
export function tipFor(space: Space, st: readonly number[], lamb: number): { g: number; s: number; need: boolean } | null {
  const m = space.m
  const g = graphOf(space, st as number[])
  const rep = g.rep[g.comp[lamb]!]!
  const idx = space.index.get(`${stateKey(m, st)}:${rep}`)
  if (idx === undefined) return null
  const here = space.dist[idx]!
  if (here <= 0) return null
  const good = space.nodes[idx]!.out.filter((e) => space.dist[e.to]! === here - 1)
  if (!good.length) return null
  // the move for which the lamb can stand where it is (or the one nearest)
  const byGroup = new Map<number, number[]>()
  for (const e of good) byGroup.set(e.g, [...(byGroup.get(e.g) ?? []), e.s])
  const [gi, cells] = [...byGroup.entries()][0]!
  const own = cells.includes(lamb)
  // does any place of the part work? then it does not matter where the lamb stands
  const members: number[] = []
  for (let i = 0; i < g.comp.length; i++) if (g.comp[i] === g.comp[lamb]) members.push(i)
  const any = members.every((c) => cells.includes(c))
  return { g: gi, s: own ? lamb : cells[0]!, need: !any && !own }
}
