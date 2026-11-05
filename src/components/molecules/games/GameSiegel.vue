<script setup lang="ts">
/**
 * The seal (2 Kings 5,5: the king of Syria writes a letter to the king of Israel). Seen from above: the king's writing table with the rolled letter; on the letter lies red wax
 * with the faint imprint of the king's seal (a lion with a star). Over the wax hovers the seal; the child turns it (a finger circling anywhere on the table, the two turn buttons
 * or the arrow keys) until the lion lies exactly in the imprint, and then presses it ("Seal", Enter). It fits: a tick, the wax is sealed and the next place comes. It does not fit:
 * a cross and "That does not fit yet", one mistake. Round 1: two seals with a wide margin; round 2: three seals that must sit more exactly. Whoever does nothing for fifteen seconds
 * gets "Help me": it shows which way to turn. Nothing is shown by colour alone (tick, cross, words). With reduced motion nothing presses or breathes.
 * The arithmetic is `utils/elisaNeu.ts`; stars: `osterStars(mistakes)`.
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
import { ELISA_RATIO, angleAt, sealDrag, sealFits, sealNudge, sealWay } from '@/utils/elisaNeu'
import type { SealGame, SealSpot } from '@/utils/elisaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SealGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every seal of every round
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.spots.length, 0))

const IDLE_SECONDS = 15
const PRESS_MS = 600

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The place that is being sealed now (all before it are sealed). */
const active = ref(0)
const spot = computed<SealSpot>(() => current.value.spots[Math.min(active.value, current.value.spots.length - 1)]!)
const angle = ref(spot.value.start)
const pressing = ref(false)
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
const mark = ref<'good' | 'bad' | null>(null)
/** The help: which turn button breathes. */
const hinted = ref<1 | -1 | 0>(0)
let messageSeq = 0
let hintSeq = 0
const stars = computed(() => osterStars(mistakes.value))
const busy = computed(() => pressing.value || between.value || finished.value)
const src = (p: string) => prependBaseUrl(p)

function say(text: string, kind: 'good' | 'bad' | null = null, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  mark.value = kind
  if (ms > 0)
    later(() => {
      if (messageSeq === id) {
        message.value = ''
        mark.value = null
      }
    }, ms)
}

function tick() {
  if (!busy.value) idle.value++
  later(tick, 1000)
}
later(tick, 1000)

// ---- turning with a finger: anywhere on the table, around the middle of the wax
const field = ref<HTMLElement | null>(null)
let fingerLast: number | null = null
function fingerAngle(e: PointerEvent): number {
  const box = field.value?.getBoundingClientRect()
  const c = box ? { x: box.left + (box.width * spot.value.x) / 100, y: box.top + (box.height * spot.value.y) / 100 } : { x: 0, y: 0 }
  return angleAt(c, { x: e.clientX, y: e.clientY })
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value) return
  if ((e.target as HTMLElement | null)?.closest('button')) return
  idle.value = 0
  hinted.value = 0
  fingerLast = fingerAngle(e)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
function move(e: PointerEvent) {
  if (fingerLast === null || busy.value) return
  const a = fingerAngle(e)
  angle.value = sealDrag(angle.value, fingerLast, a)
  fingerLast = a
}
function up() {
  fingerLast = null
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
onBeforeUnmount(up)

function turn(dir: 1 | -1) {
  if (busy.value) return
  idle.value = 0
  hinted.value = 0
  angle.value = sealNudge(angle.value, dir)
}

const KEYS: Record<string, 1 | -1> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }
function onKey(e: KeyboardEvent) {
  const d = KEYS[e.key]
  if (d !== undefined) {
    e.preventDefault()
    turn(d)
    return
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target === field.value) {
    e.preventDefault()
    press()
  }
}

/** Press the seal into the wax. */
function press() {
  if (busy.value) return
  idle.value = 0
  hinted.value = 0
  if (!sealFits(angle.value, spot.value, current.value.tolerance)) {
    mistakes.value++
    play('wrong')
    say(t('app.adventure.sealTurnWrong'), 'bad', 3600)
    return
  }
  pressing.value = true
  play('snap')
  later(() => {
    pressing.value = false
    progress.mark()
    say(t('app.adventure.sealTurnSealed'), 'good')
    if (active.value < current.value.spots.length - 1) {
      active.value++
      angle.value = spot.value.start
      return
    }
    roundOver()
  }, PRESS_MS)
}

function roundOver() {
  between.value = true
  active.value = current.value.spots.length
  play('right')
  say(t('app.adventure.sealTurnRoundDone'), 'good', 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), null, 0), 1300)
  later(() => {
    round.value++
    active.value = 0
    angle.value = spot.value.start
    idle.value = 0
    hinted.value = 0
    message.value = ''
    mark.value = null
    between.value = false
  }, 2600)
}

/** "Help me": which way to turn. */
function helpMe() {
  idle.value = 0
  const way = sealWay(angle.value, spot.value, current.value.tolerance)
  hinted.value = way
  const id = ++hintSeq
  later(() => {
    if (hintSeq === id) hinted.value = 0
  }, 6000)
  say(t(way === 1 ? 'app.adventure.sealTurnHelpRight' : way === -1 ? 'app.adventure.sealTurnHelpLeft' : 'app.adventure.sealTurnHelpPress'), null, 6000)
}

