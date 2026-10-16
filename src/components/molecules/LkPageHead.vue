<script setup lang="ts">
/**
 * The head of a page that sits one step inside the app (new books, a category, the awards, the legal texts): the brand line
 * with the "Eltern" button, a "Zurück" capsule, the page title with a short line under it, and the companion lamb at the right.
 */
import { useI18n } from 'vue-i18n'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion, { type CompanionPose } from '@/components/atoms/LkCompanion.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'

withDefaults(defineProps<{ title: string; subtitle?: string; back?: boolean; lamb?: boolean; pose?: CompanionPose }>(), { subtitle: '', back: true, lamb: true, pose: 'winken' })
const emit = defineEmits<{ back: [] }>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="page-head")
    AppHeader
    div(class="head-body")
      button(v-if="back" type="button" class="head-back lk-btn lk-btn--outline lk-btn--small" @click="emit('back')")
        ZIconography(name="chevron-left" :size="20")
        span {{ t('app.read.back') }}
      div(class="head-row")
        div(class="head-text")
          h1(class="head-title") {{ title }}
          p(v-if="subtitle" class="head-sub") {{ subtitle }}
        LkCompanion(v-if="lamb" class="head-lamb" :pose="pose" :size="92")
</template>

<style scoped lang="sass">
.head-body
  max-width: 980px
  margin: 0 auto
  padding: 0 16px

.head-back
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

.head-row
  display: flex
  align-items: flex-end
  justify-content: space-between
  gap: 12px
  min-height: 92px
  margin-top: 6px

.head-text
  min-width: 0
  padding-bottom: 6px

.head-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.1

.head-sub
  margin: 4px 0 0
  color: var(--lk-muted)
  font-size: 1.05rem
  line-height: 1.35

.head-lamb
  flex: none
  margin-bottom: -6px
</style>
