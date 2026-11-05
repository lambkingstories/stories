<script setup lang="ts">
/**
 * The sounding lead (Luke 5,4-5). Simon's boat floats on the lake, seen from the side; Jesus has said "Launch out into the deep". The child drives the boat (a finger on the water, or the arrow keys),
 * lets the lead down on its line and reads how many fathoms deep the water is under Simon's hands. Where it is deep enough (the hint says how deep), Simon casts the net. A cast in shallow water is a mistake
 * (a cross and a word), the lead comes up again. Round 1: one broad deep place; round 2: a narrower deep place between two shallow humps. Whoever does not go on gets the button "Help me" after fifteen seconds:
 * the boat drives to the deep place. The lake, the boat and the lead are painted pictures, the line is a painted rope that is stretched (CSS); nothing is drawn. Nothing is shown by colour alone
 * (tick, cross, words). Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
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
import { PLUMB_STEP, plumbBoatTop, plumbBoatX, plumbClamp, plumbFathoms, plumbHandX, plumbHandY, plumbLeadY, plumbTarget } from '@/utils/freundeNeu'
import type { PlumbGame } from '@/utils/freundeNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PlumbGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one right cast per round
progress.setGoal(props.game.rounds.length)

const TICK_MS = 250
const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** How long the lead takes to go down (milliseconds); with less motion it is down at once. */
const SINK_MS = still ? 0 : 900
const BACK_MS = 1500

type Phase = 'move' | 'sinking' | 'read' | 'between'
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const boatX = ref(0)
const phase = ref<Phase>('move')
/** The depth the lead hangs at (fathoms, 0 = pulled up). */
const hang = ref(0)
const reading = ref(0)
const finished = ref(false)
const solved = ref(false)
const failed = ref(false)
const helped = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
let messageSeq = 0
let cast = false
const field = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))
const src = (p: string) => prependBaseUrl(p)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  boatX.value = plumbClamp(current.value, current.value.start)
  phase.value = 'move'
  hang.value = 0
  reading.value = 0
  solved.value = false
  failed.value = false
  helped.value = false
  cast = false
  idle.value = 0
}
startRound()

