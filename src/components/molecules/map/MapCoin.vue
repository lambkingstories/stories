<script setup lang="ts">
/**
 * An answer coin (bronze, copper, silver, blue enamel, without any mark). The answer text goes in
 * the slot. `state` shows what happened: `right` shines, `wrong` sinks away, `dim` rests, `picked` is raised.
 */
import { computed } from 'vue'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ index: number; state?: 'idle' | 'picked' | 'right' | 'wrong' | 'dim'; disabled?: boolean }>(), { state: 'idle', disabled: false })
const emit = defineEmits<{ click: [] }>()
const src = computed(() => `url(${prependBaseUrl(`images/familie/karte/muenze-leer-${(props.index % 4) + 1}.webp`)})`)
</script>

<template lang="pug">
  button(
    type="button"
    :class="['mc', 'mc--' + (index % 4), 'is-' + state]"
    :style="{ backgroundImage: src }"
    :disabled="disabled"
    @click="emit('click')"
  )
    span(class="mc-text")
      slot
</template>

<style scoped lang="sass">
.mc
  position: relative
  box-sizing: border-box
  width: 100%
  aspect-ratio: 1
  border: 0
  border-radius: 50%
  padding: 0
  background-color: #7a5a2a
  background-size: 100% 100%
  background-repeat: no-repeat
  color: #fff1cf
  font: inherit
  cursor: pointer
  filter: drop-shadow(0 6px 7px rgba(10, 5, 0, 0.6))
  transition: transform 0.18s, filter 0.25s, opacity 0.25s
  -webkit-tap-highlight-color: transparent

  &:active:not(:disabled)
    transform: scale(0.96)

  &.is-picked
    transform: scale(1.06) translateY(-3px)

  &.is-right
    transform: scale(1.08)
    filter: drop-shadow(0 0 16px rgba(255, 220, 110, 1)) drop-shadow(0 0 6px rgba(255, 240, 170, 0.9))

  &.is-wrong
    opacity: 0.45
    filter: grayscale(0.7) drop-shadow(0 3px 4px rgba(10, 5, 0, 0.5))
    transform: scale(0.94)

  &.is-dim
    opacity: 0.55

// the words lie in the big smooth middle of the coin
.mc-text
  position: absolute
  left: 15%
  right: 15%
  top: 20%
  bottom: 20%
  display: flex
  align-items: center
  justify-content: center
  text-align: center
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.2rem
  font-weight: 800
  line-height: 1.15
  text-shadow: 0 1px 2px rgba(20, 10, 0, 0.85)
  overflow: hidden

.mc--2 .mc-text
  color: #14100a
  font-weight: 800
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65)
</style>
