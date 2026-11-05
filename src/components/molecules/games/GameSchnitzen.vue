<script setup lang="ts">
/**
 * "Carving" (1 Kings 6,18.29). Inside, the house is all cedar, carved with knots, open flowers and palm trees, and overlaid with gold. A cedar board shows an ornament as a golden line:
 * the child goes over the line with the finger (the carving iron follows it) and the gold dust shows what is done. Leaving the line too far is a slip (a mistake: a cross and "The iron slipped";
 * the finger must be set on the line again). When enough of the line is done, the next board comes. Round 2 has two harder boards and less room beside the line.
 * Keys: the arrow keys move the iron one cell, Enter (or Space) sets it on the wood or lifts it. The button "Help me" comes after fifteen seconds and shows where the line goes on.
 * The line is a grid of cells read from the painted board (`rows`); the arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { carveCells, carveNear, carveNext, carveShare, carveTrace } from '@/utils/salomoNeu'
import type { CarveGame, SalPt } from '@/utils/salomoNeu'

const props = defineProps<{ game: CarveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.patterns.length, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const board = ref(0)
const pattern = computed(() => props.game.patterns[current.value.patterns[Math.min(board.value, current.value.patterns.length - 1)]!]!)
const grid = computed(() => carveCells(pattern.value))
const done = ref(new Set<number>())
const share = computed(() => carveShare(pattern.value, done.value))
const tool = ref<SalPt | null>(null)
const carving = ref(false)
const slipMark = ref(false)
const boardDone = ref(false)
const helpAt = ref<SalPt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let slipSeq = 0
let last: SalPt | null = null
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function tickIdle() {
  if (!finished.value && !between.value && !carving.value) idle.value += 0.25
  later(tickIdle, 250)
}
later(tickIdle, 250)

/** A point of the pointer in cells of the grid. */
function cellOf(e: PointerEvent): SalPt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  const size = grid.value.size
  return { x: ((e.clientX - r.left) / r.width) * size, y: ((e.clientY - r.top) / r.height) * size }
}

function begin(p: SalPt) {
  if (between.value || boardDone.value) return
  idle.value = 0
  helpAt.value = null
  tool.value = p
  if (carveNear(pattern.value, p.x, p.y) > current.value.slip) {
    carving.value = false
    say(t('app.adventure.carvingOnLine'), 2200)
    return
  }
  carving.value = true
  last = p
  add(p, p)
}
function moveTo(p: SalPt) {
  tool.value = p
  if (!carving.value || !last) return
  idle.value = 0
  if (carveNear(pattern.value, p.x, p.y) > current.value.slip) {
    carving.value = false
    last = null
    mistakes.value++
    play('wrong')
    say(t('app.adventure.carvingSlip'), 2600)
    const id = ++slipSeq
    slipMark.value = true
    later(() => {
      if (slipSeq === id) slipMark.value = false
    }, 1100)
    return
  }
  add(last, p)
  last = p
}
function add(a: SalPt, b: SalPt) {
  const got = carveTrace(pattern.value, a, b, props.game.brush)
  if (!got.some((c) => !done.value.has(c))) return
  done.value = new Set([...done.value, ...got])
  if (share.value >= current.value.need) finishBoard()
}
function end() {
  carving.value = false
  last = null
}

function onDown(e: PointerEvent) {
  if (e.button > 0) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  ;(e.target as Element | null)?.setPointerCapture?.(e.pointerId)
  const p = cellOf(e)
  if (p) begin(p)
}
function onMove(e: PointerEvent) {
  const p = cellOf(e)
  if (p && (carving.value || e.pointerType === 'mouse')) moveTo(p)
}

function onKey(e: KeyboardEvent) {
  if (between.value || boardDone.value) return
  const size = grid.value.size
  if (!tool.value) tool.value = carveNext(pattern.value, done.value) ?? { x: size / 2, y: size / 2 }
  const p = tool.value
  const step: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (carving.value) end()
    else begin(p)
    return
  }
  const d = step[e.key]
  if (!d) return
  e.preventDefault()
  const q = { x: Math.min(size - 0.5, Math.max(0.5, p.x + d[0])), y: Math.min(size - 0.5, Math.max(0.5, p.y + d[1])) }
  if (carving.value) moveTo(q)
  else tool.value = q
}

