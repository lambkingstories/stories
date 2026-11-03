import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { legalBody, renderLegalText } from '@/utils/renderLegalText'
import { CONTACT_EMAIL, CONTACT_FORM_URL, CONTACT_MAILTO } from '@/data/contact'

// The texts come from lambking.store (scripts/sync-legal.mjs) and are committed, so this test needs no internet.
const imprint = legalBody(readFileSync('src/legal/impressum-de.txt', 'utf8'))
const privacy = legalBody(readFileSync('src/legal/datenschutz-de.txt', 'utf8'))
const all = `${imprint}\n${privacy}`

describe('legal texts of the app (copy of lambking.store)', () => {
  it('the imprint has the current address and the contact form', () => {
    expect(imprint).toContain('Angaben gemäß § 5 DDG')
    expect(imprint).toContain('c/o Vera Bike')
    expect(imprint).toContain('Kontaktformular')
    expect(privacy).toContain('Kontaktformular')
  })

  it('the old statements are gone', () => {
    for (const old of ['Allmendstr', 'TMG', 'Etsy', 'Shopify', 'ec.europa.eu/consumers/odr']) expect(all).not.toContain(old)
  })

  it('the "generated" notice is not shown on the page', () => {
    expect(imprint).not.toContain('AUTOMATISCH ERZEUGT')
    expect(renderLegalText(privacy)).not.toContain('AUTOMATISCH')
  })

  it('renders the numbered sections of the privacy policy and links the contact form', () => {
    const html = renderLegalText(privacy)
    expect(html).toMatch(/<h3>1\. /)
    expect(html).toMatch(/<h3>8\. Kontaktformular/)
    expect(renderLegalText(imprint)).toContain(`<a href="${CONTACT_FORM_URL}"`)
  })

  it('the contact data is the published one', () => {
    expect(CONTACT_FORM_URL).toBe('https://lambking.store/#kontakt')
    expect(CONTACT_MAILTO).toBe(`mailto:${CONTACT_EMAIL}`)
    expect(imprint).toContain(CONTACT_EMAIL)
  })
})
