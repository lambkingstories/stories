<script setup lang="ts">
/**
 * The workshop (Acts 18,3: "because he was of the same craft, he abode with them, and wrought: for by their occupation they were tentmakers").
 * The workshop in Corinth: three work tables side by side, each with a painted sign of its step (knife and cloth, needle and thread, rope and loop; no text in the picture),
 * at each table one of the three works (Aquila, Priscilla, Paul; two pictures each while working). On the left the bale of cloth, on the right the place for finished tents.
 * Every piece goes through three steps: rolled cloth -> cut into two lengths -> sewn into one -> a tent roof with loops and ropes (a picture for every state).
 * The child taps a piece and then the table that is next for it (every piece and every table is a button: Tab and Enter work). Right: the table works for two seconds
 * (a thin bar under it), then the piece lies there in its new state, a quiet tick. Wrong (rolled cloth to the sewing table, or a table that is still working): a cross,
 * "First …!" with the step that is missing, the piece stays where it was, a mistake. A table that still holds a finished piece only asks for it to be taken first (no mistake).
 * A finished tent goes to the place on the right; when all are there, all three laugh.
 * Round 1: two pieces, one after the other; round 2: four, a new one comes as soon as the cutting table is free, so up to three are on their way at once.
 * At the end the sabbath picture: the workshop is quiet, the three go to the synagogue. "Help me" after fifteen seconds lights the table that is next.
 * Less motion: no wobbling, the workers keep one picture. Nothing is drawn. Stars: `osterStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { tentAfter, tentMove, tentMoves, tentTarget } from '@/utils/paulusNeuB'
import type { TentShopGame, TentStage, TentTarget } from '@/utils/paulusNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TentShopGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + tentMoves(r), 0))

const TICK_MS = 100
const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const NEED_KEY: Record<string, string> = { '0': 'tentShopNeedCut', '1': 'tentShopNeedSew', '2': 'tentShopNeedRope', shelf: 'tentShopNeedShelf' }

interface Piece {
  id: number
  stage: TentStage
  at: 'pile' | 0 | 1 | 2 | 'shelf'
}
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const pieces = ref<Piece[]>([])
const work = ref<number[]>([0, 0, 0])
const selected = ref<number | null>(null)
const helping = ref(false)
const happy = ref(false)
const frame = ref(0)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const ending = ref(false)
const finished = ref(false)
const mark = ref<{ kind: 'good' | 'bad'; at: string } | null>(null)
const message = ref('')
let messageSeq = 0
let spawned = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const doneCount = computed(() => pieces.value.filter((p) => p.at === 'shelf').length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: string) {
  const m = { kind, at }
  mark.value = m
  later(() => {
    if (mark.value === m) mark.value = null
  }, 900)
}

const onTable = (k: number) => pieces.value.find((p) => p.at === k)
/** A new rolled cloth comes when there is none waiting and (round 2) the cutting table is free, or (round 1) nothing is on its way. */
function spawn() {
  if (spawned >= current.value.pieces) return
  if (pieces.value.some((p) => p.at === 'pile')) return
  const busy = pieces.value.some((p) => p.at !== 'shelf')
  if (current.value.overlap ? !!onTable(0) : busy) return
  pieces.value.push({ id: spawned++, stage: 0, at: 'pile' })
  if (spawned > 1) say(t('app.adventure.tentShopNew'), 1800)
}

function startRound() {
  pieces.value = []
  work.value = [0, 0, 0]
  selected.value = null
  spawned = 0
  happy.value = false
  spawn()
}
startRound()

function loop() {
  if (finished.value) return
  later(loop, TICK_MS)
  if (between.value) return
  idle.value += TICK_MS / 1000
  if (!still && Math.floor((idle.value * 1000) / 300) % 2 !== frame.value) frame.value = 1 - frame.value
  work.value = work.value.map((w, k) => {
    if (w <= 0) return 0
    const left = w - TICK_MS
    if (left <= 0) {
      const p = onTable(k)
      if (p) p.stage = tentAfter(k as 0 | 1 | 2)
      play('snap')
      return 0
    }
    return left
  })
}
later(loop, TICK_MS)

