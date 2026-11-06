<script setup lang="ts">
/**
 * Twelve pearl gates (Rev 21,12-13.21: "on the east three gates; on the north three gates; on the south three gates; and on the west three gates ... every several gate was of one pearl").
 * The city seen from above, square, with a high wall and twelve empty openings, three on each side; by the picture stands a compass rose with a little sign at each tip for the old word
 * (a rooster for morning, a loaf and a jug for noon, a lamp being lit for evening, a sleeping child for midnight). The verse is said piece by piece ("Vom Morgen drei Tore"). Below lie the gates of
 * pearl. The child drags a gate to an opening of the side that is asked for (or taps a gate, then an opening; on the keyboard arrow keys choose the opening, Enter puts the gate there). Right: the gate
 * snaps in and shimmers, a tick and a click. A side that is not asked for: a cross and "Morning means east. Look at the compass rose.", the gate goes back, a mistake; an opening that is taken or a drop beside
 * the openings is no mistake. Round 1: morning and evening, round 2: midnight and noon (the first gates stay). At the end all twelve gates stand open and people from many nations walk in.
 * "Help me" after fifteen seconds lets the right tip of the rose and the three openings of the side glow. Nothing is shown by colour alone. Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { gatesDrop, gatesKey, gatesOpeningAt, gatesTip, gatesWanted } from '@/utils/offenbarungNeuB'
import type { GatesGame, GatesSide, Pt } from '@/utils/offenbarungNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GatesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.sides.length * 3)

const IDLE_SECONDS = 15
const TAP_PX = 8
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The openings with a gate in them, as "side-i". */
const placed = ref<string[]>([])
const placedSet = computed(() => new Set(placed.value))
const wanted = computed(() => gatesWanted(current.value, placedSet.value))
const wantedSide = computed<GatesSide | undefined>(() => props.game.sides.find((s) => s.id === wanted.value))
const inRound = computed(() => current.value.order.length * 3)
const doneInRound = computed(() => current.value.order.reduce((n, id) => n + [0, 1, 2].filter((i) => placedSet.value.has(gatesKey(id, i))).length, 0))
const inTray = computed(() => Math.max(0, inRound.value - doneInRound.value))
const selected = ref(false)
const cursor = ref(-1)
const helping = ref(false)
const drag = reactive({ on: false, x: 0, y: 0, sx: 0, sy: 0, moved: 0 })
const bounce = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
/** All openings in the order of the sides, to walk through with the keys. */
const allOpenings = computed(() => props.game.sides.flatMap((s) => s.openings.map((p, i) => ({ side: s.id, i, p }))))
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
function idleLoop() {
  if (!between.value && !finished.value && !drag.on) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** A gate is put to opening `i` of `side`. */
function put(side: string, i: number) {
  if (between.value || finished.value || inTray.value <= 0) return
  const s = props.game.sides.find((x) => x.id === side)
  const spot = s?.openings[i]
  if (!s || !spot) return
  idle.value = 0
  selected.value = false
  const r = gatesDrop(wanted.value, placedSet.value, side, i)
  if (r === 'taken') {
    say(t('app.adventure.gatesTaken'), 2000)
    return
  }
  if (r === 'wrong') {
    mistakes.value++
    play('wrong')
    flash('bad', spot)
    bounce.value = true
    later(() => (bounce.value = false), 600)
    say(t(`app.adventure.gatesWrong${cap(wanted.value ?? side)}`), 3400)
    return
  }
  const before = wanted.value
  placed.value.push(gatesKey(side, i))
  helping.value = false
  progress.mark()
  play('snap')
  flash('good', spot)
  const next = gatesWanted(current.value, new Set(placed.value))
  if (next === null) {
    endRound()
    return
  }
  say(next !== before ? t('app.adventure.gatesSideDone', { word: s.word }) : t('app.adventure.gatesIn'), 2000)
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.gatesRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.gatesOpen'), 0)
    }, 1400)
    later(() => {
      play('star')
      finished.value = true
    }, 4400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger
function percentAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!drag.on) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  const was = drag.on
  drag.on = false
  if (!was || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    pick()
    return
  }
  const p = percentAt(e)
  const o = p ? gatesOpeningAt(props.game, p) : null
  if (!o) {
    say(t('app.adventure.gatesBack'))
    return
  }
  put(o.side, o.i)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  drag.on = true
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())
function pick() {
  if (between.value || finished.value) return
  idle.value = 0
  selected.value = !selected.value
  if (selected.value) say(t('app.adventure.gatesPicked'), 3200)
}
function tileClick(e: MouseEvent) {
  if (e.detail === 0) pick()
}
function tapOpening(side: string, i: number) {
  if (between.value || finished.value) return
  if (!selected.value) {
    say(t('app.adventure.gatesPickFirst'))
    return
  }
  put(side, i)
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  const n = allOpenings.value.length
  if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const fwd = k === 'ArrowRight' || k === 'ArrowDown'
    cursor.value = cursor.value < 0 ? 0 : (cursor.value + (fwd ? 1 : -1) + n) % n
    announce()
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    idle.value = 0
    if (!selected.value) {
      selected.value = true
      if (cursor.value < 0) cursor.value = Math.max(0, allOpenings.value.findIndex((o) => o.side === wanted.value))
      announce()
      return
    }
    const o = allOpenings.value[cursor.value < 0 ? 0 : cursor.value]
    if (o) put(o.side, o.i)
  }
}
function announce() {
  const o = allOpenings.value[cursor.value]
  if (!o) return
  const s = props.game.sides.find((x) => x.id === o.side)!
  say(t('app.adventure.gatesChoice', { side: s.name, n: o.i + 1 }), 0)
}

