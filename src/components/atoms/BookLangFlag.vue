<script setup lang="ts">
/**
 * The small flag on the corner of a cover: this book is in the other language than the screen (German coloring book in the English app, or the other way round).
 * Nothing is drawn when the book fits the screen. Inline SVG, like the language switch (emoji flags do not show on Windows).
 */
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { bookFlagLanguage, type BookLanguageInfo } from '@/utils/bookLanguage'

const props = defineProps<{
  book?: BookLanguageInfo | null
  /** Used when the caller has the language of the book and not the book itself. */
  language?: 'de' | 'en' | null
}>()
const { t, locale } = useI18n({ useScope: 'global' })
const ukClipId = `bf-uk-${useId()}`

const flag = computed(() => props.language ?? bookFlagLanguage(props.book, locale.value))
const label = computed(() => (flag.value === 'de' ? t('app.language.bookGerman') : flag.value === 'en' ? t('app.language.bookEnglish') : ''))
</script>

<template lang="pug">
  span(v-if="flag" class="blf" role="img" :aria-label="label" :title="label" data-test="book-flag")
    svg(v-if="flag === 'de'" viewBox="0 0 60 40" focusable="false" aria-hidden="true")
      rect(width="60" height="13.5" y="0" fill="#000000")
      rect(width="60" height="13.5" y="13.3" fill="#dd0000")
      rect(width="60" height="13.4" y="26.6" fill="#ffce00")
    svg(v-else viewBox="0 0 60 40" focusable="false" aria-hidden="true")
      clipPath(:id="ukClipId")
        path(d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z")
      path(d="M0,0 v40 h60 v-40 z" fill="#012169")
      path(d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" stroke-width="8")
      path(d="M0,0 L60,40 M60,0 L0,40" :clip-path="`url(#${ukClipId})`" stroke="#c8102e" stroke-width="5")
      path(d="M30,0 v40 M0,20 h60" stroke="#ffffff" stroke-width="13")
      path(d="M30,0 v40 M0,20 h60" stroke="#c8102e" stroke-width="7.5")
</template>

<style scoped lang="sass">
// in the lower left corner of the nearest box that is positioned (the cover)
.blf
  position: absolute
  left: 6px
  bottom: 6px
  z-index: 2
  display: block
  width: 26px
  height: 17px
  overflow: hidden
  border-radius: 3px
  border: 1.5px solid #fff
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45)
  pointer-events: none

  svg
    display: block
    width: 100%
    height: 100%
</style>
