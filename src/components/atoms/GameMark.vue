<script setup lang="ts">
/**
 * The sign that goes with the green or red glow of a game: a tick for right, a cross for wrong. The color is never the only
 * message (color-blind children see the shape); the parent places it (`position: absolute`).
 */
defineProps<{ kind: 'good' | 'bad' }>()
</script>

<template lang="pug">
  span(class="gm" :class="kind" aria-hidden="true") {{ kind === 'good' ? '✓' : '✕' }}
</template>

<style scoped lang="sass">
.gm
  display: inline-flex
  align-items: center
  justify-content: center
  width: 30px
  height: 30px
  border-radius: 50%
  border: 3px solid #fff
  color: #fff
  font-family: 'Nunito', sans-serif
  font-weight: 900
  font-size: 1.1rem
  line-height: 1
  pointer-events: none
  box-shadow: 0 2px 6px rgba(40, 25, 5, 0.5)
  animation: gm-pop 320ms cubic-bezier(0.2, 1.5, 0.4, 1)

  &.good
    background: #2fae54

  &.bad
    background: #d63031

@keyframes gm-pop
  from
    transform: scale(0.3)
    opacity: 0

@media (prefers-reduced-motion: reduce)
  .gm
    animation: none
</style>
