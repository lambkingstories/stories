<script setup lang="ts">
/**
 * "Das verlorene Lamm": the big path puzzle (rules in `utils/lammGame.ts`, levels in `utils/lammLevels.ts`, the view in `utils/lammView.ts`; this file draws it and takes the touch).
 * A little lamb has lost its way (Psalm 23, Luke 15:3-7). The child touches the place where the lamb shall go and turns, slides, lifts and folds parts of a building of paths
 * with cranks until a way to the shepherd opens. Five chapters after Psalm 23. Nothing can be lost: every move can be undone, there is no time and no falling.
 *
 * Drawing: the floor tiles are boxes in a light isometric view; their tops and sides are painted textures put on with an affine transform, the lamb, the shepherd, the flowers,
 * the trees and the cranks are painted pictures, the glow, the sparks and the shadows are effects.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import {
  buildGraph, explore, graphOf, parseLevel, pathTo, placeOf, poseOf, sliderPos, stairDir, stateKey, starsFor, tipFor, tryMove, won,
  type Cell, type ControlRT, type Graph, type Model, type Pose, type Space
} from '@/utils/lammGame'
import { CHAPTERS, LEVELS } from '@/utils/lammLevels'
import { DECO_HEIGHT, depthKey, project, unproject, type View } from '@/utils/lammView'
import { cellExt, cellReach, goalReach, handleKind, pictureSize, planLevel, spotAt, type Plan, type Spot } from '@/utils/lammHit'
import { decoShape, flockShape, flowerShape, gateShape, handleShape, lambShape, shepherdShape } from '@/utils/lammFallback'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'lamm'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  'lamm-1', 'lamm-2', 'lamm-3', 'lamm-4', 'lamm-5', 'lamm-6', 'hirte-1', 'hirte-2', 'herde-1', 'herde-2',
  'blume-1', 'blume-2', 'blume-3', 'blume-4', 'baum', 'zypresse', 'busch', 'fels', 'zaun', 'schilf', 'kurbel', 'schieber', 'hebel', 'tor',
  't-gras', 't-wiese', 't-kiesel', 't-nacht', 't-hof', 't-holz', 's-erde', 's-fels', 's-sandstein', 's-holz', 's-nacht', 's-moos',
  'bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/lamm/${n}.webp`)

function loadImage(n: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const i = new Image()
    i.onload = () => {
      img[n] = i
      resolve()
    }
    i.onerror = () => resolve()
    i.src = pic(n)
  })
}
async function loadAll() {
  await Promise.all(NAMES.map(loadImage))
  loaded.value = true
}

/** The top and the side of the fixed floors of each chapter, and the colours that stand in when a picture is missing. */
const FLOORS = {
  gras: { top: 't-gras', side: 's-erde', topC: '#86b455', sideC: '#8a6a45' },
  wiese: { top: 't-wiese', side: 's-moos', topC: '#93c460', sideC: '#6f8f55' },
  kiesel: { top: 't-kiesel', side: 's-fels', topC: '#9aa4a8', sideC: '#6b7075' },
  nacht: { top: 't-nacht', side: 's-nacht', topC: '#3c6a84', sideC: '#26344e' },
  hof: { top: 't-hof', side: 's-sandstein', topC: '#e8d3a4', sideC: '#c9aa73' }
}
const WOOD = { top: 't-holz', side: 's-holz', topC: '#c08a54', sideC: '#7a5230' }
/** The sky and the ground colour of each chapter while its painted background is missing. */
const BG_COLORS: [string, string][] = [['#bfe0f0', '#dff0c0'], ['#cdeaf5', '#cfe9a8'], ['#b7e0ea', '#a9d4d8'], ['#0f1a3c', '#27406a'], ['#f6d9a0', '#f0c890']]

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const tipText = ref('')
const tipShown = ref(false)
const levelNames = computed(() => ((tm('app.bigGames.lamm.levels') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const chapterTexts = computed(() => ((tm('app.bigGames.lamm.chapters') as unknown as { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0] }[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref) })))
const storyTexts = computed(() => ((tm('app.bigGames.lamm.story') as unknown as { text: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }[]) ?? []).map((m) => ({ text: rt(m.text), task: rt(m.task) })))
const levelStars = computed(() => progress.levels(ID))
const levelTitle = (i: number) => levelNames.value[i] ?? String(i + 1)
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterStars = (ci: number) => LEVELS.reduce((n, l, i) => (l.chapter === ci ? n + (levelStars.value[i] ?? 0) : n), 0)
const chapterMax = (ci: number) => LEVELS.filter((l) => l.chapter === ci).length * 3
const chapterLevels = (ci: number) => LEVELS.map((l, i) => ({ l, i })).filter((x) => x.l.chapter === ci)
const hasNext = computed(() => level.value < LEVELS.length - 1)
const allDone = computed(() => outcome.stars > 0 && level.value === LEVELS.length - 1)

/** What the page shows while it plays (the game itself is not reactive). */
const hud = reactive({ moves: 0, par: 0, flowers: 0, flowersAll: 0, connected: false, canUndo: false, won: false })
const outcome = reactive({ stars: 0, flowers: 0, flowersAll: 0, moves: 0, par: 0 })

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Anim {
  /** The groups that move, where they come from and where they go (states). */
  groups: number[]
  from: number[]
  to: number[]
  t: number
  dur: number
}
interface Run {
  m: Model
  st: number[]
  lamb: number
  graphs: Map<number, Graph>
  graph: Graph
  space: Space | null
  /** The cells the lamb still has to walk to, and the step it is in. */
  path: number[]
  from: number
  to: number
  stepT: number
  target: number
  anim: Anim | null
  pending: number
  /** A touch on the floor while a part was moving: made when it has come to rest. */
  queuedTap: { x: number; y: number } | null
  moves: number
  history: { st: number[] }[]
  got: number
  connected: boolean
  won: boolean
  wonT: number
  flowersAll: number
  chapter: number
}
let run: Run | null = null
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
let view: View = { s: 40, ox: 0, oy: 0 }
let clock = 0

const bitCount = (n: number): number => {
  let c = 0
  for (let v = n; v; v &= v - 1) c++
  return c
}

function newRun(i: number): Run {
  const def = LEVELS[i]!
  const m = parseLevel(def)
  const graphs = new Map<number, Graph>()
  const st = m.startState.slice()
  const graph = graphOf({ m, graphs }, st)
  return {
    m, st, lamb: m.start, graphs, graph, space: null, path: [], from: m.start, to: m.start, stepT: 1, target: -1, anim: null, pending: -1, queuedTap: null, moves: 0, history: [], got: 0,
    connected: false, won: false, wonT: 0, flowersAll: m.flowers, chapter: def.chapter
  }
}

/** The place of the building and of the touch areas of the cranks: made once for each level and screen size (the touch areas never lie on a street, see `lammHit.ts`). */
const plans = new Map<string, Plan>()
let plan: Plan | null = null
function layout() {
  if (!run) return
  const key = `${run.m.def.id}|${Math.round(cvW)}|${Math.round(cvH)}`
  let p = plans.get(key)
  if (!p) {
    p = planLevel(run.m, cvW, cvH)
    if (plans.size > 80) plans.clear()
    plans.set(key, p)
  }
  plan = p
  view = p.view
}
const spots = (): readonly Spot[] => plan?.spots ?? []

function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  layout()
}

