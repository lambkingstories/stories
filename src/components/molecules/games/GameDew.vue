<script setup lang="ts">
/**
 * The night goes by: on the threshing floor lies the fleece, a bowl stands below. Above the picture runs a bar with the moon at its start (evening) and the morning at its end. The child draws the
 * moon along the bar (or uses the arrow keys); the sky changes from dark blue through rose to light. When the morning has come, drops of dew glitter. Round 1 "the first night": the dew lies only on
 * the fleece (five drops), the ground is dry; the child taps the drops. Round 2 "the second night": the dew lies only on the ground round the fleece (eight drops), the fleece is dry. A tap on a dry
 * place (on the ground in round 1, on the fleece in round 2) shows a little sun with a cross (a mistake, quiet). The moon can be drawn back at any time (no mistake). The sky is `skyColour`, the
 * dry places `inBox`, in `utils/gideonGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { inBox, skyColour } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DewGame } from '@/types/adventure'

const props = defineProps<{ game: DewGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every drop of dew of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.spots.length, 0))

/** From this part of the bar on it is morning (the drops glitter), and from this part on the sun takes the place of the moon. */
const MORNING = 0.95
const SUNRISE = 0.6
/** How much the keys move the moon (part of the bar). */
const KEY_STEP = 0.05

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const sky = ref(0)
const found = reactive<Record<number, boolean>>({})
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const full = ref(false)
const message = ref('')
const dry = ref<{ x: number; y: number; k: number } | null>(null)
const field = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
let dryKey = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 6))
const morning = computed(() => sky.value >= MORNING)
const count = computed(() => Object.keys(found).length)

function setSky(v: number) {
  if (between.value || finished.value) return
  sky.value = Math.min(1, Math.max(0, v))
}

// drawing the moon along the bar
function fromPointer(e: PointerEvent) {
  const r = track.value?.getBoundingClientRect()
  if (!r || !r.width) return
  setSky((e.clientX - r.left) / r.width)
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
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setSky(sky.value + KEY_STEP)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setSky(sky.value - KEY_STEP)
  else if (e.key === 'Home') setSky(0)
  else if (e.key === 'End') setSky(1)
  else return
  e.preventDefault()
}

function drop(i: number) {
  if (between.value || finished.value || found[i] || !morning.value) return
  found[i] = true
  progress.mark()
  play('bead')
  message.value = ''
  if (count.value >= current.value.spots.length) roundOver()
}

/** A tap on the floor: on a dry place it is a mistake (the drops themselves are buttons and do not come here). */
function floorTap(e: MouseEvent) {
  if (!morning.value || between.value || finished.value) return
  if (e.target instanceof Element && e.target.closest('.dw-spot')) return
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  const p = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  const onFleece = inBox(p, props.game.fleeceBox)
  const isDry = current.value.wet === 'fleece' ? !onFleece : onFleece
  if (!isDry) return
  misses.value++
  play('wrong')
  message.value = t(current.value.wet === 'fleece' ? 'app.adventure.dewDryGround' : 'app.adventure.dewDryFleece')
  const k = ++dryKey
  dry.value = { ...p, k }
  later(() => {
    if (dry.value?.k === k) dry.value = null
  }, 900)
}

function roundOver() {
  full.value = true
  play('star')
  message.value = t('app.adventure.dewRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1500)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(found)) delete found[Number(k)]
    sky.value = 0
    full.value = false
    between.value = false
    message.value = ''
  }, 2200)
}

