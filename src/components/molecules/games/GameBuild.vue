<script setup lang="ts">
/**
 * The building game (the ark; the altar of stage 8 will use the same data later): the parts of one painted plan lie in a tray and are
 * set at their places in any order, by dragging or by tapping the part and then its place. Round 1 shows the plan as a blue shadow,
 * the last round is the pitch: the child dips into the pot and smears pitch along the seams of the wooden wall with a finger (the black
 * line follows the finger; beside the seam nothing sticks and a red cross shows). A seam is done when 90 % of it is covered. For screen
 * readers and the keyboard every seam has a hidden button. A wrong place of a part or a smear beside the seam counts as a mistake, nothing is lost.
 * Not built yet (the data allows them): `ordered` (set the parts in a fixed order) and `rotate` (turn a part by a tap).
 */
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop, type DropPoint } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { dist, nearestOnPolyline, polylineLength, sampleAlong, type Pt } from '@/utils/pitchSmear'
import type { BuildGame, BuildPiece } from '@/types/adventure'

const props = defineProps<{ game: BuildGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

/** A place is hit when the finger is within the box of the part, made at least this big (px) so that small parts can be hit. */
const MIN_HIT = 48

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const message = ref('')
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const placed = reactive<Record<string, boolean>>({})
/** How often a part was set wrong in this round (after two wrong tries in a round without shadow its place glows). */
const missed = reactive<Record<string, number>>({})
/** The sign (tick or cross) that shows for a moment, as a percentage of the plan or the wall. */
const flash = ref<{ x: number; y: number; kind: 'good' | 'bad' } | null>(null)
const wobble = ref<string | null>(null)
const boardEl = ref<HTMLElement | null>(null)
/** The plan is shown bigger (and scrolls sideways) when the child asks for it. */
const zoomed = ref(true)
const stageEl = ref<HTMLElement | null>(null)
/** When the plan is bigger than the screen it starts in the middle (the door, the windows and the ramp are there). */
function centerPlan() {
  void nextTick(() => {
    const el = stageEl.value
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  })
}
onMounted(centerPlan)
watch(zoomed, centerPlan)
watch(() => current.value.pitch, (pitch) => {
  if (!pitch) centerPlan()
})
const wallEl = ref<HTMLElement | null>(null)

// the pitch: the child smears along the seams of the wall (coordinates in the units of the wall picture, 900 x 1200)
const W = 900
const H = 1200
const seams = computed<Pt[][]>(() => (props.game.pitch?.seams ?? []).map((sm) => sm.points.map(([x, y]) => [(x * W) / 100, (y * H) / 100] as Pt)))
const tolerance = computed(() => ((props.game.pitch?.tolerance ?? 5.5) / 100) * W)
/** A point of the seam counts as covered when pitch lies this close to it; a seam is done at 90 %. */
const COVER = 0.032 * W
const NEED = 0.9
const cells = computed<Pt[][]>(() => seams.value.map((line) => sampleAlong(line, Math.max(20, Math.round(polylineLength(line) / 12)))))
const covered = reactive<Record<number, boolean[]>>({})
const filled = reactive<Record<number, boolean>>({})
/** The pieces of black pitch that lie on the wall (a new piece starts whenever the finger left the seam or was lifted). */
const strokes = ref<Pt[][]>([])
const filledCount = computed(() => seams.value.filter((_, i) => filled[i]).length)
const allFilled = computed(() => seams.value.length > 0 && filledCount.value === seams.value.length)
const pot = ref<{ x: number; y: number } | null>(null)
let drawing = false
let last: Pt | null = null
let outside = false
let lastMistakeAt = -Infinity
/** After a few quiet seconds the seams that are still open glow softly (only a help: the child still has to smear them). */
const help = ref(false)
let helpToken = 0
const HELP_AFTER_MS = 5000
function armHelp() {
  const mine = ++helpToken
  help.value = false
  later(() => {
    if (mine === helpToken && current.value.pitch && !finished.value) help.value = true
  }, HELP_AFTER_MS)
}
watch(
  () => current.value.pitch,
  (pitch) => {
    if (pitch) armHelp()
    else {
      helpToken++
      help.value = false
    }
  },
  { immediate: true }
)

const src = (path: string) => prependBaseUrl(path)

function showFlash(x: number, y: number, kind: 'good' | 'bad') {
  flash.value = { x, y, kind }
  later(() => {
    flash.value = null
  }, 900)
}

/** The tray: the parts that are not set yet, in a fixed mixed order (the same every time, never the order of the plan). */
const trayOrder = computed(() => {
  const ids = props.game.pieces.map((p) => p.id)
  let seed = ids.length * 7919 + round.value * 31 + 5
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  if (ids.every((id, i) => id === props.game.pieces[i]!.id)) ids.reverse()
  return ids
})
const trayPieces = computed(() =>
  trayOrder.value.map((id) => props.game.pieces.find((p) => p.id === id)!).filter((p) => !placed[p.id])
)
const pieceById = (id: string): BuildPiece | undefined => props.game.pieces.find((p) => p.id === id)
const boxStyle = (p: BuildPiece) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` })
const hintGlows = (p: BuildPiece) => !current.value.outline && (missed[p.id] ?? 0) >= 2

function roundWon() {
  if (round.value >= rounds.value.length - 1) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(placed)) delete placed[k]
    for (const k of Object.keys(missed)) delete missed[k]
    message.value = ''
  }, 1400)
}

/** Is the point (page pixels) on the place of the part? The place is made big enough for a finger; null when the plan has no size (no screen). */
function pointHits(p: BuildPiece, at: DropPoint): boolean | null {
  const el = boardEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  const px = at.x - r.left
  const py = at.y - r.top
  const w = (p.w / 100) * r.width
  const h = (p.h / 100) * r.height
  const cx = ((p.x + p.w / 2) / 100) * r.width
  const cy = ((p.y + p.h / 2) / 100) * r.height
  return Math.abs(px - cx) <= Math.max(w, MIN_HIT) / 2 && Math.abs(py - cy) <= Math.max(h, MIN_HIT) / 2
}

/** Where in the plan (percentage) a point on the screen lies; the middle of the part when it cannot be told. */
function planPoint(p: BuildPiece, at?: DropPoint) {
  const el = boardEl.value
  if (at && el) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      return { x: Math.min(100, Math.max(0, ((at.x - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((at.y - r.top) / r.height) * 100)) }
    }
  }
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 }
}

function setPiece(pieceId: string, target: string, at?: DropPoint) {
  const p = pieceById(pieceId)
  if (!p || placed[p.id] || between.value || finished.value) return
  const hit = at ? pointHits(p, at) : null
  const right = hit === null ? target === p.id : hit
  if (right) {
    placed[p.id] = true
    progress.mark()
    play('snap')
    showFlash(p.x + p.w / 2, p.y + p.h / 2, 'good')
    message.value = t('app.adventure.fbRight')
    if (props.game.pieces.every((x) => placed[x.id])) later(roundWon, 700)
    return
  }
  mistakes.value++
  missed[p.id] = (missed[p.id] ?? 0) + 1
  play('wrong')
  const where = planPoint(p, at)
  showFlash(where.x, where.y, 'bad')
  message.value = t('app.adventure.fbWrong')
  wobble.value = p.id
  later(() => {
    if (wobble.value === p.id) wobble.value = null
  }, 450)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target, at) => setPiece(id, target, at))

/** A tap on the plan: the point decides (a place on a place is hit by its own box, whatever lies on top of it). */
function onBoardClick(e: MouseEvent) {
  const el = e.target instanceof Element ? e.target.closest('[data-drop]') : null
  const target = el instanceof HTMLElement ? el.dataset.drop ?? 'board' : 'board'
  const hasPoint = e.clientX !== 0 || e.clientY !== 0
  tapPlace(target, hasPoint ? { x: e.clientX, y: e.clientY } : undefined)
}

// ---- the last round: the pitch ----

const pts = (line: Pt[]): string => line.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
const share = (i: number): number => {
  const c = covered[i]
  return c && c.length ? c.filter(Boolean).length / c.length : 0
}

function sealSeam(i: number) {
  if (filled[i] || finished.value) return
  filled[i] = true
  armHelp()
  progress.mark()
  play('right')
  const mid = cells.value[i]?.[Math.floor((cells.value[i]?.length ?? 0) / 2)] ?? [W / 2, H / 2]
  showFlash((mid[0] / W) * 100, (mid[1] / H) * 100, 'good')
  message.value = t('app.adventure.fbRight')
  if (seams.value.every((_, k) => filled[k])) later(roundWon, 1300)
}

let curStroke: Pt[] | null = null

/** The finger beside the seam: nothing sticks; a red cross, once for every time the finger strays (and at most every 0.8 s). */
function straying(raw: Pt) {
  curStroke = null
  if (outside) return
  outside = true
  const now = Date.now()
  if (now - lastMistakeAt < 800) return
  lastMistakeAt = now
  mistakes.value++
  play('wrong')
  showFlash((raw[0] / W) * 100, (raw[1] / H) * 100, 'bad')
  message.value = t('app.adventure.buildOffSeam')
}

/** One point of the finger's way: it sticks to the nearest open seam when it is close enough (and is drawn a little towards the seam). */
function smearAt(raw: Pt) {
  if (allFilled.value || finished.value || between.value) return
  let best = { d: Infinity, at: raw, i: -1 }
  seams.value.forEach((line, i) => {
    if (filled[i]) return
    const n = nearestOnPolyline(raw, line)
    if (n.d < best.d) best = { d: n.d, at: n.at, i }
  })
  if (best.i < 0 || best.d > tolerance.value) {
    // the rest of a seam that is already done is no stray: the finger just finishes the way
    if (seams.value.some((line, i) => filled[i] && nearestOnPolyline(raw, line).d <= tolerance.value)) curStroke = null
    else straying(raw)
    return
  }
  outside = false
  const at: Pt = [raw[0] + (best.at[0] - raw[0]) * 0.6, raw[1] + (best.at[1] - raw[1]) * 0.6]
  if (!curStroke) {
    strokes.value.push([])
    curStroke = strokes.value[strokes.value.length - 1]!
  }
  curStroke.push(at)
  seams.value.forEach((_, i) => {
    if (filled[i]) return
    const list = covered[i] ?? (covered[i] = cells.value[i]!.map(() => false))
    cells.value[i]!.forEach((c, k) => {
      if (!list[k] && dist(at, c) <= COVER) list[k] = true
    })
    if (share(i) >= NEED) sealSeam(i)
  })
}

/** Where on the wall (units of the picture) a pointer event lies; null when the wall has no size (no screen). */
function wallPoint(e: MouseEvent): Pt | null {
  const el = wallEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
}
const potAt = (at: Pt) => (pot.value = { x: (at[0] / W) * 100, y: (at[1] / H) * 100 })

function onWallDown(e: PointerEvent) {
  const at = wallPoint(e)
  if (!at || allFilled.value || finished.value) return
  e.preventDefault()
  try {
    wallEl.value?.setPointerCapture?.(e.pointerId)
  } catch {
    // no capture (old browsers): the finger may leave the wall, nothing more
  }
  drawing = true
  outside = false
  curStroke = null
  last = at
  potAt(at)
  smearAt(at)
}

function onWallMove(e: PointerEvent) {
  if (!drawing) return
  const at = wallPoint(e)
  if (!at) return
  // between two reports of the finger the way is walked in small steps, so a quick swipe leaves no holes
  const from = last ?? at
  const steps = Math.max(1, Math.ceil(dist(from, at) / 10))
  for (let k = 1; k <= steps; k++) smearAt([from[0] + ((at[0] - from[0]) * k) / steps, from[1] + ((at[1] - from[1]) * k) / steps])
  last = at
  potAt(at)
}

function onWallUp() {
  if (!drawing) return
  drawing = false
  curStroke = null
  last = null
  later(() => {
    if (!drawing) pot.value = null
  }, 500)
  armHelp()
}
</script>

<template lang="pug">
  div(class="bd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="bd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="bd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      template(v-if="!current.pitch")
        div(class="bd-bar")
          button(type="button" class="bd-zoom" :aria-pressed="zoomed" @click="zoomed = !zoomed") {{ zoomed ? t('app.adventure.buildZoomOut') : t('app.adventure.buildZoomIn') }}
        div(ref="stageEl" class="bd-stage")
          div(
            ref="boardEl"
            class="bd-board"
            :class="{ outline: current.outline }"
            :style="{ aspectRatio: String(game.aspect), width: zoomed ? '140%' : '100%' }"
            data-drop="board"
            role="group"
            :aria-label="t('app.adventure.buildPlan')"
            @click="onBoardClick"
          )
            img(v-if="current.outline" :src="src(game.shadow ?? '')" alt="" draggable="false" class="bd-shadow")
            template(v-for="p in game.pieces" :key="p.id")
              div(
                v-if="!placed[p.id]"
                class="bd-zone"
                :class="{ shown: current.outline, glow: hintGlows(p), ready: selected !== null }"
                :style="boxStyle(p)"
                :data-drop="p.id"
                :role="selected !== null ? 'button' : undefined"
                :tabindex="selected !== null ? 0 : undefined"
                :aria-label="t('app.adventure.buildSlot', { name: p.label })"
                @keydown.enter.space.prevent="tapPlace(p.id)"
              )
              img(v-else :src="src(p.image)" alt="" draggable="false" class="bd-placed" :style="boxStyle(p)")
            GameMark(v-if="flash" :kind="flash.kind" class="bd-mark" :style="{ left: `${flash.x}%`, top: `${flash.y}%` }")
        p(class="bd-fb" role="status") {{ message }}
        div(class="bd-tray")
          div(
            v-for="p in trayPieces"
            :key="p.id"
            class="bd-piece"
            :class="{ chosen: selected === p.id, wobble: wobble === p.id, lifted: dragging === p.id }"
            :style="dragStyle(p.id)"
            role="button"
            tabindex="0"
            :aria-label="t('app.adventure.buildPiece', { name: p.label })"
            @pointerdown="down($event, p.id)"
            @keydown.enter.space.prevent="toggleSelect(p.id)"
          )
            img(:src="src(p.image)" alt="" draggable="false")
      template(v-else)
        div(class="bd-wall-wrap")
          div(
            ref="wallEl"
            class="bd-wall"
            :class="{ tight: allFilled }"
            :style="{ backgroundImage: `url(${src(game.pitch?.wall ?? '')})` }"
            role="group"
            :aria-label="t('app.adventure.buildWall')"
            @pointerdown="onWallDown"
            @pointermove="onWallMove"
            @pointerup="onWallUp"
            @pointercancel="onWallUp"
          )
            svg(class="bd-svg" viewBox="0 0 900 1200" preserveAspectRatio="none" aria-hidden="true")
              template(v-if="game.pitch?.guide")
                polyline(v-for="(line, i) in seams" :key="`gv${i}`" class="bd-groove" :points="pts(line)")
                polyline(v-for="(line, i) in seams" :key="`gl${i}`" class="bd-groove-edge" :points="pts(line)")
              polyline(v-for="(line, i) in seams" v-show="help && !filled[i]" :key="`h${i}`" class="bd-help" :points="pts(line)")
              polyline(v-for="(line, i) in seams" v-show="filled[i]" :key="`f${i}`" class="bd-ink" :points="pts(line)")
              polyline(v-for="(line, i) in seams" v-show="filled[i]" :key="`fs${i}`" class="bd-shine" :points="pts(line)")
              polyline(v-for="(line, k) in strokes" :key="`s${k}`" class="bd-ink" :points="pts(line)")
              polyline(v-for="(line, k) in strokes" :key="`ss${k}`" class="bd-shine" :points="pts(line)")
            button(
              v-for="(_, i) in seams"
              :key="`b${i}`"
              type="button"
              class="bd-sr"
              :aria-label="t('app.adventure.buildSeamFill', { n: i + 1 })"
              :disabled="filled[i]"
              @click.stop="sealSeam(i)"
            )
            img(v-if="pot" :src="src(game.pitch?.pot ?? '')" alt="" draggable="false" class="bd-pot" :style="{ left: `${pot.x}%`, top: `${pot.y}%` }")
            GameMark(v-if="flash" :kind="flash.kind" class="bd-mark" :style="{ left: `${flash.x}%`, top: `${flash.y}%` }")
            p(v-if="allFilled" class="bd-tight" role="status") {{ t('app.adventure.buildTight') }}
        p(class="bd-fb" role="status") {{ allFilled ? '' : message }}
        p(class="bd-count") {{ t('app.adventure.buildSeamsLeft', { n: filledCount, total: seams.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.buildDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.bd
  display: flex
  flex-direction: column
  gap: 10px

.bd-round
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #8a6a1f

.bd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

// the plan is as wide as the screen (it breaks out of the padding of the card) and can be zoomed
.bd-stage
  margin-inline: -28px
  overflow-x: auto
  overflow-y: hidden
  -webkit-overflow-scrolling: touch
  padding: 0 4px

.bd-bar
  display: flex
  align-items: center
  justify-content: flex-end

.bd-zoom
  min-height: 44px
  padding: 0 16px
  border-radius: 999px
  border: 2px solid #d4a83e
  background: rgba(255, 246, 215, 0.9)
  color: #5f4f35
  font-weight: 800
  font-size: 1rem
  cursor: pointer

  &[aria-pressed='true']
    background: #fff3b0

.bd-board
  position: relative
  width: 100%
  border-radius: 14px
  background: rgba(255, 246, 215, 0.35)
  border: 3px dashed rgba(185, 138, 46, 0.65)
  touch-action: manipulation

  &.outline
    border-color: rgba(185, 138, 46, 0.4)

.bd-shadow
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.bd-zone
  position: absolute
  border-radius: 6px

  &.shown
    outline: 2px dashed rgba(255, 246, 215, 0.95)
    outline-offset: -2px

  &.ready
    background: rgba(255, 233, 150, 0.28)

  &.glow
    outline: 3px dashed #2fae54
    outline-offset: -3px
    animation: bd-glow 1200ms ease-in-out infinite

.bd-placed
  position: absolute
  display: block
  object-fit: fill
  pointer-events: none
  animation: bd-pop 380ms cubic-bezier(0.2, 1.5, 0.4, 1)

.bd-mark
  position: absolute
  transform: translate(-50%, -50%)
  z-index: 20

.bd-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #5f4f35

.bd-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 8px
  min-height: 96px

.bd-piece
  display: flex
  align-items: center
  justify-content: center
  min-width: 56px
  min-height: 48px
  max-width: 100%
  padding: 6px
  border-radius: 10px
  border: 2px solid transparent
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  transition: transform 160ms ease-out

  img
    display: block
    max-width: 100%
    max-height: 64px
    width: auto
    height: auto
    pointer-events: none
    filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.5))

  &.chosen
    transform: translateY(-4px) scale(1.06)
    border-color: #fff3b0
    background: rgba(255, 233, 150, 0.35)

  &.wobble
    animation: bd-shake 420ms ease-in-out

  &.lifted
    cursor: grabbing

.bd-wall-wrap
  width: 100%
  max-width: 340px
  margin: 0 auto

.bd-wall
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  background-size: cover
  background-position: center
  overflow: hidden
  // the finger smears the pitch: the wall must not scroll
  touch-action: none
  user-select: none
  -webkit-user-select: none
  cursor: crosshair
  box-shadow: 0 0 0 3px #5b3a17, 0 6px 14px -6px rgba(40, 25, 5, 0.6)

// the black pitch (an SVG over the wall: the line follows the finger) and the seams that are not in the picture yet
.bd-svg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.bd-ink
  fill: none
  stroke: #120a04
  stroke-width: 30
  stroke-linecap: round
  stroke-linejoin: round
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.6))

.bd-shine
  fill: none
  stroke: rgba(255, 255, 255, 0.28)
  stroke-width: 6
  stroke-linecap: round
  stroke-linejoin: round
  transform: translate(-5px, -7px)

.bd-groove
  fill: none
  stroke: #1d0f05
  stroke-width: 15
  stroke-linecap: round
  stroke-linejoin: round
  opacity: 0.9

.bd-groove-edge
  fill: none
  stroke: rgba(255, 205, 130, 0.4)
  stroke-width: 3
  stroke-linecap: round
  stroke-linejoin: round
  transform: translate(0, 9px)

// the help: a soft glow along a seam that is still open
.bd-help
  fill: none
  stroke: rgba(255, 243, 176, 0.9)
  stroke-width: 44
  stroke-linecap: round
  stroke-linejoin: round
  opacity: 0.5
  animation: bd-help 1100ms ease-in-out infinite

// the buttons for screen readers and the keyboard (fill a seam without swiping)
.bd-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  padding: 0
  overflow: hidden
  clip: rect(0 0 0 0)
  border: 0

  &:focus-visible
    clip: auto
    width: auto
    height: auto
    margin: 0
    padding: 8px 14px
    left: 8px
    top: 8px
    z-index: 30
    border-radius: 10px
    background: #fff3b0
    color: #3a2a10
    font-weight: 800

.bd-pot
  position: absolute
  width: 54px
  height: auto
  transform: translate(-28%, -88%)
  pointer-events: none
  z-index: 10

.bd-tight
  position: absolute
  left: 50%
  top: 50%
  margin: 0
  padding: 6px 22px
  transform: translate(-50%, -50%) rotate(-4deg)
  border-radius: 14px
  background: rgba(255, 243, 207, 0.95)
  border: 3px solid #2fae54
  color: #1f6b3a
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1.8rem
  pointer-events: none
  z-index: 15

.bd-count
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

@keyframes bd-pop
  from
    transform: scale(0.94)
    opacity: 0.4

@keyframes bd-glow
  0%, 100%
    background: rgba(47, 174, 84, 0.08)
  50%
    background: rgba(47, 174, 84, 0.35)

@keyframes bd-help
  0%, 100%
    opacity: 0.2
  50%
    opacity: 0.7

@keyframes bd-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .bd-zone.glow,
  .bd-help,
  .bd-placed,
  .bd-piece.wobble
    animation: none
</style>
