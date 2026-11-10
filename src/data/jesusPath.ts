/**
 * "Wer ist Jesus?" / "Who is Jesus?": a short way in five steps that tells children who Jesus is (Anton 10.11.2026). Meant for reading
 * together with a parent. The Bible words are the Luther Bible of 1912 and the King James Version (both public domain; the German with
 * today's spelling). Nothing here is counted, rewarded or locked: it is a way to walk, not a game.
 */
export interface JesusStep {
  title: string
  text: string
  verse: { text: string; ref: string }
  /** One plain sentence under the verse that explains an old word (the verse itself stays as it is written). */
  verseNote?: string
  /** A prayer the child may use (only in the fourth step). */
  prayer?: string
  /** A quiet sentence under the prayer. */
  prayerNote?: string
}

export interface JesusPathTexts {
  title: string
  subtitle: string
  parents: string
  next: string
  back: string
  start: string
  stepOf: string
  toAdventures: string
  homeCardTitle: string
  homeCardText: string
  steps: JesusStep[]
}

export const JESUS_PATH: Record<'de' | 'en', JesusPathTexts> = {
  de: {
    title: 'Wer ist Jesus?',
    subtitle: 'Ein Weg in fünf Schritten',
    parents: 'Dieser Weg erzählt Kindern, wer Jesus ist. Lest ihn gern gemeinsam und sprecht darüber.',
    next: 'Weiter',
    back: 'Zurück',
    start: 'Los geht’s',
    stepOf: 'Schritt {n} von {total}',
    toAdventures: 'Zu den Abenteuern mit Jesus',
    homeCardTitle: 'Wer ist Jesus?',
    homeCardText: 'Ein kurzer Weg in fünf Schritten für dich.',
    steps: [
      {
        title: 'Gott hat dich gemacht',
        text: 'Gott hat das ganze Weltall gemacht, die Sonne, den Mond und alle Sterne. Er hat die Erde gemacht, die Berge und das Meer und jedes Tier. Und er hat dich gemacht. Er kennt deinen Namen. Er hat dich gern, so wie du bist.',
        verse: { text: 'Ich danke dir dafür, dass ich wunderbar gemacht bin; wunderbar sind deine Werke, und das erkennt meine Seele wohl.', ref: 'Psalm 139,14' }
      },
      {
        title: 'Was zwischen uns und Gott steht',
        text: 'Jeder von uns hat schon etwas getan, das nicht gut war. Ein gemeines Wort. Eine Lüge. Etwas genommen, das einem anderen gehört. Die Bibel nennt das Sünde. Und Sünde trennt uns von Gott, wie eine hohe Mauer. Wir kommen allein nicht darüber. Aber Gott möchte nicht, dass die Mauer stehen bleibt.',
        verse: { text: 'Sie sind allzumal Sünder.', ref: 'Römer 3,23' },
        verseNote: 'Das heißt: Alle Menschen haben schon etwas falsch gemacht, auch die Erwachsenen.'
      },
      {
        title: 'Jesus kommt zu uns',
        text: 'Darum hat Gott seinen Sohn geschickt. Er heißt Jesus. Jesus hat nie etwas Falsches getan, kein einziges Mal. Und er hat alle Menschen lieb, auch die, die Fehler machen. Er hat Kranke gesund gemacht und denen geholfen, die niemand mochte. Dann ist er am Kreuz gestorben. Er hat alles auf sich genommen, was wir falsch gemacht haben, damit die Mauer fällt. Und danach ist er auferstanden. Er lebt.',
        verse: { text: 'Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.', ref: 'Johannes 3,16' }
      },
      {
        title: 'Du kannst jederzeit zu Jesus kommen',
        text: 'Du musst nicht erst alles richtig machen. Jesus steht an der Tür und klopft an, so wie ein Freund. Du kannst jederzeit zu ihm kommen, morgens, abends, überall. Sag ihm, was dir leid tut, und bitte ihn, bei dir zu sein. Du kannst mit eigenen Worten sprechen. Wenn du nicht weißt, was du sagen sollst, kannst du so beten:',
        verse: { text: 'Siehe, ich stehe vor der Tür und klopfe an. So jemand meine Stimme hören wird und die Tür auftun, zu dem werde ich eingehen und das Abendmahl mit ihm halten und er mit mir.', ref: 'Offenbarung 3,20' },
        prayer: 'Jesus, ich möchte zu dir gehören. Es tut mir leid, was ich falsch gemacht habe. Danke, dass du für mich gestorben und auferstanden bist. Komm in mein Leben. Amen.'
      },
      {
        title: 'Er bleibt bei dir',
        text: 'Jesus hat versprochen: Ich bin bei euch. Du kannst mit ihm reden, abends im Bett, auf dem Schulweg, überall. Lies in der Bibel, was Jesus getan und gesagt hat; hier in LambKing findest du seine Geschichten. Und erzähl jemandem, dem du vertraust, was du heute gelesen hast.',
        verse: { text: 'Und siehe, ich bin bei euch alle Tage bis an der Welt Ende.', ref: 'Matthäus 28,20' }
      }
    ]
  },
  en: {
    title: 'Who is Jesus?',
    subtitle: 'A way in five steps',
    parents: 'This way tells children who Jesus is. Read it together and talk about it.',
    next: 'Next',
    back: 'Back',
    start: 'Let’s go',
    stepOf: 'Step {n} of {total}',
    toAdventures: 'To the adventures with Jesus',
    homeCardTitle: 'Who is Jesus?',
    homeCardText: 'A short way in five steps, just for you.',
    steps: [
      {
        title: 'God made you',
        text: 'God made the whole universe, the sun, the moon and all the stars. He made the earth, the mountains and the sea and every animal. And he made you. He knows your name. He is fond of you, just the way you are.',
        verse: { text: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.', ref: 'Psalm 139:14' }
      },
      {
        title: 'What stands between us and God',
        text: 'Every one of us has done something that was not good. An unkind word. A lie. Taking something that belongs to someone else. The Bible calls this sin. And sin separates us from God, like a high wall. We cannot get over it on our own. But God does not want the wall to stay.',
        verse: { text: 'For all have sinned, and come short of the glory of God.', ref: 'Romans 3:23' },
        verseNote: 'That means: every person has done something wrong, grown-ups too.'
      },
      {
        title: 'Jesus comes to us',
        text: 'That is why God sent his Son. His name is Jesus. Jesus never did anything wrong, not even once. And he loves all people, even those who make mistakes. He made sick people well and helped those nobody liked. Then he died on the cross. He took on himself everything we have done wrong, so that the wall falls. And afterwards he rose again. He is alive.',
        verse: { text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ref: 'John 3:16' }
      },
      {
        title: 'You can come to Jesus any time',
        text: 'You do not have to get everything right first. Jesus stands at the door and knocks, like a friend. You can come to him any time, morning, evening, anywhere. Tell him what you are sorry for and ask him to be with you. You can use your own words. If you do not know what to say, you can pray like this:',
        verse: { text: 'Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.', ref: 'Revelation 3:20' },
        prayer: 'Jesus, I want to belong to you. I am sorry for what I have done wrong. Thank you that you died for me and rose again. Come into my life. Amen.'
      },
      {
        title: 'He stays with you',
        text: 'Jesus promised: I am with you. You can talk to him in bed at night, on the way to school, anywhere. Read in the Bible what Jesus did and said; here in LambKing you find his stories. And tell someone you trust what you read today.',
        verse: { text: 'And, lo, I am with you alway, even unto the end of the world.', ref: 'Matthew 28:20' }
      }
    ]
  }
}
