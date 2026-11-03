<script setup lang="ts">
/**
 * "Mein Dankbuch": a quiet place for the child's own words and little drawings (what was good today, who to thank, what to tell God).
 * Nothing is prescribed: a question is only the grey hint in the empty field. Everything stays on the device.
 * A drawing is painted in the painting program of the app (a blank sheet); "Put in my book" there brings it back here.
 * An entry can be sent to grandma and grandpa as a thank-you sheet (words and drawing on one sheet); sending leaves the app, so it sits
 * behind the parental gate.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GreetingCardSheet from '@/components/molecules/GreetingCardSheet.vue'
import useJournal, { MAX_TEXT, readDraft, writeDraft, type JournalEntry } from '@/use/useJournal'
import useUserName from '@/use/useUserName'
import { requireParent } from '@/use/useParentalGate'
import { drawThanksCard } from '@/utils/thanksCard'
import { prependBaseUrl } from '@/utils/function'

const { t, tm, rt, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const journal = useJournal()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

const text = ref(readDraft())
// the words are kept while the child paints and comes back
watch(text, (v) => writeDraft(v))
// a picture that could not be kept comes back with this flag
const failed = ref(route.query.failed === '1')
const saved = ref(false)
const confirmId = ref('')

// ── sending an entry as a thank-you sheet ──────────────────────────────────────────────────────────────────────
const { displayName, hasCustomName } = useUserName()
const sendEntry = ref<JournalEntry | null>(null)

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function sendSheet(payload: { to: string }) {
  const entry = sendEntry.value
  sendEntry.value = null
  if (!entry) return
  // sending leaves the app: the parental gate comes first
  if (!(await requireParent())) return
  const to = payload.to.trim()
  const drawing = entry.drawing ? await loadImage(entry.drawing) : null
  const logo = await loadImage(prependBaseUrl('images/logo/lk-lamm.webp'))
  const sheet = drawThanksCard(
    {
      heading: t('app.journal.thanksHeading'),
      forLine: to ? t('app.journal.thanksFor', { name: to }) : '',
      date: dateOf(entry.at),
      text: entry.text,
      sign: hasCustomName.value ? t('app.journal.thanksSigned', { name: displayName.value }) : t('app.journal.thanksSignedApp')
    },
    drawing,
    drawing ? { w: drawing.naturalWidth, h: drawing.naturalHeight } : null,
    logo
  )
  const blob: Blob | null = await new Promise((resolve) => sheet.toBlob((b) => resolve(b), 'image/png'))
  if (!blob) return
  const file = new File([blob], `${t('app.journal.thanksFile')}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t('app.journal.thanksHeading'), text: to ? t('app.journal.thanksFor', { name: to }) : t('app.journal.thanksHeading') })
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('share failed', err)
    }
    return
  }
  // no file sharing here (a computer): the sheet is saved as a picture
  const a = document.createElement('a')
  a.download = file.name
  a.href = URL.createObjectURL(blob)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

// one grey hint per day, so the field is never empty-looking but nothing is put into it
const prompts = computed(() => (tm('app.journal.prompts') as unknown[]).map((p) => rt(p as string)))
const hint = computed(() => prompts.value[Math.floor(Date.now() / 86_400_000) % Math.max(1, prompts.value.length)] ?? '')

const canSave = computed(() => text.value.trim().length > 0)

function save() {
  failed.value = false
  const ok = journal.add(text.value)
  if (!ok) {
    failed.value = true
    return
  }
  text.value = ''
  saved.value = true
  setTimeout(() => (saved.value = false), 2500)
}

/** Painting is done in the real painting program, on a blank sheet; the words wait here. */
function paint() {
  writeDraft(text.value)
  void router.push({ name: 'app-coloring', query: { journal: '1' } })
}

const dateOf = (ms: number) => new Date(ms).toLocaleDateString(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })

