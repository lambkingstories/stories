<script setup lang="ts">
/**
 * Follow the star (Matthew 2,9). A night on the road to Bethlehem: the star moves over the sky, the wise men walk on the road below. The child keeps them under the star: a finger that is held on the field (or
 * a tap) tells them where to walk, and they follow it faster than the star moves; the dashed place on the road under the star shows how near they must stay. The star waits and goes on (always towards the house); whoever is away from
 * it for too long loses it (a cross and a word, one mistake; it is found again by going back under it). After a time under the star (a quarter of the way is a part for "Go on") it goes to the house and stands still over it;
 * the wise men must stand under it for a moment: the round is won. Round 1: a slow star; round 2: a faster one with less room. The arrow keys walk them (Enter: under the star). Whoever does not go on gets "Help me"
 * after fifteen seconds: the wise men follow the star by themselves for a few seconds. With reduced motion the star goes slower and nothing glides. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/weihnachtenNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { STAR_RATIO, starStart, starStep, starUnder } from '@/utils/weihnachtenNeu'
import type { StarGame, StarState } from '@/utils/weihnachtenNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: StarGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every round counts in four parts: a quarter, a half, three quarters of the way, and the house. */
const PARTS = 4
progress.setGoal(props.game.rounds.length * PARTS)

const TICK = 0.05
const IDLE_SECONDS = 15
const HELP_SECONDS = 5
const KEY_STEP = 12
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const rawRound = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
/** With reduced motion the star goes slower (the wise men are always faster). */
const current = computed(() => (still ? { ...rawRound.value, starSpeed: rawRound.value.starSpeed * 0.7 } : rawRound.value))
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<StarState>(starStart(props.game.rounds[0]!))
const target = ref<number | null>(null)
const helpLeft = ref(0)
const mistakes = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let holding = false
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const under = computed(() => starUnder(current.value, st.value))
const lost = computed(() => st.value.away >= 0.8)
const seconds = computed(() => Math.min(Math.floor(st.value.journey), rawRound.value.goal))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The parts of the way that were walked under the star count for "Go on" (once each). */
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
  helpLeft.value = 0
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.starArrived'), 0)
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
    st.value = starStart(rawRound.value)
    credited.value = 0
    target.value = null
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function loop() {
  if (!finished.value && !between.value) {
    if (helpLeft.value > 0) {
      helpLeft.value = Math.max(0, helpLeft.value - TICK)
      target.value = st.value.sx
    }
    const res = starStep(props.game, current.value, st.value, target.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'lost') {
        mistakes.value++
        play('wrong')
        say(t('app.adventure.starLost'), 3000)
      } else if (ev.type === 'found') {
        play('tap')
        say(t('app.adventure.starFound'), 1800)
      } else if (ev.type === 'stop') {
        play('bead')
        say(t('app.adventure.starStopped'), 3200)
      }
    }
    if (res.events.some((e) => e.type === 'arrived')) arrive()
    else {
      credit(st.value.final ? PARTS - 1 : Math.min(PARTS - 1, Math.floor((st.value.journey / rawRound.value.goal) * PARTS + 1e-9)))
      if (!holding && helpLeft.value <= 0) idle.value += TICK
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger tells the wise men where to walk (held, or a tap)
function xAt(e: { clientX: number }): number | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return null
  return Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))
}
function onMove(e: PointerEvent) {
  if (!holding) return
  const x = xAt(e)
  if (x !== null) target.value = x
}
function stopHold() {
  holding = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopHold)
  window.removeEventListener('pointercancel', stopHold)
}
function down(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  const x = xAt(e)
  if (x === null) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  helpLeft.value = 0
  target.value = x
  holding = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopHold)
  window.addEventListener('pointercancel', stopHold)
}
onBeforeUnmount(() => stopHold())

