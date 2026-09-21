<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZButton from '@/components/atoms/ZButton.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AvatarPickerModal from '@/components/molecules/AvatarPickerModal.vue'
import WelcomeSlider from '@/components/molecules/WelcomeSlider.vue'
import KoFiButton from '@/components/molecules/KoFiButton.vue'
import TipButton from '@/components/molecules/TipButton.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiCategories from '@/use/useApiCategories'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import useReadingProgress from '@/use/useReadingProgress'
import useAvatar, { onAvatarFallback } from '@/use/useAvatar'
import useUserName from '@/use/useUserName'
import { isIOS, isMobileLandscape, isMobilePortrait } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { lastReadId } = useModels()
const apiBooks = useApiBooks()
const apiCategories = useApiCategories()
const apiSeries = useApiSeries()
const { seriesNameOfBook, categoryName } = useCatalogNames()
const { getPct } = useReadingProgress()
const { avatarSrc } = useAvatar()
const { displayName, hasCustomName } = useUserName()

const searchQuery = ref('')

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Category records carry the editor-uploaded icons for the category
  // list section at the bottom of the page.
  void apiCategories.loadAll()
  // Series records supply the name shown on search result tiles.
  void apiSeries.loadAll()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function pageCount(book: ApiBook): number {
  return book.localizations?.[lang.value]?.content?.length
    || book.localizations?.de?.content?.length
    || 0
}

function progressPct(book: ApiBook): number {
  return getPct(book.bookId, pageCount(book))
}

function currentPage(book: ApiBook): number {
  const total = pageCount(book)
  return Math.max(1, Math.round(progressPct(book) * total))
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function openReader(bookId: string) {
  router.push({ name: 'app-reader', params: { bookId } })
}

// Deep-link into the BookDetail view's audio player. The detail view
// auto-switches into listen mode when it sees the `mode=listen` query.
function openListen(bookId: string) {
  router.push({ name: 'app-book', params: { bookId }, query: { mode: 'listen' } })
}

function openAllNew() {
  router.push({ name: 'app-all-new-books' })
}

function openAllSeries() {
  router.push({ name: 'app-all-books' })
}

// CTA on the welcome slider — sends the user to the book list on the public
// LambKing web edition. Routed through `openExternal` rather than
// `window.open`/the in-app router: inside the Tauri WebView a bare
// `window.open` loads the site *into the app's own webview* (no address bar,
// no way out but the hardware back button), so we hand the URL to the system
// browser instead. Same helper the donate buttons use.
const WEBSITE_BOOKS_URL = 'https://lambking.store'

function openWebsite() {
  void openExternal(WEBSITE_BOOKS_URL)
}

const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

// Active when the user has typed something into the search field; the
// view switches over to the results grid and the standard sections
// (Weiterlesen / Neu in der Bibliothek / Demnächst / Mission des Tages)
// disappear until the term is cleared.
const isSearching = computed(() => searchQuery.value.trim().length > 0)

// Title-substring match against either locale + the series name and
// author, so a child can type "frucht", "mission", "petrus", or "lukas"
// and find the right story. Case-insensitive; whitespace-tolerant.
const searchResults = computed<ApiBook[]>(() => {
  const term = searchQuery.value.trim().toLowerCase()
  if (!term) return []
  return allBooks.value.filter((b) => {
    const titleDe = b.localizations?.de?.title?.toLowerCase() ?? ''
    const titleEn = b.localizations?.en?.title?.toLowerCase() ?? ''
    const author = b.author?.toLowerCase() ?? ''
    // The series name in whichever language is on screen, so an English
    // reader searching "christ code" hits the same books a German one
    // reaches via "christus code".
    const series = seriesNameOfBook(b).toLowerCase()
    return titleDe.includes(term)
      || titleEn.includes(term)
      || author.includes(term)
      || series.includes(term)
  })
})

function clearSearch() {
  searchQuery.value = ''
}

const lastReadBook = computed<ApiBook | null>(() =>
  lastReadId.value ? apiBooks.getById(lastReadId.value) : null
)

const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90

// "Neu in der Bibliothek" — books published in the last 3 months. The
// design shows a swipable horizontal row of full-height portrait covers.
const newReleases = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => now - new Date(b.releaseDate).getTime() < THREE_MONTHS_MS)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

// "Demnächst" — placeholder bucket for upcoming books. Until the API
// exposes an explicit `comingSoon` flag we surface unreleased books or
// fall back to the oldest entries so the row never collapses.
const upcomingBooks = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => new Date(b.releaseDate).getTime() > now)
    .slice(0, 6)
})

// ===== Category filter list =====
// One row per category (icon · name · book count · chevron), shown
// below the last section. Rows navigate to the Categories page which
// lists the category's books. Categories without any visible book are
// skipped so kids never land on an empty page — this also drops the
// reserved "NO SHOW" category, whose books the API hides anyway.
interface CategoryRow {
  /** German name — the server-side id, and what the route param carries. */
  name: string
  /** Localized name for display. */
  label: string
  icon: string
  count: number
}

const categoryRows = computed<CategoryRow[]>(() => {
  void apiCategories.state.all
  const counts: Record<string, number> = {}
  for (const b of allBooks.value) {
    if (!b.category) continue
    counts[b.category] = (counts[b.category] ?? 0) + 1
  }
  const rows: CategoryRow[] = []
  for (const c of apiCategories.state.all ?? []) {
    const count = counts[c.name] ?? 0
    if (!count) continue
    rows.push({ name: c.name, label: categoryName(c.name), icon: c.icon || '', count })
  }
  return rows
})

function openCategory(name: string) {
  router.push({ name: 'app-category', params: { category: name } })
}

