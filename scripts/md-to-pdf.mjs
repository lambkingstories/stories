#!/usr/bin/env node
// Render a Markdown file to a print-ready A4 PDF.
//
// Usage:
//   node scripts/md-to-pdf.mjs [input.md] [output.pdf] [--lang=de] [--style=invoice]
//   pnpm handover:pdf                      # handover-lambking-stories.md → .pdf
//   pnpm invoice:pdf                       # invoice.md → Rechnung-lambking-stories-Konstantin-Steinmiller.pdf
//
// `--lang` sets the document language (hyphenation, footer labels); default `en`.
// `--style=invoice` swaps the handover look for a one-page business letter:
// no "confidential" footer, and layout for the `<div class="letterhead">`,
// `parties` / `recipient` / `meta` and `totals` blocks used in invoice.md.
//
// Markdown → HTML goes through `marked` (GFM: tables, task lists, fenced
// code). HTML → PDF goes through the Chrome / Edge / Chromium that is already
// installed on the machine, run headless with `--print-to-pdf` — no
// Puppeteer download. The browser gets a throwaway `--user-data-dir`, so an
// already-open browser session is never touched or locked.
//
// Override the browser with CHROME_PATH=<path-to-executable>.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { marked } from 'marked'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const positional = args.filter((a) => !a.startsWith('--'))
const lang = args.find((a) => a.startsWith('--lang='))?.slice('--lang='.length) || 'en'
const LABELS = {
  en: { confidential: 'confidential', page: 'Page' },
  de: { confidential: 'vertraulich', page: 'Seite' }
}
const labels = LABELS[lang] ?? LABELS.en
const STYLES = {
  document: { footer: (title) => `${title} — ${labels.confidential}`, softBreaks: true, css: '' },
  invoice: {
    footer: (title) => title,
    // A letter has no narrow URL columns, and Chrome breaks at <wbr> even
    // under `white-space: nowrap` — it split the PayPal address in two.
    softBreaks: false,
    css: `
  @page { margin: 20mm 20mm 20mm 22mm; }
  body { line-height: 1.5; }
  h1 { font-size: 16pt; margin: 0 0 4mm; padding: 0; border: 0; }
  .letterhead { text-align: right; margin-bottom: 14mm; }
  .letterhead p, .recipient p { margin: 0; }
  .letterhead strong { font-size: 13pt; }
  .parties { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; margin-bottom: 14mm; }
  .recipient .return-address {
    display: inline-block; margin-bottom: 3mm; padding-bottom: 0.5mm;
    border-bottom: 0.5pt solid #bbb; font-size: 7.5pt; color: #777;
  }
  th, td { border: 0; border-bottom: 0.5pt solid #ddd; padding: 2mm; font-variant-numeric: tabular-nums; }
  th { background: none; border-bottom: 1pt solid #1d1d1f; }
  tbody tr:nth-child(even) td { background: none; }
  body > table { font-size: 9.5pt; margin: 5mm 0 2mm; }
  body > table td:last-child { white-space: nowrap; }
  .meta table, .totals table { width: auto; }
  .meta table { margin: 0; font-size: 9pt; }
  .meta td { border: 0; padding: 0.5mm 0 0.5mm 6mm; white-space: nowrap; hyphens: manual; }
  .meta td:first-child { padding-left: 0; color: #666; }
  .totals table { margin: 0 0 8mm auto; font-size: 10pt; }
  .totals td { border: 0; padding: 1mm 2mm 1mm 12mm; white-space: nowrap; }
  .totals tr:last-child td { border-top: 1pt solid #1d1d1f; padding-top: 2mm; font-size: 11pt; font-weight: 600; }`
  }
}
const styleName = args.find((a) => a.startsWith('--style='))?.slice('--style='.length) || 'document'
const style = STYLES[styleName]
if (!style) {
  console.error(`[md-to-pdf] unknown --style=${styleName} (expected: ${Object.keys(STYLES).join(', ')})`)
  process.exit(1)
}
const input = resolve(positional[0] || join(ROOT, 'handover-lambking-stories.md'))
const output = resolve(positional[1] || input.replace(new RegExp(`${extname(input)}$`), '.pdf'))

if (!existsSync(input)) {
  console.error(`[md-to-pdf] input not found: ${input}`)
  process.exit(1)
}

const markdown = readFileSync(input, 'utf8')
const title = (markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(input)).trim()
const body = marked
  .parse(markdown, { gfm: true, breaks: false })
  // Key/value tables are written with an empty header row (`| | |`) because
  // Markdown requires one — don't print it as an empty band.
  .replace(/<thead>\s*<tr>(?:\s*<th[^>]*>\s*<\/th>)+\s*<\/tr>\s*<\/thead>/g, '')
  // URLs, connection strings, env keys and fingerprints have no natural break
  // points, so a table column would either overflow the page or (with
  // `overflow-wrap: anywhere`) get squeezed to one character. Soft breaks
  // after separators let such values wrap at a sensible spot instead.
  .replace(/(<a\b[^>]*>)([^<]+)(<\/a>)/g, (_, open, text, close) => open + softBreaks(text) + close)
  .replace(/(?<!<pre>)<code>([^<]+)<\/code>/g, (_, text) => `<code>${softBreaks(text)}</code>`)

