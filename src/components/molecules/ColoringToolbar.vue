<script setup lang="ts">
/**
 * The floating tool bar of the coloring screen: a slim glass bar along a screen edge with undo and redo, one picture for
 * every tool (its tip looks out of the bar, the chosen one is pushed further out), the bucket and the pipette as two
 * buttons, and a few buttons for the colour box, the lines and the turning of the sheet (the scene lives in the menu of the picture). A second tap on
 * the chosen tool opens its size, strength and shape. The bar sits flush at the left or the right screen edge (the picture's view moves it
 * by a long press on the grip), folds into a small tab and comes back with a tap. The graphics are pictures made with an
 * image model (`coloringKits.ts`).
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TIP_SHAPES, renderTipShape, tipOf, type TipShape } from '@/utils/coloringBrushes'
import { ICON_COLORS, LINE_ICONS } from '@/data/coloringKits'

export interface ToolbarTool {
  id: string
  label: string
  /** The picture of the tool, its tip up. */
  sprite: string
}

interface Props {
  /** Open (the bar) or folded into its tab. */
  expanded: boolean
  tools: ToolbarTool[]
  tool: string
  color: string
  size: number
  strength: number
  tips: Record<string, TipShape>
  stayInside: boolean
  overlap: boolean
  /** How far the sheet is turned, −90 to 90 degrees. */
  rotation: number
  canUndo: boolean
  canRedo: boolean
  shelfOpen: boolean
  edge: 'left' | 'right'
  carrying?: boolean
  /** The bar was just carried to another place: the click that follows opens nothing. */
  justCarried?: boolean
  /** The picture of the tool that is chosen, for the folded tab. */
  currentSprite: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'select-tool': [id: string]
  undo: []
  redo: []
  'toggle-shelf': []
  'toggle-stay': []
  'toggle-overlap': []
  'set-rotation': [degrees: number]
  collapse: []
  expand: []
  'update:size': [value: number]
  'update:strength': [value: number]
  'set-tip': [shape: TipShape]
  'set-dock': [edge: 'left' | 'right']
  'grip-down': [e: PointerEvent]
  'grip-move': [e: PointerEvent]
  'grip-up': [e: PointerEvent]
}>()

const { t } = useI18n({ useScope: 'global' })

const panel = ref<'options' | 'rotate' | 'dock' | null>(null)

const DOCKS = ['left', 'right'] as const

/** A tap on the grip offers the two sides (dragging it moves the bar at once). */
function onGripClick() {
  if (props.justCarried) return
  panel.value = panel.value === 'dock' ? null : 'dock'
}

watch(
  () => props.expanded,
  (open) => {
    if (!open) panel.value = null
  }
)

/** Bucket and pipette sit next to each other as two buttons; every other tool shows its tip. */
const isHelper = (id: string) => id === 'fill' || id === 'pipette'
const tipTools = computed(() => props.tools.filter((x) => !isHelper(x.id)))
const helpers = computed(() => props.tools.filter((x) => isHelper(x.id)))

/** Size, strength and shape: every tool with a tip has them; fill and pipette have nothing to set. */
const hasOptions = (id: string) => !isHelper(id)
/** Strength and shape belong to the painting tools, not to the eraser. */
const hasShape = (id: string) => hasOptions(id) && id !== 'eraser'

function tapTool(tl: ToolbarTool) {
  if (tl.id === props.tool && hasOptions(tl.id)) {
    panel.value = panel.value === 'options' ? null : 'options'
    return
  }
  panel.value = null
  emit('select-tool', tl.id)
}

function togglePanel(which: 'rotate') {
  panel.value = panel.value === which ? null : which
}

// Plain object on purpose: a function ref runs on every render, so canvases in reactive state would render again and again.
const tipPreviews: Partial<Record<TipShape, HTMLCanvasElement | null>> = {}

