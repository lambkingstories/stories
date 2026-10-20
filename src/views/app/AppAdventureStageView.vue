<script setup lang="ts">
/**
 * One stage of an adventure (or the exam at the end): the text, the task, the questions, and the result with its stars.
 * The round picture at the top is the stage's scene cut out of the painted map. The coloring task opens the coloring screen and
 * comes back here (`?back=task`) with the stars it earned.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureCount from '@/components/molecules/AdventureCount.vue'
import AdventureOverview, { type OverviewRow } from '@/components/molecules/AdventureOverview.vue'
import AdventureQuiz from '@/components/molecules/AdventureQuiz.vue'
import GameBuild from '@/components/molecules/games/GameBuild.vue'
import GameDots from '@/components/molecules/games/GameDots.vue'
import GameFly from '@/components/molecules/games/GameFly.vue'
import GameFind from '@/components/molecules/games/GameFind.vue'
import GameHarvest from '@/components/molecules/games/GameHarvest.vue'
import GameMemory from '@/components/molecules/games/GameMemory.vue'
import GameOrder from '@/components/molecules/games/GameOrder.vue'
import GameWater from '@/components/molecules/games/GameWater.vue'
import GameLights from '@/components/molecules/games/GameLights.vue'
import GameVerse from '@/components/molecules/games/GameVerse.vue'
import GameEcho from '@/components/molecules/games/GameEcho.vue'
import GameChannels from '@/components/molecules/games/GameChannels.vue'
import GameMirror from '@/components/molecules/games/GameMirror.vue'
import GameSow from '@/components/molecules/games/GameSow.vue'
import GameMissing from '@/components/molecules/games/GameMissing.vue'
import GameWipe from '@/components/molecules/games/GameWipe.vue'
import GameChain from '@/components/molecules/games/GameChain.vue'
import GameStack from '@/components/molecules/games/GameStack.vue'
import GameTrace from '@/components/molecules/games/GameTrace.vue'
import GameBalance from '@/components/molecules/games/GameBalance.vue'
import GameConstellation from '@/components/molecules/games/GameConstellation.vue'
import GameSlide from '@/components/molecules/games/GameSlide.vue'
import GameCrank from '@/components/molecules/games/GameCrank.vue'
import GameHold from '@/components/molecules/games/GameHold.vue'
import GameGuess from '@/components/molecules/games/GameGuess.vue'
import GameHerd from '@/components/molecules/games/GameHerd.vue'
import GamePuzzle from '@/components/molecules/games/GamePuzzle.vue'
import GameShare from '@/components/molecules/games/GameShare.vue'
import GameSort from '@/components/molecules/games/GameSort.vue'
import GameStones from '@/components/molecules/games/GameStones.vue'
import GameWay from '@/components/molecules/games/GameWay.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import SoundPanel from '@/components/molecules/SoundPanel.vue'
import ReadAloud from '@/components/molecules/ReadAloud.vue'
import { journeyById } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { getArtwork, pageArtworkId } from '@/use/useArtworks'
import { prependBaseUrl } from '@/utils/function'
import useTaskProgress from '@/use/useTaskProgress'
import useButtonSounds from '@/use/useButtonSounds'
import useMusic from '@/use/useMusic'
import useSfx from '@/use/useSfx'
import { finalStars, maxPoints, medalFor, partialStars, pointsOf, quizStars, stageStarsOf } from '@/utils/adventureScore'
import { jobNoteKey, paintJobsOf, readJobResults } from '@/utils/paintJobs'
import { clearViaStats, isViaStats } from '@/utils/adventureStats'
import useCelebration from '@/use/useCelebration'
import type { AdventureStage } from '@/types/adventure'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const adv = useAdventure()

const journey = computed(() => journeyById(String(route.params.journeyId)))
const isExam = computed(() => route.params.stageId === 'pruefung')
const stage = computed<AdventureStage | undefined>(() =>
  isExam.value ? undefined : journey.value?.stages.find((s) => s.id === Number(route.params.stageId))
)

type Phase = 'text' | 'task' | 'painted' | 'bridge' | 'quiz' | 'result'
const startPhase = (): Phase => {
  if (isExam.value) return 'quiz'
  // back from the coloring screen: the finished picture ("done"), or on to the questions
  if (route.query.back === 'task') return route.query.done === '1' ? 'painted' : 'bridge'
  return 'text'
}
const phase = ref<Phase>(startPhase())
const progressOfStage = computed(() => (stage.value && journey.value ? adv.stageOf(journey.value.id, stage.value.id) : undefined))
/** The best stars of this stage so far (after the questions), and those of the game alone. */
const stageStars = computed(() => stageStarsOf(progressOfStage.value))
const bestGameStars = computed(() => progressOfStage.value?.gameStars ?? progressOfStage.value?.stars ?? 0)
/**
 * This try: the stars of its game and, after the questions, its final stars. The map keeps the best of all tries, but the result
 * page always says what THIS try earned (a try with a wrong answer never shows the three stars of an earlier, better one).
 */
