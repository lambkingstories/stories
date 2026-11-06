<script setup lang="ts">
/**
 * The page of a big game (`/app/spiel/:gameId`). The game is only opened when the stars of the adventures reach its number
 * (a link with `?probe=1` opens it for testing). The game itself lives in its own component.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { journeys } from '@/data/adventures'
import { BIG_GAMES } from '@/data/bigGames'
import useAdventure from '@/use/useAdventure'
import { totalStars } from '@/utils/bigGames'
import BigGameDavid from '@/components/molecules/games/BigGameDavid.vue'
import BigGameElia from '@/components/molecules/games/BigGameElia.vue'

const route = useRoute()
const router = useRouter()
const adv = useAdventure()

const game = computed(() => BIG_GAMES.find((g) => g.id === route.params.gameId))
const open = computed(() => !!game.value && (route.query.probe === '1' || totalStars(journeys, adv.progressOf) >= game.value.at))

function leave() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}
</script>

<template lang="pug">
  BigGameDavid(v-if="game?.id === 'david' && open" @leave="leave")
  BigGameElia(v-else-if="game?.id === 'elia' && open" @leave="leave")
  div(v-else class="bg-closed")
    button(type="button" class="bg-closed-btn" @click="leave") ←
</template>

<style scoped lang="sass">
.bg-closed
  min-height: 100vh
  display: grid
  place-items: center
  background: var(--lk-bg)

.bg-closed-btn
  padding: 12px 22px
  border-radius: 999px
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  font-size: 1.2rem
  cursor: pointer
</style>