function setTipPreview(shape: TipShape, el: unknown) {
  tipPreviews[shape] = el instanceof HTMLCanvasElement ? el : null
}

function drawTipPreviews() {
  for (const shape of TIP_SHAPES) {
    const c = tipPreviews[shape]
    if (c) renderTipShape(c, tipOf(shape), props.color)
  }
}

watch(
  () => [panel.value, props.color, props.tool] as const,
  ([p]) => {
    if (p === 'options') void nextTick(drawTipPreviews)
  }
)

function numberOf(e: Event): number {
  return Number((e.target as HTMLInputElement).value)
}

const degrees = computed(() => `${props.rotation > 0 ? '+' : ''}${props.rotation}°`)
</script>

<template lang="pug">
  div(class="tb" :class="[`edge-${edge}`, { collapsed: !expanded, carrying }]" role="toolbar" :aria-label="t('app.coloring.toolbox')")
    //- folded: a small tab with the chosen tool; a tap brings the bar back, a long press carries it to another edge
    button(
      type="button"
      class="tb-tab"
      :aria-label="t('app.coloring.expandTools')"
      :aria-expanded="expanded"
      :tabindex="expanded && !carrying ? -1 : 0"
      @pointerdown="emit('grip-down', $event)"
      @pointermove="emit('grip-move', $event)"
      @pointerup="emit('grip-up', $event)"
      @pointercancel="emit('grip-up', $event)"
      @contextmenu.prevent
      @click="emit('expand')"
    )
      img(class="tb-tab-ico" :src="currentSprite" alt="" draggable="false")

    div(class="tb-pill" :aria-hidden="!expanded")
      div(class="tb-top")
        div(class="tb-head")
          button(
            type="button"
            class="tb-grip"
            :aria-label="t('app.coloring.dragBar')"
            :title="t('app.coloring.dragBar')"
            @pointerdown="emit('grip-down', $event)"
            @pointermove="emit('grip-move', $event)"
            @pointerup="emit('grip-up', $event)"
            @pointercancel="emit('grip-up', $event)"
            @contextmenu.prevent
            @click="onGripClick"
          )
            img(:src="LINE_ICONS.grip" alt="" draggable="false")
          button(type="button" class="tb-btn tb-collapse" :aria-label="t('app.coloring.collapseTools')" :title="t('app.coloring.collapseTools')" @click="emit('collapse')")
            img(:src="LINE_ICONS.back" alt="" draggable="false")
        div(class="tb-hist")
          button(type="button" class="tb-btn" :disabled="!canUndo" :aria-label="t('app.coloring.undo')" @click="emit('undo')")
            img(:src="LINE_ICONS.undo" alt="" draggable="false")
          button(type="button" class="tb-btn" :disabled="!canRedo" :aria-label="t('app.coloring.redo')" @click="emit('redo')")
            img(:src="LINE_ICONS.redo" alt="" draggable="false")

      div(class="tb-list")
        button(
          v-for="tl in tipTools"
          :key="tl.id"
          type="button"
          class="tb-tool"
          :class="{ on: tool === tl.id }"
          :aria-pressed="tool === tl.id"
          :aria-label="tl.label"
          :title="tl.label"
          @click="tapTool(tl)"
        )
          span(class="tb-spr")
            img(:src="tl.sprite" alt="" draggable="false" decoding="async")

      //- bucket and pipette: two buttons next to each other
      div(class="tb-pair")
        button(
          v-for="tl in helpers"
          :key="tl.id"
          type="button"
          class="tb-helper"
          :class="{ on: tool === tl.id }"
          :aria-pressed="tool === tl.id"
          :aria-label="tl.label"
          :title="tl.label"
          @click="tapTool(tl)"
        )
          img(:src="tl.sprite" alt="" draggable="false" decoding="async")

      div(class="tb-bottom")
        button(
          type="button"
          class="tb-act"
          :class="{ on: shelfOpen }"
          :aria-pressed="shelfOpen"
          :aria-label="shelfOpen ? t('app.coloring.hideBox') : t('app.coloring.showBox')"
          :title="shelfOpen ? t('app.coloring.hideBox') : t('app.coloring.showBox')"
          @click="emit('toggle-shelf')"
        )
          span(class="tb-ico tb-ico-color")
            img(:src="ICON_COLORS" alt="" draggable="false")
          span(class="tb-cap") {{ t('app.coloring.colorsShort') }}
        button(
          type="button"
          class="tb-act"
          :class="{ on: stayInside }"
          :aria-pressed="stayInside"
          :aria-label="t('app.coloring.stayInside')"
          :title="t('app.coloring.stayInside')"
          @click="emit('toggle-stay')"
        )
          span(class="tb-ico")
            img(:src="LINE_ICONS.stay" alt="" draggable="false")
          span(class="tb-cap") {{ t('app.coloring.stayShort') }}
        button(
          type="button"
          class="tb-act"
          :class="{ on: overlap }"
          :aria-pressed="overlap"
          :aria-label="t('app.coloring.overlap')"
          :title="t('app.coloring.overlap')"
          @click="emit('toggle-overlap')"
        )
          span(class="tb-ico")
            img(:src="LINE_ICONS.frames" alt="" draggable="false")
          span(class="tb-cap") {{ t('app.coloring.overlapShort') }}
        button(
          type="button"
          class="tb-act"
          :class="{ on: rotation !== 0 || panel === 'rotate' }"
          :aria-expanded="panel === 'rotate'"
          :aria-label="t('app.coloring.rotate')"
          :title="t('app.coloring.rotate')"
          @click="togglePanel('rotate')"
        )
          span(class="tb-ico")
            img(:src="LINE_ICONS.rotate" alt="" draggable="false")
          span(class="tb-cap") {{ rotation === 0 ? t('app.coloring.rotateShort') : degrees }}

      //- size, strength and shape of the chosen tool
      div(v-if="panel === 'options'" class="tb-pop")
        h3(class="tb-pop-title") {{ tools.find((x) => x.id === tool)?.label }}
        label(class="tb-row")
          span(class="tb-row-name") {{ t('app.coloring.size') }}
          input(type="range" min="2" max="60" step="1" :value="size" :aria-label="t('app.coloring.size')" @input="emit('update:size', numberOf($event))")
          span(class="tb-dot-wrap")
            span(class="tb-dot-prev" :style="{ width: Math.max(4, size * 0.6) + 'px', height: Math.max(4, size * 0.6) + 'px', background: color }")
        label(v-if="hasShape(tool)" class="tb-row")
          span(class="tb-row-name") {{ t('app.coloring.strength') }}
          input(type="range" min="15" max="100" step="1" :value="strength" :aria-label="t('app.coloring.strength')" @input="emit('update:strength', numberOf($event))")
          span(class="tb-val") {{ strength }} %
        div(v-if="hasShape(tool)" class="tb-shapes" role="group" :aria-label="t('app.coloring.tip')")
          button(
            v-for="shape in TIP_SHAPES"
            :key="shape"
            type="button"
            class="tb-shape"
            :class="{ on: (tips[tool] ?? 'round') === shape }"
            :aria-pressed="(tips[tool] ?? 'round') === shape"
            :aria-label="t(`app.coloring.tip_${shape}`)"
            :title="t(`app.coloring.tip_${shape}`)"
            @click="emit('set-tip', shape)"
          )
            canvas(:ref="(el) => setTipPreview(shape, el)" width="96" height="60")

      //- where the bar sits: left or right
      div(v-if="panel === 'dock'" class="tb-pop")
        h3(class="tb-pop-title") {{ t('app.coloring.dockTitle') }}
        p(class="tb-turn-now tb-hint") {{ t('app.coloring.dockHint') }}
        div(class="tb-docks")
          button(
            v-for="d in DOCKS"
            :key="d"
            type="button"
            class="tb-dock"
            :class="{ on: edge === d }"
            :aria-pressed="edge === d"
            @click="emit('set-dock', d)"
          )
            img(:class="`is-${d}`" :src="LINE_ICONS.back" alt="" draggable="false")
            span {{ t(`app.coloring.dock_${d}`) }}

      //- turning the sheet: 0 degrees is the normal position, up to 90 degrees to each side
      div(v-if="panel === 'rotate'" class="tb-pop")
        h3(class="tb-pop-title") {{ t('app.coloring.rotate') }}
        label(class="tb-row")
          span(class="tb-row-name tb-row-left") −90°
          input(type="range" min="-90" max="90" step="1" :value="rotation" :aria-label="t('app.coloring.rotate')" @input="emit('set-rotation', numberOf($event))")
          span(class="tb-row-name tb-row-right") +90°
        div(class="tb-turn")
          button(type="button" class="tb-turn-btn" @click="emit('set-rotation', rotation - 15)") −15°
          button(type="button" class="tb-turn-btn tb-turn-zero" :class="{ on: rotation === 0 }" @click="emit('set-rotation', 0)") 0°
          button(type="button" class="tb-turn-btn" @click="emit('set-rotation', rotation + 15)") +15°
        p(class="tb-turn-now") {{ degrees }}
