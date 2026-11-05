<script setup lang="ts">
/**
 * The Twelve (Mark 3,13-19). Jesus has gone up the mountain and called those he wanted. They stand on the grassy slope, painted, each one a little different. A name lights up on top of the field together with
 * its sign (what the Bible says of him, for example the fisherman with the net or the tax collector with the coin box; for the others only something to tell him by, like a head cloth or a gray beard), and the
 * child taps that disciple. Right: a tick, the name goes to the list below. Wrong: a cross and a word that says who it was, the name stays lit (a mistake). Round 1: six disciples, round 2: all twelve.
 * Whoever does not go on gets the button "Help me" after fifteen seconds: the right disciple is marked. The arrow keys go from figure to figure, Enter taps. Nothing is shown by colour alone (tick, cross, words).
 * The mountain and the figures are painted pictures; nothing is drawn. Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { twelveBox, twelveNeighbour } from '@/utils/freundeNeu'
import type { Dir, TwelveDisciple, TwelveGame } from '@/utils/freundeNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TwelveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every name that is called, in every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.call.length, 0))

const TICK_MS = 250
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const callAt = ref(0)
const found = ref<string[]>([])
const wrongId = ref('')
const helpId = ref('')
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const idle = ref(0)
const message = ref('')
let messageSeq = 0
const figs = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

const byId = (id: string): TwelveDisciple => props.game.disciples.find((d) => d.id === id) ?? { id, image: '', name: id, sign: '' }
const wanted = computed(() => (between.value ? null : byId(current.value.call[callAt.value] ?? '')))
const standing = computed(() => current.value.stand.map((id, k) => ({ id, d: byId(id), spot: current.value.spots[k]!, k })))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  callAt.value = 0
  found.value = []
  wrongId.value = ''
  helpId.value = ''
  between.value = false
  idle.value = 0
}
startRound()

function loop() {
  if (!between.value && !finished.value) idle.value += TICK_MS / 1000
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

/** A tap on a disciple. */
function pick(id: string) {
  if (between.value || finished.value || !wanted.value) return
  idle.value = 0
  helpId.value = ''
  const d = byId(id)
  if (found.value.includes(id)) {
    say(t('app.adventure.twelveAgain', { name: d.name }))
    return
  }
  if (id === wanted.value.id) {
    found.value = [...found.value, id]
    wrongId.value = ''
    progress.mark()
    play('found')
    callAt.value++
    if (callAt.value >= current.value.call.length) {
      between.value = true
      later(() => play('right'), 250)
      say(t('app.adventure.twelveAll'), 0)
      if (lastRound.value) {
        later(() => {
          play('star')
          finished.value = true
        }, 1900)
        return
      }
      later(() => say(t('app.adventure.gameNext'), 0), 1300)
      later(() => {
        round.value++
        startRound()
        message.value = ''
      }, 2800)
      return
    }
    say(t('app.adventure.twelveRight', { name: d.name }), 1800)
    return
  }
  mistakes.value++
  wrongId.value = id
  play('wrong')
  say(t('app.adventure.twelveWrong', { other: d.name, name: wanted.value.name, sign: wanted.value.sign }), 3200)
  later(() => {
    if (wrongId.value === id) wrongId.value = ''
  }, 1500)
}

function onKey(e: KeyboardEvent, k: number) {
  const arrows: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = arrows[e.key]
  if (d !== undefined) {
    e.preventDefault()
    idle.value = 0
    const n = twelveNeighbour(props.game, current.value.spots, k, d)
    if (n !== null) figs.value[n]?.focus()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    pick(current.value.stand[k]!)
  }
}

/** The button "Help me": the disciple that is called is marked and gets the focus. */
async function helpMe() {
  if (!wanted.value) return
  idle.value = 0
  helpId.value = wanted.value.id
  say(t('app.adventure.twelveHelpSay', { name: wanted.value.name }), 4500)
  await nextTick()
  const k = current.value.stand.indexOf(wanted.value.id)
  if (k >= 0) figs.value[k]?.focus()
}

