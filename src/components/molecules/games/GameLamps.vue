<script setup lang="ts">
/**
 * Fill the lamps (Matthew 25,1-13). Night before the house of the wedding. In the middle stands a big clay lamp with a glass opening and a golden ring on one height (the mark); at the side stands the jug of oil.
 * Holding the jug (or the button "Pour", or Space/Enter) pours oil, the level rises in the glass; letting go ends it. At the mark (within the tolerance) the lamp burns (tick); too little and the lamp flickers and
 * goes out (cross, "Pour more", the oil stays, one pours on); too much and the oil runs over (cross, a mistake, the level goes back to the mark and the lamp burns). The alternative "Tap instead of hold" pours a little
 * with every tap (no mistake is possible there). Round 1 has three lamps, round 2 three with a narrower tolerance; at the end the six lamps stand in a row and burn. Nothing is shown by colour alone (tick, cross, words).
 * Stars: `weekStars(mistakes, rounds)` in `utils/letzteWocheGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { lampInWindow, lampJudge, lampMarkTop, lampPour, lampTap, lampTolerance, weekStars } from '@/utils/letzteWocheGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { OilLampGame } from '@/types/adventure'

const props = defineProps<{ game: OilLampGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every lamp of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.marks.length, 0))

type Phase = 'ready' | 'pouring' | 'low' | 'lit' | 'spill'
const round = ref(0)
const lamp = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const mark = computed(() => current.value.marks[Math.min(lamp.value, current.value.marks.length - 1)]!)
const tolerance = computed(() => lampTolerance(current.value, round.value))
const level = ref(0)
const phase = ref<Phase>('ready')
const tapMode = ref(false)
const busy = ref(false)
const solved = ref(0)
const mistakes = ref(0)
const showRow = ref(false)
const finished = ref(false)
const message = ref('')
const drops = ref(0)
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => weekStars(mistakes.value, props.game.rounds.length))
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.marks.length, 0))
const shownLamp = computed(() => (phase.value === 'lit' || phase.value === 'spill' ? props.game.lit : phase.value === 'low' ? props.game.out : props.game.lamp))
const lampStyle = computed(() => ({ left: `${props.game.lamp.x}%`, top: `${props.game.lamp.y}%`, width: `${props.game.lamp.w}%` }))
const glassStyle = computed(() => ({ left: `${props.game.glass.x}%`, top: `${props.game.glass.y}%`, width: `${props.game.glass.w}%`, height: `${props.game.glass.h}%` }))
const markStyle = computed(() => ({ top: `${lampMarkTop(mark.value, props.game.glass)}%`, width: `${Math.min(140, (props.game.mark.w / props.game.lamp.w) * 100)}%` }))
const jugStyle = computed(() => ({ left: `${props.game.jug.x}%`, top: `${props.game.jug.y}%`, width: `${props.game.jug.w}%` }))
const oilTile = computed(() => `url(${src(props.game.oil.image)})`)
const pouring = computed(() => phase.value === 'pouring')

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// ---- pouring: a clock that adds oil while the jug is held (the time is measured with the clock, so a slow device pours the same)
let timer = 0
let last = 0
let tick = 0
function clearTimer() {
  if (timer) window.clearInterval(timer)
  timer = 0
}
onBeforeUnmount(() => {
  clearTimer()
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
})

function press(fromPointer: boolean) {
  if (busy.value || finished.value || phase.value === 'lit' || phase.value === 'spill') return
  if (tapMode.value) {
    tapPour()
    return
  }
  if (pouring.value) return
  phase.value = 'pouring'
  message.value = ''
  last = Date.now()
  tick = Math.floor(level.value / 12)
  timer = window.setInterval(() => {
    const now = Date.now()
    level.value = lampPour(level.value, now - last)
    last = now
    const k = Math.floor(level.value / 12)
    if (k > tick) {
      tick = k
      play('tap')
    }
    if (level.value >= 100) release()
  }, 50)
  if (fromPointer) {
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }
}

function release() {
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
  if (!pouring.value) return
  clearTimer()
  level.value = lampPour(level.value, Date.now() - last)
  judge()
}

/** One tap pours a little; the lamp lights as soon as the oil stands in the window of the mark. */
function tapPour() {
  if (busy.value || finished.value || phase.value === 'lit' || phase.value === 'spill') return
  level.value = lampTap(level.value)
  play('tap')
  phase.value = 'ready'
  judge(true)
}

