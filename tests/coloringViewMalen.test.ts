/**
 * The painting screen (`AppColoringView`) after the overhaul of the painting area (Anton, 18.11.2026): the tool bar starts folded on a phone, a sharp thumb is
 * saved, "Picture finished" has a button of its own in the top bar, and the message after it can hang the picture in the exhibition. The screen is mounted with a
 * canvas that is only a stub (no drawing), which is enough for the buttons and the state.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import messages from '@/i18n/app'

const h = vi.hoisted(() => ({ saved: [] as Array<Record<string, unknown>> }))

vi.mock('@/use/useArtworks', async (orig) => ({
  ...(await orig<typeof import('@/use/useArtworks')>()),
  listArtworks: async () => [],
  getArtwork: async () => (h.saved.length ? { ...h.saved[h.saved.length - 1]!, drawing: new Blob(['x']) } : null),
  saveArtwork: async (meta: Record<string, unknown>) => {
    h.saved.push(meta)
  },
  getTimelapse: async () => null
}))
vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

/** An image that "loads" at once, with the size of a blank sheet (jsdom loads no pictures). */
class FakeImage {
  width = 1200
  height = 1600
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  decoding = ''
  set src(_v: string) {
    setTimeout(() => this.onload?.(), 0)
  }
  decode() {
    return Promise.resolve()
  }
}

function stubCanvas() {
  vi.stubGlobal('Image', FakeImage)
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => undefined), set: () => true })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb: BlobCallback) => cb(new Blob(['x'])))
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => 'data:image/jpeg;base64,AAAA')
}

async function mountView(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  vi.resetModules()
  const { default: View } = await import('@/views/app/AppColoringView.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['app-coloring', 'app-coloring-books', 'app-coloring-book', 'app-home', 'app-adventure-map', 'app-adventure-stage', 'app-adventure-stats', 'app-family-activity', 'app-awards', 'app-journal', 'app-plus'].map((name) => ({ path: '/' + name + '/:x?', name, component: { template: '<i />' } }))
  })
  await router.push({ name: 'app-coloring' })
  const wrapper = mount(View, { global: { plugins: [i18n, router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  h.saved.length = 0
  stubCanvas()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the painting screen', () => {
  it('shows the main menu first, with "Dein erstes Bild" (and no top bar of a picture)', async () => {
    const w = await mountView(390)
    expect(w.find('[data-test="first-card"]').exists()).toBe(true)
    expect(w.find('.ac-top').exists()).toBe(false)
    w.unmount()
  })

  it('has no blank-sheet tiles (portrait / landscape) in the menu: only "Jetzt malen" (and "own picture")', async () => {
    const w = await mountView(390)
    expect(w.text()).not.toContain('Hochformat')
    expect(w.text()).not.toContain('Querformat')
    expect(w.findAll('.ac-tile')).toHaveLength(1)
    w.unmount()
  })

  it('the back button of the phone from a sheet leads back to the menu of the painting program (the sheet has a step of its own in the history)', async () => {
    const w = await mountView(390)
    const router = (w.vm as unknown as { $router: import('vue-router').Router }).$router
    await w.find('[data-test="first-go"]').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    await flushPromises()
    expect(w.find('.ac-top').exists()).toBe(true)
    expect(router.currentRoute.value.query.e).toBe('1')

    router.back() // the phone's back button
    await new Promise((r) => setTimeout(r, 30))
    await flushPromises()
    expect(router.currentRoute.value.query.e).toBeUndefined()
    expect(router.currentRoute.value.name).toBe('app-coloring')
    expect(w.find('.ac-top').exists()).toBe(false)
    expect(w.find('[data-test="first-card"], [data-test="continue-go"]').exists()).toBe(true)
    w.unmount()
  })

  it('starts the tool bar folded on a phone and out on a tablet, when a picture is opened', async () => {
    for (const [width, folded] of [[390, true], [768, false]] as const) {
      const w = await mountView(width)
      await w.find('[data-test="first-go"]').trigger('click')
      await new Promise((r) => setTimeout(r, 30))
      await flushPromises()
      await nextTick()
      const bar = w.find('.tb')
      expect(bar.exists()).toBe(true)
      expect(bar.classes().includes('collapsed')).toBe(folded)
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('has a visible "Bild fertig" button in the top bar of a free sheet', async () => {
    const w = await mountView(390)
    await w.find('[data-test="first-go"]').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    await flushPromises()
    const btn = w.find('[data-test="finish-top"]')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBe('Bild fertig')
    w.unmount()
  })

  it('saves a sharp thumb, and the message after "Bild fertig" can hang the picture in the exhibition', async () => {
    const w = await mountView(390)
    await w.find('[data-test="first-go"]').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    await flushPromises()
    await w.find('[data-test="finish-top"]').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    await flushPromises()
    // the picture was saved, with a thumb (a data URL) and as finished
    expect(h.saved.length).toBeGreaterThan(0)
    expect(String(h.saved[0]!.thumb)).toContain('data:image/jpeg')
    expect(h.saved[h.saved.length - 1]!.done).toBe(true)
    // the message, with the button
    expect(w.find('.ac-finish').exists()).toBe(true)
    await w.find('[data-test="finish-hang"]').trigger('click')
    const places = JSON.parse(localStorage.getItem('lk-exhibition-v1') ?? '[]') as (string | null)[]
    expect(places[0]).toMatch(/^blank:/)
    expect(w.find('[data-test="finish-hung"]').exists()).toBe(true)
    expect(w.find('[data-test="finish-hang"]').exists()).toBe(false)
    w.unmount()
  })
})
