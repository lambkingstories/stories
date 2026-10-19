<script setup lang="ts">
/**
 * Sow the seeds: in the morning light a wide field lies with deep furrows, and the garden is at its edge. At the bottom lies a bag of seeds. The
 * child pulls the bag back with a finger (a soft sling) and lets go: a seed flies the other way in an arc and falls on the field; where it falls
 * into a furrow, a sprout grows. A ring shows where the seed would land while the bag is held. A seed that misses sinks gently into the earth (a
 * small cross; the next try); the seeds never run out. In the second round the furrows are farther and a light wind (a little flag shows where
 * it blows) drives the seed sideways. A tap on a furrow with the keyboard sows it too, and after three misses in a row a tap helps.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import { hits, isThrow, landing, pullOf, type Pt } from '@/utils/sow'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SowFurrow, SowGame } from '@/types/adventure'

const props = defineProps<{ game: SowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every furrow of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.furrows.length, 0))

/** Where the seed bag lies (the middle, as percent of the field). */
const ORIGIN: Pt = { x: 50, y: 90 }
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const wind = computed(() => current.value.wind)
const furrows = computed<SowFurrow[]>(() => current.value.furrows.map((id) => props.game.furrows.find((f) => f.id === id)).filter((f): f is SowFurrow => !!f))

/** The furrows that have a sprout, how far the sprout has grown (1 = just sown, 2 = grown) and the number of misses in a row. */
const sown = reactive<Record<string, number>>({})
const mistakes = ref(0)
const missRun = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<{ at: Pt; kind: 'good' | 'bad'; k: number } | null>(null)
let flashKey = 0
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))
/** After three misses in a row a tap on a furrow sows it (a help, never a must). */
const assist = computed(() => missRun.value >= 3)

// ---- the throw
const fieldEl = ref<HTMLElement | null>(null)
/** The pull while the bag is held, in percent of the field. */
const pull = ref<Pt | null>(null)
/** The seed in the air or on the ground: where it lands, and whether it flies. */
const seed = ref<{ at: Pt; flying: boolean; k: number } | null>(null)
let seedKey = 0

/** Pixels to percent of the field (the field has a size on a screen; in a window without layout it is a 100 px square). */
function toPercent(dx: number, dy: number): Pt {
  const box = fieldEl.value?.getBoundingClientRect()
  const w = box && box.width > 0 ? box.width : 100
  const h = box && box.height > 0 ? box.height : 100
  return { x: (dx / w) * 100, y: (dy / h) * 100 }
}
let startX = 0
let startY = 0

function onMove(e: PointerEvent) {
  pull.value = pullOf(toPercent(e.clientX - startX, e.clientY - startY))
}
function stop() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onCancel)
}
function onCancel() {
  stop()
  pull.value = null
}
function onUp(e: PointerEvent) {
  stop()
  const drag = toPercent(e.clientX - startX, e.clientY - startY)
  pull.value = null
  if (isThrow(drag)) throwSeed(landing(ORIGIN, drag, wind.value))
}
function onDown(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  e.preventDefault()
  startX = e.clientX
  startY = e.clientY
  pull.value = { x: 0, y: 0 }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
}
onBeforeUnmount(stop)

/** Where the seed would land if it were let go now (the ring). */
const aim = computed(() => (pull.value && isThrow(pull.value) ? landing(ORIGIN, pull.value, wind.value) : null))

function showFlash(at: Pt, kind: 'good' | 'bad') {
  const k = ++flashKey
  flash.value = { at, kind, k }
  later(() => {
    if (flash.value?.k === k) flash.value = null
  }, 900)
}

/** The seed is let go: it flies, and when it comes down it sows a furrow or sinks into the earth. */
function throwSeed(at: Pt) {
  if (between.value || finished.value) return
  const k = ++seedKey
  seed.value = { at: ORIGIN, flying: true, k }
  play('tap')
  // one frame later the seed is on its way (the flight is a transition from the bag to the landing)
  later(() => {
    if (seed.value?.k === k) seed.value = { at, flying: true, k }
  }, 30)
  later(() => land(at, k), 650)
}

function land(at: Pt, k: number) {
  if (seed.value?.k === k) seed.value = { ...seed.value, flying: false }
  const furrow = furrows.value.find((f) => !sown[f.id] && hits(at, f))
  if (furrow) {
    sow(furrow, at)
  } else if (furrows.value.some((f) => sown[f.id] && hits(at, f))) {
    // a furrow that has its sprout already: the seed simply sinks in, nothing is lost and nothing counted
    message.value = ''
  } else {
    mistakes.value++
    missRun.value++
    play('wrong')
    showFlash(at, 'bad')
    message.value = t('app.adventure.sowMiss')
  }
  later(() => {
    if (seed.value?.k === k) seed.value = null
  }, 500)
}

function sow(f: SowFurrow, at?: Pt) {
  if (sown[f.id] || between.value || finished.value) return
  sown[f.id] = 1
  missRun.value = 0
  progress.mark()
  play('sack')
  showFlash(at ?? { x: f.x, y: f.y }, 'good')
  message.value = t('app.adventure.fbRight')
  later(() => {
    sown[f.id] = 2
  }, 900)
  if (furrows.value.every((x) => sown[x.id])) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1100)
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(sown)) delete sown[k]
    missRun.value = 0
    seed.value = null
    message.value = ''
  }, 1800)
}

