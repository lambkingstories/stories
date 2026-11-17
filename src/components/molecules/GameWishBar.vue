<script setup lang="ts">
/**
 * The friendly bar "You may pick a game!" with a star for every free wish. Only there when a wish is free; a tap (if the parent wants one)
 * is for the parent to handle, the bar itself only tells.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ free: number }>()
const { t } = useI18n({ useScope: 'global' })
/** Up to five little stars; more wishes show the number as well. */
const shown = computed(() => Math.min(5, props.free))
</script>

<template lang="pug">
  div(v-if="free > 0" class="gw" role="status")
    span(class="gw-stars" aria-hidden="true")
      img(v-for="i in shown" :key="i" :src="prependBaseUrl('images/abenteuer/ui/stern-gold-1.webp')" alt="" draggable="false" class="gw-star")
    span(class="gw-text") {{ t('app.bigGames.wishes', { n: free }, free) }}
</template>

<style scoped lang="sass">
.gw
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-radius: 20px
  border: 2px solid #d4a83e
  background: rgba(255, 244, 196, 0.9)
  box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.35)
  color: #3d2c00

.gw-stars
  display: flex
  flex: 0 0 auto

.gw-star
  width: 26px
  height: 26px
  margin-right: -6px
  object-fit: contain
  animation: gw-glint 2.4s ease-in-out infinite

  &:nth-child(2)
    animation-delay: 0.3s

  &:nth-child(3)
    animation-delay: 0.6s

  &:nth-child(4)
    animation-delay: 0.9s

  &:nth-child(5)
    animation-delay: 1.2s

.gw-text
  font-weight: 800
  font-size: 1.05rem
  line-height: 1.25

@keyframes gw-glint
  0%, 60%, 100%
    transform: scale(1)

  30%
    transform: scale(1.18)

@media (prefers-reduced-motion: reduce)
  .gw-star
    animation: none
</style>
