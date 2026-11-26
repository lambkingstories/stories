/**
 * Anton 26.11.2026: when Plus ends, what the child has painted stays to be seen, but it cannot be painted on until Plus or the book comes again.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n')
const painting = (bookPage: number) => ({ id: `src:/p${bookPage}.webp#1`, title: 'Ostern', thumb: 'data:image/png;base64,AAAA', width: 3, height: 4, bookId: 'ba-14-ostern-jesus-lebt', bookPage, kind: 'page', sourceType: 'pdf', updatedAt: 1, done: false })

describe('a picture on a locked page is only looked at', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  async function viewer(bookPage: number) {
    vi.resetModules()
    vi.stubEnv('VITE_PREMIUM_TEASER', 'true')
    const messages = (await import('@/i18n/app')).default
    const ArtworkViewer = (await import('@/components/molecules/ArtworkViewer.vue')).default
    const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
    return mount(ArtworkViewer, { global: { plugins: [i18n] }, props: { work: painting(bookPage) as never, hung: false }, attachTo: document.body })
  }

  it('shows the picture and says that going on needs unlocking', async () => {
    const w = await viewer(5)
    expect(document.body.querySelector('.av-pic')?.getAttribute('src')).toContain('data:image')
    expect(document.body.querySelector('[data-test="viewer-continue"]')?.textContent).toContain('Zum Weitermalen freischalten')
    w.unmount()
  })

  it('a free page keeps "Weitermalen"', async () => {
    const w = await viewer(1)
    expect(document.body.querySelector('[data-test="viewer-continue"]')?.textContent).not.toContain('freischalten')
    w.unmount()
  })

  it('painting does not go on without unlocking, and nothing of the picture can be thrown away', () => {
    const screen = read('src/views/app/AppColoringView.vue')
    expect(screen).toMatch(/function openWork\(meta: ArtworkMeta\) \{[\s\S]{0,200}if \(isArtworkLocked\(meta\)\) \{/)
    const book = read('src/views/app/AppColoringBookView.vue')
    expect(book).toContain('v-if="current && !pageLocked" type="button" class="bk-link"')
    // the golden veil does not hide what the child has painted
    expect(read('src/components/molecules/ColoringSpread.vue')).toContain(':faded="isLocked(rightIndex) && !layerOf(rightIndex)"')
  })
})
