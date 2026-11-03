<script setup lang="ts">
/**
 * The family activity (Plus): one device in the middle, two to four teams take turns. One person of the team sees a word from the
 * adventures and explains it, draws it (on paper) or acts it out; the team guesses until the time is up. A point for every word that was
 * guessed. Everything runs on the device; the words are in `data/activityWords.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { ranking } from '@/utils/familyQuiz'
import {
  ACTIVITY_MODES,
  CARD_CHOICES,
  SECOND_CHOICES,
  TEAM_CHOICES,
  buildDeck,
  teamOnTurn,
  wordsFor,
  type ActivityCard,
  type ActivityKind,
  type ActivityMode
} from '@/utils/familyActivity'
import type { ActivityLocale } from '@/data/activityWords'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const teamCount = ref<number>(2)
const cardsEach = ref<number>(5)
const seconds = ref<number>(60)
const kind = ref<ActivityKind>('all')
const modes = reactive<Record<ActivityMode, boolean>>({ explain: true, draw: true, act: true })
const teamNames = reactive<string[]>(['', '', '', ''])
const KINDS: ActivityKind[] = ['all', 'person', 'thing']

const nameOf = (i: number) => teamNames[i]?.trim() || t('app.family.team', { n: i + 1 })
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
const timeUp = computed(() => phase.value === 'card' && left.value <= 0)
const placing = computed(() => ranking(names.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = undefined
}
onBeforeUnmount(stopTimer)

function start() {
  if (totalCards.value < 1 || !allowed.value.length) return
  deck.value = buildDeck(words.value, totalCards.value, allowed.value)
  scores.value = Array.from({ length: teamCount.value }, () => 0)
  index.value = 0
  phase.value = 'handover'
}

/** The card is shown and the time runs (by the clock, so it stays right when the screen sleeps a moment). */
function showCard() {
  left.value = seconds.value
  deadline = Date.now() + seconds.value * 1000
  stopTimer()
  timer = setInterval(() => {
    left.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (left.value <= 0) stopTimer()
  }, 250)
  phase.value = 'card'
}

/** `guessedBy` is the team that guessed the word (any team may guess, the point goes to it), or `null` when nobody did. */
function answer(guessedBy: number | null) {
  stopTimer()
  if (guessedBy !== null) scores.value[guessedBy] = (scores.value[guessedBy] ?? 0) + 1
  if (isLast.value) {
    phase.value = 'result'
    return
  }
  index.value++
  phase.value = 'handover'
}

