<script setup lang="ts">
/**
 * The city wakes up (2 Kings 19,35 "early in the morning"): houses stand in a grid on the slope of Jerusalem, some doors are still shut. A tap on a house turns its door and the doors of its four
 * neighbours (shut becomes open, open becomes shut); when every door is open the morning has come ("Morning has come.", a bright ring tone, the slope gets a warmer light). The rule of the neighbours is
 * a rule of the game; there are no mistakes and no crosses, every tap is allowed. "Undo" takes the last tap back and "Start again" sets the round back, both cost nothing. "Help me" after fifteen seconds
 * lets the house shine that has to be tapped next (the first tap of a shortest way from the CURRENT state). Keyboard: arrow keys go from house to house, Enter or Space turns. Less motion: the doors jump,
 * nothing pulses. A shut door and an open door differ in their form (a bar across, a lamp inside), not in colour alone; the screen reader says "house, door shut" or "house, door open".
 * Points (for "Go on"): every door that is shut at the start counts once when it is open for the first time in its round (3 + 7 doors). Stars: `moveStars(taps beyond the shortest ways)`.
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
import { moveStars } from '@/utils/hiskiaGames'
import { hintTap, morningCell, morningOpenAll, morningSolutions, morningTap, morningTouched } from '@/utils/hiskiaNeu'
import type { CityMorningGame } from '@/utils/hiskiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: CityMorningGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the goal: every door that is shut at the start of its round and has to be opened (3 + 7)
const total = props.game.rounds.reduce((n, r) => n + r.shut.filter(Boolean).length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
const shut = ref<boolean[]>([...props.game.rounds[0]!.shut])
/** The taps of this round, in order (what "Undo" takes back). */
const taps = ref<number[]>([])
/** The doors that were shut at the start and are open for the first time in this round (counted once). */
const counted = ref<number[]>([])
/** The taps beyond the shortest way, summed over the finished rounds. */
const extra = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const turning = ref<number[]>([])
const lit = ref(false)
const fieldEl = ref<HTMLElement | null>(null)
let messageSeq = 0
let turnSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 0.75)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => moveStars(extra.value))
const openCount = computed(() => shut.value.filter((s) => !s).length)
const countText = computed(() => t('app.adventure.cityWakeCount', { n: openCount.value, total: shut.value.length }))
const help = computed(() => (helping.value && phase.value === 'play' ? hintTap(shut.value, current.value.cols, current.value.rows) : null))
const best = computed(() => morningSolutions(current.value.shut, current.value.cols, current.value.rows)[0]?.length ?? 0)

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function touched() {
  idle.value = 0
  helping.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

function tap(i: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const rd = current.value
  const next = morningTap(shut.value, rd.cols, rd.rows, i)
  shut.value = next
  taps.value = [...taps.value, i]
  play('tap')
  const k = ++turnSeq
  turning.value = morningTouched(rd.cols, rd.rows, i)
  later(() => {
    if (turnSeq === k) turning.value = []
  }, 500)
  next.forEach((s, d) => {
    if (!s && rd.shut[d] && !counted.value.includes(d)) {
      counted.value = [...counted.value, d]
      progress.mark()
    }
  })
  if (morningOpenAll(next)) endRound()
}

function endRound() {
  phase.value = 'between'
  lit.value = true
  extra.value += Math.max(0, taps.value.length - best.value)
  play('star')
  say(t('app.adventure.cityWakeRoundDone'), 0)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      finished.value = true
      return
    }
    round.value++
    const rd = props.game.rounds[round.value]!
    shut.value = [...rd.shut]
    taps.value = []
    counted.value = []
    lit.value = false
    phase.value = 'play'
    say('', 1)
  }, 3000)
}

function undo() {
  if (phase.value !== 'play' || taps.value.length === 0) return
  touched()
  const last = taps.value[taps.value.length - 1]!
  shut.value = morningTap(shut.value, current.value.cols, current.value.rows, last)
  taps.value = taps.value.slice(0, -1)
}
function again() {
  if (phase.value !== 'play') return
  touched()
  shut.value = [...current.value.shut]
  taps.value = []
}
function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.cityWakeHelpGo'), 4200)
}

/** The arrow keys go from house to house. */
function arrow(i: number, dc: number, dr: number) {
  const rd = current.value
  const c = (i % rd.cols) + dc
  const r = Math.floor(i / rd.cols) + dr
  if (c < 0 || c >= rd.cols || r < 0 || r >= rd.rows) return
  ;(fieldEl.value?.querySelector(`[data-house="${r * rd.cols + c}"]`) as HTMLElement | null)?.focus()
}

