<script setup lang="ts">
/**
 * Follow the glow: on a dusky slope stands Moses, a small shepherd with a staff, at the edge. The child leads him with a finger (or the arrow keys) over the slope. Somewhere a soft light glows; the
 * closer Moses comes, the brighter and warmer the slope glows. When he is near enough (about seven percent of the width of the picture) he is there: the bush shines clearly, stays green, Moses stops and
 * a bright tone sounds. Nothing can go wrong, so there is no mistake. In round 2 rocks hide the bush and only the glow shines through the gaps. After twenty seconds without coming nearer the "Tip" button
 * shows: sparks float towards the bush (a tip). The glow and the finding are `glow` and `found` in `utils/moseGames.ts`. With reduced motion the glow does not pulse, it only gets brighter.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { distance, found, glow } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GlowGame } from '@/types/adventure'

const props = defineProps<{ game: GlowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: the bush of every round
progress.setGoal(props.game.rounds.length)

/** How far the glow reaches (percent of the width), seconds without coming nearer after which the tip shows, and how far a key moves Moses. */
const REACH = 90
const IDLE = 20
const KEY_STEP = 3

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const pos = ref<{ x: number; y: number }>({ x: current.value.start[0], y: current.value.start[1] })
const target = computed(() => ({ x: current.value.target[0], y: current.value.target[1] }))
const there = ref(false)
const tips = ref(0)
const between = ref(false)
const finished = ref(false)
const idle = ref(0)
const sparks = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const dragging = ref(false)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(tips.value, 0, 1))

