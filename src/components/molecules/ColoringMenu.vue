<script setup lang="ts">
/**
 * The main menu of the painting program: one line "My coloring books" with the books big next to each other, a quiet part
 * for free painting and the child's own pictures, the other pictures folded away, and the part for parents.
 * It only shows what it is given and says what was tapped; the screen with the picture does the rest.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LINE_ICONS } from '@/data/coloringKits'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import type { ArtworkMeta } from '@/use/useArtworks'
import type { BookCard, GalleryGroup, GalleryItem, RewardItem } from '@/types/coloringMenu'

interface Props {
  /** The coloring books, the ones being painted first. */
  books: BookCard[]
  /** The child's paintings that are not part of a book. */
  works: ArtworkMeta[]
  /** The other pictures to colour (built in, and from stories). */
  groups: GalleryGroup[]
  /** The pictures won as presents. */
  rewards: RewardItem[]
  backupBusy: boolean
  backupMessage: string
}

defineProps<Props>()
const emit = defineEmits<{
  'open-book': [card: BookCard]
  'remove-book': [card: BookCard]
  'to-reading': []
  blank: [shape: 'portrait' | 'landscape']
  'own-image': []
  'open-work': [meta: ArtworkMeta]
  'ask-delete': [meta: ArtworkMeta]
  'pick-item': [item: GalleryItem]
  'open-reward': [item: RewardItem]
  'export-backup': []
  'pick-backup': []
}>()

const { t } = useI18n({ useScope: 'global' })

/** The pictures from stories and the built-in ones stay folded away. */
const showMore = ref(false)

const bookPercent = (b: BookCard) => `${Math.round((b.done / Math.max(1, b.total)) * 100)}%`
</script>

