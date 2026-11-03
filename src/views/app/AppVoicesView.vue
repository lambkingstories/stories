<script setup lang="ts">
/**
 * "Familien-Stimmen": a grown-up (grandma, grandpa, a parent) reads a story into the microphone; the child hears it later in the
 * good-night mode. The way here leads through the parental gate. The recordings stay on this device; the app never uploads them.
 * A recording can be sent as a file (share sheet) and a file that somebody sent can be added, so a grandparent far away needs no account.
 * The text of the story is shown while reading, so nobody needs the book at hand.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { prependBaseUrl } from '@/utils/function'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import useApiBooks from '@/use/useApiBooks'
import {
  MAX_IMPORT_BYTES,
  audioDuration,
  deleteVoice,
  getVoiceBlob,
  listVoices,
  looksLikeAudio,
  mimeOfName,
  parseVoiceFileName,
  recordingMime,
  saveVoice,
  voiceFileName,
  type VoiceMeta
} from '@/use/useVoices'
import { isColoringBook } from '@/utils/coloringBook'
import { plainText } from '@/utils/plainText'
import { clock } from '@/utils/sleepTimer'
import type { ApiBook } from '@/types/apiBook'
import { contentLocale } from '@/utils/contentLocale'

const { t, tm, rt, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()

function goBack() {
  stopAll()
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

const lang = computed(() => (contentLocale(locale.value)))
const titleOf = (b: ApiBook) => b.localizations?.[lang.value]?.title || b.localizations?.de?.title || ''
const query = ref('')
const stories = computed<ApiBook[]>(() => {
  const q = query.value.trim().toLocaleLowerCase(locale.value)
  return ((apiBooks.state.all ?? []) as ApiBook[])
    .filter((b) => !isColoringBook(b) && (!q || titleOf(b).toLocaleLowerCase(locale.value).includes(q)))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b), locale.value))
})

const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!recordingMime()
const people = computed(() => (tm('app.voices.people') as unknown[]).map((p) => rt(p as string)))
const steps = computed(() => (tm('app.voices.steps') as unknown[]).map((p) => rt(p as string)))
/** The picture of grandma and child at the top (painted for the Plus slides). */
const heroImg = prependBaseUrl('images/bg/plus-folie-familie.webp')
const tileImg = (name: string) => prependBaseUrl(`images/icons/navi/${name}.webp`)
/** True once "read aloud yourself" was chosen: the list of stories is open. */
const choosing = ref(false)

// ── what is recorded already ──────────────────────────────────────────────────────────────────────────────────
const saved = ref<VoiceMeta[]>([])
async function refresh() {
  saved.value = await listVoices()
}
onMounted(() => {
  void apiBooks.loadAllBooks()
  void refresh()
})

// ── a new recording ─────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'pick' | 'ready' | 'recording' | 'review'
const phase = ref<Phase>('pick')
const book = ref<ApiBook | null>(null)
const storyText = ref('')
const loadingText = ref(false)
const reader = ref('')
const error = ref<'' | 'mic' | 'save' | 'notAudio' | 'tooBig' | 'unplayable'>('')
const elapsed = ref(0)
const previewUrl = ref('')
let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []
let startedAt = 0
let timer: ReturnType<typeof setInterval> | undefined
let recorded: Blob | null = null
let mime = ''

async function pick(b: ApiBook) {
  book.value = b
  if (imported) {
    // a file that was sent: the story is chosen, now it is listened to and kept
    phase.value = 'review'
    return
  }
  phase.value = 'ready'
  reader.value = reader.value || people.value[0] || ''
  storyText.value = ''
  loadingText.value = true
  const full = (await apiBooks.loadBook(b.bookId)) ?? b
  const pages = full.localizations?.[lang.value]?.content ?? full.localizations?.de?.content ?? []
  storyText.value = pages
    .map((p) => plainText(p.text))
    .filter(Boolean)
    .join('\n\n')
  loadingText.value = false
}

function releaseMic() {
  stream?.getTracks().forEach((tr) => tr.stop())
  stream = null
}

