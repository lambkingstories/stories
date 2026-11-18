/**
 * The wishes for a big game (Anton, 17.11.2026): for every full `STEP` stars on the adventures the child may pick one game, and it picks which
 * one. A game is open when it was picked. The wishes are only worked out (stars / STEP, minus the games already picked), nothing else is
 * saved, so a child who had its stars before the wishes came gets them as well.
 */
import { computed } from 'vue'
import { journeys } from '@/data/adventures'
import { BIG_GAMES } from '@/data/bigGames'
import useAdventure from '@/use/useAdventure'
import useBigGames from '@/use/useBigGames'
import { bigGameStates, canPick, isGameOpen, totalStars, wishState } from '@/utils/bigGames'

export default function useGameWishes() {
  const adv = useAdventure()
  const bg = useBigGames()
  const stars = computed(() => totalStars(journeys, adv.progressOf))
  const wishes = computed(() => wishState(BIG_GAMES, stars.value, bg.picked()))
  const states = computed(() => bigGameStates(BIG_GAMES, bg.picked(), stars.value))

  return {
    stars,
    wishes,
    states,
    isOpen: (id: string): boolean => isGameOpen(BIG_GAMES, stars.value, bg.picked(), id),
    /** Picks a game with a free wish. Returns false (and changes nothing) when no wish is free or the game is open already. */
    pick(id: string): boolean {
      if (!canPick(BIG_GAMES, stars.value, bg.picked(), id)) return false
      bg.addPick(id)
      return true
    }
  }
}
