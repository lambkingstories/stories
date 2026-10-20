<script setup lang="ts">
/**
 * Who kneels where? At the well in the evening the camels kneel in a row, the place at the well first. Blankets in colours and patterns lie ready (the colour name stands below each, for
 * those who cannot tell the colours apart). Clue cards say where a blanket belongs ("Blue kneels at the well", "Red kneels nearer to the well than yellow", ...), the app writes their text
 * from the kind of the clue. The child lays the blankets on the camels (drag, or tap a blanket and then a camel; a tap on a camel with a blanket takes it off). When all blankets lie, each card
 * shows a tick (true) or a cross (not true); when every card has its tick the round is solved, else the blankets may be moved freely. A full row with a cross counts as a mistake. The
 * "Tip" button takes a wrongly laid blanket off (it counts as a tip). No clock. The clues and their check are in `utils/abrahamGames.ts`; every round has exactly one solution.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { clueHolds } from '@/utils/abrahamGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { Clue, CluesBlanket, CluesGame } from '@/types/adventure'

const props = defineProps<{ game: CluesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every clue card of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.clues.length, 0))

/** Stand-in colours of the blankets until the pictures are there. */
const COLOURS: Record<string, string> = { rot: '#c9483c', blau: '#4f7fb5', gelb: '#e0be4a', gruen: '#6fa35a' }

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const slots = computed(() => props.game.slots.slice(0, current.value.blankets.length))

/** The blanket on every camel (the place at the well first); an empty text while the camel has none. */
const row = reactive<string[]>([])
const reset = () => row.splice(0, row.length, ...current.value.blankets.map(() => ''))
reset()
const best = ref(0)
const mistakes = ref(0)
const tips = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)

const blanketOf = (id: string): CluesBlanket | undefined => props.game.blankets.find((b) => b.id === id)
const nameOf = (id: string) => blanketOf(id)?.label ?? id
const full = computed(() => row.every((b) => b !== ''))
const inTray = computed(() => current.value.blankets.filter((id) => !row.includes(id)))
/** The state of every card once the row is full: true, false; before that nothing. */
const checks = computed<(boolean | null)[]>(() => current.value.clues.map((c) => (full.value ? clueHolds(row.slice(), c) : null)))
const stars = computed(() => mistakeStars(mistakes.value + tips.value, 3, 7))

/** The text of a clue card, written from its kind (so that German and English say the same). */
function clueText(c: Clue): string {
  const n = current.value.blankets.length
  const a = c.kind === 'before' || c.kind === 'next' ? nameOf(c.a) : nameOf(c.blanket)
  if (c.kind === 'before') return t('app.adventure.cluesBefore', { a, b: nameOf(c.b) })
  if (c.kind === 'next') return t('app.adventure.cluesNext', { a, b: nameOf(c.b) })
  const place = c.slot === 1 ? 'Well' : c.slot === n ? 'Last' : n === 3 && c.slot === 2 ? 'Mid' : 'N'
  return t(`app.adventure.clues${c.kind === 'at' ? 'At' : 'Not'}${place}`, { a, n: c.slot })
}

function put(blanket: string, camel: number) {
  if (between.value || finished.value || camel < 0 || camel >= row.length) return
  // a blanket that lies on another camel moves; one that lies on this camel goes back to the tray first
  const from = row.indexOf(blanket)
  if (from >= 0) row[from] = ''
  row[camel] = blanket
  message.value = ''
  play('tap')
  evaluate()
}

function take(camel: number) {
  if (between.value || finished.value || !row[camel]) return
  row[camel] = ''
  message.value = ''
  play('tap')
}

/** All blankets lie: the cards show their tick or cross; the best count of ticks is the progress of the round. */
function evaluate() {
  if (!full.value) return
  const holding = checks.value.filter((x) => x === true).length
  for (let i = best.value; i < holding; i++) progress.mark()
  best.value = Math.max(best.value, holding)
  if (holding === current.value.clues.length) {
    play('star')
    message.value = t('app.adventure.cluesRight')
    roundOver()
    return
  }
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.cluesWrong')
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1200)
    return
  }
  between.value = true
  later(() => {
    round.value++
    reset()
    best.value = 0
    between.value = false
    message.value = ''
  }, 1800)
}

