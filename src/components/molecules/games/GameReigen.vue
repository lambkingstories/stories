<script setup lang="ts">
/**
 * Hand in hand (Luke 15,24-25: "and they began to be merry ... he heard musick and dancing"). The festive courtyard in the evening, the dancers stand in it, a lyre player at the edge.
 * The child joins the dancers with golden bands, two hands for each dancer, until all of them are one ring; then the ring turns twice and notes rise. Joining: drag from one dancer to
 * another, or tap the first and then the second. Round 1: only the dancer who stands next to you may be joined; a hand across the ring springs back (cross, "Give your hand to the one
 * next to you.", a mistake). Round 2: any two dancers, but no band may cross another (a mistake), a third band on one dancer is refused softly ("He holds two hands already.", no mistake),
 * and a ring that would close before all are in springs open ("Some dancers are still missing.", a mistake). A tap on a band loosens it, "Start again" loosens all (never a mistake).
 * "Help me" after fifteen seconds lights the next two dancers to join (or the band in the way). Keyboard: Tab to a dancer and Enter to pick him, Tab to the next and Enter to join.
 * Less motion: the ring does not turn, nothing pulses. Nothing is shown by colour alone. Stars: `osterStars(mistakes)`.
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
import { offDist } from '@/utils/sohnNeuA'
import { DANCE_LOOPS, danceBandOf, danceConnect, danceDegree, danceDone, danceHelp, danceKey, danceRingAt, danceRingOrder, danceSpinMs } from '@/utils/sohnNeuB'
import type { DanceBand, DanceGame, DancePlace, DancerLook, Pt } from '@/utils/sohnNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: DanceGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK_MS = 50
const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const bands = ref<DanceBand[]>([])
const selected = ref<string | null>(null)
const drag = ref<{ from: string; at: Pt } | null>(null)
const mistakes = ref(0)
const message = ref('')
const idle = ref(0)
const helpJoin = ref<DanceBand | null>(null)
const helpRemove = ref<DanceBand | null>(null)
const spinning = ref(false)
const spinU = ref(0)
const ringIds = ref<string[]>([])
const between = ref(false)
const finished = ref(false)
const markAt = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

const lookOf = (id: string): DancerLook => props.game.dancers.find((d) => d.id === id)!
const placeOf = (id: string): DancePlace => current.value.places.find((p) => p.id === id)!
const busy = computed(() => spinning.value || between.value || finished.value)

/** Where a dancer is drawn: where he stands, or on the ring while it turns. */
function posOf(id: string): Pt {
  if (spinning.value && ringIds.value.length) {
    const pts = ringIds.value.map((x) => placeOf(x))
    const i = ringIds.value.indexOf(id)
    return danceRingAt(pts, i + spinU.value)
  }
  return placeOf(id)
}

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
  markAt.value = { ...at, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 900)
}
function clearHelp() {
  helpJoin.value = null
  helpRemove.value = null
}
const middle = (a: string, b: string): Pt => {
  const pa = placeOf(a)
  const pb = placeOf(b)
  return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
}

// idle time for "Help me"
function idleTick() {
  if (finished.value) return
  later(idleTick, 250)
  if (!busy.value) idle.value += 0.25
}
later(idleTick, 250)

