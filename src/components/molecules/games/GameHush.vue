<script setup lang="ts">
/**
 * Keep quiet: round the city the people walk in silence. At the side of the road sit a donkey, a goose, a goat, a lamb, a cock and a cart with a jug that would like to make a noise. Over one of them
 * a small cloud of noise comes up and slowly grows (small, middle, big). A tap on the animal before the cloud is big calms it: the cloud melts away (a tick, a soft tone). If the cloud has grown for
 * the whole time it is loud: a quiet "baa", the procession stumbles (a cross, a mistake) and the cloud is gone; that animal does not count and another cloud comes. The game never ends early. The
 * animals sit fixed in six places. Round 1: eight calmings, two clouds at most at the same time, 4 seconds to loud; round 2: twelve, up to three clouds, 3 seconds. The order in which the clouds come is
 * always the same (`nextSpawn`), their size `cloudLevel`, when they are loud `isLoud`, all in `utils/josuaGames.ts`. From the keyboard: Tab to the animals, Enter calms.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cloudLevel, isLoud, nextSpawn } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HushGame } from '@/types/adventure'

const props = defineProps<{ game: HushGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every animal of every round that is calmed
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.calms, 0))

/** Stand-in colours of the animals until the pictures are there. */
const COLOURS = ['#a8a39b', '#f0eee6', '#c9b79a', '#f3ece0', '#c96f4b', '#b58a5a']

interface Cloud {
  spot: number
  born: number
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const clouds = reactive<Cloud[]>([])
const calmed = ref(0)
const mistakes = ref(0)
const spawned = ref(0)
const nextAt = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<{ spot: number; kind: 'good' | 'bad' } | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))

const now = ref(Date.now())
function startRound() {
  clouds.splice(0, clouds.length)
  calmed.value = 0
  spawned.value = 0
  nextAt.value = Date.now() + nextSpawn(current.value.seed, 0, props.game.spots.length).wait * 1000
}
startRound()

const ageOf = (c: Cloud) => (now.value - c.born) / 1000

function flashOn(spot: number, kind: 'good' | 'bad') {
  flash.value = { spot, kind }
  later(() => {
    if (flash.value?.spot === spot) flash.value = null
  }, 900)
}

function tick() {
  now.value = Date.now()
  if (between.value || finished.value) return
  // a cloud that has grown for the whole time is loud: the procession stumbles, the cloud is gone
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i]!
    if (isLoud(ageOf(c), current.value.grow)) {
      clouds.splice(i, 1)
      mistakes.value++
      play('wrong')
      message.value = t('app.adventure.hushLoud')
      flashOn(c.spot, 'bad')
    }
  }
  // the next cloud comes when it is time, when there is room for one more and when one more is still needed
  if (now.value >= nextAt.value && clouds.length < current.value.maxClouds && clouds.length < current.value.calms - calmed.value) spawn()
}
function spawn() {
  const spots = props.game.spots.length
  const plan = nextSpawn(current.value.seed, spawned.value, spots)
  let spot = plan.spot
  for (let k = 0; k < spots && clouds.some((c) => c.spot === spot); k++) spot = (spot + 1) % spots
  if (clouds.some((c) => c.spot === spot)) return
  clouds.push({ spot, born: Date.now() })
  spawned.value++
  nextAt.value = Date.now() + nextSpawn(current.value.seed, spawned.value, spots).wait * 1000
}
const timer = window.setInterval(tick, 100)
onBeforeUnmount(() => window.clearInterval(timer))

/** A tap on an animal: if a cloud grows over it, it is calmed. */
function calm(spot: number) {
  if (between.value || finished.value) return
  const i = clouds.findIndex((c) => c.spot === spot)
  if (i < 0) return
  clouds.splice(i, 1)
  calmed.value++
  progress.mark()
  play('tap')
  message.value = ''
  flashOn(spot, 'good')
  if (calmed.value >= current.value.calms) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    startRound()
    between.value = false
    message.value = ''
  }, 1800)
}

const cloudAt = (spot: number) => clouds.find((c) => c.spot === spot)
const levelAt = (spot: number) => {
  const c = cloudAt(spot)
  return c ? cloudLevel(ageOf(c), current.value.grow) : 0
}
const cloudImage = (spot: number) => props.game.clouds[Math.max(0, levelAt(spot) - 1)] ?? ''
const placeStyle = (s: { x: number; y: number; w: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` })
const colourOf = (i: number) => COLOURS[i % COLOURS.length]
const nameOf = (id: string) => t(`app.adventure.hushName${id.charAt(0).toUpperCase()}${id.slice(1)}`)
</script>

<template lang="pug">
  div(class="hs")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="hs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="hs-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="hs-field" role="group" :aria-label="t('app.adventure.hushField', { n: calmed, total: current.calms })" :style="{ backgroundImage: `url(${src(game.background)})` }")
        template(v-if="!between")
          button(
            v-for="(s, i) in game.spots"
            :key="`${round}-${s.id}`"
            type="button"
            class="hs-spot"
            :class="{ cloudy: levelAt(i) > 0 }"
            :style="placeStyle(s)"
            :aria-label="levelAt(i) > 0 ? t('app.adventure.hushCalm', { name: nameOf(s.animal) }) : nameOf(s.animal)"
            @click="calm(i)"
          )
            GameImage(:src="s.image" :colour="colourOf(i)")
            span(v-if="levelAt(i) > 0" class="hs-cloud" :class="`level-${levelAt(i)}`")
              GameImage(:src="cloudImage(i)" :ratio="120 / 100" colour="#e8eaf0" round)
            GameMark(v-if="flash && flash.spot === i" :kind="flash.kind" class="hs-mark")
      p(class="hs-fb" role="status") {{ message }}
      p(class="hs-count") {{ t('app.adventure.hushCount', { n: calmed, total: current.calms }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hushDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hs
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.hs-round
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

.hs-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.hs-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9c08c
  background-size: cover
  background-position: center

// an animal sits fixed at the side of the road; the button is at least a thumb big
.hs-spot
  position: absolute
  min-width: 52px
  min-height: 52px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &.cloudy
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.9))

.hs-cloud
  position: absolute
  left: 50%
  bottom: 88%
  display: block
  transform: translateX(-50%)
  pointer-events: none

  &.level-1
    width: 44%

  &.level-2
    width: 64%

  &.level-3
    width: 86%

.hs-mark
  position: absolute
  top: -6px
  right: -6px

.hs-fb
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

.hs-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
