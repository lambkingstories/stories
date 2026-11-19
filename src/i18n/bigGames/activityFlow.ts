/**
 * The texts of the course of the family game "Bible Words" (id `activity`) in "Familien-Spiele v2" (title screen: "How to play"), german, english, spanish.
 * Merged into `app.bigGames.activityFlow` (see `index.ts`). The name of the game and most of its lines come from the texts of the game itself
 * (`app.family.hub_activity`, `app.activity.*`); here are only the two lines that the game does anyway and that had no text yet. Spanish follows the English.
 */
export default {
  de: {
    ruleTime: 'Für jedes Wort habt ihr nur kurz Zeit.',
    ruleWin: 'Wer am Ende die meisten Punkte hat, gewinnt.'
  },
  en: {
    ruleTime: 'You only have a short time for each word.',
    ruleWin: 'Whoever has the most points at the end wins.'
  },
  es: {
    ruleTime: 'Para cada palabra solo tenéis poco tiempo.',
    ruleWin: 'Gana quien tenga más puntos al final.'
  }
}
