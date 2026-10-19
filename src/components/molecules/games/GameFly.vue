<script setup lang="ts">
/**
 * The steering game: the dove follows the finger (or the mouse, or the arrow keys) over the sky. There is no enemy and nothing that can hit
 * the dove. Round 1: fly through the soft lights over the water and back to the ark. Round 2: through two lights to the olive tree, take
 * the leaf, and carry it back to the ark. A light that was missed is only missed: the dove may land in the ark at any time (in round 2 with
 * the leaf). Stars come from the lights that were touched (all but one 3 stars, more than half 2, otherwise 1).
 * The dove is only moved by the finger's path: the hits are computed along the line from one finger position to the next, so a fast
 * swipe cannot skip a light, and nothing needs a running animation to work.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { catchStars } from '@/utils/adventureScore'
import { pathTouches, skyDistance, type SkyPoint } from '@/utils/flyMath'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { FlyGame } from '@/types/adventure'

const props = defineProps<{ game: FlyGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every light and the leaf of every round, and the landing of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.targets.length + 1, 0))

/** Radius of a light and of the landing place, in percent of the width of the sky (a light is about 70 px wide on a phone). */
const R_LIGHT = 10.5
const R_HOME = 13
const R_LEAF = 9

type Pt = SkyPoint

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lightsTotal = computed(() => rounds.value.reduce((n, r) => n + r.targets.filter((x) => x.kind === 'light').length, 0))
const caught = ref(0)
const hit = reactive<Record<number, boolean>>({})
const hasLeaf = ref(false)
const pos = ref<Pt>({ ...props.game.home })
const facingLeft = ref(false)
const following = ref(false)
/** The dove must have left the landing place once before it can land (it starts there). */
const leftHome = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
const field = ref<HTMLElement | null>(null)
const stars = computed(() => catchStars(caught.value, lightsTotal.value))

const radiusOf = (kind: 'light' | 'leaf') => (kind === 'leaf' ? R_LEAF : R_LIGHT)
const lightsInRound = computed(() => current.value.targets.filter((x) => x.kind === 'light'))
const lightsLeft = computed(() => current.value.targets.filter((x, i) => x.kind === 'light' && !hit[i]).length)
/** The ark waits (glows) when the round can end there. */
const homeReady = computed(() => (current.value.needLeaf ? hasLeaf.value : lightsLeft.value === 0))
const caughtInRound = computed(() => lightsInRound.value.length - lightsLeft.value)

function showFlash(p: Pt, kind: 'good' | 'bad') {
  flash.value = { ...p, kind }
  later(() => {
    flash.value = null
  }, 900)
}

function roundOver() {
  between.value = true
  progress.mark()
  play('right')
  showFlash(props.game.home, 'good')
  message.value = ''
  if (round.value >= rounds.value.length - 1) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(hit)) delete hit[Number(k)]
    hasLeaf.value = false
    leftHome.value = false
    pos.value = { ...props.game.home }
    message.value = ''
  }, 1500)
}

/** The finger is now at `to`: the dove flies there; whatever lies on the way is touched. */
function moveTo(to: Pt) {
  if (between.value || finished.value) return
  const from = pos.value
  const p: Pt = { x: Math.min(100, Math.max(0, to.x)), y: Math.min(100, Math.max(0, to.y)) }
  if (Math.abs(p.x - from.x) > 0.4) facingLeft.value = p.x < from.x
  current.value.targets.forEach((tg, i) => {
    if (hit[i] || !pathTouches(from, p, tg, radiusOf(tg.kind))) return
    hit[i] = true
    progress.mark()
    showFlash(tg, 'good')
    if (tg.kind === 'light') {
      caught.value++
      play('right')
    } else {
      hasLeaf.value = true
      play('found')
      message.value = t('app.adventure.flyLeafGot')
    }
  })
  pos.value = p
  const nearHome = pathTouches(from, p, props.game.home, R_HOME)
  if (!nearHome && skyDistance(p, props.game.home) > R_HOME * 1.4) leftHome.value = true
  if (nearHome && leftHome.value) {
    if (current.value.needLeaf && !hasLeaf.value) {
      // no mistake, only a gentle "not yet": the dove must fly out again first
      message.value = t('app.adventure.flyNoLeaf')
      play('wrong')
      showFlash(props.game.home, 'bad')
      leftHome.value = false
      return
    }
    roundOver()
  } else if (homeReady.value && !message.value) {
    message.value = t('app.adventure.flyHomeHint')
  }
}

function pointOf(e: PointerEvent | MouseEvent): Pt | null {
  const el = field.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function onDown(e: PointerEvent) {
  if (e.button > 0) return
  following.value = true
  try {
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  } catch {
    // no capture (a test, or a pointer that is already gone): the move events still reach the field
  }
  const p = pointOf(e)
  if (p) moveTo(p)
}
function onMove(e: PointerEvent) {
  // a finger or pen steers while it touches; a mouse steers by moving over the sky
  if (!following.value && e.pointerType !== 'mouse') return
  const p = pointOf(e)
  if (p) moveTo(p)
}
const onUp = () => {
  following.value = false
}

/** The keyboard's way: the arrow keys move the dove a step. */
function onKey(e: KeyboardEvent) {
  const step: Record<string, [number, number]> = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }
  const d = step[e.key]
  if (!d) return
  e.preventDefault()
  moveTo({ x: pos.value.x + d[0], y: pos.value.y + d[1] })
}

