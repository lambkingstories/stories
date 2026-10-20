<script setup lang="ts">
/**
 * Stack the stepped tower: on the building site a block of clay bricks glides slowly to and fro on a wooden beam of the scaffold. The child taps, and the
 * block lowers onto the step below. Every step is a little narrower than the one below, so the stepped tower grows. A block that hangs over the step by less than a
 * tenth of its width sits where it fell (a tick); a block that hangs over more slides gently to the middle of the step (an orange cross, a fault). Nothing ever
 * falls and the tower never gives way. There is no clock: the block can glide for as long as the child likes. Two rounds of four steps: first wide and slow,
 * then narrower and a little quicker. The arithmetic is `land` and `glideAt` in `utils/babelGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { glideAt, land, stepWidths } from '@/utils/babelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { StackGame } from '@/types/adventure'

const props = defineProps<{ game: StackGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every step of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.layers, 0))

const FPS = 30
/** The height of a step in the picture (cqw: percent of the width of the picture) and how far below the picture's top the beam hangs. */
const STEP_H = 9
const GROUND = 4
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const widths = computed(() => stepWidths(current.value.baseWidth, current.value.shrink, current.value.layers))

/** The steps that lie on the tower: the foundation first (centred), then every block with its left edge. */
interface Step {
  left: number
  width: number
  ok: boolean
}
const steps = ref<Step[]>([])
function startRound() {
  const w = widths.value[0]!
  steps.value = [{ left: (100 - w) / 2, width: w, ok: true }]
}
startRound()

const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<{ at: number; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 4))

/** The block that glides: its width, and where it is now (the time only runs while it glides). */
const placed = computed(() => steps.value.length - 1)
const blockWidth = computed(() => widths.value[Math.min(placed.value + 1, widths.value.length - 1)]!)
let clock = 0
const blockLeft = ref(0)
/** The block is on its way down (it does not glide then). */
const dropping = ref(false)
const dropAt = ref<{ left: number; level: number } | null>(null)
const timer = window.setInterval(tick, 1000 / FPS)
function tick() {
  if (dropping.value || between.value || finished.value) return
  clock += 1 / FPS
  blockLeft.value = glideAt(clock, current.value.speed, blockWidth.value)
}
onBeforeUnmount(() => window.clearInterval(timer))

/** A tap: the block is let go where it is, and lands. */
function drop() {
  if (dropping.value || between.value || finished.value) return
  const below = steps.value[steps.value.length - 1]!
  const here = blockLeft.value
  const result = land(below.left, below.width, here, blockWidth.value)
  dropping.value = true
  dropAt.value = { left: here, level: steps.value.length }
  later(() => {
    steps.value = [...steps.value, { left: result.left, width: blockWidth.value, ok: result.good }]
    dropAt.value = null
    progress.mark()
    if (result.good) {
      play('snap')
      message.value = t('app.adventure.fbRight')
    } else {
      mistakes.value++
      play('wrong')
      message.value = t('app.adventure.stackSlid')
    }
    flash.value = { at: steps.value.length - 1, kind: result.good ? 'good' : 'bad' }
    later(() => (flash.value = null), 800)
    dropping.value = false
    if (steps.value.length - 1 >= current.value.layers) roundOver()
  }, 420)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    startRound()
    clock = 0
    between.value = false
    message.value = ''
  }, 1700)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    drop()
  }
}

const src = (p: string) => prependBaseUrl(p)
const stepStyle = (s: Step, i: number) => ({ left: `${s.left}%`, width: `${s.width}%`, bottom: `${GROUND + i * STEP_H}cqw`, height: `${STEP_H}cqw` })
/** The block that falls: from the beam down to the top of the tower. */
const blockStyle = computed(() => {
  const level = dropAt.value ? dropAt.value.level : steps.value.length
  const left = dropAt.value ? dropAt.value.left : blockLeft.value
  const bottom = dropping.value ? GROUND + level * STEP_H : 50
  return { left: `${left}%`, width: `${blockWidth.value}%`, bottom: `${bottom}cqw`, height: `${STEP_H}cqw` }
})
</script>

<template lang="pug">
  div(class="sk")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sk-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        class="sk-field"
        role="button"
        tabindex="0"
        :aria-label="t('app.adventure.stackField')"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @pointerdown.prevent="drop"
        @keydown="onKey"
      )
        img(:src="src(game.beam)" alt="" draggable="false" class="sk-beam")
        div(v-for="(s, i) in steps" :key="`${round}-${i}`" class="sk-step" :class="{ slid: !s.ok, base: i === 0 }" :style="stepStyle(s, i)")
          img(:src="src(game.block)" alt="" draggable="false")
          GameMark(v-if="flash?.at === i" :kind="flash.kind" class="sk-mark")
        div(v-if="!between && steps.length - 1 < current.layers" class="sk-block" :class="{ dropping }" :style="blockStyle")
          img(:src="src(game.block)" alt="" draggable="false")
      p(class="sk-fb" role="status") {{ message }}
      p(class="sk-count") {{ t('app.adventure.stackCount', { n: steps.length - 1, total: current.layers }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stackFinished')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sk
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sk-round
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

.sk-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sk-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  container-type: inline-size
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center
  touch-action: manipulation
  cursor: pointer
  user-select: none
  -webkit-user-select: none

.sk-beam
  position: absolute
  left: 0
  top: 2%
  width: 100%
  height: auto
  pointer-events: none

.sk-step,
.sk-block
  position: absolute
  pointer-events: none

  img
    display: block
    width: 100%
    height: 100%
    object-fit: fill
    filter: drop-shadow(0 3px 3px rgba(60, 40, 10, 0.5))

// the block sinks onto the step below
.sk-block.dropping
  transition: bottom 400ms ease-in

.sk-step.slid
  animation: sk-settle 500ms ease-out

.sk-mark
  position: absolute
  top: -10px
  right: -8px

.sk-fb
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

.sk-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes sk-settle
  0%
    transform: translateX(3%)
  100%
    transform: translateX(0)

@media (prefers-reduced-motion: reduce)
  .sk-block.dropping
    transition: none

  .sk-step.slid
    animation: none
</style>
