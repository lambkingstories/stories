<script setup lang="ts">
/**
 * The net on the right (John 21,6). The lake in the early morning: at the lower left lies the boat with the seven fishermen, on the water dark fish shadows swim in swarms and turn slowly. The finger pulls a dashed circle
 * (the size of the net) from the boat onto the water and lets go (or taps the water: the net is cast exactly there; the arrow keys move the circle, Enter casts): the net flies in an arc and sinks, every fish whose middle
 * lies in the circle is caught (a tick, it glitters silver and flies into the basket at the upper right). A cast without a catch is a mistake (a cross and a word, the net comes back dripping). Letting go over the boat
 * takes the cast back (no mistake). Round 1: five fish in one swarm, three casts, four are enough; round 2: eight fish in two swarms, four casts, six are enough. If the casts are used up before the goal is reached the
 * fish have moved on and the round begins again (what was caught before still counts for "Go on"). At the end the full net lies on the shore. Whoever does not aim gets the button "Cast for me" after fifteen seconds.
 * With reduced motion the fish stand still. Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import {
  FISCH_BACK_MS,
  FISCH_FLY_MS,
  FISCH_SINK_MS,
  FISCH_SPEED,
  fischzugBestSpot,
  fischzugCatch,
  fischzugDir,
  fischzugNudge,
  fischzugPos,
  fischzugRadius,
  fischzugStart,
  fischzugStep,
  fischzugVerdict,
  osterClamp,
  osterPointIn,
  osterStars
} from '@/utils/osternGames'
import type { FischPond, Pt } from '@/utils/osternGames'
import { seeded } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { FischzugGame } from '@/types/adventure'

const props = defineProps<{ game: FischzugGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: the fish that are enough in every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + Math.min(r.goal, r.fish), 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const READY_MS = 30
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
/** How many times this round began (a round begins again when the casts are used up). */
const attempt = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const pond = ref<FischPond>(fischzugStart(props.game.rounds[0]!, props.game.area, props.game.fish.length, props.game.speed ?? FISCH_SPEED, seeded(61)))
const taken = ref<boolean[]>([])
const flown = ref<boolean[]>([])
const throwsLeft = ref(0)
/** How many fish of this round were brought to "Go on" already (a new try of the round does not count them twice). */
const credited = ref(0)
const aim = ref<Pt | null>(null)
type Cast = { at: Pt; phase: 'ready' | 'fly' | 'sink' | 'back'; hits: number }
const net = ref<Cast | null>(null)
const busy = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let rand = seeded(61)
const field = ref<HTMLElement | null>(null)
const boatEl = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const radius = computed(() => fischzugRadius(props.game.net.w))
const caughtNow = computed(() => taken.value.filter(Boolean).length)
const positions = computed(() => pond.value.fish.map((_, i) => fischzugPos(pond.value, i)))
const goalNow = computed(() => Math.min(current.value.goal, current.value.fish))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** A round (or a new try of it) begins: the fish are new in the water and the casts are full again. */
function startRound(again: boolean) {
  const r = current.value
  if (!again) {
    attempt.value = 0
    credited.value = 0
  } else attempt.value++
  rand = seeded(61 + round.value * 17 + attempt.value * 5)
  pond.value = fischzugStart(r, props.game.area, props.game.fish.length, props.game.speed ?? FISCH_SPEED, rand)
  taken.value = pond.value.fish.map(() => false)
  flown.value = pond.value.fish.map(() => false)
  throwsLeft.value = r.throws
  net.value = null
  aim.value = null
  busy.value = false
  between.value = false
  idle.value = 0
}
startRound(false)

