<template>
  <div class="iphone">
    <div class="notch" />
    <div
      ref="screen"
      class="screen"
      :class="{ swiping: dragStartX !== null }"
      @mousedown="startSwipe"
      @mousemove="duringSwipe"
      @mouseup="endSwipe"
      @mouseleave="endSwipe"
      @touchstart="startSwipe"
      @touchmove="duringSwipe"
      @touchend="endSwipe"
    >
      <div
        v-if="currentDisplay?.kind === 'cover'"
        class="cover-page"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <img
          :src="currentDisplay.image"
          class="cover-full"
          alt=""
          draggable="false"
          @dragstart.prevent
        />
      </div>
      <div
        v-else-if="currentDisplay?.kind === 'celebration'"
        class="celebration"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <AchievementBadge
          v-if="achievementBadge"
          :src="achievementBadge"
          max-size="220px"
        />
        <div v-else class="celebration-burst" aria-hidden="true">🎉</div>
        <h3 class="celebration-title">Geschafft!</h3>
        <p class="celebration-sub">Tolle Geschichte gelesen.</p>

        <div class="next-volume">
          <p class="next-label">Nächste Geschichte</p>
          <div class="next-card">
            <div class="next-card-cover">
              <div class="next-card-cover-bg" />
              <span class="next-card-badge">NEU</span>
            </div>
            <div class="next-card-body">
              <h4 class="next-card-title">Beispieltitel</h4>
              <p class="next-card-subtitle">Anton Bernt</p>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="coloring && currentDisplay?.kind === 'page'"
        class="coloring-page"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <img
          v-if="coloringImage"
          :src="coloringImage"
          class="coloring-full"
          alt=""
          draggable="false"
          @dragstart.prevent
        />
      </div>
      <div
        v-else
        class="page"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <h3 v-if="renderedTitle" class="page-title" v-html="renderedTitle" />
        <div :class="pageBodyClass" v-html="renderedText" />
      </div>

      <div class="pager">
        <button
          v-for="(entry, i) in displayPages"
          :key="entry.kind === 'cover' ? 'cover' : entry.kind === 'celebration' ? 'end' : `p-${entry.page.page}`"
          :class="{ active: i === currentPageIndex, 'is-cover': entry.kind === 'cover', 'is-end': entry.kind === 'celebration' }"
          @click="currentPageIndex = i"
          aria-label="Seite"
        />
      </div>

      <div v-if="displayPages.length > 0" class="page-counter" aria-live="polite">
        {{ currentPageIndex + 1 }} / {{ displayPages.length }}
      </div>
    </div>
    <div class="home-indicator" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BookPage } from '@/types'
import { hasVerticalCenter, markdownToHtml, renderInline } from '@/utils/markdownToHtml'
import AchievementBadge from '@/components/atoms/AchievementBadge.vue'

const props = defineProps<{
  pages: BookPage[]
  coverImage?: string
  achievementBadge?: string
  // Coloring books (Ausmalbücher): every content page is a single image that
  // fills the whole screen — no padding, no title/body text.
  coloring?: boolean
}>()
const currentPageIndex = ref(0)
const offset = ref(0)
const dragStartX = ref<number | null>(null)

type DisplayEntry =
  | { kind: 'cover'; image: string }
  | { kind: 'page'; page: BookPage }
  | { kind: 'celebration' }

const displayPages = computed<DisplayEntry[]>(() => {
  const list: DisplayEntry[] = []
  if (props.coverImage) list.push({ kind: 'cover', image: props.coverImage })
  for (const p of props.pages) list.push({ kind: 'page', page: p })
  if (props.pages.length > 0) list.push({ kind: 'celebration' })
  return list
})

const currentDisplay = computed(() => displayPages.value[currentPageIndex.value])

/**
 * Turn the page's stored markdown into safe display HTML:
 *   ![alt](url)  → <img class="page-img" src="url" alt="alt"/>
 *   blank line   → paragraph break
 *   \n           → <br/>
 * Only the image and line-break syntaxes are interpreted; anything else is
 * escaped, since the authoring surface is trusted but we don't want stray
 * HTML in stored markdown to break the iPhone preview layout.
 */
const renderedText = computed(() => {
  const current = currentDisplay.value
  if (!current || current.kind !== 'page') return ''
  return markdownToHtml(current.page.text ?? '', { imgClass: 'page-img' })
})

