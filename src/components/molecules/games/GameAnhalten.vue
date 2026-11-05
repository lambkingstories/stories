<script setup lang="ts">
/**
 * "Stop!" (Luke 10,33-34). The road from Jerusalem down to Jericho, seen from the side. The Samaritan rides his donkey from the left; on the right the man who was robbed sits by the road.
 * Holding the finger down (on the field or on the big button; Space, Enter or the right arrow key) lets the donkey walk and get faster; letting go lets it slow down and stand.
 * It is to stand right beside the man. Too early: it may walk on (no mistake). Past him: a mistake (a cross and "Too far!"), the Samaritan turns and comes back a piece.
 * At the right place the Samaritan gets down and kneels by the man, on his other side, so that they look at each other (a tick). Round 2: the donkey is quicker and walks on farther, the place is narrower.
 * The button "Help me" comes after fifteen seconds and rides to the right place by itself. With reduced motion the donkey does not sway.
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
import { haltAutoHeld, haltBackTo, haltKneel, haltStart, haltStep } from '@/utils/gleichnisseNeu'
import type { HaltGame, HaltState } from '@/utils/gleichnisseNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: HaltGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK = 0.05
const IDLE_SECONDS = 15
/** how fast he rides back after riding past the man (percent a second) */
const BACK_SPEED = 22

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<HaltState>(haltStart(current.value))
const held = ref(false)
const auto = ref(false)
const back = ref<number | null>(null)
const mark = ref<'good' | 'bad' | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function good() {
  progress.mark()
  between.value = true
  held.value = false
  auto.value = false
  mark.value = 'good'
  play('right')
  later(() => play('bead'), 160)
  say(t('app.adventure.haltGood'), 0)
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
    st.value = haltStart(current.value)
    mark.value = null
    back.value = null
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3000)
}

function loop() {
  if (!finished.value && !between.value) {
    if (back.value !== null) {
      // after riding past: he turns and rides back a piece
      const x = Math.max(back.value, st.value.x - BACK_SPEED * TICK)
      st.value = { ...st.value, x, v: 0 }
      if (x <= back.value + 1e-9) {
        back.value = null
        mark.value = null
        say(t('app.adventure.haltAgain'), 2600)
      }
    } else {
      const press = auto.value ? haltAutoHeld(current.value, st.value) : held.value
      const res = haltStep(props.game, current.value, st.value, press, TICK)
      st.value = res.state
      if (res.event === 'stopped-good') good()
      else if (res.event === 'stopped-early') {
        auto.value = false
        say(t('app.adventure.haltEarly'), 2600)
      } else if (res.event === 'stopped-late') {
        auto.value = false
        held.value = false
        mistakes.value++
        mark.value = 'bad'
        play('wrong')
        say(t('app.adventure.haltLate'), 2800)
        later(() => {
          if (!between.value) back.value = haltBackTo(current.value)
        }, 900)
      }
      if (!held.value && !auto.value) idle.value += TICK
      else idle.value = 0
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

// ---- the finger (or a key) holds the reins
function press(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value || back.value !== null) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  auto.value = false
  held.value = true
  idle.value = 0
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
}
function release() {
  held.value = false
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
}
onBeforeUnmount(() => release())
const RIDE_KEYS = [' ', 'Enter', 'ArrowRight']
function keyDown(e: KeyboardEvent) {
  if (!RIDE_KEYS.includes(e.key)) return
  e.preventDefault()
  if (finished.value || between.value || back.value !== null) return
  auto.value = false
  held.value = true
  idle.value = 0
}
function keyUp(e: KeyboardEvent) {
  if (!RIDE_KEYS.includes(e.key)) return
  e.preventDefault()
  held.value = false
}

function helpMe() {
  idle.value = 0
  held.value = false
  auto.value = true
  say(t('app.adventure.haltHelping'), 3200)
}

// ---- looks
const g = computed(() => props.game)
const foot = computed(() => `${g.value.road}%`)
const riderStyle = computed(() => ({ left: `${st.value.x}%`, top: foot.value, width: `${g.value.rider.w}%` }))
const manStyle = computed(() => ({ left: `${current.value.man}%`, top: foot.value, width: `${g.value.man.w}%` }))
const donkeyStyle = computed(() => ({ left: `${st.value.x - g.value.rider.w * 0.08}%`, top: foot.value, width: `${g.value.donkey.w}%` }))
const kneelStyle = computed(() => ({ left: `${haltKneel(g.value, current.value)}%`, top: foot.value, width: `${g.value.kneel.w}%` }))
const facing = computed(() => (back.value !== null ? -1 : 1))
const riding = computed(() => st.value.v > 0.3 || back.value !== null)
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
        :aria-label="t('app.adventure.haltField')"
        @pointerdown="press"
        @keydown="keyDown"
        @keyup="keyUp"
        @contextmenu.prevent
      )
        div(class="gm-fig" :style="manStyle" role="img" :aria-label="game.man.label")
          GameImage(:src="game.man.image" :ratio="1" colour="#8a6a4a" :label="game.man.label")
        template(v-if="st.stopped")
          div(class="gm-fig" :style="donkeyStyle" role="img" :aria-label="game.donkey.label")
            GameImage(:src="game.donkey.image" :ratio="1" colour="#9a9a9a" :label="game.donkey.label")
          div(class="gm-fig" :style="kneelStyle" role="img" :aria-label="game.kneel.label")
            GameImage(:src="game.kneel.image" :ratio="1" colour="#a0703a" :label="game.kneel.label")
        div(v-else class="gm-fig gm-rider" :class="{ riding }" :style="riderStyle" role="img" :aria-label="game.rider.label")
          span(class="gm-flip" :style="{ transform: `scaleX(${facing})` }")
            GameImage(:src="game.rider.image" :ratio="1" colour="#a0703a" :label="game.rider.label")
          span(v-if="mark" class="gm-mark")
            GameMark(:kind="mark")
        span(v-if="st.stopped && mark" class="gm-mark gm-mark-man" :style="{ left: `${current.man}%`, top: `calc(${foot} - 12%)` }")
          GameMark(:kind="mark")
      button(
        type="button"
        class="gm-reins"
        :class="{ on: held }"
        :disabled="between || back !== null"
        @pointerdown="press"
        @contextmenu.prevent
      ) {{ held ? t('app.adventure.haltRiding') : t('app.adventure.haltHold') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !auto" tone="gold" @click="helpMe") {{ t('app.adventure.haltHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.haltDone')" @next="emit('done', stars)")
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

// every figure stands on its foot (x is its middle)
.gm-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))

.gm-flip
  display: block

.gm-rider.riding .gm-flip
  animation: gm-step 420ms ease-in-out infinite

.gm-mark
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-mark-man
  margin: -15px 0 0 -15px

// the reins: a big button that is held down
.gm-reins
  align-self: center
  min-width: 220px
  min-height: 56px
  padding: 8px 22px
  border-radius: 999px
  border: 3px solid #b8892a
  background: #fff6dc
  font-weight: 900
  font-size: 1.1rem
  color: #4a3a18
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

  &.on
    background: #f3d98a

  &:disabled
    opacity: 0.5
    cursor: default

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

@media (prefers-reduced-motion: reduce)
  .gm-rider.riding .gm-flip
    animation: none
</style>
