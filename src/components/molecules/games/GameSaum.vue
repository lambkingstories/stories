<script setup lang="ts">
/**
 * "The hem" (Mark 5,25-34). A lane in Capernaum seen from the side: Jesus walks through the crowd from the left to the right; a woman of the crowd stands bent forward at the side of his way (nearer to us) and stretches out her hand behind him.
 * The child taps the tassels of the hem of his mantle (or presses Enter or Space) exactly while they pass her fingers: then she touches the hem, Jesus stops and turns round (a tick).
 * Tapping the hem too early or too late, or tapping beside it, is a mistake (a cross and words); somebody of the crowd walking in front of the hem only hides it (no mistake, wait a moment).
 * When Jesus has walked past, he comes again after a short pause (no mistake). Round 1 is slow and shows a ring where her fingers are; round 2 is quicker, the moment is shorter and more people
 * walk in front. The button "Help me" comes after fifteen seconds: at the next good moment she touches the hem by herself. With reduced motion nothing sways or shakes.
 * The arithmetic is `utils/wunderNeu.ts`; stars: `osterStars(mistakes)`.
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
import { saumCycle, saumHelpAt, saumHem, saumJesusX, saumTap, saumWalkerX } from '@/utils/wunderNeu'
import type { Pt, SaumGame, SaumVerdict } from '@/utils/wunderNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SaumGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK = 0.05
const IDLE_SECONDS = 15
/** A tap beside the hem counts once in this time (a quick double tap is one mistake). */
const MISS_PAUSE = 0.6

const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** Seconds since the round began; after the touch the picture stands still at `stopAt`. */
const clock = ref(0)
const stopAt = ref<number | null>(null)
const helpAt = ref<number | null>(null)
const mistakes = ref(0)
const touched = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const mark = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
const field = ref<HTMLElement | null>(null)
let messageSeq = 0
let markSeq = 0
let lastMiss = -10
let pass = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function showMark(p: Pt, kind: 'good' | 'bad', ms = 1300) {
  const id = ++markSeq
  mark.value = { ...p, kind }
  if (ms > 0)
    later(() => {
      if (markSeq === id) mark.value = null
    }, ms)
}

const time = computed(() => stopAt.value ?? clock.value)

