<script setup lang="ts">
/**
 * Earth for Naaman (2 Kings 5,17: "two mules' burden of earth"). Before Elisha's house stand two mules; on the road below wait sacks of earth, small, middle and big (1, 2 and 3 parts).
 * The child taps a sack and then a mule (or drags the sack onto the mule); the sack lies on the mule's back. Both mules shall carry the same, half of all the earth each:
 * a sack that would make a mule carry more than half does not go on ("Too heavy!", a cross, one mistake). A tap on a mule with no sack chosen takes its top sack down again
 * (no mistake), so a dead end can be undone. When all sacks are on, both carry the same: a tick. Round 1 six sacks, round 2 seven with more big ones.
 * Every sack shows its size as a number, every mule what it carries ("4 of 8"), so nothing depends on colour. The arrow keys go from button to button, Enter chooses.
 * Whoever does nothing for fifteen seconds gets "Help me". With reduced motion nothing glides or breathes. The arithmetic is `utils/elisaNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { ELISA_RATIO, earthDone, earthHintTop, earthLoads, earthPut, earthSlot, earthSlotX, earthStuck, earthTake, earthTarget, earthTop } from '@/utils/elisaNeu'
import type { EarthGame, EarthWhere } from '@/utils/elisaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: EarthGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every sack of every round
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.sacks.length, 0))

const IDLE_SECONDS = 15
const MULES = [0, 1] as const

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const on = ref<EarthWhere[]>(current.value.sacks.map(() => -1))
/** The sacks in the order they were loaded (the top sack of a mule is the last of its own). */
const order = ref<number[]>([])
/** The chosen sack on the road (-1: none). */
const chosen = ref(-1)
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
const mark = ref<'good' | 'bad' | null>(null)
/** The help: a sack and a mule that breathe. */
const hintSack = ref(-1)
const hintMule = ref(-1)
/** The sack that was too heavy (it shakes) and the mule it would not go on. */
const shake = ref(-1)
/** The best count of loaded sacks of this round (for "Go on": a sack counts once). */
let credited = 0
let messageSeq = 0
let hintSeq = 0
let shakeSeq = 0
const stars = computed(() => osterStars(mistakes.value))
const busy = computed(() => between.value || finished.value)
const target = computed(() => earthTarget(current.value))
const loads = computed(() => earthLoads(current.value, on.value))
const src = (p: string) => prependBaseUrl(p)

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

function clearHelp() {
  hintSack.value = -1
  hintMule.value = -1
}

const sizeWord = (i: number) => t(`app.adventure.earthLoadSize${current.value.sacks[i]}`)
const muleName = (m: number) => t(m === 0 ? 'app.adventure.earthLoadMule1' : 'app.adventure.earthLoadMule2')

/** A sack on the road is chosen (again: no longer chosen). */
function choose(i: number) {
  if (busy.value || on.value[i] !== -1) return
  if (suppressClick) return
  idle.value = 0
  clearHelp()
  chosen.value = chosen.value === i ? -1 : i
  if (chosen.value >= 0) {
    play('tap')
    say(t('app.adventure.earthLoadPick', { size: sizeWord(i) }), null, 3200)
  }
}

/** A mule is tapped: the chosen sack goes on, or (no sack chosen) its top sack comes down. */
function toMule(m: 0 | 1) {
  if (busy.value) return
  if (suppressClick) return
  idle.value = 0
  clearHelp()
  if (chosen.value < 0) {
    const top = earthTop(on.value, order.value, m)
    if (top < 0) {
      say(t('app.adventure.earthLoadPickFirst'), null, 3200)
      return
    }
    on.value = earthTake(current.value, on.value, top)
    order.value = order.value.filter((k) => k !== top)
    play('flip')
    say(t('app.adventure.earthLoadTaken', { mule: muleName(m) }))
    return
  }
  load(chosen.value, m)
}

