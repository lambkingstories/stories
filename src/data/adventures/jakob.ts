/**
 * Abenteuer "Jakob" (1. Mose 25,19–34; 27; 28,10–22; 29–31; 32; 33,1–11; 35; 37,1–4) für 8 bis 10 Jahre: 12 Etappen (Ausbau am 20.10.2026, 1. Mose 25 bis 37), Untertitel "Ein Weg mit Umwegen". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Jakob/ENTWURF_Jakob_v2.md (Text-Sitzung, 20.10.2026), Plan: ETAPPENPLAN-v2-12-Etappen.md. Die richtige Antwort steht in den Daten
 * IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Zählen (alt), 2 nur Quiz, 3 Treppe zusammenschieben (neu), 4 Brunnen kurbeln (neu),
 * 5 Morgenrot halten (neu), 6 Puzzle (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/jakob/, images/abenteuer/spiele/jakob/<spiel>/, audio/abenteuer/jakob/.
 *
 * STAND 20.10.2026 (Ausbau auf 12 Etappen): Die Etappen 5 bis 9 und 12 haben bis zum Einbau ihrer Spiele und Bilder eine Quiz-Aufgabe (PLATZHALTER) und ein vorhandenes Etappenbild; die Karte (6 Stationen) bleibt unverändert.
 * Davor: alle Bilder (Panorama, Etappenbilder, Medaille, Geschenk, Spielbilder), Messwerte und Vorlese-Aufnahmen (Deutsch und Englisch) sind eingebaut, die Etappen sind spielbar.
 * Das Abenteuer ist aber nicht öffentlich: es ist hinter `comingSoon` und dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { CrankGame, HoldGame, Journey, SlideGame } from '@/types/adventure'
import { JAKOB_PATH } from './jakobPath'
import { localize } from './localize'
import { jakobEn } from './en/jakob.en'

const IMG = 'images/abenteuer/jakob/'
const G = 'images/abenteuer/spiele/jakob/'
const REC = 'audio/abenteuer/jakob/'
/** `true` = die Etappen sind noch nicht spielbar (Gerüst); jetzt sind alle Bilder und Töne eingebaut. */
const SOON = false

/**
 * Etappe 1, "Zählen": Jakobs Schafe vor dem Zelt (Etappenbild 1), jedes angetippt und mitgezählt. Das Zählspiel hat nur eine Szene (keine Runden).
 * Das Schaf ist das aus Noah (Kopie unter `zaehlen/`); es ist kein Bild neu zu malen.
 */

/**
 * Etappe 3, "Treppe zusammenschieben": das Etappenbild 3 (Nachtlandschaft mit der Himmelsleiter) wird von der App in Kacheln geschnitten und gemischt (`scramble`, mit festem
 * `seed`), eine Kachel fehlt. Runde 1 3 × 2, Runde 2 4 × 3 Kacheln. Es ist kein Spielbild neu zu malen.
 */
const SCHIEBEN: SlideGame = {
  image: `${IMG}etappe-bild-03.webp`,
  rounds: [
    { hint: 'Schiebe eine Kachel in die freie Lücke.', cols: 3, rows: 2, moves: 24, seed: 7 },
    { hint: 'Jetzt sind es mehr Kacheln.', cols: 4, rows: 3, moves: 80, seed: 11 }
  ]
}

/**
 * Etappe 4, "Brunnen kurbeln": der Brunnen im Etappenbild 4 mit einer Kurbel, einem Eimer am Seil und einem Trog (Bildauftrag J10). Runde 1 ein Eimer, Runde 2 drei.
 * Die Plätze (Kurbelmitte, Seil x und Eimer oben/unten, Trog Mitte x, y und Breite; Prozent des Etappenbildes 4) sind die Messwerte aus `kurbel/kurbel-messung.json`; der Trog (dort als linke Kante x 62, Unterkante y 97,
 * Breite 23, Höhe 2:1 gemessen) ist auf seine Mitte umgerechnet: x 62 + 11,5, y 97 - 8,6. Der Trog steht am Fuß der rechten Brunnenwand (die Lage links aus dem Bildlauf lag auf den Schafsköpfen).
 */
