/**
 * Renders the privacy policy / imprint text files
 * (`website/src/documentation/*.md`) for the in-app legal page. Mirrors the
 * light-touch renderer in `website/src/components/PrivacyPolicyModal.vue` so
 * the app and the website show the same document: lines starting with
 * `<digit>.` become section headings, blank lines split paragraphs, bare URLs
 * become links. Not a Markdown parser — the numbered "1. Datenschutz …"
 * headings would otherwise turn into an ordered list.
 *
 * Links carry no `target`: the page intercepts clicks and routes them through
 * `openExternal`, which is the only reliable way out of a native WebView.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function autoLink(s: string): string {
  return s.replace(/\bhttps?:\/\/[^\s<)]+/g, (url) => {
    const trimmed = url.replace(/[.,;:]+$/, '')
    return `<a href="${trimmed}" rel="noopener noreferrer">${trimmed}</a>${url.slice(trimmed.length)}`
  })
}

/** The generated files in `src/legal/` start with `//` lines ("generated, do not edit by hand"); they are for people, not for the page. */
export function legalBody(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !line.startsWith('//'))
    .join('\n')
    .trim()
}

export function renderLegalText(text: string): string {
  const blocks = text
    .split('\n')
    .filter((line) => line.trim() !== '`')
    .join('\n')
    .split(/\n\s*\n/)

  const html: string[] = []
  for (const raw of blocks) {
    const block = raw.replace(/^\n+|\n+$/g, '')
    if (!block) continue
    const lines = block.split('\n')
    const heading = (lines[0] ?? '').trim().match(/^(\d+)\.\s+(.+)$/)
    if (heading) {
      html.push(`<h3>${heading[1]}. ${autoLink(escapeHtml(heading[2] ?? ''))}</h3>`)
      const tail = lines.slice(1).join('\n').trim()
      if (tail) html.push(`<p>${autoLink(escapeHtml(tail)).replace(/\n/g, '<br>')}</p>`)
    } else {
      html.push(`<p>${autoLink(escapeHtml(block)).replace(/\n/g, '<br>')}</p>`)
    }
  }
  return html.join('\n')
}
