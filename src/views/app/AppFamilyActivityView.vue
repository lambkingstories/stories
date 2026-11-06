<script setup lang="ts">
/**
 * The family activity (Plus), on the old map: one device in the middle, two to four teams take turns. One person of the team sees a word
 * from the adventures on a bronze medallion and shows it (explain, draw on paper, act out); the team guesses until the sand has run out.
 * A point for every word that was guessed. Everything runs on the device; the words are in `data/activityWords.ts`.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapMedallion from '@/components/molecules/map/MapMedallion.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapSeats from '@/components/molecules/map/MapSeats.vue'
import MapScoreBar from '@/components/molecules/map/MapScoreBar.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useSfx from '@/use/useSfx'
import useFamilySave from '@/use/useFamilySave'
import { prependBaseUrl } from '@/utils/function'
import { ranking } from '@/utils/familyQuiz'
import {
  ACTIVITY_KINDS,
  ACTIVITY_MODES,
  CARD_CHOICES,
  SECOND_CHOICES,
  buildDeck,
  clearPaintHandoff,
  loadPaintHandoff,
  paintFitsSnap,
  readActivitySnap,
  teamOnTurn,
  wordsFor,
  writePaintHandoff,
  type ActivityCard,
  type ActivityKind,
  type ActivityMode,
  type ActivitySnap
} from '@/utils/familyActivity'
import type { ActivityLocale } from '@/data/activityWords'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const { play } = useSfx()
const hourglass = prependBaseUrl('images/familie/karte/sanduhr.webp')
const hideImg = (e: Event) => ((e.target as HTMLElement).style.display = 'none')

const save = useFamilySave<ActivitySnap>('activity', 1)

/** In the game the back button leads to the start page of this game (where a new round can begin); from there to the main menu. */
function goBack() {
  if (phase.value === 'setup') {
    void router.push({ name: 'app-family' })
    return
  }
  stopTimer()
  painted.value = false
  phase.value = 'setup'
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

// ── how big the medallion can be (it follows the screen, upright or sideways) ───────────────────────────────────
const box = reactive({ w: 390, h: 800 })
function measure() {
  box.w = window.innerWidth
  box.h = window.innerHeight
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
const wide = computed(() => box.w > box.h)
const medal = computed(() => Math.round(wide.value ? Math.min(box.h - 150, box.w * 0.4, 330) : Math.min(box.w - 60, box.h * 0.36, 310)))

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const teamCount = ref<number>(2)
const cardsEach = ref<number>(5)
const seconds = ref<number>(60)
const kind = ref<ActivityKind>('all')
const modes = reactive<Record<ActivityMode, boolean>>({ explain: true, draw: true, act: true })
const teamNames = ref<string[]>(['', '', '', ''])
const KINDS = ACTIVITY_KINDS

const nameOf = (i: number) => teamNames.value[i]?.trim() || t('app.family.team', { n: i + 1 })
const names = computed(() => Array.from({ length: teamCount.value }, (_, i) => nameOf(i)))
const allowed = computed(() => ACTIVITY_MODES.filter((m) => modes[m]))
const words = computed(() => wordsFor(kind.value, lang.value))
/** The cards are as many as asked for, but never more than there are words. */
const totalCards = computed(() => Math.min(cardsEach.value * teamCount.value, words.value.length))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'card' | 'result'
const phase = ref<Phase>('setup')
const deck = ref<ActivityCard[]>([])
const index = ref(0)
const scores = ref<number[]>([])
const left = ref(0)
let deadline = 0
let timer: ReturnType<typeof setInterval> | undefined

const card = computed(() => deck.value[index.value])
const team = computed(() => teamOnTurn(index.value, teamCount.value))
const teamName = computed(() => names.value[team.value] ?? '')
const isLast = computed(() => index.value >= deck.value.length - 1)
/** The word was painted in the painting program: the card is back with the time over (or "Done" pressed) and asks who guessed it. */
const painted = ref(false)
const paintedOver = ref(false)
const timeUp = computed(() => phase.value === 'card' && (painted.value ? paintedOver.value : left.value <= 0))
const placing = computed(() => ranking(names.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
/** The same order as `ranking` (it sorts stably), so every place knows which team (which token) it is. */
const placeIndex = computed(() =>
  names.value
    .map((_, i) => i)
    .sort((a, b) => (scores.value[b] ?? 0) - (scores.value[a] ?? 0))
)
const resultRows = computed(() => placing.value.map((p, i) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: placeIndex.value[i] ?? i })))
const winnerIndex = computed(() => placeIndex.value[0] ?? 0)
const bar = computed(() => names.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: phase.value !== 'setup' && phase.value !== 'result' && i === team.value })))