function again() {
  start()
}
function change() {
  stopTimer()
  phase.value = 'setup'
}
const share = computed(() => (seconds.value ? Math.max(0, Math.min(1, left.value / seconds.value)) : 0))
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.activity.title')" :subtitle="phase === 'setup' ? t('app.activity.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(class="fa-wrap")
      div(v-if="locked" class="fa-card")
        p(class="fa-explain") {{ t('app.activity.locked') }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      div(v-else-if="phase === 'setup'" class="fa-card")
        p(class="fa-explain") {{ t('app.activity.explain') }}
        p(class="fa-explain") {{ t('app.activity.pointRule') }}
        h3(class="fa-h") {{ t('app.activity.teams') }}
        div(class="fa-chips" role="radiogroup")
          button(v-for="n in TEAM_CHOICES" :key="n" type="button" role="radio" :aria-checked="teamCount === n" :class="['fa-chip', { 'is-on': teamCount === n }]" @click="teamCount = n") {{ n }}
        div(class="fa-names")
          input(
            v-for="(_, i) in names"
            :key="i"
            v-model="teamNames[i]"
            class="fa-input"
            type="text"
            maxlength="16"
            :placeholder="t('app.family.team', { n: i + 1 })"
            :aria-label="t('app.family.team', { n: i + 1 })"
          )
        h3(class="fa-h") {{ t('app.activity.words') }}
        div(class="fa-chips" role="radiogroup")
          button(v-for="k in KINDS" :key="k" type="button" role="radio" :aria-checked="kind === k" :class="['fa-chip', 'is-wide', { 'is-on': kind === k }]" @click="kind = k") {{ t(`app.activity.kind_${k}`) }}
        h3(class="fa-h") {{ t('app.activity.ways') }}
        div(class="fa-ways")
          label(v-for="m in ACTIVITY_MODES" :key="m" class="fa-way")
            input(v-model="modes[m]" type="checkbox")
            span
              strong {{ t(`app.activity.mode_${m}`) }}
              small {{ t(`app.activity.modeHint_${m}`) }}
        p(v-if="!allowed.length" class="fa-error" role="alert") {{ t('app.activity.noWay') }}
        h3(class="fa-h") {{ t('app.activity.cards') }}
        div(class="fa-chips" role="radiogroup")
          button(v-for="n in CARD_CHOICES" :key="n" type="button" role="radio" :aria-checked="cardsEach === n" :class="['fa-chip', { 'is-on': cardsEach === n }]" @click="cardsEach = n") {{ n }}
        h3(class="fa-h") {{ t('app.activity.time') }}
        div(class="fa-chips" role="radiogroup")
          button(v-for="n in SECOND_CHOICES" :key="n" type="button" role="radio" :aria-checked="seconds === n" :class="['fa-chip', { 'is-on': seconds === n }]" @click="seconds = n") {{ t('app.activity.seconds', { n }) }}
        p(class="fa-note") {{ t('app.activity.total', { n: totalCards }) }}
        AdvButton(tone="gold" :disabled="totalCards < 1 || !allowed.length" @click="start") {{ t('app.family.start') }}

      //- ===== the device goes to the team =====
      div(v-else-if="phase === 'handover'" class="fa-card fa-center")
        p(class="fa-count") {{ t('app.activity.cardOf', { n: index + 1, total: deck.length }) }}
        h2(class="fa-team") {{ t('app.activity.turn', { team: teamName }) }}
        p(class="fa-explain") {{ t('app.activity.handover') }}
        AdvButton(tone="gold" @click="showCard") {{ t('app.activity.show') }}

      //- ===== the word =====
      div(v-else-if="phase === 'card'" class="fa-card fa-center")
        p(class="fa-count") {{ teamName }} · {{ t('app.activity.cardOf', { n: index + 1, total: deck.length }) }}
        p(class="fa-mode") {{ t(`app.activity.mode_${card?.mode ?? 'explain'}`) }}
        h2(class="fa-word") {{ card?.word }}
        p(class="fa-explain") {{ t(`app.activity.rule_${card?.mode ?? 'explain'}`) }}
        div(class="fa-bar" aria-hidden="true")
          span(class="fa-bar-fill" :style="{ width: Math.round(share * 100) + '%' }")
        p(:class="['fa-left', { 'is-up': timeUp }]" role="timer") {{ timeUp ? t('app.activity.timeUp') : t('app.activity.secondsLeft', { n: left }) }}
        h3(class="fa-h") {{ t('app.activity.whoGuessed') }}
        div(class="fa-actions")
          AdvButton(v-for="(n, i) in names" :key="i" :tone="i === team ? 'gold' : 'blau'" @click="answer(i)") {{ t('app.activity.guessedBy', { team: n }) }}
          AdvButton(tone="blau" @click="answer(null)") {{ t('app.activity.wrong') }}

      //- ===== the end =====
      div(v-else class="fa-card fa-center")
        h2(class="fa-team") {{ winners.length > 1 ? t('app.activity.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.activity.winner', { name: winners[0]?.name ?? '' }) }}
        ol(class="fa-rank")
          li(v-for="p in placing" :key="p.name + p.rank" :class="{ 'is-first': p.rank === 1 }")
            span(class="fa-rank-n") {{ p.rank }}
            span(class="fa-rank-name") {{ p.name }}
            span(class="fa-rank-score") {{ t('app.family.points', p.score) }}
        div(class="fa-actions")
          AdvButton(tone="gold" @click="again") {{ t('app.family.again') }}
          AdvButton(tone="blau" @click="change") {{ t('app.activity.change') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fa-wrap
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fa-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fa-center
  align-items: center
  text-align: center

.fa-explain
  margin: 0
  line-height: 1.5

.fa-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fa-note
  margin: 4px 0 8px
  color: var(--lk-muted)
  line-height: 1.4

.fa-error
  margin: 0
  color: #c8553d
  font-weight: 700

.fa-chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.fa-chip
  flex: 1 1 56px
  min-height: 48px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  font-size: 1.02rem
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-wide
    flex-basis: 96px

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fa-names
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.fa-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

.fa-ways
  display: grid
  gap: 8px

.fa-way
  display: flex
  align-items: flex-start
  gap: 10px
  padding: 10px 12px
  border-radius: 14px
  background: var(--lk-surface-2)
  cursor: pointer

  input
    flex: none
    width: 22px
    height: 22px
    margin-top: 2px
    accent-color: var(--lk-accent)

  span
    display: grid
    gap: 2px

  small
    color: var(--lk-muted)
    line-height: 1.35

.fa-count
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted)

.fa-team
  margin: 6px 0
  font-size: 1.6rem
  font-weight: 900
  line-height: 1.2

.fa-mode
  margin: 6px 0 0
  padding: 3px 14px
  border-radius: 999px
  background: rgba(230, 184, 64, 0.25)
  box-shadow: inset 0 0 0 1px #e0bd62
  font-size: 0.85rem
  font-weight: 800
  text-transform: uppercase
  letter-spacing: 0.04em

.fa-word
  margin: 12px 0
  font-size: 2.1rem
  font-weight: 900
  line-height: 1.15
  overflow-wrap: anywhere

.fa-bar
  width: 100%
  height: 12px
  margin-top: 6px
  border-radius: 999px
  background: rgba(0, 0, 0, 0.1)
  overflow: hidden

.fa-bar-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-gold)
  transition: width 260ms linear

.fa-left
  margin: 4px 0 8px
  font-size: 1.2rem
  font-weight: 800

  &.is-up
    color: #c8553d

.fa-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 10px

.fa-rank
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

.fa-rank-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fa-rank-name
  flex: 1
  font-weight: 800

.fa-rank-score
  font-weight: 700
  color: var(--lk-muted)
</style>