<template lang="pug">
  div(class="ac-pick")
    //- the same top line as on the other tabs: logo, parents, my picture
    AppHeader(class="ac-apphead")
    //- heading with the companion lamb
    div(class="ac-head")
      div(class="ac-head-text")
        h1(class="ac-head-title") {{ t('app.nav.color') }}
        p(class="ac-head-sub") {{ t('app.coloring.menuSub') }}
      LkCompanion(class="ac-head-lamb" pose="stift" :size="96")

    //- One line, the coloring books big next to each other
    section(class="ac-mybooks lk-panel")
      h2(class="ac-pick-title") {{ t('app.coloring.myBooks') }}
      div(v-if="books.length" class="ac-bigbooks")
        div(v-for="b in books" :key="b.bookId" class="ac-bigbook-wrap")
          button(type="button" class="ac-bigbook" @click="emit('open-book', b)")
            span(class="ac-bigbook-cover")
              img(v-if="b.cover" :src="b.cover" alt="" draggable="false" loading="lazy")
              span(v-if="b.done > 0" class="ac-bigbook-badge") {{ b.done }}/{{ b.total }}
            //- the board the book stands on: the boards of all books join to one shelf
            span(class="ac-bigbook-board" aria-hidden="true")
            span(class="ac-bigbook-title") {{ b.title }}
            span(v-if="b.done > 0" class="ac-bigbook-bar" aria-hidden="true")
              span(class="ac-bigbook-fill" :style="{ width: bookPercent(b) }")
            span(class="ac-bigbook-sub") {{ b.done > 0 ? t('app.coloring.pagesPainted', { done: b.done, total: b.total }) : t('app.coloring.pagesCount', { total: b.total }) }}
          //- takes the book out of the shelf again (the painted pictures stay)
          button(type="button" class="ac-bigbook-remove" :aria-label="t('app.coloring.shelfRemove', { title: b.title })" @click="emit('remove-book', b)") ✕
      //- nothing on the shelf yet: where to find the books
      div(v-else class="ac-shelf-empty")
        p(class="ac-pick-sub") {{ t('app.coloring.shelfEmpty') }}
        button(type="button" class="ac-link-btn" @click="emit('to-reading')") {{ t('app.coloring.shelfGo') }}

    //- Free painting: a blank sheet or an own picture
    section(class="ac-free")
      h3(class="ac-sec-title") {{ t('app.coloring.freePainting') }}
      div(class="ac-free-row")
        button(type="button" class="ac-chip" @click="emit('blank', 'portrait')")
          img(:src="LINE_ICONS.plus" alt="" draggable="false")
          | {{ t('app.coloring.blankPortrait') }}
        button(type="button" class="ac-chip" @click="emit('blank', 'landscape')")
          img(:src="LINE_ICONS.plus" alt="" draggable="false")
          | {{ t('app.coloring.blankLandscape') }}
        button(type="button" class="ac-chip" @click="emit('own-image')")
          img(:src="LINE_ICONS.frames" alt="" draggable="false")
          | {{ t('app.coloring.ownImage') }}

    //- the pictures won as presents (a cup at the end of a journey)
    section(v-if="rewards.length" class="ac-free ac-rewards")
      h3(class="ac-sec-title") {{ t('app.coloring.myRewards') }}
      div(class="ac-gallery")
        button(v-for="r in rewards" :key="r.id" type="button" class="ac-gal-tile ac-reward" :aria-label="r.title" @click="emit('open-reward', r)")
          img(:src="r.image" alt="" draggable="false")
          span(class="ac-reward-name") {{ r.title }}

    section(v-if="works.length" class="ac-free")
      h3(class="ac-sec-title") {{ t('app.coloring.myWorks') }}
      div(class="ac-gallery")
        div(v-for="w in works" :key="w.id" class="ac-work")
          button(type="button" class="ac-gal-tile" :aria-label="w.title" @click="emit('open-work', w)")
            img(:src="w.thumb" alt="" draggable="false")
          button(
            type="button"
            class="ac-work-del"
            :aria-label="t('app.coloring.deleteTitle')"
            @click="emit('ask-delete', w)"
          ) ✕

    section(v-if="groups.length" class="ac-free ac-more")
      button(type="button" class="ac-more-toggle" :class="{ open: showMore }" :aria-expanded="showMore" @click="showMore = !showMore")
        | {{ showMore ? t('app.coloring.moreImagesHide') : t('app.coloring.moreImages') }}
        img(:src="LINE_ICONS.down" alt="" draggable="false")
      template(v-if="showMore")
        template(v-for="g in groups" :key="g.key")
          h3(class="ac-sec-title") {{ g.title }}
          div(class="ac-gallery")
            button(
              v-for="item in g.items"
              :key="item.key"
              type="button"
              class="ac-gal-tile"
              :aria-label="item.title"
              @click="emit('pick-item', item)"
            )
              img(v-if="item.preview" :src="item.preview" alt="" draggable="false" loading="lazy")
              span(v-else class="ac-gal-pdf" aria-hidden="true") 🎨

    router-link(:to="{ name: 'app-awards' }" class="ac-link-btn ac-awards-link") {{ t('app.coloring.myAwards') }}

    //- For parents: all paintings in one file, and back again.
    div(class="ac-parents")
      p(class="ac-parents-title") {{ t('app.coloring.forParents') }}
      div(class="ac-parents-row")
        button(type="button" class="ac-link-btn" :disabled="backupBusy" @click="emit('export-backup')") {{ t('app.coloring.backupAll') }}
        button(type="button" class="ac-link-btn" :disabled="backupBusy" @click="emit('pick-backup')") {{ t('app.coloring.backupRestore') }}
      p(v-if="backupMessage" class="ac-parents-msg" role="status") {{ backupMessage }}
</template>

<style scoped lang="sass">
$ink: var(--lk-text)
$muted: var(--lk-muted)
$line: var(--lk-line)
$accent: var(--lk-read)
$text: $ink
$text-m: $muted
$p-bdr: #e6d3a8
$p-pale: #fffaf0

