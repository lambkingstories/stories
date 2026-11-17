<script setup lang="ts">
/**
 * One small, quiet line: "Stand 17.11. · 4e1f2a3" (date and short Git commit number of the build; "Stand Entwicklung" where there is none).
 * It is for Anton and the parents ("is this the new version?"), not for the child: tiny, grey, under the settings on the Me page.
 * Nothing to tap, nothing is sent anywhere.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildStamp, buildStampText } from '@/utils/buildStamp'

const { locale } = useI18n({ useScope: 'global' })
const text = computed(() => buildStampText(buildStamp(), String(locale.value)))
</script>

<template lang="pug">
  p(class="build-stamp" data-testid="build-stamp") {{ text }}
</template>

<style scoped lang="sass">
.build-stamp
  margin: 14px 0 6px
  text-align: center
  font-size: 0.8rem
  line-height: 1.2
  letter-spacing: 0.02em
  color: var(--lk-muted, rgba(90, 70, 50, 0.6))
  opacity: 0.8
  user-select: text
  -webkit-user-select: text
</style>