const tryGame = ref<number | null>(route.query.back === 'task' && route.query.stars !== undefined ? Number(route.query.stars) : null)
const tryFinal = ref<number | null>(null)
/** The answers of this try, for the account on the result page (the same lines at every stage). */
const tryCorrect = ref(0)
const tryWrong = ref(0)
const gameStars = computed(() => tryGame.value ?? bestGameStars.value)
const shownStars = computed(() => tryFinal.value ?? stageStars.value)
/** Stars the questions took away from the game's stars. */
const lostStars = computed(() => (phase.value === 'result' ? Math.max(0, gameStars.value - shownStars.value) : 0))
/** Stars the right answers brought back (the net gain of the questions). */
const gainedStars = computed(() => (phase.value === 'result' && tryFinal.value !== null ? Math.max(0, tryFinal.value - gameStars.value) : 0))
/** The last time the stage was finished it was the first time (then the map slides on to the next stage; a replay leaves the map where it is). */
const lastWasFirst = ref(false)
/** Which try this is: a new one starts the questions afresh. */
const attempt = ref(0)

/**
 * The tasks of the picture, drawn by chance every time the stage is entered anew (back from the painting screen they are the same ones, so
 * "keep painting" keeps them). Every task that is done is one star.
 */
const paintJobs = ref(
  stage.value?.task.kind === 'ausmalen'
    ? paintJobsOf(String(route.params.journeyId), Number(route.params.stageId), stage.value.task.jobs, stage.value.task.jobCount ?? 3, { redraw: route.query.back !== 'task' })
    : []
)
/** What the last "done" found for each task (in the order of the tasks): done, wrong tool or colour, not enough yet. */
const jobResults = computed(() => (phase.value === 'painted' ? readJobResults(String(route.params.journeyId), Number(route.params.stageId)) : []))
const paintRows = computed(() =>
  paintJobs.value.map((job, i) => {
    const status = jobResults.value[i]
    const key = status ? jobNoteKey(job, status) : null
    return { job, status, mark: status === 'met' ? '✓' : '✗', note: key ? t(key) : '' }
  })
)

/** The stars the painted picture earned (30 % of it painted: one, 40 %: two, 70 %: three). */
const paintedStars = computed(() => {
  const n = Number(route.query.stars)
  return Number.isFinite(n) ? Math.max(0, Math.min(3, Math.round(n))) : 3
})

const taskKind = computed(() => stage.value?.task.kind)
const hasCountGame = computed(() => taskKind.value === 'zaehlen' && (!!stage.value?.task.groups?.length || (!!stage.value?.task.image && !!stage.value.task.count)))
const isPaint = computed(() => taskKind.value === 'ausmalen' && !!stage.value?.task.image)
const isQuizStage = computed(() => taskKind.value === 'quiz')
const countN = computed(() => stage.value?.task.count ?? 0)
const gameTask = computed(() => stage.value?.task)
const taskImage = computed(() => stage.value?.task.image ?? '')
const taskImageOff = computed(() => stage.value?.task.imageOff)
const taskBackground = computed(() => stage.value?.task.background)
const questionsNow = computed(() => (isExam.value ? journey.value?.exam : stage.value?.questions) ?? [])
const questionsKey = computed(() => `${journey.value?.id}-${route.params.stageId}-${attempt.value}`)

const steps = computed(() => (isQuizStage.value ? ['text', 'quiz'] : ['text', 'task', 'quiz']) as Phase[])
const stepIndex = (p: Phase) => steps.value.indexOf(p === 'painted' ? 'task' : p === 'bridge' || p === 'result' ? 'quiz' : p)
/** How far the child has come: the index of the part that is on now; the parts before it are done. Reading the story again keeps it. */
const reached = ref(Math.max(0, stepIndex(startPhase())))
/** The questions have been started: they stay where they were when the child looks at the story in between. */
const quizStarted = ref(startPhase() === 'quiz')
/** Where the child came from when the story is read again (the way back arrow). */
const backFrom = ref<Phase | null>(null)

watch(phase, (p) => {
  reached.value = Math.max(reached.value, stepIndex(p))
  if (p === 'quiz') quizStarted.value = true
})

const stepState = (s: Phase): 'done' | 'now' | 'todo' => {
  const i = steps.value.indexOf(s)
  if (phase.value === 'result' || i < reached.value) return 'done'
  return i === reached.value ? 'now' : 'todo'
}
const stepLabel = (s: Phase) =>
  s === 'text' ? t('app.adventure.stepStory') : s === 'quiz' ? t('app.adventure.stepQuiz') : isPaint.value ? t('app.adventure.stepPaint') : t('app.adventure.stepGame')

const quizCorrect = computed(() => (stage.value && journey.value ? adv.stageOf(journey.value.id, stage.value.id)?.quizCorrect : undefined))

/** The parts of the stage one under the other, with what is done and what comes next. */
function overviewRows(withStars: boolean): OverviewRow[] {
  return steps.value.map((s) => {
    const state = stepState(s)
    const row: OverviewRow = { key: s, label: stepLabel(s), state }
    if (s === 'text' && state === 'done') row.detail = t('app.adventure.ovRead')
    if (s === 'task' && state === 'done') {
      if (withStars && gameStars.value > 0) row.stars = gameStars.value
      if (gameStars.value === 0) row.detail = t('app.adventure.ovSkipped')
    }
    if (s === 'quiz') {
      row.detail =
        phase.value === 'result' && quizCorrect.value !== undefined
          ? t('app.adventure.ovRight', { n: quizCorrect.value, total: questionsNow.value.length })
          : t('app.adventure.ovQuestions', { n: questionsNow.value.length })
    }
    return row
  })
}

