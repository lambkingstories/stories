<script setup lang="ts">
/**
 * Two halves (Matthew 22,37-39): the greatest commandment is to love God, and the second is like it: to love your neighbour.
 * Every painted picture shows one deed of love; the app cuts it into a left and a right half, which lie turned in the tray. The child taps a half (it is chosen; a second
 * tap turns it), turns it with the two buttons until it stands upright and lays it on its place of the workbench (drag it there, or tap the place; the left half on the left).
 * When both halves make one picture, the child taps the half of the heart it belongs to: "Love God" (the light of the sky) or "Love your neighbour" (the neighbours).
 * Two halves that do not belong together are a mistake (the second one goes back, a cross and a word), and so is the wrong half of the heart. A half that is not upright yet,
 * the wrong side or a full place is no mistake: it stays in the tray with a word. Keys: left/right choose a half, Enter turns it, up lays it down, down takes it back;
 * while a picture waits for its heart, left and right choose the half of the heart. "Help me" comes after fifteen seconds: one step is done.
 * At the end the two halves of the heart move together and become one. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/letztewocheNeu.ts`; stars: `osterStars(mistakes)`.
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
import { osterPointIn, osterStars } from '@/utils/osternGames'
import { COMMAND_HEART_SIDE, COMMAND_RATIO, commandAt, commandCardsOf, commandHelp, commandJoined, commandKindOf, commandPlaceVerdict, commandRoundDone, commandStart, commandTurnBy } from '@/utils/letztewocheNeu'
import type { CommandGame, CommandKind, CommandSide, CommandSpot } from '@/utils/letztewocheNeu'

const props = defineProps<{ game: CommandGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every picture of every round sorted into the heart
const total = props.game.rounds.reduce((n, r) => n + commandCardsOf(r).length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const TAP_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const start = commandStart(props.game.rounds[0]!)
const spots = ref<CommandSpot[]>(start.spots)
const turns = ref<number[]>(start.turns)
const selected = ref(-1)
/** The half of the heart chosen with the keyboard while a picture waits. */
const heartCursor = ref<CommandKind | null>(null)
const sorted = reactive<Record<CommandKind, number>>({ god: 0, neighbor: 0 })
const drag = reactive({ item: -1, x: 0, y: 0, sx: 0, sy: 0, moved: 0 })
const mark = ref<{ kind: 'good' | 'bad'; where: 'bench' | CommandKind } | null>(null)
const bounce = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const joinedHeart = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const benchL = ref<HTMLElement | null>(null)
const benchR = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))
const done = computed(() => sorted.god + sorted.neighbor)
const joined = computed(() => commandJoined(current.value, spots.value))
const waiting = computed(() => (joined.value && joined.value !== 'mismatch' ? joined.value.card : null))
const cardOf = (i: number) => props.game.cards.find((c) => c.id === current.value.pieces[i]?.card)
const kindName = (k: CommandKind) => t(k === 'god' ? 'app.adventure.commandmentGod' : 'app.adventure.commandmentNeighbor')

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', where: 'bench' | CommandKind) {
  const id = ++markSeq
  mark.value = { kind, where }
  later(() => {
    if (markSeq === id) mark.value = null
  }, 900)
}

