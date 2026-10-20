<script setup lang="ts">
/**
 * The light through the rings: against the darkened picture lie rings inside each other round a hub with a golden star. Each ring has a gap at the top when it stands right; at the start
 * the rings are turned. The child turns a ring with a finger (drag round in a circle) or with the arrows next to it; each step is a twelfth of a turn. When a ring stands right its gap
 * glimmers and the beam of light grows from the hub outwards; when all stand right the light shines all the way through. Round 1: three rings, each alone. Round 2: four rings, joined in
 * pairs: turning the first of a pair turns the second the other way (a gear shows it). There is no mistake; "Tip" shows the ring to turn next (a tip), "Start again" puts the rings back (it
 * counts like a tip). No clock. The turning is `rotateRing`, the shortest way `solveRings` in `utils/abrahamGames.ts`. From the keyboard: Tab chooses a ring, the arrow keys turn it.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { alignedCount, isAligned, rotateRing, solveRings } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RingsGame } from '@/types/adventure'

const props = defineProps<{ game: RingsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every ring of every round that comes to stand right
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.start.length, 0))

/** The width of the rings from outside to inside and of the hub, in percent of the width of the biggest ring (900, 740, 580, 420 and 240 pixels). */
const SIZES = [100, 82.2, 64.4, 46.7]
const HUB = 26.7
/** A twelfth of a turn in degrees. */
const STEP = 30
/** Stand-in colours of the rings until the pictures are there. */
const COLOURS = ['#b79a6b', '#a98a5a', '#9a7c4d', '#8a6d42']

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const state = ref<number[]>(current.value.start.slice())
const best = ref(0)
const tips = ref(0)
const restarts = ref(0)
const hinted = ref<number | null>(null)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const stars = computed(() => mistakeStars(tips.value + restarts.value, 1, 3))
const aligned = computed(() => alignedCount(state.value))
const total = computed(() => state.value.length)
const rings = computed(() => state.value.map((s, i) => ({ i, s, image: props.game.rings[i] ?? '', size: SIZES[i] ?? 40, right: s % 12 === 0 })))
/** The partner a ring drives (the ring that turns the other way with it), or -1. */
const drives = (ring: number) => current.value.couple.find(([a]) => a === ring)?.[1] ?? -1
const beamStyle = computed(() => ({ transform: `translateX(-50%) scaleY(${total.value ? aligned.value / total.value : 0})`, opacity: aligned.value ? '1' : '0', transition: still ? 'none' : undefined }))

function turn(ring: number, steps: number) {
  if (between.value || finished.value || !steps) return
  state.value = rotateRing(state.value, ring, steps, current.value.couple)
  hinted.value = null
  message.value = ''
  play('tap')
  check()
}

function check() {
  const count = alignedCount(state.value)
  for (let i = best.value; i < count; i++) progress.mark()
  best.value = Math.max(best.value, count)
  if (isAligned(state.value)) {
    play('star')
    message.value = t('app.adventure.ringsRight')
    roundOver()
  }
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    state.value = current.value.start.slice()
    best.value = 0
    between.value = false
    message.value = ''
  }, 2000)
}

// turning with a finger: the angle round the hub, in whole twelfths
let drag: { ring: number; last: number; acc: number; applied: number } | null = null
const angleOf = (e: PointerEvent) => {
  const r = field.value?.getBoundingClientRect()
  if (!r) return 0
  return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
}
function stopDrag() {
  drag = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function onMove(e: PointerEvent) {
  if (!drag) return
  const a = angleOf(e)
  drag.acc += ((a - drag.last + 540) % 360) - 180
  drag.last = a
  const steps = Math.round(drag.acc / STEP)
  if (steps !== drag.applied) {
    turn(drag.ring, steps - drag.applied)
    drag.applied = steps
  }
}
function down(e: PointerEvent, ring: number) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  drag = { ring, last: angleOf(e), acc: 0, applied: 0 }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)

function key(e: KeyboardEvent, ring: number) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') turn(ring, 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') turn(ring, -1)
  else return
  e.preventDefault()
}

function showTip() {
  if (between.value || finished.value || hinted.value !== null) return
  const way = solveRings(state.value, current.value.couple)
  if (!way?.length) return
  tips.value++
  hinted.value = way[0]!.ring
  message.value = t('app.adventure.ringsTip', { n: way[0]!.ring + 1 })
  later(() => {
    hinted.value = null
  }, 3000)
}

function again() {
  if (between.value || finished.value) return
  restarts.value++
  state.value = current.value.start.slice()
  hinted.value = null
  message.value = ''
}

