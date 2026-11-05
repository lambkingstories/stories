<script setup lang="ts">
/**
 * Meeting (Genesis 46,29: "Joseph made ready his chariot, and went up to meet Israel his father, to Goshen"). The road through the land of Goshen: from the left comes Joseph's chariot,
 * from the right Jacob's wagon; both drive by themselves toward the well in the middle. Rocks, thornbushes and resting sheep lie on the road. The child steers both at once: a tap (or a finger
 * held) in the left half puts Joseph's chariot into the lane at that height, in the right half Jacob's wagon; two fingers steer both together. A team that drives into something stops a moment:
 * a cross and "Careful, a rock!" (a mistake). When both are at the well they meet: "He fell on his neck and wept a good while." Round 1: two things on each side, slowly; round 2: four on each side,
 * faster. Up/down move the chosen team, left/right choose Joseph or Jacob. After fifteen seconds without steering, or after two bumps in a row, the button "Help me" steers both past everything.
 * With reduced motion the teams do not bob. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/josefNeu.ts`; stars: `josefStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { josefStars, meetLaneAt, meetSafeLane, meetStartState, meetStep } from '@/utils/josefNeu'
import type { MeetingGame, MeetSide, MeetState, Pt } from '@/utils/josefNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: MeetingGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.obstacles.length, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const SIDES: MeetSide[] = ['josef', 'jakob']

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<MeetState>(meetStartState(props.game, 0))
const chosen = ref<MeetSide>('josef')
const helping = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
/** Bumps since the child last steered: after two the help is offered at once (the teams drive by themselves, a round is short). */
const stuck = ref(0)
const finished = ref(false)
const between = ref(false)
const met = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => josefStars(mistakes.value))
const passedCount = computed(() => st.value.josef.passed.length + st.value.jakob.passed.length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: Pt) {
  const id = ++markSeq
  tickAt.value = kind === 'good' ? at : null
  crossAt.value = kind === 'bad' ? at : null
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}

