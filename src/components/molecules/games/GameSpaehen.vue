<script setup lang="ts">
/**
 * Peek through the gate (Acts 12,13-16). Night: Rhoda stands inside the yard gate; she has heard a voice at the gate (a word at the start of every round, no recording). Behind the gate
 * lies the lane; through the cracks between the boards one sees only stripes of the people who go past. Some stop at the gate and knock softly. The child taps the gate (or the button
 * "That is Peter!", Enter or the space bar) only when it is really Peter: right = Rhoda turns round for joy (a tick). Anyone else: a cross and "That is not Peter. Look closely!",
 * the person walks on, a mistake. Whoever is not Peter and is left alone walks on after a while (a small tick for waiting well). When the child does not tap at Peter, he knocks again
 * (Acts 12,16: "Peter continued knocking"), no mistake; after the second knock the help shows his marks (beard, tunic, cloak).
 * Round 1: three wide cracks, five people; round 2: five narrow cracks, eight people. At the end of round 1 Rhoda runs in and does not open; at the end of round 2 the gate stands open.
 * "Help me" after fifteen seconds shows the marks too. Less motion: the people appear at the gate without walking; the knocking is also shown as a sign.
 * The gate is a picture with transparent cracks over the lane; nothing is drawn. Stars: `osterStars(mistakes)`.
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
import { peekIsPeter, peekTap } from '@/utils/pfingstenNeuB'
import type { PeekGame } from '@/utils/pfingstenNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PeekGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.people.length, 0))

const TICK_MS = 50
const IDLE_SECONDS = 15
const START_X = -12
const END_X = 112
/** Without walking (less motion) someone who only goes past is seen this long. */
const PASS_MS = 1500
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** Who is in the lane now (index into the people of the round; -1 nobody), where (percent) and what he does. */
const vi = ref(-1)
const x = ref(START_X)
const phase = ref<'in' | 'wait' | 'out' | 'none'>('none')
const waitMs = ref(0)
const knocks = ref(0)
const knocking = ref(false)
const showMarks = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const joy = ref(false)
const open = ref(false)
const between = ref(true)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const message = ref('')
let messageSeq = 0
let shownMs = 0
/** The person now walking on had waited at the gate without a tap (a small tick when he leaves). */
let waitedFlag = false
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const visit = computed(() => current.value.people[vi.value])
const person = computed(() => (visit.value ? props.game.people.find((p) => p.id === visit.value!.id) : undefined))
const speed = computed(() => (END_X - START_X) / props.game.walkMs)
const visible = computed(() => phase.value !== 'none' && x.value > -5 && x.value < 105)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad') {
  mark.value = kind
  later(() => {
    if (mark.value === kind) mark.value = null
  }, 900)
}

function startRound() {
  between.value = true
  vi.value = -1
  phase.value = 'none'
  joy.value = false
  showMarks.value = false
  say(t('app.adventure.peekVoice'), 2400)
  later(() => {
    between.value = false
    idle.value = 0
    nextVisitor()
  }, 1800)
}

function nextVisitor() {
  vi.value++
  knocks.value = 0
  waitMs.value = 0
  shownMs = 0
  waitedFlag = false
  if (!visit.value) return
  if (still) {
    x.value = props.game.stopX
    phase.value = visit.value.stop ? 'wait' : 'in'
    if (visit.value.stop) knock()
  } else {
    x.value = START_X
    phase.value = 'in'
  }
}

function knock() {
  knocks.value++
  knocking.value = true
  play('tap')
  later(() => (knocking.value = false), 700)
  if (knocks.value >= 2 && person.value?.peter) {
    showMarks.value = true
    say(t('app.adventure.peekKnocksAgain'), 3600)
  }
}

/** Someone leaves the lane: the visit is over. */
function leave(waitedWell: boolean) {
  progress.mark()
  if (waitedWell) {
    flash('good')
    say(t('app.adventure.peekWaited'), 1600)
  }
  phase.value = 'none'
  later(nextVisitor, 400)
}

function loop() {
  later(loop, TICK_MS)
  if (finished.value || between.value) return
  idle.value += TICK_MS / 1000
  const v = visit.value
  if (!v || phase.value === 'none') return
  if (phase.value === 'in') {
    if (still) {
      if (!v.stop && (shownMs += TICK_MS) >= PASS_MS) leave(false)
      return
    }
    x.value += speed.value * TICK_MS
    if (v.stop && x.value >= props.game.stopX) {
      x.value = props.game.stopX
      phase.value = 'wait'
      knock()
    } else if (x.value >= END_X) leave(false)
    return
  }
  if (phase.value === 'wait') {
    waitMs.value += TICK_MS
    if (waitMs.value < props.game.wait) return
    waitMs.value = 0
    if (peekIsPeter(props.game, v.id)) knock()
    else if (still) leave(true)
    else {
      phase.value = 'out'
      waitedFlag = true
    }
    return
  }
  // out
  x.value += speed.value * TICK_MS
  if (x.value >= END_X) leave(waitedFlag)
}
later(loop, TICK_MS)
startRound()

