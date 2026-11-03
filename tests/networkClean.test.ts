import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The privacy policy says the app only talks to our own server. So every web address in the source must be on one of two lists:
 * our server, or a pure link target (opened in the system browser behind the parental gate, never loaded by the app itself).
 * A new host fails this test on purpose: it has to be added here, with a reason, and to the privacy policy if data goes there.
 */
const OWN_SERVER = ['lbs-be.onrender.com']
const LINK_TARGETS = [
  'lambking.store',
  'ko-fi.com',
  'www.paypal.com',
  'www.amazon.de',
  'www.amazon.com',
  'www.apple.com',
  'apps.apple.com',
  'play.google.com'
]
// only for local tests and the app's own webview address, never reached from outside
const LOCAL = ['localhost', 'tauri.localhost']
const NAMESPACES = ['www.w3.org'] // xml namespaces are names, not requests

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p))
    else if (/\.(vue|ts|js|html)$/.test(name)) out.push(p)
  }
  return out
}

describe('network purity', () => {
  it('every host in src/ and index.html is our server or a pure link target', () => {
    const allowed = new Set([...OWN_SERVER, ...LINK_TARGETS, ...LOCAL, ...NAMESPACES])
    const found = new Map<string, string>()
    for (const file of [...sourceFiles('src'), 'index.html']) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) {
        const host = (m[1] ?? '').replace(/\.+$/, '').toLowerCase()
        if (host && !allowed.has(host)) found.set(host, file)
      }
    }
    expect([...found].map(([host, file]) => `${host} (${file})`)).toEqual([])
  })

  it('pdf.js character tables and the Ko-fi cup are our own files, not loaded from outside', () => {
    expect(readFileSync('src/views/app/AppColoringView.vue', 'utf8')).not.toMatch(/jsdelivr/i)
    expect(readFileSync('src/components/molecules/KoFiButton.vue', 'utf8')).not.toMatch(/storage\.ko-fi\.com/i)
    expect(statSync('public/pdfjs/cmaps/Adobe-Japan1-UCS2.bcmap').size).toBeGreaterThan(1000)
    expect(statSync('public/images/icons/ui/kofi.webp').size).toBeGreaterThan(1000)
  })
})
