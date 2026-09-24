<script setup lang="ts">
/**
 * "Support us" button for the iOS build: opens the amount picker, which buys
 * a consumable tip through StoreKit. The web and Android builds keep
 * `KoFiButton`, which links out to PayPal / Ko-fi — links the App Store does
 * not allow (see `useTips`).
 *
 * Shape and press behaviour mirror `KoFiButton` so the welcome slider looks
 * the same on every platform, including the pointer-driven press state the
 * native WebViews need.
 */
import { onMounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTips from '@/use/useTips'
import SupportModal from '@/components/molecules/SupportModal.vue'

interface Props {
  compact?: boolean
}
withDefaults(defineProps<Props>(), { compact: false })

const { t } = useI18n({ useScope: 'global' })
const { loadTipProducts } = useTips()

// Early, so StoreKit's localized prices are usually in by the time the sheet
// opens. The sheet asks again on every open until StoreKit has answered.
onMounted(() => void loadTipProducts())

const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)

const open = ref(false)
const label = computed(() => t('app.tip.label'))
</script>

<template lang="pug">
  //- Always rendered on iOS. It used to wait for StoreKit to offer the
  //- products, which meant it never appeared at all: Apple wants a review
  //- screenshot of the purchase UI before it releases the products, and the
  //- products are what the button was waiting for.
  span
    button(
      type="button"
      :class="['tip-btn', { 'is-compact': compact, 'is-pressed': pressed }]"
      :aria-label="label"
      aria-haspopup="dialog"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
      @click="open = true"
    )
      span(class="tip-btn-icon" aria-hidden="true")
        svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
          path(d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z")
      span(class="tip-btn-label") {{ label }}

    SupportModal(:open="open" @close="open = false")
</template>

<style scoped lang="sass">
.tip-btn
  --tip-scale: 1
  display: flex
  justify-content: center
  align-items: center
  gap: 8px
  padding: 9px 16px
  border-radius: 8px
  font-size: 13px
  font-weight: 700
  letter-spacing: 0.02em
  color: #ffffff
  cursor: pointer
  user-select: none
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  white-space: nowrap
  border: 1px solid #185a88
  background: linear-gradient(180deg, #2f86c4 0%, #1f6fa8 100%)
  box-shadow: 0 4px 0 -1px #14527d, 0 6px 14px -6px rgba(20, 82, 125, 0.7)
  transition: transform 100ms ease-out, box-shadow 100ms ease-out, filter 100ms ease-out
  transform: scale(var(--tip-scale))

  @media (hover: hover)
    &:hover
      transform: translateY(-1px) scale(var(--tip-scale))
      filter: brightness(1.06)

  &:active, &.is-pressed
    transform: translateY(3px) scale(calc(var(--tip-scale) * 0.96))
    box-shadow: 0 1px 0 -1px #14527d, 0 3px 8px -6px rgba(20, 82, 125, 0.7)

  &:disabled
    opacity: 0.75
    cursor: default

.tip-btn.is-compact
  padding: 7px 12px
  font-size: 12px

.tip-btn-icon
  display: inline-flex
  align-items: center
  justify-content: center
</style>
