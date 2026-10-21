<script setup lang="ts">
/**
 * Quietly down the slope: by night a winding path leads down the slope to the far camp. Gideon and Pura (a pair of small figures) are led from one resting place in the shadow (a rock) to the next. At the
 * edge of the path tired watchers with lanterns sit; from each lantern a cone of light sways slowly to and fro. As long as the pair stays in the shadow of a rock, it is safe. If a cone of light
 * reaches the pair while it is on the open path, it stops, the watcher yawns (nothing frightening, no alarm), and the pair goes back to the last rock (a cross, a dull sound, a "caught" counts as a
 * mistake). Waiting in the shadow is never a mistake and there is no time limit. The child leads the pair by dragging along the path, or presses "Go on", which glows green when the way to the next rock is
 * free just now. Round 1: two watchers, calm swings, three stretches; round 2: three watchers, uneven swings, three stretches. The cones are `coneAngle` and `lit`, the way `wayPoint` and `nearestPart`,
 * in `utils/gideonGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { coneAngle, lit, nearestPart, nextShadow, PAIR_SPEED, SLOPE, stopParts, wayLength, wayPoint } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SneakGame } from '@/types/adventure'

const props = defineProps<{ game: SneakGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every stretch of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.stops.length, 0))

/** One step of the clock (ms), how close to a rock counts as "at the rock" (part of the way), and the width of a cone (degrees, half). */
const TICK = 50
const AT = 0.004
const HALF = 13

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const parts = computed(() => stopParts(props.game.path, current.value.stops))
/** The time since the game began (ms): the cones swing by it. */
const t0 = Date.now()
const clock = ref(0)
/** Where the pair is (part of the way, 0 to 1), where it is going, and the last rock it reached (0 is the start). */
const here = ref(0)
const target = ref(0)
const base = ref(0)
const reached = ref(0)
const dragging = ref(false)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 6))
const total = computed(() => wayLength(props.game.path))

const next = computed(() => nextShadow(parts.value, base.value))
const pos = computed(() => wayPoint(props.game.path, here.value))
const atRock = computed(() => Math.abs(here.value - base.value) < AT || parts.value.some((p) => Math.abs(here.value - p) < AT))
const isLit = (p: { x: number; y: number }, at = clock.value) => current.value.watchers.some((w) => lit(w, at, p, HALF))

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 800)
}

function step() {
  clock.value = Date.now() - t0
  if (between.value || finished.value) return
  // the pair walks towards where it is going, at a steady pace
  if (Math.abs(target.value - here.value) > 1e-6 && total.value) {
    const d = (PAIR_SPEED * (TICK / 1000)) / total.value
    here.value = target.value > here.value ? Math.min(target.value, here.value + d) : Math.max(target.value, here.value - d)
  }
  // caught in the light on the open path
  if (!atRock.value && isLit(pos.value)) {
    caught()
    return
  }
  // arrived at the next rock
  const n = next.value
  if (n !== null && Math.abs(here.value - n) < AT) {
    here.value = n
    base.value = n
    target.value = n
    reached.value++
    progress.mark()
    play('snap')
    message.value = ''
    flashOn('good')
    if (next.value === null) roundOver()
  }
}
const timer = window.setInterval(step, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function caught() {
  mistakes.value++
  play('wrong')
  flashOn('bad')
  message.value = t('app.adventure.sneakCaught')
  here.value = base.value
  target.value = base.value
  dragging.value = false
}

/** "Go on": the pair walks to the next rock. */
function goOn() {
  if (between.value || finished.value || next.value === null) return
  target.value = next.value
}

// leading the pair with a finger: it follows the finger along the path, never past the next rock and never back past the last one
function fromPointer(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height || next.value === null) return
  const part = nearestPart(props.game.path, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  target.value = Math.min(next.value, Math.max(base.value, part))
}
function pointerDown(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  dragging.value = true
  fromPointer(e)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
function onMove(e: PointerEvent) {
  if (dragging.value) fromPointer(e)
}
function stopDrag() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  if (dragging.value) {
    dragging.value = false
    // let go: the pair stays where it is
    target.value = here.value
  }
}
onBeforeUnmount(stopDrag)

function roundOver() {
  play('star')
  message.value = t('app.adventure.sneakRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    here.value = 0
    target.value = 0
    base.value = 0
    reached.value = 0
    between.value = false
    message.value = ''
  }, 2000)
}

/** The way to the next rock is free just now: no cone reaches any point of it at this moment. */
const clear = computed(() => {
  const n = next.value
  if (n === null) return false
  for (let i = 0; i <= 12; i++) {
    const p = wayPoint(props.game.path, here.value + ((n - here.value) * i) / 12)
    if (isLit(p)) return false
  }
  return true
})