const ringStyle = (r: { s: number; size: number }) => ({ width: `${r.size}%`, transform: `translate(-50%, -50%) rotate(${r.s * STEP}deg)`, transition: still ? 'none' : undefined })
const ringLabel = (r: { i: number; right: boolean }) => t(r.right ? 'app.adventure.ringsRingRight' : 'app.adventure.ringsRingWrong', { n: r.i + 1 })
</script>

<template lang="pug">
  div(class="rn")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="rn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="rn-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(ref="field" class="rn-field" role="group" :aria-label="t('app.adventure.ringsField', { n: aligned, total })" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="rn-beam" :style="beamStyle" aria-hidden="true")
          GameImage(:src="game.beam" :ratio="260 / 520" colour="#ffe9a0")
        template(v-if="!between")
          span(
            v-for="r in rings"
            :key="`${round}-${r.i}`"
            class="rn-ring"
            :class="{ right: r.right, hint: hinted === r.i }"
            :style="ringStyle(r)"
            role="button"
            tabindex="0"
            :aria-label="ringLabel(r)"
            @pointerdown="down($event, r.i)"
            @keydown="key($event, r.i)"
          )
            GameImage(:src="r.image" :colour="COLOURS[r.i]" round notch)
        span(class="rn-hub" aria-hidden="true")
          GameImage(:src="game.hub" colour="#f0c860" round)
      p(class="rn-fb" role="status") {{ message }}
      ul(class="rn-controls")
        li(v-for="r in rings" :key="`${round}-c-${r.i}`" class="rn-row" :class="{ hint: hinted === r.i }")
          span(class="rn-label") {{ t('app.adventure.ringsRing', { n: r.i + 1 }) }}
            span(v-if="drives(r.i) >= 0" class="rn-gear") {{ t('app.adventure.ringsJoined', { n: drives(r.i) + 1 }) }}
          button(type="button" class="rn-btn" :disabled="between" :aria-label="t('app.adventure.ringsLeft', { n: r.i + 1 })" @click="turn(r.i, -1)") ↺
          button(type="button" class="rn-btn" :disabled="between" :aria-label="t('app.adventure.ringsRightTurn', { n: r.i + 1 })" @click="turn(r.i, 1)") ↻
      div(class="rn-actions")
        AdvButton(tone="blau" :disabled="between || hinted !== null" @click="showTip") {{ t('app.adventure.ringsTipButton') }}
        AdvButton(tone="blau" :disabled="between" @click="again") {{ t('app.adventure.ringsAgain') }}
      p(class="rn-count") {{ t('app.adventure.ringsCount', { n: aligned, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.ringsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.rn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.rn-round
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

.rn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the picture of the stage, darkened so that the light shines
.rn-field
  position: relative
  width: 100%
  max-width: 420px
  aspect-ratio: 1
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #2b2540
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 0 999px rgba(15, 12, 35, 0.62)

.rn-beam
  position: absolute
  left: 50%
  bottom: 50%
  width: 28.9%
  transform-origin: 50% 100%
  transition: transform 500ms ease, opacity 300ms ease
  pointer-events: none
  z-index: 1

.rn-ring
  position: absolute
  left: 50%
  top: 50%
  display: block
  aspect-ratio: 1
  border-radius: 50%
  cursor: grab
  touch-action: none
  transition: transform 250ms ease
  pointer-events: auto

  &.right
    filter: drop-shadow(0 0 6px rgba(255, 224, 120, 0.95))

  &.hint
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1))

  // the rings are the picture's pointer targets, not their images
  :deep(.gi)
    pointer-events: none

.rn-hub
  position: absolute
  left: 50%
  top: 50%
  width: 26.7%
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3

.rn-fb
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

.rn-controls
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr))
  gap: 8px
  margin: 0
  padding: 0
  list-style: none

.rn-row
  display: flex
  align-items: center
  gap: 8px
  padding: 4px 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.9)

  &.hint
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

.rn-label
  flex: 1
  display: flex
  flex-direction: column
  font-weight: 800
  color: #3f321b

.rn-gear
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.rn-btn
  width: 48px
  height: 48px
  border-radius: 50%
  border: 3px solid #d4a83e
  background: #fff3cf
  color: #3f321b
  font-size: 1.5rem
  font-weight: 800
  cursor: pointer

  &:disabled
    opacity: 0.6

.rn-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.rn-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@media (prefers-reduced-motion: reduce)
  .rn-ring, .rn-beam
    transition: none
</style>
