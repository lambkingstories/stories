<script setup lang="ts">
/**
 * The good-night mode: the child (or a parent) picks a story and a timer, the story is read aloud, the screen darkens after a short
 * while, the voice gets softer in the last seconds and then the story stops by itself. The bottom bar is not shown here, so that
 * nothing invites the child to wander off. The look is always the night look, whatever the app is set to.
 * Every book can be chosen: a book with a recorded voice is played, any other is read with the voice of the device (`utils/deviceVoice.ts`).
 * The books are sorted by series: first the series are shown as tiles, a tap opens the stories of one series; a search looks in all of them.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import useSoundSettings from '@/use/useSoundSettings'
import usePremium from '@/use/usePremium'
import { noteUse } from '@/use/useActivity'
import { getVoiceBlob, listVoices, type VoiceMeta } from '@/use/useVoices'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { clock, fadedVolume, SLEEP_TIMER_MINUTES, type SleepTimerMinutes } from '@/utils/sleepTimer'
import { DeviceReader, speechAvailable, splitForSpeech } from '@/utils/deviceVoice'
import { isColoringBook } from '@/utils/coloringBook'
import { plainText } from '@/utils/plainText'
import { contentLocale } from '@/utils/contentLocale'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { seriesNameOfBook } = useCatalogNames()
const { voiceVolume } = useSoundSettings()
const { hasFeature, showUpsell } = usePremium()

// stories that grandma, grandpa or the parents have read into the microphone (kept on this device)
const family = ref<VoiceMeta[]>([])
onMounted(() => {
  void apiBooks.loadAllBooks()
  void apiSeries.loadAll()
  void listVoices().then((l) => (family.value = l))
})

const lang = computed<Locale>(() => (contentLocale(locale.value)))
const title = (b: ApiBook) => b.localizations?.[lang.value]?.title || b.localizations?.de?.title || ''
const srcOf = (b: ApiBook) => b.audio?.[lang.value] || b.audio?.de || b.audio?.en || ''

/** Every book that can be read to a child; where the device cannot speak, only the books with a recorded voice. */
const canSpeak = speechAvailable()
const query = ref('')
const stories = computed<ApiBook[]>(() => {
  const q = query.value.trim().toLocaleLowerCase(locale.value)
  return ((apiBooks.state.all ?? []) as ApiBook[])
    .filter((b) => !isColoringBook(b) && (canSpeak || !!srcOf(b)) && (!q || title(b).toLocaleLowerCase(locale.value).includes(q)))
    .sort((a, b) => title(a).localeCompare(title(b), locale.value, { numeric: true }))
})

/** The stories sorted by series (a story without a series goes to the last group). */
interface SeriesGroup {
  id: string
  name: string
  image: string
  books: ApiBook[]
  recorded: number
}
const openSeries = ref<string | null>(null)
const groups = computed<SeriesGroup[]>(() => {
  const map = new Map<string, SeriesGroup>()
  for (const b of stories.value) {
    const id = b.bookSeriesId || ''
    let g = map.get(id)
    if (!g) {
      g = { id, name: id ? seriesNameOfBook(b) : t('app.goodnight.otherStories'), image: pickLocalizedImage(b.previewImage, lang.value), books: [], recorded: 0 }
      map.set(id, g)
    }
    g.books.push(b)
    if (srcOf(b)) g.recorded++
  }
  // the series with a recorded voice first, then by name; the stories without a series last
  return [...map.values()].sort((a, b) => (a.id === '' ? 1 : b.id === '' ? -1 : b.recorded - a.recorded || a.name.localeCompare(b.name, locale.value, { numeric: true })))
})
const currentGroup = computed(() => groups.value.find((g) => g.id === openSeries.value) ?? null)
const searching = computed(() => query.value.trim().length > 0)

// ── the timer ────────────────────────────────────────────────────────────────────────────────────────────────────
const minutes = ref<SleepTimerMinutes>(20)
const label = (m: SleepTimerMinutes) => (m === 0 ? t('app.goodnight.untilEnd') : t('app.goodnight.minutes', { n: m }))

