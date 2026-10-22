<script setup lang="ts">
/**
 * Ravens coming in: the valley of the brook Cherith, Elijah sits on his rock at the left. Ravens fly across the picture from the right to the left; some carry bread or meat, some a twig or nothing.
 * The child taps the ravens that bring food: they land at the rock and the food lies there. A tap on a raven with a twig or with nothing is a mistake (a cross, the raven flies on). A raven that is
 * not tapped flies on and does not come back (that is no mistake, but the food is missing). Round 1 is the morning (slow, four ravens), round 2 the evening (more and a little faster). The first raven
 * enters a moment after the picture is there, never at once. Where a raven is at a time is `flightX` and `flightY` in `utils/eliaGames.ts`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { flightOver, flightX, flightY, foodCount, isFood, ravensRoundOver } from '@/utils/eliaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RavenKind, RavensGame } from '@/types/adventure'

const props = defineProps<{ game: RavensGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: all the ravens that bring food, in all rounds
progress.setGoal(props.game.rounds.reduce((n, r) => n + foodCount(r.flights), 0))

/** The time between the picture standing there and the first raven entering. */
const LEAD_MS = 2200
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** With "reduce motion" the ravens take half as long again to cross. */
const SLOW = reduced ? 1.5 : 1

const round = ref(0)
const elapsed = ref(-LEAD_MS)
const gone = ref<Set<number>>(new Set())
/** The ravens that were tapped (right): where they are now (they fly to the rock) and whether they fade. */
const landing = reactive<Record<number, { x: number; y: number; fade: boolean }>>({})
const foods = ref<RavenKind[]>([])
const wrong = ref<{ at: number; k: number } | null>(null)
let wrongKey = 0
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flights = computed(() => props.game.rounds[round.value]!.flights.map((f) => ({ ...f, dur: f.dur * SLOW })))
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))

let last = Date.now()
const timer = window.setInterval(() => {
  const now = Date.now()
  const dt = Math.min(250, now - last)
  last = now
  if (between.value || finished.value) return
  elapsed.value += dt
  if (ravensRoundOver(elapsed.value, flights.value, gone.value)) roundOver()
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

/** The ravens that are in the picture now (entered, not yet gone), with their place. */
const visible = computed(() =>
  flights.value
    .map((f, i) => {
      const land = landing[i]
      if (land) return { i, kind: f.kind, x: land.x, y: land.y, fade: land.fade, landing: true }
      if (gone.value.has(i)) return null
      const x = flightX(elapsed.value, f)
      if (x === null || flightOver(elapsed.value, f)) return null
      return { i, kind: f.kind, x, y: flightY(elapsed.value, f), fade: false, landing: false }
    })
    .filter((r): r is { i: number; kind: RavenKind; x: number; y: number; fade: boolean; landing: boolean } => r !== null)
)

function slot(n: number) {
  const r = props.game.rock
  return { x: r.x + n * r.step, y: r.y }
}

function tap(i: number) {
  if (between.value || finished.value || gone.value.has(i)) return
  const f = flights.value[i]!
  if (!isFood(f.kind)) {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.ravensBad')
    const k = ++wrongKey
    wrong.value = { at: i, k }
    later(() => {
      if (wrong.value?.k === k) wrong.value = null
    }, 800)
    return
  }
  const x = flightX(elapsed.value, f) ?? 50
  const y = flightY(elapsed.value, f)
  gone.value = new Set(gone.value).add(i)
  landing[i] = { x, y, fade: false }
  const target = slot(foods.value.length)
  foods.value = [...foods.value, f.kind]
  progress.mark()
  play('basket')
  message.value = ''
  nextTick(() => {
    landing[i] = { x: target.x, y: target.y - 8, fade: false }
  })
  later(() => {
    if (landing[i]) landing[i]!.fade = true
  }, 900)
  later(() => {
    delete landing[i]
  }, 1500)
}

function roundOver() {
  between.value = true
  const got = foods.value.length
  message.value = got > 0 ? t('app.adventure.ravensRound_over', { n: got }) : t('app.adventure.ravensNone')
  if (round.value + 1 >= props.game.rounds.length) {
    later(() => {
      finished.value = true
    }, 1500)
    return
  }
  later(() => {
    round.value++
    elapsed.value = -LEAD_MS
    gone.value = new Set()
    foods.value = []
    for (const k of Object.keys(landing)) delete landing[Number(k)]
    last = Date.now()
    between.value = false
    message.value = ''
  }, 1700)
}

const label = (kind: RavenKind) => t(isFood(kind) ? 'app.adventure.ravensFood' : kind === 'twig' ? 'app.adventure.ravensTwig' : 'app.adventure.ravensEmpty')
const hint = computed(() => props.game.rounds[round.value]!.hint)
</script>

<template lang="pug">
  div(class="rv")
    template(v-if="!finished")
      p(class="rv-round") {{ t(`app.adventure.ravensRound${round}`) }}
      div(class="rv-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(
          v-for="(kind, n) in foods"
          :key="`food-${round}-${n}`"
          class="rv-food"
          :style="{ left: `${slot(n).x}%`, top: `${slot(n).y}%`, width: `${game.rock.w}%` }"
          aria-hidden="true"
        )
          GameImage(:src="kind === 'meat' ? game.food.meat : game.food.bread" colour="#c9a45c")
        button(
          v-for="r in visible"
          :key="`raven-${round}-${r.i}`"
          type="button"
          class="rv-raven"
          :class="{ landing: r.landing, fade: r.fade }"
          :style="{ left: `${r.x}%`, top: `${r.y}%`, width: `${game.ravenW}%` }"
          :disabled="r.landing || between"
          :aria-label="label(r.kind)"
          @click="tap(r.i)"
        )
          GameImage(:src="game.ravens[r.kind]" colour="#222")
          span(v-if="wrong && wrong.at === r.i" :key="wrong.k" class="rv-miss" aria-hidden="true")
            GameMark(kind="bad")
      p(class="rv-hint") {{ hint }}
      p(class="rv-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.ravensDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.rv
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.rv-round
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

.rv-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99863
  background-size: cover
  background-position: center

// a raven is a button: its picture keeps its size, only the area to tap grows
.rv-raven
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -12px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

  // a raven that was tapped flies to the rock, then fades
  &.landing
    pointer-events: none
    transition: left 600ms ease-out, top 600ms ease-out, opacity 500ms ease

  &.fade
    opacity: 0

.rv-food
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.rv-miss
  position: absolute
  left: 50%
  top: 10%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.rv-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.rv-fb
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
  .rv-raven.landing
    transition: none
</style>