const img = (path: string) => prependBaseUrl(path)
const ui = (name: string) => img(`images/abenteuer/ui/${name}.webp`)

/**
 * The arrow at the top: one step back. From the questions, the game or the overview it leads to the story, which can be read again
 * (its button then goes back to where the child came from); from the story itself, and from the end, it leads to the map.
 */
function onBack() {
  if (isExam.value) {
    goMap()
    return
  }
  if (phase.value === 'result') {
    goMap(stage.value?.id, lastWasFirst.value)
    return
  }
  if (phase.value === 'text') {
    // a stage that was played before: the map stays where it was; a new one: the map shows where the child is
    goMap(progressOfStage.value?.done ? stage.value?.id : undefined)
    return
  }
  backFrom.value = phase.value === 'task' ? null : phase.value
  phase.value = 'text'
}

function fromText() {
  if (backFrom.value) {
    phase.value = backFrom.value
    backFrom.value = null
    return
  }
  toTask()
}

/** The big picture of the stage (one per stage, painted for the journey). */
const heroSrc = computed(() => (stage.value?.image ? img(stage.value.image) : ''))

const backLabel = computed(() => (phase.value === 'text' || phase.value === 'result' ? t('app.adventure.backToMap') : t('app.adventure.back')))

/** The way back has been taken: the star tones of this page that are still to come are dropped. */
const leaving = ref(false)

/**
 * Back to the map. From a stage that was finished for the first time the map slides on to the next one and the way lights up
 * (`from`); from a stage that was played again, or when the child just leaves, the map stays at that stage (`at`).
 */
function goMap(stageId?: number, first = false) {
  const j = journey.value
  if (!j) return
  // the page is left in silence: what is still to ring (star tones, the fanfare of the result) stops, so that nothing rings into the next page
  leaving.value = true
  stopAll()
  // a stage (or the exam) that was played again from the statistics: the way back leads to the statistics
  if (isViaStats(j.id, isExam.value ? 'pruefung' : String(stage.value?.id ?? ''))) {
    clearViaStats()
    void router.replace({ name: 'app-adventure-stats', params: { journeyId: j.id } })
    return
  }
  const query: Record<string, string> = {}
  if (stageId) query[first ? 'from' : 'at'] = String(stageId)
  void router.replace({ name: 'app-adventure-map', params: { journeyId: j.id }, query })
}

/** The picture the child has just painted: the paint with the line art over it, as a small picture. */
const paintedSrc = ref('')

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('image'))
    el.src = src
  })
}

async function buildPainted() {
  const image = stage.value?.task.image
  if (!image) return
  const url = prependBaseUrl(image)
  const rec = await getArtwork(pageArtworkId(url, 1))
  if (!rec) return
  paintedSrc.value = rec.thumb
  let blobUrl = ''
  try {
    blobUrl = URL.createObjectURL(rec.drawing)
    const [line, paint] = await Promise.all([loadImage(url), loadImage(blobUrl)])
    const k = Math.min(1, 900 / Math.max(rec.width, rec.height))
    const c = document.createElement('canvas')
    c.width = Math.round(rec.width * k)
    c.height = Math.round(rec.height * k)
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(paint, 0, 0, c.width, c.height)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(line, 0, 0, c.width, c.height)
    paintedSrc.value = c.toDataURL('image/webp', 0.86)
  } catch {
    // the small picture saved with the painting stays
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
  }
}

onMounted(() => {
  if (phase.value === 'painted') void buildPainted()
})

/** A few lights around the finished picture (the painted star burst). */
const glints = [
  { left: '-4%', top: '6%', s: 0.9, d: 0 },
  { left: '92%', top: '2%', s: 1.1, d: 180 },
  { left: '98%', top: '48%', s: 0.8, d: 360 },
  { left: '-6%', top: '58%', s: 1, d: 120 },
  { left: '10%', top: '94%', s: 0.85, d: 300 },
  { left: '84%', top: '92%', s: 1.05, d: 60 }
]
const glintStyle = (g: { left: string; top: string; s: number; d: number }) => ({ left: g.left, top: g.top, '--s': String(g.s), animationDelay: `${g.d}ms` })

function toTask() {
  phase.value = isQuizStage.value ? 'quiz' : 'task'
}

/** A game that was not even begun earns no star (the questions can still bring some). */
function skipTask() {
  tryGame.value = 0
  phase.value = 'bridge'
}

// what the child did in the game: the share of the task that was done gives the stars of the button that goes on (two thirds 2 stars, 30 % one star);
// below that the game can only be skipped, and skipping earns no star
const progress = useTaskProgress()
watch(phase, (p) => {
  if (p === 'task') progress.reset()
})
const partStars = computed(() => Math.min(2, partialStars(progress.parts.value, progress.goal.value)))
const hasPart = computed(() => partStars.value > 0 && !progress.finished.value)

