/**
 * Feedback of 21.11.2026 (a tester with the app in English): a round flag on top of each shelf chooses the language of the books (Anton: better than a flag on every cover); the end of a story has less text and no
 * operating-system emoji, its "new" sign follows the language; the bookmark shows when it is saved; the status bar does not run over the page.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')
const germanOnly = { localizations: { de: { title: 'Noah' } } }
const both = { localizations: { de: { title: 'Noah' }, en: { title: 'Noah' } } }

async function load(locale: 'de' | 'en', stored?: unknown) {
  vi.resetModules()
  localStorage.clear()
  if (stored) localStorage.setItem('lk-content-lang-v1', JSON.stringify(stored))
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never })
  const mod = await import('@/use/useContentLanguage')
  const sw = (await import('@/components/molecules/ContentLanguageSwitch.vue')).default
  return { ...mod, sw, i18n }
}

describe('the language of the content', () => {
  beforeEach(() => localStorage.clear())

  it('says in which languages a book exists and which languages a shelf has', async () => {
    const { bookIn, languagesOf } = await load('en')
    expect(bookIn(germanOnly, 'de')).toBe(true)
    expect(bookIn(germanOnly, 'en')).toBe(false)
    expect(bookIn(both, 'en')).toBe(true)
    expect(languagesOf([germanOnly])).toEqual(['de'])
    expect(languagesOf([germanOnly, both])).toEqual(['de', 'en'])
    expect(languagesOf([])).toEqual([])
  })

  it('follows the screen until a choice is made, then holds the choice (while the screen keeps its language)', async () => {
    const { default: useContentLanguage, i18n } = await load('en')
    const wrapper = mount({ template: '<div />', setup: () => useContentLanguage() }, { global: { plugins: [i18n] } })
    const api = wrapper.vm as unknown as ReturnType<typeof useContentLanguage>
    expect(api.lang).toBe('en')
    api.setLang('de')
    expect(api.lang).toBe('de')
    expect(JSON.parse(localStorage.getItem('lk-content-lang-v1') ?? '{}')).toEqual({ lang: 'de', ui: 'en' })
  })

  it('forgets the choice when the screen is in another language than at that time', async () => {
    const { default: useContentLanguage, i18n } = await load('de', { lang: 'en', ui: 'en' })
    const wrapper = mount({ template: '<div />', setup: () => useContentLanguage() }, { global: { plugins: [i18n] } })
    expect((wrapper.vm as unknown as ReturnType<typeof useContentLanguage>).lang).toBe('de')
  })

  it('a shelf without a book in the chosen language shows the first language it has', async () => {
    const { default: useContentLanguage, i18n } = await load('en')
    const wrapper = mount({ template: '<div />', setup: () => useContentLanguage() }, { global: { plugins: [i18n] } })
    const api = wrapper.vm as unknown as ReturnType<typeof useContentLanguage>
    expect(api.shelfLanguage([germanOnly])).toBe('de')
    expect(api.shelfLanguage([germanOnly, both])).toBe('en')
    expect(api.shelfLanguage([])).toBe('en')
  })
})

describe('the round flags on top of a shelf', () => {
  it('show a flag for each language of the shelf and switch the language on a tap', async () => {
    const { sw, i18n } = await load('en')
    const w = mount(sw, { props: { books: [germanOnly, both] }, global: { plugins: [i18n] } })
    const flags = w.findAll('button')
    expect(flags.map((f) => f.attributes('data-lang'))).toEqual(['de', 'en'])
    expect(flags[1]!.attributes('aria-checked')).toBe('true')
    await flags[0]!.trigger('click')
    expect(w.findAll('button')[0]!.attributes('aria-checked')).toBe('true')
    expect(JSON.parse(localStorage.getItem('lk-content-lang-v1') ?? '{}').lang).toBe('de')
  })

  it('are not drawn when the shelf has one language only', async () => {
    const { sw, i18n } = await load('en')
    expect(mount(sw, { props: { books: [germanOnly] }, global: { plugins: [i18n] } }).find('[data-test="content-language"]').exists()).toBe(false)
  })
})

describe('where the shelves have the flags and filter by language', () => {
  it.each([
    ['views/app/AppAllBooksView.vue', 'ContentLanguageSwitch(:books="storyBooks")'],
    ['views/app/AppColoringBooksView.vue', 'ContentLanguageSwitch(:books="coloringBooks")'],
    ['views/app/AppBooksView.vue', 'ContentLanguageSwitch('],
    ['views/app/AppAllNewBooksView.vue', 'ContentLanguageSwitch(:books="allBooks")']
  ])('%s', (file, line) => {
    expect(read(file)).toContain(line)
  })
  it.each(['views/app/AppAllBooksView.vue', 'views/app/AppColoringBooksView.vue', 'views/app/AppAllNewBooksView.vue', 'views/app/AppHomeView.vue', 'views/app/AppBookSeriesView.vue'])(
    '%s shows only the books of the language',
    (file) => {
      expect(read(file)).toContain('bookIn(')
    }
  )
  it('the opened book (detail, reader) is in the content language', () => {
    expect(read('views/app/AppBookDetailView.vue')).toContain('const { lang } = useContentLanguage()')
    expect(read('views/app/AppReaderView.vue')).toContain('const { lang } = useContentLanguage()')
  })
  it('there is no flag on the single covers any more', () => {
    for (const f of ['views/app/AppHomeView.vue', 'views/app/AppAllBooksView.vue', 'views/app/AppColoringBooksView.vue']) expect(read(f)).not.toContain('BookLangFlag')
  })
})

describe('the end of a story', () => {
  const s = read('views/app/AppReaderView.vue')
  it('has no operating-system emoji and no extra label over the next story', () => {
    expect(s).not.toContain('🎉')
    expect(s).not.toContain("t('app.reader.nextStoryWaiting')")
    expect(s).not.toContain("t('app.reader.askKicker')")
  })
  it('writes the sign of the next story in the language of the app', () => {
    expect(s).not.toContain('badge="NEU"')
    expect(s).toContain(":badge=\"t('app.read.newBadge')\"")
  })
  it('keeps the lamb whole (no pull into the next element)', () => {
    expect(s).not.toContain('margin: 0 auto -10px')
  })
})

describe('the bookmark and the status bar', () => {
  it('the saved bookmark looks different (class and filled icon)', () => {
    const s = read('views/app/AppBookDetailView.vue')
    expect(s).toContain("'save-btn', { 'is-saved'")
    expect(s).toContain('.save-btn.is-saved')
  })
  it('a strip in the colour of the page lies over the place of the status bar', () => {
    const s = read('App.vue')
    expect(s).toMatch(/#app-root::before[\s\S]*height: env\(safe-area-inset-top, 0px\)/)
    expect(s).toContain('pointer-events: none')
  })
})
