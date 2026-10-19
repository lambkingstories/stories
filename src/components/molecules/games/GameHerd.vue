<script setup lang="ts">
/**
 * Herd the animals: on the wide meadow, in the light of the day of rest, an animal stands with its small herd behind it. The child leads it with a
 * finger to the resting place; the herd follows in a row on the way the leader walked (no swarm and no physics: the followers stand on points of
 * the trail at a fixed distance). In the second round a little pond lies in the way; the leader stops at its edge and the finger leads it round.
 * When the leader has come to the resting place the others gather round it and all lie down. There are no mistakes: the stars are all three when
 * both herds are at rest. A "Help" button shows a soft path to the resting place. The arithmetic is `utils/herd.ts`.
 */
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { extendTrail, followPositions, helpPath, inside, walk, type Circle, type Pt } from '@/utils/herd'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HerdGame } from '@/types/adventure'

const props = defineProps<{ game: HerdGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every herd that has to arrive (one per round)
progress.setGoal(props.game.rounds.length)

/** The meadow is 3 : 4, so its height is 133 units when its width is 100 (the arithmetic counts in width units). */
const H = 400 / 3
const FPS = 30
/** The distance of the followers on the trail, and the smaller distance when they gather at the resting place. */
const SPACING = 8
const GATHER_SPACING = 3.5
/** How far the leader's middle stays from the pond's edge (the size of an animal). */
const MARGIN = 5

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const units = (p: { x: number; y: number }): Pt => ({ x: p.x, y: (p.y * H) / 100 })
const rest = computed<Circle>(() => ({ ...units(current.value.rest), r: current.value.rest.r }))
const pond = computed<Circle | undefined>(() => (current.value.obstacle ? { ...units(current.value.obstacle), r: current.value.obstacle.r + MARGIN } : undefined))

const leader = ref<Pt>({ x: 0, y: 0 })
const followers = ref<Pt[]>([])
/** The way the leader has walked (not reactive: it changes at every step). */
const trail = shallowRef<Pt[]>([])
const finger = ref<Pt | null>(null)
const arrived = ref(false)
const resting = ref(false)
let gather = 0
const between = ref(false)
const finished = ref(false)
const message = ref('')
const helping = ref(false)
const arrivedCount = ref(0)
const stars = 3

/** A new round: the leader stands at its start, the herd in a row behind it (on the side away from the resting place). */
function loadRound() {
  const start = units(current.value.start)
  const away = { x: start.x - rest.value.x, y: start.y - rest.value.y }
  const len = Math.hypot(away.x, away.y) || 1
  const row: Pt[] = []
  for (let k = 60; k >= 0; k--) {
    row.push({ x: Math.min(96, Math.max(4, start.x + (away.x / len) * k * 0.8)), y: Math.min(H - 4, Math.max(10, start.y + (away.y / len) * k * 0.8)) })
  }
  trail.value = row
  leader.value = start
  followers.value = followPositions(row, SPACING, current.value.followers.length)
  arrived.value = false
  resting.value = false
  gather = 0
  finger.value = null
  helping.value = false
}
loadRound()

// ---- the finger (pointer, or the arrow keys)
const fieldEl = ref<HTMLElement | null>(null)
function unitsOf(e: PointerEvent): Pt {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / w) * 100 }
}
const canLead = () => !between.value && !finished.value && !arrived.value
function down(e: PointerEvent) {
  if (e.button > 0 || !canLead()) return
  finger.value = unitsOf(e)
}
function move(e: PointerEvent) {
  if (finger.value && canLead()) finger.value = unitsOf(e)
}
function up() {
  finger.value = null
}
let keyTimer = 0
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const dir = d[e.key]
  if (!dir || !canLead()) return
  e.preventDefault()
  // the staff points a little way ahead of the leader in that direction; the leader walks there
  finger.value = { x: Math.min(96, Math.max(4, leader.value.x + dir[0] * 14)), y: Math.min(H - 4, Math.max(10, leader.value.y + dir[1] * 14)) }
  window.clearTimeout(keyTimer)
  keyTimer = window.setTimeout(() => {
    finger.value = null
  }, 500)
}

// ---- the walk (a calm 30 steps a second)
const timer = window.setInterval(tick, 1000 / FPS)
function tick() {
  if (between.value || finished.value) return
  const dt = 1 / FPS
  if (!arrived.value) {
    if (finger.value) {
      leader.value = walk(leader.value, finger.value, dt, pond.value)
      extendTrail(trail.value, leader.value)
      followers.value = followPositions(trail.value, SPACING, current.value.followers.length)
    }
    // the leader is at the resting place: it stays, the others come to it
    if (inside(leader.value, { ...rest.value, r: rest.value.r * 0.85 })) {
      arrived.value = true
      finger.value = null
      message.value = t('app.adventure.herdArrived')
    }
    return
  }
  if (!resting.value) {
    gather = Math.min(1, gather + dt / 1.1)
    followers.value = followPositions(trail.value, SPACING + (GATHER_SPACING - SPACING) * gather, current.value.followers.length)
    if (gather >= 1) {
      resting.value = true
      arrivedCount.value++
      progress.mark()
      play('found')
      message.value = t('app.adventure.herdRest')
      roundOver()
    }
  }
}
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearTimeout(keyTimer)
})

