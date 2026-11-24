/**
 * English texts of the adventure "John the Baptist" (7 to 10 years): the same shape as `../johannes.ts`, only the words. Laid over the German data by `localize()`; the right answer is the first option,
 * exactly as in the German data. Names and wording follow the public-domain King James Version (Luke 1 and 3, John 1 and 3, Matthew 11 and 14); the stories are retold in our own words.
 * The source as a readable file: D:/Claude/Abenteuer-Johannes/ENGLISCH. Generated from the readable file by D:/Claude/Abenteuer-Johannes/tools/bauen_johannes.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const johannesEn: TextOverlay<Journey> = {
  title: 'John the Baptist',
  subtitle: 'From the angel in the temple to the prison',
  gift: { title: 'John Calls by the Jordan' },
  stages: [
    {
      title: 'The Angel in the Temple',
      ref: 'Luke 1:5–16',
      text: [
        'Zacharias is a priest. He and his wife Elisabeth are devout and keep all the commandments of the LORD. They have no child, and both have grown old.',
        'One day it is Zacharias’s turn to burn incense in the temple. Outside the people stand and pray. Then an angel of the LORD appears to him. He stands on the right side of the altar of incense. Zacharias is troubled, and fear comes over him.',
        '“Do not be afraid, Zacharias,” says the angel. “Your prayer is heard. Your wife Elisabeth will bear you a son, and you shall call him John.”',
        '“You will have joy and gladness, and many will rejoice at his birth. He will be great in the sight of the LORD. He will drink neither wine nor strong drink. Even from his mother’s womb the Holy Spirit will fill him. And many of Israel he will turn back to God, their LORD.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What work does Zacharias do?', options: ['He is a priest.', 'He is a shepherd.', 'He is a fisherman.'] },
        { q: 'Where do the people stand while Zacharias is in the temple?', options: ['outside', 'on the roof', 'by the river'] },
        { q: 'What will the son not drink?', options: ['wine and strong drink', 'milk and honey', 'water and juice'] }
      ]
    },
    {
      title: 'Zacharias Must Be Silent',
      ref: 'Luke 1:18–25',
      text: [
        'Zacharias asks the angel: “How shall I know this? I am an old man, and my wife is well along in years.”',
        '“I am Gabriel, who stands in the presence of God,” answers the angel. “I am sent to tell you this. You will be silent and not able to speak until the day it happens. You did not believe my words. They will be fulfilled in their time.”',
        'Outside the people wait and wonder why Zacharias stays so long in the temple. When he comes out, he cannot speak to them. He makes signs to them. They see that he has seen something in the temple.',
        'When his time of service is over, he goes home. After that, Elisabeth is expecting a child and hides herself for five months. “This is what the LORD has done for me,” she says. “He has looked on me and taken away my shame among people.”'
      ],
      task: {
        hint: 'Zacharias cannot speak. Show the people with your hands what he wants to say.',
        gestures: {
          poses: [{ label: 'Hand over the eyes, looking up' }, { label: 'Hand on the mouth' }, { label: 'Hand on the belly' }, { label: 'Head resting on folded hands' }],
          rounds: [{ hint: 'Show the people: You saw something in the temple.' }, { hint: 'Show the people: You cannot speak.' }]
        }
      },
      questions: [
        { q: 'What is the name of the angel?', options: ['Gabriel', 'Michael', 'Raphael'] },
        { q: 'How long does Elisabeth hide herself?', options: ['five months', 'three days', 'a year'] }
      ]
    },
    {
      title: 'What Shall the Child Be Called?',
      ref: 'Luke 1:57–66',
      text: [
        'Elisabeth has a son. The neighbors and relatives hear how kind the LORD has been to her, and they rejoice with her.',
        'On the eighth day they come to the child. They want to call him after his father: Zacharias. But his mother says: “No, he shall be called John.” “None of your relatives is called by that name,” they say, and they make signs to the father: What does he want the child to be called?',
        'Zacharias asks for a writing tablet and writes on it: “His name is John.” Everyone is amazed. At that moment his mouth is opened, and he speaks and praises God.',
        'Fear and wonder come over the neighbors, and in all the hill country of Judaea people talk about it. All who hear it ask themselves: “What will this child become?” For the hand of the LORD is with him.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What do the neighbors first want to call the child?', options: ['Zacharias', 'Gabriel', 'Elijah'] },
        { q: 'What does Zacharias write the name on?', options: ['on a tablet', 'on a cloth', 'in the sand'] },
        { q: 'What does Zacharias do when his mouth is opened?', options: ['He praises God.', 'He goes to the temple.', 'He runs away.'] }
      ]
    },
    {
      title: 'The Song of Zacharias',
      ref: 'Luke 1:67–80',
      text: [
        'Zacharias is filled with the Holy Spirit. He says: “Blessed be the LORD God of Israel! He has visited his people and redeemed them.”',
        'Then he speaks to the child: “And you, child, will be called the prophet of the Highest. You will go before the LORD and prepare his way.”',
        'The child grows and becomes strong in spirit. John lives in the wilderness until the time comes when he is to appear before the people of Israel.'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['And the child grew, and waxed ', ' in spirit.'], words: ['strong', 'tired', 'sad'] },
            { hint: 'Now two words are missing.', parts: ['And the ', ' grew, and waxed strong in ', '.'], words: ['child', 'spirit', 'bird', 'water'] }
          ]
        }
      },
      questions: [
        { q: 'What will the child be called, says his father?', options: ['the prophet of the Highest', 'the king of Israel', 'a priest in the temple'] },
        { q: 'Where does John live until he is to appear before the people?', options: ['in the wilderness', 'in Jerusalem', 'by the sea'] }
      ]
    },
    {
      title: 'A Voice Cries Out',
      ref: 'Luke 3:1–6',
      text: [
        'Many years have passed. John, the son of Zacharias, is in the wilderness. Then the word of God comes to him.',
        'He goes into all the country around the Jordan. He tells the people to turn around and make a new start. Whoever turns around and is baptized steps into the Jordan with him, and God forgives them what they did wrong.',
        'So it is written by the prophet Isaiah: “The voice of one crying in the wilderness: Prepare the way of the LORD, make his paths straight! Every valley shall be filled, every mountain and hill brought low. What is crooked shall be made straight, and what is rough shall be made smooth. And all people shall see the salvation of God.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where is John when the word of God comes to him?', options: ['in the wilderness', 'in the temple', 'in Nazareth'] },
        { q: 'What does the voice in the wilderness cry?', options: ['Prepare the way of the LORD!', 'Build a wall!', 'Light a fire!'] },
        { q: 'What is to happen to every valley?', options: ['It shall be filled.', 'It shall dry up.', 'It shall disappear.'] }
      ]
    },
    {
      title: 'What Shall We Do?',
      ref: 'Luke 3:10–14',
      text: [
        'The people ask John: “What shall we do then?” He answers: “Whoever has two coats shall give one to him who has none. And whoever has food shall do the same.”',
        'Tax collectors come too, who collect money from the people for tolls and taxes. “Master, what shall we do?” they ask. “Take no more than what is appointed for you,” says John.',
        'Soldiers ask him too: “And what shall we do?” John says: “Do violence to no one, and accuse no one falsely, and be content with your wages.”'
      ],
      task: {
        hint: 'Whoever has two gives one away. Pass it on until everyone has one.',
        giveAway: {
          persons: [{ label: 'an old man with a headcloth and a staff' }, { label: 'a young woman with a headcloth' }, { label: 'a shepherd in a woollen cloak' }, { label: 'a middle-aged woman with a headcloth' }, { label: 'a boy of about twelve' }],
          rounds: [{ hint: 'Whoever has two coats gives one to his neighbor. Soon everyone has one.' }, { hint: 'Now it is about bread. Whoever has more than one loaf passes one on.' }]
        }
      },
      questions: [
        { q: 'Who else comes to John and asks, besides the people?', options: ['the tax collectors', 'the fishermen', 'the priests'] },
        { q: 'What does John say to the tax collectors?', options: ['Take no more than what is appointed for you.', 'Pay more taxes.', 'Go home.'] }
      ]
    },
    {
      title: 'Who Are You?',
      ref: 'John 1:19–28',
      text: [
        'John baptizes in Bethabara, on the other side of the Jordan. From Jerusalem people send priests and Levites to him. “Who are you?” they ask.',
        'John says openly: “I am not the Christ.” “What then? Are you Elijah?” “I am not.” “Are you the prophet?” “No!”',
        '“Who are you then?” they ask. “We must give an answer to those who sent us. What do you say about yourself?” John answers: “I am the voice of one crying in the wilderness: Make straight the way of the LORD! So the prophet Isaiah said.”',
        '“Why do you baptize then?” they ask. “I baptize with water,” says John. “But in the midst of you stands one whom you do not know. He comes after me. I am not worthy to untie his sandal strap.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where do the priests and Levites come from?', options: ['from Jerusalem', 'from Nazareth', 'from Bethlehem'] },
        { q: 'What does John say about himself?', options: ['I am a voice in the wilderness.', 'I am the prophet.', 'I am Elijah.'] },
        { q: 'Whose sandal strap is John not worthy to untie?', options: ['the one who comes after him', 'the king’s', 'the priests’'] }
      ]
    },
    {
      title: 'Behold, the Lamb of God',
      ref: 'John 1:29–37',
      text: [
        'The next day John sees Jesus coming toward him. “Behold the Lamb of God, who takes away the sin of the world!” he cries.',
        'John tells: “I saw the Spirit coming down from heaven like a dove, and it stayed on him. I did not know him.”',
        '“But he who sent me to baptize with water said to me: The one on whom you see the Spirit coming down and staying, he is the one who baptizes with the Holy Spirit. I have seen it, and I bear witness: This is the Son of God.”',
        'The day after, John is standing there again, and two of his disciples are with him. Jesus walks by. “Behold the Lamb of God!” says John. The two disciples hear it and follow Jesus.'
      ],
      task: {
        hint: 'John points at a man. Tap the man he points at.',
        pointing: {
          rounds: [{ hint: 'The next day: Who comes to John? Tap the man he points at.', men: [{ label: 'a man in a cream-white tunic and a reddish-brown cloak' }, { label: 'a fisherman with a net on his shoulder' }, { label: 'a farmer with a basket' }] }, { hint: 'The day after: Whom does John point at now?', men: [{ label: 'a man in a cream-white tunic and a reddish-brown cloak' }, { label: 'a shepherd with a staff' }, { label: 'a water carrier with a clay jug' }, { label: 'a fisherman with a net on his shoulder' }] }]
        }
      },
      questions: [
        { q: 'What does John call Jesus?', options: ['the Lamb of God', 'the Shepherd of God', 'the angel of God'] },
        { q: 'Who follows Jesus?', options: ['two disciples of John', 'the priests from Jerusalem', 'the tax collectors'] }
      ]
    },
    {
      title: 'He Must Increase',
      ref: 'John 3:22–30',
      text: [
        'After this Jesus comes with his disciples into the land of Judaea and stays there, and people are baptized. John is baptizing too, at Aenon near Salim, because there is much water there. John is not yet in prison.',
        'His disciples come to him. “Rabbi,” they say, “he who was with you on the other side of the Jordan, to whom you bore witness, is baptizing now, and all are going to him.”',
        'John answers: “A man can receive nothing unless it is given him from heaven. You are my witnesses that I said: I am not the Christ, but I am sent before him.”',
        '“He who has the bride is the bridegroom. The friend of the bridegroom stands and hears him and rejoices greatly at the bridegroom’s voice. This joy of mine is now fulfilled. He must increase, but I must decrease.”'
      ],
      task: {
        hint: 'Colour in the springs of Aenon.',
        jobs: [{ hint: 'Colour the sky blue.' }, { hint: 'Paint the water with watercolour.' }, { hint: 'Colour the sun yellow.' }, { hint: 'Colour the clouds with chalk.' }, { hint: 'Colour the garment of John brown.' }, { hint: 'Colour the tree trunk brown.' }, { hint: 'Colour the rock on the right orange.' }, { hint: 'Colour the far hills orange.' }, { hint: 'Colour the palm leaves green.' }]
      },
      questions: [
        { q: 'Why does John baptize at Aenon?', options: ['There is much water there.', 'The temple stands there.', 'His mother lives there.'] },
        { q: 'What does John say about the one to whom all are going?', options: ['He must increase.', 'He must be silent.', 'He must go away.'] }
      ]
    },
    {
      title: 'In Prison',
      ref: 'Matthew 11:2–11; 14:3, 12',
      text: [
        'John is in prison. Herod, the ruler of Galilee, has had him arrested because John told him what was not right. There he hears about the works of the Christ and sends two of his disciples to Jesus: “Are you he who should come, or shall we look for another?”',
        'Jesus answers: “Tell John what you hear and see: The blind see, the lame walk, the lepers are made clean, the deaf hear, the dead are raised, and the poor have good news told to them. And blessed is he who is not offended in me.”',
        'To the people Jesus says about John: “What did you go out into the wilderness to see? A prophet? Yes, I tell you, and more than a prophet. Among all who are born of women there has not risen a greater than John the Baptist.”',
        'Later John died, and his disciples came, buried him and told Jesus.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does John ask Jesus through his disciples?', options: ['Are you he who should come?', 'Where do you live?', 'When will you come to me?'] },
        { q: 'What does Jesus say to the messengers?', options: ['The blind see, and the lame walk.', 'The mountains will be brought low.', 'The temple still stands.'] },
        { q: 'What does Jesus say about John?', options: ['He is more than a prophet.', 'He is a king.', 'He is a shepherd.'] }
      ]
    }
  ],
  exam: [
    { q: 'What is the name of the angel who promises Zacharias a child?', options: ['Gabriel', 'Michael', 'Raphael'] },
    { q: 'What does Zacharias write his son’s name on?', options: ['on a tablet', 'on a cloth', 'in the sand'] },
    { q: 'What does the voice in the wilderness cry?', options: ['Prepare the way of the LORD!', 'Build a wall!', 'Light a fire!'] },
    { q: 'What does John say about himself?', options: ['I am a voice in the wilderness.', 'I am the prophet.', 'I am Elijah.'] },
    { q: 'What does John call Jesus?', options: ['the Lamb of God', 'the Shepherd of God', 'the angel of God'] },
    { q: 'What does Jesus say about John?', options: ['He is more than a prophet.', 'He is a king.', 'He is a shepherd.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-vK.mp3 (K = version); a stage without a number in this list is read with the voice of the device
const ENGLISH_RECORDING_VERSION: Record<number, number> = { 1: 4, 2: 2, 3: 2, 4: 3, 5: 6, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2 }
johannesEn.stages!.forEach((s, i) => {
  const version = ENGLISH_RECORDING_VERSION[i + 1]
  if (version) s.audio = `audio/abenteuer/johannes/geschichte-${String(i + 1).padStart(2, '0')}-en-v${version}.mp3`
})
