<script setup lang="ts">
/**
 * The red rope (Josua, stage 3): from the window in the high wall of the city a red rope hangs, and a man hangs on it. The child holds the rope (a finger on the picture, the button "Let the rope down", or
 * the Enter and the space key held down) and the man goes down; when it lets go he stops. At the foot of the wall a guard with a torch walks by from right to left: a small figure with a circle of warm light that
 * the app draws. While he comes (about two seconds before his light reaches the rope) and while he is near, a big sign says "Wait" (never only a colour: also the dashed rope and a spoken note); when it says
 * "Go" the rope is free. Whoever holds while the guard is in the light lets the man be seen: the rope jerks, a cross, a dull sound, and he climbs back up to the last of the four red knots; nothing is lost, no round
 * starts again, and he can go on at once when the guard is far. Waiting is never a mistake. Two rounds because two men go down: round 1 one pass of the guard, round 2 two. A single click on the button (no pointer, an
 * aid for those who cannot hold) switches between "let down" and "stop". Losing the focus lets go. With reduced motion the guard walks in steps every half second and the man in steps of five percent.
 * The rules (where the guard is, when it is "wait", the step of the game) are `guardX`, `guardState`, `lowerStep` and `lastKnot` in `utils/josuaGames.ts`; the clock never jumps more than 100 ms in one tick.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { guardState, guardX, lowerStart, lowerStep } from '@/utils/josuaGames'
import type { LowerState, RopeRules } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { LowerGame, LowerMan } from '@/types/adventure'

const props = defineProps<{ game: LowerGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every man down
progress.setGoal(props.game.rounds.length)

/** The picture of the man is 160 x 560 pixels; the field is 3 : 4, so a width of the picture is three quarters of that in height. */
const MAN_RATIO = 560 / 160
const FIELD_ASPECT = 4 / 3
/** One tick of the clock (ms), the longest step of time one tick may count (ms), and how long a hold by hand or key counts as the cause of the next click (ms). */
const TICK = 33
const MAX_DT = 100
const INPUT_MS = 400
/**
 * The width of the guard (percent of the width of the field), the height of his torch above his feet (percent of the height of the field) and how far left of the middle of the figure the torch is (percent of the width):
 * measured on `wache.webp` (140 x 220, the flame at about x 10, y 35). The rules count the place of the TORCH (the light), so the figure is drawn that much to the right of it.
 */
const GUARD_W = 12
const TORCH_UP = 11.5
const TORCH_DX = 5
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const man = computed<LowerMan | undefined>(() => props.game.men.find((m) => m.id === current.value.man))
const manW = computed(() => man.value?.w ?? 16)
/** The height of the man in percent of the height of the field. */
const manH = computed(() => (manW.value * MAN_RATIO) / FIELD_ASPECT)
/** From the window to the ground, in percent of the height of the field, and how far down the man can go. */
const span = computed(() => props.game.ground - props.game.window[1])
const room = computed(() => Math.max(0, span.value - manH.value))
const rules = computed<RopeRules>(() => ({
  windowX: props.game.window[0],
  guardSpeed: props.game.guardSpeed,
  lightRadius: props.game.lightRadius,
  warnLead: props.game.warnLead,
  knots: props.game.knots,
  descentMs: current.value.descentMs,
  passes: current.value.passes,
  gapMs: current.value.gapMs
}))

const phase = ref<'ready' | 'play' | 'down' | 'finished'>('ready')
const st = ref<LowerState>(lowerStart())
const sources = ref<Set<string>>(new Set())
const holding = computed(() => sources.value.size > 0)
const downCount = ref(0)
const seen = ref(0)
const jerk = ref(false)
const message = ref('')
const announce = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(seen.value, 1, 3))
let last = 0
let lastInput = 0

/** Where the guard walks now (real time) and whether the sign says wait. */
const realX = computed(() => (phase.value === 'play' ? guardX(st.value.t, rules.value) : null))
const state = computed(() => guardState(realX.value, rules.value))
const waiting = computed(() => phase.value === 'play' && state.value !== 'far')
/** What is drawn: with reduced motion in steps. */
const shownX = computed(() => {
  if (phase.value !== 'play') return null
  return still ? guardX(Math.floor(st.value.t / 500) * 500, rules.value) : realX.value
})
const shownY = computed(() => (still ? Math.floor(st.value.y * 20) / 20 : st.value.y))
const dropPercent = computed(() => (span.value ? ((shownY.value * room.value) / span.value) * 100 : 0))
const knotTops = computed(() => Array.from({ length: Math.max(0, props.game.knots) }, (_, k) => (span.value ? (((k / props.game.knots) * room.value) / span.value) * 100 : 0)))

