<script setup lang="ts">
/**
 * Carry the grapes (Numbers 13,23): at the brook Eshcol the scouts cut off a vine with one cluster of grapes, and two men carry it on a pole. The two men walk along the path (a bar shows how far they have come) and the
 * pole wobbles, because they do not step in time. The child keeps it level: a button under the picture lifts the back end, another one lifts the front end (held down, they push the pole back). When the pole tips too
 * far for a moment, a berry falls off (a cross); the cluster is never bare. Round 2 goes over hills (the way rises and sinks) and wobbles more. Nobody loses: the way is always walked to the end; the stars come from
 * the berries that were lost. The arithmetic is in `utils/wuesteGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { TILT_GRACE, berriesLeft, grapesStep, tiltAfterFall, tiltedTooFar, wayShare, wobbleAt } from '@/utils/wuesteGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GrapesGame } from '@/types/adventure'

const props = defineProps<{ game: GrapesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every second of the way, in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.seconds, 0))

const TICK = 50
/** How far the pole turns at the full tilt (degrees). */
const TURN = 8
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const tilt = ref(0)
const time = ref(0)
const input = ref<-1 | 0 | 1>(0)
const over = ref(0)
const lost = ref(0)
const falling = ref<number[]>([])
const nextFall = ref(0)
const crossShown = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const marked = ref(0)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(lost.value, 1, 3))
const share = computed(() => wayShare(time.value, current.value.seconds) * 100)
const berries = computed(() => berriesLeft(props.game.berries, lost.value))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
/** On hills the whole group of the men and the pole rises and sinks a little (percent of the picture height). */
const lift = computed(() => (current.value.hills ? -3 * Math.sin(0.55 * time.value + 0.5) : 0))

function dropBerry() {
  if (props.game.berries - lost.value <= 1) return
  lost.value++
  tilt.value = tiltAfterFall(tilt.value)
  const id = nextFall.value++
  falling.value = [...falling.value, id]
  later(() => {
    falling.value = falling.value.filter((f) => f !== id)
  }, 900)
  play('wrong')
  message.value = t('app.adventure.grapesFall')
  crossShown.value = true
  later(() => {
    crossShown.value = false
  }, 900)
}

function endRound() {
  between.value = true
  input.value = 0
  message.value = t('app.adventure.grapesRoundDone')
  play('right')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => {
    round.value++
    time.value = 0
    tilt.value = 0
    over.value = 0
    marked.value = 0
    between.value = false
    message.value = ''
  }, 2400)
}

const timer = window.setInterval(() => {
  if (between.value || finished.value) return
  const dt = TICK / 1000
  tilt.value = grapesStep(tilt.value, time.value, dt, input.value, current.value.wobble, current.value.hills)
  time.value += dt
  const whole = Math.min(current.value.seconds, Math.floor(time.value))
  while (marked.value < whole) {
    progress.mark()
    marked.value++
  }
  if (tiltedTooFar(tilt.value)) {
    over.value += dt
    if (over.value >= TILT_GRACE) {
      over.value = 0
      dropBerry()
    }
  } else {
    over.value = 0
  }
  if (time.value >= current.value.seconds) endRound()
}, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function push(v: -1 | 0 | 1) {
  if (between.value || finished.value) return
  input.value = v
}
// the wobble of the way is also shown as a hint when the pole is about to tip
const warn = computed(() => Math.abs(tilt.value) > 0.6)
const wobbleNow = computed(() => wobbleAt(time.value, current.value.wobble, current.value.hills))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.grapesField')"
      )
        div(class="gm-group" :style="{ translate: `0 ${lift}%` }" :data-wobble="wobbleNow.toFixed(2)")
          img(
            v-for="(m, i) in game.men"
            :key="i"
            class="gm-man"
            :src="src(m.image)"
            alt=""
            draggable="false"
            :style="{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%` }"
          )
          div(
            class="gm-pole"
            :class="{ warn }"
            role="img"
            :aria-label="game.pole.label"
            :style="{ left: `${game.pole.x}%`, top: `${game.pole.y}%`, width: `${game.pole.w}%`, transform: `translate(-50%, -50%) rotate(${tilt * TURN}deg)` }"
          )
            img(:src="src(game.pole.image)" alt="" draggable="false")
          img(
            v-for="id in falling"
            :key="id"
            class="gm-berry"
            :src="src(game.berry.image)"
            alt=""
            draggable="false"
            :style="{ left: `${game.pole.x}%`, top: `${game.pole.y + 6}%`, width: `${game.berry.w}%` }"
          )
        span(v-if="crossShown" class="gm-cross" aria-hidden="true")
          GameMark(kind="bad")
      div(class="gm-way" role="progressbar" :aria-valuenow="Math.round(share)" aria-valuemin="0" aria-valuemax="100" :aria-label="t('app.adventure.grapesWay')")
        span(class="gm-way-fill" :style="{ width: `${share}%` }")
      div(class="gm-keys")
        button(
          type="button"
          class="gm-key"
          :class="{ on: input === -1 }"
          :disabled="between"
          @pointerdown.prevent="push(-1)"
          @pointerup="push(0)"
          @pointerleave="push(0)"
          @pointercancel="push(0)"
          @keydown.space.prevent="push(-1)"
          @keyup.space.prevent="push(0)"
        ) {{ t('app.adventure.grapesBack') }}
        button(
          type="button"
          class="gm-key"
          :class="{ on: input === 1 }"
          :disabled="between"
          @pointerdown.prevent="push(1)"
          @pointerup="push(0)"
          @pointerleave="push(0)"
          @pointercancel="push(0)"
          @keydown.space.prevent="push(1)"
          @keyup.space.prevent="push(0)"
        ) {{ t('app.adventure.grapesFront') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.grapesBerries', { n: berries, total: game.berries }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.grapesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
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
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fae6a
  background-size: cover
  background-position: center

.gm-group
  position: absolute
  inset: 0
  transition: translate 60ms linear

.gm-man
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

// the pole turns about its middle (the pole lies in the upper part of its picture, the cluster hangs below it)
.gm-pole
  position: absolute
  display: block
  transform-origin: 50% 18%
  pointer-events: none
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: auto

  &.warn
    filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.95))

.gm-berry
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  animation: gm-drop 900ms ease-in forwards

.gm-cross
  position: absolute
  left: 50%
  top: 18%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

.gm-way
  align-self: center
  width: 86%
  height: 16px
  border-radius: 999px
  overflow: hidden
  border: 2px solid #d4a83e
  background: rgba(255, 246, 220, 0.9)

.gm-way-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #8fc06a, #4f8f45)
  transition: width 120ms linear

.gm-keys
  display: flex
  justify-content: center
  gap: 12px

.gm-key
  flex: 1 1 0
  max-width: 46%
  min-height: 64px
  padding: 10px 12px
  border-radius: 999px
  border: 3px solid #b8892b
  background: linear-gradient(180deg, #ffe08a, #f0b43a)
  font-weight: 800
  font-size: 1.05rem
  color: #4b3512
  cursor: pointer
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &.on
    background: linear-gradient(180deg, #f0b43a, #d99a22)
    transform: scale(0.97)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

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

@keyframes gm-drop
  0%
    opacity: 1
    translate: 0 0
  100%
    opacity: 0
    translate: 0 700%

@media (prefers-reduced-motion: reduce)
  .gm-group, .gm-way-fill
    transition: none

  .gm-berry
    animation: none
    opacity: 0
</style>
