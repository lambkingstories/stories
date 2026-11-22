<script setup lang="ts">
/**
 * The family quiz (free, all of it), in the light look of "Familien-Spiele v2" (white cards, capsules, chips, answer tiles; see components/molecules/family/). All of it stays on the device, nothing is sent anywhere.
 * The course of a real game: the title screen (`start`: picture, name, "Play", "How to play", "Continue"), the players page (`lobby`: figures, names,
 * the settings of the quiz, "Let's go"), the game (`ask`/`reveal`, with the bar of the game in its colour) and the end (`result`: podium).
 *  - Which questions: the Bible quiz (real questions with a Bible passage, three levels: easy, medium, hard, or all mixed) or the
 *    questions of the adventures the child has been through (they grow with the adventures).
 *  - How: `table` (two to eight people pass the device around, also in two teams) or `code` (every person plays on their own phone;
 *    a short round code decides which questions come in which order, there is also a "quiz of the day").
 * Every question says where it comes from (the level, or the adventure); after the answer the Bible passage is shown. At the end the
 * people are ranked. A round that was left can be taken up again (`useFamilySave`); leaving a running round (after "End the game?") goes to the
 * title screen, from there to the games.
 */
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackToOrigin } from '@/utils/navBack'
import MapToken from '@/components/molecules/map/MapToken.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyChoice from '@/components/molecules/family/FamilyChoice.vue'
import FamilyQuestionCard from '@/components/molecules/family/FamilyQuestionCard.vue'
import FamilyNameField from '@/components/molecules/family/FamilyNameField.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium, { type FamilyPodiumRow } from '@/components/molecules/family/FamilyPodium.vue'
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
/** The course: title screen, players page, a question (asked, then the verdict), the end. */
type Phase = 'start' | 'lobby' | 'ask' | 'reveal' | 'result'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'ask' || phase.value === 'reveal')
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
const rankRows = computed<FamilyPodiumRow[]>(() => {
  const order = players.value.map((_, i) => i).sort((a, b) => (scores.value[b] ?? 0) - (scores.value[a] ?? 0))
  return placing.value.map((p, k) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: order[k] ?? 0 }))
})
/** With two teams the podium has the two teams (a figure of their people stands for them), the single players are listed below it. */
const teamRows = computed<FamilyPodiumRow[]>(() => {
  const [a, b] = teamLines.value
  const first = a!.points >= b!.points ? 0 : 1
  const tie = a!.points === b!.points
  return [first, 1 - first].map((k, n) => ({ rank: tie || n === 0 ? 1 : 2, name: teamLines.value[k]!.name, sub: teamLines.value[k]!.members, score: t('app.family.points', teamLines.value[k]!.points), index: k }))
})
const podiumRows = computed(() => (mode.value === 'code' ? [] : useTeams.value ? teamRows.value : rankRows.value))
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

/** The chips in the bar of the game: the figure, the name and the points of everybody; the one whose turn it is shines (with the round code there is only one person, no turns). */
const barPlayers = computed(() => players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: mode.value === 'table' && i === who.value })))
/** The four lines of "How to play". */
const rules = computed(() => [1, 2, 3, 4].map((n) => t(`app.bigGames.familyFlow.quizRule${n}`)))

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

/** The back button of the table: one step back (players page to the title screen, the end to the title screen), from the title screen to the games. A running round has its own button (the bar of the game asks first). */
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