const at = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const bg = computed(() => ({ backgroundImage: `url(${prependBaseUrl(current.value.background)})` }))
</script>

<template lang="pug">
  div(class="fl")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="fl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="fl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="fl-sky"
        :style="bg"
        tabindex="0"
        role="group"
        :aria-label="t('app.adventure.flyField')"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @keydown="onKey"
      )
        div(
          v-for="(tg, i) in current.targets"
          :key="`${round}-${i}`"
          class="fl-target"
          :class="[tg.kind, { caught: hit[i] }]"
          :style="at(tg)"
          role="img"
          :aria-label="tg.kind === 'leaf' ? t('app.adventure.flyLeaf') : t('app.adventure.flyLight')"
        )
          img(v-if="tg.kind === 'leaf' && !hit[i]" :src="prependBaseUrl(game.leaf)" alt="" draggable="false")
          GameMark(v-if="hit[i] && tg.kind === 'light'" kind="good" class="fl-tick")
        div(class="fl-home" :class="{ ready: homeReady }" :style="at(game.home)" role="img" :aria-label="t('app.adventure.flyArk')")
          img(:src="prependBaseUrl(game.ark)" alt="" draggable="false")
          GameMark(v-if="flash && flash.kind === 'bad'" kind="bad" class="fl-tick")
        div(class="fl-dove" :class="{ left: facingLeft }" :style="at(pos)" role="img" :aria-label="t('app.adventure.flyDove')")
          img(class="wing-a" :src="prependBaseUrl(game.dove[0])" alt="" draggable="false")
          img(class="wing-b" :src="prependBaseUrl(game.dove[1])" alt="" draggable="false")
          img(v-if="hasLeaf" class="fl-carried" :src="prependBaseUrl(game.leaf)" alt="" draggable="false")
      p(class="fl-fb" role="status") {{ message }}
      p(class="fl-count") {{ t('app.adventure.flyCount', { n: caughtInRound, total: lightsInRound.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.flyDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.fl
  display: flex
  flex-direction: column
  gap: 10px

.fl-round
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #8a6a1f

.fl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.fl-sky
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 16px
  border: 3px solid #d4a83e
  background-color: #bcd9ee
  background-size: cover
  background-position: center
  box-shadow: 0 6px 14px -6px rgba(60, 40, 10, 0.5)
  touch-action: none
  user-select: none
  -webkit-user-select: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff3b0
    outline-offset: 2px

.fl-target
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none

  &.light
    width: 21%
    aspect-ratio: 1
    border-radius: 50%
    // a soft spot of light (a marker of the game, not a picture)
    background: radial-gradient(circle, rgba(255, 252, 214, 0.95) 0%, rgba(255, 238, 150, 0.75) 50%, rgba(255, 238, 150, 0.35) 72%)
    // a thin white ring and a warm glow, so that the light shows on a light sky, too
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 16px 5px rgba(255, 196, 80, 0.75)
    animation: fl-glow 1800ms ease-in-out infinite

    &.caught
      animation: none
      opacity: 0.45

  &.leaf
    width: 18%
    animation: fl-glow 1800ms ease-in-out infinite

    img
      display: block
      width: 100%
      height: auto
      filter: drop-shadow(0 0 8px rgba(255, 245, 160, 0.95))

.fl-tick
  position: absolute
  left: 50%
  top: 50%
  transform: translate(-50%, -50%)

.fl-home
  position: absolute
  width: 34%
  transform: translate(-50%, -50%)
  pointer-events: none
  border-radius: 14px

  img
    display: block
    width: 100%
    height: auto

  &.ready
    animation: fl-ready 1200ms ease-in-out infinite

.fl-dove
  position: absolute
  width: 24%
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: left 420ms ease-out, top 420ms ease-out
  z-index: 5

  img
    display: block
    width: 100%
    height: auto
    filter: drop-shadow(0 4px 4px rgba(30, 40, 60, 0.45))

  // the wings go up and down by swapping two pictures (CSS only)
  .wing-b
    position: absolute
    left: 0
    top: 0
    animation: fl-flap 440ms steps(1) infinite

  .wing-a
    animation: fl-flap-a 440ms steps(1) infinite

  &.left img
    transform: scaleX(-1)

  .fl-carried
    position: absolute
    width: 34%
    right: -14%
    top: 8%
    transform: rotate(-20deg)
    filter: drop-shadow(0 0 6px rgba(255, 245, 160, 0.9))

  &.left .fl-carried
    right: auto
    left: -14%
    transform: scaleX(-1) rotate(-20deg)

.fl-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #5f4f35

.fl-count
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

@keyframes fl-flap
  0%
    opacity: 0
  50%
    opacity: 1

@keyframes fl-flap-a
  0%
    opacity: 1
  50%
    opacity: 0

@keyframes fl-glow
  0%, 100%
    transform: translate(-50%, -50%) scale(1)
  50%
    transform: translate(-50%, -50%) scale(1.1)

@keyframes fl-ready
  0%, 100%
    box-shadow: 0 0 0 0 rgba(47, 174, 84, 0.85)
  50%
    box-shadow: 0 0 0 10px rgba(47, 174, 84, 0)

@media (prefers-reduced-motion: reduce)
  .fl-target.light,
  .fl-target.leaf,
  .fl-home.ready
    animation: none
  .fl-dove
    transition: none
  .fl-dove .wing-b
    display: none
  .fl-dove .wing-a
    animation: none
    opacity: 1
</style>
