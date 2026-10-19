<script setup lang="ts">
/**
 * Call and answer: four sound blossoms hang in the evening garden, each with its own tone. A soft call rings: the blossoms light up one after
 * the other and play their tones. Then the child answers by tapping the blossoms in the same order. The call can be heard again at any time.
 * What rings is always shown as well (a blossom lights up), so nobody depends on hearing alone. A wrong blossom gets a red cross and the call
 * is played again, gently (a mistake); there is no time limit. Two rounds of three calls: first short calls, then longer ones.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { EchoGame } from '@/types/adventure'

const props = defineProps<{ game: EchoGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play, preload } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every call of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.calls.length, 0))
preload(['bead'])

/** The time between two blossoms of a call (ms): slow and calm. */
const GAP = 750
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const call = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const notes = computed(() => props.game.notes)
const sequence = computed(() => current.value.calls[Math.min(call.value, current.value.calls.length - 1)] ?? [])

/** `listen`: the call rings; `answer`: the child answers; `between`: a round or a call is done; the game ends with `finished`. */
const phase = ref<'listen' | 'answer' | 'between'>('listen')
const step = ref(0)
/** The blossom that shines right now. */
const lit = ref<number | null>(null)
const mistakes = ref(0)
const finished = ref(false)
const message = ref('')
const flash = ref<{ note: number; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))
/** The pending steps of the call that is ringing (so that "listen again" can drop them). */
let gen = 0

function shine(i: number, ms = 600) {
  lit.value = i
  play('bead', 1, notes.value[i]?.rate ?? 1)
  later(() => {
    if (lit.value === i) lit.value = null
  }, ms)
}

/** The call rings: the blossoms light up one after the other, then the child may answer. */
function ring(delay = 500) {
  const mine = ++gen
  phase.value = 'listen'
  step.value = 0
  message.value = t('app.adventure.echoListen')
  sequence.value.forEach((n, k) => {
    later(() => {
      if (mine === gen) shine(n)
    }, delay + k * GAP)
  })
  later(() => {
    if (mine !== gen) return
    phase.value = 'answer'
    message.value = t('app.adventure.echoAnswer')
  }, delay + sequence.value.length * GAP)
}
later(() => ring(0), 300)

function flashOn(note: number, kind: 'good' | 'bad') {
  flash.value = { note, kind }
  later(() => {
    if (flash.value?.note === note) flash.value = null
  }, 900)
}

function callDone() {
  progress.mark()
  phase.value = 'between'
  message.value = t('app.adventure.fbRight')
  later(() => {
    if (call.value < current.value.calls.length - 1) {
      call.value++
      ring(300)
    } else if (!lastRound.value) {
      message.value = t('app.adventure.gameNext')
      later(() => {
        round.value++
        call.value = 0
        ring(300)
      }, 1300)
    } else {
      finished.value = true
      play('star')
    }
  }, 900)
}

function tap(i: number) {
  if (phase.value !== 'answer' || finished.value) return
  if (sequence.value[step.value] === i) {
    shine(i, 450)
    flashOn(i, 'good')
    step.value++
    if (step.value >= sequence.value.length) callDone()
    return
  }
  mistakes.value++
  play('wrong')
  flashOn(i, 'bad')
  message.value = t('app.adventure.echoWrong')
  // the call is played again, gently
  phase.value = 'between'
  gen++
  later(() => ring(300), 1100)
}

/** "Listen again": no mistake, no cost. */
function again() {
  if (finished.value || phase.value !== 'answer') return
  ring(200)
}

const src = (p: string) => prependBaseUrl(p)
const heard = computed(() => step.value)
</script>

<template lang="pug">
  div(class="ec" :style="{ backgroundImage: `url(${src(game.scene)})` }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ec-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ec-hint") {{ current.hint }}
      p(class="ec-fb" role="status") {{ message }}
      div(class="ec-notes" role="group" :aria-label="t('app.adventure.echoField')")
        button(
          v-for="(n, i) in notes"
          :key="n.id"
          type="button"
          class="ec-note"
          :class="{ lit: lit === i, 'flash-good': flash?.note === i && flash.kind === 'good', 'flash-bad': flash?.note === i && flash.kind === 'bad' }"
          :disabled="phase !== 'answer'"
          :aria-label="t('app.adventure.echoNote', { n: i + 1 })"
          @click="tap(i)"
        )
          img(:src="src(lit === i ? n.imageOn : n.image)" alt="" draggable="false")
          GameMark(v-if="flash?.note === i" :kind="flash.kind" class="ec-mark")
      p(class="ec-steps" aria-hidden="true")
        span(v-for="(_, k) in sequence" :key="k" class="ec-step" :class="{ on: k < heard }")
      div(class="ec-again")
        AdvButton(tone="blau" small :disabled="phase === 'listen'" @click="again") {{ t('app.adventure.echoAgain') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.echoDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ec
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #e8b98a
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(80, 40, 10, 0.35)

.ec-round
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

.ec-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ec-fb
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

.ec-notes
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 8px
  padding: 40px 6px 10px

.ec-note
  position: relative
  display: block
  min-height: 64px
  padding: 0
  border: 0
  border-radius: 50%
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 200ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 4px 4px rgba(60, 30, 10, 0.5))

  &.lit
    transform: scale(1.14)
    filter: drop-shadow(0 0 14px rgba(255, 230, 120, 0.98))

  &.flash-good
    filter: drop-shadow(0 0 10px rgba(47, 174, 84, 0.95))

  &.flash-bad
    filter: drop-shadow(0 0 10px rgba(214, 48, 49, 0.95))

  &:disabled
    cursor: default

.ec-mark
  position: absolute
  top: -6px
  right: -4px

.ec-steps
  display: flex
  justify-content: center
  gap: 6px
  margin: 0

.ec-step
  width: 12px
  height: 12px
  border-radius: 50%
  border: 2px solid #8a6a2a
  background: rgba(255, 246, 220, 0.8)

  &.on
    background: #8a6a2a

.ec-again
  display: flex
  justify-content: center

@media (prefers-reduced-motion: reduce)
  .ec-note
    transition: none
</style>
