<script setup lang="ts">
/**
 * Listening at the gate (Esther 2,21-23). Mordecai sits on his bench in the king's gate; on the right stand the two doorkeepers. Now and then they put their heads together
 * and whisper: exactly then the child taps both doorkeepers, and Mordecai has heard it. A tap while they stand apart: a cross and "They are not whispering now" (a mistake).
 * Only one of the two tapped before they stand apart again: a word, no mistake. Round 1: three times, long whisperings; round 2: four times, shorter whisperings and shorter pauses.
 * On the keyboard: left and right tap one doorkeeper, Enter both. After fifteen seconds without a tap "Help me" marks the doorkeepers and says "Now!" while they whisper.
 * With reduced motion the two pictures change without fading. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/esterNeu.ts`; stars: `esterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { esterStars, gateAreas, gateDone, gatePhase, gateStart, gateTap } from '@/utils/esterNeu'
import type { GateGame, GateState } from '@/utils/esterNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GateGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.need, 0))

const TICK = 100
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** Milliseconds since the round began (only counted while the round runs). */
const clock = ref(0)
const st = ref<GateState>(gateStart())
const mistakes = ref(0)
const idle = ref(0)
const helpOn = ref(false)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const marks = ref<{ kind: 'good' | 'bad'; guard: number }[]>([])
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => esterStars(mistakes.value))
const phase = computed(() => gatePhase(current.value, clock.value))
const whisper = computed(() => !between.value && phase.value.whisper)
const areas = computed(() => gateAreas(props.game))
/** The doorkeepers tapped in the whispering that is on now. */
const tappedNow = computed(() => (whisper.value && st.value.cycle === phase.value.cycle ? st.value.tapped : []))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', guards: number[]) {
  const id = ++markSeq
  marks.value = guards.map((guard) => ({ kind, guard }))
  later(() => {
    if (markSeq === id) marks.value = []
  }, 900)
}

let lastCycle = -1
let wasWhisper = false
function loop() {
  if (!finished.value && !between.value) {
    clock.value += TICK
    idle.value += TICK / 1000
    const ph = phase.value
    // a whispering begins: with help on, the words say "Now!"
    if (ph.whisper && !wasWhisper && helpOn.value) say(t('app.adventure.gateWatchNow'), 0)
    // a whispering ended with only one doorkeeper tapped: a word, no mistake
    if (!ph.whisper && wasWhisper) {
      if (st.value.cycle === lastCycle && st.value.tapped.length === 1) say(t('app.adventure.gateWatchBoth'), 2800)
      else if (helpOn.value) message.value = ''
    }
    wasWhisper = ph.whisper
    lastCycle = ph.cycle
  }
  later(loop, TICK)
}
later(loop, TICK)

/** A tap on doorkeeper `guard` (0, 1; -1 both). */
function tap(guard: number) {
  if (between.value || finished.value) return
  idle.value = 0
  const res = gateTap(current.value, st.value, clock.value, guard)
  if (res.verdict === 'again') return
  if (res.verdict === 'apart') {
    mistakes.value++
    play('wrong')
    flash('bad', guard < 0 ? [0, 1] : [guard])
    say(t('app.adventure.gateWatchApart'), 2600)
    return
  }
  st.value = res.state
  if (res.verdict === 'one') {
    play('tap')
    flash('good', [guard])
    say(t('app.adventure.gateWatchOne'), 1600)
    return
  }
  // both are heard in this whispering
  progress.mark()
  play('snap')
  flash('good', [0, 1])
  say(t('app.adventure.gateWatchHeard', { n: st.value.heard, total: current.value.need }), 2400)
  if (gateDone(current.value, st.value)) endRound()
}

function endRound() {
  between.value = true
  later(() => play('right'), 600)
  later(() => say(t('app.adventure.gateWatchRoundDone'), 0), 900)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 2800)
  later(() => {
    round.value++
    st.value = gateStart()
    clock.value = 0
    wasWhisper = false
    lastCycle = -1
    helpOn.value = false
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4000)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    tap(e.key === 'ArrowLeft' ? 0 : 1)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    tap(-1)
  }
}

/** The button for those who miss the moment: the doorkeepers are marked, and "Now!" comes while they whisper. */
function helpMe() {
  idle.value = 0
  helpOn.value = true
  say(t(whisper.value ? 'app.adventure.gateWatchNow' : 'app.adventure.gateWatchHelped'), whisper.value ? 0 : 3200)
}

// ---- looks
const guardStyle = computed(() => {
  const g = props.game.guards
  return { left: `${g.x - g.w / 2}%`, top: `${g.y}%`, width: `${g.w}%` }
})
const areaStyle = (i: number) => {
  const a = areas.value[i]!
  return { left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }
}
const markStyle = (i: number) => {
  const a = areas.value[i]!
  return { left: `${a.x + a.w / 2}%`, top: `${a.y + 4}%` }
}
</script>

<template lang="pug">
  div(class="gt")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gt-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gt-hint") {{ current.hint }}
      div(
        class="gt-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.gateWatchField')"
        @keydown="onKey"
      )
        //- the doorkeepers: both pictures lie on the same place, one is seen
        div(class="gt-guards" :style="guardStyle" :data-whisper="whisper ? 'yes' : 'no'")
          span(class="gt-pose" :class="{ on: !whisper }")
            GameImage(:src="game.guards.apart" :ratio="game.guards.ratio" colour="#c9a77a" label="tuerhueter")
          span(class="gt-pose" :class="{ on: whisper }")
            GameImage(:src="game.guards.whisper" :ratio="game.guards.ratio" colour="#c9a77a" label="tuerhueter-fluestern")
        button(
          v-for="i in [0, 1]"
          :key="`g-${i}`"
          type="button"
          class="gt-guard"
          :class="{ help: helpOn && whisper, tapped: tappedNow.includes(i) }"
          :data-guard="i"
          :style="areaStyle(i)"
          :aria-label="game.guards.names[i]"
          tabindex="-1"
          @click="tap(i)"
        )
        span(v-for="(m, k) in marks" :key="`m-${k}-${m.guard}`" class="gt-mark" :style="markStyle(m.guard)")
          GameMark(:kind="m.kind")
      p(class="gt-count" aria-live="polite") {{ t('app.adventure.gateWatchCount', { n: st.heard, total: current.need }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helpOn" tone="gold" @click="helpMe") {{ t('app.adventure.gateWatchHelp') }}
      p(class="gt-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gateWatchDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gt
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

.gt-round
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

.gt-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gt-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9b48a
  background-size: cover
  background-position: center
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the doorkeepers stand with their feet on (x, y)
.gt-guards
  position: absolute
  display: block
  transform: translateY(-100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))

.gt-pose
  display: block
  opacity: 0
  transition: opacity 160ms ease-out

  &:not(:first-child)
    position: absolute
    inset: 0

  &.on
    opacity: 1

// a tapping area over each doorkeeper (at least 44 pixels)
.gt-guard
  position: absolute
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.18)

  &.tapped
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.45)

.gt-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 30

.gt-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gt-fb
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

// less motion: the two pictures change at once
@media (prefers-reduced-motion: reduce)
  .gt-pose
    transition: none
</style>
