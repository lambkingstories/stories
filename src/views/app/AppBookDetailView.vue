<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZButton from '@/components/atoms/ZButton.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AAudioPlayer from '@/components/atoms/AAudioPlayer.vue'
import AttachmentTile from '@/components/molecules/AttachmentTile.vue'
import AttachmentContextMenu from '@/components/molecules/AttachmentContextMenu.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import useReadingProgress from '@/use/useReadingProgress'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, ApiBookAttachment, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { markdownToHtml } from '@/utils/markdownToHtml'
import { isColoringBook } from '@/utils/coloringBook'
import useColoringShelf from '@/use/useColoringShelf'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import usePremium from '@/use/usePremium'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const {
  isInWatchList, toggleWatchList, setLastRead,
  getPlaybackState, setPlaybackState
} = useModels()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { seriesNameOfBook } = useCatalogNames()
const { getPct, isCompleted } = useReadingProgress()

const bookId = computed(() => String(route.params.bookId))
const book = computed<ApiBook | null>(
  () => (apiBooks.state.byId[bookId.value] as ApiBook | undefined) ?? null
)

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const localization = computed(() => {
  const b = book.value
  if (!b) return null
  return b.localizations?.[lang.value] ?? b.localizations?.de ?? null
})
const localizedTitle = computed(() => localization.value?.title || '')
const localizedDescription = computed(() => localization.value?.description || '')
// Coloring books have no audio — the "Anhören" CTA is hidden and listen mode
// is never entered for them.
const isColoring = computed(() => isColoringBook(book.value))
// a coloring book is not "saved" but put into the paint shelf of the painting program
const paintShelf = useColoringShelf()
const inPaintShelf = computed(() => (book.value ? paintShelf.ids.value.includes(book.value.bookId) : false))
const contentNotes = computed(() => localization.value?.contentNotes?.trim() || '')
const contentNotesHtml = computed(() =>
  contentNotes.value ? markdownToHtml(contentNotes.value) : ''
)
// Split admin-authored markdown notes into bullet items so we can render
// each as a green-check row matching the design. Falls back gracefully if
// the editor wrote a plain paragraph instead of a list.
const contentNoteItems = computed<string[]>(() => {
  const raw = contentNotes.value
  if (!raw) return []
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*+]\s+/, '').trim())
    .filter((l) => l.length > 0)
  return lines
})

const inWatchList = computed(() => (book.value ? isInWatchList(book.value.bookId) : false))

async function fetchBook() {
  const loaded = await apiBooks.loadBook(bookId.value)
  if (loaded) {
    setLastRead(loaded.bookId)
    const saved = getPlaybackState(loaded.bookId)
    if (saved && typeof saved.time === 'number' && saved.time > 0) {
      pendingResumeTime = saved.time
    }
  }
}

type ViewMode = 'detail' | 'listen'
// Deep-link support: `/app/book/:id?mode=listen` opens the audio
// player directly (used by the "Anhören" CTA on the Weiterlesen
// hero). Defaults to the standard detail screen otherwise.
// Listening to the stories is a LambKing Plus feature once the subscription is on
// (always allowed until then, see `usePremium`).
const { hasFeature, showUpsell } = usePremium()
const mode = ref<ViewMode>(route.query.mode === 'listen' && hasFeature('readAloud') ? 'listen' : 'detail')

// A coloring book can never enter listen mode, even via a `?mode=listen`
// deep link — there is no audio to play.
watch(isColoring, (coloring) => {
  if (coloring) mode.value = 'detail'
}, { immediate: true })

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const audioLoading = ref(false)
let rafId = 0

const audioSrc = computed(() => {
  const b = book.value
  if (!b || !b.audio) return ''
  return b.audio[lang.value] || b.audio.de || b.audio.en || ''
})

function onAudioLoadStart() {
  audioLoading.value = true
}

function onAudioWaiting() {
  audioLoading.value = true
}

function onAudioCanPlay() {
  audioLoading.value = false
}

function onAudioPlaying() {
  audioLoading.value = false
}

function onAudioStalled() {
  audioLoading.value = true
}

