<script setup lang="ts">
/**
 * The sign of the arrows: in the field Jonathan stands with his bow at the left, a little boy waits in the middle, and the big stone behind which David hides stands at the right edge. The child puts a finger on the picture,
 * pulls it back to the left (the arrow is drawn back with it) and lets go: the farther the string is pulled, the farther the arrow flies. The first sign is "peace": the arrow must land BEHIND the boy (between Jonathan and the boy);
 * the second is the sign to flee: it must land BEFORE the boy (farther away). The zone where the arrow must land is marked softly on the grass. An arrow in the zone lies there and is one part done; an arrow outside is a
 * mistake and fades away. Round 1: two arrows, round 2: three arrows (as in the story). The bow can also be used with the keyboard (left and right arrow keys pull, Enter lets go). The arithmetic is in `utils/davidGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { arrowLanding, arrowMiss, arrowPull } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ArrowGame } from '@/types/adventure'

const props = defineProps<{ game: ArrowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every arrow that lands in its zone
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.arrows, 0))

/** How far the finger must be pulled for the longest shot (a share of the picture width). */
const FULL_PULL = 0.38
/** The arrow is drawn back this far (percent of the picture width) at the longest pull. */
const DRAW_BACK = 9
const FLIGHT_MS = 750

const round = ref(0)
const fieldEl = ref<HTMLElement | null>(null)
const pull = ref(0)
const pulling = ref(false)
let startX = 0
const flight = ref<{ from: { x: number; y: number }; to: number } | null>(null)
const flying = ref(false)
const landed = reactive<Record<string, number[]>>({})
const lastMiss = ref<number | null>(null)
const crossAt = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const lying = computed(() => landed[String(round.value)] ?? [])
const zoneStyle = computed(() => ({ left: `${current.value.zone.from}%`, width: `${current.value.zone.to - current.value.zone.from}%`, top: `${props.game.groundY}%` }))
const nockStyle = computed(() => ({ left: `${props.game.shootFrom.x - pull.value * DRAW_BACK}%`, top: `${props.game.shootFrom.y}%`, width: `${props.game.arrowW}%` }))
const flyStyle = computed(() => {
  const f = flight.value
  if (!f) return {}
  return { left: `${flying.value ? f.to : f.from.x}%`, top: `${flying.value ? props.game.groundY : f.from.y}%`, width: `${props.game.arrowW}%` }
})

function down(e: PointerEvent) {
  if (between.value || finished.value || flight.value) return
  pulling.value = true
  startX = e.clientX
  pull.value = 0
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!pulling.value) return
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0) return
  pull.value = arrowPull(startX - e.clientX, r.width * FULL_PULL)
}
function up() {
  if (!pulling.value) return
  pulling.value = false
  shoot()
}

