/**
 * Abenteuer "Das Volk in der Wüste" (id `wueste`; 2. Mose 17-18, 35-40; 4. Mose 9-27; 5. Mose 6, 8, 31, 34) für 8 bis 10 Jahre: 15 Etappen, Untertitel "Vierzig Jahre unterwegs".
 * Erweiterung des Abenteuers Mose (Nr. 7b der Gesamtreise, zwischen Mose und Josua). Was in Mose schon erzählt ist (Marah und Manna, die zehn Gebote, das goldene Kalb, die Wolke am Zelt), steht hier nicht noch einmal.
 * Quelle der Texte: D:/Claude/Abenteuer-Wuestenvolk/ENTWURF_Wuestenvolk.md (Luther 1912 von bibeltext.com gelesen, nichts abgeschrieben), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Befunde: BEFUNDE.md.
 * Antons Entscheidungen (1.11.2026): Bibelreihenfolge; der Engel bei Bileam nur als Licht, nie als Figur; die Bronzeschlange nur als Zeichen auf der Stange; der Kampf gegen Amalek bleibt fern. Gott und Engel nie im Bild.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * STAND 1.11.2026 (Einbau): Die Etappenbilder sind vorläufige Ausschnitte des Panoramas, die Medaille ein runder Ausschnitt; alle Etappen außer 13 sind Quiz-Platzhalter. Die vier neuen Spiele
 * (arme, richter, signal, traube) und die alten Spiele der Standardwahl (siehe ETAPPENPLAN.md) folgen mit den Codex-Bildern.
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/wueste/, images/abenteuer/spiele/wueste/<spiel>/, audio/abenteuer/wueste/.
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { Journey, VerseGame } from '@/types/adventure'
import { josef } from './josef'
import { WUESTE_PATH } from './wuestePath'
import { localize } from './localize'
import { adventureLanguage } from '@/use/adventureLanguage'
import { wuesteEn } from './en/wueste.en'
import { backdropOr } from '@/utils/gameBackground'
import { ARME, RICHTER, SIGNAL, TRAUBE } from './wuesteGames'
import { KRUG, GENUG, WACHTELN, STAB, SCHLANGE, ESELIN, EINSETZEN } from './wuesteGames2'

// Etappenbilder (gemalt mit Codex, Variante a; Etappe 12: a-v2, Balaam reitet), 960 × 640: `images/abenteuer/wueste/etappe-bild-NN-v1.webp`
const PICS = 'images/abenteuer/wueste/'

const G = 'images/abenteuer/spiele/wueste/'

/**
 * Etappe 13, "Lückenvers" (alte Mechanik): zwei Sätze aus dem Text der Etappe in zwei Runden (erst ein Wort, dann zwei); die Wörter sind Blätter (das richtige zuerst, `answers` zeigt auf sie).
 * Tafel und Blatt sind die aus Salomo (kopiert). Hintergrund: bis ein eigener gemalter in `hintergrund/` da ist, das Etappenbild.
 */
const VERS: VerseGame = {
  background: `${PICS}etappe-bild-13-v1.webp`,
  soft: true,
  board: `${G}lueckenvers/tafel.webp`,
  leaf: `${G}lueckenvers/blatt.webp`,
  rounds: [
    { hint: 'Ziehe das passende Blatt in die Lücke.', parts: ['Gott ist unser Gott, er ', '.'], words: ['allein', 'nie', 'heute'], answers: [0] },
    { hint: 'Jetzt fehlen zwei Wörter.', parts: ['Du sollst Gott lieben mit deinem ganzen Herzen, mit deiner ganzen ', ' und mit all deiner ', '.'], words: ['Seele', 'Kraft', 'Macht', 'Hand'], answers: [0, 1] }
  ]
}

