<script setup lang="ts">
import { onImgFallback, PLACEHOLDER_IMAGE } from '@/utils/placeholder'
// Standalone book card — used by the reader's celebration page to surface
// the next volume, but generic enough to reuse anywhere we need a compact,
// image-led card.

interface Props {
  title: string
  subtitle?: string
  image?: string
  coverGradient?: string
  badge?: string
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  image: '',
  coverGradient: '',
  badge: '',
  progress: 0
})

defineEmits<{ (e: 'click'): void }>()

function progressPct() {
  const p = Math.min(1, Math.max(0, props.progress ?? 0))
  return `${Math.round(p * 100)}%`
}
</script>

<template lang="pug">
  button(
    type="button"
    class="a-book-card"
    @click="$emit('click')"
  )
    div(class="cover")
      div(
        class="cover-bg"
        :style="{ background: coverGradient || 'linear-gradient(135deg,#9560f4,#7e3af2)' }"
      )
      img(
        :src="image || PLACEHOLDER_IMAGE"
        :alt="title"
        class="cover-img"
        loading="lazy"
        @error="onImgFallback"
      )
      span(v-if="badge" class="badge") {{ badge }}
    div(class="body")
      h3(class="card-title") {{ title }}
      p(v-if="subtitle" class="card-subtitle") {{ subtitle }}
      div(
        v-if="progress > 0"
        class="progress-track"
        :aria-label="'Fortschritt ' + progressPct()"
      )
        div(class="progress-fill" :style="{ width: progressPct() }")
</template>

<style scoped lang="sass">
.a-book-card
  display: flex
  flex-direction: column
  width: 100%
  max-width: 260px
  padding: 0
  margin: 0 auto
  border: none
  background: linear-gradient(180deg, #ffffff 0%, #fdf7ef 100%)
  border-radius: 22px
  box-shadow: 0 4px 10px -4px rgba(30, 30, 60, 0.15), 0 20px 40px -18px rgba(30, 30, 60, 0.35)
  overflow: hidden
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 6px 14px -4px rgba(30, 30, 60, 0.2), 0 26px 48px -18px rgba(30, 30, 60, 0.4)

  &:active
    transform: scale(0.98)

.cover
  position: relative
  width: 100%
  aspect-ratio: 4 / 3

.cover-bg
  position: absolute
  inset: 0

.cover-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover

.badge
  position: absolute
  top: 10px
  left: 10px
  padding: 3px 10px
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #fff
  background: linear-gradient(135deg, #ff7a59 0%, #ff4d8d 100%)
  border-radius: 999px
  box-shadow: 0 4px 10px -3px rgba(255, 80, 140, 0.4)

.body
  padding: 14px 16px 16px

.card-title
  font-size: 17px
  font-weight: 700
  color: #1a1a1a
  line-height: 1.25
  text-align: left

.card-subtitle
  margin-top: 4px
  font-size: 13px
  font-weight: 700
  color: #6b5a3e
  text-align: left

.progress-track
  margin-top: 10px
  height: 6px
  background: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.progress-fill
  height: 100%
  background: linear-gradient(90deg, #ffd645 0%, #ff8b3a 100%)
  border-radius: inherit
  transition: width 220ms ease-out
</style>
