/**
 * Findet Bilder, die im Quelltext (src/) angegeben sind, aber unter public/ fehlen.
 *
 * Aufruf:  node scripts/find-missing-images.mjs            (Liste + Zahl)
 *          node scripts/find-missing-images.mjs --json     (maschinenlesbar)
 *
 * Der Test tests/missingImages.test.ts benutzt dieselbe Funktion (`findMissingImages`).
 *
 * Wie es arbeitet: Jede Zeichenkette in `src/**` (.ts, .vue, .js), die auf `.webp/.png/.jpg/.jpeg/.svg/.gif` endet und `images/` enthält,
 * ist ein Bildpfad. Steht darin `${NAME}`, wird `NAME` aus einer `const NAME = '…'`-Zeile derselben Datei eingesetzt (auch verschachtelt).
 * Pfade, in denen danach noch `${…}` steht (zusammengesetzt zur Laufzeit), werden nicht geprüft, sondern als „dynamisch“ gezählt.
 * Bilder mit Endung `-klein.webp` (Medaillen-Vorschau) werden mitgeprüft, weil die App sie wirklich abruft.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const EXT = /\.(?:webp|png|jpe?g|svg|gif)$/i

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules') continue
      walk(p, out)
    } else if (/\.(?:ts|vue|js|mjs)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p)
  }
  return out
}

/** Alle Zeichenketten einer Datei (einfach, doppelt, Schablone), grob aber ohne Kommentare zu streichen. */
function literals(source) {
  // Kommentare weglassen (Zeilenkommentare nur, wenn vor dem // kein Doppelpunkt steht, damit "https://" bleibt).
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1')
  const res = []
  const re = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g
  let m
  while ((m = re.exec(text))) res.push(m[2])
  return res
}

function constants(source) {
  const text = source
  const map = new Map()
  const re = /\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*string)?\s*=\s*(['"`])((?:\\.|(?!\2)[^\\\n])*)\2/g
  let m
  while ((m = re.exec(text))) map.set(m[1], m[3])
  return map
}

function resolveTemplate(s, consts) {
  let cur = s
  for (let i = 0; i < 6 && cur.includes('${'); i++) {
    const next = cur.replace(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g, (all, name) => (consts.has(name) ? consts.get(name) : all))
    if (next === cur) break
    cur = next
  }
  return cur
}

export function findMissingImages(root = ROOT) {
  const files = walk(join(root, 'src'))
  const referenced = new Map() // Pfad -> erste Quelldatei
  let dynamic = 0
  for (const f of files) {
    const text = readFileSync(f, 'utf8')
    const consts = constants(text)
    for (const raw of literals(text)) {
      if (!/images\//.test(raw)) continue
      const s = resolveTemplate(raw, consts)
      if (s.includes('${')) {
        if (EXT.test(s.replace(/\$\{[^}]*\}/g, 'x'))) dynamic++
        continue
      }
      if (!EXT.test(s)) continue
      const idx = s.indexOf('images/')
      // Nur Pfade, die mit "images/" (oder "/images/") beginnen, sind Dateien unter public/ (nicht z. B. "src/assets/images/…").
      const before = s.slice(0, idx)
      if (before !== '' && before !== '/') continue
      const path = s.slice(idx)
      if (!referenced.has(path)) referenced.set(path, relative(root, f).replace(/\\/g, '/'))
    }
  }
  const missing = []
  for (const [path, from] of referenced) {
    if (!existsSync(join(root, 'public', path))) missing.push({ path, from })
  }
  missing.sort((a, b) => a.path.localeCompare(b.path))
  return { referenced: referenced.size, dynamic, missing }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = findMissingImages()
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2))
  } else {
    console.log(`Bildpfade im Quelltext: ${r.referenced} (dazu ${r.dynamic} zur Laufzeit zusammengesetzte, nicht geprüft)`)
    console.log(`Fehlende Dateien unter public/: ${r.missing.length}`)
    for (const m of r.missing) console.log(`  ${m.path}   (in ${m.from})`)
  }
}