function success(byHelp: boolean) {
  const hem = saumHem(props.game, current.value, clock.value)
  stopAt.value = clock.value
  helpAt.value = null
  between.value = true
  touched.value++
  progress.mark()
  play('right')
  later(() => play('bead'), 160)
  if (hem) showMark(hem, 'good', 0)
  say(t(byHelp ? 'app.adventure.hemTouchHelped' : 'app.adventure.hemTouchGood'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1800)
  later(() => {
    round.value++
    clock.value = 0
    stopAt.value = null
    pass = 0
    lastMiss = -10
    mark.value = null
    idle.value = 0
    between.value = false
    message.value = ''
  }, 3200)
}

function loop() {
  if (!finished.value && !between.value) {
    clock.value += TICK
    const p = Math.floor(clock.value / saumCycle(current.value))
    if (p > pass) {
      pass = p
      say(t('app.adventure.hemTouchAgain'), 2600)
    }
    if (helpAt.value !== null && clock.value >= helpAt.value - 1e-9) success(true)
    else if (helpAt.value === null) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function judge(v: SaumVerdict, at: Pt | null) {
  if (v === 'touch') return success(false)
  if (v === 'wait') return say(t('app.adventure.hemTouchWait'), 2200)
  if (v === 'covered') return say(t('app.adventure.hemTouchCovered'), 2400)
  if (v === 'miss' && clock.value - lastMiss < MISS_PAUSE) return
  if (v === 'miss') lastMiss = clock.value
  mistakes.value++
  play('wrong')
  const hem = saumHem(props.game, current.value, clock.value)
  const where = at ?? hem
  if (where) showMark(where, 'bad')
  say(t(v === 'early' ? 'app.adventure.hemTouchEarly' : v === 'late' ? 'app.adventure.hemTouchLate' : 'app.adventure.hemTouchMiss'), 2800)
}

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function tap(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  helpAt.value = null
  judge(saumTap(props.game, current.value, clock.value, p), p)
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  if (finished.value || between.value) return
  idle.value = 0
  helpAt.value = null
  judge(saumTap(props.game, current.value, clock.value, null), null)
}

function helpMe() {
  idle.value = 0
  helpAt.value = saumHelpAt(props.game, current.value, clock.value)
  say(t('app.adventure.hemTouchHelping'), 3600)
}

// ---- looks
const g = computed(() => props.game)
const jesusX = computed(() => saumJesusX(g.value, current.value, time.value))
const hem = computed(() => saumHem(g.value, current.value, time.value))
const z = (y: number) => Math.round(y * 10) + 10
const jesusStyle = computed(() => ({ left: `${jesusX.value ?? -50}%`, top: `${g.value.road}%`, width: `${g.value.jesus.w}%`, zIndex: z(g.value.road) }))
const womanStyle = computed(() => ({ left: `${g.value.woman.x}%`, top: `${g.value.woman.y}%`, width: `${g.value.woman.w}%`, zIndex: z(g.value.woman.y) }))
const walkers = computed(() =>
  current.value.walkers
    .map((wk, k) => {
      const x = saumWalkerX(current.value, wk, time.value)
      const s = g.value.people[wk.person]
      if (x === null || !s) return null
      return { k, s, flip: wk.to < wk.from, style: { left: `${x}%`, top: `${wk.lane}%`, width: `${s.w}%`, zIndex: z(wk.lane) + 1 } }
    })
    .filter((v): v is NonNullable<typeof v> => !!v)
)
const ringStyle = computed(() => ({ left: `${g.value.touch.x}%`, top: `${g.value.touch.y}%`, width: `${current.value.reach * 2}%`, height: `${current.value.reach * 2 * ratio.value}%` }))
const hemRingStyle = computed(() => ({ left: `${hem.value?.x ?? -50}%`, top: `${hem.value?.y ?? -50}%`, width: `${current.value.hemR * 2}%`, height: `${current.value.hemR * 2 * ratio.value}%` }))
const markStyle = computed(() => ({ left: `${mark.value?.x ?? 0}%`, top: `${mark.value?.y ?? 0}%` }))
const jesusRatio = computed(() => g.value.jesus.aspect ?? 1)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ aspectRatio: String(ratio), backgroundImage: `url(${prependBaseUrl(game.background)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.hemTouchField')"
        @pointerdown="tap"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(class="gm-fig gm-woman" :style="womanStyle" role="img" :aria-label="game.woman.label")
          GameImage(:src="game.woman.image" :ratio="1 / (game.woman.aspect ?? 1)" colour="#8d7a64" :label="game.woman.label")
        div(v-if="jesusX !== null" class="gm-fig gm-jesus" :class="{ walking: stopAt === null && !between, turned: stopAt !== null }" :style="jesusStyle" role="img" :aria-label="game.jesus.label")
          span(class="gm-bob")
            GameImage(:src="game.jesus.image" :ratio="1 / jesusRatio" colour="#a2563a" :label="game.jesus.label")
        div(v-for="wk in walkers" :key="`w-${round}-${wk.k}`" class="gm-fig gm-walker walking" :style="wk.style" role="img" :aria-label="wk.s.label")
          span(class="gm-bob" :style="{ transform: wk.flip ? 'scaleX(-1)' : undefined }")
            GameImage(:src="wk.s.image" :ratio="1 / (wk.s.aspect ?? 1)" colour="#7d6a52" :label="wk.s.label")
        div(v-if="current.ring && !between" class="gm-ring" :style="ringStyle" aria-hidden="true")
        div(v-if="helpAt !== null && hem" class="gm-ring gm-hemring" :style="hemRingStyle" aria-hidden="true")
        span(v-if="mark" class="gm-mark" :style="markStyle")
          GameMark(:kind="mark.kind")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.hemTouchCount', { n: touched, total: game.rounds.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpAt === null" tone="gold" @click="helpMe") {{ t('app.adventure.hemTouchHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hemTouchDone')" @next="emit('done', stars)")
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
  background-color: #b8a98a
  background-size: 100% 100%
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

.gm-jesus, .gm-walker
  transition: left 50ms linear

.gm-bob
  display: block

.gm-jesus.walking .gm-bob, .gm-walker.walking .gm-bob
  animation: gm-step 620ms ease-in-out infinite

// he stops and turns round to the crowd (Mark 5,30)
.gm-jesus.turned .gm-bob
  transform: scaleX(-1)

// where her fingers reach (round 1) and, with the help, round the hem: rings of the screen, not part of the picture
.gm-ring
  position: absolute
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(255, 246, 220, 0.14)
  pointer-events: none
  z-index: 3000

.gm-hemring
  border-style: solid
  border-color: #fff6dc
  animation: gm-pulse 900ms ease-in-out infinite

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3001

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
    translate: 0 -2%

@keyframes gm-pulse
  0%, 100%
    scale: 1
  50%
    scale: 1.12

// less motion: nothing bobs, glides or pulses
@media (prefers-reduced-motion: reduce)
  .gm-jesus.walking .gm-bob, .gm-walker.walking .gm-bob, .gm-hemring
    animation: none

  .gm-jesus, .gm-walker
    transition: none
</style>