</template>

<style scoped lang="sass">
$ink: #22262e
$muted: #6c7280
$line: rgba(20, 24, 32, 0.1)
$accent: #1f3a5f
$glass: rgba(252, 251, 248, 0.92)

// The anchor is a strip along the screen edge (without the colour box at the bottom); the bar and the tab slide along it
// by `--pos` (0–1) and never leave it, however tall they are. The bar sits flush at the edge: the tools run right
// through to it.
.tb
  --len: 66px
  --len-on: 88px
  --sw: 28px
  --tile-l: 92px
  --tile-w: 44px
  --tab-gap: 8px
  --pos: 0.5
  --lift: 0px
  --top: 0px
  position: fixed
  z-index: 75
  pointer-events: none

  > *
    pointer-events: auto

.tb-pill,
.tb-tab
  position: absolute
  transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out

.tb-pill
  display: flex
  gap: 6px
  border: 1px solid $line
  background: $glass
  backdrop-filter: blur(18px)
  -webkit-backdrop-filter: blur(18px)
  box-shadow: 0 10px 34px -8px rgba(20, 24, 32, 0.42), 0 1px 3px rgba(20, 24, 32, 0.14)

.tb-tab
  display: grid
  place-items: center
  width: 56px
  height: 56px
  padding: 0
  border: 1px solid $line
  border-radius: 50%
  overflow: hidden
  background: $glass
  backdrop-filter: blur(16px)
  -webkit-backdrop-filter: blur(16px)
  box-shadow: 0 8px 24px -6px rgba(20, 24, 32, 0.42)
  cursor: pointer
  touch-action: none
  user-select: none
  -webkit-tap-highlight-color: transparent
  -webkit-touch-callout: none
  opacity: 0
  pointer-events: none

