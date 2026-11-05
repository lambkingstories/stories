<script setup lang="ts">
/**
 * Messengers ride out (Esther 8,9-10). Under the painted map of the kingdom lies a rolled letter and the king's signet ring. First the letter is sealed: the child drags the ring
 * onto the letter (or taps the ring and then the letter, or presses Enter). Then the messenger on his young mule waits in Susa: the child swipes him in the direction of the land
 * the letter goes to (or taps the land). The right land: he rides there, and the next letter comes. Another land: a cross and "This letter goes to …" (a mistake).
 * A land before the letter is sealed: a word, no mistake. Round 1: two letters (India and Kush, Esther 8,9), wide directions; round 2: four letters, the directions must be more exact.
 * On the keyboard: Enter seals; then left and right choose a land and Enter sends. After fifteen seconds without a move "Help me" shows what to do next.
 * With reduced motion the riders arrive at once. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/esterNeu.ts`; stars: `esterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { RIDERS_MIN_SWIPE, esterDist, esterStars, ridersAngle, ridersSend } from '@/utils/esterNeu'
import type { Pt, RiderLand, RidersGame } from '@/utils/esterNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: RidersGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.letters.length, 0))

const IDLE_SECONDS = 15
const RIDE_MS = 1300
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const index = ref(0)
const letter = computed(() => current.value.letters[Math.min(index.value, current.value.letters.length - 1)]!)
const letterLand = computed(() => props.game.lands.find((l) => l.id === letter.value.land)!)
const sealed = ref(false)
const ringInHand = ref(false)
/** Riders who have arrived (their land) and the one riding now. */
const arrived = ref<{ rider: string; land: string }[]>([])
const riding = ref<RiderLand | null>(null)
const cursor = ref(-1)
const helpStep = ref<'' | 'seal' | 'send'>('')
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const ringDrag = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const busy = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const map = ref<HTMLElement | null>(null)
const tray = ref<HTMLElement | null>(null)
const letterEl = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => esterStars(mistakes.value))
const sentCount = computed(() => index.value + (riding.value || between.value ? 1 : 0))

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
  if (!between.value && !finished.value && !busy.value && !helpStep.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

// ---- sealing
function stamp() {
  if (sealed.value || busy.value || between.value || finished.value) return
  sealed.value = true
  ringInHand.value = false
  ringDrag.value = null
  helpStep.value = ''
  idle.value = 0
  play('snap')
  say(t('app.adventure.ridersSealed', { land: letterLand.value.name }), 3200)
}
function tapRing() {
  if (sealed.value || busy.value) return
  idle.value = 0
  ringInHand.value = !ringInHand.value
  if (ringInHand.value) say(t('app.adventure.ridersRingTaken'), 2600)
}
function tapLetter() {
  if (sealed.value || busy.value) return
  idle.value = 0
  if (ringInHand.value) stamp()
  else say(t('app.adventure.ridersRingFirst'), 2600)
}
// dragging the ring onto the letter
function inBox(el: HTMLElement | null, e: { clientX: number; clientY: number }) {
  const r = el?.getBoundingClientRect()
  return !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
}
let ringFrom: Pt | null = null
let ringMoved = false
function trayPoint(e: { clientX: number; clientY: number }): Pt | null {
  const r = tray.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function ringMove(e: PointerEvent) {
  if (!ringFrom) return
  const p = trayPoint(e)
  if (!p) return
  if (Math.hypot(p.x - ringFrom.x, p.y - ringFrom.y) > 3) ringMoved = true
  if (ringMoved) ringDrag.value = p
}
function ringUp(e: PointerEvent) {
  const moved = ringMoved
  stopRing()
  if (!moved) {
    tapRing()
    return
  }
  ringDrag.value = null
  if (inBox(letterEl.value, e)) stamp()
  else say(t('app.adventure.ridersRingBack'), 2400)
}
function stopRing() {
  ringFrom = null
  ringMoved = false
  window.removeEventListener('pointermove', ringMove)
  window.removeEventListener('pointerup', ringUp)
  window.removeEventListener('pointercancel', stopRing)
}
function ringDown(e: PointerEvent) {
  if (e.button > 0 || sealed.value || busy.value || between.value) return
  e.preventDefault()
  e.stopPropagation()
  idle.value = 0
  ringFrom = trayPoint(e)
  ringMoved = false
  window.addEventListener('pointermove', ringMove)
  window.addEventListener('pointerup', ringUp)
  window.addEventListener('pointercancel', stopRing)
}

// ---- sending the rider
function send(angle: number) {
  if (busy.value || between.value || finished.value) return
  idle.value = 0
  if (!sealed.value) {
    say(t('app.adventure.ridersSealFirst'), 2800)
    return
  }
  const res = ridersSend(props.game, current.value, letter.value, angle)
  if (res.verdict === 'none') {
    say(t('app.adventure.ridersNone'), 2600)
    return
  }
  if (res.verdict === 'wrong') {
    mistakes.value++
    play('wrong')
    flash('bad', res.land!)
    say(t('app.adventure.ridersWrong', { land: letterLand.value.name, other: res.land!.name }), 3200)
    return
  }
  // he rides to his land
  helpStep.value = ''
  busy.value = true
  riding.value = res.land
  play('tap')
  progress.mark()
  later(() => {
    play('right')
    flash('good', res.land!)
    arrived.value = [...arrived.value, { rider: letter.value.rider, land: res.land!.id }]
    riding.value = null
    say(t('app.adventure.ridersArrived', { land: res.land!.name }), 2400)
    if (index.value >= current.value.letters.length - 1) endRound()
    else {
      index.value++
      sealed.value = false
      busy.value = false
      cursor.value = -1
    }
  }, reduced ? 50 : RIDE_MS)
}
const sendTo = (l: RiderLand) => send(ridersAngle(props.game, l))

function endRound() {
  between.value = true
  later(() => say(t('app.adventure.ridersRoundDone'), 0), 900)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 2600)
  later(() => {
    round.value++
    index.value = 0
    sealed.value = false
    arrived.value = []
    busy.value = false
    cursor.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 3800)
}

// a swipe on the map: its direction sends the rider; a short tap: the direction from Susa to the place
let mapFrom: Pt | null = null
function mapPoint(e: { clientX: number; clientY: number }): Pt | null {
  const r = map.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function mapUp(e: PointerEvent) {
  const from = mapFrom
  stopMap()
  const p = mapPoint(e)
  if (!from || !p) return
  if (esterDist(from, p, props.game.ratio) >= RIDERS_MIN_SWIPE) send((Math.atan2((p.y - from.y) / props.game.ratio, p.x - from.x) * 180) / Math.PI)
  else if (esterDist(props.game.susa, p, props.game.ratio) >= RIDERS_MIN_SWIPE) send(ridersAngle(props.game, p))
}
function stopMap() {
  mapFrom = null
  window.removeEventListener('pointerup', mapUp)
  window.removeEventListener('pointercancel', stopMap)
}
function mapDown(e: PointerEvent) {
  if (e.button > 0 || busy.value || between.value || finished.value) return
  e.preventDefault()
  map.value?.focus({ preventScroll: true })
  mapFrom = mapPoint(e)
  window.addEventListener('pointerup', mapUp)
  window.addEventListener('pointercancel', stopMap)
}
onBeforeUnmount(() => {
  stopMap()
  stopRing()
})

function onKey(e: KeyboardEvent) {
  if (busy.value || between.value || finished.value) return
  const lands = props.game.lands
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    if (!sealed.value) {
      say(t('app.adventure.ridersKeys'), 3600)
      return
    }
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    cursor.value = cursor.value < 0 ? (step > 0 ? 0 : lands.length - 1) : (cursor.value + step + lands.length) % lands.length
    say(lands[cursor.value]!.name, 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!sealed.value) stamp()
    else if (cursor.value >= 0) sendTo(lands[cursor.value]!)
    else say(t('app.adventure.ridersKeys'), 3600)
  }
}

/** The button for those who do not know what to do: the ring and the letter, or the land of the letter, are marked. */
function helpMe() {
  idle.value = 0
  if (!sealed.value) {
    helpStep.value = 'seal'
    ringInHand.value = true
    say(t('app.adventure.ridersHelpSeal'), 0)
  } else {
    helpStep.value = 'send'
    say(t('app.adventure.ridersHelpSend', { land: letterLand.value.name }), 0)
  }
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const riderStyle = (p: Pt, far = false) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${far ? props.game.riderW * 0.75 : props.game.riderW}%`, zIndex: z(p.y) })
const susaRider = computed(() => ({ x: props.game.susa.x, y: props.game.susa.y + 4 }))
const ridingFlip = computed(() => (riding.value && riding.value.x < props.game.susa.x ? -1 : 1))
const labelStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const sealStyle = computed(() => ({ left: `${props.game.sealAt.x * 100}%`, top: `${props.game.sealAt.y * 100}%`, width: `${props.game.sealW * 100}%` }))
const ringDragStyle = computed(() => (ringDrag.value ? { left: `${ringDrag.value.x}%`, top: `${ringDrag.value.y}%` } : {}))
const landOf = (id: string) => props.game.lands.find((l) => l.id === id)!
</script>

<template lang="pug">
  div(class="gb")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gb-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gb-hint") {{ current.hint }}
      div(
        ref="map"
        class="gb-map"
        :style="{ backgroundImage: `url(${src(game.map)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.ridersField')"
        @pointerdown="mapDown"
        @keydown="onKey"
      )
        span(class="gb-susa" :style="labelStyle(game.susa)") {{ game.susa.name }}
        //- the lands: their names are buttons (a tap sends the rider there)
        button(
          v-for="(l, k) in game.lands"
          :key="`l-${l.id}`"
          type="button"
          class="gb-land"
          :class="{ cursor: cursor === k, help: helpStep === 'send' && l.id === letter.land }"
          :data-land="l.id"
          :style="labelStyle(l)"
          tabindex="-1"
          @pointerdown.stop
          @click="sendTo(l)"
        ) {{ l.name }}
        //- riders who have arrived wait small at their land
        div(v-for="(a, k) in arrived" :key="`a-${round}-${k}`" class="gb-rider far" :style="riderStyle({ x: landOf(a.land).x, y: landOf(a.land).y + 9 }, true)" aria-hidden="true")
          span(class="gb-flip" :style="{ transform: `scaleX(${landOf(a.land).x < game.susa.x ? -1 : 1})` }")
            GameImage(:src="a.rider" :ratio="1" colour="#8a6a42" label="bote")
        div(
          v-if="!between"
          :key="`r-${round}-${index}`"
          class="gb-rider"
          :class="{ ride: !!riding, waiting: sealed && !riding }"
          :style="riderStyle(riding ? { x: riding.x, y: riding.y + 9 } : susaRider)"
          role="img"
          :aria-label="t('app.adventure.ridersRider', { land: letterLand.name })"
          data-rider
        )
          span(class="gb-flip" :style="{ transform: `scaleX(${ridingFlip})` }")
            GameImage(:src="letter.rider" :ratio="1" colour="#8a6a42" label="bote")
        span(v-if="crossAt" class="gb-mark" :style="labelStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gb-mark" :style="labelStyle(tickAt)")
          GameMark(kind="good")
      //- the table: the letter of this rider and the king's ring
      div(ref="tray" class="gb-tray" :aria-label="t('app.adventure.ridersTray')" role="group")
        button(
          ref="letterEl"
          type="button"
          class="gb-letter"
          :class="{ help: helpStep === 'seal', sealed }"
          :style="{ aspectRatio: String(game.letterAspect) }"
          data-letter
          :aria-label="t(sealed ? 'app.adventure.ridersLetterSealed' : 'app.adventure.ridersLetter', { land: letterLand.name })"
          @click="tapLetter"
        )
          GameImage(:src="game.letter" :ratio="game.letterAspect" colour="#e8d9b0" label="brief")
          span(v-if="sealed" class="gb-seal" :style="sealStyle")
            GameImage(:src="game.seal" :ratio="1" colour="#a8322a" label="siegel")
        span(class="gb-to") {{ t('app.adventure.ridersTo', { land: letterLand.name }) }}
        button(
          v-if="!sealed"
          type="button"
          class="gb-ring"
          :class="{ held: ringInHand, help: helpStep === 'seal', dragging: !!ringDrag }"
          data-ring
          :aria-label="t('app.adventure.ridersRing')"
          :aria-pressed="ringInHand"
          @pointerdown="ringDown"
          @keydown.enter.prevent="tapRing"
        )
          GameImage(:src="game.ring" :ratio="1" colour="#d4a83e" label="ring")
        span(v-if="ringDrag" class="gb-ringghost" :style="ringDragStyle" aria-hidden="true")
          GameImage(:src="game.ring" :ratio="1" colour="#d4a83e" label="ring")
      p(class="gb-count" aria-live="polite") {{ t('app.adventure.ridersCount', { n: Math.min(sentCount, current.letters.length), total: current.letters.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !busy && !helpStep" tone="gold" @click="helpMe") {{ t('app.adventure.ridersHelp') }}
      p(class="gb-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.ridersDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gb
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

.gb-round
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

.gb-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gb-map
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9c79a
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the names on the map (words, not painted): Susa and the lands (buttons, at least 44 pixels)
.gb-susa, .gb-land
  position: absolute
  transform: translate(-50%, -50%)
  padding: 2px 10px
  border-radius: 999px
  font-weight: 800
  font-size: 1rem
  line-height: 1.2
  color: #3f321b
  background: rgba(255, 246, 220, 0.92)
  box-shadow: 0 2px 4px rgba(40, 25, 5, 0.35)
  white-space: nowrap
  z-index: 2000

.gb-susa
  pointer-events: none
  transform: translate(-50%, -150%)

.gb-land
  min-height: 44px
  min-width: 44px
  border: 3px solid #d4a83e
  cursor: pointer

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #3f321b
    border-style: dashed

// a rider: his feet (the mule's hooves) at the bottom middle of the picture
.gb-rider
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))

  &.ride
    transition: left 1300ms ease-in, top 1300ms ease-in, width 1300ms ease-in

  &.waiting
    animation: gb-ready 1200ms ease-in-out infinite

.gb-flip
  display: block

.gb-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

// the table under the map
.gb-tray
  position: relative
  display: flex
  align-items: center
  justify-content: center
  gap: 12px
  padding: 8px
  border-radius: 14px
  background: rgba(120, 86, 40, 0.18)

.gb-letter
  position: relative
  width: 46%
  max-width: 260px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 12px
  background: transparent
  cursor: pointer

  &.help
    border-color: #3f321b
    border-style: dashed

.gb-seal
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

.gb-to
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gb-ring
  width: 64px
  height: 64px
  padding: 4px
  border: 3px solid transparent
  border-radius: 50%
  background: rgba(255, 246, 220, 0.6)
  cursor: grab
  touch-action: none

  &.held
    border-color: #3f321b
    box-shadow: 0 0 0 3px rgba(255, 246, 220, 0.9)

  &.help
    border-style: dashed

  &.dragging
    opacity: 0.4

.gb-ringghost
  position: absolute
  width: 56px
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 10

.gb-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gb-fb
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

@keyframes gb-ready
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3px

// less motion: the riders are there at once, nobody bobs
@media (prefers-reduced-motion: reduce)
  .gb-rider.ride
    transition: none

  .gb-rider.waiting
    animation: none
</style>
