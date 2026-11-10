/**
 * "Wer ist Jesus?" / "Who is Jesus?": a short way in five steps that tells children who Jesus is (Anton 10.11.2026). Meant for reading
 * together with a parent. The Bible words are the Luther Bible of 1912 and the King James Version (both public domain; the German with
 * today's spelling). Nothing here is counted, rewarded or locked: it is a way to walk, not a game.
 */
export interface JesusStep {
  title: string
  text: string
  verse: { text: string; ref: string }
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
  talkParents: string
  talkParentsText: string
  homeCardTitle: string
  homeCardText: string
  steps: JesusStep[]
}

export const JESUS_PATH: Record<'de' | 'en', JesusPathTexts> = {
  de: {
    title: 'Wer ist Jesus?',
    subtitle: 'Ein Weg in fünf Schritten',
    parents: 'Dieser Weg erzählt Kindern, wer Jesus ist. Lest ihn gern zusammen und sprecht darüber.',
    next: 'Weiter',
    back: 'Zurück',
    start: 'Los geht’s',
    stepOf: 'Schritt {n} von {total}',
    toAdventures: 'Zu den Abenteuern mit Jesus',
    talkParents: 'Mit meinen Eltern reden',
    talkParentsText: 'Frag Mama oder Papa, ob ihr zusammen beten wollt.',
    homeCardTitle: 'Wer ist Jesus?',
    homeCardText: 'Ein kurzer Weg in fünf Schritten für dich.',
    steps: [
      {
        title: 'Gott hat dich gemacht',
        text: 'Gott hat die Berge gemacht und das Meer und jedes Tier. Und er hat dich gemacht. Er kennt deinen Namen. Er hat dich gern, so wie du bist.',
        verse: { text: 'Ich danke dir dafür, dass ich wunderbar gemacht bin; wunderbar sind deine Werke, und das erkennt meine Seele wohl.', ref: 'Psalm 139,14' }
      },
      {
        title: 'Was zwischen uns und Gott steht',
        text: 'Jeder von uns hat schon etwas getan, das nicht gut war. Ein gemeines Wort. Eine Lüge. Etwas genommen, das einem anderen gehört. Die Bibel nennt das Sünde. Sie ist wie eine Mauer zwischen uns und Gott. Gott möchte nicht, dass die Mauer stehen bleibt.',
        verse: { text: 'Sie sind allzumal Sünder.', ref: 'Römer 3,23' }
      },
      {
        title: 'Jesus kommt zu uns',
        text: 'Darum hat Gott seinen Sohn geschickt. Er heißt Jesus. Er hat Kranke gesund gemacht und Kinder auf den Arm genommen. Dann ist er am Kreuz gestorben, für alles, was wir falsch gemacht haben. Und danach ist er auferstanden. Er lebt.',
        verse: { text: 'Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.', ref: 'Johannes 3,16' }
      },
      {
        title: 'Du darfst zu ihm kommen',
        text: 'Jesus wartet nicht darauf, dass du alles richtig machst. Er steht an der Tür und klopft an, so wie ein Freund. Du kannst ihm jetzt sagen, was dir leid tut, und ihn bitten, bei dir zu sein. Du kannst mit eigenen Worten sprechen. Wenn du nicht weißt, was du sagen sollst, kannst du so beten:',
        verse: { text: 'Siehe, ich stehe vor der Tür und klopfe an. So jemand meine Stimme hören wird und die Tür auftun, zu dem werde ich eingehen und das Abendmahl mit ihm halten und er mit mir.', ref: 'Offenbarung 3,20' },
        prayer: 'Jesus, ich möchte zu dir gehören. Es tut mir leid, was ich falsch gemacht habe. Danke, dass du für mich gestorben und auferstanden bist. Komm in mein Leben. Amen.',
        prayerNote: 'Wenn du noch nicht so weit bist, ist das in Ordnung. Du kannst jederzeit wiederkommen.'
      },
      {
        title: 'Er bleibt bei dir',
        text: 'Jesus hat versprochen: Ich bin bei euch. Du kannst mit ihm reden, abends im Bett, auf dem Schulweg, überall. Lies in der Bibel, was er erlebt hat; hier in LambKing findest du seine Geschichten. Und erzähl jemandem, dem du vertraust, was du heute gelesen hast, zum Beispiel deinen Eltern.',
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
    talkParents: 'Talk with my parents',
    talkParentsText: 'Ask your mum or dad if you can pray together.',
    homeCardTitle: 'Who is Jesus?',
    homeCardText: 'A short way in five steps, just for you.',
    steps: [
      {
        title: 'God made you',
        text: 'God made the mountains and the sea and every animal. And he made you. He knows your name. He is fond of you, just the way you are.',
        verse: { text: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.', ref: 'Psalm 139:14' }
      },
      {
        title: 'What stands between us and God',
        text: 'Every one of us has done something that was not good. An unkind word. A lie. Taking something that belongs to someone else. The Bible calls this sin. It is like a wall between us and God. God does not want the wall to stay.',
        verse: { text: 'For all have sinned, and come short of the glory of God.', ref: 'Romans 3:23' }
      },
      {
        title: 'Jesus comes to us',
        text: 'That is why God sent his Son. His name is Jesus. He made sick people well and took children into his arms. Then he died on the cross for everything we have done wrong. And afterwards he rose again. He is alive.',
        verse: { text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ref: 'John 3:16' }
      },
      {
        title: 'You may come to him',
        text: 'Jesus does not wait for you to do everything right. He stands at the door and knocks, like a friend. You can tell him now what you are sorry for and ask him to be with you. You can use your own words. If you do not know what to say, you can pray like this:',
        verse: { text: 'Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.', ref: 'Revelation 3:20' },
        prayer: 'Jesus, I want to belong to you. I am sorry for what I have done wrong. Thank you that you died for me and rose again. Come into my life. Amen.',
        prayerNote: 'If you are not ready yet, that is fine. You can come back any time.'
      },
      {
        title: 'He stays with you',
        text: 'Jesus promised: I am with you. You can talk to him in bed at night, on the way to school, anywhere. Read in the Bible what he did; here in LambKing you find his stories. And tell someone you trust what you read today, for example your parents.',
        verse: { text: 'And, lo, I am with you alway, even unto the end of the world.', ref: 'Matthew 28:20' }
      }
    ]
  }
}
