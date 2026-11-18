<script setup lang="ts">
/**
 * "Nehemias Mauer": the big game (rules in `utils/nehemiaMauerGame.ts`, physics in `utils/nehemiaMauerPhysics.ts`, levels in `utils/nehemiaMauerLevels.ts`;
 * this file draws it and takes the touch). One stone hangs in the sky; the finger moves it, a tap turns it, a flick down (or the big arrow) lets it fall
 * onto the foundation. Golden flags show how high the wall of Jerusalem has to be. The stones never run out, nobody can lose.
 * The canvas is measured at every touch (a tablet's browser bar slides in and out), and by a ResizeObserver.
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
import { HELP_AFTER, STONES, dropHand, handSize, holdSwap, marksHit, moveHand, nudgeHand, rotateHand, spawnY, starsOf, tick, towerTop, type Game } from '@/utils/nehemiaMauerGame'
import { LEVELS, LEVELS_PER_CHAPTER, CHAPTER_COUNT, levelGame } from '@/utils/nehemiaMauerLevels'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'nehemia'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  ...Array.from({ length: 6 }, (_, i) => `bloecke-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `szene-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `wand-${i + 1}`),
  'spezial', 'holz', 'deko-olive', 'deko-fahne-rot', 'deko-fahne-blau', 'sym-rotr', 'sym-drop', 'sym-hold'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/nehemia/${n}.webp`)

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

/** The colours of a block when its picture is missing. */
const FLAT = [
  ['#c98a52', '#d9a25f', '#a8683a', '#c9a24a', '#b97a68', '#8f8a4a'],
  ['#e9e1c9', '#c9ccd0', '#b7c4d4', '#ecd98a', '#e0b4b4', '#a9c2a0'],
  ['#e0b04a', '#d98a3c', '#d8c08a', '#a8643a', '#c99a3a', '#e8b890'],
  ['#b5473a', '#8f2f30', '#6b4332', '#c9693a', '#7d3a4a', '#c98068'],
  ['#8aa0b8', '#4f7686', '#d4d8dc', '#a79bb8', '#5d82a8', '#6aa595'],
  ['#e5b84a', '#f3ead2', '#e8d49a', '#e0a898', '#e8b45a', '#f0e08a']
]

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const chapterCard = ref(-1)
let pendingCard = -1
const hintText = ref('')
const hintShown = ref(false)
let hintTimer = 0
type ChapterText = { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0]; story: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }
const chapterTexts = computed(() => ((tm('app.bigGames.nehemia.chapters') as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelStars = computed(() => progress.levels(ID))
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const levelLabel = (i: number) => `${t('app.bigGames.nehemia.level')} ${(LEVELS[i]?.index ?? 0) + 1}`

const hud = reactive({ hit: 0, all: 0, lost: 0, used: 0, s2: true, s3: true, wind: 0, rain: false, night: false, helping: false })
const outcome = reactive({ stars: 0, lost: 0, used: 0, par: 0 })
const lay = reactive({ hold: { x: 0, y: 0, s: 0 } })

// ── local memory (chapters seen, hints seen) ────────────────────────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-nehemia-v2'
interface Mem {
  chapters: boolean[]
  hints: Record<string, boolean>
}
function loadMem(): Mem {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as Mem | null
    if (m && typeof m === 'object') return { chapters: m.chapters ?? [], hints: m.hints ?? {} }
  } catch {
    // start fresh
  }
  return { chapters: [], hints: {} }
}
const mem = reactive<Mem>(loadMem())
function saveMem() {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {
    // a private window: not remembered
  }
}

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let g: Game = levelGame(0)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
/** The pixels per stone unit, the left edge of the world, the screen row of the ground, the top of the playing area. */
let cell = 30
let ox = 0
let groundY = 0
let areaTop = 0
let camY = 0
let holdBox = { x: 0, y: 0, s: 0 }
let nextBoxes: { x: number; y: number; s: number }[] = []
let ro: ResizeObserver | null = null

interface Part {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'spark'
}
const parts: Part[] = []
let rngState = 4242
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}
function spawnPart(p: Omit<Part, 't'>) {
  if (parts.length >= 220) parts.shift()
  parts.push({ ...p, t: 0 })
}
let endTimer = 0
let winT = -1

function begin(i: number) {
  level.value = i
  g = levelGame(i)
  parts.length = 0
  winT = -1
  window.clearTimeout(endTimer)
  const L = LEVELS[i]!
  hud.rain = L.rain
  hud.night = L.night
  syncHud()
  screen.value = 'play'
  pendingCard = L.index === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  if (!paused.value) hintOnce(L.intro)
  layout()
  camY = 0
  setProbe()
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  chapterCard.value = pendingCard
  paused.value = chapterCard.value >= 0
  if (!paused.value) hintOnce(LEVELS[level.value]?.intro)
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
  hintOnce(LEVELS[level.value]?.intro)
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
  window.clearTimeout(endTimer)
}

function say(text: string, ms = 6500) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}

