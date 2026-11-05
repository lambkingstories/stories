<script setup lang="ts">
/**
 * Stepping stones (John 11,3: the sisters send a messenger to Jesus). An upright brook: the messenger stands on the near bank, on the far bank the path goes on.
 * In the water lie calm shallow places and whirls (painted pictures). A tap on a calm place lays a stone there (the child has only a few); a tap on a laid stone takes it back.
 * The messenger steps onto every stone he can reach (never farther than his step; a dashed ring shows how far). A stone on a whirl is carried away: a cross, "The whirl takes the stone!",
 * one mistake. When the stones make a way to the far bank, the messenger walks across dry (a tick). Round 1 is a small brook with spare stones, round 2 a wider one with
 * more whirls and only one spare stone. The arrow keys go from place to place, Enter lays or lifts. Whoever does nothing for fifteen seconds gets "Help me": it shows the next good place
 * (or a stone that does not help). With reduced motion nothing glides or spins. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/zachaeusNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { STONES_RATIO, stonesHint, stonesLeft, stonesNeighbour, stonesProgress, stonesReach, stonesStand, stonesTap } from '@/utils/zachaeusNeu'
import type { Dir, Pt, StonesGame } from '@/utils/zachaeusNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: StonesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every brook counts in three parts: a third of the way, two thirds, the far bank. */
const PARTS = 3
progress.setGoal(props.game.rounds.length * PARTS)

const IDLE_SECONDS = 15
const STEP_MS = 480

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const placed = ref<boolean[]>(current.value.spots.map(() => false))
/** Where the messenger is drawn while he walks across (null: where he stands). */
const walkAt = ref<Pt | null>(null)
const walking = ref(false)
const arrived = ref(false)
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const credited = ref(0)
const idle = ref(0)
const message = ref('')
/** A whirl that just carried a stone away (cross and the spinning stone), the spot the help shows, and how it shows it. */
const washed = ref(-1)
const hinted = ref(-1)
const hintKind = ref<'place' | 'lift'>('place')
/** The last whirl tapped: tapping it again at once is not another mistake. */
let lastWhirl = -1
let messageSeq = 0
let washSeq = 0
let hintSeq = 0
const field = ref<HTMLElement | null>(null)
const focusSpot = ref(-1)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

