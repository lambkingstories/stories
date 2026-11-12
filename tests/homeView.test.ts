/**
 * The start page, mounted and used: the slides come first, then the four big cards (adventure, reading, painting, games) that must lead somewhere, and Vue must not
 * complain that the template uses something the script does not have (Pug templates are not checked by the type checker).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-main' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

let warnings: string[] = []
beforeEach(() => {
  warnings = []
  push.mockClear()
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the start page', () => {
  it('begins with the slides, then the adventure card that opens an adventure (playing first)', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.findAll('.big-btn')).toHaveLength(0)
    expect(wrapper.find('.home-body > *').classes()).toContain('hero')
    const first = wrapper.findAll('.resume-card')[0]!
    expect(first.text()).toMatch(/Fang hier an/)
    push.mockClear()
    await first.trigger('click')
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ name: 'app-adventure-map' }))
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('every "continue" card is a button that leads somewhere, also when the child has done nothing yet', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const cards = wrapper.findAll('.resume-card')
    // the adventure, the book, the picture and the games
    expect(cards).toHaveLength(4)
    for (const c of cards) {
      push.mockClear()
      await c.trigger('click')
      expect(push).toHaveBeenCalledTimes(1)
    }
    for (const c of cards.slice(0, 3)) {
      expect(c.classes()).toContain('is-empty')
      expect(c.text()).toMatch(/Fang hier an/)
    }
    // the games: the bonus games, the way leads to the game room
    push.mockClear()
    await cards[3]!.trigger('click')
    expect(cards[3]!.text()).toMatch(/Spiele/)
    expect(push).toHaveBeenCalledWith({ name: 'app-gameroom' })
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('the slides for grown-ups come first, show the shop (and Plus in a build with Plus), asks for no gifts and has no partner slide', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    // the welcome (a short greeting) and the shop
    expect(wrapper.findAll('.hero-slide')).toHaveLength(2)
    expect(wrapper.find('.hero-slide').text()).toContain('Willkommen bei LambKing')
    expect(wrapper.html()).not.toMatch(/paypal|ko-?fi/i)
    expect(wrapper.find('.home-body > *:first-child').classes()).toContain('hero')
    expect(wrapper.text()).not.toMatch(/Reach/i)
  })
})