/** A tap on the gate (or the button, or Enter). */
function tap() {
  if (finished.value || between.value) return
  idle.value = 0
  const who = visible.value && phase.value !== 'out' ? visit.value?.id ?? null : null
  const verdict = peekTap(props.game, who)
  if (verdict === 'nobody') {
    say(t('app.adventure.peekNobody'))
    return
  }
  if (verdict === 'wrong') {
    mistakes.value++
    play('wrong')
    flash('bad')
    say(t('app.adventure.peekWrong'), 2800)
    waitedFlag = false
    if (still) {
      phase.value = 'none'
      progress.mark()
      later(nextVisitor, 900)
    } else phase.value = 'out'
    return
  }
  // Peter
  progress.mark()
  flash('good')
  play('right')
  between.value = true
  showMarks.value = false
  joy.value = true
  say(t(lastRound.value ? 'app.adventure.peekOpen' : 'app.adventure.peekJoy'), 0)
  if (lastRound.value) {
    later(() => (open.value = true), 1600)
    later(() => {
      play('star')
      finished.value = true
    }, 4600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 2400)
  later(() => {
    round.value++
    startRound()
  }, 3800)
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  tap()
}

/** "Help me": the marks of Peter show, and the cracks are marked. */
function helpMe() {
  idle.value = 0
  showMarks.value = true
  say(t('app.adventure.peekHelpSay'), 4000)
}

const personStyle = computed(() => ({ left: `${x.value}%`, height: `${props.game.personH}%` }))
const markNames = ['merkmal-bart', 'merkmal-tunika', 'merkmal-mantel']
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!open"
        class="gm-field"
        :class="{ glow: showMarks }"
        :style="{ backgroundImage: `url(${src(game.lane)})` }"
        role="button"
        tabindex="0"
        :aria-label="t('app.adventure.peekField')"
        @click="tap"
        @keydown="onKey"
      )
        div(v-if="person && phase !== 'none'" class="gm-person" :data-person="person.id" :style="personStyle" aria-hidden="true")
          GameImage(:src="person.image" :ratio="0.514" colour="#5d4d6a" :label="person.id")
        span(v-for="(s, k) in current.slits" :key="`slit-${round}-${k}`" class="gm-slit" :style="{ left: `${s.x}%`, width: `${s.w}%` }" aria-hidden="true")
        div(class="gm-gate" aria-hidden="true")
          GameImage(:src="current.gate" :ratio="1.5" colour="#4a3826" :label="`tor-${round + 1}`")
        div(class="gm-rhode" aria-hidden="true")
          GameImage(:src="joy ? game.rhode.run : game.rhode.listen" :ratio="0.667" colour="#a88a6a" :label="joy ? 'rhode-laeuft' : 'rhode-horcht'")
        span(v-if="knocking" class="gm-knock" :data-knock="knocks" role="img" :aria-label="t('app.adventure.peekKnock')") {{ t('app.adventure.peekKnock') }}
        span(v-if="mark" class="gm-mark")
          GameMark(:kind="mark")
      div(v-else class="gm-field gm-open" :style="{ backgroundImage: `url(${src(game.open)})` }" role="img" :aria-label="t('app.adventure.peekOpen')")
      div(v-if="showMarks" class="gm-marks" role="group" :aria-label="t('app.adventure.peekMarks')")
        span(v-for="(m, k) in game.marks" :key="m" class="gm-marktile")
          GameImage(:src="m" :ratio="1" round colour="#8a7a6a" :label="markNames[k] ?? `merkmal-${k + 1}`")
          span {{ t(`app.adventure.peekMark${k + 1}`) }}
      AdvButton(v-if="!open" tone="gold" :disabled="between" @click="tap") {{ t('app.adventure.peekButton') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !showMarks" tone="blau" @click="helpMe") {{ t('app.adventure.peekHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.peekDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #3e3550
  box-shadow: inset 0 0 18px rgba(10, 5, 20, 0.4)
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
  color: #4f3a28

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #fff6dc

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #2c2638
  background-size: cover
  background-position: center
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-open
  cursor: default

.gm-person
  position: absolute
  bottom: 4%
  display: block
  aspect-ratio: 360 / 700
  transform: translateX(-50%)
  z-index: 1

  :deep(.gi), :deep(img)
    width: 100%
    height: 100%

// help: the cracks shine a little (a soft light behind the gate, only in the cracks)
.gm-slit
  position: absolute
  top: 0
  bottom: 0
  display: none
  z-index: 1
  background: rgba(255, 236, 170, 0.18)

  .glow &
    display: block

.gm-gate
  position: absolute
  inset: 0
  z-index: 2
  pointer-events: none

  :deep(.gi), :deep(img)
    width: 100%
    height: 100%

.gm-rhode
  position: absolute
  left: 2%
  bottom: 0
  width: 18%
  z-index: 3
  pointer-events: none

.gm-knock
  position: absolute
  top: 8%
  left: 50%
  transform: translateX(-50%)
  z-index: 4
  padding: 2px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gm-mark
  position: absolute
  top: 30%
  left: 50%
  margin-left: -15px
  display: block
  z-index: 5

.gm-marks
  display: flex
  justify-content: center
  gap: 10px

.gm-marktile
  display: flex
  flex-direction: column
  align-items: center
  width: 72px
  font-weight: 700
  font-size: 1rem
  color: #fff6dc
  text-align: center

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
</style>
