<script setup lang="ts">
/**
 * "Who am I?" (id `who`, Plus), in the light look of "Familien-Spiele v2" (white cards, capsules, chips, answer tiles; see components/molecules/family/). One person
 * guesses who a card shows by asking questions that can be answered with yes or no, but does not look at the screen. Another person holds the
 * device, sees the name and a few facts from the Bible and answers on three tiles (yes, no, don't know). The fewer questions it takes, the more points.
 * Everything runs on the device; the people are in `data/whoAmI.ts`. The picture of the person is never shown.
 * The course of a real game: the title screen (`start`: picture, name, "Play", "How to play", "Continue"), the players page (`lobby`: figures, names, how
 * often everybody guesses, "Let's go"), the game (`handover`, `card`, `verdict`, with the bar of the game in its colour) and the end (`result`: podium).
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackTo } from '@/utils/navBack'
import MapToken from '@/components/molecules/map/MapToken.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyChoice from '@/components/molecules/family/FamilyChoice.vue'
import FamilyQuestionCard from '@/components/molecules/family/FamilyQuestionCard.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useSfx from '@/use/useSfx'
import useFamilySave from '@/use/useFamilySave'
import { MAX_PLAYERS, MIN_PLAYERS, ranking } from '@/utils/familyQuiz'
import { MAX_QUESTIONS, WHO_ROUND_CHOICES, buildWhoDeck, cardsFor, guesserOf, pointsFor, readWhoSnap, whoSnapDeck, type WhoSnap } from '@/utils/whoAmI'
import { WHO_PEOPLE, type WhoPerson } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import useUserName from '@/use/useUserName'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const { play } = useSfx()

const save = useFamilySave<WhoSnap>('who', 1)

/** The back button of the table: one step back (players page to the title screen, the end to the title screen), from the title screen to the games. A running round has its own button (the bar of the game asks first). */
function goBack() {
  if (phase.value === 'lobby' || phase.value === 'result') {
    phase.value = 'start'
    return
  }
  goBackTo(router, { name: 'app-family' })
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackTo(router, { name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

const NAMES_KEY = 'lk-family-names'

// ── setup (on the players page) ─────────────────────────────────────────────────────────────────────────────────
const names = ref<string[]>(Array.from({ length: MAX_PLAYERS }, () => ''))
const playerCount = ref(3)
const rounds = ref<number>(1)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  names.value = Array.from({ length: MAX_PLAYERS }, (_, i) => saved[i] || (i === 0 && hasCustomName.value ? displayName.value : ''))
  if (saved.filter(Boolean).length >= MIN_PLAYERS) playerCount.value = Math.min(MAX_PLAYERS, saved.filter(Boolean).length)
})

const nameOf = (i: number) => names.value[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))
const totalCards = computed(() => cardsFor(playerCount.value, rounds.value, WHO_PEOPLE.length))

function pickRounds(r: number) {
  rounds.value = r
  void play('tap')
}

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The course: title screen, players page, the device goes to the other person, the card, the verdict, the end. */
type Phase = 'start' | 'lobby' | 'handover' | 'card' | 'verdict' | 'result'
type Answer = 'yes' | 'no' | 'maybe'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'handover' || phase.value === 'card' || phase.value === 'verdict')
const deck = ref<WhoPerson[]>([])
const index = ref(0)
const scores = ref<number[]>([])
const asked = ref(0)
/** What was answered to the questions of this card, one tile after the other (shown as a little trail). */
const trail = ref<Answer[]>([])
const lastPoints = ref(0)

