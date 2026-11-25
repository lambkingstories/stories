<script setup lang="ts">
/**
 * How many steps? (2 Kings 20,8-11): the shadow of a post lies on a step of the broad stairs of Ahaz (fourteen steps). The hint says how far it goes ("three steps forward, down the stairs", then "ten steps
 * back, up the stairs"). The child shows with the tip of the shadow (the round bronze handle) where the shadow will stand, and counts step by step: pull the handle along the stairs (it clicks into every step),
 * or use the buttons "One step up" / "One step down" (also Arrow up / Arrow down on the handle); a row of dots counts the steps walked since the start (up to ten). Then the big button "Done" (or Enter).
 * Right: a tick, a bright tone, "Exactly that many steps.", and only now the shadow moves by itself, step by step, to the shown place (the sign is not made by the child). Wrong: a cross, a low tone, a mistake,
 * "That was {n} steps. Count again." (or "... but in the other direction"); the handle stays, the child can pull on and press "Done" again. No time limit. "Help me" after fifteen seconds lets the notches next
 * to the stairs light up one after the other from the start step and stop at the right one; the handle pulses there. Costs nothing. Less motion: the shadow and the handle jump, nothing pulses.
 * Nothing is shown by colour alone. Points (for "Go on"): every right round counts once. Stars: `hiskiaStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { hiskiaStars } from '@/utils/hiskiaGames'
import { shadowLength, snapToTread, stepsMoved, targetStep } from '@/utils/hiskiaNeu'
import type { SundialGame } from '@/utils/hiskiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SundialGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.length
progress.setGoal(total)

const IDLE_SECONDS = 15
const DOTS = 10
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'moving' | 'between'>('play')
/** The step the handle (the tip the child pulls) is on, and the step the shadow stands on (it moves only after the right answer). */
const handle = ref(props.game.rounds[0]!.start)
const shadow = ref(props.game.rounds[0]!.start)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
/** The last notch that lights up in the help (the walk of the help). */
const helpAt = ref(0)
const finished = ref(false)
const message = ref('')
const verdict = ref<'good' | 'bad' | null>(null)
const dragging = ref(false)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
let messageSeq = 0
let verdictSeq = 0
let helpSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 0.75)
const current = computed(() => props.game.rounds[Math.min(round.value, total - 1)]!)
const stars = computed(() => hiskiaStars(mistakes.value))
const target = computed(() => targetStep(current.value))
const moved = computed(() => stepsMoved(current.value.start, handle.value))
const treads = computed(() => props.game.treads)
const countText = computed(() => t('app.adventure.shadowStepsMoved', { n: moved.value }))

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function touched() {
  idle.value = 0
  helping.value = false
  helpSeq++
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

function setHandle(step: number) {
  const s = Math.max(1, Math.min(treads.value.length, step))
  if (s === handle.value) return
  handle.value = s
  play('tap')
}
function nudge(d: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  setHandle(handle.value + d)
}

function ready() {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const rd = current.value
  const n = stepsMoved(rd.start, handle.value)
  if (handle.value !== target.value) {
    mistakes.value++
    play('wrong')
    flash('bad')
    const rightCount = n === rd.steps
    say(t(rightCount ? 'app.adventure.shadowStepsWay' : 'app.adventure.shadowStepsWrong', { n }), 4200)
    return
  }
  phase.value = 'moving'
  progress.mark()
  play('right')
  flash('good')
  say(t('app.adventure.shadowStepsOk'), 0)
  walkShadow()
}
function flash(kind: 'good' | 'bad') {
  const k = ++verdictSeq
  verdict.value = kind
  later(() => {
    if (verdictSeq === k) verdict.value = null
  }, 1400)
}
/** The shadow goes by itself, step by step, to the shown step. */
function walkShadow() {
  const goal = target.value
  const stepOn = () => {
    if (shadow.value === goal) {
      later(nextRound, 1500)
      return
    }
    shadow.value += shadow.value < goal ? 1 : -1
    later(stepOn, still ? 0 : 380)
  }
  later(stepOn, still ? 0 : 500)
}
function nextRound() {
  if (round.value >= total - 1) {
    play('star')
    finished.value = true
    return
  }
  round.value++
  const rd = props.game.rounds[round.value]!
  handle.value = rd.start
  shadow.value = rd.start
  phase.value = 'play'
  say('', 1)
}

// ---- the pointer: pull the handle along the stairs; a tap on the field puts it on the nearest step
function yPercent(e: { clientY: number }): number | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.height <= 0) return null
  return ((e.clientY - r.top) / r.height) * 100
}
function handleDown(e: PointerEvent) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  dragging.value = true
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value) return
  const y = yPercent(e)
  if (y !== null) setHandle(snapToTread(y, treads.value))
}
function up() {
  dragging.value = false
}
function fieldDown(e: PointerEvent) {
  if (phase.value !== 'play' || finished.value || (e.target as HTMLElement | null)?.closest?.('.gm-tip')) return
  touched()
  const y = yPercent(e)
  if (y !== null) setHandle(snapToTread(y, treads.value))
}

