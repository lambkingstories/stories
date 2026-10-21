<script setup lang="ts">
/**
 * The start page: a hub that shows what the app can do and where the child stands.
 *   1. the welcome card (welcome, support us, the shop) with a picture on top and the text below
 *   2. three main doors: Paint, Read, Adventure
 *   3. "Continue": the last book, the last picture, the current adventure
 *   4. "New": the newest books
 * The look follows the day/night theme (assets/css/theme.css). Support and shop links leave the app: they go through
 * `openExternal`, which asks the parents first. The design is neutral so that other publishers can have shelves, too.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import HomeHero from '@/components/molecules/HomeHero.vue'
import KoFiButton from '@/components/molecules/KoFiButton.vue'
import TipButton from '@/components/molecules/TipButton.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useReadingProgress from '@/use/useReadingProgress'
import useAdventure from '@/use/useAdventure'
import { listArtworks, type ArtworkMeta } from '@/use/useArtworks'
import { journeys } from '@/data/adventures'
import { sponsors } from '@/data/sponsors'
import { nextStageIndex } from '@/utils/adventureScore'
import { isIOS } from '@/utils/platform'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { lastReadId } = useModels()
const apiBooks = useApiBooks()
const { getPct } = useReadingProgress()
const adventure = useAdventure()

const STORE_URL = 'https://lambking.store'

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

const artworks = ref<ArtworkMeta[]>([])

onMounted(() => {
  void apiBooks.loadAllBooks()
  listArtworks()
    .then((list) => {
      artworks.value = list
    })
    .catch(() => {
      artworks.value = []
    })
})

// ── 1. welcome card ──────────────────────────────────────────────────────────

// The welcome comes first, the shop and the sponsors follow, and asking for support is the last slide.
const slides = computed(() => {
  const list = [
    { id: 'welcome', image: prependBaseUrl('images/bg/welcome-bg-1.webp'), title: t('app.home.welcomeTitle'), slogan: t('app.home.slogan'), text: t('app.home.welcomeText') },
    { id: 'shop', image: prependBaseUrl('images/bg/welcome-bg-3.webp'), title: t('app.main.welcomeTitle2'), text: t('app.home.shopText') }
  ]
  if (sponsors.length) {
    list.push({ id: 'sponsors', image: prependBaseUrl('images/bg/welcome-bg-1.webp'), title: t('app.home.sponsorsTitle'), text: t('app.home.sponsorsText') })
  }
  list.push({ id: 'support', image: prependBaseUrl('images/bg/welcome-bg-2.webp'), title: t('app.main.welcomeTitle1'), text: t('app.home.supportText') })
  return list
})

function openSponsor(url?: string) {
  if (url) void openExternal(url)
}

function openStore() {
  void openExternal(STORE_URL)
}

// ── 2. the three main doors ──────────────────────────────────────────────────

const bigButtons = computed(() => [
  { id: 'color', label: t('app.home.bigColor'), icon: 'brush' as const, route: 'app-coloring' },
  { id: 'read', label: t('app.home.bigRead'), icon: 'series' as const, route: 'app-read' },
  { id: 'adventure', label: t('app.home.bigAdventure'), icon: 'compass' as const, route: 'app-adventure' }
])

// ── 3. continue ──────────────────────────────────────────────────────────────

interface ResumeCard {
  id: 'book' | 'picture' | 'adventure'
  /** The small line above the title: book, painting or adventure. */
  kind: string
  title: string
  meta: string
  image: string
  /** 0–1, or -1 when there is nothing to measure yet. */
  progress: number
  empty: boolean
  go: () => void
}

function bookTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function bookPages(book: ApiBook): number {
  return book.localizations?.[lang.value]?.content?.length || book.localizations?.de?.content?.length || 0
}

