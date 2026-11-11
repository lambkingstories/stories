<script setup lang="ts">
/**
 * The start page: a hub that shows what the app can do and where the child stands.
 *   1. "Go on": one big card with the adventure the child is in (or the first one), so playing starts with one tap
 *   2. "Continue": the last book and the last picture (with a real cover when nothing was begun yet)
 *   3. the journey through the Bible, then the newest books
 *   4. last: the card for grown-ups (the shop, the sponsors, LambKing Plus)
 * (Anton 10.11.2026: the page began with advertising instead of playing; the three doors only repeated the bar below.)
 * The look follows the day/night theme (assets/css/theme.css). Support and shop links leave the app: they go through
 * `openExternal`, which asks the parents first. The design is neutral so that other publishers can have shelves, too.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import HomeHero, { type HeroSlide } from '@/components/molecules/HomeHero.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useReadingProgress from '@/use/useReadingProgress'
import useAdventure from '@/use/useAdventure'
import { listArtworks, type ArtworkMeta } from '@/use/useArtworks'
import { journeys } from '@/data/adventures'
import { sponsors } from '@/data/sponsors'
import { nextStageIndex } from '@/utils/adventureScore'
import { inBibleOrder, journeyToBegin, journeyToContinue } from '@/utils/continueJourney'
import { isColoringBook } from '@/utils/coloringBook'
import usePremium, { PREMIUM_TEASER } from '@/use/usePremium'
import { isJourneyPlusLocked } from '@/utils/adventureAccess'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import { requireParent } from '@/use/useParentalGate'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'
import { contentLocale } from '@/utils/contentLocale'
import { BIG_GAMES } from '@/data/bigGames'
import { bigGameStates, nextBigGame, totalStars } from '@/utils/bigGames'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { lastReadId } = useModels()
const apiBooks = useApiBooks()
const { getPct } = useReadingProgress()
const adventure = useAdventure()
const { plusOn } = usePremium()

const STORE_URL = 'https://lambking.store'

const lang = computed<Locale>(() => (contentLocale(locale.value)))
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

// The slides at the end of the page: the shop (and the sponsors when there are some), then LambKing Plus.
const slides = computed(() => {
  const list: HeroSlide[] = []
  // LambKing Plus comes first and has one slide, the rest is on the Plus page. The app does not ask for gifts here any more
  // (Anton 10.11.2026): voluntary support is one small line at the end of the window for parents.
  if (PREMIUM_TEASER) {
    list.push({ id: 'plus', image: prependBaseUrl('images/bg/willkommen-plus-2.webp'), title: t('app.main.plusTitle'), text: t('app.main.plusText') })
  }
  list.push({ id: 'shop', image: prependBaseUrl('images/bg/welcome-bg-3.webp'), title: t('app.main.welcomeTitle2'), text: t('app.home.shopText') })
  if (sponsors.length) {
    list.push({ id: 'sponsors', image: prependBaseUrl('images/bg/welcome-bg-2.webp'), title: t('app.home.sponsorsTitle'), text: t('app.home.sponsorsText') })
  }
  return list
})

function openSponsor(url?: string) {
  if (url) void openExternal(url)
}

function openStore() {
  void openExternal(STORE_URL)
}

/** The way to the page for parents about Plus leads through the parental gate. */
async function openPlus() {
  if (!(await requireParent())) return
  void router.push({ name: 'app-plus' })
}

// ── the journey through the Bible (a row of medals to open an adventure) ─────

const journeyTiles = computed(() =>
  inBibleOrder(journeys).map((j) => ({ id: j.id, title: j.title, image: prependBaseUrl(j.medal), plus: isJourneyPlusLocked(j.id) }))
)

function openJourney(id: string) {
  void router.push({ name: 'app-adventure-map', params: { journeyId: id } })
}

// ── 3. continue ──────────────────────────────────────────────────────────────