const stand = computed(() => stonesStand(current.value, placed.value))
const left = computed(() => stonesLeft(current.value, placed.value))
const busy = computed(() => walking.value || between.value || finished.value)

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The parts of the way made so far count for "Go on" (once each). */
function credit(n: number) {
  const due = Math.min(PARTS, n)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function tick() {
  if (!busy.value) idle.value++
  later(tick, 1000)
}
later(tick, 1000)

function tap(i: number) {
  if (busy.value) return
  idle.value = 0
  hinted.value = -1
  focusSpot.value = i
  const before = stand.value.spot
  const res = stonesTap(current.value, placed.value, i)
  if (res.kind === 'whirl') {
    if (lastWhirl !== i) mistakes.value++
    lastWhirl = i
    play('wrong')
    washed.value = i
    const id = ++washSeq
    later(() => {
      if (washSeq === id) washed.value = -1
    }, 1400)
    say(t('app.adventure.stepStonesWhirl'))
    return
  }
  if (res.kind === 'empty') {
    say(t('app.adventure.stepStonesNone'), 4200)
    return
  }
  lastWhirl = -1
  placed.value = res.placed
  if (res.kind === 'lifted') {
    say(t('app.adventure.stepStonesLifted'))
    return
  }
  play('snap')
  const reach = stonesReach(current.value, placed.value, before >= 0 ? before : -1)
  if (reach.goal) {
    cross(reach.route ?? [])
    return
  }
  const now = stand.value
  if (now.spot !== before && now.spot >= 0) {
    later(() => play('bead'), 150)
    say(t('app.adventure.stepStonesLinked'))
    credit(Math.min(PARTS - 1, Math.floor(stonesProgress(current.value, now.at) * PARTS + 1e-9)))
  } else if (!stonesReach(current.value, placed.value).reached[i]) say(t('app.adventure.stepStonesLoose'), 3600)
  else say(t('app.adventure.stepStonesLinked'))
}

/** The way is there: the messenger walks from stone to stone to the far bank. */
function cross(route: number[]) {
  walking.value = true
  say(t('app.adventure.stepStonesWalking'), 0)
  const points = [...route.map((k) => current.value.spots[k]!), current.value.goal]
  points.forEach((p, k) => {
    later(() => {
      walkAt.value = p
      if (k < points.length - 1) play('bead')
    }, (k + 1) * STEP_MS)
  })
  later(arrive, (points.length + 1) * STEP_MS)
}

function arrive() {
  walking.value = false
  arrived.value = true
  between.value = true
  credit(PARTS)
  play('right')
  say(t('app.adventure.stepStonesArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    placed.value = current.value.spots.map(() => false)
    walkAt.value = null
    arrived.value = false
    between.value = false
    credited.value = 0
    idle.value = 0
    hinted.value = -1
    washed.value = -1
    focusSpot.value = -1
    lastWhirl = -1
    message.value = ''
  }, 2800)
}

/** The button for those who do not know on: it shows the next good place, or a stone that does not help. */
function helpMe() {
  idle.value = 0
  const h = stonesHint(current.value, placed.value)
  if (!h) return
  hinted.value = h.spot
  hintKind.value = h.kind
  const id = ++hintSeq
  later(() => {
    if (hintSeq === id) hinted.value = -1
  }, 6000)
  say(t(h.kind === 'place' ? 'app.adventure.stepStonesHelpPlace' : 'app.adventure.stepStonesHelpLift'), 6000)
  focusTo(h.spot)
}

function focusTo(i: number) {
  focusSpot.value = i
  nextTick(() => {
    const el = field.value?.querySelector<HTMLElement>(`[data-spot="${i}"]`)
    el?.focus({ preventScroll: true })
  })
}

const KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
function onKey(e: KeyboardEvent) {
  if (busy.value) return
  const d = KEYS[e.key]
  if (d !== undefined) {
    e.preventDefault()
    idle.value = 0
    const next = stonesNeighbour(current.value, focusSpot.value, d)
    if (next !== null) focusTo(next)
    return
  }
  // Enter on a place is its own click; Enter on the field chooses the first place
  if ((e.key === 'Enter' || e.key === ' ') && e.target === field.value) {
    e.preventDefault()
    idle.value = 0
    const first = stonesNeighbour(current.value, -1, 0)
    if (first !== null) focusTo(first)
    say(t('app.adventure.stepStonesKeys'), 4000)
  }
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const spotStyle = (s: Pt) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${props.game.spotW}%`, zIndex: z(s.y) })
const stoneStyle = computed(() => ({ width: `${(props.game.stoneW / props.game.spotW) * 100}%` }))
const stonePic = (i: number) => props.game.stone[i % props.game.stone.length]!
const here = computed<Pt>(() => walkAt.value ?? stand.value.at)
const messengerStyle = computed(() => ({ left: `${here.value.x}%`, top: `${here.value.y}%`, width: `${props.game.messengerW}%`, zIndex: z(here.value.y) + 2 }))
const ringStyle = computed(() => ({ left: `${stand.value.at.x}%`, top: `${stand.value.at.y}%`, width: `${current.value.reach * 2}%` }))
const goalStyle = computed(() => ({ left: `${current.value.goal.x}%`, top: `${current.value.goal.y}%` }))
function spotLabel(i: number): string {
  if (placed.value[i]) return t('app.adventure.stepStonesSpotStone', { n: i + 1 })
  return t(current.value.spots[i]!.whirl ? 'app.adventure.stepStonesSpotWhirl' : 'app.adventure.stepStonesSpot', { n: i + 1 })
}
const supply = computed(() => Array.from({ length: left.value }, (_, k) => k))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(current.background)})`, aspectRatio: String(STONES_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.stepStonesField')"
        @keydown="onKey"
      )
        button(
          v-for="(s, i) in current.spots"
          :key="`s-${round}-${i}`"
          type="button"
          class="gm-spot"
          :class="{ whirl: s.whirl, laid: placed[i], hinted: hinted === i, lift: hinted === i && hintKind === 'lift' }"
          :data-spot="i"
          :style="spotStyle(s)"
          :aria-label="spotLabel(i)"
          :aria-pressed="placed[i] ? 'true' : 'false'"
          :disabled="busy"
          @click="tap(i)"
          @focus="focusSpot = i"
        )
          GameImage(:src="s.whirl ? game.whirl : game.shallow" :ratio="1" :round="true" :colour="s.whirl ? '#2d7f86' : '#7fd3cf'" :label="s.whirl ? 'strudel' : 'flach'")
          span(v-if="placed[i]" class="gm-stone" :style="stoneStyle")
            GameImage(:src="stonePic(i)" :ratio="240 / 170" colour="#9b9184" label="stein")
          span(v-if="washed === i" class="gm-stone washed" :style="stoneStyle" aria-hidden="true")
            GameImage(:src="stonePic(i)" :ratio="240 / 170" colour="#9b9184" label="stein")
          span(v-if="washed === i" class="gm-mark")
            GameMark(kind="bad")
        div(v-if="!busy" class="gm-ring" :style="ringStyle" aria-hidden="true")
        div(v-if="arrived" class="gm-goal" :style="goalStyle")
          GameMark(kind="good")
        div(class="gm-walker" :class="{ walking }" :style="messengerStyle" role="img" :aria-label="t('app.adventure.stepStonesMessenger')")
          GameImage(:src="game.messenger" :ratio="220 / 330" colour="#a88a5e" label="bote")
      div(class="gm-supply" aria-live="polite")
        span(class="gm-stones" aria-hidden="true")
          span(v-for="k in supply" :key="k" class="gm-icon")
            GameImage(:src="stonePic(k)" :ratio="240 / 170" colour="#9b9184" label="stein")
        span(class="gm-count") {{ t('app.adventure.stepStonesCount', { n: left }) }}
      AdvButton(v-if="idle >= IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.stepStonesHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stepStonesDone')" @next="emit('done', stars)")
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

// the brook is upright (3:4): on a wide screen it is kept low enough to be seen whole
.gm-field
  position: relative
  align-self: center
  width: min(100%, 62vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6cb8b4
  background-size: cover
  background-position: center
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a place in the water: a round button (at least 44 pixels on a phone, see `stepStonesProblems`)
.gm-spot
  position: absolute
  display: block
  min-width: 44px
  aspect-ratio: 1
  padding: 0
  border: 0
  border-radius: 50%
  background: none
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  // the help: a dashed ring that breathes, the words say what to do
  &.hinted::after
    content: ''
    position: absolute
    inset: -6px
    border: 3px dashed #fff6dc
    border-radius: 50%
    animation: gm-breathe 900ms ease-in-out infinite

.gm-stone
  position: absolute
  left: 50%
  top: 50%
  display: block
  transform: translate(-50%, -58%)
  filter: drop-shadow(0 3px 2px rgba(20, 40, 40, 0.45))
  pointer-events: none

  &.washed
    animation: gm-wash 1200ms ease-in forwards

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

// how far the messenger can step: a dashed ring around his feet
.gm-ring
  position: absolute
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border: 2px dashed rgba(255, 246, 220, 0.85)
  border-radius: 50%
  pointer-events: none
  z-index: 1

.gm-goal
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 1500

.gm-walker
  position: absolute
  display: block
  transform: translate(-50%, -94%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))
  transition: left 420ms ease-in-out, top 420ms ease-in-out

  &.walking
    animation: gm-hop 480ms ease-in-out infinite

.gm-supply
  display: flex
  align-items: center
  justify-content: center
  flex-wrap: wrap
  gap: 8px

.gm-stones
  display: flex
  gap: 4px

.gm-icon
  display: block
  width: 40px

.gm-count
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

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

@keyframes gm-hop
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -6%

@keyframes gm-wash
  0%
    opacity: 1
    rotate: 0deg
    scale: 1
  100%
    opacity: 0
    rotate: 200deg
    scale: 0.4

@keyframes gm-breathe
  0%, 100%
    scale: 1
  50%
    scale: 1.08

// less motion: nothing glides, hops, spins or breathes
@media (prefers-reduced-motion: reduce)
  .gm-walker
    transition: none

    &.walking
      animation: none

  .gm-stone.washed
    animation: none
    opacity: 0.5

  .gm-spot.hinted::after
    animation: none
</style>
