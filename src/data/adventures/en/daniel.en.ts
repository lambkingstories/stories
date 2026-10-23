/**
 * English texts of the adventure "Daniel" (8 to 10 years): the same shape as `../daniel.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version and World English Bible
 * (Daniel, Nebuchadnezzar, Belteshazzar, Shadrach, Meshach, Abednego, Belshazzar, Darius); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Daniel/ENGLISCH/Daniel_English_Texte.md.
 * English recordings: geschichte-NN-en-v1.mp3 (voice Achernar), set at the end of this file.
 * Generated from the readable file by D:/Claude/Abenteuer-Daniel/tools/texte_in_ts.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const danielEn: TextOverlay<Journey> = {
  title: 'Daniel',
  subtitle: 'The Lions, the Fire and the Writing on the Wall',
  gift: { title: 'Daniel and the Lions' },
  stages: [
    {
      title: 'Daniel at the King’s Court',
      ref: 'Daniel 1:1–7',
      text: [
        'King Nebuchadnezzar of Babylon marches against Jerusalem. He takes many vessels from the house of God. In the treasury of his city he sets them up.',
        'Then he gives an order: Young men from the people of Israel are to come to his court. They are to be healthy and wise. They are to learn the writing and the language of the Babylonians. For three years they are fed from the king’s table, and after that they are to serve him.',
        'Among them are Daniel, Hananiah, Mishael and Azariah from the tribe of Judah. The chief of the officials gives them new names. Daniel is now called Belteshazzar, and the other three are called Shadrach, Meshach and Abednego.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is the king of Babylon called?', options: ['Nebuchadnezzar', 'Belshazzar', 'Darius'] },
        { q: 'What new name does Daniel get?', options: ['Belteshazzar', 'Shadrach', 'Abednego'] }
      ]
    },
    {
      title: 'Vegetables and Water',
      ref: 'Daniel 1:8–21',
      text: [
        'Daniel makes up his mind: He will not eat the king’s food or drink his wine. He asks the chief of the officials for permission. God lets him be kind to Daniel, but he is afraid. “If you look worse than the other young men, I will get into great trouble with the king,” he says.',
        'Then Daniel turns to the guard. “Test us for ten days,” he asks. “Give us vegetables to eat and water to drink. Then look at us and compare us with the others.” The guard agrees.',
        'After ten days the four look healthier and stronger than all who eat the king’s food. So they keep getting vegetables. God gives them understanding and wisdom, and the king finds them ten times wiser than all the wise men in his kingdom.'
      ],
      task: { hint: 'Each day tap the vegetables or the water, not the king’s food.' },
      questions: [
        { q: 'What do Daniel and his friends eat and drink?', options: ['vegetables and water', 'bread and wine', 'meat and milk'] },
        { q: 'How long does the test last?', options: ['ten days', 'three days', 'seven days'] }
      ]
    },
    {
      title: 'The King’s Dream',
      ref: 'Daniel 2:1–23',
      text: [
        'King Nebuchadnezzar has a dream that frightens him so much that he wakes up. But in the morning he no longer knows what he dreamed. He calls all the wise men of Babylon: “Tell me my dream and explain it to me!” The wise men answer: “No human being can do that. Only the gods know such things.”',
        'Then the king becomes very angry. The sentence is for all the wise men of Babylon, and for Daniel and his friends too. Daniel asks the king for a little time. Then he goes home and tells Hananiah, Mishael and Azariah. Together they ask God to show them the secret.',
        'In the night God shows Daniel the dream. Then Daniel praises God: “Blessed be the name of God for ever and ever! For wisdom and might are his.”'
      ],
      task: {
        hint: 'Drag the missing words into Daniel’s praise.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Blessed be the name of God for ever and ', '!”'], words: ['ever', 'today', 'yesterday'] },
            { hint: 'Now two words are missing.', parts: ['“For ', ' and ', ' are his.”'], words: ['wisdom', 'might', 'gold', 'silence'] }
          ]
        }
      },
      questions: [
        { q: 'What did the king forget?', options: ['his dream', 'his name', 'his promise'] },
        { q: 'Who shows Daniel the dream?', options: ['God', 'the wise men of Babylon', 'the king'] }
      ]
    },
    {
      title: 'The Great Statue',
      ref: 'Daniel 2:24–49',
      text: [
        'Daniel goes to the king. “No wise man can tell you your secret,” he says. “But there is a God in heaven who reveals secrets.” Then he tells the dream. The king saw a great, shining statue. Its head was of fine gold, its chest and arms of silver, its belly and hips of bronze, its legs of iron, and its feet of iron and clay.',
        'Then a stone broke loose, without any hand touching it. It struck the feet of the statue, and the whole statue fell apart like chaff in the wind. But the stone became a great mountain.',
        'Daniel says: “God will one day set up a kingdom that will never be destroyed.” Then the king says: “Your God is a God above all gods and a Lord above all kings.”'
      ],
      task: {
        hint: 'Drag each metal to its place on the statue.',
        statue: {
          pieces: [{ label: 'Gold' }, { label: 'Silver' }, { label: 'Bronze' }, { label: 'Iron' }, { label: 'Iron and clay' }],
          rounds: [{ hint: 'Put the statue from the dream together: the best at the top, the weakest at the bottom.' }, { hint: 'Once more, now without names. Where does each disc belong?' }]
        }
      },
      questions: [
        { q: 'What is the head of the statue made of?', options: ['fine gold', 'silver', 'clay'] },
        { q: 'What strikes the feet of the statue?', options: ['a stone', 'lightning', 'an arrow'] }
      ]
    },
    {
      title: 'The Golden Image',
      ref: 'Daniel 3:1–18',
      text: [
        'King Nebuchadnezzar has a huge image made of gold, sixty cubits high. He sets it up on the plain of Dura, and all the great men of the land are to come to its dedication.',
        'A herald calls: “As soon as you hear the music of trumpets, harps and many other instruments, you must fall down and worship the golden image! Whoever does not will be thrown into a blazing furnace.”',
        'The music sounds, and everyone falls down. Only Shadrach, Meshach and Abednego stay standing. Some men report them to the king.',
        'The king has the three called before him. “Will you not worship my image?” he asks. They answer: “Our God can save us from the fire. And if he does not, we will still not worship your image.”'
      ],
      task: {
        hint: 'Find the three men who stay standing.',
        find: { labels: ['Shadrach', 'Meshach', 'Abednego'], doneText: 'You have found all three men who stayed standing!' }
      },
      questions: [
        { q: 'What is the plain called where the image stands?', options: ['Dura', 'Babylon', 'Jerusalem'] },
        { q: 'What do the three friends say to the king?', options: ['“We will not worship your image.”', '“We will worship your image.”', '“We are going away.”'] }
      ]
    },
    {
      title: 'In the Furnace',
      ref: 'Daniel 3:19–30',
      text: [
        'Then the king is full of rage. He orders the furnace to be heated seven times hotter than usual. The strongest men of his army tie up Shadrach, Meshach and Abednego and throw them into the blazing furnace.',
        'But suddenly the king is startled and jumps up. “Did we not tie up three men and throw them into the fire?” he asks. “Yes, O king,” his counselors answer. “But I see four men walking about in the fire, free and unharmed,” he cries. “And the fourth looks like a son of the gods!”',
        'The king steps up to the mouth of the furnace: “Shadrach, Meshach, Abednego, servants of God Most High, come out!” Then the three come out of the fire. Their hair is not singed, their coats are whole, and there is no smell of smoke on them. “Blessed be the God of the three,” says the king, “who sent his angel and saved his servants!”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How many men does the king see in the fire?', options: ['four', 'three', 'seven'] },
        { q: 'What has happened to the coats of the three men?', options: ['They are whole.', 'They are burnt.', 'They are wet.'] }
      ]
    },
    {
      title: 'The Writing on the Wall',
      ref: 'Daniel 5',
      text: [
        'Many years later King Belshazzar holds a great feast for a thousand guests. He has the golden vessels brought, which his father took from the house of God in Jerusalem, and drinks from them with his guests.',
        'Suddenly fingers like those of a human hand appear and write something on the wall of the hall. The king turns pale, and his knees shake. None of his wise men can read the writing.',
        'Then the queen comes into the hall. “There is a man who can explain secrets: Daniel,” she says. Daniel is called. “Keep your gifts,” he says, “I will read the writing for you anyway.”',
        '“It says: Mene, mene, tekel, u-parsin,” says Daniel. “That means: God has counted your kingdom. You have been weighed and found too light. Your kingdom will be divided and given to the Medes and Persians.”'
      ],
      task: {
        hint: 'Move the lamp over the wall and find the four glowing signs.',
        lamp: { rounds: [{ hint: 'Move the lamp over the wall and find the glowing signs.' }, { hint: 'Now the flame flickers. Move the lamp very slowly.' }] }
      },
      questions: [
        { q: 'What does the king drink from?', options: ['the golden vessels from God’s house', 'clay jugs', 'wooden cups'] },
        { q: 'Who explains the writing on the wall?', options: ['Daniel', 'the wise men', 'the queen'] }
      ]
    },
    {
      title: 'Daniel Prays',
      ref: 'Daniel 6:1–13',
      text: [
        'Now Darius is king. He sets Daniel over the whole kingdom, because Daniel is faithful and has an excellent spirit. That annoys the other high officials. They look for something to say against Daniel, but they find nothing.',
        'Then they say to the king: “Whoever prays to any god or any man for the next thirty days, except to you, shall be thrown into the pit of lions.” Darius signs the order.',
        'Daniel hears about it. He goes home, to his room with the windows open toward Jerusalem. Three times a day he kneels down, prays and gives thanks to his God, just as he has always done.',
        'The men watch him and find him praying. At once they go to the king and accuse Daniel.'
      ],
      task: {
        hint: 'Tap Daniel when the sun stands at a time of prayer.',
        hours: { rounds: [{ hint: 'Tap Daniel when the sun stands on a golden mark: three times a day.' }, { hint: 'Now two days, and the sun moves faster.' }] }
      },
      questions: [
        { q: 'Where do the open windows in Daniel’s room face?', options: ['toward Jerusalem', 'toward Babylon', 'toward the river'] },
        { q: 'How often a day does Daniel pray?', options: ['three times', 'once', 'seven times'] }
      ]
    },
    {
      title: 'In the Lions’ Den',
      ref: 'Daniel 6:14–28',
      text: [
        'The king becomes sad when he hears this. Until evening he tries to save Daniel. But the law cannot be changed. So he has Daniel brought to the lions in the pit. “May your God, whom you always serve, help you!” he says.',
        'A stone is laid over the pit, and the king seals it with his ring. In the night he cannot eat and cannot sleep.',
        'Early in the morning he hurries to the pit and calls: “Daniel, was your God able to save you?” Daniel answers: “My God sent his angel, who shut the lions’ mouths. They did me no harm.”',
        'The king is glad. They pull Daniel out of the pit and find no wound on him, because he trusted his God. Then the king writes to all peoples: “Honor the God of Daniel, for he is the living God!”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does the king seal the stone with?', options: ['with his ring', 'with wax', 'with clay'] },
        { q: 'Who shuts the lions’ mouths?', options: ['an angel of God', 'Daniel', 'the king'] }
      ]
    }
  ],
  exam: [
    { q: 'What is the king of Babylon called at the beginning?', options: ['Nebuchadnezzar', 'Belshazzar', 'Darius'] },
    { q: 'What do Daniel and his friends eat for ten days?', options: ['vegetables and water', 'bread and wine', 'meat and milk'] },
    { q: 'What is the head of the statue in the king’s dream made of?', options: ['fine gold', 'silver', 'clay'] },
    { q: 'What do Shadrach, Meshach and Abednego say to the king?', options: ['“We will not worship your image.”', '“We will worship your image.”', '“We are going away.”'] },
    { q: 'How many men does the king see in the fire?', options: ['four', 'three', 'seven'] },
    { q: 'Who shuts the lions’ mouths?', options: ['an angel of God', 'Daniel', 'the king'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 24.10.2026): geschichte-NN-en-v1.mp3, one per stage in the order of the stages
danielEn.stages!.forEach((s, i) => {
  s.audio = `audio/abenteuer/daniel/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