const bookCard = computed<ResumeCard>(() => {
  const kind = t('app.home.kindBook')
  const book = lastReadId.value ? apiBooks.getById(lastReadId.value) : null
  if (!book) {
    return { id: 'book', kind, title: t('app.home.discoverBook'), meta: t('app.home.pickBook'), image: '', progress: -1, empty: true, go: () => void router.push({ name: 'app-all-books' }) }
  }
  const total = bookPages(book)
  const pct = getPct(book.bookId, total)
  return {
    id: 'book',
    kind,
    title: bookTitle(book),
    meta: t('app.read.pageShort', { n: Math.max(1, Math.round(pct * total)), total }),
    image: withPlaceholder(pickLocalizedImage(book.previewImage, lang.value)),
    progress: pct,
    empty: false,
    go: () => void router.push({ name: 'app-reader', params: { bookId: book.bookId } })
  }
})

const pictureCard = computed<ResumeCard>(() => {
  const kind = t('app.home.kindPicture')
  const list = [...artworks.value].sort((a, b) => b.updatedAt - a.updatedAt)
  const work = list.find((w) => !w.done) ?? list[0]
  const go = () => void router.push(work ? { name: 'app-coloring', query: { work: work.id } } : { name: 'app-coloring' })
  if (!work) {
    return { id: 'picture', kind, title: t('app.home.discoverPicture'), meta: t('app.home.pickPicture'), image: '', progress: -1, empty: true, go }
  }
  return { id: 'picture', kind, title: work.title, meta: t('app.home.begun'), image: work.thumb, progress: -1, empty: false, go }
})

const adventureCard = computed<ResumeCard>(() => {
  const kind = t('app.home.kindAdventure')
  // the first journey that was begun and is not finished; otherwise the first journey
  const begun = journeys.find((j) => adventure.progressOf(j.id) && nextStageIndex(j, adventure.progressOf(j.id)) !== null)
  const journey = begun ?? journeys[0]
  if (!journey) {
    return { id: 'adventure', kind, title: t('app.home.startHere'), meta: '', image: '', progress: -1, empty: true, go: () => void router.push({ name: 'app-adventure' }) }
  }
  const prog = adventure.progressOf(journey.id)
  const go = () => void router.push({ name: 'app-adventure-map', params: { journeyId: journey.id } })
  if (!begun) {
    return { id: 'adventure', kind, title: t('app.home.discoverAdventure'), meta: t('app.home.pickAdventure'), image: prependBaseUrl(journey.cover ?? journey.medal), progress: -1, empty: true, go }
  }
  const next = nextStageIndex(journey, prog) ?? 0
  return {
    id: 'adventure',
    kind,
    title: journey.title,
    meta: t('app.home.chapterOf', { n: next + 1, total: journey.stages.length }),
    image: prependBaseUrl(journey.cover ?? journey.medal),
    progress: next / journey.stages.length,
    empty: false,
    go
  }
})

const resumeCards = computed<ResumeCard[]>(() => [bookCard.value, pictureCard.value, adventureCard.value])

// ── 4. new ───────────────────────────────────────────────────────────────────

const newBooks = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => new Date(b.releaseDate).getTime() <= now)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 10)
})

