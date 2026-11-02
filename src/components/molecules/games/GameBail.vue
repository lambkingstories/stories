<script setup lang="ts">
/**
 * Bail out the boat (Mark 4,37): a great storm throws the waves into the boat. We look into the boat from above; blue puddles lie on the planks. A tap on a puddle scoops one cup of it overboard; it gets smaller and is gone after
 * three scoops. Every few seconds a new wave splashes over the side and leaves a new puddle (never more than four at once). Round 1: five puddles, a wave every five seconds; round 2: seven puddles, a wave every four.
 * A mistake is only this: four puddles lie in the boat at the same time (once a round, a cross, a word, a dull sound). The remaining scoops of a puddle are shown by dots, not only by its size. After fifteen seconds without a tap
 * the button "Help me bail" scoops for the child. The arithmetic is in `utils/wunderGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { bailDone, bailHelpTarget, bailScale, bailStart, bailTap, bailTick } from '@/utils/wunderGames'
import type { BailState } from '@/utils/wunderGames'
import { seeded } from '@/utils/jakobGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BailGame } from '@/types/adventure'

const props = defineProps<{ game: BailGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every puddle of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.total, 0))

const TICK = 0.1
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const rule = computed(() => ({ total: current.value.total, every: current.value.every }))
const spots = computed(() => props.game.spots)
let rand = seeded(17)
const state = ref<BailState>(bailStart(rule.value, spots.value.length, rand))
const cups = ref<{ id: number; x: number; y: number }[]>([])
let cupSeq = 0
const hitId = ref<number | null>(null)
const floodMark = ref(false)
const misses = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 0, 1))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const kindOf = (spot: number) => props.game.puddles[spot % props.game.puddles.length]!

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  rand = seeded(17 + round.value * 31)
  state.value = bailStart(rule.value, spots.value.length, rand)
  idle.value = 0
}

function tick() {
  if (finished.value || between.value) return
  idle.value += TICK
  const before = state.value.puddles.length
  const wasFlooded = state.value.flooded
  state.value = bailTick(state.value, TICK, rule.value, spots.value.length, rand)
  if (state.value.puddles.length > before) {
    play('tap')
    say(t('app.adventure.bailWave'), 1800)
  }
  if (state.value.flooded && !wasFlooded) {
    misses.value++
    play('wrong')
    say(t('app.adventure.bailFlood'))
    floodMark.value = true
    later(() => {
      floodMark.value = false
    }, 1200)
  }
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

function scoop(id: number) {
  if (between.value || finished.value) return
  const p = state.value.puddles.find((x) => x.id === id)
  const spot = p ? spots.value[p.spot] : undefined
  if (!p || !spot) return
  idle.value = 0
  const r = bailTap(state.value, id)
  state.value = r.state
  const cupId = ++cupSeq
  cups.value.push({ id: cupId, x: spot.x, y: spot.y })
  later(() => {
    cups.value = cups.value.filter((c) => c.id !== cupId)
  }, 800)
  hitId.value = id
  later(() => {
    if (hitId.value === id) hitId.value = null
  }, 300)
  if (r.gone) {
    progress.mark()
    play('right')
  } else {
    play('snap')
  }
  if (!bailDone(state.value, rule.value)) return
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 900)
    return
  }
  say(t('app.adventure.gameNext'), 0)
  later(() => {
    round.value++
    startRound()
    between.value = false
    message.value = ''
  }, 1800)
}

/** The button for those who cannot aim: the smallest puddle gets one scoop. */
function helpMe() {
  const id = bailHelpTarget(state.value)
  if (id >= 0) scoop(id)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.bailField')"
      )
        button(
          v-for="p in state.puddles"
          :key="p.id"
          type="button"
          class="gm-puddle"
          :class="{ hit: hitId === p.id }"
          :style="{ left: `${spots[p.spot]?.x ?? 50}%`, top: `${spots[p.spot]?.y ?? 50}%`, width: `${kindOf(p.spot).w}%` }"
          :aria-label="t('app.adventure.bailPuddle', { n: p.size })"
          :disabled="between"
          @click="scoop(p.id)"
        )
          span(class="gm-art" :style="{ transform: `scale(${bailScale(p.size)})` }")
            GameImage(:src="kindOf(p.spot).image" :ratio="1.4" colour="#5b9fd0" round :label="kindOf(p.spot).id")
          span(class="gm-pips" aria-hidden="true") {{ '●'.repeat(p.size) }}
        span(
          v-for="c in cups"
          :key="c.id"
          class="gm-cup"
          :style="{ left: `${c.x}%`, top: `${c.y}%`, width: `${game.cup.w}%` }"
          aria-hidden="true"
        )
          GameImage(:src="game.cup.image" :ratio="1" colour="#a9803f" round label="becher")
        span(v-if="floodMark" class="gm-cross" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.bailCount', { n: doneCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.bailHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.bailDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #d3dde3
  box-shadow: inset 0 0 18px rgba(20, 50, 70, 0.25)
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
  color: #3f5560

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f5560

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a6a43
  background-size: cover
  background-position: center

// a puddle: the button keeps its size (at least 56 pixels), the picture inside gets smaller with every scoop
.gm-puddle
  position: absolute
  display: block
  min-width: 56px
  min-height: 48px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 3
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &.hit .gm-art
    filter: brightness(1.2)

.gm-art
  display: block
  transition: transform 260ms ease-out, filter 200ms ease
  filter: drop-shadow(0 2px 3px rgba(10, 30, 50, 0.4))

// the scoops that are left, as dots (the size of the puddle is not the only sign)
.gm-pips
  position: absolute
  left: 50%
  bottom: -2px
  transform: translateX(-50%)
  font-size: 0.7rem
  line-height: 1
  letter-spacing: 2px
  color: #fff6dc
  text-shadow: 0 1px 2px rgba(20, 30, 40, 0.9)
  pointer-events: none

// the cup flies over the side
.gm-cup
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 5
  animation: gm-fling 780ms ease-in forwards

.gm-cross
  position: absolute
  left: 50%
  top: 12%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #3f5560

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #2d3f46
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-fling
  0%
    opacity: 1
    translate: 0 0
    rotate: 0deg
  100%
    opacity: 0
    translate: 90px -70px
    rotate: 70deg

@media (prefers-reduced-motion: reduce)
  .gm-art
    transition: none

  .gm-cup
    animation: none
    opacity: 0
</style>
