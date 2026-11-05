<script setup lang="ts">
/**
 * "The cup" (Nehemiah 2,1): the throne hall of Shushan seen from above at a slant, the king and the queen at the top. Nehemiah carries the full cup of wine to the king.
 * The finger (held down and moved, or a tap) shows where he should go, and he follows it at a walking pace; the arrow keys move him too. Starting, stopping, turning and every bump
 * against a pillar, a jar or a plant make the wine slosh: the cup beside the field tilts and a line says how calm it is. When it sloshes too far a little wine spills (a mistake: a cross and
 * "Oh! A little wine spilled."), and he stands still a moment. At the king the round is won. Round 2 has more things on the floor and the wine spills sooner.
 * The button "Help me" comes after fifteen seconds without a finger or after two spills in a round; it walks him slowly past the next two points of a safe way. With reduced motion the cup does not swing on the screen.
 * The arithmetic is `utils/nehemiaNeu.ts`; stars: `osterStars(mistakes)`.
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
import { CUP_HELP_POINTS, CUP_HELP_SPEED, cupHelpPoint, cupRatio, cupShare, cupSlosh, cupStart, cupStep, nehDist } from '@/utils/nehemiaNeu'
import type { CupGame, CupState, Pt } from '@/utils/nehemiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: CupGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every way counts in three parts: a third, two thirds, the king. */
const PARTS = 3
progress.setGoal(props.game.rounds.length * PARTS)

const TICK = 0.05
const IDLE_SECONDS = 15
/** how far the arrow keys look ahead (percent) */
const KEY_REACH = 20

const ratio = computed(() => cupRatio(props.game))
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<CupState>(cupStart(current.value))
/** where the finger (or a key) wants him to go */
const target = ref<Pt | null>(null)
const keys = ref({ x: 0, y: 0 })
/** the help: the last point of the safe way it passed, and up to which point it leads (-1: no help) */
const helpFrom = ref(-1)
const helpTo = ref(-1)
const spilled = ref(false)
const mistakes = ref(0)
const roundSpills = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const facingLeft = ref(false)
let dragging = false
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))
const helping = computed(() => helpTo.value >= 0)

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function credit(n: number) {
  const due = Math.min(PARTS, n)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function arrive() {
  credit(PARTS)
  between.value = true
  target.value = null
  helpTo.value = -1
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.cupCarryArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    st.value = cupStart(current.value)
    facingLeft.value = false
    credited.value = 0
    target.value = null
    helpFrom.value = -1
    helpTo.value = -1
    spilled.value = false
    roundSpills.value = 0
    between.value = false
    message.value = ''
  }, 2900)
}

function helpGoal(): Pt | null {
  const path = current.value.path
  const i = cupHelpPoint(props.game, current.value, st.value.p, helpFrom.value)
  const goal = path[i]!
  if (nehDist(st.value.p, goal, ratio.value) < 1.2 && i < path.length - 1) {
    helpFrom.value = i
    if (i >= helpTo.value) {
      helpTo.value = -1
      return null
    }
  }
  return goal
}

