<script setup lang="ts">
/**
 * High-fidelity, full-screen reader for a single book. Behaves like the
 * AdminUI iPhone previewer (cover → content pages), without any device
 * chrome. Pages flip on swipe (touch + mouse drag); a press-and-swipe-right
 * SVG hand demos the gesture on first open per book; dwell timing feeds
 * `useReadingProgress` so completion progresses honestly. After the last
 * content page we render a celebration page with confetti and surface the
 * next volume in the same series via ABookCard.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import ABookCard from '@/components/atoms/ABookCard.vue'
import AchievementBadge from '@/components/atoms/AchievementBadge.vue'
import ZButton from '@/components/atoms/ZButton.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import SwipeHintHand, { hasSeenSwipeHint } from '@/components/molecules/SwipeHintHand.vue'
import AttachmentContextMenu from '@/components/molecules/AttachmentContextMenu.vue'
import useApiBooks from '@/use/useApiBooks'
import useBookCache from '@/use/useBookCache'
import useReadingProgress from '@/use/useReadingProgress'
import { allowedPages, freePageCount, isLimited, previewTexts, type BookKind } from '@/use/useBookAccess'
import usePremium from '@/use/usePremium'
import type { ApiBook, ApiLocalizedPage, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { coloringPagesOfBook, isColoringBook, pageCaptionOf, pageImageOf } from '@/utils/coloringBook'
import { hasVerticalCenter, markdownToHtml, renderInline } from '@/utils/markdownToHtml'
import { onImgFallback, PLACEHOLDER_IMAGE } from '@/utils/placeholder'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const bookId = computed(() => String(route.params.bookId))
const apiBooks = useApiBooks()
const cache = useBookCache()
const progress = useReadingProgress()

const book = ref<ApiBook | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

async function fetchBook() {
  loading.value = true
  loadError.value = null
  try {
    const b = await apiBooks.loadBook(bookId.value)
    book.value = b
    if (!b) loadError.value = 'not-found'
  } catch (err) {
    loadError.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(fetchBook)
watch(bookId, () => {
  if (isAnimating.value) {
    if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
    pendingFallbackTimer = null
    isAnimating.value = false
    pendingShift.value = 0
    dragOffset.value = 0
  }
  currentIndex.value = 0
  fetchBook()
})

// ----- Locale-aware content -----

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

const localization = computed(() => {
  const b = book.value
  if (!b) return null
  return b.localizations?.[lang.value] ?? b.localizations?.de ?? null
})

const pages = computed<ApiLocalizedPage[]>(() => localization.value?.content ?? [])

// Coloring books (Ausmalbücher): each content page is a single image that
// fills the viewport and can be tapped to open in the coloring app.
const isColoring = computed(() => isColoringBook(book.value))

// The picture of a coloring page: its own `image` field, or (old form) markdown in the text.
const imageOf = (p: ApiLocalizedPage | undefined): string => pageImageOf(p)
const captionOf = (p: ApiLocalizedPage) => pageCaptionOf(p)
/** A page with a text or a Bible passage shows it under the picture (the title alone is on the coloring screen anyway). */
const hasCaption = (p: ApiLocalizedPage) => {
  const c = pageCaptionOf(p)
  return !!(c.text || c.reference)
}

const coverImage = computed<string>(() => {
  const b = book.value
  if (!b) return ''
  // Page 1 (the in-reader title image) now uses previewImage exclusively —
  // coverImage and contentCoverImage are hidden in the admin UI and treated
  // as optional. Fall back across locales so a DE-only book still renders
  // the splash on the EN tab.
  return pickLocalizedImage(b.previewImage, lang.value)
})

type DisplayEntry =
  | { kind: 'cover'; image: string }
  | { kind: 'page'; page: ApiLocalizedPage; pageNumber: number }
  | { kind: 'celebration' }
  | { kind: 'locked' }

const { showUpsell } = usePremium()
const bookKind = computed<BookKind>(() => (isColoring.value ? 'coloring' : 'story'))

/**
 * How much of the book may be seen: the first pictures of a coloring book, the first 15 % of the text of any
 * other book (see `useBookAccess`). Only while the book is locked; then the rest is replaced by one page that says so.
 */
const pageAccess = computed(() => {
  const b = book.value
  const list = pages.value
  if (isColoring.value) {
    // a coloring book counts its pictures, not its text pages (an intro)
    const units = list.filter((p) => !!imageOf(p)).length
    const allowed = b ? allowedPages(b.bookId, 'coloring', units, b.freePages) : units
    return { units, allowed, locked: allowed < units, shown: list }
  }
  if (!b || !isLimited(b.bookId)) return { units: list.length, allowed: list.length, locked: false, shown: list }
  const cut = previewTexts(list.map((p) => p.text))
  const shown = cut.texts.map((text, i) => ({ ...list[i]!, text }))
  return { units: list.length, allowed: shown.length, locked: cut.cut, shown }
})

const displayEntries = computed<DisplayEntry[]>(() => {
  const list: DisplayEntry[] = []
  if (coverImage.value) list.push({ kind: 'cover', image: coverImage.value })
  const { allowed, locked, shown } = pageAccess.value
  if (isColoring.value) {
    let unit = 0
    for (const [i, p] of shown.entries()) {
      const isUnit = !!imageOf(p)
      if (isUnit) unit++
      if (locked && isUnit && unit > allowed) break
      list.push({ kind: 'page', page: p, pageNumber: i + 1 })
    }
  } else {
    shown.forEach((p, i) => list.push({ kind: 'page', page: p, pageNumber: i + 1 }))
  }
  list.push(locked ? { kind: 'locked' } : { kind: 'celebration' })
  return list
})

