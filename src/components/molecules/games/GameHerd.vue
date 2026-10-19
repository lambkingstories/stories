<script setup lang="ts">
/**
 * Herd the animals: on the wide meadow the animals of the land stand scattered. On the day of rest the child leads them, with a finger as the
 * shepherd's staff, gently to the resting place in the shade of the trees. They step away from the finger (shy ones from farther off), stay
 * together, slow down in the shade and lie down there. Nothing threatens them and none runs away, so there are no mistakes: the stars are all
 * three when every animal rests. A "Help" button shows a soft path to the resting place. The steering is `utils/herd.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { makeAnimal, stepHerd, type Animal, type Pt } from '@/utils/herd'
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
// the whole task: every animal of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.animals.length, 0))

/** The meadow is 3 : 4, so its height is 133 units when its width is 100 (the steering counts in width units). */
const H = 400 / 3
const FPS = 30
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const zone = computed(() => ({ x: props.game.rest.x, y: (props.game.rest.y * H) / 100, r: props.game.rest.r }))

interface Walker extends Animal {
  id: string
  image: string
  label: string
  w: number
}
const walkers = reactive<Walker[]>([])
function loadRound() {
  walkers.splice(
    0,
    walkers.length,
    ...current.value.animals
      .map((id) => props.game.animals.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map((a) => ({ ...makeAnimal(a.x, (a.y * H) / 100, !!a.shy), id: a.id, image: a.image, label: a.label, w: a.w }))
  )
}
loadRound()

const between = ref(false)
const finished = ref(false)
const message = ref('')
const finger = ref<Pt | null>(null)
const helping = ref(false)
const restCount = computed(() => walkers.filter((w) => w.resting).length)
const stars = 3

// ---- the finger (pointer, or the arrow keys)
const fieldEl = ref<HTMLElement | null>(null)
function unitsOf(e: PointerEvent): Pt {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  return { x: ((e.clientX - (box?.left ?? 0)) / w) * 100, y: ((e.clientY - (box?.top ?? 0)) / w) * 100 }
}
function down(e: PointerEvent) {
  if (between.value || finished.value || e.button > 0) return
  finger.value = unitsOf(e)
}
function move(e: PointerEvent) {
  if (finger.value) finger.value = unitsOf(e)
}
function up() {
  finger.value = null
}
let keyFinger: Pt | null = null
let keyTimer = 0
function onKey(e: KeyboardEvent) {
  const d: Record<string, [number, number]> = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, -7], ArrowDown: [0, 7] }
  const step = d[e.key]
  if (!step || between.value || finished.value) return
  e.preventDefault()
  keyFinger = { x: Math.min(98, Math.max(2, (keyFinger?.x ?? 50) + step[0])), y: Math.min(H - 2, Math.max(2, (keyFinger?.y ?? H - 10) + step[1])) }
  finger.value = { ...keyFinger }
  window.clearTimeout(keyTimer)
  keyTimer = window.setTimeout(() => {
    finger.value = null
  }, 700)
}

// ---- the steering loop (a calm 30 steps a second)
const timer = window.setInterval(tick, 1000 / FPS)
function tick() {
  if (between.value || finished.value) return
  const before = restCount.value
  stepHerd(walkers, finger.value, 1 / FPS, zone.value, { w: 100, h: H })
  const now = restCount.value
  for (let i = before; i < now; i++) {
    progress.mark()
    play('found')
  }
  if (now > before) message.value = t('app.adventure.herdRest')
  if (walkers.length && now === walkers.length) roundOver()
}
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearTimeout(keyTimer)
})

function roundOver() {
  if (lastRound.value) {
    between.value = true
    later(() => {
      finished.value = true
      play('star')
    }, 1100)
    return
  }
  between.value = true
  finger.value = null
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    loadRound()
    between.value = false
    message.value = ''
  }, 1600)
}

/** "Help": a soft dotted path from the herd to the resting place, for a few seconds. */
function help() {
  if (between.value || finished.value) return
  helping.value = true
  later(() => (helping.value = false), 4000)
}
const herdCentre = computed(() => {
  const loose = walkers.filter((w) => !w.resting)
  if (!loose.length) return zone.value
  return { x: loose.reduce((s, w) => s + w.x, 0) / loose.length, y: loose.reduce((s, w) => s + w.y, 0) / loose.length }
})

const src = (p: string) => prependBaseUrl(p)
const walkerStyle = (w: Walker) => ({ left: `${w.x}%`, top: `${(w.y / H) * 100}%`, width: `${w.w}%` })
const zoneStyle = computed(() => ({
  left: `${props.game.rest.x}%`,
  top: `${props.game.rest.y}%`,
  width: `${props.game.rest.r * 2}%`,
  height: `${((props.game.rest.r * 2) / H) * 100}%`
}))
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
        span(class="hd-zone" :style="zoneStyle" aria-hidden="true")
        svg(v-if="helping" class="hd-path" :viewBox="`0 0 100 ${H}`" preserveAspectRatio="none" aria-hidden="true")
          line(:x1="herdCentre.x" :y1="herdCentre.y" :x2="zone.x" :y2="zone.y")
        img(
          v-for="w in walkers"
          :key="`${round}-${w.id}`"
          :src="src(w.image)"
          alt=""
          draggable="false"
          class="hd-animal"
          :class="{ resting: w.resting }"
          :style="walkerStyle(w)"
          :aria-label="t(w.resting ? 'app.adventure.herdAnimalRest' : 'app.adventure.herdAnimal', { name: w.label })"
        )
        span(v-if="finger" class="hd-staff" :style="{ left: `${finger.x}%`, top: `${(finger.y / H) * 100}%` }" aria-hidden="true")
      p(class="hd-fb" role="status") {{ message }}
      p(class="hd-count") {{ t('app.adventure.herdCount', { n: restCount, total: walkers.length }) }}
      div(class="hd-actions")
        AdvButton(tone="blau" small :disabled="between" @click="help") {{ t('app.adventure.herdHelp') }}
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

// the resting place: a soft ring in the shade of the trees
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

  line
    stroke: rgba(255, 244, 180, 0.95)
    stroke-width: 1.6
    stroke-dasharray: 3 3
    stroke-linecap: round

.hd-animal
  position: absolute
  height: auto
  transform: translate(-50%, -88%)
  pointer-events: none
  filter: drop-shadow(0 4px 3px rgba(40, 60, 20, 0.5))
  transition: filter 400ms ease-out

  &.resting
    filter: drop-shadow(0 4px 3px rgba(40, 60, 20, 0.5)) brightness(0.96)

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
