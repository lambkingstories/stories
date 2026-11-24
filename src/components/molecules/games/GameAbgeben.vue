<script setup lang="ts">
/**
 * Whoever has two gives one away (Luke 3,11): at the Jordan people stand in a row, each with a mat in front of him; on the mats lie coats (round 1) or loaves (round 2), on some nothing. Whoever
 * has more than one passes ONE piece to his NEIGHBOUR (a rule of the game: only the neighbour, and there is exactly enough for everybody), until everybody has exactly one.
 * Drag a piece from one person to the neighbour, or tap the giver and then the neighbour. Right: the piece goes over, a soft tone ("That helps."), a tick over everybody who has exactly one.
 * Wrong: taking a piece from somebody who has only one (the mat wiggles, a cross, a low tone, "He has only one.", a mistake). A piece for somebody who is not a neighbour only says "Pass it to the
 * neighbor." (no mistake). "Help me" after fifteen seconds makes the next giver and his neighbour shine. Keyboard: Tab to a person, Enter takes him up, Tab to the neighbour and Enter gives;
 * or Left/Right arrow gives to the neighbour at once. Less motion: nothing wiggles, nothing pulses. Nothing is shown by colour alone.
 * Points (for "Go on"): everybody who starts with nothing counts once when he first gets a piece. Stars: `johannesStars(mistakes)`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { johannesStars } from '@/utils/johannesGames'
import { giveCan, giveDone, giveGoal, giveHint, giveMove, giveSlotAt, giveSlotX } from '@/utils/johannesNeu'
import type { GiveAwayGame } from '@/utils/johannesNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GiveAwayGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = giveGoal(props.game)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
const counts = ref<number[]>([...props.game.rounds[0]!.start])
/** The people who started with nothing and have got their first piece. */
const got = ref<number[]>([])
const selected = ref<number | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const wiggle = ref<number | null>(null)
const popped = ref<number | null>(null)
const picked = ref<{ slot: number; kind: 'good' | 'bad' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ from: number; x: number; y: number; moved: number }>({ from: -1, x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const n = computed(() => counts.value.length)
const stars = computed(() => johannesStars(mistakes.value))
const countText = computed(() => t('app.adventure.shareOneCount', { n: progress.parts.value, total }))
const help = computed(() => (helping.value && phase.value === 'play' ? giveHint(counts.value) : null))
const itemImage = computed(() => props.game.items[current.value.item])

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function mark(slot: number, kind: 'good' | 'bad') {
  const k = ++pickSeq
  picked.value = { slot, kind }
  later(() => {
    if (pickSeq === k) picked.value = null
  }, 1100)
}
function touched() {
  idle.value = 0
  helping.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

// ---- the moves
/** Person `from` gives one piece to person `to` (a neighbour). Right moves, a piece from somebody who has only one, and a person who is no neighbour are told apart here. */
function attempt(from: number, to: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (from === to) return
  if (Math.abs(from - to) !== 1 || to < 0 || to >= n.value) {
    say(t('app.adventure.shareOneNeighbour'), 3000)
    return
  }
  const have = counts.value[from] ?? 0
  if (have === 0) {
    selected.value = null
    say(t('app.adventure.shareOneNothing'), 3000)
    return
  }
  if (!giveCan(counts.value, from)) {
    selected.value = null
    mistakes.value++
    play('wrong')
    wiggle.value = from
    later(() => (wiggle.value = null), 600)
    mark(from, 'bad')
    say(t('app.adventure.shareOneOnlyOne'), 3600)
    return
  }
  const next = giveMove(counts.value, from, to > from ? 1 : -1)
  if (!next) return
  counts.value = next
  selected.value = null
  play('snap')
  popped.value = to
  later(() => (popped.value = null), 700)
  if (current.value.start[to] === 0 && !got.value.includes(to)) {
    got.value = [...got.value, to]
    progress.mark()
  }
  if ((next[to] ?? 0) === 1) mark(to, 'good')
  say(t('app.adventure.shareOneOk'), 2600)
  if (giveDone(next)) endRound()
}

function endRound() {
  phase.value = 'between'
  later(() => say(t('app.adventure.shareOneRoundDone'), 0), 900)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    counts.value = [...props.game.rounds[round.value]!.start]
    got.value = []
    selected.value = null
    phase.value = 'play'
    say('', 1)
  }, 2800)
}

/** A tap on a person (or Enter): take him up as the giver, or give to him. */
function slotTap(k: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (selected.value === null) {
    if ((counts.value[k] ?? 0) === 0) {
      say(t('app.adventure.shareOneNothing'), 3000)
      return
    }
    selected.value = k
    say(t('app.adventure.shareOnePick'), 0)
    return
  }
  if (selected.value === k) {
    selected.value = null
    say('', 1)
    return
  }
  attempt(selected.value, k)
}
function slotClick(e: MouseEvent, k: number) {
  if (e.detail !== 0) return // a click that comes from a finger or the mouse is handled by the pointer events
  slotTap(k)
}
function arrow(k: number, dir: -1 | 1) {
  if (phase.value !== 'play') return
  attempt(k, k + dir)
}

// ---- the pointer: drag a piece to the neighbour (or tap the giver and then the neighbour)
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, k: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const p = toPercent(e)
  drag.from = k
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (drag.from < 0) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (drag.from < 0) return
  const from = drag.from
  const moved = drag.moved
  drag.from = -1
  if (moved < 8) {
    slotTap(from)
    return
  }
  const p = toPercent(e)
  if (!p || p.y < 0 || p.y > 100) return
  const to = giveSlotAt(n.value, p.x)
  if (to >= 0 && to !== from) attempt(from, to)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.shareOneHelpGo'), 4200)
}

