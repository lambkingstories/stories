<script setup lang="ts">
/**
 * The family quiz (free, all of it), played on the old map. All of it stays on the device, nothing is sent anywhere.
 *  - Which questions: the Bible quiz (real questions with a Bible passage, three levels: easy, medium, hard, or all mixed) or the
 *    questions of the adventures the child has been through (they grow with the adventures).
 *  - How: `table` (two to eight people pass the device around, also in two teams) or `code` (every person plays on their own phone;
 *    a short round code decides which questions come in which order, there is also a "quiz of the day").
 * Every question says where it comes from (the level, or the adventure); after the answer the Bible passage is shown. At the end the
 * people are ranked. A round that was left can be taken up again (`useFamilySave`); the back button of a running round goes to this
 * start page, from here to the games.
 */
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapCoin from '@/components/molecules/map/MapCoin.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapSeats from '@/components/molecules/map/MapSeats.vue'
import MapScoreBar from '@/components/molecules/map/MapScoreBar.vue'
import MapRoute from '@/components/molecules/map/MapRoute.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
import { journeys } from '@/data/adventures'
import { loadBibleQuiz } from '@/data/bibleQuiz'
import { isJourneyPlusLocked } from '@/utils/adventureAccess'
import useAdventure from '@/use/useAdventure'
import useSfx from '@/use/useSfx'
import useUserName from '@/use/useUserName'
import useFamilySave from '@/use/useFamilySave'
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
import { DAILY_QUESTIONS, ROUND_QUESTIONS, dailySeed, dayKey, mulberry32, showCode } from '@/utils/familyCode'
import { KIND_COUNT, newKindCode, readKindCode } from '@/utils/quizCode'

type Mode = 'table' | 'code'
const MODES: Mode[] = ['table', 'code']
/** Which questions: three levels of the Bible quiz, all of them mixed, or from the adventures (the order is the number in the round code). */
type Source = 'easy' | 'mid' | 'hard' | 'mixed' | 'adventure'
const SOURCES: Source[] = ['easy', 'mid', 'hard', 'mixed', 'adventure']
const LEVEL_OF: Partial<Record<Source, 1 | 2 | 3>> = { easy: 1, mid: 2, hard: 3 }

const mode = ref<Mode>('table')
const source = ref<Source>('mixed')

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const adv = useAdventure()
const { play } = useSfx()

const NAMES_KEY = 'lk-family-names'
const DAILY_KEY = 'lk-daily-quiz-v1'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = reactive<string[]>([])
const playerCount = ref(2)
const rounds = ref<number>(5)
const teams = ref(false)
const codeInput = ref('')
const codeError = ref<'' | 'format' | 'version'>('')
const roundCode = ref('')
const isDaily = ref(false)
const dailyResult = ref<{ day: string; score: number; total: number } | null>(null)
/** The questions of the Bible quiz in the language of the app (loaded when the page opens). */
const bank = ref<FamilyQuestion[]>([])

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
  void loadBibleQuiz(locale.value).then((list) => (bank.value = list))
})

const openJourneys = computed(() => journeys.filter((j) => !isJourneyPlusLocked(j.id)))
/** Every question of every adventure, in the order of the data (the same on every phone with this app version). */
const allAdventure = computed(() => buildPool(journeys))
/** The questions of one kind. For the round code the adventure questions are all of them (every phone has to have the same ones), otherwise those of the stages and exams the child has been through. */
function poolOf(src: Source, forCode: boolean): FamilyQuestion[] {
  if (src === 'adventure') {
    if (forCode) return allAdventure.value
    return buildPool(openJourneys.value, {
      stageDone: (jid, sid) => !!adv.stageOf(jid, sid)?.done,
      examDone: (jid) => !!adv.progressOf(jid)?.exam
    })
  }
  if (src === 'mixed') return bank.value
  return bank.value.filter((q) => q.level === LEVEL_OF[src])
}
const pool = computed(() => poolOf(source.value, mode.value === 'code'))
/** All the questions of the open adventures (what the bar of the adventure questions fills up to). */
const poolTotal = computed(() => buildPool(openJourneys.value).length)
const poolShare = computed(() => (poolTotal.value ? Math.min(1, pool.value.length / poolTotal.value) : 0))
const nameOf = (i: number) => names[i]?.trim() || t('app.family.player', { n: i + 1 })
/** With the round code every person plays alone on their own phone. */
const count = computed(() => (mode.value === 'code' ? 1 : playerCount.value))
const players = computed(() => Array.from({ length: count.value }, (_, i) => nameOf(i)))
const maxRounds = computed(() => roundsFor(Math.max(...ROUND_CHOICES), playerCount.value, pool.value.length))
const useTeams = computed(() => mode.value === 'table' && teams.value)
const today = dayKey()
const roundsText = computed(() => t('app.family.roundsNote', { n: Math.min(rounds.value, maxRounds.value) * playerCount.value }))