function openUpsell() {
  const b = book.value
  if (!b) return
  const shop = pickLocalizedImage(b.etsyLink, lang.value)
  showUpsell('allBooks', {
    bookId: b.bookId,
    kind: bookKind.value,
    title: localization.value?.title ?? b.bookId,
    freePages: freePageCount(bookKind.value, pageAccess.value.units, book.value?.freePages),
    totalPages: pageAccess.value.units,
    shopLink: shop || undefined
  })
}

// `totalPages` for progress excludes the synthetic celebration page — the
// last real content page is the one that "completes" the book.
const totalPagesForProgress = computed(() => {
  const realPages = displayEntries.value.filter((e) => e.kind !== 'celebration' && e.kind !== 'locked').length
  return Math.max(1, realPages)
})

// ----- Image URL caching -----
// Replace any bare https URL with a blob: URL backed by IndexedDB so a page
// that's been cached once renders instantly and works offline.

const blobUrlByOriginal = ref<Record<string, string>>({})
const trackedBlobUrls: string[] = []

async function ensureBlob(url?: string | null) {
  if (!url) return
  if (blobUrlByOriginal.value[url]) return
  if (!/^https?:\/\//i.test(url)) {
    blobUrlByOriginal.value[url] = url
    return
  }
  const out = await cache.getBlobUrl(url, bookId.value)
  blobUrlByOriginal.value[url] = out
  if (out.startsWith('blob:')) trackedBlobUrls.push(out)
}

watch(
  [coverImage, pages],
  async () => {
    await ensureBlob(coverImage.value)
    const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/gi
    for (const p of pages.value) {
      const text = p.text ?? ''
      for (const m of text.matchAll(IMG_RE)) {
        const u = m[1] ?? m[2]
        if (u) await ensureBlob(u)
      }
    }
  },
  { immediate: true }
)

function resolved(url: string): string {
  return blobUrlByOriginal.value[url] ?? url
}

// ----- Render markdown to safe HTML (matches IPhonePreview) -----
// Authoring is admin-only and the renderer escapes every literal `<`, `>`,
// `&` before substituting markdown, so the result is safe for `v-html`.
// Image URLs are routed through `resolved()` so cached https sources flip
// to blob: URLs and the page renders instantly offline.

function renderPageHtml(text: string): string {
  return markdownToHtml(text ?? '', { resolveSrc: resolved, imgClass: 'page-img' })
}

// `<vcenter>…</vcenter>` flips the page body to a flex column so the
// wrapper div can claim the full available height and center its children
// vertically. We add the marker class on the body element rather than
// inside the rendered HTML so the CSS doesn't have to reach across the
// `:deep` boundary to lay out the parent.
function pageBodyClass(text: string): string[] {
  return hasVerticalCenter(text) ? ['page-body', 'has-vcenter'] : ['page-body']
}

// ----- Page navigation + swipe -----
// The "deck" model: the current entry plus, while dragging or animating, the
// adjacent entry in the direction of motion are both rendered. Each slot sits
// at a static x = ±stageWidth offset; a wrapping `.deck` element translates
// horizontally to reveal the neighbour. Mouse/touch drags update the deck
// translation directly (no transition); on release we toggle the animating
// class and let CSS interpolate to either the committed neighbour position or
// back to zero, then atomically swap currentIndex + reset the deck once the
// transitionend fires.

const currentIndex = ref(0)
const dragOffset = ref(0)
const dragStartX = ref<number | null>(null)
const isDragging = ref(false)
const isAnimating = ref(false)
const pendingShift = ref<-1 | 0 | 1>(0)
// Page only starts following the finger after the user has dragged 15% of
// the viewport width — below that the touch is treated as inert (likely
// vertical-scroll jitter from a finger that isn't moving in a perfect
// vertical line). Once activated the page tracks smoothly from the
// activation point, so there's no jump when the threshold is crossed.
const SWIPE_THRESHOLD = 60
const DRAG_ACTIVATION_PCT = 0.15
const dragActivated = ref(false)
const dragActivationOrigin = ref(0)
const EDGE_DAMPENING = 3
const ANIMATION_FALLBACK_MS = 600

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(0)

function measureStage() {
  if (stageRef.value) stageWidth.value = stageRef.value.clientWidth
}

let pendingFallbackTimer: ReturnType<typeof setTimeout> | null = null

interface RenderedSlot {
  entry: DisplayEntry
  index: number
  x: number
}

const renderedSlots = computed<RenderedSlot[]>(() => {
  const slots: RenderedSlot[] = []
  const cur = displayEntries.value[currentIndex.value]
  if (cur) slots.push({ entry: cur, index: currentIndex.value, x: 0 })

  let adjacentDir: -1 | 0 | 1 = 0
  if (isAnimating.value) adjacentDir = pendingShift.value
  else if (dragOffset.value < 0) adjacentDir = 1
  else if (dragOffset.value > 0) adjacentDir = -1

  if (adjacentDir !== 0 && stageWidth.value > 0) {
    const idx = currentIndex.value + adjacentDir
    const entry = displayEntries.value[idx]
    if (entry) slots.push({ entry, index: idx, x: adjacentDir * stageWidth.value })
  }
  return slots
})

function getX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return (e as MouseEvent).clientX
}

function getY(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0]?.clientY ?? 0
  return (e as MouseEvent).clientY
}

// Where the current pointer gesture began — lets the coloring-image click
// handler tell a tap (open the menu) apart from a swipe (change page).
const gestureStart = ref<{ x: number; y: number } | null>(null)

