<script setup lang="ts">
/**
 * Where is Saul: the people of Israel have gathered, and Saul, who is to be king, has hidden between the baggage. Piles of bags, baskets and jars stand about, some low and some tall. The child lifts a pile with a tap:
 * under the right one Saul is found (the round is done), under any other there is only baggage (a cross, one mistake, the pile stays lifted). The hint says that Saul is a head taller than everyone: only a tall
 * pile can hide him. Round 1 has five piles, round 2 eight. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BaggageGame } from '@/types/adventure'

const props = defineProps<{ game: BaggageGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: Saul is found once in each round
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const lifted = ref<Set<number>>(new Set())
const found = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 3, 7))
/** The piles that were lifted and hid nobody (a little thing lies under each). */
const emptyLifted = computed(() => [...lifted.value].filter((i) => i !== found.value))
const thingSrc = (i: number) => props.game.things[i % props.game.things.length] ?? ''
/** The pile under which Saul stands (when he is found). */
const foundPile = computed(() => (found.value === null ? undefined : current.value.piles[found.value]))

function lift(i: number) {
  if (between.value || finished.value || lifted.value.has(i)) return
  lifted.value = new Set([...lifted.value, i])
  if (i === current.value.hidden) {
    found.value = i
    between.value = true
    progress.mark()
    play('star')
    message.value = t('app.adventure.baggageFound')
    later(() => {
      if (lastRound.value) {
        finished.value = true
        return
      }
      round.value++
      lifted.value = new Set()
      found.value = null
      between.value = false
      message.value = ''
    }, 1900)
    return
  }
  misses.value++
  play('wrong')
  message.value = t('app.adventure.baggageEmpty')
}
</script>

<template lang="pug">
  div(class="gp")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gp-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gp-hint") {{ current.hint }}
      div(class="gp-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- Saul, when he is found: he stands where the pile stood
        span(
          v-if="found !== null"
          class="gp-saul"
          :style="{ left: `${foundPile?.x}%`, top: `${foundPile?.y}%`, width: `${game.saulW}%` }"
          role="img"
          :aria-label="t('app.adventure.baggageSaul')"
        )
          GameImage(:src="game.saul" colour="#6d7f95")
        //- the little things under the piles that were lifted for nothing
        span(
          v-for="i in emptyLifted"
          :key="`thing-${round}-${i}`"
          class="gp-thing"
          :style="{ left: `${current.piles[i]?.x}%`, top: `${current.piles[i]?.y}%`, width: `${game.thingW}%` }"
          aria-hidden="true"
        )
          GameImage(:src="thingSrc(i)" colour="#a89060")
        //- the piles
        button(
          v-for="(p, i) in current.piles"
          :key="`pile-${round}-${i}`"
          type="button"
          class="gp-pile"
          :class="{ lifted: lifted.has(i) }"
          :style="{ left: `${p.x}%`, top: `${p.y}%`, width: `${(game.pileW[p.kind] ?? 0) * (p.scale ?? 1)}%` }"
          :aria-label="t('app.adventure.baggagePile', { n: i + 1 })"
          :disabled="between || lifted.has(i)"
          @click="lift(i)"
        )
          GameImage(:src="game.piles[p.kind]" colour="#9a7a4c")
          span(v-if="lifted.has(i) && found !== i" class="gp-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gp-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.baggageDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gp
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

.gp-round
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

.gp-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gp-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// Saul and the piles stand with the middle of their foot at left/top
.gp-saul
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2

.gp-thing
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2

.gp-pile
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  transition: transform 450ms ease, opacity 450ms ease
  -webkit-tap-highlight-color: transparent
  z-index: 3

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

  &.lifted
    cursor: default
    opacity: 0.4
    transform: translate(-50%, -100%) translateY(-22%) rotate(-7deg)

.gp-cross
  position: absolute
  left: 50%
  top: 45%
  display: block
  margin: -15px 0 0 -15px

.gp-fb
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
  .gp-pile
    transition: none
</style>