function load(i: number, m: 0 | 1) {
  const res = earthPut(current.value, on.value, i, m)
  if (res.kind === 'heavy') {
    mistakes.value++
    play('wrong')
    shake.value = i
    const id = ++shakeSeq
    later(() => {
      if (shakeSeq === id) shake.value = -1
    }, 700)
    say(t('app.adventure.earthLoadHeavy', { mule: muleName(m) }), 'bad', 3800)
    return
  }
  if (res.kind !== 'loaded') return
  on.value = res.on
  order.value = [...order.value.filter((k) => k !== i), i]
  chosen.value = -1
  play('sack')
  const n = on.value.filter((w) => w >= 0).length
  while (credited < n) {
    credited++
    progress.mark()
  }
  if (earthDone(current.value, on.value)) {
    roundOver()
    return
  }
  if (earthStuck(current.value, on.value)) say(t('app.adventure.earthLoadStuck'), null, 5200)
  else say(t('app.adventure.earthLoadLoaded', { mule: muleName(m), n: loads.value[m], total: target.value }))
}

function roundOver() {
  between.value = true
  play('right')
  say(t('app.adventure.earthLoadRoundDone'), 'good', 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), null, 0), 1400)
  later(() => {
    round.value++
    on.value = current.value.sacks.map(() => -1)
    order.value = []
    chosen.value = -1
    credited = 0
    idle.value = 0
    clearHelp()
    message.value = ''
    mark.value = null
    between.value = false
  }, 2800)
}

/** "Help me": a sack and its mule, or the mule whose top sack should come down. */
function helpMe() {
  idle.value = 0
  const h = earthHintTop(current.value, on.value, order.value)
  if (!h) return
  const id = ++hintSeq
  later(() => {
    if (hintSeq === id) clearHelp()
  }, 6000)
  if (h.kind === 'put') {
    hintSack.value = h.sack
    hintMule.value = h.mule
    chosen.value = -1
    say(t('app.adventure.earthLoadHelpPut', { size: sizeWord(h.sack), mule: muleName(h.mule) }), null, 6000)
  } else {
    hintSack.value = -1
    hintMule.value = h.mule
    chosen.value = -1
    say(t('app.adventure.earthLoadHelpTake', { mule: muleName(h.mule) }), null, 6000)
  }
}

// ---- dragging a sack onto a mule
const field = ref<HTMLElement | null>(null)
const muleEls = ref<(HTMLElement | null)[]>([null, null])
function setMuleEl(m: number, el: unknown) {
  muleEls.value[m] = el instanceof HTMLElement ? el : null
}
const drag = ref<{ i: number; x: number; y: number } | null>(null)
let start: { i: number; x: number; y: number } | null = null
let suppressClick = false
function sackDown(e: PointerEvent, i: number) {
  if (e.button > 0 || busy.value || on.value[i] !== -1) return
  start = { i, x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', sackMove)
  window.addEventListener('pointerup', sackUp)
  window.addEventListener('pointercancel', sackCancel)
}
function sackMove(e: PointerEvent) {
  if (!start) return
  if (!drag.value && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 10) return
  const box = field.value?.getBoundingClientRect()
  if (!box || !box.width) return
  drag.value = { i: start.i, x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 }
}
function muleAt(x: number, y: number): 0 | 1 | -1 {
  for (const m of [0, 1] as const) {
    const r = muleEls.value[m]?.getBoundingClientRect()
    if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return m
  }
  return -1
}
function sackUp(e: PointerEvent) {
  const d = drag.value
  stopDrag()
  if (!d) return
  // a drag is not a tap: the click that follows it is ignored
  suppressClick = true
  later(() => (suppressClick = false), 60)
  idle.value = 0
  clearHelp()
  const m = muleAt(e.clientX, e.clientY)
  if (m >= 0) load(d.i, m as 0 | 1)
}
function sackCancel() {
  stopDrag()
}
function stopDrag() {
  start = null
  drag.value = null
  window.removeEventListener('pointermove', sackMove)
  window.removeEventListener('pointerup', sackUp)
  window.removeEventListener('pointercancel', sackCancel)
}
onBeforeUnmount(stopDrag)

// ---- arrow keys: from button to button in the field
function onKey(e: KeyboardEvent) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const list = Array.from(field.value?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])
  if (!list.length) return
  const k = list.indexOf(document.activeElement as HTMLElement)
  const next = list[(k < 0 ? 0 : k + dir + list.length) % list.length]
  nextTick(() => next?.focus({ preventScroll: true }))
}

