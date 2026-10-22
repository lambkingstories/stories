<script setup lang="ts">
/**
 * Ten days: a long table in the courtyard of the palace. Every day four dishes stand on it, one vegetable dish, one water jug, one piece of meat and one sweet of the king's table. The child taps the two things Daniel
 * eats and drinks (vegetables and water); they go to his place and the day is done. A tap on the king's food is a mistake (a cross, the dish stays). A thin bar runs down the day (seven, five, four seconds, longer with
 * "reduce motion"); when it is over before both are taken the day counts as a mistake and the next one begins, so the game always goes on. The bar starts a moment after the dishes stand there, never at once.
 * Which dishes stand there and how long a day is are `buildDay` and `dayLimitMs` in `utils/danielGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { buildDay, dayLimitMs, isGoodDish } from '@/utils/danielGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DaysDish, DaysGame } from '@/types/adventure'

const props = defineProps<{ game: DaysGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every day
progress.setGoal(props.game.days)

/** The time between the dishes standing on the table and the bar beginning to run. */
const LEAD_MS = 1200
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** The four places of the dishes on the table (middle, percent of the picture width); Daniel's place (plate and cup) lies at the left. */
const PLACES = [36, 52, 68, 84]
/** Where a dish that Daniel takes goes: the vegetables to the plate, the water to the cup (percent of the picture width). */
const TAKEN_X = { veg: 15, water: 24 } as const

const day = ref(0)
const picks = ref<number[]>(buildDay(0, props.game.dishes))
const taken = reactive<Record<number, boolean>>({})
const marks = ref<('ok' | 'bad')[]>([])
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wrong = ref<{ at: number; k: number } | null>(null)
let wrongKey = 0
const leftMs = ref(0)
const limit = computed(() => dayLimitMs(day.value, props.game.limits, reduced))
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 6))
const takenX = (kind: DaysDish['kind']) => TAKEN_X[kind as 'veg'] ?? TAKEN_X.veg
const dishOf = (slot: number) => props.game.dishes[picks.value[slot]!]!
const takenCount = computed(() => picks.value.filter((p) => taken[p]).length)

// the clock of a day: it waits for the lead, then runs down
let begun = Date.now()
let last = Date.now()
const timer = window.setInterval(() => {
  const nowMs = Date.now()
  const dt = Math.min(250, nowMs - last)
  last = nowMs
  if (between.value || finished.value) return
  if (nowMs - begun < LEAD_MS) return
  leftMs.value = Math.max(0, leftMs.value - dt)
  if (leftMs.value <= 0) tooLate()
}, 100)
onBeforeUnmount(() => window.clearInterval(timer))
leftMs.value = limit.value

function pick(slot: number) {
  if (between.value || finished.value) return
  const index = picks.value[slot]!
  if (taken[index]) return
  const dish = dishOf(slot)
  if (!isGoodDish(dish.kind)) {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.daysBad')
    const k = ++wrongKey
    wrong.value = { at: slot, k }
    later(() => {
      if (wrong.value?.k === k) wrong.value = null
    }, 800)
    return
  }
  taken[index] = true
  play('basket')
  message.value = ''
  if (takenCount.value >= 2) dayDone()
}

function dayDone() {
  progress.mark()
  marks.value.push('ok')
  play('star')
  message.value = t('app.adventure.daysRight')
  nextDay()
}

function tooLate() {
  misses.value++
  marks.value.push('bad')
  play('wrong')
  message.value = t('app.adventure.daysLate')
  nextDay()
}

function nextDay() {
  between.value = true
  if (day.value + 1 >= props.game.days) {
    later(() => {
      finished.value = true
    }, 1200)
    return
  }
  later(() => {
    day.value++
    picks.value = buildDay(day.value, props.game.dishes)
    for (const k of Object.keys(taken)) delete taken[Number(k)]
    leftMs.value = limit.value
    begun = Date.now()
    last = Date.now()
    between.value = false
    message.value = ''
  }, 1100)
}

const tableStyle = computed(() => ({ top: `${props.game.table.y}%`, height: `${props.game.table.h}%` }))
const barStyle = computed(() => ({ transform: `scaleX(${limit.value ? leftMs.value / limit.value : 0})` }))
</script>

<template lang="pug">
  div(class="dy")
    template(v-if="!finished")
      p(class="dy-day") {{ t('app.adventure.daysDay', { n: Math.min(day + 1, game.days), total: game.days }) }}
      div(class="dy-days" aria-hidden="true")
        span(v-for="n in game.days" :key="n" class="dy-dot" :class="{ now: n - 1 === day && marks.length <= day, ok: marks[n - 1] === 'ok', bad: marks[n - 1] === 'bad' }")
          template(v-if="marks[n - 1] === 'ok'") ✓
          template(v-else-if="marks[n - 1] === 'bad'") ✗
          template(v-else) {{ n }}
      div(class="dy-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="dy-table" :style="tableStyle")
          button(
            v-for="(index, slot) in picks"
            :key="`${day}-${index}`"
            type="button"
            class="dy-dish"
            :class="{ gone: taken[index] }"
            :style="{ left: `${taken[index] ? takenX(dishOf(slot).kind) : PLACES[slot]}%`, width: `${game.table.w}%` }"
            :disabled="taken[index] || between"
            :aria-label="taken[index] ? t('app.adventure.daysTaken') : t(`app.adventure.daysDish_${dishOf(slot).kind}`)"
            @click="pick(slot)"
          )
            GameImage(:src="dishOf(slot).image" colour="#c9a45c")
            span(v-if="wrong && wrong.at === slot" :key="wrong.k" class="dy-miss" aria-hidden="true")
              GameMark(kind="bad")
      div(class="dy-bar" aria-hidden="true")
        span(class="dy-bar-fill" :style="barStyle")
      p(class="dy-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.daysDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.dy
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.dy-day
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

.dy-days
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 4px

.dy-dot
  display: inline-flex
  align-items: center
  justify-content: center
  width: 26px
  height: 26px
  border-radius: 50%
  border: 2px solid #b8923a
  background: rgba(255, 246, 220, 0.9)
  font-weight: 800
  font-size: 0.85rem
  color: #5f4f35

  &.now
    background: #f4d36a
    border-color: #8a6820

  &.ok
    background: #cfe6c2
    border-color: #2f6b3f
    color: #2f6b3f

  &.bad
    background: #f0d0c4
    border-color: #9a3f2b
    color: #9a3f2b

.dy-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99863
  background-size: cover
  background-position: center

.dy-table
  position: absolute
  left: 0
  right: 0

// a dish stands on the strip of the table; the lower edge on the line; a finger is bigger than a dish
.dy-dish
  position: absolute
  bottom: 0
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translateX(-50%)
  transition: left 700ms ease-in-out, transform 700ms ease-in-out
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -10px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

  // a dish that Daniel takes goes to his place and stays there
  &.gone
    pointer-events: none
    transform: translate(-50%, -22%) scale(0.85)

.dy-miss
  position: absolute
  left: 50%
  top: 10%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.dy-bar
  height: 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.7)
  border: 2px solid #b8923a
  overflow: hidden

.dy-bar-fill
  display: block
  height: 100%
  background: #d4a83e
  transform-origin: left center
  transition: transform 120ms linear

.dy-fb
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
  .dy-dish,
  .dy-bar-fill
    transition: none
</style>
