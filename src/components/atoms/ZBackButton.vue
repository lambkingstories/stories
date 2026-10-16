<script setup lang="ts">
/**
 * Shared back-button atom. The arrow asset is painted via CSS
 * `mask-image` so the colour can match the parchment theme regardless
 * of the source PNG/WebP — swap `--back-color` per variant to tint it.
 *
 * Variants:
 *   - `flat`     transparent (sits on the page background — Serien,
 *                Neu in der Bibliothek, Mein Bereich headers)
 *   - `floating` cream-parchment pill with shadow (sits on top of an
 *                image hero — BookDetail, BookSeries)
 *   - `reader`   same surface as `floating` but absolutely positioned
 *                inside a fixed-overlay context (AppReaderView)
 */
import { useI18n } from 'vue-i18n'

interface Props {
  variant?: 'flat' | 'floating' | 'reader'
  ariaLabel?: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  variant: 'flat',
  ariaLabel: '',
  size: 38
})

defineEmits(['click'])

const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  button(
    type="button"
    :class="['z-back-btn', `z-back-btn--${variant}`]"
    :aria-label="ariaLabel || t('app.bookDetail.back')"
    :style="{ width: size + 'px', height: size + 'px' }"
    @click="$emit('click')"
  )
    span(class="z-back-btn-icon" aria-hidden="true")
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.z-back-btn
  display: inline-flex
  align-items: center
  justify-content: center
  padding: 0
  border: none
  cursor: pointer
  background: transparent
  transition: transform 150ms ease-out, background-color 150ms ease-out, box-shadow 150ms ease-out

  &:active
    transform: scale(0.92)

// Painted glyph — `mask-image` lets us recolour the asset via
// background-color so we can tint it brown without re-exporting.
.z-back-btn-icon
  width: 70%
  height: 70%
  display: block
  background-color: var(--back-icon-color, var(--lk-text))
  -webkit-mask-image: url('/images/icons/back-icon_128x105.webp')
  mask-image: url('/images/icons/back-icon_128x105.webp')
  -webkit-mask-repeat: no-repeat
  mask-repeat: no-repeat
  -webkit-mask-position: center
  mask-position: center
  -webkit-mask-size: contain
  mask-size: contain
  pointer-events: none
  filter: drop-shadow(0 1px 1px rgba(58, 42, 18, 0.18))

// Flat — transparent over a cream background. Warm brown glyph picks up
// the parchment palette and reads instantly without a contrasting pill.
.z-back-btn--flat
  border-radius: 999px
  --back-icon-color: var(--lk-text)

  &:hover
    background-color: rgba(255, 255, 255, 0.5)

// Floating — cream parchment pill over a hero image. Glyph stays brown
// for the same parchment-tone consistency.
.z-back-btn--floating, .z-back-btn--reader
  border-radius: 999px
  background-color: rgba(255, 255, 255, 0.85)
  border: 1.5px solid rgba(230, 214, 181, 0.6)
  box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.35)
  --back-icon-color: #1a2f4a

  &:hover
    background-color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.94)
</style>
