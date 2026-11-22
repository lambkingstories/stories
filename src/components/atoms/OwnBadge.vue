<script setup lang="ts">
/**
 * The sign on a book that says what the person has of it: Gratis (free), Gekauft (bought), or the golden Plus sign. One look at a shelf shows which books are theirs.
 * The Plus sign (crown and "Plus", the same everywhere in the app; Anton, 18.11.2026) is on a book that comes with Plus: for a person with Plus it is hidden (they have it),
 * and a book that is still to get carries it again when Plus is off (Anton 22.11.2026), so a locked book is never without a sign.
 */
import { useI18n } from 'vue-i18n'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import type { Ownership } from '@/utils/bookOwnership'

defineProps<{ state: Ownership }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  //- "With Plus" (the person has Plus: the sign hides itself) and a book that is still to get (Plus opens it): the golden Plus sign, the same everywhere
  PlusBadge(v-if="state === 'plus'" :title="t('app.read.own_plus')")
  PlusBadge(v-else-if="state === 'locked'" always :title="t('app.read.own_plus')")
  span(v-else :class="['own-badge', 'is-' + state]")
    span(class="own-check" aria-hidden="true") ✓
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
