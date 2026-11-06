<script setup lang="ts">
/** The right page of a coloring book that is lying open: the picture as it looks now (the child's paint underneath, the line art multiplied on top). */
defineProps<{ line: string; layer?: string; alt: string; faded?: boolean }>()
</script>

<template lang="pug">
  div(class="sp-art")
    img(v-if="layer" class="sp-paint" :src="layer" alt="" draggable="false")
    img(class="sp-line" :class="{ faded }" :src="line" :alt="alt" draggable="false")
    //- a picture that is not open yet is shown blurred: two more copies on top (each multiplied) bring the soft grey lines back to a dark grey,
    //- so the picture can still be made out while the edges are not clear
    template(v-if="faded")
      img(v-for="n in 2" :key="n" class="sp-line faded" :src="line" alt="" draggable="false")
</template>

<style scoped lang="sass">
.sp-art
  position: absolute
  inset: 0
  container-type: inline-size
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

  // a picture that is not open yet (Antons Wunsch 6.11.2026): so blurred that the edges are not clear, but the picture can still be made
  // out. The contrast lifts the soft grey back up, so it does not just fade away.
  // (the blur grows with the width of the page: `cqw` is one hundredth of it; the first line is for old phones)
  &.faded
    filter: blur(2px)
    filter: blur(clamp(1.5px, 0.8cqw, 5px))
</style>