function judge(byTap = false) {
  const verdict = lampJudge(level.value, mark.value, tolerance.value)
  if (verdict === 'ok') {
    light()
    return
  }
  if (verdict === 'low') {
    if (level.value < 2) {
      phase.value = 'ready'
      return
    }
    if (byTap) {
      phase.value = 'ready'
      return
    }
    phase.value = 'low'
    play('flip')
    say(t('app.adventure.lampsLow'), 2800)
    return
  }
  // too much: the oil runs over, the level goes back to the mark
  phase.value = 'spill'
  busy.value = true
  mistakes.value++
  drops.value++
  play('wrong')
  say(t('app.adventure.lampsHigh'), 0)
  later(() => {
    level.value = mark.value
    light()
  }, 1000)
}

function light() {
  phase.value = 'lit'
  busy.value = true
  solved.value++
  progress.mark()
  play('right')
  say(t('app.adventure.lampsOk'), 0)
  later(next, 1500)
}

function next() {
  lamp.value++
  if (lamp.value < current.value.marks.length) {
    level.value = 0
    phase.value = 'ready'
    busy.value = false
    message.value = ''
    return
  }
  if (lastRound.value) {
    showRow.value = true
    play('fanfare')
    say(t('app.adventure.lampsRow'), 0)
    later(() => {
      play('star')
      finished.value = true
    }, 2800)
    return
  }
  say(t('app.adventure.gameNext'), 0)
  later(() => {
    round.value++
    lamp.value = 0
    level.value = 0
    phase.value = 'ready'
    busy.value = false
    message.value = ''
  }, 1300)
}

function toggleTap() {
  if (busy.value || pouring.value) return
  tapMode.value = !tapMode.value
  say(t(tapMode.value ? 'app.adventure.lampsTapHint' : 'app.adventure.lampsHoldHint'), 3200)
}

