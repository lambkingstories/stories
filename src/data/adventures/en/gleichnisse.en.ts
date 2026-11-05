/**
 * English texts of the adventure "Stories of Jesus" (8 to 10 years): the same shape as `../gleichnisse.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Matthew 13, Luke 10 and 15: Samaritan, Levite, Jericho); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Gleichnisse/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Gleichnisse/tools/bauen_gleichnisse.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const gleichnisseEn: TextOverlay<Journey> = {
  title: 'Stories of Jesus',
  subtitle: 'From the Sower to the Lost Son',
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
      title: 'I Will Arise',
      ref: 'Luke 15:11–18',
      text: [
        '“A man had two sons,” says Jesus. The younger says: “Father, give me my share of the inheritance.” The father divides his property between his sons. Not long after, the younger packs everything and travels to a far country. There he spends all his money.',
        'Then a great famine comes. The son keeps pigs for a man of that country. He is so hungry that he would gladly eat the pigs’ food, but nobody gives him anything.',
        'Then he thinks: “At my father’s house even the workers have bread enough, and I am starving here! I will get up and go to my father. I will say: Father, I have sinned against heaven and before you.”'
      ],
      task: {
        hint: 'Tap in time when the footprint is fully there.',
        homeward: { son: { label: 'The son on the way home' }, print: { label: 'A footprint' }, rounds: [{ hint: 'The son sets out for his father. Tap each time the footprint is quite clear.' }, { hint: 'Now he walks faster. Tap exactly on the footprint that comes: left, right, left …' }] }
      },
      questions: [
        { q: 'Where does the younger son travel to?', options: ['to a far country', 'up a mountain', 'to the city of Jerusalem'] },
        { q: 'What work does he get?', options: ['He keeps pigs.', 'He fishes in the lake.', 'He builds a house.'] }
      ]
    },
    {
      title: 'The Father Runs to Meet Him',
      ref: 'Luke 15:20–24',
      text: [
        'Jesus goes on. The son sets out for home. While he is still far away, his father sees him. He has compassion. He runs to meet his son, falls on his neck and kisses him.',
        '“Father,” says the son, “I have sinned against heaven and before you. I am no longer worthy to be called your son.”',
        'But the father calls to his servants: “Bring the best robe and put it on him! Put a ring on his hand and shoes on his feet! Let us eat and be merry. My son was dead and is alive again, he was lost and is found.”'
      ],
      task: {
        hint: 'Tap the feet in turn so that the father runs to his son.',
        meet: {
          father: { label: 'The father in the gate of the estate' },
          son: { label: 'The son, tired, in torn clothes' },
          embrace: { label: 'Father and son in an embrace' },
          ragged: { label: 'The son in torn clothes' },
          robed: { label: 'The son in the new robe' },
          dressed: { label: 'The son with robe, ring and shoes' },
          gifts: [{ label: 'The robe' }, { label: 'The ring' }, { label: 'The shoes' }],
          rounds: [
            { hint: 'Tap the feet in turn so that the father runs to his son.' },
            { hint: 'Drag the robe, the ring and the shoes to the son.' }
          ]
        }
      },
      questions: [
        { q: 'Who sees the son first from far away?', options: ['his father', 'his brother', 'a servant'] },
        { q: 'What does the father do when he sees his son?', options: ['He runs to meet him and hugs him.', 'He sends him away.', 'He shuts the door.'] }
      ]
    },
    {
      title: 'The Older Brother',
      ref: 'Luke 15:25–32',
      text: [
        'Jesus goes on. The older son is still in the field. As he comes near the house, he hears music and dancing. He calls a servant and asks what is going on. “Your brother has come home,” says the servant. “Your father has given a feast for him.”',
        'Then the older son becomes angry and will not go into the house. The father comes out and begs him. The son answers: “All these years I have served you, and you never gave me even a young goat, so that I could celebrate with my friends. And for this son of yours, who wasted your money, you give a feast!”',
        '“My son,” says the father, “you are always with me, and everything I have is yours. Let us be glad. Your brother was dead and is alive again, he was lost and is found.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where is the older son when the feast begins?', options: ['in the field', 'in the house', 'in the city'] },
        { q: 'Why does he become angry?', options: ['There is a feast for his brother.', 'The father sends him away.', 'The food is cold.'] },
        { q: 'What does the father say to him?', options: ['You are always with me, and everything I have is yours.', 'Go away!', 'Stay outside.'] }
      ]
    }
  ],
  exam: [
    { q: 'What happens to the seeds that fall by the road?', options: ['The birds eat them.', 'They grow a hundred times over.', 'The rain washes them away.'] },
    { q: 'What becomes of the little mustard seed?', options: ['a big tree', 'a flower', 'a stone'] },
    { q: 'What does the man who finds the treasure in the field do?', options: ['He sells everything and buys the field.', 'He runs away.', 'He gives the treasure away.'] },
    { q: 'Who helps the man who was attacked?', options: ['a Samaritan', 'a priest', 'a Levite'] },
    { q: 'How does the woman look for her lost coin?', options: ['She lights a lamp and sweeps the house.', 'She digs in the garden.', 'She waits until morning.'] },
    { q: 'What does the father do when he sees his son from far away?', options: ['He runs to meet him.', 'He shuts the door.', 'He sends a servant.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
gleichnisseEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/gleichnisse/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
