<script setup lang="ts">
/** Three chips above a list of books: all of them, the ones I have (bought, free or with Plus) and the ones still to buy, each with its number. */
import { useI18n } from 'vue-i18n'
import type { OwnFilterValue } from '@/utils/bookOwnership'

defineProps<{ modelValue: OwnFilterValue; counts: Record<OwnFilterValue, number> }>()
const emit = defineEmits<{ 'update:modelValue': [v: OwnFilterValue] }>()
const { t } = useI18n({ useScope: 'global' })
const VALUES: OwnFilterValue[] = ['all', 'mine', 'buy']
</script>

<template lang="pug">
  div(class="own-filter" role="radiogroup" :aria-label="t('app.read.ownLabel')")
    button(
      v-for="v in VALUES"
      :key="v"
      type="button"
      role="radio"
      :aria-checked="modelValue === v"
      :class="['own-chip', { 'is-on': modelValue === v }]"
      @click="emit('update:modelValue', v)"
    )
      span {{ t('app.read.own_f_' + v) }}
      span(class="own-n") {{ counts[v] }}
</template>

<style scoped lang="sass">
.own-filter
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin: 4px 0 16px

.own-chip
  display: inline-flex
  align-items: center
  gap: 8px
  min-height: 44px
  padding: 8px 16px
  border-radius: 999px
  border: 2px solid var(--lk-border, #cfc6b4)
  background: var(--lk-surface, #ffffff)
  color: var(--lk-text)
  font: inherit
  font-size: 1rem
  font-weight: 700
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    border-color: var(--lk-accent, #2b7fc4)
    background: var(--lk-accent, #2b7fc4)
    color: #ffffff

.own-n
  min-width: 1.6em
  padding: 0 6px
  border-radius: 999px
  background: rgba(0, 0, 0, 0.12)
  font-size: 0.85rem
  text-align: center
  line-height: 1.6

.is-on .own-n
  background: rgba(255, 255, 255, 0.28)
</style>
