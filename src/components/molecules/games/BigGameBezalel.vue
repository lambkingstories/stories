<script setup lang="ts">
/**
 * "Bezalels Werkstatt": a tangram game (rules in `utils/bezalelGame.ts`, geometry in `utils/bezalelTangram.ts`, levels in `utils/bezalelLevels.ts`,
 * places on the screen in `utils/bezalelLayout.ts`; this file draws it and takes the touch). A dark outline is shown; the seven wooden or golden
 * pieces lie on the work table and are dragged into it. A tap turns a piece by 45 degrees, the handle turns it freely, the parallelogram can be
 * mirrored. A piece that lies nearly right clicks into place. A finished figure turns golden and shows the painted object.
 * There is no time and nothing is lost; the stars only sink with every hint. The canvas is measured at every touch (a tablet's browser bar
 * slides in and out), and by a ResizeObserver and the visual viewport.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useCanvasGuard from '@/use/useCanvasGuard'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { beginMove, canFlip, endMove, flip, hint, moveTo, newGame, pieceById, polyOf, resetPieces, rotate, setAngle, starsOf, undo, type Game, type Piece } from '@/utils/bezalelGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER } from '@/utils/bezalelLevels'
import { TOP_BAR, clampCentre, computeLayout, hitTest, inTray, screenCentre, screenPoly, toScreen, toWorld, type Layout } from '@/utils/bezalelLayout'
import { placementToXf, radiusOf, type PieceId, type Pt } from '@/utils/bezalelTangram'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt, locale } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'bezalel'
const TX = (k: string, args?: Record<string, unknown>) => t(`app.bigGames.bezalel.${k}`, args ?? {})

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const TEXTURES = ['holz', 'gold', 'silber', 'bronze', 'blau', 'purpur', 'karmesin', 'leinen']
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/bezalel/${n}.webp`)
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)

function loadImage(n: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (img[n]) return resolve()
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
  await Promise.all([...TEXTURES.map((n) => loadImage(`tex-${n}`)), loadImage('werkstatt-quer'), loadImage('werkstatt-hoch')])
  makePatterns()
  loaded.value = true
}

let patterns: Record<string, CanvasPattern | null> = {}
function makePatterns() {
  if (!ctx) return
  patterns = {}
  for (const n of TEXTURES) {
    const i = img[`tex-${n}`]
    patterns[n] = i ? ctx.createPattern(i, 'repeat') : null
  }
}

/** The material of a piece: the texture and a tint, so that the seven pieces can be told apart. Every chapter has its own (wood, metal, cloth, all). */
const MATERIALS: { tex: string; tint: string }[][] = [
  [
    { tex: 'holz', tint: 'rgba(255,205,130,0.10)' }, { tex: 'holz', tint: 'rgba(120,52,0,0.22)' }, { tex: 'holz', tint: 'rgba(255,238,175,0.20)' },
    { tex: 'holz', tint: 'rgba(90,40,0,0.30)' }, { tex: 'holz', tint: 'rgba(255,170,80,0.16)' }, { tex: 'holz', tint: 'rgba(255,225,150,0.26)' }, { tex: 'holz', tint: 'rgba(60,25,0,0.26)' }
  ],
  [
    { tex: 'gold', tint: 'rgba(255,230,140,0.00)' }, { tex: 'gold', tint: 'rgba(150,80,0,0.20)' }, { tex: 'silber', tint: 'rgba(255,255,255,0.00)' },
    { tex: 'bronze', tint: 'rgba(0,0,0,0.00)' }, { tex: 'bronze', tint: 'rgba(255,200,120,0.22)' }, { tex: 'gold', tint: 'rgba(255,245,190,0.28)' }, { tex: 'silber', tint: 'rgba(60,70,100,0.20)' }
  ],
  [
    { tex: 'blau', tint: 'rgba(0,0,0,0.00)' }, { tex: 'purpur', tint: 'rgba(0,0,0,0.00)' }, { tex: 'karmesin', tint: 'rgba(0,0,0,0.00)' },
    { tex: 'leinen', tint: 'rgba(0,0,0,0.00)' }, { tex: 'leinen', tint: 'rgba(170,120,60,0.30)' }, { tex: 'blau', tint: 'rgba(255,255,255,0.22)' }, { tex: 'karmesin', tint: 'rgba(60,0,20,0.28)' }
  ],
  [
    { tex: 'holz', tint: 'rgba(0,0,0,0.00)' }, { tex: 'gold', tint: 'rgba(0,0,0,0.00)' }, { tex: 'blau', tint: 'rgba(0,0,0,0.00)' },
    { tex: 'purpur', tint: 'rgba(0,0,0,0.00)' }, { tex: 'karmesin', tint: 'rgba(0,0,0,0.00)' }, { tex: 'leinen', tint: 'rgba(0,0,0,0.00)' }, { tex: 'silber', tint: 'rgba(0,0,0,0.00)' }
  ]
]
const FLAT: Record<string, string> = { holz: '#c98a52', gold: '#e0b04a', silber: '#b9c0c8', bronze: '#b8743a', blau: '#3a64a8', purpur: '#8a3a78', karmesin: '#b5473a', leinen: '#efe6cf' }
const SLOT: Record<PieceId, number> = { L1: 0, L2: 1, M: 2, S1: 3, S2: 4, Q: 5, P: 6 }

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const chapterCard = ref(-1)
let pendingCard = -1
const result = ref(false)
const hintText = ref('')
const hintShown = ref(false)
let hintTimer = 0

