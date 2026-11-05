<script setup lang="ts">
/**
 * Lay the table (Luke 24,29-30). The low table in Emmaus from above with three cushions; under it a strip with the things. The child drags a thing to its place (or taps it and then the place;
 * on the keyboard left/right choose a thing, up/down a place, Enter puts it down). Right: it stays there (a tick, a click). Wrong, or a place that has one of those already: it springs back
 * (a cross and a word, a mistake). Letting go beside the places is no mistake. Things of the same kind can change places (any cup at any cushion that still needs one).
 * Round 1: a cup and a bowl at each of the three places. Round 2: lamp and jug in the middle, the flat bread at the place of the guest, and two things that do not belong on the table (net, shepherd's staff) into the basket.
 * At the end the bread is broken: the whole loaf is replaced by two halves that move a little apart (Luke 24,30). Whoever does not go on gets "Help me" after fifteen seconds: one thing is put in its place.
 * Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/osternNeuB.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterStars } from '@/utils/osternGames'
import { TABLE_RATIO, tableDone, tableFits, tableHelp, tableSlotAt, tableSlotTotal, tableSpot } from '@/utils/osternNeuB'
import type { Pt, TableGame } from '@/utils/osternNeuB'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TableGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every thing of every round in its place
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.items.length, 0))

const IDLE_SECONDS = 15
const TAP_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** For each thing of the round the place it lies on (null: still in the strip). */
const placed = ref<(string | null)[]>(props.game.rounds[0]!.items.map(() => null))
/** The things that lie on the table (of this round and the rounds before). */
type Laid = { id: string; image: string; name: string; w: number; slot: string; at: Pt; bread: boolean }
const laid = ref<Laid[]>([])
const selected = ref(-1)
/** The place chosen with the keyboard. */
const cursor = ref(-1)
const drag = reactive({ item: -1, x: 0, y: 0, sx: 0, sy: 0, moved: 0, px: 0 })
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const bounce = ref(-1)
const broken = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.items.length, 0))
const laidCount = computed(() => laid.value.length)
const slotName = (i: number) => props.game.slots[i]?.name || t('app.adventure.tableSlot', { n: i + 1 })
const free = computed(() => current.value.items.map((_, i) => i).filter((i) => placed.value[i] === null))

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
  if (kind === 'good') {
    tickAt.value = at
    crossAt.value = null
  } else {
    crossAt.value = at
    tickAt.value = null
  }
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}