const wordSize = computed(() => {
  const n = card.value?.word.length ?? 0
  return n <= 7 ? 3 : n <= 12 ? 2.4 : n <= 18 ? 1.9 : 1.55
})

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = undefined
}
onBeforeUnmount(stopTimer)

/** The state to keep: always the hand-over of the card that is on turn (a running word starts again with full time after "keep playing"). */
function keep() {
  save.save({
    teamCount: teamCount.value,
    cardsEach: cardsEach.value,
    seconds: seconds.value,
    kind: kind.value,
    modes: allowed.value,
    teamNames: teamNames.value.slice(),
    deck: deck.value.map((c) => ({ word: c.word, mode: c.mode })),
    index: index.value,
    scores: scores.value.slice(0, teamCount.value)
  })
}

/** What is kept, if it has the right shape; a broken or old entry is thrown away. */
const resumable = computed(() => readActivitySnap(save.saved.value))
if (save.saved.value && !readActivitySnap(save.saved.value)) save.clear()

function resume(): boolean {
  const s = resumable.value
  if (!s) return false
  stopTimer()
  painted.value = false
  teamCount.value = s.teamCount
  cardsEach.value = s.cardsEach
  seconds.value = s.seconds
  kind.value = s.kind
  for (const m of ACTIVITY_MODES) modes[m] = s.modes.includes(m)
  teamNames.value = s.teamNames.slice()
  deck.value = s.deck.map((c) => ({ ...c }))
  index.value = s.index
  scores.value = s.scores.slice()
  left.value = 0
  phase.value = 'handover'
  return true
}
const resumeInfo = computed(() => (resumable.value ? t('app.activity.cardOf', { n: resumable.value.index + 1, total: resumable.value.deck.length }) : ''))

function start() {
  if (totalCards.value < 1 || !allowed.value.length) return
  painted.value = false
  deck.value = buildDeck(words.value, totalCards.value, allowed.value)
  scores.value = Array.from({ length: teamCount.value }, () => 0)
  index.value = 0
  keep()
  phase.value = 'handover'
}

/**
 * A card whose way is "paint" goes straight to the painting program (blank sheet, the word and the sand in a band on top); the others
 * look at the word on the medallion. What is kept is the hand-over of this card, so the round comes back to the same card.
 */
function paintCard(c: ActivityCard): boolean {
  keep()
  stopTimer()
  const ok = writePaintHandoff({ word: c.word, seconds: seconds.value, startedAt: Date.now(), index: index.value })
  if (!ok) return false
  void play('cardTurn')
  void router.push({ name: 'app-coloring', query: { activity: '1' } })
  return true
}

/**
 * Back from the painting program (its address says `from=paint`, or the browser went back to this page while a word was being
 * painted): the same card asks "who guessed it?" at once. Points, cards and teams are those of the kept round, so nothing is counted twice.
 */
function returnFromPaint() {
  const h = loadPaintHandoff()
  const asked = route.query.from === 'paint'
  clearPaintHandoff()
  if (asked) void router.replace({ name: 'app-family-activity' })
  const s = resumable.value
  if (!s || !(h ? paintFitsSnap(h, s) : asked)) return
  if (!resume()) return
  paintedOver.value = h ? Date.now() >= h.startedAt + h.seconds * 1000 : true
  painted.value = true
  phase.value = 'card'
}

/** The card is shown and the time runs (by the clock, so it stays right when the screen sleeps a moment). */
function showCard() {
  if (card.value?.mode === 'draw' && paintCard(card.value)) return
  painted.value = false
  left.value = seconds.value
  deadline = Date.now() + seconds.value * 1000
  stopTimer()
  timer = setInterval(() => {
    left.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (left.value <= 0) stopTimer()
  }, 250)
  void play('cardTurn')
  phase.value = 'card'
}

watch(timeUp, (up) => {
  if (up && !painted.value) void play('clunk')
})

/** `guessedBy` is the team that guessed the word (any team may guess, the point goes to it), or `null` when nobody did. */
function answer(guessedBy: number | null) {
  stopTimer()
  painted.value = false
  if (guessedBy !== null) {
    scores.value[guessedBy] = (scores.value[guessedBy] ?? 0) + 1
    void play('familyRight')
  }
  if (isLast.value) {
    save.clear()
    phase.value = 'result'
    void play('familyResult')
    return
  }
  index.value++
  keep()
  phase.value = 'handover'
}

function again() {
  start()
}
function change() {
  stopTimer()
  painted.value = false
  phase.value = 'setup'
}
const share = computed(() => (seconds.value ? Math.max(0, Math.min(1, left.value / seconds.value)) : 0))

