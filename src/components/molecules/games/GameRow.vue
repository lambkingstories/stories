<script setup lang="ts">
/**
 * Row against the wind (Mark 6,48): at night the disciples strain at the oars, for the wind is against them. We look down on the dark lake; the boat lies at the bottom, the far shore with its lights is at the top. Two big
 * areas, left and right, are the two oars. The left oar turns the bow to the right, the right oar to the left, and every stroke moves the boat on. The wind turns the bow too (the little arrows say to which side), so whoever rows
 * left and right in turn, and a little more on the side against the wind, keeps the boat straight and gets on; whoever rows on one side only turns it round (a stroke on a crooked boat counts only half). Round 1: 30 strokes and a
 * light wind, round 2: 45 strokes and a stronger wind from the other side. At the end Jesus stands on the water beside the boat. There is no mistake; the stars come from the seconds of rowing (`rowStars`; a pause counts three
 * seconds at most). After fifteen seconds without a stroke the button "Help me row" rows four strokes. The arithmetic is in `utils/wunderGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { ROW_STRAIGHT, rowActive, rowArrived, rowBoatY, rowDrift, rowHelpSide, rowStars, rowSway, rowTap } from '@/utils/wunderGames'
import type { RowState, Side } from '@/utils/wunderGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RowGame } from '@/types/adventure'

const props = defineProps<{ game: RowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every stroke of the way of every round (a stroke on a crooked boat counts half, so some strokes more are needed)
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.distance, 0))

const TICK = 0.1
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const boat = ref<RowState>({ heading: 0, progress: 0 })
const sway = ref(0)
/** The wind only blows once the first stroke is made (no one is pushed off before the game has begun). */
const started = ref(false)
const lastSide = ref<Side | null>(null)
const splash = ref<Side | null>(null)
let lastTap = 0
const seconds = ref(0)
const idle = ref(0)
const between = ref(false)
const arrived = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => rowStars(seconds.value))
const total = computed(() => progress.goal.value)
const boatY = computed(() => rowBoatY(boat.value.progress, current.value.distance, props.game.start, props.game.goal))
const crooked = computed(() => Math.abs(boat.value.heading) > ROW_STRAIGHT)
const windText = computed(() => (current.value.wind >= 0 ? t('app.adventure.rowWindR') : t('app.adventure.rowWindL')))
const windArrows = computed(() => (current.value.wind >= 0 ? '→' : '←').repeat(Math.abs(current.value.wind) > 2 ? 2 : 1))
/** The sum of the strokes of the finished rounds plus this one (for the count). */
const done = computed(() => progress.parts.value)
/** The line under the lake: what happened (the end of a round), otherwise the warning that the boat turns. */
const shown = computed(() => message.value || (crooked.value && !between.value ? t('app.adventure.rowTurn') : ''))

