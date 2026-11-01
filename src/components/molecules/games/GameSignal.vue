<script setup lang="ts">
/**
 * The silver trumpets (Numbers 10,1-10): God tells Moses to make two silver trumpets. When both are blown the whole people gathers, when only one is blown the leaders come, and another blast calls the camp to break up.
 * Two priests stand in the camp. The child listens to a signal (the button "Listen"; the priests show who blows, so the game also works without sound) and taps the picture that fits: the whole people gathers,
 * only the leaders come, the camp breaks up. Round 1: one signal at a time, round 2: three signals in a row, answered in the same order. A wrong picture is a dull sound and a cross; the signal can be heard again.
 * The sounds are three short trumpet files (`audio/abenteuer/wueste/trompete-*.mp3`); the arithmetic is in `utils/wuesteGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { signalAnswer, signalBlasts, signalGap } from '@/utils/wuesteGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useSoundSettings from '@/use/useSoundSettings'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SignalGame, SignalId } from '@/types/adventure'

const props = defineProps<{ game: SignalGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const settings = useSoundSettings()
const progress = useTaskProgress()
// the whole task: every question of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.questions.length, 0))

const round = ref(0)
const question = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const row = computed(() => current.value.questions[Math.min(question.value, current.value.questions.length - 1)]!)
const phase = ref<'ready' | 'playing' | 'answer'>('ready')
const given = ref<SignalId[]>([])
/** Which priests blow right now (0 = left, 1 = right). */
const blowing = ref<number[]>([])
const crossAt = ref<SignalId | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)

const audios = new Map<SignalId, HTMLAudioElement>()
function sound(id: SignalId): HTMLAudioElement | null {
  const have = audios.get(id)
  if (have) return have
  if (typeof Audio === 'undefined') return null
  const a = new Audio(src(props.game.sounds[id].file))
  a.preload = 'auto'
  audios.set(id, a)
  return a
}
function ring(id: SignalId) {
  const a = sound(id)
  if (!a) return
  try {
    a.currentTime = 0
    a.volume = Math.min(1, settings.sfxVolume.value * 0.85)
    void a.play().catch(() => undefined)
  } catch {
    // no sound: the priests show the signal anyway
  }
}
onBeforeUnmount(() => {
  for (const a of audios.values()) a.pause()
})

/** Blows the signals of the question one after the other (sound and priests), then the child answers. */
function listen() {
  if (phase.value === 'playing' || between.value || finished.value) return
  phase.value = 'playing'
  given.value = []
  message.value = t('app.adventure.signalListen')
  let at = 0.2
  for (const id of row.value) {
    const seconds = props.game.sounds[id].seconds
    later(() => ring(id), at * 1000)
    for (const b of signalBlasts(id, seconds)) {
      later(() => {
        blowing.value = b.priests
      }, (at + b.at) * 1000)
      later(() => {
        blowing.value = []
      }, (at + b.at + b.dur) * 1000)
    }
    at += signalGap(seconds)
  }
  later(() => {
    blowing.value = []
    phase.value = 'answer'
    message.value = t('app.adventure.signalPick')
  }, at * 1000)
}

function answer(id: SignalId) {
  if (phase.value !== 'answer' || between.value || finished.value) return
  const next = [...given.value, id]
  const res = signalAnswer(row.value, next)
  if (res === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.signalWrong')
    crossAt.value = id
    given.value = []
    later(() => {
      if (crossAt.value === id) crossAt.value = null
    }, 900)
    return
  }
  given.value = next
  play('snap')
  if (res === 'more') return
  progress.mark()
  play('right')
  between.value = true
  message.value = t('app.adventure.signalRight')
  const lastQuestion = question.value >= current.value.questions.length - 1
  if (lastQuestion && lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => {
    if (lastQuestion) {
      round.value++
      question.value = 0
    } else {
      question.value++
    }
    given.value = []
    phase.value = 'ready'
    between.value = false
    message.value = ''
  }, 1900)
}
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
        :aria-label="t('app.adventure.signalField')"
      )
        div(
          class="gm-priests"
          role="img"
          :aria-label="game.priests.label"
          :style="{ left: `${game.priests.x}%`, top: `${game.priests.y}%`, width: `${game.priests.w}%` }"
        )
          img(class="gm-half left" :class="{ blow: blowing.includes(0) }" :src="src(game.priests.image)" alt="" draggable="false")
          img(class="gm-half right" :class="{ blow: blowing.includes(1) }" :src="src(game.priests.image)" alt="" draggable="false")
      div(class="gm-actions")
        AdvButton(tone="gold" :disabled="phase === 'playing' || between" @click="listen") {{ phase === 'ready' ? t('app.adventure.signalPlay') : t('app.adventure.signalAgain') }}
        span(v-if="row.length > 1" class="gm-dots" :aria-label="t('app.adventure.signalRow', { n: given.length, total: row.length })")
          span(v-for="(_, i) in row" :key="i" class="gm-dot" :class="{ on: i < given.length }")
      div(class="gm-choices" role="group" :aria-label="t('app.adventure.signalChoices')")
        button(
          v-for="c in game.choices"
          :key="c.id"
          type="button"
          class="gm-choice"
          :disabled="phase !== 'answer' || between"
          :aria-label="c.label"
          @click="answer(c.id)"
        )
          img(:src="src(c.image)" alt="" draggable="false")
          span(v-if="crossAt === c.id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.signalCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.signalDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
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
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb78a
  background-size: cover
  background-position: center

// the two priests are one picture; the left and the right half are drawn twice, so each can raise its trumpet on its own
.gm-priests
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  aspect-ratio: 2 / 1
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

.gm-half
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: contain
  object-position: bottom center
  transition: translate 140ms ease-out
  pointer-events: none

  &.left
    clip-path: inset(0 50% 0 0)

  &.right
    clip-path: inset(0 0 0 50%)

  &.blow
    translate: 0 -5%
    filter: brightness(1.12)

.gm-actions
  display: flex
  align-items: center
  justify-content: center
  gap: 14px
  min-height: 52px

.gm-dots
  display: flex
  gap: 6px

.gm-dot
  display: block
  width: 16px
  height: 16px
  border-radius: 50%
  border: 2px solid #b8892b
  background: rgba(255, 246, 220, 0.9)

  &.on
    background: #d4a83e

.gm-choices
  display: flex
  justify-content: center
  gap: 10px

.gm-choice
  position: relative
  width: 30%
  min-width: 88px
  padding: 3px
  border-radius: 50%
  border: 3px solid #d4a83e
  background: rgba(255, 246, 220, 0.9)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:disabled
    opacity: 0.7
    cursor: default

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

  img
    display: block
    width: 100%
    height: auto
    border-radius: 50%
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

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

@media (prefers-reduced-motion: reduce)
  .gm-half
    transition: none
</style>
