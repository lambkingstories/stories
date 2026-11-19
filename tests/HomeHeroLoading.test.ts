import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeHero from '@/components/molecules/HomeHero.vue'

vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<i />' } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))
vi.mock('@/components/atoms/ZIconography.vue', () => ({ default: { name: 'ZIconography', template: '<i />' } }))

describe('HomeHero · pictures', () => {
  it('only the first slide is loaded at once, the others wait until they are near (start page does not load every slide)', () => {
    const slides = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, image: `/images/bg/s${n}.webp`, title: `T${n}`, text: `x${n}` }))
    const wrapper = mount(HomeHero, { props: { slides, intervalMs: 100000 } })
    const imgs = wrapper.findAll('img.hero-img')
    expect(imgs).toHaveLength(4)
    expect(imgs.map((i) => i.attributes('loading'))).toEqual(['eager', 'lazy', 'lazy', 'lazy'])
    wrapper.unmount()
  })
})

describe('HomeHero · folding text', () => {
  const slides = [1, 2].map((n) => ({ id: `s${n}`, image: `/i${n}.webp`, title: `T${n}`, text: `Text ${n}` }))

  it('shows only the title and an arrow at first; the arrow opens the text of all slides and the choice is kept', async () => {
    localStorage.removeItem('lk-hero-open-v1')
    const wrapper = mount(HomeHero, { props: { slides, intervalMs: 100000 } })
    const more = wrapper.findAll('.hero-more')
    expect(more).toHaveLength(2)
    expect(more.every((m) => !m.classes().includes('is-open'))).toBe(true)
    const arrow = wrapper.find('button.hero-fold')
    expect(arrow.attributes('aria-expanded')).toBe('false')
    await arrow.trigger('click')
    expect(wrapper.findAll('.hero-more').every((m) => m.classes().includes('is-open'))).toBe(true)
    expect(wrapper.find('button.hero-fold').attributes('aria-expanded')).toBe('true')
    expect(localStorage.getItem('lk-hero-open-v1')).toBe('1')
    wrapper.unmount()
    const again = mount(HomeHero, { props: { slides, intervalMs: 100000 } })
    expect(again.find('.hero-more').classes()).toContain('is-open')
    again.unmount()
    localStorage.removeItem('lk-hero-open-v1')
  })

  it('tapping the title row folds too, and the buttons of a slide stay visible when the text is folded', async () => {
    localStorage.removeItem('lk-hero-open-v1')
    const wrapper = mount(HomeHero, { props: { slides, intervalMs: 100000 }, slots: { actions: '<button class="cta">Go</button>' } })
    expect(wrapper.find('.hero-actions .cta').exists()).toBe(true)
    expect(wrapper.find('.hero-actions').element.closest('.hero-more')).toBeNull()
    await wrapper.find('.hero-head').trigger('click')
    expect(wrapper.find('.hero-more').classes()).toContain('is-open')
    wrapper.unmount()
    localStorage.removeItem('lk-hero-open-v1')
  })
})
