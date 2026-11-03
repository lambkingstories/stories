<script setup lang="ts">
/**
 * The adventure tab: the journeys as painted medals. Josef is the first; the next ones (Adam and Eve, Noah, and on through the
 * whole Bible) stand there closed until they are written. A tap on a medal opens the map of that journey.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AdvButton from '@/components/atoms/AdvButton.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import AdvDialog from '@/components/molecules/AdvDialog.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import AdventureHero from '@/components/molecules/AdventureHero.vue'
import AdventureTimeline from '@/components/molecules/AdventureTimeline.vue'
import { journeys } from '@/data/adventures'
import { medalThumb, onThumbError } from '@/utils/medalThumb'
import { BIG_GAMES } from '@/data/bigGames'
import { bigGameStates, nextBigGame, totalStars } from '@/utils/bigGames'
import { rewardGames } from '@/utils/rewards'
import { isJourneyPlusLocked } from '@/utils/adventureAccess'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import { groupByEpoch } from '@/data/adventures/timeline'
import useAdventure from '@/use/useAdventure'
import { deleteArtwork, pageArtworkId } from '@/use/useArtworks'
import useJourneyPack from '@/use/useJourneyPack'
import { maxPoints, medalFor, nextStageIndex, pointsOf } from '@/utils/adventureScore'
import { journeyToContinue } from '@/utils/continueJourney'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()

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
      begun,
      /** the adventure comes with LambKing Plus: it is marked in the list, before it is opened */
      plus: isJourneyPlusLocked(j.id)
    }
  })
)

const pack = useJourneyPack()

// the picture at the top: the medals of some adventures lie along the path of the journey (spread over the Bible, as many as exist)
const HERO_IDS = ['adam-eva', 'noah', 'abraham', 'josef', 'mose', 'david', 'weihnachten']
const heroMedals = computed(() => {
  const chosen = HERO_IDS.map((id) => journeys.find((j) => j.id === id)).filter((j): j is (typeof journeys)[number] => !!j)
  const rest = journeys.filter((j) => !chosen.includes(j))
  return [...chosen, ...rest].slice(0, 6).map((j) => j.medal)
})

// the time line of the Bible: one group per epoch, the adventures that are not built stand closed in their place
const groups = computed(() => groupByEpoch(items.value))

// the adventure to go on with: the first one that was begun and is not finished (in the order of the time line)
const goOn = computed(() => {
  const j = journeyToContinue(journeys, adv.progressOf)
  return items.value.find((i) => i.journey.id === j?.id) ?? null
})

// the chip of the epoch that is on the screen is marked (the page is long, the bar shows where the child is)
const activeEpoch = ref('')
let seen: IntersectionObserver | null = null
function observeEpochs() {
  seen?.disconnect()
  if (typeof IntersectionObserver === 'undefined') return
  seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) activeEpoch.value = e.target.id.replace('epoch-', '')
    },
    { rootMargin: '-25% 0px -65% 0px' }
  )
  document.querySelectorAll('.epoch').forEach((el) => seen?.observe(el))
}
onMounted(observeEpochs)
onBeforeUnmount(() => seen?.disconnect())

// two views of the same adventures: the list (the epochs one below the other) and the time line (from left to right, to wipe through); remembered
const VIEW_KEY = 'lk-adventure-view'
type HomeView = 'list' | 'timeline'
function readView(): HomeView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'timeline' ? 'timeline' : 'list'
  } catch {
    return 'list'
  }
}
const view = ref<HomeView>(readView())
const tl = ref<InstanceType<typeof AdventureTimeline> | null>(null)

function setView(v: HomeView) {
  if (view.value === v) return
  view.value = v
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    // not remembered in a private window
  }
  if (v === 'list') void nextTick(observeEpochs)
}

/** How many adventures of an epoch have a cup, for the little count at the head of the epoch. */
const cupsOf = (g: { entries: { item?: { medal: string | null } | null }[] }) => g.entries.filter((e) => e.item?.medal).length

