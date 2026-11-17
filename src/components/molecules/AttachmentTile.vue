<script setup lang="ts">
/**
 * Square tile that represents a single book attachment in the BookDetail
 * view. Tap/click bubbles a `select` event with the underlying attachment
 * — the parent decides where to anchor the context menu.
 */
import { computed } from 'vue'
import type { ApiBookAttachment } from '@/types/apiBook'

const props = defineProps<{ attachment: ApiBookAttachment }>()
defineEmits<{ select: [att: ApiBookAttachment, e: MouseEvent] }>()

// Preview image first. For coloring attachments without a preview, fall
// back to the data URL — but only when it's an image (jpg/png/webp). PDF
// data URLs can't render in `<img>`, so we drop to the icon-only state and
// the caller's preview-image is the only way to get a thumbnail.
function looksLikePdf(url: string): boolean {
  return /\.pdf(?:\?.*)?$/i.test(url)
}
const previewSrc = computed<string>(() => {
  const a = props.attachment
  if (a.previewImage) return a.previewImage
  if (a.type === 'coloring' && a.data && !looksLikePdf(a.data)) return a.data
  return ''
})

const isPdf = computed(() => !previewSrc.value)
</script>

<template lang="pug">
  button(
    type="button"
    class="att-tile"
    :class="{ 'is-pdf': isPdf }"
    :aria-label="attachment.type === 'coloring' ? 'Ausmal-Bild' : 'PDF-Anhang'"
    @click="$emit('select', attachment, $event)"
  )
    img(
      v-if="previewSrc"
      :src="previewSrc"
      alt=""
      class="att-thumb"
      draggable="false"
    )
    div(v-else class="att-pdf-glyph" aria-hidden="true") 📄
    span(
      class="att-badge"
      :class="attachment.type"
    ) {{ attachment.type === 'coloring' ? 'Ausmalen' : 'PDF' }}
</template>

<style scoped lang="sass">
.att-tile
  position: relative
  width: 100%
  aspect-ratio: 1 / 1
  padding: 0
  border: 1px solid rgba(126, 58, 242, 0.18)
  border-radius: 16px
  background: linear-gradient(180deg, #ffffff 0%, #fdf7ef 100%)
  overflow: hidden
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 2px 6px -3px rgba(30, 30, 60, 0.18), 0 14px 28px -16px rgba(30, 30, 60, 0.32)
  transition: transform 160ms ease-out, box-shadow 160ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 4px 10px -3px rgba(30, 30, 60, 0.22), 0 20px 36px -16px rgba(30, 30, 60, 0.36)

  &:active
    transform: scale(0.98)

  &.is-pdf
    background: linear-gradient(180deg, #fff7ed 0%, #ffe4cc 100%)

.att-thumb
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  // Squash to fill the square tile fully — no cropping, no letterboxing.
  // The artwork is uniformly only a thumbnail at this size, so the slight
  // aspect distortion is acceptable in exchange for never hiding part of
  // the preview behind a crop.
  object-fit: fill
  user-select: none
  -webkit-user-drag: none

.att-pdf-glyph
  position: absolute
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  font-size: 44px
  line-height: 1
  filter: drop-shadow(0 4px 10px rgba(180, 110, 50, 0.3))

.att-badge
  position: absolute
  bottom: 6px
  left: 6px
  padding: 2px 8px
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.05em
  text-transform: uppercase
  color: #fff
  border-radius: 999px
  background: linear-gradient(135deg, #5dade2 0%, #2980b9 100%)
  box-shadow: 0 3px 8px -2px rgba(41, 128, 185, 0.45)

.att-badge.coloring
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)
  box-shadow: 0 3px 8px -2px rgba(234, 88, 12, 0.45)
</style>
