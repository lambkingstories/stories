<script setup lang="ts">
/**
 * Trace the roads: from the small unfinished tower in the middle, roads lead out into the wide plain in the morning light, each to another goal (mountains,
 * river, palm grove, hills). The child puts a finger on the road at the tower and follows it; a little walker goes along. At the goal it lights up. When
 * the finger strays far from the road the walker stops (it wobbles gently, a fault) and the child puts the finger down again quietly; nothing is lost.
 * With the keyboard a road can be walked by pressing Enter on it. Round 1: two almost straight roads; round 2: four winding roads. The arithmetic is
 * `advance` in `utils/babelGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { advance, lineLength, pointAt } from '@/utils/babelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { TracePath } from '@/types/adventure'
import type { TraceGame } from '@/types/adventure'

const props = defineProps<{ game: TraceGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every road of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.paths.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** How far the walker has come on each road (percent of the width), and which roads are done. */
const walked = reactive<Record<string, number>>({})
const arrived = reactive<Record<string, boolean>>({})
const lengthOf = (p: TracePath) => lineLength(p.points)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
/** The road the finger is on right now, and whether the finger has strayed (until it is lifted). */
let active: string | null = null
let lost = false

const fieldEl = ref<HTMLElement | null>(null)
function pointOf(e: PointerEvent) {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / h) * 100 }
}

/** The finger moves (or is put down): the walker of the road it follows goes on; with several roads near, the one nearest to the finger. */
function follow(p: { x: number; y: number }) {
  if (between.value || finished.value || lost) return
  const roads = current.value.paths.filter((r) => !arrived[r.id] && (active === null || r.id === active))
  let best: { road: TracePath; progress: number; distance: number } | null = null
  for (const road of roads) {
    const a = advance(road.points, walked[road.id] ?? 0, p, road.r)
    if (a.on) {
      const d = Math.hypot(p.x - pointAt(road.points, a.progress).x, (p.y - pointAt(road.points, a.progress).y) * (4 / 3))
      if (!best || d < best.distance) best = { road, progress: a.progress, distance: d }
    } else if (a.strayed && active === road.id) {
      stray(road)
      return
    }
  }
  if (!best) return
  active = best.road.id
  walked[best.road.id] = best.progress
  if (best.progress >= lengthOf(best.road) - Math.max(2.5, best.road.r)) reach(best.road)
}

function stray(road: TracePath) {
  lost = true
  mistakes.value++
  play('wrong')
  wobble.value = road.id
  message.value = t('app.adventure.traceStray')
  later(() => {
    if (wobble.value === road.id) wobble.value = null
  }, 600)
}

function reach(road: TracePath) {
  arrived[road.id] = true
  walked[road.id] = lengthOf(road)
  active = null
  progress.mark()
  play('found')
  message.value = t('app.adventure.traceArrived', { goal: t(`app.adventure.traceGoal_${road.goal}`) })
  if (current.value.paths.every((r) => arrived[r.id])) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1000)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(walked)) delete walked[k]
    for (const k of Object.keys(arrived)) delete arrived[k]
    between.value = false
    message.value = ''
  }, 1700)
}

function down(e: PointerEvent) {
  if (e.button > 0) return
  lost = false
  active = null
  message.value = ''
  follow(pointOf(e))
}
function move(e: PointerEvent) {
  if (e.buttons === 0 && e.pointerType === 'mouse') return
  follow(pointOf(e))
}
function up() {
  active = null
  lost = false
}
/** For those who cannot trace with a finger: Enter on a road walks it. */
function walkAll(road: TracePath, e: MouseEvent) {
  if (e.detail !== 0 || arrived[road.id] || between.value || finished.value) return
  reach(road)
}

const src = (p: string) => prependBaseUrl(p)
const walkerAt = (road: TracePath) => pointAt(road.points, walked[road.id] ?? 0)
const walkerStyle = (road: TracePath) => ({ left: `${walkerAt(road).x}%`, top: `${walkerAt(road).y}%` })
/** The walker of the picture walks to the right: on a road that leads to the left it is turned round. */
const goesLeft = (road: TracePath) => road.points[road.points.length - 1]![0] < road.points[0]![0]
const goalStyle = (road: TracePath) => {
  const end = road.points[road.points.length - 1]!
  return { left: `${end[0]}%`, top: `${end[1]}%` }
}
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))
const doneCount = computed(() => current.value.paths.filter((r) => arrived[r.id]).length)
</script>

<template lang="pug">
  div(class="tr")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="tr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="tr-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="fieldEl"
        class="tr-field"
        role="group"
        :aria-label="t('app.adventure.traceField')"
        :style="{ backgroundImage: `url(${src(game.scene)})` }"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @pointerleave="up"
      )
        template(v-for="road in current.paths" :key="`${round}-${road.id}`")
          span(class="tr-goal" :class="{ lit: arrived[road.id] }" :style="goalStyle(road)" aria-hidden="true")
          img(:src="src(game.walker)" alt="" draggable="false" class="tr-walker" :class="{ wobble: wobble === road.id, arrived: arrived[road.id], left: goesLeft(road) }" :style="walkerStyle(road)")
        button(
          v-for="road in current.paths"
          :key="`k-${round}-${road.id}`"
          type="button"
          class="tr-key"
          :style="goalStyle(road)"
          :aria-label="t(arrived[road.id] ? 'app.adventure.traceRoadDone' : 'app.adventure.traceRoad', { goal: t(`app.adventure.traceGoal_${road.goal}`) })"
          @click="walkAll(road, $event)"
        )
      p(class="tr-fb" role="status") {{ message }}
      p(class="tr-count") {{ t('app.adventure.traceCount', { n: doneCount, total: current.paths.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.traceFinished')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.tr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.tr-round
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

.tr-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.tr-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center
  touch-action: none
  user-select: none
  -webkit-user-select: none

// the goal at the end of a road: a soft ring that lights up when the walker is there
.tr-goal
  position: absolute
  width: 9%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(255, 255, 255, 0.8)
  pointer-events: none

  &.lit
    border-style: solid
    background: radial-gradient(circle, rgba(255, 244, 180, 0.85) 0%, rgba(255, 220, 120, 0) 72%)
    box-shadow: 0 0 16px rgba(255, 230, 120, 0.9)

.tr-walker
  position: absolute
  width: 9%
  height: auto
  transform: translate(-50%, -90%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 30, 10, 0.5))

  &.left
    scale: -1 1

  &.wobble
    animation: tr-shake 480ms ease-in-out

// a button on every goal for the keyboard (Enter walks the road); it lies over the goal and is not seen
.tr-key
  position: absolute
  width: 11%
  aspect-ratio: 1
  min-width: 44px
  transform: translate(-50%, -50%)
  padding: 0
  border: 0
  border-radius: 50%
  background: transparent
  cursor: default

  &:focus-visible
    outline: 3px solid rgba(255, 255, 255, 0.95)

.tr-fb
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

.tr-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes tr-shake
  0%, 100%
    transform: translate(-50%, -90%)
  25%
    transform: translate(-56%, -90%) rotate(-4deg)
  75%
    transform: translate(-44%, -90%) rotate(4deg)

@media (prefers-reduced-motion: reduce)
  .tr-walker.wobble
    animation: none
</style>
