<script setup lang="ts">
/**
 * Cook the soup before Esau comes (Jakob, stage 1): a pot stands on the fireplace in front of Isaac's tent; far away on the road between the fields little Esau appears and walks slowly to the tent. The child taps
 * lentils, water and wood (or drags them to the pot), in any order, until the soup steams: lentils once, water once, wood twice (the fire grows). One round, one idea, one gesture. Nothing is lost: a source that is spent
 * only shakes softly ("That is already in the pot"); when Esau is at the tent first, a kind sentence is said and everything starts again by itself after two seconds, with Esau walking six seconds slower each time
 * (up to 50 seconds; the game does not say so). There is no counter and no hourglass: the road is the clock, Esau's place is all there is. A screen reader hears how far he is (a third, two thirds, nearly there).
 * With reduced motion Esau jumps in six steps and nothing flies. The rules are `stewAdd`, `stewReady`, `potKey`, `esauAt` and `walkDuration` in `utils/jakobStew.ts`. Stars: `mistakeStars(restarts, 1, 3)`.
 * The places of the pictures are percent of the scene (`potAt`, `sources`, `path`); the size of the pot, the logs, the flame, the steam and Esau are set here (CSS) and are to be measured on the painted pictures.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { esauAt, esauSaid, esauScale, fireSize, potKey, stepped, stewAdd, stewCan, stewReady, stewStart, walkDuration, STEW_NEED } from '@/utils/jakobStew'
import type { StewSourceId } from '@/utils/jakobStew'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import type { StewGame } from '@/types/adventure'

const props = defineProps<{ game: StewGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one soup
progress.setGoal(1)

/** One step of Esau's clock (ms) and how far a drag must go before it counts as a drag (pixels). */
const TICK = 250
const DRAG = 12
const SOURCES: StewSourceId[] = ['bowl', 'jug', 'wood']
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const state = ref(stewStart())
const restarts = ref(0)
const elapsed = ref(0)
const phase = ref<'play' | 'simmer' | 'late' | 'done'>('play')
const message = ref('')
const said = ref('')
const wiggle = ref<StewSourceId | null>(null)
const potEl = ref<HTMLElement | null>(null)
const drag = ref<{ id: StewSourceId; dx: number; dy: number } | null>(null)
let startX = 0
let startY = 0
let moved = false
let swallow = false
let spoken = 0

const duration = computed(() => walkDuration(restarts.value, props.game.walkMs, props.game.slowerMs, props.game.maxWalkMs))
const share = computed(() => Math.min(1, elapsed.value / duration.value))
const shown = computed(() => (still ? stepped(share.value) : share.value))
const esau = computed(() => esauAt(props.game.path, shown.value))
const stars = computed(() => mistakeStars(restarts.value, 1, 3))
const key = computed(() => potKey(state.value))
const fire = computed(() => fireSize(state.value))
const ready = computed(() => stewReady(state.value))

const timer = window.setInterval(tick, TICK)
onBeforeUnmount(() => {
  window.clearInterval(timer)
  stopDrag()
})

function tick() {
  if (phase.value !== 'play') return
  elapsed.value += TICK
  const word = esauSaid(share.value)
  const n = word === 'almost' ? 3 : word === 'near' ? 2 : word === 'far' ? 1 : 0
  if (n > spoken) {
    spoken = n
    said.value = t(word === 'almost' ? 'app.adventure.stewAlmost' : word === 'near' ? 'app.adventure.stewNear' : 'app.adventure.stewFar')
  }
  if (elapsed.value >= duration.value) tooLate()
}

/** Esau is at the tent first: a kind sentence, then everything again (no loss, no limit). */
function tooLate() {
  phase.value = 'late'
  message.value = t('app.adventure.stewWait')
  later(restart, 2000)
}

function restart() {
  restarts.value++
  state.value = stewStart()
  elapsed.value = 0
  spoken = 0
  said.value = ''
  message.value = ''
  phase.value = 'play'
}

