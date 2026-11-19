/**
 * The texts of the course of the family game "Find the Pairs" (id `memory`) in "Familien-Spiele v2": the five lines of "How to play" on the
 * title screen (german, english, spanish). They only say what the game does anyway. Merged into `app.bigGames.memoryFlow` (see `index.ts`).
 * The NAME of the game and its line come from the texts of the game itself (`app.family.hub_memory`, `hub_memorySub`), the settings page uses
 * `app.memory.size` and the sizes. Not to be mixed up with `memory.ts` (the picture pairs of the adventures).
 */
export default {
  de: {
    rule1: 'Alle Karten liegen verdeckt auf dem Tisch.',
    rule2: 'Dreh zwei Karten um.',
    rule3: 'Zeigen beide dasselbe Bild, gehört dir das Paar und du darfst gleich noch einmal.',
    rule4: 'Sonst werden sie wieder umgedreht und der Nächste ist dran.',
    rule5: 'Wer am Ende die meisten Paare hat, gewinnt. Wer allein spielt, zählt die Züge.'
  },
  en: {
    rule1: 'All the cards lie face down on the table.',
    rule2: 'Turn over two cards.',
    rule3: 'If both show the same picture, the pair is yours and you go again.',
    rule4: 'If not, they are turned back and the next player is up.',
    rule5: 'Whoever has the most pairs at the end wins. If you play alone, you count your moves.'
  },
  es: {
    rule1: 'Todas las cartas están boca abajo sobre la mesa.',
    rule2: 'Da la vuelta a dos cartas.',
    rule3: 'Si las dos muestran la misma imagen, la pareja es tuya y juegas otra vez.',
    rule4: 'Si no, se vuelven a girar y le toca al siguiente.',
    rule5: 'Gana quien tenga más parejas al final. Si juegas solo, cuentas tus movimientos.'
  }
}
