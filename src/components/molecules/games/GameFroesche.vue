<script setup lang="ts">
/**
 * Frogs back to the Nile (Exodus 8; the frogs came up into the houses, the bedrooms and the kneading troughs). A painted house with an open side through which the Nile can be seen;
 * friendly frogs sit everywhere (pictures laid on the painting). A short swipe on a frog flicks it to the water: it jumps, gets small and is gone. A tap without a swipe only gets a word.
 * Round 1: five frogs that sit still, any swipe counts. Round 2: seven frogs that hop on from place to place in turn, and the swipe has to point at the water
 * (a swipe the wrong way is a mistake: a cross, "There is no water there", the frog stays). A game of tidying up, not a retelling: the Bible says the frogs died (8,9–10).
 * Keyboard: the arrow keys choose a frog, Enter flicks it to the water. Whoever does not go on gets the button "Help me" after fifteen seconds: a frog and the water are marked,
 * a word says which way. Less motion: the frogs do not glide or jump, they are there or gone at once, and they hop half as often. Nothing is shown by colour alone.
 * Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
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
import { frogAimOk, frogDir, frogGoal, frogHopper, frogNextFree, frogRatio, frogRiverMiddle, frogSwipeToWater, frogTarget } from '@/utils/moseNeu'
import type { FrogFlickGame, FrogPt } from '@/utils/moseNeu'

const props = defineProps<{ game: FrogFlickGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(frogGoal(props.game))

const TICK_MS = 250
const IDLE_SECONDS = 15
const SWIPE_PX = 24
/** The smallest radius of the place where a finger catches a frog (pixels): a target of at least 44 pixels. */
const HIT_PX = 26
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** How long a flicked frog flies (milliseconds); with less motion it is gone at once. */
const FLY_MS = still ? 0 : 480
const BUMP_MS = 1200

type FrogState = 'sit' | 'fly' | 'gone'
interface Frog {
  id: number
  spot: number
  state: FrogState
  at: FrogPt
  bump: boolean
}

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => frogRatio(current.value))
const frogs = ref<Frog[]>([])
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
const selected = ref<number | null>(null)
const helpFrog = ref<number | null>(null)
const field = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))
let messageSeq = 0
let hopClock = 0
let hopTurn = 0
let held: number | null = null

const inHouse = computed(() => frogs.value.filter((f) => f.state === 'sit'))
const left = computed(() => inHouse.value.length)
/** The frogs in the house from left to right (the order of the arrow keys). */
const order = computed(() => [...inHouse.value].sort((a, b) => a.at.x - b.at.x || a.at.y - b.at.y).map((f) => f.id))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  const r = current.value
  frogs.value = Array.from({ length: Math.min(r.count, r.spots.length) }, (_, i) => ({ id: i, spot: i, state: 'sit' as FrogState, at: { x: r.spots[i]!.x, y: r.spots[i]!.y }, bump: false }))
  between.value = false
  selected.value = null
  helpFrog.value = null
  idle.value = 0
  hopClock = 0
  hopTurn = 0
  held = null
}
startRound()

/** Every `hop` seconds (twice as long with less motion) one frog hops on to the next free place; the frog under the finger and the marked one stay. */
function hopNow() {
  const r = current.value
  const skip = [held, helpFrog.value, selected.value].filter((x): x is number => x !== null)
  const who = frogHopper(
    inHouse.value.map((f) => f.id).sort((a, b) => a - b),
    hopTurn,
    skip
  )
  hopTurn++
  if (who === null) return
  const taken = r.spots.map((_, i) => inHouse.value.some((f) => f.spot === i))
  const frog = frogs.value.find((f) => f.id === who)!
  const next = frogNextFree(taken, frog.spot)
  if (next < 0) return
  frog.spot = next
  frog.at = { x: r.spots[next]!.x, y: r.spots[next]!.y }
}