.ac-pick
  position: absolute
  inset: 0
  background: var(--lk-bg)
  overflow-y: auto
  padding: 0 18px calc(120px + env(safe-area-inset-bottom, 0px))
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  -webkit-overflow-scrolling: touch

.ac-apphead
  align-self: stretch
  width: 100%
  max-width: 1040px
  margin: 0 auto 8px
  padding-left: 0
  padding-right: 0

.ac-head
  width: 100%
  max-width: 1040px
  display: flex
  align-items: flex-end
  justify-content: space-between
  margin: 0 auto 10px
  text-align: left

.ac-head-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.1

.ac-head-sub
  margin: 4px 0 0
  color: $text-m
  font-size: 1.05rem

.ac-head-lamb
  margin-bottom: -4px

.ac-pick-title
  margin: 4px 0 0
  font-size: 1.5rem
  font-weight: 800
  color: $text

.ac-pick-sub
  margin: 4px 0 16px
  font-size: 0.95rem
  color: $text-m
  font-weight: 700

.ac-mybooks
  flex: 0 0 auto
  width: 100%
  max-width: 1040px
  margin: 0 auto
  padding: 14px 14px 16px
  overflow: hidden

// the books stand in one row on a shelf, swiped sideways: the one painted on last is in front
.ac-bigbooks
  display: flex
  gap: 12px
  margin: 10px -14px 0
  padding: 6px 14px 4px
  overflow-x: auto
  scroll-snap-type: x proximity
  scroll-padding-left: 14px
  scrollbar-width: none
  justify-content: safe center

  &::-webkit-scrollbar
    display: none

.ac-bigbook-wrap
  position: relative
  flex: 0 0 clamp(142px, 42%, 220px)
  scroll-snap-align: start

.ac-bigbook-remove
  position: absolute
  top: 6px
  left: 6px
  z-index: 2
  width: 30px
  height: 30px
  border: 0
  border-radius: 50%
  background: var(--lk-surface)
  color: var(--lk-muted)
  font-size: 0.8rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35)

.ac-shelf-empty
  padding: 6px 8px 4px

.ac-bigbook
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px
  padding: 0
  border: 0
  background: transparent
  color: $text
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active .ac-bigbook-cover
    transform: scale(0.97)

  @media (hover: hover)
    &:hover .ac-bigbook-cover
      transform: translateY(-5px) rotate(-0.8deg)

// the board under a book; it reaches over the gap to the next book
.ac-bigbook-board
  display: block
  height: 12px
  margin: -4px -6px 0
  border-radius: 8px
  background: var(--lk-shelf)

.ac-bigbook-cover
  position: relative
  display: block
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 6px 14px 14px 6px
  background: #f1ece2
  box-shadow: 0 20px 30px -14px rgba(60, 40, 10, 0.6), 0 2px 5px rgba(60, 40, 10, 0.28)
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1)

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

  // the spine: a book is held at its left edge
  &::after
    content: ''
    position: absolute
    inset: 0
    background: linear-gradient(90deg, rgba(20, 12, 4, 0.28) 0, rgba(255, 255, 255, 0.14) 2.5%, rgba(255, 255, 255, 0) 7%)
    pointer-events: none

.ac-bigbook-badge
  position: absolute
  top: 8px
  right: 8px
  z-index: 1
  padding: 3px 9px
  border-radius: 999px
  background: rgba(34, 38, 46, 0.78)
  color: #ffffff
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.02em

.ac-bigbook-title
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden
  font-size: 1.02rem
  font-weight: 800
  line-height: 1.25

.ac-bigbook-bar
  display: block
  height: 5px
  overflow: hidden
  border-radius: 3px
  background: var(--lk-track)

.ac-bigbook-fill
  display: block
  height: 100%
  border-radius: 3px
  background: var(--lk-fill)

.ac-bigbook-sub
  font-size: 0.8rem
  font-weight: 700
  color: $text-m

