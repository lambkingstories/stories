/**
 * "Meine Ausstellungsbilder" in the painting menu: three places (1, 2, 3) for the child's own paintings, kept on the device.
 * The places can be filled, changed, swapped and emptied, and a painting that is gone leaves its place empty.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import type { ArtworkMeta } from '@/use/useArtworks'

vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const work = (id: string, updatedAt: number, done = false): ArtworkMeta => ({
  id, title: id, kind: 'page', sourceUrl: '', sourceType: '', page: 1, width: 1, height: 1, thumb: 'data:image/png;base64,AAAA', updatedAt, done
})
const WORKS = [work('a', 1, true), work('b', 3), work('c', 2, true), work('d', 4)]

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function menu(works: ArtworkMeta[] = WORKS) {
  const { default: View } = await import('@/components/molecules/ColoringMenu.vue')
  const wrapper = mount(View, {
    props: { books: [], works: [], groups: [], exhibitionWorks: works, rewards: [], backupBusy: false, backupMessage: '' },
    global: { plugins: [i18n] },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

const places = () => JSON.parse(localStorage.getItem('lk-exhibition-v1') ?? '[]') as (string | null)[]

describe('the exhibition of my pictures', () => {
  it('shows the three places, place 1 big at the top, and says "Meine Ausstellungsbilder"', async () => {
    const w = await menu()
    expect(w.find('#ac-h-exhibition').text()).toContain('Meine Ausstellungsbilder')
    expect(w.findAll('.ac-place').map((p) => p.find('.ac-place-no').text())).toEqual(['1', '2', '3'])
    expect(w.findAll('.ac-frame.is-empty')).toHaveLength(3)
    // the old row "Weitere Ausmalbilder" is gone
    expect(w.text()).not.toContain('Weitere Ausmalbilder')
  })

  it('puts a chosen painting on a place and remembers it', async () => {
    const w = await menu()
    await w.findAll('.ac-frame.is-empty')[0]!.trigger('click') // the big one: place 1
    expect(w.find('.ac-ex-window-title').text()).toContain('Platz 1')
    await w.findAll('.ac-ex-window .ac-gal-tile')[1]!.trigger('click') // painting b
    expect(w.find('.ac-ex-overlay').exists()).toBe(false)
    expect(places()).toEqual(['b', null, null])
    expect(w.find('.is-p1 .ac-frame:not(.is-empty)').exists()).toBe(true)
    expect(w.find('.ac-count').text()).toContain('1/3')
  })

  it('swaps two places when a painting that hangs already is chosen for another place', async () => {
    const w = await menu()
    await w.findAll('.ac-frame.is-empty')[0]!.trigger('click')
    await w.findAll('.ac-ex-window .ac-gal-tile')[1]!.trigger('click') // b on place 1
    await w.find('.is-p2 .ac-frame.is-empty').trigger('click')
    await w.findAll('.ac-ex-window .ac-gal-tile')[2]!.trigger('click') // c on place 2
    expect(places()).toEqual(['b', 'c', null])
    await w.find('.is-p2 .ac-mini').trigger('click') // change place 2
    await w.findAll('.ac-ex-window .ac-gal-tile')[1]!.trigger('click') // b again: moves, c takes its old place
    expect(places()).toEqual(['c', 'b', null])
  })

  it('takes a painting off a place', async () => {
    const w = await menu()
    await w.find('.is-p3 .ac-frame').trigger('click')
    await w.findAll('.ac-ex-window .ac-gal-tile')[0]!.trigger('click')
    expect(places()[2]).toBe('a')
    await w.find('.is-p3 .ac-mini--x').trigger('click')
    expect(places()[2]).toBeNull()
  })

  it('hangs the newest finished paintings with one tap', async () => {
    const w = await menu()
    await w.find('.ac-ex-fill').trigger('click')
    // finished ones first (c is newer than a), then the newest of the rest (d)
    expect(places()).toEqual(['c', 'a', 'd'])
    expect(w.find('.ac-ex-fill').exists()).toBe(false)
  })

  it('leaves a place empty when its painting is gone, and opens a hanging painting on a tap', async () => {
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['zzz', 'b', null]))
    const w = await menu()
    expect(w.find('.is-p1 .ac-frame').classes()).toContain('is-empty')
    await w.find('.is-p2 .ac-frame').trigger('click')
    expect(w.emitted('open-work')?.[0]?.[0]).toMatchObject({ id: 'b' })
  })

  it('says what to do when there is no painting yet', async () => {
    const w = await menu([])
    expect(w.find('.ac-ex-hint').text()).toContain('Male zuerst ein Bild')
    expect(w.find('.ac-ex-fill').exists()).toBe(false)
  })
})