/** The games have a restart sign: a new key mounts the game afresh (round, mistakes and what was done begin again). */
const gameKey = ref(0)
const GAME_FIELDS = ['puzzle', 'way', 'harvest', 'memory', 'sort', 'find', 'share', 'build', 'dots', 'fly', 'order', 'water', 'lights', 'verse', 'echo', 'channels', 'mirror', 'sow', 'herd', 'missing', 'wipe', 'chain', 'stack', 'trace', 'balance', 'constellation', 'slide', 'crank', 'hold', 'guess'] as const
const hasGame = computed(() => hasCountGame.value || GAME_FIELDS.some((f) => !!gameTask.value?.[f]))
function restartGame() {
  progress.reset()
  gameKey.value++
}

function partTask() {
  // never for a game that is finished: its stars are already the result
  if (progress.finished.value || partStars.value <= 0) return
  taskDone(partStars.value)
}

function taskDone(stars: number) {
  if (!journey.value || !stage.value) return
  tryGame.value = stars
  adv.recordStars(journey.value.id, stage.value.id, stars)
  phase.value = 'bridge'
}

/** Play the stage again for more stars: the game (or the questions) start afresh; the best result stays on the map. */
function retry() {
  tryGame.value = null
  tryFinal.value = null
  tryCorrect.value = 0
  tryWrong.value = 0
  attempt.value++
  quizStarted.value = false
  if (isExam.value) {
    phase.value = 'quiz'
    return
  }
  const first = isQuizStage.value ? 'quiz' : 'task'
  reached.value = steps.value.indexOf(first)
  phase.value = first
}

function startPaint() {
  const j = journey.value
  const s = stage.value
  if (!j || !s?.task.image) return
  void router.push({
    name: 'app-coloring',
    query: { source: prependBaseUrl(s.task.image), type: 'image', adv: `${j.id}:${s.id}` }
  })
}

const { play, stopAll } = useSfx()

// the mini game music plays only while the game itself is open (never while the story is read, and not in the questions, on the star
// page or in the result: the star page of a game stops it, see AdventureStars); the piece fits the game (calm, medium, lively)
useButtonSounds()
const music = useMusic()
const gameKind = computed(() => {
  const g = gameTask.value
  if (hasCountGame.value) return 'count'
  if (g?.puzzle) return 'puzzle'
  if (g?.way) return 'way'
  if (g?.harvest) return 'harvest'
  if (g?.memory) return 'memory'
  if (g?.sort) return 'sort'
  if (g?.find) return 'find'
  if (g?.share) return 'share'
  if (g?.build) return g.build.ordered ? 'stones' : 'build'
  if (g?.dots) return 'dots'
  if (g?.fly) return 'fly'
  if (g?.order) return 'order'
  if (g?.water) return 'water'
  if (g?.lights) return 'lights'
  if (g?.verse) return 'verse'
  if (g?.echo) return 'echo'
  if (g?.channels) return 'channels'
  if (g?.mirror) return 'mirror'
  if (g?.sow) return 'sow'
  if (g?.herd) return 'herd'
  if (g?.missing) return 'missing'
  if (g?.wipe) return 'wipe'
  if (g?.chain) return 'chain'
  if (g?.stack) return 'stack'
  if (g?.trace) return 'trace'
  if (g?.balance) return 'balance'
  if (g?.constellation) return 'constellation'
  if (g?.slide) return 'slide'
  if (g?.crank) return 'crank'
  if (g?.hold) return 'hold'
  if (g?.guess) return 'guess'
  return undefined
})
watch(
  () => phase.value === 'task' && !isPaint.value && !!gameKind.value,
  (on) => (on ? music.playGame(gameKind.value, journey.value?.music) : music.stop('game')),
  { immediate: true }
)
onBeforeUnmount(() => music.stop('game'))

function quizDone(correct: number) {
  const j = journey.value
  if (!j) return
  if (isExam.value) {
    adv.recordExam(j.id, correct, j.exam.length)
    // the cup is celebrated when the exam result appears: bronze quietly, silver a little more, gold with fireworks (without a cup a gentle chime)
    if (medal.value) celebrateCup(medal.value)
    else window.setTimeout(() => play('result'), 300)
  } else if (stage.value) {
    adv.recordQuiz(j.id, stage.value.id, correct)
    const total = stage.value.questions.length
    tryCorrect.value = correct
    tryWrong.value = total - correct
    if (isQuizStage.value) {
      const q = quizStars(correct, total)
      tryFinal.value = q
      adv.recordStars(j.id, stage.value.id, q)
      adv.recordFinal(j.id, stage.value.id, q)
    } else {
      // every wrong answer takes one star of the game away
      const f = finalStars(gameStars.value, correct, total - correct)
      tryFinal.value = f
      adv.recordFinal(j.id, stage.value.id, f)
    }
    lastWasFirst.value = !adv.stageOf(j.id, stage.value.id)?.done
    adv.completeStage(j.id, stage.value.id)
  }
  phase.value = 'result'
}

const { celebrate: celebrateCup } = useCelebration()
const exam = computed(() => (journey.value ? adv.progressOf(journey.value.id)?.exam : undefined))
const total = computed(() => (journey.value ? pointsOf(adv.progressOf(journey.value.id)) : 0))
const max = computed(() => (journey.value ? maxPoints(journey.value) : 0))
const medal = computed(() => medalFor(total.value, max.value))
const cup = computed(() => (medal.value ? ui(`pokal-${medal.value === 'silver' ? 'silber' : medal.value}`) : ''))