/** What an answer tile shows after the answer: the right one, the wrong one that was picked, or the others at rest. */
function choiceState(i: number): 'idle' | 'right' | 'wrong' | 'dim' {
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
  MapTable(title="" game="quiz" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the people with their points, leaving asks first =====
    template(v-if="playing" v-slot:top)
      FamilyGameBar(
        game="quiz"
        :title="t('app.family.hub_quiz')"
        :subtitle="t('app.family.question', { n: index + 1, total: questions.length })"
        :players="barPlayers"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="phase = 'start'"
      )

    div(class="fq")
      //- ===== 1. the title screen =====
      FamilyStart(
        v-if="phase === 'start'"
        game="quiz"
        :name="t('app.family.hub_quiz')"
        :tagline="t('app.family.hub_quizSub')"
        :rules="rules"
        :resume-info="resumeInfo"
        @play="phase = 'lobby'"
        @resume="resume"
      )

      //- ===== 2. who plays, and the settings of the quiz =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="quiz"
        :count="count"
        :names="names"
        :min="MIN_PLAYERS"
        :max="MAX_PLAYERS"
        :fixed="mode === 'code'"
        :team-option="mode === 'table'"
        :teams="teams"
        :can-go="maxRounds >= 1"
        :hide-go="mode === 'code'"
        @update:count="playerCount = $event"
        @update:names="setNames"
        @update:teams="teams = $event"
        @go="start"
      )
        //- how: one device, or several phones with the round code
        template(v-slot:top)
          div(class="fq-modes" role="radiogroup" :aria-label="t('app.family.modeLabel')")
            FamilyChip(v-for="m in MODES" :key="m" class="fq-wide-chip" :selected="mode === m" @click="pickMode(m)") {{ t(`app.family.mode_${m}`) }}

        template(v-slot:settings)
          //- which questions (the level, or the adventures)
          FamilyCard(:title="t('app.family.questionsHead')" symbol="quiz")
            div(class="fq-levels" role="radiogroup" :aria-label="t('app.family.questionsHead')")
              FamilyChip(v-for="s in SOURCES" :key="s" :selected="source === s" @click="pickSource(s)") {{ t(`app.family.src_${s}`) }}
            span(class="fq-fine") {{ t(`app.family.srcText_${source}`) }}

          //- the questions of the adventures grow with every stage and exam the child has been through
          FamilyCard(v-if="source === 'adventure' && pool.length" compact)
            span(class="fq-unlock" role="group")
              span(class="fq-unlock-n") {{ pool.length }}
                small {{ t('app.family.unlockOf', { total: poolTotal }) }}
              span(class="fq-unlock-bar" aria-hidden="true")
                span(class="fq-unlock-fill" :style="{ width: Math.round(poolShare * 100) + '%' }")

          //- one device: how many questions for everybody
          template(v-if="mode === 'table'")
            FamilyCard(v-if="!pool.length" compact)
              span(class="fq-fine") {{ source === 'adventure' ? t('app.family.empty') : t('app.family.loading') }}
            FamilyCard(v-else :title="t('app.family.rounds')")
              div(class="fq-marks" role="radiogroup")
                FamilyChip(v-for="r in ROUND_CHOICES" :key="r" round :selected="rounds === r" :disabled="r > maxRounds" @click="rounds = r") {{ r }}
              span(class="fq-fine") {{ roundsText }}

          //- several phones: the quiz of the day, a new round, join with a code
          div(v-else class="fq-things")
            FamilyCard(class="fq-thing" :title="t('app.family.codeDaily')")
              span(class="fq-fine") {{ dailyDoneToday ? t('app.family.codeDailyDone', { score: dailyResult?.score ?? 0, total: dailyResult?.total ?? 0 }) : t('app.family.codeDailyText', { n: DAILY_QUESTIONS }) }}
              FamilyButton(:disabled="!dailyReady" @click="playDaily") {{ t('app.family.codeDailyGo') }}

            FamilyCard(class="fq-thing" :title="t('app.family.codeNew')")
              span(class="fq-fine") {{ t('app.family.codeNewText', { n: ROUND_QUESTIONS }) }}
              FamilyButton(:disabled="!codeReady" @click="newRound") {{ t('app.family.codeNewGo') }}

            FamilyCard(class="fq-thing" :title="t('app.family.codeJoin')")
              FamilyNameField(v-model="codeInput" code :maxlength="8" placeholder="K7M-4QX" :aria-label="t('app.family.codeJoin')" @enter="joinRound")
              span(v-if="codeError" class="fq-fine fq-error" role="alert") {{ t(`app.family.codeError_${codeError}`) }}
              FamilyButton(:disabled="!codeInput.trim()" @click="joinRound") {{ t('app.family.codeJoinGo') }}

      //- ===== 3. a question =====
      div(v-else-if="playing" class="fq-play")
        div(class="fq-left")
          div(class="fq-meta")
            p(v-if="mode === 'code'" class="fq-chip") {{ isDaily ? t('app.family.codeChipDaily') : t('app.family.codeChip', { code: showCode(roundCode) }) }}
            p(v-else class="fq-turn")
              MapToken(:index="who" :size="38" lit)
              span {{ t('app.family.turn', { name: whoName }) }}
          FamilyQuestionCard(
            :key="index"
            class="fq-qcard"
            :chip="current?.level ? t(`app.family.level_${current.level}`) : t('app.family.fromAdventure', { name: current?.journey ?? '' })"
            :sub="current?.stage ?? ''"
            :text="current?.q ?? ''"
            :size="questionSize"
            :tone="phase === 'reveal' ? (right ? 'right' : 'wrong') : 'default'"
          )
        div(class="fq-answers")
          div(v-for="(o, i) in current?.options ?? []" :key="index + '-' + i" class="fq-rise" :style="{ animationDelay: i * 70 + 'ms' }")
            FamilyChoice(:index="i" :text="o" :state="choiceState(i)" :disabled="phase === 'reveal'" @click="choose(i)")
        div(v-if="phase === 'reveal'" class="fq-reveal")
          FamilyCard(:tone="right ? 'right' : 'wrong'" class="fq-verdict" compact)
            span(role="status" :class="['fq-verdict-t', { 'is-right': right }]") {{ right ? t('app.family.right') : t('app.family.wrong') }}
            span(v-if="current?.ref" class="fq-ref") {{ current.ref }}
          FamilyButton(class="fq-next" @click="next") {{ nextLabel }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="quiz"
        :headline="endHeadline"
        :rows="podiumRows"
        :winner-index="winnerIndex"
        @again="start"
        @change="phase = 'lobby'"
        @exit="toGames"
      )
        template(v-slot:extra)
          //- with teams: the people below the two teams
          ol(v-if="useTeams" class="fq-endlist")
            li(v-for="r in rankRows" :key="r.name + r.index")
              MapToken(:index="r.index" :size="34")
              span(class="fq-endlist-name") {{ r.name }}
              strong {{ r.score }}
          template(v-if="mode === 'code'")
            p(v-if="!isDaily" class="fq-codebig") {{ showCode(roundCode) }}
            FamilyCard(compact)
              span(class="fq-fine") {{ isDaily ? t('app.family.codeShareDaily') : t('app.family.codeShare') }}
        template(v-if="mode === 'code'" v-slot:actions)
          FamilyButton(@click="phase = 'lobby'") {{ t('app.family.codeBack') }}
          FamilyButton(quiet @click="toGames") {{ t('app.bigGames.familyFlow.toGames') }}
</template>

<style scoped lang="sass">
.fq
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

// ── the players page: how, which questions, how many ──
.fq-modes
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  width: 100%

.fq-wide-chip
  width: 100%
  min-height: 56px
  padding: 8px 10px

.fq-levels
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.fq-marks
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 14px
  padding-top: 4px

.fq-fine
  display: block
  width: 100%
  color: var(--fam-muted)
  text-align: center
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35

.fq-error
  color: var(--fam-bad)
  font-weight: 700

.fq-ref
  display: block
  color: var(--fam-muted)
  font-size: 0.9rem
  font-weight: 700

.fq-unlock
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  width: 100%

.fq-unlock-n
  font-size: 1.7rem
  font-weight: 800
  line-height: 1

  small
    margin-left: 8px
    color: var(--fam-muted)
    font-size: 0.85rem
    font-weight: 700

.fq-unlock-bar
  display: block
  width: 100%
  height: 10px
  border-radius: 999px
  background: var(--lk-track, rgba(0, 0, 0, 0.12))
  overflow: hidden

.fq-unlock-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--fam-gold)

