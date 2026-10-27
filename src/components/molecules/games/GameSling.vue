<script setup lang="ts">
/**
 * The sling: in the valley David swings his sling and Goliath stands far away, calm and huge (painted pictures). The stone circles round David's raised hand (the app moves it). From the stone a fine dashed ray shows
 * in which direction it would fly if it were let go; the ray turns golden when it points at Goliath's forehead. A tap lets the stone go: it flies along the ray. A hit makes Goliath fall (a second painted picture:
 * he lies calmly on the ground with his eyes closed, no blood), a miss is a mistake and David swings on (he has more stones; their number is not limited). Round 1: Goliath far away, the stone turns slowly, a wide aim is
 * enough; round 2: Goliath nearer, the stone turns faster, the aim must be better. The turn begins a moment after the picture has appeared. The arithmetic is in `utils/davidGames.ts`; it counts in units of
 * the picture width on both axes, so the heights (percent of the picture height) are multiplied by `ASPECT` first.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { ASPECT, slingAimError, slingAngle, slingDirection, slingHit, slingLanding, slingPos } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SlingGame } from '@/types/adventure'

const props = defineProps<{ game: SlingGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one hit in every round
progress.setGoal(props.game.rounds.length)

const TICK = 30
/** The time the stone rests before it begins to turn (ms). */
const LEAD_IN = 1100
/** How long the stone flies (ms). */
const FLIGHT_MS = 650
/** The angle where the stone rests at the start (to the left of the hand, it is on its way up). */
const START_ANGLE = Math.PI
/** The length of the ray (percent of the picture width). */
const RAY = 20

const round = ref(0)
const elapsed = ref(-LEAD_IN)
const flying = ref(false)
const flyPos = ref<{ x: number; y: number } | null>(null)
const hitDone = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const crossAt = ref<{ x: number; y: number } | null>(null)
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const centre = computed(() => ({ x: props.game.hand.x, y: props.game.hand.y * ASPECT }))
const target = computed(() => ({ x: current.value.head.x, y: current.value.head.y * ASPECT }))
const angle = computed(() => slingAngle(elapsed.value, current.value.period, START_ANGLE))
const pos = computed(() => slingPos(angle.value, centre.value, props.game.radius))
const error = computed(() => slingAimError(angle.value, centre.value, props.game.radius, target.value))
const aimed = computed(() => slingHit(error.value, current.value.tol))
const toCss = (p: { x: number; y: number }) => ({ left: `${p.x}%`, top: `${p.y / ASPECT}%` })
const stoneStyle = computed(() => ({ ...toCss(flying.value && flyPos.value ? flyPos.value : pos.value), width: `${props.game.stoneW}%` }))
const rayStyle = computed(() => {
  const v = slingDirection(angle.value)
  return { ...toCss(pos.value), width: `${RAY}%`, transform: `rotate(${(Math.atan2(v.y, v.x) * 180) / Math.PI}deg)` }
})
const goliatStyle = computed(() => ({ left: `${current.value.goliat.x}%`, top: `${current.value.goliat.y}%`, width: `${current.value.goliat.w}%` }))
const fallenStyle = computed(() => ({ left: `${current.value.goliat.x}%`, top: `${current.value.goliat.y}%`, width: `${current.value.goliat.w * props.game.fallenScale}%` }))
const davidStyle = computed(() => ({ left: `${props.game.davidPos.x}%`, top: `${props.game.davidPos.y}%`, width: `${props.game.davidPos.w}%` }))

const timer = window.setInterval(() => {
  if (flying.value || between.value || finished.value) return
  elapsed.value += TICK
}, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function release() {
  if (flying.value || between.value || finished.value || elapsed.value < 0) return
  const hit = aimed.value
  const from = pos.value
  flying.value = true
  flyPos.value = from
  play('snap')
  later(() => {
    flyPos.value = slingLanding(angle.value, centre.value, props.game.radius, target.value, hit)
  }, 30)
  later(() => land(hit), FLIGHT_MS + 60)
}

function land(hit: boolean) {
  if (hit) {
    hitDone.value = true
    between.value = true
    progress.mark()
    play('star')
    message.value = t('app.adventure.slingHit')
    later(() => {
      if (lastRound.value) {
        finished.value = true
        return
      }
      round.value++
      hitDone.value = false
      flying.value = false
      flyPos.value = null
      elapsed.value = -LEAD_IN
      between.value = false
      message.value = ''
    }, 2200)
    return
  }
  misses.value++
  play('wrong')
  message.value = t('app.adventure.slingMiss')
  crossAt.value = { x: current.value.goliat.x, y: current.value.goliat.y - 46 }
  later(() => {
    crossAt.value = null
    flying.value = false
    flyPos.value = null
    elapsed.value = -600
  }, 800)
}
</script>

<template lang="pug">
  div(class="gl")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gl-hint") {{ current.hint }}
      div(class="gl-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- Goliath: standing, and on the ground after a hit (the pictures fade)
        span(class="gl-goliat" :class="{ gone: hitDone }" :style="goliatStyle" role="img" :aria-label="t('app.adventure.slingGoliat')")
          GameImage(:src="game.goliat" colour="#8a6a3a")
        span(class="gl-goliat gl-fallen" :class="{ on: hitDone }" :style="fallenStyle" aria-hidden="true")
          GameImage(:src="game.goliatFallen" colour="#8a6a3a")
        //- David with the sling
        span(class="gl-david" :style="davidStyle" role="img" :aria-label="t('app.adventure.slingDavid')")
          GameImage(:src="game.david" colour="#6d7f95")
        //- the ray that shows where the stone would fly
        span(v-if="!flying && !hitDone" class="gl-ray" :class="{ on: aimed }" :style="rayStyle" aria-hidden="true")
        //- the stone
        span(v-if="!hitDone" class="gl-stone" :class="{ flying }" :style="stoneStyle" aria-hidden="true")
          GameImage(:src="game.stone" colour="#cfc9bb" round)
        span(v-if="crossAt" class="gl-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
        //- the whole picture lets the stone go (a tap, or Enter from the keyboard)
        button(type="button" class="gl-hit" :aria-label="t('app.adventure.slingRelease')" :disabled="between" @click="release")
      p(class="gl-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.slingDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gl
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

.gl-round
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

.gl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gl-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// every figure stands with the middle of its foot at left/top
.gl-goliat
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  transition: opacity 900ms ease

  &.gone
    opacity: 0

  &.gl-fallen
    opacity: 0

    &.on
      opacity: 1

.gl-david
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3

// the ray starts at the middle of the stone and is turned round its start
.gl-ray
  position: absolute
  display: block
  height: 0
  border-top: 3px dashed rgba(255, 246, 220, 0.85)
  transform-origin: 0 50%
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 0 2px rgba(40, 25, 5, 0.7))

  &.on
    border-top-color: #f2c94c
    filter: drop-shadow(0 0 5px rgba(255, 215, 90, 0.95))

.gl-stone
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 5

  &.flying
    transition: left 650ms linear, top 650ms linear

.gl-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gl-hit
  position: absolute
  inset: 0
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  z-index: 7
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: -6px

.gl-fb
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

@media (prefers-reduced-motion: reduce)
  .gl-goliat
    transition: none
</style>
