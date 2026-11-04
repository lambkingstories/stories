<script setup lang="ts">
/**
 * Who needs what? (Matthew 25,35-36). A village street with six people who need something: a hungry man, a thirsty woman, a stranger with a bundle at a door, a freezing boy without a coat, a sick woman on
 * her mat, a prisoner behind a little window (friendly and hopeful). Under the street lie the cards of what is needed (bread, jug of water, open door with a lamp, coat, a visit at the bed, a visit at the window).
 * The finger drags a card to the one who needs it (or taps the card and then the person, or Enter on both): right, the person is glad (the glad picture replaces the sprite in need), the card stays with him
 * or her, a tick and a soft tone; wrong, the card wobbles and stays in the row, a cross and a word (a mistake without loss, the same pair counts once). Round 1: the hungry, the thirsty and the stranger; round 2: the freezing,
 * the sick and the prisoner (the first three stand glad in the village). Nothing is shown by colour alone (tick, cross, words). Stars: `weekStars(mistakes, rounds)` in `utils/letzteWocheGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { helpActive, helpBefore, helpFits, pointIn, weekStars } from '@/utils/letzteWocheGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HelpGame, HelpNeed, HelpPerson } from '@/types/adventure'

const props = defineProps<{ game: HelpGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every person of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.people.length, 0))

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const active = computed(() => helpActive(props.game, round.value))
const before = computed(() => helpBefore(props.game, round.value))
/** The people that are glad now (the ones of the rounds before and the ones helped in this round). */
const helped = ref<HelpNeed[]>([])
const gladIds = computed(() => [...before.value.map((p) => p.id), ...helped.value])
const visible = computed(() => [...before.value, ...active.value])
/** The cards of this round that lie in the row: the order is moved by one place so that it does not follow the people. */
const row = computed(() => {
  const list = active.value.filter((p) => !helped.value.includes(p.id))
  const all = active.value
  const shift = all.length > 1 ? [...all.slice(1), all[0]!] : all
  return shift.filter((p) => list.some((l) => l.id === p.id))
})
const selected = ref<HelpNeed | null>(null)
const wrongPairs = ref<string[]>([])
const wobble = ref<{ card: HelpNeed; person: HelpNeed; n: number } | null>(null)
const mistakes = ref(0)
const solved = ref(0)
const finished = ref(false)
const busy = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => weekStars(mistakes.value, props.game.rounds.length))
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.people.length, 0))
const personStyle = (p: HelpPerson) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` })
const givenStyle = (p: HelpPerson) => ({ left: `${Math.min(96, p.x + p.w * 0.3)}%`, top: `${p.y}%` })
const isGlad = (p: HelpPerson) => gladIds.value.includes(p.id)
const cardOf = (id: HelpNeed) => props.game.people.find((p) => p.id === id)!

const root = ref<HTMLElement | null>(null)
const field = ref<HTMLElement | null>(null)

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function solve() {
  busy.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    helped.value = []
    selected.value = null
    wobble.value = null
    busy.value = false
    message.value = ''
  }, 2700)
}

/** The card `card` is brought to the person `person`. */
function give(card: HelpNeed, person: HelpNeed) {
  if (busy.value || finished.value) return
  selected.value = null
  if (gladIds.value.includes(person)) {
    play('tap')
    say(t('app.adventure.helpAlready'))
    return
  }
  if (!helpFits(card, person)) {
    const key = `${card}>${person}`
    if (!wrongPairs.value.includes(key)) {
      wrongPairs.value = [...wrongPairs.value, key]
      mistakes.value++
    }
    const n = (wobble.value?.n ?? 0) + 1
    wobble.value = { card, person, n }
    play('wrong')
    say(t('app.adventure.helpWrong'))
    later(() => {
      if (wobble.value?.n === n) wobble.value = null
    }, 1700)
    return
  }
  helped.value = [...helped.value, person]
  solved.value++
  wobble.value = null
  progress.mark()
  play('right')
  if (helped.value.length >= active.value.length) {
    say(t('app.adventure.helpRoundDone'), 0)
    solve()
    return
  }
  say(t('app.adventure.helpGlad'), 2200)
}

// ---- dragging a card: the ghost follows the finger, a drop is checked against the people on the screen
const ghost = ref<{ card: HelpNeed; x: number; y: number } | null>(null)
let drag: { card: HelpNeed; x: number; y: number; moved: boolean } | null = null
let skipClick = false

/** The person under the point, or null. */
function personAt(x: number, y: number): HelpNeed | null {
  const els = field.value?.querySelectorAll<HTMLElement>('[data-person]')
  if (!els) return null
  for (const el of Array.from(els)) if (pointIn(el.getBoundingClientRect(), x, y, 6)) return el.dataset.person as HelpNeed
  return null
}
function onMove(e: PointerEvent) {
  if (!drag) return
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true
  if (!drag.moved) return
  const box = root.value?.getBoundingClientRect()
  ghost.value = { card: drag.card, x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) }
}
function stopDrag(e?: PointerEvent) {
  const d = drag
  drag = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  ghost.value = null
  if (!d?.moved) return
  skipClick = true
  later(() => (skipClick = false), 80)
  if (e && e.type === 'pointerup') {
    const person = personAt(e.clientX, e.clientY)
    if (person) give(d.card, person)
  }
}
function down(e: PointerEvent, card: HelpNeed) {
  if (e.button > 0 || busy.value || finished.value) return
  e.preventDefault()
  skipClick = false
  drag = { card, x: e.clientX, y: e.clientY, moved: false }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

/** A tap (or Enter) on a card chooses it; then a tap on a person gives it. */
function tapCard(card: HelpNeed) {
  if (skipClick) {
    skipClick = false
    return
  }
  if (busy.value || finished.value) return
  selected.value = selected.value === card ? null : card
  play('tap')
  if (selected.value) say(t('app.adventure.helpChoose', { name: cardOf(card).cardLabel }), 3200)
}
function tapPerson(p: HelpPerson) {
  if (skipClick) {
    skipClick = false
    return
  }
  if (!selected.value) {
    say(t(isGlad(p) ? 'app.adventure.helpAlready' : 'app.adventure.helpTakeFirst'))
    return
  }
  give(selected.value, p.id)
}
const personLabel = (p: HelpPerson) => t(isGlad(p) ? 'app.adventure.helpPersonGlad' : 'app.adventure.helpPerson', { name: p.label })
</script>

<template lang="pug">
  div(ref="root" class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.village)})` }"
        role="group"
        :aria-label="t('app.adventure.helpField')"
      )
        template(v-for="p in visible" :key="p.id")
          component(
            :is="isGlad(p) ? 'div' : 'button'"
            class="gm-person"
            :class="{ glad: isGlad(p), ready: !isGlad(p) && selected, wobble: wobble && wobble.person === p.id }"
            :data-person="p.id"
            :style="personStyle(p)"
            :type="isGlad(p) ? undefined : 'button'"
            :role="isGlad(p) ? 'img' : undefined"
            :aria-label="personLabel(p)"
            @click="tapPerson(p)"
          )
            span(:key="wobble && wobble.person === p.id ? wobble.n : 0" class="gm-person-in")
              GameImage(:src="isGlad(p) ? p.glad : p.image" :ratio="game.ratio" :colour="isGlad(p) ? '#8bb86a' : '#b08a6a'" :label="p.label")
            span(v-if="isGlad(p)" class="gm-mark" aria-hidden="true")
              GameMark(kind="good")
            span(v-else-if="wobble && wobble.person === p.id" class="gm-mark" aria-hidden="true")
              GameMark(kind="bad")
          span(v-if="helped.includes(p.id) || before.some((b) => b.id === p.id)" class="gm-given" :style="givenStyle(p)" aria-hidden="true")
            GameImage(:src="p.card" :ratio="0.75" colour="#e8d9a8" :label="p.cardLabel")
      div(class="gm-cards" role="group" :aria-label="t('app.adventure.helpCards')")
        button(
          v-for="c in row"
          :key="c.id"
          type="button"
          class="gm-card"
          :class="{ on: selected === c.id, wobble: wobble && wobble.card === c.id }"
          :aria-pressed="selected === c.id"
          :aria-label="t('app.adventure.helpCard', { name: c.cardLabel })"
          @pointerdown="down($event, c.id)"
          @click="tapCard(c.id)"
        )
          span(:key="wobble && wobble.card === c.id ? wobble.n : 0" class="gm-card-in")
            GameImage(:src="c.card" :ratio="0.75" colour="#e8d9a8" :label="c.cardLabel")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.helpCount', { n: solved, total }) }}
      p(class="gm-fb" role="status") {{ message }}
      div(v-if="ghost" class="gm-ghost" :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }" aria-hidden="true")
        GameImage(:src="cardOf(ghost.card).card" :ratio="0.75" colour="#e8d9a8")
    GameDone(v-else :stars="stars" :text="t('app.adventure.helpDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  position: relative
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
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
  background-color: #cdb98a
  background-size: cover
  background-position: center

// the people stand on their lower edge; the ones who need something are buttons (at least 44 pixels)
.gm-person
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  z-index: 2
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))
  -webkit-tap-highlight-color: transparent

  &:not(.glad)
    cursor: pointer

  &.ready
    animation: gm-ready 900ms ease-in-out infinite

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

