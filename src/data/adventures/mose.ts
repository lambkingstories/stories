/**
 * Abenteuer "Mose" (2. Mose 1–20, 32–34 und 40,34–38) für 8 bis 10 Jahre: 15 Etappen, Untertitel "Der Weg in die Freiheit". Entstanden nach dem Skill "LambKing Abenteuer Skill".
 * Quelle der Texte: D:/Claude/Abenteuer-Mose/ENTWURF_Mose.md (Phase 1, 20.10.2026, zweiter Durchgang am selben Abend), Plan: ETAPPENPLAN.md, Figuren: FIGUREN.md, Entscheidungen: ENTSCHEIDUNGEN-zur-Pruefung.md.
 * Die richtige Antwort steht in den Daten IMMER zuerst (answer: 0); die App mischt die Antworten beim Anzeigen.
 * Spiele (Wahl der Leitung vom 20.10.2026, höchstens zwei alte Mechaniken): 1 nur Quiz, 2 Körbchen flechten (neu), 3 nur Quiz, 4 Dem Leuchten nachgehen (neu), 5 Unterschiede finden (neu),
 * 6 Lückenvers (alt), 7 Wimmelbild (alt), 8 nur Quiz, 9 nur Quiz, 10 Packen (neu), 11 Mirjams Pauke (neu), 12 Manna sammeln (neu), 13 Worte ordnen (neu), 14 nur Quiz, 15 Der Wolke folgen (neu).
 * Dateien dieses Abenteuers liegen NUR in diesen Ordnern (der normale Build lässt sie weg, siehe vite.config.noah.ts):
 * images/abenteuer/mose/, images/abenteuer/spiele/mose/<spiel>/, audio/abenteuer/mose/.
 *
 * STAND 20.10.2026 (Phase 2a, nur Daten und Platzhalter): Jede Etappe hat eine Quiz-Aufgabe (PLATZHALTER bis Spiel/Bild) und ein vorhandenes Etappenbild von Josef;
 * die Karte (Bilder, Stationen, Perlenweg) ist die von Josef mit fünfzehn Stationen und dem Ziel (PLATZHALTER bis zum eigenen Panorama); Medaille und Geschenk sind ebenfalls die von Josef.
 * Vorlese-Aufnahmen gibt es noch nicht (`audio` fehlt): die App liest dann mit der Gerätestimme (Liste der Aufnahmen: D:/Claude/Abenteuer-Mose/NEUAUFNAHME-Mose.md).
 * Das Abenteuer ist nicht öffentlich: es ist hinter dem Vorschau-Link versteckt (`src/data/adventures/index.ts`).
 */
import type { DiffGame, Journey, WordsGame } from '@/types/adventure'
import { josef } from './josef'
import { MOSE_PATH } from './mosePath'
import { localize } from './localize'
import { moseEn } from './en/mose.en'

// PLATZHALTER bis zum eigenen Bild: die Etappenbilder von Josef (Ordner images/abenteuer/josef/); danach `images/abenteuer/mose/etappe-bild-NN.webp`
const PLACEHOLDER = 'images/abenteuer/josef/'

const G = 'images/abenteuer/spiele/mose/'

/**
 * Etappe 13, "Worte ordnen": die Wörter eines Satzes liegen in gemischter Folge auf Steinplättchen und werden der Reihe nach in den Satzstreifen gelegt (Bildauftrag M17; Hintergrund = das Etappenbild der Etappe,
 * Mischung immer gleich und nie in der richtigen Ordnung). Die Sätze stehen wörtlich im Text der Etappe; jede Sprache hat ihre eigenen Sätze (Runde 1 kurze, Runde 2 längere). Die Sätze der Frage der Etappe
 * ("Alles, was Gott gesagt hat, wollen wir tun.") sind hier nicht benutzt.
 * Bilder (noch nicht gemalt, bis dahin stehen Platzhalter): `worte/stein.webp` 260 × 110 (leer, das Wort schreibt die App), `worte/streifen.webp` 900 × 160 (leer), beide transparent.
 */
const WORTE: WordsGame = {
  background: `${PLACEHOLDER}etappe-bild-04.webp`,
  chip: `${G}worte/stein.webp`,
  strip: `${G}worte/streifen.webp`,
  rounds: [
    { hint: 'Lege die Wörter in der richtigen Reihenfolge in den Streifen.', sentences: ['Du sollst nicht töten.', 'Ehre Vater und Mutter.', 'Halte den Ruhetag heilig.'] },
    { hint: 'Jetzt längere Sätze. Gottes Worte aus dem Text.', sentences: ['Du sollst keine anderen Götter neben mir haben.', 'Du sollst meinen Namen nicht missbrauchen.', 'Ich bin dein Gott, der dich aus Ägypten befreit hat.'] }
  ]
}

/**
 * Etappe 5, "Unterschiede finden": zwei Bilder des Lagers am Berg Gottes, das rechte hat einige kleine Dinge mehr; das Kind tippt rechts, was links fehlt (Bildauftrag M12; zwei eigene Grundbilder). Runde 1 vier große
 * Dinge, Runde 2 sechs kleinere. Lagen (Mitte und Breite, Prozent des Bildes) sind vorläufig geschätzt, bis die Datei `unterschied-messung.json` der Spielbild-Sitzung da ist.
 * Bilder (noch nicht gemalt, bis dahin stehen Platzhalter): `unterschied/lager-1.webp`, `lager-2.webp` je 900 × 675 (ohne die Zusatzdinge), zehn Sprites höchstens 160 px: `stab`, `krug`, `buendel`, `schaf`, `korb`,
 * `brot`, `decke`, `schuhe`, `vogel`, `schlauch` (transparent).
 */
