<script setup lang="ts">
/**
 * "Contact" for grown-ups: the contact form of lambking.store and the e-mail address. Both go through `openExternal`, which
 * asks the parental gate first and then opens the system browser or mail app. The app has no form of its own on purpose.
 */
import { useI18n } from 'vue-i18n'
import { CONTACT_EMAIL, CONTACT_FORM_URL, CONTACT_MAILTO } from '@/data/contact'
import { openExternal } from '@/utils/openExternal'

const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  section(class="contact-links" aria-labelledby="contact-links-title")
    h3#contact-links-title(class="contact-title") {{ t('app.contact.title') }}
    div(class="contact-actions")
      button(type="button" class="contact-btn" data-test="contact-form" @click="openExternal(CONTACT_FORM_URL)") {{ t('app.contact.form') }}
      button(type="button" class="contact-btn" data-test="contact-mail" :title="CONTACT_EMAIL" @click="openExternal(CONTACT_MAILTO)") {{ t('app.contact.email') }}
</template>

<style scoped lang="sass">
.contact-links
  display: flex
  flex-direction: column
  gap: 8px

.contact-title
  margin: 0
  font-size: 16px
  font-weight: 700

.contact-actions
  display: flex
  flex-wrap: wrap
  gap: 8px

.contact-btn
  min-height: 44px
  padding: 0 18px
  border: 1px solid var(--lk-line, #e6d6b5)
  border-radius: 999px
  background: var(--lk-surface, #fff)
  color: inherit
  font: inherit
  font-size: 0.9rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent
</style>
