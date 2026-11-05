<script setup lang="ts">
/**
 * Pass on the light (Luke 24,52-53). A hill near Bethany in the golden evening; a road leads to Jerusalem, at the right lies the city gate. People with oil lamps stand along the road; the first lamp burns.
 * The finger takes the flame from a burning lamp (a dashed circle shows how far it reaches) and drags it to a dark lamp in the circle: that lamp burns (a tick). Too far: the flame goes back, a cross and
 * "Too far!", a mistake. A tap on a burning lamp and then on a dark one does the same; on the keyboard the arrow keys choose a lamp and Enter takes or passes the flame. Letting go where there is no lamp is
 * no mistake. When every lamp burns, right up to the last person at the gate, the round is won. Round 1: six people in a row; round 2: nine people, the road forks, and all must burn. Whoever does not go on
 * gets "Help me" after fifteen seconds: the next lamp within reach is lit. With reduced motion the flame does not fly. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/osternNeuB.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterStars } from '@/utils/osternGames'
import { FLAME_PICK, FLAME_RATIO, FLAME_SPRITE, flameAllLit, flameHelp, flameLampAt, flameLamps, flameStart, flameTry, osterNeighbour } from '@/utils/osternNeuB'
import type { FlameGame, FlamePerson, Pt } from '@/utils/osternNeuB'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: FlameGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every lamp that is lit by the child (all but the first one of each round)
progress.setGoal(props.game.rounds.reduce((n, r) => n + Math.max(0, r.people.length - 1), 0))

const IDLE_SECONDS = 15
const TAP_PX = 8
const FLY_MS = 500
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const lamps = computed(() => flameLamps(props.game, current.value))
const lit = ref<boolean[]>(flameStart(props.game.rounds[0]!))
/** The lamp whose flame is in the hand (or chosen by a tap): -1 none. */
const source = ref(-1)
/** The lamp chosen with the arrow keys. */
const cursor = ref(-1)
/** The flame in the finger (percent of the picture) while it is dragged. */
const carry = ref<Pt | null>(null)
/** The flame of "Help me" on its way. */
const fly = ref<Pt | null>(null)
const markAt = ref<{ i: number; kind: 'good' | 'bad' } | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const helping = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const litCount = computed(() => lit.value.filter(Boolean).length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(i: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { i, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}

function idleLoop() {
  if (!between.value && !finished.value && !carry.value && !helping.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The flame goes from lamp `from` to lamp `to`: it burns, or it is too far. */
function pass(from: number, to: number, helped = false) {
  idle.value = 0
  const verdict = flameTry(props.game, current.value, lit.value, from, to)
  if (verdict === 'ok') {
    lit.value[to] = true
    source.value = -1
    progress.mark()
    play('bead')
    flash(to, 'good')
    say(t(helped ? 'app.adventure.flameHelped' : 'app.adventure.flameLit'), 1800)
    if (flameAllLit(lit.value)) endRound()
    return
  }
  if (verdict === 'far') {
    mistakes.value++
    play('wrong')
    flash(to, 'bad')
    source.value = -1
    say(t('app.adventure.flameFar'), 2600)
    return
  }
  if (verdict === 'lit') say(t('app.adventure.flameAlready'))
  else if (verdict === 'dark') say(t('app.adventure.flameDark'))
  source.value = -1
}

function endRound() {
  between.value = true
  source.value = -1
  cursor.value = -1
  later(() => play('right'), 250)
  say(t('app.adventure.flameGate'), 0)
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
    lit.value = flameStart(current.value)
    source.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** A tap on lamp `i` (also Enter on it, and a click of a screen reader): take the flame, change the lamp, or pass the flame. */
function tapLamp(i: number) {
  if (between.value || finished.value || helping.value) return
  idle.value = 0
  if (source.value < 0) {
    if (lit.value[i]) {
      source.value = i
      say(t('app.adventure.flamePick'), 3200)
    } else say(t('app.adventure.flameDark'))
    return
  }
  if (i === source.value) {
    source.value = -1
    message.value = ''
    return
  }
  if (lit.value[i]) {
    source.value = i
    say(t('app.adventure.flamePick'), 3200)
    return
  }
  pass(source.value, i)
}
function lampClick(e: MouseEvent, i: number) {
  if (e.detail === 0) tapLamp(i)
}

// ---- the finger: drag the flame from a burning lamp, or tap
let dragFrom = -1
let wasSource = false
let sx = 0
let sy = 0
let moved = 0

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (dragFrom < 0) return
  moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy))
  const p = pointAt(e)
  if (p && moved >= TAP_PX) carry.value = p
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  const from = dragFrom
  dragFrom = -1
  carry.value = null
  if (from < 0) return
  if (!e || e.type !== 'pointerup') {
    source.value = -1
    return
  }
  const m = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy))
  if (m < TAP_PX) {
    // a tap on a burning lamp: take its flame (or put it back when it was taken already)
    if (wasSource) {
      source.value = -1
      message.value = ''
    } else say(t('app.adventure.flamePick'), 3200)
    return
  }
  const p = pointAt(e)
  const to = p ? flameLampAt(lamps.value, p, FLAME_PICK, from) : -1
  if (to < 0) {
    // let go where there is no lamp: the flame goes back, no mistake
    source.value = -1
    return
  }
  pass(from, to)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value || helping.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  const i = flameLampAt(lamps.value, p)
  if (i < 0) {
    source.value = -1
    return
  }
  if (!lit.value[i]) {
    tapLamp(i)
    return
  }
  wasSource = source.value === i
  source.value = i
  dragFrom = i
  sx = e.clientX
  sy = e.clientY
  moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value || helping.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value < 0 ? (source.value >= 0 ? source.value : current.value.start) : osterNeighbour(lamps.value, cursor.value, a[0], a[1], FLAME_RATIO)
    say(lampLabel(cursor.value), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = current.value.start
      say(t('app.adventure.flameKeys'), 3600)
      return
    }
    tapLamp(cursor.value)
    return
  }
  if (e.key === 'Escape') {
    source.value = -1
    cursor.value = -1
    message.value = ''
  }
}