const UNTERSCHIED: DiffGame = {
  rounds: [
    {
      hint: 'Das rechte Lager hat ein paar Dinge mehr. Tippe rechts, was links fehlt.',
      base: `${G}unterschied/lager-1.webp`,
      items: [
        { image: `${G}unterschied/stab.webp`, x: 22, y: 64, w: 12 },
        { image: `${G}unterschied/krug.webp`, x: 48, y: 74, w: 10 },
        { image: `${G}unterschied/buendel.webp`, x: 76, y: 62, w: 12 },
        { image: `${G}unterschied/schaf.webp`, x: 60, y: 36, w: 12 }
      ]
    },
    {
      hint: 'Noch einmal, jetzt sind es mehr und kleinere Dinge.',
      base: `${G}unterschied/lager-2.webp`,
      items: [
        { image: `${G}unterschied/korb.webp`, x: 18, y: 70, w: 9 },
        { image: `${G}unterschied/brot.webp`, x: 36, y: 40, w: 8 },
        { image: `${G}unterschied/decke.webp`, x: 50, y: 78, w: 10 },
        { image: `${G}unterschied/schuhe.webp`, x: 68, y: 54, w: 7 },
        { image: `${G}unterschied/vogel.webp`, x: 84, y: 24, w: 8 },
        { image: `${G}unterschied/schlauch.webp`, x: 28, y: 28, w: 8 }
      ]
    }
  ]
}

