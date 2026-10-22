<script setup lang="ts">
/**
 * The light on the wall: a dark banquet hall, the big wall lies in the dark. The child pulls a small oil lamp over it (a finger, the mouse or the arrow keys); the wall shows only in the circle of its light. Golden signs
 * (no letters) shine on the wall, and each one lights up for good when the lamp rests over it for about a second (a ring fills). Round 1: two signs, a wide circle, a calm flame. Round 2: two more signs, a smaller
 * circle, a flickering flame, and when the lamp is pulled too fast across the wall the flame goes out for a moment (a cross, a mistake; it burns again after a second). With "reduce motion" there is no flicker
 * and the flame does not go out. When the four signs shine, the words stand below. The circle, the speed and the ring are `lightRadius`, `lampSpeed`, `isOnSign` and `fillStep` in `utils/danielGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { fillStep, isOnSign, LAMP_TOO_FAST, lampSpeed, lightRadius } from '@/utils/danielGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { LampGame } from '@/types/adventure'

const props = defineProps<{ game: LampGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every sign of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.signs.length, 0))

/** The lamp moves this much (percent of the picture) with one press of an arrow key. */
const KEY_STEP = 2.5
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const lamp = ref({ x: 50, y: 62 })
const fill = reactive<Record<number, number>>({})
const found = reactive<Record<number, boolean>>({})
const misses = ref(0)
const out = ref(false)
const between = ref(false)
const finished = ref(false)
const allFound = ref(false)
const message = ref('')
const now = ref(0)
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 4))
const flickers = computed(() => current.value.flicker && !reduced)
const radius = computed(() => (out.value ? 6 : lightRadius(current.value.radius, now.value, flickers.value)))
const foundCount = computed(() => current.value.signs.filter((_, i) => found[i]).length)

let last = Date.now()
const startedAt = Date.now()
const timer = window.setInterval(() => {
  const nowMs = Date.now()
  const dt = Math.min(250, nowMs - last)
  last = nowMs
  now.value = nowMs - startedAt
  if (between.value || finished.value) return
  current.value.signs.forEach((s, i) => {
    if (found[i]) return
    const on = !out.value && isOnSign(lamp.value, s, current.value.radius)
    fill[i] = fillStep(fill[i] ?? 0, dt, on)
    if (fill[i]! >= 1) {
      found[i] = true
      progress.mark()
      play('basket')
      message.value = ''
      if (foundCount.value >= current.value.signs.length) roundOver()
    }
  })
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

function blowOut() {
  if (out.value) return
  out.value = true
  misses.value++
  play('wrong')
  message.value = t('app.adventure.lampOut')
  later(() => {
    out.value = false
    message.value = ''
  }, 1000)
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.lampRight')
  if (lastRound.value) {
    allFound.value = true
    between.value = true
    later(() => {
      finished.value = true
    }, 2600)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(fill)) delete fill[Number(k)]
    for (const k of Object.keys(found)) delete found[Number(k)]
    last = Date.now()
    between.value = false
    message.value = ''
  }, 2200)
}

// pulling the lamp: it keeps the distance at which it was taken, so it does not jump to the finger
let grab = { dx: 0, dy: 0 }
let lastMove = { x: 0, y: 0, t: 0 }
function toPct(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function moveTo(p: { x: number; y: number }, t: number) {
  const next = { x: Math.min(96, Math.max(4, p.x + grab.dx)), y: Math.min(94, Math.max(6, p.y + grab.dy)) }
  const dt = t - lastMove.t
  if (!between.value && !finished.value && current.value.flicker && !reduced && dt >= 20 && lampSpeed(lamp.value, next, dt) > LAMP_TOO_FAST) blowOut()
  lastMove = { x: next.x, y: next.y, t }
  lamp.value = next
}
function onMove(e: PointerEvent) {
  const p = toPct(e)
  if (p) moveTo(p, e.timeStamp)
}
function stopDrag() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function startDrag(e: PointerEvent) {
  if (e.button > 0) return
  e.preventDefault()
  const p = toPct(e)
  if (!p) return
  grab = { dx: lamp.value.x - p.x, dy: lamp.value.y - p.y }
  lastMove = { x: lamp.value.x, y: lamp.value.y, t: e.timeStamp }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)
function key(e: KeyboardEvent) {
  const d = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }[e.key as 'ArrowLeft']
  if (!d) return
  e.preventDefault()
  lamp.value = { x: Math.min(96, Math.max(4, lamp.value.x + d[0]!)), y: Math.min(94, Math.max(6, lamp.value.y + d[1]!)) }
}