interface ChapterText {
  name: string
  ref: string
  story: string
  task: string
}
const chapterTexts = computed(() => ((tm('app.bigGames.bezalel.chapters') as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelNames = computed(() => ((tm('app.bigGames.bezalel.levels') as unknown as string[]) ?? []).map((m) => rt(m as never)))
const levelRefs = computed(() => ((tm('app.bigGames.bezalel.refs') as unknown as string[]) ?? []).map((m) => rt(m as never)))
const levelStars = computed(() => progress.levels(ID))
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const solved = (i: number) => (levelStars.value[i] ?? 0) >= 1

const hud = reactive({ stars: 3, hints: 0, selectedFlip: false, canRotate: false })
const outcome = reactive({ stars: 0, hints: 0 })

// what was seen already (the chapter cards and the hints are shown once)
const MEM_KEY = 'lk-bezalel-v1'
interface Mem {
  chapters: Record<number, boolean>
  hints: Record<string, boolean>
}
function loadMem(): Mem {
  try {
    const raw = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as Mem | null
    if (raw && typeof raw === 'object') return { chapters: raw.chapters ?? {}, hints: raw.hints ?? {} }
  } catch {
    // start fresh
  }
  return { chapters: {}, hints: {} }
}
const mem = reactive<Mem>(loadMem())
function saveMem() {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {
    // a private window: not remembered
  }
}

// ── the canvas ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let g: Game = newGame(LEVELS[0]!)
const canvas = ref<HTMLCanvasElement | null>(null)
// the picture of the canvas always has the shape of its box, also after a turn of the phone (see `useCanvasGuard`)
useCanvasGuard(canvas, () => layout())
const probeBox = ref<HTMLElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
let lay: Layout = computeLayout(375, 812, LEVELS[0]!.box, LEVELS[0]!.pieces)
let ro: ResizeObserver | null = null
const toolStyle = reactive({ left: '0px', top: '0px', width: '100%', height: '60px' })
const portrait = ref(true)
const tipStyle = reactive({ left: '50%', top: '70px' })
let winT = -1
let endTimer = 0
let objImg: HTMLImageElement | null = null

function insets(): { top: number; bottom: number } {
  const el = probeBox.value
  if (!el) return { top: 0, bottom: 0 }
  const r = el.getBoundingClientRect()
  // the probe has a top padding of the safe area and a bottom padding of the safe area: its height is both of them
  const cs = getComputedStyle(el)
  void r
  return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 }
}

function layout() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  lay = computeLayout(cvW, cvH, g.level.box, g.level.pieces, insets())
  portrait.value = lay.portrait
  toolStyle.left = `${lay.toolbar.x}px`
  toolStyle.top = `${lay.toolbar.y}px`
  toolStyle.width = `${lay.toolbar.w}px`
  toolStyle.height = `${lay.toolbar.h}px`
  // the hint bubble sits just above the toolbar (upright) or at the foot of the board (landscape): not over the outline
  tipStyle.left = `${lay.board.x + lay.board.w / 2}px`
  tipStyle.top = `${lay.portrait ? lay.toolbar.y - 62 : lay.board.y + lay.board.h - 70}px`
  // keep the pieces lying on the board on the screen after a turn of the device
  for (const p of g.pieces) {
    if (!p.onBoard) continue
    const s = toScreen(lay, [p.cx, p.cy])
    const k = clampCentre(lay, s[0], s[1])
    if (k[0] !== s[0] || k[1] !== s[1]) {
      const w = toWorld(lay, k[0], k[1])
      p.cx = w[0]
      p.cy = w[1]
    }
  }
}

// ── the hints and the HUD ───────────────────────────────────────────────────────────────────────────────────────────────────────
function say(text: string, ms = 6500) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}

function hintOnce(key: string) {
  if (mem.hints[key]) return
  mem.hints[key] = true
  saveMem()
  say(TX(`hint.${key}`), 8000)
}

/** The one hint that fits this level: the first moves, the turn, the mirror, the click, the tip, the handle. */
function levelHint() {
  const i = level.value
  if (i === 0) hintOnce('first')
  else if (i === 1) hintOnce('turn')
  else if (i === 2) hintOnce('snap')
  else if (i === 3) hintOnce('tip')
  else if (g.level.pieces.includes('P')) hintOnce('flip')
  if (i === 5) hintOnce('handle')
}

function syncHud() {
  hud.stars = starsOf(g)
  hud.hints = g.hints
  const sel = g.selected ? pieceById(g, g.selected) : null
  hud.selectedFlip = !!sel && canFlip(sel.id)
  hud.canRotate = !!sel
}

// ── a round ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function begin(i: number) {
  level.value = i
  g = newGame(LEVELS[i]!)
  result.value = false
  winT = -1
  objImg = null
  window.clearTimeout(endTimer)
  void loadImage(LEVELS[i]!.picture).then(() => {
    objImg = img[LEVELS[i]!.picture] ?? null
  })
  syncHud()
  screen.value = 'play'
  const L = LEVELS[i]!
  pendingCard = L.pos === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  if (!paused.value) levelHint()
  layout()
  setProbe()
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  chapterCard.value = pendingCard
  paused.value = chapterCard.value >= 0
  if (!paused.value) levelHint()
}

