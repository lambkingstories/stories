<script setup lang="ts">
/**
 * Shout louder (Mark 10,46-49): Bartimaeus sits by the road before Jericho and hears that Jesus is going by. Above him on the road Jesus, the disciples and a crowd walk from left to right. A big button "Call out" (and
 * Bartimaeus himself) fills the calling bar with every tap. From time to time the crowd says "Quiet!" (a speech bubble at the top, with a word, so not only a sign) and pushes the bar back a little. Whoever calls louder
 * (taps more often) fills it. The clock runs from the first tap, so no one is hurried before he has begun, and there is no ticking sound. Round 1: bar full in 12 seconds (25 taps, the crowd hushes twice), round 2: 14 seconds
 * (35 taps, four times). Bar full: the group stops, a man of the crowd waves "Come!". Time over without a full bar: a mistake (a cross, a word, a dull sound), the group walks on and the round begins again. The steps of the
 * bar count as parts of the task (ten a round, the best level of the round), so "Go on (1 star)" is offered from 60 % of the bar in round 1. The arithmetic is in `utils/heilungGames.ts`; the dice are seeded.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { SHOUT_STEPS, heilungStars, shoutFull, shoutGroupX, shoutHushTimes, shoutPercent, shoutRoundParts, shoutStart, shoutTap, shoutTick } from '@/utils/heilungGames'
import type { ShoutState } from '@/utils/heilungGames'
import { seeded } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ShoutGame } from '@/types/adventure'

const props = defineProps<{ game: ShoutGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: ten steps of the bar in every round
progress.setGoal(props.game.rounds.length * SHOUT_STEPS)

const TICK = 0.1
/** Where the bubbles of the crowd appear (percent of the width), one after the other. */
const BUBBLE_X = [24, 52, 78]
const BUBBLE_WORDS = ['shoutPsst1', 'shoutPsst2', 'shoutPsst3'] as const

interface Bubble {
  id: number
  x: number
  text: string
}

const round = ref(0)
const attempt = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const state = ref<ShoutState>(shoutStart())
let times: number[] = []
const bubbles = ref<Bubble[]>([])
let bubbleSeq = 0
let hushCount = 0
const won = ref(false)
const lost = ref(false)
const finished = ref(false)
const misses = ref(0)
const solved = ref(0)
/** The highest the bar has been in this round (in taps); the crowd pushing it back does not take the parts away. */
const best = ref(0)
const roundParts = ref(0)
const callSeq = ref(0)
const calling = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => heilungStars(misses.value, props.game.rounds.length))
const percent = computed(() => shoutPercent(state.value, current.value))
const groupX = computed(() => shoutGroupX(state.value.time, current.value.seconds, props.game.group.from, props.game.group.to))
const waverX = computed(() => Math.min(96, Math.max(4, groupX.value + props.game.waver.dx)))
const locked = computed(() => won.value || lost.value)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The steps of the bar that were reached for the first time are marked as parts of the task (each part once). */
function syncParts(full: boolean) {
  const want = shoutRoundParts(best.value, current.value.need, full)
  while (roundParts.value < want) {
    progress.mark()
    roundParts.value++
  }
}

function startAttempt() {
  const rand = seeded(41 + round.value * 29 + attempt.value * 5)
  state.value = shoutStart()
  times = shoutHushTimes(current.value, rand)
  bubbles.value = []
  hushCount = 0
  won.value = false
  lost.value = false
}
startAttempt()

function showBubble() {
  const id = ++bubbleSeq
  const n = hushCount++
  bubbles.value.push({ id, x: BUBBLE_X[n % BUBBLE_X.length]!, text: t(`app.adventure.${BUBBLE_WORDS[(round.value + n) % BUBBLE_WORDS.length]!}`) })
  later(() => {
    bubbles.value = bubbles.value.filter((b) => b.id !== id)
  }, 1700)
}

function lose() {
  lost.value = true
  misses.value++
  play('wrong')
  say(t('app.adventure.shoutLate'), 0)
  later(() => {
    attempt.value++
    startAttempt()
    message.value = ''
  }, 2000)
}

function win() {
  won.value = true
  solved.value++
  syncParts(true)
  bubbles.value = []
  play('right')
  say(t('app.adventure.shoutStop'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2800)
    return
  }
  later(() => {
    say(t('app.adventure.gameNext'), 0)
  }, 1400)
  later(() => {
    round.value++
    attempt.value = 0
    best.value = 0
    roundParts.value = 0
    startAttempt()
    message.value = ''
  }, 3200)
}

