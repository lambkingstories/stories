<script setup lang="ts">
/**
 * Share the bread (Mark 6,39-43): Jesus has the people sit down in groups on the green grass, takes five loaves and two fish, gives thanks and has the disciples hand them out. Round 1: five groups of hungry people sit on the meadow; a
 * tap on a group sends a disciple from the basket to it with bread and fish, and the group is full (a tick; the basket stays full: that is the miracle). Round 2: twelve baskets with the leftovers lie in the grass; a tap picks one up
 * and counts it (n of 12). There is no real mistake: only a tap on a group that is full already counts, gently (three of them are free; the stars come from `breadStars`). After fifteen seconds without a tap the button "Help me share"
 * serves the next hungry group (or picks up the next basket). The places of the baskets come from `scatterSpots` in `utils/wunderGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { breadCanServe, breadNextHungry, breadStars, scatterSpots } from '@/utils/wunderGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BreadGame } from '@/types/adventure'

const props = defineProps<{ game: BreadGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every group that is fed and every basket that is picked up
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + (r.kind === 'feed' ? props.game.groups.length : props.game.leftover.count), 0))

const TICK = 0.1
const IDLE_SECONDS = 15
const WALK_MS = 760
/** The colours that stand in for the pictures of the groups until they are painted. */
const COLOURS = ['#c98c5a', '#7aa0b8', '#b56b6b', '#8fb36b', '#9a82b5']

interface Walker {
  id: number
  group: number
  go: boolean
}

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const fed = ref<boolean[]>(props.game.groups.map(() => false))
const serving = ref<boolean[]>(props.game.groups.map(() => false))
const walkers = ref<Walker[]>([])
const taken = ref<boolean[]>(Array.from({ length: props.game.leftover.count }, () => false))
const spots = computed(() => scatterSpots(props.game.leftover.count, props.game.leftover.area, 11 + round.value * 7))
let walkerSeq = 0
const strays = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => breadStars(strays.value))
const fedCount = computed(() => fed.value.filter(Boolean).length)
const takenCount = computed(() => taken.value.filter(Boolean).length)
const counter = computed(() =>
  current.value.kind === 'feed'
    ? t('app.adventure.breadFedCount', { n: fedCount.value, total: props.game.groups.length })
    : t('app.adventure.breadLeftCount', { n: takenCount.value, total: props.game.leftover.count })
)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function tick() {
  if (finished.value || between.value) return
  idle.value += TICK
}
const timer = window.setInterval(tick, TICK * 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** The round is over: on to the next one, or the end. */
function roundOver() {
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1000)
    return
  }
  later(() => {
    round.value++
    between.value = false
    message.value = ''
    idle.value = 0
  }, 2000)
}

function serve(i: number) {
  if (between.value || finished.value || current.value.kind !== 'feed') return
  idle.value = 0
  if (fed.value[i]) {
    strays.value++
    play('tap')
    say(t('app.adventure.breadAgain'))
    return
  }
  if (!breadCanServe(!!fed.value[i], !!serving.value[i])) return
  serving.value[i] = true
  const w = reactive<Walker>({ id: ++walkerSeq, group: i, go: false })
  walkers.value.push(w)
  play('basket')
  later(() => {
    w.go = true
  }, 40)
  later(() => {
    fed.value[i] = true
    serving.value[i] = false
    progress.mark()
    play('right')
    if (!fed.value.every(Boolean)) return
    say(t('app.adventure.breadFed'), 0)
    roundOver()
  }, WALK_MS + 40)
  later(() => {
    walkers.value = walkers.value.filter((x) => x.id !== w.id)
  }, WALK_MS + 900)
}

function gather(k: number) {
  if (between.value || finished.value || current.value.kind !== 'collect' || taken.value[k]) return
  idle.value = 0
  taken.value[k] = true
  progress.mark()
  play('basket')
  if (taken.value.every(Boolean)) roundOver()
}

function helpMe() {
  if (current.value.kind === 'feed') {
    const i = breadNextHungry(fed.value, serving.value)
    if (i >= 0) serve(i)
  } else {
    const k = taken.value.findIndex((x) => !x)
    if (k >= 0) gather(k)
  }
}