.tb-tab-ico
  width: 30px
  height: 44px
  object-fit: cover
  object-position: top
  transform: rotate(40deg)
  pointer-events: none

// Folded: the bar slides back into its edge, the tab comes forward.
.tb.collapsed
  .tb-pill
    opacity: 0
    pointer-events: none
  .tb-tab
    opacity: 1
    pointer-events: auto

// Carried by a long press: only the tab, lifted, follows the finger.
.tb.carrying
  .tb-pill
    opacity: 0
    pointer-events: none
  .tb-tab
    opacity: 1
    pointer-events: auto
    left: 0 !important
    top: 0 !important
    right: auto !important
    bottom: auto !important
    transform: translate(-50%, -50%) scale(1.15) !important
    transition: none
    box-shadow: 0 14px 32px rgba(20, 24, 32, 0.4)

// ── Where the bar sits ---------------------------------------------------------------------------
.tb.edge-left,
.tb.edge-right
  top: calc(14px + var(--top) + env(safe-area-inset-top, 0px))
  bottom: calc(14px + env(safe-area-inset-bottom, 0px) + var(--lift))
  width: 0

// left and right: a column; the groups with buttons keep a little room at the edge, the tools do not
.tb.edge-left
  left: 0
  .tb-pill
    left: 0
    top: calc(var(--pos) * 100%)
    transform: translate(0, calc(var(--pos) * -100%))
    flex-direction: column
    align-items: stretch
    max-height: 100%
    padding: 8px 8px 8px 0
    border-left-width: 0
    border-radius: 0 28px 28px 0
  .tb-top,
  .tb-pair,
  .tb-bottom
    margin-left: 8px
  .tb-tab
    left: var(--tab-gap)
    top: calc(var(--pos) * 100%)
    transform: translate(0, calc(var(--pos) * -100%))
  &.collapsed .tb-pill
    transform: translate(calc(-100% - 12px), calc(var(--pos) * -100%))
  &:not(.collapsed):not(.carrying) .tb-tab
    transform: translate(-130%, calc(var(--pos) * -100%))

