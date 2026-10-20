<script setup lang="ts">
/**
 * Let the years go by: in front of the field at Haran a row of places shows the signs of the seasons (spring, summer, autumn, winter), year after year, always in the same order. Some
 * places are empty. The child drags the right sign into a gap (or taps the sign and then the gap). A wrong sign is a cross (a mistake) and goes back; the right one clicks into
 * place with a tick. A tally stick at the top gets a notch for every year that is complete. A year is one row (four places). Round 1: two years with two gaps in the middle; round 2:
 * seven years with four gaps, two of them at the end ("what comes next?"). There is no clock. The arithmetic is `expected` in `utils/jakobGames2.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { cycleRow, expected, yearOf } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CycleGame, CycleToken } from '@/types/adventure'

const props = defineProps<{ game: CycleGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every gap of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.gaps.length, 0))

/** Stand-in colours for the signs until their pictures are there (the signs differ by their shape in the painted pictures, not only by colour). */
const COLOURS: Record<string, string> = { fruehling: '#e9b7c9', sommer: '#f0d36a', herbst: '#d99a55', winter: '#9db9d6' }

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const row = computed(() => cycleRow(current.value.cycle, current.value.length, current.value.gaps))
const cols = computed(() => current.value.cycle.length)
const years = computed(() => Math.ceil(current.value.length / cols.value))

/** Which gaps are filled (the sign that lies there). */
const filled = reactive<Record<number, string>>({})
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<{ index: number; kind: 'good' | 'bad' } | null>(null)
const wobble = ref<string | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))
const src = (p: string) => prependBaseUrl(p)

/** The sign that lies in a gap ('' while it is empty). */
const filledId = (i: number) => filled[i] ?? ''
const tokenOf = (id: string): CycleToken | undefined => props.game.tokens.find((x) => x.id === id)
const labelOf = (id: string) => tokenOf(id)?.label ?? id
const imageOf = (id: string) => tokenOf(id)?.image ?? ''
/** A year is complete when no gap of its row is open; the tally stick shows a notch for each. */
const yearDone = (year: number) => row.value.filter((p) => yearOf(cols.value, p.index) === year).every((p) => !p.gap || filled[p.index] !== undefined)
const doneYears = computed(() => Array.from({ length: years.value }, (_, i) => i + 1).filter(yearDone).length)

function flashOn(index: number, kind: 'good' | 'bad') {
  flash.value = { index, kind }
  later(() => {
    if (flash.value?.index === index) flash.value = null
  }, 800)
}

function drop(tokenId: string, target: string) {
  if (between.value || finished.value) return
  const index = Number(target.replace('gap-', ''))
  if (!row.value[index]?.gap || filled[index] !== undefined) return
  if (tokenId === expected(current.value.cycle, index)) {
    filled[index] = tokenId
    progress.mark()
    play('snap')
    message.value = ''
    flashOn(index, 'good')
    if (current.value.gaps.every((g) => filled[g] !== undefined)) roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.cycleWrong')
  flashOn(index, 'bad')
  wobble.value = tokenId
  later(() => {
    if (wobble.value === tokenId) wobble.value = null
  }, 450)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1000)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    for (const k of Object.keys(filled)) delete filled[Number(k)]
    between.value = false
    message.value = ''
  }, 1500)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(id, target))
</script>

