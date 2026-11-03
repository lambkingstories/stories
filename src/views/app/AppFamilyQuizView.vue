<script setup lang="ts">
/**
 * The family quiz in three forms, chosen on this page (all of it on the device, nothing is sent anywhere):
 *  - `grow` (free): two to eight people pass the device around and answer questions from the adventures, one after the other. The
 *    questions come from the stages and exams the child has been through, so they grow with the adventures.
 *  - `evening` (Plus): the same, but with all the questions of all adventures (or of one), and, if wished, in two teams (the people
 *    sit alternately: 1st, 3rd … against 2nd, 4th …).
 *  - `code` (Plus): every person plays on their own phone. A short round code decides which questions come in which order, so phones
 *    with the same code play the same round; there is also a "quiz of the day" (the date is the code). Points are compared at the table.
 * Every question says which adventure it comes from; at the end the people are ranked. Names are only remembered on this device.
 */
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import { journeys } from '@/data/adventures'
import { isJourneyPlusLocked } from '@/utils/adventureAccess'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useAdventure from '@/use/useAdventure'
import useUserName from '@/use/useUserName'
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_CHOICES,
  buildPool,
  pickQuestions,
  playerOf,
  ranking,
  roundsFor,
  teamOf,
  teamScores,
  type FamilyQuestion
} from '@/utils/familyQuiz'
import { DAILY_QUESTIONS, ROUND_QUESTIONS, dailySeed, dayKey, mulberry32, newCode, readCode, showCode } from '@/utils/familyCode'

type Mode = 'grow' | 'evening' | 'code'
const MODES: Mode[] = ['grow', 'evening', 'code']
/** How the family plays: with the questions of the adventures the child has been through, with all of them, or on several phones. */
const mode = ref<Mode>('grow')

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const adv = useAdventure()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

/** The quiz evening and the round code are Plus; the first quiz is free. */
const locked = computed(() => mode.value !== 'grow' && PREMIUM_TEASER && !hasFeature('family'))

const NAMES_KEY = 'lk-family-names'
const DAILY_KEY = 'lk-daily-quiz-v1'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = reactive<string[]>([])
const playerCount = ref(2)
const rounds = ref<number>(5)
const teams = ref(false)
const journeyFilter = ref('')
const codeInput = ref('')
const codeError = ref<'' | 'format' | 'version'>('')
const roundCode = ref('')
const isDaily = ref(false)
const dailyResult = ref<{ day: string; score: number; total: number } | null>(null)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  for (let i = 0; i < MAX_PLAYERS; i++) {
    names[i] = saved[i] || (i === 0 && hasCustomName.value ? displayName.value : '')
  }
  if (saved.length >= MIN_PLAYERS) playerCount.value = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, saved.filter(Boolean).length))
  try {
    const d = JSON.parse(localStorage.getItem(DAILY_KEY) ?? 'null')
    if (d && typeof d.day === 'string' && Number.isFinite(d.score) && Number.isFinite(d.total)) dailyResult.value = d
  } catch {
    // no result of an earlier day is shown
  }
})

