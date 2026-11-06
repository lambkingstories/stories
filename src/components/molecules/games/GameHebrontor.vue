<script setup lang="ts">
/**
 * The gate of Hebron (2 Samuel 5,1-3). The city wall of Hebron seen from the front, on the right the gate with its closed doors; along the road the tribes of Israel come to David, one group
 * after another, each with the name of its tribe (1 Chronicles 12). The child opens the gate (a tap on the gate or on the button, or Enter) exactly when the group stands in front of it:
 * too early, while it is still far away, is a mistake (a cross and "Too early"); when the group has to wait at the closed gate longer than a moment, that is a mistake too ("They are waiting"),
 * and the gate can still be opened. Then the doors swing open, the group goes in and the doors close. Round 1: five tribes, slow, the right stretch of the road is marked; round 2: seven tribes,
 * faster and not all at the same pace, a shorter stretch, not marked. After fifteen seconds without a tap "Help me" says "Now!" at the right moment. With reduced motion the doors open
 * without swinging. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/davidNeu.ts`; stars: `davidNeuStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { davidNeuStars, hebronFront, hebronLeft, hebronTap, hebronTooLate, hebronWindow } from '@/utils/davidNeu'
import type { HebronGateGame, Pt } from '@/utils/davidNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: HebronGateGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.tribes.length, 0))

const IDLE_SECONDS = 15
const TICK = 100
/** How long a group needs to go in through the open gate, and how long the doors stay open after it. */
const ENTER_MS = 1300

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The tribe on the road (index of the round's tribes). */
const index = ref(0)
const tribe = computed(() => current.value.tribes[Math.min(index.value, current.value.tribes.length - 1)]!)
/** `walk`: the group comes; `enter`: the gate is open and it goes in; `pause`: the road is empty for a moment. */
const phase = ref<'walk' | 'enter' | 'pause'>('pause')
/** Milliseconds since the group set off (the clock of the game runs in steps of `TICK`). */
const ms = ref(0)
const lateSaid = ref(false)
const inside = ref(0)
const helpOn = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const knock = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => davidNeuStars(mistakes.value))
const open = computed(() => phase.value === 'enter')
const front = computed(() => hebronFront(props.game, tribe.value, ms.value).front)
const inWindow = computed(() => {
  if (phase.value !== 'walk') return false
  const w = hebronWindow(props.game, current.value, tribe.value)
  return ms.value >= w.from && ms.value <= w.to
})

function say(text: string, ms2 = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms2 > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms2)
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
const gateMid = computed<Pt>(() => ({ x: props.game.gate.x + props.game.gate.w / 2, y: props.game.gate.y + props.game.gate.h * 0.4 }))

/** A group sets off at the left edge. */
function setOff() {
  ms.value = 0
  lateSaid.value = false
  phase.value = 'walk'
  say(t('app.adventure.gateTimeComes', { name: tribe.value.name }), 2400)
}

let helpSaid = -1
function loop() {
  if (!finished.value && !between.value) {
    if (phase.value === 'walk') {
      ms.value += TICK
      if (!lateSaid.value && hebronTooLate(props.game, current.value, tribe.value, ms.value)) {
        lateSaid.value = true
        mistakes.value++
        play('wrong')
        flash('bad', gateMid.value)
        say(t('app.adventure.gateTimeLate', { name: tribe.value.name }), 0)
      }
      if (helpOn.value && inWindow.value && helpSaid !== index.value) {
        helpSaid = index.value
        say(t('app.adventure.gateTimeNow'), 0)
      }
    }
    if (helpOn.value === false) idle.value += TICK / 1000
  }
  later(loop, TICK)
}

/** The child opens the gate. */
function openGate() {
  if (between.value || finished.value || phase.value !== 'walk') return
  idle.value = 0
  const verdict = hebronTap(props.game, current.value, tribe.value, ms.value)
  if (verdict === 'early') {
    mistakes.value++
    play('wrong')
    flash('bad', gateMid.value)
    knock.value = true
    later(() => (knock.value = false), 500)
    say(t('app.adventure.gateTimeEarly'), 2600)
    return
  }
  // right (or late: the mistake was counted while they waited): the doors open and the group goes in
  phase.value = 'enter'
  play('snap')
  if (!lateSaid.value) flash('good', gateMid.value)
  say(t(lateSaid.value ? 'app.adventure.gateTimeInLate' : 'app.adventure.gateTimeRight', { name: tribe.value.name }), 2200)
  progress.mark()
  later(() => {
    inside.value++
    phase.value = 'pause'
    if (inside.value >= current.value.tribes.length) {
      endRound()
      return
    }
    later(() => {
      index.value++
      setOff()
    }, current.value.gap)
  }, ENTER_MS + 400)
}

function endRound() {
  between.value = true
  helpOn.value = false
  later(() => play('right'), 300)
  later(() => say(t('app.adventure.gateTimeRoundDone'), 0), 600)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3200)
  later(() => {
    round.value++
    index.value = 0
    inside.value = 0
    helpSaid = -1
    between.value = false
    idle.value = 0
    message.value = ''
    setOff()
  }, 4600)
}

