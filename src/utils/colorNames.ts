/**
 * The name of a colour in words ("Hellblau", "dark red"), for the screen reader: the pencils of the colour box are
 * pictures, so each one needs a name. It works from the colour's hue, saturation and lightness and has no list of colours
 * to keep up to date.
 */

export type NameLang = 'de' | 'en'

export type Base =
  | 'black'
  | 'grey'
  | 'white'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'beige'

const NAMES: Record<NameLang, Record<Base, string>> = {
  de: {
    black: 'Schwarz',
    grey: 'Grau',
    white: 'Weiß',
    red: 'Rot',
    orange: 'Orange',
    yellow: 'Gelb',
    lime: 'Hellgrün',
    green: 'Grün',
    turquoise: 'Türkis',
    blue: 'Blau',
    purple: 'Violett',
    pink: 'Rosa',
    brown: 'Braun',
    beige: 'Beige'
  },
  en: {
    black: 'black',
    grey: 'grey',
    white: 'white',
    red: 'red',
    orange: 'orange',
    yellow: 'yellow',
    lime: 'lime green',
    green: 'green',
    turquoise: 'turquoise',
    blue: 'blue',
    purple: 'purple',
    pink: 'pink',
    brown: 'brown',
    beige: 'beige'
  }
}

/** Hue (0–360), saturation and lightness (0–1) of a colour like `#E53935`. */
export function hslOf(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0')
  const r = (parseInt(n.slice(0, 2), 16) || 0) / 255
  const g = (parseInt(n.slice(2, 4), 16) || 0) / 255
  const b = (parseInt(n.slice(4, 6), 16) || 0) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

function baseOf(h: number, s: number, l: number): Base {
  if (l < 0.12) return 'black'
  if (l > 0.94) return 'white'
  if (s < 0.1) return 'grey'
  // low-strength warm colours are brown (dark) or beige (light)
  if (h >= 15 && h < 50 && s < 0.7 && l < 0.5) return 'brown'
  if (h >= 20 && h < 55 && s < 0.8 && l >= 0.75) return 'beige'
  if (h >= 330 || h < 12) return l > 0.72 ? 'pink' : 'red'
  if (h < 40) return 'orange'
  if (h < 68) return 'yellow'
  if (h < 90) return 'lime'
  if (h < 160) return 'green'
  if (h < 195) return 'turquoise'
  if (h < 255) return 'blue'
  if (h < 300) return 'purple'
  return 'pink'
}

/** The base name of a colour given as red, green and blue (0 to 255): "yellow", "brown", ... */
export function baseOfRgb(r: number, g: number, b: number): Base {
  const hex = '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
  const [h, s, l] = hslOf(hex)
  return baseOf(h, s, l)
}

/** "Hellblau" / "light blue": the base name with "light" or "dark" when the colour is very light or very dark. */
export function colorName(hex: string, lang: NameLang): string {
  const [h, s, l] = hslOf(hex)
  const base = baseOf(h, s, l)
  const name = NAMES[lang][base]
  const plain = base === 'black' || base === 'white' || base === 'grey' || base === 'beige' || base === 'pink' || base === 'lime' || base === 'brown'
  if (plain && base !== 'grey') return name
  if (l > 0.78) return lang === 'de' ? `Hell${name.toLowerCase()}` : `light ${name}`
  if (l < 0.3) return lang === 'de' ? `Dunkel${name.toLowerCase()}` : `dark ${name}`
  return name
}
