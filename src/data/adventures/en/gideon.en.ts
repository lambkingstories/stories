/**
 * English texts of the adventure "Gideon" (8 to 10 years): the same shape as `../gideon.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible and King James Version
 * (Deborah, Barak, Sisera, Gideon, Joash, Ophrah, Purah, Jezreel, Harod, Oreb and Zeeb, Jerubbaal); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Gideon/ENGLISCH/.
 * English recordings: geschichte-NN-en-v4.mp3 (voice Achernar), set at the end of this file.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const gideonEn: TextOverlay<Journey> = {
  title: 'Gideon',
  subtitle: 'The Smallest and the Three Hundred',
  gift: { title: 'The Night of the Jars and Torches' },
  stages: [
    {
      title: 'Deborah and Barak',
      ref: 'Judges 4:1–10, 14–15; 5:31',
      text: [
        'For twenty years King Jabin oppresses the Israelites, until they cry out to God.',
        'In those days Deborah is judge in Israel, a prophetess who passes on God’s word. She sits under a palm tree, and the people come to her so that she may do justice among them.',
        'One day Deborah has Barak called, “Has God not told you: Go up Mount Tabor with ten thousand men?” “If you go with me, I will go,” answers Barak. “I will go with you,” says Deborah.',
        'On Mount Tabor Deborah calls, “Get up, this is the day! God goes out before you!” Barak comes down, and God throws the king’s army into confusion. It flees. After that the land has rest for forty years.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Under which tree does Deborah sit?', options: ['under a palm tree', 'under an oak', 'under a cedar'] },
        { q: 'What does Barak say to Deborah?', options: ['“If you go with me, I will go.”', '“I will go alone.”', '“I will stay here.”'] }
      ]
    },
    {
      title: 'The Midianites Come',
      ref: 'Judges 6:1–10',
      text: [
        'Again the Israelites forget God. For seven years the Midianites are stronger than they are.',
        'Every year, when the grain is ripe, they come with their tents and their camels. They are as many as locusts, and nobody can count their camels.',
        'They eat the fields bare and leave the Israelites nothing to eat. Not a stalk is left on the fields to harvest.',
        'The Israelites hide in caves and clefts of the rocks and build themselves strongholds in the mountains. They have become poor and are afraid. Then they cry out to God for help. God sends them a prophet, “This is what God says: I led you out of Egypt, but you did not listen to my voice.”'
      ],
      task: { hint: 'Push the sacks into the niches of the cave.', cave: { rounds: [{ hint: 'Push the sacks into the glowing niches. You can only push, not pull.' }, { hint: 'Now three sacks. Think before you push.' }] } },
      questions: [
        { q: 'How long are the Midianites stronger than Israel?', options: ['seven years', 'twenty years', 'forty years'] },
        { q: 'What are the Midianites compared to?', options: ['a swarm of locusts', 'a flock of sheep', 'a river'] }
      ]
    },
    {
      title: 'Gideon in the Winepress',
      ref: 'Judges 6:11–16',
      text: [
        'In Ophrah stands a great oak. Nearby, in a winepress, a man named Gideon is secretly threshing wheat. A winepress is a basin in the rock where grapes are usually pressed. Here no Midianite sees him.',
        'Then an angel of God sits down under the oak. “God is with you, you mighty warrior!” he says to Gideon.',
        'Gideon answers sadly, “If God is with us, why has all this happened to us? Where are the wonders our fathers told us about? God has left us.” But God says, “Go in this strength of yours and save Israel. I have sent you.”',
        '“How can I do that?” asks Gideon. “I am the smallest in my family, and my family is the least.” “I will be with you,” answers God.'
      ],
      task: { hint: 'Set the wind so that the chaff blows away.', winnow: { rounds: [{ hint: 'Set the wind. The light chaff should fly away, the heavy grains should stay.' }, { hint: 'Now the right wind is narrower. Take care of the grains.' }] } },
      questions: [
        { q: 'Where does Gideon thresh his wheat?', options: ['in a winepress', 'on the roof', 'by the river'] },
        { q: 'What does God say to Gideon?', options: ['“I will be with you.”', '“You must go alone.”', '“Go back to Egypt.”'] }
      ]
    },
    {
      title: 'Fire from the Rock',
      ref: 'Judges 6:17–24',
      text: [
        'Gideon can hardly believe it. “Give me a sign that it is really you,” he asks God’s messenger. “Do not leave until I bring you something.”',
        'He prepares a meal, bakes bread to go with it, and brings everything to the oak. “Put it there on the rock,” says the messenger.',
        'Then fire comes up out of the rock and consumes the meal, and the messenger has vanished. Gideon is frightened.',
        'But God speaks to him, “Peace be with you! Do not be afraid.” Then Gideon builds an altar there and calls it: God is Peace.'
      ],
      task: { hint: 'Lay the word with the letters.', word: { rounds: [{ hint: 'What does Gideon call the altar? God is …', word: 'PEACE', extra: ['T'] }, { hint: 'Where does Gideon set the meal? On the …', word: 'ROCK', extra: ['A'] }] } },
      questions: [
        { q: 'What comes out of the rock?', options: ['fire', 'water', 'a storm'] },
        { q: 'What does Gideon ask the messenger for first?', options: ['a sign', 'some flour', 'a sword'] }
      ]
    },
    {
      title: 'The Altar of Baal',
      ref: 'Judges 6:25–32',
      text: [
        'On the same night God says to Gideon, “Tear down the altar that your father built for Baal. Build an altar for me on top of the rock instead.” Baal is an idol that many people worship.',
        'Gideon takes ten of his servants and does what God says. Because he is afraid of the people of the town, he does it at night.',
        'In the morning the people see the broken altar and become angry. “Who did this?” they ask, and soon they know. In front of the house of Gideon’s father Joash they shout, “Bring out your son!”',
        'But Joash stands in front of his son. “Will you fight for Baal? If Baal is a god, let him fight for himself!” From that day Gideon is also called Jerubbaal.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'At what time does Gideon tear down the altar of Baal?', options: ['at night', 'at noon', 'at harvest time'] },
        { q: 'Who stands in front of Gideon?', options: ['his father Joash', 'Barak', 'a prophet'] }
      ]
    },
    {
      title: 'The Fleece on the Threshing Floor',
      ref: 'Judges 6:33–40',
      text: [
        'Again the Midianites camp in the valley of Jezreel. Then God’s Spirit fills Gideon with courage. He blows the trumpet and calls together the men of his family and his tribe.',
        'But Gideon wants to know even more surely. “I will put a fleece on the threshing floor, the firm place where the grain is threshed,” he says to God. “If in the morning only the fleece is wet and the ground around it is dry, then I will know that you are helping me.”',
        'So it happens. In the morning the fleece is so wet that Gideon wrings out a whole bowl of water, but the ground around it is dry.',
        'Gideon asks once more, “Do not be angry with me. This time let only the fleece stay dry and the ground be wet.” And God does it that night, too.'
      ],
      task: { hint: 'Let the night go by and find the dew.', dew: { rounds: [{ hint: 'The first night: Draw the moon to the morning. Then dew lies on the fleece. Tap the drops.' }, { hint: 'The second night: This time the fleece is dry. Where does the dew lie now?' }] } },
      questions: [
        { q: 'What does Gideon put on the threshing floor?', options: ['a fleece', 'a cloak', 'a sack of flour'] },
        { q: 'What does Gideon ask for the second time?', options: ['that the fleece stays dry and the ground gets wet', 'that it rains', 'that the fleece disappears'] }
      ]
    },
    {
      title: 'Too Many Men',
      ref: 'Judges 7:1–3',
      text: [
        'Early in the morning Gideon camps by the spring of Harod with all the men who have come at his call. Down in the valley lie the enemies.',
        'Then God says, “You have too many men with you. Otherwise the people will say later: We helped ourselves.”',
        'So Gideon is to announce, “Whoever is afraid may go home!”',
        'Twenty-two thousand men go home. Only ten thousand stay with Gideon. They watch the others go over the hills. The camp grows quiet. But God says, “There are still too many.”'
      ],
      task: { hint: 'Set the switch so that every man goes his way.', swit: { rounds: [{ hint: 'Whoever shows a house wants to go home: set the switch to the right. Whoever shows a horn stays: set it to the left.' }, { hint: 'Now the bubble soon goes away. Tap the man and it is back.' }] } },
      questions: [
        { q: 'What does God say about the men?', options: ['There are too many.', 'They are too tired.', 'They are too loud.'] },
        { q: 'How many men stay with Gideon at first?', options: ['ten thousand', 'twenty-two thousand', 'nine hundred'] }
      ]
    },
    {
      title: 'At the Water',
      ref: 'Judges 7:4–8',
      text: [
        '“Lead the men down to the water,” God says to Gideon. “There I will test them for you.” Gideon leads them down to the brook.',
        'Most of the men kneel down and drink. But a small group laps the water out of their hands, the way a dog laps, and brings it to their mouths.',
        '“With these three hundred men I will save you,” says God. “The others are to go home.”',
        'Gideon sends all the others home. Only the three hundred he keeps with him, and they take supplies and their trumpets along. Down in the valley lies the huge camp of the enemies.'
      ],
      task: { hint: 'Find the men who scoop the water to their mouths with their hands. Some of them are hiding!', find: { labels: ['Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand'], doneText: 'You found all five men who scoop the water to their mouths with their hands!' } },
      questions: [
        { q: 'How many men does Gideon keep with him?', options: ['three hundred', 'ten thousand', 'twenty-two thousand'] },
        { q: 'What do the three hundred men take along?', options: ['supplies and their trumpets', 'tents and herds', 'bread and wine'] }
      ]
    },
    {
      title: 'The Dream in the Camp',
      ref: 'Judges 7:9–15',
      text: [
        'On the same night God says to Gideon, “Go down to the camp of the enemies! If you are afraid, take your servant Purah with you.”',
        'Quietly the two go down the slope. Down in the valley lie as many enemies with their camels as locusts.',
        'Then Gideon hears one man telling another his dream. “I dreamed that a round loaf of barley bread rolled into the camp and knocked a tent over.” “That is nothing other than the sword of Gideon, the son of Joash,” the other answers. “God has given the whole camp into his hand.”',
        'Gideon bows down and thanks God. Then he goes back to his men, “Get up, God has given the camp of the enemies into your hands!”'
      ],
      task: { hint: 'Lead the two quietly down the slope from shadow to shadow.', sneak: { rounds: [{ hint: 'Lead Gideon and Purah from rock to rock. Wait in the shadow when a cone of light comes.' }, { hint: 'Now there are three watchers, and their light sways unevenly. Be patient in the shadow.' }] } },
      questions: [
        { q: 'Whom does Gideon take with him to the camp of the enemies?', options: ['his servant Purah', 'his father Joash', 'Barak'] },
        { q: 'What does the man in the camp dream about?', options: ['a rolling loaf of barley bread', 'a sheep', 'a bridge'] }
      ]
    },
    {
      title: 'Jars, Torches, and Trumpets',
      ref: 'Judges 7:16–21',
      text: [
        'Gideon divides the three hundred men into three groups of one hundred. Each man gets a trumpet and an empty jar, and in every jar there is a torch.',
        '“Watch me and do the same,” says Gideon. “When I blow the trumpet, you blow yours, too, and shout: For God and for Gideon!”',
        'In the middle of the night the men take their places all around the camp of the enemies. Gideon blows the trumpet, and everyone smashes his jar. Suddenly the torches blaze up in the darkness, and the trumpets sound everywhere: “The sword of God and of Gideon!”',
        'The three hundred stay at their places. The enemies jolt out of their sleep, run about, and cry out. The whole army is terrified and flees.'
      ],
      task: { hint: 'Wait for the horn and then answer in order.', cue: { rounds: [{ hint: "Wait for the horn. Then tap Gideon’s jar, and after that the groups on the left and on the right." }, { hint: 'Take care: An owl calls. That is no sign. Answer only to the horn.' }] } },
      questions: [
        { q: 'What is inside the jars of the men?', options: ['torches', 'bread', 'water'] },
        { q: 'Into how many groups does Gideon divide the three hundred men?', options: ['three', 'two', 'twelve'] }
      ]
    },
    {
      title: 'Ephraim and the Fords',
      ref: 'Judges 7:24 to 8:3',
      text: [
        'Gideon sends messengers to Ephraim, “Come down and take the fords of the Jordan, so that the enemies cannot cross!” A ford is a shallow place where one can walk through a river.',
        'The men of Ephraim come, take the fords, and catch two princes of the enemies, Oreb and Zeeb. Later, though, they come to Gideon angrily, “Why did you not call us when you went out against the enemies?” They quarrel fiercely with him.',
        'Gideon stays calm. “What have I done compared with you?” he says. “God has given the princes of the enemies into your hands. How could I do what you have done?”',
        'When Gideon speaks so kindly, their anger fades.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who comes angrily to Gideon?', options: ['the men of Ephraim', 'Barak', 'the enemies'] },
        { q: 'How does Gideon answer the men of Ephraim?', options: ['calmly and kindly', 'with loud words', 'not at all'] }
      ]
    },
    {
      title: 'God Shall Be Your Lord',
      ref: 'Judges 8:22–28, 33–35',
      text: [
        'After the victory the Israelites come to Gideon. “Be our ruler,” they say, “you and your son and your grandson. You have saved us from the hand of the enemies.”',
        'Gideon shakes his head. “I will not be your lord,” he says, “and my son shall not be your lord either. God shall be your Lord.”',
        'Gideon is a man with faults. He asks for the gold the enemies wore and has a priestly garment made from it. All Israel worships it, and it becomes a snare to Gideon and his house.',
        'The enemies never lift up their heads again, and the land is quiet for forty years, as long as Gideon lives. When he has died, the people forget God again and run after Baal. And yet God was with Gideon, as he had promised, “I will be with you.”'
      ],
      task: { hint: 'Find the matching cards. Remember where each one lies.', memory: { pairs: [{ text: 'The palm tree: Deborah sits here and gives judgment.' }, { text: 'The winepress: Gideon secretly threshes wheat here.' }, { text: 'The fleece: First only the fleece is wet, then only the ground.' }, { text: 'The altar: God is Peace.' }, { text: 'The jar: A torch is inside.' }] } },
      questions: [
        { q: 'What does Gideon answer when they want to make him ruler?', options: ['“God shall be your Lord.”', '“Yes, I will be your king.”', '“My son shall be it.”'] },
        { q: 'How long is the land quiet as long as Gideon lives?', options: ['forty years', 'seven years', 'twenty years'] }
      ]
    }
  ],
  exam: [
    { q: 'Under which tree does Deborah sit?', options: ['under a palm tree', 'under an oak', 'under a cedar'] },
    { q: 'Where does Gideon secretly thresh his wheat?', options: ['in a winepress', 'on the roof', 'by the river'] },
    { q: 'What does Gideon put on the threshing floor to get a sign?', options: ['a fleece', 'a cloak', 'a sack of flour'] },
    { q: 'How many men does Gideon keep with him?', options: ['three hundred', 'ten thousand', 'twenty-two thousand'] },
    { q: 'What is inside the jars of the men?', options: ['torches', 'bread', 'water'] },
    { q: 'What does Gideon answer when they want to make him ruler?', options: ['“God shall be your Lord.”', '“Yes, I will be your king.”', '“My son shall be it.”'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 22.10.2026): geschichte-NN-en-v4.mp3, one per stage in the order of the stages
gideonEn.stages!.forEach((s, i) => {
  s.audio = `audio/abenteuer/gideon/geschichte-${String(i + 1).padStart(2, '0')}-en-v4.mp3`
})
