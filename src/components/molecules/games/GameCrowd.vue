<script setup lang="ts">
/**
 * Through the crowd (Mark 5,24): Jesus goes with Jairus to his house, and a great crowd presses round them. We look down on the street, a grid of five places across and six rows up. The pair of Jesus and Jairus
 * stands at the bottom in the middle column; the house of Jairus is at the top. People stand in the places in between. A tap on a person makes him step one place to the side (to the side away from the pair first, the other side if
 * that one is taken); if both places beside him are taken he cannot, and he wobbles (a cross, a word; counted, harmless). The pair walks up by itself as soon as the place in front of it is free. Round 1 has three rows of people,
 * round 2 five. After fifteen seconds without a tap the button "Help me" makes the person step aside who is in the way. The arithmetic is in `utils/wunderGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { CROWD_COLS, CROWD_MID, CROWD_ROWS, crowdBuild, crowdCanAdvance, crowdFirstRow, crowdHelp, crowdTarget } from '@/utils/wunderGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CrowdGame } from '@/types/adventure'

const props = defineProps<{ game: CrowdGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every row of people the pair has to pass, in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.rows.length, 0))

const TICK = 0.1
const IDLE_SECONDS = 15
const STEP_MS = 480
const SIDE_MS = 330
/** The colours that stand in for the pictures of the people until they are painted. */
const COLOURS = ['#c98c5a', '#7aa0b8', '#b56b6b', '#8fb36b', '#c9a24a', '#9a82b5']

interface Person {
  id: number
  kind: number
  row: number
  col: number
}

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const firstRow = computed(() => crowdFirstRow(current.value.rows))
const people = ref<Person[]>([])
const pairRow = ref(CROWD_ROWS - 1)
const moving = ref(false)
const entering = ref(false)
const wobbleId = ref<number | null>(null)
const crossId = ref<number | null>(null)
const misses = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const area = computed(() => props.game.area)
const cellW = computed(() => area.value.w / CROWD_COLS)
const cellH = computed(() => area.value.h / CROWD_ROWS)
const centreX = (col: number) => area.value.x + (col + 0.5) * cellW.value
/** The feet of a figure stand at the bottom of the row. */
const feetY = (row: number) => area.value.y + (row + 0.92) * cellH.value
const spriteOf = (kind: number) => props.game.people[(kind - 1) % props.game.people.length]!

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The grid of the street as numbers (the kinds of the people). */
function gridNow(): number[][] {
  const g = Array.from({ length: CROWD_ROWS }, () => Array<number>(CROWD_COLS).fill(0))
  for (const p of people.value) g[p.row]![p.col] = p.kind
  return g
}

function startRound() {
  const grid = crowdBuild(current.value.rows)
  const list: Person[] = []
  let id = 0
  grid.forEach((r, row) => r.forEach((kind, col) => kind && list.push(reactive({ id: id++, kind, row, col }))))
  people.value = list
  pairRow.value = CROWD_ROWS - 1
  moving.value = false
  entering.value = false
  idle.value = 0
  later(advance, 700)
}

function tick() {
  if (finished.value || between.value) return
  idle.value += TICK
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** The pair takes its next step up, when the place in front of it is free; at the top it goes into the house. */
function advance() {
  if (moving.value || between.value || finished.value) return
  if (pairRow.value <= 0) return arrive()
  if (!crowdCanAdvance(gridNow(), pairRow.value)) return
  moving.value = true
  pairRow.value--
  if (pairRow.value >= firstRow.value && pairRow.value <= CROWD_ROWS - 2) progress.mark()
  play('tap')
  later(() => {
    moving.value = false
    if (pairRow.value <= 0) arrive()
    else advance()
  }, STEP_MS)
}

function arrive() {
  if (between.value) return
  between.value = true
  play('right')
  say(t('app.adventure.crowdArrived'), 0)
  later(() => {
    entering.value = true
  }, 500)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => {
    round.value++
    startRound()
    between.value = false
    message.value = ''
  }, 2000)
}

function tapPerson(p: Person) {
  if (between.value || finished.value) return
  idle.value = 0
  const row = gridNow()[p.row]!
  const target = crowdTarget(row, p.col, p.row === pairRow.value ? CROWD_MID : -1)
  if (target < 0) {
    misses.value++
    play('wrong')
    say(t('app.adventure.crowdBlocked'))
    wobbleId.value = p.id
    crossId.value = p.id
    later(() => {
      if (wobbleId.value === p.id) wobbleId.value = null
      if (crossId.value === p.id) crossId.value = null
    }, 900)
    return
  }
  p.col = target
  play('tap')
  message.value = ''
  later(advance, SIDE_MS)
}

/** The button for those who are stuck: the person who is in the way steps aside. */
function helpMe() {
  const tap = crowdHelp(gridNow(), pairRow.value)
  if (!tap) return
  const p = people.value.find((x) => x.row === tap.row && x.col === tap.col)
  if (p) tapPerson(p)
}

startRound()
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.crowdField')"
      )
        button(
          v-for="p in people"
          :key="`${round}-${p.id}`"
          type="button"
          class="gm-person"
          :class="{ wobble: wobbleId === p.id }"
          :style="{ left: `${centreX(p.col)}%`, top: `${feetY(p.row)}%`, width: `${spriteOf(p.kind).w}%`, zIndex: (p.row + 1) * 2 }"
          :aria-label="t('app.adventure.crowdPerson', { r: CROWD_ROWS - 1 - p.row })"
          :disabled="between"
          @click="tapPerson(p)"
        )
          GameImage(:src="spriteOf(p.kind).image" :ratio="0.62" :colour="COLOURS[(p.kind - 1) % COLOURS.length]" :label="String(p.kind)")
          span(v-if="crossId === p.id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        div(
          class="gm-pair"
          :class="{ in: entering }"
          :style="entering ? { left: `${game.door.x}%`, top: `${game.door.y}%`, width: `${game.pair.w}%` } : { left: `${centreX(CROWD_MID)}%`, top: `${feetY(pairRow)}%`, width: `${game.pair.w}%`, zIndex: (pairRow + 1) * 2 + 1 }"
          role="img"
          :aria-label="t('app.adventure.crowdPair')"
        )
          GameImage(:src="game.pair.image" :ratio="1.1" colour="#e0b84a" :label="game.pair.label")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.crowdCount', { n: doneCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.crowdHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.crowdDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
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
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

// a person: the button is as wide as the picture (at least 44 pixels) and as high as the figure
.gm-person
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  transition: left 300ms ease-in-out
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 12px

  &.wobble
    animation: gm-wobble 500ms ease-in-out

.gm-pair
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: top 420ms ease-in-out, left 420ms ease-in-out, opacity 700ms ease, scale 700ms ease
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.45))

  &.in
    opacity: 0
    scale: 0.55
    z-index: 1

.gm-cross
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 40

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  20%
    rotate: -6deg
  40%
    rotate: 6deg
  60%
    rotate: -4deg
  80%
    rotate: 4deg

@media (prefers-reduced-motion: reduce)
  .gm-person, .gm-pair
    transition: none

  .gm-person.wobble
    animation: none
</style>