function finishBoard() {
  boardDone.value = true
  carving.value = false
  last = null
  // the rest of the line is done too: the whole ornament shines
  done.value = new Set(grid.value.cells)
  progress.mark()
  play('right')
  later(() => play('bead'), 160)
  const more = board.value < current.value.patterns.length - 1
  say(t('app.adventure.carvingBoardDone', { thing: pattern.value.label }), 0)
  if (more) {
    later(() => {
      board.value++
      done.value = new Set()
      boardDone.value = false
      tool.value = null
      idle.value = 0
      message.value = ''
    }, 2200)
    return
  }
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    board.value = 0
    done.value = new Set()
    boardDone.value = false
    tool.value = null
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function helpMe() {
  idle.value = 0
  helpAt.value = carveNext(pattern.value, done.value, tool.value ?? undefined)
  if (helpAt.value) tool.value = helpAt.value
  say(t('app.adventure.carvingHelping'), 3200)
}

// ---- looks: gold dust on every block of 2 x 2 cells that has a done cell
const dust = computed(() => {
  const size = grid.value.size
  const blocks = new Map<number, SalPt>()
  for (const c of done.value) {
    const bx = Math.floor((c % size) / 2)
    const by = Math.floor(Math.floor(c / size) / 2)
    blocks.set(by * size + bx, { x: ((bx * 2 + 1) / size) * 100, y: ((by * 2 + 1) / size) * 100 })
  }
  return [...blocks.entries()]
})
const dustW = computed(() => (2.8 / grid.value.size) * 100)
const toolStyle = computed(() => {
  const p = tool.value
  if (!p) return { display: 'none' }
  const size = grid.value.size
  return { left: `${(p.x / size) * 100}%`, top: `${(p.y / size) * 100}%`, width: `${props.game.tool.w}%` }
})
const percent = computed(() => Math.round(share.value * 100))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :class="{ carving }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.carvingField', { thing: pattern.label })"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="end"
        @pointercancel="end"
        @keydown="onKey"
        @contextmenu.prevent
      )
        GameImage(class="gm-board" :src="pattern.image" :ratio="1" colour="#9a4a24" :label="pattern.label")
        span(v-for="[k, d] in dust" :key="k" class="gm-dust" :style="{ left: `${d.x}%`, top: `${d.y}%`, width: `${dustW}%` }" aria-hidden="true")
          GameImage(:src="game.dust" :ratio="1" colour="#f2c94c")
        span(class="gm-tool" :class="{ helped: !!helpAt }" :style="toolStyle" aria-hidden="true")
          GameImage(:src="game.tool.image" :ratio="1" colour="#8a6a4a")
        span(v-if="slipMark && tool" class="gm-mark" :style="{ left: `${(tool.x / grid.size) * 100}%`, top: `${(tool.y / grid.size) * 100}%` }")
          GameMark(kind="bad")
        span(v-if="boardDone" class="gm-mark gm-mid")
          GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.carvingCount', { n: board + 1, total: current.patterns.length, p: percent }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !boardDone" tone="gold" @click="helpMe") {{ t('app.adventure.carvingHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.carvingDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  align-self: center
  width: min(100%, 62vh)
  aspect-ratio: 1
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #9a4a24
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-board
  position: absolute
  inset: 0

.gm-dust, .gm-tool, .gm-mark
  position: absolute
  display: block
  pointer-events: none

.gm-dust
  transform: translate(-50%, -50%)
  filter: drop-shadow(0 0 3px rgba(255, 220, 120, 0.8))

// the tip of the iron is its lower left corner
.gm-tool
  transform: translate(-2%, -83%)
  z-index: 5
  filter: drop-shadow(0 3px 3px rgba(40, 20, 5, 0.45))

  &.helped
    animation: gm-pulse 900ms ease-in-out infinite

.gm-mark
  margin: -15px 0 0 -15px
  z-index: 6

.gm-mid
  left: 50%
  top: 50%

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-pulse
  0%, 100%
    scale: 1
  50%
    scale: 1.15

@media (prefers-reduced-motion: reduce)
  .gm-tool.helped
    animation: none
</style>
