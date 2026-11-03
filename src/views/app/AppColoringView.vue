<script setup lang="ts">
/**
 *
 * Two stacked canvases:
 *   - `bgCanvas`: the source artwork (image or rendered PDF page).
 *   - `drawCanvas`: the user's painted layer; flood-fill writes here too.
 *
 * The flood-fill operates on the *merged* view (bg + draw). For real
 * coloring artwork — strong black outlines on white — that means:
 *   - The seed pixel is the white area the user tapped.
 *   - The tolerance check (`tol = 35`) treats anything close to that
 *     white as the same field, and stops at the bold outlines (which are
 *     well outside ±35 from white). The result behaves like a paint
 *     bucket bounded by black borders, which is what the prompt asks for.
 *
 * Tools: felt / watercolor / pencil (crayon) / graphite / fill / eraser.
 * The five tools sit in a rail next to the page (below it on a phone held
 * upright) and the pencils stand in a case underneath, so a child never has
 * to open a menu. The "big pencil box" and other extras sit behind
 * LambKing Plus (see `usePremium`).
 *
 * The view also accepts a `?source=<url>&type=image|pdf` query so the
 * BookDetail "Use in coloring app" CTA can drop straight into the
 * artwork, without going through the upload card.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { prependBaseUrl } from '@/utils/function'
import { isIOS } from '@/utils/platform'
import { goBackTo } from '@/utils/navBack'
import { screenToSheet } from '@/utils/sheetMath'
import { PatchHistory } from '@/utils/patchHistory'
import { StickerCover } from '@/utils/stickerCover'
import useSfx from '@/use/useSfx'
import { useToolbarDock } from '@/use/useToolbarDock'
import { installPenTaps } from '@/use/usePenTaps'
import useAdventure from '@/use/useAdventure'
import useJournal, { drawingFrom, readDraft, writeDraft } from '@/use/useJournal'
import { LOG_SCALE, MIN_STEPS, TimelapseLog, packTimelapse, recordStep, unpackTimelapse, type TimelapseData } from '@/utils/timelapse'
import { floodFillPaint } from '@/utils/coloringFill'
import { requireParent } from '@/use/useParentalGate'
import AdvButton from '@/components/atoms/AdvButton.vue'
import ColoringShelf from '@/components/molecules/ColoringShelf.vue'
import ColoringToolbar, { type ToolbarTool } from '@/components/molecules/ColoringToolbar.vue'
import ColoringColorPicker from '@/components/molecules/ColoringColorPicker.vue'
import ColoringZoomBar from '@/components/molecules/ColoringZoomBar.vue'
import ColoringMenu from '@/components/molecules/ColoringMenu.vue'
import ColoringTimelapse from '@/components/molecules/ColoringTimelapse.vue'
import GreetingCardSheet from '@/components/molecules/GreetingCardSheet.vue'
import { drawGreetingCard } from '@/utils/greetingCard'
import useUserName from '@/use/useUserName'
import type { BookCard, GalleryGroup, GalleryItem } from '@/types/coloringMenu'
import { BACKDROPS, BACKDROP_KEY, DEFAULT_BACKDROP, PLAIN_COLORS, PLAIN_KEY, isBackdropId, isPlainColorId, preloadBackdrop, type BackdropId } from '@/data/coloringBackdrops'
import {
  BRUSH_LOOK,
  drawOilSegment,
  eraseSegment,
  emptyBounds,
  glitterSites,
  type GlitterSite,
  growBounds,
  type Bounds,
  isLayeredTool,
  ROUND_TIP,
  isTipShape,
  tipOf,
  type Tip,
  type TipShape,
  newOilState,
  newStrokeState,
  paintLayerSegment,
  shapeOptionsOf,
  shapeRegion,
  strokeReach,
  widthFactor,
  type LayeredTool,
  type ShapeOptions
} from '@/utils/coloringBrushes'
import { KIT_ARTWORK, LINE_ICONS, TOOL_SPRITES, warmSprites, type KitArtwork, type KitItem } from '@/data/coloringKits'
import usePremium from '@/use/usePremium'
import { anchorsOf, recognize, shapePath, tidyLine, type Pt, type QuickShape } from '@/utils/quickShape'
import { DEFAULT_STAMP, cleanStamp, stampUrl, type StampSettings } from '@/data/coloringStamps'
import useGlitterTwinkle from '@/use/useGlitterTwinkle'
import useApiBooks from '@/use/useApiBooks'
import { pickLocalizedImage, type ApiBook } from '@/types/apiBook'
import { BUILTIN_COLORING_PAGES } from '@/data/builtinColoringPages'
import { coloringPagesOfBook, isColoringBook, type ColoringBookPage } from '@/utils/coloringBook'
import { cacheUrlToBlobUrl } from '@/use/useBookCache'
import { allowedPages, freePageCount } from '@/use/useBookAccess'
import useAwards from '@/use/useAwards'
import { AWARDS, type AwardId } from '@/utils/awards'
import confetti from 'canvas-confetti'
import { buildBackup, deliverBackup, restoreBackup } from '@/use/useArtworkBackup'
import { buildRegionMap, gapFor, labelAt, paintedShare, regionMaskAlpha, type RegionMap } from '@/utils/coloringRegions'
import { paintStars, partialStars } from '@/utils/adventureScore'
import { paintJobsOf, saveJobResults } from '@/utils/paintJobs'
import { evaluateJob, gridSize, TOOL_CODES, ToolMap, zoneCells, type JobStatus, type PaintTool } from '@/utils/toolMap'
import useChrome from '@/use/useChrome'
import useColoringShelf from '@/use/useColoringShelf'
import { journeys } from '@/data/adventures'
import { maxPoints, medalFor, pointsOf } from '@/utils/adventureScore'
import { useActivity } from '@/use/useActivity'
import type { RewardItem } from '@/types/coloringMenu'
import { contentLocale } from '@/utils/contentLocale'
import {
  type ArtworkMeta,
  deleteArtwork,
  getArtwork,
  getTimelapse,
  listArtworks,
  pageArtworkId,
  saveArtwork,
  saveTimelapse
} from '@/use/useArtworks'
// pdf.js is large (it was most of this screen's 1.7 MB) and only a PDF needs it, so it is loaded the first time a PDF is
// opened, not with the screen. `?worker&inline` makes Vite inline the worker source as a blob — no separate asset file
// (which the production obfuscator drops), and the CSP's `worker-src 'self' blob:` accepts it. The cMaps (character tables
// for PDFs) are our own copy in `public/pdfjs/cmaps/` (from pdfjs-dist 4.10.38), so no other server ever sees a request.
const PDFJS_CMAP = new URL(prependBaseUrl('pdfjs/cmaps/'), window.location.href).href
let pdfjsReady: Promise<typeof import('pdfjs-dist')> | null = null

function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  pdfjsReady ??= (async () => {
    const [lib, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?worker&inline')])
    lib.GlobalWorkerOptions.workerPort = new worker.default()
    return lib
  })()
  return pdfjsReady
}

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

// ── Source from query --------------------------------------------------------

/**
 * A picture painted as the task of an adventure stage (`?adv=josef:6`): a finished picture earns three stars, leaving after
 * painting something one star; the way back leads to the stage.
 */
const adventure = useAdventure()
const advCtx = computed<{ journeyId: string; stageId: number } | null>(() => {
  const v = route.query.adv
  if (typeof v !== 'string') return null
  const [journeyId, stage] = v.split(':')
  const stageId = Number(stage)
  return journeyId && Number.isFinite(stageId) && stageId >= 1 ? { journeyId, stageId } : null
})

/**
 * A picture painted for the thank-you book (`?journal=1`): a blank sheet, and "Put in my book" hands it in with the words that
 * were written there (they wait in `readDraft`). The way back leads to the book.
 */
const journalCtx = computed(() => route.query.journal === '1')
const journal = useJournal()

async function toJournal(keep: boolean) {
  let ok = true
  if (keep) {
    const picture = flattenCanvas()
    ok = !!picture && journal.add(readDraft(), drawingFrom(picture))
    if (ok) writeDraft('')
  }
  await persistNow()
  hasImage.value = false
  identity = null
  void router.replace(ok ? { name: 'app-journal' } : { name: 'app-journal', query: { failed: '1' } })
}

/** Back to the stage; `done` shows the finished picture there ("well done") with its stars, otherwise the stage goes on with the questions. */
function backToStage(done = false, stars = 0) {
  const c = advCtx.value
  if (!c) return
  void router.replace({
    name: 'app-adventure-stage',
    params: { journeyId: c.journeyId, stageId: String(c.stageId) },
    query: done ? { back: 'task', done: '1', stars: String(stars) } : { back: 'task', stars: String(stars) }
  })
}

// ── The tool a picture of an adventure asks for ------------------------------------------------
// ("Paint with the felt-tip marker"): a coarse map beside the picture remembers which tool painted every place (see `utils/toolMap.ts`).
// It is kept only for such pictures, so the free painting program is not touched.

/** The task of the stage whose picture is painted. */
const advTask = computed(() => {
  const c = advCtx.value
  if (!c) return null
  return journeys.find((j) => j.id === c.journeyId)?.stages.find((s) => s.id === c.stageId)?.task ?? null
})
/** The tasks drawn for this stage (the stage page draws them when it is entered; here the same ones are read). */
const advJobs = computed(() => (advCtx.value ? paintJobsOf(advCtx.value.journeyId, advCtx.value.stageId, advTask.value?.jobs, advTask.value?.jobCount ?? 3) : []))
/** The tools are noted for every picture that has tasks, so tasks drawn later find the map complete. */
const advTracks = computed(() => !!advTask.value?.jobs?.length)
/** What the tasks look like now (checked a moment after every stroke); the list at the top shows a tick for the ones that are done. */
const jobStatus = ref<JobStatus[]>([])
const jobsFolded = ref(false)
let jobsAutoFolded = false
const jobsDone = computed(() => jobStatus.value.filter((s) => s === 'met').length)
let toolMap: ToolMap | null = null
let gridCanvas: HTMLCanvasElement | null = null
const toolMapKey = () => `lk-toolmap:${identity?.id ?? ''}`

function ensureToolMap(): ToolMap | null {
  const dc = drawCanvas.value
  if (!advTracks.value || !dc || !dc.width || !dc.height) return null
  const g = gridSize(dc.width, dc.height)
  if (!toolMap || toolMap.w !== g.w || toolMap.h !== g.h) toolMap = new ToolMap(g.w, g.h)
  return toolMap
}

/** The picture (or the one before the action) on the coarse grid, as RGBA. */
function gridPixels(src: CanvasImageSource, w: number, h: number): Uint8ClampedArray {
  const c = (gridCanvas ??= document.createElement('canvas'))
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(src, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

/** An action ended: the tool that did it is written where the picture changed (the eraser clears what is bare now). */
function trackTool(before: HTMLCanvasElement, after: HTMLCanvasElement, tool: ToolId) {
  const tm = ensureToolMap()
  if (!tm) return
  const code = tool === 'eraser' ? 0 : tool in TOOL_CODES ? TOOL_CODES[tool as PaintTool] : -1
  if (code < 0) return
  tm.record(code, gridPixels(before, tm.w, tm.h), gridPixels(after, tm.w, tm.h))
}

/** The cells of the grid that belong to a zone (found once per zone: the fields of the line art). */
const zoneCache = new Map<string, Uint8Array>()
function zoneMaskOf(zoneName: string, w: number, h: number): Uint8Array | null {
  const seeds = advTask.value?.zones?.[zoneName]?.seeds
  const map = ensureRegionMap()
  if (!seeds?.length || !map) return null
  const key = `${advCtx.value?.journeyId}:${advCtx.value?.stageId}:${zoneName}:${w}x${h}`
  let mask = zoneCache.get(key)
  if (!mask) {
    mask = zoneCells(map, seeds, w, h)
    zoneCache.set(key, mask)
  }
  return mask
}

/** How each of the drawn tasks stands (done, wrong tool or colour, or not enough yet). `null` when the picture has no tasks or cannot be read. */
function evaluateJobs(): JobStatus[] | null {
  const jobs = advJobs.value
  const dc = drawCanvas.value
  const tm = ensureToolMap()
  if (!jobs.length || !dc || !tm) return null
  const rgba = gridPixels(dc, tm.w, tm.h)
  const out: JobStatus[] = []
  for (const job of jobs) {
    const zone = zoneMaskOf(job.zone, tm.w, tm.h)
    if (!zone) return null
    out.push(evaluateJob({ codes: tm.codes, rgba, zone, tool: job.tool, color: job.color }).status)
  }
  return out
}

let jobTimer = 0
/** A moment after the last stroke the list of tasks is checked again. */
function scheduleJobCheck() {
  if (!advTracks.value) return
  clearTimeout(jobTimer)
  jobTimer = window.setTimeout(() => {
    jobStatus.value = evaluateJobs() ?? []
  }, 500)
}

/** The stars of the picture: one for every task that is done. Without a result (no map of fields) the painted share counts as before. */
function jobStars(painted: boolean): number {
  const c = advCtx.value
  const results = evaluateJobs()
  if (!c || !results) return painted ? paintStars(currentPaintShare(), true) : 0
  jobStatus.value = results
  saveJobResults(c.journeyId, c.stageId, results)
  // by the share of the tasks that are met: all 3 stars, two thirds 2, 30 % one, less none
  return partialStars(results.filter((s) => s === 'met').length, results.length)
}

function saveToolMap() {
  if (!toolMap || !identity) return
  try {
    localStorage.setItem(toolMapKey(), toolMap.encode())
  } catch {
    // no room: the picture then counts every place with an unknown tool as right
  }
}

function loadToolMap() {
  toolMap = null
  const dc = drawCanvas.value
  if (!advTracks.value || !dc || !identity) return
  const g = gridSize(dc.width, dc.height)
  try {
    toolMap = ToolMap.decode(localStorage.getItem(toolMapKey()), g.w, g.h)
  } catch {
    toolMap = null
  }
}

/** How much of the picture is painted (0 to 1), counted on the fields of the line art. */
function currentPaintShare(): number {
  const map = ensureRegionMap()
  const dc = drawCanvas.value
  if (!map || !dc || !dc.width || !dc.height) return 0
  const c = document.createElement('canvas')
  c.width = map.w
  c.height = map.h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 0
  ctx.drawImage(dc, 0, 0, c.width, c.height)
  const px = ctx.getImageData(0, 0, c.width, c.height).data
  const alpha = new Uint8Array(c.width * c.height)
  for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3]!
  return paintedShare(map, alpha)
}

/** Leaving the picture of a stage without pressing "done": what is painted so far counts (30 % one star, 40 % two, 70 % three). */
async function leaveToStage() {
  const c = advCtx.value
  if (!c) return
  // (saving clears the flag of "something was painted", so it is read first)
  if (savedFlash.value) return
  const painted = hasUserAction.value
  await persistWithNote()
  const stars = jobStars(painted || currentPaintShare() > 0)
  if (painted || stars > 0) adventure.recordStars(c.journeyId, c.stageId, stars)
  backToStage(false, stars)
}

const querySource = computed<string>(() => {
  const v = route.query.source
  return typeof v === 'string' ? v : ''
})
const querySourceType = computed<'image' | 'pdf' | ''>(() => {
  const v = route.query.type
  if (v === 'image' || v === 'pdf') return v
  if (querySource.value && /\.pdf(?:\?.*)?$/i.test(querySource.value)) return 'pdf'
  if (querySource.value) return 'image'
  return ''
})

// ── Backdrop -----------------------------------------------------------------

// The picture behind the paper: the plain warm light, or a table, a meadow, the beach (see `coloringBackdrops.ts`).
// The choice is remembered. The `url()` goes in as a custom property because a bare `url(...)` in the SFC style
// block would be resolved by Vite as a bundled asset.
function readBackdrop(): BackdropId {
  try {
    const v = localStorage.getItem(BACKDROP_KEY)
    return isBackdropId(v) ? v : DEFAULT_BACKDROP
  } catch {
    return DEFAULT_BACKDROP
  }
}

function readPlain(): string {
  try {
    const v = localStorage.getItem(PLAIN_KEY)
    return isPlainColorId(v) ? v : 'warm'
  } catch {
    return 'warm'
  }
}

const backdropId = ref<BackdropId>(readBackdrop())
// the table is fetched while the menu is still on the screen
preloadBackdrop(backdropId.value)
const plainColorId = ref<string>(readPlain())
const backdropVars = computed(() => {
  // the main menu keeps the calm warm light, so its text can always be read; the backdrop belongs to the sheet
  if (!hasImage.value) return {}
  const b = BACKDROPS.find((x) => x.id === backdropId.value)
  if (b?.image) return { '--ac-bg-image': `url(${b.image})` }
  const c = PLAIN_COLORS.find((x) => x.id === plainColorId.value) ?? PLAIN_COLORS[0]!
  return { '--ac-bg-image': c.css }
})

function setBackdrop(id: string) {
  if (!isBackdropId(id)) return
  backdropId.value = id
  preloadBackdrop(id)
  try {
    localStorage.setItem(BACKDROP_KEY, id)
  } catch {
    // not remembered in a private window
  }
}

function setPlainColor(id: string) {
  if (!isPlainColorId(id)) return
  plainColorId.value = id
  try {
    localStorage.setItem(PLAIN_KEY, id)
  } catch {
    // not remembered in a private window
  }
}

// ── Choose a coloring page ---------------------------------------------------

// The built-in pages plus every coloring attachment of every book, so a child
// can pick a picture without going through a story first.
const { state: booksState, loadAllBooks } = useApiBooks()

const looksLikePdf = (url: string) => /\.pdf(?:\?.*)?$/i.test(url)

const galleryGroups = computed<GalleryGroup[]>(() => {
  // The pages that ship with the app come first, then one group per ordinary book that has a coloring attachment.
  // Coloring books themselves are shown as books (see `coloringBooks`).
  const groups: GalleryGroup[] = [
    {
      key: 'builtin',
      title: t('app.coloring.pagesTitle'),
      items: BUILTIN_COLORING_PAGES.map((p) => {
        const url = prependBaseUrl(p.file)
        return { key: `builtin-${p.id}`, title: t(`app.coloring.pages.${p.id}`), data: url, preview: url }
      })
    }
  ]
  for (const book of booksState.all ?? []) {
    if (isColoringBook(book)) continue
    const items: GalleryItem[] = []
    ;(book.attachments ?? []).forEach((a, i) => {
      if (a.type !== 'coloring' || !a.data) return
      items.push({
        key: `${book.bookId}-a${i}`,
        title: t('app.coloring.defaultTitle'),
        data: a.data,
        preview: a.previewImage || (looksLikePdf(a.data) ? '' : a.data)
      })
    })
    if (!items.length) continue
    const loc = book.localizations as Record<string, { title?: string } | null | undefined>
    groups.push({
      key: book.bookId,
      title: loc[locale.value]?.title || loc.de?.title || book.bookId,
      items: items.slice(0, 80)
    })
  }
  return groups
})

// ── Finished pictures and awards -------------------------------------------------------------

const awards = useAwards()

/** Awards won a moment ago, shown as a small banner. */
const awardBanner = ref<AwardId[]>([])
let awardBannerTimer: ReturnType<typeof setTimeout> | undefined

const sfx = useSfx()

function celebrate(won: AwardId[]) {
  if (!won.length) return
  sfx.play('trophy')
  awardBanner.value = [...awardBanner.value, ...won]
  clearTimeout(awardBannerTimer)
  awardBannerTimer = setTimeout(() => {
    awardBanner.value = []
  }, 5000)
}

const lastAward = computed<AwardId | null>(() => awardBanner.value[awardBanner.value.length - 1] ?? null)
const awardImage = (id: AwardId) => prependBaseUrl(`images/awards/${AWARDS.find((a) => a.id === id)?.image ?? 'star'}.webp`)
const STAR_IMAGE = prependBaseUrl('images/awards/star.webp')

/** The dialog after "picture finished". */
const finishInfo = ref<{ won: AwardId[]; bookDone: boolean; hasNext: boolean; hasLapse: boolean } | null>(null)
const finishNote = ref('')

async function finishPicture() {
  menuOpen.value = false
  const id = identity?.id
  if (!identity || !id || !drawCanvas.value) {
    finishNote.value = t('app.coloring.finishNeedsSave')
    return
  }
  hasUserAction.value = true
  await persistNow()
  const rec = await getArtwork(id)
  if (!rec) {
    finishNote.value = t('app.coloring.finishPaintFirst')
    return
  }
  const { drawing: layer, ...meta } = rec
  await saveArtwork({ ...meta, done: true }, layer)
  if (!meta.done) useActivity().count('pictures')
  identity.done = true
  await flushTimelapse()

  // A whole coloring book is finished when every one of its pictures is.
  let complete = false
  const ctx = bookCtx.value
  if (ctx) {
    const saved = new Map((await listArtworks()).map((a) => [a.id, a]))
    complete = ctx.pages.every((p) => saved.get(pageArtworkId(p.url, 1))?.done)
  }
  const won = awards.pictureFinished(id, ctx ? { bookId: ctx.bookId, complete } : undefined)
  if (advCtx.value) {
    // the picture of a stage is done: every task that is done is a star (0 to 3; a picture without tasks: the painted share, 70 % three, 40 % two, else one),
    // and on to the stage, where the finished picture is shown with the tasks ticked or crossed. The newest result replaces the old one.
    const stars = jobStars(true)
    adventure.recordStars(advCtx.value.journeyId, advCtx.value.stageId, stars)
    void refreshMyWorks()
    backToStage(true, stars)
    return
  }
  const hasNext = !!ctx && ctx.index + 1 < allowedPages(ctx.bookId, 'coloring', ctx.pages.length, ctx.freePages)
  finishInfo.value = { won, bookDone: complete, hasNext, hasLapse: timelapse.count >= MIN_STEPS }
  void refreshMyWorks()
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 }, disableForReducedMotion: true })
}

const finishImage = computed(() => {
  const first = finishInfo.value?.won[0]
  return first ? awardImage(first) : STAR_IMAGE
})

function closeFinish() {
  finishInfo.value = null
}

async function watchTimelapse() {
  await openTimelapse()
}

async function finishNext() {
  closeFinish()
  await gotoBookPage(1)
}

async function finishOverview() {
  closeFinish()
  if (advCtx.value) {
    backToStage()
    return
  }
  if (bookCtx.value) await leaveToBook()
  else await closePicture()
}

// ── Backup of all paintings (for parents) --------------------------------------------------------

const backupBusy = ref(false)
const backupMessage = ref('')
const backupInput = ref<HTMLInputElement | null>(null)

async function exportBackup() {
  if (!(await requireParent())) return
  backupBusy.value = true
  backupMessage.value = t('app.coloring.backupWorking')
  try {
    const { blob, count } = await buildBackup()
    if (!count) {
      backupMessage.value = t('app.coloring.backupEmpty')
      return
    }
    await deliverBackup(blob, `LambKing-Bilder-${new Date().toISOString().slice(0, 10)}.zip`)
    backupMessage.value = t('app.coloring.backupDone', { n: count })
  } catch (err) {
    console.error('backup failed', err)
    backupMessage.value = t('app.coloring.backupFailed')
  } finally {
    backupBusy.value = false
  }
}

async function pickBackup() {
  if (!(await requireParent())) return
  backupInput.value?.click()
}

async function onBackupFile(e: Event) {
  const inp = e.target as HTMLInputElement
  const file = inp.files?.[0]
  inp.value = ''
  if (!file) return
  backupBusy.value = true
  backupMessage.value = t('app.coloring.backupWorking')
  try {
    const { restored, kept } = await restoreBackup(file)
    await refreshMyWorks()
    backupMessage.value = t('app.coloring.restoreDone', { restored, kept })
  } catch (err) {
    console.error('restore failed', err)
    backupMessage.value = t('app.coloring.restoreFailed')
  } finally {
    backupBusy.value = false
  }
}

// ── Coloring books (Ausmalbücher) -----------------------------------------------------------

const coloringBooks = computed<BookCard[]>(() => {
  const saved = new Map(myWorks.value.map((w) => [w.id, w]))
  const cards: BookCard[] = []
  for (const book of booksState.all ?? []) {
    if (!isColoringBook(book)) continue
    const pages = coloringPagesOfBook(book as ApiBook, locale.value)
    if (!pages.length) continue
    const loc = book.localizations as Record<string, { title?: string } | null | undefined>
    let done = 0
    let updatedAt = 0
    for (const p of pages) {
      const w = saved.get(pageArtworkId(p.url, 1))
      if (w) {
        done++
        updatedAt = Math.max(updatedAt, w.updatedAt)
      }
    }
    cards.push({
      bookId: book.bookId,
      title: (loc[locale.value]?.title || loc.de?.title || book.bookId).replace(/^Buch\s*\d+\s*[–-]\s*/i, ''),
      cover: pickLocalizedImage(book.previewImage, contentLocale(locale.value)),
      total: pages.length,
      done,
      updatedAt
    })
  }
  return cards.sort((a, b) => a.bookId.localeCompare(b.bookId))
})

/** The books of the main menu: the ones the child is painting first (the one painted on last at the front), then the rest. */
const paintShelf = useColoringShelf()
// the very first time: the books that were already painted on stay on the shelf