// the clock of "Help me"
function idleLoop() {
  if (!between.value && !finished.value && drag.item < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** Thing `item` is put on place `slot` (index): it stays, or it springs back with a cross. */
function put(item: number, slot: number, helped = false) {
  if (between.value || finished.value) return
  const it = current.value.items[item]
  const s = props.game.slots[slot]
  if (!it || !s || placed.value[item] !== null) return
  idle.value = 0
  selected.value = -1
  const verdict = tableFits(current.value, placed.value, item, s.id)
  if (verdict !== 'ok') {
    mistakes.value++
    play('wrong')
    flash('bad', { x: s.x, y: s.y })
    bounce.value = item
    later(() => {
      if (bounce.value === item) bounce.value = -1
    }, 600)
    say(t(verdict === 'full' ? 'app.adventure.tableFull' : 'app.adventure.tableWrong'))
    return
  }
  placed.value[item] = s.id
  const k = laid.value.filter((d) => d.slot === s.id).length
  const at = tableSpot(s, k, Math.max(k + 1, tableSlotTotal(props.game, s.id)))
  laid.value.push({ id: it.id, image: it.image, name: it.name, w: it.w, slot: s.id, at, bread: lastRound.value && it.id === props.game.bread.item })
  progress.mark()
  play('snap')
  flash('good', at)
  say(t(helped ? 'app.adventure.tableHelped' : 'app.adventure.tableRight'), 1800)
  if (tableDone(placed.value)) endRound()
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.tableRoundDone'), 0)
  if (lastRound.value) {
    // the bread is broken
    later(() => {
      broken.value = true
      play('flip')
      say(t('app.adventure.tableBreak'), 0)
    }, 1100)
    later(() => {
      play('star')
      finished.value = true
    }, 3600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    placed.value = current.value.items.map(() => null)
    selected.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2600)
}

// ---- the finger: drag a thing, or tap it and then a place
function percentAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (drag.item < 0) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  const i = drag.item
  drag.item = -1
  if (i < 0 || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    // a tap: the thing is picked up, a tap on a place puts it down
    pick(i)
    return
  }
  const p = percentAt(e)
  const slot = p ? tableSlotAt(props.game.slots, p) : -1
  if (slot < 0) {
    say(t('app.adventure.tableBack'))
    return
  }
  put(i, slot)
}
function down(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value || placed.value[i] !== null) return
  idle.value = 0
  drag.item = i
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  drag.px = field.value?.getBoundingClientRect().width ?? 300
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function pick(i: number) {
  if (between.value || finished.value || placed.value[i] !== null) return
  idle.value = 0
  selected.value = selected.value === i ? -1 : i
  if (selected.value >= 0) say(t('app.adventure.tablePicked', { thing: current.value.items[i]!.name }), 3200)
}
/** A button of the strip clicked from the keyboard (a click of the finger is handled by the pointer). */
function thingClick(e: MouseEvent, i: number) {
  if (e.detail === 0) pick(i)
}
function tapSlot(si: number) {
  if (between.value || finished.value) return
  if (selected.value < 0) {
    say(t('app.adventure.tablePickFirst'))
    return
  }
  put(selected.value, si)
}

function cycleThing(step: number) {
  const list = free.value
  if (!list.length) return
  const at = list.indexOf(selected.value)
  const next = at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length
  selected.value = list[next]!
}
function announce() {
  const thing = selected.value >= 0 ? current.value.items[selected.value]?.name : ''
  if (thing && cursor.value >= 0) say(t('app.adventure.tableChoice', { thing, place: slotName(cursor.value) }), 0)
  else if (thing) say(t('app.adventure.tablePicked', { thing }), 0)
}
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const n = props.game.slots.length
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    cycleThing(e.key === 'ArrowRight' ? 1 : -1)
    announce()
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const step = e.key === 'ArrowDown' ? 1 : -1
    cursor.value = cursor.value < 0 ? (step > 0 ? 0 : n - 1) : (cursor.value + step + n) % n
    announce()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    if (selected.value >= 0 && cursor.value >= 0) {
      put(selected.value, cursor.value)
      return
    }
    if (selected.value < 0) cycleThing(1)
    if (cursor.value < 0) cursor.value = 0
    if (selected.value >= 0) say(`${t('app.adventure.tableChoice', { thing: current.value.items[selected.value]!.name, place: slotName(cursor.value) })} ${t('app.adventure.tableKeys')}`, 0)
    return
  }
  if (e.key === 'Escape') {
    selected.value = -1
    cursor.value = -1
    message.value = ''
  }
}

/** The button for those who do not know where a thing goes: one thing is put in a right place. */
function helpMe() {
  const h = tableHelp(current.value, placed.value)
  if (!h) return
  const slot = props.game.slots.findIndex((s) => s.id === h.slot)
  if (slot >= 0) put(h.item, slot, true)
}

