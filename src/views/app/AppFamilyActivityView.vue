<script setup lang="ts">
/**
 * Bible Words (id `activity`, Plus), in the light look of "Familien-Spiele v2" (white cards, capsules, chips; see components/molecules/family/). One device in the
 * middle, two to four teams take turns. One person of the team sees a word from the adventures and shows it (explain, draw on paper, act out);
 * the team guesses until the time has run out. A point for every word that was guessed. Everything runs on the device; the words are in `data/activityWords.ts`.
 * The course of a real game: the title screen (`start`: picture, name, "Play", "How to play", "Continue"), the page of the teams (`lobby`: figures, names,
 * the words, the ways, the number of words and the time, "Let's go"), the game (`handover`, `card`, with the bar of the game in its colour) and the end
 * (`result`: podium). A word that is painted goes to the painting app and comes back to the same card (`returnFromPaint`).
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackToOrigin } from '@/utils/navBack'
import MapToken from '@/components/molecules/map/MapToken.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyQuestionCard from '@/components/molecules/family/FamilyQuestionCard.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useSfx from '@/use/useSfx'
import useFamilySave from '@/use/useFamilySave'
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

const save = useFamilySave<ActivitySnap>('activity', 1)

/** The back button of the table: one step back (the teams page to the title screen, the end to the title screen), from the title screen to the games. A running round has its own button (the bar of the game asks first). */
function goBack() {
  if (phase.value === 'lobby' || phase.value === 'result') {
    phase.value = 'start'
    return
  }
  goBackToOrigin(router, { name: 'app-family' })
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackToOrigin(router, { name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

// ── setup (on the teams page) ───────────────────────────────────────────────────────────────────────────────────
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
const canGo = computed(() => totalCards.value >= 1 && allowed.value.length > 0)

function pickKind(k: ActivityKind) {
  kind.value = k
  void play('tap')
}
function toggleMode(m: ActivityMode) {
  modes[m] = !modes[m]
  void play('tap')
}
function pickCards(n: number) {
  cardsEach.value = n
  void play('tap')
}
function pickSeconds(n: number) {
  seconds.value = n
  void play('tap')
}

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The course: title screen, teams page, the device goes to the team, the word (with the time), the end. */
type Phase = 'start' | 'lobby' | 'handover' | 'card' | 'result'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'handover' || phase.value === 'card')
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
/** The painting program could not be opened (the hand-over could not be written): the card then works like the others, with the time. */
const noPaintApp = ref(false)
/** A card whose way is "paint": the word is shown first, the painting program opens when the person taps the button (the time starts there). */
const readyToPaint = computed(() => phase.value === 'card' && card.value?.mode === 'draw' && !painted.value && !noPaintApp.value)
const timeUp = computed(() => phase.value === 'card' && !readyToPaint.value && (painted.value ? paintedOver.value : left.value <= 0))
/** The clock is shown unless the word is being painted somewhere else. */
const showClock = computed(() => !readyToPaint.value && (!painted.value || paintedOver.value))
const placing = computed(() => ranking(names.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
/** The same order as `ranking` (it sorts stably), so every place knows which team (which token) it is. */
const placeIndex = computed(() =>
  names.value
    .map((_, i) => i)
    .sort((a, b) => (scores.value[b] ?? 0) - (scores.value[a] ?? 0))
)
const resultRows = computed(() => placing.value.map((p, i) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: placeIndex.value[i] ?? i })))
const endHeadline = computed(() => (winners.value.length > 1 ? t('app.activity.winners', { names: winners.value.map((w) => w.name).join(' & ') }) : t('app.activity.winner', { name: winners.value[0]?.name ?? '' })))
/** The chips in the bar of the game: the figure, the name and the points of every team; the team whose turn it is shines. */
const bar = computed(() => names.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: playing.value && i === team.value })))
/** The four to five lines of "How to play": what the game does anyway (the existing texts, and two short new ones). */
const rules = computed(() => [t('app.activity.handover'), t('app.activity.sub'), t('app.bigGames.activityFlow.ruleTime'), t('app.activity.pointRule'), t('app.bigGames.activityFlow.ruleWin')])

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
const resumeInfo = computed(() => (!locked.value && resumable.value ? t('app.activity.cardOf', { n: resumable.value.index + 1, total: resumable.value.deck.length }) : ''))

