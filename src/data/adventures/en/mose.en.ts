/**
 * English texts of the adventure "Moses" (8 to 10 years): the same shape as `../mose.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Moses, Aaron, Miriam, Jethro, Zipporah, Gershom, Shiphrah, Puah, Goshen, Horeb, Sinai, Red Sea); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Mose/ENGLISCH/Mose_English_Texte.md.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const moseEn: TextOverlay<Journey> = {
  title: 'Moses',
  subtitle: 'The Road to Freedom',
  gift: { title: 'The Way Through the Sea' },
  stages: [
    {
      title: 'Shiphrah and Puah',
      ref: 'Exodus 1:1–21',
      text: [
        'The descendants of Jacob live in Egypt, and they grow more and more numerous. Then a new king comes to power, the Pharaoh. He does not know Joseph and is afraid of the great people.',
        'So Pharaoh makes the Israelites work for him. They have to form bricks from clay and build for him. The work is hard, but the people keep growing anyway.',
        'Then Pharaoh commands the midwives Shiphrah and Puah, “When a boy is born, do not let him live!”',
        'But Shiphrah and Puah fear God. They do not do what Pharaoh says, and they let the boys live. For this God blesses the two women.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What are the two midwives called?', options: ['Shiphrah and Puah', 'Sarah and Hagar', 'Leah and Rachel'] },
        { q: 'Why do the midwives not do what Pharaoh says?', options: ['They fear God.', 'They have no time.', 'They do not know Pharaoh.'] },
        { q: 'What do the Israelites have to make for Pharaoh?', options: ['bricks', 'ships', 'wells'] }
      ]
    },
    {
      title: 'The Basket in the Reeds',
      ref: 'Exodus 2:1–10',
      text: [
        'Pharaoh has commanded that every newborn Israelite boy be thrown into the Nile. One mother hides her baby for three months.',
        'Then she cannot hide him any longer. She lays the baby in a basket made of reeds and sets it among the reeds on the bank. His sister stays nearby and watches.',
        'Then Pharaoh’s daughter comes down to the Nile. She discovers the basket and opens it. The baby cries, and she feels sorry for him.',
        '“Shall I go and get a woman to nurse the child?” asks the sister. So the mother becomes the nurse. Later Pharaoh’s daughter takes the boy as her own and calls him Moses, for she drew him out of the water.'
      ],
      task: { hint: 'Plait the little basket of reed.', weave: { rounds: [{ hint: 'Tap the cells where the reed runs in front of the stake.' }, { hint: 'Now every row begins the other way round.' }] } },
      questions: [
        { q: 'Where does the mother lay her baby?', options: ['in a basket among the reeds', 'in a boat', 'in a cave'] },
        { q: 'What does Pharaoh’s daughter call the boy?', options: ['Moses', 'Aaron', 'Gershom'] }
      ]
    },
    {
      title: 'Flight to Midian',
      ref: 'Exodus 2:11–25',
      text: [
        'Moses grows up at Pharaoh’s court. When he is grown, he sees how hard his people have to work. An Egyptian is beating an Israelite. Moses kills the Egyptian and hides him in the sand.',
        'Pharaoh hears of it and wants to seize Moses. So Moses flees to the land of Midian and sits down by a well.',
        'Seven daughters of the priest Jethro come to water their father’s sheep. Shepherds want to drive them away, but Moses helps them. Jethro invites Moses. Moses stays with them and marries Jethro’s daughter Zipporah.',
        'Far away in Egypt the Israelites groan under their work and cry out to God. God hears their cry and remembers his promise to Abraham, Isaac, and Jacob.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Moses flee?', options: ['to Midian', 'to Babel', 'to Canaan'] },
        { q: 'What does God hear in Egypt?', options: ['the cry of his people', 'a song of the shepherds', 'the rushing of the Nile'] },
        { q: 'How many daughters of the priest come to the well?', options: ['seven', 'two', 'twelve'] }
      ]
    },
    {
      title: 'The Burning Bush',
      ref: 'Exodus 3:1–15',
      text: [
        'Moses tends the sheep of his father-in-law Jethro. He leads them through the desert to the mountain Horeb.',
        'There he sees a bush that is burning but is not burned up. “I must go and look at this,” thinks Moses, and he steps closer.',
        'A voice calls from the bush, “Moses, Moses! Take off your shoes, for the place where you stand is holy ground. I am the God of Abraham, Isaac, and Jacob.” Moses takes off his shoes and covers his face.',
        '“I have seen the misery of my people,” says God. “I am sending you to Pharaoh, so that you lead my people out of Egypt.” Moses doubts, “Who am I?” “I will be with you,” answers God.'
      ],
      task: { hint: 'Follow the glow.', glow: { rounds: [{ hint: 'Lead Moses over the slope. Something is glowing there.' }, { hint: 'Now rocks hide the light.' }] } },
      questions: [
        { q: 'What is special about the bush?', options: ['It burns but is not burned up.', 'It grows in one night.', 'It is made of gold.'] },
        { q: 'What must Moses do because the ground is holy?', options: ['take off his shoes', 'hide', 'put out a fire'] }
      ]
    },
    {
      title: 'Moses and Aaron',
      ref: 'Exodus 4:1–31',
      text: [
        'Moses doubts. “I am not good at speaking,” he says to God. “Please send someone else!”',
        '“Who made the human mouth?” asks God. “I will be with your mouth and tell you what to say. And your brother Aaron shall speak for you.”',
        'Moses sets out for Egypt with his family. At the mountain of God, Aaron comes to meet him, and the two brothers embrace.',
        'Together they call the elders of Israel. Aaron tells them what God has said. The elders believe them, and when they hear that God has seen their misery, they bow down and worship.'
      ],
      task: { hint: 'Find what is more in the right picture.', diff: { rounds: [{ hint: 'The right camp has a few things more. Tap what is missing on the left.' }, { hint: 'Once more, with smaller things.' }] } },
      questions: [
        { q: 'What does Moses say when God sends him?', options: ['“I am not good at speaking.”', '“I am too tired.”', '“I do not know the way.”'] },
        { q: 'Who is to speak for Moses?', options: ['his brother Aaron', 'Jethro', 'Joshua'] }
      ]
    },
    {
      title: 'Let My People Go',
      ref: 'Exodus 5:1 to 6:9',
      text: [
        'Moses and Aaron go to Pharaoh. “This is what God says: Let my people go, so that they may hold a feast for me in the desert!”',
        'Pharaoh hardens his heart. “Who is God? I do not know him. I will not let Israel go!” And he makes the work even harder: now the Israelites have to look for their straw for the bricks themselves. The people lose heart.',
        'Moses goes to God.',
        'But God says to Moses, “I will lead you out of the hard labor and rescue you. You will be my people, and I will be your God.” Moses tells it to the people, but in their distress they do not listen.'
      ],
      task: { hint: 'Put the missing words into the sentence.', verse: { rounds: [{ hint: 'Drag the right leaf into the gap.', parts: ['Let my ', ' go, so that they may hold a feast for me in the ', '!'], words: ['people', 'desert', 'land', 'city'] }, { hint: 'Now three words are missing.', parts: ['I will ', ' you out of the hard labor and ', ' you. You will be my people, and I will be your ', '.'], words: ['lead', 'rescue', 'God', 'king', 'shepherd'] }] } },
      questions: [
        { q: 'What do the Israelites now have to do themselves?', options: ['look for their straw for the bricks', 'fetch their water', 'build their tents'] },
        { q: 'What does God promise the people?', options: ['He will rescue them.', 'He will punish them.', 'He will forget them.'] }
      ]
    },
    {
      title: 'The Frogs',
      ref: 'Exodus 7:14 to 8:15',
      text: [
        'First the water in the Nile turns to blood. But Pharaoh’s heart stays hard, and he does not let the people go.',
        'Then frogs come out of the Nile. They hop into the houses, into the bakery and into the bedroom, until there are frogs everywhere.',
        'Then Pharaoh calls Moses, “Ask God to take the frogs away. Then I will let the people go.” Moses prays, and the frogs disappear from the houses.',
        'When Pharaoh sees that the plague is over, his heart becomes hard again. He does not keep his word and does not let the people go.'
      ],
      task: { hint: 'Find the frogs in the bakery.', find: { labels: ['Frog', 'Frog', 'Frog', 'Frog', 'Frog', 'Frog', 'Frog'], doneText: 'You found all seven frogs!' } },
      questions: [
        { q: 'What happens first to the water in the Nile?', options: ['It turns to blood.', 'It turns to ice.', 'It dries up.'] },
        { q: 'What does Pharaoh promise when the frogs are gone?', options: ['He will let the people go.', 'He will reward Moses.', 'He will build a new palace.'] }
      ]
    },
    {
      title: 'Darkness and Light',
      ref: 'Exodus 9:1 to 10:29',
      text: [
        'After that, more plagues come over the land. A heavy hail destroys the harvest and strikes people and animals that are outside. Locusts eat whatever is left. Still Pharaoh’s heart stays hard.',
        'Then God says to Moses, “Stretch out your hand toward the sky!” Moses does it, and it grows dark in all of Egypt. The darkness is so thick that one can almost feel it.',
        'For three days the Egyptians cannot see one another. Nobody gets up from his place.',
        'But among the Israelites it is light in their homes. Still Pharaoh does not want to let the people go.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How long is it dark in Egypt?', options: ['three days', 'seven days', 'one night'] },
        { q: 'Where is it light?', options: ['among the Israelites', 'in Pharaoh’s palace', 'on the mountain'] },
        { q: 'What does Moses do before it grows dark?', options: ['He stretches out his hand toward the sky.', 'He builds a house.', 'He sings a song.'] }
      ]
    },
    {
      title: 'The Night of Passover',
      ref: 'Exodus 11:1 to 12:32',
      text: [
        'God says to Moses, “I will bring one more plague on Egypt. After that Pharaoh will let your people go.” Moses tells the Israelites how to get ready.',
        'In the evening the families eat the Passover meal with lamb and flatbread. They are ready for the journey. They wear belts around their waists and shoes on their feet and hold their staffs in their hands.',
        'God has said, “When I see the blood of the lamb on your doors, I will pass over you.” In the night all the firstborn in Egypt die, and a great wailing goes through the land. Among the Israelites, however, all stays quiet.',
        'Still in the same night Pharaoh calls Moses and Aaron. “Leave, you and all the Israelites!” he says.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How do the Israelites eat the Passover meal?', options: ['ready for the journey', 'asleep', 'dancing'] },
        { q: 'What does God say about the houses of the Israelites?', options: ['I will pass over you.', 'I will destroy them.', 'I will not see them.'] },
        { q: 'What does Pharaoh say at last?', options: ['“Leave!”', '“Stay here!”', '“Come back tomorrow!”'] }
      ]
    },
    {
      title: 'The Exodus',
      ref: 'Exodus 12:33 to 13:22',
      text: [
        'The Egyptians urge the people to hurry. The Israelites wrap their dough, not yet risen, in cloths. So they carry it on their shoulders.',
        'The Egyptians give them articles of silver and gold and clothing. So the Israelites leave Egypt, very many of them, with their sheep and cattle.',
        'Moses takes the bones of Joseph along. Joseph once asked his brothers for this: “God will take care of you. Then carry my bones with you.”',
        'God himself shows them the way. By day a pillar of cloud goes ahead of them, and by night a pillar of fire gives them light.'
      ],
      task: { hint: 'Pack the carrying cloth for the journey out.', pack: { items: [{ label: 'Bundle of clothes' }, { label: 'Dough trough' }, { label: 'Bundle of cloths' }, { label: 'Silver jug' }, { label: 'Gold jug' }], rounds: [{ hint: 'Pack the carrying cloth, a tap turns a piece.' }, { hint: 'Now more pieces and no room to spare.' }] } },
      questions: [
        { q: 'Whose bones does Moses take along?', options: ['Joseph’s bones', 'Jacob’s bones', 'Abraham’s bones'] },
        { q: 'What shows the people the way?', options: ['a pillar of cloud by day and a pillar of fire by night', 'a star', 'a shepherd with a lantern'] }
      ]
    },
    {
      title: 'The Wonder at the Sea',
      ref: 'Exodus 14:1 to 15:21',
      text: [
        'The people stand at the sea, and behind them comes Pharaoh’s army. The Israelites are afraid.',
        '“Do not be afraid!” calls Moses. “Stand firm and watch! God will fight for you, and you will be still.”',
        'The pillar of cloud moves between the people and the army. Moses stretches his hand out over the sea, and a strong east wind parts the water. It stands like a wall on the right and on the left, and the people walk through on dry ground.',
        'Behind them the water falls back together. Of the whole army, no one follows the people anymore. On the other side Miriam, the sister of Moses and Aaron, beats the tambourine. “Sing to God!” she calls, and the women dance behind her.'
      ],
      task: { hint: 'Play the drum with Miriam.', beat: { rounds: [{ hint: 'Tap the drum when a ring reaches it.' }, { hint: 'Now a ring is missing every now and then.' }] } },
      questions: [
        { q: 'What does Moses say to the people at the sea?', options: ['“Do not be afraid!”', '“Run back!”', '“Build boats!”'] },
        { q: 'What parts the water?', options: ['a strong wind', 'a net', 'a golden staff'] }
      ]
    },
    {
      title: 'Bread from Heaven',
      ref: 'Exodus 15:22 to 16:36',
      text: [
        'In the desert the people get hungry, and they grumble. Then God says to Moses, “I will rain bread down from heaven for you.”',
        'In the morning something white lies on the ground like frost, tiny grains. “What is it?” the people ask. “It is the bread God gives you,” says Moses. They call it manna.',
        'Everyone gathers as much as he needs, and there is enough for all. It tastes sweet, like bread with honey.',
        'God has said, “On the sixth day gather twice as much, for on the seventh day you rest.” And so it happens: on the sixth day there is twice as much, and on the seventh day there is nothing on the ground.'
      ],
      task: { hint: 'Gather as much manna every day as you need.', manna: { rounds: [{ hint: 'Gather two full jars and then tap “Enough”.' }, { hint: 'On the sixth day you gather twice as much, on the seventh nothing lies on the ground.' }] } },
      questions: [
        { q: 'What lies on the ground in the morning?', options: ['something white like frost', 'snow', 'gold'] },
        { q: 'How much do the people gather on an ordinary day?', options: ['as much as they need', 'as much as they can carry', 'only one jar'] }
      ]
    },
    {
      title: 'The Ten Commandments',
      ref: 'Exodus 19:1 to 20:21',
      text: [
        'The people come to Mount Sinai. God says, “If you listen to me, you shall be my own possession.” “All that God has said we will do,” answers the people.',
        'A thick cloud lies on the mountain, there is thunder, and a trumpet sounds. The people stay at a distance, and God speaks, “I am your God, who freed you from Egypt.”',
        'First God says how people shall live with him: “You shall have no other gods before me. You shall not make an idol. You shall not misuse my name. Keep the day of rest holy.”',
        'Then God says how people shall live with one another: “Honor your father and your mother. You shall not murder. You shall not break your marriage promise or steal. You shall not lie, and you shall not want what belongs to someone else.”'
      ],
      task: { hint: "Put the words together to make God's words.", words: { rounds: [{ hint: 'Lay the words in the strip in the right order.', sentences: ['You shall not murder.', 'Honor your father and your mother.'] }, { hint: 'Now longer sentences.', sentences: ['You shall have no other gods before me.', 'I am your God, who freed you from Egypt.'] }] } },
      questions: [
        { q: 'What do the people answer God at the mountain?', options: ['“All that God has said we will do.”', '“We want to move on.”', '“We do not need this.”'] },
        { q: 'What lies on Mount Sinai?', options: ['a thick cloud', 'deep snow', 'a tent'] }
      ]
    },
    {
      title: 'The Golden Calf',
      ref: 'Exodus 32:1–34 (shortened)',
      text: [
        'The people have promised God to do what he says. But Moses stays on the mountain a long time, and the people grow impatient. “Make us gods who will go before us!” they ask Aaron.',
        'Aaron collects their gold jewelry and makes a golden calf from it. “These are your gods,” the people say. They hold a feast in front of the calf.',
        'God tells Moses, and Moses pleads for the people. He goes down the mountain with the two stone tablets, sees the calf, and grows angry. He breaks the tablets.',
        'The next day Moses goes up to God again and pleads, “Forgive them!” God listens to Moses and leads his people on.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Aaron make from the gold?', options: ['a calf', 'a crown', 'a tent'] },
        { q: 'What does Moses ask for the people?', options: ['that God forgive them', 'that God punish them', 'that God leave them'] }
      ]
    },
    {
      title: 'God Goes With Them',
      ref: 'Exodus 33:7–17; 34:1–4, 29; 40:34–38',
      text: [
        'Moses pitches a tent outside the camp. When he goes in, the pillar of cloud stands at the entrance, and God speaks with him as a friend speaks with his friend. The people stand in front of their tents, watch, and bow.',
        '“My presence will go with you,” promises God. “I will give you rest.”',
        'Moses cuts two new stone tablets, and God writes his words on them. When Moses comes down from the mountain, his face shines.',
        'Later the cloud covers the holy tent that Moses has set up for God. When the cloud rises, the people set out; when it stays, the people stay. By day the cloud shows the way, and by night there is fire in it.'
      ],
      task: { hint: 'Follow the cloud: break up when it rises.', cloud: { rounds: [{ hint: 'When the pillar rises, the people break up; when it stays, they stay.' }, { hint: 'Now it is night. Sparks are no sign.' }] } },
      questions: [
        { q: 'What shows the people the way?', options: ['the cloud over the tent', 'a bird', 'a shepherd’s staff'] },
        { q: 'Where is the tent in which God speaks with Moses?', options: ['outside the camp', 'in the middle of the camp', 'on Sinai'] }
      ]
    }
  ],
  exam: [
    { q: 'What are the two midwives called?', options: ['Shiphrah and Puah', 'Sarah and Hagar', 'Leah and Rachel'] },
    { q: 'Where does the mother lay her baby?', options: ['in a basket among the reeds', 'in a boat', 'in a cave'] },
    { q: 'What is special about the bush Moses sees?', options: ['It burns but is not burned up.', 'It grows in one night.', 'It is made of gold.'] },
    { q: 'What parts the water at the sea?', options: ['a strong wind', 'a net', 'a golden staff'] },
    { q: 'What do the people answer God at the mountain?', options: ['“All that God has said we will do.”', '“We want to move on.”', '“We do not need this.”'] },
    { q: 'What shows the people the way?', options: ['the cloud over the tent', 'a bird', 'a shepherd’s staff'] }
  ]
}
