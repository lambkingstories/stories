<script setup lang="ts">
/**
 * To the uttermost part of the earth (Acts 1,8). A painted map from above with Jerusalem in the middle; the app lays four golden rings over it (a picture scaled to the radii of the data).
 * Round 1: the four round place pictures (Jerusalem, Judaea, Samaria, the end of the earth) lie mixed in a strip; the child drags them into the rings in the order of the verse (or taps a picture,
 * then the field). Only the next ring takes the next place: right = it stays and the ring fills with light (a tick); wrong = it springs back (a cross and a word, a mistake).
 * Round 2: the light shines only in Jerusalem; the child pulls from the middle outwards and lets go at the edge of the next ring. Too short: the light shrinks back (no mistake, "Further out!");
 * past the band into the ring after it: a cross and a word, a mistake. The arrow keys move the light, Enter lets go. "Help me" after fifteen seconds marks the right ring.
 * Nothing is drawn: rings, light and places are pictures. Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)`.
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
import { pfDist, witnessDrop, witnessRelease, witnessRingAt, witnessSpot } from '@/utils/pfingstenNeuA'
import type { Pt, WitnessGame } from '@/utils/pfingstenNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WitnessGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const n = props.game.places.length
// the whole task: every place into its ring, then every stretch of the light
progress.setGoal(n + (n - 1))

const IDLE_SECONDS = 15
const TAP_PX = 8
const KEY_STEP = 2

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stretch = computed(() => current.value.mode === 'stretch')
/** Round 1: how many places are in their rings. Round 2: how many rings shine. */
const filled = ref(0)
const lit = ref(1)
/** The radius of the light while the finger pulls it (or the arrow keys move it); null when nobody pulls. */
const pull = ref<number | null>(null)
const selected = ref(-1)
const drag = reactive({ item: -1, x: 0, y: 0, sx: 0, sy: 0, moved: 0, px: 0, pulling: false })
const mistakes = ref(0)
const idle = ref(0)
const helpRing = ref(-1)
const between = ref(false)
const finished = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const bounce = ref(-1)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
/** The places in the strip, mixed (always the same mixing, never the order of the verse). */
const trayOrder = computed(() => props.game.places.map((_, i) => (i * 3 + 1) % n).filter((v, i, a) => a.indexOf(v) === i))
const fullTray = computed(() => (trayOrder.value.length === n ? trayOrder.value : props.game.places.map((_, i) => n - 1 - i)))
const waiting = computed(() => (stretch.value ? [] : fullTray.value.filter((i) => i >= filled.value)))

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
  if (!between.value && !finished.value && drag.item < 0 && !drag.pulling) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

// ---- round 1: a place into a ring
function put(item: number, ring: number, at: Pt) {
  if (between.value || finished.value || stretch.value || item < filled.value) return
  idle.value = 0
  selected.value = -1
  helpRing.value = -1
  if (witnessDrop(filled.value, item, ring) !== 'ok') {
    mistakes.value++
    play('wrong')
    flash('bad', at)
    bounce.value = item
    later(() => {
      if (bounce.value === item) bounce.value = -1
    }, 600)
    say(t('app.adventure.witnessWrong', { place: props.game.places[filled.value]!.name }), 3200)
    return
  }
  filled.value++
  progress.mark()
  play('snap')
  flash('good', witnessSpot(props.game, item))
  say(t('app.adventure.witnessRight', { place: props.game.places[item]!.name }), 1800)
  if (filled.value >= n) endRound()
}

// ---- round 2: the light is let go
function release(r: number) {
  if (between.value || finished.value || !stretch.value) return
  idle.value = 0
  pull.value = null
  const verdict = witnessRelease(props.game, lit.value, r)
  if (verdict === 'short') {
    say(t('app.adventure.witnessShort'))
    return
  }
  if (verdict === 'far') {
    mistakes.value++
    play('wrong')
    flash('bad', { x: props.game.centre.x + r, y: props.game.centre.y })
    say(t('app.adventure.witnessFar', { place: props.game.places[lit.value]!.name }), 3200)
    return
  }
  helpRing.value = -1
  const place = lit.value
  lit.value++
  progress.mark()
  play('snap')
  flash('good', witnessSpot(props.game, place))
  say(t('app.adventure.witnessRight', { place: props.game.places[place]!.name }), 1800)
  if (lit.value >= n) endRound()
}

