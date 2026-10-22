<script setup lang="ts">
/**
 * Three times a day: Daniel's upper room, a wide open window toward the west, behind it the sky and the city. The sun crosses the sky in an arc (a painted sun that the app moves). Three golden marks lie on the arc
 * (morning, noon, evening). When the sun stands on a mark the child taps Daniel: he kneels and prays (a soft tone, a tick). A tap at any other time is a mistake (a cross, quiet), and a prayer time that goes by
 * without a tap is a mistake, too (Daniel stands still, nothing is lost). Round 1: one day, a wide time window; round 2: two days, a faster sun and a narrower window. The sun waits a moment before the day
 * begins, never at once. With "reduce motion" the days are longer. The marks and the windows are `sunOnArc`, `PRAYER_MARKS` and `prayerAt` in `utils/danielGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { PRAYER_MARKS, prayerAt, prayerTotal, sunOnArc } from '@/utils/danielGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HoursGame } from '@/types/adventure'

const props = defineProps<{ game: HoursGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every prayer time of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + prayerTotal(r), 0))

/** The time the sun waits before a day begins (the first day of a round), and between two days. */
const LEAD_MS = 2200
const GAP_MS = 1300
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const day = ref(0)
/** How far the day has gone (ms); negative while the sun waits. */
const clock = ref(-LEAD_MS)
const state = reactive<Record<number, 'hit' | 'missed'>>({})
const misses = ref(0)
const praying = ref(false)
const between = ref(false)
/** The round is over and the next one is about to begin. */
const nextRound = ref(false)
const finished = ref(false)
const message = ref('')
const wrong = ref(0)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const dayMs = computed(() => current.value.dayMs * (reduced ? 1.3 : 1))
const win = computed(() => ({ dayMs: dayMs.value, windowMs: current.value.windowMs }))
const sun = computed(() => sunOnArc(clock.value < 0 ? 0 : clock.value / dayMs.value))
const markPos = PRAYER_MARKS.map((p) => sunOnArc(p))
const active = computed(() => (clock.value < 0 || between.value ? -1 : prayerAt(clock.value, win.value)))