function loop() {
  if (!finished.value && !between.value) {
    if (helping.value)
      st.value = {
        josef: { ...st.value.josef, lane: meetSafeLane(props.game, round.value, 'josef', st.value.josef) },
        jakob: { ...st.value.jakob, lane: meetSafeLane(props.game, round.value, 'jakob', st.value.jakob) }
      }
    const res = meetStep(props.game, round.value, st.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'bump') {
        const o = current.value.obstacles[ev.obstacle]!
        mistakes.value++
        stuck.value++
        play('wrong')
        flash('bad', { x: o.x, y: props.game.lanes[o.lane]! - 12 })
        say(t(ev.side === 'josef' ? 'app.adventure.meetingBumpJosef' : 'app.adventure.meetingBumpJakob'), 2400)
        progress.mark()
      } else if (ev.type === 'pass') {
        progress.mark()
        play('tap')
      } else if (ev.type === 'arrived') {
        say(t(ev.side === 'josef' ? 'app.adventure.meetingJosefThere' : 'app.adventure.meetingJakobThere'), 2000)
      } else if (ev.type === 'met') meet()
    }
    if (!helping.value) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function steer(side: MeetSide, lane: number) {
  if (between.value || finished.value || helping.value) return
  idle.value = 0
  stuck.value = 0
  chosen.value = side
  if (st.value[side].lane === lane) return
  st.value = { ...st.value, [side]: { ...st.value[side], lane } }
}

function meet() {
  between.value = true
  helping.value = false
  met.value = true
  play('right')
  later(() => play('bead'), 200)
  flash('good', { x: props.game.meet, y: props.game.lanes[Math.floor(props.game.lanes.length / 2)]! - 20 })
  say(t('app.adventure.meetingMet'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3000)
  later(() => {
    round.value++
    st.value = meetStartState(props.game, round.value)
    met.value = false
    between.value = false
    idle.value = 0
    stuck.value = 0
    message.value = ''
  }, 4400)
}

// ---- fingers: every pointer steers the team of its half (two fingers steer both)
function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
const held = new Map<number, MeetSide>()
function down(e: PointerEvent) {
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  const side: MeetSide = p.x < props.game.meet ? 'josef' : 'jakob'
  held.set(e.pointerId, side)
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  steer(side, meetLaneAt(props.game, p.y))
}
function move(e: PointerEvent) {
  const side = held.get(e.pointerId)
  if (!side) return
  const p = pointAt(e)
  if (p) steer(side, meetLaneAt(props.game, p.y))
}
function up(e: PointerEvent) {
  held.delete(e.pointerId)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    chosen.value = e.key === 'ArrowLeft' ? 'josef' : 'jakob'
    idle.value = 0
    say(t(chosen.value === 'josef' ? 'app.adventure.meetingChosenJosef' : 'app.adventure.meetingChosenJakob'), 0)
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const lane = Math.max(0, Math.min(props.game.lanes.length - 1, st.value[chosen.value].lane + (e.key === 'ArrowDown' ? 1 : -1)))
    steer(chosen.value, lane)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    chosen.value = chosen.value === 'josef' ? 'jakob' : 'josef'
    idle.value = 0
    say(t(chosen.value === 'josef' ? 'app.adventure.meetingChosenJosef' : 'app.adventure.meetingChosenJakob') + ' ' + t('app.adventure.meetingKeys'), 0)
  }
}

/** The button for those who are stuck: both teams steer past everything by themselves until they meet. */
function helpMe() {
  idle.value = 0
  helping.value = true
  say(t('app.adventure.meetingHelping'), 0)
}

// ---- looks
function teamStyle(side: MeetSide) {
  const team = props.game[side]
  const t_ = st.value[side]
  const y = props.game.lanes[t_.lane]!
  const h = (team.w / team.ratio) * props.game.ratio
  return { left: `${t_.x - team.w / 2}%`, top: `${y - h}%`, width: `${team.w}%`, zIndex: Math.round(y * 10) + 1 }
}
function obstacleStyle(i: number) {
  const o = current.value.obstacles[i]!
  const y = props.game.lanes[o.lane]!
  return { left: `${o.x - o.w / 2}%`, top: `${y - o.w * props.game.ratio}%`, width: `${o.w}%`, zIndex: Math.round(y * 10) }
}
</script>

<template lang="pug">
  div(class="gb")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gb-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gb-hint") {{ current.hint }}
      div(
        ref="field"
        class="gb-field"
        :class="{ met }"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.meetingField')"
        @keydown="onKey"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @contextmenu.prevent
      )
        div(
          v-for="(o, i) in current.obstacles"
          :key="`o-${round}-${i}`"
          class="gb-thing"
          :style="obstacleStyle(i)"
          role="img"
          :aria-label="t('app.adventure.meetingThing')"
        )
          GameImage(:src="o.image" colour="#8f8170" :label="`ding-${i + 1}`")
        div(
          v-for="s in SIDES"
          :key="s"
          class="gb-team"
          :class="[s, { chosen: chosen === s, stopped: st[s].wait > 0 }]"
          :style="teamStyle(s)"
          role="img"
          :aria-label="t(s === 'josef' ? 'app.adventure.meetingJosef' : 'app.adventure.meetingJakob', { n: st[s].lane + 1 })"
          :data-team="s"
          :data-lane="st[s].lane"
        )
          GameImage(:src="game[s].image" :ratio="game[s].ratio" colour="#b98b5a" :label="s")
        span(v-if="crossAt" class="gb-mark" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gb-mark" :style="{ left: `${tickAt.x}%`, top: `${tickAt.y}%` }")
          GameMark(kind="good")
      p(class="gb-count" aria-live="polite") {{ t('app.adventure.meetingCount', { n: passedCount, total: current.obstacles.length }) }}
      AdvButton(v-if="(idle > IDLE_SECONDS || stuck >= 2) && !between && !helping" tone="gold" @click="helpMe") {{ t('app.adventure.meetingHelp') }}
      p(class="gb-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.meetingDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gb
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

.gb-round
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

.gb-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gb-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d6c08e
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gb-thing, .gb-team
  position: absolute
  pointer-events: none

.gb-thing
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.3))

.gb-team
  transition: top 220ms ease-out
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))
  animation: gb-bob 600ms ease-in-out infinite

  &.chosen
    outline: 3px dashed rgba(255, 246, 220, 0.85)
    outline-offset: 2px
    border-radius: 10px

  &.stopped
    animation: none
    opacity: 0.85

.gb-field.met .gb-team
  animation: none

.gb-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

.gb-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gb-fb
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

@keyframes gb-bob
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -1.5%

// less motion: the teams change lanes at once and do not bob
@media (prefers-reduced-motion: reduce)
  .gb-team
    transition: none
    animation: none
</style>
