<script setup lang="ts">
/**
 * "Where does the house stand safely?" (Matthew 7,24-27, stage 11 of "Geschichten von Jesus"). A quiet valley with building plots and, at the bottom left, the little house in its tray.
 * Like a builder the child knocks on the ground: a tap on a plot makes the mallet knock, the rock rings hard (a short bright sound, sparks, the sign and the words "Hard as stone"),
 * the sand is soft (a dull sound, a puff of dust, "Soft as sand"). Knocking is never a mistake. Then the child sets the house on a plot (drag it there, or tap the house and then the plot; with the
 * keyboard: arrows choose the plot, Enter knocks, Space builds) and the weather comes in the order of the Bible: rain, water, wind. On the rock the house stands; on the sand it sinks in slowly
 * (whole and without rubble), that is a mistake, and the house goes back to its tray.
 * Round 1: four plots, one of rock, unlimited knocks, every result stays at its plot as a sign. Round 2: six plots, two of rock hidden under a thin layer of sand, only four knocks,
 * the result is only a sound, a movement and a word ("Hard." / "Soft."). The button "Help me" comes after fifteen seconds and shows a plot of rock (at most two stars with help).
 * Nothing is shown by colour alone (tick, cross, words). With reduced motion nothing swings, falls or sinks slowly. The arithmetic is `utils/gleichnisseNeuC.ts`; stars: `groundStars`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { useDragDrop } from '@/use/useDragDrop'
import { neuNeighbour } from '@/utils/gleichnisseNeu'
import type { NeuDir } from '@/utils/gleichnisseNeu'
import { GROUND_SINK_MS, GROUND_WEATHER, GROUND_WEATHER_MS, groundBuild, groundHint, groundHouseAt, groundHouseH, groundKnock, groundKnocksLeft, groundLook, groundPlotH, groundStars } from '@/utils/gleichnisseNeuC'
import type { GroundGame, GroundPlot } from '@/utils/gleichnisseNeuC'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GroundGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const IDLE_SECONDS = 15
const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)

/** what the knocks said in this round: plot index -> hard or soft */
const results = ref<Record<number, 'hard' | 'soft'>>({})
/** the plots on which the house sank (it does not stand there) */
const failed = ref<number[]>([])
const knocksUsed = ref(0)
const mistakes = ref(0)
const helped = ref(false)
const hinted = ref(-1)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const focusIndex = ref(0)
/** the plot the house stands on (null = in the tray) and how it looks there */
const houseAt = ref<number | null>(null)
const houseLook = ref<'house' | 'tilted'>('house')
/** the weather that is shown now */
const weather = ref<(typeof GROUND_WEATHER)[number] | null>(null)
const busy = computed(() => houseAt.value !== null || between.value || finished.value)
/** the knock that is shown now: where, what and a number that changes with every knock (so that the movement starts again) */
const knock = ref<{ i: number; kind: 'hard' | 'soft'; seq: number } | null>(null)
let seq = 0
let messageSeq = 0

const plotEls = ref<HTMLElement[]>([])
const setPlotEl = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) plotEls.value[i] = el
}

const stars = computed(() => groundStars(mistakes.value, helped.value))
const knocksLeft = computed(() => groundKnocksLeft(current.value, knocksUsed.value))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function tickIdle() {
  if (!finished.value && !between.value && houseAt.value === null) idle.value++
  later(tickIdle, 1000)
}
later(tickIdle, 1000)

// ---- the house: dragged or tapped (useDragDrop), then a tap on a plot
const dd = useDragDrop((id, target) => {
  if (id !== 'house' || !target.startsWith('plot-')) return
  build(Number(target.slice(5)))
})

function knockOn(i: number) {
  if (busy.value) return
  idle.value = 0
  focusIndex.value = i
  const left = groundKnocksLeft(current.value, knocksUsed.value)
  if (left !== null && left <= 0) {
    say(t('app.adventure.groundNoKnocks'))
    return
  }
  const verdict = groundKnock(current.value, i)
  if (verdict.kind === 'none') return
  const kind = verdict.kind === 'hard' ? 'hard' : 'soft'
  knocksUsed.value++
  hinted.value = -1
  knock.value = { i, kind, seq: ++seq }
  const mine = seq
  later(() => {
    if (knock.value && knock.value.seq === mine) knock.value = null
  }, reduced ? 500 : 900)
  play(kind === 'hard' ? 'tap' : 'sack')
  if (current.value.mark) {
    results.value = { ...results.value, [i]: kind }
    say(t(kind === 'hard' ? 'app.adventure.groundHard' : 'app.adventure.groundSoft'))
  } else say(t(kind === 'hard' ? 'app.adventure.groundHardShort' : 'app.adventure.groundSoftShort'))
}