/** "Play" on the title screen: to the teams page (without Plus the Plus sheet opens instead). */
function openLobby() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  phase.value = 'lobby'
}

/** "Continue" on the title screen. */
function takeUp() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  if (resume()) void play('tap')
}

function start() {
  if (!canGo.value) return
  painted.value = false
  deck.value = buildDeck(words.value, totalCards.value, allowed.value)
  scores.value = Array.from({ length: teamCount.value }, () => 0)
  index.value = 0
  keep()
  phase.value = 'handover'
}

/** The bar of the game says "End game": the round stays kept, the title screen offers to continue. */
function leave() {
  stopTimer()
  painted.value = false
  phase.value = 'start'
}

/**
 * A card whose way is "paint" first shows the word (like the others); the button there goes to the painting program (blank sheet, the
 * word and the time in a band on top). What is kept is the hand-over of this card, so the round comes back to the same card.
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
function runClock() {
  left.value = seconds.value
  deadline = Date.now() + seconds.value * 1000
  stopTimer()
  timer = setInterval(() => {
    left.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (left.value <= 0) stopTimer()
  }, 250)
}

function showCard() {
  painted.value = false
  noPaintApp.value = false
  stopTimer()
  if (card.value?.mode === 'draw') {
    // no time yet: the word is shown, and the time starts when the painting program opens
    left.value = seconds.value
    keep()
  } else {
    runClock()
  }
  void play('cardTurn')
  phase.value = 'card'
}

/** The button of a paint card: to the painting program; when that is not possible the card goes on like the others, with the time. */
function goPaint() {
  const c = card.value
  if (!c || c.mode !== 'draw') return
  if (paintCard(c)) return
  noPaintApp.value = true
  runClock()
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

/** "New round with other players": back to the teams page. */
function change() {
  stopTimer()
  painted.value = false
  phase.value = 'lobby'
}
const share = computed(() => (seconds.value ? Math.max(0, Math.min(1, left.value / seconds.value)) : 0))

returnFromPaint()
</script>

<template lang="pug">
  MapTable(title="" game="activity" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the teams with their points, leaving asks first =====
    template(v-if="playing" v-slot:top)
      FamilyGameBar(
        game="activity"
        :title="t('app.family.hub_activity')"
        :subtitle="t('app.activity.cardOf', { n: index + 1, total: deck.length })"
        :players="bar"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="leave"
      )

    div(class="fa")
      //- ===== 1. the title screen (without Plus it says so, and "Play" opens the Plus sheet) =====
      FamilyStart(
        v-if="phase === 'start'"
        game="activity"
        :name="t('app.family.hub_activity')"
        :tagline="t('app.family.hub_activitySub')"
        :rules="rules"
        :resume-info="resumeInfo"
        @play="openLobby"
        @resume="takeUp"
      )
        template(v-if="locked" v-slot:extra)
          FamilyCard(compact class="fa-locked")
            p(class="fa-fine") {{ t('app.activity.locked') }}
            FamilyButton(class="fa-locked-btn" quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 2. the teams, and the settings of the game =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="activity"
        :title="t('app.activity.teams')"
        :count="teamCount"
        :names="teamNames"
        :min="2"
        :max="4"
        placeholder-key="app.family.team"
        :can-go="canGo"
        @update:count="teamCount = $event"
        @update:names="teamNames = $event"
        @go="start"
      )
        template(v-slot:settings)
          //- which words
          FamilyCard(:title="t('app.activity.words')" symbol="activity")
            div(class="fa-chips" role="radiogroup" :aria-label="t('app.activity.words')")
              FamilyChip(v-for="k in KINDS" :key="k" :selected="kind === k" @click="pickKind(k)") {{ t(`app.activity.kind_${k}`) }}

          //- how a word is shown (one way at least)
          FamilyCard(:title="t('app.activity.ways')")
            div(class="fa-chips" role="group" :aria-label="t('app.activity.ways')")
              FamilyChip(v-for="m in ACTIVITY_MODES" :key="m" role="checkbox" :selected="modes[m]" @click="toggleMode(m)") {{ t(`app.activity.mode_${m}`) }}
            span(v-if="modes.draw" class="fa-fine") {{ t('app.activity.modeHint_draw') }}
            span(v-if="!allowed.length" class="fa-fine fa-error" role="alert") {{ t('app.activity.noWay') }}

          //- how many words for every team, and how long for one word
          FamilyCard(:title="t('app.activity.cards')")
            div(class="fa-chips" role="radiogroup" :aria-label="t('app.activity.cards')")
              FamilyChip(v-for="n in CARD_CHOICES" :key="n" round :selected="cardsEach === n" @click="pickCards(n)") {{ n }}
          FamilyCard(:title="t('app.activity.time')")
            div(class="fa-chips" role="radiogroup" :aria-label="t('app.activity.time')")
              FamilyChip(v-for="n in SECOND_CHOICES" :key="n" :selected="seconds === n" :aria-label="t('app.activity.seconds', { n })" @click="pickSeconds(n)") {{ n }} s

          FamilyCard(compact)
            span(class="fa-fine") {{ t('app.activity.total', { n: totalCards }) }} {{ t('app.activity.pointRule') }}

      //- ===== 3a. the device goes to the team =====
      div(v-else-if="phase === 'handover'" class="fa-hand")
        FamilyCard(class="fa-hand-card")
          MapToken(:index="team" :size="104" lit class="fa-bighand")
          h2(class="fa-team") {{ t('app.activity.turn', { team: teamName }) }}
          span(class="fa-fine") {{ t('app.activity.handover') }}
        FamilyButton(class="fa-show" @click="showCard") {{ t('app.activity.show') }}

      //- ===== 3b. the word, the time running =====
      div(v-else-if="phase === 'card'" class="fa-play")
        div(class="fa-stage")
          FamilyQuestionCard(
            :key="index"
            class="fa-wordcard"
            symbol="activity"
            :chip="t(`app.activity.mode_${card?.mode ?? 'explain'}`)"
          )
            span(class="fa-word" :style="{ fontSize: wordSize + 'rem' }") {{ card?.word }}
          //- how to show this word (under the word, so that the right side keeps room for the time and the guess)
          FamilyCard(v-if="!painted" compact class="fa-rule")
            span(class="fa-fine") {{ t(`app.activity.rule_${card?.mode ?? 'explain'}`) }}
        div(class="fa-side")
          FamilyCard(v-if="showClock" compact :tone="timeUp ? 'wrong' : 'default'" :class="['fa-clock', { 'is-up': timeUp, 'is-low': !timeUp && !painted && left <= 10 }]")
            p(class="fa-left" role="timer") {{ timeUp ? t('app.activity.timeUp') : t('app.activity.secondsLeft', { n: left }) }}
            div(class="fa-track" aria-hidden="true")
              span(class="fa-fill" :style="{ width: Math.round(share * 100) + '%' }")
          //- a paint card: first the word, then the button to the painting program
          FamilyButton(v-if="readyToPaint" class="fa-paint" @click="goPaint") {{ t('app.activity.paintGo') }}
          template(v-else)
            h3(class="fa-h") {{ t('app.activity.whoGuessed') }}
            div(class="fa-figures")
              button(v-for="(n, i) in names" :key="i" type="button" :class="['fa-fig', { 'is-turn': i === team }]" :aria-label="t('app.activity.guessedBy', { team: n })" @click="answer(i)")
                MapToken(:index="i" :size="44" :lit="i === team")
                span(class="fa-fig-name") {{ n }}
            FamilyButton(quiet class="fa-nobody" @click="answer(null)") {{ t('app.activity.wrong') }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="activity"
        :headline="endHeadline"
        :rows="resultRows"
        @again="start"
        @change="change"
        @exit="toGames"
      )
</template>

<style scoped lang="sass">
.fa
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

// ── the teams page: the words, the ways, how many, how long ──
.fa-chips
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 12px
  padding-top: 2px

.fa-fine
  display: block
  width: 100%
  margin: 0
  color: var(--fam-muted)
  text-align: center
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35

.fa-error
  color: var(--fam-bad)
  font-weight: 700

.fa-locked
  max-width: 24rem

.fa-h
  margin: 4px 0 0
  color: var(--fam-ink)
  text-align: center
  font-size: 1.15rem
  font-weight: 800

// ── the device goes to the team ──
.fa-hand
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  margin: auto 0

.fa-hand-card
  max-width: 28rem

.fa-bighand
  margin: 4px 0 0

.fa-team
  margin: 0
  color: var(--fam-ink)
  text-align: center
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15

.fa-show
  width: min(100%, 22rem)

// ── the word ──
.fa-play
  display: flex
  flex-direction: column
  gap: 16px

.fa-stage
  display: flex
  flex-direction: column
  gap: 12px
  min-width: 0

.fa-wordcard
  :deep(.fam-card-body)
    min-height: 9.5rem
    justify-content: center

.fa-word
  display: block
  max-width: 100%
  color: var(--fam-ink)
  font-weight: 800
  line-height: 1.1
  text-align: center
  overflow-wrap: anywhere
  hyphens: auto

.fa-side
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  min-width: 0

.fa-clock
  :deep(.fam-card-body)
    gap: 8px

.fa-left
  margin: 0
  color: var(--fam-ink)
  font-size: 1.35rem
  font-weight: 800
  line-height: 1.2

.fa-track
  width: 100%
  height: 10px
  border-radius: 999px
  background: var(--fam-field)
  box-shadow: inset 0 0 0 1px var(--fam-line)
  overflow: hidden

.fa-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--fam-primary)
  transition: width 260ms linear

.fa-clock.is-low
  .fa-left
    color: var(--fam-bad)

  .fa-fill
    background: var(--fam-bad)

.fa-clock.is-up
  .fa-left
    color: var(--fam-bad)

  .fa-fill
    width: 0 !important

.fa-paint
  width: min(100%, 22rem)

.fa-figures
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 12px
  width: 100%

.fa-fig
  box-sizing: border-box
  display: grid
  justify-items: center
  gap: 4px
  min-width: 96px
  min-height: 64px
  padding: 8px 12px 7px
  border: 2px solid var(--fam-line-strong)
  border-radius: 20px
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)
  color: var(--fam-ink)
  font: inherit
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: transform 0.12s, border-color 0.2s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &:active
    transform: scale(0.96)

  &.is-turn
    border-color: var(--fam-gold)
    background: color-mix(in srgb, var(--fam-gold) 18%, var(--fam-card))

