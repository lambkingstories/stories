import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BookDTO, BookLocalization, Locale } from '@/types'
import { normalizeAttachment, normalizeLocalizedImage } from '@/types'
import { isColoringCategory } from '@/utils/coloringBook'

const AUTOSAVE_KEY_PREFIX = 'bookDraft:'
const AUTOSAVE_INTERVAL_MS = 5000

function storageKey(bookId: string): string {
  return `${AUTOSAVE_KEY_PREFIX}${bookId || '_new'}`
}

interface StoredDraft {
  savedAt: number
  book: BookDTO
  isEditingExisting: boolean
}

function readLocalDraft(bookId: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(bookId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft
    if (!parsed?.book) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocalDraft(bookId: string, payload: StoredDraft): void {
  try {
    localStorage.setItem(storageKey(bookId), JSON.stringify(payload))
  } catch {
    /* quota / disabled — autosave is best-effort */
  }
}

function clearLocalDraft(bookId: string): void {
  try {
    localStorage.removeItem(storageKey(bookId))
  } catch {
    /* ignore */
  }
}

function emptyLocalization(): BookLocalization {
  return { title: '', shortDescription: '', description: '', contentNotes: '', content: [] }
}

function emptyBook(): BookDTO {
  return {
    bookId: '',
    author: 'Anton Bernt',
    category: '',
    bookSeriesId: '',
    kind: 'story',
    freePages: null,
    releaseDate: new Date().toISOString().slice(0, 10),
    badges: [],
    websiteTags: [],
    websitePrice: '',
    cover: '',
    coverImage: { de: '', en: '' },
    previewImage: { de: '', en: '' },
    contentCoverImage: { de: '', en: '' },
    achievementBadge: { de: '', en: '' },
    etsyLink: { de: '', en: '' },
    audio: { de: '', en: '' },
    attachments: [],
    localizations: { de: emptyLocalization() },
    isPublished: true
  }
}

export const useBookDraftStore = defineStore('bookDraft', () => {
  const book = ref<BookDTO>(emptyBook())
  const activeLocale = ref<Locale>('de')
  const isEditingExisting = ref(false)
  const uploadStatus = ref<Record<string, { ok: boolean; message?: string; filename?: string } | null>>({
    audio: null,
    coverDe: null,
    coverEn: null,
    previewDe: null,
    previewEn: null,
    contentCoverDe: null,
    contentCoverEn: null,
    achievementBadgeDe: null,
    achievementBadgeEn: null
  })

  // Snapshot-based dirty tracking — every load/reset/save captures the
  // current book payload as the canonical "clean" state, and `isDirty`
  // checks the live book against it. Snapshot is JSON because the book
  // graph is plain data (no class instances) and that's the cheapest deep
  // equality check; the strings stay small relative to any base64 uploads.
  const cleanSnapshot = ref<string>(JSON.stringify(book.value))

  // Sticky banner flag — flips true when a `load(b)` or `restoreNewDraft()`
  // pulls a localStorage backup back into the in-memory draft. The user has
  // to dismiss the warning explicitly so they don't mistake a restored-but-
  // unsaved state for a freshly saved one and walk away from the page.
  const restoredDraftPending = ref(false)

  function snapshotClean() {
    cleanSnapshot.value = JSON.stringify(book.value)
    // After a successful save the server-persisted state and the in-memory
    // draft agree, so the local backup must be discarded — otherwise an F5
    // would resurrect old "dirty" state and silently overwrite the saved
    // version on the next autosave tick.
    clearLocalDraft(book.value.bookId || '_new')
    // The "you have unsaved restored changes" warning is no longer truthful
    // once the server confirms the save, so retire it automatically.
    restoredDraftPending.value = false
  }

  const isDirty = computed(() => JSON.stringify(book.value) !== cleanSnapshot.value)

  // 5-second autosave: dump the current draft to localStorage so a hard
  // reload (F5) or an unexpected error doesn't lose unsaved work. We only
  // write when dirty so we don't churn storage with redundant copies of the
  // server's clean state.
  let autosaveTimer: ReturnType<typeof setInterval> | null = null
  let lastAutosaveBookId = ''

  function startAutosave() {
    if (autosaveTimer) return
    autosaveTimer = setInterval(() => {
      const id = book.value.bookId || '_new'
      // If the bookId changed (user just filled in the slug for a brand-new
      // book) clean up the prior `_new` slot so we don't accumulate stale
      // recovery rows.
      if (lastAutosaveBookId && lastAutosaveBookId !== id) {
        clearLocalDraft(lastAutosaveBookId)
      }
      lastAutosaveBookId = id
      if (!isDirty.value) return
      writeLocalDraft(id, {
        savedAt: Date.now(),
        book: JSON.parse(JSON.stringify(book.value)) as BookDTO,
        isEditingExisting: isEditingExisting.value
      })
    }, AUTOSAVE_INTERVAL_MS)
  }

  function stopAutosave() {
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }
  }

  const setLocale = (l: Locale) => {
    if (!book.value.localizations[l]) book.value.localizations[l] = emptyLocalization()
    activeLocale.value = l
  }

  const activeLocalization = computed<BookLocalization>({
    get() {
      const l = book.value.localizations[activeLocale.value]
      if (!l) {
        const empty = emptyLocalization()
        book.value.localizations[activeLocale.value] = empty
        return empty
      }
      return l
    },
    set(v: BookLocalization) {
      book.value.localizations[activeLocale.value] = v
    }
  })

  const reset = () => {
    // Drop both the in-memory and persisted draft for whatever was being
    // edited so a "Zurücksetzen" can't be undone by an F5 + autosave race.
    clearLocalDraft(book.value.bookId || '_new')
    book.value = emptyBook()
    activeLocale.value = 'de'
    isEditingExisting.value = false
    uploadStatus.value = {
      audio: null,
      coverDe: null,
      coverEn: null,
      previewDe: null,
      previewEn: null,
      contentCoverDe: null,
      contentCoverEn: null,
      achievementBadgeDe: null,
      achievementBadgeEn: null
    }
    cleanSnapshot.value = JSON.stringify(book.value)
    lastAutosaveBookId = ''
    restoredDraftPending.value = false
  }

  const load = (b: BookDTO) => {
    const cloned = JSON.parse(JSON.stringify(b)) as BookDTO
    if (!cloned.localizations.de) cloned.localizations.de = emptyLocalization()
    // books from before the kind existed: the category name says what they are
    if (cloned.kind !== 'story' && cloned.kind !== 'coloring') cloned.kind = isColoringCategory(cloned.category) ? 'coloring' : 'story'
    if (typeof cloned.freePages !== 'number') cloned.freePages = null
    if (!Array.isArray(cloned.websiteTags)) cloned.websiteTags = []
    if (typeof cloned.websitePrice !== 'string') cloned.websitePrice = ''
    // Older books store coverImage / previewImage as a plain URL string.
    // Promote to the new `{ de, en }` shape so the editor only ever sees
    // the localized form.
    cloned.coverImage = normalizeLocalizedImage(cloned.coverImage as unknown as string)
    cloned.previewImage = normalizeLocalizedImage(cloned.previewImage as unknown as string)
    // Defensive: legacy books still on disk store attachments as plain
    // string URLs. Normalise on load so the editor only sees the new shape.
    if (Array.isArray(cloned.attachments)) {
      cloned.attachments = (cloned.attachments as unknown[]).map(normalizeAttachment)
    } else {
      cloned.attachments = []
    }
    // The server snapshot is always treated as the canonical "clean" state
    // for dirty-tracking. When a localStorage draft exists for the same
    // bookId we restore those unsaved edits on top, so isDirty correctly
    // reflects "you have changes that haven't been pushed yet" after F5.
    cleanSnapshot.value = JSON.stringify(cloned)
    const local = readLocalDraft(b.bookId)
    if (local && local.book) {
      book.value = local.book
      isEditingExisting.value = local.isEditingExisting ?? true
      restoredDraftPending.value = true
    } else {
      book.value = cloned
      isEditingExisting.value = true
    }
    activeLocale.value = 'de'
    lastAutosaveBookId = book.value.bookId || '_new'
  }

  // Restore an in-progress new-book draft (the `_new` slot) on dashboard
  // mount when the user hasn't selected anything yet. Returns true if a
  // draft was actually restored.
  function restoreNewDraft(): boolean {
    const local = readLocalDraft('_new')
    if (!local || !local.book) return false
    book.value = local.book
    isEditingExisting.value = local.isEditingExisting ?? false
    activeLocale.value = 'de'
    cleanSnapshot.value = JSON.stringify(emptyBook())
    lastAutosaveBookId = '_new'
    restoredDraftPending.value = true
    return true
  }

  function dismissRestoredDraftBanner() {
    restoredDraftPending.value = false
  }

  const missingFields = computed<{ label: string; anchor: string }[]>(() => {
    const b = book.value
    const de = b.localizations.de
    const m: { label: string; anchor: string }[] = []
    if (!b.bookId) m.push({ label: 'Book-ID', anchor: 'field-bookId' })
    if (!b.author) m.push({ label: 'Autor', anchor: 'field-author' })
    if (!b.category) m.push({ label: 'Kategorie', anchor: 'field-category' })
    if (!b.bookSeriesId) m.push({ label: 'Buchreihe', anchor: 'field-bookSeries' })
    if (!b.releaseDate) m.push({ label: 'Erscheinungsdatum', anchor: 'field-releaseDate' })
    // Cover/Preview are intentionally NOT in this list — BookForm.submit()
    // auto-uploads the bundled placeholder for whichever slot is empty so
    // a hasty "save" still passes the API's required-image check. The user
    // can replace the placeholder upload later without any blocking gate.
    if (!de?.title) m.push({ label: 'Titel (DE)', anchor: 'field-title' })
    if (!de?.shortDescription) m.push({ label: 'Kurzbeschreibung (DE)', anchor: 'field-shortDescription' })
    if (!de?.description) m.push({ label: 'Beschreibung (DE)', anchor: 'field-description' })
    if (!de?.content?.length) m.push({ label: 'Seiten (DE)', anchor: 'field-content' })
    return m
  })

  const missingAnchors = computed(() => new Set(missingFields.value.map((m) => m.anchor)))

  const isGermanComplete = computed(() => missingFields.value.length === 0)

  return {
    book,
    activeLocale,
    activeLocalization,
    isEditingExisting,
    uploadStatus,
    isDirty,
    snapshotClean,
    isGermanComplete,
    missingFields,
    missingAnchors,
    setLocale,
    reset,
    load,
    restoreNewDraft,
    startAutosave,
    stopAutosave,
    restoredDraftPending,
    dismissRestoredDraftBanner
  }
})
