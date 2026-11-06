<script setup lang="ts">
/**
 * Palm branches (Rev 7,9: "a great multitude ... clothed with white robes, and palms in their hands"). A wide place in the light; rows of people in white, from all peoples, each row a strip cut into
 * people (columns); at the back the little lamb. The child strokes with one finger from left to right over the crowd (the arrow key right held down does the same, at the right speed) and the
 * palm branches rise one person after the other like a wave and stay up for a moment. It is the speed that counts: the meter above (a palm with a needle, and in words) says "too slow", "just right" or "too fast".
 * Too fast: people are skipped and their branches do not come up. Too slow: the branches in front sink again before the wave has come on. A wave that reaches the right end at the right speed: a tick and a bright tone.
 * A wave that fails: a cross and "A little slower" or "A little faster", a mistake, and the child strokes again. Round 1: one row, two waves. Round 2: three rows, one wave through each (front, middle, back; the
 * back ones are longer, so slower), at the end all branches rise together. Less motion: the branches switch without fading, and the allowed speed is twice as wide. "Help me" after fifteen seconds: a
 * glowing dot runs along the row at the right speed. Nothing is shown by colour alone. Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { PALMS_START_MAX, palmsIdeal, palmsUp, palmsWindow, strokeStart, strokeTick } from '@/utils/offenbarungNeuB'
import type { PalmsGame, Pt, Stroke } from '@/utils/offenbarungNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PalmsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.waves.length, 0))

const TICK_MS = 50
const IDLE_SECONDS = 15
const FINAL_MS = 2600
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 3)
const waveIdx = ref(0)
const wave = computed(() => current.value.waves[Math.min(waveIdx.value, current.value.waves.length - 1)]!)
const win = computed(() => palmsWindow(wave.value.speed, still))
const time = ref(0)
const stroke = ref<Stroke | null>(null)
let startX = 0
const fx = ref(0)
const pressing = ref(false)
const keyHeld = ref(false)
let keyX = 0
/** Per row: when each person's branches went up (null: down). */
const standing = ref<(number | null)[][]>(props.game.rows.map(() => new Array<number | null>(props.game.cols).fill(null)))
const finalUp = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helpAt = ref<number | null>(null)
const between = ref(false)
const finished = ref(false)
const tickAt = ref<Pt | null>(null)
const crossAt = ref<Pt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const tempo = computed(() => (stroke.value && !stroke.value.fail && !stroke.value.done ? stroke.value.tempo : null))
const needle = computed(() => (tempo.value === 'slow' ? -38 : tempo.value === 'fast' ? 38 : 0))
const tempoWord = computed(() => t(`app.adventure.palms${tempo.value === 'slow' ? 'Slow' : tempo.value === 'fast' ? 'Fast' : tempo.value === 'ok' ? 'Ok' : 'Idle'}`))
const rowOfWave = computed(() => props.game.rows[wave.value.row]!)
const dotX = computed(() => (helpAt.value === null ? null : Math.min(1, ((time.value - helpAt.value) / 1000) * palmsIdeal(win.value))))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: Pt) {
  const id = ++markSeq
  tickAt.value = kind === 'good' ? at : null
  crossAt.value = kind === 'bad' ? at : null
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  time.value += TICK_MS
  if (!between.value && !pressing.value && !keyHeld.value) idle.value += TICK_MS / 1000
  if (helpAt.value !== null && dotX.value !== null && dotX.value >= 1) helpAt.value = null
  const s = stroke.value
  if (!s || s.fail || s.done || between.value) return
  let x = fx.value
  if (keyHeld.value && !pressing.value) {
    keyX = Math.min(1, keyX + (palmsIdeal(win.value) * TICK_MS) / 1000)
    x = keyX
  }
  strokeTick(s, win.value, x, time.value, startX)
  after(s)
}
later(step, TICK_MS)

