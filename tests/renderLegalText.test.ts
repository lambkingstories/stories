import { describe, it, expect } from 'vitest'
import { renderLegalText } from '@/utils/renderLegalText'
import privacyText from '../website/src/documentation/privacy-policy-de.md?raw'

describe('renderLegalText', () => {
  it('turns numbered lines into section headings, not an ordered list', () => {
    const html = renderLegalText('1. Datenschutz auf einen Blick\nAllgemeine Hinweise\n\nZweiter Absatz')

    expect(html).toContain('<h3>1. Datenschutz auf einen Blick</h3>')
    expect(html).toContain('<p>Allgemeine Hinweise</p>')
    expect(html).toContain('<p>Zweiter Absatz</p>')
    expect(html).not.toContain('<ol')
  })

  it('escapes HTML and links bare URLs without opening a new window', () => {
    const html = renderLegalText('Siehe https://www.etsy.com/de/legal/privacy/. <b>fett</b>')

    expect(html).toContain('<a href="https://www.etsy.com/de/legal/privacy/" rel="noopener noreferrer">')
    // The trailing sentence dot stays outside the link.
    expect(html).toContain('</a>.')
    expect(html).toContain('&lt;b&gt;fett&lt;/b&gt;')
    expect(html).not.toContain('target=')
  })

  it('renders every numbered section of the shipped privacy policy', () => {
    const html = renderLegalText(privacyText)

    for (let n = 1; n <= 7; n++) expect(html).toMatch(new RegExp(`<h3>${n}\\. `))
    // App Review 5.1.1(i): the retention of the usage count must be stated.
    expect(html).toContain('nach 13 Monaten automatisch gelöscht')
  })
})