function closeCard() {
  const c = chapterCard.value
  if (c >= 0) {
    mem.chapters[c] = true
    saveMem()
  }
  chapterCard.value = -1
  pendingCard = -1
  paused.value = false
  levelHint()
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
  window.clearTimeout(endTimer)
}

/** After every change of the pieces: the numbers on the bars, and the finish. */
function afterChange() {
  poke()
  syncHud()
  if (g.done && winT < 0) {
    winT = 0
    hintShown.value = false
    play('found')
    outcome.stars = starsOf(g)
    outcome.hints = g.hints
    progress.record(ID, level.value, outcome.stars)
    window.clearTimeout(endTimer)
    endTimer = window.setTimeout(() => {
      if (screen.value !== 'play') return
      result.value = true
      play('result')
    }, 2800)
  }
}

const live = () => screen.value === 'play' && !paused.value && !g.done

// ── the buttons of the toolbar ──────────────────────────────────────────────────────────────────────────────────────────────────
function aTip() {
  if (!live()) return
  const h = hint(g)
  if (h) {
    say(TX('tipShown'), 5000)
    play('tap', 0.8)
  }
  afterChange()
}
function aUndo() {
  if (!live()) return
  if (undo(g)) play('flip', 0.6)
  afterChange()
}
function aReset() {
  if (!live()) return
  resetPieces(g)
  play('flip', 0.6)
  afterChange()
}
function aRotate() {
  if (!live()) return
  if (!g.selected) {
    say(TX('hint.turn'), 4000)
    return
  }
  rotate(g, g.selected)
  play('tap', 0.7)
  afterChange()
}
function aFlip() {
  if (!live() || !g.selected) return
  flip(g, g.selected)
  play('flip', 0.7)
  afterChange()
}

// ── the touch (the canvas is measured at every touch) ───────────────────────────────────────────────────────────────────────────
type Drag =
  | { kind: 'piece'; id: PieceId; x0: number; y0: number; gx: number; gy: number; ratio: number; moved: boolean; began: boolean; wasTray: boolean }
  | { kind: 'handle'; id: PieceId; a0: number; angle0: number; began: boolean }
let drag: Drag | null = null

/** A touch as a point of the canvas in the units that the game draws with (the real size of the canvas now, not the one of the last resize). */
function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  if (Math.abs(r.width - cvW) > 0.5 || Math.abs(r.height - cvH) > 0.5) layout()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky }
}

/** Where the handle for the free turning sits (above the selected piece on the board). */
function handlePos(p: Piece): Pt {
  const c = screenCentre(lay, p)
  const r = radiusOf(p.kind) * lay.s + 30
  return [Math.max(26, Math.min(lay.W - 26, c[0])), Math.max(lay.top + 24, c[1] - r)]
}
const selectedOnBoard = (): Piece | null => {
  const p = g.selected ? pieceById(g, g.selected) : null
  return p && p.onBoard && !g.done ? p : null
}

function onDown(e: PointerEvent) {
  poke()
  if (!live()) return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    // a pointer that is gone already: the touch goes on without the capture
  }
  const p = pos(e)
  const sel = selectedOnBoard()
  if (sel) {
    const h = handlePos(sel)
    if (Math.hypot(p.x - h[0], p.y - h[1]) <= 30) {
      const c = screenCentre(lay, sel)
      drag = { kind: 'handle', id: sel.id, a0: Math.atan2(p.y - c[1], p.x - c[0]), angle0: sel.angle, began: false }
      return
    }
  }
  const hit = hitTest(g, lay, p.x, p.y)
  if (!hit) {
    g.selected = null
    g.hint = null
    syncHud()
    return
  }
  const c = screenCentre(lay, hit)
  drag = { kind: 'piece', id: hit.id, x0: p.x, y0: p.y, gx: c[0] - p.x, gy: c[1] - p.y, ratio: hit.onBoard ? 1 : lay.s / lay.ts, moved: false, began: false, wasTray: !hit.onBoard }
  g.selected = hit.id
  syncHud()
}

function onMove(e: PointerEvent) {
  const d = drag
  poke()
  if (!d || !live()) return
  const p = pos(e)
  if (d.kind === 'handle') {
    const piece = pieceById(g, d.id)
    const c = screenCentre(lay, piece)
    const a = Math.atan2(p.y - c[1], p.x - c[0])
    if (!d.began) {
      beginMove(g, d.id)
      d.began = true
    }
    setAngle(g, d.id, d.angle0 + ((a - d.a0) * 180) / Math.PI)
    return
  }
  if (!d.moved && Math.hypot(p.x - d.x0, p.y - d.y0) < 8) return
  d.moved = true
  if (!d.began) {
    beginMove(g, d.id)
    d.began = true
    play('tap', 0.5)
  }
  const k = clampCentre(lay, p.x + d.gx * d.ratio, p.y + d.gy * d.ratio)
  const w = toWorld(lay, k[0], k[1])
  moveTo(g, d.id, w[0], w[1])
}

