<script setup lang="ts">
/**
 * Raise the sign (Numbers 21,8-9): Moses makes a bronze sign and puts it up on a pole; whoever looks at it lives. Round 1: the pole lies on the ground, the child lifts it (a finger drags the top of the pole up, or a tap
 * lifts it a little each time) until it stands. Round 2: six weak, tired people sit in the camp; a tap on a person and he looks up at the sign, and is strong again. There is nothing to fail: if the finger lets go before
 * the pole is straight, it sinks back (that counts as a mistake for the stars). The angle is in `utils/wuesteGames2.ts`.
 */
import { computed, reactive, ref } from 'vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { poleAngle, poleStands } from '@/utils/wuesteGames2'
import type { SerpentGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: SerpentGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(1 + props.game.people.length)

const START = -76
const STEP = 19
const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const angle = ref(START)
const standing = ref(false)
const lifting = ref(false)
const well = reactive<boolean[]>(props.game.people.map(() => false))
const misses = ref(0)
const finished = ref(false)
const message = ref('')
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(progress.parts.value)).replace('{total}', String(progress.goal.value)))

const layer = ref<HTMLElement | null>(null)
const drag = reactive({ on: false, moved: false, sx: 0, sy: 0 })
const pct = (e: PointerEvent) => {
  const r = layer.value?.getBoundingClientRect()
  if (!r || !r.width) return { x: 0, y: 0 }
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function stand() {
  angle.value = 0
  standing.value = true
  lifting.value = false
  progress.mark()
  play('found')
  message.value = t.value.stands
  later(() => {
    round.value = 1
    message.value = ''
  }, 1700)
}

function lean() {
  misses.value++
  play('wrong')
  message.value = t.value.lean
  angle.value = START
}

function down(e: PointerEvent) {
  if (standing.value || round.value !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pct(e)
  Object.assign(drag, { on: true, moved: false, sx: p.x, sy: p.y })
  lifting.value = true
}
function move(e: PointerEvent) {
  if (!drag.on) return
  const p = pct(e)
  if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 1.5) drag.moved = true
  if (drag.moved) angle.value = poleAngle(props.game.pole.x, props.game.pole.y, p.x, p.y)
}
function up() {
  if (!drag.on) return
  drag.on = false
  lifting.value = false
  if (!drag.moved) {
    // a tap lifts the pole a little
    angle.value = Math.min(0, angle.value + STEP)
    play('tap')
    if (poleStands(angle.value)) stand()
    return
  }
  if (poleStands(angle.value)) stand()
  else lean()
}
function key(e: KeyboardEvent) {
  if (standing.value || round.value !== 0) return
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault()
    angle.value = Math.min(0, angle.value + STEP)
    play('tap')
    if (poleStands(angle.value)) stand()
  }
}

function look(i: number) {
  if (round.value !== 1 || well[i] || finished.value) return
  well[i] = true
  progress.mark()
  play('right')
  message.value = t.value.well.replace('{name}', props.game.people[i]!.label)
  if (well.every(Boolean)) {
    later(() => {
      play('star')
      finished.value = true
    }, 1500)
  }
}

const poleStyle = computed(() => {
  const p = props.game.pole
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, aspectRatio: `1 / ${p.ratio}`, '--a': `${angle.value}deg` }
})
</script>

<template lang="pug">
  WuesteFrame(
    :background="game.background"
    :hint="current.hint"
    :round="round"
    :rounds="game.rounds.length"
    :label="t.field"
    :count="count"
    :message="message"
    :finished="finished"
    :stars="stars"
    :done-text="t.done"
    @next="emit('done', stars)"
  )
    div(ref="layer" class="gp-layer")
      button(
        v-for="(p, i) in game.people"
        v-show="round === 1"
        :key="p.id"
        type="button"
        class="gp-person"
        :class="{ well: well[i] }"
        :style="{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` }"
        :aria-label="(well[i] ? t.well : t.weak).replace('{name}', p.label)"
        :disabled="well[i]"
        @click="look(i)"
      )
        img(:src="src(well[i] ? p.well : p.weak)" alt="" draggable="false")
      button(
        type="button"
        class="gp-pole"
        :class="{ lifting, standing }"
        :style="poleStyle"
        :aria-label="t.pole"
        :disabled="round !== 0"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @keydown="key"
      )
        img(:src="src(game.pole.image)" alt="" draggable="false")
</template>

<style scoped lang="sass">
.gp-layer
  position: absolute
  inset: 0

.gp-pole
  position: absolute
  display: block
  min-width: 36px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%) rotate(var(--a, 0deg))
  transform-origin: 50% 100%
  cursor: grab
  z-index: 5
  touch-action: none
  -webkit-tap-highlight-color: transparent
  transition: transform 700ms ease-in-out
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: 100%
    pointer-events: none

  &.lifting
    transition: none
    cursor: grabbing

  &.standing
    cursor: default
    filter: drop-shadow(0 0 12px rgba(255, 220, 120, 0.95))

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gp-person
  position: absolute
  display: block
  min-width: 52px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 3
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.35))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.well
    cursor: default
    filter: drop-shadow(0 0 8px rgba(255, 230, 140, 0.95))

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

@media (prefers-reduced-motion: reduce)
  .gp-pole
    transition: none
</style>
