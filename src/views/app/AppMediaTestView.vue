<script setup lang="ts">
/**
 * The test page of "media outside the program file" (the test for 1.3, Anton 23.11.2026). Only a build with `VITE_MEDIA_SPLIT` has a button that leads here ("Ich").
 * It shows what the start found (where the folder of the media is), then asks for every file of the split adventure through `prependBaseUrl`, exactly as the app does,
 * and counts how many load. One look at this page on a real iPhone says whether the way works.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { prependBaseUrl } from '@/utils/function'
import { isSplitPath, mediaSplitReport, pictureLoads } from '@/utils/mediaSplit'

const router = useRouter()
const report = mediaSplitReport

const files = ref<string[]>([])
const state = reactive({ running: false, done: 0, ok: 0, failed: [] as string[], sampleUrl: '', soundUrl: '', soundNote: '' })
const total = computed(() => files.value.length)

/** True when the sound at `url` can be read (its length is known). */
function soundLoads(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const a = new Audio()
    const done = (ok: boolean) => {
      a.onloadedmetadata = null
      a.onerror = null
      resolve(ok)
    }
    a.preload = 'metadata'
    a.onloadedmetadata = () => done(true)
    a.onerror = () => done(false)
    window.setTimeout(() => done(false), timeoutMs)
    a.src = url
  })
}

async function loadList() {
  // the data of the adventure is only fetched in a build with the split (the condition is a constant: elsewhere the chunk is not even made)
  if (!import.meta.env.VITE_MEDIA_SPLIT) return
  const [{ elia }, { journeyFiles }] = await Promise.all([import('@/data/adventures/elia'), import('@/utils/journeyFiles')])
  files.value = journeyFiles(elia).filter((p) => isSplitPath(p))
  const pic = files.value.find((p) => /\.(webp|png|jpe?g)$/i.test(p))
  const snd = files.value.find((p) => /\.mp3$/i.test(p))
  state.sampleUrl = pic ? prependBaseUrl(pic) : ''
  state.soundUrl = snd ? prependBaseUrl(snd) : ''
}

async function checkAll() {
  if (state.running) return
  state.running = true
  state.done = 0
  state.ok = 0
  state.failed = []
  let next = 0
  const run = async () => {
    while (next < files.value.length) {
      const path = files.value[next++]!
      const url = prependBaseUrl(path)
      const ok = /\.mp3$/i.test(path) ? await soundLoads(url) : await pictureLoads(url, 8000)
      state.done++
      if (ok) state.ok++
      else state.failed.push(path)
    }
  }
  await Promise.all(Array.from({ length: 6 }, run))
  state.running = false
}

function playSound() {
  if (!state.soundUrl) return
  const a = new Audio(state.soundUrl)
  a.onplaying = () => (state.soundNote = 'Der Ton läuft.')
  a.onerror = () => (state.soundNote = 'Der Ton lässt sich nicht abspielen.')
  void a.play().catch((e) => (state.soundNote = 'Abspielen verweigert: ' + String(e)))
}

onMounted(async () => {
  await loadList()
  if (files.value.length) void checkAll()
})
</script>

<template lang="pug">
  div(class="mt" data-test="media-test")
    button(type="button" class="lk-btn lk-btn--small lk-btn--outline mt-back" @click="router.back()") Zurück
    h1 Medien-Test
    p(class="mt-sub") Nur in dieser Test-Fassung. Elia liegt hier nicht in der Programmdatei, sondern als eigene Dateien neben dem Programm.

    section(class="mt-box")
      h2 1. Wo liegen die Dateien?
      p Art: <b>{{ report.mode === 'asset' ? 'App (Asset-Protokoll)' : report.mode === 'web' ? 'Browser-Prüfung' : 'nicht aktiv' }}</b>
      p(v-if="report.resourceDir") Ressourcen-Ordner der App: <code>{{ report.resourceDir }}</code>
      p Gefunden: <b :class="report.chosen ? 'ok' : 'bad'">{{ report.chosen || 'NICHTS GEFUNDEN' }}</b> (nach {{ report.ms }} ms)
      p(v-if="report.error" class="bad") Fehler: {{ report.error }}
      ul(v-if="report.tried.length")
        li(v-for="t in report.tried" :key="t.where" :class="t.ok ? 'ok' : 'bad'") {{ t.ok ? '✓' : '✗' }} {{ t.where }}

    section(class="mt-box")
      h2 2. Laden alle Dateien von Elia?
      p(v-if="!total") Keine Dateien in der Liste (diese Fassung hat keine getrennten Medien).
      template(v-else)
        p <b :class="state.ok === total ? 'ok' : state.running ? '' : 'bad'">{{ state.ok }} von {{ total }} geladen</b> ({{ state.done }} geprüft)
        p(v-if="state.running") Prüfung läuft …
        template(v-if="state.failed.length")
          p(class="bad") Nicht geladen ({{ state.failed.length }}), die ersten:
          ul
            li(v-for="f in state.failed.slice(0, 8)" :key="f") {{ f }}
        button(type="button" class="lk-btn lk-btn--small" :disabled="state.running" @click="checkAll") Noch einmal prüfen

    section(class="mt-box")
      h2 3. Bild und Ton ansehen
      img(v-if="state.sampleUrl" :src="state.sampleUrl" alt="" class="mt-pic")
      p(v-else) kein Bild
      button(type="button" class="lk-btn lk-btn--small" :disabled="!state.soundUrl" @click="playSound") Ton abspielen
      p {{ state.soundNote }}
</template>

<style scoped lang="sass">
.mt
  display: flex
  flex-direction: column
  gap: 12px
  max-width: 640px
  margin: 8px auto 90px
  padding: 0 16px

.mt-back
  align-self: flex-start

.mt-sub
  color: var(--lk-muted)
  margin: 0

.mt-box
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  border-radius: 16px
  padding: 12px 14px
  display: flex
  flex-direction: column
  gap: 6px
  word-break: break-word

  h2
    margin: 0
    font-size: 1.05rem

  p, ul
    margin: 0

  ul
    padding-left: 18px

.mt-pic
  width: 100%
  max-height: 220px
  object-fit: cover
  border-radius: 12px

.ok
  color: #1f7a45

.bad
  color: #b3261e
</style>
