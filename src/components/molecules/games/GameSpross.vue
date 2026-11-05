<script setup lang="ts">
/**
 * The shoot (Isaiah 11,1: "And there shall come forth a rod out of the stem of Jesse, and a Branch shall grow out of his roots").
 * In an old olive grove stands the cut stump; the light falls in at the top. When the child starts, a young shoot grows out of the stump by itself, always on.
 * The child steers it: a finger on the picture turns the tip toward the finger, or the two buttons below (hold) and the arrow keys (hold) turn it left and right.
 * Stones lie in the way. When the tip touches a stone, that is a mistake (a cross and words, once per stone); the shoot does not break: it slides round the stone when it leans
 * to one side, or waits until the child turns it. When the tip reaches the light, the round is won. Round 1: three stones; round 2: more stones that stand closer.
 * Whoever does not steer gets "Help me" after fifteen seconds: the shoot grows a stretch along a good way by itself. With reduced motion the shoot grows more slowly and the leaves do not sway.
 * Nothing is shown by colour alone (cross, words, the count). The arithmetic is `utils/prophetenNeu.ts`; stars: `prophetenStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref, shallowRef, triggerRef } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { SHOOT_RATIO, SHOOT_SPEED, prophetenStars, shootAim, shootAuto, shootPercent, shootStart, shootStep, shootUnits } from '@/utils/prophetenNeu'
import type { Pt, ShootGame, ShootState } from '@/utils/prophetenNeu'

const props = defineProps<{ game: ShootGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Parts of the way to the light per round (each tenth counts for "Go on"). */
const PARTS = 10
progress.setGoal(PARTS * props.game.rounds.length)

