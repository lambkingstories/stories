<script setup lang="ts">
/**
 * Open the roof (Mark 2,4): "They took off the roof where he was." Four friends carry a man who cannot walk to the house in Capernaum; the crowd is so thick that they cannot get in. We look into the house from the
 * side: Jesus sits at one place in the room, other people sit on the floor, and above them lies the flat roof, cut in pieces. The child taps the pieces of the roof; the pieces above the free place over Jesus come off,
 * the pieces above the people stay (a tap on them is a mistake: dust would fall on the people, they duck, a cross). When the hole is open the four friends appear at its edge and let the bed down on the rope in front of
 * Jesus. Two rounds (a small hole, then a wider one in another place). The arithmetic is in `utils/freundeGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { peopleUnder, roofOpen, roofStep } from '@/utils/freundeGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RoofGame } from '@/types/adventure'

const props = defineProps<{ game: RoofGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every free piece of the roof of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.free.length, 0))

const LOWER_MS = 1800

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const removed = reactive<Record<number, boolean>>({})
const crossAt = ref<number | null>(null)
const ducking = ref<number[]>([])
const misses = ref(0)
/** 0: the hole is not open, 1: the friends are at the hole and the bed hangs at the roof, 2: the bed has come down. */
const lowering = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const cols = computed(() => current.value.cols)
const area = computed(() => props.game.area)
const personOf = (id: string) => props.game.people.find((p) => p.id === id)
const removedList = computed(() => Object.keys(removed).map(Number))
/** The people of the round with their places and widths, for the dust. */
const sitters = computed(() => current.value.spots.map((s) => ({ x: s.x, w: personOf(s.person)?.w ?? 10 })))
/** The middle of the hole in percent of the picture width. */
const holeX = computed(() => {
  const free = current.value.free
  const w = area.value.w / cols.value
  const from = area.value.x + Math.min(...free) * w
  const to = area.value.x + (Math.max(...free) + 1) * w
  return (from + to) / 2
})
/** The height of the bed's picture in percent of the picture height (the picture is 4:3). */
const matH = computed(() => (props.game.mat.w / props.game.mat.ratio) * (4 / 3))
/** Where the bed hangs: just under the roof at first, then on the floor in front of Jesus. */
const matBottom = computed(() => (lowering.value >= 2 ? props.game.floor + 2 : area.value.y + area.value.h + matH.value))
const ropeHeight = computed(() => Math.max(0, matBottom.value - matH.value - area.value.y))

function tile(col: number) {
  const n = cols.value
  return {
    backgroundImage: `url(${src(props.game.roof)})`,
    backgroundSize: `${n * 100}% 100%`,
    backgroundPosition: `${n > 1 ? (col / (n - 1)) * 100 : 0}% 0`
  }
}

function tap(col: number) {
  if (between.value || finished.value || removed[col]) return
  if (roofStep(col, current.value.free) === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.roofWrong')
    crossAt.value = col
    ducking.value = peopleUnder(col, cols.value, area.value, sitters.value)
    later(() => {
      if (crossAt.value === col) crossAt.value = null
      ducking.value = []
    }, 900)
    return
  }
  removed[col] = true
  progress.mark()
  play('snap')
  message.value = ''
  if (!roofOpen(removedList.value, current.value.free)) return
  between.value = true
  message.value = t('app.adventure.roofOpen')
  later(() => {
    lowering.value = 1
  }, 500)
  later(() => {
    lowering.value = 2
  }, 700)
  later(() => {
    message.value = t('app.adventure.roofDown')
    play('star')
  }, 700 + LOWER_MS)
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 700 + LOWER_MS + 1800)
    return
  }
  later(() => {
    round.value++
    for (const k of Object.keys(removed)) delete removed[Number(k)]
    lowering.value = 0
    between.value = false
    message.value = ''
  }, 700 + LOWER_MS + 2200)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.roofField')"
      )
        img(
          class="gm-jesus"
          :src="src(game.jesus.image)"
          :alt="game.jesus.label"
          draggable="false"
          :style="{ left: `${current.jesusX}%`, top: `${game.floor}%`, width: `${game.jesus.w}%` }"
        )
        img(
          v-for="(s, i) in current.spots"
          :key="`${round}-p${i}`"
          class="gm-person"
          :class="{ duck: ducking.includes(i) }"
          :src="src(personOf(s.person)?.image ?? '')"
          :alt="personOf(s.person)?.label ?? ''"
          draggable="false"
          :style="{ left: `${s.x}%`, top: `${game.floor}%`, width: `${personOf(s.person)?.w ?? 10}%` }"
        )
        //- the rope and the bed come down through the hole
        img(
          v-if="lowering > 0"
          class="gm-rope"
          :src="src(game.rope.image)"
          alt=""
          draggable="false"
          :class="{ down: lowering >= 2 }"
          :style="{ left: `${current.matX}%`, top: `${area.y}%`, width: `${game.rope.w}%`, height: `${ropeHeight}%` }"
        )
        img(
          v-if="lowering > 0"
          class="gm-mat"
          :class="{ down: lowering >= 2 }"
          :src="src(game.mat.image)"
          :alt="game.mat.label"
          draggable="false"
          :style="{ left: `${current.matX}%`, top: `${matBottom}%`, width: `${game.mat.w}%` }"
        )
        //- the roof: one button for every piece
        div(
          class="gm-roof"
          :style="{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%` }"
        )
          button(
            v-for="c in cols"
            :key="`${round}-${c}`"
            type="button"
            class="gm-tile"
            :class="{ gone: !!removed[c - 1] }"
            :style="tile(c - 1)"
            :aria-label="t('app.adventure.roofPiece', { n: c, total: cols })"
            :disabled="between || !!removed[c - 1]"
            @click="tap(c - 1)"
          )
            span(v-if="crossAt === c - 1" class="gm-cross" aria-hidden="true")
              GameMark(kind="bad")
        img(
          class="gm-carriers"
          :class="{ here: lowering > 0 }"
          :src="src(game.carriers.image)"
          alt=""
          draggable="false"
          :style="{ left: `${holeX}%`, top: `${area.y + 1.5}%`, width: `${game.carriers.w}%` }"
        )
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.roofCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.roofDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9ad7d
  background-size: cover
  background-position: center

.gm-jesus, .gm-person
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1
  transition: transform 260ms ease-out

.gm-person.duck
  transform: translate(-50%, -88%) scale(0.94, 0.9)

.gm-roof
  position: absolute
  display: flex
  z-index: 3

.gm-tile
  position: relative
  flex: 1 1 0
  min-width: 0
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 0
  background-repeat: no-repeat
  cursor: pointer
  transition: transform 520ms ease-in, opacity 520ms ease-in
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: -3px

  // taken off: the piece falls out of the roof and fades
  &.gone
    transform: translateY(260%) rotate(8deg)
    opacity: 0
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gm-carriers
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  opacity: 0
  pointer-events: none
  z-index: 4
  transition: opacity 400ms ease-out

  &.here
    opacity: 1

.gm-rope
  position: absolute
  display: block
  transform: translateX(-50%)
  object-fit: fill
  pointer-events: none
  z-index: 2
  transition: height 1800ms ease-in-out

.gm-mat
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  transition: top 1800ms ease-in-out

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

@media (prefers-reduced-motion: reduce)
  .gm-tile, .gm-mat, .gm-rope, .gm-carriers, .gm-jesus, .gm-person
    transition: none
</style>