// ---- looks
const muleH = computed(() => (props.game.mules[0].w / props.game.muleRatio) * ELISA_RATIO)
const muleStyle = (m: 0 | 1) => {
  const p = props.game.mules[m]
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` }
}
/** The sacks on a mule's back (in the order loaded), each with its place in the field. */
function loadOf(m: 0 | 1) {
  const g = props.game
  const p = g.mules[m]
  const left = p.x - p.w / 2
  const top = p.y - muleH.value / 2
  const bx = left + (g.back.x / 100) * p.w
  const by = top + (g.back.y / 100) * muleH.value
  const span = (g.back.w / 100) * p.w
  const list = order.value.filter((i) => on.value[i] === m)
  return list.map((i, k) => ({
    i,
    style: {
      left: `${bx - span / 2 + (span * (k + 0.5)) / list.length}%`,
      top: `${by}%`,
      width: `${g.sackW[current.value.sacks[i]! - 1]! * g.loadScale}%`,
      zIndex: String(3 + k)
    }
  }))
}
const slotStyle = (i: number) => ({ left: `${earthSlotX(current.value, i)}%`, top: `${props.game.sackY}%`, width: `${earthSlot(current.value)}%` })
const sackPicStyle = (i: number) => ({ width: `${(props.game.sackW[current.value.sacks[i]! - 1]! / earthSlot(current.value)) * 100}%` })
const dragStyle = computed(() => (drag.value ? { left: `${drag.value.x}%`, top: `${drag.value.y}%`, width: `${props.game.sackW[current.value.sacks[drag.value.i]! - 1]!}%` } : {}))
const sackPic = (i: number) => props.game.sacks[current.value.sacks[i]! - 1]!
const sackRatio = (i: number) => props.game.sackRatio[current.value.sacks[i]! - 1]!
function sackLabel(i: number): string {
  return t('app.adventure.earthLoadSack', { n: current.value.sacks[i], size: sizeWord(i) }) + (chosen.value === i ? ` (${t('app.adventure.earthLoadChosen')})` : '')
}
</script>

<template lang="pug">
  div(class="ne")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="ne-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="ne-hint") {{ current.hint }}
      div(
        ref="field"
        class="ne-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ELISA_RATIO) }"
        role="group"
        :aria-label="t('app.adventure.earthLoadField')"
        @keydown="onKey"
      )
        button(
          v-for="m in MULES"
          :key="`m-${m}`"
          :ref="(el) => setMuleEl(m, el)"
          type="button"
          class="ne-mule"
          :class="{ hinted: hintMule === m, ready: chosen >= 0 }"
          :data-mule="m"
          :style="muleStyle(m)"
          :aria-label="t('app.adventure.earthLoadMule', { mule: muleName(m), n: loads[m], total: target })"
          :disabled="busy"
          @click="toMule(m)"
        )
          GameImage(:src="game.mule[m]" :ratio="game.muleRatio" :colour="m === 0 ? '#9a6a3a' : '#8c8070'" :label="`maultier-${m + 1}`")
        template(v-for="m in MULES" :key="`l-${m}`")
          span(v-for="s in loadOf(m)" :key="`on-${s.i}`" class="ne-load" :style="s.style" aria-hidden="true")
            GameImage(:src="sackPic(s.i)" :ratio="sackRatio(s.i)" colour="#c8a46a" label="sack")
        template(v-for="(size, i) in current.sacks" :key="`s-${round}-${i}`")
          button(
            v-if="on[i] === -1"
            type="button"
            class="ne-sack"
            :class="{ chosen: chosen === i, hinted: hintSack === i, shake: shake === i, dragged: drag?.i === i }"
            :data-sack="i"
            :style="slotStyle(i)"
            :aria-label="sackLabel(i)"
            :aria-pressed="chosen === i ? 'true' : 'false'"
            :disabled="busy"
            @pointerdown="sackDown($event, i)"
            @click="choose(i)"
          )
            span(class="ne-pic" :style="sackPicStyle(i)")
              GameImage(:src="sackPic(i)" :ratio="sackRatio(i)" colour="#c8a46a" label="sack")
            span(class="ne-size" aria-hidden="true") {{ size }}
        span(v-if="drag" class="ne-drag" :style="dragStyle" aria-hidden="true")
          GameImage(:src="sackPic(drag.i)" :ratio="sackRatio(drag.i)" colour="#c8a46a" label="sack")
      div(class="ne-loads")
        p(v-for="m in MULES" :key="`c-${m}`" class="ne-count")
          GameMark(v-if="loads[m] === target" kind="good")
          span {{ t('app.adventure.earthLoadLoad', { mule: muleName(m), n: loads[m], total: target }) }}
      AdvButton(v-if="idle >= IDLE_SECONDS && !busy" tone="gold" small @click="helpMe") {{ t('app.adventure.earthLoadHelp') }}
      p(class="ne-fb" role="status")
        GameMark(v-if="mark && message" :kind="mark")
        span {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.earthLoadDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ne
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

.ne-round
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

.ne-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.ne-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9a066
  background-size: cover
  background-position: center
  touch-action: none

// a mule: a big button, placed by its middle
.ne-mule
  position: absolute
  display: block
  padding: 0
  border: 0
  background: none
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 2
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.ready
    filter: drop-shadow(0 0 6px rgba(255, 246, 220, 0.95))

  &.hinted::after
    content: ''
    position: absolute
    inset: -6px
    border: 3px dashed #fff6dc
    border-radius: 20px
    animation: ne-breathe 900ms ease-in-out infinite

// a sack on a mule's back: its feet stand on the blanket
.ne-load
  position: absolute
  display: block
  transform: translate(-50%, -88%)
  pointer-events: none
  filter: drop-shadow(0 2px 2px rgba(50, 30, 10, 0.4))

// a waiting sack: the whole slot is the button (at least 44 pixels), the picture stands at its bottom
.ne-sack
  position: absolute
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-end
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: none
  transform: translate(-50%, -100%)
  cursor: grab
  touch-action: none
  z-index: 4
  -webkit-tap-highlight-color: transparent

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 1px

  // the chosen sack is lifted and has a ring (and says so in its label)
  &.chosen .ne-pic
    translate: 0 -10%
    filter: drop-shadow(0 0 6px #fff6dc) drop-shadow(0 6px 4px rgba(50, 30, 10, 0.5))

  &.dragged .ne-pic
    opacity: 0.35

  &.shake .ne-pic
    animation: ne-shake 600ms ease-in-out

  &.hinted::after
    content: ''
    position: absolute
    inset: -4px
    border: 3px dashed #fff6dc
    border-radius: 14px
    animation: ne-breathe 900ms ease-in-out infinite

.ne-pic
  display: block
  transition: translate 200ms ease-out
  filter: drop-shadow(0 3px 2px rgba(50, 30, 10, 0.4))

// the size of the sack as a number (1, 2, 3)
.ne-size
  position: absolute
  left: 50%
  bottom: 30%
  transform: translateX(-50%)
  min-width: 22px
  padding: 0 5px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  border: 2px solid #8a5a12
  font-weight: 800
  font-size: 1rem
  line-height: 1.25
  color: #3f321b

.ne-drag
  position: absolute
  display: block
  transform: translate(-50%, -60%)
  pointer-events: none
  z-index: 20
  filter: drop-shadow(0 8px 6px rgba(50, 30, 10, 0.45))

.ne-loads
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 10px

.ne-count
  display: flex
  align-items: center
  gap: 6px
  margin: 0
  padding: 2px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.ne-fb
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

@keyframes ne-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -8deg
  75%
    rotate: 8deg

@keyframes ne-breathe
  0%, 100%
    scale: 1
  50%
    scale: 1.05

@media (prefers-reduced-motion: reduce)
  .ne-pic
    transition: none

  .ne-sack.shake .ne-pic
    animation: none

  .ne-mule.hinted::after, .ne-sack.hinted::after
    animation: none
</style>
