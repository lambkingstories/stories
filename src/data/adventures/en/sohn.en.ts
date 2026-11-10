/**
 * English texts of the adventure "The Lost Son" (8 to 10 years): the same shape as `../sohn.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Luke 15); the story is retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Sohn/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Sohn/tools/bauen_sohn.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const sohnEn: TextOverlay<Journey> = {
  title: 'The Lost Son',
  subtitle: 'The parable of the father and his two sons',
  gift: { title: 'Robe, Ring and Shoes' },
  stages: [
    {
      title: 'Give Me My Share',
      ref: 'Luke 15:11–13a',
      text: [
        'A man has two sons and a big farm. One day the younger son goes to his father.',
        '“Father,” says the younger son, “give me now what will one day be mine. My share of everything you have.”',
        'The father divides everything he has between his two sons. The elder son stays with his father.',
        'Not many days later, the younger son gathers everything together. He ties up his bundle and sets out, far away, into a far country.'
      ],
      task: {
        hint: 'Pack the bundle for the long journey.',
        pack: {
          items: [{ label: 'Money pouch' }, { label: 'Head cloth' }, { label: 'Cloak' }, { label: 'Sandals' }, { label: 'Blanket' }, { label: 'Water skin' }],
          rounds: [{ hint: 'Pack the bundle, a tap turns a piece.' }, { hint: 'Now everything comes along, the sandals and the water skin, too.' }]
        }
      },
      questions: [
        { q: 'What does the younger son ask his father for?', options: ['to give him his share', 'to travel with him', 'to build him a house'] },
        { q: 'Where does the younger son go?', options: ['into a far country', 'up a high mountain', 'to the city of Jerusalem'] }
      ]
    },
    {
      title: 'In a Far Country',
      ref: 'Luke 15:13b–14',
      text: [
        'In the far country the younger son spends all his money. He gives himself whatever he wants.',
        'The younger son counts it, once and once again. His purse gets lighter and lighter, until not a single coin is left in it.',
        'Then a mighty famine comes over the whole land. Bread is scarce, and everything costs more.',
        'The younger son has no money left, not even for a piece of bread. Now he begins to go hungry.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does the younger son do with his money?', options: ['He spends all of it.', 'He gives it to the poor.', 'He buries it in the field.'] },
        { q: 'What comes over the whole land?', options: ['a mighty famine', 'a long war', 'a great flood'] },
        { q: 'How is the younger son when the money is gone?', options: ['He begins to go hungry.', 'He becomes king of the land.', 'He buys himself a house.'] }
      ]
    },
    {
      title: 'Feeding the Swine',
      ref: 'Luke 15:15–16',
      text: [
        'The younger son needs work and something to eat. He goes to a citizen of that country and stays with him.',
        'The man sends the younger son into his fields. There he is to feed the swine.',
        'The swine crowd around the trough and eat. The son sits by the fence and watches them.',
        'He is so hungry that he would gladly eat the husks the swine eat. But no one gives him anything.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Who sends the younger son into the field?', options: ['a man of that country', 'his father', 'his brother'] },
        { q: 'What work does he get?', options: ['He feeds swine.', 'He plows the field.', 'He builds a house.'] },
        { q: 'What would the younger son like best to eat?', options: ['what the swine eat', 'the bread of the king', 'the grapes from the vineyard'] }
      ]
    },
    {
      title: 'I Will Arise',
      ref: 'Luke 15:17–20a',
      text: [
        'Then the son begins to think. “My father’s hired servants all have bread enough,” he tells himself. “And here I am dying of hunger!”',
        '“I will arise and go to my father.”',
        'And this is what he will say to his father: “Father, I have done wrong, against God and against you. I am no more worthy to be called your son. Make me one of your hired servants.”',
        'Then the son gets up. He leaves the swine and the field behind and goes home, to his father.'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['I will ', ' and go to my father.'], words: ['arise', 'sleep', 'hide'] },
            { hint: 'Now two words are missing.', parts: ['I will ', ' and go to my ', '.'], words: ['arise', 'father', 'sleep', 'brother'] }
          ]
        }
      },
      questions: [
        { q: 'Who has bread enough at his father’s house?', options: ['the hired servants', 'the swine', 'the man of that country'] },
        { q: 'What does the son want to ask his father?', options: ['Make me one of your hired servants.', 'Give me more money.', 'Send me away again.'] }
      ]
    },
    {
      title: 'His Father Saw Him',
      ref: 'Luke 15:20b–21',
      text: [
        'The son walks and walks, along the long road. His father’s house is still a great way off when his father sees him.',
        'The father’s heart melts with compassion. He runs to meet his son.',
        'He hugs his son and kisses him.',
        '“Father,” says the son, “I have done wrong, against God and against you. I am no more worthy to be called your son.”'
      ],
      task: {
        hint: 'Look out along the road and tap the son as soon as you know him.',
        lookout: {
          walkers: [{ name: 'a merchant', look: 'a merchant with a loaded donkey' }, { name: 'a woman with a jar', look: 'a woman with a jar on her head' }, { name: 'the son', look: 'a man alone, barefoot, in a torn tunic, with a small bundle' }, { name: 'a shepherd', look: 'a shepherd with three sheep' }, { name: 'a farmer', look: 'a farmer with a hoe' }, { name: 'a young man', look: 'a young man in a bright tunic, wearing sandals' }],
          rounds: [{ hint: 'Look out along the road and tap the son as soon as you know him.' }, { hint: 'Now six are coming. Look closely.' }]
        }
      },
      questions: [
        { q: 'Where is the son when his father sees him?', options: ['still a great way off', 'already in the yard', 'at the front door'] },
        { q: 'What does the father do when he sees his son?', options: ['He runs to meet him and kisses him.', 'He locks the gate.', 'He sends a servant.'] }
      ]
    },
    {
      title: 'Robe, Ring and Shoes',
      ref: 'Luke 15:22–25a',
      text: [
        'But the father calls to his servants: “Quick, bring out the best robe and put it on my son!”',
        '“Give him a ring for his hand and shoes for his feet!”',
        '“Bring the fatted calf from the stall and prepare a meal. Let us eat and be merry! For this my son was dead, and is alive again. He was lost, and is found.”',
        'And they begin to be merry. In the house there is music, and the people dance in a ring.'
      ],
      task: {
        hint: 'Join the dancers until everyone holds hands.',
        dance: {
          dancers: [{ name: 'the father' }, { name: 'the younger son' }, { name: 'Guest 1' }, { name: 'Guest 2' }, { name: 'Guest 3' }, { name: 'Guest 4' }, { name: 'Guest 5' }, { name: 'Guest 6' }, { name: 'Guest 7' }, { name: 'Guest 8' }],
          rounds: [{ hint: 'Join the dancers until everyone holds hands.' }, { hint: 'Give every dancer two hands until one big ring is made.' }]
        }
      },
      questions: [
        { q: 'What does the son get?', options: ['a robe, a ring and shoes', 'a hat, a belt and gloves', 'a staff, a sack and a chain'] },
        { q: 'Why do they want to be merry?', options: ['The son was lost and is found.', 'The son has brought a lot of money.', 'The son has built a house.'] }
      ]
    },
    {
      title: 'The Elder Brother',
      ref: 'Luke 15:25–32',
      text: [
        'The elder son is out in the field. As he comes near the house, he hears music and dancing. He calls one of the servants to him.',
        '“What is going on?” asks the elder son.',
        '“Your brother has come,” says the servant. “Your father is giving a great meal, because your brother is back safe and sound.”',
        'Then the elder son is angry. He will not go into the house. His father comes out and begs him to come in.',
        '“All these years I have worked for you,” says the elder son. “I never disobeyed your command. Yet you never gave me even a young goat, so that I could make merry with my friends. And for this son of yours, who has spent all his money, you give a great feast!”',
        '“Son,” says the father, “you are always with me, and everything I have is yours. We must be glad. For this your brother was dead, and is alive again. He was lost, and is found.”'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Where is the elder son when the feast begins?', options: ['in the field', 'in the house', 'in the town'] },
        { q: 'Why does the elder son become angry?', options: ['A feast is given for his brother.', 'His father sends him away.', 'The food is cold.'] },
        { q: 'What does the father say to him?', options: ['You are always with me, and everything I have is yours.', 'You may not join us.', 'Tomorrow you must go back to the field.'] }
      ]
    }
  ],
  exam: [
    { q: 'What does the father give the younger son when he asks?', options: ['his share of everything the father has', 'a horse and a cart', 'a letter to the king'] },
    { q: 'What comes over the far country when the money is gone?', options: ['a mighty famine', 'a long rain', 'a great war'] },
    { q: 'What work does the son get in the far country?', options: ['He feeds swine.', 'He fishes in the lake.', 'He builds a house.'] },
    { q: 'What does the son decide?', options: ['to go back to his father', 'to go even farther away', 'to become a rich merchant'] },
    { q: 'What does the father do when he sees his son from far away?', options: ['He runs to meet him.', 'He locks the gate.', 'He sends a servant.'] },
    { q: 'What does the father say to the elder son?', options: ['You are always with me, and everything I have is yours.', 'You may not join us.', 'Tomorrow you must go back to the field.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7]
sohnEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/sohn/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
