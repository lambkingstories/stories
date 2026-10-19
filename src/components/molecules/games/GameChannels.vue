<script setup lang="ts">
/**
 * Turn the channels: seen from above, the stream (left) feeds a grid of garden tiles: straight pieces, curves, forks. The child taps a piece to
 * turn it a quarter. As soon as a way runs from the stream to a tree or a bed, the water flows and the plant blooms. Turning is never wrong, so
 * there are no mistakes; a "Hint" button makes one piece that has to be turned blink softly (and takes the third star). Two rounds: a small
 * garden with two plants, then a bigger one with four (the stream divides into four arms). The flow is worked out by `utils/channels.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { flow, goalsOf, isTurnable, openings, solve } from '@/utils/channels'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ChannelGame, ChannelTile } from '@/types/adventure'

const props = defineProps<{ game: ChannelGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every plant of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + goalsOf(r.grid), 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** The turns the child has made: the rotation of every tile of this round (copied from the data when the round starts). */
const rot = reactive<number[][]>([])
function loadRound() {
  rot.splice(0, rot.length, ...current.value.grid.map((row) => row.map((t) => t.rot)))
}
loadRound()
/** The grid as it lies now. */
const grid = computed<ChannelTile[][]>(() => current.value.grid.map((row, r) => row.map((t, c) => ({ ...t, rot: rot[r]?.[c] ?? t.rot }))))
const state = computed(() => flow(grid.value))
/** The plants that have bloomed (once a plant has bloomed it stays, whatever is turned afterwards). */
const bloomed = reactive<Record<string, boolean>>({})
const hints = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const hintAt = ref<{ r: number; c: number } | null>(null)
const stars = computed(() => mistakeStars(hints.value, 0, 1))

const src = (p: string) => prependBaseUrl(p)
const isWet = (r: number, c: number) => !!state.value.wet[r]?.[c]
const tileSrc = (tile: ChannelTile, r: number, c: number) => src((isWet(r, c) ? props.game.wet : props.game.tiles)[tile.kind])
const goalOf = (tile: ChannelTile) => (tile.goal ? props.game.goals[tile.goal] : undefined)
const turn = (tile: ChannelTile) => `rotate(${tile.rot * 90}deg)`

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(bloomed)) delete bloomed[k]
    hintAt.value = null
    loadRound()
    message.value = ''
  }, 1600)
}

function tapTile(r: number, c: number) {
  if (between.value || finished.value) return
  const tile = grid.value[r]![c]!
  if (!isTurnable(tile.kind)) return
  rot[r]![c] = (tile.rot + 1) % 4
  hintAt.value = null
  play('tap')
  // a plant that the water reaches now blooms
  let news = 0
  for (const id of flow(grid.value).reached) {
    if (bloomed[id]) continue
    bloomed[id] = true
    progress.mark()
    news++
  }
  if (news) {
    play('right')
    message.value = t('app.adventure.channelBloom')
  } else {
    message.value = ''
  }
  if (goalsOf(current.value.grid) === Object.keys(bloomed).length) roundOver()
}

/** "Hint": one piece that has to be turned blinks (it takes the third star). */
function hint() {
  if (between.value || finished.value) return
  const solution = solve(grid.value)
  if (!solution) return
  hints.value++
  for (let r = 0; r < grid.value.length; r++) {
    for (let c = 0; c < grid.value[r]!.length; c++) {
      const tile = grid.value[r]![c]!
      if (!isTurnable(tile.kind)) continue
      const want = openings(tile.kind, solution[r]![c]!).slice().sort().join()
      const have = openings(tile.kind, tile.rot).slice().sort().join()
      if (want !== have) {
        hintAt.value = { r, c }
        later(() => {
          if (hintAt.value?.r === r && hintAt.value.c === c) hintAt.value = null
        }, 2600)
        return
      }
    }
  }
}

const cols = computed(() => current.value.grid[0]?.length ?? 1)
</script>

<template lang="pug">
  div(class="ch")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ch-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ch-hint") {{ current.hint }}
      div(class="ch-grid" role="group" :aria-label="t('app.adventure.channelField')" :style="{ '--cols': String(cols) }")
        template(v-for="(row, r) in grid" :key="`${round}-${r}`")
          button(
            v-for="(tile, c) in row"
            :key="`${round}-${r}-${c}`"
            type="button"
            class="ch-tile"
            :class="{ wet: isWet(r, c), fixed: !isTurnable(tile.kind), hint: hintAt?.r === r && hintAt?.c === c, bloom: tile.goal && bloomed[tile.goal] }"
            :disabled="!isTurnable(tile.kind)"
            :aria-label="goalOf(tile) ? t(bloomed[tile.goal] ? 'app.adventure.channelGoalBloom' : 'app.adventure.channelGoalWilted', { name: goalOf(tile).label }) : tile.kind === 'source' ? t('app.adventure.channelSource') : isTurnable(tile.kind) ? t('app.adventure.channelTile', { r: r + 1, c: c + 1 }) : t('app.adventure.channelFixed')"
            @click="tapTile(r, c)"
          )
            img(:src="tileSrc(tile, r, c)" alt="" draggable="false" class="ch-base" :style="{ transform: turn(tile) }")
            img(v-if="goalOf(tile)" :src="src(bloomed[tile.goal] ? goalOf(tile).bloom : goalOf(tile).wilted)" alt="" draggable="false" class="ch-plant")
      p(class="ch-fb" role="status") {{ message }}
      div(class="ch-actions")
        AdvButton(tone="blau" small @click="hint") {{ t('app.adventure.channelHint') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.channelDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ch
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: linear-gradient(180deg, #e9d9ae 0%, #d8c08a 100%)
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.3)

.ch-round
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

.ch-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ch-grid
  display: grid
  grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr))
  gap: 2px
  padding: 4px
  border-radius: 12px
  background: rgba(120, 90, 40, 0.35)
  touch-action: manipulation

.ch-tile
  position: relative
  display: block
  aspect-ratio: 1
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 6px
  background: transparent
  overflow: hidden
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.fixed
    cursor: default

  &.hint
    animation: ch-blink 700ms ease-in-out 4
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

.ch-base
  display: block
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none
  transition: transform 220ms ease-out

.ch-plant
  position: absolute
  inset: 6%
  width: 88%
  height: 88%
  object-fit: contain
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 30, 10, 0.5))

.ch-fb
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

.ch-actions
  display: flex
  justify-content: center

@keyframes ch-blink
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.06)

@media (prefers-reduced-motion: reduce)
  .ch-base
    transition: none

  .ch-tile.hint
    animation: none
</style>
