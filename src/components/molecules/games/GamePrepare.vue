<script setup lang="ts">
/**
 * Prepare the way (Matthew 21,7-8). A road on the Mount of Olives with five bare places; at the left waits the donkey with the foal, Jesus sits on her; at the edge stand the people with palm branches,
 * far at the right the city gate. Under the road lie three piles: cloaks, branches and stones. The finger drags a cloak or branches onto a bare place (or taps the pile and then the place, or Enter on both) and the donkey
 * walks on to it; the people cry "Hosanna!" (a palm sign). A stone does not belong on the road: it wobbles, a cross, a word, and it jumps back (a mistake without loss). A cloak or branches on a place that is covered
 * already does not work (no mistake). When the road is covered the donkey walks through the gate, the round is done. Round 1 uses three places, round 2 all five; there the donkey walks on slowly by itself and waits at
 * the next bare place (nothing is lost by waiting). Nothing is shown by colour alone (tick, cross, words). Stars: `weekStars(mistakes, rounds)` in `utils/letzteWocheGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { pointIn, prepareDonkeyAt, prepareDrop, prepareReach, prepareSprite, prepareUsed, weekStars } from '@/utils/letzteWocheGames'
import type { PileKind } from '@/utils/letzteWocheGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PrepareGame, WeekSprite } from '@/types/adventure'

const props = defineProps<{ game: PrepareGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every place of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + prepareUsed(props.game, r).length, 0))

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const used = computed(() => prepareUsed(props.game, current.value))
/** Which of the used places are covered (in the order of the places from the left). */
const covered = ref<boolean[]>(used.value.map(() => false))
/** What lies on each used place (cloak or branches, and the picture). */
const laid = ref<(WeekSprite | null)[]>(used.value.map(() => null))
const cloakN = ref(0)
const branchN = ref(0)
const selected = ref<PileKind | null>(null)
const wobble = ref<{ spot: number; n: number } | null>(null)
const hosanna = ref(0)
const mistakes = ref(0)
const finished = ref(false)
const gateReached = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => weekStars(mistakes.value, props.game.rounds.length))
const reach = computed(() => prepareReach(covered.value))
const coveredCount = computed(() => covered.value.filter(Boolean).length)
const complete = computed(() => covered.value.length > 0 && covered.value.every(Boolean))
const donkeyAt = computed(() => prepareDonkeyAt(props.game, current.value, covered.value))
const donkeyStyle = computed(() => ({
  left: `${donkeyAt.value.x}%`,
  top: `${donkeyAt.value.y}%`,
  width: `${props.game.donkey.w}%`,
  transitionDuration: complete.value ? '1500ms' : current.value.slow ? '2600ms' : '700ms'
}))
const spotStyle = (i: number) => {
  const s = props.game.spots[used.value[i]!]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${props.game.field}%` }
}
const laidStyle = (i: number) => {
  const s = props.game.spots[used.value[i]!]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${laid.value[i]!.w}%` }
}
/** The places of the road that this round does not use already carry something (the people of the road have laid it): branches and cloaks in turn. */
const decoration = computed(() =>
  props.game.spots.flatMap((s, i) => {
    if (used.value.includes(i)) return []
    const sprite = i % 2 === 0 ? props.game.branches[0]! : props.game.cloaks[0]!
    return [{ i, left: `${s.x}%`, top: `${s.y}%`, width: `${sprite.w}%`, sprite }]
  })
)
const piles = computed(() => [
  { kind: 'cloak' as PileKind, sprite: props.game.cloaks[0]!, label: t('app.adventure.preparePileCloak') },
  { kind: 'branch' as PileKind, sprite: props.game.branches[0]!, label: t('app.adventure.preparePileBranch') },
  { kind: 'stone' as PileKind, sprite: props.game.stone, label: t('app.adventure.preparePileStone') }
])
const spotLabel = (i: number) => t(covered.value[i] ? 'app.adventure.prepareSpotCovered' : 'app.adventure.prepareSpot', { n: i + 1, total: used.value.length })