function hintOnce(intro: string | undefined) {
  if (!intro || mem.hints[intro]) return
  mem.hints[intro] = true
  saveMem()
  say(t(`app.bigGames.nehemia.hint.${intro}`), 8000)
}

function syncHud() {
  const hit = marksHit(g)
  if (hud.hit !== hit) hud.hit = hit
  if (hud.all !== g.marks.length) hud.all = g.marks.length
  if (hud.lost !== g.lost) hud.lost = g.lost
  if (hud.used !== g.used) hud.used = g.used
  const s2 = g.lost <= 3
  const s3 = g.lost <= 1 && g.used <= g.def.par + g.lost
  if (hud.s2 !== s2) hud.s2 = s2
  if (hud.s3 !== s3) hud.s3 = s3
  const w = g.def.wind > 0 ? Math.round((g.wind / g.def.wind) * 10) / 10 : 0
  if (hud.wind !== w) hud.wind = w
  const help = g.lost >= HELP_AFTER
  if (hud.helping !== help) hud.helping = help
}

// ── the events of the rules: sounds and effects ─────────────────────────────────────────────────────────────────────────────
function onEvents() {
  for (const e of g.events) {
    if (e.t === 'rotate') play('tap', 0.7)
    else if (e.t === 'drop') play('flip', 0.6)
    else if (e.t === 'hold') play('flip')
    else if (e.t === 'land') {
      if (e.speed > 1.5) play('snap', Math.min(1, e.speed / 6))
      for (let k = 0; k < 4; k++) spawnPart({ x: e.x + (rand() - 0.5) * 1.2, y: e.y, vx: (rand() - 0.5) * 2.5, vy: rand() * 1.6, life: 0.5 + rand() * 0.3, r: 0.1 + rand() * 0.12, kind: 'dust' })
      if (rand() < 0.5) spawnPart({ x: e.x, y: e.y + 0.2, vx: (rand() - 0.5) * 2, vy: 1 + rand() * 2, life: 0.6, r: 0.6, kind: 'spark' })
    } else if (e.t === 'lost') {
      play('wrong', 0.5)
      if (g.lost === 1) say(t('app.bigGames.nehemia.lostOne'), 4500)
      else if (g.lost === HELP_AFTER) say(t('app.bigGames.nehemia.helping'), 5000)
    } else if (e.t === 'mark') play('found', 0.8)
    else if (e.t === 'quake') {
      play('clunk', 0.7)
      say(t('app.bigGames.nehemia.quake'), 3500)
    } else if (e.t === 'win') {
      winT = 0
      play('fanfare')
      finish()
    }
  }
  g.events.length = 0
}

function finish() {
  outcome.stars = starsOf(g)
  outcome.lost = g.lost
  outcome.used = g.used
  outcome.par = g.def.par
  progress.record(ID, level.value, outcome.stars)
  window.clearTimeout(endTimer)
  endTimer = window.setTimeout(() => {
    if (screen.value !== 'play') return
    screen.value = 'result'
    play('result')
  }, 2200)
}

