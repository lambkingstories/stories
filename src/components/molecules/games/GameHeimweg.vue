<script setup lang="ts">
/**
 * "The way home" (Luke 15,18.20). The son sets out for his father's house: the road leads straight to the farm on the hill; the son is seen from behind.
 * Step by step in time: with every beat a footprint comes in front of him (left, right, left …; it grows and gets clear), and the child taps when it is fully there.
 * In time: the son takes a step, and the picture grows toward the house of the father. Too early or too late: he stumbles (a mistake, a cross and "Out of step").
 * Round 1: a tap anywhere counts. Round 2 is quicker and the tap must be on the print that comes (the other foot is a mistake). A beat that is missed is no mistake.
 * Keys: Space or Enter taps (on the print that comes), the left and right arrow keys tap the left or the right print. The button "Help me" comes after fifteen seconds and
 * walks four steps in time by itself. With reduced motion the picture does not glide and the son does not sway. The arithmetic is `utils/gleichnisseNeu.ts`; stars: `osterStars(mistakes)`.
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
import { HOME_LEAD, homeFoot, homePrintShow, homeScale, homeTap } from '@/utils/gleichnisseNeu'
import type { HomeFoot, HomeGame } from '@/utils/gleichnisseNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: HomeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.steps, 0))

const TICK_MS = 40
const IDLE_SECONDS = 15
const HELP_STEPS = 4
const MISSED_HINT = 3

const ratio = computed(() => props.game.ratio ?? 0.75)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** milliseconds since the round began (the first beat is one beat later) */
const ms = ref(0)
let startAt = Date.now()
const steps = ref(0)
/** the last beat that was used (by a step or a stumble) */
const used = ref(0)
const helpLeft = ref(0)
const stumble = ref(false)
const stepMark = ref(false)
const mistakes = ref(0)
const missed = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let lastSeenBeat = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms_ = 2400) {
  const id = ++messageSeq
  message.value = text
  if (ms_ > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms_)
}

const FEET: HomeFoot[] = ['left', 'right']
const nextFoot = computed<HomeFoot>(() => homeFoot(steps.value))
const show = computed(() => (between.value ? 0 : homePrintShow(current.value, ms.value)))

function stepDone() {
  steps.value++
  missed.value = 0
  progress.mark()
  play('tap')
  stepMark.value = true
  later(() => (stepMark.value = false), 260)
  if (steps.value >= current.value.steps) roundDone()
}

function roundDone() {
  between.value = true
  helpLeft.value = 0
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.homewardRoundDone'), 0)
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
    steps.value = 0
    used.value = 0
    lastSeenBeat = 0
    missed.value = 0
    idle.value = 0
    stumble.value = false
    between.value = false
    message.value = ''
    startAt = Date.now()
    ms.value = 0
  }, 3000)
}

/** A tap of the child: `foot` is the print that was tapped (null: anywhere, or a key without a side). */
function tap(foot: HomeFoot | null) {
  if (finished.value || between.value || helpLeft.value > 0) return
  idle.value = 0
  const now = Date.now() - startAt
  ms.value = now
  if (now < current.value.beat * (1 - HOME_LEAD) - current.value.window) return // before the first print comes
  const r = current.value
  const res = homeTap(r, now, r.feet ? foot : null, used.value, steps.value)
  if (res.verdict.kind === 'again') return
  used.value = res.beat
  if (res.verdict.kind === 'step') {
    stepDone()
    return
  }
  mistakes.value++
  play('wrong')
  stumble.value = true
  later(() => (stumble.value = false), 900)
  say(t(res.verdict.kind === 'foot' ? 'app.adventure.homewardFoot' : res.verdict.kind === 'early' ? 'app.adventure.homewardEarly' : 'app.adventure.homewardLate'), 2200)
}

