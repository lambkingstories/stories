<script setup lang="ts">
/**
 * The census (Luke 2,1-5). A painted map of the land with six towns (the app writes the names above them). The travelers come one after the other; the one who is next stands on a card above the map (the card
 * stays in view when the page is scrolled) with a clue where his home town is. The child brings him to the town where he is to be counted: a drag of the card with the finger to the town, or a tap on the town; with
 * the keyboard the arrow keys go from town to town and Enter brings him. Right: he stands there (a tick), the next one comes. Wrong: he stays on the card (a cross and a word), that is a mistake. Round 1: four
 * travelers who are told where they belong; round 2: six, with only a few words about their home. Joseph and Mary belong to Bethlehem, the city of David. Whoever does not go on gets "Help me" after fifteen
 * seconds: the town of the traveler is ringed. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/weihnachtenNeu.ts`; stars: `osterStars(mistakes)`.
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
import { CENSUS_FIGURE, CENSUS_RATIO, CENSUS_SPRITE, censusHelp, censusSpot, censusTownAt, censusVerdict, wnNeighbour } from '@/utils/weihnachtenNeu'
import type { CensusPerson, Pt } from '@/utils/weihnachtenNeu'
import type { CensusGame } from '@/utils/weihnachtenNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: CensusGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every traveler who is brought to his town
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.people.length, 0))

const IDLE_SECONDS = 15
const MOVE_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The town (index) each traveler of the round stands at, -1 while he has not arrived. */
const placedAt = ref<number[]>(props.game.rounds[0]!.people.map(() => -1))
const hintTown = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const markAt = ref<{ i: number; kind: 'good' | 'bad' } | null>(null)
/** The card on the finger while it is dragged (pixels of the window). */
const ghost = ref<{ x: number; y: number } | null>(null)
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const towns = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const figureW = computed(() => props.game.figureW ?? CENSUS_FIGURE)
/** The traveler who is next (the first who has not arrived), -1 when all have. */
const nowIdx = computed(() => placedAt.value.findIndex((x) => x < 0))
const nowPerson = computed(() => (nowIdx.value >= 0 ? current.value.people[nowIdx.value] : undefined))
const left = computed(() => placedAt.value.filter((x) => x < 0).length)

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(i: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { i, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1200)
}

function idleLoop() {
  if (!between.value && !finished.value && !ghost.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The traveler `pi` is brought to the town `ti`: he belongs there, or he does not. */
function attempt(pi: number, ti: number) {
  if (between.value || finished.value || placedAt.value[pi]! >= 0) return
  idle.value = 0
  hintTown.value = -1
  const person = current.value.people[pi]!
  const town = props.game.towns[ti]!
  if (censusVerdict(person, town.id) === 'ok') {
    placedAt.value[pi] = ti
    progress.mark()
    play('snap')
    flash(ti, 'good')
    if (left.value === 0) {
      endRound()
      return
    }
    say(t('app.adventure.censusRight', { name: person.name, town: town.name }), 2400)
    return
  }
  mistakes.value++
  play('wrong')
  flash(ti, 'bad')
  say(t('app.adventure.censusWrong', { name: person.name, town: town.name }), 3200)
}

function endRound() {
  between.value = true
  later(() => play('right'), 250)
  say(t('app.adventure.censusAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    placedAt.value = current.value.people.map(() => -1)
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** A tap on a town (also Enter on it): bring the traveler who is next there. */
function tapTown(ti: number) {
  if (between.value || finished.value || nowIdx.value < 0) return
  idle.value = 0
  attempt(nowIdx.value, ti)
}

// ---- the finger: a drag of the card to a town
let dragFrom = -1
let sx = 0
let sy = 0
let moved = 0

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (dragFrom < 0) return
  moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy))
  if (moved >= MOVE_PX) ghost.value = { x: e.clientX, y: e.clientY }
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  const from = dragFrom
  dragFrom = -1
  ghost.value = null
  if (from < 0 || !e || e.type !== 'pointerup') return
  const m = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy))
  if (m < MOVE_PX) {
    say(t('app.adventure.censusChoose'), 3000)
    return
  }
  const p = pointAt(e)
  const ti = p && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 ? censusTownAt(props.game.towns, p) : -1
  if (ti < 0) {
    say(t('app.adventure.censusDrop'), 2600)
    return
  }
  attempt(from, ti)
}
function downPerson(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  idle.value = 0
  dragFrom = i
  sx = e.clientX
  sy = e.clientY
  moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())
/** A click of a screen reader on the card (it has no pointer): it only says what to do. */
function clickPerson(e: MouseEvent) {
  if (e.detail === 0) say(t('app.adventure.censusChoose'), 3000)
}

function keyTown(e: KeyboardEvent, ti: number) {
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    const k = wnNeighbour(props.game.towns, ti, a[0], a[1], CENSUS_RATIO)
    towns.value[k]?.focus()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    tapTown(ti)
  }
}

/** The button for those who do not go on: the town of the traveler who is next is ringed. */
function helpMe() {
  const h = censusHelp(props.game, current.value, placedAt.value.map((x) => x >= 0))
  if (!h) return
  idle.value = 0
  hintTown.value = h.town
  say(t('app.adventure.censusHelpSay', { name: current.value.people[h.person]!.name, town: props.game.towns[h.town]!.name }), 5000)
}