function startSwipe(e: MouseEvent | TouchEvent) {
  if (isAnimating.value) finalizeAnimation()
  measureStage()
  dragStartX.value = getX(e)
  gestureStart.value = { x: getX(e), y: getY(e) }
  isDragging.value = true
  dragActivated.value = false
  dragActivationOrigin.value = 0
}

function duringSwipe(e: MouseEvent | TouchEvent) {
  if (dragStartX.value === null) return
  const rawDelta = getX(e) - dragStartX.value

  // Pre-activation deadzone: ignore horizontal motion until the user has
  // moved past the activation threshold. Inside this band the page sits
  // perfectly still so vertical scroll touches don't wobble the page.
  if (!dragActivated.value) {
    const threshold = stageWidth.value * DRAG_ACTIVATION_PCT
    if (Math.abs(rawDelta) < threshold) {
      // Page stays at center; vertical scrolling on .page-inner can do
      // its thing without competing for the horizontal axis.
      if (dragOffset.value !== 0) dragOffset.value = 0
      return
    }
    // First frame past the threshold: anchor the activation origin to the
    // current rawDelta so the effective offset starts at exactly 0. From
    // here on the page tracks the finger smoothly with no visible jump.
    dragActivated.value = true
    dragActivationOrigin.value = rawDelta
  }

  let effective = rawDelta - dragActivationOrigin.value
  const lastIdx = displayEntries.value.length - 1
  // No neighbour in this direction → rubber-band the drag so the user feels
  // the edge instead of dragging the void in.
  if (effective < 0 && currentIndex.value >= lastIdx) effective = effective / EDGE_DAMPENING
  if (effective > 0 && currentIndex.value <= 0) effective = effective / EDGE_DAMPENING
  dragOffset.value = effective
}

const TAP_MAX_DISTANCE = 10

function endSwipe(e?: Event) {
  if (dragStartX.value === null) return
  const delta = dragOffset.value
  const start = gestureStart.value
  // A tap never activates the drag and barely moves — distinct from a swipe.
  const wasTap = !dragActivated.value && Math.abs(delta) <= TAP_MAX_DISTANCE
  isDragging.value = false
  dragStartX.value = null

  const lastIdx = displayEntries.value.length - 1
  let shift: -1 | 0 | 1 = 0
  if (delta < -SWIPE_THRESHOLD && currentIndex.value < lastIdx) shift = 1
  else if (delta > SWIPE_THRESHOLD && currentIndex.value > 0) shift = -1

  // Tap on a coloring-book page → open the context menu so this page can be
  // sent to the coloring app. Handled here (not via a separate @click) because
  // the synthesized click is swallowed behind the swipe layer. preventDefault
  // suppresses the ghost mouse events a touch emits, which would otherwise
  // close+reopen the freshly opened menu.
  if (wasTap && shift === 0 && isColoring.value && start) {
    const entry = displayEntries.value[currentIndex.value]
    if (entry && entry.kind === 'page') {
      const url = imageOf(entry.page)
      if (url) {
        e?.preventDefault()
        openColoringMenuAt(start.x, start.y, url)
      }
    }
  }

  animateToShift(shift)
  onUserGesture()
}

function animateToShift(shift: -1 | 0 | 1) {
  // No-op when there's nothing to commit and nothing to spring back from —
  // avoids spinning a 600ms fallback timer for every plain pager-dot click.
  if (shift === 0 && dragOffset.value === 0) return
  pendingShift.value = shift
  isAnimating.value = true
  // Target: deck translates so the neighbouring slot lands at viewport x=0.
  // Slot at x = +stageWidth (next) → deck at -stageWidth.
  dragOffset.value = -shift * stageWidth.value
  schedulePendingFallback()
}

function schedulePendingFallback() {
  if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
  // Some browsers swallow transitionend if the tab is hidden mid-animation;
  // a short fallback guarantees we still finalize.
  pendingFallbackTimer = setTimeout(finalizeAnimation, ANIMATION_FALLBACK_MS)
}

function onDeckTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  finalizeAnimation()
}

function finalizeAnimation() {
  if (!isAnimating.value) return
  if (pendingFallbackTimer) {
    clearTimeout(pendingFallbackTimer)
    pendingFallbackTimer = null
  }
  isAnimating.value = false
  if (pendingShift.value !== 0) {
    currentIndex.value += pendingShift.value
    pendingShift.value = 0
  }
  // Reset without animation — Vue batches this with the class change so the
  // deck snaps to 0 in the same render flush as the now-current slot landing
  // at x=0, no visible jump.
  dragOffset.value = 0
}

function commitSlide(direction: -1 | 1) {
  if (isAnimating.value) finalizeAnimation()
  if (direction === 1 && currentIndex.value >= displayEntries.value.length - 1) return
  if (direction === -1 && currentIndex.value <= 0) return
  measureStage()
  animateToShift(direction)
}

function goPrev() {
  commitSlide(-1)
  onUserGesture()
}

function goNext() {
  commitSlide(1)
  onUserGesture()
}

function gotoIndex(i: number) {
  if (i < 0 || i >= displayEntries.value.length) return
  if (i === currentIndex.value) return
  if (isAnimating.value) finalizeAnimation()
  // Single-step jumps animate; further leaps from the dot pager teleport.
  if (Math.abs(i - currentIndex.value) === 1) {
    measureStage()
    animateToShift((i - currentIndex.value) as -1 | 1)
  } else {
    currentIndex.value = i
  }
  onUserGesture()
}

// ----- Swipe hint -----
// Show only on first open per book, hide if the user swipes within 3s.

const HINT_GRACE_MS = 3000
const hintEnabled = ref(false)
let hintGraceTimer: ReturnType<typeof setTimeout> | null = null

