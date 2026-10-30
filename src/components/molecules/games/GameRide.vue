<script setup lang="ts">
/**
 * The ride by night: Nehemiah rides at night around the broken wall of Jerusalem (a painted night picture with five different places). The child taps the places in the order of the text:
 * first the Valley Gate, then the Serpent Well, the Dung Gate, the Fountain Gate and the King's Pool. A right place makes the rider ride there (a tick); a wrong place is a mistake (a cross); a place that
 * was already reached is no mistake. In round 1 the list of the places stands above the picture, in round 2 it is gone and the child has to remember. The arithmetic is in `utils/nehemiaGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { rideStep } from '@/utils/nehemiaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { RideGame } from '@/types/adventure'

const props = defineProps<{ game: RideGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every place of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.order.length, 0))

const round = ref(0)
const reached = ref(0)
const at = ref<{ x: number; y: number }>({ x: props.game.start.x, y: props.game.start.y })
const crossAt = ref<string | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.order.length, 0))
const labelOf = (id: string): string => props.game.spots.find((s) => s.id === id)?.label ?? id
const spotOf = (id: string) => props.game.spots.find((s) => s.id === id)
const isReached = (id: string): boolean => current.value.order.slice(0, reached.value).includes(id)

function tap(id: string) {
  if (between.value || finished.value) return
  const r = rideStep(current.value.order, reached.value, id)
  if (r === 'again') return
  if (r === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.rideWrong')
    crossAt.value = id
    later(() => {
      crossAt.value = null
    }, 900)
    return
  }
  const s = spotOf(id)
  if (s) at.value = { x: s.x, y: s.y }
  reached.value++
  progress.mark()
  play('snap')
  message.value = ''
  if (reached.value >= current.value.order.length) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.rideHome')
    later(() => {
      const first = spotOf(current.value.order[0] ?? '')
      if (first) at.value = { x: first.x, y: first.y }
    }, 900)
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  message.value = t('app.adventure.rideRoundDone')
  later(() => {
    round.value++
    reached.value = 0
    at.value = { x: props.game.start.x, y: props.game.start.y }
    between.value = false
    message.value = ''
  }, 1900)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      ol(v-if="current.showList" class="gm-list")
        li(v-for="(id, i) in current.order" :key="`l${id}`" :class="{ done: i < reached, next: i === reached }") {{ labelOf(id) }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.rideMap')"
      )
        button(
          v-for="s in game.spots"
          :key="s.id"
          type="button"
          class="gm-spot"
          :class="{ reached: isReached(s.id) }"
          :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }"
          :aria-label="s.label"
          @click="tap(s.id)"
        )
          span(class="gm-name") {{ s.label }}
          span(v-if="crossAt === s.id" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        img(
          class="gm-rider"
          :src="src(game.rider)"
          alt=""
          draggable="false"
          :style="{ left: `${at.x}%`, top: `${at.y}%`, width: `${game.riderW}%` }"
        )
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.rideCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.rideDone')" @next="emit('done', stars)")
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

.gm-list
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  margin: 0
  padding: 0
  list-style: none
  counter-reset: stop

  li
    counter-increment: stop
    padding: 3px 10px
    border-radius: 999px
    background: rgba(255, 246, 220, 0.94)
    border: 2px solid #d4a83e
    font-weight: 700
    color: #5f4f35

    &::before
      content: counter(stop) '. '

    &.done
      background: #cfe8c7
      border-color: #6aa75d

    &.next
      border-color: #2f7bd6
      box-shadow: 0 0 0 3px rgba(47, 123, 214, 0.3)

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1b2a4a
  background-size: cover
  background-position: center

.gm-spot
  position: absolute
  display: flex
  flex-direction: column
  align-items: center
  aspect-ratio: 1 / 1
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 50%
  background: rgba(255, 233, 150, 0.12)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  cursor: pointer
  z-index: 5

  &.reached
    border-style: solid
    border-color: rgba(120, 200, 90, 0.95)
    background: rgba(120, 200, 90, 0.18)

.gm-name
  position: absolute
  top: 100%
  left: 50%
  transform: translateX(-50%)
  margin-top: 3px
  padding: 1px 8px
  border-radius: 999px
  background: rgba(20, 30, 55, 0.82)
  color: #fff6dc
  font-size: 0.8rem
  font-weight: 800
  white-space: nowrap
  pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gm-rider
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -80%)
  pointer-events: none
  z-index: 8
  filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5))
  transition: left 900ms ease, top 900ms ease

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
  .gm-rider
    transition: none
</style>