// Greeting line. The design shows a personalised salute — until we have a
// real "name" field we fall back to the i18n default.
// Personalised greeting once the user has set their own name in Profile;
// falls back to the generic "Hallo, Entdecker!" until then.
const greeting = computed(() =>
  hasCustomName.value
    ? t('app.main.helloName', { name: displayName.value })
    : t('app.main.hello')
)

const avatarOpen = ref(false)

function openAvatarPicker() {
  avatarOpen.value = true
}

function closeAvatarPicker() {
  avatarOpen.value = false
}

const layoutClass = computed(() => {
  if (isMobileLandscape.value) return 'is-landscape'
  if (isMobilePortrait.value) return 'is-portrait'
  return 'is-default'
})

const ENABLE_MISSION_OF_DAY = false

// Welcome-banner slider — rotating illustrations shown above the search bar.
// Auto-advances every 6s; the user can also swipe or tap a dot to jump. The
// second slide is the mission slide: PayPal + Ko-fi donate buttons on web and
// Android, a StoreKit tip on iOS. App Review Guideline 3.1.1(a) bans calls to
// action for non-IAP payments outside the US storefront, but a tip *through*
// in-app purchase is explicitly allowed (3.1.1) — so the slide itself is the
// same everywhere, only the button on it differs.
const welcomeSlides = computed(() => [
  prependBaseUrl('images/bg/welcome-bg-1.webp'),
  prependBaseUrl('images/bg/welcome-bg-2.webp'),
  prependBaseUrl('images/bg/welcome-bg-3.webp')
])
const booksSlide = 'overlay-2'
</script>