function onUp(e: PointerEvent) {
  const d = drag
  drag = null
  poke()
  if (!d || !live()) return
  if (d.kind === 'handle') {
    if (d.began) {
      endMove(g, d.id, false)
      play('snap', 0.7)
    }
    afterChange()
    return
  }
  if (!d.moved) {
    // a tap turns the piece by 45 degrees
    rotate(g, d.id)
    play('tap', 0.7)
    afterChange()
    return
  }
  const p = pos(e)
  const piece = pieceById(g, d.id)
  const before: Pt = [piece.cx, piece.cy]
  const toTray = inTray(lay, p.x, p.y)
  endMove(g, d.id, toTray)
  if (!toTray) {
    const moved = Math.hypot(piece.cx - before[0], piece.cy - before[1])
    play(moved > 1e-3 ? 'snap' : 'tap', moved > 1e-3 ? 1 : 0.6)
  } else play('flip', 0.6)
  afterChange()
}

function onCancel() {
  const d = drag
  drag = null
  if (d && d.kind === 'piece' && d.began) {
    endMove(g, d.id, !pieceById(g, d.id).onBoard)
    afterChange()
  }
}

function onKey(e: KeyboardEvent) {
  if (!live()) return
  if (e.key === 'r' || e.key === 'R' || e.key === ' ') aRotate()
  else if (e.key === 'f' || e.key === 'F') aFlip()
  else if (e.key === 'h' || e.key === 'H') aTip()
  else if (e.key === 'z' || e.key === 'Z') aUndo()
  else return
  e.preventDefault()
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  // behind the menu, the pause and the result the picture changes slowly: only a few times a second
  const calm = screen.value !== 'play' || paused.value || result.value
  // while nothing moves (no finger, no hint, no finish) the picture is painted only ten times a second
  const idle = !calm && !drag && winT < 0 && !g.hint
  if ((calm && now - lastDraw < 250) || (idle && now - lastDraw < 100)) {
    last = now
    return
  }
  last = now
  lastDraw = now
  if (winT >= 0) winT += dt
  draw(now / 1000)
}
let lastDraw = 0
/** After a touch or a button: paint at once. */
const poke = () => {
  lastDraw = 0
}

function pathOf(c: CanvasRenderingContext2D, poly: Pt[]) {
  c.beginPath()
  poly.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])))
  c.closePath()
}

function fillMaterial(c: CanvasRenderingContext2D, p: Piece, poly: Pt[], mat: { tex: string; tint: string }) {
  const pat = patterns[mat.tex]
  const ctr = poly.reduce((s, q) => [s[0] + q[0] / poly.length, s[1] + q[1] / poly.length], [0, 0] as Pt)
  pathOf(c, poly)
  if (pat && typeof DOMMatrix !== 'undefined') {
    const a = (p.angle * Math.PI) / 180
    const k = 0.5
    const m = new DOMMatrix([Math.cos(a) * k, Math.sin(a) * k, -Math.sin(a) * k, Math.cos(a) * k, ctr[0] + SLOT[p.id] * 37, ctr[1] + SLOT[p.id] * 23])
    pat.setTransform(m)
    c.fillStyle = pat
  } else c.fillStyle = FLAT[mat.tex] ?? '#c98a52'
  c.fill()
  if (mat.tint !== 'rgba(0,0,0,0.00)') {
    c.fillStyle = mat.tint
    c.fill()
  }
}

function drawPiece(c: CanvasRenderingContext2D, p: Piece, poly: Pt[], lifted: boolean, alpha = 1) {
  const mat = MATERIALS[g.level.chapter]![SLOT[p.id]]!
  c.save()
  c.globalAlpha = alpha
  // only the piece in the finger gets a soft shadow (a blur on seven pieces in every picture is heavy for a phone)
  c.shadowColor = lifted ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'
  c.shadowBlur = lifted ? 16 : 0
  c.shadowOffsetY = lifted ? 7 : 2
  fillMaterial(c, p, poly, mat)
  c.restore()
  c.save()
  c.globalAlpha = alpha
  pathOf(c, poly)
  c.clip()
  c.lineJoin = 'round'
  c.lineWidth = 6
  c.strokeStyle = 'rgba(255,240,200,0.30)'
  c.stroke()
  c.restore()
  c.save()
  c.globalAlpha = alpha
  pathOf(c, poly)
  c.lineJoin = 'round'
  c.lineWidth = 1.6
  c.strokeStyle = 'rgba(38,20,6,0.85)'
  c.stroke()
  if (g.selected === p.id && !g.done) {
    c.lineWidth = 3
    c.strokeStyle = 'rgba(255,226,120,0.95)'
    c.shadowColor = 'rgba(255,214,90,0.9)'
    c.shadowBlur = 10
    c.stroke()
  }
  c.restore()
}

