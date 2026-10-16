<template>
  <div class="flex flex-col gap-y-0.5">
    <!-- METADATA PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Metadaten</h2>
          <p class="panel-subtitle">Grunddaten des Buchs — gelten für alle Sprachen.</p>
        </div>
        <LocaleSwitcher v-model="activeLocale" :busy="translating" @translate="onTranslateSwitch" />
      </header>

      <div class="form-grid">
        <div id="field-bookId" class="field col-4" :class="fieldClass('field-bookId')">
          <label class="field-label">
            Book-ID <span v-if="isMissing('field-bookId')" class="missing-dot" />
            <span class="muted">{{ prefix || '??' }}-n-shortname</span>
          </label>
          <XInput v-model="draft.book.bookId" placeholder="fa-1-apple" />
          <p class="field-hint">2-Buchstaben-Prefix, Band, Kurzname.</p>
        </div>
        <div id="field-author" class="field col-4" :class="fieldClass('field-author')">
          <label class="field-label">
            Autor <span v-if="isMissing('field-author')" class="missing-dot" />
          </label>
          <XInput v-model="draft.book.author" placeholder="Jane Doe" />
        </div>
        <div id="field-releaseDate" class="field col-4" :class="fieldClass('field-releaseDate')">
          <label class="field-label">
            Erscheinungsdatum <span v-if="isMissing('field-releaseDate')" class="missing-dot" />
          </label>
          <DatePicker v-model="draft.book.releaseDate" />
        </div>

        <div id="field-bookSeries" class="field col-6" :class="fieldClass('field-bookSeries')">
          <label class="field-label">
            Buchreihe <span v-if="isMissing('field-bookSeries')" class="missing-dot" />
            <span class="count-badge" :title="`${seriesStore.items.length} verfügbar`">
              {{ seriesStore.items.length }}
            </span>
          </label>
          <SeriesPicker v-model="draft.book.bookSeriesId" :series="seriesStore.items" />
        </div>
        <div id="field-category" class="field col-6" :class="fieldClass('field-category')">
          <label class="field-label">
            Kategorie <span v-if="isMissing('field-category')" class="missing-dot" />
            <span class="count-badge" :title="`${categoriesStore.items.length} verfügbar`">
              {{ categoriesStore.items.length }}
            </span>
            <span class="muted">suchbar</span>
          </label>
          <CategoryPicker v-model="draft.book.category" :categories="categoriesStore.items" />
        </div>

        <div class="field" :class="isColoring ? 'col-6' : 'col-12'">
          <label class="field-label">
            Art des Buchs
            <span class="muted">Ausmalbuch: jede Seite ist ein Bild, das im Malprogramm geöffnet wird</span>
          </label>
          <div class="kind-switch" role="group" aria-label="Art des Buchs">
            <XButton label="Geschichte" :class="{ primary: !isColoring }" :aria-pressed="!isColoring" @click="draft.book.kind = 'story'" />
            <XButton label="Ausmalbuch" :class="{ primary: isColoring }" :aria-pressed="isColoring" @click="draft.book.kind = 'coloring'" />
          </div>
        </div>
        <div v-if="isColoring" class="field col-6">
          <label class="field-label">
            Freie Bilder
            <span class="muted">leer = Standard der App (derzeit 5)</span>
          </label>
          <input v-model.number="draft.book.freePages" type="number" min="0" max="500" class="glass w-full" placeholder="Standard">
        </div>

        <div class="field col-12">
          <label class="field-label">Badges</label>
          <BadgeEditor v-model="draft.book.badges" />
        </div>

        <div class="field col-12">
          <label class="field-label">Website-Tags</label>
          <BadgeEditor v-model="draft.book.websiteTags" />
        </div>

        <div class="field col-12">
          <label class="field-label">
            Website-Preis
            <span class="muted">optional — wird nur auf der Webseite angezeigt, wenn ein Wert eingetragen ist</span>
          </label>
          <XInput v-model="draft.book.websitePrice" placeholder="inkl. MwSt. & Versand" />
        </div>

        <div class="field col-12">
          <label class="field-label">
            Sales-Link ({{ activeLocale.toUpperCase() }})
            <span class="muted">Wenn Sales-Link angegeben, webseite Buch verlinkt auf die Sale Seite</span>
            <span class="muted">Druckausgabe — andere Sprache wird automatisch befüllt, solange sie leer ist</span>
          </label>
          <XInput v-model="activeEtsyLink" placeholder="https://www.etsy.com/listing/…" />
        </div>
      </div>
    </section>

    <!-- LOCALIZED TEXT PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Beschreibung · {{ activeLocale.toUpperCase() }}</h2>
          <p class="panel-subtitle">Titel und Einleitungstexte pro Sprache.</p>
        </div>
      </header>

      <div class="form-grid">
        <div id="field-title" class="field col-4" :class="activeLocale === 'de' ? fieldClass('field-title') : ''">
          <label class="field-label">
            Titel <span v-if="activeLocale === 'de' && isMissing('field-title')" class="missing-dot" />
          </label>
          <XInput v-model="draft.activeLocalization.title" placeholder="Der Apfel" />
        </div>
        <div id="field-shortDescription" class="field col-4"
             :class="activeLocale === 'de' ? fieldClass('field-shortDescription') : ''">
          <label class="field-label">
            Kurzbeschreibung <span v-if="activeLocale === 'de' && isMissing('field-shortDescription')"
                                   class="missing-dot" />
          </label>
          <textarea
            v-model="draft.activeLocalization.shortDescription"
            class="glass w-full min-h-[110px]"
            placeholder="1–2 Sätze für Listen & Previews."
          />
        </div>
        <div id="field-description" class="field col-4"
             :class="activeLocale === 'de' ? fieldClass('field-description') : ''">
          <label class="field-label">
            Beschreibung <span v-if="activeLocale === 'de' && isMissing('field-description')" class="missing-dot" />
          </label>
          <textarea
            v-model="draft.activeLocalization.description"
            class="glass w-full min-h-[110px]"
            placeholder="Ausführliche Beschreibung für die Detailseite."
          />
        </div>

      </div>
    </section>

    <!-- MEDIA PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Medien</h2>
          <p class="panel-subtitle">Cover- &amp; Preview-Bild, Audio, Buch-Vorderseiten-Titelbild.</p>
        </div>
      </header>

      <div class="form-grid">
        <!--
          Cover-Bild and Buch-Vorderseiten-Titelbild dropzones are hidden for
          now. The previewImage is the single source of truth for every "cover"
          surface (iPhone preview, reader page 1, website, app lists). The
          upload helpers stay wired in case we re-enable these slots later, but
          their UI is suppressed and the schema makes both fields optional.
        -->
        <div id="field-preview" class="col-12" :class="fieldClass('field-preview')">
          <DropZone
            :label="`Preview-Bild (${activeLocale.toUpperCase()})`"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="1:1 · 512×512 or larger · max 2 MB"
            subhint=".webp bevorzugt · pro Sprache eigenes Bild möglich"
            :status="activeLocale === 'de' ? draft.uploadStatus.previewDe : draft.uploadStatus.previewEn"
            :preview-url="(draft.book.previewImage?.[activeLocale]) || PLACEHOLDER_IMAGE"
            :on-file="uploadPreview"
          />
        </div>

        <div id="field-audio" class="col-6" :class="activeLocale === 'de' ? fieldClass('field-audio') : ''">
          <DropZone
            :label="`Audio-Datei (${activeLocale.toUpperCase()})`"
            accept="audio/ogg"
            kind="audio"
            hint=".ogg-Datei · max 50 MB"
            subhint="Ziehen oder klicken zum Auswählen"
            :filename-hint="draft.book.bookId ? `e.g. ${draft.book.bookId}.ogg` : ''"
            :status="draft.uploadStatus.audio"
            :preview-url="draft.book.audio?.[activeLocale] || undefined"
            :on-file="uploadAudio"
          />
        </div>

        <div class="col-6">
          <DropZone
            :label="`Achievement-Badge (${activeLocale.toUpperCase()})`"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="1:1 · z.B. 512×512 · max 2 MB"
            subhint=".webp bevorzugt · andere Sprache erbt automatisch · optional"
            :status="activeLocale === 'de' ? draft.uploadStatus.achievementBadgeDe : draft.uploadStatus.achievementBadgeEn"
            :preview-url="achievementBadgePreview || undefined"
            :on-file="uploadAchievementBadge"
          />
        </div>
      </div>
    </section>

    <!-- CONTENT PANEL: the pages of a coloring book (pictures with their words) -->
    <section v-if="isColoring" class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Seiten des Ausmalbuchs · {{ activeLocale.toUpperCase() }}</h2>
          <p class="panel-subtitle">
            Jede Seite ist ein Bild mit Titel, Bibelstelle und einem kurzen Text. Die Kinder öffnen sie direkt im Malprogramm.
          </p>
        </div>
      </header>
      <div id="field-content" :class="activeLocale === 'de' ? fieldClass('field-content') : ''">
        <ColoringPagesEditor
          :model-value="draft.activeLocalization.content"
          :de-pages="draft.book.localizations.de?.content ?? []"
          :locale="activeLocale"
          @update:model-value="(v) => (draft.activeLocalization.content = v)"
          @image-removed="onImageRemoved"
        />
      </div>
    </section>

    <!-- CONTENT PANEL -->
    <section v-else class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Seiteneditor · {{ activeLocale.toUpperCase() }}</h2>
          <p class="panel-subtitle">Seitenumbrüche via „## Kapitel 1" oder „# …".</p>
        </div>
      </header>
      <div id="field-content" :class="activeLocale === 'de' ? fieldClass('field-content') : ''">
        <RichTextEditor
          v-model="draft.activeLocalization.content"
          @image-removed="onImageRemoved"
        />
      </div>

      <div class="mt-6">
        <header class="panel-header" style="padding: 0 0 8px">
          <div>
            <h3 class="panel-title" style="font-size: 16px">Das erwartet Dich · {{ activeLocale.toUpperCase() }}</h3>
            <p class="panel-subtitle">
              Kurze Hinweise zum Inhalt — Aufzählungen, fettgedruckte Highlights. Erscheint im Detail-Screen unter
              „Selbst lesen".
            </p>
          </div>
        </header>
        <RichTextNotesEditor v-model="contentNotesValue" />
      </div>
    </section>

    <!-- ATTACHMENTS PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Anhänge</h2>
          <p class="panel-subtitle">
            Ausmal-Bilder &amp; PDF-Downloads. Jeder Anhang kann ein optionales Vorschau-Bild bekommen.
          </p>
        </div>
      </header>

      <AttachmentsEditor v-model="draft.book.attachments" />
    </section>

    <!-- SUBMIT BAR -->
    <div class="submit-bar py-4 gap-1">
      <div class="flex-1 min-w-0 flex flex-col gap-2 px-3">
        <p v-if="draft.isGermanComplete" class="text-xs text-emerald-700 font-medium">
          ✓ Bereit zum Speichern.
        </p>
        <template v-else>
          <p class="text-xs text-stone-600">
            Noch <strong class="text-rose-600">{{ draft.missingFields.length }}</strong>
            {{ draft.missingFields.length === 1 ? 'Feld' : 'Felder' }} offen
            <span class="text-stone-400">· klicken um zum Feld zu springen</span>
          </p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="m in draft.missingFields"
              :key="m.anchor"
              type="button"
              class="missing-chip"
              @click="scrollToField(m.anchor)"
            >{{ m.label }}
            </button>
          </div>
        </template>
      </div>
      <div class="flex gap-4 px-3 py-1 items-center flex-shrink-0">
        <XButton label="Zurücksetzen" @click="onResetClick" />
        <span
          class="inline-flex"
          :title="draft.isGermanComplete ? '' : `Fehlt noch: ${draft.missingFields.map((m) => m.label).join(', ')}`"
        >
          <XButton
            class="primary"
            :label="draft.isEditingExisting ? 'Aktualisieren' : 'Speichern'"
            :disabled="!draft.isGermanComplete || submitting"
            @click="submit"
          />
        </span>
      </div>
    </div>

    <ConfirmDiscardModal
      v-if="showResetConfirm"
      title="Entwurf zurücksetzen?"
      body="Du hast diesen Buch-Entwurf noch nicht gespeichert. Beim Zurücksetzen gehen die Änderungen verloren."
      stay-label="Weiter bearbeiten"
      discard-label="Zurücksetzen"
      @stay="cancelReset"
      @discard="confirmReset"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher.vue'