function pick(p: Piece) {
  if (between.value || finished.value) return
  idle.value = 0
  if (typeof p.at === 'number' && work.value[p.at]! > 0) {
    say(t('app.adventure.tentShopWorking', { name: props.game.tables[p.at]!.name }), 2000)
    return
  }
  selected.value = selected.value === p.id ? null : p.id
  if (selected.value !== null) say(t('app.adventure.tentShopPicked', { state: t(`app.adventure.tentShopState${p.stage}`) }), 2400)
}

function bring(to: TentTarget) {
  if (between.value || finished.value) return
  idle.value = 0
  const p = pieces.value.find((x) => x.id === selected.value)
  if (!p) {
    say(t('app.adventure.tentShopPickFirst'), 2000)
    return
  }
  if (p.at === to) {
    selected.value = null
    return
  }
  const working = to !== 'shelf' && work.value[to]! > 0
  const taken = to !== 'shelf' && !!onTable(to)
  const r = tentMove(p.stage, to, working, taken)
  const at = String(to)
  if (r.verdict === 'taken') {
    say(t('app.adventure.tentShopTaken'), 2400)
    return
  }
  if (r.verdict !== 'ok') {
    mistakes.value++
    play('wrong')
    flash('bad', at)
    say(t(r.verdict === 'busy' ? 'app.adventure.tentShopBusy' : `app.adventure.${NEED_KEY[String(r.need)]}`), 2600)
    selected.value = null
    return
  }
  progress.mark()
  flash('good', at)
  helping.value = false
  selected.value = null
  p.at = to
  if (to !== 'shelf') {
    work.value[to] = props.game.workMs
  } else {
    play('right')
    if (doneCount.value >= current.value.pieces) return roundDone()
  }
  spawn()
}

