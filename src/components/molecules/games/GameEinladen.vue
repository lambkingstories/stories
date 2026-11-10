<script setup lang="ts">
/**
 * "Come, all things are ready!" (Luke 14,17.21-23, stage 12 of "Geschichten von Jesus"). The servant of the host stands at the gate of the house; in the lane of the city (round 1) and on the country road
 * (round 2) guests wave at him, one here, one there, for a short time. A tap on a waving guest invites him: the servant calls "Come!", the guest hops to his place at the long table below and sits down, the lamp over his
 * place lights up, and the counter "Seats free" goes down. Nothing can be lost or wrong: a guest that is not tapped goes away and comes back after a while at another place. A mother with her child take two places.
 * Round 1 (streets and lanes): six guests, five places, two at a time, five seconds each; then the servant says "There is still room!". Round 2 (highways and fences): four guests and a pair stand behind hedges and fences
 * and show only head, shoulders and the waving hand, three at a time, 3.5 seconds each; at the end all twelve lamps burn: "The house is full!".
 * Every waving guest is a button with words (Tab goes to the next one, Enter or Space invites; Space on the field invites the one who has waited longest). The button "Help me" comes after fifteen seconds
 * without a tap: the servant turns toward the guest who waves longest, and he stays until he is tapped (at most two stars with help). With reduced motion the guests stay until they are tapped and sit down without hopping.
 * The arithmetic and the clock of the guests are `utils/gleichnisseNeuC.ts` (the component feeds in 100 milliseconds at a time); stars: `inviteStars`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { INVITE_ASPECT, inviteDone, inviteFirstWaving, inviteFree, inviteHelp, inviteSeatAt, inviteSeatList, inviteStars, inviteStart, inviteStep, inviteTap } from '@/utils/gleichnisseNeuC'
import type { InviteGame, InviteGuest, InviteGuestSprite, InviteSpot, InviteState, Pt } from '@/utils/gleichnisseNeuC'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: InviteGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.guests.length, 0))

const IDLE_SECONDS = 15
const TICK = 100
const HOP_MS = 750
const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<InviteState>(inviteStart(props.game.rounds[0]!, 0))
/** the guests of the earlier rounds that sit at the table: their picture and where they sit */
const carried = ref<{ sprite: string; at: Pt; seats: number[] }[]>([])
/** the guests that have been invited and are on their way (index of the round -> 'start' = still at his place, 'go' = moving to the table) */
const flight = ref<Record<number, 'start' | 'go'>>({})
const idle = ref(0)
const helped = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const says = ref(false)
const faceLeft = ref(false)
const guestEls = ref<HTMLElement[]>([])
const setGuestEl = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) guestEls.value[i] = el
}
let messageSeq = 0
let saysSeq = 0

const stars = computed(() => inviteStars(helped.value))
const free = computed(() => inviteFree(props.game, st.value.nextSeat))
const spriteByKey = (key: string): InviteGuestSprite => props.game.sprites[key]!
const spriteOf = (g: InviteGuest): InviteGuestSprite => spriteByKey(g.sprite)

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// the clock of the guests (100 milliseconds at a time) and of "Help me"
let sinceSecond = 0
function tick() {
  if (!finished.value && !between.value) {
    st.value = inviteStep(current.value, st.value, TICK, reduced)
    sinceSecond += TICK
    if (sinceSecond >= 1000) {
      sinceSecond = 0
      idle.value++
    }
  }
  later(tick, TICK)
}
later(tick, TICK)

function invite(i: number) {
  if (between.value || finished.value) return
  const r = inviteTap(props.game, current.value, st.value, i)
  if (!r.invited) return
  idle.value = 0
  sinceSecond = 0
  faceLeft.value = false
  st.value = r.state
  progress.mark()
  play('bead')
  says.value = true
  const sid = ++saysSeq
  later(() => {
    if (saysSeq === sid) says.value = false
  }, 1500)
  if (reduced) flight.value = { ...flight.value }
  else {
    flight.value = { ...flight.value, [i]: 'start' }
    later(() => (flight.value = { ...flight.value, [i]: 'go' }), 80)
    later(() => {
      const f = { ...flight.value }
      delete f[i]
      flight.value = f
    }, HOP_MS + 120)
  }
  if (inviteDone(r.state)) later(roundDone, reduced ? 500 : HOP_MS + 500)
}

function roundDone() {
  between.value = true
  play('star')
  if (lastRound.value) {
    say(t('app.adventure.inviteFull'), 0)
    later(() => {
      finished.value = true
    }, 2600)
    return
  }
  say(t('app.adventure.inviteRoom'), 0)
  later(() => {
    // the guests of this round stay at the table; the next round goes on with the next free place
    const c = [...carried.value]
    current.value.guests.forEach((g, i) => {
      const at = inviteSeatAt(props.game, current.value, st.value, i)
      if (at) c.push({ sprite: g.sprite, at, seats: inviteSeatList(props.game, current.value, st.value, i) })
    })
    carried.value = c
    const seat = st.value.nextSeat
    round.value++
    st.value = inviteStart(current.value, seat)
    flight.value = {}
    guestEls.value = []
    idle.value = 0
    sinceSecond = 0
    between.value = false
    message.value = ''
    say(t('app.adventure.gameNext'), 2500)
  }, 2800)
}