/** The child joins two dancers (by dragging or by two taps). */
function connect(a: string, b: string) {
  if (busy.value) return
  idle.value = 0
  selected.value = null
  clearHelp()
  const v = danceConnect(current.value, bands.value, a, b, ratio.value)
  if (!v.ok) {
    if (v.why === 'same') return
    if (v.mistake) {
      mistakes.value++
      play('wrong')
      flash('bad', middle(a, b))
      say(t(v.why === 'far' ? 'app.adventure.danceFar' : v.why === 'cross' ? 'app.adventure.danceCross' : 'app.adventure.danceEarly'), 3000)
    } else {
      play('tap')
      say(t('app.adventure.danceFull', { name: lookOf(a).name }), 2400)
    }
    return
  }
  bands.value = [...bands.value, [a, b]]
  play('snap')
  flash('good', middle(a, b))
  say(t('app.adventure.danceJoined'), 1400)
  if (danceDone(current.value, bands.value)) complete()
}
/** A tap on a dancer: pick him, or join him with the one picked before. */
function pick(id: string) {
  if (busy.value) return
  idle.value = 0
  clearHelp()
  if (selected.value === null) {
    selected.value = id
    play('tap')
    say(t('app.adventure.dancePicked', { name: lookOf(id).name }), 0)
    return
  }
  if (selected.value === id) {
    selected.value = null
    message.value = ''
    return
  }
  connect(selected.value, id)
}
/** A tap on a band loosens it (free). */
function loosen(b: DanceBand) {
  if (busy.value) return
  idle.value = 0
  clearHelp()
  bands.value = bands.value.filter((x) => danceKey(x[0], x[1]) !== danceKey(b[0], b[1]))
  selected.value = null
  play('tap')
  say(t('app.adventure.danceLoosened'), 1600)
}
function startAgain() {
  if (busy.value || !bands.value.length) return
  idle.value = 0
  clearHelp()
  bands.value = []
  selected.value = null
  play('tap')
  say(t('app.adventure.danceAgain'), 1600)
}

function complete() {
  progress.mark()
  ringIds.value = danceRingOrder(current.value, bands.value)
  play('found')
  later(() => play('right'), 300)
  say(t('app.adventure.danceRoundDone'), 0)
  if (still) {
    between.value = true
    spinning.value = false
    later(endRound, 2200)
    return
  }
  spinning.value = true
  spinU.value = 0
  const total = current.value.places.length * DANCE_LOOPS
  const ms = danceSpinMs(props.game, current.value.places.length)
  const spin = () => {
    if (!spinning.value || finished.value) return
    spinU.value = Math.min(total, spinU.value + (total * TICK_MS) / ms)
    if (spinU.value >= total) {
      spinning.value = false
      between.value = true
      later(endRound, 700)
      return
    }
    later(spin, TICK_MS)
  }
  later(spin, TICK_MS)
}
function endRound() {
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 500)
    return
  }
  say(t('app.adventure.gameNext'), 0)
  later(() => {
    round.value++
    bands.value = []
    selected.value = null
    spinning.value = false
    ringIds.value = []
    between.value = false
    idle.value = 0
    clearHelp()
    message.value = ''
  }, 1800)
}

/** "Help me": the next two dancers light up, or the band that is in the way. */
function helpMe() {
  idle.value = 0
  if (busy.value) return
  selected.value = null
  const h = danceHelp(current.value, bands.value)
  if (!h) return
  if ('remove' in h) {
    helpRemove.value = h.remove
    helpJoin.value = null
    say(t('app.adventure.danceHelpUndo'), 5000)
  } else {
    helpJoin.value = h.join
    helpRemove.value = null
    say(t('app.adventure.danceHelpJoin', { a: lookOf(h.join[0]).name, b: lookOf(h.join[1]).name }), 5000)
  }
}

// ---- dragging from one dancer to another
function pointerPct(e: PointerEvent): Pt | null {
  const el = fieldEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
/** The dancer at a place of the picture (nearest within the reach of a hand and a half), or `null`. */
function dancerAt(p: Pt): string | null {
  let best: string | null = null
  let bestD = props.game.dancerW * 0.9
  for (const pl of current.value.places) {
    const d = offDist(p, pl, ratio.value)
    if (d <= bestD) {
      bestD = d
      best = pl.id
    }
  }
  return best
}
function onMove(e: PointerEvent) {
  const p = pointerPct(e)
  if (drag.value && p) drag.value = { from: drag.value.from, at: p }
}
function onUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onCancel)
  const d = drag.value
  drag.value = null
  if (!d) return
  const p = pointerPct(e)
  const to = p ? dancerAt(p) : null
  if (to && to !== d.from) connect(d.from, to)
}
function onCancel() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onCancel)
  drag.value = null
}
function startDrag(id: string, e: PointerEvent) {
  if (busy.value) return
  const p = pointerPct(e) ?? placeOf(id)
  drag.value = { from: id, at: p }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
}
onBeforeUnmount(onCancel)