.tb.edge-right
  right: 0
  .tb-pill
    right: 0
    top: calc(var(--pos) * 100%)
    transform: translate(0, calc(var(--pos) * -100%))
    flex-direction: column
    align-items: stretch
    max-height: 100%
    padding: 8px 0 8px 8px
    border-right-width: 0
    border-radius: 28px 0 0 28px
  .tb-top,
  .tb-pair,
  .tb-bottom
    margin-right: 8px
  .tb-tab
    right: var(--tab-gap)
    top: calc(var(--pos) * 100%)
    transform: translate(0, calc(var(--pos) * -100%))
  &.collapsed .tb-pill
    transform: translate(calc(100% + 12px), calc(var(--pos) * -100%))
  &:not(.collapsed):not(.carrying) .tb-tab
    transform: translate(130%, calc(var(--pos) * -100%))

@media (prefers-reduced-motion: reduce)
  .tb-pill,
  .tb-tab
    transition-duration: 1ms

// ── Top part and buttons --------------------------------------------------------------------------
.tb-top,
.tb-bottom,
.tb-pair,
.tb-head,
.tb-hist
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
  flex: 0 0 auto

.tb.edge-left,
.tb.edge-right
  .tb-top,
  .tb-bottom
    flex-direction: column

  .tb-head
    width: 100%
    gap: 2px

  .tb-grip
    flex: 1 1 auto
    height: 26px

.tb-btn,
.tb-grip
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 40px
  height: 40px
  padding: 0
  border: 0
  border-radius: 14px
  background: transparent
  color: $ink
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: background 120ms ease-out, transform 100ms ease-out

  img
    width: 22px
    height: 22px
    object-fit: contain
    opacity: 0.88
    pointer-events: none

  &:active:not(:disabled)
    background: rgba(20, 24, 32, 0.08)
    transform: scale(0.94)

  &:disabled
    opacity: 0.35
    cursor: default

.tb-grip
  touch-action: none
  user-select: none
  -webkit-touch-callout: none
  height: 36px
  min-width: 36px
  border-radius: 10px

  img
    width: 18px
    height: 18px
    // the dots lie down: the handle shows where the bar can be taken hold of
    transform: rotate(90deg)

.tb.edge-left .tb-collapse img
  transform: none

.tb.edge-right .tb-collapse img
  transform: rotate(180deg)

