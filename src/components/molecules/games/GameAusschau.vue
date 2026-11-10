<script setup lang="ts">
/**
 * Who is coming? (Luke 15,20: "But when he was yet a great way off, his father saw him"). The child looks down a long road from the gate of the farm. Walkers come out of the haze one after
 * the other: first small, pale and blurred, then clear and coloured. The child taps the son as soon as he knows him. Right: the son stops, a soft golden pool of light lies round his feet,
 * a tick, a bright tone and the words "Yes, that is him! The father knows his son from far away." Wrong: a cross and "That is a merchant", the walker sways a little and goes on,
 * a mistake. There is no time limit and nothing is lost by waiting: the son stops short of the gate and waits until he is tapped, the others walk past the gate and leave.
 * Round 1: four walkers. Round 2: six walkers, quicker, one of them in a bright tunic like the son's old one; after the first mistake the line "The son walks alone and slowly."
 * "Help me" after fifteen seconds lays the pool of light round the son. Keyboard: Tab to a walker and Enter, or the arrow keys between the walkers.
 * Less motion: the walkers hop in steps instead of gliding, nothing sways or pulses. Nothing is shown by colour alone. Stars: `osterStars(mistakes)`.
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
import { LOOKOUT_LEAVE_DX, lookoutHaze, lookoutIsSon, lookoutLeaveShare, lookoutPhase, lookoutProgress, lookoutSonOf, lookoutSpot } from '@/utils/sohnNeuA'
import type { LookoutArrival, LookoutGame, LookoutSpot, Pt, Walker } from '@/utils/sohnNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: LookoutGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK_MS = 50
const IDLE_SECONDS = 15
const STEP_MS = 600
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const now = ref(0)
const running = ref(false)
const found = ref(false)
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const tip = ref(false)
const wobble = ref('')
const message = ref('')
const markAt = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
/** The time the walkers are drawn at: in steps when the motion is to be small. */
const shownT = computed(() => (still ? Math.floor(now.value / STEP_MS) * STEP_MS : now.value))

const walkerOf = (id: string): Walker => props.game.walkers.find((w) => w.id === id)!
const laneOf = (a: LookoutArrival) => props.game.lanes[a.lane]!
const isSon = (a: LookoutArrival) => lookoutIsSon(current.value, a.walker)
const phaseOf = (a: LookoutArrival) => lookoutPhase(a, shownT.value, isSon(a))
/** The walkers that are on the road now. */
const shown = computed(() => current.value.order.filter((a) => phaseOf(a) !== 'before' && phaseOf(a) !== 'gone'))
const progressOf = (a: LookoutArrival) => lookoutProgress(a, shownT.value)
const spotOf = (a: LookoutArrival): LookoutSpot => lookoutSpot(laneOf(a), progressOf(a))
const son = computed(() => lookoutSonOf(current.value))
const sonSpot = computed<LookoutSpot | null>(() => (son.value && phaseOf(son.value) !== 'before' ? spotOf(son.value) : null))
const haloOn = computed(() => !!sonSpot.value && (found.value || helping.value))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: Pt) {
  const id = ++markSeq
  markAt.value = { ...at, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1000)
}

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  if (between.value || found.value) return
  if (running.value) {
    now.value += TICK_MS
    idle.value += TICK_MS / 1000
  }
}
function startRound() {
  now.value = 0
  found.value = false
  helping.value = false
  tip.value = false
  idle.value = 0
  between.value = false
  message.value = ''
  running.value = true
  say(t('app.adventure.lookoutStart'), 3000)
}
later(step, TICK_MS)
later(startRound, 600)