function roundOver() {
  between.value = true
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1200)
    return
  }
  later(() => {
    round.value++
    loadRound()
    between.value = false
    message.value = ''
  }, 1800)
}

/** "Help": a soft dotted path from the leader to the resting place (round the pond), for a few seconds. */
function help() {
  if (between.value || finished.value || arrived.value) return
  helping.value = true
  later(() => (helping.value = false), 4000)
}
const helpLine = computed(() =>
  helpPath(leader.value, rest.value, pond.value)
    .map((p) => `${p.x},${p.y}`)
    .join(' ')
)

const src = (p: string) => prependBaseUrl(p)
const spot = (p: Pt, w: number) => ({ left: `${p.x}%`, top: `${(p.y / H) * 100}%`, width: `${w}%`, zIndex: String(Math.round(p.y)) })
const ring = (c: { x: number; y: number; r: number }) => ({ left: `${c.x}%`, top: `${c.y}%`, width: `${c.r * 2}%`, height: `${((c.r * 2) / H) * 100}%` })
</script>

<template lang="pug">
  div(class="hd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="hd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="hd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="fieldEl"
        class="hd-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.herdField')"
        :style="{ backgroundImage: `url(${src(game.scene)})` }"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @pointerleave="up"
        @keydown="onKey"
      )
        span(class="hd-zone" :style="ring(current.rest)" aria-hidden="true")
        svg(v-if="helping" class="hd-path" :viewBox="`0 0 100 ${H}`" preserveAspectRatio="none" aria-hidden="true")
          polyline(:points="helpLine")
        img(
          v-for="(f, i) in current.followers"
          :key="`${round}-f-${f.id}-${i}`"
          :src="src(f.image)"
          alt=""
          draggable="false"
          class="hd-animal follower"
          :class="{ resting }"
          :style="spot(followers[i] ?? leader, f.w)"
          :aria-label="t(resting ? 'app.adventure.herdAnimalRest' : 'app.adventure.herdAnimal', { name: f.label })"
        )
        img(
          :key="`${round}-leader`"
          :src="src(current.leader.image)"
          alt=""
          draggable="false"
          class="hd-animal leader"
          :class="{ resting }"
          :style="spot(leader, current.leader.w)"
          :aria-label="t(resting ? 'app.adventure.herdAnimalRest' : 'app.adventure.herdLeader', { name: current.leader.label })"
        )
        span(v-if="finger" class="hd-staff" :style="{ left: `${finger.x}%`, top: `${(finger.y / H) * 100}%` }" aria-hidden="true")
      p(class="hd-fb" role="status") {{ message }}
      p(class="hd-count") {{ t('app.adventure.herdCount', { n: arrivedCount, total: rounds.length }) }}
      div(class="hd-actions")
        AdvButton(tone="blau" small :disabled="between || arrived" @click="help") {{ t('app.adventure.herdHelp') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.herdDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #d5e6b2
  box-shadow: inset 0 0 18px rgba(40, 70, 20, 0.3)

.hd-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 252, 232, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.hd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.92)

.hd-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-size: cover
  background-position: center
  touch-action: none
  user-select: none
  -webkit-user-select: none

// the resting place: a soft ring (the shade of the trees, or the watering place)
.hd-zone
  position: absolute
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(255, 255, 255, 0.85)
  background: rgba(255, 244, 200, 0.18)
  pointer-events: none

.hd-path
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

  polyline
    fill: none
    stroke: rgba(255, 244, 180, 0.95)
    stroke-width: 1.6
    stroke-dasharray: 3 3
    stroke-linecap: round
    stroke-linejoin: round

.hd-animal
  position: absolute
  height: auto
  transform: translate(-50%, -88%)
  pointer-events: none
  filter: drop-shadow(0 4px 3px rgba(40, 60, 20, 0.5))
  transition: filter 400ms ease-out

  &.resting
    filter: drop-shadow(0 4px 3px rgba(40, 60, 20, 0.5)) brightness(0.95)

.hd-staff
  position: absolute
  width: 34px
  height: 34px
  margin: -17px 0 0 -17px
  border-radius: 50%
  border: 3px solid rgba(255, 255, 255, 0.9)
  background: rgba(120, 80, 30, 0.3)
  pointer-events: none

.hd-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 252, 232, 0.94)

  &:empty
    display: none

.hd-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

.hd-actions
  display: flex
  justify-content: center
</style>
