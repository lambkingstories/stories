<script setup lang="ts">
/**
 * Amount picker for the iOS tip. Each row is its own consumable in App Store
 * Connect — see `useTips` for why this is a tip and not a donation.
 *
 * Shape and behaviour follow `AvatarPickerModal`: teleported to body, closes
 * on backdrop click and Escape, panel capped to the viewport so landscape
 * phones scroll the list rather than the page.
 */
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useTips, { TIP_TIERS } from '@/use/useTips'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n({ useScope: 'global' })
const { status, priceLabels, pendingId, loadTipProducts, buyTip, resetTipStatus } = useTips()

function close() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (!props.open) return
  // Not while StoreKit's own sheet is up — the purchase is out of our hands
  // at that point and closing underneath it would strand the result.
  if (e.key === 'Escape' && status.value !== 'purchasing') close()
}

// Reopening after a thank-you (or a failure) should show the amounts again,
// and asks StoreKit again if it had nothing to sell last time.
watch(() => props.open, (open) => {
  if (!open) return
  resetTipStatus()
  void loadTipProducts()
})

// Only one message at a time, and only for outcomes the user should know
// about — cancelling StoreKit's own sheet just returns to the list.
const notice = computed(() => {
  if (status.value === 'failed') return { key: 'app.tip.failed', tone: 'error' }
  if (status.value === 'unavailable') return { key: 'app.tip.unavailable', tone: 'error' }
  if (status.value === 'pending') return { key: 'app.tip.pending', tone: 'info' }
  return null
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

/** StoreKit's own localized price when we have it, the plain euro amount until then. */
function label(id: string, amount: number): string {
  return priceLabels.value[id] || `${amount} €`
}
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="support-modal")
      div(
        v-if="open"
        class="support-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center px-5"
        @click.self="status !== 'purchasing' && close()"
      )
        div(
          class="support-modal-panel relative w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
        )
          button(
            type="button"
            class="support-modal-close"
            :disabled="status === 'purchasing'"
            :aria-label="t('app.bookDetail.attachmentClose') || 'Close'"
            @click="close"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5")
              path(d="M18 6 6 18M6 6l12 12")

          h3#support-modal-title(class="support-modal-title") {{ t('app.tip.modalTitle') }}

          //- The thank-you replaces the list so a second tap can't double-buy
          //- by accident; the close button and Escape both still work.
          div(v-if="status === 'thanks'" class="support-thanks")
            span(class="support-thanks-icon" aria-hidden="true")
              svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8")
                path(d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z")
            p(class="support-thanks-text") {{ t('app.tip.thanksLong') }}

          template(v-else)
            p(class="support-modal-text") {{ t('app.tip.modalText') }}

            div(class="support-amounts")
              button(
                v-for="tier in TIP_TIERS"
                :key="tier.id"
                type="button"
                class="support-amount"
                :disabled="status === 'purchasing'"
                :aria-label="t('app.tip.buyAria', { price: label(tier.id, tier.amount) })"
                @click="buyTip(tier.id)"
              )
                span(class="support-amount-value") {{ label(tier.id, tier.amount) }}
                span(v-if="pendingId === tier.id" class="support-amount-spinner" aria-hidden="true")

            p(
              v-if="notice"
              :class="['support-notice', `is-${notice.tone}`]"
              role="alert"
            ) {{ t(notice.key) }}

            p(class="support-modal-note") {{ t('app.tip.modalNote') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.support-modal-backdrop
  background-color: rgba(20, 14, 6, 0.55)
  backdrop-filter: blur(4px)

.support-modal-panel
  background: linear-gradient(180deg, #fdf8ed 0%, #f3e6c4 100%)
  border: 1.5px solid #e6d6b5
  border-radius: 24px
  padding: 22px 18px 18px
  box-shadow: 0 18px 50px -12px rgba(58, 42, 18, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  display: flex
  flex-direction: column
  max-height: calc(100dvh - 24px)
  max-width: min(420px, 92vw)

.support-modal-close
  position: absolute
  top: 12px
  right: 12px
  width: 34px
  height: 34px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  background-color: rgba(255, 255, 255, 0.65)
  color: #1a2f4a
  border: 1px solid #e6d6b5
  cursor: pointer

  &:disabled
    opacity: 0.4
    cursor: default

.support-modal-title
  font-size: 19px
  font-weight: 800
  color: #1a2f4a
  text-align: center
  padding: 0 34px
  margin: 0

.support-modal-text
  margin: 8px 0 0
  font-size: 13px
  line-height: 1.45
  color: #7a6b55
  text-align: center

.support-amounts
  display: flex
  flex-direction: column
  gap: 8px
  margin-top: 16px
  overflow-y: auto
  // Room for the last button's drop shadow, which the scroll box clips.
  padding-bottom: 6px

.support-amount
  position: relative
  display: flex
  align-items: center
  justify-content: center
  min-height: 48px
  padding: 10px 16px
  border-radius: 12px
  font-size: 16px
  font-weight: 800
  color: #ffffff
  cursor: pointer
  border: 1px solid #185a88
  background: linear-gradient(180deg, #2f86c4 0%, #1f6fa8 100%)
  box-shadow: 0 4px 0 -1px #14527d, 0 6px 14px -6px rgba(20, 82, 125, 0.7)
  transition: transform 100ms ease-out, box-shadow 100ms ease-out, filter 100ms ease-out

  @media (hover: hover)
    &:hover:not(:disabled)
      filter: brightness(1.06)

  &:active:not(:disabled)
    transform: translateY(3px)
    box-shadow: 0 1px 0 -1px #14527d, 0 3px 8px -6px rgba(20, 82, 125, 0.7)

  &:disabled
    opacity: 0.6
    cursor: default

.support-amount-spinner
  position: absolute
  right: 14px
  width: 16px
  height: 16px
  border-radius: 999px
  border: 2px solid rgba(255, 255, 255, 0.35)
  border-top-color: #ffffff
  animation: support-spin 700ms linear infinite

@keyframes support-spin
  to
    transform: rotate(360deg)

@media (prefers-reduced-motion: reduce)
  .support-amount-spinner
    animation-duration: 2s

.support-notice
  margin: 12px 0 0
  font-size: 13px
  font-weight: 700
  text-align: center

  &.is-error
    color: #a93d2e

  &.is-info
    color: #1a2f4a

.support-modal-note
  margin: 14px 0 0
  font-size: 11px
  line-height: 1.4
  color: #7a6b55
  text-align: center

.support-thanks
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  padding: 22px 6px 10px

.support-thanks-icon
  color: #3f7d3f

.support-thanks-text
  margin: 0
  font-size: 15px
  font-weight: 700
  color: #1a2f4a
  text-align: center
  text-wrap: balance

.support-modal-enter-active, .support-modal-leave-active
  transition: opacity 180ms ease-out

.support-modal-enter-from, .support-modal-leave-to
  opacity: 0
</style>
