<script setup lang="ts">
/**
 * A picture of a game that may not be there yet (the pictures of the new Jakob games come later): the one place that loads it. When the file is missing or cannot be read,
 * a quiet one-colour shape stands in its place, with the name of the picture on it only in the test build (`VITE_LOCAL_TEST_BOOKS`, or the development server).
 * Nothing else of the game depends on it: when the picture file is put at the path of the data, the picture appears and the stand-in is gone.
 */
import { computed, ref, watch } from 'vue'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ src: string; label?: string; colour?: string; ratio?: number; round?: boolean }>(), { label: '', colour: '#b9a77a', ratio: 1, round: false })
const failed = ref(false)
watch(() => props.src, () => (failed.value = false))
const testBuild = import.meta.env.DEV || import.meta.env.VITE_LOCAL_TEST_BOOKS === 'true'
const showLabel = computed(() => testBuild && !!props.label)
</script>

<template lang="pug">
  span(class="gi")
    img(v-if="!failed" :src="prependBaseUrl(src)" alt="" draggable="false" @error="failed = true")
    span(v-else class="gi-stand" :class="{ round }" :style="{ background: colour, aspectRatio: String(ratio) }" aria-hidden="true")
      span(v-if="showLabel" class="gi-name") {{ label }}
</template>

<style scoped lang="sass">
.gi
  display: block
  width: 100%
  pointer-events: none

  img
    display: block
    width: 100%
    height: auto

.gi-stand
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  border-radius: 14%
  border: 2px solid rgba(255, 255, 255, 0.7)
  box-shadow: 0 2px 4px rgba(40, 30, 10, 0.4)
  overflow: hidden

  &.round
    border-radius: 50%

.gi-name
  font-size: 16px
  font-weight: 800
  line-height: 1.1
  text-align: center
  color: #3a2c10
  padding: 2px
  overflow-wrap: anywhere
</style>