const openJourneys = computed(() => journeys.filter((j) => !isJourneyPlusLocked(j.id)))
/** Every question of every adventure, in the order of the data (the same on every phone with this app version). */
const allPool = computed(() => buildPool(journeys))
const journeyOptions = computed(() => [...new Set(allPool.value.map((q) => q.journey))])
/** The questions of this form: those the child has been through (`grow`), all of them or of one adventure (`evening`), all (`code`). */
const pool = computed(() => {
  if (mode.value === 'code') return allPool.value
  if (mode.value === 'evening') return journeyFilter.value ? allPool.value.filter((q) => q.journey === journeyFilter.value) : allPool.value
  return buildPool(openJourneys.value, {
    stageDone: (jid, sid) => !!adv.stageOf(jid, sid)?.done,
    examDone: (jid) => !!adv.progressOf(jid)?.exam
  })
})
/** All the questions of the open adventures (what the bar below fills up to). */
const poolTotal = computed(() => buildPool(openJourneys.value).length)
const poolShare = computed(() => (poolTotal.value ? Math.min(1, pool.value.length / poolTotal.value) : 0))
/** How many adventures the questions come from, and whether more would come with Plus (said under the setup, so nobody wonders why). */
const poolAdventures = computed(() => new Set(pool.value.map((q) => q.journey)).size)
const moreWithPlus = computed(() => journeys.some((j) => isJourneyPlusLocked(j.id)))
const playerChoices = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)
const nameOf = (i: number) => names[i]?.trim() || t('app.family.player', { n: i + 1 })
/** With the round code every person plays alone on their own phone. */
const count = computed(() => (mode.value === 'code' ? 1 : playerCount.value))
const players = computed(() => Array.from({ length: count.value }, (_, i) => nameOf(i)))
const maxRounds = computed(() => roundsFor(Math.max(...ROUND_CHOICES), playerCount.value, pool.value.length))
const useTeams = computed(() => mode.value === 'evening' && teams.value)
const today = dayKey()

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'ask' | 'reveal' | 'result'
const phase = ref<Phase>('setup')
const questions = ref<FamilyQuestion[]>([])
const index = ref(0)
const scores = ref<number[]>([])
const picked = ref(-1)

const current = computed(() => questions.value[index.value])
const who = computed(() => playerOf(index.value, count.value))
const whoName = computed(() => players.value[who.value] ?? '')
const nextName = computed(() => players.value[playerOf(index.value + 1, count.value)] ?? '')
const isLast = computed(() => index.value >= questions.value.length - 1)
const placing = computed(() => ranking(players.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
const nextLabel = computed(() => {
  if (isLast.value) return t('app.family.result')
  return mode.value === 'code' ? t('app.family.nextQuestion') : t('app.family.nextFor', { name: nextName.value })
})

/** The two teams: who is in them and how many points they have. */
const teamLines = computed(() => {
  const points = teamScores(scores.value)
  return [0, 1].map((k) => ({
    name: t('app.family.team', { n: k + 1 }),
    members: players.value.filter((_, i) => teamOf(i) === k).join(', '),
    points: points[k]!
  }))
})
const teamHeadline = computed(() => {
  const [a, b] = teamLines.value
  if (a!.points === b!.points) return t('app.family.teamTie')
  return t('app.family.teamWinner', { team: (a!.points > b!.points ? a : b)!.name })
})

function saveNames() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
}

function begin(list: FamilyQuestion[], playersCount: number) {
  questions.value = list
  scores.value = Array.from({ length: playersCount }, () => 0)
  index.value = 0
  picked.value = -1
  phase.value = 'ask'
}

function start() {
  saveNames()
  const r = roundsFor(rounds.value, playerCount.value, pool.value.length)
  if (r <= 0) return
  begin(pickQuestions(pool.value, r * playerCount.value), playerCount.value)
}

// the round code: the same code gives the same questions in the same order on every phone
const codeReady = computed(() => allPool.value.length >= ROUND_QUESTIONS)

function startRound(seed: number, n: number) {
  saveNames()
  begin(pickQuestions(allPool.value, n, mulberry32(seed)), 1)
}

function newRound() {
  if (!codeReady.value) return
  const code = newCode(allPool.value.length)
  const r = readCode(code, allPool.value.length)
  if (!r.ok) return
  roundCode.value = r.code
  isDaily.value = false
  startRound(r.seed, ROUND_QUESTIONS)
}

function joinRound() {
  const r = readCode(codeInput.value, allPool.value.length)
  if (!r.ok) {
    codeError.value = r.reason
    return
  }
  codeError.value = ''
  roundCode.value = r.code
  isDaily.value = false
  startRound(r.seed, ROUND_QUESTIONS)
}

function playDaily() {
  if (!codeReady.value) return
  roundCode.value = ''
  isDaily.value = true
  startRound(dailySeed(), DAILY_QUESTIONS)
}

/** The first try of the day counts (so the family compares like with like). */
function saveDaily() {
  if (dailyResult.value?.day === today) return
  const result = { day: today, score: scores.value[0] ?? 0, total: questions.value.length }
  dailyResult.value = result
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(result))
  } catch {
    // the result is only kept until the app is closed
  }
}
const dailyDoneToday = computed(() => dailyResult.value?.day === today)

