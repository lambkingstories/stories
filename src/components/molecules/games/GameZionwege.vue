<script setup lang="ts">
/**
 * Ways to Zion (Micah 4,1-2.6-7: "Come, let us go up to the mountain of the Lord"; "I will assemble her that halteth, and I will gather her that is driven out").
 * A map of painted path tiles seen from above; Mount Zion lies at the top, people are scattered over the land and wait on their tiles. A tap turns a path tile a quarter
 * turn clockwise. When the paths of two tiles meet, they are joined; every person whose tile is joined to Zion gets a tick. When everybody has a way, the round is won.
 * Trying is allowed: only every four taps over the fewest taps (`par`) are one mistake (a cross and words). Round 1: a map of 4 x 4 with three people; round 2: 5 x 5 with four
 * people and more tiles. On the keyboard the arrow keys choose a tile and Enter turns it. Whoever does not go on gets "Help me" after fifteen seconds: the next tile of a solution
 * with the fewest taps turns once by itself and is shown. With reduced motion the tiles do not turn slowly. Nothing is shown by colour alone (tick, cross, words, the count).
 * The arithmetic is `utils/prophetenNeu.ts`; stars: `prophetenStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prophetenStars, zionHint, zionMistakes, zionMove, zionPeopleReached, zionPicture, zionReached, zionSolved, zionTurnable, zionTurns } from '@/utils/prophetenNeu'
import type { ZionCell, ZionDir, ZionGame, ZionTurns } from '@/utils/prophetenNeu'

const props = defineProps<{ game: ZionGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every person who gets a way to Zion
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.people.length, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const rows = computed(() => current.value.rows)
const cols = computed(() => rows.value[0]?.length ?? 1)
const turns = ref<ZionTurns>(zionTurns(props.game.rounds[0]!.start))
/** Quarter turns counted on (never back to 0), so that a tile always turns on clockwise on the screen. */
const spins = ref<ZionTurns>(zionTurns(props.game.rounds[0]!.start))
const taps = ref(0)
const roundMistakes = ref(0)
const mistakes = ref(0)
/** The most people that had a way in this round (each counts once for "Go on"). */
const bestReached = ref(0)
const cursor = ref<ZionCell | null>(null)
const hinted = ref<ZionCell | null>(null)
const markAt = ref<{ r: number; c: number; kind: 'good' | 'bad' } | null>(null)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const stars = computed(() => prophetenStars(mistakes.value))
const reached = computed(() => zionReached(rows.value, turns.value))
const reachedCount = computed(() => zionPeopleReached(current.value, turns.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(r: number, c: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { r, c, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}

function idleLoop() {
  if (!between.value && !finished.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** Turn the tile at (r, c) a quarter turn; `helped` = the help did it (not counted as a tap). */
function turn(r: number, c: number, helped = false) {
  if (between.value || finished.value) return
  idle.value = 0
  if (!zionTurnable(rows.value, r, c)) {
    say(t(rows.value[r]?.[c] === 'Z' ? 'app.adventure.zionPathsZionFixed' : 'app.adventure.zionPathsFixed'))
    return
  }
  turns.value[r]![c] = (turns.value[r]![c]! + 1) % 4
  spins.value[r]![c] = spins.value[r]![c]! + 1
  play('tap')
  if (!helped) {
    taps.value++
    const m = zionMistakes(taps.value, current.value.par)
    if (m > roundMistakes.value) {
      mistakes.value += m - roundMistakes.value
      roundMistakes.value = m
      play('wrong')
      flash(r, c, 'bad')
      say(t('app.adventure.zionPathsMany'), 3000)
    }
  }
  const n = reachedCount.value
  if (n > bestReached.value) {
    for (let k = bestReached.value; k < n; k++) progress.mark()
    bestReached.value = n
    play('bead')
    const p = current.value.people.find((q) => reached.value[q.r]?.[q.c])
    if (p) flash(p.r, p.c, 'good')
    say(t('app.adventure.zionPathsJoined'), 2200)
  } else if (helped) say(t('app.adventure.zionPathsHelped'), 2600)
  if (zionSolved(current.value, turns.value)) endRound()
}

function endRound() {
  between.value = true
  cursor.value = null
  hinted.value = null
  later(() => play('right'), 250)
  say(t('app.adventure.zionPathsAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    turns.value = zionTurns(current.value.start)
    spins.value = zionTurns(current.value.start)
    taps.value = 0
    roundMistakes.value = 0
    bestReached.value = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function cellClick(r: number, c: number) {
  cursor.value = null
  turn(r, c)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const arrows: Record<string, ZionDir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = arrows[e.key]
  if (d !== undefined) {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value ? zionMove(rows.value, cursor.value, d) : firstTile()
    say(cellLabel(cursor.value.r, cursor.value.c), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!cursor.value) {
      cursor.value = firstTile()
      say(t('app.adventure.zionPathsKeys'), 3600)
      return
    }
    turn(cursor.value.r, cursor.value.c)
    say(cellLabel(cursor.value.r, cursor.value.c), 0)
  }
  if (e.key === 'Escape') {
    cursor.value = null
    message.value = ''
  }
}
function firstTile(): ZionCell {
  for (let r = 0; r < rows.value.length; r++) for (let c = 0; c < cols.value; c++) if (zionTurnable(rows.value, r, c)) return { r, c }
  return { r: 0, c: 0 }
}

/** The button for those who do not go on: the next tile of a solution turns once by itself and is shown. */
function helpMe() {
  const h = zionHint(current.value, turns.value)
  if (!h) return
  hinted.value = h
  later(() => {
    if (hinted.value === h) hinted.value = null
  }, 2600)
  turn(h.r, h.c, true)
}

// ---- looks
const cells = computed(() => {
  const out: { r: number; c: number }[] = []
  for (let r = 0; r < rows.value.length; r++) for (let c = 0; c < cols.value; c++) out.push({ r, c })
  return out
})
const personAt = (r: number, c: number) => current.value.people.find((p) => p.r === r && p.c === c)
const personImage = (r: number, c: number) => props.game.people[personAt(r, c)?.image ?? 0] ?? ''
const picture = (r: number, c: number) => zionPicture(props.game, rows.value, turns.value, r, c)
const tileStyle = (r: number, c: number) => {
  const p = picture(r, c)
  const extra = p.kind === 'Z' || p.kind === 'field' ? p.turn : p.turn - (turns.value[r]![c] ?? 0) * 90 + (spins.value[r]![c] ?? 0) * 90
  return { transform: `rotate(${extra}deg)` }
}
function cellLabel(r: number, c: number): string {
  const s = rows.value[r]?.[c]
  const pos = t('app.adventure.zionPathsCell', { r: r + 1, c: c + 1 })
  if (s === 'Z') return `${t('app.adventure.zionPathsZion')}. ${pos}`
  if (!zionTurnable(rows.value, r, c)) return `${t('app.adventure.zionPathsFieldTile')}. ${pos}`
  const person = personAt(r, c)
  const who = person ? ` ${t(reached.value[r]?.[c] ? 'app.adventure.zionPathsPersonWay' : 'app.adventure.zionPathsPersonWaits')}` : ''
  return `${t('app.adventure.zionPathsTile')}. ${pos}.${who}`
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
        :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.zionPathsField')"
        @keydown="onKey"
      )
        button(
          v-for="cell in cells"
          :key="`z-${round}-${cell.r}-${cell.c}`"
          type="button"
          class="gm-cell"
          :class="{ turnable: zionTurnable(rows, cell.r, cell.c), joined: reached[cell.r]?.[cell.c], cursor: cursor && cursor.r === cell.r && cursor.c === cell.c, hinted: hinted && hinted.r === cell.r && hinted.c === cell.c }"
          :data-cell="`${cell.r}-${cell.c}`"
          :aria-label="cellLabel(cell.r, cell.c)"
          tabindex="-1"
          @click="cellClick(cell.r, cell.c)"
        )
          span(class="gm-tile" :style="tileStyle(cell.r, cell.c)" aria-hidden="true")
            GameImage(:src="picture(cell.r, cell.c).src" colour="#b7a76a" :label="picture(cell.r, cell.c).kind")
          span(v-if="personAt(cell.r, cell.c)" class="gm-person" :data-person="`${cell.r}-${cell.c}`" aria-hidden="true")
            GameImage(:src="personImage(cell.r, cell.c)" :ratio="0.7" colour="#a88a62" label="mensch")
          span(v-if="personAt(cell.r, cell.c) && reached[cell.r]?.[cell.c]" class="gm-ok" aria-hidden="true")
            GameMark(kind="good")
          span(v-if="markAt && markAt.r === cell.r && markAt.c === cell.c" class="gm-mark")
            GameMark(:kind="markAt.kind")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.zionPathsCount', { n: reachedCount, total: current.people.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.zionPathsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.zionPathsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f0dcb0
  box-shadow: inset 0 0 18px rgba(110, 70, 20, 0.25)
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
  color: #6a4a22

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #6a4a22

.gm-field
  display: grid
  width: 100%
  max-width: 520px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #9fae6a

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a tile: a button that fills its square (at least 44 pixels: 5 columns on a 360 pixel phone are about 68 pixels)
.gm-cell
  position: relative
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  padding: 0
  border: 0
  background: transparent
  cursor: default
  overflow: visible

  &.turnable
    cursor: pointer

  // a tile joined to Zion: a warm inner light (and the ticks of the people and the count say it in words)
  &.joined::after
    content: ''
    position: absolute
    inset: 0
    box-shadow: inset 0 0 0 3px rgba(255, 232, 160, 0.85)
    pointer-events: none

  &.cursor, &.hinted
    z-index: 3

  &.cursor::before, &.hinted::before
    content: ''
    position: absolute
    inset: 3px
    border: 3px dashed #fff6dc
    border-radius: 8px
    box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.6)
    pointer-events: none
    z-index: 4

  &.hinted::before
    border-style: solid

.gm-tile
  position: absolute
  inset: 0
  display: block
  transition: transform 260ms ease-out
  pointer-events: none

  :deep(img)
    width: 100%
    height: 100%
    object-fit: cover

// a person stands in the middle of the tile and is not turned
.gm-person
  position: absolute
  left: 50%
  top: 54%
  width: 62%
  transform: translate(-50%, -60%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 3px 3px rgba(60, 35, 10, 0.45))

.gm-ok
  position: absolute
  right: 2px
  top: 2px
  pointer-events: none
  z-index: 5

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #6a4a22

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

// less motion: the tiles jump to their new turn
@media (prefers-reduced-motion: reduce)
  .gm-tile
    transition: none
</style>
