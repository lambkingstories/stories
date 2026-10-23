/**
 * English texts of the adventure "Jonah" (8 to 10 years): the same shape as `../jona.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version and World English Bible
 * (Jonah, Amittai, Joppa, Tarshish, Nineveh); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Jona/ENGLISCH/Jona_English_Texte.md.
 * English recordings: geschichte-NN-en-v1.mp3 (voice Achernar), set at the end of this file.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const jonaEn: TextOverlay<Journey> = {
  title: 'Jonah',
  subtitle: 'The Storm, the Great Fish and the City',
  gift: { title: 'Jonah and the Great Fish' },
  stages: [
    {
      title: 'The Call and the Escape',
      ref: 'Jonah 1:1–3',
      text: [
        'Jonah, the son of Amittai, hears God speak to him one day.',
        '“Get up and go to Nineveh,” says God. “It is a great city. Tell them that the evil they do has come up before me.”',
        'But Jonah does not want to go to Nineveh. He gets up and runs the other way, away from God. He goes down to Joppa, by the sea. There a ship is about to sail for Tarshish, far across the sea.',
        'Jonah pays the fare and climbs aboard. He wants to sail to Tarshish with the sailors, far away from God.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where is Jonah supposed to go?', options: ['to Nineveh', 'to Tarshish', 'to Joppa'] },
        { q: 'In which city by the sea does Jonah board a ship?', options: ['in Joppa', 'in Nineveh', 'in Tarshish'] }
      ]
    },
    {
      title: 'The Great Storm',
      ref: 'Jonah 1:4–6',
      text: [
        'Out on the sea, God sends a great wind. It storms and crashes, the waves grow high, and the ship is about to break apart.',
        'The sailors are afraid. Each one cries out to his own god for help. They throw the cargo and the gear out of the ship into the sea, to make it lighter.',
        'But Jonah has gone down into the belly of the ship. He lies there, fast asleep.',
        'Then the captain comes to him. “Why are you sleeping?” he cries. “Get up and call on your God! Maybe he will think of us, and we will not go under.”'
      ],
      task: {
        hint: 'Tap the sliding crates and barrels and throw them into the sea to make the ship lighter.',
        overboard: { rounds: [{ hint: 'Tap the sliding crates and barrels and throw them into the sea to make the ship lighter.' }, { hint: 'Now more waves come. Throw the last cargo into the sea as well.' }] }
      },
      questions: [
        { q: 'What do the sailors throw into the sea?', options: ['the cargo', 'the sails', 'the ropes'] },
        { q: 'What does Jonah do on the ship?', options: ['He sleeps.', 'He rows.', 'He prays out loud.'] }
      ]
    },
    {
      title: 'The Lot',
      ref: 'Jonah 1:7–10',
      text: [
        'The sailors are sure: this storm has a reason. “Come, let us cast lots,” they say, “and then we will find out who is to blame.” The lot falls on Jonah.',
        'At once they ask him: “Tell us who you are! What is your work? Where do you come from? What is your country, and what is your people?”',
        '“I am a Hebrew,” Jonah answers. “I worship God, the Lord of heaven, who made the sea and the dry land.”',
        'The men are terrified. Jonah has told them that he is running away from God. “Why did you do this?” they cry.'
      ],
      task: {
        hint: 'Drag the missing words into Jonah’s sentence.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“I am a ', '”, says Jonah.'], words: ['Hebrew', 'sailor', 'captain'] },
            { hint: 'Now two words are missing.', parts: ['I worship God, the Lord of ', ', who made the ', ' and the dry land.'], words: ['heaven', 'sea', 'mountain', 'storm'] }
          ]
        }
      },
      questions: [
        { q: 'Who does the lot fall on?', options: ['Jonah', 'the captain', 'the youngest sailor'] },
        { q: 'What does Jonah say about God?', options: ['He made the sea and the dry land.', 'He lives in a house in Joppa.', 'He only sends wind and waves.'] }
      ]
    },
    {
      title: 'Into the Sea',
      ref: 'Jonah 1:11–16',
      text: [
        '“What shall we do with you, so that the sea becomes calm again?” the men ask. The waves grow wilder and wilder.',
        '“Take me and throw me into the sea,” says Jonah. “Then it will become calm. I know that this storm has come upon you because of me.”',
        'But the men do not want to do that. They row with all their strength back toward the land, but the sea is too strong. Then they cry out to God: “Oh God, do not let us perish because of this man! You, God, do what pleases you.”',
        'Then they lift Jonah up and throw him into the sea. At that very moment the sea grows calm. The men are full of awe before God. They bring him an offering and make promises to him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Jonah say so that the sea will be calm?', options: ['“Throw me into the sea.”', '“Pray to your gods.”', '“Sail on to Tarshish.”'] },
        { q: 'What happens when Jonah is in the sea?', options: ['The sea becomes calm.', 'The storm gets stronger.', 'The ship goes down.'] }
      ]
    },
    {
      title: 'Inside the Fish',
      ref: 'Jonah 1:17 to 2:9',
      text: [
        'But God sends a great fish, and it swallows Jonah. For three days and three nights Jonah is in the belly of the fish.',
        'There he prays to God. “I called to you in my trouble,” he says, “and you answered me. You threw me into the deep, into the middle of the sea, and all your waves went over me. When I lost heart, I remembered you, and my prayer came to you.”',
        'Jonah knows now: God hears him, even here in the depths.',
        '“I will thank you and keep what I promised,” he prays. “For help comes from God.”'
      ],
      task: { hint: 'Color the fish in the sea.' },
      questions: [
        { q: 'How long is Jonah in the belly of the fish?', options: ['three days and three nights', 'one day and one night', 'seven days'] },
        { q: 'What does Jonah do in the belly of the fish?', options: ['He prays to God.', 'He builds a raft.', 'He keeps silent and waits.'] }
      ]
    },
    {
      title: 'Back on Land',
      ref: 'Jonah 2:10; 3:1–3',
      text: [
        'Then God speaks to the fish, and the fish spits Jonah out onto dry land. Jonah stands on solid ground again, rescued from the deep.',
        'For the second time God’s word comes to Jonah: “Get up and go to Nineveh. Tell the people there what I tell you.” God gives him the task once more.',
        'This time Jonah does not run away. He goes, just as God has said. The way is long, but he goes all the way to Nineveh.',
        'Nineveh is a huge city. It takes three days to walk through it.'
      ],
      task: {
        hint: 'Collect the shells on the dry sand before the wave comes.',
        shore: { rounds: [{ hint: 'Collect the shells on the dry sand before the wave comes.' }, { hint: 'The wave runs faster and higher up the beach. Watch out!' }] }
      },
      questions: [
        { q: 'What does the fish do when God speaks to it?', options: ['It spits Jonah onto the land.', 'It swims with Jonah to Nineveh.', 'It dives deep down.'] },
        { q: 'What does God say to Jonah the second time?', options: ['Go to Nineveh.', 'Stay on the beach.', 'Sail to Tarshish.'] }
      ]
    },
    {
      title: 'Nineveh Listens',
      ref: 'Jonah 3:4–10',
      text: [
        'Jonah walks a whole day into the city and calls out: “Forty more days, and Nineveh will be overthrown!”',
        'Then the people of Nineveh believe God. They decide to fast, and everyone, great and small, puts on rough sackcloth.',
        'The king hears about it, too. He rises from his throne, takes off his royal robe, wraps himself in sackcloth and sits down in the ashes. He has it announced: “No person and no animal shall eat or drink. People and animals shall wear sackcloth. Everyone shall cry out to God and turn from their evil ways. Who knows? Perhaps God will be sorry, and we will not perish.”',
        'God sees how they change. Then he is sorry about what he said he would do, and he does not do it.'
      ],
      task: {
        hint: 'Pull small sacks over the children and big ones over the grown-ups and the animals.',
        sacks: { rounds: [{ hint: 'Pull small sacks over the children and big ones over the grown-ups and the animals.' }, { hint: 'The animals need big sacks, too.' }] }
      },
      questions: [
        { q: 'What does Jonah call out in the city?', options: ['Forty more days, and Nineveh will be overthrown.', 'Three more days, and the fish will come.', 'One more year, and the king will come.'] },
        { q: 'What does the king of Nineveh do?', options: ['He sits down in the ashes in sackcloth.', 'He sends Jonah away.', 'He leaves the city.'] }
      ]
    },
    {
      title: 'Jonah’s Anger',
      ref: 'Jonah 4:1–5',
      text: [
        'God has spared Nineveh. But Jonah is not happy about it at all. He becomes angry and prays: “Oh God, did I not say this when I was still at home? That is why I wanted to flee to Tarshish. I knew you are gracious and merciful, slow to anger and full of great kindness.”',
        '“Do you think you are right to be angry?” asks God.',
        'Jonah goes out of the city and sits down on the east side. There he makes himself a hut and sits in its shade. He wants to see what will happen to Nineveh.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Why is Jonah angry?', options: ['God spares Nineveh.', 'The ship has gone down.', 'The fish swallowed him.'] },
        { q: 'Where does Jonah sit down?', options: ['in a hut outside the city', 'in the king’s palace', 'on a ship'] }
      ]
    },
    {
      title: 'The Castor-Oil Plant',
      ref: 'Jonah 4:6–11',
      text: [
        'God makes a castor-oil plant grow over Jonah. Its big leaves give shade for his head, and Jonah is very glad.',
        'But the next morning God sends a worm, which bites the plant, and it withers. Then God sends a hot east wind, and the sun beats on Jonah’s head until he is faint. Again he is angry.',
        '“You pity the plant,” says God, “which you did not work for. In one night it grew, in one night it withered.”',
        '“And should I not pity Nineveh, that great city? More than a hundred and twenty thousand people live there, and many animals.”'
      ],
      task: {
        hint: 'Pull the leafy roof over Jonah so that the sun does not reach him.',
        shade: { rounds: [{ hint: 'Pull the leafy roof over Jonah so that the sun does not reach him.' }, { hint: 'The sun moves faster. Follow it with the roof.' }] }
      },
      questions: [
        { q: 'What does God make grow over Jonah?', options: ['a castor-oil plant', 'a fig tree', 'a palm tree'] },
        { q: 'How does the plant wither?', options: ['A worm bites it.', 'Jonah pulls it out.', 'It rains too much.'] }
      ]
    }
  ],
  exam: [
    { q: 'Where is Jonah supposed to go?', options: ['to Nineveh', 'to Tarshish', 'to Joppa'] },
    { q: 'Who, according to Jonah, made the sea and the dry land?', options: ['God, the Lord of heaven', 'the captain', 'a god of Tarshish'] },
    { q: 'What happens when Jonah is thrown into the sea?', options: ['The sea becomes calm.', 'The storm gets stronger.', 'The ship goes down.'] },
    { q: 'How long is Jonah in the belly of the fish?', options: ['three days and three nights', 'one day and one night', 'seven days'] },
    { q: 'What do the people of Nineveh do when they hear Jonah?', options: ['They believe God and put on sackcloth.', 'They chase Jonah away.', 'They build a wall.'] },
    { q: 'What does God say about Nineveh at the end?', options: ['It should make him sorry: so many people and animals.', 'The city should go under.', 'The city should belong to Jonah.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 24.10.2026): geschichte-NN-en-v1.mp3, one per stage in the order of the stages
jonaEn.stages!.forEach((s, i) => {
  s.audio = `audio/abenteuer/jona/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
