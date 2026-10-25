<script setup lang="ts">
/**
 * The stone of help: two landmarks stand in the country (the town and a rock), and Samuel wants to set up a stone in the middle between them. The child drags the stone along the ground and lets go (or moves it with the arrow keys
 * and presses Enter). If the stone stands in the middle (eight percent of the distance between the landmarks too far to one side is still right) it stays and is done; if not, a cross shows, it is one mistake and the stone goes back
 * to its place. Round 1 shows a small groove in the ground at the middle, round 2 does not. Two stones in each round, each between a different pair of landmarks. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { midpoint, stoneOk, stoneSide } from '@/utils/samuelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { StoneGame } from '@/types/adventure'

const props = defineProps<{ game: StoneGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.pairs.length, 0)
// the whole task: one stone for each pair of landmarks
progress.setGoal(total)

const round = ref(0)
const pair = ref(0)
const fieldEl = ref<HTMLElement | null>(null)
/** Where the stone is (percent of the picture). */
const pos = ref({ x: props.game.startPos.x, y: props.game.startPos.y })
const dragging = ref(false)
const back = ref(false)
const placed = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const crossAt = ref<number | null>(null)
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const currentPair = computed(() => current.value.pairs[Math.min(pair.value, current.value.pairs.length - 1)]!)
const mid = computed(() => midpoint(currentPair.value.a.x, currentPair.value.b.x))
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const stoneStyle = computed(() => ({ left: `${pos.value.x}%`, top: `${pos.value.y}%`, width: `${props.game.stoneW}%` }))

function toPercent(e: PointerEvent): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return {
    x: Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)),
    y: Math.max(10, Math.min(98, ((e.clientY - r.top) / r.height) * 100))
  }
}

function down(e: PointerEvent) {
  if (between.value || finished.value || placed.value) return
  dragging.value = true
  back.value = false
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value) return
  const p = toPercent(e)
  if (p) pos.value = p
}
function up() {
  if (!dragging.value) return
  dragging.value = false
  release()
}

function keydown(e: KeyboardEvent) {
  if (between.value || finished.value || placed.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    back.value = false
    pos.value = { x: Math.max(2, Math.min(98, pos.value.x + (e.key === 'ArrowLeft' ? -2 : 2))), y: props.game.groundY }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    release()
  }
}

/** The stone is let go: the middle between the two landmarks decides. */
function release() {
  const { a, b } = currentPair.value
  const x = pos.value.x
  if (stoneOk(x, a.x, b.x)) {
    placed.value = true
    pos.value = { x: mid.value, y: props.game.groundY }
    between.value = true
    progress.mark()
    play('star')
    message.value = t('app.adventure.stoneRight')
    later(next, 1600)
    return
  }
  misses.value++
  play('wrong')
  crossAt.value = x
  const side = stoneSide(x, a.x, b.x)
  message.value = t(side === 'outside' ? 'app.adventure.stoneOutside' : x < mid.value ? 'app.adventure.stoneTooLeft' : 'app.adventure.stoneTooRight')
  back.value = true
  pos.value = { x: props.game.startPos.x, y: props.game.startPos.y }
  later(() => {
    crossAt.value = null
  }, 900)
}

function next() {
  placed.value = false
  between.value = false
  message.value = ''
  pos.value = { x: props.game.startPos.x, y: props.game.startPos.y }
  if (pair.value < current.value.pairs.length - 1) {
    pair.value++
    return
  }
  if (round.value >= props.game.rounds.length - 1) {
    finished.value = true
    return
  }
  round.value++
  pair.value = 0
}
</script>

<template lang="pug">
  div(class="gs")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gs-hint") {{ current.hint }}
      div(ref="fieldEl" class="gs-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the two landmarks
        span(class="gs-mark" :style="{ left: `${currentPair.a.x}%`, top: `${game.groundY}%`, width: `${game.markW[currentPair.a.image]}%` }" aria-hidden="true")
          GameImage(:src="game.marks[currentPair.a.image]" colour="#8a7a55")
        span(class="gs-mark" :style="{ left: `${currentPair.b.x}%`, top: `${game.groundY}%`, width: `${game.markW[currentPair.b.image]}%` }" aria-hidden="true")
          GameImage(:src="game.marks[currentPair.b.image]" colour="#8a7a55")
        //- the groove in the middle of the way (round 1)
        span(v-if="current.notch" class="gs-notch" :style="{ left: `${mid}%`, top: `${game.groundY}%` }" aria-hidden="true")
        span(v-if="crossAt !== null" class="gs-cross" :style="{ left: `${crossAt}%`, top: `${game.groundY - 14}%` }" aria-hidden="true")
          GameMark(kind="bad")
        //- the stone: drag it
        button(
          type="button"
          class="gs-stone"
          :class="{ drag: dragging, back, placed }"
          :style="stoneStyle"
          :aria-label="t('app.adventure.stoneStone')"
          :disabled="between"
          @pointerdown.prevent="down"
          @pointermove="move"
          @pointerup="up"
          @pointercancel="up"
          @keydown="keydown"
          @contextmenu.prevent
        )
          GameImage(:src="game.stone" colour="#9b9384")
      p(class="gs-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stoneDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gs
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

.gs-round
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

.gs-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gs-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// a landmark stands with the middle of its foot at left/top
.gs-mark
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.gs-notch
  position: absolute
  display: block
  width: 3.4%
  height: 1.6%
  transform: translate(-50%, -30%)
  border-radius: 50%
  background: rgba(60, 40, 15, 0.55)
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.4)
  pointer-events: none

.gs-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

// the stone is held with the middle of its foot at left/top
.gs-stone
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  transform: translate(-50%, -100%)
  transition: left 500ms ease, top 500ms ease
  -webkit-tap-highlight-color: transparent
  touch-action: none
  z-index: 6

  &.drag
    cursor: grabbing
    transition: none
    filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.35))

  &.placed
    cursor: default
    transition: left 300ms ease, top 300ms ease

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.gs-fb
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

@media (prefers-reduced-motion: reduce)
  .gs-stone
    transition: none
</style>
