<script setup lang="ts">
/**
 * Chaff in the wind: in the winepress Gideon threshes wheat. In a flat winnowing tray lie golden grains and light chaff. At the right side a slider sets the wind (up is stronger). With little wind
 * everything stays; with a middle wind the light chaff lifts and flies away to the right (a glitter and a tick); with too strong a wind grains fly away, too: each lost grain is a small cross (a mistake)
 * and stays lost. The round ends when all the chaff is gone. Round 1: ten pieces of chaff, eight grains, a wide right range of wind; round 2: twelve, a narrow range and a light gust that swings the
 * wind a little (always the same). There is no clock: the wind can be set to nothing at any time. The pieces and the wind are `makePieces`, `blow` and `effectiveWind` in `utils/gideonGames.ts`. With
 * reduced motion the pieces fade out instead of flying.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { blow, effectiveWind, makePieces } from '@/utils/gideonGames'
import { scatter } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { WinnowGame } from '@/types/adventure'

const props = defineProps<{ game: WinnowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every piece of chaff of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.chaff, 0))

/** A step of the wind in whole percent for the keys, how often the wind acts (ms), and how long a piece flies (ms). */
const KEY_STEP = 5
const TICK_MS = 400
const FLY_MS = 700

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const pieces = computed(() => makePieces(current.value))
/** Where each piece lies in the tray (percent of the picture), always the same for the same round. */
const places = computed(() => {
  const b = props.game.trayBox
  const spots = scatter(pieces.value.length, current.value.seed + 3, { x: b.x + 3, y: b.y + 4, w: b.w - 6, h: b.h - 8 })
  return pieces.value.map((p, i) => ({ id: p.id, kind: p.kind, x: spots[i]!.x, y: spots[i]!.y }))
})
const wind = ref(0)
const tick = ref(0)
/** The pieces that fly (and for how long) or are gone. */
const flying = reactive<Record<string, number>>({})
const gone = reactive<Record<string, boolean>>({})
const lost = ref(0)
/** Grains lost in this round (the closing line tells it). */
const lostHere = ref(0)
const flash = ref<{ x: number; y: number; k: number } | null>(null)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const track = ref<HTMLElement | null>(null)
let flashKey = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(lost.value, 2, 6))
const chaffLeft = computed(() => pieces.value.filter((p) => p.kind === 'chaff' && !gone[p.id]).length)
const chaffGone = computed(() => current.value.chaff - chaffLeft.value)
const rest = computed(() => pieces.value.filter((p) => !gone[p.id]))

const timer = window.setInterval(act, TICK_MS)
onBeforeUnmount(() => window.clearInterval(timer))

/** The wind acts on the tray. */
function act() {
  if (between.value || finished.value) return
  tick.value++
  const eff = effectiveWind(wind.value, current.value.gust, current.value.seed, tick.value)
  const blown = blow(rest.value, eff)
  if (!blown.chaff.length && !blown.grains.length) return
  for (const id of blown.chaff) away(id)
  if (blown.chaff.length) {
    play('tap')
    message.value = ''
    for (let i = 0; i < blown.chaff.length; i++) progress.mark()
  }
  for (const id of blown.grains) {
    away(id)
    lost.value++
    lostHere.value++
    const p = places.value.find((x) => x.id === id)
    if (p) {
      const k = ++flashKey
      flash.value = { x: p.x, y: p.y, k }
      later(() => {
        if (flash.value?.k === k) flash.value = null
      }, 900)
    }
  }
  if (blown.grains.length) {
    play('wrong')
    message.value = t('app.adventure.winnowGrain')
  }
  if (chaffLeft.value === 0) roundOver()
}
function away(id: string) {
  gone[id] = true
  flying[id] = 1
  later(() => {
    delete flying[id]
  }, FLY_MS)
}

function roundOver() {
  play('star')
  message.value = t(lostHere.value ? 'app.adventure.winnowRightLost' : 'app.adventure.winnowRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(gone)) delete gone[k]
    for (const k of Object.keys(flying)) delete flying[k]
    wind.value = 0
    lostHere.value = 0
    between.value = false
    message.value = ''
  }, 1900)
}

