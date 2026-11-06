<script setup lang="ts">
/**
 * "Wer bin ich?" (Plus), on the old map: one person guesses who a card shows by asking questions that can be answered with yes or no, but
 * does not look at the screen. Another person holds the device, sees the name and a few facts from the Bible and answers on three coins
 * (yes, no, don't know). The fewer questions it takes, the more points. Everything runs on the device; the people are in `data/whoAmI.ts`.
 * The picture of the person is never shown: it stays behind the velvet curtain of the frame, only the name lies on parchment.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapCoin from '@/components/molecules/map/MapCoin.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapSeats from '@/components/molecules/map/MapSeats.vue'
import MapScoreBar from '@/components/molecules/map/MapScoreBar.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useSfx from '@/use/useSfx'
import useFamilySave from '@/use/useFamilySave'
import { prependBaseUrl } from '@/utils/function'
import { MAX_PLAYERS, MIN_PLAYERS, ranking } from '@/utils/familyQuiz'
import { MAX_QUESTIONS, WHO_ROUND_CHOICES, buildWhoDeck, cardsFor, guesserOf, pointsFor, readWhoSnap, whoSnapDeck, type WhoSnap } from '@/utils/whoAmI'
import { WHO_PEOPLE, type WhoPerson } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import useUserName from '@/use/useUserName'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const { play } = useSfx()
const frameSrc = prependBaseUrl('images/familie/karte/rahmen-wer.webp')
const frameMissing = ref(false)
const hideImg = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
  frameMissing.value = true
}

const save = useFamilySave<WhoSnap>('who', 1)

/** In the game the back button leads to the start page of this game (where a new round can begin); from there to the main menu. */
function goBack() {
  if (phase.value === 'setup') {
    void router.push({ name: 'app-family' })
    return
  }
  phase.value = 'setup'
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = ref<string[]>(Array.from({ length: MAX_PLAYERS }, () => ''))
const playerCount = ref(3)
const rounds = ref<number>(1)
const showRules = ref(false)

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

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'card' | 'verdict' | 'result'
type Answer = 'yes' | 'no' | 'maybe'
const phase = ref<Phase>('setup')
const deck = ref<WhoPerson[]>([])
const index = ref(0)
const scores = ref<number[]>([])
const asked = ref(0)
/** What was answered to the questions of this card, one coin after the other (shown as a little trail). */
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
const winnerIndex = computed(() => placeIndex.value[0] ?? 0)
const bar = computed(() => players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: i === guesser.value })))
const nowPoints = computed(() => pointsFor(asked.value))
const cardName = computed(() => (card.value ? card.value.name[lang.value] : ''))
const cardFacts = computed(() => (card.value ? card.value.facts[lang.value] : []))
const nameSize = computed(() => (cardName.value.length <= 10 ? 2.1 : cardName.value.length <= 16 ? 1.7 : 1.4))
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
const resumeInfo = computed(() => (resumable.value ? t('app.who.cardOf', { n: resumable.value.snap.index + 1, total: resumable.value.deck.length }) : ''))
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