function loop() {
  if (!finished.value && !between.value) {
    let goal: Pt | null = target.value
    let share = 1
    if (helping.value) {
      goal = helpGoal()
      share = CUP_HELP_SPEED
      if (!helping.value) target.value = null
    } else if (keys.value.x || keys.value.y) {
      goal = { x: st.value.p.x + keys.value.x * KEY_REACH, y: st.value.p.y + keys.value.y * KEY_REACH * ratio.value }
    }
    const res = cupStep(props.game, current.value, st.value, goal, TICK, share)
    st.value = res.state
    // the picture looks to the right; walking to the left it is mirrored
    if (Math.abs(st.value.v.x) > 2) facingLeft.value = st.value.v.x < 0
    for (const ev of res.events) {
      if (ev.type === 'bump') {
        play('tap')
        say(t('app.adventure.cupCarryBump', { thing: current.value.things[ev.thing]?.label ?? '' }), 1800)
      }
      if (ev.type === 'spill') {
        mistakes.value++
        roundSpills.value++
        spilled.value = true
        target.value = null
        helpTo.value = -1
        play('wrong')
        say(t('app.adventure.cupCarrySpill'), 3000)
        later(() => (spilled.value = false), 1400)
      }
    }
    if (st.value.arrived) arrive()
    else {
      if (credited.value < PARTS - 1) credit(Math.min(PARTS - 1, Math.floor(cupShare(props.game, current.value, st.value) * PARTS + 1e-9)))
      if (!dragging && !keys.value.x && !keys.value.y && !helping.value) idle.value += TICK
      else idle.value = 0
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger: where it is, he goes
function pointAt(e: PointerEvent): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function press(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  dragging = true
  helpTo.value = -1
  idle.value = 0
  target.value = pointAt(e)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
}
function move(e: PointerEvent) {
  if (!dragging) return
  const p = pointAt(e)
  if (p) target.value = p
}
function release() {
  // he goes on to the last place of the finger and stops there softly
  dragging = false
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
}
onBeforeUnmount(() => release())
const KEY_DIR: Record<string, Pt> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
function keyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && showHelp.value) {
    e.preventDefault()
    helpMe()
    return
  }
  const d = KEY_DIR[e.key]
  if (!d) return
  e.preventDefault()
  if (finished.value || between.value) return
  helpTo.value = -1
  target.value = null
  idle.value = 0
  keys.value = { x: d.x || keys.value.x, y: d.y || keys.value.y }
}
function keyUp(e: KeyboardEvent) {
  const d = KEY_DIR[e.key]
  if (!d) return
  e.preventDefault()
  keys.value = { x: d.x ? 0 : keys.value.x, y: d.y ? 0 : keys.value.y }
  // he takes a short step on and stops there
  if (!keys.value.x && !keys.value.y) target.value = { x: st.value.p.x + st.value.v.x * 0.35, y: st.value.p.y + st.value.v.y * 0.35 * ratio.value }
}

const showHelp = computed(() => (idle.value > IDLE_SECONDS || roundSpills.value >= 2) && !between.value && !helping.value && !finished.value)
function helpMe() {
  idle.value = 0
  roundSpills.value = 0
  target.value = null
  keys.value = { x: 0, y: 0 }
  const i = cupHelpPoint(props.game, current.value, st.value.p, helpFrom.value)
  helpFrom.value = i - 1
  helpTo.value = Math.min(i - 1 + CUP_HELP_POINTS, current.value.path.length - 1)
  say(t('app.adventure.cupCarryHelping'), 3200)
}

// ---- looks
const g = computed(() => props.game)
const level = computed(() => cupSlosh(st.value) / current.value.limit)
/** the cup tilts to the side the wine swings to (degrees) */
const cupTilt = computed(() => {
  const s = st.value.s
  const side = Math.abs(s.x) >= Math.abs(s.y) * 0.5 ? Math.sign(s.x) : Math.sign(-s.y) || 1
  return Math.round(side * Math.min(1, level.value) * 32)
})
const calmText = computed(() => {
  if (level.value < 0.4) return t('app.adventure.cupCarryCalm')
  if (level.value < 0.75) return t('app.adventure.cupCarrySloshing')
  return t('app.adventure.cupCarryCareful')
})
const walkerStyle = computed(() => ({ left: `${st.value.p.x}%`, top: `${st.value.p.y}%`, width: `${g.value.walker.w}%`, zIndex: 10 + Math.round(st.value.p.y) }))
const thingStyle = (x: number, y: number, w: number) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, zIndex: 10 + Math.round(y) })
const walking = computed(() => Math.hypot(st.value.v.x, st.value.v.y) > 1 && !between.value)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-play")
        div(
          ref="field"
          class="gm-field"
          :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          tabindex="0"
          :aria-label="t('app.adventure.cupCarryField')"
          @pointerdown="press($event)"
          @keydown="keyDown"
          @keyup="keyUp"
          @contextmenu.prevent
        )
          template(v-for="(o, k) in current.things" :key="`t-${round}-${k}`")
            div(class="gm-fig gm-thing" :style="thingStyle(o.x, o.y, o.w)" role="img" :aria-label="o.label")
              GameImage(:src="o.image" :ratio="1" colour="#b49a6a" :label="o.label")
          div(class="gm-fig gm-walker" :class="{ walking, left: facingLeft }" :style="walkerStyle" role="img" :aria-label="`${game.walker.label}: ${calmText}`")
            span(class="gm-bob")
              GameImage(:src="game.walker.image" :ratio="1" colour="#2c3f73" :label="game.walker.label")
            span(v-if="spilled" class="gm-mark")
              GameMark(kind="bad")
            span(v-if="st.arrived" class="gm-mark")
              GameMark(kind="good")
        div(class="gm-gauge")
          span(class="gm-cup" :style="{ transform: `rotate(${cupTilt}deg)` }" role="img" :aria-label="game.cup.label")
            GameImage(:src="game.cup.image" :ratio="1" colour="#d4a83e" :label="game.cup.label")
          span(class="gm-state" :class="{ warn: level >= 0.75 }" aria-live="polite") {{ calmText }}
      AdvButton(v-if="showHelp" tone="gold" @click="helpMe") {{ t('app.adventure.cupCarryHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cupCarryDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
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
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-play
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px

.gm-field
  position: relative
  width: min(100%, 58vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c8a0
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))

.gm-walker
  transition: left 50ms linear, top 50ms linear

.gm-bob
  display: block

.gm-walker.left .gm-bob
  transform: scaleX(-1)

.gm-walker.walking .gm-bob
  animation: gm-step 520ms ease-in-out infinite

.gm-mark
  position: absolute
  left: 50%
  top: 25%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-gauge
  display: flex
  align-items: center
  justify-content: center
  gap: 12px
  min-height: 64px
  padding: 4px 16px
  border-radius: 16px
  background: rgba(255, 246, 220, 0.94)

.gm-cup
  display: block
  width: 56px
  transform-origin: 50% 90%
  transition: transform 50ms linear

.gm-state
  min-width: 120px
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

  &.warn
    color: #8a2a12

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

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -1.5%

@media (prefers-reduced-motion: reduce)
  .gm-walker.walking .gm-bob
    animation: none

  .gm-walker, .gm-cup
    transition: none

  .gm-cup
    transform: none !important
</style>
