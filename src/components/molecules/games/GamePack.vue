<script setup lang="ts">
/**
 * Pack the supplies: in front of the camp at Shittim stands a big basket whose inside is a grid of cells. The things for the journey (a sack of grain, jugs, loaves, dates, figs, a water skin)
 * have different shapes: the child drags them into the basket (or taps a thing and then a cell). A tap on a packed thing turns it a quarter; a packed thing can be dragged to another cell or
 * back to the tray. A thing that does not fit where it was put sinks back (a cross, a dull sound, a mistake). The "Tip" button shows a place from which the rest can still be packed (it
 * counts as a tip). When everything is in, the basket shines. Round 1: five things in a basket of 4 x 3; round 2: seven things in 5 x 3, almost no room to spare. No clock. The fitting is
 * `gridOf`, `fits` and `tipSpot` in `utils/josuaGames.ts`; every round can be packed (checked by the tests).
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { fits, gridOf, packSize, tipSpot, type PackPlace } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PackGame, PackItem } from '@/types/adventure'

const props = defineProps<{ game: PackGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every thing of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.items.length, 0))

/** The size of a cell in the tray (pixels), and stand-in colours of the things until their pictures are there. */
const CELL_PX = 46
const COLOURS = ['#d9b36a', '#c47a4f', '#e4c98f', '#a8794a', '#9aa86a', '#7fa0b8', '#b88aa0']

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const cols = computed(() => current.value.cols)
const rows = computed(() => current.value.rows)
const things = computed<PackItem[]>(() => current.value.items.map((id) => props.game.items.find((i) => i.id === id)).filter((i): i is PackItem => !!i))
const placed = ref<PackPlace[]>([])
const grid = computed(() => gridOf(cols.value, rows.value, placed.value, things.value))
const inTray = computed(() => things.value.filter((i) => !placed.value.some((p) => p.id === i.id)))
const best = ref(0)
const mistakes = ref(0)
const tips = ref(0)
const hinted = ref<PackPlace | null>(null)
const between = ref(false)
const finished = ref(false)
const full = ref(false)
const message = ref('')
const flash = ref<{ col: number; row: number; kind: 'good' | 'bad' } | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value + tips.value, 3, 8))

const itemOf = (id: string): PackItem | undefined => props.game.items.find((i) => i.id === id)
const colourOf = (id: string) => COLOURS[Math.max(0, props.game.items.findIndex((i) => i.id === id)) % COLOURS.length]
const baseOf = (id: string) => id.replace(/-\d+$/, '')
/** What the thing is called: the `label` of the thing when it has one, else the name of the basket (the ids `krug-1` and `krug-2` are two jugs). */
const nameOf = (id: string) => itemOf(id)?.label ?? t(`app.adventure.packName${baseOf(id).charAt(0).toUpperCase()}${baseOf(id).slice(1)}`)

/** The place for a thing with its top left cell near (col, row): as it is, else turned; the corner is moved in when the thing would stick out. */
function find(id: string, col: number, row: number, prefer: boolean): PackPlace | null {
  const item = itemOf(id)
  if (!item) return null
  const others = gridOf(cols.value, rows.value, placed.value.filter((p) => p.id !== id), things.value)
  for (const rot of item.w === item.h ? [prefer] : [prefer, !prefer]) {
    const s = packSize(item, rot)
    const c = Math.max(0, Math.min(col, cols.value - s.w))
    const r = Math.max(0, Math.min(row, rows.value - s.h))
    if (fits(others, cols.value, rows.value, item, c, r, rot)) return { id, col: c, row: r, rot }
  }
  return null
}

function flashOn(col: number, row: number, kind: 'good' | 'bad') {
  flash.value = { col, row, kind }
  later(() => {
    if (flash.value?.col === col && flash.value.row === row) flash.value = null
  }, 800)
}

function put(id: string, col: number, row: number) {
  if (between.value || finished.value) return
  const old = placed.value.find((p) => p.id === id)
  const spot = find(id, col, row, old?.rot ?? false)
  if (!spot) {
    mistakes.value++
    play('wrong')
    flashOn(col, row, 'bad')
    message.value = t('app.adventure.packNoFit')
    return
  }
  placed.value = [...placed.value.filter((p) => p.id !== id), spot]
  hinted.value = null
  message.value = ''
  play('tap')
  flashOn(spot.col, spot.row, 'good')
  check()
}

