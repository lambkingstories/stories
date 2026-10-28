<script setup lang="ts">
/**
 * Lay the word: above stand the beginning of a sentence from the story (the hint) and empty boxes, one for each letter of the word that is asked for. Below lie letter tiles in a mixed order, two
 * of them too many. The child drags a tile into a box (or taps a tile and then the box). The right letter at the right place clicks in with a tick; a wrong letter wobbles back with a cross (a
 * mistake). A word that is laid whole shines. "Tip" lays one letter (it counts as a tip). Round 1 and round 2 each ask for one short word; every language has its own words (the letters are
 * text, no pictures). There is no clock. The tiles are `tilesFor` in `utils/gideonGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { tilesFor } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { WordGame } from '@/types/adventure'

const props = defineProps<{ game: WordGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every letter of every word
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.word.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const letters = computed(() => current.value.word.split(''))
const tiles = computed(() => tilesFor(current.value.word, current.value.extra))
/** Which tile (number) lies in each box; an empty text for a box that is still empty. */
const placed = reactive<string[]>([])
const reset = () => placed.splice(0, placed.length, ...Array.from({ length: current.value.word.length }, () => ''))
reset()
const used = computed(() => placed.filter((p) => p !== '').map(Number))
const mistakes = ref(0)
const tips = ref(0)
const between = ref(false)
const finished = ref(false)
const complete = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
const flash = ref<{ box: number; kind: 'good' | 'bad' } | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value + tips.value, 2, 6))

function flashOn(box: number, kind: 'good' | 'bad') {
  flash.value = { box, kind }
  later(() => {
    if (flash.value?.box === box) flash.value = null
  }, 700)
}

function lay(tile: number, box: number) {
  if (between.value || finished.value || box < 0 || box >= placed.length || placed[box] !== '') return
  if (tiles.value[tile] === letters.value[box]) {
    placed[box] = String(tile)
    progress.mark()
    play('snap')
    message.value = ''
    flashOn(box, 'good')
    if (placed.every((p) => p !== '')) wordDone()
    return
  }
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.wordWrong')
  flashOn(box, 'bad')
  wobble.value = `t${tile}`
  later(() => {
    if (wobble.value === `t${tile}`) wobble.value = null
  }, 450)
}

function wordDone() {
  complete.value = true
  play('star')
  message.value = t('app.adventure.wordRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    reset()
    complete.value = false
    between.value = false
    message.value = ''
  }, 1800)
}

/** The tip: the letter of the first empty box is laid from a tile that is still free. */
function tip() {
  if (between.value || finished.value) return
  const box = placed.findIndex((p) => p === '')
  if (box < 0) return
  const tile = tiles.value.findIndex((l, i) => l === letters.value[box] && !used.value.includes(i))
  if (tile < 0) return
  tips.value++
  lay(tile, box)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => lay(Number(id.replace('t', '')), Number(target.replace('box-', ''))))
const free = computed(() => tiles.value.map((letter, i) => ({ letter, i, id: `t${i}` })).filter((x) => !used.value.includes(x.i)))
</script>

<template lang="pug">
  div(class="wd game-soft" :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="wd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="wd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="wd-boxes" role="group" :aria-label="t('app.adventure.wordBoxes', { n: placed.filter((p) => p !== '').length, total: letters.length })" :class="{ shine: complete }")
        button(
          v-for="(l, b) in letters"
          :key="`${round}-b-${b}`"
          type="button"
          class="wd-box"
          :class="{ filled: placed[b] !== '', ready: selected !== null && placed[b] === '' }"
          :data-drop="`box-${b}`"
          :aria-label="placed[b] !== '' ? t('app.adventure.wordBoxFilled', { n: b + 1, letter: l }) : t('app.adventure.wordBox', { n: b + 1 })"
          @click="tapPlace(`box-${b}`)"
        )
          | {{ placed[b] !== '' ? l : '' }}
          GameMark(v-if="flash && flash.box === b" :kind="flash.kind" class="wd-mark")
      p(class="wd-fb" role="status") {{ message }}
      div(class="wd-tiles" role="group" :aria-label="t('app.adventure.wordTiles')")
        div(
          v-for="x in free"
          :key="`${round}-${x.id}`"
          class="wd-tile"
          :class="{ chosen: selected === x.id, wobble: wobble === x.id, lifted: dragging === x.id }"
          :style="dragStyle(x.id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.wordTile', { letter: x.letter })"
          @pointerdown="down($event, x.id)"
          @keydown.enter.space.prevent="toggleSelect(x.id)"
        ) {{ x.letter }}
      AdvButton(tone="blau" class="wd-tip" :disabled="between || complete" @click="tip") {{ t('app.adventure.wordTip') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wordDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wd
  display: flex
  flex-direction: column
  gap: 12px
  padding: 14px 10px 18px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #3b3050
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(20, 10, 40, 0.5)

.wd-round
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

.wd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 8px 12px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.95)

.wd-boxes
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

  &.shine .wd-box
    box-shadow: 0 0 12px rgba(255, 224, 120, 1)
    background: #fff3b8

.wd-box
  position: relative
  width: 52px
  height: 60px
  border-radius: 12px
  border: 3px dashed rgba(255, 246, 220, 0.9)
  background: rgba(255, 246, 220, 0.25)
  font-family: inherit
  font-weight: 900
  font-size: 1.7rem
  color: #3f321b
  cursor: pointer

  &.filled
    border-style: solid
    background: #fff6dc

  &.ready
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

.wd-mark
  position: absolute
  top: -12px
  right: -12px

.wd-fb
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

.wd-tiles
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 64px
  padding: 8px
  border-radius: 14px
  background: rgba(255, 246, 220, 0.2)

.wd-tile
  display: flex
  align-items: center
  justify-content: center
  width: 52px
  height: 56px
  border-radius: 12px
  border: 2px solid rgba(150, 100, 30, 0.7)
  background: #f3dca2
  font-weight: 900
  font-size: 1.6rem
  color: #3f321b
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

  &.wobble
    animation: wd-shake 420ms ease-in-out

.wd-tip
  align-self: center

@keyframes wd-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .wd-tile.wobble
    animation: none
</style>
