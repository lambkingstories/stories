<script setup lang="ts">
/**
 * The main menu of the painting program. It is built like the other tabs (Lesen, Abenteuer, Ich): a left-aligned heading with the
 * companion lamb, then framed groups in the surface colour, one after the other: "My coloring books" (the books standing on a
 * shelf, or a big door to the books while the shelf is empty), "Paint freely" (blank sheets and an own picture), the pictures won
 * as presents, the child's own paintings, the finished pictures of the coloring books, and the part for parents. At the top stands the card "Keep painting"
 * with the painting that was painted on last (or "Your first picture" while there is none), and under it a small row of the exhibition (the three best
 * paintings, kept on the device only). A tap on a painting of the exhibition or of the finished pictures opens the quiet view (`ArtworkViewer`), not the
 * painting screen. The other pictures (built in and from stories) are not shown any more; they are still handed in (`groups`).
 * It only shows what it is given and says what was tapped; the screen with the picture does the rest.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import ArtworkViewer from '@/components/molecules/ArtworkViewer.vue'
import { prependBaseUrl } from '@/utils/function'
import useExhibition from '@/use/useExhibition'
import useColoringShelf from '@/use/useColoringShelf'
import type { ArtworkMeta } from '@/use/useArtworks'
import type { TimelapseData } from '@/utils/timelapse'
import { frameRatio } from '@/utils/coloringThumb'
import type { BookCard, GalleryGroup, GalleryItem, RewardItem } from '@/types/coloringMenu'

interface Props {
  /** The coloring books, the ones being painted first. */
  books: BookCard[]
  /** The child's paintings that are not part of a book. */
  works: ArtworkMeta[]
  /** The other pictures to colour (built in, and from stories). Not shown at the moment, kept so that they can come back. */
  groups: GalleryGroup[]
  /** All paintings of the child (also the ones from the coloring books): the exhibition is made of them. */
  exhibitionWorks: ArtworkMeta[]
  /** The pictures won as presents. */
  rewards: RewardItem[]
  backupBusy: boolean
  backupMessage: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'open-book': [card: BookCard]
  'remove-book': [card: BookCard]
  'to-books': []
  /** Back to "Such dir ein Malbuch aus". */
  back: []
  blank: [shape: 'portrait' | 'landscape']
  'own-image': []
  'open-work': [meta: ArtworkMeta]
  'ask-delete': [meta: ArtworkMeta]
  'pick-item': [item: GalleryItem]
  'save-work': [meta: ArtworkMeta]
  'play-lapse': [meta: ArtworkMeta, data: TimelapseData]
  'open-reward': [item: RewardItem]
  'export-backup': []
  'pick-backup': []
}>()

const { t } = useI18n({ useScope: 'global' })

// ── The painting to keep painting on, my exhibition and my finished pictures ──────────────────
const exhibition = useExhibition()
/** The places of the exhibition (a ref on the top level, so the template sees its value). */
const exPlaces = exhibition.places
const worksById = computed(() => new Map(props.exhibitionWorks.map((w) => [w.id, w])))
const recent = computed(() => [...props.exhibitionWorks].sort((a, b) => b.updatedAt - a.updatedAt))

/** The painting for the card on top: the one painted on last that is not finished; when all are, the newest. */
const continueWork = computed<ArtworkMeta | null>(() => recent.value.find((w) => !w.done) ?? recent.value[0] ?? null)
/** The line under its name: the page of the book, or "finished". */
const continueSub = computed(() => {
  const w = continueWork.value
  if (!w) return ''
  if (w.bookId && w.bookPage) {
    const book = props.books.find((b) => b.bookId === w.bookId)
    return book ? t('app.coloring.pageOfBook', { title: book.title, n: w.bookPage, total: book.total }) : t('app.coloring.pageNumber', { n: w.bookPage })
  }
  return w.done ? t('app.coloring.finishedTag') : ''
})

