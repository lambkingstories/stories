<script setup lang="ts">
/**
 * Copy the constellation: a night sky above the tent. In a corner stands a small model: a few stars in a frame. In the sky an empty frame marks the place. The
 * child taps into the empty frame and lays a star, one at a time, where it sees it in the model. A star that lies near a star of the model (within an eighth of
 * the frame, in any order) snaps onto that place with a tick; a star that lies far from all of them is a cross, gets dull and is gone again (one mistake, nothing
 * is lost). Round 1: four stars, the model stays in view. Round 2: six stars; the model is looked at first and then hidden ("Look again" shows it for a moment, at
 * any time and for nothing). When all stars are in place they join in a soft glow. There is no clock. The arithmetic is `claim` in `utils/abrahamGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { claim, frameRatio } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ConstellationGame } from '@/types/adventure'

const props = defineProps<{ game: ConstellationGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every star of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.targets.length, 0))

/** A star counts as laid right within this share of the width of the frame. */
const TOL = 12
/** The model is as wide as this part of the picture. */
const MODEL_W = 24

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const frame = computed(() => props.game.frame)
const ratio = computed(() => frameRatio(frame.value))

/** Which stars of the model have their star (by the index of the target). */
const taken = ref<boolean[]>(current.value.targets.map(() => false))
/** `look`: the model is looked at (round 2, before the first star); `play`: the child lays stars; `glow`: all are in place. */
const phase = ref<'look' | 'play' | 'glow'>(current.value.showAlways ? 'play' : 'look')
const peeking = ref(false)
const mistakes = ref(0)
const finished = ref(false)
const message = ref('')
const wrong = ref<{ x: number; y: number; k: number } | null>(null)
let wrongKey = 0
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))
const laid = computed(() => taken.value.filter(Boolean).length)
const modelShown = computed(() => current.value.showAlways || phase.value === 'look' || peeking.value)

const cursor = ref<{ x: number; y: number } | null>(null)
const frameEl = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)

/** Where a star of the target list stands in the picture (percent of the picture). */
const inPicture = (tg: [number, number]) => ({ left: `${frame.value.x + (tg[0] * frame.value.w) / 100}%`, top: `${frame.value.y + (tg[1] * frame.value.h) / 100}%` })
const modelStyle = computed(() => ({ left: '3%', top: '4%', width: `${MODEL_W}%`, height: `${(MODEL_W * frame.value.h) / frame.value.w}%` }))
const dotStyle = (tg: [number, number]) => ({ left: `${tg[0]}%`, top: `${tg[1]}%` })
const frameStyle = computed(() => ({ left: `${frame.value.x}%`, top: `${frame.value.y}%`, width: `${frame.value.w}%`, height: `${frame.value.h}%` }))
const cursorStyle = computed(() => (cursor.value ? { left: `${cursor.value.x}%`, top: `${cursor.value.y}%` } : {}))
const wrongStyle = computed(() => (wrong.value ? { left: `${wrong.value.x}%`, top: `${wrong.value.y}%` } : {}))

/** A star is laid at a place of the frame (percent of the frame). */
function lay(x: number, y: number) {
  if (phase.value !== 'play' || peeking.value) return
  const i = claim(current.value.targets, taken.value, { x, y }, TOL, ratio.value)
  if (i >= 0) {
    taken.value = taken.value.map((v, k) => v || k === i)
    progress.mark()
    play('snap')
    message.value = t('app.adventure.fbRight')
    if (taken.value.every(Boolean)) roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.constellationWrong')
  const k = ++wrongKey
  wrong.value = { x, y, k }
  later(() => {
    if (wrong.value?.k === k) wrong.value = null
  }, 900)
}

function roundOver() {
  phase.value = 'glow'
  play('star')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    taken.value = current.value.targets.map(() => false)
    phase.value = current.value.showAlways ? 'play' : 'look'
    message.value = ''
    cursor.value = null
  }, 1700)
}

function pointer(e: PointerEvent) {
  if (e.button > 0) return
  const box = frameEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  lay(((e.clientX - (box?.left ?? 0)) / w) * 100, ((e.clientY - (box?.top ?? 0)) / h) * 100)
}

/** With the keyboard: the arrow keys move a cursor in the frame, Enter or space lays a star there. */
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }
  const step = d[e.key]
  if (step) {
    e.preventDefault()
    const c = cursor.value ?? { x: 50, y: 50 }
    cursor.value = { x: Math.min(100, Math.max(0, c.x + step[0])), y: Math.min(100, Math.max(0, c.y + step[1])) }
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const c = cursor.value ?? { x: 50, y: 50 }
    cursor.value = c
    lay(c.x, c.y)
  }
}

