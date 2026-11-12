/**
 * Sample data of the three new games of "Die Bergpredigt" (`bergpredigt`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/bergpredigt.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through. The places are made so that the checks hold; they are not the places of the painted pictures.
 */
import type { BlessedGame, LightStandGame, NearViewGame } from '@/utils/bergpredigtNeu'

const G = 'images/abenteuer/spiele/bergpredigt/'

export const BLESSED: BlessedGame = {
  background: `${G}selig/wiese.webp`,
  ratio: 1.5,
  peopleRatio: 0.889,
  people: [
    { id: 'mann-leer', image: `${G}selig/mann-leer.webp`, label: 'der Mann mit den leeren Händen', x: 36, y: 76, w: 22 },
    { id: 'frau-traenen', image: `${G}selig/frau-traenen.webp`, label: 'die Frau, die sich über die Augen wischt', x: 66, y: 68, w: 19 },
    { id: 'hirte', image: `${G}selig/hirte.webp`, label: 'der Hirte mit seinem Stab', x: 12, y: 62, w: 18 },
    { id: 'junger-mann', image: `${G}selig/junger-mann.webp`, label: 'der junge Mann, der sich weit vorbeugt', x: 52, y: 56, w: 15 }
  ],
  gifts: [
    { id: 'gabe-himmelreich', image: `${G}selig/gabe-himmelreich.webp`, label: 'das offene Tor des Himmelreichs', caption: 'Himmelreich', forPerson: 'mann-leer' },
    { id: 'gabe-trost', image: `${G}selig/gabe-trost.webp`, label: 'ein weiches Tuch', caption: 'Trost', forPerson: 'frau-traenen' },
    { id: 'gabe-land', image: `${G}selig/gabe-land.webp`, label: 'ein Stück grünes Land', caption: 'Land', forPerson: 'hirte' },
    { id: 'gabe-brot', image: `${G}selig/gabe-brot.webp`, label: 'Brot und ein Krug Wasser', caption: 'Satt werden', forPerson: 'junger-mann' },
    { id: 'ablenker-truhe', image: `${G}selig/ablenker-truhe.webp`, label: 'eine Truhe mit Goldstücken', caption: 'Goldtruhe' },
    { id: 'ablenker-mantel', image: `${G}selig/ablenker-mantel.webp`, label: 'ein Königsmantel', caption: 'Königsmantel' }
  ],
  basket: `${G}selig/korb.webp`,
  glow: `${G}selig/leuchten.webp`,
  sentences: [
    { personId: 'mann-leer', text: 'Selig sind, die arm sind vor Gott. Denn das Himmelreich gehört ihnen.' },
    { personId: 'frau-traenen', text: 'Selig sind, die Leid tragen. Denn sie sollen getröstet werden.' },
    { personId: 'hirte', text: 'Selig sind die Sanftmütigen. Denn sie werden das Land besitzen.' },
    { personId: 'junger-mann', text: 'Selig sind, die Hunger und Durst haben nach dem, was recht ist. Denn sie sollen satt werden.' }
  ],
  rounds: [
    { hint: 'Gib jedem Zuhörer, was Jesus ihm zusagt.', mode: 'sentence', order: ['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'] },
    { hint: 'Wer bekommt welche Gabe? Zwei Gaben bleiben übrig.', mode: 'free', order: ['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'] }
  ]
}