function maybeStartHint() {
  if (!book.value) return
  if (hasSeenSwipeHint(bookId.value)) {
    hintEnabled.value = false
    return
  }
  hintEnabled.value = true
  if (hintGraceTimer) clearTimeout(hintGraceTimer)
}

function onUserGesture() {
  if (!hintEnabled.value) return
  // Any genuine swipe before the hint completes its run cancels it.
  hintEnabled.value = false
}

watch(book, (b) => {
  if (b) maybeStartHint()
})

// ----- Reading-progress dwell timer -----
// Only "page" entries count toward progress. Cover and celebration are
// transient. The required dwell is shorter for first/last page so the user
// can sweep through cover-like pages without gaming the signal.

let dwellTimer: ReturnType<typeof setTimeout> | null = null
let dwellEntryIndex = -1

function clearDwell() {
  if (dwellTimer) clearTimeout(dwellTimer)
  dwellTimer = null
  dwellEntryIndex = -1
}

function scheduleDwellForCurrent() {
  clearDwell()
  if (!book.value) return
  const entry = displayEntries.value[currentIndex.value]
  if (!entry || entry.kind !== 'page') return
  const total = totalPagesForProgress.value
  const ms = progress.dwellMsForPage(entry.pageNumber, total)
  dwellEntryIndex = currentIndex.value
  dwellTimer = setTimeout(() => {
    if (dwellEntryIndex !== currentIndex.value) return
    if (document.visibilityState !== 'visible') return
    progress.markPageRead(bookId.value, entry.pageNumber, total)
    progress.setLastPage(bookId.value, entry.pageNumber, total)
  }, ms)
}

watch(currentIndex, () => {
  scheduleDwellForCurrent()
  if (book.value) progress.setLastPage(bookId.value, Math.max(1, currentIndex.value), totalPagesForProgress.value)
})
watch(book, (b) => {
  if (b) scheduleDwellForCurrent()
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') scheduleDwellForCurrent()
  else clearDwell()
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  clearDwell()
  if (hintGraceTimer) clearTimeout(hintGraceTimer)
  for (const u of trackedBlobUrls) cache.releaseBlobUrl(u)
})

// ----- Celebration page -----

const isOnCelebration = computed(() => displayEntries.value[currentIndex.value]?.kind === 'celebration')
const celebrationFiredFor = ref<string | null>(null)

function fireConfetti() {
  // Two short bursts from each side — keeps it festive without overwhelming
  // young readers or burning the GPU on slower devices.
  // Parchment-palette confetti: gold + amber + navy + cream + wine-red
  // + sage so the burst stays on-brand with the rest of the LambKing UI.
  const colors = ['#d4a83e', '#f3d167', '#21406a', '#fdf8ed', '#a93d2e', '#6da045']
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 38,
    origin: { x: 0.15, y: 0.4 },
    colors
  })
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 38,
    origin: { x: 0.85, y: 0.4 },
    colors
  })
}

watch(isOnCelebration, (yes) => {
  if (!yes || !book.value) return
  // Mark the book complete (force totals to current pages so a partial-read
  // user who skips to the end doesn't 100% it just by swiping).
  const total = totalPagesForProgress.value
  for (let p = 1; p <= total - 1; p++) {
    progress.markPageRead(bookId.value, p, total - 1)
  }
  if (celebrationFiredFor.value !== bookId.value) {
    celebrationFiredFor.value = bookId.value
    nextTick(() => fireConfetti())
  }
})

// ----- Achievement badge -----

const achievementBadge = computed<string>(() => {
  const b = book.value
  if (!b?.achievementBadge) return ''
  return b.achievementBadge[lang.value] || b.achievementBadge.de || b.achievementBadge.en || ''
})

watch(achievementBadge, async (u) => {
  if (u) await ensureBlob(u)
})

// ----- Coloring attachment (finish-page CTA) -----
// Surface the book's first coloring sheet on the celebration page so a reader
// who just finished the story can jump straight into the coloring app — same
// deep-link the BookDetail attachments row uses.
const firstColoringAttachment = computed(() => {
  const raw = book.value?.attachments
  if (!Array.isArray(raw)) return null
  return raw.find((a) => a && typeof a === 'object' && a.type === 'coloring' && a.data) ?? null
})

function openColoring() {
  const att = firstColoringAttachment.value
  if (!att?.data) return
  const isPdf = /\.pdf(?:\?.*)?$/i.test(att.data)
  router.push({
    name: 'app-coloring',
    query: { source: att.data, type: isPdf ? 'pdf' : 'image' }
  })
}

// ----- Tap an image in a coloring book -----
// Opens the same context menu the BookDetail attachments use, letting the
// reader drop the tapped page straight into the coloring app while paging
// through the whole coloring book.
const colorMenuAnchor = ref<{ rect: DOMRect } | null>(null)
const colorMenuImageUrl = ref<string>('')

// Build a zero-size anchor rect at the tap point. We avoid `new DOMRect()`
// because its constructor isn't reliably present in every WebView the app
// ships into; the context menu only reads top/bottom/left/width/height.
function pointRect(x: number, y: number): DOMRect {
  return {
    x, y, top: y, bottom: y, left: x, right: x, width: 0, height: 0,
    toJSON() {
      return {}
    }
  } as unknown as DOMRect
}

function openColoringMenuAt(x: number, y: number, url: string) {
  if (!url) return
  colorMenuImageUrl.value = url
  colorMenuAnchor.value = { rect: pointRect(x, y) }
}

function closeColoringMenu() {
  colorMenuAnchor.value = null
  colorMenuImageUrl.value = ''
}

function coloringImageDownloadName(url: string): string {
  try {
    const u = new URL(url, window.location.origin)
    const last = u.pathname.split('/').filter(Boolean).pop()
    if (last) return last
  } catch {
  }
  return `${(localization.value?.title || 'ausmalbild').replace(/\s+/g, '-')}.png`
}

