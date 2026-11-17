<script setup lang="ts">
/**
 * The adventure games on a page of their own (Anton, 17.11.2026): the bar "You may pick a game!", the ten big games and the window to pick one.
 * Reached from the card "Adventure games" of "My games" (`app-gameroom`); back leads there.
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import MyRewards from '@/components/molecules/MyRewards.vue'
import { goBackTo } from '@/utils/navBack'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.bigGames.title')" :subtitle="t('app.bigGames.rooms.adventureSub')" @back="goBackTo(router, { name: 'app-gameroom' })")
    div(class="gp-wrap")
      MyRewards(part="games" section="bonus")
</template>

<style scoped lang="sass">
.gp-wrap
  max-width: 760px
  margin: 0 auto
  padding: 0 16px 120px
</style>
