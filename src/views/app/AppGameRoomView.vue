<script setup lang="ts">
/**
 * "Mein Spielzimmer": all the games in one place. The way to the next big game (stars), the big games (bonus games) and the mini games that
 * come with the three stars of their stage (see `MyRewards`). A link from the adventures can ask for one list only (`?z=mini` or
 * `?z=bonus`): the tile "Minispiele" shows the mini games only, the tile "Bonusspiele" the bonus games only.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import MyRewards from '@/components/molecules/MyRewards.vue'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()

const section = computed<'all' | 'mini' | 'bonus'>(() => (route.query.z === 'mini' ? 'mini' : route.query.z === 'bonus' ? 'bonus' : 'all'))
const title = computed(() => (section.value === 'mini' ? t('app.profile.miniTitle') : section.value === 'bonus' ? t('app.bigGames.title') : t('app.profile.gameRoom')))

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="title" :subtitle="t('app.profile.gameRoomSub')" @back="goBack")
    div(class="gr-wrap")
      MyRewards(part="games" :section="section")
</template>

<style scoped lang="sass">
.gr-wrap
  max-width: 760px
  margin: 0 auto
  padding: 0 16px 120px
</style>