function jumpTo(id: string) {
  if (view.value === 'timeline') {
    tl.value?.scrollToEpoch(id)
    return
  }
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
// the stars that open the big games (the stars of the stages): the bar shows the way to the next game while there is one
const gameStars = computed(() => totalStars(journeys, adv.progressOf))
const nextGame = computed(() => nextBigGame(BIG_GAMES, gameStars.value))
// the tiles: how many mini games and bonus games are open
const miniGames = computed(() => rewardGames(journeys, adv.progressOf))
const miniOpen = computed(() => miniGames.value.filter((g) => g.open).length)
const miniTotal = computed(() => miniGames.value.length)
const bonusOpen = computed(() => bigGameStates(BIG_GAMES, gameStars.value).filter((s) => s.open).length)

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
    header(class="home-banner")
      AdventureHero(:medals="heroMedals")
      div(class="banner-text")
        h1(class="home-title") {{ t('app.nav.abenteuer') }}
    p(class="home-hint") {{ t('app.adventure.introSub') }}

    div(class="home-list")
      //- first what to do next: the adventure to go on with
      button(v-if="goOn" type="button" class="go-on" @click="detailId = goOn.journey.id")
        img(:src="prependBaseUrl(medalThumb(goOn.journey.medal))" alt="" draggable="false" class="go-on-art" @error="(e) => onThumbError(e, prependBaseUrl(goOn?.journey.medal ?? ''))")
        span(class="go-on-body")
          span(class="go-on-kicker") {{ t('app.adventure.continueJourney') }}
          span(class="go-on-title") {{ goOn.journey.title }}
          span(class="go-on-bar" aria-hidden="true")
            span(class="go-on-fill" :style="{ width: Math.round((goOn.doneCount / goOn.total) * 100) + '%' }")
          span(class="go-on-chap") {{ t('app.adventure.chapterOf', { n: Math.min(goOn.doneCount + 1, goOn.total), total: goOn.total }) }}
        span(class="go-on-go" aria-hidden="true")
          ZIconography(name="chevron-right" :size="22")

      //- the stars of all journeys together (journeys that come later count in it, too)
      div(class="stars-card" role="group" :aria-label="nextGame ? t('app.bigGames.nextGame', { game: t(`app.bigGames.${nextGame.game.id}.title`), n: nextGame.missing }) : t('app.home.starsAll', { n: starTotal, max: starMax })")
        img(:src="ui('stern-gold-3')" alt="" class="stars-img" draggable="false")
        span(class="stars-body")
          span(class="stars-title") {{ nextGame ? t('app.bigGames.nextGame', { game: t(`app.bigGames.${nextGame.game.id}.title`), n: nextGame.missing }) : t('app.home.starsTitle') }}
          span(class="stars-bar" aria-hidden="true")
            span(class="stars-fill" :style="{ width: Math.round((nextGame ? nextGame.share : starShare) * 100) + '%' }")
        span(class="stars-count") {{ nextGame ? gameStars : starTotal }} / {{ nextGame ? nextGame.game.at : starMax }}

      //- four square tiles: what the stars give (cards, mini games, bonus games) and the family quiz
      div(class="tiles")
        router-link(:to="{ name: 'app-collection' }" class="tile4")
          img(:src="ui('karte-rueckseite')" alt="" class="tile4-img is-card" draggable="false")
          span(class="tile4-title") {{ t('app.adventure.tileCards') }}
          span(class="tile4-sub") {{ t('app.adventure.tileCardsSub') }}
        router-link(:to="{ name: 'app-gameroom', query: { z: 'mini' } }" class="tile4")
          img(:src="prependBaseUrl('images/icons/spielzimmer-4.webp')" alt="" class="tile4-img" draggable="false")
          span(class="tile4-title") {{ t('app.adventure.tileMini') }}
          span(class="tile4-count") {{ miniOpen }} / {{ miniTotal }}
          span(class="tile4-sub") {{ t('app.adventure.tileMiniSub') }}
        router-link(:to="{ name: 'app-gameroom', query: { z: 'bonus' } }" class="tile4")
          img(:src="ui('stern-gold-3')" alt="" class="tile4-img" draggable="false")
          span(class="tile4-title") {{ t('app.adventure.tileBonus') }}
          span(class="tile4-count") {{ bonusOpen }} / {{ BIG_GAMES.length }}
          span(class="tile4-sub") {{ t('app.adventure.tileBonusSub') }}
        router-link(:to="{ name: 'app-family' }" class="tile4")
          img(:src="prependBaseUrl('images/icons/spiele/symbol-familie.webp')" alt="" class="tile4-img" draggable="false")
          span(class="tile4-title") {{ t('app.family.hubTitle') }}
          span(class="tile4-sub") {{ t('app.adventure.tileFamilySub') }}

      //- the same adventures in two views: the list, or the time line from left to right
      div(class="view-switch" role="group" :aria-label="t('app.adventure.viewLabel')")
        button(type="button" :class="['vs-btn', { 'is-on': view === 'list' }]" :aria-pressed="view === 'list'" @click="setView('list')") {{ t('app.adventure.viewList') }}
        button(type="button" :class="['vs-btn', { 'is-on': view === 'timeline' }]" :aria-pressed="view === 'timeline'" @click="setView('timeline')") {{ t('app.adventure.viewTimeline') }}

      //- the time line of the Bible: a band of epochs to jump to; the one on the screen is marked
      div(class="chips" role="navigation" :aria-label="t('app.adventure.timelineLabel')")
        button(v-for="g in groups" :key="g.epoch.id" type="button" :class="['chip', { 'is-on': activeEpoch === g.epoch.id }]" :aria-current="activeEpoch === g.epoch.id ? 'true' : undefined" @click="jumpTo(g.epoch.id)") {{ g.title }}

      template(v-if="view === 'list'")
        section(v-for="g in groups" :key="g.epoch.id" :id="`epoch-${g.epoch.id}`" class="epoch")
          h2(class="epoch-title")
            span(class="epoch-name") {{ g.title }}
              small(class="epoch-sub") {{ g.sub }}
            span(v-if="cupsOf(g)" class="epoch-cups")
              img(:src="ui('pokal-gold')" alt="" draggable="false")
              | {{ cupsOf(g) }} / {{ g.entries.length }}
          div(class="tile-grid")
            template(v-for="e in g.entries" :key="e.id")
              button(v-if="e.item" type="button" class="tile" @click="detailId = e.item.journey.id")
                span(class="tile-no") {{ e.nr }}
                span(v-if="e.item.plus" class="tile-plus")
                  PlusBadge(size="small")
                span(class="tile-art")
                  img(:src="prependBaseUrl(medalThumb(e.item.journey.medal))" alt="" draggable="false" @error="(ev) => onThumbError(ev, prependBaseUrl(e.item?.journey.medal ?? ''))")
                  img(v-if="e.item.medal" :src="ui(`pokal-${e.item.medal === 'silver' ? 'silber' : e.item.medal}`)" alt="" class="tile-cup" draggable="false")
                span(class="tile-name") {{ e.title }}
                span(v-if="e.item.begun && !e.item.medal" class="tile-bar" aria-hidden="true")
                  span(class="tile-fill" :style="{ width: Math.round((e.item.doneCount / e.item.total) * 100) + '%' }")
                AdventureStars(:stars="e.item.stars" :size="16")
              div(v-else class="tile is-closed")
                span(class="tile-no") {{ e.nr }}
                span(class="tile-art")
                  img(:src="ui('coin-locked')" alt="" draggable="false")
                  img(:src="ui('lock')" alt="" class="tile-lock" draggable="false")
                span(class="tile-name") {{ e.title }}
                span(class="tile-soon") {{ t('app.adventure.soonLabel') }}

    //- the time line: the whole width of the screen
    div(v-if="view === 'timeline'" class="tl-wrap")
      AdventureTimeline(ref="tl" :groups="groups" :current-id="goOn?.journey.id ?? null" @pick="detailId = $event" @epoch="activeEpoch = $event")

    //- the window of one journey
    AdvDialog(v-if="detail" :title="detail.journey.title" @close="detailId = ''")
      div(class="journey")
        span(class="medal-art")
          img(:src="prependBaseUrl(detail.journey.medal)" alt="" draggable="false")
          img(v-if="detail.medal" :src="ui(`pokal-${detail.medal === 'silver' ? 'silber' : detail.medal}`)" alt="" class="medal-cup" draggable="false")
        p(v-if="detail.plus" class="journey-plus")
          PlusBadge
          span {{ t('app.adventure.plusBadgeLabel') }}
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

.home-banner
  position: relative
  max-width: 560px
  margin: 4px auto 0
  border-radius: 24px
  overflow: hidden
  box-shadow: 0 10px 28px rgba(20, 40, 60, .18)
  // the page keeps its side gutters on narrow screens
  width: calc(100% - 32px)

.banner-text
  position: absolute
  left: 0
  bottom: 0
  padding: 26px 40px 12px 16px
  color: #fff
  background: radial-gradient(ellipse at 0% 100%, rgba(10, 25, 40, .62), rgba(10, 25, 40, 0) 72%)

.home-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.1
  text-shadow: 0 1px 6px rgba(0, 0, 0, .35)

.home-hint
  max-width: 560px
  margin: 10px auto 0
  padding: 0 20px
  text-align: center
  font-size: 0.98rem
  line-height: 1.4
  color: var(--lk-muted)

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

.quiz-card
  display: flex
  align-items: center
  gap: 14px
  padding: 12px 18px 12px 12px
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  text-decoration: none
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

.quiz-img
  flex: 0 0 auto
  height: 44px
  width: auto
  display: block

.quiz-body
  display: flex
  flex-direction: column
  gap: 2px

.quiz-title
  font-weight: 800
  font-size: 1.05rem

.quiz-sub
  color: var(--lk-muted)
  font-size: 0.88rem

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

// two big medals next to each other on a phone, three on a wider screen
.tile-grid
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr))
  gap: 12px