export const wueste: Journey = {
  id: 'wueste',
  title: 'Das Volk in der Wüste',
  subtitle: 'Vierzig Jahre unterwegs',
  age: '8-10',
  downloadMb: 22, // gemessen 2.11.2026: Bilder 8 MB (Karte 5 MB), Spielbilder 5 MB, Musik und Trompeten 2 MB, Aufnahmen Deutsch und Englisch 7 MB, ohne die gemeinsamen Oberflächendateien
  medal: `${PICS}medaille-v1.webp`, // gemalter Entwurf 1 (Traube an der Stange); Antons Wahl aus drei Entwürfen steht noch aus
  // Geschenk-Ausmalbild: "Die Riesentraube" (Konturzeichnung; noch nicht gemalt, steht in NOT_PAINTED_YET)
  gift: { title: 'Die Riesentraube', image: `${PICS}geschenk.webp` },
  // die gemalte Karte (Panorama in vier Stücken, 9908 × 1648 px, von Anton abgenommen am 1.11.2026) mit Stationen und Perlenweg aus wuestePath.ts
  map: {
    images: [1, 2, 3, 4].map((n) => `images/abenteuer/wueste/karte-pano-w1-${n}.webp`),
    ring: josef.map.ring,
    aspect: 9908 / 1648,
    widthPx: 9908,
    stages: [
      { x: 0.0646, y: 0.2791, d: 0.0339 },
      { x: 0.1463, y: 0.182, d: 0.0339 },
      { x: 0.1978, y: 0.6432, d: 0.0339 },
      { x: 0.2503, y: 0.2002, d: 0.0339 },
      { x: 0.3578, y: 0.2852, d: 0.0339 },
      { x: 0.3674, y: 0.6371, d: 0.0339 },
      { x: 0.4522, y: 0.2427, d: 0.0339 },
      { x: 0.5036, y: 0.2002, d: 0.0339 },
      { x: 0.5551, y: 0.2913, d: 0.0339 },
      { x: 0.6712, y: 0.4187, d: 0.0339 },
      { x: 0.7549, y: 0.2306, d: 0.0339 },
      { x: 0.7872, y: 0.6432, d: 0.0339 },
      { x: 0.8205, y: 0.2306, d: 0.0339 },
      { x: 0.8831, y: 0.3944, d: 0.0339 },
      { x: 0.9235, y: 0.2609, d: 0.0339 }
    ],
    exam: { x: 0.982, y: 0.4248, d: 0.0339 },
    path: WUESTE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PICS}etappe-bild-01-v1.webp`,
      title: 'Wasser aus dem Felsen',
      ref: '2. Mose 17,1–7',
      text: [
        'Das Volk zieht durch die Wüste weiter und lagert in Refidim. Dort gibt es kein Wasser zu trinken. Die Kinder und die Tiere haben Durst.',
        'Die Leute kommen zu Mose und schimpfen: „Gebt uns Wasser!“ Sie fragen, warum er sie aus Ägypten geführt hat. Mose ruft zu Gott: „Was soll ich nur mit diesem Volk tun?“',
        'Da sagt Gott: „Geh voran und nimm einige Älteste mit und deinen Stab. Ich werde dort auf dem Felsen vor dir stehen. Schlag auf den Felsen, dann kommt Wasser heraus.“',
        'Mose tut es vor den Augen der Ältesten. Wasser läuft aus dem Felsen, und das Volk kann trinken. Man nennt den Ort Massa und Meriba, weil die Leute dort stritten und fragten: Ist Gott wirklich bei uns?'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'krug', hint: KRUG.rounds[0]!.hint, jugs: KRUG },
      questions: [
        { q: 'Was fehlt dem Volk in Refidim?', options: ['Wasser', 'Brot', 'Holz'], answer: 0 },
        { q: 'Wen nimmt Mose zum Felsen mit?', options: ['einige Älteste', 'Josua und Jitro', 'seine Söhne'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PICS}etappe-bild-02-v1.webp`,
      title: 'Die Arme des Mose',
      ref: '2. Mose 17,8–16',
      text: [
        'In Refidim kommt ein anderes Volk, die Amalekiter, und kämpft gegen Israel. Mose sagt zu Josua: „Such dir Männer aus und zieh ihnen entgegen. Morgen stehe ich auf der Spitze des Hügels und halte den Stab Gottes in der Hand.“',
        'Josua tut, was Mose gesagt hat. Mose, Aaron und Hur steigen auf den Hügel. Solange Mose die Hände hochhält, gewinnt Israel. Lässt er sie sinken, gewinnt Amalek.',
        'Doch die Arme werden Mose schwer. Da legen Aaron und Hur einen Stein hin, und Mose setzt sich darauf. Dann stützen die beiden seine Hände, der eine links und der andere rechts. So bleiben die Hände oben, bis die Sonne untergeht.',
        'Am Abend hat Josua gewonnen. Mose baut einen Altar und nennt ihn: „Gott ist meine Fahne.“'
      ],
      // Spiel: Die Arme des Mose (NEU, arme; Daten in wuesteGames.ts)
      task: { kind: 'arme', hint: 'Halte Moses Hände oben, bis die Sonne untergeht.', arms: ARME },
      questions: [
        { q: 'Wer stützt die Arme von Mose?', options: ['Aaron und Hur', 'Josua und Kaleb', 'zwei Älteste'], answer: 0 },
        { q: 'Worauf setzt sich Mose?', options: ['auf einen Stein', 'auf einen Baumstumpf', 'auf eine Kiste'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PICS}etappe-bild-03-v1.webp`,
      title: 'Jitro und die Richter',
      ref: '2. Mose 18',
      text: [
        'Jitro, der Schwiegervater von Mose, hört, was Gott für das Volk getan hat. Er kommt in die Wüste zum Berg Gottes und bringt Zippora und ihre beiden Söhne mit. Mose geht ihm entgegen, verneigt sich und küsst ihn.',
        'Am nächsten Morgen sitzt Mose da und spricht Recht. Das Volk steht von früh bis abends um ihn herum. Jitro sieht es und fragt: „Warum sitzt du allein, und alle stehen den ganzen Tag um dich?“',
        '„Es ist nicht gut, was du tust“, sagt Jitro. „Du wirst müde, und das Volk auch. Such dir redliche Männer aus, die Gott achten. Sie sollen die kleinen Fälle richten, und nur die schweren bringen sie zu dir.“',
        'Mose hört auf seinen Schwiegervater. Er setzt Männer über Tausend, über Hundert, über Fünfzig und über Zehn. Danach zieht Jitro wieder heim in sein Land.'
      ],
      // Spiel: Fälle zuteilen (NEU, richter; Daten in wuesteGames.ts)
      task: { kind: 'richter', hint: 'Teile die Fälle zu: Die kleinen richten die Männer, die schweren gehören zu Mose.', judges: RICHTER },
      questions: [
        { q: 'Wer besucht Mose in der Wüste?', options: ['Jitro', 'Josua', 'Balak'], answer: 0 },
        { q: 'Was rät Jitro dem Mose?', options: ['Andere sollen die kleinen Fälle richten', 'Mose soll nur noch morgens richten', 'Das Volk soll weiterziehen'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PICS}etappe-bild-04-v1.webp`,
      title: 'Das Zelt Gottes',
      ref: '2. Mose 35,4–36,7; 40,34',
      text: [
        'Gott will mitten unter seinem Volk wohnen. Dafür soll ein Zelt gebaut werden. Mose ruft alle zusammen: „Wer von Herzen gern gibt, der bringe Gold, Silber und Kupfer, Garn und Leinen, Holz und Öl.“',
        'Da kommen Männer und Frauen und bringen Spangen, Ringe und Ohrringe aus Gold. Die Frauen spinnen Garn und Ziegenhaar. Bezalel und Oholiab, die Gott klug und geschickt gemacht hat, arbeiten mit allen geschickten Männern und zeigen es den anderen.',
        'Jeden Morgen kommen neue Gaben. Bald sagen die Handwerker zu Mose: „Das Volk bringt mehr, als wir brauchen!“ Mose lässt durch das Lager rufen: „Niemand soll mehr etwas bringen!“ Da hört das Volk auf zu geben.',
        'So entsteht das Zelt aus Teppichen und Brettern. Als es fertig ist, bedeckt die Wolke das Zelt.'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'genug', hint: GENUG.rounds[0]!.hint, enough: GENUG },
      questions: [
        { q: 'Wer bringt Gaben für das Zelt?', options: ['Männer und Frauen', 'nur die Priester', 'nur die Ältesten'], answer: 0 },
        { q: 'Was lässt Mose durch das Lager rufen?', options: ['Niemand soll mehr etwas bringen', 'Alle sollen noch mehr bringen', 'Alle sollen nach Hause gehen'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PICS}etappe-bild-05-v1.webp`,
      title: 'Aufbruch vom Sinai',
      ref: '4. Mose 9,15–23; 10,1–11.33–36',
      text: [
        'Liegt die Wolke über dem Zelt, bleibt das Volk im Lager. Hebt sie sich, bricht das Volk auf. Manchmal bleibt die Wolke nur eine Nacht, manchmal viele Tage. In der Nacht leuchtet sie wie Feuer.',
        'Gott sagt zu Mose: „Mach dir zwei Trompeten aus Silber.“ Blasen die Priester beide, versammelt sich das ganze Volk. Bläst nur einer, kommen die Anführer. Ein anderes Blasen ruft: Brecht auf!',
        'Im zweiten Jahr hebt sich die Wolke. Das Volk zieht vom Berg Sinai los, Stamm für Stamm. Die Lade des Bundes geht voran und zeigt den Weg.',
        'Wenn die Lade aufbricht, ruft Mose: „Gott, steh auf!“ Und wenn sie ruht, ruft er: „Komm wieder, Gott, zu den vielen Tausenden in Israel!“'
      ],
      // Spiel: Trompetenzeichen (NEU, signal; Daten in wuesteGames.ts)
      task: { kind: 'signal', hint: 'Höre auf die silbernen Trompeten und tippe das Bild, das zum Zeichen passt.', signal: SIGNAL },
      questions: [
        { q: 'Woran merkt das Volk, dass es aufbrechen soll?', options: ['Die Wolke hebt sich', 'Die Sonne geht auf', 'Ein Hirte ruft'], answer: 0 },
        { q: 'Woraus sind die Trompeten?', options: ['aus Silber', 'aus Gold', 'aus Holz'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PICS}etappe-bild-06-v1.webp`,
      title: 'Klagen und Wachteln',
      ref: '4. Mose 11',
      text: [
        'Manche im Volk haben nur noch Lust auf Fleisch. Bald weinen alle vor ihren Zelten: „Wer gibt uns Fleisch zu essen? In Ägypten gab es Fische, Melonen, Lauch und Zwiebeln! Hier sehen wir nichts als Manna.“',
        'Mose hört das Weinen vor jedem Zelt, und ihm wird es zu schwer. Er sagt zu Gott: „Ich kann dieses Volk nicht allein tragen.“ Da sagt Gott: „Sammle siebzig Älteste und stelle sie vor das Zelt. Sie sollen die Last mit dir tragen.“',
        'Die Ältesten kommen, und Gottes Geist ruht auf ihnen. Auch auf zwei Männern im Lager, Eldad und Medad. Josua will es ihnen verbieten. Aber Mose sagt: „Wenn doch das ganze Volk Gottes Geist hätte!“',
        'Dann kommt ein Wind von Gott und bringt Wachteln vom Meer. Sie fallen rings um das Lager, und das Volk sammelt sie einen Tag, eine Nacht und noch einen Tag. Gott hat ihr Weinen gehört. Aber das Volk hat vergessen, dass Gott mitten unter ihnen ist.'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'wachteln', hint: WACHTELN.rounds[0]!.hint, quails: WACHTELN },
      questions: [
        { q: 'Was wünscht sich das Volk zu essen?', options: ['Fleisch', 'Brot', 'Kuchen'], answer: 0 },
        { q: 'Wie viele Älteste soll Mose sammeln?', options: ['siebzig', 'sieben', 'zwölf'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PICS}etappe-bild-07-v1.webp`,
      title: 'Zwölf Kundschafter',
      ref: '4. Mose 13',
      text: [
        'In der Wüste Paran, bei Kadesch, lagert das Volk. Gott sagt zu Mose: „Schick Männer aus, die das Land erkunden, aus jedem Stamm einen.“ Zu den zwölf Männern gehören Josua und Kaleb.',
        'Mose sagt ihnen: „Seht nach, wie das Land ist. Ist es gut? Wohnen die Leute in Zelten oder in Städten mit Mauern? Und bringt Früchte mit!“ Es ist gerade die Zeit der ersten Trauben.',
        'Vierzig Tage sind die Männer unterwegs. Am Bach Eschkol schneiden sie eine Rebe mit einer Traube ab. Zwei Männer tragen sie an einer Stange. Dazu nehmen sie Granatäpfel und Feigen mit.',
        'Dann kommen sie zu Mose und Aaron zurück und zeigen dem Volk die Früchte. „Wir waren in dem Land“, sagen sie, „da fließen Milch und Honig!“ Aber sie erzählen auch von starken Leuten und festen Städten.'
      ],
      // Spiel: Die Traube tragen (NEU, traube; Daten in wuesteGames.ts)
      task: { kind: 'traube', hint: 'Trage die Riesentraube an der Stange und halte sie gerade.', grapes: TRAUBE },
      questions: [
        { q: 'Wie viele Männer schickt Mose aus?', options: ['zwölf', 'zehn', 'sieben'], answer: 0 },
        { q: 'Was tragen zwei Männer an einer Stange?', options: ['eine Traube', 'einen Krug', 'ein Lamm'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PICS}etappe-bild-08-v1.webp`,
      title: 'Josua und Kaleb',
      ref: '4. Mose 14',
      text: [
        'Zehn Kundschafter sagen: „Die Leute dort sind stärker als wir.“ Da erschrickt das Volk. Alle weinen die ganze Nacht, und manche rufen: „Wären wir doch in Ägypten geblieben! Lasst uns umkehren!“',
        'Josua und Kaleb reißen ihre Kleider ein. „Das Land ist sehr gut!“, rufen sie. „Wenn Gott mit uns ist, bringt er uns hinein. Fürchtet euch nicht! Gott ist bei uns.“ Aber das Volk hört nicht auf sie.',
        'Mose bittet Gott, dem Volk zu vergeben. Und Gott sagt: „Ich vergebe, wie du gebeten hast.“ Aber diese Menschen werden das Land nicht sehen, weil sie Gott nicht vertraut haben. Vierzig Jahre soll das Volk in der Wüste unterwegs sein, für jeden Tag der Erkundung ein Jahr.',
        'Ihre Kinder aber wird Gott in das Land bringen. Und auch Kaleb und Josua dürfen hinein, denn sie haben ihm vertraut.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer sagt: „Das Land ist sehr gut“?', options: ['Josua und Kaleb', 'Mose und Aaron', 'Eldad und Medad'], answer: 0 },
        { q: 'Wie lange soll das Volk in der Wüste bleiben?', options: ['vierzig Jahre', 'zehn Jahre', 'zwanzig Jahre'], answer: 0 },
        { q: 'Wer darf in das Land?', options: ['die Kinder, Kaleb und Josua', 'nur die Ältesten', 'nur die Priester'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PICS}etappe-bild-09-v1.webp`,
      title: 'Aarons Stab blüht',
      ref: '4. Mose 17',
      text: [
        'Wieder murren die Leute gegen Mose und Aaron. Sie fragen, wer Gott am nächsten stehen darf. Gott will zeigen, wen er als Priester für sein Zelt erwählt hat.',
        'Er sagt zu Mose: „Nimm von jedem Stamm einen Stab, zwölf Stäbe. Schreib auf jeden den Namen des Anführers, und auf den Stab von Levi schreib den Namen Aaron.“ Mose legt die Stäbe über Nacht im Zelt vor Gott nieder.',
        'Am Morgen geht Mose hinein. Die anderen Stäbe sind unverändert. Aber Aarons Stab hat Blätter getrieben und Blüten, und an ihm hängen Mandeln!',
        'Mose trägt alle Stäbe hinaus, und die Leute sehen es. Jeder nimmt seinen Stab zurück. Aarons Stab kommt wieder ins Zelt, als Zeichen für alle. Das Murren soll aufhören.'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'stab', hint: STAB.rounds[0]!.hint, staffs: STAB },
      questions: [
        { q: 'Wie viele Stäbe legt Mose ins Zelt?', options: ['zwölf', 'sieben', 'vierzig'], answer: 0 },
        { q: 'Was wächst an Aarons Stab?', options: ['Blüten und Mandeln', 'Äpfel', 'Trauben'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PICS}etappe-bild-10-v1.webp`,
      title: 'Kadesch und der Berg Hor',
      ref: '4. Mose 20,1–13.22–29',
      text: [
        'Fast vierzig Jahre sind vergangen. In Kadesch, wo das Volk lagert, stirbt Mirjam, die Schwester von Mose, und wird begraben. Wieder gibt es kein Wasser, und die Leute streiten mit Mose und Aaron: „Warum habt ihr uns in diese Wüste geführt?“',
        'Gott sagt zu Mose: „Nimm den Stab, versammle das Volk und sprecht vor ihren Augen zum Felsen. Er wird Wasser geben.“',
        'Mose ruft dem Volk zu: „Hört zu, ihr Widerspenstigen! Sollen wir euch Wasser aus diesem Felsen bringen?“ Dann schlägt er zweimal mit dem Stab auf den Felsen. Viel Wasser strömt heraus, und Menschen und Tiere trinken. Aber Gott sagt zu Mose und Aaron: „Ihr habt mir nicht vertraut und mich vor dem Volk nicht groß gemacht. Darum werdet ihr das Volk nicht in das Land führen.“',
        'Später kommt das Volk an den Berg Hor. Mose steigt mit Aaron und seinem Sohn Eleasar hinauf. Er zieht Aaron das Priestergewand aus und Eleasar an. Dort oben stirbt Aaron. Mose und Eleasar steigen allein wieder hinab.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was tut Mose am Felsen anders, als Gott gesagt hat?', options: ['Er schlägt mit dem Stab auf ihn', 'Er schickt das Volk weg', 'Er trinkt zuerst'], answer: 0 },
        { q: 'Wer bekommt auf dem Berg Hor das Priestergewand?', options: ['Eleasar', 'Josua', 'Hur'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PICS}etappe-bild-11-v1.webp`,
      title: 'Die Schlange aus Bronze',
      ref: '4. Mose 21,4–9',
      text: [
        'Vom Berg Hor aus zieht das Volk um das Land der Edomiter herum. Der Weg ist lang, und die Leute werden mutlos. Sie sagen zu Gott und zu Mose: „Warum habt ihr uns aus Ägypten geführt? Hier gibt es kein Brot und kein Wasser, und wir mögen das Manna nicht mehr.“',
        'Da lässt Gott Schlangen ins Lager kommen, und manche Leute werden gebissen. Sie kommen zu Mose: „Wir haben falsch geredet. Bitte Gott, dass er die Schlangen wegnimmt!“ Mose bittet für das Volk.',
        'Gott sagt zu ihm: „Mach eine Schlange aus Bronze und stell sie als Zeichen auf eine Stange. Wer gebissen ist und sie ansieht, soll leben.“',
        'Mose macht die Schlange aus Bronze und richtet sie als Zeichen auf. Ein Mann, der gebissen wurde, blickt zu der Stange hinauf. Er bleibt am Leben.'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'schlange', hint: SCHLANGE.rounds[0]!.hint, serpent: SCHLANGE },
      questions: [
        { q: 'Was macht Mose auf Gottes Wort?', options: ['eine Schlange aus Bronze', 'ein Zelt aus Fellen', 'einen Brunnen'], answer: 0 },
        { q: 'Was soll tun, wer gebissen wurde?', options: ['die Schlange ansehen', 'ins Zelt laufen', 'viel Wasser trinken'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PICS}etappe-bild-12-v1.webp`,
      title: 'Bileam und die Eselin',
      ref: '4. Mose 22,1–35; 23,7–9; 24,5',
      text: [
        'Balak, der König von Moab, fürchtet sich vor dem großen Volk Israel. Er schickt Boten zu Bileam: „Komm und verfluche dieses Volk!“ Aber Gott sagt zu Bileam: „Geh nicht mit! Das Volk ist gesegnet.“',
        'Als Balak noch größere Boten schickt, sagt Gott: „Geh mit, aber sag nur, was ich dir sage.“ Bileam sattelt seine Eselin und reitet los. Aber ein Engel Gottes stellt sich ihm in den Weg. Bileam sieht ihn nicht, die Eselin aber sieht ihn. Sie weicht aus, einmal, noch einmal und ein drittes Mal, und jedes Mal schlägt Bileam sie.',
        'Da macht Gott der Eselin den Mund auf: „Was habe ich dir getan, dass du mich schlägst?“ Nun öffnet Gott dem Bileam die Augen, und er sieht den Engel und verneigt sich.',
        'Bileam zieht weiter zu Balak. Aber er kann das Volk nicht verfluchen. Er segnet es: „Wie fein sind deine Zelte, Jakob, und deine Wohnungen, Israel!“'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'eselin', hint: ESELIN.steps[0]!.hint, donkey: ESELIN },
      questions: [
        { q: 'Wer will, dass Bileam das Volk verflucht?', options: ['Balak', 'Jitro', 'Josua'], answer: 0 },
        { q: 'Wer sieht den Engel zuerst?', options: ['die Eselin', 'Bileam', 'Balak'], answer: 0 },
        { q: 'Was spricht Bileam am Ende über Israel?', options: ['einen Segen', 'einen Fluch', 'ein Rätsel'], answer: 0 }
      ]
    },
    {
      id: 13,
      image: `${PICS}etappe-bild-13-v1.webp`,
      title: 'Höre, Israel',
      ref: '5. Mose 6,4–9; 8,2–4',
      text: [
        'Vierzig Jahre ist das Volk nun unterwegs. Es steht am Rand des Landes, und Mose ist alt geworden. Er ruft die Menschen zusammen und erinnert sie an den langen Weg.',
        'Mose sagt: „Höre, Israel! Gott ist unser Gott, er allein. Du sollst Gott lieben mit deinem ganzen Herzen, mit deiner ganzen Seele und mit all deiner Kraft.“',
        '„Sagt diese Worte euren Kindern“, sagt Mose, „zu Hause und unterwegs, wenn ihr euch hinlegt und wenn ihr aufsteht. Schreibt sie an die Pfosten eurer Türen.“',
        '„Denkt auch daran, wie Gott euch vierzig Jahre durch die Wüste geführt hat“, sagt Mose. „Er hat euch Manna gegeben, das ihr nicht kanntet. Eure Kleider sind nicht alt geworden, und eure Füße sind nicht geschwollen.“'
      ],
      // Spiel: Lückenvers (alte Mechanik, Tafel und Blatt aus Salomo)
      task: { kind: 'lueckenvers', hint: 'Ziehe das passende Blatt in die Lücke.', verse: VERS },
      questions: [
        { q: 'Wie lange war das Volk in der Wüste unterwegs?', options: ['vierzig Jahre', 'zehn Jahre', 'zwei Jahre'], answer: 0 },
        { q: 'Was ist in den vierzig Jahren nicht alt geworden?', options: ['die Kleider', 'die Zelte', 'die Krüge'], answer: 0 }
      ]
    },
    {
      id: 14,
      image: `${PICS}etappe-bild-14-v1.webp`,
      title: 'Seid mutig!',
      ref: '4. Mose 27,12–23; 5. Mose 31,1–8',
      text: [
        'Gott sagt zu Mose: „Steig auf das Gebirge und sieh dir das Land an, das ich Israel gebe. Du selbst wirst nicht hineinkommen.“ Da bittet Mose: „Gott, setze einen Mann über das Volk, damit es nicht wie Schafe ohne Hirten ist.“',
        'Gott antwortet: „Nimm Josua, den Sohn Nuns. Leg deine Hände auf ihn und stell ihn vor den Priester Eleasar und vor das ganze Volk.“ Mose tut es.',
        'Dann spricht Mose zum Volk: „Ich bin heute hundertzwanzig Jahre alt. Gott selbst geht vor euch her.“ Und vor aller Augen sagt er zu Josua: „Sei mutig und hab keine Angst! Du wirst dieses Volk in das Land bringen.“',
        '„Gott geht selbst vor dir her und ist bei dir“, sagt Mose. „Er lässt dich nicht allein. Fürchte dich nicht.“'
      ],
      // PLATZHALTER: Quiz, bis das Spiel dieser Etappe gebaut ist (siehe ETAPPENPLAN.md)
      task: { kind: 'einsetzen', hint: EINSETZEN.rounds[0]!.hint, commission: EINSETZEN },
      questions: [
        { q: 'Wer wird nach Mose der Anführer des Volkes?', options: ['Josua', 'Kaleb', 'Eleasar'], answer: 0 },
        { q: 'Wie alt ist Mose in dieser Geschichte?', options: ['hundertzwanzig Jahre', 'achtzig Jahre', 'vierzig Jahre'], answer: 0 }
      ]
    },
    {
      id: 15,
      image: `${PICS}etappe-bild-15-v1.webp`,
      title: 'Auf dem Berg Nebo',
      ref: '5. Mose 34',
      text: [
        'Mose steigt aus der Ebene von Moab auf den Berg Nebo, auf die Spitze des Gebirges, gegenüber von Jericho. Dort zeigt Gott ihm das ganze Land: weit nach Norden und weit nach Süden, bis zum Meer. Unten in der Ebene liegt Jericho, die Palmenstadt.',
        'Gott sagt zu ihm: „Das ist das Land, das ich Abraham, Isaak und Jakob versprochen habe. Du hast es mit deinen Augen gesehen. Aber du sollst nicht hinübergehen.“',
        'Dort stirbt Mose. Er ist hundertzwanzig Jahre alt. Seine Augen sind nicht dunkel geworden, und seine Kraft ist nicht vergangen. Mose wird in einem Tal begraben. Bis heute weiß niemand, wo sein Grab ist.',
        'Das Volk weint dreißig Tage um Mose. Dann hört es auf Josua, dem Mose die Hände aufgelegt hat. In Israel gab es nie wieder einen Propheten wie Mose, mit dem Gott von Angesicht zu Angesicht gesprochen hat.'
      ],
      // nur Quiz (ernst)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Auf welchen Berg steigt Mose?', options: ['Nebo', 'Sinai', 'Hor'], answer: 0 },
        { q: 'Was zeigt Gott ihm dort?', options: ['das Land, das er versprochen hat', 'das Meer von Ägypten', 'die Berge von Midian'], answer: 0 },
        { q: 'Wer führt das Volk nach Mose?', options: ['Josua', 'Aaron', 'Kaleb'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie bekommt das Volk in Refidim Wasser?', options: ['Mose schlägt auf den Felsen', 'Mose gräbt einen Brunnen', 'Der Regen fällt'], answer: 0 },
    { q: 'Welchen Rat gibt Jitro dem Mose?', options: ['Andere sollen die kleinen Fälle richten', 'Mose soll das Lager verlassen', 'Das Volk soll schweigen'], answer: 0 },
    { q: 'Was tragen die Kundschafter an einer Stange?', options: ['eine Traube', 'einen Krug', 'ein Lamm'], answer: 0 },
    { q: 'Wer sagt dem Volk: „Das Land ist sehr gut“?', options: ['Josua und Kaleb', 'Mirjam und Aaron', 'Balak und Bileam'], answer: 0 },
    { q: 'Wer sieht den Engel auf dem Weg zuerst?', options: ['die Eselin', 'Bileam', 'Balak'], answer: 0 },
    { q: 'Von welchem Berg sieht Mose das Land?', options: ['Nebo', 'Sinai', 'Hor'], answer: 0 }
  ]
}

// the games that lie on a stage picture (drawn soft by the app) follow the picture of their stage
for (const st of wueste.stages) {
  if (st.task.verse) st.task.verse.background = backdropOr(st.task.verse.background, st.image ?? st.task.verse.background)
}

// the German recordings of the stories (voice Achernar, files "geschichte-NN-v1.mp3"); until they are made the app reads with the voice of the device. Remove a number from this list when its file is in.
const WITHOUT_RECORDING = new Set<number>([])
for (const s of wueste.stages) {
  const file = `audio/abenteuer/wueste/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`
  Object.defineProperty(s, 'audio', { get: () => (adventureLanguage.value === 'en' || WITHOUT_RECORDING.has(s.id) ? undefined : file), enumerable: true, configurable: true })
}

// the background music of this adventure: pieces made with Google's Lyria 3.5 (caravan in the morning, water from the rock, the tent, the evening on Nebo); they follow one another at random
wueste.music = [
  'audio/abenteuer/wueste/musik-karawane-v1.mp3',
  'audio/abenteuer/wueste/musik-quelle-v1.mp3',
  'audio/abenteuer/wueste/musik-zelt-v1.mp3',
  'audio/abenteuer/wueste/musik-abend-v1.mp3'
]

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(wueste, wuesteEn)