returnFromPaint()
</script>

<template lang="pug">
  MapTable(:title="t('app.activity.title')" @back="goBack")
    div(class="fa" :class="{ 'is-wide': wide }")
      //- ===== locked =====
      template(v-if="locked")
        MapPaper(kind="card" class="fa-narrow")
          p(class="fa-text") {{ t('app.activity.locked') }}
        MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup: the teams and the plates on the table =====
      template(v-else-if="phase === 'setup'")
        MapResume(v-if="resumable" :info="resumeInfo" class="fa-narrow" @resume="resume")
        MapPaper(kind="strip" class="fa-narrow")
          span(class="fa-strip") {{ t('app.activity.sub') }}
        MapSeats(v-model:count="teamCount" v-model:names="teamNames" :min="2" :max="4" :question="t('app.activity.teams')" placeholder-key="app.family.team" class="fa-narrow")

        section(class="fa-group fa-narrow")
          h3(class="fa-h") {{ t('app.activity.words') }}
          div(class="fa-row" role="radiogroup")
            button(v-for="k in KINDS" :key="k" type="button" role="radio" :aria-checked="kind === k" :class="['fa-plate', { 'is-on': kind === k }]" @click="kind = k")
              span(class="fa-plate-name") {{ t(`app.activity.kind_${k}`) }}

        section(class="fa-group fa-narrow")
          h3(class="fa-h") {{ t('app.activity.ways') }}
          div(class="fa-row" role="group")
            button(v-for="m in ACTIVITY_MODES" :key="m" type="button" role="checkbox" :aria-checked="modes[m]" :class="['fa-plate', { 'is-on': modes[m] }]" @click="modes[m] = !modes[m]")
              span(class="fa-plate-name") {{ t(`app.activity.mode_${m}`) }}
          p(v-if="modes.draw" class="fa-hint") {{ t('app.activity.modeHint_draw') }}
          p(v-if="!allowed.length" class="fa-error" role="alert") {{ t('app.activity.noWay') }}

        section(class="fa-pair fa-narrow")
          div(class="fa-group")
            h3(class="fa-h") {{ t('app.activity.cards') }}
            div(class="fa-row fa-row--discs" role="radiogroup")
              button(v-for="n in CARD_CHOICES" :key="n" type="button" role="radio" :aria-checked="cardsEach === n" :class="['fa-disc', { 'is-on': cardsEach === n }]" @click="cardsEach = n") {{ n }}
          div(class="fa-group")
            h3(class="fa-h") {{ t('app.activity.time') }}
            div(class="fa-row fa-row--discs" role="radiogroup")
              button(v-for="n in SECOND_CHOICES" :key="n" type="button" role="radio" :aria-checked="seconds === n" :aria-label="t('app.activity.seconds', { n })" :class="['fa-disc', { 'is-on': seconds === n }]" @click="seconds = n")
                | {{ n }}
                small s

        p(class="fa-note") {{ t('app.activity.total', { n: totalCards }) }} {{ t('app.activity.pointRule') }}
        MapButton(:disabled="totalCards < 1 || !allowed.length" @click="start") {{ t('app.family.start') }}

      //- ===== the device goes to the team =====
      template(v-else-if="phase === 'handover'")
        MapScoreBar(:players="bar")
        div(class="fa-hand fa-narrow")
          p(class="fa-count") {{ t('app.activity.cardOf', { n: index + 1, total: deck.length }) }}
          MapToken(:index="team" :size="wide ? 70 : 104" lit class="fa-bighand")
          h2(class="fa-team") {{ t('app.activity.turn', { team: teamName }) }}
          MapPaper(kind="strip")
            span(class="fa-strip") {{ t('app.activity.handover') }}
        MapButton(@click="showCard") {{ t('app.activity.show') }}

      //- ===== the word on the medallion, the sand running =====
      template(v-else-if="phase === 'card'")
        div(class="fa-top")
          MapScoreBar(:players="bar")
        div(class="fa-play")
          div(class="fa-stage")
            div(:key="index" class="fa-flip" :style="{ width: medal + 'px', height: medal + 'px' }")
              MapMedallion(:size="medal")
                span(class="fa-count fa-count--in") {{ t('app.activity.cardOf', { n: index + 1, total: deck.length }) }}
                span(class="fa-mode") {{ t(`app.activity.mode_${card?.mode ?? 'explain'}`) }}
                span(class="fa-word" :style="{ fontSize: wordSize + 'rem' }") {{ card?.word }}
          div(class="fa-side")
            div(v-if="!painted || paintedOver" class="fa-clock" :class="{ 'is-up': timeUp, 'is-low': !timeUp && !painted && left <= 10 }")
              img(:src="hourglass" alt="" class="fa-glass" draggable="false" @error="hideImg")
              div(class="fa-time")
                div(class="fa-track" aria-hidden="true")
                  span(class="fa-fill" :style="{ width: Math.round(share * 100) + '%' }")
                p(class="fa-left" role="timer") {{ timeUp ? t('app.activity.timeUp') : t('app.activity.secondsLeft', { n: left }) }}
            MapPaper(v-if="!painted" kind="strip")
              span(class="fa-strip") {{ t(`app.activity.rule_${card?.mode ?? 'explain'}`) }}
            h3(class="fa-h fa-h--center") {{ t('app.activity.whoGuessed') }}
            div(class="fa-figures")
              button(v-for="(n, i) in names" :key="i" type="button" :class="['fa-fig', { 'is-turn': i === team }]" :aria-label="t('app.activity.guessedBy', { team: n })" @click="answer(i)")
                MapToken(:index="i" :size="wide ? 36 : 44" :lit="i === team")
                span(class="fa-fig-name") {{ n }}
            MapButton(quiet @click="answer(null)") {{ t('app.activity.wrong') }}

      //- ===== the end =====
      template(v-else)
        MapResult(:headline="winners.length > 1 ? t('app.activity.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.activity.winner', { name: winners[0]?.name ?? '' })" :rows="resultRows" :winner-index="winnerIndex")
          MapButton(@click="again") {{ t('app.family.again') }}
          MapButton(quiet @click="change") {{ t('app.activity.change') }}