function check() {
  const count = placed.value.length
  for (let i = best.value; i < count; i++) progress.mark()
  best.value = Math.max(best.value, count)
  if (count >= things.value.length) {
    full.value = true
    play('star')
    message.value = t('app.adventure.packRight')
    roundOver()
  }
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    placed.value = []
    best.value = 0
    hinted.value = null
    full.value = false
    between.value = false
    message.value = ''
  }, 2000)
}

/** A tap on a thing in the basket turns it (when it still fits). */
function turn(id: string) {
  if (between.value || finished.value) return
  const p = placed.value.find((x) => x.id === id)
  if (!p) return
  const item = itemOf(id)!
  const others = gridOf(cols.value, rows.value, placed.value.filter((x) => x.id !== id), things.value)
  const s = packSize(item, !p.rot)
  const c = Math.min(p.col, cols.value - s.w)
  const r = Math.min(p.row, rows.value - s.h)
  if (c >= 0 && r >= 0 && fits(others, cols.value, rows.value, item, c, r, !p.rot)) {
    placed.value = placed.value.map((x) => (x.id === id ? { id, col: c, row: r, rot: !p.rot } : x))
    play('tap')
    message.value = ''
  } else {
    message.value = t('app.adventure.packNoTurn')
  }
}

function showTip() {
  if (between.value || finished.value || hinted.value) return
  const spot = tipSpot(grid.value, cols.value, rows.value, inTray.value)
  if (!spot) {
    message.value = t('app.adventure.packStuck')
    return
  }
  tips.value++
  hinted.value = spot
  message.value = t('app.adventure.packTip', { name: nameOf(spot.id) })
  later(() => {
    hinted.value = null
  }, 3500)
}

function clearAll() {
  if (between.value || finished.value) return
  placed.value = []
  hinted.value = null
  message.value = ''
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => {
  const taken = id.startsWith('in:') ? id.slice(3) : id
  if (target === 'tray') {
    if (id.startsWith('in:')) placed.value = placed.value.filter((p) => p.id !== taken)
    return
  }
  const m = /^cell-(\d+)-(\d+)$/.exec(target)
  if (m) put(taken, Number(m[1]), Number(m[2]))
})
// a tap (a press without moving) on a packed thing turns it instead of choosing it
watch(selected, (v) => {
  if (typeof v === 'string' && v.startsWith('in:')) {
    selected.value = null
    turn(v.slice(3))
  }
})

const areaStyle = computed(() => ({ left: `${props.game.area.x}%`, top: `${props.game.area.y}%`, width: `${props.game.area.w}%`, height: `${props.game.area.h}%` }))
const rect = (p: { col: number; row: number }, item: { w: number; h: number }, rot: boolean) => {
  const s = packSize(item, rot)
  return { left: `${(p.col / cols.value) * 100}%`, top: `${(p.row / rows.value) * 100}%`, width: `${(s.w / cols.value) * 100}%`, height: `${(s.h / rows.value) * 100}%` }
}
const placedList = computed(() =>
  placed.value.map((p) => {
    const item = itemOf(p.id)!
    return { p, item, style: rect(p, item, p.rot), ratio: p.rot ? item.h / item.w : item.w / item.h }
  })
)
const hintStyle = computed(() => {
  const h = hinted.value
  const item = h ? itemOf(h.id) : undefined
  return h && item ? rect(h, item, h.rot) : null
})
const cells = computed(() => Array.from({ length: rows.value * cols.value }, (_, i) => ({ col: i % cols.value, row: Math.floor(i / cols.value) })))
const cellLabel = (c: { col: number; row: number }) => (grid.value[c.row * cols.value + c.col] ? t('app.adventure.packCellFull', { col: c.col + 1, row: c.row + 1 }) : t('app.adventure.packCell', { col: c.col + 1, row: c.row + 1 }))
</script>

