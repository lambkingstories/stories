<script setup lang="ts">
/** "Keep playing": shown on the setup page of a game when a round was begun and left. A short line (where it stands) and the brass button. */
import { useI18n } from 'vue-i18n'
import MapPaper from './MapPaper.vue'
import MapButton from './MapButton.vue'

defineProps<{ info?: string }>()
const emit = defineEmits<{ resume: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="mrs")
    MapPaper(v-if="info" kind="strip")
      span(class="mrs-info") {{ info }}
    MapButton(@click="emit('resume')") {{ t('app.family.resume') }}
</template>

<style scoped lang="sass">
.mrs
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  width: 100%

.mrs-info
  display: block
  width: 100%
  text-align: center
  font-size: 0.95rem
  font-weight: 700
</style>
