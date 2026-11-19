/**
 * The texts of the course of the order race in "Familien-Spiele v2" (title screen "How to play"), german, english, spanish.
 * Merged into `app.bigGames.orderFlow` (see `index.ts`). They only say what the game does anyway; the name of the game and the other lines of
 * "How to play" (`app.order.task`, `app.order.rule`) come from the texts of the game itself.
 */
export default {
  de: {
    ruleMix: 'Du siehst ein paar Stationen aus einem Abenteuer, ganz durcheinander.',
    ruleWrong: 'Die richtige Station wandert auf die Strecke. Eine falsche wackelt, dann probierst du weiter.',
    ruleTurns: 'Spielen mehrere mit, ist jeder reihum dran. Wer am Ende die meisten Punkte hat, gewinnt.'
  },
  en: {
    ruleMix: 'You see a few stations from one adventure, all mixed up.',
    ruleWrong: 'The right station moves onto the route. A wrong one wobbles, then you try again.',
    ruleTurns: 'With more than one player everybody takes a turn. Whoever has the most points at the end wins.'
  },
  es: {
    ruleMix: 'Ves unas cuantas estaciones de una aventura, todas revueltas.',
    ruleWrong: 'La estación correcta pasa al camino. Una equivocada se tambalea y vuelves a probar.',
    ruleTurns: 'Si juegan varios, cada uno tiene su turno. Gana quien tenga más puntos al final.'
  }
}
