<script setup lang="ts">
/**
 * The name lanterns (Isaiah 9,5: "For unto us a child is born ... and his name is called Wonderful, Counsel, Mighty, Everlasting Father, Prince of Peace").
 * Lanterns rise slowly into the evening sky over Galilee, in five lanes. Some carry a little plate with one of the names of the child (the writing of the app, not painted),
 * the others carry no name. The child catches the lanterns with a name by tapping them: the name goes into the row of names above the sky (a tick).
 * A lantern without a name is a mistake (a cross and words). Round 1: the names in any order, the lanterns rise slowly. Round 2: the lanterns rise faster, more of them carry no name,
 * and the names must be caught in the order of the verse (a name out of turn is a mistake). A name that was missed comes again with the next turn of the sky.
 * On the keyboard the arrow keys choose a lane and Enter catches the lantern of that lane nearest the middle. Whoever does not go on gets "Help me" after fifteen seconds:
 * the lanterns rise at half speed for a while and the wanted ones get a ring. With reduced motion the lanterns rise more slowly and do not flicker. Nothing is shown by colour alone.
 * The arithmetic is `utils/prophetenNeu.ts`; stars: `prophetenStars(mistakes)`.
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
import { prependBaseUrl } from '@/utils/function'
import { LANTERN_RATIO, lanternCatchable, lanternInLane, lanternPoses, lanternTry, lanternWanted, prophetenStars } from '@/utils/prophetenNeu'
import type { LanternGame, LanternPose } from '@/utils/prophetenNeu'

const props = defineProps<{ game: LanternGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every name in every round
progress.setGoal(props.game.names.length * props.game.rounds.length)

const IDLE_SECONDS = 15
const TICK = 50
const SLOW_MS = 8000
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The time of the sky (ms of the game, it stands still between the rounds and runs slower after "Help me"). */
const clock = ref(0)
const slowUntil = ref(-1)
const caught = ref<number[]>([])
const gone = ref<Set<string>>(new Set())
const lane = ref(-1)
const marks = ref<{ id: number; x: number; y: number; kind: 'good' | 'bad' }[]>([])
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const stars = computed(() => prophetenStars(mistakes.value))
const poses = computed(() => lanternPoses(props.game, current.value, clock.value, gone.value, caught.value))
const wanted = computed(() => lanternWanted(props.game, current.value, caught.value))
const slow = computed(() => clock.value < slowUntil.value)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(x: number, y: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  marks.value = [...marks.value, { id, x, y, kind }]
  later(() => {
    marks.value = marks.value.filter((m) => m.id !== id)
  }, 1100)
}

function tick() {
  if (!between.value && !finished.value) {
    const rate = (still ? 0.75 : 1) * (slow.value ? 0.5 : 1)
    clock.value += TICK * rate
    idle.value += TICK / 1000
  }
  later(tick, TICK)
}
later(tick, TICK)

function catchLantern(p: LanternPose) {
  if (between.value || finished.value || !lanternCatchable(p) || gone.value.has(p.key)) return
  idle.value = 0
  gone.value = new Set([...gone.value, p.key])
  const verdict = lanternTry(props.game, current.value, caught.value, p.name)
  if (verdict === 'caught') {
    caught.value = [...caught.value, p.name]
    progress.mark()
    play('bead')
    flash(p.x, p.y, 'good')
    say(t('app.adventure.lanternsCaught', { name: props.game.names[p.name] }), 2200)
    if (caught.value.length === props.game.names.length) endRound()
    return
  }
  mistakes.value++
  play('wrong')
  flash(p.x, p.y, 'bad')
  if (verdict === 'blank') say(t('app.adventure.lanternsBlank'), 2600)
  else say(t('app.adventure.lanternsOrder', { name: props.game.names[wanted.value[0] ?? 0] }), 3000)
}

