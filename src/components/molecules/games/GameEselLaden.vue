<script setup lang="ts">
/**
 * Load the donkey (1 Samuel 25,18). In Abigail's yard a donkey stands, seen from the front; on its back lies the pack saddle with a basket on each side. Below lie Abigail's gifts: bread,
 * a wine jar, raisin cakes and fig cakes, each with its weight in words (light, middle, heavy). The child takes a gift (tap, or drag it) and puts it into a basket (tap the basket, or let it go
 * there); a gift in a basket is tapped to take it out again. The saddle with the baskets leans to the heavier side and says so in words. Round 1: four gifts, only the end must be straight;
 * when everything is loaded and the load hangs crooked it is a mistake. Round 2: eight gifts, and the load may never lean more than two while loading: a gift that would make it lean more
 * slides back (a cross, a mistake), so the light gifts must go first. Keys: left/right choose a gift, Enter takes it, then left/right put it into the left or the right basket.
 * After fifteen seconds without a move "Help me" shows the next gift and its basket (or what must come out). With reduced motion nothing turns slowly or shakes. Nothing is shown by colour alone
 * (tick, cross, words). The arithmetic is `utils/davidNeu.ts`; stars: `davidNeuStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { davidNeuStars, donkeyAngle, donkeyDone, donkeyHelp, donkeyLean, donkeyLeft, donkeyMove, donkeyPut, donkeySlot, donkeyWeightWord } from '@/utils/davidNeu'
import type { DonkeyLoad, DonkeyLoadGame, DonkeySide, Pt } from '@/utils/davidNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: DonkeyLoadGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.goods.length, 0))

const IDLE_SECONDS = 15
const SIDES: DonkeySide[] = [0, 1]

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const load = ref<DonkeyLoad>([[], []])
/** The gift in the hand (index of the round's goods), or -1. */
const held = ref(-1)
/** The keyboard: the gift the cursor is on (index), and whether a gift was taken with Enter (then left/right choose the basket). */
const cursor = ref(-1)
const helpGood = ref(-1)
const helpSide = ref<DonkeySide | null>(null)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const slip = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
/** The gifts that have been in a basket once in this round (each counts once for "Go on"). */
const counted = new Set<number>()
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => davidNeuStars(mistakes.value))
const lean = computed(() => donkeyLean(props.game, current.value, load.value))
const angle = computed(() => donkeyAngle(lean.value))
const left = computed(() => donkeyLeft(current.value, load.value))
const loadedCount = computed(() => load.value[0].length + load.value[1].length)

