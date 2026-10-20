/**
 * English texts of the adventure "Joshua" (8 to 10 years): the same shape as `../josua.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Joshua, Rahab, Jericho, Shittim, Jordan, Gilgal, Shechem); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Josua/ENGLISCH/.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const josuaEn: TextOverlay<Journey> = {
  title: 'Joshua',
  subtitle: 'Courage for the New Land',
  gift: { title: 'The Trumpets of Jericho' },
  stages: [
    {
      title: 'A New Leader',
      ref: 'Joshua 1:1–18',
      text: [
        'For forty years Moses has led the people of Israel, and now he has died. The Israelites are camped at Shittim, a wide plain east of the Jordan, and only one river still lies between them and the land God has promised them. The new leader is named Joshua; he served Moses for a long time.',
        'God speaks to him: “Moses, my servant, is dead. Now get ready, you and all this people, and cross the Jordan into the land I am giving you. Every place where you set your feet I will give to you. As long as you live, no one will be able to stand against you. As I was with Moses, so I will be with you; I will not fail you or leave you.”',
        'And then God says it once more: “Be strong and courageous! Keep everything Moses commanded you, and never let the book of the law leave your mouth. Think about it day and night, and what you do will succeed. Do not be afraid and do not lose heart, for God is with you wherever you go.”',
        'Joshua calls the officers of the people. “Go through the camp,” he says, “and tell everyone: Get your food ready, for in three days you will cross the Jordan.” The men answer, “Everything you command us we will do, and wherever you send us we will go. May God be with you as he was with Moses!”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who leads the people after Moses has died?', options: ['Joshua', 'Caleb', 'Aaron'] },
        { q: 'What should Joshua be, according to God’s word?', options: ['strong and courageous', 'quick and quiet', 'rich and famous'] }
      ]
    },
    {
      title: 'Two Spies',
      ref: 'Joshua 2:1–7',
      text: [
        'From Shittim, Joshua secretly sends out two men. “Look over the land,” he says, “especially the city of Jericho.” The two set off. Jericho is a city with a strong wall, and they come to the house of a woman named Rahab, which stands right at the city wall. They stay there for the night.',
        'But someone has seen them. The king of Jericho is told, “Tonight men of Israel have come to spy out the land.” At once the king sends messengers to Rahab. “Bring out the men who came to your house!”',
        'Rahab has already hidden them. On her flat roof, stalks of flax lie spread out to dry, and under them she has hidden the men. “Yes, men came to me,” she tells the messengers, “but I do not know where they were from. When it grew dark and the city gate was about to be shut, they went away. Hurry after them, and you will catch them!”',
        'The king’s messengers set off toward the Jordan, to the crossing places. As soon as they have left, the gate is shut behind them.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Joshua send the two men?', options: ['to Jericho', 'to Hebron', 'to Egypt'] },
        { q: 'Where does Rahab hide the men?', options: ['on the roof under flax', 'in the cellar under sacks', 'in a well'] }
      ]
    },
    {
      title: 'The Red Cord',
      ref: 'Joshua 2:8–24',
      text: [
        'In the evening, before the men lie down to sleep, Rahab climbs up to them on the roof. “I know that God has given you this land,” she says. “Everyone here is afraid of you. We have heard how God dried up the water before you when you came out of Egypt. Your God is God in heaven above and on earth below.” Then she asks, “Swear to me by God that you will be kind to my family too, to my father and my mother, my brothers and my sisters, and save our lives. And give me a sure sign.”',
        '“Our life for yours,” the men promise, “if you do not tell what we are doing here. When God gives us the land, we will treat you kindly and faithfully.”',
        'Rahab’s house is part of the city wall, so she lets the two men down through the window on a rope. “Go to the hills and hide for three days,” she says, “until the pursuers have come back. Then go on your way.” The men explain the sign: “Tie this red cord in the window you let us down through, and gather your whole family into your house. Whoever stays in your house will be safe.” “So be it,” says Rahab, and she ties the red cord in the window.',
        'For three days the men stay in the hills, and the pursuers do not find them. Then they return to Joshua: “God has given us the whole land. The people there are losing heart because of us.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Rahab tie in her window as a sign?', options: ['a red cord', 'a white cloth', 'a green branch'] },
        { q: 'How long should the men hide in the hills?', options: ['three days', 'seven days', 'one night'] }
      ]
    },
    {
      title: 'The Jordan',
      ref: 'Joshua 3:1–17',
      text: [
        'Early in the morning Joshua sets out from Shittim with all the people, and they camp by the Jordan. Three days later the officers go through the camp and call out, “When you see the priests carrying the ark of the covenant, set out and follow it! But keep a wide distance of about two thousand cubits, for you have never gone this way before.” The ark is the golden chest that has already gone with the people through the desert. Joshua says to the people, “Get ready, for tomorrow God will do wonders among you.”',
        'At this time of harvest the Jordan is full to overflowing. Joshua says to the priests, “Take up the ark and go ahead of the people.” And to the people he says, “This is how you will know that God is among you: when the feet of the priests stand in the water, the water from upstream will stand still like a wall.”',
        'The priests carry the ark to the bank and dip their feet into the water. And then it happens: the water coming from upstream stops far away near the city of Adam and piles up, the water below flows away to the Salt Sea until the riverbed is empty. The people cross opposite Jericho. The priests stand with the ark in the middle of the Jordan on dry ground until all the people have passed through.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who carries the ark of the covenant?', options: ['the priests', 'the spies', 'the children'] },
        { q: 'What happens to the water when the priests dip their feet in?', options: ['It stands still.', 'It turns warm.', 'It turns to ice.'] }
      ]
    },
    {
      title: 'Twelve Stones',
      ref: 'Joshua 4:1–24',
      text: [
        'When all the people have crossed, God says to Joshua, “Choose twelve men, one from each tribe. They are to take twelve stones out of the Jordan from the place where the priests stood, and bring them to where you will camp tonight.” Joshua calls the twelve men. “Go into the river in front of the ark, and each of you lift one stone onto your shoulder, one for each tribe of Israel.”',
        '“The stones will be a sign among you,” he says. “When your children ask you one day, What do these stones mean?, then answer: The water of the Jordan stopped flowing when the ark of the covenant was carried through. That is why these stones will remind us forever.” The men do it. Joshua himself also sets up twelve stones in the middle of the Jordan, where the priests stood.',
        'The priests stay in the riverbed until everything is done, and the people hurry across. Then, at Joshua’s command, they climb up out of the Jordan. As soon as they step onto the bank, the water returns and flows over its banks again as before.',
        'It is the tenth day of the first month when the people camp at Gilgal, east of Jericho. There Joshua sets up the twelve stones. “When your children ask what they mean,” he says, “tell them: Israel crossed the Jordan on dry ground, just as God once did at the Red Sea. All the peoples should see how mighty God is.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where do the people camp when Joshua sets up the stones?', options: ['at Gilgal', 'at Jericho', 'at Shechem'] },
        { q: 'What should the parents answer when the children ask about the stones?', options: ['The water of the Jordan stopped flowing.', 'We gathered them to build a house.', 'God gave them to us.'] }
      ]
    },
    {
      title: 'Bread from the New Land',
      ref: 'Joshua 5:1, 10–12',
      text: [
        'The kings in the land of Canaan have heard that God dried up the Jordan before the Israelites, and their courage sinks. But the people stay at Gilgal.',
        'On the fourteenth day of the month Israel keeps the Passover on the plain near Jericho, as God told them, in memory of the time they came out of Egypt. On the next day the people eat from the produce of the land for the first time: unleavened bread and roasted grain.',
        'And something else is new. For many years God gave the people manna in the desert every morning, the bread that falls from heaven. But on the day they eat the grain of the land, the manna stops. Now they harvest what grows in the land of Canaan, and from it they are fed this year.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What stops when the people eat from the land?', options: ['the manna', 'the rain', 'the wind'] },
        { q: 'What do the people eat from the produce of the land?', options: ['flatbread and roasted grain', 'fish and dates', 'honey and milk'] }
      ]
    },
    {
      title: 'Holy Ground',
      ref: 'Joshua 5:13–6:5',
      text: [
        'Joshua is near Jericho. When he looks up, a man is standing in front of him. Joshua walks up to him and asks, “Are you for us, or for our enemies?” “Neither,” answers the man. “I am the commander of God’s army, and now I have come.”',
        'Then Joshua falls on his face to the ground and worships. “What does my lord say to his servant?” he asks. The commander answers, “Take off your sandals, for the place where you are standing is holy.” And Joshua does it.',
        'Jericho is shut up tight, for the people are afraid of the Israelites: no one goes out, and no one comes in. But God speaks to Joshua: “See, I have given Jericho into your hand. For six days you are to go around the city once. Seven priests are to carry seven trumpets of rams’ horns in front of the ark. On the seventh day you are to go around the city seven times, and the priests are to blow the trumpets. When the long note sounds, all the people are to shout loudly. Then the wall of the city will fall, and you can go in.”'
      ],
      task: { hint: 'This stage is calm and serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who suddenly stands in front of Joshua?', options: ['the commander of God’s army', 'a messenger of the king', 'a shepherd from Jericho'] },
        { q: 'What should Joshua take off?', options: ['his sandals', 'his cloak', 'his belt'] },
        { q: 'What is Jericho like?', options: ['shut up tight', 'wide open', 'empty'] }
      ]
    },
    {
      title: 'Around the City',
      ref: 'Joshua 6:6–14',
      text: [
        'Joshua calls the priests together and tells them what God has commanded: “Carry the ark of the covenant. Seven priests are to take seven trumpets of rams’ horns and walk in front of the ark.” To the people he says, “Go on and march around the city.” In front walk the men of the army, then the seven priests with the trumpets, behind them the ark is carried, and last comes all the people.',
        'But Joshua gives one more instruction: “You must not shout, and no word may come out of your mouth, until the day I say: Shout! Then you shall shout.”',
        'On the first day it is just as God has said. The priests blow the trumpets, the ark is carried once around the city, and the people follow in silence. Then everyone goes back to the camp and spends the night there. The next morning Joshua gets up early, and once more the procession goes once around Jericho. So it happens for six days. The gates of Jericho stay shut.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How many priests carry trumpets?', options: ['seven', 'twelve', 'three'] },
        { q: 'How many times do they go around the city each day for the first six days?', options: ['once', 'seven times', 'three times'] }
      ]
    },
    {
      title: 'The Wall Falls',
      ref: 'Joshua 6:15–27',
      text: [
        'On the seventh day they get up at daybreak and march around the city in the same way, but today seven times. The seventh time, the priests blow the trumpets, and Joshua calls to the people, “Shout! For God has given you the city.”',
        'He also says what must not be forgotten: “Rahab and everyone in her house are to be kept alive, because she hid the men we sent out.”',
        'Then the people shout, the trumpets sound, and the wall of the city falls down. The people go into the city. Joshua says to the two men who had spied out the land, “Go to Rahab’s house and bring her out with all who belong to her, as you swore to her.” The men lead Rahab, her father and her mother, her brothers and all her relatives out of the city to safety, in front of the camp of Israel.',
        'Rahab lives among the Israelites from then on. And God is with Joshua, and his name becomes known throughout the land.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How many times do they go around the city on the seventh day?', options: ['seven times', 'once', 'twelve times'] },
        { q: 'What happens to the wall when the people shout?', options: ['It falls down.', 'It stays standing.', 'It is taken apart.'] },
        { q: 'Who is to be kept alive?', options: ['Rahab and everyone in her house', 'only the priests', 'no one'] }
      ]
    },
    {
      title: 'The Stone under the Oak',
      ref: 'Joshua 24 (shortened)',
      text: [
        'Many years have passed. The people of Israel live in the land God gave them, and Joshua has grown old. He calls all the tribes to Shechem, their elders, leaders, judges and officers, and they stand before God.',
        'Joshua reminds them of what God has done for them: how he led Abraham into this land, set the people free from Egypt and brought them through the sea, how he carried them in the desert and finally gave them this land. “You live in cities you did not build, and you eat from vineyards and olive groves you did not plant,” says Joshua. “So serve God sincerely and faithfully. And if you do not want to serve him, then choose today whom you will serve. But as for me and my house, we will serve God.”',
        'The people answer, “Far be it from us to leave God! He brought us out of Egypt and protected us all along our way. We will serve God, for he is our God.”',
        'On that day Joshua makes a covenant with the people. He writes the words in the book of God’s law and sets up a large stone under the oak. “Look, this stone shall be a witness,” he says, “for it has heard all the words God has spoken to us.” Then he sends the people home. After these events Joshua dies at the age of one hundred and ten, and the people serve God as long as he and the elders after him live.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Joshua gather the people?', options: ['at Shechem', 'at Jericho', 'at Gilgal'] },
        { q: 'What does Joshua set up under the oak?', options: ['a large stone', 'a tent', 'an altar with fire'] }
      ]
    }
  ],
  exam: [
    { q: 'Who leads the people of Israel after Moses?', options: ['Joshua', 'Caleb', 'Aaron'] },
    { q: 'Where does Rahab hide the two men?', options: ['on the roof under flax', 'in the cellar under sacks', 'in a well'] },
    { q: 'What happens to the water of the Jordan when the priests dip their feet in?', options: ['It stands still.', 'It turns warm.', 'It turns to ice.'] },
    { q: 'How many stones do the people take out of the Jordan?', options: ['twelve', 'seven', 'forty'] },
    { q: 'How many times do they go around Jericho on the seventh day?', options: ['seven times', 'once', 'twelve times'] },
    { q: 'Who is to be kept alive in Jericho?', options: ['Rahab and everyone in her house', 'only the priests', 'no one'] }
  ]
}
