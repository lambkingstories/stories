<script setup lang="ts">
/**
 * Write it in a book (Rev 1,11: "What thou seest, write in a book"). The desk of John seen from above: a papyrus roll with up to five thin lines, an inkwell, a reed pen. The child draws the pen
 * along a line from left to right (it follows the finger, the tip is at the finger) and a script appears that cannot be read. One dip of the pen lasts for about 60 percent of a line of
 * length 1; a drop above the inkwell shows how much ink is left, it blinks when little is left. Before the ink runs out the child dips the pen (a tap on the inkwell, or the pen over it).
 * When the pen runs dry while the finger wants to go on, a cross and "The pen is dry", a mistake; the next dip goes on where the writing stopped. Leaving the line is no mistake, nothing is written then.
 * Round 1: three short lines, round 2: five longer lines (more dips). At the end the roll is closed. "Help me" after fifteen seconds lets the inkwell glow. The keyboard: right arrow writes,
 * Enter or Space dips. Nothing is shown by colour alone (tick, cross, words, percent). Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { WRITE_KEY_STEP, writeAtWell, writeFrac, writeLineYs, writeOnLine, writeStep } from '@/utils/offenbarungNeuA'
import type { Pt, WriteGame } from '@/utils/offenbarungNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WriteGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.lines, 0))

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const ys = computed(() => writeLineYs(props.game, current.value.lines))
/** The line that is written now, and how much of every line is written (0 to 1). */
const line = ref(0)
const written = ref<number[]>(Array.from({ length: current.value.lines }, () => 0))
/** The ink in the pen: 1 is a full dip. */
const ink = ref(0)
const pen = ref<Pt>({ ...props.game.penRest })
const drag = reactive({ on: false })
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const tickAt = ref<Pt | null>(null)
const crossAt = ref<Pt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
let inWell = false
let lastTalk = -10
let clock = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const pct = computed(() => Math.round(ink.value * 100))
const low = computed(() => ink.value > 0 && ink.value <= props.game.warnAt)
const pulse = computed(() => (ink.value < 0.4 && !between.value) || helping.value)
const lineW = computed(() => props.game.lineX[1] - props.game.lineX[0])

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
function idleLoop() {
  clock += 0.25
  if (!between.value && !finished.value && !drag.on) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The pen goes into the inkwell. */
function dip() {
  if (between.value || finished.value) return
  idle.value = 0
  helping.value = false
  ink.value = 1
  play('tap')
  flash('good', { x: props.game.inkwellAt.x, y: props.game.inkwellAt.y - 8 })
  say(t('app.adventure.writeFull'), 1600)
}

/** The pen is at `p`: over the inkwell it is dipped, on the line it writes as far as the finger reaches and the ink lasts. */
function applyPen(p: Pt) {
  if (between.value || finished.value) return
  idle.value = 0
  if (writeAtWell(props.game, p, ratio.value)) {
    if (!inWell) {
      inWell = true
      dip()
    }
    return
  }
  inWell = false
  const y = ys.value[line.value]
  if (y === undefined || !writeOnLine(props.game, p, y, ratio.value)) return
  const w0 = written.value[line.value]!
  const target = writeFrac(props.game, p.x)
  if (target <= w0) return
  if (ink.value <= 0) {
    if (clock - lastTalk > 3) {
      lastTalk = clock
      say(t('app.adventure.writeDipFirst'), 2600)
    }
    return
  }
  const before = ink.value
  const r = writeStep(w0, before, target, props.game.inkPerDip, current.value.lineLength)
  written.value[line.value] = r.w
  ink.value = r.ink
  if (r.dry && before > 0) {
    mistakes.value++
    play('wrong')
    flash('bad', { x: props.game.lineX[0] + r.w * lineW.value, y })
    say(t('app.adventure.writeDry'), 3200)
    return
  }
  if (r.w >= 1) {
    lineDone()
    return
  }
  if (before > props.game.warnAt && r.ink <= props.game.warnAt && r.ink > 0) say(t('app.adventure.writeLow'), 2400)
}

function lineDone() {
  progress.mark()
  play('right')
  flash('good', { x: props.game.lineX[1], y: ys.value[line.value] ?? 50 })
  line.value++
  if (line.value >= current.value.lines) {
    endRound()
    return
  }
  say(t('app.adventure.writeLineDone'), 1600)
}

function endRound() {
  between.value = true
  helping.value = false
  say(t('app.adventure.writeRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.writeClosed'), 0)
    }, 1400)
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    line.value = 0
    written.value = Array.from({ length: current.value.lines }, () => 0)
    pen.value = { ...props.game.penRest }
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger
function percentAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!drag.on) return
  const p = percentAt(e)
  if (!p) return
  pen.value = p
  applyPen(p)
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag() {
  drag.on = false
  inWell = false
  unlisten()
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  const p = percentAt(e)
  if (!p) return
  idle.value = 0
  helping.value = false
  drag.on = true
  pen.value = p
  applyPen(p)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())