// ---- looks
const L = computed(() => props.game.layout)
const personH = computed(() => (L.value.personW * ratio.value) / props.game.personRatio)
const matH = computed(() => (L.value.matW * ratio.value) / props.game.matRatio)
const pieceH = computed(() => (L.value.pieceW * ratio.value) / props.game.itemRatio[current.value.item])
const slotBox = (k: number) => {
  const x = giveSlotX(n.value, k)
  const top = L.value.feetY - personH.value
  const bottom = L.value.matY + matH.value / 2
  return { left: `${x - 50 / n.value}%`, top: `${top}%`, width: `${100 / n.value}%`, height: `${bottom - top}%` }
}
const personStyle = (k: number) => ({ left: `${giveSlotX(n.value, k) - L.value.personW / 2}%`, top: `${L.value.feetY - personH.value}%`, width: `${L.value.personW}%` })
const matStyle = (k: number) => ({ left: `${giveSlotX(n.value, k) - L.value.matW / 2}%`, top: `${L.value.matY - matH.value / 2}%`, width: `${L.value.matW}%` })
/** The pieces on a mat: one or two side by side, more of them in rows of two, the later rows a little higher (a stack of four stays inside the width of its slot). */
function pieceStyle(k: number, i: number, c: number) {
  const w = L.value.pieceW
  const cols = c <= 2 ? c : 2
  const row = Math.floor(i / cols)
  const lastAlone = c > 2 && c % 2 === 1 && i === c - 1
  const col = lastAlone ? 0.5 : i % cols
  const x = giveSlotX(n.value, k) + (col - (cols - 1) / 2) * w * 0.62
  return { left: `${x - w / 2}%`, top: `${L.value.pieceY - pieceH.value / 2 - row * pieceH.value * 0.5}%`, width: `${w}%` }
}
const tickStyle = (k: number) => ({ left: `${giveSlotX(n.value, k) - 2.5}%`, top: `${L.value.feetY - personH.value - 9}%` })
const ghostImage = computed(() => (drag.from >= 0 ? src(itemImage.value) : ''))
const label = (k: number) => t('app.adventure.shareOneHas', { who: props.game.persons[k]?.label ?? '', n: counts.value[k] ?? 0 })
const shines = (k: number) => !!help.value && (help.value.from === k || help.value.to === k)
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.shareOneField')"
        )
          template(v-for="(c, k) in counts" :key="k")
            span(class="gm-person" :style="personStyle(k)" aria-hidden="true")
              GameImage(:src="game.persons[k]?.image ?? ''" :ratio="game.personRatio" colour="#8aa0b8" :label="`person-${k + 1}`")
            span(class="gm-mat" :style="matStyle(k)" aria-hidden="true")
              GameImage(:src="game.mat" :ratio="game.matRatio" colour="#c9a86a" label="matte")
            span(
              v-for="i in c"
              :key="`p${k}-${i}`"
              class="gm-piece"
              :class="{ pop: popped === k && i === c }"
              :style="pieceStyle(k, i - 1, c)"
              :data-piece="k"
              aria-hidden="true"
            )
              GameImage(:src="itemImage" :ratio="game.itemRatio[current.item]" colour="#d9b86a" :label="current.item")
            span(v-if="c === 1" class="gm-tick" :style="tickStyle(k)" aria-hidden="true")
              GameMark(kind="good")
            span(v-if="picked && picked.slot === k && picked.kind === 'bad'" class="gm-tick" :style="tickStyle(k)" aria-hidden="true")
              GameMark(kind="bad")
          button(
            v-for="(c, k) in counts"
            :key="`s${k}`"
            type="button"
            class="gm-slot"
            :class="{ sel: selected === k, wiggle: wiggle === k, shine: shines(k) }"
            :data-slot="k"
            :style="slotBox(k)"
            :aria-label="label(k)"
            :aria-pressed="selected === k"
            @pointerdown.prevent="down($event, k)"
            @click="slotClick($event, k)"
            @keydown.left.prevent="arrow(k, -1)"
            @keydown.right.prevent="arrow(k, 1)"
          )
          img(v-if="drag.from >= 0 && drag.moved >= 8" class="gm-ghost" :src="ghostImage" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%` }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.shareOneHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shareOneDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcb8
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

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

.gm-wrap
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  touch-action: none

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b89a68
  background-size: cover
  background-position: center

.gm-person, .gm-mat, .gm-piece, .gm-tick
  position: absolute
  display: block
  pointer-events: none

.gm-piece
  transition: transform 300ms ease

  &.pop
    animation: gm-pop 500ms ease

.gm-tick
  width: 5%
  min-width: 26px

.gm-slot
  position: absolute
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  touch-action: none

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.sel
    border-color: #2f7bd6
    background: rgba(47, 123, 214, 0.15)

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.3)

  &.wiggle
    animation: gm-wiggle 500ms ease

.gm-ghost
  position: absolute
  display: block
  width: 12%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 9999
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

  &:empty
    display: none

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

.still
  .gm-piece
    transition: none

  .gm-piece.pop, .gm-slot.shine, .gm-slot.wiggle
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-wiggle
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-4px)
  75%
    transform: translateX(4px)

@keyframes gm-pop
  0%
    transform: scale(0.6)
  60%
    transform: scale(1.15)
  100%
    transform: scale(1)

@media (prefers-reduced-motion: reduce)
  .gm-piece
    transition: none

  .gm-piece.pop, .gm-slot.shine, .gm-slot.wiggle
    animation: none
</style>