function ensureAudio() {
  if (!audioEl.value) return
  audioEl.value.addEventListener('timeupdate', onTimeUpdate)
  audioEl.value.addEventListener('loadedmetadata', onLoadedMeta)
  audioEl.value.addEventListener('ended', onEnded)
  audioEl.value.addEventListener('loadstart', onAudioLoadStart)
  audioEl.value.addEventListener('waiting', onAudioWaiting)
  audioEl.value.addEventListener('canplay', onAudioCanPlay)
  audioEl.value.addEventListener('playing', onAudioPlaying)
  audioEl.value.addEventListener('stalled', onAudioStalled)
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

function tickRaf() {
  if (!isPlaying.value || !audioEl.value) {
    rafId = 0
    return
  }
  currentTime.value = audioEl.value.currentTime
  rafId = requestAnimationFrame(tickRaf)
}

function startRaf() {
  if (rafId) return
  rafId = requestAnimationFrame(tickRaf)
}

function stopRaf() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function onLoadedMeta() {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration || 0
  if (pendingResumeTime > 0) {
    const t0 = Math.min(Math.max(0, pendingResumeTime), Math.max(0, duration.value - 0.5))
    audioEl.value.currentTime = t0
    currentTime.value = t0
    pendingResumeTime = 0
  }
}

let pendingResumeTime = 0

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  stopRaf()
}

function togglePlay() {
  if (!audioEl.value) {
    isPlaying.value = !isPlaying.value
    return
  }
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
    stopRaf()
  } else {
    audioEl.value.play().then(() => {
      isPlaying.value = true
      startRaf()
    }).catch(() => {
      isPlaying.value = !isPlaying.value
    })
  }
}

function rewind(seconds = 15) {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.max(0, audioEl.value.currentTime - seconds)
}

function forward(seconds = 15) {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.min(duration.value || 0, audioEl.value.currentTime + seconds)
}

function seek(seconds: number) {
  if (!audioEl.value) return
  audioEl.value.currentTime = seconds
  currentTime.value = seconds
}

function savePlayback() {
  if (!book.value) return
  setPlaybackState(book.value.bookId, {
    time: currentTime.value || 0,
    audioSrc: audioSrc.value
  })
}

onMounted(() => {
  ensureAudio()
  void fetchBook()
  // Series records back the name shown in the eyebrow above the title.
  void apiSeries.loadAll()
})
onUnmounted(() => {
  savePlayback()
  stopRaf()
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.removeEventListener('timeupdate', onTimeUpdate)
    audioEl.value.removeEventListener('loadedmetadata', onLoadedMeta)
    audioEl.value.removeEventListener('ended', onEnded)
    audioEl.value.removeEventListener('loadstart', onAudioLoadStart)
    audioEl.value.removeEventListener('waiting', onAudioWaiting)
    audioEl.value.removeEventListener('canplay', onAudioCanPlay)
    audioEl.value.removeEventListener('playing', onAudioPlaying)
    audioEl.value.removeEventListener('stalled', onAudioStalled)
  }
})
watch(bookId, () => {
  void fetchBook()
})
watch(audioSrc, (src) => {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  // Auto-start playback when we were deep-linked into listen mode and
  // the audio source has just become available. Browsers may still
  // block the unattended `.play()` (no user gesture); the catch keeps
  // the view in listen mode either way so the user only needs one
  // additional tap.
  if (mode.value === 'listen' && src) {
    setTimeout(() => {
      if (audioEl.value && !isPlaying.value) {
        audioEl.value.play().then(() => {
          isPlaying.value = true
          startRaf()
        }).catch(() => {
        })
      }
    }, 50)
  }
}, { immediate: true })

function goBack() {
  if (mode.value !== 'detail') {
    if (audioEl.value && isPlaying.value) {
      audioEl.value.pause()
      isPlaying.value = false
      stopRaf()
    }
    savePlayback()
    mode.value = 'detail'
    return
  }
  savePlayback()
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-all-books' })
}

function onToggleWatchList() {
  if (!book.value) return
  if (isColoring.value) paintShelf.toggle(book.value.bookId)
  else toggleWatchList(book.value.bookId)
}

function onListen() {
  if (!hasFeature('readAloud')) {
    showUpsell('readAloud')
    return
  }
  mode.value = 'listen'
  setTimeout(() => {
    if (audioEl.value && !isPlaying.value) {
      audioEl.value.play().then(() => {
        isPlaying.value = true
        startRaf()
      }).catch(() => {
      })
    }
  }, 50)
}

function onRead() {
  if (!book.value) return
  router.push({ name: 'app-reader', params: { bookId: book.value.bookId } })
}

const totalPages = computed(() => localization.value?.content?.length || 0)
const readingPct = computed(() => {
  if (!book.value) return 0
  return getPct(book.value.bookId, totalPages.value)
})
const readingPctLabel = computed(() => `${Math.round(readingPct.value * 100)}%`)
const readingDone = computed(() => (book.value ? isCompleted(book.value.bookId) : false))