// the clock of "Help me"
function idleLoop() {
  if (!between.value && !finished.value && drag.item < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

// ---- turning
function turn(i: number, step: 1 | -1) {
  if (between.value || finished.value || spots.value[i] !== 'tray') return
  idle.value = 0
  turns.value[i] = commandTurnBy(turns.value[i] ?? 0, step)
  say(turns.value[i] === 0 ? t('app.adventure.commandmentUpright') : t('app.adventure.commandmentTurned'), 1600)
}
function turnSelected(step: 1 | -1) {
  if (selected.value < 0) {
    say(t('app.adventure.commandmentPickFirst'))
    return
  }
  turn(selected.value, step)
}

// ---- laying down and taking back
function put(i: number, side: CommandSide, helped = false) {
  if (between.value || finished.value) return
  idle.value = 0
  const verdict = commandPlaceVerdict(current.value, turns.value, spots.value, i, side)
  if (verdict === 'gone') return
  if (verdict !== 'ok') {
    say(t(verdict === 'turn' ? 'app.adventure.commandmentTurnFirst' : verdict === 'side' ? 'app.adventure.commandmentWrongSide' : 'app.adventure.commandmentBusy'))
    return
  }
  selected.value = -1
  spots.value[i] = side
  play('snap')
  const j = commandJoined(current.value, spots.value)
  if (j === 'mismatch') {
    mistakes.value++
    play('wrong')
    flash('bad', 'bench')
    say(t('app.adventure.commandmentMismatch'))
    later(() => {
      if (spots.value[i] === side) {
        spots.value[i] = 'tray'
        bounce.value = i
        later(() => {
          if (bounce.value === i) bounce.value = -1
        }, 600)
      }
    }, 700)
    return
  }
  if (j) {
    flash('good', 'bench')
    later(() => play('right'), 150)
    say(helped ? t('app.adventure.commandmentHelped') : t('app.adventure.commandmentJoined'), 0)
    return
  }
  if (helped) say(t('app.adventure.commandmentHelped'))
}
function takeBack(side: CommandSide) {
  if (between.value || finished.value) return
  const i = commandAt(spots.value, side)
  if (i < 0) return
  idle.value = 0
  spots.value[i] = 'tray'
  heartCursor.value = null
  message.value = ''
}

// ---- sorting into the heart
function sortTo(kind: CommandKind, helped = false) {
  if (between.value || finished.value) return
  idle.value = 0
  const card = waiting.value
  if (!card) {
    say(t('app.adventure.commandmentSortFirst'))
    return
  }
  const c = props.game.cards.find((x) => x.id === card)!
  if (commandKindOf(props.game, card) !== kind) {
    mistakes.value++
    play('wrong')
    flash('bad', kind)
    say(t('app.adventure.commandmentWrongKind'))
    return
  }
  spots.value = spots.value.map((s) => (s === 'L' || s === 'R' ? 'done' : s))
  sorted[kind]++
  heartCursor.value = null
  progress.mark()
  play('bead')
  flash('good', kind)
  say(t(helped ? 'app.adventure.commandmentHelped' : kind === 'god' ? 'app.adventure.commandmentRightGod' : 'app.adventure.commandmentRightNeighbor', { card: c.label }), 2400)
  if (commandRoundDone(spots.value)) endRound()
}

function endRound() {
  between.value = true
  selected.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.commandmentRoundDone'), 0)
  if (lastRound.value) {
    // the two halves of the heart become one
    later(() => {
      joinedHeart.value = true
      play('flip')
      say(t('app.adventure.commandmentWhole'), 0)
    }, 1100)
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    const s = commandStart(current.value)
    spots.value = s.spots
    turns.value = s.turns
    selected.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2600)
}

// ---- the finger: tap a half (choose, then turn), drag it to a place, or tap a place
function onMove(e: PointerEvent) {
  if (drag.item < 0) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function sideAt(x: number, y: number): CommandSide | null {
  for (const [side, el] of [['L', benchL.value], ['R', benchR.value]] as const) {
    const r = el?.getBoundingClientRect()
    if (r && r.width && osterPointIn(r, x, y, 12)) return side
  }
  return null
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
    tapPiece(i)
    return
  }
  const side = sideAt(e.clientX, e.clientY)
  if (!side) {
    say(t('app.adventure.commandmentBack'))
    return
  }
  put(i, side)
}
function down(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value || spots.value[i] !== 'tray') return
  idle.value = 0
  drag.item = i
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function tapPiece(i: number) {
  if (between.value || finished.value || spots.value[i] !== 'tray') return
  idle.value = 0
  if (selected.value === i) {
    turn(i, 1)
    return
  }
  selected.value = i
  say(t('app.adventure.commandmentPicked', { n: i + 1 }), 3200)
}
/** A half of the tray clicked from the keyboard (a click of the finger is handled by the pointer). */
function pieceClick(e: MouseEvent, i: number) {
  if (e.detail === 0) tapPiece(i)
}
function tapBench(side: CommandSide) {
  if (between.value || finished.value) return
  if (commandAt(spots.value, side) >= 0) {
    takeBack(side)
    return
  }
  if (selected.value < 0) {
    say(t('app.adventure.commandmentPickFirst'))
    return
  }
  put(selected.value, side)
}

const inTray = computed(() => current.value.pieces.map((_, i) => i).filter((i) => spots.value[i] === 'tray'))
function cyclePiece(step: number) {
  const list = inTray.value
  if (!list.length) return
  const at = list.indexOf(selected.value)
  selected.value = list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]!
  say(t('app.adventure.commandmentPicked', { n: selected.value + 1 }), 0)
}
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  idle.value = 0
  if (waiting.value) {
    // a whole picture waits: left and right choose the half of the heart, Enter puts it there, down takes a half back
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      heartCursor.value = e.key === 'ArrowLeft' ? 'god' : 'neighbor'
      say(t('app.adventure.commandmentHeartChoice', { kind: kindName(heartCursor.value) }), 0)
    } else if ((e.key === 'Enter' || e.key === ' ') && heartCursor.value) sortTo(heartCursor.value)
    else if (e.key === 'ArrowDown') takeBack('R')
    else say(t('app.adventure.commandmentJoined'), 0)
    return
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') cyclePiece(e.key === 'ArrowRight' ? 1 : -1)
  else if (e.key === 'Enter' || e.key === ' ') {
    if (selected.value < 0) {
      cyclePiece(1)
      say(`${t('app.adventure.commandmentPicked', { n: selected.value + 1 })} ${t('app.adventure.commandmentKeys')}`, 0)
    } else turn(selected.value, 1)
  } else if (e.key === 'ArrowUp') {
    if (selected.value < 0) say(t('app.adventure.commandmentPickFirst'))
    else put(selected.value, current.value.pieces[selected.value]!.side)
  } else if (e.key === 'ArrowDown') takeBack(commandAt(spots.value, 'R') >= 0 ? 'R' : 'L')
}

