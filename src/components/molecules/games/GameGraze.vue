<script setup lang="ts">
/**
 * Lead the lambs (John 21,15-17). A green hillside above the lake: at the left the shepherd, in front of him lambs (and sheep) wait on the meadow, at the right stands the pen with the open gate. The finger moves the shepherd
 * (a drag, a tap on the meadow where he is to walk, or the arrow keys); an animal that is near enough to him joins and walks after him in a line, slow sheep a little slower. He leads them into the pen: whoever stands
 * in the pen has been tended (a tick and a soft "baa" sign). A thornbush stops an animal that walks into it: it stands, bleats (a cross, a mistake) and must be called again (the shepherd goes to it); from then on it
 * walks round the thorns. In round 2 a brook runs through the middle: neither the shepherd nor the animals walk through the water, they cross on the plank bridge. A shepherd who walks too fast leaves a slow sheep behind
 * (no mistake, he goes back to it). There is no clock. The title of a round is the word of Jesus to Peter. Whoever does not know where to go gets the button "Help me" after twenty seconds.
 * Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { grazeDone, grazeHelpTarget, grazeNudge, grazePennedCount, grazeStart, grazeStep, osterClamp, osterDist, osterStars } from '@/utils/osternGames'
import type { GrazeAnimal, GrazeState, Pt } from '@/utils/osternGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GrazeGame } from '@/types/adventure'

const props = defineProps<{ game: GrazeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every animal of every round in the pen
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.animals.length, 0))

const TICK = 0.05
const IDLE_SECONDS = 20
const STALL_SECONDS = 0.8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<GrazeState>(grazeStart(props.game, 0))
const target = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const solved = ref(false)
const message = ref('')
let messageSeq = 0
let stall = 0
let waterSaid = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const stream = computed(() => current.value.stream === true)
const meadow = computed(() => (stream.value && props.game.meadowStream ? props.game.meadowStream : props.game.meadow))
const penned = computed(() => grazePennedCount(st.value))
const kindOf = (id: string) => props.game.kinds.find((k) => k.id === id) ?? props.game.kinds[0]!

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function solve() {
  solved.value = true
  between.value = true
  target.value = null
  play('right')
  say(t('app.adventure.grazeAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    st.value = grazeStart(props.game, round.value)
    target.value = null
    solved.value = false
    between.value = false
    idle.value = 0
    stall = 0
    message.value = ''
  }, 3000)
}

function tick() {
  if (!finished.value && !between.value) {
    const res = grazeStep(props.game, round.value, st.value, target.value, TICK)
    st.value = res.state
    waterSaid = Math.max(0, waterSaid - TICK)
    for (const ev of res.events) {
      if (ev.type === 'join') {
        play('tap')
        say(t(ev.recalled ? 'app.adventure.grazeCall' : 'app.adventure.grazeJoin'), 2000)
      } else if (ev.type === 'stuck') {
        mistakes.value++
        play('wrong')
        say(t('app.adventure.grazeStuck'), 3200)
      } else if (ev.type === 'penned') {
        progress.mark()
        play('snap')
        later(() => play('bead'), 160)
        if (!grazeDone(res.state)) say(t('app.adventure.grazePenned'), 1800)
      } else if (ev.type === 'lost') {
        say(t('app.adventure.grazeLost'), 3200)
      } else if (ev.type === 'blocked' && waterSaid <= 0) {
        waterSaid = 4
        say(t('app.adventure.grazeWater'), 3200)
      }
    }
    // the shepherd has come where the finger sent him; or the water stops him
    const h = st.value.hirte
    if (target.value) {
      if (osterDist(h, target.value) < 0.3) {
        target.value = null
        stall = 0
      } else if (!h.moving) {
        stall += TICK
        if (stall > STALL_SECONDS) {
          target.value = null
          stall = 0
          if (stream.value && waterSaid <= 0) {
            waterSaid = 4
            say(t('app.adventure.grazeWater'), 3200)
          }
        }
      } else stall = 0
    }
    idle.value += TICK
    if (!solved.value && grazeDone(st.value)) solve()
  }
  later(tick, TICK * 1000)
}
later(tick, TICK * 1000)

// ---- the finger moves the shepherd (a drag, or a tap where he is to walk)
let dragging = false

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return osterClamp({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  const p = pointAt(e)
  if (p) target.value = p
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  stall = 0
  target.value = p
  dragging = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (finished.value || between.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (!a) return
  e.preventDefault()
  idle.value = 0
  stall = 0
  target.value = grazeNudge(st.value.hirte, a[0], a[1])
}

/** The button for those who do not know where to go: the shepherd walks to the animal that is not with him, or to the pen. */
function helpMe() {
  idle.value = 0
  stall = 0
  target.value = grazeHelpTarget(props.game, st.value)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const spotStyle = (x: number, y: number, w: number) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, zIndex: z(y) })