// ---- the keyboard: right arrow writes a bit, Enter or Space dips
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    dip()
    return
  }
  if (e.key !== 'ArrowRight') return
  e.preventDefault()
  const y = ys.value[line.value]
  if (y === undefined) return
  const w = Math.min(1, written.value[line.value]! + WRITE_KEY_STEP)
  const p = { x: props.game.lineX[0] + w * lineW.value, y }
  pen.value = p
  inWell = false
  applyPen(p)
}

/** "Help me": the inkwell glows, and a word says what to do. */
function helpMe() {
  idle.value = 0
  helping.value = true
  say(ink.value > 0 ? t('app.adventure.writeHelpGo') : t('app.adventure.writeHelpDip'), 5000)
  later(() => (helping.value = false), 6000)
}

// ---- looks
const lineStyle = (i: number) => ({ left: `${props.game.lineX[0]}%`, top: `${ys.value[i]}%`, width: `${lineW.value}%` })
const clipOf = (i: number) => ({ clipPath: `inset(0 ${100 - (written.value[i] ?? 0) * 100}% 0 0)` })
const penStyle = computed(() => ({
  left: `${pen.value.x}%`,
  top: `${pen.value.y}%`,
  width: `${props.game.penW}%`,
  transform: `translate(${-props.game.penTip.x * 100}%, ${-props.game.penTip.y * 100}%)`
}))
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const wellStyle = computed(() => ({ left: `${props.game.inkwellAt.x}%`, top: `${props.game.inkwellAt.y}%`, width: `${props.game.inkwellW}%` }))
const dropStyle = computed(() => ({ left: `${props.game.dropAt.x}%`, top: `${props.game.dropAt.y}%`, width: `${props.game.dropW}%` }))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(ending ? game.closed : game.desk)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.writeField')"
        @pointerdown.prevent="down"
        @keydown="onKey"
      )
        template(v-if="!ending")
          div(v-for="(y, i) in ys" :key="`line-${round}-${i}`" class="gm-line" :class="{ now: i === line && !between }" :data-line="i" :style="lineStyle(i)")
            span(class="gm-rule" aria-hidden="true")
            span(v-if="(written[i] ?? 0) > 0" class="gm-script" :data-written="Math.round((written[i] ?? 0) * 100)" :style="clipOf(i)")
              GameImage(:src="game.script" :ratio="15" colour="#5b4126" label="schrift")
        button(
          v-if="!ending"
          type="button"
          class="gm-well"
          :class="{ pulse }"
          :style="wellStyle"
          :aria-label="t('app.adventure.writeWell')"
          @pointerdown.stop
          @click="dip"
        )
          GameImage(:src="game.inkwell" :ratio="1" colour="#7a5a36" label="tintenfass")
        div(v-if="!ending" class="gm-drop" :class="{ blink: low }" :style="dropStyle" role="img" :aria-label="t('app.adventure.writeInk', { n: pct })")
          span(class="gm-drop-pic")
            GameImage(:src="game.dropEmpty" :ratio="1" colour="#c9b48a" label="tropfen-leer")
          span(class="gm-drop-pic full" :style="{ opacity: Math.min(1, ink) }")
            GameImage(:src="game.dropFull" :ratio="1" colour="#2a2a55" label="tropfen-voll")
        div(v-if="!ending" class="gm-pen" :class="{ held: drag.on }" :style="penStyle" aria-hidden="true")
          GameImage(:src="game.pen" :ratio="0.333" colour="#a07a4a" label="feder")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(v-if="!ending" class="gm-count" aria-live="polite") {{ t('app.adventure.writeCount', { n: Math.min(line + 1, current.lines), total: current.lines, ink: pct }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.writeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.writeDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a line of the roll: a hair-thin ruling (a help in the user interface, not a picture), the script is laid over it and uncovered from the left
.gm-line
  position: absolute
  display: block
  transform: translateY(-50%)
  pointer-events: none

.gm-rule
  position: absolute
  left: 0
  right: 0
  top: 50%
  display: block
  height: 0
  border-top: 2px dotted rgba(70, 45, 20, 0.5)

.gm-line.now .gm-rule
  border-top: 2px dashed rgba(70, 45, 20, 0.85)

.gm-script
  position: relative
  display: block

// the inkwell: a button of at least 44 pixels
.gm-well
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 0
  border-radius: 50%
  background: transparent
  cursor: pointer
  z-index: 3

  &.pulse
    animation: gm-pulse 1100ms ease-in-out infinite

.gm-drop
  position: absolute
  display: block
  min-width: 28px
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3

  &.blink
    animation: gm-blink 800ms ease-in-out infinite

.gm-drop-pic
  display: block

  &.full
    position: absolute
    left: 0
    top: 0
    width: 100%

.gm-pen
  position: absolute
  display: block
  pointer-events: none
  z-index: 5
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.45))

  &.held
    z-index: 6

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

@keyframes gm-pulse
  0%, 100%
    transform: translate(-50%, -50%) scale(1)
  50%
    transform: translate(-50%, -50%) scale(1.12)

@keyframes gm-blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0.45

@media (prefers-reduced-motion: reduce)
  .gm-well.pulse, .gm-drop.blink
    animation: none
</style>