/** The seats of the map hand over the changed names. */
function setNames(next: string[]) {
  for (let i = 0; i < MAX_PLAYERS; i++) names[i] = next[i] ?? ''
}

function pickMode(m: Mode) {
  mode.value = m
  play('tap')
}

function pickSource(s: Source) {
  source.value = s
  codeError.value = ''
  play('tap')
}

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

// the end on the map: the ranking with the token of every person (the same order as `ranking`, which sorts by score and keeps the seats' order)
const rankRows = computed(() => {
  const order = players.value.map((_, i) => i).sort((a, b) => (scores.value[b] ?? 0) - (scores.value[a] ?? 0))
  return placing.value.map((p, k) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: order[k] ?? 0 }))
})
const winnerIndex = computed(() => {
  if (useTeams.value) {
    const [a, b] = teamLines.value
    return a!.points === b!.points ? undefined : a!.points > b!.points ? 0 : 1
  }
  return rankRows.value[0]?.index
})
const endHeadline = computed(() => {
  if (mode.value === 'code') return t('app.family.codeResult', { n: scores.value[0] ?? 0, total: questions.value.length })
  if (useTeams.value) return teamHeadline.value
  return winners.value.length > 1 ? t('app.family.winners', { names: winners.value.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners.value[0]?.name ?? '' })
})

// the travellers on their road: how far everybody has come (every person answers about the same number of questions)
const perPlayer = computed(() => Math.max(1, Math.ceil(questions.value.length / Math.max(1, count.value))))
const travellers = computed(() => players.value.map((name, i) => ({ name, value: scores.value[i] ?? 0, score: scores.value[i] ?? 0, index: i, turn: i === who.value })))
/** One to three travellers get a road each, more of them a row of brass tags. */
const showRoad = computed(() => count.value <= 3)

function saveNames() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
}

// ── a round that was left can be taken up again ─────────────────────────────────────────────────────────────────
interface Snap {
  mode: Mode
  source: Source
  playerCount: number
  names: string[]
  teams: boolean
  rounds: number
  questions: FamilyQuestion[]
  index: number
  scores: number[]
  picked: number
  phase: 'ask' | 'reveal'
  roundCode: string
  isDaily: boolean
}
const keep = useFamilySave<Snap>('quiz', 1)

function isSnap(s: Snap | null): s is Snap {
  return !!s && MODES.includes(s.mode) && SOURCES.includes(s.source) && Array.isArray(s.questions) && s.questions.length > 0 && Array.isArray(s.scores) && Number.isInteger(s.index) && s.index >= 0 && s.index < s.questions.length && (s.phase === 'ask' || s.phase === 'reveal') && Array.isArray(s.names)
}

function persist() {
  if (phase.value !== 'ask' && phase.value !== 'reveal') return
  keep.save({
    mode: mode.value,
    source: source.value,
    playerCount: playerCount.value,
    names: names.map((n) => n.trim()),
    teams: teams.value,
    rounds: rounds.value,
    questions: questions.value,
    index: index.value,
    scores: [...scores.value],
    picked: picked.value,
    phase: phase.value,
    roundCode: roundCode.value,
    isDaily: isDaily.value
  })
}

const resumeInfo = computed(() => (isSnap(keep.saved.value) ? t('app.family.question', { n: keep.saved.value.index + 1, total: keep.saved.value.questions.length }) : ''))

function resume() {
  const s = keep.saved.value
  if (!isSnap(s)) {
    keep.clear()
    return
  }
  mode.value = s.mode
  source.value = s.source
  playerCount.value = Math.min(MAX_PLAYERS, Math.max(1, s.playerCount))
  setNames(s.names)
  teams.value = !!s.teams
  rounds.value = s.rounds
  questions.value = s.questions
  index.value = s.index
  scores.value = s.scores
  picked.value = s.phase === 'reveal' ? s.picked : -1
  roundCode.value = s.roundCode ?? ''
  isDaily.value = !!s.isDaily
  phase.value = s.phase
  play('tap')
}