// ── The tools: the tip looks out of the bar, the body runs through to the edge --------------------------
.tb-list
  flex: 1 1 auto
  min-height: 0
  min-width: 0
  display: flex
  flex-direction: column
  gap: 2px
  overflow: hidden auto
  overscroll-behavior: contain
  scrollbar-width: none
  -webkit-overflow-scrolling: touch
  touch-action: pan-y

  &::-webkit-scrollbar
    display: none

.tb-tool
  position: relative
  flex: 0 0 auto
  padding: 0
  border: 0
  border-radius: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.tb.edge-left .tb-tool,
.tb.edge-right .tb-tool
  width: var(--tile-l)
  height: var(--tile-w)

.tb-spr
  position: absolute
  overflow: hidden
  transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)

  img
    position: absolute
    display: block
    width: var(--sw)
    height: auto
    max-width: none
    pointer-events: none
    filter: drop-shadow(0 0 1.5px rgba(20, 24, 32, 0.35))

.tb-tool.on .tb-spr
  --len: var(--len-on)

.tb.edge-left .tb-spr
  left: 0
  top: 0
  bottom: 0
  width: var(--len)

  img
    left: 100%
    top: calc(50% - var(--sw) / 2)
    transform-origin: 0 0
    transform: rotate(90deg)

.tb.edge-right .tb-spr
  right: 0
  top: 0
  bottom: 0
  width: var(--len)

  img
    left: 0
    top: calc(50% + var(--sw) / 2)
    transform-origin: 0 0
    transform: rotate(-90deg)

// ── Bucket and pipette: two buttons side by side ---------------------------------------------------------
.tb-pair
  gap: 8px
  padding-top: 2px

.tb-helper
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 44px
  height: 44px
  padding: 0
  border: 1px solid $line
  border-radius: 14px
  background: rgba(255, 255, 255, 0.7)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: background 140ms ease-out, transform 100ms ease-out

  img
    height: 32px
    max-width: 30px
    object-fit: contain
    pointer-events: none

  &:active
    transform: scale(0.94)

  &.on
    background: rgba(31, 58, 95, 0.13)
    border-color: rgba(31, 58, 95, 0.45)

.tb-tool:focus-visible,
.tb-btn:focus-visible,
.tb-helper:focus-visible,
.tb-act:focus-visible,
.tb-tab:focus-visible
  outline: 2px solid $accent
  outline-offset: 1px

// ── The buttons at the foot ---------------------------------------------------------------------------
.tb-bottom
  padding-top: 4px

.tb.edge-left .tb-bottom,
.tb.edge-right .tb-bottom
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 2px
  border-top: 1px solid $line
  padding-top: 6px

.tb-act
  flex: 0 0 auto
  display: flex
  flex-direction: column
  align-items: center
  gap: 1px
  min-width: 0
  padding: 4px 2px 2px
  border: 0
  border-radius: 14px
  background: transparent
  color: $ink
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: background 140ms ease-out

  &:active
    background: rgba(20, 24, 32, 0.08)

  &.on
    background: rgba(31, 58, 95, 0.13)

.tb-ico
  display: grid
  place-items: center
  width: 30px
  height: 28px

  img
    width: 26px
    height: 26px
    object-fit: contain
    opacity: 0.9
    pointer-events: none

// the colour box button is in colour, not a line symbol
.tb-ico-color
  width: 36px
  height: 32px

  img
    width: 34px
    height: 32px
    opacity: 1

.tb-cap
  font-size: 0.6rem
  font-weight: 700
  color: $muted
  letter-spacing: 0.01em
  white-space: nowrap

// ── Size, strength, shape, turning and backdrop ------------------------------------------------------------
.tb-pop
  position: absolute
  width: 268px
  padding: 12px 14px 14px
  border: 1px solid $line
  border-radius: 18px
  background: rgba(252, 251, 248, 0.97)
  backdrop-filter: blur(18px)
  -webkit-backdrop-filter: blur(18px)
  box-shadow: 0 14px 40px rgba(20, 24, 32, 0.34)
  animation: tb-pop-in 260ms cubic-bezier(0.22, 1, 0.36, 1)

