<script setup lang="ts">
import useTheme, { type PaletteName, type ThemeChoice } from '@/use/useTheme'
import { sizedImage } from '@/utils/sizedImage'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/molecules/AppHeader.vue'
import ParentSheet from '@/components/molecules/ParentSheet.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import ZLanguageSwitcher from '@/components/atoms/ZLanguageSwitcher.vue'
import AvatarPickerModal from '@/components/molecules/AvatarPickerModal.vue'
import TestUnlock from '@/components/molecules/TestUnlock.vue'
import BuildStamp from '@/components/atoms/BuildStamp.vue'
import usePremium, { PLUS_TEST, PREMIUM_TEASER } from '@/use/usePremium'
import { MANAGE_URL } from '@/data/plusProducts'
import { isIOS } from '@/utils/platform'
import { openExternal } from '@/utils/openExternal'
import { requireParent } from '@/use/useParentalGate'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useUser from '@/use/useUser'
import useReadingProgress from '@/use/useReadingProgress'
import useAvatar, { onAvatarFallback } from '@/use/useAvatar'
import useGameWishes from '@/use/useGameWishes'
import useUserName from '@/use/useUserName'
import useApiConfig from '@/use/useApiConfig'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { prependBaseUrl } from '@/utils/function'
import { contentLocale } from '@/utils/contentLocale'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { watchListIds, removeFromWatchList } = useModels()
const apiBooks = useApiBooks()
const { userLanguage } = useUser()
const { getPct } = useReadingProgress()
const { avatarSrc } = useAvatar()
// a free wish for an adventure game: "My games" lights up and says so
const gameWishes = useGameWishes().wishes
const {
  useLocalBackend,
  remoteBase,
  localBase,
  setUseLocalBackend
} = useApiConfig()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (contentLocale(locale.value)))

// LambKing Plus: the card says whether the subscription runs (and until when), or that this is the free version. The end of a subscription needs nothing
// from the child: the store says "not any more" and the app is the free one again (`usePurchases` asks again when the app comes back to the front).
const { plusOn, plusInfo } = usePremium()
const showPlusCard = PREMIUM_TEASER
const plusDate = computed(() => {
  const until = plusInfo.value?.until
  return until ? new Date(until).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' }) : ''
})
const plusLine = computed(() => {
  const info = plusInfo.value
  if (!info) return t('app.profile.plusTestOn')
  if (info.renews) return plusDate.value ? t('app.profile.plusRenewsOn', { date: plusDate.value }) : t('app.profile.plusRenewsAuto')
  return plusDate.value ? t('app.profile.plusEndsOn', { date: plusDate.value }) : t('app.profile.plusEndsAuto')
})
const plusPlanName = computed(() => (plusInfo.value?.plan ? t(`app.profile.plusPlan_${plusInfo.value.plan}`) : ''))
const manageUrl = computed(() => (isIOS ? MANAGE_URL.ios : MANAGE_URL.android))
/** The page of the store where the subscription is managed: behind the parental gate, like every way out of the app. */
async function manageSubscription() {
  if (await requireParent()) void openExternal(manageUrl.value)
}

// Backdrop — a tall artwork for portrait, a wide one for landscape. The swap
// itself happens in CSS (`@media (orientation: …)`); we only feed the
// base-url-corrected `url()` values in as custom properties, because the
// files live in `public/` and a bare `url(…)` inside the SFC style block
// would be resolved by Vite as a bundled asset.
const backdropVars = computed(() => ({
  '--profile-bg-portrait': `url(${prependBaseUrl('images/bg/profile_portrait.webp')})`,
  '--profile-bg-landscape': `url(${prependBaseUrl('images/bg/profile_landscape.webp')})`
}))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

if (locale.value !== userLanguage.value) locale.value = userLanguage.value
watch(userLanguage, (v) => {
  locale.value = v
})

const watchListBooks = computed<ApiBook[]>(() =>
  watchListIds.value
    .map((id) => apiBooks.getById(id))
    .filter((b): b is ApiBook => b !== null)
)

// Editable display name — persists via `useUserName` (localStorage),
// so the main-view greeting picks up changes immediately on next render.
const { displayName, setUserName } = useUserName()
const isEditingName = ref(false)
const nameDraft = ref('')

