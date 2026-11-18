<script setup lang="ts">
/**
 * The list of books could not be loaded (no net, or the server does not answer) and nothing is kept on the device: a friendly note and
 * a big "Try again" button (at least 48 px high, the app's capsule is 56 px).
 */
import { useI18n } from 'vue-i18n'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'

defineEmits<{ (e: 'retry'): void }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="ble lk-panel" role="alert" data-test="book-list-error")
    LkCompanion(class="ble-lamb" pose="offline" :size="110")
    h2(class="ble-title") {{ t('app.state.listFailTitle') }}
    p(class="ble-text") {{ t('app.state.listFailText') }}
    button(type="button" class="lk-btn ble-retry" data-test="book-list-retry" @click="$emit('retry')")
      ZIconography(name="restart" :size="22")
      span {{ t('app.state.listFailRetry') }}
</template>

<style scoped lang="sass">
.ble
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 16px 20px 24px
  text-align: center

.ble-lamb
  margin-top: -64px

.ble-title
  margin: 0 0 6px
  font-size: 1.2rem
  font-weight: 800

.ble-text
  margin: 0 0 8px
  color: var(--lk-muted)
  line-height: 1.35

.ble-retry
  min-width: 48px
  min-height: 56px
</style>