function loop() {
  if (phase.value !== 'sinking' && phase.value !== 'between' && !finished.value) idle.value += TICK_MS / 1000
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

// ---- the boat
function steer(x: number) {
  if (phase.value === 'between' || phase.value === 'sinking' || finished.value) return
  const nx = plumbClamp(current.value, x)
  if (nx === boatX.value) return
  boatX.value = nx
  idle.value = 0
  helped.value = false
  // driving on pulls the lead up
  if (phase.value === 'read' || hang.value > 0) {
    hang.value = 0
    phase.value = 'move'
    failed.value = false
  }
}

const place = (e: PointerEvent): number | null => {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return null
  return ((e.clientX - r.left) / r.width) * 100
}
function move(e: PointerEvent) {
  const x = place(e)
  if (x !== null) steer(x)
}
function stopListening() {
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
function up() {
  stopListening()
}
function down(e: PointerEvent) {
  if (e.button > 0 || phase.value === 'between' || phase.value === 'sinking' || finished.value) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  move(e)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
onBeforeUnmount(stopListening)

// ---- the lead
const handX = computed(() => plumbHandX(props.game.boat, boatX.value))
const depthHere = computed(() => plumbFathoms(current.value.bottom, handX.value))

/** The lead goes down on its line until the bottom stops it. */
function lower() {
  if (phase.value !== 'move' || finished.value) return
  idle.value = 0
  helped.value = false
  play('tap')
  phase.value = 'sinking'
  reading.value = depthHere.value
  hang.value = depthHere.value
  message.value = ''
  const settle = () => {
    if (phase.value !== 'sinking') return
    phase.value = 'read'
    play('clunk')
  }
  if (SINK_MS === 0) settle()
  else later(settle, SINK_MS)
}

function raise() {
  if (phase.value !== 'read') return
  idle.value = 0
  hang.value = 0
  failed.value = false
  phase.value = 'move'
  message.value = ''
  play('tap')
}

/** Simon casts the net where the lead has measured: deep enough is right, shallow is a mistake. */
function castNet() {
  if (phase.value !== 'read' || cast) return
  idle.value = 0
  cast = true
  if (reading.value >= current.value.deep) {
    solved.value = true
    phase.value = 'between'
    progress.mark()
    play('right')
    say(t('app.adventure.plumbRight', { n: reading.value }), 0)
    if (lastRound.value) {
      later(() => {
        play('star')
        finished.value = true
      }, 1900)
      return
    }
    later(() => say(t('app.adventure.gameNext'), 0), 1300)
    later(() => {
      round.value++
      startRound()
      message.value = ''
    }, 2800)
    return
  }
  mistakes.value++
  failed.value = true
  play('wrong')
  say(t('app.adventure.plumbShallow', { n: reading.value, deep: current.value.deep }), 0)
  later(() => {
    cast = false
    if (phase.value === 'read' && failed.value) {
      hang.value = 0
      failed.value = false
      phase.value = 'move'
      message.value = ''
    }
  }, BACK_MS)
}

function onKey(e: KeyboardEvent) {
  if (phase.value === 'between' || finished.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    if (phase.value === 'sinking') return
    steer(boatX.value + (e.key === 'ArrowRight' ? PLUMB_STEP : -PLUMB_STEP))
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    lower()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    raise()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (phase.value === 'move') lower()
    else if (phase.value === 'read') castNet()
  }
}

/** The button "Help me": the boat drives to the middle of the nearest deep place. */
function helpMe() {
  idle.value = 0
  const x = plumbTarget(props.game, current.value, boatX.value)
  if (x === null) return
  hang.value = 0
  failed.value = false
  phase.value = 'move'
  boatX.value = x
  helped.value = true
  say(t('app.adventure.plumbHelpSay'), 4500)
}

// ---- looks
const boat = computed(() => props.game.boat)
const boatStyle = computed(() => ({
  left: `${boatX.value}%`,
  top: `${plumbBoatTop(boat.value, current.value)}%`,
  width: `${boat.value.w}%`
}))
const leadH = computed(() => (props.game.lead.w / props.game.lead.ratio) * current.value.ratio)
const handY = computed(() => plumbHandY(boat.value, current.value))
/** The lower edge of the lead: on the bottom when it is down, just under Simon's hands when it is up. */
const leadBottom = computed(() => (hang.value > 0 ? plumbLeadY(current.value, hang.value) : handY.value + leadH.value + 1))
const leadStyle = computed(() => ({ left: `${handX.value}%`, top: `${leadBottom.value - leadH.value}%`, width: `${props.game.lead.w}%` }))
const lineStyle = computed(() => ({ left: `${handX.value}%`, top: `${handY.value}%`, height: `${Math.max(0, leadBottom.value - leadH.value - handY.value + 0.5)}%` }))
const fieldStyle = computed(() => ({ backgroundImage: `url(${src(current.value.background)})`, aspectRatio: String(current.value.ratio) }))
/** The marks of the scale at the left edge: every five fathoms. */
const ticks = computed(() => {
  const out: { n: number; y: number }[] = []
  for (let n = 5; n <= current.value.scale; n += 5) out.push({ n, y: plumbLeadY(current.value, n) })
  return out
})
const boatLabel = computed(() => t('app.adventure.plumbBoat', { n: Math.round(boatX.value) }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :class="{ sinking: phase === 'sinking' }"
        :style="fieldStyle"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.plumbField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        span(
          v-for="tk in ticks"
          :key="tk.n"
          class="gm-tick"
          :style="{ top: `${tk.y}%` }"
          aria-hidden="true"
        ) {{ tk.n }}
        span(class="gm-line" :style="lineStyle" aria-hidden="true")
          img(:src="src(game.line)" alt="" draggable="false")
        span(class="gm-lead" :style="leadStyle" role="img" :aria-label="t('app.adventure.plumbLead')")
          GameImage(:src="game.lead.image" :ratio="game.lead.ratio" colour="#7a7f86" label="lot")
        span(class="gm-boat" :class="{ help: helped }" :style="boatStyle" role="img" :aria-label="boatLabel")
          GameImage(:src="boat.image" :ratio="boat.ratio" colour="#8a5a2b" :label="boat.label")
        span(v-if="solved" class="gm-mark good" aria-hidden="true" :style="{ left: `${handX}%`, top: `${handY - 6}%` }")
          GameMark(kind="good")
        span(v-else-if="failed" class="gm-mark bad" aria-hidden="true" :style="{ left: `${handX}%`, top: `${handY - 6}%` }")
          GameMark(kind="bad")
      p(class="gm-depth" aria-live="polite")
        span(v-if="phase === 'read' || phase === 'between'") {{ t('app.adventure.plumbDepth', { n: reading }) }}
        span(v-else) {{ t('app.adventure.plumbNoDepth') }}
      div(class="gm-buttons")
        AdvButton(v-if="phase === 'move'" tone="gold" class="gm-b" @click="lower") {{ t('app.adventure.plumbLower') }}
        AdvButton(v-if="phase === 'read' && !failed" tone="gold" class="gm-b gm-cast" @click="castNet") {{ t('app.adventure.plumbCast') }}
        AdvButton(v-if="phase === 'read' && !failed" tone="blau" class="gm-b" @click="raise") {{ t('app.adventure.plumbRaise') }}
        AdvButton(v-if="idle > IDLE_SECONDS && phase !== 'between' && phase !== 'sinking'" tone="gold" class="gm-b" @click="helpMe") {{ t('app.adventure.plumbHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.plumbDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e3d6bd
  box-shadow: inset 0 0 18px rgba(70, 40, 20, 0.25)
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
  color: #4f3a28

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #4f3a28

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #0b3a4a
  background-size: 100% 100%
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-boat
  position: absolute
  display: block
  transform: translateX(-50%)
  pointer-events: none
  transition: left 120ms ease-out
  z-index: 3

  &.help
    outline: 4px dashed #fff6dc
    outline-offset: 2px
    border-radius: 12px

.gm-line
  position: absolute
  display: block
  width: max(1.4%, 5px)
  transform: translateX(-50%)
  pointer-events: none
  overflow: hidden
  z-index: 2
  transition: top 900ms ease-in, height 900ms ease-in, left 120ms ease-out

  img
    display: block
    width: 100%
    height: 100%
    object-fit: fill

.gm-lead
  position: absolute
  display: block
  transform: translateX(-50%)
  pointer-events: none
  z-index: 2
  transition: top 900ms ease-in, left 120ms ease-out

.gm-tick
  position: absolute
  left: 6px
  transform: translateY(-50%)
  padding: 0 6px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.82)
  color: #25404a
  font-weight: 800
  font-size: 1rem
  line-height: 1.3
  pointer-events: none

.gm-mark
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 4

.gm-depth
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #4f3a28

.gm-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 48px

.gm-b
  min-height: 44px
  min-width: 44px

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3a2a1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

// less motion: the boat, the line and the lead are at their place at once
@media (prefers-reduced-motion: reduce)
  .gm-boat, .gm-line, .gm-lead
    transition: none
</style>