.fa-fig-name
  max-width: 7.5em
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  font-size: 1rem
  font-weight: 700

.fa-nobody
  width: min(100%, 22rem)

// ── motion only when the device does not ask for less ──
@media (prefers-reduced-motion: no-preference)
  .fa-wordcard
    animation: fa-turn 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both
    transform-origin: 50% 50%

  .fa-bighand
    animation: fa-hop 1.8s ease-in-out infinite

  .fa-clock.is-up .fa-left
    animation: fa-pulse 1.4s ease-in-out 4

@keyframes fa-turn
  from
    opacity: 0
    transform: perspective(700px) rotateY(70deg) scale(0.92)
  to
    opacity: 1
    transform: perspective(700px) rotateY(0) scale(1)

@keyframes fa-hop
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-6px)

@keyframes fa-pulse
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.08)

// ── sideways: the word on the left, the rest on the right (the teams page and the end arrange themselves) ──
@media (orientation: landscape)
  .fa
    max-width: 62rem
    gap: 12px

  .fa-play
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem)
    gap: 12px 20px
    align-items: start

  .fa-wordcard
    :deep(.fam-card-head)
      min-height: 44px
      padding-top: 4px
      padding-bottom: 4px

    :deep(.fam-card-body)
      min-height: 7rem
      padding: 10px 14px

  .fa-side
    gap: 8px

  .fa-fig
    min-width: 84px
    min-height: 56px
    padding: 4px 10px 3px

  .fa-hand
    display: grid
    grid-template-columns: minmax(0, 28rem) minmax(0, 18rem)
    justify-content: center
    align-items: center
    gap: 16px 24px
</style>
