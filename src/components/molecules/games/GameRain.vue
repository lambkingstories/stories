<script setup lang="ts">
/**
 * Clouds that bring rain: the top of Mount Carmel above the sea, dry and brown; the sky above is empty. Round 1: one tiny cloud, only as big as a hand, rises from the sea. A tap lets it grow, a second tap
 * makes it big and heavy and it rains. Round 2: six clouds drift in from the left, one after the other; each one has to be tapped once before it has passed, then it rains a little. With every cloud
 * that rains the dry picture fades into the green one. A cloud that is not tapped drifts on and does not come back (that is a mistake). The first cloud enters a moment after the picture is there,
 * never at once. Where a cloud is at a time and how far it has grown is `cloudX` and `rainGrowth` in `utils/eliaGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cloudOver, cloudX, greenShare, rainGrowth } from '@/utils/eliaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RainGame } from '@/types/adventure'

const props = defineProps<{ game: RainGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one rain per cloud (one in round 1, six in round 2)
const totalClouds = props.game.rounds.reduce((n, r) => n + (r.mode === 'grow' ? 1 : r.clouds.length), 0)
progress.setGoal(totalClouds)

const LEAD_MS = 2200
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const SLOW = reduced ? 1.4 : 1

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const elapsed = ref(-LEAD_MS)
/** The taps on each cloud of the round (index in `clouds`). */
const taps = reactive<Record<number, number>>({})
/** The clouds that were tapped enough and now rain (until the rain stops). */
const raining = reactive<Record<number, boolean>>({})
const missed = ref<Set<number>>(new Set())
const rained = ref(0)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 4))
const clouds = computed(() => current.value.clouds.map((c) => ({ ...c, dur: c.dur * SLOW })))
const grow = computed(() => current.value.mode === 'grow')
/** How green the picture is: the share of the rains of the whole game (the rain fades the dry picture into the green one). */
const green = computed(() => greenShare(rained.value, totalClouds))

let last = Date.now()
const timer = window.setInterval(() => {
  const now = Date.now()
  const dt = Math.min(250, now - last)
  last = now
  if (between.value || finished.value) return
  elapsed.value += dt
  if (grow.value) return
  clouds.value.forEach((c, i) => {
    if (!taps[i] && !missed.value.has(i) && cloudOver(elapsed.value, c)) {
      missed.value = new Set(missed.value).add(i)
      misses.value++
      play('wrong')
      message.value = t('app.adventure.rainMissed')
    }
  })
  if (clouds.value.every((_, i) => taps[i] || missed.value.has(i)) && !Object.values(raining).some(Boolean)) roundOver()
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

/** The clouds that are in the picture now, with their size (0 tiny, 1 medium, 2 big) and place. */
const visible = computed(() => {
  if (grow.value) {
    if (elapsed.value < 0) return []
    const size = rainGrowth(taps[0] ?? 0)
    return [{ i: 0, size, x: props.game.sea.x, y: props.game.sea.y - Math.min(14, elapsed.value / 220) - size * 8 }]
  }
  return clouds.value
    .map((c, i) => {
      const x = cloudX(elapsed.value, c)
      if (x === null || (cloudOver(elapsed.value, c) && !raining[i])) return null
      const size = taps[i] ? 2 : 1
      return { i, size, x: taps[i] ? Math.min(x, 112) : x, y: c.y }
    })
    .filter((c): c is { i: number; size: number; x: number; y: number } => c !== null)
})

function rain(i: number) {
  raining[i] = true
  rained.value++
  progress.mark()
  play('star')
  message.value = ''
  later(() => {
    raining[i] = false
  }, grow.value ? 2600 : 1800)
}

function tap(i: number) {
  if (between.value || finished.value || raining[i]) return
  if (grow.value) {
    taps[0] = (taps[0] ?? 0) + 1
    play('basket')
    if (taps[0] === 2) {
      rain(0)
      later(roundOver, 3000)
    }
    return
  }
  if (missed.value.has(i) || taps[i]) return
  taps[i] = 1
  play('basket')
  rain(i)
}

function roundOver() {
  if (between.value) return
  between.value = true
  message.value = t('app.adventure.rainRound')
  if (round.value + 1 >= props.game.rounds.length) {
    later(() => {
      finished.value = true
    }, 2000)
    return
  }
  later(() => {
    round.value++
    elapsed.value = -LEAD_MS
    for (const k of Object.keys(taps)) delete taps[Number(k)]
    for (const k of Object.keys(raining)) delete raining[Number(k)]
    missed.value = new Set()
    last = Date.now()
    between.value = false
    message.value = ''
  }, 2200)
}

const cloudStyle = (c: { size: number; x: number; y: number }) => ({ left: `${c.x}%`, top: `${c.y}%`, width: `${props.game.cloudW[c.size]}%` })
const dropsStyle = (c: { size: number; x: number; y: number }) => ({ left: `${c.x}%`, top: `${c.y + 6}%`, width: `${props.game.cloudW[c.size]! * 0.9}%` })
</script>

<template lang="pug">
  div(class="rn")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="rn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="rn-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="rn-field")
        div(class="rn-pic" :style="{ backgroundImage: `url(${src(game.dry)})` }")
        div(class="rn-pic rn-green" :style="{ backgroundImage: `url(${src(game.green)})`, opacity: green }")
        template(v-for="c in visible" :key="`cloud-${round}-${c.i}`")
          img(v-if="raining[c.i]" :src="src(game.drops)" alt="" class="rn-drops" :style="dropsStyle(c)" draggable="false")
          button(
            type="button"
            class="rn-cloud"
            :class="{ wet: raining[c.i] }"
            :style="cloudStyle(c)"
            :disabled="between || raining[c.i]"
            :aria-label="t('app.adventure.rainCloud')"
            @click="tap(c.i)"
          )
            GameImage(:src="game.clouds[c.size]" colour="#e8eef5")
      p(class="rn-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.rainDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.rn
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.rn-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.rn-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.rn-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99863

// the dry and the green picture lie on one another; the green one fades in
.rn-pic
  position: absolute
  inset: 0
  background-size: cover
  background-position: center

.rn-green
  transition: opacity 1400ms ease

.rn-cloud
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  transition: width 700ms ease, top 700ms ease
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -14px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 12px

  &.wet
    pointer-events: none

.rn-drops
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, 0)
  pointer-events: none
  animation: rn-fall 900ms linear infinite

.rn-fb
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

@keyframes rn-fall
  from
    transform: translate(-50%, -4%)
    opacity: 0.95
  to
    transform: translate(-50%, 40%)
    opacity: 0.2

@media (prefers-reduced-motion: reduce)
  .rn-cloud,
  .rn-green
    transition: none
  .rn-drops
    animation: none
</style>