// ── the story ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'pick' | 'play' | 'done'
const phase = ref<Phase>('pick')
const currentTitle = ref('')
const playing = ref(false)
const remainingMs = ref(0)
const dim = ref(false)
const loading = ref(false)
const failed = ref(false)

let audio: HTMLAudioElement | null = null
/** The reader of a book without a recorded voice. */
let reader: DeviceReader | null = null
let ticker: ReturnType<typeof setInterval> | undefined
let dimTimer: ReturnType<typeof setTimeout> | undefined
let endsAt = 0
const DIM_AFTER_MS = 15_000

function wake() {
  dim.value = false
  clearTimeout(dimTimer)
  if (phase.value === 'play') dimTimer = setTimeout(() => (dim.value = true), DIM_AFTER_MS)
}

const currentVolume = () => (minutes.value === 0 ? voiceVolume.value : fadedVolume(voiceVolume.value, endsAt - Date.now()))

function applyVolume() {
  if (audio) audio.volume = currentVolume()
}

function tick() {
  if (!playing.value) return
  noteUse()
  if (minutes.value === 0) return
  remainingMs.value = Math.max(0, endsAt - Date.now())
  applyVolume()
  if (remainingMs.value <= 0) finish()
}

let voiceUrl = ''

function stopAudio() {
  if (voiceUrl) {
    URL.revokeObjectURL(voiceUrl)
    voiceUrl = ''
  }
  if (audio) {
    audio.pause()
    audio.onended = null
    audio.onerror = null
    audio = null
  }
  reader?.stop()
  reader = null
  playing.value = false
  clearInterval(ticker)
}

function finish() {
  stopAudio()
  clearTimeout(dimTimer)
  dim.value = false
  phase.value = 'done'
}

function start(book: ApiBook) {
  if (!hasFeature('readAloud')) {
    showUpsell('readAloud')
    return
  }
  const src = srcOf(book)
  stopAudio()
  if (src) begin(title(book), src)
  else void beginDevice(book)
}

/** A book without a recorded voice: its text is read with the voice of the device. */
async function beginDevice(book: ApiBook) {
  currentTitle.value = title(book)
  failed.value = false
  loading.value = true
  phase.value = 'play'
  endsAt = Date.now() + minutes.value * 60_000
  remainingMs.value = minutes.value * 60_000
  wake()
  const full = (await apiBooks.loadBook(book.bookId)) ?? book
  // the child may have chosen another story or gone back while the text was loading
  if (phase.value !== 'play' || currentTitle.value !== title(book)) return
  const pages = full.localizations?.[lang.value]?.content ?? full.localizations?.de?.content ?? []
  const pieces = [title(book), ...splitForSpeech(pages.map((p) => plainText(p.text)).filter(Boolean).join('\n\n'))]
  if (pieces.length < 2) {
    failed.value = true
    loading.value = false
    return
  }
  reader = new DeviceReader(
    pieces,
    lang.value === 'en' ? 'en-US' : 'de-DE',
    currentVolume,
    finish,
    () => {
      failed.value = true
      playing.value = false
    }
  )
  // the time of the timer starts when the voice starts
  endsAt = Date.now() + minutes.value * 60_000
  loading.value = false
  playing.value = true
  ticker = setInterval(tick, 1000)
  reader.start()
}

/** A story that someone from the family has recorded: free of Plus, it is their own voice. */
async function startVoice(v: VoiceMeta) {
  const blob = await getVoiceBlob(v.id)
  if (!blob) return
  stopAudio()
  voiceUrl = URL.createObjectURL(blob)
  begin(v.bookTitle, voiceUrl)
}

/** Starts a story; whoever calls it has stopped the one before. */
function begin(name: string, src: string) {
  currentTitle.value = name
  failed.value = false
  loading.value = true
  phase.value = 'play'
  endsAt = Date.now() + minutes.value * 60_000
  remainingMs.value = minutes.value * 60_000
  audio = new Audio(src)
  audio.onended = finish
  audio.onerror = () => {
    failed.value = true
    loading.value = false
    playing.value = false
  }
  audio.oncanplay = () => (loading.value = false)
  applyVolume()
  void audio
    .play()
    .then(() => {
      playing.value = true
      ticker = setInterval(tick, 1000)
    })
    .catch(() => {
      failed.value = true
      loading.value = false
    })
  wake()
}