function keydown(e: KeyboardEvent) {
  if (between.value || finished.value || flight.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    pull.value = Math.min(1, pull.value + 0.1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    pull.value = Math.max(0, pull.value - 0.1)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    shoot()
  }
}

function shoot() {
  if (pull.value < 0.05 || flight.value) {
    pull.value = 0
    return
  }
  const x = arrowLanding(pull.value, props.game.range.min, props.game.range.max)
  const from = { x: props.game.shootFrom.x - pull.value * DRAW_BACK, y: props.game.shootFrom.y }
  pull.value = 0
  flight.value = { from, to: x }
  flying.value = false
  play('snap')
  later(() => {
    flying.value = true
  }, 30)
  later(() => land(x), FLIGHT_MS + 80)
}

function land(x: number) {
  const kind = arrowMiss(x, current.value.zone)
  if (kind === 'hit') {
    const key = String(round.value)
    landed[key] = [...(landed[key] ?? []), x]
    flight.value = null
    flying.value = false
    progress.mark()
    play('right')
    message.value = t('app.adventure.arrowGood')
    if ((landed[key] ?? []).length >= current.value.arrows) {
      between.value = true
      later(() => {
        play('star')
      }, 400)
      later(() => {
        if (lastRound.value) {
          finished.value = true
          return
        }
        round.value++
        between.value = false
        message.value = ''
      }, 2000)
    }
    return
  }
  misses.value++
  play('wrong')
  message.value = t(kind === 'short' ? 'app.adventure.arrowShort' : 'app.adventure.arrowFar')
  lastMiss.value = x
  crossAt.value = x
  later(() => {
    flight.value = null
    flying.value = false
    lastMiss.value = null
    crossAt.value = null
  }, 900)
}
</script>

<template lang="pug">
  div(class="ga")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="ga-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="ga-hint") {{ current.hint }}
      p(class="ga-sign") {{ t(current.sign === 'peace' ? 'app.adventure.arrowPeace' : 'app.adventure.arrowFlee') }}
      div(
        ref="fieldEl"
        class="ga-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @pointerdown.prevent="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @contextmenu.prevent
      )
        span(class="ga-zone" :style="zoneStyle" aria-hidden="true")
        //- Jonathan with his bow, the boy
        span(class="ga-fig" :style="{ left: `${game.jonatanPos.x}%`, top: `${game.jonatanPos.y}%`, width: `${game.jonatanPos.w}%` }" role="img" :aria-label="t('app.adventure.arrowJonathan')")
          GameImage(:src="game.jonatan" colour="#3a4f7a")
        span(class="ga-fig" :style="{ left: `${game.boyPos.x}%`, top: `${game.boyPos.y}%`, width: `${game.boyPos.w}%` }" role="img" :aria-label="t('app.adventure.arrowBoy')")
          GameImage(:src="game.boy" colour="#c9b78a")
        //- the arrows that lie in the zone
        span(v-for="(x, i) in lying" :key="`lies-${round}-${i}`" class="ga-lies" :style="{ left: `${x}%`, top: `${game.groundY + i * 2}%`, width: `${game.arrowW}%` }" aria-hidden="true")
          GameImage(:src="game.arrow" colour="#8a6a3a")
        //- the arrow on the string (drawn back while pulling) or in the air
        span(v-if="!flight" class="ga-nock" :style="nockStyle" aria-hidden="true")
          GameImage(:src="game.arrow" colour="#8a6a3a")
        span(v-else class="ga-air" :class="{ go: flying }" :style="flyStyle" aria-hidden="true")
          span(class="ga-arc")
            GameImage(:src="game.arrow" colour="#8a6a3a")
        span(v-if="crossAt !== null" class="ga-cross" :style="{ left: `${crossAt}%`, top: `${game.groundY - 14}%` }" aria-hidden="true")
          GameMark(kind="bad")
        //- the bow for the keyboard
        button(
          type="button"
          class="ga-bow"
          :style="{ left: `${game.jonatanPos.x}%`, top: `${game.jonatanPos.y}%`, width: `${game.jonatanPos.w}%` }"
          :aria-label="t('app.adventure.arrowBow')"
          :disabled="between"
          @keydown="keydown"
        )
      p(class="ga-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.arrowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ga
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
  touch-action: none

.ga-round
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

.ga-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.ga-sign
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  border: 2px solid #d4a83e
  font-weight: 800
  color: #3f321b

.ga-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center
  cursor: grab
  touch-action: none

// the marked stretch of grass where the arrow must land
.ga-zone
  position: absolute
  display: block
  height: 7%
  transform: translateY(-50%)
  border-radius: 999px
  border: 3px dashed rgba(255, 246, 220, 0.9)
  background: rgba(255, 224, 120, 0.28)
  box-shadow: 0 0 8px rgba(40, 25, 5, 0.35)
  pointer-events: none
  z-index: 1

// the figures stand with the middle of their foot at left/top
.ga-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3

// arrows are placed by their middle
.ga-lies, .ga-nock, .ga-air
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

.ga-lies
  z-index: 2

.ga-nock
  z-index: 5

.ga-air
  z-index: 5

  &.go
    transition: left 750ms cubic-bezier(0.25, 0.6, 0.45, 1), top 750ms ease-in

.ga-arc
  display: block
  animation: ga-arc 750ms ease-in-out both

.ga-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.ga-bow
  position: absolute
  height: 0
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  opacity: 0
  z-index: 6

  &:focus-visible
    opacity: 1
    height: 6%
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.ga-fb
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

@keyframes ga-arc
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-5vw)

@media (prefers-reduced-motion: reduce)
  .ga-air.go
    transition: none
  .ga-arc
    animation: none
</style>