function saveColoringImageToPhone() {
  const url = colorMenuImageUrl.value
  if (!url) {
    closeColoringMenu()
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = coloringImageDownloadName(url)
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
  closeColoringMenu()
}

function openTappedImageInColoring() {
  const url = colorMenuImageUrl.value
  if (!url) {
    closeColoringMenu()
    return
  }
  openPageInColoring(url)
  closeColoringMenu()
}

/** A page of a coloring book opens in the editor as a page of that book (paint is kept per page, pages can be turned). */
function openPageInColoring(url: string) {
  const b = book.value
  const idx = b && isColoring.value ? coloringPagesOfBook(b, lang.value).findIndex((p) => p.url === url) : -1
  if (b && idx >= 0) {
    router.push({ name: 'app-coloring', query: { book: b.bookId, p: String(idx + 1) } })
    return
  }
  const isPdf = /\.pdf(?:\?.*)?$/i.test(url)
  router.push({ name: 'app-coloring', query: { source: url, type: isPdf ? 'pdf' : 'image' } })
}

/** The picture of the page on show, when this is a coloring book (drives the "Ausmalen" button). */
const currentColoringUrl = computed(() => {
  if (!isColoring.value) return ''
  const entry = displayEntries.value[currentIndex.value]
  return entry && entry.kind === 'page' ? imageOf(entry.page) : ''
})

// ----- Next volume in series -----

const nextBook = computed(() => (book.value ? apiBooks.nextBookInSeries(book.value) : null))
const nextBookCoverUrl = computed(() => {
  const b = nextBook.value
  if (!b) return ''
  return pickLocalizedImage(b.previewImage, lang.value)
})

watch(nextBookCoverUrl, async (u) => {
  if (u) await ensureBlob(u)
})

function openNextBook() {
  const b = nextBook.value
  if (!b) return
  router.replace({ name: 'app-reader', params: { bookId: b.bookId } })
}

// Page text uses fixed sizes (body 16px, headers + chapter caption 20px).
// The previous auto-fitter shrank type to fit the viewport; long admin-
// authored pages got unreadably small. Content pages scroll vertically
// instead.

function onWindowResize() {
  measureStage()
}

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
  measureStage()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
})

// ----- Counter / dots -----