const orderedBooks = computed(() =>
  coloringBooks.value
    .filter((b) => paintShelf.ids.value.includes(b.bookId))
    .sort((a, b) => {
      if ((a.done > 0) !== (b.done > 0)) return a.done > 0 ? -1 : 1
      return a.done > 0 ? b.updatedAt - a.updatedAt : a.bookId.localeCompare(b.bookId)
    })
)


/** Paintings that do not belong to a coloring book (blank sheets, built-in pages, own images). */
const looseWorks = computed(() => {
  const inBooks = new Set<string>()
  for (const book of booksState.all ?? []) {
    if (!isColoringBook(book)) continue
    for (const p of coloringPagesOfBook(book as ApiBook, locale.value)) inBooks.add(pageArtworkId(p.url, 1))
  }
  return myWorks.value.filter((w) => !inBooks.has(w.id))
})

// the presents won on journeys: a cup at the end of a journey gives a picture to paint, which is kept here
const rewards = computed<RewardItem[]>(() =>
  journeys
    .filter((j) => {
      const p = adventure.progressOf(j.id)
      return !!p?.exam && !!medalFor(pointsOf(p), maxPoints(j))
    })
    .map((j) => ({ id: `gift-${j.id}`, title: j.gift.title, image: prependBaseUrl(j.gift.image), from: j.title }))
)

function openReward(item: RewardItem) {
  pendingTitle = item.title
  void router.replace({ name: 'app-coloring', query: { source: item.image, type: 'image' } })
}

function openBookCard(card: BookCard) {
  void router.push({ name: 'app-coloring-book', params: { bookId: card.bookId } })
}

function pickGalleryItem(item: GalleryItem) {
  pendingTitle = item.title
  void router.replace({
    name: 'app-coloring',
    query: { source: item.data, type: looksLikePdf(item.data) ? 'pdf' : 'image' }
  })
}

// Blank sheets: 3:4 at a size that stays light on a phone (undo keeps ten copies).
const BLANK_PORTRAIT = { w: 1200, h: 1600 }
const BLANK_LANDSCAPE = { w: 1600, h: 1200 }

function startBlankSheet(shape: 'portrait' | 'landscape') {
  const size = shape === 'portrait' ? BLANK_PORTRAIT : BLANK_LANDSCAPE
  void startBlank(size.w, size.h)
}

async function startBlank(w: number, h: number, existing?: ArtworkMeta) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  identity = {
    id: existing?.id ?? `blank:${Date.now()}`,
    title: existing?.title ?? t('app.coloring.blankTitle'),
    kind: 'blank',
    sourceUrl: '',
    sourceType: '',
    page: 1
  }
  isLoading.value = true
  try {
    await openImageUrl(c.toDataURL('image/png'))
  } finally {
    isLoading.value = false
  }
}

function openWork(meta: ArtworkMeta) {
  if (meta.kind === 'blank') {
    void startBlank(meta.width, meta.height, meta)
    return
  }
  initialPdfPage = meta.page
  pendingTitle = meta.title
  void router.replace({
    name: 'app-coloring',
    query: { source: meta.sourceUrl, type: meta.sourceType || 'image' }
  })
}

// ── Tool & paint state -------------------------------------------------------

type ToolId = 'felt' | 'watercolor' | 'pencil' | 'graphite' | 'whitepencil' | 'chalk' | 'glitter' | 'oil' | 'fill' | 'eraser' | 'pipette' | 'stamp'

// The boxes a child can open. Each one has its own tool and its own set of
// colours (the artwork lives in `coloringKits.ts`); the chosen colour carries
// over when switching boxes.
type KitId = 'pencil' | 'graphite' | 'marker' | 'watercolor' | 'oil' | 'chalk' | 'glitter' | 'bucket'

interface KitDef extends KitArtwork {
  id: KitId
  tool: ToolId
  /** Premium feature that unlocks the whole box, if any (see usePremium). */
  feature?: 'glitter'
}

const KITS: KitDef[] = [
  { id: 'pencil', tool: 'pencil', ...KIT_ARTWORK.pencil },
  { id: 'graphite', tool: 'graphite', ...KIT_ARTWORK.graphite },
  { id: 'marker', tool: 'felt', ...KIT_ARTWORK.marker },
  { id: 'watercolor', tool: 'watercolor', ...KIT_ARTWORK.watercolor },
  { id: 'oil', tool: 'oil', ...KIT_ARTWORK.oil },
  { id: 'chalk', tool: 'chalk', ...KIT_ARTWORK.chalk },
  { id: 'glitter', tool: 'glitter', feature: 'glitter', ...KIT_ARTWORK.glitter },
  // the bucket has its own buckets of paint, and with them its own colour
  { id: 'bucket', tool: 'fill', ...KIT_ARTWORK.bucket }
]

const kit = ref<KitId>('pencil')
const kitDef = computed(() => KITS.find((k) => k.id === kit.value)!)

const tool = ref<ToolId>('pencil')
/**
 * The eraser that a pen button (S Pen, Apple Pencil double tap) switches on for a moment. `null` = the chosen tool.
 * The chosen tool itself is untouched, so letting go of the button brings the painting tool right back.
 */
const toolOverride = ref<ToolId | null>(null)
const activeTool = computed<ToolId>(() => toolOverride.value ?? tool.value)

// Every tool has its own colour and keeps it until it is changed in that very tool (remembered).
interface ToolPaint {
  color: string
  /** Chosen with the colour picker or the pipette rather than a pencil of the box. */
  custom: boolean
}

const COLORS_KEY = 'lk-coloring-tool-colors'
const HEX_COLOR = /^#[0-9a-f]{6}$/i

/**
 * The colour every tool starts with: all different (they all being red looked silly). It is the colour of the box that is nearest to this one.
 * A tool that was never changed is not remembered, so its start colour is the one of today; a changed one keeps its colour.
 */
const START_COLORS: Record<KitId, string> = {
  pencil: '#FA4429',
  graphite: '#3C3C3B',
  marker: '#0752B2',
  watercolor: '#18993C',
  oil: '#F89F07',
  chalk: '#F7ACB7',
  glitter: '#8C4BD8',
  bucket: '#3BD6CC'
}
/** The tools whose colour was changed (only these are remembered). */
const touchedKits = new Set<KitId>()

function startColorOf(k: KitDef): string {
  const items = [...k.base, ...k.extra]
  const want = START_COLORS[k.id]
  let best = items[0]?.color ?? want
  let bd = Infinity
  for (const it of items) {
    const d = sqDist(it.color, want)
    if (d < bd) {
      bd = d
      best = it.color
    }
  }
  return best
}

function readToolColors(): Record<KitId, ToolPaint> {
  const out = {} as Record<KitId, ToolPaint>
  for (const k of KITS) out[k.id] = { color: startColorOf(k), custom: false }
  try {
    const saved = JSON.parse(localStorage.getItem(COLORS_KEY) ?? 'null') as Record<string, Partial<ToolPaint>> | null
    if (saved && typeof saved === 'object') {
      for (const k of KITS) {
        const v = saved[k.id]
        if (v && typeof v.color === 'string' && HEX_COLOR.test(v.color)) {
          out[k.id] = { color: v.color.toUpperCase(), custom: !!v.custom }
          touchedKits.add(k.id)
        }
      }
    }
  } catch {
    // the first colours of the boxes
  }
  return out
}

const toolColors = ref<Record<KitId, ToolPaint>>(readToolColors())
/** The colour of the tool that is chosen (the last painting tool, while the eraser, the bucket or the pipette is chosen). */
const color = computed<string>(() => toolColors.value[kit.value].color)
const customColor = computed<string | null>(() => (toolColors.value[kit.value].custom ? toolColors.value[kit.value].color : null))

function setPaint(c: string, custom: boolean) {
  toolColors.value = { ...toolColors.value, [kit.value]: { color: c.toUpperCase(), custom } }
  touchedKits.add(kit.value)
  try {
    localStorage.setItem(COLORS_KEY, JSON.stringify(Object.fromEntries([...touchedKits].map((id) => [id, toolColors.value[id]]))))
  } catch {
    // not remembered in a private window
  }
}
/** Brush size on a 2–60 scale (starts at 80 % of the full 60); the picture's width scales it, so it feels the same on every picture. */
const brushSize = ref<number>(31)
/** The eraser has its own size and its own way of working, remembered between visits. */
const ERASER_KEY = 'lk-coloring-eraser-v2'
const ERASER_SIZES = [6, 14, 26, 44]
function readEraser(): { size: number; field: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(ERASER_KEY) ?? 'null') as { size?: unknown; field?: unknown } | null
    const size = typeof saved?.size === 'number' ? Math.round(Math.max(2, Math.min(60, saved.size))) : 31
    return { size, field: saved?.field !== false }
  } catch {
    return { size: 31, field: true }
  }
}
const eraserSaved = readEraser()
const eraserSize = ref<number>(eraserSaved.size)
/** A tap with the eraser inside a field of the line art takes away all the paint of that field. */
const eraserField = ref<boolean>(eraserSaved.field)
watch([eraserSize, eraserField], () => {
  try {
    localStorage.setItem(ERASER_KEY, JSON.stringify({ size: eraserSize.value, field: eraserField.value }))
  } catch {
    // not remembered in a private window
  }
})
/** The size the size slider of the tool bar shows and changes: that of the eraser while the eraser is chosen. */
const sizeModel = computed<number>({
  get: () => (tool.value === 'eraser' ? eraserSize.value : brushSize.value),
  set: (n) => {
    if (tool.value === 'eraser') eraserSize.value = n
    else brushSize.value = n
  }
})
/** How strong the paint goes on, 15–100 %. */
const strength = ref<number>(100)
const opacity = computed(() => strength.value / 100)

/**
 * Something was set up for painting (a tool, a colour, a size) while the tool bar is open: the next press on the paper paints
 * at once and folds the bar. Without it, that press only closes the bar.
 */
let armed = false
function arm() {
  armed = true
}
watch([brushSize, eraserSize, strength], arm)
// The shape of the tip, one choice for every painting tool (remembered). Watercolour and oil start with an oval.
const TIPS_KEY = 'lk-coloring-tips'
const DEFAULT_TIPS: Record<string, TipShape> = { watercolor: 'oval-left', oil: 'oval-left' }

function readTips(): Record<string, TipShape> {
  const tips = { ...DEFAULT_TIPS }
  try {
    const saved = JSON.parse(localStorage.getItem(TIPS_KEY) ?? 'null') as Record<string, unknown> | null
    if (saved && typeof saved === 'object') for (const [k, v] of Object.entries(saved)) if (isTipShape(v)) tips[k] = v
  } catch {
    // the defaults
  }
  return tips
}

const tips = ref<Record<string, TipShape>>(readTips())
const tipOfTool = (id: string): Tip => tipOf(tips.value[id] ?? 'round')

function setTip(shape: TipShape) {
  arm()
  tips.value = { ...tips.value, [tool.value]: shape }
  try {
    localStorage.setItem(TIPS_KEY, JSON.stringify(tips.value))
  } catch {
    // not remembered in a private window
  }
}

const { hasFeature, showUpsell } = usePremium()

// Free: the 12 basic colours of every box and every tool but the glitter pencils. Plus: the other colours of a box (36 for the
// pencils), the free colour picker and the glitter pencils (see `usePremium`).
const extraLocked = computed(() => kitDef.value.extra.length > 0 && !hasFeature('colors'))

function selectKit(k: KitDef) {
  if (k.feature && !hasFeature(k.feature)) {
    showUpsell(k.feature)
    return
  }
  kit.value = k.id
  tool.value = paintToolOf(k, toolColors.value[k.id].color)
}

/** The drawing tool of a box with the colour that is chosen in it: the pencil box has the graphite pencils and the white pencil, which paint differently. */
function paintToolOf(k: KitDef, c: string): ToolId {
  const up = c.toUpperCase()
  return [...k.base, ...k.extra].find((i) => i.color.toUpperCase() === up)?.tool ?? k.tool
}

/** Back to the open box's drawing tool (after the pipette, for example). */
function selectPaint() {
  tool.value = paintToolOf(kitDef.value, color.value)
}

function selectToolById(id: string) {
  arm()
  const k = KITS.find((x) => x.tool === id)
  if (k) {
    selectKit(k)
    return
  }
  tool.value = id as ToolId
}

/** A colour chosen below goes with a painting tool: after the eraser, the bucket or the pipette the box's tool comes back. */
function backToPaint() {
  if (tool.value === 'eraser' || tool.value === 'fill' || tool.value === 'pipette' || tool.value === 'stamp') selectPaint()
  toolOverride.value = null
}

function pickPreset(c: string) {
  arm()
  backToPaint()
  setPaint(c, false)
  // the white pencil of the pencil tool paints differently from the graphite ones
  if (kit.value === 'graphite' && (tool.value === 'graphite' || tool.value === 'whitepencil')) tool.value = paintToolOf(kitDef.value, c)
}

function pickCustom(c: string) {
  arm()
  backToPaint()
  setPaint(c, true)
}

/** The free colour picker (the rainbow item of a box). */
const pickerOpen = ref(false)

// The palette item opens the free colour picker, which comes with Plus.
function onCustomPencil() {
  if (!hasFeature('colors')) {
    showUpsell('colors')
    return
  }
  pickerOpen.value = !pickerOpen.value
}

function sqDist(a: string, b: string): number {
  const p = (h: string, i: number) => parseInt(h.replace('#', '').slice(i, i + 2), 16) || 0
  return (p(a, 0) - p(b, 0)) ** 2 + (p(a, 2) - p(b, 2)) ** 2 + (p(a, 4) - p(b, 4)) ** 2
}

/** The picture of the pencil, marker, brush… of a tool that matches that tool's colour (or comes closest to it). */
function spriteFor(k: KitDef): string {
  const want = toolColors.value[k.id].color
  const pool = k.toolSprites?.length ? k.toolSprites : [...k.base, ...k.extra]
  let best: KitItem | undefined = pool[0]
  let bd = Infinity
  for (const it of pool) {
    const d = sqDist(it.color, want)
    if (d < bd) {
      bd = d
      best = it
    }
  }
  return best?.src ?? ''
}

/** Every tool of the tool bar with its picture (in the colour of that tool): the tools of the boxes, then bucket and pipette (the pencil tool with its three pencils sits next to the coloured pencils). */
const TOOL_ORDER: KitId[] = ['pencil', 'graphite', 'marker', 'watercolor', 'oil', 'chalk', 'glitter']
const toolbarTools = computed<ToolbarTool[]>(() => {
  const list: ToolbarTool[] = [
    ...TOOL_ORDER.map((id) => KITS.find((k) => k.id === id)!).map((k) => ({ id: k.tool, label: t(`app.coloring.toolName.${k.tool}`), sprite: spriteFor(k) })),
    { id: 'fill', label: t('app.coloring.toolName.fill'), sprite: spriteFor(KITS.find((k) => k.id === 'bucket')!) || TOOL_SPRITES.fill },
    { id: 'pipette', label: t('app.coloring.toolName.pipette'), sprite: TOOL_SPRITES.pipette }
  ]
  // the Plus pens stay at the very bottom of the bar while Plus is not on; with Plus they sit among the other pens
  if (hasFeature('glitter')) return list
  const at = list.findIndex((x) => x.id === 'glitter')
  return [...list.slice(0, at), ...list.slice(at + 1), list[at]!]
})
// the eraser is no pen of the bar, but the folded tab shows it while it is chosen
/** The tool the bar shows as chosen: the white pencil is a pencil of the pencil tool, so that one is lit. */
const barTool = computed<ToolId>(() => (tool.value === 'whitepencil' ? 'graphite' : tool.value))
const currentSprite = computed(() => (tool.value === 'eraser' ? TOOL_SPRITES.eraser : tool.value === 'stamp' ? LINE_ICONS.stamp : (toolbarTools.value.find((x) => x.id === barTool.value)?.sprite ?? '')))

// The tool bar and the small menu.
const toolbarOpen = ref(true)
const menuOpen = ref(false)
/** The menu has its main list and two small pages: the eraser (size, what a tap does) and the scene behind the paper. */
const menuPage = ref<'main' | 'eraser' | 'scene'>('main')

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  menuPage.value = 'main'
}

function menuAction(fn: () => void) {
  menuOpen.value = false
  fn()
}

// ── Canvas refs --------------------------------------------------------------

const bgCanvas = ref<HTMLCanvasElement | null>(null)
const drawCanvas = ref<HTMLCanvasElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
/** The flashes of the glitter paint, laid over the picture (see `useGlitterTwinkle`). */
const sparkleCanvas = ref<HTMLCanvasElement | null>(null)
const twinkling = useGlitterTwinkle(() => drawCtx, () => sparkleCanvas.value)
/** Over the line art: the paint where a sticker sits, so a sticker covers the lines (see `utils/stickerCover.ts`). */
const stickerView = ref<HTMLCanvasElement | null>(null)
const cover = new StickerCover(() => drawCanvas.value, () => stickerView.value)
const canvasWrap = ref<HTMLDivElement | null>(null)
const mainEl = ref<HTMLElement | null>(null)
const cursorRing = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

let bgCtx: CanvasRenderingContext2D | null = null
let drawCtx: CanvasRenderingContext2D | null = null
let previewCtx: CanvasRenderingContext2D | null = null
/** The stroke layer lies over the paint while a stroke is drawn: its opacity and blend are set per tool. */
const previewStyle = ref<Record<string, string>>({ opacity: '0' })

const hasImage = ref(false)
// the main menu (no picture open) keeps the tab bar of the app
const { coloringMenuShown } = useChrome()
watch(hasImage, (v) => (coloringMenuShown.value = !v), { immediate: true })
onBeforeUnmount(() => (coloringMenuShown.value = false))
const isLoading = ref(false)
const dropOver = ref(false)

let pdfDoc: any = null
const totalPages = ref(1)
const currentPage = ref(1)
const pageDrawings: Record<number, string> = {}

/**
 * The time-lapse: every change of the picture is also remembered as a small picture of its area (see `utils/timelapse.ts`).
 * It is saved a little after the last change, when the picture is left, and when it is finished.
 */
const timelapse = new TimelapseLog()
let lapseDirty = false
let lapseTimer: ReturnType<typeof setTimeout> | undefined

function scheduleTimelapseSave() {
  lapseDirty = true
  clearTimeout(lapseTimer)
  lapseTimer = setTimeout(() => void flushTimelapse(), 8000)
}

async function flushTimelapse() {
  clearTimeout(lapseTimer)
  const id = identity?.id
  if (!lapseDirty || !id) return
  lapseDirty = false
  try {
    await saveTimelapse(id, packTimelapse(await timelapse.snapshot()))
  } catch (err) {
    console.warn('time-lapse not saved', err)
  }
}

/** The time-lapse window, opened from the dialog after "picture finished". */
const lapseOpen = ref(false)
const lapseData = ref<TimelapseData | null>(null)

async function openTimelapse() {
  lapseData.value = await timelapse.snapshot()
  lapseOpen.value = true
}

/** Undo and redo keep only the area each change touched (see `patchHistory.ts`), so a long session stays light on a tablet. */
const history = new PatchHistory(40)
const canUndo = ref(false)
const canRedo = ref(false)

let drawing = false
let lastX = 0
let lastY = 0
let activeTouchId: number | null = null

const zoom = {
  scale: 1,
  minScale: 0.5,
  maxScale: 6,
  panX: 0,
  panY: 0,
  baseW: 0,
  baseH: 0
}

const isFullscreen = ref(false)
// While a stroke is on, the bars fade back so the hand and the picture stay clear.
const isPainting = ref(false)
let paintFadeTimer: ReturnType<typeof setTimeout> | undefined

// ── Bottom nav ---------------------------------------------------------------

// ── Autosave / resume ---------------------------------------------------------
// Every picture is saved on the device as the child paints (and when leaving),
// so there is no "unsaved changes" warning: opening the picture again continues
// exactly where it stopped. See `useArtworks`.

interface WorkIdentity {
  id: string
  title: string
  kind: 'page' | 'blank'
  sourceUrl: string
  sourceType: 'image' | 'pdf' | ''
  page: number
  bookId?: string
  bookPage?: number
  /** Marked as finished before (kept when the child paints on). */
  done?: boolean
}

/** Who the picture on the canvas is, `null` for a picture opened from the device's files (not saved). */
let identity: WorkIdentity | null = null
/** Title for the next coloring page that gets loaded from a URL. */
let pendingTitle = ''
/** PDF page to open first when a saved work is resumed. */
let initialPdfPage = 1

/** True once the child changed anything since the last save. */
const hasUserAction = ref(false)
const myWorks = ref<ArtworkMeta[]>([])

function seedPaintShelf(list: BookCard[]) {
  if (list.length) paintShelf.seedShelf(list.filter((b) => b.done > 0).map((b) => b.bookId))
}
watch(coloringBooks, seedPaintShelf)
onMounted(() => {
  seedPaintShelf(coloringBooks.value)
  warmSprites()
})

const deleteCandidate = ref<ArtworkMeta | null>(null)
let autosaveTimer: ReturnType<typeof setTimeout> | undefined

async function refreshMyWorks() {
  myWorks.value = await listArtworks()
}

/** Runs `fn` when the browser has nothing better to do (Safari has no idle callback: then straight away). */
function whenIdle(fn: () => void, timeout = 3000) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout })
  else setTimeout(fn, 50)
}

/** The picture is packed and saved a moment after the last stroke, and never while a stroke is on (it would stall the pen). */
function scheduleAutosave() {
  clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(autosaveWhenQuiet, 2500)
}

function autosaveWhenQuiet() {
  if (drawing) {
    autosaveTimer = setTimeout(autosaveWhenQuiet, 1200)
    return
  }
  whenIdle(() => void persistNow())
}

/** The picture as it looks on screen: white paper, the paint, the line art multiplied on top. */
/** The picture as it looks: paper, paint, line art. `lights`: the flashes of the glitter paint are laid on as still stars (for the export; not for the bucket, which reads the pixels). */
function paintComposite(ctx: CanvasRenderingContext2D, w: number, h: number, lights = false, stickers = true) {
  const dc = drawCanvas.value!, bg = bgCanvas.value!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(dc, 0, 0, w, h)
  // the glitter: the fine flecks are in the paint already, the flashes are laid on as still stars
  if (lights) twinkling.drawStatic(ctx, w / Math.max(1, dc.width))
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(bg, 0, 0, w, h)
  ctx.restore()
  // a sticker covers the lines (the bucket does not look at them: it still finds the fields by the lines)
  if (stickers) cover.drawOver(ctx, w, h)
}

function makeThumb(): string {
  const dc = drawCanvas.value, bg = bgCanvas.value
  if (!dc || !bg) return ''
  const w = 280
  const h = Math.max(1, Math.round((bg.height / bg.width) * w))
  // A big picture is shrunk in halves: one jump to thumbnail size would leave the fine lines as scattered dots.
  let cw = Math.max(w, Math.min(bg.width, w * 4))
  let ch = Math.max(h, Math.round((bg.height / bg.width) * cw))
  let c = document.createElement('canvas')
  c.width = cw
  c.height = ch
  let ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  try {
    paintComposite(ctx, cw, ch)
    while (cw > w) {
      const nw = Math.max(w, Math.round(cw / 2))
      const nh = Math.max(h, Math.round(ch / 2))
      const next = document.createElement('canvas')
      next.width = nw
      next.height = nh
      const nctx = next.getContext('2d')!
      nctx.imageSmoothingQuality = 'high'
      nctx.drawImage(c, 0, 0, nw, nh)
      c = next
      ctx = nctx
      cw = nw
      ch = nh
    }
    return c.toDataURL('image/jpeg', 0.78)
  } catch {
    // A line-art image from another origin can taint the canvas; fall back to
    // the child's own paint on white.
    const f = document.createElement('canvas')
    f.width = w
    f.height = h
    const fctx = f.getContext('2d')!
    fctx.fillStyle = '#ffffff'
    fctx.fillRect(0, 0, w, h)
    fctx.drawImage(dc, 0, 0, w, h)
    return f.toDataURL('image/jpeg', 0.72)
  }
}

/** The picture that was saved last: leaving it shows "saved" (also when autosave had already done the work). */
let lastSavedId = ''
/** The short "picture saved" note on leaving. */
const savedFlash = ref(false)
const SAVED_PAUSE_MS = 900

/** Save, and when the child painted on this picture say so for a moment before leaving, so nobody fears the picture is lost. */
async function persistWithNote() {
  const wants = hasUserAction.value || (!!identity && identity.id === lastSavedId)
  await persistNow()
  if (!wants || !identity || identity.id !== lastSavedId) return
  savedFlash.value = true
  await new Promise<void>((resolve) => setTimeout(resolve, SAVED_PAUSE_MS))
  savedFlash.value = false
}

