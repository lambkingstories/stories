<script setup lang="ts">
/**
 * Which way does the wind blow? (John 3,8: "The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh"). A courtyard at night: a gust
 * moves a few small things (the flame of the lamp, a cloth on the line, an olive twig, the grass, a leaf); the wind itself is never drawn. After the gust the child taps one of three
 * wooden tablets: to the left, still, to the right. Round 1: four gusts, the answer is the way it blew. Round 2: five gusts; in three the wind turns in the middle and the end counts, one
 * is quite still (only the flame trembles a little). Right: a tick, a bright tone, "The wind blows to the right.", the things stand up again. Wrong: a cross, a low tone, the line says what
 * the flame did, a mistake, and the gust is shown again (after a second mistake on the same gust the right tablet shines). "Watch again" shows the gust once more without a mistake.
 * "Help me" after fifteen seconds makes the right tablet shine and the flame swing wider. Keyboard: Tab to a tablet, the arrow keys move between the three tablets, Enter or Space taps.
 * Less motion: the things do not glide, they switch (still, then the end lean) and stay in the end pose for four seconds; the leaf is laid down at the place it drifts to.
 * Nothing is shown by colour alone (a tick or a cross and a line of words). Stars: `ichbinStars(mistakes)`.
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
import { ichbinStars } from '@/utils/ichbinGames'
import { breezeAnswer, breezeEnd, breezeLean, breezeLeafOffset, breezePose, breezeSign, breezeTurns } from '@/utils/ichbinNeu'
import type { BreezeGame, BreezeTablet, BreezeThing } from '@/utils/ichbinNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: BreezeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.gusts.length, 0))

const TICK_MS = 50
const IDLE_SECONDS = 15
const SETTLE_MS = 500
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** How long the things keep the lean after the gust (milliseconds): longer when the motion is to be small. */
const HOLD_MS = still ? 4000 : 1300
const TABLETS: BreezeTablet[] = ['left', 'still', 'right']