/** The button for those who are stuck: one step is done (a half laid down upright, or the picture sorted). */
function helpMe() {
  const h = commandHelp(props.game, current.value, spots.value)
  if (!h) return
  if ('sort' in h) {
    sortTo(h.sort, true)
    return
  }
  turns.value[h.piece] = 0
  put(h.piece, h.side, true)
}

// ---- looks: a half is the picture twice as wide, shifted (code cuts, it draws nothing)
const halfRatio = COMMAND_RATIO / 2
const pieceAt = (side: CommandSide) => commandAt(spots.value, side)
const pieceLabel = (i: number) =>
  `${t('app.adventure.commandmentPiece', { n: i + 1 })}, ${turns.value[i] === 0 ? t('app.adventure.commandmentUpright') : t('app.adventure.commandmentTurnedBy', { deg: turns.value[i] })}`
const benchLabel = (side: CommandSide) => {
  const i = pieceAt(side)
  const place = t(side === 'L' ? 'app.adventure.commandmentSlotL' : 'app.adventure.commandmentSlotR')
  return i < 0 ? place : `${place}: ${cardOf(i)?.label ?? ''}`
}
const ghostStyle = computed(() => ({ left: `${drag.x}px`, top: `${drag.y}px`, transform: `translate(-50%, -50%) rotate(${turns.value[drag.item] ?? 0}deg)` }))
const KINDS: CommandKind[] = ['god', 'neighbor']
const heartLabel = (k: CommandKind) => `${kindName(k)}: ${t('app.adventure.commandmentSorted', { n: sorted[k] })}`
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      //- the two halves of the heart (they become one at the end)
      div(class="gm-hearts" :class="{ joined: joinedHeart }")
        template(v-if="joinedHeart")
          div(class="gm-whole" role="img" :aria-label="game.heart.label")
            GameImage(:src="game.heart.image" :ratio="COMMAND_RATIO" colour="#d9584f" :label="game.heart.label")
        template(v-else)
          button(
            v-for="k in KINDS"
            :key="`heart-${k}`"
            type="button"
            class="gm-heart"
            :class="[k, { armed: !!waiting, cursor: heartCursor === k }]"
            :data-heart="k"
            :aria-label="heartLabel(k)"
            :disabled="between"
            @click="sortTo(k)"
          )
            span(class="gm-crop" :style="{ aspectRatio: String(halfRatio) }")
              span(class="gm-wide" :class="COMMAND_HEART_SIDE[k]")
                GameImage(:src="game.heart.image" :ratio="COMMAND_RATIO" colour="#d9584f" :label="kindName(k)")
            span(class="gm-heart-name") {{ kindName(k) }}
            span(class="gm-heart-count") {{ sorted[k] }} ✓
            span(v-if="mark && mark.where === k" class="gm-mark")
              GameMark(:kind="mark.kind")
      //- the workbench: a place for the left and one for the right half
      div(
        class="gm-bench"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.commandmentField')"
        :class="{ whole: !!waiting }"
        @keydown="onKey"
      )
        button(
          ref="benchL"
          type="button"
          class="gm-place L"
          :class="{ armed: selected >= 0 || drag.item >= 0 }"
          data-bench="L"
          :aria-label="benchLabel('L')"
          :style="{ aspectRatio: String(halfRatio) }"
          tabindex="-1"
          @click="tapBench('L')"
        )
          span(v-if="pieceAt('L') >= 0" class="gm-crop")
            span(class="gm-wide L")
              GameImage(:src="cardOf(pieceAt('L'))?.image ?? ''" :ratio="COMMAND_RATIO" colour="#c9b48a" :label="cardOf(pieceAt('L'))?.label")
          span(v-else class="gm-place-sign" aria-hidden="true") ◧
        button(
          ref="benchR"
          type="button"
          class="gm-place R"
          :class="{ armed: selected >= 0 || drag.item >= 0 }"
          data-bench="R"
          :aria-label="benchLabel('R')"
          :style="{ aspectRatio: String(halfRatio) }"
          tabindex="-1"
          @click="tapBench('R')"
        )
          span(v-if="pieceAt('R') >= 0" class="gm-crop")
            span(class="gm-wide R")
              GameImage(:src="cardOf(pieceAt('R'))?.image ?? ''" :ratio="COMMAND_RATIO" colour="#c9b48a" :label="cardOf(pieceAt('R'))?.label")
          span(v-else class="gm-place-sign" aria-hidden="true") ◨
        span(v-if="mark && mark.where === 'bench'" class="gm-mark gm-bench-mark")
          GameMark(:kind="mark.kind")
      //- the halves that wait, turned
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.commandmentTray')")
        template(v-for="(p, i) in current.pieces" :key="`piece-${round}-${i}`")
          button(
            v-if="spots[i] === 'tray'"
            type="button"
            class="gm-piece"
            :class="{ sel: selected === i, held: drag.item === i && drag.moved >= TAP_PX, bounce: bounce === i }"
            :data-piece="i"
            :data-turn="turns[i]"
            :aria-label="pieceLabel(i)"
            :aria-pressed="selected === i ? 'true' : 'false'"
            :disabled="between"
            @pointerdown.prevent="down($event, i)"
            @click="pieceClick($event, i)"
          )
            span(class="gm-turner" :style="{ transform: `rotate(${turns[i]}deg)` }")
              span(class="gm-crop" :style="{ aspectRatio: String(halfRatio) }")
                span(class="gm-wide" :class="p.side")
                  GameImage(:src="cardOf(i)?.image ?? ''" :ratio="COMMAND_RATIO" colour="#c9b48a" :label="`${p.card}-${p.side}`")
      div(class="gm-tools")
        button(type="button" class="gm-turn" data-turn="left" :disabled="between" @click="turnSelected(-1)")
          span(aria-hidden="true") ↺
          | {{ t('app.adventure.commandmentTurnLeft') }}
        button(type="button" class="gm-turn" data-turn="right" :disabled="between" @click="turnSelected(1)")
          span(aria-hidden="true") ↻
          | {{ t('app.adventure.commandmentTurnRight') }}
      //- the half in the hand
      div(v-if="drag.item >= 0 && drag.moved >= TAP_PX" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        span(class="gm-crop" :style="{ aspectRatio: String(halfRatio) }")
          span(class="gm-wide" :class="current.pieces[drag.item]?.side")
            GameImage(:src="cardOf(drag.item)?.image ?? ''" :ratio="COMMAND_RATIO" colour="#c9b48a")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.commandmentCount', { n: done, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.commandmentHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.commandmentDone')" @next="emit('done', stars)")
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

