<script setup lang="ts">
/**
 * Through the streets (Acts 9,11.17: "Arise, and go into the street which is called Straight … And Ananias went his way, and entered into the house").
 * Damascus from above at a slant (3:4): below the house of Ananias, above it busy cross streets and quiet strips one after the other, at the top the long Straight street and the open door of Judas.
 * Donkeys, camels, ox carts, carriers and a little flock go across the lanes (pictures moved by the app, mirrored for the left). The child leads Ananias up one place at a time
 * (a tap on the street above him, the button, the up arrow, Enter or the space bar; the down arrow or the second button is a step back, never a mistake).
 * A step into a lane that is free: a quiet step. A step into a lane where something would touch him, or staying in a lane until something comes: the animal stops, the driver raises his hand
 * in a friendly way, Ananias steps back to the last quiet strip, a cross and "Wait until the way is clear!", a mistake. Nobody is ever run into, nobody falls.
 * Round 1: two cross streets and the Straight street, slow, wide gaps; round 2: four cross streets in both directions and two lanes on the Straight street. At the end the picture in the house of Judas.
 * "Help me" after fifteen seconds lays a soft light spot on the next lane and says "Now!" when it is free. Less motion: the things move in small jumps, Ananias has no walking picture.
 * Nothing is drawn. Stars: `osterStars(mistakes)`.
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
import { streetFree, streetHit, streetRows, streetThings } from '@/utils/paulusNeuA'
import type { StreetGame, StreetLane } from '@/utils/paulusNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: StreetGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + streetRows(r).length - 1, 0))

const TICK_MS = 50
const IDLE_SECONDS = 15
/** How long a lane stands still after something nearly touched Ananias (the driver raises his hand). */
const STOP_MS = 1400
/** Less motion: the things jump this often (ms). */
const JUMP_MS = 400
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const rows = computed(() => streetRows(current.value))
const pos = ref(0)
const best = ref(0)
/** The clock of every lane (ms) and how long it still stands still. */
const laneT = ref<number[]>([])
const stopped = ref<number[]>([])
let jumpAcc = 0
const walking = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const helpNow = ref(false)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const message = ref('')
let messageSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const row = computed(() => rows.value[pos.value]!)
const nextRow = computed(() => rows.value[pos.value + 1])
/** How wide Ananias is for the things that pass (only the painted part). */
const hitW = computed(() => props.game.walkerW * (props.game.walkerCore ?? 1))
const lastPos = computed(() => rows.value.length - 1)

function resetLanes() {
  laneT.value = current.value.lanes.map(() => 0)
  stopped.value = current.value.lanes.map(() => 0)
  jumpAcc = 0
}
resetLanes()

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad') {
  mark.value = kind
  later(() => {
    if (mark.value === kind) mark.value = null
  }, 900)
}

const laneOf = (k: number): StreetLane => current.value.lanes[k]!

/** Something would touch Ananias: the lane stops, he steps back to the last quiet strip, a mistake. */
function blocked(lane: number) {
  mistakes.value++
  play('wrong')
  flash('bad')
  stopped.value[lane] = STOP_MS
  say(`${t('app.adventure.straightStreetWait')} ${t('app.adventure.straightStreetStop')}`, 3200)
  let k = pos.value
  while (k > 0 && rows.value[k]!.kind !== 'safe') k--
  pos.value = k
  helping.value = false
  helpNow.value = false
}

function loop() {
  if (finished.value) return
  later(loop, TICK_MS)
  if (between.value) return
  idle.value += TICK_MS / 1000
  // the clocks of the lanes (with less motion in small jumps)
  jumpAcc += TICK_MS
  const dt = still ? (jumpAcc >= JUMP_MS ? JUMP_MS : 0) : TICK_MS
  if (still && jumpAcc >= JUMP_MS) jumpAcc -= JUMP_MS
  laneT.value = laneT.value.map((v, k) => (stopped.value[k]! > 0 ? v : v + dt))
  stopped.value = stopped.value.map((v) => Math.max(0, v - TICK_MS))
  // standing in a lane: something comes
  const r = row.value
  if (!walking.value && r.kind === 'lane' && stopped.value[r.lane] === 0) {
    if (streetHit(props.game, laneOf(r.lane), laneT.value[r.lane]!, props.game.walkerX, hitW.value, 0)) blocked(r.lane)
  }
  // help: say "Now!" when the next lane is free
  const nx = nextRow.value
  if (helping.value && nx?.kind === 'lane') {
    const free = streetFree(props.game, laneOf(nx.lane), laneT.value[nx.lane]!, props.game.walkerX, hitW.value, props.game.stepMs)
    if (free && !helpNow.value) say(t('app.adventure.straightStreetNow'), 1200)
    helpNow.value = free
  }
}
later(loop, TICK_MS)

/** One place up. */
function stepUp() {
  if (between.value || finished.value || walking.value) return
  idle.value = 0
  const nx = nextRow.value
  if (!nx) return
  if (nx.kind === 'lane' && (stopped.value[nx.lane]! > 0 || !streetFree(props.game, laneOf(nx.lane), laneT.value[nx.lane]!, props.game.walkerX, hitW.value, props.game.stepMs))) {
    blocked(nx.lane)
    return
  }
  helping.value = false
  helpNow.value = false
  walking.value = true
  pos.value++
  if (pos.value > best.value) {
    best.value = pos.value
    progress.mark()
  }
  later(() => {
    walking.value = false
    if (pos.value >= lastPos.value) arrive()
  }, still ? 60 : props.game.stepMs)
}

