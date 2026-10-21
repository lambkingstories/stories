<script setup lang="ts">
/**
 * The twelve sons round the altar: under the big tree at Bethel stands the altar of stones, round it lie the places of the sons as pale rings on the ground (plan v3: the places are seen, like
 * the hours of a clock, the first one at the top), and the sons wait below. The child drags a son onto the ring (or taps a son and then the ring) and he snaps to the nearest free place; so
 * the ring is always even and there is no mistake. Round 1: four places (every third of the twelve), round 2: all twelve. The help button lets the next free place glow for three seconds (a tip,
 * the end gives `mistakeStars(tips, 1, 4)`). There is no clock. The places are `ringPlaces` and `nearestFree` in `utils/jakobGames2.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop, type DropPoint } from '@/use/useDragDrop'
import { nearestFree, PIC, ringPlaces, snapToRing } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RingGame } from '@/types/adventure'

const props = defineProps<{ game: RingGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every son of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.count, 0))

/** Stand-in colours of the three tunics until the pictures are there. */
const TUNICS = ['#c96f4b', '#5f8fb3', '#6aa36b']
/** How far from the ring (percent of the picture's width, in relation to the radius) a son may be let go to be taken for the ring. */
const REACH = 0.6
/** A son and its width (percent of the picture). */
const FIGURE = 8

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
/** The places of the sons: `count` places like the hours of a clock, the first one at the top. */
const places = computed(() => ringPlaces(current.value.count))

/** The sons that stand on the ring: which of them (0 to count - 1) and at which angle. */
const placed = ref<{ id: number; angle: number }[]>([])
const tips = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const help = ref<number[] | null>(null)
const stars = computed(() => mistakeStars(tips.value, 1, 4))
const src = (p: string) => prependBaseUrl(p)

const angles = computed(() => placed.value.map((p) => p.angle))
const freePlaces = computed(() => places.value.filter((a) => !angles.value.some((b) => Math.abs(((a - b + 540) % 360) - 180) < 1)))
const waiting = computed(() => Array.from({ length: current.value.count }, (_, i) => i).filter((i) => !placed.value.some((p) => p.id === i)))
const tokenOf = (id: number) => props.game.tokens[id % props.game.tokens.length] ?? ''
const tunicOf = (id: number) => TUNICS[id % TUNICS.length]

/** A point on the ring (percent of the picture) for an angle in degrees. */
function onRing(angle: number) {
  const rad = (angle * Math.PI) / 180
  const [cx, cy] = props.game.centre
  return { x: cx + props.game.radius * Math.cos(rad), y: cy + (props.game.radius * Math.sin(rad)) / PIC }
}
const figureStyle = (angle: number) => {
  const p = onRing(angle)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${FIGURE}%`, zIndex: String(Math.round(p.y) + 1) }
}
const helpStyle = (angle: number) => {
  const p = onRing(angle)
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${FIGURE * 0.7}%` }
}

/** Where, in percent of the picture, a point of the screen lies. */
function pointOf(at: DropPoint) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((at.x - r.left) / r.width) * 100, y: ((at.y - r.top) / r.height) * 100 }
}

function drop(tokenId: string, _target: string, at?: DropPoint) {
  if (between.value || finished.value) return
  const id = Number(tokenId.replace('son-', ''))
  if (placed.value.some((p) => p.id === id)) return
  let angle: number
  if (at) {
    const point = pointOf(at)
    if (!point) return
    const s = snapToRing(point, { x: props.game.centre[0], y: props.game.centre[1] }, props.game.radius)
    if (s.distance > props.game.radius * REACH) {
      message.value = t('app.adventure.ringOff')
      return
    }
    // the son snaps to the nearest free place
    const free = nearestFree(freePlaces.value, s.angle)
    if (free === undefined) return
    angle = free
  } else {
    // from the keyboard: the son goes to the next free place (in the order of the clock)
    const free = freePlaces.value[0]
    if (free === undefined) return
    angle = free
  }
  placed.value = [...placed.value, { id, angle }]
  progress.mark()
  play('snap')
  message.value = ''
  if (placed.value.length >= current.value.count) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1000)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    placed.value = []
    between.value = false
    message.value = ''
  }, 1500)
}