function helpMe() {
  idle.value = 0
  sinceSecond = 0
  const r = inviteHelp(current.value, st.value)
  st.value = r.state
  if (r.guest === null) return
  helped.value = true
  const g = r.state.guests[r.guest]!
  const sp = current.value.spots[g.spot]
  if (sp) faceLeft.value = sp.x < props.game.servant.x
  say(t('app.adventure.inviteHelped'), 3500)
  void nextTick(() => guestEls.value[r.guest!]?.focus({ preventScroll: true }))
}

// Space or Enter on the field itself invites the guest who has waited longest
function onFieldKey(e: KeyboardEvent) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  const i = inviteFirstWaving(st.value)
  if (i !== null) invite(i)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const waving = computed(() => st.value.guests.map((g, i) => (g.phase === 'waving' ? i : -1)).filter((i) => i >= 0))
const hopping = computed(() => Object.keys(flight.value).map(Number))
/** a guest in the air: his place on the way is the spot first, then the seat */
function hopStyle(i: number) {
  const g = st.value.guests[i]!
  const sp = current.value.spots[g.spot]
  const seat = inviteSeatAt(props.game, current.value, st.value, i)
  const w = spriteOf(current.value.guests[i]!).wait.w
  const at = flight.value[i] === 'go' && seat ? seat : sp ?? seat ?? { x: 0, y: 0 }
  return { left: `${at.x}%`, top: `${at.y}%`, width: `${w}%`, zIndex: 3000 }
}
const waveStyle = (i: number) => {
  const g = st.value.guests[i]!
  const sp = current.value.spots[g.spot]!
  return { left: `${sp.x}%`, top: `${sp.y}%`, width: `${spriteOf(current.value.guests[i]!).wait.w}%`, zIndex: z(sp.y) }
}
const coverStyle = (sp: InviteSpot) => {
  const s = sp.cover === 'fence' ? props.game.fence : props.game.hedge
  return { left: `${sp.x}%`, top: `${sp.y + 1.5}%`, width: `${s.w}%`, zIndex: z(sp.y) + 3 }
}
const coverSprite = (sp: InviteSpot) => (sp.cover === 'fence' ? props.game.fence : props.game.hedge)
const hiddenAt = (i: number) => !!current.value.guests[i]?.hidden
const seatedNow = computed(() =>
  st.value.guests
    .map((g, i) => (g.phase === 'seated' && flight.value[i] === undefined ? i : -1))
    .filter((i) => i >= 0)
)
const sitStyle = (sprite: InviteGuestSprite, at: Pt) => ({ left: `${at.x}%`, top: `${at.y}%`, width: `${sprite.sit.w}%`, zIndex: 1600 })
const seatedAt = (i: number): Pt => inviteSeatAt(props.game, current.value, st.value, i) ?? { x: 0, y: 0 }
/** the seats that are taken and have a guest sitting (earlier rounds, and this round once he has landed) */
const taken = computed(() => {
  const on = new Array<boolean>(props.game.tableSeats.length).fill(false)
  carried.value.forEach((c) => c.seats.forEach((k) => (on[k] = true)))
  seatedNow.value.forEach((i) => inviteSeatList(props.game, current.value, st.value, i).forEach((s) => (on[s] = true)))
  return on
})
// the lamps hang behind the guests (they never hide a waving guest) and are covered by the table below
const lampStyle = (k: number) => ({ left: `${props.game.tableSeats[k]!.x}%`, top: `${props.game.lamp.y}%`, width: `${props.game.lamp.off.w}%`, zIndex: 5 })
const tableStyle = computed(() => ({ left: `${props.game.table.x}%`, top: `${props.game.table.y}%`, width: `${props.game.table.w}%`, zIndex: 1500 }))
const servantStyle = computed(() => ({ left: `${props.game.servant.x}%`, top: `${props.game.servant.y}%`, width: `${props.game.servant.w}%`, zIndex: z(props.game.servant.y) }))
const saysStyle = computed(() => ({ left: `${props.game.servant.x}%`, top: `${props.game.servant.y - props.game.servant.w * INVITE_ASPECT.servant * ratio.value}%`, zIndex: 3500 }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(current.scene)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.inviteField')"
        @keydown.self="onFieldKey"
      )
        div(class="gm-servant" :class="{ flip: faceLeft }" :style="servantStyle" role="img" :aria-label="game.servant.label")
          GameImage(:src="game.servant.image" :ratio="0.67" colour="#6f8fc4" :label="game.servant.label")
        span(v-if="says" class="gm-says" :style="saysStyle" aria-hidden="true") {{ t('app.adventure.inviteCome') }}
        template(v-for="(sp, k) in current.spots" :key="`c-${round}-${k}`")
          div(v-if="sp.cover" class="gm-cover" :style="coverStyle(sp)" aria-hidden="true")
            GameImage(:src="coverSprite(sp).image" :ratio="2" colour="#5f8f4a" :label="coverSprite(sp).label")
        template(v-for="i in waving" :key="`w-${round}-${i}`")
          button(
            :ref="(el) => setGuestEl(el, i)"
            type="button"
            class="gm-guest"
            :class="{ hinted: st.pinned === i, calm: reduced }"
            :style="waveStyle(i)"
            :aria-label="spriteOf(current.guests[i]).wait.label"
            @click="invite(i)"
          )
            GameImage(:src="spriteOf(current.guests[i]).wait.image" :ratio="0.6" colour="#d9a46a" :label="spriteOf(current.guests[i]).wait.label")
        div(class="gm-table" :style="tableStyle" role="img" :aria-label="game.table.label")
          GameImage(:src="game.table.image" :ratio="5" colour="#c9b283" :label="game.table.label")
        div(v-for="(c, k) in carried" :key="`s-${k}`" class="gm-sit" :style="sitStyle(spriteByKey(c.sprite), c.at)" role="img" :aria-label="spriteByKey(c.sprite).sit.label")
          GameImage(:src="spriteByKey(c.sprite).sit.image" :ratio="0.77" colour="#d9a46a" :label="spriteByKey(c.sprite).sit.label")
        div(
          v-for="i in seatedNow"
          :key="`n-${round}-${i}`"
          class="gm-sit"
          :style="sitStyle(spriteOf(current.guests[i]), seatedAt(i))"
          role="img"
          :aria-label="spriteOf(current.guests[i]).sit.label"
        )
          GameImage(:src="spriteOf(current.guests[i]).sit.image" :ratio="0.77" colour="#d9a46a" :label="spriteOf(current.guests[i]).sit.label")
        div(
          v-for="i in hopping"
          :key="`h-${round}-${i}`"
          class="gm-hop"
          :class="{ go: flight[i] === 'go' }"
          :style="hopStyle(i)"
          aria-hidden="true"
        )
          GameImage(:src="spriteOf(current.guests[i]).wait.image" :ratio="0.6" colour="#d9a46a" :label="spriteOf(current.guests[i]).wait.label")
        div(v-for="(seat, k) in game.tableSeats" :key="`l-${k}`" class="gm-lamp" :class="{ lit: taken[k] }" :style="lampStyle(k)" role="img" :aria-label="taken[k] ? game.lamp.on.label : game.lamp.off.label")
          GameImage(:src="taken[k] ? game.lamp.on.image : game.lamp.off.image" :ratio="0.67" colour="#e8c866" :label="taken[k] ? game.lamp.on.label : game.lamp.off.label")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.inviteFree', { n: free }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.inviteHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.inviteDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5a4a2c

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #7a6a4c
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

// everything stands on its foot (the point of the data is the middle of the foot)
.gm-servant, .gm-cover, .gm-table, .gm-sit, .gm-lamp, .gm-hop
  position: absolute
  display: block
  pointer-events: none

.gm-servant, .gm-cover, .gm-table, .gm-sit
  transform: translate(-50%, -100%)

.gm-servant.flip
  transform: translate(-50%, -100%) scaleX(-1)

.gm-lamp
  transform: translate(-50%, -50%)

.gm-guest
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: none
  background: none
  transform: translate(-50%, -100%)
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  animation: gm-wave 1100ms ease-in-out infinite alternate
  transform-origin: 50% 100%

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 10px

  &.hinted
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 10px

  &.calm
    animation: none

// the hop to the table: the position moves (CSS transition), the figure rises and falls
.gm-hop
  transform: translate(-50%, -100%)
  transition: left 700ms ease-in-out, top 700ms ease-in-out
  animation: gm-hop 700ms ease-in-out

.gm-says
  position: absolute
  transform: translate(-50%, -100%)
  padding: 2px 12px
  border-radius: 14px
  background: #fff6dc
  border: 2px solid #d4a83e
  font-weight: 900
  font-size: 1.05rem
  color: #4a3a18
  pointer-events: none

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

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

@keyframes gm-wave
  from
    rotate: -2.5deg
  to
    rotate: 2.5deg

@keyframes gm-hop
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -18%

// less motion: nothing waves or hops
@media (prefers-reduced-motion: reduce)
  .gm-guest, .gm-hop
    animation: none

  .gm-hop
    transition: none
</style>
