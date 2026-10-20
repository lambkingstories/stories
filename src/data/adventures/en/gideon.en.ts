/**
 * English texts of the adventure "Gideon" (8 to 10 years): the same shape as `../gideon.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible and King James Version
 * (Deborah, Barak, Sisera, Gideon, Joash, Ophrah, Purah, Jezreel, Harod, Oreb and Zeeb, Jerubbaal); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Gideon/ENGLISCH/.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
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
      ref: 'Judges 4:1–16; 5:1–3, 31',
      text: [
        'When the judge Ehud has died, the Israelites forget God again. This time the people fall into the hand of Jabin, the king of the Canaanites, who rules in Hazor. His army commander Sisera has nine hundred iron chariots. For twenty years he oppresses the Israelites harshly, until at last they cry out to God.',
        'In those days Deborah is judge in Israel, a prophetess who passes on God’s word. She sits under a palm tree in the hill country of Ephraim. The Israelites come to her so that she may do justice among them.',
        'One day Deborah has Barak called. “God has commanded you to go up to Mount Tabor with ten thousand men,” she says. “He will bring Sisera and his chariots to the Kishon brook and give him into your hand.” “If you go with me, I will go,” answers Barak, “but if you will not go with me, I will not go.” “I will go with you,” says Deborah.',
        'When Sisera hears that Barak is on Mount Tabor, he gathers all his chariots. Then Deborah says, “Get up, this is the day! God goes out before you!” Barak comes down from the mountain with the ten thousand men. And God throws Sisera and his whole army into confusion. Sisera jumps down from his chariot and flees on foot.',
        'Then Deborah and Barak sing a song of thanks: “Praise God that Israel is free again!” And the land has rest for forty years.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Under which tree does Deborah sit?', options: ['under a palm tree', 'under an oak', 'under a cedar'] },
        { q: 'How many men is Barak to take up to Mount Tabor?', options: ['ten thousand', 'nine hundred', 'twenty'] },
        { q: 'What do Deborah and Barak sing at the end?', options: ['a song of thanks to God', 'a lullaby', 'a mocking song'] }
      ]
    },
    {
      title: 'The Midianites Come',
      ref: 'Judges 6:1–10',
      text: [
        'Forty years have passed since Deborah and Barak sang their song of thanks. Again the Israelites forget God. For seven years the Midianites are stronger than they are.',
        'Every year, when the grain in the fields is ripe, the Midianites and the Amalekites and the people from the east come up into the land. They bring their tents and their animals, and their camels are so many that no one can count them. Like a swarm of locusts they pour into the land and eat up everything that has grown, all the way down to Gaza. They leave nothing behind, not a sheep, not an ox, not a donkey.',
        'The Israelites hide in clefts of the rocks, in caves and in mountain strongholds. They have become poor and feel small before the Midianites. At last they cry out to God for help.',
        'God has heard their cry. He sends a prophet to them. The prophet says, “This is what God, the God of Israel, says: I led you out of Egypt, out of the house of slavery. I gave you this land. I said to you: I am your God. But you did not listen to me.”'
      ],
      task: { hint: 'Push the sacks into the niches of the cave.', cave: { rounds: [{ hint: 'Push the sacks into the glowing niches. You can only push, not pull.' }, { hint: 'Now three sacks, and a rock stands in the middle. Think before you push.' }] } },
      questions: [
        { q: 'How long are the Midianites stronger than Israel?', options: ['seven years', 'twenty years', 'forty years'] },
        { q: 'Where do the Israelites hide?', options: ['in caves and clefts of the rocks', 'in tents by the river', 'behind high city walls'] }
      ]
    },
    {
      title: 'Gideon in the Winepress',
      ref: 'Judges 6:11–18',
      text: [
        'In Ophrah, in the land of Manasseh, stands a great oak that belongs to a man named Joash. His son Gideon is threshing wheat there, in a winepress. That is a basin in the rock where grapes are usually pressed. No Midianite will see him here, and so he can bring the grain to safety.',
        'Then an angel of God sits down under the oak. “God is with you, you mighty warrior!” he says to Gideon. Gideon is astonished. “Sir,” he answers, “if God is with us, why has all this happened to us? Where are the wonders our fathers told us about? Now God has left us and handed us over to the Midianites.”',
        'But God turns to him. “Go in your strength and save Israel from the Midianites,” he says. “I am sending you!” “How can I do that?” asks Gideon. “My family is the least in Manasseh, and I am the smallest in my father’s house.” “I will be with you,” answers God, “and you will defeat the Midianites as if they were only one man.”',
        'Gideon listens and thinks. He wants to be quite sure that it really is God who is speaking to him.'
      ],
      task: { hint: 'Set the wind so that the chaff blows away.', winnow: { rounds: [{ hint: 'Set the wind. The light chaff should fly away, the heavy grains should stay.' }, { hint: 'Now a light gust blows, and the right wind is narrower. Take care of the grains.' }] } },
      questions: [
        { q: 'Where does Gideon thresh his wheat?', options: ['in a winepress', 'on the roof', 'by the river'] },
        { q: 'What does God say to Gideon?', options: ['“I will be with you.”', '“You must go alone.”', '“Go back to Egypt.”'] }
      ]
    },
    {
      title: 'Fire from the Rock',
      ref: 'Judges 6:17–24',
      text: [
        '“If you are kind to me,” Gideon asks the angel, “give me a sign that it is really you who is speaking with me. Do not leave until I come back and bring you an offering.” “I will stay until you come back,” answers the angel.',
        'Gideon goes and prepares a young goat. From a large amount of flour he bakes unleavened bread. He puts the meat in a basket and fills the broth into a pot, and so he brings everything to the oak. “Put the meat and the bread on that rock,” says the angel of God, “and pour out the broth.” Gideon does it.',
        'Then the angel touches the meat and the bread with the tip of his staff. Fire comes up out of the rock and consumes everything. When Gideon looks up again, the angel has vanished. Gideon is frightened. “Oh, my God,” he cries, “I have seen an angel of God face to face!”',
        'But God speaks to him, “Peace be with you! Do not be afraid, you will not die.” Then Gideon builds an altar there and calls it: God is Peace. It stands in Ophrah for a long time.'
      ],
      task: { hint: 'Lay the word with the letters.', word: { rounds: [{ hint: 'What does Gideon call the altar? God is …', word: 'PEACE', extra: ['T', 'L'] }, { hint: 'Where does Gideon lay the bread and the meat? On the …', word: 'ROCK', extra: ['A', 'M'] }] } },
      questions: [
        { q: 'What consumes the meat and the bread?', options: ['fire out of the rock', 'a strong storm', 'a hungry shepherd'] },
        { q: 'What does God say to Gideon after the angel has vanished?', options: ['“Peace be with you! Do not be afraid.”', '“Go home at once.”', '“Build a wall.”'] }
      ]
    },
    {
      title: 'The Altar of Baal',
      ref: 'Judges 6:25–32',
      text: [
        'On the same night God speaks to Gideon once more. “Tear down the altar of Baal that your father built,” he says, “and cut down the pole beside it. Then build an altar for me on top of this rock.” Baal is an idol whom many people worship in those days, although he is no god.',
        'Gideon takes ten of his servants and does what God told him. He is afraid of his family and of the people of the town. So he does it at night and not in the daytime.',
        'In the morning the people of the town see that the altar of Baal is broken down. On the new altar lies an offering. “Who did this?” they ask, and soon they know: it was Gideon, the son of Joash. They are so angry that they want to punish him. In front of Joash’s house they shout, “Bring out your son!”',
        'But Joash stands in front of his son. “Will you fight for Baal?” he asks. “If Baal is a god, let him fight for himself, because his altar has been broken down.” From that day on people also call Gideon Jerubbaal. That means: Let Baal fight against him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'At what time does Gideon tear down the altar of Baal?', options: ['at night', 'at noon', 'at harvest time'] },
        { q: 'Who stands in front of Gideon?', options: ['his father Joash', 'Barak', 'a prophet'] },
        { q: 'What is Gideon also called from that day on?', options: ['Jerubbaal', 'Sisera', 'Ehud'] }
      ]
    },
    {
      title: 'The Fleece on the Threshing Floor',
      ref: 'Judges 6:33–40',
      text: [
        'Again the Midianites and the Amalekites and the people from the east come up. They make their camp in the valley of Jezreel. Then God’s Spirit fills Gideon. He blows the trumpet, a curved horn, and calls his family, and they come to him. He also sends messengers to all of Manasseh and to Asher, Zebulun and Naphtali.',
        'But Gideon wants to know even more surely. “God,” he says, “you have said that you will save Israel by my hand. Then I will put a fleece of wool on the threshing floor. If in the morning there is dew only on the fleece and the ground around it is dry, then I will know that you are doing it.” The threshing floor is the firm open place where the grain is threshed.',
        'So it happens. When Gideon gets up early in the morning, the ground is dry. But the fleece is so wet that he can wring the dew out of it, a whole bowl full of water.',
        'But Gideon asks once more, “Do not be angry with me for asking once more. This time let the fleece stay dry and let there be dew on all the ground around it.” And God does it that night. The fleece is dry, and on all the ground there is dew. Now Gideon knows that he can rely on God.'
      ],
      task: { hint: 'Let the night go by and find the dew.', dew: { rounds: [{ hint: 'The first night: Draw the moon to the morning. Then dew lies on the fleece. Tap the drops.' }, { hint: 'The second night: This time the fleece is dry. Where does the dew lie now?' }] } },
      questions: [
        { q: 'What does Gideon put on the threshing floor?', options: ['a fleece of wool', 'a cloak', 'a sack of flour'] },
        { q: 'What does Gideon ask God for a second time?', options: ['that the fleece stays dry and the ground gets wet', 'that it rains', 'that the fleece disappears'] }
      ]
    },
    {
      title: 'Too Many Men',
      ref: 'Judges 7:1–3',
      text: [
        'Early in the morning Gideon sets out with all the men who have come to him. They camp by the spring of Harod. Down in the valley, to the north of them, lies the camp of the Midianites at the foot of the hill of Moreh.',
        'Then God says to Gideon, “You have too many men with you. If I give the Midianites into your hands, Israel could boast and say: I saved myself.” So Gideon is to announce to everyone, “Whoever is afraid and trembling may turn back and go home!”',
        'And many set out for home. Twenty-two thousand men turn back. Only ten thousand stay with Gideon. They watch the others go, and the camp becomes quiet. But God says to Gideon, “There are still too many.”'
      ],
      task: { hint: 'Set the switch so that every man goes his way.', swit: { rounds: [{ hint: 'The men come to the fork. Whoever shows a house wants to go home: set the switch to the right. Whoever shows a horn stays: set it to the left.' }, { hint: 'Now more men come, and the bubble soon goes away. Tap the man and it is back.' }] } },
      questions: [
        { q: 'Who may go home?', options: ['whoever is afraid', 'whoever is tired', 'whoever has the oldest tent'] },
        { q: 'How many men stay with Gideon?', options: ['ten thousand', 'twenty-two thousand', 'nine hundred'] }
      ]
    },
    {
      title: 'At the Water',
      ref: 'Judges 7:4–8',
      text: [
        '“Lead the men down to the water,” God says to Gideon. “There I will test them for you. Whoever is to go with you, I will tell you, and whoever is not to go with you stays here.” Gideon leads the men down to the brook.',
        'At the bank God says, “Put those who kneel down to drink on one side, and those who bring the water to their mouths with their hands on the other.” Most of the men kneel down at the brook and drink like that. Only three hundred men scoop up the water with their hands and drink it from their hands.',
        '“With these three hundred I will save you and give the Midianites into your hands,” God says to Gideon. “Let all the others go home.”',
        'The three hundred take supplies and their trumpets with them. All the others Gideon sends home, each to his tent. Only the three hundred he keeps with him. Down in the valley lies the huge camp of the Midianites.'
      ],
      task: { hint: 'Find the six men who scoop the water to their mouths with their hands. Some of them are hiding!', find: { labels: ['Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand', 'Man at the stream scooping the water to his mouth with his hand'], doneText: 'You found all six men who scoop the water to their mouths with their hands!' } },
      questions: [
        { q: 'How many men does Gideon keep with him?', options: ['three hundred', 'ten thousand', 'twenty-two thousand'] },
        { q: 'What do most of the men do at the brook?', options: ['They kneel down and drink.', 'They wash their feet.', 'They fill their jars.'] }
      ]
    },
    {
      title: 'The Dream in the Camp',
      ref: 'Judges 7:9–15',
      text: [
        'On the same night God says to Gideon, “Get up and go down to the camp, for I have given it into your hands. If you are afraid, take your servant Purah with you and listen to what the Midianites are saying. Then your hands will be strong.”',
        'Gideon and Purah go down the slope as far as the guard posts. Down in the valley lie the Midianites and the Amalekites and all the people from the east like a swarm of locusts. Their camels are as many as the sand by the sea.',
        'There Gideon hears one man telling another his dream, “I dreamed that a round loaf of barley bread rolled into our camp. It hit a tent, and the tent fell over and lay on the ground.” “That is nothing other than the sword of Gideon, the son of Joash, the Israelite,” answers the other. “God has given the Midianites and the whole army into his hand.”',
        'When Gideon hears this, he bows down and thanks God. Then he goes back to the camp of the Israelites and calls out, “Get up, God has given the camp of the Midianites into your hands!”'
      ],
      task: { hint: 'Lead the two quietly down the slope from shadow to shadow.', sneak: { rounds: [{ hint: 'Lead Gideon and Purah from rock to rock. Wait in the shadow when a cone of light comes.' }, { hint: 'Now there are three watchers, and their light sways unevenly. Be patient in the shadow.' }] } },
      questions: [
        { q: 'Whom does Gideon take with him to the camp of the Midianites?', options: ['his servant Purah', 'his father Joash', 'Barak'] },
        { q: 'What does the Midianite dream about?', options: ['a loaf of barley bread', 'a sheep', 'a bridge'] }
      ]
    },
    {
      title: 'Jars, Torches and Trumpets',
      ref: 'Judges 7:16–22',
      text: [
        'Gideon divides the three hundred men into three groups of one hundred each. To each man he gives a trumpet in one hand and an empty clay jar in the other, and in every jar there is a torch. “Watch me and do the same,” he says. “When I come to the edge of the camp, do what I do. And when I blow the trumpet, then you blow yours all around the whole camp and shout: For God and for Gideon!”',
        'In the middle of the night Gideon and his hundred men come to the edge of the camp. The Midianites have just posted their new guards. Then they blow the trumpets and smash the jars in their hands, and the two other groups do the same. All around the whole camp the torches blaze up in the darkness. The trumpets sound everywhere: “For God and for Gideon!”',
        'The three hundred stay where they are, each at his place around the camp. The Midianites jolt out of their sleep, run about and cry out. For God throws the whole camp into disorder. The army flees.'
      ],
      task: { hint: 'Wait for the horn and then answer in order.', cue: { rounds: [{ hint: "Wait for the horn. Then tap Gideon's jar first, and after that the group on the left and the group on the right." }, { hint: 'Take care: An owl calls, the wind rustles. Those are no signs. Answer only to the horn.' }] } },
      questions: [
        { q: 'What is inside the clay jars of the men?', options: ['torches', 'bread', 'water'] },
        { q: 'What do the three hundred do while the army flees?', options: ['They stay at their places around the camp.', 'They run into the camp.', 'They sleep in their tents.'] }
      ]
    },
    {
      title: 'Ephraim and the Fords',
      ref: 'Judges 7:23–8:3; 8:4',
      text: [
        'After that night the Israelites call together the men of Naphtali, Asher and all of Manasseh, and they chase the fleeing Midianites. Gideon also sends messengers to the hill country of Ephraim: “Come down and take the fords of the Jordan before the Midianites reach them!” A ford is a shallow place where one can walk through a river.',
        'The men of Ephraim hurry down and take the fords. They also defeat two princes of the Midianites, Oreb and Zeeb. But when everything is over, they come to Gideon angrily. “Why did you not call us when you went to fight the Midianites?” they ask. They quarrel fiercely with him.',
        'Gideon stays calm. “What have I done compared with you?” he says. “Is not the gleaning of Ephraim better than the whole grape harvest of my family? God has given the princes of the Midianites into your hands. How could I do what you have done?” The gleaning is what is left hanging on the vines after the harvest. When Gideon speaks like this, their anger fades.',
        'Then Gideon crosses the Jordan with his three hundred men. They are tired, but they keep going until the Midianites are completely defeated.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who comes angrily to Gideon?', options: ['the men of Ephraim', 'Barak', 'the Midianites'] },
        { q: 'How does Gideon answer the men of Ephraim?', options: ['calmly and kindly', 'with loud words', 'not at all'] },
        { q: 'What does Gideon call better than the whole grape harvest of his family?', options: ['the gleaning of Ephraim', 'the ears of grain from the field', 'the water from the brook'] }
      ]
    },
    {
      title: 'God Shall Be Your Lord',
      ref: 'Judges 8:22–28',
      text: [
        'After the victory the Israelites come to Gideon. “Be our ruler,” they say, “you and your son and your grandson. For you have saved us from the hand of the Midianites.”',
        'But Gideon answers, “I will not be your lord, and my son shall not be your lord either. God shall be your Lord.” Only one thing he asks of them: each man is to give him the golden earrings he has taken from the enemy. The men spread out a cloak and throw their earrings on it. A great deal of gold comes together.',
        'Gideon makes a priestly garment out of it and puts it in his town of Ophrah. But later the people worship this garment, and that becomes a mistake for Gideon and his house.',
        'The Midianites never lift up their heads again. The land has peace for forty years, as long as Gideon lives. And the altar in Ophrah that Gideon once built keeps its name: God is Peace.'
      ],
      task: { hint: 'Find the matching cards. Remember where each one lies.', memory: { pairs: [{ text: 'The palm tree: Deborah sits here and gives judgment.' }, { text: 'The winepress: Gideon secretly threshes wheat here.' }, { text: 'The fleece: Dew twice, a sign twice.' }, { text: 'The altar: God is Peace.' }, { text: 'The jar: A torch is inside.' }, { text: 'The horn: It calls the three hundred.' }] } },
      questions: [
        { q: 'What does Gideon answer when they want to make him ruler?', options: ['“God shall be your Lord.”', '“Yes, I will be your king.”', '“My son shall be it.”'] },
        { q: 'How long does the land have peace as long as Gideon lives?', options: ['forty years', 'seven years', 'twenty years'] }
      ]
    }
  ],
  exam: [
    { q: 'Who is judge in Israel when Barak goes up to Mount Tabor?', options: ['Deborah', 'Purah', 'Joash'] },
    { q: 'Where does Gideon secretly thresh his wheat?', options: ['in a winepress', 'on the roof', 'by the river'] },
    { q: 'What does Gideon put on the threshing floor to get a sign?', options: ['a fleece of wool', 'a cloak', 'a sack of flour'] },
    { q: 'How many men does Gideon keep with him?', options: ['three hundred', 'ten thousand', 'twenty-two thousand'] },
    { q: 'What is inside the jars of the men?', options: ['torches', 'bread', 'water'] },
    { q: 'What does Gideon answer when they want to make him ruler?', options: ['“God shall be your Lord.”', '“Yes, I will be your king.”', '“My son shall be it.”'] }
  ]
}
