<script setup lang="ts">
/**
 * "The treasury" (1 Kings 10,2.10). The queen of Sheba comes with camels that carry spices, gold and precious stones, and gives them to king Solomon. A camel stands in the storeroom
 * with its gifts on its carrying board; on the wall are compartments, each with a hollow of one shape (a sack, a bar, a cut stone). The child drags a gift into the compartment with the same shape
 * (or taps the gift and then the compartment; with the keys: Tab or the arrow keys to a gift, Enter, then to a compartment, Enter). A wrong shape is a mistake (a cross, "That does not fit"; the gift goes back),
 * letting go beside the compartments is not. When the camel is empty it walks away and the next one comes. Round 2 has two camels and six compartments.
 * The button "Help me" comes after fifteen seconds and shows a gift and its compartment. The arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
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
import { treasureCount, treasureDrop, treasureHint, treasureSlotAt } from '@/utils/salomoNeu'
import type { SalPt, TreasureShape, TreasuryGame } from '@/utils/salomoNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TreasuryGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + treasureCount(r), 0))

const IDLE_SECONDS = 15
const TAP_MOVE = 2.5

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const camel = ref(0)
const loads = computed<TreasureShape[]>(() => current.value.camels[Math.min(camel.value, current.value.camels.length - 1)] ?? [])
const taken = ref<boolean[]>(loads.value.map(() => false))
const filled = ref<(TreasureShape | null)[]>(current.value.slots.map(() => null))
const away = ref(false)
const drag = ref<{ j: number; at: SalPt; from: SalPt; moved: boolean } | null>(null)
const selected = ref(-1)
const marks = ref<Record<number, 'good' | 'bad'>>({})
const hintSlot = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
const markSeq: Record<number, number> = {}
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function tickIdle() {
  if (!finished.value && !between.value && !drag.value) idle.value += 0.25
  later(tickIdle, 250)
}
later(tickIdle, 250)

function mark(slot: number, kind: 'good' | 'bad') {
  const id = (markSeq[slot] = (markSeq[slot] ?? 0) + 1)
  marks.value = { ...marks.value, [slot]: kind }
  later(() => {
    if (markSeq[slot] === id) {
      const m = { ...marks.value }
      delete m[slot]
      marks.value = m
    }
  }, 1100)
}

const shapeName = (s: TreasureShape) => props.game.items[s].label

/** A gift `j` of the camel let go on compartment `slot` (or none). */
function drop(j: number, slot: number | null) {
  if (between.value || away.value || taken.value[j]) return
  const shape = loads.value[j]!
  const v = treasureDrop(current.value, filled.value.map((f) => f !== null), shape, slot)
  if (v === 'none' || v === 'full') {
    if (v === 'full') say(t('app.adventure.treasuryFull'))
    return
  }
  idle.value = 0
  if (v === 'wrong-shape') {
    mistakes.value++
    play('wrong')
    mark(slot!, 'bad')
    say(t('app.adventure.treasuryWrong', { thing: shapeName(shape) }))
    return
  }
  filled.value = filled.value.map((f, k) => (k === slot ? shape : f))
  taken.value = taken.value.map((x, k) => x || k === j)
  selected.value = -1
  hintSlot.value = -1
  progress.mark()
  play('right')
  mark(slot!, 'good')
  say(t('app.adventure.treasuryStored', { thing: shapeName(shape) }), 1800)
  if (taken.value.every(Boolean)) camelEmpty()
}

