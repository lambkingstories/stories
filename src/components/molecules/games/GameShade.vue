<script setup lang="ts">
/**
 * Keep the shade: Jonah sits before his hut on the dry hill, and the sun travels over the sky in a slow arc (a painted sun that the app moves). The child pulls the leafy roof of the castor-oil plant between the sun and
 * Jonah (with a finger, a mouse or the arrow keys). While the roof casts its shade on Jonah the bar "Shade" fills; in the sun the bar "Heat" rises, and when it is full Jonah gets a sunstroke (a cross, a mistake, quiet; the
 * heat falls to the half and the game goes on). A round is done when Jonah has sat in the shade for its time. Round 1: a slow sun and a wide shade; round 2: a faster sun and a narrower shade. With "reduce motion" the sun
 * is slower. Where the sun is, where the roof has to be and the heat are `sunAt`, `roofTarget`, `inShade` and `heatStep` in `utils/jonaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { heatStep, inShade, roofTarget, shadeParts, sunAt } from '@/utils/jonaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ShadeGame } from '@/types/adventure'

const props = defineProps<{ game: ShadeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: a part for every fifth of a second in the shade, in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + shadeParts(r), 0))

/** The roof moves this much (percent of the picture) with one press of an arrow key. */
const KEY_STEP = 3
/** The sun is slower with "reduce motion". */
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const roof = ref({ x: 50, y: 14 })
const heat = ref(0)
const shadeMs = ref(0)
const roundMs = ref(0)
const strokes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const stroke = ref(false)
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(strokes.value, 2, 5))

const wayMs = computed(() => current.value.sunSeconds * 1000 * (reduced ? 1.5 : 1))
const sunPos = computed(() => sunAt((roundMs.value % wayMs.value) / wayMs.value))
const target = computed(() => roofTarget(sunPos.value, { x: props.game.jonahBox.x, y: props.game.jonahBox.y }))
const shaded = computed(() => inShade(roof.value, target.value, current.value.tolerance))
const shadePart = computed(() => Math.min(1, shadeMs.value / (current.value.seconds * 1000)))

let marked = 0
let last = Date.now()
const timer = window.setInterval(() => {
  const nowMs = Date.now()
  const dt = Math.min(250, nowMs - last)
  last = nowMs
  if (between.value || finished.value) return
  roundMs.value += dt
  heat.value = heatStep(heat.value, dt, shaded.value)
  if (shaded.value) {
    shadeMs.value += dt
    const parts = Math.min(shadeParts(current.value), Math.floor(shadeMs.value / 200))
    while (marked < parts) {
      marked++
      progress.mark()
    }
  }
  if (heat.value >= 1) sunstroke()
  else if (shadeMs.value >= current.value.seconds * 1000) roundOver()
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

function sunstroke() {
  strokes.value++
  heat.value = 0.5
  play('wrong')
  message.value = t('app.adventure.shadeStroke')
  stroke.value = true
  later(() => {
    stroke.value = false
  }, 1100)
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.shadeRight')
  if (lastRound.value) {
    between.value = true
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    shadeMs.value = 0
    roundMs.value = 0
    heat.value = 0
    marked = 0
    last = Date.now()
    between.value = false
    message.value = ''
  }, 2200)
}

// pulling the roof
function fromPointer(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  roof.value = {
    x: Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100)),
    y: Math.min(80, Math.max(2, ((e.clientY - r.top) / r.height) * 100))
  }
}
function stopDrag() {
  window.removeEventListener('pointermove', fromPointer)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function startDrag(e: PointerEvent) {
  if (e.button > 0) return
  e.preventDefault()
  fromPointer(e)
  window.addEventListener('pointermove', fromPointer)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)
function key(e: KeyboardEvent) {
  const d = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }[e.key as 'ArrowLeft']
  if (!d) return
  e.preventDefault()
  roof.value = { x: Math.min(96, Math.max(4, roof.value.x + d[0]!)), y: Math.min(80, Math.max(2, roof.value.y + d[1]!)) }
}

const jb = computed(() => props.game.jonahBox)
const jonahStyle = computed(() => ({ left: `${jb.value.x}%`, top: `${jb.value.y}%`, width: `${jb.value.w}%` }))
const roofStyle = computed(() => ({ left: `${roof.value.x}%`, top: `${roof.value.y}%`, width: `${props.game.roofW}%` }))
const sunStyle = computed(() => ({ left: `${sunPos.value.x}%`, top: `${sunPos.value.y}%` }))
</script>

<template lang="pug">
  div(class="sd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(ref="field" class="sd-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="sd-sun" :style="sunStyle" aria-hidden="true")
          GameImage(:src="game.sun" colour="#f3c94a" round)
        span(class="sd-jonah" :class="{ hot: heat > 0.6, cool: shaded }" :style="jonahStyle" aria-hidden="true")
          GameImage(:src="game.jonah" :ratio="0.8" colour="#a8793e")
          GameMark(v-if="stroke" kind="bad" class="sd-mark")
        button(
          type="button"
          class="sd-roof"
          :style="roofStyle"
          :aria-label="t('app.adventure.shadeRoof')"
          @pointerdown="startDrag"
          @keydown="key"
        )
          GameImage(:src="game.roof" :ratio="2" colour="#4f8f3a")
      div(class="sd-bars")
        div(class="sd-bar")
          span(class="sd-bar-name") {{ t('app.adventure.shadeHeat') }}
          span(class="sd-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(heat * 100)")
            span(class="sd-fill heat" :style="{ width: `${Math.round(heat * 100)}%` }")
        div(class="sd-bar")
          span(class="sd-bar-name") {{ t('app.adventure.shadeShade') }}
          span(class="sd-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(shadePart * 100)")
            span(class="sd-fill shade" :style="{ width: `${Math.round(shadePart * 100)}%` }")
      p(class="sd-fb" role="status") {{ message || (shaded ? t('app.adventure.shadeIn') : t('app.adventure.shadeOut')) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shadeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcae
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sd-round
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

.sd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sd-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9ae7a
  background-size: cover
  background-position: center
  touch-action: none

.sd-sun
  position: absolute
  display: block
  width: 13%
  transform: translate(-50%, -50%)
  pointer-events: none

// Jonah: he gets red in the sun and calm in the shade (the app tints his painted picture, nothing is drawn)
.sd-jonah
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: filter 300ms linear

  &.hot
    filter: saturate(1.5) hue-rotate(-12deg) brightness(1.06)

  &.cool
    filter: saturate(0.9) brightness(0.92)

.sd-mark
  position: absolute
  top: -6px
  right: -6px

// the roof: pulled with a finger; the whole picture is the handle
.sd-roof
  position: absolute
  min-width: 72px
  min-height: 48px
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  touch-action: none
  user-select: none
  transform: translate(-50%, -50%)
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 12px

.sd-bars
  display: flex
  flex-direction: column
  gap: 6px

.sd-bar
  display: flex
  align-items: center
  gap: 8px

.sd-bar-name
  min-width: 4.6em
  font-weight: 800
  font-size: 0.95rem
  color: #5f4f35

.sd-track
  position: relative
  flex: 1
  height: 16px
  overflow: hidden
  border-radius: 999px
  border: 2px solid #d4a83e
  background: rgba(255, 246, 220, 0.9)

.sd-fill
  display: block
  height: 100%
  border-radius: 999px
  transition: width 120ms linear

  &.heat
    background: #e0743a

  &.shade
    background: #3f8f4a

.sd-fb
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
  .sd-jonah,
  .sd-fill
    transition: none
</style>
