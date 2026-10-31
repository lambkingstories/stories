<script setup lang="ts">
/**
 * Find the sign (Luke 2,12 and 2,16): the angel said "You will find the child wrapped in swaddling cloths and lying in a manger". The shepherds hurry through Bethlehem at dawn; six places stand in the street (houses, an empty
 * house and a simple shelter with a manger in which the child lies, with Mary and Joseph). The child taps the places: the shepherds walk to the place; at the wrong place nothing of the sign is there (a cross, they walk back);
 * at the right place they stay. Three rounds with the places in another order. The arithmetic is in `utils/weihnachtenGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { signStep } from '@/utils/weihnachtenGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SignGame } from '@/types/adventure'

const props = defineProps<{ game: SignGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one place found per round
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const at = ref<{ x: number; y: number }>({ x: props.game.start.x, y: props.game.start.y })
const crossAt = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const found = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const placeOf = (id: string) => props.game.places.find((p) => p.id === id)
const slotOf = (i: number) => props.game.slots[i] ?? { x: 50, y: 50, w: 20 }

function tap(slot: number) {
  if (between.value || finished.value) return
  const id = current.value.order[slot]
  if (!id) return
  between.value = true
  const s = slotOf(slot)
  at.value = { x: s.x, y: Math.min(98, s.y + 3) }
  if (signStep(current.value.right, id) === 'wrong') {
    misses.value++
    later(() => {
      play('wrong')
      message.value = t('app.adventure.signWrong')
      crossAt.value = slot
    }, 900)
    later(() => {
      crossAt.value = null
      at.value = { x: props.game.start.x, y: props.game.start.y }
      between.value = false
    }, 2300)
    return
  }
  later(() => {
    progress.mark()
    play('snap')
    found.value = true
    message.value = t('app.adventure.signFound')
  }, 900)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3600)
    return
  }
  later(() => {
    round.value++
    found.value = false
    at.value = { x: props.game.start.x, y: props.game.start.y }
    between.value = false
    message.value = ''
  }, 3200)
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
        :aria-label="t('app.adventure.signField')"
      )
        button(
          v-for="(id, slot) in current.order"
          :key="`${round}-${slot}`"
          type="button"
          class="gm-place"
          :class="{ right: found && id === current.right }"
          :style="{ left: `${slotOf(slot).x}%`, top: `${slotOf(slot).y}%`, width: `${slotOf(slot).w}%` }"
          :aria-label="placeOf(id)?.label"
          :disabled="between"
          @click="tap(slot)"
        )
          img(:src="src(placeOf(id)?.image ?? '')" alt="" draggable="false")
          span(v-if="crossAt === slot" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
        img(
          class="gm-walker"
          :src="src(game.walker)"
          alt=""
          draggable="false"
          :style="{ left: `${at.x}%`, top: `${at.y}%`, width: `${game.walkerW}%` }"
        )
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.signCount', { n: doneCount, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.signDone')" @next="emit('done', stars)")
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
  background-color: #b79d7a
  background-size: cover
  background-position: center

.gm-place
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 10px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 4
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.4))
  transition: filter 250ms ease

  &.right
    filter: drop-shadow(0 0 10px rgba(255, 233, 150, 1))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.gm-walker
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 8
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.5))
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
  .gm-walker
    transition: none
</style>