/** The paintings that hang, in the order of the places (a place whose painting is gone is left out). */
const hungWorks = computed(() =>
  exPlaces.value.flatMap((id, place) => {
    const work = id ? worksById.value.get(id) : undefined
    return work ? [{ place, work }] : []
  })
)
/** The paintings that do not hang yet: they can be chosen. */
const hangable = computed(() => recent.value.filter((w) => !exPlaces.value.includes(w.id)))
const canHangMore = computed(() => hungWorks.value.length < exPlaces.value.length && hangable.value.length > 0)
const canFill = computed(() => hungWorks.value.length === 0 && props.exhibitionWorks.length > 0)
/** The window to choose a painting for the exhibition. */
const picking = ref(false)

function choose(w: ArtworkMeta) {
  exhibition.hang(w.id)
  picking.value = false
}
/** The newest finished paintings first, then the newest of the rest. */
function fillNewest() {
  const sorted = [...props.exhibitionWorks].sort((a, b) => Number(!!b.done) - Number(!!a.done) || b.updatedAt - a.updatedAt)
  exhibition.fill(sorted.slice(0, 3).map((w) => w.id))
}

/** The finished pictures of the coloring books, the newest first; six are shown, "show all" opens the rest. */
const finishedBook = computed(() => recent.value.filter((w) => w.done && w.bookId))
const FINISHED_SHOWN = 6
const showAllFinished = ref(false)
const finishedShown = computed(() => (showAllFinished.value ? finishedBook.value : finishedBook.value.slice(0, FINISHED_SHOWN)))

/** The quiet view of one painting. */
const viewing = ref<ArtworkMeta | null>(null)
const viewingHung = computed(() => !!viewing.value && exPlaces.value.includes(viewing.value.id))
function toggleHang(w: ArtworkMeta) {
  if (exPlaces.value.includes(w.id)) exhibition.unhang(w.id)
  else exhibition.hang(w.id)
}
function viewContinue(w: ArtworkMeta) {
  viewing.value = null
  emit('open-work', w)
}

/** The frame of a painting has the ratio of its sheet (no white bars). */
const frameStyle = (w: ArtworkMeta) => ({ aspectRatio: String(frameRatio(w)) })

/** The picture of the door to the books (the children's hands painting in a coloring book, the lamb watching). */
const booksDoorImage = prependBaseUrl('images/bg/malen-kinderhaende.webp')

// ── The book that has just come from the choice page: it is lifted once, softly, and brought into view ──────────────────────────
const paintShelf = useColoringShelf()
/** The book that is lifted right now (it stays marked for a short while only, never as a lasting glow). */
const lifted = ref('')
let liftTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => [paintShelf.fresh.value, props.books.map((b) => b.bookId).join('|')] as const,
  ([id]) => {
    if (!id || !props.books.some((b) => b.bookId === id)) return
    lifted.value = id
    paintShelf.clearFresh(id)
    void nextTick(() => {
      Array.from(document.querySelectorAll<HTMLElement>('[data-shelf-book]')).find((el) => el.dataset.shelfBook === id)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    })
    clearTimeout(liftTimer)
    liftTimer = setTimeout(() => (lifted.value = ''), 2800)
  },
  { immediate: true }
)
onBeforeUnmount(() => clearTimeout(liftTimer))

const bookPercent = (b: BookCard) => `${Math.round((b.done / Math.max(1, b.total)) * 100)}%`
</script>