async function startRecording() {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    error.value = 'mic'
    return
  }
  mime = recordingMime()
  chunks = []
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  recorder.onstop = () => {
    releaseMic()
    recorded = new Blob(chunks, { type: mime || 'audio/webm' })
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(recorded)
    phase.value = 'review'
  }
  recorder.start(1000)
  startedAt = Date.now()
  elapsed.value = 0
  timer = setInterval(() => (elapsed.value = Date.now() - startedAt), 250)
  phase.value = 'recording'
}

function stopRecording() {
  clearInterval(timer)
  elapsed.value = Date.now() - startedAt
  recorder?.stop()
}

function again() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  recorded = null
  phase.value = 'ready'
}

async function keep() {
  if (!recorded || !book.value) return
  error.value = ''
  try {
    await saveVoice(
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        bookId: book.value.bookId,
        bookTitle: titleOf(book.value),
        reader: reader.value.trim() || people.value[0] || '',
        mime: recorded.type,
        durationMs: elapsed.value,
        createdAt: Date.now()
      },
      recorded
    )
  } catch {
    error.value = 'save'
    return
  }
  imported = null
  importing.value = false
  choosing.value = false
  again()
  phase.value = 'pick'
  book.value = null
  await refresh()
}

// ── a file that somebody sent ───────────────────────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
/** The sound that was added from a file, until it is kept or dropped. */
let imported: Blob | null = null
/** Shows the "which story is this?" step instead of the "which story do you read?" step. */
const importing = ref(false)

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  if (!looksLikeAudio(file)) {
    error.value = 'notAudio'
    return
  }
  if (file.size > MAX_IMPORT_BYTES) {
    error.value = 'tooBig'
    return
  }
  const blob = new Blob([file], { type: file.type || mimeOfName(file.name) })
  const ms = await audioDuration(blob)
  if (ms === null) {
    error.value = 'unplayable'
    return
  }
  cancel()
  imported = blob
  recorded = blob
  elapsed.value = ms
  previewUrl.value = URL.createObjectURL(blob)
  importing.value = true
  // a file that was made by this app (and kept its name) knows the story and the reader
  const known = parseVoiceFileName(file.name)
  reader.value = known?.reader || people.value[0] || ''
  const story = known ? stories.value.find((b) => b.bookId === known.bookId) : undefined
  if (story) void pick(story)
  else phase.value = 'pick'
}

function openFile() {
  error.value = ''
  fileInput.value?.click()
}

// ── sending a recording ──────────────────────────────────────────────────────────────────────────────────────────
async function send(v: VoiceMeta) {
  const blob = await getVoiceBlob(v.id)
  if (!blob) return
  const file = new File([blob], voiceFileName(v), { type: blob.type || v.mime })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: v.bookTitle, text: t('app.voices.shareText', { name: v.reader, title: v.bookTitle }) })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('share failed', err)
    }
    return
  }
  // no file sharing here (a computer): the recording is saved as a file
  const a = document.createElement('a')
  a.download = file.name
  a.href = URL.createObjectURL(file)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
const canSend = typeof navigator !== 'undefined'

function cancel() {
  imported = null
  importing.value = false
  choosing.value = false
  clearInterval(timer)
  if (recorder && recorder.state !== 'inactive') {
    recorder.onstop = null
    recorder.stop()
  }
  releaseMic()
  again()
  phase.value = 'pick'
  book.value = null
}

// ── playing what was recorded ───────────────────────────────────────────────────────────────────────────────────
const playingId = ref('')
let player: HTMLAudioElement | null = null
let playerUrl = ''

function stopPlayer() {
  player?.pause()
  player = null
  if (playerUrl) URL.revokeObjectURL(playerUrl)
  playerUrl = ''
  playingId.value = ''
}

async function play(v: VoiceMeta) {
  if (playingId.value === v.id) {
    stopPlayer()
    return
  }
  stopPlayer()
  const blob = await getVoiceBlob(v.id)
  if (!blob) return
  playerUrl = URL.createObjectURL(blob)
  player = new Audio(playerUrl)
  player.onended = stopPlayer
  playingId.value = v.id
  void player.play().catch(stopPlayer)
}

