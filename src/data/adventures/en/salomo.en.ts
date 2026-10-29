/**
 * English texts of the adventure "Solomon" (8 to 10 years): the same shape as `../salomo.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Solomon, Gibeon, Hiram, Tyre, Lebanon, Jachin, Boaz, Sheba); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Salomo/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Salomo/tools/bauen_salomo.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const salomoEn: TextOverlay<Journey> = {
  title: 'Solomon',
  subtitle: 'The Wise King and the House of God',
  gift: { title: 'Solomon’s Throne' },
  stages: [
    {
      title: 'On the way to Gibeon',
      ref: '1 Kings 3:3–5',
      text: [
        'Solomon is still young, and he is king over Israel. His father David has died. Solomon loves God and wants to live the way David lived.',
        'There is no house for God yet, because nobody has built one in Jerusalem. People bring their offerings in many places on the hills. The most important place is at Gibeon, and Solomon sets out for it with his people.',
        'On the great altar at Gibeon he offers a thousand burnt offerings. In the night he falls asleep. Then a dream comes, and God speaks to him: "Ask what I shall give you!"'
      ],
      task: {
        hint: 'Tap the animals and count them.',
        question: 'How many animals do Solomon’s people lead to Gibeon?'
      },
      questions: [
        { q: 'Where does Solomon go to thank God?', options: ['to Gibeon', 'to Shiloh', 'to Bethel'] },
        { q: 'How many burnt offerings does he bring there?', options: ['a thousand', 'ten', 'a hundred'] }
      ]
    },
    {
      title: 'An obedient heart',
      ref: '1 Kings 3:6–15',
      text: [
        'Solomon may ask for anything. First he thanks God: "You were good to my father David. Now you have made me king, and I am still young. I do not know how to begin. And your people are so many that no one can count them."',
        'Then he asks: "Give me an obedient heart, so that I can judge your people and know what is good and what is evil."',
        'God is pleased with this request. "You did not ask for a long life, or for riches, or that your enemies might fare badly," he says. "I give you a wise and understanding heart. And what you did not ask for, I give you as well: riches and honor."',
        'Solomon wakes up, and it was a dream. He goes to Jerusalem, stands before the ark of the covenant and holds a great meal with all his servants.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Give me an obedient ', ', so that I can judge your people and know what is good and what is evil.”'], words: ['heart', 'sword', 'house'] },
            { hint: 'Now two words are missing.', parts: ['“I give you a ', ' and understanding heart. And what you did not ask for, I give you as well: ', ' and honor.”'], words: ['wise', 'riches', 'clever', 'silver'] }
          ]
        }
      },
      questions: [
        { q: 'What does Solomon ask for?', options: ['an obedient heart', 'a long life', 'a lot of gold'] },
        { q: 'What else does God give him?', options: ['riches and honor', 'a sword', 'a ship'] }
      ]
    },
    {
      title: 'The king’s judgment',
      ref: '1 Kings 3:16–28',
      text: [
        'Two women come to the king. They live in the same house, and each has a baby son. In the night one of the babies has died. Each woman says: "The living child is mine, and the dead one is yours!" They shout over each other in front of the king.',
        'Solomon listens to them both. Then he says: "Bring me a sword!" A servant brings it. "Divide the living child in two," says the king, "and give half to each."',
        'Then one woman cries out, and her heart burns with love: "Please, my lord, give her the child alive and do not kill it!" The other one says: "It shall be neither mine nor yours. Divide it!"',
        '"Give her the living child, and do not kill it," says Solomon. "She is its mother." All Israel hears about it and wonders at the king.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who comes to the king?', options: ['two women', 'two soldiers', 'two merchants'] },
        { q: 'What does the real mother ask?', options: ['Give her the child alive!', 'Give me a sword!', 'Give me more time!'] },
        { q: 'What does Solomon say at the end?', options: ['She is its mother.', 'I do not know.', 'Come back tomorrow.'] }
      ]
    },
    {
      title: 'Safe under the fig tree',
      ref: '1 Kings 4:20–34',
      text: [
        'Solomon is king over all Israel. The people are as many as the sand by the sea. They eat and drink and are glad. There is peace in the whole land. From Dan to Beersheba everyone sits in peace under their own vine and fig tree.',
        'God has given Solomon great wisdom, as wide as the sand on the shore. He speaks three thousand proverbs and sings a thousand and five songs. He talks about trees, from the cedar on Lebanon to the hyssop that grows out of the wall. He talks about animals, birds, creeping things and fish.',
        'People from all nations come to hear him, even from the kings of the earth who have heard of his wisdom.'
      ],
      task: { hint: 'Tap the ripe fruit. Stones and thorns do not belong in the basket.' },
      questions: [
        { q: 'Where do the people sit in peace?', options: ['under vine and fig tree', 'in the fortress', 'by the fire'] },
        { q: 'How many proverbs does Solomon speak?', options: ['three thousand', 'thirty', 'three hundred'] }
      ]
    },
    {
      title: 'Cedars from Lebanon',
      ref: '1 Kings 5:1–12',
      text: [
        'King Hiram of Tyre sends messengers to Solomon, because he has heard that Solomon was anointed king. Hiram loved David as long as David lived.',
        'Solomon sends word to him: "My father David could not build a house for the name of God, because he had to fight wars. Now God has given me rest. I will build the house. Have cedars cut on Lebanon. Nobody among us knows how to cut timber as well as your people."',
        'Hiram is glad and says: "Blessed be the Lord, who has given David a wise son!" His men bring the trunks down to the sea and tie them together as rafts. In return Solomon sends him wheat and oil, year after year. The two kings make peace with each other.'
      ],
      task: {
        hint: 'Put the pictures in the order of the story.',
        order: {
          cards: [{ label: 'Solomon sends a letter to Hiram' }, { label: 'Hiram reads the letter and is glad' }, { label: 'The cedars are cut down' }, { label: 'The trunks are bound into rafts' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the letter and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Who sends wood for God’s house?', options: ['Hiram, king of Tyre', 'Pharaoh', 'the queen of Sheba'] },
        { q: 'Which wood comes from Lebanon?', options: ['cedars', 'palms', 'figs'] }
      ]
    },
    {
      title: 'Stones without noise',
      ref: '1 Kings 5:13–18; 6:1–7',
      text: [
        'Solomon calls many men to work. Seventy thousand carry loads, eighty thousand cut stones in the mountains. Hiram’s builders help too. They break great, costly stones out of the rock for the foundation of God’s house.',
        'In the fourth year of his reign the building begins. The house is sixty cubits long, twenty cubits wide and thirty cubits high, with a porch in front and windows with strong bars.',
        'The stones are cut to size before they come to the building site. So nobody hears a hammer, an axe or any iron tool while they build. Every stone finds its place.'
      ],
      task: {
        hint: 'Pull the stone very slowly into the gap, so that it stays quiet.',
        quiet: { rounds: [{ hint: 'Pull the stone very slowly into the gap. Then it stays quiet.' }, { hint: 'Now two stones. They must lie quietly too.' }, { hint: 'Three stones in a row. Even calmer.' }] }
      },
      questions: [
        { q: 'What are the stones like when they arrive?', options: ['already cut to size', 'still rough', 'made of wood'] },
        { q: 'What can nobody hear on the building site?', options: ['hammer and axe', 'birdsong', 'singing'] }
      ]
    },
    {
      title: 'Cedar, gold and cherubim',
      ref: '1 Kings 6:14–35',
      text: [
        'Inside, the house is all cedar wood, from the walls to the ceiling. Knots and flowers are carved into the wood, so that no stone can be seen. The floor is made of fir boards.',
        'At the back there is a room, twenty cubits long, wide and high. The ark of the covenant is to stand there. Solomon covers everything with pure gold. He has two cherubim made of olive wood, each ten cubits high, and covers them with gold too. Their wings reach from wall to wall and touch in the middle.',
        'Cherubim, palm trees and flowers are carved on the walls and on the doors. Everything shines with gold.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The cedar: the wood comes from Lebanon, and the walls inside the house are all cedar.' }, { text: 'The gold: Solomon covers the whole house with pure gold.' }, { text: 'The cherub: two cherubim with outspread wings stand in the room at the back.' }, { text: 'The palm tree: palm trees are carved on the walls and doors.' }, { text: 'The flower: flowers are carved into the cedar wood too.' }, { text: 'The pomegranate: two hundred pomegranates decorate every capital of the pillars.' }] }
      },
      questions: [
        { q: 'What wood are the walls made of inside?', options: ['cedar wood', 'fir wood', 'ebony'] },
        { q: 'What does Solomon cover the back room with?', options: ['pure gold', 'silver', 'clay'] }
      ]
    },
    {
      title: 'Two pillars of bronze',
      ref: '1 Kings 7:13–22; 6:37–38',
      text: [
        'Solomon sends for Hiram of Tyre, a master of bronze. His mother is a widow from the tribe of Naphtali, and his father came from Tyre. Hiram is full of wisdom and skill and makes all the work Solomon needs.',
        'He casts two pillars of bronze, each eighteen cubits high. On top of each pillar he sets a capital like a lily, with a network and two rows of pomegranates, two hundred on each capital. He sets the pillars up in front of the porch of the house. The one on the right he calls Jachin, the one on the left Boaz.',
        'Solomon builds on God’s house for seven years. Then everything is finished, just as it should be.'
      ],
      task: {
        hint: 'Put the words into the strip in the right order.',
        words: {
          rounds: [
            { hint: 'Put the words into the strip in the right order.', sentences: ['Solomon builds on God’s house for seven years.', 'The one on the right he calls Jachin, the one on the left Boaz.'] },
            { hint: 'Now longer sentences.', sentences: ['He casts two pillars of bronze, each eighteen cubits high.', 'Hiram is full of wisdom and skill and makes all the work Solomon needs.'] }
          ]
        }
      },
      questions: [
        { q: 'What is the master of bronze called?', options: ['Hiram', 'Zadok', 'Nathan'] },
        { q: 'What are the two pillars called?', options: ['Jachin and Boaz', 'Adam and Eve', 'Reuben and Simeon'] }
      ]
    },
    {
      title: 'The ark comes in',
      ref: '1 Kings 8:1–11',
      text: [
        'Solomon calls the elders and the leaders of all the tribes to Jerusalem. They all come to the feast, because the ark of the covenant is to move into the new house.',
        'The priests lift the ark and carry it up. The king and all the people walk in front of it. They offer sheep and oxen, so many that nobody can count them. The priests bring the ark into the room at the back, under the wings of the cherubim. In the ark lie only the two stone tablets. Moses put them there at Mount Horeb.',
        'When the priests leave the house, a cloud fills God’s house. They cannot stand there to do their service, because God’s glory is there.'
      ],
      task: { hint: 'Put the picture of the ark moving in together.' },
      questions: [
        { q: 'What do the priests carry into the new house?', options: ['the ark of the covenant', 'the king’s throne', 'an altar of gold'] },
        { q: 'Where do they put the ark?', options: ['under the wings of the cherubim', 'in front of the gate', 'in the courtyard'] }
      ]
    },
    {
      title: 'Solomon’s prayer',
      ref: '1 Kings 8:22–30; 9:1–3',
      text: [
        'Solomon steps up to the altar, in front of the whole congregation. He spreads out his hands toward heaven and prays: "Lord God of Israel, there is no God like you, in heaven above or on earth below."',
        'Then he says: "Will God really dwell on the earth? Heaven and the highest heaven cannot hold you. How much less this house that I have built! Listen when your people pray to you in this place, and be kind to them."',
        'After that Solomon and all the people hold a great feast for fourteen days. Later, when everything is built, God appears to the king once more. "I have heard your prayer," he says. "I have made this house holy. My eyes and my heart will always be there."'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How does Solomon pray in front of the altar?', options: ['with his hands spread toward heaven', 'with his head bowed', 'sitting down'] },
        { q: 'What can God not be held by, says Solomon?', options: ['heaven and the highest heaven', 'the sea', 'Lebanon'] },
        { q: 'How long does the feast last?', options: ['fourteen days', 'one day', 'a year'] }
      ]
    },
    {
      title: 'The queen of Sheba',
      ref: '1 Kings 10:1–13',
      text: [
        'A queen from a faraway land hears about Solomon and about the God he honors. She wants to test him with riddles. With many servants and with camels she travels to Jerusalem. The camels carry spices, a great deal of gold and precious stones.',
        'Solomon answers everything she asks. Nothing is too hard for him. She sees his house, the food on his table, the servants in their clothes, the cupbearers and the offerings in God’s house. She can hardly stop marvelling.',
        '"What I heard is true," she says. "I did not want to believe it until I saw it with my own eyes. Not even half was told to me. Blessed be the Lord your God!" She gives Solomon gold and spices. He gives her everything she wishes, and she travels home.'
      ],
      task: {
        hint: 'Drag each gift into the chest of the same color.',
        sort: {
          rounds: [{ hint: 'Round 1: Drag each gift of the queen into the chest of the same color.' }, { hint: 'Round 2: Now more gifts. Spices belong in the green chest, gold in the golden one, gems in the blue one.' }]
        }
      },
      questions: [
        { q: 'What does the queen bring with her?', options: ['spices, gold and precious stones', 'sheep and goats', 'swords and shields'] },
        { q: 'How does she come to Jerusalem?', options: ['with camels', 'with a ship', 'with a wagon'] }
      ]
    },
    {
      title: 'The throne of ivory',
      ref: '1 Kings 10:14–25',
      text: [
        'Solomon becomes richer and wiser than all the kings of the earth. He has two hundred great shields made of gold and puts them in his house in the forest of Lebanon. All the king’s drinking cups are gold, for silver counts for nothing in Solomon’s days.',
        'He also builds a great throne of ivory and covers it with fine gold. Six steps lead up to it. On each step a lion stands on the left and on the right, twelve in all. Two more lions stand beside the armrests. Nothing like it has ever been made in any kingdom.',
        'All the world wants to see Solomon and hear the wisdom God has put into his heart. Every year they bring him gifts: gold and silver, clothes, spices, horses and mules.'
      ],
      task: {
        hint: 'Put the lions on the steps. They look toward the middle of the throne.',
        throne: {
          rounds: [
            { hint: 'Put the lions on the lower steps: one on the left, one on the right. They look toward the middle.' },
            { hint: 'Now the upper steps. A lion that looks to the right belongs on the left.' },
            { hint: 'Last, two lions at the armrests of the throne.' }
          ]
        }
      },
      questions: [
        { q: 'What is the throne made of?', options: ['ivory, covered with gold', 'stone', 'wood'] },
        { q: 'How many steps does the throne have?', options: ['six', 'three', 'ten'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Solomon ask God for?', options: ['an obedient heart', 'a lot of gold', 'a long life'] },
    { q: 'Who gets the child back?', options: ['the real mother', 'King Hiram', 'the servant'] },
    { q: 'Where do the cedars for God’s house come from?', options: ['from Lebanon', 'from Egypt', 'from Mount Sinai'] },
    { q: 'What are the two pillars in front of the porch called?', options: ['Jachin and Boaz', 'Solomon and David', 'Hiram and Tyre'] },
    { q: 'What lies in the ark of the covenant?', options: ['the two stone tablets', 'bread and wine', 'a sword'] },
    { q: 'How many lions stand on the steps of the throne?', options: ['twelve', 'six', 'a hundred'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
salomoEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/salomo/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
