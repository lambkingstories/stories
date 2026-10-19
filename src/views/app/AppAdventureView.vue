<script setup lang="ts">
/**
 * The map of one journey: painted pictures side by side that scroll sideways. It starts at the left and winds from stage to stage
 * along a dotted path; behind every stage the place where it happens. All pictures (landscape, round scenes, plates, stars, cups)
 * were painted by the image model; the code only lays them out and puts the names on them. Coming back from a finished stage the
 * map first shows that stage and then slides on to the next one.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import SoundPanel from '@/components/molecules/SoundPanel.vue'
import { journeyById, journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { isExamOpen, isStageOpen, maxPoints, medalFor, nextStageIndex, pointsOf, stageStarsOf } from '@/utils/adventureScore'
import useButtonSounds from '@/use/useButtonSounds'
import { clearViaStats } from '@/utils/adventureStats'
import useMusic from '@/use/useMusic'
import useSfx from '@/use/useSfx'
import { prependBaseUrl } from '@/utils/function'
import type { MapSpot } from '@/types/adventure'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const adv = useAdventure()
const { play, preload, stopAll } = useSfx()
// the soft map music (switched off with the speaker switch)
useButtonSounds()
const music = useMusic()
onMounted(() => music.playMap(journey.value.music))
onBeforeUnmount(() => music.stop('map'))

const journey = computed(() => journeyById(String(route.params.journeyId)) ?? journeys[0]!)
const progress = computed(() => adv.progressOf(journey.value.id))
const next = computed(() => nextStageIndex(journey.value, progress.value))
const points = computed(() => pointsOf(progress.value))
const max = computed(() => maxPoints(journey.value))
const examOpen = computed(() => isExamOpen(journey.value, progress.value))
const medal = computed(() => (progress.value?.exam ? medalFor(points.value, max.value) : null))

const img = (path: string) => prependBaseUrl(path)
const ui = (name: string) => img(`images/abenteuer/ui/${name}.webp`)
const plate = (name: string) => `url(${ui(`plakette-${name}`)})`

/** A journey whose map is not painted yet (the preview of Noah) shows a plain list of its stages instead. */
const hasMap = computed(() => journey.value.map.images.length > 0)
/** In the list every stage that is ready can be opened (the preview has no way through the first stage). */
const listOpen = (i: number) => !journey.value.stages[i]?.soon
function openFromList(i: number) {
  const s = journey.value.stages[i]
  if (!s || s.soon) return
  void router.push({ name: 'app-adventure-stage', params: { journeyId: journey.value.id, stageId: String(s.id) } })
}

const stageStars = (id: number) => stageStarsOf(progress.value?.stages[id])
const stageDone = (id: number) => !!progress.value?.stages[id]?.done

/**
 * The beads of the dotted path light up as the stages are finished: the stretch after stage `k + 1` shines once that stage is done.
 * Coming back from a stage (`?from=`) the stretch it opened lights up bead by bead, running on to the next stage.
 */
const runSegment = computed(() => {
  const from = Number(route.query.from)
  return Number.isFinite(from) && from >= 1 && from <= journey.value.stages.length && stageDone(from) ? from - 1 : -1
})
const segmentLit = (k: number) => stageDone(k + 1)
/**
 * Coming back from a stage (finished, or played again): the stars it earned light up one after the other once more at its station, one tone for
 * each ("ding, ding, ding"), as on the result page. A stage without stars lights nothing. With reduced motion the stars only appear (and sound).
 */
const celebrateId = computed(() => {
  const from = Number(route.query.from)
  const at = Number(route.query.at)
  const id = Number.isFinite(from) && from >= 1 ? from : Number.isFinite(at) && at >= 1 ? at : 0
  return id >= 1 && id <= journey.value.stages.length && stageDone(id) && stageStars(id) > 0 ? id : 0
})
const beadStyle = (b: [number, number], i: number) => ({ left: `calc(var(--w) * ${b[0]})`, top: `calc(var(--h) * ${b[1]})`, '--i': String(i) })

/** The map spot of the stage with this index. */
const spotOf = (i: number): MapSpot => journey.value.map.stages[i] ?? journey.value.map.exam

