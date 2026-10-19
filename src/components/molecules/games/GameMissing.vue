<script setup lang="ts">
/**
 * Who is missing from the caravan? A row of people stands before the wide plain. The child looks closely and taps "Done looking". A little cloud of dust
 * drifts across the row, and when it has passed somebody is gone (a gap in the row). Below, the whole caravan stands small as a choice: the child taps the
 * person who was missing, and that person comes back to the place (a tick). A wrong choice gets a red cross and nobody is lost; "Look again" shows the row
 * once more at any time. There is no clock. Three tasks in a round: first four people with one missing, then six people with two missing. The arithmetic
 * is `buildTask` in `utils/babelGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { buildTask } from '@/utils/babelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MissingGame } from '@/types/adventure'

const props = defineProps<{ game: MissingGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: everybody who is missing in every task of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.tasks.reduce((s, k) => s + k.gone.length, 0), 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const taskNo = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const task = computed(() => current.value.tasks[Math.min(taskNo.value, current.value.tasks.length - 1)]!)
const view = computed(() => buildTask(props.game.people, task.value))
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const lastTask = computed(() => taskNo.value >= current.value.tasks.length - 1)

/** `look`: the row stands complete; `dust`: the cloud passes; `pick`: somebody is gone and has to be found; `between`: the next task or round is coming. */
const phase = ref<'look' | 'dust' | 'pick' | 'between'>('look')
/** Who has been found again in this task. */
const found = reactive<Record<string, boolean>>({})
/** The row is shown complete once more (the child asked to look again). */
const peeking = ref(false)
const mistakes = ref(0)
const finished = ref(false)
const message = ref('')
const wrongPick = ref<string | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const personOf = (id: string) => props.game.people.find((p) => p.id === id)
const src = (p: string) => prependBaseUrl(p)
const labelOf = (id: string) => personOf(id)?.label ?? ''
/** Who stands in the row right now: the whole row while looking, the cloud passes or the child peeks; afterwards the gaps stay open until somebody is found. */
const standing = computed<(string | null)[]>(() => {
  if (phase.value === 'look' || phase.value === 'dust' && !gapsOpen.value || peeking.value) return task.value.row
  return view.value.after.map((id, i) => (id === null && found[task.value.row[i]!] ? task.value.row[i]! : id))
})
/** The cloud has covered the row: from now on the gaps are there. */
const gapsOpen = ref(false)
const slotOf = (i: number) => props.game.slots[i] ?? [50, 80]
const open = computed(() => task.value.gone.filter((g) => !found[g]))

function done() {
  if (phase.value !== 'look') return
  phase.value = 'dust'
  gapsOpen.value = false
  message.value = ''
  // the cloud drifts across the row; in the middle it hides the people, and the gaps stay when it has gone
  later(() => (gapsOpen.value = true), 800)
  later(() => {
    phase.value = 'pick'
    message.value = t('app.adventure.missingWho', { n: task.value.gone.length }, task.value.gone.length)
  }, 1700)
}

/** "Look again": the row is shown complete for a moment (no cost). */
function again() {
  if (phase.value !== 'pick' || peeking.value) return
  peeking.value = true
  later(() => (peeking.value = false), 2600)
}

function pick(id: string) {
  if (phase.value !== 'pick' || peeking.value) return
  if (found[id]) return
  if (task.value.gone.includes(id)) {
    found[id] = true
    progress.mark()
    play('snap')
    message.value = t('app.adventure.fbRight')
    if (open.value.length === 0) taskOver()
    return
  }
  mistakes.value++
  play('wrong')
  wrongPick.value = id
  message.value = t('app.adventure.missingWrong')
  later(() => {
    if (wrongPick.value === id) wrongPick.value = null
  }, 900)
}

function taskOver() {
  phase.value = 'between'
  later(() => {
    for (const k of Object.keys(found)) delete found[k]
    gapsOpen.value = false
    message.value = ''
    if (!lastTask.value) {
      taskNo.value++
      phase.value = 'look'
    } else if (!lastRound.value) {
      message.value = t('app.adventure.gameNext')
      later(() => {
        round.value++
        taskNo.value = 0
        message.value = ''
        phase.value = 'look'
      }, 1400)
    } else {
      finished.value = true
      play('star')
    }
  }, 1100)
}

