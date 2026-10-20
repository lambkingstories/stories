<script setup lang="ts">
/**
 * Plait the little basket: by the Nile stands a row of upright reed stakes. The reed band is plaited through row after row, alternately in front of a stake and behind the next one. The row that
 * is on glows. The child taps the cells where the reed runs in front of the stake: a piece of reed lies in front of the stake there. When all the "front" cells of a row are tapped, the reed lies
 * behind the other stakes by itself and the next row glows. A wrong cell (one where the reed has to run behind) is a cross, a dull sound and a mistake, nothing is set. After three mistakes in a
 * row the "Tip" button shows the next right cell (free). Round 1: three rows, four stakes, every row begins in front of the first stake; round 2: four rows, six stakes, every row begins the other
 * way round than the one below. At the end the basket is finished. No clock. The right cells are `frontCells` in `utils/moseGames.ts`. From the keyboard: Tab to the cells, Enter taps.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { frontCells } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { WeaveGame } from '@/types/adventure'

const props = defineProps<{ game: WeaveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const rounds = computed(() => props.game.rounds)
const cellsOf = (r: WeaveGame['rounds'][number]) => frontCells(r.rows, r.stakes, r.pattern)
// the whole task: every cell where the reed runs in front, of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + cellsOf(r).flat().filter(Boolean).length, 0))

const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const cells = computed(() => cellsOf(current.value))
/** The row that is on (counted from the bottom), and the cells of it that are tapped. */
const row = ref(0)
const tapped = ref<number[]>([])
const mistakesHere = ref(0)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const basket = ref(false)
const message = ref('')
const flash = ref<{ row: number; col: number; kind: 'good' | 'bad' } | null>(null)
const tipCell = ref<number | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const rowDone = (r: number) => r < row.value
const isFront = (r: number, c: number) => cells.value[r]?.[c] === true
const frontTapped = (r: number, c: number) => (r === row.value ? tapped.value.includes(c) : rowDone(r) && isFront(r, c))
const behindLaid = (r: number, c: number) => rowDone(r) && !isFront(r, c)
/** Rows from the top of the picture to the bottom: the first row is plaited at the bottom. */
const rowsTop = computed(() => Array.from({ length: current.value.rows }, (_, i) => current.value.rows - 1 - i))
const cols = computed(() => Array.from({ length: current.value.stakes }, (_, c) => c))
const fronts = computed(() => cells.value[row.value]?.map((f, c) => (f ? c : -1)).filter((c) => c >= 0) ?? [])
const nextRight = computed(() => fronts.value.find((c) => !tapped.value.includes(c)) ?? null)

function flashOn(r: number, c: number, kind: 'good' | 'bad') {
  flash.value = { row: r, col: c, kind }
  later(() => {
    if (flash.value?.row === r && flash.value.col === c) flash.value = null
  }, 700)
}

function tap(r: number, c: number) {
  if (between.value || finished.value || basket.value || r !== row.value || tapped.value.includes(c)) return
  tipCell.value = null
  if (isFront(r, c)) {
    tapped.value = [...tapped.value, c]
    progress.mark()
    play('snap')
    message.value = ''
    flashOn(r, c, 'good')
    if (fronts.value.every((f) => tapped.value.includes(f))) rowOver()
    return
  }
  mistakes.value++
  mistakesHere.value++
  play('wrong')
  message.value = t('app.adventure.weaveWrong')
  flashOn(r, c, 'bad')
}

function rowOver() {
  // the reed lies behind the other stakes by itself, the next row glows
  row.value++
  tapped.value = []
  mistakesHere.value = 0
  if (row.value < current.value.rows) return
  basket.value = true
  play('star')
  message.value = t('app.adventure.weaveRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1700)
    return
  }
  later(() => {
    basket.value = false
    between.value = true
    message.value = t('app.adventure.gameNext')
    later(() => {
      round.value++
      row.value = 0
      between.value = false
      message.value = ''
    }, 1300)
  }, 1700)
}

