<script setup lang="ts">
/**
 * The sign for everything that belongs to LambKing Plus: a golden crown and the word "Plus" on a shining golden plate.
 * There is no lock on it: Plus is something special to look forward to, not something that is shut.
 * It looks the same everywhere in the app, one size and one glint (Anton 22.11.2026): no small and big plates.
 * Whoever has Plus does not see it any more (Anton, 18.11.2026): the sign is only there to show what Plus would open, and it comes back when
 * Plus ends. `always` keeps it where the page is about Plus itself (the Plus page and the list of features).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isPlus } from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ always?: boolean }>(), { always: false })
const shown = computed(() => props.always || !isPlus())

const { t } = useI18n({ useScope: 'global' })
const crown = prependBaseUrl('images/icons/navi/plus.webp')
</script>

<template lang="pug">
  span(v-if="shown" class="plus-badge" role="img" :aria-label="t('app.adventure.plusBadgeLabel')")
    img(:src="crown" alt="" draggable="false" class="plus-badge-crown")
    span(class="plus-badge-word") {{ t('app.adventure.plusBadge') }}
</template>

<style scoped lang="sass">
.plus-badge
  position: relative
  display: inline-flex
  // never narrower than its own content, whatever box it sits in (in a narrow box the word "Plus" was cut off)
  flex: none
  width: max-content
  max-width: none
  align-items: center
  gap: 4px
  padding: 2px 10px 2px 6px
  border-radius: 999px
  overflow: hidden
  background: linear-gradient(180deg, #fff1b3 0%, #f7cf55 48%, #e0a82a 100%)
  border: 1.5px solid #fff8dc
  box-shadow: 0 2px 6px rgba(120, 80, 10, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.9)
  color: #5a3a06
  font-weight: 900
  font-size: 0.78rem
  letter-spacing: 0.04em
  line-height: 1.2
  white-space: nowrap

  // a slow glint that runs over the plate
  &::after
    content: ''
    position: absolute
    top: 0
    bottom: 0
    left: -60%
    width: 40%
    background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.75), transparent)
    transform: skewX(-18deg)
    animation: plus-glint 3.6s ease-in-out infinite

.plus-badge-crown
  display: block
  width: 20px
  height: 20px
  object-fit: contain
  filter: drop-shadow(0 1px 1px rgba(90, 58, 6, 0.4))

.plus-badge-word
  position: relative
  z-index: 1

// only transform moves (it runs on the graphics chip); animating `left` made the whole page lay itself out again on every frame
@keyframes plus-glint
  0%, 55%
    transform: translateX(0) skewX(-18deg)
  100%
    transform: translateX(575%) skewX(-18deg)

@media (prefers-reduced-motion: reduce)
  .plus-badge::after
    animation: none
    display: none
</style>