.tile-bar
  display: block
  width: 70%
  height: 6px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.tile-fill
  display: block
  height: 100%
  border-radius: 999px
  background: #c9962a

.tile-name
  padding: 0 8px
  font-weight: 800
  font-size: 0.98rem
  line-height: 1.2

// four square tiles
.tiles
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

.tile4
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 3px
  aspect-ratio: 1 / 1
  padding: 12px 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  text-align: center
  text-decoration: none
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

.tile4-img
  width: 60px
  height: 60px
  margin-bottom: 4px
  object-fit: contain

.tile4-img.is-card
  width: auto
  height: 60px
  border-radius: 5px

.tile4-title
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.15

.tile4-count
  font-size: 0.9rem
  font-weight: 800
  color: var(--lk-accent)

.tile4-sub
  font-size: 0.82rem
  line-height: 1.3
  color: var(--lk-muted)


.go-on-go
  flex: none
  display: grid
  place-items: center
  width: 40px
  height: 40px
  border-radius: 50%
  background: #c9962a
  color: #fff

.view-switch
  align-self: center
  display: inline-flex
  padding: 4px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.vs-btn
  min-width: 112px
  padding: 9px 18px
  border: 0
  border-radius: 999px
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-size: 0.95rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: background 160ms ease-out, color 160ms ease-out

  &.is-on
    background: var(--lk-accent)
    color: var(--lk-on-accent)

.tl-wrap
  margin-top: 6px

.chip.is-on
  background: var(--lk-accent)
  border-color: var(--lk-accent)
  color: var(--lk-on-accent)

.epoch-title
  display: flex
  align-items: baseline
  justify-content: space-between
  gap: 10px

.epoch-cups
  display: inline-flex
  align-items: center
  gap: 4px
  flex: none
  font-size: 0.85rem
  font-weight: 800
  color: var(--lk-muted)

  img
    width: 20px
    height: 20px
    object-fit: contain

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

.tile-plus
  position: absolute
  right: 6px
  top: 6px
  z-index: 1

.journey-plus
  margin: 0
  display: flex
  align-items: center
  gap: 8px
  color: var(--lk-muted)
  font-size: 0.9rem
  font-weight: 700

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
