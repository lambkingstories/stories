<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import ZLanguageSwitcher from '@/components/atoms/ZLanguageSwitcher.vue'
import AvatarPickerModal from '@/components/molecules/AvatarPickerModal.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useUser from '@/use/useUser'
import useReadingProgress from '@/use/useReadingProgress'
import useAvatar, { onAvatarFallback } from '@/use/useAvatar'
import useUserName from '@/use/useUserName'
import useApiConfig from '@/use/useApiConfig'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { watchListIds, removeFromWatchList } = useModels()
const apiBooks = useApiBooks()
const { userLanguage } = useUser()
const { getPct } = useReadingProgress()
const { avatarSrc } = useAvatar()
const {
  useLocalBackend,
  remoteBase,
  localBase,
  setUseLocalBackend
} = useApiConfig()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

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
</script>

<template lang="pug">
  div(
    :class="['profile-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']"
    :style="backdropVars"
  )
    //- ===== Header (back · crown · title · settings) =====
    header(class="profile-header")
      ZBackButton(
        class="profile-back-btn"
        variant="flat"
        @click="goBack"
      )
      div(class="title-cluster")
        div(class="brand-stack flex flex-col items-center justify-center gap-0")
          img(
            :src="prependBaseUrl('images/icons/crown_256x256.webp')"
            alt="LambKing"
            class="brand-crown w-[44px] object-contain -mb-1"
            decoding="async"
          )
          h1(class="page-title")
            span {{ t('app.profile.title') }}
      button(
        type="button"
        class="header-btn"
        :aria-label="t('app.profile.settings')"
        @click="toggleSettings"
      )
        ZIconography(name="settings" :size="22")

    div(class="profile-content")
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
              //- Photo camera with a crayon, signalling the avatar
              //- portrait is editable.
              svg(viewBox="0 0 32 32" fill="none" class="w-full h-full" aria-hidden="true")
                //- Camera body
                rect(x="3" y="9" width="26" height="18" rx="3.5" fill="#1a2f4a" stroke="#ffffff" stroke-width="1.4")
                //- Top hump above the lens
                path(d="M11 9l1.6-3h6.8L21 9z" fill="#1a2f4a" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round")
                //- Lens outer ring
                circle(cx="16" cy="18.5" r="5.2" fill="#0d1b2e" stroke="#ffffff" stroke-width="1.4")
                //- Lens glass + highlight
                circle(cx="16" cy="18.5" r="3" fill="#3a6fa8")
                circle(cx="14.4" cy="17" r="1.1" fill="#cfe4ff")
                //- Flash window (top-left)
                rect(x="6" y="11.5" width="3" height="2" rx="0.5" fill="#cfe4ff")
                //- Crayon — orange shaft + sharpened tip + tape band
                g(transform="rotate(-32 22 11)")
                  rect(x="14" y="9.5" width="13" height="3.6" rx="0.6" fill="#f0a040" stroke="#7a4a10" stroke-width="0.6")
                  rect(x="22" y="9.5" width="2.4" height="3.6" fill="#7a4a10")
                  path(d="M27 9.5l3 1.8-3 1.8z" fill="#fff2d8" stroke="#7a4a10" stroke-width="0.6" stroke-linejoin="round")
                  path(d="M30 11.3l0.8 0.5l-0.8 0.5z" fill="#3b2410")

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
                  ZIconography(name="pencil" :size="16")
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

        //- Quick action grid
        div(class="quick-grid")
          button(
            v-for="qa in quickActions"
            :key="qa.id"
            type="button"
            :class="['quick-tile', { 'is-disabled': qa.disabled }]"
            :disabled="qa.disabled"
            :aria-label="qa.label"
            @click="onQuickAction(qa)"
          )
            span(class="quick-icon")
              img(
                :src="qa.icon"
                :alt="qa.label"
                class="quick-icon-img"
                @error="onImgFallback"
              )
            span(class="quick-label") {{ qa.label }}

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
          span.text-white {{ t('app.profile.favorites') }}
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
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
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
      button(type="button" class="profile-legal-link" @click="openLegal") {{ t('app.legal.linkLabel') }}

    AvatarPickerModal(:open="avatarOpen" @close="closeAvatar")
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$navy: #1a2f4a
$brown: #7a6b55
$gold: #d4a83e

.profile-legal
  display: flex
  justify-content: center
  padding: 20px 16px 0

.profile-legal-link
  padding: 8px 16px
  font-size: 14px
  font-weight: 600
  color: $navy
  background: rgba(253, 248, 237, 0.85)
  border: 1px solid #e6d6b5
  border-radius: 999px
  cursor: pointer
  -webkit-tap-highlight-color: transparent
$border: #e6d6b5

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
  background: transparent
  color: $navy

.profile-page::before
  content: ''
  position: fixed
  top: 0
  left: 0
  width: 100%
  // Sized instead of `inset: 0` on purpose: during the page-pop-scale route
  // animation the transform on .profile-page turns it into the containing
  // block for this fixed layer, and `bottom: 0` would then stretch the
  // artwork over the full document height and snap back when the animation
  // ends. A viewport-height box looks identical in both states.
  height: 100vh
  height: 100dvh
  z-index: -1
  pointer-events: none
  background-color: $cream-bg
  background-image: var(--profile-bg-portrait)
  background-repeat: no-repeat
  background-position: center
  background-size: cover

@media (orientation: landscape)
  .profile-page::before
    background-image: var(--profile-bg-landscape)

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
  --back-icon-color: #1a2f4a !important

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
  background: linear-gradient(180deg, #fdf8ed 0%, #f5e8c2 100%)
  border: 1.5px solid $border
  border-radius: 24px
  padding: 16px
  box-shadow: 0 12px 28px -14px rgba(58, 42, 18, 0.3)

.profile-row
  display: flex
  align-items: center
  gap: 14px

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
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)

.avatar-picker-btn
  position: absolute
  bottom: 0
  right: 0
  width: 34px
  height: 34px
  border-radius: 999px
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
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
  background: linear-gradient(180deg, #6da045 0%, #4a7332 100%)
  color: #ffffff
  border-color: #4a7332

  &:hover
    background: linear-gradient(180deg, #7cb24f 0%, #588439 100%)

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
  font-size: 11px
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
  background: linear-gradient(90deg, #6da045 0%, #4a7332 100%)
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
  font-size: 11px
  font-weight: 700
  color: $navy
  text-align: center
  line-height: 1.2

// ===== Settings =====
.settings-card
  background: $cream-card
  border: 1px solid $border
  border-radius: 18px
  padding: 14px 16px
  box-shadow: 0 6px 18px -10px rgba(58, 42, 18, 0.25)
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
  background: linear-gradient(180deg, #ffffff 0%, #fbf1d6 100%)
  box-shadow: 0 2px 6px -1px rgba(58, 42, 18, 0.4)
  transition: transform 180ms ease-out

.backend-switch input:checked + .backend-switch-track
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)

.backend-switch input:checked + .backend-switch-track .backend-switch-thumb
  transform: translateX(22px)

.backend-host-line
  font-size: 11px
  font-weight: 700
  color: $navy
  font-family: 'Nunito', ui-monospace, monospace
  word-break: break-all

.backend-hint
  font-size: 10px
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
  font-size: 11px
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
  border: 1px dashed $border
  border-radius: 18px
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
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
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
  font-size: 11px
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
</style>