const good = (i: number) => props.game.goods[current.value.goods[i]!]
const nameOf = (i: number) => good(i).name
const WEIGHT_KEY = { light: 'app.adventure.donkeyLoadLight', middle: 'app.adventure.donkeyLoadMiddle', heavy: 'app.adventure.donkeyLoadHeavy' } as const
const weightOf = (i: number) => t(WEIGHT_KEY[donkeyWeightWord(good(i).weight)])
const sideName = (side: DonkeySide) => t(side === 0 ? 'app.adventure.donkeyLoadLeft' : 'app.adventure.donkeyLoadRight')
const sideTo = (side: DonkeySide) => t(side === 0 ? 'app.adventure.donkeyLoadToLeft' : 'app.adventure.donkeyLoadToRight')
const leanText = computed(() => t(lean.value === 0 ? 'app.adventure.donkeyLoadStraight' : lean.value < 0 ? 'app.adventure.donkeyLoadLeansLeft' : 'app.adventure.donkeyLoadLeansRight'))

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
  if (!between.value && !finished.value && helpGood.value < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

// ---- the places (percent of the field)
const saddleH = computed(() => (props.game.saddlePos.w / props.game.saddleRatio) * props.game.ratio)
/** The open top of a basket on the field (the turn of the saddle is left out: it is small). */
function basketOnField(side: DonkeySide): Pt {
  const s = props.game.saddlePos
  const b = props.game.baskets[side]
  return { x: s.x - s.w / 2 + (b.x / 100) * s.w, y: s.y + (b.y / 100) * saddleH.value }
}

/** Take a gift from the strip into the hand (or put it back when it is in the hand already). */
function pick(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  if (held.value === i) {
    held.value = -1
    message.value = ''
    return
  }
  held.value = i
  say(t('app.adventure.donkeyLoadPicked', { name: nameOf(i) }), 0)
}

/** Put the gift in the hand into a basket. */
function put(side: DonkeySide, helped = false) {
  if (between.value || finished.value) return
  idle.value = 0
  const i = held.value
  if (i < 0) {
    say(t('app.adventure.donkeyLoadPickFirst'))
    return
  }
  const at = basketOnField(side)
  const verdict = donkeyPut(props.game, current.value, load.value, i, side)
  if (verdict === 'loaded') return
  if (verdict === 'full') {
    play('wrong')
    flash('bad', at)
    say(t('app.adventure.donkeyLoadFull'))
    return
  }
  if (verdict === 'lean') {
    // it slides back: the load leans too far for a moment
    mistakes.value++
    play('wrong')
    flash('bad', at)
    slip.value = side
    later(() => {
      if (slip.value === side) slip.value = -1
    }, 700)
    held.value = -1
    say(t('app.adventure.donkeyLoadLean'), 3600)
    return
  }
  load.value = donkeyMove(load.value, i, side)
  held.value = -1
  helpGood.value = -1
  helpSide.value = null
  if (!counted.has(i)) {
    counted.add(i)
    progress.mark()
  }
  play('sack')
  flash('good', at)
  say(t(helped ? 'app.adventure.donkeyLoadHelpedIn' : 'app.adventure.donkeyLoadIn', { name: nameOf(i), side: sideTo(side) }), 2000)
  check()
}

/** Take a gift out of its basket, back into the strip (no mistake). */
function takeOut(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  load.value = donkeyMove(load.value, i, null)
  held.value = -1
  helpGood.value = -1
  helpSide.value = null
  play('tap')
  say(t('app.adventure.donkeyLoadOut', { name: nameOf(i) }), 2000)
}

/** Everything loaded: straight is the end of the round, crooked is a mistake. */
function check() {
  if (left.value.length) return
  if (donkeyDone(props.game, current.value, load.value)) {
    endRound()
    return
  }
  mistakes.value++
  later(() => play('wrong'), 300)
  say(t('app.adventure.donkeyLoadUneven'), 4200)
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 600)
  later(() => say(t('app.adventure.donkeyLoadRoundDone'), 0), 900)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3400)
  later(() => {
    round.value++
    load.value = [[], []]
    counted.clear()
    held.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4600)
}

// ---- dragging a gift from the strip
const field = ref<HTMLElement | null>(null)
const drag = ref<{ i: number; x: number; y: number; moved: boolean; sx: number; sy: number } | null>(null)
/** After a drag the button may still get a click: it is ignored. */
let suppressClick = false
function onClickItem(i: number) {
  if (suppressClick) return
  pick(i)
}
function fieldPoint(e: PointerEvent | MouseEvent): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onDown(i: number, e: PointerEvent) {
  if (between.value || finished.value || e.button > 0) return
  drag.value = { i, x: -1, y: -1, moved: false, sx: e.clientX, sy: e.clientY }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
function onMove(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return
  d.moved = true
  const p = fieldPoint(e)
  if (p) {
    d.x = p.x
    d.y = p.y
  }
}
function onUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  const d = drag.value
  drag.value = null
  // a tap without moving is the click of the button (it takes the gift into the hand)
  if (!d || !d.moved) return
  suppressClick = true
  later(() => (suppressClick = false), 50)
  const p = fieldPoint(e)
  // let go near a basket: into it; anywhere else: back into the strip, no mistake
  const reach = props.game.saddlePos.w * 0.42
  const near = p ? ([0, 1] as DonkeySide[]).map((s) => ({ s, d: Math.hypot(p.x - basketOnField(s).x, (p.y - basketOnField(s).y) / props.game.ratio) })).sort((a, b) => a.d - b.d)[0] : null
  if (p && near && near.d <= reach) {
    held.value = d.i
    put(near.s)
  } else say(t('app.adventure.donkeyLoadBack'))
}

