<script setup lang="ts">
/**
 * Sacks into the cave: seen from above, the floor of a cave of loam with rock, a few niches (soft glowing places in the floor) and sacks of grain. The child leads a small man (the arrow buttons or
 * keys, a swipe, or a tap on the next cell) and pushes the sacks with him: only pushing, never pulling, one sack at a time. A sack in a niche shines with a tick. If the man runs against a sack that
 * cannot go on, the sack wobbles with a cross and a dull sound, but it is no mistake. If a sack sticks in a corner (dead end), "One step back?" shows and the back button pulses. "One step back" is free
 * and as often as wanted; "Start again" and "Tip" (shows the next step) each count as a mistake. Round 1: a cave of 5 x 4 with two sacks, round 2: 6 x 5 with three sacks and rock in the middle.
 * No clock. The pushing is `moveMan`, the solution `solution`, the dead end `deadlock`, all in `utils/gideonGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { deadlock, isSolved, moveMan, sacksHome, solution, type CaveState, type Dir } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CaveGame } from '@/types/adventure'

const props = defineProps<{ game: CaveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every sack of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.sacks.length, 0))

/** How far a swipe has to go (pixels) to count, and the height of the picture in percent of its width (3 : 4). */
const SWIPE = 24
const SLOPE = 0.75

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const level = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const start = (): CaveState => ({ man: [...level.value.man], sacks: level.value.sacks.map((s) => [...s] as [number, number]) })
const state = ref<CaveState>(start())
const history = ref<CaveState[]>([])
const best = ref(0)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<number | null>(null)
const tipDir = ref<Dir | null>(null)
const flash = ref<'good' | 'bad' | null>(null)
const grid = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))
const stuck = computed(() => !between.value && deadlock(level.value, state.value))

/** The size of a cell in percent of the width of the picture, and the place of the grid (centred in the area). */
const cell = computed(() => Math.min(props.game.area.w / level.value.cols, props.game.area.h / SLOPE / level.value.rows))
const box = computed(() => {
  const w = cell.value * level.value.cols
  const h = cell.value * level.value.rows * SLOPE
  const a = props.game.area
  return { left: `${a.x + (a.w - w) / 2}%`, top: `${a.y + (a.h - h) / 2}%`, width: `${w}%`, height: `${h}%` }
})
const at = (c: [number, number]) => ({ left: `${(c[0] / level.value.cols) * 100}%`, top: `${(c[1] / level.value.rows) * 100}%`, width: `${100 / level.value.cols}%`, height: `${100 / level.value.rows}%` })

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 700)
}

function go(dir: Dir) {
  if (between.value || finished.value) return
  tipDir.value = null
  const r = moveMan(level.value, state.value, dir)
  if (!r.moved) {
    if (r.blocked === 'sack' || (r.blocked === 'wall' && sackAhead(dir))) {
      // a sack that cannot go on: it wobbles, a cross, a dull sound, no mistake
      const i = state.value.sacks.findIndex((s) => s[0] === state.value.man[0] + dx(dir) && s[1] === state.value.man[1] + dy(dir))
      wobble.value = i
      play('wrong')
      flashOn('bad')
      message.value = t('app.adventure.caveBlocked')
      later(() => {
        wobble.value = null
      }, 500)
    }
    return
  }
  history.value = [...history.value, state.value]
  state.value = r.state
  message.value = ''
  play(r.pushed ? 'tap' : 'flip')
  const home = sacksHome(level.value, r.state)
  if (r.pushed && home > best.value) {
    for (let i = best.value; i < home; i++) progress.mark()
    best.value = home
    play('snap')
    flashOn('good')
  }
  if (isSolved(level.value, r.state)) {
    roundOver()
    return
  }
  if (deadlock(level.value, r.state)) message.value = t('app.adventure.caveStuck')
}
const dx = (d: Dir) => (d === 'left' ? -1 : d === 'right' ? 1 : 0)
const dy = (d: Dir) => (d === 'up' ? -1 : d === 'down' ? 1 : 0)
/** Is a sack in front of the man in this direction? */
const sackAhead = (d: Dir) => state.value.sacks.some((s) => s[0] === state.value.man[0] + dx(d) && s[1] === state.value.man[1] + dy(d))

/** One step back: free, as often as wanted. */
function back() {
  if (between.value || finished.value || !history.value.length) return
  state.value = history.value[history.value.length - 1]!
  history.value = history.value.slice(0, -1)
  tipDir.value = null
  message.value = ''
  play('flip')
}

/** Start the round again (a mistake). */
function again() {
  if (between.value || finished.value) return
  mistakes.value++
  state.value = start()
  history.value = []
  tipDir.value = null
  message.value = ''
}

/** The tip: the next step of the shortest way from here (a mistake). */
function tip() {
  if (between.value || finished.value) return
  const way = solution(level.value, state.value)
  if (!way?.length) {
    message.value = t('app.adventure.caveNoTip')
    return
  }
  mistakes.value++
  tipDir.value = way[0]!
  message.value = t('app.adventure.caveTip', { dir: t(`app.adventure.caveDir${way[0]!.charAt(0).toUpperCase()}${way[0]!.slice(1)}`) })
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.caveRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1500)
    return
  }
  between.value = true
  later(() => {
    round.value++
    state.value = start()
    history.value = []
    best.value = 0
    between.value = false
    message.value = ''
  }, 2000)
}

