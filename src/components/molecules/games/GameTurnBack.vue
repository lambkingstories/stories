<script setup lang="ts">
/**
 * Who turns back? (Luke 17,14-16): ten men who were sick walk along a country road to the house of the priests; Jesus stands at the left edge. They walk on for a while, then their hands show clean (sparkles and a tick above
 * every man), and one of them, the Samaritan with the blue and white headscarf, turns round and runs slowly back towards Jesus. The child taps him within a few seconds (round 1: he is easy to see; round 2: the men wander
 * over the road and cross each other). A tap on another man is a mistake (he wobbles, a cross, a word, a dull sound; the same man counts only once in an attempt); a tap before the turn is only "wait". When the time is over without the
 * right tap that is a mistake too and the round begins again. The right man runs to Jesus, kneels and says "Thank you!", the nine others walk on to the house. After two mistakes in a round the Samaritan glows (and the stage
 * offers "Go on (1 star)": every mistake counts a part of the task, two at most). The arithmetic is in `utils/heilungGames.ts`; the dice are seeded (`seeded`), the clock is the tick of this component.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { TURN_PARTS, heilungStars, turnArrived, turnBuild, turnFacing, turnJudge, turnLayer, turnPhase, turnRoundParts, turnX, turnY } from '@/utils/heilungGames'
import type { TurnGeometry, TurnPhase, TurnWalker } from '@/utils/heilungGames'
import { seeded } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { TurnBackGame } from '@/types/adventure'

const props = defineProps<{ game: TurnBackGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: three parts for every round (a mistake brings a part, two at most; the solved round brings all three)
progress.setGoal(props.game.rounds.length * TURN_PARTS)

const TICK = 0.1
/** Mistakes in one round after which the Samaritan glows. */
const GLOW_AFTER = 2
/** The colours that stand in for the pictures until they are painted. */
const COLOURS = ['#c98c5a', '#7aa0b8', '#b56b6b', '#8fb36b', '#c9a24a', '#9a82b5']

const round = ref(0)
const attempt = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const geo = computed<TurnGeometry>(() => ({
  y: props.game.road.y,
  spread: props.game.road.spread,
  startX: props.game.road.startX,
  gap: props.game.road.gap,
  houseX: props.game.road.houseX,
  jesusX: props.game.jesus.x
}))
const walkers = ref<TurnWalker[]>([])
/** Seconds since the attempt began. */
const clock = ref(0)
/** The second of the right tap; null as long as the Samaritan is not found. */
const tapAt = ref<number | null>(null)
/** The time ran out: the attempt is over and the next one begins in a moment. */
const lost = ref(false)
const kneeling = ref(false)
const finished = ref(false)
const misses = ref(0)
const roundMisses = ref(0)
const roundParts = ref(0)
const solved = ref(0)
const wobbleId = ref<number | null>(null)
const crossId = ref<number | null>(null)
const wrongTapped = new Set<number>()
const message = ref('')
let messageSeq = 0
let lastPhase: TurnPhase = 'walk'
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => heilungStars(misses.value, props.game.rounds.length))
const phase = computed(() => turnPhase(clock.value, current.value.seconds))
const samaritan = computed(() => walkers.value.find((w) => w.samaritan))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The parts of the task that this round has brought so far are marked (each part once). */
function syncParts(solvedNow: boolean) {
  const want = turnRoundParts(roundMisses.value, solvedNow)
  while (roundParts.value < want) {
    progress.mark()
    roundParts.value++
  }
}

function startAttempt() {
  const rand = seeded(23 + round.value * 31 + attempt.value * 7)
  walkers.value = turnBuild(current.value.crossing, geo.value, rand)
  clock.value = 0
  tapAt.value = null
  lost.value = false
  kneeling.value = false
  wrongTapped.clear()
  wobbleId.value = null
  crossId.value = null
  lastPhase = 'walk'
}
startAttempt()

function timeUp() {
  lost.value = true
  misses.value++
  roundMisses.value++
  syncParts(false)
  play('wrong')
  say(t('app.adventure.turnBackLate'), 0)
  later(() => {
    attempt.value++
    startAttempt()
    message.value = ''
  }, 1800)
}