function roundDone() {
  between.value = true
  happy.value = true
  say(t('app.adventure.tentShopAll'), 0)
  if (lastRound.value) {
    later(() => {
      ending.value = true
      say(t('app.adventure.tentShopSabbath'), 0)
    }, 1600)
    later(() => {
      play('star')
      finished.value = true
    }, 4800)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    startRound()
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** "Help me": the next table for the chosen piece (or for the piece that is furthest on) lights up. */
function helpMe() {
  idle.value = 0
  if (selected.value === null) {
    const free = pieces.value.filter((p) => p.at !== 'shelf' && !(typeof p.at === 'number' && work.value[p.at]! > 0)).sort((a, b) => b.stage - a.stage)[0]
    if (free) selected.value = free.id
  }
  helping.value = true
  say(t('app.adventure.tentShopHelpSay'), 4000)
}
const helpTarget = computed<TentTarget | null>(() => {
  if (!helping.value) return null
  const p = pieces.value.find((x) => x.id === selected.value)
  return p ? tentTarget(p.stage) : null
})

// ---- looks
const tableBottom = computed(() => 100 - props.game.tableY)
/** The pieces that lie on a table, with the place of their table. */
const onTables = computed(() =>
  pieces.value.flatMap((p) => (typeof p.at === 'number' ? [{ ...p, x: props.game.tables[p.at]!.x }] : []))
)
const pile = computed(() => pieces.value.filter((p) => p.at === 'pile'))
const workerPic = (k: number) => {
  const w = props.game.tables[k]!.worker
  if (happy.value) return w.happy
  return work.value[k]! > 0 && frame.value === 1 ? w.b : w.a
}
const pieceLabel = (p: Piece) => t('app.adventure.tentShopPiece', { n: p.id + 1, state: t(`app.adventure.tentShopState${p.stage}`) })
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!ending"
        class="gm-field"
        role="group"
        :aria-label="t('app.adventure.tentShopField')"
        :style="{ backgroundImage: `url(${src(game.shop)})` }"
      )
        div(v-for="(tb, k) in game.tables" :key="tb.id" class="gm-worker" :style="{ left: `${tb.x}%`, width: `${game.workerW}%`, bottom: `${tableBottom + game.tableW * 0.45}%` }" aria-hidden="true")
          GameImage(:src="workerPic(k)" :ratio="240 / 360" colour="#9a7a5a" :label="tb.id")
        button(
          v-for="(tb, k) in game.tables"
          :key="`table-${tb.id}`"
          type="button"
          class="gm-table"
          :class="{ help: helpTarget === k, working: work[k] > 0 }"
          :data-table="k"
          :style="{ left: `${tb.x}%`, width: `${game.tableW}%`, bottom: `${tableBottom}%` }"
          :aria-label="tb.name"
          @click="bring(k)"
        )
          GameImage(:src="tb.image" :ratio="360 / 240" colour="#8a6a4a" :label="tb.id")
          span(v-if="work[k] > 0" class="gm-bar" :style="{ width: `${100 - (work[k] / game.workMs) * 100}%` }" aria-hidden="true")
          span(v-if="mark && mark.at === String(k)" class="gm-mark")
            GameMark(:kind="mark.kind")
        button(
          v-for="p in onTables"
          :key="`piece-${round}-${p.id}`"
          type="button"
          class="gm-piece"
          :class="{ chosen: selected === p.id }"
          :data-piece="p.id"
          :data-stage="p.stage"
          :style="{ left: `${p.x}%`, width: `${game.pieceW}%`, bottom: `${tableBottom + game.tableW * 0.55}%` }"
          :aria-label="pieceLabel(p)"
          @click="pick(p)"
        )
          GameImage(:src="game.pieces[p.stage]" :ratio="260 / 200" colour="#7a5a3a" :label="`stueck-${p.stage}`")
        div(class="gm-pile" :style="{ width: `${game.pieceW + 2}%`, bottom: `${tableBottom}%` }")
          span(class="gm-bale" aria-hidden="true")
            GameImage(:src="game.bale" :ratio="1" colour="#7a5a3a" label="stoffballen")
          button(
            v-for="p in pile"
            :key="`pile-${round}-${p.id}`"
            type="button"
            class="gm-piece in-pile"
            :class="{ chosen: selected === p.id }"
            :data-piece="p.id"
            :data-stage="p.stage"
            :aria-label="pieceLabel(p)"
            @click="pick(p)"
          )
            GameImage(:src="game.pieces[p.stage]" :ratio="260 / 200" colour="#7a5a3a" :label="`stueck-${p.stage}`")
        button(
          type="button"
          class="gm-shelf"
          :class="{ help: helpTarget === 'shelf' }"
          data-table="shelf"
          :style="{ width: `${game.pieceW + 4}%`, bottom: `${tableBottom}%` }"
          :aria-label="t('app.adventure.tentShopShelf', { n: doneCount, total: current.pieces })"
          @click="bring('shelf')"
        )
          GameImage(:src="game.tent" :ratio="1" colour="#7a5a3a" label="zelt-fertig")
          span(class="gm-shelf-count") {{ doneCount }} / {{ current.pieces }}
          span(v-if="mark && mark.at === 'shelf'" class="gm-mark")
            GameMark(:kind="mark.kind")
      div(v-else class="gm-field gm-end" :style="{ backgroundImage: `url(${src(game.finale)})` }" role="img" :aria-label="t('app.adventure.tentShopSabbath')")
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping" tone="blau" @click="helpMe") {{ t('app.adventure.tentShopHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.tentShopDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c49a
  background-size: cover
  background-position: center

.gm-end
  cursor: default

.gm-worker
  position: absolute
  transform: translateX(-50%)
  pointer-events: none
  z-index: 1

.gm-table, .gm-piece, .gm-shelf
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 12px
  background: none
  cursor: pointer

  &:focus-visible
    border-color: #fff6dc

.gm-table
  transform: translateX(-50%)
  z-index: 2

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.35)

.gm-bar
  position: absolute
  left: 0
  bottom: -8px
  height: 6px
  border-radius: 3px
  background: #8a5a2a

.gm-piece
  transform: translateX(-50%)
  z-index: 3

  &.chosen
    border-color: #fff6dc
    background: rgba(255, 246, 220, 0.35)

  &.in-pile
    position: absolute
    left: 50%
    bottom: 40%
    width: 100%

.gm-pile
  position: absolute
  left: 1%
  z-index: 3

.gm-bale
  display: block

.gm-shelf
  right: 1%
  z-index: 3

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.35)

.gm-shelf-count
  position: absolute
  left: 50%
  bottom: -4px
  transform: translateX(-50%)
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gm-mark
  position: absolute
  top: -14px
  right: -10px
  display: block

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none
</style>
