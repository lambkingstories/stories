<script setup lang="ts">
/**
 * The awards a finished stage (or the exam) has just brought, as pictures (Anton, 17.11.2026: not as a line of text): every award is its painted
 * medal with its short name under it, the medals pop in one after the other. Nothing is shown when no award was won.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useAwards from '@/use/useAwards'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ ids: string[] }>()
const { t } = useI18n({ useScope: 'global' })
const awards = useAwards()

const shown = computed(() =>
  props.ids.map((id) => {
    const a = awards.list.value.find((x) => x.id === id)
    return { id, image: prependBaseUrl(`images/awards/${a?.image ?? 'star'}.webp`), title: t(`app.awards.items.${id}.title`) }
  })
)
const star = prependBaseUrl('images/awards/star.webp')
function onError(e: Event) {
  const el = e.target
  if (el instanceof HTMLImageElement && el.src !== star) el.src = star
}
</script>

<template lang="pug">
  div(v-if="shown.length" class="na" data-test="new-awards" role="group" :aria-label="t('app.awards.newAward')")
    span(class="na-kicker") {{ t('app.awards.newAward') }}
    ul(class="na-row")
      li(v-for="(a, i) in shown" :key="a.id" class="na-item" :style="{ '--i': i }")
        img(:src="a.image" alt="" class="na-img" draggable="false" @error="onError")
        span(class="na-name") {{ a.title }}
</template>

<style scoped lang="sass">
.na
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  margin: 12px 0

.na-kicker
  font-size: 0.78rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: var(--lk-muted)

.na-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px 14px
  margin: 0
  padding: 0
  list-style: none

.na-item
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  width: 92px
  animation: na-pop 0.6s ease-out both
  animation-delay: calc(var(--i) * 0.18s)

.na-img
  width: 76px
  height: 76px
  object-fit: contain
  filter: drop-shadow(0 4px 6px rgba(40, 30, 10, 0.3))

.na-name
  font-size: 0.82rem
  font-weight: 800
  line-height: 1.2
  color: var(--lk-text)

@keyframes na-pop
  0%
    opacity: 0
    transform: scale(0.5)

  70%
    opacity: 1
    transform: scale(1.12)

  100%
    transform: scale(1)

@media (prefers-reduced-motion: reduce)
  .na-item
    animation: none
</style>