function startEditName() {
  nameDraft.value = displayName.value
  isEditingName.value = true
}

function saveName() {
  setUserName(nameDraft.value)
  isEditingName.value = false
}

function cancelEditName() {
  isEditingName.value = false
}

// Level + XP — placeholder values; gamification math lands later.
const userLevel = computed(() => 7)
const userXp = computed(() => 320)
const userXpMax = computed(() => 500)
const xpPct = computed(() => Math.min(1, userXp.value / userXpMax.value))

const avatarOpen = ref(false)
const parentOpen = ref(false)

function openAvatar() {
  avatarOpen.value = true
}

function closeAvatar() {
  avatarOpen.value = false
}

// Open by default: the card only holds the language switcher, and a user
// looking for it shouldn't have to discover the gear first. The gear is
// now purely a way to collapse it out of the way.
const settingsOpen = ref(true)

const { choice: themeChoice, setChoice: setThemeChoice, palette, setPalette, isNight } = useTheme()
const paletteOptions = computed<{ id: PaletteName; label: string }[]>(() => [
  { id: 'mint', label: t('app.theme.mint') },
  { id: 'gold', label: t('app.theme.gold') },
  { id: 'creme', label: t('app.theme.creme') }
])
const themeOptions = computed<{ id: ThemeChoice; label: string; icon: 'sun' | 'moon' | 'auto' }[]>(() => [
  { id: 'day', label: t('app.theme.day'), icon: 'sun' },
  { id: 'night', label: t('app.theme.night'), icon: 'moon' },
  { id: 'auto', label: t('app.theme.auto'), icon: 'auto' }
])

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
}

interface QuickAction {
  id: 'favorites' | 'progress' | 'achievements' | 'works'
  label: string
  // Path to the WebP asset rendered inside the tile. Lives in
  // `/public/images/icons/*.webp` so Vite ships it verbatim.
  icon: string
  // Disabled tiles render greyed-out — used for unreleased gamification
  // features (Errungenschaften, Meine Werke).
  disabled?: boolean
  route?: string
}

const quickActions = computed<QuickAction[]>(() => [
  { id: 'favorites', label: t('app.profile.favorites'), icon: prependBaseUrl('images/icons/favorites.webp') }
  // { id: 'progress', label: t('app.profile.progress'), icon: prependBaseUrl('images/icons/progress.webp') },
  // { id: 'achievements', label: t('app.profile.achievements'), icon: prependBaseUrl('images/icons/achievements.webp'), disabled: true }
])

function onQuickAction(qa: QuickAction) {
  if (qa.disabled) return
  // Favorites + progress both surface the watch-list section below; no
  // separate route yet. Smooth-scroll into the relevant card for now.
  const el = document.getElementById(qa.id === 'favorites' ? 'favorites-section' : 'progress-section')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}

function openLegal() {
  router.push({ name: 'app-legal' })
}

// Pug attribute expressions are evaluated as plain JS (no TypeScript),
// so a `($event.target as HTMLInputElement).checked` cast trips the
// template compiler with "Unexpected identifier 'as'". The handler
// lives in <script> so the cast stays valid TypeScript.
function onBackendToggle(e: Event) {
  const target = e.target as HTMLInputElement
  setUseLocalBackend(target.checked)
}

const tileImg = (path: string) => prependBaseUrl(`images/${path}.webp`)
</script>

