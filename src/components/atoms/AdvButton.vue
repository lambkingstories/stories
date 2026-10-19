<script setup lang="ts">
/**
 * A button of the adventures, in the shape of the whole app: a soft capsule. `gold` is the main action (petrol by day, gold by
 * night), `blau` the quieter one (the same capsule with a fine line). The old painted plaques are no longer used here.
 */
withDefaults(defineProps<{ tone?: 'gold' | 'blau'; disabled?: boolean; small?: boolean }>(), { tone: 'gold', disabled: false, small: false })
const emit = defineEmits<{ click: [e: MouseEvent] }>()
function press(e: MouseEvent) {
  emit('click', e)
}
</script>

<template lang="pug">
  button(
    type="button"
    class="adv-btn lk-btn"
    :class="[tone === 'blau' ? 'lk-btn--outline' : '', small ? 'lk-btn--small' : '']"
    :disabled="disabled"
    @click="press"
  )
    span
      slot
</template>

<style scoped lang="sass">
.adv-btn
  min-width: 200px
  max-width: 100%

  // the quiet button is solid, too (never see-through): it is read over pictures and sand as well as on a plain page
  &.lk-btn--outline
    background: var(--lk-surface)
    border-width: 2px

  &.lk-btn--small
    min-width: 0

  span
    display: block
    font-family: inherit
    font-weight: 600
    line-height: 1.2

  &:disabled
    opacity: 0.5
    cursor: default
</style>