<template lang="pug">
  div(:class="['app-main', layoutClass, 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]', isSearching ? '!pb-[calc(4rem+env(safe-area-inset-bottom,0px))]' : '']")
    //- ===== bg_path artwork zone =====
    //- Wraps the header + (search/hero) so the image is sized to fit
    //- exactly that area; the green bottom of the path stays visible
    //- right above where the .path-overlay rises up.
    div(
      :class="['bg-zone', { 'bg-zone-fill': isSearching }]"
      :style="{ backgroundImage: `url(${prependBaseUrl('images/bg/main_portrait.webp')})` }"
    )
      //- ===== Header bar — centered crown + banner; bell · avatar pinned to the right =====
      header(class="main-header")
        //div(class="main-header-inner")
        //  div(class="header-actions z-10 -mt-4 -mr-3")
        //    button(
        //      type="button"
        //      class="header-avatar-btn"
        //      :aria-label="t('app.profile.chooseAvatar')"
        //      @click="openAvatarPicker"
        //    )
        //      img(
        //        :src="avatarSrc"
        //        alt="Profile"
        //        class="header-avatar-img"
        //        @error="onAvatarFallback"
        //      )
        //
        //  label(class="search-field")
        //    ZIconography(name="search" :size="18")
        //    input(
        //      type="text"
        //      v-model="searchQuery"
        //      :placeholder="t('app.main.searchPlaceholder')"
        //      class="search-input"
        //      autocomplete="off"
        //      @keydown.esc="clearSearch"
        //    )
        //    button(
        //      v-if="isSearching"
        //      type="button"
        //      class="search-clear-btn"
        //      :aria-label="t('app.bookDetail.attachmentClose') || 'Clear'"
        //      @click="clearSearch"
        //    )
        //      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
        //        path(d="M18 6 6 18M6 6l12 12")

        //  old header with bg image behind it, before the new design with the bg image filling the whole header and search area
        // this is not used for now, but kept for future readding
        //div(class="main-header-inner")
        //  //- Brand: stacked crown over LambKing banner, centered
        //  div(class="brand-stack")
        //    img(
        //      :src="prependBaseUrl('images/icons/crown_256x256.webp')"
        //      alt="LambKing"
        //      class="brand-crown"
        //      decoding="async"
        //    )
        //    img(
        //      :src="prependBaseUrl('images/logo/banner_500x116.webp')"
        //      alt="LambKing Stories"
        //      class="brand-banner -ml-8"
        //      decoding="async"
        //    )
        //
        //  //- Right-aligned actions — anchored absolutely so they don't
        //  //- push the centered brand stack off-axis.
        //  div(class="header-actions")
        //    //button(
        //    //  type="button"
        //    //  class="header-icon-btn"
        //    //  aria-label="Notifications"
        //    //)
        //    //  ZIconography(name="bell" :size="22")
        //    button(
        //      type="button"
        //      class="header-avatar-btn"
        //      :aria-label="t('app.profile.chooseAvatar')"
        //      @click="openAvatarPicker"
        //    )
        //      img(
        //        :src="avatarSrc"
        //        alt="Profile"
        //        class="header-avatar-img"
        //        @error="onAvatarFallback"
        //      )
        //
        //  //- Greeting headline
        //  div(class="greeting-block")
        //    h1(class="greeting-title") {{ greeting }}
        //    p(class="greeting-sub") {{ t('app.main.subtitle') }}
        //
        //  //- Search field — Vue-controlled input, with an X button that
        //  //- appears as soon as the user has typed anything. Clicking it
        //  //- (or hitting Escape on a focused field) clears the term and
        //  //- restores the original home layout.
        //  label(class="search-field")
        //    ZIconography(name="search" :size="18")
        //    input(
        //      type="text"
        //      v-model="searchQuery"
        //      :placeholder="t('app.main.searchPlaceholder')"
        //      class="search-input"
        //      autocomplete="off"
        //      @keydown.esc="clearSearch"
        //    )
        //    button(
        //      v-if="isSearching"
        //      type="button"
        //      class="search-clear-btn"
        //      :aria-label="t('app.bookDetail.attachmentClose') || 'Clear'"
        //      @click="clearSearch"
        //    )
        //      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
        //        path(d="M18 6 6 18M6 6l12 12")

        // old header with bg image behind it, before the new design with the bg image filling the whole header and search area
        //this is not used for now, but kept for future readding
        div(class="main-header-inner")
          //- Brand: stacked crown over LambKing banner, centered
          div(class="brand-stack")
            //img(
            //  :src="prependBaseUrl('images/icons/crown_256x256.webp')"
            //  alt="LambKing"
            //  class="brand-crown"
            //  decoding="async"
            //)
            img(
              :src="prependBaseUrl('images/logo/banner_500x116.webp')"
              alt="LambKing Stories"
              class="brand-banner -ml-2"
              decoding="async"
            )

          //- Right-aligned actions — anchored absolutely so they don't
          //- push the centered brand stack off-axis.
          div(class="header-actions")
            //button(
            //  type="button"
            //  class="header-icon-btn"
            //  aria-label="Notifications"
            //)
            //  ZIconography(name="bell" :size="22")
            button(
              type="button"
              class="header-avatar-btn"
              :aria-label="t('app.profile.chooseAvatar')"
              @click="openAvatarPicker"
            )
              img(
                :src="avatarSrc"
                alt="Profile"
                class="header-avatar-img"
                @error="onAvatarFallback"
              )

          //- Greeting headline
          div(class="greeting-block")
            h1(class="greeting-title") {{ greeting }}
            p(class="greeting-sub") {{ t('app.main.subtitle') }}

          //- Search field — Vue-controlled input, with an X button that
          //- appears as soon as the user has typed anything. Clicking it
          //- (or hitting Escape on a focused field) clears the term and
          //- restores the original home layout.
          label(class="search-field")
            ZIconography(name="search" :size="18")
            input(
              type="text"
              v-model="searchQuery"
              :placeholder="t('app.main.searchPlaceholder')"
              class="search-input"
              autocomplete="off"
              @keydown.esc="clearSearch"
            )
            button(
              v-if="isSearching"
              type="button"
              class="search-clear-btn"
              :aria-label="t('app.bookDetail.attachmentClose') || 'Clear'"
              @click="clearSearch"
            )
              svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
                path(d="M18 6 6 18M6 6l12 12")

      div(class="main-content")
        //- ===== Search results =====
        //- Replaces every other section while the user is typing. Two-up
        //- portrait tiles so kids can scan covers quickly; "No books found"
        //- empty state when the term doesn't match anything.
        section(v-if="isSearching" class="search-section")
          div(class="section-head")
            h3(class="section-title") {{ t('app.main.searchResultsTitle') }}
            span(class="search-results-count") {{ searchResults.length }}

          div(v-if="searchResults.length" class="search-grid")
            div(
              v-for="book in searchResults"
              :key="book.bookId"
              class="search-tile"
              @click="openBook(book.bookId)"
            )
              div(class="search-tile-img-wrap")
                img(
                  :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                  :alt="localizedTitle(book)"
                  class="search-tile-img"
                  loading="lazy"
                  @error="onImgFallback"
                )
              div(class="search-tile-meta")
                span(class="search-tile-series") {{ seriesNameOfBook(book) || book.author }}
                h4(class="search-tile-title") {{ localizedTitle(book) }}

          div(v-else class="search-empty")
            span(class="search-empty-icon" aria-hidden="true")
              ZIconography(name="search" :size="36")
            p(class="search-empty-text") {{ t('app.main.searchEmpty') }}

        //- ===== Welcome banner slider =====
        //- Shown to everyone (including first-time visitors) whenever the
        //- user isn't searching — it is NOT gated on reading history. The
        //- second slide ("Unterstütze unsere Mission") gets PayPal + Ko-fi
        //- donate CTAs pinned to its bottom corners; the first slide hosts
        //- the "Discover" CTA to the public web edition.
        section(v-if="!isSearching" class="continue-section")
          WelcomeSlider(
            class="welcome-banner border-8 border-solid border-border rounded-2xl overflow-hidden"
            :images="welcomeSlides"
            :interval-ms="60000"
          )
            template(#[booksSlide])
              div(class="slide-copy" data-swipe-through)
                h3(class="slide-copy-title") {{ t('app.main.welcomeTitle2') }}
                p(class="slide-copy-text") {{ t('app.main.welcomeText2') }}

              div(class="welcome-cta-row scale-[62%] -mb-8")
                ZButton(
                  type="primary"
                  icon="book"
                  size="sm"
                  class="-mb-1 -mr-14"
                  @click="openWebsite"
                ) {{ t('app.main.discoverBooks') }}

            template(#overlay-0)
              div(class="slide-copy" data-swipe-through)
                h3(class="slide-copy-title") {{ t('app.main.welcomeTitle0') }}
                p(class="slide-copy-text") {{ t('app.main.welcomeText0') }}

            template(#overlay-1)
              div(class="slide-copy !right-[0%]" data-swipe-through)
                h3(class="slide-copy-title") {{ t('app.main.welcomeTitle1') }}
                //- Hairline + diamond, matching the mission slide's design
                //- reference; the other two slides run title straight into
                //- body copy.
                span(class="slide-copy-rule" aria-hidden="true")
                p(class="slide-copy-text") {{ t('app.main.welcomeText1') }}

              //- iOS may not link out to PayPal / Ko-fi, so it gets a single
              //- centred StoreKit tip button instead of the two-corner row.
              //- It hides itself until StoreKit has a product to sell.
              div(v-if="isIOS" class="welcome-tip-row -mb-6")
                TipButton(:compact="true")

              div(v-else class="welcome-donate-row -mb-6")
                KoFiButton(
                  href="https://www.paypal.com/ncp/payment/5CWTQPB6NGWLU"
                  tone="paypal"
                  label="PayPal"
                  :compact="true"
                )
                KoFiButton(
                  href="https://ko-fi.com/U6U21YO0Z5"
                  tone="kofi"
                  label="Ko-fi"
                  :compact="true"
                )


    //- ===== Path overlay =====
    //- Sibling of `.bg-zone` so the bg_path artwork above ends right
    //- where this overlay rises up. Wraps every section from
    //- "Weiterlesen" downward in a single full-bleed card.
    div(v-if="!isSearching" class="main-content")
      div(class="path-overlay")
        //- ===== Weiterlesen (saved progress) =====
        section(
          v-if="lastReadBook && progressPct(lastReadBook) > 0"
          class="resume-section"
        )
          h3(class="section-title") {{ t('app.main.continueReading') }}
          div(
            class="resume-card"
            @click="openReader(lastReadBook.bookId)"
          )
            //- Full-height 3:4 preview — height is the limit so the image is
            //- never cropped. Background fills the side slack with parchment.
            div(class="resume-thumb")
              img(
                :src="withPlaceholder(pickLocalizedImage(lastReadBook.previewImage, lang))"
                :alt="localizedTitle(lastReadBook)"
                class="resume-thumb-img"
                loading="lazy"
                @error="onImgFallback"
              )
            div(class="resume-meta")
              span(class="resume-title") {{ localizedTitle(lastReadBook) }}
              span(class="resume-page") {{ t('app.main.page', { n: currentPage(lastReadBook), total: pageCount(lastReadBook) }) }}
              div(class="resume-progress-row")
                div(class="resume-progress-track")
                  div(
                    class="resume-progress-fill"
                    :style="{ width: Math.round(progressPct(lastReadBook) * 100) + '%' }"
                  )
                span(class="resume-progress-pct") {{ Math.round(progressPct(lastReadBook) * 100) }}%
              div(class="resume-cta-row")
                ZButton(type="primary" icon="none" size="sm" @click.stop="openReader(lastReadBook.bookId)") {{ t('app.main.continue') }}

        //- ===== Neu in der Bibliothek =====
        section(v-if="newReleases.length" class="new-section")
          div(class="section-head")
            h3(class="section-title") {{ t('app.main.newInLibrary') }}
            button(
              type="button"
              class="see-all-link"
              @click="openAllNew"
            )
              span {{ t('app.main.seeAll') }}
              ZIconography(name="chevron-right" :size="14")

          div(class="new-row")
            div(
              v-for="book in newReleases"
              :key="book.bookId"
              class="new-tile"
              @click="openBook(book.bookId)"
            )
              div(class="new-tile-img-wrap")
                img(
                  :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                  :alt="localizedTitle(book)"
                  class="new-tile-img"
                  loading="lazy"
                  @error="onImgFallback"
                )
                //ZBadge(
                //  variant="new"
                //  size="sm"
                //  position="top-left"
                //  :label="t('app.bookSeries.new').toUpperCase()"
                //)
              span(class="new-tile-title") {{ localizedTitle(book) }}

        //- ===== Demnächst =====
        section(v-if="upcomingBooks.length" class="upcoming-section")
          div(class="section-head")
            h3(class="section-title") {{ t('app.main.upcoming') }}
            button(
              type="button"
              class="see-all-link"
              @click="openAllSeries"
            )
              span {{ t('app.main.seeAll') }}
              ZIconography(name="chevron-right" :size="14")

          div(class="upcoming-row")
            div(
              v-for="book in upcomingBooks"
              :key="book.bookId"
              class="upcoming-tile"
              @click="openBook(book.bookId)"
            )
              div(class="upcoming-tile-img-wrap")
                img(
                  :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                  :alt="localizedTitle(book)"
                  class="upcoming-tile-img"
                  loading="lazy"
                  @error="onImgFallback"
                )
              span(class="upcoming-tile-title") {{ localizedTitle(book) }}

        //- ===== Kategorien =====
        //- One tappable row per category: icon · name · book count ·
        //- chevron. Navigates to the Categories page with the books of
        //- the picked category.
        section(v-if="categoryRows.length" class="category-section")
          div(class="section-head")
            h3(class="section-title") {{ t('app.main.categories') }}

          div(class="category-list")
            button(
              v-for="cat in categoryRows"
              :key="cat.name"
              type="button"
              class="category-row"
              @click="openCategory(cat.name)"
            )
              span(class="category-row-icon-wrap" aria-hidden="true")
                img(
                  v-if="cat.icon"
                  :src="cat.icon"
                  alt=""
                  class="category-row-icon"
                  loading="lazy"
                  @error="onImgFallback"
                )
                ZIconography(v-else name="library" :size="20")
              span(class="category-row-name") {{ cat.label }}
              span(class="category-row-count") {{ cat.count }}
              span(class="category-row-chevron" aria-hidden="true")
                ZIconography(name="chevron-right" :size="16")

        //- ===== Mission of the Day — built but hidden until gamification
        //-       lands. Flip ENABLE_MISSION_OF_DAY to true once ready. =====
        section(v-if="ENABLE_MISSION_OF_DAY" class="mission-section")
          div(class="mission-card")
            div(class="mission-text")
              div(class="mission-eyebrow")
                ZIconography(name="star" :size="14")
                span {{ t('app.main.missionOfDay') }}
              p(class="mission-body") {{ t('app.main.missionSub') }}
              ZButton(type="secondary" icon="none" size="sm") {{ t('app.main.missionDone') }}
            div(class="mission-crest")
              ZIconography(name="crown" :size="78")

    AvatarPickerModal(:open="avatarOpen" @close="closeAvatarPicker")
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$cream-card-soft: #faf2dc
$navy: #1a2f4a
$navy-dark: #142a47
$gold: #d4a83e
$brown: #7a6b55
$border: #e6d6b5

button
  -webkit-tap-highlight-color: transparent

.app-main
  background-color: $cream-bg
  color: $navy

// Top region — header + (search/hero). The bg_path artwork stretches
// to fill exactly this zone so its green bottom edge meets the top of
// `.path-overlay` cleanly (matches reference image 10).
.bg-zone
  position: relative
  background-color: $cream-bg
  background-size: 100% 100%
  background-repeat: no-repeat
  background-position: top center
  // The .main-content inside ends with the hero card; this padding
  // gives the green bottom of the bg image room to breathe before the
  // overlay rises out of it.
  padding-bottom: 8px
  margin-bottom: -18px

// Search mode: there's no `.path-overlay` sibling to consume the
// lower half of the viewport, so the zone stretches to the bottom-nav
// itself (64px tall) — otherwise the artwork would only cover the
// little box around the search field and leave a parchment void below.
.bg-zone-fill
  min-height: calc(100vh - 64px - env(safe-area-inset-bottom, 0px))
  min-height: calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))
  margin-bottom: 0px

// ===== Header =====
.main-header
  position: relative
  padding-top: max(env(safe-area-inset-top), 0.75rem)
  padding-bottom: 12px

.main-header-inner
  position: relative
  max-width: 28rem
  margin: 0 auto
  padding: 0 20px

// Crown + banner stacked, centered. Reserves enough vertical room so
// the absolutely-positioned actions on the right don't crowd the brand.
.brand-stack
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.brand-crown
  width: 44px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 3px 6px rgba(58, 42, 18, 0.3))

