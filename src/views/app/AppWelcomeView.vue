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
import { contentLocale } from '@/utils/contentLocale'
import { SPANISH_ENABLED } from '@/utils/languages'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { setSettingValue } = useUser()

// the language of the screens (German, English or Spanish; anything else counts as German)
const current = computed<'de' | 'en' | 'es'>(() => (locale.value === 'en' || locale.value === 'es' ? locale.value : 'de'))

const languages = computed(() => [
  { code: 'de' as const, label: t('app.language.german') },
  { code: 'en' as const, label: t('app.language.english') },
  ...(SPANISH_ENABLED ? [{ code: 'es' as const, label: t('app.language.spanish') }] : [])
])

// the little stars of the American flag: rows of six and five dots
const stars = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, i) => ({
    k: row * 10 + i,
    x: (row % 2 === 0 ? 2.6 : 4.7) + i * 4.2,
    y: 2.6 + row * 2.1
  }))
).flat()

function pick(code: 'de' | 'en' | 'es') {
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
            span(class="lang-flag" aria-hidden="true")
              //- German flag (3:2) and the flag of the USA for English, on one 60 x 40 canvas
              svg(v-if="l.code === 'de'" viewBox="0 0 60 40" focusable="false")
                rect(width="60" height="13.5" y="0" fill="#000000")
                rect(width="60" height="13.5" y="13.3" fill="#dd0000")
                rect(width="60" height="13.4" y="26.6" fill="#ffce00")
              //- the flag of Spain
              svg(v-else-if="l.code === 'es'" viewBox="0 0 60 40" focusable="false")
                rect(width="60" height="10.1" y="0" fill="#c60b1e")
                rect(width="60" height="20.2" y="9.9" fill="#ffc400")
                rect(width="60" height="10.1" y="29.9" fill="#c60b1e")
              svg(v-else viewBox="0 0 60 40" focusable="false")
                rect(width="60" height="40" fill="#ffffff")
                rect(v-for="n in 7" :key="n" width="60" height="3.08" :y="(n - 1) * 6.154" fill="#b22234")
                rect(width="26" height="21.5" fill="#3c3b6e")
                circle(v-for="d in stars" :key="d.k" :cx="d.x" :cy="d.y" r="1.1" fill="#ffffff")
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
  flex: none
  width: 39px
  height: 26px
  border-radius: 5px
  overflow: hidden
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18)

  svg
    display: block
    width: 100%
    height: 100%

.lang-name
  flex: 1
  text-align: left
</style>