/** The child taps a walker. */
function tap(a: LookoutArrival) {
  if (!running.value || found.value || between.value || finished.value) return
  idle.value = 0
  const w = walkerOf(a.walker)
  const spot = spotOf(a)
  const at = { x: spot.x, y: spot.y - 6 }
  if (lookoutIsSon(current.value, a.walker)) {
    found.value = true
    running.value = false
    progress.mark()
    play('found')
    flash('good', at)
    say(t('app.adventure.lookoutRight'), 0)
    later(() => play('right'), 350)
    later(endRound, 2800)
    return
  }
  mistakes.value++
  play('wrong')
  flash('bad', at)
  wobble.value = a.walker
  later(() => {
    if (wobble.value === a.walker) wobble.value = ''
  }, 700)
  say(t('app.adventure.lookoutWrong', { name: w.name }), 2800)
  if (round.value >= 1) tip.value = true
}
function endRound() {
  between.value = true
  say(t('app.adventure.lookoutRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 800)
  later(() => {
    round.value++
    startRound()
  }, 2400)
}

/** "Help me": a soft pool of light lies round the son, and the line says how he walks. */
function helpMe() {
  idle.value = 0
  if (found.value || between.value) return
  helping.value = true
  tip.value = true
  say(t('app.adventure.lookoutHelpGo'), 4000)
}

// ---- the keyboard: the arrow keys move between the walkers on the road, from left to right
function onFieldKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  const all = Array.from(box.querySelectorAll<HTMLElement>('button.gm-walker')).sort((a, b) => Number(a.dataset.x) - Number(b.dataset.x))
  if (!all.length) return
  e.preventDefault()
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = all[(at < 0 ? 0 : at + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]
  next?.focus()
}

// ---- looks
const label = (a: LookoutArrival) => (progressOf(a) < 0.45 ? t('app.adventure.lookoutFar') : walkerOf(a.walker).look)
/** The place of a walker: the feet at the foot point, the width as wide as the figure is at this place of the road. */
const placeStyle = (a: LookoutArrival) => {
  const s = spotOf(a)
  const leave = phaseOf(a) === 'leave' ? lookoutLeaveShare(a, shownT.value) : 0
  const side = s.x < 50 ? -1 : 1
  return {
    left: `${(s.x + side * LOOKOUT_LEAVE_DX * leave).toFixed(2)}%`,
    top: `${s.y}%`,
    width: `${s.w}%`,
    zIndex: Math.round(s.y * 10),
    transform: 'translate(-50%, -100%)'
  }
}
/** The finger target: as big as the figure, but at least 44 x 44 pixels (CSS), above the figure. */
const walkerStyle = (a: LookoutArrival) => ({ ...placeStyle(a), aspectRatio: String(walkerOf(a.walker).ratio), zIndex: (placeStyle(a).zIndex as number) + 1 })
/** The figure itself with the haze (a filter on the picture); the leaving fades it. */
const figStyle = (a: LookoutArrival) => {
  const h = lookoutHaze(progressOf(a))
  const leave = phaseOf(a) === 'leave' ? lookoutLeaveShare(a, shownT.value) : 0
  return { ...placeStyle(a), opacity: String(h.opacity * (1 - leave)), filter: `blur(${h.blur.toFixed(2)}px) saturate(${h.saturate.toFixed(2)})` }
}
const haloStyle = computed(() => {
  const s = sonSpot.value!
  const lane = laneOf(son.value!)
  const w = props.game.haloW * (s.w / lane.to.w)
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${w}%`, zIndex: Math.round(s.y * 10) - 1 }
})
const markStyle = computed(() => (markAt.value ? { left: `${markAt.value.x}%`, top: `${markAt.value.y}%` } : {}))
const countText = computed(() => t('app.adventure.lookoutCount', { n: Math.min(round.value + (found.value ? 1 : 0), props.game.rounds.length), total: props.game.rounds.length }))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ game.rounds[round]?.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.lookoutField')"
        @keydown="onFieldKey"
      )
        span(v-if="haloOn" class="gm-halo" :class="{ help: helping && !found }" :style="haloStyle" role="img" :aria-label="t('app.adventure.lookoutHalo')")
          GameImage(:src="game.halo" :ratio="1" colour="#f2c46a" round label="halo")
        template(v-for="a in shown" :key="`w-${round}-${a.walker}`")
          span(
            class="gm-fig"
            :class="{ gone: found && !isSon(a), wobble: wobble === a.walker, son: found && isSon(a) }"
            :data-fig="a.walker"
            :style="figStyle(a)"
            aria-hidden="true"
          )
            GameImage(:src="walkerOf(a.walker).image" :ratio="walkerOf(a.walker).ratio" colour="#c9b48a" :label="a.walker")
          button(
            type="button"
            class="gm-walker"
            :class="{ gone: found && !isSon(a), wobble: wobble === a.walker, son: found && isSon(a), walk: phaseOf(a) === 'walk' }"
            :data-walker="a.walker"
            :data-x="spotOf(a).x"
            :style="walkerStyle(a)"
            :disabled="!running || between"
            :aria-label="label(a)"
            @click="tap(a)"
          )
        span(v-if="markAt" class="gm-mark" :style="markStyle")
          GameMark(:kind="markAt.kind")
      p(class="gm-count" aria-live="polite") {{ countText }}
      p(v-if="tip" class="gm-tip") {{ t('app.adventure.lookoutHint') }}
      AdvButton(v-if="idle > IDLE_SECONDS && running && !found && !between" tone="gold" @click="helpMe") {{ t('app.adventure.lookoutHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lookoutDone')" @next="emit('done', stars)")
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
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

// a walker: the picture on the road (set by its feet), and over it a button as big as the picture and at least 44 x 44 pixels (the finger target)
.gm-fig
  position: absolute
  display: block
  pointer-events: none
  transition: opacity 400ms ease

  &.gone
    opacity: 0 !important

  &.son
    filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.9)) !important

  &.wobble :deep(.gi)
    animation: gm-wobble 600ms ease

.gm-walker
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px
    border-radius: 8px

// the soft golden pool of light on the ground, pressed flat
.gm-halo
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -62%) scaleY(0.38)
  pointer-events: none

  &.help
    animation: gm-pulse 1400ms ease-in-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 2000

.gm-tip
  margin: 0
  align-self: center
  padding: 2px 12px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

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

@keyframes gm-wobble
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-5px) rotate(-3deg)
  75%
    transform: translateX(5px) rotate(3deg)

@keyframes gm-pulse
  0%, 100%
    opacity: 0.65
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-fig
    transition: none

    &.wobble :deep(.gi)
      animation: none

  .gm-halo.help
    animation: none
</style>
