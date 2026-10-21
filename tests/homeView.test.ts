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
  it('shows the three big buttons and they open Paint, Read and Adventure', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const big = wrapper.findAll('.big-btn')
    expect(big.map((b) => b.text())).toEqual([
      expect.stringContaining('Malen'),
      expect.stringContaining('Lesen'),
      expect.stringContaining('Abenteuer')
    ])
    const routes = ['app-coloring', 'app-read', 'app-adventure']
    for (let i = 0; i < big.length; i++) {
      push.mockClear()
      await big[i]!.trigger('click')
      expect(push).toHaveBeenCalledWith({ name: routes[i] })
    }
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('every "continue" card is a button that leads somewhere, also when the child has done nothing yet', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const cards = wrapper.findAll('.resume-card')
    expect(cards).toHaveLength(3)
    for (const c of cards) {
      push.mockClear()
      await c.trigger('click')
      expect(push).toHaveBeenCalledTimes(1)
      expect(c.classes()).toContain('is-empty')
      expect(c.text()).toMatch(/Fang hier an/)
    }
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('the welcome iPad has four slides, the fourth one is the partnership with REACH Ministries and has a link button', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const slides = wrapper.findAll('.hero-slide')
    expect(slides).toHaveLength(4)
    expect(wrapper.text()).toContain('Willkommen')
    // the introducing line is small, the name stands alone as the title, without quotation marks
    expect(slides[3]!.find('.hero-eyebrow').text()).toBe('Wir freuen uns auf die Partnerschaft mit')
    expect(slides[3]!.find('.hero-title').text()).toBe('Reach Kids Ministries')
    expect(slides[3]!.text()).not.toMatch(/[„“”"]/)
    expect(slides[3]!.text()).toContain('Reach Kids Ministries verkündet das Evangelium und hilft Menschen durch praktische Nächstenliebe und christliche Kinderarbeit')
    expect(slides[3]!.find('button.hero-shop').exists()).toBe(true)
    expect(slides[3]!.find('img.hero-img').attributes('src')).toContain('reach-kids/wappen-slide.webp')
  })
})