function cover(c: CanvasRenderingContext2D, im: HTMLImageElement, W: number, H: number) {
  const k = Math.max(W / im.naturalWidth, H / im.naturalHeight)
  const w = im.naturalWidth * k
  const h = im.naturalHeight * k
  c.drawImage(im, (W - w) / 2, (H - h) / 2, w, h)
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function draw(time: number) {
  const c = ctx
  if (!c) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, cvW, cvH)
  const bg = lay.portrait ? img['werkstatt-hoch'] : img['werkstatt-quer']
  if (bg) cover(c, bg, cvW, cvH)
  else {
    c.fillStyle = '#6b4a2a'
    c.fillRect(0, 0, cvW, cvH)
  }
  c.fillStyle = 'rgba(30,16,6,0.22)'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value !== 'play') return

  const L = g.level
  // the cloth with the outline
  const b = lay.board
  c.save()
  roundRect(c, b.x + 8, b.y + 4, b.w - 16, b.h - 8, 22)
  c.clip()
  const lin = patterns.leinen
  if (lin && typeof DOMMatrix !== 'undefined') {
    lin.setTransform(new DOMMatrix().scale(0.6))
    c.fillStyle = lin
  } else c.fillStyle = '#efe6cf'
  c.globalAlpha = 0.94
  c.fillRect(b.x, b.y, b.w, b.h)
  c.globalAlpha = 1
  c.fillStyle = 'rgba(255,240,205,0.35)'
  c.fillRect(b.x, b.y, b.w, b.h)
  c.restore()
  c.save()
  roundRect(c, b.x + 8, b.y + 4, b.w - 16, b.h - 8, 22)
  c.lineWidth = 3
  c.strokeStyle = 'rgba(120,76,28,0.75)'
  c.stroke()
  c.restore()

  // the silhouette: dark, with the gold line of the outline; it turns golden when the figure is finished
  const sil = L.polys.map((poly) => poly.map((q) => toScreen(lay, q)))
  const goldA = winT < 0 ? 0 : Math.min(1, winT / 0.9)
  c.save()
  c.fillStyle = '#4a3622'
  c.strokeStyle = '#4a3622'
  c.lineJoin = 'round'
  c.lineWidth = 2.5
  for (const poly of sil) {
    pathOf(c, poly)
    c.fill()
    c.stroke()
  }
  if (goldA > 0) {
    c.fillStyle = `rgba(245,200,80,${0.9 * goldA})`
    c.strokeStyle = `rgba(245,200,80,${0.9 * goldA})`
    for (const poly of sil) {
      pathOf(c, poly)
      c.fill()
      c.stroke()
    }
  }
  c.setLineDash([7, 5])
  c.lineWidth = 2
  c.strokeStyle = `rgba(250,214,120,${0.85 + 0.15 * goldA})`
  c.beginPath()
  for (const [a, e] of L.edges) {
    const sa = toScreen(lay, a)
    const se = toScreen(lay, e)
    c.moveTo(sa[0], sa[1])
    c.lineTo(se[0], se[1])
  }
  c.stroke()
  c.restore()

  // the hint: the piece where it belongs
  if (g.hint && !g.done) {
    const poly = g.hint.poly.map((q) => toScreen(lay, q))
    const piece = pieceById(g, g.hint.id)
    const mat = MATERIALS[L.chapter]![SLOT[piece.id]]!
    c.save()
    c.globalAlpha = 0.6
    fillMaterial(c, { ...piece, angle: 0 } as Piece, poly, mat)
    c.restore()
    c.save()
    pathOf(c, poly)
    c.lineWidth = 3 + Math.sin(time * 4) * 1.2
    c.strokeStyle = 'rgba(255,226,120,0.95)'
    c.shadowColor = 'rgba(255,214,90,0.9)'
    c.shadowBlur = 12
    c.stroke()
    c.restore()
  }

  // the work table (the tray)
  const tr = lay.tray
  c.save()
  roundRect(c, tr.x + 6, tr.y + 4, tr.w - 12, tr.h - 8, 20)
  c.clip()
  const wood = patterns.holz
  if (wood && typeof DOMMatrix !== 'undefined') {
    wood.setTransform(new DOMMatrix().scale(0.7))
    c.fillStyle = wood
  } else c.fillStyle = '#8a5a2c'
  c.fillRect(tr.x, tr.y, tr.w, tr.h)
  c.fillStyle = 'rgba(26,12,3,0.66)'
  c.fillRect(tr.x, tr.y, tr.w, tr.h)
  c.restore()
  c.save()
  roundRect(c, tr.x + 6, tr.y + 4, tr.w - 12, tr.h - 8, 20)
  c.lineWidth = 3
  c.strokeStyle = 'rgba(30,14,4,0.8)'
  c.stroke()
  c.restore()

  // the pieces: the lowest first; the one that is being moved is lifted
  const fade = winT < 0 ? 1 : Math.max(0, 1 - Math.max(0, winT - 0.7) / 1.3)
  const sorted = [...g.pieces].sort((p, q) => p.z - q.z)
  for (const p of sorted) {
    const lifted = !!drag && drag.kind === 'piece' && drag.id === p.id && drag.moved
    drawPiece(c, p, screenPoly(lay, p), lifted, fade)
  }

  // the handle for turning freely
  const sel = selectedOnBoard()
  if (sel && !drag) {
    const h = handlePos(sel)
    const cc = screenCentre(lay, sel)
    c.save()
    c.strokeStyle = 'rgba(255,226,120,0.8)'
    c.lineWidth = 2
    c.setLineDash([4, 4])
    c.beginPath()
    c.moveTo(cc[0], cc[1])
    c.lineTo(h[0], h[1])
    c.stroke()
    c.setLineDash([])
    c.beginPath()
    c.arc(h[0], h[1], 21, 0, Math.PI * 2)
    c.fillStyle = 'rgba(255,248,226,0.96)'
    c.shadowColor = 'rgba(0,0,0,0.4)'
    c.shadowBlur = 8
    c.fill()
    c.shadowBlur = 0
    c.lineWidth = 3
    c.strokeStyle = '#d9a93a'
    c.stroke()
    c.fillStyle = '#6b4a1a'
    c.font = '700 22px system-ui, sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('⟳', h[0], h[1] + 1)
    c.restore()
  }

  // the finished object: it fades in over the golden figure, calm, without sparks
  if (winT >= 0.5 && objImg) {
    const a = Math.min(1, (winT - 0.5) / 1.4)
    const sbox = { x0: toScreen(lay, [L.box.x0, L.box.y0])[0], y0: toScreen(lay, [L.box.x0, L.box.y0])[1], x1: toScreen(lay, [L.box.x1, L.box.y1])[0], y1: toScreen(lay, [L.box.x1, L.box.y1])[1] }
    const cx = (sbox.x0 + sbox.x1) / 2
    const cy = (sbox.y0 + sbox.y1) / 2
    const side = Math.min(lay.board.w - 24, lay.board.h - 24, Math.max(sbox.x1 - sbox.x0, sbox.y1 - sbox.y0) * 1.5)
    c.save()
    c.globalAlpha = a
    const rg = c.createRadialGradient(cx, cy, side * 0.1, cx, cy, side * 0.75)
    rg.addColorStop(0, 'rgba(255,226,140,0.55)')
    rg.addColorStop(1, 'rgba(255,226,140,0)')
    c.fillStyle = rg
    c.fillRect(cx - side, cy - side, side * 2, side * 2)
    c.drawImage(objImg, cx - side / 2, cy - side / 2, side, side)
    c.restore()
  }
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const resultText = computed(() => TX(`won${Math.max(1, outcome.stars)}`))
const resultSrc = computed(() => pic(LEVELS[level.value]!.picture))
const rewardChapter = computed(() => (LEVELS[level.value]?.pos === LEVELS_PER_CHAPTER - 1 ? LEVELS[level.value]!.chapter : -1))
const bannerSrc = (c: number) => pic(`kap-${c + 1}`)
const levelName = (i: number) => levelNames.value[i] ?? ''
const sbox = (i: number) => LEVELS[i]!.box
const viewBox = (i: number) => {
  const b = sbox(i)
  const m = 0.25
  return `${b.x0 - m} ${b.y0 - m} ${b.x1 - b.x0 + 2 * m} ${b.y1 - b.y0 + 2 * m}`
}
const silPoints = (i: number) => LEVELS[i]!.polys.map((poly) => poly.map((q) => `${q[0]},${q[1]}`).join(' '))
const rootStyle = { '--bz-wood': `url(${pic('tex-holz')})` }
const hasParallelogram = computed(() => g.level.pieces.includes('P'))
const tipTitle = computed(() => TX('tipBtn'))

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __bezalel?: unknown }).__bezalel = {
      get g() {
        return g
      },
      get lay() {
        return lay
      },
      begin,
      after: afterChange,
      /** For the tests of the touch: where every piece starts (the tray) and where it belongs on the screen, and the turns it needs. */
      plan: () =>
        g.level.solution.map((sol) => {
          const xf = placementToXf(sol)
          const p = pieceById(g, sol.id)
          const from = screenCentre(lay, p)
          const to = toScreen(lay, [xf.cx, xf.cy])
          const turns = (((sol.rot * 45 - p.angle) / 45) % 8 + 8) % 8
          return { id: sol.id, from, to, turns, flip: sol.flip }
        }),
      draw: () => draw(performance.now() / 1000),
      layout
    }
  }
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  layout()
  window.addEventListener('resize', layout)
  window.visualViewport?.addEventListener('resize', layout)
  window.addEventListener('keydown', onKey)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    ro = new ResizeObserver(() => layout())
    ro.observe(canvas.value)
  }
  music.playGame('quiet')
  setProbe()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(hintTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.visualViewport?.removeEventListener('resize', layout)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="bz" :style="rootStyle" :lang="locale")
    div(ref="probeBox" class="bz-probe" aria-hidden="true")
    canvas(
      ref="canvas"
      class="bz-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="bz-center")
      div(class="bz-spinner")

    //- the overview: the story, the chapters and the shelf "My workshop" with the finished objects
    div(v-else-if="screen === 'menu'" class="bz-menu")
      div(class="bz-card")
        GameIntroBox(
          :title="TX('title')"
          :label="t('app.bigGames.common.intro')"
          :story="TX('story')"
          :task="TX('task')"
        )
        p(v-if="allDone" class="bz-done") {{ TX('allDone') }}
        h2(class="bz-shelf-title") {{ TX('shelf') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="bz-chapter")
          div(class="bz-banner")
            img(:src="bannerSrc(c)" alt="" class="bz-banner-pic" @error="hideBroken")
            div(class="bz-banner-text")
              span(class="bz-ch-name") {{ ct.name }}
              span(class="bz-ch-ref") {{ ct.ref }}
              span(class="bz-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
          p(class="bz-ch-story") {{ ct.story }}
          div(class="bz-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="bz-level"
              :class="{ 'is-solved': solved(i) }"
              :aria-label="levelName(i)"
              :data-test="'bezalel-level-' + i"
              @click="begin(i)"
            )
              span(class="bz-thumb")
                img(v-if="solved(i)" :src="pic(LEVELS[i].picture)" alt="" class="bz-thumb-pic" draggable="false" @error="hideBroken")
                svg(v-else class="bz-sil" :viewBox="viewBox(i)" aria-hidden="true")
                  polygon(v-for="(pts, k) in silPoints(i)" :key="k" :points="pts")
              span(class="bz-level-name") {{ levelName(i) }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="14")
        p(class="bz-rules") {{ TX('starRules') }}
        div(class="bz-menu-buttons")
          AdvButton(tone="blau" small data-test="bezalel-how" @click="how = true") {{ TX('howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.common.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="bz-top")
        button(type="button" class="bz-btn" :aria-label="TX('pause')" data-test="bezalel-pause" @click="paused = true") ❚❚
        div(class="bz-info")
          span(class="bz-level-label") {{ levelName(level) }}
          span(class="bz-ref") {{ levelRefs[level] }}
        div(class="bz-stars-live" :aria-label="TX('starRules')" data-test="bezalel-stars")
          span(class="bz-star is-on") ★
          span(:class="['bz-star', { 'is-on': hud.stars >= 2 }]") ★
          span(:class="['bz-star', { 'is-on': hud.stars >= 3 }]") ★

      div(class="bz-tools" :class="portrait ? 'bz-tools--row' : 'bz-tools--col'" :style="toolStyle")
        button(type="button" class="bz-tool bz-tool--tip" :aria-label="TX('tipBtn')" data-test="bezalel-tip" @click="aTip")
          span(class="bz-tool-text") {{ tipTitle }}
        button(type="button" class="bz-tool" :aria-label="TX('undo')" data-test="bezalel-undo" @click="aUndo") ↶
        button(type="button" class="bz-tool" :aria-label="TX('restart')" data-test="bezalel-reset" @click="aReset") ⟲
        button(type="button" class="bz-tool" :aria-label="TX('rotate')" data-test="bezalel-rotate" @click="aRotate") ⟳
        button(v-if="hasParallelogram" type="button" class="bz-tool" :disabled="!hud.selectedFlip" :aria-label="TX('flip')" data-test="bezalel-flip" @click="aFlip") ⇋

      div(v-if="hintShown && !paused" class="bz-tip" :style="tipStyle" role="status") {{ hintText }}

      div(v-if="paused && !how && chapterCard < 0" class="bz-menu bz-menu--dim")
        div(class="bz-card bz-card--small")
          h2(class="bz-title") {{ TX('pause') }}
          AdvButton(data-test="bezalel-resume" @click="paused = false") {{ TX('resume') }}
          AdvButton(tone="blau" data-test="bezalel-pause-again" @click="begin(level)") {{ TX('again') }}
          AdvButton(tone="blau" data-test="bezalel-menu" @click="toMenu") {{ TX('menu') }}
          AdvButton(tone="blau" data-test="bezalel-pause-leave" @click="leave") {{ t('app.bigGames.common.leave') }}

      //- the end of a round: the painted object, the name, the stars
      div(v-if="result" class="bz-menu bz-menu--dim")
        div(class="bz-card bz-card--small bz-card--result")
          div(class="bz-res bz-res--a")
            img(:src="resultSrc" alt="" class="bz-result-pic" draggable="false" @error="hideBroken")
            h2(class="bz-title") {{ levelName(level) }}
            p(class="bz-ch-ref-line") {{ levelRefs[level] }}
            AdventureStars(:stars="outcome.stars" :size="52" celebrate)
          div(class="bz-res bz-res--b")
            p(class="bz-text") {{ resultText }}
            div(class="bz-lines")
              p(class="bz-line is-on") ✓ {{ TX('lineAll') }}
              p(:class="['bz-line', { 'is-on': outcome.hints === 0 }]") {{ TX('lineTips', { n: outcome.hints }) }}
            p(v-if="rewardChapter >= 0" class="bz-line is-on") {{ TX('chapterDone') }}
            p(v-if="rewardChapter === 3" class="bz-text") {{ TX('allDone') }}
            AdvButton(v-if="hasNext" data-test="bezalel-next" @click="begin(level + 1)") {{ TX('next') }}
            AdvButton(:tone="hasNext ? 'blau' : 'gold'" data-test="bezalel-again" @click="begin(level)") {{ TX('again') }}
            AdvButton(tone="blau" data-test="bezalel-menu" @click="toMenu") {{ TX('menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how && screen === 'play'" class="bz-menu bz-menu--dim")
      div(class="bz-card bz-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="bz-result-pic" @error="hideBroken")
        h2(class="bz-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="bz-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="bz-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="bz-text bz-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="bezalel-chapter-go" @click="closeCard") {{ TX('go') }}

    //- the explanation (once; the button in the menu brings it back)
    div(v-if="how && loaded" class="bz-menu bz-menu--dim")
      div(class="bz-card bz-how")
        h2(class="bz-title") {{ TX('howTitle') }}
        div(class="bz-how-row")
          span(class="bz-how-sign") ↔
          p(class="bz-how-line") {{ TX('howMove') }}
        div(class="bz-how-row")
          span(class="bz-how-sign") ⟳
          p(class="bz-how-line") {{ TX('howTurn') }}
        div(class="bz-how-row")
          span(class="bz-how-sign") ✓
          p(class="bz-how-line") {{ TX('howFit') }}
        AdvButton(data-test="bezalel-go" @click="closeHow") {{ TX('go') }}
</template>

<style scoped lang="sass">
.bz
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1d12
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.bz-probe
  position: absolute
  left: 0
  top: 0
  width: 0
  height: 0
  padding-top: env(safe-area-inset-top)
  padding-bottom: env(safe-area-inset-bottom)
  visibility: hidden
  pointer-events: none

.bz-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.bz-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.bz-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: bz-spin 0.9s linear infinite

@keyframes bz-spin
  to
    transform: rotate(360deg)

.bz-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: max(16px, env(safe-area-inset-top)) 16px 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(30, 18, 8, 0.72), rgba(30, 18, 8, 0.86))

  &--dim
    place-items: center
    background: rgba(24, 14, 6, 0.62)
    z-index: 5

.bz-card
  width: min(640px, 100%)
  padding: 20px 12px 18px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  text-align: center

  &--small
    width: min(420px, 100%)
    max-height: 100%
    overflow-y: auto

.bz-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.bz-text
  margin: 0
  font-size: 1.1rem
  line-height: 1.4

  &--task
    font-weight: 800

.bz-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.bz-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.bz-shelf-title
  margin: 6px 0 0
  font-size: 1.2rem
  font-weight: 800
  align-self: flex-start

.bz-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.bz-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.bz-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 60%

.bz-banner-text
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
  background: linear-gradient(0deg, rgba(20, 10, 4, 0.78), rgba(20, 10, 4, 0.05))
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)

.bz-ch-name
  font-size: 1.05rem
  font-weight: 800

.bz-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.bz-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.bz-ch-story, .bz-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

// the shelf: a board of painted wood under the objects
.bz-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%
  padding: 8px
  border-radius: 14px
  background-color: #8a5a2c
  background-image: linear-gradient(180deg, rgba(255, 220, 160, 0.18), rgba(40, 20, 6, 0.28)), var(--bz-wood)
  background-size: auto, 160px 160px
  box-shadow: inset 0 -5px 0 rgba(40, 20, 6, 0.35)

.bz-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  min-height: 92px
  padding: 5px 2px 4px
  border: 2px solid rgba(60, 32, 8, 0.45)
  border-radius: 12px
  background: rgba(255, 246, 224, 0.9)
  color: #2a2418
  font: inherit
  cursor: pointer

  &.is-solved
    background: rgba(255, 238, 190, 0.96)
    border-color: #d9a93a

.bz-thumb
  display: grid
  place-items: center
  width: 100%
  aspect-ratio: 1
  max-height: 58px

.bz-thumb-pic
  width: 100%
  height: 100%
  object-fit: contain

.bz-sil
  width: 80%
  height: 100%

  polygon
    fill: #4a3622
    stroke: #4a3622
    stroke-width: 0.06
    stroke-linejoin: round

.bz-level-name
  font-size: 0.58rem
  font-weight: 800
  line-height: 1.1
  text-align: center
  min-height: 2.2em
  hyphens: auto
  -webkit-hyphens: auto
  overflow-wrap: break-word

.bz-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.bz-top
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: center
  gap: 8px
  padding: max(4px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  height: calc(56px + env(safe-area-inset-top))
  pointer-events: none

.bz-top > *
  pointer-events: auto

.bz-btn
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.92)
  color: #2a2418
  font-size: 1.1rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)

.bz-info
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  padding: 3px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.9)
  font-weight: 800
  text-align: center

.bz-level-label
  font-size: 0.95rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.bz-ref
  font-size: 0.7rem
  font-weight: 700
  color: #6b5a3a

.bz-stars-live
  display: flex
  gap: 1px
  padding: 4px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.9)

.bz-star
  font-size: 1.2rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.bz-tools
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  padding: 4px 8px
  pointer-events: none

  &--row
    flex-direction: row

  &--col
    flex-direction: column
    padding-left: max(6px, env(safe-area-inset-left))

.bz-tool
  pointer-events: auto
  display: grid
  place-items: center
  min-width: 52px
  height: 52px
  padding: 0 6px
  border: 2px solid rgba(60, 32, 8, 0.5)
  border-radius: 26px
  background: rgba(255, 250, 235, 0.95)
  color: #6b4a1a
  font-size: 1.6rem
  font-weight: 800
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)
  cursor: pointer
  touch-action: manipulation

  &:disabled
    opacity: 0.4

  &--tip
    background: #f5c84a
    color: #3b2a08
    min-width: 62px

.bz-tool-text
  font-size: 1rem

.bz-tip
  position: absolute
  transform: translateX(-50%)
  max-width: min(420px, 88vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.96)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3)

// the result card: one column; on a short screen held sideways two columns (the picture and the stars left, the words and the buttons right)
.bz-res
  display: contents

.bz-result-pic
  width: 100%
  max-height: 170px
  object-fit: contain
  border-radius: 14px

.bz-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.bz-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.bz-how
  gap: 20px

.bz-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.bz-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.bz-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

// short screens: the cards closer together
@media (max-height: 520px)
  .bz-how
    gap: 8px
  .bz-how-row
    gap: 12px
  .bz-how-sign
    width: 40px
    font-size: 1.5rem
  .bz-how-line
    font-size: 1.05rem
  .bz-result-pic
    max-height: 90px
  .bz-card--small
    padding: 12px 14px
    gap: 6px
  .bz-card--result
    display: grid
    grid-template-columns: 1fr 1fr
    width: min(640px, 100%)
    align-items: center
    column-gap: 16px
  .bz-res
    display: flex
    flex-direction: column
    align-items: center
    gap: 6px
</style>
