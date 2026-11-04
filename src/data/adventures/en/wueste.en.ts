/**
 * English texts of the adventure "The People in the Desert" (8 to 10 years): the same shape as `../wueste.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names follow the World English Bible (Jethro, Miriam, Zipporah, Joshua, Caleb);
 * the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Wuestenvolk/ENGLISCH/Wueste_English_Texte.md
 * Generated from the readable file by D:/Claude/Abenteuer-Wuestenvolk/tools/bauen_wueste.py. Gate against AI patterns passed 1.11.2026 and read through against the World English Bible; a native reading is still open.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'
import { KRUG_EN, GENUG_EN, WACHTELN_EN, STAB_EN, SCHLANGE_EN, ESELIN_EN, EINSETZEN_EN } from './wuesteGames2.en'

export const wuesteEn: TextOverlay<Journey> = {
  title: 'The People in the Desert',
  subtitle: 'Forty Years on the Road',
  gift: { title: 'The Giant Cluster of Grapes' },
  stages: [
    {
      title: 'Water from the Rock',
      ref: 'Exodus 17:1–7',
      text: [
        'The people move on through the desert and camp at Rephidim. There is no water to drink there. The children and the animals are thirsty.',
        'The people come to Moses and complain, “Give us water!” They ask why he led them out of Egypt. Moses cries to God, “What am I to do with this people?”',
        'Then God says, “Go ahead of the people, and take some elders and your staff. I will stand there on the rock before you. Strike the rock, and water will come out.”',
        'Moses does it in front of the elders. Water runs out of the rock, and the people can drink. The place is called Massah and Meribah, because the people quarreled there and asked, “Is God really with us?”'
      ],
      task: { hint: KRUG_EN.rounds?.[0]?.hint, jugs: KRUG_EN },
      questions: [
        { q: 'What is missing at Rephidim?', options: ['water', 'bread', 'wood'] },
        { q: 'Whom does Moses take to the rock?', options: ['some elders', 'Joshua and Jethro', 'his sons'] }
      ]
    },
    {
      title: 'The Arms of Moses',
      ref: 'Exodus 17:8–16',
      text: [
        'At Rephidim another people, the Amalekites, comes and fights against Israel. Moses says to Joshua, “Choose men and go out to meet them. Tomorrow I will stand on top of the hill with the staff of God in my hand.”',
        'Joshua does what Moses said. Moses, Aaron, and Hur climb the hill. As long as Moses holds up his hands, Israel is winning. When he lets them down, Amalek is winning.',
        'But the arms of Moses grow heavy. So Aaron and Hur put a stone there, and Moses sits on it. Then the two hold up his hands, one on the left and one on the right. So his hands stay up until the sun goes down.',
        'By evening Joshua has won. Moses builds an altar and calls it, “God is my banner.”'
      ],
      task: {
        hint: 'Keep the hands of Moses up until the sun goes down.',
        arms: {
          moses: { label: 'Moses on his stone' },
          helpers: [{ label: 'Aaron' }, { label: 'Hur' }],
          rounds: [
            { hint: 'Hold your finger on Moses. As long as his hands are up, it helps the people. Hold until the sun goes down.' },
            { hint: 'Now Aaron and Hur help. Tap both of them in turn, so that the hands stay up.' }
          ]
        }
      },
      questions: [
        { q: 'Who holds up the arms of Moses?', options: ['Aaron and Hur', 'Joshua and Caleb', 'two elders'] },
        { q: 'What does Moses sit on?', options: ['a stone', 'a tree stump', 'a box'] }
      ]
    },
    {
      title: 'Jethro and the Judges',
      ref: 'Exodus 18',
      text: [
        'Jethro, the father-in-law of Moses, hears what God has done for the people. He comes into the desert to the mountain of God and brings Zipporah and her two sons. Moses goes out to meet him, bows down, and kisses him.',
        'The next morning Moses sits and settles quarrels. The people stand around him from morning until evening. Jethro sees it and asks, “Why do you sit alone, and all the people stand around you the whole day?”',
        '“What you are doing is not good,” says Jethro. “You will grow tired, and the people too. Choose honest men who respect God. They shall judge the small cases, and only the hard ones they bring to you.”',
        'Moses listens to his father-in-law. He appoints men over thousands, over hundreds, over fifties, and over tens. Then Jethro goes home to his own land.'
      ],
      task: {
        hint: 'Share out the cases: the men judge the small ones, the great ones belong to Moses.',
        judges: {
          seats: [{ label: 'First judge' }, { label: 'Second judge' }, { label: 'Third judge' }, { label: 'Moses' }],
          cases: [
            { label: 'Two men quarrel about a jug' },
            { label: 'Two neighbors quarrel about a lamb' },
            { label: 'Two women quarrel about a basket of figs' },
            { label: 'Two boys quarrel about a pair of sandals' },
            { label: 'Two big families quarrel about a well' },
            { label: 'Two groups quarrel about a wide pasture' }
          ],
          rounds: [
            { hint: 'Tap a case and then the one who should decide it. The men judge the small ones, the great ones belong to Moses.' },
            { hint: 'Once more, with more cases. Small cases to the men, great ones to Moses.' }
          ]
        }
      },
      questions: [
        { q: 'Who visits Moses in the desert?', options: ['Jethro', 'Joshua', 'Balak'] },
        { q: 'What does Jethro advise Moses?', options: ['Others shall judge the small cases.', 'Moses should only judge in the morning.', 'The people should move on.'] }
      ]
    },
    {
      title: 'The Tent of God',
      ref: 'Exodus 35:4–36:7; 40:34',
      text: [
        'God wants to live among his people. A tent is to be built for him. Moses calls everyone together, “Whoever gives gladly, let them bring gold, silver and copper, yarn and linen, wood and oil.”',
        'Then men and women come and bring bracelets, rings, and earrings of gold. The women spin yarn and goat hair. Bezalel and Oholiab, whom God has made wise and skillful, work together with all the skilled men and show the others how.',
        'Every morning new gifts arrive. Soon the craftsmen say to Moses, “The people are bringing more than we need!” Moses has it called through the camp, “Nobody shall bring anything more!” So the people stop giving.',
        'That is how the tent is made, from curtains and boards. When it is finished, the cloud covers the tent.'
      ],
      task: { hint: GENUG_EN.rounds?.[0]?.hint, enough: GENUG_EN },
      questions: [
        { q: 'Who brings gifts for the tent?', options: ['men and women', 'only the priests', 'only the elders'] },
        { q: 'What does Moses have called through the camp?', options: ['Nobody shall bring anything more.', 'Everybody shall bring even more.', 'Everybody shall go home.'] }
      ]
    },
    {
      title: 'Leaving Sinai',
      ref: 'Numbers 9:15–23; 10:1–11, 33–36',
      text: [
        'When the cloud lies over the tent, the people stay in the camp. When it lifts, the people set out. Sometimes the cloud stays only one night, sometimes many days. At night it glows like fire.',
        'God says to Moses, “Make two trumpets of silver.” When the priests blow both trumpets, the whole people gathers. When only one blows, the leaders come. A different signal calls: Set out!',
        'In the second year the cloud lifts. The people leave Mount Sinai, tribe by tribe. The ark of the covenant goes ahead and shows the way.',
        'When the ark sets out, Moses calls, “God, rise up!” And when it rests, he calls, “Come back, God, to the many thousands of Israel!”'
      ],
      task: {
        hint: 'Listen to the silver trumpets and tap the picture that fits the signal.',
        signal: {
          priests: { label: 'Two priests with silver trumpets' },
          choices: [{ label: 'The whole people gathers' }, { label: 'Only the leaders come' }, { label: 'The camp breaks up' }],
          rounds: [
            { hint: 'Listen to the silver trumpets and tap the picture that fits the signal.' },
            { hint: 'Now three signals come one after the other. Tap the pictures in the same order.' }
          ]
        }
      },
      questions: [
        { q: 'How do the people know it is time to set out?', options: ['The cloud lifts.', 'The sun rises.', 'A shepherd calls.'] },
        { q: 'What are the trumpets made of?', options: ['silver', 'gold', 'wood'] }
      ]
    },
    {
      title: 'Complaining and Quail',
      ref: 'Numbers 11',
      text: [
        'Some of the people want nothing but meat. Soon everyone weeps in front of their tents, “Who will give us meat to eat? In Egypt we had fish, melons, leeks, and onions! Here we see nothing but manna.”',
        'Moses hears the weeping at every tent, and it is too much for him. He says to God, “I cannot carry this people alone.” Then God says, “Gather seventy elders and place them in front of the tent. They shall carry the load with you.”',
        'The elders come, and God’s Spirit rests on them. It rests also on two men in the camp, Eldad and Medad. Joshua wants to stop them. But Moses says, “If only all the people had God’s Spirit!”',
        'Then a wind comes from God and brings quail from the sea. They fall all around the camp, and the people gather them for a day, a night, and another day. God has heard their weeping. But the people have forgotten that God is right there among them.'
      ],
      task: { hint: WACHTELN_EN.rounds?.[0]?.hint, quails: WACHTELN_EN },
      questions: [
        { q: 'What do the people want to eat?', options: ['meat', 'bread', 'cake'] },
        { q: 'How many elders does Moses gather?', options: ['seventy', 'seven', 'twelve'] }
      ]
    },
    {
      title: 'Twelve Spies',
      ref: 'Numbers 13',
      text: [
        'In the desert of Paran, near Kadesh, the people camp. God says to Moses, “Send men to explore the land, one from each tribe.” Joshua and Caleb are among the twelve men.',
        'Moses tells them, “See what the land is like. Is it good? Do the people live in tents or in cities with walls? And bring back fruit!” It is the season of the first ripe grapes.',
        'For forty days the men are on their way. At the brook of Eshcol they cut off a vine with one cluster of grapes. Two men carry it on a pole. They also take pomegranates and figs.',
        'Then they come back to Moses and Aaron and show the people the fruit. “We were in the land,” they say. “Milk and honey flow there!” But they also tell of strong people and mighty cities.'
      ],
      task: {
        hint: 'Carry the giant cluster of grapes on the pole and keep it level.',
        grapes: {
          men: [{ label: 'The scout at the back' }, { label: 'The scout in front' }],
          pole: { label: 'The pole with the giant cluster of grapes' },
          rounds: [
            { hint: 'Two men carry the cluster on a pole. Keep the pole level: lift the end that tips down.' },
            { hint: 'Now the way goes over hills. Keep the pole level.' }
          ]
        }
      },
      questions: [
        { q: 'How many men does Moses send out?', options: ['twelve', 'ten', 'seven'] },
        { q: 'What do two men carry on a pole?', options: ['a cluster of grapes', 'a jar', 'a lamb'] }
      ]
    },
    {
      title: 'Joshua and Caleb',
      ref: 'Numbers 14',
      text: [
        'Ten of the spies say, “The people there are stronger than we are.” Then the people are terrified. All weep the whole night, and some cry, “If only we had stayed in Egypt! Let us turn back!”',
        'Joshua and Caleb tear their clothes. “The land is very good!” they cry. “If God is with us, he will bring us in. Do not be afraid! God is with us.” But the people do not listen to them.',
        'Moses asks God to forgive the people. And God says, “I forgive, as you have asked.” But these people will not see the land, because they did not trust God. For forty years the people shall be on the road in the desert, one year for each day of exploring.',
        'Their children, though, God will bring into the land. And Caleb and Joshua may go in too, because they trusted him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who says, “The land is very good”?', options: ['Joshua and Caleb', 'Moses and Aaron', 'Eldad and Medad'] },
        { q: 'How long shall the people stay in the desert?', options: ['forty years', 'ten years', 'twenty years'] },
        { q: 'Who may enter the land?', options: ['the children, Caleb and Joshua', 'only the elders', 'only the priests'] }
      ]
    },
    {
      title: 'Aaron’s Staff Blooms',
      ref: 'Numbers 17',
      text: [
        'Again the people grumble against Moses and Aaron. They ask who may stand closest to God. God wants to show whom he has chosen as priest for his tent.',
        'He says to Moses, “Take a staff from each tribe, twelve staffs. Write the name of the leader on each, and on the staff of Levi write the name Aaron.” Moses lays the staffs down overnight in the tent before God.',
        'In the morning Moses goes in. The other staffs are unchanged. But Aaron’s staff has put out leaves and blossoms, and almonds hang on it!',
        'Moses carries all the staffs out, and the people see it. Each leader takes back his staff. Aaron’s staff goes back into the tent, as a sign for everyone. The grumbling shall stop.'
      ],
      task: { hint: STAB_EN.rounds?.[0]?.hint, staffs: STAB_EN },
      questions: [
        { q: 'How many staffs does Moses lay in the tent?', options: ['twelve', 'seven', 'forty'] },
        { q: 'What grows on Aaron’s staff?', options: ['blossoms and almonds', 'apples', 'grapes'] }
      ]
    },
    {
      title: 'Kadesh and Mount Hor',
      ref: 'Numbers 20:1–13, 22–29',
      text: [
        'Nearly forty years have passed. In Kadesh, where the people camp, Miriam, the sister of Moses, dies and is buried. Again there is no water, and the people quarrel with Moses and Aaron, “Why did you lead us into this desert?”',
        'God says to Moses, “Take the staff, gather the people, and speak to the rock before their eyes. It will give water.”',
        'Moses calls to the people, “Listen, you rebels! Shall we bring you water out of this rock?” Then he strikes the rock twice with the staff. Much water pours out, and people and animals drink. But God says to Moses and Aaron, “You did not trust me, and you did not honor me before the people. Therefore you will not lead this people into the land.”',
        'Later the people come to Mount Hor. Moses climbs up with Aaron and his son Eleazar. He takes the priest’s robe off Aaron and puts it on Eleazar. Up there Aaron dies. Moses and Eleazar climb down alone.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Moses do at the rock differently from what God said?', options: ['He strikes it with the staff.', 'He sends the people away.', 'He drinks first.'] },
        { q: 'Who receives the priest’s robe on Mount Hor?', options: ['Eleazar', 'Joshua', 'Hur'] }
      ]
    },
    {
      title: 'The Bronze Snake',
      ref: 'Numbers 21:4–9',
      text: [
        'From Mount Hor the people go around the land of Edom. The way is long, and the people lose heart. They say to God and to Moses, “Why did you lead us out of Egypt? There is no bread and no water here, and we are tired of the manna.”',
        'Then God lets snakes come into the camp, and some people are bitten. They come to Moses, “We spoke wrongly. Ask God to take the snakes away!” Moses prays for the people.',
        'God says to him, “Make a snake of bronze and set it up on a pole as a sign. Whoever is bitten and looks at it shall live.”',
        'Moses makes the snake of bronze and sets it up as a sign. A man who has been bitten looks up at the pole. He stays alive.'
      ],
      task: { hint: SCHLANGE_EN.rounds?.[0]?.hint, serpent: SCHLANGE_EN },
      questions: [
        { q: 'What does Moses make at God’s word?', options: ['a snake of bronze', 'a tent of skins', 'a well'] },
        { q: 'What should a person do who has been bitten?', options: ['look at the snake', 'run into the tent', 'drink a lot of water'] }
      ]
    },
    {
      title: 'Balaam and the Donkey',
      ref: 'Numbers 22:1–35; 23:7–9; 24:5',
      text: [
        'Balak, the king of Moab, is afraid of the great people of Israel. He sends messengers to Balaam, “Come and curse this people!” But God says to Balaam, “Do not go with them! This people is blessed.”',
        'When Balak sends greater messengers, God says, “Go with them, but say only what I tell you.” Balaam saddles his donkey and rides off. But an angel of God stands in his way. Balaam does not see him, but the donkey does. She turns aside, once, again, and a third time, and each time Balaam strikes her.',
        'Then God opens the donkey’s mouth, “What have I done to you, that you strike me?” Now God opens Balaam’s eyes, and he sees the angel and bows down.',
        'Balaam goes on to Balak. But he cannot curse the people. He blesses them, “How fair are your tents, Jacob, and your dwellings, Israel!”'
      ],
      task: { hint: ESELIN_EN.steps?.[0]?.hint, donkey: ESELIN_EN },
      questions: [
        { q: 'Who wants Balaam to curse the people?', options: ['Balak', 'Jethro', 'Joshua'] },
        { q: 'Who sees the angel first?', options: ['the donkey', 'Balaam', 'Balak'] },
        { q: 'What does Balaam speak about Israel at the end?', options: ['a blessing', 'a curse', 'a riddle'] }
      ]
    },
    {
      title: 'Hear, O Israel',
      ref: 'Deuteronomy 6:4–9; 8:2–4',
      text: [
        'For forty years the people have been on their way. They stand at the edge of the land, and Moses has grown old. He calls the people together and reminds them of the long road.',
        'Moses says, “Hear, Israel! God is our God, he alone. You shall love God with all your heart, with all your soul, and with all your strength.”',
        '“Tell these words to your children,” says Moses, “at home and on the road, when you lie down and when you get up. Write them on the doorposts of your houses.”',
        '“Remember also how God led you for forty years through the desert,” says Moses. “He gave you manna, which you did not know. Your clothes did not wear out, and your feet did not swell.”'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['God is our God, he ', '.'], words: ['alone', 'never', 'today'] },
            { hint: 'Now two words are missing.', parts: ['You shall love God with all your heart, with all your ', ' and with all your ', '.'], words: ['soul', 'strength', 'house', 'hand'] }
          ]
        }
      },
      questions: [
        { q: 'How long were the people in the desert?', options: ['forty years', 'ten years', 'two years'] },
        { q: 'What did not wear out in the forty years?', options: ['their clothes', 'their tents', 'their jars'] }
      ]
    },
    {
      title: 'Be Brave!',
      ref: 'Numbers 27:12–23; Deuteronomy 31:1–8',
      text: [
        'God says to Moses, “Climb the mountains and look at the land I give to Israel. You yourself will not go in.” Then Moses asks, “God, set a man over the people, so they are not like sheep without a shepherd.”',
        'God answers, “Take Joshua, the son of Nun. Lay your hands on him and place him before the priest Eleazar and before all the people.” Moses does so.',
        'Then Moses speaks to the people, “I am a hundred and twenty years old today. God himself goes ahead of you.” And before everyone’s eyes he says to Joshua, “Be brave and do not be afraid! You will bring this people into the land.”',
        '“God himself goes ahead of you and is with you,” says Moses. “He will not leave you alone. Do not be afraid.”'
      ],
      task: { hint: EINSETZEN_EN.rounds?.[0]?.hint, commission: EINSETZEN_EN },
      questions: [
        { q: 'Who becomes the leader of the people after Moses?', options: ['Joshua', 'Caleb', 'Eleazar'] },
        { q: 'How old is Moses in this story?', options: ['a hundred and twenty', 'eighty', 'forty'] }
      ]
    },
    {
      title: 'On Mount Nebo',
      ref: 'Deuteronomy 34',
      text: [
        'Moses climbs from the plain of Moab up Mount Nebo, to the top of the mountain range, opposite Jericho. There God shows him the whole land: far to the north and far to the south, to the sea. Down in the plain lies Jericho, the city of palms.',
        'God says to him, “This is the land I promised to Abraham, Isaac, and Jacob. You have seen it with your eyes. But you shall not cross over.”',
        'There Moses dies. He is a hundred and twenty years old. His eyes have not grown dim, and his strength has not left him. Moses is buried in a valley. To this day nobody knows where his grave is.',
        'The people weep for Moses thirty days. Then they listen to Joshua, on whom Moses laid his hands. In Israel there was never again a prophet like Moses, with whom God spoke face to face.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Which mountain does Moses climb?', options: ['Nebo', 'Sinai', 'Hor'] },
        { q: 'What does God show him there?', options: ['the land he promised', 'the sea of Egypt', 'the mountains of Midian'] },
        { q: 'Who leads the people after Moses?', options: ['Joshua', 'Aaron', 'Caleb'] }
      ]
    }
  ],
  exam: [
    { q: 'How do the people get water at Rephidim?', options: ['Moses strikes the rock', 'Moses digs a well', 'The rain falls'] },
    { q: 'What advice does Jethro give Moses?', options: ['Others shall judge the small cases.', 'Moses should leave the camp.', 'The people should be silent.'] },
    { q: 'What do the spies carry on a pole?', options: ['a cluster of grapes', 'a jar', 'a lamb'] },
    { q: 'Who tells the people, “The land is very good”?', options: ['Joshua and Caleb', 'Miriam and Aaron', 'Balak and Balaam'] },
    { q: 'Who sees the angel on the road first?', options: ['the donkey', 'Balaam', 'Balak'] },
    { q: 'From which mountain does Moses see the land?', options: ['Nebo', 'Sinai', 'Hor'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 1.11.2026): geschichte-NN-en-v1.mp3, one per stage in the order of the stages; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
wuesteEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/wueste/geschichte-${String(i + 1).padStart(2, '0')}-en-${i + 1 === 4 || i + 1 === 12 ? 'v2' : 'v1'}.mp3`
})