// ---- the jug and the button: pointer (hold), keyboard (hold Space or Enter), and a click without them (a screen reader) pours one tap
let lastPress = 0
function onDown(e: PointerEvent) {
  if (e.button > 0) return
  e.preventDefault()
  lastPress = Date.now()
  press(true)
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  if (e.repeat) return
  lastPress = Date.now()
  press(false)
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  if (!tapMode.value) release()
}
function onClick() {
  if (Date.now() - lastPress < 700) return
  tapPour()
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.night)})` }"
        role="group"
        :aria-label="t('app.adventure.lampsField')"
      )
        div(class="gm-lamp" :class="{ lit: phase === 'lit' || phase === 'spill', cold: phase === 'low' }" :style="lampStyle" role="img" :aria-label="shownLamp.label")
          GameImage(:src="shownLamp.image" :ratio="0.8" :colour="phase === 'lit' || phase === 'spill' ? '#d9a441' : '#9a7a52'" :label="shownLamp.label")
          div(
            class="gm-glass"
            :style="glassStyle"
            role="meter"
            :aria-label="t('app.adventure.lampsOil')"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(level)"
          )
            div(class="gm-oil" :style="{ height: `${level}%`, backgroundImage: oilTile }")
          div(class="gm-mark-ring" :style="markStyle" role="img" :aria-label="game.mark.label")
            GameImage(:src="game.mark.image" :ratio="6" colour="#e8b830" :label="game.mark.label")
          template(v-if="phase === 'spill'")
            span(:key="drops" class="gm-drops" aria-hidden="true") 💧 💧 💧
          span(v-if="phase === 'lit'" class="gm-sign" aria-hidden="true")
            GameMark(kind="good")
          span(v-else-if="phase === 'low' || phase === 'spill'" class="gm-sign" aria-hidden="true")
            GameMark(kind="bad")
        button(
          type="button"
          class="gm-jug"
          :class="{ pouring }"
          :style="jugStyle"
          :aria-label="t('app.adventure.lampsJug')"
          :aria-pressed="pouring"
          @pointerdown="onDown"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @blur="release"
          @click="onClick"
        )
          GameImage(:src="game.jug.image" :ratio="0.9" colour="#a8693a" :label="game.jug.label")
        div(class="gm-shelf" aria-hidden="true")
          span(v-for="n in solved" :key="n" class="gm-tiny")
            GameImage(:src="game.lit.image" :ratio="0.8" colour="#d9a441" :label="game.lit.label")
        div(v-if="showRow" class="gm-view" role="img" :aria-label="t('app.adventure.lampsRow')")
          GameImage(:src="game.row" :ratio="1.5" colour="#2f2a4a" :label="t('app.adventure.lampsRow')")
          span(class="gm-sign big" aria-hidden="true")
            GameMark(kind="good")
      div(class="gm-tools")
        button(
          type="button"
          class="gm-btn pour"
          :disabled="busy"
          @pointerdown="onDown"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @blur="release"
          @click="onClick"
        ) {{ t('app.adventure.lampsPour') }}
        button(type="button" class="gm-btn" :class="{ on: tapMode }" :aria-pressed="tapMode" :disabled="busy" @click="toggleTap") {{ t('app.adventure.lampsTapMode') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.lampsCount', { n: solved, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lampsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1f2447
  background-size: cover
  background-position: center
  touch-action: none

// the lamp stands on its lower edge; the glass, the ring and the signs lie over its picture
.gm-lamp
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))

  &.lit
    filter: drop-shadow(0 0 14px rgba(255, 210, 90, 0.85))

  &.cold
    animation: gm-flicker 700ms ease-in-out

.gm-glass
  position: absolute
  overflow: hidden
  border-radius: 14%

// the oil fills the glass from below; the golden-brown colour stands under the picture so that it shows without it
.gm-oil
  position: absolute
  left: 0
  right: 0
  bottom: 0
  background-color: rgba(224, 160, 38, 0.9)
  background-size: 100% auto
  background-repeat: repeat-y
  transition: height 60ms linear

.gm-mark-ring
  position: absolute
  left: 50%
  transform: translate(-50%, -50%)
  z-index: 2

.gm-drops
  position: absolute
  left: 50%
  top: 8%
  transform: translateX(-50%)
  font-size: 1.4rem
  white-space: nowrap
  animation: gm-drip 1000ms ease-in both

.gm-sign
  position: absolute
  right: -10px
  top: -10px
  z-index: 6
  pointer-events: none

  &.big
    right: 8px
    top: 8px

.gm-jug
  position: absolute
  display: block
  min-width: 56px
  min-height: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  transform-origin: 80% 90%
  transition: transform 220ms ease
  cursor: pointer
  z-index: 3
  touch-action: none
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5))

  &.pouring
    transform: translate(-50%, -100%) rotate(-38deg)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 4px
    border-radius: 12px

.gm-shelf
  position: absolute
  left: 3%
  bottom: 3%
  display: flex
  gap: 4px
  z-index: 2

.gm-tiny
  display: block
  width: 26px

// the six burning lamps lie over the night
.gm-view
  position: absolute
  left: 4%
  right: 4%
  top: 50%
  transform: translateY(-50%)
  z-index: 8
  border-radius: 12px
  overflow: hidden
  border: 3px solid #fff6dc
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55)
  animation: gm-rise 420ms ease-out both

.gm-tools
  display: flex
  align-items: center
  justify-content: center
  flex-wrap: wrap
  gap: 12px

.gm-btn
  min-width: 120px
  min-height: 48px
  padding: 6px 18px
  border-radius: 999px
  border: 3px solid #d4a83e
  background: #fff6dc
  color: #3f321b
  font-size: 1.05rem
  font-weight: 900
  cursor: pointer
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &.pour
    background: #f3c85a

  &.on
    border-color: #2f7d4a
    box-shadow: 0 0 0 3px rgba(47, 125, 74, 0.45)

  &:disabled
    opacity: 0.5
    cursor: default

  &:focus-visible
    outline: 3px solid #5f4f35
    outline-offset: 2px

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@keyframes gm-flicker
  0%, 100%
    opacity: 1
  20%, 60%
    opacity: 0.55
  40%, 80%
    opacity: 1

@keyframes gm-drip
  from
    opacity: 1
    translate: 0 -10px
  to
    opacity: 0
    translate: 0 40px

@keyframes gm-rise
  from
    opacity: 0
    transform: translateY(-40%)
  to
    opacity: 1
    transform: translateY(-50%)

// less motion: nothing flickers, drips or tips over
@media (prefers-reduced-motion: reduce)
  .gm-lamp.cold, .gm-drops, .gm-view
    animation: none

  .gm-jug, .gm-oil
    transition: none
</style>
