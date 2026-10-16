import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ColoringPagesEditor from '@/components/organisms/ColoringPagesEditor.vue'
import { newColoringPage } from '@/utils/coloringPages'

const de = () => [newColoringPage(1, 'a.webp', 'Licht'), newColoringPage(2, 'b.webp', 'Land')]

describe('ColoringPagesEditor', () => {
  it('lists the pages with their pictures and offers the upload for German', () => {
    const w = mount(ColoringPagesEditor, { props: { modelValue: de(), dePages: de(), locale: 'de' } })
    expect(w.findAll('.cpe-row')).toHaveLength(2)
    expect(w.find('.cpe-add').exists()).toBe(true)
    expect((w.findAll('input.cpe-in')[0]!.element as HTMLInputElement).value).toBe('Licht')
  })

  it('changes the title of a page and moves a page', async () => {
    const w = mount(ColoringPagesEditor, { props: { modelValue: de(), dePages: de(), locale: 'de' } })
    await w.findAll('input.cpe-in')[0]!.setValue('Es werde Licht')
    expect((w.emitted('update:modelValue')![0]![0] as { title: string }[])[0]!.title).toBe('Es werde Licht')
    await w.findAll('.cpe-icon')[1]!.trigger('click') // first row: down
    const moved = w.emitted('update:modelValue')![1]![0] as { title: string; page: number }[]
    expect(moved.map((p) => [p.page, p.title])).toEqual([[1, 'Land'], [2, 'Licht']])
  })

  it('tells which picture was removed', async () => {
    const w = mount(ColoringPagesEditor, { props: { modelValue: de(), dePages: de(), locale: 'de' } })
    await w.findAll('.cpe-del')[1]!.trigger('click')
    expect(w.emitted('image-removed')![0]).toEqual(['b.webp'])
    expect((w.emitted('update:modelValue')![0]![0] as unknown[]).length).toBe(1)
  })

  it('shows the German pictures for English and only the words are edited', async () => {
    const w = mount(ColoringPagesEditor, { props: { modelValue: [], dePages: de(), locale: 'en' } })
    expect(w.find('.cpe-add').exists()).toBe(false)
    expect(w.findAll('.cpe-row')).toHaveLength(2)
    expect(w.find('.cpe-actions').exists()).toBe(false)
    await w.findAll('input.cpe-in')[0]!.setValue('Light')
    expect(w.emitted('update:modelValue')![0]![0]).toEqual([{ page: 1, title: 'Light', text: '', image: 'a.webp', reference: '' }])
  })
})
