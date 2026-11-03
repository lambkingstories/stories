/**
 * The text of a story page as plain words to read aloud: the markdown of the page (pictures, headings, emphasis, links, lists)
 * is taken away, only the sentences stay. Used where a grown-up reads a story into the microphone.
 */
export function plainText(markdown: string): string {
  return (
    (markdown ?? '')
      // pictures and html tags
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/<[^>]+>/g, '')
      // links keep their words
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // headings, quotes, list marks at the start of a line
      .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
      // emphasis and code marks
      .replace(/(\*\*|__|\*|_|`)/g, '')
      // a line of dashes
      .replace(/^\s*([-*_]\s*){3,}$/gm, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}
