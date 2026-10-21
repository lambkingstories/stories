<script setup lang="ts">
/**
 * Put the words in order: on a block of stone lie chips with a word each, in a mixed order. Above them is an empty strip for a sentence from the story. The child drags the words into the strip in
 * the right order (or taps a chip and then the strip): the right next word stays (a tick), a wrong one wobbles back with a cross (a mistake). "Tip" puts the next word (a tip). A whole sentence
 * shines. Each round has three sentences, round 1 short ones and round 2 longer ones; the sentences are in the story (each language has its own). No clock. The next word is `nextWord`, the mix
 * `shuffle` (never in the right order), both in `utils/moseGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { nextWord, shuffle, wordsOf } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { WordsGame } from '@/types/adventure'

const props = defineProps<{ game: WordsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every sentence of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.sentences.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const sentenceNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const sentence = computed(() => current.value.sentences[Math.min(sentenceNo.value, current.value.sentences.length - 1)]!)
const words = computed(() => wordsOf(sentence.value))
const chips = computed(() => shuffle(words.value, round.value * 10 + sentenceNo.value + 1).map((word, i) => ({ id: `w${i}`, word })))
/** The ids of the chips that lie in the strip, in the order they were laid. */
const laid = reactive<string[]>([])
const placed = computed(() => laid.map((id) => chips.value.find((c) => c.id === id)?.word ?? ''))
const free = computed(() => chips.value.filter((c) => !laid.includes(c.id)))
const mistakes = ref(0)
const tips = ref(0)
const between = ref(false)
const finished = ref(false)
const complete = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value + tips.value, 3, 8))

function lay(id: string) {
  if (between.value || finished.value || complete.value) return
  const chip = chips.value.find((c) => c.id === id)
  if (!chip || laid.includes(id)) return
  if (chip.word === nextWord(sentence.value, placed.value)) {
    laid.push(id)
    play('snap')
    message.value = ''
    flash.value = 'good'
    later(() => {
      flash.value = null
    }, 600)
    if (laid.length >= words.value.length) sentenceDone()
    return
  }
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.wordsWrong')
  flash.value = 'bad'
  wobble.value = id
  later(() => {
    flash.value = null
    if (wobble.value === id) wobble.value = null
  }, 600)
}

function sentenceDone() {
  complete.value = true
  progress.mark()
  play('star')
  message.value = t('app.adventure.wordsRight')
  later(() => {
    complete.value = false
    laid.splice(0, laid.length)
    message.value = ''
    if (sentenceNo.value < current.value.sentences.length - 1) {
      sentenceNo.value++
      return
    }
    if (lastRound.value) {
      finished.value = true
      return
    }
    between.value = true
    message.value = t('app.adventure.gameNext')
    later(() => {
      round.value++
      sentenceNo.value = 0
      between.value = false
      message.value = ''
    }, 1400)
  }, 1100)
}

/** The tip: the next word is laid from a chip that is still free. */
function tip() {
  if (between.value || finished.value || complete.value) return
  const want = nextWord(sentence.value, placed.value)
  const chip = free.value.find((c) => c.word === want)
  if (!chip) return
  tips.value++
  lay(chip.id)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id) => lay(id))
const totalSentences = computed(() => rounds.value.reduce((n, r) => n + r.sentences.length, 0))
const countDone = computed(() => rounds.value.slice(0, round.value).reduce((n, r) => n + r.sentences.length, 0) + sentenceNo.value + (complete.value ? 1 : 0))
const chipStyle = computed(() => ({ backgroundImage: `url(${src(props.game.chip)})` }))
</script>

<template lang="pug">
  div(class="ww game-soft" :style="{ '--bg': `url(${src(game.background)})` }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ww-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ww-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        class="ww-strip"
        :class="{ ready: selected !== null, shine: complete }"
        data-drop="strip"
        role="group"
        :aria-label="t('app.adventure.wordsStrip', { n: laid.length, total: words.length })"
        :style="{ backgroundImage: `url(${src(game.strip)})` }"
        @click="tapPlace('strip')"
      )
        span(v-for="(w, i) in placed" :key="`${round}-${sentenceNo}-p-${i}`" class="ww-word" :aria-label="t('app.adventure.wordsSlot', { n: i + 1, word: w })") {{ w }}
        span(v-for="k in Math.max(0, words.length - placed.length)" :key="`${round}-${sentenceNo}-e-${k}`" class="ww-gap" aria-hidden="true")
      p(class="ww-fb" role="status") {{ message }}
      div(class="ww-chips" role="group" :aria-label="t('app.adventure.wordsChips')")
        div(
          v-for="c in free"
          :key="`${round}-${sentenceNo}-${c.id}`"
          class="ww-chip"
          :class="{ chosen: selected === c.id, wobble: wobble === c.id, lifted: dragging === c.id }"
          :style="{ ...chipStyle, ...dragStyle(c.id) }"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.wordsChip', { word: c.word })"
          @pointerdown="down($event, c.id)"
          @keydown.enter.space.prevent="toggleSelect(c.id)"
        ) {{ c.word }}
      AdvButton(tone="blau" class="ww-tip" :disabled="between || complete" @click="tip") {{ t('app.adventure.wordsTip') }}
      p(class="ww-count") {{ t('app.adventure.wordsCount', { n: countDone, total: totalSentences }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wordsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ww
  display: flex
  flex-direction: column
  gap: 12px
  padding: 14px 10px 18px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #8a7458
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(40, 25, 10, 0.4)

.ww-round
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

.ww-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 8px 12px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.95)

// the strip for the sentence: the words lie in it one after the other, the rest are gaps
.ww-strip
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 6px
  min-height: 84px
  padding: 10px 12px
  border-radius: 14px
  border: 3px dashed rgba(255, 246, 220, 0.85)
  background-color: rgba(230, 214, 180, 0.9)
  background-size: 100% 100%
  cursor: pointer

  &.ready
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

  &.shine
    box-shadow: 0 0 14px 4px rgba(255, 224, 120, 1)
    border-style: solid

.ww-word
  padding: 4px 12px
  border-radius: 10px
  background: rgba(255, 252, 238, 0.95)
  font-weight: 800
  font-size: 1.1rem
  color: #3f321b

.ww-gap
  display: inline-block
  width: 36px
  height: 8px
  border-radius: 4px
  background: rgba(95, 65, 25, 0.45)

.ww-fb
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

.ww-chips
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 64px
  padding: 8px
  border-radius: 14px
  background: rgba(255, 246, 220, 0.2)

.ww-chip
  display: flex
  align-items: center
  justify-content: center
  min-width: 64px
  min-height: 52px
  padding: 6px 14px
  border-radius: 12px
  border: 2px solid rgba(90, 70, 40, 0.7)
  background-color: #d8c9a6
  background-size: 100% 100%
  font-weight: 800
  font-size: 1.1rem
  color: #3f321b
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

  &.wobble
    animation: ww-shake 420ms ease-in-out

.ww-tip
  align-self: center

.ww-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #fff6dc
  text-shadow: 0 1px 3px rgba(40, 25, 10, 0.7)

@keyframes ww-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .ww-chip.wobble
    animation: none
</style>
