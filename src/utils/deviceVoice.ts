/**
 * Reading a story aloud with the voice of the device (the speech synthesis of the browser or of the phone), for the books that have no
 * recorded voice. The good-night mode uses it so that every book can be chosen. The text is cut into pieces of a few sentences: a long
 * text makes some phones stop after a few seconds, and a piece is also the unit in which the voice gets softer at the end of the timer.
 */

export const speechAvailable = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

/** The text in pieces of at most `max` characters, cut after sentences (and after a comma or a space only when a sentence is longer). */
export function splitForSpeech(text: string, max = 240): string[] {
  const out: string[] = []
  for (const para of text.split(/\n+/)) {
    const sentences = para.match(/[^.!?…]+[.!?…]+["“”„»«')\]]*\s*|[^.!?…]+$/g) ?? []
    let cur = ''
    const flush = () => {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
    }
    for (const raw of sentences) {
      const s = raw.replace(/\s+/g, ' ')
      if (s.length > max) {
        flush()
        // a sentence that is too long is cut at commas, then at spaces
        let rest = s.trim()
        while (rest.length > max) {
          let cut = rest.lastIndexOf(',', max)
          if (cut < max / 3) cut = rest.lastIndexOf(' ', max)
          if (cut <= 0) cut = max
          out.push(rest.slice(0, cut + 1).trim())
          rest = rest.slice(cut + 1).trim()
        }
        cur = rest
        continue
      }
      if ((cur + s).length > max) flush()
      cur += s
    }
    flush()
  }
  return out.filter(Boolean)
}

/** Speaks the pieces one after the other. Pausing stops the piece that is spoken and goes on with it again (that works on every device). */
export class DeviceReader {
  private index = 0
  private running = false
  private token = 0

  constructor(
    private readonly pieces: string[],
    private readonly lang: string,
    /** The volume (0 to 1) for the next piece: it is asked for every piece, so the voice can get softer. */
    private readonly volume: () => number,
    private readonly onEnd: () => void,
    private readonly onFail: () => void
  ) {}

  start() {
    this.running = true
    this.speak()
  }

  pause() {
    this.running = false
    this.token++
    window.speechSynthesis.cancel()
  }

  resume() {
    if (this.running) return
    this.running = true
    this.speak()
  }

  stop() {
    this.running = false
    this.token++
    if (speechAvailable()) window.speechSynthesis.cancel()
  }

  private speak() {
    if (!this.running) return
    if (this.index >= this.pieces.length) {
      this.running = false
      this.onEnd()
      return
    }
    const mine = ++this.token
    const u = new SpeechSynthesisUtterance(this.pieces[this.index]!)
    u.lang = this.lang
    u.rate = 0.92
    u.volume = Math.max(0, Math.min(1, this.volume()))
    u.onend = () => {
      if (mine !== this.token) return
      this.index++
      this.speak()
    }
    u.onerror = (e) => {
      // a piece that was cut off on purpose (pause, stop) is no error
      if (mine !== this.token || e.error === 'interrupted' || e.error === 'canceled') return
      this.running = false
      this.onFail()
    }
    window.speechSynthesis.speak(u)
  }
}