const currentEntry = computed(() => displayEntries.value[currentIndex.value] ?? null)
const isEndPage = computed(() => currentEntry.value?.kind === 'celebration')
const realPageCount = computed(() => displayEntries.value.filter((e) => e.kind === 'page').length)
const counterText = computed(() => {
  const entry = currentEntry.value
  if (!entry) return ''
  if (entry.kind === 'page') return `${entry.pageNumber} / ${realPageCount.value}`
  if (entry.kind === 'cover') return t('app.reader.cover')
  return t('app.reader.finished')
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-book', params: { bookId: bookId.value } })
}

// Replace (not push) so the finished book does not sit in the back stack.
function goToBookDetail() {
  router.replace({ name: 'app-book', params: { bookId: bookId.value } })
}
</script>

<template lang="pug">
  div(class="reader-root")
    button(
      type="button"
      class="back-btn"
      :aria-label="t('app.reader.back') || 'Zurück'"
      @click="goBack"
    )
      ZIconography(name="chevron-left" :size="20")
      span {{ t('app.read.back') }}

    div(
      ref="stageRef"
      class="stage"
      :class="{ swiping: isDragging }"
      @mousedown="startSwipe"
      @mousemove="duringSwipe"
      @mouseup="endSwipe"
      @mouseleave="endSwipe"
      @touchstart.passive="startSwipe"
      @touchmove.passive="duringSwipe"
      @touchend="endSwipe"
    )
      template(v-if="loading")
        div(class="loading-state")
          div(class="spinner" aria-hidden="true")
          span {{ t('app.reader.loading') || 'Lade …' }}

      template(v-else-if="loadError || !book")
        div(class="loading-state")
          span {{ t('app.reader.notFound') || 'Geschichte nicht gefunden.' }}

      template(v-else)
        //- The deck moves all rendered slots together. Per-slot `x` keeps
        //- adjacent pages parked just off-stage so they slide in cleanly when
        //- the deck translates; the `animating` class enables CSS interp on
        //- the deck transform after the user releases.
        div(
          class="deck"
          :class="{ animating: isAnimating }"
          :style="{ transform: `translate3d(${dragOffset}px, 0, 0)` }"
          @transitionend="onDeckTransitionEnd"
        )
          div(
            v-for="slot in renderedSlots"
            :key="`slot-${slot.index}-${slot.entry.kind}`"
            class="slot"
            :style="{ transform: `translate3d(${slot.x}px, 0, 0)` }"
          )
            //- Cover
            div(
              v-if="slot.entry.kind === 'cover'"
              class="page-frame cover-frame"
            )
              img(
                :src="resolved(slot.entry.image) || PLACEHOLDER_IMAGE"
                :alt="t(localization?.title || '')"
                class="cover-img"
                draggable="false"
                @dragstart.prevent
                @error="onImgFallback"
              )

            //- Content page
            div(
              v-else-if="slot.entry.kind === 'page'"
              class="page-frame"
              :class="isColoring ? ['coloring-frame', { 'has-caption': hasCaption(slot.entry.page) }] : 'content-frame'"
            )
              //- Coloring book: one full-bleed image per page. Tapping it
              //- opens the context menu to drop it into the coloring app.
              img(
                v-if="isColoring && imageOf(slot.entry.page)"
                :src="resolved(imageOf(slot.entry.page)) || PLACEHOLDER_IMAGE"
                :alt="slot.entry.page.title || ''"
                class="coloring-page-img"
                draggable="false"
                @dragstart.prevent
                @error="onImgFallback"
              )
              //- the words that belong to the picture
              div(v-if="isColoring && imageOf(slot.entry.page) && hasCaption(slot.entry.page)" class="coloring-caption")
                h2(v-if="captionOf(slot.entry.page).title" class="coloring-caption-title") {{ captionOf(slot.entry.page).title }}
                p(v-if="captionOf(slot.entry.page).reference" class="coloring-caption-ref") {{ captionOf(slot.entry.page).reference }}
                p(v-if="captionOf(slot.entry.page).text" class="coloring-caption-text") {{ captionOf(slot.entry.page).text }}
              div(v-else class="page-inner")
                h1(
                  v-if="slot.entry.page.title && slot.entry.page.title.trim()"
                  class="page-title"
                  v-html="renderInline(slot.entry.page.title)"
                )
                div(
                  :class="pageBodyClass(slot.entry.page.text)"
                  v-html="renderPageHtml(slot.entry.page.text)"
                )

            //- The rest of the book is locked: a friendly page says where to get it
            div(
              v-else-if="slot.entry.kind === 'locked'"
              class="page-frame locked-frame"
            )
              div(class="locked-inner")
                h3(class="locked-title") {{ t(`app.premium.bookTitle_${bookKind}`) }}
                p(class="locked-text") {{ t(`app.premium.bookText_${bookKind}`, { title: localization?.title ?? '', free: freePageCount(bookKind, pageAccess.units, book?.freePages), total: pageAccess.units }) }}
                ZButton(type="primary" @click="openUpsell") {{ t('app.reader.unlockBook') }}

            //- Celebration
            div(
              v-else-if="slot.entry.kind === 'celebration'"
              class="page-frame celebration-frame"
            )
              div(class="celebration-inner")
                LkCompanion(class="celebration-lamb" pose="winken" :size="96")
                AchievementBadge(
                  v-if="achievementBadge"
                  :src="resolved(achievementBadge)"
                )
                div(v-else class="celebration-burst" aria-hidden="true") 🎉
                h3(class="celebration-title") {{ t('app.reader.congratsTitle') }}

                //- Open the book's first coloring sheet in the coloring app
                //- (only when the book ships at least one coloring attachment).
                ZButton(
                  v-if="firstColoringAttachment"
                  type="secondary"
                  class="coloring-cta"
                  @click="openColoring"
                ) {{ t('app.reader.openColoring') }}

                div(
                  v-if="nextBook"
                  class="next-volume"
                )
                  div(class="next-label") {{ t('app.reader.nextStoryWaiting') }}
                  ABookCard(
                    :title="nextBook.localizations?.[lang]?.title || nextBook.localizations?.de?.title || ''"
                    subtitle=""
                    :image="resolved(nextBookCoverUrl)"
                    :cover-gradient="nextBook.cover"
                    badge="NEU"
                    @click="openNextBook"
                  )

      //- Swipe hint (only when book loaded; SwipeHintHand handles its own
      //- visible/active flow based on `enabled`).
      SwipeHintHand(
        v-if="book"
        :book-id="bookId"
        :enabled="hintEnabled"
      )

      //- Page dots — clickable for fast jumping.
      div(
        v-if="book && displayEntries.length > 1"
        class="pager"
        aria-label="Seiten"
      )
        button(
          v-for="(entry, i) in displayEntries"
          :key="`dot-${i}-${entry.kind}`"
          type="button"
          class="pager-dot"
          :class="{ active: i === currentIndex, 'is-cover': entry.kind === 'cover', 'is-end': entry.kind === 'celebration' }"
          :aria-label="`Seite ${i + 1}`"
          @click="gotoIndex(i)"
        )

      //- Bottom-right counter. On the closing page it becomes the "done"
      //- button that returns to the book detail page.
      button(
        v-if="book && isEndPage"
        type="button"
        class="page-counter is-action"
        @click="goToBookDetail"
      ) {{ counterText }}
      div(
        v-else-if="book"
        class="page-counter"
        aria-live="polite"
      ) {{ counterText }}

    //- Coloring book: one clear way into the editor for the page on show.
    button(
      v-if="currentColoringUrl"
      type="button"
      class="color-this"
      @click="openPageInColoring(currentColoringUrl)"
    ) {{ t('app.reader.paintThis') }}

    //- Context menu for a tapped coloring-book image (Teleports to body).
    AttachmentContextMenu(
      :anchor="colorMenuAnchor"
      :show-coloring-option="true"
      @close="closeColoringMenu"
      @save-to-phone="saveColoringImageToPhone"
      @use-in-coloring="openTappedImageInColoring"
    )
</template>

<style scoped lang="sass">
.locked-frame
  display: flex
  align-items: center
  justify-content: center
  padding: 24px

.locked-inner
  max-width: 420px
  margin: auto
  text-align: center

.locked-title
  margin: 0 0 12px
  font-size: 1.4rem
  font-weight: 800
  color: var(--lk-text)

.locked-text
  margin: 0 0 22px
  font-size: 1rem
  line-height: 1.55
  color: var(--lk-text)

.color-this
  position: fixed
  left: 50%
  bottom: max(env(safe-area-inset-bottom, 0px), 14px)
  transform: translateX(-50%)
  z-index: 30
  min-height: 46px
  padding: 0 26px
  white-space: nowrap
  border: 0
  border-radius: 999px
  background: #1f3a5f
  color: #ffffff
  font: inherit
  font-size: 0.95rem
  font-weight: 800
  box-shadow: 0 8px 20px -8px rgba(10, 26, 48, 0.6)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateX(-50%) scale(0.97)

.reader-root
  position: fixed
  inset: 0
  // Parchment radial mirroring the rest of the app's body background so
  // the reader feels like a continuous surface rather than its own theme.
  background: var(--lk-bg)
  color: var(--lk-text)
  overflow: hidden
  user-select: none
  z-index: 50
  padding-top: env(safe-area-inset-top)

// Cream parchment back arrow — matches the BookDetail back button so the
// reader feels like a natural continuation of the same surface.
.back-btn
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 14px)
  left: 14px
  z-index: 30
  height: 48px
  padding: 0 18px 0 10px
  gap: 4px
  display: inline-flex
  align-items: center
  justify-content: center
  border-radius: 28px
  background-color: var(--lk-surface)
  color: var(--lk-text)
  font-family: inherit
  font-size: 1rem
  font-weight: 600
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

  :deep(.z-icon-outline)
    color: currentColor

