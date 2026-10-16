<script setup lang="ts">
/**
 * The companion lamb of the new design: one picture per place, in the pose that fits it. The pictures are made as separate
 * files (transparent WebP in `public/images/maskottchen/<pose>.webp`, the lamb standing or sitting at the bottom edge of the file)
 * and are never cut out of mockups. While a file does not exist the lamb is simply not shown (no broken picture).
 * The poses: blick (looks over the rim of a window), winken (waves), sitzen (sits on the rim of a card), lesen (reads),
 * stift (holds a pencil), buch (holds the Bible), kompass (with a compass), leer (shrugs, empty state), offline (no net).
 */
import { ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'

export type CompanionPose = 'blick' | 'winken' | 'sitzen' | 'lesen' | 'stift' | 'buch' | 'kompass' | 'leer' | 'offline'

withDefaults(defineProps<{ pose?: CompanionPose; size?: number; flip?: boolean }>(), { pose: 'blick', size: 84, flip: false })

const missing = ref(false)
// an old memory of the app may hold the page instead of the picture: one more try with a new address
const tries = ref(0)
function failed() {
  if (tries.value === 0) tries.value = 1
  else missing.value = true
}
</script>

<template lang="pug">
  img(
    v-show="!missing"
    class="companion"
    :src="prependBaseUrl(`images/maskottchen/${pose}.webp`) + (tries ? `?r=${tries}` : '')"
    alt=""
    aria-hidden="true"
    draggable="false"
    decoding="async"
    :style="{ height: size + 'px', transform: flip ? 'scaleX(-1)' : undefined }"
    @error="failed"
  )
</template>

<style scoped lang="sass">
.companion
  display: block
  width: auto
  pointer-events: none
  -webkit-user-select: none
  user-select: none
</style>