const askId = ref('')
async function remove() {
  const id = askId.value
  askId.value = ''
  if (playingId.value === id) stopPlayer()
  await deleteVoice(id)
  await refresh()
}

function stopAll() {
  cancel()
  stopPlayer()
}
onBeforeUnmount(stopAll)

const dateOf = (ms: number) => new Date(ms).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.voices.title')" :subtitle="t('app.voices.sub')" @back="goBack")

    section(class="vo-wrap")
      //- what this is worth: the picture, a sentence, and the three steps
      div(class="vo-hero")
        img(:src="heroImg" alt="" class="vo-hero-img" draggable="false")
        div(class="vo-hero-body")
          h2(class="vo-hero-title") {{ t('app.voices.heroTitle') }}
          p(class="vo-hero-text") {{ t('app.voices.heroText') }}
        ol(class="vo-steps")
          li(v-for="(st, i) in steps" :key="i")
            span(class="vo-step-n" aria-hidden="true") {{ i + 1 }}
            span {{ st }}

      input(ref="fileInput" type="file" accept="audio/*,.m4a,.mp3,.ogg,.opus,.webm,.aac,.wav" class="vo-hidden" tabindex="-1" aria-hidden="true" @change="onFile")

      //- the two ways in: read aloud here, or add a recording that was sent
      div(v-if="phase === 'pick' && !choosing && !importing" class="vo-tiles")
        button(type="button" class="vo-tile" :disabled="!canRecord" @click="choosing = true")
          img(:src="tileImg('lesen')" alt="" class="vo-tile-img" draggable="false")
          span(class="vo-tile-title") {{ t('app.voices.readTitle') }}
          span(class="vo-tile-sub") {{ canRecord ? t('app.voices.readSub') : t('app.voices.noMic') }}
        button(type="button" class="vo-tile is-gold" @click="openFile")
          img(:src="tileImg('ich')" alt="" class="vo-tile-img" draggable="false")
          span(class="vo-tile-title") {{ t('app.voices.fileTitle') }}
          span(class="vo-tile-sub") {{ t('app.voices.fileSub') }}
      p(v-if="phase === 'pick' && !choosing && !importing && (error === 'notAudio' || error === 'tooBig' || error === 'unplayable')" class="vo-fail" role="alert") {{ t(`app.voices.import_${error}`) }}

      //- ===== record =====
      div(v-if="phase !== 'pick' || choosing || importing" class="vo-card")
        //- 1. choose the story
        template(v-if="phase === 'pick'")
          h3(class="vo-h") {{ importing ? t('app.voices.importPick') : t('app.voices.pickTitle') }}
          input(v-model="query" class="vo-input" type="search" :placeholder="t('app.voices.search')" :aria-label="t('app.voices.search')")
          div(v-if="stories.length" class="vo-stories")
            button(v-for="b in stories" :key="b.bookId" type="button" class="vo-story" @click="pick(b)") {{ titleOf(b) }}
          p(v-else class="vo-note") {{ t('app.voices.noStories') }}
          AdvButton(tone="blau" @click="cancel") {{ t('app.voices.cancel') }}

        //- 2. ready: who reads, the text, the record button
        template(v-else-if="phase === 'ready' || phase === 'recording'")
          h3(class="vo-h") {{ book ? titleOf(book) : '' }}
          template(v-if="phase === 'ready'")
            span(class="vo-label") {{ t('app.voices.whoReads') }}
            div(class="vo-chips")
              button(v-for="p in people" :key="p" type="button" :class="['vo-chip', { 'is-on': reader === p }]" @click="reader = p") {{ p }}
            input(v-model="reader" class="vo-input" type="text" maxlength="20" :aria-label="t('app.voices.whoReads')")
          div(class="vo-text" tabindex="0") {{ loadingText ? t('app.voices.loadingText') : (storyText || t('app.voices.noText')) }}
          p(v-if="phase === 'recording'" class="vo-clock") {{ clock(elapsed) }}
            span(class="vo-dot" aria-hidden="true")
          p(v-if="error === 'mic'" class="vo-fail" role="alert") {{ t('app.voices.micDenied') }}
          div(class="vo-actions")
            AdvButton(v-if="phase === 'ready'" tone="gold" @click="startRecording") {{ t('app.voices.record') }}
            AdvButton(v-else tone="gold" @click="stopRecording") {{ t('app.voices.stop') }}
            AdvButton(tone="blau" @click="cancel") {{ t('app.voices.cancel') }}

        //- 3. listen to it and keep it
        template(v-else)
          h3(class="vo-h") {{ importing && book ? titleOf(book) : t('app.voices.review') }}
          template(v-if="importing")
            span(class="vo-label") {{ t('app.voices.whoReads') }}
            div(class="vo-chips")
              button(v-for="p in people" :key="p" type="button" :class="['vo-chip', { 'is-on': reader === p }]" @click="reader = p") {{ p }}
            input(v-model="reader" class="vo-input" type="text" maxlength="20" :aria-label="t('app.voices.whoReads')")
          audio(v-if="previewUrl" :src="previewUrl" controls class="vo-audio")
          p(v-if="error === 'save'" class="vo-fail" role="alert") {{ t('app.voices.saveFailed') }}
          div(class="vo-actions")
            AdvButton(tone="gold" @click="keep") {{ t('app.voices.keep') }}
            AdvButton(v-if="!importing" tone="blau" @click="again") {{ t('app.voices.again') }}
            AdvButton(v-else tone="blau" @click="cancel") {{ t('app.voices.cancel') }}

      //- ===== what is kept =====
      div(class="vo-card")
        h3(class="vo-h") {{ t('app.voices.mine') }}
          span(v-if="saved.length" class="vo-count") {{ saved.length }}
        p(v-if="!saved.length" class="vo-note") {{ t('app.voices.none') }}
        ul(v-else class="vo-list")
          li(v-for="v in saved" :key="v.id" class="vo-item")
            button(type="button" class="vo-play" :aria-label="playingId === v.id ? t('app.voices.pause') : t('app.voices.play')" @click="play(v)") {{ playingId === v.id ? '❚❚' : '▶' }}
            span(class="vo-item-text")
              span(class="vo-item-title") {{ v.bookTitle }}
              span(class="vo-item-sub") {{ t('app.voices.by', { name: v.reader }) }} · {{ dateOf(v.createdAt) }} · {{ clock(v.durationMs) }}
            button(v-if="canSend" type="button" class="vo-send" @click="send(v)") {{ t('app.voices.send') }} ↗
            button(type="button" class="vo-x" :aria-label="t('app.voices.remove')" @click="askId = v.id") ✕

    div(v-if="askId" class="vo-backdrop" @click.self="askId = ''")
      div(class="vo-dialog" role="alertdialog" aria-modal="true")
        p(class="vo-dialog-text") {{ t('app.voices.removeAsk') }}
        div(class="vo-actions")
          AdvButton(tone="blau" @click="remove") {{ t('app.voices.removeYes') }}
          AdvButton(tone="gold" @click="askId = ''") {{ t('app.voices.removeNo') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.vo-wrap
  display: grid
  gap: 14px
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.vo-hero
  overflow: hidden
  border-radius: 28px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.vo-hero-img
  display: block
  width: 100%
  aspect-ratio: 16 / 9
  object-fit: cover

.vo-hero-body
  padding: 16px 18px 6px

.vo-hero-title
  margin: 0 0 6px
  font-size: 1.35rem
  line-height: 1.2
  font-weight: 800

.vo-hero-text
  margin: 0
  line-height: 1.5
  color: var(--lk-muted)

.vo-steps
  display: grid
  gap: 10px
  margin: 0
  padding: 12px 18px 18px
  list-style: none

  li
    display: flex
    align-items: center
    gap: 12px
    font-weight: 700
    line-height: 1.3

.vo-step-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: #c9962a
  color: #fff
  font-weight: 800

.vo-tiles
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px

.vo-tile
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 16px 14px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  font: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active:not(:disabled)
    transform: translateY(1px)

  &:disabled
    opacity: 0.6
    cursor: default

  &.is-gold
    background: linear-gradient(160deg, #fbecc2, #f3d484)
    border-color: #e0bd62
    color: #3a2c10

.vo-tile-img
  width: 52px
  height: 52px
  margin-bottom: 4px
  object-fit: contain

.vo-tile-title
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.2

.vo-tile-sub
  font-size: 0.84rem
  line-height: 1.35
  opacity: 0.8

.vo-count
  display: inline-grid
  place-items: center
  min-width: 24px
  height: 24px
  margin-left: 8px
  padding: 0 7px
  border-radius: 999px
  background: #c9962a
  color: #fff
  font-size: 0.82rem
  vertical-align: middle

.vo-private
  margin: 0
  text-align: center
  font-size: 0.88rem
  line-height: 1.4
  color: var(--lk-muted)

.vo-card
  display: flex
  flex-direction: column
  gap: 10px
  padding: 16px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.vo-h
  margin: 0
  font-size: 1.1rem
  font-weight: 800

.vo-note
  margin: 0
  color: var(--lk-muted)
  line-height: 1.4

.vo-label
  font-weight: 800
  font-size: 0.92rem

.vo-stories
  display: grid
  gap: 8px
  max-height: 46vh
  overflow-y: auto

.vo-story
  min-height: 48px
  padding: 8px 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  text-align: left
  cursor: pointer

.vo-chips
  display: flex
  flex-wrap: wrap
  gap: 6px

.vo-chip
  min-height: 40px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  cursor: pointer

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.vo-input
  width: 100%
  min-height: 44px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

// the text to read: big enough to read aloud from a distance
.vo-text
  max-height: 40vh
  overflow-y: auto
  padding: 12px 14px
  border-radius: 16px
  background: var(--lk-bg)
  border: 1px solid var(--lk-line)
  font-size: 1.12rem
  line-height: 1.6
  white-space: pre-wrap

.vo-clock
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  margin: 0
  font-size: 2rem
  font-weight: 300
  font-variant-numeric: tabular-nums

.vo-dot
  width: 14px
  height: 14px
  border-radius: 50%
  background: #c8553d
  animation: vo-pulse 1.2s ease-in-out infinite

@keyframes vo-pulse
  0%, 100%
    opacity: 1
  50%
    opacity: 0.3

.vo-fail
  margin: 0
  color: #c8553d
  font-weight: 700

.vo-audio
  width: 100%

.vo-hidden
  position: absolute
  width: 1px
  height: 1px
  opacity: 0
  pointer-events: none

.vo-send
  flex: none
  min-height: 36px
  padding: 0 12px
  border: none
  border-radius: 999px
  background: #c9962a
  color: #fff
  font: inherit
  font-size: 0.85rem
  font-weight: 800
  cursor: pointer

.vo-actions
  display: grid
  gap: 8px

.vo-list
  display: grid
  gap: 8px
  margin: 0
  padding: 0
  list-style: none

.vo-item
  display: flex
  align-items: center
  gap: 10px
  padding: 8px 10px
  border-radius: 16px
  background: var(--lk-bg)
  border: 1px solid var(--lk-line)

.vo-play
  flex: none
  width: 44px
  height: 44px
  border: none
  border-radius: 50%
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-size: 0.95rem
  cursor: pointer

.vo-item-text
  flex: 1
  display: flex
  flex-direction: column
  min-width: 0

.vo-item-title
  font-weight: 800
  line-height: 1.25

.vo-item-sub
  font-size: 0.78rem
  color: var(--lk-muted)

.vo-x
  flex: none
  width: 34px
  height: 34px
  border: none
  border-radius: 50%
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  cursor: pointer

.vo-backdrop
  position: fixed
  inset: 0
  z-index: 90
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  background: rgba(8, 16, 26, 0.55)

.vo-dialog
  width: 100%
  max-width: 340px
  padding: 20px 18px 18px
  border-radius: 24px
  background: var(--lk-surface)
  color: var(--lk-text)
  text-align: center

.vo-dialog-text
  margin: 0 0 14px
  font-weight: 800
</style>
