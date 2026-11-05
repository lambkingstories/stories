<script setup lang="ts">
/**
 * Ten on the way (Luke 17,14: "Go shew yourselves unto the priests"). The land from high above (upright, 3:4); at the bottom stand the ten men wrapped in cloths, at the top waits the house
 * of the priests. One finger leads all ten at once: where the finger is (a drag, or a tap where they are to go), a ring goes, and the men walk after it and gather round it. Trees, rocks,
 * thornbushes and walls stand in the way: the men walk round them. Whoever is left far behind (because the finger went straight across a wall, for example) stops: a cross, "One man is left
 * behind. Fetch him!" (a mistake). He comes along again when the ring comes near him. When all ten stand in front of the house the round is won. Round 1: a few trees and rocks; round 2:
 * walls with a gap and more things on another stretch of land. The arrow keys move the ring a step, Enter takes it to the next point of a safe way. Whoever does not lead gets the button
 * "Help me" after fifteen seconds: the ring goes the safe way by itself. With reduced motion nobody sways. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/heilungNeu.ts`; stars: `heilungStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { TEN_RATIO, heilungStars, tenAtGoal, tenDist, tenHelpRoute, tenNudge, tenRouteAhead, tenStart, tenStep } from '@/utils/heilungNeu'
import type { Pt, TenGame, TenObstacle, TenState } from '@/utils/heilungNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TenGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length * props.game.men.length)

const TICK = 0.05
const IDLE_SECONDS = 15
/** A man's picture is 240 x 360 (he stands at the bottom middle). */
const MAN_RATIO = 240 / 360

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<TenState>(tenStart(props.game, 0))
const target = ref<Pt | null>(null)
/** The safe way of "Help me" (the ring goes from point to point). */
const guide = ref<Pt[]>([])
const inGoal = ref<boolean[]>(props.game.men.map(() => false))
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => heilungStars(mistakes.value))
const arrivedCount = computed(() => st.value.men.filter((m) => !m.lost && tenAtGoal(current.value, m)).length)
const lostCount = computed(() => st.value.men.filter((m) => m.lost).length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function arrive() {
  between.value = true
  target.value = null
  guide.value = []
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.tenArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    st.value = tenStart(props.game, round.value)
    inGoal.value = props.game.men.map(() => false)
    target.value = null
    guide.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function loop() {
  if (!finished.value && !between.value) {
    if (guide.value.length) {
      while (guide.value.length > 1 && tenDist(st.value.lead, guide.value[0]!) < 1) guide.value = guide.value.slice(1)
      target.value = guide.value[0] ?? null
    }
    const res = tenStep(props.game, round.value, st.value, target.value, TICK, inGoal.value)
    st.value = res.state
    let done = false
    for (const ev of res.events) {
      if (ev.type === 'lost') {
        mistakes.value++
        play('wrong')
        say(t('app.adventure.tenLost'), 3200)
        guide.value = []
      } else if (ev.type === 'fetched') {
        play('tap')
        say(t('app.adventure.tenFetched'), 1800)
      } else if (ev.type === 'arrived') {
        inGoal.value = inGoal.value.map((v, i) => v || i === ev.man)
        progress.mark()
      } else if (ev.type === 'done') done = true
    }
    if (done) arrive()
    else {
      if (target.value && !guide.value.length && !dragging && tenDist(st.value.lead, target.value) < 0.5) target.value = null
      idle.value += TICK
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger leads the ring (a drag, or a tap where they are to go)
let dragging = false
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: Math.min(97, Math.max(3, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(97, Math.max(4, ((e.clientY - r.top) / r.height) * 100)) }
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
    guide.value = []
    target.value = tenNudge(st.value.lead, a[0], a[1])
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    guide.value = []
    target.value = tenRouteAhead(current.value, st.value.lead)
    say(t('app.adventure.tenKeys'), 3600)
  }
}

/** The button for those who do not know the way: the ring goes the safe way by itself. */
function helpMe() {
  idle.value = 0
  const route = tenHelpRoute(current.value, st.value.lead)
  if (!route.length) return
  guide.value = route
  target.value = route[0]!
  say(t('app.adventure.tenHelping'), 3200)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const obstacleStyle = (o: TenObstacle) => ({ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, zIndex: z(o.y) })
const houseStyle = computed(() => ({ left: `${current.value.house.x}%`, top: `${current.value.house.y}%`, width: `${props.game.house.w}%`, zIndex: z(current.value.house.y) }))
const manStyle = (m: Pt) => ({ left: `${m.x}%`, top: `${m.y}%`, width: `${props.game.manW}%`, zIndex: z(m.y) + 1 })
const ringStyle = computed(() => ({ left: `${st.value.lead.x}%`, top: `${st.value.lead.y}%` }))
</script>

<template lang="pug">
  div(class="gz")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gz-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gz-hint") {{ current.hint }}
      div(
        ref="field"
        class="gz-field"
        :style="{ backgroundImage: `url(${src(current.background)})`, aspectRatio: String(TEN_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.tenField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gz-house" :style="houseStyle" role="img" :aria-label="game.house.name")
          GameImage(:src="game.house.image" :ratio="1" colour="#c9b48a" :label="game.house.name")
        template(v-for="(o, k) in current.obstacles" :key="`o-${round}-${k}`")
          div(class="gz-obstacle" :data-obstacle="k" :style="obstacleStyle(o)" role="img" :aria-label="o.name")
            GameImage(:src="o.image" :ratio="o.kind === 'wall' ? 4 : 1" :colour="o.kind === 'tree' ? '#6f8a4a' : '#9b9184'" :label="o.name")
        div(class="gz-ring" :style="ringStyle" aria-hidden="true")
        template(v-for="(m, i) in st.men" :key="`m-${round}-${i}`")
          div(class="gz-man" :class="{ walking: m.moving && !m.lost, lost: m.lost }" :data-man="i" :style="manStyle(m)" role="img" :aria-label="m.lost ? t('app.adventure.tenManLost', { n: i + 1 }) : t('app.adventure.tenMan', { n: i + 1 })")
            span(class="gz-flip" :style="{ transform: `scaleX(${m.face})` }")
              GameImage(:src="game.men[i] ?? ''" :ratio="MAN_RATIO" colour="#8a7a62" :label="`mann-${i + 1}`")
            span(v-if="m.lost" class="gz-mark")
              GameMark(kind="bad")
            span(v-else-if="inGoal[i] && tenAtGoal(current, m)" class="gz-mark small")
              GameMark(kind="good")
      p(class="gz-count" aria-live="polite") {{ t('app.adventure.tenCount', { n: arrivedCount, total: game.men.length }) }}
        template(v-if="lostCount")  · {{ t('app.adventure.tenLostCount', { n: lostCount }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !guide.length" tone="gold" @click="helpMe") {{ t('app.adventure.tenHelp') }}
      p(class="gz-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.tenDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gz
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

.gz-round
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

.gz-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

// the land is upright (3:4): on a wide screen it is kept low enough to be seen whole
.gz-field
  position: relative
  align-self: center
  width: min(100%, 62vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9b07a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gz-house, .gz-obstacle
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))

// a man stands with his feet on his place
.gz-man
  position: absolute
  display: block
  transform: translate(-50%, -88%)
  pointer-events: none
  transition: left 50ms linear, top 50ms linear
  filter: drop-shadow(0 2px 2px rgba(50, 35, 10, 0.4))

  &.walking .gz-flip
    animation: gz-step 420ms ease-in-out infinite

  &.lost
    filter: drop-shadow(0 0 4px rgba(255, 246, 220, 0.95))

.gz-flip
  display: block

.gz-mark
  position: absolute
  left: 50%
  top: 10%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

  &.small
    transform: scale(0.7)

// where the finger leads: a ring, at least 44 pixels across
.gz-ring
  position: absolute
  width: 44px
  height: 44px
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(255, 246, 220, 0.2)
  pointer-events: none
  z-index: 2

.gz-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gz-fb
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

@keyframes gz-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -5%

// less motion: nobody sways, the men move without gliding
@media (prefers-reduced-motion: reduce)
  .gz-man.walking .gz-flip
    animation: none

  .gz-man
    transition: none
</style>
