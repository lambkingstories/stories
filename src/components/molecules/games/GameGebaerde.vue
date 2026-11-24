<script setup lang="ts">
/**
 * Show them (Luke 1,21-22): the forecourt of the temple; Zacharias comes out and cannot speak, the people wait. The child speaks for him with his hands: the hint says what Zacharias wants to
 * show ("You saw something in the temple." / "You cannot speak."), and among three cards with postures of Zacharias the child picks the one the people understand. Which signs Zacharias made is not
 * in the Bible: the four postures and their meaning are a rule of the game.
 * Right: a tick, a bright tone, "They understand him.", the big Zacharias takes the posture of the card and the people turn from puzzled to understanding. Wrong: a cross on the card (it stays
 * lying, dimmed, and cannot be chosen again), a low tone, "They do not understand that.", a mistake, the people tilt their heads a little. Two rounds. "Help me" after fifteen seconds makes the
 * right card shine. Keyboard: Tab to a card, Enter or Space picks it. Less motion: nothing tilts, nothing pulses. Nothing is shown by colour alone.
 * Stars: `johannesStars(mistakes)`.
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
import { johannesStars } from '@/utils/johannesGames'
import { gestureCheck, gestureHelp, gesturePose } from '@/utils/johannesNeu'
import type { GestureGame, GesturePose } from '@/utils/johannesNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GestureGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.length
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
/** The cards of this round that the people did not understand. */
const tried = ref<string[]>([])
/** The card that was right (the people understand now). */
const chosen = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const tilt = ref(false)
let messageSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, total - 1)]!)
const stars = computed(() => johannesStars(mistakes.value))
const countText = computed(() => t('app.adventure.signTalkCount', { n: progress.parts.value, total }))
const cards = computed(() => current.value.cards.map((id) => gesturePose(props.game, id)).filter((p): p is GesturePose => !!p))
const help = computed(() => (helping.value && phase.value === 'play' ? gestureHelp(current.value) : null))
const zacharias = computed(() => (chosen.value ? (gesturePose(props.game, chosen.value)?.image ?? props.game.zacharias.image) : props.game.zacharias.image))
const crowd = computed(() => (chosen.value ? props.game.crowd.understood : props.game.crowd.puzzled))

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

function pick(id: string) {
  if (phase.value !== 'play' || finished.value || tried.value.includes(id)) return
  touched()
  if (!gestureCheck(current.value, id)) {
    tried.value = [...tried.value, id]
    mistakes.value++
    play('wrong')
    tilt.value = true
    later(() => (tilt.value = false), 900)
    say(t('app.adventure.signTalkWrong'), 3600)
    return
  }
  chosen.value = id
  phase.value = 'between'
  progress.mark()
  play('right')
  say(t('app.adventure.signTalkRight'), 0)
  later(() => {
    if (round.value >= total - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    tried.value = []
    chosen.value = null
    phase.value = 'play'
    say('', 1)
  }, 2800)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.signTalkHelpGo'), 4200)
}

// ---- looks: a sprite stands with the middle of its feet at `x`, `y`
const spriteStyle = (s: { x: number; y: number; w: number; ratio: number }) => {
  const h = (s.w * ratio.value) / s.ratio
  return { left: `${s.x - s.w / 2}%`, top: `${s.y - h}%`, width: `${s.w}%` }
}
const zachStyle = computed(() => spriteStyle(props.game.zacharias))
const crowdStyle = computed(() => spriteStyle(props.game.crowd))
const poseRatio = props.game.zacharias.ratio
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="total > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-wrap")
        div(
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.signTalkField')"
        )
          span(class="gm-zach" :class="{ glad: !!chosen }" :style="zachStyle" aria-hidden="true")
            GameImage(:src="zacharias" :ratio="poseRatio" colour="#8aa0b8" :label="chosen ?? 'zacharias'")
          span(class="gm-crowd" :class="{ tilt, understood: !!chosen }" :style="crowdStyle" aria-hidden="true")
            GameImage(:src="crowd" :ratio="game.crowd.ratio" colour="#b89a68" :label="chosen ? 'volk-versteht' : 'volk-ratlos'")
            span(v-if="chosen" class="gm-mark")
              GameMark(kind="good")
        div(class="gm-tray" role="group" :aria-label="t('app.adventure.signTalkCards')")
          button(
            v-for="o in cards"
            :key="o.id"
            type="button"
            class="gm-card"
            :class="{ shine: help === o.id, wrong: tried.includes(o.id), right: chosen === o.id }"
            :data-card="o.id"
            :aria-label="o.label"
            :disabled="phase !== 'play' || tried.includes(o.id)"
            @click="pick(o.id)"
          )
            GameImage(:src="o.image" :ratio="poseRatio" colour="#d9b86a" :label="o.id")
            span(v-if="tried.includes(o.id)" class="gm-cardmark")
              GameMark(kind="bad")
            span(v-else-if="chosen === o.id" class="gm-cardmark")
              GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.signTalkHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.signTalkDone')" @next="emit('done', stars)")
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
  display: flex
  flex-direction: column
  gap: 8px

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b89a68
  background-size: cover
  background-position: center

.gm-zach, .gm-crowd
  position: absolute
  display: block
  pointer-events: none
  transform-origin: 50% 100%
  transition: transform 300ms ease

.gm-crowd.tilt
  transform: rotate(-2deg)

.gm-mark
  position: absolute
  top: -14px
  right: 2%
  pointer-events: none

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-start
  gap: 8px
  min-height: 128px

.gm-card
  position: relative
  display: block
  box-sizing: border-box
  width: 96px
  min-height: 128px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer
  font-family: inherit
  transition: transform 200ms ease

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.wrong
    border-style: dashed
    background: rgba(255, 246, 220, 0.5)

    :deep(.gi)
      opacity: 0.5

  &.right
    border-color: #2fae54
    transform: scale(1.05)

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 10px rgba(255, 220, 110, 0.9)

.gm-cardmark
  position: absolute
  top: -8px
  right: -8px
  pointer-events: none

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

  &:empty
    display: none

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
  .gm-zach, .gm-crowd, .gm-card
    transition: none

  .gm-crowd.tilt
    transform: none

  .gm-card.shine
    animation: none

  .gm-card.right
    transform: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-zach, .gm-crowd, .gm-card
    transition: none

  .gm-crowd.tilt
    transform: none

  .gm-card.shine
    animation: none

  .gm-card.right
    transform: none
</style>
