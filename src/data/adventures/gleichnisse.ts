/**
 * Abenteuer "Geschichten von Jesus" (Matthäus 13, 18 und 7, Lukas 10, 15 und 14) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Vom Sämann bis zum großen Fest". Entstanden nach dem Skill "LambKing Abenteuer Skill" (Leitung, 3.11.2026),
 * umgebaut am 10.11.2026: Etappe 10 bis 12 sind jetzt der unbarmherzige Diener, das Haus auf dem Felsen und das große Festessen (der verlorene Sohn wird ein eigenes Abenteuer).
 * Anton (31.10.2026): Jesus wird mit Gesicht gezeigt (ohne Heiligenschein). Gott der Vater, Engel, böse Geister und Lichtgestalten sind nie im Bild.
 * Quelle der Texte: D:/Claude/Abenteuer-Gleichnisse/ENTWURF_Gleichnisse.md (Etappe 1 bis 9) und UMBAU-2026-11/ENTWURF_Etappen_10-12.md (Etappe 10 bis 12); Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben.
 * Plan: ETAPPENPLAN.md und UMBAU-2026-11/PLAN.md, Figuren: FIGUREN.md, Spiele: SPIELE.md und UMBAU-2026-11/SPIELE_10-12.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele nach Antons Regel (5.11.2026: höchstens zwei bekannte Spiele, nie zwei hintereinander): 1 Lückenvers (bekannt), 2 Hundertfach (neu, hundertfach), 3 Reihenfolge (bekannt),
 * 4 Der Schatz im Acker (neu, graben), 5 nur Quiz, 6 Anhalten (neu, anhalten), 7 Zur Herberge (neu, herberge), 8 Heimtragen (neu, heimtragen), 9 Die verlorene Münze (neu, muenze),
 * 10 Hab Geduld mit mir (nur Quiz, ernste Stelle), 11 Das Haus auf dem Felsen (neu, baugrund), 12 Es ist noch Platz da (neu, einladen). Die Spiele vom 5.11.2026: Typen und Prüfer in `@/utils/gleichnisseNeu`,
 * die zwei Spiele des Umbaus (baugrund, einladen) in `@/utils/gleichnisseNeuC`. Die alten Spiele heimweg und entgegen (Typen, Bilder, Komponenten) bleiben im Repo, werden hier aber nicht mehr benutzt.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/gleichnisse/, images/abenteuer/spiele/gleichnisse/<spiel>/, audio/abenteuer/gleichnisse/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CoinGame, DigGame, Journey, OrderGame, VerseGame } from '@/types/adventure'
import type { CarryGame, HaltGame, InnGame, YieldGame } from '@/utils/gleichnisseNeu'
import type { GroundGame, InviteGame } from '@/utils/gleichnisseNeuC'
import { josef } from './josef'
import { GLEICHNISSE_PATH } from './gleichnissePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { gleichnisseEn } from './en/gleichnisse.en'
import { backdropOr } from '@/utils/gameBackground'

// Etappenbilder (Variante a, bei b mit Endung -b nach Antons Wahl): `images/abenteuer/gleichnisse/etappe-bild-NN.webp`, 960 × 640
const PICS = 'images/abenteuer/gleichnisse/'

const G = 'images/abenteuer/spiele/gleichnisse/'

/**
 * Etappe 1, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Nr. 22 (kopiert). Hintergrund ist das gemalte Ufer mit dem Acker am Hang (Bildauftrag). Die Sätze stehen wörtlich im Etappentext (das Bauskript prüft es).
 */