const KURBEL: CrankGame = {
  background: `${IMG}etappe-bild-04.webp`,
  crank: `${G}kurbel/kurbel.webp`,
  bucket: `${G}kurbel/eimer.webp`,
  troughEmpty: `${G}kurbel/trog-leer.webp`,
  troughFull: `${G}kurbel/trog-voll.webp`,
  crankAt: [44, 82],
  bucketAt: [59, 63, 75],
  troughAt: [73.5, 88.4, 23],
  rounds: [
    { hint: 'Hole einen Eimer Wasser für die Schafe.', buckets: 1 },
    { hint: 'Jetzt trinkt die ganze Herde: drei Eimer.', buckets: 3 }
  ]
}

/**
 * Etappe 5, "Morgenrot halten": das Flussufer bei Nacht (Etappenbild 5, von der App abgedunkelt und aufgehellt) mit einem sanften Licht (Bildauftrag J11); kein Gegner, keine Gestalt.
 * Runde 1 bleibt das Licht stehen (10 Sekunden Halten), Runde 2 wandert es das Ufer entlang (15 Sekunden). Lage und Weg des Lichts sind die Messwerte aus `halten/halten-messung.json` (Prozent des Etappenbildes 5, im Ufersand vor Jakobs Füßen, von links nach rechts).
 */
const HALTEN: HoldGame = {
  background: `${IMG}etappe-bild-05.webp`,
  spark: `${G}halten/funke.webp`,
  start: [22, 89],
  rounds: [
    { hint: 'Lege den Finger auf das Licht und halte es.', seconds: 10 },
    { hint: 'Jetzt wandert das Licht am Ufer: geh mit.', seconds: 15, path: [[22, 89], [29, 92], [36, 94], [43, 95], [50, 95], [57, 95], [64, 94], [71, 93]] }
  ]
}