/** A tap on a furrow: with the keyboard (Enter) it sows, and so it does after three misses in a row. */
function onFurrow(f: SowFurrow, e: MouseEvent) {
  if (e.detail === 0 || assist.value) sow(f)
}

const src = (p: string) => prependBaseUrl(p)
const place = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const furrowBox = (f: SowFurrow) => ({ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` })
const sproutStyle = (f: SowFurrow) => ({ left: `${f.x}%`, top: `${f.y}%`, width: `${Math.max(8, f.w * 0.5)}%` })
const windLeaning = computed(() => (wind.value > 0.05 ? 'right' : wind.value < -0.05 ? 'left' : 'calm'))
</script>

<template lang="pug">
  div(class="sw")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sw-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(ref="fieldEl" class="sw-field" role="group" :aria-label="t('app.adventure.sowField')" :style="{ backgroundImage: `url(${src(game.field)})` }")
        button(
          v-for="f in furrows"
          :key="`${round}-${f.id}`"
          type="button"
          class="sw-furrow"
          :class="{ sown: !!sown[f.id], assist: assist && !sown[f.id] }"
          :style="furrowBox(f)"
          :aria-label="t(sown[f.id] ? 'app.adventure.sowFurrowDone' : 'app.adventure.sowFurrow')"
          @click="onFurrow(f, $event)"
        )
        img(
          v-for="f in furrows"
          v-show="sown[f.id]"
          :key="`s-${round}-${f.id}`"
          :src="src(game.sprout)"
          alt=""
          draggable="false"
          class="sw-sprout"
          :class="{ grown: sown[f.id] === 2 }"
          :style="sproutStyle(f)"
        )
        img(v-if="game.vane && wind !== 0" :src="src(game.vane)" alt="" draggable="false" class="sw-vane" :class="windLeaning" :aria-label="t('app.adventure.sowWind')")
        span(v-if="aim" class="sw-aim" :style="place(aim)" aria-hidden="true")
        img(v-if="seed" :key="seed.k" :src="src(game.seed)" alt="" draggable="false" class="sw-seed" :class="{ flying: seed.flying }" :style="place(seed.at)")
        div(
          class="sw-bag"
          :class="{ held: pull !== null }"
          :style="{ left: `${50 + (pull?.x ?? 0)}%`, top: `${90 + (pull?.y ?? 0)}%` }"
          role="img"
          :aria-label="t('app.adventure.sowBag')"
          @pointerdown="onDown"
        )
          img(:src="src(game.bag)" alt="" draggable="false")
        GameMark(v-if="flash" :key="flash.k" :kind="flash.kind" class="sw-mark" :style="place(flash.at)")
      p(class="sw-fb" role="status") {{ message }}
      p(class="sw-count") {{ t('app.adventure.sowCount', { n: Object.keys(sown).length, total: furrows.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8d9a8
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.sw-round
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

.sw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.sw-field
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

// a furrow is a wide tap target (the seed lands in it; for the keyboard and for the help it takes a tap)
.sw-furrow
  position: absolute
  transform: translate(-50%, -50%)
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent
  cursor: default

  &.assist
    box-shadow: 0 0 0 3px rgba(255, 230, 120, 0.9)
    cursor: pointer

.sw-sprout
  position: absolute
  height: auto
  transform: translate(-50%, -88%) scale(0.5)
  transform-origin: 50% 100%
  pointer-events: none
  transition: transform 700ms cubic-bezier(0.2, 1.4, 0.4, 1)
  filter: drop-shadow(0 3px 3px rgba(40, 60, 20, 0.5))

  &.grown
    transform: translate(-50%, -88%) scale(1)

.sw-vane
  position: absolute
  top: 3%
  right: 4%
  width: 14%
  height: auto
  pointer-events: none
  transform-origin: 50% 100%

  &.left
    transform: scaleX(-1)

.sw-aim
  position: absolute
  width: 36px
  height: 36px
  margin: -18px 0 0 -18px
  border-radius: 50%
  border: 3px dashed rgba(255, 255, 255, 0.95)
  box-shadow: 0 0 0 2px rgba(60, 40, 10, 0.35)
  pointer-events: none

.sw-seed
  position: absolute
  width: 7%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: left 600ms ease-out, top 600ms ease-in-out, opacity 400ms ease-out

  &.flying
    animation: sw-arc 600ms ease-in-out

  &:not(.flying)
    opacity: 0

.sw-bag
  position: absolute
  width: 24%
  transform: translate(-50%, -50%)
  cursor: grab
  touch-action: none

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 5px 5px rgba(40, 30, 10, 0.55))

  &.held
    cursor: grabbing

.sw-mark
  position: absolute
  transform: translate(-50%, -50%)

.sw-fb
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

.sw-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

// the seed rises and falls in an arc (it grows a little as it is high)
@keyframes sw-arc
  0%, 100%
    scale: 1
  50%
    scale: 1.7

@media (prefers-reduced-motion: reduce)
  .sw-seed
    transition: none
    animation: none

  .sw-sprout
    transition: none
</style>