const polyline = computed(() => props.game.path.map((p) => `${p[0]},${p[1] / SLOPE}`).join(' '))
/** A cone as a wedge in the units of the picture (100 wide, 133 high): the lantern, and two points on the edges of the beam. */
function wedge(w: SneakGame['rounds'][number]['watchers'][number]) {
  const a = coneAngle(w, clock.value)
  const rad = (d: number) => (d * Math.PI) / 180
  const pt = (d: number) => `${w.x + Math.cos(rad(d)) * w.reach},${w.y / SLOPE + Math.sin(rad(d)) * w.reach}`
  return `${w.x},${w.y / SLOPE} ${pt(a - HALF)} ${pt(a)} ${pt(a + HALF)}`
}
const pairStyle = computed(() => ({ left: `${pos.value.x}%`, top: `${pos.value.y}%` }))
const watcherStyle = (w: { x: number; y: number }) => ({ left: `${w.x}%`, top: `${w.y}%` })
const rockStyle = (s: [number, number]) => ({ left: `${s[0]}%`, top: `${s[1]}%` })
</script>

<template lang="pug">
  div(class="sn")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sn-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="sn-field"
        role="group"
        :aria-label="t('app.adventure.sneakField', { n: reached, total: current.stops.length })"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @pointerdown="pointerDown"
      )
        svg(class="sn-svg" viewBox="0 0 100 133.333" preserveAspectRatio="none" aria-hidden="true")
          polyline(:points="polyline" class="sn-way")
          polygon(v-for="(w, i) in current.watchers" :key="`c-${round}-${i}`" :points="wedge(w)" class="sn-cone")
        template(v-if="!between")
          span(v-for="(s, i) in current.stops" :key="`r-${round}-${i}`" class="sn-rock" :class="{ reached: i < reached }" :style="rockStyle(s)" aria-hidden="true")
          span(
            v-for="(w, i) in current.watchers"
            :key="`w-${round}-${i}`"
            class="sn-watcher"
            :style="watcherStyle(w)"
            aria-hidden="true"
          )
            GameImage(:src="game.watcherImages[i % game.watcherImages.length] ?? ''" :ratio="140 / 200" colour="#5a4a62")
          span(class="sn-pair" :class="{ shade: atRock }" :style="pairStyle" role="img" :aria-label="t('app.adventure.sneakPair')")
            GameImage(:src="game.pair" :ratio="140 / 180" colour="#c9895a")
        GameMark(v-if="flash" :kind="flash" class="sn-mark")
      p(class="sn-fb" role="status") {{ message }}
      AdvButton(tone="gold" class="sn-go" :class="{ ready: clear }" :disabled="between || next === null" @click.stop="goOn") {{ clear ? t('app.adventure.sneakGoFree') : t('app.adventure.sneakGo') }}
      p(class="sn-count") {{ t('app.adventure.sneakCount', { n: reached, total: current.stops.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sneakDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sn-round
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

.sn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sn-field
  position: relative
  width: 100%
  max-width: 380px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1f2440
  background-size: cover
  background-position: center
  touch-action: none

.sn-svg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.sn-way
  fill: none
  stroke: rgba(255, 246, 220, 0.28)
  stroke-width: 7
  stroke-linecap: round
  stroke-linejoin: round
  vector-effect: non-scaling-stroke

// the cone of light of a lantern: a soft wedge
.sn-cone
  fill: rgba(255, 232, 140, 0.34)
  stroke: rgba(255, 240, 170, 0.6)
  stroke-width: 1
  vector-effect: non-scaling-stroke

// a rock with a shadow: a safe place
.sn-rock
  position: absolute
  display: block
  width: 9%
  aspect-ratio: 1.3
  transform: translate(-50%, -60%)
  border-radius: 45% 55% 40% 40%
  background: rgba(40, 40, 52, 0.85)
  border: 2px dashed rgba(255, 246, 220, 0.55)
  pointer-events: none

  &.reached
    border-style: solid
    border-color: rgba(120, 220, 140, 0.9)

.sn-watcher
  position: absolute
  display: block
  width: 13%
  transform: translate(-50%, -100%)
  pointer-events: none

.sn-pair
  position: absolute
  display: block
  width: 10%
  transform: translate(-50%, -100%)
  transition: filter 150ms ease
  pointer-events: none
  z-index: 4

  &.shade
    filter: brightness(0.75)

.sn-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 8

.sn-fb
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

.sn-go
  align-self: center
  min-height: 56px

  &.ready
    box-shadow: 0 0 0 4px rgba(60, 180, 90, 0.9)

.sn-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