.brand-banner
  width: 168px
  max-width: 60vw
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.2))

// Pinned to the top-right of the header so the centered brand stack
// keeps its true horizontal centre even when one icon is hidden.
.header-actions
  position: absolute
  top: 0
  right: 20px
  display: flex
  align-items: center
  gap: 8px

.header-icon-btn
  width: 38px
  height: 38px
  border-radius: 999px
  background-color: rgba(255, 255, 255, 0.6)
  border: 1px solid $border
  color: $navy
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.95)

.header-avatar-btn
  width: 42px
  height: 42px
  border-radius: 999px
  overflow: hidden
  border: 2.5px solid $gold
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  cursor: pointer
  box-shadow: 0 4px 12px -4px rgba(212, 168, 62, 0.5)
  transition: transform 160ms ease-out, box-shadow 160ms ease-out
  padding: 0

  &:hover
    transform: translateY(-1px) scale(1.04)
    box-shadow: 0 8px 18px -6px rgba(212, 168, 62, 0.6)

  &:active
    transform: scale(0.95)

.header-avatar-img
  width: 100%
  height: 100%
  object-fit: cover

// ===== Welcome banner slider =====
// Sits below the absolutely-positioned avatar so the avatar floats over
// its top-right corner. The 800×600 source images are 4:3, and the
// WelcomeSlider's own `aspect-ratio: 4 / 3` keeps the banner at that
// shape. A `max-height` here re-broke that: on wider phones the natural
// (width × 3/4) height exceeded the cap, so the height clamped while the
// width stayed full, and `object-fit: cover` cropped the bottom of the
// image (cutting off the donate buttons). The `.main-content` column
// already caps the width at 28rem, so we let the aspect-ratio rule and
// drop the height cap — same fix already applied in landscape below.
.welcome-banner
  margin-top: 12px

