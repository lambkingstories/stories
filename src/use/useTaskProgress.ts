import { ref } from 'vue'

/**
 * How much the child did in the game of the stage that is open: every right move (a thing found, a sack stored, a pair, a piece, a way) counts
 * one part. The stage page reads it: with at least one part the button says "Go on" and gives one star for the part that was done; without any
 * part the game can only be skipped, without a star.
 */
const parts = ref(0)

export default function useTaskProgress() {
  return {
    parts,
    mark: () => {
      parts.value++
    },
    reset: () => {
      parts.value = 0
    }
  }
}