<template lang="pug">
  div(
    :class="['profile-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']"
  )
    AppHeader
    div(class="profile-head")
      div
        h1(class="profile-title") {{ t('app.nav.profile') }}
        p(class="profile-sub") {{ t('app.profile.settings') }}
      LkCompanion(class="profile-lamb" pose="winken" :size="92")

    div(class="profile-content")
      //- the parents' area (support us, shop, settings, legal) lives here; every link in it asks the parental gate on its own
      button(type="button" class="parent-open lk-btn lk-btn--outline lk-btn--full" @click="parentOpen = true")
        ZIconography(name="lock" :size="22")
        span {{ t('app.parent.button') }}
      ParentSheet(:open="parentOpen" @close="parentOpen = false")

      //- ===== Profile card =====
      div(class="profile-card")
        div(class="profile-row")
          div(class="avatar-wrap")
            img(
              :src="avatarSrc"
              alt="Profile"
              class="avatar-img"
              @error="onAvatarFallback"
            )
            button(
              type="button"
              class="avatar-picker-btn"
              :aria-label="t('app.profile.chooseAvatar')"
              @click="openAvatar"
            )
              ZIconography(name="edit" :size="18")

          div(class="profile-meta")
            //- View mode: name + pencil edit affordance.
            //- Edit mode: text input + save / cancel pills.
            template(v-if="!isEditingName")
              div(class="name-row")
                h2(class="profile-name") {{ displayName }}
                button(
                  type="button"
                  class="name-edit-btn"
                  :aria-label="t('app.profile.editName')"
                  @click="startEditName"
                )
                  ZIconography(name="edit" :size="16")
            template(v-else)
              form(
                class="name-edit-form"
                @submit.prevent="saveName"
              )
                input(
                  v-model="nameDraft"
                  type="text"
                  class="name-edit-input"
                  :placeholder="t('app.profile.namePlaceholder')"
                  maxlength="32"
                  autofocus
                  @keydown.esc="cancelEditName"
                )
                button(
                  type="submit"
                  class="name-edit-action name-edit-save"
                  :aria-label="t('app.profile.saveName')"
                )
                  ZIconography(name="check" :size="16")
                button(
                  type="button"
                  class="name-edit-action name-edit-cancel"
                  :aria-label="t('app.profile.cancelName')"
                  @click="cancelEditName"
                )
                  svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
                    path(d="M18 6 6 18M6 6l12 12")
            p(class="profile-role") {{ t('app.profile.adventurer') }}
            //div(class="level-row")
            //  span(class="level-crown")
            //    ZIconography(name="crown" :size="14")
            //  span(class="level-text") {{ t('app.profile.level', { n: userLevel }) }}
            //  span(class="level-xp") {{ userXp }} / {{ userXpMax }}
            //div(class="xp-track")
            //  div(
            //    class="xp-fill"
            //    :style="{ width: Math.round(xpPct * 100) + '%' }"
            //  )


      //- the child's own places: "My rewards" and "My games" (everything the adventures give), and the thank-you book
      nav(class="my-tiles" :aria-label="t('app.profile.myPlaces')")
        router-link(:to="{ name: 'app-collection' }" class="my-tile")
          img(:src="tileImg('icons/kacheln/kachel-karten-c')" alt="" class="my-tile-img" draggable="false")
          span(class="my-tile-title") {{ t('app.profile.myRewards') }}
          span(class="my-tile-sub") {{ t('app.collection.quickSub') }}
        router-link(:to="{ name: 'app-gameroom' }" :class="['my-tile', { 'is-wish': gameWishes.free > 0 }]")
          img(:src="tileImg('icons/kacheln/kachel-mini-c')" alt="" class="my-tile-img is-small" draggable="false")
          span(v-if="gameWishes.free > 0" class="my-tile-badge" aria-hidden="true") {{ gameWishes.free }}
          span(class="my-tile-title") {{ t('app.profile.myGames') }}
          span(class="my-tile-sub") {{ gameWishes.free > 0 ? t('app.bigGames.wishes', { n: gameWishes.free }, gameWishes.free) : t('app.profile.tileGamesSub') }}
        router-link(:to="{ name: 'app-journal' }" class="my-tile my-tile--wide")
          img(:src="tileImg('icons/kacheln/kachel-ich-tagebuch')" alt="" class="my-tile-img" draggable="false")
          span(class="my-tile-text")
            span(class="my-tile-title") {{ t('app.journal.title') }}
            span(class="my-tile-sub") {{ t('app.profile.tileJournalSub') }}

      //- LambKing Plus: runs (plan, until when) or "free version" with the way to the Plus page
      section(v-if="showPlusCard" :class="['plus-card', { 'is-on': plusOn }]" data-test="plus-card" aria-labelledby="plus-card-title")
        div(class="plus-card-head")
          h3(id="plus-card-title" class="plus-card-title") {{ plusOn ? t('app.profile.plusCardTitle') : t('app.profile.plusFreeTitle') }}
          span(v-if="plusOn" class="plus-card-badge" data-test="plus-badge") {{ t('app.profile.plusActive') }}
        p(v-if="plusOn && plusPlanName" class="plus-card-plan" data-test="plus-plan") {{ plusPlanName }}
        p(class="plus-card-line" data-test="plus-line") {{ plusOn ? plusLine : t('app.profile.plusFreeSub') }}
        div(class="plus-card-actions")
          router-link(:to="{ name: 'app-plus' }" class="lk-btn lk-btn--small plus-card-go" data-test="plus-go") {{ plusOn ? t('app.plus.title') : t('app.profile.plusSee') }}
          button(v-if="plusOn && plusInfo" type="button" class="plus-card-manage" data-test="plus-manage" @click="manageSubscription") {{ t('app.plus.manage') }}

      //- only in the test build: unlock all the adventures to try the cards and the big games
      TestUnlock(v-if="PLUS_TEST")

      //- ===== Settings (collapsible) =====
      div(
        v-if="settingsOpen"
        class="settings-card"
      )
        h3(class="card-section-title") {{ t('app.profile.settings') }}
        div(class="settings-row")
          span(class="settings-label") {{ t('app.profile.language') }}
          div(class="settings-actions")
            ZLanguageSwitcher(:size="34")

        //- day / night look of the whole app
        div(class="settings-row settings-row--col theme-row")
          span(class="settings-label") {{ t('app.theme.title') }}
          div(class="theme-seg" role="radiogroup" :aria-label="t('app.theme.title')")
            button(
              v-for="opt in themeOptions"
              :key="opt.id"
              type="button"
              role="radio"
              :aria-checked="themeChoice === opt.id"
              :class="['theme-opt', { 'is-on': themeChoice === opt.id }]"
              @click="setThemeChoice(opt.id)"
            )
              ZIconography(:name="opt.icon" :size="20")
              span {{ opt.label }}
          span(class="theme-hint") {{ t('app.theme.hint') }}

        //- the colour of the day look: three round colour pads
        div(v-if="!isNight" class="settings-row settings-row--col palette-row")
          span(class="settings-label") {{ t('app.theme.paletteTitle') }}
          div(class="palette-seg" role="radiogroup" :aria-label="t('app.theme.paletteTitle')")
            button(
              v-for="opt in paletteOptions"
              :key="opt.id"
              type="button"
              role="radio"
              :aria-checked="palette === opt.id"
              :class="['palette-opt', `is-${opt.id}`, { 'is-on': palette === opt.id }]"
              @click="setPalette(opt.id)"
            )
              span(class="palette-dot" aria-hidden="true")
              span {{ opt.label }}

        //- Backend feature flag — flip the API host between Render and
        //- the local dev server. Reloads the page so the IndexedDB cache
        //- repopulates from the new origin.
        //div(class="settings-row settings-row--col")
        //  div(class="settings-row-head")
        //    span(class="settings-label") {{ t('app.profile.localBackend') }}
        //    label(class="backend-switch")
        //      input(
        //        type="checkbox"
        //        :checked="useLocalBackend"
        //        @change="onBackendToggle"
        //      )
        //      span(class="backend-switch-track")
        //        span(class="backend-switch-thumb")
        //  span(class="backend-host-line")
        //    template(v-if="useLocalBackend") {{ t('app.profile.localBackendOn', { url: localBase }) }}
        //    template(v-else) {{ t('app.profile.localBackendOff', { url: remoteBase }) }}
        //  span(class="backend-hint") {{ t('app.profile.localBackendHint') }}

      //- ===== Favorites (Merkliste) =====
      section(
        id="favorites-section"
        class="favorites-section"
      )
        h3(class="card-section-title")
          span {{ t('app.profile.favorites') }}
          span(class="count-pill") {{ watchListBooks.length }}

        div(
          v-if="watchListBooks.length === 0"
          class="empty-card"
        ) {{ t('app.profile.emptyWatchList') }}

        div(v-else class="favorites-list")
          div(
            v-for="book in watchListBooks"
            :key="book.bookId"
            class="favorites-row"
          )
            div(class="favorites-thumb" @click="openBook(book.bookId)")
              img(
                :src="withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang), 70))"
                :alt="localizedTitle(book)"
                class="favorites-thumb-img"
                loading="lazy"
                @error="onImgFallback"
              )
            div(class="favorites-meta" @click="openBook(book.bookId)")
              h4(class="favorites-title") {{ localizedTitle(book) }}
            button(
              type="button"
              class="favorites-remove"
              :aria-label="t('app.profile.remove')"
              @click.stop="removeFromWatchList(book.bookId)"
            )
              svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
                path(d="M18 6 6 18M6 6l12 12")

    //- Outside `.profile-content` so its grid columns stay untouched. App
    //- Review 5.1.1(i) wants the privacy policy reachable inside the app.
    div(class="profile-legal")
      //- the build number, small and quiet: "is this the new version?"
      BuildStamp
      button(type="button" class="profile-legal-link" @click="openLegal") {{ t('app.legal.linkLabel') }}

    AvatarPickerModal(:open="avatarOpen" @close="closeAvatar")