const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page {
    size: A4;
    margin: 16mm 14mm 18mm 14mm;
    @bottom-left { content: "${escapeCss(style.footer(title))}"; font: 8pt system-ui, sans-serif; color: #888; }
    @bottom-right { content: "${labels.page} " counter(page) " / " counter(pages); font: 8pt system-ui, sans-serif; color: #888; }
  }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font: 10pt/1.45 "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: #1d1d1f;
    margin: 0;
  }
  h1 { font-size: 20pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 2px solid #b8860b; }
  h2 { font-size: 14pt; margin: 8mm 0 3mm; padding-bottom: 1mm; border-bottom: 1px solid #ddd; break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 5mm 0 2mm; break-after: avoid; }
  h4 { font-size: 10.5pt; margin: 4mm 0 1.5mm; break-after: avoid; }
  p, ul, ol { margin: 0 0 2.5mm; }
  ul, ol { padding-left: 6mm; }
  li { margin: 0.6mm 0; }
  li > input[type="checkbox"] { margin: 0 1.6mm 0 0; vertical-align: -1px; }
  ul:has(> li > input[type="checkbox"]) { list-style: none; padding-left: 1mm; }
  a { color: #0b57d0; text-decoration: none; overflow-wrap: break-word; }
  code {
    font: 8.6pt/1.35 Consolas, "Cascadia Mono", "SF Mono", Menlo, monospace;
    background: #f3f1ec; border-radius: 3px; padding: 0.2mm 1mm;
    overflow-wrap: break-word;
  }
  pre {
    background: #f3f1ec; border: 1px solid #e4e0d6; border-radius: 4px;
    padding: 2.5mm 3mm; margin: 0 0 3mm;
    white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid;
  }
  pre code { background: none; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 3.5mm; font-size: 8.8pt; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid #d9d6cf; padding: 1.2mm 1.8mm; text-align: left; vertical-align: top; overflow-wrap: break-word; hyphens: auto; }
  /* GFM column alignment (\`|--:|\`) arrives as an align attribute, which the rule above would override. */
  th[align="center"], td[align="center"] { text-align: center; }
  th[align="right"], td[align="right"] { text-align: right; }
  code, pre { hyphens: none; }
  th { background: #f6efd9; font-weight: 600; }
  tbody tr:nth-child(even) td { background: #fbfaf7; }
  blockquote {
    margin: 0 0 3mm; padding: 2mm 3mm; border-left: 3px solid #b8860b;
    background: #fdf8ea; color: #4a4a4a;
  }
  blockquote p:last-child { margin-bottom: 0; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 5mm 0; }
${style.css}
</style>
</head>
<body>
${body}
</body>
</html>`

const browser = findBrowser()
if (!browser) {
  console.error('[md-to-pdf] no Chrome / Edge / Chromium found. Set CHROME_PATH to its executable.')
  process.exit(1)
}

const work = mkdtempSync(join(tmpdir(), 'md-to-pdf-'))
const htmlPath = join(work, 'document.html')
writeFileSync(htmlPath, html, 'utf8')

const result = spawnSync(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--user-data-dir=${join(work, 'profile')}`,
    // Current flag name first; the older one is ignored by new Chrome builds.
    '--no-pdf-header-footer',
    '--print-to-pdf-no-header',
    `--print-to-pdf=${output}`,
    pathToFileURL(htmlPath).href
  ],
  { stdio: 'pipe', timeout: 120_000 }
)

try {
  rmSync(work, { recursive: true, force: true })
} catch {
  // The browser can hold the profile dir open for a moment on Windows —
  // leaving a temp folder behind is harmless.
}

if (result.error || !existsSync(output) || statSync(output).size === 0) {
  console.error(`[md-to-pdf] PDF generation failed using ${browser}`)
  if (result.error) console.error(`  ${result.error.message}`)
  const stderr = result.stderr?.toString().trim()
  if (stderr) console.error(stderr.split('\n').slice(-10).join('\n'))
  process.exit(1)
}

console.log(`[md-to-pdf] ${basename(input)} → ${output} (${Math.round(statSync(output).size / 1024)} KB)`)

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = []
  if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
      if (!base) continue
      candidates.push(
        join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        join(base, 'Chromium', 'Application', 'chrome.exe')
      )
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    )
  } else {
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
      const which = spawnSync('which', [name], { encoding: 'utf8' })
      if (which.status === 0 && which.stdout.trim()) candidates.push(which.stdout.trim())
    }
  }
  return candidates.find((p) => existsSync(p)) ?? null
}

// `&` and `;` are excluded so HTML entities (`&amp;`, `&quot;`) stay intact.
function softBreaks(text) {
  return style.softBreaks ? text.replace(/([/.,:?=@_])(?=\S)/g, '$1<wbr>') : text
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}

function escapeCss(s) {
  return s.replace(/["\\]/g, '\\$&')
}
