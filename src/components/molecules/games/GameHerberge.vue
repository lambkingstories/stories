<script setup lang="ts">
/**
 * "To the inn" (Luke 10,34). The road seen from the side, the inn at the right. The Samaritan walks ahead and leads his donkey; on its back sits the man he bandaged.
 * The caravan walks by itself. Stones on the road and the swaying of the walk make the man lean forward or back; the child keeps him upright: holding the left half of the field
 * (or the button "Back", or the left arrow key) leans him back, the right half ("Forward", right arrow key) leans him forward. When he leans too far he slides (a mistake: a cross
 * and "Oops! The man slides."), the caravan stops and the Samaritan sets him straight. At the gate of the inn the round is won. Round 2 has more stones, and he tilts more easily.
 * The button "Help me" comes after fifteen seconds without a finger (counted over both rounds, a round is short) or after two slides in a round, and holds him upright over the next two stones. With reduced motion the figures do not sway.
 * The arithmetic is `utils/gleichnisseNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { INN_WARN, innAuto, innShare, innStart, innStep } from '@/utils/gleichnisseNeu'
import type { InnGame, InnState } from '@/utils/gleichnisseNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: InnGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
/** Every road counts in three parts: a third, two thirds, the gate. */
const PARTS = 3
progress.setGoal(props.game.rounds.length * PARTS)

const TICK = 0.05
const IDLE_SECONDS = 15
/** the help holds him over this many stones */
const HELP_STONES = 2

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<InnState>(innStart(props.game))
/** the push of the finger: -1 back, 0 nothing, +1 forward */
const control = ref(0)
const helpUntil = ref(-1)
const slipped = ref(false)
const mistakes = ref(0)
/** slides in this round: after two of them the help is offered at once (a round is short) */
const roundSlips = ref(0)
const credited = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const warn = ref<'forward' | 'back' | null>(null)
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))
/** the help holds him until the stones it promised are behind and he sits still again */
const helping = computed(() => helpUntil.value >= 0)

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function credit(n: number) {
  const due = Math.min(PARTS, n)
  while (credited.value < due) {
    progress.mark()
    credited.value++
  }
}

function arrive() {
  credit(PARTS)
  between.value = true
  control.value = 0
  helpUntil.value = -1
  warn.value = null
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.innArrived'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    st.value = innStart(props.game)
    credited.value = 0
    control.value = 0
    helpUntil.value = -1
    slipped.value = false
    roundSlips.value = 0
    between.value = false
    message.value = ''
  }, 2900)
}