const personStyle = (i: number) => ({ left: `${slotOf(i)[0]}%`, top: `${slotOf(i)[1]}%` })
</script>

<template lang="pug">
  div(class="ms")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="ms-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="ms-hint") {{ phase === 'look' ? current.hint : message || current.hint }}
      div(class="ms-field" role="group" :aria-label="t('app.adventure.missingRow')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        template(v-for="(id, i) in standing" :key="`${round}-${taskNo}-${i}`")
          img(v-if="id" :src="src(personOf(id)?.image ?? '')" alt="" draggable="false" class="ms-person" :class="{ back: task.gone.includes(id) && found[id] }" :style="personStyle(i)")
          span(v-else class="ms-gap" :style="personStyle(i)" role="img" :aria-label="t('app.adventure.missingGap')")
        img(v-if="phase === 'dust'" :src="src(game.cloud)" alt="" draggable="false" class="ms-cloud" aria-hidden="true")
      p(class="ms-fb" role="status") {{ phase === 'look' ? t('app.adventure.missingLook') : message }}
      div(v-if="phase === 'look'" class="ms-actions")
        AdvButton(tone="gold" @click="done") {{ t('app.adventure.missingDone') }}
      template(v-else)
        div(class="ms-choices" role="group" :aria-label="t('app.adventure.missingChoices')")
          button(
            v-for="id in view.choices"
            :key="id"
            type="button"
            class="ms-choice"
            :class="{ found: found[id], wrong: wrongPick === id }"
            :disabled="phase !== 'pick' || !!found[id] || peeking"
            :aria-label="found[id] ? t('app.adventure.missingBack', { name: labelOf(id) }) : labelOf(id)"
            @click="pick(id)"
          )
            img(:src="src(personOf(id)?.image ?? '')" alt="" draggable="false")
            GameMark(v-if="wrongPick === id" kind="bad" class="ms-mark")
            GameMark(v-else-if="found[id]" kind="good" class="ms-mark")
        div(class="ms-actions")
          AdvButton(tone="blau" small :disabled="phase !== 'pick' || peeking" @click="again") {{ t('app.adventure.missingAgain') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.missingFinished')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ms
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.ms-round
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

.ms-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.ms-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center

// a person stands with the feet at the place; the picture is 200 x 320
.ms-person
  position: absolute
  width: 11%
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 4px 3px rgba(60, 40, 10, 0.5))

  &.back
    animation: ms-return 500ms ease-out

// the empty place: only a soft mark on the ground
.ms-gap
  position: absolute
  width: 9%
  height: 4%
  transform: translate(-50%, -60%)
  border-radius: 50%
  background: rgba(60, 40, 10, 0.28)

.ms-cloud
  position: absolute
  left: 0
  top: 38%
  width: 100%
  height: auto
  pointer-events: none
  animation: ms-dust 1700ms ease-in-out both

.ms-fb
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

.ms-actions
  display: flex
  justify-content: center

.ms-choices
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.ms-choice
  position: relative
  width: 56px
  min-height: 80px
  padding: 4px
  border: 2px solid rgba(150, 100, 30, 0.6)
  border-radius: 12px
  background: rgba(255, 246, 220, 0.85)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.found
    opacity: 0.45

  &.wrong
    animation: ms-shake 420ms ease-in-out

  &:disabled
    cursor: default

.ms-mark
  position: absolute
  top: -8px
  right: -8px

@keyframes ms-dust
  0%
    transform: translateX(-100%)
    opacity: 0
  25%, 75%
    opacity: 0.95
  100%
    transform: translateX(100%)
    opacity: 0

@keyframes ms-return
  0%
    transform: translate(-50%, -100%) scale(0.85)
  100%
    transform: translate(-50%, -100%) scale(1)

@keyframes ms-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .ms-cloud
    animation: none
    opacity: 0.9

  .ms-choice.wrong,
  .ms-person.back
    animation: none
</style>