function loop() {
  if (!between.value && !finished.value) {
    idle.value += TICK_MS / 1000
    const hop = current.value.hop
    if (hop) {
      hopClock += TICK_MS / 1000
      if (hopClock >= hop * (still ? 2 : 1)) {
        hopClock = 0
        hopNow()
      }
    }
  }
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

const DIR_KEY = { up: 'Up', down: 'Down', left: 'Left', right: 'Right', upLeft: 'UpLeft', upRight: 'UpRight', downLeft: 'DownLeft', downRight: 'DownRight' } as const
const dirWord = (f: Frog) => t(`app.adventure.frogFlickDir${DIR_KEY[frogDir(f.at, current.value.river, ratio.value)]}`)

/** A swipe on a frog (`dx`, `dy` in pixels): towards the water it flies there, the wrong way (round 2) it is a mistake. */
function flick(id: number, dx: number, dy: number) {
  if (between.value || finished.value) return
  const frog = frogs.value.find((f) => f.id === id)
  if (!frog || frog.state !== 'sit') return
  idle.value = 0
  const r = current.value
  if (!frogAimOk(frog.at, r.river, dx, dy, r.aim, ratio.value)) {
    mistakes.value++
    play('wrong')
    frog.bump = true
    say(t('app.adventure.frogFlickWrong', { dir: dirWord(frog) }), 3200)
    later(() => (frog.bump = false), BUMP_MS)
    return
  }
  play('bead')
  frog.state = 'fly'
  frog.at = frogTarget(frog.at, r.river)
  if (helpFrog.value === id) helpFrog.value = null
  if (selected.value === id) selected.value = null
  progress.mark()
  say(t('app.adventure.frogFlickGood'), 1400)
  later(() => {
    frog.state = 'gone'
    if (!frogs.value.some((f) => f.state !== 'gone')) roundDone()
  }, FLY_MS)
}

function roundDone() {
  between.value = true
  play('right')
  say(t('app.adventure.frogFlickClean'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1200)
  later(() => {
    round.value++
    startRound()
    message.value = ''
  }, 2600)
}

// ---- the finger: a frog is caught where the finger goes down, the swipe is the way from there to where it goes up
let downAt: { x: number; y: number; frog: number } | null = null

/** The frog under a point of the screen (the nearest one within its catching radius), or null. */
function frogAt(x: number, y: number): number | null {
  const box = field.value?.getBoundingClientRect()
  if (!box || !box.width || !box.height) return null
  let best: number | null = null
  let bestD = Infinity
  for (const f of inHouse.value) {
    const w = (current.value.spots[f.spot]!.w / 100) * box.width
    const cx = box.left + (f.at.x / 100) * box.width
    const cy = box.top + (f.at.y / 100) * box.height - w * 0.45
    const d = Math.hypot(x - cx, y - cy)
    if (d <= Math.max(HIT_PX, w * 0.6) && d < bestD) {
      bestD = d
      best = f.id
    }
  }
  return best
}
function stopListening() {
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', cancel)
}
function cancel() {
  downAt = null
  held = null
  stopListening()
}
function up(e: PointerEvent) {
  const from = downAt
  downAt = null
  held = null
  stopListening()
  if (!from) return
  const dx = e.clientX - from.x
  const dy = e.clientY - from.y
  if (Math.hypot(dx, dy) >= SWIPE_PX) flick(from.frog, dx, dy)
  else say(t('app.adventure.frogFlickTap'))
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  const f = frogAt(e.clientX, e.clientY)
  if (f === null) {
    say(t('app.adventure.frogFlickMiss'))
    return
  }
  downAt = { x: e.clientX, y: e.clientY, frog: f }
  held = f
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', cancel)
}
// the unmount: nothing may be left listening
onBeforeUnmount(stopListening)

/** Enter (or "Help me" followed by Enter): the chosen frog is flicked straight at the water. */
function flickToWater(id: number) {
  const f = frogs.value.find((x) => x.id === id)
  if (!f) return
  const s = frogSwipeToWater(f.at, current.value.river, 360, ratio.value)
  flick(id, s.dx, s.dy)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (step) {
    e.preventDefault()
    idle.value = 0
    const list = order.value
    if (!list.length) return
    const at = selected.value === null ? -1 : list.indexOf(selected.value)
    const next = at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length
    selected.value = list[next]!
    say(t('app.adventure.frogFlickSelected', { n: next + 1, total: list.length }), 3000)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const id = selected.value ?? helpFrog.value
    if (id !== null) flickToWater(id)
    else say(t('app.adventure.frogFlickKeys'), 3600)
  }
}

/** The button "Help me": the frog nearest to the water and the water are marked, a word says which way (Enter flicks it). */
function helpMe() {
  idle.value = 0
  const m = frogRiverMiddle(current.value.river)
  const near = [...inHouse.value].sort((a, b) => Math.hypot(a.at.x - m.x, a.at.y - m.y) - Math.hypot(b.at.x - m.x, b.at.y - m.y))[0]
  if (!near) return
  helpFrog.value = near.id
  selected.value = near.id
  say(t('app.adventure.frogFlickHelpSay', { dir: dirWord(near) }), 5000)
}

// ---- looks
const fieldStyle = computed(() => ({ aspectRatio: String(ratio.value) }))
const riverStyle = computed(() => {
  const r = current.value.river
  return { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
})
const frogStyle = (f: Frog) => ({ left: `${f.at.x}%`, top: `${f.at.y}%`, width: `${current.value.spots[f.spot]!.w}%` })
const frogPicture = (f: Frog) => (f.state === 'fly' ? props.game.jump : props.game.frogs[f.id % Math.max(1, props.game.frogs.length)]!)
/** Every second frog looks the other way; a flying frog looks where it flies. */
const frogFlip = (f: Frog) => {
  if (f.state === 'fly') return f.at.x < current.value.spots[f.spot]!.x ? -1 : 1
  return f.id % 2 ? -1 : 1
}
const frogLabel = (f: Frog) => t('app.adventure.frogFlickFrog', { n: order.value.indexOf(f.id) + 1 })
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="fieldStyle"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.frogFlickField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        span(class="gm-scene" aria-hidden="true")
          GameImage(:src="current.scene" :ratio="ratio" colour="#d9b98a" label="haus")
        span(class="gm-river" :class="{ hint: helpFrog !== null }" :style="riverStyle" role="img" :aria-label="t('app.adventure.frogFlickRiver')")
        div(
          v-for="f in frogs"
          v-show="f.state !== 'gone'"
          :key="`${round}-${f.id}`"
          class="gm-frog"
          :class="[f.state, { bump: f.bump, sel: selected === f.id, hint: helpFrog === f.id }]"
          :style="frogStyle(f)"
          :data-frog="f.id"
          role="img"
          :aria-label="f.state === 'sit' ? frogLabel(f) : undefined"
          :aria-hidden="f.state === 'sit' ? undefined : 'true'"
        )
          span(class="gm-flip" :style="{ transform: `scaleX(${frogFlip(f)})` }")
            GameImage(:src="frogPicture(f)" :ratio="1" colour="#6f9a3c" label="frosch")
          span(v-if="f.bump" class="gm-mark")
            GameMark(kind="bad")
      p(class="gm-count") {{ t('app.adventure.frogFlickLeft', { n: left, total: frogs.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpFrog === null" tone="gold" @click="helpMe") {{ t('app.adventure.frogFlickHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.frogFlickDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe2c4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.22)
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
  color: #5a4630

.gm-hint, .gm-count
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4630

.gm-field
  position: relative
  width: 100%
  max-width: 560px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #d9b98a
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-scene
  position: absolute
  inset: 0
  display: block
  pointer-events: none

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: cover

  :deep(.gi-stand)
    border-radius: 0

// the water: invisible, only marked by "Help me" (a dashed frame, not only a colour)
.gm-river
  position: absolute
  display: block
  pointer-events: none
  border-radius: 12px

  &.hint
    outline: 4px dashed #fff6dc
    outline-offset: -4px
    z-index: 2

.gm-frog
  position: absolute
  display: block
  min-width: 44px
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))
  transition: left 380ms ease-in-out, top 380ms ease-in-out

  &.fly
    z-index: 4
    transition: left 480ms ease-out, top 480ms ease-out, opacity 480ms ease-in, scale 480ms ease-in
    opacity: 0
    scale: 0.5

  &.bump .gm-flip
    animation: gm-bump 360ms ease-in-out 2

  &.sel, &.hint
    outline: 4px dashed #fff6dc
    outline-offset: 2px
    border-radius: 50%

.gm-flip
  display: block

.gm-mark
  position: absolute
  right: -10px
  top: -10px
  display: block
  pointer-events: none
  z-index: 5

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3e2f1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-bump
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -12%

// less motion: the frogs do not glide, fly or shake
@media (prefers-reduced-motion: reduce)
  .gm-frog, .gm-frog.fly
    transition: none

  .gm-frog.bump .gm-flip
    animation: none
</style>
