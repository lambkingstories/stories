<script setup lang="ts">
/**
 * Call the children to the tent: on the meadow in front of the big camp walk the children of the family and play. A tap on a child sends it merrily to the tent (the number at the tent
 * grows by one). Whoever is not tapped just walks on: nobody is lost, nothing runs out, tapping an empty place does nothing, so there is no mistake and the end always gives three
 * stars. The tap circle is generous (at least 64 pixels across). Whoever cannot aim gets the button "Call all" after twenty seconds without a tap (the children then come by themselves);
 * the Enter key calls the next child. With reduced motion the children stand still. Plan v3: round 1 three children, round 2 five, both slow (the tent has its own picture at the right edge). The walking and the
 * tap circle are `stepKids` and `hit` in `utils/jakobGames2.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { hit, startKids, stepKids } from '@/utils/jakobGames2'
import { seeded } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CatchGame, CatchKid } from '@/types/adventure'

const props = defineProps<{ game: CatchGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every child of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.kids.length, 0))

/** One step of the walk in seconds, how long a child needs to the tent (ms), and the seconds without a tap after which "Call all" shows. */
const TICK = 0.05
const RUN_MS = 700
const IDLE_SECONDS = 20
/** Stand-in colours of the four children until the pictures are there. */
const COLOURS = ['#d98b5f', '#6f9fc2', '#7fb069', '#e0c25a']

interface Walker {
  n: number
  id: string
  x: number
  y: number
  vx: number
  vy: number
  /** walking about, running to the tent, or at the tent already */
  state: 'walk' | 'go' | 'in'
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const walkers = ref<Walker[]>([])
const inTent = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let rand = seeded(1)

const kidOf = (id: string): CatchKid | undefined => props.game.kids.find((k) => k.id === id)
const colourOf = (id: string) => COLOURS[Math.max(0, props.game.kids.findIndex((k) => k.id === id)) % COLOURS.length]

function startRound() {
  const r = current.value
  rand = seeded(97 + round.value * 31)
  const start = startKids(r.kids.length, props.game.field, r.speed, 11 + round.value * 7)
  walkers.value = r.kids.map((id, n) => ({ n, id, ...start[n]!, state: 'walk' as const }))
  inTent.value = 0
  idle.value = 0
}
startRound()

function tick() {
  if (still || between.value || finished.value) return
  idle.value += TICK
  const moving = walkers.value.filter((w) => w.state === 'walk')
  if (!moving.length) return
  const next = stepKids(moving, TICK, current.value.speed, props.game.field, rand)
  moving.forEach((w, i) => Object.assign(w, next[i]))
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** Sends a child to the tent. */
function call(w: Walker) {
  if (w.state !== 'walk' || between.value || finished.value) return
  w.state = 'go'
  w.x = props.game.tent[0]
  w.y = props.game.tent[1]
  idle.value = 0
  message.value = ''
  later(() => {
    w.state = 'in'
    inTent.value++
    progress.mark()
    play('snap')
    if (inTent.value >= current.value.kids.length) roundOver()
  }, RUN_MS)
}

/** The tap circle in percent of the width: at least 64 pixels across, as wide as the child at least. */
function reach(): number {
  const width = field.value?.getBoundingClientRect().width ?? 0
  return Math.max(width ? (32 / width) * 100 : 8, 4)
}

function tap(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return
  const point = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  // the child that stands nearest to the tap (the feet are at the place; the middle of the child is a little above)
  let best: Walker | null = null
  let bestD = Infinity
  for (const w of walkers.value) {
    if (w.state !== 'walk') continue
    const kid = kidOf(w.id)
    // the child is 1.5 times as high as wide; a width in percent of the width is one and a half times as many percent of the height
    const middle = { x: w.x, y: w.y - (kid?.w ?? 7) * 1.125 }
    if (!hit(middle, point, Math.max(reach(), kid?.w ?? 7))) continue
    const d = Math.hypot(middle.x - point.x, (middle.y - point.y) * (2 / 3))
    if (d < bestD) {
      best = w
      bestD = d
    }
  }
  if (best) call(best)
}

function callNext() {
  const w = walkers.value.find((x) => x.state === 'walk')
  if (w) call(w)
}

/** The button for those who cannot aim: all children come by themselves, one after the other. */
function callAll() {
  walkers.value.filter((w) => w.state === 'walk').forEach((w, i) => later(() => call(w), i * 350))
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 800)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    startRound()
    between.value = false
    message.value = ''
  }, 1500)
}

const style = (w: Walker) => ({ left: `${w.x}%`, top: `${w.y}%`, width: `${kidOf(w.id)?.w ?? 7}%`, zIndex: String(Math.round(w.y)) })
const visible = computed(() => walkers.value.filter((x) => x.state !== 'in'))
const showAll = computed(() => idle.value >= IDLE_SECONDS && walkers.value.some((w) => w.state === 'walk') && !between.value)
</script>

<template lang="pug">
  div(class="ct")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ct-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ct-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="field"
        class="ct-field game-soft"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.catchField', { n: inTent, total: current.kids.length })"
        :style="{ '--bg': `url(${src(game.background)})` }"
        @pointerdown="tap"
        @keydown.enter.space.prevent="callNext"
      )
        span(v-if="game.tentImage" class="ct-tent-pic" :style="{ left: `${game.tent[0]}%`, top: `${game.tent[1]}%` }" aria-hidden="true")
          GameImage(:src="game.tentImage" :ratio="1" colour="#b59a6a")
        span(class="ct-tent" :style="{ left: `${game.tent[0]}%`, top: `${game.tent[1]}%` }" aria-hidden="true") {{ inTent }}
        template(v-if="!between")
          span(v-for="w in visible" :key="`${round}-${w.n}`" class="ct-kid" :class="{ going: w.state === 'go', still }" :style="style(w)" aria-hidden="true")
            GameImage(:src="kidOf(w.id)?.image ?? ''" :ratio="120 / 180" :colour="colourOf(w.id)")
      p(class="ct-fb" role="status") {{ message }}
      AdvButton(v-if="showAll" tone="gold" class="ct-all" @click="callAll") {{ t('app.adventure.catchAll') }}
      p(class="ct-count") {{ t('app.adventure.catchCount', { n: inTent, total: current.kids.length }) }}
    GameDone(v-else :stars="3" :text="t('app.adventure.catchDone')" @next="emit('done', 3)")
</template>

<style scoped lang="sass">
.ct
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.ct-round
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

.ct-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ct-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b7c98a
  background-size: cover
  background-position: center
  touch-action: manipulation

// the picture of the tent: its foot stands at the place of the tent
.ct-tent-pic
  position: absolute
  display: block
  width: 16%
  transform: translate(-50%, -88%)
  pointer-events: none

// the number at the tent
.ct-tent
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  min-width: 36px
  height: 36px
  padding: 0 8px
  transform: translate(-50%, -50%)
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  border: 3px solid #d4a83e
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  z-index: 100
  pointer-events: none

// a child stands with its feet at the place
.ct-kid
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  transition: left 50ms linear, top 50ms linear
  pointer-events: none

  &.going
    transition: left 700ms ease-in, top 700ms ease-in
    animation: ct-hop 350ms ease-in-out 2

  &.still
    transition: none

.ct-fb
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

.ct-all
  align-self: center

.ct-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes ct-hop
  0%, 100%
    margin-top: 0
  50%
    margin-top: -6px

@media (prefers-reduced-motion: reduce)
  .ct-kid.going
    animation: none
    transition: none
</style>
