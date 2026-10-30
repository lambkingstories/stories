<script setup lang="ts">
/**
 * Honor the man: the king asks "What shall be done for the man the king wants to honor?" and Haman answers for himself: royal clothes, a horse of the king, a crown. The child finds the three things in
 * three rounds: in each round four things lie in a row (round 1 clothes, round 2 something for the head, round 3 an animal), and only one is what Haman named. A right thing flies up to its frame above
 * (a tick); a wrong one stays and is crossed (a mistake, it cannot be taken again). When all three are chosen the street of Susa shows Mordecai on the king's horse, led by Haman. The arithmetic is trivial:
 * one right choice per round; the places are percent of the picture.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { honorPick } from '@/utils/esterGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HonorGame } from '@/types/adventure'

const props = defineProps<{ game: HonorGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one right choice in every round
progress.setGoal(props.game.rounds.length)

const round = ref(0)
/** The pictures of the things chosen so far (one per finished round). */
const chosen = ref<string[]>([])
/** The choices of this round that were wrong (crossed out). */
const crossed = ref<number[]>([])
const misses = ref(0)
const between = ref(false)
const parade = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => chosen.value.length)
const total = computed(() => props.game.rounds.length)

function pick(i: number) {
  if (between.value || parade.value || finished.value || crossed.value.includes(i)) return
  const c = current.value.choices[i]!
  if (honorPick(c.right) === 'wrong') {
    misses.value++
    crossed.value.push(i)
    play('wrong')
    message.value = t('app.adventure.honorWrong')
    return
  }
  chosen.value.push(c.image)
  progress.mark()
  play('snap')
  message.value = t('app.adventure.honorRight')
  between.value = true
  if (lastRound.value) {
    later(() => {
      parade.value = true
      message.value = t('app.adventure.honorParade')
      play('star')
      later(() => {
        finished.value = true
      }, 3200)
    }, 1200)
    return
  }
  later(() => {
    round.value++
    crossed.value = []
    between.value = false
    message.value = ''
  }, 1100)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: Math.min(round + 1, game.rounds.length), total: game.rounds.length }) }}
      p(class="gm-hint") {{ parade ? t('app.adventure.honorParade') : current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(parade ? game.parade : game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.honorStreet')"
      )
        //- the three frames above: what the king's man named
        div(v-if="!parade" class="gm-frames")
          div(v-for="(r, ri) in game.rounds" :key="`fr${ri}`" class="gm-frame" :class="{ full: chosen[ri] }")
            img(v-if="chosen[ri]" :src="src(chosen[ri] ?? '')" alt="" draggable="false")
      div(v-if="!parade" class="gm-tray")
        button(
          v-for="(c, ci) in current.choices"
          :key="`c${ci}`"
          type="button"
          class="gm-choice"
          :class="{ crossed: crossed.includes(ci) }"
          :aria-label="c.label"
          :disabled="crossed.includes(ci) || between"
          @click="pick(ci)"
        )
          img(:src="src(c.image)" alt="" draggable="false")
          span(v-if="crossed.includes(ci)" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.honorCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.honorDone')" @next="emit('done', stars)")
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

.gm-frames
  position: absolute
  left: 0
  right: 0
  bottom: 8%
  display: flex
  justify-content: center
  gap: 5%

.gm-frame
  width: 24%
  aspect-ratio: 1 / 1
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 50%
  background: rgba(255, 233, 150, 0.16)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  display: flex
  align-items: center
  justify-content: center

  &.full
    border-style: solid
    background: rgba(255, 246, 220, 0.9)

  img
    width: 86%
    height: 86%
    object-fit: contain

.gm-tray
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 8px

.gm-choice
  position: relative
  aspect-ratio: 1 / 1
  min-height: 70px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer
  transition: opacity 200ms ease

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &.crossed
    opacity: 0.4
    cursor: default

.gm-cross
  position: absolute
  left: 50%
  top: 50%
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
  .gm-choice
    transition: none
</style>