import SeriesPicker from '@/components/molecules/SeriesPicker.vue'
import CategoryPicker from '@/components/molecules/CategoryPicker.vue'
import DatePicker from '@/components/molecules/DatePicker.vue'
import DropZone from '@/components/molecules/DropZone.vue'
import BadgeEditor from '@/components/molecules/BadgeEditor.vue'
import XInput from '@/components/atoms/XInput.vue'
import XButton from '@/components/atoms/XButton.vue'
import RichTextEditor from './RichTextEditor.vue'
import RichTextNotesEditor from './RichTextNotesEditor.vue'
import ColoringPagesEditor from './ColoringPagesEditor.vue'
import { alignToGerman } from '@/utils/coloringPages'
import AttachmentsEditor from './AttachmentsEditor.vue'
import ConfirmDiscardModal from '@/components/molecules/ConfirmDiscardModal.vue'
import { PLACEHOLDER_IMAGE } from '@/utils/placeholder'

import { useBookDraftStore } from '@/stores/bookDraft'
import { useSeriesStore } from '@/stores/series'
import { useCategoryStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'
import { booksApi } from '@/api/books'
import { uploadsApi } from '@/api/uploads'
import { translateApi } from '@/api/translate'
import { ApiClientError } from '@/api/client'

const emit = defineEmits<{ (e: 'saved', book: import('@/types').BookDTO): void }>()

const draft = useBookDraftStore()
const seriesStore = useSeriesStore()
const categoriesStore = useCategoryStore()
const toast = useToastStore()

const { activeLocale } = storeToRefs(draft)
const isColoring = computed(() => draft.book.kind === 'coloring')
const submitting = ref(false)
const translating = ref(false)

// Reset-confirm modal — only opens when the draft has uncommitted changes;
// a clean draft resets immediately.
const showResetConfirm = ref(false)

function onResetClick() {
  if (draft.isDirty) {
    showResetConfirm.value = true
    return
  }
  draft.reset()
}

function cancelReset() {
  showResetConfirm.value = false
}

function confirmReset() {
  showResetConfirm.value = false
  draft.reset()
}

const prefix = computed(() => {
  const s = seriesStore.items.find((x) => x.seriesId === draft.book.bookSeriesId)
  return s?.prefix ?? ''
})

const isMissing = (anchor: string) => draft.missingAnchors.has(anchor)
const fieldClass = (anchor: string) => (isMissing(anchor) ? 'is-missing' : '')
const scrollToField = (anchor: string) => {
  const el = document.getElementById(anchor)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('is-flash')
  window.setTimeout(() => el.classList.remove('is-flash'), 1500)
}

const BOOK_ID_PATTERN = /^[a-z]{2}-\d+-[a-z0-9-]+$/

function explainApiError(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.details?.length) {
      return err.details.map((d) => `${d.field}: ${d.message}`).join(' — ')
    }
    return `${err.code}: ${err.message}`
  }
  return (err as Error).message || 'Upload fehlgeschlagen'
}

