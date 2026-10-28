<script setup lang="ts">
/**
 * Hold the morning light: at the river bank it is still night (the picture of the stage, dimmed by the app). A soft light lies on the ground. The child puts a finger on it
 * and holds it: as long as the finger stays on the light the sky grows brighter, a little at a time, until the sun comes up. A finger that lets go changes nothing, the
 * morning waits, nothing goes back and nothing is lost. Round 1 the light stays where it is (10 seconds of holding in all, the seconds add up); round 2 it wanders slowly along the bank
 * (15 seconds), and the finger goes along; when the finger loses it, the morning stands still until the finger is on the light again. There is no enemy, no mistake and no
 * clock. For everybody who cannot hold for long there is the button "Tap instead of holding". The arithmetic is in `utils/jakobGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { holdProgress, onSpark, pointAt, wholePercent } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { HoldGame } from '@/types/adventure'

const props = defineProps<{ game: HoldGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: the morning in percent over both rounds
progress.setGoal(100)

/** The light counts as held when the finger is within this share of the width of the picture. */
const RADIUS = 10
/** The picture is 3 : 2: a percent of the height is two thirds of a percent of the width. */
const RATIO = 2 / 3
const TICK = 0.1

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** How far the morning has come in this round (0 to 1). */
const part = ref(0)
const credited = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const finger = ref<{ x: number; y: number } | null>(null)
const stars = 3
const src = (p: string) => prependBaseUrl(p)

const percent = computed(() => wholePercent(round.value, rounds.value.length, part.value))
/** Where the light lies: it stays, or it wanders along the way as the morning comes. */
const spark = computed<{ x: number; y: number }>(() => {
  const path = current.value.path
  const p = path && path.length ? pointAt(path, part.value, RATIO) : props.game.start
  return { x: p[0], y: p[1] }
})
const held = computed(() => !!finger.value && onSpark(finger.value, spark.value, RADIUS, RATIO))
const sparkStyle = computed(() => ({ left: `${spark.value.x}%`, top: `${spark.value.y}%` }))
/** The night gets lighter as the morning comes, and the last part of the sky turns warm. */
const nightStyle = computed(() => ({ opacity: String(0.7 * (1 - percent.value / 100)) }))
const dawnStyle = computed(() => ({ opacity: String(Math.max(0, (percent.value - 40) / 60) * 0.5) }))

function credit() {
  const target = percent.value
  for (let i = credited.value; i < target; i++) progress.mark()
  credited.value = Math.max(credited.value, target)
}

const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))
function tick() {
  if (between.value || finished.value) return
  if (!held.value) return
  part.value = holdProgress(part.value, TICK, true, current.value.seconds)
  advance()
}

/** The way of a tap instead of holding: a tenth of the round. */
function tapStep() {
  if (between.value || finished.value) return
  part.value = Math.min(1, Math.round((part.value + 0.1) * 1e6) / 1e6)
  play('tap')
  advance()
}

function advance() {
  credit()
  if (part.value >= 1) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    // the last of the percent are counted: the whole morning is there
    credit()
    between.value = true
    message.value = t('app.adventure.holdSunrise')
    play('star')
    later(() => {
      finished.value = true
    }, 1600)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    part.value = 0
    between.value = false
    message.value = ''
  }, 1500)
}

const fieldEl = ref<HTMLElement | null>(null)
function pointOf(e: PointerEvent) {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / h) * 100 }
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  finger.value = pointOf(e)
  message.value = onSpark(finger.value, spark.value, RADIUS, RATIO) ? '' : t('app.adventure.holdLost')
}
function move(e: PointerEvent) {
  if (!finger.value || between.value || finished.value) return
  finger.value = pointOf(e)
  if (held.value) message.value = ''
}
function lift() {
  finger.value = null
}
</script>

<template lang="pug">
  div(class="hd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="hd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="hd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="fieldEl"
        class="hd-field game-soft soft-only"
        role="group"
        :aria-label="t('app.adventure.holdField')"
        :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="lift"
        @pointercancel="lift"
        @pointerleave="lift"
      )
        div(class="hd-night" :style="nightStyle")
        div(class="hd-dawn" :style="dawnStyle")
        img(:src="src(game.spark)" alt="" draggable="false" class="hd-spark" :class="{ held }" :style="sparkStyle")
      p(class="hd-fb" role="status") {{ message }}
      p(class="hd-count") {{ t('app.adventure.holdPercent', { n: percent }) }}
      div(class="hd-actions")
        AdvButton(tone="blau" small :disabled="between" @click="tapStep") {{ t('app.adventure.holdTap') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.holdDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2c3358
  box-shadow: inset 0 0 18px rgba(0, 0, 20, 0.5)

.hd-round
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

.hd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

.hd-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1a2142
  background-size: cover
  background-position: center
  touch-action: none
  user-select: none
  -webkit-user-select: none

// the night over the picture: the app only dims the picture and takes the dimming away as the morning comes
.hd-night
  position: absolute
  inset: 0
  background: #0a1030
  pointer-events: none
  transition: opacity 300ms linear

.hd-dawn
  position: absolute
  inset: 0
  background: linear-gradient(0deg, rgba(255, 190, 110, 0.9) 0%, rgba(255, 214, 150, 0.4) 45%, rgba(255, 214, 150, 0) 80%)
  pointer-events: none
  transition: opacity 300ms linear

.hd-spark
  position: absolute
  width: 13%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 0 10px rgba(255, 230, 140, 0.9))
  transition: left 300ms linear, top 300ms linear

  &.held
    filter: drop-shadow(0 0 22px rgba(255, 240, 170, 1)) brightness(1.2)

.hd-fb
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

.hd-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #f3e6bf

.hd-actions
  display: flex
  justify-content: center

@media (prefers-reduced-motion: reduce)
  .hd-night,
  .hd-dawn,
  .hd-spark
    transition: none
</style>