/** A question (or a wrong guess) was asked and answered on a coin. */
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
  MapTable(:title="t('app.who.title')" @back="goBack")
    div(class="fw")
      //- ===== locked =====
      template(v-if="locked")
        MapPaper(kind="card" class="fw-narrow")
          p(class="fw-text") {{ t('app.who.locked') }}
        MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      template(v-else-if="phase === 'setup'")
        MapResume(v-if="resumable" :info="resumeInfo" class="fw-narrow" @resume="resume")
        MapPaper(kind="strip" class="fw-narrow")
          span(class="fw-strip") {{ t('app.who.explain') }}
        MapSeats(v-model:count="playerCount" v-model:names="names" :min="2" :max="8" :question="t('app.family.howMany')" class="fw-narrow")

        section(class="fw-group fw-narrow")
          h3(class="fw-h") {{ t('app.who.rounds') }}
          div(class="fw-discs" role="radiogroup")
            button(v-for="r in WHO_ROUND_CHOICES" :key="r" type="button" role="radio" :aria-checked="rounds === r" :class="['fw-disc', { 'is-on': rounds === r }]" @click="rounds = r") {{ r }}

        button(type="button" class="fw-plate" :aria-expanded="showRules" @click="showRules = !showRules") {{ t('app.who.rulesTitle') }}
        MapPaper(v-if="showRules" kind="card" class="fw-narrow fw-rules-paper")
          ol(class="fw-rules")
            li(v-for="n in 4" :key="n") {{ t(`app.who.rule${n}`, { max: MAX_QUESTIONS }) }}

        p(class="fw-note") {{ t('app.who.total', { n: totalCards }) }}
        MapButton(:disabled="totalCards < 1" @click="start") {{ t('app.family.start') }}

      //- ===== result =====
      template(v-else-if="phase === 'result'")
        MapResult(:headline="winners.length > 1 ? t('app.family.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners[0]?.name ?? '' })" :rows="resultRows" :winner-index="winnerIndex")
          MapButton(@click="start") {{ t('app.family.again') }}
          MapButton(quiet @click="phase = 'setup'") {{ t('app.activity.change') }}

      //- ===== handover, the card and the verdict share one table =====
      template(v-else)
        MapScoreBar(:players="bar")
        div(:class="['fw-table', 'is-' + phase]")
          div(class="fw-left")
            p(v-if="phase === 'card'" class="fw-warn") {{ t('app.who.notFor', { name: guesserName }) }}
            p(v-if="phase === 'verdict'" class="fw-count") {{ t('app.who.itWas') }}
            div(:class="['fw-frame', { 'is-lit': phase === 'verdict', 'is-plain': frameMissing }]" role="img" :aria-label="t('app.who.behindCurtain')")
              img(:src="frameSrc" alt="" draggable="false" @error="hideImg")
            MapPaper(v-if="phase === 'card' || phase === 'verdict'" kind="strip" :lit="phase === 'verdict'" :key="'n' + index + phase" class="fw-name")
              span(class="fw-person" :style="{ fontSize: nameSize + 'rem' }") {{ cardName }}
            div(v-if="phase === 'card'" class="fw-facts")
              span(class="fw-facts-title") {{ t('app.who.facts') }}
              MapPaper(v-for="(f, i) in cardFacts" :key="index + '-' + i" kind="strip" class="fw-fact" :style="{ animationDelay: 0.25 + i * 0.5 + 's' }")
                span(class="fw-strip") {{ f }}

          div(class="fw-right")
            //- the device goes to the other person
            template(v-if="phase === 'handover'")
              p(class="fw-count") {{ t('app.who.cardOf', { n: index + 1, total: deck.length }) }}
              h2(class="fw-big") {{ t('app.who.turn', { name: guesserName }) }}
              MapPaper(kind="strip" class="fw-narrow")
                span(class="fw-strip") {{ t('app.who.handover', { name: guesserName }) }}
              MapButton(@click="show") {{ t('app.who.show') }}

            //- the questions and the coins
            template(v-else-if="phase === 'card'")
              div(class="fw-log")
                div(class="fw-counter")
                  span(class="fw-counter-n") {{ asked }}
                    small {{ t('app.who.ofMax', { max: MAX_QUESTIONS }) }}
                  span(class="fw-counter-pts") {{ t('app.who.pointsNow', { n: nowPoints }) }}
                div(class="fw-trail" role="img" :aria-label="t('app.who.questionsAsked') + ': ' + asked")
                  span(v-for="n in MAX_QUESTIONS" :key="n" :class="['fw-dot', trail[n - 1] ? 'is-' + trail[n - 1] : '']")
              p(v-if="asked >= MAX_QUESTIONS" class="fw-warn") {{ t('app.who.lastGuess', { name: guesserName }) }}
              div(class="fw-coins" role="group" :aria-label="t('app.who.answerLabel')")
                MapCoin(v-for="(c, i) in COINS" :key="c.key" :index="i" :disabled="asked >= MAX_QUESTIONS" @click="ask(c.key)") {{ t(c.label) }}
              button(type="button" class="fw-undo" :disabled="asked <= 0" @click="undo") {{ t('app.who.undo') }}
              MapButton(@click="finish(true)") {{ t('app.who.guessed', { name: guesserName }) }}
              MapButton(quiet @click="finish(false)") {{ t('app.who.giveUp') }}

            //- who it was
            template(v-else)
              MapPaper(kind="strip" class="fw-narrow")
                span(class="fw-strip") {{ lastPoints > 0 ? t('app.who.gotPoints', { name: guesserName, points: t('app.family.points', lastPoints) }) : t('app.who.gotNothing', { name: guesserName }) }}
              MapButton(@click="next") {{ isLast ? t('app.family.result') : t('app.who.nextCard') }}