let last = Date.now()
const timer = window.setInterval(() => {
  const nowMs = Date.now()
  const dt = Math.min(250, nowMs - last)
  last = nowMs
  if (between.value || finished.value) return
  clock.value += dt
  // a prayer time whose window is over without a tap is missed
  PRAYER_MARKS.forEach((p, i) => {
    if (!state[i] && clock.value > p * dayMs.value + current.value.windowMs) {
      state[i] = 'missed'
      misses.value++
      play('wrong')
      message.value = t('app.adventure.hoursMissed')
    }
  })
  if (clock.value >= dayMs.value) dayOver()
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

function pray() {
  if (between.value || finished.value || clock.value < 0) return
  const i = prayerAt(clock.value, win.value)
  if (i >= 0 && !state[i]) {
    state[i] = 'hit'
    progress.mark()
    play('basket')
    message.value = t('app.adventure.hoursPray')
    praying.value = true
    later(() => {
      praying.value = false
    }, 1400)
    return
  }
  if (i >= 0) return
  misses.value++
  wrong.value++
  play('wrong')
  message.value = t('app.adventure.hoursOff')
}

function dayOver() {
  between.value = true
  if (day.value + 1 < current.value.days) {
    later(() => {
      day.value++
      for (const k of Object.keys(state)) delete state[Number(k)]
      clock.value = -GAP_MS
      last = Date.now()
      between.value = false
      message.value = ''
    }, 1500)
    return
  }
  play('star')
  message.value = t('app.adventure.hoursRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1800)
    return
  }
  nextRound.value = true
  later(() => {
    nextRound.value = false
    round.value++
    day.value = 0
    for (const k of Object.keys(state)) delete state[Number(k)]
    clock.value = -LEAD_MS
    last = Date.now()
    between.value = false
    message.value = ''
  }, 2200)
}

/** A place on the arc (percent of the arc box) in percent of the picture: the arc lies inside the window of the frame. */
const inWindow = (p: { x: number; y: number }) => ({ left: `${props.game.window.x + (p.x / 100) * props.game.window.w}%`, top: `${props.game.window.y + (p.y / 100) * props.game.window.h}%` })
const sunStyle = computed(() => inWindow(sun.value))
const markStyle = (i: number) => inWindow(markPos[i]!)
const names = ['hoursMorning', 'hoursNoon', 'hoursEvening']
</script>

<template lang="pug">
  div(class="hr")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="hr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="hr-hint") {{ nextRound ? t('app.adventure.gameNext') : current.hint }}
      div(class="hr-field")
        img(:src="src(game.sky)" alt="" class="hr-sky" draggable="false")
        span(
          v-for="(p, i) in markPos"
          :key="`m-${i}`"
          class="hr-mark"
          :class="{ on: active === i, hit: state[i] === 'hit', missed: state[i] === 'missed' }"
          :style="markStyle(i)"
          aria-hidden="true"
        )
        span(class="hr-sun" :style="sunStyle" aria-hidden="true")
          GameImage(:src="game.sun" colour="#f3c94a" round)
        img(:src="src(game.frame)" alt="" class="hr-frame" draggable="false")
        button(
          type="button"
          class="hr-daniel"
          :class="{ glow: active >= 0 && state[active] !== 'hit' }"
          :aria-label="t('app.adventure.hoursDaniel')"
          @click="pray"
          @keydown.space.prevent="pray"
        )
          GameImage(:src="praying ? game.kneeling : game.standing" :ratio="praying ? 1.1 : 0.55" colour="#3d5fa0")
          GameMark(v-if="wrong > 0 && !praying" :key="wrong" kind="bad" class="hr-x")
      ul(class="hr-times" role="list")
        li(v-for="(n, i) in names" :key="n" :class="{ hit: state[i] === 'hit', missed: state[i] === 'missed', on: active === i }")
          span(class="hr-sign" aria-hidden="true") {{ state[i] === 'hit' ? '✓' : state[i] === 'missed' ? '✗' : '○' }}
          | {{ t(`app.adventure.${n}`) }}
      p(class="hr-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hoursDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e4d3ae
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.hr-round
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

.hr-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.hr-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fb4d8
  background-size: cover
  background-position: center

.hr-sky
  position: absolute
  left: 0
  top: -24%
  width: 100%
  pointer-events: none

.hr-sun
  position: absolute
  display: block
  width: 9%
  transform: translate(-50%, -50%)
  pointer-events: none

// the golden marks on the arc: a ring that lights up when the sun is there
.hr-mark
  position: absolute
  display: block
  width: 6%
  aspect-ratio: 1
  border: 3px solid rgba(255, 224, 120, 0.9)
  border-radius: 50%
  transform: translate(-50%, -50%)
  pointer-events: none
  opacity: 0.7

  &.on
    opacity: 1
    background: rgba(255, 224, 120, 0.5)
    box-shadow: 0 0 14px 4px rgba(255, 224, 120, 0.85)

  &.hit
    background: rgba(120, 200, 120, 0.6)
    border-color: #2f6b3f

  &.missed
    border-style: dashed
    opacity: 0.4

.hr-frame
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none

// Daniel: the lower edge on the floor of the room; a tap anywhere on him (and around him) counts
.hr-daniel
  position: absolute
  left: 36%
  bottom: 2%
  width: 32%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translateX(-50%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -14px

  &.glow
    filter: drop-shadow(0 0 10px #ffe88a)

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 12px

.hr-x
  position: absolute
  top: 4px
  right: 0

.hr-times
  display: flex
  justify-content: center
  gap: 8px
  flex-wrap: wrap
  margin: 0
  padding: 0
  list-style: none

  li
    display: inline-flex
    align-items: center
    gap: 4px
    padding: 2px 12px
    border-radius: 999px
    border: 2px solid #b8923a
    background: rgba(255, 246, 220, 0.92)
    font-weight: 800
    font-size: 0.95rem
    color: #5f4f35

    &.on
      background: #f4d36a

    &.hit
      border-color: #2f6b3f
      color: #2f6b3f

    &.missed
      border-style: dashed
      color: #9a3f2b

.hr-fb
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
</style>
