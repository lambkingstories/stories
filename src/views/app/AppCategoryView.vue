<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import BookGridSection from '@/components/organisms/BookGridSection.vue'
import useApiBooks from '@/use/useApiBooks'
import useApiCategories from '@/use/useApiCategories'
import useCatalogNames from '@/use/useCatalogNames'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook } from '@/types/apiBook'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const apiBooks = useApiBooks()
const apiCategories = useApiCategories()
const { categoryName } = useCatalogNames()

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Pull the category records so the header can show the uploaded icon
  // next to the category name.
  void apiCategories.loadAll()
})

// The German category name IS its server-side id, so the route param stays
// the match key for books/icon lookups; only the heading gets localized.
const categoryId = computed(() => String(route.params.category))
const categoryLabel = computed(() => categoryName(categoryId.value))

const categoryIcon = computed<string>(() => {
  void apiCategories.state.all
  return apiCategories.getByName(categoryId.value)?.icon || ''
})

// Newest first — categories cut across series, so release order is the
// most useful default (mirrors the "Neu in der Bibliothek" row).
const books = computed<ApiBook[]>(() => {
  const list = (apiBooks.state.all ?? []) as ApiBook[]
  return list
    .filter((b) => b.category === categoryId.value)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(:class="['category-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']")
    LkPageHead(:title="categoryLabel" :subtitle="t('app.categories.sub')" @back="goBack")

    div(class="content")
      //- Shared book list (layout toggle + cards) — same component as
      //- the series detail page.
      BookGridSection(
        :books="books"
        :title="t('app.categories.books')"
        :empty-text="t('app.categories.empty')"
      )
</template>

<style scoped lang="sass">
$cream-bg: var(--lk-bg)
$cream-card: var(--lk-surface)
$navy: var(--lk-text)
$brown: var(--lk-muted)
$gold: var(--lk-accent)
$border: var(--lk-line)

button
  -webkit-tap-highlight-color: transparent

.category-page
  background: var(--lk-bg)
  color: $navy

.category-header
  position: relative
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

// Back button floats over the centred title block so the crown +
// category name stack stays optically centred regardless of side widgets.
.category-back
  position: absolute
  top: calc(max(env(safe-area-inset-top), 0.75rem))
  left: 12px
  --back-icon-color: var(--lk-text) !important

.title-cluster
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.category-crown
  width: 28px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.3))

.category-title-row
  display: flex
  align-items: center
  justify-content: center
  gap: 8px

.category-title-icon
  width: 26px
  height: 26px
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.25))

.category-title
  font-size: 24px
  font-weight: 700
  color: $navy
  letter-spacing: -0.01em
  margin: 0
  line-height: 1.1

.content
  max-width: 28rem
  margin: 0 auto
  padding: 10px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

// ===== Mobile landscape =====
.is-landscape
  .category-header, .content
    max-width: 64rem
</style>