// ---- keys: left/right choose a gift, Enter takes it; with a gift in the hand left/right put it into a basket, Escape puts it back
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const list = left.value
  if (held.value >= 0) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      put(e.key === 'ArrowLeft' ? 0 : 1)
      cursor.value = left.value[0] ?? -1
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      held.value = -1
      message.value = ''
      return
    }
    return
  }
  if (!list.length) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const at = list.indexOf(cursor.value)
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    cursor.value = list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]!
    say(`${nameOf(cursor.value)}, ${weightOf(cursor.value)}`, 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0 || !list.includes(cursor.value)) {
      cursor.value = list[0]!
      say(`${nameOf(cursor.value)}, ${weightOf(cursor.value)}. ${t('app.adventure.donkeyLoadKeys')}`, 0)
      return
    }
    held.value = cursor.value
    say(t('app.adventure.donkeyLoadChoose', { name: nameOf(cursor.value) }), 0)
  }
}

/** The button for those who are stuck: the next gift and its basket, or the gift that must come out first. */
function helpMe() {
  const h = donkeyHelp(props.game, current.value, load.value)
  if (!h) return
  idle.value = 0
  helpGood.value = h.i
  helpSide.value = h.side
  if (h.side === null) {
    say(t('app.adventure.donkeyLoadHelpOut', { name: nameOf(h.i) }), 0)
    later(() => {
      if (helpGood.value === h.i) takeOut(h.i)
    }, 1600)
    return
  }
  held.value = h.i
  say(t('app.adventure.donkeyLoadHelped', { name: nameOf(h.i), side: sideTo(h.side) }), 0)
  later(() => {
    if (helpGood.value === h.i && held.value === h.i) put(h.side!, true)
  }, 1600)
}

