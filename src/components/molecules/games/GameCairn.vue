<script setup lang="ts">
/**
 * A heap for two: on the hill in Gilead lie two big stones, Jacob's on the left and Laban's on the right. The child pushes both to the middle together: a tap on a side pushes the
 * stone of that side one step (two fingers, one for each stone, or one finger left and right in turn; the arrow keys do the same). A stone that is already a step ahead waits
 * kindly (no cross, no mistake). When both have come equally far they meet and a small stone lies on the heap, then the big ones go back and the next one is carried. Round 1: three
 * stones with a few steps, round 2: five stones with longer ways. There is no clock and no mistake, so the end always gives three stars. The arithmetic is `advance` in
 * `utils/jakobGames2.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { advance, arrived, heapSpot, PIC, type Pair, type Side } from '@/utils/jakobGames2'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { CairnGame } from '@/types/adventure'

const props = defineProps<{ game: CairnGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every small stone of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.stones, 0))

/** Width of the big and of the small stones (percent of the picture), and how far apart the big ones are when they meet. */
const BIG = 24
const SMALL = 11
const MEET = 5

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const pair = ref<Pair>({ left: 0, right: 0 })
/** Small stones that already lie on the heap in this round. */
const placed = ref(0)
const busy = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const waiting = ref<Side | null>(null)
const src = (p: string) => prependBaseUrl(p)

/** Where a big stone stands (percent of the picture): on the way from its start to its side of the middle. */
function stoneStyle(side: Side) {
  const [sx, sy] = side === 'left' ? props.game.leftStart : props.game.rightStart
  const [cx, cy] = props.game.centre
  const ex = cx + (side === 'left' ? -MEET : MEET)
  const p = Math.min(1, pair.value[side] / Math.max(1, current.value.steps))
  return { left: `${sx + (ex - sx) * p}%`, top: `${sy + (cy - sy) * p}%`, width: `${BIG}%` }
}

/** Where the small stone number `i` lies on the heap. */
function heapStyle(i: number) {
  const [cx, cy] = props.game.centre
  const spot = heapSpot(i, current.value.stones)
  return {
    left: `${cx + spot.x * SMALL * 0.9}%`,
    top: `${cy - spot.y * SMALL * 0.82 * PIC}%`,
    width: `${SMALL}%`,
    zIndex: String(10 + i)
  }
}

function push(side: Side) {
  if (busy.value || between.value || finished.value) return
  const r = advance(pair.value, side, current.value.steps)
  if (!r.moved) {
    // this side is a step ahead: the stone waits for the other one, nothing is lost
    waiting.value = side
    message.value = t('app.adventure.cairnWait')
    later(() => {
      if (waiting.value === side) waiting.value = null
    }, 600)
    return
  }
  pair.value = r.state
  message.value = ''
  play('tap')
  if (arrived(pair.value, current.value.steps)) meet()
}

function meet() {
  busy.value = true
  later(() => {
    placed.value++
    progress.mark()
    play('snap')
    pair.value = { left: 0, right: 0 }
    busy.value = false
    if (placed.value >= current.value.stones) roundOver()
  }, 500)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    placed.value = 0
    pair.value = { left: 0, right: 0 }
    between.value = false
    message.value = ''
  }, 1500)
}

function key(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') push('left')
  else if (e.key === 'ArrowRight') push('right')
  else return
  e.preventDefault()
}
</script>

<template lang="pug">
  div(class="ca")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ca-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ca-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        class="ca-field game-soft"
        :class="{ lit: placed >= current.stones }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.cairnField', { n: placed, total: current.stones })"
        :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }"
        @keydown="key"
      )
        span(v-for="i in placed" :key="`${round}-${i}`" class="ca-small" :style="heapStyle(i - 1)")
          GameImage(:src="game.stoneSmall ?? game.stoneLeft" :ratio="game.stoneSmall ? 110 / 90 : 220 / 180" round colour="#9a9488")
        span(
          v-if="!between"
          class="ca-big left"
          :class="{ wait: waiting === 'left', bump: busy }"
          :style="stoneStyle('left')"
          role="button"
          tabindex="-1"
          :aria-label="t('app.adventure.cairnPushLeft')"
          @click="push('left')"
        )
          GameImage(:src="game.stoneLeft" :ratio="220 / 180" round colour="#8d8576")
        span(
          v-if="!between"
          class="ca-big right"
          :class="{ wait: waiting === 'right', bump: busy }"
          :style="stoneStyle('right')"
          role="button"
          tabindex="-1"
          :aria-label="t('app.adventure.cairnPushRight')"
          @click="push('right')"
        )
          GameImage(:src="game.stoneRight" :ratio="220 / 180" round colour="#b3ab99")
      p(class="ca-fb" role="status") {{ message }}
      div(class="ca-push")
        button(type="button" class="ca-btn" :disabled="busy || between" @click="push('left')") {{ t('app.adventure.cairnPushLeft') }}
        button(type="button" class="ca-btn" :disabled="busy || between" @click="push('right')") {{ t('app.adventure.cairnPushRight') }}
      p(class="ca-count") {{ t('app.adventure.cairnCount', { n: placed, total: current.stones }) }}
    GameDone(v-else :stars="3" :text="t('app.adventure.cairnDone')" @next="emit('done', 3)")
</template>

<style scoped lang="sass">
.ca
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e4dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.ca-round
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

.ca-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ca-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9b48c
  background-size: cover
  background-position: center

  // the finished heap glows
  &.lit
    box-shadow: 0 0 0 4px rgba(255, 214, 90, 0.95), 0 0 18px rgba(255, 230, 120, 0.9)

.ca-big
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  transition: left 320ms ease, top 320ms ease
  cursor: pointer
  z-index: 5

  &.wait
    animation: ca-nod 500ms ease-in-out

  &.bump
    z-index: 30

.ca-small
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.ca-fb
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

// one button for each stone: two fingers can push both at once
.ca-push
  display: flex
  gap: 10px

.ca-btn
  flex: 1
  min-height: 56px
  padding: 8px 12px
  border-radius: 999px
  border: 3px solid #d4a83e
  background: #fff3cf
  color: #3f321b
  font-weight: 800
  font-size: 1rem
  cursor: pointer
  touch-action: manipulation

  &:active:not(:disabled)
    background: #ffe38a

  &:disabled
    opacity: 0.6

.ca-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes ca-nod
  0%, 100%
    transform: translate(-50%, -50%)
  30%
    transform: translate(-50%, -58%)
  60%
    transform: translate(-50%, -50%)

@media (prefers-reduced-motion: reduce)
  .ca-big
    transition: none

    &.wait
      animation: none
</style>