const timer = window.setInterval(tick, TICK)
function release() {
  sources.value = new Set()
}
const onWindowUp = () => {
  if (sources.value.has('pointer')) setSource('pointer', false)
}
window.addEventListener('pointerup', onWindowUp)
window.addEventListener('pointercancel', onWindowUp)
window.addEventListener('blur', release)
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('pointerup', onWindowUp)
  window.removeEventListener('pointercancel', onWindowUp)
  window.removeEventListener('blur', release)
})

function setSource(name: string, on: boolean) {
  const next = new Set(sources.value)
  if (on) next.add(name)
  else next.delete(name)
  sources.value = next
  // the first hold of a round lets the guard start
  if (on && phase.value === 'ready') begin()
}

function begin() {
  st.value = lowerStart()
  last = Date.now()
  phase.value = 'play'
  message.value = ''
}

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 700)
}

function tick() {
  if (phase.value !== 'play') return
  const now = Date.now()
  const dt = Math.min(MAX_DT, Math.max(0, now - last))
  last = now
  if (!dt) return
  const r = lowerStep(st.value, dt, holding.value, rules.value)
  st.value = r.state
  if (r.event === 'gesehen') wasSeen()
  else if (r.event === 'unten') arrived()
}

/** Held while the guard looks: the man climbs back to the last knot (the state already has it), the rest is feedback. */
function wasSeen() {
  seen.value++
  // a held switch (the aid) is let go: the child has to decide again
  if (sources.value.has('toggle')) setSource('toggle', false)
  play('wrong')
  flashOn('bad')
  message.value = t('app.adventure.lowerSeen')
  jerk.value = true
  later(() => {
    jerk.value = false
  }, 600)
}

function arrived() {
  phase.value = 'down'
  downCount.value++
  progress.mark()
  play('snap')
  flashOn('good')
  message.value = t('app.adventure.lowerDown')
  announce.value = ''
  if (lastRound.value) {
    later(() => {
      phase.value = 'finished'
      play('star')
    }, 1000)
    return
  }
  later(() => {
    round.value++
    st.value = lowerStart()
    release()
    message.value = ''
    phase.value = 'ready'
  }, 1800)
}

// the spoken note when the sign changes
watch(waiting, (w) => {
  if (phase.value !== 'play') return
  announce.value = t(w ? 'app.adventure.lowerAnnounceWait' : 'app.adventure.lowerAnnounceGo')
})

function pointerDown(e: PointerEvent) {
  lastInput = Date.now()
  setSource('pointer', true)
  const el = e.currentTarget as HTMLElement | null
  try {
    el?.setPointerCapture?.(e.pointerId)
  } catch {
    // a pointer that is gone: the window listener lets go
  }
}

function pointerUp() {
  lastInput = Date.now()
  setSource('pointer', false)
}

function buttonDown() {
  lastInput = Date.now()
  setSource('pointer', true)
}

/** A click without a pointer or key before it: an aid for those who cannot hold; it switches between "let down" and "stop". */
function toggle() {
  if (Date.now() - lastInput < INPUT_MS) return
  setSource('toggle', !sources.value.has('toggle'))
}

function keyDown(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  lastInput = Date.now()
  if (!e.repeat) setSource('key', true)
}

function keyUp(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  lastInput = Date.now()
  setSource('key', false)
}

const ropeStyle = computed(() => ({
  left: `${props.game.window[0]}%`,
  top: `${props.game.window[1]}%`,
  width: `${manW.value}%`,
  height: `${span.value}%`
}))
const lineStyle = computed(() => ({ height: `${dropPercent.value}%` }))
const manStyle = computed(() => ({ top: `${dropPercent.value}%` }))
const guardStyle = computed(() => ({ left: `${(shownX.value ?? 0) + TORCH_DX}%`, top: `${props.game.road}%`, width: `${GUARD_W}%` }))
const lightStyle = computed(() => ({ left: `${shownX.value ?? 0}%`, top: `${props.game.road - TORCH_UP}%`, width: `${props.game.lightRadius * 2}%` }))
</script>

