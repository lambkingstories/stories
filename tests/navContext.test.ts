/**
 * Which tab of the bottom bar is lit (Anton 22.11.2026): the bar follows the way the child went, not the page it is on. A page opened from "Start" keeps "Start" lit; "Malen" is lit
 * only when the painting screen is entered; going back lights what was lit before; a tap on a tab lights it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { goBackToOrigin } from '@/utils/navBack'
import { OWN_TAB, contextNav, decideNav, resetNavTracking, trackNav, type AppNavId } from '@/use/useAppNav'

const page = { template: '<div />' }
const names = [
  'app-main', 'app-read', 'app-books', 'app-coloring-books', 'app-all-books', 'app-all-new-books', 'app-series', 'app-book', 'app-reader', 'app-goodnight', 'app-family', 'app-family-quiz',
  'app-gameroom', 'app-big-game', 'app-collection', 'app-coloring', 'app-coloring-book', 'app-adventure', 'app-adventure-map', 'app-adventure-stage', 'app-profile', 'app-plus', 'app-journal'
]

async function start(first = '/app') {
  resetNavTracking()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: names.map((name) => ({ name, path: name === 'app-main' ? '/app' : `/${name}/:id?`, component: page }))
  })
  trackNav(router)
  await router.push(first)
  await router.isReady()
  return router
}
const lit = (): AppNavId | null => contextNav.value
const go = async (router: Awaited<ReturnType<typeof start>>, name: string, query?: Record<string, string>) => {
  await router.push({ name, params: { id: 'x' }, query })
}

beforeEach(() => resetNavTracking())
afterEach(() => resetNavTracking())

describe('the rule for one step', () => {
  it('a place that belongs to a tab lights it', () => {
    expect(decideNav('app-coloring', {}, 'series', null)).toBe('malen')
    expect(decideNav('app-main', {}, 'profile', null)).toBe('home')
    expect(decideNav('app-adventure-map', {}, 'home', null)).toBe('abenteuer')
  })
  it('any other page keeps the tab of the page it was opened from', () => {
    expect(decideNav('app-book', {}, 'home', null)).toBe('home')
    expect(decideNav('app-coloring-book', {}, 'series', null)).toBe('series')
    expect(decideNav('app-big-game', {}, 'profile', null)).toBe('profile')
  })
  it('the list of an area that a new book asked for (?book=) is "Lesen", from wherever the child comes', () => {
    for (const name of ['app-coloring-books', 'app-books', 'app-all-books']) {
      expect(decideNav(name, { book: 'x' }, 'home', null)).toBe('series')
      expect(decideNav(name, { book: 'x' }, 'malen', null)).toBe('series')
      // without the book it keeps the tab of the page it was opened from
      expect(decideNav(name, {}, 'home', null)).toBe('home')
    }
  })
  it('going back lights what was lit on that page before', () => {
    expect(decideNav('app-book', {}, 'malen', 'home')).toBe('home')
  })
  it('a page that is opened directly has the tab of its kind', () => {
    expect(decideNav('app-book', {}, null, null)).toBe('series')
    expect(decideNav('app-coloring-books', {}, null, null)).toBe('malen')
    expect(decideNav('app-coloring-books', { from: 'read' }, null, null)).toBe('series')
    expect(decideNav('app-family-quiz', {}, null, null)).toBe('abenteuer')
  })
  it('every place that belongs to a tab is one of the five', () => {
    for (const nav of Object.values(OWN_TAB)) expect(['home', 'series', 'abenteuer', 'malen', 'profile']).toContain(nav)
  })
})

describe('the ways through the app', () => {
  it('Start → a new book → "to the book" (the reading mode) → "paint": Start stays lit until the painting screen; back lights Start again', async () => {
    const r = await start('/app')
    expect(lit()).toBe('home')
    await go(r, 'app-book')
    expect(lit()).toBe('home')
    await go(r, 'app-coloring-book', { read: '1' })
    expect(lit()).toBe('home')
    await go(r, 'app-coloring')
    expect(lit()).toBe('malen')
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('home')
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('home')
  })

  it('Start → a new book (the list of its area) → a book of it: Lesen is lit from the list on; back lights Start', async () => {
    const r = await start('/app')
    await go(r, 'app-coloring-books', { book: 'ba-14' })
    expect(lit()).toBe('series')
    await go(r, 'app-coloring-book')
    expect(lit()).toBe('series')
    r.back()
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('home')
  })

  it('Lesen → coloring books → a book → paint: Lesen stays lit until the painting screen', async () => {
    const r = await start('/app')
    await go(r, 'app-read')
    expect(lit()).toBe('series')
    await go(r, 'app-coloring-books')
    expect(lit()).toBe('series')
    await go(r, 'app-coloring-book')
    expect(lit()).toBe('series')
    await go(r, 'app-coloring')
    expect(lit()).toBe('malen')
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('series')
  })

  it('Malen → the list of coloring books → a book: Malen stays lit', async () => {
    const r = await start('/app')
    await go(r, 'app-coloring')
    await go(r, 'app-coloring-books', { from: 'shelf' })
    expect(lit()).toBe('malen')
    await go(r, 'app-coloring-book')
    expect(lit()).toBe('malen')
  })

  it('Ich → my games → a big game: Ich stays lit', async () => {
    const r = await start('/app')
    await go(r, 'app-profile')
    await go(r, 'app-gameroom')
    expect(lit()).toBe('profile')
    await go(r, 'app-big-game')
    expect(lit()).toBe('profile')
  })

  it('Start → the family games → a quiz: Start stays lit', async () => {
    const r = await start('/app')
    await go(r, 'app-family')
    await go(r, 'app-family-quiz')
    expect(lit()).toBe('home')
  })

  it('Start → the adventure map lights Abenteuer; back lights Start', async () => {
    const r = await start('/app')
    await go(r, 'app-adventure-map')
    expect(lit()).toBe('abenteuer')
    await go(r, 'app-adventure-stage')
    expect(lit()).toBe('abenteuer')
    r.back()
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('home')
  })

  it('a tap on a tab lights it, also from inside a page, and back lights what was lit there', async () => {
    const r = await start('/app')
    await go(r, 'app-book')
    expect(lit()).toBe('home')
    await go(r, 'app-read')
    expect(lit()).toBe('series')
    r.back()
    await new Promise((x) => setTimeout(x, 10))
    expect(lit()).toBe('home')
  })

  it('the same page reached from two places has two tabs, one for each way', async () => {
    const r = await start('/app')
    await go(r, 'app-book')
    expect(lit()).toBe('home')
    await go(r, 'app-read')
    await go(r, 'app-all-books')
    await r.push({ name: 'app-book', params: { id: 'y' } })
    expect(lit()).toBe('series')
  })

  it('a sign in the address (arranging, reading) changes nothing', async () => {
    const r = await start('/app')
    await go(r, 'app-book')
    await r.replace({ name: 'app-book', params: { id: 'x' }, query: { read: '1' } })
    expect(lit()).toBe('home')
  })

  it('a page opened directly (a link, a reload) has the tab of its kind', async () => {
    const r = await start('/app-book/xyz')
    expect(lit()).toBe('series')
    await go(r, 'app-coloring')
    expect(lit()).toBe('malen')
  })
})

describe('"back" leads to where the child came from', () => {
  const stateOf = (back: string | null) => Object.defineProperty(window.history, 'state', { value: back === null ? null : { back }, configurable: true })
  const fakeRouter = () => ({ back: vi.fn(), replace: vi.fn() })

  it('one real step back when there is a page before', () => {
    stateOf('/app')
    const r = fakeRouter()
    goBackToOrigin(r as never, { name: 'app-read' })
    expect(r.back).toHaveBeenCalledTimes(1)
    expect(r.replace).not.toHaveBeenCalled()
  })

  it('the fallback place takes the page when it was the first one', () => {
    stateOf(null)
    const r = fakeRouter()
    goBackToOrigin(r as never, { name: 'app-read' })
    expect(r.replace).toHaveBeenCalledWith({ name: 'app-read' })
    expect(r.back).not.toHaveBeenCalled()
  })

  it.each([
    'AppColoringBooksView', 'AppColoringBookView', 'AppFamilyQuizView', 'AppFamilyActivityView', 'AppFamilyBingoView', 'AppFamilyMemoryView', 'AppFamilyOrderView', 'AppFamilyWhoView',
    'AppFamilyWortreiseView', 'AppFamilyGamesView'
  ])('%s goes back to the origin', (view) => {
    const src = readFileSync(resolve(process.cwd(), `src/views/app/${view}.vue`), 'utf8')
    expect(src).toContain('goBackToOrigin(router')
    expect(src).not.toContain('goBackTo(router')
  })
})
