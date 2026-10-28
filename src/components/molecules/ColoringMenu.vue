<script setup lang="ts">
/**
 * The main menu of the painting program. It is built like the other tabs (Lesen, Abenteuer, Ich): a left-aligned heading with the
 * companion lamb, then framed groups in the surface colour, one after the other: "My coloring books" (the books standing on a
 * shelf, or a big door to the books while the shelf is empty), "Paint freely" (blank sheets and an own picture), the pictures won
 * as presents, the child's own paintings, the other pictures folded away, and the part for parents.
 * It only shows what it is given and says what was tapped; the screen with the picture does the rest.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import { prependBaseUrl } from '@/utils/function'
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

/** The same picture as the door "Malbücher" in Lesen. */
const booksDoorImage = prependBaseUrl('images/lesen/malbuecher-kachel.webp')

const bookPercent = (b: BookCard) => `${Math.round((b.done / Math.max(1, b.total)) * 100)}%`
</script>

<template lang="pug">
  div(class="ac-pick")
    //- the same top line as on the other tabs: logo, parents, my picture
    AppHeader(class="ac-apphead")

    div(class="ac-body")
      //- heading with the companion lamb
      header(class="ac-head")
        div(class="ac-head-text")
          h1(class="ac-head-title") {{ t('app.nav.color') }}
          p(class="ac-head-sub") {{ t('app.coloring.menuSub') }}
        LkCompanion(class="ac-head-lamb" pose="stift" :size="92")

      //- 1. My coloring books: the books on their shelf, or the way to the books
      section(class="ac-sec" aria-labelledby="ac-h-books")
        h2(id="ac-h-books" class="ac-sec-title")
          span {{ t('app.coloring.myBooks') }}
          span(v-if="books.length" class="ac-count") {{ books.length }}
        div(v-if="books.length" class="ac-shelf lk-panel")
          div(class="ac-bigbooks")
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
        //- nothing on the shelf yet: a big door like the ones in Lesen
        button(v-else type="button" class="ac-door" @click="emit('to-reading')")
          span(class="ac-door-pic")
            img(:src="booksDoorImage" alt="" draggable="false" decoding="async")
          span(class="ac-door-body")
            span(class="ac-door-text")
              span(class="ac-door-title") {{ t('app.coloring.shelfDoorTitle') }}
              span(class="ac-door-sub") {{ t('app.coloring.shelfDoorSub') }}
            span(class="ac-door-go")
              ZIconography(name="chevron-right" :size="26")

      //- 2. Paint freely: a blank sheet or an own picture
      section(class="ac-sec" aria-labelledby="ac-h-free")
        h2(id="ac-h-free" class="ac-sec-title")
          span {{ t('app.coloring.freePainting') }}
        div(class="ac-free")
          button(type="button" class="ac-tile" @click="emit('blank', 'portrait')")
            span(class="ac-tile-ico")
              ZIconography(name="plus" :size="26")
            span(class="ac-tile-name") {{ t('app.coloring.blankSheet') }}
            span(class="ac-tile-sub") {{ t('app.coloring.portraitShort') }}
          button(type="button" class="ac-tile" @click="emit('blank', 'landscape')")
            span(class="ac-tile-ico")
              ZIconography(name="plus" :size="26")
            span(class="ac-tile-name") {{ t('app.coloring.blankSheet') }}
            span(class="ac-tile-sub") {{ t('app.coloring.landscapeShort') }}
          button(type="button" class="ac-tile ac-tile--wide" @click="emit('own-image')")
            span(class="ac-tile-ico")
              ZIconography(name="image" :size="26")
            span(class="ac-tile-text")
              span(class="ac-tile-name") {{ t('app.coloring.ownImage') }}
              span(class="ac-tile-sub") {{ t('app.coloring.ownImageHint') }}
            ZIconography(class="ac-tile-go" name="chevron-right" :size="22")

      //- 3. the pictures won as presents (a cup at the end of a journey)
      section(v-if="rewards.length" class="ac-sec" aria-labelledby="ac-h-rewards")
        h2(id="ac-h-rewards" class="ac-sec-title")
          span {{ t('app.coloring.myRewards') }}
          span(class="ac-count") {{ rewards.length }}
        div(class="ac-gallery")
          button(v-for="r in rewards" :key="r.id" type="button" class="ac-gal-tile ac-reward" :aria-label="r.title" @click="emit('open-reward', r)")
            img(:src="r.image" alt="" draggable="false")
            span(class="ac-reward-name") {{ r.title }}

      //- 4. the child's own paintings
      section(v-if="works.length" class="ac-sec" aria-labelledby="ac-h-works")
        h2(id="ac-h-works" class="ac-sec-title")
          span {{ t('app.coloring.myWorks') }}
          span(class="ac-count") {{ works.length }}
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

      //- 5. the other pictures, folded away
      section(v-if="groups.length" class="ac-sec")
        button(type="button" class="ac-more-row lk-panel" :class="{ open: showMore }" :aria-expanded="showMore" @click="showMore = !showMore")
          span(class="ac-more-name") {{ showMore ? t('app.coloring.moreImagesHide') : t('app.coloring.moreImages') }}
          ZIconography(class="ac-more-arrow" name="chevron-down" :size="22")
        template(v-if="showMore")
          div(v-for="g in groups" :key="g.key" class="ac-group")
            h3(class="ac-group-title") {{ g.title }}
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

      //- 6. For parents: all paintings in one file, and back again.
      section(class="ac-sec ac-parents lk-panel" aria-labelledby="ac-h-parents")
        h2(id="ac-h-parents" class="ac-parents-title")
          ZIconography(name="lock" :size="18")
          span {{ t('app.coloring.forParents') }}
        div(class="ac-parents-row")
          button(type="button" class="lk-btn lk-btn--outline lk-btn--small" :disabled="backupBusy" @click="emit('export-backup')")
            ZIconography(name="download" :size="18")
            | {{ t('app.coloring.backupAll') }}
          button(type="button" class="lk-btn lk-btn--outline lk-btn--small" :disabled="backupBusy" @click="emit('pick-backup')")
            ZIconography(name="restart" :size="18")
            | {{ t('app.coloring.backupRestore') }}
        p(v-if="backupMessage" class="ac-parents-msg" role="status") {{ backupMessage }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit
  touch-action: manipulation

.ac-pick
  position: absolute
  inset: 0
  background: var(--lk-bg)
  color: var(--lk-text)
  overflow-y: auto
  padding: 0 16px calc(7rem + env(safe-area-inset-bottom, 0px))
  -webkit-overflow-scrolling: touch

.ac-apphead
  width: 100%
  max-width: 980px
  margin: 0 auto 8px
  padding-left: 0
  padding-right: 0

.ac-body
  max-width: 980px
  margin: 0 auto
  display: flex
  flex-direction: column
  gap: 22px

// ── Heading: like Lesen and Abenteuer ─────────────────────────────────────────────────────
.ac-head
  display: flex
  align-items: flex-end
  justify-content: space-between
  gap: 12px

.ac-head-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.1

.ac-head-sub
  margin: 4px 0 0
  color: var(--lk-muted)
  font-size: 1.05rem

.ac-head-lamb
  flex: 0 0 auto
  margin-bottom: -4px

// ── A group: its heading (with a small count) and what belongs to it ─────────────────────
.ac-sec
  display: flex
  flex-direction: column
  gap: 10px

.ac-sec-title
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin: 0
  font-size: 1.25rem
  font-weight: 800
  color: var(--lk-text)

.ac-count
  padding: 3px 10px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  font-size: 0.8rem
  font-weight: 700
  color: var(--lk-muted)

// ── 1. The shelf of coloring books ────────────────────────────────────────────────────
.ac-shelf
  padding: 14px 14px 16px
  overflow: hidden

// the books stand in one row on a shelf, swiped sideways: the one painted on last is in front
.ac-bigbooks
  display: flex
  gap: 12px
  margin: 0 -14px
  padding: 6px 14px 4px
  overflow-x: auto
  scroll-snap-type: x proximity
  scroll-padding-left: 14px
  scrollbar-width: none

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

.ac-bigbook
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px
  padding: 0
  border: 0
  background: transparent
  color: var(--lk-text)
  text-align: left
  cursor: pointer

  &:active .ac-bigbook-cover
    transform: scale(0.97)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 4px
    border-radius: 12px

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
  color: var(--lk-muted)

// the empty shelf: a door with a picture on top, built like the doors of Lesen
.ac-door
  display: flex
  flex-direction: column
  padding: 0
  overflow: hidden
  text-align: left
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  box-shadow: var(--lk-shadow)
  cursor: pointer

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

.ac-door-pic
  position: relative
  display: block
  aspect-ratio: 16 / 9
  overflow: hidden
  background: var(--lk-surface-2)

  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.ac-door-body
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  padding: 14px 14px 16px 18px

.ac-door-text
  display: flex
  flex-direction: column
  gap: 2px
  min-width: 0

.ac-door-title
  font-size: 1.3rem
  font-weight: 800

.ac-door-sub
  color: var(--lk-muted)
  font-size: 0.95rem
  line-height: 1.35

.ac-door-go
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 52px
  height: 52px
  border-radius: 50%
  background: var(--lk-accent)
  color: var(--lk-on-accent)

// ── 2. Paint freely: two blank sheets and an own picture ─────────────────────────────
.ac-free
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.ac-tile
  display: flex
  flex-direction: column
  align-items: flex-start
  gap: 2px
  min-height: 56px
  padding: 14px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  text-align: left
  box-shadow: var(--lk-shadow)
  cursor: pointer

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

.ac-tile-ico
  display: grid
  place-items: center
  flex: 0 0 auto
  width: 48px
  height: 48px
  margin-bottom: 8px
  border-radius: 50%
  background: var(--lk-accent-soft)
  color: var(--lk-accent)

.ac-tile-text
  display: flex
  flex-direction: column
  gap: 2px
  flex: 1 1 auto
  min-width: 0

.ac-tile-name
  font-size: 1.02rem
  font-weight: 800
  line-height: 1.25

.ac-tile-sub
  font-size: 0.88rem
  color: var(--lk-muted)

// the own picture takes the full width: symbol, text, arrow in a row
.ac-tile--wide
  grid-column: 1 / -1
  flex-direction: row
  align-items: center
  gap: 14px

  .ac-tile-ico
    margin-bottom: 0

.ac-tile-go
  flex: 0 0 auto
  color: var(--lk-muted)

// wide screens: the three tiles stand side by side, all of the same build
@media (min-width: 640px)
  .ac-free
    grid-template-columns: repeat(3, minmax(0, 1fr))

  .ac-tile--wide
    grid-column: auto
    flex-direction: column
    align-items: flex-start
    gap: 2px

    .ac-tile-ico
      margin-bottom: 8px

  .ac-tile-go
    display: none

  .ac-gallery
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr))