function tapPlot(i: number) {
  if (busy.value) return
  if (dd.selected.value === 'house') {
    dd.tapPlace(`plot-${i}`)
    return
  }
  knockOn(i)
}

function build(i: number) {
  if (busy.value) return
  idle.value = 0
  focusIndex.value = i
  dd.selected.value = null
  if (failed.value.includes(i)) {
    say(t('app.adventure.groundSoftBuilt'))
    return
  }
  hinted.value = -1
  houseAt.value = i
  houseLook.value = 'house'
  const step = reduced ? 700 : GROUND_WEATHER_MS
  GROUND_WEATHER.forEach((w, k) =>
    later(() => {
      weather.value = w
      say(t(w === 'rain' ? 'app.adventure.groundRain' : w === 'water' ? 'app.adventure.groundWater' : 'app.adventure.groundWind'), step + 300)
    }, k * step)
  )
  later(() => verdict(i), GROUND_WEATHER.length * step)
}

function verdict(i: number) {
  weather.value = null
  if (groundBuild(current.value, i).kind === 'firm') {
    progress.mark()
    play('right')
    say(t('app.adventure.groundFirm'), 0)
    later(roundDone, reduced ? 600 : 1800)
    return
  }
  // the sand gives way: the whole house sinks slowly (nothing breaks), then it goes back to its tray
  mistakes.value++
  failed.value = [...failed.value, i]
  houseLook.value = 'tilted'
  play('wrong')
  say(t('app.adventure.groundSink'), 0)
  later(
    () => {
      houseAt.value = null
      houseLook.value = 'house'
      idle.value = 0
      say(t('app.adventure.groundAgain'), 3500)
    },
    reduced ? 900 : GROUND_SINK_MS
  )
}

function roundDone() {
  between.value = true
  play('bead')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1600)
    return
  }
  say(t('app.adventure.gameNext'), 0)
  later(() => {
    round.value++
    results.value = {}
    failed.value = []
    knocksUsed.value = 0
    hinted.value = -1
    knock.value = null
    houseAt.value = null
    houseLook.value = 'house'
    focusIndex.value = 0
    idle.value = 0
    between.value = false
    message.value = ''
  }, 1800)
}

function helpMe() {
  idle.value = 0
  const i = groundHint(current.value, failed.value)
  if (i === null) return
  helped.value = true
  hinted.value = i
  focusIndex.value = i
  void nextTick(() => plotEls.value[i]?.focus({ preventScroll: true }))
  say(t('app.adventure.groundHelped'), 3500)
}

function onKey(e: KeyboardEvent, i: number) {
  if (e.key === 'Enter') {
    e.preventDefault()
    knockOn(i)
    return
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault()
    build(i)
    return
  }
  const dirs: Record<string, NeuDir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = dirs[e.key]
  if (d === undefined) return
  e.preventDefault()
  const k = neuNeighbour(current.value.plots, i, d, ratio.value)
  if (k === null) return
  focusIndex.value = k
  plotEls.value[k]?.focus({ preventScroll: true })
}
// a space bar that is let go must not click the button (the build was made on key down)
function onKeyUp(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault()
}
function onHouseKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (e.type === 'keydown') dd.toggleSelect('house')
  }
}