/** "Help me": the notches light up one after the other from the start step to the right step (and stay there). */
function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  const seq = ++helpSeq
  helpAt.value = current.value.start
  say(t('app.adventure.shadowStepsHelpGo'), 5000)
  const go = () => {
    if (helpSeq !== seq || helpAt.value === target.value) return
    helpAt.value += helpAt.value < target.value ? 1 : -1
    later(go, still ? 0 : 700)
  }
  later(go, still ? 0 : 700)
}
/** Is the notch of `step` lit by the help? */
const lit = (step: number) => {
  if (!helping.value) return false
  const a = Math.min(current.value.start, helpAt.value)
  const b = Math.max(current.value.start, helpAt.value)
  return step >= a && step <= b
}
const helpDone = computed(() => helping.value && helpAt.value === target.value)

// ---- looks (percent of the field; the field is `ratio` times as wide as high)
const tipH = computed(() => (props.game.tipW * ratio.value) / 1)
const tipStyle = computed(() => ({ left: `${props.game.post.x - props.game.tipW / 2}%`, top: `${(treads.value[handle.value - 1] ?? 50) - tipH.value / 2}%`, width: `${props.game.tipW}%` }))
const shadowStyle = computed(() => ({
  left: `${props.game.post.x - props.game.shadowW / 2}%`,
  top: `${props.game.post.y}%`,
  width: `${props.game.shadowW}%`,
  height: `${shadowLength(treads.value, props.game.post, shadow.value)}%`
}))
const notchStyle = (step: number) => ({ left: `${props.game.notchX}%`, top: `${treads.value[step - 1]}%` })
const tipLabel = computed(() => t('app.adventure.shadowStepsTip', { n: handle.value }))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="total > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.shadowStepsField')"
          @pointerdown="fieldDown"
        )
          span(v-for="(_, i) in treads" :key="`n${i}`" class="gm-notch" :class="{ lit: lit(i + 1), goal: helpDone && i + 1 === target }" :style="notchStyle(i + 1)" aria-hidden="true")
          span(class="gm-shadow" :style="shadowStyle" aria-hidden="true")
            GameImage(:src="game.shadow" :ratio="220 / 600" colour="#3a3a3a" label="schatten")
          button(
            type="button"
            class="gm-tip"
            :class="{ shine: helpDone, drag: dragging }"
            data-tip
            :style="tipStyle"
            :aria-label="tipLabel"
            :disabled="phase !== 'play'"
            @pointerdown.prevent.stop="handleDown"
            @keydown.up.prevent="nudge(-1)"
            @keydown.down.prevent="nudge(1)"
            @keydown.enter.prevent="ready"
          )
            GameImage(:src="game.tip" :ratio="1" colour="#b08850" round label="spitze")
          span(v-if="verdict" class="gm-mark" :style="{ left: `${game.post.x + game.tipW / 2}%`, top: `${(treads[handle - 1] ?? 50) - tipH / 2}%` }" aria-hidden="true")
            GameMark(:kind="verdict")
      div(class="gm-dots" role="img" :aria-label="countText")
        span(v-for="i in DOTS" :key="i" class="gm-dot" :class="{ on: i <= moved }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(tone="blau" small :disabled="phase !== 'play' || handle <= 1" @click="nudge(-1)") {{ t('app.adventure.shadowStepsUp') }}
        AdvButton(tone="blau" small :disabled="phase !== 'play' || handle >= treads.length" @click="nudge(1)") {{ t('app.adventure.shadowStepsDown') }}
      div(class="gm-actions")
        button(type="button" class="gm-ready" :disabled="phase !== 'play'" @click="ready") {{ t('app.adventure.shadowStepsReady') }}
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" small @click="helpMe") {{ t('app.adventure.shadowStepsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shadowStepsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcb8
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

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

.gm-wrap
  position: relative

.gm-field
  position: relative
  width: 100%
  max-width: 330px
  margin: 0 auto
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8b090
  background-size: cover
  background-position: center

// the shadow: a soft strip that is stretched in its length (the picture fills it)
.gm-shadow
  position: absolute
  display: block
  pointer-events: none
  transition: height 380ms ease

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

// the notches next to the stairs: they only light up in the help (a little gold disc; the notches themselves are in the picture)
.gm-notch
  position: absolute
  width: 14px
  height: 14px
  margin: -7px 0 0 -7px
  border-radius: 50%
  background: transparent
  pointer-events: none

  &.lit
    background: #ffd86a
    box-shadow: 0 0 8px rgba(255, 220, 110, 0.95)

  &.goal
    width: 22px
    height: 22px
    margin: -11px 0 0 -11px
    border: 3px solid #fff

.gm-tip
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 56px
  padding: 0
  border: 0
  border-radius: 50%
  background: transparent
  cursor: grab
  touch-action: none
  transition: top 160ms ease

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.drag
    cursor: grabbing
    transition: none

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 12px rgba(255, 220, 110, 0.95)

.gm-mark
  position: absolute
  pointer-events: none

.gm-dots
  display: flex
  justify-content: center
  gap: 6px
  min-height: 18px

.gm-dot
  width: 14px
  height: 14px
  border-radius: 50%
  border: 2px solid #8a6a2a
  background: transparent

  &.on
    background: #d4a83e

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

.gm-ready
  min-width: 140px
  min-height: 56px
  padding: 8px 28px
  border: 3px solid #b8892a
  border-radius: 999px
  background: #d4a83e
  color: #3f321b
  font-family: inherit
  font-weight: 900
  font-size: 1.15rem
  cursor: pointer

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    opacity: 0.55
    cursor: default

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

.still
  .gm-shadow, .gm-tip
    transition: none

  .gm-tip.shine
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-shadow, .gm-tip
    transition: none

  .gm-tip.shine
    animation: none
</style>