function onDownload() {
  const src = audioSrc.value
  if (!src) return
  const a = document.createElement('a')
  a.href = src
  a.download = `${localizedTitle.value || 'audio'}.mp3`
  a.click()
}

// ----- Attachments row -----
const attachments = computed<ApiBookAttachment[]>(() => {
  const raw = book.value?.attachments
  if (!Array.isArray(raw)) return []
  const out: ApiBookAttachment[] = []
  for (const a of raw as unknown[]) {
    if (typeof a === 'string') {
      if (a) out.push({ previewImage: '', data: a, type: 'download' })
      continue
    }
    if (a && typeof a === 'object') {
      const o = a as { previewImage?: unknown; data?: unknown; type?: unknown }
      const previewImage = typeof o.previewImage === 'string' ? o.previewImage : ''
      const data = typeof o.data === 'string' ? o.data : ''
      const type: ApiBookAttachment['type'] = o.type === 'coloring' ? 'coloring' : 'download'
      if (data || previewImage) out.push({ previewImage, data, type })
    }
  }
  return out
})

const menuAnchor = ref<{ rect: DOMRect } | null>(null)
const menuAttachment = ref<ApiBookAttachment | null>(null)

function openAttachmentMenu(att: ApiBookAttachment, e: MouseEvent) {
  const tile = (e.currentTarget as HTMLElement) ?? (e.target as HTMLElement)
  if (!tile) return
  menuAttachment.value = att
  menuAnchor.value = { rect: tile.getBoundingClientRect() }
}

function closeAttachmentMenu() {
  menuAnchor.value = null
  menuAttachment.value = null
}

function attachmentDownloadName(att: ApiBookAttachment): string {
  const url = att.data || ''
  try {
    const u = new URL(url, window.location.origin)
    const last = u.pathname.split('/').filter(Boolean).pop()
    if (last) return last
  } catch {
  }
  const base = (localizedTitle.value || 'attachment').replace(/\s+/g, '-')
  if (att.type === 'coloring') return `${base}.png`
  return `${base}.pdf`
}

function saveAttachmentToPhone() {
  const att = menuAttachment.value
  if (!att?.data) {
    closeAttachmentMenu()
    return
  }
  const a = document.createElement('a')
  a.href = att.data
  a.download = attachmentDownloadName(att)
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
  closeAttachmentMenu()
}

/** A coloring book opens its own overview: the pages as painted so far, to go on painting from. */
function onPaintBook() {
  if (!book.value) return
  router.push({ name: 'app-coloring-book', params: { bookId: book.value.bookId } })
}

function useInColoringApp() {
  const att = menuAttachment.value
  if (!att?.data) {
    closeAttachmentMenu()
    return
  }
  const isPdf = att.type === 'coloring' && /\.pdf(?:\?.*)?$/i.test(att.data)
  router.push({
    name: 'app-coloring',
    query: { source: att.data, type: isPdf ? 'pdf' : 'image' }
  })
  closeAttachmentMenu()
}

watch(currentTime, (v, prev) => {
  if (mode.value !== 'listen' || !isPlaying.value) return
  if (Math.floor(v / 3) !== Math.floor(prev / 3)) savePlayback()
})

// Eyebrow above the book title — the series this story belongs to, in the
// active language (the API only carries the German name).
const seriesName = computed(() => seriesNameOfBook(book.value))
</script>