</template>

<style scoped lang="sass">
.fw
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

.fw-narrow
  width: 100%
  max-width: 30rem

.fw-text
  margin: 0
  line-height: 1.4

.fw-strip
  display: block
  width: 100%
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.3
  text-align: center

.fw-h
  margin: 0 0 8px
  font-size: 1.1rem
  font-weight: 800
  letter-spacing: 0.04em
  text-align: center
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fw-group
  width: 100%

.fw-note
  margin: 0
  text-align: center
  font-size: 0.98rem
  font-weight: 600
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

// the rounds: bronze discs on the table
.fw-discs
  display: flex
  gap: 12px
  justify-content: center

.fw-disc
  display: grid
  place-items: center
  width: 58px
  height: 58px
  padding: 0
  border-radius: 50%
  border: 2px solid #9a6b1c
  background: radial-gradient(circle at 38% 30%, #fffbeb, #ecd596 80%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  font-size: 1.3rem
  font-weight: 800
  cursor: pointer
  transition: transform 0.15s
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(2px)

  &.is-on
    border-color: #fff0b8
    background: radial-gradient(circle at 38% 30%, #fff3b0, #f2b73b 80%)
    box-shadow: 0 0 0 3px rgba(255, 246, 214, 0.95), 0 0 16px rgba(255, 200, 70, 0.85), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #fffbe0
    color: #2e1f0a

// a small bronze plate (the rules)
.fw-plate
  min-height: 46px
  padding: 8px 26px
  border-radius: 9px
  border: 2px solid #9a6b1c
  background: linear-gradient(180deg, #fff8e0 0%, #efd89c 100%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  font-size: 1.05rem
  font-weight: 800
  letter-spacing: 0.04em
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(2px)

.fw-rules-paper
  :deep(.mpa-in)
    padding: 15% 10% 11%

.fw-rules
  margin: 0
  padding-left: 1.2em
  display: grid
  gap: 10px
  text-align: left
  font-size: 1.3rem
  font-weight: 700
  line-height: 1.35

// ── handover, the card and the verdict ─────────────────────────────────────────────────────────────────────
.fw-table
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%

.fw-left, .fw-right
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%

.fw-right
  max-width: 28rem

.fw-left
  max-width: 28rem

.fw-count
  margin: 0
  font-size: 0.98rem
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fw-big
  margin: 0
  text-align: center
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95)

.fw-warn
  margin: 0
  padding: 5px 16px
  border-radius: 6px
  border: 1px solid rgba(255, 200, 140, 0.6)
  background: rgba(110, 42, 20, 0.88)
  color: #ffe6c8
  font-size: 0.95rem
  font-weight: 800
  letter-spacing: 0.03em
  text-align: center
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5)

// the gilded oval with the closed velvet curtain: the person stays hidden behind it
.fw-frame
  position: relative
  height: 190px
  aspect-ratio: 4 / 5
  display: grid
  place-items: center
  transition: filter 0.4s

  // only while the picture of the frame is missing: a plain gilded oval
  &.is-plain
    border-radius: 50%
    background: radial-gradient(ellipse at 50% 40%, #6b1d22, #3a0e12 70%)
    box-shadow: 0 0 0 6px #a9802d, 0 10px 14px rgba(10, 5, 0, 0.6)

  img
    position: absolute
    inset: -8%
    width: 116%
    height: 116%
    max-width: none
    object-fit: contain
    filter: drop-shadow(0 8px 8px rgba(10, 5, 0, 0.6))

  &.is-lit
    img
      filter: drop-shadow(0 0 16px rgba(255, 205, 100, 0.9)) drop-shadow(0 8px 8px rgba(10, 5, 0, 0.6))

.is-card .fw-frame
  height: 116px

.is-verdict .fw-frame
  height: 150px

// the name lies on parchment, like a plate before the frame
.fw-name
  max-width: 24rem
  margin-top: -12px
  animation: fw-drop 0.6s ease both

.fw-person
  display: block
  width: 100%
  font-weight: 800
  line-height: 1.1
  overflow-wrap: anywhere

.fw-facts
  display: grid
  gap: 8px
  width: 100%
  justify-items: center

.fw-facts-title
  font-size: 0.82rem
  font-weight: 800
  letter-spacing: 0.1em
  text-transform: uppercase
  color: #f2dca0
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

// the facts are laid on the table one after the other
.fw-fact
  animation: fw-lay 0.7s ease both
  min-height: 46px
  :deep(.mpa-in)
    min-height: 46px

.fw-log
  display: grid
  justify-items: center
  gap: 6px
  padding: 6px 18px 9px
  border-radius: 14px
  border: 1px solid rgba(226, 189, 102, 0.45)
  background: rgba(28, 19, 10, 0.72)
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5)

.fw-counter
  display: flex
  align-items: baseline
  justify-content: center
  flex-wrap: wrap
  gap: 4px 16px

.fw-counter-n
  font-size: 2.1rem
  font-weight: 800
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95)

  small
    margin-left: 8px
    font-size: 1rem
    font-weight: 700
    color: #f2dca0

