<script setup lang="ts">
/**
 * The hand mill (2 Kings 4,42: the man from Baal-shalisha brings twenty loaves and fresh grain). Seen from above: a reed mat, on it the hand mill (the lower stone, over it the runner stone
 * with its handle and the hole for the grain), beside it the bowl and the open sack of barley. The child puts a finger on the stone and circles (either way); the runner turns with the finger
 * and every turn grinds flour, which grows in the bowl. Round 1: four turns, the grain in the hole is enough. Round 2: six turns; the grain in the hole lasts only a turn and a half
 * (a tap on the sack pours more in), and turning too fast makes the grains jump out (a cross, "Slower!", one mistake per hurry); turning on with an empty hole is one mistake too.
 * For everybody who cannot circle there is the button "Turn" and the arrow keys (one step a press). Whoever does nothing for fifteen seconds gets "Help me".
 * Nothing is shown by colour alone (tick, cross, words). With reduced motion nothing glides or breathes. The arithmetic is `utils/elisaNeu.ts`; stars: `osterStars(mistakes)`.
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
import { ELISA_RATIO, MILL_DRY_DEG, angleAt, millDone, millGrab, millGrainShare, millHint, millRefill, millRelease, millShare, millStart, millStep, millTurn } from '@/utils/elisaNeu'
import type { MillEvent, MillGame, MillState, Place } from '@/utils/elisaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: MillGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every turn of every round
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.turns, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const state = ref<MillState>(millStart(current.value))
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
const mark = ref<'good' | 'bad' | null>(null)
/** The help shows the sack (pour) or the stone (turn). */
const hinted = ref<'sack' | 'stone' | null>(null)
/** One mistake per hurry and per empty hole. */
let hurrying = false
let dryCounted = false
/** Turns already counted for "Go on" in this round. */
let credited = 0
let messageSeq = 0
let hintSeq = 0
const stars = computed(() => osterStars(mistakes.value))
const busy = computed(() => between.value || finished.value)
const src = (p: string) => prependBaseUrl(p)

const share = computed(() => millShare(state.value, current.value))
const grainShare = computed(() => millGrainShare(state.value, current.value))
const turnsDone = computed(() => Math.min(current.value.turns, Math.floor(state.value.ground / 360 + 1e-6)))

function say(text: string, kind: 'good' | 'bad' | null = null, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  mark.value = kind
  if (ms > 0)
    later(() => {
      if (messageSeq === id) {
        message.value = ''
        mark.value = null
      }
    }, ms)
}

function tick() {
  if (!busy.value) idle.value++
  later(tick, 1000)
}
later(tick, 1000)

/** What a turn did: flour, a hurry, an empty hole. */
function handle(next: MillState, event: MillEvent) {
  state.value = next
  if (event === 'none' || event === 'full') return
  idle.value = 0
  if (event === 'fast') {
    if (!hurrying) {
      hurrying = true
      mistakes.value++
      play('wrong')
      say(t('app.adventure.handMillFast'), 'bad', 3200)
    }
    return
  }
  hurrying = false
  if (event === 'empty') {
    if (next.dry >= MILL_DRY_DEG && !dryCounted) {
      dryCounted = true
      mistakes.value++
      play('wrong')
      say(t('app.adventure.handMillEmpty'), 'bad', 4000)
    } else if (!dryCounted && !message.value) say(t('app.adventure.handMillEmptySoon'), null, 3000)
    return
  }
  // flour: every whole turn counts once
  while (credited < turnsDone.value) {
    credited++
    progress.mark()
    play('bead')
  }
  if (millDone(next, current.value)) roundOver()
}

// ---- the finger on the stone
const stoneEl = ref<HTMLElement | null>(null)
function fingerAngle(e: PointerEvent): number {
  const box = stoneEl.value?.getBoundingClientRect()
  const c = { x: box ? box.left + box.width / 2 : 0, y: box ? box.top + box.height / 2 : 0 }
  return angleAt(c, { x: e.clientX, y: e.clientY })
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value) return
  idle.value = 0
  hinted.value = null
  state.value = millGrab(state.value, fingerAngle(e))
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
function move(e: PointerEvent) {
  if (state.value.last === null || busy.value) return
  const r = millTurn(state.value, current.value, fingerAngle(e), Date.now())
  handle(r.state, r.event)
}
function up() {
  state.value = millRelease(state.value)
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
onBeforeUnmount(up)

/** A step without circling: the button, the arrow keys. */
function step() {
  if (busy.value) return
  hinted.value = null
  const r = millStep(state.value, current.value, Date.now())
  handle(r.state, r.event)
}
function onStoneClick(e: MouseEvent) {
  // a click from the keyboard (Enter, space) turns a step; a finger that only taps does not
  if (e.detail === 0) step()
}
const KEYS = new Set(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'])
function onKey(e: KeyboardEvent) {
  if (!KEYS.has(e.key)) return
  e.preventDefault()
  // holding a key down repeats it very fast: only a new press turns
  if (e.repeat) return
  step()
}

/** The sack: grain into the hole. */
function pour() {
  if (busy.value) return
  idle.value = 0
  hinted.value = null
  const r = millRefill(state.value, current.value)
  if (r.kind === 'enough') {
    say(t('app.adventure.handMillEnough'), null, 3000)
    return
  }
  state.value = r.state
  dryCounted = false
  play('sack')
  say(t('app.adventure.handMillPoured'), 'good')
}

function roundOver() {
  between.value = true
  up()
  play('right')
  say(t('app.adventure.handMillRoundDone'), 'good', 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), null, 0), 1300)
  later(() => {
    round.value++
    state.value = millStart(current.value)
    credited = 0
    hurrying = false
    dryCounted = false
    idle.value = 0
    hinted.value = null
    message.value = ''
    mark.value = null
    between.value = false
  }, 2600)
}