function onPhase(p: TurnPhase) {
  if (p === 'clean') {
    play('bead')
    say(t('app.adventure.turnBackClean'), 1500)
  } else if (p === 'turn') {
    play('tap')
    say(t('app.adventure.turnBackTurn'), 0)
  } else if (p === 'late' && tapAt.value === null) {
    timeUp()
  }
}

function arrive() {
  kneeling.value = true
  solved.value++
  syncParts(true)
  play('found')
  say(t('app.adventure.turnBackThanksLine'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2800)
    return
  }
  later(() => {
    say(t('app.adventure.gameNext'), 0)
  }, 1200)
  later(() => {
    round.value++
    attempt.value = 0
    roundMisses.value = 0
    roundParts.value = 0
    startAttempt()
    message.value = ''
  }, 3200)
}

function tick() {
  if (finished.value || lost.value) return
  clock.value = Math.round((clock.value + TICK) * 1000) / 1000
  const p = phase.value
  if (p !== lastPhase) {
    lastPhase = p
    onPhase(p)
    if (lost.value) return
  }
  const sam = samaritan.value
  if (tapAt.value !== null && !kneeling.value && sam && turnArrived(turnX(sam, clock.value, geo.value, tapAt.value), geo.value)) arrive()
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function tapMan(id: number) {
  if (finished.value || lost.value || tapAt.value !== null) return
  const man = walkers.value.find((w) => w.id === id)
  if (!man) return
  const verdict = turnJudge(man, phase.value)
  if (verdict === 'early') {
    say(t('app.adventure.turnBackEarly'), 1600)
    return
  }
  if (verdict === 'wrong') {
    if (!wrongTapped.has(id)) {
      wrongTapped.add(id)
      misses.value++
      roundMisses.value++
      syncParts(false)
    }
    play('wrong')
    wobbleId.value = id
    crossId.value = id
    say(roundMisses.value >= GLOW_AFTER ? t('app.adventure.turnBackTip') : t('app.adventure.turnBackWrong'))
    later(() => {
      if (wobbleId.value === id) wobbleId.value = null
      if (crossId.value === id) crossId.value = null
    }, 900)
    return
  }
  tapAt.value = clock.value
  play('right')
  say('', 0)
}

/** Everything the template needs to draw a man at this moment. */
const view = computed(() =>
  walkers.value.map((w) => {
    const x = turnX(w, clock.value, geo.value, tapAt.value)
    const y = turnY(w, clock.value, geo.value, tapAt.value)
    const sprite = w.samaritan ? props.game.samaritan : props.game.men[w.kind % props.game.men.length]!
    const turned = w.samaritan && turnFacing(w, clock.value) === -1
    const away = !w.samaritan && x >= geo.value.houseX - 0.01
    return {
      id: w.id,
      samaritan: w.samaritan,
      sprite,
      colour: w.samaritan ? '#4f7fb8' : COLOURS[w.kind % COLOURS.length]!,
      x,
      y,
      flip: (w.mirror ? -1 : 1) * turnFacing(w, clock.value),
      turned,
      away,
      glow: w.samaritan && turned && tapAt.value === null && roundMisses.value >= GLOW_AFTER && phase.value === 'turn',
      layer: turnLayer(y) + (w.samaritan && turned ? 2000 : 0)
    }
  })
)
const label = (m: { id: number; turned: boolean }) => (m.turned ? t('app.adventure.turnBackManTurning', { n: m.id + 1 }) : t('app.adventure.turnBackMan', { n: m.id + 1 }))
const thanks = computed(() => (kneeling.value ? view.value.find((m) => m.samaritan) : undefined))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.turnBackField')"
      )
        div(
          class="gm-jesus"
          :style="{ left: `${game.jesus.x}%`, top: `${game.jesus.y}%`, width: `${game.jesus.w}%` }"
          role="img"
          :aria-label="game.jesus.label"
        )
          GameImage(:src="game.jesus.image" :ratio="0.6" colour="#efe3c0" :label="game.jesus.label")
        button(
          v-for="m in view"
          :key="`${round}-${attempt}-${m.id}`"
          type="button"
          class="gm-man"
          :class="{ wobble: wobbleId === m.id, turned: m.turned, glow: m.glow, kneel: m.samaritan && kneeling, away: m.away }"
          :style="{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.sprite.w}%`, zIndex: m.layer, '--flip': m.flip }"
          :aria-label="label(m)"
          :aria-hidden="m.away ? 'true' : undefined"
          :tabindex="m.away ? -1 : 0"
          :disabled="m.away || lost || tapAt !== null"
          @click="tapMan(m.id)"
        )
          span(class="gm-art")
            GameImage(:src="m.sprite.image" :ratio="0.5" :colour="m.colour" :label="m.sprite.label")
          span(v-if="phase === 'clean' && !m.away" class="gm-clean" aria-hidden="true")
            GameMark(kind="good")
          span(v-if="crossId === m.id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        div(
          v-if="thanks"
          class="gm-bubble"
          :style="{ left: `${thanks.x}%`, top: `${thanks.y}%` }"
          role="status"
        ) {{ t('app.adventure.turnBackThanks') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.turnBackCount', { n: solved, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.turnBackDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0bd
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

.gm-jesus
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

// a man: the button is as wide as the picture (at least 44 pixels) and as high as the figure; his feet are at the place of the data
.gm-man
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  transition: left 100ms linear, top 100ms linear, opacity 700ms ease
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 12px

  &:disabled
    cursor: default

  &.wobble
    animation: gm-wobble 500ms ease-in-out

  &.away
    opacity: 0
    pointer-events: none

  &.glow
    filter: drop-shadow(0 0 6px #ffe17a) drop-shadow(0 0 12px #ffd54a)
    animation: gm-glow 900ms ease-in-out infinite alternate

// the picture inside: mirrored for a picture used twice, and for the Samaritan when he runs back; kneeling: bowed down
.gm-art
  display: block
  transform: scaleX(var(--flip, 1))
  transform-origin: 50% 100%
  transition: transform 260ms ease-out

.kneel .gm-art
  transform: scaleX(var(--flip, 1)) rotate(-14deg) scaleY(0.84)

// the tick above the head: hands are clean
.gm-clean
  position: absolute
  left: 50%
  top: -8px
  display: block
  margin-left: -15px
  pointer-events: none
  z-index: 3
  animation: gm-twinkle 700ms ease-in-out infinite alternate

.gm-clean::before
  content: '✦'
  position: absolute
  left: 20px
  top: -10px
  font-size: 1.1rem
  line-height: 1
  color: #fff3b0
  text-shadow: 0 0 6px #ffd54a

.gm-cross
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 40

.gm-bubble
  position: absolute
  transform: translate(-50%, -190%)
  padding: 4px 14px
  border-radius: 14px
  border: 2px solid #d4a83e
  background: #fffaf0
  color: #3f321b
  font-weight: 900
  font-size: 1.05rem
  white-space: nowrap
  z-index: 5000
  animation: gm-appear 400ms ease-out both

  &::after
    content: ''
    position: absolute
    left: 50%
    bottom: -8px
    margin-left: -6px
    border: 6px solid transparent
    border-top-color: #d4a83e
    border-bottom: 0

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

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  20%
    rotate: -7deg
  40%
    rotate: 7deg
  60%
    rotate: -5deg
  80%
    rotate: 4deg

@keyframes gm-glow
  from
    scale: 1
  to
    scale: 1.06

@keyframes gm-twinkle
  from
    opacity: 0.75
    translate: 0 0
  to
    opacity: 1
    translate: 0 -3px

@keyframes gm-appear
  from
    opacity: 0
    scale: 0.7
  to
    opacity: 1
    scale: 1

// less motion: the men jump from place to place (the tick of the game) instead of gliding, nothing wobbles or twinkles
@media (prefers-reduced-motion: reduce)
  .gm-man, .gm-art
    transition: none

  .gm-man.wobble, .gm-man.glow, .gm-clean, .gm-bubble
    animation: none
</style>