function onKey(e: KeyboardEvent) {
  if (finished.value || between.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    helpLeft.value = 0
    target.value = st.value.x + (e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    helpLeft.value = 0
    target.value = st.value.sx
    say(t('app.adventure.starKeys'), 3200)
  }
}

/** The button for those who do not go on: the wise men follow the star by themselves for a few seconds. */
function helpMe() {
  idle.value = 0
  helpLeft.value = HELP_SECONDS
  say(t('app.adventure.starHelping'), 3600)
}

// ---- looks
const starStyle = computed(() => ({ left: `${st.value.sx}%`, top: `${props.game.starY}%`, width: `${props.game.starW}%` }))
const walkerStyle = computed(() => ({ left: `${st.value.x}%`, top: `${props.game.walkY}%`, width: `${props.game.walkW}%`, zIndex: 3 }))
const houseStyle = computed(() => ({ left: `${rawRound.value.end}%`, top: `${props.game.walkY - 2}%`, width: `${props.game.houseW}%`, zIndex: 2 }))
// the place under the star: as wide as the room the wise men have, on the road
const zoneStyle = computed(() => ({ left: `${st.value.sx}%`, top: `${props.game.walkY}%`, width: `${current.value.tolerance * 2}%` }))
const lookLeft = computed(() => st.value.face)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(STAR_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.starField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-house" :style="houseStyle" role="img" :aria-label="t('app.adventure.starHouse')")
          GameImage(:src="game.house" :ratio="game.houseRatio ?? 1" colour="#b79a6a" label="haus")
        div(class="gm-zone" :class="{ under: under }" :style="zoneStyle" aria-hidden="true")
        div(class="gm-star" :style="starStyle" role="img" :aria-label="t('app.adventure.starStar')")
          GameImage(:src="game.star" :ratio="1" colour="#f2d56a" label="stern" round)
        div(class="gm-walker" :class="{ under: under }" :style="walkerStyle" role="img" :aria-label="t(under ? 'app.adventure.starWalkersUnder' : 'app.adventure.starWalkers')")
          span(class="gm-flip" :style="{ transform: `scaleX(${lookLeft})` }")
            GameImage(:src="game.walkers" :ratio="game.walkRatio ?? 1" colour="#8a7a62" label="weise")
          span(v-if="under || lost" class="gm-mark")
            GameMark(:kind="under ? 'good' : 'bad'")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.starCount', { n: seconds, total: rawRound.goal }) }}
      p(class="gm-state") {{ under ? t('app.adventure.starUnder') : t('app.adventure.starAway') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.starHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.starDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2b3760
  box-shadow: inset 0 0 18px rgba(10, 15, 40, 0.5)
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
  color: #3f321b

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #fff6dc

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1f2a4a
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-star, .gm-walker, .gm-house
  position: absolute
  display: block
  pointer-events: none

.gm-star
  transform: translate(-50%, -50%)
  filter: drop-shadow(0 0 8px rgba(255, 235, 150, 0.9))

.gm-walker
  transform: translate(-50%, -100%)
  filter: drop-shadow(0 3px 3px rgba(10, 10, 30, 0.6))
  transition: left 50ms linear

.gm-house
  transform: translate(-50%, -100%)

.gm-flip
  display: block

// the place on the road under the star: dashed; solid while the wise men stand in it
.gm-zone
  position: absolute
  aspect-ratio: 6 / 1
  transform: translate(-50%, -85%)
  border: 3px dashed #fff6dc
  border-radius: 50%
  background: rgba(255, 246, 220, 0.18)
  box-shadow: 0 0 0 2px rgba(20, 20, 40, 0.6)
  pointer-events: none
  z-index: 1

  &.under
    border-style: solid

.gm-mark
  position: absolute
  left: 50%
  top: 0
  display: block
  margin: -34px 0 0 -15px
  pointer-events: none

.gm-count, .gm-state
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

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

// less motion: the wise men move without gliding
@media (prefers-reduced-motion: reduce)
  .gm-walker
    transition: none
</style>
