<script setup lang="ts">
/**
 * The seats (Mark 2,15; Luke 5,29). Levi's house seen from directly above: the long table, a water jar, a basket of bread, and on the floor the benches (two or three seats each) and the mats at the table.
 * A sliding puzzle: the child pushes a bench with a finger (drag it along the floor as far as it can go) or with the arrow keys (one cell per key; keys in one direction on one bench are one move) until
 * a bench lies across every mat at the table, so that all the guests have a seat. The benches slide in all four directions but stop at walls, the table, the jar and other benches.
 * Every three moves over the fewest moves (`par`) are one mistake (a cross and a word). Whoever does not go on gets the button "Help me" after fifteen seconds: a bench of a shortest solution is marked.
 * All is painted (floor, table, benches, mats, jar, basket), the app only places and turns the pictures. Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { seatsCells, seatsCovered, seatsHint, seatsMistakes, seatsPush, seatsReach, seatsSize, seatsSolved, seatsTable } from '@/utils/freundeNeu'
import type { SeatsGame, SeatsMove, SeatsPos } from '@/utils/freundeNeu'
import type { Dir } from '@/utils/freundeNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SeatsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every mat of every round gets its bench
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.mats.length, 0))

const TICK_MS = 250
const IDLE_SECONDS = 15
const DRAG_PX = 6

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const rows = computed(() => current.value.rows)
const size = computed(() => seatsSize(rows.value))
const pos = ref<SeatsPos[]>([])
const moves = ref(0)
const pastMistakes = ref(0)
const solved = ref(false)
const between = ref(false)
const finished = ref(false)
const tooMany = ref(false)
const helpMove = ref<SeatsMove | null>(null)
const idle = ref(0)
const message = ref('')
let messageSeq = 0
let last: { i: number; dir: Dir } | null = null
let bestCovered = 0
const field = ref<HTMLElement | null>(null)
const benchEls = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const mistakes = computed(() => pastMistakes.value + (solved.value ? 0 : seatsMistakes(moves.value, current.value.par)))
const stars = computed(() => osterStars(mistakes.value))
const covered = computed(() => seatsCovered(current.value.mats, current.value.benches, pos.value))
const coveredCount = computed(() => covered.value.filter(Boolean).length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  pos.value = current.value.benches.map((b) => ({ r: b.r, c: b.c }))
  moves.value = 0
  solved.value = false
  between.value = false
  tooMany.value = false
  helpMove.value = null
  idle.value = 0
  last = null
  bestCovered = seatsCovered(current.value.mats, current.value.benches, pos.value).filter(Boolean).length
  drag.i = -1
}
const drag = reactive({ i: -1, x0: 0, y0: 0, dir: 0 as Dir, k: 0, dx: 0, dy: 0, moved: false })
startRound()

function loop() {
  if (!between.value && !finished.value) idle.value += TICK_MS / 1000
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

/** More mats have a bench than ever before in this round: they count for "Go on" (once each). */
function credit() {
  const n = coveredCount.value
  while (bestCovered < n) {
    progress.mark()
    bestCovered++
  }
}

/** Bench `i` goes `k` cells in a direction: one move (a further push of the same bench in the same direction goes on with the same move). */
function push(i: number, dir: Dir, k: number): boolean {
  if (between.value || finished.value || k < 1) return false
  const reach = seatsReach(rows.value, current.value.benches, pos.value, i, dir)
  const n = Math.min(k, reach)
  if (n < 1) return false
  pos.value = seatsPush(rows.value, current.value.benches, pos.value, i, dir, n)
  if (!last || last.i !== i || last.dir !== dir) {
    moves.value++
    last = { i, dir }
  }
  idle.value = 0
  helpMove.value = null
  play('snap')
  credit()
  const over = moves.value - current.value.par
  if (seatsSolved(current.value.mats, current.value.benches, pos.value)) {
    solve()
    return true
  }
  if (over > 0 && over % 3 === 0 && !tooMany.value) {
    tooMany.value = true
    play('wrong')
    say(t('app.adventure.seatsTooMany'), 3000)
    later(() => (tooMany.value = false), 3000)
  }
  return true
}

function solve() {
  solved.value = true
  between.value = true
  tooMany.value = false
  pastMistakes.value += seatsMistakes(moves.value, current.value.par)
  later(() => play('right'), 250)
  say(t('app.adventure.seatsAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    startRound()
    message.value = ''
  }, 2800)
}

