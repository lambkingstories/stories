<script setup lang="ts">
/**
 * The order race (Plus): a few stages of one adventure are shown mixed up (their titles), and the person on turn taps them in the order in
 * which they happen in the story. One point for every title on the right place, and a bonus for the whole row. One device is passed
 * around (or one person plays alone). The right order is the order of the stages in the adventure, so nothing is made up.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import { journeys } from '@/data/adventures'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useUserName from '@/use/useUserName'
import { MAX_PLAYERS, ranking } from '@/utils/familyQuiz'
import {
  ORDER_COUNTS,
  ORDER_ROUND_CHOICES,
  buildOrderRound,
  mixUp,
  orderJourneys,
  scoreOrder,
  type OrderRound,
  type OrderScore
} from '@/utils/orderRace'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = reactive<string[]>([])
const playerCount = ref(2)
const rounds = ref<number>(1)
const count = ref<number>(5)
const only = ref('')
const playerChoices = Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  for (let i = 0; i < MAX_PLAYERS; i++) names[i] = saved[i] || (i === 0 && hasCustomName.value ? displayName.value : '')
  if (saved.filter(Boolean).length >= 1) playerCount.value = Math.min(MAX_PLAYERS, Math.max(1, saved.filter(Boolean).length))
})

const nameOf = (i: number) => names[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))
const journeyOptions = computed(() => orderJourneys(journeys, count.value))
const canStart = computed(() => journeyOptions.value.length > 0 && (!only.value || journeyOptions.value.includes(only.value)))
const totalTurns = computed(() => playerCount.value * rounds.value)

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'play' | 'check' | 'result'
const phase = ref<Phase>('setup')
const turn = ref(0)
const scores = ref<number[]>([])
const round = ref<OrderRound | null>(null)
const mixed = ref<string[]>([])
const picked = ref<string[]>([])
const result = ref<OrderScore | null>(null)

const who = computed(() => turn.value % playerCount.value)
const whoName = computed(() => players.value[who.value] ?? '')
const isLast = computed(() => turn.value >= totalTurns.value - 1)
const left = computed(() => mixed.value.filter((x) => !picked.value.includes(x)))
const placing = computed(() => ranking(players.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))

function newRound() {
  round.value = buildOrderRound(journeys, count.value, Math.random, only.value)
  mixed.value = round.value ? mixUp(round.value.titles) : []
  picked.value = []
  result.value = null
}

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  if (!canStart.value) return
  scores.value = Array.from({ length: playerCount.value }, () => 0)
  turn.value = 0
  phase.value = 'handover'
}

function go() {
  newRound()
  if (round.value) phase.value = 'play'
}

const pick = (title: string) => {
  if (!picked.value.includes(title)) picked.value = [...picked.value, title]
}
const undo = () => (picked.value = picked.value.slice(0, -1))
const clear = () => (picked.value = [])

function check() {
  if (!round.value || picked.value.length !== round.value.titles.length) return
  result.value = scoreOrder(round.value.titles, picked.value)
  scores.value[who.value] = (scores.value[who.value] ?? 0) + result.value.points
  phase.value = 'check'
}

function next() {
  if (isLast.value) {
    phase.value = 'result'
    return
  }
  turn.value++
  phase.value = 'handover'
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.order.title')" :subtitle="phase === 'setup' ? t('app.order.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(class="fo-wrap")
      div(v-if="locked" class="fo-card")
        p(class="fo-explain") {{ t('app.order.locked') }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      div(v-else-if="phase === 'setup'" class="fo-card")
        p(class="fo-explain") {{ t('app.order.explain') }}
        h3(class="fo-h") {{ t('app.order.howMany') }}
        div(class="fo-chips" role="radiogroup")
          button(v-for="n in playerChoices" :key="n" type="button" role="radio" :aria-checked="playerCount === n" :class="['fo-chip', { 'is-on': playerCount === n }]" @click="playerCount = n") {{ n }}
        div(class="fo-names")
          input(
            v-for="(_, i) in players"
            :key="i"
            v-model="names[i]"
            class="fo-input"
            type="text"
            maxlength="16"
            :placeholder="t('app.family.player', { n: i + 1 })"
            :aria-label="t('app.family.player', { n: i + 1 })"
          )
        h3(class="fo-h") {{ t('app.order.count') }}
        div(class="fo-chips" role="radiogroup")
          button(v-for="n in ORDER_COUNTS" :key="n" type="button" role="radio" :aria-checked="count === n" :class="['fo-chip', { 'is-on': count === n }]" @click="count = n") {{ n }}
        h3(class="fo-h") {{ t('app.order.from') }}
        select(v-model="only" class="fo-input" :aria-label="t('app.order.from')")
          option(value="") {{ t('app.family.eveningAll') }}
          option(v-for="j in journeyOptions" :key="j" :value="j") {{ j }}
        h3(class="fo-h") {{ t('app.order.rounds') }}
        div(class="fo-chips" role="radiogroup")
          button(v-for="r in ORDER_ROUND_CHOICES" :key="r" type="button" role="radio" :aria-checked="rounds === r" :class="['fo-chip', { 'is-on': rounds === r }]" @click="rounds = r") {{ r }}
        p(class="fo-note") {{ t('app.order.rule') }}
        AdvButton(tone="gold" :disabled="!canStart" @click="start") {{ t('app.family.start') }}

      //- ===== whose turn =====
      div(v-else-if="phase === 'handover'" class="fo-card fo-center")
        p(class="fo-count") {{ t('app.order.turnOf', { n: turn + 1, total: totalTurns }) }}
        h2(class="fo-big") {{ t('app.family.turn', { name: whoName }) }}
        p(class="fo-explain") {{ t('app.order.handover') }}
        AdvButton(tone="gold" @click="go") {{ t('app.order.show') }}

      //- ===== bring the titles in order =====
      div(v-else-if="phase === 'play'" class="fo-card")
        p(class="fo-count fo-center-text") {{ whoName }} · {{ t('app.family.fromAdventure', { name: round?.journey ?? '' }) }}
        p(class="fo-explain") {{ t('app.order.task') }}
        ol(class="fo-picked" :aria-label="t('app.order.yours')")
          li(v-for="(p, i) in picked" :key="p") {{ p }}
          li(v-for="n in Math.max(0, mixed.length - picked.length)" :key="'e' + n" class="is-empty") …
        div(class="fo-left")
          button(v-for="x in left" :key="x" type="button" class="fo-title" @click="pick(x)") {{ x }}
        div(class="fo-row")
          button(type="button" class="fo-link" :disabled="!picked.length" @click="undo") {{ t('app.order.undo') }}
          button(type="button" class="fo-link" :disabled="!picked.length" @click="clear") {{ t('app.order.clear') }}
        AdvButton(tone="gold" :disabled="picked.length !== mixed.length" @click="check") {{ t('app.order.check') }}

      //- ===== what was right =====
      div(v-else-if="phase === 'check'" class="fo-card")
        h2(class="fo-big fo-center-text") {{ result?.all ? t('app.order.allRight') : t('app.order.someRight', { n: result?.right ?? 0, total: round?.titles.length ?? 0 }) }}
        ol(class="fo-compare")
          li(v-for="(title, i) in round?.titles ?? []" :key="title" :class="picked[i] === title ? 'is-right' : 'is-wrong'")
            span(class="fo-compare-n") {{ i + 1 }}
            span
              strong {{ title }}
              small(v-if="picked[i] !== title") {{ t('app.order.youPut', { title: picked[i] ?? '' }) }}
        p(class="fo-explain fo-center-text") {{ t('app.order.gotPoints', { name: whoName, points: t('app.family.points', result?.points ?? 0) }) }}
        AdvButton(tone="gold" @click="next") {{ isLast ? t('app.family.result') : t('app.order.nextTurn') }}

      //- ===== the end =====
      div(v-else class="fo-card fo-center")
        h2(class="fo-big") {{ playerCount === 1 ? t('app.order.soloEnd', { points: t('app.family.points', scores[0] ?? 0) }) : winners.length > 1 ? t('app.family.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners[0]?.name ?? '' }) }}
        ol(v-if="playerCount > 1" class="fo-rank")
          li(v-for="p in placing" :key="p.name + p.rank" :class="{ 'is-first': p.rank === 1 }")
            span(class="fo-rank-n") {{ p.rank }}
            span(class="fo-rank-name") {{ p.name }}
            span(class="fo-rank-score") {{ t('app.family.points', p.score) }}
        div(class="fo-actions")
          AdvButton(tone="gold" @click="start") {{ t('app.family.again') }}
          AdvButton(tone="blau" @click="phase = 'setup'") {{ t('app.activity.change') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fo-wrap
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fo-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fo-center
  align-items: center
  text-align: center

.fo-center-text
  text-align: center

.fo-explain
  margin: 0
  line-height: 1.5

.fo-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fo-note
  margin: 4px 0 8px
  color: var(--lk-muted)
  line-height: 1.4

.fo-chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.fo-chip
  flex: 1 1 48px
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

.fo-names
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.fo-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

.fo-count
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted)

.fo-big
  margin: 6px 0
  font-size: 1.5rem
  font-weight: 900
  line-height: 1.2

.fo-picked
  margin: 0
  padding: 0
  list-style: none
  display: grid
  gap: 6px
  counter-reset: n

  li
    counter-increment: n
    display: flex
    align-items: center
    gap: 10px
    min-height: 46px
    padding: 6px 12px
    border-radius: 14px
    background: rgba(230, 184, 64, 0.22)
    font-weight: 800

    &::before
      content: counter(n)
      flex: none
      display: grid
      place-items: center
      width: 26px
      height: 26px
      border-radius: 50%
      background: var(--lk-surface)
      font-size: 0.85rem

    &.is-empty
      background: var(--lk-surface-2)
      color: var(--lk-muted)
      font-weight: 600
      border: 1px dashed var(--lk-line)

.fo-left
  display: grid
  gap: 8px
  margin-top: 6px

.fo-title
  min-height: 52px
  padding: 8px 14px
  border: 2px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  font-size: 1rem
  text-align: left
  cursor: pointer
  box-shadow: var(--lk-shadow)
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.985)

.fo-row
  display: flex
  justify-content: center
  gap: 18px

.fo-link
  min-height: 36px
  padding: 0 10px
  border: none
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 700
  text-decoration: underline
  cursor: pointer

  &:disabled
    opacity: 0.4

.fo-compare
  margin: 0
  padding: 0
  list-style: none
  display: grid
  gap: 8px

  li
    display: flex
    align-items: center
    gap: 10px
    padding: 8px 12px
    border-radius: 14px
    border: 2px solid var(--lk-line)

    &.is-right
      border-color: #2f8f5b
      background: rgba(47, 143, 91, 0.14)

    &.is-wrong
      border-color: #c8553d
      background: rgba(200, 85, 61, 0.12)

  small
    display: block
    color: var(--lk-muted)

.fo-compare-n
  flex: none
  display: grid
  place-items: center
  width: 28px
  height: 28px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fo-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 10px

.fo-rank
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

.fo-rank-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fo-rank-name
  flex: 1
  font-weight: 800

.fo-rank-score
  font-weight: 700
  color: var(--lk-muted)
</style>
