/**
 * Abenteuer "Adam und Eva" (1. Mose 1–3) für 8 bis 10 Jahre: 9 Etappen. Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * GERÜST: die Etappen stehen mit Titel und Bibelstelle da (`soon: true`, bis Texte, Fragen, Spiele und Bilder eingebaut sind). Quelle des
 * Plans: D:/Claude/Abenteuer-Adam-Eva/ETAPPENPLAN.md. Der Einbau der fertigen Daten (Texte, Fragen, Aufgaben, Karte, Bilder, Töne) kommt
 * auf Nachricht der Leitung; bis dahin hat die Reise keine gemalte Karte und zeigt sich als Liste (siehe AppAdventureView).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/adam-eva/, images/abenteuer/spiele/adam-eva/<spiel>/, audio/abenteuer/adam-eva/.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 */
import type { AdventureStage, Journey } from '@/types/adventure'
import { ADAM_EVA_PATH } from './adamEvaPath'
import { localize } from './localize'
import { adamEvaEn } from './en/adamEva.en'

const IMG = 'images/abenteuer/adam-eva/'

/** Eine Etappe, die noch nicht gebaut ist: Titel und Bibelstelle stehen, alles andere kommt beim Einbau. */
const todo = (id: number, title: string, ref: string): AdventureStage => ({
  id,
  title,
  ref,
  text: [],
  task: { kind: 'quiz' },
  questions: [],
  soon: true
})

export const adamEva: Journey = {
  id: 'adam-eva',
  title: 'Adam und Eva',
  subtitle: 'Der Garten Eden',
  age: '8-10',
  downloadMb: 1, // beim Einbau neu zählen (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Der Garten Eden (Lichtung mit Strom, Bäumen und warmem Morgenlicht, ohne Menschen); kommt aus der Bildarbeit
  // Geschenk-Ausmalbild: Adam und Eva im Garten mit den Tieren, im Hintergrund der Baum des Lebens
  gift: { title: 'Adam und Eva im Garten', image: `${IMG}geschenk.webp` },
  // noch keine gemalte Karte (images leer): die Reise zeigt sich als Liste; Stationen und Perlenweg kommen mit dem Panorama
  map: {
    images: [],
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 1,
    stages: [],
    exam: { x: 0, y: 0, d: 0 },
    path: ADAM_EVA_PATH
  },
  stages: [
    todo(1, 'Am Anfang', '1. Mose 1,1–13'),
    todo(2, 'Sonne, Mond und Sterne', '1. Mose 1,14–23'),
    todo(3, 'Tiere und Menschen', '1. Mose 1,24–2,3'),
    todo(4, 'Der Garten Eden', '1. Mose 2,4–17'),
    todo(5, 'Adam gibt den Tieren Namen', '1. Mose 2,18–20'),
    todo(6, 'Eva', '1. Mose 2,21–25'),
    todo(7, 'Die Schlange', '1. Mose 3,1–7'),
    todo(8, 'Wo bist du?', '1. Mose 3,8–21'),
    todo(9, 'Der Weg aus dem Garten', '1. Mose 3,22–24')
  ],
  exam: []
}

// the English texts (title, stages) lie over the German ones; the screens show them when the app is English
localize(adamEva, adamEvaEn)
