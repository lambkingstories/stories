<script setup lang="ts">
/**
 * The road to Emmaus (Luke 24,13-15). An upright country road winds from the bottom to the top; the two walkers stand at the bottom, at the top waits the milestone with the jug.
 * The finger leads them (a drag, or a tap where they are to walk; the arrow keys move them a step, Enter takes them to the next bend): they follow at their own pace. Stones and thornbushes
 * lie on and beside the road: touching one is a mistake (a cross on it, "Careful, a stone!", they step back and stand for a moment); the same obstacle only counts again once they have gone away from it.
 * At the milestone the round is won (a tick). Round 1 has few obstacles with wide gaps, round 2 more of them, closer together, on another road. Whoever does not lead them gets the button "Help me"
 * after fifteen seconds: they walk a safe piece of the way by themselves. With reduced motion they do not sway. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/osternNeuB.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterStars } from '@/utils/osternGames'
import {
  WANDER_DRAW,
  WANDER_RATIO,
  wanderBendAhead,
  wanderDist,
  wanderHelpRoute,
  wanderIsThorn,
  wanderNudge,
  wanderStart,
  wanderStep
} from '@/utils/osternNeuB'
import type { Pt, WanderGame, WanderObstacle, WanderState } from '@/utils/osternNeuB'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WanderGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every road counts in three parts: a third, two thirds, the milestone. */
const PARTS = 3
progress.setGoal(props.game.rounds.length * PARTS)

const TICK = 0.05
const IDLE_SECONDS = 15
const STALL_SECONDS = 0.8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<WanderState>(wanderStart(props.game, 0))
const target = ref<Pt | null>(null)
/** The way of the button "Help me" (the walkers go from point to point). */
const guide = ref<Pt[]>([])
const hitIndex = ref(-1)
const mistakes = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let hitSeq = 0
let stall = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The parts of the road reached so far count for "Go on" (once each). */
function credit(n: number) {
  const due = Math.min(PARTS, n)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function arrive() {
  credit(PARTS)
  between.value = true
  target.value = null
  guide.value = []
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.wanderArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    st.value = wanderStart(props.game, round.value)
    credited.value = 0
    target.value = null
    guide.value = []
    hitIndex.value = -1
    between.value = false
    idle.value = 0
    stall = 0
    message.value = ''
  }, 2800)
}

function loop() {
  if (!finished.value && !between.value) {
    // the help leads from point to point
    if (guide.value.length) {
      while (guide.value.length && wanderDist(st.value, guide.value[0]!) < 0.6) guide.value = guide.value.slice(1)
      target.value = guide.value[0] ?? null
    }
    const res = wanderStep(props.game, round.value, st.value, target.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'hit') {
        mistakes.value++
        play('wrong')
        const o = current.value.obstacles[ev.index]!
        say(t(wanderIsThorn(o) ? 'app.adventure.wanderHitThorn' : 'app.adventure.wanderHitStone'), 2600)
        hitIndex.value = ev.index
        const id = ++hitSeq
        later(() => {
          if (hitSeq === id) hitIndex.value = -1
        }, 1400)
        guide.value = []
      }
    }
    if (res.events.some((e) => e.type === 'arrived')) {
      arrive()
    } else {
      if (credited.value < PARTS - 1) credit(Math.min(PARTS - 1, Math.floor(st.value.best * PARTS + 1e-9)))
      // the walkers have come where the finger sent them, or an obstacle keeps them
      if (target.value && !guide.value.length) {
        if (wanderDist(st.value, target.value) < 0.3) {
          target.value = null
          stall = 0
        } else if (!st.value.moving && st.value.pause <= 0) {
          stall += TICK
          if (stall > STALL_SECONDS && !dragging) {
            target.value = null
            stall = 0
          }
        } else stall = 0
      }
      idle.value += TICK
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger leads the walkers (a drag, or a tap where they are to walk)
let dragging = false

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) }
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  const p = pointAt(e)
  if (p) {
    target.value = p
    idle.value = 0
  }
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  stall = 0
  guide.value = []
  target.value = p
  dragging = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (finished.value || between.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    stall = 0
    guide.value = []
    target.value = wanderNudge(st.value, a[0], a[1])
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    stall = 0
    guide.value = []
    target.value = wanderBendAhead(current.value, st.value)
    say(t('app.adventure.wanderKeys'), 3600)
  }
}