function openBook(bookId: string) {
  void router.push({ name: 'app-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(class="home")
    AppHeader

    main(class="home-body")
      //- 1. welcome card (picture on top, text below)
      HomeHero(:slides="slides" :label="t('app.home.slideLabel')")
        template(#actions="{ id }")
          template(v-if="id === 'support'")
            TipButton(v-if="isIOS")
            template(v-else)
              KoFiButton(href="https://www.paypal.com/ncp/payment/5CWTQPB6NGWLU" tone="paypal" label="PayPal")
              KoFiButton(href="https://ko-fi.com/U6U21YO0Z5" tone="kofi" label="Ko-fi")
          button(v-else-if="id === 'shop'" type="button" class="lk-btn hero-shop" @click="openStore")
            ZIconography(name="shop" :size="24")
            span(class="hero-shop-label") {{ t('app.home.slide3Button') }}
            ZIconography(name="chevron-right" :size="22")
          template(v-else-if="id === 'sponsors'")
            button(
              v-for="sp in sponsors"
              :key="sp.id"
              type="button"
              class="sponsor"
              :aria-label="sp.name"
              @click="openSponsor(sp.url)"
            )
              img(v-if="sp.logo" :src="prependBaseUrl(sp.logo)" :alt="sp.name" draggable="false")
              span(v-else) {{ sp.name }}

      //- 2. the three main doors
      nav(class="big-row")
        button(
          v-for="b in bigButtons"
          :key="b.id"
          type="button"
          :class="['big-btn', 'is-' + b.id]"
          @click="router.push({ name: b.route })"
        )
          ZIconography(:name="b.icon" :size="24")
          span(class="big-label") {{ b.label }}

      //- 3. where the child stands
      section(class="block")
        h2(class="block-title") {{ t('app.home.resume') }}
        div(class="resume-grid")
          button(
            v-for="c in resumeCards"
            :key="c.id"
            type="button"
            :class="['resume-card', { 'is-empty': c.empty }]"
            :aria-label="c.kind + ': ' + c.title"
            @click="c.go()"
          )
            span(class="resume-thumb")
              img(v-if="c.image" :src="c.image" alt="" draggable="false" @error="onImgFallback")
              ZIconography(v-else :name="c.id === 'book' ? 'series' : c.id === 'picture' ? 'brush' : 'compass'" :size="40")
              span(class="resume-kind")
                ZIconography(:name="c.id === 'book' ? 'series' : c.id === 'picture' ? 'brush' : 'compass'" :size="16")
                span {{ c.kind }}
            span(class="resume-body")
              span(class="resume-title") {{ c.title }}
              span(v-if="c.progress >= 0" class="resume-bar")
                span(class="resume-bar-fill" :style="{ width: Math.round(c.progress * 100) + '%' }")
              span(v-else-if="c.empty" class="resume-start") {{ t('app.home.startHere') }}
              span(v-else class="resume-meta") {{ c.meta }}

      //- 4. new
      section(v-if="newBooks.length" class="block")
        div(class="block-head")
          h2(class="block-title") {{ t('app.home.newTitle') }}
          button(type="button" class="block-link" @click="router.push({ name: 'app-all-new-books' })")
            span {{ t('app.home.seeAll') }}
            ZIconography(name="chevron-right" :size="18")
        div(class="new-row")
          button(
            v-for="(book, i) in newBooks"
            :key="book.bookId"
            type="button"
            class="new-tile"
            @click="openBook(book.bookId)"
          )
            span(class="new-cover")
              img(
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                :alt="bookTitle(book)"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="i === 0" class="new-badge") {{ t('app.read.newBadge') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.home
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.home-body
  max-width: 980px
  margin: 0 auto
  padding: 24px 16px 0
  display: flex
  flex-direction: column
  gap: 28px

.sponsor
  min-height: 44px
  padding: 4px 14px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-btn)
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font-weight: 700
  display: inline-flex
  align-items: center
  cursor: pointer

  img
    height: 32px
    width: auto
    display: block

.hero-shop
  width: 100%
  max-width: 340px
  justify-content: space-between
  gap: 10px
  padding: 0 20px 0 22px

  :deep(.z-icon-outline)
    color: currentColor

.hero-shop-label
  flex: 1
  text-align: left
  font-size: 1.1rem
  font-weight: 800

.hero-btn
  min-height: 44px
  padding: 0 18px
  border: none
  border-radius: var(--lk-r-btn)
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-weight: 800
  font-size: 1rem
  cursor: pointer

// ── the three main doors ──
.big-row
  display: grid
  grid-template-columns: 1fr 1fr 1.08fr
  gap: 8px

.big-btn
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
  min-height: 56px
  padding: 0 8px
  border: none
  border-radius: var(--lk-r-btn)
  background: var(--tone)
  color: var(--lk-on-color)
  cursor: pointer
  touch-action: manipulation
  // a fine inner line and a 1 px lower edge give it a hold; no tall plate, no strong 3D base
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16), 0 1px 0 rgba(0, 0, 0, 0.35)

  &:active
    transform: translateY(1px)
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16)

  &:focus-visible
    outline: 2px solid var(--lk-text)
    outline-offset: 2px

  &.is-color
    --tone: var(--lk-paint)

  &.is-read
    --tone: var(--lk-read)

  &.is-adventure
    --tone: var(--lk-adventure)

  :deep(.z-icon)
    flex: none

  :deep(.z-icon-outline)
    color: currentColor

.big-label
  font-weight: 600
  font-size: 1rem
  white-space: nowrap

// ── blocks ──
.block
  display: flex
  flex-direction: column
  gap: 10px

.block-head
  display: flex
  align-items: center
  justify-content: space-between

.block-title
  margin: 0
  font-weight: 800
  font-size: 1.4rem

.block-link
  display: inline-flex
  align-items: center
  gap: 2px
  min-height: 44px
  padding: 0 2px
  border: none
  background: transparent
  color: var(--lk-text)
  font-weight: 600
  font-size: 1rem
  cursor: pointer

// ── continue ──
.resume-grid
  display: flex
  gap: 12px
  align-items: stretch
  overflow-x: auto
  scroll-snap-type: x proximity
  margin: 0 -16px
  padding: 2px 16px 8px
  scroll-padding-left: 16px
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none

// a white card: the picture fills the top edge to edge, the title and the bar sit below it
.resume-card
  flex: 0 0 min(46%, 260px)
  scroll-snap-align: start
  display: flex
  flex-direction: column
  min-width: 0
  padding: 0
  overflow: hidden
  text-align: left
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  box-shadow: var(--lk-shadow)
  cursor: pointer
  touch-action: manipulation

  &:active
    transform: translateY(1px)

.resume-thumb
  position: relative
  aspect-ratio: 16 / 10
  overflow: hidden
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  display: flex
  align-items: center
  justify-content: center

  // the picture fills the box without ever making it taller (a tall book cover would otherwise stretch the card)
  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover
    display: block

  :deep(.z-icon-outline)
    color: currentColor

.resume-kind
  position: absolute
  left: 8px
  top: 8px
  display: inline-flex
  align-items: center
  gap: 5px
  padding: 3px 10px 3px 7px
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font-size: 0.78rem
  font-weight: 800
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25)

  :deep(.z-icon-outline)
    color: currentColor

.resume-body
  display: flex
  flex-direction: column
  gap: 6px
  flex: 1
  padding: 8px 12px 10px

// every card has the same body: one line for the title, one fixed line below it (the bar, the start chip or the place)
.resume-title
  font-weight: 800
  font-size: 1rem
  line-height: 1.25
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.resume-bar
  display: block
  height: 7px
  margin: 8px 0 7px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.resume-bar-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-fill)

.resume-meta
  min-height: 22px
  line-height: 22px
  font-size: 0.88rem
  color: var(--lk-muted)

.resume-start
  align-self: flex-start
  min-height: 22px
  line-height: 14px
  padding: 4px 12px
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-size: 0.82rem
  font-weight: 700

.resume-card.is-empty .resume-thumb
  background: var(--lk-surface-2)

// ── new ──
.new-row
  display: flex
  gap: 12px
  overflow-x: auto
  scroll-snap-type: x proximity
  margin: 0 -16px
  padding: 2px 16px 8px
  scroll-padding-left: 16px
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none

.new-tile
  flex: 0 0 31%
  max-width: 190px
  scroll-snap-align: start
  border: none
  background: transparent
  padding: 0
  cursor: pointer

.new-cover
  position: relative
  display: block
  aspect-ratio: 3 / 4
  border-radius: var(--lk-r-cover)
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.new-badge
  position: absolute
  top: 8px
  left: 8px
  padding: 2px 8px
  border-radius: 6px
  background: var(--lk-new)
  color: #fff
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.04em

// ── tablet and wide ──
@media (min-width: 720px)
  .home-body
    padding: 24px 24px 0
    gap: 28px

  .new-row
    margin: 0 -28px
    padding-left: 28px
    padding-right: 28px
    scroll-padding-left: 28px
</style>
