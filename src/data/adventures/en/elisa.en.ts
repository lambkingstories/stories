/**
 * English texts of the adventure "Elisha and Naaman" (8 to 10 years): the same shape as `../elisa.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Elisha, Naaman, Shunem, Gehazi, Gilgal, Baal-shalisha, Samaria, Damascus, Jordan); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Elisa/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Elisa/tools/bauen_elisa.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const elisaEn: TextOverlay<Journey> = {
  title: 'Elisha and Naaman',
  subtitle: 'The Oil, the Bread and the Jordan',
  gift: { title: 'The Widow’s Oil' },
  stages: [
    {
      title: 'The widow’s oil',
      ref: '2 Kings 4:1–7',
      text: [
        'A woman comes to Elisha, crying. "My husband has died," she says. "He honored God. Now the man we owe money to wants to take my two sons to work for him."',
        '"What do you have in the house?" asks Elisha. "Nothing," says the woman, "only a small jar of oil." Then Elisha says: "Go to all your neighbors and ask them for empty jars, not just a few! Then shut the door behind you and your sons, and pour the oil into all the jars."',
        'The woman does it. Her sons bring one jar after the other, and she pours and pours. The oil does not stop flowing. When all the jars are full she says: "Bring me another one!" "There is none left," says her son. Then the oil stops. Elisha says: "Sell the oil and pay your debt. You can live on the rest."'
      ],
      task: {
        hint: 'Pour the oil into the jars one after the other. If a jar runs over, move the jug on.',
        jars: {
          rounds: [{ hint: 'Drag the jug over a jar. When it is full, move it on to the next one.' }, { hint: 'Now four jars. Let no oil run over.' }, { hint: 'Last, five jars, small ones and big ones.' }]
        }
      },
      questions: [
        { q: 'What does the woman have in her house?', options: ['a small jar of oil', 'a sack of flour', 'a donkey'] },
        { q: 'What is she to ask her neighbors for?', options: ['empty jars', 'bread', 'money'] }
      ]
    },
    {
      title: 'The room on the roof',
      ref: '2 Kings 4:8–17',
      text: [
        'A rich woman lives in Shunem. Whenever Elisha passes by, she invites him to eat. One day she says to her husband: "I can tell that this man of God is holy. Let us build him a little room upstairs and put a bed, a table, a chair and a lamp in it. Then he can rest there when he comes to us."',
        'So it is done. When Elisha comes again, he sleeps in the room. He wants to thank the woman and has her called. His servant Gehazi says: "She has no son, and her husband is old."',
        '"About this time next year," Elisha says to the woman, "you will hold a son in your arms." She can hardly believe it. But it happens just as Elisha said.'
      ],
      task: { hint: 'Put the picture of the room on the roof together.' },
      questions: [
        { q: 'What does the woman build for Elisha?', options: ['a little room on the roof', 'a tent in the garden', 'a stable'] },
        { q: 'What does she put in the room?', options: ['a bed, a table, a chair and a lamp', 'boxes and sacks', 'an oven'] }
      ]
    },
    {
      title: 'The woman’s son',
      ref: '2 Kings 4:18–37',
      text: [
        'The woman’s son grows up. One day he is with his father in the field and cries: "Oh, my head, my head!" A servant carries him to his mother. She holds him on her lap, and at noon he dies. The mother lays him on the bed in the room of the man of God and shuts the door.',
        'Then she has a donkey saddled. "Drive fast and do not stop!" she tells the servant. She rides to Elisha on Mount Carmel. "I will not let you go," she tells him.',
        'Elisha goes with her. In the house he shuts the door and prays to God. He bends over the child until it grows warm. Then the boy sneezes seven times and opens his eyes. "Take your son," says Elisha. The mother falls down before him and takes her son in her arms.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does the mother ride to?', options: ['to Elisha on Mount Carmel', 'to Jerusalem', 'to the sea'] },
        { q: 'What does Elisha do in the house?', options: ['He prays to God.', 'He sings a song.', 'He goes away again.'] },
        { q: 'How often does the boy sneeze?', options: ['seven times', 'once', 'ten times'] }
      ]
    },
    {
      title: 'The pot with the bitter stew',
      ref: '2 Kings 4:38–41',
      text: [
        'In Gilgal food is scarce. Elisha sits with the sons of the prophets. "Put the big pot on," he tells his servant, "and cook a stew for the men."',
        'One of them goes out into the field to gather herbs. He finds a wild vine with fruit and fills his cloak with it. He cuts it into the pot, because nobody knows it.',
        'When the men want to eat they cry out: "Man of God, there is poison in the pot!" It tastes so bitter that they cannot eat it. Elisha says: "Bring flour!" He sprinkles the flour into the pot and says: "Serve it to the men." Now everybody can eat, and it does them no harm.'
      ],
      task: { hint: 'Tap the vegetables. The wild gourds do not belong in the basket.' },
      questions: [
        { q: 'Where does Elisha cook the stew?', options: ['in a big pot', 'on a stone', 'by the river'] },
        { q: 'What is wrong with the stew?', options: ['It is bitter.', 'It is too hot.', 'It is too small.'] }
      ]
    },
    {
      title: 'Twenty loaves',
      ref: '2 Kings 4:42–44',
      text: [
        'A man comes to Elisha from Baal-shalisha. He brings twenty barley loaves and fresh grain in his cloak. It is the first of his harvest, and he gives it to the man of God.',
        '"Give it to the people to eat," Elisha tells his servant. The servant looks at the loaves and then at the men. "How can I give this to a hundred men?" he asks.',
        'But Elisha says once more: "Give it to the people so that they can eat. For this is what God says: They will eat, and there will be some left over." The servant hands out the loaves. All the men eat and are full. And there is bread left over, as God said.'
      ],
      task: {
        hint: 'Put the pictures in the order of the story.',
        order: {
          cards: [{ label: 'The man brings twenty loaves to Elisha' }, { label: 'Elisha says: Give it to the people' }, { label: 'The servant hands out the loaves' }, { label: 'Everyone is full, and bread is left over' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the man and his loaves and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Where does the man with the loaves come from?', options: ['from Baal-shalisha', 'from Damascus', 'from Gilgal'] },
        { q: 'How many loaves does he bring?', options: ['twenty', 'two', 'two hundred'] }
      ]
    },
    {
      title: 'The girl from Israel',
      ref: '2 Kings 5:1–4',
      text: [
        'In Syria lives a high commander named Naaman. The king thinks highly of him, and many people respect him, because God has often helped the Syrians through him. But Naaman is ill. He has a bad skin disease.',
        'A young girl works in his house. Syrian soldiers once took her away from the land of Israel, and now she serves Naaman’s wife. The girl says to her: "If only my master would go to the prophet in Samaria! He would make him well."',
        'Naaman hears about it. He goes to his king and tells him what the girl from Israel has said.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is Naaman’s job?', options: ['commander of the army', 'baker', 'shepherd'] },
        { q: 'Where does the girl come from?', options: ['from the land of Israel', 'from Egypt', 'from Babylon'] },
        { q: 'Whom should Naaman visit, says the girl?', options: ['the prophet in Samaria', 'the king of Tyre', 'a doctor in Damascus'] }
      ]
    },
    {
      title: 'The letter and the gifts',
      ref: '2 Kings 5:5–10',
      text: [
        'The king of Syria says: "Go! I will write a letter to the king of Israel." Naaman takes ten talents of silver, six thousand pieces of gold and ten festive robes. So he travels to Samaria.',
        'The king of Israel reads the letter and is alarmed. "Am I God?" he cries. "How can I make a man well?" He tears his clothes. But Elisha hears about it and sends word: "Why are you so alarmed? Let him come to me. Then he will learn that there is a prophet in Israel."',
        'Naaman drives up to Elisha’s house with his horses and chariots. Elisha does not come out. He sends a messenger: "Go and wash seven times in the Jordan. Then you will be well."'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The letter: the king of Syria writes a letter to the king of Israel.' }, { text: 'The silver: Naaman takes ten talents of silver with him.' }, { text: 'The gold: he also takes six thousand pieces of gold.' }, { text: 'The festive robe: Naaman has ten festive robes with him.' }, { text: 'The chariot: Naaman drives to Samaria with his chariots, right up to Elisha’s house.' }, { text: 'The horse: his horses pull the chariot up to Elisha’s house.' }] }
      },
      questions: [
        { q: 'What does the king of Syria write?', options: ['a letter', 'a song', 'a law'] },
        { q: 'Where does Naaman drive to?', options: ['to Samaria', 'to Egypt', 'to Babylon'] }
      ]
    },
    {
      title: 'Seven times in the Jordan',
      ref: '2 Kings 5:11–14',
      text: [
        'Naaman is angry and drives away. "I thought he would come out to me!" he says. "He should call on God, wave his hand over the sick place and heal me. Are the rivers of Damascus not better than all the waters of Israel? I could wash there too!"',
        'Then his servants come to him. "Father," they say, "if the prophet had asked something hard of you, you would do it. Why not this easy thing: Wash, and you will be well?"',
        'Naaman listens to them. He goes down into the Jordan and dips himself seven times, as the man of God said. Then his skin becomes clean again, as soft as the skin of a child.'
      ],
      task: {
        hint: 'Tap when the water is calm. Naaman dips under seven times.',
        dive: { hint: 'Tap when the water is calm. Naaman dips under seven times.' }
      },
      questions: [
        { q: 'Why does Naaman get angry?', options: ['Elisha does not come out.', 'The way is too long.', 'The water is cold.'] },
        { q: 'Who talks to Naaman so that he listens?', options: ['his servants', 'his soldiers', 'the king'] }
      ]
    },
    {
      title: 'Naaman’s thanks',
      ref: '2 Kings 5:15–19',
      text: [
        'Naaman returns to Elisha with all his people. This time he steps up to him. "Now I know," he says, "that there is no God in all the earth except in Israel. Please accept a gift from me."',
        'But Elisha says: "As surely as God lives, I will take nothing." Naaman asks him once more, but Elisha stays firm.',
        'Then Naaman says: "Then at least let me take home as much earth as two mules can carry. Your servant will no longer offer sacrifices to any other god, only to the Lord." Elisha says to him: "Go in peace!" And Naaman drives home with his chariots.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Go in ', '!”'], words: ['peace', 'haste', 'strife'] },
            { hint: 'Now two words are missing.', parts: ['“As surely as ', ' lives, I will take ', '.”'], words: ['God', 'nothing', 'gold', 'silver'] }
          ]
        }
      },
      questions: [
        { q: 'What does Naaman realize?', options: ['There is a God only in Israel.', 'The Jordan is a cold river.', 'Elisha is a rich man.'] },
        { q: 'What does Elisha accept from Naaman?', options: ['nothing', 'the silver', 'the festive robes'] }
      ]
    }
  ],
  exam: [
    { q: 'What does the woman pour into the many jars?', options: ['oil', 'water', 'milk'] },
    { q: 'What does the woman of Shunem build for Elisha?', options: ['a little room on the roof', 'a tent', 'a school'] },
    { q: 'How often does the boy sneeze before he opens his eyes?', options: ['seven times', 'twice', 'ten times'] },
    { q: 'What does Elisha put into the pot with the bitter stew?', options: ['flour', 'honey', 'meat'] },
    { q: 'Who tells Naaman to go to the prophet?', options: ['a young girl from Israel', 'the king', 'his son'] },
    { q: 'How often is Naaman to wash in the Jordan?', options: ['seven times', 'three times', 'ten times'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
elisaEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/elisa/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
