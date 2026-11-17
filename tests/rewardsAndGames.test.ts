/**
 * The rewards and the games moved into "Me" (Anton, 17 Nov 2026): the tiles "My rewards" and "My games" are in the profile, the adventure
 * page shows the adventures first and a slim line instead of the four tiles, "My games" has three groups (adventure games, stage games,
 * family games), and every old way (game room, collection, awards) leads to the new places.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import messages from '@/i18n/app'
import esTeil1 from '@/i18n/es/teil1'
import esTeil2 from '@/i18n/es/teil2'
import esTeil3 from '@/i18n/es/teil3'
import { withGameTexts } from '@/i18n/bigGames'
import useAdventure from '@/use/useAdventure'
import useBigGames from '@/use/useBigGames'
import { routeToNav } from '@/use/useAppNav'

// the version of the build (set by the build tool; the profile page imports it)
vi.stubGlobal('APP_VERSION', 'test')
// the user database (IndexedDB) is opened when the profile page is loaded: an open that never answers is enough here
vi.stubGlobal('indexedDB', { open: () => ({ addEventListener: () => {}, removeEventListener: () => {} }) })
vi.mock('@/components/atoms/ZLanguageSwitcher.vue', () => ({ default: { template: '<span />' } }))
vi.mock('@/use/useCelebration', () => ({ default: () => ({ celebrate: vi.fn(), stop: vi.fn() }) }))
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
const push = vi.fn()
const route = { params: {} as Record<string, string>, query: {} as Record<string, string>, name: 'app-profile' }
vi.mock('vue-router', async (orig) => {
  const real = await orig<typeof import('vue-router')>()
  return { ...real, useRoute: () => route, useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() }) }
})

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: withGameTexts(messages) as never, missingWarn: false, fallbackWarn: false })
// the router link as a plain anchor with its target kept (the router itself is mocked)
const RouterLink = { props: ['to'], template: '<a class="rl"><slot /></a>' }
const opts = { global: { plugins: [i18n], components: { 'router-link': RouterLink }, stubs: { ParentSheet: true, TestUnlock: true, LkCompanion: true, AvatarPickerModal: true, ZLanguageSwitcher: true } }, attachTo: document.body }
const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')
const targets = (w: ReturnType<typeof mount>) => w.findAllComponents('.rl').map((c) => c.props('to') as { name?: string })

function giveStars(n: number) {
  const adv = useAdventure()
  const stages: Record<number, { stars: number; bestStars: number; done: boolean }> = {}
  for (let i = 0; i < Math.ceil(n / 3); i++) stages[1001 + i] = { stars: Math.min(3, n - i * 3), bestStars: Math.min(3, n - i * 3), done: true }
  adv.state.josef = { stages }
}

beforeEach(() => {
  localStorage.clear()
  push.mockClear()
  route.params = {}
  route.query = {}
  const adv = useAdventure()
  for (const k of Object.keys(adv.state)) delete adv.state[k]
  useBigGames().replacePicks([])
})
afterEach(() => {
  document.body.innerHTML = ''
})

describe('"Me": the tiles', () => {
  it('has the tiles "Meine Belohnungen" and "Meine Spiele" and the thank-you book, and nothing else about rewards', async () => {
    const { default: Profile } = await import('@/views/app/AppProfileView.vue')
    const w = mount(Profile, opts)
    await flushPromises()
    const tiles = w.findAll('.my-tile')
    expect(tiles.map((t) => t.find('.my-tile-title').text())).toEqual(['Meine Belohnungen', 'Meine Spiele', 'Mein Dankbuch'])
    expect(targets(w).map((t) => t.name).filter(Boolean)).toEqual(expect.arrayContaining(['app-collection', 'app-gameroom', 'app-journal']))
    // the build number stands quietly at the bottom
    expect(w.find('[data-testid="build-stamp"]').exists()).toBe(true)
    // the old tiles are gone
    expect(w.text()).not.toMatch(/Spielzimmer|Minispiel|Meine Auszeichnungen|Meine Sammlung/)
    w.unmount()
  })

  it('"Meine Spiele" glows and says so when a game may be picked', async () => {
    const { default: Profile } = await import('@/views/app/AppProfileView.vue')
    const none = mount(Profile, opts)
    await flushPromises()
    expect(none.find('.my-tile-badge').exists()).toBe(false)
    none.unmount()
    giveStars(45)
    const w = mount(Profile, opts)
    await flushPromises()
    expect(w.get('.my-tile-badge').text()).toBe('1')
    expect(text(w.get('.my-tile.is-wish'))).toContain('Du darfst ein Spiel aussuchen!')
    w.unmount()
  })
})

describe('"Meine Spiele": three rooms', () => {
  it('is an overview with three cards, each one leads to a page of its own, and nothing lies one below the other', async () => {
    const { default: GameRoom } = await import('@/views/app/AppGameRoomView.vue')
    giveStars(45)
    const w = mount(GameRoom, opts)
    await flushPromises()
    expect(w.text()).toContain('Meine Spiele')
    expect(w.findAll('.gr-room').map((r) => r.attributes('data-room'))).toEqual(['adventure', 'stage', 'family'])
    expect(w.findAll('.gr-name').map((n) => n.text())).toEqual(['Abenteuer-Spiele', 'Etappen-Spiele', 'Familien-Spiele'])
    expect(targets(w).map((t) => t.name)).toEqual(['app-games-adventure', 'app-games-stage', 'app-family'])
    // 45 stars: one wish is free and the card says so; no tiles on this page, no chips
    expect(w.find('.gr-room--adventure .gr-wish').exists()).toBe(true)
    expect(w.findAll('.rw-tile')).toHaveLength(0)
    expect(w.find('.gr-chip').exists()).toBe(false)
    expect(w.text()).not.toMatch(/Spielzimmer|Minispiel|Bonusspiel/)
    w.unmount()
  })

  it('the adventure games have a page of their own: the wish bar and the tiles, a closed one opens the window to pick it', async () => {
    const { default: Page } = await import('@/views/app/AppGamesAdventureView.vue')
    giveStars(45)
    const w = mount(Page, opts)
    await flushPromises()
    expect(text(w.get('.gw'))).toBe('Du darfst ein Spiel aussuchen!')
    expect(w.findAll('button[data-game]').length).toBeGreaterThanOrEqual(10)
    expect(w.findAll('.rw-tile:not(.rw-big)')).toHaveLength(0)
    await w.get('button[data-game="david"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    expect(w.find('[data-test="bp-unlock"]').exists()).toBe(true)
    w.unmount()
  })

  it('the stage games have a page of their own, in groups: one heading per adventure', async () => {
    const { default: Page } = await import('@/views/app/AppGamesStageView.vue')
    const w = mount(Page, opts)
    await flushPromises()
    expect(w.findAll('button[data-game]')).toHaveLength(0)
    expect(w.findAll('.rw-group').length).toBeGreaterThan(0)
    expect(w.findAll('.rw-group-title').every((h) => h.text().length > 2)).toBe(true)
    // nothing played yet: every group is folded; a tap on its heading unfolds it, and its tiles are inside the group
    expect(w.findAll('.rw-tile')).toHaveLength(0)
    const head = w.get('.rw-group-title')
    expect(head.attributes('aria-expanded')).toBe('false')
    await head.trigger('click')
    expect(head.attributes('aria-expanded')).toBe('true')
    expect(w.findAll('.rw-tile').length).toBeGreaterThan(0)
    expect(w.findAll('.rw-group .rw-tile')).toHaveLength(w.findAll('.rw-tile').length)
    w.unmount()
  })

  it('the routes: the rooms belong to "Me", and the family page too', () => {
    expect(routeToNav('app-games-adventure')).toBe('profile')
    expect(routeToNav('app-games-stage')).toBe('profile')
    expect(routeToNav('app-family')).toBe('profile')
  })
})

describe('the adventure page: adventures first, one slim line for the rewards', () => {
  it('has no tiles any more and shows the line with the cards, the cups and the way to the next game', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    giveStars(15)
    const w = mount(Home, opts)
    await flushPromises()
    expect(w.find('.tiles').exists()).toBe(false)
    expect(w.find('.tile4').exists()).toBe(false)
    expect(w.find('.stars-card').exists()).toBe(false)
    const line = w.get('.rewards-line')
    expect(text(line)).toContain('Deine Belohnungen')
    expect(text(line)).toMatch(/\d+ Karten? · \d+ Pokale?/)
    expect(text(line)).toContain('Noch 25 Sterne bis zum nächsten Spiel')
    // it leads to "Me"
    const to = w.findAllComponents('.rl').find((c) => c.classes().includes('rewards-line'))?.props('to') as { name: string }
    expect(to).toEqual({ name: 'app-profile' })
    // the adventures stand before the line is needed: the list of epochs is on the page, and only one star counter
    expect(w.findAll('.epoch').length).toBeGreaterThan(3)
    expect(w.text()).not.toMatch(/Minispiel|Spielzimmer|Bonusspiel/)
    expect(w.findAll('.rewards-line')).toHaveLength(1)
    w.unmount()
  })

  it('the line says so when a game may be picked, and when all are open', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    giveStars(45)
    const w = mount(Home, opts)
    await flushPromises()
    expect(text(w.get('.rewards-line'))).toContain('Du darfst ein Spiel aussuchen!')
    w.unmount()
    const { BIG_GAMES } = await import('@/data/bigGames')
    useBigGames().replacePicks(BIG_GAMES.map((g) => g.id))
    const all = mount(Home, opts)
    await flushPromises()
    expect(text(all.get('.rewards-line'))).toContain('Alle Abenteuer-Spiele sind frei.')
    all.unmount()
  })

  it('the first thing after the banner is the adventure to go on with, before the line', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    const adv = useAdventure()
    adv.recordStars('josef', 1, 3)
    adv.completeStage('josef', 1)
    const w = mount(Home, opts)
    await flushPromises()
    const kids = Array.from(w.get('.home-list').element.children).map((e) => ['go-on', 'rewards-line', 'epoch'].find((c) => e.classList.contains(c)) ?? '')
    expect(kids.indexOf('go-on')).toBeGreaterThanOrEqual(0)
    expect(kids.indexOf('go-on')).toBeLessThan(kids.indexOf('rewards-line'))
    expect(kids.indexOf('rewards-line')).toBeLessThan(kids.indexOf('epoch'))
    w.unmount()
  })
})

describe('"Meine Belohnungen": four parts', () => {
  it('has the card album, the cups, the awards and the coloring pictures; the old awards address opens the awards', async () => {
    const { default: Collection } = await import('@/views/app/AppCollectionView.vue')
    const w = mount(Collection, opts)
    await flushPromises()
    expect(w.text()).toContain('Meine Belohnungen')
    expect(w.findAll('.co-tab').map((t) => t.find('span').text())).toEqual(['Kartenalbum', 'Pokale', 'Auszeichnungen', 'Ausmalbilder'])
    expect(w.find('.co-album').exists()).toBe(true)
    await w.findAll('.co-tab')[2]!.trigger('click')
    expect(w.find('.aw').exists()).toBe(true)
    expect(w.findAll('.award-tile').length).toBeGreaterThan(5)
    w.unmount()
    route.query = { tab: 'awards' }
    const asked = mount(Collection, opts)
    await flushPromises()
    expect(asked.find('.aw').exists()).toBe(true)
    expect(asked.find('.co-album').exists()).toBe(false)
    asked.unmount()
  })
})

describe('the old ways lead to the new places', () => {
  it('the router: the game room, the collection and the awards keep their names; old addresses redirect', async () => {
    const { default: router } = await vi.importActual<typeof import('@/router')>('@/router')
    const rec = (name: string) => router.getRoutes().find((r) => r.name === name)
    expect(rec('app-gameroom')?.path).toBe('/app/spiele')
    expect(rec('app-collection')?.path).toBe('/app/belohnungen')
    expect(rec('app-awards')?.redirect).toEqual({ name: 'app-collection', query: { tab: 'awards' } })
    const redirects = router.getRoutes().filter((r) => !r.name && r.redirect)
    expect(redirects.map((r) => r.path)).toEqual(expect.arrayContaining(['/app/spielzimmer', '/app/sammlung']))
    expect(router.getRoutes().some((r) => r.path === '/app/familie' && r.name === 'app-family')).toBe(true)
  })

  it('the tab bar keeps "Me" active on the new pages', () => {
    for (const name of ['app-collection', 'app-gameroom', 'app-awards', 'app-profile']) expect(routeToNav(name)).toBe('profile')
  })

  it('the start page card for the games leads to "Meine Spiele"', async () => {
    const { default: Start } = await import('@/views/app/AppHomeView.vue')
    const w = mount(Start, opts)
    await flushPromises()
    push.mockClear()
    await w.findAll('.resume-card')[3]!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-gameroom' })
    w.unmount()
  })

  it('the family games page goes back to "Meine Spiele"', () => {
    const src = readFileSync(resolve(__dirname, '../src/views/app/AppFamilyGamesView.vue'), 'utf8')
    expect(src).toContain("goBackTo(router, { name: 'app-gameroom' })")
  })
})

describe('one name for the games, in all languages', () => {
  const flat = (o: unknown, out: string[] = []): string[] => {
    if (typeof o === 'string') out.push(o)
    else if (o && typeof o === 'object') for (const v of Object.values(o)) flat(v, out)
    return out
  }
  const OLD = /Minispiel|Spielzimmer|Bonusspiel|Mini games?\b|[Gg]ame room|Bonus games?\b|Minijuego|[Ss]ala de juegos/
  it('no text names a "Minispiel", a "Spielzimmer" or "Bonusspiele" any more (de, en, es)', () => {
    const de = flat((messages as { de: unknown }).de)
    const en = flat((messages as { en: unknown }).en)
    const es = flat([esTeil1, esTeil2, esTeil3])
    expect(de.filter((s) => OLD.test(s))).toEqual([])
    expect(en.filter((s) => OLD.test(s))).toEqual([])
    expect(es.filter((s) => OLD.test(s))).toEqual([])
  })

  it('the new names exist in German, English and Spanish', () => {
    const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], o)
    const de = (messages as { de: { app: unknown } }).de.app
    const en = (messages as { en: { app: unknown } }).en.app
    for (const key of ['profile.myRewards', 'profile.myGames', 'profile.stageGamesTitle', 'profile.stageGamesHint', 'profile.stageGameLocked', 'profile.familyGamesSub', 'profile.tileGamesSub', 'collection.awards', 'adventure.rewardsTitle', 'adventure.rewardsCards', 'adventure.rewardsCups', 'adventure.rewardsNext']) {
      expect(get(de, key), `de ${key}`).toBeTruthy()
      expect(get(en, key), `en ${key}`).toBeTruthy()
    }
    expect(get(de, 'profile.myGames')).toBe('Meine Spiele')
    expect(get(de, 'profile.stageGamesTitle')).toBe('Etappen-Spiele')
    expect(get(de, 'bigGames.title')).toBe('Abenteuer-Spiele')
    for (const key of ['myRewards', 'myGames', 'stageGamesTitle', 'tileGamesSub']) expect((esTeil3 as unknown as { profile?: Record<string, string> }).profile?.[key] ?? (esTeil3 as unknown as Record<string, string>)[key], `es ${key}`).toBeTruthy()
  })
})
