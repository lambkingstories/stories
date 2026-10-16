<script setup lang="ts">
/** The questions of a stage or of the exam: one at a time, three answers; a wrong answer shows the right one. */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useSfx from '@/use/useSfx'
import type { AdventureQuestion } from '@/types/adventure'

const props = defineProps<{ questions: AdventureQuestion[] }>()
const emit = defineEmits<{ done: [correct: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()

/** The data lists the right answer first: every question gets its own random order. */
function shuffled(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

const orders = props.questions.map((q) => shuffled(q.options.length))
const index = ref(0)
const picked = ref<number | null>(null)
const correct = ref(0)

const question = computed(() => props.questions[index.value]!)
const options = computed(() => orders[index.value]!.map((i) => ({ i, text: question.value.options[i]! })))
const answered = computed(() => picked.value !== null)
const isLast = computed(() => index.value >= props.questions.length - 1)

function pick(i: number) {
  if (answered.value) return
  picked.value = i
  const right = i === question.value.answer
  if (right) correct.value++
  play(right ? 'right' : 'wrong')
}

function next() {
  if (!answered.value) return
  if (isLast.value) {
    emit('done', correct.value)
    return
  }
  index.value++
  picked.value = null
}
</script>

<template lang="pug">
  div(class="quiz")
    p(class="quiz-count") {{ t('app.adventure.questionOf', { n: index + 1, total: questions.length }) }}
    h2(class="quiz-q") {{ question.q }}
    div(class="quiz-options" role="group")
      button(
        v-for="o in options"
        :key="o.i"
        type="button"
        class="quiz-option"
        :class="{ right: answered && o.i === question.answer, wrong: answered && picked === o.i && o.i !== question.answer, dim: answered && o.i !== question.answer && picked !== o.i }"
        :disabled="answered"
        @click="pick(o.i)"
      )
        span(class="quiz-radio" aria-hidden="true")
          ZIconography(v-if="answered && o.i === question.answer" name="check" :size="18")
          span(v-else-if="answered && picked === o.i" class="quiz-x") ✕
        span(class="quiz-text") {{ o.text }}
        span(v-if="answered && o.i === question.answer" class="quiz-tag") {{ t('app.adventure.right') }}
        span(v-else-if="answered && picked === o.i" class="quiz-tag") {{ t('app.adventure.wrong') }}
    p(v-if="answered" class="quiz-feedback" role="status") {{ picked === question.answer ? t('app.adventure.right') : t('app.adventure.wrong') }}
    div(class="quiz-next")
      AdvButton(v-if="answered" tone="gold" @click="next") {{ isLast ? t('app.adventure.finish') : t('app.adventure.next') }}
</template>

<style scoped lang="sass">
.quiz
  display: flex
  flex-direction: column
  gap: 14px

.quiz-count
  margin: 0
  font-size: 1rem
  color: var(--lk-muted)

.quiz-q
  margin: 0
  font-size: 1.6rem
  line-height: 1.25
  font-weight: 800
  color: var(--lk-text)

.quiz-options
  display: flex
  flex-direction: column
  gap: 10px

// one answer: a capsule row with a round marker; after the answer the marker, the word and the colour say right or wrong
.quiz-option
  display: flex
  align-items: center
  gap: 12px
  width: 100%
  min-height: 60px
  padding: 8px 16px
  border: 1.5px solid var(--lk-line)
  border-radius: var(--lk-r-btn)
  background: var(--lk-surface)
  color: var(--lk-text)
  font-family: inherit
  font-size: 1.1rem
  font-weight: 600
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: opacity 160ms ease-out

  &:active:not(:disabled)
    transform: translateY(1px)

  &.right
    border-color: var(--lk-ok)
    background: var(--lk-surface)
    box-shadow: inset 0 0 0 1.5px var(--lk-ok)

  &.wrong
    border-color: var(--lk-new)
    box-shadow: inset 0 0 0 1.5px var(--lk-new)

  &.dim
    opacity: 0.55

.quiz-radio
  flex: none
  width: 28px
  height: 28px
  border-radius: 50%
  border: 2px solid var(--lk-muted)
  display: flex
  align-items: center
  justify-content: center
  font-size: 0.85rem
  font-weight: 800

  .right &
    background: var(--lk-ok)
    border-color: var(--lk-ok)
    color: var(--lk-surface)

    :deep(.z-icon-outline)
      color: currentColor

  .wrong &
    background: var(--lk-new)
    border-color: var(--lk-new)
    color: #fff

.quiz-text
  flex: 1
  min-width: 0

.quiz-tag
  flex: none
  padding: 2px 10px
  border-radius: 999px
  font-size: 0.85rem
  font-weight: 800
  background: var(--lk-surface-2)

.quiz-feedback
  margin: 0
  font-weight: 800
  color: var(--lk-text)

.quiz-next
  min-height: 70px
</style>