/** What the stroke has done in this moment. */
function after(s: Stroke) {
  if (s.fail) {
    mistakes.value++
    play('wrong')
    flash('bad', { x: Math.min(95, Math.max(5, s.front * 100)), y: rowOfWave.value.y + rowOfWave.value.h / 2 })
    say(t(s.fail === 'fast' ? 'app.adventure.palmsTooFast' : 'app.adventure.palmsTooSlow'), 3200)
    later(() => {
      if (stroke.value === s) stroke.value = null
    }, 1400)
    return
  }
  if (s.done) waveDone(s)
}

function waveDone(s: Stroke) {
  standing.value[wave.value.row] = s.raised.slice()
  progress.mark()
  play('right')
  flash('good', { x: 50, y: rowOfWave.value.y + rowOfWave.value.h / 2 })
  helpAt.value = null
  idle.value = 0
  waveIdx.value++
  if (waveIdx.value >= current.value.waves.length) {
    endRound()
    return
  }
  say(t('app.adventure.palmsNext'), 2400)
  later(() => {
    if (stroke.value === s) stroke.value = null
  }, 600)
}

function endRound() {
  between.value = true
  pressing.value = false
  say(t('app.adventure.palmsRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      finalUp.value = true
      play('right')
      say(t('app.adventure.palmsAll'), 0)
    }, 1000)
    later(() => {
      play('star')
      finished.value = true
    }, 1000 + FINAL_MS)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    waveIdx.value = 0
    stroke.value = null
    standing.value = props.game.rows.map(() => new Array<number | null>(props.game.cols).fill(null))
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger and the keys
function fractionAt(e: { clientX: number }): number | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return null
  return (e.clientX - r.left) / r.width
}
function onMove(e: PointerEvent) {
  const f = fractionAt(e)
  if (f !== null) fx.value = Math.min(1, Math.max(0, f))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
function begin(x: number) {
  startX = x
  keyX = x
  fx.value = x
  stroke.value = strokeStart(props.game.cols, x, time.value)
  helpAt.value = null
  idle.value = 0
}
function up() {
  unlisten()
  pressing.value = false
  const s = stroke.value
  if (s && !s.fail && !s.done && !between.value) {
    strokeTick(s, win.value, fx.value, time.value, startX)
    after(s)
    if (!s.fail && !s.done) {
      stroke.value = null
      say(t('app.adventure.palmsAgain'), 2600)
    }
  }
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  const f = fractionAt(e)
  if (f === null) return
  const x = Math.min(1, Math.max(0, f))
  if (x > PALMS_START_MAX) {
    say(t('app.adventure.palmsStartLeft'), 2600)
    return
  }
  pressing.value = true
  begin(x)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
onBeforeUnmount(() => unlisten())
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'ArrowRight') return
  e.preventDefault()
  if (between.value || finished.value || pressing.value || keyHeld.value) return
  keyHeld.value = true
  begin(0.02)
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key !== 'ArrowRight' || !keyHeld.value) return
  keyHeld.value = false
  const s = stroke.value
  if (s && !s.fail && !s.done && !between.value) {
    stroke.value = null
    say(t('app.adventure.palmsAgain'), 2600)
  }
}

/** "Help me": a glowing dot runs along the row at the right speed. */
function helpMe() {
  idle.value = 0
  helpAt.value = time.value
  say(t('app.adventure.palmsHelpSay'), 4500)
}