// a half: a window of 3:4 onto the picture, which is twice as wide and shifted to the left or the right
.gm-crop
  position: relative
  display: block
  width: 100%
  overflow: hidden
  border-radius: 8px

.gm-wide
  position: absolute
  top: 0
  display: block
  width: 200%

  &.L
    left: 0

  &.R
    left: -100%

// the two halves of the heart
.gm-hearts
  display: flex
  justify-content: center
  gap: 10px

.gm-heart
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  width: 44%
  max-width: 190px
  min-height: 44px
  padding: 6px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer
  transition: transform 300ms ease

  .gm-crop
    width: 72%

  &.armed
    border-style: double
    border-width: 5px
    border-color: #2f6b8a

  &.cursor
    box-shadow: 0 0 0 4px #2f6b8a

  &:disabled
    cursor: default

.gm-heart-name
  font-weight: 800
  font-size: 1rem
  line-height: 1.15
  color: #3f321b
  text-align: center

.gm-heart-count
  font-weight: 800
  font-size: 1rem
  color: #2f6b3f

.gm-whole
  width: 78%
  max-width: 360px
  border-radius: 14px
  overflow: hidden
  border: 3px solid #d4a83e
  animation: gm-join 900ms ease-out

// the workbench
.gm-bench
  position: relative
  display: flex
  justify-content: center
  gap: 0
  padding: 10px
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #8a6a48

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

  &.whole
    border-color: #2fae54
    border-style: double
    border-width: 5px