function choose(i: number) {
  if (phase.value !== 'ask' || !current.value) return
  picked.value = i
  if (i === current.value.answer) scores.value[who.value] = (scores.value[who.value] ?? 0) + 1
  phase.value = 'reveal'
  // the answer and the button to go on may lie under the bottom bar on a small screen
  void nextTick(() => document.querySelector('.fq-reveal')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

function next() {
  if (isLast.value) {
    if (mode.value === 'code' && isDaily.value) saveDaily()
    phase.value = 'result'
    return
  }
  index.value++
  picked.value = -1
  phase.value = 'ask'
}

const right = computed(() => !!current.value && picked.value === current.value.answer)
const letters = ['A', 'B', 'C', 'D', 'E']
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.family.title')" :subtitle="phase === 'setup' ? t('app.family.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(class="fq-wrap")
      //- the three ways to play (only while the game is being set up)
      template(v-if="phase === 'setup'")
        div(class="fq-modes" role="radiogroup" :aria-label="t('app.family.modeLabel')")
          button(v-for="m in MODES" :key="m" type="button" role="radio" :aria-checked="mode === m" :class="['fq-mode', { 'is-on': mode === m }]" @click="mode = m")
            span {{ t(`app.family.mode_${m}`) }}
            PlusBadge(v-if="m !== 'grow' && PREMIUM_TEASER" size="small")
        p(class="fq-mode-text") {{ t(`app.family.modeText_${mode}`) }}

      //- ===== Plus: the evening and the round code ask for Plus first =====
      div(v-if="locked" class="fq-card fq-locked")
        p(class="fq-explain") {{ t(`app.family.locked_${mode}`) }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== the round code: one person, their own phone =====
      div(v-else-if="phase === 'setup' && mode === 'code'" class="fq-card")
        h3(class="fq-h") {{ t('app.family.codeName') }}
        input(v-model="names[0]" class="fq-input" type="text" maxlength="16" :placeholder="t('app.family.player', { n: 1 })" :aria-label="t('app.family.codeName')")

        div(class="fq-block")
          h3(class="fq-h") {{ t('app.family.codeDaily') }}
          p(class="fq-note") {{ dailyDoneToday ? t('app.family.codeDailyDone', { score: dailyResult?.score ?? 0, total: dailyResult?.total ?? 0 }) : t('app.family.codeDailyText', { n: DAILY_QUESTIONS }) }}
          AdvButton(tone="blau" :disabled="!codeReady" @click="playDaily") {{ t('app.family.codeDailyGo') }}

        div(class="fq-block")
          h3(class="fq-h") {{ t('app.family.codeNew') }}
          p(class="fq-note") {{ t('app.family.codeNewText', { n: ROUND_QUESTIONS }) }}
          AdvButton(tone="gold" :disabled="!codeReady" @click="newRound") {{ t('app.family.codeNewGo') }}

        div(class="fq-block")
          h3(class="fq-h") {{ t('app.family.codeJoin') }}
          input(
            v-model="codeInput"
            class="fq-input fq-code-input"
            type="text"
            maxlength="8"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            placeholder="K7M-4QX"
            :aria-label="t('app.family.codeJoin')"
            @keyup.enter="joinRound"
          )
          p(v-if="codeError" class="fq-error" role="alert") {{ t(`app.family.codeError_${codeError}`) }}
          AdvButton(tone="blau" :disabled="!codeInput.trim()" @click="joinRound") {{ t('app.family.codeJoinGo') }}

      //- ===== who plays =====
      div(v-else-if="phase === 'setup'" class="fq-card")
        //- how the questions come: they grow with every stage and exam the child has been through
        div(v-if="mode === 'grow'" class="fq-unlock" role="group")
          span(class="fq-unlock-n") {{ pool.length }}
            small {{ t('app.family.unlockOf', { total: poolTotal }) }}
          span(class="fq-unlock-bar" aria-hidden="true")
            span(class="fq-unlock-fill" :style="{ width: Math.round(poolShare * 100) + '%' }")
          span(class="fq-unlock-text") {{ t('app.family.unlockText') }}
        p(v-else-if="mode === 'evening'" class="fq-explain") {{ t('app.family.eveningExplain', { n: pool.length }) }}
        p(v-if="!pool.length" class="fq-empty") {{ t('app.family.empty') }}
        template(v-else)
          template(v-if="mode === 'evening'")
            h3(class="fq-h") {{ t('app.family.eveningFrom') }}
            select(v-model="journeyFilter" class="fq-input fq-select" :aria-label="t('app.family.eveningFrom')")
              option(value="") {{ t('app.family.eveningAll') }}
              option(v-for="j in journeyOptions" :key="j" :value="j") {{ j }}
          h3(class="fq-h") {{ t('app.family.howMany') }}
          div(class="fq-chips fq-chips-many" role="radiogroup")
            button(v-for="n in playerChoices" :key="n" type="button" role="radio" :aria-checked="playerCount === n" :class="['fq-chip', { 'is-on': playerCount === n }]" @click="playerCount = n") {{ n }}
          h3(class="fq-h") {{ t('app.family.names') }}
          div(:class="['fq-names', { 'is-two': playerCount > 3 }]")
            input(
              v-for="(_, i) in players"
              :key="i"
              v-model="names[i]"
              class="fq-input"
              type="text"
              maxlength="16"
              :placeholder="t('app.family.player', { n: i + 1 })"
              :aria-label="t('app.family.player', { n: i + 1 })"
            )
          template(v-if="mode === 'evening'")
            label(class="fq-toggle")
              input(v-model="teams" type="checkbox")
              span {{ t('app.family.teamsOn') }}
            template(v-if="teams")
              p(class="fq-note") {{ t('app.family.teamsNote') }}
              p(v-for="(line, k) in teamLines" :key="k" class="fq-note fq-team-line") {{ line.name }}: {{ line.members }}
          h3(class="fq-h") {{ t('app.family.rounds') }}
          div(class="fq-chips" role="radiogroup")
            button(
              v-for="r in ROUND_CHOICES"
              :key="r"
              type="button"
              role="radio"
              :aria-checked="rounds === r"
              :disabled="r > maxRounds"
              :class="['fq-chip', { 'is-on': rounds === r }]"
              @click="rounds = r"
            ) {{ r }}
          p(class="fq-note") {{ t('app.family.roundsNote', { n: Math.min(rounds, maxRounds) * playerCount }) }}
          p(v-if="mode === 'grow'" class="fq-note") {{ t('app.family.poolNote', poolAdventures) }} {{ moreWithPlus ? t('app.family.poolMore') : '' }}
          AdvButton(tone="gold" :disabled="maxRounds < 1" @click="start") {{ t('app.family.start') }}

      //- ===== a question =====
      div(v-else-if="phase === 'ask' || phase === 'reveal'" class="fq-play")
        p(v-if="mode === 'code'" class="fq-codechip") {{ isDaily ? t('app.family.codeChipDaily') : t('app.family.codeChip', { code: showCode(roundCode) }) }}
        template(v-else)
          div(class="fq-board" aria-hidden="true")
            span(v-for="(p, i) in players" :key="i" :class="['fq-score', { 'is-turn': i === who }]")
              span(class="fq-score-name") {{ p }}
              span(class="fq-score-n") {{ scores[i] }}
          p(class="fq-turn") {{ t('app.family.turn', { name: whoName }) }}
        p(class="fq-count") {{ t('app.family.question', { n: index + 1, total: questions.length }) }}
        p(class="fq-source")
          span(class="fq-source-adv") {{ t('app.family.fromAdventure', { name: current?.journey ?? '' }) }}
          span(v-if="current?.stage" class="fq-source-stage") {{ current.stage }}
        h2(class="fq-q") {{ current?.q }}
        div(class="fq-options")
          button(
            v-for="(o, i) in current?.options ?? []"
            :key="i"
            type="button"
            :class="['fq-opt', { 'is-right': phase === 'reveal' && i === current?.answer, 'is-wrong': phase === 'reveal' && i === picked && i !== current?.answer, 'is-dim': phase === 'reveal' && i !== current?.answer && i !== picked }]"
            :disabled="phase === 'reveal'"
            @click="choose(i)"
          )
            span(class="fq-letter") {{ letters[i] }}
            span {{ o }}
        div(v-if="phase === 'reveal'" class="fq-reveal")
          p(:class="['fq-verdict', right ? 'is-right' : 'is-wrong']" role="status") {{ right ? t('app.family.right') : t('app.family.wrong') }}
          AdvButton(tone="gold" @click="next") {{ nextLabel }}

      //- ===== the end =====
      div(v-else-if="mode === 'code'" class="fq-card fq-end")
        h2(class="fq-winner") {{ t('app.family.codeResult', { n: scores[0] ?? 0, total: questions.length }) }}
        p(v-if="!isDaily" class="fq-codechip is-big") {{ showCode(roundCode) }}
        p(class="fq-note") {{ isDaily ? t('app.family.codeShareDaily') : t('app.family.codeShare') }}
        div(class="fq-actions")
          AdvButton(tone="gold" @click="phase = 'setup'") {{ t('app.family.codeBack') }}

      div(v-else class="fq-card fq-end")
        template(v-if="useTeams")
          h2(class="fq-winner") {{ teamHeadline }}
          ul(class="fq-teams")
            li(v-for="(line, k) in teamLines" :key="k")
              span(class="fq-team-name") {{ line.name }}
              span(class="fq-team-members") {{ line.members }}
              span(class="fq-rank-score") {{ t('app.family.points', line.points) }}
        h2(v-else class="fq-winner") {{ winners.length > 1 ? t('app.family.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners[0]?.name ?? '' }) }}
        ol(class="fq-rank")
          li(v-for="p in placing" :key="p.name + p.rank" :class="{ 'is-first': p.rank === 1 && !useTeams }")
            span(class="fq-rank-n") {{ p.rank }}
            span(class="fq-rank-name") {{ p.name }}
            span(class="fq-rank-score") {{ t('app.family.points', p.score) }}
        div(class="fq-actions")
          AdvButton(tone="gold" @click="start") {{ t('app.family.again') }}
          AdvButton(tone="blau" @click="phase = 'setup'") {{ t('app.family.change') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fq-wrap
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fq-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fq-unlock
  display: flex
  flex-direction: column
  gap: 8px
  padding: 14px 16px
  border-radius: 18px
  background: rgba(230, 184, 64, 0.2)

.fq-unlock-n
  font-size: 1.9rem
  font-weight: 800
  line-height: 1

  small
    margin-left: 8px
    font-size: 0.9rem
    font-weight: 700
    color: var(--lk-muted)

.fq-unlock-bar
  height: 10px
  border-radius: 999px
  background: rgba(0, 0, 0, 0.1)
  overflow: hidden

.fq-unlock-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-gold)

.fq-unlock-text
  font-size: 0.92rem
  line-height: 1.4

.fq-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fq-note, .fq-empty
  margin: 4px 0 8px
  color: var(--lk-muted)
  line-height: 1.4

.fq-chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.fq-chip
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

  &:disabled
    opacity: 0.4

.fq-names
  display: grid
  gap: 8px

  &.is-two
    grid-template-columns: 1fr 1fr

.fq-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

// ── during the game ──
.fq-play
  display: flex
  flex-direction: column
  gap: 10px

.fq-board
  display: flex
  flex-wrap: wrap
  gap: 6px

.fq-score
  flex: 1 1 72px
  display: flex
  flex-direction: column
  align-items: center
  padding: 6px 4px
  border-radius: 14px
  background: var(--lk-surface-2)
  min-width: 0

  &.is-turn
    background: var(--lk-accent)
    color: var(--lk-on-accent)

.fq-score-name
  max-width: 100%
  font-size: 0.78rem
  font-weight: 700
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.fq-score-n
  font-size: 1.2rem
  font-weight: 900

.fq-turn
  margin: 4px 0 0
  text-align: center
  font-size: 1.15rem
  font-weight: 800

.fq-count
  margin: 0
  text-align: center
  font-size: 0.85rem
  color: var(--lk-muted)

.fq-q
  margin: 2px 0 4px
  font-size: 1.35rem
  line-height: 1.3
  font-weight: 800
  text-align: center

.fq-options
  display: grid
  gap: 10px

.fq-opt
  display: flex
  align-items: center
  gap: 12px
  min-height: 60px
  padding: 8px 14px
  border: 2px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  font-size: 1.02rem
  text-align: left
  cursor: pointer
  box-shadow: var(--lk-shadow)
  -webkit-tap-highlight-color: transparent
  transition: transform 120ms ease-out

  &:active:not(:disabled)
    transform: scale(0.985)

  &.is-right
    border-color: #2f8f5b
    background: rgba(47, 143, 91, 0.16)

  &.is-wrong
    border-color: #c8553d
    background: rgba(200, 85, 61, 0.14)

  &.is-dim
    opacity: 0.5

.fq-letter
  flex: none
  display: grid
  place-items: center
  width: 32px
  height: 32px
  border-radius: 50%
  background: var(--lk-surface-2)
  font-weight: 900

.fq-reveal
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  margin-top: 4px

.fq-verdict
  margin: 0
  font-size: 1.3rem
  font-weight: 900

  &.is-right
    color: #2f8f5b

  &.is-wrong
    color: #c8553d

.fq-source
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  margin: 2px 0 0

.fq-source-adv
  padding: 3px 12px
  border-radius: 999px
  background: var(--lk-surface-2)
  box-shadow: inset 0 0 0 1px var(--lk-line)
  font-size: 0.82rem
  font-weight: 800

.fq-source-stage
  font-size: 0.82rem
  color: var(--lk-muted)

// ── the end ──
.fq-end
  align-items: center
  text-align: center

.fq-winner
  margin: 4px 0 8px
  font-size: 1.6rem
  font-weight: 900

.fq-rank
  width: 100%
  margin: 0
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

.fq-rank-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fq-rank-name
  flex: 1
  font-weight: 800

.fq-rank-score
  font-weight: 700
  color: var(--lk-muted)

.fq-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 14px

.fq-modes
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px

.fq-mode
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 4px
  min-height: 64px
  padding: 8px 6px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  font-size: 0.92rem
  line-height: 1.15
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fq-mode-text
  margin: 8px 2px 12px
  color: var(--lk-muted)
  line-height: 1.45

// ── the quiz evening and the round code ──
.fq-explain
  margin: 0
  line-height: 1.5

.fq-block
  display: flex
  flex-direction: column
  gap: 6px
  margin-top: 6px
  padding: 12px 14px 14px
  border-radius: 18px
  background: var(--lk-surface-2)

.fq-select
  appearance: auto

.fq-toggle
  display: flex
  align-items: center
  gap: 10px
  min-height: 44px
  margin-top: 6px
  font-weight: 700
  cursor: pointer

  input
    width: 22px
    height: 22px
    accent-color: var(--lk-accent)

.fq-team-line
  margin: 0

.fq-code-input
  text-align: center
  font-size: 1.3rem
  font-weight: 800
  letter-spacing: 0.12em
  text-transform: uppercase

.fq-error
  margin: 0
  color: #c8553d
  font-weight: 700
  line-height: 1.4

.fq-codechip
  align-self: center
  margin: 0
  padding: 4px 16px
  border-radius: 999px
  background: rgba(230, 184, 64, 0.25)
  box-shadow: inset 0 0 0 1px #e0bd62
  font-weight: 800
  letter-spacing: 0.04em

  &.is-big
    padding: 10px 26px
    font-size: 2rem
    letter-spacing: 0.14em

.fq-teams
  width: 100%
  margin: 0 0 10px
  padding: 0
  list-style: none
  display: grid
  gap: 8px

  li
    display: grid
    grid-template-columns: 1fr auto
    gap: 2px 10px
    padding: 10px 14px
    border-radius: 16px
    background: rgba(233, 196, 106, 0.3)
    border: 1px solid var(--lk-gold)
    text-align: left

.fq-team-name
  font-weight: 800

.fq-team-members
  grid-column: 1
  font-size: 0.85rem
  color: var(--lk-muted)

.fq-teams .fq-rank-score
  grid-row: 1 / span 2
  grid-column: 2
  align-self: center
</style>