/** One place back (never a mistake). */
function stepDown() {
  if (between.value || finished.value || walking.value || pos.value === 0) return
  idle.value = 0
  helping.value = false
  pos.value--
}

function arrive() {
  between.value = true
  flash('good')
  play('right')
  say(t('app.adventure.straightStreetDoor'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.straightStreetSee'), 0)
    }, 1400)
    later(() => {
      play('star')
      finished.value = true
    }, 4600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    pos.value = 0
    best.value = 0
    resetLanes()
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** A tap on the street: above Ananias is a step up, below him a step back. */
function onField(e: MouseEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.height) return stepUp()
  const y = ((e.clientY - r.top) / r.height) * 100
  if (y > row.value.y + 4) stepDown()
  else stepUp()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    stepUp()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    stepDown()
  }
}

/** "Help me": a soft light spot on the next lane; "Now!" when it is free. */
function helpMe() {
  idle.value = 0
  helping.value = true
  helpNow.value = false
  say(t('app.adventure.straightStreetHelpSay'), 4000)
}

// ---- looks
const thingPic = (id: string) => props.game.things.find((x) => x.id === id)?.image ?? ''
const drawn = computed(() =>
  current.value.lanes.flatMap((l, k) =>
    streetThings(props.game, l, laneT.value[k] ?? 0)
      .filter((th) => th.x < 100 && th.x + th.w > 0)
      .map((th, i) => ({ key: `${round.value}-${k}-${i}`, lane: k, id: th.id, x: th.x, w: th.w, y: l.y, left: l.dir === -1, stop: stopped.value[k]! > 0 }))
  )
)
const helpLane = computed(() => (helping.value && nextRow.value?.kind === 'lane' ? nextRow.value : null))
const walkerPic = computed(() => (walking.value && !still ? props.game.walker.walk : props.game.walker.stand))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!ending"
        ref="field"
        class="gm-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.straightStreetField')"
        :style="{ backgroundImage: `url(${src(game.city)})` }"
        @click="onField"
        @keydown="onKey"
      )
        div(v-if="helpLane" class="gm-light" :class="{ now: helpNow }" :style="{ left: `${game.walkerX}%`, bottom: `${100 - helpLane.y - 3}%`, width: `${game.walkerW * 2}%` }" aria-hidden="true")
          GameImage(:src="game.gapLight" :ratio="2" colour="#f3e2a0" label="luecke")
        div(
          v-for="d in drawn"
          :key="d.key"
          class="gm-thing"
          :class="{ left: d.left, stop: d.stop }"
          :data-lane="d.lane"
          :style="{ left: `${d.x}%`, width: `${d.w}%`, bottom: `${100 - d.y}%`, zIndex: Math.round(d.y) }"
          aria-hidden="true"
        )
          GameImage(:src="thingPic(d.id)" :ratio="360 / 220" colour="#a8814a" :label="d.id")
          span(v-if="d.stop" class="gm-hand") ✋
        div(
          class="gm-walker"
          :class="{ walking }"
          :style="{ left: `${game.walkerX}%`, width: `${game.walkerW}%`, bottom: `${100 - row.y}%`, zIndex: Math.round(row.y) + 1 }"
          role="img"
          :aria-label="t('app.adventure.straightStreetWalker', { n: pos, total: lastPos })"
          :data-pos="pos"
        )
          GameImage(:src="walkerPic" :ratio="140 / 220" colour="#c9b48a" label="hananias")
          span(v-if="mark" class="gm-mark")
            GameMark(:kind="mark")
      div(v-else class="gm-field gm-end" :style="{ backgroundImage: `url(${src(game.finale)})` }" role="img" :aria-label="t('app.adventure.straightStreetSee')")
      div(v-if="!ending" class="gm-buttons")
        AdvButton(tone="gold" :disabled="between" @click="stepUp") {{ t('app.adventure.straightStreetStep') }}
        AdvButton(tone="blau" :disabled="between || pos === 0" @click="stepDown") {{ t('app.adventure.straightStreetBack') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping" tone="blau" @click="helpMe") {{ t('app.adventure.straightStreetHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.straightStreetDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  max-width: 460px
  align-self: center
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c49a
  background-size: cover
  background-position: center
  cursor: pointer
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-end
  cursor: default

.gm-thing
  position: absolute
  display: block
  pointer-events: none

  &.left :deep(.gi)
    transform: scaleX(-1)

.gm-hand
  position: absolute
  top: -8px
  left: 50%
  transform: translateX(-50%)
  padding: 0 6px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-size: 1rem

.gm-light
  position: absolute
  display: block
  transform: translateX(-50%)
  pointer-events: none
  opacity: 0.6

  &.now
    opacity: 1
    outline: 3px dashed #fff6dc
    border-radius: 50%

.gm-walker
  position: absolute
  display: block
  transform: translateX(-50%)
  pointer-events: none
  transition: bottom 450ms ease-in-out
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

.still .gm-walker
  transition: none

.gm-mark
  position: absolute
  top: -12px
  right: -24px
  display: block

.gm-buttons
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

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

@media (prefers-reduced-motion: reduce)
  .gm-walker
    transition: none
</style>
