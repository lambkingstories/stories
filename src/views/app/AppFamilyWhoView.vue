<script setup lang="ts">
/**
 * "Wer bin ich?" (Plus): one person guesses who a card shows by asking questions that can be answered with yes or no, but does not look
 * at the screen. Another person holds the device, sees the person and a few facts from the Bible and answers. The fewer questions it
 * takes, the more points. Everything runs on the device; the people are in `data/whoAmI.ts`.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { MAX_PLAYERS, MIN_PLAYERS, ranking } from '@/utils/familyQuiz'
import { MAX_QUESTIONS, WHO_ROUND_CHOICES, buildWhoDeck, cardsFor, guesserOf, pointsFor } from '@/utils/whoAmI'
import { WHO_PEOPLE, type WhoPerson } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import useUserName from '@/use/useUserName'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = reactive<string[]>([])
const playerCount = ref(3)
const rounds = ref<number>(1)
const playerChoices = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  for (let i = 0; i < MAX_PLAYERS; i++) names[i] = saved[i] || (i === 0 && hasCustomName.value ? displayName.value : '')
  if (saved.filter(Boolean).length >= MIN_PLAYERS) playerCount.value = Math.min(MAX_PLAYERS, saved.filter(Boolean).length)
})

const nameOf = (i: number) => names[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))
const totalCards = computed(() => cardsFor(playerCount.value, rounds.value, WHO_PEOPLE.length))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'card' | 'verdict' | 'result'
const phase = ref<Phase>('setup')
const deck = ref<WhoPerson[]>([])
const index = ref(0)
const scores = ref<number[]>([])
const asked = ref(0)
const lastPoints = ref(0)

const card = computed(() => deck.value[index.value])
const guesser = computed(() => guesserOf(index.value, playerCount.value))
const guesserName = computed(() => players.value[guesser.value] ?? '')
const isLast = computed(() => index.value >= deck.value.length - 1)
const placing = computed(() => ranking(players.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
const nowPoints = computed(() => pointsFor(asked.value))
const cardName = computed(() => (card.value ? card.value.name[lang.value] : ''))
const cardFacts = computed(() => (card.value ? card.value.facts[lang.value] : []))

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  if (totalCards.value < 1) return
  deck.value = buildWhoDeck(totalCards.value)
  scores.value = Array.from({ length: playerCount.value }, () => 0)
  index.value = 0
  phase.value = 'handover'
}

function show() {
  asked.value = 0
  phase.value = 'card'
}

/** A question (or a wrong guess) was asked. */
const ask = () => (asked.value = Math.min(MAX_QUESTIONS, asked.value + 1))
const undo = () => (asked.value = Math.max(0, asked.value - 1))

function finish(guessed: boolean) {
  lastPoints.value = guessed ? pointsFor(asked.value) : 0
  scores.value[guesser.value] = (scores.value[guesser.value] ?? 0) + lastPoints.value
  phase.value = 'verdict'
}

