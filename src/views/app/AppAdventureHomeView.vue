<script setup lang="ts">
/**
 * The adventure tab: the journeys as painted medals. Josef is the first; the next ones (Adam and Eve, Noah, and on through the
 * whole Bible) stand there closed until they are written. A tap on a medal opens the map of that journey.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AdvButton from '@/components/atoms/AdvButton.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import AdvDialog from '@/components/molecules/AdvDialog.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import { journeys } from '@/data/adventures'
import { groupByEpoch } from '@/data/adventures/timeline'
import useAdventure from '@/use/useAdventure'
import useButtonSounds from '@/use/useButtonSounds'
import { deleteArtwork, pageArtworkId } from '@/use/useArtworks'
import useJourneyPack from '@/use/useJourneyPack'
import { maxPoints, medalFor, nextStageIndex, pointsOf } from '@/utils/adventureScore'
import { journeyToContinue } from '@/utils/continueJourney'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()
useButtonSounds()

const ui = (name: string) => prependBaseUrl(`images/abenteuer/ui/${name}.webp`)

const items = computed(() =>
  journeys.map((j) => {
    const p = adv.progressOf(j.id)
    const points = pointsOf(p)
    const max = maxPoints(j)
    const medal = p?.exam ? medalFor(points, max) : null
    // up to three stars for the share of the points (a quick look at how far the child is)
    const share = max ? points / max : 0
    const next = nextStageIndex(j, p)
    const begun = !!p && Object.keys(p.stages).length > 0
    return {
      journey: j,
      points,
      max,
      medal,
      stars: share >= 0.9 ? 3 : share >= 0.5 ? 2 : share > 0 ? 1 : 0,
      /** how many stages are done, for the bar and the line 'Chapter 2 of 6' */
      doneCount: next === null ? j.stages.length : next,
      total: j.stages.length,
      begun
    }
  })
)

const pack = useJourneyPack()

// the time line of the Bible: one group per epoch, the adventures that are not built stand closed in their place
const groups = computed(() => groupByEpoch(items.value))

// the adventure to go on with: the first one that was begun and is not finished (in the order of the time line)
const goOn = computed(() => {
  const j = journeyToContinue(journeys, adv.progressOf)
  return items.value.find((i) => i.journey.id === j?.id) ?? null
})