function showHelp() {
  if (help.value || between.value || finished.value) return
  tips.value++
  help.value = freePlaces.value.slice(0, 1)
  later(() => {
    help.value = null
  }, 3000)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target, at) => drop(id, target, at))
</script>

<template lang="pug">
  div(class="rg")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="rg-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="rg-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="rg-field game-soft"
        :class="{ ready: selected !== null }"
        data-drop="ring"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.ringField', { n: placed.length, total: current.count })"
        :style="{ '--bg': `url(${src(game.background)})` }"
        @click="tapPlace('ring', { x: $event.clientX, y: $event.clientY })"
        @keydown.enter.space.prevent="tapPlace('ring')"
      )
        svg(class="rg-ring" viewBox="0 0 100 66.667" preserveAspectRatio="none" aria-hidden="true")
          circle(:cx="game.centre[0]" :cy="game.centre[1] / 1.5" :r="game.radius")
        span(class="rg-altar" :style="{ left: `${game.centre[0]}%`, top: `${game.centre[1]}%` }")
          GameImage(:src="game.altar" :ratio="260 / 200" colour="#a79c85")
        template(v-if="!between")
          span(v-for="a in freePlaces" :key="`p-${round}-${a}`" class="rg-place" :class="{ glow: help && help.includes(a) }" :style="helpStyle(a)" aria-hidden="true")
        span(v-for="p in placed" :key="`${round}-${p.id}`" class="rg-son" :style="figureStyle(p.angle)" role="img" :aria-label="t('app.adventure.ringSon', { n: p.id + 1 })")
          GameImage(:src="tokenOf(p.id)" :ratio="100 / 160" :colour="tunicOf(p.id)")
      p(class="rg-fb" role="status") {{ message }}
      div(class="rg-tray" role="group" :aria-label="t('app.adventure.ringTray')")
        div(
          v-for="id in waiting"
          :key="`${round}-w-${id}`"
          class="rg-token"
          :class="{ chosen: selected === `son-${id}`, lifted: dragging === `son-${id}` }"
          :style="dragStyle(`son-${id}`)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.ringSon', { n: id + 1 })"
          @pointerdown="down($event, `son-${id}`)"
          @keydown.enter.space.prevent.stop="toggleSelect(`son-${id}`)"
        )
          GameImage(:src="tokenOf(id)" :ratio="100 / 160" :colour="tunicOf(id)")
      div(class="rg-actions")
        button(type="button" class="rg-btn" :disabled="!!help || between" @click="showHelp") {{ t('app.adventure.ringHelp') }}
        span(class="rg-count") {{ t('app.adventure.ringCount', { n: placed.length, total: current.count }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.ringDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.rg
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.rg-round
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

.rg-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.rg-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9c08c
  background-size: cover
  background-position: center
  touch-action: none

  &.ready
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

// the light ring on the ground
.rg-ring
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

  circle
    fill: none
    stroke: rgba(255, 250, 225, 0.85)
    stroke-width: 1.4
    stroke-dasharray: 3 2
    vector-effect: non-scaling-stroke

.rg-altar
  position: absolute
  display: block
  width: 20%
  transform: translate(-50%, -62%)
  pointer-events: none

.rg-son
  position: absolute
  display: block
  transform: translate(-50%, -88%)
  pointer-events: none

// a free place of a son: a pale ring on the ground; the help lets one glow
.rg-place
  position: absolute
  display: block
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(255, 246, 220, 0.85)
  background: rgba(255, 246, 200, 0.28)
  pointer-events: none

  &.glow
    border-color: rgba(255, 214, 90, 1)
    background: rgba(255, 224, 120, 0.6)
    box-shadow: 0 0 14px 4px rgba(255, 214, 90, 0.9)

.rg-fb
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

.rg-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 72px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.rg-token
  width: 48px
  padding: 3px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

.rg-actions
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.rg-btn
  min-height: 48px
  padding: 8px 22px
  border-radius: 999px
  border: 3px solid #d4a83e
  background: #fff3cf
  color: #3f321b
  font-weight: 800
  font-size: 1rem
  cursor: pointer

  &:disabled
    opacity: 0.6

.rg-count
  font-weight: 800
  color: #5f4f35
</style>
