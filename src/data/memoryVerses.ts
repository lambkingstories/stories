/**
 * The memory verse of every adventure (Anton 10.11.2026): it stands on the back of the golden card of the adventure and at the end of the
 * adventure. The German wording is the Luther Bible of 1912 (public domain, taken word for word from the text of bibeltext.com, only the
 * spelling is today's: dass, lasst), the English one the King James Version (public domain). The numbers of the verses are those of the
 * edition (Luther 1912 counts a few verses differently from Luther 2017: Jonah 2:2, Isaiah 9:6). `line` is one sentence of the story
 * that leads to the verse; it says what happened, it does not teach.
 */
export interface MemoryVerse {
  de: { ref: string; text: string }
  en: { ref: string; text: string }
  line: { de: string; en: string }
}

export const MEMORY_VERSES: Record<string, MemoryVerse> = {
  'adam-eva': {
    de: { ref: '1. Mose 1,31', text: `Und Gott sah alles an, was er gemacht hatte; und siehe da, es war sehr gut.` },
    en: { ref: 'Genesis 1:31', text: `And God saw every thing that he had made, and, behold, it was very good.` },
    line: { de: `Am sechsten Tag sah Gott alles an, was er gemacht hatte.`, en: `On the sixth day God looked at everything he had made.` }
  },
  noah: {
    de: { ref: '1. Mose 9,13', text: `Meinen Bogen habe ich gesetzt in die Wolken; der soll das Zeichen sein des Bundes zwischen mir und der Erde.` },
    en: { ref: 'Genesis 9:13', text: `I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.` },
    line: { de: `Nach der Flut stellte Gott einen Bogen in die Wolken.`, en: `After the flood God set a bow in the clouds.` }
  },
  babel: {
    de: { ref: 'Psalm 127,1', text: `Wo der HERR nicht das Haus baut, so arbeiten umsonst, die daran bauen.` },
    en: { ref: 'Psalm 127:1', text: `Except the LORD build the house, they labour in vain that build it.` },
    line: { de: `Die Menschen wollten einen Turm bis zum Himmel bauen. Dann sprachen sie verschiedene Sprachen, und der Turm blieb unfertig.`, en: `The people wanted to build a tower up to heaven. Then they spoke different languages, and the tower was left unfinished.` }
  },
  abraham: {
    de: { ref: '1. Mose 12,2', text: `Und ich will dich zum großen Volk machen und will dich segnen und dir einen großen Namen machen, und sollst ein Segen sein.` },
    en: { ref: 'Genesis 12:2', text: `And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing.` },
    line: { de: `Gott schickte Abraham los und versprach ihm ein Land. Abraham ging.`, en: `God sent Abraham away and promised him a land. Abraham went.` }
  },
  jakob: {
    de: { ref: '1. Mose 28,15', text: `Und siehe, ich bin mit dir und will dich behüten, wo du hin ziehst, und will dich wieder herbringen in dies Land.` },
    en: { ref: 'Genesis 28:15', text: `And, behold, I am with thee, and will keep thee in all places whither thou goest, and will bring thee again into this land.` },
    line: { de: `Jakob schlief auf der Flucht mit einem Stein unter dem Kopf. Im Traum sprach Gott zu ihm.`, en: `On his flight Jacob slept with a stone under his head. In a dream God spoke to him.` }
  },
  josef: {
    de: { ref: '1. Mose 50,20', text: `Ihr gedachtet’s böse mit mir zu machen; aber Gott gedachte es gut zu machen, dass er täte, wie es jetzt am Tage ist, zu erhalten viel Volks.` },
    en: { ref: 'Genesis 50:20', text: `But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.` },
    line: { de: `Josefs Brüder hatten ihn verkauft. Jahre später sagte Josef zu ihnen, was Gott daraus gemacht hatte.`, en: `Joseph’s brothers had sold him. Years later Joseph told them what God had made of it.` }
  },
  mose: {
    de: { ref: '2. Mose 14,14', text: `Der HERR wird für euch streiten, und ihr werdet still sein.` },
    en: { ref: 'Exodus 14:14', text: `The LORD shall fight for you, and ye shall hold your peace.` },
    line: { de: `Am Meer standen die Israeliten vor dem Wasser, und hinter ihnen kamen die Ägypter.`, en: `At the sea the Israelites stood in front of the water, and the Egyptians were coming behind them.` }
  },
  wueste: {
    de: { ref: '5. Mose 31,6', text: `Seid getrost und unverzagt, fürchtet euch nicht und lasst euch nicht vor ihnen grauen; denn der HERR, dein Gott, wird selber mit dir wandeln und wird die Hand nicht abtun noch dich verlassen.` },
    en: { ref: 'Deuteronomy 31:6', text: `Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.` },
    line: { de: `Vierzig Jahre war das Volk unterwegs. Gott ging mit.`, en: `For forty years the people were on the way. God went with them.` }
  },
  josua: {
    de: { ref: 'Josua 1,9', text: `Siehe, ich habe dir geboten, dass du getrost und freudig seist. Lass dir nicht grauen und entsetze dich nicht; denn der HERR, dein Gott, ist mit dir in allem, was du tun wirst.` },
    en: { ref: 'Joshua 1:9', text: `Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.` },
    line: { de: `Josua sollte das Volk ins neue Land führen.`, en: `Joshua was to lead the people into the new land.` }
  },
  gideon: {
    de: { ref: 'Richter 6,12', text: `Der HERR mit dir, du streitbarer Held!` },
    en: { ref: 'Judges 6:12', text: `The LORD is with thee, thou mighty man of valour.` },
    line: { de: `Gideon hielt sich für den Kleinsten. Gott nannte ihn trotzdem einen Helden.`, en: `Gideon thought he was the smallest. God called him a hero all the same.` }
  },
  rut: {
    de: { ref: 'Rut 1,16', text: `Wo du hin gehst, da will ich auch hin gehen; wo du bleibst, da bleibe ich auch. Dein Volk ist mein Volk, und dein Gott ist mein Gott.` },
    en: { ref: 'Ruth 1:16', text: `Whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God.` },
    line: { de: `Rut hätte in ihr Heimatland zurückgehen können. Sie blieb bei Noomi.`, en: `Ruth could have gone back to her own country. She stayed with Naomi.` }
  },
  samuel: {
    de: { ref: '1. Samuel 3,10', text: `Rede, denn dein Knecht hört.` },
    en: { ref: '1 Samuel 3:10', text: `Speak; for thy servant heareth.` },
    line: { de: `Mitten in der Nacht rief Gott den Jungen Samuel, und Samuel hörte zu.`, en: `In the middle of the night God called the boy Samuel, and Samuel listened.` }
  },
  david: {
    de: { ref: '1. Samuel 16,7', text: `Denn es geht nicht, wie ein Mensch sieht: ein Mensch sieht, was vor Augen ist; der HERR aber sieht das Herz an.` },
    en: { ref: '1 Samuel 16:7', text: `For the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.` },
    line: { de: `Gott wählte den jüngsten Sohn Isais, den Hirtenjungen, zum König.`, en: `God chose the youngest son of Jesse, the shepherd boy, to be king.` }
  },
  salomo: {
    de: { ref: '1. Könige 3,9', text: `So wollest du deinem Knecht geben ein gehorsames Herz, dass er dein Volk richten möge und verstehen, was gut und böse ist.` },
    en: { ref: '1 Kings 3:9', text: `Give therefore thy servant an understanding heart to judge thy people, that I may discern between good and bad.` },
    line: { de: `In der Nacht bei Gibeon durfte sich Salomo etwas wünschen. Er wünschte sich ein gehorsames Herz.`, en: `At night at Gibeon Solomon was allowed to wish for something. He wished for an obedient heart.` }
  },
  elia: {
    de: { ref: '1. Könige 19,12', text: `Und nach dem Feuer kam ein stilles, sanftes Sausen.` },
    en: { ref: '1 Kings 19:12', text: `And after the fire a still small voice.` },
    line: { de: `Am Berg kamen ein starker Wind, ein Erdbeben und ein Feuer. Gott war in keinem davon.`, en: `On the mountain came a strong wind, an earthquake and a fire. God was in none of them.` }
  },
  elisa: {
    de: { ref: '2. Könige 5,15', text: `Siehe, ich weiß, dass kein Gott ist in allen Landen, außer in Israel.` },
    en: { ref: '2 Kings 5:15', text: `Behold, now I know that there is no God in all earth, but in Israel.` },
    line: { de: `Naaman tauchte siebenmal in den Jordan und wurde gesund.`, en: `Naaman dipped himself seven times in the Jordan and was healed.` }
  },
  jona: {
    de: { ref: 'Jona 2,2', text: `Ich rief zu dem HERRN in meiner Angst, und er antwortete mir.` },
    en: { ref: 'Jonah 2:2', text: `I cried by reason of mine affliction unto the LORD, and he heard me.` },
    line: { de: `Jona rief aus dem Bauch des Fisches zu Gott.`, en: `Jonah called to God from inside the fish.` }
  },
  daniel: {
    de: { ref: 'Daniel 6,23', text: `Und sie zogen Daniel aus dem Graben, und man spürte keinen Schaden an ihm; denn er hatte seinem Gott vertraut.` },
    en: { ref: 'Daniel 6:23', text: `So Daniel was taken up out of the den, and no manner of hurt was found upon him, because he believed in his God.` },
    line: { de: `Daniel kam in die Löwengrube. Am Morgen war ihm nichts geschehen.`, en: `Daniel was put into the lions’ den. In the morning nothing had happened to him.` }
  },
  ester: {
    de: { ref: 'Ester 4,14', text: `Und wer weiß, ob du nicht um dieser Zeit willen zur königlichen Würde gekommen bist?` },
    en: { ref: 'Esther 4:14', text: `And who knoweth whether thou art come to the kingdom for such a time as this?` },
    line: { de: `Ester ging ungerufen zum König und bat für ihr Volk.`, en: `Esther went to the king without being called and pleaded for her people.` }
  },
  nehemia: {
    de: { ref: 'Nehemia 8,10', text: `Und bekümmert euch nicht; denn die Freude am HERRN ist eure Stärke.` },
    en: { ref: 'Nehemiah 8:10', text: `Neither be ye sorry; for the joy of the LORD is your strength.` },
    line: { de: `Das Volk hörte Gottes Wort und weinte. Dann feierten sie ein Fest.`, en: `The people heard God’s word and wept. Then they held a feast.` }
  },
  propheten: {
    de: { ref: 'Jesaja 9,6', text: `Denn uns ist ein Kind geboren, ein Sohn ist uns gegeben.` },
    en: { ref: 'Isaiah 9:6', text: `For unto us a child is born, unto us a son is given.` },
    line: { de: `Lange bevor Jesus geboren wurde, sagten Propheten ein Kind voraus.`, en: `Long before Jesus was born, prophets foretold a child.` }
  },
  weihnachten: {
    de: { ref: 'Lukas 2,11', text: `Denn euch ist heute der Heiland geboren, welcher ist Christus, der HERR, in der Stadt Davids.` },
    en: { ref: 'Luke 2:11', text: `For unto you is born this day in the city of David a Saviour, which is Christ the Lord.` },
    line: { de: `In Bethlehem sagten Engel den Hirten, was geschehen war.`, en: `In Bethlehem angels told the shepherds what had happened.` }
  },
  taufe: {
    de: { ref: 'Matthäus 3,17', text: `Dies ist mein lieber Sohn, an welchem ich Wohlgefallen habe.` },
    en: { ref: 'Matthew 3:17', text: `This is my beloved Son, in whom I am well pleased.` },
    line: { de: `Als Jesus getauft wurde, sprach eine Stimme vom Himmel.`, en: `When Jesus was baptized, a voice spoke from heaven.` }
  },
  freunde: {
    de: { ref: 'Lukas 5,10', text: `Fürchte dich nicht; denn von nun an wirst du Menschen fangen.` },
    en: { ref: 'Luke 5:10', text: `Fear not; from henceforth thou shalt catch men.` },
    line: { de: `Jesus rief Fischer vom Ufer. Sie ließen alles zurück und gingen mit ihm.`, en: `Jesus called fishermen from the shore. They left everything behind and went with him.` }
  },
  wunder: {
    de: { ref: 'Markus 4,39', text: `Schweig und verstumme! Und der Wind legte sich, und es ward eine große Stille.` },
    en: { ref: 'Mark 4:39', text: `Peace, be still. And the wind ceased, and there was a great calm.` },
    line: { de: `Im Sturm schlief Jesus im Boot. Er sprach, und es wurde still.`, en: `In the storm Jesus was asleep in the boat. He spoke, and it grew calm.` }
  },
  heilung: {
    de: { ref: 'Markus 10,14', text: `Lasset die Kindlein zu mir kommen und wehret ihnen nicht; denn solcher ist das Reich Gottes.` },
    en: { ref: 'Mark 10:14', text: `Suffer the little children to come unto me, and forbid them not: for of such is the kingdom of God.` },
    line: { de: `Kinder wurden zu Jesus gebracht. Die Jünger wollten sie wegschicken, aber Jesus rief sie zu sich.`, en: `Children were brought to Jesus. The disciples wanted to send them away, but Jesus called them to him.` }
  },
  gleichnisse: {
    de: { ref: 'Lukas 15,6', text: `Freuet euch mit mir; denn ich habe mein Schaf gefunden, das verloren war.` },
    en: { ref: 'Luke 15:6', text: `Rejoice with me; for I have found my sheep which was lost.` },
    line: { de: `Jesus erzählte vom Hirten, der ein verlorenes Schaf sucht.`, en: `Jesus told of the shepherd who looks for a lost sheep.` }
  },
  sohn: {
    de: { ref: 'Lukas 15,20', text: `Da er aber noch ferne von dannen war, sah ihn sein Vater, und es jammerte ihn, lief und fiel ihm um seinen Hals und küsste ihn.` },
    en: { ref: 'Luke 15:20', text: `But when he was yet a great way off, his father saw him, and had compassion, and ran, and fell on his neck, and kissed him.` },
    line: { de: `Der jüngere Sohn ging weit weg und kam mit leeren Händen zurück. Der Vater sah ihn schon von Weitem und lief ihm entgegen.`, en: `The younger son went far away and came back with empty hands. His father saw him from far off and ran to meet him.` }
  },
  zachaeus: {
    de: { ref: 'Lukas 19,10', text: `Denn des Menschen Sohn ist gekommen, zu suchen und selig zu machen, das verloren ist.` },
    en: { ref: 'Luke 19:10', text: `For the Son of man is come to seek and to save that which was lost.` },
    line: { de: `Zachäus saß auf dem Baum. Jesus sah ihn und ging mit ihm nach Hause.`, en: `Zacchaeus sat in the tree. Jesus saw him and went home with him.` }
  },
  letztewoche: {
    de: { ref: 'Matthäus 22,37–39', text: `Du sollst lieben Gott, deinen HERRN, von ganzem Herzen, von ganzer Seele und von ganzem Gemüte. Du sollst deinen Nächsten lieben wie dich selbst.` },
    en: { ref: 'Matthew 22:37, 39', text: `Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. Thou shalt love thy neighbour as thyself.` },
    line: { de: `Jesus ritt auf einem Esel in Jerusalem ein, und die Leute jubelten ihm zu. Später sagte er, welches Gebot das wichtigste ist.`, en: `Jesus rode into Jerusalem on a donkey, and the people cheered him. Later he said which commandment is the most important.` }
  },
  ostern: {
    de: { ref: 'Lukas 24,34', text: `Der HERR ist wahrhaftig auferstanden.` },
    en: { ref: 'Luke 24:34', text: `The Lord is risen indeed.` },
    line: { de: `Maria Magdalena kam früh zum Grab. Der Stein war weggerollt, das Grab war leer.`, en: `Mary Magdalene came to the tomb early. The stone was rolled away, the tomb was empty.` }
  },
  pfingsten: {
    de: { ref: 'Apostelgeschichte 1,8', text: `Ihr werdet die Kraft des Heiligen Geistes empfangen, welcher auf euch kommen wird, und werdet meine Zeugen sein zu Jerusalem und in ganz Judäa und Samarien und bis an das Ende der Erde.` },
    en: { ref: 'Acts 1:8', text: `But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.` },
    line: { de: `Die Freunde von Jesus warteten in Jerusalem. Dann kam der Heilige Geist.`, en: `The friends of Jesus waited in Jerusalem. Then the Holy Spirit came.` }
  },
  paulus: {
    de: { ref: 'Apostelgeschichte 16,31', text: `Glaube an den HERRN Jesus Christus, so wirst du und dein Haus selig!` },
    en: { ref: 'Acts 16:31', text: `Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house.` },
    line: { de: `Im Gefängnis von Philippi sangen Paulus und Silas. Der Wärter fragte, was er tun soll.`, en: `In the prison at Philippi Paul and Silas sang. The jailer asked what he should do.` }
  },
  paulusrom: {
    de: { ref: 'Apostelgeschichte 27,25', text: `Darum, liebe Männer, seid unverzagt; denn ich glaube Gott, es wird also geschehen, wie mir gesagt ist.` },
    en: { ref: 'Acts 27:25', text: `Wherefore, sirs, be of good cheer: for I believe God, that it shall be even as it was told me.` },
    line: { de: `Paulus fuhr im Sturm und strandete. Er kam trotzdem in Rom an.`, en: `Paul sailed through a storm and was shipwrecked. He still reached Rome.` }
  },
  offenbarung: {
    de: { ref: 'Offenbarung 21,5', text: `Siehe, ich mache alles neu!` },
    en: { ref: 'Revelation 21:5', text: `Behold, I make all things new.` },
    line: { de: `Johannes sah einen neuen Himmel und eine neue Erde.`, en: `John saw a new heaven and a new earth.` }
  }
}

/** The verse of an adventure in the language of the texts, or `null` when there is none yet. */
export function memoryVerseOf(journeyId: string, lang: 'de' | 'en'): { ref: string; text: string; line: string } | null {
  const v = MEMORY_VERSES[journeyId]
  if (!v) return null
  return { ref: v[lang].ref, text: v[lang].text, line: v.line[lang] }
}
