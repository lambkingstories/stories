/**
 * English texts of the adventure "Elia" (8 to 10 years): the same shape as `../elia.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Elijah, Ahab, Obadiah, Jezebel, Elisha, Cherith, Zarephath, Carmel, Horeb, Jezreel); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Elia/ENGLISCH/Elia_English_Texte.md.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
 * Generated from the readable file by D:/Claude/Abenteuer-Elia/tools/texte_in_ts.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const eliaEn: TextOverlay<Journey> = {
  title: 'Elijah',
  subtitle: 'The Fire, the Rain and the Still Small Voice',
  gift: { title: 'Elijah and the Ravens' },
  stages: [
    {
      title: 'No Rain, and the Ravens',
      ref: '1 Kings 17:1–7',
      text: [
        'Elijah is a prophet of God. He steps before King Ahab. “As surely as God lives, whom I serve,” he says, “there will be neither dew nor rain in these years, unless I say so.”',
        'Then God speaks to Elijah: “Go away from here and hide by the brook Cherith. You shall drink from the brook. And I have commanded the ravens to feed you.”',
        'Elijah goes and sits down by the brook. The ravens bring him bread and meat, in the morning and in the evening. He drinks from the brook. But after a while the brook dries up, because there is no rain in the land.'
      ],
      task: {
        hint: 'Tap the ravens that bring bread.',
        ravens: { rounds: [{ hint: 'Morning: tap the ravens that bring bread.' }, { hint: 'Evening: more ravens are coming. Tap only those with food.' }] }
      },
      questions: [
        { q: 'Who brings Elijah bread and meat?', options: ['the ravens', 'the shepherds', 'the angels'] },
        { q: 'Why does the brook dry up?', options: ['There is no rain in the land.', 'A dam is built.', 'Elijah drinks it empty.'] }
      ]
    },
    {
      title: 'The Widow of Zarephath',
      ref: '1 Kings 17:8–16',
      text: [
        'Then God speaks to Elijah again: “Go to Zarephath. There I have commanded a widow to feed you.” At the gate of the town a woman is gathering sticks. Elijah asks her for water and for a bite of bread.',
        'The woman says: “I have no bread. I have only a handful of flour in the jar and a little oil in the jug. With it I will bake a last meal for myself and my son.”',
        '“Do not be afraid,” says Elijah. “First bake a small loaf for me. For this is what God says: The flour in the jar will not run out, and the jug of oil will not run dry, until it rains again.” The woman does what Elijah says. And the flour and the oil do not run out, for many days.'
      ],
      task: {
        hint: 'Fetch oil from the big jar and fill the bowls. It never runs out.',
        water: { texts: { river: 'The big oil jar: fill the small jug', fillFirst: 'Fill the jug at the big oil jar first.', enough: 'This bowl is already full.', once: 'Good! This bowl is deep: one more jug.', done: 'All the bowls are full, and the big jar has not run empty.' }, plants: [{ label: 'First bowl' }, { label: 'Second bowl' }, { label: 'Third bowl' }, { label: 'First deep bowl' }, { label: 'Second deep bowl' }], rounds: [{ hint: 'Round 1: Each bowl needs one jug of oil.' }, { hint: 'Round 2: The deep bowls need two jugs.' }] }
      },
      questions: [
        { q: 'What does the widow still have at home?', options: ['a handful of flour and a little oil', 'many loaves', 'a full wineskin'] },
        { q: 'What does Elijah promise in God’s name?', options: ['The flour and the oil will not run out.', 'It will rain tomorrow.', 'Her son will be king.'] }
      ]
    },
    {
      title: 'The Widow’s Son',
      ref: '1 Kings 17:17–24',
      text: [
        'After a while the widow’s son becomes very sick. It gets so bad that he no longer breathes. His mother cries out in despair: “Man of God, did you come to me so that my son must die?”',
        'Elijah says: “Give me your son.” He takes him from her arms, carries him up to his room and lays him on his bed.',
        'Then he calls to God: “Lord, my God, let the soul of this child come back to him!” Three times he stretches himself over the child and prays to God.',
        'God hears Elijah, and the child comes back to life. Elijah brings him down to his mother. “Look, your son lives!” “Now I know that you are a man of God,” says the woman. “And God’s word in your mouth is true.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Elijah carry the sick boy?', options: ['up to his room', 'into the garden', 'to the town gate'] },
        { q: 'How many times does Elijah stretch himself over the child?', options: ['three times', 'once', 'seven times'] }
      ]
    },
    {
      title: 'Elijah and Obadiah',
      ref: '1 Kings 18:1–16',
      text: [
        'It has not rained for a long time, now in the third year, and there is great hunger in the land. Then God speaks to Elijah: “Go and show yourself to Ahab. I will send rain.” The king calls his steward Obadiah. The two of them are to look for water and grass for the horses, each on a different road.',
        'Obadiah fears God greatly. When Queen Jezebel hunted the prophets of God, he hid a hundred of them, fifty in one cave and fifty in another, and fed them with bread and water.',
        'On the road Elijah suddenly stands before him. Obadiah throws himself to the ground: “Is it really you, my lord Elijah?” “Yes,” says Elijah. “Go to your master and say: Elijah is here.” Obadiah is afraid. But Elijah promises: “As surely as God lives, I will show myself to Ahab today.”'
      ],
      task: {
        hint: 'Bring the prophets into two caves, the same number in each.',
        caves: { rounds: [{ hint: 'Bring the prophets into the two caves, the same number in each.' }, { hint: 'Now there are more. Again the same number in each cave.' }] }
      },
      questions: [
        { q: 'How many prophets does Obadiah hide?', options: ['a hundred', 'twelve', 'four hundred and fifty'] },
        { q: 'What does Obadiah feed the prophets with?', options: ['bread and water', 'fish and wine', 'honey and dates'] }
      ]
    },
    {
      title: 'On Mount Carmel',
      ref: '1 Kings 18:17–29',
      text: [
        'Ahab sees Elijah and cries: “Is it you, who brings trouble on Israel?” “Not I,” says Elijah, “but you, because you have left God’s commandments and follow Baal.” At Elijah’s word, Ahab has all Israel come to Mount Carmel, and with them four hundred and fifty prophets of Baal.',
        'Elijah steps before the people: “How long will you limp between two sides? If the Lord is God, follow him. But if Baal is God, follow him.” The people answer nothing.',
        'Elijah makes a proposal: Two bulls, two altars, and no fire. “The god who answers with fire, he is God.” “That is good,” everyone shouts.',
        'The prophets of Baal call from morning until noon: “Baal, answer us!” But no answer comes. Then Elijah calls to them: “Shout louder! Maybe he is asleep.” But nobody answers.'
      ],
      task: {
        hint: 'Drag the missing words into Elijah’s question.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“How long will you limp between two ', '?”'], words: ['sides', 'roads', 'mountains'] },
            { hint: 'Now two words are missing.', parts: ['“If the Lord is ', ', ', ' him.”'], words: ['God', 'follow', 'Baal', 'leave'] }
          ]
        }
      },
      questions: [
        { q: 'Which mountain does all Israel gather on?', options: ['Mount Carmel', 'Mount Horeb', 'Mount Sinai'] },
        { q: 'How will the people know who is God?', options: ['The god who answers with fire.', 'The god with the biggest altar.', 'The god the king chooses.'] }
      ]
    },
    {
      title: 'The Fire Falls',
      ref: '1 Kings 18:30–39',
      text: [
        'Now Elijah calls the people to him. He builds up the broken altar of God again, out of twelve stones, for the twelve tribes of Israel. He digs a trench around the altar, piles up the wood and lays the bull on it.',
        '“Fill four jars with water and pour it over the offering and the wood!” he says. It is done. “Do it again!” And a third time. The water runs around the altar, and the trench fills up, too.',
        'Then Elijah prays: “Lord, God of Abraham, Isaac and Israel, let it be known today that you are God. Hear me, so that this people knows that you, Lord, are God.”',
        'Then fire falls from heaven. It burns up the offering, the wood, the stones and the earth, and licks up the water in the trench. All the people fall on their faces: “The Lord is God! The Lord is God!”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How many stones does Elijah build the altar from?', options: ['twelve', 'seven', 'three'] },
        { q: 'What does Elijah do before he prays?', options: ['He has water poured over the offering three times.', 'He lights the wood.', 'He sends the people away.'] }
      ]
    },
    {
      title: 'The Rain Comes',
      ref: '1 Kings 18:41–46',
      text: [
        'Elijah says to Ahab: “Go up, eat and drink, for there is a sound of rushing rain.” But Elijah climbs to the top of Carmel, bows down to the ground and puts his face between his knees.',
        'He says to his servant: “Go up and look toward the sea!” The servant looks. “There is nothing,” he says. “Go again!” says Elijah. So the servant goes seven times.',
        'The seventh time he cries: “A small cloud is rising out of the sea, no bigger than a man’s hand!” Then Elijah says: “Tell Ahab: Harness your chariot and go down, so that the rain does not stop you!”',
        'Before long the sky grows black with clouds and wind, and a great rain comes. Ahab drives to Jezreel, and Elijah runs ahead of his chariot.'
      ],
      task: {
        hint: 'Tap the clouds. They bring the rain.',
        rain: { rounds: [{ hint: 'A tiny cloud rises from the sea. Tap it twice.' }, { hint: 'Six clouds drift in. Tap each one before it has passed.' }] }
      },
      questions: [
        { q: 'How many times does Elijah send the servant to the sea?', options: ['seven times', 'three times', 'twelve times'] },
        { q: 'How big is the first cloud?', options: ['no bigger than a man’s hand', 'as big as a mountain', 'as big as a ship'] }
      ]
    },
    {
      title: 'The Still Small Voice',
      ref: '1 Kings 19:1–18',
      text: [
        'Queen Jezebel threatens Elijah. Then he becomes afraid and flees into the desert. There he sits down under a juniper bush, tired and discouraged, and falls asleep. An angel touches him: “Get up and eat!” Beside him lie bread and a jug of water.',
        'Elijah eats and drinks. Strengthened, he walks forty days and forty nights to Mount Horeb and stays there in a cave.',
        'God says: “Go out and stand on the mountain!” First comes a great, strong wind that breaks the rocks. But God is not in the wind. Then comes an earthquake, but God is not in the earthquake. Then comes a fire, but God is not in the fire.',
        'After the fire comes a still, small sound. Elijah hears it, covers his face with his cloak and steps to the mouth of the cave. Then God asks: “What are you doing here, Elijah?”'
      ],
      task: {
        hint: 'Wait. Tap only the quiet sound.',
        whisper: { rounds: [{ hint: 'Wait. Tap only the quiet sound.' }, { hint: 'Wait again. The loud things come in a different order.' }] }
      },
      questions: [
        { q: 'How long does Elijah walk to Mount Horeb?', options: ['forty days and nights', 'three days', 'seven days'] },
        { q: 'What comes before the still small sound?', options: ['wind, earthquake and fire', 'rain, hail and snow', 'thunder, lightning and flood'] }
      ]
    },
    {
      title: 'Elisha and the Chariot of Fire',
      ref: '1 Kings 19:19–21; 2 Kings 2:1–15',
      text: [
        'God sends Elijah to find a successor. Elijah finds Elisha plowing in the field and throws his cloak over him. Elisha leaves his oxen, says goodbye to his parents and follows Elijah to serve him.',
        'Later the two go to the Jordan. Three times Elijah says: “Stay here.” Three times Elisha answers: “As surely as God lives, I will not leave you.” Elijah strikes the water with his cloak. It divides, and both walk through on dry ground.',
        'Suddenly a chariot of fire with horses of fire comes and separates the two. Elijah goes up to heaven in a whirlwind. “My father, my father!” cries Elisha.',
        'Elisha picks up Elijah’s cloak and strikes the water: “Where is now the God of Elijah?” Then the water divides, and Elisha walks through. The prophets cry: “The spirit of Elijah rests on Elisha!”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Elijah throw over Elisha?', options: ['his cloak', 'his staff', 'his sword'] },
        { q: 'What separates Elijah and Elisha at the Jordan?', options: ['a chariot of fire with horses of fire', 'a high wall', 'a wide river'] }
      ]
    }
  ],
  exam: [
    { q: 'Who brings Elijah bread and meat by the brook?', options: ['the ravens', 'the shepherds', 'the angels'] },
    { q: 'What does not run out in the widow’s house?', options: ['flour and oil', 'water and bread', 'wood and fire'] },
    { q: 'How many prophets does Obadiah hide in the caves?', options: ['a hundred', 'twelve', 'seven'] },
    { q: 'How many stones does Elijah build the altar on Carmel from?', options: ['twelve', 'seven', 'three'] },
    { q: 'How many times does the servant go to the sea until he sees the cloud?', options: ['seven times', 'three times', 'twelve times'] },
    { q: 'What comes after the fire at Horeb?', options: ['a still, small sound', 'a great rain', 'an earthquake'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 23.10.2026): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
eliaEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/elia/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
