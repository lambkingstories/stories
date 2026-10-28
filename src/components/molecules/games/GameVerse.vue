<script setup lang="ts">
/**
 * The sentence with a gap: a sentence of the story stands on a wooden board and one or two words are missing. Leaves with words hang below; the child drags
 * the right leaf into the gap (or taps the leaf and then the gap). A wrong leaf gets a red cross and flies back (a mistake); the right one
 * stays and the verse reads whole. Nobody has to read fast: whoever does not read just tries. Two rounds: first a sentence with one gap, then one with two.
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
import { isPainted } from '@/utils/gameBackground'
import type { VerseGame } from '@/types/adventure'

const props = defineProps<{ game: VerseGame }>()
/** A soft (blurred) stage picture, unless the data names its own painted backdrop (`/hintergrund/`): that one is shown sharp. */
const soft = computed(() => !!props.game.soft && !isPainted(props.game.background))
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every gap of every verse of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.answers.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** The word that lies in a gap (the key is `verse-gap`), and the leaves that are used up. */
const filled = reactive<Record<string, number>>({})
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<number | null>(null)
const flash = ref<{ key: string; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))

const gapKey = (v: number, g: number) => `${v}-${g}`
const usedWords = computed(() => new Set(Object.values(filled)))
/** The leaves that are still on the branch: all words of the round that are not in a gap, in a fixed mixed order. */
const leaves = computed(() => {
  const ids = current.value.words.map((_, i) => i).filter((i) => !usedWords.value.has(i))
  let seed = current.value.words.length * 3109 + 7 + round.value * 13
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  return ids
})
/** The sentence of this round (one board; the template and the checks work on a list of sentences). */
const verses = computed(() => [{ parts: current.value.parts, answers: current.value.answers }])
const totalGaps = computed(() => current.value.answers.length)
const gapsFilled = computed(() => Object.keys(filled).length)

function flashOn(k: string, kind: 'good' | 'bad') {
  flash.value = { key: k, kind }
  later(() => {
    if (flash.value?.key === k) flash.value = null
  }, 900)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 700)
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(filled)) delete filled[k]
    message.value = ''
  }, 1500)
}

function drop(id: string, target: string) {
  if (between.value || finished.value) return
  const word = Number(id)
  const m = /^gap-(\d+)-(\d+)$/.exec(target)
  if (!m || usedWords.value.has(word)) return
  const v = Number(m[1])
  const g = Number(m[2])
  const verse = verses.value[v]
  const k = gapKey(v, g)
  if (!verse || g >= verse.answers.length || filled[k] !== undefined) return
  if (verse.answers[g] === word) {
    filled[k] = word
    progress.mark()
    play('snap')
    flashOn(k, 'good')
    message.value = t('app.adventure.fbRight')
    if (gapsFilled.value >= totalGaps.value) roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  flashOn(k, 'bad')
  message.value = t('app.adventure.verseWrong')
  wobble.value = word
  later(() => {
    if (wobble.value === word) wobble.value = null
  }, 450)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(id, target))
const src = (p: string) => prependBaseUrl(p)
</script>

<template lang="pug">
  div(class="vs" :class="{ 'game-soft': soft }" :style="soft ? { '--bg': `url(${src(game.background)})` } : { backgroundImage: `url(${src(game.background)})` }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="vs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="vs-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="vs-boards")
        div(v-for="(verse, v) in verses" :key="`${round}-${v}`" class="vs-board" :style="{ backgroundImage: `url(${src(game.board)})` }")
          p(class="vs-text")
            template(v-for="(part, g) in verse.parts" :key="g")
              | {{ part }}
              button(
                v-if="g < verse.answers.length"
                type="button"
                class="vs-gap"
                :class="{ filled: filled[gapKey(v, g)] !== undefined, ready: selected !== null && filled[gapKey(v, g)] === undefined, 'flash-good': flash?.key === gapKey(v, g) && flash.kind === 'good', 'flash-bad': flash?.key === gapKey(v, g) && flash.kind === 'bad' }"
                :data-drop="`gap-${v}-${g}`"
                :aria-label="filled[gapKey(v, g)] !== undefined ? t('app.adventure.verseGapFilled', { word: current.words[filled[gapKey(v, g)]] }) : t('app.adventure.verseGap', { n: g + 1 })"
                @click="tapPlace(`gap-${v}-${g}`)"
              )
                | {{ filled[gapKey(v, g)] !== undefined ? current.words[filled[gapKey(v, g)]] : '' }}
                GameMark(v-if="flash?.key === gapKey(v, g)" :kind="flash.kind" class="vs-mark")
      p(class="vs-fb" role="status") {{ message }}
      div(class="vs-leaves")
        div(
          v-for="i in leaves"
          :key="i"
          class="vs-leaf"
          :class="{ chosen: selected === String(i), wobble: wobble === i, lifted: dragging === String(i) }"
          :style="{ backgroundImage: `url(${src(game.leaf)})`, ...dragStyle(String(i)) }"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.verseWord', { word: current.words[i] })"
          @pointerdown="down($event, String(i))"
          @keydown.enter.space.prevent="toggleSelect(String(i))"
        )
          span {{ current.words[i] }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.verseDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.vs
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #cfe3b4
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(40, 70, 20, 0.3)

.vs-round
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

.vs-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.92)

.vs-boards
  display: flex
  flex-direction: column
  gap: 10px

// the painted board is a light wood with its own rim and a see-through margin: the picture is stretched over the whole box and the text on it is dark
.vs-board
  padding: 26px 30px
  background-color: transparent
  background-size: 100% 100%
  background-repeat: no-repeat
  background-position: center
  filter: drop-shadow(0 4px 6px rgba(60, 40, 10, 0.45))

.vs-text
  margin: 0
  color: #3a2410
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 1.15rem
  line-height: 2.1
  text-shadow: 0 1px 0 rgba(255, 244, 214, 0.55)

.vs-gap
  position: relative
  display: inline-block
  min-width: 84px
  min-height: 44px
  margin: 0 4px
  padding: 0 12px
  vertical-align: middle
  border: 2px dashed #6b4a1e
  border-radius: 12px
  background: rgba(255, 252, 235, 0.55)
  color: #2c4a1f
  font: inherit
  font-weight: 800
  cursor: pointer

  &.filled
    border-style: solid
    background: #e3f2c8

  &.ready
    animation: vs-ready 900ms ease-in-out infinite

  &.flash-good
    animation: flash-good 900ms ease-out

  &.flash-bad
    animation: flash-bad 900ms ease-out

.vs-mark
  position: absolute
  top: -10px
  right: -8px

.vs-fb
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

.vs-leaves
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  padding: 8px
  border-radius: 14px
  background: rgba(60, 90, 30, 0.3)

.vs-leaf
  display: flex
  align-items: center
  justify-content: center
  min-width: 92px
  min-height: 56px
  padding: 4px 18px
  background-color: #6fae4a
  background-size: 100% 100%
  background-repeat: no-repeat
  border-radius: 28px 6px 28px 6px
  color: #17340c
  font-weight: 800
  font-size: 1.05rem
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  box-shadow: 0 4px 8px rgba(30, 50, 15, 0.45)
  transition: transform 160ms ease-out

  &.chosen
    transform: translateY(-4px) scale(1.06)
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95), 0 6px 10px rgba(30, 50, 15, 0.45)

  &.wobble
    animation: vs-shake 420ms ease-in-out

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

@keyframes vs-ready
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.05)

@keyframes vs-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .vs-gap.ready,
  .vs-leaf.wobble
    animation: none
</style>
