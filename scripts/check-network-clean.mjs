// Prüft einen fertigen Build: Die App darf nichts von fremden Servern laden (Schriften, Bilder, Skripte, Zeichentabellen).
// Aufruf:  node scripts/check-network-clean.mjs [dist-ordner]   (Standard: dist)
// Erlaubt bleibt nur unser Server (lbs-be.onrender.com) und reine Link-Ziele, die erst nach einem Tipp im Eltern-Gate geöffnet werden.
// Die Quellen prüft zusätzlich tests/networkClean.test.ts (jede Adresse in src/ muss auf einer Liste stehen).
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const dir = path.resolve(process.argv[2] || 'dist')
const textExt = new Set(['.css', '.html', '.js', '.mjs', '.json', '.svg', '.txt', '.webmanifest', '.xml'])

// Bekannte Ladequellen, die in dieser App nie vorkommen dürfen.
const forbidden = [
  ['jsDelivr', /\bcdn\.jsdelivr\.net\b/i],
  ['unpkg', /\bunpkg\.com\b/i],
  ['cdnjs', /\bcdnjs\.cloudflare\.com\b/i],
  ['Google Fonts', /\bfonts\.(googleapis|gstatic)\.com\b/i],
  ['Ko-fi-Bilder', /\bstorage\.ko-fi\.com\b/i],
  ['Google Analytics/Tag Manager', /\b(google-analytics|googletagmanager)\.com\b/i],
  ['Facebook/Meta', /\b(connect\.facebook\.net|facebook\.com\/tr)\b/i],
  ['Sentry', /\bsentry\.io\b/i]
]

async function files(d) {
  const out = []
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) out.push(...(await files(p)))
    else if (textExt.has(path.extname(e.name).toLowerCase())) out.push(p)
  }
  return out
}

const hits = []
for (const f of await files(dir)) {
  const text = await readFile(f, 'utf8')
  for (const [label, re] of forbidden) if (re.test(text)) hits.push(`${label}: ${path.relative(process.cwd(), f)}`)
}
if (hits.length) {
  console.error('Fremde Ladequellen im Build gefunden:')
  for (const h of hits) console.error(' - ' + h)
  process.exit(1)
}
console.log('Netzwerk-Reinheit geprüft: keine fremden Ladequellen im Build. ✓')
