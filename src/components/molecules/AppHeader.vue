<script setup lang="ts">
/**
 * The top line of the main screens: Anton's logo (the lamb and the word mark, cut from his logo file; the word mark has a
 * cream version for the night look) on the left, the "Eltern" button on the right. The button opens the parents' sheet
 * (support us, shop, settings, legal); every link in it asks the parental gate on its own.
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useAvatar from '@/use/useAvatar'
import useUserName from '@/use/useUserName'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
/** The logo leads back to the main menu from everywhere. */
function goHome() {
  void router.push({ name: 'app-main' })
}
// the picture the child chose in "Ich" is also shown here, and a tap leads to "Ich"
const { avatarSrc } = useAvatar()
// "Hallo, Name!" next to the picture, when the child gave a name (it stays on the device)
const { userName } = useUserName()
</script>

<template lang="pug">
  header(class="app-head")
    button(type="button" class="brand" :aria-label="t('app.nav.home')" @click="goHome")
      img(class="brand-lamb" :src="prependBaseUrl('images/logo/lk-lamm.webp')" alt="" draggable="false" decoding="async")
      img(class="brand-word is-day" :src="prependBaseUrl('images/logo/lk-wort-tag.webp')" alt="" draggable="false" decoding="async")
      img(class="brand-word is-night" :src="prependBaseUrl('images/logo/lk-wort-nacht.webp')" alt="" draggable="false" decoding="async")
    div(class="head-right")
      span(v-if="userName" class="hello") {{ t('app.main.helloName', { name: userName }) }}
      button(type="button" class="me-btn" :aria-label="t('app.nav.profile')" @click="router.push({ name: 'app-profile' })")
        img(:src="avatarSrc" alt="" class="me-img" draggable="false")
</template>

<style scoped lang="sass">
.app-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  min-height: calc(80px + env(safe-area-inset-top, 0px))
  padding: env(safe-area-inset-top, 0px) 16px 0

.brand
  display: flex
  align-items: center
  gap: 10px
  min-width: 0
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.brand-lamb
  height: 48px
  width: auto
  display: block

.brand-word
  height: 34px
  width: auto
  display: block

.head-right
  display: flex
  align-items: center
  gap: 10px

.hello
  min-width: 0
  max-width: 34vw
  overflow: hidden
  white-space: nowrap
  text-overflow: ellipsis
  font-weight: 800
  font-size: 1.05rem
  color: var(--lk-text)

@media (max-width: 340px)
  .hello
    display: none

.me-btn
  flex: 0 0 auto
  width: 48px
  height: 48px
  padding: 0
  border: 2px solid var(--lk-accent)
  border-radius: 50%
  overflow: hidden
  background: var(--lk-surface)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.me-img
  display: block
  width: 100%
  height: 100%
  object-fit: cover

.parent-btn
  display: inline-flex
  align-items: center
  gap: 8px
  min-height: 48px
  padding: 0 18px
  border: 1px solid var(--lk-line)
  border-radius: 28px
  background: var(--lk-surface)
  color: var(--lk-text)
  font-size: 1rem
  font-weight: 600
  cursor: pointer
  -webkit-tap-highlight-color: transparent
</style>

<style lang="sass">
// the cream word mark for the night, the navy one for the day (not scoped: the look is set on <html>)
.app-head .brand-word.is-night
  display: none

:root[data-theme='night'] .app-head .brand-word.is-day
  display: none

:root[data-theme='night'] .app-head .brand-word.is-night
  display: block
</style>