function camelEmpty() {
  if (camel.value < current.value.camels.length - 1) {
    away.value = true
    say(t('app.adventure.treasuryNextCamel'), 0)
    later(() => {
      camel.value++
      taken.value = loads.value.map(() => false)
      away.value = false
      message.value = ''
    }, 1800)
    return
  }
  between.value = true
  later(() => play('bead'), 160)
  say(t('app.adventure.treasuryRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    camel.value = 0
    taken.value = loads.value.map(() => false)
    filled.value = current.value.slots.map(() => null)
    selected.value = -1
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

// ---- pointer: drag a gift, or tap it and then a compartment
function pointAt(e: PointerEvent): SalPt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function grab(j: number, e: PointerEvent) {
  if (e.button > 0 || between.value || away.value || taken.value[j]) return
  e.preventDefault()
  const p = pointAt(e)
  if (!p) return
  ;(e.target as Element | null)?.setPointerCapture?.(e.pointerId)
  idle.value = 0
  drag.value = { j, at: p, from: p, moved: false }
}
function move(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  const p = pointAt(e)
  if (!p) return
  const moved = d.moved || Math.hypot(p.x - d.from.x, (p.y - d.from.y) / ratio.value) > TAP_MOVE
  drag.value = { ...d, at: p, moved }
}
function release() {
  const d = drag.value
  drag.value = null
  if (!d) return
  if (!d.moved) {
    // a tap: the gift is chosen; the next tap on a compartment puts it there
    selected.value = selected.value === d.j ? -1 : d.j
    if (selected.value >= 0) say(t('app.adventure.treasuryChosen', { thing: shapeName(loads.value[d.j]!) }), 2400)
    return
  }
  drop(d.j, treasureSlotAt(props.game, current.value, d.at))
}
function tapSlot(slot: number) {
  if (selected.value < 0) {
    say(t('app.adventure.treasuryChooseFirst'), 2200)
    return
  }
  drop(selected.value, slot)
}

/** The arrow keys go from button to button inside the storeroom (the gifts first, then the compartments). */
async function onKey(e: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const list = [...(field.value?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])]
  if (!list.length) return
  e.preventDefault()
  const i = list.indexOf(document.activeElement as HTMLElement)
  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  await nextTick()
  list[(i + d + list.length) % list.length]?.focus()
}
function onGiftKey(j: number, e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  if (taken.value[j] || away.value || between.value) return
  selected.value = selected.value === j ? -1 : j
  if (selected.value >= 0) say(t('app.adventure.treasuryChosen', { thing: shapeName(loads.value[j]!) }), 2400)
}

function helpMe() {
  idle.value = 0
  const j = taken.value.findIndex((x) => !x)
  if (j < 0) return
  selected.value = j
  hintSlot.value = treasureHint(current.value, filled.value.map((f) => f !== null), loads.value[j]!) ?? -1
  say(t('app.adventure.treasuryHelping', { thing: shapeName(loads.value[j]!) }), 3600)
}

// ---- looks
const g = computed(() => props.game)
const camelStyle = computed(() => ({ left: `${away.value ? -30 : g.value.camel.x}%`, top: `${g.value.camel.y}%`, width: `${g.value.camel.w}%` }))
const giftStyle = (j: number) => {
  const d = drag.value
  const p = d && d.j === j ? d.at : g.value.board[j]!
  return { left: `${away.value ? p.x - g.value.camel.x - 30 : p.x}%`, top: `${p.y}%`, width: `${g.value.items[loads.value[j]!].w}%`, zIndex: d && d.j === j ? 20 : 8 }
}
const slotStyle = (k: number) => {
  const s = current.value.slots[k]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${g.value.niches[s.shape].w}%` }
}
const filledImage = (k: number) => {
  const f = filled.value[k]
  return f ? props.game.items[f].image : ''
}
const left = computed(() => current.value.slots.length - filled.value.filter(Boolean).length)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.treasuryField')"
        @pointermove="move"
        @pointerup="release"
        @pointercancel="release"
        @keydown="onKey"
        @contextmenu.prevent
      )
        button(
          v-for="(s, k) in current.slots"
          :key="`s-${round}-${k}`"
          type="button"
          class="gm-slot"
          :class="{ hinted: hintSlot === k, full: !!filled[k] }"
          :style="slotStyle(k)"
          :aria-label="filled[k] ? t('app.adventure.treasurySlotFull', { thing: shapeName(s.shape) }) : t('app.adventure.treasurySlot', { thing: shapeName(s.shape) })"
          @click="tapSlot(k)"
        )
          GameImage(:src="game.niches[s.shape].image" :ratio="1" colour="#7a4a2a" :label="game.niches[s.shape].label")
          span(v-if="filled[k]" class="gm-in")
            GameImage(:src="filledImage(k)" :ratio="1" colour="#b8892a")
          span(v-if="marks[k]" class="gm-mark")
            GameMark(:kind="marks[k] ?? 'good'")
        div(class="gm-camel" :class="{ away }" :style="camelStyle" role="img" :aria-label="game.camel.label")
          GameImage(:src="game.camel.image" :ratio="1" colour="#c8a26a" :label="game.camel.label")
        template(v-for="(shape, j) in loads" :key="`g-${round}-${camel}-${j}`")
          button(
            v-if="!taken[j]"
            type="button"
            class="gm-gift"
            :class="{ sel: selected === j, dragging: drag && drag.j === j, away }"
            :style="giftStyle(j)"
            :aria-label="shapeName(shape)"
            :aria-pressed="selected === j"
            @pointerdown="grab(j, $event)"
            @keydown="onGiftKey(j, $event)"
          )
            GameImage(:src="game.items[shape].image" :ratio="1" colour="#b8892a" :label="shapeName(shape)")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.treasuryCount', { n: left }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !away" tone="gold" @click="helpMe") {{ t('app.adventure.treasuryHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.treasuryDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c8a8
  background-size: 100% 100%
  touch-action: none
  -webkit-touch-callout: none

.gm-slot, .gm-gift
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: none
  transform: translate(-50%, -50%)
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 8px

.gm-slot
  filter: drop-shadow(0 3px 3px rgba(50, 30, 10, 0.35))

  &.hinted
    outline: 4px solid #ffd76a
    outline-offset: 2px
    border-radius: 8px
    animation: gm-pulse 900ms ease-in-out infinite

  &.full
    cursor: default

.gm-in
  position: absolute
  left: 18%
  top: 18%
  width: 64%
  pointer-events: none

.gm-camel
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: left 1400ms ease-in-out
  filter: drop-shadow(0 4px 4px rgba(50, 35, 10, 0.35))

.gm-gift
  touch-action: none
  transition: left 1400ms ease-in-out
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))

  &.dragging
    transition: none
    cursor: grabbing
    scale: 1.1

  &.sel
    outline: 4px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

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

@keyframes gm-pulse
  0%, 100%
    outline-color: #ffd76a
  50%
    outline-color: #fff6dc

@media (prefers-reduced-motion: reduce)
  .gm-camel, .gm-gift
    transition: none
  .gm-slot.hinted
    animation: none
</style>
