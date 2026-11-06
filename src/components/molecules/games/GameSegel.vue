<script setup lang="ts">
/**
 * Set the sail (Acts 13,4: "they departed unto Seleucia; and from thence they sailed to Cyprus"). The sea from above at a slant moves past (a seamless picture, normal, mirrored, normal),
 * in the middle the ship with Barnabas, Saul and John on deck; the sail is its own picture and turns round the mast. A pennant shows where the wind blows; before the wind changes
 * it turns slowly for a second, so that one sees it coming. The child turns the sail (dragging round the mast, the two buttons, or the left and right arrow keys in steps):
 * at the angle of the wind the sail is full and the ship goes fast, a little off it is half full and slow, far off it hangs slack and the ship hardly moves.
 * When it stays slack for more than three seconds: a cross and "The wind has turned!", a mistake (once for every wind). The strip of the sea chart above shows the little ship between Seleucia and Cyprus.
 * Round 1: three changes of the wind; round 2: five, and two gusts (the pennant flutters, nothing has to be turned, turning anyway is no mistake). At the end the ship comes into the harbour of Salamis.
 * "Help me" after fifteen seconds shows at the mast which way to turn. Less motion: the sea and the waves stand still. Nothing is drawn; the app only turns and moves pictures. Stars: `osterStars(mistakes)`.
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
import { sailKey, sailPennantAt, sailPointer, sailSpeed, sailState, sailTurnTo, sailWindAt, sailWindIndex } from '@/utils/paulusNeuA'
import type { SailGame } from '@/utils/paulusNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SailGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const QUARTERS = 4
progress.setGoal(props.game.rounds.length * QUARTERS)

const TICK_MS = 50
const IDLE_SECONDS = 15
const GUST_MS = 1500
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const time = ref(0)
const angle = ref(sailWindAt(current.value, 0))
const dist = ref(0)
const slackMs = ref(0)
/** The winds for which a slack sail has already counted as a mistake. */
let counted = new Set<number>()
let credited = 0
let gustSaid = new Set<number>()
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const seaOff = ref(0)
const message = ref('')
let messageSeq = 0
const ship = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const wind = computed(() => sailWindAt(current.value, time.value))
const state = computed(() => sailState(props.game, angle.value, wind.value))
const share = computed(() => Math.min(1, dist.value / current.value.duration))
const gust = computed(() => current.value.gusts.some((g) => time.value >= g && time.value < g + GUST_MS))

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

function loop() {
  if (finished.value) return
  later(loop, TICK_MS)
  if (between.value) return
  idle.value += TICK_MS / 1000
  time.value += TICK_MS
  const v = sailSpeed(state.value)
  dist.value += v * TICK_MS
  if (!still) seaOff.value = (seaOff.value + v * 0.004 * TICK_MS) % (200 / 3)
  if (state.value === 'full') helping.value = false
  // a slack sail for too long: one mistake for this wind
  if (state.value === 'slack') {
    slackMs.value += TICK_MS
    const k = sailWindIndex(current.value, time.value)
    if (slackMs.value >= props.game.slackMs && !counted.has(k)) {
      counted.add(k)
      mistakes.value++
      play('wrong')
      flash('bad')
      say(t('app.adventure.sailTrimTurned'), 2800)
    }
  } else slackMs.value = 0
  current.value.gusts.forEach((g, k) => {
    if (time.value >= g && !gustSaid.has(k)) {
      gustSaid.add(k)
      say(t('app.adventure.sailTrimGust'), 2200)
    }
  })
  const q = Math.min(QUARTERS, Math.floor(share.value * QUARTERS))
  while (credited < q) {
    progress.mark()
    credited++
  }
  if (share.value >= 1) arrive()
}
later(loop, TICK_MS)

