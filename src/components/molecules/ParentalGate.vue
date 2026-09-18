<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { gateQuestion, isGateAnswerCorrect, newGateQuestion, settleParentalGate } from '@/use/useParentalGate'

const { t } = useI18n({ useScope: 'global' })

const answer = ref('')
const wrong = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

watch(gateQuestion, (question, previous) => {
  // Only a fresh opening resets the form; a wrong answer swaps the question
  // itself (below) and keeps the error visible.
  if (question && !previous) {
    answer.value = ''
    wrong.value = false
    void nextTick(() => inputEl.value?.focus())
  }
})

function submit() {
  const question = gateQuestion.value
  if (!question) return
  if (isGateAnswerCorrect(question, answer.value)) {
    settleParentalGate(true)
    return
  }
  wrong.value = true
  answer.value = ''
  gateQuestion.value = newGateQuestion()
  void nextTick(() => inputEl.value?.focus())
}

function cancel() {
  settleParentalGate(false)
}
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="gate-modal")
      div(
        v-if="gateQuestion"
        class="gate-backdrop fixed inset-0 z-[90] flex items-center justify-center px-5"
        @click.self="cancel"
      )
        form(
          class="gate-panel relative w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parental-gate-title"
          @submit.prevent="submit"
        )
          h3#parental-gate-title(class="gate-title") {{ t('app.parentalGate.title') }}
          p(class="gate-text") {{ t('app.parentalGate.text') }}
          label(class="gate-question" for="parental-gate-answer")
            | {{ t('app.parentalGate.question', { a: gateQuestion.a, b: gateQuestion.b }) }}
          input#parental-gate-answer(
            ref="inputEl"
            v-model="answer"
            class="gate-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="3"
            autocomplete="off"
            :aria-invalid="wrong"
            :aria-label="t('app.parentalGate.answerLabel')"
          )
          p(v-if="wrong" class="gate-wrong" role="alert") {{ t('app.parentalGate.wrong') }}
          div(class="gate-actions")
            button(type="button" class="gate-btn gate-btn--secondary" @click="cancel") {{ t('app.parentalGate.cancel') }}
            button(type="submit" class="gate-btn gate-btn--primary" :disabled="!answer.trim()") {{ t('app.parentalGate.confirm') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.gate-backdrop
  background-color: rgba(20, 14, 6, 0.55)
  backdrop-filter: blur(4px)

.gate-panel
  max-width: min(380px, 92vw)
  background: linear-gradient(180deg, #fdf8ed 0%, #f3e6c4 100%)
  border: 1.5px solid #e6d6b5
  border-radius: 24px
  padding: 22px 20px 18px
  box-shadow: 0 18px 50px -12px rgba(58, 42, 18, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  color: #1a2f4a
  text-align: center

.gate-title
  font-size: 18px
  font-weight: 700
  margin: 0 0 8px

.gate-text
  font-size: 14px
  line-height: 1.4
  margin: 0 0 14px
  opacity: 0.85

.gate-question
  display: block
  font-size: 20px
  font-weight: 700
  margin-bottom: 10px

.gate-input
  width: 7.5rem
  padding: 10px 12px
  font-size: 22px
  font-weight: 700
  text-align: center
  color: #1a2f4a
  background: #ffffff
  border: 1.5px solid #d9c7a2
  border-radius: 14px
  outline: none

  &:focus
    border-color: #1f6fa8
    box-shadow: 0 0 0 3px rgba(31, 111, 168, 0.18)

.gate-wrong
  margin: 10px 0 0
  font-size: 13px
  font-weight: 600
  color: #b3261e

.gate-actions
  display: flex
  gap: 10px
  justify-content: center
  margin-top: 18px

.gate-btn
  min-width: 7rem
  padding: 10px 16px
  border-radius: 999px
  font-size: 15px
  font-weight: 700
  cursor: pointer
  transition: transform 150ms ease-out, opacity 150ms ease-out

  &:active
    transform: scale(0.96)

  &:disabled
    opacity: 0.5
    cursor: default

.gate-btn--secondary
  background: rgba(255, 255, 255, 0.7)
  border: 1px solid #e6d6b5
  color: #1a2f4a

.gate-btn--primary
  background: #1f6fa8
  border: 1px solid #185a88
  color: #ffffff

.gate-modal-enter-active,
.gate-modal-leave-active
  transition: opacity 160ms ease-out

.gate-modal-enter-from,
.gate-modal-leave-to
  opacity: 0
</style>
