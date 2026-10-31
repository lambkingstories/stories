<script setup lang="ts">
/**
 * The manger (Luke 2,7): in the simple shelter at the edge of Bethlehem Mary and Joseph sit beside the place where the child will lie. Round 1: "She wraps him in swaddling cloths": the child chooses among three cloths
 * (swaddling cloths, a royal robe, an animal fur); the right one makes the wrapped baby appear. Round 2: "and lays him in a manger": the child chooses among three beds (a manger, a golden bed, a basket); the right one
 * makes the baby lie in the manger. A wrong choice is a mistake (a cross). The arithmetic is in `utils/weihnachtenGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cribStep } from '@/utils/weihnachtenGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CribGame } from '@/types/adventure'

const props = defineProps<{ game: CribGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one choice per round
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const wrapped = ref(false)
const laid = ref(false)
const crossAt = ref<string | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const doneCount = computed(() => progress.parts.value)
const itemOf = (id: string) => props.game.items.find((i) => i.id === id)

function choose(id: string) {
  if (between.value || finished.value) return
  if (cribStep(current.value.right, id) === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.cribWrong')
    crossAt.value = id
    later(() => {
      crossAt.value = null
    }, 900)
    return
  }
  between.value = true
  progress.mark()
  play('snap')
  if (!wrapped.value) {
    wrapped.value = true
    message.value = t('app.adventure.cribWrapped')
  } else {
    laid.value = true
    message.value = t('app.adventure.cribLaid')
  }
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2800)
    return
  }
  later(() => {
    round.value++
    between.value = false
    message.value = ''
  }, 2300)
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
        :aria-label="t('app.adventure.cribField')"
      )
        img(class="gm-parents" :src="src(game.parents)" alt="" draggable="false" :style="{ left: `${game.parentsAt.x}%`, top: `${game.parentsAt.y}%`, width: `${game.parentsW}%` }")
        img(v-if="wrapped && !laid" class="gm-baby" :src="src(game.baby)" alt="" draggable="false" :style="{ left: `${game.babyAt.x}%`, top: `${game.babyAt.y}%`, width: `${game.babyW}%` }")
        img(v-if="laid" class="gm-manger" :src="src(game.manger)" alt="" draggable="false" :style="{ left: `${game.mangerAt.x}%`, top: `${game.mangerAt.y}%`, width: `${game.mangerW}%` }")
        div(v-if="!between" class="gm-options")
          button(
            v-for="id in current.options"
            :key="id"
            type="button"
            class="gm-option"
            :aria-label="itemOf(id)?.label"
            @click="choose(id)"
          )
            img(:src="src(itemOf(id)?.image ?? '')" alt="" draggable="false")
            span(class="gm-option-name") {{ itemOf(id)?.label }}
            span(v-if="crossAt === id" class="gm-cross" aria-hidden="true")
              GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.cribCount', { n: doneCount, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cribDone')" @next="emit('done', stars)")
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
  background-color: #3b3a56
  background-size: cover
  background-position: center

.gm-parents, .gm-baby, .gm-manger
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 4px 4px rgba(20, 15, 5, 0.45))

.gm-baby, .gm-manger
  z-index: 4
  animation: gm-rise 700ms ease-out

.gm-options
  position: absolute
  left: 0
  right: 0
  bottom: 2%
  display: flex
  justify-content: center
  gap: 8px
  padding: 0 6px
  z-index: 6

.gm-option
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  flex: 1 1 0
  max-width: 31%
  min-height: 44px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer

  img
    display: block
    width: 100%
    max-height: 80px
    object-fit: contain
    pointer-events: none

.gm-option-name
  font-size: 0.8rem
  font-weight: 800
  color: #5f4f35

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

@keyframes gm-rise
  0%
    opacity: 0
    transform: translate(-50%, -90%)
  100%
    opacity: 1
    transform: translate(-50%, -100%)

@media (prefers-reduced-motion: reduce)
  .gm-baby, .gm-manger
    animation: none
</style>
