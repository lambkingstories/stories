<script setup lang="ts">
/**
 * The shutters (Luke 24,36). The front of the upper floor of a house in the evening, painted, with dark window openings. Every window has a wooden shutter, closed or open; an open window shows a painted
 * inside with lamp light and a glad disciple. A tap on a window turns its shutter and also the shutters of its neighbours (the data name them, `links`). The goal: every window open and bright.
 * Every two moves over the fewest moves (`par`) are one mistake (a cross and a word). Round 1: four windows in a row (neighbours left and right), two moves; round 2: six windows in two rows of three
 * (neighbours above, below, left, right), three moves. The arrow keys go from window to window, Enter or the space bar turns the shutter. Whoever does not go on gets the button "Help me" after
 * fifteen seconds: a window of a shortest solution is marked. The shutter is a picture over the light picture; it folds away (CSS `scaleX`), nothing is drawn.
 * Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { shuttersHint, shuttersMistakes, shuttersNeighbour, shuttersOpenCount, shuttersSolved, shuttersToggle } from '@/utils/osternNeuA'
import type { Dir, ShuttersGame } from '@/utils/osternNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: ShuttersGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every window that is closed at the start of a round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.start.filter((open) => !open).length, 0))

const TICK_MS = 250
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => current.value.ratio ?? 1.5)
const state = ref<boolean[]>([])
const moves = ref(0)
/** The mistakes of the rounds that are over, and of this one. */
const pastMistakes = ref(0)
const mistakes = computed(() => pastMistakes.value + (solved.value ? 0 : shuttersMistakes(moves.value, current.value.par)))
const between = ref(false)
const finished = ref(false)
const solved = ref(false)
const tooMany = ref(false)
const hintWin = ref<number | null>(null)
const idle = ref(0)
const message = ref('')
let messageSeq = 0
let startOpen = 0
let credited = 0
const wins = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const openNow = computed(() => shuttersOpenCount(state.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  state.value = current.value.start.slice()
  moves.value = 0
  between.value = false
  solved.value = false
  tooMany.value = false
  hintWin.value = null
  idle.value = 0
  startOpen = shuttersOpenCount(state.value)
  credited = 0
}
startRound()

function loop() {
  if (!between.value && !finished.value) idle.value += TICK_MS / 1000
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

/** More windows are open than ever before in this round: they count for "Go on" (once each). */
function credit() {
  const goal = current.value.start.length - startOpen
  const gained = Math.min(goal, openNow.value - startOpen)
  while (credited < gained) {
    progress.mark()
    credited++
  }
}

/** A tap on window `i`: its shutter turns, and so do those of its neighbours. */
function press(i: number) {
  if (between.value || finished.value || i < 0 || i >= state.value.length) return
  state.value = shuttersToggle(state.value, current.value.links, i)
  moves.value++
  idle.value = 0
  hintWin.value = null
  play('flip')
  credit()
  const over = moves.value - current.value.par
  if (shuttersSolved(state.value)) {
    solve()
    return
  }
  if (over > 0 && over % 2 === 0) {
    tooMany.value = true
    play('wrong')
    say(t('app.adventure.shuttersTooMany'), 3000)
    later(() => (tooMany.value = false), 3000)
  }
}

function solve() {
  solved.value = true
  between.value = true
  tooMany.value = false
  pastMistakes.value += shuttersMistakes(moves.value, current.value.par)
  later(() => play('right'), 250)
  say(t('app.adventure.shuttersAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    startRound()
    message.value = ''
  }, 2800)
}

function onKey(e: KeyboardEvent, i: number) {
  const arrows: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = arrows[e.key]
  if (d !== undefined) {
    e.preventDefault()
    idle.value = 0
    const k = shuttersNeighbour(current.value.windows, i, d, ratio.value)
    if (k !== null) wins.value[k]?.focus()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    press(i)
  }
}

/** The button "Help me": a window of a shortest solution is marked and gets the focus. */
async function helpMe() {
  idle.value = 0
  hintWin.value = shuttersHint(state.value, current.value.links)
  if (hintWin.value === null) return
  say(t('app.adventure.shuttersHelpSay'), 4000)
  await nextTick()
  wins.value[hintWin.value]?.focus()
}

// ---- looks
// a round may bring its own shutter and window pictures (the openings of the two houses are painted in different shapes)
const lights = computed(() => current.value.lights ?? props.game.lights)
const shutterPic = computed(() => current.value.shutter ?? props.game.shutter)
const light = (i: number) => lights.value[i % Math.max(1, lights.value.length)] ?? ''
const winStyle = (i: number) => {
  const w = current.value.windows[i]!
  return { left: `${w.x}%`, top: `${w.y}%`, width: `${w.w}%`, height: `${w.h}%` }
}
const winLabel = (i: number) => t('app.adventure.shuttersWindow', { n: i + 1, state: state.value[i] ? t('app.adventure.shuttersOpen') : t('app.adventure.shuttersClosed') })
const setWin = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) wins.value[i] = el
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(current.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.shuttersField')"
      )
        div(
          v-for="(w, i) in current.windows"
          :key="`${round}-${i}`"
          :ref="(el) => setWin(el, i)"
          class="gm-win"
          :class="{ open: state[i], hint: hintWin === i }"
          :data-win="i"
          :style="winStyle(i)"
          role="button"
          tabindex="0"
          :aria-label="winLabel(i)"
          :aria-pressed="state[i] ? 'true' : 'false'"
          @click="press(i)"
          @keydown="onKey($event, i)"
        )
          span(class="gm-light" aria-hidden="true")
            GameImage(:src="light(i)" :ratio="0.87" colour="#f2c46a" :label="`licht-${(i % Math.max(1, lights.length)) + 1}`")
          span(class="gm-shutter" aria-hidden="true")
            GameImage(:src="shutterPic" :ratio="0.87" colour="#7a5532" label="laden")
          span(v-if="solved" class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.shuttersCount', { n: openNow, total: state.length }) }}
      p(class="gm-moves")
        span {{ t('app.adventure.shuttersMoves', { n: moves, par: current.par }) }}
        span(v-if="tooMany" class="gm-bad")
          GameMark(kind="bad")
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.shuttersHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shuttersDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d7bd
  box-shadow: inset 0 0 18px rgba(70, 40, 20, 0.25)
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
  color: #4f3a28

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #4f3a28

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #5c4a3c
  background-size: cover
  background-position: center

// a window: the light picture fills the opening, the shutter lies over it
.gm-win
  position: absolute
  display: block
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  // the place to tap is at least 44 x 44 pixels, even when the painted window is smaller
  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: max(100%, 44px)
    height: max(100%, 44px)
    transform: translate(-50%, -50%)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.hint
    outline: 4px dashed #fff6dc
    outline-offset: 3px

.gm-light, .gm-shutter
  position: absolute
  inset: 0
  display: block
  overflow: hidden

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: cover

  :deep(.gi-stand)
    border-radius: 0

.gm-shutter
  z-index: 2
  transform-origin: center
  transition: transform 260ms ease-in-out, opacity 260ms ease-in-out

  .open &
    transform: scaleX(0)
    opacity: 0

.gm-mark
  position: absolute
  right: -6px
  top: -8px
  display: block
  z-index: 3

.gm-count, .gm-moves
  margin: 0
  align-self: center
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #4f3a28

.gm-bad
  display: inline-flex

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3a2a1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

// less motion: the shutter is gone at once, it does not fold
@media (prefers-reduced-motion: reduce)
  .gm-shutter
    transition: none
</style>
