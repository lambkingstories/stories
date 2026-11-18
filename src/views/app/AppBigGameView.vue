<script setup lang="ts">
/**
 * The page of a big game (`/app/spiel/:gameId`). The game is only opened when the child picked it with a wish; otherwise the page
 * shows the tile of the game, says in one sentence that it is not unlocked yet and leads to the game room, where it is picked.
 * A link with `?probe=1` opens a game for testing, but only in the test app and in development (never in a store build).
 * The game itself lives in its own component.
 */
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BIG_GAMES } from '@/data/bigGames'
import useBigGames from '@/use/useBigGames'
import { PLUS_TEST } from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'
const BigGameBogen = defineAsyncComponent(() => import('@/components/molecules/games/BigGameBogen.vue'))
const BigGameDavid = defineAsyncComponent(() => import('@/components/molecules/games/BigGameDavid.vue'))
const BigGameElia = defineAsyncComponent(() => import('@/components/molecules/games/BigGameElia.vue'))
const BigGameKornspeicher = defineAsyncComponent(() => import('@/components/molecules/games/BigGameKornspeicher.vue'))
const BigGameKarawane = defineAsyncComponent(() => import('@/components/molecules/games/BigGameKarawane.vue'))
const BigGameLamm = defineAsyncComponent(() => import('@/components/molecules/games/BigGameLamm.vue'))
const BigGameMemory = defineAsyncComponent(() => import('@/components/molecules/games/BigGameMemory.vue'))
const BigGameMose = defineAsyncComponent(() => import('@/components/molecules/games/BigGameMose.vue'))
const BigGameWasser = defineAsyncComponent(() => import('@/components/molecules/games/BigGameWasser.vue'))
const BigGameNehemia = defineAsyncComponent(() => import('@/components/molecules/games/BigGameNehemia.vue'))

const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const bg = useBigGames()

const game = computed(() => BIG_GAMES.find((g) => g.id === route.params.gameId))
/** The test door `?probe=1`: only where the test switch is on (the test app) or in development, never in a store build. */
const PROBE_ALLOWED: boolean = PLUS_TEST || import.meta.env.DEV
const open = computed(() => !!game.value && ((PROBE_ALLOWED && route.query.probe === '1') || bg.isPicked(game.value.id)))
const gameTitle = computed(() => (game.value ? t(`app.bigGames.${game.value.id}.title`) : ''))

function toGameRoom() {
  void router.push({ name: 'app-games-adventure' })
}

function leave() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}
</script>

<template lang="pug">
  BigGameDavid(v-if="game?.id === 'david' && open" @leave="leave")
  BigGameElia(v-else-if="game?.id === 'elia' && open" @leave="leave")
  BigGameKornspeicher(v-else-if="game?.id === 'kornspeicher' && open" @leave="leave")
  BigGameWasser(v-else-if="game?.id === 'wasser' && open" @leave="leave")
  BigGameMose(v-else-if="game?.id === 'mose' && open" @leave="leave")
  BigGameKarawane(v-else-if="game?.id === 'karawane' && open" @leave="leave")
  BigGameNehemia(v-else-if="game?.id === 'nehemia' && open" @leave="leave")
  BigGameMemory(v-else-if="game?.id === 'memory' && open" @leave="leave")
  BigGameLamm(v-else-if="game?.id === 'lamm' && open" @leave="leave")
  BigGameBogen(v-else-if="game?.id === 'bogen' && open" @leave="leave")
  div(v-else class="bg-closed")
    img(v-if="game" class="bg-closed-pic" :src="prependBaseUrl(game.image)" alt="" draggable="false")
    h1(v-if="game" class="bg-closed-title") {{ gameTitle }}
    p(class="bg-closed-note" role="status") {{ t('app.bigGames.closedSentence') }}
    button(type="button" class="bg-closed-btn" @click="toGameRoom") {{ t('app.bigGames.toGameRoom') }}
    button(type="button" class="bg-closed-back" @click="leave") {{ t('app.bigGames.back') }}
</template>

<style scoped lang="sass">
.bg-closed
  min-height: 100vh
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 16px
  padding: 20px
  background: var(--lk-bg)
  color: var(--lk-text)

.bg-closed-pic
  width: min(70vw, 280px)
  aspect-ratio: 1
  object-fit: cover
  border-radius: 24px
  filter: grayscale(0.55)
  opacity: 0.85
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18)

.bg-closed-title
  margin: 0
  font-size: 1.5rem
  font-weight: 900
  text-align: center

.bg-closed-note
  margin: 0
  max-width: 28em
  font-weight: 700
  font-size: 1.1rem
  line-height: 1.4
  text-align: center

.bg-closed-btn
  min-height: 56px
  padding: 14px 32px
  border-radius: 999px
  border: 0
  background: var(--lk-fill)
  color: var(--lk-on-color)
  font-size: 1.25rem
  font-weight: 900
  cursor: pointer

.bg-closed-back
  min-height: 48px
  padding: 8px 18px
  border: 0
  background: transparent
  color: var(--lk-text)
  font-size: 1.05rem
  text-decoration: underline
  cursor: pointer
</style>