type Phase = 'wait' | 'gust' | 'ask' | 'result' | 'between'
const round = ref(0)
const gustIdx = ref(0)
const phase = ref<Phase>('wait')
const gustT = ref(0)
const askT = ref(0)
const idle = ref(0)
const mistakes = ref(0)
const solved = ref(0)
const wrongHere = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const picked = ref<{ key: BreezeTablet; kind: 'good' | 'bad' } | null>(null)
let messageSeq = 0
let pickSeq = 0
const stars = computed(() => ichbinStars(mistakes.value))
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const gust = computed(() => current.value.gusts[Math.min(gustIdx.value, current.value.gusts.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const src = (p: string) => prependBaseUrl(p)

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function pick(key: BreezeTablet, kind: 'good' | 'bad') {
  const id = ++pickSeq
  picked.value = { key, kind }
  later(() => {
    if (pickSeq === id) picked.value = null
  }, 1100)
}

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  if (phase.value === 'gust') {
    gustT.value += TICK_MS
    if (gustT.value >= gust.value.ms) {
      gustT.value = gust.value.ms
      phase.value = 'ask'
      askT.value = 0
      idle.value = 0
    }
  } else if (phase.value === 'ask') {
    askT.value += TICK_MS
    idle.value += TICK_MS / 1000
  }
}
function startGust() {
  gustT.value = 0
  askT.value = 0
  idle.value = 0
  helping.value = wrongHere.value >= 2
  phase.value = 'gust'
}
function startRound() {
  gustIdx.value = 0
  wrongHere.value = 0
  helping.value = false
  message.value = ''
  say(t('app.adventure.breezeStart'), 2600)
  later(startGust, 900)
}
later(step, TICK_MS)
later(startRound, 600)

const rightText = computed(() => {
  const e = breezeEnd(gust.value)
  return t(e === 'left' ? 'app.adventure.breezeRightLeft' : e === 'right' ? 'app.adventure.breezeRightRight' : 'app.adventure.breezeRightCalm')
})
const wrongText = computed(() => {
  const g = gust.value
  if (g.dir === 'calm') return t('app.adventure.breezeWrongCalm')
  if (breezeTurns(g)) return t('app.adventure.breezeWrongTurn')
  return t(g.dir === 'left' ? 'app.adventure.breezeWrongLeft' : 'app.adventure.breezeWrongRight')
})

/** The child taps a tablet. */
function tap(key: BreezeTablet) {
  if (phase.value !== 'ask' || finished.value) return
  idle.value = 0
  if (key === breezeAnswer(gust.value)) {
    phase.value = 'result'
    helping.value = false
    progress.mark()
    solved.value++
    play('right')
    pick(key, 'good')
    say(rightText.value, 0)
    later(nextGust, 2000)
    return
  }
  mistakes.value++
  wrongHere.value++
  phase.value = 'result'
  play('wrong')
  pick(key, 'bad')
  say(wrongText.value, 0)
  later(startGust, 2200)
}
function nextGust() {
  wrongHere.value = 0
  helping.value = false
  message.value = ''
  if (gustIdx.value + 1 < current.value.gusts.length) {
    gustIdx.value++
    startGust()
    return
  }
  endRound()
}
function endRound() {
  phase.value = 'between'
  say(t('app.adventure.breezeRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 800)
  later(() => {
    round.value++
    startRound()
  }, 2400)
}
/** "Watch again": the same gust once more, no mistake. */
function again() {
  if (phase.value !== 'ask') return
  say('', 1)
  startGust()
}
/** "Help me": the right tablet shines and the flame swings wider. */
function helpMe() {
  idle.value = 0
  if (phase.value !== 'ask') return
  helping.value = true
  say(t('app.adventure.breezeHelpGo'), 4000)
}

// ---- the keyboard: the arrow keys move between the three tablets (Enter or Space taps the one that has the focus)
function onTabletKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  const all = Array.from(box.querySelectorAll<HTMLElement>('button.gm-tablet'))
  if (!all.length) return
  e.preventDefault()
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = all[at < 0 ? (e.key === 'ArrowRight' ? 2 : 0) : clamp3(at + (e.key === 'ArrowRight' ? 1 : -1), all.length)]
  next?.focus()
}
const clamp3 = (i: number, n: number) => Math.min(n - 1, Math.max(0, i))

// ---- looks
/** How far the things lean now (-1 to 1). */
const lean = computed(() => {
  let l = 0
  if (phase.value === 'gust') l = breezeLean(gust.value, gustT.value)
  else if (phase.value === 'ask') {
    const fade = Math.min(1, Math.max(0, (askT.value - HOLD_MS) / SETTLE_MS))
    l = breezeSign(breezeEnd(gust.value)) * (1 - fade)
  }
  if (still) return Math.abs(l) < 0.5 ? 0 : Math.sign(l)
  return l
})
const calmNow = computed(() => gust.value.dir === 'calm' && (phase.value === 'gust' || (phase.value === 'ask' && askT.value < HOLD_MS)))
const leafAt = computed(() => {
  if (phase.value === 'gust') return still ? 0 : breezeLeafOffset(gust.value, gustT.value)
  if (phase.value === 'ask' || phase.value === 'result') return breezeLeafOffset(gust.value, gust.value.ms)
  return 0
})
const imageOf = (th: BreezeThing): string => {
  const pose = breezePose(lean.value)
  if (!th.images || pose === 'still') return th.image
  return th.images[pose]
}
const thingStyle = (th: BreezeThing) => {
  const base: Record<string, string> = { left: `${th.x}%`, top: `${th.y}%`, width: `${th.w}%`, zIndex: String(Math.round(th.y * 10)) }
  const l = lean.value
  if (th.kind === 'flame') base.transform = 'translate(-50%, -100%)'
  else if (th.kind === 'cloth') base.transform = 'translate(-50%, 0)'
  else if (th.kind === 'grass') base.transform = `translate(-50%, -100%) rotate(${(l * 14).toFixed(1)}deg)`
  else if (th.kind === 'twig') base.transform = `translateY(-100%) rotate(${(l * 16).toFixed(1)}deg)`
  else {
    base.left = `${(th.x + leafAt.value).toFixed(2)}%`
    base.transform = `translate(-50%, -50%) rotate(${(l * 30 + leafAt.value * 3).toFixed(1)}deg)`
  }
  return base
}
const thingClass = (th: BreezeThing) => ({
  flicker: th.kind === 'flame' && calmNow.value && !still,
  swing: th.kind === 'flame' && helping.value && !still,
  twig: th.kind === 'twig',
  grass: th.kind === 'grass',
  leaf: th.kind === 'leaf'
})
const tabletStyle = computed(() => ({ width: `${props.game.tabletW}%` }))
const tabletLabel = (k: BreezeTablet) => t(k === 'left' ? 'app.adventure.breezeTabLeft' : k === 'right' ? 'app.adventure.breezeTabRight' : 'app.adventure.breezeTabStill')
const askText = computed(() => (current.value.ask === 'now' ? t('app.adventure.breezeAskNow') : t('app.adventure.breezeAsk')))
const totalGusts = props.game.rounds.reduce((s, r) => s + r.gusts.length, 0)
const countText = computed(() => t('app.adventure.breezeCount', { n: solved.value, total: totalGusts }))
const canAgain = computed(() => phase.value === 'ask' && askT.value > HOLD_MS + SETTLE_MS)
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ game.rounds[round]?.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
        role="img"
        :aria-label="t('app.adventure.breezeField')"
      )
        span(
          v-for="th in game.things"
          :key="th.id"
          class="gm-thing"
          :class="thingClass(th)"
          :data-thing="th.id"
          :data-pose="th.images ? breezePose(lean) : undefined"
          :style="thingStyle(th)"
          aria-hidden="true"
        )
          GameImage(:src="imageOf(th)" :ratio="th.ratio" colour="#c9b48a" :label="th.id")
      p(class="gm-ask" aria-live="polite") {{ phase === 'ask' || phase === 'result' ? askText : '' }}
      div(class="gm-tablets" role="group" :aria-label="t('app.adventure.breezeTablets')" @keydown="onTabletKey")
        button(
          v-for="k in TABLETS"
          :key="k"
          type="button"
          class="gm-tablet"
          :class="{ shine: helping && phase === 'ask' && breezeAnswer(gust) === k, good: picked && picked.key === k && picked.kind === 'good', bad: picked && picked.key === k && picked.kind === 'bad' }"
          :data-tablet="k"
          :style="tabletStyle"
          :disabled="phase !== 'ask'"
          :aria-label="tabletLabel(k)"
          @click="tap(k)"
        )
          GameImage(:src="game.tablets[k]" :ratio="1" colour="#a98a58" round :label="`tafel-${k}`")
          span(class="gm-cap") {{ tabletLabel(k) }}
          span(v-if="picked && picked.key === k" class="gm-mark")
            GameMark(:kind="picked.kind")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="canAgain" tone="blau" @click="again") {{ t('app.adventure.breezeAgain') }}
        AdvButton(v-if="idle > IDLE_SECONDS && phase === 'ask'" tone="gold" @click="helpMe") {{ t('app.adventure.breezeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.breezeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
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

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1f2a4a
  background-size: cover
  background-position: center

.gm-thing
  position: absolute
  display: block
  pointer-events: none
  transform-origin: 50% 100%

  &.twig
    transform-origin: 0 100%

  &.leaf
    transform-origin: 50% 50%
    transition: left 60ms linear

  &.grass
    transition: transform 120ms linear

  &.twig
    transition: transform 120ms linear

  &.flicker :deep(.gi)
    animation: gm-flicker 900ms ease-in-out infinite

  &.swing :deep(.gi)
    animation: gm-swing 1200ms ease-in-out infinite

.gm-ask
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gm-tablets
  display: flex
  justify-content: center
  gap: 8px

.gm-tablet
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  box-sizing: border-box
  min-width: 56px
  min-height: 56px
  padding: 4px
  border: 3px solid transparent
  border-radius: 16px
  background: transparent
  cursor: pointer
  font-family: inherit
  font-weight: 800
  font-size: 1rem
  color: #3f321b

  &:disabled
    cursor: default
    opacity: 0.85

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.6)

  &.good
    border-color: #2fae54

  &.bad
    border-color: #d63031

.gm-cap
  display: block
  line-height: 1.2

.gm-mark
  position: absolute
  top: -6px
  right: -6px
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

@keyframes gm-flicker
  0%, 100%
    transform: scaleX(1) rotate(0deg)
  30%
    transform: scaleX(0.94) rotate(-2deg)
  65%
    transform: scaleX(1.05) rotate(2deg)

@keyframes gm-swing
  0%, 100%
    transform: rotate(-8deg)
  50%
    transform: rotate(8deg)

@keyframes gm-pulse
  0%, 100%
    opacity: 0.7
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-thing
    transition: none

    &.flicker :deep(.gi), &.swing :deep(.gi)
      animation: none

  .gm-tablet.shine
    animation: none
</style>
