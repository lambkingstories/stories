<script setup lang="ts">
/**
 * Light over Galilee (Matthew 4,16: "The people which sat in darkness saw great light"). The Sea of Galilee before sunrise, villages on its shore, still in the dark; low on the left
 * stands the sun, and golden beads mark its arc over the sky. The child takes the sun with the finger and pulls it up along the arc: every village gets light while the sun stands on its
 * part of the arc (it shines and has a glow over it; the count says how many have light). When there is light over every village at the same time and the finger holds the sun there
 * for a moment (or lets go there), the round is won (a tick). Letting go too early is a mistake: a cross, "Not yet light everywhere", and the sun sinks back. Round 1: four villages,
 * a wide part of the arc; round 2: six villages, a narrow part. The arrow keys move the sun, Enter lets go. "Help me" after fifteen seconds lifts the sun to the right place.
 * With reduced motion the sun does not glide. Nothing is shown by colour alone (tick, cross, words, the count). The arithmetic is `utils/taufeNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterDist, osterStars } from '@/utils/osternGames'
import { SUNRISE_RATIO, sunAllLit, sunAt, sunBeads, sunFromPoint, sunHelp, sunLit } from '@/utils/taufeNeu'
import type { Pt, SunGame } from '@/utils/taufeNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SunGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.villages.length, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const KEY_STEP = 0.02
/** How fast the sun sinks back after letting go too early (parts of the arc a second). */
const SINK = 0.35
/** How far the sun must have moved in one drag before letting go counts. */
const MOVE_MIN = 0.03
const BEADS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const p = ref(props.game.rounds[0]!.start)
const dragging = ref(false)
const sinking = ref(false)
const gliding = ref(false)
const hold = ref(0)
const ever = ref<boolean[]>(props.game.rounds[0]!.villages.map(() => false))
const markOn = ref<'good' | 'bad' | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))
const lit = computed(() => sunLit(current.value, p.value))
const litCount = computed(() => lit.value.filter(Boolean).length)
const busy = computed(() => between.value || finished.value || gliding.value)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad') {
  const id = ++markSeq
  markOn.value = kind
  later(() => {
    if (markSeq === id) markOn.value = null
  }, 1100)
}

/** Every village that gets light for the first time in a round counts one part for "Go on". */
function creditLight() {
  lit.value.forEach((on, i) => {
    if (on && !ever.value[i]) {
      ever.value[i] = true
      progress.mark()
    }
  })
}

