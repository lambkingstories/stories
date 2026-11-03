// Holt Impressum und Datenschutzerklärung vom veröffentlichten Stand von lambking.store und schreibt sie nach src/legal/.
// Quelle ist das öffentliche Repo der Landingpage (Felder site.impressum und site.datenschutz in src/data/books.json).
// Aufruf:  node scripts/sync-legal.mjs   (danach die zwei erzeugten Dateien committen; der Build selbst braucht kein Internet)
// Die Texte werden nie von Hand geändert: geändert wird nur auf lambking.store, danach läuft dieses Skript erneut.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE = 'https://raw.githubusercontent.com/antonb84-cpu/lambking-landingpage/main/src/data/books.json'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'legal')

const res = await fetch(SOURCE, { signal: AbortSignal.timeout(30_000) })
if (!res.ok) throw new Error(`Quelle nicht erreichbar: HTTP ${res.status}`)
const site = (await res.json()).site
for (const key of ['impressum', 'datenschutz']) {
  if (typeof site?.[key] !== 'string' || site[key].trim().length < 100) throw new Error(`site.${key} fehlt oder ist zu kurz`)
}

// Zeilen mit "// " am Anfang sind der Hinweis für Menschen; die App blendet sie aus (utils/renderLegalText.ts, legalBody).
const header = (name) =>
  `// AUTOMATISCH ERZEUGT, NICHT VON HAND ÄNDERN.\n// Quelle: Repo antonb84-cpu/lambking-landingpage, src/data/books.json (site.${name}), erzeugt von scripts/sync-legal.mjs.\n// Geändert wird nur auf lambking.store; danach "node scripts/sync-legal.mjs" erneut laufen lassen.\n\n`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'impressum-de.txt'), header('impressum') + site.impressum.replace(/\r\n/g, '\n').trim() + '\n')
writeFileSync(join(OUT, 'datenschutz-de.txt'), header('datenschutz') + site.datenschutz.replace(/\r\n/g, '\n').trim() + '\n')
// Die alte Website in website/ zeigt dieselben Texte (Modale), damit dort nichts Veraltetes stehen bleibt (ohne Kopfzeilen).
const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', 'website', 'src', 'documentation')
writeFileSync(join(WEB, 'imprint.md'), site.impressum.replace(/\r\n/g, '\n').trim() + '\n')
writeFileSync(join(WEB, 'privacy-policy-de.md'), site.datenschutz.replace(/\r\n/g, '\n').trim() + '\n')
console.log(`Geschrieben: src/legal/impressum-de.txt (${site.impressum.length} Zeichen), src/legal/datenschutz-de.txt (${site.datenschutz.length} Zeichen)`)