<template lang="pug">
  div(:class="['book-detail-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']")
    template(v-if="book")
      //- ===== Hero — back · centered 3:4 cover card · bookmark =====
      //- The cover floats inside the cream page (no edge bleed) so the
      //- whole header reads as parchment with a contained book illustration.
      div(class="hero")
        button(type="button" class="hero-back lk-btn lk-btn--outline lk-btn--small" @click="goBack")
          ZIconography(name="chevron-left" :size="20")
          span {{ t('app.read.back') }}

        div(class="hero-row")
          div(class="hero-cover")
            img(
              :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
              :alt="localizedTitle"
              class="hero-cover-img"
              loading="eager"
              @error="onImgFallback"
            )
          div(class="hero-info")
            span(class="series-eyebrow") {{ seriesName }}
            h1(class="book-band-title") {{ localizedTitle }}
            LkCompanion(class="hero-lamb" pose="buch" :size="96")

      template(v-if="mode === 'detail'")
        //- ===== Detail section =====
        div(class="detail-content")

          //- ===== CTAs =====
          //- Both buttons render unconditionally so the layout never
          //- collapses to a single full-width CTA. When the book has no
          //- audio file, `onListen` still flips the view into listen mode
          //- and shows the empty player — the editor can confirm in
          //- AdminUI whether the upload is missing.
          div(class="cta-row")
            //- Coloring book: paint it (turn the pages, keep on painting) or just leaf through it.
            button(v-if="isColoring" type="button" class="lk-btn lk-btn--full" @click="onPaintBook")
              ZIconography(name="brush" :size="22")
              span {{ t('app.bookDetail.paint') }}
            button(type="button" :class="['lk-btn', 'lk-btn--full', { 'lk-btn--outline': isColoring }]" @click="onRead")
              ZIconography(name="series" :size="22")
              span {{ isColoring ? t('app.bookDetail.browse') : t('app.bookDetail.readMyself') }}
            div(class="cta-second")
              button(
                v-if="!isColoring"
                type="button"
                class="lk-btn lk-btn--outline"
                :disabled="!audioSrc"
                @click="onListen"
              )
                ZIconography(name="headphones" :size="22")
                span {{ t('app.bookDetail.listen') }}
              button(
                type="button"
                class="lk-btn lk-btn--outline"
                :aria-pressed="isColoring ? inPaintShelf : inWatchList"
                @click="onToggleWatchList"
              )
                ZIconography(name="bookmark" :size="22")
                span(v-if="isColoring") {{ inPaintShelf ? t('app.bookDetail.inShelf') : t('app.bookDetail.toShelf') }}
                span(v-else) {{ inWatchList ? t('app.bookDetail.saved') : t('app.bookDetail.save') }}

          //- ===== Reading progress (below the CTAs) =====
          div(
            v-if="readingPct > 0"
            class="reading-progress"
            :aria-label="t('app.bookDetail.progress', { pct: readingPctLabel })"
          )
            div(class="reading-progress-row")
              span(class="reading-progress-label") {{ readingDone ? t('app.bookDetail.completed') : t('app.bookDetail.progressLabel') }}
              span(class="reading-progress-pct") {{ readingPctLabel }}
            div(class="reading-progress-track")
              div(
                class="reading-progress-fill"
                :class="{ 'is-done': readingDone }"
                :style="{ width: readingPctLabel }"
              )

          p(class="book-subtitle") {{ localizedDescription }}

          //- ===== Das erwartet dich (green check list) =====
          div(
            v-if="contentNoteItems.length"
            class="awaits-block"
          )
            h3(class="awaits-title") {{ t('app.bookDetail.thisAwaitsYou') }}
            ul(class="awaits-list")
              li(
                v-for="(line, i) in contentNoteItems"
                :key="`note-${i}`"
                class="awaits-item"
              )
                span(class="awaits-check")
                  ZIconography(name="check" :size="14")
                span(v-html="line.replace(/&/g, '&amp;').replace(/</g, '&lt;')")


          //- ===== Attachments =====
          section(
            v-if="attachments.length"
            class="attachments-section"
          )
            h3(class="awaits-title") {{ t('app.bookDetail.attachmentsTitle') }}
            div(class="attachments-row")
              AttachmentTile(
                v-for="(att, i) in attachments"
                :key="`att-${i}`"
                :attachment="att"
                @select="(a, e) => openAttachmentMenu(a, e)"
              )

      //- ===== Listen mode =====
      template(v-else-if="mode === 'listen'")
        div(class="detail-content")
          span(class="series-eyebrow") {{ t('app.bookDetail.nowListening') }}
          h2(class="book-band-title") {{ localizedTitle }}
          div(class="audio-wrap")
            AAudioPlayer(
              :is-playing="isPlaying"
              :current-time="currentTime"
              :duration="duration"
              :loading="audioLoading"
              @toggle="togglePlay"
              @rewind="rewind"
              @forward="forward"
              @seek="seek"
            )
            div(v-if="audioSrc" class="audio-download")
              ZButton(type="secondary" icon="download" size="sm" @click="onDownload") {{ t('app.bookDetail.download') }}

      audio(
        ref="audioEl"
        :src="audioSrc"
        preload="auto"
        class="hidden"
      )

      AttachmentContextMenu(
        :anchor="menuAnchor"
        :show-coloring-option="menuAttachment?.type === 'coloring'"
        @close="closeAttachmentMenu"
        @save-to-phone="saveAttachmentToPhone"
        @use-in-coloring="useInColoringApp"
      )

    div(v-else class="not-found") {{ t('app.bookDetail.notFound') }}
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