/** The button for those who do not go on: the flame flies to the next lamp within reach. */
function helpMe() {
  const h = flameHelp(props.game, current.value, lit.value)
  if (!h || helping.value) return
  idle.value = 0
  source.value = -1
  if (still) {
    pass(h.from, h.to, true)
    return
  }
  helping.value = true
  fly.value = { ...lamps.value[h.from]! }
  later(() => {
    fly.value = { ...lamps.value[h.to]! }
  }, 30)
  later(() => {
    fly.value = null
    helping.value = false
    pass(h.from, h.to, true)
  }, 30 + FLY_MS)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const ratio = String(FLAME_RATIO)
const spriteRatio = computed(() => props.game.spriteRatio ?? FLAME_SPRITE)
const flameW = computed(() => props.game.flameW ?? 3.5)
const personStyle = (p: FlamePerson) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: z(p.y) })
const lampStyle = (i: number) => ({ left: `${lamps.value[i]!.x}%`, top: `${lamps.value[i]!.y}%` })
const flameStyle = (at: Pt) => ({ left: `${at.x}%`, top: `${at.y}%`, width: `${flameW.value}%` })
const reachAt = computed(() => (source.value >= 0 ? lamps.value[source.value] : undefined))
const reachStyle = computed(() => ({ left: `${reachAt.value?.x ?? 0}%`, top: `${reachAt.value?.y ?? 0}%`, width: `${current.value.reach * 2}%` }))
function lampLabel(i: number): string {
  const p = current.value.people[i]
  const base = t(lit.value[i] ? 'app.adventure.flameLampLit' : 'app.adventure.flameLampDark', { n: i + 1 })
  return p?.name ? `${p.name}. ${base}` : base
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(current.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.flameField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        template(v-for="(p, i) in current.people" :key="`p-${round}-${i}`")
          div(class="gm-person" :data-person="i" :style="personStyle(p)" aria-hidden="true")
            GameImage(:src="p.image" :ratio="spriteRatio" colour="#a88a62" :label="p.name || p.image")
        //- the flames of the burning lamps
        template(v-for="(l, i) in lamps" :key="`flame-${round}-${i}`")
          div(v-if="lit[i]" class="gm-flame" :class="{ taken: !!carry && source === i }" :data-flame="i" :style="flameStyle(l)" aria-hidden="true")
            GameImage(:src="game.flame" :ratio="80 / 110" colour="#f2b648" label="flamme")
        //- how far the flame reaches (a dashed circle, like the circle of the net)
        div(v-if="reachAt" class="gm-reach" :style="reachStyle" role="img" :aria-label="t('app.adventure.flameReach')")
        //- the lamps: buttons of at least 44 pixels on the lamp in the hand
        button(
          v-for="(l, i) in lamps"
          :key="`lamp-${round}-${i}`"
          type="button"
          class="gm-lamp"
          :class="{ lit: lit[i], source: source === i, cursor: cursor === i }"
          :data-lamp="i"
          :style="lampStyle(i)"
          :aria-label="lampLabel(i)"
          :aria-pressed="source === i ? 'true' : 'false'"
          tabindex="-1"
          @click="lampClick($event, i)"
        )
          span(v-if="markAt && markAt.i === i" class="gm-mark")
            GameMark(:kind="markAt.kind")
        div(v-if="carry" class="gm-carry" :style="flameStyle(carry)" aria-hidden="true")
          GameImage(:src="game.flame" :ratio="80 / 110" colour="#f2b648" label="flamme")
        div(v-if="fly" class="gm-carry fly" :style="flameStyle(fly)" aria-hidden="true")
          GameImage(:src="game.flame" :ratio="80 / 110" colour="#f2b648" label="flamme")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.flameCount', { n: litCount, total: lit.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping" tone="gold" @click="helpMe") {{ t('app.adventure.flameHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.flameDone')" @next="emit('done', stars)")
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
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c79a5a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-person
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(60, 35, 10, 0.4))

// a lamp: an invisible button of 48 pixels on the lamp in the hand; the chosen one gets a ring
.gm-lamp
  position: absolute
  display: block
  width: 48px
  height: 48px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px solid transparent
  border-radius: 50%
  background: transparent
  pointer-events: none
  z-index: 2000

  &.source
    border-color: #fff6dc
    box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.6)

  &.cursor
    border-color: #fff6dc
    border-style: dashed

// the flame stands on the lamp
.gm-flame
  position: absolute
  display: block
  transform: translate(-50%, -85%)
  pointer-events: none
  z-index: 1950
  filter: drop-shadow(0 0 6px rgba(255, 210, 120, 0.9))
  animation: gm-flicker 900ms ease-in-out infinite alternate

  &.taken
    opacity: 0.35

.gm-carry
  position: absolute
  display: block
  transform: translate(-50%, -85%)
  pointer-events: none
  z-index: 2100
  filter: drop-shadow(0 0 8px rgba(255, 210, 120, 0.95))

  &.fly
    transition: left 500ms ease-in-out, top 500ms ease-in-out

// how far the flame reaches: dashed, so that it can be seen on any ground
.gm-reach
  position: absolute
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border: 3px dashed #fff6dc
  border-radius: 50%
  background: rgba(255, 246, 220, 0.14)
  box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.5)
  pointer-events: none
  z-index: 1900

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #6a4a22

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

@keyframes gm-flicker
  from
    scale: 0.94
  to
    scale: 1.06

// less motion: the flames do not flicker, the flame of "Help me" does not fly
@media (prefers-reduced-motion: reduce)
  .gm-flame
    animation: none

  .gm-carry.fly
    transition: none
</style>