const penStyle = computed(() => ({ left: `${props.game.pen.x}%`, top: `${props.game.pen.y}%`, width: `${props.game.pen.w}%`, zIndex: 3 }))
const bridgeStyle = computed(() => ({ left: `${props.game.bridge.x}%`, top: `${props.game.bridge.y}%`, width: `${props.game.bridge.w}%`, zIndex: 4 }))
const hirteStyle = computed(() => spotStyle(st.value.hirte.x, st.value.hirte.y, props.game.hirte.w))
const animalStyle = (a: GrazeAnimal) => spotStyle(a.x, a.y, kindOf(a.kind).w)
const targetStyle = computed(() => ({ left: `${target.value?.x ?? 0}%`, top: `${target.value?.y ?? 0}%` }))
const animalLabel = (a: GrazeAnimal) =>
  `${kindOf(a.kind).label}: ${t(a.mode === 'penned' ? 'app.adventure.grazeStatePenned' : a.mode === 'stuck' ? 'app.adventure.grazeStateStuck' : a.mode === 'follow' ? 'app.adventure.grazeStateFollow' : 'app.adventure.grazeStateIdle')}`
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-title") {{ current.title }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(meadow)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.grazeField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-pen" :style="penStyle" role="img" :aria-label="game.pen.label")
          GameImage(:src="game.pen.image" :ratio="1.5" colour="#a98b5a" :label="game.pen.label")
        div(v-if="stream" class="gm-bridge" :style="bridgeStyle" role="img" :aria-label="game.bridge.label")
          GameImage(:src="game.bridge.image" :ratio="2" colour="#9a7a4a" :label="game.bridge.label")
        template(v-for="(b, k) in current.thorns" :key="`thorn-${round}-${k}`")
          div(class="gm-thorn" :style="spotStyle(b.x, b.y, game.thorn.w)" role="img" :aria-label="game.thorn.label")
            GameImage(:src="game.thorn.image" :ratio="1.1" colour="#5d6b3a" :label="game.thorn.label")
        div(v-if="target" class="gm-target" :style="targetStyle" aria-hidden="true")
        template(v-for="(a, i) in st.animals" :key="`animal-${round}-${i}`")
          div(class="gm-animal" :class="[a.mode, { walking: a.moving }]" :data-animal="i" :style="animalStyle(a)" role="img" :aria-label="animalLabel(a)")
            span(class="gm-flip" :style="{ transform: `scaleX(${a.face})` }")
              GameImage(:src="kindOf(a.kind).image" :ratio="1.1" colour="#f1ead6" :label="kindOf(a.kind).label")
            span(v-if="a.mode === 'stuck'" class="gm-sign bad" aria-hidden="true")
              GameMark(kind="bad")
              span(class="gm-baa") {{ t('app.adventure.grazeBaa') }}
            span(v-else-if="a.mode === 'penned'" class="gm-sign good" aria-hidden="true")
              GameMark(kind="good")
              span(class="gm-baa soft") {{ t('app.adventure.grazeBaaSoft') }}
        div(class="gm-hirte" :class="{ walking: st.hirte.moving }" :style="hirteStyle" role="img" :aria-label="game.hirte.label")
          span(class="gm-flip" :style="{ transform: `scaleX(${st.hirte.face})` }")
            GameImage(:src="game.hirte.image" :ratio="0.55" colour="#7d8fa3" :label="game.hirte.label")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.grazeCount', { n: penned, total: st.animals.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.grazeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.grazeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #dfe9c4
  box-shadow: inset 0 0 18px rgba(50, 70, 20, 0.25)
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
  color: #4a5a2c

.gm-title
  margin: 0
  text-align: center
  font-weight: 900
  font-size: 1.2rem
  color: #3f4f22

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #4a5a2c

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fb35a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-pen, .gm-bridge, .gm-thorn, .gm-animal, .gm-hirte
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(30, 40, 10, 0.4))

.gm-flip
  display: block

// the animals and the shepherd move a little step by step
.gm-animal, .gm-hirte
  transition: left 50ms linear, top 50ms linear

  &.walking .gm-flip
    animation: gm-step 360ms ease-in-out infinite

.gm-animal.penned
  transition: left 600ms ease-in-out, top 600ms ease-in-out

.gm-animal.stuck
  animation: gm-shake 700ms ease-in-out 2

.gm-sign
  position: absolute
  left: 50%
  top: -34px
  display: flex
  align-items: center
  gap: 2px
  transform: translateX(-50%)
  white-space: nowrap
  pointer-events: none
  z-index: 30

.gm-baa
  padding: 0 8px
  border-radius: 999px
  border: 2px solid #fff
  background: #d63031
  color: #fff
  font-weight: 900
  font-size: 0.85rem

  &.soft
    background: rgba(255, 250, 235, 0.95)
    border-color: #2fae54
    color: #3f4f22

// where the finger sent the shepherd: a ring, at least 44 pixels across
.gm-target
  position: absolute
  width: 44px
  height: 44px
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(255, 246, 220, 0.2)
  pointer-events: none
  z-index: 2

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #4a5a2c

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f4f22
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -6%

@keyframes gm-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -6deg
  75%
    rotate: 6deg

// less motion: nothing hops or shakes, the walkers move without gliding
@media (prefers-reduced-motion: reduce)
  .gm-animal.walking .gm-flip, .gm-hirte.walking .gm-flip, .gm-animal.stuck
    animation: none

  .gm-animal, .gm-hirte, .gm-animal.penned
    transition: none
</style>
