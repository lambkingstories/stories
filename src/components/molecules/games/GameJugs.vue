<script setup lang="ts">
/**
 * Water for everybody (Exodus 17,6): the people of Rephidim are thirsty, and water comes out of the rock. The child fills a jug at the rock (a tap on the rock, or the jug is dragged there) and brings it to a thirsty person
 * (a tap on the person, or the jug is dragged there); the person drinks, the jug is empty again. A thirsty person who is tapped with an empty jug is a mistake. The rules are in `utils/wuesteGames2.ts`.
 */
import { computed, reactive, ref } from 'vue'
import GameMark from '@/components/atoms/GameMark.vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { allServed, jugStep, type JugState, type JugTarget } from '@/utils/wuesteGames2'
import type { JugsGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: JugsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.people.length, 0))

const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const state = reactive<JugState>({ jar: 'empty', served: [] })
const misses = ref(0)
const springOn = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const crossAt = ref<number | null>(null)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(progress.parts.value)).replace('{total}', String(progress.goal.value)))

// the jug can be dragged (the layer is the picture field)
const layer = ref<HTMLElement | null>(null)
const drag = reactive({ on: false, moved: false, x: 0, y: 0, sx: 0, sy: 0 })
const pct = (e: PointerEvent) => {
  const r = layer.value?.getBoundingClientRect()
  if (!r || !r.width) return { x: 0, y: 0 }
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function act(target: JugTarget) {
  if (between.value || finished.value) return
  const r = jugStep({ jar: state.jar, served: [...state.served] }, target, current.value.people)
  state.jar = r.state.jar
  state.served = r.state.served
  if (r.result === 'filled') {
    play('tap')
    message.value = t.value.filled
    springOn.value = true
    later(() => {
      springOn.value = false
    }, 1500)
  } else if (r.result === 'full') {
    message.value = t.value.full
  } else if (r.result === 'empty') {
    misses.value++
    play('wrong')
    message.value = t.value.empty
    if (target.kind === 'person') {
      crossAt.value = target.index
      later(() => {
        if (crossAt.value === target.index) crossAt.value = null
      }, 900)
    }
  } else if (r.result === 'served') {
    progress.mark()
    play('right')
    message.value = t.value.served
    if (allServed(state.served, current.value.people)) endRound()
  }
}

function endRound() {
  between.value = true
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    state.served = []
    state.jar = 'empty'
    between.value = false
    message.value = ''
  }, 1600)
}

function down(e: PointerEvent) {
  if (between.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pct(e)
  Object.assign(drag, { on: true, moved: false, x: p.x, y: p.y, sx: p.x, sy: p.y })
}
function move(e: PointerEvent) {
  if (!drag.on) return
  const p = pct(e)
  drag.x = p.x
  drag.y = p.y
  if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 1.5) drag.moved = true
}
function up(e: PointerEvent) {
  if (!drag.on) return
  drag.on = false
  if (!drag.moved) return
  const under = (document.elementsFromPoint?.(e.clientX, e.clientY) ?? []) as HTMLElement[]
  const hit = under.find((el) => el.dataset?.target)
  const id = hit?.dataset.target
  if (id === 'spring') act({ kind: 'spring' })
  else if (id?.startsWith('p')) act({ kind: 'person', index: Number(id.slice(1)) })
}

const jarStyle = computed(() => {
  const j = props.game.jug
  const at = drag.on && drag.moved ? { x: drag.x, y: drag.y + 3 } : { x: j.x, y: j.y }
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${j.w}%` }
})
const springStyle = computed(() => {
  const s = props.game.spring
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }
})
const zoneStyle = computed(() => {
  const z = props.game.spring.zone
  return { left: `${z.x1}%`, top: `${z.y1}%`, width: `${z.x2 - z.x1}%`, height: `${z.y2 - z.y1}%` }
})
const thirsty = computed(() => current.value.people.map((i) => ({ i, p: props.game.people[i]! })))
const labelOf = (i: number) => (state.served.includes(i) ? t.value.drank : t.value.thirsty).replace('{name}', props.game.people[i]!.label)
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
    div(ref="layer" class="gj-layer")
      img(
        v-if="springOn"
        class="gj-spring"
        :src="src(game.spring.image)"
        alt=""
        draggable="false"
        :style="springStyle"
      )
      button(
        type="button"
        class="gj-zone"
        data-target="spring"
        :style="zoneStyle"
        :aria-label="t.spring"
        :disabled="between"
        @click="act({ kind: 'spring' })"
      )
      button(
        v-for="e in thirsty"
        :key="`${round}-${e.p.id}`"
        type="button"
        class="gj-person"
        :class="{ served: state.served.includes(e.i) }"
        :data-target="`p${e.i}`"
        :style="{ left: `${e.p.x}%`, top: `${e.p.y}%`, width: `${e.p.w}%` }"
        :aria-label="labelOf(e.i)"
        :disabled="between"
        @click="act({ kind: 'person', index: e.i })"
      )
        img(:src="src(e.p.image)" alt="" draggable="false")
        span(v-if="state.served.includes(e.i)" class="gj-mark" aria-hidden="true")
          GameMark(kind="good")
        span(v-if="crossAt === e.i" class="gj-mark" aria-hidden="true")
          GameMark(kind="bad")
      button(
        type="button"
        class="gj-jug"
        :class="{ dragging: drag.on && drag.moved }"
        :style="jarStyle"
        :aria-label="t.jug"
        :disabled="between"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="drag.on = false"
      )
        img(:src="src(state.jar === 'full' ? game.jug.full : game.jug.empty)" alt="" draggable="false")
</template>

<style scoped lang="sass">
.gj-layer
  position: absolute
  inset: 0

.gj-spring
  position: absolute
  display: block
  height: auto
  pointer-events: none
  z-index: 2
  animation: gj-pour 1500ms ease-out

.gj-zone
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  z-index: 3
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gj-person
  position: absolute
  display: block
  min-width: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 4
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.35))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.served
    filter: drop-shadow(0 0 8px rgba(120, 200, 255, 0.95))

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gj-mark
  position: absolute
  left: 50%
  top: 8%
  margin-left: -15px
  pointer-events: none

.gj-jug
  position: absolute
  display: block
  min-width: 56px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: grab
  z-index: 6
  touch-action: none
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.dragging
    cursor: grabbing
    scale: 1.12

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

@keyframes gj-pour
  0%
    opacity: 0
    clip-path: inset(0 0 100% 0)
  30%
    opacity: 1
    clip-path: inset(0 0 0 0)
  100%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gj-spring
    animation: none
</style>
