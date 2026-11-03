<script setup lang="ts">
/**
 * Sweep for the coin (Luke 15,8-10). A room in the stone house, seen from above, is dark; a tap on the little lamp lights it. Then dust lies on the floor (a soft brown-grey layer on a canvas), and the finger is the broom:
 * wherever it moves, the dust is swept away (with the arrow keys a broom can be moved, too). The share of the floor that is free is counted on the coarse grid of the wiping game (`utils/wipe.ts`); when 60 % of the place
 * of the coin is free, the coin glints, and a tap on it lifts it: it flies into the open hand of the woman. Round 2 is a smaller room with more furniture and two things that lie free on the floor and only look like a
 * coin (a lid of brass, a pebble): a tap on one of them is a mistake (it wobbles, a cross, a word, a dull sound; each thing counts once). The "Help" button lets the place of the coin glimmer for a few seconds (no loss
 * of parts, but then no third star). Parts of the task per round: the lamp (1), the sweeping (8, by the share of the floor that is swept) and the coin (1). The arithmetic is in `utils/gleichnisseGames.ts`.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { COIN_BRUSH, COIN_FLOOR, COIN_LAMP_PARTS, COIN_PARTS, COIN_PICK_PARTS, COIN_SWEEP_PARTS, coinRegion, coinRevealed, coinStars, coinSweepParts } from '@/utils/gleichnisseGames'
import { coverage, makeGrid, wipeLine } from '@/utils/wipe'
import { seeded } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CoinDecoy, CoinGame } from '@/types/adventure'

const props = defineProps<{ game: CoinGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: ten parts for every round
progress.setGoal(props.game.rounds.length * COIN_PARTS)

/** The drawing of the dust has this many pixels (it is scaled to the screen). */
const W = 480
const H = 320
/** The sweeping parts are 8; so much of the floor swept counts for all of them, see `coinSweepParts`. */
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const region = computed(() => coinRegion(current.value.coin, props.game.coin.w))
const decoys = computed(() => current.value.decoys ?? [])

let grid = makeGrid()
const lit = ref(false)
const revealed = ref(false)
const taken = ref(false)
const floorShare = ref(0)
const lampMarked = ref(false)
const sweepMarked = ref(0)
const pickMarked = ref(false)
const solved = ref(0)
const misses = ref(0)
const helped = ref(false)
const helping = ref(false)
const tappedDecoys = ref<number[]>([])
const wobble = ref<{ index: number; n: number } | null>(null)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
const stars = computed(() => coinStars(misses.value, rounds.value.length, helped.value))
const canvasEl = ref<HTMLCanvasElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const ctx = () => canvasEl.value?.getContext('2d') ?? null
const src = (p: string) => prependBaseUrl(p)
const sweptPercent = computed(() => Math.min(100, Math.round((floorShare.value / 0.4) * 100)))
const canSweep = computed(() => lit.value && !taken.value && !between.value && !finished.value)
const canHelp = computed(() => canSweep.value && !revealed.value)
/** The place the coin flies to: the open hand of the woman (a little above the bottom middle of her picture). */
const handAt = computed(() => ({ x: props.game.woman.x - props.game.woman.w * 0.2, y: Math.max(8, props.game.woman.y - props.game.woman.w * 0.9) }))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** Lays the dust over the floor: a soft brown-grey veil with specks (the same every time in a round). */
function layDust() {
  const c = ctx()
  if (!c) return
  c.globalCompositeOperation = 'source-over'
  c.clearRect(0, 0, W, H)
  c.fillStyle = 'rgba(158, 138, 108, 0.94)'
  c.fillRect(0, 0, W, H)
  const rand = seeded(7 + round.value * 13)
  for (let i = 0; i < 420; i++) {
    c.fillStyle = i % 2 ? 'rgba(118, 98, 70, 0.32)' : 'rgba(205, 188, 156, 0.3)'
    c.beginPath()
    c.arc(rand() * W, rand() * H, 2 + rand() * 7, 0, Math.PI * 2)
    c.fill()
  }
}
onMounted(layDust)

/** The lamp: it is light, the sweeping begins. */
function light() {
  if (lit.value || finished.value) return
  lit.value = true
  play('found')
  if (!lampMarked.value) {
    lampMarked.value = true
    for (let i = 0; i < COIN_LAMP_PARTS; i++) progress.mark()
  }
  say(t('app.adventure.coinLit'))
}

/** Takes the dust away along a line of the finger: on the drawing (a soft round brush) and in the grid that is counted. */
function sweep(from: { x: number; y: number }, to: { x: number; y: number }) {
  if (!canSweep.value) return
  const c = ctx()
  if (c) {
    c.globalCompositeOperation = 'destination-out'
    const r = (COIN_BRUSH / 100) * W
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 2))
    for (let i = 0; i <= steps; i++) {
      const x = ((from.x + ((to.x - from.x) * i) / steps) / 100) * W
      const y = ((from.y + ((to.y - from.y) * i) / steps) / 100) * H
      const g = c.createRadialGradient(x, y, r * 0.3, x, y, r)
      g.addColorStop(0, 'rgba(0,0,0,1)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
    }
  }
  if (wipeLine(grid, from, to, COIN_BRUSH) > 0) update()
}