const VERS: VerseGame = {
  background: `${G}hintergrund/vers-hintergrund.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['„Einige Körner fielen auf den Weg. Da kamen die ', ' und fraßen sie auf.“'], words: ['Vögel', 'Fische', 'Schafe'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['„Andere aber fielen auf gutes ', '. Sie brachten ', ', manche hundertfach, manche sechzigfach und manche dreißigfach.“'], words: ['Land', 'Frucht', 'Steine', 'Dornen'], answers: [0, 1] }
  ]
}


/**
 * Etappe 3, "Das kleinste Korn" (alte Mechanik, Reihenfolge legen): Senfkorn in die Erde, Spross, Strauch, Baum mit Vögeln.
 * Runde 1 drei Karten mit Punkten, Runde 2 alle vier ohne Punkte. Bilder (Bildauftrag): `reihenfolge/karte-1..4.webp` (4:3).
 */
const REIHENFOLGE: OrderGame = {
  cards: [
    { id: 'korn', image: `${G}reihenfolge/karte-1.webp`, label: 'Ein Mann legt ein winziges Senfkorn in die Erde' },
    { id: 'spross', image: `${G}reihenfolge/karte-2.webp`, label: 'Ein kleiner grüner Spross wächst' },
    { id: 'strauch', image: `${G}reihenfolge/karte-3.webp`, label: 'Der Strauch wird groß' },
    { id: 'baum', image: `${G}reihenfolge/karte-4.webp`, label: 'Ein Baum mit Vögeln im Geäst' }
  ],
  rounds: [
    { hint: 'Runde 1: Lege die Bilder in die Reihenfolge der Geschichte. Die Punkte zeigen, wo sie hinkommen.', numbered: true, cards: ['spross', 'strauch', 'baum'] },
    { hint: 'Runde 2: Jetzt mit dem Anfang beim Senfkorn und ohne Punkte: Was kommt zuerst, was danach?', numbered: false, cards: ['korn', 'spross', 'strauch', 'baum'] }
  ]
}



/**
 * Etappe 4, "Der Schatz im Acker" (neu, `graben`, Mt 13,44-46): Runde 1 zwölf Erdhaufen auf dem Acker (4 x 3), unter einem liegt die Truhe; ein leeres Loch zeigt mit einem Pfeil zur Truhe (kein Verlust).
 * Runde 2 fünf Perlen auf dem Marktstand des Kaufmanns: die kostbarste ist die größte, runde, weiße (`perle-1`). Bilder (Bildauftrag): `graben/acker.webp`, `haufen`, `loch`, `truhe`, `truhe-offen`, `stand.webp`, `perle-1..5`.
 */
const GRABEN: DigGame = {
  field: `${G}graben/acker.webp`,
  mound: { image: `${G}graben/haufen.webp`, label: 'Ein Erdhaufen', w: 14 },
  hole: { image: `${G}graben/loch.webp`, label: 'Ein Loch im Acker', w: 14 },
  chest: { image: `${G}graben/truhe.webp`, label: 'Eine Truhe mit Eisenband', w: 16 },
  chestOpen: { image: `${G}graben/truhe-offen.webp`, label: 'Die offene Truhe mit Münzen', w: 18 },
  stall: `${G}graben/stand.webp`,
  pearls: [
    { image: `${G}graben/perle-1.webp`, label: 'Die größte, runde, weiß schimmernde Perle', w: 13 },
    { image: `${G}graben/perle-2.webp`, label: 'Eine kleinere Perle', w: 9 },
    { image: `${G}graben/perle-3.webp`, label: 'Eine graue Perle', w: 9 },
    { image: `${G}graben/perle-4.webp`, label: 'Eine schiefe Perle', w: 9 },
    { image: `${G}graben/perle-5.webp`, label: 'Eine kleine, matte Perle', w: 9 }
  ],
  rounds: [
    { kind: 'field', hint: 'Grabe nach dem Schatz. Der Pfeil im Loch zeigt dir den Weg.', treasure: [2, 1], cells: [[18, 28], [40, 28], [62, 28], [84, 28], [18, 55], [40, 55], [62, 55], [84, 55], [18, 82], [40, 82], [62, 82], [84, 82]] },
    { kind: 'pearls', hint: 'Tippe auf die kostbarste Perle.', best: 2, slots: [[14, 62], [32, 62], [50, 62], [68, 62], [86, 62]] }
  ]
}

/**
 * Etappe 9, "Die verlorene Münze" (neu, `muenze`, Lk 15,8-10): der dunkle Raum im Steinhaus, ein Tipp auf das Öllämpchen macht ihn hell, der Staub auf dem Boden wird mit dem Finger als Besen weggefegt (Raster wie beim Wischspiel);
 * ist die Stelle der Münze zu 60 % frei, blitzt sie auf, ein Tipp hebt sie auf (sie fliegt der Frau in die Hand). Runde 2: kleinerer Raum, zwei Lockvögel (Messingdeckel, Kiesel). Bilder (Bildauftrag):
 * `muenze/raum-1.webp`, `raum-2.webp`, `lampe`, `muenze`, `frau`, `besen`, `deckel`, `kiesel`.
 */
const MUENZE: CoinGame = {
  lamp: { image: `${G}muenze/lampe.webp`, label: 'Das Öllämpchen', w: 9, x: 20, y: 62 },
  coin: { image: `${G}muenze/muenze.webp`, label: 'Eine Silbermünze', w: 6 },
  woman: { image: `${G}muenze/frau.webp`, label: 'Die Frau, kniend, mit offener Hand', w: 16, x: 88, y: 96 },
  broom: { image: `${G}muenze/besen.webp`, label: 'Ein Besen', w: 12 },
  lid: { image: `${G}muenze/deckel.webp`, label: 'Ein glänzender Messingdeckel', w: 8 },
  pebble: { image: `${G}muenze/kiesel.webp`, label: 'Ein glänzender Kiesel', w: 6 },
  rounds: [
    { hint: 'Zünde das Licht an und fege den Staub weg. Wo liegt die Münze?', room: `${G}muenze/raum-1.webp`, coin: [58, 62] },
    { hint: 'Ein kleinerer Raum mit mehr Möbeln. Manches glänzt, ist aber keine Münze.', room: `${G}muenze/raum-2.webp`, coin: [32, 72], decoys: [{ kind: 'lid', x: 64, y: 50 }, { kind: 'pebble', x: 48, y: 82 }] }
  ]
}

/**
 * Etappe 2, "Hundertfach" (neu, `hundertfach`, Mt 13,8.23): auf dem gepflügten Acker stehen Ähren auf gutem Land (klein, mittel, groß: dreißig, sechzig, hundert Körner) und Saat, die nichts brachte
 * (verdorrt auf dem Fels, erstickt in den Dornen, der Vogel auf dem Weg). Ein Tipp auf eine Ähre macht sie zu ihren Körnern, sie fliegen in den Sack. Runde 2 in der Reihenfolge der Bibel (hundert, sechzig, dreißig).
 * Bilder (Bildauftrag S90): `hundertfach/acker.webp`, `aehre-30`, `aehre-60`, `aehre-100`, `fels`, `dorn`, `weg`, `korn`, `sack`. Typen und Prüfer: `@/utils/gleichnisseNeu`.
 */
const HUNDERTFACH: YieldGame = {
  field: `${G}hundertfach/acker.webp`,
  sprites: {
    y30: { image: `${G}hundertfach/aehre-30.webp`, label: 'Ein kleiner Halm mit drei Ähren', w: 15 },
    y60: { image: `${G}hundertfach/aehre-60.webp`, label: 'Ein Halm mit sechs Ähren', w: 15 },
    y100: { image: `${G}hundertfach/aehre-100.webp`, label: 'Ein großer Büschel mit vielen schweren Ähren', w: 15 },
    rock: { image: `${G}hundertfach/fels.webp`, label: 'Ein verdorrter Halm auf dem Fels', w: 15 },
    thorn: { image: `${G}hundertfach/dorn.webp`, label: 'Ein Halm, erstickt in den Dornen', w: 15 },
    path: { image: `${G}hundertfach/weg.webp`, label: 'Ein Vogel pickt die Körner auf dem Weg', w: 15 }
  },
  grain: { image: `${G}hundertfach/korn.webp`, label: 'Körner', w: 9 },
  sack: { image: `${G}hundertfach/sack.webp`, label: 'Der Sack für die Körner', w: 14, x: 89, y: 99 },
  rounds: [
    { hint: 'Tippe die reifen Ähren auf dem guten Land an. Was auf dem Fels, in den Dornen und auf dem Weg wächst, bringt keine Frucht.', plants: [{ kind: 'y30', x: 12, y: 55 }, { kind: 'rock', x: 34, y: 55 }, { kind: 'y60', x: 56, y: 55 }, { kind: 'y100', x: 78, y: 55 }, { kind: 'y100', x: 22, y: 77 }, { kind: 'thorn', x: 46, y: 77 }, { kind: 'y30', x: 70, y: 77 }, { kind: 'path', x: 12, y: 99 }, { kind: 'y60', x: 36, y: 99 }] },
    { hint: 'Jetzt wie in der Geschichte: erst die Ähren mit hundert Körnern, dann die mit sechzig, dann die mit dreißig.', ordered: true, plants: [{ kind: 'y60', x: 9, y: 54 }, { kind: 'y30', x: 27, y: 54 }, { kind: 'rock', x: 45, y: 54 }, { kind: 'y100', x: 63, y: 54 }, { kind: 'y30', x: 81, y: 54 }, { kind: 'y100', x: 18, y: 76 }, { kind: 'thorn', x: 36, y: 76 }, { kind: 'y60', x: 54, y: 76 }, { kind: 'path', x: 72, y: 76 }, { kind: 'y100', x: 90, y: 76 }, { kind: 'rock', x: 10, y: 98 }, { kind: 'y30', x: 30, y: 98 }, { kind: 'y60', x: 50, y: 98 }] }
  ]
}

/**
 * Etappe 6, "Anhalten" (neu, `anhalten`, Lk 10,33-34): die Straße nach Jericho von der Seite; gedrückt halten lässt den Esel des Samariters gehen, loslassen lässt ihn anhalten. Er soll genau neben dem Überfallenen
 * stehen bleiben (zu weit ist ein Fehler, er kehrt um). Runde 2: schneller, längerer Bremsweg, engere Stelle. Bilder (Bildauftrag S91/S92): `anhalten/strasse.webp`, `reiter`, `verletzter`, `kniet`, `esel`.
 */
const ANHALTEN: HaltGame = {
  background: `${G}anhalten/strasse.webp`,
  road: 84,
  rider: { image: `${G}anhalten/reiter.webp`, label: 'Der Samariter auf seinem Esel', w: 32 },
  man: { image: `${G}anhalten/verletzter.webp`, label: 'Der Mann, der überfallen wurde', w: 24 },
  donkey: { image: `${G}anhalten/esel.webp`, label: 'Der Esel des Samariters', w: 26 },
  kneel: { image: `${G}anhalten/kniet.webp`, label: 'Der Samariter kniet bei dem Mann und hilft ihm', w: 24 },
  rounds: [
    { hint: 'Halte gedrückt, damit der Esel geht. Lass rechtzeitig los, damit er genau neben dem Mann stehen bleibt.', start: 17, man: 72, spot: 50, tolerance: 5, speed: 14, accel: 30, brake: 22 },
    { hint: 'Jetzt ist der Esel schneller und braucht länger, bis er steht. Lass früher los.', start: 17, man: 64, spot: 41, tolerance: 3, speed: 20, accel: 36, brake: 16 }
  ]
}

/**
 * Etappe 7, "Zur Herberge" (neu, `herberge`, Lk 10,34): der Samariter führt seinen Esel zur Herberge, auf dem Esel sitzt der verbundene Mann. Der Esel geht von selbst; Steine und das Schaukeln
 * neigen den Mann nach vorn oder hinten, das Kind hält ihn gerade (links halten = nach hinten, rechts = nach vorn). Rutscht er, ist das ein Fehler. Runde 2: mehr Steine, er wackelt leichter.
 * Bilder (Bildauftrag S92): `herberge/weg.webp`, `esel`, `mann`, `samariter`, `stein-1`, `stein-2`.
 */
const HERBERGE: InnGame = {
  background: `${G}herberge/weg.webp`,
  road: 86,
  start: 14,
  gate: 67,
  donkey: { image: `${G}herberge/esel.webp`, label: 'Der Esel des Samariters', w: 22 },
  rider: { image: `${G}herberge/mann.webp`, label: 'Der verbundene Mann auf dem Esel', w: 15 },
  leader: { image: `${G}herberge/samariter.webp`, label: 'Der Samariter führt den Esel', w: 17 },
  seat: { x: 47, y: 43 },
  lead: 2,
  stones: [{ image: `${G}herberge/stein-1.webp`, label: 'Ein Stein', w: 4 }, { image: `${G}herberge/stein-2.webp`, label: 'Eine Steinplatte', w: 7 }],
  rounds: [
    { hint: 'Der Weg ist holprig. Neigt sich der Mann nach vorn, halte links. Neigt er sich nach hinten, halte rechts.', speed: 4, drift: 1.2, bumps: [{ x: 34, push: 40, stone: 0 }, { x: 46, push: -35, stone: 1 }, { x: 58, push: 45, stone: 0 }, { x: 70, push: -40, stone: 1 }] },
    { hint: 'Jetzt liegen mehr Steine auf dem Weg, und der Mann wackelt leichter.', speed: 4.5, drift: 2.4, bumps: [{ x: 26, push: 45, stone: 0 }, { x: 34, push: -50, stone: 1 }, { x: 42, push: 40, stone: 0 }, { x: 50, push: -45, stone: 0 }, { x: 58, push: 55, stone: 1 }, { x: 66, push: -40, stone: 0 }] }
  ]
}

/**
 * Etappe 8, "Heimtragen" (neu, `heimtragen`, Lk 15,5-6): der Hirte trägt das gefundene Schaf auf den Schultern nach Hause; die Weide zieht vorbei, ein Tipp lässt ihn über Felsen, Bäche und Dornen springen.
 * Am Ende stehen Freunde und Nachbarn vor dem Haus. Runde 2: schneller, mehr und breitere Hindernisse. Bilder (Bildauftrag S93): `heimtragen/weide.webp`, `hirte`, `steine`, `bach`, `dorn`, `zuhause`.
 */
const HEIMTRAGEN: CarryGame = {
  background: `${G}heimtragen/weide.webp`,
  road: 86,
  hero: { image: `${G}heimtragen/hirte.webp`, label: 'Der Hirte trägt das Schaf auf den Schultern', w: 20 },
  heroAt: 26,
  jump: 1.1,
  height: 26,
  sprites: { rock: `${G}heimtragen/steine.webp`, brook: `${G}heimtragen/bach.webp`, thorn: `${G}heimtragen/dorn.webp` },
  labels: { rock: 'Ein Haufen Felsbrocken', brook: 'Ein Bach', thorn: 'Ein Dornbusch' },
  sink: { brook: 1 },
  home: { image: `${G}heimtragen/zuhause.webp`, label: 'Das Haus mit den Freunden und Nachbarn', w: 30 },
  rounds: [
    { hint: 'Der Hirte trägt das Schaf nach Hause. Tippe, damit er über Felsen und Bäche springt.', speed: 18, home: 300, obstacles: [{ kind: 'rock', at: 95, w: 8 }, { kind: 'brook', at: 135, w: 9 }, { kind: 'rock', at: 175, w: 8 }, { kind: 'thorn', at: 212, w: 8 }, { kind: 'brook', at: 252, w: 9 }] },
    { hint: 'Jetzt geht er schneller. Über einen breiten Bach springst du früher ab.', speed: 22, home: 460, obstacles: [{ kind: 'rock', at: 95, w: 8 }, { kind: 'brook', at: 140, w: 12 }, { kind: 'thorn', at: 186, w: 9 }, { kind: 'rock', at: 230, w: 8 }, { kind: 'brook', at: 276, w: 12 }, { kind: 'thorn', at: 322, w: 9 }, { kind: 'rock', at: 366, w: 8 }, { kind: 'brook', at: 412, w: 12 }] }
  ]
}

/**
 * Etappe 11, "Das Haus auf dem Felsen" (neu, `baugrund`, Mt 7,24-27): das stille Tal mit Bauplätzen; ein Tipp lässt den Holzhammer klopfen (Fels klingt hart, Sand weich; kein Fehler), dann wird das Haus auf einen Platz gesetzt
 * (ziehen, oder antippen und den Platz antippen) und Regen, Wasser und Wind kommen nacheinander. Auf dem Fels steht das Haus; im Sand sinkt es ein (heil, ohne Schutt) und geht zurück in die Ablage (ein Fehler).
 * Runde 1 vier Plätze, ein Fels, so viele Klopfer wie man mag, das Ergebnis bleibt als Zeichen am Platz; Runde 2 sechs Plätze, zwei Felsen unter dünnem Sand, vier Klopfer, nur Ton und Wort.
 * Bilder (Bildauftrag, Codex): `baugrund/tal.webp`, `platz-fels`, `platz-sand`, `platz-verdeckt`, `haus`, `haus-schief`, `hammer`, `staub`, `funke`, `regen`, `wasser`, `wind`. Lagen: am gemalten Bild gemessen.
 */
const BAUGRUND: GroundGame = {
  background: `${G}baugrund/tal.webp`,
  tray: { x: 14, y: 97, w: 26 },
  sprites: {
    rock: { image: `${G}baugrund/platz-fels.webp`, label: 'Ein Bauplatz aus hartem Fels', w: 14 },
    sand: { image: `${G}baugrund/platz-sand.webp`, label: 'Ein Bauplatz aus weichem Sand', w: 14 },
    covered: { image: `${G}baugrund/platz-verdeckt.webp`, label: 'Ein Bauplatz, auf dem Sand liegt', w: 14 },
    house: { image: `${G}baugrund/haus.webp`, label: 'Das kleine Steinhaus', w: 22 },
    tilted: { image: `${G}baugrund/haus-schief.webp`, label: 'Das Haus, schief in den Sand gesunken', w: 22 },
    mallet: { image: `${G}baugrund/hammer.webp`, label: 'Der Holzhammer', w: 8 },
    puff: { image: `${G}baugrund/staub.webp`, label: 'Eine Staubwolke', w: 9 },
    spark: { image: `${G}baugrund/funke.webp`, label: 'Funken', w: 7 },
    rain: { image: `${G}baugrund/regen.webp`, label: 'Leichter Regen', w: 100 },
    water: { image: `${G}baugrund/wasser.webp`, label: 'Flaches klares Wasser', w: 100 },
    wind: { image: `${G}baugrund/wind.webp`, label: 'Wind mit Blättern', w: 100 }
  },
  rounds: [
    {
      hint: 'Klopfe den Boden ab und setze das Haus dorthin, wo es fest steht.',
      mark: true,
      plots: [
        { id: 'a', x: 62, y: 50, w: 14, ground: 'rock' },
        { id: 'b', x: 36, y: 56, w: 14, ground: 'sand' },
        { id: 'c', x: 82, y: 68, w: 14, ground: 'sand' },
        { id: 'd', x: 50, y: 84, w: 14, ground: 'sand' }
      ]
    },
    {
      hint: 'Du hast nur vier Klopfer. Wo ist der Fels?',
      mark: false, knocks: 4,
      plots: [
        { id: 'a', x: 32, y: 52, w: 14, ground: 'sand' },
        { id: 'b', x: 50, y: 43, w: 14, ground: 'sand' },
        { id: 'c', x: 69, y: 52, w: 14, ground: 'sand' },
        { id: 'd', x: 86, y: 64, w: 14, ground: 'rock', hidden: true },
        { id: 'e', x: 40, y: 70, w: 14, ground: 'rock', hidden: true },
        { id: 'f', x: 66, y: 82, w: 14, ground: 'sand' }
      ]
    }
  ]
}

/**
 * Etappe 12, "Es ist noch Platz da" (neu, `einladen`, Lk 14,17.21-23): Gäste winken kurz aus Türen, Toren und hinter Hecken; ein Tipp lädt einen ein, der Diener ruft „Kommt!“, der Gast hüpft an den langen Tisch und setzt sich,
 * die Lampe über seinem Platz geht an. Nichts geht verloren: wer nicht angetippt wird, geht weg und kommt nach einer Weile an anderer Stelle wieder. Zwölf Plätze (Mutter und Kind nehmen zwei).
 * Runde 1 „Straßen und Gassen“: sechs Gäste, zwei zugleich, fünf Sekunden; dann „Es ist noch Platz da!“. Runde 2 „Landstraßen und Zäune“: vier Gäste und ein Paar hinter Hecken und Zäunen, drei zugleich, dreieinhalb Sekunden; am Ende „Das Haus ist voll!“.
 * Bilder (Bildauftrag, Codex): `einladen/stadt.webp`, `land`, `tafel`, `hecke`, `zaun`, `lampe-aus`, `lampe-an`, `diener`, `gast-1..10` und `gast-N-sitzt`, `paar`, `paar-sitzt`. Lagen: am gemalten Bild gemessen.
 */
const EINLADEN: InviteGame = {
  tableSeats: [{ x: 5.3, y: 99.5 }, { x: 13.17, y: 99.5 }, { x: 21.04, y: 99.5 }, { x: 28.91, y: 99.5 }, { x: 36.78, y: 99.5 }, { x: 44.65, y: 99.5 }, { x: 52.52, y: 99.5 }, { x: 60.39, y: 99.5 }, { x: 68.26, y: 99.5 }, { x: 76.13, y: 99.5 }, { x: 84, y: 99.5 }, { x: 91.87, y: 99.5 }],
  table: { image: `${G}einladen/tafel.webp`, label: 'Der lange Tisch mit zwölf Plätzen', w: 100, x: 50, y: 100 },
  sprites: {
    g1: { wait: { image: `${G}einladen/gast-1.webp`, label: 'Eine Frau mit Korb winkt', w: 16 }, sit: { image: `${G}einladen/gast-1-sitzt.webp`, label: 'Eine Frau mit Korb sitzt am Tisch', w: 11.5 }, seats: 1 },
    g2: { wait: { image: `${G}einladen/gast-2.webp`, label: 'Ein Mann am Stock winkt', w: 16 }, sit: { image: `${G}einladen/gast-2-sitzt.webp`, label: 'Ein Mann am Stock sitzt am Tisch', w: 11.5 }, seats: 1 },
    g3: { wait: { image: `${G}einladen/gast-3.webp`, label: 'Ein Mann mit Wanderstab winkt', w: 16 }, sit: { image: `${G}einladen/gast-3-sitzt.webp`, label: 'Ein Mann mit Wanderstab sitzt am Tisch', w: 11.5 }, seats: 1 },
    g4: { wait: { image: `${G}einladen/gast-4.webp`, label: 'Ein Junge im geflickten Mantel winkt', w: 16 }, sit: { image: `${G}einladen/gast-4-sitzt.webp`, label: 'Ein Junge im geflickten Mantel sitzt am Tisch', w: 11.5 }, seats: 1 },
    g5: { wait: { image: `${G}einladen/gast-5.webp`, label: 'Eine alte Frau mit Kopftuch winkt', w: 16 }, sit: { image: `${G}einladen/gast-5-sitzt.webp`, label: 'Eine alte Frau mit Kopftuch sitzt am Tisch', w: 11.5 }, seats: 1 },
    g6: { wait: { image: `${G}einladen/gast-6.webp`, label: 'Ein Mann mit Wasserkrug winkt', w: 16 }, sit: { image: `${G}einladen/gast-6-sitzt.webp`, label: 'Ein Mann mit Wasserkrug sitzt am Tisch', w: 11.5 }, seats: 1 },
    g7: { wait: { image: `${G}einladen/gast-7.webp`, label: 'Ein Wanderer mit Reisebündel winkt', w: 16 }, sit: { image: `${G}einladen/gast-7-sitzt.webp`, label: 'Ein Wanderer mit Reisebündel sitzt am Tisch', w: 11.5 }, seats: 1 },
    g8: { wait: { image: `${G}einladen/gast-8.webp`, label: 'Ein Hirtenjunge mit Flöte winkt', w: 16 }, sit: { image: `${G}einladen/gast-8-sitzt.webp`, label: 'Ein Hirtenjunge mit Flöte sitzt am Tisch', w: 11.5 }, seats: 1 },
    g9: { wait: { image: `${G}einladen/gast-9.webp`, label: 'Eine Bäuerin mit Garbe winkt', w: 16 }, sit: { image: `${G}einladen/gast-9-sitzt.webp`, label: 'Eine Bäuerin mit Garbe sitzt am Tisch', w: 11.5 }, seats: 1 },
    g10: { wait: { image: `${G}einladen/gast-10.webp`, label: 'Ein Fischer mit Netz winkt', w: 16 }, sit: { image: `${G}einladen/gast-10-sitzt.webp`, label: 'Ein Fischer mit Netz sitzt am Tisch', w: 11.5 }, seats: 1 },
    pair: { wait: { image: `${G}einladen/paar.webp`, label: 'Eine Mutter mit ihrem Kind winkt', w: 21 }, sit: { image: `${G}einladen/paar-sitzt.webp`, label: 'Eine Mutter mit ihrem Kind sitzt am Tisch', w: 15 }, seats: 2 }
  },
  servant: { image: `${G}einladen/diener.webp`, label: 'Der Diener des Gastgebers winkt', w: 14, x: 91, y: 70 },
  lamp: { off: { image: `${G}einladen/lampe-aus.webp`, label: 'Eine Lampe, aus', w: 5.5 }, on: { image: `${G}einladen/lampe-an.webp`, label: 'Eine Lampe, an', w: 5.5 }, y: 71 },
  hedge: { image: `${G}einladen/hecke.webp`, label: 'Eine Hecke', w: 27 },
  fence: { image: `${G}einladen/zaun.webp`, label: 'Ein Zaun', w: 27 },
  rounds: [
    {
      hint: 'Tippe die Gäste an, die dir zuwinken.',
      scene: `${G}einladen/stadt.webp`,
      show: 5000,
      gap: 3000,
      atOnce: 2,
      spots: [{ x: 14, y: 76 }, { x: 28, y: 63 }, { x: 41, y: 74 }, { x: 55, y: 67 }, { x: 69, y: 75 }],
      guests: [
        { sprite: 'g1', spot: 0 },
        { sprite: 'g2', spot: 1 },
        { sprite: 'g3', spot: 2 },
        { sprite: 'g4', spot: 3 },
        { sprite: 'g5', spot: 4 },
        { sprite: 'g6', spot: 0 }
      ]
    },
    {
      hint: 'Jetzt hinaus auf die Landstraßen: Wer hinter einer Hecke winkt, kommt auch zum Tisch.',
      scene: `${G}einladen/land.webp`,
      show: 3500,
      gap: 2500,
      atOnce: 3,
      spots: [{ x: 12, y: 62, cover: 'hedge' }, { x: 26, y: 53, cover: 'fence' }, { x: 40, y: 62, cover: 'hedge' }, { x: 54, y: 54, cover: 'fence' }, { x: 68, y: 64, cover: 'hedge' }, { x: 80, y: 52, cover: 'fence' }],
      guests: [
        { sprite: 'g7', spot: 0, hidden: true },
        { sprite: 'g8', spot: 1, hidden: true },
        { sprite: 'pair', spot: 2, hidden: true },
        { sprite: 'g9', spot: 3, hidden: true },
        { sprite: 'g10', spot: 4, hidden: true }
      ]
    }
  ]
}

export const gleichnisse: Journey = {
  id: 'gleichnisse',
  title: 'Geschichten von Jesus',
  subtitle: 'Vom Sämann bis zum großen Fest',
  age: '8-10',
  downloadMb: 16, // gemessen am 10.11.2026 nach dem Umbau: journeyFiles() = 16,1 MB (davon 15,2 MB dieses Abenteuers; deutsche Aufnahmen, Karte, Spielbilder, Musik; vorher 18 geschaetzt)
  medal: `${PICS}medaille-v1.webp`, // Medaille 1 bis zu Antons Wahl
  // Geschenk-Ausmalbild: der große Senfbaum mit Vögeln und einem Beet (Konturzeichnung)
  gift: { title: 'Der Senfbaum', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in drei Stücken, 9920 × 1648 px, OpenAI-Bildmodell, Qualität max, mit zwölf Orten und dem Ziel) mit Stationen und Perlenweg aus gleichnissePath.ts
  map: {
    images: ['karte-pano-v1-1.webp', 'karte-pano-v1-2.webp', 'karte-pano-v2-3.webp'].map((f) => `images/abenteuer/gleichnisse/${f}`),
    ring: josef.map.ring,
    aspect: 9920 / 1648,
    widthPx: 9920,
    stages: [
      { x: 0.0968, y: 0.6371, d: 0.0339 },
      { x: 0.1462, y: 0.5947, d: 0.0339 },
      { x: 0.2016, y: 0.7100, d: 0.0339 },
      { x: 0.3508, y: 0.5461, d: 0.0339 },
      { x: 0.4234, y: 0.5704, d: 0.0339 },
      { x: 0.5081, y: 0.5977, d: 0.0339 },
      { x: 0.6179, y: 0.5856, d: 0.0339 },
      { x: 0.6714, y: 0.6007, d: 0.0339 },
      { x: 0.7389, y: 0.5947, d: 0.0339 },
      { x: 0.7964, y: 0.6189, d: 0.0339 },
      { x: 0.8770, y: 0.6675, d: 0.0339 },
      { x: 0.9345, y: 0.6614, d: 0.0339 }
    ],
    exam: { x: 0.9829, y: 0.7282, d: 0.0339 },
    path: GLEICHNISSE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01-b.webp`,
      title: 'Der Sämann geht aufs Feld',
      ref: 'Matthäus 13,1–8',
      text: [
        'Am Ufer des Sees drängen sich so viele Menschen, dass Jesus in ein Boot steigt. Er setzt sich, und alle hören ihm vom Strand aus zu.',
        'Jesus erzählt eine Geschichte. „Ein Sämann ging aufs Feld, um zu säen“, sagt er. „Einige Körner fielen auf den Weg. Da kamen die Vögel und fraßen sie auf.“',
        '„Andere fielen auf felsigen Boden, wo kaum Erde war. Sie gingen schnell auf, doch die Sonne verbrannte sie, denn sie hatten keine Wurzeln. Wieder andere fielen unter die Dornen, und die Dornen erstickten sie.“',
        '„Andere aber fielen auf gutes Land. Sie brachten Frucht, manche hundertfach, manche sechzigfach und manche dreißigfach.“'
      ],
      // Spiel: Lückenvers (lueckenvers, alt)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wo sitzt Jesus, als er erzählt?', options: ['in einem Boot', 'auf einem Berg', 'in einem Haus'], answer: 0 },
        { q: 'Was geschieht mit den Körnern auf dem Weg?', options: ['Die Vögel fressen sie.', 'Sie wachsen schnell.', 'Der Wind weht sie fort.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02-b.webp`,
      title: 'Wer Ohren hat',
      ref: 'Matthäus 13,9–11.18–23',
      text: [
        '„Wer Ohren hat zu hören, der höre!“, ruft Jesus der Menge zu. Danach treten die Jünger zu ihm. „Warum erzählst du ihnen in Geschichten?“, fragen sie. „Euch ist es gegeben, das Geheimnis des Himmelreichs zu verstehen“, antwortet Jesus. „So hört nun ihr die Geschichte vom Sämann.“',
        '„Der Same ist das Wort vom Himmelreich. Der Weg, das sind die Menschen, die es hören und nicht verstehen. Dann geht es wieder verloren. Im felsigen Boden hat das Wort keine Wurzeln. Wenn es schwer wird, geben sie schnell auf.“',
        '„Bei den Dornen ersticken die Sorgen dieser Welt und der Reichtum, der täuscht, das Wort. Das gute Land aber sind die Menschen, die das Wort hören, verstehen und Frucht bringen.“'
      ],
      // Spiel: Hundertfach (hundertfach, neu 5.11.2026)
      task: { kind: 'hundertfach', hint: 'Tippe die Ähren auf dem guten Land an.', yieldGame: HUNDERTFACH },
      questions: [
        { q: 'Was bedeutet der Same in der Geschichte?', options: ['das Wort vom Himmelreich', 'das Wetter', 'das Geld'], answer: 0 },
        { q: 'Wer ist das gute Land?', options: ['Menschen, die das Wort hören, verstehen und Frucht bringen', 'Menschen, die schnell aufgeben', 'Menschen, die nie zuhören'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03.webp`,
      title: 'Das kleinste Korn',
      ref: 'Matthäus 13,31–33',
      text: [
        'Jesus erzählt noch eine Geschichte. „Das Himmelreich ist wie ein Senfkorn“, sagt er. „Ein Mann nimmt es und sät es auf seinen Acker.“',
        '„Es ist das kleinste unter allen Samenkörnern. Wenn es aber wächst, ist es größer als alle Gemüsepflanzen und wird ein Baum.“',
        '„Die Vögel kommen und wohnen in seinen Zweigen“, sagt Jesus.',
        'Dann sagt er: „Das Himmelreich ist auch wie ein Sauerteig. Eine Frau mischt ihn unter drei Scheffel Mehl, bis der ganze Teig durchsäuert ist.“'
      ],
      // Spiel: Reihenfolge legen (reihenfolge, alt)
      task: { kind: 'reihenfolge', hint: 'Lege die vier Bilder in die Reihenfolge der Geschichte.', order: REIHENFOLGE },
      questions: [
        { q: 'Was sagt Jesus über das Senfkorn?', options: ['Es ist das kleinste unter allen Samenkörnern.', 'Es ist größer als ein Apfel.', 'Es ist so groß wie eine Faust.'], answer: 0 },
        { q: 'Was wird aus dem Senfkorn?', options: ['ein Baum', 'eine Blume', 'ein Stein'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-b.webp`,
      title: 'Der Schatz im Acker',
      ref: 'Matthäus 13,44–46',
      text: [
        'Später, im Haus, erzählt Jesus seinen Jüngern weiter. „Das Himmelreich ist wie ein Schatz, der in einem Acker vergraben liegt. Ein Mann findet ihn und deckt ihn wieder zu.“',
        'Voll Freude geht er hin, verkauft alles, was er hat, und kauft den Acker.',
        '„Und das Himmelreich ist wie ein Kaufmann, der schöne Perlen sucht“, sagt Jesus. „Als er eine ganz kostbare Perle findet, geht er hin, verkauft alles, was er hat, und kauft sie.“'
      ],
      // Spiel: Der Schatz im Acker (graben, neu)
      task: { kind: 'graben', hint: 'Tippe auf den Acker und grabe nach dem Schatz.', dig: GRABEN },
      questions: [
        { q: 'Wo liegt der Schatz?', options: ['im Acker', 'im Haus', 'im See'], answer: 0 },
        { q: 'Was tut der Mann vor Freude?', options: ['Er verkauft alles und kauft den Acker.', 'Er läuft davon.', 'Er verschenkt den Schatz.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05.webp`,
      title: 'Wer ist mein Nächster?',
      ref: 'Lukas 10,25–30',
      text: [
        'Ein Schriftgelehrter steht auf und will Jesus prüfen. „Meister“, fragt er, „was muss ich tun, damit ich das ewige Leben bekomme?“',
        '„Was steht im Gesetz geschrieben?“, fragt Jesus zurück. Der Mann antwortet: „Du sollst Gott lieben von ganzem Herzen und deinen Nächsten wie dich selbst.“ „Das ist richtig“, sagt Jesus. „Tu das, dann wirst du leben.“',
        'Doch der Schriftgelehrte fragt weiter: „Und wer ist mein Nächster?“ Da erzählt Jesus: „Ein Mann ging von Jerusalem nach Jericho hinab. Unterwegs überfielen ihn Räuber. Sie nahmen ihm alles weg und ließen ihn verletzt am Weg liegen.“'
      ],
      // nur Quiz (ruhig)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was fragt der Schriftgelehrte zuletzt?', options: ['Wer ist mein Nächster?', 'Wo liegt Jericho?', 'Wann kommt der König?'], answer: 0 },
        { q: 'Welchen Weg geht der Mann in der Geschichte?', options: ['von Jerusalem nach Jericho', 'von Nazareth nach Bethlehem', 'von Kapernaum nach Nain'], answer: 0 },
        { q: 'Was tun die Räuber?', options: ['Sie nehmen ihm alles weg.', 'Sie geben ihm Brot.', 'Sie bringen ihn nach Hause.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06.webp`,
      title: 'Sie gehen vorbei',
      ref: 'Lukas 10,31–34',
      text: [
        'Jesus erzählt weiter. Zufällig kommt ein Priester dieselbe Straße hinunter. Ein Priester dient im Tempel. Er sieht den Verletzten am Weg liegen und geht vorbei. Dann kommt ein Levit, auch ein Diener des Tempels. Er sieht den Mann und geht ebenfalls weiter.',
        'Dann kommt ein Samariter, der auf Reisen ist. Er sieht den Mann am Weg, und er hat Mitleid mit ihm.',
        'Er geht zu ihm hin und verbindet seine Wunden. Er gießt Öl und Wein darauf.'
      ],
      // Spiel: Anhalten (anhalten, neu 5.11.2026)
      task: { kind: 'anhalten', hint: 'Halte gedrückt, dann reitet der Samariter. Lass los, dann hält er an.', halt: ANHALTEN },
      questions: [
        { q: 'Wer geht zuerst vorbei?', options: ['ein Priester', 'ein Soldat', 'ein Hirte'], answer: 0 },
        { q: 'Was tut der Samariter, als er den Mann sieht?', options: ['Er hat Mitleid und geht zu ihm.', 'Er geht schnell weiter.', 'Er ruft die Räuber.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07.webp`,
      title: 'Pflege ihn',
      ref: 'Lukas 10,34–37',
      text: [
        'Jesus erzählt weiter. Der Samariter hebt den Verletzten auf sein Tier und bringt ihn in eine Herberge. Dort kümmert er sich um ihn.',
        'Am nächsten Tag reist er weiter. Er gibt dem Wirt zwei Silbermünzen. „Pflege ihn“, sagt er. „Wenn es mehr kostet, bezahle ich es, wenn ich zurückkomme.“',
        'Dann fragt Jesus den Schriftgelehrten: „Wer von den dreien war der Nächste von dem, der unter die Räuber fiel?“ „Der, der Erbarmen mit ihm hatte“, antwortet der Mann.',
        '„Dann geh hin und tu das auch“, sagt Jesus.'
      ],
      // Spiel: Zur Herberge (herberge, neu 5.11.2026)
      task: { kind: 'herberge', hint: 'Halte den Mann auf dem Esel gerade, bis ihr an der Herberge seid.', inn: HERBERGE },
      questions: [
        { q: 'Wohin bringt der Samariter den Verletzten?', options: ['in eine Herberge', 'nach Jerusalem', 'zum Priester'], answer: 0 },
        { q: 'Was gibt er dem Wirt?', options: ['zwei Silbermünzen', 'seinen Mantel', 'einen Esel'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08-b.webp`,
      title: 'Das verlorene Schaf',
      ref: 'Lukas 15,1–7',
      text: [
        'Viele Zöllner und Sünder kommen zu Jesus, um ihm zuzuhören. Die Pharisäer und Schriftgelehrten murren: „Dieser nimmt die Sünder an und isst mit ihnen.“',
        'Da erzählt Jesus: „Wer von euch hat hundert Schafe und verliert eins? Lässt er nicht die neunundneunzig zurück und sucht das eine, bis er es findet?“',
        '„Wenn er es gefunden hat, legt er es voll Freude auf seine Schultern. Er ruft seine Freunde und Nachbarn: ‚Freut euch mit mir! Ich habe mein Schaf gefunden.‘ Ich sage euch: So ist im Himmel Freude über einen Sünder, der umkehrt.“'
      ],
      // Spiel: Heimtragen (heimtragen, neu 5.11.2026)
      task: { kind: 'heimtragen', hint: 'Tippe, damit der Hirte mit dem Schaf springt.', carryHome: HEIMTRAGEN },
      questions: [
        { q: 'Wie viele Schafe hat der Hirte?', options: ['hundert', 'zehn', 'zwölf'], answer: 0 },
        { q: 'Was tut er, als ein Schaf fehlt?', options: ['Er sucht es, bis er es findet.', 'Er wartet zu Hause.', 'Er kauft ein neues.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09.webp`,
      title: 'Die verlorene Münze',
      ref: 'Lukas 15,8–10',
      text: [
        '„Oder eine Frau hat zehn Silbermünzen“, erzählt Jesus weiter. „Eine davon verliert sie. Nun hat sie nur noch neun.“',
        '„Da zündet sie ein Licht an und kehrt das ganze Haus. Sie sucht mit großem Eifer, bis sie die Münze findet.“',
        '„Wenn sie die Münze gefunden hat, ruft sie ihre Freundinnen und Nachbarinnen: ‚Freut euch mit mir! Ich habe die Münze gefunden, die ich verloren hatte.‘ Ich sage euch: Auch vor den Engeln Gottes ist Freude über einen Sünder, der umkehrt.“'
      ],
      // Spiel: Die verlorene Münze (muenze, neu)
      task: { kind: 'muenze', hint: 'Fege den Staub weg und finde die Münze.', coin: MUENZE },
      questions: [
        { q: 'Wie viele Silbermünzen hat die Frau?', options: ['zehn', 'fünf', 'hundert'], answer: 0 },
        { q: 'Wie sucht die Frau die Münze?', options: ['Sie zündet ein Licht an und kehrt das Haus.', 'Sie geht auf den Markt.', 'Sie wartet bis zum Morgen.'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10-v2.webp`,
      title: 'Hab Geduld mit mir',
      ref: 'Matthäus 18,21–34',
      text: [
        'Petrus fragt Jesus: „Herr, wie oft muss ich meinem Bruder vergeben, wenn er mir Unrecht tut? Genügt es siebenmal?“ „Nein“, sagt Jesus, „nicht siebenmal, sondern siebzigmal siebenmal.“ Dann erzählt Jesus eine Geschichte.',
        '„Ein König will wissen, wie viel Geld ihm seine Diener schulden“, erzählt Jesus. „Man bringt ihm einen Diener, der schuldet ihm zehntausend Pfund, unvorstellbar viel Geld. Er kann es nicht bezahlen. Er wirft sich vor dem König nieder. ‚Herr, hab Geduld mit mir!‘, bittet er. ‚Ich will dir alles bezahlen.‘ Da hat der König Mitleid und vergibt ihm alle Schulden.“',
        '„Als der Diener hinausgeht, trifft er einen zweiten Diener. Der schuldet ihm nur hundert Groschen. Der erste Diener packt ihn am Kragen. ‚Bezahle, was du mir schuldig bist!‘, ruft er. Der zweite Diener fällt nieder. ‚Hab Geduld mit mir!‘, bittet er. ‚Ich will dir alles bezahlen.‘ Aber der erste Diener will nicht warten. Er bringt ihn ins Gefängnis, bis alles bezahlt ist.“',
        '„Andere Diener sehen es und werden sehr traurig. Sie gehen zum König und erzählen ihm alles. Da lässt der König den ersten Diener rufen. ‚Du böser Diener!‘, sagt er. ‚Alle deine Schulden habe ich dir vergeben. Hättest du nicht auch Mitleid mit dem zweiten Diener haben sollen, wie ich mit dir?‘“',
        '„Der König ist sehr zornig. Er schickt den ersten Diener ins Gefängnis, bis alles bezahlt ist.“'
      ],
      // nur Quiz (ernste Stelle)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie oft soll man vergeben, sagt Jesus?', options: ['siebzigmal siebenmal', 'nur siebenmal', 'nur einmal'], answer: 0 },
        { q: 'Was tut der König, als der Diener ihn bittet?', options: ['Er vergibt ihm alle Schulden.', 'Er schickt ihn fort.', 'Er verlangt noch mehr Geld.'], answer: 0 },
        { q: 'Was tut der erste Diener mit dem zweiten Diener?', options: ['Er bringt ihn ins Gefängnis.', 'Er lädt ihn zum Essen ein.', 'Er schenkt ihm viel Geld.'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11-v2.webp`,
      title: 'Das Haus auf dem Felsen',
      ref: 'Matthäus 7,24–29',
      text: [
        'Jesus sitzt auf einem Berg. Viele Menschen haben ihm zugehört, und nun erzählt er ihnen noch von zwei Männern. Beide bauen ein Haus.',
        '„Der eine Mann ist klug“, sagt Jesus. „Er baut sein Haus auf einen Felsen, auf einen großen, harten Stein. Dann fällt ein Regen, Wasser kommt heran, und der Wind stößt an das Haus. Aber das Haus bleibt stehen, denn es steht auf dem Felsen.“',
        '„Der andere Mann ist nicht klug. Er baut sein Haus auf Sand. Wieder fällt Regen, wieder kommt Wasser, wieder stößt der Wind an das Haus. Da stürzt es ein.“',
        '„Wer meine Worte hört und tut sie“, sagt Jesus, „der ist wie der kluge Mann. Und wer sie hört und tut sie nicht, der ist wie der andere Mann.“ Als Jesus aufhört zu reden, staunen alle Menschen. Jesus spricht nicht wie ihre Lehrer, sondern mit Macht.'
      ],
      // Spiel: Wo steht das Haus sicher? (baugrund, neu 10.11.2026)
      task: { kind: 'baugrund', hint: 'Klopfe den Boden ab und setze das Haus dorthin, wo es fest steht.', ground: BAUGRUND },
      questions: [
        { q: 'Wo sitzt Jesus, als er die Geschichte erzählt?', options: ['auf einem Berg', 'in einem Boot', 'in einem Haus'], answer: 0 },
        { q: 'Wer ist wie der kluge Mann, sagt Jesus?', options: ['wer seine Worte hört und tut', 'wer am meisten Geld hat', 'wer am lautesten redet'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12-v2.webp`,
      title: 'Es ist noch Platz da',
      ref: 'Lukas 14,15–23',
      text: [
        'Jesus ist bei einem Essen zu Gast. Ein anderer Gast sagt: „Glücklich ist, wer bei Gott am Tisch sitzen darf!“ Da erzählt Jesus: „Ein Mann gab ein großes Festessen und lud viele Gäste ein.“',
        '„Als alles bereit ist, schickt der Gastgeber seinen Diener zu den Gästen: ‚Kommt, es ist alles bereit!‘ Aber einer nach dem anderen sagt ab.“',
        '„‚Ich habe einen Acker gekauft und muss ihn ansehen‘, sagt der erste. ‚Ich habe fünf Paar Ochsen gekauft und will sie ausprobieren‘, sagt der zweite. ‚Ich habe geheiratet, darum kann ich nicht kommen‘, sagt der dritte.“',
        '„Der Diener erzählt dem Gastgeber alles. Da wird der Gastgeber zornig. ‚Geh schnell auf die Straßen und Gassen der Stadt‘, sagt er. ‚Hol die Armen, die Lahmen und die Blinden herein!‘ Der Diener geht und tut es.“',
        '„‚Herr, es ist geschehen, was du befohlen hast‘, sagt der Diener. ‚Aber es ist noch Platz da.‘ ‚Dann geh hinaus auf die Landstraßen und an die Zäune‘, sagt der Gastgeber. ‚Bitte alle dringend, hereinzukommen. Mein Haus soll voll werden!‘“'
      ],
      // Spiel: Kommt, es ist alles bereit! (einladen, neu 10.11.2026)
      task: { kind: 'einladen', hint: 'Lade die Gäste ein, bis der Tisch voll ist.', invite: EINLADEN },
      questions: [
        { q: 'Was ruft der Diener den Gästen zu?', options: ['„Kommt, es ist alles bereit!“', '„Bringt Brot mit!“', '„Wartet noch einen Tag!“'], answer: 0 },
        { q: 'Wen soll der Diener von den Straßen und Gassen holen?', options: ['die Armen, die Lahmen und die Blinden', 'die Soldaten und die Hirten', 'die Nachbarn und die Freunde'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Was geschieht mit den Körnern, die auf den Weg fallen?', options: ['Die Vögel fressen sie.', 'Sie wachsen hundertfach.', 'Der Regen spült sie fort.'], answer: 0 },
    { q: 'Was wird aus dem kleinen Senfkorn?', options: ['ein großer Baum', 'eine Blume', 'ein Stein'], answer: 0 },
    { q: 'Was tut der Mann, der den Schatz im Acker findet?', options: ['Er verkauft alles und kauft den Acker.', 'Er läuft davon.', 'Er verschenkt den Schatz.'], answer: 0 },
    { q: 'Wer hilft dem überfallenen Mann?', options: ['ein Samariter', 'ein Priester', 'ein Levit'], answer: 0 },
    { q: 'Wie sucht die Frau ihre verlorene Münze?', options: ['Sie zündet ein Licht an und kehrt das Haus.', 'Sie gräbt im Garten.', 'Sie wartet bis zum Morgen.'], answer: 0 },
    { q: 'Was sagt der Gastgeber, als noch Platz im Haus ist?', options: ['Mein Haus soll voll werden.', 'Schließt die Tür.', 'Das Fest ist vorbei.'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of gleichnisse.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3", "-v2" for the rebuilt stages 10 to 12: a new name for the cache of the phone); until they are made the app reads with the voice of the device.
// Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
const RECORDING_VERSION: Record<number, string> = { 10: 'v2', 11: 'v2', 12: 'v2' }
for (const s of gleichnisse.stages) {
  const file = `audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-${RECORDING_VERSION[s.id] ?? 'v1'}.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: three pieces made with Google's Lyria 3.5 (the field by the lake, the road to Jericho, the feast of the father); they follow one another at random
gleichnisse.music = [
  'audio/abenteuer/gleichnisse/musik-acker-v1.mp3',
  'audio/abenteuer/gleichnisse/musik-strasse-v1.mp3',
  'audio/abenteuer/gleichnisse/musik-fest-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(gleichnisse, gleichnisseEn)
