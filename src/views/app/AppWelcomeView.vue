<script setup lang="ts">
/**
 * Welcome / language choice: shown on the very first start only (see the router). A picture with a short greeting, the choice of
 * the language, and one button that goes to the start page. The companion lamb sits on the rim of the greeting card.
 * The language is written through `setSettingValue('language', …)` only; App.vue syncs it to i18n and localStorage.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import useUser from '@/use/useUser'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { setSettingValue } = useUser()

const current = computed<'de' | 'en'>(() => (locale.value === 'en' ? 'en' : 'de'))

const languages = computed(() => [
  { code: 'de' as const, label: t('app.language.german'), flag: 'DE' },
  { code: 'en' as const, label: t('app.language.english'), flag: 'EN' }
])

function pick(code: 'de' | 'en') {
  if (current.value !== code) setSettingValue('language', code)
}

function onStart() {
  try {
    localStorage.setItem('lk-welcome-seen', '1')
  } catch {
    // private window: the welcome screen shows again next time
  }
  void router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(class="welcome-page")
    AppHeader
    main(class="welcome-body")
      div(class="welcome-card lk-panel")
        img(
          :src="prependBaseUrl('images/bg/welcome-bg-1.webp')"
          alt=""
          class="welcome-img"
          fetchpriority="high"
          decoding="async"
          draggable="false"
        )
        div(class="welcome-text")
          LkCompanion(class="welcome-lamb" pose="sitzen" :size="88")
          h1(class="welcome-title") {{ t('app.welcome.title') }}
          p(class="welcome-sub") {{ t('app.home.hero0Text') }}

      section(class="lang")
        h2(class="lang-title") {{ t('app.welcome.chooseLanguage') }}
        div(class="lang-list" role="radiogroup" :aria-label="t('app.language.aria')")
          button(
            v-for="l in languages"
            :key="l.code"
            type="button"
            role="radio"
            :aria-checked="current === l.code"
            :class="['lang-row', { 'is-on': current === l.code }]"
            @click="pick(l.code)"
          )
            span(class="lang-radio" aria-hidden="true")
            span(class="lang-flag" aria-hidden="true") {{ l.flag }}
            span(class="lang-name") {{ l.label }}

      button(type="button" class="lk-btn lk-btn--full" @click="onStart")
        span {{ t('app.welcome.cta') }}
        ZIconography(name="chevron-right" :size="22")
</template>

<style scoped lang="sass">
.welcome-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px))

.welcome-body
  max-width: 520px
  margin: 0 auto
  padding: 8px 16px 0
  display: flex
  flex-direction: column
  gap: 22px

.welcome-card
  overflow: hidden
  border-radius: var(--lk-r-panel)

.welcome-img
  display: block
  width: 100%
  aspect-ratio: 16 / 10
  object-fit: cover

.welcome-text
  position: relative
  padding: 32px 20px 20px

.welcome-lamb
  position: absolute
  right: 16px
  top: -62px

.welcome-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.12

.welcome-sub
  margin: 6px 0 0
  color: var(--lk-muted)
  font-size: 1.1rem
  line-height: 1.4

.lang-title
  margin: 0 0 10px
  font-size: 1.3rem
  font-weight: 800

.lang-list
  display: flex
  flex-direction: column
  gap: 10px

.lang-row
  display: flex
  align-items: center
  gap: 12px
  min-height: 56px
  padding: 0 18px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-btn)
  background: var(--lk-surface)
  color: var(--lk-text)
  font-family: inherit
  font-size: 1.05rem
  font-weight: 600
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    border-color: var(--lk-accent)
    box-shadow: inset 0 0 0 1px var(--lk-accent)

.lang-radio
  width: 22px
  height: 22px
  border-radius: 50%
  border: 2px solid var(--lk-muted)
  display: inline-block
  position: relative

  .is-on &
    border-color: var(--lk-accent)

    &::after
      content: ''
      position: absolute
      inset: 3px
      border-radius: 50%
      background: var(--lk-accent)

.lang-flag
  min-width: 34px
  padding: 2px 6px
  border-radius: 8px
  background: var(--lk-surface-2)
  font-size: 0.8rem
  font-weight: 800
  letter-spacing: 0.04em
  text-align: center

.lang-name
  flex: 1
  text-align: left
</style>