<template lang="pug">
  div(class="ac-pick")
    //- the same top line as on the other tabs: logo, parents, my picture
    AppHeader(class="ac-apphead")

    div(class="ac-body")
      //- the way back to "Such dir ein Malbuch aus"
      button(type="button" class="lk-btn lk-btn--outline lk-btn--small ac-back" data-test="menu-back" @click="emit('back')")
        ZIconography(name="chevron-left" :size="20")
        span {{ t('app.coloring.pickBack') }}

      //- heading with the companion lamb
      header(class="ac-head")
        div(class="ac-head-text")
          h1(class="ac-head-title") {{ t('app.nav.color') }}
          p(class="ac-head-sub") {{ t('app.coloring.menuSub') }}
        LkCompanion(class="ac-head-lamb" pose="stift" :size="92")

      //- the painting that was painted on last: one tap goes on painting; while there is none, "Your first picture" with a button into painting
      section(v-if="continueWork" class="ac-continue lk-panel" aria-labelledby="ac-h-continue" data-test="continue-card")
        button(type="button" class="ac-cont-pic" :aria-label="t('app.coloring.keepPainting') + ': ' + continueWork.title" @click="emit('open-work', continueWork)")
          img(:src="continueWork.thumb" alt="" draggable="false" :style="frameStyle(continueWork)")
        div(class="ac-cont-body")
          h2(id="ac-h-continue" class="ac-cont-kicker") {{ continueWork.done ? t('app.coloring.continueKickerDone') : t('app.coloring.continueKicker') }}
          p(class="ac-cont-title") {{ continueWork.title }}
          p(v-if="continueSub" class="ac-cont-sub") {{ continueSub }}
          button(type="button" class="lk-btn ac-cont-go" data-test="continue-go" @click="emit('open-work', continueWork)")
            ZIconography(name="brush" :size="22")
            span {{ t('app.coloring.keepPainting') }}
      section(v-else class="ac-continue ac-first lk-panel" aria-labelledby="ac-h-first" data-test="first-card")
        span(class="ac-first-ico" aria-hidden="true")
          ZIconography(name="brush" :size="30")
        div(class="ac-cont-body")
          h2(id="ac-h-first" class="ac-cont-kicker") {{ t('app.coloring.firstTitle') }}
          p(class="ac-cont-sub") {{ t('app.coloring.firstText') }}
          button(type="button" class="lk-btn ac-cont-go" data-test="first-go" @click="emit('blank', 'portrait')")
            ZIconography(name="plus" :size="22")
            span {{ t('app.coloring.firstGo') }}

      //- my exhibition: a small row of the best paintings (only on this device); nothing is shown while there is no painting at all
      section(v-if="exhibitionWorks.length" class="ac-sec" aria-labelledby="ac-h-exhibition" data-test="exhibition")
        h2(id="ac-h-exhibition" class="ac-sec-title")
          span {{ t('app.coloring.exhibition') }}
          span(class="ac-count") {{ hungWorks.length }}/3
        div(class="ac-exrow")
          div(v-for="h in hungWorks" :key="h.work.id" class="ac-place")
            button(
              type="button"
              class="ac-frame"
              data-test="exhibition-frame"
              :style="frameStyle(h.work)"
              :aria-label="t('app.coloring.exhibitionOpen', { n: h.place + 1, title: h.work.title })"
              @click="viewing = h.work"
            )
              img(:src="h.work.thumb" alt="" draggable="false")
            span(class="ac-place-no" aria-hidden="true") {{ h.place + 1 }}
          button(v-if="canHangMore" type="button" class="ac-frame is-empty ac-hangmore" data-test="exhibition-add" :aria-label="t('app.coloring.exhibitionHang')" @click="picking = true")
            ZIconography(name="plus" :size="26")
            span {{ t('app.coloring.exhibitionHang') }}
        button(v-if="canFill" type="button" class="lk-btn lk-btn--outline lk-btn--small ac-ex-fill" data-test="exhibition-fill" @click="fillNewest")
          | {{ t('app.coloring.exhibitionFill') }}

      //- 1. My coloring books: the books on their shelf, or the way to the books
      section(class="ac-sec" aria-labelledby="ac-h-books")
        h2(id="ac-h-books" class="ac-sec-title")
          span {{ t('app.coloring.myBooks') }}
          span(v-if="books.length" class="ac-count") {{ books.length }}
        div(v-if="books.length" class="ac-shelf lk-panel")
          div(:class="['ac-bigbooks', { 'is-one': books.length === 1 }]")
            div(v-for="b in books" :key="b.bookId" :class="['ac-bigbook-wrap', { 'is-lifted': lifted === b.bookId }]" :data-shelf-book="b.bookId")
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
              button(type="button" class="ac-bigbook-remove" :aria-label="t('app.coloring.shelfRemove', { title: b.title })" @click="emit('remove-book', b)")
                span(aria-hidden="true") ✕
            //- one book only: the shelf would look empty beside it, so a friendly note stands there (the way to the other books)
            div(v-if="books.length === 1" class="ac-onebook" data-test="one-book-note")
              p(class="ac-onebook-text") {{ t('app.coloring.shelfMore') }}
              button(type="button" class="lk-btn ac-onebook-go" @click="emit('to-books')")
                span {{ t('app.coloring.shelfGo') }}
                ZIconography(name="chevron-right" :size="20")
          //- the way to all coloring books, also when the shelf is full
          button(v-if="books.length !== 1" type="button" class="lk-btn lk-btn--outline ac-allbooks" @click="emit('to-books')")
            span {{ t('app.coloring.shelfGo') }}
            ZIconography(name="chevron-right" :size="20")
        //- nothing on the shelf yet: a big door like the ones in Lesen
        button(v-else type="button" class="ac-door" @click="emit('to-books')")
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
            button(type="button" class="ac-gal-tile" :style="frameStyle(w)" :aria-label="w.title" @click="emit('open-work', w)")
              img(:src="w.thumb" alt="" draggable="false")
            button(
              type="button"
              class="ac-work-del"
              :aria-label="t('app.coloring.deleteTitle')"
              @click="emit('ask-delete', w)"
            )
              span(aria-hidden="true") ✕

      //- 5. My finished pictures: the pictures that were finished in the coloring books (a tap shows one quietly)
      section(v-if="finishedBook.length" class="ac-sec" aria-labelledby="ac-h-finished" data-test="finished-gallery")
        h2(id="ac-h-finished" class="ac-sec-title")
          span {{ t('app.coloring.myFinished') }}
          span(class="ac-count") {{ finishedBook.length }}
        div(class="ac-gallery")
          button(v-for="w in finishedShown" :key="w.id" type="button" class="ac-gal-tile" data-test="finished-tile" :style="frameStyle(w)" :aria-label="w.title" @click="viewing = w")
            img(:src="w.thumb" alt="" draggable="false")
        button(v-if="finishedBook.length > FINISHED_SHOWN" type="button" class="lk-btn lk-btn--outline lk-btn--small ac-ex-fill" data-test="finished-more" @click="showAllFinished = !showAllFinished")
          | {{ showAllFinished ? t('app.coloring.showLess') : t('app.coloring.showAll', { n: finishedBook.length }) }}

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

    //- the window to choose a painting for the exhibition
    div(v-if="picking" class="ac-ex-overlay" role="dialog" aria-modal="true" :aria-label="t('app.coloring.exhibitionChoose')" @click.self="picking = false" @keydown.esc="picking = false")
      div(class="ac-ex-window lk-panel")
        h3(class="ac-ex-window-title") {{ t('app.coloring.exhibitionChoose') }}
        div(class="ac-gallery")
          button(v-for="w in hangable" :key="w.id" type="button" class="ac-gal-tile" data-test="picker-tile" :style="frameStyle(w)" :aria-label="w.title" @click="choose(w)")
            img(:src="w.thumb" alt="" draggable="false")
        button(type="button" class="lk-btn lk-btn--outline lk-btn--small ac-ex-close" @click="picking = false") {{ t('app.coloring.exhibitionClose') }}

    //- the quiet view of one painting
    ArtworkViewer(
      v-if="viewing"
      :work="viewing"
      :hung="viewingHung"
      @close="viewing = null"
      @continue="viewContinue"
      @save="(w) => emit('save-work', w)"
      @lapse="(w, d) => emit('play-lapse', w, d)"
      @toggle-hang="toggleHang"
    )
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

