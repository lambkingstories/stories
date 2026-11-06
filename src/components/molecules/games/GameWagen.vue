<script setup lang="ts">
/**
 * Catch up with the chariot (Acts 8,29-30: "Go near, and join thyself to this chariot"). The desert road to Gaza from the side: two painted strips (the far hills and the near road side)
 * move to the left without end (each strip is laid normal, mirrored, normal, so that the painted seams meet), the chariot drives in the middle and falls back or pulls ahead with its speed. Philip runs on the road below; the child drags him left or right
 * (the arrow keys move him too). Beside the back of the chariot lies a soft light spot on the ground: the window, where he hears the man read. While Philip is in it, the scroll above
 * fills; outside it nothing fills (no mistake; after three seconds "Run to the chariot!"). In front of the horses: a cross and "Not in front of the horses!", Philip steps back, a mistake.
 * Round 1: an even, slow speed, full after 8 seconds at the window; round 2: the speed changes, full after 12 seconds. At the end the chariot stands and the man lets Philip come up.
 * "Help me" after fifteen seconds without a move takes Philip to the window. Less motion: the landscape stands still. Nothing is drawn. Stars: `osterStars(mistakes)`.
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
import { chariotClamp, chariotSpeedAt, chariotWagonX, chariotWhere, chariotZone } from '@/utils/pfingstenNeuB'
import type { ChariotGame } from '@/utils/pfingstenNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: ChariotGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const QUARTERS = 4
progress.setGoal(props.game.rounds.length * QUARTERS)

const TICK_MS = 50
const IDLE_SECONDS = 15
const OFF_MS = 3000
const BACK_MS = 1500
/** How fast Philip runs (percent of the field a second) and how fast the chariot moves to its new place. */
const RUN = 45
const EASE = 0.06
const KEY_STEP = 4
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const time = ref(0)
const wx = ref(chariotWagonX(props.game, 1))
const startX = () => chariotClamp(props.game, props.game.runnerW)
const x = ref(startX())
const target = ref(x.value)
const filled = ref(0)
const mistakes = ref(0)
const idle = ref(0)
const offMs = ref(0)
const back = ref(0)
const rear = ref(false)
const helping = ref(false)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const farOff = ref(0)
const nearOff = ref(0)
const frame = ref(0)
const message = ref('')
let messageSeq = 0
let credited = 0
let said = false
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const zone = computed(() => chariotZone(props.game, wx.value))
const where = computed(() => chariotWhere(props.game, wx.value, x.value))
const share = computed(() => Math.min(1, filled.value / current.value.fill))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  if (between.value) return
  const dt = TICK_MS
  idle.value += dt / 1000
  time.value += dt
  const v = chariotSpeedAt(current.value, time.value)
  wx.value += (chariotWagonX(props.game, v) - wx.value) * EASE
  if (!still) {
    // a strip is three pictures long (normal, mirrored, normal): the mirrored copy hides the seam, one turn is two pictures
    farOff.value = (farOff.value + v * 0.0027 * dt) % (200 / 3)
    nearOff.value = (nearOff.value + v * 0.0107 * dt) % (200 / 3)
    if (Math.floor(time.value / 200) !== Math.floor((time.value - dt) / 200)) frame.value = (frame.value + 1) % 2
  }
  // Philip runs toward the place of the finger
  const d = target.value - x.value
  const max = (RUN * dt) / 1000
  x.value = chariotClamp(props.game, x.value + Math.max(-max, Math.min(max, d)))
  if (back.value > 0) back.value -= dt
  const w = where.value
  if (w === 'zone') {
    offMs.value = 0
    said = false
    filled.value += dt
    const q = Math.min(QUARTERS, Math.floor(share.value * QUARTERS))
    while (credited < q) {
      progress.mark()
      credited++
    }
    if (filled.value >= current.value.fill) endRound()
    return
  }
  offMs.value += dt
  if (w === 'horses' && back.value <= 0) {
    mistakes.value++
    play('wrong')
    rear.value = true
    mark.value = 'bad'
    later(() => {
      rear.value = false
      mark.value = null
    }, 700)
    say(t('app.adventure.chariotHorses'), 2800)
    back.value = BACK_MS
    x.value = target.value = chariotClamp(props.game, zone.value.from - 3)
    return
  }
  if (offMs.value > OFF_MS && !said) {
    said = true
    say(t('app.adventure.chariotRun'), 2600)
  }
}
later(step, 600)

function endRound() {
  between.value = true
  helping.value = false
  mark.value = 'good'
  later(() => (mark.value = null), 900)
  later(() => play('right'), 200)
  say(t('app.adventure.chariotFull'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.chariotUp'), 0)
    }, 1400)
    later(() => {
      play('star')
      finished.value = true
    }, 4400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    time.value = 0
    filled.value = 0
    credited = 0
    offMs.value = 0
    said = false
    x.value = target.value = startX()
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger and the keys
function percentX(e: { clientX: number }): number | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return null
  return ((e.clientX - r.left) / r.width) * 100
}
function onMove(e: PointerEvent) {
  const p = percentX(e)
  if (p !== null) target.value = chariotClamp(props.game, p)
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', unlisten)
  window.removeEventListener('pointercancel', unlisten)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  helping.value = false
  onMove(e)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', unlisten)
  window.addEventListener('pointercancel', unlisten)
}
onBeforeUnmount(() => unlisten())
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  if (between.value || finished.value) return
  idle.value = 0
  helping.value = false
  target.value = chariotClamp(props.game, target.value + (e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP))
}

