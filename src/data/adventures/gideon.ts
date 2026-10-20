/**
 * Abenteuer "Gideon" (Richter 4–8) für 8 bis 10 Jahre: 12 Etappen, Untertitel "Der Kleinste und die Dreihundert". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Gideon/ENTWURF_Gideon.md (Phase 1, 20.10.2026, Prüfdurchgang am selben Abend), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Säcke in die Höhle schieben (neu), 3 Spreu im Wind (neu), 4 Das Wort legen (neu),
 * 5 nur Quiz, 6 Die Nacht vergeht (neu), 7 Wer geht heim? (neu), 8 Wimmelbild (alt), 9 Leise den Hang hinab (neu), 10 Auf Gideons Zeichen (neu), 11 nur Quiz, 12 Memory (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/gideon/, images/abenteuer/spiele/gideon/<spiel>/, audio/abenteuer/gideon/.
 *
 * STAND 20.10.2026 (Phase 2a, nur Daten und Platzhalter): Jede Etappe hat eine Quiz-Aufgabe (PLATZHALTER bis Spiel/Bild) und ein vorhandenes Etappenbild von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit allen zwölf Stationen und dem Ziel (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Vorlese-Aufnahmen gibt es noch nicht (`audio` fehlt): die App liest dann mit der Gerätestimme. Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { Journey } from '@/types/adventure'
import { josef } from './josef'
import { GIDEON_PATH } from './gideonPath'
import { localize } from './localize'
import { gideonEn } from './en/gideon.en'

// PLATZHALTER bis zum eigenen Bild: die Etappenbilder von Josef (Ordner images/abenteuer/josef/); danach `images/abenteuer/gideon/etappe-bild-NN.webp`
const PLACEHOLDER = 'images/abenteuer/josef/'

export const gideon: Journey = {
  id: 'gideon',
  title: 'Gideon',
  subtitle: 'Der Kleinste und die Dreihundert',
  age: '8-10',
  downloadMb: 16, // PLATZHALTER: Größe mit den Bildern von Josef; wird mit den eigenen Bildern neu gemessen (der Test sagt die echte Größe)
  medal: josef.medal, // PLATZHALTER bis "Der Krug mit dem Licht" (Tonkrug mit Fackel und gebogenem Horn)
  // Geschenk-Ausmalbild: Die Nacht mit den Krügen und Fackeln (Männer mit Horn und Krug auf dem Hügel bei Nacht); PLATZHALTER bis zum eigenen Bild
  gift: { title: 'Die Nacht mit den Krügen und Fackeln', image: josef.gift.image },
  // PLATZHALTER: die Karte von Josef (vier Stücke, 9824 × 1632 px) mit seinen zwölf Stationen, dem Ziel und dem Perlenweg dorthin
  map: {
    images: josef.map.images,
    ring: josef.map.ring,
    aspect: josef.map.aspect,
    widthPx: josef.map.widthPx,
    stages: josef.map.stages,
    exam: josef.map.exam,
    path: GIDEON_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PLACEHOLDER}etappe-bild-01.webp`,
      title: 'Debora und Barak',
      ref: 'Richter 4,1–16; 5,1–3.31',
      text: [
        'Als der Richter Ehud gestorben ist, vergessen die Israeliten Gott wieder. Diesmal gerät das Volk in die Hand Jabins, des Königs der Kanaaniter, der in Hazor regiert. Sein Feldhauptmann Sisera hat neunhundert eiserne Wagen. Zwanzig Jahre lang drückt er die Israeliten hart, bis sie endlich zu Gott rufen.',
        'In dieser Zeit ist Debora Richterin in Israel, eine Prophetin, die Gottes Wort weitergibt. Sie sitzt unter einer Palme im Bergland von Ephraim, zwischen Rama und Bethel. Die Israeliten kommen zu ihr, damit sie ihnen Recht spricht.',
        'Eines Tages lässt Debora den Barak rufen. „Gott hat dir geboten, mit zehntausend Männern auf den Berg Tabor zu ziehen“, sagt sie. „Er will Sisera mit seinen Wagen zum Bach Kison kommen lassen und ihn in deine Hand geben.“ „Wenn du mit mir gehst, gehe ich“, antwortet Barak, „wenn nicht, gehe ich nicht.“ „Ich gehe mit dir“, sagt Debora.',
        'Als Sisera hört, dass Barak auf dem Tabor steht, ruft er alle seine Wagen zusammen. Da sagt Debora: „Auf, das ist der Tag! Gott zieht vor dir her!“ Barak steigt mit den zehntausend Männern den Berg hinab. Und Gott bringt Sisera und sein ganzes Heer in Verwirrung. Sisera springt von seinem Wagen und flieht zu Fuß. Von diesem Tag an wird Jabins Macht immer kleiner.',
        'Da singen Debora und Barak ein Danklied: „Lobt Gott, dass Israel wieder frei ist!“ Und das Land hat vierzig Jahre Ruhe.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Unter welchem Baum sitzt Debora?', options: ['unter einer Palme', 'unter einer Eiche', 'unter einer Zeder'], answer: 0 },
        { q: 'Wie viele Männer soll Barak auf den Berg Tabor mitnehmen?', options: ['zehntausend', 'neunhundert', 'zwanzig'], answer: 0 },
        { q: 'Was singen Debora und Barak am Ende?', options: ['ein Danklied an Gott', 'ein Schlaflied', 'ein Spottlied'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PLACEHOLDER}etappe-bild-02.webp`,
      title: 'Die Midianiter kommen',
      ref: 'Richter 6,1–10',
      text: [
        'Vierzig Jahre sind vergangen, seit Debora und Barak ihr Danklied gesungen haben. Wieder vergessen die Israeliten Gott. Sieben Jahre lang sind die Midianiter stärker als sie.',
        'Jedes Jahr, wenn das Korn auf den Feldern reif wird, ziehen die Midianiter und Amalekiter und Leute aus dem Osten herauf. Sie bringen ihre Zelte und ihre Tiere mit, und ihre Kamele sind so viele, dass sie keiner zählen kann. Wie ein Schwarm Heuschrecken fallen sie ins Land ein und fressen alles ab, was gewachsen ist, bis hinunter nach Gaza. Sie lassen nichts übrig, nicht ein Schaf, nicht ein Rind, nicht einen Esel.',
        'Die Israeliten verstecken sich in Felsspalten, in Höhlen und in Bergfestungen. Sie sind arm geworden und fühlen sich klein vor den Midianitern. Endlich rufen sie zu Gott um Hilfe.',
        'Gott hat ihr Rufen gehört. Er schickt einen Propheten zu ihnen. Der sagt: „So spricht Gott, der Gott Israels: Ich habe euch aus Ägypten geführt, aus dem Haus der Sklaven. Ich habe euch dieses Land gegeben. Ich habe zu euch gesagt: Ich bin euer Gott. Aber ihr habt nicht auf mich gehört.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Säcke in die Höhle schieben (hoehle, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie lange sind die Midianiter stärker als Israel?', options: ['sieben Jahre', 'zwanzig Jahre', 'vierzig Jahre'], answer: 0 },
        { q: 'Wohin verstecken sich die Israeliten?', options: ['in Höhlen und Felsspalten', 'in Zelten am Fluss', 'hinter hohen Stadtmauern'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PLACEHOLDER}etappe-bild-03.webp`,
      title: 'Gideon in der Kelter',
      ref: 'Richter 6,11–18',
      text: [
        'In Ophra, im Land Manasse, steht eine große Eiche, die einem Mann namens Joas gehört. Sein Sohn Gideon drischt dort Weizen, und zwar in einer Kelter. Das ist ein Becken im Felsen, in dem man sonst Trauben presst. Hier sieht ihn kein Midianiter, und so bringt er das Korn in Sicherheit.',
        'Da setzt sich ein Engel Gottes unter die Eiche. „Gott ist mit dir, du starker Held!“, sagt er zu Gideon. Gideon wundert sich. „Mein Herr“, antwortet er, „wenn Gott mit uns ist, warum ist uns dann das alles geschehen? Wo sind die Wunder, von denen unsere Väter erzählt haben? Jetzt hat Gott uns verlassen und den Midianitern ausgeliefert.“',
        'Aber Gott wendet sich ihm zu. „Geh hin in deiner Kraft und rette Israel vor den Midianitern“, sagt er. „Ich habe dich gesandt!“ „Wie soll ich das tun?“, fragt Gideon. „Meine Familie ist die geringste in Manasse, und ich bin der Kleinste in meines Vaters Haus.“ „Ich will mit dir sein“, antwortet Gott, „und du wirst die Midianiter besiegen, als wären sie nur ein einziger Mann.“',
        'Gideon hört zu und denkt nach. Er möchte ganz sicher sein, dass wirklich Gott mit ihm spricht.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Spreu im Wind (worfeln, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo drischt Gideon seinen Weizen?', options: ['in einer Kelter', 'auf dem Dach', 'am Fluss'], answer: 0 },
        { q: 'Was sagt Gott zu Gideon?', options: ['„Ich will mit dir sein.“', '„Du musst allein gehen.“', '„Geh zurück nach Ägypten.“'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PLACEHOLDER}etappe-bild-04.webp`,
      title: 'Feuer aus dem Fels',
      ref: 'Richter 6,17–24',
      text: [
        '„Wenn du mir gnädig bist“, bittet Gideon den Engel, „dann gib mir ein Zeichen, dass du es wirklich bist, der mit mir redet. Geh nicht weg, bis ich wiederkomme und dir eine Gabe bringe.“ „Ich bleibe, bis du zurückkommst“, antwortet der Engel.',
        'Gideon geht und bereitet ein Ziegenböcklein zu. Aus einer großen Menge Mehl backt er ungesäuertes Brot. Das Fleisch legt er in einen Korb, die Brühe füllt er in einen Topf, und so bringt er alles zu der Eiche. „Leg das Fleisch und das Brot dort auf den Felsen“, sagt der Engel Gottes, „und gieß die Brühe aus.“ Gideon tut es.',
        'Da berührt der Engel mit der Spitze seines Stabes das Fleisch und das Brot. Feuer fährt aus dem Felsen und verzehrt alles. Als Gideon wieder aufblickt, ist der Engel verschwunden. Gideon erschrickt. „Ach, mein Gott“, ruft er, „ich habe einen Engel Gottes von Angesicht gesehen!“',
        'Aber Gott spricht zu ihm: „Friede sei mit dir! Fürchte dich nicht, du wirst nicht sterben.“ Da baut Gideon dort einen Altar und nennt ihn: Gott ist der Friede. In Ophra bleibt er noch lange stehen.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Das Wort legen (wort, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was verzehrt das Fleisch und das Brot?', options: ['Feuer aus dem Felsen', 'ein starker Sturm', 'ein hungriger Hirte'], answer: 0 },
        { q: 'Was sagt Gott zu Gideon, nachdem der Engel verschwunden ist?', options: ['„Friede sei mit dir! Fürchte dich nicht.“', '„Geh sofort nach Hause.“', '„Bau eine Mauer.“'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PLACEHOLDER}etappe-bild-05.webp`,
      title: 'Der Altar des Baal',
      ref: 'Richter 6,25–32',
      text: [
        'In derselben Nacht spricht Gott noch einmal zu Gideon. „Reiß den Altar nieder, den dein Vater für Baal gebaut hat“, sagt er, „und haue den Pfahl daneben um. Dann baue mir oben auf dem Felsen einen Altar.“ Baal ist ein Götze, den damals viele anbeten, obwohl er kein Gott ist.',
        'Gideon nimmt zehn seiner Knechte mit und tut, was Gott ihm gesagt hat. Er fürchtet sich vor seiner Familie und vor den Leuten der Stadt. Darum tut er es nachts und nicht am Tag.',
        'Am Morgen sehen die Leute der Stadt, dass der Altar Baals zerbrochen ist. Auf dem neuen Altar liegt ein Opfer. „Wer hat das getan?“, fragen sie, und bald wissen sie es: Es war Gideon, der Sohn des Joas. Sie sind so zornig, dass sie ihn bestrafen wollen. Vor Joas’ Haus rufen sie: „Gib deinen Sohn heraus!“',
        'Aber Joas stellt sich vor seinen Sohn. „Wollt ihr für Baal streiten?“, fragt er. „Wenn Baal ein Gott ist, dann soll er selbst für sich streiten, weil sein Altar zerbrochen ist.“ Seit diesem Tag nennt man Gideon auch Jerubbaal. Das heißt: Baal soll mit ihm streiten.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Zu welcher Zeit reißt Gideon den Altar des Baal nieder?', options: ['in der Nacht', 'am Mittag', 'zur Erntezeit'], answer: 0 },
        { q: 'Wer stellt sich vor Gideon?', options: ['sein Vater Joas', 'Barak', 'ein Prophet'], answer: 0 },
        { q: 'Wie nennt man Gideon seit diesem Tag auch?', options: ['Jerubbaal', 'Sisera', 'Ehud'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PLACEHOLDER}etappe-bild-06.webp`,
      title: 'Das Fell auf der Tenne',
      ref: 'Richter 6,33–40',
      text: [
        'Wieder ziehen die Midianiter und Amalekiter und die Völker aus dem Osten herauf. Sie schlagen ihr Lager in der Ebene Jesreel auf. Da erfüllt Gottes Geist den Gideon. Er bläst die Posaune, ein gebogenes Horn, und ruft seine Familie, und sie kommen zu ihm. Er schickt auch Boten zu ganz Manasse und zu Asser, Sebulon und Naftali. Die Männer ziehen ihm entgegen.',
        'Aber Gideon möchte es noch genauer wissen. „Gott“, sagt er, „du hast gesagt, dass du Israel durch meine Hand retten willst. Dann lege ich ein Fell mit der Wolle auf die Tenne. Liegt am Morgen nur auf dem Fell Tau und ist der Boden ringsum trocken, dann weiß ich, dass du es tust.“ Die Tenne ist der feste Platz im Freien, auf dem das Korn gedroschen wird.',
        'So geschieht es. Als Gideon früh am Morgen aufsteht, ist der Boden trocken. Aber das Fell ist so nass, dass er den Tau auspressen kann, eine ganze Schale voll Wasser.',
        'Doch Gideon bittet noch einmal: „Sei mir nicht böse, dass ich noch einmal frage. Nur noch dieses eine Mal will ich es mit dem Fell versuchen. Diesmal soll das Fell trocken bleiben und auf dem Boden ringsum Tau liegen.“ Und Gott tut es in dieser Nacht. Das Fell ist trocken, und auf der ganzen Erde liegt Tau. Nun weiß Gideon, dass er sich auf Gott verlassen kann.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Die Nacht vergeht (tau, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was legt Gideon auf die Tenne?', options: ['ein Fell mit Wolle', 'einen Mantel', 'einen Sack Mehl'], answer: 0 },
        { q: 'Worum bittet Gideon Gott ein zweites Mal?', options: ['dass das Fell trocken bleibt und der Boden nass wird', 'dass es regnet', 'dass das Fell verschwindet'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PLACEHOLDER}etappe-bild-07.webp`,
      title: 'Zu viele Männer',
      ref: 'Richter 7,1–3',
      text: [
        'Früh am Morgen bricht Gideon mit allen Männern auf, die zu ihm gekommen sind. Sie lagern an der Quelle Harod. Unten in der Ebene, nördlich von ihnen, liegt das Lager der Midianiter am Fuß des Hügels More.',
        'Da sagt Gott zu Gideon: „Du hast zu viele Männer bei dir. Wenn ich dir die Midianiter in die Hände gebe, könnte Israel sich rühmen und sagen: Das habe ich selbst geschafft.“ Darum soll Gideon vor allen ausrufen: „Wer sich fürchtet und Angst hat, darf umkehren und nach Hause gehen!“',
        'Und viele machen sich auf den Heimweg. Zweiundzwanzigtausend Männer kehren um. Nur zehntausend bleiben bei Gideon. Sie sehen den anderen nach, und im Lager wird es still. Aber Gott sagt zu Gideon: „Es sind immer noch zu viele.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Wer geht heim? (weiche, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer darf nach Hause gehen?', options: ['wer Angst hat', 'wer müde ist', 'wer das älteste Zelt hat'], answer: 0 },
        { q: 'Wie viele Männer bleiben bei Gideon?', options: ['zehntausend', 'zweiundzwanzigtausend', 'neunhundert'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PLACEHOLDER}etappe-bild-08.webp`,
      title: 'Am Wasser',
      ref: 'Richter 7,4–8',
      text: [
        '„Führe die Männer hinab ans Wasser“, sagt Gott zu Gideon. „Dort will ich sie für dich prüfen. Wer mit dir ziehen soll, den sage ich dir, und wer nicht mit dir ziehen soll, der bleibt hier.“ Gideon führt die Männer zum Bach hinunter.',
        'Am Ufer sagt Gott: „Stelle die zusammen, die das Wasser mit der Hand zum Mund führen. Stelle besonders die, die sich zum Trinken auf die Knie niederlassen.“ Die meisten Männer knien am Bach nieder und trinken so. Nur dreihundert Männer schöpfen das Wasser mit der Hand und trinken es aus der Hand.',
        '„Durch diese dreihundert will ich euch retten und die Midianiter in deine Hände geben“, sagt Gott zu Gideon. „Die anderen lass alle nach Hause gehen.“',
        'Die dreihundert nehmen Vorrat und ihre Posaunen mit. Alle anderen schickt Gideon heim, jeden in sein Zelt. Nur die dreihundert behält er bei sich. Unten in der Ebene liegt das riesige Lager der Midianiter.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Wimmelbild (wimmelbild, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele Männer behält Gideon bei sich?', options: ['dreihundert', 'zehntausend', 'zweiundzwanzigtausend'], answer: 0 },
        { q: 'Was tun die meisten Männer am Bach?', options: ['Sie knien nieder und trinken.', 'Sie waschen ihre Füße.', 'Sie füllen ihre Krüge.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PLACEHOLDER}etappe-bild-09.webp`,
      title: 'Der Traum im Lager',
      ref: 'Richter 7,9–15',
      text: [
        'In derselben Nacht sagt Gott zu Gideon: „Steh auf und geh hinab zum Lager, denn ich habe es in deine Hände gegeben. Wenn du dich fürchtest, nimm deinen Diener Pura mit und hör dir an, was die Midianiter reden. Dann werden deine Hände stark sein.“',
        'Gideon und Pura gehen den Hang hinab, bis vorn an die Wachposten. Unten im Tal liegen die Midianiter und Amalekiter und alle Völker aus dem Osten wie ein Schwarm Heuschrecken. Ihre Kamele sind so viele wie der Sand am Meer.',
        'Da hört Gideon, wie einer einem anderen seinen Traum erzählt: „Mir hat geträumt, ein rundes Gerstenbrot rollte in unser Lager. Es stieß an ein Zelt, und das Zelt stürzte um und lag am Boden.“ „Das ist nichts anderes als das Schwert Gideons, des Sohnes des Joas, des Israeliten“, antwortet der andere. „Gott hat die Midianiter und das ganze Heer in seine Hand gegeben.“',
        'Als Gideon das hört, verneigt er sich und dankt Gott. Dann geht er zurück ins Lager der Israeliten und ruft: „Auf, Gott hat das Lager der Midianiter in eure Hände gegeben!“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Leise den Hang hinab (schleichen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wen nimmt Gideon mit zum Lager der Midianiter?', options: ['seinen Diener Pura', 'seinen Vater Joas', 'Barak'], answer: 0 },
        { q: 'Wovon träumt der Midianiter?', options: ['von einem Gerstenbrot', 'von einem Schaf', 'von einer Brücke'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PLACEHOLDER}etappe-bild-10-v2.webp`,
      title: 'Krüge, Fackeln und Posaunen',
      ref: 'Richter 7,16–22',
      text: [
        'Gideon teilt die dreihundert Männer in drei Gruppen. Jedem gibt er eine Posaune in die eine Hand und einen leeren Tonkrug in die andere, und in jedem Krug steckt eine Fackel. „Seht auf mich und macht es genauso“, sagt er. „Wenn ich an den Rand des Lagers komme, tut ihr, was ich tue. Und wenn ich die Posaune blase, dann blast auch ihr rings um das ganze Lager und ruft: Für Gott und für Gideon!“',
        'Mitten in der Nacht kommen Gideon und seine hundert Männer an den Rand des Lagers. Gerade haben die Midianiter ihre Wachen neu aufgestellt. Da blasen sie die Posaunen und zerschlagen die Krüge in ihren Händen, und die beiden anderen Gruppen tun es ebenso. Rings um das ganze Lager leuchten die Fackeln in der Dunkelheit auf. Überall schallen die Posaunen: „Für Gott und für Gideon!“',
        'Die dreihundert bleiben, jeder an seinem Platz um das Lager herum, stehen. Die Midianiter schrecken aus dem Schlaf, laufen durcheinander und schreien. Denn Gott bringt das ganze Lager in Unordnung. Das Heer flieht.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Auf Gideons Zeichen (zeichen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was steckt in den Tonkrügen der Männer?', options: ['Fackeln', 'Brot', 'Wasser'], answer: 0 },
        { q: 'Was tun die dreihundert, während das Heer flieht?', options: ['Sie bleiben an ihrem Platz um das Lager.', 'Sie laufen ins Lager hinein.', 'Sie schlafen im Zelt.'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PLACEHOLDER}etappe-bild-11.webp`,
      title: 'Ephraim und die Furten',
      ref: 'Richter 7,23–8,3; 8,4',
      text: [
        'Nach dieser Nacht rufen die Israeliten die Männer von Naftali, Asser und ganz Manasse zusammen, und sie ziehen den fliehenden Midianitern nach. Gideon schickt auch Boten ins Bergland Ephraim: „Kommt herab und besetzt die Furten am Jordan, bevor die Midianiter sie erreichen!“ Eine Furt ist eine flache Stelle, an der man durch den Fluss gehen kann.',
        'Die Männer von Ephraim eilen herbei und besetzen die Furten. Sie besiegen auch zwei Fürsten der Midianiter, Oreb und Seeb. Doch als alles vorbei ist, kommen sie zornig zu Gideon. „Warum hast du uns nicht gerufen, als du gegen die Midianiter gezogen bist?“, fragen sie. Sie streiten heftig mit ihm.',
        'Gideon bleibt ruhig. „Was habe ich im Vergleich zu euch getan?“, sagt er. „Ist nicht schon die Nachlese von Ephraim besser als die ganze Weinernte meiner Familie? Gott hat die Fürsten der Midianiter in eure Hände gegeben. Wie hätte ich tun können, was ihr getan habt?“ Die Nachlese ist das, was nach der Ernte noch an den Reben hängt. Als Gideon so redet, legt sich ihr Zorn.',
        'Dann zieht Gideon mit seinen dreihundert Männern über den Jordan. Sie sind müde, aber sie bleiben dran, bis die Midianiter ganz besiegt sind.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer kommt zornig zu Gideon?', options: ['die Männer von Ephraim', 'Barak', 'die Midianiter'], answer: 0 },
        { q: 'Wie antwortet Gideon den Männern von Ephraim?', options: ['ruhig und freundlich', 'mit lauten Worten', 'gar nicht'], answer: 0 },
        { q: 'Was nennt Gideon besser als die ganze Weinernte seiner Familie?', options: ['die Nachlese von Ephraim', 'die Ähren vom Feld', 'das Wasser vom Bach'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PLACEHOLDER}etappe-bild-12.webp`,
      title: 'Gott soll euer Herr sein',
      ref: 'Richter 8,22–28',
      text: [
        'Nach dem Sieg kommen die Israeliten zu Gideon. „Sei unser Herrscher“, sagen sie, „du und dein Sohn und dein Enkel. Denn du hast uns aus der Hand der Midianiter gerettet.“',
        'Aber Gideon antwortet: „Ich will nicht euer Herr sein, und mein Sohn soll es auch nicht sein. Gott soll euer Herr sein.“ Nur um eines bittet er sie: Jeder soll ihm die goldenen Stirnbänder geben, die er bei den Feinden erbeutet hat. Die Männer breiten einen Mantel aus und werfen ihre Stirnbänder darauf. Es kommt sehr viel Gold zusammen.',
        'Gideon macht daraus ein Priesterkleid und stellt es in seine Stadt Ophra. Später aber beten die Leute dieses Kleid an, und das wird für Gideon und sein Haus zu einem Fehler.',
        'Die Midianiter erheben ihren Kopf nicht mehr. Das Land hat vierzig Jahre Frieden, solange Gideon lebt. Und der Altar in Ophra, den Gideon einst gebaut hat, trägt weiter den Namen: Gott ist der Friede.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Memory (memory, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was antwortet Gideon, als sie ihn zum Herrscher machen wollen?', options: ['„Gott soll euer Herr sein.“', '„Ja, ich werde euer König.“', '„Mein Sohn soll es werden.“'], answer: 0 },
        { q: 'Wie lange hat das Land Frieden, solange Gideon lebt?', options: ['vierzig Jahre', 'sieben Jahre', 'zwanzig Jahre'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wer ist Richterin in Israel, als Barak auf den Berg Tabor zieht?', options: ['Debora', 'Pura', 'Joas'], answer: 0 },
    { q: 'Wo drischt Gideon heimlich seinen Weizen?', options: ['in einer Kelter', 'auf dem Dach', 'am Fluss'], answer: 0 },
    { q: 'Was legt Gideon auf die Tenne, um ein Zeichen zu bekommen?', options: ['ein Fell mit Wolle', 'einen Mantel', 'einen Sack Mehl'], answer: 0 },
    { q: 'Wie viele Männer behält Gideon bei sich?', options: ['dreihundert', 'zehntausend', 'zweiundzwanzigtausend'], answer: 0 },
    { q: 'Was steckt in den Krügen der Männer?', options: ['Fackeln', 'Brot', 'Wasser'], answer: 0 },
    { q: 'Was antwortet Gideon, als sie ihn zum Herrscher machen wollen?', options: ['„Gott soll euer Herr sein.“', '„Ja, ich werde euer König.“', '„Mein Sohn soll es werden.“'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(gideon, gideonEn)
