<script setup lang="ts">
/**
 * Wipe away the fog: soft evening fog lies over a picture of the city and its tower. The child wipes it away with a finger and the picture shows
 * underneath. In the first round the tower has to be freed (the upper middle), in the second round the city (the lower half). When the part is free
 * to 85 %, the rest of the fog drifts away by itself. Nothing can go wrong and nothing is lost, so there are no mistakes: the stars are all three at
 * the end. A "Help" button lets a soft shimmer show the part. The fog is a painted picture on a canvas that the finger wipes with a soft brush; how much
 * is free is counted on a coarse grid next to it (`utils/wipe.ts`). With the arrow keys a wiper can be moved.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { coverage, makeGrid, wipeLine } from '@/utils/wipe'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { WipeGame } from '@/types/adventure'

const props = defineProps<{ game: WipeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: 50 parts for every round (the share of the part that is free, in halves of a percent), see `credit`
const PER_ROUND = 50
progress.setGoal(props.game.rounds.length * PER_ROUND)

/** The part counts as free at this share; then the rest of the fog drifts away. */
const ENOUGH = 0.85
/** The brush: its radius is this share of the width of the picture. */
const BRUSH = 7
/** The drawing of the fog has this many pixels (it is scaled to the screen). */
const W = 480
const H = 320

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

let grid = makeGrid()
const share = ref(0)
const credited = ref(0)
const roundDone = ref(false)
const between = ref(false)
const finished = ref(false)
const helping = ref(false)
const message = ref('')
const stars = 3

const canvasEl = ref<HTMLCanvasElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
let fog: HTMLImageElement | null = null
const ctx = () => canvasEl.value?.getContext('2d') ?? null

/** Lays the fog over the picture again (at the start of a round). */
function layFog() {
  const c = ctx()
  if (!c) return
  c.globalCompositeOperation = 'source-over'
  c.clearRect(0, 0, W, H)
  if (fog && fog.complete && fog.naturalWidth > 0) c.drawImage(fog, 0, 0, W, H)
  else {
    // the fog picture is not there (no net): a soft warm veil takes its place
    c.fillStyle = 'rgba(255, 244, 214, 0.88)'
    c.fillRect(0, 0, W, H)
  }
}
onMounted(() => {
  fog = new Image()
  fog.onload = layFog
  fog.src = prependBaseUrl(props.game.mist)
  layFog()
})

/** Takes the fog away along a line of the finger: on the drawing (a soft round brush) and in the grid that is counted. */
function wipe(from: { x: number; y: number }, to: { x: number; y: number }) {
  if (between.value || finished.value || roundDone.value) return
  const c = ctx()
  if (c) {
    c.globalCompositeOperation = 'destination-out'
    const r = (BRUSH / 100) * W
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 2))
    for (let i = 0; i <= steps; i++) {
      const x = ((from.x + ((to.x - from.x) * i) / steps) / 100) * W
      const y = ((from.y + ((to.y - from.y) * i) / steps) / 100) * H
      const g = c.createRadialGradient(x, y, r * 0.3, x, y, r)
      g.addColorStop(0, 'rgba(0,0,0,1)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
    }
  }
  if (wipeLine(grid, from, to, BRUSH) > 0) update()
}

/** Counts the free part, gives the parts of the task, and ends the round when enough is free. */
function update() {
  share.value = coverage(grid, current.value.region)
  const target = Math.min(PER_ROUND, Math.floor((Math.min(1, share.value / ENOUGH) * PER_ROUND)))
  for (let i = credited.value; i < target; i++) progress.mark()
  credited.value = Math.max(credited.value, target)
  if (share.value >= ENOUGH) finishRound()
}

function finishRound() {
  roundDone.value = true
  message.value = t('app.adventure.wipeClear')
  // the rest of the fog drifts away by itself, soft tone
  play('star')
  for (let i = credited.value; i < PER_ROUND; i++) progress.mark()
  credited.value = PER_ROUND
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    between.value = true
    later(nextRound, 700)
  }, 1500)
}

function nextRound() {
  round.value++
  grid = makeGrid()
  share.value = 0
  credited.value = 0
  roundDone.value = false
  between.value = false
  helping.value = false
  message.value = ''
  layFog()
}

// ---- the finger and the arrow keys
let last: { x: number; y: number } | null = null
const pointOf = (e: PointerEvent) => {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / h) * 100 }
}
function down(e: PointerEvent) {
  if (e.button > 0) return
  last = pointOf(e)
  wipe(last, last)
}
function move(e: PointerEvent) {
  if (!last) return
  const p = pointOf(e)
  wipe(last, p)
  last = p
}
function up() {
  last = null
}
let wiper = { x: 50, y: 50 }
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }
  const step = d[e.key]
  if (!step) return
  e.preventDefault()
  const to = { x: Math.min(98, Math.max(2, wiper.x + step[0])), y: Math.min(98, Math.max(2, wiper.y + step[1])) }
  wipe(wiper, to)
  wiper = to
}
onBeforeUnmount(() => {
  last = null
})

/** "Help": a soft shimmer shows the part that has to be free. */
function help() {
  if (between.value || finished.value || roundDone.value) return
  helping.value = true
  later(() => (helping.value = false), 4000)
}

const src = (p: string) => prependBaseUrl(p)
const regionStyle = computed(() => {
  const r = current.value.region
  return { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
})
const percent = computed(() => Math.min(100, Math.round((share.value / ENOUGH) * 100)))
</script>

<template lang="pug">
  div(class="wp")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="wp-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="wp-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="fieldEl"
        class="wp-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.wipeField')"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @pointerleave="up"
        @keydown="onKey"
      )
        img(:src="src(game.background)" alt="" draggable="false" class="wp-bg")
        canvas(ref="canvasEl" class="wp-fog" :class="{ gone: roundDone }" :width="W" :height="H" aria-hidden="true")
        span(v-if="helping" class="wp-shimmer" :style="regionStyle" aria-hidden="true")
      p(class="wp-fb" role="status") {{ message }}
      p(class="wp-count") {{ t('app.adventure.wipeCount', { n: percent }) }}
      div(class="wp-actions")
        AdvButton(tone="blau" small :disabled="between || roundDone" @click="help") {{ t('app.adventure.wipeHelp') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wipeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wp
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e9dcc0
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.wp-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.wp-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.wp-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #cdb98e
  touch-action: none
  user-select: none
  -webkit-user-select: none
  cursor: crosshair

.wp-bg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none

.wp-fog
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none
  transition: opacity 1400ms ease-out

  // the rest of the fog drifts away
  &.gone
    opacity: 0

.wp-shimmer
  position: absolute
  border-radius: 12px
  border: 3px dashed rgba(255, 255, 255, 0.95)
  background: rgba(255, 244, 190, 0.22)
  box-shadow: 0 0 18px rgba(255, 230, 140, 0.8)
  pointer-events: none
  animation: wp-glow 1400ms ease-in-out infinite

.wp-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.wp-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

.wp-actions
  display: flex
  justify-content: center

@keyframes wp-glow
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .wp-fog
    transition: none

  .wp-shimmer
    animation: none
</style>