function askRemove(id: string) {
  confirmId.value = id
}
function doRemove() {
  journal.remove(confirmId.value)
  confirmId.value = ''
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.journal.title')" :subtitle="t('app.journal.sub')" @back="goBack")

    section(class="jr-wrap")
      div(class="jr-card")
        textarea(
          v-model="text"
          class="jr-text"
          rows="4"
          :maxlength="MAX_TEXT"
          :placeholder="hint"
          :aria-label="t('app.journal.title')"
        )
        button(type="button" class="jr-draw" @click="paint") {{ t('app.journal.addDrawing') }}
        p(v-if="failed" class="jr-fail" role="alert") {{ t('app.journal.failed') }}
        p(v-if="saved" class="jr-ok" role="status") {{ t('app.journal.saved') }}
        AdvButton(tone="gold" :disabled="!canSave" @click="save") {{ t('app.journal.save') }}
        p(class="jr-private") {{ t('app.journal.private') }}

      p(v-if="!journal.entries.value.length" class="jr-empty") {{ t('app.journal.empty') }}
      ul(v-else class="jr-list")
        li(v-for="e in journal.entries.value" :key="e.id" class="jr-entry")
          div(class="jr-entry-head")
            span(class="jr-date") {{ dateOf(e.at) }}
            span(class="jr-tools")
              button(type="button" class="jr-send" @click="sendEntry = e") {{ t('app.journal.send') }}
              button(type="button" class="jr-x" :aria-label="t('app.journal.remove')" @click="askRemove(e.id)") ✕
          p(v-if="e.text" class="jr-entry-text") {{ e.text }}
          img(v-if="e.drawing" class="jr-entry-img" :src="e.drawing" alt="" draggable="false")

    GreetingCardSheet(:open="!!sendEntry" :with-line="false" :title="t('app.journal.sendTitle')" :text="t('app.journal.sendText')" @close="sendEntry = null" @send="sendSheet")

    //- delete only after asking
    div(v-if="confirmId" class="jr-backdrop" @click.self="confirmId = ''")
      div(class="jr-dialog" role="alertdialog" aria-modal="true")
        p(class="jr-dialog-text") {{ t('app.journal.removeAsk') }}
        div(class="jr-dialog-actions")
          AdvButton(tone="blau" @click="doRemove") {{ t('app.journal.removeYes') }}
          AdvButton(tone="gold" @click="confirmId = ''") {{ t('app.journal.removeNo') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.jr-wrap
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.jr-card
  display: flex
  flex-direction: column
  gap: 10px
  padding: 16px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.jr-text
  width: 100%
  padding: 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit
  line-height: 1.45
  resize: vertical

.jr-draw
  min-height: 46px
  border: 2px dashed var(--lk-line)
  border-radius: 16px
  background: transparent
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  cursor: pointer

.jr-fail
  margin: 0
  color: #c8553d
  font-weight: 700

.jr-ok
  margin: 0
  color: #2f8f5b
  font-weight: 700

.jr-private
  margin: 0
  text-align: center
  font-size: 0.82rem
  color: var(--lk-muted)

.jr-empty
  margin: 22px 0 0
  text-align: center
  color: var(--lk-muted)

.jr-list
  display: grid
  gap: 12px
  margin: 18px 0 0
  padding: 0
  list-style: none

.jr-entry
  padding: 12px 14px 14px
  border-radius: 20px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)

.jr-entry-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.jr-date
  font-size: 0.85rem
  font-weight: 800
  color: var(--lk-muted)

.jr-tools
  display: flex
  align-items: center
  gap: 8px

.jr-send
  min-height: 34px
  padding: 0 14px
  border: none
  border-radius: 999px
  background: #c9962a
  color: #fff
  font: inherit
  font-size: 0.85rem
  font-weight: 800
  cursor: pointer

.jr-x
  width: 32px
  height: 32px
  border: none
  border-radius: 50%
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  cursor: pointer

.jr-entry-text
  margin: 8px 0 0
  line-height: 1.5
  white-space: pre-wrap
  overflow-wrap: anywhere

.jr-entry-img
  display: block
  width: 100%
  margin-top: 10px
  border-radius: 14px
  border: 1px solid var(--lk-line)

.jr-backdrop
  position: fixed
  inset: 0
  z-index: 90
  display: flex
  align-items: center
  justify-content: center
  padding: 16px
  background: rgba(8, 16, 26, 0.55)

.jr-dialog
  width: 100%
  max-width: 340px
  padding: 20px 18px 18px
  border-radius: 24px
  background: var(--lk-surface)
  color: var(--lk-text)
  text-align: center

.jr-dialog-text
  margin: 0 0 14px
  font-weight: 800

.jr-dialog-actions
  display: grid
  gap: 8px
</style>