const IDLE_SECONDS = 15
const TICK = 40
const HELP_SECONDS = 3
const STEM_W = 4.2
const TIP_W = 14
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const speed = SHOOT_SPEED * (still ? 0.75 : 1)

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const shoot = shallowRef<ShootState>(shootStart(props.game))
const started = ref(false)
/** Held steering: from the keys and from the two buttons (-1 left, 1 right). */
const keyHold = ref(0)
const buttonHold = ref(0)
/** The finger on the picture (units) while it is down. */
const finger = ref<Pt | null>(null)
const helpLeft = ref(0)
const parts = ref(0)
const markAt = ref<{ x: number; y: number; kind: 'good' | 'bad' } | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const stars = computed(() => prophetenStars(mistakes.value))
const steering = computed(() => !!finger.value || keyHold.value !== 0 || buttonHold.value !== 0)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(at: Pt, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { ...shootPercent(at), kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}

/** How far along the way to the light the tip is (0..1). */
function share(st: ShootState): number {
  const s = shootUnits(props.game.start)
  const l = shootUnits(props.game.light)
  const total = Math.max(1, s.y - l.y)
  return Math.min(1, Math.max(0, (s.y - st.tip.y) / total))
}

function start() {
  if (started.value) return
  started.value = true
  say(t('app.adventure.shootGrowGrows'), 2600)
}

function tick() {
  if (!between.value && !finished.value) {
    const dt = TICK / 1000
    if (steering.value || helpLeft.value > 0) idle.value = 0
    else idle.value += dt
    if (started.value) {
      const st = shoot.value
      let input = 0
      if (helpLeft.value > 0) {
        input = shootAuto(props.game, current.value, st, dt)
        helpLeft.value = Math.max(0, helpLeft.value - dt)
      } else if (finger.value) input = shootAim(st, finger.value, dt)
      else input = keyHold.value || buttonHold.value
      const event = shootStep(props.game, current.value, st, input, dt, speed)
      triggerRef(shoot)
      const p = Math.floor(share(st) * PARTS + 1e-6)
      while (parts.value < p) {
        parts.value++
        progress.mark()
      }
      if (event === 'hit') {
        mistakes.value++
        play('wrong')
        flash(st.tip, 'bad')
        say(t('app.adventure.shootGrowStone'), 3000)
      } else if (event === 'done') endRound()
    }
  }
  later(tick, TICK)
}
later(tick, TICK)

function endRound() {
  between.value = true
  helpLeft.value = 0
  finger.value = null
  flash(shoot.value.tip, 'good')
  later(() => play('right'), 250)
  say(t('app.adventure.shootGrowLight'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    shoot.value = shootStart(props.game)
    started.value = false
    parts.value = 0
    keyHold.value = 0
    buttonHold.value = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger on the picture: the tip turns toward it
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return shootUnits({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
}
function onMove(e: PointerEvent) {
  const p = pointAt(e)
  if (p && finger.value) finger.value = p
}
function up() {
  finger.value = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  start()
  finger.value = p
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
onBeforeUnmount(() => up())

// ---- the two buttons (hold) and the keys (hold)
function holdButton(dir: number) {
  if (between.value || finished.value) return
  idle.value = 0
  start()
  buttonHold.value = dir
}
function releaseButton() {
  buttonHold.value = 0
}
/** A click without a pointer (keyboard on the button, screen reader): a short turn. */
function nudge(e: MouseEvent, dir: number) {
  if (e.detail !== 0) return
  holdButton(dir)
  later(releaseButton, 350)
}
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    start()
    keyHold.value = e.key === 'ArrowLeft' ? -1 : 1
    return
  }
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault()
    idle.value = 0
    if (!started.value) {
      start()
      say(t('app.adventure.shootGrowKeys'), 3600)
    }
  }
}
function onKeyUp(e: KeyboardEvent) {
  if ((e.key === 'ArrowLeft' && keyHold.value < 0) || (e.key === 'ArrowRight' && keyHold.value > 0)) keyHold.value = 0
}

/** The button for those who do not steer: the shoot grows a stretch along a good way by itself. */
function helpMe() {
  idle.value = 0
  start()
  helpLeft.value = HELP_SECONDS
  say(t('app.adventure.shootGrowHelped'), 3000)
}

// ---- looks
const ratio = String(SHOOT_RATIO)
const H = 100 / SHOOT_RATIO
/** The stem: one painted piece between every two points of the way, turned along it (and a little longer, so that the pieces overlap). */
const segments = computed(() => {
  const tr = shoot.value.trail
  const tip = shoot.value.tip
  const pts = [...tr, tip]
  const out: { left: string; top: string; height: string; transform: string }[] = []
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len < 0.2) continue
    const ang = (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI
    out.push({ left: `${(a.x + b.x) / 2}%`, top: `${(((a.y + b.y) / 2) * 100) / H}%`, height: `${((len + 1.2) * 100) / H}%`, transform: `translate(-50%, -50%) rotate(${ang}deg)` })
  }
  return out
})
const tipStyle = computed(() => {
  const p = shootPercent(shoot.value.tip)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${TIP_W}%`, transform: `translate(-50%, -62%) rotate(${shoot.value.heading}deg)` }
})
const stoneStyle = (i: number) => {
  const s = current.value.stones[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.r * 2 * props.game.stoneScale}%` }
}
const lightStyle = computed(() => ({ left: `${props.game.light.x}%`, top: `${props.game.light.y}%`, width: `${props.game.lightR * 2}%` }))
const percent = computed(() => Math.round(share(shoot.value) * 100))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.shootGrowField')"
        @pointerdown="down"
        @keydown="onKey"
        @keyup="onKeyUp"
      )
        //- the light the shoot grows to (a dashed ring, it is painted in the picture)
        div(class="gm-light" :style="lightStyle" role="img" :aria-label="t('app.adventure.shootGrowLightLabel')")
        div(v-for="(s, i) in current.stones" :key="`s-${round}-${i}`" class="gm-stone" :data-stone="i" :style="stoneStyle(i)" role="img" :aria-label="t('app.adventure.shootGrowStoneLabel', { n: i + 1 })")
          GameImage(:src="game.stones[s.image] ?? game.stones[0] ?? ''" colour="#8d8070" label="stein")
        div(
          v-for="(seg, i) in segments"
          :key="`g-${i}`"
          class="gm-stem"
          :style="{ ...seg, width: `${STEM_W}%`, backgroundImage: `url(${prependBaseUrl(game.stem)})` }"
          aria-hidden="true"
        )
        div(class="gm-tip" :style="tipStyle" data-tip role="img" :aria-label="t('app.adventure.shootGrowTip')")
          GameImage(:src="game.tip" :ratio="180 / 216" colour="#6aa84f" label="spitze")
        span(v-if="markAt" class="gm-mark" :style="{ left: `${markAt.x}%`, top: `${markAt.y}%` }")
          GameMark(:kind="markAt.kind")
      div(class="gm-steer")
        button(
          type="button"
          class="gm-turn"
          data-turn="left"
          :aria-label="t('app.adventure.shootGrowLeft')"
          @pointerdown.prevent="holdButton(-1)"
          @pointerup="releaseButton"
          @pointerleave="releaseButton"
          @pointercancel="releaseButton"
          @click="nudge($event, -1)"
        ) ◀
        p(class="gm-count" aria-live="polite") {{ t('app.adventure.shootGrowCount', { n: percent }) }}
        button(
          type="button"
          class="gm-turn"
          data-turn="right"
          :aria-label="t('app.adventure.shootGrowRight')"
          @pointerdown.prevent="holdButton(1)"
          @pointerup="releaseButton"
          @pointerleave="releaseButton"
          @pointercancel="releaseButton"
          @click="nudge($event, 1)"
        ) ▶
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpLeft <= 0" tone="gold" @click="helpMe") {{ t('app.adventure.shootGrowHelp') }}
      p(class="gm-fb" role="status") {{ message || (!started && !between ? t('app.adventure.shootGrowStart') : '') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shootGrowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f0dcb0
  box-shadow: inset 0 0 18px rgba(110, 70, 20, 0.25)
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
  color: #6a4a22

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #6a4a22

.gm-field
  position: relative
  width: 100%
  max-width: 520px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6f6a4a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-light
  position: absolute
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.85)
  border-radius: 50%
  box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.35)
  pointer-events: none
  animation: gm-breathe 1800ms ease-in-out infinite alternate

.gm-stone
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 25, 10, 0.45))

// a piece of the stem: the painted stem, stretched to the length of the piece
.gm-stem
  position: absolute
  background-color: #6aa84f
  background-size: 100% 100%
  border-radius: 40%
  pointer-events: none
  z-index: 5

.gm-tip
  position: absolute
  transform-origin: 50% 62%
  pointer-events: none
  z-index: 6
  filter: drop-shadow(0 2px 3px rgba(30, 50, 10, 0.4))

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 10

.gm-steer
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

// the two steering buttons: big, held down to turn
.gm-turn
  min-width: 64px
  min-height: 52px
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #fff6dc
  font-size: 1.4rem
  font-weight: 800
  color: #6a4a22
  touch-action: none
  cursor: pointer

  &:active
    background: #f6e3b2

.gm-count
  margin: 0
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #6a4a22
  text-align: center

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-breathe
  from
    scale: 0.95
  to
    scale: 1.05

@media (prefers-reduced-motion: reduce)
  .gm-light
    animation: none
</style>