// ---- looks
const ratio = computed(() => String(props.game.ratio))
const figStyle = (p: { x: number; y: number; w: number }, z: number) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: z })
const saddleStyle = computed(() => {
  const s = props.game.saddlePos
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, transform: `translateX(-50%) rotate(${angle.value}deg)` }
})
function goodStyle(side: DonkeySide, k: number) {
  const p = donkeySlot(props.game, side, k)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.goodW}%`, zIndex: 10 + k }
}
function basketStyle(side: DonkeySide) {
  const b = props.game.baskets[side]
  return { left: `${b.x}%`, top: `${b.y}%` }
}
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const ghostStyle = computed(() => (drag.value && drag.value.moved && drag.value.x >= 0 ? { left: `${drag.value.x}%`, top: `${drag.value.y}%`, width: `${(props.game.goodW * props.game.saddlePos.w) / 100}%` } : null))
</script>

<template lang="pug">
  div(class="ge")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="ge-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="ge-hint") {{ current.hint }}
      div(
        ref="field"
        class="ge-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.donkeyLoadField')"
        @keydown="onKey"
      )
        div(v-if="game.abigail && game.abigailPos" class="ge-fig" :style="figStyle(game.abigailPos, 2)")
          GameImage(:src="game.abigail" :ratio="game.abigailRatio ?? 0.5" colour="#c9a77a" label="abigajil")
        div(v-if="game.donkey" class="ge-fig" :style="figStyle(game.donkeyPos, 3)")
          GameImage(:src="game.donkey" :ratio="game.donkeyRatio" colour="#9c8f80" label="esel")
        //- the pack saddle with the baskets and what lies in them: it turns about the middle of its top edge
        div(class="ge-saddle" :class="{ slipL: slip === 0, slipR: slip === 1 }" :style="saddleStyle" :data-angle="angle")
          GameImage(:src="game.saddle" :ratio="game.saddleRatio" colour="#b08a55" label="packsattel")
          button(
            v-for="side in SIDES"
            :key="`b-${side}`"
            type="button"
            class="ge-basket"
            :class="{ ready: held >= 0, help: helpSide === side && helpGood >= 0 }"
            :data-basket="side"
            :style="basketStyle(side)"
            :aria-label="t('app.adventure.donkeyLoadBasket', { side: sideName(side), n: load[side].length, places: current.places })"
            tabindex="-1"
            @click="put(side)"
          )
          template(v-for="side in SIDES" :key="`s-${side}`")
            button(
              v-for="(i, k) in load[side]"
              :key="`g-${round}-${i}`"
              type="button"
              class="ge-good in"
              :class="{ help: helpGood === i && helpSide === null }"
              :data-in="i"
              :data-side="side"
              :style="goodStyle(side, k)"
              :aria-label="t('app.adventure.donkeyLoadTakeOut', { name: nameOf(i) })"
              tabindex="-1"
              @click="takeOut(i)"
            )
              GameImage(:src="good(i).image" colour="#c9a77a" :label="current.goods[i]")
        div(v-if="ghostStyle" class="ge-ghost" :style="ghostStyle" aria-hidden="true")
          GameImage(v-if="drag" :src="good(drag.i).image" colour="#c9a77a")
        span(v-if="crossAt" class="ge-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="ge-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="ge-count" aria-live="polite") {{ t('app.adventure.donkeyLoadCount', { n: loadedCount, total: current.goods.length }) }} · {{ leanText }}
      div(class="ge-tray" role="group" :aria-label="t('app.adventure.donkeyLoadTray')")
        button(
          v-for="i in left"
          :key="`t-${round}-${i}`"
          type="button"
          class="ge-item"
          :class="{ held: held === i, cursor: cursor === i, help: helpGood === i && helpSide !== null }"
          :data-good="i"
          :data-kind="current.goods[i]"
          :aria-pressed="held === i"
          :aria-label="t('app.adventure.donkeyLoadGood', { name: nameOf(i), weight: weightOf(i) })"
          @pointerdown="onDown(i, $event)"
          @click="onClickItem(i)"
        )
          span(class="ge-pic")
            GameImage(:src="good(i).image" colour="#c9a77a" :label="current.goods[i]")
          span(class="ge-name") {{ nameOf(i) }}
          span(class="ge-weight") {{ weightOf(i) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpGood < 0" tone="gold" @click="helpMe") {{ t('app.adventure.donkeyLoadHelp') }}
      p(class="ge-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.donkeyLoadDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ge
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
  touch-action: none

.ge-round
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

.ge-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.ge-field
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

// a figure stands with its feet on its place
.ge-fig
  position: absolute
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.3))

// the saddle turns slowly about the middle of its top edge
.ge-saddle
  position: absolute
  z-index: 5
  transform-origin: 50% 0
  transition: transform 700ms cubic-bezier(0.3, 1.4, 0.5, 1)

  &.slipL
    animation: ge-slip-l 600ms ease-in-out
  &.slipR
    animation: ge-slip-r 600ms ease-in-out

// the tap area of a basket: round its open top, at least 44 pixels
.ge-basket
  position: absolute
  width: max(44px, 40%)
  height: max(44px, 62%)
  transform: translate(-50%, -30%)
  padding: 0
  border: 3px solid transparent
  border-radius: 18px
  background: transparent
  cursor: pointer
  z-index: 1

  &.ready
    border-color: rgba(255, 246, 220, 0.9)
    border-style: dashed

  &.help
    border-color: #fff6dc
    border-style: solid
    background: rgba(255, 246, 220, 0.2)

.ge-good
  position: absolute
  padding: 0
  border: 3px solid transparent
  border-radius: 10px
  background: transparent
  transform: translate(-50%, -78%)
  min-width: 44px
  min-height: 44px
  cursor: pointer

  &.help
    border-color: #fff6dc
    border-style: dashed

.ge-ghost
  position: absolute
  z-index: 50
  transform: translate(-50%, -60%)
  pointer-events: none
  opacity: 0.9

.ge-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 60

.ge-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c
  text-align: center

.ge-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

.ge-item
  display: flex
  flex-direction: column
  align-items: center
  width: 86px
  min-height: 44px
  padding: 4px 4px 6px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  color: #3f321b
  cursor: grab
  touch-action: none

  &.held
    border-color: #5a4a2c
    box-shadow: 0 0 0 3px rgba(255, 246, 220, 0.9)
    transform: translateY(-4px)

  &.cursor
    outline: 3px solid #5a4a2c
    outline-offset: 2px

  &.help
    border-style: dashed
    border-color: #5a4a2c

.ge-pic
  display: block
  width: 56px

.ge-name
  font-weight: 800
  font-size: 1rem
  line-height: 1.15
  text-align: center

.ge-weight
  font-size: 1rem
  font-weight: 700
  color: #6b5634

.ge-fb
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

@keyframes ge-slip-l
  0%, 100%
    translate: 0 0
  40%
    translate: -6px 0
@keyframes ge-slip-r
  0%, 100%
    translate: 0 0
  40%
    translate: 6px 0

// less motion: the saddle stands at its slant at once, nothing slips
@media (prefers-reduced-motion: reduce)
  .ge-saddle
    transition: none

    &.slipL, &.slipR
      animation: none
</style>
