<script setup lang="ts">
/**
 * "The rafts" (1 Kings 5,9). Hiram's men bring the cedars down to the sea, bind them into rafts and bring them over the sea to the place Solomon names. The sea is seen from above.
 * First the child binds the raft: a tap on each loose trunk at the beach of Tyre lays it into the raft (Enter binds the next one); then the ropes are tied. Then the raft sails to the right by itself,
 * and the child steers it: a tap (or a finger held down) on the sea sets where it goes, the arrow keys turn it up or down. A reef or the rocky coast is a mistake (a cross and a word; the raft is pushed back
 * and waits a moment). The bright beach in the middle of the coast is the landing place. Round 2 has more trunks, more reefs and a drift of the sea.
 * The button "Help me" comes after fifteen seconds without a tap and steers the raft to the coast. The arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { raftAutoTarget, raftSlot, raftStart, raftStep } from '@/utils/salomoNeu'
import type { RaftGame, RaftReef, RaftState, SalPt } from '@/utils/salomoNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: RaftGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.loose.length + 1, 0))

const TICK = 0.05
const IDLE_SECONDS = 15

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const phase = ref<'bind' | 'tie' | 'sail' | 'between'>('bind')
const bound = ref<boolean[]>(current.value.loose.map(() => false))
const st = ref<RaftState>(raftStart(current.value))
const auto = ref(false)
const hit = ref(-1)
const cliff = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let hitSeq = 0
let holding = false
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// ---- binding
function bind(i: number, e?: Event) {
  if (e && 'button' in e && (e as MouseEvent).button > 0) return
  e?.preventDefault()
  if (phase.value !== 'bind' || bound.value[i]) return
  idle.value = 0
  bound.value = bound.value.map((b, k) => b || k === i)
  progress.mark()
  play('snap')
  const left = bound.value.filter((b) => !b).length
  if (left > 0) say(t('app.adventure.raftsBound', { n: bound.value.length - left, total: bound.value.length }), 1800)
  else {
    phase.value = 'tie'
    play('tap')
    say(t('app.adventure.raftsTied'), 0)
    later(() => {
      phase.value = 'sail'
      idle.value = 0
      say(t('app.adventure.raftsSail'), 3600)
    }, 1600)
  }
}
const nextLoose = computed(() => bound.value.findIndex((b) => !b))

// ---- sailing
function loop() {
  if (!finished.value && phase.value === 'sail') {
    if (auto.value) st.value = { ...st.value, target: raftAutoTarget(props.game, current.value, st.value) }
    const res = raftStep(props.game, current.value, st.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'reef' || ev.type === 'cliff') {
        mistakes.value++
        play('wrong')
        const id = ++hitSeq
        if (ev.type === 'reef') {
          hit.value = ev.index
          say(t('app.adventure.raftsReef'), 2600)
        } else {
          cliff.value = true
          say(t('app.adventure.raftsCliff'), 2600)
        }
        later(() => {
          if (hitSeq === id) {
            hit.value = -1
            cliff.value = false
          }
        }, 1300)
      } else if (ev.type === 'arrived') arrive()
    }
  }
  if (!finished.value && phase.value !== 'between' && phase.value !== 'tie' && !auto.value) idle.value += TICK
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function arrive() {
  progress.mark()
  phase.value = 'between'
  auto.value = false
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.raftsArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1600)
  later(() => {
    round.value++
    bound.value = current.value.loose.map(() => false)
    st.value = raftStart(current.value)
    phase.value = 'bind'
    idle.value = 0
    message.value = ''
  }, 3000)
}

function pointAt(e: PointerEvent): SalPt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function steer(e: PointerEvent) {
  if (phase.value === 'bind') {
    // a tap on the water near a loose trunk binds it too (the trunks are small on a phone)
    return
  }
  if (phase.value !== 'sail' || e.button > 0) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  holding = true
  const p = pointAt(e)
  if (!p) return
  idle.value = 0
  auto.value = false
  st.value = { ...st.value, target: p }
}
function steerMove(e: PointerEvent) {
  if (!holding || phase.value !== 'sail') return
  const p = pointAt(e)
  if (p) st.value = { ...st.value, target: p }
}
function steerEnd() {
  holding = false
}
function onKey(e: KeyboardEvent) {
  if (phase.value === 'bind' && (e.key === 'Enter' || e.key === ' ')) {
    if (nextLoose.value >= 0) bind(nextLoose.value, e)
    return
  }
  if (phase.value !== 'sail') return
  const s = st.value
  let target: SalPt | null = null
  if (e.key === 'ArrowUp') target = { x: s.x + 20, y: s.y - 22 }
  else if (e.key === 'ArrowDown') target = { x: s.x + 20, y: s.y + 22 }
  else if (e.key === 'ArrowRight' || e.key === 'Enter') target = { x: s.x + 30, y: s.y }
  if (!target) return
  e.preventDefault()
  idle.value = 0
  auto.value = false
  st.value = { ...s, target }
}

function helpMe() {
  idle.value = 0
  if (phase.value === 'bind') {
    if (nextLoose.value >= 0) bind(nextLoose.value)
    say(t('app.adventure.raftsHelpBind'), 2600)
    return
  }
  auto.value = true
  say(t('app.adventure.raftsHelping'), 3600)
}

// ---- looks
const g = computed(() => props.game)
const n = computed(() => current.value.loose.length)
const looseStyle = (i: number) => {
  const p = bound.value[i] ? raftSlot(g.value, current.value, i) : current.value.loose[i]!
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${g.value.trunk.w}%`, rotate: bound.value[i] ? '0deg' : `${i % 2 ? 9 : -7}deg` }
}
const raftStyle = computed(() => ({
  left: `${st.value.x}%`,
  top: `${st.value.y}%`,
  width: `${g.value.trunk.w}%`,
  aspectRatio: String(g.value.trunk.w / (n.value * g.value.trunk.thick)),
  rotate: `${(st.value.heading * 180) / Math.PI}deg`
}))
const reefStyle = (f: RaftReef) => ({ left: `${f.x}%`, top: `${f.y}%`, width: `${f.r * 2.3}%` })
const landingStyle = computed(() => ({ top: `${current.value.landing.top}%`, height: `${current.value.landing.bottom - current.value.landing.top}%`, left: `${g.value.coast - 2}%` }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ phase === 'bind' ? current.hint : t('app.adventure.raftsSteer') }}
      div(
        ref="field"
        class="gm-field"
        :class="{ sailing: phase === 'sail' }"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.raftsField')"
        @pointerdown="steer"
        @pointermove="steerMove"
        @pointerup="steerEnd"
        @pointercancel="steerEnd"
        @pointerleave="steerEnd"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(v-for="(f, k) in current.reefs" :key="`r-${round}-${k}`" class="gm-reef" :class="{ hit: hit === k }" :style="reefStyle(f)" role="img" :aria-label="game.reefs[f.kind]?.label")
          GameImage(:src="game.reefs[f.kind]?.image ?? ''" :ratio="1" colour="#7f8a90" :label="game.reefs[f.kind]?.label")
          span(v-if="hit === k" class="gm-mark")
            GameMark(kind="bad")
        span(v-if="cliff" class="gm-cliff" :style="{ left: `${game.coast - 3}%`, top: `${st.y}%` }")
          GameMark(kind="bad")
        span(v-if="phase === 'between'" class="gm-landed" :style="landingStyle")
          GameMark(kind="good")
        template(v-if="phase === 'bind' || phase === 'tie'")
          button(
            v-for="(p, i) in current.loose"
            :key="`t-${round}-${i}`"
            type="button"
            class="gm-trunk"
            :class="{ bound: bound[i], next: phase === 'bind' && i === nextLoose && idle > IDLE_SECONDS }"
            :style="looseStyle(i)"
            :aria-label="game.trunk.label"
            :aria-pressed="bound[i]"
            tabindex="-1"
            @pointerdown.stop="bind(i, $event)"
          )
            GameImage(:src="game.trunk.image" :ratio="game.trunk.w / game.trunk.thick" colour="#8a4a2a" :label="game.trunk.label")
          div(v-if="phase === 'tie'" class="gm-raft still" :style="{ ...raftStyle, rotate: '0deg' }" aria-hidden="true")
            span(v-for="x in [22, 78]" :key="x" class="gm-rope" :style="{ left: `${x}%` }")
              GameImage(:src="game.rope.image" :ratio="0.25" colour="#c8a96a")
        div(v-else-if="phase === 'sail' || phase === 'between'" class="gm-raft" :class="{ bump: st.pause > 0 }" :style="raftStyle" role="img" :aria-label="t('app.adventure.raftsRaft')")
          span(v-for="i in n" :key="i" class="gm-log" :style="{ top: `${((i - 1) / n) * 100}%`, height: `${100 / n}%` }")
            GameImage(:src="game.trunk.image" :ratio="game.trunk.w / game.trunk.thick" colour="#8a4a2a")
          span(v-for="x in [22, 78]" :key="x" class="gm-rope" :style="{ left: `${x}%` }")
            GameImage(:src="game.rope.image" :ratio="0.25" colour="#c8a96a")
      p(class="gm-count" aria-live="polite") {{ phase === 'bind' ? t('app.adventure.raftsCount', { n: bound.filter(Boolean).length, total: bound.length }) : t('app.adventure.raftsWhere') }}
      AdvButton(v-if="idle > IDLE_SECONDS && (phase === 'bind' || (phase === 'sail' && !auto))" tone="gold" @click="helpMe") {{ t('app.adventure.raftsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.raftsDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #3d86b0
  background-size: 100% 100%
  touch-action: none
  -webkit-touch-callout: none

  &.sailing
    cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-reef, .gm-raft, .gm-trunk, .gm-cliff, .gm-landed
  position: absolute
  display: block
  transform: translate(-50%, -50%)

.gm-reef
  pointer-events: none

  &.hit
    animation: gm-shake 450ms ease-in-out 2

.gm-trunk
  min-height: 44px
  padding: 0
  border: 0
  background: none
  cursor: pointer
  touch-action: none
  display: flex
  align-items: center
  transition: left 500ms ease-out, top 500ms ease-out, rotate 500ms ease-out
  filter: drop-shadow(0 3px 3px rgba(10, 30, 50, 0.4))

  &.bound
    cursor: default

  &.next
    outline: 4px solid #ffd76a
    outline-offset: 2px
    border-radius: 8px

.gm-raft
  pointer-events: none
  transition: rotate 120ms linear
  filter: drop-shadow(0 4px 4px rgba(10, 30, 50, 0.45))

  &.bump
    animation: gm-shake 450ms ease-in-out 2

.gm-log
  position: absolute
  left: 0
  width: 100%
  display: flex
  align-items: center

.gm-rope
  position: absolute
  top: -6%
  width: 12%
  height: 112%
  transform: translateX(-50%)
  display: flex
  align-items: center

.gm-mark, .gm-cliff span, .gm-landed span
  pointer-events: none

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  z-index: 3

.gm-cliff
  pointer-events: none
  z-index: 4

.gm-landed
  transform: translate(-50%, 0)
  display: flex
  align-items: center
  pointer-events: none

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

@keyframes gm-shake
  0%, 100%
    translate: 0 0
  25%
    translate: -3% 0
  75%
    translate: 3% 0

@media (prefers-reduced-motion: reduce)
  .gm-reef.hit, .gm-raft.bump
    animation: none
  .gm-trunk, .gm-raft
    transition: none
</style>