// Page title rendered through the inline-safe path so `<center>…</center>`
// the admin wraps around the title is parsed instead of escaped to literal
// `&lt;center&gt;` text. Returns empty string when there's no title or no
// page — the consumer's `v-if` then skips the `<h3>` entirely so a
// titleless page (`##` + Enter, or no pages at all) renders as a clean
// blank surface instead of "Keine Seiten" placeholder text.
const renderedTitle = computed(() => {
  const current = currentDisplay.value
  if (!current || current.kind !== 'page') return ''
  return renderInline(current.page.title)
})

// First image URL on the current page — used only in coloring mode, where a
// page is rendered as a single full-bleed image. Matches both markdown
// `![alt](url)` and raw `<img src="…">` forms.
const COLORING_IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/i
const coloringImage = computed(() => {
  const current = currentDisplay.value
  if (!current || current.kind !== 'page') return ''
  // a page in the new form has its picture in its own field
  if (current.page.image) return current.page.image
  const m = COLORING_IMG_RE.exec(current.page.text ?? '')
  return m ? (m[1] ?? m[2] ?? '') : ''
})

// Mirrors the AppReaderView marker class — when the page contains a
// `<vcenter>` wrapper we flip the page body to flex-column so the wrapper
// can claim the full available height for vertical centering.
const pageBodyClass = computed(() => {
  const current = currentDisplay.value
  if (!current || current.kind !== 'page') return ['page-body']
  return hasVerticalCenter(current.page.text) ? ['page-body', 'has-vcenter'] : ['page-body']
})

const getX = (e: MouseEvent | TouchEvent): number => {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return (e as MouseEvent).clientX
}

const startSwipe = (e: MouseEvent | TouchEvent) => {
  dragStartX.value = getX(e)
}
const duringSwipe = (e: MouseEvent | TouchEvent) => {
  if (dragStartX.value === null) return
  offset.value = getX(e) - dragStartX.value
}
const endSwipe = () => {
  if (dragStartX.value === null) return
  const delta = offset.value
  const threshold = 60
  if (delta < -threshold && currentPageIndex.value < displayPages.value.length - 1) currentPageIndex.value += 1
  else if (delta > threshold && currentPageIndex.value > 0) currentPageIndex.value -= 1
  offset.value = 0
  dragStartX.value = null
}
</script>

<style scoped>
.iphone {
  width: 320px;
  height: 680px;
  border-radius: 44px;
  padding: 10px;
  background: linear-gradient(160deg, #1f2933 0%, #3b4a5a 100%);
  box-shadow: 0 40px 80px -28px rgba(30, 60, 100, 0.55),
  0 16px 40px -20px rgba(30, 60, 100, 0.35),
  inset 0 0 0 2px rgba(255, 255, 255, 0.12);
  position: relative;
}

.notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 26px;
  background: #0f1419;
  border-radius: 14px;
  z-index: 5;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 34px;
  background: linear-gradient(180deg, #fffaf3 0%, #fce8c8 100%);
  overflow: hidden;
  user-select: none;
  padding: 56px 20px 36px;
  cursor: grab;
}

.screen.swiping {
  cursor: grabbing;
}

/* Mirror the AppReaderView cover-frame: cream surface, image fits via
 * `contain` so the artwork keeps its aspect ratio (matches what the user
 * sees on a real device — the BookReader does NOT crop with object-fit:
 * cover and does NOT use a black backdrop). */
.cover-page {
  position: absolute;
  inset: 0;
  transition: transform 120ms ease-out;
  background: #fffdf7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.cover-full {
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  border-radius: 18px;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* Coloring-book page: the image fills the whole screen with no padding,
 * contained (never stretched) so its aspect ratio is preserved. Mirrors the
 * BookReader's coloring-frame. */
.coloring-page {
  position: absolute;
  inset: 0;
  transition: transform 120ms ease-out;
  background: #fffdf7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.coloring-full {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.page {
  position: relative;
  height: calc(100% - 40px);
  transition: transform 120ms ease-out;
  overflow-y: auto;
  /* Flex column so the page-body can grow to fill the remaining height once
   * the title has taken what it needs — required for `<vcenter>` content to
   * have a real vertical extent to center against. Non-vcenter content
   * still stacks naturally because its children have no flex-grow. */
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #2a2a2a;
}

.page-body {
  font-size: 13px;
  line-height: 1.35;
  color: #333;
  flex: 1 1 auto;
  min-height: 0;
}

/* Switches into flex column when the page wraps content in `<vcenter>` —
 * gives the inner `.rt-vcenter` div a flexbox parent to claim the full
 * height with `flex: 1 1 auto`. */
.page-body.has-vcenter {
  display: flex;
  flex-direction: column;
}

.page-body :deep(.rt-vcenter) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  min-height: 0;
}

/* Per-selection font-size override produced by the admin UI's
 * `<fs size="N">` markup. The pixel value lives in the inline style attr
 * (sanitised by the renderer to an integer 1–999); this rule just resets
 * the line-height so a 40px line still gets generous breathing room. */
.page-body :deep(.rt-fs),
.page-title :deep(.rt-fs) {
  line-height: 1.2;
}

.page-body :deep(p) {
  margin: 0.4em 0 0;
}

.page-body :deep(p:first-child) {
  margin-top: 0;
}

.page-body :deep(strong) {
  font-weight: 700;
  color: #1a1a1a;
}

.page-body :deep(em) {
  font-style: italic;
}

.page-body :deep(h1),
.page-body :deep(h2),
.page-body :deep(h3) {
  font-weight: 700;
  color: #1a1a1a;
  margin: 0.5em 0 0.25em;
  line-height: 1.2;
}

.page-body :deep(h1) {
  font-size: 1.4em;
}

.page-body :deep(h2) {
  font-size: 1.2em;
}

.page-body :deep(h3) {
  font-size: 1.05em;
}

.page-body :deep(ul),
.page-body :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.4em;
}