// ── starting a level ────────────────────────────────────────────────────────────────────────────────────────────────────────
function begin(i: number) {
  level.value = i
  run = newRun(i)
  layout()
  hud.moves = 0
  hud.par = LEVELS[i]!.par
  hud.flowers = 0
  hud.flowersAll = run.flowersAll
  hud.connected = false
  hud.canUndo = false
  hud.won = false
  parts.length = 0
  screen.value = 'play'
  how.value = !howSeen(ID)
  paused.value = how.value
  story.value = null
  tipShown.value = false
  idleT = 0
  glowGroup = -1
  glowCell = -1
  if (!how.value) maybeStory()
  if (!how.value && !story.value) hintOnce(LEVELS[i]!.intro)
  setProbe()
  // the search for the tip is done a moment later (it can take a little on big levels)
  const r = run
  window.setTimeout(() => {
    if (run === r && !r.space) r.space = explore(r.m)
  }, 600)
  checkConnected(false)
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') {
    if (maybeStory()) return
    paused.value = false
    hintOnce(LEVELS[level.value]!.intro)
  }
}

// ── the story of a chapter ──────────────────────────────────────────────────────────────────────────────────────────────────
const STORY_KEY = 'lk-lamm-story-v1'
const story = ref<{ chapter: number } | null>(null)
function storySeen(ci: number): boolean {
  try {
    return (JSON.parse(localStorage.getItem(STORY_KEY) ?? '{}') as Record<string, boolean>)[String(ci)] === true
  } catch {
    return false
  }
}
function markStory(ci: number) {
  try {
    const all = JSON.parse(localStorage.getItem(STORY_KEY) ?? '{}') as Record<string, boolean>
    all[String(ci)] = true
    localStorage.setItem(STORY_KEY, JSON.stringify(all))
  } catch {
    // not remembered: the story comes again
  }
}
function maybeStory(): boolean {
  const ci = chapterOf(level.value)
  if (level.value !== LEVELS.findIndex((l) => l.chapter === ci) || storySeen(ci)) return false
  story.value = { chapter: ci }
  paused.value = true
  return true
}
function openStory(ci: number) {
  story.value = { chapter: ci }
}
function closeStory() {
  if (story.value) markStory(story.value.chapter)
  story.value = null
  if (screen.value === 'play') {
    paused.value = false
    hintOnce(LEVELS[level.value]!.intro)
  }
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
}

// ── hints ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let tipTimer = 0
function say(text: string, sec = 5) {
  tipText.value = text
  tipShown.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tipShown.value = false), sec * 1000)
}
const HINTS_KEY = 'lk-lamm-hints-v1'
function hintOnce(intro: string | undefined) {
  if (!intro) return
  let seen: Record<string, boolean> = {}
  try {
    seen = JSON.parse(localStorage.getItem(HINTS_KEY) ?? '{}') as Record<string, boolean>
  } catch {
    seen = {}
  }
  if (seen[intro]) return
  seen[intro] = true
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify(seen))
  } catch {
    // not remembered: the word comes again
  }
  say(t(`app.bigGames.lamm.hint.${intro}`), 9)
}

/** The tip: the crank to touch next glows (and a floor tile when the lamb has to stand on a certain part). */
let glowGroup = -1
let glowCell = -1
let glowT = 0
function showTip() {
  const r = run
  if (!r || paused.value || r.won) return
  if (!r.space) r.space = explore(r.m)
  if (won(r.m, r.graph, r.lamb)) {
    say(t('app.bigGames.lamm.tipWalk'), 6)
    return
  }
  const tip = tipFor(r.space, r.st, r.lamb)
  if (!tip) {
    say(t('app.bigGames.lamm.tipNone'), 6)
    return
  }
  glowGroup = tip.g
  glowCell = tip.need ? tip.s : -1
  glowT = 6
  say(t(tip.need ? 'app.bigGames.lamm.tipRide' : 'app.bigGames.lamm.tipCrank'), 6)
}

// ── what happens ────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Part {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  color: string
}
const parts: Part[] = []
function spark(x: number, y: number, n: number, color = '#ffe08a', speed = 70) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const v = speed * (0.3 + Math.random() * 0.7)
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, t: 0, life: 0.5 + Math.random() * 0.6, r: 1.2 + Math.random() * 2.2, color })
  }
}

function cellScreen(r: Run, id: number): [number, number] {
  const c = r.m.cells[id]!
  const pose = poseFor(r, c)
  const [x, y, z] = placeOf(r.m, c, pose)
  return project(view, x, y, z + surfaceOffset(c))
}
const surfaceOffset = (c: Cell): number => (c.stair >= 0 ? 0.5 : 0)

function checkConnected(announce = true) {
  const r = run
  if (!r) return
  const now = won(r.m, r.graph, r.lamb)
  if (now && !r.connected && announce) {
    play('right')
    const [sx, sy] = cellScreen(r, r.m.goal)
    spark(sx, sy - view.s, 22, '#fff3b0', 90)
    say(t('app.bigGames.lamm.called'), 5)
  }
  r.connected = now
  hud.connected = now
}

/** The lamb has come to a cell: pick a flower, win at the goal. */
function arrive(r: Run, id: number) {
  const c = r.m.cells[id]!
  if (c.flower >= 0 && !(r.got & (1 << c.flower))) {
    r.got |= 1 << c.flower
    hud.flowers = bitCount(r.got)
    const [sx, sy] = cellScreen(r, id)
    spark(sx, sy - view.s * 0.5, 16, '#ffe9a0', 80)
    play('bead', 1, 1 + 0.12 * (hud.flowers - 1))
    hopT = 0.5
  }
  // the round is won when the lamb comes to rest at the shepherd (a flower can lie behind him: walking past him on the way is not the end)
  if (id === r.m.goal && r.path.length === 0 && r.pending < 0) finish(r)
}

function finish(r: Run) {
  if (r.won) return
  r.won = true
  r.wonT = 0
  hud.won = true
  const stars = starsFor(bitCount(r.got), r.flowersAll, r.moves, LEVELS[level.value]!.par)
  outcome.stars = stars
  outcome.flowers = bitCount(r.got)
  outcome.flowersAll = r.flowersAll
  outcome.moves = r.moves
  outcome.par = LEVELS[level.value]!.par
  progress.record(ID, level.value, stars)
  play('fanfare')
  const [sx, sy] = cellScreen(r, r.m.goal)
  spark(sx, sy - view.s, 50, '#fff0a0', 120)
  window.setTimeout(() => {
    if (screen.value !== 'play' || run !== r) return
    screen.value = 'result'
    play('result')
  }, 2300)
}

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
function pointerPos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  // the size is measured again at every touch (a page that changed without a resize event would shift the finger)
  if (Math.abs(r.width - cvW) > 0.5 || Math.abs(r.height - cvH) > 0.5 || Math.min(window.devicePixelRatio || 1, 2) !== dpr) resize()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky }
}

/** The crank (its number) under a point, or -1: every crank has a round touch area of its own that lies on no street (see `planLevel`). */
function handleAt(px: number, py: number): number {
  return spotAt(spots(), px, py)
}