// ── the actions of the buttons ──────────────────────────────────────────────────────────────────────────────────────────────
const live = () => screen.value === 'play' && !paused.value && g.status === 'play'
const aRotate = () => live() && rotateHand(g)
const aDrop = () => live() && dropHand(g)
const aHold = () => live() && holdSwap(g)
let nudgeTimer = 0
function startNudge(dx: number) {
  if (!live()) return
  nudgeHand(g, dx)
  window.clearInterval(nudgeTimer)
  nudgeTimer = window.setInterval(() => live() && nudgeHand(g, dx), 70)
}
function stopNudge() {
  window.clearInterval(nudgeTimer)
}

// ── the touch (the canvas is measured at every touch) ───────────────────────────────────────────────────────────────────────
let pt: { x0: number; y0: number; hx: number; t0: number; moved: boolean } | null = null

/** A touch as a point of the canvas in the units that the game draws with (the real size of the canvas now, not the one of the last resize). */
function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky }
}
const toWorldX = (sx: number) => (sx - ox) / cell
function onDown(e: PointerEvent) {
  if (!live() || !g.hand) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pos(e)
  pt = { x0: p.x, y0: p.y, hx: g.hand.x, t0: performance.now(), moved: false }
}
function onMove(e: PointerEvent) {
  if (!pt || !live()) return
  const p = pos(e)
  if (Math.abs(p.x - pt.x0) > 8 || Math.abs(p.y - pt.y0) > 8) pt.moved = true
  if (pt.moved) moveHand(g, pt.hx + (p.x - pt.x0) / cell)
}
function onUp(e: PointerEvent) {
  const s = pt
  pt = null
  if (!s || !live()) return
  const p = pos(e)
  const dt = performance.now() - s.t0
  if (!s.moved && dt < 380) rotateHand(g)
  else if (p.y - s.y0 > cell * 2 && dt < 320 && Math.abs(p.x - s.x0) < (p.y - s.y0) * 0.6) dropHand(g)
}
function onCancel() {
  pt = null
}
function onKey(e: KeyboardEvent) {
  if (!live()) return
  const k = e.key
  if (k === 'ArrowLeft') nudgeHand(g, -0.5)
  else if (k === 'ArrowRight') nudgeHand(g, 0.5)
  else if (k === 'ArrowUp' || k === 'x' || k === 'z') rotateHand(g)
  else if (k === ' ' || k === 'ArrowDown') dropHand(g)
  else if (k === 'c') holdSwap(g)
  else return
  e.preventDefault()
}

// ── the layout and the loop ─────────────────────────────────────────────────────────────────────────────────────────────────
function layout() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  const top = 150
  const bottom = 96
  areaTop = top
  const W = g.def.width
  cell = Math.max(14, Math.floor(Math.min(cvW / (W + 1.2), (cvH - top - bottom) / 9)))
  ox = (cvW - W * cell) / 2
  groundY = cvH - bottom - cell * 0.9
  holdBox = { x: 10, y: 84, s: 54 }
  nextBoxes = [0, 1].map((k) => ({ x: cvW - 10 - (2 - k) * 58, y: 86, s: 50 }))
  lay.hold = holdBox
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  advance(dt)
  draw(now / 1000)
}

function advance(dt: number) {
  if (screen.value !== 'play') return
  if (!paused.value) tick(g, dt)
  onEvents()
  syncHud()
  if (winT >= 0) winT += dt
  // the camera follows the height of the wall
  const viewH = (groundY - areaTop) / cell
  const needed = Math.max(spawnY(g) + 1.6, ...g.marks.map((m) => m.y + 1.2), towerTop(g) + 2)
  const want = Math.max(0, needed - viewH)
  camY += (want - camY) * Math.min(1, dt * 3)
  for (const p of parts) {
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy -= (p.kind === 'dust' ? 2 : 0.4) * dt
  }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.t > parts[i]!.life) parts.splice(i, 1)
}

const sx = (x: number) => ox + x * cell
const sy = (y: number) => groundY - (y - camY) * cell

