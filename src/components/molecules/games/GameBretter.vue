<script setup lang="ts">
/**
 * Boards to the shore (Acts 27,44: "some on boards, some on pieces of the ship ... they all came safe to land"). The bay in the morning seen from above: the ship on the sandbank below,
 * a flat beach above, rocks on both sides, bright streaks of foam in the water that run from the ship towards the beach or towards the rocks. At the rail of the ship waits a board with a
 * person on it. The child slides it along the rail (finger, or the arrow keys) and lets go. The nearest painted current takes it and carries it slowly (about three seconds). Towards the
 * beach: the person gets up on the sand, a tick, a bright tone. Towards the rocks: a gentle eddy turns the board round and the water carries it back to the ship, a cross and "It drifts to the
 * rocks. Try another place", a mistake; nobody is hurt, nobody sinks. Round 1: four boards, three currents; round 2: six boards, five currents. At the end a picture of everyone on the beach.
 * "Help me" after fifteen seconds lets the place of a good current glow. Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { planksPathAt } from '@/utils/paulusromNeuA'
import type { PlankItem, PlanksGame, PrPt } from '@/utils/paulusromNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PlanksGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.boards.length, 0))

const IDLE_SECONDS = 15
const KEY_STEP = 4
const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** How long the board needs for one piece of its track (milliseconds). */
const SEG_MS = reduced ? 150 : 900