/** The tip: a blanket that lies wrong is taken off. */
function showTip() {
  if (between.value || finished.value) return
  const wrong = row.findIndex((b, i) => b !== '' && b !== current.value.solution[i])
  if (wrong < 0) return
  tips.value++
  row[wrong] = ''
  message.value = t('app.adventure.cluesTip')
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => put(id, Number(target.replace('camel-', ''))))
const camelStyle = (i: number) => {
  const s = slots.value[i]!
  return { left: `${s[0]}%`, top: `${s[1]}%`, width: `${props.game.camelWidth}%`, zIndex: String(Math.round(s[1])) }
}
const ariaOf = (i: number) => (row[i] ? t('app.adventure.cluesCamelWith', { n: i + 1, name: nameOf(row[i] ?? '') }) : t('app.adventure.cluesCamel', { n: i + 1 }))
const imageAt = (i: number) => blanketOf(row[i] ?? '')?.image ?? ''
const colourAt = (i: number) => COLOURS[row[i] ?? '']
const patternOf = (id: string) => `${nameOf(id)}, ${blanketOf(id)?.pattern ?? ''}`
</script>

<template lang="pug">
  div(class="cl")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cl-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cl-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      ul(class="cl-cards" :aria-label="t('app.adventure.cluesCards')")
        li(v-for="(c, i) in current.clues" :key="`${round}-${i}`" class="cl-card" :class="{ ok: checks[i] === true, no: checks[i] === false }" :style="{ backgroundImage: `url(${src(game.card)})` }")
          span(class="cl-text") {{ clueText(c) }}
          GameMark(v-if="checks[i] === true" kind="good" class="cl-mark")
          GameMark(v-else-if="checks[i] === false" kind="bad" class="cl-mark")
      div(class="cl-field" role="group" :aria-label="t('app.adventure.cluesField')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        template(v-if="!between")
          div(
            v-for="(s, i) in slots"
            :key="`${round}-c-${i}`"
            class="cl-camel"
            :class="{ ready: selected !== null }"
            :style="camelStyle(i)"
            :data-drop="`camel-${i}`"
            role="button"
            tabindex="0"
            :aria-label="ariaOf(i)"
            @click="row[i] !== '' && selected === null ? take(i) : tapPlace(`camel-${i}`)"
            @keydown.enter.space.prevent="row[i] !== '' && selected === null ? take(i) : tapPlace(`camel-${i}`)"
          )
            GameImage(:src="game.camel" :ratio="4 / 3" colour="#d9c3a0")
            span(v-if="row[i] !== ''" class="cl-blanket")
              GameImage(:src="imageAt(i)" :ratio="220 / 140" :colour="colourAt(i)")
      p(class="cl-fb" role="status") {{ message }}
      div(class="cl-tray" role="group" :aria-label="t('app.adventure.cluesTray')")
        div(
          v-for="id in inTray"
          :key="`${round}-${id}`"
          class="cl-token"
          :class="{ chosen: selected === id, lifted: dragging === id }"
          :style="dragStyle(id)"
          role="button"
          tabindex="0"
          :aria-label="patternOf(id)"
          @pointerdown="down($event, id)"
          @keydown.enter.space.prevent="toggleSelect(id)"
        )
          GameImage(:src="blanketOf(id)?.image ?? ''" :ratio="220 / 140" :colour="COLOURS[id]")
          span(class="cl-name") {{ patternOf(id) }}
      AdvButton(tone="blau" class="cl-tip" :disabled="between" @click="showTip") {{ t('app.adventure.cluesTipButton') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cluesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cl
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.cl-round
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

.cl-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.cl-cards
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 8px
  margin: 0
  padding: 0
  list-style: none

// a clue card: the picture of the leather card behind the text the app writes
.cl-card
  position: relative
  display: flex
  align-items: center
  min-height: 60px
  padding: 8px 44px 8px 14px
  border-radius: 12px
  border: 2px solid rgba(150, 100, 30, 0.6)
  background-color: #f4e8c3
  background-size: 100% 100%
  font-weight: 700
  font-size: 1rem
  color: #3f321b

  &.ok
    box-shadow: 0 0 0 3px rgba(60, 160, 70, 0.9)

  &.no
    box-shadow: 0 0 0 3px rgba(200, 50, 50, 0.9)

.cl-mark
  position: absolute
  top: 50%
  right: 8px
  transform: translateY(-50%)

.cl-field
  position: relative
  width: 100%
  aspect-ratio: 16 / 9
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9b98f
  background-size: cover
  background-position: center

// a camel kneels with its feet at the place
.cl-camel
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  cursor: pointer

  &.ready
    filter: drop-shadow(0 0 6px rgba(255, 214, 90, 0.95))

// the blanket lies on the back of the camel
.cl-blanket
  position: absolute
  display: block
  left: 20%
  top: 4%
  width: 58%
  pointer-events: none

.cl-fb
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

.cl-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 80px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.cl-token
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  width: 112px
  padding: 4px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

.cl-name
  font-weight: 800
  font-size: 1rem
  text-align: center
  color: #3f321b

.cl-tip
  align-self: center
</style>