/** The cell the lamb can walk to under a point (the nearest one in front when several lie behind each other), or -1. */
function cellAt(r: Run, px: number, py: number): number {
  let best = -1
  let bestK = -Infinity
  for (const c of r.m.cells) {
    if (!r.graph.walk[c.id]) continue
    const pose = poseFor(r, c)
    const [x, y, z] = placeOf(r.m, c, pose)
    const zz = z + surfaceOffset(c)
    const [wx, wy] = unproject(view, px, py, zz)
    const ext = cellExt(c)
    if (Math.abs(wx - x) <= ext && Math.abs(wy - y) <= ext) {
      const k = depthKey(x, y, z)
      if (k > bestK) {
        bestK = k
        best = c.id
      }
    }
  }
  if (best >= 0) return best
  // a finger is bigger than a tile: the nearest cell within a little way
  let bestD = cellReach(view.s)
  for (const c of r.m.cells) {
    if (!r.graph.walk[c.id]) continue
    const [sx, sy] = cellScreen(r, c.id)
    const d = Math.hypot(px - sx, py - sy)
    if (d < bestD) {
      bestD = d
      best = c.id
    }
  }
  return best
}

function onDown(e: PointerEvent) {
  const r = run
  if (screen.value !== 'play' || paused.value || !r || r.won) return
  const p = pointerPos(e)
  idleT = 0
  const h = handleAt(p.x, p.y)
  if (h >= 0) {
    touchHandle(r, h)
    return
  }
  if (r.anim) {
    r.queuedTap = { x: p.x, y: p.y }
    return
  }
  // the shepherd stands above his floor tile: a touch on him is a touch on the goal
  if (r.connected) {
    const [gx, gy] = cellScreen(r, r.m.goal)
    if (Math.hypot(p.x - gx, p.y - (gy - view.s * 0.9)) < goalReach(view.s)) {
      walkTo(r, r.m.goal)
      return
    }
  }
  const cell = cellAt(r, p.x, p.y)
  if (cell < 0) return
  walkTo(r, cell)
}

function walkTo(r: Run, cell: number) {
  if (r.anim) return
  // the lamb is walking: it finishes its step, then goes the new way
  const from = r.stepT < 1 ? r.to : r.lamb
  if (r.graph.comp[cell]! < 0 || r.graph.comp[cell] !== r.graph.comp[from]) {
    play('wrong', 0.6)
    say(t('app.bigGames.lamm.noWay'), 4)
    bleatT = 1
    return
  }
  if (cell === from && r.stepT >= 1) {
    // standing at the shepherd already (the lamb stopped there on the way): a touch on him ends the round
    if (cell === r.m.goal) finish(r)
    else hopT = 0.5
    return
  }
  r.target = cell
  r.path = pathTo(r.graph, from, cell)
  // a little ring of sparks shows where the lamb goes
  const [tx, ty] = cellScreen(r, cell)
  spark(tx, ty, 6, '#ffffff', 32)
  if (r.stepT >= 1) {
    play('tap', 0.5)
    startStep(r)
  }
}

function startStep(r: Run) {
  const next = r.path.shift()
  if (next === undefined) {
    r.stepT = 1
    return
  }
  r.from = r.lamb
  r.to = next
  r.stepT = 0
}

function touchHandle(r: Run, gi: number) {
  if (r.won) return
  if (r.anim) {
    // a second touch while a part moves is kept and made right after
    r.pending = gi
    return
  }
  glowGroup = -1
  glowCell = -1
  if (r.stepT < 1) {
    // the lamb ends its step, then the move is made
    r.pending = gi
    r.path = []
    return
  }
  doMove(r, gi)
}

function doMove(r: Run, gi: number) {
  const next = tryMove(r.m, r.st, gi, r.lamb)
  if (!next) {
    // find out why: stands on a floor that goes away, or something in the way
    const test = r.st.slice()
    for (const g of r.m.controls[gi]!.groups) test[g] = (test[g]! + 1) % r.m.groups[g]!.states
    const g2 = buildGraph(r.m, test)
    play('wrong', 0.7)
    bleatT = 1
    say(t(g2.collide ? 'app.bigGames.lamm.inTheWay' : 'app.bigGames.lamm.standing'), 5)
    return
  }
  r.history.push({ st: r.st.slice() })
  startAnim(r, r.st, next, true)
  r.moves++
  hud.moves = r.moves
  hud.canUndo = true
}

function startAnim(r: Run, from: number[], to: number[], real: boolean) {
  const groups: number[] = []
  for (let i = 0; i < to.length; i++) if (from[i] !== to[i]) groups.push(i)
  const slow = groups.some((i) => r.m.groups[i]!.def.kind === 'turn' || r.m.groups[i]!.def.kind === 'swing')
  r.anim = { groups, from: groups.map((i) => from[i]!), to: groups.map((i) => to[i]!), t: 0, dur: slow ? 0.7 : 0.55 }
  r.st = to.slice()
  r.pending = -1
  play('flip', real ? 0.5 : 0.4)
}

function undo() {
  const r = run
  if (!r || paused.value || r.won || r.anim || r.stepT < 1 || !r.history.length) return
  const prev = r.history[r.history.length - 1]!.st
  const g2 = buildGraph(r.m, prev)
  if (g2.collide || !g2.walk[r.lamb]) {
    play('wrong', 0.7)
    say(t('app.bigGames.lamm.standing'), 4)
    return
  }
  r.history.pop()
  r.moves = Math.max(0, r.moves - 1)
  hud.moves = r.moves
  hud.canUndo = r.history.length > 0
  startAnim(r, r.st, prev, false)
}

/** The move is over: the graph of the new state is the one the lamb walks in. */
function animDone(r: Run) {
  r.anim = null
  play('snap', 0.8)
  r.graph = graphOf({ m: r.m, graphs: r.graphs }, r.st)
  r.path = []
  checkConnected()
  const q = r.queuedTap
  r.queuedTap = null
  if (q && r.pending < 0) {
    const cell = r.connected && Math.hypot(q.x - cellScreen(r, r.m.goal)[0], q.y - (cellScreen(r, r.m.goal)[1] - view.s * 0.9)) < view.s ? r.m.goal : cellAt(r, q.x, q.y)
    if (cell >= 0) walkTo(r, cell)
  }
}

