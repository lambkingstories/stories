<script setup lang="ts">
/**
 * The tiles of the start page, arranged by the child or the parents (Anton, 18.11.2026: like the home screen of the iPhone).
 *  - A long press (about half a second) on a tile starts "arranging": the tiles wiggle, a tile can be dragged to another place (the others move
 *    over), a small arrow makes it wide or small again, a minus takes it from the page, and a card "Add a tile" lists everything that is not on the page.
 *  - "Done" (or Escape) ends arranging. The layout is kept on the device (`useHomeLayout`); the rules are in `utils/homeTiles`.
 *  - Outside of arranging a tile is a button that opens its place, and a swipe over a tile still scrolls the page.
 * The tiles themselves are made by the start page (`cards`): it knows where the child stands (adventure, book, picture) and the shortcuts.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useHomeLayout from '@/use/useHomeLayout'
import { missingTiles, type HomeCard, type HomeTileId } from '@/utils/homeTiles'
import { onImgFallback } from '@/utils/placeholder'
import { medalThumb } from '@/utils/medalThumb'

const props = defineProps<{ cards: Partial<Record<HomeTileId, HomeCard>> }>()
const { t } = useI18n({ useScope: 'global' })
const { layout, move, resize, remove, add, reset } = useHomeLayout()

/** The blurred copy behind a round medal needs no sharp picture: the small copy of the medal (every adventure medal has one) is enough. */
function blurSource(src: string): string {
  return /\/abenteuer\/[^/]+\/medaille[^/]*\.webp$/.test(src) && !/-klein\.webp$/.test(src) ? medalThumb(src) : src
}

/** How long a finger rests on a tile before arranging starts. */
const LONG_PRESS_MS = 450
/** A finger that moves farther than this before that is scrolling, not pressing. */
const SCROLL_PX = 10
/** In arranging, a finger has to move this far before a tile follows it (so that a tap on the arrow or the minus is a tap). */
const DRAG_PX = 5

const editing = ref(false)
const adding = ref(false)
const dragId = ref<HomeTileId | null>(null)

const shown = computed(() =>
  layout.value.flatMap((tile) => {
    const card = props.cards[tile.id]
    return card ? [{ id: tile.id, size: tile.size, card }] : []
  })
)
/** The tiles that can be added: not on the page, and known to the start page. */
const addable = computed(() => missingTiles(layout.value).flatMap((id) => (props.cards[id] ? [props.cards[id]!] : [])))

// ── the finger ────────────────────────────────────────────────────────────────
let pressTimer = 0
let pressId: HomeTileId | null = null
let pointerDown = false
let dragReady = false
let startX = 0
let startY = 0
let grabX = 0
let grabY = 0
let ghost: HTMLElement | null = null
let lastTarget: HomeTileId | null = null
let swallowClick = false

function down(e: PointerEvent, id: HomeTileId) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  // the little buttons of a tile (minus, arrow) are taps, not the start of a drag
  if ((e.target as HTMLElement).closest('[data-tile-action]')) return
  pressId = id
  pointerDown = true
  startX = e.clientX
  startY = e.clientY
  dragReady = editing.value
  window.clearTimeout(pressTimer)
  if (!editing.value) {
    pressTimer = window.setTimeout(() => {
      editing.value = true
      dragReady = true
      swallowClick = true
      try {
        navigator.vibrate?.(15)
      } catch {
        // no vibration on this device
      }
    }, LONG_PRESS_MS)
  }
}

function startDrag(e: PointerEvent) {
  const el = document.querySelector<HTMLElement>(`[data-tile-id="${pressId}"]`)
  if (!el || !pressId) return
  const r = el.getBoundingClientRect()
  grabX = startX - r.left
  grabY = startY - r.top
  const g = el.cloneNode(true) as HTMLElement
  g.removeAttribute('data-tile-id')
  g.classList.add('hg-ghost')
  g.setAttribute('aria-hidden', 'true')
  g.style.width = r.width + 'px'
  g.style.height = r.height + 'px'
  document.body.appendChild(g)
  ghost = g
  dragId.value = pressId
  lastTarget = null
  placeGhost(e)
}

function placeGhost(e: PointerEvent) {
  if (!ghost) return
  ghost.style.left = e.clientX - grabX + 'px'
  ghost.style.top = e.clientY - grabY + 'px'
}