async function persistNow() {
  commitStamp()
  clearTimeout(autosaveTimer)
  const dc = drawCanvas.value
  if (!identity || !dc || !hasImage.value || !hasUserAction.value) return
  const snapshot = identity
  try {
    const drawing: Blob | null = await new Promise((resolve) => dc.toBlob((b) => resolve(b), 'image/png'))
    if (!drawing) return
    const stickers = await cover.toBlob()
    await saveArtwork(
      {
        id: snapshot.id,
        title: snapshot.title,
        kind: snapshot.kind,
        sourceUrl: snapshot.sourceUrl,
        sourceType: snapshot.sourceType,
        page: snapshot.page,
        bookId: snapshot.bookId,
        bookPage: snapshot.bookPage,
        done: snapshot.done,
        width: dc.width,
        height: dc.height,
        thumb: makeThumb(),
        updatedAt: Date.now()
      },
      drawing,
      stickers
    )
    hasUserAction.value = false
    lastSavedId = snapshot.id
    saveToolMap()
    celebrate(awards.paintedToday())
  } catch (err) {
    console.warn('autosave failed', err)
  }
}

/** Put the saved paint of the current picture back on the canvas. Returns true when something was restored. */
async function restoreSavedDrawing(): Promise<boolean> {
  const dc = drawCanvas.value
  if (!dc) return false
  // every picture has its own time-lapse
  clearTimeout(lapseTimer)
  lapseDirty = false
  timelapse.reset(dc.width, dc.height)
  if (!identity || !drawCtx) return false
  toolMap = null
  const rec = await getArtwork(identity.id)
  if (!rec) return false
  identity.done = !!rec.done
  try {
    const bmp = await createImageBitmap(rec.drawing)
    drawCtx.clearRect(0, 0, dc.width, dc.height)
    drawCtx.drawImage(bmp, 0, 0, dc.width, dc.height)
    await cover.load(rec.stickers)
    loadToolMap()
    scheduleJobCheck()
    await loadTimelapseOf(identity.id, bmp)
    bmp.close?.()
    return true
  } catch {
    return false
  }
}

/** The saved time-lapse of the picture; without one (a picture from before there was a time-lapse) the paint so far is its base. */
async function loadTimelapseOf(id: string, painted: ImageBitmap) {
  const dc = drawCanvas.value
  if (!dc) return
  const saved = await getTimelapse(id)
  const data = saved ? await unpackTimelapse(saved) : null
  if (data && data.w === Math.max(1, Math.round(dc.width * LOG_SCALE)) && data.h === Math.max(1, Math.round(dc.height * LOG_SCALE))) {
    timelapse.load(data)
    return
  }
  const c = document.createElement('canvas')
  c.width = timelapse.w
  c.height = timelapse.h
  c.getContext('2d')?.drawImage(painted, 0, 0, c.width, c.height)
  timelapse.base = await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), 'image/webp', 0.72))
}

function onVisibilityHidden() {
  if (document.visibilityState === 'hidden') void persistNow()
}

/**
 * Back is one step: from a picture to the main menu of the painting program (never page by page through the book),
 * and from the main menu out of the painting program into the app.
 */
/** The picture was opened from the statistics (the present): the way back leads there, with nothing started afresh. */
const retStats = computed(() => {
  const v = route.query.ret
  return typeof v === 'string' && v.startsWith('stats:') ? v.slice('stats:'.length) : null
})
async function backToStats() {
  const id = retStats.value
  if (!id) return false
  await persistWithNote()
  void router.replace({ name: 'app-adventure-stats', params: { journeyId: id } })
  return true
}

async function onBack() {
  if (savedFlash.value) return
  if (journalCtx.value) {
    await toJournal(false)
    return
  }
  if (advCtx.value) {
    await leaveToStage()
    return
  }
  if (await backToStats()) return
  if (hasImage.value) {
    await persistWithNote()
    bookCtx.value = null
    hasImage.value = false
    identity = null
    pdfDoc = null
    totalPages.value = 1
    currentPage.value = 1
    // the menu is the page before when the picture was opened from a book or the menu: a real step back
    goBackTo(router, { name: 'app-coloring', query: {} })
    void refreshMyWorks()
    return
  }
  goBackTo(router, { name: 'app-main' })
}

/** Back to the choose-a-picture screen; the picture is saved first. */
async function closePicture() {
  if (savedFlash.value) return
  if (journalCtx.value) {
    await toJournal(false)
    return
  }
  if (advCtx.value) {
    await leaveToStage()
    return
  }
  if (await backToStats()) return
  if (bookCtx.value) {
    await leaveToBook()
    return
  }
  await persistWithNote()
  hasImage.value = false
  identity = null
  pdfDoc = null
  totalPages.value = 1
  currentPage.value = 1
  void router.replace({ name: 'app-coloring', query: {} })
  void refreshMyWorks()
}

function askDelete(meta: ArtworkMeta) {
  deleteCandidate.value = meta
}

async function confirmDelete() {
  const meta = deleteCandidate.value
  deleteCandidate.value = null
  if (!meta) return
  await deleteArtwork(meta.id)
  void refreshMyWorks()
}

// ── Painting a coloring book -----------------------------------------------------------------
// Opened from a book (`?book=<id>&p=<n>`), the editor turns its pages like a real
// coloring book: every page keeps its own painting on the device, the arrows in the
// top bar go to the next and the previous page.

interface BookContext {
  bookId: string
  title: string
  pages: ColoringBookPage[]
  /** How many pictures are free, when the book has its own number. */
  freePages?: number | null
  /** 0-based index of the page on the canvas. */
  index: number
  /** Where the printed book is sold, if the book has a link. */
  shopLink?: string
}

const bookCtx = ref<BookContext | null>(null)
/** The text of the picture on the sheet (coloring books carry a short text and a Bible passage with each picture). */
const pageInfo = computed(() => {
  const ctx = bookCtx.value
  const p = ctx?.pages[ctx.index]
  return p && (p.text || p.reference) ? p : null
})
const textOpen = ref(false)

const navTotal = computed(() => (bookCtx.value ? bookCtx.value.pages.length : pdfDoc ? totalPages.value : 1))
const navCurrent = computed(() => (bookCtx.value ? bookCtx.value.index + 1 : currentPage.value))
const { loadBook } = useApiBooks()

const queryBook = computed<string>(() => (typeof route.query.book === 'string' ? route.query.book : ''))
const queryBookPage = computed<number>(() => {
  const n = Number(route.query.p)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
})

/** Opens the sheet that says where the rest of the book comes from. */
function upsellForBook(ctx: BookContext) {
  showUpsell('book', {
    bookId: ctx.bookId,
    kind: 'coloring',
    title: ctx.title,
    freePages: freePageCount('coloring', ctx.pages.length, ctx.freePages),
    totalPages: ctx.pages.length,
    shopLink: ctx.shopLink
  })
}

async function openBookPage(index: number) {
  const ctx = bookCtx.value
  if (!ctx) return
  // Only the free pictures of a locked book can be painted; a link to another page goes to the book's overview.
  const allowed = allowedPages(ctx.bookId, 'coloring', ctx.pages.length, ctx.freePages)
  if (index >= allowed) {
    void router.replace({ name: 'app-coloring-book', params: { bookId: ctx.bookId }, query: { p: String(index + 1) } })
    return
  }
  const i = Math.min(Math.max(0, index), ctx.pages.length - 1)
  const page = ctx.pages[i]!
  ctx.index = i
  pendingTitle = page.title
  await loadFromUrl(page.url, 'image', { bookId: ctx.bookId, page: page.n })
}

async function openBook(bookId: string, page: number) {
  isLoading.value = true
  try {
    const book = await loadBook(bookId)
    const pages = book ? coloringPagesOfBook(book as ApiBook, locale.value) : []
    if (!book || !pages.length) {
      bookCtx.value = null
      void router.replace({ name: 'app-coloring', query: {} })
      return
    }
    const loc = book.localizations as Record<string, { title?: string } | null | undefined>
    bookCtx.value = {
      bookId,
      title: loc[locale.value]?.title || loc.de?.title || bookId,
      pages,
      freePages: (book as ApiBook).freePages ?? null,
      index: 0,
      shopLink: pickLocalizedImage((book as ApiBook).etsyLink, contentLocale(locale.value)) || undefined
    }
  } catch (err) {
    console.error('coloring book load error', err)
    bookCtx.value = null
    return
  } finally {
    isLoading.value = false
  }
  await openBookPage(page - 1)
}

/** One page forward or back; the page on the canvas is saved first. */
async function gotoBookPage(delta: 1 | -1) {
  const ctx = bookCtx.value
  if (!ctx) return
  const next = ctx.index + delta
  if (next < 0 || next >= ctx.pages.length) return
  if (next >= allowedPages(ctx.bookId, 'coloring', ctx.pages.length, ctx.freePages)) {
    upsellForBook(ctx)
    return
  }
  await persistNow()
  await openBookPage(next)
  // keep the address in step so a reload comes back to the same page
  void router.replace({ name: 'app-coloring', query: { book: ctx.bookId, p: String(ctx.pages[next]!.n) } })
}

/** Back to the book's overview (the pages and how they look now). */
async function leaveToBook() {
  if (savedFlash.value) return
  const ctx = bookCtx.value
  await persistWithNote()
  if (ctx) {
    void router.replace({
      name: 'app-coloring-book',
      params: { bookId: ctx.bookId },
      query: { p: String(ctx.pages[ctx.index]?.n ?? 1) }
    })
  }
}

// ── Loading sources ----------------------------------------------------------

async function loadFromUrl(url: string, type: 'image' | 'pdf', inBook?: { bookId: string; page: number }) {
  if (!url) return
  identity = {
    id: pageArtworkId(url, 1),
    title: pendingTitle || t('app.coloring.defaultTitle'),
    kind: 'page',
    sourceUrl: url,
    sourceType: type,
    page: 1,
    bookId: inBook?.bookId,
    bookPage: inBook?.page
  }
  pendingTitle = ''
  isLoading.value = true
  try {
    if (type === 'pdf') {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`PDF fetch failed (${res.status})`)
      const buf = new Uint8Array(await res.arrayBuffer())
      await openPdfBytes(buf)
    } else {
      // A page of a book that was opened before comes from the device, so it works without a connection.
      const local = await cacheUrlToBlobUrl(url, inBook?.bookId)
      try {
        await openImageUrl(local)
      } finally {
        if (local !== url) URL.revokeObjectURL(local)
      }
    }
  } catch (err) {
    console.error('coloring source load error', err)
    alert((err as Error).message || 'Bild konnte nicht geladen werden')
  } finally {
    isLoading.value = false
  }
}

/** The longest side of the working canvases. */
function maxSheetSide(): number {
  const phone = Math.min(window.innerWidth, window.innerHeight) < 600
  const screenLong = Math.max(screen.width, screen.height) * Math.min(window.devicePixelRatio || 1, 2)
  return Math.round(Math.min(phone ? 1800 : 2600, Math.max(1400, screenLong * 1.25)))
}

function openImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const bg = bgCanvas.value, dc = drawCanvas.value
      if (!bg || !dc || !bgCtx || !drawCtx) return reject(new Error('canvas not ready'))
      // Every canvas of a picture costs 4 bytes a pixel and there are several: a phone gets a smaller working size than a
      // tablet, and nothing is bigger than the screen can show.
      const MAX_DIM = maxSheetSide()
      const r = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1)
      const w = Math.max(1, Math.round(img.width * r))
      const h = Math.max(1, Math.round(img.height * r))
      bg.width = w
      bg.height = h
      dc.width = w
      dc.height = h
      forgetRegions()
      syncPreview()
      bgCtx.fillStyle = '#ffffff'
      bgCtx.fillRect(0, 0, w, h)
      bgCtx.drawImage(img, 0, 0, w, h)
      drawCtx.clearRect(0, 0, w, h)
      pdfDoc = null
      totalPages.value = 1
      currentPage.value = 1
      hasImage.value = true
      fitCanvas()
      // the fields of the line art are found in a quiet moment, not at the first stroke
      if (stayInside.value) whenIdle(() => void ensureRegionMap(), 4000)
      void restoreSavedDrawing().then(() => {
        resetHistory()
        resolve()
      })
    }
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = url
  })
}

async function openPdfBytes(data: Uint8Array) {
  const pdfjsLib = await loadPdfjs()
  pdfDoc = await pdfjsLib.getDocument({ data, cMapUrl: PDFJS_CMAP, cMapPacked: true }).promise
  totalPages.value = pdfDoc.numPages
  currentPage.value = 1
  Object.keys(pageDrawings).forEach((k) => delete pageDrawings[Number(k)])
  const first = Math.min(Math.max(1, initialPdfPage), pdfDoc.numPages)
  initialPdfPage = 1
  await renderPdfPage(first)
}

function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => reject(r.error || new Error('Datei konnte nicht gelesen werden'))
    r.readAsArrayBuffer(file)
  })
}

async function openFile(file: File) {
  identity = null
  isLoading.value = true
  try {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      const buf = await readFileAsUint8Array(file)
      await openPdfBytes(buf)
    } else {
      const url = URL.createObjectURL(file)
      try {
        await openImageUrl(url)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
  } catch (err) {
    console.error('open file failed', err)
    alert((err as Error).message || 'Datei konnte nicht geladen werden')
  } finally {
    isLoading.value = false
  }
}

async function renderPdfPage(num: number) {
  if (!pdfDoc) return
  isLoading.value = true
  try {
    const page = await pdfDoc.getPage(num)
    const MAX_DIM = 4096
    const MAX_AREA = 16777216
    const baseVp = page.getViewport({ scale: 1 })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let s = dpr * 1.5
    s = Math.min(s, MAX_DIM / baseVp.width, MAX_DIM / baseVp.height)
    s = Math.min(s, Math.sqrt(MAX_AREA / (baseVp.width * baseVp.height)))
    s = Math.max(1, s)
    const vp = page.getViewport({ scale: s })
    const bg = bgCanvas.value, dc = drawCanvas.value
    if (!bg || !dc || !bgCtx || !drawCtx) return
    bg.width = Math.floor(vp.width)
    bg.height = Math.floor(vp.height)
    dc.width = bg.width
    dc.height = bg.height
    forgetRegions()
    syncPreview()
    bgCtx.fillStyle = '#ffffff'
    bgCtx.fillRect(0, 0, bg.width, bg.height)
    await page.render({ canvasContext: bgCtx, viewport: vp }).promise
    drawCtx.clearRect(0, 0, dc.width, dc.height)
    hasImage.value = true
    currentPage.value = num
    fitCanvas()

    if (identity && identity.sourceType === 'pdf') {
      identity.page = num
      identity.id = pageArtworkId(identity.sourceUrl, num)
    }
    const saved = pageDrawings[num]
    if (!saved) await restoreSavedDrawing()
    if (saved) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          drawCtx!.drawImage(img, 0, 0, dc.width, dc.height)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = saved
      })
      // the stickers of that page come from the saved picture
      await cover.load(identity ? (await getArtwork(identity.id))?.stickers : null)
    }
    resetHistory()
  } finally {
    isLoading.value = false
  }
}

function savePageDrawing() {
  const dc = drawCanvas.value
  if (!dc || !hasImage.value) return
  try {
    pageDrawings[currentPage.value] = dc.toDataURL('image/png')
  } catch {
    // tainted canvas etc — ignore
  }
}

function gotoPage(delta: 1 | -1) {
  if (bookCtx.value) {
    void gotoBookPage(delta)
    return
  }
  if (!pdfDoc) return
  const next = currentPage.value + delta
  if (next < 1 || next > totalPages.value) return
  savePageDrawing()
  void persistNow().then(() => renderPdfPage(next))
}

// ── Fit / zoom ---------------------------------------------------------------

// `fitCanvas` is called from many places (after image load, on resize, on
// fullscreen toggle). On the very first source load the grid hasn't always
// settled when our promise resolves — `mainEl.getBoundingClientRect()`
// returns zero dimensions and the canvas-wrap stays at 0×0. We defer the
// measurement to the next animation frame, and retry once if the layout
// still hasn't shaken out (mobile browsers sometimes need a second tick
// after dvh recalculation).
let fitRetry = 0
function fitCanvas() {
  requestAnimationFrame(() => {
    const bg = bgCanvas.value, wrap = canvasWrap.value, m = mainEl.value
    if (!bg || !wrap || !m) return
    // Use `clientWidth`/`clientHeight` instead of `getBoundingClientRect`
    // because the global page-pop-scale route transition wraps every
    // mounted view in a transient `transform: scale(0.65 → 1)`. The bounding
    // rect reports the *transformed* size, so an image that finishes
    // loading mid-animation would lock the canvas at 65% of the final
    // layout. `clientWidth` reads the layout box unaffected by transforms.
    const r = { width: m.clientWidth, height: m.clientHeight }
    if (r.width <= 0 || r.height <= 0) {
      if (fitRetry < 4) {
        fitRetry++
        requestAnimationFrame(fitCanvas)
      }
      return
    }
    fitRetry = 0
    fitCanvasInner(bg, wrap, r as DOMRect)
  })
}

// Breathing room around the paper; the top bar floats over the top edge, so the paper starts below it.
const PAGE_INSET = 10
const topInset = () => (isFullscreen.value ? PAGE_INSET : 62)

// The colour box at the bottom edge lies over the paper; only its little tab keeps room (and not in fullscreen).
/** Room for the little arrow tab that stays at the bottom edge while the colour box is hidden. */
const FOLDED_TAB = 30
const SHELF_KEY = 'lk-coloring-box-open'
function readShelfOpen(): boolean {
  try {
    return localStorage.getItem(SHELF_KEY) !== '0'
  } catch {
    return true
  }
}
const shelfOpen = ref(readShelfOpen())
const shelfEl = ref<InstanceType<typeof ColoringShelf> | null>(null)
function bottomInset(): number {
  // The colour box lies over the picture when it is pulled out: the paper never gets smaller (or moves) for it.
  if (isFullscreen.value || !hasImage.value) return PAGE_INSET
  return FOLDED_TAB
}

/** In fullscreen the box is not part of the layout: it is pulled out over the picture and goes away again. */
const shelfPeek = ref(false)
const shelfVisible = computed(() => (isFullscreen.value ? shelfPeek.value : shelfOpen.value))

function toggleShelf() {
  if (isFullscreen.value) {
    shelfPeek.value = !shelfPeek.value
    return
  }
  shelfOpen.value = !shelfOpen.value
  try {
    localStorage.setItem(SHELF_KEY, shelfOpen.value ? '1' : '0')
  } catch {
    // private window: the choice just is not remembered
  }
}

// ── The tool bar: where it sits and how it is moved (see `use/useToolbarDock.ts`) ------------------------------
const { dock, carry, justCarried, toolbarStyle, onHandleDown, onHandleMove, onHandleUp, setDock, swallowCarryClick } = useToolbarDock({
  room: () => shelfRoom(),
  fullscreen: isFullscreen
})

/** The zoom buttons show with a mouse, and on a touch screen as soon as the sheet is zoomed. */
const showZoom = computed(() => finePointer.value || zoomPct.value !== 100 || zoomBarKept.value)
/** The corner of the picture where undo and redo sit: the one away from the tool bar. */
const cornerSide = computed(() => (dock.value.edge === 'right' ? 'left' : 'right'))
/** The room of the colour box at the bottom edge is always kept free for the tool bar, so the bar never moves when the box comes out. */
const shelfRoom = () => (isFullscreen.value ? 0 : (shelfEl.value?.height() || 134) + 6)
const cornerStyle = computed<Record<string, string>>(() => ({ '--lift': `${shelfRoom()}px` }))
const pickerLift = computed(() => shelfRoom())

/** A tap on the folded tab brings the bar back; the click that ends a carried tab must not. */
function onTabClick() {
  if (swallowCarryClick()) return
  armed = false
  toolbarOpen.value = true
}

function fitCanvasInner(bg: HTMLCanvasElement, wrap: HTMLDivElement, r: DOMRect) {
  // Contain-fit dimensions — the largest the unscaled artwork can be
  // while staying entirely inside the canvas area. Centering is then
  // handled inside applyTransform based on whether we're in fullscreen.
  const aw = r.width - PAGE_INSET * 2
  const ah = r.height - topInset() - bottomInset()
  const ratio = bg.width / bg.height
  let w = aw, h = aw / ratio
  if (h > ah) {
    h = ah
    w = ah * ratio
  }
  w = Math.max(1, Math.round(w))
  h = Math.max(1, Math.round(h))
  zoom.baseW = w
  zoom.baseH = h
  wrap.style.width = `${w}px`
  wrap.style.height = `${h}px`
  zoom.scale = 1
  zoom.panX = 0
  zoom.panY = 0
  applyTransform()
}

function applyTransform() {
  const wrap = canvasWrap.value, m = mainEl.value
  if (!wrap || !m) return
  // Layout-box dims so the math survives the route-transition's
  // page-pop-scale transform (see fitCanvas).
  const r = { width: m.clientWidth, height: m.clientHeight }
  // transform-origin is 0,0 on the wrap, so the visible size is the
  // scaled dims; centring the scaled box puts the artwork in the
  // geometric middle of the canvas area in every mode.
  const sw = zoom.baseW * zoom.scale
  const sh = zoom.baseH * zoom.scale
  const baseLeft = PAGE_INSET + (r.width - PAGE_INSET * 2 - sw) / 2
  const baseTop = topInset() + (r.height - topInset() - bottomInset() - sh) / 2
  // the sheet turns about its middle: the same list of functions in both positions, so it turns smoothly
  const cx = baseLeft + zoom.panX + sw / 2
  const cy = baseTop + zoom.panY + sh / 2
  zoomPct.value = Math.round(zoom.scale * 100)
  // while the sheet is moved or zoomed the flashes rest, so the phone only has to move the picture
  twinkling.hold()
  wrap.style.transform = `translate(${cx}px, ${cy}px) rotate(${rotation.value}deg) scale(${zoom.scale}) translate(${-zoom.baseW / 2}px, ${-zoom.baseH / 2}px)`
}

/** How far the sheet is turned, from −90 to 90 degrees; 0 is the normal position. */
const rotation = ref(0)

/** Turns the sheet (about its middle); near 0 it clicks into the normal position. `smooth` lets it glide there. */
function setRotation(deg: number, smooth = false) {
  let v = Math.round(Math.max(-90, Math.min(90, deg)))
  if (Math.abs(v) <= 3) v = 0
  if (v === rotation.value) return
  const wrap = canvasWrap.value
  if (wrap && smooth) {
    wrap.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
    window.setTimeout(() => {
      wrap.style.transition = ''
    }, 460)
  }
  rotation.value = v
  applyTransform()
}

// ── Zoom and move with the mouse (two fingers do it on a touch screen) -----------------------------------------------
const zoomPct = ref(100)
/**
 * The percentage button stays for a moment after the sheet is back at 100 %: while two fingers zoom through 100 % it must not
 * come and go (the whole top bar shook with it).
 */
const zoomBarKept = ref(false)
let zoomBarTimer: ReturnType<typeof setTimeout> | undefined
watch(zoomPct, (v) => {
  clearTimeout(zoomBarTimer)
  if (v !== 100) zoomBarKept.value = true
  else zoomBarTimer = setTimeout(() => (zoomBarKept.value = false), 2500)
})
/** The hand tool: dragging moves the sheet instead of painting (for a mouse). */
const panMode = ref(false)
const spaceHeld = ref(false)
const finePointer = ref(typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches)
let panning: { x: number; y: number; px: number; py: number; id: number } | null = null

/** Sets the zoom; the point under (clientX, clientY) stays where it is (the middle of the sheet without a point). */
function zoomAt(next: number, clientX?: number, clientY?: number) {
  const wrap = canvasWrap.value
  if (!wrap) return
  const s1 = zoom.scale
  const s2 = Math.min(zoom.maxScale, Math.max(zoom.minScale, next))
  if (Math.abs(s2 - s1) < 0.0005) return
  if (clientX !== undefined && clientY !== undefined) {
    const wr = wrap.getBoundingClientRect()
    const k = 1 - s2 / s1
    zoom.panX += (clientX - (wr.left + wr.width / 2)) * k
    zoom.panY += (clientY - (wr.top + wr.height / 2)) * k
  }
  zoom.scale = s2
  clampPan()
  applyTransform()
  updateCursorRing()
}

function zoomStep(factor: number) {
  zoomAt(zoom.scale * factor)
}

/** The whole sheet again, in the middle. */
function resetZoom() {
  zoom.scale = 1
  zoom.panX = 0
  zoom.panY = 0
  applyTransform()
  updateCursorRing()
}

function onWheel(e: WheelEvent) {
  if (!hasImage.value) return
  if (stampWheel(e)) return
  e.preventDefault()
  // a trackpad pinch arrives as a wheel with the control key: finer steps
  zoomAt(zoom.scale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY)
}

function startPan(e: PointerEvent) {
  panning = { x: e.clientX, y: e.clientY, px: zoom.panX, py: zoom.panY, id: e.pointerId }
  try {
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  } catch {
    // the move events of the sheet still arrive
  }
}

function movePan(e: PointerEvent) {
  if (!panning) return
  zoom.panX = panning.px + (e.clientX - panning.x)
  zoom.panY = panning.py + (e.clientY - panning.y)
  clampPan()
  applyTransform()
}

/**
 * How far the sheet may be moved (with two fingers, the hand tool or the mouse): in every position, also when the whole sheet is in view,
 * so that it can be pushed out from under the tool bar and the colour box. A good part of it always stays on the screen, so it is never lost.
 */
