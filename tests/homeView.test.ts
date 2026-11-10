/**
 * The start page, mounted and used: the three big buttons and the three "continue" cards must lead somewhere, and Vue must not
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
  it('begins with one big card that opens an adventure (playing first; the three doors only repeated the bar below)', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.findAll('.big-btn')).toHaveLength(0)
    const first = wrapper.find('.home-body > *')
    expect(first.classes()).toContain('go-hero')
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
    // the book and the picture (the adventure has the big card on top)
    expect(cards).toHaveLength(2)
    for (const c of cards) {
      push.mockClear()
      await c.trigger('click')
      expect(push).toHaveBeenCalledTimes(1)
      expect(c.classes()).toContain('is-empty')
      expect(c.text()).toMatch(/Fang hier an/)
    }
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('the card for grown-ups comes last, has two slides (the shop, then Plus or support) and none of them is a partner slide', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.findAll('.hero-slide')).toHaveLength(2)
    expect(wrapper.find('.home-body > *:last-child').classes()).toContain('hero')
    expect(wrapper.text()).not.toMatch(/Reach/i)
  })
})
