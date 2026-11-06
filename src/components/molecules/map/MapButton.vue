<script setup lang="ts">
/** The big action button of the map table: a plaque of polished brass (start, next, again). `quiet` is the smaller, darker one for the second choice. */
import { prependBaseUrl } from '@/utils/function'

withDefaults(defineProps<{ quiet?: boolean; disabled?: boolean }>(), { quiet: false, disabled: false })
const emit = defineEmits<{ click: [e: MouseEvent] }>()
const src = `url(${prependBaseUrl('images/familie/karte/knopf.webp')})`
</script>

<template lang="pug">
  button(type="button" :class="['mb', { 'is-quiet': quiet }]" :style="{ backgroundImage: src }" :disabled="disabled" @click="emit('click', $event)")
    span(class="mb-text")
      slot
</template>

<style scoped lang="sass">
.mb
  position: relative
  box-sizing: border-box
  display: inline-grid
  place-items: center
  min-width: 220px
  max-width: 100%
  height: 68px
  padding: 0 38px
  border: 2px solid #f6dd8f
  border-radius: 14px
  box-shadow: 0 0 0 2px rgba(28, 18, 6, 0.9), inset 0 0 0 1px rgba(70, 45, 10, 0.55)
  background-color: #a27a33
  background-size: 100% 100%
  background-repeat: no-repeat
  color: #2e1f0a
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.2rem
  font-weight: 800
  letter-spacing: 0.06em
  text-shadow: 0 1px 0 rgba(255, 238, 180, 0.55)
  filter: drop-shadow(0 5px 6px rgba(10, 5, 0, 0.6))
  cursor: pointer
  transition: transform 0.15s, filter 0.2s
  -webkit-tap-highlight-color: transparent

  &:active:not(:disabled)
    transform: translateY(2px) scale(0.98)

  &:disabled
    filter: grayscale(0.8) brightness(0.7) drop-shadow(0 3px 4px rgba(10, 5, 0, 0.5))
    cursor: default

  &.is-quiet
    min-width: 170px
    height: 54px
    font-size: 1rem
    filter: saturate(0.7) brightness(0.82) drop-shadow(0 4px 5px rgba(10, 5, 0, 0.55))

.mb-text
  display: block
  line-height: 1.1
  text-align: center
</style>
