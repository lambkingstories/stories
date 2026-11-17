/**
 * What the child has won on the adventures, counted: the golden cards (one per finished adventure) and the cups. It is the one place that
 * does this sum, so "My rewards" (the full page) and the slim line at the top of the adventure page always say the same.
 * Everything is worked out from the progress of the adventures (nothing extra is stored).
 */
import { computed } from 'vue'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { CARD_ART } from '@/data/cardArt'
import { inBibleOrder } from '@/utils/continueJourney'
import { maxPoints, pointsOf } from '@/utils/adventureScore'
import { albumCards, albumSetCard, cupStats } from '@/utils/collection'
import { cupOf } from '@/utils/rewards'

export default function useRewardCounts() {
  const adv = useAdventure()

  /** One place per adventure: the cup (if won) and how far the child is from it. */
  const cups = computed(() => inBibleOrder(journeys).map((j) => ({ journey: j, ...cupStats(j, adv.progressOf(j.id), cupOf, pointsOf, maxPoints) })))
  const wonCups = computed(() => cups.value.filter((c) => c.cup).length)

  /** One golden card per adventure: it is won when every stage was gone through. */
  const albums = computed(() =>
    inBibleOrder(journeys)
      .map((j) => {
        const cards = albumCards(j, (stageId) => adv.stageOf(j.id, stageId))
        return { journey: j, cards, set: albumSetCard(j, cards), art: CARD_ART[j.id] }
      })
      .filter((a) => a.cards.length > 0)
  )
  const wonCards = computed(() => albums.value.filter((a) => a.set.have).length)

  return { cups, wonCups, albums, wonCards }
}
