/**
 * English texts of the adventure "Abraham" (8 to 10 years): the same shape as `../abraham.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Abram, Sarai, Sarah, Isaac); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Abraham/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const abrahamEn: TextOverlay<Journey> = {
  title: 'Abraham',
  subtitle: 'God Calls, God Keeps His Word',
  gift: { title: 'Abraham and Sarah in Front of the Tent under the Starry Sky' },
  stages: [
    {
      title: 'The Call',
      ref: 'Genesis 12:1–9',
      audio: 'audio/abenteuer/abraham/geschichte-01-en-v1.mp3',
      text: [
        'After the people of Babel have scattered over the whole earth, God calls one single man. His name is Abram, and he lives in Haran with his wife Sarai.',
        'God says to him, “Leave your country, your family, and your father’s house, and go to the land that I will show you. I will make you a great nation and bless you. And through you all the families of the earth will be blessed.”',
        'Abram trusts God and sets out. He is seventy-five years old. Sarai goes with him, and so does his nephew Lot, along with the servants and shepherds with their sheep, goats, and camels. A long caravan sets out, carrying everything they own.',
        'They travel into the land of Canaan. At the great trees of Shechem, God says, “I will give this land to your descendants.” So Abram builds an altar to thank God. Later he builds another one near Bethel and pitches his tent there. Then he travels on toward the south.'
      ],
      task: { hint: 'Put the packs in the baskets so that the camel stands straight.', balance: { packs: [{ label: 'small sack' }, { label: 'small sack' }, { label: 'small sack' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'big sack' }, { label: 'big sack' }, { label: 'big sack' }], rounds: [{ hint: 'Round 1: Spread the three packs over both sides.' }, { hint: 'Round 2: Now there are more and heavier packs.' }] } },
      questions: [
        { q: 'Where is Abram to go?', options: ['to the land God will show him', 'back home', 'to the sea'] },
        { q: 'Who goes with Abram and Sarai?', options: ['Lot', 'a king', 'Isaac'] }
      ]
    },
    {
      title: 'Abram and Lot',
      ref: 'Genesis 13',
      audio: 'audio/abenteuer/abraham/geschichte-02-en-v1.mp3',
      text: [
        'Abram has become rich in sheep, goats, and camels, and Lot has large herds, too. But the land is not big enough for both of them. Soon there is quarreling between their shepherds.',
        'So Abram says to Lot, “There must be no quarreling between you and me, or between our shepherds. We are family! Let us go our separate ways. You choose first where you want to go.”',
        'Lot looks around. He sees the wide plain along the Jordan River. It is green and well watered, like a garden of God. Lot chooses this plain and goes there with his herds. So the two part in peace.',
        'Abram stays in the land of Canaan. Then God says to him, “Look around in every direction! All the land that you see I will give to you and your descendants. They will be as many as the dust of the earth.” Abram pitches his tent by the great oaks of Mamre and builds an altar there for God.'
      ],
      task: { hint: 'Tap the animals and count them.', question: 'How many animals are there together?' },
      questions: [
        { q: 'Why can’t Abram and Lot stay together?', options: ['The land is too small for both herds.', 'They got lost.', 'It is too cold.'] },
        { q: 'Who chooses a land first?', options: ['Lot', 'Abram', 'the shepherds'] }
      ]
    },
    {
      title: 'The Stars',
      ref: 'Genesis 15:1–6',
      audio: 'audio/abenteuer/abraham/geschichte-03-en-v1.mp3',
      text: [
        'Abram and Sarai have grown old, and they still have no child. Abram sits in front of his tent and waits for what God has promised.',
        'Then God speaks to him, “Do not be afraid, Abram! I am your shield.” Sadly Abram answers, “I have no son. Who will get everything I own one day? Maybe one of my servants?” God says, “No. Your own son will be your heir.”',
        'Then God leads Abram out of the tent into the night. “Look up at the sky,” he says, “and count the stars, if you can!” Abram looks up. The sky sparkles, there are so many stars. “That is how many descendants you will have,” says God.',
        'Abram cannot count them. But he believes what God has promised him. That is good in God’s eyes.'
      ],
      task: { hint: 'Place the stars the way you see them in the model.', constellation: { rounds: [{ hint: 'Round 1: The model stays visible: four stars.' }, { hint: 'Round 2: Look closely: The model disappears. Six stars.' }] } },
      questions: [
        { q: 'What is Abram to count at night?', options: ['the stars', 'the sheep', 'the tents'] },
        { q: 'How many descendants does God promise Abram?', options: ['as many as the stars in the sky', 'only one', 'none'] }
      ]
    },
    {
      title: 'A Visit at the Oaks',
      ref: 'Genesis 18:1–15',
      audio: 'audio/abenteuer/abraham/geschichte-04-en-v1.mp3',
      text: [
        'Meanwhile God has given Abram and Sarai new names. Abram is now called Abraham, which means “father of many,” and Sarai is called Sarah. Both have grown very old.',
        'It is noon, and the sun is burning hot. Abraham is sitting at the entrance of his tent by the great oaks of Mamre. There God visits him, so the Bible tells us. Abraham sees three men standing in front of him, travelers in dusty cloaks.',
        'He runs to meet them and bows. “Please stay with me,” he says. “I will bring water for your feet, and you can rest under the tree.” He calls to Sarah, “Quick, bake bread!” He fetches a young calf. Then he sets bread, butter, milk, and the meat in front of his guests and stays near them under the tree while they eat.',
        '“Where is Sarah, your wife?” the men ask. “In the tent,” says Abraham. Then one says, “In a year I will come back. By then Sarah will have a son.” Sarah hears it behind the tent door. She laughs quietly to herself, “I am much too old!”',
        '“Why is Sarah laughing?” asks the guest. “Is anything too hard for God?” Sarah is startled and says, “I did not laugh.” But he answers, “Yes, you did laugh.”'
      ],
      task: { hint: 'Fill the jug at the well and pour the water into the guests’ bowls.', water: { plants: [{ label: 'Bowl for the first guest' }, { label: 'Bowl for the second guest' }, { label: 'Bowl for the third guest' }, { label: 'Deep bowl for the first guest' }, { label: 'Deep bowl for the second guest' }, { label: 'Deep bowl for the third guest' }], rounds: [{ hint: 'Round 1: Each bowl needs one jug.' }, { hint: 'Round 2: The deep bowls need two jugs.' }] } },
      questions: [
        { q: 'What does Abraham serve his guests?', options: ['bread, butter, milk, and meat', 'fish and dates', 'only water'] },
        { q: 'What does Sarah do when she hears she will have a son?', options: ['She laughs quietly.', 'She cries.', 'She sings.'] }
      ]
    },
    {
      title: 'Isaac',
      ref: 'Genesis 21:1–7',
      audio: 'audio/abenteuer/abraham/geschichte-05-en-v1.mp3',
      text: [
        'A year goes by. Then what God promised happens: Sarah has a son, at exactly the time God had said. Abraham is one hundred years old.',
        'Abraham gives the child the name God told him: Isaac. It means “he laughs.”',
        'Sarah holds her son in her arms and says, “God has given me laughter. Everyone who hears about it will laugh with me.” And she says, “Who would ever have told Abraham that Sarah would have children? And now I have borne him a son in his old age.”',
        'There is a baby in the tent now. Sarah laughs, and Abraham laughs. God has kept his word.'
      ],
      task: { hint: 'Put the family picture together.' },
      questions: [
        { q: 'What does Abraham name his son?', options: ['Isaac', 'Lot', 'Abram'] },
        { q: 'How old is Abraham when Isaac is born?', options: ['one hundred years', 'fifty years', 'twenty years'] }
      ]
    },
    {
      title: 'God Provides',
      ref: 'Genesis 22:1–14',
      audio: 'audio/abenteuer/abraham/geschichte-06-en-v1.mp3',
      text: [
        'Isaac has grown into a boy. Then God tests Abraham, because he wants to see whether Abraham trusts him completely. “Abraham!” God calls. “Here I am.” God says, “Take Isaac, your son, whom you love so much, and go with him to the land of Moriah. On a mountain that I will show you, you are to offer him to me.” That is a hard test. But Abraham knows God, who has always kept his word.',
        'Early the next morning Abraham loads his donkey with wood and sets out with Isaac and two servants. On the third day he sees the mountain. “Stay here with the donkey,” he says to the servants. “The boy and I will go up there, and we will come back to you.”',
        'Isaac carries the wood on his shoulders. “Father,” he asks, “where is the animal for the offering?” Abraham answers, “My son, God himself will provide the animal for the offering.”',
        'At the top Abraham builds an altar and lays the wood ready. Then a voice calls from heaven, “Abraham! Abraham!” He answers, “Here I am.” “Do not harm the boy! Now I know that you trust God.” Abraham looks up and sees a ram caught by its horns in a thicket. He offers it to God in Isaac’s place. Isaac stands next to him, safe and sound. Abraham calls the place “God Provides.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Isaac carry up the mountain?', options: ['the wood', 'the water', 'the tent'] },
        { q: 'What does Abraham answer when Isaac asks about the animal?', options: ['God will provide it.', 'I forgot it.', 'We will buy one on the way.'] },
        { q: 'What does Abraham see in the thicket?', options: ['a ram', 'a deer', 'a donkey'] }
      ]
    }
  ],
  exam: [
    { q: 'Where does God call Abram to go?', options: ['to a land God will show him', 'back to Haran', 'to the sea'] },
    { q: 'Who chooses first when Abram and Lot part?', options: ['Lot', 'Abram', 'the shepherds'] },
    { q: 'How many descendants does God promise Abram on the starry night?', options: ['as many as the stars in the sky', 'only twelve', 'as many as sheep'] },
    { q: 'What does Sarah do when the guests promise her a son?', options: ['She laughs quietly.', 'She cries.', 'She runs away.'] },
    { q: 'What is the name of Abraham and Sarah’s son?', options: ['Isaac', 'Lot', 'Eliezer'] },
    { q: 'Who provides the animal for the offering on the mountain?', options: ['God', 'Isaac', 'the servants'] }
  ]
}