/** A source is used: it goes into the pot (or shakes softly when it is spent). */
function use(id: StewSourceId) {
  if (phase.value !== 'play') return
  if (!stewCan(state.value, id)) {
    message.value = t('app.adventure.stewAlready')
    wiggle.value = id
    later(() => {
      if (wiggle.value === id) wiggle.value = null
    }, 500)
    return
  }
  message.value = ''
  state.value = stewAdd(state.value, id)
  play('snap')
  if (stewReady(state.value)) {
    phase.value = 'simmer'
    later(finish, props.game.simmerMs)
  }
}

function finish() {
  phase.value = 'done'
  progress.mark()
  play('star')
}

function onClick(id: StewSourceId) {
  if (swallow) return
  use(id)
}

function down(id: StewSourceId, e: PointerEvent) {
  if (phase.value !== 'play' || !stewCan(state.value, id)) return
  startX = e.clientX
  startY = e.clientY
  moved = false
  drag.value = { id, dx: 0, dy: 0 }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', stopDrag)
}

function move(e: PointerEvent) {
  if (!drag.value) return
  drag.value = { ...drag.value, dx: e.clientX - startX, dy: e.clientY - startY }
  if (Math.hypot(drag.value.dx, drag.value.dy) > DRAG) moved = true
}

function up(e: PointerEvent) {
  const d = drag.value
  stopDrag()
  if (!d || !moved) return
  // a drag was no tap: the click that follows is not used a second time
  swallow = true
  window.setTimeout(() => (swallow = false), 0)
  const r = potEl.value?.getBoundingClientRect()
  if (!r || !r.width) return
  const padX = r.width * 0.25
  const padY = r.height * 0.25
  if (e.clientX >= r.left - padX && e.clientX <= r.right + padX && e.clientY >= r.top - padY && e.clientY <= r.bottom + padY) use(d.id)
}

function stopDrag() {
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', stopDrag)
  drag.value = null
}

const label = (id: StewSourceId) => t(id === 'bowl' ? 'app.adventure.stewBowl' : id === 'jug' ? 'app.adventure.stewJug' : 'app.adventure.stewWood')
const spent = (id: StewSourceId) => state.value[id] >= STEW_NEED[id]
const at = (p: [number, number]) => ({ left: `${p[0]}%`, top: `${p[1]}%` })
const COLOURS: Record<StewSourceId, string> = { bowl: '#b5523a', jug: '#6fa3c7', wood: '#8a6a3f' }
const sourceStyle = (id: StewSourceId) => {
  const d = drag.value
  return { ...at(props.game.sources[id].at), ...(d && d.id === id ? { transform: `translate(calc(-50% + ${d.dx}px), calc(-50% + ${d.dy}px))`, zIndex: '20' } : {}) }
}
const esauStyle = computed(() => ({ ...at([esau.value.x, esau.value.y]), transform: `translate(-50%, -100%) scale(${esauScale(shown.value)})` }))
</script>