function endRound() {
  between.value = true
  lane.value = -1
  slowUntil.value = -1
  later(() => play('right'), 250)
  say(t('app.adventure.lanternsAll'), 0)
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
    clock.value = 0
    caught.value = []
    gone.value = new Set()
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function lanternClick(p: LanternPose) {
  catchLantern(p)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const n = props.game.lanes.length
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    lane.value = lane.value < 0 ? Math.floor(n / 2) : Math.min(n - 1, Math.max(0, lane.value + (e.key === 'ArrowLeft' ? -1 : 1)))
    say(t('app.adventure.lanternsLane', { n: lane.value + 1, total: n }), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (lane.value < 0) {
      lane.value = Math.floor(n / 2)
      say(t('app.adventure.lanternsKeys'), 3600)
      return
    }
    const p = lanternInLane(props.game, current.value, poses.value, lane.value)
    if (p) catchLantern(p)
    else say(t('app.adventure.lanternsNone'), 1800)
    return
  }
  if (e.key === 'Escape') {
    lane.value = -1
    message.value = ''
  }
}

/** The button for those who do not go on: the sky runs at half speed for a while, and the wanted lanterns get a ring. */
function helpMe() {
  idle.value = 0
  slowUntil.value = clock.value + SLOW_MS / 2
  say(t('app.adventure.lanternsHelped'), 3600)
}

// ---- looks
const z = (y: number) => 100 + Math.round(100 - y)
const lanternStyle = (p: LanternPose) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.w}%`, zIndex: z(p.y) })
const laneStyle = computed(() => ({ left: `${props.game.lanes[lane.value] ?? 50}%`, width: `${props.game.w + 4}%` }))
function lanternLabel(p: LanternPose): string {
  return p.name >= 0 ? t('app.adventure.lanternsNamed', { name: props.game.names[p.name] }) : t('app.adventure.lanternsNoName')
}
const nameState = (k: number) => (caught.value.includes(k) ? 'caught' : current.value.order && wanted.value[0] === k ? 'next' : 'open')
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      //- the names of the child: the ones caught get a tick; in a round with order the next one is marked
      ol(class="gm-names" :aria-label="t('app.adventure.lanternsNames')")
        li(v-for="(name, k) in game.names" :key="`n-${round}-${k}`" class="gm-name" :class="nameState(k)" :data-name="k")
          span(v-if="current.order" class="gm-num") {{ k + 1 }}.
          span {{ name }}
          span(v-if="nameState(k) === 'caught'" class="gm-tick")
            GameMark(kind="good")
          span(v-else-if="nameState(k) === 'next'" class="gm-next") {{ t('app.adventure.lanternsNext') }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(LANTERN_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.lanternsField')"
        @keydown="onKey"
      )
        div(v-if="lane >= 0" class="gm-lane" :style="laneStyle" aria-hidden="true")
        button(
          v-for="p in poses"
          :key="`l-${round}-${p.key}`"
          type="button"
          class="gm-lantern"
          :class="{ named: p.name >= 0, wanted: slow && p.name >= 0 && wanted.includes(p.name) }"
          :data-lantern="p.i"
          :data-name="p.name"
          :style="lanternStyle(p)"
          :aria-label="lanternLabel(p)"
          tabindex="-1"
          @click="lanternClick(p)"
        )
          GameImage(:src="game.designs[p.design] ?? game.designs[0] ?? ''" :ratio="LANTERN_RATIO" colour="#f2c66b" label="laterne")
          span(v-if="p.name >= 0" class="gm-plate") {{ game.names[p.name] }}
        span(v-for="m in marks" :key="`m-${m.id}`" class="gm-mark" :style="{ left: `${m.x}%`, top: `${m.y}%` }")
          GameMark(:kind="m.kind")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.lanternsCount', { n: caught.length, total: game.names.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !slow" tone="gold" @click="helpMe") {{ t('app.adventure.lanternsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lanternsDone')" @next="emit('done', stars)")
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

.gm-names
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  margin: 0
  padding: 0
  list-style: none

.gm-name
  position: relative
  display: inline-flex
  align-items: center
  gap: 4px
  min-height: 34px
  padding: 2px 10px
  border-radius: 10px
  border: 2px dashed #b08a4a
  background: rgba(255, 246, 220, 0.7)
  font-weight: 800
  font-size: 1rem
  color: #7a5a30

  &.caught
    border-style: solid
    border-color: #d4a83e
    background: #fff6dc
    color: #3f2a10

  &.next
    border-style: solid
    border-color: #6a4a22
    box-shadow: 0 0 0 2px rgba(255, 246, 220, 0.9)

.gm-tick
  display: inline-flex
  transform: scale(0.8)

.gm-next
  font-size: 1rem
  font-weight: 700
  color: #6a4a22

.gm-field
  position: relative
  width: 100%
  max-width: 520px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #2c2f5c
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the lane chosen with the keys: a dashed band from top to bottom
.gm-lane
  position: absolute
  top: 0
  bottom: 0
  transform: translateX(-50%)
  border-left: 3px dashed rgba(255, 246, 220, 0.8)
  border-right: 3px dashed rgba(255, 246, 220, 0.8)
  background: rgba(255, 246, 220, 0.08)
  pointer-events: none

// a lantern: a button of the size of the lantern (at least 47 pixels on a 360 pixel phone)
.gm-lantern
  position: absolute
  display: flex
  flex-direction: column
  align-items: center
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  filter: drop-shadow(0 0 8px rgba(255, 210, 120, 0.55))
  animation: gm-flicker 1400ms ease-in-out infinite alternate

  &.wanted
    outline: 3px solid #fff6dc
    outline-offset: 4px
    border-radius: 14px

// the name of the child on the lantern: the writing of the app on a little plate
.gm-plate
  margin-top: -6%
  max-width: 190%
  padding: 1px 6px
  border-radius: 8px
  border: 2px solid #d4a83e
  background: rgba(255, 246, 220, 0.96)
  font-weight: 800
  font-size: 1rem
  line-height: 1.15
  color: #3f2a10
  text-align: center
  white-space: normal
  pointer-events: none

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 400

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #6a4a22

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

@keyframes gm-flicker
  from
    filter: drop-shadow(0 0 6px rgba(255, 210, 120, 0.45))
  to
    filter: drop-shadow(0 0 12px rgba(255, 210, 120, 0.75))

@media (prefers-reduced-motion: reduce)
  .gm-lantern
    animation: none
</style>
