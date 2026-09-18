<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import { renderLegalText } from '@/utils/renderLegalText'
import { openExternal } from '@/utils/openExternal'
// Same file the website's privacy modal shows, so both always match. It
// starts with the imprint (§ 5 TMG) block, hence one page for both.
import privacyText from '../../../website/src/documentation/privacy-policy-de.md?raw'

// App Review Guideline 5.1.1(i): the privacy policy must be reachable inside
// the app, not only on the store page. Rendered in-app rather than linked,
// because a link out would need the parental gate first (Kids Category).
const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

const rendered = computed(() => renderLegalText(privacyText))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-profile' })
}

// URLs inside the text leave through `openExternal` (gated on iOS) instead of
// navigating the WebView away from the app.
function onTextClick(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest('a')
  if (!link) return
  event.preventDefault()
  void openExternal(link.href)
}
</script>

<template lang="pug">
  div(class="legal-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    header(class="legal-header")
      ZBackButton(variant="flat" @click="goBack")
      h1(class="legal-title") {{ t('app.legal.title') }}

    article(class="legal-card")
      p(v-if="locale !== 'de'" class="legal-note") {{ t('app.legal.germanOnly') }}
      h2(class="legal-heading") {{ t('app.legal.privacyTitle') }}
      div(class="legal-body" v-html="rendered" @click="onTextClick")
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
  padding: 16px 16px 8px

.legal-title
  font-size: 20px
  font-weight: 700
  margin: 0

.legal-card
  margin: 8px 16px 0
  max-width: 760px
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