// ---- the finger: a bench follows the finger along one direction, as far as it can go
const cellPx = () => {
  const r = field.value?.getBoundingClientRect()
  return r && r.width ? r.width / size.value.cols : 60
}
function dragMove(e: PointerEvent) {
  if (drag.i < 0) return
  const dx = e.clientX - drag.x0
  const dy = e.clientY - drag.y0
  if (!drag.moved && Math.hypot(dx, dy) < DRAG_PX) return
  drag.moved = true
  const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0
  const px = cellPx()
  const dist = dir === 1 || dir === 3 ? Math.abs(dx) : Math.abs(dy)
  const reach = seatsReach(rows.value, current.value.benches, pos.value, drag.i, dir)
  const shown = Math.min(dist, reach * px)
  drag.dir = dir
  drag.k = Math.min(reach, Math.round(dist / px))
  drag.dx = dir === 1 ? shown : dir === 3 ? -shown : 0
  drag.dy = dir === 2 ? shown : dir === 0 ? -shown : 0
}
function stopListening() {
  window.removeEventListener('pointermove', dragMove)
  window.removeEventListener('pointerup', dragUp)
  window.removeEventListener('pointercancel', dragCancel)
}
function dragCancel() {
  drag.i = -1
  drag.dx = 0
  drag.dy = 0
  stopListening()
}
function dragUp() {
  const i = drag.i
  const dir = drag.dir
  const k = drag.k
  const moved = drag.moved
  dragCancel()
  if (i < 0) return
  if (!moved) {
    benchEls.value[i]?.focus({ preventScroll: true })
    return
  }
  if (k < 1) {
    const reach = seatsReach(rows.value, current.value.benches, pos.value, i, dir)
    if (reach < 1) say(t('app.adventure.seatsStuck'))
    return
  }
  push(i, dir, k)
}
function down(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  idle.value = 0
  drag.i = i
  drag.x0 = e.clientX
  drag.y0 = e.clientY
  drag.dx = 0
  drag.dy = 0
  drag.k = 0
  drag.moved = false
  window.addEventListener('pointermove', dragMove)
  window.addEventListener('pointerup', dragUp)
  window.addEventListener('pointercancel', dragCancel)
}
onBeforeUnmount(stopListening)

/** The arrow keys on a bench: one cell per key. */
function onKey(e: KeyboardEvent, i: number) {
  const arrows: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = arrows[e.key]
  if (d !== undefined) {
    e.preventDefault()
    if (!push(i, d, 1) && !between.value) say(t('app.adventure.seatsStuck'))
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    say(t('app.adventure.seatsKeys'), 3600)
  }
}

/** The button "Help me": a bench of a shortest solution is marked and gets the focus. */
async function helpMe() {
  idle.value = 0
  helpMove.value = seatsHint(rows.value, current.value.mats, current.value.benches, pos.value)
  if (!helpMove.value) return
  say(t('app.adventure.seatsHelpSay', { dir: t(`app.adventure.seatsDir${helpMove.value.dir}`) }), 4500)
  await nextTick()
  benchEls.value[helpMove.value.i]?.focus()
}

