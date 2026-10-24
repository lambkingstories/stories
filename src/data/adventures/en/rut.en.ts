/**
 * English texts of the adventure "Ruth" (8 to 10 years): the same shape as `../rut.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Ruth, Naomi, Orpah, Boaz, Elimelech, Obed, Jesse, David, Moab, Bethlehem); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Rut/ENGLISCH/Rut_English_Texte.md.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
 * Generated from the readable file by D:/Claude/Abenteuer-Rut/tools/bauen_rut.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const rutEn: TextOverlay<Journey> = {
  title: 'Ruth',
  subtitle: 'Where You Go, I Will Go',
  gift: { title: 'Ruth and Naomi' },
  stages: [
    {
      title: 'Hunger in Bethlehem',
      ref: 'Ruth 1:1–7',
      text: [
        'At the time when judges rule in Israel, a famine comes over the land. So a man from Bethlehem in Judah, Elimelech, moves with his wife Naomi and his two sons to the land of Moab. There they stay.',
        'In Moab Elimelech dies, and Naomi is left alone with her sons. The two sons marry women of Moab. One is called Orpah, the other Ruth. After about ten years the two sons die as well. Now three widows are left: Naomi and her daughters-in-law Orpah and Ruth.',
        'One day Naomi hears that God has helped his people and given them bread again. So she sets out on the way back to Judah, and Orpah and Ruth go with her.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Why does Elimelech move his family to Moab?', options: ['There is hunger in the land.', 'There is a war.', 'There is a wedding.'] },
        { q: 'What are Naomi’s daughters-in-law called?', options: ['Orpah and Ruth', 'Rachel and Leah', 'Sarah and Rebekah'] },
        { q: 'What does Naomi hear one day?', options: ['God has given his people bread again.', 'A new king is ruling.', 'A war breaks out in Moab.'] }
      ]
    },
    {
      title: 'Where You Go',
      ref: 'Ruth 1:8–18',
      text: [
        'On the way Naomi stops. “Go back, my daughters,” she says, “each to her mother’s house. May God be good to you, as you have been good to me.” She kisses them, and all three weep.',
        '“No, we will go with you to your people,” say Orpah and Ruth. But Naomi says: “I have no more sons who could be your husbands. Go home!” Then they weep even more. Orpah kisses her mother-in-law goodbye and turns back. But Ruth stays with Naomi.',
        '“Look,” says Naomi, “Orpah has gone back to her people and to her god. You go too.” But Ruth answers: “Do not urge me to leave you. Where you go, I will go. Where you stay, I will stay. Your people shall be my people, and your God my God.”',
        'When Naomi sees how firmly Ruth has made up her mind, she says no more.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Where you ', ', I will go.”'], words: ['go', 'stay', 'live'] },
            { hint: 'Now two words are missing.', parts: ['“Your ', ' shall be my people, and your ', ' my God.”'], words: ['people', 'God', 'land', 'house'] }
          ]
        }
      },
      questions: [
        { q: 'Who turns back to her people?', options: ['Orpah', 'Ruth', 'Naomi'] },
        { q: 'What does Ruth say to Naomi?', options: ['Your people shall be my people, and your God my God.', 'I would rather stay in Moab.', 'I am going back to my mother.'] }
      ]
    },
    {
      title: 'Is This Naomi?',
      ref: 'Ruth 1:19 – 2:4',
      text: [
        'The two women walk on together until they come to Bethlehem. Then the whole town is stirred: “Is this Naomi?” “Do not call me Naomi,” she says, “call me Mara, the bitter one. I went away full, and God has brought me home empty.”',
        'It is the time when the barley harvest begins. One day Ruth says: “Let me go to the field and pick up ears of grain, where someone will welcome me.” “Go, my daughter,” says Naomi.',
        'Ruth follows the reapers and picks up what they leave behind. As it happens, the field belongs to Boaz, a wealthy man from Elimelech’s family. Then Boaz comes from the town to his workers. “The Lord be with you!” he calls. “The Lord bless you!” the reapers answer.'
      ],
      task: {
        hint: 'Collect the ears of grain that lie behind the reapers.',
        glean: { rounds: [{ hint: 'Collect the ears of grain that lie behind the reapers.' }, { hint: 'Now three reapers are working. Wait until they have passed and tap only the ears that lie on the ground.' }] }
      },
      questions: [
        { q: 'What does Naomi want to be called now?', options: ['Mara', 'Orpah', 'Ruth'] },
        { q: 'What does Ruth do in the field?', options: ['She picks up ears of grain.', 'She cuts the grain.', 'She ties the sheaves.'] },
        { q: 'Whose field is it?', options: ['Boaz', 'Elimelech', 'Orpah'] }
      ]
    },
    {
      title: 'Boaz Is Kind',
      ref: 'Ruth 2:5–16',
      text: [
        '“Whose young woman is this?” Boaz asks the servant who is in charge of the reapers. “The Moabite who came back with Naomi,” says the servant. “She has been gathering among the sheaves since morning.”',
        'Then Boaz goes to Ruth: “My daughter, do not go to any other field, stay with my young women. My men must not touch you. And when you are thirsty, drink from their jars.” Ruth bows down: “Why are you so kind to me? I am a stranger.” “I have been told what you have done for Naomi,” says Boaz. “You have come to God for shelter, as under his wings.”',
        'At mealtime Boaz says: “Eat some bread.” Ruth sits down beside the reapers, and he hands her roasted grain. She eats, is full, and even has some left. Then Boaz tells his men: “Let her gather among the sheaves too, and leave some ears for her on purpose.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Whose field is Ruth to stay in?', options: ['the field of Boaz', 'the field by the river', 'any field'] },
        { q: 'What does Boaz hand to Ruth to eat?', options: ['roasted grain', 'honey cakes', 'fish'] },
        { q: 'What does Boaz tell his men?', options: ['Leave some ears for her.', 'Send her away.', 'Give her the whole harvest.'] }
      ]
    },
    {
      title: 'An Ephah of Barley',
      ref: 'Ruth 2:17–23',
      text: [
        'Ruth gathers in the field until evening. Then she beats out the grain from the ears. It is about an ephah of barley, as much as fills a big measure. She carries it into the town, and Naomi sees what she has gathered. Ruth also gives her what was left over from her meal.',
        '“Where did you gather today?” asks Naomi. “Blessed be the one who looked on you so kindly!” “With a man named Boaz,” says Ruth.',
        '“Blessed be he by God!” cries Naomi. “He belongs to our family. He may stand up for us.” Ruth tells her: “Boaz also said I should stay with his workers until they have brought in the whole harvest.” “That is good, my daughter,” says Naomi.',
        'So Ruth gathers until the end of the barley and wheat harvest. And she lives with Naomi.'
      ],
      task: {
        hint: 'Hold down until the measure is filled up to the mark.',
        measure: { rounds: [{ hint: 'Hold down until the measure is filled up to the mark. Then let go.' }, { hint: 'What is left for Naomi: fill the measure only up to half.' }] }
      },
      questions: [
        { q: 'What else does Ruth give Naomi besides the barley?', options: ['what was left over from her meal', 'a piece of land', 'a cloak'] },
        { q: 'What is the name of the man Ruth gathered with?', options: ['Boaz', 'Elimelech', 'Obed'] },
        { q: 'How long does Ruth gather in the fields of Boaz?', options: ['until the barley and wheat harvests are over', 'until winter', 'until the next wedding'] }
      ]
    },
    {
      title: 'On the Threshing Floor',
      ref: 'Ruth 3:1–9',
      text: [
        'After the harvest Naomi says: “My daughter, Boaz is winnowing barley on his threshing floor tonight. Wash, put on oil, put on your dress and go down to the threshing floor. Do not let him know who you are until he has eaten and drunk. When he lies down, notice the place. Then go quietly and uncover his feet. He will tell you what to do.”',
        '“All that you say I will do,” answers Ruth, and she does it. Boaz eats and drinks and is in good spirits. He lies down beside the heap of grain. Then Ruth comes quietly, uncovers his feet and lies down.',
        'At midnight Boaz is startled and leans forward: a woman is lying at his feet! “Who are you?” he asks. “I am Ruth, your servant,” she says. “Spread your cloak over me, for you may stand up for us.”'
      ],
      task: {
        hint: 'Put the cards in the order of Naomi’s advice.',
        order: {
          cards: [{ label: 'Ruth washes her hands and face' }, { label: 'Ruth puts on her good dress' }, { label: 'Ruth goes down to the threshing floor' }, { label: 'Ruth waits until Boaz has eaten' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of Naomi’s advice. The dots show where they go.' }, { hint: 'Round 2: Now without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What should Ruth do until Boaz has eaten and drunk?', options: ['not let him know who she is', 'help him', 'go home'] },
        { q: 'When is Boaz startled?', options: ['at midnight', 'in the morning', 'at sunset'] },
        { q: 'How does Ruth answer when Boaz asks who she is?', options: ['I am Ruth, your servant.', 'I am Naomi.', 'I am a reaper.'] }
      ]
    },
    {
      title: 'Six Measures of Barley',
      ref: 'Ruth 3:10–18',
      text: [
        '“Blessed are you by God, my daughter!” says Boaz. “Do not be afraid. The whole town knows that you are a worthy woman. It is true: I may stand up for you. But there is a relative who is even closer to you than I am. In the morning he shall decide. If he does not want to, I will do it, as surely as God lives.”',
        'Ruth stays until morning. She gets up before anyone can recognize anyone. Boaz does not want anyone to find out that a woman was on the threshing floor.',
        '“Hold out your cloak,” he says. He measures out six measures of barley and lays them on her, then he goes into the town. Ruth tells Naomi everything. “He said: You shall not go to your mother-in-law empty-handed.” Naomi says: “Wait, my daughter. The man will not rest until the matter is settled today.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How much barley does Boaz give Ruth to take home?', options: ['six measures', 'two baskets', 'a little bag'] },
        { q: 'What does Boaz say about another relative?', options: ['He is even closer to you than I am.', 'He has moved to Moab.', 'He has already bought the field.'] },
        { q: 'What does Naomi say about Boaz?', options: ['He will not rest until the matter is settled today.', 'He will soon go away.', 'He will forget everything.'] }
      ]
    },
    {
      title: 'At the Town Gate',
      ref: 'Ruth 4:1–12',
      text: [
        'Boaz goes up to the town gate and sits down there. Then the closer relative he spoke of passes by. “Come and sit down here!” calls Boaz. Then he brings ten men of the elders of the town: “Sit down here!” And they sit down.',
        'Boaz says to the relative: “Naomi is selling the piece of land that belonged to Elimelech. Will you buy it? Then do it before these witnesses.” “I will buy it,” says the man. “Then you must also take Ruth,” says Boaz, “so that the name of the dead man lives on.” Then the man says: “Then I cannot buy it. You buy it!” And he takes off his sandal and gives it to Boaz. That is how it was confirmed in Israel in those days.',
        '“You are my witnesses today,” says Boaz. “I have bought everything that belonged to Elimelech. I also take Ruth as my wife.” “We are witnesses,” cry all the people at the gate.'
      ],
      task: {
        hint: 'Call ten elders to the gate. Tap only the men with gray beards.',
        elders: { rounds: [{ hint: 'Call ten elders to the gate. Tap only the men with gray beards.' }, { hint: 'Now the next five come. Again tap only the men with gray beards.' }] }
      },
      questions: [
        { q: 'Where does Boaz go to settle the matter?', options: ['to the town gate', 'to the threshing floor', 'to the well'] },
        { q: 'What does the closer relative take off and give to Boaz?', options: ['his sandal', 'his cloak', 'his ring'] },
        { q: 'What does Boaz buy?', options: ['the piece of land that belonged to Elimelech', 'a house in the town', 'a vineyard'] }
      ]
    },
    {
      title: 'Obed',
      ref: 'Ruth 4:13–22',
      text: [
        'Boaz takes Ruth as his wife. God gives them a son.',
        'The women of Bethlehem say to Naomi: “Blessed be God, who has given you someone today who stands up for your family! He will refresh your life and care for you in your old age. For your daughter-in-law, who loves you, has borne him. She is worth more to you than seven sons.”',
        'Naomi takes the child, lays him in her lap and looks after him. The neighbor women give him a name: Obed.',
        'Obed becomes the father of Jesse, and Jesse becomes the father of David. He will later be king over Israel.'
      ],
      task: {
        hint: 'Tap left and right, one after the other, very gently, until the child is asleep.',
        cradle: { rounds: [{ hint: 'Tap left and right, one after the other, very gently, until the child is asleep.' }, { hint: 'Now without the glow. Again one side after the other, and calm.' }] }
      },
      questions: [
        { q: 'What is the son of Ruth and Boaz called?', options: ['Obed', 'Jesse', 'Elimelech'] },
        { q: 'Who lays the child in her lap?', options: ['Naomi', 'Orpah', 'Ruth'] },
        { q: 'Who is David’s grandfather?', options: ['Obed', 'Boaz', 'Elimelech'] }
      ]
    }
  ],
  exam: [
    { q: 'Where does Elimelech move because of the hunger?', options: ['to Moab', 'to Egypt', 'to Babylon'] },
    { q: 'What does Ruth say to Naomi?', options: ['Your people shall be my people, and your God my God.', 'I would rather stay in Moab.', 'I am going back to my mother.'] },
    { q: 'Whose field does Ruth pick up ears of grain in?', options: ['Boaz', 'Elimelech', 'Orpah'] },
    { q: 'What does Boaz hand to Ruth to eat?', options: ['roasted grain', 'honey cakes', 'fish'] },
    { q: 'What does the closer relative take off when he gives up his right?', options: ['his sandal', 'his cloak', 'his ring'] },
    { q: 'What is the son of Ruth and Boaz called?', options: ['Obed', 'Jesse', 'Elimelech'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
rutEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/rut/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
