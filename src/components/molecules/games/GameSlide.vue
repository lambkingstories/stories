<script setup lang="ts">
/**
 * Join the stairway: the picture of Jacob's dream (a stairway that reaches to heaven, in the night) is cut into tiles and mixed; one tile is missing, there is a free
 * gap. The child taps a tile next to the gap and it slides into the gap (or presses an arrow key). When every tile lies at its place the stairway lights up and the
 * last tile fills the gap. Every move is allowed, so nothing can go wrong and there is no clock. "Tip" shows the whole picture for three seconds (the tip counts,
 * `mistakeStars`). Round 1: 3 x 2 tiles, round 2: 4 x 3 tiles. The mixing is `scramble` in `utils/jakobGames.ts` (from the finished picture by valid moves: it can always be solved).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { gapOf, isSolved, move, neighbors, scramble } from '@/utils/jakobGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SlideGame } from '@/types/adventure'

const props = defineProps<{ game: SlideGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every round that is solved
progress.setGoal(props.game.rounds.length)

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const cols = computed(() => current.value.cols)
const rows = computed(() => current.value.rows)

const board = ref<number[]>(scramble(current.value.cols, current.value.rows, current.value.moves, current.value.seed))
const solved = ref(false)
const between = ref(false)
const finished = ref(false)
const showing = ref(false)
const tips = ref(0)
const message = ref('')
const stars = computed(() => mistakeStars(tips.value, 0, 2))
const src = (p: string) => prependBaseUrl(p)

const gap = computed(() => gapOf(board.value))
const movable = computed(() => new Set(neighbors(board.value, cols.value)))
/** The piece at a place: its part of the picture. */
const tileStyle = (place: number) => {
  const piece = board.value[place]!
  const c = piece % cols.value
  const r = Math.floor(piece / cols.value)
  const x = cols.value > 1 ? (c / (cols.value - 1)) * 100 : 0
  const y = rows.value > 1 ? (r / (rows.value - 1)) * 100 : 0
  return { backgroundImage: `url(${src(props.game.image)})`, backgroundSize: `${cols.value * 100}% ${rows.value * 100}%`, backgroundPosition: `${x}% ${y}%` }
}
const isGap = (place: number) => place === gap.value && !solved.value
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${cols.value}, 1fr)`, gridTemplateRows: `repeat(${rows.value}, 1fr)` }))

function slide(place: number) {
  if (solved.value || between.value || finished.value) return
  const next = move(board.value, cols.value, place)
  if (!next) return
  board.value = next
  play('tap')
  message.value = ''
  if (isSolved(next)) roundOver()
}

function roundOver() {
  solved.value = true
  progress.mark()
  play('snap')
  message.value = t('app.adventure.slideSolved')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      play('star')
      return
    }
    between.value = true
    message.value = t('app.adventure.gameNext')
    later(() => {
      round.value++
      board.value = scramble(current.value.cols, current.value.rows, current.value.moves, current.value.seed)
      solved.value = false
      between.value = false
      message.value = ''
    }, 1400)
  }, 1500)
}

/** The arrow keys slide the tile that lies on the other side of the gap in that direction into it. */
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
  const step = d[e.key]
  if (!step) return
  e.preventDefault()
  const c = (gap.value % cols.value) + step[0]
  const r = Math.floor(gap.value / cols.value) + step[1]
  if (c < 0 || c >= cols.value || r < 0 || r >= rows.value) return
  slide(r * cols.value + c)
}

/** "Tip": the whole picture is shown for three seconds. */
function tip() {
  if (solved.value || between.value || finished.value || showing.value) return
  tips.value++
  showing.value = true
  later(() => (showing.value = false), 3000)
}
</script>

<template lang="pug">
  div(class="sl")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="sl-field" role="group" :aria-label="t('app.adventure.slideField')" tabindex="0" @keydown="onKey")
        div(class="sl-grid" :class="{ solved }" :style="gridStyle")
          button(
            v-for="(piece, place) in board"
            :key="`${round}-${place}`"
            type="button"
            class="sl-tile"
            :class="{ gap: isGap(place), movable: movable.has(place) && !solved }"
            :style="isGap(place) ? {} : tileStyle(place)"
            :disabled="isGap(place) || solved || between"
            :aria-label="isGap(place) ? t('app.adventure.slideGap') : t('app.adventure.slideTile', { n: piece + 1 })"
            @click="slide(place)"
          )
        img(v-if="showing" :src="src(game.image)" alt="" draggable="false" class="sl-model")
      p(class="sl-fb" role="status") {{ message }}
      div(class="sl-actions")
        AdvButton(tone="blau" small :disabled="solved || between || showing" @click="tip") {{ t('app.adventure.slideTip') }}
      p(class="sl-count") {{ t('app.adventure.slideCount', { n: round + (solved ? 1 : 0), total: rounds.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.slideDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2c3358
  box-shadow: inset 0 0 18px rgba(0, 0, 20, 0.5)

.sl-round
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

.sl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

.sl-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #1a2142

  &:focus-visible
    outline: 3px solid rgba(255, 255, 255, 0.95)

.sl-grid
  position: absolute
  inset: 0
  display: grid
  gap: 2px
  padding: 2px

  // every tile lies at its place: the tiles join and the stairway lights up
  &.solved
    gap: 0
    padding: 0
    filter: brightness(1.2) saturate(1.15)
    transition: filter 600ms ease-out

.sl-tile
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 4px
  background-color: #3a4272
  background-repeat: no-repeat
  cursor: default
  -webkit-tap-highlight-color: transparent

  &.movable
    cursor: pointer
    box-shadow: inset 0 0 0 2px rgba(255, 236, 170, 0.55)

  // the free gap: a light, empty surface with a soft edge
  &.gap
    background: rgba(255, 246, 220, 0.18)
    box-shadow: inset 0 0 0 2px rgba(255, 236, 170, 0.6)

.sl-model
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none

.sl-fb
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

.sl-actions
  display: flex
  justify-content: center

.sl-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #f3e6bf

@media (prefers-reduced-motion: reduce)
  .sl-grid.solved
    transition: none
</style>
