<script setup lang="ts">
/**
 * Mirror the pattern: on a flowery meadow a little stream runs down the middle. On its left bank lies a pattern of coloured flower stones; the
 * right bank is empty. The child completes it so that it is the mirror image of the left side ("what fits to it"): a stone is chosen from the
 * row below (dragged, or tapped and then the field) and put on a field of the right bank. A wrong colour gets a red cross and jumps back (a
 * mistake); the right one stays. The stones in the row never run out. Two rounds: a small pattern, then a bigger one with three colours.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MirrorGame } from '@/types/adventure'

const props = defineProps<{ game: MirrorGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every stone of the right bank in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.cols * r.rows, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const stoneOf = (id: string) => props.game.stones.find((s) => s.id === id)
const src = (p: string) => prependBaseUrl(p)
const labelOf = (id: string) => stoneOf(id)?.label ?? ''
/** The stone that belongs on the right bank at row `r`, column `c`: the mirror image of the left bank. */
const wanted = (r: number, c: number): string | undefined => current.value.left[r]?.[current.value.cols - 1 - c]

/** The stones that lie on the right bank (key `row-column`). */
const put = reactive<Record<string, string>>({})
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
const flash = ref<{ key: string; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 3, 6))
const cellKey = (r: number, c: number) => `${r}-${c}`

/** The colours the child can choose from: the stones that the pattern of this round uses, in the order of the data. */
const palette = computed(() => {
  const used = new Set(current.value.left.flat())
  return props.game.stones.filter((s) => used.has(s.id))
})
const total = computed(() => current.value.cols * current.value.rows)

function flashOn(key: string, kind: 'good' | 'bad') {
  flash.value = { key, kind }
  later(() => {
    if (flash.value?.key === key) flash.value = null
  }, 900)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(put)) delete put[k]
    message.value = ''
  }, 1600)
}

function drop(stone: string, target: string) {
  if (between.value || finished.value) return
  const m = /^cell-(\d+)-(\d+)$/.exec(target)
  if (!m) return
  const r = Number(m[1])
  const c = Number(m[2])
  const key = cellKey(r, c)
  if (put[key] || wanted(r, c) === undefined) return
  if (wanted(r, c) === stone) {
    put[key] = stone
    progress.mark()
    play('snap')
    flashOn(key, 'good')
    message.value = t('app.adventure.fbRight')
    if (Object.keys(put).length >= total.value) roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  flashOn(key, 'bad')
  message.value = t('app.adventure.mirrorWrong')
  wobble.value = stone
  later(() => {
    if (wobble.value === stone) wobble.value = null
  }, 450)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(id, target))
const gridStyle = computed(() => ({ '--half': String(current.value.cols) }))
</script>

<template lang="pug">
  div(class="mr" :style="{ backgroundImage: `url(${src(game.background)})` }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="mr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="mr-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="mr-board" role="group" :aria-label="t('app.adventure.mirrorField')" :style="gridStyle")
        template(v-for="(row, r) in current.left" :key="`${round}-${r}`")
          span(v-for="(id, c) in row" :key="`l${c}`" class="mr-cell left" :aria-label="t('app.adventure.mirrorLeft', { name: labelOf(id) })" role="img")
            img(:src="src(stoneOf(id)?.image ?? '')" alt="" draggable="false")
          span(class="mr-water" aria-hidden="true")
          button(
            v-for="(_, c) in row"
            :key="`r${c}`"
            type="button"
            class="mr-cell right"
            :class="{ filled: !!put[cellKey(r, c)], ready: selected !== null && !put[cellKey(r, c)], 'flash-good': flash?.key === cellKey(r, c) && flash.kind === 'good', 'flash-bad': flash?.key === cellKey(r, c) && flash.kind === 'bad' }"
            :data-drop="`cell-${r}-${c}`"
            :aria-label="put[cellKey(r, c)] ? t('app.adventure.mirrorRightFilled', { name: labelOf(put[cellKey(r, c)]) }) : t('app.adventure.mirrorRight', { r: r + 1, c: c + 1 })"
            @click="tapPlace(`cell-${r}-${c}`)"
          )
            img(v-if="put[cellKey(r, c)]" :src="src(stoneOf(put[cellKey(r, c)])?.image ?? '')" alt="" draggable="false")
            img(v-else :src="src(game.empty)" alt="" draggable="false" class="ghost")
            GameMark(v-if="flash?.key === cellKey(r, c)" :kind="flash.kind" class="mr-mark")
      p(class="mr-fb" role="status") {{ message }}
      div(class="mr-palette")
        div(
          v-for="s in palette"
          :key="s.id"
          class="mr-stone"
          :class="{ chosen: selected === s.id, wobble: wobble === s.id, lifted: dragging === s.id }"
          :style="dragStyle(s.id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.mirrorStone', { name: s.label })"
          @pointerdown="down($event, s.id)"
          @keydown.enter.space.prevent="toggleSelect(s.id)"
        )
          img(:src="src(s.image)" alt="" draggable="false")
    GameDone(v-else :stars="stars" :text="t('app.adventure.mirrorDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.mr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #cfe5b0
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(40, 70, 20, 0.3)

.mr-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 252, 232, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.mr-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.92)

// the two banks with the stream between them: the left pattern, a narrow strip of water, the right fields
.mr-board
  display: grid
  grid-template-columns: repeat(var(--half, 2), minmax(0, 1fr)) 20px repeat(var(--half, 2), minmax(0, 1fr))
  gap: 6px
  align-items: center
  padding: 10px
  border-radius: 14px
  background: rgba(255, 252, 232, 0.55)
  touch-action: manipulation

.mr-water
  align-self: stretch
  margin: -3px 0
  border-radius: 10px
  background: linear-gradient(180deg, #8ec9ee 0%, #5fa9d8 100%)
  box-shadow: inset 0 0 6px rgba(20, 70, 120, 0.5)

.mr-cell
  position: relative
  display: block
  aspect-ratio: 1
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  .ghost
    opacity: 0.45

  &.right
    cursor: pointer
    -webkit-tap-highlight-color: transparent

    &.ready
      animation: mr-ready 900ms ease-in-out infinite

    &.flash-good
      animation: flash-good 900ms ease-out

    &.flash-bad
      animation: flash-bad 900ms ease-out

.mr-mark
  position: absolute
  top: -6px
  right: -6px

.mr-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.94)

  &:empty
    display: none

.mr-palette
  display: flex
  justify-content: center
  gap: 14px
  padding: 8px
  border-radius: 14px
  background: rgba(60, 90, 30, 0.28)

.mr-stone
  width: 64px
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 4px 4px rgba(30, 50, 15, 0.5))

  &.chosen
    transform: translateY(-4px) scale(1.12)
    filter: drop-shadow(0 0 8px rgba(255, 230, 120, 0.95))

  &.wobble
    animation: mr-shake 420ms ease-in-out

  &.lifted
    cursor: grabbing

@keyframes flash-bad
  0%, 45%
    box-shadow: 0 0 0 4px rgba(214, 48, 49, 0.95), 0 0 22px 6px rgba(214, 48, 49, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(214, 48, 49, 0), 0 0 0 0 rgba(214, 48, 49, 0)

@keyframes flash-good
  0%, 45%
    box-shadow: 0 0 0 4px rgba(47, 174, 84, 0.95), 0 0 22px 6px rgba(47, 174, 84, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(47, 174, 84, 0), 0 0 0 0 rgba(47, 174, 84, 0)

@keyframes mr-ready
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.06)

@keyframes mr-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .mr-cell.right.ready,
  .mr-stone.wobble
    animation: none
</style>
