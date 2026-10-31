<script setup lang="ts">
/**
 * Prepare the way (Matthew 3,3): "Prepare the way of the Lord, make his paths straight!" A wide road runs through the wilderness to the Jordan. Stones, thornbushes and branches lie on it; the child taps them and
 * they are cleared away. Travelers rest beside the road: they are no obstacle and are left alone (a tap on a traveler is a mistake, a cross). When the road is clear the next round shows more things. The arithmetic is
 * in `utils/taufeGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { roadIsClear, roadStep } from '@/utils/taufeGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RoadGame } from '@/types/adventure'

const props = defineProps<{ game: RoadGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const obstaclesOf = (spots: { keep?: boolean }[]) => spots.filter((s) => !s.keep).length
// the whole task: every stone, thornbush and branch of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + obstaclesOf(r.spots), 0))

const round = ref(0)
const away = reactive<Record<number, boolean>>({})
const crossAt = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const clearedHere = computed(() => Object.keys(away).length)
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const itemOf = (id: string) => props.game.items.find((i) => i.id === id)

function tap(i: number) {
  if (between.value || finished.value || away[i]) return
  const spot = current.value.spots[i]
  if (!spot) return
  if (roadStep(!!spot.keep) === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.roadWrong')
    crossAt.value = i
    later(() => {
      if (crossAt.value === i) crossAt.value = null
    }, 900)
    return
  }
  away[i] = true
  progress.mark()
  play('snap')
  message.value = ''
  if (!roadIsClear(clearedHere.value, obstaclesOf(current.value.spots))) return
  between.value = true
  message.value = t('app.adventure.roadClear')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => {
    round.value++
    for (const k of Object.keys(away)) delete away[Number(k)]
    between.value = false
    message.value = ''
  }, 2200)
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
        :aria-label="t('app.adventure.roadField')"
      )
        button(
          v-for="(spot, i) in current.spots"
          :key="`${round}-${i}`"
          type="button"
          class="gm-thing"
          :class="{ away: !!away[i], keep: !!spot.keep }"
          :style="{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${itemOf(spot.item)?.w ?? 14}%`, '--dir': i % 2 === 0 ? '-1' : '1' }"
          :aria-label="itemOf(spot.item)?.label"
          :disabled="between || !!away[i]"
          @click="tap(i)"
        )
          img(:src="src(itemOf(spot.item)?.image ?? '')" alt="" draggable="false")
          span(v-if="crossAt === i" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.roadCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.roadDone')" @next="emit('done', stars)")
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
  background-color: #c9ad7d
  background-size: cover
  background-position: center

.gm-thing
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 10px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 4
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.4))
  transition: transform 520ms ease-in, opacity 520ms ease-in
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  // cleared away: it slides off the road and fades
  &.away
    transform: translate(calc(-50% + var(--dir) * 120%), -130%) scale(0.5) rotate(calc(var(--dir) * 40deg))
    opacity: 0
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
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

@media (prefers-reduced-motion: reduce)
  .gm-thing
    transition: none
</style>