</template>

<style scoped lang="sass">
$cream-bg: var(--lk-bg)
$cream-card: var(--lk-surface)
$navy: var(--lk-text)
$brown: var(--lk-muted)
$gold: var(--lk-accent)

.profile-legal
  display: flex
  justify-content: center
  padding: 20px 16px 0

.profile-legal-link
  min-height: 44px
  padding: 8px 16px
  font-size: 14px
  font-weight: 600
  color: $navy
  background: rgba(253, 248, 237, 0.85)
  border: 1px solid var(--lk-line)
  border-radius: 999px
  cursor: pointer
  -webkit-tap-highlight-color: transparent
$border: var(--lk-line)

button
  -webkit-tap-highlight-color: transparent

// The backdrop artwork lives on a viewport-pinned ::before layer instead of
// on the page box: the page scrolls (and is taller than the screen), so a
// plain background would scroll away and be sized against the whole document
// rather than the screen. `contain` keeps the artwork whole — no edge ever
// crops it — and the leftover strip on the short axis falls back to the
// palette's beige.
//
// `position: relative` + `z-index: 0` makes .profile-page its own stacking
// context so the `z-index: -1` layer stays above #app-root's opaque
// background (which would otherwise hide it) while still sitting behind the
// page content. Nothing inside the page is fixed or z-indexed, and the
// avatar modal teleports to <body>, so the new context traps nothing.
.profile-page
  position: relative
  z-index: 0
  background: var(--lk-bg)
  color: var(--lk-text)

