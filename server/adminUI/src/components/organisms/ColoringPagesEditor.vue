<template>
  <div class="cpe">
    <!-- DE: add pictures (many at once). EN: the pictures are the German ones, only the words are translated. -->
    <div v-if="locale === 'de'" class="cpe-add" :class="{ 'is-over': over }" @dragover.prevent="over = true"
         @dragleave="over = false" @drop.prevent="onDrop">
      <div class="cpe-add-text">
        <strong>Bilder hier hineinziehen</strong>
        <span>
          Mehrere auf einmal. Sie werden nach Dateinamen sortiert, verkleinert (graues WebP, höchstens
          {{ MAX_COLORING_WIDTH }} px breit) und der Reihe nach hochgeladen.
        </span>
      </div>
      <XButton label="Bilder wählen" :disabled="busy" @click="pickFiles" />
      <input ref="fileInput" type="file" class="cpe-file" multiple accept="image/webp,image/jpeg,image/png"
             @change="onPick">
    </div>
    <p v-else class="cpe-note">
      Die Bilder gelten für alle Sprachen. Hier nur Titel, Bibelstelle und Text zum Bild übersetzen
      (leer = die deutschen Texte werden gezeigt).
    </p>

    <div v-if="progress" class="cpe-progress" role="status">
      <div class="cpe-progress-bar"><span :style="{ width: `${(progress.done / progress.total) * 100}%` }" /></div>
      <span>{{ progress.done }} von {{ progress.total }} hochgeladen<template v-if="progress.waiting"> · wartet kurz (Limit des Servers)</template></span>
    </div>
    <p v-for="e in errors" :key="e" class="cpe-error" role="alert">{{ e }}</p>

    <p v-if="!rows.length" class="cpe-empty">Noch keine Seiten. Zieh die Bilder des Malbuchs hierher.</p>

    <ol class="cpe-list">
      <li v-for="(row, i) in rows" :key="row.n" class="cpe-row">
        <div class="cpe-num">{{ row.n }}</div>
        <a :href="row.image" target="_blank" rel="noopener" class="cpe-thumb" :title="`Bild ${row.n} ansehen`">
          <img :src="row.image" alt="" loading="lazy">
        </a>
        <div class="cpe-fields">
          <input class="glass cpe-in" :value="row.title" placeholder="Titel des Bildes"
                 @input="setField(row.page, 'title', ($event.target as HTMLInputElement).value)">
          <input class="glass cpe-in" :value="row.reference" placeholder="Bibelstelle, z. B. 1. Mose 1,1–10"
                 @input="setField(row.page, 'reference', ($event.target as HTMLInputElement).value)">
          <textarea class="glass cpe-in cpe-text" rows="2" :value="row.text" placeholder="Text zum Bild (optional)"
                    @input="setField(row.page, 'text', ($event.target as HTMLTextAreaElement).value)" />
          <p v-if="locale === 'en' && row.de" class="cpe-de">DE: {{ row.de }}</p>
        </div>
        <div v-if="locale === 'de'" class="cpe-actions">
          <button type="button" class="cpe-icon" :disabled="i === 0 || busy" aria-label="Nach oben" @click="move(i, -1)">↑</button>
          <button type="button" class="cpe-icon" :disabled="i === rows.length - 1 || busy" aria-label="Nach unten" @click="move(i, 1)">↓</button>
          <button type="button" class="cpe-icon cpe-del" :disabled="busy" aria-label="Seite entfernen" @click="remove(i)">×</button>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { uploadsApi } from '@/api/uploads'
import { ApiClientError } from '@/api/client'
import type { BookPage } from '@/types'
import {
  movePage,
  newColoringPage,
  pageOf,
  removePage,
  setPageField,
  sortFilesNaturally,
  titleFromFileName
} from '@/utils/coloringPages'
import { MAX_COLORING_WIDTH, optimizeColoringImage } from '@/utils/optimizeColoringImage'

/**
 * The pages of a coloring book: one picture per page with its title, Bible passage and an optional text. The pictures belong to
 * the German book; the other languages only carry their own words (matched by page number).
 */
const props = defineProps<{
  /** The pages of the language being edited. */
  modelValue: BookPage[]
  /** The German pages: they hold the pictures. */
  dePages: BookPage[]
  locale: 'de' | 'en'
}>()
const emit = defineEmits<{
  'update:modelValue': [v: BookPage[]]
  'image-removed': [url: string]
}>()

// the server allows 30 writes a minute: one upload every two seconds
const UPLOAD_GAP_MS = 2100
const RETRY_WAIT_MS = 15000

const over = ref(false)
const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const progress = ref<{ done: number; total: number; waiting: boolean } | null>(null)
const errors = ref<string[]>([])

const rows = computed(() => {
  // the pictures come from the German pages; another language shows its own words next to them
  return props.dePages.map((p) => {
    const own = props.locale === 'de' ? p : pageOf(props.modelValue, p)
    return {
      n: p.page,
      de: props.locale === 'de' ? '' : [p.title, p.reference].filter(Boolean).join(' · '),
      page: p,
      image: p.image ?? '',
      title: own?.title ?? '',
      reference: own?.reference ?? '',
      text: own?.text ?? ''
    }
  })
})