function loop() {
  if (!still && !finished.value && !busy.value && !between.value) pond.value = fischzugStep(pond.value, TICK, props.game.area, rand)
  if (!busy.value && !between.value && !finished.value) idle.value += TICK
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

/** The fish that are caught count for "Go on" (once each, whatever the number of tries). */
function credit() {
  const n = Math.min(caughtNow.value, goalNow.value)
  while (credited.value < n) {
    progress.mark()
    credited.value++
  }
}

/** The net is cast to `at`: it flies, sinks, and then the fish under it are counted. */
function cast(at: Pt) {
  if (busy.value || between.value || finished.value || throwsLeft.value <= 0) return
  const target = osterClamp(at)
  busy.value = true
  idle.value = 0
  aim.value = null
  throwsLeft.value--
  net.value = { at: target, phase: 'ready', hits: -1 }
  play('flip')
  message.value = ''
  later(() => {
    if (net.value) net.value.phase = 'fly'
  }, READY_MS)
  later(() => land(target), READY_MS + FISCH_FLY_MS)
}

function land(at: Pt) {
  if (!net.value) return
  net.value.phase = 'sink'
  const hits = fischzugCatch(positions.value, taken.value, at, radius.value)
  net.value.hits = hits.length
  if (!hits.length) {
    mistakes.value++
    play('wrong')
    say(t('app.adventure.fischzugEmpty'), 0)
  } else {
    for (const i of hits) taken.value[i] = true
    credit()
    play('bead')
    later(() => play('snap'), 160)
    say(t('app.adventure.fischzugCaught'), 0)
  }
  later(() => {
    for (const i of hits) flown.value[i] = true
    if (net.value) net.value.phase = 'back'
  }, FISCH_SINK_MS)
  later(finishCast, FISCH_SINK_MS + FISCH_BACK_MS)
}

/** The net is back: the round is won, lost (the casts are used up) or goes on. */
function finishCast() {
  net.value = null
  busy.value = false
  idle.value = 0
  message.value = ''
  const verdict = fischzugVerdict(caughtNow.value, current.value.goal, current.value.fish, throwsLeft.value)
  if (verdict === 'going') return
  between.value = true
  if (verdict === 'lost') {
    say(t('app.adventure.fischzugAgain'), 0)
    later(() => startRound(true), 2200)
    return
  }
  play('right')
  say(t('app.adventure.fischzugEnough'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1200)
  later(() => {
    round.value++
    startRound(false)
    message.value = ''
  }, 2600)
}

// ---- aiming: the finger pulls the circle onto the water and lets go (a tap casts exactly there)
let dragging = false

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return osterClamp({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  const p = pointAt(e)
  if (p) aim.value = p
}
function stopDrag(e?: PointerEvent) {
  const was = dragging
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  if (!was) return
  if (!e || e.type !== 'pointerup') {
    aim.value = null
    return
  }
  const p = pointAt(e) ?? aim.value
  const boat = boatEl.value?.getBoundingClientRect()
  if (!p) {
    aim.value = null
    return
  }
  // letting go over the boat takes the cast back
  if (boat && osterPointIn(boat, e.clientX, e.clientY)) {
    aim.value = null
    say(t('app.adventure.fischzugBack'))
    return
  }
  cast(p)
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value || between.value || finished.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  aim.value = p
  dragging = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
// the unmount: nothing may be left listening
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (busy.value || between.value || finished.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  const water = props.game.area
  const middle: Pt = { x: 50, y: (water.top + water.bottom) / 2 }
  if (a) {
    e.preventDefault()
    idle.value = 0
    aim.value = fischzugNudge(aim.value ?? middle, a[0], a[1])
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!aim.value) {
      aim.value = middle
      say(t('app.adventure.fischzugKeys'), 3600)
      return
    }
    cast(aim.value)
    return
  }
  if (e.key === 'Escape') aim.value = null
}

/** The button for those who cannot aim: the net is cast where it takes in the most fish. */
function castForMe() {
  const spot = fischzugBestSpot(positions.value, taken.value, radius.value)
  if (spot) cast(spot)
}

// ---- looks
const boatStyle = computed(() => ({ left: `${props.game.boat.x}%`, top: `${props.game.boat.y}%`, width: `${props.game.boat.w}%` }))
const basketStyle = computed(() => ({ left: `${props.game.basket.x}%`, top: `${props.game.basket.y}%`, width: `${props.game.basket.w}%` }))
const fishSprite = (i: number) => props.game.fish[(pond.value.fish[i]?.kind ?? 0) % props.game.fish.length]!
function fishStyle(i: number) {
  const s = fishSprite(i)
  if (flown.value[i]) return { left: `${props.game.basket.x}%`, top: `${props.game.basket.y - 4}%`, width: `${s.w}%` }
  const p = positions.value[i]!
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${s.w}%` }
}
const aimStyle = computed(() => ({ left: `${aim.value?.x ?? 0}%`, top: `${aim.value?.y ?? 0}%`, width: `${props.game.net.w}%` }))
/** The net starts at the boat, flies to the place, sinks and goes back to the boat. */
const netStyle = computed(() => {
  const n = net.value
  if (!n) return {}
  const home = { x: props.game.boat.x, y: props.game.boat.y - 10 }
  const at = n.phase === 'ready' || n.phase === 'back' ? home : n.at
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.net.w}%` }
})
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :class="{ aiming: !!aim }"
        :style="{ backgroundImage: `url(${src(game.lake)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.fischzugField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-basket" :style="basketStyle" role="img" :aria-label="game.basket.label")
          GameImage(:src="game.basket.image" :ratio="1" colour="#a8814a" :label="game.basket.label")
        template(v-for="(f, i) in pond.fish" :key="`${round}-${attempt}-${i}`")
          div(class="gm-fish" :class="{ glint: taken[i] && !flown[i], gone: flown[i] }" :data-fish="i" :style="fishStyle(i)" aria-hidden="true")
            span(class="gm-flip" :style="{ transform: `scaleX(${fischzugDir(pond, i)})` }")
              GameImage(:src="fishSprite(i).image" :ratio="2.2" colour="#2d5560" :label="fishSprite(i).label")
            span(v-if="taken[i] && !flown[i]" class="gm-spark") ✦
        div(ref="boatEl" class="gm-boat" :style="boatStyle" role="img" :aria-label="game.boat.label")
          GameImage(:src="game.boat.image" :ratio="1.6" colour="#9a6a3a" :label="game.boat.label")
        div(v-if="aim && !net" class="gm-aim" :style="aimStyle" role="img" :aria-label="t('app.adventure.fischzugAim')")
        div(v-if="net" class="gm-net" :class="[net.phase, { empty: net.hits === 0, full: net.hits > 0 }]" :style="netStyle" aria-hidden="true")
          GameImage(:src="game.net.image" :ratio="1" colour="#d9c9a0" round :label="game.net.label")
          span(v-if="net.hits === 0" class="gm-mark")
            GameMark(kind="bad")
          span(v-else-if="net.hits > 0" class="gm-mark")
            GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.fischzugCount', { n: caughtNow, total: goalNow }) }}
      p(class="gm-throws") {{ t('app.adventure.fischzugThrows', { n: throwsLeft, total: current.throws }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy && !between" tone="gold" @click="castForMe") {{ t('app.adventure.fischzugHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    template(v-else)
      div(class="gm-full" role="img" :aria-label="t('app.adventure.fischzugFull')")
        GameImage(:src="game.full" :ratio="1.5" colour="#c9b88a" :label="game.full")
        span(class="gm-mark")
          GameMark(kind="good")
      GameDone(:stars="stars" :text="t('app.adventure.fischzugDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #cfe3e4
  box-shadow: inset 0 0 18px rgba(20, 60, 70, 0.25)
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
  color: #3f5560

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f5560

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fb7bf
  background-size: cover
  background-position: center
  touch-action: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-boat, .gm-basket
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 3px rgba(10, 40, 50, 0.4))

// the fish: dark shadows under the water, a little see-through
.gm-fish
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  opacity: 0.55
  transition: left 50ms linear, top 50ms linear, opacity 300ms ease, scale 300ms ease

  &.glint
    opacity: 1
    scale: 1.15
    filter: brightness(2.6) saturate(0.15) drop-shadow(0 0 6px rgba(255, 255, 255, 0.95))
    z-index: 5

  &.gone
    opacity: 0
    scale: 0.3
    z-index: 5
    transition: left 700ms ease-in, top 700ms ease-in, opacity 700ms ease-in, scale 700ms ease-in

.gm-flip
  display: block

.gm-spark
  position: absolute
  right: -4px
  top: -10px
  color: #fff
  font-size: 1.2rem
  line-height: 1
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.95)
  animation: gm-twinkle 600ms ease-in-out infinite alternate

// the circle of the net: dashed, so that it can be seen on any water
.gm-aim
  position: absolute
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border: 3px dashed #fff6dc
  border-radius: 50%
  background: rgba(255, 246, 220, 0.18)
  box-shadow: 0 0 0 2px rgba(40, 70, 80, 0.55)
  pointer-events: none
  z-index: 6

.gm-net
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 7
  filter: drop-shadow(0 4px 4px rgba(10, 40, 50, 0.4))

  &.ready
    scale: 0.35
    transition: none

  &.fly
    scale: 1.1
    transition: left 450ms linear, top 450ms cubic-bezier(0.3, -0.7, 0.6, 1), scale 450ms ease-out

  &.sink
    scale: 1
    opacity: 0.9
    transition: scale 350ms ease-in, opacity 350ms ease-in

  &.back
    scale: 0.5
    opacity: 0
    transition: left 700ms ease-in-out, top 700ms ease-in-out, scale 700ms ease-in, opacity 700ms ease-in

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gm-full
  position: relative
  width: 100%
  border-radius: 14px
  border: 3px solid #d4a83e
  overflow: hidden

  .gm-mark
    left: auto
    right: 10px
    top: 10px
    margin: 0

.gm-count, .gm-throws
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #3f5560

.gm-throws
  font-size: 0.95rem

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #2d3f46
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-twinkle
  from
    opacity: 0.4
    scale: 0.8
  to
    opacity: 1
    scale: 1.2

// less motion: no twinkling, the net does not glide, the fish do not travel to the basket
@media (prefers-reduced-motion: reduce)
  .gm-spark
    animation: none

  .gm-net, .gm-net.fly, .gm-net.sink, .gm-net.back
    transition: none

  .gm-fish, .gm-fish.gone
    transition: none
</style>