/** A block of `w` x `h` units with its tiles, turned by `rot`. */
function drawBox(c: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number, rot: number, type: number, alpha = 1) {
  const chap = LEVELS[level.value]?.chapter ?? 0
  const sheet = img[`bloecke-${chap + 1}`]
  const nx = Math.max(1, Math.round(hw * 2))
  const ny = Math.max(1, Math.round(hh * 2))
  c.save()
  c.translate(sx(x), sy(y))
  c.rotate(-rot)
  if (alpha < 1) c.globalAlpha = alpha
  const colour = type % 6
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const px = (-hw + (i * 2 * hw) / nx) * cell
      const py = (-hh + (j * 2 * hh) / ny) * cell
      const wcell = (2 * hw * cell) / nx
      const hcell = (2 * hh * cell) / ny
      if (sheet) {
        const tw = sheet.width / 3
        const th = sheet.height / 2
        c.drawImage(sheet, (colour % 3) * tw, Math.floor(colour / 3) * th, tw, th, px, py, wcell + 0.5, hcell + 0.5)
      } else {
        c.fillStyle = FLAT[chap]![colour]!
        c.fillRect(px, py, wcell, hcell)
      }
    }
  }
  c.strokeStyle = 'rgba(40,20,0,0.65)'
  c.lineWidth = 2
  c.strokeRect(-hw * cell, -hh * cell, 2 * hw * cell, 2 * hh * cell)
  c.restore()
}

function drawMini(c: CanvasRenderingContext2D, type: number, b: { x: number; y: number; s: number }) {
  const s = STONES[type]!
  const k = Math.min((b.s - 12) / Math.max(s.w, s.h, 3), 14)
  c.save()
  const chap = LEVELS[level.value]?.chapter ?? 0
  const sheet = img[`bloecke-${chap + 1}`]
  for (let i = 0; i < s.w; i++)
    for (let j = 0; j < s.h; j++) {
      const px = b.x + b.s / 2 - (s.w * k) / 2 + i * k
      const py = b.y + b.s / 2 - (s.h * k) / 2 + j * k
      const colour = type % 6
      if (sheet) c.drawImage(sheet, (colour % 3) * (sheet.width / 3), Math.floor(colour / 3) * (sheet.height / 2), sheet.width / 3, sheet.height / 2, px, py, k + 0.5, k + 0.5)
      else {
        c.fillStyle = FLAT[chap]![colour]!
        c.fillRect(px, py, k, k)
      }
    }
  c.strokeStyle = 'rgba(40,20,0,0.6)'
  c.lineWidth = 1.2
  c.strokeRect(b.x + b.s / 2 - (s.w * k) / 2, b.y + b.s / 2 - (s.h * k) / 2, s.w * k, s.h * k)
  c.restore()
}

function panel(c: CanvasRenderingContext2D, b: { x: number; y: number; s: number }, dashed = false) {
  c.fillStyle = 'rgba(255,248,226,0.85)'
  c.strokeStyle = 'rgba(120,80,30,0.7)'
  c.lineWidth = 2
  c.setLineDash(dashed ? [5, 4] : [])
  c.beginPath()
  c.roundRect(b.x, b.y, b.s, b.s, 10)
  c.fill()
  c.stroke()
  c.setLineDash([])
}

function sprite(c: CanvasRenderingContext2D, name: string, cx: number, bottom: number, height: number) {
  const i = img[name]
  if (!i) return
  const wd = (i.width / i.height) * height
  c.drawImage(i, cx - wd / 2, bottom - height, wd, height)
}