// ---- looks
const W = computed(() => 100 / size.value.cols)
const H = computed(() => 100 / size.value.rows)
const fieldStyle = computed(() => ({ backgroundImage: `url(${src(props.game.floor)})`, aspectRatio: `${size.value.cols} / ${size.value.rows}` }))
const table = computed(() => seatsTable(rows.value))
const tableStyle = computed(() => {
  const tb = table.value
  return tb ? { left: `${tb.c * W.value}%`, top: `${tb.r * H.value}%`, width: `${tb.len * W.value}%`, height: `${H.value}%` } : {}
})
const things = computed(() => {
  const out: { key: string; src: string; label: string; style: Record<string, string> }[] = []
  rows.value.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const s = row[c]
      if (s !== 'K' && s !== 'O') continue
      out.push({ key: `${r}-${c}`, src: s === 'K' ? props.game.jar : props.game.basket, label: s === 'K' ? 'krug' : 'korb', style: { left: `${c * W.value}%`, top: `${r * H.value}%`, width: `${W.value}%`, height: `${H.value}%` } })
    }
  })
  return out
})
const matStyle = (m: { r: number; c: number }) => {
  const h = Math.min(1, 2 / (props.game.matRatio ?? 2))
  return { left: `${m.c * W.value}%`, top: `${(m.r + (1 - h) / 2) * H.value}%`, width: `${2 * W.value}%`, height: `${h * H.value}%` }
}
const spotStyle = (m: { r: number; c: number }) => ({ left: `${m.c * W.value}%`, top: `${m.r * H.value}%`, width: `${2 * W.value}%`, height: `${H.value}%` })
const benchBox = (i: number) => {
  const b = current.value.benches[i]!
  const p = pos.value[i]!
  const style: Record<string, string> = { left: `${p.c * W.value}%`, top: `${p.r * H.value}%`, '--len': String(b.len) }
  if (b.dir === 'h') {
    style.width = `${b.len * W.value}%`
    style.height = `${H.value}%`
  } else {
    style.width = `${W.value}%`
    style.height = `${b.len * H.value}%`
  }
  if (drag.i === i && drag.moved) style.transform = `translate(${drag.dx}px, ${drag.dy}px)`
  return style
}
const benchPic = (i: number) => (current.value.benches[i]!.len === 3 ? props.game.bench3 : props.game.bench2)
const benchLabel = (i: number) => {
  const b = current.value.benches[i]!
  const cs = seatsCells(b, pos.value[i]!)
  return t('app.adventure.seatsBench', { n: b.len, r: cs[0]!.r + 1, c: cs[0]!.c + 1 })
}
const setBench = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) benchEls.value[i] = el
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(v-if="game.guests" class="gm-guests" role="img" :aria-label="game.guestsLabel || t('app.adventure.seatsGuests')")
        GameImage(:src="game.guests" :ratio="2" colour="#c9a877" label="gaeste")
      div(
        ref="field"
        class="gm-field"
        :style="fieldStyle"
        role="group"
        :aria-label="t('app.adventure.seatsField')"
      )
        div(
          v-for="(m, k) in current.mats"
          :key="`m${round}-${k}`"
          class="gm-mat"
          :class="{ full: covered[k] }"
          :style="matStyle(m)"
          :data-mat="k"
          aria-hidden="true"
        )
          GameImage(:src="game.mat" :ratio="game.matRatio ?? 2" colour="#b89a5e" label="matte")
        div(v-if="table" class="gm-table" :style="tableStyle" aria-hidden="true")
          GameImage(:src="game.table" :ratio="4" colour="#7a5532" label="tisch")
        div(v-for="th in things" :key="`${round}-${th.key}`" class="gm-thing" :style="th.style" aria-hidden="true")
          GameImage(:src="th.src" :ratio="1" colour="#a8693a" :label="th.label")
        div(
          v-for="(b, i) in current.benches"
          :key="`${round}-${b.id}`"
          :ref="(el) => setBench(el, i)"
          class="gm-bench"
          :class="[b.dir, { hint: helpMove && helpMove.i === i, dragging: drag.i === i && drag.moved }]"
          :data-bench="b.id"
          :style="benchBox(i)"
          role="button"
          tabindex="0"
          :aria-label="benchLabel(i)"
          @pointerdown="down($event, i)"
          @keydown="onKey($event, i)"
        )
          span(class="gm-turn")
            GameImage(:src="benchPic(i)" :ratio="b.len" colour="#8a5a2b" :label="`bank-${b.len}`")
        //- the ticks of the covered mats lie over the benches
        div(v-for="(m, k) in current.mats" :key="`s${round}-${k}`" class="gm-spot" :style="spotStyle(m)" aria-hidden="true")
          span(v-if="covered[k]" class="gm-mark")
            GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.seatsCount', { n: coveredCount, total: current.mats.length }) }}
      p(class="gm-moves")
        span {{ t('app.adventure.seatsMoves', { n: moves, par: current.par }) }}
        span(v-if="tooMany" class="gm-bad")
          GameMark(kind="bad")
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" class="gm-b" @click="helpMe") {{ t('app.adventure.seatsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.seatsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcbc
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.22)
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
  color: #5a4630

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4630

.gm-guests
  align-self: center
  width: min(78%, 330px)

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb48a
  background-size: 100% 100%
  touch-action: none

.gm-table, .gm-mat, .gm-thing
  position: absolute
  display: block
  pointer-events: none

.gm-table
  z-index: 1

.gm-table, .gm-mat
  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

.gm-thing
  z-index: 1
  padding: 3px

.gm-mat
  z-index: 0

.gm-spot
  position: absolute
  display: block
  z-index: 6
  pointer-events: none

.gm-mark
  position: absolute
  right: -4px
  top: -8px
  display: block
  z-index: 5

.gm-bench
  position: absolute
  display: block
  z-index: 2
  cursor: grab
  touch-action: none
  transition: left 140ms ease-out, top 140ms ease-out
  -webkit-tap-highlight-color: transparent

  &.dragging
    transition: none
    z-index: 4
    cursor: grabbing

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 1px
    z-index: 4

  &.hint
    outline: 4px dashed #fff6dc
    outline-offset: 1px
    z-index: 4

// a bench that lies up and down is the picture turned by a quarter: the turned picture is as wide as the bench is long
.gm-turn
  position: absolute
  display: block
  left: 0
  top: 0
  width: 100%
  height: 100%

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

  :deep(.gi-stand)
    border-radius: 6px

.gm-bench.v .gm-turn
  left: 100%
  top: 0
  width: calc(var(--len, 2) * 100%)
  height: auto
  aspect-ratio: var(--len, 2)
  transform-origin: 0 0
  transform: rotate(90deg)

.gm-thing :deep(.gi), .gm-thing :deep(img)
  width: 100%
  height: 100%

.gm-thing :deep(img)
  object-fit: contain

.gm-count, .gm-moves
  margin: 0
  align-self: center
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4630

.gm-bad
  display: inline-flex

.gm-b
  align-self: center
  min-height: 44px
  min-width: 44px

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3e2f1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .gm-bench
    transition: none
</style>