export const jakob: Journey = {
  id: 'jakob',
  title: 'Jakob',
  subtitle: 'Ein Weg mit Umwegen',
  age: '8-10',
  downloadMb: 10, // 9,7 MB gezählt am 20.10.2026 nach dem Ausbau auf 12 Etappen (der Test sagt die echte Größe)
  medal: `${IMG}medaille.webp`, // Jakob und die Himmelsleiter (Treppe aus Steinen im Sternenlicht)
  // Geschenk-Ausmalbild: Jakob und die Himmelsleiter im Traum (Treppe aus Steinen, Sterne, Tiere der Herde schlafend, friedlich)
  gift: { title: 'Jakob und die Himmelsleiter im Traum', image: `${IMG}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 4944 × 821 px) mit Stationen und Perlenweg aus fertig/messdaten.json und jakobPath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `${IMG}karte-pano-${n}.webp`),
    ring: 'images/abenteuer/josef/medaillon-ring.webp',
    aspect: 4944 / 821,
    widthPx: 4944,
    stages: [
      { x: 0.1416, y: 0.6456, d: 0.0339 },
      { x: 0.2528, y: 0.6456, d: 0.0339 },
      { x: 0.3904, y: 0.6151, d: 0.0339 },
      { x: 0.5138, y: 0.5627, d: 0.0339 },
      { x: 0.7282, y: 0.609, d: 0.0339 },
      { x: 0.8212, y: 0.5968, d: 0.0339 }
    ],
    exam: { x: 0.981, y: 0.5847, d: 0.0339 },
    path: JAKOB_PATH
  },
  stages: [
    {
      id: 1,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Zwillinge',
      ref: '1. Mose 25,19–34',
      audio: `${REC}geschichte-01-v2.mp3`,
      text: [
        'Isaak, auf den Abraham einst so lange gewartet hat, ist erwachsen geworden und hat Rebekka geheiratet. Auch die beiden müssen lange auf ein Kind warten, und Isaak betet zu Gott. Gott erhört ihn, und Rebekka bekommt Zwillinge.',
        'Schon bei der Geburt ist zu sehen, wie verschieden die beiden Jungen sind. Der Erste kommt rötlich zur Welt, über und über behaart wie ein Pelz, und sie nennen ihn Esau. Gleich hinter ihm kommt sein Bruder, der mit der Hand die Ferse des Erstgeborenen umklammert, und ihn nennen sie Jakob.',
        'Die Jungen wachsen heran. Esau wird ein Jäger, der am liebsten draußen auf dem Feld ist, und Jakob bleibt ruhig bei den Zelten. Isaak hat Esau besonders gern, Rebekka dagegen Jakob.',
        'Eines Tages kommt Esau müde und hungrig von der Jagd heim, und Jakob hat gerade ein Linsengericht gekocht. „Gib mir schnell etwas von dem Roten da, ich bin völlig erschöpft!“, bittet Esau. „Das bekommst du“, sagt Jakob, „wenn du mir dein Erstgeburtsrecht gibst.“ Das ist der besondere Platz des Ältesten in der Familie. „Ich komme ja um vor Hunger“, ruft Esau, „was nützt es mir da?“ Er schwört es Jakob, isst und trinkt und geht davon. Ihm ist sein Erstgeburtsrecht nicht wichtig.'
      ],
      task: { kind: 'zaehlen', hint: 'Tippe die Schafe an und zähle sie.', count: 8, image: `${G}zaehlen/schaf.webp`, background: `${IMG}etappe-bild-01.webp` },
      questions: [
        { q: 'Wie heißen die Zwillinge von Isaak und Rebekka?', options: ['Esau und Jakob', 'Isaak und Lot', 'Kain und Abel'], answer: 0 },
        { q: 'Was gibt Esau für das Linsengericht her?', options: ['sein Erstgeburtsrecht', 'sein Zelt', 'seinen Bogen'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 2,
      image: `${IMG}etappe-bild-02.webp`,
      title: 'Der Segen',
      ref: '1. Mose 27,1–45 (gekürzt)',
      audio: `${REC}geschichte-02-v2.mp3`,
      text: [
        'Isaak ist alt geworden, und seine Augen sind so schwach, dass er kaum noch etwas sehen kann. Eines Tages ruft er Esau zu sich: „Mein Sohn, geh auf die Jagd und bereite mir mein Lieblingsessen zu. Dann will ich dich segnen, bevor ich sterbe.“',
        'Rebekka hat es gehört. Sie sagt zu Jakob: „Hol du dir den Segen an Esaus Stelle! Ich koche das Essen, und du bringst es deinem Vater.“ Jakob zögert, denn sein Vater könnte ihn erkennen. Doch Rebekka bindet ihm Ziegenfell um Hände und Hals, damit er so rau ist wie Esau, und er zieht Esaus Kleider an.',
        'So tritt Jakob vor seinen Vater. „Wer bist du, mein Sohn?“, fragt Isaak. „Ich bin Esau, dein Ältester“, antwortet Jakob. Das ist nicht wahr. Isaak wundert sich über die Stimme, aber die Hände fühlen sich an wie Esaus Hände. Da segnet er ihn.',
        'Kaum ist Jakob gegangen, kommt Esau mit dem Essen. Als Isaak merkt, was geschehen ist, erschrickt er sehr, und Esau ruft voller Schmerz: „Segne mich auch, Vater!“ Aber der Segen ist schon vergeben. Esau ist so zornig, dass Rebekka Angst um Jakob bekommt und ihn zu ihrem Bruder Laban nach Haran schickt, weit weg.',
        'Jakob packt sein Bündel und geht. Er hat seinen Vater getäuscht, und das hat Folgen: Er muss sein Zuhause verlassen.'
      ],
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer ist alt und kann kaum noch sehen?', options: ['Isaak', 'Laban', 'Esau'], answer: 0 },
        { q: 'Was legt sich Jakob auf Hände und Hals?', options: ['Ziegenfell', 'Mehl', 'Lehm'], answer: 0 },
        { q: 'Wohin schickt Rebekka Jakob?', options: ['zu ihrem Bruder Laban', 'zu Esau', 'ans Meer'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 3,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Die Himmelsleiter',
      ref: '1. Mose 28,10–22',
      audio: `${REC}geschichte-03-v2.mp3`,
      text: [
        'Jakob wandert viele Tage allein, weg von zu Hause. Als die Sonne untergeht, ist weit und breit kein Dach in Sicht. So sucht er sich einen Platz zwischen den Steinen, schiebt sich einen Stein unter den Kopf und schläft ein.',
        'Da hat er einen Traum. Auf der Erde steht eine Treppe, deren oberes Ende bis in den Himmel reicht, und Engel Gottes steigen auf ihr hinauf und herab. In der Nacht leuchtet sie sanft.',
        'Und oben spricht Gott zu ihm: „Ich bin der Gott deiner Väter Abraham und Isaak. Das Land, auf dem du liegst, will ich dir und deinen Nachkommen geben. Sie werden so zahlreich sein wie der Staub auf der Erde, und durch dich sollen alle Familien auf der Erde gesegnet werden. Sieh, ich bin bei dir und behüte dich, wohin du auch gehst. Ich bringe dich wieder in dieses Land zurück und verlasse dich nicht.“',
        'Als Jakob aufwacht, ist er ganz still vor Staunen. „Gott ist an diesem Ort“, sagt er, „und ich habe es nicht gewusst!“ Gleich am Morgen stellt er den Stein, auf dem sein Kopf gelegen hat, als Zeichen auf und gießt Öl darüber. Den Ort nennt er Bethel, das heißt „Haus Gottes“. Dann zieht er weiter, nicht mehr so allein wie am Abend zuvor.'
      ],
      task: { kind: 'schieben', hint: 'Schiebe die Kacheln, bis die Treppe zum Himmel wieder ganz ist.', slide: SCHIEBEN },
      questions: [
        { q: 'Was nimmt Jakob als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
        { q: 'Wie nennt Jakob den Ort?', options: ['Bethel', 'Haran', 'Mamre'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 4,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Am Brunnen',
      ref: '1. Mose 29,1–14',
      audio: `${REC}geschichte-04-v2.mp3`,
      text: [
        'Nach vielen Tagen erreicht Jakob das Land seiner Verwandten. Auf freiem Feld sieht er einen Brunnen, über dessen Öffnung ein großer Stein liegt, und daneben warten Hirten mit ihren Herden. „Woher seid ihr?“, fragt Jakob. „Aus Haran.“ „Kennt ihr Laban?“ „Den kennen wir. Und da kommt seine Tochter Rahel mit den Schafen!“',
        'Die Hirten tränken ihre Tiere erst, wenn alle Herden da sind und sie gemeinsam den schweren Stein wegrollen. Doch als Jakob Rahel mit den Schafen ihres Vaters sieht, tritt er vor, wälzt den Stein allein vom Brunnen und tränkt ihre Schafe.',
        'Dann sagt er Rahel, wer er ist: ein Verwandter, der Sohn von Rebekka, der Schwester ihres Vaters. Vor Freude weint er laut. Rahel läuft nach Hause und erzählt alles ihrem Vater.',
        'Laban kommt Jakob eilig entgegen, schließt ihn in die Arme und nimmt ihn mit in sein Haus. Jakob berichtet, was geschehen ist, und Laban sagt: „Du gehörst wirklich zu meiner Familie!“ Nach der langen Wanderung hat Jakob einen Ort gefunden, an dem er bleiben darf.'
      ],
      task: { kind: 'kurbel', hint: 'Drehe die Kurbel mit dem Finger im Kreis.', crank: KURBEL },
      questions: [
        { q: 'Was liegt über dem Brunnen, den Jakob findet?', options: ['ein großer Stein', 'ein Holzdeckel', 'ein Tuch'], answer: 0 },
        { q: 'Wen trifft Jakob am Brunnen?', options: ['Rahel', 'Lea', 'Rebekka'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 5,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Sieben Jahre für Rahel',
      ref: '1. Mose 29,15–30',
      audio: `${REC}geschichte-05-v2.mp3`,
      text: [
        'Einen Monat lang ist Jakob bei Laban zu Gast, da sagt Laban: „Du bist mein Verwandter und sollst nicht umsonst für mich arbeiten. Sag mir, was soll dein Lohn sein?“ Laban hat zwei Töchter, Lea, die ältere, und Rahel, die jüngere. Rahel hat Jakob von Herzen lieb.',
        '„Ich will dir sieben Jahre dienen“, sagt er, „wenn ich dafür Rahel heiraten darf.“ Laban ist einverstanden. Jakob arbeitet sieben Jahre lang, und weil er Rahel so lieb hat, kommen sie ihm vor wie wenige Tage.',
        'Dann lädt Laban alle Leute zum Hochzeitsfest ein. Am Abend aber führt er nicht Rahel zu Jakob, sondern seine ältere Tochter Lea, und Jakob merkt es erst am Morgen. Es ist eine bittere Überraschung. „Warum hast du das getan?“, fragt er Laban. „Bei uns gibt man die jüngere Tochter nicht vor der älteren her“, antwortet Laban.',
        '„Feiere erst die Hochzeitswoche mit Lea zu Ende“, sagt er, „dann bekommst du auch Rahel, wenn du noch einmal sieben Jahre für mich arbeitest.“ Jakob ist einverstanden, und nach der Woche wird auch Rahel seine Frau. So bleibt er noch weitere sieben Jahre bei Laban.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele Jahre arbeitet Jakob zuerst für Rahel?', options: ['sieben', 'zwei', 'zwanzig'], answer: 0 },
        { q: 'Wen führt Laban am Hochzeitsabend zu Jakob?', options: ['Lea', 'Rahel', 'Rebekka'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 6,
      image: `${IMG}etappe-bild-01.webp`,
      title: 'Die große Familie',
      ref: '1. Mose 29,31 bis 30,24',
      audio: `${REC}geschichte-06-v2.mp3`,
      text: [
        'Jakob hat Rahel lieber als Lea, doch Gott sieht, dass Lea weniger geliebt wird, und schenkt ihr einen Sohn. Sie nennt ihn Ruben, denn sie sagt: „Gott hat mein Elend gesehen.“ Dann bekommt sie Simeon und Levi, und als ihr vierter Sohn geboren wird, ruft sie: „Jetzt will ich Gott danken!“ Deshalb nennt sie ihn Juda.',
        'Rahel aber hat kein Kind, und das macht sie traurig, weil ihre Schwester so viele Söhne hat. Auch ihre Magd Bilha und Leas Magd Silpa bekommen Söhne: Dan, Naftali, Gad und Asser. Dazu kommen Leas Söhne Issachar und Sebulon und eine Tochter, Dina.',
        'Rahel wartet und betet. Schließlich denkt Gott an sie, und sie bekommt einen Sohn. „Er soll Josef heißen“, sagt sie, „das bedeutet: Er füge hinzu. Gott hat meine Schande von mir genommen, und ich bitte ihn um noch einen Sohn.“',
        'Jakobs Zelt ist nun voller Kinder: elf Söhne und eine Tochter. Und der Jüngste von allen, Josef, ist der Sohn Rahels, die Jakob am meisten liebt.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt Rahels erster Sohn?', options: ['Josef', 'Ruben', 'Juda'], answer: 0 },
        { q: 'Wem will Lea nach der Geburt von Juda danken?', options: ['Gott', 'Rahel', 'Jakob'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 7,
      image: `${IMG}etappe-bild-04.webp`,
      title: 'Die Herden wachsen',
      ref: '1. Mose 30,25 bis 31,16',
      audio: `${REC}geschichte-07-v2.mp3`,
      text: [
        'Als Josef geboren ist, sagt Jakob zu Laban: „Lass mich jetzt mit meiner Familie in meine Heimat ziehen. Du weißt, wie treu ich dir gedient habe.“ Aber Laban will ihn nicht gehen lassen: „Ich habe gemerkt, dass Gott mich um deinetwillen segnet. Sag, was ich dir als Lohn geben soll.“',
        'Jakob bittet um die gesprenkelten und dunklen Tiere der Herde als Lohn, und Laban ist einverstanden. Gott aber segnet Jakob, und seine Herden werden immer größer. Er besitzt Schafe, Ziegen, Kamele und Esel und viele Knechte.',
        'Labans Söhne murren, Jakob habe ihrem Vater alles genommen, und Labans Gesicht ist nicht mehr so freundlich wie früher. Da spricht Gott zu Jakob: „Zieh zurück in das Land deiner Väter, zu deiner Familie. Ich werde bei dir sein.“',
        'Jakob ruft Rahel und Lea aufs Feld und erzählt ihnen, wie oft ihr Vater seinen Lohn geändert hat und wie Gott ihn trotzdem bewahrt hat. „Wir gehen mit dir“, sagen beide. „Tu, was Gott dir gesagt hat.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was will Jakob nach der Geburt von Josef tun?', options: ['in seine Heimat zurückkehren', 'ein neues Zelt bauen', 'bei Laban bleiben'], answer: 0 },
        { q: 'Was sagt Gott zu Jakob?', options: ['Zieh zurück in das Land deiner Väter.', 'Bleibe bei Laban.', 'Baue eine Stadt.'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 8,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Der Weg nach Hause',
      ref: '1. Mose 31,17–55',
      audio: `${REC}geschichte-08-v2.mp3`,
      text: [
        'Jakob macht sich auf. Er setzt seine Frauen und Kinder auf die Kamele, treibt seine Herden zusammen und nimmt alles mit, was er sich erworben hat. Laban ist gerade zum Scheren seiner Schafe fort, und so zieht Jakob heimlich los, über den Fluss auf das Gebirge Gilead zu.',
        'Am dritten Tag erfährt Laban davon. Sofort jagt er mit seinen Männern hinter Jakob her, sieben Tage lang, bis er ihn im Gebirge einholt. Doch in der Nacht zuvor hat Gott im Traum zu Laban gesprochen: „Hüte dich, hart mit Jakob zu reden!“',
        '„Warum bist du heimlich weggelaufen?“, fragt Laban. „Ich hätte dich mit Musik gehen lassen, und meine Enkel und Töchter hätte ich gern zum Abschied geküsst.“ Jakob erinnert ihn an die zwanzig Jahre, in denen er Tag und Nacht für ihn gearbeitet hat, bei Hitze und bei Frost. „Wäre Gott nicht bei mir gewesen“, sagt er, „du hättest mich mit leeren Händen fortgeschickt.“',
        'Da lenkt Laban ein. Die beiden schließen Frieden. Jakob stellt einen großen Stein auf, und die anderen sammeln Steine zu einem Haufen, auf dem sie gemeinsam essen. Der Haufen soll Zeuge sein und heißt Mizpa, das bedeutet „Warte“, denn Laban sagt: „Gott sei Wächter zwischen mir und dir, wenn wir einander nicht sehen.“ Am nächsten Morgen küsst Laban seine Enkel und Töchter und kehrt heim.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer spricht im Traum zu Laban?', options: ['Gott', 'Jakob', 'Isaak'], answer: 0 },
        { q: 'Wofür steht der Steinhaufen zwischen Jakob und Laban?', options: ['für ihren Frieden', 'für ein Haus', 'für ein Grab'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 9,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Engel und Geschenke',
      ref: '1. Mose 32,1–21',
      audio: `${REC}geschichte-09-v2.mp3`,
      text: [
        'Laban ist fort, und Jakob zieht weiter. Da begegnen ihm unterwegs Engel Gottes. „Das ist ein Lager Gottes!“, ruft Jakob und nennt den Ort Mahanajim, das heißt „zwei Lager“.',
        'Doch bald kehrt die Sorge zurück, denn vor ihm liegt das Land seines Bruders Esau. Jakob schickt Boten voraus: „Dein Knecht Jakob lässt dich grüßen. Ich war lange bei Laban, aber jetzt habe ich Schafe, Rinder, Esel und Knechte, und ich hoffe, dass du mich freundlich aufnimmst.“ Die Boten kommen zurück: „Esau zieht dir entgegen, mit vierhundert Männern.“',
        'Jakob bekommt große Angst. Er teilt seine Leute und Herden in zwei Lager, damit wenigstens eines davonkommen kann, wenn Esau das andere angreift. Dann betet er: „Gott meiner Väter, du hast zu mir gesagt: Zieh heim, ich will dir Gutes tun. Ich bin zu klein für alles, was du mir geschenkt hast. Nur mit meinem Stab bin ich damals über den Jordan gegangen, und nun habe ich zwei Lager. Rette mich vor meinem Bruder!“',
        'Dann sucht Jakob aus seinen Herden ein Geschenk für Esau aus: Ziegen, Schafe, Kamele, Kühe und Esel, jede Art als eigene Herde. Seine Knechte sollen sie einzeln und mit Abstand Esau entgegentreiben. „Ich will ihn mit dem Geschenk versöhnen“, denkt Jakob, „vielleicht nimmt er mich dann freundlich auf.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wem begegnet Jakob auf dem Weg?', options: ['Engeln Gottes', 'Räubern', 'Hirten'], answer: 0 },
        { q: 'Was schickt Jakob Esau entgegen?', options: ['Tiere als Geschenk', 'einen Brief', 'ein Schwert'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 10,
      image: `${IMG}etappe-bild-05.webp`,
      title: 'Der Kampf am Fluss',
      ref: '1. Mose 32,23–32',
      audio: `${REC}geschichte-10-v2.mp3`,
      text: [
        'Die Geschenke ziehen voraus, und Jakob bleibt die Nacht im Lager. Mitten in der Nacht steht er auf, nimmt seine Frauen, seine Kinder und alles, was er hat, und bringt sie sicher durch die Furt des Flusses Jabbok. Er selbst bleibt allein auf der anderen Seite zurück.',
        'Da kommt ein Mann und ringt mit ihm, bis der Morgen anbricht. Der Mann berührt Jakobs Hüfte, und von da an tut sie ihm weh.',
        'Als die Morgenröte kommt, sagt der Mann: „Lass mich los, der Morgen bricht an!“ Aber Jakob hält fest: „Ich lasse dich nicht, es sei denn, du segnest mich.“ „Wie heißt du?“, fragt der Mann. „Jakob.“ „Du sollst nicht mehr Jakob heißen, sondern Israel, denn du hast mit Gott und mit Menschen gerungen und nicht aufgegeben.“ Und er segnet ihn dort.',
        'Jakob nennt den Ort Pnuël, das heißt „Gottes Angesicht“. „Ich habe Gott von Angesicht gesehen“, sagt er, „und bin am Leben geblieben.“ Als die Sonne aufgeht, zieht er weiter, und er hinkt. Aber er hat einen neuen Namen und Gottes Segen.'
      ],
      task: { kind: 'halten', hint: 'Halte das Licht fest, bis der Morgen kommt.', hold: HALTEN },
      questions: [
        { q: 'An welchem Fluss ist Jakob in dieser Nacht?', options: ['am Jabbok', 'am Jordan', 'am Nil'], answer: 0 },
        { q: 'Welchen neuen Namen bekommt Jakob?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 11,
      image: `${IMG}etappe-bild-06.webp`,
      title: 'Wiedersehen',
      ref: '1. Mose 33,1–11',
      audio: `${REC}geschichte-11-v2.mp3`,
      text: [
        'Als Jakob aufblickt, sieht er Esau kommen, mit vierhundert Männern. Er ordnet seine Familie: vorn die Mägde mit ihren Kindern, dann Lea mit ihren, ganz hinten Rahel mit Josef. Er selbst geht allen voran und verneigt sich siebenmal bis zur Erde, je näher er seinem Bruder kommt.',
        'Da läuft Esau ihm entgegen! Er umarmt ihn, fällt ihm um den Hals und küsst ihn, und beide weinen vor Freude.',
        '„Wer sind die da bei dir?“, fragt Esau, als er die Frauen und Kinder sieht. „Das sind die Kinder, die Gott mir geschenkt hat“, antwortet Jakob. Alle kommen heran und verneigen sich.',
        '„Was sollen all die Herden, denen ich begegnet bin?“, fragt Esau. „Sie sind ein Geschenk für dich“, sagt Jakob. „Ich habe genug, mein Bruder, behalte, was dir gehört.“ Aber Jakob bittet: „Nimm es doch! Dein Gesicht zu sehen ist, als sähe ich Gottes Gesicht, so freundlich hast du mich aufgenommen.“ Da nimmt Esau das Geschenk an. Aus dem Streit der Brüder ist Frieden geworden.'
      ],
      task: { kind: 'puzzle', hint: 'Setze das Bild vom Wiedersehen zusammen.', puzzle: { image: `${G}puzzle/wiedersehen.webp`, cols: 2, rows: 3 } },
      questions: [
        { q: 'Was tut Esau, als er Jakob sieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er läuft weg.', 'Er schickt ihn fort.'], answer: 0 },
        { q: 'Was bringt Jakob seinem Bruder mit?', options: ['Tiere als Geschenk', 'ein Schwert', 'ein Zelt'], answer: 0 }
      ],
      soon: SOON
    },
    {
      id: 12,
      image: `${IMG}etappe-bild-03.webp`,
      title: 'Zwölf Söhne',
      ref: '1. Mose 35,1–20; 35,22–26; 37,1–4',
      audio: `${REC}geschichte-12-v2.mp3`,
      text: [
        'Gott sagt zu Jakob: „Zieh nach Bethel und baue dort einen Altar.“ Jakob macht sich mit seiner ganzen Familie auf, und in Bethel, wo er einst allein auf dem Stein geschlafen hat, baut er den Altar. Gott spricht noch einmal zu ihm: „Du heißt Jakob, aber du sollst Israel heißen. Aus dir sollen viele Völker kommen, und das Land, das ich Abraham und Isaak gegeben habe, will ich dir und deinen Nachkommen geben.“ Jakob richtet wieder einen Stein auf und gießt Öl darüber.',
        'Dann ziehen sie weiter. Kurz vor Efrata wird Rahels zweiter Sohn geboren, Benjamin, und Rahel stirbt dabei. Jakob ist sehr traurig und stellt einen Stein auf ihr Grab.',
        'Nun hat Jakob zwölf Söhne: Ruben, Simeon, Levi, Juda, Issachar und Sebulon, Josef und Benjamin, Dan und Naftali, Gad und Asser. Aus ihnen soll das Volk Israel werden, das den neuen Namen seines Vaters trägt.',
        'Jakob lebt im Land Kanaan, wo schon sein Vater als Fremder gewohnt hat. Josef, der Sohn seines Alters, ist ihm der liebste, und er lässt ihm einen bunten Rock machen. Als die Brüder sehen, dass der Vater Josef mehr liebt als sie, werden sie böse auf ihn und können kein freundliches Wort mehr mit ihm reden. Hier beginnt eine neue Geschichte, die von Josef.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild, bis das Spiel und das eigene Bild dieser Etappe eingebaut sind
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin zieht Jakob auf Gottes Wort?', options: ['nach Bethel', 'nach Haran', 'nach Ägypten'], answer: 0 },
        { q: 'Welchen Sohn hat Jakob am liebsten?', options: ['Josef', 'Benjamin', 'Ruben'], answer: 0 }
      ],
      soon: SOON
    }
  ],
  exam: [
    { q: 'Wie heißen die Zwillinge von Isaak und Rebekka?', options: ['Esau und Jakob', 'Isaak und Lot', 'Kain und Abel'], answer: 0 },
    { q: 'Was legt sich Jakob auf die Hände, damit der Vater ihn für Esau hält?', options: ['Ziegenfell', 'Mehl', 'Lehm'], answer: 0 },
    { q: 'Was nimmt Jakob in der Nacht als Kopfkissen?', options: ['einen Stein', 'ein Fell', 'einen Sack'], answer: 0 },
    { q: 'Wie viele Söhne hat Jakob am Ende?', options: ['zwölf', 'sieben', 'drei'], answer: 0 },
    { q: 'Wie heißt Jakob nach dieser Nacht am Fluss?', options: ['Israel', 'Esau', 'Isaak'], answer: 0 },
    { q: 'Was tut Esau, als er Jakob wiedersieht?', options: ['Er läuft ihm entgegen und umarmt ihn.', 'Er läuft weg.', 'Er schickt ihn fort.'], answer: 0 }
  ]

}

// the English texts (title, stories, questions, hints, recordings) lie over the German ones; the screens show them when the app is English
localize(jakob, jakobEn)