/** Counts the swept floor, gives the parts of the sweeping, and lets the coin glint when its place is free. */
function update() {
  floorShare.value = coverage(grid, COIN_FLOOR)
  const target = coinSweepParts(floorShare.value)
  for (let i = sweepMarked.value; i < target; i++) progress.mark()
  sweepMarked.value = Math.max(sweepMarked.value, target)
  if (!revealed.value && coinRevealed(grid, region.value)) reveal()
}

function reveal() {
  revealed.value = true
  helping.value = false
  for (let i = sweepMarked.value; i < COIN_SWEEP_PARTS; i++) progress.mark()
  sweepMarked.value = COIN_SWEEP_PARTS
  play('found')
  say(t('app.adventure.coinGlint'), 0)
}

/** The coin is lifted: it flies into the hand of the woman, then the next round or the end. */
function take() {
  if (!revealed.value || taken.value) return
  taken.value = true
  play('coin')
  if (!pickMarked.value) {
    pickMarked.value = true
    for (let i = 0; i < COIN_PICK_PARTS; i++) progress.mark()
  }
  solved.value++
  say(t('app.adventure.coinFound'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => {
    between.value = true
    say(t('app.adventure.gameNext'), 0)
  }, 1300)
  later(nextRound, 2400)
}

function nextRound() {
  round.value++
  grid = makeGrid()
  lit.value = false
  revealed.value = false
  taken.value = false
  floorShare.value = 0
  lampMarked.value = false
  sweepMarked.value = 0
  pickMarked.value = false
  tappedDecoys.value = []
  wobble.value = null
  helping.value = false
  between.value = false
  message.value = ''
  layDust()
}

/** A thing that only looks like a coin: a mistake (once for each thing). */
function decoy(index: number) {
  if (!canSweep.value) return
  if (!tappedDecoys.value.includes(index)) {
    tappedDecoys.value = [...tappedDecoys.value, index]
    misses.value++
  }
  wobble.value = { index, n: (wobble.value?.n ?? 0) + 1 }
  play('wrong')
  say(t('app.adventure.coinDecoy'))
}

/** "Help": the place of the coin glimmers softly for a few seconds. */
function help() {
  if (!canHelp.value) return
  helped.value = true
  helping.value = true
  say(t('app.adventure.coinHelpHint'), 4000)
  later(() => (helping.value = false), 4000)
}

// ---- the finger and the arrow keys
let last: { x: number; y: number } | null = null
const broom = ref<{ x: number; y: number } | null>(null)
const pointOf = (e: PointerEvent) => {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / h) * 100 }
}
function down(e: PointerEvent) {
  if (e.button > 0 || !canSweep.value) return
  last = pointOf(e)
  broom.value = last
  sweep(last, last)
}
function move(e: PointerEvent) {
  if (!last) return
  const p = pointOf(e)
  broom.value = p
  sweep(last, p)
  last = p
}
function up() {
  last = null
  broom.value = null
}
let wiper = { x: 50, y: 50 }
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }
  const step = d[e.key]
  if (!step) return
  e.preventDefault()
  const to = { x: Math.min(98, Math.max(2, wiper.x + step[0])), y: Math.min(98, Math.max(2, wiper.y + step[1])) }
  broom.value = to
  sweep(wiper, to)
  wiper = to
}
onBeforeUnmount(() => {
  last = null
})