function setField(de: BookPage, field: 'title' | 'reference' | 'text', value: string) {
  emit('update:modelValue', setPageField(props.modelValue, de, field, value))
}

function move(i: number, delta: number) {
  emit('update:modelValue', movePage(props.modelValue, i, delta))
}

function remove(i: number) {
  const url = props.modelValue[i]?.image
  emit('update:modelValue', removePage(props.modelValue, i))
  if (url) emit('image-removed', url)
}

function pickFiles() {
  fileInput.value?.click()
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  void addFiles(files)
}

function onDrop(e: DragEvent) {
  over.value = false
  void addFiles(Array.from(e.dataTransfer?.files ?? []))
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** One upload; when the server says "too many requests" it waits and tries again. */
async function uploadOne(file: File): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return (await uploadsApi.image(file, 'content')).url
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 429 && attempt < 3) {
        if (progress.value) progress.value.waiting = true
        await wait(RETRY_WAIT_MS)
        if (progress.value) progress.value.waiting = false
        continue
      }
      throw err
    }
  }
}

async function addFiles(all: File[]) {
  if (busy.value || props.locale !== 'de') return
  const files = sortFilesNaturally(all.filter((f) => f.type.startsWith('image/')))
  errors.value = []
  if (!files.length) {
    if (all.length) errors.value = ['Das sind keine Bilder (erlaubt: WebP, JPG, PNG).']
    return
  }
  busy.value = true
  progress.value = { done: 0, total: files.length, waiting: false }
  try {
    for (const file of files) {
      try {
        const small = await optimizeColoringImage(file)
        const url = await uploadOne(small)
        // read the pages again: the person may have typed a title meanwhile
        const pages = props.modelValue
        emit('update:modelValue', [...pages, newColoringPage(pages.length + 1, url, titleFromFileName(file.name))])
        await nextTick()
      } catch (err) {
        const why = err instanceof ApiClientError
          ? (err.details?.length ? err.details.map((d) => `${d.field}: ${d.message}`).join(' — ') : `${err.code}: ${err.message}`)
          : (err as Error).message
        errors.value.push(`${file.name}: ${why}`)
      }
      progress.value.done++
      if (progress.value.done < files.length) await wait(UPLOAD_GAP_MS)
    }
  } finally {
    busy.value = false
    window.setTimeout(() => {
      if (!busy.value) progress.value = null
    }, 4000)
  }
}
</script>

<style scoped>
.cpe { display: flex; flex-direction: column; gap: 12px; }
.cpe-add {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px;
  border: 2px dashed rgba(190, 140, 80, 0.45); border-radius: 16px; background: rgba(255, 255, 255, 0.55);
  transition: background 140ms ease, border-color 140ms ease;
}
.cpe-add.is-over { background: rgba(245, 158, 11, 0.12); border-color: #d97706; }
.cpe-add-text { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: rgba(90, 60, 30, 0.8); }
.cpe-add-text strong { font-size: 15px; color: #5a3c1e; }
.cpe-file { display: none; }
.cpe-note, .cpe-empty { font-size: 13px; color: rgba(90, 60, 30, 0.75); margin: 0; }
.cpe-error { font-size: 13px; color: #b83535; margin: 0; }
.cpe-progress { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.cpe-progress-bar { height: 6px; border-radius: 3px; background: rgba(120, 90, 50, 0.15); overflow: hidden; }
.cpe-progress-bar span { display: block; height: 100%; background: #d97706; transition: width 200ms ease; }
.cpe-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.cpe-row {
  display: grid; grid-template-columns: 34px 96px 1fr auto; gap: 12px; align-items: start; padding: 10px;
  border-radius: 14px; background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(190, 140, 80, 0.22);
}
.cpe-num { font-weight: 700; color: #8a5a1c; padding-top: 6px; text-align: center; }
.cpe-thumb { display: block; border-radius: 8px; overflow: hidden; background: #fff; border: 1px solid rgba(0, 0, 0, 0.08); }
.cpe-thumb img { display: block; width: 100%; height: auto; }
.cpe-fields { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cpe-in { width: 100%; }
.cpe-text { min-height: 48px; resize: vertical; }
.cpe-de { margin: 0; font-size: 12px; color: rgba(90, 60, 30, 0.7); }
.cpe-actions { display: flex; flex-direction: column; gap: 6px; }
.cpe-icon {
  width: 32px; height: 32px; border: none; border-radius: 8px; background: rgba(120, 80, 50, 0.1); color: #5a3c1e;
  font-size: 16px; cursor: pointer;
}
.cpe-icon:disabled { opacity: 0.35; cursor: default; }
.cpe-del:hover:not(:disabled) { background: rgba(225, 90, 90, 0.18); color: #b83535; }
@media (max-width: 720px) {
  .cpe-row { grid-template-columns: 28px 72px 1fr; }
  .cpe-actions { grid-column: 2 / -1; flex-direction: row; }
}
</style>
