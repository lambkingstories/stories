<script setup lang="ts">
/**
 * Follow the donkeys: on a painted map of the hills five places lie (painted into the map), each with its name and a round area to tap. Saul and his servant look for the lost donkeys and go from place to place; the story says in which order. The child taps the places in that order:
 * a right place gets a tick and Saul walks on; a wrong place is a mistake (a cross, the place shakes). In round 1 little footprints lead from the last place to the next one, in round 2 there are none and the child has to
 * remember the order of the story (the line above the map names it). Two rounds of five places. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { nextPlace } from '@/utils/samuelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SearchGame } from '@/types/adventure'

const props = defineProps<{ game: SearchGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.order.length, 0)
// the whole task: every place of every round
progress.setGoal(total)

/** Where the first footprints start: at the foot of the map, in the left corner. */
const START = { x: 8, y: 94 }
const PRINTS = 5

const round = ref(0)
const done = ref(0)
const wrong = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
/** Where Saul stands: at the place that was visited last, at the start before the first one. */
const saulAt = computed(() => {
  const last = done.value > 0 ? props.game.places[current.value.order[done.value - 1]!] : undefined
  return last ? { x: last.x + last.w * 0.5, y: last.y + 7 } : START
})
const printSrc = (i: number) => props.game.prints[i % props.game.prints.length] ?? ''
const target = computed(() => nextPlace(current.value.order, done.value))
const visited = computed(() => new Set(current.value.order.slice(0, done.value)))
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))

/** The footprints from the last place (or the start) to the place that comes next: points along the line, a little to the left and right in turn. */
const prints = computed(() => {
  if (!current.value.prints || target.value < 0) return []
  const to = props.game.places[target.value]!
  const from = done.value > 0 ? props.game.places[current.value.order[done.value - 1]!]! : START
  const out: { x: number; y: number; r: number }[] = []
  for (let i = 1; i <= PRINTS; i++) {
    const f = i / (PRINTS + 1)
    const side = i % 2 === 0 ? 1 : -1
    out.push({ x: from.x + (to.x - from.x) * f + side * 0.9, y: from.y + (to.y - from.y) * f - 3 + side * 0.9, r: Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI) + 90 })
  }
  return out
})

function tapPlace(i: number) {
  if (between.value || finished.value || visited.value.has(i)) return
  if (i === target.value) {
    done.value++
    progress.mark()
    play('tap')
    message.value = ''
    if (done.value >= current.value.order.length) roundDone()
    return
  }
  misses.value++
  play('wrong')
  wrong.value = i
  message.value = t('app.adventure.searchWrong')
  later(() => {
    if (wrong.value === i) wrong.value = null
  }, 600)
}

function roundDone() {
  between.value = true
  play('star')
  message.value = t('app.adventure.searchRound')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    done.value = 0
    between.value = false
    message.value = ''
  }, 1700)
}
</script>

<template lang="pug">
  div(class="gf")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gf-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gf-hint") {{ current.hint }}
      div(class="gf-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the footprints to the next place (round 1)
        span(v-for="(p, i) in prints" :key="`print-${round}-${done}-${i}`" class="gf-print" :style="{ left: `${p.x}%`, top: `${p.y}%`, width: `${game.printW}%`, transform: `translate(-50%, -50%) rotate(${p.r}deg)` }" aria-hidden="true")
          GameImage(:src="printSrc(i)" colour="#6b4d2a")
        //- Saul stands where he has been last
        span(class="gf-saul" :style="{ left: `${saulAt.x}%`, top: `${saulAt.y}%`, width: `${game.saulW}%` }" role="img" :aria-label="t('app.adventure.searchSaul')")
          GameImage(:src="game.saul" colour="#6d7f95")
        //- the places
        button(
          v-for="(pl, i) in game.places"
          :key="`place-${i}`"
          type="button"
          class="gf-place"
          :class="{ visited: visited.has(i), wrong: wrong === i }"
          :style="{ left: `${pl.x}%`, top: `${pl.y}%`, width: `${pl.w}%` }"
          :aria-label="pl.label"
          :disabled="between || visited.has(i)"
          @click="tapPlace(i)"
        )
          span(class="gf-ring" aria-hidden="true")
          span(class="gf-label") {{ pl.label }}
          span(v-if="visited.has(i)" class="gf-sign good" aria-hidden="true")
            GameMark(kind="good")
          span(v-else-if="wrong === i" class="gf-sign" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gf-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.searchDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gf
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

.gf-round
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

.gf-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gf-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

.gf-print
  position: absolute
  display: block
  pointer-events: none
  animation: gf-fade 600ms ease both

// a place stands with the middle of its foot at left/top
.gf-place
  position: absolute
  display: block
  aspect-ratio: 1
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  -webkit-tap-highlight-color: transparent
  z-index: 3

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

  &.visited
    cursor: default

    .gf-ring
      border-style: solid
      border-color: rgba(255, 246, 220, 0.95)

  &.wrong
    animation: gf-shake 360ms ease

// the round area that is tapped
.gf-ring
  position: absolute
  inset: 0
  border-radius: 50%
  border: 3px dashed rgba(255, 246, 220, 0.85)
  background: rgba(255, 246, 220, 0.12)
  box-shadow: 0 0 6px rgba(40, 25, 5, 0.5)

// Saul stands with the middle of his foot at left/top
.gf-saul
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 4
  transition: left 500ms ease, top 500ms ease

.gf-label
  position: absolute
  left: 50%
  top: 100%
  transform: translate(-50%, 2px)
  white-space: nowrap
  padding: 0 7px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 0.8rem
  color: #3f321b

.gf-sign
  position: absolute
  right: -6px
  top: -6px
  display: block

.gf-fb
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

@keyframes gf-fade
  from
    opacity: 0
  to
    opacity: 1

@keyframes gf-shake
  0%, 100%
    transform: translate(-50%, -50%)
  25%
    transform: translate(calc(-50% - 6px), -50%)
  75%
    transform: translate(calc(-50% + 6px), -50%)

@media (prefers-reduced-motion: reduce)
  .gf-print, .gf-place.wrong
    animation: none
  .gf-saul
    transition: none
</style>