const isLastStage = computed(() => !!journey.value && !!stage.value && stage.value.id === journey.value.stages.length)

function openGift() {
  const g = journey.value?.gift
  if (g) void router.push({ name: 'app-coloring', query: { source: prependBaseUrl(g.image), type: 'image' } })
}
</script>

<template lang="pug">
  div(v-if="journey && (stage || isExam)" class="stage")
    header(class="stage-head")
      AppHeader
      div(class="stage-head-body")
        div(class="stage-top")
          button(type="button" class="stage-back lk-btn lk-btn--outline lk-btn--small" :aria-label="backLabel" @click="onBack")
            ZIconography(name="chevron-left" :size="20")
            span {{ backLabel }}
          SoundPanel
        p(class="stage-kind") {{ isExam ? t('app.adventure.exam') : t('app.adventure.stageOf', { n: stage?.id ?? 0, total: journey.stages.length }) }}
        h1(class="stage-title") {{ isExam ? t('app.adventure.examTitle', { title: journey.title }) : stage?.title }}
        p(v-if="stage" class="stage-ref") {{ stage.ref }}
        ol(v-if="stage" class="stage-steps")
          li(v-for="(s, k) in steps" :key="s" :class="stepState(s)")
            span(class="step-dot")
              ZIconography(v-if="stepState(s) === 'done'" name="check" :size="22")
              template(v-else) {{ k + 1 }}
            span(class="step-label") {{ stepLabel(s) }}
        img(v-if="heroSrc" :src="heroSrc" alt="" class="stage-pic" draggable="false")

    main(class="stage-body")
      //- 1. the text
      section(v-if="phase === 'text' && stage" class="stage-card")
        ReadAloud(:key="stage.id" :text="stage.text" :audio="stage.audio")
        p(v-for="(p, i) in stage.text" :key="i" class="stage-text" :class="{ first: i === 0 }") {{ p }}
        div(class="stage-actions")
          AdvButton(tone="gold" @click="fromText") {{ backFrom ? t('app.adventure.next') : isQuizStage ? t('app.adventure.toQuestions') : t('app.adventure.toTask') }}

      //- 2. the task
      section(v-else-if="phase === 'task' && stage" class="stage-card")
        h2(class="stage-h2") {{ t('app.adventure.task') }}
        p(class="stage-hint") {{ stage.task.hint }}
        ul(v-if="paintJobs.length" class="stage-jobs" :aria-label="t('app.adventure.paintJobsTitle')")
          li(v-for="(j, i) in paintJobs" :key="i" class="stage-job") {{ j.hint }}
        AdventureCount(:key="gameKey" v-if="hasCountGame" :count="countN" :image="taskImage" :image-off="taskImageOff" :background="taskBackground" :groups="gameTask?.groups" :question="gameTask?.question" @done="taskDone")
        GamePuzzle(:key="gameKey" v-else-if="gameTask?.puzzle" :game="gameTask.puzzle" @done="taskDone")
        GameWay(:key="gameKey" v-else-if="gameTask?.way" :game="gameTask.way" @done="taskDone")
        GameHarvest(:key="gameKey" v-else-if="gameTask?.harvest" :game="gameTask.harvest" @done="taskDone")
        GameMemory(:key="gameKey" v-else-if="gameTask?.memory" :game="gameTask.memory" @done="taskDone")
        GameSort(:key="gameKey" v-else-if="gameTask?.sort" :game="gameTask.sort" @done="taskDone")
        GameFind(:key="gameKey" v-else-if="gameTask?.find" :game="gameTask.find" @done="taskDone")
        GameShare(:key="gameKey" v-else-if="gameTask?.share" :game="gameTask.share" @done="taskDone")
        GameStones(:key="gameKey" v-else-if="gameTask?.build?.ordered" :game="gameTask.build" @done="taskDone")
        GameBuild(:key="gameKey" v-else-if="gameTask?.build" :game="gameTask.build" @done="taskDone")
        GameDots(:key="gameKey" v-else-if="gameTask?.dots" :game="gameTask.dots" @done="taskDone")
        GameFly(:key="gameKey" v-else-if="gameTask?.fly" :game="gameTask.fly" @done="taskDone")
        GameOrder(:key="gameKey" v-else-if="gameTask?.order" :game="gameTask.order" @done="taskDone")
        GameWater(:key="gameKey" v-else-if="gameTask?.water" :game="gameTask.water" @done="taskDone")
        GameLights(:key="gameKey" v-else-if="gameTask?.lights" :game="gameTask.lights" @done="taskDone")
        GameVerse(:key="gameKey" v-else-if="gameTask?.verse" :game="gameTask.verse" @done="taskDone")
        GameEcho(:key="gameKey" v-else-if="gameTask?.echo" :game="gameTask.echo" @done="taskDone")
        GameChannels(:key="gameKey" v-else-if="gameTask?.channels" :game="gameTask.channels" @done="taskDone")
        GameMirror(:key="gameKey" v-else-if="gameTask?.mirror" :game="gameTask.mirror" @done="taskDone")
        GameSow(:key="gameKey" v-else-if="gameTask?.sow" :game="gameTask.sow" @done="taskDone")
        GameHerd(:key="gameKey" v-else-if="gameTask?.herd" :game="gameTask.herd" @done="taskDone")
        GameMissing(:key="gameKey" v-else-if="gameTask?.missing" :game="gameTask.missing" @done="taskDone")
        GameWipe(:key="gameKey" v-else-if="gameTask?.wipe" :game="gameTask.wipe" @done="taskDone")
        GameChain(:key="gameKey" v-else-if="gameTask?.chain" :game="gameTask.chain" @done="taskDone")
        GameStack(:key="gameKey" v-else-if="gameTask?.stack" :game="gameTask.stack" @done="taskDone")
        GameTrace(:key="gameKey" v-else-if="gameTask?.trace" :game="gameTask.trace" @done="taskDone")
        GameBalance(:key="gameKey" v-else-if="gameTask?.balance" :game="gameTask.balance" @done="taskDone")
        GameConstellation(:key="gameKey" v-else-if="gameTask?.constellation" :game="gameTask.constellation" @done="taskDone")
        GameSlide(:key="gameKey" v-else-if="gameTask?.slide" :game="gameTask.slide" @done="taskDone")
        GameCrank(:key="gameKey" v-else-if="gameTask?.crank" :game="gameTask.crank" @done="taskDone")
        GameHold(:key="gameKey" v-else-if="gameTask?.hold" :game="gameTask.hold" @done="taskDone")
        GameGuess(:key="gameKey" v-else-if="gameTask?.guess" :game="gameTask.guess" @done="taskDone")
        template(v-else-if="isPaint")
          img(:src="img(taskImage)" alt="" class="stage-paint" draggable="false")
          div(class="stage-actions")
            AdvButton(tone="gold" @click="startPaint") {{ t('app.adventure.paint') }}
        template(v-else)
          //- the other games are still to be built: nothing to play, so no star either
          div(class="stage-soon")
            p {{ t('app.adventure.soon') }}
          div(class="stage-actions")
            AdvButton(tone="gold" @click="taskDone(0)") {{ t('app.adventure.next') }}
        button(v-if="hasPart" type="button" class="stage-skip stage-part" @click="partTask") {{ t('app.adventure.partial', { n: partStars }, partStars) }}
        button(v-else-if="!progress.finished.value" type="button" class="stage-skip" @click="skipTask") {{ t('app.adventure.skip') }}
        //- a small sign at the bottom: play the game again from the start (text and questions stay)
        button(v-if="hasGame" type="button" class="stage-restart" :aria-label="t('app.adventure.restartGame')" :title="t('app.adventure.restartGame')" @click="restartGame")
          svg(viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true")
            path(d="M20 12a8 8 0 1 1-2.6-5.9")
            path(d="M20 4v5h-5")

      //- 2b. the finished picture, with a little shine
      section(v-else-if="phase === 'painted'" class="stage-card stage-result")
        h2(class="stage-h2") {{ t('app.adventure.bridgeTitle') }}
        div(class="painted")
          img(v-if="paintedSrc" :src="paintedSrc" alt="" class="painted-img" draggable="false")
          img(v-for="(g, k) in glints" :key="k" :src="ui('sternglanz')" alt="" class="glint" :style="glintStyle(g)" draggable="false")
        AdventureStars(:stars="paintedStars" :size="52" :celebrate="paintedStars > 0" :hush="leaving" class="burst-stars")
        ul(v-if="paintRows.length" class="painted-jobs" :aria-label="t('app.adventure.paintJobsTitle')")
          li(v-for="(r, i) in paintRows" :key="i" class="painted-job" :class="{ done: r.status === 'met', open: r.status && r.status !== 'met' }")
            span(class="painted-mark" aria-hidden="true") {{ r.mark }}
            span(class="painted-job-text")
              span {{ r.job.hint }}
              span(v-if="r.note" class="painted-note" :class="{ wrong: r.status === 'wrong' }" role="status") {{ r.note }}
              span(class="sr-only") {{ r.status === 'met' ? t('app.adventure.paintJobDone') : t('app.adventure.paintJobOpen') }}
        p(class="result-line") {{ paintedStars >= 3 || !paintRows.length ? (paintedStars > 0 ? t('app.adventure.paintedText') : t('app.adventure.paintedMore')) : t('app.adventure.paintedLess') }}
        div(class="stage-actions")
          //- the child may always go on painting: what is painted stays (the picture is kept), and the next "done" counts again
          AdvButton(:tone="paintedStars === 0 ? 'gold' : 'blau'" @click="startPaint") {{ t('app.adventure.paintOn') }}
          AdvButton(:tone="paintedStars === 0 ? 'blau' : 'gold'" @click="phase = 'quiz'") {{ t('app.adventure.next') }}

      //- 3. the overview between the game and the questions: the game is done, the stage is not
      section(v-else-if="phase === 'bridge'" class="stage-card stage-result")
        h2(class="stage-h2") {{ t('app.adventure.bridgeTitle') }}
        p(class="result-line") {{ gameStars ? t('app.adventure.bridgeText') : t('app.adventure.bridgeSkipped') }}
        AdventureOverview(:rows="overviewRows(true)")
        div(class="stage-actions")
          AdvButton(tone="gold" @click="phase = 'quiz'") {{ t('app.adventure.toQuestions') }}

      //- 4. the questions (they stay where they were when the story is read in between)
      section(v-if="quizStarted && phase !== 'result'" v-show="phase === 'quiz'" class="stage-card")
        AdventureQuiz(:key="questionsKey" :questions="questionsNow" @done="quizDone")

      //- 5. the result
      section(v-if="phase === 'result'" class="stage-card stage-result")
        template(v-if="isExam")
          h2(class="stage-h2") {{ t('app.adventure.examDone') }}
          img(v-if="cup" :src="cup" alt="" class="result-cup" :class="`cup-${medal}`" draggable="false")
          p(v-if="medal" class="result-medal") {{ t(`app.adventure.medal_${medal}`) }}
          p(class="result-points") {{ t('app.adventure.points', { n: total, max }) }}
          p(class="result-line") {{ t('app.adventure.examRight', { n: exam?.correct ?? 0, total: exam?.total ?? 0 }) }}
          p(v-if="!medal" class="result-line") {{ t('app.adventure.noMedal') }}
          div(class="stage-actions")
            AdvButton(v-if="medal" tone="gold" @click="openGift") {{ t('app.adventure.gift', { title: journey.gift.title }) }}
            AdvButton(tone="blau" @click="retry") {{ t('app.adventure.retry') }}
            AdvButton(tone="blau" @click="goMap()") {{ t('app.adventure.backToMap') }}
        template(v-else)
          h2(class="stage-h2") {{ t('app.adventure.stageDone') }}
          AdventureStars(:stars="shownStars" :size="60" celebrate :hush="leaving" class="burst-stars")
          p(class="result-line") {{ shownStars === 0 ? t('app.adventure.noStars') : t('app.adventure.starsEarned', { n: shownStars }, shownStars) }}
          //- the account of the stars: the same lines at every stage, so the child sees where each star came from
          ul(class="account")
            li(v-if="!isQuizStage" class="account-row")
              span {{ t('app.adventure.accGame') }}
              strong {{ gameStars }}
            li(class="account-row")
              span {{ t('app.adventure.accRight') }}
              strong {{ isQuizStage ? tryCorrect : '+' + tryCorrect }}
            li(v-if="!isQuizStage" class="account-row" :class="{ minus: tryWrong > 0 }")
              span {{ t('app.adventure.accWrong') }}
              strong {{ tryWrong > 0 ? '−' + tryWrong : '0' }}
          AdventureOverview(:rows="overviewRows(false)")
          div(class="stage-actions")
            AdvButton(tone="gold" @click="goMap(stage?.id, lastWasFirst)") {{ isLastStage ? t('app.adventure.toExam') : t('app.adventure.backToMap') }}
            AdvButton(v-if="shownStars < 3" tone="blau" @click="retry") {{ t('app.adventure.retry') }}

  div(v-else class="stage stage-missing")
    p {{ t('app.adventure.notFound') }}
    AdvButton(tone="gold" @click="goMap()") {{ t('app.adventure.backToMap') }}
</template>

<style scoped lang="sass">
$ink: var(--lk-text)

.stage
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px))

