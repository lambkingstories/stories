/**
 * Kleiner Dateiserver, der das Verhalten von Cloudflare Pages nachbildet, und eine Selbstpruefung dafuer.
 * (`vite preview` zeigt den Unterschied nicht, weil es fehlende Dateien mit Endung ohnehin mit 404 beantwortet.)
 *
 * Cloudflare Pages:  Datei da                      -> Datei, 200
 *                    fehlt, es gibt /404.html      -> /404.html, Status 404   (nahestes 404.html von unten nach oben)
 *                    fehlt, es gibt KEIN 404.html  -> /index.html, Status 200 (Single-Page-App-Rueckfall)
 *
 * Aufruf:  node scripts/serve-pages-like.mjs <Ordner> [Port]     (Server, z. B. dist-cloud)
 *          node scripts/serve-pages-like.mjs <Ordner> --check    (startet kurz, prueft, beendet; Exit 1 bei Fehler)
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.ico': 'image/x-icon' }

export function makeServer(dir) {
  const root = resolve(dir)
  const send = (res, status, file) => {
    res.writeHead(status, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' })
    res.end(readFileSync(file))
  }
  return createServer((req, res) => {
    let path = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0])
    if (path.endsWith('/')) path += 'index.html'
    const file = normalize(join(root, path))
    if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) return send(res, 200, file)
    // nahestes 404.html von unten nach oben
    let folder = normalize(join(root, path, '..'))
    while (folder.startsWith(root)) {
      const nf = join(folder, '404.html')
      if (existsSync(nf)) return send(res, 404, nf)
      if (folder === root) break
      folder = normalize(join(folder, '..'))
    }
    return send(res, 200, join(root, 'index.html')) // Single-Page-App-Rueckfall
  })
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
if (isMain) {
  const [dir, arg] = process.argv.slice(2)
  if (!dir) {
    console.error('Aufruf: node scripts/serve-pages-like.mjs <Ordner> [Port|--check]')
    process.exit(2)
  }
  const server = makeServer(dir)
  if (arg === '--check') {
    server.listen(0, '127.0.0.1', async () => {
      const base = `http://127.0.0.1:${server.address().port}`
      const checks = [
        ['/', 200, 'Startseite'],
        ['/index.html', 200, 'index.html'],
        ['/images/placeholder.webp', 200, 'vorhandenes Bild'],
        ['/images/gibt-es-nicht.webp', 404, 'fehlendes Bild (.webp)'],
        ['/images/gibt-es-nicht.png', 404, 'fehlendes Bild (.png)'],
        ['/audio/gibt-es-nicht.mp3', 404, 'fehlender Ton (.mp3)'],
        ['/gibt-es-nicht.json', 404, 'fehlende Daten (.json)'],
        ['/gibt/es/nicht', 404, 'unbekannte Seite']
      ]
      let bad = 0
      for (const [path, want, label] of checks) {
        const r = await fetch(base + path)
        const ok = r.status === want
        if (!ok) bad++
        console.log(`${ok ? 'OK  ' : 'FEHLER'}  ${r.status}  ${path}  (${label}, erwartet ${want})`)
      }
      process.exitCode = bad ? 1 : 0
      server.close()
      server.closeAllConnections()
    })
  } else {
    const port = Number(arg) || 8788
    server.listen(port, () => console.log(`Pages-Nachbau: http://localhost:${port}  (${resolve(dir)})`))
  }
}