const walkerStyle = (w: Walker) => {
  const g = props.game.groups[w.group]!
  const at = w.go ? { x: g.x, y: g.y + 5 } : props.game.basket
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.disciple.w}%` }
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
        :aria-label="t('app.adventure.breadField')"
      )
        button(
          v-for="(g, i) in game.groups"
          :key="g.id"
          type="button"
          class="gm-group"
          :class="{ fed: fed[i] }"
          :style="{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%` }"
          :aria-label="fed[i] ? t('app.adventure.breadGroupFed', { n: i + 1 }) : t('app.adventure.breadGroup', { n: i + 1 })"
          :disabled="between || current.kind !== 'feed'"
          @click="serve(i)"
        )
          GameImage(:src="g.image" :ratio="1.5" :colour="COLOURS[i % COLOURS.length]" round :label="g.label")
          span(v-if="fed[i]" class="gm-tick" aria-hidden="true")
            GameMark(kind="good")
        div(
          class="gm-basket"
          :style="{ left: `${game.basket.x}%`, top: `${game.basket.y}%`, width: `${game.basket.w}%` }"
          role="img"
          :aria-label="game.basket.label"
        )
          GameImage(:src="game.basket.image" :ratio="1.1" colour="#c9a45a" round :label="game.basket.label")
        div(
          v-for="w in walkers"
          :key="w.id"
          class="gm-walker"
          :style="walkerStyle(w)"
          aria-hidden="true"
        )
          GameImage(:src="game.disciple.image" :ratio="0.6" colour="#7b6a9a" label="juenger")
        template(v-if="current.kind === 'collect'")
          button(
            v-for="(s, k) in spots"
            :key="`${round}-${k}`"
            type="button"
            class="gm-leftover"
            :class="{ gone: taken[k] }"
            :style="taken[k] ? { left: '92%', top: '94%', width: `${game.leftover.w}%` } : { left: `${s.x}%`, top: `${s.y}%`, width: `${game.leftover.w}%` }"
            :aria-label="t('app.adventure.breadLeft', { n: k + 1 })"
            :disabled="between || taken[k]"
            @click="gather(k)"
          )
            GameImage(:src="game.leftover.image" :ratio="1" colour="#a9803f" round :label="game.leftover.label")
      p(class="gm-count" aria-live="polite") {{ counter }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.breadHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.breadDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #dfe6c4
  box-shadow: inset 0 0 18px rgba(50, 80, 20, 0.25)
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
  color: #4a5a2e

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #4a5a2e

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #7fae5b
  background-size: cover
  background-position: center

// a group of people: the whole picture is the tap area (at least 56 pixels)
.gm-group
  position: absolute
  display: block
  min-width: 56px
  min-height: 48px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 2
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(30, 50, 10, 0.4)) saturate(0.8)
  transition: filter 400ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &.fed
    filter: drop-shadow(0 3px 3px rgba(30, 50, 10, 0.4)) saturate(1.15)
    cursor: default

.gm-tick
  position: absolute
  left: 50%
  top: -6px
  display: block
  margin-left: -15px
  pointer-events: none
  z-index: 6

.gm-basket
  position: absolute
  display: block
  min-width: 56px
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 4px 4px rgba(30, 50, 10, 0.45))

.gm-walker
  position: absolute
  display: block
  min-width: 36px
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 5
  transition: left 760ms ease-in-out, top 760ms ease-in-out
  animation: gm-hop 380ms ease-in-out infinite
  filter: drop-shadow(0 3px 3px rgba(30, 50, 10, 0.4))

.gm-leftover
  position: absolute
  display: block
  min-width: 48px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  z-index: 4
  transition: left 560ms ease-in, top 560ms ease-in, opacity 560ms ease-in, scale 560ms ease-in
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 3px 3px rgba(30, 50, 10, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &.gone
    opacity: 0
    scale: 0.4
    pointer-events: none

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #4a5a2e

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-hop
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -4px

@media (prefers-reduced-motion: reduce)
  .gm-walker, .gm-leftover, .gm-group
    transition: none

  .gm-walker
    animation: none
</style>
