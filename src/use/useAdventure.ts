/**
 * What the child has done in the adventures. Everything stays on the device (like the paintings and the awards); nothing is sent
 * anywhere. A stage can be played again: the result of the new try replaces the old one, but the best stars of all tries are kept
 * (`bestStars`), so a worse try later never takes a star, a card or a cup away.
 */
import { computed, reactive } from 'vue'
import type { JourneyProgress, StageProgress } from '@/types/adventure'
import { MAX_STARS } from '@/utils/adventureScore'
import { useActivity } from '@/use/useActivity'

const KEY = 'lk-adventure-v1'

type Saved = Record<string, JourneyProgress>

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    if (raw && typeof raw === 'object') return raw
  } catch {
    // start fresh
  }
  return {}
}

const state = reactive<Saved>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // a private window: the progress is not remembered
  }
}

function journey(id: string): JourneyProgress {
  if (!state[id]) state[id] = { stages: {} }
  return state[id]!
}

function stage(journeyId: string, stageId: number): StageProgress {
  const j = journey(journeyId)
  if (!j.stages[stageId]) j.stages[stageId] = { stars: 0, done: false }
  return j.stages[stageId]!
}

const clampStars = (n: number) => Math.min(MAX_STARS, Math.max(0, Math.round(n)))

export default function useAdventure() {
  return {
    state,
    progressOf: (journeyId: string): JourneyProgress | undefined => state[journeyId],
    stageOf: (journeyId: string, stageId: number): StageProgress | undefined => state[journeyId]?.stages[stageId],

    /** The stars of the task of a stage: the result of the newest try. The stars of the questions of an earlier try are no longer valid. */
    recordStars(journeyId: string, stageId: number, stars: number) {
      const s = stage(journeyId, stageId)
      // the final stars of the try before are about to go: keep them as the best so far
      if (s.finalStars !== undefined) s.bestStars = Math.max(s.bestStars ?? 0, s.finalStars)
      s.stars = clampStars(stars)
      s.gameStars = clampStars(stars)
      delete s.finalStars
      delete s.quizCorrect
      save()
    },
    /** The stars that count once the questions are done (the newest try). */
    recordFinal(journeyId: string, stageId: number, stars: number) {
      const s = stage(journeyId, stageId)
      s.finalStars = clampStars(stars)
      s.bestStars = Math.max(s.bestStars ?? 0, s.finalStars)
      save()
    },
    /** The answers to the questions of a stage (the newest try). */
    recordQuiz(journeyId: string, stageId: number, correct: number) {
      const s = stage(journeyId, stageId)
      s.quizCorrect = correct
      save()
    },
    /** The stage was gone through to the end: the next one opens. */
    completeStage(journeyId: string, stageId: number) {
      const s = stage(journeyId, stageId)
      if (!s.done) useActivity().count('stages')
      s.done = true
      save()
    },
    recordExam(journeyId: string, correct: number, total: number) {
      const j = journey(journeyId)
      if (!j.exam || correct >= j.exam.correct) j.exam = { correct, total }
      save()
    },
    /** The test build only: put the whole progress in one go (all stars unlocked) or back (what was kept before). */
    replaceAll(saved: Saved) {
      for (const k of Object.keys(state)) delete state[k]
      Object.assign(state, saved)
      save()
    },
    /** For the tests and the "start again" button. */
    reset(journeyId: string) {
      delete state[journeyId]
      save()
    },
    hasStarted: computed(() => Object.keys(state).length > 0)
  }
}