// ---- looks
const spriteFor = (p: GroundPlot) => props.game.sprites[groundLook(p)]
const z = (y: number) => Math.round(y * 10) + 10
const plotStyle = (p: GroundPlot) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: z(p.y) })
const effectStyle = (p: GroundPlot, w: number) => ({ left: `${p.x}%`, top: `${p.y - groundPlotH(p, ratio.value) * 0.4}%`, width: `${w}%`, zIndex: 4000 })
const houseStyle = computed(() => {
  const i = houseAt.value
  const p = i === null ? null : current.value.plots[i]
  if (!p) return {}
  const at = groundHouseAt(p, ratio.value)
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.sprites.house.w}%`, zIndex: z(p.y) + 5 }
})
const trayStyle = computed(() => ({ left: `${props.game.tray.x}%`, top: `${props.game.tray.y}%`, width: `${props.game.tray.w}%`, height: `${groundHouseH(props.game) + 1}%`, zIndex: 3 }))
const trayHouseStyle = computed(() => ({ left: `${props.game.tray.x}%`, top: `${props.game.tray.y}%`, width: `${props.game.sprites.house.w}%`, zIndex: 3500 }))
const knockPlot = computed(() => (knock.value ? current.value.plots[knock.value.i] : undefined))
const hintPlot = computed(() => (hinted.value >= 0 ? current.value.plots[hinted.value] : undefined))
const plotLabel = (p: GroundPlot, i: number) => {
  const base = t('app.adventure.groundPlot', { n: i + 1, total: current.value.plots.length })
  if (failed.value.includes(i)) return `${base}, ${t('app.adventure.groundSoft')}`
  const r = results.value[i]
  return r ? `${base}, ${t(r === 'hard' ? 'app.adventure.groundHard' : 'app.adventure.groundSoft')}` : base
}
const colour = { rock: '#9c9a94', sand: '#d9c48a', covered: '#d3bd82' } as const
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.groundField')"
      )
        div(v-if="weather === 'water' || weather === 'wind'" class="gm-water" :class="{ calm: reduced }" aria-hidden="true")
          GameImage(:src="game.sprites.water.image" :ratio="5.8" colour="#bfe0ee" :label="game.sprites.water.label")
        div(class="gm-tray" :style="trayStyle" aria-hidden="true")
        button(
          v-if="houseAt === null && !between"
          type="button"
          class="gm-house-tray"
          :class="{ chosen: dd.selected.value === 'house', dragging: dd.dragging.value === 'house' }"
          :style="[trayHouseStyle, dd.dragStyle('house')]"
          :aria-label="dd.selected.value === 'house' ? t('app.adventure.groundHouseChosen') : t('app.adventure.groundHouse')"
          :aria-pressed="dd.selected.value === 'house' ? 'true' : 'false'"
          @pointerdown="dd.down($event, 'house')"
          @keydown="onHouseKey"
          @keyup="onHouseKey"
        )
          GameImage(:src="game.sprites.house.image" :ratio="1.07" colour="#d9d0bd" :label="game.sprites.house.label")
        template(v-for="(p, i) in current.plots" :key="`p-${round}-${i}`")
          button(
            :ref="(el) => setPlotEl(el, i)"
            type="button"
            class="gm-plot"
            :class="{ hinted: hinted === i, soft: results[i] === 'soft' || failed.includes(i), taps: knock && knock.i === i }"
            :style="plotStyle(p)"
            :data-drop="`plot-${i}`"
            :tabindex="focusIndex === i ? 0 : -1"
            :aria-label="plotLabel(p, i)"
            :aria-disabled="busy ? 'true' : undefined"
            @click="tapPlot(i)"
            @keydown="onKey($event, i)"
            @keyup="onKeyUp"
          )
            GameImage(:src="spriteFor(p).image" :ratio="1.8" :colour="colour[groundLook(p)]" :label="spriteFor(p).label")
            span(v-if="results[i] && !failed.includes(i)" class="gm-mark")
              GameMark(:kind="results[i] === 'hard' ? 'good' : 'bad'")
            span(v-if="failed.includes(i)" class="gm-mark")
              GameMark(kind="bad")
        div(v-if="houseAt !== null" class="gm-house" :class="[houseLook, { calm: reduced }]" :style="houseStyle" role="img" :aria-label="game.sprites.house.label")
          GameImage(:src="houseLook === 'tilted' ? game.sprites.tilted.image : game.sprites.house.image" :ratio="1.07" colour="#d9d0bd" :label="game.sprites.house.label")
        div(v-if="knockPlot && knock" :key="knock.seq" class="gm-fx gm-mallet" :class="{ calm: reduced }" :style="effectStyle(knockPlot, game.sprites.mallet.w)" aria-hidden="true")
          GameImage(:src="game.sprites.mallet.image" :ratio="1" colour="#a8793f" :label="game.sprites.mallet.label")
        div(v-if="knockPlot && knock" :key="`f${knock.seq}`" class="gm-fx gm-burst" :class="[knock.kind, { calm: reduced }]" :style="effectStyle(knockPlot, knock.kind === 'hard' ? game.sprites.spark.w : game.sprites.puff.w)" aria-hidden="true")
          GameImage(:src="knock.kind === 'hard' ? game.sprites.spark.image : game.sprites.puff.image" :ratio="1" colour="#e8d9a0" :label="knock.kind === 'hard' ? game.sprites.spark.label : game.sprites.puff.label")
        div(v-if="hintPlot && !knock" class="gm-fx gm-mallet nod" :class="{ calm: reduced }" :style="effectStyle(hintPlot, game.sprites.mallet.w)" aria-hidden="true")
          GameImage(:src="game.sprites.mallet.image" :ratio="1" colour="#a8793f" :label="game.sprites.mallet.label")
        div(v-if="weather === 'rain'" class="gm-rain" :class="{ calm: reduced }" aria-hidden="true")
          GameImage(:src="game.sprites.rain.image" :ratio="1.5" colour="#d8ecf5" :label="game.sprites.rain.label")
        div(v-if="weather === 'wind'" class="gm-wind" :class="{ calm: reduced }" aria-hidden="true")
          GameImage(:src="game.sprites.wind.image" :ratio="2.5" colour="#e9f4e0" :label="game.sprites.wind.label")
      p(v-if="knocksLeft !== null" class="gm-knocks" aria-live="polite")
        span(class="gm-knock-icons" aria-hidden="true")
          span(v-for="k in current.knocks" :key="k" class="gm-knock-icon" :class="{used: k > knocksLeft}")
            GameImage(:src="game.sprites.mallet.image" :ratio="1" colour="#a8793f" :label="game.sprites.mallet.label")
        span {{ t('app.adventure.groundKnocks', { n: knocksLeft }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.groundHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.groundDone')" @next="emit('done', stars)")
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
  background-color: #8fb06a
  background-size: cover
  background-position: center

// a plot stands on its foot (the point of the data is the middle of its foot); at least 44 pixels to tap
.gm-plot
  position: absolute
  display: flex
  align-items: flex-end
  min-width: 44px
  min-height: 44px
  padding: 0
  border: none
  background: none
  transform: translate(-50%, -100%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: transform 220ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  // a plot that gave way is a little lower (a movement, not only a colour)
  &.soft
    transform: translate(-50%, -100%) scaleY(0.9)
    transform-origin: 50% 100%

  &.taps
    animation: gm-shake 380ms ease-out

  &.hinted
    animation: gm-nod 900ms ease-in-out infinite
    filter: drop-shadow(0 0 6px #fff6dc) drop-shadow(0 0 3px #fff6dc)

.gm-mark
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-tray
  position: absolute
  transform: translate(-50%, -100%)
  border: 3px dashed rgba(255, 246, 220, 0.9)
  border-radius: 14px
  background: rgba(60, 45, 20, 0.18)
  pointer-events: none

.gm-house-tray
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: none
  background: none
  transform: translate(-50%, -100%)
  cursor: grab
  touch-action: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  // the chosen house stands a little higher and has a ring (not only a colour)
  &.chosen
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 10px
    margin-top: -6px

  &.dragging
    cursor: grabbing

.gm-house
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))
  animation: gm-settle 420ms ease-out

  &.tilted
    animation: gm-sag 2000ms ease-in forwards

  &.calm
    animation: none

.gm-fx
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

.gm-mallet
  animation: gm-swing 520ms ease-in-out

  &.nod
    animation: gm-nod 900ms ease-in-out infinite

.gm-burst
  animation: gm-puff 800ms ease-out forwards

.gm-water
  position: absolute
  left: 0
  right: 0
  bottom: 0
  z-index: 2
  pointer-events: none
  animation: gm-flow 1100ms ease-out

.gm-rain
  position: absolute
  inset: 0
  z-index: 5000
  pointer-events: none
  animation: gm-fall 500ms linear infinite

.gm-wind
  position: absolute
  left: 0
  right: 0
  top: 8%
  z-index: 5001
  pointer-events: none
  animation: gm-blow 1500ms ease-in-out infinite alternate

.gm-knocks
  margin: 0
  align-self: center
  display: flex
  align-items: center
  gap: 8px
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gm-knock-icons
  display: inline-flex
  gap: 4px

.gm-knock-icon
  display: block
  width: 26px

  &.used
    opacity: 0.25

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

@keyframes gm-swing
  0%
    rotate: -35deg
    translate: 0 -30%
  45%
    rotate: 25deg
    translate: 0 0
  70%
    rotate: -10deg
    translate: 0 -12%
  100%
    rotate: 0deg
    translate: 0 0

@keyframes gm-shake
  0%, 100%
    translate: 0 0
  30%
    translate: 0 4%
  60%
    translate: 0 -2%

@keyframes gm-nod
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -8%

@keyframes gm-puff
  0%
    opacity: 0
    scale: 0.4
  25%
    opacity: 1
    scale: 1
  100%
    opacity: 0
    scale: 1.4
    translate: 0 -25%

@keyframes gm-settle
  0%
    translate: 0 -14%
  70%
    translate: 0 2%
  100%
    translate: 0 0

@keyframes gm-sag
  0%
    translate: 0 0
    rotate: 0deg
  35%
    translate: 0 0
    rotate: 0deg
  100%
    translate: 0 9%
    rotate: 4deg

@keyframes gm-flow
  from
    translate: 0 100%
  to
    translate: 0 0

@keyframes gm-fall
  from
    translate: 0 -3%
  to
    translate: 0 0

@keyframes gm-blow
  from
    translate: -4% 0
  to
    translate: 4% 0

// less motion: nothing swings, falls, flows or sinks; the plots do not shake
@media (prefers-reduced-motion: reduce)
  .gm-plot
    transition: none

  .gm-plot.taps, .gm-plot.hinted, .gm-mallet, .gm-mallet.nod, .gm-burst, .gm-house, .gm-house.tilted, .gm-water, .gm-rain, .gm-wind
    animation: none

  .gm-plot.hinted
    outline: 3px dashed #fff6dc
    outline-offset: 2px

  .gm-burst
    opacity: 0.9
</style>