.profile-head
  display: flex
  align-items: flex-end
  justify-content: space-between
  max-width: 28rem
  margin: 0 auto
  padding: 0 20px
  min-height: 92px

.profile-title
  margin: 0
  font-weight: 800
  font-size: 1.9rem
  line-height: 1.1

.profile-sub
  margin: 2px 0 8px
  color: var(--lk-muted)
  font-size: 1.1rem

.profile-lamb
  margin-bottom: -6px

.profile-header
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  max-width: 28rem
  margin: 0 auto

.header-btn
  width: 38px
  height: 38px
  border-radius: 999px
  background: transparent
  border: none
  color: $navy
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer

  &:hover
    background-color: rgba(255, 255, 255, 0.5)

  &:active
    transform: scale(0.92)

// Fill the cog silhouette (and only that — the button itself stays
// transparent) so the navy outline reads against the backdrop artwork's sky
// instead of sitting directly on it. The hub circle is drawn after the cog
// path in ZIconography, so it keeps its own outline on top of the white.
.header-btn :deep(.z-icon-outline path)
  fill: #ffffff

.title-cluster
  flex: 1
  display: flex
  align-items: center
  justify-content: center


.profile-back-btn
  --back-icon-color: var(--lk-text) !important

.page-title
  display: inline-flex
  align-items: center
  gap: 8px
  font-size: 22px
  font-weight: 700
  color: white
  margin: 0

.profile-content
  max-width: 28rem
  margin: 0 auto
  padding: 4px 20px 0
  display: flex
  flex-direction: column
  gap: 16px

// ===== Profile card =====
.profile-card
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  padding: 18px 16px
  box-shadow: var(--lk-shadow)

.profile-row
  display: flex
  align-items: center
  gap: 14px