.book-detail-page
  background: var(--lk-bg)
  color: $navy

// ===== Hero =====
.hero
  position: relative
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding: calc(max(env(safe-area-inset-top), 0.5rem) + 8px) 16px 8px
  display: flex
  flex-direction: column
  gap: 14px

.hero-back
  align-self: flex-start
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

.hero-row
  display: flex
  gap: 16px
  align-items: stretch

// the cover is shown whole (3:4)
.hero-cover
  flex: 0 0 44%
  aspect-ratio: 3 / 4
  border-radius: var(--lk-r-cover)
  overflow: hidden
  background: var(--lk-surface-2)
  border: 1px solid $border
  box-shadow: var(--lk-shadow)

.hero-cover-img
  width: 100%
  height: 100%
  object-fit: cover
  display: block

.hero-info
  position: relative
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 6px
  padding-bottom: 96px

.hero-lamb
  position: absolute
  right: 0
  bottom: 0

// ===== Detail =====
.detail-content
  max-width: 28rem
  margin: 0 auto
  padding: 12px 16px 0
  display: flex
  flex-direction: column
  gap: 14px

.cta-row
  display: flex
  flex-direction: column
  gap: 10px

.cta-second
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

.cta-second .lk-btn:disabled
  opacity: 0.55
  cursor: default

.series-eyebrow
  font-size: 12px
  font-weight: 700
  color: $brown
  letter-spacing: 0.06em

.book-band-title
  font-size: 1.55rem
  font-weight: 800
  color: $navy
  line-height: 1.15
  margin: 0
  letter-spacing: -0.005em

.book-subtitle
  font-size: 14px
  color: $brown
  margin: -2px 0 0
  font-weight: 700

.book-desc
  font-size: 14px
  line-height: 1.5
  color: $navy
  margin: 8px 0 0

// ===== Awaits =====
.awaits-block
  margin-top: 4px
  padding: 16px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  display: flex
  flex-direction: column
  gap: 10px

.awaits-title
  font-size: 15px
  font-weight: 700
  color: $navy
  margin: 0

.awaits-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: 6px

.awaits-item
  display: flex
  align-items: flex-start
  gap: 10px
  font-size: 14px
  color: $navy
  line-height: 1.4

.awaits-check
  flex: 0 0 auto
  width: 22px
  height: 22px
  border-radius: 999px
  background: var(--lk-paint)
  color: var(--lk-on-color)
  display: inline-flex
  align-items: center
  justify-content: center
  margin-top: 1px

// ===== Reading progress =====
.reading-progress
  margin-top: 12px
  display: flex
  flex-direction: column
  gap: 6px

.reading-progress-row
  display: flex
  align-items: baseline
  justify-content: space-between
  gap: 12px
  font-size: 12px
  font-weight: 700
  color: $brown
  text-transform: uppercase
  letter-spacing: 0.05em

.reading-progress-pct
  color: $navy
  font-variant-numeric: tabular-nums

.reading-progress-track
  height: 8px
  background: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.reading-progress-fill
  height: 100%
  background: linear-gradient(90deg, #c89030 0%, #d4a83e 100%)
  border-radius: inherit
  transition: width 240ms ease-out

  &.is-done
    background: var(--lk-paint)

// ===== Attachments =====
.attachments-section
  margin-top: 18px
  padding-bottom: 12px

.attachments-row
  display: flex
  flex-wrap: wrap
  gap: 12px

.attachments-row > *
  flex: 0 0 calc(33.3333% - 8px)
  max-width: calc(33.3333% - 8px)

// ===== Listen audio wrapper =====
.audio-wrap
  margin-top: 12px

.audio-download
  margin-top: 12px
  display: flex
  justify-content: center

.not-found
  max-width: 28rem
  margin: 40px auto
  text-align: center
  color: $brown

// ===== Mobile landscape — two-column =====
.is-landscape
  .hero
    max-width: 100%
    align-items: center
    padding-left: 14px
    padding-right: 14px

  .hero-cover
    height: 60vh
    max-height: 60vh

  .detail-content
    max-width: 64rem
    padding-top: 6px
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 22px

  .series-eyebrow,
  .book-band-title,
  .book-subtitle,
  .book-desc
    grid-column: 1 / -1

  .awaits-block, .cta-row, .reading-progress, .attachments-section
    grid-column: 1 / -1
</style>