</template>

<style scoped lang="sass">
.fa
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 34rem
  margin: 0 auto
  padding: 6px 0 12px
  color: var(--mp-cream, #f6ead0)
  font-family: var(--mp-serif, Georgia, serif)

  &.is-wide
    max-width: 62rem

.fa-narrow
  width: 100%
  max-width: 30rem

.fa-text
  margin: 0
  line-height: 1.4

.fa-strip
  display: block
  width: 100%
  font-size: 1.25rem
  font-weight: 600
  line-height: 1.3
  text-align: center

.fa-h
  margin: 0 0 6px
  font-size: 1.1rem
  font-weight: 800
  letter-spacing: 0.04em
  text-align: center
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fa-h--center
  margin: 2px 0 0

.fa-group
  width: 100%

.fa-note
  margin: 0
  max-width: 28rem
  text-align: center
  font-size: 1.1rem
  font-weight: 700
  line-height: 1.35
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fa-error
  margin: 6px 0 0
  text-align: center
  font-weight: 800
  color: #ffd2a0
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

// ── the brass and bronze plates of the setup ───────────────────────────────────────────────────────────────
.fa-row
  display: flex
  gap: 8px
  justify-content: center

.fa-row--discs
  gap: 8px
  flex-wrap: wrap

.fa-plate
  position: relative
  flex: 1 1 0
  min-width: 0
  min-height: 52px
  padding: 8px 12px
  border-radius: 9px
  border: 2px solid #9a6b1c
  background: linear-gradient(180deg, #fff8e0 0%, #efd89c 100%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  cursor: pointer
  transition: transform 0.15s, background 0.2s, box-shadow 0.2s
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(2px)

  &.is-on
    border-color: #fff0b8
    background: linear-gradient(180deg, #ffe88f 0%, #f2b73b 100%)
    box-shadow: 0 0 0 3px rgba(255, 246, 214, 0.95), 0 0 16px rgba(255, 200, 70, 0.85), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #fffbe0
    color: #2e1f0a

.fa-plate-name
  display: block
  font-size: 1.08rem
  font-weight: 800
  line-height: 1.15

.fa-hint
  margin: 8px 0 0
  text-align: center
  font-size: 1.08rem
  font-weight: 600
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fa-pair
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

  @media (max-width: 560px)
    grid-template-columns: 1fr

.fa-disc
  display: grid
  place-items: center
  align-content: center
  flex: none
  width: 56px
  height: 56px
  padding: 0
  border-radius: 50%
  border: 2px solid #9a6b1c
  background: radial-gradient(circle at 38% 30%, #fffbeb, #ecd596 80%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  font-size: 1.25rem
  font-weight: 800
  line-height: 1
  cursor: pointer
  transition: transform 0.15s, background 0.2s
  -webkit-tap-highlight-color: transparent

  small
    display: block
    font-size: 0.7rem
    font-weight: 700
    margin-top: 1px

  &:active
    transform: translateY(2px)

  &.is-on
    border-color: #fff0b8
    background: radial-gradient(circle at 38% 30%, #fff3b0, #f2b73b 80%)
    box-shadow: 0 0 0 3px rgba(255, 246, 214, 0.95), 0 0 16px rgba(255, 200, 70, 0.85), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #fffbe0
    color: #2e1f0a

// ── the device goes to the team ────────────────────────────────────────────────────────────────────────────
.fa-hand
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  padding-top: 6px

.fa-count
  margin: 0
  font-size: 0.95rem
  font-weight: 700
  letter-spacing: 0.06em
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fa-count--in
  font-size: 0.78rem
  color: #f2dca0
  opacity: 0.9

.fa-bighand
  margin: 6px 0 2px
  animation: fa-hop 1.8s ease-in-out infinite

.fa-team
  margin: 0
  text-align: center
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95)

// ── the word ───────────────────────────────────────────────────────────────────────────────────────────────
.fa-top
  width: 100%

.fa-play
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  width: 100%

.fa-stage
  display: grid
  place-items: center
  max-width: 100%

.fa-flip
  animation: fa-turn 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both
  transform-origin: 50% 50%

.fa-mode
  margin-top: 2px
  font-size: 0.82rem
  font-weight: 800
  letter-spacing: 0.16em
  text-transform: uppercase
  color: #f5d88a

.fa-word
  margin-top: 6px
  max-width: 100%
  font-weight: 800
  line-height: 1.1
  overflow-wrap: anywhere
  hyphens: auto

.fa-side
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  width: 100%
  max-width: 28rem

.fa-clock
  display: flex
  align-items: center
  gap: 12px
  width: 100%

.fa-glass
  flex: none
  height: 64px
  width: auto
  filter: drop-shadow(0 6px 6px rgba(10, 5, 0, 0.6))
  transform-origin: 50% 55%
  transition: transform 0.9s ease

.fa-clock.is-up .fa-glass
  transform: rotate(180deg)

.fa-time
  flex: 1
  min-width: 0

.fa-track
  height: 8px
  border-radius: 999px
  background: rgba(20, 12, 4, 0.75)
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(226, 189, 102, 0.4)
  overflow: hidden

.fa-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #b98a35, #f0d584)
  transition: width 260ms linear

.fa-left
  margin: 6px 0 0
  font-size: 1.3rem
  font-weight: 800
  letter-spacing: 0.03em
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fa-clock.is-low .fa-left
  color: #ffcf8a

.fa-clock.is-low .fa-fill
  background: linear-gradient(90deg, #a5521f, #e08a4a)

.fa-clock.is-up .fa-left
  color: #ffb27a
  animation: fa-glow 1.4s ease-in-out infinite

.fa-clock.is-up .fa-fill
  width: 0 !important

.fa-figures
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px 14px

.fa-fig
  display: grid
  justify-items: center
  gap: 4px
  min-width: 76px
  min-height: 44px
  padding: 6px 8px 5px
  border: 1px solid rgba(226, 189, 102, 0.4)
  border-radius: 12px
  background: rgba(28, 19, 10, 0.72)
  color: var(--mp-cream, #f6ead0)
  font: inherit
  cursor: pointer
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5)
  transition: transform 0.15s, border-color 0.2s
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.95)

  &.is-turn
    border-color: var(--mp-gold, #e2bd66)
    background: rgba(94, 64, 20, 0.85)

.fa-fig-name
  max-width: 7.5em
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  font-size: 0.98rem
  font-weight: 700

// sideways: the medallion on the left, the rest of the table on the right
@media (orientation: landscape)
  .fa
    gap: 8px
    padding: 0 0 4px

  .fa-play
    flex-direction: row
    align-items: center
    justify-content: center
    gap: 28px

  .fa-side
    flex: 1
    max-width: 26rem
    gap: 8px

  .fa-glass
    height: 48px

  .fa-hand
    gap: 6px

  .fa-fig
    min-width: 70px
    padding: 4px 8px 3px

  .fa-side :deep(.mpa--strip), .fa-side :deep(.mpa-in)
    min-height: 42px

@keyframes fa-turn
  from
    opacity: 0
    transform: perspective(700px) rotateY(80deg) scale(0.9)
  to
    opacity: 1
    transform: perspective(700px) rotateY(0) scale(1)

@keyframes fa-hop
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-6px)

@keyframes fa-glow
  0%, 100%
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)
  50%
    text-shadow: 0 0 14px rgba(255, 180, 90, 0.9), 0 1px 4px rgba(0, 0, 0, 0.95)

@media (prefers-reduced-motion: reduce)
  .fa-flip, .fa-bighand, .fa-clock.is-up .fa-left
    animation: none
</style>