function loop() {
  if (!finished.value && !between.value) {
    const c = helping.value ? innAuto(st.value) : control.value
    const res = innStep(props.game, current.value, st.value, c, TICK)
    st.value = res.state
    for (const ev of res.events) {
      if (ev.type === 'bump') play('tap')
      if (ev.type === 'slip') {
        mistakes.value++
        roundSlips.value++
        slipped.value = true
        play('wrong')
        say(t('app.adventure.innSlip'), 2800)
        later(() => (slipped.value = false), 1400)
      }
    }
    if (st.value.arrived) arrive()
    else {
      const v = st.value
      if (helpUntil.value >= 0 && v.passed >= helpUntil.value && Math.abs(v.tilt) < 4 && Math.abs(v.spin) < 15) helpUntil.value = -1
      if (credited.value < PARTS - 1) credit(Math.min(PARTS - 1, Math.floor(innShare(props.game, st.value) * PARTS + 1e-9)))
      const w = Math.abs(st.value.tilt) >= INN_WARN && st.value.pause <= 0 ? (st.value.tilt > 0 ? 'forward' : 'back') : null
      if (w !== warn.value) {
        warn.value = w
        if (w && !slipped.value) say(t(w === 'forward' ? 'app.adventure.innWarnForward' : 'app.adventure.innWarnBack'), 1600)
      }
      if (control.value === 0 && !helping.value) idle.value += TICK
      else idle.value = 0
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger: the left half leans him back, the right half forward
function sideOf(e: PointerEvent): number {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return 0
  return e.clientX - r.left < r.width / 2 ? -1 : 1
}
function press(e: PointerEvent, side?: number) {
  if (e.button > 0 || finished.value || between.value) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  control.value = side ?? sideOf(e)
  helpUntil.value = -1
  idle.value = 0
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
}
function release() {
  control.value = 0
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
}
onBeforeUnmount(() => release())
function keyDown(e: KeyboardEvent) {
  const side = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
  if (!side) return
  e.preventDefault()
  if (finished.value || between.value) return
  control.value = side
  helpUntil.value = -1
  idle.value = 0
}
function keyUp(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  control.value = 0
}

function helpMe() {
  idle.value = 0
  roundSlips.value = 0
  control.value = 0
  helpUntil.value = Math.min(st.value.passed + HELP_STONES, current.value.bumps.length)
  say(t('app.adventure.innHelping'), 3200)
}

// ---- looks
const g = computed(() => props.game)
const foot = computed(() => `${g.value.road}%`)
const donkeyH = computed(() => g.value.donkey.w * ratio.value)
const donkeyStyle = computed(() => ({ left: `${st.value.x}%`, top: foot.value, width: `${g.value.donkey.w}%`, zIndex: 20 }))
const riderStyle = computed(() => ({
  left: `${st.value.x - g.value.donkey.w / 2 + (g.value.donkey.w * g.value.seat.x) / 100}%`,
  top: `${g.value.road - (donkeyH.value * g.value.seat.y) / 100}%`,
  width: `${g.value.rider.w}%`,
  zIndex: 21
}))
const leaderStyle = computed(() => ({ left: `${st.value.x + g.value.donkey.w / 2 + g.value.lead}%`, top: foot.value, width: `${g.value.leader.w}%`, zIndex: 22 }))
const stoneStyle = (x: number, k: number) => ({ left: `${x}%`, top: foot.value, width: `${g.value.stones[k]?.w ?? 6}%`, zIndex: 10 })
const walking = computed(() => !st.value.arrived && st.value.pause <= 0 && !between.value)
const tiltText = computed(() => {
  const a = st.value.tilt
  if (Math.abs(a) < 6) return t('app.adventure.innUpright')
  return t(a > 0 ? 'app.adventure.innLeansForward' : 'app.adventure.innLeansBack')
})
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.innField')"
        @pointerdown="press($event)"
        @keydown="keyDown"
        @keyup="keyUp"
        @contextmenu.prevent
      )
        template(v-for="(b, k) in current.bumps" :key="`s-${round}-${k}`")
          div(class="gm-fig gm-stone" :style="stoneStyle(b.x, b.stone)" role="img" :aria-label="game.stones[b.stone]?.label")
            GameImage(:src="game.stones[b.stone]?.image ?? ''" :ratio="1" colour="#9b9184" :label="game.stones[b.stone]?.label")
        div(class="gm-fig" :class="{ walking }" :style="donkeyStyle" role="img" :aria-label="game.donkey.label")
          span(class="gm-bob")
            GameImage(:src="game.donkey.image" :ratio="1" colour="#9a9a9a" :label="game.donkey.label")
        div(class="gm-fig gm-rider" :class="{ walking }" :style="riderStyle" role="img" :aria-label="`${game.rider.label}: ${tiltText}`")
          span(class="gm-tilt" :style="{ transform: `rotate(${st.tilt}deg)` }")
            GameImage(:src="game.rider.image" :ratio="1" colour="#8a6a4a" :label="game.rider.label")
          span(v-if="slipped" class="gm-mark")
            GameMark(kind="bad")
          span(v-if="st.arrived" class="gm-mark")
            GameMark(kind="good")
        div(class="gm-fig" :class="{ walking }" :style="leaderStyle" role="img" :aria-label="game.leader.label")
          span(class="gm-bob")
            GameImage(:src="game.leader.image" :ratio="1" colour="#a0703a" :label="game.leader.label")
      div(class="gm-lean")
        button(type="button" class="gm-side" :class="{ on: control < 0 }" :disabled="between" @pointerdown.stop="press($event, -1)" @contextmenu.prevent) {{ t('app.adventure.innBack') }}
        span(class="gm-state" aria-live="polite") {{ tiltText }}
        button(type="button" class="gm-side" :class="{ on: control > 0 }" :disabled="between" @pointerdown.stop="press($event, 1)" @contextmenu.prevent) {{ t('app.adventure.innForward') }}
      AdvButton(v-if="(idle > IDLE_SECONDS || roundSlips >= 2) && !between && !helping" tone="gold" @click="helpMe") {{ t('app.adventure.innHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.innDone')" @next="emit('done', stars)")
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
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c08e
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))
  transition: left 50ms linear

.gm-bob, .gm-tilt
  display: block

// the man turns round his seat
.gm-tilt
  transform-origin: 50% 92%
  transition: transform 50ms linear

.gm-fig.walking .gm-bob
  animation: gm-step 460ms ease-in-out infinite

.gm-stone
  filter: drop-shadow(0 2px 2px rgba(50, 35, 10, 0.3))

.gm-mark
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-lean
  display: flex
  align-items: center
  justify-content: center
  gap: 10px

.gm-side
  min-width: 112px
  min-height: 56px
  padding: 8px 16px
  border-radius: 999px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1.05rem
  color: #4a3a18
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &.on
    background: #f3d98a

  &:disabled
    opacity: 0.5
    cursor: default

.gm-state
  min-width: 90px
  text-align: center
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
    translate: 0 -2.5%

@media (prefers-reduced-motion: reduce)
  .gm-fig.walking .gm-bob
    animation: none

  .gm-fig, .gm-tilt
    transition: none
</style>