function arrive() {
  between.value = true
  helping.value = false
  flash('good')
  play('right')
  say(t('app.adventure.sailTrimArrived'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.sailTrimHarbour'), 0)
    }, 1400)
    later(() => {
      play('star')
      finished.value = true
    }, 4600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    time.value = 0
    dist.value = 0
    slackMs.value = 0
    counted = new Set()
    gustSaid = new Set()
    credited = 0
    angle.value = sailWindAt(current.value, 0)
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- turning: the finger round the mast, the buttons, the keys
function turnBy(steps: number) {
  if (between.value || finished.value) return
  idle.value = 0
  angle.value = sailKey(angle.value, steps, props.game.keyStep)
}
function aim(e: { clientX: number; clientY: number }) {
  const r = ship.value?.getBoundingClientRect()
  if (!r || !r.width) return
  const mx = r.left + (r.width * props.game.mast.x) / 100
  const my = r.top + (r.height * props.game.mast.y) / 100
  if (Math.hypot(e.clientX - mx, e.clientY - my) < 4) return
  angle.value = sailPointer(mx, my, e.clientX, e.clientY)
}
function onMove(e: PointerEvent) {
  aim(e)
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', unlisten)
  window.removeEventListener('pointercancel', unlisten)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  aim(e)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', unlisten)
  window.addEventListener('pointercancel', unlisten)
}
onBeforeUnmount(() => unlisten())
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  turnBy(e.key === 'ArrowRight' ? 1 : -1)
}

/** "Help me": a sign at the mast says which way to turn. */
const turnWay = computed(() => (sailTurnTo(angle.value, wind.value) >= 0 ? 'right' : 'left'))
function helpMe() {
  idle.value = 0
  helping.value = true
  say(t(turnWay.value === 'right' ? 'app.adventure.sailTrimHelpRight' : 'app.adventure.sailTrimHelpLeft'), 4000)
}

// ---- looks
const sailPic = computed(() => (state.value === 'full' ? props.game.sails.full : state.value === 'half' ? props.game.sails.half : props.game.sails.slack))
const stateWord = computed(() => t(state.value === 'full' ? 'app.adventure.sailTrimFull' : state.value === 'half' ? 'app.adventure.sailTrimHalf' : 'app.adventure.sailTrimSlack'))
const pennant = computed(() => sailPennantAt(current.value, time.value, props.game.warnMs))
const pct = computed(() => Math.round(share.value * 100))
/** The sail: its ring lies on the top of the mast, it turns about the ring. */
const sailStyle = computed(() => ({
  left: `${props.game.mast.x - (props.game.sailW * props.game.sailRing.x) / 100}%`,
  top: `${props.game.mast.y - (props.game.sailW * props.game.sailRing.y) / 100}%`,
  width: `${props.game.sailW}%`,
  transform: `rotate(${angle.value + props.game.sailTurn}deg)`,
  transformOrigin: `${props.game.sailRing.x}% ${props.game.sailRing.y}%`
}))
/** Three wave crests drift with the wind (only to show it; they stand still with less motion). */
const waves = computed(() => {
  const rad = (wind.value * Math.PI) / 180
  const s = still ? 0 : time.value / 1000
  return [0, 1, 2].map((k) => ({
    key: k,
    x: ((((18 + k * 31 + Math.sin(rad) * s * 6) % 100) + 100) % 100),
    y: ((((22 + k * 27 - Math.cos(rad) * s * 6) % 90) + 90) % 90) + 5
  }))
})
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-chart" role="img" :aria-label="t('app.adventure.sailTrimChart', { n: pct })")
        GameImage(:src="game.strip" :ratio="900 / 120" colour="#d9c79a" label="leiste")
        span(class="gm-mini" :style="{ left: `${6 + pct * 0.88}%` }" aria-hidden="true")
          GameImage(:src="game.shipMini" :ratio="1" colour="#8a6a4a" label="schiffchen")
      div(
        v-if="!ending"
        class="gm-field"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.sailTrimField')"
        @pointerdown.prevent="down"
        @keydown="onKey"
      )
        div(class="gm-sea" :style="{ transform: `translateX(-${seaOff}%)` }" aria-hidden="true")
          span(v-for="k in 3" :key="`sea-${k}`" class="gm-tile" :class="{ mirror: k === 2 }" :style="{ backgroundImage: `url(${src(game.sea)})` }")
        span(v-for="w in waves" :key="`wave-${w.key}`" class="gm-wave" :style="{ left: `${w.x}%`, top: `${w.y}%` }" aria-hidden="true")
          GameImage(:src="game.wave" :ratio="3" colour="#e8f0f0" label="welle")
        span(class="gm-gull" :style="{ transform: `rotate(${wind}deg)` }" aria-hidden="true")
          GameImage(:src="game.gull" :ratio="80 / 60" colour="#f0f0f0" label="moewe")
        div(ref="ship" class="gm-ship" :style="{ width: `${game.shipW}%` }" :data-state="state")
          GameImage(:src="game.ship" :ratio="1" colour="#a8814a" label="schiff")
          span(class="gm-sail" :style="sailStyle" role="img" :aria-label="stateWord" :data-angle="Math.round(angle)")
            GameImage(:src="sailPic" :ratio="1" colour="transparent" label="segel")
          span(v-if="helping" class="gm-way" :style="{ left: `${game.mast.x}%`, top: `${game.mast.y}%` }") {{ turnWay === 'right' ? '↻' : '↺' }} {{ t(turnWay === 'right' ? 'app.adventure.sailTrimRight' : 'app.adventure.sailTrimLeft') }}
          span(v-if="mark" class="gm-mark")
            GameMark(:kind="mark")
        div(class="gm-wind" :class="{ gust }" role="img" :aria-label="t('app.adventure.sailTrimWind')")
          span(class="gm-pennant" :style="{ transform: `rotate(${pennant + game.pennantTurn}deg)` }")
            GameImage(:src="game.pennant" :ratio="2" colour="#c0503a" label="wimpel")
      div(v-else class="gm-field gm-end" :style="{ backgroundImage: `url(${src(game.finale)})` }" role="img" :aria-label="t('app.adventure.sailTrimHarbour')")
      div(v-if="!ending" class="gm-buttons")
        AdvButton(tone="blau" :disabled="between" @click="turnBy(-1)") ↺ {{ t('app.adventure.sailTrimLeft') }}
        AdvButton(tone="blau" :disabled="between" @click="turnBy(1)") ↻ {{ t('app.adventure.sailTrimRight') }}
      p(v-if="!ending" class="gm-state" :data-state="state") {{ stateWord }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping" tone="gold" @click="helpMe") {{ t('app.adventure.sailTrimHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sailTrimDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #dfe8e6
  box-shadow: inset 0 0 18px rgba(20, 50, 60, 0.25)
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
  color: #3f4f55

.gm-chart
  position: relative
  align-self: center
  width: min(90%, 420px)

.gm-mini
  position: absolute
  top: 50%
  width: 9%
  transform: translate(-50%, -50%)
  transition: left 300ms linear

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6fa3b0
  touch-action: none
  cursor: grab

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-end
  background-size: cover
  background-position: center
  cursor: default

.gm-sea
  position: absolute
  left: 0
  top: 0
  width: 600%
  height: 100%
  display: flex

.gm-tile
  flex: 1 1 0
  display: block
  background-size: 100% 100%
  background-repeat: no-repeat

  &.mirror
    transform: scaleX(-1)

.gm-wave
  position: absolute
  width: 9%
  pointer-events: none
  opacity: 0.85

.gm-gull
  position: absolute
  right: 8%
  top: 8%
  width: 7%
  pointer-events: none

.gm-ship
  position: absolute
  left: 50%
  top: 54%
  transform: translate(-50%, -50%)
  z-index: 2
  pointer-events: none

.gm-sail
  position: absolute
  display: block
  transition: transform 120ms linear

.still .gm-sail
  transition: none

.gm-way
  position: absolute
  transform: translate(-50%, -140%)
  padding: 2px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.96)
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  white-space: nowrap

.gm-mark
  position: absolute
  top: 0
  right: -10px
  display: block

.gm-wind
  position: absolute
  left: 3%
  top: 4%
  width: 16%
  aspect-ratio: 1
  display: flex
  align-items: center
  justify-content: center
  border-radius: 50%
  background: rgba(255, 246, 220, 0.85)
  z-index: 3

  &.gust .gm-pennant
    animation: gm-flutter 220ms ease-in-out infinite

.gm-pennant
  display: block
  width: 80%
  transition: transform 200ms linear

.gm-buttons
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

.gm-state
  margin: 0
  align-self: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b

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

@keyframes gm-flutter
  0%, 100%
    margin-top: 0
  50%
    margin-top: 4px

.still .gm-wind.gust .gm-pennant
  animation: none

@media (prefers-reduced-motion: reduce)
  .gm-wind.gust .gm-pennant, .gm-sail, .gm-pennant
    animation: none
    transition: none
</style>