<template lang="pug">
  div(class="cy")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cy-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cy-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="cy-stick" role="img" :aria-label="t('app.adventure.cycleYears', { n: doneYears, total: years })")
        span(v-for="y in years" :key="y" class="cy-notch" :class="{ lit: yearDone(y) }")
        span(class="cy-years") {{ t('app.adventure.cycleYears', { n: doneYears, total: years }) }}
      div(class="cy-field" role="group" :aria-label="t('app.adventure.cycleField')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="cy-row" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }")
          template(v-for="place in row" :key="`${round}-${place.index}`")
            div(
              v-if="place.gap"
              class="cy-place gap"
              :class="{ filled: filled[place.index] !== undefined, ready: selected !== null && filled[place.index] === undefined, 'flash-good': flash?.index === place.index && flash.kind === 'good', 'flash-bad': flash?.index === place.index && flash.kind === 'bad' }"
              :data-drop="`gap-${place.index}`"
              role="button"
              tabindex="0"
              :aria-label="filled[place.index] !== undefined ? t('app.adventure.cycleGapFilled', { n: place.index + 1, name: labelOf(filledId(place.index)) }) : t('app.adventure.cycleGap', { n: place.index + 1 })"
              @click="tapPlace(`gap-${place.index}`)"
              @keydown.enter.space.prevent="tapPlace(`gap-${place.index}`)"
            )
              GameImage(v-if="filled[place.index] !== undefined" :src="imageOf(filledId(place.index))" :label="labelOf(filledId(place.index))" :colour="COLOURS[filledId(place.index)]" round)
              GameMark(v-if="flash?.index === place.index" :kind="flash.kind" class="cy-mark")
            div(v-else class="cy-place" role="img" :aria-label="labelOf(place.id)")
              GameImage(:src="imageOf(place.id)" :label="labelOf(place.id)" :colour="COLOURS[place.id]" round)
      p(class="cy-fb" role="status") {{ message }}
      div(class="cy-tray" role="group" :aria-label="t('app.adventure.cycleTray')")
        div(
          v-for="tok in game.tokens"
          :key="tok.id"
          class="cy-token"
          :class="{ chosen: selected === tok.id, wobble: wobble === tok.id, lifted: dragging === tok.id }"
          :style="dragStyle(tok.id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.cycleToken', { name: tok.label })"
          @pointerdown="down($event, tok.id)"
          @keydown.enter.space.prevent="toggleSelect(tok.id)"
        )
          GameImage(:src="tok.image" :label="tok.label" :colour="COLOURS[tok.id]" round)
    GameDone(v-else :stars="stars" :text="t('app.adventure.cycleDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cy
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.cy-round
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

.cy-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the tally stick: a notch for every year that is complete
.cy-stick
  display: flex
  align-items: center
  justify-content: center
  flex-wrap: wrap
  gap: 6px
  padding: 6px 10px
  border-radius: 12px
  background: #8a6236
  color: #fff7e2

.cy-notch
  width: 10px
  height: 26px
  border-radius: 3px
  background: rgba(40, 20, 0, 0.55)
  border: 1px solid rgba(255, 247, 226, 0.5)

  &.lit
    background: #f6d76a
    border-color: #fff7e2
    box-shadow: 0 0 6px rgba(255, 230, 120, 0.9)

.cy-years
  margin-left: 8px
  font-weight: 800
  font-size: 1rem

.cy-field
  position: relative
  padding: 10px
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center

.cy-row
  display: grid
  gap: 8px
  max-width: 340px
  margin: 0 auto

.cy-place
  position: relative
  display: flex
  align-items: center
  justify-content: center
  min-height: 56px
  padding: 4px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.7)

  &.gap
    border: 3px dashed rgba(95, 65, 25, 0.8)
    background: rgba(255, 246, 220, 0.45)
    cursor: pointer

    &.filled
      border-style: solid
      background: rgba(227, 242, 200, 0.9)

    &.ready
      box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

    &.flash-good
      box-shadow: 0 0 0 4px rgba(60, 160, 70, 0.9)

    &.flash-bad
      box-shadow: 0 0 0 4px rgba(200, 50, 50, 0.9)

.cy-mark
  position: absolute
  top: -8px
  right: -8px

.cy-fb
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

.cy-tray
  display: flex
  justify-content: center
  gap: 12px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.cy-token
  width: 64px
  min-height: 64px
  padding: 4px
  border-radius: 14px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

  &.wobble
    animation: cy-shake 420ms ease-in-out

@keyframes cy-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .cy-token.wobble
    animation: none
</style>