<template lang="pug">
  div(class="lw" tabindex="-1" @keydown="keyDown" @keyup="keyUp")
    template(v-if="phase !== 'finished'")
      p(v-if="rounds.length > 1" class="lw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="lw-hint") {{ current.hint }}
      div(
        class="lw-field"
        :class="{ holding }"
        role="group"
        :aria-label="t('app.adventure.lowerField', { n: downCount, total: rounds.length })"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @pointerdown.prevent="pointerDown"
        @pointerup="pointerUp"
        @pointercancel="pointerUp"
        @lostpointercapture="pointerUp"
      )
        span(class="lw-night" aria-hidden="true")
        div(class="lw-rope" :class="{ jerk }" :style="ropeStyle" aria-hidden="true")
          span(class="lw-line" :class="{ dashed: waiting }" :style="lineStyle")
          span(v-for="(top, k) in knotTops" :key="k" class="lw-knot" :style="{ top: `${top}%` }")
          span(class="lw-man" :class="{ seen: jerk }" :style="manStyle")
            GameImage(:src="man ? man.image : ''" :ratio="160 / 560" colour="#c9895a")
        template(v-if="shownX !== null")
          span(class="lw-light" :class="{ near: waiting }" :style="lightStyle" aria-hidden="true")
          span(class="lw-guard" :style="guardStyle" aria-hidden="true")
            GameImage(:src="game.guard" :ratio="140 / 220" colour="#2b2236")
        span(v-if="phase === 'play' || phase === 'ready'" class="lw-sign" :class="{ wait: waiting }" aria-hidden="true") {{ waiting ? t('app.adventure.lowerWait') : t('app.adventure.lowerGo') }}
        GameMark(v-if="flash" :kind="flash" class="lw-mark")
      p(class="lw-fb" role="status") {{ message }}
      p(class="lw-sr" aria-live="polite") {{ announce }}
      AdvButton(
        tone="gold"
        class="lw-go"
        :class="{ on: holding }"
        :disabled="phase === 'down'"
        @pointerdown="buttonDown"
        @pointerup="pointerUp"
        @click.stop="toggle"
      ) {{ t('app.adventure.lowerHold') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lowerDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.lw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.lw-round
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

.lw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.lw-field
  position: relative
  width: 100%
  max-width: 420px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6d6a7c
  background-size: cover
  background-position: center
  // the finger stays on the picture: no scrolling, no zoom
  touch-action: none
  user-select: none
  -webkit-user-select: none
  cursor: pointer

// the night: a blue layer over the wall
.lw-night
  position: absolute
  inset: 0
  background: rgba(20, 30, 72, 0.45)
  pointer-events: none

// the rope hangs from the window; the line is the red rope above the man (the picture of the man has its own piece of rope)
.lw-rope
  position: absolute
  pointer-events: none

  &.jerk
    animation: lw-jerk 400ms ease-in-out

.lw-line
  position: absolute
  left: 50%
  top: 0
  width: 5px
  margin-left: -2.5px
  background: #c0302a
  border-radius: 2px
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5)

  // "wait": the rope is dashed (not only a colour)
  &.dashed
    background: repeating-linear-gradient(to bottom, #c0302a 0, #c0302a 8px, transparent 8px, transparent 14px)
    box-shadow: none

// the four red knots where the man is pulled back to
.lw-knot
  position: absolute
  left: 50%
  width: 12px
  height: 12px
  margin: -2px 0 0 -6px
  border-radius: 50%
  background: #8a1f1a
  border: 2px solid #ffd2cf

.lw-man
  position: absolute
  left: 0
  width: 100%
  transition: top 150ms linear

  &.seen
    transition: top 600ms ease
    filter: drop-shadow(0 0 6px rgba(240, 200, 120, 0.95))

// the torch light: a warm circle; it glows brighter when the guard is near
.lw-light
  position: absolute
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 214, 130, 0.7) 0%, rgba(255, 170, 70, 0.35) 45%, rgba(255, 150, 50, 0) 72%)
  mix-blend-mode: screen
  pointer-events: none
  transition: left 80ms linear
  animation: lw-flicker 900ms ease-in-out infinite alternate

  &.near
    background: radial-gradient(circle, rgba(255, 230, 150, 0.9) 0%, rgba(255, 180, 80, 0.5) 50%, rgba(255, 150, 50, 0) 75%)

.lw-guard
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: left 80ms linear

// the big sign: "go" or "wait", with a symbol and a word
.lw-sign
  position: absolute
  top: 8px
  left: 50%
  transform: translateX(-50%)
  padding: 4px 18px
  border-radius: 999px
  border: 3px solid #fff
  background: #2f7d3f
  color: #fff
  font-weight: 900
  font-size: 1.3rem
  white-space: nowrap
  z-index: 5
  pointer-events: none

  &.wait
    background: #b8860b

.lw-mark
  position: absolute
  top: 52px
  right: 8px
  z-index: 6

.lw-fb
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

// said to the screen reader only
.lw-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  padding: 0
  overflow: hidden
  clip: rect(0 0 0 0)
  white-space: nowrap
  border: 0

.lw-go
  align-self: center
  min-height: 60px
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.on
    outline: 4px solid #1f5fa8
    outline-offset: 2px

@keyframes lw-jerk
  0%, 100%
    margin-left: 0
  25%
    margin-left: -5px
  75%
    margin-left: 5px

@keyframes lw-flicker
  from
    opacity: 0.85
  to
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .lw-man, .lw-light, .lw-guard
    transition: none
  .lw-light, .lw-rope.jerk
    animation: none
</style>
