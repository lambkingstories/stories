<script setup lang="ts">
/**
 * Familien-Spiele v2: "Keep playing" (replaces `MapResume`, same props and event). Shown on the setup page of a game when a round was begun
 * and left: a small white card with the line where it stands, and the main button.
 */
import { useI18n } from 'vue-i18n'
import FamilyCard from './FamilyCard.vue'
import FamilyButton from './FamilyButton.vue'

defineProps<{ info?: string }>()
const emit = defineEmits<{ resume: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  FamilyCard(class="fam-resume" tone="lit" compact)
    span(v-if="info" class="fam-resume-info") {{ info }}
    FamilyButton(@click="emit('resume')") {{ t('app.family.resume') }}
</template>

<style scoped lang="sass">
.fam-resume-info
  display: block
  width: 100%
  color: var(--fam-muted)
  font-size: 1rem
  font-weight: 700
  text-align: center
</style>
