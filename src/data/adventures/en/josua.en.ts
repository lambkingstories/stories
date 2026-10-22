/**
 * English texts of the adventure "Joshua" (8 to 10 years): the same shape as `../josua.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Joshua, Rahab, Jericho, Shittim, Jordan, Gilgal, Shechem); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Josua/ENGLISCH/.
 * English recordings: geschichte-NN-en-v4.mp3 (voice Achernar), set at the end of this file.
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
      ref: 'Joshua 1:1–11',
      text: [
        'Moses, the servant of God, has died. The people of Israel stand at the Jordan River, and on the other side lies the land God promised them.',
        'Then God speaks to Joshua, the new leader, “My servant Moses is dead. Now lead the people into the land I am giving them.”',
        'And God promises, “I will be with you, as I was with Moses. Be strong and courageous! Do not be afraid, for I will never leave you.” He urges him, “Think about the Book of the Law day and night, and do what is written in it. Then everything will go well for you.”',
        'Joshua calls the officers, “Go through the camp and tell the people: Get your supplies ready! In three days we cross the Jordan.”'
      ],
      task: { hint: 'This stage is calm. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does God say to Joshua?', options: ['“I will be with you.”', '“Go alone.”', '“Turn back.”'] },
        { q: 'Who leads the people after the death of Moses?', options: ['Joshua', 'Aaron', 'Barak'] }
      ]
    },
    {
      title: 'Two Spies',
      ref: 'Joshua 2:1–7',
      text: [
        'From Shittim Joshua secretly sends out two men. Nobody is to notice. They are to look at the city of Jericho, which lies behind a high wall.',
        'The spies come to the house of a woman named Rahab. It stands in the city wall.',
        'But the king of Jericho hears about it. He sends messengers to Rahab, “Hand over the men!”',
        'Rahab has long since hidden the two on the roof, under stalks of flax. She tells the messengers that the men have already gone. So the messengers run off, and the city gate shuts behind them.'
      ],
      task: { hint: 'Cover the men with bundles of flax.', hide: { rounds: [{ hint: 'Rahab hides the two men under the flax. Start with the first one and lay the bundles over him.' }, { hint: 'Now two men lie on the roof. Tap a bundle and it turns.' }] } },
      questions: [
        { q: 'Where does Joshua send two men?', options: ['to Jericho', 'to Egypt', 'to Mount Sinai'] },
        { q: 'Who has the men searched for?', options: ['the king of Jericho', 'Rahab', 'Joshua'] }
      ]
    },
    {
      title: 'The Red Rope',
      ref: 'Joshua 2:8–24',
      text: [
        'In the evening Rahab climbs up to the men on the roof. “Your God is God in heaven above and on the earth below,” she says. “I know that he is giving you this land. Please spare my family, too!”',
        'The men promise it. Rahab lets them down by a red rope through the window, for her house stands in the city wall. “Hide in the hills for three days,” she advises.',
        '“Tie this red rope in your window,” say the men, “and bring your family into your house. Whoever stays inside will be safe.”',
        'Rahab ties the red rope in the window. The men hide in the hills and then go back to Joshua.'
      ],
      task: { hint: 'Let the men down on the red rope, but only when no guard is near.', lower: { rounds: [{ hint: 'Hold the rope and the man goes down. Let go when the guard comes.' }, { hint: 'The second man climbs down, and the guard comes twice.' }] } },
      questions: [
        { q: 'What does Rahab say about God?', options: ['He is God in heaven and on earth.', 'He lives only in Jericho.', 'He is far away.'] },
        { q: 'What does Rahab tie in the window?', options: ['a red rope', 'a white cloth', 'a lantern'] }
      ]
    },
    {
      title: 'The Jordan',
      ref: 'Joshua 3:1–17',
      text: [
        'Now the people stand at the Jordan. It is harvest time, and the river is so full that it overflows its banks.',
        '“Look at the golden chest, the ark of the covenant,” says Joshua. “Priests will carry it ahead of you. By this you will know that a living God is among you.”',
        'The priests go ahead with the ark. As soon as their feet touch the water, the river stops flowing. The water stands up high, and below it the riverbed becomes dry.',
        'The priests stay standing in the middle of the Jordan, and all the people cross over on dry ground until everyone is on the other side.'
      ],
      task: { hint: 'Bring the ark and the people through the Jordan.', cross: { rounds: [{ hint: 'Lead the priests with the golden chest into the water.' }, { hint: 'Now the people cross. Tap the groups.' }] } },
      questions: [
        { q: 'Who carries the golden chest ahead?', options: ['the priests', 'the spies', 'the children'] },
        { q: 'What happens when the feet of the priests touch the water?', options: ['The water stands still.', 'The water rises.', 'The river grows wider.'] }
      ]
    },
    {
      title: 'Twelve Stones',
      ref: 'Joshua 4:1–24',
      text: [
        'When everyone is across, God says to Joshua, “Choose twelve men, one from each tribe. Each of them is to take a stone from the riverbed.”',
        'The twelve men step into the Jordan and each lifts a stone onto his shoulder. They carry the stones to Gilgal, where the people make their camp.',
        'There Joshua sets up the twelve stones. “When your children ask you someday: What are these stones for?, then tell them,” he says.',
        '“God made the water of the Jordan stand still until we were across. These stones shall always remind us.”'
      ],
      task: { hint: 'Find the matching cards. Remember where each one lies.', memory: { pairs: [{ text: 'The scroll: The Book of the Law. Joshua is to think about it day and night.' }, { text: 'The bundle of flax: Rahab hid the men under it.' }, { text: 'The red rope at the window: Whoever stays inside the house will be safe.' }, { text: 'The ark of the covenant: The priests carry it ahead into the Jordan.' }, { text: 'The stone: Twelve stones remind us of the way through the Jordan.' }] } },
      questions: [
        { q: 'What do the twelve men carry out of the river?', options: ['stones', 'jars', 'branches'] },
        { q: 'What are the stones to remind us of?', options: ['that God made the Jordan stand still', 'that it is harvest time', 'that Jericho has a wall'] }
      ]
    },
    {
      title: 'Bread from the New Land',
      ref: 'Joshua 5:1, 10–12',
      text: [
        'The kings in the land hear that God has dried up the Jordan for Israel, and they lose heart. The people, however, celebrate the Passover in the camp at Gilgal in the evening. It reminds them how God led his people out of Egypt.',
        'The next day the people eat grain from the land for the first time. They bake unleavened bread and roast kernels.',
        'And the next morning no more manna comes. For a long time God has fed his people in the desert with manna.',
        'Now grain grows in their own land. The people have arrived.'
      ],
      task: { hint: 'Bake flatbreads and turn them when they are golden brown.', bake: { rounds: [{ hint: 'Put dough on the hot stones. Turn the flatbread when it is golden brown.' }, { hint: 'Now more stones and more flatbreads.' }] } },
      questions: [
        { q: 'Where do the people celebrate the Passover?', options: ['in Gilgal', 'in Jericho', 'in Egypt'] },
        { q: 'What stops in the morning?', options: ['the manna', 'the rain', 'the singing'] }
      ]
    },
    {
      title: 'Holy Ground',
      ref: 'Joshua 5:13 to 6:5',
      text: [
        'Joshua is near the city of Jericho. He lifts his eyes, and a man stands before him. “Are you for us or for our enemies?” asks Joshua.',
        '“Neither,” answers the man. “I am the commander of God’s army.” Then Joshua falls to the ground on his face and asks, “What does my lord command?”',
        'The commander says, “Take off your sandals, for the place where you are standing is holy.” And Joshua takes off his sandals.',
        'Then God tells Joshua his plan for Jericho. For six days the people are to walk once around the city, on the seventh day seven times, and seven priests are to blow trumpets.'
      ],
      task: { hint: 'This stage is calm and serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is Joshua to do because the place is holy?', options: ['take off his sandals', 'hide', 'light a fire'] },
        { q: 'What are the people to do for six days?', options: ['walk around the city once a day', 'besiege the city', 'stay in the camp'] }
      ]
    },
    {
      title: 'Around the City',
      ref: 'Joshua 6:6–14',
      text: [
        'Joshua puts the procession in order. The walls of Jericho tower ahead of them. First go the men of the army, behind them seven priests with trumpets. Then other priests carry the golden chest, and the people follow.',
        '“You shall not make a sound,” says Joshua. “Only when I say: Shout!, may you shout.”',
        'Only the trumpets sound, and you can hear the steps of the many people. They walk in silence once around the city, then return to the camp.',
        'So it goes for six days. Every morning the same way, every evening back to the camp. Jericho stays shut.'
      ],
      task: { hint: 'Calm the animals before it gets loud.', hush: { rounds: [{ hint: 'The people walk round the city in silence. Tap an animal before its cloud of noise gets big.' }, { hint: 'Once more, with more animals.' }] } },
      questions: [
        { q: 'How many priests go ahead of the chest with trumpets?', options: ['seven', 'twelve', 'three'] },
        { q: 'When may the people shout?', options: ['when Joshua says “Shout!”', 'as soon as they see the wall', 'on the first evening'] }
      ]
    },
    {
      title: 'The Wall Falls',
      ref: 'Joshua 6:15–25',
      text: [
        'On the seventh day everyone gets up early. They walk around the city seven times, the men of the army first, then priests, golden chest, and people.',
        'The seventh time Joshua calls, “Shout! God has given you the city!” The trumpets sound, and the people shout loudly.',
        'Then the wall collapses. The city of Jericho has fallen.',
        'Joshua reminds the spies of their promise, “Bring Rahab and her family out of the house with the red rope, as you swore.” So Rahab and all who belong to her stay alive. From then on she lives among the people of Israel.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What happens to the wall of Jericho?', options: ['It collapses.', 'It is painted.', 'It keeps growing.'] },
        { q: 'Who stays alive with her family?', options: ['Rahab', 'Barak', 'Deborah'] }
      ]
    },
    {
      title: 'The Stone under the Oak',
      ref: 'Joshua 24:1, 14–32',
      text: [
        'Many years later Joshua has grown old. He calls all the people together at Shechem.',
        '“Choose today whom you will serve,” says Joshua. “But as for me and my house, we will serve God.”',
        'The people answer, “We want to serve God, too, for he brought us out of Egypt and has been with us until now.”',
        'Then Joshua takes a large stone and sets it up under the oak. “This stone shall be a witness, for it has heard all the words God has spoken to us.” Then he sends the people home. Afterward Joshua dies, one hundred and ten years old, and they bury him in his own land in the hills of Ephraim. At Shechem, however, the Israelites bury the bones of Joseph, which they had brought out of Egypt.'
      ],
      task: { hint: 'Put the missing words into the sentence.', verse: { rounds: [{ hint: 'Drag the right leaf into the gap.', parts: ['As for me and my household, we will ', ' God.'], words: ['serve', 'forget', 'leave'] }, { hint: 'Now two words are missing.', parts: ['This stone shall be a ', ' for it has heard all the ', ' that God has spoken to us.'], words: ['witness', 'words', 'sign', 'stones'] }] } },
      questions: [
        { q: 'What does Joshua say about himself and his house?', options: ['They will serve God.', 'They will move away.', 'They will become kings.'] },
        { q: 'What does Joshua set up under the oak?', options: ['a large stone', 'a tent', 'an altar with fire'] }
      ]
    }
  ],
  exam: [
    { q: 'What does God say to Joshua at the beginning?', options: ['“I will be with you.”', '“Go alone.”', '“Turn back.”'] },
    { q: 'What does Rahab tie in the window?', options: ['a red rope', 'a white cloth', 'a lantern'] },
    { q: 'What happens when the feet of the priests touch the water?', options: ['The water stands still.', 'The water rises.', 'The river grows wider.'] },
    { q: 'What do the twelve men carry out of the river?', options: ['stones', 'jars', 'branches'] },
    { q: 'What is Joshua to do because the place is holy?', options: ['take off his sandals', 'hide', 'light a fire'] },
    { q: 'What does Joshua say about himself and his house?', options: ['They will serve God.', 'They will move away.', 'They will become kings.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 22.10.2026): geschichte-NN-en-v4.mp3, one per stage in the order of the stages
josuaEn.stages!.forEach((s, i) => {
  s.audio = `audio/abenteuer/josua/geschichte-${String(i + 1).padStart(2, '0')}-en-v4.mp3`
})
