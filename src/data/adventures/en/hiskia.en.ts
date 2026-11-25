/**
 * English texts of the adventure "Hezekiah: A Letter Before God" (7 to 10 years): the same shape as `../hiskia.ts`, only the words. Laid over the German data by `localize()`; the right answer is the first option,
 * exactly as in the German data. Names and wording follow the public-domain King James Version (2 Kings 18-20, 2 Chronicles 30 and 32); the stories are retold in our own words.
 * The source as a readable file: D:/Claude/Abenteuer-Hiskia/ENGLISCH. Generated from the readable file by D:/Claude/Abenteuer-Hiskia/tools/bauen_hiskia.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const hiskiaEn: TextOverlay<Journey> = {
  title: 'Hezekiah: A Letter Before God',
  subtitle: 'From the letters to everyone to the water for the city',
  gift: { title: 'Jerusalem in Hezekiah’s Days' },
  stages: [
    {
      title: 'Hezekiah Becomes King',
      ref: '2 Kings 18:1–7; 2 Chronicles 29:3',
      text: [
        'Hezekiah is twenty-five years old when he becomes king. His father Ahaz was king in Judah. For twenty-nine years Hezekiah reigns in Jerusalem.',
        'Hezekiah does what is right in the sight of the LORD, like his forefather David. He trusts in the LORD God of Israel so much that among all the kings of Judah there is none like him, neither before him nor after him.',
        'He clings to the LORD and does not turn away from him. The LORD is with him. Wherever Hezekiah goes, he prospers. He will not serve the king of Assyria any more.',
        'In the first month of the first year since he became king, Hezekiah opens the doors of the house of the LORD and repairs them.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'How old is Hezekiah when he becomes king?', options: ['twenty-five years', 'twelve years', 'forty years'] },
        { q: 'In whom does Hezekiah trust?', options: ['in the LORD God of Israel', 'in the king of Assyria', 'in the Pharaoh of Egypt'] },
        { q: 'What does Hezekiah do in his first year as king?', options: ['He opens the doors of the house of the LORD.', 'He builds a new wall.', 'He travels to Assyria.'] }
      ]
    },
    {
      title: 'Letters to Everyone',
      ref: '2 Chronicles 30:1–12',
      text: [
        'Hezekiah wants to keep the Passover. It has not been kept for a long time as it is written. So Hezekiah writes letters to all Israel and Judah: Everyone should come to Jerusalem, to the house of the LORD.',
        'Runners carry the king’s letters through the whole land. “You children of Israel,” they cry, “turn back to the LORD! The LORD your God is gracious and merciful. He will not turn away his face from you, if you return to him.”',
        'The runners go from city to city. Many laugh them to scorn and mock them. But some humble themselves and come to Jerusalem. Also in Judah God makes their hearts one, so that they do what the king has commanded.'
      ],
      task: {
        hint: 'Hezekiah sends runners with letters. Each runner has three letters. Send them out so that every town gets one.',
        runRoutes: {
          city: { label: 'Jerusalem' },
          runners: [{ label: 'runner with a headband' }, { label: 'runner with stubble' }, { label: 'young runner' }],
          rounds: [{ hint: 'Two runners, five towns. Tap a runner, then the town he runs to.', towns: [{ label: 'Town 1' }, { label: 'Town 2' }, { label: 'Town 3' }, { label: 'Town 4' }, { label: 'Town 5' }] }, { hint: 'Three runners, seven towns. Each town gets only one letter.', towns: [{ label: 'Town 1' }, { label: 'Town 2' }, { label: 'Town 3' }, { label: 'Town 4' }, { label: 'Town 5' }, { label: 'Town 6' }, { label: 'Town 7' }] }]
        }
      },
      questions: [
        { q: 'Who carries Hezekiah’s letters through the land?', options: ['the runners', 'the shepherds', 'the priests'] },
        { q: 'What do many people do when the runners come?', options: ['They laugh and mock.', 'They run along at once.', 'They shut the gates.'] }
      ]
    },
    {
      title: 'The Great Feast',
      ref: '2 Chronicles 30:13–27',
      text: [
        'A great crowd gathers in Jerusalem. They keep the feast for seven days with great gladness.',
        'Many of them have not prepared themselves as it is written. So Hezekiah prays for them: “The good LORD pardon everyone who sets his heart to seek God, the LORD God of his fathers.” And the LORD hears Hezekiah.',
        'The priests and the Levites praise the LORD every day with loud instruments. When the seven days are over, they all agree to keep another seven days, and they keep them with gladness.',
        'There is great joy in Jerusalem. Since the time of Solomon the son of David, there has been nothing like it. Then the priests and the Levites stand up and bless the people. Their voice is heard, and their prayer comes up to God’s holy dwelling place in heaven.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'How many days do they keep the feast at first?', options: ['seven days', 'three days', 'forty days'] },
        { q: 'Who prays for the people who are not prepared?', options: ['Hezekiah', 'Solomon', 'Isaiah'] },
        { q: 'Since when had there been no joy like this in Jerusalem?', options: ['since the time of Solomon', 'since the time of Noah', 'since the time of David'] }
      ]
    },
    {
      title: 'Sennacherib Comes',
      ref: '2 Kings 18:13–17',
      text: [
        'In the fourteenth year since Hezekiah became king, Sennacherib, the king of Assyria, comes up against all the fortified cities of Judah and takes them. Then Hezekiah sends to him at Lachish: “I have offended. Withdraw from me. Whatever you put on me, I will bear.”',
        'The king of Assyria demands a great deal of silver and gold. Hezekiah gives him all the silver that is found in the house of the LORD and in the treasures of the king’s house. He even cuts off the plates from the doors of the temple, which he himself had overlaid, and gives them to the king of Assyria.',
        'But the king of Assyria sends his messenger, the Rabshakeh, with two other high men and a great host, from Lachish to Jerusalem. They stop at the conduit of the upper pool and call for the king.'
      ],
      task: {
        hint: 'Find the two matching pictures.',
        memory: { pairs: [{ text: 'The conduit of the upper pool.' }, { text: 'The upper pool.' }, { text: 'The doors of the temple.' }, { text: 'A chest with silver.' }, { text: 'Hezekiah sends word to Lachish.' }, { text: 'The wall of Jerusalem.' }] }
      },
      questions: [
        { q: 'Who comes up against the fortified cities of Judah?', options: ['Sennacherib, the king of Assyria', 'Solomon, the king of Israel', 'the Pharaoh of Egypt'] },
        { q: 'Where does Hezekiah take the silver from?', options: ['from the house of the LORD and the treasures of the king’s house', 'from the river and the mountains', 'from the market and the fields'] }
      ]
    },
    {
      title: 'What Are You Trusting In?',
      ref: '2 Kings 18:19–37',
      text: [
        'Three men of the king come out to the messenger of the king of Assyria before the wall. “Tell Hezekiah,” he calls to them, “thus says the great king: What confidence is this in which you trust?”',
        'Then he cries with a loud voice to the people on the wall, in the language of the Jews: “Do not let Hezekiah make you trust in the LORD, saying, The LORD will surely deliver us. Where is a god who has delivered his land out of my hand? How then should the LORD deliver Jerusalem out of my hand?”',
        'The people on the wall are silent and do not answer him a word, for the king has commanded: “Answer him not.” Hezekiah’s men go to him with their clothes torn and tell him what the messenger has cried.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does the messenger ask the king?', options: ['What confidence is this in which you trust?', 'Where is your treasure?', 'When will you open the gate?'] },
        { q: 'How do the people on the wall answer?', options: ['They are silent.', 'They cry back loudly.', 'They run away.'] },
        { q: 'Where do Hezekiah’s men go at the end?', options: ['to Hezekiah', 'to Sennacherib', 'to the temple'] }
      ]
    },
    {
      title: 'In the House of the LORD',
      ref: '2 Kings 19:1–7',
      text: [
        'When Hezekiah hears what the messenger has said, he tears his clothes, puts on sackcloth, and goes into the house of the LORD.',
        'He sends his men and the oldest of the priests, also covered with sackcloth, to the prophet Isaiah, the son of Amoz.',
        'They say: “Thus says Hezekiah: This day is a day of trouble, of rebuke and of blasphemy. It may be that the LORD your God will hear all the words of the messenger who has reproached the living God. Lift up your prayer for those who are left.”',
        'Isaiah answers: “Say to your master: Thus says the LORD: Be not afraid of the words which you have heard, with which the servants of the king of Assyria have blasphemed me. He shall hear a rumour and return to his own land.”'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['Be not afraid of the ', ' which thou hast heard.'], words: ['words', 'waves', 'wolves'] },
            { hint: 'Now two words are missing.', parts: ['Be not ', ' of the words which thou hast ', '.'], words: ['afraid', 'heard', 'glad', 'seen'] }
          ]
        }
      },
      questions: [
        { q: 'To whom does Hezekiah send his men?', options: ['to the prophet Isaiah', 'to the king of Assyria', 'to the runners'] },
        { q: 'What does Hezekiah put on when he goes into the house of the LORD?', options: ['sackcloth', 'armor', 'a cloak'] }
      ]
    },
    {
      title: 'A Letter Before God',
      ref: '2 Kings 19:8–19',
      text: [
        'Sennacherib, the king of Assyria, sends messengers to Hezekiah once more, with a letter. “Do not let your God deceive you, in whom you trust,” it says. “You have heard what the kings of Assyria have done. And shall you be delivered?”',
        'Hezekiah takes the letter from the messengers and reads it. Then he goes up to the house of the LORD and spreads the letter before the LORD.',
        'He prays: “O LORD God of Israel, you alone are God over all the kingdoms of the earth. You have made heaven and earth. LORD, bow down your ear and hear! Open your eyes, LORD, and see! Hear the words of Sennacherib, who has sent to reproach the living God.”',
        '“Now therefore, O LORD our God, save us out of his hand, that all the kingdoms of the earth may know that you, LORD, are God alone.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What does Hezekiah spread before the LORD?', options: ['the letter', 'his crown', 'a cloth'] },
        { q: 'Where does Hezekiah go with the letter?', options: ['up to the house of the LORD', 'onto the wall', 'to Isaiah'] },
        { q: 'What does Hezekiah ask of the LORD?', options: ['Save us out of his hand.', 'Send us rain.', 'Give us much silver.'] }
      ]
    },
    {
      title: 'God Answers',
      ref: '2 Kings 19:20–21, 32–36',
      text: [
        'Isaiah, the son of Amoz, sends an answer to Hezekiah: “Thus says the LORD God of Israel: That which you have prayed to me against Sennacherib king of Assyria I have heard.” About Sennacherib the LORD says: “The daughter of Jerusalem has shaken her head at you.”',
        'And the LORD says further about the king of Assyria: “He shall not come into this city. By the way that he came, by the same shall he return. I will defend this city, to save it, for my own sake and for my servant David’s sake.”',
        'That same night the angel of the LORD goes out. Early in the morning there is no enemy left in the camp of Assyria. So Sennacherib, the king of Assyria, breaks camp, departs, returns, and stays at Nineveh.'
      ],
      task: {
        hint: 'The city wakes up. Tap a house: its door and the doors next to it change. Open all the doors.',
        cityMorning: {
          rounds: [{ hint: 'Nine houses, three doors are still shut.' }, { hint: 'Twelve houses, seven doors are still shut.' }]
        }
      },
      questions: [
        { q: 'What does the LORD say about Hezekiah’s prayer?', options: ['I have heard it.', 'I have forgotten it.', 'I will test it.'] },
        { q: 'Where does Sennacherib stay in the end?', options: ['at Nineveh', 'in Jerusalem', 'in Egypt'] }
      ]
    },
    {
      title: 'The Shadow Goes Back',
      ref: '2 Kings 20:1–11',
      text: [
        'At that time Hezekiah becomes sick unto death. Isaiah comes to him: “Thus says the LORD: Set your house in order, for you shall die.”',
        'Then Hezekiah turns his face to the wall and prays: “I beseech you, O LORD, remember now how I have walked before you in truth, and have done what is good in your sight.” And Hezekiah weeps bitterly.',
        'Isaiah has not gone far when the word of the LORD comes to him: “Go back and tell Hezekiah: I have heard your prayer, I have seen your tears. I will heal you. I will add fifteen years to your days.”',
        'As a sign Isaiah asks: “Shall the shadow go forward ten steps, or go back ten steps?” “Forward is easy,” says Hezekiah. “I want it to go back ten steps.” Isaiah cries to the LORD, and the shadow goes back ten steps on the stairs of Ahaz.'
      ],
      task: {
        hint: 'The shadow moves across the stairs. Use the tip of the shadow to show where it will stand, and count step by step.',
        sundial: {
          rounds: [{ hint: 'The shadow goes three steps forward, down the stairs. Show where it will stand.' }, { hint: 'Now the shadow goes back ten steps, up the stairs. Show where it will stand.' }]
        }
      },
      questions: [
        { q: 'What does Hezekiah do when he hears that he will die?', options: ['He turns his face to the wall and prays.', 'He runs out of the house.', 'He calls for the doctors.'] },
        { q: 'How many years does the LORD add to Hezekiah’s life?', options: ['fifteen years', 'three years', 'a hundred years'] }
      ]
    },
    {
      title: 'Water for the City',
      ref: '2 Kings 20:20; 2 Chronicles 32:2–4, 30',
      text: [
        'There is more to tell of Hezekiah. When Sennacherib comes and means to fight against Jerusalem, Hezekiah takes counsel with his princes and his mighty men. They want to stop the waters of the fountains outside the city, and they help him.',
        'A great crowd gathers. They stop all the fountains and the brook that runs through the midst of the land. “Why should the kings of Assyria come and find much water?” they say.',
        'Hezekiah makes the pool and the conduit, by which he brings water into the city. He stops the upper spring of Gihon and brings the water down to the west side of the city of David.'
      ],
      task: {
        hint: 'Two crews dig through the rock from both sides. Steer both so that they meet in the middle.',
        tunnel: {
          spring: { label: 'the spring' },
          pool: { label: 'the pool' },
          crews: { labelLeft: 'crew at the spring', labelRight: 'crew at the pool' },
          rounds: [{ hint: 'Choose a direction for both crews and tap “Dig”. The dark layers push the tunnel to the side.' }, { hint: 'Three layers push the tunnel. Tap “Listen” to see where the other crew is knocking.' }]
        }
      },
      questions: [
        { q: 'What should the kings of Assyria not find when they come?', options: ['much water', 'much bread', 'much silver'] },
        { q: 'Where does Hezekiah bring the water of the upper spring of Gihon?', options: ['down to the city', 'to the fields', 'to the Jordan'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Hezekiah do in his first year as king?', options: ['He opens the doors of the house of the LORD.', 'He builds a new wall.', 'He travels to Assyria.'] },
    { q: 'How do the people on the wall answer the messenger?', options: ['They are silent.', 'They cry back loudly.', 'They run away.'] },
    { q: 'What does Hezekiah spread before the LORD?', options: ['the letter', 'his crown', 'a cloth'] },
    { q: 'Where does Sennacherib stay in the end?', options: ['at Nineveh', 'in Jerusalem', 'in Egypt'] },
    { q: 'How many steps does the shadow go back?', options: ['ten steps', 'three steps', 'twelve steps'] },
    { q: 'What should the kings of Assyria not find when they come?', options: ['much water', 'much bread', 'much silver'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-vK.mp3 (K = version); a stage without a number in this list is read with the voice of the device
const ENGLISH_RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 6, 5: 2, 6: 2, 7: 4, 8: 2, 9: 2, 10: 2 }
hiskiaEn.stages!.forEach((s, i) => {
  const version = ENGLISH_RECORDING_VERSION[i + 1]
  if (version) s.audio = `audio/abenteuer/hiskia/geschichte-${String(i + 1).padStart(2, '0')}-en-v${version}.mp3`
})