/** Where a spot sits on its tile, as percentages, and how big its round picture is. */
const spotStyle = (s: MapSpot) => ({ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.d * 100}%` })

/** Each piece of the map picture is a few pixels wider than its share (4 px of the whole width), so that the pieces overlap. */
const pieceLap = computed(() => 1 / Math.max(1, journey.value.map.images.length) + 4 / (journey.value.map.widthPx ?? 9824))

function openStage(i: number) {
  const s = journey.value.stages[i]
  if (!s || !isStageOpen(journey.value, progress.value, i)) return
  void router.push({ name: 'app-adventure-stage', params: { journeyId: journey.value.id, stageId: String(s.id) } })
}

function openStats() {
  void router.push({ name: 'app-adventure-stats', params: { journeyId: journey.value.id } })
}

function openExam() {
  if (!examOpen.value) return
  void router.push({ name: 'app-adventure-stage', params: { journeyId: journey.value.id, stageId: 'pruefung' } })
}

function toJourneys() {
  void router.push({ name: 'app-adventure' })
}

// ── Scrolling to where the child is -------------------------------------------------------

const scroller = ref<HTMLElement | null>(null)

/** The scroll position that puts a spot in the middle of the screen. */
function leftFor(spot: MapSpot): number {
  const el = scroller.value
  const strip = el?.querySelector<HTMLElement>('.map-strip')
  if (!el || !strip) return 0
  return Math.max(0, strip.offsetWidth * spot.x - el.clientWidth / 2)
}

/** Slides the map to a position (an eased move over about a second; the same on every browser). */
let slideFrame = 0
function slideTo(el: HTMLElement, left: number, ms = 1100) {
  const start = el.scrollLeft
  const dist = left - start
  if (!dist) return
  const t0 = performance.now()
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms)
    el.scrollLeft = start + dist * ease(k)
    slideFrame = k < 1 ? requestAnimationFrame(step) : 0
  }
  slideFrame = requestAnimationFrame(step)
}

/**
 * While the way runs (the stars ring, the light runs along the beads, the camera slides on to the next stage) the map cannot be moved by
 * hand: a finger and the sliding camera would pull against each other and the picture would jump. Free again when the way has arrived.
 * `roadGo` starts the light and the camera: it comes true when the last star tone has rung out.
 */
const locked = ref(false)
const roadGo = ref(false)
const roadTimers: number[] = []
const later = (fn: () => void, ms: number) => {
  roadTimers.push(window.setTimeout(fn, ms))
}
/** The longest the map stays locked, whatever happens (a lock must never be for ever). */
const LOCK_MAX_MS = 14000
onBeforeUnmount(() => {
  roadTimers.forEach((id) => window.clearTimeout(id))
  roadTimers.length = 0
  if (slideFrame) cancelAnimationFrame(slideFrame)
  locked.value = false
})

/** The way of the stage that was just finished: the coin rings at once, then a tick for every bead that lights up, and the camera follows the light. */
const BEAD_FIRST_MS = 250
function startRoad(el: HTMLElement, from: number, target: MapSpot) {
  if (roadGo.value) return
  roadGo.value = true
  const beads = journey.value.map.path[from - 1]?.length ?? 12
  const slideMs = Math.min(2600, 800 + beads * 85)
  play('coin')
  for (let i = 0; i < beads; i++) later(() => play('bead'), i * 95 + BEAD_FIRST_MS + 80)
  later(() => slideTo(el, leftFor(target), slideMs), BEAD_FIRST_MS)
  // free again when the camera has arrived and the last bead has lit up
  later(() => (locked.value = false), Math.max(BEAD_FIRST_MS + slideMs, (beads - 1) * 95 + BEAD_FIRST_MS + 700) + 100)
}
/** The stars of the stage have rung out (or there are none): the way starts. */
let onStarsSounded: () => void = () => undefined
function starsSounded() {
  onStarsSounded()
}

onMounted(async () => {
  clearViaStats()
  await nextTick()
  const el = scroller.value
  if (!el) return
  const target = next.value !== null ? spotOf(next.value) : journey.value.map.exam
  const from = Number(route.query.from)
  const at = Number(route.query.at)
  if (!(Number.isFinite(from) && from >= 1) && Number.isFinite(at) && at >= 1 && at <= journey.value.stages.length) {
    // back from a stage that was played again (or left): the map stays at that stage, nothing lights up, nothing slides
    el.scrollLeft = leftFor(spotOf(at - 1))
  } else if (Number.isFinite(from) && from >= 1 && from <= journey.value.stages.length) {
    // coming back from a stage finished for the first time: stand at that stage, then slide on to the next one
    el.scrollLeft = leftFor(spotOf(from - 1))
    // what still rings from the page we come from is stopped; the stars of the stage ring first (one tone each, no fanfare on top), and
    // when the last tone has rung out the way starts: the coin, the beads, the camera. The map is locked until it has arrived.
    stopAll()
    preload(['star', 'coin', 'bead'])
    locked.value = true
    onStarsSounded = () => startRoad(el, from, target)
    later(() => (locked.value = false), LOCK_MAX_MS)
    // a stage without stars rings nothing: the way starts after a short moment
    if (celebrateId.value !== from) later(starsSounded, 300)
  } else {
    el.scrollLeft = leftFor(target)
  }
})
</script>

<template lang="pug">
  div(class="map-page" :style="{ '--paper': `url(${ui('papier')})` }")
    header(class="map-top")
      button(type="button" class="map-back lk-btn lk-btn--small" :aria-label="t('app.adventure.backToJourneys')" @click="toJourneys")
        ZIconography(name="chevron-left" :size="20")
        span {{ t('app.read.back') }}
      span(class="map-title") {{ journey.title }}
      SoundPanel(class="map-sound")
      div(class="map-points")
        img(:src="ui('stern-gold-1')" alt="" draggable="false")
        span {{ t('app.adventure.pointsShort', { n: points, max }) }}

    //- no painted map yet: the stages as a list (the preview of a journey that is still being made)
    div(v-if="!hasMap" class="map-list")
      p(class="list-note") {{ t('app.adventure.previewNote') }}
      ul(class="list-stages")
        li(v-for="(s, i) in journey.stages" :key="s.id")
          button(
            type="button"
            class="list-item"
            :class="{ soon: s.soon, done: stageDone(s.id) }"
            :disabled="!listOpen(i)"
            :aria-label="`${t('app.adventure.stageOf', { n: s.id, total: journey.stages.length })}: ${s.title}`"
            @click="openFromList(i)"
          )
            span(class="list-coin" :style="{ backgroundImage: `url(${ui('coin')})` }") {{ s.id }}
            span(class="list-text")
              span(class="list-title") {{ s.soon ? t('app.adventure.stageListSoonTitle', { n: s.id }) : s.title }}
              span(v-if="!s.soon" class="list-ref") {{ s.ref }}
            span(v-if="s.soon" class="list-soon") {{ t('app.adventure.stageListSoon') }}
            AdventureStars(v-else-if="stageDone(s.id)" :stars="stageStars(s.id)" :size="22")
            ZIconography(v-else name="chevron-right" :size="22")

    div(v-else ref="scroller" class="map-scroll" :class="{ locked }")
      div(class="map-strip" :style="{ '--aspect': String(journey.map.aspect) }")
        //- the map picture in pieces, side by side (each a little wider than its share, so that no hairline shows between them)
        img(
          v-for="(piece, pi) in journey.map.images"
          :key="piece"
          :src="img(piece)"
          alt=""
          class="map-art"
          :style="{ left: `${(pi / journey.map.images.length) * 100}%`, width: `${(pi < journey.map.images.length - 1 ? pieceLap : 1 / journey.map.images.length) * 100}%` }"
          draggable="false"
          decoding="async"
        )

        //- the dotted way between the stations: its beads shine for the stages that are finished
        div(class="map-beads" aria-hidden="true")
          template(v-for="(seg, k) in journey.map.path" :key="k")
            span(
              v-for="(b, i) in seg"
              :key="`${k}-${i}`"
              class="bead"
              :class="{ lit: segmentLit(k), run: k === runSegment, go: k === runSegment && roadGo }"
              :style="beadStyle(b, i)"
            )

        //- the stages: our own picture of the stage lies in the gold ring of its place on the map
        div(
          v-for="(s, i) in journey.stages"
          :key="s.id"
          class="map-spot"
          :class="{ open: isStageOpen(journey, progress, i), done: stageDone(s.id), current: i === next }"
          :style="spotStyle(spotOf(i))"
        )
          span(class="spot-pic" :style="{ backgroundImage: `url(${img(s.image ?? '')})` }")
          img(:src="img(journey.map.ring)" alt="" class="spot-ring" draggable="false")
          button(
            type="button"
            class="spot-hit"
            :disabled="!isStageOpen(journey, progress, i)"
            :aria-label="`${t('app.adventure.stageOf', { n: s.id, total: journey.stages.length })}: ${s.title}`"
            @click="openStage(i)"
          )
            span(class="spot-fog")
            img(v-if="!isStageOpen(journey, progress, i)" :src="ui('lock')" alt="" class="spot-lock" draggable="false")
          span(class="spot-coin" :style="{ backgroundImage: `url(${ui('coin')})` }") {{ s.id }}
          img(v-if="stageDone(s.id)" :src="ui('check')" alt="" class="spot-check" draggable="false")
          //- under the picture: the name, and the stars or the way on
          div(class="spot-below")
            span(class="spot-name") {{ s.soon ? t('app.adventure.stageListSoonTitle', { n: s.id }) : s.title }}
            span(v-if="s.soon" class="spot-soon") {{ t('app.adventure.stageListSoon') }}
            AdventureStars(v-else-if="stageDone(s.id)" :stars="stageStars(s.id)" :size="24" :celebrate="s.id === celebrateId" :fanfare="false" class="spot-stars" @sounded="s.id === celebrateId && starsSounded()")
            button(v-else-if="i === next" type="button" class="spot-go lk-btn lk-btn--small" @click="openStage(i)") {{ t('app.adventure.continue') }}

        //- the exam at the end of the way
        div(
          class="map-spot exam"
          :class="{ open: examOpen, done: !!progress?.exam, current: examOpen && !progress?.exam }"
          :style="spotStyle(journey.map.exam)"
        )
          span(class="spot-pic spot-pic-exam" :style="{ backgroundImage: `url(${ui('pokal-gold')})` }")
          img(:src="img(journey.map.ring)" alt="" class="spot-ring" draggable="false")
          button(type="button" class="spot-hit" :disabled="!examOpen" :aria-label="t('app.adventure.exam')" @click="openExam")
            span(class="spot-fog")
            img(v-if="!examOpen" :src="ui('lock')" alt="" class="spot-lock" draggable="false")
          div(class="spot-below")
            span(class="spot-name") {{ t('app.adventure.exam') }}
            button(v-if="examOpen && !progress?.exam" type="button" class="spot-go lk-btn lk-btn--small" @click="openExam") {{ t('app.adventure.continue') }}
          //- the cup over the last station: a tap opens the statistics (at any time, also later)
          button(v-if="medal" type="button" class="spot-cup" :class="`cup-${medal}`" :aria-label="t('app.adventure.statsOpen')" @click="openStats")
            img(:src="ui(`pokal-${medal === 'silver' ? 'silber' : medal}`)" alt="" draggable="false")
</template>

<style scoped lang="sass">
$ink: #3b2a12

.map-page
  position: relative
  min-height: 100vh
  height: 100svh
  background: var(--lk-bg)
  overflow: hidden

// the title, the back arrow and the points lie above the picture
.map-top
  position: absolute
  z-index: 5
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(env(safe-area-inset-top, 0px), 8px) 10px 0
  pointer-events: none

.map-sound
  flex: 0 0 auto

.map-back
  flex: 0 0 auto
  pointer-events: auto
  gap: 4px
  padding: 0 16px 0 8px
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.4)

  :deep(.z-icon-outline)
    color: currentColor

// the name of the journey
.map-title
  align-self: center
  max-width: 40vw
  padding: 10px 18px
  border-radius: 28px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  color: var(--lk-text)
  font-weight: 800
  font-size: 1.05rem
  line-height: 1.1
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.35)

// the stars collected, small and in one line
.map-points
  display: inline-flex
  flex-wrap: nowrap
  align-items: center
  gap: 4px
  margin: 6px 0 0 auto
  padding: 3px 10px 3px 6px
  border-radius: 999px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25)
  white-space: nowrap

  img
    flex: 0 0 auto
    width: 16px
    height: 16px
    object-fit: contain

  span
    font-weight: 800
    font-size: 0.85rem
    line-height: 1
    color: var(--lk-text)

// the list of stages (a journey without a painted map)
.map-list
  position: absolute
  inset: 0
  overflow-y: auto
  padding: calc(max(env(safe-area-inset-top, 0px), 8px) + 64px) 16px calc(120px + env(safe-area-inset-bottom, 0px))
  -webkit-overflow-scrolling: touch

.list-note
  margin: 0 auto 14px
  max-width: 560px
  font-size: 0.95rem
  font-weight: 600
  color: var(--lk-muted)

.list-stages
  list-style: none
  margin: 0 auto
  padding: 0
  max-width: 560px
  display: flex
  flex-direction: column
  gap: 10px

.list-item
  display: flex
  align-items: center
  gap: 12px
  width: 100%
  min-height: 64px
  padding: 8px 14px 8px 10px
  border-radius: 18px
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  color: var(--lk-text)
  text-align: left
  cursor: pointer
  box-shadow: 0 3px 10px -5px rgba(0, 0, 0, 0.35)

  &.soon
    opacity: 0.6
    cursor: default

.list-coin
  flex: 0 0 auto
  display: inline-flex
  align-items: center
  justify-content: center
  width: 44px
  height: 44px
  background-size: contain
  background-repeat: no-repeat
  background-position: center
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1.1rem
  color: #4a3208

.list-text
  flex: 1 1 auto
  display: flex
  flex-direction: column
  min-width: 0

.list-title
  font-weight: 800
  font-size: 1.05rem
  line-height: 1.2

.list-ref
  font-size: 1rem
  color: var(--lk-muted)

.list-soon
  flex: 0 0 auto
  padding: 2px 12px
  border-radius: 999px
  background: rgba(120, 90, 30, 0.15)
  font-weight: 800
  font-size: 1rem

// the map: a strip of tiles, as high as the screen allows, scrolling sideways (no filters or masks on it: they make it jerky)
.map-scroll
  --h: max(320px, 100svh)
  // the size of the signs on the map (coins, names, stars): they stay the size they had when the map was a little smaller
  --u: calc(var(--h) * 0.66)
  position: absolute
  inset: 0
  display: flex
  align-items: flex-start
  overflow-x: auto
  overflow-y: hidden
  overscroll-behavior-x: contain
  -webkit-overflow-scrolling: touch
  scrollbar-width: none
  box-sizing: border-box
  touch-action: pan-x
  will-change: scroll-position

  &::-webkit-scrollbar
    display: none

  // the way is running: no panning by hand (finger and camera would pull against each other)
  &.locked
    overflow-x: hidden
    touch-action: none

.map-strip
  --w: calc(var(--h) * var(--aspect, 4.6767))
  position: relative
  flex: 0 0 auto
  width: var(--w)
  height: var(--h)

.map-art
  position: absolute
  top: 0
  display: block
  height: 100%
  user-select: none
  -webkit-user-drag: none
  pointer-events: none

// the dotted way: small beads on the roads of the painting; the finished stretches shine
.map-beads
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 2

.bead
  position: absolute
  width: calc(var(--w) * 0.0036)
  height: calc(var(--w) * 0.0036)
  margin: calc(var(--w) * -0.0018) 0 0 calc(var(--w) * -0.0018)
  border-radius: 50%
  background: rgba(255, 250, 235, 0.82)
  box-shadow: 0 0 0 calc(var(--w) * 0.0005) rgba(96, 64, 22, 0.55)

  &.lit
    background: radial-gradient(circle, #fffbe0 0%, #ffdf70 55%, #f0b030 100%)
    box-shadow: 0 0 calc(var(--w) * 0.003) calc(var(--w) * 0.0012) rgba(255, 205, 70, 0.75), 0 0 0 calc(var(--w) * 0.0005) rgba(150, 100, 20, 0.7)

  // the stretch that has just been opened: one bead after the other flashes and stays lit
  &.run
    background: rgba(255, 250, 235, 0.82)
    box-shadow: 0 0 0 calc(var(--w) * 0.0005) rgba(96, 64, 22, 0.55)

  // the light starts when the last star tone has rung out
  &.run.go
    animation: bead-run 700ms ease-out both
    animation-delay: calc(var(--i) * 95ms + 250ms)

@keyframes bead-run
  0%
    transform: scale(0.6)
    background: rgba(255, 250, 235, 0.82)
  35%
    transform: scale(2.2)
    background: #fff6b0
    box-shadow: 0 0 calc(var(--w) * 0.006) calc(var(--w) * 0.003) rgba(255, 210, 80, 0.95)
  100%
    transform: scale(1)
    background: radial-gradient(circle, #fffbe0 0%, #ffdf70 55%, #f0b030 100%)
    box-shadow: 0 0 calc(var(--w) * 0.003) calc(var(--w) * 0.0012) rgba(255, 205, 70, 0.75), 0 0 0 calc(var(--w) * 0.0005) rgba(150, 100, 20, 0.7)

@media (prefers-reduced-motion: reduce)
  .bead.run.go
    animation: none
    background: radial-gradient(circle, #fffbe0 0%, #ffdf70 55%, #f0b030 100%)

// a stage: a round picture in the painting that can be tapped
.map-spot
  position: absolute
  aspect-ratio: 1
  transform: translate(-50%, -50%)

.spot-pic
  position: absolute
  // the free middle of the ring is 440 of its 512 px
  inset: 7.03%
  border-radius: 50%
  background: center / cover no-repeat
  pointer-events: none

// the picture of the exam is the cup, not a photo of a scene
.spot-pic-exam
  background-color: #fbe9b8
  background-size: 70%
  background-position: center 55%

// the empty gold ring (a painted picture) over the round picture
.spot-ring
  position: absolute
  inset: 0
  display: block
  width: 100%
  height: 100%
  pointer-events: none
  filter: drop-shadow(0 3px 5px rgba(60, 40, 10, 0.4))

.spot-hit
  position: absolute
  inset: 0
  border: 0
  border-radius: 50%
  padding: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:disabled
    cursor: default

// a closed stage lies in a light haze with a padlock
.spot-fog
  position: absolute
  inset: 0
  border-radius: 50%
  opacity: 0
  background: rgba(243, 230, 196, 0.78)

.map-spot:not(.open) .spot-fog
  opacity: 1

.spot-lock
  position: absolute
  left: 50%
  top: 50%
  width: calc(var(--u) * 0.05)
  transform: translate(-50%, -50%)
  pointer-events: none

.spot-coin
  position: absolute
  left: -6%
  top: -6%
  width: calc(var(--u) * 0.07)
  aspect-ratio: 1
  display: grid
  place-items: center
  background: center / contain no-repeat
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: calc(var(--u) * 0.037)
  color: #4a3208
  pointer-events: none

.spot-check
  position: absolute
  right: -4%
  top: -4%
  width: calc(var(--u) * 0.05)
  pointer-events: none

// under the picture: the name of the stage on a flat painted plate, below it the stars or the button that goes on
.spot-below
  position: absolute
  left: 50%
  top: 95%
  display: flex
  flex-direction: column
  align-items: center
  gap: calc(var(--u) * 0.008)
  transform: translateX(-50%)
  pointer-events: none

.spot-stars
  filter: drop-shadow(0 2px 3px rgba(60, 40, 10, 0.45))

.spot-go
  pointer-events: auto
  white-space: nowrap
  animation: spot-bob 1.8s ease-in-out infinite

// "soon" under the name of a stage that is not ready
.spot-soon
  padding: 0 calc(var(--u) * 0.04)
  border-radius: 999px
  background: rgba(255, 246, 215, 0.92)
  color: #5f4f35
  font-weight: 800
  font-size: calc(var(--u) * 0.032)

// the name of a stage under its round picture
.spot-name
  display: block
  width: max-content
  max-width: calc(var(--u) * 0.9)
  padding: calc(var(--u) * 0.014) calc(var(--u) * 0.045)
  border-radius: calc(var(--u) * 0.04)
  white-space: nowrap
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  color: var(--lk-text)
  font-weight: 800
  // never smaller than 16 px, however small the map is shown
  font-size: max(16px, calc(var(--u) * 0.028))
  line-height: 1.15
  text-align: center
  box-shadow: 0 3px 10px -3px rgba(0, 0, 0, 0.4)

.spot-cup
  position: absolute
  left: 50%
  transform: translateX(-50%)
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.cup-bronze
    top: -34%
    width: 30%

  &.cup-silber, &.cup-silver
    top: -44%
    width: 38%

  &.cup-gold
    top: -64%
    width: 52%

@keyframes spot-bob
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-4px)

@media (prefers-reduced-motion: reduce)
  .spot-go
    animation: none
</style>