const dist = computed(() => distance(pos.value, target.value))
const light = computed(() => (there.value ? 1 : glow(dist.value, REACH)))
let best = dist.value
// one tick a second: how long has Moses not come nearer?
const timer = window.setInterval(() => {
  if (there.value || between.value || finished.value) return
  idle.value++
}, 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function moveTo(x: number, y: number) {
  if (there.value || between.value || finished.value) return
  pos.value = { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
  const d = distance(pos.value, target.value)
  if (d < best - 1) {
    best = d
    idle.value = 0
  }
  if (found(d, current.value.threshold)) arrive()
}

function arrive() {
  there.value = true
  pos.value = { x: target.value.x, y: target.value.y + 6 }
  sparks.value = false
  progress.mark()
  play('found')
  message.value = t('app.adventure.glowRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1800)
    return
  }
  later(() => {
    between.value = true
    message.value = t('app.adventure.gameNext')
    later(() => {
      round.value++
      pos.value = { x: current.value.start[0], y: current.value.start[1] }
      there.value = false
      idle.value = 0
      best = distance(pos.value, target.value)
      between.value = false
      message.value = ''
    }, 1400)
  }, 1500)
}

function fromPointer(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  moveTo(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
}
function pointerMove(e: PointerEvent) {
  if (dragging.value) fromPointer(e)
}
function stopDrag() {
  dragging.value = false
  window.removeEventListener('pointermove', pointerMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function pointerDown(e: PointerEvent) {
  if (e.button > 0) return
  dragging.value = true
  fromPointer(e)
  window.addEventListener('pointermove', pointerMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)

function key(e: KeyboardEvent) {
  const d = ({ ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] } as Record<string, [number, number]>)[e.key]
  if (!d) return
  e.preventDefault()
  moveTo(pos.value.x + d[0], pos.value.y + d[1])
}

/** The tip: sparks float from Moses towards the bush. */
function tip() {
  if (there.value || between.value || finished.value || sparks.value) return
  tips.value++
  sparks.value = true
  message.value = t('app.adventure.glowSparks')
  later(() => {
    sparks.value = false
  }, 4000)
}

/** Three sparks on the line from Moses to the bush. */
const sparkDots = computed(() => [0.25, 0.5, 0.75].map((f) => ({ left: `${pos.value.x + (target.value.x - pos.value.x) * f}%`, top: `${pos.value.y + (target.value.y - pos.value.y) * f}%` })))
const glowStyle = computed(() => ({
  left: `${target.value.x}%`,
  top: `${target.value.y}%`,
  opacity: String(0.15 + light.value * 0.85),
  transform: `translate(-50%, -50%) scale(${0.4 + light.value * 0.8})`
}))
const tintStyle = computed(() => ({ opacity: String(light.value * 0.45) }))
const walkerStyle = computed(() => ({ left: `${pos.value.x}%`, top: `${pos.value.y}%` }))
const bushStyle = computed(() => ({ left: `${target.value.x}%`, top: `${target.value.y}%`, opacity: String(there.value ? 1 : 0.1 + light.value * 0.3) }))
</script>

<template lang="pug">
  div(class="gl" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="gl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="gl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="gl-field"
        role="group"
        :aria-label="t('app.adventure.glowField', { percent: Math.round(light * 100) })"
        :style="{ backgroundImage: `url(${src(current.background)})` }"
        @pointerdown="pointerDown"
      )
        span(class="gl-tint" :style="tintStyle" aria-hidden="true")
        template(v-if="!between")
          span(class="gl-glow" :class="{ there }" :style="glowStyle" aria-hidden="true")
          span(class="gl-bush" :class="{ there }" :style="bushStyle" aria-hidden="true")
            GameImage(:src="game.bush" colour="#4f9a4a" round)
          span(v-if="current.cover" class="gl-cover" aria-hidden="true")
            GameImage(:src="current.cover" :ratio="4 / 3" colour="rgba(80, 74, 70, 0.9)")
          span(v-for="(s, i) in sparkDots" v-show="sparks" :key="`s-${i}`" class="gl-spark" :style="s" aria-hidden="true")
          span(class="gl-walker" :style="walkerStyle" role="img" :aria-label="t('app.adventure.glowMoses')")
            GameImage(:src="game.walker" :ratio="220 / 300" colour="#8a6a4a")
      p(class="gl-fb" role="status") {{ message }}
      AdvButton(v-if="idle >= IDLE && !there" tone="blau" class="gl-tip" :disabled="sparks" @click="tip") {{ t('app.adventure.glowTip') }}
      p(class="gl-count") {{ t('app.adventure.glowCount', { n: round + (there ? 1 : 0), total: rounds.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.glowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.gl-round
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

.gl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.gl-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6a5a6e
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

// the slope grows warm when Moses comes nearer
.gl-tint
  position: absolute
  inset: 0
  background: radial-gradient(circle at 50% 50%, rgba(255, 190, 90, 0.9), rgba(255, 150, 60, 0.6))
  mix-blend-mode: screen
  pointer-events: none

.gl-glow
  position: absolute
  display: block
  width: 56%
  aspect-ratio: 1
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 232, 150, 0.95) 0%, rgba(255, 190, 90, 0.55) 40%, rgba(255, 160, 60, 0) 70%)
  transition: opacity 200ms ease, transform 200ms ease
  pointer-events: none

  &:not(.there)
    animation: gl-pulse 2.6s ease-in-out infinite

.gl-bush
  position: absolute
  display: block
  width: 16%
  transform: translate(-50%, -80%)
  transition: opacity 400ms ease
  pointer-events: none

  &.there
    filter: drop-shadow(0 0 14px rgba(255, 210, 100, 1))

// rocks in front of the bush in round 2
.gl-cover
  position: absolute
  inset: 0
  display: block
  pointer-events: none

.gl-walker
  position: absolute
  display: block
  width: 8%
  transform: translate(-50%, -100%)
  transition: left 120ms linear, top 120ms linear
  pointer-events: none
  z-index: 4

.gl-spark
  position: absolute
  display: block
  width: 12px
  height: 12px
  margin: -6px 0 0 -6px
  border-radius: 50%
  background: #ffe9a0
  box-shadow: 0 0 10px 3px rgba(255, 224, 120, 0.95)
  animation: gl-float 1.6s ease-in-out infinite
  pointer-events: none
  z-index: 5

.gl-fb
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

.gl-tip
  align-self: center

.gl-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes gl-pulse
  0%, 100%
    filter: brightness(1)
  50%
    filter: brightness(1.18)

@keyframes gl-float
  0%, 100%
    transform: translateY(0)
    opacity: 0.6
  50%
    transform: translateY(-8px)
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gl-glow:not(.there), .gl-spark
    animation: none

  .gl-walker
    transition: none
</style>
