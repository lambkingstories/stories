<script setup lang="ts">
/**
 * Collect the lights: the picture lies in the dark. Soft lights appear in it; the child taps each one, it shines up and the picture gets
 * a little brighter, until it is bright again. In the first round the lights come one after the other, in the second round several are there
 * at once. The picture is only darkened by the code and brightened again as the lights are collected (nothing is drawn). A tap beside a light
 * is a small slip (a faint ring); looking around is part of the game, so a few are fine. Nothing can be lost and nothing runs away.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { LightGame } from '@/types/adventure'

const props = defineProps<{ game: LightGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const total = computed(() => props.game.rounds.reduce((sum, r) => sum + r.spots.length, 0))
// the whole task: every light of every round
progress.setGoal(total.value)

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** The lights of this round that are collected, and how many of the round's lights have appeared so far. */
const taken = reactive<Record<number, boolean>>({})
const appeared = ref(0)
const collected = ref(0)
const slips = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const ring = ref<{ x: number; y: number; k: number } | null>(null)
let ringKey = 0
const stars = computed(() => mistakeStars(slips.value, 3, 8))

/** How many lights shine at the same time in this round (`together`, at least one). */
const together = computed(() => Math.max(1, current.value.together))
const visible = computed(() => current.value.spots.map((s, i) => ({ s, i })).filter(({ i }) => i < appeared.value && !taken[i]))
/** 0 (dark) to 1 (bright), from the lights collected so far in all rounds. */
const brightness = computed(() => (finished.value ? 1 : total.value ? collected.value / total.value : 1))
const darkStyle = computed(() => ({ opacity: String(0.8 * (1 - brightness.value)) }))

/** The next lights appear: as many as can shine together, never more than the round has. */
function showMore() {
  const open = current.value.spots.filter((_, i) => i < appeared.value && !taken[i]).length
  const room = together.value - open
  if (room > 0) appeared.value = Math.min(current.value.spots.length, appeared.value + room)
}
appeared.value = Math.min(current.value.spots.length, together.value)

function take(i: number) {
  if (taken[i] || between.value || finished.value) return
  taken[i] = true
  collected.value++
  progress.mark()
  play('found')
  message.value = ''
  if (current.value.spots.every((_, k) => taken[k])) {
    roundOver()
    return
  }
  later(showMore, 500)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 700)
    return
  }
  between.value = true
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(taken)) delete taken[Number(k)]
    appeared.value = Math.min(current.value.spots.length, together.value)
    message.value = ''
  }, 1500)
}

/** A tap beside the lights: a faint ring shows where it was; a slip, nothing is lost. */
function sceneTap(e: MouseEvent) {
  if (between.value || finished.value) return
  if (e.target instanceof Element && e.target.closest('.lt-light')) return
  slips.value++
  play('tap')
  const box = e.currentTarget instanceof HTMLElement ? e.currentTarget.getBoundingClientRect() : null
  if (!box || !box.width) return
  ring.value = { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100, k: ++ringKey }
  const k = ringKey
  later(() => {
    if (ring.value?.k === k) ring.value = null
  }, 600)
}

const spotStyle = (s: { x: number; y: number; w: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` })
/** The lights that are collected in this round: a soft brightening stays around each of them (the picture is brightened there, nothing is drawn). */
const shining = computed(() => current.value.spots.map((s, i) => ({ s, i })).filter(({ i }) => taken[i]))
const litStyle = (s: { x: number; y: number; w: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w * 3.2}%` })
const src = (p: string) => prependBaseUrl(p)
</script>

<template lang="pug">
  div(class="lt")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="lt-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="lt-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="lt-field" role="group" :aria-label="t('app.adventure.lightsField')" @click="sceneTap")
        img(:src="src(game.scene)" alt="" draggable="false" class="lt-bg")
        div(class="lt-dark" :style="darkStyle" aria-hidden="true")
        span(v-for="{ s, i } in shining" :key="`lit-${round}-${i}`" class="lt-lit" :style="litStyle(s)" aria-hidden="true")
        button(
          v-for="{ s, i } in visible"
          :key="`${round}-${i}`"
          type="button"
          class="lt-light"
          :style="spotStyle(s)"
          :aria-label="t('app.adventure.lightsLight')"
          @click.stop="take(i)"
        )
          span(class="lt-dot" aria-hidden="true")
        span(v-if="ring" :key="ring.k" class="lt-ring" :style="{ left: `${ring.x}%`, top: `${ring.y}%` }" aria-hidden="true")
      p(class="lt-count") {{ t('app.adventure.lightsCount', { n: collected, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lightsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.lt
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #1f2a44
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.4)

.lt-round
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

.lt-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.lt-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #0b1020
  touch-action: manipulation

.lt-bg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none
  user-select: none

// the darkness over the picture: the code only dims the picture and takes the dimming away again as the lights are collected
.lt-dark
  position: absolute
  inset: 0
  background: #070b1c
  pointer-events: none
  transition: opacity 700ms ease-out

.lt-light
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  animation: lt-glow 1800ms ease-in-out infinite

  // the glimmer: a soft round light, made by the app (it brightens the picture under it)
  .lt-dot
    display: block
    width: 100%
    aspect-ratio: 1
    border-radius: 50%
    background: radial-gradient(circle, rgba(255, 252, 226, 0.95) 0%, rgba(255, 232, 150, 0.6) 38%, rgba(255, 220, 120, 0) 72%)
    mix-blend-mode: screen
    pointer-events: none

// what has been collected stays a little brighter
.lt-lit
  position: absolute
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 244, 205, 0.55) 0%, rgba(255, 232, 170, 0.28) 40%, rgba(255, 220, 140, 0) 70%)
  mix-blend-mode: screen
  pointer-events: none

.lt-ring
  position: absolute
  width: 34px
  height: 34px
  margin: -17px 0 0 -17px
  border-radius: 50%
  border: 3px solid rgba(255, 255, 255, 0.75)
  pointer-events: none
  animation: lt-ring 600ms ease-out both

.lt-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #fff6d8

@keyframes lt-glow
  0%, 100%
    transform: translate(-50%, -50%) scale(1)
  50%
    transform: translate(-50%, -50%) scale(1.1)

@keyframes lt-ring
  0%
    transform: scale(0.6)
    opacity: 1
  100%
    transform: scale(1.5)
    opacity: 0

@media (prefers-reduced-motion: reduce)
  .lt-light
    animation: none

  .lt-dark
    transition: none
</style>