// ===== Slide copy =====
// Headline + subline parked in the artwork's top-right quadrant, which is
// open sky/valley in all three banner illustrations — the figures always
// sit bottom-left, so nothing important is covered.
//
// Sized in `cqw` against the slide (WelcomeSlider sets container-type on
// it) rather than in vw: the banner is width-capped at 22rem on wide
// screens, so viewport units would keep growing the type long after the
// picture stopped growing and push the copy off the clear area.
.slide-copy
  position: absolute
  top: 8%
  right: 3%
  width: 52%
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  color: #15294a
  // Base size = the body copy; the rule's em units track it.
  font-size: clamp(9px, 3.7cqw, 23px)

.slide-copy-title
  margin: 0
  font-weight: 800
  font-size: clamp(15px, 6.4cqw, 40px)
  line-height: 1.06
  letter-spacing: -0.015em
  text-wrap: balance
  // Two-stop white glow: the tight stop keeps the letterforms crisp where
  // they cross a dark leaf, the wide one lifts them off the sky.
  text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.6), -1px 2px 12px rgba(255, 255, 255, 0.85)

.slide-copy-text
  margin: 0.34em 0 0
  font-size: 1em
  font-weight: 600
  line-height: 1.3
  text-wrap: balance
  text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.85), -1px 2px 12px rgba(255, 255, 255, 0.95)

.slide-copy-rule
  position: relative
  width: 78%
  height: 1px
  margin: 0.55em 0 0.1em
  background: linear-gradient(90deg, rgba(21, 41, 74, 0) 0%, rgba(21, 41, 74, 0.35) 24%, rgba(21, 41, 74, 0.35) 76%, rgba(21, 41, 74, 0) 100%)

  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: 0.42em
    height: 0.42em
    transform: translate(-50%, -50%) rotate(45deg)
    background: #a98b5a

// Donate buttons on the second slide — PayPal-blue on the left, Ko-fi
// red on the right, both pushed to the bottom corners so the slide's
// illustrated headline keeps its full vertical breathing room. The dots
// row sits a few pixels below this; the `bottom: 36px` clears them.
.welcome-donate-row
  position: absolute
  left: 12px
  right: 12px
  bottom: 36px
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

  // The size-up is handed over as a variable rather than written as
  // `transform: scale(130%)` here. A transform set from this side lands on the
  // same element as the button's own press transform at equal specificity and,
  // being later in the cascade, silently won — which killed the press animation
  // on exactly the phone viewports the Android build runs at. `KoFiButton`
  // folds `--kofi-scale` into every one of its own transforms instead.
  :deep(.kofi-btn)
    @media(min-width: 360px) and (max-width: 500px)
      width: 6rem
      height: 2rem
      justify-items: center
      --kofi-scale: 1.3
      margin: 0 .5rem

  :deep(.kofi-btn)
    @media(min-height: 360px) and (max-height: 500px)
      width: 6rem
      height: 2rem
      justify-items: center
      --kofi-scale: 1.3
      margin: 0 .5rem

