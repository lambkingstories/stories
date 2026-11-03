import { describe, it, expect } from 'vitest'
import { renderLegalText } from '@/utils/renderLegalText'

describe('renderLegalText', () => {
  it('turns numbered lines into section headings, not an ordered list', () => {
    const html = renderLegalText('1. Datenschutz auf einen Blick\nAllgemeine Hinweise\n\nZweiter Absatz')

    expect(html).toContain('<h3>1. Datenschutz auf einen Blick</h3>')
    expect(html).toContain('<p>Allgemeine Hinweise</p>')
    expect(html).toContain('<p>Zweiter Absatz</p>')
    expect(html).not.toContain('<ol')
  })

  it('escapes HTML and links bare URLs without opening a new window', () => {
    const html = renderLegalText('Siehe https://lambking.store/datenschutz/. <b>fett</b>')

    expect(html).toContain('<a href="https://lambking.store/datenschutz/" rel="noopener noreferrer">')
    // The trailing sentence dot stays outside the link.
    expect(html).toContain('</a>.')
    expect(html).toContain('&lt;b&gt;fett&lt;/b&gt;')
    expect(html).not.toContain('target=')
  })
})