const root = ref<HTMLElement | null>(null)
const field = ref<HTMLElement | null>(null)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The round is done: the donkey goes through the gate, then the next round or the end. */
function solve() {
  gateReached.value = true
  play('right')
  say(t('app.adventure.prepareGate'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1800)
  later(() => {
    round.value++
    covered.value = used.value.map(() => false)
    laid.value = used.value.map(() => null)
    selected.value = null
    wobble.value = null
    gateReached.value = false
    message.value = ''
  }, 3000)
}

/** A pile is put on a used place `i` (index in the order from the left). */
function place(kind: PileKind, i: number) {
  if (finished.value || complete.value) return
  const verdict = prepareDrop(kind, covered.value[i] === true)
  selected.value = null
  if (verdict === 'full') {
    play('tap')
    say(t('app.adventure.prepareFull'))
    return
  }
  if (verdict === 'stone') {
    mistakes.value++
    const n = (wobble.value?.n ?? 0) + 1
    wobble.value = { spot: i, n }
    play('wrong')
    say(t('app.adventure.prepareStone'))
    later(() => {
      if (wobble.value?.n === n) wobble.value = null
    }, 1700)
    return
  }
  const sprite = prepareSprite(props.game, kind, kind === 'cloak' ? cloakN.value : branchN.value)
  if (kind === 'cloak') cloakN.value++
  else branchN.value++
  covered.value = covered.value.map((c, k) => (k === i ? true : c))
  laid.value = laid.value.map((l, k) => (k === i ? sprite : l))
  wobble.value = null
  hosanna.value++
  progress.mark()
  play('snap')
  later(() => play('bead'), 180)
  if (covered.value.every(Boolean)) {
    later(solve, 700)
    return
  }
  say(t('app.adventure.prepareLaid'), 1800)
}

// ---- dragging a pile: the ghost follows the finger, a drop is checked against the places on the screen
const ghost = ref<{ kind: PileKind; x: number; y: number } | null>(null)
let drag: { kind: PileKind; x: number; y: number; moved: boolean } | null = null
let skipClick = false

/** The index of the place under the point, or -1. */
function spotAt(x: number, y: number): number {
  const els = field.value?.querySelectorAll<HTMLElement>('[data-spot]')
  if (!els) return -1
  for (const el of Array.from(els)) if (pointIn(el.getBoundingClientRect(), x, y, 8)) return Number(el.dataset.spot)
  return -1
}
function onMove(e: PointerEvent) {
  if (!drag) return
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true
  if (!drag.moved) return
  const box = root.value?.getBoundingClientRect()
  ghost.value = { kind: drag.kind, x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) }
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
    const i = spotAt(e.clientX, e.clientY)
    if (i >= 0) place(d.kind, i)
  }
}
function down(e: PointerEvent, kind: PileKind) {
  if (e.button > 0 || finished.value || complete.value) return
  e.preventDefault()
  skipClick = false
  drag = { kind, x: e.clientX, y: e.clientY, moved: false }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

/** A tap (or Enter) on a pile chooses it; then a tap on a place puts it there. */
function tapPile(kind: PileKind) {
  if (skipClick) {
    skipClick = false
    return
  }
  if (finished.value || complete.value) return
  selected.value = selected.value === kind ? null : kind
  play('tap')
  if (selected.value) say(t('app.adventure.prepareChoose', { name: piles.value.find((p) => p.kind === kind)!.label }), 3200)
}
function tapSpot(i: number) {
  if (skipClick) {
    skipClick = false
    return
  }
  if (!selected.value) {
    say(t(covered.value[i] ? 'app.adventure.prepareFull' : 'app.adventure.prepareTakeFirst'))
    return
  }
  place(selected.value, i)
}
</script>

<template lang="pug">
  div(ref="root" class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.road)})` }"
        role="group"
        :aria-label="t('app.adventure.prepareField')"
      )
        div(class="gm-gate" :style="{ left: `${game.gate.x}%`, top: `${game.gate.y}%`, width: `${game.gate.w}%` }" role="img" :aria-label="game.gate.label")
          GameImage(:src="game.gate.image" :ratio="0.8" colour="#a99677" :label="game.gate.label")
        div(class="gm-crowd" :class="{ cheer: hosanna > 0 }" :key="`crowd-${hosanna}`" :style="{ left: `${game.crowd.x}%`, top: `${game.crowd.y}%`, width: `${game.crowd.w}%` }" role="img" :aria-label="game.crowd.label")
          GameImage(:src="game.crowd.image" :ratio="1.6" colour="#8a7a4a" :label="game.crowd.label")
        span(v-if="hosanna > 0" :key="`hos-${hosanna}`" class="gm-hosanna" :style="{ left: `${game.crowd.x}%`, top: `${Math.max(4, game.crowd.y - 22)}%` }" aria-hidden="true") 🌿 {{ t('app.adventure.prepareHosanna') }}
        template(v-for="d in decoration" :key="`deco-${d.i}`")
          div(class="gm-laid deco" :style="{ left: d.left, top: d.top, width: d.width }" aria-hidden="true")
            GameImage(:src="d.sprite.image" :ratio="1.4" colour="#8fae5a" :label="d.sprite.label")
        template(v-for="(u, i) in used" :key="`spot-${round}-${i}`")
          div(v-if="covered[i] && laid[i]" class="gm-laid" :data-spot="i" :style="laidStyle(i)" role="img" :aria-label="spotLabel(i)" @click="tapSpot(i)")
            GameImage(:src="laid[i].image" :ratio="1.4" colour="#c46a4a" :label="laid[i].label")
            span(class="gm-mark" aria-hidden="true")
              GameMark(kind="good")
          button(
            v-else
            type="button"
            class="gm-spot"
            :class="{ ready: selected && selected !== 'stone', wobble: wobble && wobble.spot === i }"
            :data-spot="i"
            :style="spotStyle(i)"
            :aria-label="spotLabel(i)"
            @click="tapSpot(i)"
          )
            span(:key="wobble && wobble.spot === i ? wobble.n : 0" class="gm-spot-in")
            span(v-if="wobble && wobble.spot === i" class="gm-mark" aria-hidden="true")
              GameMark(kind="bad")
        div(class="gm-donkey" :class="{ walking: reach > 0 || current.slow }" :style="donkeyStyle" role="img" :aria-label="game.donkey.label")
          GameImage(:src="game.donkey.image" :ratio="1.1" colour="#8a7058" :label="game.donkey.label")
      div(class="gm-piles" role="group" :aria-label="t('app.adventure.preparePiles')")
        button(
          v-for="p in piles"
          :key="p.kind"
          type="button"
          class="gm-pile"
          :class="[p.kind, { on: selected === p.kind }]"
          :aria-pressed="selected === p.kind"
          :aria-label="t('app.adventure.preparePile', { name: p.label })"
          :disabled="complete"
          @pointerdown="down($event, p.kind)"
          @click="tapPile(p.kind)"
        )
          span(class="gm-pile-pic")
            GameImage(:src="p.sprite.image" :ratio="1.2" :colour="p.kind === 'stone' ? '#8d8d86' : p.kind === 'branch' ? '#6f9a3c' : '#c46a4a'" :label="p.sprite.label")
          span(class="gm-pile-name") {{ p.label }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.prepareCount', { n: coveredCount, total: used.length }) }}
      p(class="gm-fb" role="status") {{ message }}
      div(v-if="ghost" class="gm-ghost" :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }" aria-hidden="true")
        GameImage(:src="prepareSprite(game, ghost.kind, ghost.kind === 'cloak' ? cloakN : branchN).image" :ratio="1.2" colour="#c46a4a")
    GameDone(v-else :stars="stars" :text="t('app.adventure.prepareDone')" @next="emit('done', stars)")
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
  background-color: #c9b88a
  background-size: cover
  background-position: center

.gm-gate, .gm-crowd, .gm-donkey
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-gate
  z-index: 1

.gm-crowd
  z-index: 1

  &.cheer
    animation: gm-cheer 700ms ease-in-out 2

.gm-donkey
  z-index: 4
  transition-property: left, top
  transition-timing-function: ease-in-out

.gm-hosanna
  position: absolute
  z-index: 6
  transform: translateX(-50%)
  padding: 2px 12px
  border-radius: 999px
  border: 2px solid #d4a83e
  background: rgba(255, 250, 235, 0.96)
  font-weight: 900
  color: #3f321b
  white-space: nowrap
  pointer-events: none
  animation: gm-pop 1500ms ease-out both

// a place that is laid already (and one the round does not use)
.gm-laid
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  z-index: 2
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.35))

  &.deco
    z-index: 1
    opacity: 0.95
    pointer-events: none

.gm-mark
  position: absolute
  right: -8px
  top: -12px
  z-index: 6
  pointer-events: none

// a bare place: a dashed ring so that it can be found (at least 44 pixels, also with a small picture)
.gm-spot
  position: absolute
  display: block
  min-width: 48px
  min-height: 44px
  aspect-ratio: 1.6 / 1
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(60, 40, 10, 0.12)
  cursor: pointer
  z-index: 3
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &.ready
    border-color: #fff
    background: rgba(255, 246, 220, 0.3)
    animation: gm-ready 900ms ease-in-out infinite

  &.wobble .gm-spot-in
    animation: gm-wobble 480ms ease-in-out

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-spot-in
  position: absolute
  inset: 0
  border-radius: 50%

.gm-piles
  display: flex
  justify-content: center
  gap: 12px
  flex-wrap: wrap

.gm-pile
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-width: 84px
  min-height: 64px
  padding: 6px 10px
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #fff6dc
  color: #3f321b
  font-weight: 800
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &.on
    border-color: #2f7d4a
    box-shadow: 0 0 0 3px rgba(47, 125, 74, 0.45)

  &:disabled
    opacity: 0.5
    cursor: default

  &:focus-visible
    outline: 3px solid #5f4f35
    outline-offset: 2px

.gm-pile-pic
  display: block
  width: 56px

.gm-pile-name
  font-size: 0.9rem

.gm-ghost
  position: absolute
  z-index: 20
  width: 64px
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

@keyframes gm-cheer
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -4%

@keyframes gm-pop
  0%
    opacity: 0
    translate: 0 8px
  15%, 80%
    opacity: 1
    translate: 0 0
  100%
    opacity: 0

@keyframes gm-ready
  0%, 100%
    scale: 1
  50%
    scale: 1.08

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  25%
    rotate: -10deg
  55%
    rotate: 8deg
  80%
    rotate: -4deg

// less motion: nothing cheers, pulses or wobbles, the donkey does not glide
@media (prefers-reduced-motion: reduce)
  .gm-crowd.cheer, .gm-hosanna, .gm-spot.ready, .gm-spot.wobble .gm-spot-in
    animation: none

  .gm-donkey
    transition: none
</style>
