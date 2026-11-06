<script setup lang="ts">
/**
 * The sign on a book that says what the person has of it: Gratis (free), Gekauft (bought), Mit Plus (opened by the subscription),
 * or a plain "Zu kaufen" plate (still to buy). One look at a shelf shows which books are theirs.
 */
import { useI18n } from 'vue-i18n'
import type { Ownership } from '@/utils/bookOwnership'

defineProps<{ state: Ownership }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  span(:class="['own-badge', 'is-' + state]")
    span(v-if="state !== 'locked'" class="own-check" aria-hidden="true") ✓
    span {{ t('app.read.own_' + state) }}
</template>

<style scoped lang="sass">
.own-badge
  display: inline-flex
  align-items: center
  gap: 4px
  padding: 3px 10px
  border-radius: 999px
  font-size: 0.78rem
  font-weight: 800
  letter-spacing: 0.02em
  line-height: 1.2
  white-space: nowrap
  border: 1.5px solid #ffffff
  box-shadow: 0 2px 6px rgba(20, 24, 32, 0.35)

  &.is-owned
    background: #2e8b57
    color: #ffffff

  &.is-plus
    background: linear-gradient(180deg, #fff1b3 0%, #f7cf55 60%, #e0a82a 100%)
    color: #5a3a06

  &.is-free
    background: #2b7fc4
    color: #ffffff

  &.is-locked
    background: #ffffff
    color: #3a2f20
    border-color: #d8cdb8

.own-check
  font-size: 0.85em
</style>