// ── poses of the groups (also while they move) ──────────────────────────────────────────────────────────────────────────────
interface DrawPose extends Pose {
  alpha: number
  gate: number
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const dp: DrawPose = { rot: 0, dx: 0, dy: 0, dz: 0, on: true, open: true, alpha: 1, gate: 1 }

function poseFor(r: Run, c: Cell): DrawPose {
  dp.rot = 0
  dp.dx = 0
  dp.dy = 0
  dp.dz = 0
  dp.on = true
  dp.open = true
  dp.alpha = 1
  dp.gate = 1
  if (c.g < 0) return dp
  const g = r.m.groups[c.g]!
  const a = r.anim
  const k = a ? a.groups.indexOf(c.g) : -1
  if (!a || k < 0) {
    const p = poseOf(g, r.st[c.g] ?? 0)
    dp.rot = p.rot
    dp.dx = p.dx
    dp.dy = p.dy
    dp.dz = p.dz
    dp.on = p.on
    dp.gate = p.open ? 1 : 0
    dp.alpha = p.on ? 1 : 0
    return dp
  }
  const f = ease(Math.min(1, a.t / a.dur))
  const s0 = a.from[k]!
  const s1 = a.to[k]!
  const d = g.def
  if (d.kind === 'turn') {
    const delta = (s1 - s0 + 4) % 4 === 1 ? 1 : -1
    dp.rot = s0 + delta * f
  } else if (d.kind === 'swing') {
    dp.rot = s0 + (s1 - s0) * f
  } else if (d.kind === 'slide') {
    const n = d.n ?? 1
    const p0 = sliderPos(n, s0)
    const p1 = sliderPos(n, s1)
    const st = d.step ?? [1, 0, 0]
    const p = p0 + (p1 - p0) * f
    dp.dx = st[0] * p
    dp.dy = st[1] * p
    dp.dz = st[2] * p
  } else if (d.kind === 'fold') {
    const on = s1 === 1 ? f : 1 - f
    dp.alpha = on
    dp.dz = -(1 - on) * 0.7
    dp.on = on > 0.001
  } else {
    dp.gate = s1 === 1 ? f : 1 - f
  }
  return dp
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let sizeObserver: ResizeObserver | null = null
let hopT = 0
let bleatT = 0
let idleT = 0
let walkClock = 0
let flipLeft = false

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  advance(dt)
  draw(now / 1000, dt)
}

/** The lamb walks, the groups move, the sparks fly. */
function advance(dt: number) {
  clock += dt
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]!
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 120 * dt
    if (p.t > p.life) parts.splice(i, 1)
  }
  if (hopT > 0) hopT -= dt
  if (bleatT > 0) bleatT -= dt
  if (glowT > 0) {
    glowT -= dt
    if (glowT <= 0) {
      glowGroup = -1
      glowCell = -1
    }
  }
  const r = run
  if (!r || screen.value !== 'play' || paused.value) return
  idleT += dt
  if (r.won) {
    r.wonT += dt
    return
  }
  if (r.anim) {
    r.anim.t += dt
    if (r.anim.t >= r.anim.dur) animDone(r)
    return
  }
  // the lamb
  if (r.stepT < 1) {
    const perspective = isPerspectiveStep(r)
    const sec = perspective ? 0.5 : 0.36
    r.stepT = Math.min(1, r.stepT + dt / sec)
    walkClock += dt
    const [ax] = cellScreen(r, r.from)
    const [bx] = cellScreen(r, r.to)
    if (Math.abs(bx - ax) > 0.5) flipLeft = bx < ax
    if (r.stepT >= 1) {
      r.lamb = r.to
      r.from = r.to
      arrive(r, r.lamb)
      if (r.won) return
      if (r.pending >= 0) {
        r.path = []
        const gi = r.pending
        r.pending = -1
        doMove(r, gi)
      } else if (r.path.length) startStep(r)
      else checkConnected()
    }
    return
  }
  if (r.pending >= 0) {
    const gi = r.pending
    r.pending = -1
    doMove(r, gi)
  }
}

function isPerspectiveStep(r: Run): boolean {
  const a = r.m.cells[r.from]!
  const b = r.m.cells[r.to]!
  const g = r.graph
  return Math.abs(g.x[a.id]! - g.x[b.id]!) + Math.abs(g.y[a.id]! - g.y[b.id]!) + Math.abs(g.z[a.id]! - g.z[b.id]!) > 2
}

// ── drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Item {
  k: number
  type: number
  a: number
  b: number
  x: number
  y: number
  z: number
}
const T_CELL = 0
const T_DECO = 2
const T_LAMB = 3
const T_FLOWER = 4
const T_GOAL = 5
const items: Item[] = []


function draw(time: number, dt: number) {
  const c = ctx
  const r = run
  if (!c) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawBackground(c, r?.chapter ?? 0, time)
  if (!r || !loaded.value || screen.value === 'menu') return
  drawTethers(c, r)
  items.length = 0
  const g = r.graph
  for (const cell of r.m.cells) {
    const pose = poseFor(r, cell)
    if (!pose.on && pose.alpha <= 0.001) continue
    const [x, y, z] = placeOf(r.m, cell, pose)
    items.push({ k: depthKey(x, y, z), type: T_CELL, a: cell.id, b: 0, x, y, z })
    if (cell.flower >= 0 && !(r.got & (1 << cell.flower)) && pose.alpha > 0.5) items.push({ k: depthKey(x, y, z) + 0.3, type: T_FLOWER, a: cell.id, b: 0, x, y, z })
    if (cell.goal) items.push({ k: depthKey(x, y, z) + 0.2, type: T_GOAL, a: cell.id, b: 0, x, y, z })
  }
  for (let i = 0; i < (r.m.def.deco?.length ?? 0); i++) {
    const d = r.m.def.deco![i]!
    items.push({ k: depthKey(d.x, d.y, d.z) + 0.1, type: T_DECO, a: i, b: 0, x: d.x, y: d.y, z: d.z })
  }
  // the lamb
  const [lx, ly, lk] = lambPlace(r)
  items.push({ k: lk, type: T_LAMB, a: 0, b: 0, x: lx, y: ly, z: 0 })
  items.sort((p, q) => p.k - q.k)
  for (const it of items) {
    switch (it.type) {
      case T_CELL:
        drawCell(c, r, r.m.cells[it.a]!, time)
        break
      case T_FLOWER:
        drawFlower(c, r, r.m.cells[it.a]!, time)
        break
      case T_GOAL:
        drawGoal(c, r, r.m.cells[it.a]!, time)
        break
      case T_DECO:
        drawDeco(c, r.m.def.deco![it.a]!)
        break
      case T_LAMB:
        drawLamb(c, r, it.x, it.y, time, false)
        break
    }
  }
  // the lamb is also seen faintly through whatever stands in front of it
  drawLamb(c, r, lx, ly, time, true)
  // the cranks stand on top of everything, each in its own free place
  for (const cr of r.m.controls) drawHandle(c, r, cr, time)
  void g
  // sparks
  for (const p of parts) {
    c.globalAlpha = Math.max(0, 1 - p.t / p.life)
    c.fillStyle = p.color
    c.beginPath()
    c.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
  void dt
}

function drawBackground(c: CanvasRenderingContext2D, chapter: number, time: number) {
  const ci = CHAPTERS[chapter]?.bg ?? 1
  const bg = img[`bg-${ci}`]
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    const w = bg.width * k
    const h = bg.height * k
    c.drawImage(bg, (cvW - w) / 2, (cvH - h) / 2, w, h)
  } else {
    const [top, bottom] = BG_COLORS[ci - 1] ?? BG_COLORS[0]!
    const g = c.createLinearGradient(0, 0, 0, cvH)
    g.addColorStop(0, top)
    g.addColorStop(1, bottom)
    c.fillStyle = g
    c.fillRect(0, 0, cvW, cvH)
  }
  // a soft veil so that the building stands out
  c.fillStyle = ci === 4 ? 'rgba(10,16,40,0.18)' : 'rgba(255,250,235,0.10)'
  c.fillRect(0, 0, cvW, cvH)
  if (ci === 4) {
    // the stars of the quiet night twinkle
    for (let i = 0; i < 36; i++) {
      const x = ((i * 97) % 100) / 100
      const y = (((i * 61) % 70) / 100) * 0.9
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * (0.6 + (i % 5) * 0.2) + i))
      c.globalAlpha = tw * 0.8
      c.fillStyle = '#fff7d0'
      const sx = x * cvW
      const sy = y * cvH
      const sz = 1.2 + (i % 3) * 0.8
      c.fillRect(sx - sz, sy - 0.5, sz * 2, 1)
      c.fillRect(sx - 0.5, sy - sz, 1, sz * 2)
    }
    c.globalAlpha = 1
  }
}

