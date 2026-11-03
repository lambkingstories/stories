<script setup lang="ts">
/** The right page of a coloring book that is lying open: the picture as it looks now (the child's paint underneath, the line art multiplied on top). */
defineProps<{ line: string; layer?: string; alt: string; faded?: boolean }>()
</script>

<template lang="pug">
  div(class="sp-art")
    img(v-if="layer" class="sp-paint" :src="layer" alt="" draggable="false")
    img(class="sp-line" :class="{ faded }" :src="line" :alt="alt" draggable="false")
</template>

<style scoped lang="sass">
.sp-art
  position: absolute
  inset: 0
  padding: clamp(6px, 3%, 18px)
  background: #ffffff

  img
    position: absolute
    inset: clamp(6px, 3%, 18px)
    width: calc(100% - 2 * clamp(6px, 3%, 18px))
    height: calc(100% - 2 * clamp(6px, 3%, 18px))
    object-fit: contain
    pointer-events: none
    user-select: none

.sp-line
  mix-blend-mode: multiply

  &.faded
    opacity: 0.35
</style>
