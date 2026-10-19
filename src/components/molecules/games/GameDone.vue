<script setup lang="ts">
/** The end of a game: the stars (with their little celebration), a short line, and the button that goes on. */
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useTaskProgress from '@/use/useTaskProgress'

defineProps<{ stars: number; text?: string }>()
defineEmits<{ next: [] }>()
const { t } = useI18n({ useScope: 'global' })
// the game is over: the stage page stops offering "go on with one star for what you did"
useTaskProgress().finish()
</script>

<template lang="pug">
  div(class="gd")
    AdventureStars(:stars="stars" :size="54" celebrate class="gd-stars")
    p(v-if="text" class="gd-text" role="status") {{ text }}
    AdvButton(tone="gold" @click="$emit('next')") {{ t('app.adventure.next') }}
</template>

<style scoped lang="sass">
.gd
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  padding-top: 10px

.gd-stars
  margin: 18px 0 22px

.gd-text
  margin: 0 0 6px
  text-align: center
  font-weight: 700
  font-size: 1.05rem
  color: #2f6b3f
</style>
