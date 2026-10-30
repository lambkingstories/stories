<script setup lang="ts">
/**
 * Peace among the animals (Isaiah 11,6-9): on a sunny meadow of the holy mountain stand four animals that are dangerous (wolf, leopard, young lion, bear) in two rows, and below them waits a strip with the animals that live
 * safely beside them (lamb, young goat, calf, cow). The child taps one animal of each kind (in either order): the right partner walks up to the predator and both stay together; a wrong partner is a mistake (a cross).
 * In round 1 the list of the pairs stands above the picture, in round 2 it is gone and the strip is in another order. At the end a little boy comes in ("a little child shall lead them"). The arithmetic is in `utils/prophetenGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { allPaired, peaceSpot, peaceStep } from '@/utils/prophetenGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PeaceGame } from '@/types/adventure'

const props = defineProps<{ game: PeaceGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every pair of every round
progress.setGoal(props.game.pairs.length * props.game.rounds.length)

const round = ref(0)
const together = ref<string[]>([]) // the predators whose pair is together in this round
const selected = ref<string | null>(null)
const crossAt = ref<string | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const boyIn = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => props.game.pairs.length * props.game.rounds.length)
const animalOf = (id: string) => props.game.animals.find((a) => a.id === id)
const labelOf = (id: string): string => animalOf(id)?.label ?? id
const isPredator = (id: string): boolean => props.game.pairs.some((p) => p.predator === id)
const predatorOfPrey = (id: string): string | undefined => props.game.pairs.find((p) => p.prey === id)?.predator
const isDone = (id: string): boolean => (isPredator(id) ? together.value.includes(id) : together.value.includes(predatorOfPrey(id) ?? ''))
const spotOfPredator = (id: string): { x: number; y: number } => {
  const i = props.game.pairs.findIndex((p) => p.predator === id)
  return props.game.spots[i] ?? { x: 50, y: 50 }
}
const animals = computed(() => [...props.game.pairs.map((p) => p.predator), ...current.value.preyOrder])

function posOf(id: string): { x: number; y: number } {
  if (isPredator(id)) return spotOfPredator(id)
  const pred = predatorOfPrey(id)
  if (pred && together.value.includes(pred)) return peaceSpot(spotOfPredator(pred))
  const i = current.value.preyOrder.indexOf(id)
  const n = current.value.preyOrder.length
  return { x: (100 * (i + 0.5)) / n, y: props.game.stripY }
}

function tap(id: string) {
  if (between.value || finished.value || isDone(id)) return
  const first = selected.value
  if (first === null || isPredator(first) === isPredator(id)) {
    selected.value = first === id ? null : id
    return
  }
  selected.value = null
  const predator = isPredator(id) ? id : first
  const prey = isPredator(id) ? first : id
  const r = peaceStep(props.game.pairs, together.value, predator, prey)
  if (r === 'again') return
  if (r === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.peaceWrong')
    crossAt.value = id
    later(() => {
      crossAt.value = null
    }, 900)
    return
  }
  together.value = [...together.value, predator]
  progress.mark()
  play('snap')
  message.value = ''
  if (allPaired(together.value, props.game.pairs)) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.peaceAll')
    later(() => {
      boyIn.value = true
    }, 700)
    later(() => {
      play('star')
      finished.value = true
    }, 3000)
    return
  }
  message.value = t('app.adventure.peaceRoundDone')
  later(() => {
    round.value++
    together.value = []
    between.value = false
    message.value = ''
  }, 1900)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      ul(v-if="current.showList" class="gm-list")
        li(v-for="p in game.pairs" :key="`l${p.predator}`" :class="{ done: together.includes(p.predator) }") {{ labelOf(p.predator) }} – {{ labelOf(p.prey) }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.peaceMeadow')"
      )
        button(
          v-for="id in animals"
          :key="id"
          type="button"
          class="gm-animal"
          :class="{ selected: selected === id, together: isDone(id) }"
          :style="{ left: `${posOf(id).x}%`, top: `${posOf(id).y}%`, width: `${animalOf(id)?.w ?? 16}%` }"
          :aria-label="labelOf(id)"
          :disabled="isDone(id)"
          @click="tap(id)"
        )
          img(:src="src(animalOf(id)?.image ?? '')" alt="" draggable="false")
          span(v-if="crossAt === id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        img(
          v-if="boyIn"
          class="gm-boy"
          :src="src(game.boy)"
          alt=""
          draggable="false"
          :style="{ left: '50%', top: `${game.stripY}%`, width: `${game.boyW}%` }"
        )
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.peaceCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.peaceDone')" @next="emit('done', stars)")
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

.gm-list
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  margin: 0
  padding: 0
  list-style: none

  li
    padding: 3px 10px
    border-radius: 999px
    background: rgba(255, 246, 220, 0.94)
    border: 2px solid #d4a83e
    font-weight: 700
    color: #5f4f35

    &.done
      background: #cfe8c7
      border-color: #6aa75d

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fbf6a
  background-size: cover
  background-position: center

.gm-animal
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 5
  transition: left 900ms ease, top 900ms ease, filter 200ms ease
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.4))

  &.selected
    filter: drop-shadow(0 0 8px rgba(255, 233, 150, 1)) drop-shadow(0 0 3px rgba(47, 123, 214, 1))
    transform: translate(-50%, -100%) scale(1.08)

  &.together
    cursor: default
    filter: drop-shadow(0 0 8px rgba(160, 230, 120, 0.95))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gm-boy
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 6
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.4))
  animation: gm-rise 700ms ease-out

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

@keyframes gm-rise
  0%
    opacity: 0
    transform: translate(-50%, -90%)
  100%
    opacity: 1
    transform: translate(-50%, -100%)

@media (prefers-reduced-motion: reduce)
  .gm-animal
    transition: none
  .gm-boy
    animation: none
</style>
