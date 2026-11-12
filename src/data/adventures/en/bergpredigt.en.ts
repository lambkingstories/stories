/**
 * English texts of the adventure "The Sermon on the Mount" (7 to 10 years): the same shape as `../bergpredigt.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Matthew 4 to 7); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Bergpredigt/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Bergpredigt/tools/bauen_bergpredigt.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const bergpredigtEn: TextOverlay<Journey> = {
  title: 'The Sermon on the Mount',
  subtitle: 'From the Beatitudes to the Golden Rule',
  gift: { title: 'Lilies of the Field' },
  stages: [
    {
      title: 'Up the Mountain',
      ref: 'Matthew 4:25 to 5:2',
      text: [
        'Many people follow Jesus. They come from Galilee and from Jerusalem, from Judea and from the other side of the Jordan. Some have a long way behind them.',
        'When Jesus sees the crowds, he goes up onto a mountain. The path is narrow, and the people climb one behind the other, the children by the hand.',
        'At the top there is a meadow. Jesus sits down in the grass, and his disciples come to him and sit close beside him. All around, the people settle down, old and young, mothers with their children in their laps.',
        'The wind moves through the grass. Then it grows quiet. Jesus opens his mouth and begins to speak.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where does Jesus go when he sees the crowds?', options: ['up onto a mountain', 'into a boat', 'up a tower'] },
        { q: 'Who sits down close beside Jesus in the grass?', options: ['his disciples', 'the soldiers', 'the priests'] },
        { q: 'What does Jesus do when it grows quiet?', options: ['He opens his mouth and begins to speak.', 'He sings a song.', 'He walks back down the mountain.'] }
      ]
    },
    {
      title: 'Blessed Are',
      ref: 'Matthew 5:3–6',
      text: [
        'Jesus looks into the faces. Right at the front sits a man, his empty hands resting in his lap.',
        '“Blessed are the poor in spirit,” says Jesus, “for theirs is the kingdom of heaven.”',
        'A woman in the second row wipes her eyes. “Blessed are they that mourn, for they shall be comforted.”',
        'At the edge a shepherd leans on his staff and listens quietly. “Blessed are the meek, for they shall inherit the earth.”',
        'At the very back a young man sits leaning far forward, as if he did not want to miss a single word. “Blessed are those who hunger and thirst for what is right, for they shall be filled.”'
      ],
      task: {
        hint: 'Give each listener what Jesus promises him.',
        blessed: {
          people: [{ label: 'the man with empty hands' }, { label: 'the woman who wipes her eyes' }, { label: 'the shepherd with his staff' }, { label: 'the young man leaning far forward' }],
          gifts: [{ label: 'the open gate of the kingdom of heaven', caption: 'Kingdom of heaven' }, { label: 'a soft cloth', caption: 'Comfort' }, { label: 'a piece of green land', caption: 'The land' }, { label: 'bread and a jug of water', caption: 'Filled' }, { label: 'a chest of gold', caption: 'Gold chest' }, { label: 'a royal cloak', caption: 'Royal cloak' }],
          sentences: [{ text: 'Blessed are the poor in spirit, for theirs is the kingdom of heaven.' }, { text: 'Blessed are they that mourn, for they shall be comforted.' }, { text: 'Blessed are the meek, for they shall inherit the earth.' }, { text: 'Blessed are those who hunger and thirst for what is right, for they shall be filled.' }],
          rounds: [{ hint: 'Give each listener what Jesus promises him.' }, { hint: 'Who gets which gift? Two gifts are left over.' }]
        }
      },
      questions: [
        { q: 'What does the shepherd lean on?', options: ['on his staff', 'on a tree', 'on a wall'] },
        { q: 'Who wipes her eyes?', options: ['a woman in the second row', 'a child at the front', 'the shepherd at the edge'] }
      ]
    },
    {
      title: 'Rejoice and Be Glad',
      ref: 'Matthew 5:7–12',
      text: [
        'The sun climbs higher, and Jesus goes on speaking. In the crowd no one whispers any more.',
        '“Blessed are the merciful, for they shall obtain mercy.”',
        'A little girl in the front row looks into Jesus’ face the whole time. “Blessed are the pure in heart, for they shall see God.”',
        '“Blessed are the peacemakers, for they shall be called the children of God. Blessed are those who are persecuted because they do what is right, for theirs is the kingdom of heaven.”',
        'Jesus looks at his disciples. “Blessed are you, when people insult you for my sake and say bad things about you that are not true. Rejoice and be glad! Great is your reward in heaven.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What will the peacemakers be called?', options: ['the children of God', 'the messengers of God', 'the servants of God'] },
        { q: 'Who looks into Jesus’ face the whole time?', options: ['a little girl', 'an old shepherd', 'a young fisherman'] },
        { q: 'How should the disciples be when people insult them?', options: ['glad and joyful', 'angry and loud', 'sad and quiet'] }
      ]
    },
    {
      title: 'Salt and Light',
      ref: 'Matthew 5:13–16',
      text: [
        'Jesus looks at his disciples, one after the other. “You are the salt of the earth,” he says. “If the salt loses its taste, how can it be made salty again?”',
        'Then he points across the meadow. On the hill opposite lies a city, white in the midday sun. “You are the light of the world. A city that is set on a hill cannot be hid.”',
        'Jesus speaks more softly. “No one lights a lamp and puts a basket over it. People put it on a lampstand, and it gives light to everyone in the house.”',
        '“So let your light shine before people,” he says. “Then they will see the good you do and praise your Father in heaven.”',
        'Over on the hill a window flashes in the sun.'
      ],
      task: {
        hint: 'Free the lamp and put it where everyone in the house can see its light.',
        lightStand: {
          rooms: [{ hint: 'Lift off the basket and put the lamp on the lampstand.', people: [{ label: 'The mother' }, { label: 'The child' }] }, { hint: 'Put the lamp where everyone in the house can see its light.', people: [{ label: 'The grandfather' }, { label: 'The girl' }, { label: 'The child' }, { label: 'The father' }, { label: 'The mother' }] }]
        }
      },
      questions: [
        { q: 'What lies on the hill opposite?', options: ['a city', 'a tent', 'a forest'] },
        { q: 'Whom should people praise when they see the good?', options: ['their Father in heaven', 'the disciples', 'the king'] }
      ]
    },
    {
      title: 'Our Father',
      ref: 'Matthew 6:6 and 6:8–13',
      text: [
        'It has grown quiet on the meadow. Only the wind can be heard. Jesus speaks about praying.',
        '“When you pray, go into your little room and shut the door. Pray there to your Father, who is in secret. Your Father sees you there, too.”',
        '“Your Father knows what you need before you ask him. So pray like this:”',
        '“Our Father which art in heaven, Hallowed be thy name. Thy kingdom come. Thy will be done in earth, as it is in heaven.”',
        '“Give us this day our daily bread. And forgive us our debts, as we forgive our debtors. And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.”',
        'For a long time no one says a word.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where should someone go who wants to pray?', options: ['into his little room', 'to the marketplace', 'up the highest mountain'] },
        { q: 'What does the Father know before people ask him?', options: ['what they need', 'where they live', 'how far the road is'] },
        { q: 'What do people ask for today in the Lord’s Prayer?', options: ['their daily bread', 'a new house', 'a lot of money'] }
      ]
    },
    {
      title: 'Look at the Birds',
      ref: 'Matthew 6:25–26',
      text: [
        'Midday is over. Birds cross the sky above the meadow, and Jesus watches them go.',
        '“Do not worry about your life,” he says, “what you will eat and drink. And do not worry about your body, what you will wear. Is not life more than food, and the body more than clothes?”',
        '“Look at the birds of the air. They do not sow, they do not reap, and they do not gather into barns. And your Father in heaven feeds them.”',
        'A small bird lands in the grass, right near the children. It pecks once and flies up again. “Are you not much better than they?”'
      ],
      task: { hint: 'Color the birds under the sky.' },
      questions: [
        { q: 'What do the birds not do?', options: ['They do not sow and they do not reap.', 'They do not fly.', 'They do not sing.'] },
        { q: 'Who feeds the birds?', options: ['your Father in heaven', 'the farmer', 'the king'] }
      ]
    },
    {
      title: 'Consider the Lilies',
      ref: 'Matthew 6:28–30 and 6:34',
      text: [
        'Flowers bloom between the grasses, red and yellow and white. Jesus runs his hand over them.',
        '“And why do you worry about clothes? Consider the lilies of the field, how they grow. They do not work, and they do not spin thread.”',
        '“But I say to you: even Solomon in all his glory was not dressed like one of these.”',
        '“The grass in the field is here today, and tomorrow it is thrown into the oven. And God clothes it like this. Will he not much more clothe you?”',
        '“So do not worry about tomorrow. Tomorrow will take care of itself.”',
        'A gust of wind bends the flowers, and a bee hums on from blossom to blossom.'
      ],
      task: {
        hint: 'Look through the wreath of olive twigs and find who sits in the flowers.',
        nearView: {
          guests: [{ label: 'A bee' }, { label: 'A ladybird' }, { label: 'A butterfly' }, { label: 'A cricket' }],
          rounds: [{ hint: 'Move the wreath over the flowers and find who sits in the blossoms.' }, { hint: 'Look closely at every blossom. Four guests are sitting in the meadow.' }]
        }
      },
      questions: [
        { q: 'Who, in all his glory, was not dressed like a lily?', options: ['Solomon', 'the shepherd', 'a disciple'] },
        { q: 'What happens tomorrow to the grass that stands in the field today?', options: ['It is thrown into the oven.', 'It is cut and sold.', 'It is carried up the mountain.'] }
      ]
    },
    {
      title: 'Ask',
      ref: 'Matthew 7:7–11',
      text: [
        'The shadows are growing longer. Jesus looks toward the fathers and mothers.',
        '“Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.”',
        'Close to Jesus sits a father, his little son resting his head on his shoulder. “Which of you gives his son a stone, when the boy asks him for bread?” Jesus asks. “Or a snake, when he asks for a fish?”',
        'The father smiles and shakes his head.',
        '“You are not without faults, and still you give good gifts to your children. How much more will your Father in heaven give good things to those who ask him!”'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['Ask, and it shall be ', ' you.'], words: ['given', 'forbidden', 'promised'] },
            { hint: 'Now two words are missing.', parts: ['Seek, and ye shall ', '; knock, and it shall be ', ' unto you.'], words: ['find', 'opened', 'lose', 'locked'] }
          ]
        }
      },
      questions: [
        { q: 'What does no father give his son when he asks for bread?', options: ['a stone', 'a coin', 'a cup'] },
        { q: 'Who will give good things to those who ask him?', options: ['your Father in heaven', 'the shepherd', 'the neighbor'] }
      ]
    },
    {
      title: 'Whatever You Want',
      ref: 'Matthew 7:12 and 7:28 to 8:1',
      text: [
        'The sun stands low over the land. The shadows of the people fall long across the meadow.',
        '“So whatever you want people to do for you, do the same for them,” says Jesus.',
        'Jesus goes on speaking. Then he has finished his speech. It stays quiet for a long time. The people still sit there, looking at Jesus. They are amazed at his words. For he has spoken like one who has authority, and not like their scribes.',
        'Slowly they get up and go down the mountain, the mothers with their children by the hand. Jesus goes down with them, and many follow him. Over on the hill, the first lights come on in the city.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What should people do to others?', options: ['what they would like others to do for them', 'what the others did first', 'what the king commands'] },
        { q: 'What amazes the people?', options: ['his words', 'a fire in the sky', 'a miracle at the lake'] },
        { q: 'What comes on in the city on the hill?', options: ['the first lights', 'the city gates', 'a big market'] }
      ]
    }
  ],
  exam: [
    { q: 'Where does Jesus go when he sees the crowds?', options: ['up onto a mountain', 'into a boat', 'up a tower *(stage 1)*'] },
    { q: 'What will the peacemakers be called?', options: ['the children of God', 'the messengers of God', 'the servants of God *(stage 3)*'] },
    { q: 'What lies on the hill opposite?', options: ['a city', 'a tent', 'a forest *(stage 4)*'] },
    { q: 'What does the Father know before people ask him?', options: ['what they need', 'where they live', 'how far the road is *(stage 5)*'] },
    { q: 'Who, in all his glory, was not dressed like a lily?', options: ['Solomon', 'the shepherd', 'a disciple *(stage 7)*'] },
    { q: 'What comes on in the city on the hill when evening comes?', options: ['the first lights', 'the city gates', 'a big market *(stage 9)*'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-vK.mp3 (K = version); a stage without a number in this list is read with the voice of the device
const ENGLISH_RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 1, 3: 2, 4: 2, 5: 2, 6: 1, 7: 1, 8: 2, 9: 1 }
bergpredigtEn.stages!.forEach((s, i) => {
  const version = ENGLISH_RECORDING_VERSION[i + 1]
  if (version) s.audio = `audio/abenteuer/bergpredigt/geschichte-${String(i + 1).padStart(2, '0')}-en-v${version}.mp3`
})