// ---- the keyboard: the arrow keys move between the dancers, from left to right
function onFieldKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  const all = Array.from(box.querySelectorAll<HTMLElement>('button.gm-dancer')).sort((a, b) => Number(a.dataset.x) - Number(b.dataset.x))
  if (!all.length) return
  e.preventDefault()
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = all[(at < 0 ? 0 : at + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]
  next?.focus()
}

// ---- looks
const dancerStyle = (pl: DancePlace) => {
  const p = posOf(pl.id)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.dancerW}%`, aspectRatio: String(props.game.dancerRatio), zIndex: 100 + Math.round(p.y) }
}
const geom = (a: string, b: string) => danceBandOf({ handR: props.game.handR, ratio: ratio.value }, posOf(a), posOf(b))
const bandBox = (a: string, b: string) => {
  const g = geom(a, b)
  return { left: `${g.x}%`, top: `${g.y}%`, width: `${g.len}%`, transform: `rotate(${g.angle.toFixed(2)}deg)` }
}
const bandInner = (a: string, b: string) => ({ backgroundImage: `url(${src(props.game.band)})`, aspectRatio: String(Math.max(0.5, geom(a, b).len) / props.game.bandH) })
const pullStyle = computed(() => {
  const d = drag.value
  if (!d) return {}
  const g = danceBandOf({ handR: 0, ratio: ratio.value }, posOf(d.from), d.at)
  return { left: `${g.x}%`, top: `${g.y}%`, width: `${Math.max(0.5, g.len)}%`, transform: `rotate(${g.angle.toFixed(2)}deg)`, backgroundImage: `url(${src(props.game.band)})`, aspectRatio: String(Math.max(0.5, g.len) / props.game.bandH) }
})
const markStyle = computed(() => (markAt.value ? { left: `${markAt.value.x}%`, top: `${markAt.value.y}%` } : {}))
const lyreStyle = computed(() => ({ left: `${props.game.lyreAt.x}%`, top: `${props.game.lyreAt.y}%`, width: `${props.game.lyreAt.w}%` }))
// the notes rise in the free middle of the ring
const NOTE_AT = [{ x: 44, y: 64 }, { x: 50, y: 60 }, { x: 56, y: 64 }]
const noteStyle = (i: number) => ({ left: `${NOTE_AT[i % 3]!.x}%`, top: `${NOTE_AT[i % 3]!.y}%`, animationDelay: `${i * 450}ms` })
const bandKey = (b: DanceBand) => danceKey(b[0], b[1])
const isHelp = (id: string) => !!helpJoin.value && (helpJoin.value[0] === id || helpJoin.value[1] === id)
const countText = computed(() => t('app.adventure.danceCount', { n: bands.value.length, total: current.value.places.length }))
const bandLabel = (b: DanceBand) => t('app.adventure.danceBand', { a: lookOf(b[0]).name, b: lookOf(b[1]).name })
const dancerLabel = (id: string) => t('app.adventure.danceDancer', { name: lookOf(id).name, n: danceDegree(bands.value, id) })
</script>

<template lang="pug">
  div(class="gm" :class="{ still, spin: spinning }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ game.rounds[round]?.hint }}
      div(
        ref="fieldEl"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.danceField')"
        @keydown="onFieldKey"
      )
        span(class="gm-lyre" :style="lyreStyle" aria-hidden="true")
          GameImage(:src="game.lyre" :ratio="0.87" colour="#c9b48a" label="leier")
        button(
          v-for="b in bands"
          :key="`band-${round}-${bandKey(b)}`"
          type="button"
          class="gm-band"
          :class="{ help: !!helpRemove && bandKey(helpRemove) === bandKey(b) }"
          :data-band="bandKey(b)"
          :style="bandBox(b[0], b[1])"
          :disabled="busy"
          :aria-label="bandLabel(b)"
          @click="loosen(b)"
        )
          span(class="gm-band-img" :style="bandInner(b[0], b[1])")
        span(v-if="drag" class="gm-pull" :style="pullStyle" aria-hidden="true")
        button(
          v-for="pl in current.places"
          :key="`d-${round}-${pl.id}`"
          type="button"
          class="gm-dancer"
          :class="{ sel: selected === pl.id, help: isHelp(pl.id), full: danceDegree(bands, pl.id) >= 2 }"
          :data-dancer="pl.id"
          :data-x="pl.x"
          :style="dancerStyle(pl)"
          :disabled="busy"
          :aria-pressed="selected === pl.id"
          :aria-label="dancerLabel(pl.id)"
          @click="pick(pl.id)"
          @pointerdown="startDrag(pl.id, $event)"
        )
          GameImage(:src="lookOf(pl.id).image" :ratio="game.dancerRatio" colour="#c9b48a" :label="pl.id")
          span(v-if="selected === pl.id" class="gm-sel" aria-hidden="true") ✋
        template(v-if="spinning || (between && still)")
          span(v-for="(n, i) in game.notes" :key="`note-${i}`" class="gm-note" :style="noteStyle(i)" aria-hidden="true")
            GameImage(:src="n" :ratio="1" colour="#f2c46a" round label="note")
        span(v-if="markAt" class="gm-mark" :style="markStyle")
          GameMark(:kind="markAt.kind")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-buttons")
        AdvButton(v-if="idle > IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.danceHelp') }}
        AdvButton(tone="blau" :disabled="busy || !bands.length" @click="startAgain") {{ t('app.adventure.danceAgainButton') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.danceDone')" @next="emit('done', stars)")
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
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

.gm-lyre
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1

// a dancer: a button (at least 44 x 44 pixels) on the courtyard; the finger may start a drag on it
.gm-dancer
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 12px
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  touch-action: none

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.sel
    border-color: #fff6dc
    border-style: double
    border-width: 5px
    background: rgba(255, 246, 220, 0.3)

  &.help
    border-color: #2f6b8a
    border-style: dashed
    animation: gm-pulse 1200ms ease-in-out infinite

.gm-sel
  position: absolute
  top: -14px
  right: -10px
  width: 26px
  height: 26px
  border-radius: 50%
  background: #fff6dc
  font-size: 1rem
  line-height: 26px
  text-align: center

// a band: the button is 44 pixels high (the finger), the golden band lies in its middle
.gm-band
  position: absolute
  display: block
  box-sizing: border-box
  height: 44px
  margin: -22px 0 0
  padding: 0
  border: 0
  background: transparent
  transform-origin: 0 50%
  cursor: pointer
  z-index: 50

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 0

  &.help
    outline: 3px dashed #2f6b8a
    animation: gm-pulse 1200ms ease-in-out infinite

.gm-band-img
  position: absolute
  left: 0
  right: 0
  top: 50%
  display: block
  transform: translateY(-50%)
  background-repeat: repeat-x
  background-size: auto 100%
  background-position: left center
  pointer-events: none

.gm-pull
  position: absolute
  display: block
  margin: 0
  transform-origin: 0 50%
  background-repeat: repeat-x
  background-size: auto 100%
  opacity: 0.6
  pointer-events: none
  z-index: 60

.gm-note
  position: absolute
  display: block
  width: 7%
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 300
  animation: gm-rise 3200ms ease-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 400

.gm-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

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

@keyframes gm-pulse
  0%, 100%
    opacity: 0.7
  50%
    opacity: 1

@keyframes gm-rise
  0%
    opacity: 0
    margin-top: 10px
  30%
    opacity: 1
  100%
    opacity: 0
    margin-top: -60px

@media (prefers-reduced-motion: reduce)
  .gm-dancer.help, .gm-band.help
    animation: none

  .gm-note
    animation: none
</style>
