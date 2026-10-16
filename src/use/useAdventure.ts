/**
 * What the child has done in the adventures. Everything stays on the device (like the paintings and the awards); nothing is sent
 * anywhere. The best result of a stage is kept: a stage can be played again, and a worse try never takes stars away.
 */
import { computed, reactive } from 'vue'
import type { JourneyProgress, StageProgress } from '@/types/adventure'
import { MAX_STARS } from '@/utils/adventureScore'

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

    /** The stars of the task of a stage; the best result is kept. */
    recordStars(journeyId: string, stageId: number, stars: number) {
      const s = stage(journeyId, stageId)
      s.stars = Math.max(s.stars, clampStars(stars))
      s.gameStars = Math.max(s.gameStars ?? 0, clampStars(stars))
      save()
    },
    /** The stars that count once the questions are done (the best try is kept). */
    recordFinal(journeyId: string, stageId: number, stars: number) {
      const s = stage(journeyId, stageId)
      s.finalStars = Math.max(s.finalStars ?? 0, clampStars(stars))
      save()
    },
    /** The answers to the questions of a stage. */
    recordQuiz(journeyId: string, stageId: number, correct: number) {
      const s = stage(journeyId, stageId)
      s.quizCorrect = Math.max(s.quizCorrect ?? 0, correct)
      save()
    },
    /** The stage was gone through to the end: the next one opens. */
    completeStage(journeyId: string, stageId: number) {
      stage(journeyId, stageId).done = true
      save()
    },
    recordExam(journeyId: string, correct: number, total: number) {
      const j = journey(journeyId)
      if (!j.exam || correct >= j.exam.correct) j.exam = { correct, total }
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
