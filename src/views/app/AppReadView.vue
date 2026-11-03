<script setup lang="ts">
/**
 * "Lesen": the front door of reading. Three big tiles lead to the three areas: Stories (the stories of the app), Books (printed
 * books from the store) and Malbücher (the coloring books). Each tile has a picture on top and its name and a short line below.
 * The look follows the day/night theme (assets/css/theme.css).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

interface Door {
  id: 'stories' | 'books' | 'coloring' | 'goodnight'
  title: string
  sub: string
  route: string
  image?: string
}

const doors = computed<Door[]>(() => [
  { id: 'stories', title: t('app.read.storiesTitle'), sub: t('app.read.storiesSub'), route: 'app-all-books', image: prependBaseUrl('images/bg/series_landscape.webp') },
  { id: 'books', title: t('app.read.booksTitle'), sub: t('app.read.booksSub'), route: 'app-books', image: prependBaseUrl('images/bg/welcome-bg-3.webp') },
  { id: 'coloring', title: t('app.read.coloringTitle'), sub: t('app.read.coloringSub'), route: 'app-coloring-books', image: prependBaseUrl('images/lesen/malbuecher-kachel.webp') },
  // for bedtime: a night-blue tile with the moon (no picture needed)
  { id: 'goodnight', title: t('app.read.goodnightTitle'), sub: t('app.read.goodnightSub'), route: 'app-goodnight' }
])
</script>

<template lang="pug">
  div(class="read-hub")
    AppHeader

    main(class="hub-body")
      header(class="hub-head")
        h1(class="hub-title") {{ t('app.read.hubTitle') }}
        p(class="hub-sub") {{ t('app.read.hubSub') }}

      nav(class="doors")
        button(
          v-for="d in doors"
          :key="d.id"
          type="button"
          :class="['door', 'is-' + d.id]"
          :aria-label="d.title + ': ' + d.sub"
          @click="router.push({ name: d.route })"
        )
          span(class="door-pic")
            img(v-if="d.image" :src="d.image" alt="" draggable="false" decoding="async")
            ZIconography(v-else name="moon" :size="72" class="door-moon")
          span(class="door-body")
            span(class="door-text")
              span(class="door-title") {{ d.title }}
              span(class="door-sub") {{ d.sub }}
            span(class="door-go")
              ZIconography(name="chevron-right" :size="26")
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.read-hub
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.hub-body
  max-width: 980px
  margin: 0 auto
  padding: 0 16px
  display: flex
  flex-direction: column
  gap: 20px

.hub-title
  margin: 0
  font-weight: 800
  font-size: 1.9rem

.hub-sub
  margin: 4px 0 0
  color: var(--lk-muted)
  font-size: 1.05rem

.doors
  display: grid
  grid-template-columns: 1fr
  gap: 16px

.door
  display: flex
  flex-direction: column
  padding: 0
  overflow: hidden
  text-align: center
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  box-shadow: var(--lk-shadow)
  cursor: pointer
  touch-action: manipulation

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

.door-pic
  position: relative
  display: block
  aspect-ratio: 16 / 9
  overflow: hidden
  background: var(--lk-surface-2)

  > img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover
    display: block

// the good-night tile: always night blue, with a golden moon
.door.is-goodnight .door-pic
  display: flex
  align-items: center
  justify-content: center
  background: radial-gradient(120% 90% at 50% 0%, #1f3252 0%, #0d1829 75%)

.door-moon
  color: #e9c46a
  filter: drop-shadow(0 0 16px rgba(233, 196, 106, 0.5))

.door-body
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  padding: 14px 16px 16px

.door-text
  display: flex
  flex-direction: column
  gap: 4px
  min-width: 0

.door-title
  font-weight: 800
  font-size: 1.6rem
  line-height: 1.15

.door-sub
  color: var(--lk-muted)
  font-size: 1.02rem
  line-height: 1.3

.door-go
  flex: none
  width: 48px
  height: 48px
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center
  background: var(--lk-accent)
  color: var(--lk-on-accent)

  :deep(.z-icon-outline)
    color: currentColor

@media (min-width: 720px)
  .hub-body
    padding: 0 28px

  // the areas stay one under the other, each one wide: the picture on the left, name and line on the right
  .doors
    gap: 18px

  .door
    flex-direction: row
    align-items: stretch

  .door-pic
    flex: none
    width: 46%
    aspect-ratio: 16 / 9

  .door-body
    flex: 1
    min-width: 0
    padding: 18px 24px
</style>
