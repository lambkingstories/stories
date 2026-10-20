/**
 * The small parts that every stage uses, mounted on their own (before they were only tested through the pages): the questions, the stars, the sound
 * window and the end of a game. And the rule that every part that moves also has a calm version for children who switch motion off.
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: (n: string) => played.push(n), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  localStorage.clear()
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))

describe('AdventureQuiz', () => {
  const questions = [
    { q: 'Wie viele?', options: ['zwei', 'drei', 'vier'], answer: 0 },
    { q: 'Wer?', options: ['Josef', 'Ruben', 'Juda'], answer: 0 }
  ]
  const mountQuiz = async () => {
    const { default: Quiz } = await import('@/components/molecules/AdventureQuiz.vue')
    return mount(Quiz, { ...opts, props: { questions } })
  }
  const option = (w: ReturnType<typeof mount>, text: string) => w.findAll('.quiz-option').find((o) => o.find('.quiz-text').text() === text)!

  it('shows one question at a time with its three answers and the count, and no main button before an answer', async () => {
    const w = await mountQuiz()
    expect(w.find('.quiz-count').text()).toContain('1 von 2')
    expect(w.find('.quiz-q').text()).toBe('Wie viele?')
    expect(w.findAll('.quiz-option').map((o) => o.text()).sort()).toEqual(['drei', 'vier', 'zwei'])
    expect(w.find('.quiz-next button').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a right answer is ticked (green) with a sound, a wrong one crossed (red); the right one then shows, too; no words in the boxes', async () => {
    const w = await mountQuiz()
    await option(w, 'drei').trigger('click')
    expect(option(w, 'drei').classes()).toContain('wrong')
    expect(option(w, 'drei').find('.quiz-x').text()).toBe('✕')
    expect(option(w, 'zwei').classes()).toContain('right')
    expect(option(w, 'zwei').find('svg, .z-icon, [class*="icon"]').exists()).toBe(true)
    expect(played).toEqual(['wrong'])
    // the boxes hold only the answer and the cross (no words, no chips)
    expect(option(w, 'drei').text()).toBe('✕drei')
    expect(option(w, 'zwei').text()).not.toMatch(/Richtig|Fast|richtig|falsch/)
    // a second tap changes nothing
    await option(w, 'zwei').trigger('click')
    expect(played).toEqual(['wrong'])
  })

  it('the main button sits in the middle under the answers; it goes on to the next question and ends with "Fertig" and the number of right answers', async () => {
    const w = await mountQuiz()
    await option(w, 'zwei').trigger('click')
    expect(played).toEqual(['right'])
    const next = w.find('.quiz-next button')
    expect(next.text()).toBe('Weiter')
    // the box around the button centres it (the flex rule is in the style; the button is the only child)
    expect(w.find('.quiz-next').element.children.length).toBe(1)
    await next.trigger('click')
    expect(w.find('.quiz-count').text()).toContain('2 von 2')
    expect(w.find('.quiz-option.right').exists()).toBe(false)
    await option(w, 'Ruben').trigger('click')
    expect(w.find('.quiz-next button').text()).toBe('Fertig')
    await w.find('.quiz-next button').trigger('click')
    expect(w.emitted('done')).toEqual([[1]])
  })

  it('the answers come in a different order for every question; the right one is not always first', async () => {
    const seen = new Set<string>()
    for (let i = 0; i < 25; i++) {
      const w = await mountQuiz()
      seen.add(w.findAll('.quiz-option')[0]!.text())
      w.unmount()
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })

  it('a screen reader hears whether the picked answer was right', async () => {
    const w = await mountQuiz()
    await option(w, 'vier').trigger('click')
    expect(option(w, 'vier').attributes('aria-label')).toContain('falsch')
    expect(option(w, 'zwei').attributes('aria-label')).toContain('richtig')
    expect(option(w, 'drei').attributes('aria-label')).toBeUndefined()
  })
})

describe('AdventureStars', () => {
  const mountStars = async (props: { stars: number; celebrate?: boolean; size?: number }) => {
    const { default: Stars } = await import('@/components/molecules/AdventureStars.vue')
    return mount(Stars, { ...opts, props })
  }

  it.each([0, 1, 2, 3])('%s earned stars: that many shine, the others are switched off; the label says how many of three', async (n) => {
    const w = await mountStars({ stars: n })
    expect(w.attributes('aria-label')).toBe(`${n} / 3`)
    const imgs = w.findAll('img.star')
    expect(imgs).toHaveLength(3)
    expect(imgs.filter((i) => i.classes().includes('lit'))).toHaveLength(n)
    expect(imgs.filter((i) => i.attributes('src')!.includes('stern-gold'))).toHaveLength(n)
  })

  it('celebrating: a sound for every earned star one after the other, and three stars end with the fanfare; no sound without celebrate or without stars', async () => {
    const w = await mountStars({ stars: 3, celebrate: true })
    expect(played).toEqual([])
    await vi.advanceTimersByTimeAsync(260)
    expect(played).toEqual(['star'])
    await vi.advanceTimersByTimeAsync(400)
    expect(played).toEqual(['star', 'star'])
    await vi.advanceTimersByTimeAsync(400)
    expect(played).toEqual(['star', 'star', 'star'])
    await vi.advanceTimersByTimeAsync(800)
    expect(played).toEqual(['star', 'star', 'star', 'fanfare'])
    w.unmount()
    played.length = 0
    const two = await mountStars({ stars: 2, celebrate: true })
    await vi.advanceTimersByTimeAsync(3000)
    expect(played).toEqual(['star', 'star'])
    two.unmount()
    played.length = 0
    await mountStars({ stars: 3 })
    await mountStars({ stars: 0, celebrate: true })
    await vi.advanceTimersByTimeAsync(3000)
    expect(played).toEqual([])
  })

  it('the sparks: a few for one star, more for two, the most for three', async () => {
    const count = async (n: number) => (await mountStars({ stars: n, celebrate: true })).findAll('.spark').length
    const one = await count(1)
    const two = await count(2)
    const three = await count(3)
    // per earned star: 3, 5 and 8 sparks
    expect([one, two, three]).toEqual([3, 10, 24])
  })

  it('leaving the page stops the sounds that are still to come', async () => {
    const w = await mountStars({ stars: 3, celebrate: true })
    w.unmount()
    await vi.advanceTimersByTimeAsync(3000)
    expect(played).toEqual([])
  })
})

describe('SoundPanel', () => {
  const mountPanel = async () => {
    const { default: Panel } = await import('@/components/molecules/SoundPanel.vue')
    return mount(Panel, opts)
  }

  it('the speaker button opens a window with three sliders (music, sounds, voice) and closes it again', async () => {
    const w = await mountPanel()
    expect(w.find('.sp-pop').exists()).toBe(false)
    const btn = w.find('.sp-btn')
    expect(btn.attributes('aria-expanded')).toBe('false')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    const sliders = w.findAll('input[type="range"]')
    expect(sliders).toHaveLength(3)
    await btn.trigger('click')
    expect(w.find('.sp-pop').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the sliders change the volumes and the device remembers them; all the way to the left shows "aus"; the sound slider plays one sound when it is let go', async () => {
    const w = await mountPanel()
    await w.find('.sp-btn').trigger('click')
    const [music, sfx] = w.findAll('input[type="range"]') as [ReturnType<typeof w.find>, ReturnType<typeof w.find>]
    await music.setValue('0')
    expect(localStorage.getItem('lk-music-volume')).toBe('0')
    expect(w.findAll('.sp-val')[0]!.text()).toBe('aus')
    await sfx.setValue('50')
    expect(localStorage.getItem('lk-sfx-volume')).toBe('0.5')
    expect(w.findAll('.sp-val')[1]!.text()).toBe('50 %')
    await sfx.trigger('change')
    expect(played).toContain('tap')
    const voice = w.findAll('input[type="range"]')[2]!
    await voice.setValue('40')
    expect(localStorage.getItem('lk-voice-volume')).toBe('0.4')
    expect(w.findAll('.sp-val')[2]!.text()).toBe('40 %')
  })

  it('with everything off the button shows the speaker that is off; Escape and a tap outside close the window', async () => {
    const w = await mountPanel()
    await w.find('.sp-btn').trigger('click')
    const [music, sfx, voice] = w.findAll('input[type="range"]') as [ReturnType<typeof w.find>, ReturnType<typeof w.find>, ReturnType<typeof w.find>]
    await music.setValue('0')
    await sfx.setValue('0')
    await voice.setValue('0')
    expect(w.find('.sp-btn img').attributes('src')).toContain('ton-aus')
    await sfx.setValue('100')
    expect(w.find('.sp-btn img').attributes('src')).toContain('ton-an')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(w.find('.sp-pop').exists()).toBe(false)
    await w.find('.sp-btn').trigger('click')
    expect(w.find('.sp-pop').exists()).toBe(true)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(w.find('.sp-pop').exists()).toBe(false)
  })
})

describe('GameDone', () => {
  it('shows the stars, the line and one button "Weiter" that hands the stars on; it tells the stage that the game is over', async () => {
    const { default: GameDone } = await import('@/components/molecules/games/GameDone.vue')
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    const progress = useTaskProgress()
    progress.reset()
    expect(progress.finished.value).toBe(false)
    const w = mount(GameDone, { ...opts, props: { stars: 2, text: 'Geschafft!' } })
    expect(w.find('.gd-text').text()).toBe('Geschafft!')
    expect(w.find('[aria-label="2 / 3"]').exists()).toBe(true)
    expect(progress.finished.value).toBe(true)
    expect(w.findAll('button')).toHaveLength(1)
    await w.find('button').trigger('click')
    expect(w.emitted('next')).toHaveLength(1)
    progress.reset()
    expect(progress.finished.value).toBe(false)
    expect(problems()).toEqual([])
  })

  it('without a line only the stars and the button', async () => {
    const { default: GameDone } = await import('@/components/molecules/games/GameDone.vue')
    const w = mount(GameDone, { ...opts, props: { stars: 1 } })
    expect(w.find('.gd-text').exists()).toBe(false)
    expect(w.findAll('button')).toHaveLength(1)
  })
})

describe('motion: everything that moves has a calm version (prefers-reduced-motion)', () => {
  const files = [
    'src/views/app/AppAdventureHomeView.vue',
    'src/views/app/AppAdventureView.vue',
    'src/views/app/AppAdventureStageView.vue',
    'src/components/atoms/AdvButton.vue',
    'src/components/atoms/GameMark.vue',
    'src/components/molecules/AdventureQuiz.vue',
    'src/components/molecules/AdventureOverview.vue',
    'src/components/molecules/AdventureStars.vue',
    'src/components/molecules/AdventureCount.vue',
    'src/components/molecules/SoundPanel.vue',
    'src/components/molecules/games/GameDone.vue',
    'src/components/molecules/games/GamePuzzle.vue',
    'src/components/molecules/games/GameWay.vue',
    'src/components/molecules/games/GameHarvest.vue',
    'src/components/molecules/games/GameMemory.vue',
    'src/components/molecules/games/GameSort.vue',
    'src/components/molecules/games/GameFind.vue',
    'src/components/molecules/games/GameShare.vue',
    'src/components/molecules/games/GameBuild.vue',
    'src/components/molecules/games/GameStones.vue',
    'src/components/molecules/games/GameDots.vue',
    'src/components/molecules/games/GameFly.vue'
  ]

  it.each(files)('%s: when it animates or slides something, it has a block for prefers-reduced-motion', (file) => {
    const src = readFileSync(file, 'utf-8')
    const style = src.slice(src.indexOf('<style'))
    // a transition or an animation in the style (not only the word in a comment)
    const moves = /^\s*(animation|transition)\s*:/m.test(style)
    if (moves) expect(style, file).toContain('prefers-reduced-motion')
  })
})