.gm-place
  position: relative
  display: flex
  align-items: center
  justify-content: center
  width: 40%
  min-width: 44px
  padding: 0
  overflow: hidden
  border: 3px dashed rgba(255, 246, 220, 0.75)
  background: rgba(255, 246, 220, 0.12)
  cursor: pointer

  &.L
    border-radius: 10px 0 0 10px

  &.R
    border-radius: 0 10px 10px 0

  &.armed
    background: rgba(255, 233, 150, 0.22)
    border-color: #fff6dc

  .gm-crop
    height: 100%
    border-radius: 0

.gm-place-sign
  font-size: 2rem
  color: rgba(255, 246, 220, 0.85)

.gm-mark
  position: absolute
  top: 6px
  right: 6px
  display: block
  pointer-events: none
  z-index: 6

.gm-bench-mark
  top: 50%
  left: 50%
  right: auto
  margin: -15px 0 0 -15px

// the tray: four halves in a row
.gm-tray
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 8px
  min-height: 70px

.gm-piece
  position: relative
  display: flex
  align-items: center
  justify-content: center
  aspect-ratio: 1 / 1
  min-width: 44px
  min-height: 44px
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

.gm-turner
  display: block
  width: 72%
  transition: transform 220ms ease

.gm-tools
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

.gm-turn
  display: inline-flex
  align-items: center
  gap: 6px
  min-height: 48px
  padding: 6px 16px
  border: 3px solid #2f6b8a
  border-radius: 999px
  background: #fff6dc
  font-weight: 800
  font-size: 1rem
  color: #23485c
  cursor: pointer

  span
    font-size: 1.3rem

  &:disabled
    opacity: 0.5
    cursor: default

.gm-ghost
  position: fixed
  display: block
  width: 70px
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

@keyframes gm-join
  from
    transform: scale(0.85)
    opacity: 0.4
  to
    transform: scale(1)
    opacity: 1

// less motion: the halves turn at once, nothing bounces, the heart is there at once
@media (prefers-reduced-motion: reduce)
  .gm-piece, .gm-turner, .gm-heart
    transition: none

  .gm-piece.bounce, .gm-whole
    animation: none
</style>