// the rest of the main menu is quieter than the books
.ac-free
  width: 100%
  max-width: 880px
  margin: 12px auto 0

.ac-free .ac-sec-title
  text-align: center

.ac-free-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.ac-chip
  display: inline-flex
  align-items: center
  gap: 8px
  min-height: 56px
  padding: 0 22px 0 18px
  border: 1px solid var(--lk-line)
  border-radius: 28px
  background: var(--lk-surface)
  color: $text
  font-size: 1rem
  font-weight: 600
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 2px 8px -4px rgba(60, 40, 10, 0.4)

  img
    width: 20px
    height: 20px
    object-fit: contain
    opacity: 0.85

  &:active
    transform: scale(0.97)

.ac-more
  text-align: center

.ac-more-toggle
  display: inline-flex
  align-items: center
  gap: 8px
  min-height: 40px
  padding: 0 4px
  border: 0
  background: transparent
  color: $text-m
  font-size: 0.9rem
  font-weight: 700
  cursor: pointer

  img
    width: 14px
    height: 14px
    transition: transform 220ms ease-out

  &.open img
    transform: rotate(180deg)

.ac-gallery
  width: 100%
  max-width: 880px
  display: grid
  grid-template-columns: repeat(auto-fill, 138px)
  justify-content: center
  gap: 14px
  margin: 0 auto 20px

.ac-gal-tile
  position: relative
  aspect-ratio: 3 / 4
  padding: 0
  overflow: hidden
  border-radius: 16px
  border: 3px solid #ffffff
  background: #ffffff
  box-shadow: 0 8px 18px -8px rgba(90, 58, 14, 0.45)
  cursor: pointer
  transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1)
  -webkit-tap-highlight-color: transparent

  img
    width: 100%
    height: 100%
    object-fit: contain
    display: block

  &:active
    transform: scale(0.96)

  @media (hover: hover)
    &:hover
      transform: translateY(-3px) rotate(-0.6deg)

.ac-gal-pdf
  display: grid
  place-items: center
  width: 100%
  height: 100%
  font-size: 2.4rem

.ac-sec-title
  align-self: flex-start
  width: 100%
  max-width: 880px
  margin: 6px auto 10px
  text-align: left
  font-size: 1.05rem
  font-weight: 800
  color: $text

.ac-rewards .ac-gallery
  display: flex
  flex-wrap: wrap
  justify-content: center

.ac-reward
  position: relative
  flex: 0 0 138px
  border-color: #e8b94a

.ac-reward-name
  position: absolute
  left: 0
  right: 0
  bottom: 0
  padding: 14px 6px 6px
  background: linear-gradient(transparent, rgba(40, 28, 8, 0.72))
  color: #fff
  font-size: 0.78rem
  font-weight: 800
  line-height: 1.15
  text-align: center

.ac-work
  position: relative

.ac-work-del
  position: absolute
  top: 6px
  right: 6px
  width: 28px
  height: 28px
  border-radius: 50%
  border: 0
  background: var(--lk-surface)
  color: $text-m
  font-size: 0.8rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 6px rgba(90, 58, 14, 0.3)

// ── For parents ──────────────────────────────────────────────────────────────────────
.ac-parents
  margin: 26px auto 40px
  max-width: 520px
  text-align: center

.ac-awards-link
  display: inline-flex
  align-items: center
  justify-content: center
  margin: 18px auto 0
  text-decoration: none

.ac-parents-title
  margin: 0 0 8px
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $muted

.ac-parents-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

.ac-link-btn
  min-height: 40px
  padding: 0 16px
  border: 1px solid rgba(20, 24, 32, 0.16)
  border-radius: 999px
  background: var(--lk-surface)
  color: $ink
  font: inherit
  font-size: 0.82rem
  font-weight: 700
  cursor: pointer

  &:disabled
    opacity: 0.5

.ac-parents-msg
  margin: 10px 0 0
  font-size: 0.82rem
  color: $muted
</style>
