<script setup lang="ts">
/**
 * The brick chain: builders stand in a row from the clay oven to the stack. A warm brick comes out of the oven into the hands of the first one (later also
 * pots of pitch). The child taps the one who holds something, and he passes it on to the next, until it lies on the stack. Everybody works together, nobody
 * is in charge and nothing is dropped. When the next one still has full hands, the builder only wobbles in a friendly way (no fault); a tap on somebody
 * with empty hands is a small cross (a fault). The next thing comes out of the oven only when the first one's hands are free: there is no hurry.
 * Round 1: three builders and four bricks; round 2: four builders with four bricks and four pots of pitch mixed. The arithmetic is `passAlong`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { chainDone, passAlong, startChain, type ChainState } from '@/utils/babelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import { softOf } from '@/utils/gameBackground'
import type { ChainGame } from '@/types/adventure'

const props = defineProps<{ game: ChainGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every brick and every pot of pitch of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.items.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const state = ref<ChainState>(startChain(current.value.people, current.value.items))
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<number | null>(null)
const flash = ref<{ index: number; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const src = (p: string) => prependBaseUrl(p)
const itemSrc = (kind: 'brick' | 'pitch') => src(kind === 'brick' ? props.game.brick : props.game.pitch)
const place = (p: [number, number]) => ({ left: `${p[0]}%`, top: `${p[1]}%` })
/** The picture of what the builder holds. */
const heldSrc = (i: number) => itemSrc(state.value.holders[i] === 'pitch' ? 'pitch' : 'brick')

function flashOn(index: number, kind: 'good' | 'bad') {
  flash.value = { index, kind }
  later(() => {
    if (flash.value?.index === index) flash.value = null
  }, 800)
}

function tap(index: number) {
  if (between.value || finished.value) return
  const held = state.value.holders[index]
  const r = passAlong(state.value, index)
  if (r.result === 'empty') {
    mistakes.value++
    play('wrong')
    flashOn(index, 'bad')
    message.value = t('app.adventure.chainEmpty')
    return
  }
  if (r.result === 'blocked') {
    // the next one still has full hands: a friendly wobble, no fault
    wobble.value = index
    message.value = t('app.adventure.chainFull')
    later(() => {
      if (wobble.value === index) wobble.value = null
    }, 500)
    return
  }
  state.value = r.state
  message.value = ''
  play(held === 'pitch' ? 'sack' : 'tap')
  if (r.result === 'stacked') {
    progress.mark()
    play('snap')
    flashOn(index, 'good')
    if (chainDone(r.state)) roundOver()
  }
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 800)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    state.value = startChain(current.value.people, current.value.items)
    between.value = false
    message.value = ''
  }, 1500)
}
</script>

<template lang="pug">
  div(class="ch")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ch-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ch-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="ch-field" role="group" :aria-label="t('app.adventure.chainField')")
        div(class="ch-bg" :style="{ backgroundImage: `url(${src(game.background)})`, filter: softOf(game.background) }" aria-hidden="true")
        span(class="ch-oven" :style="place(current.source)" aria-hidden="true")
        div(class="ch-stack" :style="place(current.sink)" role="img" :aria-label="t('app.adventure.chainStack', { n: state.stacked.length })")
          img(v-for="(kind, i) in state.stacked" :key="i" :src="itemSrc(kind)" alt="" draggable="false" :style="{ bottom: `${(i % 4) * 22}%`, left: `${Math.floor(i / 4) * 30}%` }")
        button(
          v-for="(slot, i) in current.slots"
          :key="`${round}-${i}`"
          type="button"
          class="ch-worker"
          :class="{ wobble: wobble === i, holding: state.holders[i] !== null }"
          :style="place(slot)"
          :aria-label="state.holders[i] ? t(state.holders[i] === 'brick' ? 'app.adventure.chainHoldsBrick' : 'app.adventure.chainHoldsPitch', { n: i + 1 }) : t('app.adventure.chainEmptyHands', { n: i + 1 })"
          @click="tap(i)"
        )
          img(:src="src(game.worker)" alt="" draggable="false" class="ch-body")
          img(v-if="state.holders[i]" :src="heldSrc(i)" alt="" draggable="false" class="ch-load")
          GameMark(v-if="flash?.index === i" :kind="flash.kind" class="ch-mark")
      p(class="ch-fb" role="status") {{ message }}
      p(class="ch-count") {{ t('app.adventure.chainCount', { n: state.stacked.length, total: current.items.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.chainFinished')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ch
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.ch-round
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

.ch-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ch-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e

// the picture behind the row is a little soft: the stage picture is very full, and the row of builders has to stand out of it
.ch-bg
  position: absolute
  inset: -3%
  background-size: cover
  background-position: center
  filter: blur(2px) brightness(1.05)

// the mouth of the oven: a warm glow (the picture shows the oven itself)
.ch-oven
  position: absolute
  width: 7%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 190, 90, 0.55) 0%, rgba(255, 150, 60, 0) 70%)
  pointer-events: none

.ch-stack
  position: absolute
  width: 14%
  height: 14%
  transform: translate(-50%, -80%)
  pointer-events: none

  img
    position: absolute
    width: 40%
    height: auto

.ch-worker
  position: absolute
  width: 16%
  min-width: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.wobble
    animation: ch-shake 480ms ease-in-out

.ch-body
  display: block
  width: 100%
  height: auto
  pointer-events: none
  filter: drop-shadow(0 4px 3px rgba(60, 40, 10, 0.5))

// what the builder holds lies in the hands, in front of the body
.ch-load
  position: absolute
  left: 50%
  top: 46%
  width: 70%
  height: auto
  transform: translateX(-50%)
  pointer-events: none
  filter: drop-shadow(0 2px 2px rgba(60, 40, 10, 0.6))

.ch-mark
  position: absolute
  top: 0
  right: -6px

.ch-fb
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

.ch-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes ch-shake
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(-54%, -100%) rotate(-3deg)
  75%
    transform: translate(-46%, -100%) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .ch-worker.wobble
    animation: none
</style>
