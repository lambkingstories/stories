<script setup lang="ts">
/**
 * The trumpet calls: the wall of Jerusalem is long and the builders stand far from one another (a painted wall and builders as pictures). Nehemiah and the trumpeter stand at one place of the wall
 * (a picture) and the trumpet sounds (golden arcs): "Where you hear the trumpet, gather to us there." The child taps each builder and he walks to the trumpeter and stands in the fan around him.
 * Round 1 the trumpeter stands in the middle, round 2 at the left end, round 3 at the right end; more builders every round. Nobody can do it wrong; the game is done when all have gathered.
 * The arithmetic is in `utils/nehemiaGames.ts`; the places are percent of the picture.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { allGathered, gatherSpot } from '@/utils/nehemiaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PostGame } from '@/types/adventure'

const props = defineProps<{ game: PostGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every builder of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.workers.length, 0))

const round = ref(0)
const arrived = ref<boolean[]>(props.game.rounds[0]!.workers.map(() => false))
const order = ref<number[]>([])
const sounding = ref(true)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(0, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.workers.length, 0))
const spriteOf = (i: number): string => src(props.game.workers[i % props.game.workers.length] ?? '')

later(() => {
  sounding.value = false
}, 2400)

function posOf(i: number): { x: number; y: number } {
  if (!arrived.value[i]) return { x: current.value.workers[i]!.x, y: current.value.workers[i]!.y }
  return gatherSpot(current.value.horn, Math.max(0, order.value.indexOf(i)))
}

function call(i: number) {
  if (between.value || finished.value || arrived.value[i]) return
  arrived.value[i] = true
  order.value.push(i)
  progress.mark()
  play('snap')
  message.value = ''
  if (allGathered(arrived.value)) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.postAll')
    later(() => {
      play('star')
      finished.value = true
    }, 2300)
    return
  }
  message.value = t('app.adventure.postRoundDone')
  later(() => {
    round.value++
    arrived.value = current.value.workers.map(() => false)
    order.value = []
    sounding.value = true
    between.value = false
    message.value = ''
    later(() => {
      sounding.value = false
    }, 2400)
  }, 1900)
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
        role="img"
        :aria-label="t('app.adventure.postWall')"
      )
        //- the trumpeter with Nehemiah and the golden arcs of the sound
        img(class="gm-horn" :src="src(game.horn)" alt="" draggable="false" :style="{ left: `${current.horn.x}%`, top: `${current.horn.y}%`, width: `${game.hornW}%` }")
        img(v-if="sounding" class="gm-wave" :src="src(game.wave)" alt="" draggable="false" :style="{ left: `${current.horn.x + game.hornW * 0.3}%`, top: `${current.horn.y - 14}%`, width: `${game.hornW * 0.9}%` }")
        //- the builders
        button(
          v-for="(w, i) in current.workers"
          :key="`w${round}-${i}`"
          type="button"
          class="gm-worker"
          :class="{ gone: arrived[i] }"
          :style="{ left: `${posOf(i).x}%`, top: `${posOf(i).y}%`, width: `${w.w ?? game.workerW}%` }"
          :aria-label="t('app.adventure.postWorker', { n: i + 1 })"
          :disabled="arrived[i]"
          @click="call(i)"
        )
          img(:src="spriteOf(i)" alt="" draggable="false")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.postCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.postDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6a5a48
  background-size: cover
  background-position: center

.gm-horn
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 5px 5px rgba(40, 25, 5, 0.4))

.gm-wave
  position: absolute
  display: block
  height: auto
  transform: translate(0, -50%)
  pointer-events: none
  z-index: 6
  animation: gm-pulse 800ms ease-in-out infinite

.gm-worker
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 5
  transition: left 900ms ease, top 900ms ease, filter 200ms ease
  filter: drop-shadow(0 0 6px rgba(255, 233, 150, 0.95))

  &.gone
    cursor: default
    filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

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

@keyframes gm-pulse
  0%, 100%
    opacity: 0.6
    transform: translate(0, -50%) scale(0.96)
  50%
    opacity: 1
    transform: translate(4%, -50%) scale(1.04)

@media (prefers-reduced-motion: reduce)
  .gm-worker
    transition: none
  .gm-wave
    animation: none
</style>