const card = computed(() => deck.value[index.value])
const guesser = computed(() => guesserOf(index.value, playerCount.value))
const guesserName = computed(() => players.value[guesser.value] ?? '')
const isLast = computed(() => index.value >= deck.value.length - 1)
const placing = computed(() => ranking(players.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
/** The same order as `ranking` (it sorts stably), so every place knows which player (which token) it is. */
const placeIndex = computed(() =>
  players.value
    .map((_, i) => i)
    .sort((a, b) => (scores.value[b] ?? 0) - (scores.value[a] ?? 0))
)
const resultRows = computed(() => placing.value.map((p, i) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: placeIndex.value[i] ?? i })))
const endHeadline = computed(() => (winners.value.length > 1 ? t('app.family.winners', { names: winners.value.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners.value[0]?.name ?? '' })))
/** The chips in the bar of the game: the figure, the name and the points of everybody; the one who guesses shines. */
const bar = computed(() => players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: playing.value && i === guesser.value })))
const nowPoints = computed(() => pointsFor(asked.value))
const cardName = computed(() => (card.value ? card.value.name[lang.value] : ''))
const cardFacts = computed(() => (card.value ? card.value.facts[lang.value] : []))
const nameSize = computed(() => (cardName.value.length <= 10 ? '2.1rem' : cardName.value.length <= 16 ? '1.7rem' : '1.4rem'))
/** The four lines of "How to play" (the rules of the game) and the one about the winner. */
const rules = computed(() => [...[1, 2, 3, 4].map((n) => t(`app.who.rule${n}`, { max: MAX_QUESTIONS })), t('app.bigGames.whoFlow.ruleWin')])
const COINS: { key: Answer; label: string }[] = [
  { key: 'yes', label: 'app.who.answerYes' },
  { key: 'no', label: 'app.who.answerNo' },
  { key: 'maybe', label: 'app.who.answerMaybe' }
]

/** The state to keep: set whenever something changes in a round (the cards drawn, the questions asked and answered, the points). */
function keep() {
  const p = phase.value
  if (p !== 'handover' && p !== 'card' && p !== 'verdict') return
  save.save({
    phase: p,
    playerCount: playerCount.value,
    rounds: rounds.value,
    names: names.value.slice(),
    deck: whoSnapDeck(deck.value),
    index: index.value,
    scores: scores.value.slice(0, playerCount.value),
    asked: asked.value,
    trail: trail.value.slice(),
    lastPoints: lastPoints.value
  })
}

/** What is kept, if it has the right shape; a broken or old entry is thrown away. */
const resumable = computed(() => readWhoSnap(save.saved.value))
if (save.saved.value && !readWhoSnap(save.saved.value)) save.clear()
const resumeInfo = computed(() => (!locked.value && resumable.value ? t('app.who.cardOf', { n: resumable.value.snap.index + 1, total: resumable.value.deck.length }) : ''))
/** After "keep playing" in the middle of a card the questions that were asked stay when the card is opened again. */
let keepAsked = false

function resume() {
  const r = resumable.value
  if (!r) return
  const s = r.snap
  playerCount.value = s.playerCount
  rounds.value = s.rounds
  names.value = s.names.slice()
  deck.value = r.deck
  index.value = s.index
  scores.value = s.scores.slice()
  asked.value = s.asked
  trail.value = s.trail.slice()
  lastPoints.value = s.lastPoints
  // the card is never open the moment the device is picked up again: the device goes to the other person first
  keepAsked = s.phase === 'card'
  if (s.phase === 'card') phase.value = 'handover'
  else phase.value = s.phase
}

/** "Continue" on the title screen. */
function takeUp() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  resume()
  void play('tap')
}

/** "Play" on the title screen: to the players page (without Plus the Plus sheet opens instead). */
function openLobby() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  phase.value = 'lobby'
}

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.value.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  if (totalCards.value < 1) return
  deck.value = buildWhoDeck(totalCards.value)
  scores.value = Array.from({ length: playerCount.value }, () => 0)
  index.value = 0
  asked.value = 0
  trail.value = []
  lastPoints.value = 0
  keepAsked = false
  phase.value = 'handover'
  keep()
}

