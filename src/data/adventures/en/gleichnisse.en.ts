/**
 * English texts of the adventure "Stories of Jesus" (8 to 10 years): the same shape as `../gleichnisse.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Matthew 13, 18 and 7, Luke 10, 15 and 14: Samaritan, Levite, Jericho, servants, talents, pence, wise man, rock, sand, supper, highways and hedges); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Gleichnisse/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Gleichnisse/tools/bauen_gleichnisse.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const gleichnisseEn: TextOverlay<Journey> = {
  title: 'Stories of Jesus',
  subtitle: 'From the Sower to the Great Feast',
  gift: { title: 'The Mustard Tree' },
  stages: [
    {
      title: 'The Sower Goes Out',
      ref: 'Matthew 13:1–8',
      text: [
        'So many people crowd around Jesus at the lake that he gets into a boat. He sits down, and everyone listens from the shore.',
        'Jesus tells a story. “A sower went out to sow,” he says. “Some seeds fell by the road. The birds came and ate them up.”',
        '“Others fell on stony ground, where there was hardly any soil. They sprang up quickly, but the sun scorched them, because they had no roots. Others fell among thorns, and the thorns choked them.”',
        '“But others fell on good ground. They brought forth fruit, some a hundred times, some sixty times, and some thirty times as much.”'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Some seeds fell by the road. The ', ' came and ate them up.”'], words: ['birds', 'fish', 'sheep'] },
            { hint: 'Now two words are missing.', parts: ['“But others fell on good ', '. They brought forth ', ', some a hundred times, some sixty times, and some thirty times as much.”'], words: ['ground', 'fruit', 'stones', 'thorns'] }
          ]
        }
      },
      questions: [
        { q: 'Where does Jesus sit when he tells the story?', options: ['in a boat', 'on a mountain', 'in a house'] },
        { q: 'What happens to the seeds that fall by the road?', options: ['The birds eat them.', 'They grow quickly.', 'The wind blows them away.'] }
      ]
    },
    {
      title: 'He Who Has Ears',
      ref: 'Matthew 13:9–11, 18–23',
      text: [
        '“He who has ears to hear, let him hear!” Jesus calls to the crowd. Afterwards the disciples come to him. “Why do you tell them stories?” they ask. “It has been given to you to know the secret of the kingdom of heaven,” answers Jesus. “Now you listen to the story of the sower.”',
        '“The seed is the word of the kingdom. The road, that is the people who hear it and do not understand. Then it is lost again. In the stony ground the word has no roots. When things get hard, they give up quickly.”',
        '“Among the thorns the word is choked by the worries of this world and by riches that deceive. But the good ground is the people who hear the word, understand it and bear fruit.”'
      ],
      task: {
        hint: 'Tap the ears on the good ground.',
        yieldGame: {
          sprites: { y30: { label: 'A small stalk with three ears' }, y60: { label: 'A stalk with six ears' }, y100: { label: 'A big clump with many heavy ears' }, rock: { label: 'A withered stalk on the rock' }, thorn: { label: 'A stalk choked in the thorns' }, path: { label: 'A bird pecks the seeds by the road' } },
          grain: { label: 'Grains' },
          sack: { label: 'The sack for the grain' },
          rounds: [{ hint: 'Tap the ripe ears on the good ground. What grows on the rock, in the thorns and by the road brings no fruit.' }, { hint: 'Now as in the story: first the ears with a hundred grains, then those with sixty, then those with thirty.' }]
        }
      },
      questions: [
        { q: 'What does the seed mean in the story?', options: ['the word of the kingdom', 'the weather', 'money'] },
        { q: 'Who is the good ground?', options: ['People who hear the word, understand it and bear fruit', 'People who give up quickly', 'People who never listen'] }
      ]
    },
    {
      title: 'The Smallest Seed',
      ref: 'Matthew 13:31–33',
      text: [
        'Jesus tells another story. “The kingdom of heaven is like a grain of mustard seed,” he says. “A man takes it and sows it in his field.”',
        '“It is the smallest of all seeds. But when it grows, it is bigger than all the garden plants and becomes a tree.”',
        '“The birds come and live in its branches,” says Jesus.',
        'Then he says: “The kingdom of heaven is also like leaven. A woman mixes it into three measures of flour until the whole dough has risen.”'
      ],
      task: {
        hint: 'Put the four pictures in the order of the story.',
        order: {
          cards: [{ label: 'A man puts a tiny mustard seed into the earth' }, { label: 'A little green sprout grows' }, { label: 'The bush grows big' }, { label: 'A tree with birds in its branches' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning at the mustard seed and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does Jesus say about the mustard seed?', options: ['That it is the smallest of all seeds.', 'That it is bigger than an apple.', 'That it is as big as a fist.'] },
        { q: 'What becomes of the mustard seed?', options: ['a tree', 'a flower', 'a stone'] }
      ]
    },
    {
      title: 'The Treasure in the Field',
      ref: 'Matthew 13:44–46',
      text: [
        'Later, in the house, Jesus goes on telling his disciples. “The kingdom of heaven is like a treasure hidden in a field. A man finds it and covers it up again.”',
        'Full of joy he goes, sells everything he has and buys the field.',
        '“And the kingdom of heaven is like a merchant who looks for beautiful pearls,” says Jesus. “When he finds one very precious pearl, he goes, sells everything he has and buys it.”'
      ],
      task: {
        hint: 'Tap on the field and dig for the treasure.',
        dig: {
          mound: { label: 'A mound of earth' },
          hole: { label: 'A hole in the field' },
          chest: { label: 'A chest with an iron band' },
          chestOpen: { label: 'The open chest with coins' },
          pearls: [{ label: 'The biggest, round, white shimmering pearl' }, { label: 'A smaller pearl' }, { label: 'A grey pearl' }, { label: 'A crooked pearl' }, { label: 'A small, dull pearl' }],
          rounds: [
            { hint: 'Dig for the treasure. The arrow in the hole shows you the way.' },
            { hint: 'Tap the most precious pearl.' }
          ]
        }
      },
      questions: [
        { q: 'Where is the treasure?', options: ['in the field', 'in the house', 'in the lake'] },
        { q: 'What does the man do for joy?', options: ['He sells everything and buys the field.', 'He runs away.', 'He gives the treasure away.'] }
      ]
    },
    {
      title: 'Who Is My Neighbour?',
      ref: 'Luke 10:25–30',
      text: [
        'A scribe stands up to test Jesus. “Master,” he asks, “what must I do to inherit eternal life?”',
        '“What is written in the law?” Jesus asks back. The man answers: “You shall love God with all your heart, and your neighbour as yourself.” “That is right,” says Jesus. “Do this, and you will live.”',
        'But the scribe asks on: “And who is my neighbour?” Then Jesus tells a story: “A man went down from Jerusalem to Jericho. On the way robbers attacked him. They took everything from him and left him lying hurt by the road.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does the scribe ask last?', options: ['Who is my neighbour?', 'Where is Jericho?', 'When is the king coming?'] },
        { q: 'Which way does the man in the story take?', options: ['from Jerusalem to Jericho', 'from Nazareth to Bethlehem', 'from Capernaum to Nain'] },
        { q: 'What do the robbers do?', options: ['They take everything from him.', 'They give him bread.', 'They take him home.'] }
      ]
    },
    {
      title: 'They Pass By',
      ref: 'Luke 10:31–34',
      text: [
        'Jesus goes on. By chance a priest comes down the same road. A priest serves in the temple. He sees the hurt man lying by the road and passes by. Then a Levite comes, also a servant of the temple. He sees the man and goes on as well.',
        'Then a Samaritan comes, who is on a journey. He sees the man by the road, and he has pity on him.',
        'He goes to him and bandages his wounds. He pours oil and wine on them.'
      ],
      task: {
        hint: 'Hold down and the Samaritan rides. Let go and he stops.',
        halt: { rider: { label: 'The Samaritan on his donkey' }, man: { label: 'The man who was robbed' }, donkey: { label: 'The Samaritan’s donkey' }, kneel: { label: 'The Samaritan kneels by the man and helps him' }, rounds: [{ hint: 'Hold down so that the donkey walks. Let go in time so that it stops right beside the man.' }, { hint: 'Now the donkey is quicker and takes longer to stop. Let go earlier.' }] }
      },
      questions: [
        { q: 'Who passes by first?', options: ['a priest', 'a soldier', 'a shepherd'] },
        { q: 'What does the Samaritan do when he sees the man?', options: ['He has pity and goes to him.', 'He hurries on.', 'He calls the robbers.'] }
      ]
    },
    {
      title: 'Take Care of Him',
      ref: 'Luke 10:34–37',
      text: [
        'Jesus goes on. The Samaritan lifts the hurt man onto his animal and brings him to an inn. There he takes care of him.',
        'The next day he travels on. He gives the innkeeper two silver coins. “Take care of him,” he says. “If it costs more, I will pay you when I come back.”',
        'Then Jesus asks the scribe: “Which of the three was a neighbour to the man who fell among the robbers?” “The one who had mercy on him,” answers the man.',
        '“Then go and do the same,” says Jesus.'
      ],
      task: {
        hint: 'Keep the man on the donkey upright until you reach the inn.',
        inn: { donkey: { label: 'The Samaritan’s donkey' }, rider: { label: 'The bandaged man on the donkey' }, leader: { label: 'The Samaritan leads the donkey' }, stones: [{ label: 'A stone' }, { label: 'A flat stone' }], rounds: [{ hint: 'The road is bumpy. If the man leans forward, hold the left side. If he leans back, hold the right side.' }, { hint: 'Now there are more stones on the road, and the man wobbles more easily.' }] }
      },
      questions: [
        { q: 'Where does the Samaritan take the hurt man?', options: ['to an inn', 'to Jerusalem', 'to the priest'] },
        { q: 'What does he give the innkeeper?', options: ['two silver coins', 'his cloak', 'a donkey'] }
      ]
    },
    {
      title: 'The Lost Sheep',
      ref: 'Luke 15:1–7',
      text: [
        'Many tax collectors and sinners come to Jesus to listen to him. The Pharisees and scribes grumble: “This man welcomes sinners and eats with them.”',
        'Then Jesus tells a story: “Which of you has a hundred sheep and loses one? Does he not leave the ninety-nine behind and look for the one until he finds it?”',
        '“When he has found it, he lays it on his shoulders, full of joy. He calls his friends and neighbours: ‘Rejoice with me! I have found my sheep.’ I tell you: In the same way there is joy in heaven over one sinner who repents.”'
      ],
      task: {
        hint: 'Tap so that the shepherd jumps with the sheep.',
        carryHome: { hero: { label: 'The shepherd carries the sheep on his shoulders' }, labels: { rock: 'A heap of rocks', brook: 'A brook', thorn: 'A thornbush' }, home: { label: 'The house with the friends and neighbours' }, rounds: [{ hint: 'The shepherd carries the sheep home. Tap so that he jumps over rocks and brooks.' }, { hint: 'Now he walks faster. Jump earlier over a wide brook.' }] }
      },
      questions: [
        { q: 'How many sheep does the shepherd have?', options: ['a hundred', 'ten', 'twelve'] },
        { q: 'What does he do when one sheep is missing?', options: ['He looks for it until he finds it.', 'He waits at home.', 'He buys a new one.'] }
      ]
    },
    {
      title: 'The Lost Coin',
      ref: 'Luke 15:8–10',
      text: [
        '“Or a woman has ten silver coins,” Jesus goes on. “She loses one of them. Now she has only nine.”',
        '“So she lights a lamp and sweeps the whole house. She searches eagerly until she finds the coin.”',
        '“When she has found the coin, she calls her friends and neighbours: ‘Rejoice with me! I have found the coin that I had lost.’ I tell you: In the same way there is joy before the angels of God over one sinner who repents.”'
      ],
      task: {
        hint: 'Sweep away the dust and find the coin.',
        coin: {
          lamp: { label: 'The little oil lamp' },
          coin: { label: 'A silver coin' },
          woman: { label: 'The woman, kneeling, with an open hand' },
          broom: { label: 'A broom' },
          lid: { label: 'A shiny brass lid' },
          pebble: { label: 'A shiny pebble' },
          rounds: [
            { hint: 'Light the lamp and sweep the dust away. Where is the coin?' },
            { hint: 'A smaller room with more furniture. Some things shine but are no coin.' }
          ]
        }
      },
      questions: [
        { q: 'How many silver coins does the woman have?', options: ['ten', 'five', 'a hundred'] },
        { q: 'How does the woman look for the coin?', options: ['She lights a lamp and sweeps the house.', 'She goes to the market.', 'She waits until morning.'] }
      ]
    },
    {
      title: 'Have Patience with Me',
      ref: 'Matthew 18:21–34',
      text: [
        'Peter asks Jesus, “Lord, how often must I forgive my brother when he does me wrong? Is seven times enough?” “No,” says Jesus, “not seven times, but seventy times seven.” Then Jesus tells a story.',
        '“A king wants to know how much his servants owe him,” says Jesus. “They bring him a servant who owes him ten thousand talents, a huge amount of money. The servant cannot pay it. He throws himself down before the king. ‘Lord, have patience with me!’ he begs. ‘I will pay you everything.’ The king takes pity and forgives him all his debts.”',
        '“Going out, the servant meets a second servant, who owes him only a hundred pence. The first servant grabs him by the collar. ‘Pay what you owe me!’ he shouts. The second servant falls down. ‘Have patience with me!’ he begs. ‘I will pay you everything.’ But the first servant will not wait. He takes him to prison until everything is paid.”',
        '“Other servants see it and are very sad. They go to the king and tell him everything. Then the king sends for the first servant. ‘You wicked servant!’ he says. ‘I forgave you all your debts. Should you not also have had pity on the second servant, as I had pity on you?’”',
        '“The king is very angry. He sends the first servant to prison until everything is paid.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How often should we forgive, says Jesus?', options: ['seventy times seven', 'only seven times', 'only once'] },
        { q: 'What does the king do when the servant begs him?', options: ['He forgives him all his debts.', 'He sends him away.', 'He asks for even more money.'] },
        { q: 'What does the first servant do to the second servant?', options: ['He takes him to prison.', 'He invites him to supper.', 'He gives him a lot of money.'] }
      ]
    },
    {
      title: 'The House on the Rock',
      ref: 'Matthew 7:24–29',
      text: [
        'Jesus sits on a mountain. Many people have been listening to him, and now he tells them about two men. Both build a house.',
        '“The first man is wise,” says Jesus. “He builds his house on a rock, a big, hard stone. Then the rain falls, water comes, and the wind beats on the house. But the house stays standing, because it stands on the rock.”',
        '“The other man is not wise. He builds his house on sand. Again the rain falls, again the water comes, again the wind beats on the house. Then it falls down.”',
        '“Whoever hears these words of mine and does them,” says Jesus, “is like the wise man. And whoever hears them and does not do them is like the other man.” When Jesus stops speaking, all the people are amazed. Jesus does not speak like their teachers, but with power.'
      ],
      task: {
        hint: 'Knock on the ground and set the house where it stands firm.',
        ground: { sprites: { rock: { label: 'A building plot of hard rock' }, sand: { label: 'A building plot of soft sand' }, covered: { label: 'A building plot with sand on top' }, house: { label: 'The little stone house' }, tilted: { label: 'The house, tilted and sunk into the sand' }, mallet: { label: 'The wooden mallet' }, puff: { label: 'A cloud of dust' }, spark: { label: 'Sparks' }, rain: { label: 'Light rain' }, water: { label: 'Shallow clear water' }, wind: { label: 'Wind with leaves' } }, rounds: [{ hint: 'Knock on the ground and set the house where it stands firm.' }, { hint: 'You only have four knocks. Where is the rock?' }] }
      },
      questions: [
        { q: 'Where does Jesus sit when he tells the story?', options: ['on a mountain', 'in a boat', 'in a house'] },
        { q: 'Who is like the wise man, says Jesus?', options: ['whoever hears his words and does them', 'whoever has the most money', 'whoever talks the loudest'] }
      ]
    },
    {
      title: 'There Is Still Room',
      ref: 'Luke 14:15–23',
      text: [
        'Jesus is a guest at a meal. Another guest says, “Happy is the one who may sit at the table with God!” Then Jesus tells a story: “A man gave a great supper and invited many guests.”',
        '“When everything is ready, the host sends his servant to the guests: ‘Come, for all things are now ready!’ But one after another they make excuses.”',
        '“‘I have bought a field and must go and see it,’ says the first. ‘I have bought five pairs of oxen and want to try them out,’ says the second. ‘I have just married a wife, so I cannot come,’ says the third.”',
        '“The servant tells the host everything. Then the host is angry. ‘Go out quickly into the streets and lanes of the city,’ he says. ‘Bring in the poor, the lame and the blind!’ The servant goes and does it.”',
        '“‘Lord, it is done as you commanded,’ says the servant. ‘But there is still room.’ ‘Then go out into the highways and hedges,’ says the host. ‘Urge everyone to come in. My house shall be full!’”'
      ],
      task: {
        hint: 'Invite the guests until the table is full.',
        invite: {
          table: { label: 'The long table with twelve places' },
          sprites: { g1: { wait: { label: 'A woman with a basket waves' }, sit: { label: 'A woman with a basket sits at the table' } }, g2: { wait: { label: 'A man with a walking stick waves' }, sit: { label: 'A man with a walking stick sits at the table' } }, g3: { wait: { label: 'A man with a traveler’s staff waves' }, sit: { label: 'A man with a traveler’s staff sits at the table' } }, g4: { wait: { label: 'A boy in a patched coat waves' }, sit: { label: 'A boy in a patched coat sits at the table' } }, g5: { wait: { label: 'An old woman with a head scarf waves' }, sit: { label: 'An old woman with a head scarf sits at the table' } }, g6: { wait: { label: 'A man with a water jug waves' }, sit: { label: 'A man with a water jug sits at the table' } }, g7: { wait: { label: 'A traveler with a bundle waves' }, sit: { label: 'A traveler with a bundle sits at the table' } }, g8: { wait: { label: 'A shepherd boy with a flute waves' }, sit: { label: 'A shepherd boy with a flute sits at the table' } }, g9: { wait: { label: 'A farm woman with a sheaf waves' }, sit: { label: 'A farm woman with a sheaf sits at the table' } }, g10: { wait: { label: 'A fisherman with a net waves' }, sit: { label: 'A fisherman with a net sits at the table' } }, pair: { wait: { label: 'A mother with her child waves' }, sit: { label: 'A mother with her child sits at the table' } } },
          servant: { label: 'The servant of the host waves' },
          lamp: { off: { label: 'A lamp, unlit' }, on: { label: 'A lamp, lit' } },
          hedge: { label: 'A hedge' },
          fence: { label: 'A fence' },
          rounds: [{ hint: 'Tap the guests who wave at you.' }, { hint: 'Now out on the highways: whoever waves from behind a hedge comes to the table too.' }]
        }
      },
      questions: [
        { q: 'What does the servant call out to the guests?', options: ['“Come, for all things are now ready!”', '“Bring bread with you!”', '“Wait one more day!”'] },
        { q: 'Whom should the servant bring in from the streets and lanes?', options: ['the poor, the lame and the blind', 'the soldiers and the shepherds', 'the neighbours and the friends'] }
      ]
    }
  ],
  exam: [
    { q: 'What happens to the seeds that fall by the road?', options: ['The birds eat them.', 'They grow a hundred times over.', 'The rain washes them away.'] },
    { q: 'What becomes of the little mustard seed?', options: ['a big tree', 'a flower', 'a stone'] },
    { q: 'What does the man who finds the treasure in the field do?', options: ['He sells everything and buys the field.', 'He runs away.', 'He gives the treasure away.'] },
    { q: 'Who helps the man who was attacked?', options: ['a Samaritan', 'a priest', 'a Levite'] },
    { q: 'How does the woman look for her lost coin?', options: ['She lights a lamp and sweeps the house.', 'She digs in the garden.', 'She waits until morning.'] },
    { q: 'What does the host say when there is still room in the house?', options: ['My house shall be full.', 'Shut the door.', 'The feast is over.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3 (-v2 for the rebuilt stages 10 to 12: a new name for the cache of the phone); a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const RECORDING_VERSION: Record<number, string> = { 10: 'v2', 11: 'v2', 12: 'v2' }
gleichnisseEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/gleichnisse/geschichte-${String(i + 1).padStart(2, '0')}-en-${RECORDING_VERSION[i + 1] ?? 'v1'}.mp3`
})