function tick() {
  if (finished.value || locked.value || !state.value.started) return
  const r = shoutTick(state.value, TICK, current.value, times)
  state.value = r.state
  if (r.hush) {
    showBubble()
    play('flip')
  }
  if (r.timeUp) lose()
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** One call: the bar rises by one tap. */
function call() {
  if (finished.value || locked.value) return
  const first = !state.value.started
  state.value = shoutTap(state.value, current.value)
  best.value = Math.max(best.value, state.value.level)
  callSeq.value++
  calling.value = true
  later(() => {
    calling.value = false
  }, 160)
  play('tap')
  if (first) say(t('app.adventure.shoutCall'), 2200)
  syncParts(false)
  if (shoutFull(state.value, current.value)) win()
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.shoutField')"
      )
        div(
          :key="`group-${round}-${attempt}`"
          class="gm-group"
          :class="{ leaving: lost }"
          :style="{ left: lost ? '120%' : `${groupX}%`, top: `${game.group.y}%`, width: `${game.group.w}%` }"
          role="img"
          :aria-label="game.group.label"
        )
          GameImage(:src="game.group.image" :ratio="1.3" colour="#e0b84a" :label="game.group.label")
        div(
          v-if="won"
          class="gm-waver"
          :style="{ left: `${waverX}%`, top: `${game.waver.y}%`, width: `${game.waver.w}%` }"
          role="img"
          :aria-label="game.waver.label"
        )
          GameImage(:src="game.waver.image" :ratio="0.55" colour="#c98c5a" :label="game.waver.label")
          span(class="gm-come") {{ t('app.adventure.shoutComeWord') }}
        span(
          v-for="b in bubbles"
          :key="b.id"
          class="gm-psst"
          :style="{ left: `${b.x}%` }"
          role="status"
        ) {{ b.text }}
        button(
          type="button"
          class="gm-bart"
          :class="{ calling: calling }"
          :style="{ left: `${game.bartimaeus.x}%`, top: `${game.bartimaeus.y}%`, width: `${game.bartimaeus.w}%` }"
          :aria-label="t('app.adventure.shoutBart')"
          :disabled="locked"
          @click="call"
        )
          GameImage(:src="game.bartimaeus.image" :ratio="0.7" colour="#a5835a" :label="game.bartimaeus.label")
          span(v-if="callSeq > 0 && locked === false" :key="callSeq" class="gm-wave" aria-hidden="true")
          span(v-if="lost" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      div(
        class="gm-meter"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="percent"
        :aria-label="t('app.adventure.shoutMeter')"
      )
        span(class="gm-fill" :style="{ width: `${percent}%` }")
        span(class="gm-pct" aria-hidden="true") {{ percent }} %
      button(type="button" class="gm-shout" :class="{ pressed: calling }" :disabled="locked" @click="call")
        span(aria-hidden="true") »
        span {{ t('app.adventure.shoutButton') }}
        span(aria-hidden="true") «
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.shoutCount', { n: solved, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shoutDone')" @next="emit('done', stars)")
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
  background-color: #b9a77a
  background-size: cover
  background-position: center

// the group of Jesus walks along the road; when the time is over it walks out of the picture
.gm-group
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  transition: left 100ms linear
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &.leaving
    transition: left 1600ms ease-in

.gm-waver
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  transform-origin: 50% 100%
  animation: gm-wave-hand 600ms ease-in-out infinite alternate
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-come
  position: absolute
  left: 50%
  top: -14px
  transform: translate(-50%, -100%)
  padding: 2px 12px
  border-radius: 14px
  border: 2px solid #d4a83e
  background: #fffaf0
  color: #3f321b
  font-weight: 900
  white-space: nowrap

// the speech bubbles of the crowd at the top
.gm-psst
  position: absolute
  top: 6%
  transform: translateX(-50%)
  padding: 3px 14px
  border-radius: 14px
  border: 2px solid #8a7a5a
  background: #fffaf0
  color: #5f4f35
  font-weight: 900
  font-size: 1.05rem
  white-space: nowrap
  z-index: 6
  animation: gm-pop 300ms ease-out both

// Bartimaeus: the button is as wide as the picture (at least 56 pixels); his feet are at the place of the data
.gm-bart
  position: absolute
  display: block
  min-width: 56px
  min-height: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 4
  transition: scale 120ms ease
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &:disabled
    cursor: default

  &.calling
    scale: 1.06

// a ring of sound goes out from his mouth with every call
.gm-wave
  position: absolute
  left: 50%
  top: 18%
  display: block
  width: 60%
  aspect-ratio: 1
  margin-left: -30%
  border-radius: 50%
  border: 3px solid rgba(255, 255, 255, 0.85)
  pointer-events: none
  animation: gm-ring 420ms ease-out forwards

.gm-cross
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 40

// the calling bar: full width, high enough to be read; the number is written in it as well
.gm-meter
  position: relative
  height: 30px
  overflow: hidden
  border-radius: 999px
  border: 3px solid #d4a83e
  background: #fff6dc

.gm-fill
  position: absolute
  left: 0
  top: 0
  bottom: 0
  display: block
  background: linear-gradient(90deg, #f0b848, #f5d36b)
  transition: width 140ms ease-out

.gm-pct
  position: absolute
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  font-weight: 900
  font-size: 0.95rem
  color: #3f321b

// the big button: at least 88 pixels high
.gm-shout
  display: flex
  align-items: center
  justify-content: center
  gap: 12px
  min-height: 88px
  padding: 8px 10px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f2e4b8
  color: #3f321b
  font-family: inherit
  font-weight: 900
  font-size: 1.4rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: background 100ms ease, scale 100ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.pressed
    background: #e2c46e
    scale: 0.98

  &:disabled
    opacity: 0.7
    cursor: default

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

@keyframes gm-ring
  from
    opacity: 1
    scale: 0.4
  to
    opacity: 0
    scale: 1.7

@keyframes gm-pop
  from
    opacity: 0
    scale: 0.6
  to
    opacity: 1
    scale: 1

@keyframes gm-wave-hand
  from
    rotate: -4deg
  to
    rotate: 4deg

// less motion: the group and the bar jump instead of gliding, nothing waves or rings
@media (prefers-reduced-motion: reduce)
  .gm-group, .gm-group.leaving, .gm-fill, .gm-bart, .gm-shout
    transition: none

  .gm-waver, .gm-psst
    animation: none

  .gm-wave
    animation: none
    opacity: 0
</style>
