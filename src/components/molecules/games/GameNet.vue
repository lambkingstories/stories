<script setup lang="ts">
/**
 * Cast the net (Matthew 4,18): Simon and Andrew were fishermen and cast their nets into the lake. Fish swim slowly across the lake; the child taps a place and the round net is cast there and takes in every fish under it.
 * A cast that finds no fish is a mistake (a cross, the net comes up empty). The reach is generous (at least 44 pixels across); whoever cannot aim gets the button "Cast for me" after fifteen seconds without a tap.
 * With reduced motion the fish stand still. Round 1 four fish, round 2 six, both slow. The swimming and the catch are in `utils/taufeGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { castNet, nearestFish, startFish, stepFish } from '@/utils/taufeGames'
import type { Fish } from '@/utils/taufeGames'
import { seeded } from '@/utils/jakobGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { NetGame } from '@/types/adventure'

const props = defineProps<{ game: NetGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every fish of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.fish.length, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const CAST_MS = 900
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const rounds = computed(() => props.game.rounds)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const swimmers = ref<Fish[]>([])
/** Which kind each fish is, and whether it is already in the net. */
const kinds = ref<string[]>([])
const taken = ref<boolean[]>([])
const netAt = ref<{ x: number; y: number } | null>(null)
const netEmpty = ref(false)
const misses = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const left = computed(() => taken.value.filter((x) => !x).length)
const fishOf = (id: string) => props.game.fish.find((f) => f.id === id)
let rand = seeded(1)

function startRound() {
  const r = current.value
  rand = seeded(53 + round.value * 29)
  swimmers.value = startFish(r.fish.length, props.game.area, r.speed, rand)
  kinds.value = [...r.fish]
  taken.value = r.fish.map(() => false)
  idle.value = 0
}
startRound()

function tick() {
  if (still || finished.value) return
  idle.value += TICK
  swimmers.value = stepFish(swimmers.value, TICK, props.game.area, rand)
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** The reach in percent of the width: at least 44 pixels across, as set in the data otherwise. */
function reach(): number {
  const width = field.value?.getBoundingClientRect().width ?? 0
  return Math.max(props.game.reach, width ? (22 / width) * 100 : 0)
}

function cast(at: { x: number; y: number }) {
  if (between.value || netAt.value || finished.value) return
  idle.value = 0
  netAt.value = at
  netEmpty.value = false
  // only fish that are not yet in the net count
  const free = swimmers.value.map((f, i) => (taken.value[i] ? { x: -999, y: -999, vx: 0, vy: 0 } : f))
  const hits = castNet(free, at, reach())
  if (!hits.length) {
    misses.value++
    netEmpty.value = true
    message.value = t('app.adventure.netEmpty')
    later(() => {
      play('wrong')
    }, 250)
    later(() => {
      netAt.value = null
    }, CAST_MS)
    return
  }
  message.value = t('app.adventure.netCaught')
  later(() => {
    for (const i of hits) {
      taken.value[i] = true
      progress.mark()
    }
    play('snap')
  }, 300)
  later(() => {
    netAt.value = null
    if (left.value > 0) return
    between.value = true
    if (lastRound.value) {
      play('star')
      finished.value = true
      return
    }
    later(() => {
      round.value++
      startRound()
      between.value = false
      message.value = ''
    }, 900)
  }, CAST_MS)
}

function tap(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  cast({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
}

/** The button for those who cannot aim: the net is cast over the fish that is nearest to the middle of the lake. */
function castForMe() {
  const free = swimmers.value.map((f, i) => (taken.value[i] ? { x: -999, y: -999, vx: 0, vy: 0 } : f))
  const i = nearestFish(free, { x: 50, y: 50 })
  const f = free[i]
  if (f && f.x > -900) cast({ x: f.x, y: f.y })
}

const fishStyle = (f: Fish, i: number) => {
  const k = fishOf(kinds.value[i] ?? '')
  return { left: `${f.x}%`, top: `${f.y}%`, width: `${k?.w ?? 12}%`, '--flip': f.vx < 0 ? '-1' : '1' }
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.netField')"
        @pointerdown="tap"
      )
        template(v-for="(f, i) in swimmers" :key="`${round}-${i}`")
          img(
            class="gm-fish"
            :class="{ in: taken[i] }"
            :src="src(fishOf(kinds[i] ?? '')?.image ?? '')"
            alt=""
            draggable="false"
            :style="fishStyle(f, i)"
          )
        div(v-if="netAt" class="gm-net" :class="{ empty: netEmpty }" :style="{ left: `${netAt.x}%`, top: `${netAt.y}%`, width: `${game.netW}%` }")
          img(:src="src(game.net)" alt="" draggable="false")
          span(v-if="netEmpty" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.netCount', { n: doneCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !netAt && !between" tone="gold" @click="castForMe") {{ t('app.adventure.netHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.netDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #cfe3e4
  box-shadow: inset 0 0 18px rgba(20, 60, 70, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #3f5560

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f5560

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #5d9aa5
  background-size: cover
  background-position: center
  touch-action: manipulation
  cursor: pointer

.gm-fish
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%) scaleX(var(--flip, 1))
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(10, 40, 50, 0.35))
  transition: left 50ms linear, top 50ms linear, opacity 400ms ease, scale 400ms ease

  &.in
    opacity: 0
    scale: 0.4

.gm-net
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 6
  animation: gm-cast 900ms ease-out forwards

  img
    display: block
    width: 100%
    height: auto
    filter: drop-shadow(0 4px 4px rgba(10, 40, 50, 0.4))

  &.empty
    animation: gm-empty 900ms ease-out forwards

.gm-cross
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #3f5560

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #2d3f46
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-cast
  0%
    opacity: 0
    transform: translate(-50%, -50%) scale(0.3) rotate(-40deg)
  35%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.1) rotate(0deg)
  80%
    opacity: 1
    transform: translate(-50%, -50%) scale(1) rotate(0deg)
  100%
    opacity: 0
    transform: translate(-50%, -50%) scale(0.6) rotate(0deg)

@keyframes gm-empty
  0%
    opacity: 0
    transform: translate(-50%, -50%) scale(0.3) rotate(-40deg)
  40%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.05) rotate(0deg)
  100%
    opacity: 0
    transform: translate(-50%, -50%) scale(1) rotate(0deg)

@media (prefers-reduced-motion: reduce)
  .gm-fish
    transition: none
  .gm-net
    animation: none
</style>
