<script setup lang="ts">
/**
 * Smooth stones: David wants five smooth stones from the brook for his shepherd's bag. In the gravel of the brook lie smooth, round, pale stones and rough, jagged, dark ones (painted stones, spread by the data).
 * The child taps the smooth ones: each flies into the bag and the bag counts them. A rough stone wobbles and stays where it is (a cross, one mistake). When every smooth stone of the round is in the bag, the round is
 * done. Round 1: three smooth ones among six stones, round 2: five among ten ("like David"). The arithmetic is in `utils/davidGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { pebbleOk } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PebblesGame } from '@/types/adventure'

const props = defineProps<{ game: PebblesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every smooth stone of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.smooth.length, 0))

const round = ref(0)
/** The stones that are in the bag or on their way (by name: `s0`, `s1` … for smooth, `r0` … for rough ones that were tapped are not kept). */
const taken = reactive<Record<string, boolean>>({})
const wobble = reactive<Record<string, boolean>>({})
const crossAt = ref<{ x: number; y: number } | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const inBag = computed(() => current.value.smooth.filter((_, i) => taken[`${round.value}-s${i}`]).length)

function stoneStyle(s: { x: number; y: number; w: number }, key: string) {
  const bag = props.game.bagPos
  const flown = taken[key]
  return { left: `${flown ? bag.x : s.x}%`, top: `${flown ? bag.y - 4 : s.y}%`, width: `${flown ? s.w * 0.6 : s.w}%` }
}

function tapSmooth(i: number) {
  const key = `${round.value}-s${i}`
  if (between.value || finished.value || taken[key] || !pebbleOk('smooth')) return
  taken[key] = true
  progress.mark()
  play('tap')
  message.value = t('app.adventure.pebblesRight')
  if (inBag.value >= current.value.smooth.length) {
    between.value = true
    later(() => {
      play('star')
    }, 500)
    later(() => {
      if (lastRound.value) {
        finished.value = true
        return
      }
      round.value++
      between.value = false
      message.value = ''
    }, 1900)
  }
}

function tapRough(i: number) {
  if (between.value || finished.value || pebbleOk('rough')) return
  const key = `${round.value}-r${i}`
  if (wobble[key]) return
  const s = current.value.rough[i]!
  misses.value++
  play('wrong')
  message.value = t('app.adventure.pebblesRough')
  wobble[key] = true
  crossAt.value = { x: s.x, y: s.y - 10 }
  later(() => {
    wobble[key] = false
    crossAt.value = null
  }, 800)
}
</script>

<template lang="pug">
  div(class="gk")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gk-hint") {{ current.hint }}
      div(class="gk-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the rough stones (they stay)
        button(
          v-for="(s, i) in current.rough"
          :key="`rough-${round}-${i}`"
          type="button"
          class="gk-stone"
          :class="{ wobble: wobble[`${round}-r${i}`] }"
          :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }"
          :aria-label="t('app.adventure.pebblesStone', { n: i + 1 })"
          :disabled="between"
          @click="tapRough(i)"
        )
          GameImage(:src="game.rough[s.sprite % game.rough.length]" colour="#5d554b")
        //- the smooth stones (they fly into the bag)
        button(
          v-for="(s, i) in current.smooth"
          :key="`smooth-${round}-${i}`"
          type="button"
          class="gk-stone"
          :class="{ flown: taken[`${round}-s${i}`] }"
          :style="stoneStyle(s, `${round}-s${i}`)"
          :aria-label="t('app.adventure.pebblesStone', { n: current.rough.length + i + 1 })"
          :disabled="between || taken[`${round}-s${i}`]"
          @click="tapSmooth(i)"
        )
          GameImage(:src="game.smooth[s.sprite % game.smooth.length]" colour="#d8d2c4" round)
        //- David's shepherd's bag
        span(class="gk-bag" :style="{ left: `${game.bagPos.x}%`, top: `${game.bagPos.y}%`, width: `${game.bagPos.w}%` }" role="img" :aria-label="t('app.adventure.pebblesBag')")
          GameImage(:src="game.bag" colour="#7a5530")
        span(class="gk-count" aria-live="polite") {{ t('app.adventure.pebblesCount', { n: inBag, total: current.smooth.length }) }}
        span(v-if="crossAt" class="gk-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gk-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.pebblesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gk
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

.gk-round
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

.gk-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gk-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// a stone lies with the middle of its foot at left/top
.gk-stone
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  transition: left 600ms ease, top 600ms ease, width 600ms ease, opacity 400ms ease
  -webkit-tap-highlight-color: transparent
  z-index: 3

  // the tap area is larger than a small stone
  &::after
    content: ''
    position: absolute
    inset: -18%

  &.flown
    opacity: 0.9
    cursor: default
    pointer-events: none
    z-index: 6

  &.wobble
    animation: gk-wobble 500ms ease

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.gk-bag
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 5

.gk-count
  position: absolute
  left: 8px
  top: 8px
  z-index: 8
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 0.9rem
  color: #5f4f35

.gk-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gk-fb
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

@keyframes gk-wobble
  0%, 100%
    transform: translate(-50%, -100%) rotate(0deg)
  25%
    transform: translate(-50%, -100%) rotate(-9deg)
  75%
    transform: translate(-50%, -100%) rotate(9deg)

@media (prefers-reduced-motion: reduce)
  .gk-stone
    transition: none
  .gk-stone.wobble
    animation: none
</style>