function floorOf(cell: Cell, r: Run) {
  if (cell.wood) return WOOD
  return FLOORS[CHAPTERS[r.chapter]?.floor ?? 'gras']
}

/** An image put on a parallelogram: the point p0 and the two edges (to the right and down in the image). */
function putImage(c: CanvasRenderingContext2D, im: HTMLImageElement | undefined, color: string, p0: [number, number], pu: [number, number], pv: [number, number]) {
  if (im) {
    c.save()
    c.transform((pu[0] - p0[0]) / im.width, (pu[1] - p0[1]) / im.width, (pv[0] - p0[0]) / im.height, (pv[1] - p0[1]) / im.height, p0[0], p0[1])
    c.drawImage(im, 0, 0)
    c.restore()
  } else {
    c.fillStyle = color
    c.beginPath()
    c.moveTo(p0[0], p0[1])
    c.lineTo(pu[0], pu[1])
    c.lineTo(pu[0] + pv[0] - p0[0], pu[1] + pv[1] - p0[1])
    c.lineTo(pv[0], pv[1])
    c.closePath()
    c.fill()
  }
}

/**
 * A box (a floor tile, or a step of a stair): its centre, its half sizes in its own frame, the turn in quarter turns, the height of its top and its bottom.
 * The top and the sides that face us are painted with the textures; the sides get a shade so that the light seems to come from the upper right.
 */
function box(c: CanvasRenderingContext2D, cx: number, cy: number, zTop: number, zBot: number, hx: number, hy: number, quarter: number, top: { im: HTMLImageElement | undefined; color: string }, side: { im: HTMLImageElement | undefined; color: string }, grow = 0.02) {
  const a = (quarter * Math.PI) / 2
  const co = Math.cos(a)
  const si = Math.sin(a)
  const gx = hx + grow
  const gy = hy + grow
  const corner = (lx: number, ly: number, z: number): [number, number] => project(view, cx + lx * co - ly * si, cy + lx * si + ly * co, z)
  // sides first (the top lies over them)
  const edges: [number, number, number, number, number, number][] = [
    [-gx, -gy, gx, -gy, 0, -1],
    [gx, -gy, gx, gy, 1, 0],
    [gx, gy, -gx, gy, 0, 1],
    [-gx, gy, -gx, -gy, -1, 0]
  ]
  for (const [ax, ay, bx, by, nx, ny] of edges) {
    const wx = nx * co - ny * si
    const wy = nx * si + ny * co
    if (wx + wy <= 0.01) continue
    const p0 = corner(ax, ay, zTop)
    const p1 = corner(bx, by, zTop)
    const p2 = corner(ax, ay, zBot)
    putImage(c, side.im, side.color, p0, p1, p2)
    // the side is darker the more it turns away from the light
    const shade = 0.25 - 0.09 * (wx - wy)
    const gs = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1])
    gs.addColorStop(0, `rgba(14,10,40,${shade.toFixed(3)})`)
    gs.addColorStop(1, `rgba(14,10,40,${(shade + 0.2).toFixed(3)})`)
    c.fillStyle = gs
    const p3 = corner(bx, by, zBot)
    c.beginPath()
    c.moveTo(p0[0], p0[1])
    c.lineTo(p1[0], p1[1])
    c.lineTo(p3[0], p3[1])
    c.lineTo(p2[0], p2[1])
    c.closePath()
    c.fill()
  }
  const t0 = corner(-gx, -gy, zTop)
  const t1 = corner(gx, -gy, zTop)
  const t3 = corner(-gx, gy, zTop)
  putImage(c, top.im, top.color, t0, t1, t3)
  // a thin light edge at the top, and a soft light over the top (lighter at the back)
  const t2 = corner(gx, gy, zTop)
  const gt = c.createLinearGradient(t0[0], t0[1], t2[0], t2[1])
  gt.addColorStop(0, 'rgba(255,255,225,0.16)')
  gt.addColorStop(1, 'rgba(40,40,80,0.07)')
  c.fillStyle = gt
  c.beginPath()
  c.moveTo(t0[0], t0[1])
  c.lineTo(t1[0], t1[1])
  c.lineTo(t2[0], t2[1])
  c.lineTo(t3[0], t3[1])
  c.closePath()
  c.fill()
  c.strokeStyle = 'rgba(255,252,230,0.28)'
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(t0[0], t0[1])
  c.lineTo(t1[0], t1[1])
  c.lineTo(t2[0], t2[1])
  c.lineTo(t3[0], t3[1])
  c.closePath()
  c.stroke()
}

function drawCell(c: CanvasRenderingContext2D, r: Run, cell: Cell, time: number) {
  const pose = poseFor(r, cell)
  const [x, y, z] = placeOf(r.m, cell, pose)
  const fl = floorOf(cell, r)
  const top = { im: img[fl.top], color: fl.topC }
  const side = { im: img[fl.side], color: fl.sideC }
  const thick = cell.wood ? 0.3 : 0.62
  c.globalAlpha = pose.alpha
  const night = CHAPTERS[r.chapter]?.floor === 'nacht'
  if (cell.stair < 0) {
    box(c, x, y, z, z - thick, 0.5, 0.5, pose.rot, top, side)
    if (night && !cell.wood) {
      // a cool blue light on the tops
      c.fillStyle = 'rgba(40,60,130,0.10)'
    }
  } else {
    // a stair: four steps going up towards the high end
    const dir = stairDir(cell, pose)
    void dir
    const q = cell.stair + pose.rot
    const n = 4
    // the steps that lie further away are drawn first: when the high end points away from us, the high steps are the far ones
    const away = Math.cos((q * Math.PI) / 2) + Math.sin((q * Math.PI) / 2) < 0
    for (let k = 0; k < n; k++) {
      const i = away ? n - 1 - k : k
      const lx = -0.5 + (i + 0.5) / n
      const a = (q * Math.PI) / 2
      const cx = x + lx * Math.cos(a)
      const cy = y + lx * Math.sin(a)
      box(c, cx, cy, z + (i + 1) / n - 0.06, z - thick, 0.5 / n, 0.5, q, top, side, 0.012)
    }
  }
  c.globalAlpha = 1
  const kind = cell.g >= 0 ? r.m.groups[cell.g]!.def.kind : ''
  if (kind === 'gate' && pose.gate < 0.98) drawGate(c, x, y, z, pose.gate)
  void time
}

/** A gate that stands on its floor tile: closed it bars the way, when it opens it lifts and fades. */
function drawGate(c: CanvasRenderingContext2D, x: number, y: number, z: number, open: number) {
  const [sx, sy] = project(view, x, y, z)
  const im = img.tor
  const h = view.s * 1.5
  c.save()
  c.globalAlpha = 1 - open
  c.translate(sx, sy - open * view.s * 0.8 + 2)
  if (im) {
    const w = (h * im.width) / im.height
    c.drawImage(im, -w / 2, -h, w, h)
  } else {
    gateShape(c, h)
  }
  c.restore()
}

