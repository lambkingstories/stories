<script setup lang="ts">
/**
 * The sceptre (Esther 5,1-2). The inner court of the palace: from the right the king holds out the golden sceptre, and it moves a little to and fro. From below comes Esther's hand.
 * The child leads the hand calmly (drag anywhere in the court: the hand goes as far as the finger) to the knob at the top of the sceptre and keeps it there a moment: then Esther
 * has touched the top of the sceptre. A hasty hand trembles and goes back to its start: a cross and "Too hasty" (a mistake). Round 1: the sceptre moves little, the hand may go
 * quicker; round 2: it moves more, the hand must be calmer and stay longer. On the keyboard the arrows move the hand a little, Enter a step toward the knob. After fifteen seconds
 * without a move "Help me" leads the hand to the knob. With reduced motion the sceptre stands still and nothing shakes. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/esterNeu.ts`; stars: `esterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { SCEPTRE_HELP_SPEED, SCEPTRE_KEY_STEP, esterDist, esterStars, sceptreAngle, sceptreClamp, sceptreSpeed, sceptreStepToward, sceptreTip, sceptreTouch } from '@/utils/esterNeu'
import type { Pt, SceptreArm, SceptreGame } from '@/utils/esterNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SceptreGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK = 40
const IDLE_SECONDS = 15
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** Seconds since the round began (the sceptre swings with it; with reduced motion it stands still). */
const clock = ref(0)
const swing = computed(() => (reduced ? 0 : clock.value))
const hand = ref<Pt>({ ...current.value.start })
const held = ref(0)
const touching = computed(() => sceptreTouch(props.game, current.value, hand.value, swing.value))
const tip = computed(() => sceptreTip(props.game, current.value, swing.value))
const guiding = ref(false)
const trembling = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => esterStars(mistakes.value))

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

let wasTouching = false
function loop() {
  if (!finished.value && !between.value) {
    const dt = TICK / 1000
    clock.value += dt
    if (guiding.value) hand.value = sceptreClamp(props.game, sceptreStepToward(hand.value, tip.value, props.game.ratio, current.value.maxSpeed * SCEPTRE_HELP_SPEED * dt))
    if (touching.value && !trembling.value) {
      if (!wasTouching) say(t('app.adventure.sceptreHold'), 0)
      held.value += dt
      if (held.value >= current.value.hold) reached()
    } else {
      if (wasTouching && !between.value) message.value = ''
      held.value = 0
    }
    wasTouching = touching.value && !between.value
    if (!dragging && !guiding.value) idle.value += dt
  }
  later(loop, TICK)
}
later(loop, TICK)

function reached() {
  between.value = true
  guiding.value = false
  stopDrag()
  progress.mark()
  play('right')
  flash('good', tip.value)
  later(() => play('bead'), 200)
  say(t('app.adventure.sceptreTouched'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 2200)
  later(() => {
    round.value++
    clock.value = 0
    held.value = 0
    hand.value = { ...current.value.start }
    wasTouching = false
    between.value = false
    idle.value = 0
    message.value = ''
  }, 3400)
}

/** The hand went too fast: it trembles and goes back to its start (a mistake). */
function hasty() {
  mistakes.value++
  play('wrong')
  flash('bad', hand.value)
  stopDrag()
  trembling.value = true
  held.value = 0
  say(t('app.adventure.sceptreHasty'), 3000)
  later(() => {
    hand.value = { ...current.value.start }
    trembling.value = false
  }, reduced ? 0 : 500)
}

// ---- the finger leads the hand: a drag anywhere moves the hand as far as the finger goes
let dragging = false
let from: Pt = { x: 0, y: 0 }
let handFrom: Pt = { x: 0, y: 0 }
let samples: (Pt & { t: number })[] = []
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!dragging || trembling.value || between.value) return
  const p = pointAt(e)
  if (!p) return
  idle.value = 0
  hand.value = sceptreClamp(props.game, { x: handFrom.x + p.x - from.x, y: handFrom.y + p.y - from.y })
  samples.push({ ...hand.value, t: Date.now() / 1000 })
  if (samples.length > 30) samples = samples.slice(-30)
  if (sceptreSpeed(samples, props.game.ratio) > current.value.maxSpeed) hasty()
}
function stopDrag() {
  dragging = false
  samples = []
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value || trembling.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  guiding.value = false
  dragging = true
  from = p
  handFrom = { ...hand.value }
  samples = [{ ...hand.value, t: Date.now() / 1000 }]
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (finished.value || between.value || trembling.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    guiding.value = false
    hand.value = sceptreClamp(props.game, { x: hand.value.x + a[0] * SCEPTRE_KEY_STEP, y: hand.value.y + a[1] * SCEPTRE_KEY_STEP * props.game.ratio })
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    guiding.value = false
    hand.value = sceptreClamp(props.game, sceptreStepToward(hand.value, tip.value, props.game.ratio, SCEPTRE_KEY_STEP * 1.5))
    if (esterDist(hand.value, tip.value, props.game.ratio) > current.value.reach) say(t('app.adventure.sceptreKeys'), 3600)
  }
}

