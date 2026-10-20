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
      audio: 'audio/abenteuer/abraham/geschichte-01-en-v3.mp3',
      text: [
        'After the tower of Babel, the people spread out over the whole earth, but God did not lose sight of them. In the city of Haran lives a man named Abram with his wife Sarai, and God calls him in particular, so that something completely new can begin through him.',
        'One day God says to him, “Leave your country, your relatives, and your father’s house, and go to the land that I will show you. I will make you a great nation and bless you, and you will be a blessing yourself. Through you all the families of the earth will be blessed.”',
        'Abram does not stop to ask where he is going. He trusts God and sets out, even though he is already seventy-five years old. His wife Sarai goes with him, and so does his nephew Lot, along with all the people who belong to them, and they take everything they own.',
        'So they travel into the land of Canaan, as far as the great trees at Shechem. There God says to Abram, “I will give this land to your descendants.” Then Abram builds an altar to thank God. After that he moves on to the hills near Bethel, pitches his tent, builds another altar, and prays to God.'
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
      audio: 'audio/abenteuer/abraham/geschichte-02-en-v2.mp3',
      text: [
        'Abram has become rich, and Lot, too, has large herds and many tents. But the land is too small for the two of them. Soon there is quarreling between Abram’s shepherds and Lot’s shepherds.',
        'When Abram hears this, he goes to Lot and says, “There must be no quarreling between you and me, or between our shepherds, because we are family. The whole land lies before you. Let us part. Choose where you want to go, and I will go the other way.” Abram is the older one, and yet he lets Lot choose first.',
        'Lot looks around. He sees the wide plain along the Jordan River, green and well watered, as lovely as a garden of God. Lot chooses this plain and goes east with his herds, and he pitches his tents near the city of Sodom. But the people of Sodom are wicked in God’s eyes.',
        'Abram stays in the land of Canaan. Then God says to him, “Look around, to the north and the south, to the east and the west! All the land that you see I will give to you and your descendants forever. They will be as many as the dust of the earth.” So Abram moves on and pitches his tent by the great oaks of Mamre.'
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
      audio: 'audio/abenteuer/abraham/geschichte-03-en-v3.mp3',
      text: [
        'Many years have passed, and Abram and Sarai still have no child. One day God’s word comes to Abram: “Do not be afraid, Abram! I am your shield, and I will reward you greatly.”',
        'Sadly, Abram answers: “Lord, what can you give me? I have no son. When I die, one of my servants will get everything I own.” But God says, “No, this servant will not be your heir, but your own son.”',
        'Then God leads Abram outside, under the night sky. “Look up at the sky,” he says, “and count the stars, if you can!” Abram looks up. The sky sparkles with countless stars. “That is how many descendants you will have,” says God.',
        'Abram cannot count them, there are so many. But he believes what God promises him, even though he and Sarai are old and still have no child. And God counts this trust as righteousness: in God’s eyes, Abram stands right before him.'
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
      audio: 'audio/abenteuer/abraham/geschichte-04-en-v3.mp3',
      text: [
        'By now God has given Abram and Sarai new names: Abram is now called Abraham, which means “father of many,” and Sarai is called Sarah. Both have grown very old.',
        'It is noon and hot. Abraham is sitting at the entrance of his tent by the great oaks of Mamre when God visits him. He looks up and sees three men standing in front of him.',
        'At once he runs to meet them and bows low. “Please stay with me,” he says. “I will have water brought so you can wash your feet, and you can rest under the tree. I will fetch a bit of bread.” Then he hurries into the tent and says to Sarah, “Quick, bake bread for our guests!” And he picks out a young calf.',
        'When everything is ready, Abraham sets bread, butter, milk, and meat in front of the men. “Where is Sarah, your wife?” they ask. “In the tent,” he answers. Then one of them says, “In a year I will come back to you, and Sarah will have a son.”',
        'Sarah is standing behind the tent door and hears it. She laughs quietly to herself: “I am much too old for that!” “Why is Sarah laughing?” asks the guest. “Is anything too hard for God?” Sarah is startled: “I did not laugh.” But he answers, “Yes, you did laugh.”'
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
      audio: 'audio/abenteuer/abraham/geschichte-05-en-v2.mp3',
      text: [
        'A year goes by, and then exactly what God promised happens: Sarah has a son, at the very time God had named. Twenty-five years have passed since Abraham left Haran, and now he is one hundred years old.',
        'Abraham gives the child the name God told him: Isaac. It means “he laughs,” and no name could fit this story better.',
        'Sarah holds her son in her arms and says, “God has given me laughter. Everyone who hears about it will laugh with me.” And she adds, “Who would ever have told Abraham that Sarah would have a child at her breast? And now I have borne him a son, even though he is so old.”',
        'Now there is a baby in the tent, one that the two of them have waited for so long. Sarah laughs, Abraham laughs, and both know: God has kept his word.'
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
      audio: 'audio/abenteuer/abraham/geschichte-06-en-v2.mp3',
      text: [
        'Isaac has grown into a boy. One day God wants to see whether Abraham trusts him completely. “Abraham!” he calls. “Here I am.” And God says, “Take Isaac, your son, whom you love so much, and go with him to the land of Moriah. On a mountain that I will show you, you are to offer him to me.” A hard test, yet Abraham trusts God.',
        'The next morning Abraham loads his donkey with wood and sets out with Isaac and two servants. On the third day he sees the mountain and says to the servants, “Stay here with the donkey. The boy and I will go up there to pray, and then we will come back to you.”',
        'Isaac carries the wood up the mountain. He asks, “Father, where is the animal for the offering?” Abraham answers, “My son, God himself will provide the animal for the offering.”',
        'At the top Abraham builds an altar and lays the wood ready. Then a voice calls from heaven, “Abraham! Abraham!” “Here I am,” he answers. “Do not harm the boy!” says the voice. “Now I know that you trust God.”',
        'Abraham looks up and sees a ram caught by its horns in a thicket. He offers it to God in Isaac’s place. Isaac stands safe and sound next to his father, and Abraham calls the place “God Provides.”'
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