// ---- looks
const boxStyle = (k: number) => {
  const b = twelveBox(props.game, current.value.spots[k]!)
  return { left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: String(Math.round(current.value.spots[k]!.y * 10)) }
}
const fieldStyle = computed(() => ({ backgroundImage: `url(${src(props.game.background)})`, aspectRatio: String(props.game.ratio) }))
const label = (k: number) => {
  const d = standing.value[k]!.d
  const done = found.value.includes(d.id)
  return done ? t('app.adventure.twelveFoundLabel', { name: d.name }) : t('app.adventure.twelveFigure', { n: k + 1, sign: d.sign })
}
const setFig = (el: unknown, k: number) => {
  if (el instanceof HTMLElement) figs.value[k] = el
}
const jesusStyle = computed(() => {
  const j = props.game.jesus
  return j ? { left: `${j.x - j.w / 2}%`, top: `${j.y}%`, width: `${j.w}%` } : {}
})
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      p(class="gm-call" aria-live="polite")
        template(v-if="wanted")
          strong(class="gm-name") {{ wanted.name }}
          span(class="gm-sign") {{ wanted.sign }}
        template(v-else) {{ t('app.adventure.twelveAll') }}
      div(
        class="gm-field"
        :style="fieldStyle"
        role="group"
        :aria-label="t('app.adventure.twelveField')"
      )
        div(v-if="game.jesus" class="gm-jesus" :style="jesusStyle" role="img" :aria-label="game.jesus.label")
          GameImage(:src="game.jesus.image" :ratio="1" colour="#a07a5a" label="jesus")
        div(
          v-for="s in standing"
          :key="`${round}-${s.id}`"
          :ref="(el) => setFig(el, s.k)"
          class="gm-fig"
          :class="{ found: found.includes(s.id), wrong: wrongId === s.id, hint: helpId === s.id }"
          :data-disciple="s.id"
          :style="boxStyle(s.k)"
          role="button"
          tabindex="0"
          :aria-label="label(s.k)"
          @click="pick(s.id)"
          @keydown="onKey($event, s.k)"
        )
          span(class="gm-pic" aria-hidden="true")
            GameImage(:src="s.d.image" :ratio="game.figure" colour="#b08a5a" :label="s.id")
          span(v-if="found.includes(s.id)" class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
          span(v-else-if="wrongId === s.id" class="gm-mark" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-list" aria-live="polite") {{ t('app.adventure.twelveList', { n: found.length, total: current.call.length }) }}
        span(v-for="id in found" :key="id" class="gm-chip") {{ byId(id).name }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" class="gm-b" @click="helpMe") {{ t('app.adventure.twelveHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.twelveDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e4dcb8
  box-shadow: inset 0 0 18px rgba(70, 60, 20, 0.22)
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
  color: #4f3f28

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #4f3f28

.gm-call
  margin: 0
  align-self: center
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 4px 16px
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #fff6dc
  color: #3e2f1c
  font-weight: 700
  font-size: 1rem
  text-align: center

.gm-name
  font-size: 1.35rem
  font-weight: 900

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6f8f4a
  background-size: cover
  background-position: center

.gm-jesus
  position: absolute
  display: block
  pointer-events: none

  :deep(.gi), :deep(img)
    width: 100%

.gm-fig
  position: absolute
  display: block
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  // the place to tap is at least 44 x 44 pixels, even when the painted figure is narrower
  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: max(100%, 44px)
    height: max(100%, 44px)
    transform: translate(-50%, -50%)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  &.hint
    outline: 4px dashed #fff6dc
    outline-offset: 3px
    border-radius: 10px

  &.wrong .gm-pic
    animation: gm-shake 320ms ease-in-out

  &.found .gm-pic
    filter: drop-shadow(0 0 6px rgba(255, 240, 160, 0.95))

.gm-pic
  display: block
  width: 100%
  height: 100%

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: contain
    object-position: bottom

  :deep(.gi-stand)
    border-radius: 10px

.gm-mark
  position: absolute
  right: -6px
  top: -8px
  display: block
  z-index: 3

.gm-list
  margin: 0
  align-self: center
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 6px
  padding: 2px 12px
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #4f3f28

.gm-chip
  padding: 0 8px
  border-radius: 999px
  border: 2px solid #d4a83e
  background: #fff
  font-weight: 700

.gm-b
  align-self: center
  min-height: 44px
  min-width: 44px

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3a2a1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-shake
  0%, 100%
    translate: 0 0
  25%
    translate: -4% 0
  75%
    translate: 4% 0

@media (prefers-reduced-motion: reduce)
  .gm-fig.wrong .gm-pic
    animation: none
</style>