function clampPan() {
  const m = mainEl.value
  if (!m) return
  // Layout-box dims (see fitCanvas note).
  const W = m.clientWidth
  const H = m.clientHeight
  const sw = zoom.baseW * zoom.scale
  const sh = zoom.baseH * zoom.scale
  // where the sheet lies when it is not moved (see applyTransform), measured from the middle of the whole screen
  const homeY = topInset() + (H - topInset() - bottomInset()) / 2 - H / 2
  const keepX = Math.min(sw, W) * 0.4
  const keepY = Math.min(sh, H) * 0.4
  const maxX = Math.max(0, (W + sw) / 2 - keepX)
  const maxY = Math.max(0, (H + sh) / 2 - keepY)
  zoom.panX = Math.max(-maxX, Math.min(maxX, zoom.panX))
  zoom.panY = Math.max(-maxY - homeY, Math.min(maxY - homeY, zoom.panY))
}

function onResize() {
  fitCanvas()
}

// ── Cursor ring --------------------------------------------------------------

function hexToRgba(hex: string, a: number) {
  if (!hex) return `rgba(0,0,0,${a})`
  const c = hex.replace('#', '')
  if (c.length === 3) {
    const r = parseInt(c[0]! + c[0], 16)
    const g = parseInt(c[1]! + c[1], 16)
    const b = parseInt(c[2]! + c[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  if (c.length < 6) return `rgba(0,0,0,${a})`
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Canvas pixels of one brush unit: the picture's width scales it. */
const brushPx = () => (activeTool.value === 'eraser' ? eraserSize.value : brushSize.value) * ((drawCanvas.value?.width ?? 1000) / 1000)

/** Screen pixels per canvas pixel (zoom included). */
const screenPerCanvas = () => {
  const dc = drawCanvas.value
  return dc && dc.width ? (zoom.baseW * zoom.scale) / dc.width : 1
}

/** How wide each tool draws, as a factor of the brush size (at a steady pressure): round tip, and a tip with a shape. */
const RING_FACTOR: Record<string, [number, number]> = {
  pencil: [0.6, 0.6],
  graphite: [0.42, 0.42],
  whitepencil: [0.5, 0.5],
  felt: [1.05, 1.05],
  watercolor: [0.9, 1.1],
  chalk: [1.1, 1.1],
  glitter: [1.05, 1.05],
  oil: [0.8, 1],
  eraser: [1.5, 1.5],
  fill: [0.5, 0.5],
  pipette: [0.5, 0.5]
}

/** The pen's pressure when it hovers: nearly none, so the ring starts small. */
let ringPressure = 0.7

function updateCursorRing() {
  const ring = cursorRing.value
  if (!ring) return
  const t = activeTool.value
  const isErase = t === 'eraser'
  const k = screenPerCanvas()
  if (t === 'stamp') {
    // the stamp's size, as a soft round mark in its colour
    const d = Math.max(10, stampPx() * k)
    ring.style.width = `${d}px`
    ring.style.height = `${d}px`
    ring.style.borderRadius = '50%'
    ring.style.transform = ''
    ring.classList.remove('eraser-cursor')
    ring.style.background = hexToRgba(stampSet.value.color, 0.14)
    return
  }
  const painting = t !== 'fill' && t !== 'pipette' && !isErase
  const tip = painting ? tipOfTool(t) : ROUND_TIP
  const [roundF, shapeF] = RING_FACTOR[t] ?? [1, 1]
  // the width follows the pressure, like the stroke does
  const wf = isErase || !painting ? 1 : widthFactor(drawing ? pressureNow : ringPressure)
  if (!tip.round) {
    // The cursor shows the tip that is chosen, turned the way it paints.
    const long = Math.max(8, brushPx() * k * shapeF * wf)
    ring.style.width = `${long}px`
    ring.style.height = `${Math.max(4, long * tip.ratio)}px`
    ring.style.borderRadius = tip.kind === 'ellipse' ? '50%' : '3px'
    ring.style.transform = `translate(-50%, -50%) rotate(${(tip.angle * 180) / Math.PI}deg)`
  } else {
    const d = Math.max(6, brushPx() * k * roundF * wf)
    ring.style.width = `${d}px`
    ring.style.height = `${d}px`
    ring.style.borderRadius = '50%'
    ring.style.transform = ''
  }
  ring.classList.toggle('eraser-cursor', isErase)
  ring.style.background = isErase ? 'rgba(192, 82, 106, 0.10)' : hexToRgba(color.value, 0.15)
}

// ── Drawing engine ----------------------------------------------------------
// The looks themselves (paper grain, wax, wet rim, bristles…) live in
// `utils/coloringBrushes.ts`; this part decides what happens on which touch.

interface PaintPos {
  x: number
  y: number
  pressure: number
  /** True for a pen (Apple Pencil, S Pen), whose pressure is real. */
  pen: boolean
}

function getPosFromClient(cx: number, cy: number, pressure = 0.7, pen = false): PaintPos {
  const dc = drawCanvas.value!
  const r = dc.getBoundingClientRect()
  const p = screenToSheet(cx, cy, r, rotation.value, dc.width, dc.height)
  return { x: p.x, y: p.y, pressure, pen }
}

function syncPreview() {
  const dc = drawCanvas.value, pc = previewCanvas.value
  if (!dc || !pc) return
  if (pc.width !== dc.width) pc.width = dc.width
  if (pc.height !== dc.height) pc.height = dc.height
  if (sheetDims.value.w !== dc.width || sheetDims.value.h !== dc.height) sheetDims.value = { w: dc.width, h: dc.height }
  previewCtx = pc.getContext('2d', { willReadFrequently: true })
  cover.size(dc.width, dc.height)
  twinkling.sync()
}

// Eyedropper: the colour of the picture (paint plus line art) at a point.
function sampleColor(x: number, y: number): string | null {
  const bg = bgCanvas.value, dc = drawCanvas.value
  if (!bg || !dc) return null
  const px = Math.max(0, Math.min(bg.width - 1, Math.round(x)))
  const py = Math.max(0, Math.min(bg.height - 1, Math.round(y)))
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1, 1)
  ctx.drawImage(dc, px, py, 1, 1, 0, 0, 1, 1)
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(bg, px, py, 1, 1, 0, 0, 1, 1)
  const d = ctx.getImageData(0, 0, 1, 1).data
  const hex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${hex(d[0]!)}${hex(d[1]!)}${hex(d[2]!)}`
}

// ── Fields of the line art: stay inside the lines, and the bucket that does not leak -------------

/** "In den Linien bleiben": a stroke only paints in the field where it started. Off at the start; remembered between visits. */
const STAY_KEY = 'lk-coloring-stay-inside-v3'
function readStay(): boolean {
  try {
    return localStorage.getItem(STAY_KEY) === '1'
  } catch {
    return false
  }
}
const stayInside = ref(readStay())

/**
 * Colours that lie over each other and get darker (the see-through look of pencil, marker and watercolour) are not offered: going over the
 * same place twice is mostly an accident and leaves a darker spot, so a stroke replaces the paint under it.
 */
const overlap = ref(false)
watch(stayInside, (on) => {
  if (on && hasImage.value) whenIdle(() => void ensureRegionMap(), 4000)
  try {
    localStorage.setItem(STAY_KEY, on ? '1' : '0')
  } catch {
    // not remembered in a private window
  }
})

let regionMap: RegionMap | null = null
/** The field a stroke stays in: as a picture (to cut the stroke layer) and as numbers (for the oil paint). */
interface MaskInfo {
  canvas: HTMLCanvasElement
  alpha: Uint8Array
  /** Width of `alpha` and how many picture pixels one of its pixels is. */
  w: number
  scale: number
}

let maskInfo: MaskInfo | null = null
let maskLabel = -1
/** The mask of the stroke that is on the canvas now (`null` = paints everywhere). */
let strokeMask: MaskInfo | null = null
/** For the oil paint: how much of the new paint a place accepts. */
let oilAllow: ((x: number, y: number) => number) | undefined

/** The picture changed: the fields have to be found again. */
function forgetRegions() {
  regionMap = null
  maskInfo = null
  maskLabel = -1
}

function ensureRegionMap(): RegionMap | null {
  if (regionMap) return regionMap
  const bg = bgCanvas.value
  if (!bg || !bg.width || !bg.height) return null
  // Very large pictures are looked at in half size: the fields do not need every pixel.
  const scale = Math.max(1, Math.ceil(Math.max(bg.width, bg.height) / 2200))
  const c = document.createElement('canvas')
  c.width = Math.ceil(bg.width / scale)
  c.height = Math.ceil(bg.height / scale)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bg, 0, 0, c.width, c.height)
  const gap = Math.max(1, Math.round(gapFor(bg.width) / scale))
  regionMap = buildRegionMap(ctx.getImageData(0, 0, c.width, c.height), scale, gap)
  return regionMap
}

/** The field under a point as a mask, or `null` when the touch is in no field. */
function maskAt(x: number, y: number): MaskInfo | null {
  const map = ensureRegionMap()
  const dc = drawCanvas.value
  if (!map || !dc) return null
  const label = labelAt(map, x / map.scale, y / map.scale)
  if (label <= 0) return null
  if (label === maskLabel && maskInfo && maskInfo.canvas.width === dc.width && maskInfo.canvas.height === dc.height) return maskInfo
  const alpha = regionMaskAlpha(map, label, map.gap + 1)
  const small = document.createElement('canvas')
  small.width = map.w
  small.height = map.h
  const sctx = small.getContext('2d')!
  const img = sctx.createImageData(map.w, map.h)
  for (let i = 0; i < alpha.length; i++) img.data[i * 4 + 3] = alpha[i]!
  sctx.putImageData(img, 0, 0)
  const full = maskInfo?.canvas ?? document.createElement('canvas')
  full.width = dc.width
  full.height = dc.height
  const fctx = full.getContext('2d')!
  fctx.clearRect(0, 0, full.width, full.height)
  fctx.drawImage(small, 0, 0, full.width, full.height)
  maskInfo = { canvas: full, alpha, w: map.w, scale: map.scale }
  maskLabel = label
  return maskInfo
}

function allowOf(m: MaskInfo): (x: number, y: number) => number {
  return (x, y) => (m.alpha[(((y / m.scale) | 0) * m.w) + ((x / m.scale) | 0)] ?? 0) / 255
}

/** Takes away what was painted outside the field, in the area of the last piece of the stroke. */
function clipToMask(ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
  const sx = Math.max(0, Math.floor(Math.min(x0, x1)))
  const sy = Math.max(0, Math.floor(Math.min(y0, y1)))
  const ex = Math.min(mask.width, Math.ceil(Math.max(x0, x1)))
  const ey = Math.min(mask.height, Math.ceil(Math.max(y0, y1)))
  if (ex <= sx || ey <= sy) return
  ctx.save()
  // `destination-in` works on the whole canvas, so without a clip rectangle everything outside the piece that is
  // drawn here would be wiped (the whole stroke would vanish except its last piece).
  ctx.beginPath()
  ctx.rect(sx, sy, ex - sx, ey - sy)
  ctx.clip()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.globalAlpha = 1
  ctx.drawImage(mask, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy)
  ctx.restore()
}

// The paint bucket itself is in `utils/coloringFill.ts`; this part hands it the pixels of the picture.
function floodFill(sx: number, sy: number) {
  const dc = drawCanvas.value, bg = bgCanvas.value
  if (!dc || !bg || !drawCtx || !bgCtx) return
  const cw = dc.width, ch = dc.height
  if (sx < 0 || sy < 0 || sx >= cw || sy >= ch) return
  const merged = document.createElement('canvas')
  merged.width = cw
  merged.height = ch
  const mCtx = merged.getContext('2d', { willReadFrequently: true })!
  paintComposite(mCtx, cw, ch, false, false)
  const paint = drawCtx.getImageData(0, 0, cw, ch)
  const c = color.value
  const did = floodFillPaint({
    merged: mCtx.getImageData(0, 0, cw, ch).data,
    paint: paint.data,
    w: cw,
    h: ch,
    x: sx,
    y: sy,
    r: parseInt(c.slice(1, 3), 16),
    g: parseInt(c.slice(3, 5), 16),
    b: parseInt(c.slice(5, 7), 16),
    a: Math.round(opacity.value * 255),
    map: ensureRegionMap()
  })
  if (did) drawCtx.putImageData(paint, 0, 0)
}

// While a pen (Apple Pencil, S Pen) is in use, fingers and the resting palm are
// ignored, otherwise a hand on the tablet paints along.
let lastPenAt = 0
const PEN_GRACE_MS = 1500
const penInUse = () => Date.now() - lastPenAt < PEN_GRACE_MS

/** Pen pressure 0.1–1; a mouse or finger paints at a steady, medium pressure. */
function pressureOf(e: PointerEvent): number {
  return e.pointerType === 'pen' && e.pressure !== 0.5 ? Math.max(0.1, e.pressure) : 0.7
}

/**
 * A pen's button (the S Pen button, the other end of a pen) is pressed. Browsers report it as the barrel
 * button (bit 2), the second button (bit 4) or the eraser end (bit 32) of `buttons`.
 */
const penButtonDown = (e: PointerEvent) =>
  e.pointerType === 'pen' && ((e.buttons & (2 | 4 | 32)) !== 0 || (e.type === 'pointerdown' && (e.button === 2 || e.button === 5)))

/**
 * `?penlog=1` in the address shows what the pen reports (type, button, buttons), so a pen button that does nothing can be read off the screen.
 */
const penLog = ref('')
const penLogOn = typeof location !== 'undefined' && /[?&]penlog=1/.test(location.href)
function logPen(e: PointerEvent) {
  if (penLogOn && e.pointerType !== 'touch') penLog.value = `${e.pointerType} ${e.type} button=${e.button} buttons=${e.buttons} p=${e.pressure.toFixed(2)}`
}

/** While the button is held the pen erases; letting go brings the chosen tool back. */
function followPenButton(e: PointerEvent) {
  logPen(e)
  const want: ToolId | null = penButtonDown(e) ? 'eraser' : null
  if (toolOverride.value !== want) toolOverride.value = want
}

function onPointerDown(e: PointerEvent) {
  ignoreUntilUp = false
  if (e.pointerType === 'pen') lastPenAt = Date.now()
  if (!hasImage.value) return
  if (e.pointerType === 'pen') followPenButton(e)
  if (activeTouchId !== null) return
  if (e.pointerType === 'touch') return
  // the middle mouse button, the space key or the hand tool move the sheet instead of painting
  if (e.pointerType === 'mouse' && (panMode.value || spaceHeld.value || e.button === 1)) {
    e.preventDefault()
    startPan(e)
    return
  }
  // this press only closed the tool bar: nothing is painted, and the rest of the touch paints nothing
  if (swallowPress) {
    swallowPress = false
    ignoreUntilUp = true
    return
  }
  e.preventDefault()
  try {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  } catch { /* ignore */
  }
  // on the stamp that was just placed the press waits a moment: held still it takes hold of the stamp
  if (stampDotStart(`p${e.pointerId}`, e.clientX, e.clientY) || stampPressStart(`p${e.pointerId}`, e.clientX, e.clientY)) return
  beginStroke(getPosFromClient(e.clientX, e.clientY, pressureOf(e), e.pointerType === 'pen'))
}

function onPointerMove(e: PointerEvent) {
  const ring = cursorRing.value
  if (ring) {
    ring.style.left = `${e.clientX}px`
    ring.style.top = `${e.clientY}px`
    ring.classList.add('show')
  }
  if (e.pointerType === 'pen') lastPenAt = Date.now()
  // The button can be pressed in the air before the tip touches: the cursor already shows the eraser.
  if (e.pointerType === 'pen') followPenButton(e)
  // the ring follows the pen's pressure
  const hover = e.pointerType === 'pen' ? (e.pressure > 0 ? Math.max(0.1, e.pressure) : 0.1) : 0.7
  if (hover !== ringPressure || drawing) {
    ringPressure = hover
    updateCursorRing()
  }
  if (panning && e.pointerId === panning.id) {
    movePan(e)
    return
  }
  if ((stampPress || stampGrab || stampDot) && e.pointerType !== 'touch' && stampHandleMove(`p${e.pointerId}`, e.clientX, e.clientY)) return
  if (!drawing || ignoreUntilUp) return
  if (activeTouchId !== null) return
  if (e.pointerType === 'touch') return
  e.preventDefault()
  // Button pressed or let go in the middle of a line: that line ends and a new one starts with the other tool.
  if (e.pointerType === 'pen' && activeTool.value !== strokeTool) {
    finishStroke()
    beginStroke(getPosFromClient(e.clientX, e.clientY, pressureOf(e), true))
    return
  }
  // A pen reports many more points than there are frames; using all of them
  // keeps fast curves smooth and the pressure along the line exact.
  const pen = e.pointerType === 'pen'
  const points = pen && e.getCoalescedEvents ? e.getCoalescedEvents() : []
  if (points.length) {
    const minStep = Math.max(1.5, brushPx() * 0.1)
    for (const c of points) {
      const p = getPosFromClient(c.clientX, c.clientY, pressureOf(c), true)
      if (Math.hypot(p.x - lastX, p.y - lastY) < minStep) continue
      continueStroke(p)
    }
  } else {
    continueStroke(getPosFromClient(e.clientX, e.clientY, pressureOf(e), pen))
  }
  flushStroke()
}

function onPointerEnd(e: PointerEvent) {
  if (panning && e.pointerId === panning.id) panning = null
  try {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
  } catch { /* ignore */
  }
  if (e.pointerType !== 'touch') stampHandleEnd(`p${e.pointerId}`)
  finishStroke()
  ignoreUntilUp = false
  // the pen button only counts while it is held down
  if (e.pointerType === 'pen' && toolOverride.value && !penButtonDown(e)) toolOverride.value = null
}

/** The page lost the pen (for example the screen changed size): that stroke ends, the rest of the touch paints nothing. */
function onPointerLost() {
  abortStroke()
}

function onPointerLeaveCanvas() {
  cursorRing.value?.classList.remove('show')
  if (!drawing) toolOverride.value = null
}

const gesture = {
  mode: null as null | 'draw' | 'pinch',
  startDist: 0,
  startScale: 1,
  startPanX: 0,
  startPanY: 0,
  startMidX: 0,
  startMidY: 0
}

function tDist(t1: Touch, t2: Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function tMid(t1: Touch, t2: Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

const touchPressure = (t: Touch) => (t.force && t.force > 0 ? Math.max(0.1, Math.min(1, t.force)) : 0.7)

function onTouchStart(e: TouchEvent) {
  ignoreUntilUp = false
  if (!hasImage.value) return
  e.preventDefault()
  // this press only closed the tool bar: nothing is painted
  if (swallowPress) {
    swallowPress = false
    return
  }
  if (penInUse()) return
  if (e.touches.length >= 2) {
    // a held stamp takes the second finger: it sizes and turns the stamp
    if (stampGrab) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const c = e.changedTouches[i]!
        stampAddFinger(`t${c.identifier}`, c.clientX, c.clientY)
      }
      return
    }
    // a second finger while the dot is held changes nothing
    if (stampDot) return
    stampPressCancel()
    activeTouchId = null
    if (drawing) finishStroke()
    gesture.mode = 'pinch'
    const t1 = e.touches[0]!, t2 = e.touches[1]!
    gesture.startDist = tDist(t1, t2)
    gesture.startScale = zoom.scale
    gesture.startPanX = zoom.panX
    gesture.startPanY = zoom.panY
    const mid = tMid(t1, t2)
    gesture.startMidX = mid.x
    gesture.startMidY = mid.y
    return
  }
  if (activeTouchId !== null) return
  // one finger paints only on the paper; beside it, it does nothing (a second finger can still start the zoom)
  if (!(e.target instanceof Element && e.target.closest('.ac-canvas-wrap'))) return
  gesture.mode = 'draw'
  const t = e.changedTouches[0]
  if (!t) return
  activeTouchId = t.identifier
  if (stampDotStart(`t${t.identifier}`, t.clientX, t.clientY) || stampPressStart(`t${t.identifier}`, t.clientX, t.clientY)) return
  beginStroke(getPosFromClient(t.clientX, t.clientY, touchPressure(t), false))
}

function onTouchMove(e: TouchEvent) {
  if (!hasImage.value) return
  e.preventDefault()
  if (stampPress || stampGrab || stampDot) {
    let used = false
    for (let i = 0; i < e.changedTouches.length; i++) {
      const c = e.changedTouches[i]!
      if (stampHandleMove(`t${c.identifier}`, c.clientX, c.clientY)) used = true
    }
    if (used) return
  }
  if (gesture.mode === 'pinch' && e.touches.length >= 2) {
    const t1 = e.touches[0]!, t2 = e.touches[1]!
    const ratio = tDist(t1, t2) / gesture.startDist
    const mid = tMid(t1, t2)
    let s = gesture.startScale * ratio
    s = Math.max(zoom.minScale, Math.min(zoom.maxScale, s))
    zoom.scale = s
    zoom.panX = gesture.startPanX + (mid.x - gesture.startMidX)
    zoom.panY = gesture.startPanY + (mid.y - gesture.startMidY)
    clampPan()
    applyTransform()
    updateCursorRing()
    return
  }
  if (gesture.mode !== 'draw' || activeTouchId === null || !drawing || ignoreUntilUp) return
  let t: Touch | null = null
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i]!.identifier === activeTouchId) {
      t = e.changedTouches[i]!
      break
    }
  }
  if (!t) return
  const ring = cursorRing.value
  if (ring) {
    ring.style.left = `${t.clientX}px`
    ring.style.top = `${t.clientY}px`
  }
  continueStroke(getPosFromClient(t.clientX, t.clientY, touchPressure(t), false))
  flushStroke()
}

function onTouchEnd(e: TouchEvent) {
  if (!hasImage.value) return
  e.preventDefault()
  if (stampPress || stampGrab || stampDot) {
    for (let i = 0; i < e.changedTouches.length; i++) stampHandleEnd(`t${e.changedTouches[i]!.identifier}`)
  }
  if (gesture.mode === 'pinch') {
    if (e.touches.length < 2) gesture.mode = null
    return
  }
  if (activeTouchId === null) return
  let ended = false
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i]!.identifier === activeTouchId) {
      ended = true
      break
    }
  }
  if (!ended) return
  activeTouchId = null
  gesture.mode = null
  finishStroke()
}

// One stroke. The tools that are see-through or dusty (pencil, graphite, felt, watercolour, chalk) first paint the plain
// shape of the stroke into the stroke layer (`previewCanvas`). After every piece of the stroke that layer is laid onto a
// copy of the picture as it was before the stroke (`baseCanvas`), with the tool's own look. So the paint is shown exactly
// as it will stay, and nothing changes when the pen is lifted. Oil paint and the eraser work straight on the picture.
let activeLayered: LayeredTool | null = null
let strokeState = newStrokeState()
let oilState = newOilState('#000000')
let strokeBounds = emptyBounds()
/** What was painted since the picture was last updated. */
let dirty = emptyBounds()
/** The tool the stroke on the canvas was started with; a pen button pressed in the middle starts a new stroke. */
let strokeTool: ToolId = 'pencil'
/** The picture before the stroke, and (for watercolour and felt) the finished look of the stroke layer. */
let baseCanvas: HTMLCanvasElement | null = null
let shapedCanvas: HTMLCanvasElement | null = null
let shapeOpts: ShapeOptions | null = null
/** Pen pressure, smoothed along the stroke so the line gets thicker and thinner softly. */
let pressureNow = 0.7

function smoothPressure(p: number, first: boolean): number {
  pressureNow = first ? p : pressureNow + (p - pressureNow) * 0.4
  return pressureNow
}

/** Copies the picture as it is now into `baseCanvas`: the "before" of the action that starts. */
function takeBase() {
  const dc = drawCanvas.value
  if (!dc) return
  baseCanvas = sizedCanvas(baseCanvas, dc.width, dc.height)
  const bctx = baseCanvas.getContext('2d', { willReadFrequently: true })!
  bctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height)
  bctx.drawImage(dc, 0, 0)
}

function sizedCanvas(c: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  const el = c ?? document.createElement('canvas')
  if (el.width !== w) el.width = w
  if (el.height !== h) el.height = h
  return el
}

// ── Quick shapes: hold the pen still and the stroke turns into the clean figure ──────────────────────────────────────────────
// An open stroke becomes a straight line, a closed one a circle, an oval, a rectangle, a triangle or another corner figure (see
// `utils/quickShape.ts`). The line goes on following the finger afterwards, and its ends click onto the ends of lines that are there.
const HOLD_SHAPE_MS = 480
/** The finger may wobble this far (screen pixels) while it holds still. */
const HOLD_SLOP_PX = 7
/** A line end clicks onto another end that is this close (screen pixels). */
const MAGNET_PX = 26
/** The shortest stroke (screen pixels) that turns into a shape. */
const SHAPE_MIN_PX = 28
let strokePts: Pt[] = []
let holdTimer: ReturnType<typeof setTimeout> | undefined
let holdAnchor: Pt = { x: 0, y: 0 }
let shapePressure = 0.7
/** The shape the held stroke has turned into (`null`: the stroke is as it was drawn). */
let shapeHold: { shape: QuickShape; endSnapped: boolean } | null = null
/** The ends of the lines and the corners of the figures on the picture, with how many steps of the history there were when they were made. */
let shapeAnchors: (Pt & { depth: number })[] = []

/** Only the painting tools make shapes: the eraser, the bucket, the pipette and the stamps do not. */
const makesShapes = (t: ToolId) => t !== 'eraser' && t !== 'fill' && t !== 'pipette' && t !== 'stamp'

function armShapeHold(p: Pt) {
  clearTimeout(holdTimer)
  holdAnchor = { x: p.x, y: p.y }
  if (shapeHold || !makesShapes(strokeTool)) return
  holdTimer = setTimeout(takeShape, HOLD_SHAPE_MS)
}

function liveAnchors(): Pt[] {
  return shapeAnchors.filter((a) => a.depth <= history.depth)
}

function addAnchors(list: Pt[]) {
  const depth = history.depth
  shapeAnchors = [...shapeAnchors, ...list.map((a) => ({ x: a.x, y: a.y, depth }))].slice(-80)
}

/** The stroke was held still: if it is a figure it is drawn again, clean. */
function takeShape() {
  holdTimer = undefined
  if (!drawing || shapeHold || !makesShapes(strokeTool)) return
  const per = screenPerCanvas()
  const found = recognize(strokePts, SHAPE_MIN_PX / per)
  if (!found) return
  let shape: QuickShape = found
  let snapped = false
  if (found.kind === 'line') {
    const t = tidyLine(found.a, found.b, liveAnchors(), MAGNET_PX / per)
    shape = { kind: 'line', a: t.a, b: t.b }
    snapped = t.snappedA || t.snappedB
  }
  shapePressure = pressureNow
  shapeHold = { shape, endSnapped: snapped }
  renderShape(shape)
  navigator.vibrate?.(snapped ? 14 : 8)
  noteShapeMade()
}

/** The held line follows the finger: its end clicks onto the ends that are near. */
function moveShape(p: PaintPos) {
  const h = shapeHold
  if (!h || h.shape.kind !== 'line') return
  const t = tidyLine(h.shape.a, { x: p.x, y: p.y }, liveAnchors(), MAGNET_PX / screenPerCanvas(), true)
  if (t.snappedB && !h.endSnapped) navigator.vibrate?.(10)
  h.endSnapped = t.snappedB
  if (Math.abs(t.b.x - h.shape.b.x) < 0.5 && Math.abs(t.b.y - h.shape.b.y) < 0.5) return
  h.shape = { kind: 'line', a: h.shape.a, b: t.b }
  renderShape(h.shape)
}

/** Takes back what the stroke painted so far and paints the shape in its place, with the same tool. */
function renderShape(s: QuickShape) {
  const dc = drawCanvas.value
  if (!dc || !drawCtx || !baseCanvas) return
  const path = shapePath(s)
  const first = path[0]!
  const last = path[path.length - 1]!
  const pad = 4
  const x0 = Math.max(0, Math.floor(strokeBounds.x0 - pad))
  const y0 = Math.max(0, Math.floor(strokeBounds.y0 - pad))
  const x1 = Math.min(dc.width, Math.ceil(strokeBounds.x1 + pad))
  const y1 = Math.min(dc.height, Math.ceil(strokeBounds.y1 + pad))
  if (x1 > x0 && y1 > y0) {
    drawCtx.save()
    drawCtx.globalCompositeOperation = 'source-over'
    drawCtx.globalAlpha = 1
    drawCtx.clearRect(x0, y0, x1 - x0, y1 - y0)
    drawCtx.drawImage(baseCanvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0)
    drawCtx.restore()
    previewCtx?.clearRect(x0, y0, x1 - x0, y1 - y0)
  }
  dirty = emptyBounds()
  if (activeLayered && previewCtx) {
    strokeState = newStrokeState()
    paintPiece(first.x, first.y, first.x, first.y, shapePressure)
    for (let i = 1; i < path.length; i++) paintPiece(path[i - 1]!.x, path[i - 1]!.y, path[i]!.x, path[i]!.y, shapePressure)
    flushStroke()
  } else if (strokeTool === 'oil') {
    oilState = newOilState(color.value)
    const size = brushPx() * widthFactor(shapePressure)
    growBounds(strokeBounds, first.x, first.y, oilReach())
    drawOilSegment(drawCtx, first.x, first.y, first.x + 0.01, first.y, size, oilState, opacity.value, tipOfTool('oil'), oilAllow)
    for (let i = 1; i < path.length; i++) {
      growBounds(strokeBounds, path[i]!.x, path[i]!.y, oilReach())
      drawOilSegment(drawCtx, path[i - 1]!.x, path[i - 1]!.y, path[i]!.x, path[i]!.y, size, oilState, opacity.value, tipOfTool('oil'), oilAllow)
    }
  }
  lastX = last.x
  lastY = last.y
}

// A short tip, shown a few times: after a few strokes that were not held, and never again once a shape has been made.
const SHAPE_HINT_KEY = 'lk-shape-hint'
const shapeHint = ref(false)
let shapeHintTimer: ReturnType<typeof setTimeout> | undefined
let strokesWithoutHold = 0

function shapeHintCount(): number {
  try {
    return Number(localStorage.getItem(SHAPE_HINT_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}
function setShapeHintCount(n: number) {
  try {
    localStorage.setItem(SHAPE_HINT_KEY, String(n))
  } catch {
    // shown again in a private window
  }
}
function noteShapeMade() {
  setShapeHintCount(9)
  shapeHint.value = false
  clearTimeout(shapeHintTimer)
}
function noteFreeStroke() {
  if (++strokesWithoutHold < 4) return
  strokesWithoutHold = 0
  const seen = shapeHintCount()
  if (seen >= 3 || shapeHint.value) return
  setShapeHintCount(seen + 1)
  shapeHint.value = true
  clearTimeout(shapeHintTimer)
  shapeHintTimer = setTimeout(() => (shapeHint.value = false), 7000)
}

// ── Stamps: the shapes, any colour, any size, with glitter if wanted ───────────────────────────────────────────────────
const STAMP_STORE_KEY = 'lk-coloring-stamp-v2'
function readStamp(): StampSettings {
  try {
    return cleanStamp(JSON.parse(localStorage.getItem(STAMP_STORE_KEY) ?? 'null'))
  } catch {
    return { ...DEFAULT_STAMP }
  }
}
const stampSet = ref<StampSettings>(readStamp())
watch(
  stampSet,
  (v) => {
    try {
      localStorage.setItem(STAMP_STORE_KEY, JSON.stringify(v))
    } catch {
      // not remembered in a private window
    }
  },
  { deep: true }
)
// another tool: the stamp that was just placed is final
watch(tool, (t) => {
  if (t !== 'stamp') commitStamp()
})
watch([stampSet, () => tool.value], () => updateCursorRing(), { deep: true })

/** The pictures of the shapes, loaded when they are first wanted (a plain array on purpose: nothing reacts to it). */
const stampImages: (HTMLImageElement | null)[] = []
function loadStampImage(i: number) {
  if (stampImages[i] !== undefined) return
  stampImages[i] = null
  const img = new Image()
  img.onload = () => {
    stampImages[i] = img
    stampSprites.clear()
  }
  img.src = stampUrl(i)
}

interface StampSprite {
  canvas: HTMLCanvasElement
  px: number
  alpha: Uint8ClampedArray
}
const stampSprites = new Map<string, StampSprite>()

/** How large a stamp is on the picture: from a twentieth to a third of its width. */
const stampPx = () => Math.max(16, Math.round((drawCanvas.value?.width ?? 1000) * (0.05 + 0.28 * (stampSet.value.size / 100))))

/** Flecks and four-pointed stars on the opaque places of a stamp. */
function sparkleOn(g: CanvasRenderingContext2D, px: number) {
  const dots = Math.round((px * px) / 60)
  const colors = ['rgba(255,255,255,0.95)', 'rgba(255,240,190,0.9)', 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.16)']
  g.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < dots; i++) {
    g.fillStyle = colors[Math.floor(Math.random() * colors.length)]!
    const s = 0.6 + Math.random() * Math.max(0.8, px / 100)
    g.fillRect(Math.random() * px, Math.random() * px, s, s)
  }
  const stars = Math.max(5, Math.round(px / 24))
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.lineCap = 'round'
  for (let i = 0; i < stars; i++) {
    const x = px * (0.1 + Math.random() * 0.8)
    const y = px * (0.1 + Math.random() * 0.8)
    const r = px * (0.025 + Math.random() * 0.04)
    g.lineWidth = Math.max(1, px / 110)
    g.beginPath()
    g.moveTo(x - r, y)
    g.lineTo(x + r, y)
    g.moveTo(x, y - r)
    g.lineTo(x, y + r)
    g.stroke()
    g.beginPath()
    g.arc(x, y, Math.max(0.8, r * 0.18), 0, Math.PI * 2)
    g.fillStyle = '#ffffff'
    g.fill()
  }
}

/** A stamp as a small picture: the shape in its colour, a little shaded, with glitter if wanted. */
function makeStampSprite(img: HTMLImageElement, px: number, color: string, glitter: boolean): StampSprite {
  const c = document.createElement('canvas')
  c.width = px
  c.height = px
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, px, px)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = color
  g.fillRect(0, 0, px, px)
  // a little light from the top left, so the shape is not quite flat
  g.globalCompositeOperation = 'source-atop'
  const shade = g.createLinearGradient(0, 0, px, px)
  shade.addColorStop(0, 'rgba(255,255,255,0.22)')
  shade.addColorStop(1, 'rgba(0,0,0,0.15)')
  g.fillStyle = shade
  g.fillRect(0, 0, px, px)
  if (glitter) sparkleOn(g, px)
  g.globalCompositeOperation = 'source-over'
  g.globalCompositeOperation = 'source-over'
  return { canvas: c, px, alpha: g.getImageData(0, 0, px, px).data }
}

/** The stamp as it is chosen now, as a small picture (kept while the choice stays the same). */
function stampSprite(): StampSprite | null {
  const s = stampSet.value
  const img = stampImages[s.shape]
  if (!img) {
    loadStampImage(s.shape)
    return null
  }
  const px = stampPx()
  const key = `${s.shape}|${s.color}|${s.glitter ? 1 : 0}|${px}`
  const hit = stampSprites.get(key)
  if (hit) return hit
  const sprite = makeStampSprite(img, px, s.color, s.glitter)
  if (stampSprites.size > 40) stampSprites.clear()
  stampSprites.set(key, sprite)
  return sprite
}

let stampLast: Pt | null = null

function stampAt(x: number, y: number) {
  const sp = stampSprite()
  if (!sp || !drawCtx) return
  drawCtx.save()
  drawCtx.globalCompositeOperation = 'source-over'
  drawCtx.globalAlpha = 1
  drawCtx.drawImage(sp.canvas, x - sp.px / 2, y - sp.px / 2)
  drawCtx.restore()
  cover.put(sp, x, y, sp.px, 0)
  growBounds(strokeBounds, x, y, sp.px * 0.75)
  stampLast = { x, y }
  if (stampSet.value.glitter) {
    // the places that flash, only where the stamp has colour
    const sites: GlitterSite[] = []
    for (let i = 1; i <= 5; i++) {
      const ly = y - sp.px / 2 + (sp.px * i) / 6
      sites.push(...glitterSites(x - sp.px * 0.45, ly, x + sp.px * 0.45, ly, sp.px * 0.25))
    }
    twinkling.add(
      sites.filter((s) => {
        const ix = Math.floor(s.x - (x - sp.px / 2))
        const iy = Math.floor(s.y - (y - sp.px / 2))
        return ix >= 0 && iy >= 0 && ix < sp.px && iy < sp.px && (sp.alpha[(iy * sp.px + ix) * 4 + 3] ?? 0) > 200
      })
    )
  }
}

function stampBegin(p: PaintPos) {
  takeBase()
  cover.begin()
  strokeBounds = emptyBounds()
  stampLast = null
  const s = stampSet.value
  const sprite = liveSpriteFor(s.shape, s.color, s.glitter)
  if (!sprite) {
    loadStampImage(s.shape)
    return
  }
  // the stamp that has just been placed stays editable until something else is done (see `commitStamp`)
  const l: LiveStamp = { x: p.x, y: p.y, size: stampPx(), angle: 0, shape: s.shape, color: s.color, glitter: s.glitter, sprite, bounds: emptyBounds() }
  live.value = l
  renderLive(l)
  stampLast = { x: p.x, y: p.y }
  lastX = p.x
  lastY = p.y
  showStampHint()
}

// ── The stamp that was just placed can still be changed: hold it, then move, enlarge, shrink and turn it ──────────────────────
// It is on the picture already; the picture "before" is kept in `baseCanvas`, so every change draws it again on that. Only when something else
// happens (another stroke, another tool, undo, leaving the picture) it is final, and the history gets its one step (`commitStamp`).
interface LiveStamp {
  x: number
  y: number
  /** Side of its square in picture pixels. */
  size: number
  /** Turn in radians. */
  angle: number
  shape: number
  color: string
  glitter: boolean
  sprite: StampSprite
  /** Everything the stamp has covered while it was changed (for the history and for taking it back). */
  bounds: Bounds
}
const live = shallowRef<LiveStamp | null>(null)
const sheetDims = ref({ w: 0, h: 0 })
/** A finger holds the stamp. */
const stampHeld = ref(false)
const STAMP_HOLD_MS = 350
const STAMP_HOLD_SLOP = 9

/** The stamp as a bigger picture (so it stays sharp when it is enlarged). */
function liveSpriteFor(shape: number, color: string, glitter: boolean): StampSprite | null {
  const img = stampImages[shape]
  if (!img) return null
  return makeStampSprite(img, Math.round(Math.max(256, Math.min(768, stampPx() * 2))), color, glitter)
}

function renderLive(l: LiveStamp) {
  const dc = drawCanvas.value
  if (!dc || !drawCtx || !baseCanvas) return
  growBounds(l.bounds, l.x, l.y, l.size * 0.75 + 4)
  const x0 = Math.max(0, Math.floor(l.bounds.x0))
  const y0 = Math.max(0, Math.floor(l.bounds.y0))
  const x1 = Math.min(dc.width, Math.ceil(l.bounds.x1))
  const y1 = Math.min(dc.height, Math.ceil(l.bounds.y1))
  drawCtx.save()
  drawCtx.globalCompositeOperation = 'source-over'
  drawCtx.globalAlpha = 1
  if (x1 > x0 && y1 > y0) {
    drawCtx.clearRect(x0, y0, x1 - x0, y1 - y0)
    drawCtx.drawImage(baseCanvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0)
  }
  drawCtx.translate(l.x, l.y)
  drawCtx.rotate(l.angle)
  drawCtx.drawImage(l.sprite.canvas, -l.size / 2, -l.size / 2, l.size, l.size)
  drawCtx.restore()
  cover.put(l.sprite, l.x, l.y, l.size, l.angle, { x0, y0, x1, y1 })
}

/** The places of a glitter stamp that flash, where the stamp has colour (turned and moved as the stamp is). */
function liveSites(l: LiveStamp): GlitterSite[] {
  const sites: GlitterSite[] = []
  for (let i = 1; i <= 5; i++) {
    const ly = -l.size / 2 + (l.size * i) / 6
    sites.push(...glitterSites(-l.size * 0.45, ly, l.size * 0.45, ly, l.size * 0.25))
  }
  const px = l.sprite.px
  const c = Math.cos(l.angle)
  const s = Math.sin(l.angle)
  const out: GlitterSite[] = []
  for (const st of sites) {
    const ix = Math.floor((st.x / l.size + 0.5) * px)
    const iy = Math.floor((st.y / l.size + 0.5) * px)
    if (ix < 0 || iy < 0 || ix >= px || iy >= px || (l.sprite.alpha[(iy * px + ix) * 4 + 3] ?? 0) <= 200) continue
    out.push({ ...st, x: l.x + st.x * c - st.y * s, y: l.y + st.x * s + st.y * c })
  }
  return out
}

/** The stamp is final: the history gets its step. */
function commitStamp() {
  const l = live.value
  if (!l) return
  live.value = null
  stampGrabStop()
  stampHint.value = false
  if (l.glitter) twinkling.add(liveSites(l))
  commitHistory(l.bounds, 'stamp')
}

const stampFrameStyle = computed<Record<string, string>>(() => {
  const l = live.value
  const d = sheetDims.value
  if (!l || !d.w || !d.h) return {}
  return {
    left: `${(l.x / d.w) * 100}%`,
    top: `${(l.y / d.h) * 100}%`,
    width: `${((l.size * 1.06) / d.w) * 100}%`,
    aspectRatio: '1',
    transform: `translate(-50%, -50%) rotate(${l.angle}rad)`
  }
})

const STAMP_HINT_KEY = 'lk-stamp-hint'
const stampHint = ref(false)
let stampHintTimer: ReturnType<typeof setTimeout> | undefined
function showStampHint(force = false) {
  if (!force) {
    let seen = 0
    try {
      seen = Number(localStorage.getItem(STAMP_HINT_KEY) ?? 0) || 0
      localStorage.setItem(STAMP_HINT_KEY, String(seen + 1))
    } catch {
      // shown every time in a private window
    }
    if (seen >= 3) return
  }
  stampHint.value = true
  clearTimeout(stampHintTimer)
  stampHintTimer = setTimeout(() => (stampHint.value = false), 7000)
}

interface StampPress {
  key: string
  cx: number
  cy: number
  timer: ReturnType<typeof setTimeout>
}
interface StampGrab {
  /** The fingers that hold the stamp, by key, on the screen. */
  pts: Map<string, { x: number; y: number }>
  /** The stamp and the fingers (on the picture) when the number of fingers last changed. */
  start: { x: number; y: number; size: number; angle: number }
  base: Map<string, Pt>
  snapped: boolean
}
let stampPress: StampPress | null = null
let stampGrab: StampGrab | null = null

const onPicture = (cx: number, cy: number): Pt => {
  const p = getPosFromClient(cx, cy)
  return { x: p.x, y: p.y }
}

function stampHit(cx: number, cy: number): boolean {
  const l = live.value
  if (!l || tool.value !== 'stamp' || !hasImage.value) return false
  const p = onPicture(cx, cy)
  const dx = p.x - l.x
  const dy = p.y - l.y
  const c = Math.cos(-l.angle)
  const s = Math.sin(-l.angle)
  const u = dx * c - dy * s
  const v = dx * s + dy * c
  const reach = (l.size / 2) * 1.08 + 8 / screenPerCanvas()
  return Math.abs(u) <= reach && Math.abs(v) <= reach
}

/** The dot under the frame: held, it sizes the stamp (up and down) and turns it (left and right). */
let stampDot: { key: string; x0: number; y0: number; size: number; angle: number; snapped: boolean } | null = null
const stampDotHeld = ref(false)

function stampDotHit(cx: number, cy: number): boolean {
  const l = live.value
  if (!l || tool.value !== 'stamp' || !hasImage.value) return false
  const p = onPicture(cx, cy)
  // the dot sits a little more than half a stamp below its middle, and turns with the stamp
  const off = l.size * 0.615
  const hx = l.x - Math.sin(l.angle) * off
  const hy = l.y + Math.cos(l.angle) * off
  return Math.hypot(p.x - hx, p.y - hy) <= 28 / screenPerCanvas()
}

function stampDotStart(key: string, cx: number, cy: number): boolean {
  const l = live.value
  if (!l || stampGrab || stampDot || !stampDotHit(cx, cy)) return false
  stampPressCancel()
  stampDot = { key, x0: cx, y0: cy, size: l.size, angle: l.angle, snapped: false }
  stampDotHeld.value = true
  stampHint.value = false
  navigator.vibrate?.(10)
  return true
}

function stampPressCancel() {
  if (stampPress) clearTimeout(stampPress.timer)
  stampPress = null
}

function stampGrabStop() {
  stampPressCancel()
  stampDot = null
  stampDotHeld.value = false
  stampGrab = null
  stampHeld.value = false
}

/** A press on the placed stamp waits: held still it takes hold of the stamp. `true`: the press is taken. */
function stampPressStart(key: string, cx: number, cy: number): boolean {
  if (stampGrab || !stampHit(cx, cy)) return false
  stampPressCancel()
  stampPress = { key, cx, cy, timer: setTimeout(stampTakeHold, STAMP_HOLD_MS) }
  return true
}

function stampRebase() {
  const g = stampGrab
  const l = live.value
  if (!g || !l) return
  g.start = { x: l.x, y: l.y, size: l.size, angle: l.angle }
  g.base = new Map([...g.pts].map(([key, p]) => [key, onPicture(p.x, p.y)]))
  g.snapped = false
}

function stampTakeHold() {
  const pr = stampPress
  stampPress = null
  const l = live.value
  if (!pr || !l) return
  stampGrab = { pts: new Map([[pr.key, { x: pr.cx, y: pr.cy }]]), start: { x: l.x, y: l.y, size: l.size, angle: l.angle }, base: new Map(), snapped: false }
  stampRebase()
  stampHeld.value = true
  stampHint.value = false
  navigator.vibrate?.(12)
}

function setLive(patch: Partial<Pick<LiveStamp, 'x' | 'y' | 'size' | 'angle'>>) {
  const l = live.value
  const dc = drawCanvas.value
  if (!l || !dc) return
  const next: LiveStamp = { ...l, ...patch }
  next.x = Math.max(0, Math.min(dc.width, next.x))
  next.y = Math.max(0, Math.min(dc.height, next.y))
  next.size = Math.max(dc.width * 0.04, Math.min(dc.width * 0.9, next.size))
  live.value = next
  renderLive(next)
}

/** One finger moves the stamp; two fingers move it with their middle, turn it with the line between them and size it with their distance. */
function stampFollow() {
  const g = stampGrab
  if (!g) return
  const keys = [...g.pts.keys()]
  const now = (k: string) => onPicture(g.pts.get(k)!.x, g.pts.get(k)!.y)
  if (keys.length === 1) {
    const a0 = g.base.get(keys[0]!)!
    const a1 = now(keys[0]!)
    setLive({ x: g.start.x + (a1.x - a0.x), y: g.start.y + (a1.y - a0.y) })
    return
  }
  const a0 = g.base.get(keys[0]!)!
  const b0 = g.base.get(keys[1]!)!
  const a1 = now(keys[0]!)
  const b1 = now(keys[1]!)
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y)
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y)
  const turn = Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x)
  const ratio = d0 > 12 ? d1 / d0 : 1
  const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 }
  const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 }
  const ox = g.start.x - m0.x
  const oy = g.start.y - m0.y
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  let angle = g.start.angle + turn
  // upright (and the other right angles) catches lightly
  const deg = (angle * 180) / Math.PI
  const near = Math.round(deg / 90) * 90
  const caught = Math.abs(deg - near) <= 4
  if (caught) angle = (near * Math.PI) / 180
  if (caught && !g.snapped) navigator.vibrate?.(6)
  g.snapped = caught
  setLive({ x: m1.x + (ox * c - oy * s) * ratio, y: m1.y + (ox * s + oy * c) * ratio, size: g.start.size * ratio, angle })
}

/** A moving finger: `true` when the stamp has it. */
function stampHandleMove(key: string, cx: number, cy: number): boolean {
  const d = stampDot
  if (d && d.key === key) {
    // up makes it bigger, down smaller; to the right turns it clockwise, to the left the other way
    // (the whole width of the screen is one full turn)
    let angle = d.angle + ((cx - d.x0) / Math.max(240, window.innerWidth * 0.9)) * Math.PI * 2
    const deg = (angle * 180) / Math.PI
    const near = Math.round(deg / 90) * 90
    const caught = Math.abs(deg - near) <= 4
    if (caught) angle = (near * Math.PI) / 180
    if (caught && !d.snapped) navigator.vibrate?.(6)
    d.snapped = caught
    setLive({ size: d.size * Math.exp(-(cy - d.y0) / 160), angle })
    return true
  }
  if (stampPress && stampPress.key === key) {
    if (Math.hypot(cx - stampPress.cx, cy - stampPress.cy) > STAMP_HOLD_SLOP) {
      // it moved before the hold: nothing is stamped, the tip shows how it is done
      stampPressCancel()
      showStampHint(true)
    }
    return true
  }
  if (stampGrab && stampGrab.pts.has(key)) {
    stampGrab.pts.set(key, { x: cx, y: cy })
    stampFollow()
    return true
  }
  return false
}

function stampHandleEnd(key: string) {
  if (stampDot && stampDot.key === key) {
    stampDot = null
    stampDotHeld.value = false
    return
  }
  if (stampPress && stampPress.key === key) {
    // a short tap on the placed stamp: the tip shows how to change it
    stampPressCancel()
    showStampHint(true)
    return
  }
  const g = stampGrab
  if (!g || !g.pts.has(key)) return
  g.pts.delete(key)
  if (!g.pts.size) {
    stampGrabStop()
    return
  }
  stampRebase()
}

/** A second finger comes down while the stamp is held. */
function stampAddFinger(key: string, cx: number, cy: number): boolean {
  if (!stampGrab) return false
  if (!stampGrab.pts.has(key)) {
    stampGrab.pts.set(key, { x: cx, y: cy })
    stampRebase()
  }
  return true
}

/** The mouse wheel sizes a held stamp, with the shift key it turns it (a mouse has only one pointer). */
function stampWheel(e: WheelEvent): boolean {
  const g = stampGrab
  const l = live.value
  if (!g || !l) return false
  e.preventDefault()
  if (e.shiftKey) setLive({ angle: l.angle + Math.sign(e.deltaY) * (5 * Math.PI) / 180 })
  else setLive({ size: l.size * Math.exp(-e.deltaY * 0.0016) })
  stampRebase()
  return true
}

/** The stamp tool is chosen. */
function activateStamp(): boolean {
  arm()
  tool.value = 'stamp'
  loadStampImage(stampSet.value.shape)
  return true
}

/** A shape is chosen: the one before stays as it is, the tool bar folds away and the picture is there to stamp on. */
function pickStamp(shape: number) {
  commitStamp()
  stampSet.value = { ...stampSet.value, shape }
  loadStampImage(shape)
  if (activateStamp()) {
    pickerOpen.value = false
    toolbarOpen.value = false
  }
}

/** Size, colour and glitter: they change the stamp that was just placed, too. */
function setStamp(patch: Partial<StampSettings>) {
  stampSet.value = cleanStamp({ ...stampSet.value, ...patch })
  const l = live.value
  if (l && tool.value === 'stamp') {
    const set = stampSet.value
    const recolour = patch.color !== undefined || patch.glitter !== undefined
    const sprite = recolour ? liveSpriteFor(l.shape, set.color, set.glitter) : l.sprite
    if (sprite) {
      live.value = { ...l, sprite, color: set.color, glitter: set.glitter }
      setLive({ size: patch.size !== undefined ? stampPx() : l.size })
    }
    return
  }
  activateStamp()
}

function beginStroke(p: PaintPos) {
  // what was stamped last is final as soon as something else is done
  commitStamp()
  if (activeTool.value === 'pipette') {
    const picked = sampleColor(p.x, p.y)
    if (picked) pickCustom(picked)
    selectPaint()
    return
  }
  // the list of tasks makes room for the picture as soon as painting starts (its title with the count stays; a tap opens it again)
  if (advJobs.value.length && !jobsAutoFolded) {
    jobsAutoFolded = true
    jobsFolded.value = true
  }
  if (activeTool.value === 'fill') {
    takeBase()
    floodFill(Math.round(p.x), Math.round(p.y))
    commitHistory(undefined, 'fill')
    return
  }
  // Painting starts: the small menu and the colour picker go away.
  menuOpen.value = false
  pickerOpen.value = false
  drawing = true
  // the bar fades only when a stroke has lasted a moment: two fingers that come down one after the other (a zoom) must not make it flicker
  clearTimeout(paintFadeTimer)
  paintFadeTimer = setTimeout(() => {
    if (drawing) isPainting.value = true
  }, 260)
  lastX = p.x
  lastY = p.y
  const t = activeTool.value
  strokeTool = t
  if (t === 'stamp') {
    stampBegin(p)
    return
  }
  celebrate(awards.toolUsed(t))
  strokePts = [{ x: p.x, y: p.y }]
  shapeHold = null
  const pressure = smoothPressure(p.pressure, true)
  const size = brushPx() * widthFactor(pressure)
  // "Stay inside the lines": the field where the stroke starts is the only place it paints.
  strokeMask = stayInside.value && t !== 'eraser' ? maskAt(p.x, p.y) : null
  oilAllow = strokeMask ? allowOf(strokeMask) : undefined
  const dc = drawCanvas.value
  strokeBounds = emptyBounds()
  // the picture as it is now: the stroke of a layered tool is laid on it again and again while it grows, and it is the
  // "before" of every stroke for undo
  takeBase()
  if (isLayeredTool(t) && previewCtx && previewCanvas.value && dc) {
    activeLayered = t
    strokeState = newStrokeState()
    dirty = emptyBounds()
    previewCtx.clearRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
    shapeOpts = shapeOptionsOf(t, brushPx())
    if (shapeOpts) shapedCanvas = sizedCanvas(shapedCanvas, dc.width, dc.height)
    paintPiece(p.x, p.y, p.x, p.y, pressure)
    flushStroke()
  } else if (t === 'oil') {
    oilState = newOilState(color.value)
    growBounds(strokeBounds, p.x, p.y, oilReach())
    drawOilSegment(drawCtx!, p.x, p.y, p.x + 0.01, p.y, size, oilState, opacity.value, tipOfTool('oil'), oilAllow)
  } else if (t === 'eraser') {
    eraserTap = eraserField.value ? { x: p.x, y: p.y, moved: false } : null
    growBounds(strokeBounds, p.x, p.y, eraserReach())
    eraseSegment(drawCtx!, p.x, p.y, p.x + 0.01, p.y, brushPx() * 1.5)
  }
  armShapeHold(p)
}

/** Where the eraser went down, while it has not moved yet: a stroke that stays a tap wipes the whole field. */
let eraserTap: { x: number; y: number; moved: boolean } | null = null

/** The part of a field's mask that is not empty, in picture pixels (a little larger than the field). */
function maskBounds(m: MaskInfo): Bounds {
  const w = m.w
  const h = Math.floor(m.alpha.length / w)
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (!m.alpha[row + x]) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (x1 < 0) return emptyBounds()
  return { x0: x0 * m.scale - 2, y0: y0 * m.scale - 2, x1: (x1 + 1) * m.scale + 2, y1: (y1 + 1) * m.scale + 2 }
}

/**
 * The eraser was only tapped inside a field of the line art: the little dot it made is taken back and all the paint of the
 * field goes (the paint that reaches under the outline too). A tap in no field, or one that moved, stays an ordinary dot.
 */
function eraseTappedField() {
  const tap = eraserTap
  eraserTap = null
  const dc = drawCanvas.value
  if (!tap || tap.moved || !dc || !drawCtx || !baseCanvas) return
  const mask = maskAt(tap.x, tap.y)
  if (!mask) return
  drawCtx.save()
  drawCtx.globalCompositeOperation = 'source-over'
  drawCtx.globalAlpha = 1
  drawCtx.clearRect(0, 0, dc.width, dc.height)
  drawCtx.drawImage(baseCanvas, 0, 0)
  drawCtx.globalCompositeOperation = 'destination-out'
  drawCtx.drawImage(mask.canvas, 0, 0)
  drawCtx.restore()
  strokeBounds = maskBounds(mask)
}

/** How far from its path the oil brush and the eraser can change the picture (for the area undo has to keep). */
const oilReach = () => brushPx() * widthFactor(1) * 0.7 + 6
const eraserReach = () => brushPx() * 0.75 + 10

/** One piece of a stroke of a layered tool, into the stroke layer; the picture is updated by `flushStroke`. */
function paintPiece(ax: number, ay: number, bx: number, by: number, pressure: number) {
  const t = activeLayered
  if (!t || !previewCtx) return
  const size = brushPx()
  paintLayerSegment(t, previewCtx, ax, ay, bx, by, { size, color: color.value, pressure, tip: tipOfTool(t) }, strokeState)
  if (t === 'glitter') twinkling.add(glitterSites(ax, ay, bx, by, size))
  const reach = strokeReach(t, size)
  growBounds(strokeBounds, bx, by, reach)
  growBounds(dirty, ax, ay, reach)
  growBounds(dirty, bx, by, reach)
}

let footCanvas: HTMLCanvasElement | null = null
// (no shifted copies: a footprint wider than the stroke leaves a pale rim of cleared paint along its edges)

/** The area a stroke covers in a region, as a (nearly) solid shape: the layer's grain and thin places are filled in. */
function footprintOf(layer: HTMLCanvasElement, x0: number, y0: number, w: number, h: number): HTMLCanvasElement | null {
  if (!footCanvas) footCanvas = document.createElement('canvas')
  if (footCanvas.width < w || footCanvas.height < h) {
    footCanvas.width = Math.max(footCanvas.width, w)
    footCanvas.height = Math.max(footCanvas.height, h)
  }
  const f = footCanvas.getContext('2d')
  if (!f) return null
  f.globalCompositeOperation = 'source-over'
  f.globalAlpha = 1
  f.clearRect(0, 0, w, h)
  f.drawImage(layer, x0, y0, w, h, 0, 0, w, h)
  // laid over itself a few times the faint places of the grain fill up (but not further than the stroke itself reaches)
  for (let i = 0; i < 3; i++) f.drawImage(footCanvas, 0, 0, w, h, 0, 0, w, h)
  return footCanvas
}

/** Shows what was painted since the last time: the stroke layer, finished, laid on the picture as it was before the stroke. */
function flushStroke() {
  const t = activeLayered
  const dc = drawCanvas.value
  const pc = previewCanvas.value
  if (!t || !dc || !pc || !drawCtx || !previewCtx || !baseCanvas || dirty.x1 <= dirty.x0) return
  // the rim of watercolour looks at the neighbours, so the area to update is a little larger than what changed
  const pad = (shapeOpts?.rim ?? 0) + 2
  const x0 = Math.max(0, Math.floor(dirty.x0 - pad))
  const y0 = Math.max(0, Math.floor(dirty.y0 - pad))
  const x1 = Math.min(dc.width, Math.ceil(dirty.x1 + pad))
  const y1 = Math.min(dc.height, Math.ceil(dirty.y1 + pad))
  dirty = emptyBounds()
  const w = x1 - x0
  const h = y1 - y0
  if (w < 1 || h < 1) return
  // the field's edge cuts what was painted since the last update (once for all the points a pen sent in this frame)
  if (strokeMask) clipToMask(previewCtx, strokeMask.canvas, x0, y0, x1, y1)
  let layer: HTMLCanvasElement = pc
  if (shapeOpts && shapedCanvas) {
    shapeRegion(previewCtx, shapedCanvas.getContext('2d')!, x0, y0, w, h, dc.width, dc.height, shapeOpts)
    layer = shapedCanvas
  }
  drawCtx.save()
  drawCtx.beginPath()
  drawCtx.rect(x0, y0, w, h)
  drawCtx.clip()
  drawCtx.globalCompositeOperation = 'source-over'
  drawCtx.globalAlpha = 1
  drawCtx.clearRect(x0, y0, w, h)
  drawCtx.drawImage(baseCanvas, x0, y0, w, h, x0, y0, w, h)
  // without overlapping the stroke takes away the paint under it first, so the same place looks the same the second time
  // The whole footprint of the stroke is cleared, not only the paint of the stroke: a grainy pencil leaves gaps, and the old paint would
  // show through them as a darker place. So the same place looks like the first stroke, however often it is gone over.
  if (!overlap.value) {
    const foot = footprintOf(layer, x0, y0, w, h)
    if (foot) {
      drawCtx.globalCompositeOperation = 'destination-out'
      drawCtx.drawImage(foot, 0, 0, w, h, x0, y0, w, h)
    }
  }
  for (const pass of BRUSH_LOOK[t].passes) {
    drawCtx.globalCompositeOperation = pass.blend
    drawCtx.globalAlpha = Math.min(1, pass.alpha * opacity.value)
    drawCtx.drawImage(layer, x0, y0, w, h, x0, y0, w, h)
  }
  drawCtx.restore()
}

function continueStroke(p: PaintPos) {
  twinkling.hold()
  const t = strokeTool
  if (t === 'stamp') {
    // dragging leaves a trail of stamps, one stamp's width apart; the first stamp of a trail is final, so the trail is one step of the history
    if (stampLast && Math.hypot(p.x - stampLast.x, p.y - stampLast.y) >= stampPx() * 0.95) {
      const l = live.value
      if (l) {
        strokeBounds = { ...l.bounds }
        live.value = null
        if (l.glitter) twinkling.add(liveSites(l))
      }
      stampAt(p.x, p.y)
    }
    lastX = p.x
    lastY = p.y
    return
  }
  // held into a shape: a line follows the finger, a figure stays as it is
  if (shapeHold) {
    moveShape(p)
    return
  }
  strokePts.push({ x: p.x, y: p.y })
  if (makesShapes(t) && Math.hypot(p.x - holdAnchor.x, p.y - holdAnchor.y) * screenPerCanvas() > HOLD_SLOP_PX) armShapeHold(p)
  const pressure = smoothPressure(p.pressure, false)
  if (activeLayered && previewCtx) {
    paintPiece(lastX, lastY, p.x, p.y, pressure)
  } else if (t === 'oil') {
    growBounds(strokeBounds, p.x, p.y, oilReach())
    drawOilSegment(drawCtx!, lastX, lastY, p.x, p.y, brushPx() * widthFactor(pressure), oilState, opacity.value, tipOfTool('oil'), oilAllow)
  } else if (t === 'eraser') {
    // more than a tap: the eraser is wiping along a line
    if (eraserTap && !eraserTap.moved && Math.hypot(p.x - eraserTap.x, p.y - eraserTap.y) * screenPerCanvas() > 7) eraserTap.moved = true
    growBounds(strokeBounds, p.x, p.y, eraserReach())
    eraseSegment(drawCtx!, lastX, lastY, p.x, p.y, brushPx() * 1.5)
  }
  lastX = p.x
  lastY = p.y
}

function finishStroke() {
  if (!drawing) return
  clearTimeout(holdTimer)
  holdTimer = undefined
  flushStroke()
  drawing = false
  clearTimeout(paintFadeTimer)
  isPainting.value = false
  const dc = drawCanvas.value
  if (activeLayered && previewCtx && dc) {
    const x0 = Math.max(0, Math.floor(strokeBounds.x0))
    const y0 = Math.max(0, Math.floor(strokeBounds.y0))
    const x1 = Math.min(dc.width, Math.ceil(strokeBounds.x1))
    const y1 = Math.min(dc.height, Math.ceil(strokeBounds.y1))
    if (x1 > x0 && y1 > y0) previewCtx.clearRect(x0, y0, x1 - x0, y1 - y0)
    activeLayered = null
  }
  strokeMask = null
  oilAllow = undefined
  drawCtx!.globalCompositeOperation = 'source-over'
  drawCtx!.globalAlpha = 1
  if (strokeTool === 'eraser') eraseTappedField()
  // a stamp that was just placed stays editable: its step of the history comes when it is final (`commitStamp`)
  if (!(strokeTool === 'stamp' && live.value)) commitHistory(strokeBounds, strokeTool)
  if (shapeHold) addAnchors(anchorsOf(shapeHold.shape))
  else if (makesShapes(strokeTool) && strokePts.length > 6) noteFreeStroke()
  shapeHold = null
  strokePts = []
  stampLast = null
}

/** Something took the pen's line away (the screen changed size, the page lost focus): the stroke ends here, and the rest of that touch paints nothing. */
let ignoreUntilUp = false

function abortStroke() {
  if (drawing) {
    if (eraserTap) eraserTap.moved = true
    finishStroke()
    ignoreUntilUp = true
  }
  activeTouchId = null
  gesture.mode = null
}

// ── History ----------------------------------------------------------------

/**
 * Records the change of the action that just ended: the area `b` (the whole picture without it) as it was in `baseCanvas`
 * before, and as it is now. This is also the single place that flags the picture as changed and saves it.
 */
function commitHistory(b?: { x0: number; y0: number; x1: number; y1: number }, tool?: ToolId) {
  const dc = drawCanvas.value
  const base = baseCanvas
  if (!dc || !drawCtx || !base) return
  const x0 = b ? Math.max(0, Math.floor(b.x0)) : 0
  const y0 = b ? Math.max(0, Math.floor(b.y0)) : 0
  const x1 = b ? Math.min(dc.width, Math.ceil(b.x1)) : dc.width
  const y1 = b ? Math.min(dc.height, Math.ceil(b.y1)) : dc.height
  if (x1 > x0 && y1 > y0) {
    const before = base.getContext('2d', { willReadFrequently: true })!.getImageData(x0, y0, x1 - x0, y1 - y0)
    history.record(drawCtx, x0, y0, x1 - x0, y1 - y0, before)
    // the mask of the stickers takes its step along (all paint cleared: no stickers left; any other change takes the mask away where it touched the paint)
    cover.commit({ x0, y0, x1, y1 }, tool === 'stamp' ? 'stamp' : !b && tool === 'eraser' ? 'clear' : 'other', before, drawCtx)
    if (tool && advTracks.value) {
      trackTool(base, dc, tool)
      scheduleJobCheck()
    }
    recordStep(timelapse, dc, x0, y0, x1, y1)
  }
  // only the glitter places inside the changed area are looked at again (a whole-picture change has no area)
  twinkling.settle(b && x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : undefined)
  scheduleTimelapseSave()
  refreshHistButtons()
  hasUserAction.value = true
  scheduleAutosave()
}

function resetHistory() {
  live.value = null
  stampGrabStop()
  history.clear()
  cover.history.clear()
  shapeAnchors = []
  twinkling.clear()
  toolMap?.rebase()
  refreshHistButtons()
  // Loading a fresh image (or restoring a saved one) is a clean slate.
  hasUserAction.value = false
}

function refreshHistButtons() {
  canUndo.value = history.canUndo
  canRedo.value = history.canRedo
}

function undo() {
  commitStamp()
  if (!drawCtx || !history.undo(drawCtx)) return
  cover.undo()
  shapeAnchors = shapeAnchors.filter((a) => a.depth <= history.depth)
  twinkling.settle(history.lastRect ?? undefined)
  toolMap?.undo()
  scheduleJobCheck()
  timelapse.undo()
  scheduleTimelapseSave()
  refreshHistButtons()
  hasUserAction.value = true
  scheduleAutosave()
}

function redo() {
  commitStamp()
  if (!drawCtx || !history.redo(drawCtx)) return
  cover.redo()
  twinkling.settle(history.lastRect ?? undefined)
  toolMap?.redo()
  scheduleJobCheck()
  timelapse.redo()
  scheduleTimelapseSave()
  refreshHistButtons()
  hasUserAction.value = true
  scheduleAutosave()
}

/** Clearing all colours asks first, in the language of the app. */
const clearAsk = ref(false)

function clearAll() {
  if (!hasImage.value) return
  clearAsk.value = true
}

function confirmClear() {
  clearAsk.value = false
  if (!hasImage.value) return
  const dc = drawCanvas.value!
  commitStamp()
  takeBase()
  shapeAnchors = []
  drawCtx!.clearRect(0, 0, dc.width, dc.height)
  delete pageDrawings[currentPage.value]
  commitHistory(undefined, 'eraser')
}

function buildExportFilename(): string {
  return `Ausmalbild_S${currentPage.value}_${new Date().toISOString().slice(0, 10)}.png`
}

function flattenCanvas(): HTMLCanvasElement | null {
  const bg = bgCanvas.value, dc = drawCanvas.value
  if (!bg || !dc || !hasImage.value) return null
  const out = document.createElement('canvas')
  out.width = bg.width
  out.height = bg.height
  paintComposite(out.getContext('2d')!, bg.width, bg.height, true)
  return out
}

function downloadPng() {
  const out = flattenCanvas()
  if (!out) return
  // The iOS app's WKWebView ignores `<a download>` — the tap would do
  // nothing — so the picture goes straight into Photos instead.
  if (isIOS) {
    void saveToPhotos(out)
    return
  }
  const a = document.createElement('a')
  a.download = buildExportFilename()
  a.href = out.toDataURL('image/png')
  a.click()
}

// Short confirmation under the header after a save to Photos. One message at
// a time; a new one restarts the timer.
const saveNotice = ref<'saved' | 'denied' | null>(null)
let saveNoticeTimer: ReturnType<typeof setTimeout> | undefined

function showSaveNotice(kind: 'saved' | 'denied') {
  saveNotice.value = kind
  clearTimeout(saveNoticeTimer)
  clearTimeout(autosaveTimer)
  saveNoticeTimer = setTimeout(() => { saveNotice.value = null }, kind === 'saved' ? 2500 : 5000)
}

async function saveToPhotos(out: HTMLCanvasElement) {
  const data = out.toDataURL('image/png').split(',')[1]
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const res = await invoke<{ status: 'saved' | 'denied' }>('plugin:save-photo|save', { data })
    showSaveNotice(res.status)
  } catch (err) {
    // The plugin is missing (an older build) or Photos refused the write —
    // the share sheet still lets the user save or send the picture.
    console.warn('save to Photos failed', err)
    void shareCanvas()
  }
}

// Web Share API surfaces the OS share sheet — WhatsApp, Telegram, Mail,
// AirDrop, etc. — so kids can ping the finished artwork to a parent in one
// tap. We feature-detect at runtime; on browsers without `canShare({files})`
// (older Firefox, desktop without sharing), the button stays hidden and the
// regular Save still works.
const canShareCanvas = ref(
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  typeof navigator.share === 'function'
)

async function shareCanvas() {
  // Sharing leaves the app, so it sits behind the parental gate.
  if (!(await requireParent())) return
  const out = flattenCanvas()
  if (!out) return
  const blob: Blob | null = await new Promise((resolve) =>
    out.toBlob((b) => resolve(b), 'image/png')
  )
  if (!blob) return
  const file = new File([blob], buildExportFilename(), { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Mein Ausmalbild',
        text: 'Mein Ausmalbild aus der LambKing-App'
      })
    } catch (err) {
      // AbortError = user dismissed the share sheet — silent.
      if ((err as Error).name !== 'AbortError') {
        console.warn('share failed', err)
      }
    }
  } else {
    // Sharing files isn't supported (Safari sometimes blocks file shares
    // over http) — fall back to a plain download.
    downloadPng()
  }
}

// ── The greeting card: the painting in a frame with "Für Oma" underneath ───────────────────────────────────────────
const cardOpen = ref(false)
const { displayName, hasCustomName } = useUserName()

function openCard() {
  if (flattenCanvas()) cardOpen.value = true
}

/** The little lamb for the corner of the card; the card is made without it when it cannot be loaded. */
function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = prependBaseUrl('images/logo/lk-lamm.webp')
  })
}

async function sendCard(payload: { to: string; line: string }) {
  cardOpen.value = false
  // sending leaves the app, so the parental gate comes first
  if (!(await requireParent())) return
  const picture = flattenCanvas()
  if (!picture) return
  const card = drawGreetingCard(
    picture,
    { to: payload.to, line: payload.line, from: hasCustomName.value ? displayName.value : '' },
    { for: t('app.coloring.card.for'), paintedBy: t('app.coloring.card.paintedBy', { name: '{name}' }), paintedWith: t('app.coloring.card.paintedWith') },
    await loadLogo()
  )
  const blob: Blob | null = await new Promise((resolve) => card.toBlob((b) => resolve(b), 'image/png'))
  if (!blob) return
  const file = new File([blob], buildExportFilename().replace('Ausmalbild', 'Karte'), { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t('app.coloring.card.title'), text: payload.line })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('share failed', err)
    }
  } else {
    // no file sharing here (a computer): the card is saved as a picture
    const a = document.createElement('a')
    a.download = file.name
    a.href = URL.createObjectURL(blob)
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }
}

function enterFullscreen() {
  isFullscreen.value = true
  menuOpen.value = false
  // On the web this really goes fullscreen; the native apps already are.
  void document.documentElement.requestFullscreen?.().catch(() => undefined)
  void nextTick(fitCanvas)
}

function exitFullscreen() {
  isFullscreen.value = false
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
  void nextTick(fitCanvas)
}

/**
 * The browser leaves full screen by itself (Esc on a computer, a swipe from the screen edge on a tablet). A stroke that
 * is on ends there, because the screen changes size under the pen. On a computer the controls come back; a touch
 * screen keeps the picture's full-screen layout, and only the button leaves it.
 */
function onFullscreenChange() {
  abortStroke()
  if (!document.fullscreenElement && isFullscreen.value && navigator.maxTouchPoints === 0) isFullscreen.value = false
  // the browser animates the change of size: the paper is fitted again when it has settled
  window.scrollTo(0, 0)
  void nextTick(fitCanvas)
  window.setTimeout(fitCanvas, 300)
  window.setTimeout(fitCanvas, 800)
}

/** The press that closed the tool bar on the paper is only for closing: it paints nothing (no dot, no fill). */
let swallowPress = false
let swallowTimer: ReturnType<typeof setTimeout> | undefined

/** A press anywhere outside the tool bar, the colour box and the colour picker folds the bar and the picker away. */
function onAnyPointerDown(e: PointerEvent) {
  swallowPress = false
  const el = e.target instanceof Element ? e.target : null
  if (el?.closest('.tb, .sh, .cp, .ac-menu, .ac-confirm-overlay')) return
  let closed = false
  if (toolbarOpen.value) {
    toolbarOpen.value = false
    closed = true
  }
  if (pickerOpen.value) {
    pickerOpen.value = false
    closed = true
  }
  // a press that closes the bar after something was chosen paints right away; otherwise it only closes
  swallowPress = closed && !armed && !!el?.closest('.ac-main')
  if (closed) armed = false
  clearTimeout(swallowTimer)
  // safety: a press that nobody took must not hold back the next one
  if (swallowPress) swallowTimer = setTimeout(() => (swallowPress = false), 700)
}

/**
 * Eraser on / off with one gesture: the double tap of the Apple Pencil (sent by the native app, see
 * `src-tauri/plugins/tauri-plugin-pencil`) or the E key. The tool before the eraser comes back the second time.
 */
let toolBeforeEraser: ToolId = 'pencil'

function toggleEraser() {
  if (!hasImage.value) return
  // chosen with the bar open: the next press on the paper already works, it does not only close the bar
  arm()
  if (tool.value === 'eraser') {
    tool.value = toolBeforeEraser === 'eraser' ? paintToolOf(kitDef.value, color.value) : toolBeforeEraser
  } else {
    toolBeforeEraser = tool.value
    tool.value = 'eraser'
  }
}

/**
 * The eraser button of the top bar is a switch: one tap and the next press erases, a second tap (or choosing a pen) puts it away.
 * Nothing opens, so the first press on the paper already erases. Its size lies in the menu (the three dots).
 */
function onQuickEraser() {
  menuOpen.value = false
  toggleEraser()
}

const setEraserSize = (n: number) => {
  arm()
  eraserSize.value = n
}

function onEraserRange(e: Event) {
  if (e.target instanceof HTMLInputElement) setEraserSize(Number(e.target.value))
}

const PENCIL_TAP_EVENT = 'lambking-pencil-tap'

function onKeyup(e: KeyboardEvent) {
  if (e.key === ' ') spaceHeld.value = false
}

function onKeydown(e: KeyboardEvent) {
  const typing = e.target instanceof HTMLElement && /^(input|textarea|select)$/i.test(e.target.tagName)
  if (hasImage.value && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === ' ') {
      spaceHeld.value = true
      e.preventDefault()
      return
    }
    if (e.key === '+' || e.key === '=') {
      zoomStep(1.25)
      return
    }
    if (e.key === '-') {
      zoomStep(0.8)
      return
    }
    if (e.key === '0') {
      resetZoom()
      return
    }
  }
  if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const el = e.target as HTMLElement | null
    if (!el || !/^(input|textarea|select)$/i.test(el.tagName)) {
      toggleEraser()
      return
    }
  }
  if (e.key !== 'Escape') return
  if (menuOpen.value) menuOpen.value = false
  else if (isFullscreen.value) exitFullscreen()
}

// ── File upload --------------------------------------------------------------

function pickFile() {
  fileInput.value?.click()
}

function onFileInput(e: Event) {
  const inp = e.target as HTMLInputElement
  const f = inp.files?.[0]
  if (f) void openFile(f)
  inp.value = ''
}

function onMainDragOver(e: DragEvent) {
  e.preventDefault()
  dropOver.value = true
}

function onMainDragLeave(e: DragEvent) {
  if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
    dropOver.value = false
  }
}

function onMainDrop(e: DragEvent) {
  e.preventDefault()
  dropOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) void openFile(f)
}

// ── Lifecycle --------------------------------------------------------------

// Leaving the page saves the picture first, so nothing is ever lost and there is
// nothing to ask the child about.
onBeforeRouteLeave(async () => {
  await persistNow()
  await flushTimelapse()
})

let mainResizeObserver: ResizeObserver | null = null
let bodyOverflow = ''
let stopPenTaps: (() => void) | undefined

onMounted(() => {
  bgCtx = bgCanvas.value?.getContext('2d') ?? null
  drawCtx = drawCanvas.value?.getContext('2d', { willReadFrequently: true }) ?? null
  syncPreview()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  document.addEventListener('visibilitychange', onVisibilityHidden)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('pagehide', onVisibilityHidden)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
  window.addEventListener(PENCIL_TAP_EVENT, toggleEraser)
  window.addEventListener('pointerdown', onAnyPointerDown, true)
  window.addEventListener('blur', abortStroke)
  // a short touch of a button with the pen always counts as a tap
  stopPenTaps = installPenTaps()
  window.visualViewport?.addEventListener('resize', onResize)
  // the page behind a picture never scrolls (a full screen change must not push it down)
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // Observe the canvas main area so the artwork re-fits whenever the
  // area's size changes — covers initial layout settle (deferred
  // address-bar collapse, dvh recalc), fullscreen toggles, and any
  // future chrome that shrinks/grows the row. Catches cases the 4-frame
  // retry in `fitCanvas` would otherwise give up on.
  if (typeof ResizeObserver !== 'undefined' && mainEl.value) {
    mainResizeObserver = new ResizeObserver(() => {
      if (hasImage.value) fitCanvas()
    })
    mainResizeObserver.observe(mainEl.value)
  }

  updateCursorRing()

  if (journalCtx.value) {
    startBlankSheet('portrait')
  } else if (queryBook.value) {
    void openBook(queryBook.value, queryBookPage.value)
  } else if (querySource.value && querySourceType.value) {
    void loadFromUrl(querySource.value, querySourceType.value as 'image' | 'pdf')
  } else if (!booksState.all) {
    void loadAllBooks()
  }
  void refreshMyWorks()
  // `?work=<id>`: a picture of "my works" opened straight from the start page ("Dein Bild")
  const workId = typeof route.query.work === 'string' ? route.query.work : ''
  if (workId && !queryBook.value && !querySource.value) {
    void listArtworks().then((list) => {
      const meta = list.find((w) => w.id === workId)
      if (meta) openWork(meta)
    })
  }
})
onBeforeUnmount(() => {
  twinkling.stop()
  clearTimeout(saveNoticeTimer)
  mainResizeObserver?.disconnect()
  mainResizeObserver = null
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
  document.removeEventListener('visibilitychange', onVisibilityHidden)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
  window.removeEventListener('pagehide', onVisibilityHidden)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
  window.removeEventListener(PENCIL_TAP_EVENT, toggleEraser)
  window.removeEventListener('pointerdown', onAnyPointerDown, true)
  window.removeEventListener('blur', abortStroke)
  stopPenTaps?.()
  window.visualViewport?.removeEventListener('resize', onResize)
  document.body.style.overflow = bodyOverflow
  void persistNow()
})

watch([activeTool, brushSize, eraserSize, color, tips], updateCursorRing)
watch([isFullscreen, hasImage], () => void nextTick(fitCanvas))
watch(isFullscreen, () => {
  shelfPeek.value = false
})
watch([querySource, querySourceType], ([url, type]) => {
  if (queryBook.value) return
  if (url && (type === 'image' || type === 'pdf')) {
    bookCtx.value = null
    void loadFromUrl(url, type as 'image' | 'pdf')
  }
})
watch(queryBook, (id) => {
  if (!id) {
    bookCtx.value = null
    return
  }
  // A page turn inside the open book changes `p` only, which `gotoBookPage` already handled.
  if (bookCtx.value?.bookId === id) return
  void openBook(id, queryBookPage.value)
})
</script>

<template lang="pug">
  div(
    class="ac-app"
    :class="{ 'has-image': hasImage, 'is-painting': isPainting, 'ui-hidden': isFullscreen }"
    :style="backdropVars"
  )
    //- ───────── The picture gets the whole screen ─────────
    main(
      ref="mainEl"
      class="ac-main"
      :class="{ 'drop-over': dropOver, 'is-pan': panMode || spaceHeld }"
      @dragover.prevent="onMainDragOver"
      @dragleave="onMainDragLeave"
      @drop="onMainDrop"
      @wheel="onWheel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    )
      //- ───────── Choose a coloring page ─────────
      ColoringMenu(
        v-show="!hasImage && !isLoading"
        :books="orderedBooks"
        :works="looseWorks"
        :groups="galleryGroups"
        :exhibition-works="myWorks"
        :rewards="rewards"
        :backup-busy="backupBusy"
        :backup-message="backupMessage"
        @open-book="openBookCard"
        @remove-book="(card) => paintShelf.remove(card.bookId)"
        @to-books="router.push({ name: 'app-coloring-books', query: { from: 'malen' } })"
        @blank="startBlankSheet"
        @own-image="pickFile"
        @open-work="openWork"
        @ask-delete="askDelete"
        @pick-item="pickGalleryItem"
        @open-reward="openReward"
        @export-backup="exportBackup"
        @pick-backup="pickBackup"
      )
      input(ref="backupInput" type="file" accept=".zip,application/zip" class="ac-vh" @change="onBackupFile")

      //- The paper: paint underneath, the line art on top (multiplied), so colour never covers an outline.
      div(
        ref="canvasWrap"
        class="ac-canvas-wrap"
        :class="{ active: hasImage }"
      )
        canvas(
          ref="drawCanvas"
          class="ac-draw"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
          @lostpointercapture="onPointerLost"
          @pointerleave="onPointerLeaveCanvas"
        )
        canvas(ref="previewCanvas" class="ac-preview" :style="previewStyle")
        canvas(ref="sparkleCanvas" class="ac-sparkle")
        //- the frame of the stamp that was just placed: it can still be held, moved, sized and turned
        div(v-if="live && hasImage && tool === 'stamp'" class="ac-stamp-frame" :class="{ held: stampHeld }" :style="stampFrameStyle" aria-hidden="true")
          //- the dot: held, it sizes (up, down) and turns (left, right) the stamp
          span(class="ac-stamp-dot" :class="{ held: stampDotHeld }")
        canvas(ref="bgCanvas" class="ac-bg")
        //- over the line art: the stickers, so they cover the lines like real stickers
        canvas(ref="stickerView" class="ac-stickers")

      div(v-show="isLoading" class="ac-loading")
        div(class="ac-spinner")
        div(class="ac-loading-txt") {{ t('app.coloring.loading') }}

    div(v-if="penLogOn" class="ac-penlog") {{ penLog || 'penlog' }}

    //- the picture of an adventure stage comes with tasks ("Male den Regenbogen mit Wasserfarbe."): a small list under the top bar, ticked as they are done
    div(v-if="advJobs.length && hasImage" class="ac-jobs" role="group" :aria-label="t('app.adventure.paintJobsTitle')")
      button(type="button" class="ac-jobs-head" :aria-expanded="!jobsFolded" @click="jobsFolded = !jobsFolded")
        span {{ t('app.adventure.paintJobsTitle') }}
        span(class="ac-jobs-count") {{ jobsDone }} / {{ advJobs.length }}
        span(class="ac-jobs-arrow" aria-hidden="true") {{ jobsFolded ? '▾' : '▴' }}
      ul(v-show="!jobsFolded" class="ac-jobs-list")
        li(v-for="(j, i) in advJobs" :key="i" class="ac-job" :class="{ done: jobStatus[i] === 'met' }")
          span(class="ac-job-mark" aria-hidden="true") {{ jobStatus[i] === 'met' ? '✓' : '○' }}
          span {{ j.hint }}
          span(class="ac-vh") {{ jobStatus[i] === 'met' ? t('app.adventure.paintJobDone') : t('app.adventure.paintJobOpen') }}

    //- ───────── Floating top bar ─────────
    header(v-if="hasImage" class="ac-top")
      button(type="button" class="ac-btn" :aria-label="t('app.coloring.back')" @click="onBack")
        img(:src="LINE_ICONS.back" alt="" draggable="false")
      div(v-if="!hasImage" class="ac-title") {{ t('app.coloring.title') }}
      //- the picture of an adventure stage: this button hands the finished picture in and goes back to the stage
      AdvButton(v-if="advCtx && hasImage" class="ac-adv-done" tone="gold" small @click="finishPicture") {{ t('app.coloring.doneShort') }}
      //- the picture for the thank-you book: this button puts it in the book and goes back there
      AdvButton(v-if="journalCtx && hasImage" class="ac-adv-done" tone="gold" small @click="toJournal(true)") {{ t('app.coloring.journalDone') }}
      div(class="ac-spacer")

      button(
        v-if="pageInfo"
        type="button"
        class="ac-btn"
        :class="{ on: textOpen }"
        :aria-pressed="textOpen"
        :aria-label="t('app.coloring.pageText')"
        :title="t('app.coloring.pageText')"
        @click="textOpen = !textOpen"
      )
        img(:src="LINE_ICONS.text" alt="" draggable="false")

      //- Zoom: the hand, minus, the percentage, plus (a touch screen shows only the percentage once it is zoomed)
      ColoringZoomBar(
        v-if="hasImage && showZoom"
        :percent="zoomPct"
        :pan="panMode"
        :mouse="finePointer"
        @zoom-in="zoomStep(1.25)"
        @zoom-out="zoomStep(0.8)"
        @reset="resetZoom"
        @toggle-pan="panMode = !panMode"
      )

      //- Quick eraser, undo and redo next to the page arrows
      div(v-if="hasImage" class="ac-quick")
        button(
          type="button"
          class="ac-btn"
          :class="{ on: tool === 'eraser' }"
          :aria-pressed="tool === 'eraser'"
          :aria-label="t('app.coloring.toolName.eraser')"
          @click="onQuickEraser"
        )
          img(:src="LINE_ICONS.eraser" alt="" draggable="false")
        button(type="button" class="ac-btn" :disabled="!canUndo" :aria-label="t('app.coloring.undo')" @click="undo")
          img(:src="LINE_ICONS.undo" alt="" draggable="false")
        button(type="button" class="ac-btn" :disabled="!canRedo" :aria-label="t('app.coloring.redo')" @click="redo")
          img(:src="LINE_ICONS.redo" alt="" draggable="false")

      div(class="ac-pages" v-if="hasImage && navTotal > 1")
        button(class="ac-pg-btn" :disabled="navCurrent <= 1" :aria-label="t('app.coloring.prevPage')" @click="gotoPage(-1)") ‹
        span(class="ac-pg-info") {{ navCurrent }} / {{ navTotal }}
        button(class="ac-pg-btn" :disabled="navCurrent >= navTotal" :aria-label="t('app.coloring.nextPage')" @click="gotoPage(1)") ›

      template(v-if="hasImage")
        button(type="button" class="ac-btn" :class="{ on: menuOpen }" :aria-label="t('app.coloring.menu')" :aria-expanded="menuOpen" @click="toggleMenu")
          img(:src="LINE_ICONS.more" alt="" draggable="false")

    //- The text that belongs to the picture of a coloring book; the button above shows and hides it
    transition(name="ac-text")
      div(v-if="textOpen && pageInfo && !isFullscreen" class="ac-text" role="dialog" :aria-label="t('app.coloring.pageText')")
        h3(class="ac-text-title") {{ pageInfo.title }}
        p(v-if="pageInfo.reference" class="ac-text-ref") {{ pageInfo.reference }}
        p(v-if="pageInfo.text" class="ac-text-body") {{ pageInfo.text }}

    //- Menu: only what is needed now and then.
    div(v-if="menuOpen" class="ac-menu-shade" @click="menuOpen = false")
    div(v-if="menuOpen" class="ac-menu" :class="{ wide: menuPage !== 'main' }" role="menu")
      //- the eraser: how big it is and what a tap does
      template(v-if="menuPage === 'eraser'")
        button(type="button" class="ac-mi ac-mi-back" @click="menuPage = 'main'")
          img(:src="LINE_ICONS.back" alt="" draggable="false")
          span {{ t('app.coloring.toolName.eraser') }}
        div(class="ac-erpop-sizes" role="group" :aria-label="t('app.coloring.size')")
          button(
            v-for="(n, i) in ERASER_SIZES"
            :key="n"
            type="button"
            class="ac-erpop-size"
            :class="{ on: eraserSize === n }"
            :aria-pressed="eraserSize === n"
            :aria-label="t(`app.coloring.eraserSize${i + 1}`)"
            @click="setEraserSize(n)"
          )
            span(:style="{ width: `${Math.max(6, n * 0.7)}px`, height: `${Math.max(6, n * 0.7)}px` }")
        label(class="ac-erpop-row")
          input(type="range" min="2" max="60" step="1" :value="eraserSize" :aria-label="t('app.coloring.size')" @input="onEraserRange")
        label(class="ac-erpop-tap")
          input(type="checkbox" v-model="eraserField")
          span {{ t('app.coloring.eraserField') }}
      //- the scene behind the paper
      template(v-else-if="menuPage === 'scene'")
        button(type="button" class="ac-mi ac-mi-back" @click="menuPage = 'main'")
          img(:src="LINE_ICONS.back" alt="" draggable="false")
          span {{ t('app.coloring.backdropShort') }}
        div(class="ac-scenes")
          button(
            v-for="b in BACKDROPS"
            :key="b.id"
            type="button"
            class="ac-scene"
            :class="{ on: backdropId === b.id }"
            :aria-pressed="backdropId === b.id"
            @click="setBackdrop(b.id)"
          )
            span(class="ac-scene-thumb" :class="`is-${b.id}`" :style="b.thumb ? { backgroundImage: `url(${b.thumb})` } : {}")
            span(class="ac-scene-name") {{ t(`app.coloring.backdrops.${b.id}`) }}
        div(v-if="backdropId === 'plain'" class="ac-plain" role="group" :aria-label="t('app.coloring.plainColor')")
          button(
            v-for="c in PLAIN_COLORS"
            :key="c.id"
            type="button"
            class="ac-swatch"
            :class="{ on: plainColorId === c.id }"
            :style="{ background: c.css }"
            :aria-pressed="plainColorId === c.id"
            :aria-label="t(`app.coloring.plainColors.${c.id}`)"
            :title="t(`app.coloring.plainColors.${c.id}`)"
            @click="setPlainColor(c.id)"
          )
      template(v-else)
        //- the one thing most children want: the picture is done
        button(type="button" role="menuitem" class="ac-done" @click="finishPicture")
          span(class="ac-done-ico")
            img(:src="LINE_ICONS.check" alt="" draggable="false")
          span(class="ac-done-text")
            strong {{ t('app.coloring.finish') }}
            small {{ t('app.coloring.finishSub') }}
        p(class="ac-mg") {{ t('app.coloring.menuPaint') }}
        div(class="ac-tiles")
          button(type="button" role="menuitem" class="ac-tile" @click="menuPage = 'eraser'")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.eraser" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.toolName.eraser') }}
          button(type="button" role="menuitem" class="ac-tile" @click="menuPage = 'scene'")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.background" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.backdropShort') }}
          button(type="button" role="menuitem" class="ac-tile" @click="menuAction(enterFullscreen)")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.fullscreen" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.fullscreen') }}
        p(class="ac-mg") {{ t('app.coloring.menuSend') }}
        div(class="ac-tiles")
          button(type="button" role="menuitem" class="ac-tile" @click="menuAction(downloadPng)")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.save" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.savePng') }}
          button(v-if="canShareCanvas" type="button" role="menuitem" class="ac-tile" @click="menuAction(shareCanvas)")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.share" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.share') }}
          button(type="button" role="menuitem" class="ac-tile" @click="menuAction(openCard)")
            span(class="ac-tile-ico")
              img(:src="LINE_ICONS.text" alt="" draggable="false")
            span(class="ac-tile-name") {{ t('app.coloring.card.menu') }}
        div(class="ac-menu-foot")
          button(type="button" role="menuitem" class="ac-foot-btn" @click="menuAction(closePicture)")
            img(:src="LINE_ICONS.frames" alt="" draggable="false")
            span {{ advCtx ? t('app.coloring.backToStage') : bookCtx ? t('app.coloring.bookOverview') : t('app.coloring.newPage') }}
          button(type="button" role="menuitem" class="ac-foot-btn danger" @click="menuAction(clearAll)")
            img(:src="LINE_ICONS.trash" alt="" draggable="false")
            span {{ t('app.coloring.clear') }}

    //- Leave fullscreen
    button(
      v-if="isFullscreen"
      type="button"
      class="ac-btn ac-exitfs"
      :aria-label="t('app.coloring.fullscreenExit')"
      @click="exitFullscreen"
    )
      img(:src="LINE_ICONS.fullscreen" alt="" draggable="false")

    //- A short tip: hold the pen still to straighten a line or make a figure
    transition(name="ac-text")
      div(v-if="shapeHint" class="ac-hint-chip" role="status") {{ t('app.coloring.shapeHint') }}

    transition(name="ac-text")
      div(v-if="stampHint && live" class="ac-hint-chip" role="status") {{ t('app.coloring.stampHint') }}

    //- "Picture saved", for a moment before the painting program is left
    div(v-if="savedFlash" class="ac-saved" role="status")
      img(:src="LINE_ICONS.check" alt="" draggable="false")
      span {{ t('app.coloring.savedNote') }}

    //- ───────── The floating tool bar ─────────
    ColoringToolbar(
      v-if="hasImage"
      :style="toolbarStyle"
      :expanded="toolbarOpen"
      :tools="toolbarTools"
      :tool="barTool"
      :color="color"
      v-model:size="sizeModel"
      v-model:strength="strength"
      :tips="tips"
      :stay-inside="stayInside"
      :stamp="stampSet"
      :stamp-on="tool === 'stamp'"
      :rotation="rotation"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :shelf-open="shelfVisible"
      :edge="dock.edge"
      :carrying="!!carry"
      :current-sprite="currentSprite"
      @select-tool="selectToolById"
      @undo="undo"
      @redo="redo"
      @toggle-shelf="toggleShelf"
      @toggle-stay="stayInside = !stayInside"
      @pick-stamp="pickStamp"
      @set-stamp="setStamp"
      @set-rotation="setRotation"
      @collapse="toolbarOpen = false"
      @expand="onTabClick"
      @set-tip="setTip"
      :just-carried="justCarried"
      @set-dock="setDock"
      @grip-down="onHandleDown"
      @grip-move="onHandleMove"
      @grip-up="onHandleUp"
    )

    //- The way back to 0 degrees; in full screen (no top bar) also eraser, undo and redo, quiet in a corner of the picture
    div(v-if="hasImage && (isFullscreen || rotation !== 0)" class="ac-corner" :class="`on-${cornerSide}`" :style="cornerStyle")
      button(v-if="rotation !== 0" type="button" class="ac-corner-btn ac-corner-zero" :aria-label="t('app.coloring.rotateReset')" @click="setRotation(0, true)") 0°
      template(v-if="isFullscreen")
        button(type="button" class="ac-corner-btn" :class="{ on: tool === 'eraser' }" :aria-label="t('app.coloring.toolName.eraser')" @click="toggleEraser")
          img(:src="LINE_ICONS.eraser" alt="" draggable="false")
        button(type="button" class="ac-corner-btn" :disabled="!canUndo" :aria-label="t('app.coloring.undo')" @click="undo")
          img(:src="LINE_ICONS.undo" alt="" draggable="false")
        button(type="button" class="ac-corner-btn" :disabled="!canRedo" :aria-label="t('app.coloring.redo')" @click="redo")
          img(:src="LINE_ICONS.redo" alt="" draggable="false")
      ColoringZoomBar(
        v-if="isFullscreen && showZoom"
        variant="corner"
        :percent="zoomPct"
        :pan="panMode"
        :mouse="finePointer"
        @zoom-in="zoomStep(1.25)"
        @zoom-out="zoomStep(0.8)"
        @reset="resetZoom"
        @toggle-pan="panMode = !panMode"
      )

    //- ───────── Colour box at the bottom edge: tips of pencils, markers, brushes… ─────────
    ColoringShelf(
      v-if="hasImage"
      ref="shelfEl"
      :variant="kitDef.variant"
      :items="kitDef.base"
      :extra="kitDef.extra"
      :extra-locked="extraLocked"
      :custom-locked="!hasFeature('colors')"
      :rainbow="kitDef.rainbow"
      :color="color"
      :custom-active="!!customColor"
      :open="shelfVisible"
      :arrow-icon="LINE_ICONS.back"
      @pick-color="pickPreset"
      @pick-locked="showUpsell('colors')"
      @custom="onCustomPencil"
      @toggle="toggleShelf"
    )

    transition(name="ac-notice")
      p(
        v-if="saveNotice"
        :class="['ac-save-notice', { 'is-denied': saveNotice === 'denied' }]"
        role="status"
      ) {{ t(saveNotice === 'saved' ? 'app.coloring.savedToPhotos' : 'app.coloring.photosDenied') }}

    //- Small banner when an award was just won
    transition(name="ac-notice")
      router-link(
        v-if="lastAward"
        :to="{ name: 'app-awards' }"
        class="ac-award-banner"
        role="status"
      )
        img(:src="awardImage(lastAward)" alt="" draggable="false")
        span
          strong {{ t('app.awards.newAward') }}
          | {{ t(`app.awards.items.${lastAward}.title`) }}

    //- Picture finished
    div(
      v-if="finishInfo"
      class="ac-confirm-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="closeFinish"
    )
      div(class="ac-confirm-dialog ac-finish")
        img(class="ac-finish-star" :src="finishImage" alt="" draggable="false")
        h2(class="ac-confirm-title") {{ finishInfo.bookDone ? t('app.coloring.bookFinished') : t('app.coloring.pictureFinished') }}
        p(v-if="finishInfo.won.length" class="ac-confirm-body")
          span(class="ac-finish-label") {{ t('app.awards.newAward') }}
          strong(class="ac-finish-name") {{ finishInfo.won.map((w) => t(`app.awards.items.${w}.title`)).join(', ') }}
        p(v-else class="ac-confirm-body") {{ t('app.coloring.pictureFinishedText') }}
        button(v-if="finishInfo.hasLapse" type="button" class="ac-lapse-btn" @click="watchTimelapse") {{ t('app.coloring.timelapseWatch') }}
        div(class="ac-confirm-actions")
          button(type="button" class="ac-confirm-leave" @click="finishOverview") {{ retStats ? t('app.coloring.backToStats') : bookCtx ? t('app.coloring.bookOverview') : t('app.coloring.newPage') }}
          button(v-if="finishInfo.hasNext" type="button" class="ac-confirm-stay" @click="finishNext") {{ t('app.coloring.nextPage') }}
          button(v-else type="button" class="ac-confirm-stay" @click="closeFinish") {{ t('app.coloring.keepPainting') }}

    GreetingCardSheet(:open="cardOpen" @close="cardOpen = false" @send="sendCard")

    ColoringTimelapse(
      :open="lapseOpen"
      :data="lapseData"
      :line-art="bgCanvas"
      :gate="requireParent"
      @close="lapseOpen = false"
    )

    p(v-if="finishNote" class="ac-save-notice is-denied" role="status" @click="finishNote = ''") {{ finishNote }}

    div(ref="cursorRing" class="ac-cursor-ring")

    input(
      ref="fileInput"
      type="file"
      accept="application/pdf,image/*"
      class="ac-vh"
      @change="onFileInput"
    )
    ColoringColorPicker(
      :open="pickerOpen && hasImage"
      :color="customColor || color"
      :lift="pickerLift"
      @pick="pickCustom"
      @close="pickerOpen = false"
    )

    //- ===== Clear all colours of the sheet =====
    div(
      v-if="clearAsk"
      class="ac-confirm-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="clearAsk = false"
    )
      div(class="ac-confirm-dialog")
        h2(class="ac-confirm-title") {{ t('app.coloring.clearTitle') }}
        p(class="ac-confirm-body") {{ t('app.coloring.clearBody') }}
        div(class="ac-confirm-actions")
          button(type="button" class="ac-confirm-stay" @click="clearAsk = false") {{ t('app.coloring.deleteNo') }}
          button(type="button" class="ac-confirm-leave" @click="confirmClear") {{ t('app.coloring.clearYes') }}

    //- ===== Delete a saved picture =====
    div(
      v-if="deleteCandidate"
      class="ac-confirm-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="deleteCandidate = null"
    )
      div(class="ac-confirm-dialog")
        h2(class="ac-confirm-title") {{ t('app.coloring.deleteTitle') }}
        p(class="ac-confirm-body") {{ t('app.coloring.deleteBody') }}
        div(class="ac-confirm-actions")
          button(type="button" class="ac-confirm-stay" @click="deleteCandidate = null") {{ t('app.coloring.deleteNo') }}
          button(type="button" class="ac-confirm-leave" @click="confirmDelete") {{ t('app.coloring.deleteYes') }}
</template>

<style scoped lang="sass">
// A calm painting-app look: a neutral desk, the paper in the middle, small glass
// controls floating above it. Everything that is not the picture stays out of the way.
$ink: #22262e
$muted: #6c7280
$line: rgba(20, 24, 32, 0.1)
$accent: #1f3a5f
$glass: rgba(252, 251, 248, 0.96)

// Values the picker and dialog rules below were written with.
$text: $ink
$text-m: $muted
$p-bdr: #e6d3a8
$p-pale: #fffaf0
$accent-dark: $accent

.ac-app
  position: fixed
  inset: 0
  overflow: hidden
  color: $ink
  user-select: none
  overscroll-behavior: none
  background-color: #cbc6bb
  background-image: var(--ac-bg-image, radial-gradient(ellipse at 50% 30%, #fff2d9 0%, #fbdcae 55%, #f3c58b 100%))
  background-size: cover
  background-position: center

// ── The picture area: the whole screen ───────────────────────────────────
.ac-main
  position: absolute
  inset: 0
  overflow: hidden
  background: transparent

// with a picture open the whole area is for the fingers of the picture: one paints, two zoom and move
.ac-app.has-image .ac-main
  touch-action: none

.ac-main.drop-over::after
  content: ''
  position: absolute
  inset: 10px
  border: 2px dashed $accent
  border-radius: 18px
  background: rgba(31, 58, 95, 0.06)
  z-index: 50
  pointer-events: none

.ac-canvas-wrap
  position: absolute
  top: 0
  left: 0
  display: none
  overflow: hidden
  isolation: isolate
  background: #ffffff
  box-shadow: 0 10px 40px rgba(30, 25, 15, 0.35), 0 1px 3px rgba(0, 0, 0, 0.25)
  transform-origin: 0 0
  will-change: transform
  touch-action: none

  &.active
    display: block

// Paint (draw) at the bottom, the stroke being drawn above it, the line art on
// top and multiplied: white paper lets the paint through, black lines stay black.
.ac-draw
  position: absolute
  inset: 0
  display: block
  width: 100%
  height: 100%
  touch-action: none
  -webkit-user-select: none
  user-select: none
  cursor: none

.ac-preview
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none
  opacity: 0

// the flashes of the glitter paint: over the paint, under the line art
.ac-sparkle
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.ac-bg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  mix-blend-mode: multiply
  pointer-events: none

// the stickers: the paint where a sticker sits, over the line art (see `utils/stickerCover.ts`)
.ac-stickers
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.ac-loading
  position: absolute
  inset: 0
  display: grid
  place-items: center
  align-content: center
  background: rgba(246, 205, 150, 0.92)
  z-index: 20

.ac-spinner
  width: 38px
  height: 38px
  border: 3px solid rgba(31, 58, 95, 0.2)
  border-top-color: $accent
  border-radius: 50%
  animation: ac-spin 0.7s linear infinite

@keyframes ac-spin
  to
    transform: rotate(360deg)

@media (prefers-reduced-motion: reduce)
  .ac-spinner
    animation-duration: 2s

.ac-loading-txt
  color: $ink
  font-size: 0.9rem
  font-weight: 700
  margin-top: 12px

.ac-cursor-ring
  position: fixed
  pointer-events: none
  border-radius: 50%
  z-index: 9000
  transform: translate(-50%, -50%)
  border: 1.5px solid rgba(31, 58, 95, 0.75)
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7)
  opacity: 0
  transition: opacity 0.12s

  &.show
    opacity: 1

  &.eraser-cursor
    border-color: rgba(192, 82, 106, 0.8)

// ── Floating top bar ───────────────────────────────────────────────────────
.ac-jobs
  position: absolute
  z-index: 29
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 58px)
  left: 50%
  transform: translateX(-50%)
  width: min(440px, calc(100% - 24px))
  border-radius: 16px
  background: rgba(255, 243, 207, 0.95)
  border: 2px solid #d4a83e
  color: #5f4f35
  box-shadow: 0 3px 8px rgba(40, 25, 5, 0.25)
  pointer-events: none

.ac-jobs-head
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  width: 100%
  min-height: 32px
  padding: 2px 12px
  border: 0
  background: transparent
  color: inherit
  font: inherit
  font-weight: 800
  font-size: 0.85rem
  cursor: pointer
  pointer-events: auto

.ac-jobs-count
  padding: 0 8px
  border-radius: 999px
  background: rgba(212, 168, 62, 0.35)

.ac-jobs-list
  margin: 0
  padding: 0 12px 8px
  list-style: none

.ac-job
  display: flex
  gap: 8px
  align-items: baseline
  padding: 2px 0
  font-weight: 700
  font-size: 0.92rem
  line-height: 1.25

  &.done
    color: #1f6b3a

.ac-job-mark
  flex: none
  width: 1.2em
  text-align: center
  font-weight: 900

.ac-top
  position: absolute
  top: 0
  left: 0
  right: 0
  z-index: 30
  display: flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  padding-top: max(env(safe-area-inset-top, 0px), 10px)
  pointer-events: none
  transition: opacity 160ms ease-out

  > *
    pointer-events: auto

.ac-spacer
  flex: 1
  pointer-events: none !important

.ac-title
  padding: 8px 14px
  border-radius: 12px
  background: $glass
  font-weight: 800
  font-size: 0.95rem
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)

.ac-btn
  flex: 0 0 auto
  width: 42px
  height: 42px
  display: grid
  place-items: center
  border: 1px solid $line
  border-radius: 12px
  background: $glass
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: background 120ms ease-out, transform 100ms ease-out

  img
    width: 22px
    height: 22px
    object-fit: contain
    pointer-events: none

  &:active:not(:disabled)
    transform: scale(0.94)

  &:disabled
    opacity: 0.4
    cursor: default

  &.on
    background: rgba(31, 58, 95, 0.12)

// the eraser page of the menu: size and what a tap does
.ac-erpop-sizes
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 8px
  padding: 4px 6px

.ac-erpop-size
  height: 56px
  display: grid
  place-items: center
  border: 1px solid $line
  border-radius: 14px
  background: #fff
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  span
    display: block
    border-radius: 50%
    background: #c0526a
    opacity: 0.75

  &.on
    border-color: #1f3a5f
    background: rgba(31, 58, 95, 0.1)
    box-shadow: 0 0 0 2px rgba(31, 58, 95, 0.35)

.ac-erpop-row
  display: flex
  margin: 8px 6px 0

  input[type="range"]
    flex: 1
    min-width: 0
    height: 28px
    accent-color: #1f3a5f

.ac-erpop-tap
  display: flex
  align-items: center
  gap: 10px
  min-height: 44px
  margin: 4px 6px 2px
  font-size: 0.85rem
  font-weight: 700
  color: $ink
  cursor: pointer

  input
    flex: 0 0 22px
    width: 22px
    height: 22px
    accent-color: #1f3a5f

// the window with the text of the picture, under the top bar
.ac-text
  position: fixed
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 52px)
  right: 12px
  z-index: 45
  width: min(380px, calc(100vw - 24px))
  max-height: min(60vh, 460px)
  overflow-y: auto
  padding: 16px 18px 18px
  border: 1px solid $line
  border-radius: 18px
  background: rgba(252, 251, 248, 0.97)
  box-shadow: 0 14px 40px rgba(20, 24, 32, 0.34)
  user-select: text
  -webkit-user-select: text

.ac-text-enter-active,
.ac-text-leave-active
  transition: opacity 200ms ease-out, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)

.ac-text-enter-from,
.ac-text-leave-to
  opacity: 0
  transform: translateY(-8px)

.ac-text-title
  margin: 0 0 4px
  font-size: 1.05rem
  font-weight: 800

.ac-text-ref
  margin: 0 0 10px
  font-size: 0.8rem
  font-weight: 700
  color: $muted

.ac-text-body
  margin: 0
  font-size: 1rem
  line-height: 1.55
  white-space: pre-line

.ac-main.is-pan .ac-draw
  cursor: grab

// buttons answer at once: no waiting to see whether a second tap follows
.ac-app :deep(:where(button, a))
  touch-action: manipulation

.ac-quick
  display: flex
  align-items: center
  gap: 6px

.ac-pages
  display: flex
  align-items: center
  gap: 6px
  padding: 4px 8px
  border-radius: 12px
  background: $glass
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)

.ac-pg-btn
  width: 30px
  height: 30px
  border: 0
  border-radius: 8px
  background: transparent
  color: $ink
  font-size: 1.1rem
  font-weight: 800
  cursor: pointer

  &:disabled
    opacity: 0.35

.ac-pg-info
  font-size: 0.85rem
  font-weight: 700
  color: $muted
  white-space: nowrap

// Phones: smaller buttons so the whole top bar fits; where it still does not (a very narrow screen, or the zoom buttons
// showing), the bar can be swiped sideways and the last button (the menu) is reached.
@media (max-width: 520px)
  .ac-top
    gap: 4px
    padding-left: 8px
    padding-right: 8px
    padding-bottom: 14px
    overflow-x: auto
    overflow-y: hidden
    overscroll-behavior-x: contain
    scrollbar-width: none
    touch-action: pan-x

    &::-webkit-scrollbar
      display: none

    > *
      flex-shrink: 0

  .ac-btn
    width: 36px
    height: 36px
    border-radius: 10px

    img
      width: 20px
      height: 20px

  .ac-quick
    gap: 4px

  .ac-pages
    gap: 2px
    padding: 2px 4px

  .ac-pg-btn
    width: 28px
    height: 30px

  .ac-pg-info
    font-size: 0.78rem

// ── Finished picture, awards ────────────────────────────────────────────────────────
.ac-mi-main
  font-weight: 800

.ac-finish
  text-align: center

.ac-lapse-btn
  display: block
  margin: 0 auto 14px
  min-height: 44px
  padding: 0 20px
  border: 2px solid $accent
  border-radius: 999px
  background: transparent
  color: $accent
  font: inherit
  font-weight: 800
  font-size: 0.92rem
  cursor: pointer

.ac-finish-label
  display: block
  font-size: 0.7rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #7a6b55

.ac-finish-name
  display: block
  font-size: 1.1rem
  color: $ink

.ac-finish-star
  display: block
  width: 96px
  height: 96px
  margin: 0 auto 8px
  object-fit: contain
  filter: drop-shadow(0 6px 10px rgba(60, 40, 10, 0.35))

.ac-award-banner
  position: fixed
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 56px)
  left: 50%
  transform: translateX(-50%)
  z-index: 80
  display: flex
  align-items: center
  gap: 10px
  max-width: min(92vw, 380px)
  padding: 8px 16px 8px 8px
  border-radius: 16px
  background: $accent
  color: #ffffff
  font-size: 0.85rem
  text-decoration: none
  box-shadow: 0 8px 20px -8px rgba(10, 26, 48, 0.55)

  img
    width: 42px
    height: 42px
    object-fit: contain
    flex: 0 0 auto

  strong
    display: block
    font-size: 0.7rem
    letter-spacing: 0.06em
    text-transform: uppercase
    color: #f5d27a

.ac-ico-sm
  display: block
  width: 18px
  height: 18px
  object-fit: contain
  pointer-events: none

.ac-exitfs
  position: absolute
  top: max(env(safe-area-inset-top, 0px), 10px)
  right: 12px
  z-index: 40
  opacity: 0.55

  &:hover
    opacity: 1

// ── Menu ──────────────────────────────────────────────────────────────────────
.ac-penlog
  position: fixed
  left: 8px
  bottom: 8px
  z-index: 99
  padding: 4px 10px
  border-radius: 10px
  background: rgba(0, 0, 0, 0.75)
  color: #fff
  font: 12px monospace
  pointer-events: none

.ac-menu-shade
  position: fixed
  inset: 0
  z-index: 55

.ac-menu
  position: absolute
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 50px)
  right: 12px
  z-index: 60
  width: 300px
  max-width: calc(100vw - 24px)
  // leaves the colour box at the bottom free; what does not fit scrolls
  max-height: calc(100vh - 210px)
  overflow-y: auto
  padding: 10px
  border-radius: 22px
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.98) 0%, rgba(247, 243, 235, 0.98) 100%)
  border: 1px solid $line
  box-shadow: 0 18px 48px rgba(20, 24, 32, 0.34), 0 1px 0 rgba(255, 255, 255, 0.8) inset
  transform-origin: top right
  animation: ac-menu-in 220ms cubic-bezier(0.22, 1, 0.36, 1)

@keyframes ac-menu-in
  from
    opacity: 0
    transform: translateY(-6px) scale(0.97)

@media (prefers-reduced-motion: reduce)
  .ac-menu
    animation: none

.ac-menu.wide
  width: 292px

// the big button: the picture is done
.ac-done
  width: 100%
  display: flex
  align-items: center
  gap: 12px
  padding: 10px 14px 10px 10px
  border: 0
  border-radius: 16px
  background: linear-gradient(135deg, #2a4f7e 0%, #1f3a5f 100%)
  color: #ffffff
  text-align: left
  cursor: pointer
  box-shadow: 0 6px 16px -6px rgba(31, 58, 95, 0.7)
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.985)

.ac-done-ico
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 42px
  height: 42px
  border-radius: 50%
  background: rgba(255, 255, 255, 0.92)

  img
    width: 24px
    height: 24px
    object-fit: contain

.ac-done-text
  display: flex
  flex-direction: column
  min-width: 0

  strong
    font-size: 1rem
    font-weight: 800

  small
    font-size: 0.74rem
    font-weight: 600
    opacity: 0.82
    line-height: 1.25

// small group headings
.ac-mg
  margin: 14px 4px 6px
  font-size: 0.68rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #7a6b55

// the tiles: a round picture, the name beneath
.ac-tiles
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 6px

.ac-tile
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 10px 4px 8px
  border: 1px solid $line
  border-radius: 16px
  background: rgba(255, 255, 255, 0.78)
  color: $ink
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 100ms ease-out, background 140ms ease-out

  &:active
    transform: scale(0.95)
    background: rgba(31, 58, 95, 0.1)

.ac-tile-ico
  display: grid
  place-items: center
  width: 44px
  height: 44px
  border-radius: 50%
  background: rgba(31, 58, 95, 0.09)

  img
    width: 24px
    height: 24px
    object-fit: contain
    opacity: 0.9

.ac-tile-name
  font-size: 0.74rem
  font-weight: 700
  line-height: 1.2
  text-align: center

.ac-menu-foot
  display: flex
  flex-direction: column
  gap: 2px
  margin-top: 12px
  padding-top: 8px
  border-top: 1px solid $line

.ac-foot-btn
  display: flex
  align-items: center
  gap: 10px
  padding: 10px 8px
  border: 0
  border-radius: 12px
  background: transparent
  color: $ink
  font-size: 0.88rem
  font-weight: 600
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    width: 20px
    height: 20px
    object-fit: contain
    opacity: 0.8

  &:active
    background: rgba(20, 24, 32, 0.07)

  &.danger
    color: #a93d2e

// "picture saved": a calm note in the middle of the screen while leaving
.ac-saved
  position: fixed
  left: 50%
  top: 50%
  transform: translate(-50%, -50%)
  z-index: 80
  display: flex
  align-items: center
  gap: 10px
  padding: 14px 22px
  border-radius: 999px
  background: rgba(255, 253, 249, 0.97)
  border: 1px solid $line
  color: $ink
  font-size: 1.05rem
  font-weight: 800
  box-shadow: 0 16px 40px rgba(20, 24, 32, 0.34)
  pointer-events: none
  animation: ac-saved-in 220ms cubic-bezier(0.22, 1, 0.36, 1)

  img
    width: 26px
    height: 26px
    object-fit: contain

@keyframes ac-saved-in
  from
    opacity: 0
    transform: translate(-50%, -46%) scale(0.94)

// the frame of the stamp that can still be changed
.ac-stamp-frame
  position: absolute
  z-index: 7
  box-sizing: border-box
  border: 2px dashed rgba(31, 58, 95, 0.75)
  border-radius: 10%
  pointer-events: none
  transition: box-shadow 160ms ease-out

  &.held
    border-style: solid
    border-color: rgba(31, 58, 95, 0.95)
    box-shadow: 0 0 0 4px rgba(31, 58, 95, 0.18)

.ac-stamp-dot
  position: absolute
  left: 50%
  top: 108%
  width: 22px
  height: 22px
  box-sizing: border-box
  border: 3px solid #ffffff
  border-radius: 50%
  background: #1f3a5f
  box-shadow: 0 2px 8px rgba(20, 24, 32, 0.4)
  transform: translate(-50%, -50%)
  transition: box-shadow 140ms ease-out, background 140ms ease-out

  &.held
    background: #2f6fd0
    box-shadow: 0 0 0 7px rgba(47, 111, 208, 0.28), 0 2px 8px rgba(20, 24, 32, 0.4)

// a calm tip chip at the top of the screen
.ac-hint-chip
  position: fixed
  left: 50%
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 62px)
  transform: translateX(-50%)
  z-index: 58
  max-width: min(92vw, 440px)
  padding: 10px 16px
  border-radius: 18px
  background: rgba(31, 58, 95, 0.94)
  color: #ffffff
  font-size: 0.85rem
  font-weight: 600
  text-align: center
  box-shadow: 0 10px 26px rgba(10, 26, 48, 0.4)
  pointer-events: none

.ac-mi-back
  font-weight: 800

.ac-scenes
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 8px
  padding: 4px 6px

.ac-scene
  display: flex
  flex-direction: column
  gap: 4px
  padding: 5px
  border: 2px solid transparent
  border-radius: 12px
  background: transparent
  color: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.on
    border-color: #1f3a5f

.ac-scene-thumb
  display: block
  aspect-ratio: 4 / 3
  border-radius: 8px
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 0 1px rgba(20, 24, 32, 0.14)

  &.is-plain
    background: radial-gradient(ellipse at 50% 30%, #fff2d9 0%, #fbdcae 55%, #f3c58b 100%)

.ac-scene-name
  font-size: 0.75rem
  font-weight: 700
  text-align: center

.ac-plain
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin: 6px 6px 4px
  padding-top: 10px
  border-top: 1px solid $line

.ac-swatch
  width: 30px
  height: 30px
  padding: 0
  border: 2px solid #ffffff
  border-radius: 50%
  box-shadow: 0 0 0 1px rgba(20, 24, 32, 0.25)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.on
    box-shadow: 0 0 0 2px #1f3a5f

.ac-mi
  width: 100%
  display: flex
  align-items: center
  gap: 12px
  padding: 11px 12px
  border: 0
  border-radius: 10px
  background: transparent
  color: $ink
  font-size: 0.92rem
  font-weight: 600
  text-align: left
  cursor: pointer

  img
    width: 20px
    height: 20px
    object-fit: contain
    opacity: 0.85

  &:active
    background: rgba(20, 24, 32, 0.07)

  &.danger
    color: #a93d2e

// Undo and redo, quiet in a corner of the picture
.ac-corner
  position: fixed
  bottom: calc(14px + env(safe-area-inset-bottom, 0px) + var(--lift, 0px))
  z-index: 40
  display: flex
  gap: 6px
  transition: bottom 460ms cubic-bezier(0.22, 1, 0.36, 1)

  &.on-right
    right: calc(14px + env(safe-area-inset-right, 0px))

  &.on-left
    left: calc(14px + env(safe-area-inset-left, 0px))

.ac-corner-btn
  display: grid
  place-items: center
  min-width: 38px
  height: 38px
  padding: 0
  border: 1px solid rgba(20, 24, 32, 0.08)
  border-radius: 13px
  background: rgba(252, 251, 248, 0.6)
  color: $ink
  opacity: 0.62
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: opacity 140ms ease-out, transform 100ms ease-out

  img
    width: 19px
    height: 19px
    object-fit: contain
    pointer-events: none

  &:active:not(:disabled)
    opacity: 1
    transform: scale(0.94)

  &:disabled
    opacity: 0.22
    cursor: default

.ac-corner-btn.on
  opacity: 1
  background: rgba(31, 58, 95, 0.18)

.ac-corner-zero
  padding: 0 10px
  font-size: 0.82rem
  font-weight: 800
  opacity: 0.85

// Everything fades while a stroke is on, so nothing distracts from the paper.
.ac-app.is-painting .ac-top
  opacity: 0.12
  pointer-events: none

.ac-app.ui-hidden .ac-top
  display: none

// ── Notices ────────────────────────────────────────────────────────────────────────
.ac-save-notice
  position: fixed
  top: calc(max(env(safe-area-inset-top, 0px), 10px) + 56px)
  left: 50%
  transform: translateX(-50%)
  z-index: 80
  max-width: min(90vw, 360px)
  margin: 0
  padding: 10px 18px
  border-radius: 12px
  background: $accent
  color: #ffffff
  font-size: 14px
  font-weight: 700
  text-align: center
  box-shadow: 0 8px 20px -8px rgba(10, 26, 48, 0.5)
  pointer-events: none

  &.is-denied
    background: $glass
    color: $ink
    border: 1px solid $line

.ac-notice-enter-active, .ac-notice-leave-active
  transition: opacity 200ms ease-out, transform 200ms ease-out

.ac-notice-enter-from, .ac-notice-leave-to
  opacity: 0
  transform: translate(-50%, -6px)

.ac-vh
  position: absolute
  opacity: 0
  pointer-events: none
  width: 1px
  height: 1px
// ── Unsaved-changes confirmation modal ───────────────────────────────────
.ac-confirm-overlay
  position: fixed
  inset: 0
  z-index: 1000
  background: rgba(20, 14, 6, 0.55)
  display: flex
  align-items: center
  justify-content: center
  padding: 20px
  animation: ac-fade-in 0.16s ease-out

.ac-confirm-dialog
  width: 100%
  max-width: 360px
  background: linear-gradient(180deg, #fffaf0 0%, #f6e9c8 100%)
  border: 1.5px solid $p-bdr
  border-radius: 22px
  padding: 22px 22px 18px
  box-shadow: 0 20px 60px -16px rgba(58, 42, 18, 0.5)
  animation: ac-pop-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)

.ac-confirm-title
  margin: 0 0 8px
  font-size: 1.2rem
  font-weight: 800
  color: $text

.ac-confirm-body
  margin: 0 0 18px
  font-size: 0.95rem
  line-height: 1.45
  color: $text-m

.ac-confirm-actions
  display: flex
  gap: 8px
  justify-content: flex-end
  flex-wrap: wrap

.ac-confirm-stay,
.ac-confirm-leave
  font: inherit
  font-weight: 800
  font-size: 0.95rem
  border: none
  cursor: pointer
  padding: 12px 20px
  border-radius: 999px
  min-height: 46px

  &:active
    transform: scale(0.96)

.ac-confirm-stay
  background: $accent
  color: #ffffff
  box-shadow: none

.ac-confirm-leave
  background: $p-pale
  color: $text
  border: 2px solid $p-bdr

@keyframes ac-fade-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes ac-pop-in
  from
    opacity: 0
    transform: scale(0.92)
  to
    opacity: 1
    transform: scale(1)
</style>