// ── the round code ──
.fq-things
  display: flex
  flex-direction: column
  gap: 16px
  width: 100%

.fq-thing
  :deep(.fam-card-body)
    height: 100%
    justify-content: space-between

// ── during the game ──
.fq-play
  display: flex
  flex-direction: column
  gap: 16px

.fq-left
  display: flex
  flex-direction: column
  gap: 12px
  min-width: 0

.fq-meta
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px

.fq-turn
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  margin: 2px 0 0
  color: var(--fam-ink)
  font-size: 1.3rem
  font-weight: 800

.fq-chip
  margin: 2px 0 0
  padding: 6px 18px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-weight: 800
  letter-spacing: 0.06em

.fq-answers
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 14px
  width: 100%
  // room for the rings of a right or wrong answer
  padding: 0 7px

@media (min-width: 560px) and (orientation: portrait)
  .fq-answers
    grid-template-columns: repeat(2, minmax(0, 1fr))

.fq-rise
  animation: fq-rise 0.45s cubic-bezier(0.25, 0.8, 0.3, 1) both

@keyframes fq-rise
  from
    opacity: 0
    transform: translateY(16px) scale(0.96)
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
  gap: 14px
  width: 100%

// held upright: the verdict and the button stay at the lower edge of the screen as soon as the answer is given, so that nobody has to scroll
// down to go on (Anton 21.11.2026); the verdict and the button sit side by side to take little room
@media (orientation: portrait)
  .fq-reveal
    position: sticky
    bottom: calc(env(safe-area-inset-bottom, 0px) + 8px)
    z-index: 5
    flex-direction: row
    flex-wrap: nowrap
    justify-content: center
    align-items: center
    gap: 10px
    padding: 8px
    border: 1.5px solid var(--fam-line)
    border-radius: 22px
    background: color-mix(in srgb, var(--fam-card) 96%, transparent)
    box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.16), var(--fam-shadow)

  .fq-reveal .fq-verdict
    flex: 1 1 0
    min-width: 0
    max-width: none

    :deep(.fam-card-body)
      padding: 8px 10px

  .fq-reveal .fq-next
    flex: 1 1 0
    min-width: 0
    width: auto
    padding: 10px 14px