const round = ref(0)
const idx = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 0.75)
const board = computed<PlankItem | null>(() => {
  const id = current.value.boards[idx.value]
  return id ? props.game.items.find((i) => i.id === id) ?? null : null
})
const railX = ref((props.game.rail.from + props.game.rail.to) / 2)
const dragging = ref(false)
/** The place of the board while it drifts (percent of the bay), or null while it waits at the rail. */
const drift = ref<PrPt | null>(null)
const spin = ref(false)
const ashore = ref<{ item: PlankItem; at: PrPt }[]>([])
const helpPath = ref<number | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const finale = ref(false)
const crossAt = ref<PrPt | null>(null)
const tickAt = ref<PrPt | null>(null)
const message = ref('')
const landed = ref(0)
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const busy = computed(() => drift.value !== null || between.value || finished.value)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: PrPt) {
  const id = ++markSeq
  tickAt.value = kind === 'good' ? at : null
  crossAt.value = kind === 'bad' ? at : null
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}
function idleLoop() {
  if (!busy.value && !dragging.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The board is let go at the place `railX`: the nearest current takes it. */
function release() {
  if (busy.value || !board.value) return
  idle.value = 0
  helpPath.value = null
  const k = planksPathAt(props.game, current.value, railX.value)
  const path = props.game.paths[k]!
  const item = board.value
  say(t('app.adventure.planksDrift'), 0)
  drift.value = { ...path.points[0]! }
  path.points.slice(1).forEach((p, j) => later(() => (drift.value = { ...p }), (j + 1) * SEG_MS))
  const total = (path.points.length - 1) * SEG_MS
  later(() => arrive(path.ends, path.points[path.points.length - 1]!, item), total + 150)
}

function arrive(ends: 'shore' | 'rocks', at: PrPt, item: PlankItem) {
  if (ends === 'shore') {
    // several people that land at the end of the same current stand next to each other on the beach
    const k = ashore.value.filter((a) => Math.abs(a.at.x - at.x) < 14).length
    ashore.value.push({ item, at: { x: at.x + [0, 9, -9, 18][k % 4]!, y: at.y + (k % 2) * 3 } })
    landed.value++
    drift.value = null
    progress.mark()
    play('found')
    flash('good', at)
    say(t('app.adventure.planksShore'), 2000)
    idx.value++
    if (idx.value >= current.value.boards.length) later(endRound, 700)
    return
  }
  mistakes.value++
  play('wrong')
  spin.value = true
  flash('bad', at)
  say(t('app.adventure.planksRocks'))
  later(() => {
    spin.value = false
    drift.value = { x: railX.value, y: props.game.rail.y }
    later(() => (drift.value = null), reduced ? 100 : 1000)
  }, 700)
}

function endRound() {
  between.value = true
  later(() => play('right'), 300)
  if (lastRound.value) {
    finale.value = true
    say(t('app.adventure.planksAll'), 0)
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  say(t('app.adventure.planksRoundDone'), 0)
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    idx.value = 0
    ashore.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger
function setRail(e: { clientX: number }) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return
  const x = ((e.clientX - r.left) / r.width) * 100
  railX.value = Math.max(props.game.rail.from, Math.min(props.game.rail.to, x))
}
function onMove(e: PointerEvent) {
  if (dragging.value) setRail(e)
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  if (!dragging.value) return
  dragging.value = false
  if (e && e.type === 'pointerup') {
    setRail(e)
    release()
  }
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value) return
  idle.value = 0
  helpPath.value = null
  dragging.value = true
  setRail(e)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (busy.value) return
  const k = e.key
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    helpPath.value = null
    railX.value = Math.max(props.game.rail.from, Math.min(props.game.rail.to, railX.value + (k === 'ArrowRight' ? KEY_STEP : -KEY_STEP)))
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    release()
  }
}

/** "Help me": the beginning of a good current glows on the rail. */
function helpMe() {
  idle.value = 0
  const good = current.value.paths.filter((k) => props.game.paths[k]!.ends === 'shore')
  // the good current that lies nearest to the board
  helpPath.value = good.reduce((best, k) => (Math.abs(props.game.paths[k]!.start - railX.value) < Math.abs(props.game.paths[best]!.start - railX.value) ? k : best), good[0]!)
  say(t('app.adventure.planksHelpSay'), 4000)
}

// ---- looks
const railStyle = computed(() => ({ left: `${props.game.rail.from}%`, width: `${props.game.rail.to - props.game.rail.from}%`, top: `${props.game.rail.y}%` }))
const boardPos = computed<PrPt>(() => drift.value ?? { x: railX.value, y: props.game.rail.y })
const boardStyle = computed(() => ({ left: `${boardPos.value.x}%`, top: `${boardPos.value.y}%`, width: `${props.game.boardW}%`, transitionDuration: `${drift.value ? SEG_MS : 0}ms` }))
const ashoreStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.ashoreW}%` })
const helpStyle = computed(() => (helpPath.value === null ? {} : { left: `${props.game.paths[helpPath.value]!.start}%`, top: `${props.game.rail.y}%`, width: `${props.game.boardW * 1.3}%` }))
const markStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!finale"
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.bay)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.planksField')"
        :aria-description="t('app.adventure.planksKeys')"
        @keydown="onKey"
      )
        span(v-for="(a, ai) in ashore" :key="`ashore-${round}-${ai}`" class="gm-ashore" data-ashore :style="ashoreStyle(a.at)" role="img" :aria-label="a.item.name")
          GameImage(:src="a.item.ashore" :ratio="0.615" colour="#c9b48a" :label="a.item.ashore")
        div(
          class="gm-rail"
          data-rail
          role="slider"
          :style="railStyle"
          :aria-label="t('app.adventure.planksRail')"
          :aria-valuemin="game.rail.from"
          :aria-valuemax="game.rail.to"
          :aria-valuenow="Math.round(railX)"
          @pointerdown.prevent="down($event)"
        )
        span(v-if="helpPath !== null" class="gm-help" data-help :style="helpStyle" aria-hidden="true")
        span(
          v-if="board"
          class="gm-board"
          :class="{ spin, held: dragging, drifting: drift !== null }"
          data-board
          :data-item="board.id"
          :style="boardStyle"
          role="img"
          :aria-label="t('app.adventure.planksBoard', { name: board.name })"
        )
          GameImage(:src="board.image" :ratio="1.625" colour="#a07a45" :label="board.id")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(v-else class="gm-finale" role="img" :aria-label="t('app.adventure.planksAll')" data-finale)
        GameImage(:src="game.finale" :ratio="1.5" colour="#c9b48a" label="alle-an-land")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.planksCount', { n: landed }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.planksHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.planksDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round, .gm-count
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

.gm-round
  letter-spacing: 0.06em
  text-transform: uppercase

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  max-width: 420px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6aa5b8
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-finale
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e

// the rail of the ship: an invisible strip of at least 44 pixels where the board is slid
.gm-rail
  position: absolute
  min-height: 44px
  height: 8%
  transform: translateY(-50%)
  border-radius: 12px
  border: 2px dashed rgba(255, 246, 220, 0.7)
  background: rgba(255, 246, 220, 0.08)
  cursor: ew-resize
  touch-action: none
  z-index: 2

.gm-board
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 3px 4px rgba(20, 30, 40, 0.5))
  transition-property: left, top
  transition-timing-function: linear
  animation: gm-bob 1800ms ease-in-out infinite

  &.drifting
    animation: gm-bob 1200ms ease-in-out infinite

  &.spin
    animation: gm-spin 700ms ease-in-out

.gm-ashore
  position: absolute
  display: block
  transform: translate(-50%, -85%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

.gm-help
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px solid #fff6dc
  background: rgba(255, 246, 220, 0.35)
  box-shadow: 0 0 16px 5px rgba(255, 233, 160, 0.9)
  pointer-events: none
  z-index: 3
  animation: gm-glow 1400ms ease-in-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

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

@keyframes gm-bob
  0%, 100%
    margin-top: 0
  50%
    margin-top: -3px

@keyframes gm-spin
  0%
    rotate: 0deg
  100%
    rotate: 360deg

@keyframes gm-glow
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-board, .gm-board.drifting, .gm-board.spin, .gm-help
    animation: none
</style>
