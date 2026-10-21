<script setup lang="ts">
/**
 * Where do the birds fly? In the wide empty desert birds fly from the sky towards the water. Behind every bird a dashed flight path is drawn, but it ends in mid-air. The child taps the
 * place on the ground where the paths would meet: there lies the water (a little spring with reeds appears). A tap beside it is a dry ring in the sand, a cross and a mistake; after two
 * wrong taps in one task the hint "Follow the lines until they meet" shows (free). The "Tip" button draws the paths on to the meeting point (once for each task, it counts as a tip). In
 * round 2 three birds fly to each spring (plan v3: two tasks in each of two rounds, no decoy). There is no clock. From the keyboard the arrow keys move a cross-hair and Enter confirms. The arithmetic
 * is `lineEnd`, `hitTarget` and `birdAngle` in `utils/abrahamGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { BIRDS_ASPECT, birdAngle, hitTarget, lineEnd } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BirdsGame } from '@/types/adventure'

const props = defineProps<{ game: BirdsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every task of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.tasks.length, 0))

/** How far a key moves the cross-hair (percent of the picture), and the width of a bird (percent of the picture). */
const KEY_STEP = 2.5
const BIRD_W = 9

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const taskNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const task = computed(() => current.value.tasks[Math.min(taskNo.value, current.value.tasks.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const lastTask = computed(() => taskNo.value >= current.value.tasks.length - 1)

const mistakes = ref(0)
const tips = ref(0)
const wrongHere = ref(0)
const tipped = ref(false)
const solved = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const dry = ref<{ x: number; y: number } | null>(null)
const mark = ref<'good' | 'bad' | null>(null)
const cross = ref<{ x: number; y: number } | null>(null)
const wing = ref(0)
const stars = computed(() => mistakeStars(mistakes.value + tips.value, 2, 5))
const src = (p: string) => prependBaseUrl(p)
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// the wings beat now and then (nothing else moves; with reduced motion the birds keep their wings up)
const wingTimer = still ? 0 : window.setInterval(() => (wing.value = wing.value ? 0 : 1), 420)
onBeforeUnmount(() => window.clearInterval(wingTimer))

interface Flyer {
  key: string
  from: [number, number]
  end: { x: number; y: number }
  /** the path as it goes on after a tip (the end of the drawn path to the meeting point), only for the birds that fly there */
  onTo: [number, number] | null
  style: Record<string, string>
}
function flyer(key: string, from: [number, number], aim: [number, number], shown: number, goesThere: boolean): Flyer {
  const end = lineEnd(from, aim, shown)
  const dx = aim[0] - from[0]
  const angle = birdAngle(from, aim)
  const rot = dx >= 0 ? angle : angle - 180
  return {
    key,
    from,
    end,
    onTo: goesThere ? task.value.target : null,
    style: { left: `${end.x}%`, top: `${end.y}%`, width: `${BIRD_W}%`, transform: `translate(-50%, -50%) rotate(${rot}deg)${dx >= 0 ? '' : ' scaleX(-1)'}` }
  }
}
const flyers = computed<Flyer[]>(() => {
  const k = `${round.value}-${taskNo.value}`
  const list = task.value.birds.map((b, i) => flyer(`${k}-${i}`, b.from, task.value.target, b.shown, true))
  const d = task.value.decoy
  if (d) list.push(flyer(`${k}-d`, d.from, d.to, d.shown, false))
  return list
})
const goingThere = computed(() => flyers.value.filter((x) => x.onTo))
const line = (f: Flyer) => `${f.from[0]},${f.from[1] * BIRDS_ASPECT} ${f.end.x},${f.end.y * BIRDS_ASPECT}`
const extension = (f: Flyer) => (f.onTo ? `${f.end.x},${f.end.y * BIRDS_ASPECT} ${f.onTo[0]},${f.onTo[1] * BIRDS_ASPECT}` : '')
const springStyle = computed(() => ({ left: `${task.value.target[0]}%`, top: `${task.value.target[1]}%` }))

function answer(x: number, y: number) {
  if (solved.value || between.value || finished.value) return
  if (hitTarget({ x, y }, task.value.target, props.game.radius)) {
    solved.value = true
    mark.value = 'good'
    progress.mark()
    play('snap')
    message.value = t('app.adventure.fbRight')
    later(next, 1300)
    return
  }
  mistakes.value++
  wrongHere.value++
  play('wrong')
  mark.value = 'bad'
  dry.value = { x, y }
  message.value = wrongHere.value >= 2 ? t('app.adventure.birdsFollow') : t('app.adventure.birdsDry')
  later(() => {
    dry.value = null
    if (!solved.value) mark.value = null
  }, 800)
}

function tap(e: MouseEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  cross.value = null
  answer(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
}

function key(e: KeyboardEvent) {
  const moves: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }
  const m = moves[e.key]
  if (m) {
    e.preventDefault()
    const c = cross.value ?? { x: 50, y: 50 }
    cross.value = { x: Math.min(100, Math.max(0, c.x + m[0])), y: Math.min(100, Math.max(0, c.y + m[1])) }
  } else if ((e.key === 'Enter' || e.key === ' ') && cross.value) {
    e.preventDefault()
    answer(cross.value.x, cross.value.y)
  }
}

function showTip() {
  if (tipped.value || solved.value || between.value || finished.value) return
  tipped.value = true
  tips.value++
}

function next() {
  solved.value = false
  mark.value = null
  tipped.value = false
  wrongHere.value = 0
  message.value = ''
  cross.value = null
  if (!lastTask.value) {
    taskNo.value++
    return
  }
  if (lastRound.value) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    taskNo.value = 0
    between.value = false
    message.value = ''
  }, 1500)
}

const count = computed(() => rounds.value.slice(0, round.value).reduce((n, r) => n + r.tasks.length, 0) + taskNo.value + (solved.value ? 1 : 0))
const total = computed(() => rounds.value.reduce((n, r) => n + r.tasks.length, 0))
</script>

<template lang="pug">
  div(class="bd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="bd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="bd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="bd-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.birdsField')"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @click="tap"
        @keydown="key"
      )
        template(v-if="!between")
          svg(class="bd-lines" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true")
            polyline(v-for="f in flyers" :key="`l-${f.key}`" :points="line(f)" class="bd-path")
            template(v-if="tipped")
              polyline(v-for="f in goingThere" :key="`t-${f.key}`" :points="extension(f)" class="bd-path pale")
          span(v-for="f in flyers" :key="`b-${f.key}`" class="bd-bird" :style="f.style" aria-hidden="true")
            GameImage(:src="game.bird[wing]" :ratio="140 / 100" colour="#6b5a45" round)
          span(v-if="solved" class="bd-spring" :style="springStyle")
            GameImage(:src="game.spring" :ratio="240 / 170" colour="#7fb3d6" round)
          span(v-if="dry" class="bd-dry" :style="{ left: `${dry.x}%`, top: `${dry.y}%`, width: `${game.radius * 1.4}%` }" aria-hidden="true")
          span(v-if="cross" class="bd-cross" :style="{ left: `${cross.x}%`, top: `${cross.y}%` }" aria-hidden="true")
          GameMark(v-if="mark" :kind="mark" class="bd-mark")
      p(class="bd-fb" role="status") {{ message }}
      AdvButton(tone="blau" class="bd-tip" :disabled="tipped || solved || between" @click="showTip") {{ t('app.adventure.birdsTip') }}
      p(class="bd-count") {{ t('app.adventure.birdsCount', { n: count, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.birdsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.bd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.bd-round
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

.bd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.bd-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #e3cf9c
  background-size: cover
  background-position: center
  cursor: crosshair
  touch-action: manipulation

.bd-lines
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.bd-path
  fill: none
  stroke: rgba(70, 50, 25, 0.8)
  stroke-width: 3
  stroke-dasharray: 8 7
  stroke-linecap: round
  vector-effect: non-scaling-stroke

  &.pale
    stroke: rgba(70, 50, 25, 0.4)

.bd-bird
  position: absolute
  display: block
  pointer-events: none

.bd-spring
  position: absolute
  display: block
  width: 16%
  transform: translate(-50%, -70%)
  pointer-events: none

// a dry ring in the sand where the tap went wrong
.bd-dry
  position: absolute
  display: block
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(190, 60, 40, 0.9)
  pointer-events: none

.bd-cross
  position: absolute
  display: block
  width: 28px
  height: 28px
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px solid #3f321b
  background: rgba(255, 246, 220, 0.5)
  pointer-events: none

  &::before, &::after
    content: ''
    position: absolute
    background: #3f321b

  &::before
    left: 50%
    top: -6px
    bottom: -6px
    width: 2px

  &::after
    top: 50%
    left: -6px
    right: -6px
    height: 2px

.bd-mark
  position: absolute
  top: 8px
  left: 50%
  transform: translateX(-50%)

.bd-fb
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

.bd-tip
  align-self: center

.bd-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