/** The button for those who do not know the way: the walkers go a safe piece by themselves. */
function helpMe() {
  idle.value = 0
  stall = 0
  const route = wanderHelpRoute(props.game, round.value, st.value)
  if (!route || !route.length) return
  guide.value = route
  target.value = route[0]!
  say(t('app.adventure.wanderHelping'), 3200)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const obstacleStyle = (o: WanderObstacle) => ({ left: `${o.x}%`, top: `${o.y}%`, width: `${o.r * WANDER_DRAW}%`, zIndex: z(o.y) })
const goalStyle = computed(() => ({ left: `${current.value.goal.x}%`, top: `${current.value.goal.y}%`, width: `${current.value.goal.w}%`, zIndex: z(current.value.goal.y) }))
const walkerStyle = computed(() => ({ left: `${st.value.x}%`, top: `${st.value.y}%`, width: `${props.game.walkerW}%`, zIndex: z(st.value.y) + 1 }))
const targetStyle = computed(() => ({ left: `${target.value?.x ?? 0}%`, top: `${target.value?.y ?? 0}%` }))
const doneParts = computed(() => credited.value)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(current.background)})`, aspectRatio: String(WANDER_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.wanderField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-goal" :class="{ reached: st.arrived }" :style="goalStyle" role="img" :aria-label="current.goal.name || t('app.adventure.wanderGoal')")
          GameImage(:src="current.goal.image" :ratio="1" colour="#b8a27a" :label="current.goal.name || 'ziel'")
          span(v-if="st.arrived" class="gm-mark")
            GameMark(kind="good")
        template(v-for="(o, k) in current.obstacles" :key="`o-${round}-${k}`")
          div(class="gm-obstacle" :class="{ hit: hitIndex === k }" :data-obstacle="k" :style="obstacleStyle(o)" role="img" :aria-label="o.name")
            GameImage(:src="o.image" :ratio="1" :colour="wanderIsThorn(o) ? '#5d6b3a' : '#9b9184'" :label="o.name")
            span(v-if="hitIndex === k" class="gm-mark")
              GameMark(kind="bad")
        div(v-if="target && !guide.length" class="gm-target" :style="targetStyle" aria-hidden="true")
        div(class="gm-walker" :class="{ walking: st.moving, stopped: st.pause > 0 }" :style="walkerStyle" role="img" :aria-label="t('app.adventure.wanderWalkers')")
          span(class="gm-flip" :style="{ transform: `scaleX(${st.face})` }")
            GameImage(:src="game.walker" :ratio="360 / 330" colour="#8a7a62" label="wanderer")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.wanderCount', { n: doneParts, total: PARTS }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !guide.length" tone="gold" @click="helpMe") {{ t('app.adventure.wanderHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wanderDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
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
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

// the road is upright (3:4): on a wide screen it is kept low enough to be seen whole
.gm-field
  position: relative
  align-self: center
  width: min(100%, 62vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c8b48a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-goal, .gm-obstacle, .gm-walker
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))

.gm-flip
  display: block

.gm-walker
  transition: left 50ms linear, top 50ms linear

  &.walking .gm-flip
    animation: gm-step 380ms ease-in-out infinite

.gm-obstacle.hit
  animation: gm-shake 500ms ease-in-out 2

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

// where the finger sent the walkers: a ring, at least 44 pixels across
.gm-target
  position: absolute
  width: 44px
  height: 44px
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(255, 246, 220, 0.2)
  pointer-events: none
  z-index: 2

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -5%

@keyframes gm-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -6deg
  75%
    rotate: 6deg

// less motion: nothing sways or shakes, the walkers move without gliding
@media (prefers-reduced-motion: reduce)
  .gm-walker.walking .gm-flip, .gm-obstacle.hit
    animation: none

  .gm-walker
    transition: none
</style>
