<script setup lang="ts">
/** A big round bronze medallion on the map table: the place for one important thing (a question, a word, a picture). The content goes in the slot. */
import { prependBaseUrl } from '@/utils/function'

withDefaults(defineProps<{ size?: number }>(), { size: 260 })
const src = `url(${prependBaseUrl('images/familie/karte/medaillon.webp')})`
</script>

<template lang="pug">
  div(class="mm" :style="{ width: size + 'px', height: size + 'px', backgroundImage: src }")
    div(class="mm-in")
      slot
</template>

<style scoped lang="sass">
.mm
  position: relative
  box-sizing: border-box
  max-width: 100%
  border-radius: 50%
  background-color: #8a6428
  background-size: 100% 100%
  filter: drop-shadow(0 8px 10px rgba(10, 5, 0, 0.6))
  font-family: var(--mp-serif, Georgia, serif)

.mm-in
  position: absolute
  inset: 17%
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center
  color: #fff1cf
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.25
  text-shadow: 0 1px 2px rgba(20, 10, 0, 0.8)
</style>
