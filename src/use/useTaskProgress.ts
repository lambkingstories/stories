import { ref } from 'vue'

/**
 * How much the child did in the game of the stage that is open: every right move (a thing found, a sack stored, a pair, a piece, a way) counts
 * one part, and the game says how many parts make the whole task (`setGoal`). The stage page reads both: the share that was done gives the stars
 * of "Go on" (`partialStars`: two thirds 2 stars, 30 % one star); below 30 % the game can only be skipped, without a star.
 */
const parts = ref(0)
/** How many right moves the whole game takes (set by the game when it opens). */
const goal = ref(0)
/** The game is over (its end page with the stars is on): the link that gives one star for a part is not offered any more. */
const finished = ref(false)

export default function useTaskProgress() {
  return {
    parts,
    goal,
    setGoal: (n: number) => {
      goal.value = n
    },
    finished,
    mark: () => {
      parts.value++
    },
    finish: () => {
      finished.value = true
    },
    reset: () => {
      parts.value = 0
      finished.value = false
    }
  }
}