// a phone held wide: the slim tab bar needs less room at the foot
@media (max-height: 450px) and (orientation: landscape)
  .ac-pick
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px))

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

// back to the choice of a coloring book (a capsule like the one on the inner pages; at least 48 px high)
.ac-back
  align-self: flex-start
  min-height: 48px
  gap: 4px
  padding: 0 18px 0 10px
  margin-bottom: -10px

  :deep(.z-icon-outline)
    color: currentColor

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

// ── The card on top: keep painting (or the first picture) ──────────────────────────────────
.ac-continue
  display: flex
  align-items: center
  gap: 14px
  padding: 12px

.ac-cont-pic
  flex: 0 0 auto
  width: clamp(110px, 32%, 190px)
  display: grid
  place-items: center
  padding: 0
  border: 0
  background: transparent
  cursor: pointer

  img
    display: block
    width: 100%
    max-height: 210px
    object-fit: cover
    border: 3px solid #d9a93a
    border-radius: 4px
    background: #ffffff
    box-shadow: 0 6px 14px rgba(70, 45, 10, 0.28)

  &:active img
    transform: scale(0.98)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 3px

.ac-cont-body
  flex: 1 1 auto
  min-width: 0
  display: flex
  flex-direction: column
  align-items: flex-start
  gap: 4px

