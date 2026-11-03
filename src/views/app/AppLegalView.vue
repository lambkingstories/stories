<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import ContactLinks from '@/components/molecules/ContactLinks.vue'
import { legalBody, renderLegalText } from '@/utils/renderLegalText'
import { openExternal } from '@/utils/openExternal'
// Exactly the texts published on lambking.store, copied in by `scripts/sync-legal.mjs` (never edited by hand), so the
// app and the website always say the same thing and the texts can be read offline.
import imprintText from '../../legal/impressum-de.txt?raw'
import privacyText from '../../legal/datenschutz-de.txt?raw'

// App Review Guideline 5.1.1(i): the privacy policy must be reachable inside
// the app, not only on the store page — so it is rendered here rather than
// linked out to lambking.store, which a reviewer offline could not reach.
const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

const renderedImprint = computed(() => renderLegalText(legalBody(imprintText)))
const rendered = computed(() => renderLegalText(legalBody(privacyText)))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-profile' })
}

// URLs inside the text leave through `openExternal` instead of navigating the
// WebView away from the app.
function onTextClick(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest('a')
  if (!link) return
  event.preventDefault()
  void openExternal(link.href)
}
</script>

<template lang="pug">
  div(class="legal-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    LkPageHead(:title="t('app.legal.title')" :lamb="false" @back="goBack")

    article(class="legal-card")
      p(v-if="locale !== 'de'" class="legal-note") {{ t('app.legal.germanOnly') }}
      h2(class="legal-heading") {{ t('app.legal.imprintTitle') }}
      div(class="legal-body" data-test="imprint" v-html="renderedImprint" @click="onTextClick")
      ContactLinks(class="legal-contact")
      h2(class="legal-heading legal-heading-next") {{ t('app.legal.privacyTitle') }}
      div(class="legal-body" data-test="privacy" v-html="rendered" @click="onTextClick")
</template>

<style scoped lang="sass">
.legal-page
  background: linear-gradient(180deg, #fdf8ed 0%, #f3e6c4 100%)
  color: #1a2f4a
  padding-top: env(safe-area-inset-top, 0px)

.legal-header
  display: flex
  align-items: center
  gap: 12px
  // Same column as the card below, so both centre on a tablet.
  max-width: 792px
  margin: 0 auto
  padding: 16px 16px 8px

.legal-title
  font-size: 20px
  font-weight: 700
  margin: 0

.legal-card
  margin: 8px 16px 0
  max-width: 760px

  // Centre the column once the screen is wider than card + side margins.
  @media (min-width: 792px)
    margin-left: auto
    margin-right: auto
  padding: 18px 18px 22px
  background: rgba(255, 255, 255, 0.72)
  border: 1.5px solid #e6d6b5
  border-radius: 20px
  box-shadow: 0 10px 30px -14px rgba(58, 42, 18, 0.35)

.legal-note
  margin: 0 0 12px
  padding: 8px 12px
  font-size: 14px
  background: #fff4d6
  border-radius: 12px

.legal-heading
  font-size: 18px
  font-weight: 700
  margin: 0 0 10px

.legal-heading-next
  margin-top: 28px

.legal-contact
  margin-top: 4px

.legal-body
  font-size: 14px
  line-height: 1.55
  overflow-wrap: anywhere

  :deep(h3)
    font-size: 16px
    font-weight: 700
    margin: 18px 0 6px

  :deep(p)
    margin: 0 0 10px

  :deep(a)
    color: #1f6fa8
    text-decoration: underline
</style>