/** Pause and go on; the time of the pause is not counted against the timer. */
function togglePause() {
  if (reader) {
    if (playing.value) {
      reader.pause()
      playing.value = false
      clearInterval(ticker)
      remainingMs.value = Math.max(0, endsAt - Date.now())
    } else {
      endsAt = Date.now() + remainingMs.value
      reader.resume()
      playing.value = true
      ticker = setInterval(tick, 1000)
    }
    wake()
    return
  }
  if (!audio) return
  if (playing.value) {
    audio.pause()
    playing.value = false
    clearInterval(ticker)
    remainingMs.value = Math.max(0, endsAt - Date.now())
  } else {
    endsAt = Date.now() + remainingMs.value
    void audio.play().then(() => {
      playing.value = true
      ticker = setInterval(tick, 1000)
    })
  }
  wake()
}

function chooseAnother() {
  stopAudio()
  clearTimeout(dimTimer)
  dim.value = false
  phase.value = 'pick'
}

function goBack() {
  stopAudio()
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-read' })
}

onBeforeUnmount(() => {
  stopAudio()
  clearTimeout(dimTimer)
})
</script>

<template lang="pug">
  div(class="gn-page" @pointerdown="wake")
    //- choose a story and a timer
    div(v-if="phase === 'pick'" class="gn-pick")
      header(class="gn-head")
        button(type="button" class="gn-back" @click="goBack")
          ZIconography(name="chevron-left" :size="20")
          span {{ t('app.read.back') }}
      div(class="gn-moon")
        ZIconography(name="moon" :size="64")
      h1(class="gn-title") {{ t('app.goodnight.title') }}
      p(class="gn-sub") {{ t('app.goodnight.sub') }}

      div(class="gn-timer" role="radiogroup" :aria-label="t('app.goodnight.timerTitle')")
        span(class="gn-label") {{ t('app.goodnight.timerTitle') }}
        div(class="gn-chips")
          button(
            v-for="m in SLEEP_TIMER_MINUTES"
            :key="m"
            type="button"
            role="radio"
            :aria-checked="minutes === m"
            :class="['gn-chip', { 'is-on': minutes === m }]"
            @click="minutes = m"
          ) {{ label(m) }}

      //- the family's own voices come first
      div(v-if="family.length" class="gn-list gn-family")
        span(class="gn-label") {{ t('app.goodnight.family') }}
        button(v-for="v in family" :key="v.id" type="button" class="gn-story" @click="startVoice(v)")
          span(class="gn-thumb gn-voice" aria-hidden="true") ♥
          span(class="gn-story-text")
            span(class="gn-story-series") {{ t('app.goodnight.readBy', { name: v.reader }) }}
            span(class="gn-story-title") {{ v.bookTitle }}
          ZIconography(name="chevron-right" :size="22")

      input(v-model="query" class="gn-search" type="search" :placeholder="t('app.goodnight.search')" :aria-label="t('app.goodnight.search')")
      //- the series as tiles
      div(v-if="stories.length && !searching && !currentGroup" class="gn-series")
        span(class="gn-label") {{ t('app.goodnight.pickSeries') }}
        div(class="gn-tiles")
          button(v-for="g in groups" :key="g.id" type="button" class="gn-tile" @click="openSeries = g.id")
            img(class="gn-tile-img" :src="withPlaceholder(g.image)" alt="" loading="lazy" draggable="false" @error="onImgFallback")
            span(class="gn-tile-name") {{ g.name }}
            span(class="gn-tile-sub") {{ t('app.goodnight.storyCount', g.books.length) }}

      //- the stories of one series, or the result of the search
      div(v-else-if="stories.length" class="gn-list")
        button(v-if="currentGroup && !searching" type="button" class="gn-series-back" @click="openSeries = null")
          ZIconography(name="chevron-left" :size="18")
          span {{ t('app.goodnight.allSeries') }}
          span(class="gn-series-title") {{ currentGroup.name }}
        button(v-for="b in (searching || !currentGroup ? stories : currentGroup.books)" :key="b.bookId" type="button" class="gn-story" @click="start(b)")
          img(class="gn-thumb" :src="withPlaceholder(pickLocalizedImage(b.previewImage, lang))" alt="" loading="lazy" draggable="false" @error="onImgFallback")
          span(class="gn-story-text")
            span(class="gn-story-series") {{ seriesNameOfBook(b) }}{{ srcOf(b) ? '' : ' · ' + t('app.goodnight.deviceVoice') }}
            span(class="gn-story-title") {{ title(b) }}
          ZIconography(name="chevron-right" :size="22")
      p(v-else class="gn-empty") {{ t('app.goodnight.empty') }}

    //- the story is told
    div(v-else-if="phase === 'play'" class="gn-play")
      div(class="gn-moon is-big")
        ZIconography(name="moon" :size="96")
      h2(class="gn-now") {{ currentTitle }}
      p(v-if="failed" class="gn-state") {{ t('app.goodnight.failed') }}
      p(v-else-if="loading" class="gn-state") {{ t('app.goodnight.loading') }}
      p(v-else-if="minutes === 0" class="gn-state") {{ t('app.goodnight.untilEndNow') }}
      p(v-else class="gn-clock") {{ clock(remainingMs) }}
      div(class="gn-actions")
        button(type="button" class="gn-btn is-main" @click="togglePause") {{ playing ? t('app.goodnight.pause') : t('app.goodnight.resume') }}
        button(type="button" class="gn-btn" @click="chooseAnother") {{ t('app.goodnight.another') }}
        button(type="button" class="gn-btn" @click="goBack") {{ t('app.goodnight.stop') }}
      //- the screen darkens; a tap brings it back
      div(class="gn-veil" :class="{ 'is-on': dim }" aria-hidden="true")

    //- over
    div(v-else class="gn-done")
      div(class="gn-moon is-big")
        ZIconography(name="moon" :size="96")
      h2(class="gn-title") {{ t('app.goodnight.bye') }}
      p(class="gn-sub") {{ t('app.goodnight.byeText') }}
      div(class="gn-actions")
        button(type="button" class="gn-btn is-main" @click="chooseAnother") {{ t('app.goodnight.another') }}
        button(type="button" class="gn-btn" @click="goBack") {{ t('app.goodnight.stop') }}