/** The bar of the game says "End game": the round stays kept, the title screen offers to continue. */
function leave() {
  phase.value = 'start'
}

function show() {
  if (!keepAsked) {
    asked.value = 0
    trail.value = []
  }
  keepAsked = false
  void play('cardOpen')
  phase.value = 'card'
  keep()
}

/** A question (or a wrong guess) was asked and answered on a tile. */
function ask(a: Answer) {
  if (asked.value >= MAX_QUESTIONS) return
  asked.value = Math.min(MAX_QUESTIONS, asked.value + 1)
  trail.value = [...trail.value, a]
  void play('coin')
  keep()
}
function undo() {
  asked.value = Math.max(0, asked.value - 1)
  trail.value = trail.value.slice(0, asked.value)
  keep()
}

function finish(guessed: boolean) {
  if (phase.value !== 'card') return
  lastPoints.value = guessed ? pointsFor(asked.value) : 0
  scores.value[guesser.value] = (scores.value[guesser.value] ?? 0) + lastPoints.value
  void play(guessed ? 'right' : 'tap')
  phase.value = 'verdict'
  keep()
}

function next() {
  if (isLast.value) {
    save.clear()
    phase.value = 'result'
    void play('familyResult')
    return
  }
  index.value++
  asked.value = 0
  trail.value = []
  lastPoints.value = 0
  phase.value = 'handover'
  keep()
}

</script>