// ---- looks
const cellStyle = (i: number) => {
  const c = morningCell(current.value, i)
  return { left: `${c.x - c.w / 2}%`, top: `${c.y - c.h / 2}%`, width: `${c.w}%`, height: `${c.h}%` }
}
const houseStyle = { width: `${props.game.fill * 100}%` }
const shapes = (i: number) => props.game.houses[(i + Math.floor(i / current.value.cols)) % props.game.houses.length]!
const label = (i: number) => t(shut.value[i] ? 'app.adventure.cityWakeShut' : 'app.adventure.cityWakeOpen')
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-wrap")
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.cityWakeField')"
        )
          span(class="gm-glow" :class="{ on: lit }" aria-hidden="true")
          button(
            v-for="(s, i) in shut"
            :key="i"
            type="button"
            class="gm-house"
            :class="{ shine: help === i, turn: turning.includes(i), shutDoor: s }"
            :data-house="i"
            :style="cellStyle(i)"
            :aria-label="label(i)"
            :disabled="phase !== 'play'"
            @click="tap(i)"
            @keydown.left.prevent="arrow(i, -1, 0)"
            @keydown.right.prevent="arrow(i, 1, 0)"
            @keydown.up.prevent="arrow(i, 0, -1)"
            @keydown.down.prevent="arrow(i, 0, 1)"
          )
            span(class="gm-hs" :style="houseStyle" aria-hidden="true")
              span(class="gm-door gm-closed" :class="{ hidden: !s }")
                GameImage(:src="shapes(i).shut" :ratio="game.houseRatio" colour="#b0a080" :label="`haus-zu`")
              span(class="gm-door gm-opened" :class="{ hidden: s }")
                GameImage(:src="shapes(i).open" :ratio="game.houseRatio" colour="#e0c070" :label="`haus-auf`")
        span(v-if="lit" class="gm-ok" aria-hidden="true")
          GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(tone="blau" small :disabled="taps.length === 0 || phase !== 'play'" @click="undo") {{ t('app.adventure.cityWakeUndo') }}
        AdvButton(tone="blau" small :disabled="phase !== 'play'" @click="again") {{ t('app.adventure.cityWakeAgain') }}
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" small @click="helpMe") {{ t('app.adventure.cityWakeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cityWakeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcb8
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round, .gm-count
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

.gm-round
  letter-spacing: 0.06em
  text-transform: uppercase

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-wrap
  position: relative

.gm-field
  position: relative
  width: 100%
  max-width: 330px
  margin: 0 auto
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8b890
  background-size: cover
  background-position: center

// the warmer light of the morning (a gradient over the picture, no new picture)
.gm-glow
  position: absolute
  inset: 0
  pointer-events: none
  opacity: 0
  background: linear-gradient(180deg, rgba(255, 224, 150, 0.55), rgba(255, 190, 110, 0.25))
  transition: opacity 900ms ease

  &.on
    opacity: 1

.gm-house
  position: absolute
  display: flex
  align-items: flex-end
  justify-content: center
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 12px
  background: transparent
  cursor: pointer
  font-family: inherit

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 1px

  &:disabled
    cursor: default

  &.shine
    border-color: #ffd86a
    box-shadow: 0 0 12px rgba(255, 220, 110, 0.95)
    animation: gm-pulse 1300ms ease-in-out infinite

  &.turn .gm-hs
    animation: gm-turn 420ms ease-in-out

.gm-hs
  position: relative
  display: block
  pointer-events: none

.gm-door
  display: block
  transition: opacity 260ms ease

  &.gm-opened
    position: absolute
    left: 0
    bottom: 0
    width: 100%

  &.hidden
    opacity: 0

.gm-ok
  position: absolute
  top: 6px
  right: 10px
  pointer-events: none

.gm-actions
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

.still
  .gm-door, .gm-glow
    transition: none

  .gm-house.shine, .gm-house.turn .gm-hs
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-turn
  0%, 100%
    transform: scaleX(1)
  50%
    transform: scaleX(0.9)

@media (prefers-reduced-motion: reduce)
  .gm-door, .gm-glow
    transition: none

  .gm-house.shine, .gm-house.turn .gm-hs
    animation: none
</style>