function jumpTo(id: string) {
  document.getElementById(`epoch-${id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

// the window of the journey that was tapped
const detailId = ref('')
const detail = computed(() => items.value.find((i) => i.journey.id === detailId.value))

function openFromDetail() {
  const id = detailId.value
  detailId.value = ''
  if (id) open(id)
}

function askFromDetail(kind: 'reset' | 'delete') {
  const id = detailId.value
  detailId.value = ''
  dialog.value = { kind, id }
}

// the stars of all journeys together: counted the way the map counts them (the stars of the stages plus the right answers of the exam)
const starTotal = computed(() => journeys.reduce((n, j) => n + pointsOf(adv.progressOf(j.id)), 0))
const starMax = computed(() => journeys.reduce((n, j) => n + maxPoints(j), 0))
const starShare = computed(() => (starMax.value ? Math.min(1, starTotal.value / starMax.value) : 0))

function go(id: string) {
  void router.push({ name: 'app-adventure-map', params: { journeyId: id } })
}

// What is asked in a dialog: the one-time download, starting again, or removing the downloaded files.
const dialog = ref<{ kind: 'download' | 'reset' | 'delete'; id: string } | null>(null)
const dialogJourney = computed(() => journeys.find((j) => j.id === dialog.value?.id))
const percent = computed(() => Math.round(pack.progress.value * 100))

/** A journey that was downloaded opens at once; otherwise the child is asked first (the download is made once). */
function open(id: string) {
  if (pack.isReady(id) || !pack.supported) {
    go(id)
    return
  }
  pack.failed.value = false
  dialog.value = { kind: 'download', id }
  // no question: the loading starts at once, and the map opens when it is done
  void startDownload()
}

async function startDownload() {
  const j = dialogJourney.value
  if (!j) return
  pack.failed.value = false
  const ok = await pack.download(j)
  if (ok && dialog.value?.kind === 'download') {
    dialog.value = null
    go(j.id)
  }
}

function startWithoutDownload() {
  const id = dialog.value?.id
  dialog.value = null
  if (id) go(id)
}

function closeDialog() {
  if (pack.busy.value) pack.cancel()
  dialog.value = null
}

/** Starting again: the stars, the cups and the pictures painted for this journey are gone. */
async function doReset() {
  const j = dialogJourney.value
  if (!j) return
  adv.reset(j.id)
  for (const s of j.stages) {
    if (s.task.kind === 'ausmalen' && s.task.image) await deleteArtwork(pageArtworkId(prependBaseUrl(s.task.image), 1))
  }
  dialog.value = null
}

async function doDelete() {
  const id = dialog.value?.id
  if (id) await pack.remove(id)
  dialog.value = null
}
</script>

<template lang="pug">
  div(class="home-page")
    AppHeader
    header(class="home-head")
      div
        h1(class="home-title") {{ t('app.nav.abenteuer') }}
        p(class="home-hint") {{ t('app.adventure.introSub') }}
      LkCompanion(class="home-lamb" pose="kompass" :size="92")

    div(class="home-list")
      //- the stars of all journeys together (journeys that come later count in it, too)
      div(class="stars-card" role="group" :aria-label="t('app.home.starsAll', { n: starTotal, max: starMax })")
        img(:src="ui('stern-gold-3')" alt="" class="stars-img" draggable="false")
        span(class="stars-body")
          span(class="stars-title") {{ t('app.home.starsTitle') }}
          span(class="stars-bar" aria-hidden="true")
            span(class="stars-fill" :style="{ width: Math.round(starShare * 100) + '%' }")
        span(class="stars-count") {{ starTotal }} / {{ starMax }}

      //- the time line of the Bible: a band of epochs to jump to, the adventure to go on with, and a numbered grid for every epoch
      div(class="chips" role="navigation" :aria-label="t('app.adventure.timelineLabel')")
        button(v-for="g in groups" :key="g.epoch.id" type="button" class="chip" @click="jumpTo(g.epoch.id)") {{ g.title }}

      button(v-if="goOn" type="button" class="go-on" @click="detailId = goOn.journey.id")
        img(:src="prependBaseUrl(goOn.journey.medal)" alt="" draggable="false" class="go-on-art")
        span(class="go-on-body")
          span(class="go-on-kicker") {{ t('app.adventure.continueJourney') }}
          span(class="go-on-title") {{ goOn.journey.title }}
          span(class="go-on-bar" aria-hidden="true")
            span(class="go-on-fill" :style="{ width: Math.round((goOn.doneCount / goOn.total) * 100) + '%' }")
          span(class="go-on-chap") {{ t('app.adventure.chapterOf', { n: Math.min(goOn.doneCount + 1, goOn.total), total: goOn.total }) }}

      section(v-for="g in groups" :key="g.epoch.id" :id="`epoch-${g.epoch.id}`" class="epoch")
        h2(class="epoch-title") {{ g.title }}
          small(class="epoch-sub") {{ g.sub }}
        div(class="tile-grid")
          template(v-for="e in g.entries" :key="e.id")
            button(v-if="e.item" type="button" class="tile" @click="detailId = e.item.journey.id")
              span(class="tile-no") {{ e.nr }}
              span(class="tile-art")
                img(:src="prependBaseUrl(e.item.journey.medal)" alt="" draggable="false")
                img(v-if="e.item.medal" :src="ui(`pokal-${e.item.medal === 'silver' ? 'silber' : e.item.medal}`)" alt="" class="tile-cup" draggable="false")
              span(class="tile-name") {{ e.title }}
              AdventureStars(:stars="e.item.stars" :size="16")
            div(v-else class="tile is-closed")
              span(class="tile-no") {{ e.nr }}
              span(class="tile-art")
                img(:src="ui('coin-locked')" alt="" draggable="false")
                img(:src="ui('lock')" alt="" class="tile-lock" draggable="false")
              span(class="tile-name") {{ e.title }}
              span(class="tile-soon") {{ t('app.adventure.soonLabel') }}

    //- the window of one journey
    AdvDialog(v-if="detail" :title="detail.journey.title" @close="detailId = ''")
      div(class="journey")
        span(class="medal-art")
          img(:src="prependBaseUrl(detail.journey.medal)" alt="" draggable="false")
          img(v-if="detail.medal" :src="ui(`pokal-${detail.medal === 'silver' ? 'silber' : detail.medal}`)" alt="" class="medal-cup" draggable="false")
        p(class="journey-sub") {{ detail.journey.subtitle }}
        div(class="journey-bar" role="progressbar" :aria-valuenow="detail.doneCount" aria-valuemin="0" :aria-valuemax="detail.total")
          span(class="journey-fill" :style="{ width: Math.round((detail.doneCount / detail.total) * 100) + '%' }")
        p(class="journey-chap") {{ t('app.adventure.chapterOf', { n: Math.min(detail.doneCount + 1, detail.total), total: detail.total }) }}
        div(class="journey-stars")
          AdventureStars(:stars="detail.stars" :size="26")
          span(v-if="detail.points" class="medal-points") {{ t('app.adventure.points', { n: detail.points, max: detail.max }) }}
        div(v-if="detail.points || adv.progressOf(detail.journey.id) || pack.isReady(detail.journey.id)" class="medal-tools")
          button(v-if="adv.progressOf(detail.journey.id)" type="button" class="medal-tool" @click="askFromDetail('reset')") {{ t('app.adventure.resetLink') }}
          button(v-if="pack.isReady(detail.journey.id)" type="button" class="medal-tool" @click="askFromDetail('delete')") {{ t('app.adventure.deleteLink') }}
      template(#actions)
        AdvButton(tone="gold" @click="openFromDetail") {{ detail.begun ? t('app.adventure.continueJourney') : t('app.adventure.beginJourney') }}
        button(type="button" class="dlg-link" @click="detailId = ''") {{ t('app.adventure.dlg_close') }}

    //- the questions: download once, start again, remove the downloaded files
    AdvDialog(v-if="dialog && dialogJourney" :title="t(`app.adventure.dlg_${dialog.kind}_title`)" :closable="!pack.busy.value" @close="closeDialog")
      template(v-if="dialog.kind === 'download'")
        p(v-if="!pack.failed.value" class="dlg-p") {{ t('app.adventure.dlg_download_text', { title: dialogJourney.title, mb: dialogJourney.downloadMb ?? 8 }) }}
        div(v-if="!pack.failed.value" class="dl-bar" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100")
          span(class="dl-fill" :style="{ width: `${percent}%` }")
        p(v-if="!pack.failed.value" class="dlg-p dl-now") {{ t('app.adventure.dlg_loading', { n: percent }) }}
        p(v-if="!pack.failed.value" class="dlg-small") {{ t('app.adventure.dlg_privacy') }}
        p(v-if="pack.failed.value" class="dlg-p dl-failed" role="alert") {{ t('app.adventure.dlg_failed') }}
      p(v-else-if="dialog.kind === 'reset'" class="dlg-p") {{ t('app.adventure.dlg_reset_text', { title: dialogJourney.title }) }}
      p(v-else class="dlg-p") {{ t('app.adventure.dlg_delete_text', { mb: dialogJourney.downloadMb ?? 8 }) }}
      template(#actions)
        template(v-if="dialog.kind === 'download'")
          template(v-if="pack.failed.value")
            AdvButton(tone="gold" @click="startDownload") {{ t('app.adventure.dlg_retry') }}
            button(type="button" class="dlg-link" @click="startWithoutDownload") {{ t('app.adventure.dlg_without') }}
          button(v-else type="button" class="dlg-link" @click="closeDialog") {{ t('app.adventure.dlg_cancel') }}
        template(v-else-if="dialog.kind === 'reset'")
          AdvButton(tone="blau" @click="doReset") {{ t('app.adventure.dlg_reset_yes') }}
          AdvButton(tone="gold" @click="closeDialog") {{ t('app.adventure.dlg_reset_no') }}
        template(v-else)
          AdvButton(tone="blau" @click="doDelete") {{ t('app.adventure.dlg_delete_yes') }}
          AdvButton(tone="gold" @click="closeDialog") {{ t('app.adventure.dlg_reset_no') }}
</template>

<style scoped lang="sass">
$ink: var(--lk-text)

.home-page
  min-height: 100vh
  background: var(--lk-bg)
  color: $ink
  padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px))

.home-head
  display: flex
  align-items: flex-end
  justify-content: space-between
  max-width: 560px
  margin: 0 auto
  padding: 0 16px

.home-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.1

.home-hint
  margin: 4px 0 6px
  font-size: 1.05rem
  color: var(--lk-muted)

.home-lamb
  margin-bottom: -6px

.home-list
  display: flex
  flex-direction: column
  gap: 16px
  max-width: 560px
  margin: 18px auto 0
  padding: 0 16px

.journey
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  text-align: center

.journey .medal-art
  width: 52%
  max-width: 190px
  margin: 4px 0 6px

.stars-card
  display: flex
  align-items: center
  gap: 14px
  padding: 12px 18px 12px 12px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.stars-img
  flex: 0 0 auto
  height: 44px
  width: auto
  display: block

.stars-body
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 8px

.stars-title
  font-weight: 800
  font-size: 1.05rem

.stars-bar
  display: block
  height: 9px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.stars-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #f6c445, #e8a317)

.stars-count
  flex: 0 0 auto
  font-weight: 800
  font-size: 1.1rem
  font-variant-numeric: tabular-nums

.chips
  display: flex
  gap: 8px
  overflow-x: auto
  margin: 0 -16px
  padding: 4px 16px 8px
  position: sticky
  top: 0
  z-index: 3
  background: var(--lk-bg)
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none

.chip
  flex: 0 0 auto
  padding: 8px 14px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  color: $ink
  font: inherit
  font-size: 0.9rem
  font-weight: 700
  white-space: nowrap
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active
    transform: scale(0.96)

.go-on
  display: flex
  align-items: center
  gap: 14px
  width: 100%
  padding: 12px 16px
  border: 1px solid #e8cf86
  border-radius: var(--lk-r-group)
  background: linear-gradient(135deg, #fff3cf, #fde6a8)
  color: #3a2a18
  font: inherit
  text-align: left
  cursor: pointer
  box-shadow: var(--lk-shadow)
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active
    transform: scale(0.98)

.go-on-art
  flex: 0 0 auto
  width: 84px
  height: 84px
  object-fit: contain
  filter: drop-shadow(0 6px 8px rgba(60, 40, 10, 0.35))

.go-on-body
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 4px

.go-on-kicker
  font-size: 0.85rem
  font-weight: 800
  color: #8a3a1a

.go-on-title
  font-size: 1.3rem
  font-weight: 800
  line-height: 1.15

.go-on-bar
  display: block
  height: 8px
  border-radius: 999px
  background: #f2e2b0
  overflow: hidden

.go-on-fill
  display: block
  height: 100%
  border-radius: 999px
  background: #c9962a

.go-on-chap
  font-size: 0.85rem
  color: #6b5a3f

.epoch
  scroll-margin-top: 56px

.epoch-title
  margin: 6px 4px 10px
  font-size: 1.2rem
  font-weight: 800

.epoch-sub
  margin-left: 8px
  font-size: 0.8rem
  font-weight: 600
  color: var(--lk-muted)

.tile-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px

.tile
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 5px
  padding: 14px 4px 10px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  font: inherit
  color: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active:not(.is-closed)
    transform: scale(0.96)

  &.is-closed
    cursor: default
    opacity: 0.8

.tile-no
  position: absolute
  left: 6px
  top: 6px
  min-width: 22px
  padding: 1px 6px
  border-radius: 999px
  background: var(--lk-track)
  color: var(--lk-muted)
  font-size: 0.72rem
  font-weight: 800
  line-height: 1.4

.tile-art
  position: relative
  display: block
  width: 82%
  max-width: 110px

  img
    display: block
    width: 100%
    height: auto
    filter: drop-shadow(0 6px 8px rgba(60, 40, 10, 0.35))

.tile-art .tile-cup
  position: absolute
  right: -12%
  bottom: -6%
  width: 40%
  pointer-events: none

.tile-art .tile-lock
  position: absolute
  left: 50%
  top: 50%
  width: 30%
  transform: translate(-50%, -50%)
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35))

.tile-name
  font-weight: 800
  font-size: 0.85rem
  line-height: 1.15

.tile-soon
  font-size: 0.75rem
  color: var(--lk-muted)

.journey-title
  margin: 4px 0 0
  font-size: 1.5rem
  font-weight: 800

.journey-sub
  margin: 0
  color: var(--lk-muted)

.journey-bar
  width: 100%
  height: 7px
  margin-top: 6px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.journey-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-fill)

.journey-chap
  margin: 0 0 4px
  font-size: 0.9rem
  color: var(--lk-muted)

.journey-stars
  display: flex
  align-items: center
  gap: 8px
  margin-bottom: 8px

.journey .lk-btn
  margin-top: 4px

.more-title
  margin: 0 0 10px
  font-size: 1.3rem
  font-weight: 800

.more-row
  display: flex
  align-items: center
  gap: 18px

.more-item
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  flex: 1

.more-medal
  position: relative
  display: block
  width: 96px

  img
    display: block
    width: 100%
    height: auto

  .more-lock
    position: absolute
    left: 50%
    top: 50%
    width: 30%
    transform: translate(-50%, -50%)

.more-name
  font-weight: 800

.more-soon
  font-size: 0.88rem
  color: var(--lk-muted)

.medal-tools
  display: flex
  align-items: center
  flex-wrap: wrap
  justify-content: center
  gap: 2px 14px
  margin-top: 4px

.medal-tool
  padding: 8px 6px
  border: 0
  background: transparent
  font: inherit
  font-size: 0.88rem
  font-weight: 600
  color: var(--lk-muted)
  text-decoration: underline
  cursor: pointer
  min-height: 44px

.dlg-p
  margin: 0 0 8px

.dlg-small
  margin: 0 0 8px
  font-size: 0.82rem
  font-weight: 600
  color: var(--lk-muted)

.dl-bar
  height: 16px
  margin: 10px 4px 6px
  border-radius: 999px
  background: rgba(120, 80, 30, 0.25)
  border: 2px solid #b98a2e
  overflow: hidden

.dl-fill
  display: block
  height: 100%
  background: linear-gradient(#ffe38a, #d4a83e)
  transition: width 160ms linear

.dl-now
  font-weight: 800

.dl-failed
  color: #a93d2e
  font-weight: 800

.dlg-link
  padding: 8px
  border: 0
  background: transparent
  font: inherit
  font-weight: 700
  color: var(--lk-muted)
  text-decoration: underline
  cursor: pointer

.medal
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  width: 70%
  max-width: 240px
  padding: 0
  border: 0
  background: transparent
  font: inherit
  color: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: transform 120ms ease-out

  &:active:not(.closed)
    transform: scale(0.97)

  &.closed
    cursor: default
    opacity: 0.85

.medal-art
  position: relative
  display: block
  width: 100%

  img
    display: block
    width: 100%
    height: auto
    filter: drop-shadow(0 10px 14px rgba(60, 40, 10, 0.45))

.medal-art .medal-cup
  position: absolute
  right: -14%
  bottom: -6%
  width: 40%
  pointer-events: none

.medal-art .medal-lock
  position: absolute
  left: 50%
  top: 50%
  width: 30%
  transform: translate(-50%, -50%)
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35))

.medal-sub
  font-size: 0.9rem
  font-weight: 700
  color: var(--lk-muted)

.medal-progress
  display: flex
  align-items: center
  gap: 8px

.medal-points
  font-size: 0.9rem
  font-weight: 800
  color: var(--lk-text)

@media (prefers-reduced-motion: reduce)
  .dl-fill,
  .medal
    transition: none
</style>