function drawFlower(c: CanvasRenderingContext2D, r: Run, cell: Cell, time: number) {
  const [sx, sy] = cellScreen(r, cell.id)
  const im = img[`blume-${(r.chapter % 4) + 1}`]
  const h = view.s * 0.95
  const sway = Math.sin(time * 2 + cell.id) * 0.05
  // a soft glow shows that this one can be picked
  const g = c.createRadialGradient(sx, sy - h * 0.4, 1, sx, sy - h * 0.4, h * 0.9)
  g.addColorStop(0, 'rgba(255,240,170,0.55)')
  g.addColorStop(1, 'rgba(255,240,170,0)')
  c.fillStyle = g
  c.fillRect(sx - h, sy - h * 1.4, h * 2, h * 2)
  if (im) {
    c.save()
    c.translate(sx, sy + 2)
    c.rotate(sway)
    c.drawImage(im, (-h * im.width) / im.height / 2, -h, (h * im.width) / im.height, h)
    c.restore()
  } else {
    c.save()
    c.translate(sx, sy + 2)
    c.rotate(sway)
    flowerShape(c, h)
    c.restore()
  }
}

function drawGoal(c: CanvasRenderingContext2D, r: Run, cell: Cell, time: number) {
  const [sx, sy] = cellScreen(r, cell.id)
  const s = view.s
  const on = r.connected || r.won
  // the glow of the place where the shepherd waits
  const pulse = on ? 0.5 + 0.2 * Math.sin(time * 3) : 0.22
  const g = c.createRadialGradient(sx, sy - s * 0.7, 2, sx, sy - s * 0.7, s * 2.3)
  g.addColorStop(0, `rgba(255,232,150,${pulse + 0.15})`)
  g.addColorStop(1, 'rgba(255,232,150,0)')
  c.fillStyle = g
  c.fillRect(sx - s * 2.4, sy - s * 3, s * 4.8, s * 4)
  const flock = img[r.won ? 'herde-2' : 'herde-1']
  if (flock) {
    const h = s * (r.won ? 0.6 : 0.8)
    const w = (h * flock.width) / flock.height
    c.drawImage(flock, sx + s * 0.1, sy - h * 0.8, w, h)
  } else {
    c.save()
    c.translate(sx + s * 0.55, sy + s * 0.05)
    flockShape(c, s * (r.won ? 0.55 : 0.7), r.won)
    c.restore()
  }
  const sh = img[r.won || (r.connected && Math.sin(time * 2) > 0.2) ? 'hirte-2' : 'hirte-1']
  if (sh) {
    const h = s * (sh === img['hirte-2'] ? 1.5 : 1.95)
    const w = (h * sh.width) / sh.height
    c.drawImage(sh, sx - s * 0.55 - w / 2, sy - h + s * 0.1 + Math.sin(time * 1.4) * 0.8, w, h)
  } else {
    c.save()
    c.translate(sx - s * 0.5, sy + s * 0.1)
    shepherdShape(c, s * (r.won ? 1.5 : 1.9), r.won || (r.connected && Math.sin(time * 2) > 0.2))
    c.restore()
  }
}

/** A dotted line from each crank to the part it moves (drawn first, so the floors hide it: it is only seen in the free room between). */
function drawTethers(c: CanvasRenderingContext2D, r: Run) {
  c.save()
  c.lineCap = 'round'
  c.setLineDash([1, 7])
  for (const ctl of r.m.controls) {
    const sp = spots()[ctl.index]
    if (!sp) continue
    const glow = glowGroup === ctl.index
    for (const gi of ctl.groups) {
      let best = -1
      let bd = Infinity
      let bx = 0
      let by = 0
      for (const id of r.m.groups[gi]!.cells) {
        const [x, y] = cellScreen(r, id)
        const d = Math.hypot(x - sp.x, y - sp.y)
        if (d < bd) {
          bd = d
          best = id
          bx = x
          by = y
        }
      }
      if (best < 0) continue
      c.strokeStyle = 'rgba(60,40,10,0.35)'
      c.lineWidth = 4.5
      c.beginPath()
      c.moveTo(sp.x, sp.y)
      c.lineTo(bx, by)
      c.stroke()
      c.strokeStyle = glow ? 'rgba(255,240,170,1)' : 'rgba(255,244,200,0.9)'
      c.lineWidth = 3
      c.stroke()
    }
  }
  c.restore()
}

function drawHandle(c: CanvasRenderingContext2D, r: Run, ctl: ControlRT, time: number) {
  const sp = spots()[ctl.index]
  if (!sp) return
  const name = handleKind(r.m, ctl)
  const im = img[name]
  // the picture lies inside the round touch area, so it never covers a street
  const [pw, ph] = pictureSize(sp.r, im ? im.width / im.height : 1)
  const used = r.anim && r.anim.groups.some((i) => ctl.groups.includes(i))
  const glow = glowGroup === ctl.index
  // the round touch area: gentle, stronger when it is the tip, and when the child does nothing for a while
  const calm = 0.18 + 0.1 * Math.sin(time * 2.4)
  const a = glow ? 0.6 + 0.25 * Math.sin(time * 6) : idleT > 12 ? 0.32 + 0.15 * Math.sin(time * 4) : calm
  const g = c.createRadialGradient(sp.x, sp.y, sp.r * 0.2, sp.x, sp.y, sp.r)
  g.addColorStop(0, `rgba(255,236,150,${(a + 0.12).toFixed(3)})`)
  g.addColorStop(1, `rgba(255,214,90,${a.toFixed(3)})`)
  c.fillStyle = g
  c.beginPath()
  c.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = glow ? 'rgba(255,240,170,0.95)' : 'rgba(255,248,215,0.6)'
  c.lineWidth = glow ? 3 : 1.5
  c.stroke()
  c.save()
  c.translate(sp.x, sp.y + ph / 2)
  if (used) c.rotate(Math.sin(time * 18) * 0.07)
  if (im) c.drawImage(im, -pw / 2, -ph, pw, ph)
  else handleShape(c, ph, name)
  c.restore()
}

function drawDeco(c: CanvasRenderingContext2D, d: { s: string; x: number; y: number; z: number; k?: number; flip?: boolean }) {
  const im = img[d.s]
  const [sx, sy] = project(view, d.x, d.y, d.z)
  const h = view.s * (DECO_HEIGHT[d.s] ?? 1) * (d.k ?? 1)
  c.save()
  c.translate(sx, sy + 2)
  if (d.flip) c.scale(-1, 1)
  if (im) {
    const w = (h * im.width) / im.height
    c.drawImage(im, -w / 2, -h, w, h)
  } else {
    decoShape(c, h, d.s)
  }
  c.restore()
}

/** Where the lamb is on the screen (its feet) and its place in the order of drawing. */
function lambPlace(r: Run): [number, number, number] {
  const a = cellScreen(r, r.stepT < 1 ? r.from : r.lamb)
  const ca = r.m.cells[r.stepT < 1 ? r.from : r.lamb]!
  const poseA = poseFor(r, ca)
  const [ax, ay, az] = placeOf(r.m, ca, poseA)
  if (r.stepT >= 1) return [a[0], a[1], depthKey(ax, ay, az + surfaceOffset(ca)) + 0.45]
  const b = cellScreen(r, r.to)
  const cb = r.m.cells[r.to]!
  const [bx, by, bz] = placeOf(r.m, cb, poseFor(r, cb))
  const f = r.stepT < 0.5 ? 2 * r.stepT * r.stepT : 1 - 2 * (1 - r.stepT) * (1 - r.stepT)
  const ka = depthKey(ax, ay, az)
  const kb = depthKey(bx, by, bz)
  const key = Math.abs(ka - kb) > 1.6 ? Math.max(ka, kb) + 0.5 : ka + (kb - ka) * f + 0.45
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, key]
}

