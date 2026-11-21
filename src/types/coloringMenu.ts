/** What the main menu of the painting program shows (see `ColoringMenu.vue`). */

export interface BookCard {
  /** The language of the book when it is not the one of the screen (shows a flag on the cover). */
  flag?: 'de' | 'en' | null
  bookId: string
  title: string
  cover: string
  total: number
  /** Pages the child has painted on. */
  done: number
  updatedAt: number
}

/** A picture won as a present (for example by finishing a journey with a cup). */
export interface RewardItem {
  id: string
  title: string
  /** The line drawing to paint. */
  image: string
  /** Where it comes from, for example the journey. */
  from: string
}

export interface GalleryItem {
  key: string
  title: string
  data: string
  preview: string
}

export interface GalleryGroup {
  key: string
  title: string
  items: GalleryItem[]
}