.fq-verdict
  max-width: 20rem

.fq-verdict-t
  display: block
  font-size: 1.35rem
  font-weight: 800
  line-height: 1.2

  &.is-right
    color: var(--fam-ok)

// ── the end ──
.fq-codebig
  margin: 0
  padding: 8px 26px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-size: 2rem
  font-weight: 800
  letter-spacing: 0.14em

.fq-endlist
  display: grid
  gap: 8px
  width: 100%
  margin: 0
  padding: 0
  list-style: none

  li
    display: grid
    grid-template-columns: 38px minmax(0, 1fr) auto
    align-items: center
    gap: 10px
    min-height: 48px
    padding: 4px 14px 4px 8px
    border: 1.5px solid var(--fam-line)
    border-radius: 16px
    background: var(--fam-card)
    box-shadow: var(--fam-shadow)
    font-size: 1.05rem
    font-weight: 700

.fq-endlist-name
  overflow: hidden
  text-align: left
  text-overflow: ellipsis
  white-space: nowrap

// ── sideways: the game in two columns (the players page and the end arrange themselves) ──
@media (orientation: landscape)
  .fq
    max-width: 62rem
    gap: 12px

  .fq-modes
    max-width: 40rem
    margin: 0 auto

  .fq-wide-chip
    min-height: 48px

  .fq-play
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem)
    grid-template-areas: 'left answers' 'reveal answers'
    grid-template-rows: auto 1fr
    gap: 12px 20px
    align-items: start

  .fq-left
    grid-area: left
    gap: 8px

  // the card of the question needs less height when the phone is held wide
  .fq-qcard
    :deep(.fam-card-head)
      min-height: 44px
      padding-top: 4px
      padding-bottom: 4px

    :deep(.fam-card-body)
      padding: 10px 14px

    :deep(.fam-q-text)
      min-height: 40px

  .fq-answers
    grid-area: answers
    gap: 12px

  // the verdict and the button side by side, so that both stay on a phone held wide
  .fq-reveal
    grid-area: reveal
    flex-direction: row
    flex-wrap: nowrap
    justify-content: center
    align-items: center
    gap: 12px

  .fq-verdict
    flex: 1 1 0
    min-width: 0
    max-width: none

    :deep(.fam-card-body)
      padding: 8px 10px

  .fq-next
    flex: 1 1 0
    min-width: 0
    width: auto
    padding: 8px 14px
</style>