function onMove(e: PointerEvent) {
  if (!pointerDown) return
  const dist = Math.hypot(e.clientX - startX, e.clientY - startY)
  if (!dragId.value) {
    if (!editing.value) {
      // the finger moved before the press was long enough: the child scrolls
      if (dist > SCROLL_PX) {
        window.clearTimeout(pressTimer)
        pointerDown = false
      }
      return
    }
    if (dragReady && dist > DRAG_PX) startDrag(e)
    if (!dragId.value) return
  }
  placeGhost(e)
  // the tile under the finger (not the dragged one): the dragged tile takes its place
  const under = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n instanceof HTMLElement && n.dataset.tileId && n.dataset.tileId !== dragId.value) as HTMLElement | undefined
  const target = (under?.dataset.tileId as HomeTileId | undefined) ?? null
  if (!target) lastTarget = null
  else if (target !== lastTarget) {
    lastTarget = target
    move(dragId.value!, target)
  }
  // near the top or the bottom of the screen the page scrolls on
  if (e.clientY < 90) window.scrollBy(0, -14)
  else if (e.clientY > window.innerHeight - 130) window.scrollBy(0, 14)
}

function onUp() {
  window.clearTimeout(pressTimer)
  if (dragId.value) {
    ghost?.remove()
    ghost = null
    dragId.value = null
    swallowClick = true
  }
  pointerDown = false
  dragReady = false
  pressId = null
  if (swallowClick) window.setTimeout(() => (swallowClick = false), 120)
}

/** While a tile is dragged (or a press is about to drag) the page must not scroll under the finger. */
function onTouchMove(e: TouchEvent) {
  if (dragId.value || (editing.value && pointerDown && dragReady)) e.preventDefault()
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (adding.value) adding.value = false
  else if (editing.value) finish()
}

onMounted(() => {
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onUp)
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.clearTimeout(pressTimer)
  ghost?.remove()
  document.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerup', onUp)
  document.removeEventListener('pointercancel', onUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('keydown', onKey)
})

function open(card: HomeCard) {
  // while arranging, and right after the long press, a tap does not open the tile
  if (editing.value || swallowClick) return
  card.go()
}
function finish() {
  editing.value = false
  adding.value = false
}
function addTileAndClose(id: HomeTileId) {
  add(id)
  adding.value = false
}
function resetAll() {
  reset()
  adding.value = false
}
</script>