export const LIGHT: LightStandGame = {
  ratio: 1.5,
  peopleRatio: 0.6875,
  basket: `${G}scheffel/korb.webp`,
  lampOff: `${G}scheffel/lampe-aus.webp`,
  lampOn: `${G}scheffel/lampe-an.webp`,
  lampW: 9,
  stand: { image: `${G}scheffel/leuchter.webp`, w: 12 },
  rooms: [
    {
      hint: 'Hebe den Korb ab und stelle die Lampe auf den Leuchter.',
      bright: `${G}scheffel/stube-klein-hell.webp`,
      dark: `${G}scheffel/stube-klein-dunkel.webp`,
      people: [
        { id: 'mutter', image: `${G}scheffel/person-mutter.webp`, label: 'Die Mutter', x: 74, y: 84, w: 16 },
        { id: 'kind', image: `${G}scheffel/person-kind.webp`, label: 'Das Kind', x: 30, y: 92, w: 14 }
      ],
      spots: [{ id: 'boden', x: 46, y: 90, radius: 14 }, { id: 'tisch', x: 60, y: 54, radius: 20 }, { id: 'leuchter', x: 14, y: 56, radius: 72 }],
      basket: { x: 60, y: 54, w: 16 }
    },
    {
      hint: 'Stelle die Lampe so hin, dass alle im Haus ihr Licht sehen.',
      bright: `${G}scheffel/stube-gross-hell.webp`,
      dark: `${G}scheffel/stube-gross-dunkel.webp`,
      people: [
        { id: 'grossvater', image: `${G}scheffel/person-grossvater.webp`, label: 'Der Großvater', x: 38, y: 60, w: 12 },
        { id: 'maedchen', image: `${G}scheffel/person-maedchen.webp`, label: 'Das Mädchen', x: 10, y: 80, w: 13 },
        { id: 'kind', image: `${G}scheffel/person-kind.webp`, label: 'Das Kind', x: 30, y: 95, w: 13 },
        { id: 'vater', image: `${G}scheffel/person-vater.webp`, label: 'Der Vater', x: 58, y: 78, w: 15 },
        { id: 'mutter', image: `${G}scheffel/person-mutter.webp`, label: 'Die Mutter', x: 88, y: 80, w: 14 }
      ],
      spots: [{ id: 'boden', x: 38, y: 94, radius: 12 }, { id: 'tisch', x: 48, y: 62, radius: 22 }, { id: 'leuchter', x: 50, y: 36, radius: 52 }]
    }
  ]
}

export const NEAR: NearViewGame = {
  background: `${G}nahblick/wiese.webp`,
  ratio: 1.5,
  haze: `${G}nahblick/dunst.webp`,
  wreath: { image: `${G}nahblick/kranz.webp`, w: 34, minCover: 0.5 },
  blooms: [
    { id: 'b1', x: 12, y: 24, w: 12, nearImage: `${G}nahblick/nah-1.webp`, spot: { nx: 68, ny: 70, nw: 40 } },
    { id: 'b2', x: 24, y: 74, w: 12, nearImage: `${G}nahblick/nah-2.webp`, spot: { nx: 32, ny: 70, nw: 40 } },
    { id: 'b3', x: 37, y: 24, w: 12, nearImage: `${G}nahblick/nah-3.webp`, spot: { nx: 68, ny: 70, nw: 40 } },
    { id: 'b4', x: 56, y: 74, w: 12, nearImage: `${G}nahblick/nah-4.webp`, spot: { nx: 32, ny: 70, nw: 40 } },
    { id: 'b5', x: 62, y: 24, w: 12, nearImage: `${G}nahblick/nah-5.webp`, spot: { nx: 68, ny: 70, nw: 40 } },
    { id: 'b6', x: 82, y: 74, w: 12, nearImage: `${G}nahblick/nah-6.webp`, spot: { nx: 32, ny: 70, nw: 40 } },
    { id: 'b7', x: 88, y: 24, w: 12, nearImage: `${G}nahblick/nah-7.webp`, spot: { nx: 68, ny: 70, nw: 40 } }
  ],
  guests: [
    { id: 'biene', image: `${G}nahblick/gast-biene.webp`, label: 'Eine Biene' },
    { id: 'marienkaefer', image: `${G}nahblick/gast-marienkaefer.webp`, label: 'Ein Marienkäfer' },
    { id: 'schmetterling', image: `${G}nahblick/gast-schmetterling.webp`, label: 'Ein Schmetterling' },
    { id: 'grille', image: `${G}nahblick/gast-grille.webp`, label: 'Eine Grille' }
  ],
  rounds: [
    {
      hint: 'Fahre mit dem Kranz über die Blumen und finde, wer in den Blüten sitzt.',
      bloomIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'],
      hidden: ['b4', 'b5', 'b6', 'b7'],
      sits: [{ bloomId: 'b1', guestId: 'biene' }, { bloomId: 'b3', guestId: 'marienkaefer' }]
    },
    {
      hint: 'Schau jede Blüte genau an. Vier Gäste sitzen auf der Wiese.',
      bloomIds: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'],
      hidden: [],
      sits: [{ bloomId: 'b2', guestId: 'schmetterling' }, { bloomId: 'b4', guestId: 'biene' }, { bloomId: 'b6', guestId: 'grille' }, { bloomId: 'b7', guestId: 'marienkaefer' }]
    }
  ]
}
