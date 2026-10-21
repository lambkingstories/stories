<script setup lang="ts">
/**
 * Guess the herds: on the wide pastures stand herds that are too big to count. Round 1 shows two herds side by side and the child taps the bigger one (more or less); round 2 shows one
 * herd and the child chooses among three ranges ("about ten, about thirty, about sixty") the one that fits. Counting is not possible, the herds are too big. A wrong answer is a cross
 * (a mistake) and the child looks again; there is no clock and nothing is lost. The animals stand where `scatter` puts them (always the same for the same seed, spread out, so nobody
 * stands on top of another). Three tasks in each round. The arithmetic is in `utils/jakobGames2.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { rangeAbout, rightRange, scatter } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GuessAnimal, GuessGame } from '@/types/adventure'

const props = defineProps<{ game: GuessGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every task of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.tasks.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const taskNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const task = computed(() => current.value.tasks[Math.min(taskNo.value, current.value.tasks.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const lastTask = computed(() => taskNo.value >= current.value.tasks.length - 1)

const mistakes = ref(0)
const finished = ref(false)
const between = ref(false)
const solved = ref(false)
const message = ref('')
const wrongPick = ref<string | null>(null)
const rightPick = ref<string | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 0, 2))

const animalOf = (id: string): GuessAnimal | undefined => props.game.animals.find((a) => a.id === id)
const region = computed(() => props.game.region)
/** The area of a herd: the whole meadow, or one half of it when two herds are compared (with a gap between them). */
const areaOf = (which: 'a' | 'b') => {
  const r = region.value
  if (current.value.mode === 'range') return r
  const w = r.w * 0.47
  return { x: which === 'a' ? r.x : r.x + r.w * 0.53, y: r.y, w, h: r.h }
}
interface Sprite {
  key: string
  image: string
  w: number
  style: Record<string, string>
}
const spritesOf = (which: 'a' | 'b'): Sprite[] => {
  const herd = which === 'a' ? task.value.a : task.value.b
  if (!herd) return []
  const animal = animalOf(herd.animal)
  if (!animal) return []
  return scatter(herd.count, task.value.seed + (which === 'b' ? 101 : 0), areaOf(which)).map((p, i) => ({
    key: `${round.value}-${taskNo.value}-${which}-${i}`,
    image: animal.image,
    w: animal.w,
    style: { left: `${p.x}%`, top: `${p.y}%`, width: `${animal.w}%`, zIndex: String(Math.round(p.y)) }
  }))
}
const herdA = computed(() => spritesOf('a'))
const herdB = computed(() => spritesOf('b'))
const ranges = computed(() => task.value.ranges ?? [])
const src = (p: string) => prependBaseUrl(p)

/** The answer: `a` or `b` (which herd is bigger), or the number of the range. */
function answer(choice: string) {
  if (solved.value || between.value || finished.value) return
  let right: boolean
  if (current.value.mode === 'compare') right = (choice === 'a') === (task.value.a.count > (task.value.b?.count ?? 0))
  else right = Number(choice) === rightRange(task.value.a.count, ranges.value)
  if (right) {
    solved.value = true
    rightPick.value = choice
    progress.mark()
    play('snap')
    message.value = t('app.adventure.fbRight')
    later(next, 1000)
    return
  }
  mistakes.value++
  play('wrong')
  wrongPick.value = choice
  message.value = t('app.adventure.guessWrong')
  later(() => {
    if (wrongPick.value === choice) wrongPick.value = null
  }, 900)
}

function next() {
  rightPick.value = null
  wrongPick.value = null
  solved.value = false
  message.value = ''
  if (!lastTask.value) {
    taskNo.value++
    return
  }
  if (lastRound.value) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    taskNo.value = 0
    between.value = false
    message.value = ''
  }, 1400)
}

const count = computed(() => rounds.value.slice(0, round.value).reduce((n, r) => n + r.tasks.length, 0) + taskNo.value + (solved.value ? 1 : 0))
const total = computed(() => rounds.value.reduce((n, r) => n + r.tasks.length, 0))
</script>

<template lang="pug">
  div(class="gs")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="gs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="gs-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="gs-field game-soft" role="group" :aria-label="t('app.adventure.guessField')" :style="{ '--bg': `url(${src(game.background)})` }")
        template(v-if="!between")
          span(v-for="s in herdA" :key="s.key" class="gs-animal" :style="s.style")
            GameImage(:src="s.image" :ratio="1.2")
          span(v-for="s in herdB" :key="s.key" class="gs-animal" :style="s.style")
            GameImage(:src="s.image" :ratio="1.2")
        GameMark(v-if="rightPick" kind="good" class="gs-mark")
        GameMark(v-else-if="wrongPick" kind="bad" class="gs-mark")
      p(class="gs-fb" role="status") {{ message }}
      div(v-if="current.mode === 'compare'" class="gs-choices")
        AdvButton(tone="gold" :disabled="solved || between" :class="{ right: rightPick === 'a', wrong: wrongPick === 'a' }" @click="answer('a')") {{ t('app.adventure.guessLeft') }}
        AdvButton(tone="gold" :disabled="solved || between" :class="{ right: rightPick === 'b', wrong: wrongPick === 'b' }" @click="answer('b')") {{ t('app.adventure.guessRight') }}
      div(v-else class="gs-choices")
        AdvButton(
          v-for="(r, i) in ranges"
          :key="`${round}-${taskNo}-${i}`"
          tone="gold"
          :disabled="solved || between"
          :class="{ right: rightPick === String(i), wrong: wrongPick === String(i) }"
          @click="answer(String(i))"
        ) {{ t('app.adventure.guessAbout', { n: rangeAbout(r) }) }}
      p(class="gs-count") {{ t('app.adventure.guessCount', { n: count, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.guessDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gs
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e4dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.gs-round
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

.gs-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.gs-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8c98a
  background-size: cover
  background-position: center

// an animal stands with its feet at the place
.gs-animal
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

.gs-mark
  position: absolute
  top: 8px
  left: 50%
  transform: translateX(-50%)

.gs-fb
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

.gs-choices
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

  .right
    box-shadow: 0 0 0 4px rgba(60, 160, 70, 0.9)

  .wrong
    animation: gs-shake 420ms ease-in-out
    box-shadow: 0 0 0 4px rgba(200, 50, 50, 0.9)

.gs-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes gs-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .gs-choices .wrong
    animation: none
</style>
