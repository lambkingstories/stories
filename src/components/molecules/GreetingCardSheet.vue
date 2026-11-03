<script setup lang="ts">
/**
 * The window of the greeting card: who it is for and what it says (without the message when `withLine` is off: the thank-you sheet
 * takes the words of the entry). `title` and `text` replace the words of the greeting card. "Send" hands the two texts to the painting program, which
 * puts the picture in a frame and opens the share sheet (behind the parental gate, because it leaves the app).
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{ open: boolean; withLine?: boolean; title?: string; text?: string }>(), { withLine: true, title: '', text: '' })
const emit = defineEmits<{ close: []; send: [payload: { to: string; line: string }] }>()

const { t, tm, rt } = useI18n({ useScope: 'global' })

const to = ref('')
const line = ref('')

const people = computed(() => (tm('app.coloring.card.people') as unknown[]).map((p) => rt(p as string)))
const lines = computed(() => (tm('app.coloring.card.lines') as unknown[]).map((p) => rt(p as string)))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    to.value = people.value[0] ?? ''
    line.value = props.withLine ? (lines.value[0] ?? '') : ''
  }
)
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="card-sheet")
      div(v-if="open" class="cs-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')")
        div(class="cs-panel" role="dialog" aria-modal="true" aria-labelledby="cs-title")
          h3#cs-title(class="cs-title") {{ title || t('app.coloring.card.title') }}
          p(class="cs-text") {{ text || t('app.coloring.card.text') }}

          label(class="cs-label" for="cs-to") {{ t('app.coloring.card.forWhom') }}
          div(class="cs-chips")
            button(v-for="p in people" :key="p" type="button" :class="['cs-chip', { 'is-on': to === p }]" @click="to = p") {{ p }}
          input#cs-to(v-model="to" class="cs-input" type="text" maxlength="24" :placeholder="t('app.coloring.card.forWhomHint')")

          template(v-if="withLine")
            label(class="cs-label" for="cs-line") {{ t('app.coloring.card.message') }}
            div(class="cs-chips")
              button(v-for="l in lines" :key="l" type="button" :class="['cs-chip', { 'is-on': line === l }]" @click="line = l") {{ l }}
            input#cs-line(v-model="line" class="cs-input" type="text" maxlength="40" :placeholder="t('app.coloring.card.messageHint')")

          div(class="cs-actions")
            button(type="button" class="cs-btn is-main" @click="emit('send', { to, line })") {{ t('app.coloring.card.send') }}
            button(type="button" class="cs-btn" @click="emit('close')") {{ t('app.coloring.card.cancel') }}
</template>

<style scoped lang="sass">
.cs-backdrop
  position: fixed
  inset: 0
  z-index: 90
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  background: rgba(8, 16, 26, 0.55)

.cs-panel
  width: 100%
  max-width: 380px
  max-height: 92vh
  overflow-y: auto
  padding: 22px 18px 18px
  border-radius: 28px
  background: linear-gradient(180deg, var(--lk-surface) 0%, var(--lk-bg) 100%)
  color: var(--lk-text)
  border: 1px solid var(--lk-line)
  box-shadow: 0 22px 54px -14px rgba(0, 0, 0, 0.55)

.cs-title
  margin: 0
  font-size: 1.35rem
  font-weight: 800
  text-align: center

.cs-text
  margin: 6px 0 0
  text-align: center
  color: var(--lk-muted)
  line-height: 1.4

.cs-label
  display: block
  margin: 16px 0 6px
  font-weight: 800
  font-size: 0.95rem

.cs-chips
  display: flex
  flex-wrap: wrap
  gap: 6px

.cs-chip
  min-height: 40px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  font-size: 0.92rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.cs-input
  width: 100%
  min-height: 46px
  margin-top: 8px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit

.cs-actions
  display: grid
  gap: 8px
  margin-top: 18px

.cs-btn
  min-height: 52px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: transparent
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  cursor: pointer

  &.is-main
    border: none
    background: linear-gradient(180deg, #f9e5a6 0%, #e6b840 100%)
    color: #4a3410
    box-shadow: 0 8px 16px -8px rgba(120, 80, 10, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.7)

.card-sheet-enter-active, .card-sheet-leave-active
  transition: opacity 160ms ease-out

.card-sheet-enter-from, .card-sheet-leave-to
  opacity: 0
</style>