interface ResumeCard {
  id: 'adventure' | 'book' | 'picture' | 'games'
  /** The small line above the title: book, painting or adventure. */
  kind: string
  title: string
  meta: string
  image: string
  /** 0–1, or -1 when there is nothing to measure yet. */
  progress: number
  empty: boolean
  /** The picture is a round medal: it stands whole on a soft blur of itself. */
  medal?: boolean
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
    // a real cover; when no story is loaded (yet), the painted picture of the children reading
    const first = newBooks.value.find((b) => !isColoringBook(b)) ?? allBooks.value.find((b) => !isColoringBook(b))
    const image = first ? withPlaceholder(pickLocalizedImage(first.previewImage, lang.value)) : prependBaseUrl('images/bg/welcome-bg-3.webp')
    return { id: 'book', kind, title: t('app.home.discoverBook'), meta: t('app.home.pickBook'), image, progress: -1, empty: true, go: () => void router.push({ name: 'app-all-books' }) }
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
    const first = allBooks.value.find((b) => isColoringBook(b))
    const image = first ? withPlaceholder(pickLocalizedImage(first.previewImage, lang.value)) : ''
    return { id: 'picture', kind, title: t('app.home.discoverPicture'), meta: t('app.home.pickPicture'), image, progress: -1, empty: true, go }
  }
  return { id: 'picture', kind, title: work.title, meta: t('app.home.begun'), image: work.thumb, progress: -1, empty: false, go }
})

/** The big card on top: the adventure the child is in; if none was begun, the first one. */
const hero = computed(() => {
  const begun = journeyToContinue(journeys, adventure.progressOf)
  // none under way: the first adventure of the Bible that is open and not finished (a new child begins with Adam and Eve)
  const journey = begun ?? journeyToBegin(journeys, adventure.progressOf, isJourneyPlusLocked)
  if (!journey) return null
  const total = journey.stages.length
  const next = begun ? (nextStageIndex(journey, adventure.progressOf(journey.id)) ?? 0) : 0
  return {
    begun: !!begun,
    title: journey.title,
    image: prependBaseUrl(journey.cover ?? journey.medal),
    // an adventure without a wide picture shows its round medal: whole, not cut off
    isMedal: !journey.cover,
    medal: prependBaseUrl(journey.medal),
    meta: t('app.home.chapterOf', { n: next + 1, total }),
    progress: next / total,
    go: () => void router.push({ name: 'app-adventure-map', params: { journeyId: journey.id } })
  }
})

/** The adventure the child is in (or the first one): one tap to play. */
const adventureCard = computed<ResumeCard>(() => {
  const h = hero.value
  const kind = t('app.home.kindAdventure')
  if (!h) return { id: 'adventure', kind, title: t('app.home.discoverAdventure'), meta: '', image: '', progress: -1, empty: true, go: () => void router.push({ name: 'app-adventure' }) }
  return { id: 'adventure', kind, title: h.title, meta: h.meta, image: h.image, medal: h.isMedal, progress: h.begun ? h.progress : -1, empty: !h.begun, go: h.go }
})

/** The games: the bonus games the stars have opened (the picture is the newest open one). */
const gamesCard = computed<ResumeCard>(() => {
  const stars = totalStars(journeys, adventure.progressOf)
  const states = bigGameStates(BIG_GAMES, stars)
  const open = states.filter((s) => s.open)
  const next = nextBigGame(BIG_GAMES, stars)
  const shown = open[open.length - 1] ?? states[0]
  return {
    id: 'games',
    kind: t('app.home.kindGames'),
    title: t('app.home.gamesTitle'),
    meta: open.length ? t('app.home.gamesOpen', { n: open.length, total: states.length }) : t('app.home.gamesNext', { n: next?.missing ?? 0 }),
    image: shown ? prependBaseUrl(shown.game.image) : '',
    progress: -1,
    empty: false,
    go: () => void router.push({ name: 'app-gameroom' })
  }
})