.stage
  position: absolute
  inset: 0
  overflow: hidden
  cursor: grab
  touch-action: pan-y

  &.swiping
    cursor: grabbing


.deck
  position: absolute
  inset: 0
  will-change: transform

  &.animating
    transition: transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)

.slot
  position: absolute
  inset: 0
  will-change: transform

.page-frame
  position: absolute
  inset: 0
  display: flex
  flex-direction: column

.cover-frame
  // Match the content-page surface so the unfilled top/bottom around the
  // cover image blend into the rest of the book.
  background: var(--lk-paper)
  // Center the image vertically; horizontal centering inherited from the
  // page-frame's flex column.
  align-items: center
  justify-content: center

.cover-img
  // Fit the full width of the viewport, height follows from the source's
  // natural aspect ratio so the artwork is never stretched. Rounded
  // corners + the cream container background give the image a "card on
  // page" look that matches the content-frame surface.
  width: 100%
  height: auto
  max-height: 100%
  object-fit: contain
  border-radius: 18px
  display: block
  pointer-events: none
  -webkit-user-drag: none

.content-frame
  background: var(--lk-paper)
  // Top reserves the back-button (44px) + 14px top offset + 14px gap.
  // Bottom reserves pager dots + page-counter + their bottom offset + gap.
  padding-top: calc(env(safe-area-inset-top, 0px) + 72px)
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 60px)
  padding-left: 16px
  padding-right: 16px
  display: flex
  align-items: stretch
  justify-content: center

// Coloring-book page: the single image fills the whole viewport with no
// padding. `object-fit: contain` keeps the artwork from stretching, so it
// spans full width or full height (whichever the aspect ratio allows). The
// floating back button / pager / counter overlay on top.
.coloring-frame
  background: var(--lk-paper)
  padding: 0
  align-items: center
  justify-content: center

// a page with words: the picture above, the words below it, both clear of the buttons at the top and the bottom
.coloring-frame.has-caption
  flex-direction: column
  padding: calc(env(safe-area-inset-top, 0px) + 56px) 16px calc(env(safe-area-inset-bottom, 0px) + 150px)
  gap: 10px

  .coloring-page-img
    flex: 1 1 0
    width: 100%
    height: auto

.coloring-caption
  flex: 0 0 auto
  width: 100%
  max-width: 560px
  max-height: 34%
  overflow-y: auto
  text-align: center
  color: var(--lk-paper-text)

.coloring-caption-title
  margin: 0 0 2px
  font-size: 1.15rem
  font-weight: 800

.coloring-caption-ref
  margin: 0 0 6px
  font-size: 0.82rem
  font-weight: 700
  color: #7a6b55

.coloring-caption-text
  margin: 0
  font-size: 1.05rem
  line-height: 1.5
  white-space: pre-line

.coloring-page-img
  width: 100%
  height: 100%
  min-height: 0
  object-fit: contain
  display: block
  cursor: pointer
  -webkit-user-drag: none
  -webkit-tap-highlight-color: transparent

.page-inner
  width: 100%
  max-width: 720px
  height: 100%
  // Fixed sizing: body text 18px, headings + chapter caption 20px. Pages
  // scroll vertically when the admin's content overflows — overflow-y is
  // on this container so the scrollbar lives inside the page chrome and
  // doesn't fight the reader's swipe gesture (which lives on the deck
  // wrapper above this element).
  overflow-y: auto
  -webkit-overflow-scrolling: touch
  display: flex
  flex-direction: column
  gap: 12px
  font-size: 18px
  line-height: 1.5

.page-title
  font-size: 20px
  font-weight: 700
  line-height: 1.18
  color: var(--lk-text)
  margin: 0

.page-body
  font-size: 20px
  line-height: 1.5
  color: var(--lk-text)
  font-weight: 400
  letter-spacing: 0.005em
  flex: 1 1 auto
  min-height: 0

.page-body :deep(p)
  margin: 0 0 0.55em

.page-body :deep(p:last-child)
  margin-bottom: 0


.page-body :deep(strong)
  font-weight: 700
  color: #0e2440

.page-body :deep(em)
  font-style: italic

.page-body :deep(h1),
.page-body :deep(h2),
.page-body :deep(h3)
  font-size: 20px
  font-weight: 700
  color: var(--lk-text)
  line-height: 1.2
  margin: 0.4em 0 0.2em

// Centered text wrapper produced by the admin UI's `<center>…</center>`
// markup. Display block + width 100% so a span placed inside a paragraph
// (or wrapping a title) behaves like a centered block. Applied to anything
// tagged `.rt-center` (post-processed in markdownToHtml + renderInline).
.page-body :deep(.rt-center),
.page-title :deep(.rt-center)
  display: block
  width: 100%
  text-align: center

