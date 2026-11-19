/**
 * "Familien-Spiele v2" (19 Nov 2026): the new design system of the family games (white cards, capsules, chips, answer tiles) and the quiz built with it.
 * Short mount tests of every piece, and a few reads of the sources (the styles are not drawn in the test window).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { withGameTexts } from '@/i18n/bigGames'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyChoice from '@/components/molecules/family/FamilyChoice.vue'
import FamilyNameField from '@/components/molecules/family/FamilyNameField.vue'
import FamilyQuestionCard from '@/components/molecules/family/FamilyQuestionCard.vue'
import FamilyResult from '@/components/molecules/family/FamilyResult.vue'
import FamilyResume from '@/components/molecules/family/FamilyResume.vue'
import FamilySeats from '@/components/molecules/family/FamilySeats.vue'
import FamilySwitch from '@/components/molecules/family/FamilySwitch.vue'
import { FAMILY_ACCENT, FAMILY_GAMES, familySymbol } from '@/components/molecules/family/familyGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const push = vi.fn()
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-quiz' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))
vi.stubGlobal('APP_VERSION', 'test')
// the window of the tests cannot scroll
Element.prototype.scrollIntoView = vi.fn()
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

const all = withGameTexts(messages as never) as { de: Record<string, any>; en: Record<string, any> }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: all.de, en: all.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }
const src = (p: string) => readFileSync(p, 'utf8').replace(/\r/g, '')

/** The questions of the Bible quiz load asynchronously: wait until the question bank is there (the "Los geht's" capsule of the players page is not disabled). */
async function loaded(w: { find: (s: string) => { exists: () => boolean; attributes: (n: string) => string | undefined } }) {
  for (let i = 0; i < 40 && w.find('.fam-lobby-go .fam-btn').attributes('disabled') !== undefined; i++) {
    await new Promise((r) => setTimeout(r, 25))
    await flushPromises()
  }
}