.ac-cont-kicker
  margin: 0
  font-size: 0.8rem
  font-weight: 800
  letter-spacing: 0.04em
  color: var(--lk-muted)

.ac-cont-title
  margin: 0
  font-size: 1.25rem
  font-weight: 800
  line-height: 1.2
  overflow-wrap: anywhere

.ac-cont-sub
  margin: 0
  color: var(--lk-muted)
  font-size: 0.95rem
  line-height: 1.35

.ac-cont-go
  margin-top: 8px
  min-height: 56px

.ac-first-ico
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 64px
  height: 64px
  border-radius: 50%
  background: var(--lk-accent-soft)
  color: var(--lk-accent)

// ── 1. The shelf of coloring books ────────────────────────────────────────────────────
.ac-shelf
  padding: 14px 14px 16px
  overflow: hidden

// the books stand in one row on a shelf, swiped sideways: the one painted on last is in front
.ac-allbooks
  width: 100%
  margin-top: 12px
  justify-content: center

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

// takes a book off the shelf: 48 px to hit (Anton's rule), a round 32 px disc to look at, at the top left corner of the cover
.ac-bigbook-remove
  position: absolute
  top: 0
  left: 0
  z-index: 2
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer

  span
    display: grid
    place-items: center
    width: 32px
    height: 32px
    border-radius: 50%
    background: var(--lk-surface)
    color: var(--lk-muted)
    font-size: 0.85rem
    font-weight: 800
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35)

// one book on the shelf: it stands at the left, a friendly note on the right
.ac-bigbooks.is-one
  align-items: stretch

.ac-onebook
  flex: 1 1 0
  min-width: 150px
  display: flex
  flex-direction: column
  align-items: flex-start
  justify-content: center
  gap: 10px
  padding: 4px 6px

.ac-onebook-text
  margin: 0
  color: var(--lk-muted)
  font-size: 0.98rem
  line-height: 1.4

.ac-onebook-go
  min-height: 56px

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

// the book that has just come from the choice page: lifted once, with a soft ring that fades away (never a lasting glow)
.ac-bigbook-wrap.is-lifted .ac-bigbook-cover
  animation: ac-lift 2400ms cubic-bezier(0.22, 1, 0.36, 1) 1 both

@keyframes ac-lift
  0%
    transform: translateY(0) scale(1)
    box-shadow: 0 0 0 0 rgba(217, 169, 58, 0), 0 20px 30px -14px rgba(60, 40, 10, 0.6), 0 2px 5px rgba(60, 40, 10, 0.28)
  25%
    transform: translateY(-10px) scale(1.04)
    box-shadow: 0 0 0 6px rgba(217, 169, 58, 0.55), 0 26px 34px -14px rgba(60, 40, 10, 0.6), 0 2px 5px rgba(60, 40, 10, 0.28)
  100%
    transform: translateY(0) scale(1)
    box-shadow: 0 0 0 0 rgba(217, 169, 58, 0), 0 20px 30px -14px rgba(60, 40, 10, 0.6), 0 2px 5px rgba(60, 40, 10, 0.28)

@media (prefers-reduced-motion: reduce)
  // only a soft ring that fades, nothing moves
  .ac-bigbook-wrap.is-lifted .ac-bigbook-cover
    animation-name: ac-lift-calm

@keyframes ac-lift-calm
  0%
    box-shadow: 0 0 0 6px rgba(217, 169, 58, 0.55), 0 20px 30px -14px rgba(60, 40, 10, 0.6)
  100%
    box-shadow: 0 0 0 0 rgba(217, 169, 58, 0), 0 20px 30px -14px rgba(60, 40, 10, 0.6)

.ac-bigbook-badge
  position: absolute
  top: 8px
  right: 8px
  z-index: 1
  padding: 3px 9px
  border-radius: 999px
  background: rgba(34, 38, 46, 0.78)
  color: #ffffff
  font-size: 0.75rem
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
  text-align: center
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
  flex: 1 1 auto
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
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
  align-items: center
  gap: 2px
  min-height: 56px
  padding: 14px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  text-align: center
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
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))