function key(e: KeyboardEvent) {
  const dir = ({ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' } as Record<string, Dir>)[e.key]
  if (dir) {
    e.preventDefault()
    go(dir)
  } else if (e.key === 'Backspace' || e.key === 'z') {
    e.preventDefault()
    back()
  }
}

// a swipe on the cave leads the man, a tap on a cell next to him, too
let down: { x: number; y: number } | null = null
function pointerDown(e: PointerEvent) {
  down = { x: e.clientX, y: e.clientY }
}
function pointerUp(e: PointerEvent) {
  const d = down
  down = null
  if (!d) return
  const mx = e.clientX - d.x
  const my = e.clientY - d.y
  if (Math.hypot(mx, my) >= SWIPE) {
    go(Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : my > 0 ? 'down' : 'up')
    return
  }
  const r = grid.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  const col = Math.floor(((e.clientX - r.left) / r.width) * level.value.cols)
  const row = Math.floor(((e.clientY - r.top) / r.height) * level.value.rows)
  const mc = state.value.man[0] - col
  const mr = state.value.man[1] - row
  if (Math.abs(mc) + Math.abs(mr) !== 1) return
  go(mc === 1 ? 'left' : mc === -1 ? 'right' : mr === 1 ? 'up' : 'down')
}

const PAD: { dir: Dir; sign: string }[] = [
  { dir: 'up', sign: '↑' },
  { dir: 'left', sign: '←' },
  { dir: 'down', sign: '↓' },
  { dir: 'right', sign: '→' }
]
const homeAt = (c: [number, number]) => level.value.niches.some((n) => n[0] === c[0] && n[1] === c[1])
</script>

<template lang="pug">
  div(class="cv" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cv-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cv-hint") {{ between ? t('app.adventure.gameNext') : level.hint }}
      div(class="cv-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(
          v-if="!between"
          ref="grid"
          class="cv-grid"
          role="group"
          :aria-label="t('app.adventure.caveField', { n: best, total: level.sacks.length })"
          :style="box"
          @pointerdown="pointerDown"
          @pointerup="pointerUp"
        )
          span(v-for="(w, i) in level.walls" :key="`w-${round}-${i}`" class="cv-cell" :style="at(w)" aria-hidden="true")
            GameImage(:src="game.wall" colour="#6d5f50")
          span(v-for="(n, i) in level.niches" :key="`n-${round}-${i}`" class="cv-cell niche" :style="at(n)" aria-hidden="true")
            GameImage(:src="game.niche" colour="#f2d98a" round)
          span(
            v-for="(s, i) in state.sacks"
            :key="`s-${round}-${i}`"
            class="cv-cell sack"
            :class="{ home: homeAt(s), wobble: wobble === i }"
            :style="at(s)"
            role="img"
            :aria-label="homeAt(s) ? t('app.adventure.caveSackHome') : t('app.adventure.caveSack')"
          )
            GameImage(:src="game.sack" colour="#c9a45a")
          span(class="cv-cell man" :style="at(state.man)" role="img" :aria-label="t('app.adventure.caveMan')")
            GameImage(:src="game.man" :ratio="120 / 160" colour="#6f8fb5")
          GameMark(v-if="flash" :kind="flash" class="cv-mark")
      p(class="cv-fb" role="status") {{ message }}
      div(class="cv-pad" role="group" :aria-label="t('app.adventure.cavePad')")
        button(v-for="b in PAD" :key="b.dir" type="button" class="cv-key" :class="[b.dir, { tip: tipDir === b.dir }]" :aria-label="t(`app.adventure.caveDir${b.dir.charAt(0).toUpperCase()}${b.dir.slice(1)}`)" :disabled="between" @click="go(b.dir)") {{ b.sign }}
      div(class="cv-actions")
        AdvButton(tone="blau" :class="{ pulse: stuck }" :disabled="between || !history.length" @click="back") {{ t('app.adventure.caveBack') }}
        AdvButton(tone="blau" :disabled="between" @click="again") {{ t('app.adventure.caveAgain') }}
        AdvButton(tone="blau" :disabled="between" @click="tip") {{ t('app.adventure.caveTipButton') }}
      p(class="cv-count") {{ t('app.adventure.caveCount', { n: best, total: level.sacks.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.caveDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cv
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.cv-round
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

.cv-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.cv-field
  position: relative
  width: 100%
  max-width: 380px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8c6f4e
  background-size: cover
  background-position: center

.cv-grid
  position: absolute
  touch-action: none

.cv-cell
  position: absolute
  display: block
  box-sizing: border-box
  padding: 2%
  pointer-events: none
  transition: left 140ms ease, top 140ms ease

  &.sack.home
    filter: drop-shadow(0 0 8px rgba(255, 224, 110, 1))

  &.sack.wobble
    animation: cv-wobble 480ms ease-in-out

  &.man
    z-index: 3

  &.sack
    z-index: 2

.cv-mark
  position: absolute
  top: -22px
  right: 0
  z-index: 8

.cv-fb
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

// the arrow pad: four big buttons in a cross
.cv-pad
  display: grid
  grid-template-columns: repeat(3, 56px)
  grid-template-rows: repeat(2, 56px)
  gap: 6px
  justify-content: center

.cv-key
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #fff3cf
  color: #3f321b
  font-size: 1.6rem
  font-weight: 900
  cursor: pointer
  touch-action: manipulation

  &.up
    grid-column: 2
    grid-row: 1

  &.left
    grid-column: 1
    grid-row: 2

  &.down
    grid-column: 2
    grid-row: 2

  &.right
    grid-column: 3
    grid-row: 2

  &.tip
    box-shadow: 0 0 0 4px rgba(255, 214, 90, 0.95)
    background: #ffe38a

  &:disabled
    opacity: 0.6

.cv-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.pulse
  animation: cv-pulse 900ms ease-in-out infinite

.cv-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes cv-wobble
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-4px)
  75%
    transform: translateX(4px)

@keyframes cv-pulse
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.06)

@media (prefers-reduced-motion: reduce)
  .cv-cell
    transition: none

  .pulse
    animation: none
    outline: 3px solid rgba(255, 214, 90, 0.95)
</style>