// iOS variant of the row above: one tip button, centred. Same `bottom` so
// it clears the dots row, same `--kofi-scale`-style hand-off (`--tip-scale`)
// so the outer size-up composes with the button's own press transform
// instead of replacing it.
.welcome-tip-row
  position: absolute
  left: 0
  right: 0
  bottom: 36px
  display: flex
  justify-content: center
  align-items: center

  :deep(.tip-btn)
    @media(min-width: 360px) and (max-width: 500px)
      --tip-scale: 1.3

  :deep(.tip-btn)
    @media(min-height: 360px) and (max-height: 500px)
      --tip-scale: 1.3

// CTA on the first slide — centred above the dots row (`bottom: 36px`
// clears them) and width-capped so the primary button doesn't stretch
// edge-to-edge across the banner.
.welcome-cta-row
  position: absolute
  left: 50%
  bottom: 36px
  transform: translateX(-50%)
  width: min(78%, 260px)
  display: flex
  justify-content: center

  @media(min-width: 360px) and (max-width: 500px)
    margin-bottom: 1rem
    transform: scale(100%) !important
    bottom: 0
    left: 45%
    right: 0.5rem
    :deep(button)
      width: 6rem
      height: 3rem
      transform: scale(160%)
  @media(min-height: 360px) and (max-height: 500px)
    margin-bottom: 1rem
    transform: scale(100%) !important
    bottom: 0
    left: 45%
    right: 0.5rem
    :deep(button)
      width: 6rem
      height: 3rem
      transform: scale(160%)
// ===== Greeting =====
.greeting-block
  margin-top: 14px
  text-align: center

.greeting-title
  font-size: 26px
  font-weight: 700
  color: $navy
  letter-spacing: -0.01em
  line-height: 1.1

.greeting-sub
  margin-top: 4px
  font-size: 13px
  color: $brown

// ===== Search =====
.search-field
  margin-top: 14px
  display: flex
  align-items: center
  gap: 10px
  padding: 12px 16px
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 14px
  box-shadow: 0 2px 6px -2px rgba(58, 42, 18, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  color: $brown

.search-input
  flex: 1
  min-width: 0
  background: transparent
  border: none
  outline: none
  font-size: 14px
  color: $navy
  font-family: inherit

  &::placeholder
    color: $brown
    font-weight: 500

// X button — only visible while a term is entered, used to clear the
// search and return to the standard home layout.
.search-clear-btn
  flex: 0 0 auto
  display: inline-flex
  align-items: center
  justify-content: center
  width: 22px
  height: 22px
  border-radius: 999px
  border: none
  background-color: $cream-card-soft
  color: $brown
  cursor: pointer
  transition: background-color 150ms ease-out, color 150ms ease-out, transform 150ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    background-color: $navy
    color: #ffffff

  &:active
    transform: scale(0.9)

// ===== Search results =====
.search-section
  margin-top: 18px

.search-results-count
  display: inline-flex
  align-items: center
  justify-content: center
  min-width: 24px
  height: 22px
  padding: 0 9px
  border-radius: 999px
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.04em
  color: $navy
  background-color: $cream-card
  border: 1px solid $border

.search-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.search-tile
  display: flex
  flex-direction: column
  gap: 8px
  cursor: pointer
  background: $cream-card
  border: 1px solid $border
  border-radius: 16px
  padding: 10px 10px 12px
  box-shadow: 0 6px 16px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 12px 22px -10px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.98)

.search-tile-img-wrap
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid $border

.search-tile-img
  max-height: 100%
  max-width: 100%
  width: auto
  height: 100%
  object-fit: cover
  display: block

.search-tile-meta
  display: flex
  flex-direction: column
  gap: 2px
  padding: 0 2px

.search-tile-series
  font-size: 10px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.08em
  color: $brown

.search-tile-title
  font-size: 13px
  font-weight: 700
  color: $navy
  margin: 0
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.search-empty
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 36px 18px
  text-align: center

.search-empty-icon
  display: inline-flex
  color: $brown
  opacity: 0.7

.search-empty-text
  font-size: 14px
  font-weight: 700
  color: $brown
  margin: 0

// ===== Layout container =====
.main-content
  max-width: 28rem
  margin: 0 auto
  padding: 0 20px

.section-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 10px

.section-title
  font-size: 17px
  font-weight: 700
  color: $navy
  letter-spacing: -0.005em

.see-all-link
  display: inline-flex
  align-items: center
  gap: 4px
  font-size: 12px
  font-weight: 700
  color: $navy
  background: transparent
  border: none
  cursor: pointer
  padding: 0
  transition: transform 150ms ease-out, color 150ms ease-out

  &:hover
    color: $gold
    transform: translateX(2px)

  &:active
    transform: scale(0.96)

// ===== Continue / Hero card =====
.continue-section
  margin-top: 16px
  margin-bottom: 24px