<template lang="pug">
  section(:class="['hg', { 'is-editing': editing }]")
    div(class="hg-head")
      slot(name="title")
      button(v-if="editing" type="button" class="hg-done" data-test="tiles-done" @click="finish") {{ t('app.bigGames.home.editDone') }}
    p(v-if="editing" class="hg-hint" role="status") {{ t('app.bigGames.home.editHint') }}
    TransitionGroup(tag="div" name="hg" class="hg-grid")
      div(
        v-for="tile in shown"
        :key="tile.id"
        :class="['hg-tile', 'hg-tile--' + tile.size, { 'is-dragging': dragId === tile.id }]"
        :data-tile-id="tile.id"
        :data-size="tile.size"
        @pointerdown="down($event, tile.id)"
        @contextmenu.prevent
      )
        button(
          type="button"
          :class="['resume-card', 'resume-card--' + tile.id, { 'is-empty': tile.card.empty }]"
          :aria-label="tile.card.kind + ': ' + tile.card.title"
          @click="open(tile.card)"
        )
          span(:class="['resume-thumb', { 'is-medal': tile.card.medal }]")
            img(v-if="tile.card.medal && tile.card.image" class="resume-blur" :src="blurSource(tile.card.image)" alt="" draggable="false" aria-hidden="true")
            img(v-if="tile.card.image" class="resume-pic" :src="tile.card.image" alt="" draggable="false" @error="onImgFallback")
            ZIconography(v-else :name="tile.card.icon" :size="40")
            span(class="resume-kind")
              ZIconography(:name="tile.card.icon" :size="16")
              span {{ tile.card.kind }}
          span(class="resume-body")
            span(class="resume-title") {{ tile.card.title }}
            span(v-if="tile.card.progress >= 0" class="resume-bar")
              span(class="resume-bar-fill" :style="{ width: Math.round(tile.card.progress * 100) + '%' }")
            span(v-else-if="tile.card.empty" class="resume-start") {{ t('app.home.startHere') }}
            span(v-else class="resume-meta") {{ tile.card.meta }}
        template(v-if="editing")
          button(
            type="button"
            class="hg-btn hg-remove"
            data-tile-action
            data-test="tile-remove"
            :aria-label="t('app.bigGames.home.remove') + ': ' + tile.card.title"
            @click.stop="remove(tile.id)"
          )
            svg(viewBox="0 0 24 24" width="18" height="18" aria-hidden="true")
              path(d="M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round")
          button(
            type="button"
            class="hg-btn hg-size"
            data-tile-action
            data-test="tile-size"
            :aria-label="(tile.size === 'small' ? t('app.bigGames.home.bigger') : t('app.bigGames.home.smaller')) + ': ' + tile.card.title"
            @click.stop="resize(tile.id)"
          )
            svg(v-if="tile.size === 'small'" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true")
              path(d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round")
            svg(v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true")
              path(d="M20 10h-6V4M14 10l7-7M4 14h6v6M10 14l-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round")
      button(v-if="editing" key="add" type="button" class="hg-add" data-test="tile-add" @click="adding = true")
        span(class="hg-add-plus" aria-hidden="true") +
        span {{ t('app.bigGames.home.addTile') }}
    //- the list of tiles that can be added
    div(v-if="adding" class="hg-sheet" role="dialog" aria-modal="true" :aria-label="t('app.bigGames.home.addTile')" data-test="tile-sheet")
      div(class="hg-backdrop" @click="adding = false")
      div(class="hg-panel")
        h3(class="hg-panel-title") {{ t('app.bigGames.home.addTile') }}
        p(v-if="!addable.length" class="hg-none") {{ t('app.bigGames.home.addNone') }}
        ul(class="hg-list")
          li(v-for="c in addable" :key="c.id")
            button(type="button" class="hg-item" :data-test="'add-' + c.id" @click="addTileAndClose(c.id)")
              img(:src="c.image" alt="" class="hg-item-img" draggable="false")
              span(class="hg-item-text")
                span(class="hg-item-title") {{ c.title }}
                span(class="hg-item-kind") {{ c.kind }}
              span(class="hg-item-plus" aria-hidden="true") +
        div(class="hg-panel-actions")
          button(type="button" class="hg-link" data-test="tiles-reset" @click="resetAll") {{ t('app.bigGames.home.reset') }}
          button(type="button" class="hg-link hg-link--strong" @click="adding = false") {{ t('app.bigGames.home.close') }}
</template>

<style scoped lang="sass">
// a white card: the picture fills the top edge to edge, the title and the bar sit below it
.resume-card
  display: flex
  flex-direction: column
  min-width: 0
  padding: 0
  overflow: hidden
  text-align: left
  border: 1px solid var(--lk-line)
  border-radius: var(--lk-r-card)
  background: var(--lk-surface)
  color: var(--lk-text)
  box-shadow: var(--lk-shadow)
  cursor: pointer
  touch-action: manipulation

  &:active
    transform: translateY(1px)

.resume-thumb
  position: relative
  aspect-ratio: 16 / 10
  overflow: hidden
  background: var(--lk-surface-2)
  color: var(--lk-muted)
  display: flex
  align-items: center
  justify-content: center

  // the picture fills the box without ever making it taller (a tall book cover would otherwise stretch the card)
  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover
    display: block

  // an adventure without a wide picture shows its round medal whole, on a soft blur of itself
  &.is-medal > .resume-blur
    transform: scale(1.5)
    filter: blur(20px) saturate(1.1)
    opacity: 0.55

  &.is-medal > .resume-pic
    object-fit: contain
    padding: 6px 0
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))

  :deep(.z-icon-outline)
    color: currentColor

.resume-kind
  position: absolute
  left: 8px
  top: 8px
  display: inline-flex
  align-items: center
  gap: 5px
  padding: 3px 10px 3px 7px
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font-size: 0.78rem
  font-weight: 800
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25)

  :deep(.z-icon-outline)
    color: currentColor

.resume-body
  display: flex
  flex-direction: column
  gap: 6px
  flex: 1
  padding: 8px 12px 10px

// every card has the same body: one line for the title, one fixed line below it (the bar, the start chip or the place)
.resume-title
  font-weight: 800
  font-size: 1rem
  line-height: 1.25
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.resume-bar
  display: block
  height: 7px
  margin: 8px 0 7px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.resume-bar-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-fill)

.resume-meta
  min-height: 22px
  line-height: 22px
  font-size: 0.88rem
  color: var(--lk-muted)

.resume-start
  align-self: flex-start
  min-height: 22px
  line-height: 14px
  padding: 4px 12px
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-size: 0.82rem
  font-weight: 700

.resume-card.is-empty .resume-thumb
  background: var(--lk-surface-2)

// ── the grid: small = one column, wide = two ──
.hg
  display: flex
  flex-direction: column
  gap: 10px

.hg-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

