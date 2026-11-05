<script setup lang="ts">
/**
 * "Along the shore" (Mark 6,30-34). Jesus and the disciples sail to a quiet place; the people see them go and run along the shore. The shore is seen from high above: the lake at the top,
 * the crowd at the left by the village, the landing place at the right. The child draws with the finger a way for the crowd, starting at the crowd: the line grows behind the finger.
 * Where the finger runs into a rock or into the water the line stops (a mistake: a cross and words) until the finger goes round. A lifted finger goes on at the end of the line; "Draw again"
 * starts anew. At the landing place the crowd walks the drawn way while the boat sails there (a tick): "They are there before the boat." Round 2 has a bay and more rocks.
 * The arrow keys draw too (a short piece in that direction, Enter a longer one). The button "Help me" comes after fifteen seconds and draws a piece of a safe way.
 * With reduced motion the crowd and the boat do not glide, they are simply there. The arithmetic is `utils/wunderNeu.ts`; stars: `osterStars(mistakes)`.
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
import { UFER_GOAL_R, UFER_START_R, uferAlong, uferBegin, uferHelpRoute, uferLength, uferMove, uferShare, uferStart } from '@/utils/wunderNeu'
import type { Pt, UferEvent, UferGame, UferRock, UferState } from '@/utils/wunderNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: UferGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every way counts in three parts: a third, two thirds, the landing place. */
const PARTS = 3
progress.setGoal(props.game.rounds.length * PARTS)

const TICK = 0.05
const IDLE_SECONDS = 15
/** How fast the crowd walks the drawn way (units a second) and how many points of the help are drawn each tick. */
const WALK_SPEED = 45
const HELP_PER_TICK = 2
/** A key draws this far (units); Enter goes on farther in the last direction. */
const KEY_STEP = 3
const ENTER_STEP = 8

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<UferState>(uferStart())
const guide = ref<Pt[]>([])
const walked = ref<number | null>(null)
const mistakes = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const mark = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let markSeq = 0
let lastDir: [number, number] = [1, 0]
const stars = computed(() => osterStars(mistakes.value))
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function showMark(p: Pt, kind: 'good' | 'bad', ms = 1300) {
  const id = ++markSeq
  mark.value = { ...p, kind }
  if (ms > 0)
    later(() => {
      if (markSeq === id) mark.value = null
    }, ms)
}

