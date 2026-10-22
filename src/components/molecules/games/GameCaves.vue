<script setup lang="ts">
/**
 * In two caves: a dry rocky hillside with two cave mouths (left and right); below, in the yard, the prophets wait, every one with his own face. The child brings each prophet into one of the two caves (drag
 * him there, or tap him and then the cave). When all are inside the app counts the caves: the same number in both is right (a tone, the round is done); if one cave holds too many, the extra prophet
 * comes out again and goes back to the yard (a cross, one mistake) and the round goes on. Round 1 has four prophets (two and two), round 2 eight (four and four). A prophet that is already in a cave can
 * be moved to the other one. Whether the caves are even and how many have to go back is `isEven` and `excess` in `utils/eliaGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { excess, isEven } from '@/utils/eliaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CavesGame } from '@/types/adventure'

const props = defineProps<{ game: CavesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every prophet of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.count, 0))

/** The two caves. */
const CAVES = [0, 1] as const
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const count = computed(() => current.value.count)
/** Which cave a prophet is in (0 left, 1 right); missing: he waits in the yard. */
const inCave = reactive<Record<number, 0 | 1>>({})
/** The order in which the prophets went into a cave (the last one comes out first when a cave has too many). */
const order = ref<number[]>([])
const selected = ref<number | null>(null)
const dragging = ref<{ i: number; x: number; y: number } | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const bad = ref<{ cave: number; k: number } | null>(null)
let badKey = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const placed = computed(() => Object.keys(inCave).length)
const members = (cave: 0 | 1) => order.value.filter((i) => inCave[i] === cave)
const sizes = computed<[number, number]>(() => [members(0).length, members(1).length])