.hg-done
  flex: none
  min-height: 44px
  padding: 0 20px
  border: 0
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font: inherit
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.hg-hint
  margin: 0
  color: var(--lk-muted)
  font-size: 0.9rem

.hg-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  grid-auto-flow: dense
  gap: 12px

.hg-tile
  position: relative
  min-width: 0
  // a swipe up or down over a tile scrolls the page; a long press arranges
  touch-action: pan-y
  -webkit-touch-callout: none
  user-select: none
  -webkit-user-select: none

  .resume-card
    width: 100%
    height: 100%

.hg-tile--wide
  grid-column: span 2

  .resume-thumb
    aspect-ratio: 16 / 6

.hg-tile.is-dragging
  opacity: 0.25

// the tiles move over when another one is dragged or added or taken away
.hg-move
  transition: transform 0.25s ease

.hg-enter-active
  transition: opacity 0.2s, transform 0.2s

.hg-enter-from
  opacity: 0
  transform: scale(0.9)

// ── arranging: the tiles wiggle a little ──
.is-editing .hg-tile
  touch-action: none

  &:not(.is-dragging)
    animation: hg-wiggle 0.26s ease-in-out infinite alternate

  &:nth-child(2n):not(.is-dragging)
    animation-direction: alternate-reverse
    animation-duration: 0.3s

@keyframes hg-wiggle
  from
    transform: rotate(-0.9deg)

  to
    transform: rotate(0.9deg)

@media (prefers-reduced-motion: reduce)
  .is-editing .hg-tile:not(.is-dragging)
    animation: none

// the label on the picture gives way to the buttons while arranging
.is-editing .resume-kind
  opacity: 0

.hg-btn
  position: absolute
  z-index: 3
  display: grid
  place-items: center
  width: 38px
  height: 38px
  padding: 0
  border: 2px solid #fff
  border-radius: 50%
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.hg-remove
  top: -10px
  left: -8px
  background: #d9473a
  color: #fff

.hg-size
  top: -10px
  right: -8px
  background: var(--lk-surface)
  color: var(--lk-text)

.hg-add
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 6px
  min-height: 120px
  border: 2px dashed var(--lk-line)
  border-radius: var(--lk-r-card)
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.hg-add-plus
  font-size: 2rem
  line-height: 1

// ── the list of tiles to add ──
.hg-sheet
  position: fixed
  inset: 0
  z-index: 70
  display: flex
  align-items: flex-end
  justify-content: center

.hg-backdrop
  position: absolute
  inset: 0
  background: rgba(10, 20, 30, 0.5)

.hg-panel
  position: relative
  width: min(100%, 560px)
  max-height: 82vh
  overflow-y: auto
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px))
  border-radius: 26px 26px 0 0
  background: var(--lk-surface)
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.25)

.hg-panel-title
  margin: 0 0 10px
  font-size: 1.2rem
  font-weight: 800
  color: var(--lk-text)

.hg-none
  margin: 0 0 8px
  color: var(--lk-muted)

.hg-list
  display: flex
  flex-direction: column
  gap: 8px
  margin: 0
  padding: 0
  list-style: none

.hg-item
  display: flex
  align-items: center
  gap: 12px
  width: 100%
  min-height: 64px
  padding: 8px 12px
  border: 1px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface-2, #f1f6f4)
  color: var(--lk-text)
  font: inherit
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.hg-item-img
  flex: none
  width: 48px
  height: 48px
  object-fit: contain

.hg-item-text
  flex: 1 1 auto
  min-width: 0
  display: flex
  flex-direction: column

.hg-item-title
  font-weight: 800

.hg-item-kind
  font-size: 0.82rem
  color: var(--lk-muted)

.hg-item-plus
  flex: none
  font-size: 1.8rem
  line-height: 1
  color: var(--lk-accent)

.hg-panel-actions
  display: flex
  align-items: center
  justify-content: space-between
  margin-top: 12px

.hg-link
  min-height: 44px
  padding: 0 8px
  border: 0
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 700
  text-decoration: underline
  cursor: pointer

.hg-link--strong
  color: var(--lk-accent)
  text-decoration: none

@media (min-width: 720px)
  .hg-grid
    grid-template-columns: repeat(4, minmax(0, 1fr))

  .hg-tile--wide .resume-thumb
    aspect-ratio: 16 / 7
</style>

<style lang="sass">
// the tile that follows the finger (it lives in the body, outside of the component)
.hg-ghost
  position: fixed
  z-index: 90
  margin: 0
  pointer-events: none
  transform: scale(1.05) rotate(-1.5deg)
  opacity: 0.96
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35)
  border-radius: var(--lk-r-card)
</style>