/** The parts of the way reached so far count for "Go on" (once each). */
function credit(n: number) {
  const due = Math.min(PARTS, n)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function apply(res: { state: UferState; event: UferEvent }) {
  st.value = res.state
  const ev = res.event
  if (ev && ev.kind !== 'goal') {
    mistakes.value++
    play('wrong')
    showMark(ev.at, 'bad')
    say(t(ev.kind === 'rock' ? 'app.adventure.bankPathRock' : 'app.adventure.bankPathWater'), 2800)
    guide.value = []
  }
  if (st.value.reached) arrive()
  else credit(Math.min(PARTS - 1, Math.floor(uferShare(current.value, st.value, ratio.value) * PARTS + 1e-9)))
}

function arrive() {
  credit(PARTS)
  between.value = true
  guide.value = []
  stopDrag()
  play('right')
  walked.value = reduced() ? uferLength(st.value.pts, ratio.value) : 0
}

function arrived() {
  walked.value = null
  play('bead')
  showMark(current.value.goal, 'good', 0)
  say(t('app.adventure.bankPathArrived'), 0)
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
    st.value = uferStart()
    credited.value = 0
    guide.value = []
    mark.value = null
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

let walkDone = false
function loop() {
  if (!finished.value) {
    if (between.value && walked.value !== null) {
      const total = uferLength(st.value.pts, ratio.value)
      walked.value = Math.min(total, walked.value + WALK_SPEED * TICK)
      if (walked.value >= total && !walkDone) {
        walkDone = true
        later(() => {
          walkDone = false
          arrived()
        }, 250)
      }
    } else if (!between.value) {
      for (let i = 0; i < HELP_PER_TICK && guide.value.length && !between.value; i++) {
        const [p, ...rest] = guide.value
        guide.value = rest
        apply(uferMove(props.game, current.value, st.value, p!))
      }
      if (!guide.value.length && !dragging) idle.value += TICK
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger draws
let dragging = false
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) }
}
function onMove(e: PointerEvent) {
  if (!dragging || between.value) return
  const p = pointAt(e)
  if (!p) return
  idle.value = 0
  apply(uferMove(props.game, current.value, st.value, p))
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  guide.value = []
  const b = uferBegin(current.value, st.value, p, ratio.value)
  if (b.verdict === 'far') {
    say(t(st.value.pts.length ? 'app.adventure.bankPathContinue' : 'app.adventure.bankPathStart'), 2800)
    return
  }
  if (b.verdict === 'done') return
  st.value = b.state
  dragging = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
  apply(uferMove(props.game, current.value, st.value, p))
}
onBeforeUnmount(() => stopDrag())

function ensureStarted() {
  if (!st.value.pts.length) st.value = uferBegin(current.value, st.value, current.value.start, ratio.value).state
}
function onKey(e: KeyboardEvent) {
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (!a && e.key !== 'Enter') return
  e.preventDefault()
  if (finished.value || between.value) return
  idle.value = 0
  guide.value = []
  ensureStarted()
  const dir = a ?? lastDir
  lastDir = dir
  const step = a ? KEY_STEP : ENTER_STEP
  const last = st.value.pts[st.value.pts.length - 1]!
  st.value = { ...st.value, blocked: false }
  apply(uferMove(props.game, current.value, st.value, { x: last.x + dir[0] * step, y: last.y + dir[1] * step * ratio.value }))
}

function clear() {
  if (between.value) return
  st.value = uferStart()
  guide.value = [] // the parts once reached stay counted
  idle.value = 0
  say(t('app.adventure.bankPathStart'), 2800)
}

function helpMe() {
  idle.value = 0
  ensureStarted()
  const route = uferHelpRoute(props.game, current.value, st.value)
  if (!route || !route.length) return
  st.value = { ...st.value, blocked: false }
  guide.value = route
  say(t('app.adventure.bankPathHelping'), 3600)
}

// ---- looks
const g = computed(() => props.game)
const z = (y: number) => Math.round(y * 10) + 10
const rockStyle = (k: UferRock) => ({ left: `${k.x}%`, top: `${k.y}%`, width: `${k.w}%`, zIndex: z(k.y) })
const line = computed(() => st.value.pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '))
const crowdAt = computed(() => {
  if (walked.value !== null || (between.value && st.value.reached)) return uferAlong(st.value.pts, walked.value ?? uferLength(st.value.pts, ratio.value), ratio.value)
  return { ...current.value.start, left: false }
})
const crowdStyle = computed(() => ({ left: `${crowdAt.value.x}%`, top: `${crowdAt.value.y}%`, width: `${g.value.crowd.w}%`, zIndex: z(crowdAt.value.y) + 2 }))
const boatShare = computed(() => {
  if (!between.value) return 0
  const total = uferLength(st.value.pts, ratio.value)
  return walked.value === null ? 1 : total > 0 ? walked.value / total : 1
})
const boatStyle = computed(() => {
  const r = current.value
  const f = boatShare.value
  return { left: `${r.boatFrom.x + (r.boatTo.x - r.boatFrom.x) * f}%`, top: `${r.boatFrom.y + (r.boatTo.y - r.boatFrom.y) * f}%`, width: `${g.value.boat.w}%`, zIndex: 5 }
})
const ringStyle = (p: Pt, r: number) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${r * 2}%`, height: `${r * 2 * ratio.value}%` })
const markStyle = computed(() => ({ left: `${mark.value?.x ?? 0}%`, top: `${mark.value?.y ?? 0}%` }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(current.background)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.bankPathField')"
        @pointerdown="down"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(class="gm-boat" :style="boatStyle" role="img" :aria-label="game.boat.label")
          GameImage(:src="game.boat.image" :ratio="1" colour="#8a6a4a" :label="game.boat.label")
        div(class="gm-ring gm-goal" :style="ringStyle(current.goal, UFER_GOAL_R)" role="img" :aria-label="t('app.adventure.bankPathGoal')")
        div(v-if="!st.pts.length" class="gm-ring gm-start" :style="ringStyle(current.start, UFER_START_R)" aria-hidden="true")
        div(v-for="(k, i) in current.rocks" :key="`r-${round}-${i}`" class="gm-rock" :style="rockStyle(k)" role="img" :aria-label="game.rocks[k.rock]?.label")
          GameImage(:src="game.rocks[k.rock]?.image ?? ''" :ratio="1" colour="#8d8579" :label="game.rocks[k.rock]?.label")
        svg(class="gm-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true")
          polyline(v-if="st.pts.length > 1" class="gm-line-under" :points="line")
          polyline(v-if="st.pts.length > 1" class="gm-line-over" :class="{ blocked: st.blocked }" :points="line")
        div(class="gm-crowd" :class="{ walking: walked !== null }" :style="crowdStyle" role="img" :aria-label="game.crowd.label")
          span(class="gm-flip" :style="{ transform: crowdAt.left ? 'scaleX(-1)' : undefined }")
            GameImage(:src="game.crowd.image" :ratio="1" colour="#7d6a52" :label="game.crowd.label")
        span(v-if="mark" class="gm-mark" :style="markStyle")
          GameMark(:kind="mark.kind")
      div(class="gm-row")
        button(type="button" class="gm-clear" :disabled="between || !st.pts.length" @click="clear") {{ t('app.adventure.bankPathClear') }}
        p(class="gm-count" aria-live="polite") {{ t('app.adventure.bankPathCount', { n: credited, total: PARTS }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !guide.length" tone="gold" @click="helpMe") {{ t('app.adventure.bankPathHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.bankPathDone')" @next="emit('done', stars)")
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
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fae9a
  background-size: 100% 100%
  touch-action: none
  cursor: crosshair
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-rock, .gm-crowd, .gm-boat
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 30, 10, 0.4))

.gm-crowd
  // the feet of the group stand on the line
  transform: translate(-50%, -78%)

.gm-crowd, .gm-boat
  transition: left 50ms linear, top 50ms linear

.gm-flip
  display: block

.gm-crowd.walking .gm-flip
  animation: gm-step 380ms ease-in-out infinite

// the drawn way: a line of the screen (the child draws it), not part of the painted picture
.gm-line
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none
  z-index: 2000

  polyline
    fill: none
    stroke-linecap: round
    stroke-linejoin: round
    vector-effect: non-scaling-stroke

.gm-line-under
  stroke: rgba(74, 52, 24, 0.85)
  stroke-width: 10px

.gm-line-over
  stroke: #fff3d2
  stroke-width: 5px

  &.blocked
    stroke: #f2c9a0

.gm-ring
  position: absolute
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(255, 246, 220, 0.16)
  pointer-events: none
  z-index: 1500

.gm-start
  animation: gm-pulse 1100ms ease-in-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3001

.gm-row
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 10px

.gm-clear
  min-width: 150px
  min-height: 48px
  padding: 6px 18px
  border-radius: 999px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1rem
  color: #4a3a18
  cursor: pointer

  &:disabled
    opacity: 0.5
    cursor: default

.gm-count
  margin: 0
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

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -5%

@keyframes gm-pulse
  0%, 100%
    scale: 1
  50%
    scale: 1.1

// less motion: nothing glides, bobs or pulses
@media (prefers-reduced-motion: reduce)
  .gm-crowd.walking .gm-flip, .gm-start
    animation: none

  .gm-crowd, .gm-boat
    transition: none
</style>