/** A prophet in the yard (the row and the place in it) in percent of the picture. */
function yardPos(i: number) {
  const y = props.game.yard
  const perRow = count.value > 4 ? Math.ceil(count.value / 2) : count.value
  const row = Math.floor(i / perRow)
  const k = i % perRow
  return { x: y.x0 + ((y.x1 - y.x0) * (k + 0.5)) / perRow, y: y.y + row * y.row }
}
/** A prophet inside a cave stands in a row in the mouth, smaller than in the yard. */
function cavePos(i: number) {
  const cave = props.game.caves[inCave[i]!]!
  const list = members(inCave[i]!)
  const n = list.indexOf(i)
  const step = cave.w / (Math.max(4, list.length) + 0.4)
  return { x: cave.x + (n - (list.length - 1) / 2) * step, y: cave.y + cave.h * 0.45 }
}
function pos(i: number) {
  if (dragging.value?.i === i) return { x: dragging.value.x, y: dragging.value.y }
  return inCave[i] === undefined ? yardPos(i) : cavePos(i)
}
const prophetStyle = (i: number) => {
  const p = pos(i)
  const inside = inCave[i] !== undefined && dragging.value?.i !== i
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.yard.w * (inside ? 0.55 : 1)}%`, zIndex: dragging.value?.i === i ? 5 : inside ? 1 : 2 }
}
const caveStyle = (c: 0 | 1) => {
  const s = props.game.caves[c]
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }
}

function toPct(e: { clientX: number; clientY: number }) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
/** The cave nearest to a point (percent), within a generous reach: -1 when the point is far from both. */
function caveAt(p: { x: number; y: number }): 0 | 1 | -1 {
  let best: 0 | 1 | -1 = -1
  let bestD = 26
  props.game.caves.forEach((s, i) => {
    const d = Math.hypot(p.x - s.x, (p.y - s.y) * 0.75)
    if (d <= bestD) {
      bestD = d
      best = i as 0 | 1
    }
  })
  return best
}

function put(i: number, cave: 0 | 1) {
  if (between.value || finished.value) return
  selected.value = null
  if (inCave[i] === cave) return
  inCave[i] = cave
  order.value = [...order.value.filter((x) => x !== i), i]
  play('basket')
  message.value = ''
  if (placed.value >= count.value) check()
}

function check() {
  const [a, b] = sizes.value
  if (isEven(a, b)) {
    between.value = true
    for (let n = 0; n < count.value; n++) progress.mark()
    play('star')
    message.value = t('app.adventure.cavesRight', { n: a })
    if (round.value + 1 >= props.game.rounds.length) {
      later(() => {
        finished.value = true
      }, 1600)
      return
    }
    later(() => {
      round.value++
      for (const k of Object.keys(inCave)) delete inCave[Number(k)]
      order.value = []
      between.value = false
      message.value = ''
    }, 2000)
    return
  }
  // one cave holds too many: the extra prophets come out again
  misses.value++
  play('wrong')
  message.value = t('app.adventure.cavesUneven')
  const ex = excess(a, b)
  const k = ++badKey
  bad.value = { cave: ex.cave, k }
  later(() => {
    if (bad.value?.k === k) bad.value = null
  }, 900)
  const out = members(ex.cave as 0 | 1).slice(-ex.n)
  later(() => {
    for (const i of out) delete inCave[i]
    order.value = order.value.filter((i) => !out.includes(i))
  }, 450)
}

// dragging a prophet
let moved = false
let startAt = { x: 0, y: 0 }
let dragIndex = -1
function onMove(e: PointerEvent) {
  const p = toPct(e)
  if (!p || dragIndex < 0) return
  if (Math.hypot(e.clientX - startAt.x, e.clientY - startAt.y) > 6) moved = true
  if (moved) dragging.value = { i: dragIndex, x: p.x, y: p.y }
}
function onUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  const i = dragIndex
  dragIndex = -1
  dragging.value = null
  if (i < 0) return
  const p = toPct(e)
  if (!moved || !p) {
    selected.value = selected.value === i ? null : i
    return
  }
  const cave = caveAt(p)
  if (cave >= 0) put(i, cave as 0 | 1)
}
function startDrag(i: number, e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  moved = false
  dragIndex = i
  startAt = { x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
})
function key(i: number, e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    selected.value = selected.value === i ? null : i
  }
}
function caveTap(c: 0 | 1) {
  if (selected.value !== null) put(selected.value, c)
}
</script>

<template lang="pug">
  div(class="cv")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="cv-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="cv-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(ref="field" class="cv-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        button(
          v-for="c in CAVES"
          :key="`cave-${c}`"
          type="button"
          class="cv-cave"
          :class="{ ready: selected !== null }"
          :style="caveStyle(c)"
          :aria-label="t(c === 0 ? 'app.adventure.cavesCaveLeft' : 'app.adventure.cavesCaveRight', { n: sizes[c] })"
          @click="caveTap(c)"
        )
          span(class="cv-count" aria-hidden="true") {{ sizes[c] }}
          span(v-if="bad && bad.cave === c" :key="bad.k" class="cv-miss" aria-hidden="true")
            GameMark(kind="bad")
        span(
          v-for="(p, i) in game.prophets.slice(0, count)"
          :key="p.id"
          class="cv-prophet"
          :class="{ chosen: selected === i, inside: inCave[i] !== undefined }"
          :style="prophetStyle(i)"
        )
          button(
            type="button"
            class="cv-body"
            :disabled="between"
            :aria-label="t('app.adventure.cavesProphet', { n: i + 1 })"
            @pointerdown="startDrag(i, $event)"
            @keydown="key(i, $event)"
          )
            GameImage(:src="p.image" :ratio="0.5" colour="#c9a45c")
      p(class="cv-fb" role="status") {{ message || t('app.adventure.cavesCount', { n: placed, total: count }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cavesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cv
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.cv-round
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

.cv-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.cv-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99863
  background-size: cover
  background-position: center
  touch-action: none

// the mouth of a cave: the place to put a prophet; it shows only when a prophet is chosen
.cv-cave
  position: absolute
  padding: 0
  border: 3px dashed transparent
  border-radius: 50%
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.ready
    border-color: rgba(255, 246, 220, 0.9)
    background: rgba(255, 246, 220, 0.18)

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px

.cv-count
  position: absolute
  left: 50%
  bottom: -18px
  min-width: 30px
  padding: 0 8px
  transform: translateX(-50%)
  border-radius: 999px
  border: 2px solid #b8923a
  background: rgba(255, 246, 220, 0.96)
  font-weight: 900
  font-size: 1rem
  color: #5f4f35

.cv-miss
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

// a prophet stands with his feet on the point; a finger is bigger than a prophet
.cv-prophet
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  transition: left 300ms ease, top 300ms ease, width 300ms ease

  &.chosen
    filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 3px #f4d36a)

.cv-body
  display: block
  width: 100%
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -8px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

.cv-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

@media (prefers-reduced-motion: reduce)
  .cv-prophet
    transition: none
</style>