export const mose: Journey = {
  id: 'mose',
  title: 'Mose',
  subtitle: 'Der Weg in die Freiheit',
  age: '8-10',
  downloadMb: 16, // PLATZHALTER: Größe mit den Bildern von Josef; wird mit den eigenen Bildern neu gemessen (der Test sagt die echte Größe)
  medal: josef.medal, // PLATZHALTER bis "Der brennende Dornbusch" (Busch mit Flamme aus Licht, Sandalen und Hirtenstab)
  // Geschenk-Ausmalbild: Der Weg durch das Meer (Mose mit erhobenem Stab, zwei Wasserwände, trockener Weg, Volk, Wolkensäule); PLATZHALTER bis zum eigenen Bild
  gift: { title: 'Der Weg durch das Meer', image: josef.gift.image },
  // PLATZHALTER: die Karte von Josef (vier Stücke, 9824 × 1632 px) mit fünfzehn Stationen, dem Ziel und dem Perlenweg dorthin
  map: {
    images: josef.map.images,
    ring: josef.map.ring,
    aspect: josef.map.aspect,
    widthPx: josef.map.widthPx,
    stages: [
      { x: 0.0450, y: 0.42, d: 0.0342 },
      { x: 0.1063, y: 0.58, d: 0.0342 },
      { x: 0.1676, y: 0.42, d: 0.0342 },
      { x: 0.2289, y: 0.58, d: 0.0342 },
      { x: 0.2902, y: 0.42, d: 0.0342 },
      { x: 0.3515, y: 0.58, d: 0.0342 },
      { x: 0.4128, y: 0.42, d: 0.0342 },
      { x: 0.4741, y: 0.58, d: 0.0342 },
      { x: 0.5354, y: 0.42, d: 0.0342 },
      { x: 0.5967, y: 0.58, d: 0.0342 },
      { x: 0.6580, y: 0.42, d: 0.0342 },
      { x: 0.7193, y: 0.58, d: 0.0342 },
      { x: 0.7806, y: 0.42, d: 0.0342 },
      { x: 0.8419, y: 0.58, d: 0.0342 },
      { x: 0.9032, y: 0.42, d: 0.0342 }
    ],
    exam: { x: 0.9645, y: 0.58, d: 0.0342 },
    path: MOSE_PATH
  },
  stages: [
    {
      id: 1,
      image: `${PLACEHOLDER}etappe-bild-01.webp`,
      title: 'Das Volk in Ägypten',
      ref: '2. Mose 1,1–22',
      text: [
        'Viele Jahre sind vergangen, seit Jakob und seine Söhne nach Ägypten gezogen sind. Josef, der ihnen damals geholfen hat, ist längst gestorben, und aus der Familie Jakobs ist ein großes Volk geworden, das Volk Israel. So viele Menschen leben nun im Land Goschen, dass es von ihnen voll ist.',
        'Da kommt in Ägypten ein neuer König auf den Thron, ein Pharao, der von Josef nichts mehr weiß. Er bekommt Angst vor dem Volk, das so groß und stark geworden ist, und zwingt die Israeliten zu schwerer Arbeit. Sie müssen Lehm kneten, Ziegel formen und für den König Vorratsstädte bauen, von früh bis spät. Doch je härter sie arbeiten müssen, desto mehr wird das Volk.',
        'Schließlich befiehlt der König den beiden Hebammen der Israeliten, Schifra und Pua, sie sollen die neugeborenen Jungen nicht am Leben lassen. Aber Schifra und Pua haben Ehrfurcht vor Gott und tun nicht, was der König sagt, sondern lassen die Kinder leben. Gott sieht es und schenkt den beiden Frauen viel Gutes, und das Volk wächst und wächst.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißen die beiden Hebammen?', options: ['Schifra und Pua', 'Mirjam und Zippora', 'Sara und Rahel'], answer: 0 },
        { q: 'Was müssen die Israeliten für den König formen?', options: ['Ziegel', 'Schwerter', 'Krüge'], answer: 0 },
        { q: 'Warum tun Schifra und Pua nicht, was der König sagt?', options: ['Sie haben Ehrfurcht vor Gott.', 'Sie haben keine Zeit.', 'Sie kennen den Befehl nicht.'], answer: 0 }
      ]
    },
    {
      id: 2,
      image: `${PLACEHOLDER}etappe-bild-02.webp`,
      title: 'Das Körbchen im Schilf',
      ref: '2. Mose 2,1–10',
      text: [
        'Der König gibt nicht nach, und bald soll jeder neugeborene Junge der Israeliten in den Nil geworfen werden. In dieser Zeit bekommt eine Frau aus dem Stamm Levi einen Sohn, und weil er so ein schönes Kind ist, versteckt sie ihn drei Monate lang.',
        'Als sie ihn nicht länger verbergen kann, macht sie ein Körbchen aus Schilfrohr und dichtet es mit Erdharz und Pech ab. Sie legt das Kind hinein und stellt das Körbchen ins Schilf am Ufer des Nils. Seine Schwester bleibt in einiger Entfernung stehen, um zu sehen, was mit ihm geschieht.',
        'Da kommt die Tochter des Pharao zum Baden an den Fluss, und ihre Dienerinnen gehen am Ufer entlang. Sie entdeckt das Körbchen im Schilf und lässt es holen. Als sie es öffnet, sieht sie das weinende Kind, und es tut ihr leid. „Das ist eines von den Kindern der Israeliten“, sagt sie.',
        'Jetzt tritt die Schwester heran. „Soll ich eine Frau der Israeliten holen, die das Kind für dich stillt?“, fragt sie. „Ja, geh!“, sagt die Königstochter. Das Mädchen läuft los und holt die Mutter, und die Königstochter sagt zu ihr: „Nimm das Kind und zieh es für mich auf, ich werde dich dafür bezahlen.“',
        'Als der Junge größer geworden ist, bringt die Mutter ihn zur Tochter des Pharao, und er wird ihr Sohn. Sie nennt ihn Mose, denn sie sagt: „Ich habe ihn aus dem Wasser gezogen.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Körbchen flechten (flechten, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Woraus macht die Mutter das Körbchen?', options: ['aus Schilfrohr', 'aus Holz', 'aus Stroh'], answer: 0 },
        { q: 'Wer entdeckt das Körbchen im Schilf?', options: ['die Tochter des Pharao', 'Moses Vater', 'ein Fischer'], answer: 0 }
      ]
    },
    {
      id: 3,
      image: `${PLACEHOLDER}etappe-bild-03.webp`,
      title: 'Flucht nach Midian',
      ref: '2. Mose 2,11–25',
      text: [
        'Mose ist am Hof des Pharao groß geworden. Eines Tages geht er zu seinem Volk hinaus und sieht, wie schwer die Israeliten arbeiten müssen. Da erlebt er, wie ein Ägypter einen Israeliten schlägt, und Mose schlägt den Ägypter, sodass der Mann stirbt. Bald spricht es sich herum, und als der Pharao davon hört, will er Mose bestrafen.',
        'Da flieht Mose weit weg in das Land Midian und setzt sich dort an einen Brunnen.',
        'Der Priester von Midian, Jitro, hat sieben Töchter, die zum Brunnen kommen, um die Schafe ihres Vaters zu tränken. Doch Hirten kommen und jagen sie fort. Da steht Mose auf, hilft den Mädchen und tränkt ihre Schafe. „Wo ist der Mann?“, fragt Jitro, als sie davon erzählen. „Holt ihn zum Essen!“ Mose bleibt bei Jitro, heiratet seine Tochter Zippora, und als sie einen Sohn bekommen, nennt er ihn Gerschom, denn er sagt: „Ich bin ein Fremder in einem fremden Land.“',
        'Viele Jahre vergehen. In Ägypten stirbt der König, aber für die Israeliten wird die Arbeit nicht leichter, und sie seufzen und schreien zu Gott. Gott hört sie. Er denkt an das Versprechen, das er Abraham, Isaak und Jakob gegeben hat, und er sieht, wie es seinem Volk geht.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'In welches Land flieht Mose?', options: ['nach Midian', 'nach Kanaan', 'nach Babel'], answer: 0 },
        { q: 'Wie nennt Mose seinen Sohn?', options: ['Gerschom', 'Aaron', 'Jitro'], answer: 0 },
        { q: 'Wer hört das Schreien der Israeliten?', options: ['Gott', 'der Pharao', 'Jitro'], answer: 0 }
      ]
    },
    {
      id: 4,
      image: `${PLACEHOLDER}etappe-bild-04.webp`,
      title: 'Der brennende Dornbusch',
      ref: '2. Mose 3,1–15',
      text: [
        'Mose ist inzwischen ein alter Mann geworden und hütet die Schafe seines Schwiegervaters Jitro. Eines Tages treibt er die Herde weit hinter die Wüste, bis an den Berg Gottes, der Horeb heißt. Dort sieht er einen Busch, der in Flammen steht und doch nicht verbrennt.',
        '„Das muss ich mir ansehen“, sagt Mose. „Warum verbrennt der Busch nicht?“ Als er näher kommt, ruft Gott aus dem Busch: „Mose, Mose!“ „Hier bin ich“, antwortet er. „Komm nicht näher“, sagt Gott. „Zieh deine Schuhe aus, denn der Ort, an dem du stehst, ist heiliger Boden. Ich bin der Gott deines Vaters, der Gott Abrahams, Isaaks und Jakobs.“ Da verhüllt Mose sein Gesicht, denn er fürchtet sich, Gott anzusehen.',
        '„Ich habe gesehen, wie schlecht es meinem Volk in Ägypten geht“, sagt Gott, „und ich habe sein Schreien gehört. Ich will es retten und in ein gutes, weites Land führen. Dich schicke ich zum Pharao, damit du mein Volk aus Ägypten herausführst.“',
        '„Wer bin ich, dass ich das tun könnte?“, fragt Mose. „Ich werde mit dir sein“, antwortet Gott. Und als Mose wissen will, wie er Gott dem Volk nennen soll, sagt Gott: „Ich werde sein, der ich sein werde. Sag den Israeliten: Der Gott eurer Väter hat mich zu euch gesandt.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Dem Leuchten nachgehen (leuchten, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie heißt der Berg Gottes, an dem der Busch brennt?', options: ['Horeb', 'Karmel', 'Zion'], answer: 0 },
        { q: 'Was soll Mose ausziehen?', options: ['seine Schuhe', 'seinen Mantel', 'seinen Gürtel'], answer: 0 }
      ]
    },
    {
      id: 5,
      image: `${PLACEHOLDER}etappe-bild-05.webp`,
      title: 'Mose und Aaron',
      ref: '2. Mose 4,1–31',
      text: [
        'Mose hat Angst, dass die Israeliten ihm nicht glauben werden. „Was hast du in der Hand?“, fragt Gott. „Einen Stab“, sagt Mose. „Wirf ihn auf die Erde!“ Als Mose es tut, wird der Stab zu einer Schlange, und Mose weicht zurück. Doch auf Gottes Wort packt er sie am Schwanz, und sie wird wieder zum Stab. „So sollen sie glauben, dass ich dir erschienen bin“, sagt Gott.',
        'Aber Mose wehrt sich noch immer. „Ich kann nicht gut reden“, sagt er. „Bitte schick einen anderen!“ „Wer hat dem Menschen den Mund gemacht?“, antwortet Gott. „Ich will mit deinem Mund sein und dich lehren, was du sagen sollst. Und dein Bruder Aaron kommt dir schon entgegen; er kann gut reden und wird sich freuen, dich zu sehen.“',
        'Mose verabschiedet sich von Jitro, der zu ihm sagt: „Geh hin in Frieden.“ Dann setzt er Frau und Söhne auf einen Esel, nimmt den Stab Gottes in die Hand und zieht nach Ägypten. Am Berg Gottes begegnet er seinem Bruder Aaron, und die beiden fallen sich in die Arme.',
        'Gemeinsam rufen sie die Ältesten Israels zusammen. Aaron erzählt ihnen alles, was Gott zu Mose gesagt hat, und Mose zeigt die Zeichen. Da glauben die Israeliten ihnen, und als sie hören, dass Gott ihr Elend gesehen hat, verneigen sie sich und beten ihn an.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Unterschiede finden (unterschied, neu)
      task: { kind: 'unterschied', hint: 'Finde, was im rechten Bild mehr ist.', diff: UNTERSCHIED },
      questions: [
        { q: 'Wozu wird Moses Stab auf der Erde?', options: ['zur Schlange', 'zum Baum', 'zum Seil'], answer: 0 },
        { q: 'Wer geht Mose entgegen und soll für ihn reden?', options: ['Aaron', 'Jitro', 'Gerschom'], answer: 0 }
      ]
    },
    {
      id: 6,
      image: `${PLACEHOLDER}etappe-bild-06.webp`,
      title: 'Lass mein Volk ziehen',
      ref: '2. Mose 5,1–6,9',
      text: [
        'Nun gehen Mose und Aaron zum Pharao. „So spricht der Gott Israels“, sagen sie. „Lass mein Volk ziehen, damit es mir in der Wüste ein Fest feiert!“ Aber der Pharao antwortet: „Wer ist dieser Gott, auf dessen Stimme ich hören soll? Ich kenne ihn nicht, und Israel lasse ich nicht ziehen.“',
        'Noch am selben Tag macht er den Israeliten die Arbeit noch schwerer. Sie bekommen kein Stroh mehr für ihre Ziegel und müssen es sich selbst auf den Feldern zusammensuchen, und doch sollen sie jeden Tag gleich viele Ziegel liefern. Die Israeliten klagen, und manche geben Mose und Aaron die Schuld, dass nun alles schlimmer geworden ist.',
        'Mose geht zu Gott und fragt: „Warum hast du mich hergeschickt? Seit ich mit dem Pharao geredet habe, geht es dem Volk schlechter, und du hast es noch nicht gerettet.“ Doch Gott antwortet mit einem Versprechen: „Nun sollst du sehen, was ich mit dem Pharao tun werde. Ich will euch aus der schweren Arbeit herausführen und euch retten. Ihr sollt mein Volk sein, und ich will euer Gott sein.“',
        'Mose sagt es den Israeliten weiter, aber sie hören nicht auf ihn, so mutlos sind sie vor lauter Not. Gottes Zusage aber bleibt bestehen.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Lückenvers (lueckenvers, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was bekommen die Israeliten nach dem Besuch beim Pharao nicht mehr für ihre Ziegel?', options: ['Stroh', 'Wasser', 'Brot'], answer: 0 },
        { q: 'Was verspricht Gott seinem Volk?', options: ['Er will es retten und herausführen.', 'Er will es in Ägypten lassen.', 'Er will es vergessen.'], answer: 0 }
      ]
    },
    {
      id: 7,
      image: `${PLACEHOLDER}etappe-bild-07.webp`,
      title: 'Die ersten Plagen',
      ref: '2. Mose 7,14–8,32',
      text: [
        'Immer wieder gehen Mose und Aaron zum Pharao, und immer wieder sagen sie: „Lass das Volk ziehen!“ Doch der Pharao bleibt bei seinem Nein. Da schickt Gott Zeichen über Ägypten, die man Plagen nennt. Zuerst verwandelt sich das Wasser im Nil in Blut, sodass die Ägypter nicht mehr daraus trinken können.',
        'Dann lässt Gott Frösche aus dem Fluss steigen. Sie hüpfen in die Häuser, in die Schlafkammern, auf die Betten, in die Backöfen und in die Backtröge, bis überall im Land Frösche sind. Da ruft der Pharao Mose und Aaron zu sich: „Bittet Gott, dass er die Frösche wegnimmt, dann lasse ich das Volk ziehen.“ „Wann soll es sein?“, fragt Mose. „Morgen“, sagt der Pharao. Und am nächsten Tag sind die Frösche aus den Häusern, den Höfen und von den Feldern weg.',
        'Aber als der Pharao merkt, dass es vorbei ist, bricht er sein Wort. So kommen Stechmücken über das Land und danach Ungeziefer, doch im Land Goschen, wo die Israeliten wohnen, gibt es keines. Gott unterscheidet zwischen den Ägyptern und seinem Volk. Auch dieses Mal verspricht der Pharao, das Volk ziehen zu lassen, wenn die Plage endet, und wieder hält er sich nicht daran.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Wimmelbild: Frösche (wimmelbild, alt)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was kommt aus dem Fluss und füllt die Häuser?', options: ['Frösche', 'Schlangen', 'Krebse'], answer: 0 },
        { q: 'In welchem Land gibt es kein Ungeziefer?', options: ['im Land Goschen', 'im Land Midian', 'im Land Kanaan'], answer: 0 }
      ]
    },
    {
      id: 8,
      image: `${PLACEHOLDER}etappe-bild-08.webp`,
      title: 'Hagel, Heuschrecken und Finsternis',
      ref: '2. Mose 9,1–10,29',
      text: [
        'Nun werden die Plagen immer schwerer. Eine Seuche trifft das Vieh der Ägypter, aber von den Tieren der Israeliten stirbt kein einziges.',
        'Dann kündigt Mose einen Hagel an, wie es ihn in Ägypten noch nie gegeben hat, und rät, Menschen und Tiere in die Häuser zu holen. Wer auf Gottes Wort hört, bringt seine Leute und sein Vieh in Sicherheit. Der Hagel zerschlägt die Felder, aber im Land Goschen hagelt es nicht. „Dieses Mal habe ich Unrecht getan“, sagt der Pharao. „Bittet Gott, dass er aufhört, dann lasse ich euch ziehen.“ Mose breitet die Hände aus, und der Hagel hört auf. Doch der Pharao bleibt trotzdem hart.',
        'Danach kommen Heuschrecken, die alles Grüne auffressen, und als sie fort sind, liegt drei Tage lang dichte Finsternis über Ägypten, sodass niemand den anderen sehen kann. Nur bei den Israeliten ist es hell in ihren Wohnungen.',
        'Jetzt will der Pharao die Israeliten ziehen lassen, aber ohne ihre Tiere. „Nein“, sagt Mose, „unser Vieh geht mit uns, nicht einmal ein Huf bleibt zurück.“ Da antwortet der Pharao: „Geh weg von mir und komm mir nicht mehr unter die Augen!“ „Wie du sagst“, antwortet Mose. „Ich werde nicht mehr kommen.“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wo hagelt es nicht?', options: ['im Land Goschen', 'am Nil', 'in der Wüste'], answer: 0 },
        { q: 'Wie lange liegt Finsternis über Ägypten?', options: ['drei Tage', 'sieben Tage', 'einen Tag'], answer: 0 },
        { q: 'Was sagt Mose über das Vieh der Israeliten?', options: ['Es geht mit uns, kein Huf bleibt zurück.', 'Wir lassen es hier.', 'Wir verkaufen es.'], answer: 0 }
      ]
    },
    {
      id: 9,
      image: `${PLACEHOLDER}etappe-bild-09.webp`,
      title: 'Die Nacht des Passah',
      ref: '2. Mose 11,1–12,32',
      text: [
        'Noch eine letzte Plage kündigt Gott an, die schwerste von allen. Danach wird der Pharao das Volk ziehen lassen. Aber Gott sagt Mose auch, wie sich die Israeliten auf diese Nacht vorbereiten sollen: Jede Familie soll ein einjähriges Lamm ohne Fehler nehmen und es am Abend schlachten. Mit seinem Blut sollen sie die beiden Türpfosten und den Balken über der Tür bestreichen.',
        'Das Fleisch essen sie in dieser Nacht gebraten, dazu ungesäuertes Brot und bittere Kräuter. Und sie sollen dabei bereit zum Aufbruch sein: den Gürtel um die Hüften, die Schuhe an den Füßen und den Stab in der Hand. „Das ist das Passahfest“, sagt Gott, „denn wenn ich das Blut an der Tür sehe, gehe ich an eurem Haus vorüber.“ Mose sagt es den Ältesten, und das Volk verneigt sich und tut alles genau so.',
        'Um Mitternacht geschieht, was Gott angekündigt hat: In Ägypten sterben alle erstgeborenen Söhne, vom Sohn des Pharao bis zum Sohn des Gefangenen im Gefängnis. Ein großes Klagen erhebt sich im ganzen Land, denn in jedem Haus ist jemand gestorben. In den Häusern der Israeliten aber geht Gott vorüber. Noch in der Nacht ruft der Pharao Mose und Aaron: „Macht euch auf und zieht fort, ihr und alle Israeliten, und nehmt auch eure Schafe und Rinder mit!“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was streichen die Israeliten an ihre Türpfosten?', options: ['das Blut des Lammes', 'Lehm und Stroh', 'Öl und Farbe'], answer: 0 },
        { q: 'Wozu sollen die Israeliten beim Essen bereit sein?', options: ['zum Aufbruch', 'zum Schlafen', 'zum Kampf'], answer: 0 },
        { q: 'Wen ruft der Pharao in der Nacht zu sich?', options: ['Mose und Aaron', 'Mirjam und Zippora', 'Schifra und Pua'], answer: 0 }
      ]
    },
    {
      id: 10,
      image: `${PLACEHOLDER}etappe-bild-10-v2.webp`,
      title: 'Der Auszug',
      ref: '2. Mose 12,33–13,22',
      text: [
        'Die Ägypter drängen die Israeliten, so schnell wie möglich das Land zu verlassen, denn sie sagen: „Sonst sterben wir alle.“ Die Israeliten haben keine Zeit mehr, ihr Brot zu säuern. Sie binden den ungesäuerten Teig in ihre Tücher und tragen ihn auf den Schultern. Als sie ihre Nachbarn um Gefäße aus Silber und Gold und um Kleider bitten, geben die Ägypter ihnen alles.',
        'So brechen sie in Ramses auf, ein ganzes Volk mit Kindern, Schafen und Rindern, und viele andere Menschen schließen sich ihnen an. Mose nimmt auch die Gebeine Josefs mit, denn Josef hatte die Israeliten vor langer Zeit schwören lassen: „Gott wird sich um euch kümmern. Dann nehmt meine Gebeine mit von hier.“',
        'Gott führt sie nicht auf dem kürzesten Weg, denn dort könnten sie in Kämpfe geraten und wieder nach Ägypten umkehren wollen. Er schickt sie auf einem Umweg durch die Wüste zum Schilfmeer. Und er selbst zieht vor ihnen her, am Tag in einer Wolkensäule, die ihnen den Weg zeigt, und in der Nacht in einer Feuersäule, die ihnen leuchtet. So können sie Tag und Nacht wandern, und die Säule weicht nie von ihnen.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Packen (packen, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was tragen die Israeliten in Tüchern auf den Schultern?', options: ['ungesäuerten Teig', 'frisches Brot', 'Datteln'], answer: 0 },
        { q: 'Wie zeigt Gott dem Volk den Weg?', options: ['mit einer Wolkensäule am Tag und einer Feuersäule in der Nacht', 'mit einem Stern', 'mit einem Hirten'], answer: 0 }
      ]
    },
    {
      id: 11,
      image: `${PLACEHOLDER}etappe-bild-11.webp`,
      title: 'Das Wunder am Meer',
      ref: '2. Mose 14,1–15,21',
      text: [
        'Gott führt die Israeliten bis ans Schilfmeer, und dort schlagen sie ihr Lager auf. Der Pharao aber bereut, dass er sie hat ziehen lassen. Mit seinen Streitwagen jagt er ihnen nach, und als die Israeliten das Heer hinter sich sehen, bekommen sie große Angst. Vor ihnen liegt das Meer, hinter ihnen kommen die Verfolger. „Fürchtet euch nicht“, sagt Mose. „Bleibt stehen und seht, wie Gott euch heute rettet. Er wird für euch kämpfen.“',
        'In der Nacht stellt sich die Wolkensäule zwischen die Israeliten und die Ägypter. Auf Gottes Wort streckt Mose seine Hand über das Meer aus, und ein starker Wind teilt das Wasser. Mitten im Meer liegt trockener Boden, mit einer Wasserwand rechts und links, und die Israeliten ziehen hindurch, Familie für Familie. Als die Ägypter ihnen nachfolgen, strömt das Wasser zurück und bedeckt Wagen und Reiter. Von dem ganzen Heer folgt dem Volk niemand mehr.',
        'Die Israeliten aber sind gerettet. Sie glauben Gott und seinem Diener Mose und singen ein Danklied. Mirjam, die Schwester von Mose und Aaron, nimmt eine Pauke in die Hand, und alle Frauen folgen ihr mit Pauken und Tanz. „Singt Gott ein Lied“, ruft Mirjam, „denn er hat eine große Tat getan!“'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Mirjams Pauke (takt, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Was tut Mose auf Gottes Wort am Meer?', options: ['Er streckt seine Hand über das Meer aus.', 'Er schlägt auf einen Felsen.', 'Er wirft seinen Mantel ins Wasser.'], answer: 0 },
        { q: 'Wer nimmt nach der Rettung eine Pauke in die Hand?', options: ['Mirjam', 'Zippora', 'Schifra'], answer: 0 }
      ]
    },
    {
      id: 12,
      image: `${PLACEHOLDER}etappe-bild-12.webp`,
      title: 'Brot vom Himmel',
      ref: '2. Mose 15,22–17,7',
      text: [
        'Nach dem Wunder am Meer wandern die Israeliten drei Tage durch die Wüste und finden kein Wasser. In Mara ist das Wasser so bitter, dass sie es nicht trinken können, und das Volk murrt gegen Mose. Mose ruft zu Gott, und Gott zeigt ihm ein Stück Holz; als er es ins Wasser wirft, wird es süß.',
        'Später, in der Wüste Sin, wird das Essen knapp, und wieder murren die Israeliten. „Gott hat gehört, wie ihr murrt“, sagt Mose, „und er will euch satt machen.“ Am Abend fliegen Wachteln ins Lager, und am Morgen liegt rund um die Zelte etwas Feines, Weißes auf dem Boden, wie Reif. „Was ist das?“, fragen die Leute. „Das ist das Brot, das Gott euch gibt“, sagt Mose.',
        'Jeder soll nur so viel sammeln, wie er und seine Leute essen können, ein Maß voll für jeden in seinem Zelt, und es reicht für alle. Nichts darf bis zum nächsten Morgen aufgehoben werden. Nur am sechsten Tag sammeln sie das Doppelte, denn am siebten Tag, dem Ruhetag, liegt nichts auf dem Boden. Das Volk nennt das Brot Manna und isst es vierzig Jahre lang.',
        'Als sie in Refidim wieder kein Wasser haben, schlägt Mose auf Gottes Wort mit seinem Stab auf einen Felsen, und Wasser strömt heraus, sodass das ganze Volk trinken kann.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Manna sammeln (manna, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie nennt das Volk das Brot vom Himmel?', options: ['Manna', 'Honigbrot', 'Wüstenbrot'], answer: 0 },
        { q: 'An welchem Tag sammeln sie das Doppelte?', options: ['am sechsten Tag', 'am ersten Tag', 'am Ruhetag'], answer: 0 }
      ]
    },
    {
      id: 13,
      image: `${PLACEHOLDER}etappe-bild-04.webp`,
      title: 'Gottes Wort am Berg Sinai',
      ref: '2. Mose 19,1–20,21',
      text: [
        'Drei Monate nach dem Auszug erreichen die Israeliten die Wüste Sinai und schlagen ihr Lager gegenüber dem Berg auf. Mose steigt hinauf, und Gott lässt dem Volk sagen: „Ihr habt gesehen, wie ich euch wie auf Adlerflügeln getragen habe. Wenn ihr auf meine Stimme hört, sollt ihr mein besonderes Volk sein.“ Das ganze Volk antwortet: „Alles, was Gott gesagt hat, wollen wir tun.“',
        'Zwei Tage lang bereiten sich die Israeliten vor und waschen ihre Kleider. Am dritten Morgen liegt eine dichte Wolke auf dem Berg, es donnert und blitzt, und ein lauter Posaunenton erschallt. Mose führt das Volk bis an den Fuß des Berges, doch es muss davor stehen bleiben, denn Gott hat eine Grenze um den Berg gesetzt.',
        'Dann spricht Gott die zehn Gebote. „Ich bin dein Gott, der dich aus Ägypten befreit hat“, beginnt er. „Du sollst keine anderen Götter neben mir haben und dir kein Götterbild machen, um es anzubeten. Du sollst meinen Namen nicht missbrauchen. Halte den Ruhetag heilig. Ehre Vater und Mutter. Du sollst nicht töten, die Ehe nicht brechen, nicht stehlen und nicht lügen, wenn du über andere redest. Und du sollst nicht haben wollen, was deinem Nächsten gehört.“',
        'Das Volk sieht Donner und Blitz und den rauchenden Berg und weicht zurück. „Rede du mit uns“, bitten sie Mose, „aber Gott soll nicht mit uns reden, sonst sterben wir.“ „Fürchtet euch nicht“, sagt Mose. „Gott ist gekommen, damit ihr ihn achtet und nichts Böses tut.“ Dann geht er in das Dunkel hinein, wo Gott ist.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Worte ordnen (worte, neu)
      task: { kind: 'worte', hint: 'Lege die Wörter zu Gottes Worten zusammen.', words: WORTE },
      questions: [
        { q: 'Wie viele Gebote gibt Gott am Berg Sinai?', options: ['zehn', 'sieben', 'zwölf'], answer: 0 },
        { q: 'Was antwortet das Volk auf Gottes Angebot?', options: ['Alles, was Gott gesagt hat, wollen wir tun.', 'Wir wollen es uns überlegen.', 'Wir wollen lieber zurück.'], answer: 0 }
      ]
    },
    {
      id: 14,
      image: `${PLACEHOLDER}etappe-bild-09.webp`,
      title: 'Das goldene Kalb',
      ref: '2. Mose 32,1–35',
      text: [
        'Mose ist schon lange oben auf dem Berg bei Gott, und unten im Lager wird das Volk unruhig. „Wir wissen nicht, was mit Mose geschehen ist“, sagen die Leute zu Aaron. „Mach uns einen Gott, der vor uns hergeht!“ Aaron bittet sie um ihre goldenen Ohrringe, schmilzt sie ein und gießt daraus ein Kalb aus Gold. „Das ist dein Gott, Israel, der dich aus Ägypten geführt hat“, rufen die Leute und feiern ein Fest vor dem Standbild.',
        'Gott sieht es und sagt zu Mose: „Geh hinab! Dein Volk hat sich ein Kalb gemacht und betet es an.“ Dabei hat das Volk doch versprochen, alles zu tun, was Gott sagt. Gott ist zornig auf sein Volk. Da bittet Mose für die Israeliten: „Denk an Abraham, Isaak und Jakob, denen du versprochen hast, dass ihre Nachkommen so zahlreich werden wie die Sterne am Himmel!“ Und Gott lenkt ein.',
        'Mose steigt mit den beiden Steintafeln den Berg hinab, die Gott selbst beschrieben hat. Als er das Kalb und den Tanz sieht, wird er so zornig, dass er die Tafeln zu Boden wirft, und sie zerbrechen. Das Volk muss die Folgen seines Tuns tragen, und es ist ein trauriger Tag in Israel.',
        'Am nächsten Morgen sagt Mose zum Volk: „Ihr habt eine große Schuld auf euch geladen. Ich will zu Gott hinaufgehen und bitten, dass er sie euch vergibt.“ Und er steigt noch einmal auf den Berg.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: nur Quiz (bleibt Quiz)
      task: { kind: 'quiz', hint: 'Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Woraus macht Aaron das Kalb?', options: ['aus goldenen Ohrringen', 'aus Holz', 'aus Lehm'], answer: 0 },
        { q: 'Was geschieht mit den Steintafeln?', options: ['Mose wirft sie zu Boden, und sie zerbrechen.', 'Aaron versteckt sie.', 'Das Volk trägt sie ins Lager.'], answer: 0 },
        { q: 'Was will Mose für das Volk tun?', options: ['Gott um Vergebung bitten', 'Gott verlassen', 'das Lager verlassen'], answer: 0 }
      ]
    },
    {
      id: 15,
      image: `${PLACEHOLDER}etappe-bild-12.webp`,
      title: 'Gott geht mit',
      ref: '2. Mose 33,7–34,35 und 40,34–38',
      text: [
        'Doch Gott verlässt sein Volk nicht. Mose schlägt ein Zelt außerhalb des Lagers auf, das Zelt der Begegnung, und wer Gott etwas fragen will, geht dorthin. Immer wenn Mose zum Zelt geht, steht das ganze Volk auf und sieht ihm nach, jeder vor der Tür seines eigenen Zeltes. Wenn Mose hineingeht, kommt die Wolkensäule herab und bleibt am Eingang stehen, und Gott spricht mit Mose, wie ein Mann mit seinem Freund spricht.',
        '„Wenn du nicht mit uns gehst“, sagt Mose, „dann lass uns nicht von hier fortziehen.“ „Ich will tun, worum du mich bittest“, antwortet Gott. „Ich gehe mit euch.“',
        'Dann sagt Gott zu Mose: „Haue dir zwei neue Steintafeln!“ Früh am Morgen steigt Mose noch einmal auf den Berg. Da kommt Gott in der Wolke herab und ruft: „Gott, barmherzig und gnädig und geduldig und von großer Gnade und Treue!“ Mose verneigt sich tief und betet an. Vierzig Tage und Nächte bleibt er bei Gott, und als er herabkommt, glänzt sein Gesicht, weil er mit Gott geredet hat.',
        'Später baut das Volk auf Gottes Wort ein großes Zelt, das Zelt Gottes, mitten im Lager. Da bedeckt die Wolke das Zelt, und Gottes Herrlichkeit erfüllt es. Immer wenn sich die Wolke erhebt, bricht das Volk auf, und solange sie über dem Zelt bleibt, bleibt es stehen. So geht Gott mit seinem Volk, bei Tag und bei Nacht, auf dem ganzen Weg.'
      ],
      // PLATZHALTER bis Spiel/Bild: Quiz-Aufgabe und ein vorhandenes Etappenbild von Josef; vorgesehen: Der Wolke folgen (wolke, neu)
      task: { kind: 'quiz', hint: 'Höre gut zu und beantworte die Fragen.' },
      questions: [
        { q: 'Wie nennt Mose das Zelt vor dem Lager?', options: ['Zelt der Begegnung', 'Zelt des Pharao', 'Zelt der Hirten'], answer: 0 },
        { q: 'Was geschieht mit Moses Gesicht, nachdem er mit Gott geredet hat?', options: ['Es glänzt.', 'Es wird blass.', 'Es wird älter.'], answer: 0 }
      ]
    }
  ],
  exam: [
    { q: 'Wie heißen die beiden Hebammen, die die Jungen am Leben lassen?', options: ['Schifra und Pua', 'Mirjam und Zippora', 'Sara und Rahel'], answer: 0 },
    { q: 'Woraus macht die Mutter das Körbchen für Mose?', options: ['aus Schilfrohr', 'aus Holz', 'aus Stroh'], answer: 0 },
    { q: 'Was sieht Mose am Berg Horeb?', options: ['einen Busch, der brennt und nicht verbrennt', 'einen Baum ohne Blätter', 'einen Fluss aus Gold'], answer: 0 },
    { q: 'Wie lange liegt Finsternis über Ägypten?', options: ['drei Tage', 'sieben Tage', 'einen Tag'], answer: 0 },
    { q: 'Was geschieht mit dem Wasser des Meeres, als Mose seine Hand ausstreckt?', options: ['Es teilt sich, und das Volk geht hindurch.', 'Es wird zu Eis.', 'Es verschwindet für immer.'], answer: 0 },
    { q: 'Wie viele Gebote gibt Gott am Berg Sinai?', options: ['zehn', 'sieben', 'zwölf'], answer: 0 }
  ]
}

// the English texts (title, stories, questions, hints) lie over the German ones; the screens show them when the app is English
localize(mose, moseEn)