.fw-counter-pts
  font-size: 1.1rem
  font-weight: 800
  color: var(--mp-gold, #e2bd66)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fw-trail
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 4px
  max-width: 17rem

.fw-dot
  width: 11px
  height: 11px
  border-radius: 50%
  border: 1px solid rgba(226, 189, 102, 0.55)
  background: rgba(20, 12, 4, 0.6)
  transition: background 0.3s, transform 0.3s

  &.is-yes
    background: radial-gradient(circle at 35% 30%, #e3c070, #9a7226)
    transform: scale(1.1)
  &.is-no
    background: radial-gradient(circle at 35% 30%, #e0996a, #8d4a22)
    transform: scale(1.1)
  &.is-maybe
    background: radial-gradient(circle at 35% 30%, #f1f0e8, #8e9088)
    transform: scale(1.1)

.fw-coins
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px
  width: 100%
  max-width: 22rem
  padding: 4px 0

  :deep(.mc)
    transition: transform 0.18s, filter 0.25s, opacity 0.25s
  :deep(.mc:disabled)
    opacity: 0.5

.fw-undo
  min-height: 44px
  padding: 0 14px
  border: none
  background: transparent
  color: var(--mp-cream, #f6ead0)
  font: inherit
  font-size: 1rem
  font-weight: 700
  text-decoration: underline
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)
  cursor: pointer

  &:disabled
    opacity: 0.4

@media (orientation: landscape)
  .fw
    max-width: 60rem

  .fw-table
    flex-direction: row
    align-items: flex-start
    justify-content: center
    gap: 28px

  .fw-left, .fw-right
    flex: 1 1 0
    min-width: 0

  .is-handover .fw-left, .is-verdict .fw-left
    justify-content: center

  // the card: the little frame and the name side by side, so that the facts and the coins fit on the screen
  .is-card .fw-left
    display: grid
    grid-template-columns: auto minmax(0, 1fr)
    align-items: center
    gap: 8px 12px
    .fw-warn, .fw-facts
      grid-column: 1 / -1
      justify-self: center
    .fw-name
      margin-top: 0
    .fw-frame
      height: 96px

  .fw-undo
    min-height: 36px

  .fw-right :deep(.mb)
    height: 52px
    min-width: 200px
  .fw-right :deep(.mb.is-quiet)
    height: 44px

  .fw-fact :deep(.mpa-in)
    min-height: 38px
    padding-top: 2px
    padding-bottom: 2px
  .fw-fact
    min-height: 38px

  .fw-coins
    max-width: 17rem

  .fw
    gap: 8px
    padding: 0 0 4px

  .fw-table, .fw-right
    gap: 8px

  .fw-coins
    max-width: 18rem

@keyframes fw-lay
  from
    opacity: 0
    transform: translateY(-18px) rotate(-1.5deg)
  to
    opacity: 1
    transform: translateY(0) rotate(0)

@keyframes fw-drop
  from
    opacity: 0
    transform: translateY(-14px)
  to
    opacity: 1
    transform: translateY(0)

@media (prefers-reduced-motion: reduce)
  .fw-fact, .fw-name
    animation: none
</style>