/** "I have looked": the model goes away and the child lays the stars. */
function looked() {
  if (phase.value !== 'look') return
  phase.value = 'play'
  message.value = ''
}

/** "Show again": the model is shown for a moment (no cost). */
function again() {
  if (phase.value !== 'play' || peeking.value || current.value.showAlways) return
  peeking.value = true
  later(() => (peeking.value = false), 2600)
}
</script>

<template lang="pug">
  div(class="cn")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cn-hint") {{ phase === 'look' ? t('app.adventure.constellationLook') : current.hint }}
      div(class="cn-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(v-if="modelShown" class="cn-model" :style="modelStyle" role="img" :aria-label="t('app.adventure.constellationModel', { n: current.targets.length })")
          img(v-for="(tg, i) in current.targets" :key="`m-${round}-${i}`" :src="src(game.star)" alt="" draggable="false" class="cn-dot" :style="dotStyle(tg)")
        div(
          ref="frameEl"
          class="cn-frame"
          :class="{ off: phase !== 'play' }"
          :style="frameStyle"
          role="group"
          :tabindex="phase === 'play' ? 0 : -1"
          :aria-label="t('app.adventure.constellationField')"
          @pointerdown.prevent="pointer"
          @keydown="onKey"
        )
          span(v-if="cursor && phase === 'play'" class="cn-cursor" :style="cursorStyle" aria-hidden="true")
          span(v-if="wrong" class="cn-wrong" :style="wrongStyle")
            GameMark(kind="bad")
        img(
          v-for="(tg, i) in current.targets"
          v-show="taken[i]"
          :key="`s-${round}-${i}`"
          :src="src(game.star)"
          alt=""
          draggable="false"
          class="cn-star"
          :class="{ glow: phase === 'glow' }"
          :style="inPicture(tg)"
        )
      p(class="cn-fb" role="status") {{ message }}
      div(class="cn-actions")
        AdvButton(v-if="phase === 'look'" tone="gold" @click="looked") {{ t('app.adventure.constellationLooked') }}
        AdvButton(v-else-if="!current.showAlways" tone="blau" small :disabled="phase !== 'play' || peeking" @click="again") {{ t('app.adventure.constellationAgain') }}
      p(class="cn-count") {{ t('app.adventure.constellationCount', { n: laid, total: current.targets.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.constellationDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2c3358
  box-shadow: inset 0 0 18px rgba(0, 0, 20, 0.5)

.cn-round
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

.cn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

.cn-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1a2142
  background-size: cover
  background-position: center
  user-select: none
  -webkit-user-select: none

// the model: a small frame in the corner with the stars as little dots; the app draws it as a soft surface
.cn-model
  position: absolute
  border-radius: 10px
  border: 2px solid rgba(255, 236, 170, 0.9)
  background: rgba(20, 28, 70, 0.62)
  box-shadow: 0 0 14px rgba(255, 236, 170, 0.4)
  pointer-events: none

.cn-dot
  position: absolute
  width: 14%
  height: auto
  transform: translate(-50%, -50%)

// the empty frame where the stars are laid
.cn-frame
  position: absolute
  border-radius: 14px
  border: 3px dashed rgba(255, 236, 170, 0.85)
  background: rgba(20, 28, 70, 0.24)
  cursor: pointer
  touch-action: none

  &.off
    cursor: default
    opacity: 0.6

  &:focus-visible
    outline: 3px solid rgba(255, 255, 255, 0.95)

.cn-cursor
  position: absolute
  width: 22px
  height: 22px
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 2px solid #fff
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.9)
  pointer-events: none

.cn-wrong
  position: absolute
  transform: translate(-50%, -50%)
  opacity: 0.85
  filter: grayscale(0.4)
  animation: cn-fade 900ms ease-out forwards
  pointer-events: none

.cn-star
  position: absolute
  width: 7%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 0 6px rgba(255, 230, 120, 0.9))

  &.glow
    filter: drop-shadow(0 0 14px rgba(255, 240, 160, 1)) brightness(1.25)
    animation: cn-glow 900ms ease-in-out infinite

.cn-fb
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

.cn-actions
  display: flex
  justify-content: center

.cn-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #f3e6bf

@keyframes cn-fade
  0%
    opacity: 0.95
  100%
    opacity: 0

@keyframes cn-glow
  0%, 100%
    transform: translate(-50%, -50%) scale(1)
  50%
    transform: translate(-50%, -50%) scale(1.18)

@media (prefers-reduced-motion: reduce)
  .cn-star.glow,
  .cn-wrong
    animation: none
</style>
