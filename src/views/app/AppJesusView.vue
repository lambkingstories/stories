<script setup lang="ts">
/**
 * "Wer ist Jesus?": a short way in five steps (texts in `data/jesusPath.ts`). One step on a screen: a picture, a few sentences, a Bible verse,
 * in the fourth step a prayer the child may use. Meant to be read together with a parent. Nothing is counted, rewarded or locked, and the
 * child can stop at any step and come back (the step is not stored on purpose). The pictures are in `images/jesus/schritt-N.webp`; one that
 * is missing is simply left out.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import { JESUS_PATH } from '@/data/jesusPath'
import { adventureLanguage } from '@/use/adventureLanguage'
import { prependBaseUrl } from '@/utils/function'

const router = useRouter()

const texts = computed(() => JESUS_PATH[adventureLanguage.value])
const at = ref(0)
const total = computed(() => texts.value.steps.length)
const step = computed(() => texts.value.steps[at.value]!)
const isLast = computed(() => at.value === total.value - 1)
const talkOpen = ref(false)
const picture = computed(() => prependBaseUrl(`images/jesus/schritt-${at.value + 1}.webp`))
const pictureOk = ref(true)

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-main' })
}

function go(delta: number) {
  at.value = Math.max(0, Math.min(total.value - 1, at.value + delta))
  pictureOk.value = true
  talkOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toAdventures() {
  void router.push({ name: 'app-adventure-map', params: { journeyId: 'weihnachten' } })
}

</script>

<template lang="pug">
  div(class="app-page jp-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    LkPageHead(:title="texts.title" :subtitle="texts.subtitle" :lamb="false" @back="goBack")

    section(class="section-wrap jp-body")
      p(v-if="at === 0" class="jp-parents") {{ texts.parents }}

      div(class="jp-dots" role="progressbar" :aria-valuenow="at + 1" :aria-valuemin="1" :aria-valuemax="total")
        span(v-for="n in total" :key="n" :class="['jp-dot', { 'is-on': n - 1 <= at }]")
      p(class="jp-count") {{ texts.stepOf.replace('{n}', String(at + 1)).replace('{total}', String(total)) }}

      article(class="jp-card")
        img(v-if="pictureOk" class="jp-pic" :src="picture" alt="" draggable="false" @error="pictureOk = false")
        h2(class="jp-title") {{ step.title }}
        p(class="jp-text") {{ step.text }}
        div(v-if="step.prayer" class="jp-prayer")
          p {{ step.prayer }}
        p(v-if="step.prayerNote" class="jp-note") {{ step.prayerNote }}
        blockquote(class="jp-verse")
          p {{ step.verse.text }}
          cite {{ step.verse.ref }}

      div(v-if="isLast" class="jp-end")
        button(type="button" class="lk-btn lk-btn--full" @click="toAdventures") {{ texts.toAdventures }}
        button(type="button" class="lk-btn lk-btn--outline lk-btn--full" :aria-expanded="talkOpen" @click="talkOpen = !talkOpen") {{ texts.talkParents }}
        p(v-if="talkOpen" class="jp-talk") {{ texts.talkParentsText }}

      div(class="jp-nav")
        button(v-if="at > 0" type="button" class="lk-btn lk-btn--outline" @click="go(-1)") {{ texts.back }}
        button(v-if="!isLast" type="button" class="lk-btn jp-next" @click="go(1)") {{ at === 0 ? texts.start : texts.next }}
</template>

<style scoped lang="sass">
.jp-body
  display: flex
  flex-direction: column
  gap: 12px
  max-width: 640px
  margin: 8px auto 0
  padding: 0 16px

.jp-parents
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  font-size: 0.9rem
  line-height: 1.4

.jp-dots
  display: flex
  gap: 8px
  justify-content: center

.jp-dot
  width: 34px
  height: 8px
  border-radius: 999px
  background: var(--lk-track, var(--lk-line))

  &.is-on
    background: var(--lk-accent)

.jp-count
  margin: 0
  text-align: center
  color: var(--lk-muted)
  font-size: 0.85rem
  font-weight: 700

.jp-card
  display: flex
  flex-direction: column
  gap: 12px
  padding: 16px 18px 20px
  border: 1px solid var(--lk-line)
  border-radius: 26px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.jp-pic
  display: block
  width: 100%
  max-height: 260px
  border-radius: 18px
  object-fit: cover

.jp-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800
  line-height: 1.2

.jp-text
  margin: 0
  font-size: 1.12rem
  line-height: 1.55

.jp-prayer
  padding: 14px 16px
  border-radius: 18px
  background: var(--lk-accent-soft)
  font-size: 1.1rem
  font-style: italic
  line-height: 1.5

  p
    margin: 0

.jp-note
  margin: 0
  color: var(--lk-muted)
  font-size: 0.95rem
  line-height: 1.4

.jp-verse
  margin: 4px 0 0
  padding: 12px 16px
  border-left: 4px solid var(--lk-accent)
  background: var(--lk-surface-2)
  border-radius: 0 14px 14px 0

  p
    margin: 0
    font-weight: 700
    font-size: 1.05rem
    line-height: 1.45

  cite
    display: block
    margin-top: 6px
    font-style: normal
    font-weight: 800
    color: var(--lk-muted)

.jp-end
  display: flex
  flex-direction: column
  gap: 10px

.jp-talk
  margin: 0
  padding: 12px 14px
  border-radius: 14px
  background: var(--lk-surface-2)
  line-height: 1.45

.jp-nav
  display: flex
  gap: 10px

  .lk-btn
    flex: 1

.jp-next
  flex: 2
</style>