const box = computed(() => props.game.fleeceBox)
const place = (b: { x: number; y: number; w: number; h: number }) => ({ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` })
const handleStyle = computed(() => ({ left: `${sky.value * 100}%` }))
const sunUp = computed(() => sky.value >= SUNRISE)
</script>

<template lang="pug">
  div(class="dw")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="dw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="dw-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="dw-bar")
        div(
          ref="track"
          class="dw-track"
          role="slider"
          tabindex="0"
          aria-orientation="horizontal"
          :aria-label="t('app.adventure.dewSlider')"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(sky * 100)"
          :aria-valuetext="morning ? t('app.adventure.dewMorning') : sunUp ? t('app.adventure.dewDawn') : t('app.adventure.dewNight')"
          @pointerdown="startDrag"
          @keydown="key"
        )
          span(class="dw-handle" :style="handleStyle")
            GameImage(:src="sunUp ? game.sun : game.moon" :colour="sunUp ? '#f3c94a' : '#e8e4d0'" round)
        span(class="dw-end") {{ t('app.adventure.dewMorningWord') }}
      div(ref="field" class="dw-field" :style="{ backgroundImage: `url(${src(game.background)})` }" @click="floorTap")
        span(class="dw-sky" :style="{ backgroundColor: skyColour(sky) }" aria-hidden="true")
        span(class="dw-fleece" :style="place(box)" aria-hidden="true")
          GameImage(:src="game.fleece" :ratio="420 / 300" colour="#f4ecd8")
        span(class="dw-bowl" :class="{ full }" aria-hidden="true")
          GameImage(:src="game.bowl" :ratio="240 / 160" colour="#b88f55")
        template(v-if="morning && !between")
          button(
            v-for="(s, i) in current.spots"
            :key="`${round}-${i}`"
            type="button"
            class="dw-spot"
            :class="{ found: found[i] }"
            :style="{ left: `${s[0]}%`, top: `${s[1]}%` }"
            :aria-label="found[i] ? t('app.adventure.dewFound') : t('app.adventure.dewDrop', { n: i + 1 })"
            @click.stop="drop(i)"
          )
            span(class="dw-drop" aria-hidden="true")
        span(v-if="dry" :key="dry.k" class="dw-dry" :style="{ left: `${dry.x}%`, top: `${dry.y}%` }" aria-hidden="true")
          GameImage(:src="game.sun" colour="#f3c94a" round)
          GameMark(kind="bad" class="dw-mark")
      p(class="dw-fb" role="status") {{ message }}
      p(class="dw-count") {{ t('app.adventure.dewCount', { n: count, total: current.spots.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.dewDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.dw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.dw-round
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

.dw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the bar of the night: the moon at its start, the morning at its end
.dw-bar
  display: flex
  align-items: center
  gap: 10px

.dw-track
  position: relative
  flex: 1
  height: 44px
  border-radius: 999px
  background: linear-gradient(90deg, rgb(22, 32, 72), rgb(90, 70, 120), rgb(214, 130, 130), rgb(196, 226, 246))
  border: 3px solid #d4a83e
  touch-action: none
  cursor: pointer

.dw-handle
  position: absolute
  top: 50%
  display: block
  width: 40px
  height: 40px
  margin: -20px 0 0 -20px
  pointer-events: none

.dw-end
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

.dw-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #a58c5f
  background-size: cover
  background-position: center

// the sky tints the picture (the dark night, the rose dawn, the light morning)
.dw-sky
  position: absolute
  inset: 0
  opacity: 0.55
  mix-blend-mode: multiply
  transition: background-color 150ms linear
  pointer-events: none

.dw-fleece
  position: absolute
  display: block
  pointer-events: none

.dw-bowl
  position: absolute
  left: 50%
  bottom: 4%
  display: block
  width: 24%
  transform: translateX(-50%)
  pointer-events: none

  &.full
    filter: drop-shadow(0 0 8px rgba(120, 200, 255, 0.95))

// a drop of dew: big enough for a thumb, glittering
.dw-spot
  position: absolute
  width: 48px
  height: 48px
  margin: -24px 0 0 -24px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.dw-drop
  position: absolute
  left: 50%
  top: 50%
  display: block
  width: 18px
  height: 18px
  margin: -9px 0 0 -9px
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%
  background: radial-gradient(circle at 35% 30%, #ffffff, #bfe6ff 60%, #78b8e8)
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.95)
  animation: dw-glitter 1500ms ease-in-out infinite

.dw-spot.found .dw-drop
  animation: none
  background: #2fae54
  box-shadow: 0 0 8px rgba(60, 200, 90, 0.9)

.dw-dry
  position: absolute
  display: block
  width: 44px
  margin: -22px 0 0 -22px
  pointer-events: none

.dw-mark
  position: absolute
  top: -10px
  right: -10px

.dw-fb
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

.dw-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes dw-glitter
  0%, 100%
    transform: scale(1)
    opacity: 1
  50%
    transform: scale(1.25)
    opacity: 0.75

@media (prefers-reduced-motion: reduce)
  .dw-sky
    transition: none

  .dw-drop
    animation: dw-pulse 2400ms ease-in-out infinite

@keyframes dw-pulse
  0%, 100%
    opacity: 1
  50%
    opacity: 0.7
</style>
