<script setup lang="ts">
/**
 * "Was kann LambKing?": the whole app on one page, in four areas (reading and listening, adventures, painting, the family). Every area is
 * one card with a big symbol and its functions as small tiles; a tap on a tile opens what it is, where to find it and, when it is not
 * simply free, what comes with Plus and which small part is free (one tile open at a time, so the page stays short). A button leads to
 * it where a child may go there. Meant for parents: it is reached from the parents' window, not from the child's area.
 * Only two labels: free (grey) and Plus (gold). A function that is free only in part counts as Plus: its text names the free part.
 * The allocation is the same as on the Plus page (`app.plus.area*`) and in `utils/adventureAccess.ts`: change them together.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-main' })
}

type Tag = 'free' | 'plus'
interface Feature {
  /** `f1` … `f5`: the texts are `app.features.s<area><key>Title`, `…Text`, `…Where` and, when `plan`, `…Plan`. */
  key: string
  tag: Tag
  /** The route to try it, left out for what sits behind the parental gate or is no page of its own. */
  to?: string
  /** True when there is a line that says what is free and what comes with Plus. */
  plan?: boolean
}
interface Area {
  n: number
  icon: string
  features: Feature[]
}

const AREAS: Area[] = [
  {
    n: 1,
    icon: 'lesen',
    features: [
      { key: 'f1', tag: 'free', to: 'app-read' },
      { key: 'f5', tag: 'free' },
      { key: 'f2', tag: 'plus', plan: true },
      { key: 'f3', tag: 'plus', to: 'app-goodnight', plan: true },
      { key: 'f4', tag: 'free' }
    ]
  },
  {
    n: 2,
    icon: 'abenteuer',
    features: [
      { key: 'f1', tag: 'plus', to: 'app-adventure', plan: true },
      { key: 'f7', tag: 'free' },
      { key: 'f2', tag: 'free', to: 'app-collection' },
      { key: 'f5', tag: 'free', to: 'app-awards' },
      { key: 'f6', tag: 'free' },
      { key: 'f3', tag: 'plus', to: 'app-collection', plan: true },
      { key: 'f4', tag: 'plus', to: 'app-family-quiz', plan: true },
      { key: 'f8', tag: 'plus', to: 'app-family', plan: true }
    ]
  },
  {
    n: 3,
    icon: 'malen',
    features: [
      { key: 'f1', tag: 'free', to: 'app-coloring' },
      { key: 'f8', tag: 'free' },
      { key: 'f6', tag: 'free', to: 'app-coloring' },
      { key: 'f7', tag: 'free' },
      { key: 'f2', tag: 'free' },
      { key: 'f9', tag: 'free' },
      { key: 'f4', tag: 'free' },
      { key: 'f3', tag: 'plus', to: 'app-coloring-books', plan: true },
      { key: 'f5', tag: 'plus', plan: true }
    ]
  },
  {
    n: 4,
    icon: 'ich',
    features: [
      { key: 'f1', tag: 'free' },
      { key: 'f2', tag: 'free', to: 'app-journal' },
      { key: 'f4', tag: 'free' },
      { key: 'f5', tag: 'free' },
      { key: 'f6', tag: 'free' },
      { key: 'f7', tag: 'free' },
      { key: 'f3', tag: 'free' }
    ]
  }
]

const symbol = (name: string) => prependBaseUrl(`images/icons/navi/${name}.webp`)
const tagKey = (tag: Tag) => (tag === 'free' ? 'tagFree' : 'tagPlus')