// ── 3. and 4. Pictures: presents and own paintings ──────────────────────────────────
.ac-gallery
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr))
  gap: 12px

.ac-gal-tile
  position: relative
  display: block
  width: 100%
  aspect-ratio: 3 / 4
  padding: 0
  overflow: hidden
  border-radius: 18px
  border: 1px solid var(--lk-line)
  background: #ffffff
  box-shadow: var(--lk-shadow)
  cursor: pointer
  transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1)

  img
    width: 100%
    height: 100%
    object-fit: contain
    display: block

  &:active
    transform: scale(0.96)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

  @media (hover: hover)
    &:hover
      transform: translateY(-3px) rotate(-0.6deg)

.ac-gal-pdf
  display: grid
  place-items: center
  width: 100%
  height: 100%
  font-size: 2.4rem

.ac-reward
  border: 2px solid var(--lk-gold)

.ac-reward-name
  position: absolute
  left: 0
  right: 0
  bottom: 0
  padding: 16px 6px 6px
  background: linear-gradient(transparent, rgba(22, 36, 51, 0.78))
  color: #ffffff
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
  width: 30px
  height: 30px
  border-radius: 50%
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  color: var(--lk-muted)
  font-size: 0.8rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 6px rgba(22, 60, 64, 0.3)

// ── 5. More pictures: one row that opens ───────────────────────────────────────────────
.ac-more-row
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  width: 100%
  min-height: 56px
  padding: 0 18px
  color: var(--lk-text)
  font-size: 1rem
  font-weight: 700
  text-align: left
  cursor: pointer

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

.ac-more-arrow
  flex: 0 0 auto
  color: var(--lk-muted)
  transition: transform 220ms ease-out

.ac-more-row.open .ac-more-arrow
  transform: rotate(180deg)

.ac-group
  display: flex
  flex-direction: column
  gap: 10px
  margin-top: 6px

.ac-group-title
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  color: var(--lk-text)

// ── 6. For parents ──────────────────────────────────────────────────────────────────────
.ac-parents
  padding: 16px
  gap: 12px

.ac-parents-title
  display: flex
  align-items: center
  gap: 8px
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  color: var(--lk-text)

.ac-parents-row
  display: flex
  flex-wrap: wrap
  gap: 10px

  .lk-btn
    flex: 1 1 200px

    &:disabled
      opacity: 0.5

.ac-parents-msg
  margin: 0
  font-size: 0.9rem
  color: var(--lk-muted)

@media (prefers-reduced-motion: reduce)
  .ac-bigbook-cover,
  .ac-gal-tile,
  .ac-more-arrow
    transition: none
</style>
