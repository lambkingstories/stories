<script setup lang="ts">
/**
 * One stage of an adventure (or the exam at the end): the text, the task, the questions, and the result with its stars.
 * The round picture at the top is the stage's scene cut out of the painted map. The coloring task opens the coloring screen and
 * comes back here (`?back=task`) with the stars it earned.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureCount from '@/components/molecules/AdventureCount.vue'
import AdventureOverview, { type OverviewRow } from '@/components/molecules/AdventureOverview.vue'
import AdventureQuiz from '@/components/molecules/AdventureQuiz.vue'
import GameFind from '@/components/molecules/games/GameFind.vue'
import GameHarvest from '@/components/molecules/games/GameHarvest.vue'
import GameMemory from '@/components/molecules/games/GameMemory.vue'
import GamePuzzle from '@/components/molecules/games/GamePuzzle.vue'
import GameSort from '@/components/molecules/games/GameSort.vue'
import GameWay from '@/components/molecules/games/GameWay.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import ReadAloud from '@/components/molecules/ReadAloud.vue'
import { journeyById } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { getArtwork, pageArtworkId } from '@/use/useArtworks'
import { prependBaseUrl } from '@/utils/function'
import useTaskProgress from '@/use/useTaskProgress'
import { finalStars, maxPoints, medalFor, pointsOf, quizStars, stageStarsOf } from '@/utils/adventureScore'
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
/** The best result is higher than this try. */
const bestHigher = computed(() => (phase.value === 'result' && tryFinal.value !== null && stageStars.value > tryFinal.value ? stageStars.value : 0))
/** Which try this is: a new one starts the questions afresh. */
const attempt = ref(0)

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
  if (isExam.value || phase.value === 'result') {
    goMap()
    return
  }
  if (phase.value === 'text') {
    goMap()
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

/** Back to the map; from a finished stage the map slides on to the next one (`from`). */
function goMap(from?: number) {
  const j = journey.value
  if (!j) return
  void router.replace({ name: 'app-adventure-map', params: { journeyId: j.id }, query: from ? { from: String(from) } : {} })
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

// what the child did in the game: with at least one right move the button goes on and gives one star for that part
const progress = useTaskProgress()
watch(phase, (p) => {
  if (p === 'task') progress.reset()
})
const hasPart = computed(() => progress.parts.value > 0)

function partTask() {
  taskDone(1)
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

function quizDone(correct: number) {
  const j = journey.value
  if (!j) return
  if (isExam.value) {
    adv.recordExam(j.id, correct, j.exam.length)
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
    adv.completeStage(j.id, stage.value.id)
  }
  phase.value = 'result'
}

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
        button(type="button" class="stage-back lk-btn lk-btn--outline lk-btn--small" :aria-label="backLabel" @click="onBack")
          ZIconography(name="chevron-left" :size="20")
          span {{ backLabel }}
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
        AdventureCount(v-if="hasCountGame" :count="countN" :image="taskImage" :image-off="taskImageOff" :background="taskBackground" :groups="gameTask?.groups" :question="gameTask?.question" @done="taskDone")
        GamePuzzle(v-else-if="gameTask?.puzzle" :game="gameTask.puzzle" @done="taskDone")
        GameWay(v-else-if="gameTask?.way" :game="gameTask.way" @done="taskDone")
        GameHarvest(v-else-if="gameTask?.harvest" :game="gameTask.harvest" @done="taskDone")
        GameMemory(v-else-if="gameTask?.memory" :game="gameTask.memory" @done="taskDone")
        GameSort(v-else-if="gameTask?.sort" :game="gameTask.sort" @done="taskDone")
        GameFind(v-else-if="gameTask?.find" :game="gameTask.find" @done="taskDone")
        template(v-else-if="isPaint")
          img(:src="img(taskImage)" alt="" class="stage-paint" draggable="false")
          div(class="stage-actions")
            AdvButton(tone="gold" @click="startPaint") {{ t('app.adventure.paint') }}
        template(v-else)
          //- the other games are still to be built: taking part counts one star
          div(class="stage-soon")
            p {{ t('app.adventure.soon') }}
          div(class="stage-actions")
            AdvButton(tone="gold" @click="taskDone(1)") {{ t('app.adventure.next') }}
        button(v-if="hasPart" type="button" class="stage-skip stage-part" @click="partTask") {{ t('app.adventure.partial') }}
        button(v-else type="button" class="stage-skip" @click="skipTask") {{ t('app.adventure.skip') }}

      //- 2b. the finished picture, with a little shine
      section(v-else-if="phase === 'painted'" class="stage-card stage-result")
        h2(class="stage-h2") {{ t('app.adventure.bridgeTitle') }}
        div(class="painted")
          img(v-if="paintedSrc" :src="paintedSrc" alt="" class="painted-img" draggable="false")
          img(v-for="(g, k) in glints" :key="k" :src="ui('sternglanz')" alt="" class="glint" :style="glintStyle(g)" draggable="false")
        AdventureStars(:stars="paintedStars" :size="52" :celebrate="paintedStars > 0" class="burst-stars")
        p(class="result-line") {{ paintedStars > 0 ? t('app.adventure.paintedText') : t('app.adventure.paintedMore') }}
        div(class="stage-actions")
          AdvButton(v-if="paintedStars === 0" tone="gold" @click="startPaint") {{ t('app.adventure.paintOn') }}
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
          AdventureStars(:stars="shownStars" :size="60" celebrate class="burst-stars")
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
          p(v-if="bestHigher > 0" class="result-line") {{ t('app.adventure.bestSoFar', { n: bestHigher }, bestHigher) }}
          AdventureOverview(:rows="overviewRows(false)")
          div(class="stage-actions")
            AdvButton(tone="gold" @click="goMap(stage?.id)") {{ isLastStage ? t('app.adventure.toExam') : t('app.adventure.backToMap') }}
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
  font-size: 0.95rem
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
  font-size: 0.95rem
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
  justify-content: space-between
  gap: 12px
  padding: 6px 4px
  border-bottom: 1px solid var(--lk-line)
  font-size: 1rem

  &.minus
    color: #a93d2e

.stage-part
  font-weight: 800

.stage-skip
  display: block
  margin: 12px auto 0
  padding: 12px 14px
  min-height: 44px
  border: 0
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 700
  text-decoration: underline
  cursor: pointer

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