/** "Help me": the right tip of the rose and the openings of the side glow. */
function helpMe() {
  idle.value = 0
  helping.value = true
  selected.value = true
  const s = wantedSide.value
  if (s) say(t('app.adventure.gatesHelpSay', { part: s.part }), 5000)
}

// ---- looks
const spotStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const openStyle = (p: Pt) => ({ ...spotStyle(p), width: `${props.game.gateW}%` })
const roseStyle = computed(() => ({ ...spotStyle(props.game.roseAt), width: `${props.game.roseW}%` }))
const tipStyle = computed(() => (wantedSide.value ? spotStyle(gatesTip(props.game, wantedSide.value)) : {}))
const ghostStyle = computed(() => ({ left: `${drag.x}px`, top: `${drag.y}px` }))
const has = (side: string, i: number) => placedSet.value.has(gatesKey(side, i))
const isHelp = (side: string) => helping.value && wanted.value === side
const isCursor = (side: string, i: number) => {
  const o = allOpenings.value[cursor.value]
  return !!o && o.side === side && o.i === i
}
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      p(v-if="wantedSide && !ending && !between" class="gm-part" data-part aria-live="polite") {{ wantedSide.part }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(ending ? game.cityOpen : game.city)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.gatesField')"
        @keydown="onKey"
      )
        template(v-if="!ending")
          div(class="gm-rose" :style="roseStyle" role="img" :aria-label="t('app.adventure.gatesRose')")
            GameImage(:src="game.rose" :ratio="1" colour="#e6d3a5" label="windrose")
          span(v-if="helping && wantedSide" class="gm-tip" :style="tipStyle" aria-hidden="true")
          template(v-for="s in game.sides" :key="`side-${s.id}`")
            template(v-for="(p, i) in s.openings" :key="`o-${s.id}-${i}`")
              button(
                type="button"
                class="gm-open"
                :class="{ armed: selected || drag.on, help: isHelp(s.id), cursor: isCursor(s.id, i), full: has(s.id, i) }"
                :data-open="`${s.id}-${i}`"
                :style="openStyle(p)"
                :aria-label="t('app.adventure.gatesOpening', { side: s.name, n: i + 1 })"
                tabindex="-1"
                @click="tapOpening(s.id, i)"
              )
              span(v-if="has(s.id, i)" class="gm-placed" :data-placed="`${s.id}-${i}`" :style="openStyle(p)" aria-hidden="true")
                GameImage(:src="game.gate" :ratio="1" colour="#f1ece0" label="tor-perle")
        span(v-if="crossAt" class="gm-mark" :style="spotStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="spotStyle(tickAt)")
          GameMark(kind="good")
      div(v-if="!ending" class="gm-tray" role="group" :aria-label="t('app.adventure.gatesTray')")
        button(
          v-for="k in inTray"
          :key="`gate-${round}-${k}`"
          type="button"
          class="gm-tile"
          :class="{ sel: selected && k === 1, held: drag.on && drag.moved >= TAP_PX && k === 1, bounce: bounce && k === 1 }"
          :data-tile="k"
          :aria-label="t('app.adventure.gatesGate')"
          :aria-pressed="selected && k === 1 ? 'true' : 'false'"
          :disabled="between"
          @pointerdown.prevent="down"
          @click="tileClick"
        )
          GameImage(:src="game.gate" :ratio="1" colour="#f1ece0" label="tor-perle")
      div(v-if="drag.on && drag.moved >= TAP_PX" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="game.gate" :ratio="1" colour="#f1ece0")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.gatesCount', { n: placed.length, total: game.sides.length * 3 }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.gatesHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gatesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

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

// the piece of the verse that is asked for
.gm-part
  margin: 0
  align-self: center
  padding: 2px 16px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  border: 2px solid #8a5a2a
  font-weight: 800
  font-size: 1.15rem
  text-align: center
  color: #3f321b

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 1 / 1
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9d2bd
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-rose
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2

// the lit tip of the compass rose (a ring of the interface around the tip)
.gm-tip
  position: absolute
  display: block
  width: 34px
  height: 34px
  margin: -17px 0 0 -17px
  border-radius: 50%
  border: 4px solid #fff6dc
  box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.6), 0 0 12px 4px rgba(255, 240, 180, 0.9)
  pointer-events: none
  z-index: 4

// an opening: an invisible round button of at least 44 pixels; while a gate is in the hand a dashed ring shows it
.gm-open
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  z-index: 3

  &.armed:not(.full)
    border-color: rgba(255, 246, 220, 0.85)

  &.cursor, &.help
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    animation: gm-pulse 1100ms ease-in-out infinite

.gm-placed
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 0 5px rgba(255, 250, 235, 0.95))
  animation: gm-shimmer 2400ms ease-in-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 7

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  min-height: 64px

.gm-tile
  position: relative
  width: 58px
  min-height: 58px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  transition: transform 200ms ease, opacity 200ms ease

  &.sel
    border-color: #2f6b8a
    border-style: double
    border-width: 5px
    transform: scale(1.06)

  &.held
    opacity: 0.4

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: fixed
  width: 58px
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 50

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

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)

@keyframes gm-pulse
  0%, 100%
    transform: translate(-50%, -50%) scale(1)
  50%
    transform: translate(-50%, -50%) scale(1.12)

@keyframes gm-shimmer
  0%, 100%
    filter: drop-shadow(0 0 4px rgba(255, 250, 235, 0.9))
  50%
    filter: drop-shadow(0 0 9px rgba(255, 250, 235, 1))

@media (prefers-reduced-motion: reduce)
  .gm-tile
    transition: none

    &.bounce
      animation: none

  .gm-open.help, .gm-placed
    animation: none
</style>