function onKey(e: KeyboardEvent) {
  if (['Enter', ' ', 'ArrowUp', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    openGate()
  }
}

/** The button for those who do not find the moment: the right stretch is shown and "Now!" is said when the group is there. */
function helpMe() {
  idle.value = 0
  helpOn.value = true
  say(t('app.adventure.gateTimeHelped'), 3000)
}

later(setOff, 600)
later(loop, TICK)

// ---- looks
const ratio = computed(() => String(props.game.ratio))
const gateStyle = computed(() => {
  const g = props.game.gate
  return { left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, height: `${g.h}%` }
})
const zoneStyle = computed(() => {
  const r = props.game.road
  const z = current.value.zone
  return { left: `${r.stop - z}%`, width: `${z}%`, top: `${r.y - 3}%` }
})
const groupStyle = computed(() => {
  const g = props.game
  if (phase.value === 'enter') {
    // into the gate: the group walks to the middle of the opening, gets a little smaller and fades
    return { left: `${g.gate.x + g.gate.w / 2 - g.groupW * 0.35}%`, top: `${g.gate.y + g.gate.h}%`, width: `${g.groupW * 0.7}%`, opacity: 0, transition: `left ${ENTER_MS}ms linear, width ${ENTER_MS}ms linear, top ${ENTER_MS}ms linear, opacity ${ENTER_MS}ms ease-in` }
  }
  return { left: `${hebronLeft(g, front.value)}%`, top: `${g.road.y}%`, width: `${g.groupW}%`, opacity: phase.value === 'pause' ? 0 : 1 }
})
const labelStyle = computed(() => ({ left: `${Math.max(2, Math.min(58, hebronLeft(props.game, front.value)))}%`, top: `${Math.max(12, props.game.road.y - (props.game.groupW / props.game.groupRatio) * props.game.ratio - 1)}%` }))
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const showZone = computed(() => (round.value === 0 || helpOn.value) && phase.value === 'walk')
</script>

<template lang="pug">
  div(class="gh")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gh-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gh-hint") {{ current.hint }}
      div(
        class="gh-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.gateTimeField')"
        @keydown="onKey"
      )
        //- the right stretch of the road (round 1 and with help): a soft band with words for the screen reader
        div(v-if="showZone" class="gh-zone" :class="{ now: inWindow && helpOn }" :style="zoneStyle" :data-zone="current.zone" role="img" :aria-label="t('app.adventure.gateTimeZone')")
        //- the group on the road (it walks with its front to the right)
        div(:key="`g-${round}-${index}`" class="gh-group" :class="{ entering: phase === 'enter' }" :style="groupStyle" :data-front="Math.round(front)" :data-phase="phase")
          GameImage(:src="game.groups[tribe.sprite] ?? game.groups[0]" :ratio="game.groupRatio" colour="#b49a72" :label="`stamm-${tribe.sprite + 1}`")
        span(v-if="phase === 'walk'" class="gh-name" :style="labelStyle" data-tribe-name) {{ tribe.name }}
        //- the gate: the two doors over the opening; open, they swing inward; the whole opening is the button
        button(
          type="button"
          class="gh-gate"
          :class="{ open, knock, help: helpOn && inWindow }"
          :style="gateStyle"
          :aria-label="t(open ? 'app.adventure.gateTimeOpen' : 'app.adventure.gateTimeClosed')"
          data-gate
          tabindex="-1"
          @click="openGate"
        )
          span(class="gh-door left" :style="{ backgroundImage: `url(${src(game.door)})` }")
          span(class="gh-door right" :style="{ backgroundImage: `url(${src(game.door)})` }")
        span(v-if="crossAt" class="gh-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gh-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gh-count" aria-live="polite") {{ t('app.adventure.gateTimeCount', { n: inside, total: current.tribes.length }) }}
      AdvButton(tone="gold" class="gh-open" :disabled="phase !== 'walk' || between" data-open @click="openGate") {{ t('app.adventure.gateTimeButton') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helpOn" tone="gold" @click="helpMe") {{ t('app.adventure.gateTimeHelp') }}
      p(class="gh-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gateTimeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gh
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

.gh-round
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

.gh-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gh-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9b48a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gh-zone
  position: absolute
  height: 6%
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 999px
  background: rgba(255, 246, 220, 0.18)
  pointer-events: none
  z-index: 1

  &.now
    border-style: solid
    background: rgba(255, 246, 220, 0.4)

.gh-group
  position: absolute
  z-index: 3
  transform: translateY(-100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.3))
  transition: left 100ms linear, opacity 300ms ease

.gh-name
  position: absolute
  z-index: 4
  transform: translateY(-100%)
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  max-width: 40%
  pointer-events: none

// the gate: two doors, each the half of the painted pair; they swing inward about their outer edges
.gh-gate
  position: absolute
  z-index: 2
  display: flex
  padding: 0
  min-width: 44px
  min-height: 44px
  border: 3px solid transparent
  border-radius: 6px
  background: transparent
  perspective: 600px
  cursor: pointer

  &.help
    border-color: #fff6dc

  &.knock
    animation: gh-knock 450ms ease-in-out

.gh-door
  display: block
  width: 50%
  height: 100%
  background-size: 200% 100%
  background-repeat: no-repeat
  transition: transform 900ms ease-in-out, opacity 900ms ease-in-out

  &.left
    background-position: 0 0
    transform-origin: 0 50%
  &.right
    background-position: 100% 0
    transform-origin: 100% 50%

.gh-gate.open
  .gh-door.left
    transform: rotateY(78deg)
    opacity: 0.25
  .gh-door.right
    transform: rotateY(-78deg)
    opacity: 0.25

.gh-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 10

.gh-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gh-open
  align-self: center

.gh-fb
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

@keyframes gh-knock
  0%, 100%
    translate: 0 0
  30%
    translate: -3px 0
  60%
    translate: 3px 0

// less motion: the doors are open at once, nothing shakes, the group does not glide in
@media (prefers-reduced-motion: reduce)
  .gh-door
    transition: none
  .gh-gate.knock
    animation: none
  .gh-group
    transition: none !important
</style>
