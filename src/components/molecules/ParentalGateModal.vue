<script setup lang="ts">
/**
 * The dialog behind `requireParent()`. Mounted once in `App.vue`.
 * A number in words plus a number pad: no multiple choice, so guessing gets a
 * child nowhere, and each wrong answer brings a new number.
 */
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useParentalGate, { numberWord } from '@/use/useParentalGate'

const { t, locale } = useI18n({ useScope: 'global' })
const { isOpen, challenge, newChallenge, pass, cancel } = useParentalGate()

const typed = ref('')
const wrong = ref(false)

const question = computed(() =>
  t('app.gate.question', { word: numberWord(challenge.value.number, locale.value) })
)

watch(isOpen, (open) => {
  if (!open) return
  typed.value = ''
  wrong.value = false
})

function press(digit: string) {
  wrong.value = false
  if (typed.value.length < 2) typed.value += digit
}

function erase() {
  typed.value = typed.value.slice(0, -1)
}

function submit() {
  if (!typed.value) return
  if (Number(typed.value) === challenge.value.number) {
    pass()
    return
  }
  wrong.value = true
  typed.value = ''
  newChallenge()
}

function onKey(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') cancel()
  else if (e.key === 'Enter') submit()
  else if (e.key === 'Backspace') erase()
  else if (/^[0-9]$/.test(e.key)) press(e.key)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="gate-modal")
      div(
        v-if="isOpen"
        class="gate-backdrop fixed inset-0 z-[90] flex items-center justify-center px-5"
        @click.self="cancel"
      )
        div(class="gate-wrap")
          LkCompanion(class="gate-lamb" pose="blick" :size="88")
          div(
            class="gate-panel relative w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
          )
            button(type="button" class="gate-close" :aria-label="t('app.gate.cancel')" @click="cancel")
              svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5")
                path(d="M18 6 6 18M6 6l12 12")

            h3#gate-title(class="gate-title") {{ t('app.gate.title') }}
            p(class="gate-text") {{ t('app.gate.text') }}
            p(class="gate-question") {{ question }}

            div(:class="['gate-display', { 'is-wrong': wrong }]" role="status" aria-live="polite")
              span(v-if="typed") {{ typed }}
              span(v-else-if="wrong" class="gate-wrong") {{ t('app.gate.wrong') }}
              span(v-else class="gate-placeholder") ?

            div(class="gate-pad")
              button(v-for="d in DIGITS" :key="d" type="button" class="gate-key" @click="press(d)") {{ d }}
              button(type="button" class="gate-key is-soft" :aria-label="t('app.gate.erase')" @click="erase") ⌫
              button(type="button" class="gate-key" @click="press('0')") 0
              button(type="button" class="gate-key is-ok" :disabled="!typed" :aria-label="t('app.gate.ok')" @click="submit") ✓
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.gate-backdrop
  background-color: rgba(8, 16, 26, 0.6)
  backdrop-filter: blur(4px)

.gate-wrap
  position: relative
  width: 100%
  max-width: min(360px, 92vw)
  margin-top: 56px

.gate-lamb
  position: absolute
  left: 50%
  top: -62px
  transform: translateX(-50%)
  z-index: 1

.gate-panel
  background: var(--lk-surface)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-panel)
  padding: 34px 18px 18px
  box-shadow: 0 18px 50px -12px rgba(0, 0, 0, 0.5)
  max-height: calc(100dvh - 90px)
  overflow-y: auto

.gate-close
  position: absolute
  top: 12px
  right: 12px
  width: 44px
  height: 44px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  background-color: var(--lk-surface-2)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  cursor: pointer

.gate-title
  margin: 0
  padding: 0 40px
  font-size: 1.4rem
  font-weight: 800
  color: var(--lk-text)
  text-align: center

.gate-text
  margin: 6px 0 0
  font-size: 0.95rem
  line-height: 1.4
  color: var(--lk-muted)
  text-align: center

.gate-question
  margin: 14px 0 0
  font-size: 1.2rem
  font-weight: 800
  color: var(--lk-text)
  text-align: center
  text-wrap: balance

.gate-display
  margin: 12px auto 0
  width: 160px
  min-height: 56px
  display: flex
  align-items: center
  justify-content: center
  border-radius: 28px
  background: var(--lk-surface-2)
  border: 1px solid var(--lk-line)
  font-size: 1.8rem
  font-weight: 800
  color: var(--lk-text)

  &.is-wrong
    border-color: #c8372d
    animation: gate-shake 320ms ease-in-out

.gate-wrong
  font-size: 0.9rem
  font-weight: 700
  color: #c8372d
  text-align: center
  padding: 0 6px

.gate-placeholder
  color: var(--lk-muted)

.gate-pad
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px
  margin-top: 14px

.gate-key
  min-height: 52px
  border-radius: 26px
  font-size: 1.3rem
  font-weight: 700
  color: var(--lk-text)
  cursor: pointer
  border: 1px solid var(--lk-line)
  background: var(--lk-surface-2)
  transition: transform 100ms ease-out

  &:active:not(:disabled)
    transform: translateY(1px)

  &.is-soft
    color: var(--lk-muted)

  &.is-ok
    color: var(--lk-on-accent)
    border-color: transparent
    background: var(--lk-accent)

  &:disabled
    opacity: 0.45
    cursor: default

@keyframes gate-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .is-wrong
    animation: none

.gate-modal-enter-active, .gate-modal-leave-active
  transition: opacity 180ms ease-out

.gate-modal-enter-from, .gate-modal-leave-to
  opacity: 0
</style>
