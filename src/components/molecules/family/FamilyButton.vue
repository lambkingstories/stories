<script setup lang="ts">
/**
 * Familien-Spiele v2: the buttons of the family games (replaces `MapButton`, the brass plaque). `primary`: a filled teal capsule, at least
 * 56 px high, white bold text, soft golden ring when focused, a light press effect. `secondary` (or the short form `quiet`): a white capsule with
 * a teal line. The text is always centred. `full` stretches it over the width of its place.
 */
withDefaults(defineProps<{ kind?: 'primary' | 'secondary'; quiet?: boolean; disabled?: boolean; full?: boolean }>(), { kind: 'primary', quiet: false, disabled: false, full: false })
const emit = defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template lang="pug">
  button(type="button" :class="['fam-btn', quiet || kind === 'secondary' ? 'fam-btn--secondary' : 'fam-btn--primary', { 'is-full': full }]" :disabled="disabled" @click="emit('click', $event)")
    span(class="fam-btn-text")
      slot
</template>

<style scoped lang="sass">
.fam-btn
  position: relative
  box-sizing: border-box
  display: inline-flex
  align-items: center
  justify-content: center
  min-width: 220px
  max-width: 100%
  min-height: 56px
  padding: 8px 32px
  border: 2px solid transparent
  border-radius: 999px
  font: inherit
  font-size: 1.1rem
  font-weight: 800
  line-height: 1.2
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 3px

  &:disabled
    opacity: 0.45
    cursor: default
    box-shadow: none

  &.is-full
    display: flex
    width: 100%

.fam-btn--primary
  background: var(--fam-primary)
  border-color: var(--fam-primary)
  color: var(--fam-on-primary)
  box-shadow: 0 4px 0 var(--fam-primary-deep), 0 12px 18px -10px rgba(10, 40, 40, 0.55)

  &:active:not(:disabled)
    transform: translateY(3px)
    box-shadow: 0 1px 0 var(--fam-primary-deep), 0 4px 8px -6px rgba(10, 40, 40, 0.5)

.fam-btn--secondary
  min-width: 170px
  background: var(--fam-card)
  border-color: var(--fam-primary-ink)
  color: var(--fam-primary-ink)
  box-shadow: 0 2px 0 var(--fam-line), 0 8px 14px -12px rgba(10, 40, 40, 0.4)

  &:active:not(:disabled)
    transform: translateY(2px)
    box-shadow: none

.fam-btn-text
  display: block
  text-align: center
</style>