.tb.edge-left .tb-pop
  left: calc(100% + 10px)
  top: 50%
  transform: translateY(-50%)

.tb.edge-right .tb-pop
  right: calc(100% + 10px)
  top: 50%
  transform: translateY(-50%)

@keyframes tb-pop-in
  from
    opacity: 0
    filter: blur(2px)

@media (prefers-reduced-motion: reduce)
  .tb-pop
    animation: none

.tb-pop-title
  margin: 0 0 8px
  font-size: 0.78rem
  font-weight: 800
  letter-spacing: 0.06em
  text-transform: uppercase
  color: $muted

.tb-row
  display: flex
  align-items: center
  gap: 10px
  min-height: 40px

  input[type="range"]
    flex: 1
    min-width: 0
    accent-color: $accent
    height: 28px

.tb-row-name
  flex: 0 0 56px
  font-size: 0.8rem
  font-weight: 700

.tb-row-left,
.tb-row-right
  flex: 0 0 38px
  font-size: 0.72rem
  color: $muted

.tb-row-right
  text-align: right

.tb-dot-wrap
  flex: 0 0 34px
  height: 34px
  display: grid
  place-items: center

.tb-dot-prev
  display: block
  border-radius: 50%
  box-shadow: 0 0 0 1px rgba(20, 24, 32, 0.2)

.tb-val
  flex: 0 0 40px
  text-align: right
  font-size: 0.78rem
  font-weight: 700
  color: $muted

// the shapes are small and quiet: one row of silhouettes
.tb-shapes
  display: flex
  flex-wrap: wrap
  gap: 5px
  margin-top: 8px
  padding-top: 10px
  border-top: 1px solid $line

.tb-shape
  flex: 0 0 auto
  width: 32px
  height: 24px
  padding: 0
  border: 1px solid transparent
  border-radius: 8px
  background: rgba(20, 24, 32, 0.045)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  canvas
    display: block
    width: 100%
    height: 100%

  &.on
    background: rgba(31, 58, 95, 0.1)
    border-color: rgba(31, 58, 95, 0.45)

.tb-turn
  display: flex
  gap: 8px
  margin-top: 6px

.tb-turn-btn
  flex: 1
  min-height: 44px
  border: 1px solid $line
  border-radius: 12px
  background: rgba(255, 255, 255, 0.75)
  color: $ink
  font-size: 0.9rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    background: rgba(20, 24, 32, 0.08)

  &.on
    background: rgba(31, 58, 95, 0.13)
    border-color: rgba(31, 58, 95, 0.45)

.tb-turn-zero
  flex: 1.3

.tb-turn-now
  margin: 8px 0 0
  text-align: center
  font-size: 0.78rem
  font-weight: 700
  color: $muted

.tb-hint
  margin: 0 0 8px
  text-align: left

.tb-docks
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 8px

.tb-dock
  display: flex
  align-items: center
  gap: 8px
  min-height: 44px
  padding: 0 12px
  border: 1px solid $line
  border-radius: 12px
  background: rgba(255, 255, 255, 0.75)
  color: $ink
  font-size: 0.85rem
  font-weight: 700
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    width: 18px
    height: 18px
    object-fit: contain
    opacity: 0.85

    &.is-right
      transform: rotate(180deg)

  &.on
    background: rgba(31, 58, 95, 0.13)
    border-color: rgba(31, 58, 95, 0.45)

// little height (a tablet held wide with the colour box open): everything gets a little tighter so the tools keep their room
@media (max-height: 760px)
  .tb
    --tile-w: 40px
    --sw: 25px

  .tb-cap
    display: none

  .tb-btn
    width: 36px
    height: 34px

  .tb-helper
    width: 40px
    height: 40px

  .tb-ico-color
    width: 32px
    height: 28px

    img
      width: 30px
      height: 28px
</style>