</template>

<style scoped lang="sass">
// always the night look, independent of the day/night setting of the app
.gn-page
  --gn-bg-1: #0d1829
  --gn-bg-2: #1a2a45
  --gn-text: #f3ead7
  --gn-muted: #a9b4c8
  --gn-accent: #e9c46a
  position: fixed
  inset: 0
  overflow-y: auto
  padding: calc(12px + env(safe-area-inset-top, 0px)) 18px calc(28px + env(safe-area-inset-bottom, 0px))
  background: radial-gradient(120% 80% at 50% 0%, var(--gn-bg-2) 0%, var(--gn-bg-1) 70%)
  color: var(--gn-text)
  text-align: center
  z-index: 20

.gn-pick, .gn-play, .gn-done
  display: flex
  flex-direction: column
  align-items: center
  max-width: 30rem
  margin: 0 auto
  min-height: 100%

.gn-head
  align-self: stretch
  display: flex

.gn-back
  display: inline-flex
  align-items: center
  gap: 2px
  min-height: 44px
  padding: 0 16px 0 8px
  border: 1px solid rgba(243, 234, 215, 0.3)
  border-radius: 999px
  background: transparent
  color: var(--gn-text)
  font: inherit
  font-weight: 700
  cursor: pointer

.gn-moon
  margin-top: 8px
  color: var(--gn-accent)
  filter: drop-shadow(0 0 18px rgba(233, 196, 106, 0.45))

  &.is-big
    margin-top: 18vh

.gn-title
  margin: 8px 0 0
  font-size: 1.8rem
  font-weight: 800

.gn-sub
  margin: 6px 0 0
  color: var(--gn-muted)
  line-height: 1.4

.gn-timer
  width: 100%
  margin-top: 20px

.gn-label
  display: block
  margin-bottom: 8px
  font-weight: 700
  color: var(--gn-muted)