/** "Help me": pour, slower, or how to turn. */
function helpMe() {
  idle.value = 0
  const h = millHint(state.value, current.value, Date.now())
  hinted.value = h === 'refill' ? 'sack' : 'stone'
  const id = ++hintSeq
  later(() => {
    if (hintSeq === id) hinted.value = null
  }, 6000)
  say(t(h === 'refill' ? 'app.adventure.handMillHelpRefill' : h === 'slow' ? 'app.adventure.handMillHelpSlow' : 'app.adventure.handMillHelpTurn'), null, 6000)
}

// ---- looks (every place is the middle of a picture, percent of the field)
const at = (p: Place, w = p.w) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${w}%` })
const flourStyle = computed(() => ({
  ...at({ x: props.game.bowlAt.x, y: props.game.bowlAt.y - 2, w: props.game.flourW }),
  transform: `translate(-50%, -50%) scale(${0.25 + 0.75 * share.value})`,
  opacity: share.value > 0 ? '1' : '0'
}))
const grainStyle = computed(() => ({
  ...at({ x: props.game.mill.x, y: props.game.mill.y, w: props.game.grainW }),
  transform: `translate(-50%, -50%) scale(${0.35 + 0.65 * grainShare.value})`,
  opacity: grainShare.value > 0 ? '1' : '0'
}))
const runnerStyle = computed(() => ({ transform: `rotate(${state.value.rot}deg)` }))
const stoneStyle = computed(() => at(props.game.mill, props.game.upperW))
</script>

<template lang="pug">
  div(class="hm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="hm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="hm-hint") {{ current.hint }}
      div(
        class="hm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ELISA_RATIO) }"
        role="group"
        :aria-label="t('app.adventure.handMillField')"
      )
        span(class="hm-pic" :style="at(game.mill)")
          GameImage(:src="game.lower" :ratio="621 / 627" :round="true" colour="#8a8378" label="unterstein")
        span(class="hm-pic hm-grain" :style="grainStyle" aria-hidden="true")
          GameImage(:src="game.grain" :ratio="330 / 187" colour="#d9b04a" label="koerner")
        button(
          ref="stoneEl"
          type="button"
          class="hm-stone"
          :class="{ hinted: hinted === 'stone' }"
          :style="stoneStyle"
          :aria-label="t('app.adventure.handMillStone', { n: turnsDone, total: current.turns })"
          :disabled="busy"
          @pointerdown.prevent="down"
          @click="onStoneClick"
          @keydown="onKey"
        )
          span(class="hm-runner" :style="runnerStyle")
            GameImage(:src="game.upper" :ratio="524 / 530" :round="true" :notch="true" colour="#5f5a52" label="laeufer")
        span(class="hm-pic" :style="at(game.bowlAt)" role="img" :aria-label="t('app.adventure.handMillBowl', { n: turnsDone, total: current.turns })")
          GameImage(:src="game.bowl" :ratio="407 / 289" colour="#b07a3c" label="schale")
        span(class="hm-pic hm-flour" :style="flourStyle" aria-hidden="true")
          GameImage(:src="game.flour" :ratio="356 / 236" colour="#f3efe4" label="mehl")
        button(
          type="button"
          class="hm-sack"
          :class="{ hinted: hinted === 'sack' }"
          :style="at(game.sackAt)"
          :aria-label="t('app.adventure.handMillSack')"
          :disabled="busy"
          @click="pour"
        )
          GameImage(:src="game.sack" :ratio="355 / 371" colour="#c8a46a" label="sack")
      p(class="hm-count") {{ t('app.adventure.handMillCount', { n: turnsDone, total: current.turns }) }}
      div(class="hm-actions")
        AdvButton(tone="blau" small :disabled="busy" @click="step") {{ t('app.adventure.handMillTurnButton') }}
        AdvButton(v-if="idle >= IDLE_SECONDS && !busy" tone="gold" small @click="helpMe") {{ t('app.adventure.handMillHelp') }}
      p(class="hm-fb" role="status")
        GameMark(v-if="mark && message" :kind="mark")
        span {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.handMillDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hm
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

.hm-round
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

.hm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.hm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c79a5a
  background-size: cover
  background-position: center

// every picture is placed by its middle
.hm-pic
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

.hm-flour, .hm-grain
  transition: transform 400ms ease-out, opacity 300ms ease-out

// the runner stone: the place to circle (a big round button)
.hm-stone
  position: absolute
  display: block
  min-width: 120px
  aspect-ratio: 1
  padding: 0
  border: 0
  border-radius: 50%
  background: none
  transform: translate(-50%, -50%)
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

  &.hinted::after
    content: ''
    position: absolute
    inset: -8px
    border: 3px dashed #fff6dc
    border-radius: 50%
    animation: hm-breathe 900ms ease-in-out infinite

.hm-runner
  display: block
  width: 100%
  filter: drop-shadow(0 4px 4px rgba(40, 30, 10, 0.45))

.hm-sack
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  background: none
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.hinted::after
    content: ''
    position: absolute
    inset: -6px
    border: 3px dashed #fff6dc
    border-radius: 18px
    animation: hm-breathe 900ms ease-in-out infinite

.hm-count
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.hm-actions
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 10px

.hm-fb
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
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

  &:has(span:empty)
    display: none

@keyframes hm-breathe
  0%, 100%
    scale: 1
  50%
    scale: 1.06

@media (prefers-reduced-motion: reduce)
  .hm-flour, .hm-grain
    transition: none

  .hm-stone.hinted::after, .hm-sack.hinted::after
    animation: none
</style>
