<script setup lang="ts">
/**
 * Two cows pull home: a pale road runs from the bottom of the picture toward a town on a hill and the cart with the two cows and the ark of the covenant goes up it all by itself (it gets smaller as it goes). The cows low and do not look where they go: they are drawn to the grass
 * now on the one side, now on the other (`driftVelocity`). The child taps the left or the right half of the picture and the cart is nudged to that side, back toward the middle. If a wheel touches the grass the cows stop to graze
 * (a cross, one mistake, a short pause) and the cart stands in the middle of the road again. When the cart has come to the top the round is done. Round 1 drifts gently, round 2 more strongly. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { driftStep, GRAZE_MS, nudge, onRoad, ROAD_HALF, wayProgress } from '@/utils/samuelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CowsGame } from '@/types/adventure'

const props = defineProps<{ game: CowsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one way home for each round
progress.setGoal(props.game.rounds.length)

const TICK = 40
const round = ref(0)
/** How long the cart has been going in this round (ms; it stands still while the cows graze). */
const elapsed = ref(0)
/** The sideways place of the cart: 0 is the middle of the road, 100 the right edge. */
const x = ref(0)
const grazing = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 3, 7))
const way = computed(() => wayProgress(elapsed.value, current.value.dur))
/** The cart goes up the road: it gets smaller and the road narrower the farther it is (the road is a straight line in the picture). */
const cartStyle = computed(() => {
  const r = props.game.road
  const t = way.value
  const half = r.half0 + (r.half1 - r.half0) * t
  const cx = r.cx0 + (r.cx1 - r.cx0) * t
  return {
    left: `${cx + (x.value / ROAD_HALF) * half}%`,
    top: `${r.y0 + (r.y1 - r.y0) * t}%`,
    width: `${(props.game.cartW * half) / r.half0}%`
  }
})

const timer = window.setInterval(tick, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function tick() {
  if (between.value || finished.value || grazing.value) return
  x.value = driftStep(x.value, TICK, elapsed.value, current.value.drift)
  elapsed.value += TICK
  if (!onRoad(x.value)) {
    graze()
    return
  }
  if (way.value >= 1) roundDone()
}

function graze() {
  grazing.value = true
  misses.value++
  play('wrong')
  message.value = t('app.adventure.cowsGraze')
  later(() => {
    x.value = 0
    grazing.value = false
    message.value = ''
  }, GRAZE_MS)
}

function tap(side: 'left' | 'right') {
  if (between.value || finished.value || grazing.value) return
  x.value = nudge(x.value, side)
  play('tap')
  // a nudge may not push the cart over the edge by itself: it stays on the road, the cows just look at the grass
  x.value = Math.max(-ROAD_HALF + 4, Math.min(ROAD_HALF - 4, x.value))
}

function roundDone() {
  between.value = true
  progress.mark()
  play('star')
  message.value = t('app.adventure.cowsHome')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    elapsed.value = 0
    x.value = 0
    between.value = false
    message.value = ''
  }, 1600)
}
</script>

<template lang="pug">
  div(class="gw")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gw-hint") {{ current.hint }}
      div(class="gw-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(v-for="(g, i) in game.tufts" :key="`tuft-${i}`" class="gw-tuft" :style="{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%` }" aria-hidden="true")
          GameImage(:src="g.image" colour="#7d8f4c")
        //- the cart with the two cows and the ark
        div(class="gw-cart" :class="{ graze: grazing }" :style="cartStyle" role="img" :aria-label="t('app.adventure.cowsCart')")
          GameImage(:src="game.cart" colour="#a5502a")
          span(v-if="grazing" class="gw-cross" aria-hidden="true")
            GameMark(kind="bad")
        //- the two halves of the picture: a tap nudges the cart to that side
        button(type="button" class="gw-side left" :aria-label="t('app.adventure.cowsLeft')" @pointerdown.prevent="tap('left')" @keydown.enter.prevent="tap('left')" @keydown.space.prevent="tap('left')")
        button(type="button" class="gw-side right" :aria-label="t('app.adventure.cowsRight')" @pointerdown.prevent="tap('right')" @keydown.enter.prevent="tap('right')" @keydown.space.prevent="tap('right')")
      p(class="gw-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cowsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gw
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
  touch-action: manipulation

.gw-round
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

.gw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gw-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a9a52
  background-size: cover
  background-position: center

.gw-tuft
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

// the cart moves with the middle of its picture at left/top
.gw-cart
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 4

  &.graze
    transform: translate(-50%, -50%) rotate(-8deg)

.gw-cross
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px

.gw-side
  position: absolute
  top: 0
  bottom: 0
  width: 50%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  z-index: 6
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &.left
    left: 0

  &.right
    right: 0

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: -6px
    border-radius: 14px

  &:active
    background: rgba(255, 246, 220, 0.14)

.gw-fb
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