function endRound() {
  between.value = true
  later(() => play('right'), 300)
  say(t(lastRound.value ? 'app.adventure.witnessAll' : 'app.adventure.witnessRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    lit.value = 1
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
  if (drag.pulling) {
    const p = percentAt(e)
    if (p) pull.value = Math.max(innerLight.value, pfDist(p, props.game.centre))
    return
  }
  if (drag.item < 0) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function listen() {
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  if (drag.pulling) {
    drag.pulling = false
    const p = e && e.type === 'pointerup' ? percentAt(e) : null
    if (!p) {
      pull.value = null
      return
    }
    release(pfDist(p, props.game.centre))
    return
  }
  const i = drag.item
  drag.item = -1
  if (i < 0 || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    pick(i)
    return
  }
  dropAt(i, percentAt(e))
}
function dropAt(i: number, p: Pt | null) {
  const ring = p ? witnessRingAt(props.game, p) : -1
  if (!p || ring < 0) {
    say(t('app.adventure.witnessBack'))
    return
  }
  put(i, ring, p)
}
function downThing(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  drag.item = i
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  drag.px = field.value?.getBoundingClientRect().width ?? 300
  listen()
}
function downField(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  if (!stretch.value) {
    // round 1: a tap on the field puts the chosen place there
    if (selected.value >= 0) dropAt(selected.value, percentAt(e))
    else say(t('app.adventure.witnessPickFirst'))
    return
  }
  idle.value = 0
  drag.pulling = true
  const p = percentAt(e)
  pull.value = Math.max(innerLight.value, p ? pfDist(p, props.game.centre) : 0)
  listen()
}
onBeforeUnmount(() => unlisten())

function pick(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  selected.value = selected.value === i ? -1 : i
  if (selected.value >= 0) say(t('app.adventure.witnessPicked', { place: props.game.places[i]!.name }), 3200)
}
function thingClick(e: MouseEvent, i: number) {
  if (e.detail === 0) pick(i)
}

// ---- the keyboard: round 1 left/right choose a place, up/down a ring, Enter puts it; round 2 the arrows move the light, Enter lets go
const keyRing = ref(-1)
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  if (stretch.value) {
    if (k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowLeft') {
      e.preventDefault()
      idle.value = 0
      const step = k === 'ArrowUp' || k === 'ArrowRight' ? KEY_STEP : -KEY_STEP
      pull.value = Math.max(innerLight.value, (pull.value ?? innerLight.value) + step)
      say(t('app.adventure.witnessKeysPull'), 0)
      return
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault()
      if (pull.value !== null) release(pull.value)
      return
    }
    return
  }
  const list = waiting.value
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    if (!list.length) return
    const at = list.indexOf(selected.value)
    selected.value = list[at < 0 ? 0 : (at + (k === 'ArrowRight' ? 1 : -1) + list.length) % list.length]!
    announce()
    return
  }
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    keyRing.value = keyRing.value < 0 ? 0 : (keyRing.value + (k === 'ArrowUp' ? 1 : -1) + n) % n
    announce()
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (selected.value < 0 && list.length) selected.value = list[0]!
    if (keyRing.value < 0) keyRing.value = 0
    if (selected.value >= 0) put(selected.value, keyRing.value, witnessSpot(props.game, keyRing.value))
  }
}
function announce() {
  const place = selected.value >= 0 ? props.game.places[selected.value]!.name : ''
  if (place) say(t('app.adventure.witnessChoice', { place, ring: keyRing.value < 0 ? 1 : keyRing.value + 1 }), 0)
}

/** "Help me": round 1 chooses the next place of the verse and marks its ring; round 2 marks the edge where the light should be let go. */
function helpMe() {
  idle.value = 0
  if (stretch.value) {
    helpRing.value = lit.value
    say(t('app.adventure.witnessHelpPull', { place: props.game.places[lit.value]!.name }), 4000)
    return
  }
  helpRing.value = filled.value
  selected.value = filled.value
  say(t('app.adventure.witnessHelpOrder', { place: props.game.places[filled.value]!.name }), 4000)
}

