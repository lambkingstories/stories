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
      title: 'The People in Egypt',
      ref: 'Exodus 1:1–22',
      text: [
        'Many years have passed since Jacob and his sons moved to Egypt. Joseph, who helped them back then, died long ago, and Jacob’s family has grown into a great people, the people of Israel. So many of them live in the land of Goshen that the land is full of them.',
        'Then a new king, a pharaoh, comes to the throne of Egypt, one who knows nothing about Joseph. He becomes afraid of the people, who have grown so large and strong, and he forces the Israelites to do hard labor. They have to knead clay, shape bricks, and build storage cities for the king, from early morning until late at night. But the harder they have to work, the more the people grow.',
        'At last the king orders the two midwives of the Israelites, Shiphrah and Puah, not to let the newborn boys live. But Shiphrah and Puah have great respect for God and do not do what the king says. They let the children live. God sees it and gives the two women many good things, and the people grow and grow.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What are the two midwives called?', options: ['Shiphrah and Puah', 'Miriam and Zipporah', 'Sarah and Rachel'] },
        { q: 'What do the Israelites have to shape for the king?', options: ['bricks', 'swords', 'jars'] },
        { q: 'Why do Shiphrah and Puah not do what the king says?', options: ['They respect God.', 'They have no time.', 'They do not know the order.'] }
      ]
    },
    {
      title: 'The Little Basket in the Reeds',
      ref: 'Exodus 2:1–10',
      text: [
        'The king does not give in, and soon every newborn Israelite boy is supposed to be thrown into the Nile. In those days a woman from the tribe of Levi has a son, and because he is such a beautiful child, she hides him for three months.',
        'When she cannot hide him any longer, she makes a little basket out of reeds and seals it with tar and pitch. She lays the child in it and puts the basket among the reeds at the edge of the Nile. His sister stays at a distance to see what will happen to him.',
        'Then the daughter of Pharaoh comes down to the river to bathe, and her maids walk along the bank. She discovers the basket among the reeds and has it brought to her. When she opens it, she sees the crying child, and she feels sorry for him. “This is one of the Israelite children,” she says.',
        'Now the sister steps forward. “Shall I go and call an Israelite woman to nurse the child for you?” she asks. “Yes, go!” says the king’s daughter. The girl runs off and fetches the mother, and the king’s daughter says to her, “Take this child and raise him for me, and I will pay you.”',
        'When the boy has grown older, his mother brings him to Pharaoh’s daughter, and he becomes her son. She names him Moses, because she says, “I drew him out of the water.”'
      ],
      task: { hint: 'Plait the little basket of reed.', weave: { rounds: [{ hint: 'The reed runs in front of the stakes and behind them in turn. Tap the cells where it runs in front of the stake.' }, { hint: 'Now every row begins the other way round than the one below. Look where the reed runs in front of the stake.' }] } },
      questions: [
        { q: 'What does the mother make the basket from?', options: ['reeds', 'wood', 'straw'] },
        { q: 'Who discovers the basket among the reeds?', options: ['Pharaoh’s daughter', 'Moses’ father', 'a fisherman'] }
      ]
    },
    {
      title: 'Flight to Midian',
      ref: 'Exodus 2:11–25',
      text: [
        'Moses has grown up at the court of Pharaoh. One day he goes out to his people and sees how hard the Israelites have to work. Then he sees an Egyptian beating an Israelite, and Moses strikes the Egyptian, so that the man dies. Soon the news gets around, and when Pharaoh hears of it, he wants to punish Moses.',
        'So Moses flees far away to the land of Midian and sits down by a well there.',
        'The priest of Midian, Jethro, has seven daughters, who come to the well to water their father’s sheep. But shepherds come and drive them away. Then Moses gets up, helps the girls, and waters their sheep. “Where is the man?” asks Jethro when they tell him about it. “Invite him to eat with us!” Moses stays with Jethro and marries his daughter Zipporah, and when they have a son, he names him Gershom, because he says, “I have been a stranger in a strange land.”',
        'Many years go by. In Egypt the king dies, but the work does not get easier for the Israelites, and they groan and cry out to God. God hears them. He remembers the promise he made to Abraham, Isaac, and Jacob, and he sees how his people are doing.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Which land does Moses flee to?', options: ['Midian', 'Canaan', 'Babel'] },
        { q: 'What does Moses name his son?', options: ['Gershom', 'Aaron', 'Jethro'] },
        { q: 'Who hears the crying of the Israelites?', options: ['God', 'Pharaoh', 'Jethro'] }
      ]
    },
    {
      title: 'The Burning Bush',
      ref: 'Exodus 3:1–15',
      text: [
        'Moses has become an old man by now and tends the sheep of his father-in-law Jethro. One day he leads the flock far beyond the desert, all the way to the mountain of God, which is called Horeb. There he sees a bush that is on fire and yet does not burn up.',
        '“I must go and look at this,” says Moses. “Why doesn’t the bush burn up?” As he comes closer, God calls to him from the bush, “Moses, Moses!” “Here I am,” he answers. “Do not come any closer,” says God. “Take off your shoes, for the place where you are standing is holy ground. I am the God of your father, the God of Abraham, Isaac, and Jacob.” Then Moses covers his face, because he is afraid to look at God.',
        '“I have seen how badly my people are doing in Egypt,” says God, “and I have heard their crying. I will rescue them and lead them to a good and spacious land. And I am sending you to Pharaoh, so that you lead my people out of Egypt.”',
        '“Who am I, that I could do this?” asks Moses. “I will be with you,” answers God. And when Moses wants to know what he should call God when he speaks to the people, God says, “I AM WHO I AM. Tell the Israelites: The God of your fathers has sent me to you.”'
      ],
      task: { hint: 'Follow the glow.', glow: { rounds: [{ hint: 'Lead Moses over the slope with your finger. Something is glowing there. The closer you come, the brighter it gets.' }, { hint: 'Now rocks hide the light. Only the glow shines through. Follow the glow.' }] } },
      questions: [
        { q: 'What is the mountain of God called, where the bush burns?', options: ['Horeb', 'Carmel', 'Zion'] },
        { q: 'What does Moses have to take off?', options: ['his shoes', 'his cloak', 'his belt'] }
      ]
    },
    {
      title: 'Moses and Aaron',
      ref: 'Exodus 4:1–31',
      text: [
        'Moses is afraid that the Israelites will not believe him. “What do you have in your hand?” asks God. “A staff,” says Moses. “Throw it on the ground!” When Moses does it, the staff turns into a snake, and Moses steps back. But at God’s word he grabs it by the tail, and it becomes a staff again. “That is how they will believe that I appeared to you,” says God.',
        'But Moses still holds back. “I cannot speak well,” he says. “Please send somebody else!” “Who made the human mouth?” answers God. “I will be with your mouth and teach you what to say. And your brother Aaron is already on his way to meet you. He can speak well and will be glad to see you.”',
        'Moses says goodbye to Jethro, who tells him, “Go in peace.” Then he sets his wife and sons on a donkey, takes the staff of God in his hand, and travels to Egypt. At the mountain of God he meets his brother Aaron, and the two fall into each other’s arms.',
        'Together they call the elders of Israel. Aaron tells them everything God has said to Moses, and Moses shows the signs. Then the Israelites believe them, and when they hear that God has seen their misery, they bow down and worship him.'
      ],
      task: { hint: 'Find what is more in the right picture.', diff: { rounds: [{ hint: 'The right camp has a few things more. Tap on the right what is missing on the left.' }, { hint: 'Once more, now there are more and smaller things.' }] } },
      questions: [
        { q: 'What does Moses’ staff turn into on the ground?', options: ['a snake', 'a tree', 'a rope'] },
        { q: 'Who goes to meet Moses and is to speak for him?', options: ['Aaron', 'Jethro', 'Gershom'] }
      ]
    },
    {
      title: 'Let My People Go',
      ref: 'Exodus 5:1–6:9',
      text: [
        'Now Moses and Aaron go to Pharaoh. “This is what the God of Israel says,” they tell him. “Let my people go, so that they may hold a feast for me in the desert!” But Pharaoh answers, “Who is this God, that I should listen to his voice? I do not know him, and I will not let Israel go.”',
        'That very day he makes the Israelites’ work even harder. They no longer get straw for their bricks and have to gather it themselves in the fields, and still they have to deliver just as many bricks every day. The Israelites complain, and some of them blame Moses and Aaron because everything has become worse.',
        'Moses goes to God and asks, “Why did you send me here? Since I spoke to Pharaoh, things have gotten worse for the people, and you have not rescued them yet.” But God answers with a promise: “Now you will see what I will do to Pharaoh. I will lead you out of the hard labor and rescue you. You will be my people, and I will be your God.”',
        'Moses passes it on to the Israelites, but they do not listen to him, because they are so discouraged by all their trouble. But God’s promise remains.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do the Israelites no longer get for their bricks after the visit to Pharaoh?', options: ['straw', 'water', 'bread'] },
        { q: 'What does God promise his people?', options: ['He will rescue them and lead them out.', 'He will leave them in Egypt.', 'He will forget them.'] }
      ]
    },
    {
      title: 'The First Plagues',
      ref: 'Exodus 7:14–8:32',
      text: [
        'Again and again Moses and Aaron go to Pharaoh, and again and again they say, “Let the people go!” But Pharaoh keeps saying no. So God sends signs over Egypt, which are called plagues. First the water in the Nile turns to blood, so that the Egyptians can no longer drink from it.',
        'Then God lets frogs come up out of the river. They hop into the houses, into the bedrooms, onto the beds, into the ovens and into the kneading bowls, until there are frogs everywhere in the land. Then Pharaoh calls Moses and Aaron to him: “Ask God to take the frogs away, and I will let the people go.” “When shall it be?” asks Moses. “Tomorrow,” says Pharaoh. And the next day the frogs are gone from the houses, the courtyards, and the fields.',
        'But when Pharaoh sees that it is over, he breaks his word. So gnats come over the land, and after them swarms of flies, but in the land of Goshen, where the Israelites live, there are none. God separates the Egyptians from his people. This time too Pharaoh promises to let the people go when the plague ends, and again he does not keep his promise.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What comes out of the river and fills the houses?', options: ['frogs', 'snakes', 'crabs'] },
        { q: 'In which land are there no flies?', options: ['in the land of Goshen', 'in the land of Midian', 'in the land of Canaan'] }
      ]
    },
    {
      title: 'Hail, Locusts, and Darkness',
      ref: 'Exodus 9:1–10:29',
      text: [
        'Now the plagues become heavier. A plague strikes the livestock of the Egyptians, but not one of the animals of the Israelites dies.',
        'Then Moses announces a hailstorm, such as there has never been in Egypt, and advises people to bring their servants and animals into the houses. Whoever listens to God’s word brings his people and his animals to safety. The hail beats down the fields, but in the land of Goshen there is no hail. “This time I was wrong,” says Pharaoh. “Ask God to make it stop, and I will let you go.” Moses spreads out his hands, and the hail stops. But Pharaoh stays stubborn anyway.',
        'After that come locusts, which eat everything green, and when they are gone, thick darkness lies over Egypt for three days, so that nobody can see anybody else. Only among the Israelites is it bright in their homes.',
        'Now Pharaoh is willing to let the Israelites go, but without their animals. “No,” says Moses, “our livestock goes with us, not even one hoof will stay behind.” Then Pharaoh answers: “Get away from me and never come into my sight again!” “As you say,” answers Moses. “I will not come again.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where is there no hail?', options: ['in the land of Goshen', 'by the Nile', 'in the desert'] },
        { q: 'How long does darkness lie over Egypt?', options: ['three days', 'seven days', 'one day'] },
        { q: 'What does Moses say about the livestock of the Israelites?', options: ['It goes with us, not a hoof stays behind.', 'We will leave it here.', 'We will sell it.'] }
      ]
    },
    {
      title: 'The Night of Passover',
      ref: 'Exodus 11:1–12:32',
      text: [
        'God announces one last plague, the hardest of all. After that, Pharaoh will let the people go. But God also tells Moses how the Israelites should prepare for this night: every family is to take a one-year-old lamb without a flaw and slaughter it in the evening. With its blood they are to mark the two doorposts and the beam above the door.',
        'They eat the meat that night roasted, with bread made without yeast and bitter herbs. And they are to be ready to leave while they eat: belt around the waist, sandals on their feet, and a staff in their hand. “This is the Passover,” says God, “for when I see the blood on the door, I will pass over your house.” Moses tells the elders, and the people bow down and do everything exactly so.',
        'At midnight what God had announced happens: in Egypt all the firstborn sons die, from the son of Pharaoh to the son of the prisoner in the dungeon. A great wailing rises throughout the land, for in every house someone has died. But in the houses of the Israelites God passes over. Still in the night Pharaoh calls Moses and Aaron: “Get up and leave, you and all the Israelites, and take your sheep and cattle with you, too!”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do the Israelites put on their doorposts?', options: ['the blood of the lamb', 'clay and straw', 'oil and paint'] },
        { q: 'What should the Israelites be ready for while they eat?', options: ['to leave', 'to sleep', 'to fight'] },
        { q: 'Whom does Pharaoh call to him in the night?', options: ['Moses and Aaron', 'Miriam and Zipporah', 'Shiphrah and Puah'] }
      ]
    },
    {
      title: 'The Exodus',
      ref: 'Exodus 12:33–13:22',
      text: [
        'The Egyptians urge the Israelites to leave the country as quickly as possible, for they say, “Otherwise we will all die.” The Israelites have no time left to let their bread rise. They wrap the dough, made without yeast, in their cloths and carry it on their shoulders. When they ask their neighbors for things made of silver and gold and for clothing, the Egyptians give them everything.',
        'So they set out from Rameses, a whole people with children, sheep and cattle, and many other people join them. Moses also takes the bones of Joseph with him, because Joseph had made the Israelites promise long ago: “God will take care of you. Then carry my bones up from here.”',
        'God does not lead them by the shortest way, for there they might get into battles and want to turn back to Egypt. He sends them on a detour through the desert toward the Red Sea. And he himself goes ahead of them, by day in a pillar of cloud that shows them the way, and by night in a pillar of fire that gives them light. So they can travel day and night, and the pillar never leaves them.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do the Israelites carry in cloths on their shoulders?', options: ['dough without yeast', 'fresh bread', 'dates'] },
        { q: 'How does God show the people the way?', options: ['with a pillar of cloud by day and a pillar of fire by night', 'with a star', 'with a shepherd'] }
      ]
    },
    {
      title: 'The Miracle at the Sea',
      ref: 'Exodus 14:1–15:21',
      text: [
        'God leads the Israelites to the Red Sea, and there they make camp. But Pharaoh regrets that he let them go. With his chariots he chases after them, and when the Israelites see the army behind them, they become very afraid. The sea lies in front of them, and their pursuers are coming behind. “Do not be afraid,” says Moses. “Stand still and see how God rescues you today. He will fight for you.”',
        'During the night the pillar of cloud stands between the Israelites and the Egyptians. At God’s word Moses stretches his hand out over the sea, and a strong wind parts the water. In the middle of the sea there is dry ground, with a wall of water on the right and on the left, and the Israelites cross over, family after family. When the Egyptians follow them, the water flows back and covers chariots and riders. Of the whole army, no one follows the people anymore.',
        'But the Israelites are saved. They trust God and his servant Moses and sing a song of thanks. Miriam, the sister of Moses and Aaron, takes a tambourine in her hand, and all the women follow her with tambourines and dancing. “Sing to God,” calls Miriam, “for he has done a great deed!”'
      ],
      task: { hint: 'Play the drum with Miriam.', beat: { rounds: [{ hint: 'Golden rings draw in towards the drum. Tap the drum when a ring reaches it.' }, { hint: 'Now a ring is missing every now and then. Wait for the next one.' }] } },
      questions: [
        { q: 'What does Moses do at the sea at God’s word?', options: ['He stretches his hand out over the sea.', 'He strikes a rock.', 'He throws his cloak into the water.'] },
        { q: 'Who takes a tambourine in her hand after the rescue?', options: ['Miriam', 'Zipporah', 'Shiphrah'] }
      ]
    },
    {
      title: 'Bread from Heaven',
      ref: 'Exodus 15:22–17:7',
      text: [
        'After the miracle at the sea, the Israelites walk three days through the desert and find no water. At Marah the water is so bitter that they cannot drink it, and the people grumble against Moses. Moses cries out to God, and God shows him a piece of wood; when he throws it into the water, it becomes sweet.',
        'Later, in the Desert of Sin, the food runs short, and again the Israelites grumble. “God has heard how you grumble,” says Moses, “and he wants to fill you up.” In the evening quails fly into the camp, and in the morning something fine and white lies on the ground all around the tents, like frost. “What is it?” the people ask. “It is the bread that God gives you,” says Moses.',
        'Everyone is to gather only as much as he and his family can eat, one measure for each person in his tent, and it is enough for all. Nothing may be kept until the next morning. Only on the sixth day do they gather twice as much, for on the seventh day, the day of rest, nothing lies on the ground. The people call the bread manna and eat it for forty years.',
        'When they have no water again at Rephidim, Moses strikes a rock with his staff at God’s word, and water streams out, so that all the people can drink.'
      ],
      task: { hint: 'Gather as much manna every day as you need.', manna: { rounds: [{ hint: 'Every day you gather two full jars. Tap the grains and then “Enough”.' }, { hint: 'On the sixth day you gather twice as much. On the seventh day nothing lies on the ground.' }] } },
      questions: [
        { q: 'What do the people call the bread from heaven?', options: ['manna', 'honey bread', 'desert bread'] },
        { q: 'On which day do they gather twice as much?', options: ['on the sixth day', 'on the first day', 'on the day of rest'] }
      ]
    },
    {
      title: 'God’s Word at Mount Sinai',
      ref: 'Exodus 19:1–20:21',
      text: [
        'Three months after the exodus the Israelites reach the Desert of Sinai and set up camp opposite the mountain. Moses climbs up, and God has this message given to the people: “You have seen how I carried you on eagles’ wings. If you listen to my voice, you will be my own special people.” All the people answer, “Everything God has said we will do.”',
        'For two days the Israelites prepare themselves and wash their clothes. On the third morning a thick cloud lies on the mountain, there is thunder and lightning, and a loud trumpet sounds. Moses leads the people to the foot of the mountain, but they have to stay in front of it, for God has set a boundary around the mountain.',
        'Then God speaks the ten commandments. “I am your God, who freed you from Egypt,” he begins. “You shall have no other gods before me, and you shall not make an idol to bow down to. You shall not misuse my name. Keep the day of rest holy. Honor your father and your mother. You shall not murder, break your marriage promise, steal, or lie when you speak about others. And you shall not want what belongs to your neighbor.”',
        'The people see the thunder and lightning and the smoking mountain and shrink back. “You speak to us,” they ask Moses, “but God must not speak to us, or we will die.” “Do not be afraid,” says Moses. “God has come so that you respect him and do nothing wrong.” Then he goes into the darkness where God is.'
      ],
      task: { hint: "Put the words together to make God's words.", words: { rounds: [{ hint: 'Lay the words in the strip in the right order.', sentences: ['You shall not murder.', 'Honor your father and your mother.', 'Keep the day of rest holy.'] }, { hint: "Now longer sentences. God's words from the story.", sentences: ['You shall have no other gods before me.', 'You shall not misuse my name.', 'I am your God, who freed you from Egypt.'] }] } },
      questions: [
        { q: 'How many commandments does God give at Mount Sinai?', options: ['ten', 'seven', 'twelve'] },
        { q: 'What do the people answer to God’s offer?', options: ['Everything God has said we will do.', 'We will think about it.', 'We would rather go back.'] }
      ]
    },
    {
      title: 'The Golden Calf',
      ref: 'Exodus 32:1–35',
      text: [
        'Moses has been up on the mountain with God for a long time, and down in the camp the people become restless. “We do not know what has happened to Moses,” the people say to Aaron. “Make us a god who will go ahead of us!” Aaron asks them for their gold earrings, melts them down, and casts a calf of gold from them. “This is your god, Israel, who brought you out of Egypt,” the people shout, and they hold a feast in front of the statue.',
        'God sees it and says to Moses, “Go down! Your people have made themselves a calf and are worshiping it.” Yet the people promised to do everything God says. God is angry with his people. Then Moses pleads for the Israelites: “Remember Abraham, Isaac, and Jacob, to whom you promised that their descendants would be as many as the stars in the sky!” And God relents.',
        'Moses comes down the mountain with the two stone tablets that God himself has written on. When he sees the calf and the dancing, he becomes so angry that he throws the tablets to the ground, and they break. The people must bear the consequences of what they have done, and it is a sad day in Israel.',
        'The next morning Moses says to the people, “You have taken a great guilt upon yourselves. I will go up to God and ask him to forgive you.” And he climbs the mountain once more.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Aaron make the calf from?', options: ['gold earrings', 'wood', 'clay'] },
        { q: 'What happens to the stone tablets?', options: ['Moses throws them to the ground and they break.', 'Aaron hides them.', 'The people carry them into the camp.'] },
        { q: 'What does Moses want to do for the people?', options: ['ask God for forgiveness', 'leave God', 'leave the camp'] }
      ]
    },
    {
      title: 'God Goes With Them',
      ref: 'Exodus 33:7–34:35 and 40:34–38',
      text: [
        'But God does not leave his people. Moses pitches a tent outside the camp, the tent of meeting, and whoever wants to ask God something goes there. Whenever Moses goes to the tent, all the people stand up and watch him, each one at the door of his own tent. When Moses goes in, the pillar of cloud comes down and stands at the entrance, and God speaks with Moses as a man speaks with his friend.',
        '“If you do not go with us,” says Moses, “do not make us leave this place.” “I will do what you ask,” answers God. “I will go with you.”',
        'Then God says to Moses, “Cut two new stone tablets!” Early in the morning Moses climbs the mountain once more. Then God comes down in the cloud and calls out, “God, merciful and gracious, slow to anger, and abounding in love and truth!” Moses bows low and worships. For forty days and nights he stays with God, and when he comes down, his face shines, because he has spoken with God.',
        'Later the people build a great tent, the tent of God, in the middle of the camp, at God’s word. Then the cloud covers the tent, and God’s glory fills it. Whenever the cloud rises, the people set out, and as long as it stays over the tent, they stay where they are. So God goes with his people, by day and by night, all along the way.'
      ],
      task: { hint: 'Follow the cloud: break up when it rises.', cloud: { rounds: [{ hint: 'When the pillar of cloud rises, the people break up. When it stays, the people stay. Tap when you are sure.' }, { hint: 'Now it is night. The pillar of fire leads the people. Sparks fly, but they are no sign.' }] } },
      questions: [
        { q: 'What does Moses call the tent outside the camp?', options: ['the tent of meeting', 'Pharaoh’s tent', 'the shepherds’ tent'] },
        { q: 'What happens to Moses’ face after he has spoken with God?', options: ['It shines.', 'It turns pale.', 'It grows older.'] }
      ]
    }
  ],
  exam: [
    { q: 'What are the two midwives called who let the boys live?', options: ['Shiphrah and Puah', 'Miriam and Zipporah', 'Sarah and Rachel'] },
    { q: 'What does the mother make the basket for Moses from?', options: ['reeds', 'wood', 'straw'] },
    { q: 'What does Moses see on Mount Horeb?', options: ['a bush that burns and does not burn up', 'a tree without leaves', 'a river of gold'] },
    { q: 'How long does darkness lie over Egypt?', options: ['three days', 'seven days', 'one day'] },
    { q: 'What happens to the water of the sea when Moses stretches out his hand?', options: ['It parts, and the people walk through.', 'It turns to ice.', 'It disappears forever.'] },
    { q: 'How many commandments does God give at Mount Sinai?', options: ['ten', 'seven', 'twelve'] }
  ]
}
