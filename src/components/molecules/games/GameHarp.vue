<script setup lang="ts">
/**
 * Calm Saul: Saul sits restless in his hall (three painted pictures of him that fade into each other: restless, tired, calm) and David's big harp stands in front of him with eight strings. The child strokes a finger
 * slowly over the strings (to and fro): every string it crosses is plucked with a soft tone, each one a little higher than the one before. A pluck after a pause of at least the pause of the round (a calm stroke)
 * brings Saul one step toward calm; strokes that are too quick are a jangle: the calm sinks by two, a cross shows, it is one mistake. When Saul is calm, the round is done. Round 1 needs eight calm notes, round 2 ten
 * with a longer pause. The strings can also be plucked one by one with the keyboard (Tab to a string, Enter). The arithmetic is in `utils/davidGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { harpCalm, pluckKind, saulState, stringAt, stringRate } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HarpGame } from '@/types/adventure'

const props = defineProps<{ game: HarpGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every calm note of every round (counted when the calm reaches a new height)
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.need, 0))

/** A pause longer than this starts the stroke afresh (the first note after it is always calm). */
const PAUSE = 2500
const round = ref(0)
const calm = ref(0)
const best = ref(0)
const misses = ref(0)
const lit = ref<number | null>(null)
const cross = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const harpEl = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
let lastAt: number | null = null
let lastString = -1
let dragging = false

const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 3, 7))
const state = computed(() => saulState(calm.value, current.value.need))
const step = computed(() => (props.game.strings.x1 - props.game.strings.x0) / Math.max(1, props.game.strings.n - 1))
const harpStyle = computed(() => ({ left: `${props.game.harpPos.x}%`, top: `${props.game.harpPos.y}%`, width: `${props.game.harpPos.w}%` }))
const saulStyle = computed(() => ({ left: `${props.game.saulPos.x}%`, top: `${props.game.saulPos.y}%`, width: `${props.game.saulPos.w}%` }))
function stringStyle(i: number) {
  const s = props.game.strings
  return { left: `${(s.x0 + i * step.value) * 100}%`, top: `${s.y0 * 100}%`, height: `${(s.y1 - s.y0) * 100}%`, width: `${step.value * 100}%` }
}

function pluck(i: number) {
  if (between.value || finished.value) return
  const now = Date.now()
  const gap = lastAt === null || now - lastAt > PAUSE ? null : now - lastAt
  lastAt = now
  const kind = pluckKind(gap, current.value.minGap)
  play('bead', 1, stringRate(i))
  lit.value = i
  later(() => {
    if (lit.value === i) lit.value = null
  }, 450)
  calm.value = harpCalm(calm.value, kind, current.value.need)
  if (kind === 'jangle') {
    misses.value++
    cross.value = true
    message.value = t('app.adventure.harpJangle')
    later(() => {
      cross.value = false
    }, 800)
    return
  }
  message.value = ''
  if (calm.value > best.value) {
    best.value = calm.value
    progress.mark()
  }
  if (calm.value >= current.value.need) roundDone()
}

function roundDone() {
  between.value = true
  play('star')
  message.value = t('app.adventure.harpCalmed')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    calm.value = 0
    best.value = 0
    lastAt = null
    between.value = false
    message.value = ''
  }, 1800)
}

function fracOf(e: PointerEvent): number | null {
  const r = harpEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0) return null
  return (e.clientX - r.left) / r.width
}
function touch(e: PointerEvent) {
  const f = fracOf(e)
  if (f === null) return
  const s = props.game.strings
  const i = stringAt(f, s.n, s.x0, s.x1)
  if (i < 0) {
    lastString = -1
    return
  }
  if (i !== lastString) {
    lastString = i
    pluck(i)
  }
}
function down(e: PointerEvent) {
  dragging = true
  lastString = -1
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  touch(e)
}
function move(e: PointerEvent) {
  if (dragging) touch(e)
}
function up() {
  dragging = false
  lastString = -1
}
function key(i: number, e: MouseEvent) {
  // a click that comes from the keyboard (a mouse or a finger plucks through the pointer events)
  if (e.detail === 0) pluck(i)
}
</script>

<template lang="pug">
  div(class="gh")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gh-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gh-hint") {{ current.hint }}
      div(class="gh-dots" role="img" :aria-label="t('app.adventure.harpMeter', { n: calm, total: current.need })")
        span(v-for="i in current.need" :key="`dot-${round}-${i}`" class="gh-dot" :class="{ on: i <= calm }")
      div(class="gh-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- Saul: three pictures that fade into each other
        span(class="gh-saul" :style="saulStyle" role="img" :aria-label="t('app.adventure.harpSaul')")
          span(v-for="(s, i) in game.saul" :key="`saul-${i}`" class="gh-saul-img" :class="{ first: i === 0, on: i === state }")
            GameImage(:src="s" colour="#a5402a")
          span(v-if="cross" class="gh-cross" aria-hidden="true")
            GameMark(kind="bad")
        //- the harp: stroke over the strings
        span(
          ref="harpEl"
          class="gh-harp"
          :style="harpStyle"
          @pointerdown.prevent="down"
          @pointermove="move"
          @pointerup="up"
          @pointercancel="up"
          @contextmenu.prevent
        )
          GameImage(:src="game.harp" colour="#8a5a2b")
          button(
            v-for="i in game.strings.n"
            :key="`string-${i}`"
            type="button"
            class="gh-string"
            :class="{ lit: lit === i - 1 }"
            :style="stringStyle(i - 1)"
            :aria-label="t('app.adventure.harpString', { n: i })"
            :disabled="between"
            @click="key(i - 1, $event)"
          )
            span(class="gh-glow" aria-hidden="true")
      p(class="gh-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.harpDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gh
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

.gh-round
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

.gh-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gh-dots
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 6px

.gh-dot
  display: block
  width: 14px
  height: 14px
  border-radius: 50%
  border: 2px solid #b78a2c
  background: rgba(255, 246, 220, 0.8)
  transition: background 300ms ease, transform 300ms ease

  &.on
    background: #e4b83e
    transform: scale(1.15)

.gh-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// Saul sits with the middle of his chair's foot at left/top; the three pictures lie on top of each other
.gh-saul
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2

.gh-saul-img
  display: block
  opacity: 0
  transition: opacity 900ms ease

  &.first
    position: relative

  &:not(.first)
    position: absolute
    inset: 0

  &.on
    opacity: 1

.gh-cross
  position: absolute
  left: 50%
  top: 8%
  display: block
  margin: -15px 0 0 -15px

// the harp stands with the middle of its foot at left/top
.gh-harp
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  cursor: pointer
  touch-action: none
  z-index: 4

.gh-string
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  transform: translateX(-50%)
  pointer-events: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 6px

.gh-glow
  position: absolute
  left: 50%
  top: 0
  bottom: 0
  width: 4px
  margin-left: -2px
  border-radius: 2px
  background: linear-gradient(#fff6c8, #f2c94c)
  box-shadow: 0 0 10px 3px rgba(255, 224, 120, 0.9)
  opacity: 0
  transition: opacity 400ms ease

.gh-string.lit .gh-glow
  opacity: 1

.gh-fb
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
  .gh-saul-img, .gh-dot, .gh-glow
    transition: none
</style>