// Per-selection font-size override produced by the admin UI's `<fs size="N">`
// markup. The inline style attribute carries the actual pixel value (the
// renderer sanitises `N` to an integer before emitting it). `line-height`
// inherits so a 40px line still gets generous breathing room.
.page-body :deep(.rt-fs),
.page-title :deep(.rt-fs)
  line-height: 1.2

// Vertical-center wrapper produced by the admin UI's `<vcenter>…</vcenter>`
// markup. The page body switches into flex-column mode (only when the
// `has-vcenter` marker class is present, so non-vcentered pages keep their
// default block flow) and the wrapper claims the full remaining height.
.page-body.has-vcenter
  display: flex
  flex-direction: column

.page-body :deep(.rt-vcenter)
  flex: 1 1 auto
  display: flex
  flex-direction: column
  justify-content: center
  align-items: stretch
  min-height: 0
// The flex children inside vcenter (`<p>`, `<h1>`, etc.) keep their
// natural margins so paragraph rhythm survives.

.page-body :deep(ul),
.page-body :deep(ol)
  margin: 0.4em 0 0.55em
  padding-left: 1.5em

.page-body :deep(ul)
  list-style: disc

.page-body :deep(ol)
  list-style: decimal

.page-body :deep(li)
  margin: 0.2em 0

.page-body :deep(img),
.page-body :deep(.page-img)
  display: block
  width: 100%
  max-width: 100%
  // Cap inline-image height so a 1:1 image on a tall narrow viewport leaves
  // room for the surrounding text. The fitter still measures overflow and
  // shrinks the type as needed.
  max-height: 45%
  object-fit: cover
  border-radius: 18px
  margin: 0.5em auto
  background: #f1ece2

.celebration-frame
  background: radial-gradient(circle at 50% 30%, #fff5d8 0%, #fce8c8 60%, #f7d49a 100%)
  display: flex
  flex-direction: column
  align-items: center
  // Scroll vertically when the badge + coloring CTA + next-volume card
  // overflow the viewport (small / landscape screens). Centering is handled
  // by `margin: auto` on `.celebration-inner` instead of `justify-content`
  // so the top is never clipped when the content is taller than the frame —
  // the standard flexbox-overflow-centering fix.
  overflow-y: auto
  -webkit-overflow-scrolling: touch
  // p-5 on mobile, p-6 on tablets+ — only the vertical axis was oversized
  // (90px / 100px). Side gutters stay at 22px so the badge + next-volume
  // card keep their breathing room.
  padding: 1.25rem 22px

@media (min-width: 768px)
  .celebration-frame
    padding: 1.5rem 22px

.celebration-inner
  width: 100%
  max-width: 520px
  // Auto top/bottom margins center the block vertically when it fits and
  // collapse to 0 when it overflows, keeping the whole card scrollable.
  // `flex-shrink: 0` stops the frame from squishing the content instead of
  // letting it overflow into the scroll area.
  margin: auto 0
  flex-shrink: 0
  text-align: center
  display: flex
  flex-direction: column
  align-items: center
  gap: 18px

.celebration-burst
  font-size: 72px
  line-height: 1
  filter: drop-shadow(0 8px 14px rgba(212, 168, 62, 0.4))


// Achievement badge presentation lives in `AchievementBadge.vue` — keeping
// only the celebration-page emoji-fallback styles here.

.celebration-lamb
  margin: 0 auto -10px

.celebration-title
  font-size: 32px
  font-weight: 700
  color: var(--lk-text)

.celebration-sub
  font-size: 17px
  color: #4a3b1c
  font-weight: 700

// Coloring-sheet CTA on the finish page — shrink to its content (and recenter
// via the inner's align-items) instead of stretching the full 520px column.
.coloring-cta
  width: auto

  :deep(.z-button)
    width: auto
    min-width: 0

.next-volume
  margin-top: 22px
  width: 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px

.next-label
  font-size: 16px
  font-weight: 700
  color: #5a3b14

.pager
  position: absolute
  bottom: calc(env(safe-area-inset-bottom, 0px) + 18px)
  left: 0
  right: 0
  display: flex
  justify-content: center
  gap: 7px
  z-index: 14
  pointer-events: auto
  padding: 0 60px

.pager-dot
  width: 8px
  height: 8px
  border-radius: 999px
  background: rgba(0, 0, 0, 0.25)
  border: none
  padding: 0
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: width 160ms ease-out, background-color 160ms ease-out

  &.is-cover
    background: rgba(0, 0, 0, 0.35)

  &.is-end
    background: rgba(212, 168, 62, 0.65)

  &.active
    background: #21406a
    width: 18px

.page-counter
  position: absolute
  bottom: calc(env(safe-area-inset-bottom, 0px) + 14px)
  right: 14px
  z-index: 14
  padding: 6px 14px
  border-radius: 999px
  font-size: 14px
  font-weight: 700
  letter-spacing: 0.02em
  color: var(--lk-text)
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  pointer-events: none
  font-variant-numeric: tabular-nums

  &.is-action
    pointer-events: auto
    cursor: pointer
    border: none
    padding: 8px 16px
    font-family: inherit
    transition: transform 0.15s ease, background 0.15s ease

    &:hover
      background: var(--lk-surface-2)

    &:active
      transform: scale(0.95)

.loading-state
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  font-size: 15px
  font-weight: 700
  color: #5a3b14

.spinner
  width: 40px
  height: 40px
  border-radius: 999px
  border: 4px solid rgba(33, 64, 106, 0.18)
  border-top-color: #21406a
  animation: spin 900ms linear infinite

@keyframes spin
  to
    transform: rotate(360deg)
</style>
