<script setup lang="ts">
/**
 * Sacks for great and small: on a street in Nineveh stand people and animals in their clothes. At the bottom lie two piles, small sacks and big sacks. The child drags a sack onto a figure (or taps the pile, then the figure):
 * a child needs a small sack, a grown-up and an animal a big one ("the great and the small", "man and beast", Jonah 3:5.8). A right sack changes the figure to its picture in the sack; a wrong size springs back with a cross
 * (a mistake) and one line that says who needs which. Round 1: six people (three children, three grown-ups); round 2: seven figures (two children, three grown-ups, an ox and a sheep). Which sack fits is `needsSack` in
 * `utils/jonaGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { needsSack, sackTotal } from '@/utils/jonaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SacksGame } from '@/types/adventure'

const props = defineProps<{ game: SacksGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every figure of every round gets its sack
progress.setGoal(sackTotal(props.game))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const dressed = reactive<Record<string, boolean>>({})
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<{ id: string; kind: 'good' | 'bad' } | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))
const count = computed(() => Object.keys(dressed).length)

function drop(sack: string, figureId: string) {
  if (between.value || finished.value || dressed[figureId]) return
  const f = current.value.figures.find((x) => x.id === figureId)
  if (!f) return
  if (needsSack(f.who) === sack) {
    dressed[figureId] = true
    progress.mark()
    play('basket')
    message.value = ''
    flashOn(figureId, 'good')
    if (count.value >= current.value.figures.length) roundOver()
  } else {
    mistakes.value++
    play('wrong')
    message.value = t(f.who === 'child' ? 'app.adventure.sacksSmallNeeded' : 'app.adventure.sacksBigNeeded')
    flashOn(figureId, 'bad')
  }
}
const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(id, target))

function flashOn(id: string, kind: 'good' | 'bad') {
  flash.value = { id, kind }
  later(() => {
    if (flash.value?.id === id) flash.value = null
  }, 900)
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.sacksRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(dressed)) delete dressed[k]
    between.value = false
    message.value = ''
  }, 2200)
}

const sackStyle = (s: { id: string; w: number }) => ({ width: `${s.w}%`, ...(dragStyle(s.id) ?? {}) })
const figureLabel = (f: { id: string; who: 'child' | 'adult' | 'animal' }) =>
  dressed[f.id] ? t('app.adventure.sacksDressed') : t('app.adventure.sacksFigure', { who: t(`app.adventure.sacksWho_${f.who}`) })

const sacks = computed(() => [
  { id: 'small', image: props.game.sackSmall, label: t('app.adventure.sacksSmall'), w: 13 },
  { id: 'big', image: props.game.sackBig, label: t('app.adventure.sacksBig'), w: 20 }
])
</script>

<template lang="pug">
  div(class="sk")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sk-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="sk-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        button(
          v-for="f in current.figures"
          :key="`${round}-${f.id}`"
          type="button"
          class="sk-figure"
          :class="{ done: dressed[f.id], target: selected && !dressed[f.id] }"
          :data-drop="f.id"
          :style="{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%` }"
          :disabled="between"
          :aria-label="figureLabel(f)"
          @click="tapPlace(f.id)"
        )
          GameImage(:src="dressed[f.id] ? f.imageSack : f.image" colour="#a8896b")
          GameMark(v-if="flash && flash.id === f.id" :kind="flash.kind" class="sk-mark")
      div(class="sk-tray")
        button(
          v-for="s in sacks"
          :key="s.id"
          type="button"
          class="sk-sack"
          :class="{ chosen: selected === s.id, drag: dragging === s.id }"
          :style="sackStyle(s)"
          :aria-label="s.label"
          :aria-pressed="selected === s.id"
          @pointerdown="down($event, s.id)"
          @keydown.enter.prevent="toggleSelect(s.id)"
          @keydown.space.prevent="toggleSelect(s.id)"
        )
          GameImage(:src="s.image" colour="#a8896b")
          span(class="sk-label") {{ s.label }}
      p(class="sk-fb" role="status") {{ message }}
      p(class="sk-count") {{ t('app.adventure.sacksCount', { n: count, total: current.figures.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sacksDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sk
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcc4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sk-round
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

.sk-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sk-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8a07a
  background-size: cover
  background-position: center

// a figure: its feet stand on the given place; the whole figure is the place a sack is dropped on
.sk-figure
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -8px

  &.target:not(.done)
    filter: drop-shadow(0 0 8px rgba(255, 240, 160, 0.95))

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.sk-mark
  position: absolute
  top: -6px
  right: -6px

.sk-tray
  display: flex
  align-items: flex-end
  justify-content: center
  gap: 28px
  padding: 6px 4px 2px

// a pile of sacks: dragged by pointer, or chosen by a tap (or Enter) and then the figure is tapped
.sk-sack
  position: relative
  min-width: 70px
  padding: 4px
  border: 3px solid transparent
  border-radius: 14px
  background: rgba(255, 246, 220, 0.5)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-tap-highlight-color: transparent

  &.chosen
    border-color: #d4a83e
    background: rgba(255, 240, 190, 0.9)

  &.drag
    cursor: grabbing

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px

.sk-label
  display: block
  margin-top: 2px
  font-weight: 800
  font-size: 0.95rem
  color: #3f321b

.sk-fb
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

.sk-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