// ---- looks
const rowsBackFirst = computed(() => props.game.rows.map((r, i) => ({ r, i })).reverse())
const rowStyle = (r: { y: number; h: number }) => ({ top: `${r.y}%`, height: `${r.h}%` })
const colStyle = (url: string, c: number) => {
  const n = props.game.cols
  return { left: `${(c * 100) / n}%`, width: `${100 / n}%`, backgroundImage: `url(${src(url)})`, backgroundSize: `${n * 100}% 100%`, backgroundPosition: `${n > 1 ? (c / (n - 1)) * 100 : 0}% 0` }
}
const isUp = (ri: number, c: number): boolean => {
  if (finalUp.value) return true
  const s = stroke.value
  const at = s && wave.value.row === ri && !between.value ? s.raised[c] : standing.value[ri]?.[c]
  return palmsUp(props.game.hold, at ?? null, time.value)
}
const lambStyle = computed(() => ({ left: `${props.game.lambAt.x}%`, top: `${props.game.lambAt.y}%`, width: `${props.game.lambAt.w}%` }))
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const dotStyle = computed(() => ({ left: `${(dotX.value ?? 0) * 100}%`, top: `${rowOfWave.value.y + rowOfWave.value.h / 2}%` }))
const markRowStyle = computed(() => rowStyle(rowOfWave.value))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-meter" role="img" :aria-label="tempoWord")
        span(class="gm-meter-pic")
          GameImage(:src="game.meterPalm" :ratio="1" colour="#8fb36a" label="tempo-palme")
          span(class="gm-needle" :style="{ transform: `rotate(${needle}deg)` }")
            GameImage(:src="game.meterNeedle" :ratio="1" colour="#7a5a36" label="tempo-zeiger")
        span(class="gm-meter-word" aria-live="polite") {{ tempoWord }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.crowd)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.palmsField')"
        @pointerdown.prevent="down"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
      )
        span(class="gm-lamb" :style="lambStyle" aria-hidden="true")
          GameImage(:src="game.lamb" :ratio="1" colour="#f4f0e4" label="lamm")
        div(v-for="item in rowsBackFirst" :key="`row-${item.i}`" class="gm-row" :data-row="item.i" :style="rowStyle(item.r)" aria-hidden="true")
          GameImage(:src="item.r.down" :ratio="ratio * 100 / item.r.h" colour="transparent" :label="`reihe-${item.i + 1}-unten`")
          span(
            v-for="c in game.cols"
            :key="`col-${item.i}-${c}`"
            class="gm-col"
            :class="{ up: isUp(item.i, c - 1) }"
            :data-col="`${item.i}-${c - 1}`"
            :style="colStyle(item.r.up, c - 1)"
          )
        div(v-if="!finalUp" class="gm-rowmark" :style="markRowStyle" aria-hidden="true")
        span(v-if="dotX !== null" class="gm-dot" :style="dotStyle" aria-hidden="true")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.palmsCount', { n: Math.min(waveIdx + 1, current.waves.length), total: current.waves.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.palmsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.palmsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round, .gm-count
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

.gm-round
  letter-spacing: 0.06em
  text-transform: uppercase

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

// the speed meter: a palm and a needle that leans, and the word
.gm-meter
  display: flex
  align-items: center
  justify-content: center
  gap: 10px

.gm-meter-pic
  position: relative
  display: block
  width: 56px

.gm-needle
  position: absolute
  left: 0
  top: 0
  width: 100%
  display: block
  transform-origin: 50% 85%
  transition: transform 200ms ease

.gm-meter-word
  min-width: 9em
  padding: 2px 12px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  text-align: center
  color: #3f321b

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cbbf9c
  background-size: cover
  background-position: center
  touch-action: none
  cursor: ew-resize

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-lamb
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1

.gm-row
  position: absolute
  left: 0
  width: 100%
  display: block
  pointer-events: none

// a person of the row: the strip with the branches up, cut to one column, faded in
.gm-col
  position: absolute
  top: 0
  height: 100%
  display: block
  opacity: 0
  background-repeat: no-repeat
  transition: opacity 250ms ease

  &.up
    opacity: 1

.gm-rowmark
  position: absolute
  left: 0
  width: 100%
  display: block
  border-top: 3px dashed rgba(255, 246, 220, 0.9)
  border-bottom: 3px dashed rgba(255, 246, 220, 0.9)
  box-shadow: 0 0 0 1px rgba(40, 25, 5, 0.4)
  pointer-events: none
  z-index: 3

// the helping dot is a mark of the interface, not a picture
.gm-dot
  position: absolute
  display: block
  width: 22px
  height: 22px
  margin: -11px 0 0 -11px
  border-radius: 50%
  border: 3px solid #3f321b
  background: #fff6dc
  box-shadow: 0 0 10px 3px rgba(255, 240, 180, 0.9)
  pointer-events: none
  z-index: 4

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 7

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .gm-col, .gm-needle
    transition: none
</style>