function jump(n: number) {
  document.getElementById(`feat-area-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** The function that is open (`<area>-<key>`), or '' while all are closed. */
const openKey = ref('')
const idOf = (a: Area, f: Feature) => `${a.n}-${f.key}`
const toggle = (id: string) => (openKey.value = openKey.value === id ? '' : id)
const openOf = (a: Area) => a.features.find((f) => idOf(a, f) === openKey.value)
</script>

<template lang="pug">
  div(class="app-page feat-page min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]")
    LkPageHead(:title="t('app.features.title')" :subtitle="t('app.features.sub')" @back="goBack")

    section(class="feat-wrap")
      div(class="feat-intro")
        h2(class="feat-intro-title") {{ t('app.features.heroTitle') }}
        p {{ t('app.features.tapHint') }}
        ul(class="feat-legend" :aria-label="t('app.features.legend')")
          li
            span(class="feat-tag is-free") {{ t('app.features.tagFree') }}
          li
            span(class="feat-tag is-plus") {{ t('app.features.tagPlus') }}

      nav(class="feat-jump" :aria-label="t('app.features.jump')")
        button(v-for="a in AREAS" :key="a.n" type="button" class="feat-jump-btn" @click="jump(a.n)")
          img(:src="symbol(a.icon)" alt="" class="feat-jump-img" draggable="false")
          span {{ t(`app.features.s${a.n}Title`) }}

      section(v-for="a in AREAS" :id="`feat-area-${a.n}`" :key="a.n" class="feat-area")
        header(class="feat-head")
          img(:src="symbol(a.icon)" alt="" class="feat-head-img" draggable="false")
          span
            h2(class="feat-head-title") {{ t(`app.features.s${a.n}Title`) }}
            span(class="feat-head-sub") {{ t(`app.features.s${a.n}Sub`) }}

        div(class="feat-grid")
          button(
            v-for="f in a.features"
            :key="f.key"
            type="button"
            :class="['feat-chip', `is-${f.tag}`, { 'is-open': openKey === idOf(a, f) }]"
            :aria-expanded="openKey === idOf(a, f)"
            @click="toggle(idOf(a, f))"
          )
            span(class="feat-chip-title") {{ t(`app.features.s${a.n}${f.key}Title`) }}
            span(:class="['feat-tag', `is-${f.tag}`]") {{ t(`app.features.${tagKey(f.tag)}`) }}

        //- what is open: shown under the tiles of its area
        div(v-if="openOf(a)" class="feat-detail" role="region")
          h3(class="feat-item-title") {{ t(`app.features.s${a.n}${openOf(a)!.key}Title`) }}
          p(class="feat-item-text") {{ t(`app.features.s${a.n}${openOf(a)!.key}Text`) }}
          p(class="feat-line")
            span(class="feat-line-label") {{ t('app.features.where') }}
            span {{ t(`app.features.s${a.n}${openOf(a)!.key}Where`) }}
          p(v-if="openOf(a)!.plan" class="feat-line is-plan")
            span(class="feat-line-label") {{ t('app.features.plan') }}
            span {{ t(`app.features.s${a.n}${openOf(a)!.key}Plan`) }}
          router-link(v-if="openOf(a)!.to" :to="{ name: openOf(a)!.to }" class="feat-try") {{ t('app.features.try') }}

      router-link(:to="{ name: 'app-plus' }" class="lk-btn lk-btn--full feat-plus") {{ t('app.features.plusLink') }}
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.feat-wrap
  display: grid
  gap: 18px
  max-width: 40rem
  margin: 14px auto 0
  padding: 0 16px

.feat-intro
  padding: 18px 18px 16px
  border-radius: 28px
  background: linear-gradient(160deg, #fbecc2, #f3d484)
  border: 1px solid #e0bd62
  color: #3a2c10

  p
    margin: 0
    line-height: 1.5

.feat-intro-title
  margin: 0 0 6px
  font-size: 1.4rem
  line-height: 1.2
  font-weight: 800

.feat-legend
  display: flex
  flex-wrap: wrap
  gap: 6px
  margin: 12px 0 0
  padding: 0
  list-style: none

.feat-tag
  display: inline-block
  flex: none
  padding: 2px 10px
  border-radius: 999px
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.04em
  text-transform: uppercase
  white-space: nowrap

  &.is-free
    background: var(--lk-surface-2)
    color: var(--lk-muted)
    box-shadow: inset 0 0 0 1px var(--lk-line)

  &.is-plus
    background: var(--lk-gold)
    color: #3a2c10

// the four areas to jump to
.feat-jump
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.feat-jump-btn
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  min-height: 52px
  padding: 6px 12px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  font-size: 0.95rem
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.feat-jump-img
  flex: none
  width: 32px
  height: 32px
  object-fit: contain

.feat-area
  display: grid
  gap: 10px
  scroll-margin-top: 12px

.feat-head
  display: flex
  align-items: center
  gap: 12px
  padding: 4px 2px

.feat-head-img
  flex: none
  width: 44px
  height: 44px
  object-fit: contain

.feat-head-title
  display: block
  margin: 0
  font-size: 1.3rem
  font-weight: 800
  line-height: 1.15

.feat-head-sub
  display: block
  color: var(--lk-muted)
  font-size: 0.9rem
  line-height: 1.3

.feat-grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px
  margin: 0

.feat-chip
  display: flex
  flex-direction: column
  align-items: flex-start
  justify-content: space-between
  gap: 8px
  min-height: 78px
  padding: 12px 12px 10px
  border: 1px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-plus
    border-color: #e0bd62
    background: linear-gradient(160deg, #fdf5dc, #f8e6ae)
    color: #3a2c10

  &.is-open
    box-shadow: 0 0 0 2px var(--lk-accent)

.feat-chip-title
  font-weight: 800
  font-size: 0.98rem
  line-height: 1.2

.feat-detail
  display: grid
  gap: 8px
  padding: 14px 16px 16px
  border: 1px solid var(--lk-line)
  border-radius: 20px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.feat-item-title
  margin: 0
  font-size: 1.1rem
  font-weight: 800
  line-height: 1.2

.feat-item-text
  margin: 0
  line-height: 1.5

.feat-line
  display: grid
  gap: 2px
  margin: 0
  padding: 8px 12px
  border-radius: 12px
  background: var(--lk-surface-2)
  font-size: 0.92rem
  line-height: 1.4

  &.is-plan
    background: rgba(230, 184, 64, 0.2)

.feat-line-label
  font-size: 0.74rem
  font-weight: 800
  letter-spacing: 0.04em
  text-transform: uppercase
  color: var(--lk-muted)

.feat-try
  justify-self: start
  min-height: 40px
  padding: 0 18px
  display: inline-flex
  align-items: center
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-weight: 800
  font-size: 0.92rem
  text-decoration: none

.feat-plus
  text-align: center
  text-decoration: none
</style>