.stage-head-body
  max-width: 640px
  margin: 0 auto
  padding: 0 16px

.stage-top
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.stage-back
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

.stage-kind
  margin: 14px 0 0
  color: var(--lk-muted)
  font-size: 1.1rem

.stage-title
  margin: 2px 0 0
  font-weight: 800
  font-size: 1.9rem
  line-height: 1.12

.stage-ref
  margin: 4px 0 0
  font-size: 1rem
  font-weight: 600
  color: var(--lk-muted)

// the three steps: story, task, questions
.stage-steps
  display: flex
  align-items: flex-start
  justify-content: space-between
  list-style: none
  margin: 16px 0 0
  padding: 0
  position: relative

  &::before
    content: ''
    position: absolute
    left: 12%
    right: 12%
    top: 21px
    height: 2px
    background: var(--lk-line)

  li
    position: relative
    flex: 1
    display: flex
    flex-direction: column
    align-items: center
    gap: 6px

.step-dot
  width: 44px
  height: 44px
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center
  background: var(--lk-surface)
  border: 2px solid var(--lk-line)
  color: var(--lk-muted)
  font-weight: 800
  font-size: 1.1rem

  :deep(.z-icon-outline)
    color: currentColor

.step-label
  font-size: 1rem
  font-weight: 600
  color: var(--lk-muted)