describe('the list of the seven games', () => {
  it('has a colour and a painted symbol for each, the same as the boxes of the page of the family games', () => {
    expect(FAMILY_GAMES).toHaveLength(7)
    const hub = src('src/views/app/AppFamilyGamesView.vue')
    for (const k of FAMILY_GAMES) {
      expect(FAMILY_ACCENT[k]).toMatch(/^#[0-9a-f]{6}$/)
      expect(hub).toContain(`--bx: ${FAMILY_ACCENT[k]}`)
      expect(familySymbol(k)).toMatch(/images\/familie\/symbole\/[a-z0-9-]+\.webp$/)
      expect(src('src/assets/css/family-v2.css')).toContain(`.fam-game--${k} { --fam-accent: ${FAMILY_ACCENT[k]}; }`)
    }
  })
})

describe('FamilyButton', () => {
  it('is a main button, gives the click on and does not when it is off', async () => {
    const onClick = vi.fn()
    const w = mount(FamilyButton, { slots: { default: 'Los geht' }, attrs: { onClick } })
    expect(w.classes()).toContain('fam-btn--primary')
    expect(w.text()).toBe('Los geht')
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    await w.setProps({ disabled: true })
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('quiet (or secondary) is the white capsule with a line', () => {
    expect(mount(FamilyButton, { props: { quiet: true } }).classes()).toContain('fam-btn--secondary')
    expect(mount(FamilyButton, { props: { kind: 'secondary' } }).classes()).toContain('fam-btn--secondary')
  })
})

describe('FamilyChip and FamilySwitch', () => {
  it('a chosen chip is marked (aria-checked and the tick), a button chip uses aria-pressed', () => {
    const off = mount(FamilyChip, { slots: { default: 'Leicht' } })
    expect(off.attributes('aria-checked')).toBe('false')
    expect(off.find('.fam-chip-tick').exists()).toBe(false)
    const on = mount(FamilyChip, { props: { selected: true, round: true }, slots: { default: '3' } })
    expect(on.attributes('aria-checked')).toBe('true')
    expect(on.classes()).toEqual(expect.arrayContaining(['is-on', 'is-round']))
    expect(on.find('.fam-chip-tick').exists()).toBe(true)
    expect(mount(FamilyChip, { props: { role: 'button', selected: true } }).attributes('aria-pressed')).toBe('true')
  })
  it('the switch flips its v-model', async () => {
    const w = mount(FamilySwitch, { props: { modelValue: false }, slots: { default: 'Teams' } })
    expect(w.attributes('role')).toBe('switch')
    await w.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
  })
})

describe('FamilyCard', () => {
  it('has a head stripe with title and symbol, or a plain card with the corner accent', () => {
    const head = mount(FamilyCard, { props: { title: 'Welche Fragen?', symbol: 'quiz' }, slots: { default: 'Inhalt' } })
    expect(head.classes()).toContain('has-head')
    expect(head.find('.fam-card-title').text()).toBe('Welche Fragen?')
    expect(head.find('.fam-card-symbol img').attributes('src')).toContain('symbole/quiz.webp')
    const plain = mount(FamilyCard, { slots: { default: 'Nur Text' } })
    expect(plain.classes()).not.toContain('has-head')
    expect(plain.find('.fam-card-head').exists()).toBe(false)
  })
  it('frames the verdict by its tone', () => {
    expect(mount(FamilyCard, { props: { tone: 'right' } }).classes()).toContain('fam-card--right')
    expect(mount(FamilyCard, { props: { tone: 'wrong' } }).classes()).toContain('fam-card--wrong')
  })
})

describe('FamilyChoice', () => {
  it('shows the letter A to D, the text, and the tick or the cross after the answer', async () => {
    const w = mount(FamilyChoice, { props: { index: 2, text: 'Eine Arche' } })
    expect(w.find('.fam-choice-letter').text()).toBe('C')
    expect(w.text()).toContain('Eine Arche')
    expect(w.classes()).toEqual(expect.arrayContaining(['fam-choice--2', 'is-idle']))
    await w.setProps({ state: 'right' })
    expect(w.find('.fam-choice-mark.is-tick').exists()).toBe(true)
    await w.setProps({ state: 'wrong' })
    expect(w.find('.fam-choice-mark.is-cross').exists()).toBe(true)
    await w.setProps({ state: 'dim' })
    expect(w.find('.fam-choice-mark').exists()).toBe(false)
  })
  it('the colours repeat after four and the click is given on', async () => {
    const w = mount(FamilyChoice, { props: { index: 5, text: 'x' } })
    expect(w.classes()).toContain('fam-choice--1')
    expect(w.find('.fam-choice-letter').text()).toBe('B')
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })
})

describe('FamilyQuestionCard, FamilyNameField, FamilyResume', () => {
  it('the question card shows the level chip, the line and the question', () => {
    const w = mount(FamilyQuestionCard, { props: { chip: 'Leicht', sub: 'Etappe 2', text: 'Was baute Noah?' } })
    expect(w.find('.fam-q-chip').text()).toBe('Leicht')
    expect(w.find('.fam-q-sub').text()).toBe('Etappe 2')
    expect(w.find('.fam-q-text').text()).toBe('Was baute Noah?')
  })
  it('the name field gives the text on, with and without a figure', async () => {
    const plain = mount(FamilyNameField, { props: { modelValue: '', placeholder: 'Spieler 1' } })
    expect(plain.find('.fam-name-token').exists()).toBe(false)
    await plain.find('input').setValue('Anna')
    expect(plain.emitted('update:modelValue')?.[0]).toEqual(['Anna'])
    const seat = mount(FamilyNameField, { props: { modelValue: 'Ben', seat: 1 } })
    await seat.find('.fam-name-token').trigger('click')
    expect(seat.emitted('token')).toHaveLength(1)
    expect(seat.find('input').element.value).toBe('Ben')
  })
  it('the resume card says where the round stands and continues', async () => {
    const w = mount(FamilyResume, { props: { info: 'Frage 3 von 10' }, ...opts })
    expect(w.text()).toContain('Frage 3 von 10')
    await w.find('button').trigger('click')
    expect(w.emitted('resume')).toHaveLength(1)
    w.unmount()
  })
})

describe('FamilySeats', () => {
  it('number chips from the minimum, a name row for every player, the change of the number is given on', async () => {
    const w = mount(FamilySeats, { props: { count: 3, names: ['A', '', ''], min: 2, max: 8 }, ...opts })
    expect(w.findAll('.fam-chip')).toHaveLength(7)
    expect(w.findAll('.fam-chip.is-on')).toHaveLength(1)
    expect(w.findAll('.fam-name')).toHaveLength(3)
    await w.findAll('.fam-chip')[4]!.trigger('click')
    expect(w.emitted('update:count')?.[0]).toEqual([6])
    await w.findAll('.fam-name-input')[1]!.setValue('Ben')
    expect(w.emitted('update:names')?.[0]).toEqual([['A', 'Ben', '']])
    w.unmount()
  })
  it('fixed: only the name row, no chips', () => {
    const w = mount(FamilySeats, { props: { count: 1, names: [''], fixed: true }, ...opts })
    expect(w.findAll('.fam-chip')).toHaveLength(0)
    expect(w.find('.fam-card-head').exists()).toBe(false)
    expect(w.findAll('.fam-name')).toHaveLength(1)
    w.unmount()
  })
})

describe('FamilyResult', () => {
  it('shows the headline, the ranking, and the buttons of the slot', () => {
    const rows = [
      { rank: 1, name: 'Anna', score: '3 Punkte', index: 0 },
      { rank: 2, name: 'Ben', score: '1 Punkt', index: 1 }
    ]
    const w = mount(FamilyResult, { props: { headline: 'Anna hat gewonnen!', rows, winnerIndex: 0 }, slots: { default: '<button class="x">Noch einmal</button>' }, ...opts })
    expect(w.find('.fam-res-head').text()).toBe('Anna hat gewonnen!')
    expect(w.find('.fam-res-crown').exists()).toBe(true)
    expect(w.findAll('.fam-res-rank li')).toHaveLength(2)
    expect(w.find('.fam-res-rank li.is-first').text()).toContain('Anna')
    expect(w.find('.x').exists()).toBe(true)
    w.unmount()
  })
  it('without a winner and without a list: only the headline', () => {
    const w = mount(FamilyResult, { props: { headline: 'Unentschieden' }, ...opts })
    expect(w.find('.fam-res-crown').exists()).toBe(false)
    expect(w.find('.fam-res-rank').exists()).toBe(false)
    w.unmount()
  })
})

describe('the quiz in the new look', () => {
  beforeEach(() => localStorage.clear())

  it('opens on the table of the game, first with the title screen, then with the players page and the new pieces', async () => {
    const { default: View } = await import('@/views/app/AppFamilyQuizView.vue')
    const w = mount(View, opts)
    await flushPromises()
    expect(w.find('.mt').classes()).toContain('fam-game--quiz')
    expect(w.find('.fam-start').exists()).toBe(true)
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
    await loaded(w)
    expect(w.find('.fam-lobby').exists()).toBe(true)
    expect(w.findAll('.fam-chip').length).toBeGreaterThan(5)
    expect(w.find('.fam-card-head').exists()).toBe(true)
    expect(w.find('.fam-lobby-go .fam-btn--primary').exists()).toBe(true)
    // the old pieces are gone
    expect(w.find('.mpa').exists()).toBe(false)
    expect(w.find('.mb').exists()).toBe(false)
    expect(w.find('.mc').exists()).toBe(false)
    w.unmount()
  })

  it('plays a round: four tiles A to D, the verdict, the end with the podium', async () => {
    const { default: View } = await import('@/views/app/AppFamilyQuizView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
    await loaded(w)
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar').exists()).toBe(true)
    expect(w.find('.fam-q-chip').exists()).toBe(true)
    let guard = 0
    while (!w.find('.fam-pod').exists() && guard++ < 30) {
      const tiles = w.findAll('.fam-choice')
      expect(tiles.length).toBeGreaterThanOrEqual(3)
      expect(tiles[0]!.find('.fam-choice-letter').text()).toBe('A')
      await tiles[0]!.trigger('click')
      expect(w.findAll('.fam-choice.is-right')).toHaveLength(1)
      expect(w.find('.fq-verdict').exists()).toBe(true)
      await w.find('.fq-reveal .fam-btn').trigger('click')
      await flushPromises()
    }
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text().length).toBeGreaterThan(3)
    w.unmount()
  })

  it('does not use the old pieces (parchment, medals, brass, seal, wreath) any more', () => {
    const view = src('src/views/app/AppFamilyQuizView.vue')
    for (const old of ['MapPaper', 'MapCoin', 'MapButton', 'MapSeats', 'MapResult', 'MapResume', 'fq-brass', 'mp-serif', 'parchment', 'papyrus']) {
      expect(view, old).not.toContain(old)
    }
    // no fixed colours that read in one theme only: the colours come from tokens
    const style = view.slice(view.indexOf('<style'))
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
  })
})

describe('the pieces keep the sizes for small fingers (at least 48 px) and the capsule', () => {
  const rule = (file: string, selector: string) => {
    const text = src(file)
    const at = text.indexOf(`\n${selector}\n`)
    expect(at, `${selector} in ${file}`).toBeGreaterThan(-1)
    return text.slice(at, text.indexOf('\n\n', at + 2))
  }
  it('main button 56 px and a capsule; chip and name field 48 px; answer tile 64 px', () => {
    expect(rule('src/components/molecules/family/FamilyButton.vue', '.fam-btn')).toMatch(/min-height: 56px/)
    expect(rule('src/components/molecules/family/FamilyButton.vue', '.fam-btn')).toMatch(/border-radius: 999px/)
    expect(rule('src/components/molecules/family/FamilyChip.vue', '.fam-chip')).toMatch(/min-height: 48px/)
    expect(rule('src/components/molecules/family/FamilyNameField.vue', '.fam-name-input')).toMatch(/min-height: 48px/)
    expect(rule('src/components/molecules/family/FamilyChoice.vue', '.fam-choice')).toMatch(/min-height: 64px/)
    expect(rule('src/components/molecules/family/FamilySwitch.vue', '.fam-switch')).toMatch(/min-height: 56px/)
  })
  it('the table: back, music and sound are 48 px round buttons', () => {
    expect(rule('src/components/molecules/map/MapTable.vue', '.mt-back, .mt-round')).toMatch(/width: 48px/)
  })
  it('the tokens of both looks exist', () => {
    const css = src('src/assets/css/family-v2.css')
    const day = css.slice(0, css.indexOf("[data-theme='night']"))
    const night = css.slice(css.indexOf("[data-theme='night']"))
    for (const n of ['--fam-primary', '--fam-line', '--fam-ok', '--fam-bad', '--fam-a-bg', '--fam-b-bg', '--fam-c-bg', '--fam-d-bg']) {
      expect(day, n).toContain(`${n}:`)
      expect(night, n).toContain(`${n}:`)
    }
    for (const n of ['--fam-gold', '--fam-on-gold', '--fam-focus', '--fam-card', '--fam-accent']) expect(day, n).toContain(`${n}:`)
  })
})