function tick() {
  if (finished.value || between.value || !started.value) return
  idle.value += TICK
  boat.value = rowDrift(boat.value, current.value.wind, TICK)
  sway.value = rowSway(sway.value, boat.value.heading, TICK)
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function pull(side: Side) {
  if (between.value || finished.value) return
  const now = Date.now()
  seconds.value += lastTap ? rowActive(now - lastTap) : 0.5
  lastTap = now
  idle.value = 0
  started.value = true
  lastSide.value = side
  splash.value = side
  later(() => {
    if (splash.value === side) splash.value = null
  }, 220)
  const before = Math.floor(boat.value.progress)
  boat.value = rowTap(boat.value, side)
  sway.value = rowSway(sway.value, boat.value.heading, TICK)
  // every full stroke of the way is one part of the task
  for (let k = before; k < Math.min(Math.floor(boat.value.progress), current.value.distance); k++) progress.mark()
  play('tap')
  if (!rowArrived(boat.value, current.value.distance)) return
  between.value = true
  arrived.value = true
  boat.value = { heading: 0, progress: boat.value.progress }
  sway.value = 0
  if (lastRound.value) {
    message.value = t('app.adventure.rowJesus')
    play('right')
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  message.value = t('app.adventure.gameNext')
  play('right')
  later(() => {
    round.value++
    boat.value = { heading: 0, progress: 0 }
    sway.value = 0
    started.value = false
    arrived.value = false
    between.value = false
    message.value = ''
    lastTap = 0
    idle.value = 0
  }, 2000)
}

/** The button for those who cannot keep the boat straight: four strokes, always against the turn. */
function helpMe() {
  for (let i = 0; i < 4; i++) {
    later(() => {
      if (between.value || finished.value) return
      pull(rowHelpSide(boat.value.heading, lastSide.value))
    }, i * 260)
  }
}
</script>

<template lang="pug">
  div(class="gm" tabindex="0" @keydown.left.prevent="pull('left')" @keydown.right.prevent="pull('right')")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.rowField')"
      )
        div(class="gm-wind")
          span(class="gm-wind-arrows" aria-hidden="true") {{ windArrows }}
          span {{ windText }}
        div(
          class="gm-boat"
          :style="{ left: `${50 + sway}%`, top: `${boatY}%`, width: `${game.boat.w}%`, transform: `translate(-50%, -50%) rotate(${boat.heading}deg)` }"
          role="img"
          :aria-label="game.boat.label"
        )
          GameImage(:src="game.boat.image" :ratio="game.boat.ratio" colour="#a5835a" :label="game.boat.label")
          span(v-if="splash" class="gm-splash" :class="splash" aria-hidden="true")
        div(
          v-if="arrived && lastRound"
          class="gm-jesus"
          :style="{ left: `${game.jesus.x}%`, top: `${game.jesus.y}%`, width: `${game.jesus.w}%` }"
          role="img"
          :aria-label="game.jesus.label"
        )
          GameImage(:src="game.jesus.image" :ratio="0.55" colour="#efe3c0" :label="game.jesus.label")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.rowCount', { n: done, total }) }}
      div(class="gm-oars" role="group")
        button(type="button" class="gm-oar left" :class="{ pressed: splash === 'left' }" :disabled="between" @click="pull('left')")
          span(aria-hidden="true") ◀
          span {{ t('app.adventure.rowLeft') }}
        button(type="button" class="gm-oar right" :class="{ pressed: splash === 'right' }" :disabled="between" @click="pull('right')")
          span {{ t('app.adventure.rowRight') }}
          span(aria-hidden="true") ▶
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.rowHelp') }}
      p(class="gm-fb" role="status") {{ shown }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.rowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2c3d58
  box-shadow: inset 0 0 18px rgba(0, 0, 20, 0.4)
  user-select: none
  -webkit-user-select: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

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
  color: #3f4a5f

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #eef0f6

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1d2f52
  background-size: cover
  background-position: center

.gm-wind
  position: absolute
  right: 6px
  top: 6px
  z-index: 4
  display: flex
  align-items: center
  gap: 6px
  padding: 2px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.9)
  color: #3f4a5f
  font-weight: 800
  font-size: 0.78rem
  line-height: 1.3

.gm-wind-arrows
  font-size: 1.05rem
  letter-spacing: 1px

.gm-boat
  position: absolute
  display: block
  pointer-events: none
  z-index: 3
  transition: left 120ms linear, top 160ms linear, transform 120ms ease-out
  filter: drop-shadow(0 4px 4px rgba(0, 0, 20, 0.5))

// a ring on the water beside the boat where the oar went in
.gm-splash
  position: absolute
  top: 50%
  display: block
  width: 36%
  aspect-ratio: 1
  margin-top: -18%
  border-radius: 50%
  border: 3px solid rgba(255, 255, 255, 0.85)
  animation: gm-ring 220ms ease-out forwards

  &.left
    left: -30%

  &.right
    right: -30%

.gm-jesus
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  animation: gm-appear 900ms ease-out both

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #3f4a5f

// the two oars: big areas, each half of the width, at least 88 pixels high
.gm-oars
  display: flex
  gap: 10px

.gm-oar
  flex: 1
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  min-height: 88px
  padding: 8px 10px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f2e4b8
  color: #3f321b
  font-family: inherit
  font-weight: 900
  font-size: 1.15rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: background 120ms ease, scale 120ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.pressed
    background: #e2c46e
    scale: 0.97

  &:disabled
    opacity: 0.7
    cursor: default

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
    scale: 1.3

@keyframes gm-appear
  from
    opacity: 0
    translate: 0 8px
  to
    opacity: 1
    translate: 0 0

@media (prefers-reduced-motion: reduce)
  .gm-boat, .gm-oar
    transition: none

  .gm-splash, .gm-jesus
    animation: none
</style>
