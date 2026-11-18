import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeHero from '@/components/molecules/HomeHero.vue'

vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<i />' } }))
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
