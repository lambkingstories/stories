<script setup lang="ts">
/**
 * A piece of aged parchment on the map table. `card` is the big one (a question, a word, a story step, the rules) with an olive border
 * and a wax seal, `strip` the narrow one (a name, a hint). The text goes in the slot, in dark ink.
 */
import { computed } from 'vue'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ kind?: 'card' | 'strip'; lit?: boolean; dim?: boolean }>(), { kind: 'card', lit: false, dim: false })
const src = computed(() => `url(${prependBaseUrl(`images/familie/karte/${props.kind === 'strip' ? 'pergament-streifen' : 'pergament-karte'}.webp`)})`)
</script>

<template lang="pug">
  div(:class="['mpa', 'mpa--' + kind, { 'is-lit': lit, 'is-dim': dim }]" :style="{ backgroundImage: src }")
    div(class="mpa-in")
      slot
</template>

<style scoped lang="sass">
.mpa
  position: relative
  box-sizing: border-box
  width: 100%
  background-color: #ecdcb6
  background-size: 100% 100%
  background-repeat: no-repeat
  color: var(--mp-ink, #3a2812)
  font-family: var(--mp-serif, Georgia, serif)
  filter: drop-shadow(0 6px 8px rgba(10, 5, 0, 0.55))
  transition: filter 0.25s, opacity 0.25s, transform 0.25s

  &.is-lit
    filter: drop-shadow(0 0 14px rgba(255, 205, 100, 0.95)) drop-shadow(0 6px 8px rgba(10, 5, 0, 0.55))

  &.is-dim
    opacity: 0.55

.mpa--card
  min-height: 150px
  border-radius: 14px
  .mpa-in
    padding: 16% 12% 11%

.mpa--strip
  min-height: 52px
  border-radius: 8px
  .mpa-in
    display: flex
    align-items: center
    min-height: 52px
    padding: 8px 7% 8px 14%

.mpa-in
  font-size: 1.15rem
  line-height: 1.35
  text-align: center
  font-weight: 600
</style>
