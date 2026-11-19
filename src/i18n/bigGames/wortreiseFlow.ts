/**
 * The texts of the course of the family game "Word Journey" (id `wortreise`) in "Familien-Spiele v2": the five lines of "How to play" on the title
 * screen (german, english, spanish). They only say what the game does anyway. Merged into `app.bigGames.wortreiseFlow` (see `index.ts`).
 * The NAME of the game and its line come from the texts of the game itself (`app.bigGames.wortreise.hub`, `hubSub`), the settings page uses the
 * texts of the levels and of the stages in `wortreise.ts`.
 */
export default {
  de: {
    rule1: 'Reihum zieht ihr mit dem Finger ein Wort über die Buchstaben im Kreis.',
    rule2: 'Steht das Wort im Gitter, füllt es die Felder und gibt Punkte. Dann ist der Nächste dran.',
    rule3: 'Ein anderes gutes Wort gibt Bonuspunkte, und du darfst weiterraten.',
    rule4: 'Mit der Lupe zeigt ihr einen Buchstaben. Mit Passen ist der Nächste dran.',
    rule5: 'Ist das Gitter voll, geht die Reise weiter, bis ihr in Jericho seid.'
  },
  en: {
    rule1: 'Take turns drawing a word over the circle of letters with your finger.',
    rule2: 'If the word is in the grid, it fills the squares and scores points. Then the next player is up.',
    rule3: 'Another good word gives bonus points, and you can keep guessing.',
    rule4: 'The magnifier uncovers a letter. Pass hands over to the next player.',
    rule5: 'When the grid is full, the journey goes on until you reach Jericho.'
  },
  es: {
    rule1: 'Por turnos, trazad con el dedo una palabra sobre el círculo de letras.',
    rule2: 'Si la palabra está en el cuadro, llena las casillas y da puntos. Luego le toca al siguiente.',
    rule3: 'Otra buena palabra da puntos extra y puedes seguir probando.',
    rule4: 'La lupa descubre una letra. Con «Pasar» le toca al siguiente.',
    rule5: 'Cuando el cuadro está lleno, el viaje sigue hasta que lleguéis a Jericó.'
  }
}