// ---- looks
const ratio = String(TABLE_RATIO)
const spot = (p: Pt, w: number) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${w}%` })
const ghostStyle = computed(() => {
  const it = current.value.items[drag.item]
  return { left: `${drag.x}px`, top: `${drag.y}px`, width: `${Math.max(44, ((it?.w ?? 10) / 100) * drag.px)}px` }
})
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const slotStyle = (i: number) => {
  const s = props.game.slots[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.r * 2}%` }
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
        :class="{ broken }"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.tableField')"
        @keydown="onKey"
      )
        div(v-if="game.basket" class="gm-basket" :style="spot(game.basket, game.basket.w)" aria-hidden="true")
          GameImage(:src="game.basket.image" :ratio="1" colour="#a8814a" label="korb")
        //- the things that lie in place (the bread breaks at the end)
        template(v-for="(d, k) in laid" :key="`laid-${k}`")
          div(v-if="d.bread && broken" class="gm-laid gm-bread" :data-laid="d.id" :style="spot(d.at, d.w)" role="img" :aria-label="t('app.adventure.tableBread')")
            span(class="gm-half a" :style="{ width: '62%' }")
              GameImage(:src="game.bread.halves[0]" :ratio="1" colour="#d6b27a" label="brot-haelfte-1")
            span(class="gm-half b" :style="{ width: '62%' }")
              GameImage(:src="game.bread.halves[1]" :ratio="1" colour="#d6b27a" label="brot-haelfte-2")
          div(v-else class="gm-laid" :data-laid="d.id" :style="spot(d.at, d.w)" role="img" :aria-label="d.name")
            GameImage(:src="d.image" :ratio="1" colour="#c9b48a" :label="d.name")
        //- the places: buttons (shown as a ring while a thing is in the hand or chosen by the keyboard)
        button(
          v-for="(s, si) in game.slots"
          :key="`slot-${s.id}`"
          type="button"
          class="gm-slot"
          :class="{ armed: selected >= 0 || drag.item >= 0, cursor: cursor === si }"
          :data-slot="s.id"
          :style="slotStyle(si)"
          :aria-label="slotName(si)"
          tabindex="-1"
          @click="tapSlot(si)"
        )
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      //- the things that wait
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.tableTray')")
        template(v-for="(it, i) in current.items" :key="`item-${round}-${it.id}`")
          button(
            v-if="placed[i] === null"
            type="button"
            class="gm-thing"
            :class="{ sel: selected === i, held: drag.item === i && drag.moved >= 8, bounce: bounce === i }"
            :data-item="it.id"
            :aria-label="it.name"
            :aria-pressed="selected === i ? 'true' : 'false'"
            :disabled="between"
            @pointerdown.prevent="down($event, i)"
            @click="thingClick($event, i)"
          )
            GameImage(:src="it.image" :ratio="1" colour="#c9b48a" :label="it.name")
      //- the thing in the hand
      div(v-if="drag.item >= 0 && drag.moved >= 8" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="current.items[drag.item]?.image ?? ''" :ratio="1" colour="#c9b48a")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.tableCount', { n: laidCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.tableHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.tableDone')" @next="emit('done', stars)")
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
  color: #5f4f35

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
  background-color: #8a6a48
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-basket, .gm-laid
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

.gm-basket
  z-index: 1

.gm-laid
  z-index: 3

// the two halves of the bread: first together, then a little apart
.gm-bread
  aspect-ratio: 1 / 1

.gm-half
  position: absolute
  top: 50%
  left: 50%
  display: block
  transform: translate(-50%, -50%)
  animation-duration: 650ms
  animation-timing-function: ease-out
  animation-fill-mode: forwards

  &.a
    animation-name: gm-apart-a

  &.b
    animation-name: gm-apart-b

// a place: an invisible button of at least 44 pixels; while a thing is in the hand a dashed ring shows it
.gm-slot
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  z-index: 4

  &.armed
    border-color: rgba(255, 233, 150, 0.9)
    background: rgba(255, 233, 150, 0.12)

  &.cursor
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

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
  padding: 6px
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
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

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
  60%
    transform: translateY(2px)

@keyframes gm-apart-a
  from
    transform: translate(-50%, -50%)
  to
    transform: translate(-88%, -54%) rotate(-10deg)

@keyframes gm-apart-b
  from
    transform: translate(-50%, -50%)
  to
    transform: translate(-12%, -46%) rotate(10deg)

// less motion: the halves lie apart at once, nothing bounces
@media (prefers-reduced-motion: reduce)
  .gm-thing
    transition: none

    &.bounce
      animation: none

  .gm-half
    animation-duration: 1ms
</style>