function drawLamb(c: CanvasRenderingContext2D, r: Run, sx0: number, sy0: number, time: number, ghost: boolean) {
  const s = view.s
  const walking = r.stepT < 1
  let frame = 'lamm-1'
  let lift = 0
  if (r.won) {
    frame = 'lamm-4'
    lift = Math.abs(Math.sin(r.wonT * 6)) * s * 0.4
  } else if (hopT > 0) {
    frame = 'lamm-4'
    lift = Math.sin((1 - hopT / 0.5) * Math.PI) * s * 0.4
  } else if (walking) {
    frame = Math.floor(walkClock * 7) % 2 === 0 ? 'lamm-2' : 'lamm-3'
    lift = Math.abs(Math.sin(walkClock * 7 * Math.PI)) * s * 0.1
  } else if (bleatT > 0) {
    frame = 'lamm-6'
  } else {
    // now and then it sniffs or bleats a little
    const ph = (time + 3.1) % 9
    if (ph < 1.2) frame = 'lamm-5'
    else if (ph > 5.2 && ph < 6.3) frame = 'lamm-6'
  }
  const sh = s * 1.0
  if (ghost) c.globalAlpha = 0.3
  else {
    // shadow
    c.fillStyle = 'rgba(30,20,40,0.28)'
    c.beginPath()
    c.ellipse(sx0, sy0, s * 0.42 * (1 - lift / (s * 2)), s * 0.17, 0, 0, Math.PI * 2)
    c.fill()
  }
  const im = img[frame]
  c.save()
  c.translate(sx0, sy0 - lift + 2)
  if (flipLeft) c.scale(-1, 1)
  if (im) {
    const w = (sh * im.width) / im.height
    c.drawImage(im, -w / 2, -sh, w, sh)
  } else {
    lambShape(c, sh, Number(frame.slice(-1)))
  }
  c.restore()
  c.globalAlpha = 1
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const bannerSrc = (ci: number) => pic(`bg-${CHAPTERS[ci]?.bg ?? 1}`)
// the stars of the round as they stand now (the same rule as the result: nothing counts before the way to the shepherd is open)
const starsLive = computed(() => {
  if (!hud.won && !hud.connected) return 0
  const all = hud.flowers >= hud.flowersAll
  return 1 + (all ? 1 : 0) + (all && hud.moves <= hud.par ? 1 : 0)
})
const resultText = computed(() => t(`app.bigGames.lamm.won${Math.max(1, outcome.stars)}`))
const flowerLine = computed(() => t('app.bigGames.lamm.lineFlowers', { have: outcome.flowers, all: outcome.flowersAll }))
const movesLine = computed(() => t('app.bigGames.lamm.lineMoves', { have: outcome.moves, par: outcome.par }))

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __lamm?: unknown }).__lamm = {
      get run() {
        return run
      },
      get view() {
        return view
      },
      get spots() {
        return spots()
      },
      handleAt,
      begin,
      advance: (sec = 0.1) => {
        let left = sec
        while (left > 0) {
          const d = Math.min(0.05, left)
          advance(d)
          left -= d
        }
      },
      draw: () => draw(performance.now() / 1000, 0),
      touchHandle: (gi: number) => run && touchHandle(run, gi),
      walkTo: (cell: number) => run && walkTo(run, cell),
      undo,
      cellScreen: (id: number) => (run ? cellScreen(run, id) : null),
      stateKey: () => (run ? stateKey(run.m, run.st) : -1)
    }
  }
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  window.visualViewport?.addEventListener('resize', resize)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    sizeObserver = new ResizeObserver(() => resize())
    sizeObserver.observe(canvas.value)
  }
  // the calm pieces (the kind `graze` is one of the calm ones; this game is a quiet one)
  music.playGame('graze')
  setProbe()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  window.visualViewport?.removeEventListener('resize', resize)
  sizeObserver?.disconnect()
  window.clearTimeout(tipTimer)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="lg")
    canvas(
      ref="canvas"
      class="lg-canvas"
      @pointerdown="onDown"
    )

    //- while the pictures load
    div(v-if="!loaded" class="lg-center")
      div(class="lg-spinner")

    //- the chapters and levels
    div(v-else-if="screen === 'menu'" class="lg-menu")
      div(class="lg-card")
        GameIntroBox(
          :title="t('app.bigGames.lamm.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.lamm.intro')"
          :task="t('app.bigGames.lamm.taskLabel') + ' ' + t('app.bigGames.lamm.task')"
        )
        div(v-for="(ct, ci) in chapterTexts" :key="ci" class="lg-world")
          div(class="lg-banner" :data-test="'lamm-banner-' + ci" @click="openStory(ci)")
            img(:src="bannerSrc(ci)" alt="" class="lg-banner-pic" @error="hideBroken")
            div(class="lg-banner-text")
              span(class="lg-world-name") {{ ct.name }}
              span(class="lg-world-ref") {{ ct.ref }}
              span(class="lg-world-stars") ★ {{ chapterStars(ci) }} / {{ chapterMax(ci) }}
          div(class="lg-levels")
            button(
              v-for="x in chapterLevels(ci)"
              :key="x.i"
              type="button"
              class="lg-level"
              :data-test="'lamm-level-' + x.i"
              @click="begin(x.i)"
            )
              span(class="lg-level-no") {{ x.i - chapterLevels(ci)[0].i + 1 }}
              span(class="lg-level-name") {{ levelTitle(x.i) }}
              AdventureStars(:stars="levelStars[x.i] ?? 0" :size="18")
        p(class="lg-rules") {{ t('app.bigGames.lamm.starRules') }}
        div(class="lg-menu-buttons")
          AdvButton(tone="blau" small data-test="lamm-how" @click="how = true") {{ t('app.bigGames.lamm.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.lamm.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="lg-hud")
        div(class="lg-hud-left")
          button(type="button" class="lg-btn" :aria-label="t('app.bigGames.lamm.pause')" data-test="lamm-pause" @click="paused = true") ❚❚
          button(type="button" class="lg-btn" :aria-label="t('app.bigGames.lamm.restart')" data-test="lamm-restart" @click="begin(level)") ↻
          button(type="button" class="lg-btn" :aria-label="t('app.bigGames.lamm.undo')" data-test="lamm-undo" :disabled="!hud.canUndo" @click="undo") ↶
          button(type="button" class="lg-btn" :aria-label="t('app.bigGames.lamm.tip')" data-test="lamm-tip" @click="showTip") 💡
        div(class="lg-hud-mid")
          span(class="lg-level-label") {{ levelTitle(level) }}
          div(class="lg-counts")
            span(v-if="hud.flowersAll > 0" class="lg-count") ✿ {{ hud.flowers }}/{{ hud.flowersAll }}
            span(class="lg-count") {{ t('app.bigGames.lamm.moves') }} {{ hud.moves }}/{{ hud.par }}
        div(class="lg-hud-right")
          div(class="lg-stars-live" :aria-label="t('app.bigGames.lamm.stars')")
            span(v-for="n in 3" :key="n" :class="['lg-star', { 'is-on': n <= starsLive }]") ★
      div(v-if="tipShown" class="lg-tip") {{ tipText }}

      div(v-if="paused && !how && !story" class="lg-menu lg-menu--dim")
        div(class="lg-card lg-card--small")
          h2(class="lg-title") {{ t('app.bigGames.lamm.pause') }}
          AdvButton(data-test="lamm-resume" @click="paused = false") {{ t('app.bigGames.lamm.resume') }}
          AdvButton(tone="blau" data-test="lamm-pause-again" @click="begin(level)") {{ t('app.bigGames.lamm.again') }}
          AdvButton(tone="blau" data-test="lamm-menu" @click="toMenu") {{ t('app.bigGames.lamm.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="lg-menu lg-menu--dim")
      div(class="lg-card lg-card--small")
        h2(class="lg-title") {{ levelTitle(level) }}
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="lg-text") {{ resultText }}
        div(class="lg-lines")
          p(class="lg-line is-on") ✓ {{ t('app.bigGames.lamm.lineHome') }}
          p(v-if="outcome.flowersAll > 0" :class="['lg-line', { 'is-on': outcome.flowers === outcome.flowersAll }]") {{ outcome.flowers === outcome.flowersAll ? '✓' : '○' }} {{ flowerLine }}
          p(:class="['lg-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ movesLine }}
        p(v-if="allDone" class="lg-text lg-final") {{ t('app.bigGames.lamm.finale') }}
        AdvButton(v-if="hasNext" data-test="lamm-next" @click="begin(level + 1)") {{ t('app.bigGames.lamm.next') }}
        AdvButton(:tone="hasNext ? 'blau' : 'gold'" data-test="lamm-again" @click="begin(level)") {{ t('app.bigGames.lamm.again') }}
        AdvButton(tone="blau" data-test="lamm-menu" @click="toMenu") {{ t('app.bigGames.lamm.menu') }}

    //- the story of a chapter: what it is about and what the task is
    div(v-if="story && loaded" class="lg-menu lg-menu--dim")
      div(class="lg-card lg-story")
        div(class="lg-story-pic")
          img(:src="bannerSrc(story.chapter)" alt="" class="lg-banner-pic" @error="hideBroken")
        h2(class="lg-title") {{ chapterTexts[story.chapter]?.name }}
        p(class="lg-world-ref lg-story-ref") {{ chapterTexts[story.chapter]?.ref }}
        p(class="lg-story-text") {{ storyTexts[story.chapter]?.text }}
        p(class="lg-story-task")
          span(class="lg-story-label") {{ t('app.bigGames.lamm.taskLabel') }}
          |  {{ storyTexts[story.chapter]?.task }}
        AdvButton(data-test="lamm-story-go" @click="closeStory") {{ t('app.bigGames.lamm.go') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="lg-menu lg-menu--dim")
      div(class="lg-card lg-how")
        h2(class="lg-title") {{ t('app.bigGames.lamm.howTitle') }}
        div(class="lg-how-row")
          img(:src="pic('lamm-1')" alt="" class="lg-how-pic" @error="hideBroken")
          p(class="lg-how-line") {{ t('app.bigGames.lamm.howTap') }}
        div(class="lg-how-row")
          img(:src="pic('kurbel')" alt="" class="lg-how-pic" @error="hideBroken")
          p(class="lg-how-line") {{ t('app.bigGames.lamm.howCrank') }}
        div(class="lg-how-row")
          img(:src="pic('blume-1')" alt="" class="lg-how-pic" @error="hideBroken")
          p(class="lg-how-line") {{ t('app.bigGames.lamm.howFlowers') }}
        AdvButton(data-test="lamm-go" @click="closeHow") {{ t('app.bigGames.lamm.go') }}
</template>

<style scoped lang="sass">
.lg
  position: fixed
  inset: 0
  z-index: 60
  background: #cfe6c0
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.lg-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.lg-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.lg-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.4)
  border-top-color: #f5c84a
  animation: lg-spin 0.9s linear infinite

@keyframes lg-spin
  to
    transform: rotate(360deg)

.lg-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(36, 52, 40, 0.7), rgba(36, 52, 40, 0.86))

  &--dim
    place-items: center
    background: rgba(30, 40, 30, 0.55)

.lg-card
  width: min(640px, 100%)
  padding: 22px 20px 18px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4)
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  text-align: center

  &--small
    width: min(420px, 100%)

.lg-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.lg-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

.lg-final
  font-weight: 700

.lg-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.lg-world
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.lg-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #7a9a6a
  cursor: pointer

.lg-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 40%

.lg-banner-text
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: flex-start
  justify-content: flex-end
  gap: 1px
  padding: 8px 12px
  color: #fff6dc
  text-align: left
  background: linear-gradient(0deg, rgba(20, 30, 14, 0.78), rgba(20, 30, 14, 0.05))
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)

.lg-world-name
  font-size: 1.05rem
  font-weight: 800

.lg-world-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.lg-world-stars
  position: absolute
  right: 12px
  bottom: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.lg-levels
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 8px
  width: 100%

.lg-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  min-height: 48px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.lg-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.lg-level-name
  font-size: 0.74rem
  font-weight: 800
  line-height: 1.15

@media (max-width: 460px)
  .lg-levels
    grid-template-columns: repeat(3, minmax(0, 1fr))

.lg-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.lg-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 8px
  padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 8px max(10px, env(safe-area-inset-left))
  pointer-events: none

.lg-hud > *
  pointer-events: auto

.lg-hud-left
  display: flex
  flex-direction: row
  gap: 6px

.lg-btn
  width: 46px
  height: 46px
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.92)
  color: #2a2418
  font-size: 1.15rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25)

  &:disabled
    opacity: 0.45
    cursor: default

.lg-hud-mid
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 3px 10px
  border-radius: 16px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  max-width: 34vw
  text-align: center

.lg-level-label
  font-size: 0.9rem
  line-height: 1.15

.lg-counts
  display: flex
  gap: 10px
  font-size: 0.78rem
  color: #5a4a2a

.lg-hud-right
  display: flex
  flex-direction: column
  align-items: center

.lg-stars-live
  display: flex
  gap: 1px
  padding: 4px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.88)

