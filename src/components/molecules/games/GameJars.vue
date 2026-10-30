<script setup lang="ts">
/**
 * Fill the jars: in the courtyard of the widow a row of empty clay jars stands on the ground (a painted picture, the jars are pictures of their own). The little oil jug (a picture) hangs above them. The child drags the jug with
 * a finger and holds it over a jar: the jar fills with golden oil (a bar of oil rises inside the jar and the jar says how full it is). When it is full the jug has to move on to the next jar; oil that keeps running into a full
 * jar spills over (a cross, a mistake, one for each jar). The jug keeps pouring where it was left, also when the finger is lifted. When all jars of a round are full the next round brings more and bigger jars; after the last
 * jar "there is no jar left" and the oil stops. With the arrow keys the jug moves by steps. The arithmetic is in `utils/elisaGames.ts`; the places are percent of the picture.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { allFull, jarAt, JUG_STEP, pourStep } from '@/utils/elisaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { JarGame } from '@/types/adventure'

const props = defineProps<{ game: JarGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every jar
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.jars.length, 0))

const round = ref(0)
const fieldEl = ref<HTMLElement | null>(null)
const jug = reactive({ x: props.game.jugStart.x, y: props.game.jugStart.y })
const dragging = ref(false)
/** The jug waits where it hangs until the child has touched it (so it does not pour on the first jar by itself). */
const moved = ref(false)
const fills = ref<number[]>(props.game.rounds[0]!.jars.map(() => 0))
const overs = ref<number[]>(props.game.rounds[0]!.jars.map(() => 0))
const counted = ref<boolean[]>(props.game.rounds[0]!.jars.map(() => false))
const spillAt = ref<number[]>([])
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const over = computed(() => (moved.value ? jarAt(jug, current.value.jars) : -1))
const fullCount = computed(() => progress.parts.value)
const totalJars = computed(() => props.game.rounds.reduce((n, r) => n + r.jars.length, 0))

let timer = 0
let last = 0
function tick() {
  const now = performance.now()
  const dt = Math.min(200, now - last)
  last = now
  if (between.value || finished.value) return
  const i = over.value
  if (i < 0) return
  const jar = current.value.jars[i]!
  const r = pourStep({ fill: fills.value[i]!, over: overs.value[i]! }, dt, jar.ms)
  fills.value[i] = r.fill
  overs.value[i] = r.over
  if (r.fill >= 1 && !counted.value[i]) {
    counted.value[i] = true
    progress.mark()
    play('snap')
    message.value = t('app.adventure.jarsFull')
    if (allFull(fills.value)) endRound()
  }
  if (r.spilled) {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.jarsSpill')
    spillAt.value.push(i)
    later(() => {
      spillAt.value = spillAt.value.filter((k) => k !== i)
    }, 1100)
  }
}
onMounted(() => {
  last = performance.now()
  timer = window.setInterval(tick, 50)
})
onBeforeUnmount(() => window.clearInterval(timer))

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.jarsLast')
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => {
    round.value++
    fills.value = current.value.jars.map(() => 0)
    overs.value = current.value.jars.map(() => 0)
    counted.value = current.value.jars.map(() => false)
    spillAt.value = []
    jug.x = props.game.jugStart.x
    jug.y = props.game.jugStart.y
    moved.value = false
    between.value = false
    message.value = ''
  }, 1800)
}

function toPercent(e: PointerEvent): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent) {
  if (between.value || finished.value) return
  const p = toPercent(e)
  if (!p) return
  dragging.value = true
  move2(p)
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!dragging.value) return
  const p = toPercent(e)
  if (p) move2(p)
}
function move2(p: { x: number; y: number }) {
  moved.value = true
  jug.x = Math.max(4, Math.min(96, p.x))
  jug.y = Math.max(8, Math.min(92, p.y))
}
function up() {
  dragging.value = false
}
function key(e: KeyboardEvent) {
  if (between.value || finished.value) return
  if (e.key === 'ArrowLeft') jug.x = Math.max(4, jug.x - JUG_STEP)
  else if (e.key === 'ArrowRight') jug.x = Math.min(96, jug.x + JUG_STEP)
  else return
  moved.value = true
  e.preventDefault()
}
const jarPic = (k: number) => src(props.game.jars[k]!)
const fillStyle = (i: number) => ({ '--f': `${Math.round(fills.value[i]! * 100)}%` })
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="fieldEl"
        class="gm-field"
        tabindex="0"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.jarsYard')"
        @pointerdown.prevent="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @keydown="key"
        @contextmenu.prevent
      )
        //- the jars with the oil that rises inside them
        div(
          v-for="(j, i) in current.jars"
          :key="`j${i}`"
          class="gm-jar"
          :class="{ full: fills[i] >= 1, hot: over === i }"
          :style="{ left: `${j.x}%`, top: `${j.y}%`, width: `${j.w}%` }"
          role="img"
          :aria-label="t('app.adventure.jarsJar', { n: i + 1 })"
        )
          img(class="gm-jarpic" :src="jarPic(j.sprite)" alt="" draggable="false")
          span(class="gm-oil" :style="{ ...fillStyle(i), maskImage: `url(${jarPic(j.sprite)})`, WebkitMaskImage: `url(${jarPic(j.sprite)})` }" aria-hidden="true")
          span(v-if="spillAt.includes(i)" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        //- the jug
        img(
          class="gm-jug"
          :class="{ pouring: over >= 0 }"
          :src="src(game.jug)"
          alt=""
          draggable="false"
          :style="{ left: `${jug.x}%`, top: `${jug.y}%`, width: `${game.jugW}%` }"
        )
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.jarsCount', { n: fullCount, total: totalJars }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.jarsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6a5a48
  background-size: cover
  background-position: center
  touch-action: none
  cursor: grab
  outline-offset: 2px

.gm-jar
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

  &.hot
    filter: drop-shadow(0 0 8px rgba(255, 220, 110, 0.95))

  &.full
    filter: drop-shadow(0 0 6px rgba(120, 200, 90, 0.9))

.gm-jarpic
  display: block
  width: 100%
  height: auto

// the oil: a golden-yellow fill that rises from the bottom (a level), cut to the shape of the jar by the picture of the jar
.gm-oil
  position: absolute
  inset: 0
  background: linear-gradient(to top, rgba(255, 210, 60, 0.72) var(--f), transparent var(--f))
  -webkit-mask-size: 100% 100%
  mask-size: 100% 100%
  -webkit-mask-repeat: no-repeat
  mask-repeat: no-repeat

.gm-cross
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  z-index: 8

.gm-jug
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 6
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.4))
  transition: transform 160ms ease

  &.pouring
    transform: translate(-50%, -50%) rotate(-12deg)

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@media (prefers-reduced-motion: reduce)
  .gm-jug
    transition: none
</style>