/** "Help me": Philip runs to the window, and the light spot is marked. */
function helpMe() {
  idle.value = 0
  helping.value = true
  target.value = chariotClamp(props.game, (zone.value.from + zone.value.to) / 2)
  say(t('app.adventure.chariotHelpSay'), 4000)
}

// ---- looks
const wagonPic = computed(() => props.game.wagon[frame.value % props.game.wagon.length] ?? props.game.wagon[0]!)
const runnerPic = computed(() => props.game.runner[frame.value % props.game.runner.length] ?? props.game.runner[0]!)
const pct = computed(() => Math.round(share.value * 100))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-scroll" role="img" :aria-label="t('app.adventure.chariotCount', { n: pct })")
        span(class="gm-scroll-pic")
          GameImage(:src="game.scroll" :ratio="3" colour="#e6d3a5" label="rolle")
        span(class="gm-scroll-pic open" :style="{ opacity: share }")
          GameImage(:src="game.scrollOpen" :ratio="3" colour="#f0e0b5" label="rolle-offen")
        span(class="gm-scroll-bar" :style="{ width: `${pct}%` }" aria-hidden="true")
      div(
        v-if="!ending"
        ref="field"
        class="gm-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.chariotField')"
        @pointerdown.prevent="down"
        @keydown="onKey"
      )
        div(class="gm-far" :style="{ transform: `translateX(-${farOff}%)` }" aria-hidden="true")
          span(v-for="k in 3" :key="`far-${k}`" class="gm-tile" :class="{ mirror: k === 2 }" :style="{ backgroundImage: `url(${src(game.far)})` }")
        div(class="gm-zone" :class="{ help: helping, in: where === 'zone' }" :style="{ left: `${zone.from}%`, width: `${zone.to - zone.from}%`, bottom: `${game.runnerY - 3}%` }" aria-hidden="true")
          GameImage(:src="game.zone" :ratio="3.75" colour="#f3d27a" label="zone")
        div(class="gm-wagon" :class="{ rear }" :style="{ left: `${wx}%`, width: `${game.wagonW}%`, bottom: `${game.wagonY}%` }" role="img" :aria-label="t('app.adventure.chariotWagon')")
          GameImage(:src="wagonPic" :ratio="1.75" colour="#a8814a" label="wagen")
        div(class="gm-near" :style="{ transform: `translateX(-${nearOff}%)` }" aria-hidden="true")
          span(v-for="k in 3" :key="`near-${k}`" class="gm-tile" :class="{ mirror: k === 2 }" :style="{ backgroundImage: `url(${src(game.near)})` }")
        div(
          class="gm-runner"
          :style="{ left: `${x}%`, width: `${game.runnerW}%`, bottom: `${game.runnerY}%` }"
          role="img"
          :aria-label="t(where === 'zone' ? 'app.adventure.chariotAtWindow' : 'app.adventure.chariotPhilip')"
          :data-where="where"
        )
          GameImage(:src="runnerPic" :ratio="0.6" colour="#c9b48a" label="philippus")
          span(v-if="mark" class="gm-mark")
            GameMark(:kind="mark")
      div(v-else class="gm-field gm-end" :style="{ backgroundImage: `url(${src(game.finale)})` }" role="img" :aria-label="t('app.adventure.chariotUp')")
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.chariotHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.chariotDone')" @next="emit('done', stars)")
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

// the scroll: shut, the open one fades in over it; a thin bar under it shows the same
.gm-scroll
  position: relative
  align-self: center
  width: min(60%, 260px)
  padding-bottom: 8px

.gm-scroll-pic
  display: block

  &.open
    position: absolute
    left: 0
    top: 0
    width: 100%

.gm-scroll-bar
  position: absolute
  left: 0
  bottom: 0
  height: 6px
  border-radius: 3px
  background: #8a5a2a

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c49a
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-end
  background-size: cover
  background-position: center
  cursor: default

// the far hills: three copies of a picture that is twice as wide as the field (3:1), the middle one mirrored so that the seams meet
.gm-far, .gm-near
  position: absolute
  left: 0
  display: flex

.gm-far
  top: 0
  width: 600%
  height: 100%

// the near road side: a strip below, seven times as wide as high
.gm-near
  bottom: 0
  width: 420%
  height: 30%
  pointer-events: none
  z-index: 2

.gm-tile
  flex: 1 1 0
  display: block
  background-size: 100% 100%
  background-repeat: no-repeat

  &.mirror
    transform: scaleX(-1)

.gm-zone
  position: absolute
  display: block
  z-index: 3
  pointer-events: none
  opacity: 0.8

  &.in
    opacity: 1

  &.help
    outline: 4px dashed #fff6dc
    outline-offset: 2px
    border-radius: 50%

.gm-wagon
  position: absolute
  display: block
  z-index: 1
  pointer-events: none
  transform-origin: 30% 100%

  &.rear
    animation: gm-rear 600ms ease-in-out

.gm-runner
  position: absolute
  display: block
  transform: translateX(-50%)
  z-index: 4
  pointer-events: none
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

.gm-mark
  position: absolute
  top: -12px
  right: -20px
  display: block

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

@keyframes gm-rear
  0%, 100%
    transform: rotate(0deg)
  40%
    transform: rotate(-2deg)

.still .gm-wagon.rear
  animation: none

@media (prefers-reduced-motion: reduce)
  .gm-wagon.rear
    animation: none
</style>