.plus-card
  display: flex
  flex-direction: column
  gap: 6px
  margin-top: 14px
  padding: 14px 16px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  background: $cream-card
  box-shadow: var(--lk-shadow)

  &.is-on
    border-color: var(--lk-accent, #1f6f68)

.plus-card-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.plus-card-title
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  color: $navy

.plus-card-badge
  padding: 3px 12px
  border-radius: 999px
  background: var(--lk-accent-soft, #d9efe9)
  color: var(--lk-accent, #1f6f68)
  font-size: 0.8rem
  font-weight: 800

.plus-card-plan
  margin: 0
  font-weight: 700
  color: $navy

.plus-card-line
  margin: 0
  font-size: 0.92rem
  line-height: 1.35
  color: $navy

.plus-card-actions
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 12px
  margin-top: 4px

.plus-card-manage
  padding: 6px 2px
  border: 0
  background: none
  color: var(--lk-accent, #1f6f68)
  font-weight: 700
  text-decoration: underline
  cursor: pointer

.my-tiles
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px
  margin-top: 14px

.my-tile
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  justify-content: center
  gap: 3px
  min-height: 150px
  padding: 12px 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  text-decoration: none
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

  &.is-gold
    background: linear-gradient(160deg, #fbecc2, #f3d484)
    border-color: #e0bd62
    color: #3a2c10

.my-tile--wide
  grid-column: 1 / -1
  flex-direction: row
  justify-content: flex-start
  text-align: left
  gap: 16px
  min-height: 0
  padding: 10px 18px 10px 14px

  .my-tile-img
    flex: none
    width: 72px
    height: 72px
    margin: 0

.my-tile-text
  display: flex
  flex-direction: column
  gap: 2px

// a free wish: the tile glows gold and carries the number of games that may be picked
.my-tile.is-wish
  position: relative
  border: 2px solid #d4a83e
  background: rgba(255, 244, 196, 0.9)
  box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.35)
  color: #3d2c00

.my-tile-badge
  position: absolute
  top: 10px
  right: 10px
  min-width: 28px
  height: 28px
  padding: 0 8px
  display: grid
  place-items: center
  border-radius: 999px
  background: #d4a83e
  color: #fff
  font-weight: 800
  font-size: 0.95rem
  box-shadow: 0 2px 6px rgba(80, 50, 0, 0.35)

.my-tile-img
  width: 104px
  height: 104px
  margin-bottom: 2px
  object-fit: contain
  filter: drop-shadow(0 4px 6px rgba(20, 24, 32, 0.22))

// the puzzle fills its square: a little smaller, as in the adventure menu
.my-tile-img.is-small
  width: 84px
  height: 84px
  margin: 10px 0 12px

.my-tile-title
  font-size: 1.02rem
  font-weight: 800
  line-height: 1.2

.my-tile-sub
  font-size: 0.84rem
  line-height: 1.3
  opacity: 0.8

.awards-open
  margin-top: 14px
  text-decoration: none

.parent-open
  margin-bottom: 14px
  gap: 10px

  :deep(.z-icon-outline)
    color: currentColor

.avatar-wrap
  position: relative
  flex: 0 0 auto

.avatar-img
  width: 80px
  height: 80px
  border-radius: 999px
  object-fit: cover
  border: 3px solid $gold
  box-shadow: 0 6px 16px -6px rgba(212, 168, 62, 0.5)
  background: var(--lk-surface-2)

.avatar-picker-btn
  position: absolute
  bottom: 0
  right: 0
  width: 34px
  height: 34px
  border-radius: 999px
  background: var(--lk-read)
  color: #ffffff
  border: 2px solid $cream-card
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  transition: transform 150ms ease-out
  box-shadow: 0 4px 10px -2px rgba(10, 26, 48, 0.5)
  // Pad the SVG in slightly so the camera + crayon details breathe
  // inside the navy circle.
  padding: 3px
  // 34 px to look at, 44 px for a finger
  &::after
    content: ''
    position: absolute
    inset: -5px
    border-radius: 999px

  &:hover
    transform: scale(1.08)

  &:active
    transform: scale(0.92)

.profile-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 3px

.profile-name
  font-size: 19px
  font-weight: 700
  color: $navy
  margin: 0

// Name + edit-pencil row. The pencil button sits inline so kids see
// "I can change this" at a glance without an extra screen.
.name-row
  display: flex
  align-items: center
  gap: 6px

.name-edit-btn
  position: relative
  flex: 0 0 auto
  width: 26px
  height: 26px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  background-color: $cream-card
  border: 1px solid $border
  color: $navy
  cursor: pointer
  transition: background-color 150ms ease-out, transform 150ms ease-out, color 150ms ease-out

  // 26 px to look at, 44 px for a finger
  &::after
    content: ''
    position: absolute
    inset: -9px

  &:hover
    background-color: $gold
    color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.92)

.name-edit-form
  display: flex
  align-items: center
  gap: 6px
  width: 100%

.name-edit-input
  flex: 1
  min-width: 0
  font-size: 17px
  font-weight: 700
  color: $navy
  padding: 4px 10px
  background-color: $cream-card
  border: 1.5px solid $gold
  border-radius: 10px
  outline: none
  font-family: inherit

  &::placeholder
    color: $brown
    font-weight: 500

.name-edit-action
  flex: 0 0 auto
  width: 28px
  height: 28px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  border: 1.5px solid transparent
  cursor: pointer
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:active
    transform: scale(0.92)

.name-edit-save
  background: var(--lk-paint)
  color: #ffffff
  border-color: var(--lk-line)

  &:hover
    background: var(--lk-paint)

.name-edit-cancel
  background-color: $cream-card
  color: $brown
  border-color: $border

  &:hover
    background-color: #ffffff
    color: #a93d2e

.profile-role
  font-size: 12px
  color: $brown
  margin: 0
  font-weight: 700

.level-row
  display: flex
  align-items: center
  gap: 5px
  margin-top: 4px
  flex-wrap: wrap

.level-crown
  display: inline-flex

.level-text
  font-size: 12px
  font-weight: 700
  color: $navy

.level-xp
  margin-left: auto
  font-size: 12px
  color: $brown
  font-variant-numeric: tabular-nums

.xp-track
  margin-top: 4px
  height: 8px
  border-radius: 999px
  overflow: hidden
  background-color: rgba(0, 0, 0, 0.08)

.xp-fill
  height: 100%
  background: var(--lk-paint)
  border-radius: inherit
  transition: width 240ms ease-out

// ===== Quick actions grid =====
.quick-grid
  margin-top: 14px
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 8px

.quick-tile
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 12px 6px
  background: $cream-card
  border: 1px solid $border
  border-radius: 14px
  cursor: pointer
  color: $navy
  transition: transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms ease-out

  &:hover:not(.is-disabled)
    transform: translateY(-2px)
    box-shadow: 0 8px 18px -6px rgba(212, 168, 62, 0.4)

  &:active:not(.is-disabled)
    transform: scale(0.96)

  &.is-disabled
    opacity: 0.45
    cursor: not-allowed

.quick-icon
  display: inline-flex
  align-items: center
  justify-content: center
  width: 48px
  height: 48px
  filter: drop-shadow(0 4px 6px rgba(58, 42, 18, 0.25))

.quick-icon-img
  width: 100%
  height: 100%
  object-fit: contain

.quick-label
  font-size: 12px
  font-weight: 700
  color: $navy
  text-align: center
  line-height: 1.2

// ===== Settings =====
.settings-card
  background: $cream-card
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  padding: 16px
  box-shadow: var(--lk-shadow)
  display: flex
  flex-direction: column
  gap: 10px

.card-section-title
  font-size: 14px
  font-weight: 700
  color: $navy
  margin: 0
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

.settings-row
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

.settings-row--col
  flex-direction: column
  align-items: stretch
  gap: 6px

.settings-row-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

.settings-label
  font-size: 13px
  color: $brown
  font-weight: 700

.backend-switch
  position: relative
  display: inline-block
  width: 46px
  height: 24px
  cursor: pointer

  input
    position: absolute
    opacity: 0
    width: 0
    height: 0

.backend-switch-track
  position: absolute
  inset: 0
  border-radius: 999px
  background-color: rgba(0, 0, 0, 0.18)
  transition: background-color 180ms ease-out
  display: inline-flex
  align-items: center

.backend-switch-thumb
  position: absolute
  top: 2px
  left: 2px
  width: 20px
  height: 20px
  border-radius: 999px
  background: var(--lk-surface)
  box-shadow: 0 2px 6px -1px rgba(58, 42, 18, 0.4)
  transition: transform 180ms ease-out

.backend-switch input:checked + .backend-switch-track
  background: var(--lk-read)

.backend-switch input:checked + .backend-switch-track .backend-switch-thumb
  transform: translateX(22px)

.backend-host-line
  font-size: 12px
  font-weight: 700
  color: $navy
  font-family: 'Nunito', ui-monospace, monospace
  word-break: break-all

.backend-hint
  font-size: 12px
  color: $brown
  line-height: 1.35

.settings-actions
  display: inline-flex
  gap: 6px

// ===== Favorites =====
.favorites-section
  display: flex
  flex-direction: column
  gap: 10px

.count-pill
  display: inline-block
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  color: $navy
  background-color: $cream-card
  border: 1px solid $border
  padding: 4px 10px
  border-radius: 999px

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed var(--lk-line)
  border-radius: var(--lk-r-group)
  padding: 22px 16px
  color: $brown
  font-size: 13px

.favorites-list
  display: flex
  flex-direction: column
  gap: 10px

.favorites-row
  position: relative
  display: flex
  align-items: center
  gap: 12px
  background: $cream-card
  border: 1px solid $border
  border-radius: 16px
  padding: 8px 12px 8px 8px
  box-shadow: 0 6px 14px -8px rgba(58, 42, 18, 0.3)

.favorites-thumb
  flex: 0 0 auto
  width: 54px
  aspect-ratio: 3 / 4
  border-radius: 10px
  overflow: hidden
  cursor: pointer
  background: var(--lk-surface-2)
  display: flex
  align-items: center
  justify-content: center

.favorites-thumb-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.favorites-meta
  flex: 1
  min-width: 0
  cursor: pointer

.favorites-title
  font-size: 14px
  font-weight: 700
  color: $navy
  margin: 0
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.favorites-author
  font-size: 12px
  color: $brown
  margin-top: 2px

.favorites-remove
  flex: 0 0 auto
  width: 28px
  height: 28px
  border-radius: 999px
  background-color: $cream-card
  color: $brown
  border: 1px solid $border
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  transition: transform 150ms ease-out, color 150ms ease-out

  &:hover
    transform: scale(1.06)
    color: #a93d2e

  &:active
    transform: scale(0.94)

// ===== Mobile landscape =====
.is-landscape
  .profile-content
    max-width: 64rem
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 22px

  .profile-card
    grid-column: 1 / -1

  .quick-grid
    grid-template-columns: repeat(4, 1fr)

  .settings-card
    grid-column: 1
    align-self: start

  .favorites-section
    grid-column: 2

  // The settings card can be collapsed away with the header gear. When it
  // isn't rendered, the favorites section would otherwise lock to column 2
  // and leave column 1 empty; let it span both columns instead.
  .profile-content:not(:has(.settings-card)) .favorites-section
    grid-column: 1 / -1

// day / night switch
.theme-seg
  display: flex
  gap: 4px
  padding: 4px
  border-radius: 32px
  background: var(--lk-surface-2)
  border: 1px solid var(--lk-line)

.theme-opt
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
  flex: 1
  min-height: 48px
  border: none
  border-radius: 28px
  background: transparent
  color: var(--lk-text)
  font-weight: 700
  font-size: 1rem
  cursor: pointer

  :deep(.z-icon-outline)
    color: currentColor

  &.is-on
    background: var(--lk-accent)
    color: var(--lk-on-accent)

.theme-hint
  font-size: 0.88rem
  color: var(--lk-muted)

// the three colours of the day look
.palette-seg
  display: flex
  gap: 8px

.palette-opt
  flex: 1
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 10px 4px 8px
  border: 2px solid transparent
  border-radius: 20px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  font-size: 0.92rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    border-color: var(--lk-accent)
    background: var(--lk-accent-soft)

.palette-dot
  width: 40px
  height: 40px
  border-radius: 50%
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12)

  .is-mint &
    background: linear-gradient(135deg, #edf3f1 50%, #1d666a 50%)

  .is-gold &
    background: linear-gradient(135deg, #faf5ea 50%, #d9a521 50%)

  .is-creme &
    background: linear-gradient(135deg, #f8f4e9 50%, #1d666a 50%)
</style>