// setting the wind: drag the handle, or use the keys
function setWind(v: number) {
  if (between.value || finished.value) return
  wind.value = Math.min(100, Math.max(0, Math.round(v)))
}
function fromPointer(e: PointerEvent) {
  const r = track.value?.getBoundingClientRect()
  if (!r || !r.height) return
  setWind((1 - (e.clientY - r.top) / r.height) * 100)
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
  if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setWind(wind.value + KEY_STEP)
  else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setWind(wind.value - KEY_STEP)
  else if (e.key === 'PageUp') setWind(wind.value + 2 * KEY_STEP)
  else if (e.key === 'PageDown') setWind(wind.value - 2 * KEY_STEP)
  else if (e.key === 'Home') setWind(0)
  else if (e.key === 'End') setWind(100)
  else return
  e.preventDefault()
}

const box = computed(() => props.game.trayBox)
const trayStyle = computed(() => ({ left: `${box.value.x}%`, top: `${box.value.y}%`, width: `${box.value.w}%`, height: `${box.value.h}%` }))
const visible = computed(() => places.value.filter((p) => !gone[p.id] || flying[p.id]))
const pieceStyle = (p: { x: number; y: number }) => ({ left: `${p.x}%`, top: `${p.y}%` })
const handleStyle = computed(() => ({ bottom: `${wind.value}%` }))
</script>

<template lang="pug">
  div(class="wn")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="wn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="wn-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="wn-field game-soft" role="group" :aria-label="t('app.adventure.winnowField', { n: chaffGone, total: current.chaff })" :style="{ '--bg': `url(${src(game.background)})`, '--soft': softOf(game.background) }")
        div(class="wn-tray" :style="trayStyle" aria-hidden="true")
          GameImage(:src="game.tray" :ratio="480 / 300" colour="#b88f55")
        template(v-if="!between")
          span(
            v-for="p in visible"
            :key="`${round}-${p.id}`"
            class="wn-piece"
            :class="[p.kind, { flying: flying[p.id] }]"
            :style="pieceStyle(p)"
            aria-hidden="true"
          )
            GameImage(:src="p.kind === 'chaff' ? game.chaffImage : game.grain" :colour="p.kind === 'chaff' ? '#e6dc9a' : '#d29a2e'" round)
        GameMark(v-if="flash" :kind="'bad'" class="wn-mark" :style="{ left: `${flash.x}%`, top: `${flash.y}%` }")
        div(class="wn-slider")
          div(
            ref="track"
            class="wn-track"
            role="slider"
            tabindex="0"
            aria-orientation="vertical"
            :aria-label="t('app.adventure.winnowWind')"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="wind"
            @pointerdown="startDrag"
            @keydown="key"
          )
            span(class="wn-handle" :style="handleStyle")
              GameImage(:src="game.handle" colour="#dfe9f2" round)
          span(class="wn-wind") {{ t('app.adventure.winnowPercent', { n: wind }) }}
      p(class="wn-fb" role="status") {{ message }}
      p(class="wn-count") {{ t('app.adventure.winnowCount', { n: chaffGone, total: current.chaff }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.winnowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.wn-round
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

.wn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.wn-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99a6a
  background-size: cover
  background-position: center

.wn-tray
  position: absolute
  pointer-events: none

// a piece lies in the tray; when the wind takes it, it flies to the right
.wn-piece
  position: absolute
  display: block
  width: 3.6%
  transform: translate(-50%, -50%)
  pointer-events: none

  &.chaff
    z-index: 3

  &.flying
    animation: wn-fly 700ms ease-in forwards

.wn-mark
  position: absolute
  transform: translate(-50%, -50%)
  z-index: 6

// the slider of the wind, up is stronger
.wn-slider
  position: absolute
  right: 4%
  top: 8%
  bottom: 8%
  width: 56px
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px

.wn-track
  position: relative
  flex: 1
  width: 24px
  border-radius: 999px
  background: linear-gradient(0deg, rgba(240, 236, 220, 0.9), rgba(150, 190, 225, 0.95))
  border: 3px solid #d4a83e
  touch-action: none
  cursor: pointer

.wn-handle
  position: absolute
  left: 50%
  display: block
  width: 52px
  height: 52px
  margin: 0 0 -26px -26px
  pointer-events: none

.wn-wind
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.wn-fb
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

.wn-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes wn-fly
  from
    opacity: 1
    transform: translate(-50%, -50%)
  to
    opacity: 0
    transform: translate(260%, -300%) rotate(160deg)

@media (prefers-reduced-motion: reduce)
  .wn-piece.flying
    animation: wn-fade 700ms ease-in forwards

@keyframes wn-fade
  from
    opacity: 1
  to
    opacity: 0
</style>