const darkStyle = computed(() => {
  const r = radius.value
  return { background: `radial-gradient(ellipse ${r}% ${(r * 4) / 3}% at ${lamp.value.x}% ${lamp.value.y}%, rgba(8, 10, 30, 0) 0%, rgba(8, 10, 30, 0) 55%, rgba(8, 10, 30, 0.86) 100%)` }
})
const lampStyle = computed(() => ({ left: `${lamp.value.x}%`, top: `${lamp.value.y}%`, width: `${props.game.lampW}%` }))
const signStyle = (i: number) => {
  const s = current.value.signs[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }
}
const ringStyle = (i: number) => ({ background: `conic-gradient(#ffe38a ${Math.round((fill[i] ?? 0) * 360)}deg, rgba(255, 227, 138, 0.18) 0deg)` })
</script>

<template lang="pug">
  div(class="lp")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="lp-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="lp-hint") {{ between && !allFound ? t('app.adventure.gameNext') : current.hint }}
      div(ref="field" class="lp-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(
          v-for="(s, i) in current.signs"
          :key="`${round}-${i}`"
          class="lp-sign"
          :class="{ found: found[i] }"
          :style="signStyle(i)"
          aria-hidden="true"
        )
          GameImage(:src="s.image" colour="#e3b948")
          span(v-if="!found[i] && (fill[i] ?? 0) > 0.02" class="lp-ring" :style="ringStyle(i)")
        div(class="lp-dark" :class="{ lit: allFound }" :style="darkStyle" aria-hidden="true")
        span(
          v-for="(s, i) in current.signs"
          v-show="found[i]"
          :key="`g-${round}-${i}`"
          class="lp-sign lp-glow"
          :style="signStyle(i)"
          aria-hidden="true"
        )
          GameImage(:src="s.image" colour="#e3b948")
        button(
          type="button"
          class="lp-lamp"
          :class="{ out }"
          :style="lampStyle"
          :aria-label="t('app.adventure.lampLamp')"
          @pointerdown="startDrag"
          @keydown="key"
        )
          GameImage(:src="game.lamp" colour="#b88a3a" round)
          GameMark(v-if="out" kind="bad" class="lp-mark")
      p(v-if="allFound" class="lp-words") {{ t('app.adventure.lampWords') }}
      p(class="lp-fb" role="status") {{ message || t('app.adventure.lampCount', { n: foundCount, total: current.signs.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lampDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.lp
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2d3350
  box-shadow: inset 0 0 18px rgba(0, 0, 20, 0.5)

.lp-round
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

.lp-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.lp-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1b1f38
  background-size: cover
  background-position: center
  touch-action: none

// the darkness over the wall with a soft circle of light at the lamp
.lp-dark
  position: absolute
  inset: 0
  pointer-events: none
  transition: opacity 900ms ease

  &.lit
    opacity: 0.25

// the signs are golden on black; `screen` takes the black away, so only the glow is left
.lp-sign
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  mix-blend-mode: screen

.lp-glow
  filter: drop-shadow(0 0 8px rgba(255, 220, 120, 0.9))

.lp-ring
  position: absolute
  inset: -14%
  border-radius: 50%
  -webkit-mask: radial-gradient(circle, transparent 62%, #000 64%)
  mask: radial-gradient(circle, transparent 62%, #000 64%)
  mix-blend-mode: normal

// the lamp: pulled with a finger; the tap area is bigger than the picture
.lp-lamp
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  touch-action: none
  user-select: none
  transform: translate(-50%, -50%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -22px

  &.out
    opacity: 0.55

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 12px

.lp-mark
  position: absolute
  top: -8px
  right: -8px

.lp-words
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1.1rem
  letter-spacing: 0.04em
  color: #f6e3a0

.lp-fb
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
  .lp-dark
    transition: none
</style>