<template lang="pug">
  div(class="st")
    template(v-if="phase !== 'done'")
      p(class="st-hint") {{ game.hint }}
      div(class="st-field" role="group" :aria-label="t('app.adventure.stewField')")
        span(class="st-scene" aria-hidden="true")
          GameImage(:src="game.scene" :ratio="3 / 4" colour="#cdbb8a")
        span(v-if="fire > 0" class="st-logs" :style="{ left: `${game.potAt[0]}%`, top: `${game.potAt[1] + 12}%` }" aria-hidden="true")
          GameImage(:src="game.logs" :ratio="3" colour="#8a5a2b")
        span(v-if="fire > 0" class="st-flame" :class="{ big: fire === 2, still }" :style="{ left: `${game.potAt[0]}%`, top: `${game.potAt[1] + 14}%` }" aria-hidden="true")
          GameImage(:src="game.flame" :ratio="0.8" colour="#f08a2a")
        span(ref="potEl" class="st-pot" :style="at(game.potAt)" aria-hidden="true")
          GameImage(:src="game.pot[key]" :ratio="1" colour="#7a6f66" round)
        span(v-if="phase === 'simmer'" class="st-steam" :class="{ still }" :style="{ left: `${game.potAt[0]}%`, top: `${game.potAt[1] - 12}%` }" aria-hidden="true")
          GameImage(:src="game.steam" :ratio="1" colour="#ffffff" round)
        span(class="st-esau" :class="{ still }" :style="esauStyle" aria-hidden="true")
          GameImage(:src="game.esau" :ratio="0.6" colour="#c0603a")
        button(
          v-for="id in SOURCES"
          :key="id"
          type="button"
          class="st-src"
          :class="{ spent: spent(id), wiggle: wiggle === id, dragging: drag?.id === id && !!drag }"
          :style="sourceStyle(id)"
          :aria-label="label(id)"
          :aria-disabled="spent(id) ? 'true' : undefined"
          @pointerdown="down(id, $event)"
          @click="onClick(id)"
        )
          GameImage(:src="game.sources[id].image" :ratio="1" :colour="COLOURS[id]")
          GameMark(v-if="spent(id)" kind="good" class="st-tick")
          span(v-if="id === 'wood'" class="st-dots" aria-hidden="true")
            span(v-for="n in 2" :key="n" class="st-dot" :class="{ on: state.wood >= n }")
      p(class="st-fb" role="status") {{ message }}
      p(class="st-sr" aria-live="polite") {{ said }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stewReady')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.st
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.st-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the scene is upright (3 : 4); not wider than a phone, so that it does not grow too high on a big screen
.st-field
  position: relative
  width: 100%
  max-width: 420px
  align-self: center
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdbb8a
  touch-action: manipulation

.st-scene
  position: absolute
  inset: 0
  display: block

  :deep(.gi)
    height: 100%

  :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%
    object-fit: cover

.st-logs
  position: absolute
  display: block
  width: 36%
  transform: translate(-50%, 0)
  z-index: 1
  pointer-events: none

// the flame sits on the logs under the pot; the big one is the same picture 1.6 times as big
.st-flame
  position: absolute
  display: block
  width: 14%
  transform: translate(-50%, -100%) scale(1)
  transform-origin: 50% 100%
  transition: transform 400ms ease-out
  z-index: 2
  pointer-events: none

  &.big
    transform: translate(-50%, -100%) scale(1.6)

  &.still
    transition: none

.st-pot
  position: absolute
  display: block
  width: 32%
  transform: translate(-50%, -50%)
  z-index: 3
  pointer-events: none

.st-steam
  position: absolute
  display: block
  width: 26%
  transform: translate(-50%, -100%)
  z-index: 4
  pointer-events: none
  animation: st-rise 1200ms ease-out infinite

  &.still
    animation: none

// Esau goes slowly; his feet are at the place
.st-esau
  position: absolute
  display: block
  width: 13%
  transform-origin: 50% 100%
  transition: left 250ms linear, top 250ms linear, transform 250ms linear
  z-index: 5
  pointer-events: none

  &.still
    transition: none

.st-src
  position: absolute
  display: block
  width: 24%
  min-width: 64px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  touch-action: none
  z-index: 10
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #1f5fa8
    outline-offset: 3px
    border-radius: 12px

  &.spent
    opacity: 0.5

  &.wiggle
    animation: st-wiggle 400ms ease-in-out

  &.dragging
    cursor: grabbing

.st-tick
  position: absolute
  top: -6px
  right: -6px
  width: 26px
  height: 26px
  font-size: 1rem

.st-dots
  position: absolute
  left: 50%
  bottom: -10px
  display: flex
  gap: 6px
  transform: translateX(-50%)

.st-dot
  width: 12px
  height: 12px
  border-radius: 50%
  border: 2px solid #fff
  background: rgba(60, 40, 10, 0.45)

  &.on
    background: #3f9a4a

.st-fb
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

// said to the screen reader only
.st-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  padding: 0
  overflow: hidden
  clip: rect(0 0 0 0)
  white-space: nowrap
  border: 0

@keyframes st-rise
  0%
    opacity: 0.3
    margin-top: 4px
  60%
    opacity: 1
  100%
    opacity: 0
    margin-top: -14px

@keyframes st-wiggle
  0%, 100%
    margin-left: 0
  25%
    margin-left: -5px
  75%
    margin-left: 5px

@media (prefers-reduced-motion: reduce)
  .st-steam, .st-src.wiggle
    animation: none
  .st-esau, .st-flame
    transition: none
</style>