// ── 3. and 4. Pictures: presents and own paintings ──────────────────────────────────
.ac-gallery
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr))
  gap: 12px
  align-items: start

.ac-gal-tile
  position: relative
  display: block
  width: 100%
  // a painting has the ratio of its sheet (set on the tile); the presents and everything else without a ratio are 3:4
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
    object-fit: cover
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

  img
    object-fit: contain

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

// deletes a painting: 48 px to hit (Anton's rule), a round 32 px disc to look at, in the top right corner
.ac-work-del
  position: absolute
  top: 0
  right: 0
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer

  span
    display: grid
    place-items: center
    width: 32px
    height: 32px
    border-radius: 50%
    border: 1px solid var(--lk-line)
    background: var(--lk-surface)
    color: var(--lk-muted)
    font-size: 0.85rem
    font-weight: 800
    box-shadow: 0 2px 6px rgba(22, 60, 64, 0.3)

// ── My exhibition: a small row of the best paintings ────────────────────────────────────────
// the row is swiped sideways; every frame has the ratio of its painting, so there are no white bars; the paintings are sharp (the thumb is 800 px)
.ac-exrow
  display: flex
  align-items: flex-start
  // the wall is as wide as its pictures (one picture: a small wall), and is swiped when there are more than fit
  align-self: flex-start
  max-width: 100%
  gap: 14px
  padding: 14px 14px 12px
  overflow-x: auto
  border-radius: 20px
  // a warm wall the pictures hang on
  background: linear-gradient(180deg, #f6ecd8 0%, #ecdcbb 100%)
  box-shadow: inset 0 0 0 1px rgba(160, 120, 50, 0.18), var(--lk-shadow)
  scrollbar-width: none
  -webkit-overflow-scrolling: touch

  &::-webkit-scrollbar
    display: none

.ac-place
  position: relative
  flex: 0 0 auto

.ac-frame
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 6px
  height: 150px
  padding: 0
  overflow: hidden
  border-radius: 4px
  // a thin golden frame
  border: 4px solid #d9a93a
  background: #ffffff
  box-shadow: 0 0 0 1.5px #f6d77a inset, 0 6px 14px rgba(70, 45, 10, 0.28)
  color: var(--lk-muted)
  font-weight: 700
  font-size: 0.85rem
  cursor: pointer
  transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

  &:active
    transform: scale(0.98)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

// the place that is still free: one small dashed frame ("Hang a picture") with a plus, 150 px high like the others
.ac-frame.is-empty
  width: 112px
  padding: 8px
  text-align: center
  background: rgba(255, 255, 255, 0.55)
  border-style: dashed
  border-color: #c9b07a
  box-shadow: none

// the number of the place on a small golden disc in the corner
.ac-place-no
  position: absolute
  top: -8px
  left: -8px
  width: 28px
  height: 28px
  display: grid
  place-items: center
  border-radius: 50%
  background: linear-gradient(160deg, #ffe08a, #e0a82e)
  color: #5a3a00
  font-weight: 800
  font-size: 0.9rem
  box-shadow: 0 2px 5px rgba(70, 45, 10, 0.35)
  pointer-events: none

.ac-ex-fill
  align-self: flex-start
  min-height: 48px

.ac-ex-overlay
  position: fixed
  inset: 0
  z-index: 60
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  background: rgba(22, 36, 51, 0.55)

.ac-ex-window
  width: 100%
  max-width: 640px
  max-height: 80vh
  overflow-y: auto
  padding: 18px 16px 16px
  display: flex
  flex-direction: column
  gap: 12px

.ac-ex-window-title
  margin: 0
  font-size: 1.2rem
  font-weight: 800

.ac-ex-close
  align-self: center
  min-height: 48px

.lk-btn--small
  min-height: 48px

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

@media (min-width: 640px)
  .ac-frame
    height: 190px

  .ac-frame.is-empty
    width: 140px

@media (prefers-reduced-motion: reduce)
  .ac-bigbook-cover,
  .ac-gal-tile,
  .ac-frame
    transition: none
</style>