/** The button for those who cannot reach it: the hand goes calmly to the knob by itself. */
function helpMe() {
  idle.value = 0
  stopDrag()
  guiding.value = true
  say(t('app.adventure.sceptreHelped'), 3200)
}

// ---- looks
const ratio = computed(() => props.game.ratio)
/** The box of an arm picture whose point `at` (0 to 1 of the picture) lies on `p` (percent of the field). */
function armBox(a: SceptreArm, at: Pt, p: Pt) {
  const h = (a.w / a.aspect) * ratio.value
  return { left: `${p.x - at.x * a.w}%`, top: `${p.y - at.y * h}%`, width: `${a.w}%`, transformOrigin: `${at.x * 100}% ${at.y * 100}%` }
}
const armStyle = computed(() => ({ ...armBox(props.game.arm, props.game.arm.pivot, current.value.pivot), transform: `rotate(${sceptreAngle(current.value, swing.value)}deg)` }))
const handStyle = computed(() => armBox(props.game.hand, props.game.hand.tip, hand.value))
const tipStyle = computed(() => {
  const d = current.value.reach * 2
  return { left: `${tip.value.x}%`, top: `${tip.value.y}%`, width: `${d}%`, height: `${d * ratio.value}%` }
})
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const holdShare = computed(() => Math.min(100, Math.round((held.value / current.value.hold) * 100)))
</script>

<template lang="pug">
  div(class="gs")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gs-hint") {{ current.hint }}
      div(
        ref="field"
        class="gs-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.sceptreField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gs-arm" :style="armStyle" role="img" :aria-label="t('app.adventure.sceptreArm')")
          GameImage(:src="game.arm.image" :ratio="game.arm.aspect" colour="#c8a24a" label="zepter")
        //- the knob: a ring shows where to go (dashed while the hand is not there)
        span(class="gs-target" :class="{ touch: touching, help: guiding }" :style="tipStyle" aria-hidden="true")
        div(class="gs-hand" :class="{ tremble: trembling, guided: guiding }" :style="handStyle" role="img" :aria-label="t('app.adventure.sceptreHand')" data-hand)
          GameImage(:src="game.hand.image" :ratio="game.hand.aspect" colour="#a8749a" label="hand")
        span(v-if="crossAt" class="gs-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gs-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gs-count" aria-live="polite") {{ touching ? t('app.adventure.sceptreHolding', { n: holdShare }) : t('app.adventure.sceptreCount', { n: round + (between ? 1 : 0), total: game.rounds.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !guiding" tone="gold" @click="helpMe") {{ t('app.adventure.sceptreHelp') }}
      p(class="gs-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sceptreDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gs
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
  user-select: none
  -webkit-user-select: none

.gs-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5a4a2c

.gs-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gs-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9b48a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: grab

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gs-arm
  position: absolute
  display: block
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.3))

.gs-hand
  position: absolute
  display: block
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 4px 5px rgba(40, 25, 5, 0.35))

  &.tremble
    animation: gs-tremble 450ms linear

  &.guided
    transition: none

// the place of the knob: a ring round it, solid while the finger touches it
.gs-target
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(255, 246, 220, 0.75)
  pointer-events: none
  z-index: 4

  &.touch
    border-style: solid
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.45)

  &.help
    border-color: #fff6dc

.gs-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 10

.gs-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gs-fb
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

@keyframes gs-tremble
  0%, 100%
    translate: 0 0
  20%
    translate: -4px 1px
  40%
    translate: 4px -1px
  60%
    translate: -3px 0
  80%
    translate: 3px 1px

// less motion: the sceptre stands still (see the script), the hand does not tremble
@media (prefers-reduced-motion: reduce)
  .gs-hand.tremble
    animation: none
</style>