// ---- looks
/** The light that shines without pulling: round 1 up to the last filled ring, round 2 up to the last lit ring. */
const innerLight = computed(() => {
  const k = stretch.value ? lit.value : filled.value
  return k > 0 ? props.game.rings[k - 1]! : 0
})
const lightR = computed(() => (stretch.value && pull.value !== null ? pull.value : innerLight.value))
const circle = (r: number) => ({ left: `${props.game.centre.x}%`, top: `${props.game.centre.y}%`, width: `${r * 2}%` })
const shown = (i: number) => (stretch.value ? true : i < filled.value)
const spot = (i: number) => {
  const p = witnessSpot(props.game, i)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.placeW}%` }
}
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const ghostStyle = computed(() => ({ left: `${drag.x}px`, top: `${drag.y}px`, width: `${Math.max(44, (props.game.placeW / 100) * drag.px)}px` }))
const ringLabel = (i: number) => t('app.adventure.witnessRing', { n: i + 1, place: shown(i) ? props.game.places[i]!.name : '?' })
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :class="{ pulling: drag.pulling }"
        :style="{ backgroundImage: `url(${src(game.map)})` }"
        role="group"
        tabindex="0"
        :aria-label="t(stretch ? 'app.adventure.witnessFieldPull' : 'app.adventure.witnessField')"
        @pointerdown.prevent="downField"
        @keydown="onKey"
      )
        div(class="gm-light" :style="circle(lightR)" aria-hidden="true")
          GameImage(:src="game.light" :ratio="1" colour="#f3d27a" label="licht")
        div(
          v-for="(r, i) in game.rings"
          :key="`ring-${i}`"
          class="gm-ring"
          :class="{ help: helpRing === i, cursor: !stretch && keyRing === i }"
          :data-ring="i"
          :style="circle(r)"
          role="img"
          :aria-label="ringLabel(i)"
        )
          GameImage(:src="game.ring" :ratio="1" colour="#d4a83e" label="ring")
        template(v-for="(p, i) in game.places" :key="`place-${p.id}`")
          div(v-if="shown(i)" class="gm-place" :class="{ glow: stretch && i < lit }" :data-place="p.id" :style="spot(i)" role="img" :aria-label="p.name")
            GameImage(:src="p.image" :ratio="1" round colour="#c9b48a" :label="p.name")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(v-if="!stretch" class="gm-tray" role="group" :aria-label="t('app.adventure.witnessTray')")
        template(v-for="i in fullTray" :key="`tray-${round}-${i}`")
          button(
            v-if="i >= filled"
            type="button"
            class="gm-thing"
            :class="{ sel: selected === i, held: drag.item === i && drag.moved >= TAP_PX, bounce: bounce === i }"
            :data-item="game.places[i].id"
            :aria-label="game.places[i].name"
            :aria-pressed="selected === i ? 'true' : 'false'"
            :disabled="between"
            @pointerdown.prevent="downThing($event, i)"
            @click="thingClick($event, i)"
          )
            GameImage(:src="game.places[i].image" :ratio="1" round colour="#c9b48a" :label="game.places[i].name")
      div(v-if="drag.item >= 0 && drag.moved >= TAP_PX" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="game.places[drag.item]?.image ?? ''" :ratio="1" round colour="#c9b48a")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.witnessCount', { n: stretch ? lit : filled, total: game.places.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.witnessHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.witnessDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 1 / 1
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6d8a6a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-light, .gm-ring, .gm-place
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  pointer-events: none

  :deep(.gi), :deep(img)
    width: 100%
    height: 100%

.gm-light
  z-index: 1
  opacity: 0.85
  transition: width 320ms ease-out

  .pulling &
    transition: none

.gm-ring
  z-index: 2

  &.help, &.cursor
    outline: 4px dashed #fff6dc
    outline-offset: 2px
    border-radius: 50%

  &.help
    animation: gm-pulse 900ms ease-in-out infinite

.gm-place
  z-index: 3
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.4))

  &.glow
    filter: drop-shadow(0 0 8px rgba(255, 233, 150, 0.95))

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 70px

.gm-thing
  width: 76px
  height: 76px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 50%
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  transition: transform 200ms ease, opacity 200ms ease

  &.sel
    border-color: #2f6b8a
    border-style: double
    border-width: 5px
    transform: scale(1.08)

  &.held
    opacity: 0.4

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: fixed
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
    outline-offset: 2px
  50%
    outline-offset: 7px

@media (prefers-reduced-motion: reduce)
  .gm-light, .gm-thing
    transition: none

  .gm-thing.bounce, .gm-ring.help
    animation: none
</style>
