/**
 * Abenteuer "Josua" (Josua 1–6 und 24) für 8 bis 10 Jahre: 10 Etappen, Untertitel "Mut für das neue Land". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Josua/ENTWURF_Josua.md (Phase 1, 20.10.2026), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 Proviant packen (neu), 2 Unter dem Flachs verstecken (neu), 3 Am Seil herablassen (neu),
 * 4 Im Gleichschritt (neu), 5 Memory (alt), 6 Fladen backen (neu), 7 nur Quiz, 8 Ruhe bewahren (neu), 9 nur Quiz, 10 Lückenvers (alt).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/josua/, images/abenteuer/spiele/josua/<spiel>/, audio/abenteuer/josua/.
 *
 * STAND 20.10.2026 (Phase 2a, nur Daten und Platzhalter): Jede Etappe hat eine Quiz-Aufgabe (PLATZHALTER bis Spiel/Bild) und ein vorhandenes Etappenbild von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit den ersten zehn Stationen (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Vorlese-Aufnahmen gibt es noch nicht (`audio` fehlt): die App liest dann mit der Gerätestimme. Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { Journey } from '@/types/adventure'
import { josef } from './josef'
import { JOSUA_PATH } from './josuaPath'
import { localize } from './localize'
import { josuaEn } from './en/josua.en'

// PLATZHALTER bis zum eigenen Bild: die Etappenbilder von Josef (Ordner images/abenteuer/josef/); danach `images/abenteuer/josua/etappe-bild-NN.webp`
const PLACEHOLDER = 'images/abenteuer/josef/'

export const josua: Journey = {
  id: 'josua',
  title: 'Josua',
  subtitle: 'Mut für das neue Land',
  age: '8-10',
  downloadMb: 16, // PLATZHALTER: Größe mit den Bildern von Josef; wird mit den eigenen Bildern neu gemessen (der Test sagt die echte Größe)
  medal: josef.medal, // PLATZHALTER bis "Die Posaune von Jericho" (Widderhorn vor der Stadtmauer)
  // Geschenk-Ausmalbild: Die Posaunen von Jericho (sieben Priester mit Widderhörnern vor der ganzen Stadtmauer); PLATZHALTER bis zum eigenen Bild
  gift: { title: 'Die Posaunen von Jericho', image: josef.gift.image },
  // PLATZHALTER: die Karte von Josef (vier Stücke, 9824 × 1632 px) mit den ersten zehn Stationen und dem Perlenweg dorthin; Station 11 von Josef ist das Ziel (Prüfung)
  map: {
    images: josef.map.images,
    ring: josef.map.ring,
    aspect: josef.map.aspect,
    widthPx: josef.map.widthPx,
    stages: josef.map.stages.slice(0, 10),
    exam: josef.map.stages[10]!,
    path: JOSUA_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PLACEHOLDER}etappe-bild-01.webp`,
      title: 'Ein neuer Anführer',
      ref: 'Josua 1,1–18',
      text: [
        'Vierzig Jahre lang hat Mose das Volk Israel geführt, und nun ist er gestorben. Die Israeliten lagern bei Schittim, einer weiten Ebene östlich des Jordan, nur ein Fluss trennt sie noch von dem Land, das Gott ihnen versprochen hat. Der neue Anführer heißt Josua, er hat Mose lange gedient.',
        'Zu ihm spricht Gott: „Mose, mein Diener, ist gestorben. Mach dich nun auf, du und das ganze Volk, und zieht über den Jordan in das Land, das ich euch gebe. Wohin ihr eure Füße setzt, das schenke ich euch. Solange du lebst, wird niemand dir standhalten. Wie ich mit Mose war, so will ich mit dir sein, ich lasse dich nicht fallen und verlasse dich nicht.“',
        'Und dann sagt Gott es noch einmal: „Sei mutig und stark! Halte dich an alles, was Mose dir aufgetragen hat, und lass das Buch des Gesetzes nicht aus deinem Mund kommen. Denk Tag und Nacht darüber nach, dann wird dir gelingen, was du anpackst. Hab keine Angst und verzage nicht, denn Gott ist bei dir, wohin du auch gehst.“',
        'Josua ruft die Amtleute des Volkes. „Geht durch das Lager“, sagt er, „und sagt allen: Macht euch Vorrat bereit, denn in drei Tagen zieht ihr über den Jordan.“ Da antworten die Männer: „Alles, was du uns aufträgst, wollen wir tun, und wohin du uns sendest, dahin gehen wir. Gott sei mit dir, wie er mit Mose war!“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Proviant packen (packen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer führt das Volk, nachdem Mose gestorben ist?', options: ['Josua', 'Kaleb', 'Aaron'], answer: 0 },
        { q: 'Was soll Josua nach Gottes Wort sein?', options: ['mutig und stark', 'schnell und leise', 'reich und berühmt'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PLACEHOLDER}etappe-bild-02.webp`,
      title: 'Zwei Kundschafter',
      ref: 'Josua 2,1–7',
      text: [
        'Von Schittim aus schickt Josua heimlich zwei Männer los. „Seht euch das Land an“, sagt er, „und besonders die Stadt Jericho.“ Die beiden machen sich auf den Weg. Jericho ist eine Stadt mit einer starken Mauer, und sie kommen in das Haus einer Frau namens Rahab, das an der Stadtmauer steht. Dort bleiben sie über Nacht.',
        'Aber jemand hat sie gesehen. Dem König von Jericho wird gemeldet: „Heute Nacht sind Männer von den Israeliten gekommen, um das Land auszukundschaften.“ Sofort schickt der König Boten zu Rahab. „Gib die Männer heraus, die zu dir ins Haus gekommen sind!“',
        'Rahab hat die beiden schon versteckt. Auf ihrem Flachdach liegen Stängel von Flachs zum Trocknen ausgebreitet, und darunter hat sie die Männer verborgen. „Ja, es sind Männer bei mir gewesen“, sagt sie zu den Boten, „aber ich weiß nicht, woher sie kamen. Als es dunkel wurde und das Stadttor geschlossen werden sollte, sind sie fortgegangen. Lauft ihnen schnell nach, dann holt ihr sie noch ein!“',
        'Die Boten des Königs machen sich auf den Weg zum Jordan, bis zu den Furten. Kaum sind sie aus dem Tor, wird es hinter ihnen verschlossen.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Unter dem Flachs verstecken (verstecken, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wohin schickt Josua die beiden Männer?', options: ['nach Jericho', 'nach Hebron', 'nach Ägypten'], answer: 0 },
        { q: 'Wo versteckt Rahab die Männer?', options: ['auf dem Dach unter Flachs', 'im Keller unter Säcken', 'in einem Brunnen'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PLACEHOLDER}etappe-bild-03.webp`,
      title: 'Die rote Schnur',
      ref: 'Josua 2,8–24',
      text: [
        'Am Abend, bevor sich die Männer schlafen legen, steigt Rahab zu ihnen aufs Dach. „Ich weiß, dass Gott euch dieses Land gegeben hat“, sagt sie. „Alle Menschen hier haben Angst vor euch. Wir haben gehört, wie Gott das Wasser vor euch trocken gemacht hat, als ihr aus Ägypten gezogen seid. Euer Gott ist Gott oben im Himmel und unten auf der Erde.“ Dann bittet sie: „Schwört mir bei Gott, dass ihr auch meiner Familie Gutes tut, meinem Vater und meiner Mutter, meinen Brüdern und Schwestern, und rettet uns das Leben. Und gebt mir ein sicheres Zeichen.“',
        '„Unser Leben für das eure“, versprechen die Männer, „wenn du nicht verrätst, was wir hier tun. Wenn Gott uns das Land gibt, werden wir freundlich und treu an dir handeln.“',
        'Rahabs Haus gehört zur Stadtmauer, und so lässt sie die beiden durch das Fenster an einem Seil hinab. „Geht ins Gebirge und versteckt euch drei Tage“, sagt sie, „bis die Verfolger zurück sind. Dann zieht weiter.“ Die Männer erklären ihr das Zeichen: „Binde diese rote Schnur in das Fenster, durch das du uns herabgelassen hast, und hole deine ganze Familie zu dir ins Haus. Wer in deinem Haus bleibt, dem geschieht nichts.“ „Es soll so sein“, sagt Rahab und bindet die rote Schnur ans Fenster.',
        'Drei Tage bleiben die Männer im Gebirge, und die Verfolger finden sie nicht. Dann kehren sie zu Josua zurück: „Gott hat uns das ganze Land gegeben. Die Menschen dort verzagen vor uns.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Am Seil herablassen (abseilen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was bindet Rahab als Zeichen an ihr Fenster?', options: ['eine rote Schnur', 'ein weißes Tuch', 'einen grünen Zweig'], answer: 0 },
        { q: 'Wie lange sollen sich die Männer im Gebirge verstecken?', options: ['drei Tage', 'sieben Tage', 'eine Nacht'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PLACEHOLDER}etappe-bild-04.webp`,
      title: 'Der Jordan',
      ref: 'Josua 3,1–17',
      text: [
        'Früh am Morgen bricht Josua mit dem ganzen Volk von Schittim auf, und sie schlagen ihr Lager am Jordan auf. Drei Tage später gehen die Amtleute durch die Reihen und rufen: „Wenn ihr seht, dass die Priester die Lade des Bundes tragen, dann brecht auf und folgt ihr! Haltet aber einen weiten Abstand von etwa zweitausend Ellen, denn ihr seid diesen Weg noch nie gegangen.“ Die Lade ist die goldene Truhe, die das Volk schon durch die Wüste begleitet hat. Josua sagt zum Volk: „Macht euch bereit, denn morgen wird Gott Wunder unter euch tun.“',
        'Der Jordan ist jetzt in der Erntezeit voll bis über die Ufer. Josua sagt zu den Priestern: „Nehmt die Lade und geht dem Volk voran.“ Und zum Volk: „Daran sollt ihr merken, dass Gott mitten unter euch ist: Wenn die Füße der Priester im Wasser stehen, bleibt das Wasser von oben stehen wie ein Wall.“',
        'Die Priester tragen die Lade bis ans Ufer und tauchen die Füße in das Wasser. Da geschieht es: Das Wasser, das von oben kommt, bleibt weit weg bei der Stadt Adam stehen und türmt sich auf, das Wasser unten fließt zum Salzmeer ab, bis das Flussbett leer ist. Das Volk zieht gegenüber von Jericho hinüber. Die Priester stehen mit der Lade mitten im Jordan auf trockenem Boden, bis das ganze Volk hindurch ist.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Im Gleichschritt (schritt, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer trägt die Lade des Bundes?', options: ['die Priester', 'die Kundschafter', 'die Kinder'], answer: 0 },
        { q: 'Was geschieht mit dem Wasser, als die Priester die Füße hineintauchen?', options: ['Es bleibt stehen.', 'Es wird warm.', 'Es wird zu Eis.'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PLACEHOLDER}etappe-bild-05.webp`,
      title: 'Zwölf Steine',
      ref: 'Josua 4,1–24',
      text: [
        'Als das ganze Volk hinübergezogen ist, spricht Gott zu Josua: „Wähle zwölf Männer aus, aus jedem Stamm einen. Sie sollen aus dem Jordan zwölf Steine nehmen, von dem Platz, wo die Priester gestanden haben, und sie dorthin bringen, wo ihr heute Nacht lagert.“ Josua ruft die zwölf Männer: „Geht in den Fluss vor die Lade, und jeder von euch hebt einen Stein auf die Schulter, einen für jeden Stamm Israels.“',
        '„Die Steine sollen ein Zeichen unter euch sein“, sagt er. „Wenn eure Kinder euch eines Tages fragen: Was bedeuten diese Steine?, dann antwortet: Das Wasser des Jordan floss nicht mehr, als die Lade des Bundes hindurchgetragen wurde. Darum sollen diese Steine für immer daran erinnern.“ Die Männer tun es. Josua selbst richtet auch zwölf Steine mitten im Jordan auf, dort, wo die Priester gestanden haben.',
        'Die Priester bleiben im Flussbett, bis alles getan ist, und das Volk eilt hinüber. Dann steigen sie auf Josuas Befehl aus dem Jordan herauf. Kaum betreten sie das Ufer, kehrt das Wasser zurück und fließt wieder über die Ufer wie zuvor.',
        'Es ist der zehnte Tag des ersten Monats, als das Volk bei Gilgal lagert, östlich von Jericho. Dort stellt Josua die zwölf Steine auf. „Wenn eure Kinder fragen, was sie bedeuten“, sagt er, „dann erzählt ihnen: Israel ist auf trockenem Boden durch den Jordan gegangen, so wie Gott es einst beim Schilfmeer getan hat. Alle Völker sollen sehen, wie mächtig Gott ist.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Erinnerungs-Memory (memory, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo lagert das Volk, als Josua die Steine aufstellt?', options: ['in Gilgal', 'in Jericho', 'in Sichem'], answer: 0 },
        { q: 'Was sollen die Eltern antworten, wenn die Kinder nach den Steinen fragen?', options: ['Das Wasser des Jordan floss nicht mehr.', 'Wir haben sie für ein Haus gesammelt.', 'Gott hat sie uns geschenkt.'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PLACEHOLDER}etappe-bild-06.webp`,
      title: 'Brot aus dem neuen Land',
      ref: 'Josua 5,1.10–12',
      text: [
        'Die Könige im Land Kanaan haben gehört, dass Gott den Jordan vor den Israeliten trocken gemacht hat, und ihnen sinkt der Mut. Das Volk aber bleibt in Gilgal.',
        'Am vierzehnten Tag des Monats feiert Israel in der Ebene bei Jericho das Passafest, so wie Gott es ihnen aufgetragen hat, zur Erinnerung an den Auszug aus Ägypten. Am Tag danach essen die Menschen zum ersten Mal vom Ertrag des Landes: ungesäuerte Brote und geröstete Körner.',
        'Und noch etwas ist neu. Viele Jahre lang hat Gott dem Volk in der Wüste jeden Morgen das Manna gegeben, das Brot, das vom Himmel fällt. Doch am Tag, an dem sie vom Getreide des Landes essen, hört das Manna auf. Nun ernten sie, was im Land Kanaan wächst, und davon werden sie in diesem Jahr satt.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Fladen backen (backen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was hört auf, als das Volk vom Land isst?', options: ['das Manna', 'der Regen', 'der Wind'], answer: 0 },
        { q: 'Was essen die Menschen vom Ertrag des Landes?', options: ['Fladenbrote und geröstete Körner', 'Fisch und Datteln', 'Honig und Milch'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PLACEHOLDER}etappe-bild-07.webp`,
      title: 'Heiliger Boden',
      ref: 'Josua 5,13–6,5',
      text: [
        'Josua ist in der Nähe von Jericho. Als er aufschaut, steht ein Mann vor ihm. Josua geht auf ihn zu und fragt: „Gehörst du zu uns oder zu unseren Feinden?“ „Weder noch“, antwortet der Mann. „Ich bin der Fürst über das Heer Gottes, und jetzt bin ich gekommen.“',
        'Da wirft sich Josua mit dem Gesicht zur Erde nieder und betet an. „Was sagt mein Herr seinem Diener?“, fragt er. Der Fürst antwortet: „Zieh deine Schuhe aus, denn der Ort, auf dem du stehst, ist heilig.“ Und Josua tut es.',
        'Jericho ist fest verschlossen, denn die Menschen haben Angst vor den Israeliten: Niemand kommt heraus, und niemand geht hinein. Doch Gott spricht zu Josua: „Sieh, ich habe Jericho in deine Hand gegeben. Sechs Tage lang sollt ihr einmal um die Stadt ziehen. Sieben Priester sollen sieben Posaunen aus Widderhörnern vor der Lade hertragen. Am siebten Tag sollt ihr siebenmal um die Stadt ziehen, und die Priester sollen die Posaunen blasen. Wenn der lange Ton erklingt, soll das ganze Volk laut rufen. Dann fällt die Mauer der Stadt, und ihr könnt hineinziehen.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ruhig und ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wer steht plötzlich vor Josua?', options: ['der Fürst über das Heer Gottes', 'ein Bote des Königs', 'ein Hirte aus Jericho'], answer: 0 },
        { q: 'Was soll Josua ausziehen?', options: ['seine Schuhe', 'seinen Mantel', 'seinen Gürtel'], answer: 0 },
        { q: 'Was ist mit Jericho?', options: ['Die Stadt ist fest verschlossen.', 'Die Tore stehen weit offen.', 'Die Stadt ist leer.'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PLACEHOLDER}etappe-bild-08.webp`,
      title: 'Rund um die Stadt',
      ref: 'Josua 6,6–14',
      text: [
        'Josua ruft die Priester zusammen und sagt ihnen, was Gott aufgetragen hat: „Tragt die Lade des Bundes. Sieben Priester sollen sieben Posaunen aus Widderhörnern nehmen und vor der Lade hergehen.“ Zum Volk sagt er: „Zieht los und geht um die Stadt.“ Vorn gehen die Männer des Heeres, dann die sieben Priester mit den Posaunen, hinter ihnen wird die Lade getragen, und zuletzt kommt das ganze Volk.',
        'Aber Josua gibt noch eine Anweisung: „Ihr sollt nicht schreien, und kein Wort soll aus eurem Mund kommen, bis zu dem Tag, an dem ich sage: Ruft! Dann sollt ihr rufen.“',
        'Am ersten Tag bleibt es so, wie Gott gesagt hat. Die Priester blasen die Posaunen, die Lade wird einmal um die Stadt getragen, und das Volk folgt schweigend. Dann kehren alle ins Lager zurück und verbringen dort die Nacht. Am nächsten Morgen steht Josua früh auf, und noch einmal geht der Zug einmal um Jericho. So geschieht es sechs Tage lang. Die Tore von Jericho bleiben verschlossen.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Ruhe bewahren (still, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie viele Priester tragen Posaunen?', options: ['sieben', 'zwölf', 'drei'], answer: 0 },
        { q: 'Wie oft ziehen sie an den ersten sechs Tagen jeden Tag um die Stadt?', options: ['einmal', 'siebenmal', 'dreimal'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PLACEHOLDER}etappe-bild-09.webp`,
      title: 'Die Mauer fällt',
      ref: 'Josua 6,15–27',
      text: [
        'Am siebten Tag stehen sie bei Tagesanbruch auf und ziehen auf dieselbe Weise um die Stadt, doch heute siebenmal. Beim siebten Mal blasen die Priester die Posaunen, und Josua ruft dem Volk zu: „Macht ein Geschrei! Denn Gott hat euch die Stadt gegeben.“',
        'Er sagt auch, was nicht vergessen werden darf: „Rahab und alle, die in ihrem Haus sind, sollen am Leben bleiben, denn sie hat die Männer versteckt, die wir ausgesandt haben.“',
        'Da ruft das Volk laut, die Posaunen schallen, und die Mauer der Stadt fällt ein. Das Volk zieht in die Stadt. Josua sagt zu den beiden Männern, die das Land erkundet haben: „Geht in Rahabs Haus und holt sie heraus, mit allen, die zu ihr gehören, so wie ihr es ihr geschworen habt.“ Die Männer führen Rahab, ihren Vater und ihre Mutter, ihre Brüder und alle ihre Angehörigen aus der Stadt in Sicherheit, vor das Lager Israels.',
        'Rahab lebt von nun an bei den Israeliten. Und Gott ist mit Josua, und sein Name wird im ganzen Land bekannt.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie oft ziehen sie am siebten Tag um die Stadt?', options: ['siebenmal', 'einmal', 'zwölfmal'], answer: 0 },
        { q: 'Was geschieht mit der Mauer, als das Volk ruft?', options: ['Sie fällt ein.', 'Sie bleibt stehen.', 'Sie wird abgetragen.'], answer: 0 },
        { q: 'Wer soll am Leben bleiben?', options: ['Rahab und alle in ihrem Haus', 'nur die Priester', 'niemand'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PLACEHOLDER}etappe-bild-11.webp`,
      title: 'Der Stein unter der Eiche',
      ref: 'Josua 24 (gekürzt)',
      text: [
        'Viele Jahre sind vergangen. Das Volk Israel wohnt im Land, das Gott ihm gegeben hat, und Josua ist alt geworden. Er ruft alle Stämme nach Sichem, ihre Ältesten, Anführer, Richter und Amtleute, und sie stellen sich vor Gott.',
        'Josua erinnert sie, was Gott für sie getan hat: wie er Abraham in dieses Land geführt, das Volk aus Ägypten befreit und durch das Meer geleitet hat, wie er sie in der Wüste getragen und ihnen schließlich dieses Land gegeben hat. „Ihr wohnt in Städten, die ihr nicht gebaut habt, und esst von Weinbergen und Ölbäumen, die ihr nicht gepflanzt habt“, sagt Josua. „Darum dient Gott aufrichtig und treu. Und wenn es euch nicht gefällt, ihm zu dienen, dann entscheidet heute, wem ihr dienen wollt. Ich aber und mein Haus, wir wollen Gott dienen.“',
        'Das Volk antwortet: „Das sei ferne von uns, dass wir Gott verlassen! Er hat uns aus Ägypten geführt und auf unserem ganzen Weg beschützt. Wir wollen Gott dienen, denn er ist unser Gott.“',
        'An diesem Tag schließt Josua mit dem Volk einen Bund. Er schreibt die Worte in das Buch des Gesetzes Gottes und richtet unter der Eiche einen großen Stein auf. „Seht, dieser Stein soll Zeuge sein“, sagt er, „denn er hat alle Worte gehört, die Gott zu uns gesprochen hat.“ Dann schickt er das Volk heim. Nach diesen Ereignissen stirbt Josua im Alter von hundertzehn Jahren, und das Volk dient Gott, solange er und die Ältesten nach ihm leben.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild; vorgesehen: Lückenvers (lueckenvers, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo versammelt Josua das Volk?', options: ['in Sichem', 'in Jericho', 'in Gilgal'], answer: 0 },
        { q: 'Was richtet Josua unter der Eiche auf?', options: ['einen großen Stein', 'ein Zelt', 'einen Altar mit Feuer'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wer führt das Volk Israel nach Mose?', options: ['Josua', 'Kaleb', 'Aaron'], answer: 0 },
    { q: 'Wo versteckt Rahab die beiden Männer?', options: ['auf dem Dach unter Flachs', 'im Keller unter Säcken', 'in einem Brunnen'], answer: 0 },
    { q: 'Was geschieht mit dem Wasser des Jordan, als die Priester die Füße hineintauchen?', options: ['Es bleibt stehen.', 'Es wird warm.', 'Es wird zu Eis.'], answer: 0 },
    { q: 'Wie viele Steine nimmt das Volk aus dem Jordan mit?', options: ['zwölf', 'sieben', 'vierzig'], answer: 0 },
    { q: 'Wie oft ziehen sie am siebten Tag um Jericho?', options: ['siebenmal', 'einmal', 'zwölfmal'], answer: 0 },
    { q: 'Wer soll in Jericho am Leben bleiben?', options: ['Rahab und alle in ihrem Haus', 'nur die Priester', 'niemand'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(josua, josuaEn)