const resumeCards = computed<ResumeCard[]>(() => [adventureCard.value, bookCard.value, pictureCard.value, gamesCard.value])
const cardIcon = (id: ResumeCard['id']) => (id === 'adventure' ? 'compass' : id === 'book' ? 'series' : id === 'picture' ? 'brush' : 'star')

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
      //- first: LambKing Plus, the shop and the sponsors, as slides
      HomeHero(:slides="slides" :label="t('app.home.slideLabel')")
        template(#actions="{ id }")
          button(v-if="id === 'plus'" type="button" class="lk-btn hero-shop" @click="openPlus")
            span(class="hero-shop-label") {{ t('app.main.plusMore') }}
            ZIconography(name="chevron-right" :size="22")
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

      //- four big cards: the adventure, reading, painting and the games
      section(class="block")
        h2(class="block-title") {{ t('app.home.todayTitle') }}
        div(class="resume-grid")
          button(
            v-for="c in resumeCards"
            :key="c.id"
            type="button"
            :class="['resume-card', { 'is-empty': c.empty }]"
            :aria-label="c.kind + ': ' + c.title"
            @click="c.go()"
          )
            span(:class="['resume-thumb', { 'is-medal': c.medal }]")
              img(v-if="c.medal && c.image" class="resume-blur" :src="c.image" alt="" draggable="false" aria-hidden="true")
              img(v-if="c.image" class="resume-pic" :src="c.image" alt="" draggable="false" @error="onImgFallback")
              ZIconography(v-else :name="cardIcon(c.id)" :size="40")
              span(class="resume-kind")
                ZIconography(:name="cardIcon(c.id)" :size="16")
                span {{ c.kind }}
            span(class="resume-body")
              span(class="resume-title") {{ c.title }}
              span(v-if="c.progress >= 0" class="resume-bar")
                span(class="resume-bar-fill" :style="{ width: Math.round(c.progress * 100) + '%' }")
              span(v-else-if="c.empty" class="resume-start") {{ t('app.home.startHere') }}
              span(v-else class="resume-meta") {{ c.meta }}

      //- the journey through the Bible
      section(v-if="journeyTiles.length" class="block")
        div(class="block-head")
          div(class="block-titles")
            h2(class="block-title") {{ t('app.home.journeyTitle') }}
            p(class="block-sub") {{ t('app.home.journeySub') }}
          button(type="button" class="block-link" @click="router.push({ name: 'app-adventure' })")
            span {{ t('app.home.seeAll') }}
            ZIconography(name="chevron-right" :size="18")
        div(class="journey-row")
          button(v-for="j in journeyTiles" :key="j.id" type="button" class="journey-tile" @click="openJourney(j.id)")
            span(class="journey-art")
              img(:src="j.image" alt="" draggable="false" loading="lazy")
              span(v-if="j.plus" class="journey-plus")
                PlusBadge(size="small")
            span(class="journey-name") {{ j.title }}

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
  // the button stands in the middle of the card and its words in the middle of the button
  margin: 0 auto
  justify-content: center
  gap: 10px
  padding: 0 20px

  :deep(.z-icon-outline)
    color: currentColor

.hero-shop-label
  flex: 0 1 auto
  text-align: center
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
  line-height: 1.2

.block-link
  flex: 0 0 auto
  white-space: nowrap
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
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

// a white card: the picture fills the top edge to edge, the title and the bar sit below it
.resume-card
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

  // an adventure without a wide picture shows its round medal whole, on a soft blur of itself
  &.is-medal > .resume-blur
    transform: scale(1.5)
    filter: blur(20px) saturate(1.1)
    opacity: 0.55

  &.is-medal > .resume-pic
    object-fit: contain
    padding: 6px 0
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))

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

.block-titles
  min-width: 0

.block-sub
  margin: 0
  font-size: 0.9rem
  color: var(--lk-muted)

// ── the journey through the Bible ──
.journey-row
  display: flex
  gap: 12px
  overflow-x: auto
  scroll-snap-type: x proximity
  margin: 0 -16px
  padding: 4px 16px 10px
  scroll-padding-left: 16px
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none

.journey-tile
  flex: 0 0 96px
  scroll-snap-align: start
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  cursor: pointer

.journey-art
  position: relative
  display: block
  width: 96px
  height: 96px
  border-radius: 50%
  background: radial-gradient(circle at 50% 35%, var(--lk-surface), var(--lk-surface-2))
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    border-radius: 50%

.journey-plus
  position: absolute
  left: 50%
  bottom: -6px
  transform: translateX(-50%)

.journey-name
  font-size: 0.85rem
  font-weight: 800
  line-height: 1.15
  text-align: center
  max-width: 96px

// ── tablet and wide ──
@media (min-width: 720px)
  .resume-grid
    grid-template-columns: repeat(4, minmax(0, 1fr))

  .home-body
    padding: 24px 24px 0
    gap: 28px

  .new-row
    margin: 0 -28px
    padding-left: 28px
    padding-right: 28px
    scroll-padding-left: 28px
</style>
