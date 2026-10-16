<template>
  <div class="dashboard-grid">
    <div class="flex flex-col gap-y-0.5 min-w-0">
      <BookBrowser
        :books="books"
        :series="series.items"
        :selected="draft.book.bookId"
        @select="onSelect"
        @delete="onDeleteRequest"
      />

      <section class="form-panel">
        <header class="panel-header">
          <div>
            <h2 class="panel-title">Taxonomien</h2>
            <p class="panel-subtitle">Buchreihen (Bild 2.5:1) &amp; Kategorien verwalten. (Bild 1:1)</p>
          </div>
        </header>
        <div class="taxonomy-split">
          <SeriesManager :books="books" />
          <div class="taxonomy-divider" />
          <CategoryManager :books="books" />
        </div>
      </section>

      <BookForm @saved="onSaved" />
    </div>

    <aside class="preview-aside hidden xl:block">
      <div class="preview-stack">
        <div class="preview-head">
          <span class="preview-tag">Vorschau</span>
          <span class="preview-count">{{ previewPages.length }} Seiten</span>
        </div>
        <IPhonePreview
          :pages="previewPages"
          :cover-image="previewCoverImage"
          :achievement-badge="previewAchievementBadge"
          :coloring="isColoringBook"
        />
      </div>
    </aside>

    <ConfirmDiscardModal
      v-if="showDiscardConfirm"
      title="Ungespeicherte Änderungen verwerfen?"
      body="Du hast diesen Buch-Entwurf noch nicht gespeichert. Beim Wechsel gehen die Änderungen verloren."
      stay-label="Weiter bearbeiten"
      discard-label="Verwerfen"
      @stay="cancelDiscard"
      @discard="confirmDiscard"
    />

    <ConfirmDeleteBookModal
      v-if="deleteTargetId"
      :book-label="deleteTargetLabel"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BookBrowser from '@/components/organisms/BookBrowser.vue'
import BookForm from '@/components/organisms/BookForm.vue'
import SeriesManager from '@/components/organisms/SeriesManager.vue'
import CategoryManager from '@/components/organisms/CategoryManager.vue'
import IPhonePreview from '@/components/organisms/IPhonePreview.vue'
import ConfirmDiscardModal from '@/components/molecules/ConfirmDiscardModal.vue'
import ConfirmDeleteBookModal from '@/components/molecules/ConfirmDeleteBookModal.vue'
import { useSeriesStore } from '@/stores/series'
import { useCategoryStore } from '@/stores/categories'
import { useBookDraftStore } from '@/stores/bookDraft'
import { useToastStore } from '@/stores/toast'
import { useRecentBooks } from '@/composables/useRecentBooks'
import { booksApi } from '@/api/books'
import { isColoringBook as isColoringBookDto } from '@/utils/coloringBook'
import type { BookDTO } from '@/types'

const series = useSeriesStore()
const categories = useCategoryStore()
const draft = useBookDraftStore()
const toast = useToastStore()
const { touchBook, forgetBook } = useRecentBooks()
const books = ref<BookDTO[]>([])

const previewPages = computed(() => draft.activeLocalization.content)
const previewCoverImage = computed(() => {
  // The iPhone preview's first "cover" page now uses previewImage — the
  // coverImage and contentCoverImage (Buch-Vorderseiten-Titelbild) inputs
  // are hidden in the form. Fall back to whichever locale has art if the
  // active locale slot is empty.
  const loc = draft.activeLocale
  const pi = draft.book.previewImage
  return pi ? (pi[loc] || pi.de || pi.en || '') : ''
})
const previewAchievementBadge = computed(() => {
  const ab = draft.book.achievementBadge
  if (!ab) return ''
  return ab[draft.activeLocale] || ab.de || ab.en || ''
})
const isColoringBook = computed(() => isColoringBookDto(draft.book))

onMounted(async () => {
  // Recover an unsaved new-book draft *before* fetching the catalogue —
  // doing it after gives the user a flash of "empty form" while the
  // request is in flight, which is exactly the data-loss anxiety this
  // restore is meant to prevent.
  draft.restoreNewDraft()
  draft.startAutosave()
  try {
    await Promise.all([series.load(), categories.load(), refreshBooks()])
  } catch (err) {
    toast.error((err as Error).message, 'Laden fehlgeschlagen')
  }
})

onBeforeUnmount(() => {
  draft.stopAutosave()
})

async function refreshBooks() {
  try {
    books.value = await booksApi.list()
  } catch {
    books.value = []
  }
}

// Pending switch — kept until the user resolves the dirty-draft modal.
const showDiscardConfirm = ref(false)
let pendingSelection: (() => void) | null = null

async function onSelect(bookId: string) {
  const action = () => {
    if (!bookId) {
      draft.reset()
      return
    }
    const b = books.value.find((x) => x.bookId === bookId)
    if (!b) return
    draft.load(b)
    // Recorded here rather than in the emit handler so a switch the user
    // aborts at the discard modal never lands in the recent list.
    touchBook(b.bookId)
  }
  if (draft.isDirty) {
    pendingSelection = action
    showDiscardConfirm.value = true
    return
  }
  action()
}

function cancelDiscard() {
  showDiscardConfirm.value = false
  pendingSelection = null
}

function confirmDiscard() {
  showDiscardConfirm.value = false
  const proceed = pendingSelection
  pendingSelection = null
  proceed?.()
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!draft.isDirty) return
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

const deleteTargetId = ref('')
const deleteTargetLabel = computed(() => {
  const id = deleteTargetId.value
  if (!id) return ''
  const b = books.value.find((x) => x.bookId === id)
  if (!b) return id
  const title = b.localizations.de?.title ?? b.localizations.en?.title ?? '(ohne Titel)'
  return `${b.bookId} — ${title}`
})

function onDeleteRequest() {
  const id = draft.book.bookId
  if (!id) return
  deleteTargetId.value = id
}

function cancelDelete() {
  deleteTargetId.value = ''
}

async function confirmDelete() {
  const id = deleteTargetId.value
  deleteTargetId.value = ''
  if (!id) return
  try {
    await booksApi.remove(id)
    books.value = books.value.filter((b) => b.bookId !== id)
    forgetBook(id)
    draft.reset()
    toast.success(`Buch „${id}" gelöscht`)
  } catch (err) {
    toast.error((err as Error).message, 'Löschen fehlgeschlagen')
  }
}

async function onSaved(saved: BookDTO) {
  touchBook(saved.bookId)
  const idx = books.value.findIndex((x) => x.bookId === saved.bookId)
  if (idx >= 0) books.value.splice(idx, 1, saved)
  else books.value = [...books.value, saved]
  refreshBooks()
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
}

@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}

.preview-aside {
  position: relative;
}

.preview-stack {
  position: sticky;
  top: 96px; /* clears sticky header (~72px) + breathing room */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-height: calc(100vh - 112px);
}

.preview-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 152, 219, 0.25);
  box-shadow: 0 6px 16px -8px rgba(41, 128, 185, 0.3);
}

.preview-tag {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2471a3;
}

.preview-count {
  font-size: 10.5px;
  color: #5d6d7e;
}

.taxonomy-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 820px) {
  .taxonomy-split {
    grid-template-columns: 1fr 1px 1fr;
    gap: 22px;
  }
}
</style>