async function uploadAudio(file: File) {
  if (!draft.book.bookId) {
    throw new Error('Bitte zuerst die Book-ID setzen (z. B. fa-1-apple).')
  }
  if (!BOOK_ID_PATTERN.test(draft.book.bookId)) {
    throw new Error(
      `Ungültige Book-ID „${draft.book.bookId}" — erwartet: 2 Buchstaben, Nummer, Kurzname (z. B. fa-1-apple).`
    )
  }
  try {
    const res = await uploadsApi.audio(file, draft.book.bookId, activeLocale.value)
    draft.book.audio[activeLocale.value] = res.url
    draft.uploadStatus.audio = { ok: true, filename: file.name }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadCover(file: File) {
  try {
    const res = await uploadsApi.image(file, 'cover')
    if (!draft.book.coverImage) draft.book.coverImage = { de: '', en: '' }
    draft.book.coverImage[activeLocale.value] = res.url
    draft.uploadStatus[activeLocale.value === 'de' ? 'coverDe' : 'coverEn'] = {
      ok: true,
      filename: file.name
    }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadPreview(file: File) {
  try {
    const res = await uploadsApi.image(file, 'preview')
    if (!draft.book.previewImage) draft.book.previewImage = { de: '', en: '' }
    draft.book.previewImage[activeLocale.value] = res.url
    draft.uploadStatus[activeLocale.value === 'de' ? 'previewDe' : 'previewEn'] = {
      ok: true,
      filename: file.name
    }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadContentCoverFor(locale: 'de' | 'en', file: File) {
  try {
    const res = await uploadsApi.image(file, 'content')
    if (!draft.book.contentCoverImage) draft.book.contentCoverImage = { de: '', en: '' }
    draft.book.contentCoverImage[locale] = res.url
    draft.uploadStatus[locale === 'de' ? 'contentCoverDe' : 'contentCoverEn'] = {
      ok: true,
      filename: file.name
    }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

const uploadContentCoverDe = (file: File) => uploadContentCoverFor('de', file)
const uploadContentCoverEn = (file: File) => uploadContentCoverFor('en', file)

const achievementBadgePreview = computed(() => {
  const ab = draft.book.achievementBadge
  if (!ab) return ''
  return ab[activeLocale.value] || ab.de || ab.en || ''
})

const contentNotesValue = computed<string>({
  get() {
    return draft.activeLocalization.contentNotes ?? ''
  },
  set(value: string) {
    draft.activeLocalization.contentNotes = value
  }
})

const activeEtsyLink = computed<string>({
  get() {
    return draft.book.etsyLink?.[activeLocale.value] ?? ''
  },
  set(value: string) {
    if (!draft.book.etsyLink) draft.book.etsyLink = { de: '', en: '' }
    const other: 'de' | 'en' = activeLocale.value === 'de' ? 'en' : 'de'
    draft.book.etsyLink[activeLocale.value] = value
    // Mirror only into an empty other-locale slot — user's deliberate
    // overwrite on the other locale must not get clobbered.
    if (value && !draft.book.etsyLink[other]) {
      draft.book.etsyLink[other] = value
    }
  }
})

async function uploadAchievementBadge(file: File) {
  try {
    const res = await uploadsApi.image(file, 'achievement')
    if (!draft.book.achievementBadge) draft.book.achievementBadge = { de: '', en: '' }
    draft.book.achievementBadge[activeLocale.value] = res.url
    draft.uploadStatus[activeLocale.value === 'de' ? 'achievementBadgeDe' : 'achievementBadgeEn'] = {
      ok: true,
      filename: file.name
    }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function onTranslateSwitch(from: 'de' | 'en', to: 'de' | 'en') {
  if (from === to) return
  // Only auto-translate DE → EN. The German side is the source of truth; when
  // switching back to DE we never want to overwrite the original with a
  // round-tripped translation.
  if (from !== 'de' || to !== 'en') return
  const source = draft.book.localizations[from]
  if (!source || !source.title) return

  // Seed target with a deep copy of the source so the user sees text
  // immediately (no empty fields / ghost editor) even if translation fails.
  // Any field still equal to the source after this seed is the signal that
  // it has NOT yet been translated and should be re-run through the model.
  const existing = draft.book.localizations[to]
  if (!existing || !existing.title) {
    draft.book.localizations[to] = {
      title: source.title,
      shortDescription: source.shortDescription,
      description: source.description,
      content: source.content.map((p) => ({
        page: p.page,
        title: p.title,
        text: p.text,
        // coloring books: the picture is shared, the Bible passage is copied (and edited by hand)
        ...(p.image ? { image: p.image, reference: p.reference ?? '' } : {})
      }))
    }
  }
  const target = draft.book.localizations[to]!

  // Collect only the fields that still match the source — those are the ones
  // that still need translating. Previously-translated fields are left alone.
  const strings: Record<string, string> = {}
  const pendingFields: Array<keyof typeof target> = []
  for (const field of ['title', 'shortDescription', 'description'] as const) {
    if (target[field] && target[field] === source[field]) {
      strings[field] = source[field] as string
      pendingFields.push(field)
    }
  }
  const pendingPageIdx: number[] = []
  target.content.forEach((p, i) => {
    const srcPage = source.content.find((s) => s.page === p.page)
    if (!srcPage) return
    if (p.title && p.title === srcPage.title) strings[`page.${p.page}.title`] = srcPage.title
    if (p.text && p.text === srcPage.text) strings[`page.${p.page}.text`] = srcPage.text
    if (
      (p.title && p.title === srcPage.title) ||
      (p.text && p.text === srcPage.text)
    ) {
      pendingPageIdx.push(i)
    }
  })

  if (!Object.keys(strings).length) return

  translating.value = true
  try {
    const translations = await translateApi.translate(from, to, strings)
    for (const field of pendingFields) {
      const t = translations[field]
      if (t) (target[field] as string) = t
    }
    for (const i of pendingPageIdx) {
      const p = target.content[i]
      if (!p) continue
      const tTitle = translations[`page.${p.page}.title`]
      const tText = translations[`page.${p.page}.text`]
      if (tTitle) p.title = tTitle
      if (tText) p.text = tText
    }
    // Reassign to trigger reactivity for the RichTextEditor watcher.
    draft.book.localizations[to] = {
      ...target,
      content: target.content.map((p) => ({ ...p }))
    }
    toast.success(
      `Übersetzung ${from.toUpperCase()} → ${to.toUpperCase()} — ${pendingFields.length + pendingPageIdx.length} Felder`
    )
  } catch (err) {
    const msg = err instanceof ApiClientError && err.details?.length
      ? err.details.map((d) => `${d.field}: ${d.message}`).join(' — ')
      : (err as Error).message
    toast.error(
      `${msg} — Quelltext wurde als Fallback übernommen.`,
      'Übersetzung fehlgeschlagen'
    )
  } finally {
    translating.value = false
  }
}

// URLs the user removed from the editor since the last save. Cleaned up on
// the server only after the save itself succeeds — that way we never delete
// an image that's still referenced by the persisted version of the book.
const pendingImageDeletes = ref<Set<string>>(new Set())

function onImageRemoved(url: string) {
  if (!url) return
  pendingImageDeletes.value.add(url)
}

async function flushImageDeletes(urls: string[]) {
  if (!urls.length) return
  await Promise.allSettled(urls.map((u) => uploadsApi.deleteImage(u)))
}

// Promotes the bundled placeholder.webp into a real server-side upload so
// the book record passes the API's `previewImage` required check. Used
// when the admin saves a brand-new book before they've had time to attach
// proper artwork — they get a valid placeholder URL on the server
// filesystem and can replace it later.
async function uploadPlaceholderAs(kind: 'cover' | 'preview'): Promise<string> {
  const res = await fetch(PLACEHOLDER_IMAGE, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Placeholder konnte nicht geladen werden (${res.status})`)
  const blob = await res.blob()
  const file = new File([blob], 'placeholder.webp', { type: blob.type || 'image/webp' })
  const out = await uploadsApi.image(file, kind)
  return out.url
}

async function ensureRequiredImages() {
  // Only previewImage is required server-side now — coverImage is optional
  // and its upload UI is hidden. We seed previewImage.de with the bundled
  // placeholder so a hasty "save" still passes the API's required check.
  // EN is an optional translation and stays empty unless explicitly set.
  if (!draft.book.previewImage) draft.book.previewImage = { de: '', en: '' }
  if (!draft.book.previewImage.de) {
    const url = await uploadPlaceholderAs('preview')
    draft.book.previewImage.de = url
    draft.uploadStatus.previewDe = { ok: true, filename: 'placeholder.webp' }
  }
}

async function submit() {
  submitting.value = true
  try {
    // Auto-fill missing artwork with a real upload of the bundled
    // placeholder image so a hasty "save" doesn't fail the server-side
    // required check on coverImage/previewImage.
    await ensureRequiredImages()

    const ab = draft.book.achievementBadge
    if (ab) {
      const de = ab.de || ''
      const en = ab.en || ''
      if (de && !en) draft.book.achievementBadge = { de, en: de }
      else if (en && !de) draft.book.achievementBadge = { de: en, en }
    }

    const src = draft.book as Record<string, unknown>
    const { _id, updatedDate, createdAt, updatedAt, __v, ...rest } = src
    void _id
    void updatedDate
    void createdAt
    void updatedAt
    void __v
    // Drop an all-empty `localizations.en` slot so a DE-only book can be
    // saved cleanly. The EN tab seeds an empty localization on first hover,
    // which would otherwise be persisted as a hollow sub-doc.
    const localizations = draft.book.localizations
    // coloring books: the English pages follow the German ones (their order, and no page whose picture was removed)
    if (draft.book.kind === 'coloring' && localizations.en?.content && localizations.de) {
      localizations.en.content = alignToGerman(localizations.en.content, localizations.de.content)
    }
    const en = localizations.en
    const enIsEmpty = !en || (
      !en.title?.trim() &&
      !en.shortDescription?.trim() &&
      !en.description?.trim() &&
      !en.contentNotes?.trim() &&
      (!en.content || en.content.length === 0)
    )
    const cleanedLocalizations = enIsEmpty
      ? { de: localizations.de }
      : localizations
    const payload = {
      ...rest,
      localizations: cleanedLocalizations,
      releaseDate: new Date(draft.book.releaseDate).toISOString()
    } as any
    const saved = draft.isEditingExisting
      ? await booksApi.update(draft.book.bookId, payload)
      : await booksApi.create(payload)
    toast.success(`Buch „${saved.localizations.de?.title}" gespeichert`)
    draft.isEditingExisting = true
    // Successful save → the in-memory draft is now the canonical clean
    // state, so further edits flip `isDirty` back on as expected.
    draft.snapshotClean()
    // Drain queued image deletions only after the save persisted, so the
    // server can safely confirm "no book references this URL" before
    // unlinking the file. The check is centralized server-side.
    const toDelete = Array.from(pendingImageDeletes.value)
    pendingImageDeletes.value = new Set()
    void flushImageDeletes(toDelete)
    emit('saved', saved)
  } catch (err) {
    if (err instanceof ApiClientError && err.details?.length) {
      toast.error(err.details.map((d) => `${d.field}: ${d.message}`).join(' — '), err.code)
    } else {
      toast.error((err as Error).message)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.kind-switch {
  display: flex;
  gap: 10px;
}
</style>