.gm-person-in
  display: block

.gm-person.wobble .gm-person-in
  animation: gm-wobble 480ms ease-in-out

.gm-mark
  position: absolute
  right: -6px
  top: -4px
  z-index: 6
  pointer-events: none

// the card that stays with the person
.gm-given
  position: absolute
  display: block
  width: 7%
  transform: translate(-50%, -100%)
  z-index: 3
  pointer-events: none
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.45))

.gm-cards
  display: flex
  justify-content: center
  align-items: flex-end
  gap: 12px
  flex-wrap: wrap
  min-height: 92px

.gm-card
  display: block
  width: 76px
  min-height: 44px
  padding: 0
  border: 3px solid #d4a83e
  border-radius: 10px
  background: #fff6dc
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 2px 5px rgba(40, 25, 5, 0.35)

  &.on
    border-color: #2f7d4a
    box-shadow: 0 0 0 3px rgba(47, 125, 74, 0.45)

  &:focus-visible
    outline: 3px solid #5f4f35
    outline-offset: 2px

.gm-card.wobble .gm-card-in
  animation: gm-wobble 480ms ease-in-out

.gm-card-in
  display: block

.gm-ghost
  position: absolute
  z-index: 20
  width: 72px
  transform: translate(-50%, -50%)
  pointer-events: none
  opacity: 0.92
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.5))

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

@keyframes gm-ready
  0%, 100%
    scale: 1
  50%
    scale: 1.04

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  25%
    rotate: -9deg
  55%
    rotate: 7deg
  80%
    rotate: -3deg

// less motion: nothing pulses or wobbles
@media (prefers-reduced-motion: reduce)
  .gm-person.ready, .gm-person.wobble .gm-person-in, .gm-card.wobble .gm-card-in
    animation: none
</style>
