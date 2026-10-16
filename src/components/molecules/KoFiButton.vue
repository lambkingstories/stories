<script setup lang="ts">
/**
 * Ko-fi donate button. Default styling matches Ko-fi's brand red so it
 * reads as a donate CTA at a glance even when dropped on busy imagery;
 * a `tone="paypal"` variant ships PayPal blue for the placeholder slot
 * we'll keep using Ko-fi for until the PayPal SDK integration lands.
 *
 * Usage:
 *   <KoFiButton href="https://ko-fi.com/lambking" label="Ko-fi" />
 *   <KoFiButton href="https://ko-fi.com/lambking" tone="paypal" label="PayPal" />
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { openExternal } from '@/utils/openExternal'

interface Props {
  href: string
  label?: string
  tone?: 'kofi' | 'paypal'
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Ko-fi',
  tone: 'kofi',
  compact: false
})

const { t } = useI18n({ useScope: 'global' })

/**
 * Press state, driven from pointer events instead of left to `:active` —
 * the same shape `ZButton`/`AButton`/`ZChip` and every other control in the
 * app uses. On the Android WebView `:active` is withheld while the browser
 * decides whether a touch is a tap or the start of a scroll, and these two
 * buttons live *inside* the welcome slider, so the CSS-only press state they
 * shipped with never got a chance to paint. `pointercancel` is what fires
 * when the slider claims the gesture, and it releases the button cleanly.
 */
const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)

/**
 * The element stays an `<a href>` — screen readers announce it as a link,
 * desktop users can still ctrl/cmd-click it into a background tab, and the
 * href is what the fallback below uses. But the *plain* activation is handed
 * to `openExternal`, because `target="_blank"` is silently dropped by the
 * Tauri Android/iOS WebView, which left these two donate buttons dead in the
 * Play Store build. See `src/utils/openExternal.ts`.
 */
function onClick(event: MouseEvent) {
  // Let the browser keep its native meaning for modified clicks (new tab,
  // new window, download) — those only exist on desktop web anyway.
  if (event.defaultPrevented) return
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  void openExternal(props.href)
}
</script>

<template lang="pug">
  a(
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="['kofi-btn', `is-${tone}`, { 'is-compact': compact, 'is-pressed': pressed }]"
    :aria-label="t('app.main.donateVia', { method: label })"
    @click="onClick"
    @pointerdown="onDown"
    @pointerup="onUp"
    @pointerleave="onUp"
    @pointercancel="onUp"
  )
    span(v-if="tone === 'kofi'" class="kofi-btn-icon" aria-hidden="true")
      //- Mug + steam — recognisable as a coffee-tip icon at 18-20px sizes.
      span
        img.kofi-img(class="mt-[2px]" src="https://storage.ko-fi.com/cdn/cup-border.png", alt="Ko-fi")
    span(v-if="tone === 'paypal'" class="kofi-btn-icon -mb-1" aria-hidden="true")
      span
        section(style="font-size: 0.75rem;")
          img(
            src="/images/icons/paypal.webp"
            alt="paypal"
            style="height:0.875rem;vertical-align:middle;")
      //svg(v-else viewBox="0 0 24 24" class="w-full h-full")
      //  path(
      //    d="M5 10h11a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1.2"
      //    fill="none"
      //    stroke="currentColor"
      //    stroke-width="1.8"
      //    stroke-linecap="round"
      //    stroke-linejoin="round"
      //  )
      //  path(
      //    d="M5 10v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-6z"
      //    fill="currentColor"
      //    stroke="currentColor"
      //    stroke-width="1.6"
      //    stroke-linejoin="round"
      //  )
      //  path(
      //    d="M8 3c-.6 1-.6 2 0 3M11 3c-.6 1-.6 2 0 3M14 3c-.6 1-.6 2 0 3"
      //    fill="none"
      //    stroke="currentColor"
      //    stroke-width="1.6"
      //    stroke-linecap="round"
      //    opacity="0.75"
      //  )
    span(class="kofi-btn-label") {{ label }}
</template>

<style scoped lang="sass">
.kofi-btn
  // Any outside size-up (the welcome slider scales these to 130% on small
  // phone viewports) arrives as this variable and is composed into every
  // transform below. A parent that sets `transform` directly would override
  // the press state instead of stacking with it.
  --kofi-scale: 1
  display: flex
  justify-content: center
  align-items: center
  gap: 8px
  padding: 0 22px
  min-height: 52px
  border-radius: 28px
  font-size: 13px
  font-weight: 700
  letter-spacing: 0.02em
  text-decoration: none
  color: #ffffff
  cursor: pointer
  user-select: none
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  // Same 100ms as the ZButton/AButton press so the two sets of buttons on the
  // welcome slider squash at the same speed. Anything slower reads as "no
  // animation" on a quick tap, which is how these felt on device.
  transition: transform 100ms ease-out, box-shadow 100ms ease-out, filter 100ms ease-out
  white-space: nowrap
  transform: scale(var(--kofi-scale))

  // Guarded so a tap on Android can't leave the button stuck in the lifted
  // hover state, which would swallow the press travel below it.
  @media (hover: hover)
    &:hover
      transform: translateY(-1px) scale(var(--kofi-scale))
      filter: brightness(1.06)

  // The travel itself is tone-independent; each tone drops its own rim in the
  // rules below so the button visibly sinks onto the page rather than just
  // shrinking.
  &:active, &.is-pressed
    transform: translateY(3px) scale(calc(var(--kofi-scale) * 0.96))

// Ko-fi brand red with a subtle highlight + darker rim for depth.
.kofi-btn.is-kofi
  background: linear-gradient(180deg, #ff726f 0%, #e2473f 100%)
  border: 1px solid #b53a32
  box-shadow: 0 4px 0 -1px #a2332b, 0 8px 16px -8px rgba(178, 58, 50, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)

  &:active, &.is-pressed
    box-shadow: 0 1px 0 -1px #a2332b, 0 3px 8px -6px rgba(178, 58, 50, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.18)

// PayPal placeholder skin — same shape, PayPal navy/blue gradient.
.kofi-btn.is-paypal
  background: linear-gradient(180deg, #2c8bd9 0%, #1a4d8f 100%)
  border: 1px solid #0e3669
  box-shadow: 0 4px 0 -1px #0b2c56, 0 8px 16px -8px rgba(14, 54, 105, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)

  &:active, &.is-pressed
    box-shadow: 0 1px 0 -1px #0b2c56, 0 3px 8px -6px rgba(14, 54, 105, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.18)

// Compact variant — shrinks to fit the welcome-slide overlay without
// crowding the dots row beneath it.
.kofi-btn.is-compact
  padding: 7px 12px
  font-size: 12px
  gap: 6px

.kofi-btn-icon
  display: inline-flex
  width: 18px
  height: 18px
  color: #ffffff

.kofi-btn.is-compact .kofi-btn-icon
  width: 16px
  height: 16px

.kofi-btn-label
  line-height: 1

// Respect the OS "reduce motion" switch the way a press animation should:
// keep the state change legible (the rim still collapses) but drop the travel.
@media (prefers-reduced-motion: reduce)
  .kofi-btn
    transition: box-shadow 100ms ease-out

    &:active, &.is-pressed
      transform: scale(var(--kofi-scale))
</style>