.page-body :deep(ul) {
  list-style: disc;
}

.page-body :deep(ol) {
  list-style: decimal;
}

.page-body :deep(li) {
  margin: 0.15em 0;
}

/* Admin-authored `<center>…</center>` lands as a span with this class via
 * markdownToHtml's post-process. Block + 100% width gives a paragraph-wide
 * horizontal centering effect from inside a `<p>` (or wrapping a title). */
.page-body :deep(.rt-center),
.page-title :deep(.rt-center) {
  display: block;
  width: 100%;
  text-align: center;
}

.page-body :deep(img),
.page-body :deep(.page-img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 45%;
  object-fit: cover;
  border-radius: 14px;
  margin: 0.5em auto;
  background: #f1f1f1;
  /* Belt-and-braces protection alongside `draggable="false"` on the
   * rendered tag: without these the browser starts an HTML5 image drag on
   * mousedown, which steals the horizontal drag the swipe handlers above
   * are listening for. `pointer-events: none` makes mouse/touch events
   * pass straight through to the surrounding swipe surface. */
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.celebration {
  position: relative;
  height: calc(100% - 40px);
  transition: transform 120ms ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  overflow-y: auto;
}

.celebration-burst {
  font-size: 64px;
  line-height: 1;
  margin-top: 8px;
  filter: drop-shadow(0 8px 14px rgba(255, 150, 60, 0.35));
}

.celebration-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 4px 0 0;
}

.celebration-sub {
  font-size: 12px;
  color: #5a4a26;
  font-weight: 700;
  margin: 0;
}

.next-volume {
  width: 100%;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.next-label {
  font-size: 12px;
  font-weight: 700;
  color: #5a3b14;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
}

.next-card {
  width: 100%;
  max-width: 200px;
  background: linear-gradient(180deg, #ffffff 0%, #fdf7ef 100%);
  border-radius: 16px;
  box-shadow: 0 4px 10px -4px rgba(30, 30, 60, 0.15),
  0 14px 28px -14px rgba(30, 30, 60, 0.3);
  overflow: hidden;
}

.next-card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

.next-card-cover-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(0, 0, 0, 0.12) 100%),
  linear-gradient(135deg, #9560f4 0%, #7e3af2 100%);
}

.next-card-cover-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.55) 1.2px, transparent 1.4px);
  background-size: 14px 14px;
  opacity: 0.45;
  mix-blend-mode: screen;
}

.next-card-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(135deg, #ff7a59 0%, #ff4d8d 100%);
  border-radius: 999px;
  box-shadow: 0 3px 8px -2px rgba(255, 80, 140, 0.4);
}

.next-card-body {
  padding: 10px 12px 12px;
  text-align: left;
}

.next-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.25;
}

.next-card-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  font-weight: 700;
  color: #6b5a3e;
}

.pager {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 4;
}

.pager button {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  padding: 0;
}

.pager button.active {
  background: #2980b9;
  width: 14px;
}

.page-counter {
  position: absolute;
  bottom: 12px;
  right: 16px;
  z-index: 4;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: rgba(30, 50, 70, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 10px -4px rgba(20, 40, 60, 0.35);
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}

.home-indicator {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
}
</style>