.done .step-dot
  background: var(--lk-accent)
  border-color: var(--lk-accent)
  color: var(--lk-on-accent)

.now .step-dot
  border-color: var(--lk-accent)
  color: var(--lk-text)

.now .step-label
  color: var(--lk-text)
  font-weight: 800

.stage-pic
  display: block
  width: 100%
  aspect-ratio: 3 / 2
  object-fit: cover
  margin: 16px 0 0
  border-radius: var(--lk-r-group)
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)

.stage-body
  max-width: 640px
  margin: 0 auto
  padding: 14px 16px 0

.stage-card
  padding: 20px 18px
  border-radius: var(--lk-r-group)
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.stage-text
  margin: 0 0 16px
  font-size: 1.3rem
  font-weight: 700
  line-height: 1.5

.stage-h2
  margin: 0 0 6px
  font-weight: 800
  font-size: 1.5rem

.stage-jobs
  margin: 6px 0 0
  padding: 0
  list-style: none
  text-align: center

.stage-job
  margin: 3px 0
  font-weight: 800
  color: #8a5a00

.painted-jobs
  margin: 6px auto 0
  padding: 0
  list-style: none
  width: min(100%, 420px)
  text-align: left

.painted-job
  display: flex
  gap: 10px
  align-items: flex-start
  padding: 6px 4px
  font-weight: 700