.gn-chips
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 8px

.gn-chip
  min-height: 48px
  padding: 4px 6px
  border: 1px solid rgba(243, 234, 215, 0.28)
  border-radius: 16px
  background: rgba(243, 234, 215, 0.06)
  color: var(--gn-text)
  font: inherit
  font-weight: 700
  font-size: 0.92rem
  line-height: 1.15
  cursor: pointer

  &.is-on
    background: var(--gn-accent)
    border-color: var(--gn-accent)
    color: #2a1f08

.gn-series
  display: grid
  gap: 10px
  width: 100%
  margin-top: 22px

.gn-tiles
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px

.gn-tile
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 8px 8px 12px
  border: 1px solid rgba(243, 234, 215, 0.16)
  border-radius: 22px
  background: rgba(243, 234, 215, 0.07)
  color: var(--gn-text)
  font: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    background: rgba(243, 234, 215, 0.14)

.gn-tile-img
  width: 100%
  aspect-ratio: 1
  margin-bottom: 8px
  border-radius: 16px
  object-fit: cover

.gn-tile-name
  padding: 0 6px
  font-weight: 800
  font-size: 1rem
  line-height: 1.2

.gn-tile-sub
  padding: 0 6px
  font-size: 0.82rem
  color: var(--gn-muted)

.gn-series-back
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 4px 8px
  padding: 4px 4px 8px
  border: none
  background: transparent
  color: var(--gn-muted)
  font: inherit
  font-weight: 700
  text-align: left
  cursor: pointer

.gn-series-title
  flex-basis: 100%
  color: var(--gn-text)
  font-size: 1.35rem
  font-weight: 800
  line-height: 1.2

.gn-list
  display: grid
  gap: 10px
  width: 100%
  margin-top: 22px

.gn-story
  display: flex
  align-items: center
  gap: 12px
  width: 100%
  padding: 8px 14px 8px 8px
  border: 1px solid rgba(243, 234, 215, 0.16)
  border-radius: 20px
  background: rgba(243, 234, 215, 0.07)
  color: var(--gn-text)
  font: inherit
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    background: rgba(243, 234, 215, 0.14)

.gn-thumb
  flex: none
  width: 64px
  height: 64px
  border-radius: 14px
  object-fit: cover

.gn-voice
  display: grid
  place-items: center
  background: rgba(233, 196, 106, 0.2)
  color: var(--gn-accent)
  font-size: 1.6rem

.gn-story-text
  flex: 1
  display: flex
  flex-direction: column
  min-width: 0

.gn-search
  width: 100%
  margin-top: 16px
  min-height: 46px
  padding: 0 14px
  border: 1px solid rgba(233, 196, 106, 0.25)
  border-radius: 14px
  background: rgba(255, 255, 255, 0.06)
  color: inherit
  font: inherit

.gn-story-series
  font-size: 0.78rem
  color: var(--gn-muted)

.gn-story-title
  font-weight: 800
  line-height: 1.25

.gn-empty
  margin-top: 24px
  color: var(--gn-muted)

.gn-now
  margin: 16px 0 0
  font-size: 1.4rem
  font-weight: 800
  line-height: 1.25

.gn-clock
  margin: 10px 0 0
  font-size: 3rem
  font-weight: 300
  letter-spacing: 0.04em
  font-variant-numeric: tabular-nums

.gn-state
  margin: 14px 0 0
  color: var(--gn-muted)

.gn-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 28px

.gn-btn
  min-height: 52px
  border: 1px solid rgba(243, 234, 215, 0.3)
  border-radius: 999px
  background: transparent
  color: var(--gn-text)
  font: inherit
  font-weight: 700
  font-size: 1rem
  cursor: pointer

  &.is-main
    background: var(--gn-accent)
    border-color: var(--gn-accent)
    color: #2a1f08

// the darkening: almost black, but still tappable to wake it
.gn-veil
  position: fixed
  inset: 0
  background: #02060d
  opacity: 0
  pointer-events: none
  transition: opacity 2s ease-in

  &.is-on
    opacity: 0.92
    pointer-events: auto
</style>