function loop() {
  if (!finished.value && !between.value) {
    ms.value = Date.now() - startAt
    const r = current.value
    // the beats whose window is over
    const over = Math.floor((ms.value - r.window - 1) / r.beat)
    while (lastSeenBeat < over) {
      lastSeenBeat++
      if (lastSeenBeat > used.value) {
        if (helpLeft.value > 0) continue
        missed.value++
        if (missed.value === MISSED_HINT) say(t('app.adventure.homewardMissed'), 3000)
      }
    }
    // the help steps in time by itself
    if (helpLeft.value > 0) {
      const beat = Math.round(ms.value / r.beat)
      if (beat > used.value && beat >= 1 && Math.abs(ms.value - beat * r.beat) <= TICK_MS) {
        used.value = beat
        helpLeft.value--
        stepDone()
      }
    } else idle.value += TICK_MS / 1000
  }
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

function onField(e: PointerEvent) {
  if (e.button > 0) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  tap(null)
}
function onPrint(e: PointerEvent, foot: HomeFoot) {
  if (e.button > 0) return
  e.preventDefault()
  e.stopPropagation()
  field.value?.focus({ preventScroll: true })
  tap(foot)
}
function onKey(e: KeyboardEvent) {
  const foot: HomeFoot | null | undefined = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : e.key === ' ' || e.key === 'Enter' ? null : undefined
  if (foot === undefined) return
  e.preventDefault()
  tap(foot)
}

function helpMe() {
  idle.value = 0
  helpLeft.value = HELP_STEPS
  say(t('app.adventure.homewardHelping'), 3200)
}

// ---- looks
const g = computed(() => props.game)
const scale = computed(() => homeScale(g.value, steps.value, current.value.steps))
const worldStyle = computed(() => ({
  backgroundImage: `url(${prependBaseUrl(g.value.background)})`,
  transformOrigin: `${g.value.house.x}% ${g.value.house.y}%`,
  transform: `scale(${scale.value})`
}))
const sonStyle = computed(() => ({ left: `${g.value.son.x}%`, top: `${g.value.son.y}%`, width: `${g.value.son.w}%` }))
const printStyle = (foot: HomeFoot) => {
  const p = foot === 'left' ? g.value.left : g.value.right
  const lit = foot === nextFoot.value
  const s = lit ? show.value : 0
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${g.value.print.w}%`, opacity: String(0.22 + 0.78 * s), transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * s})${foot === 'right' ? ' scaleX(-1)' : ''}` }
}
const printLabel = (foot: HomeFoot) => `${t(foot === 'left' ? 'app.adventure.homewardLeft' : 'app.adventure.homewardRight')}${foot === nextFoot.value ? ` (${t('app.adventure.homewardNext')})` : ''}`
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.homewardField')"
        @pointerdown="onField"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(class="gm-world" :style="worldStyle" aria-hidden="true")
        button(
          v-for="foot in FEET"
          :key="foot"
          type="button"
          tabindex="-1"
          class="gm-print"
          :class="{ next: foot === nextFoot }"
          :style="printStyle(foot)"
          :aria-label="printLabel(foot)"
          @pointerdown="onPrint($event, foot)"
        )
          GameImage(:src="game.print.image" :ratio="1" colour="#c8b48a" :label="game.print.label")
        div(class="gm-son" :class="{ stepping: stepMark, stumble }" :style="sonStyle" role="img" :aria-label="game.son.label")
          GameImage(:src="game.son.image" :ratio="1" colour="#a0603a" :label="game.son.label")
          span(v-if="stumble" class="gm-mark")
            GameMark(kind="bad")
          span(v-else-if="stepMark" class="gm-mark")
            GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.homewardCount', { n: steps, total: current.steps }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpLeft === 0" tone="gold" @click="helpMe") {{ t('app.adventure.homewardHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.homewardDone')" @next="emit('done', stars)")
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

// the road is upright (3:4): on a wide screen it is kept low enough to be seen whole
.gm-field
  position: relative
  align-self: center
  width: min(100%, 62vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c8b48a
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the picture grows toward the house of the father
.gm-world
  position: absolute
  inset: 0
  background-size: cover
  background-position: center
  transition: transform 450ms ease-out
  pointer-events: none

.gm-print
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: none
  background: none
  cursor: pointer
  z-index: 5
  -webkit-tap-highlight-color: transparent

.gm-son
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 6
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))

  &.stepping
    animation: gm-step 260ms ease-out 1

  &.stumble
    animation: gm-shake 450ms ease-in-out 2

.gm-mark
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-count
  margin: 0
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

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3%

@keyframes gm-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -4deg
  75%
    rotate: 4deg

@media (prefers-reduced-motion: reduce)
  .gm-world
    transition: none

  .gm-son.stepping, .gm-son.stumble
    animation: none
</style>