// ---- looks
const at = (x: number, y: number, w: number) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%` })
const letterStyle = computed(() => at(props.game.letterAt.x, props.game.letterAt.y, props.game.letterAt.w))
const sealed = (k: number) => k < active.value
const imprintStyle = (s: SealSpot) => ({ ...at(s.x, s.y, props.game.sealW), transform: `translate(-50%, -50%) rotate(${s.angle}deg)` })
const sealStyle = computed(() => ({ ...at(spot.value.x, spot.value.y, props.game.sealW), transform: `translate(-50%, -50%) rotate(${angle.value}deg)` }))
const spotsDone = computed(() => Math.min(active.value, current.value.spots.length))
</script>

<template lang="pug">
  div(class="sg")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="sg-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="sg-hint") {{ current.hint }}
      div(
        ref="field"
        class="sg-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ELISA_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.sealTurnField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        span(class="sg-pic" :style="letterStyle")
          GameImage(:src="game.letter" :ratio="game.letterRatio" colour="#e9d3a2" label="brief")
        template(v-for="(s, k) in current.spots" :key="`w-${round}-${k}`")
          span(class="sg-pic" :style="at(s.x, s.y, game.waxW)" role="img" :aria-label="t(sealed(k) ? 'app.adventure.sealTurnSpotDone' : 'app.adventure.sealTurnSpot', { n: k + 1, total: current.spots.length })")
            GameImage(:src="game.wax" :ratio="1" :round="true" colour="#b3261e" label="wachs")
          span(class="sg-pic sg-imprint" :class="{ sealed: sealed(k) }" :style="imprintStyle(s)" aria-hidden="true")
            GameImage(:src="game.seal" :ratio="578 / 588" :round="true" colour="#7a1510" label="abdruck")
          span(v-if="sealed(k)" class="sg-mark" :style="at(s.x, s.y - 14, 0)" aria-hidden="true")
            GameMark(kind="good")
        span(
          v-if="active < current.spots.length"
          class="sg-pic sg-seal"
          :class="{ pressing }"
          :style="sealStyle"
          role="img"
          :aria-label="t('app.adventure.sealTurnSeal')"
        )
          GameImage(:src="game.seal" :ratio="578 / 588" :round="true" :notch="true" colour="#d9a82e" label="siegel")
      p(class="sg-count") {{ t('app.adventure.sealTurnCount', { n: spotsDone, total: current.spots.length }) }}
      div(class="sg-actions")
        button(type="button" class="sg-turn" :class="{ hinted: hinted === -1 }" :disabled="busy" :aria-label="t('app.adventure.sealTurnLeft')" @click="turn(-1)") ↺
        AdvButton(tone="gold" small :disabled="busy" @click="press") {{ t('app.adventure.sealTurnPress') }}
        button(type="button" class="sg-turn" :class="{ hinted: hinted === 1 }" :disabled="busy" :aria-label="t('app.adventure.sealTurnRight')" @click="turn(1)") ↻
      AdvButton(v-if="idle >= IDLE_SECONDS && !busy" tone="blau" small @click="helpMe") {{ t('app.adventure.sealTurnHelp') }}
      p(class="sg-fb" role="status")
        GameMark(v-if="mark && message" :kind="mark")
        span {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sealTurnDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sg
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

.sg-round
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

.sg-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.sg-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a4a22
  background-size: cover
  background-position: center
  touch-action: none
  cursor: grab

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.sg-pic
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

// the imprint: the seal's own picture pressed into the wax (faint before, clear after)
.sg-imprint
  opacity: 0.38
  mix-blend-mode: multiply

  &.sealed
    opacity: 0.9

// the seal over the wax: a little see-through, so that the imprint shows under it
.sg-seal
  opacity: 0.62
  filter: drop-shadow(0 6px 6px rgba(30, 10, 0, 0.5))

  &.pressing
    animation: sg-press 600ms ease-in-out

.sg-mark
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none

.sg-count
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.sg-actions
  display: flex
  justify-content: center
  align-items: center
  gap: 12px

.sg-turn
  position: relative
  min-width: 52px
  min-height: 52px
  border-radius: 50%
  border: 3px solid #d4a83e
  background: #fff6dc
  color: #5a4a2c
  font-size: 1.6rem
  font-weight: 800
  line-height: 1
  cursor: pointer
  touch-action: manipulation

  &:disabled
    opacity: 0.6
    cursor: default

  &:focus-visible
    outline: 3px solid #5a4a2c
    outline-offset: 2px

  &.hinted::after
    content: ''
    position: absolute
    inset: -7px
    border: 3px dashed #8a5a12
    border-radius: 50%
    animation: sg-breathe 900ms ease-in-out infinite

.sg-fb
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
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

  &:has(span:empty)
    display: none

@keyframes sg-press
  0%, 100%
    scale: 1
  50%
    scale: 0.88

@keyframes sg-breathe
  0%, 100%
    scale: 1
  50%
    scale: 1.08

@media (prefers-reduced-motion: reduce)
  .sg-seal.pressing
    animation: none

  .sg-turn.hinted::after
    animation: none
</style>
