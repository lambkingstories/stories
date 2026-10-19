import { ref } from 'vue'

/**
 * The language of the adventure texts (stories, questions, hints, titles, recordings): `'en'` shows the English texts of the
 * adventures (`src/data/adventures/en/`), everything else shows the German originals. `App.vue` keeps it in step with the language of
 * the app. The texts of the adventures read it through `localize()`, so every screen follows a change of the language at once.
 */
export const adventureLanguage = ref<'de' | 'en'>('de')

export function setAdventureLanguage(locale: string | undefined | null) {
  adventureLanguage.value = locale === 'en' ? 'en' : 'de'
}
