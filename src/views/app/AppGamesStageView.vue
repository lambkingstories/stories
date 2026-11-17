<script setup lang="ts">
/**
 * The stage games on a page of their own (Anton, 17.11.2026), in groups, one per adventure: a game opens with the three stars of its stage.
 * Reached from the card "Stage games" of "My games" (`app-gameroom`); back leads there.
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
    LkPageHead(:title="t('app.profile.stageGamesTitle')" :subtitle="t('app.bigGames.rooms.stageSub')" @back="goBackTo(router, { name: 'app-gameroom' })")
    div(class="gp-wrap")
      MyRewards(part="games" section="mini")
</template>

<style scoped lang="sass">
.gp-wrap
  max-width: 760px
  margin: 0 auto
  padding: 0 16px 120px
</style>