/** The back button: a round that runs goes back to this start page, from here to the games. */
function goBack() {
  if (phase.value !== 'setup') {
    phase.value = 'setup'
    return
  }
  void router.push({ name: 'app-family' })
}

function begin(list: FamilyQuestion[], playersCount: number) {
  questions.value = list
  scores.value = Array.from({ length: playersCount }, () => 0)
  index.value = 0
  picked.value = -1
  phase.value = 'ask'
  persist()
}

function start() {
  saveNames()
  const r = roundsFor(rounds.value, playerCount.value, pool.value.length)
  if (r <= 0) return
  roundCode.value = ''
  isDaily.value = false
  begin(pickQuestions(pool.value, r * playerCount.value), playerCount.value)
}

// the round code: the same code gives the same questions in the same order on every phone
const sourceIndex = computed(() => SOURCES.indexOf(source.value))
const codeReady = computed(() => pool.value.length >= ROUND_QUESTIONS)
const dailyReady = computed(() => bank.value.length >= DAILY_QUESTIONS)

function startRound(list: FamilyQuestion[], seed: number, n: number) {
  saveNames()
  begin(pickQuestions(list, n, mulberry32(seed)), 1)
}

function newRound() {
  if (!codeReady.value) return
  const code = newKindCode(sourceIndex.value, pool.value.length)
  const r = readKindCode(code, (k) => poolOf(SOURCES[k]!, true).length)
  if (!r.ok) return
  roundCode.value = r.code
  isDaily.value = false
  startRound(pool.value, r.seed, ROUND_QUESTIONS)
}

function joinRound() {
  const r = readKindCode(codeInput.value, (k) => poolOf(SOURCES[Math.min(k, KIND_COUNT - 1)]!, true).length)
  if (!r.ok) {
    codeError.value = r.reason
    return
  }
  codeError.value = ''
  // the code says which questions: the choice on this page follows it
  source.value = SOURCES[r.kind]!
  roundCode.value = r.code
  isDaily.value = false
  startRound(poolOf(SOURCES[r.kind]!, true), r.seed, ROUND_QUESTIONS)
}