const decoySprite = (d: CoinDecoy) => (d.kind === 'lid' ? props.game.lid : props.game.pebble)
const regionStyle = computed(() => {
  const r = region.value
  return { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
})
const coinStyle = computed(() => {
  const [x, y] = current.value.coin
  const at = taken.value ? handAt.value : { x, y }
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.coin.w}%` }
})
const womanStyle = computed(() => ({ left: `${props.game.woman.x}%`, top: `${props.game.woman.y}%`, width: `${props.game.woman.w}%` }))
const lampStyle = computed(() => ({ left: `${props.game.lamp.x}%`, top: `${props.game.lamp.y}%`, width: `${props.game.lamp.w}%` }))
const broomStyle = computed(() => (broom.value ? { left: `${broom.value.x}%`, top: `${broom.value.y}%`, width: `${props.game.broom.w}%` } : undefined))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="gm-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="fieldEl"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(current.room)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.coinField')"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @pointerleave="up"
        @keydown="onKey"
      )
        canvas(ref="canvasEl" class="gm-dust" :width="W" :height="H" aria-hidden="true")
        div(v-if="!lit" class="gm-dark" aria-hidden="true")
        span(v-if="helping" class="gm-shimmer" :style="regionStyle" aria-hidden="true")
        template(v-if="lit")
          button(
            v-for="(d, i) in decoys"
            :key="`${round}-d${i}`"
            type="button"
            class="gm-decoy"
            :class="{ wobble: wobble && wobble.index === i }"
            :style="{ left: `${d.x}%`, top: `${d.y}%`, width: `${decoySprite(d).w}%` }"
            :aria-label="decoySprite(d).label"
            @pointerdown.stop
            @click="decoy(i)"
          )
            span(:key="wobble && wobble.index === i ? wobble.n : 0" class="gm-decoy-in")
              GameImage(:src="decoySprite(d).image" :ratio="1" colour="#c9a24a" round :label="decoySprite(d).label")
            span(v-if="tappedDecoys.includes(i)" class="gm-mark" aria-hidden="true")
              GameMark(kind="bad")
        button(
          type="button"
          class="gm-lamp"
          :class="{ lit }"
          :style="lampStyle"
          :aria-label="t('app.adventure.coinLamp')"
          :disabled="lit"
          @pointerdown.stop
          @click="light"
        )
          span(v-if="lit" class="gm-lampglow" aria-hidden="true")
          GameImage(:src="game.lamp.image" :ratio="1" colour="#d9a441" round :label="game.lamp.label")
        div(class="gm-woman" :style="womanStyle" role="img" :aria-label="game.woman.label")
          GameImage(:src="game.woman.image" :ratio="0.9" colour="#b56b6b" :label="game.woman.label")
        button(
          v-if="revealed"
          type="button"
          class="gm-coin"
          :class="{ flying: taken }"
          :style="coinStyle"
          :aria-label="t('app.adventure.coinCoin')"
          :disabled="taken"
          @pointerdown.stop
          @click="take"
        )
          span(class="gm-glint" aria-hidden="true")
          GameImage(:src="game.coin.image" :ratio="1" colour="#d8d8d8" round :label="game.coin.label")
          span(v-if="taken" class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
        span(v-if="broom && canSweep" class="gm-broom" :style="broomStyle" aria-hidden="true")
          GameImage(:src="game.broom.image" :ratio="1" colour="#a5835a" :label="game.broom.label")
      p(v-if="lit" class="gm-sweep") {{ t('app.adventure.coinSweep', { n: sweptPercent }) }}
      p(v-else class="gm-sweep") {{ t('app.adventure.coinDark') }}
      div(class="gm-actions")
        AdvButton(tone="blau" small :disabled="!canHelp" @click="help") {{ t('app.adventure.coinHelp') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.coinCount', { n: solved, total: rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.coinDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8c7a58
  background-size: cover
  background-position: center
  touch-action: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

.gm-dust
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

// the room is dark until the lamp burns
.gm-dark
  position: absolute
  inset: 0
  background: rgba(18, 12, 6, 0.8)
  pointer-events: none
  z-index: 2

// the lamp lies above the darkness, so that it can be found and tapped (at least 56 pixels)
.gm-lamp
  position: absolute
  display: block
  min-width: 56px
  min-height: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 3
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.5))
  animation: gm-pulse 1400ms ease-in-out infinite

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 50%

  &:disabled
    cursor: default

  &.lit
    animation: none

.gm-lampglow
  position: absolute
  left: 50%
  top: 50%
  width: 220%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 236, 160, 0.55) 0%, rgba(255, 220, 120, 0.2) 45%, rgba(255, 220, 120, 0) 70%)
  pointer-events: none

.gm-woman
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

// things that lie free on the floor and look like a coin
.gm-decoy
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 3
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.45))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 50%

.gm-decoy.wobble .gm-decoy-in
  animation: gm-wobble 420ms ease-in-out

.gm-decoy-in
  display: block

.gm-mark
  position: absolute
  right: -8px
  top: -10px
  z-index: 6
  pointer-events: none

// the coin glints; when it is lifted it flies to the hand of the woman
.gm-coin
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 5
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: left 800ms ease-in-out, top 800ms ease-in-out, scale 800ms ease-in-out
  filter: drop-shadow(0 2px 3px rgba(40, 25, 5, 0.55))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 50%

  &:disabled
    cursor: default

  &.flying
    scale: 0.75

.gm-glint
  position: absolute
  left: 50%
  top: 50%
  width: 190%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 244, 170, 0.45) 40%, rgba(255, 244, 170, 0) 70%)
  pointer-events: none
  animation: gm-shine 1000ms ease-in-out infinite

.gm-shimmer
  position: absolute
  border-radius: 12px
  border: 3px dashed rgba(255, 255, 255, 0.95)
  background: rgba(255, 244, 190, 0.22)
  box-shadow: 0 0 18px rgba(255, 230, 140, 0.8)
  pointer-events: none
  z-index: 4
  animation: gm-shine 1400ms ease-in-out infinite

.gm-broom
  position: absolute
  display: block
  transform: translate(-30%, -70%)
  pointer-events: none
  z-index: 7

.gm-sweep
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

.gm-actions
  display: flex
  justify-content: center

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@keyframes gm-pulse
  0%, 100%
    scale: 1
  50%
    scale: 1.08

@keyframes gm-shine
  0%, 100%
    opacity: 0.55
  50%
    opacity: 1

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  25%
    rotate: -12deg
  75%
    rotate: 12deg

// less motion: the lamp does not pulse, nothing glints or wobbles, the coin jumps to the hand
@media (prefers-reduced-motion: reduce)
  .gm-lamp, .gm-glint, .gm-shimmer, .gm-decoy.wobble .gm-decoy-in
    animation: none

  .gm-coin
    transition: none
</style>
