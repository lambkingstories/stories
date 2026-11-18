<script setup lang="ts">
/**
 * The quiet view of one painting (Anton, 18.11.2026): a tap on a painting of the exhibition or of "My finished pictures" shows it whole and calm instead
 * of opening the painting screen, where a finger could paint on it by mistake. From here the child can keep painting, watch the time-lapse (when the
 * painting has one), save the picture, and hang it in the exhibition or take it down. It only says what was chosen; the painting screen does the work.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ZIconography from '@/components/atoms/ZIconography.vue'
import { getTimelapse, type ArtworkMeta } from '@/use/useArtworks'
import { MIN_STEPS, unpackTimelapse, type TimelapseData } from '@/utils/timelapse'

const props = defineProps<{
  work: ArtworkMeta
  /** The painting hangs in the exhibition. */
  hung: boolean
}>()
const emit = defineEmits<{
  close: []
  /** Keep painting on it. */
  continue: [meta: ArtworkMeta]
  save: [meta: ArtworkMeta]
  lapse: [meta: ArtworkMeta, data: TimelapseData]
  'toggle-hang': [meta: ArtworkMeta]
}>()
const { t } = useI18n({ useScope: 'global' })

/** The time-lapse of the painting, when it has a real one (at least a few strokes) and its line art can be drawn again (a picture, a blank sheet). */
const lapse = ref<TimelapseData | null>(null)
let alive = true

async function loadLapse() {
  lapse.value = null
  if (props.work.sourceType === 'pdf') return
  const blob = await getTimelapse(props.work.id)
  const data = blob ? await unpackTimelapse(blob) : null
  if (alive && data && data.steps.length >= MIN_STEPS) lapse.value = data
}

const closeBtn = ref<HTMLButtonElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  void loadLapse()
  window.addEventListener('keydown', onKey)
  closeBtn.value?.focus()
})
onBeforeUnmount(() => {
  alive = false
  window.removeEventListener('keydown', onKey)
})
watch(() => props.work.id, () => void loadLapse())
</script>

<template lang="pug">
  div(class="av" role="dialog" aria-modal="true" :aria-label="work.title" data-test="artwork-viewer" @click.self="emit('close')")
    div(class="av-window")
      header(class="av-head")
        h3(class="av-title") {{ work.title }}
        button(ref="closeBtn" type="button" class="av-close" :aria-label="t('app.coloring.viewClose')" data-test="viewer-close" @click="emit('close')") ✕
      div(class="av-stage")
        //- the picture as it is (the thumb has the ratio of the sheet): no white bars
        img(class="av-pic" :src="work.thumb" :alt="work.title" draggable="false")
      div(class="av-actions")
        button(type="button" class="lk-btn av-main" data-test="viewer-continue" @click="emit('continue', work)")
          ZIconography(name="brush" :size="22")
          span {{ t('app.coloring.keepPainting') }}
        button(v-if="lapse" type="button" class="lk-btn lk-btn--outline av-btn" data-test="viewer-lapse" @click="emit('lapse', work, lapse)")
          ZIconography(name="eye" :size="22")
          span {{ t('app.coloring.timelapseWatch') }}
        button(type="button" class="lk-btn lk-btn--outline av-btn" data-test="viewer-save" @click="emit('save', work)")
          ZIconography(name="download" :size="22")
          span {{ t('app.coloring.savePng') }}
        button(type="button" class="lk-btn lk-btn--outline av-btn" data-test="viewer-hang" @click="emit('toggle-hang', work)")
          ZIconography(name="star" :size="22")
          span {{ hung ? t('app.coloring.exhibitionTakeDown') : t('app.coloring.exhibitionHang') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit
  touch-action: manipulation

.av
  position: fixed
  inset: 0
  z-index: 70
  display: flex
  align-items: center
  justify-content: center
  padding: 12px 12px calc(92px + env(safe-area-inset-bottom, 0px))
  background: rgba(22, 36, 51, 0.62)

.av-window
  width: 100%
  max-width: 560px
  max-height: 100%
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 14px 14px
  overflow-y: auto
  border-radius: var(--lk-r-group)
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  color: var(--lk-text)
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35)

.av-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.av-title
  margin: 0
  min-width: 0
  font-size: 1.15rem
  font-weight: 800
  line-height: 1.2
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.av-close
  flex: 0 0 auto
  width: 48px
  height: 48px
  border: 1px solid var(--lk-line)
  border-radius: 50%
  background: var(--lk-surface)
  color: var(--lk-muted)
  font-size: 1.05rem
  font-weight: 800
  cursor: pointer

// the picture is held in a calm frame: as big as the room allows, always whole
.av-stage
  flex: 1 1 auto
  min-height: 0
  display: flex
  align-items: center
  justify-content: center
  padding: 10px
  border-radius: 18px
  background: #f6ecd8
  box-shadow: inset 0 0 0 1px rgba(160, 120, 50, 0.18)

.av-pic
  display: block
  max-width: 100%
  max-height: min(44vh, 520px)
  width: auto
  height: auto
  border: 4px solid #d9a93a
  border-radius: 4px
  background: #ffffff
  box-shadow: 0 6px 16px rgba(70, 45, 10, 0.28)

.av-actions
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

.av-main
  grid-column: 1 / -1

.av-btn
  min-height: 56px
  padding: 0 12px
  font-size: 0.95rem

@media (max-height: 520px)
  .av
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px))

  .av-pic
    max-height: 34vh

  .av-actions
    grid-template-columns: repeat(4, 1fr)

  .av-main
    grid-column: auto
</style>
