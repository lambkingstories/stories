/**
 * The texts of the course of the Bible bingo in "Familien-Spiele v2" (the players page and "How to play"), german, english, spanish.
 * Merged into `app.bigGames.bingoFlow` (see `index.ts`). They only say what the game does anyway; the name of the game and the other lines
 * (`app.bingo.cardHelp`, the ways and levels) come from the texts of the game itself.
 */
export default {
  de: {
    whoHere: 'Wer spielt auf diesem Handy?',
    rule1: 'Jeder hat eine Karte mit 16 Personen aus der Bibel.',
    rule2: 'Eine Person nach der anderen wird genannt, mit dem Namen oder mit drei Hinweisen.',
    rule4: 'Wer eine volle Reihe, Spalte oder Diagonale hat, ruft „Bingo!“.'
  },
  en: {
    whoHere: 'Who is playing on this phone?',
    rule1: 'Everybody has a card with 16 people from the Bible.',
    rule2: 'One person after the other is called, by name or with three hints.',
    rule4: 'Whoever has a full row, column or diagonal calls "Bingo!".'
  },
  es: {
    whoHere: '¿Quién juega en este móvil?',
    rule1: 'Cada uno tiene un cartón con 16 personajes de la Biblia.',
    rule2: 'Se nombra a una persona tras otra, por su nombre o con tres pistas.',
    rule4: 'Quien tenga una fila, columna o diagonal completa grita «¡Bingo!».'
  }
}