<template lang="pug">
  div(class="pk")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="pk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="pk-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="pk-field game-soft" role="group" :aria-label="t('app.adventure.packField', { n: placed.length, total: things.length })" :style="{ '--bg': `url(${src(game.background)})` }")
        div(class="pk-basket" :class="{ full }" :style="areaStyle")
          GameImage(:src="game.basket" :ratio="2" colour="#b8935a" class="pk-basket-img")
          div(class="pk-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }")
            div(
              v-for="c in cells"
              :key="`${round}-${c.col}-${c.row}`"
              class="pk-cell"
              :class="{ ready: selected !== null, 'flash-good': flash && flash.col === c.col && flash.row === c.row && flash.kind === 'good', 'flash-bad': flash && flash.col === c.col && flash.row === c.row && flash.kind === 'bad' }"
              :data-drop="`cell-${c.col}-${c.row}`"
              role="button"
              tabindex="0"
              :aria-label="cellLabel(c)"
              @click="tapPlace(`cell-${c.col}-${c.row}`)"
              @keydown.enter.space.prevent="tapPlace(`cell-${c.col}-${c.row}`)"
            )
          div(v-if="hintStyle" class="pk-hintbox" :style="hintStyle" aria-hidden="true")
          div(
            v-for="e in placedList"
            :key="`${round}-${e.p.id}`"
            class="pk-thing"
            :class="{ lifted: dragging === `in:${e.p.id}` }"
            :style="{ ...e.style, ...dragStyle(`in:${e.p.id}`) }"
            role="button"
            tabindex="0"
            :aria-label="t('app.adventure.packPacked', { name: nameOf(e.p.id) })"
            @pointerdown="down($event, `in:${e.p.id}`)"
            @keydown.enter.space.prevent="turn(e.p.id)"
          )
            GameImage(:src="e.item.image" :ratio="e.ratio" :colour="colourOf(e.p.id)" :label="nameOf(e.p.id)")
          GameMark(v-if="flash" :kind="flash.kind" class="pk-mark" :style="{ left: `${(flash.col / cols) * 100}%`, top: `${(flash.row / rows) * 100}%` }")
      p(class="pk-fb" role="status") {{ message }}
      div(class="pk-tray" data-drop="tray" role="group" :aria-label="t('app.adventure.packTray')")
        div(
          v-for="i in inTray"
          :key="`${round}-${i.id}`"
          class="pk-item"
          :class="{ chosen: selected === i.id, lifted: dragging === i.id, hinted: hinted && hinted.id === i.id }"
          :style="{ width: `${i.w * CELL_PX}px`, ...dragStyle(i.id) }"
          role="button"
          tabindex="0"
          :aria-label="nameOf(i.id)"
          @pointerdown="down($event, i.id)"
          @keydown.enter.space.prevent="toggleSelect(i.id)"
        )
          GameImage(:src="i.image" :ratio="i.w / i.h" :colour="colourOf(i.id)" :label="nameOf(i.id)")
      div(class="pk-actions")
        AdvButton(tone="blau" :disabled="between || !!hinted" @click="showTip") {{ t('app.adventure.packTipButton') }}
        AdvButton(tone="blau" :disabled="between" @click="clearAll") {{ t('app.adventure.packClear') }}
      p(class="pk-count") {{ t('app.adventure.packCount', { n: placed.length, total: things.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.packDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.pk
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.pk-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.pk-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.pk-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdbf95
  background-size: cover
  background-position: center

// the basket: its picture behind, the grid of cells on top
.pk-basket
  position: absolute
  border-radius: 10px

  &.full
    filter: drop-shadow(0 0 10px rgba(255, 224, 120, 1))

.pk-basket-img
  position: absolute
  inset: 0

.pk-grid
  position: absolute
  inset: 0
  display: grid

.pk-cell
  border: 1px dashed rgba(95, 65, 25, 0.5)
  cursor: pointer

  &.ready
    background: rgba(255, 246, 200, 0.35)

  &.flash-good
    box-shadow: inset 0 0 0 3px rgba(60, 160, 70, 0.9)

  &.flash-bad
    box-shadow: inset 0 0 0 3px rgba(200, 50, 50, 0.9)

.pk-thing
  position: absolute
  padding: 1px
  cursor: pointer
  touch-action: none
  user-select: none
  -webkit-user-select: none
  z-index: 2

.pk-hintbox
  position: absolute
  border: 3px dashed rgba(255, 214, 90, 0.95)
  background: rgba(255, 246, 200, 0.4)
  border-radius: 8px
  z-index: 1
  pointer-events: none

.pk-mark
  position: absolute
  z-index: 5

.pk-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.pk-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-end
  gap: 10px
  min-height: 70px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.pk-item
  padding: 3px
  box-sizing: content-box
  border-radius: 10px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

  &.hinted
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

.pk-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.pk-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
