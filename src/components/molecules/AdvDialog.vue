<script setup lang="ts">
/**
 * A question or a notice: a dark veil and a softly rounded window with the companion lamb on its upper rim, a title, the text,
 * and the buttons in the `actions` slot. A tap on the veil or the escape key closes it.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'

const props = withDefaults(defineProps<{ title: string; closable?: boolean }>(), { closable: true })
const emit = defineEmits<{ close: [] }>()

const card = ref<HTMLElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable) emit('close')
}

// focus goes into the dialog, and back to where it was when the dialog closes
const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
onMounted(() => {
  window.addEventListener('keydown', onKey)
  card.value?.focus()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  before?.focus?.()
})
</script>

<template lang="pug">
  div(class="dlg-veil" @click.self="closable && emit('close')")
    div(class="dlg-wrap")
      LkCompanion(class="dlg-lamb" pose="blick" :size="88")
      div(ref="card" tabindex="-1" class="dlg" role="dialog" aria-modal="true" :aria-label="title")
        h2(class="dlg-title") {{ title }}
        div(class="dlg-body")
          slot
        div(class="dlg-actions")
          slot(name="actions")
</template>

<style scoped lang="sass">
.dlg-veil
  position: fixed
  inset: 0
  z-index: 200
  display: grid
  place-items: center
  padding: 20px
  background: rgba(8, 16, 26, 0.6)
  animation: dlg-fade 180ms ease-out

.dlg-wrap
  position: relative
  width: min(100%, 380px)
  margin-top: 60px

.dlg-lamb
  position: absolute
  left: 50%
  top: -62px
  transform: translateX(-50%)
  z-index: 1

.dlg
  max-height: 80vh
  overflow-y: auto
  padding: 32px 20px 20px
  border-radius: var(--lk-r-panel)
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  text-align: center
  color: var(--lk-text)
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.55)
  animation: dlg-pop 220ms ease-out
  outline: none

.dlg-title
  margin: 0 0 8px
  font-family: inherit
  font-weight: 800
  font-size: 1.5rem
  line-height: 1.15

.dlg-body
  font-size: 1.02rem
  line-height: 1.5
  color: var(--lk-muted)

.dlg-actions
  display: flex
  flex-direction: column
  align-items: stretch
  gap: 10px
  margin-top: 16px

  :deep(.adv-btn)
    width: 100%

@keyframes dlg-fade
  from
    opacity: 0

@keyframes dlg-pop
  from
    opacity: 0
    transform: translateY(10px)

@media (prefers-reduced-motion: reduce)
  .dlg-veil, .dlg
    animation: none
</style>
