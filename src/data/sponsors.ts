/**
 * The sponsors that are named on the fourth slide of the welcome card on the start page ("Unsere Sponsoren").
 * While the list is empty the slide does not appear. To add one: put the logo in `public/images/sponsors/` (a calm
 * picture, wide rather than tall) and add an entry here; the link, if there is one, goes through the parental gate.
 */
export interface Sponsor {
  id: string
  name: string
  /** Path inside `public/`, e.g. `images/sponsors/example.webp`. Without a logo the name is shown as text. */
  logo?: string
  /** Website of the sponsor (opened in the browser, after the parental gate). */
  url?: string
}

export const sponsors: Sponsor[] = []
