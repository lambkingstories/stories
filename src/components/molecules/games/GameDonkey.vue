<script setup lang="ts">
/**
 * Follow the donkey (Numbers 22,23-27): Balaam rides to Balak, and the donkey sees the light on the way that Balaam does not see. Three places, three times: the donkey stops, a quiet light shows on the way ahead,
 * and the child taps where she turns: into the field, close to the wall, and (where there is no room at all) down on the ground. A tap anywhere else is a mistake. Nobody is ever hit; the light is only light.
 * At the end Balaam's eyes are opened and he bows (the words, the light grows).
 */
import { computed, onMounted, ref } from 'vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import type { DonkeyGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: DonkeyGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.steps.length)

const src = (p: string) => prependBaseUrl(p)
const step = ref(0)
const current = computed(() => props.game.steps[Math.min(step.value, props.game.steps.length - 1)]!)
const lightOn = ref(false)
const turned = ref(false)
const waiting = ref(false)
const misses = ref(0)
const finished = ref(false)
const bright = ref(false)
const message = ref('')
const stars = computed(() => mistakeStars(misses.value, 1, 4))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(progress.parts.value)).replace('{total}', String(progress.goal.value)))

function begin() {
  turned.value = false
  lightOn.value = false
  waiting.value = false
  message.value = ''
  later(() => {
    lightOn.value = true
    waiting.value = true
  }, 900)
}

function right() {
  if (!waiting.value || finished.value) return
  waiting.value = false
  turned.value = true
  progress.mark()
  play('right')
  message.value = current.value.ok
  if (step.value >= props.game.steps.length - 1) {
    later(() => {
      bright.value = true
      message.value = t.value.eyes
    }, 1500)
    later(() => {
      play('star')
      finished.value = true
    }, 3600)
    return
  }
  later(() => {
    step.value++
    begin()
  }, 2100)
}

function wrong() {
  if (!waiting.value || finished.value) return
  misses.value++
  play('wrong')
  message.value = t.value.wrong
}

const donkeyStyle = computed(() => {
  const s = current.value
  const at = turned.value ? { x: s.goTo.x, y: s.goTo.y, r: s.goTo.rot } : { x: s.donkey.x, y: s.donkey.y, r: 0 }
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${s.donkey.w}%`, '--r': `${at.r}deg` }
})
const zoneStyle = computed(() => {
  const z = current.value.zone
  return { left: `${z.x1}%`, top: `${z.y1}%`, width: `${z.x2 - z.x1}%`, height: `${z.y2 - z.y1}%` }
})
const lightStyle = computed(() => {
  const l = current.value.light
  return { left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%` }
})

onMounted(begin)
</script>

<template lang="pug">
  WuesteFrame(
    :background="current.background"
    :hint="current.hint"
    :round="step"
    :rounds="game.steps.length"
    :label="t.field"
    :count="count"
    :message="message"
    :finished="finished"
    :stars="stars"
    :done-text="t.done"
    @next="emit('done', stars)"
  )
    button(type="button" class="gd-back" :aria-label="t.field" :disabled="!waiting" @click="wrong")
    img(
      class="gd-light"
      :class="{ on: lightOn, big: bright }"
      :src="src(game.light)"
      alt=""
      draggable="false"
      :style="lightStyle"
    )
    button(
      type="button"
      class="gd-zone"
      :style="zoneStyle"
      :aria-label="current.label"
      :disabled="!waiting"
      @click="right"
    )
    img(
      class="gd-donkey"
      :class="{ turned }"
      :src="src(game.donkey)"
      alt=""
      draggable="false"
      :style="donkeyStyle"
    )
</template>

<style scoped lang="sass">
.gd-back
  position: absolute
  inset: 0
  display: block
  width: 100%
  height: 100%
  padding: 0
  border: 0
  background: transparent
  z-index: 1
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.gd-zone
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  z-index: 4
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gd-donkey
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%) rotate(var(--r, 0deg))
  transform-origin: 50% 100%
  pointer-events: none
  z-index: 3
  transition: left 1400ms ease-in-out, top 1400ms ease-in-out, transform 1400ms ease-in-out
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

.gd-light
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  opacity: 0
  transition: opacity 900ms ease-in, scale 1600ms ease-in-out

  &.on
    opacity: 0.95

  &.big
    scale: 1.5

@media (prefers-reduced-motion: reduce)
  .gd-donkey, .gd-light
    transition: none
</style>
