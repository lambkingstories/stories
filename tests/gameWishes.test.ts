/**
 * The wishes for a big game (Anton, 17 Nov 2026): for every full 40 stars of all adventures together the child may pick one game and
 * picks which; the choice is for good and kept on the device. A game is open when it was picked.
 * Here: the sums (pure), the saved picks, the little window and the bar in the game room, the page of a game, and the test buttons.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BIG_GAMES, STEP } from '@/data/bigGames'
import messages from '@/i18n/app'
import esBigGames from '@/i18n/es/teil3'
import { withGameTexts, BIG_GAME_TEXTS } from '@/i18n/bigGames'
import useAdventure from '@/use/useAdventure'
import useBigGames from '@/use/useBigGames'
import useGameWishes from '@/use/useGameWishes'
import { bigGameStates, canPick, firstSentence, pickedIds, wishesEarned, wishesFree, wishState } from '@/utils/bigGames'

const celebrate = vi.fn()
vi.mock('@/use/useCelebration', () => ({ default: () => ({ celebrate, stop: vi.fn() }) }))
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
const push = vi.fn()
const route = { params: {} as Record<string, string>, query: {} as Record<string, string>, name: 'app-big-game' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: withGameTexts(messages) as never, missingWarn: false, fallbackWarn: false })
// the router link as a plain anchor (the router itself is mocked)
const opts = { global: { plugins: [i18n], components: { 'router-link': { props: ['to'], template: '<a class="rl"><slot /></a>' } } }, attachTo: document.body }
const ids = BIG_GAMES.map((g) => g.id)
const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')

// The test build holds only one adventure (Josef, 36 stars), too few for a wish: stages with high numbers of Josef's progress give the stars
// (the sum counts every stage of the progress).
const FAKE = { id: 'josef' }
function giveStars(n: number) {
  const adv = useAdventure()
  const stages: Record<number, { stars: number; bestStars: number; done: boolean }> = {}
  for (let i = 0; i < Math.ceil(n / 3); i++) stages[1001 + i] = { stars: Math.min(3, n - i * 3), bestStars: Math.min(3, n - i * 3), done: true }
  adv.state[FAKE.id] = { stages }
}

beforeEach(() => {
  localStorage.clear()
  push.mockClear()
  celebrate.mockClear()
  route.params = {}
  route.query = {}
  const adv = useAdventure()
  for (const k of Object.keys(adv.state)) delete adv.state[k]
  useBigGames().replacePicks([])
})
afterEach(() => {
  document.body.innerHTML = ''
})

describe('the sums', () => {
  it('the rhythm is one constant: 40 stars', () => {
    expect(STEP).toBe(40)
  })

  it('one wish for every full 40 stars', () => {
    expect([0, 1, 39, 40, 79, 80, 119, 120, 400].map((n) => wishesEarned(n))).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 10])
    expect(wishesEarned(-5)).toBe(0)
    // the step can be changed in one place (50 stars: 300 stars give 6 wishes, not 7)
    expect(wishesEarned(300, 50)).toBe(6)
    expect(wishesEarned(300, 40)).toBe(7)
  })

  it('free wishes = earned minus picked, never below zero and never more than games left', () => {
    expect(wishesFree(BIG_GAMES, 85, [])).toBe(2)
    expect(wishesFree(BIG_GAMES, 85, ['david'])).toBe(1)
    expect(wishesFree(BIG_GAMES, 85, ['david', 'memory'])).toBe(0)
    // more picks than earned (stars were taken away, or a test button): not negative
    expect(wishesFree(BIG_GAMES, 30, ['david', 'memory', 'elia'])).toBe(0)
    expect(wishesFree(BIG_GAMES, 0, [])).toBe(0)
    // plenty of stars, but only the games that are left can be picked
    expect(wishesFree(BIG_GAMES, 4000, [])).toBe(BIG_GAMES.length)
    expect(wishesFree(BIG_GAMES, 4000, ids.slice(0, 9))).toBe(1)
    expect(wishesFree(BIG_GAMES, 4000, ids)).toBe(0)
  })

  it('only the games of the list count, each once', () => {
    expect(pickedIds(BIG_GAMES, ['david', 'david', 'nonsense', 'memory'])).toEqual(['david', 'memory'])
    expect(wishesFree(BIG_GAMES, 120, ['david', 'david', 'nonsense'])).toBe(2)
  })

  it('a game can be picked only with a free wish, only once, and only if it exists', () => {
    expect(canPick(BIG_GAMES, 39, [], 'david')).toBe(false)
    expect(canPick(BIG_GAMES, 40, [], 'david')).toBe(true)
    expect(canPick(BIG_GAMES, 40, ['david'], 'memory')).toBe(false)
    expect(canPick(BIG_GAMES, 80, ['david'], 'david')).toBe(false)
    expect(canPick(BIG_GAMES, 80, ['david'], 'memory')).toBe(true)
    expect(canPick(BIG_GAMES, 400, [], 'nonsense')).toBe(false)
  })

  it('a game is open when it was picked, and the state tells how far the next wish is', () => {
    expect(bigGameStates(BIG_GAMES, ['elia']).filter((s) => s.open).map((s) => s.game.id)).toEqual(['elia'])
    expect(wishState(BIG_GAMES, 0, [])).toMatchObject({ earned: 0, used: 0, free: 0, missing: 40, share: 0, allOpen: false })
    expect(wishState(BIG_GAMES, 15, [])).toMatchObject({ free: 0, missing: 25, share: 0.375 })
    expect(wishState(BIG_GAMES, 40, [])).toMatchObject({ earned: 1, free: 1, missing: 40, share: 0 })
    expect(wishState(BIG_GAMES, 95, ['david'])).toMatchObject({ earned: 2, used: 1, free: 1, missing: 25 })
    expect(wishState(BIG_GAMES, 95, ids).allOpen).toBe(true)
  })

  it('takes the first sentence of an existing text (a point after a number is no end)', () => {
    expect(firstSentence('David hütet die Schafe. Löwe und Bär kommen!')).toBe('David hütet die Schafe.')
    expect(firstSentence('Hier geht es um Mose als Baby (2. Mose 2,1–10). Seine Mutter flocht ein Körbchen.')).toBe('Hier geht es um Mose als Baby.')
    // a bracket without a number stays
    expect(firstSentence('Das Lamm (ein Tier) läuft weg. Es kommt zurück.')).toBe('Das Lamm (ein Tier) läuft weg.')
    expect(firstSentence('Finde die Paare')).toBe('Finde die Paare')
    expect(firstSentence('  Ein Lamm   hat sich verlaufen.  Der gute Hirte sucht es (Lukas 15,3–7).')).toBe('Ein Lamm hat sich verlaufen.')
    expect(firstSentence('Der gute Hirte sucht es (Lukas 15,3–7).')).toBe('Der gute Hirte sucht es.')
  })

  it('every game has a sentence for its window in German, English and Spanish', () => {
    const de = withGameTexts(messages) as unknown as Record<'de' | 'en', { app: { bigGames: Record<string, Record<string, unknown>> } }>
    const es = (esBigGames as unknown as { bigGames: Record<string, Record<string, unknown>> }).bigGames
    for (const g of BIG_GAMES) {
      for (const [lang, tree] of [['de', de.de.app.bigGames], ['en', de.en.app.bigGames], ['es', { ...es, ...BIG_GAME_TEXTS.es }]] as const) {
        const node = tree[g.id] ?? {}
        const raw = ['intro', 'story', 'sub'].map((k) => node[k]).find((v) => typeof v === 'string' && v) as string | undefined
        expect(raw, `${lang} ${g.id}`).toBeTruthy()
        expect(firstSentence(raw!).length, `${lang} ${g.id}`).toBeGreaterThan(10)
      }
    }
  })
})

describe('the picks are kept on the device', () => {
  it('without a wish nothing can be picked; with one, one game, once; the choice is saved', () => {
    const w = useGameWishes()
    expect(w.pick('david')).toBe(false)
    expect(w.isOpen('david')).toBe(false)
    giveStars(40)
    expect(w.wishes.value.free).toBe(1)
    expect(w.pick('david')).toBe(true)
    expect(w.isOpen('david')).toBe(true)
    // the only wish is used
    expect(w.wishes.value.free).toBe(0)
    expect(w.pick('memory')).toBe(false)
    expect(w.pick('david')).toBe(false)
    expect(JSON.parse(localStorage.getItem('lk-biggames-picks-v1') ?? 'null')).toEqual(['david'])
    giveStars(95)
    expect(w.wishes.value.free).toBe(1)
    expect(w.pick('elia')).toBe(true)
    expect(JSON.parse(localStorage.getItem('lk-biggames-picks-v1') ?? 'null')).toEqual(['david', 'elia'])
    expect(w.states.value.filter((s) => s.open).map((s) => s.game.id)).toEqual(['david', 'elia'])
  })

  it('a child who had its stars before gets its wishes (no migration)', () => {
    giveStars(130)
    expect(useGameWishes().wishes.value.free).toBe(3)
  })
})

describe('the game room', () => {
  const room = async () => {
    const { default: MyRewards } = await import('@/components/molecules/MyRewards.vue')
    const w = mount(MyRewards, { props: { part: 'games', section: 'bonus' }, ...opts })
    await flushPromises()
    return w
  }
  const tile = (w: Awaited<ReturnType<typeof room>>, id: string) => w.get(`button[data-game="${id}"]`)

  it('without a wish: no bar, the next wish is named, a closed game opens a window that only says how many stars are missing', async () => {
    giveStars(15)
    const w = await room()
    expect(w.find('.gw').exists()).toBe(false)
    expect(text(w)).toContain('Noch 25 Sterne bis zum nächsten Spiel-Wunsch.')
    await tile(w, 'david').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="bp-unlock"]').exists()).toBe(false)
    expect(text(w.get('[data-test="bp-missing"]'))).toBe('Noch 25 Sterne bis zum nächsten Spiel-Wunsch.')
    expect(text(w.get('[role="dialog"]'))).toContain('Davids Schleuder')
    await w.get('[data-test="bp-back"]').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(useBigGames().picked()).toEqual([])
    w.unmount()
  })

  it('with a wish: the bar speaks, a closed game opens a window with picture, name, one sentence and two buttons', async () => {
    giveStars(45)
    const w = await room()
    expect(text(w.get('.gw'))).toBe('Du darfst ein Spiel aussuchen!')
    expect(w.findAll('.gw-star')).toHaveLength(1)
    await tile(w, 'mose').trigger('click')
    await flushPromises()
    const dlg = w.get('[role="dialog"]')
    expect(text(dlg)).toContain('Moses Körbchen')
    expect(dlg.find('img.bp-img').exists()).toBe(true)
    // the sentence is the first one of a text the game already has (other sessions shorten those texts): one sentence, no Bible reference in brackets
    expect(dlg.get('.bp-text').text()).toMatch(/^[^()]{8,}[.!?]$/)
    expect(dlg.get('.bp-text').text().split(/[.!?]\s/).length).toBeLessThanOrEqual(2)
    expect(text(w.get('[data-test="bp-unlock"]'))).toBe('Freischalten')
    expect(text(w.get('[data-test="bp-back"]'))).toBe('Zurück')
    expect(w.find('[data-test="bp-missing"]').exists()).toBe(false)
    // "Back" changes nothing
    await w.get('[data-test="bp-back"]').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(useBigGames().picked()).toEqual([])
    expect(celebrate).not.toHaveBeenCalled()
    w.unmount()
  })

  it('"Unlock" opens the game for good, celebrates quietly, uses the wish, and the game can be played', async () => {
    giveStars(45)
    const w = await room()
    await tile(w, 'david').trigger('click')
    await flushPromises()
    await w.get('[data-test="bp-unlock"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(useBigGames().picked()).toEqual(['david'])
    expect(celebrate).toHaveBeenCalledTimes(1)
    expect(tile(w, 'david').classes()).not.toContain('is-locked')
    expect(tile(w, 'memory').classes()).toContain('is-locked')
    // the wish is used up: no bar, the next one is named, the other tiles do not glow any more
    expect(w.find('.gw').exists()).toBe(false)
    expect(text(w)).toContain('Noch 35 Sterne bis zum nächsten Spiel-Wunsch.')
    expect(tile(w, 'memory').classes()).not.toContain('is-pick')
    expect(text(w.get('#rw-bonus'))).toContain('1 / 10')
    // an open game starts; a second closed game now only tells the missing stars
    await tile(w, 'david').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-big-game', params: { gameId: 'david' } })
    await tile(w, 'memory').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="bp-unlock"]').exists()).toBe(false)
    w.unmount()
  })

  it('several free wishes: the bar says how many, and each pick uses one', async () => {
    giveStars(85)
    const w = await room()
    expect(text(w.get('.gw'))).toBe('Du darfst 2 Spiele aussuchen!')
    expect(w.findAll('.gw-star')).toHaveLength(2)
    await tile(w, 'elia').trigger('click')
    await flushPromises()
    await w.get('[data-test="bp-unlock"]').trigger('click')
    await flushPromises()
    expect(text(w.get('.gw'))).toBe('Du darfst ein Spiel aussuchen!')
    w.unmount()
  })

  it('with every game open the room says so and the closed-game window cannot happen', async () => {
    giveStars(450)
    useBigGames().replacePicks(ids)
    const w = await room()
    expect(w.find('.gw').exists()).toBe(false)
    expect(text(w)).toContain('Alle Abenteuer-Spiele sind frei.')
    expect(w.findAll('.rw-big.is-locked')).toHaveLength(0)
    w.unmount()
  })
})

describe('the page of a game', () => {
  const page = async () => {
    const { default: View } = await import('@/views/app/AppBigGameView.vue')
    const w = mount(View, { global: { plugins: [i18n], stubs: { BigGameDavid: { template: '<div class="game-david-stub"></div>' } } }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens only a picked game; otherwise it says so kindly and leads to the game page', async () => {
    route.params = { gameId: 'david' }
    const closed = await page()
    expect(closed.find('.game-david-stub').exists()).toBe(false)
    expect(text(closed)).toContain('noch nicht freigeschaltet')
    expect(closed.find('.bg-closed-btn').exists()).toBe(true)
    closed.unmount()
    useBigGames().addPick('david')
    const open = await page()
    expect(open.find('.game-david-stub').exists()).toBe(true)
    open.unmount()
  })

  it('the stars alone do not open it any more, the test link does', async () => {
    giveStars(500)
    route.params = { gameId: 'david' }
    const closed = await page()
    expect(closed.find('.game-david-stub').exists()).toBe(false)
    closed.unmount()
    route.query = { probe: '1' }
    const probe = await page()
    expect(probe.find('.game-david-stub').exists()).toBe(true)
    probe.unmount()
  })
})

describe('the test buttons', () => {
  it('"unlock all" opens every game and "restore" brings the picks back', async () => {
    const { default: TestUnlock } = await import('@/components/molecules/TestUnlock.vue')
    useBigGames().addPick('elia')
    const w = mount(TestUnlock, opts)
    const buttons = w.findAll('button')
    await buttons[0]!.trigger('click')
    expect(useBigGames().picked().sort()).toEqual([...ids].sort())
    expect(useGameWishes().states.value.every((s) => s.open)).toBe(true)
    await w.get('.tu-restore').trigger('click')
    expect(useBigGames().picked()).toEqual(['elia'])
    w.unmount()
  })
})

describe('the adventure page and the start page', () => {
  it('the slim line on the adventure page names the way to the wish, and it glows with free wishes', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    giveStars(15)
    const none = mount(Home, opts)
    await flushPromises()
    expect(text(none.get('.rewards-wish'))).toBe('Noch 25 Sterne bis zum nächsten Spiel')
    expect(none.get('.rewards-line').classes()).not.toContain('is-wish')
    expect(none.find('.rewards-bar').exists()).toBe(true)
    none.unmount()
    giveStars(85)
    const two = mount(Home, opts)
    await flushPromises()
    expect(text(two.get('.rewards-wish'))).toBe('Du darfst 2 Spiele aussuchen!')
    expect(two.get('.rewards-line').classes()).toContain('is-wish')
    expect(two.find('.rewards-bar').exists()).toBe(false)
    two.unmount()
  })

  it('the game card of the start page tells about the wish', async () => {
    const { default: Start } = await import('@/views/app/AppHomeView.vue')
    giveStars(45)
    const w = mount(Start, opts)
    await flushPromises()
    expect(w.text().replace(/\s+/g, ' ')).toContain('Du darfst ein Spiel aussuchen!')
    w.unmount()
  })
})
