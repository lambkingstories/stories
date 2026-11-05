<script setup lang="ts">
/**
 * Sun and shade (Matthew 4,1-2: Jesus is led into the wilderness and fasts forty days). The wilderness at noon; rocks and bushes stand on the sand, and each one throws a soft shadow.
 * The sun wanders over the sky from the morning (left) to the evening (right): the shadows wander with it, to the other side, and they are longer when the sun is low.
 * The child taps a shadow (or its rock or bush): Jesus walks there and stays in it, it moves with the sun. In the sun the heat grows (a bar with words); in the shade it falls again.
 * When it is too hot, that is a mistake: a cross, "Too hot! Jesus looks for shade", and he goes to the nearest shadow by himself. In the shadow of the big rock the round is won.
 * Round 1: few things, more time in the sun; round 2: more things, a longer way, less time. The arrow keys choose a shadow, Enter sends Jesus. "Help me" after fifteen seconds sends him
 * to a good next shadow. With reduced motion nothing sways. Nothing is shown by colour alone (tick, cross, words). The tempter is never shown (only the text tells of him).
 * The arithmetic is `utils/taufeNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterNeighbour } from '@/utils/osternNeuB'
import { osterStars } from '@/utils/osternGames'
import { SHADE_RATIO, shadeGoal, shadeHelp, shadePick, shadeShadow, shadeSimulate, shadeStart, shadeStep, shadeSun, shadeUnder } from '@/utils/taufeNeu'
import type { Pt, ShadowWalkGame, ShadePlace, ShadeShadow, ShadeState } from '@/utils/taufeNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: ShadowWalkGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** The whole task: the stops of the way that "Help me" would take in every round (a shadow reached for the first time counts one part, up to that many). */
const planned = props.game.rounds.map((r) => Math.max(1, shadeSimulate(r).hops))
progress.setGoal(planned.reduce((a, b) => a + b, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const SHADOW_PAD = 1.3

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<ShadeState>(shadeStart(props.game.rounds[0]!))
const cursor = ref(-1)
const markAt = ref<{ i: number; kind: 'good' | 'bad' } | null>(null)
const mistakes = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
/** Jesus faces the way he walks (the sprite looks to the right). */
const facingLeft = ref(false)
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value + st.value.mistakes))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(i: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { i, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}
function credit() {
  const due = Math.min(planned[round.value] ?? 1, st.value.reached.length - 1)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function endRound() {
  between.value = true
  // the stops still due of this round count when the goal is reached
  while (credited.value < (planned[round.value] ?? 1)) {
    progress.mark()
    credited.value++
  }
  flash(shadeGoal(current.value), 'good')
  later(() => play('right'), 200)
  say(t('app.adventure.shadowWalkGoal'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    mistakes.value += st.value.mistakes
    round.value++
    st.value = shadeStart(current.value)
    credited.value = 0
    cursor.value = -1
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function loop() {
  if (!finished.value && !between.value) {
    const before = st.value.at.x
    const res = shadeStep(current.value, st.value, TICK)
    st.value = res.state
    if (Math.abs(st.value.at.x - before) > 0.01) facingLeft.value = st.value.at.x < before
    if (res.event === 'arrived') {
      play('bead')
      say(t('app.adventure.shadowWalkArrived'), 1600)
    } else if (res.event === 'hot') {
      play('wrong')
      flash(st.value.to, 'bad')
      say(t('app.adventure.shadowWalkHot'), 3000)
    }
    credit()
    if (res.event === 'goal') endRound()
    else idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

/** Jesus goes to the shadow of place `i`. */
function sendTo(i: number, helped = false) {
  if (between.value || finished.value || i < 0) return
  idle.value = 0
  if (shadeUnder(current.value, st.value.at, st.value.t).includes(i) && i !== shadeGoal(current.value)) {
    st.value = { ...st.value, to: i }
    say(t('app.adventure.shadowWalkHere'), 1600)
    return
  }
  st.value = { ...st.value, to: i }
  play('tap')
  say(t(helped ? 'app.adventure.shadowWalkHelped' : 'app.adventure.shadowWalkGo', { name: placeName(i) }), 1800)
}

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  const i = shadePick(current.value, props.game.things, p, st.value.t)
  if (i < 0) {
    say(t('app.adventure.shadowWalkMiss'))
    return
  }
  sendTo(i)
}

const shadowMids = computed<ShadeShadow[]>(() => current.value.places.map((p) => shadeShadow(p, st.value.t)))
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value < 0 ? nearestTo(st.value.at) : osterNeighbour(shadowMids.value, cursor.value, a[0], a[1], SHADE_RATIO)
    say(placeName(cursor.value), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = nearestTo(st.value.at)
      say(t('app.adventure.shadowWalkKeys'), 3600)
      return
    }
    sendTo(cursor.value)
  }
}
function nearestTo(p: Pt): number {
  let best = 0
  let bd = Infinity
  shadowMids.value.forEach((m, i) => {
    const d = Math.hypot(m.x - p.x, (m.y - p.y) / SHADE_RATIO)
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}

function helpMe() {
  const h = shadeHelp(current.value, st.value)
  if (h < 0) return
  sendTo(h, true)
}

// ---- looks
const thing = (p: ShadePlace) => props.game.things.find((x) => x.id === p.thing)!
function placeName(i: number): string {
  const p = current.value.places[i]
  if (!p) return ''
  const name = thing(p)?.label ?? p.thing
  return p.goal ? t('app.adventure.shadowWalkGoalName', { name }) : name
}
const z = (y: number) => Math.round(y * 10) + 10
const sun = computed(() => shadeSun(st.value.t))
const sunStyle = computed(() => ({ left: `${sun.value.x}%`, top: `${sun.value.y}%`, width: `${props.game.sunW}%` }))
const shadowStyle = (i: number) => {
  const s = shadowMids.value[i]!
  // the painted shadow fades out softly: drawn 1.3 times as big, its edge (about a third dark) lies where the shade of the game ends
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.rx * 2 * SHADOW_PAD}%`, height: `${s.ry * 2 * SHADE_RATIO * SHADOW_PAD}%` }
}
const thingStyle = (p: ShadePlace) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${thing(p).w}%`, zIndex: z(p.y) })
const walkerStyle = computed(() => ({ left: `${st.value.at.x}%`, top: `${st.value.at.y}%`, width: `${props.game.walkerW}%`, zIndex: z(st.value.at.y) + 1 }))
const inShade = computed(() => shadeUnder(current.value, st.value.at, st.value.t).length > 0)
const heatShare = computed(() => Math.min(100, Math.round((st.value.heat / current.value.heat) * 100)))
const goalIndex = computed(() => shadeGoal(current.value))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(SHADE_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.shadowWalkField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-sun" :style="sunStyle" aria-hidden="true")
          GameImage(:src="game.sun" :ratio="1" colour="#f6c445" round label="sonne")
        //- the shadows lie on the sand, under everything else
        div(v-for="(p, i) in current.places" :key="`s-${round}-${i}`" class="gm-shadow" :class="{ goal: p.goal, cursor: cursor === i, target: st.to === i }" :data-shadow="i" :style="shadowStyle(i)" aria-hidden="true")
          img(:src="prependBaseUrl(game.shadow)" alt="" draggable="false")
          span(v-if="markAt && markAt.i === i" class="gm-mark")
            GameMark(:kind="markAt.kind")
        div(v-for="(p, i) in current.places" :key="`t-${round}-${i}`" class="gm-thing" :data-thing="i" :style="thingStyle(p)" aria-hidden="true")
          GameImage(:src="thing(p).image" :ratio="thing(p).ratio" colour="#a88a62" :label="thing(p).label")
          span(v-if="p.goal" class="gm-goal") {{ t('app.adventure.shadowWalkGoalBadge') }}
        div(class="gm-walker" :class="{ left: facingLeft, hot: !inShade }" :style="walkerStyle" role="img" :aria-label="t(inShade ? 'app.adventure.shadowWalkJesusShade' : 'app.adventure.shadowWalkJesusSun')")
          GameImage(:src="game.walker" :ratio="game.walkerRatio" colour="#c9b48a" label="jesus")
      div(class="gm-heat")
        span(class="gm-heat-word") {{ t(inShade ? 'app.adventure.shadowWalkInShade' : 'app.adventure.shadowWalkInSun') }}
        span(class="gm-heat-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="heatShare" :aria-label="t('app.adventure.shadowWalkHeat')")
          span(class="gm-heat-fill" :style="{ width: `${heatShare}%` }")
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.shadowWalkHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shadowWalkDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f0dcb0
  box-shadow: inset 0 0 18px rgba(110, 70, 20, 0.25)
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
  color: #6a4a22

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #6a4a22

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #e3c58c
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-sun
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 1

// a shadow: the painted soft shadow, stretched to the ellipse of the data
.gm-shadow
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2

  img
    display: block
    width: 100%
    height: 100%
    opacity: 0.85

  &.cursor, &.target
    outline: 3px dashed #fff6dc
    outline-offset: 2px
    border-radius: 50%

.gm-thing
  position: absolute
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 2px 2px rgba(60, 35, 10, 0.3))

.gm-goal
  position: absolute
  left: 50%
  top: -6px
  transform: translate(-50%, -100%)
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  box-shadow: 0 0 0 2px #d4a83e
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  white-space: nowrap

.gm-walker
  position: absolute
  transform: translate(-50%, -96%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(60, 35, 10, 0.35))

  &.left :deep(img)
    transform: scaleX(-1)

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  margin: -15px 0 0 -15px
  z-index: 3

// the heat: a word and a bar (never the colour alone)
.gm-heat
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  flex-wrap: wrap

.gm-heat-word
  padding: 2px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #6a4a22

.gm-heat-bar
  position: relative
  display: block
  width: 140px
  height: 16px
  border-radius: 999px
  border: 2px solid #6a4a22
  background: rgba(255, 246, 220, 0.9)
  overflow: hidden

.gm-heat-fill
  display: block
  height: 100%
  background: #d9822b
  transition: width 200ms linear

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .gm-heat-fill
    transition: none
</style>