.painted-mark
  flex: none
  width: 1.6em
  height: 1.6em
  border-radius: 50%
  display: inline-flex
  align-items: center
  justify-content: center
  font-weight: 900
  background: #ddd
  color: #fff

.painted-job.done .painted-mark
  background: #2fae54

.painted-job.open .painted-mark
  background: #c0392b

.painted-job-text
  display: flex
  flex-direction: column

.painted-note
  font-size: 1rem
  font-weight: 700
  color: #5f4f35

  &.wrong
    color: #a3321f

.sr-only
  position: absolute
  width: 1px
  height: 1px
  overflow: hidden
  clip: rect(0 0 0 0)

.stage-hint
  margin: 0 0 14px
  font-size: 1.1rem
  color: var(--lk-muted)

.stage-actions
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  margin-top: 10px

.stage-paint
  display: block
  width: min(100%, 320px)
  margin: 0 auto 10px
  border-radius: 12px
  background: #fff
  border: 2px solid rgba(212, 168, 62, 0.55)

.stage-soon
  padding: 22px 14px
  border: 2px dashed rgba(212, 168, 62, 0.7)
  border-radius: 16px
  text-align: center
  font-weight: 700
  color: var(--lk-muted)

  p
    margin: 0

.account
  list-style: none
  margin: 6px 0 4px
  padding: 0
  width: 100%
  max-width: 320px
  align-self: center

.account-row
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  padding: 6px 4px
  border-bottom: 1px solid var(--lk-line)
  font-size: 1rem

  &.minus
    color: #a93d2e

.stage-part
  font-weight: 800

.stage-restart
  display: flex
  align-items: center
  justify-content: center
  width: 44px
  height: 44px
  margin: 8px auto 0
  padding: 0
  border: 1.5px solid var(--lk-line)
  border-radius: 50%
  // solid, so that it can be seen on any page
  background: var(--lk-surface)
  color: var(--lk-text)
  cursor: pointer

  &:hover,
  &:focus-visible
    border-color: var(--lk-accent)

// the small buttons under a game ("Weiter (1 Stern)", "Überspringen"): a solid pill with a fine line, centred, as high as a finger
.stage-skip
  display: flex
  align-items: center
  justify-content: center
  width: fit-content
  max-width: 100%
  margin: 12px auto 0
  padding: 0 22px
  min-height: 44px
  border: 1.5px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 700
  cursor: pointer

  &:hover,
  &:focus-visible
    border-color: var(--lk-accent)

.stage-result
  text-align: center

.result-cup
  display: block
  margin: 8px auto

  &.cup-bronze
    height: 150px

  &.cup-silver
    height: 200px

  &.cup-gold
    height: 290px

  filter: drop-shadow(0 10px 12px rgba(60, 40, 10, 0.4))

.result-medal
  margin: 0
  font-weight: 800
  font-size: 1.5rem

.result-points
  margin: 6px 0 2px
  font-weight: 800
  font-size: 2rem
  color: var(--lk-text)

.result-line
  margin: 8px 0
  font-size: 1.05rem
  color: var(--lk-muted)

  &.lost
    color: #a93d2e
    font-weight: 700

.burst-stars
  margin: 10px 0 18px

// the halo of three stars needs room above and below
.painted ~ .burst-stars
  margin: 26px 0 30px

// the finished picture on a little paper, with lights that flash up around it
.painted
  position: relative
  width: min(100%, 300px)
  margin: 8px auto 4px

.painted-img
  display: block
  width: 100%
  min-height: 120px
  border-radius: 12px
  background: #fff
  border: 2px solid rgba(212, 168, 62, 0.7)
  box-shadow: 0 10px 24px -10px rgba(60, 40, 10, 0.55)
  animation: painted-in 700ms cubic-bezier(0.2, 1.3, 0.4, 1) both

.glint
  position: absolute
  width: calc(46px * var(--s, 1))
  height: auto
  margin: -23px 0 0 -23px
  pointer-events: none
  opacity: 0
  animation: glint-flash 1800ms ease-in-out 3 both

@keyframes painted-in
  from
    opacity: 0
    transform: scale(0.85) rotate(-2deg)

@keyframes glint-flash
  0%
    opacity: 0
    transform: scale(0.2) rotate(0)
  35%
    opacity: 1
    transform: scale(1.1) rotate(40deg)
  70%
    opacity: 0.8
    transform: scale(0.8) rotate(80deg)
  100%
    opacity: 0
    transform: scale(0.3) rotate(120deg)

@media (prefers-reduced-motion: reduce)
  .painted-img
    animation: none

  .glint
    display: none

.stage-missing
  display: grid
  place-content: center
  gap: 14px
  text-align: center
  padding: 24px
</style>