.continue-card
  position: relative
  background: linear-gradient(180deg, #233a5e 0%, #11283a 100%)
  border-radius: 14px
  padding: 14px
  box-shadow: 0 14px 32px -14px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  overflow: hidden

// Badge gets its own row so it never overlaps the title on narrow
// viewports. Aligned to the start of the card so the cover/title row
// below reads as the primary content.
.continue-badge-row
  display: flex
  justify-content: flex-start

// "NEU ERSCHIENEN" tag — tighter corners + darker wine red so it sits
// against the navy hero rather than blending into the rounded card.
:deep(.continue-badge)
  border-radius: 6px
  background: linear-gradient(180deg, #a93d2e 0%, #7a2a1f 100%)
  border-color: #4a160e
  box-shadow: 0 3px 0 -1px #4a160e, 0 6px 14px -4px rgba(74, 22, 14, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)

.continue-row
  display: flex
  align-items: stretch
  gap: 14px

.continue-thumb
  flex: 0 0 auto
  width: 120px
  aspect-ratio: 3 / 4
  border-radius: 10px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  cursor: pointer
  box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.45)
  transition: transform 180ms ease-out

  &:hover
    transform: translateY(-2px) scale(1.02)

.continue-thumb-img
  width: 100%
  height: 100%
  object-fit: cover

.continue-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 4px
  color: #ffffff

.continue-series
  font-size: 11px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.16em
  color: #d4a83e

.continue-title
  font-size: 15px
  font-weight: 700
  line-height: 1.2
  margin: 0
  color: #ffffff
  display: -webkit-box
  -webkit-line-clamp: 3
  -webkit-box-orient: vertical
  overflow: hidden

.continue-page
  font-size: 11px
  color: rgba(255, 255, 255, 0.7)
  margin-top: 2px

.continue-cta
  margin-top: auto
  display: flex
  flex-wrap: wrap
  gap: 2px
  width: 100%

// Each button needs ~120px to render its icon + full label without
// truncation ("Anhören" + speaker icon is the wide one). flex-wrap
// then pushes the second button onto its own row when the meta
// column is too narrow to seat both — i.e. column layout on small
// phones, row layout on wider viewports.
.continue-cta > div
  flex: 1 1 120px
  min-width: 120px

// Drop the ZButton's `scale-75` visual transform so the button
// background fills its full allocated flex slot rather than rendering
// smaller than its content.
.continue-cta > :deep(div)
  transform: none !important

.continue-cta :deep(.z-button)
  min-width: 0
  width: 100%
  padding: 10px 12px
  border-radius: 12px
  gap: 6px

.continue-cta :deep(.button-label)
  font-size: 13px
  white-space: nowrap

// ===== Path overlay — wraps Weiterlesen + below sections =====
// Sits in its own `.main-content` sibling of `.bg-zone`, so it starts
// right where the bg_path artwork ends. Breaks out of the .main-content
// 20px gutter so the rounded card touches the device edges.
.path-overlay
  position: relative
  margin-top: 0
  margin-left: -20px
  margin-right: -20px
  padding: 24px 20px 32px
  border-top-left-radius: 24px
  border-top-right-radius: 24px
  background-color: $cream-bg
  box-shadow: 0 -8px 22px -10px rgba(58, 42, 18, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.5)
  // The pb-32 on `.app-main` gives bottom-nav clearance; let the
  // overlay extend past the last section to the nav.
  margin-bottom: -8rem
  padding-bottom: calc(8rem + 32px)

  > section:first-child
    margin-top: 0

// ===== Weiterlesen resume card =====
.resume-section
  margin-top: 20px

.resume-card
  position: relative
  display: flex
  gap: 14px
  align-items: stretch
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 12px
  padding: 12px
  cursor: pointer
  box-shadow: 0 8px 22px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 14px 28px -10px rgba(212, 168, 62, 0.35)

.resume-thumb
  flex: 0 0 auto
  width: 88px
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center

.resume-thumb-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: cover

.resume-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 4px

.resume-title
  font-size: 15px
  font-weight: 700
  color: $navy
  line-height: 1.15
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.resume-page
  font-size: 11px
  color: $brown

.resume-progress-row
  display: flex
  align-items: center
  gap: 8px
  margin-top: 4px

.resume-progress-track
  flex: 1
  height: 8px
  background-color: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.resume-progress-fill
  height: 100%
  background: linear-gradient(90deg, #c89030 0%, #d4a83e 100%)
  border-radius: inherit
  transition: width 240ms ease-out

.resume-progress-pct
  font-size: 11px
  font-weight: 700
  color: $navy
  font-variant-numeric: tabular-nums

.resume-cta-row
  margin-top: 6px

// ===== Neu in der Bibliothek (swipable row) =====
.new-section
  margin-top: 24px

.new-row
  display: flex
  gap: 12px
  overflow-x: auto
  overflow-y: hidden
  scroll-snap-type: x mandatory
  -webkit-overflow-scrolling: touch
  padding-bottom: 6px
  margin-left: -20px
  margin-right: -20px
  padding-left: 20px
  padding-right: 20px

  &::-webkit-scrollbar
    display: none

.new-tile
  flex: 0 0 28%
  min-width: 96px
  max-width: 130px
  scroll-snap-align: start
  cursor: pointer
  display: flex
  flex-direction: column
  gap: 6px

.new-tile-img-wrap
  position: relative
  width: 100%
  //height: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid $border
  box-shadow: 0 6px 14px -8px rgba(58, 42, 18, 0.35)
  transition: transform 180ms ease-out

.new-tile:hover .new-tile-img-wrap
  transform: translateY(-3px)

.new-tile-img
  height: 100%
  width: auto
  max-width: 100%
  max-height: 100%
  object-fit: cover

.new-tile-title
  font-size: 11px
  font-weight: 700
  color: $navy
  line-height: 1.25
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

// ===== Demnächst row =====
.upcoming-section
  margin-top: 22px

.upcoming-row
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 12px

.upcoming-tile
  cursor: pointer
  display: flex
  flex-direction: column
  gap: 6px

.upcoming-tile-img-wrap
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid $border
  filter: grayscale(0.25)
  opacity: 0.85
  transition: transform 180ms ease-out, opacity 180ms ease-out

.upcoming-tile:hover .upcoming-tile-img-wrap
  transform: translateY(-3px)
  opacity: 1

.upcoming-tile-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.upcoming-tile-title
  font-size: 11px
  font-weight: 700
  color: $brown
  line-height: 1.25
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

// ===== Kategorien list =====
// Full-width tappable rows (reference: category filter design) —
// icon in a soft square well on the left, bold navy name, count and
// chevron pinned to the right edge.
.category-section
  margin-top: 24px

.category-list
  display: flex
  flex-direction: column
  gap: 10px

.category-row
  display: flex
  align-items: center
  gap: 12px
  width: 100%
  padding: 12px 14px
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 14px
  cursor: pointer
  text-align: left
  font-family: inherit
  box-shadow: 0 6px 16px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 12px 22px -10px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.98)

.category-row-icon-wrap
  flex: 0 0 auto
  display: inline-flex
  align-items: center
  justify-content: center
  width: 34px
  height: 34px
  background: transparent
  overflow: hidden
  scale: 170%

.category-row-icon
  width: 30px
  height: 30px
  object-fit: contain
  display: block

.category-row-name
  flex: 1
  min-width: 0
  font-size: 14px
  font-weight: 700
  color: $navy
  line-height: 1.2
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.category-row-count
  flex: 0 0 auto
  font-size: 13px
  font-weight: 700
  color: $brown
  font-variant-numeric: tabular-nums

.category-row-chevron
  flex: 0 0 auto
  display: inline-flex
  align-items: center
  color: $navy

// ===== Mission of the day =====
.mission-section
  margin-top: 26px

.mission-card
  position: relative
  display: flex
  align-items: center
  gap: 14px
  background: linear-gradient(160deg, #fdf8ed 0%, #f3e6c4 100%)
  border: 1.5px solid $border
  border-radius: 12px
  padding: 18px
  box-shadow: 0 12px 28px -14px rgba(58, 42, 18, 0.3)

.mission-text
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 8px

.mission-eyebrow
  display: inline-flex
  align-items: center
  gap: 6px
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.16em
  text-transform: uppercase
  color: $gold

.mission-body
  font-size: 13px
  color: $navy
  line-height: 1.4
  margin: 0

.mission-crest
  flex: 0 0 auto
  filter: drop-shadow(0 6px 12px rgba(58, 42, 18, 0.3))

// ===== Mobile-landscape adaptation =====
.is-landscape
  .main-content
    max-width: 64rem
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 22px
    row-gap: 0
    padding: 0 28px

  .continue-section
    grid-column: 1 / -1
    margin-top: 12px

  // Search results take the full grid width too, otherwise they sit
  // squashed in col 1 and waste the right half of the viewport.
  .search-section
    grid-column: 1 / -1
    min-width: 0

  .search-grid
    grid-template-columns: repeat(4, minmax(0, 1fr))

  // The card spans the full grid row but its content stays compact:
  // capped meta column, CTAs forced into a single row at their natural
  // size instead of overflowing the card right edge.
  .continue-card
    padding: 14px 18px
    overflow: hidden

  .continue-row
    align-items: center
    gap: 18px

  .continue-thumb
    width: 110px
    height: 146px

  .continue-meta
    gap: 6px
    max-width: 100%
    min-width: 0

  .continue-cta
    flex-wrap: nowrap
    gap: 10px
    width: 100%
    max-width: 360px

  .continue-cta > :deep(div)
    flex: 1 1 0
    min-width: 0
    transform: none !important
    width: auto

  .continue-cta :deep(.z-button)
    min-width: 0
    width: 100%
    padding-left: 14px
    padding-right: 14px

  // The path overlay spans the whole grid row and itself becomes a
  // 2-col grid so the resume/new sections sit side-by-side, with
  // upcoming filling the row below — matching the prior layout but
  // wrapped in the bg_path card.
  .path-overlay
    grid-column: 1 / -1
    margin-left: -28px
    margin-right: -28px
    padding-left: 28px
    padding-right: 28px
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    column-gap: 22px
    overflow-x: hidden

  // Grid items default to `min-width: auto`, which lets the swipable
  // .new-row inside .new-section push the column wider than its 1fr
  // share — that's the landscape blowout. `min-width: 0` forces each
  // column to honour its fr allocation.
  .resume-section
    grid-column: 1
    min-width: 0
    margin-top: 16px

  .new-section
    grid-column: 2
    min-width: 0
    margin-top: 16px

  // No resume card → let "Neu in der Bibliothek" claim the full row
  // instead of stranding the left column empty (the swipable cover row
  // would otherwise hug the right edge with a dead beige column on the
  // left).
  .path-overlay:not(:has(.resume-section)) .new-section
    grid-column: 1 / -1

  .upcoming-section
    grid-column: 1 / -1
    min-width: 0

  // Category rows span the full grid row; a 2-col row grid keeps them
  // from stretching comically wide in landscape.
  .category-section
    grid-column: 1 / -1
    min-width: 0

  .category-list
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 10px

  .main-header-inner
    max-width: 64rem
    padding: 0 28px

  .header-actions
    right: 28px

  // Mirror the portrait dimensions in landscape so the 4:3 800×600
  // source images keep their natural aspect on the wider header. The
  // max-height cap from portrait broke 4:3 here because the 64rem
  // parent let the slider grow wide enough that the natural
  // (width × 3/4) height exceeded 260px and got clipped into a
  // letterboxed 1.7:1 band. Capping the *width* instead — and dropping
  // the max-height — keeps the aspect-ratio rule in the WelcomeSlider
  // in charge so the banner renders at a true 4:3.
  .welcome-banner
    max-width: 22rem
    max-height: none
    margin-left: auto
    margin-right: auto

  // Keep the greeting centred in landscape — left-aligning made the
  // header read as off-axis when the LambKing brand stack above it is
  // centred. Only the vertical spacing changes from the portrait rule.
  .greeting-block
    margin-top: 6px

  .greeting-title
    font-size: 22px

  .new-row
    margin-left: 0
    margin-right: 0
    padding-left: 0
    padding-right: 0

  .new-tile
    flex: 0 0 22%

@media (min-width: 700px)
  .upcoming-row
    grid-template-columns: repeat(4, 1fr)

  .new-tile
    flex: 0 0 18%
</style>