.lg-star
  font-size: 1.1rem
  line-height: 1
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.lg-tip
  position: absolute
  left: 50%
  bottom: max(18px, env(safe-area-inset-bottom))
  transform: translateX(-50%)
  max-width: min(560px, 92vw)
  padding: 10px 18px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.lg-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.lg-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.lg-how
  gap: 20px

.lg-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.lg-how-pic
  width: 56px
  height: 56px
  object-fit: contain
  flex: none

.lg-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.lg-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

.lg-story
  gap: 8px

.lg-story-pic
  position: relative
  width: 100%
  height: 120px
  border-radius: 16px
  overflow: hidden
  background: #7a9a6a

.lg-story-ref
  margin: -4px 0 0
  color: var(--lk-muted, #7a6b4f)

.lg-story-text
  margin: 0
  line-height: 1.45
  font-size: 1.15rem

.lg-story-task
  margin: 0
  line-height: 1.45
  font-size: 1.15rem
  padding: 8px 12px
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)

.lg-story-label
  font-weight: 800
  color: #b87a10

@media (orientation: landscape) and (max-height: 520px)
  .lg-hud
    padding-top: 6px

// short screens: the explanation card closer together
@media (max-height: 520px)
  .lg-how
    gap: 8px
  .lg-how-row
    gap: 12px
  .lg-how-pic
    width: 40px
    font-size: 1.5rem
    height: 40px
  .lg-how-sign
    width: 40px
    font-size: 1.5rem
  .lg-how-line
    font-size: 1.05rem
</style>