/** The tip, after three mistakes in a row: the next right cell glows (free). */
function showTip() {
  if (mistakesHere.value < 3 || nextRight.value === null) return
  tipCell.value = nextRight.value
  message.value = t('app.adventure.weaveTipText')
}

function key(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const list = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button.wv-cell'))
  const i = list.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  e.preventDefault()
  list[Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus()
}

const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${current.value.stakes}, 1fr)` }))
</script>

<template lang="pug">
  div(class="wv")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="wv-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="wv-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="wv-field")
        span(class="wv-bg" :style="{ backgroundImage: `url(${src(game.background)})` }" aria-hidden="true")
        div(v-if="!basket && !between" class="wv-grid" :style="gridStyle" role="group" :aria-label="t('app.adventure.weaveField', { row: Math.min(row + 1, current.rows), rows: current.rows })" @keydown="key")
          template(v-for="r in rowsTop" :key="`${round}-r-${r}`")
            button(
              v-for="c in cols"
              :key="`${round}-${r}-${c}`"
              type="button"
              class="wv-cell"
              :class="{ active: r === row, tip: r === row && tipCell === c }"
              :disabled="r !== row"
              :aria-label="t('app.adventure.weaveCell', { row: r + 1, col: c + 1 })"
              @click="tap(r, c)"
            )
              span(v-if="behindLaid(r, c)" class="wv-layer band behind")
                GameImage(:src="game.tiles.behind" colour="#8a7a48")
              span(class="wv-layer stake")
                GameImage(:src="game.tiles.stake" colour="#b09a52")
              span(v-if="frontTapped(r, c)" class="wv-layer band front")
                GameImage(:src="game.tiles.front" colour="#e0cf86")
              span(v-if="r === row" class="wv-layer glow")
                GameImage(:src="game.tiles.active" colour="rgba(255, 224, 120, 0.35)")
              GameMark(v-if="flash && flash.row === r && flash.col === c" :kind="flash.kind" class="wv-mark")
        span(v-if="basket" class="wv-done")
          GameImage(:src="game.done" colour="#c9a45a" round)
      p(class="wv-fb" role="status") {{ message }}
      AdvButton(tone="blau" class="wv-tip" :disabled="between || basket || mistakesHere < 3" @click="showTip") {{ t('app.adventure.weaveTip') }}
      p(class="wv-count") {{ t('app.adventure.weaveCount', { n: row, total: current.rows }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.weaveDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wv
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.wv-round
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

.wv-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.wv-field
  position: relative
  width: 100%
  max-width: 420px
  align-self: center
  min-height: 200px
  padding: 14px
  border-radius: 14px
  border: 3px solid #d4a83e
  overflow: hidden

// the picture of the stage lies blurred behind the stakes
.wv-bg
  position: absolute
  inset: -8px
  background-color: #a9c2a0
  background-size: cover
  background-position: center
  filter: blur(3px)

.wv-grid
  position: relative
  display: grid
  gap: 0

.wv-cell
  position: relative
  aspect-ratio: 1
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &.tip
    box-shadow: inset 0 0 0 4px rgba(255, 214, 90, 0.95)

.wv-layer
  position: absolute
  inset: 0
  display: block
  pointer-events: none

  // stand-ins: a stake is a thin upright bar, a band a flat strip across the cell
  &.stake :deep(.gi-stand)
    width: 26%
    height: 100%
    aspect-ratio: auto
    margin: 0 auto
    border-radius: 6px

  &.band :deep(.gi-stand)
    height: 34%
    aspect-ratio: auto
    margin-top: 33%
    border-radius: 6px

  &.glow :deep(.gi-stand)
    border: 0
    box-shadow: none

.wv-mark
  position: absolute
  top: 2px
  right: 2px
  z-index: 5

.wv-done
  position: relative
  display: block
  width: 70%
  margin: 0 auto

.wv-fb
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

.wv-tip
  align-self: center

.wv-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