function win(helped = false) {
  between.value = true
  dragging.value = false
  sinking.value = false
  creditLight()
  flash('good')
  later(() => play('right'), 200)
  say(t(helped ? 'app.adventure.sunriseHelped' : 'app.adventure.sunriseAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    p.value = current.value.start
    ever.value = current.value.villages.map(() => false)
    hold.value = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** Letting go (or Enter): light over all villages wins; otherwise, after a real pull, a mistake and the sun sinks back. */
function letGo(movedEnough: boolean) {
  if (busy.value) return
  if (sunAllLit(current.value, p.value)) {
    win()
    return
  }
  if (!movedEnough) return
  mistakes.value++
  play('wrong')
  flash('bad')
  say(t('app.adventure.sunriseNotYet', { n: litCount.value, total: current.value.villages.length }), 3000)
  sinking.value = true
}

function loop() {
  if (!busy.value) {
    if (sinking.value) {
      p.value = Math.max(current.value.start, p.value - SINK * TICK)
      if (p.value <= current.value.start + 1e-9) sinking.value = false
    }
    creditLight()
    if (dragging.value && sunAllLit(current.value, p.value)) {
      hold.value += TICK
      if (hold.value >= props.game.hold - 1e-9) win()
    } else hold.value = 0
    if (!dragging.value) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger pulls the sun along its arc
let startP = 0
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!dragging.value) return
  const pt = pointAt(e)
  if (pt) p.value = sunFromPoint(props.game, pt)
  idle.value = 0
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  if (!dragging.value) return
  dragging.value = false
  if (!e || e.type !== 'pointerup') return
  const pt = pointAt(e)
  if (pt) p.value = sunFromPoint(props.game, pt)
  letGo(Math.abs(p.value - startP) >= MOVE_MIN)
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value) return
  const pt = pointAt(e)
  if (!pt) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  // the finger must take the sun (a tap somewhere else only says how)
  if (osterDist(pt, sunAt(props.game, p.value), SUNRISE_RATIO) > Math.max(props.game.sunW, 10)) {
    say(t('app.adventure.sunriseTake'))
    return
  }
  sinking.value = false
  startP = p.value
  dragging.value = true
  hold.value = 0
  p.value = sunFromPoint(props.game, pt)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

let keyStart = -1
function onKey(e: KeyboardEvent) {
  if (busy.value) return
  const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
  if (d) {
    e.preventDefault()
    idle.value = 0
    sinking.value = false
    if (keyStart < 0) keyStart = p.value
    p.value = Math.min(1, Math.max(0, p.value + d * KEY_STEP))
    say(t('app.adventure.sunriseCount', { n: litCount.value, total: current.value.villages.length }), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const moved = keyStart >= 0 && Math.abs(p.value - keyStart) >= MOVE_MIN
    keyStart = -1
    letGo(moved)
  }
}

/** "Help me": the sun rises to the middle of the part of the arc with light over every village (no mistake). */
function helpMe() {
  if (busy.value) return
  idle.value = 0
  sinking.value = false
  const to = sunHelp(current.value)
  if (still) {
    p.value = to
    win(true)
    return
  }
  gliding.value = true
  p.value = to
  later(() => {
    gliding.value = false
    win(true)
  }, 700)
}

// ---- looks
const sun = computed(() => sunAt(props.game, p.value))
const sunStyle = computed(() => ({ left: `${sun.value.x}%`, top: `${sun.value.y}%`, width: `${props.game.sunW}%` }))
const beads = computed(() => sunBeads(props.game, BEADS))
const beadStyle = (b: Pt) => ({ left: `${b.x}%`, top: `${b.y}%` })
/** The night over the lake: dark while no village has light, gone when all have it. */
const night = computed(() => 0.55 * (1 - litCount.value / Math.max(1, current.value.villages.length)))
const villageStyle = (i: number) => {
  const v = current.value.villages[i]!
  return { left: `${v.x}%`, top: `${v.y}%`, width: `${v.w}%`, zIndex: Math.round(v.y * 10) }
}
const villageLabel = (i: number) => t(lit.value[i] ? 'app.adventure.sunriseVillageLit' : 'app.adventure.sunriseVillageDark', { name: current.value.villages[i]!.name })
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(SUNRISE_RATIO) }"
        role="slider"
        tabindex="0"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(p * 100)"
        :aria-valuetext="t('app.adventure.sunriseCount', { n: litCount, total: current.villages.length })"
        :aria-label="t('app.adventure.sunriseField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-night" :style="{ opacity: night }" aria-hidden="true")
        span(v-for="(b, i) in beads" :key="`b-${i}`" class="gm-bead" :style="beadStyle(b)" aria-hidden="true")
          GameImage(:src="game.bead" :ratio="1" colour="#f3e6c4" round label="perle")
        div(
          v-for="(v, i) in current.villages"
          :key="`v-${round}-${i}`"
          class="gm-village"
          :class="{ lit: lit[i] }"
          :data-village="i"
          :style="villageStyle(i)"
          role="img"
          :aria-label="villageLabel(i)"
        )
          span(v-if="lit[i]" class="gm-glow" aria-hidden="true")
            img(:src="prependBaseUrl(game.glow)" alt="" draggable="false")
          GameImage(:src="v.image" :ratio="1" colour="#c9a76a" :label="v.name")
          span(v-if="lit[i]" class="gm-lit" aria-hidden="true") ✓
        div(class="gm-sun" :class="{ glide: gliding, held: dragging }" :style="sunStyle" aria-hidden="true")
          GameImage(:src="game.sun" :ratio="1" colour="#f6c445" round label="sonne")
          span(v-if="markOn" class="gm-mark")
            GameMark(:kind="markOn")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.sunriseCount', { n: litCount, total: current.villages.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.sunriseHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sunriseDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcc0
  box-shadow: inset 0 0 18px rgba(60, 50, 80, 0.25)
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
  color: #6a4a22

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #4a3a5a

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a8fa8
  background-size: cover
  background-position: center
  touch-action: none
  cursor: grab

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the night over the lake: lighter with every village that has light
.gm-night
  position: absolute
  inset: 0
  background: rgb(18, 24, 58)
  pointer-events: none
  z-index: 1
  transition: opacity 300ms linear

.gm-bead
  position: absolute
  display: block
  width: 3%
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  opacity: 0.9

.gm-village
  position: absolute
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: brightness(0.45) saturate(0.5)
  transition: filter 250ms linear

  &.lit
    filter: none

.gm-glow
  position: absolute
  left: 50%
  top: 40%
  width: 160%
  transform: translate(-50%, -50%)
  mix-blend-mode: screen
  pointer-events: none

  img
    display: block
    width: 100%

.gm-lit
  position: absolute
  right: 0
  top: 0
  display: inline-flex
  align-items: center
  justify-content: center
  width: 24px
  height: 24px
  border-radius: 50%
  background: rgba(255, 246, 220, 0.95)
  box-shadow: 0 0 0 2px #2f6b3f
  font-weight: 900
  font-size: 1rem
  color: #2f6b3f

.gm-sun
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3000
  filter: drop-shadow(0 0 10px rgba(255, 210, 120, 0.9))

  &.held
    scale: 1.08

  &.glide
    transition: left 700ms ease-in-out, top 700ms ease-in-out

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  margin: -15px 0 0 -15px

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #4a3214

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .gm-village, .gm-night
    transition: none

  .gm-sun.glide
    transition: none

  .gm-sun.held
    scale: 1
</style>