function draw(time: number) {
  const c = ctx
  if (!c || !loaded.value) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#2a1d12'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  const chap = LEVELS[level.value]?.chapter ?? 0
  let bg = img[`szene-${chap + 1}`]
  for (let k = chap; !bg && k >= 0; k--) bg = img[`szene-${k + 1}`]
  for (let k = chap + 2; !bg && k <= 6; k++) bg = img[`szene-${k}`]
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    const par = Math.min(camY * 6, bg.height * k - cvH)
    c.drawImage(bg, (cvW - bg.width * k) / 2, cvH - bg.height * k + Math.max(0, par), bg.width * k, bg.height * k)
  }
  if (g.def.night) {
    c.fillStyle = 'rgba(8,10,40,0.5)'
    c.fillRect(0, 0, cvW, cvH)
  } else if (g.def.rain) {
    c.fillStyle = 'rgba(40,55,80,0.28)'
    c.fillRect(0, 0, cvW, cvH)
  }
  const shake = g.shake > 0 ? Math.sin(time * 70) * 3 * g.shake : 0
  c.save()
  c.translate(shake, 0)

  // the ground and the foundation
  const gy = sy(0)
  c.fillStyle = '#7a5a3a'
  c.fillRect(0, gy, cvW, cvH - gy)
  c.fillStyle = 'rgba(255,230,170,0.22)'
  c.fillRect(0, gy, cvW, 3)
  const fw = g.def.base
  const fx0 = g.ground.x - fw / 2
  for (let i = 0; i < fw; i++) {
    const cx = fx0 + i + 0.5
    drawBox(c, cx - (g.ground.x - g.def.width / 2), -0.5, 0.5, 0.5, 0, 5)
  }

  // the flags (golden rings; a flag that is touched turns blue and shines)
  for (const m of g.marks) {
    const px = sx(m.x)
    const py = sy(m.y)
    if (py < -40 || py > cvH + 40) continue
    const pulse = 0.5 + 0.5 * Math.sin(time * 4 + m.x)
    if (m.hit) {
      if (glow.complete && glow.naturalWidth) {
        c.globalAlpha = 0.8
        c.drawImage(glow, px - cell, py - cell, cell * 2, cell * 2)
        c.globalAlpha = 1
      }
      sprite(c, 'deko-fahne-blau', px, py + cell * 0.25, cell * 1.25)
    } else {
      c.strokeStyle = `rgba(255,214,90,${0.6 + 0.4 * pulse})`
      c.lineWidth = 2.5
      c.setLineDash([5, 4])
      c.beginPath()
      c.arc(px, py, cell * 0.42, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
      sprite(c, 'deko-fahne-rot', px, py + cell * 0.25, cell * 1.25)
    }
  }

  // the stones
  for (const b of g.stones) drawBox(c, b.x, b.y, b.hw, b.hh, b.rot, b.tag)

  // the stone in the hand with its guide lines
  const h = g.hand
  if (h && g.status === 'play') {
    const s = handSize(h)
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = 1.5
    c.setLineDash([4, 6])
    c.beginPath()
    c.moveTo(sx(h.x - s.w / 2), sy(h.y))
    c.lineTo(sx(h.x - s.w / 2), gy)
    c.moveTo(sx(h.x + s.w / 2), sy(h.y))
    c.lineTo(sx(h.x + s.w / 2), gy)
    c.stroke()
    c.setLineDash([])
    drawBox(c, h.x, h.y, s.w / 2, s.h / 2, 0, h.type)
    c.strokeStyle = 'rgba(255,236,150,0.9)'
    c.lineWidth = 2
    c.strokeRect(sx(h.x - s.w / 2) - 2, sy(h.y + s.h / 2) - 2, s.w * cell + 4, s.h * cell + 4)
  }

  // the particles
  for (const p of parts) {
    const k = p.t / p.life
    const px = sx(p.x)
    const py = sy(p.y)
    if (p.kind === 'spark' && glow.complete && glow.naturalWidth) {
      c.globalAlpha = 1 - k
      const s = p.r * cell
      c.drawImage(glow, px - s / 2, py - s / 2, s, s)
      c.globalAlpha = 1
    } else {
      c.globalAlpha = (1 - k) * 0.8
      c.fillStyle = '#d9c19a'
      c.beginPath()
      c.arc(px, py, p.r * cell * (1 + k * 0.6), 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    }
  }
  // the finished wall: flags on top and olive trees
  if (winT >= 0) {
    const k = Math.min(1, winT / 0.7)
    sprite(c, 'deko-olive', sx(g.def.width / 2 - g.def.base / 2 - 0.4), gy, cell * 4 * k)
    sprite(c, 'deko-olive', sx(g.def.width / 2 + g.def.base / 2 + 0.4), gy, cell * 4 * k)
  }
  c.restore()

  // rain
  if (g.def.rain) {
    c.strokeStyle = 'rgba(200,220,255,0.45)'
    c.lineWidth = 1.2
    c.beginPath()
    for (let i = 0; i < 70; i++) {
      const x = ((i * 97.3 + time * 40) % (cvW + 40)) - 20
      const y = ((i * 53.1 + time * 520) % cvH)
      c.moveTo(x, y)
      c.lineTo(x - 5, y + 16)
    }
    c.stroke()
  }

  // the reserve and the next stones
  panel(c, holdBox, true)
  if (g.hold !== null) {
    c.globalAlpha = g.holdUsed ? 0.45 : 1
    drawMini(c, g.hold, holdBox)
    c.globalAlpha = 1
  } else {
    const hi = img['sym-hold']
    if (hi) {
      c.globalAlpha = 0.5
      c.drawImage(hi, holdBox.x + holdBox.s * 0.18, holdBox.y + holdBox.s * 0.18, holdBox.s * 0.64, holdBox.s * 0.64)
      c.globalAlpha = 1
    }
  }
  nextBoxes.forEach((b, k) => {
    panel(c, b)
    const q = g.queue[k]
    if (q !== undefined) drawMini(c, q, b)
  })
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const sym = (n: string) => pic(`sym-${n}`)
const resultText = computed(() => t(`app.bigGames.nehemia.won${Math.max(1, outcome.stars)}`))
const rewardChapter = computed(() => (LEVELS[level.value]?.index === LEVELS_PER_CHAPTER - 1 ? LEVELS[level.value]!.chapter : -1))
const holdStyle = computed(() => ({ left: `${lay.hold.x}px`, top: `${lay.hold.y}px`, width: `${lay.hold.s}px`, height: `${lay.hold.s}px` }))
const windText = computed(() => {
  const w = hud.wind
  if (Math.abs(w) < 0.15) return '·'
  return (w > 0 ? '→' : '←').repeat(Math.min(3, Math.ceil(Math.abs(w) * 3)))
})
const bannerSrc = (c: number) => pic(`szene-${c + 1}`)
const rewardSrc = (c: number) => pic(`wand-${c + 1}`)
const showWind = computed(() => (LEVELS[level.value]?.wind ?? 0) > 0)

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __nehemia?: unknown }).__nehemia = {
      get g() {
        return g
      },
      begin,
      advance: (sec = 0.02) => {
        tick(g, sec)
        advance(0)
      },
      draw: () => draw(performance.now() / 1000),
      move: (x: number) => moveHand(g, x),
      rotate: () => rotateHand(g),
      drop: () => dropHand(g)
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
  music.playGame('memory')
  setProbe()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(hintTimer)
  window.clearInterval(nudgeTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.visualViewport?.removeEventListener('resize', layout)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="nm")
    canvas(
      ref="canvas"
      class="nm-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="nm-center")
      div(class="nm-spinner")

    //- the overview: the story, the chapters and the pieces of wall
    div(v-else-if="screen === 'menu'" class="nm-menu")
      div(class="nm-card")
        GameIntroBox(
          :title="t('app.bigGames.nehemia.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.nehemia.story')"
          :task="t('app.bigGames.nehemia.task')"
        )
        p(v-if="allDone" class="nm-done") {{ t('app.bigGames.nehemia.allDone') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="nm-chapter")
          div(class="nm-banner")
            img(:src="bannerSrc(c)" alt="" class="nm-banner-pic" @error="hideBroken")
            div(class="nm-banner-text")
              span(class="nm-ch-name") {{ ct.name }}
              span(class="nm-ch-ref") {{ ct.ref }}
              span(class="nm-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
            img(v-if="chapterDone(c)" :src="rewardSrc(c)" alt="" class="nm-reward" @error="hideBroken")
          p(class="nm-ch-story") {{ ct.story }}
          div(class="nm-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="nm-level"
              :data-test="'nehemia-level-' + i"
              @click="begin(i)"
            )
              span(class="nm-level-no") {{ i - c * LEVELS_PER_CHAPTER + 1 }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="nm-rules") {{ t('app.bigGames.nehemia.starRules') }}
        div(class="nm-menu-buttons")
          AdvButton(tone="blau" small data-test="nehemia-how" @click="how = true") {{ t('app.bigGames.nehemia.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.nehemia.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="nm-top")
        div(class="nm-top-btns")
          button(type="button" class="nm-btn" :aria-label="t('app.bigGames.nehemia.pause')" data-test="nehemia-pause" @click="paused = true") ❚❚
          button(type="button" class="nm-btn" :aria-label="t('app.bigGames.nehemia.restart')" data-test="nehemia-restart" @click="begin(level)") ↻
        div(class="nm-info")
          span(class="nm-level-label") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
          div(class="nm-stars-live" :aria-label="t('app.bigGames.nehemia.starRules')")
            span(class="nm-star is-on") ★
            span(:class="['nm-star', { 'is-on': hud.s2 }]") ★
            span(:class="['nm-star', { 'is-on': hud.s3 }]") ★
          span(class="nm-left" data-test="nehemia-flags") ⚑ {{ hud.hit }} / {{ hud.all }} · {{ t('app.bigGames.nehemia.stones') }} {{ hud.used }} · {{ t('app.bigGames.nehemia.lost') }} {{ hud.lost }}
        div(v-if="showWind" class="nm-wind" :aria-label="t('app.bigGames.nehemia.wind')") 💨 {{ windText }}
      button(
        type="button"
        class="nm-holdbox"
        :style="holdStyle"
        :aria-label="t('app.bigGames.nehemia.hold')"
        data-test="nehemia-hold"
        @click="aHold"
      )

      div(class="nm-ctrl")
        button(type="button" class="nm-cbtn" aria-label="←" data-test="nehemia-left" @pointerdown.prevent="startNudge(-0.5)" @pointerup="stopNudge" @pointerleave="stopNudge" @pointercancel="stopNudge")
          span(class="nm-glyph") ◀
        button(type="button" class="nm-cbtn" :aria-label="t('app.bigGames.nehemia.rotate')" data-test="nehemia-rotate" @click="aRotate")
          span(class="nm-glyph") ⟳
          img(:src="sym('rotr')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" class="nm-cbtn nm-cbtn--big" :aria-label="t('app.bigGames.nehemia.drop')" data-test="nehemia-drop" @click="aDrop")
          span(class="nm-glyph") ⤓
          img(:src="sym('drop')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" class="nm-cbtn" :aria-label="t('app.bigGames.nehemia.hold')" data-test="nehemia-hold2" @click="aHold")
          span(class="nm-glyph") ⇄
          img(:src="sym('hold')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" class="nm-cbtn" aria-label="→" data-test="nehemia-right" @pointerdown.prevent="startNudge(0.5)" @pointerup="stopNudge" @pointerleave="stopNudge" @pointercancel="stopNudge")
          span(class="nm-glyph") ▶
      div(v-if="hintShown" class="nm-tip") {{ hintText }}

      div(v-if="paused && !how && chapterCard < 0" class="nm-menu nm-menu--dim")
        div(class="nm-card nm-card--small")
          h2(class="nm-title") {{ t('app.bigGames.nehemia.pause') }}
          AdvButton(data-test="nehemia-resume" @click="paused = false") {{ t('app.bigGames.nehemia.resume') }}
          AdvButton(tone="blau" data-test="nehemia-pause-again" @click="begin(level)") {{ t('app.bigGames.nehemia.again') }}
          AdvButton(tone="blau" data-test="nehemia-menu" @click="toMenu") {{ t('app.bigGames.nehemia.menu') }}
          AdvButton(tone="blau" data-test="nehemia-pause-leave" @click="leave") {{ t('app.bigGames.nehemia.leave') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-card--small")
        h2(class="nm-title") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
        img(v-if="rewardChapter >= 0" :src="rewardSrc(rewardChapter)" alt="" class="nm-result-pic" @error="hideBroken")
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="nm-text") {{ resultText }}
        div(class="nm-lines")
          p(class="nm-line is-on") ✓ {{ t('app.bigGames.nehemia.lineBuilt') }}
          p(:class="['nm-line', { 'is-on': outcome.stars >= 2 }]") {{ outcome.stars >= 2 ? '✓' : '○' }} {{ t('app.bigGames.nehemia.lineLost', { n: outcome.lost }) }}
          p(:class="['nm-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ t('app.bigGames.nehemia.lineSteady', { have: outcome.used, need: outcome.par }) }}
        p(v-if="rewardChapter >= 0" class="nm-line is-on") {{ t('app.bigGames.nehemia.chapterDone') }}
        p(v-if="rewardChapter === 5" class="nm-text") {{ t('app.bigGames.nehemia.allDone') }}
        AdvButton(v-if="hasNext" data-test="nehemia-next" @click="begin(level + 1)") {{ t('app.bigGames.nehemia.next') }}
        AdvButton(:tone="hasNext ? 'blau' : 'gold'" data-test="nehemia-again" @click="begin(level)") {{ t('app.bigGames.nehemia.again') }}
        AdvButton(tone="blau" data-test="nehemia-menu" @click="toMenu") {{ t('app.bigGames.nehemia.menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="nm-result-pic" @error="hideBroken")
        h2(class="nm-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="nm-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="nm-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="nm-text nm-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="nehemia-chapter-go" @click="closeCard") {{ t('app.bigGames.nehemia.go') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-how")
        h2(class="nm-title") {{ t('app.bigGames.nehemia.howTitle') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") ↔
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howMove') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") 👆
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howTurn') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") ↓
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howDrop') }}
        AdvButton(data-test="nehemia-go" @click="closeHow") {{ t('app.bigGames.nehemia.go') }}
</template>

<style scoped lang="sass">
.nm
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1d12
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.nm-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.nm-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.nm-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: nm-spin 0.9s linear infinite

@keyframes nm-spin
  to
    transform: rotate(360deg)

.nm-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(30, 18, 8, 0.72), rgba(30, 18, 8, 0.86))

  &--dim
    place-items: center
    background: rgba(24, 14, 6, 0.62)
    z-index: 5

.nm-card
  width: min(640px, 100%)
  padding: 22px 20px 18px
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

.nm-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.nm-text
  margin: 0
  font-size: 1.1rem
  line-height: 1.4

  &--task
    font-weight: 800

.nm-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.nm-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.nm-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.nm-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.nm-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 80%

.nm-banner-text
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

.nm-reward
  position: absolute
  right: 8px
  bottom: 8px
  width: 84px
  height: 56px
  object-fit: cover
  border-radius: 10px
  border: 2px solid #ffe27a

.nm-ch-name
  font-size: 1.05rem
  font-weight: 800

.nm-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.nm-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.nm-ch-story, .nm-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.nm-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%

.nm-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  min-height: 56px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.nm-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.nm-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.nm-top
  position: absolute
  top: 0
  left: 0
  right: 0
  height: 80px
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.nm-top > *
  pointer-events: auto

.nm-top-btns
  display: flex
  gap: 6px

.nm-btn
  position: relative
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

.nm-info
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 1px
  padding: 3px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  text-align: center

.nm-level-label
  font-size: 0.82rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.nm-left
  font-size: 0.72rem
  font-weight: 700
  color: #6b5a3a

.nm-stars-live
  display: flex
  gap: 1px

.nm-star
  font-size: 1rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.nm-wind
  align-self: center
  padding: 4px 8px
  border-radius: 12px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  font-size: 0.8rem
  white-space: nowrap

.nm-holdbox
  position: absolute
  padding: 0
  border: none
  border-radius: 10px
  background: transparent
  cursor: pointer

.nm-ctrl
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: flex
  justify-content: center
  align-items: center
  gap: 8px
  padding: 6px max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))

.nm-cbtn
  position: relative
  display: grid
  place-items: center
  width: 56px
  height: 56px
  padding: 0
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.92)
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)
  cursor: pointer
  touch-action: none

  &--big
    width: 70px
    height: 70px

.nm-cpic
  position: absolute
  inset: 8%
  width: 84%
  height: 84%
  object-fit: contain

.nm-glyph
  font-size: 1.5rem
  font-weight: 800
  color: #6b4a1a

.nm-tip
  position: absolute
  left: 50%
  top: 160px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.nm-result-pic
  width: 100%
  max-height: 160px
  object-fit: cover
  border-radius: 14px

.nm-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.nm-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.nm-how
  gap: 20px

.nm-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.nm-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.nm-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

// short screens: the explanation card closer together
@media (max-height: 520px)
  .nm-how
    gap: 8px
  .nm-how-row
    gap: 12px
  .nm-how-sign
    width: 40px
    font-size: 1.5rem
  .nm-how-line
    font-size: 1.05rem
</style>