function playDaily() {
  if (!dailyReady.value) return
  roundCode.value = ''
  isDaily.value = true
  startRound(bank.value, dailySeed(), DAILY_QUESTIONS)
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
  const ok = i === current.value.answer
  if (ok) scores.value[who.value] = (scores.value[who.value] ?? 0) + 1
  void play(ok ? 'familyRight' : 'familyWrong')
  phase.value = 'reveal'
  persist()
  // the answer and the button to go on may lie below the edge on a small screen
  void nextTick(() => document.querySelector('.fq-reveal')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}

function next() {
  if (isLast.value) {
    if (mode.value === 'code' && isDaily.value) saveDaily()
    keep.clear()
    phase.value = 'result'
    void play('familyResult')
    return
  }
  index.value++
  picked.value = -1
  phase.value = 'ask'
  persist()
}

const right = computed(() => !!current.value && picked.value === current.value.answer)

/** The words on a coin lie on a small band: longer answers get smaller letters. */
function coinFont(text: string): string {
  const n = text.length
  if (n <= 10) return '1.4rem'
  if (n <= 18) return '1.2rem'
  if (n <= 28) return '1.02rem'
  if (n <= 40) return '0.9rem'
  return '0.8rem'
}
function coinState(i: number): 'idle' | 'right' | 'wrong' | 'dim' {
  if (phase.value !== 'reveal') return 'idle'
  if (i === current.value?.answer) return 'right'
  return i === picked.value ? 'wrong' : 'dim'
}
const questionSize = computed(() => {
  const n = current.value?.q.length ?? 0
  return n > 120 ? '1rem' : n > 80 ? '1.1rem' : '1.22rem'
})
</script>

<template lang="pug">
  MapTable(:title="t('app.family.title')" @back="goBack")
    div(class="fq")
      //- ===== the start page: how (table / own phones) and which questions =====
      template(v-if="phase === 'setup'")
        MapResume(v-if="resumeInfo" :info="resumeInfo" @resume="resume")
        div(class="fq-modes" role="radiogroup" :aria-label="t('app.family.modeLabel')")
          button(v-for="m in MODES" :key="m" type="button" role="radio" :aria-checked="mode === m" :class="['fq-brass', 'fq-mode', { 'is-on': mode === m }]" @click="pickMode(m)")
            span {{ t(`app.family.mode_${m}`) }}
        h3(class="fq-h") {{ t('app.family.questionsHead') }}
        div(class="fq-levels" role="radiogroup" :aria-label="t('app.family.questionsHead')")
          button(v-for="s in SOURCES" :key="s" type="button" role="radio" :aria-checked="source === s" :class="['fq-brass', 'fq-level', { 'is-on': source === s }]" @click="pickSource(s)")
            span {{ t(`app.family.src_${s}`) }}
        MapPaper(kind="strip")
          span(class="fq-fine") {{ t(`app.family.srcText_${source}`) }}

      //- ===== the round code: one person, their own phone =====
      div(v-if="phase === 'setup' && mode === 'code'" class="fq-code")
        div(class="fq-codename")
          MapSeats(:count="1" :names="names" :min="1" :max="1" fixed @update:names="setNames")

        div(class="fq-things")
          div(class="fq-thing")
            MapPaper(kind="strip")
              span(class="fq-thing-in")
                strong(class="fq-thing-h") {{ t('app.family.codeDaily') }}
                span(class="fq-fine") {{ dailyDoneToday ? t('app.family.codeDailyDone', { score: dailyResult?.score ?? 0, total: dailyResult?.total ?? 0 }) : t('app.family.codeDailyText', { n: DAILY_QUESTIONS }) }}
            MapButton(:disabled="!dailyReady" @click="playDaily") {{ t('app.family.codeDailyGo') }}

          div(class="fq-thing")
            MapPaper(kind="strip")
              span(class="fq-thing-in")
                strong(class="fq-thing-h") {{ t('app.family.codeNew') }}
                span(class="fq-fine") {{ t('app.family.codeNewText', { n: ROUND_QUESTIONS }) }}
            MapButton(:disabled="!codeReady" @click="newRound") {{ t('app.family.codeNewGo') }}

          div(class="fq-thing")
            MapPaper(kind="strip")
              span(class="fq-thing-in")
                strong(class="fq-thing-h") {{ t('app.family.codeJoin') }}
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
                span(v-if="codeError" class="fq-fine fq-error" role="alert") {{ t(`app.family.codeError_${codeError}`) }}
            MapButton(:disabled="!codeInput.trim()" @click="joinRound") {{ t('app.family.codeJoinGo') }}

      //- ===== who plays =====
      div(v-else-if="phase === 'setup'" class="fq-setup")
        MapPaper(v-if="!pool.length" kind="strip" class="fq-wide")
          span(class="fq-fine") {{ source === 'adventure' ? t('app.family.empty') : t('app.family.loading') }}
        template(v-else)
          div(class="fq-col")
            //- the questions of the adventures grow with every stage and exam the child has been through
            MapPaper(v-if="source === 'adventure'" kind="strip")
              span(class="fq-unlock" role="group")
                span(class="fq-unlock-n") {{ pool.length }}
                  small {{ t('app.family.unlockOf', { total: poolTotal }) }}
                span(class="fq-unlock-bar" aria-hidden="true")
                  span(class="fq-unlock-fill" :style="{ width: Math.round(poolShare * 100) + '%' }")

            MapSeats(v-model:count="playerCount" :names="names" :min="MIN_PLAYERS" :max="MAX_PLAYERS" :question="t('app.family.howMany')" @update:names="setNames")

            button(type="button" role="switch" :aria-checked="teams" :class="['fq-brass', 'fq-switch', { 'is-on': teams }]" @click="teams = !teams")
              span(class="fq-lamp" aria-hidden="true")
              span {{ t('app.family.teamsOn') }}
            template(v-if="teams")
              MapPaper(kind="strip")
                span(class="fq-fine") {{ t('app.family.teamsNote') }}
              div(class="fq-teams")
                MapPaper(v-for="(line, k) in teamLines" :key="k" kind="strip")
                  span(class="fq-team")
                    strong {{ line.name }}
                    span(class="fq-fine") {{ line.members }}

          div(class="fq-col")
            h3(class="fq-h") {{ t('app.family.rounds') }}
            div(class="fq-marks" role="radiogroup")
              button(
                v-for="r in ROUND_CHOICES"
                :key="r"
                type="button"
                role="radio"
                :aria-checked="rounds === r"
                :disabled="r > maxRounds"
                :class="['fq-brass', 'fq-mark', { 'is-on': rounds === r }]"
                @click="rounds = r"
              ) {{ r }}
            MapPaper(kind="strip")
              span(class="fq-fine") {{ roundsText }}
            div(class="fq-go")
              MapButton(:disabled="maxRounds < 1" @click="start") {{ t('app.family.start') }}

      //- ===== a question =====
      div(v-else-if="phase === 'ask' || phase === 'reveal'" class="fq-play")
        div(class="fq-left")
          //- the road with the travellers (upright, up to three people); sideways and for more people the row of brass tags
          MapRoute(v-if="showRoad" class="fq-road" :players="travellers" :max="perPlayer" aria-hidden="true")
          MapScoreBar(:class="['fq-tags', { 'is-alt': showRoad }]" :players="travellers" aria-hidden="true")
          div(class="fq-meta")
            p(v-if="mode === 'code'" class="fq-chip") {{ isDaily ? t('app.family.codeChipDaily') : t('app.family.codeChip', { code: showCode(roundCode) }) }}
            p(v-else class="fq-turn")
              MapToken(:index="who" :size="34" lit)
              span {{ t('app.family.turn', { name: whoName }) }}
            p(class="fq-count") {{ t('app.family.question', { n: index + 1, total: questions.length }) }}
          MapPaper(kind="card" :lit="phase === 'reveal' && right" :key="index" class="fq-qcard")
            span(class="fq-source")
              span(class="fq-source-adv") {{ current?.level ? t(`app.family.level_${current.level}`) : t('app.family.fromAdventure', { name: current?.journey ?? '' }) }}
              span(v-if="current?.stage" class="fq-source-stage") {{ current.stage }}
            h2(class="fq-q" :style="{ fontSize: questionSize }") {{ current?.q }}
        div(class="fq-coins")
          div(v-for="(o, i) in current?.options ?? []" :key="index + '-' + i" class="fq-rise" :style="{ animationDelay: i * 70 + 'ms' }")
            MapCoin(:index="i" :state="coinState(i)" :disabled="phase === 'reveal'" @click="choose(i)")
              span(:style="{ fontSize: coinFont(o) }") {{ o }}
        div(v-if="phase === 'reveal'" class="fq-reveal")
          MapPaper(kind="strip" :lit="right" class="fq-verdict")
            span(role="status") {{ right ? t('app.family.right') : t('app.family.wrong') }}
            span(v-if="current?.ref" class="fq-ref") {{ current.ref }}
          MapButton(@click="next") {{ nextLabel }}

      //- ===== the end =====
      MapResult(v-else :headline="endHeadline" :rows="mode === 'code' ? [] : rankRows" :winner-index="winnerIndex")
        template(v-if="mode === 'code'")
          p(v-if="!isDaily" class="fq-codebig") {{ showCode(roundCode) }}
          MapPaper(kind="strip")
            span(class="fq-fine") {{ isDaily ? t('app.family.codeShareDaily') : t('app.family.codeShare') }}
          MapButton(@click="phase = 'setup'") {{ t('app.family.codeBack') }}
        template(v-else)
          template(v-if="useTeams")
            MapPaper(v-for="(line, k) in teamLines" :key="k" kind="strip" class="fq-endteam")
              span(class="fq-endteam-in")
                span(class="fq-endteam-text")
                  strong {{ line.name }}
                  span(class="fq-fine") {{ line.members }}
                strong(class="fq-endteam-n") {{ t('app.family.points', line.points) }}
          MapButton(@click="start") {{ t('app.family.again') }}
          MapButton(quiet @click="phase = 'setup'") {{ t('app.family.change') }}
</template>

<style scoped lang="sass">
.fq
  display: flex
  flex-direction: column
  gap: 12px
  max-width: 34rem
  margin: 0 auto
  padding-top: 4px

  // the parchment strip has an olive sprig at its left end and a framed edge: the words keep clear of both
  :deep(.mpa--strip .mpa-in)
    padding: 15px 6% 15px 15%

// ── brass things on the table: card-index tabs, round marks, the switch ──
.fq-brass
  position: relative
  border: 2px solid #9a6b1c
  background: linear-gradient(180deg, #fff8e0 0%, #efd89c 100%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  font-weight: 800
  text-shadow: none
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 0.18s, box-shadow 0.25s, background 0.25s

  &.is-on
    background: linear-gradient(180deg, #ffe88f 0%, #f2b73b 100%)
    color: #2e1f0a
    text-shadow: none
    box-shadow: 0 0 0 3px rgba(255, 246, 214, 0.95), 0 0 16px rgba(255, 200, 70, 0.85), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #fffbe0

  &:disabled
    opacity: 0.4
    cursor: default

.fq-modes
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 8px
  align-items: end

.fq-mode
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 4px
  min-height: 64px
  padding: 8px 6px
  border-radius: 12px 12px 4px 4px
  font-size: 1rem
  line-height: 1.12
  text-align: center

  &.is-on
    transform: translateY(-3px)

.fq-levels
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

.fq-level
  flex: 0 1 auto
  min-width: 5.4rem
  padding: 9px 14px
  border-radius: 999px
  font-size: 1rem
  text-align: center

.fq-ref
  display: block
  font-size: 0.8rem
  font-weight: 700
  color: var(--mp-ink-soft, #6b5230)

.fq-marks
  display: flex
  justify-content: center
  gap: 14px

.fq-mark
  width: 56px
  height: 56px
  border-radius: 50%
  font-size: 1.3rem

.fq-switch
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  min-height: 48px
  padding: 6px 16px
  border-radius: 12px
  font-size: 1rem
  text-align: left

.fq-lamp
  flex: none
  width: 14px
  height: 14px
  border-radius: 50%
  background: radial-gradient(circle at 35% 30%, #6b5230, #2c1d0a)
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 222, 150, 0.5)

.fq-switch.is-on .fq-lamp
  background: radial-gradient(circle at 35% 30%, #fffbe0, #ffc84a 60%, #c27d12)
  box-shadow: 0 0 10px rgba(255, 215, 110, 1), 0 0 0 1px #fff3cf

// ── texts and fields on parchment and on the map ──
.fq-h
  margin: 0 0 4px
  text-align: center
  font-size: 1.2rem
  font-weight: 800
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9)

.fq-fine
  display: block
  width: 100%
  text-align: center
  font-size: 1.05rem
  font-weight: 600
  line-height: 1.3

.fq-lead
  font-size: 1.1rem
  line-height: 1.4

.fq-input
  width: 100%
  min-width: 0
  min-height: 40px
  border: 0
  border-bottom: 1px solid rgba(58, 40, 18, 0.45)
  background: transparent
  color: var(--mp-ink, #3a2812)
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  padding: 2px 2px
  outline: none

  &::placeholder
    color: rgba(58, 40, 18, 0.5)
    font-weight: 600

  &:focus
    border-bottom-color: #8a5a10

.fq-select
  appearance: auto
  cursor: pointer

.fq-code-input
  text-align: center
  font-size: 1.3rem
  letter-spacing: 0.12em
  text-transform: uppercase

.fq-error
  color: #8a2a14

.fq-seat
  display: flex
  align-items: center
  gap: 8px
  width: 100%

.fq-pick
  display: flex
  flex-direction: column
  width: 100%
  gap: 0

.fq-pick-h
  font-size: 0.85rem
  font-weight: 700
  color: var(--mp-ink-soft, #6b5230)

// ── setup ──
.fq-setup, .fq-col
  display: flex
  flex-direction: column
  gap: 12px

.fq-teams
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 8px

.fq-team
  display: flex
  flex-direction: column
  min-width: 0
  line-height: 1.2

.fq-go
  display: flex
  justify-content: center
  padding: 4px 0 8px

.fq-unlock
  display: flex
  flex-direction: column
  gap: 6px
  width: 100%

.fq-unlock-n
  font-size: 1.7rem
  font-weight: 800
  line-height: 1

  small
    margin-left: 8px
    font-size: 0.85rem
    font-weight: 700
    color: var(--mp-ink-soft, #6b5230)

.fq-unlock-bar
  display: block
  height: 8px
  border-radius: 999px
  background: rgba(58, 40, 18, 0.2)
  overflow: hidden

.fq-unlock-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #a9802d, #e2bd66)

// ── the round code ──
.fq-code
  display: flex
  flex-direction: column
  gap: 14px

.fq-things
  display: flex
  flex-direction: column
  gap: 16px

.fq-thing
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  min-width: 0


.fq-thing-in
  display: flex
  flex-direction: column
  gap: 4px
  width: 100%
  text-align: center

.fq-thing-h
  font-size: 1.08rem

// ── during the game ──
.fq-play
  display: flex
  flex-direction: column
  gap: 12px

.fq-left
  display: flex
  flex-direction: column
  gap: 8px
  min-width: 0

.fq-meta
  display: flex
  flex-direction: column
  gap: 2px

// upright: the road for up to three people; sideways: the tags (they take less room)
.fq-tags.is-alt
  display: none

.fq-turn
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  margin: 2px 0 0
  font-size: 1.3rem
  font-weight: 800
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)

.fq-count
  margin: 0
  text-align: center
  font-size: 0.95rem
  font-weight: 700
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95)

.fq-chip
  align-self: center
  margin: 2px 0 0
  padding: 4px 18px
  border-radius: 999px
  border: 1px solid rgba(226, 189, 102, 0.7)
  background: rgba(28, 19, 10, 0.72)
  color: var(--mp-gold, #e2bd66)
  font-weight: 800
  letter-spacing: 0.06em

.fq-qcard
  :deep(.mpa-in)
    padding: 12% 10% 9%
    min-height: 120px
    display: flex
    flex-direction: column
    justify-content: center
    gap: 4px

.fq-source
  display: flex
  flex-direction: column
  align-items: center
  gap: 0
  line-height: 1.2

.fq-source-adv
  font-size: 0.8rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: var(--mp-ink-soft, #6b5230)

.fq-source-stage
  font-size: 0.8rem
  font-weight: 600
  color: var(--mp-ink-soft, #6b5230)

.fq-q
  margin: 4px 0 0
  line-height: 1.28
  font-weight: 800
  text-align: center

.fq-coins
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  width: min(100%, 19.5rem)
  align-self: center

// a question with three answers: the last coin lies in the middle of the second row
.fq-rise:last-child:nth-child(odd)
  grid-column: 1 / -1
  justify-self: center
  width: calc(50% - 5px)

.fq-rise
  animation: fq-rise 0.45s cubic-bezier(0.25, 0.8, 0.3, 1) both

@keyframes fq-rise
  from
    opacity: 0
    transform: translateY(16px) scale(0.92)
  to
    opacity: 1
    transform: none

@media (prefers-reduced-motion: reduce)
  .fq-rise
    animation: none

.fq-reveal
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  width: 100%

.fq-verdict
  max-width: 15rem

  :deep(.mpa-in)
    flex-direction: column
    justify-content: center
    gap: 0
    font-size: 1.3rem
    font-weight: 800

// ── the end ──
.fq-codebig
  margin: 0
  padding: 8px 26px
  border-radius: 999px
  border: 1px solid rgba(226, 189, 102, 0.8)
  background: rgba(28, 19, 10, 0.78)
  color: var(--mp-gold, #e2bd66)
  font-size: 2rem
  font-weight: 800
  letter-spacing: 0.14em

.fq-endteam
  width: min(100%, 24rem)

.fq-endteam-in
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px
  width: 100%
  text-align: left

.fq-endteam-text
  display: flex
  flex-direction: column
  min-width: 0
  line-height: 1.2

.fq-endteam-n
  flex: none

// ── sideways: the setup and the game in two columns ──
@media (orientation: landscape)
  .fq
    max-width: 62rem
    gap: 10px

  .fq-modes
    max-width: 40rem
    width: 100%
    margin: 0 auto

  .fq-setup
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 12px 18px
    align-items: start

  .fq-setup > .fq-wide
    grid-column: 1 / -1

  .fq-things
    display: grid
    grid-template-columns: repeat(3, minmax(0, 1fr))
    align-items: start
    gap: 14px

  .fq-codename
    max-width: 22rem
    width: 100%
    margin: 0 auto

  .fq-play
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 20rem)
    grid-template-areas: 'left coins' 'reveal coins'
    grid-template-rows: auto 1fr
    gap: 10px 18px
    align-items: start

  .fq-left
    grid-area: left

  .fq-coins
    grid-area: coins
    width: min(100%, 72vh)
    justify-self: center

  .fq-reveal
    grid-area: reveal
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    align-items: center

  .fq-verdict
    flex: 0 1 8.5rem

    :deep(.mpa-in)
      font-size: 1.05rem

  .fq-road
    display: none

  .fq-tags.is-alt
    display: flex

  .fq-meta
    flex-direction: row
    flex-wrap: wrap
    align-items: center
    justify-content: center
    gap: 2px 16px

  .fq-qcard
    :deep(.mpa-in)
      padding: 8% 8% 7%
      min-height: 90px
</style>