// ---- looks
const setTown = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) towns.value[i] = el
}
const z = (y: number) => Math.round(y * 10) + 10
const townStyle = (ti: number) => ({ left: `${props.game.towns[ti]!.x}%`, top: `${props.game.towns[ti]!.y}%` })
/** The travelers who stand at a town, with their places. */
const standing = computed(() => {
  const out: { key: string; person: CensusPerson; style: Record<string, string> }[] = []
  props.game.towns.forEach((town, ti) => {
    const here = current.value.people.map((p, i) => ({ p, i })).filter((x) => placedAt.value[x.i] === ti)
    here.forEach((x, k) => {
      const at = censusSpot(town, k, here.length, figureW.value)
      out.push({ key: `${round.value}-${x.i}`, person: x.p, style: { left: `${at.x}%`, top: `${at.y}%`, width: `${figureW.value}%`, zIndex: String(z(at.y)) } })
    })
  })
  return out
})
const ghostStyle = computed(() => (ghost.value ? { left: `${ghost.value.x}px`, top: `${ghost.value.y}px` } : {}))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-dock")
        div(v-if="nowPerson" class="gm-now")
          button(
            :key="`p-${round}-${nowIdx}`"
            type="button"
            class="gm-person"
            :data-person="nowIdx"
            :aria-label="t('app.adventure.censusPerson', { name: nowPerson.name, clue: nowPerson.clue })"
            @pointerdown="downPerson($event, nowIdx)"
            @click="clickPerson($event)"
          )
            span(class="gm-pic")
              GameImage(:src="nowPerson.image" :ratio="CENSUS_SPRITE" colour="#a88a62" :label="nowPerson.name")
            span(class="gm-pname") {{ nowPerson.name }}
          div(class="gm-text" aria-live="polite")
            p(class="gm-clue") {{ nowPerson.clue }}
            p(class="gm-ask") {{ t('app.adventure.censusChoose') }}
        p(class="gm-fb" role="status") {{ message }}
        AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.censusHelp') }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.map)})`, aspectRatio: String(CENSUS_RATIO) }"
        role="group"
        :aria-label="t('app.adventure.censusField')"
      )
        button(
          v-for="(town, ti) in game.towns"
          :key="`town-${ti}`"
          :ref="(el) => setTown(el, ti)"
          type="button"
          class="gm-town"
          :class="{ hint: hintTown === ti }"
          :data-town="town.id"
          :style="townStyle(ti)"
          :aria-label="town.name"
          @click="tapTown(ti)"
          @keydown="keyTown($event, ti)"
        )
          span(class="gm-name") {{ town.name }}
          span(v-if="markAt && markAt.i === ti" class="gm-mark")
            GameMark(:kind="markAt.kind")
        div(v-for="s in standing" :key="s.key" class="gm-stand" :style="s.style" role="img" :aria-label="s.person.name")
          GameImage(:src="s.person.image" :ratio="CENSUS_SPRITE" colour="#a88a62" :label="s.person.name")
      div(v-if="ghost && nowPerson" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="nowPerson.image" :ratio="CENSUS_SPRITE" colour="#a88a62" :label="nowPerson.name")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.censusCount', { n: current.people.length - left, total: current.people.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.censusDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb8
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

// the card of the traveler who is next, his clue and the words of the game: stays at the top of the screen while the map is scrolled
.gm-dock
  position: sticky
  top: 0
  z-index: 20
  display: flex
  flex-direction: column
  gap: 6px
  padding: 6px
  border-radius: 14px
  border: 2px solid #d4a83e
  background: rgba(250, 238, 208, 0.97)
  box-shadow: 0 3px 8px rgba(70, 45, 15, 0.25)

.gm-now
  display: flex
  align-items: stretch
  gap: 10px

.gm-person
  flex: none
  display: flex
  flex-direction: column
  align-items: center
  width: 96px
  min-height: 96px
  padding: 4px 2px
  border: 3px dashed #4a3214
  border-radius: 14px
  background: #fff6dc
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #4a3214
    outline-offset: 2px

.gm-pic
  display: block
  width: 56px

.gm-pname
  font-weight: 800
  font-size: 1rem
  line-height: 1.15
  text-align: center
  color: #4a3214

.gm-text
  display: flex
  flex-direction: column
  justify-content: center
  gap: 4px
  min-width: 0

.gm-clue
  margin: 0
  font-weight: 800
  font-size: 1rem
  line-height: 1.25
  color: #4a3214

.gm-ask
  margin: 0
  font-weight: 600
  font-size: 1rem
  line-height: 1.25
  color: #5a4a2c

// the map is upright (2:3): on a wide screen it is kept low enough to be seen whole
.gm-field
  position: relative
  align-self: center
  width: min(100%, 70vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8aa860
  background-size: cover
  background-position: center

// a town: an invisible button of at least 48 pixels on the painted town; its name stands above it
.gm-town
  position: absolute
  display: block
  width: 56px
  height: 48px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  z-index: 3

  &:focus-visible
    border-color: #fff6dc
    box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.7)

  &.hint
    border: 3px dashed #fff6dc
    box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.7)
    background: rgba(255, 246, 220, 0.2)

.gm-name
  position: absolute
  left: 50%
  bottom: 100%
  transform: translateX(-50%)
  margin-bottom: 2px
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-weight: 800
  font-size: 1rem
  line-height: 1.5
  white-space: nowrap
  color: #4a3214
  pointer-events: none

.gm-stand
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.5))

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-ghost
  position: fixed
  display: block
  width: 56px
  transform: translate(-50%, -80%)
  pointer-events: none
  z-index: 5000
  filter: drop-shadow(0 4px 4px rgba(50, 35, 10, 0.5))

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
</style>