function next() {
  if (isLast.value) {
    phase.value = 'result'
    return
  }
  index.value++
  phase.value = 'handover'
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.who.title')" :subtitle="phase === 'setup' ? t('app.who.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(class="fw-wrap")
      div(v-if="locked" class="fw-card")
        p(class="fw-explain") {{ t('app.who.locked') }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      div(v-else-if="phase === 'setup'" class="fw-card")
        p(class="fw-explain") {{ t('app.who.explain') }}
        ul(class="fw-rules")
          li(v-for="n in 4" :key="n") {{ t(`app.who.rule${n}`, { max: MAX_QUESTIONS }) }}
        h3(class="fw-h") {{ t('app.family.howMany') }}
        div(class="fw-chips" role="radiogroup")
          button(v-for="n in playerChoices" :key="n" type="button" role="radio" :aria-checked="playerCount === n" :class="['fw-chip', { 'is-on': playerCount === n }]" @click="playerCount = n") {{ n }}
        h3(class="fw-h") {{ t('app.family.names') }}
        div(:class="['fw-names', { 'is-two': playerCount > 3 }]")
          input(
            v-for="(_, i) in players"
            :key="i"
            v-model="names[i]"
            class="fw-input"
            type="text"
            maxlength="16"
            :placeholder="t('app.family.player', { n: i + 1 })"
            :aria-label="t('app.family.player', { n: i + 1 })"
          )
        h3(class="fw-h") {{ t('app.who.rounds') }}
        div(class="fw-chips" role="radiogroup")
          button(v-for="r in WHO_ROUND_CHOICES" :key="r" type="button" role="radio" :aria-checked="rounds === r" :class="['fw-chip', { 'is-on': rounds === r }]" @click="rounds = r") {{ r }}
        p(class="fw-note") {{ t('app.who.total', { n: totalCards }) }}
        AdvButton(tone="gold" :disabled="totalCards < 1" @click="start") {{ t('app.family.start') }}

      //- ===== the guesser looks away =====
      div(v-else-if="phase === 'handover'" class="fw-card fw-center")
        p(class="fw-count") {{ t('app.who.cardOf', { n: index + 1, total: deck.length }) }}
        h2(class="fw-big") {{ t('app.who.turn', { name: guesserName }) }}
        p(class="fw-explain") {{ t('app.who.handover', { name: guesserName }) }}
        AdvButton(tone="gold" @click="show") {{ t('app.who.show') }}

      //- ===== the card: only for the people who answer =====
      div(v-else-if="phase === 'card'" class="fw-card fw-center")
        p(class="fw-warn") {{ t('app.who.notFor', { name: guesserName }) }}
        h2(class="fw-person") {{ cardName }}
        div(class="fw-facts")
          span(class="fw-facts-title") {{ t('app.who.facts') }}
          ul
            li(v-for="f in cardFacts" :key="f") {{ f }}
        div(class="fw-counter")
          span(class="fw-counter-n") {{ asked }}
            small {{ t('app.who.ofMax', { max: MAX_QUESTIONS }) }}
          span(class="fw-counter-pts") {{ t('app.who.pointsNow', { n: nowPoints }) }}
        p(v-if="asked >= MAX_QUESTIONS" class="fw-warn") {{ t('app.who.lastGuess', { name: guesserName }) }}
        div(class="fw-actions")
          AdvButton(tone="blau" :disabled="asked >= MAX_QUESTIONS" @click="ask") {{ t('app.who.askedOne') }}
          button(type="button" class="fw-undo" :disabled="asked <= 0" @click="undo") {{ t('app.who.undo') }}
          AdvButton(tone="gold" @click="finish(true)") {{ t('app.who.guessed', { name: guesserName }) }}
          AdvButton(tone="blau" @click="finish(false)") {{ t('app.who.giveUp') }}

      //- ===== who it was =====
      div(v-else-if="phase === 'verdict'" class="fw-card fw-center")
        p(class="fw-count") {{ t('app.who.itWas') }}
        h2(class="fw-person") {{ cardName }}
        p(class="fw-explain") {{ lastPoints > 0 ? t('app.who.gotPoints', { name: guesserName, points: t('app.family.points', lastPoints) }) : t('app.who.gotNothing', { name: guesserName }) }}
        AdvButton(tone="gold" @click="next") {{ isLast ? t('app.family.result') : t('app.who.nextCard') }}

      //- ===== the end =====
      div(v-else class="fw-card fw-center")
        h2(class="fw-big") {{ winners.length > 1 ? t('app.family.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners[0]?.name ?? '' }) }}
        ol(class="fw-rank")
          li(v-for="p in placing" :key="p.name + p.rank" :class="{ 'is-first': p.rank === 1 }")
            span(class="fw-rank-n") {{ p.rank }}
            span(class="fw-rank-name") {{ p.name }}
            span(class="fw-rank-score") {{ t('app.family.points', p.score) }}
        div(class="fw-actions")
          AdvButton(tone="gold" @click="start") {{ t('app.family.again') }}
          AdvButton(tone="blau" @click="phase = 'setup'") {{ t('app.activity.change') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fw-wrap
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fw-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fw-center
  align-items: center
  text-align: center

.fw-explain
  margin: 0
  line-height: 1.5

.fw-rules
  margin: 0
  padding-left: 20px
  display: grid
  gap: 4px
  line-height: 1.4

.fw-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fw-note
  margin: 4px 0 8px
  color: var(--lk-muted)
  line-height: 1.4

.fw-chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.fw-chip
  flex: 1 1 56px
  min-height: 48px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  font-size: 1.05rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fw-names
  display: grid
  gap: 8px

  &.is-two
    grid-template-columns: 1fr 1fr

.fw-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

.fw-count
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted)

.fw-big
  margin: 6px 0
  font-size: 1.6rem
  font-weight: 900
  line-height: 1.2

.fw-warn
  margin: 0
  padding: 4px 14px
  border-radius: 999px
  background: rgba(200, 85, 61, 0.14)
  color: #8a3320
  font-size: 0.88rem
  font-weight: 800

.fw-person
  margin: 8px 0
  font-size: 2.1rem
  font-weight: 900
  line-height: 1.15
  overflow-wrap: anywhere

.fw-facts
  width: 100%
  padding: 10px 14px
  border-radius: 16px
  background: rgba(230, 184, 64, 0.2)
  text-align: left

  ul
    margin: 4px 0 0
    padding-left: 20px
    display: grid
    gap: 3px
    line-height: 1.4

.fw-facts-title
  font-size: 0.74rem
  font-weight: 800
  letter-spacing: 0.04em
  text-transform: uppercase
  color: var(--lk-muted)

.fw-counter
  display: flex
  align-items: baseline
  justify-content: center
  gap: 14px
  margin-top: 6px

.fw-counter-n
  font-size: 2rem
  font-weight: 900

  small
    margin-left: 6px
    font-size: 0.9rem
    font-weight: 700
    color: var(--lk-muted)

.fw-counter-pts
  font-weight: 800
  color: var(--lk-accent)

.fw-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 8px

.fw-undo
  justify-self: center
  min-height: 36px
  padding: 0 14px
  border: none
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 700
  text-decoration: underline
  cursor: pointer

  &:disabled
    opacity: 0.4

.fw-rank
  width: 100%
  margin: 8px 0 0
  padding: 0
  list-style: none
  display: grid
  gap: 8px

  li
    display: flex
    align-items: center
    gap: 12px
    padding: 10px 14px
    border-radius: 16px
    background: var(--lk-surface-2)
    text-align: left

    &.is-first
      background: rgba(233, 196, 106, 0.3)
      border: 1px solid var(--lk-gold)

.fw-rank-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fw-rank-name
  flex: 1
  font-weight: 800

.fw-rank-score
  font-weight: 700
  color: var(--lk-muted)
</style>
