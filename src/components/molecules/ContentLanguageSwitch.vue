<script setup lang="ts">
/**
 * The round flags on top of a shelf: the languages in which the shelf has books, the chosen one ringed. Nothing is drawn when the shelf has one language only.
 * A tap changes the language of the content for the whole app (`useContentLanguage`): the shelf then shows only the books that exist in that language.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FlagIcon from '@/components/atoms/FlagIcon.vue'
import useContentLanguage, { languagesOf, type HasLanguages } from '@/use/useContentLanguage'

const props = defineProps<{ books: readonly HasLanguages[] }>()
const { t } = useI18n({ useScope: 'global' })
const { setLang, shelfLanguage } = useContentLanguage()

const languages = computed(() => languagesOf(props.books))
const current = computed(() => shelfLanguage(props.books))
const name = (l: 'de' | 'en') => (l === 'de' ? t('app.language.german') : t('app.language.english'))
</script>

<template lang="pug">
  div(v-if="languages.length > 1" class="cls" role="radiogroup" :aria-label="t('app.language.shelf')" data-test="content-language")
    button(
      v-for="l in languages"
      :key="l"
      type="button"
      role="radio"
      :aria-checked="current === l"
      :aria-label="name(l)"
      :title="name(l)"
      :data-lang="l"
      :class="['cls-btn', { 'is-on': current === l }]"
      @click="setLang(l)"
    )
      FlagIcon(:lang="l")
</template>

<style scoped lang="sass">
.cls
  display: flex
  align-items: center
  gap: 10px

// a round flag, 44 px to hit (the rule of the app), a ring around the chosen one
.cls-btn
  position: relative
  width: 44px
  height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  overflow: hidden
  opacity: 0.55
  transition: opacity 120ms, border-color 120ms, transform 120ms

  svg
    display: block
    width: 100%
    height: 100%
    border-radius: 50%
    object-fit: cover

  &.is-on
    opacity: 1
    border-color: var(--lk-accent, #1f6f68)
    transform: scale(1.04)

  &:focus-visible
    outline: 3px solid var(--lk-accent, #1f6f68)
    outline-offset: 2px
</style>