<template lang="pug">
  MapTable(title="" game="who" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the people with their points, leaving asks first =====
    template(v-if="playing" v-slot:top)
      FamilyGameBar(
        game="who"
        :title="t('app.family.hub_who')"
        :subtitle="t('app.who.cardOf', { n: index + 1, total: deck.length })"
        :players="bar"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="leave"
      )

    div(class="fw")
      //- ===== 1. the title screen (without Plus it says so, and "Play" opens the Plus sheet) =====
      FamilyStart(
        v-if="phase === 'start'"
        game="who"
        :name="t('app.family.hub_who')"
        :tagline="t('app.family.hub_whoSub')"
        :rules="rules"
        :resume-info="resumeInfo"
        @play="openLobby"
        @resume="takeUp"
      )
        template(v-if="locked" v-slot:extra)
          FamilyCard(compact class="fw-locked")
            p(class="fw-fine") {{ t('app.who.locked') }}
            FamilyButton(class="fw-locked-btn" quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 2. who plays, and how often everybody guesses =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="who"
        :count="playerCount"
        :names="names"
        :min="2"
        :max="8"
        :can-go="totalCards >= 1"
        @update:count="playerCount = $event"
        @update:names="names = $event"
        @go="start"
      )
        template(v-slot:settings)
          FamilyCard(:title="t('app.who.rounds')" symbol="who")
            div(class="fw-chips" role="radiogroup" :aria-label="t('app.who.rounds')")
              FamilyChip(v-for="r in WHO_ROUND_CHOICES" :key="r" round :selected="rounds === r" @click="pickRounds(r)") {{ r }}
            span(class="fw-fine") {{ t('app.who.total', { n: totalCards }) }}

      //- ===== 3a. the device goes to the other person =====
      div(v-else-if="phase === 'handover'" class="fw-hand")
        FamilyCard(class="fw-hand-card")
          MapToken(:index="guesser" :size="104" lit class="fw-bighand")
          h2(class="fw-big") {{ t('app.who.turn', { name: guesserName }) }}
          span(class="fw-fine") {{ t('app.who.handover', { name: guesserName }) }}
        FamilyButton(class="fw-show" @click="show") {{ t('app.who.show') }}

      //- ===== 3b. the card with its facts and the answers, then who it was =====
      div(v-else-if="phase === 'card' || phase === 'verdict'" :class="['fw-table', 'is-' + phase]")
        div(class="fw-left")
          FamilyCard(v-if="phase === 'card'" compact tone="wrong" class="fw-warn")
            span(class="fw-warn-t") {{ t('app.who.notFor', { name: guesserName }) }}
          FamilyQuestionCard(
            :key="'n' + index + phase"
            class="fw-name"
            symbol="who"
            :chip="phase === 'verdict' ? t('app.who.itWas') : t('app.who.turn', { name: guesserName })"
            :text="cardName"
            :size="nameSize"
            :tone="phase === 'verdict' ? 'lit' : 'default'"
          )
          FamilyCard(v-if="phase === 'card'" class="fw-facts" :title="t('app.who.facts')")
            ul(class="fw-facts-list")
              li(v-for="(f, i) in cardFacts" :key="index + '-' + i" class="fw-fact" :style="{ animationDelay: 0.25 + i * 0.5 + 's' }") {{ f }}

        div(class="fw-right")
          //- the questions and the answers
          template(v-if="phase === 'card'")
            FamilyCard(compact class="fw-log")
              div(class="fw-counter")
                span(class="fw-counter-n") {{ asked }}
                  small {{ t('app.who.ofMax', { max: MAX_QUESTIONS }) }}
                span(class="fw-counter-pts") {{ t('app.who.pointsNow', { n: nowPoints }) }}
              div(class="fw-trail" role="img" :aria-label="t('app.who.questionsAsked') + ': ' + asked")
                span(v-for="n in MAX_QUESTIONS" :key="n" :class="['fw-dot', trail[n - 1] ? 'is-' + trail[n - 1] : '']")
            FamilyCard(v-if="asked >= MAX_QUESTIONS" compact tone="wrong")
              span(class="fw-warn-t") {{ t('app.who.lastGuess', { name: guesserName }) }}
            div(class="fw-tiles" role="group" :aria-label="t('app.who.answerLabel')")
              FamilyChoice(v-for="(c, i) in COINS" :key="c.key" plain :index="i" :text="t(c.label)" :disabled="asked >= MAX_QUESTIONS" @click="ask(c.key)")
            button(type="button" class="fw-undo" :disabled="asked <= 0" @click="undo") {{ t('app.who.undo') }}
            FamilyButton(class="fw-go" @click="finish(true)") {{ t('app.who.guessed', { name: guesserName }) }}
            FamilyButton(class="fw-go" quiet @click="finish(false)") {{ t('app.who.giveUp') }}

          //- who it was
          template(v-else)
            FamilyCard(compact :tone="lastPoints > 0 ? 'right' : 'default'" class="fw-verdict")
              span(role="status" class="fw-verdict-t") {{ lastPoints > 0 ? t('app.who.gotPoints', { name: guesserName, points: t('app.family.points', lastPoints) }) : t('app.who.gotNothing', { name: guesserName }) }}
            FamilyButton(class="fw-go" @click="next") {{ isLast ? t('app.family.result') : t('app.who.nextCard') }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="who"
        :headline="endHeadline"
        :rows="resultRows"
        @again="start"
        @change="phase = 'lobby'"
        @exit="toGames"
      )
</template>

<style scoped lang="sass">
.fw
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

.fw-fine
  display: block
  width: 100%
  margin: 0
  color: var(--fam-muted)
  text-align: center
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35

.fw-chips
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 14px
  padding-top: 4px

.fw-locked
  max-width: 24rem

// ── the device goes to the other person ──
.fw-hand
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  margin: auto 0

.fw-hand-card
  max-width: 28rem

.fw-bighand
  margin: 4px 0 0

.fw-big
  margin: 0
  color: var(--fam-ink)
  text-align: center
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15

.fw-show
  width: min(100%, 22rem)

// ── the card and the verdict share one table ──
.fw-table
  display: flex
  flex-direction: column
  gap: 16px
  width: 100%

.fw-left, .fw-right
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%
  min-width: 0

.fw-warn-t
  display: block
  color: var(--fam-ink)
  text-align: center
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.3

.fw-name
  :deep(.fam-card-body)
    min-height: 6rem
    justify-content: center

.fw-facts-list
  display: grid
  gap: 0
  width: 100%
  margin: 0
  padding: 0
  list-style: none

.fw-fact
  min-height: 44px
  display: flex
  align-items: center
  justify-content: center
  padding: 8px 4px
  border-top: 1.5px solid var(--fam-line)
  color: var(--fam-ink)
  text-align: center
  font-size: 1.08rem
  font-weight: 600
  line-height: 1.35

  &:first-child
    border-top: 0

// the questions: the number, the points now, and a trail of little dots in the colours of the answers
.fw-counter
  display: flex
  align-items: baseline
  justify-content: center
  flex-wrap: wrap
  gap: 6px 16px

.fw-counter-n
  color: var(--fam-ink)
  font-size: 2.1rem
  font-weight: 800
  line-height: 1.1

  small
    margin-left: 8px
    color: var(--fam-muted)
    font-size: 1rem
    font-weight: 700

.fw-counter-pts
  padding: 4px 14px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-size: 1.02rem
  font-weight: 800

.fw-trail
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 5px
  max-width: 17rem
  margin: 0 auto

.fw-dot
  width: 12px
  height: 12px
  border: 1.5px solid var(--fam-line-strong)
  border-radius: 50%
  background: var(--fam-field)
  transition: background 0.3s, transform 0.3s

  &.is-yes
    border-color: transparent
    background: var(--fam-a-bg)
    transform: scale(1.1)

  &.is-no
    border-color: transparent
    background: var(--fam-b-bg)
    transform: scale(1.1)

  &.is-maybe
    border-color: transparent
    background: var(--fam-c-bg)
    transform: scale(1.1)

// the three answers, side by side
.fw-tiles
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px
  width: 100%
  max-width: 26rem
  padding: 4px 0

  :deep(.fam-choice:disabled)
    opacity: 0.5

.fw-undo
  min-height: 48px
  padding: 0 16px
  border: 0
  background: transparent
  color: var(--fam-primary-ink)
  font: inherit
  font-size: 1.02rem
  font-weight: 700
  text-decoration: underline
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &:disabled
    opacity: 0.4
    cursor: default

.fw-go
  width: min(100%, 22rem)

.fw-verdict
  max-width: 24rem

.fw-verdict-t
  display: block
  color: var(--fam-ink)
  font-size: 1.3rem
  font-weight: 800
  line-height: 1.25

// ── motion only when the device does not ask for less ──
@media (prefers-reduced-motion: no-preference)
  .fw-name
    animation: fw-drop 0.5s ease both

  .fw-fact
    animation: fw-lay 0.6s ease both

  .fw-bighand
    animation: fw-hop 1.8s ease-in-out infinite

@keyframes fw-lay
  from
    opacity: 0
    transform: translateY(-10px)
  to
    opacity: 1
    transform: none

@keyframes fw-drop
  from
    opacity: 0
    transform: translateY(-14px)
  to
    opacity: 1
    transform: none

@keyframes fw-hop
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-6px)

// ── sideways: the card on the left, the answers on the right ──
@media (orientation: landscape)
  .fw
    max-width: 62rem
    gap: 12px

  .fw-table
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem)
    gap: 12px 20px
    align-items: start

  .fw-left, .fw-right
    gap: 8px

  .fw-name
    :deep(.fam-card-head)
      min-height: 44px
      padding-top: 4px
      padding-bottom: 4px

    :deep(.fam-card-body)
      min-height: 4.5rem
      padding: 8px 14px

  .fw-fact
    min-height: 40px
    padding-top: 4px
    padding-bottom: 4px

  .fw-undo
    min-height: 48px

  .fw-hand
    display: grid
    grid-template-columns: minmax(0, 28rem) minmax(0, 18rem)
    justify-content: center
    align-items: center
    gap: 16px 24px
</style>
