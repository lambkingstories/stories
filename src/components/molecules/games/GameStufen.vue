<script setup lang="ts">
/**
 * "Up the steps" (1 Kings 8,3-6). The priests carry the ark of the covenant up to the house of God. The child walks with them: a tap on "Left" and then on "Right" (or the arrow keys) is one step,
 * always the other foot, in step. The wrong foot or a step that is too quick is a mistake (a cross and a word: "In step!", "Slower, the ark is heavy"); in round 2 a step that comes too late is a mistake too.
 * With every step the priests go up and grow a little smaller; at the top is the open door. The button "Help me" comes after fifteen seconds and walks four steps in time while the buttons show the foot.
 * With reduced motion the priests do not sway. The arithmetic is `utils/salomoNeu.ts`; stars: `osterStars(mistakes)`.
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
import { stairsBeat, stairsPlace, stairsStart, stairsTap } from '@/utils/salomoNeu'
import type { StairSide, StairsGame, StairsState, StairsVerdict } from '@/utils/salomoNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: StairsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.steps, 0))

const IDLE_SECONDS = 15
const HELP_STEPS = 4

const ratio = computed(() => props.game.ratio ?? 0.75)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<StairsState>(stairsStart())
const sway = ref<StairSide | null>(null)
const bad = ref(false)
const helping = ref(0)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let badSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2400) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function tickIdle() {
  if (!finished.value && !between.value && helping.value <= 0) idle.value += 0.25
  later(tickIdle, 250)
}
later(tickIdle, 250)

const SAY: Partial<Record<StairsVerdict, string>> = { 'wrong-foot': 'stairsWrongFoot', 'too-fast': 'stairsTooFast', 'too-slow': 'stairsTooSlow', restart: 'stairsRestart' }

function step(side: StairSide, byHelp = false) {
  if (finished.value || between.value) return
  if (!byHelp && helping.value > 0) return
  idle.value = 0
  const res = stairsTap(current.value, st.value, side, Date.now())
  const before = st.value.done
  st.value = res.state
  const v = res.verdict
  if (st.value.done > before) {
    progress.mark()
    sway.value = side
    play('tap')
    if (v === 'restart') say(t('app.adventure.stairsRestart'))
    if (st.value.done >= current.value.steps) arrive()
    return
  }
  mistakes.value++
  play('wrong')
  say(t(`app.adventure.${SAY[v] ?? 'stairsWrongFoot'}`))
  const id = ++badSeq
  bad.value = true
  later(() => {
    if (badSeq === id) bad.value = false
  }, 900)
}

function arrive() {
  between.value = true
  helping.value = 0
  later(() => play('right'), 200)
  later(() => play('bead'), 400)
  say(t('app.adventure.stairsArrived'), 0)
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
    st.value = stairsStart()
    sway.value = null
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step('left')
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    step('right')
  }
}

function helpMe() {
  idle.value = 0
  helping.value = HELP_STEPS
  say(t('app.adventure.stairsHelping'), 3600)
  const beat = stairsBeat(current.value) * 1000
  const walk = () => {
    if (helping.value <= 0 || between.value || finished.value) {
      helping.value = 0
      return
    }
    const side: StairSide = st.value.next ?? 'left'
    helping.value--
    step(side, true)
    if (helping.value > 0) later(walk, beat)
  }
  later(walk, 400)
}

const place = computed(() => stairsPlace(props.game, st.value.done, current.value.steps))
const groupStyle = computed(() => ({ top: `${place.value.y}%`, width: `${props.game.group.w * place.value.scale}%` }))
const nextSide = computed<StairSide | null>(() => st.value.next)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.stairsField')"
        @keydown="onKey"
      )
        div(class="gm-group" :class="[sway ? `sway-${sway}` : '', { bad }]" :style="groupStyle" role="img" :aria-label="game.group.label")
          GameImage(:src="game.group.image" :ratio="1" colour="#d8b25a" :label="game.group.label")
          span(v-if="bad" class="gm-mark")
            GameMark(kind="bad")
          span(v-if="between" class="gm-mark")
            GameMark(kind="good")
      div(class="gm-feet")
        button(type="button" class="gm-foot" :class="{ next: nextSide === 'left' }" :disabled="between" @pointerdown.prevent="step('left')" @keydown="onKey")
          span(class="gm-arrow" aria-hidden="true") ◀
          span {{ t('app.adventure.stairsLeft') }}
          span(v-if="nextSide === 'left'" class="gm-now") {{ t('app.adventure.stairsNow') }}
        button(type="button" class="gm-foot" :class="{ next: nextSide === 'right' }" :disabled="between" @pointerdown.prevent="step('right')" @keydown="onKey")
          span {{ t('app.adventure.stairsRight') }}
          span(class="gm-arrow" aria-hidden="true") ▶
          span(v-if="nextSide === 'right'" class="gm-now") {{ t('app.adventure.stairsNow') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.stairsCount', { n: st.done, total: current.steps }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helping <= 0" tone="gold" @click="helpMe") {{ t('app.adventure.stairsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stairsDone')" @next="emit('done', stars)")
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
  width: min(100%, 50vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9cbb0
  background-size: 100% 100%

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-group
  position: absolute
  left: 50%
  display: block
  transform: translate(-50%, -100%)
  transform-origin: 50% 100%
  pointer-events: none
  transition: top 380ms ease-out, width 380ms ease-out
  filter: drop-shadow(0 4px 4px rgba(50, 35, 10, 0.35))

  &.sway-left
    animation: gm-left 380ms ease-in-out

  &.sway-right
    animation: gm-right 380ms ease-in-out

  &.bad
    animation: gm-wobble 450ms ease-in-out 2

.gm-mark
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  z-index: 3

.gm-feet
  display: flex
  justify-content: center
  gap: 16px

.gm-foot
  position: relative
  flex: 1 1 0
  max-width: 220px
  min-height: 64px
  padding: 8px 14px
  border-radius: 18px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1.15rem
  color: #4a3a18
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  touch-action: manipulation
  cursor: pointer

  &.next
    border-width: 4px
    background: #ffe9a8

  &:disabled
    opacity: 0.5
    cursor: default

.gm-now
  position: absolute
  left: 50%
  bottom: -12px
  transform: translateX(-50%)
  padding: 0 8px
  border-radius: 999px
  background: #b8892a
  color: #fff6dc
  font-size: 1rem
  font-weight: 800

.gm-count
  margin: 6px 0 0
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

@keyframes gm-left
  0%, 100%
    rotate: 0deg
  50%
    rotate: -2.5deg

@keyframes gm-right
  0%, 100%
    rotate: 0deg
  50%
    rotate: 2.5deg

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  25%
    rotate: -5deg
  75%
    rotate: 5deg

@media (prefers-reduced-motion: reduce)
  .gm-group, .gm-group.sway-left, .gm-group.sway-right, .gm-group.bad
    animation: none
    transition: none
</style>
