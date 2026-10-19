/**
 * English texts of the adventure "Joseph" (8 to 10 years): the same shape as `../josef.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World
 * English Bible (Joseph, Jacob, Reuben, Judah, Potiphar, Pharaoh, cupbearer); the stories are retold in our own words. The source
 * as a readable file: D:/Claude/Abenteuer-Noah/ENGLISCH/Josef/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

const REC = 'audio/abenteuer/josef/'
const rec = (n: number) => `${REC}geschichte-${String(n).padStart(2, '0')}-en-v1.mp3`

export const josefEn: TextOverlay<Journey> = {
  title: 'Joseph',
  subtitle: 'From Favorite Son to Ruler of Egypt',
  gift: { title: 'Joseph in His Colorful Coat' },
  stages: [
    {
      title: 'The Favorite Son',
      ref: 'Genesis 37:1–4',
      audio: rec(1),
      text: [
        'Joseph is seventeen years old. He lives with his father Jacob and his brothers in the land of Canaan, and like his older brothers he looks after the sheep.',
        'Jacob loves Joseph more than all his other sons, because Joseph is the son who was born to him when he was old. One day he gives Joseph a colorful coat. None of the brothers has one like it. Joseph puts it on and is happy.',
        'The brothers see the coat. They also see how their father looks at Joseph. Their stomachs burn with envy. They cannot say a friendly word to Joseph anymore, and soon they hate him.'
      ],
      task: { hint: 'Put the colorful coat together.' },
      questions: [
        { q: 'What does Jacob give to Joseph?', options: ['a colorful coat', 'a shepherd’s staff', 'a lamb'] },
        { q: 'Why does Jacob love Joseph more than his other sons?', options: ['He was born to him when he was old', 'He works the hardest', 'He is the strongest'] }
      ]
    },
    {
      title: 'The Dreams',
      ref: 'Genesis 37:5–11',
      audio: rec(2),
      text: [
        'One night Joseph has a dream. In the morning he tells it to his brothers: “We were tying grain into sheaves in the field. My sheaf stood up straight and stayed standing. Your sheaves stood in a circle around it and bowed down to it.”',
        '“Do you think you will be our king and rule over us?” the brothers ask. The dream and his words make them even angrier.',
        'Not long after, Joseph dreams again. “The sun, the moon, and eleven stars bowed down to me,” he tells them. Even his father shakes his head: “Are we all supposed to fall down before you?”',
        'The brothers become jealous of Joseph. But Jacob does not forget the dream.'
      ],
      task: { hint: 'Tap the stars in the night sky and count them.' },
      questions: [
        { q: 'What bowed down in the first dream?', options: ['sheaves of grain', 'sheep', 'camels'] },
        { q: 'Who asks, ‘Are we all supposed to fall down before you?’', options: ['Joseph’s father', 'Reuben', 'a merchant'] }
      ]
    },
    {
      title: 'The Brothers',
      ref: 'Genesis 37:12–24',
      audio: rec(3),
      text: [
        'The brothers are looking after the sheep far from home. Jacob says to Joseph, “Go and see whether they are well.” Joseph sets out on the long road. In a field a man finds him and tells him where the brothers have gone: to Dothan.',
        'The brothers see him coming from far away. “Look, here comes the dreamer!” they shout. They are so angry with him that they want to get rid of him. When Joseph arrives, they take his colorful coat away and throw him into a deep pit with no water in it.',
        'Only Reuben, the oldest brother, wants to help Joseph. “Do not hurt him!” he says. He hopes to bring Joseph back to their father later.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Jacob send Joseph?', options: ['to his brothers', 'to the market', 'to Egypt'] },
        { q: 'Who wants to help Joseph?', options: ['Reuben', 'Judah', 'Benjamin'] },
        { q: 'What do the brothers take away from him?', options: ['the colorful coat', 'his shoes', 'his food'] }
      ]
    },
    {
      title: 'On the Way to Egypt',
      ref: 'Genesis 37:25–36',
      audio: rec(4),
      text: [
        'The brothers sit down to eat. Then they see a long caravan with many camels. The merchants are on their way to Egypt, and they carry fragrant resin, balm, and myrrh.',
        'Judah says, “We do not want to kill Joseph. He is our brother, after all. Let us sell him instead.” The others agree. For twenty pieces of silver, Joseph goes to Egypt with the caravan.',
        'The brothers bring the colorful coat to their father, but they do not tell him the truth. Jacob recognizes the coat and weeps for his son. His children try to comfort him, but he will not be comforted. For many days he mourns.',
        'Far away in Egypt, a man named Potiphar buys Joseph. He is an officer of the king, the Pharaoh.'
      ],
      task: { hint: 'Follow the tracks of the caravan. Look closely at the roads.' },
      questions: [
        { q: 'Who suggests selling Joseph?', options: ['Judah', 'Reuben', 'Jacob'] },
        { q: 'Who buys Joseph in Egypt?', options: ['Potiphar', 'the Pharaoh', 'Judah'] }
      ]
    },
    {
      title: 'At Potiphar’s House',
      ref: 'Genesis 39:1–6',
      audio: rec(5),
      text: [
        'In Egypt, Joseph is now a servant in Potiphar’s house. He is a stranger in the land and far away from his family. But he is not alone: God is with him. Whatever Joseph does succeeds, and Potiphar sees it with his own eyes.',
        'He makes Joseph his steward. Joseph may look after everything, in the house and in the fields. Potiphar trusts him with everything he owns.',
        'And God blesses Potiphar’s house because Joseph works there. Potiphar does not have to worry about anything anymore, except his own food.'
      ],
      task: { hint: 'Tap the fruit and vegetables in Potiphar’s fields. Stones and thorns do not belong in the basket.' },
      questions: [
        { q: 'Who is with Joseph in Egypt?', options: ['God', 'nobody', 'his brother'] },
        { q: 'What does Potiphar make Joseph?', options: ['his steward', 'his cook', 'his guard'] }
      ]
    },
    {
      title: 'In Prison',
      ref: 'Genesis 39:7–23',
      audio: rec(6),
      text: [
        'Then something terrible happens. Potiphar’s wife tells her husband a lie about Joseph. Joseph has done nothing wrong, but Potiphar believes the lie and becomes angry.',
        'He has Joseph taken to prison, where the king’s prisoners are kept. The steward of a great house is now a prisoner, and he is innocent.',
        'But God is with Joseph there, too. The jailer likes him and trusts him. Soon Joseph may take care of all the prisoners, and whatever he does succeeds.'
      ],
      task: {
        hint: 'Color the whole picture.',
        jobs: [
          { hint: 'Color the beam of light yellow.' },
          { hint: 'Color the jug brown.' },
          { hint: 'Color Joseph’s robe with watercolor.' },
          { hint: 'Color Joseph’s robe with the felt-tip marker.' },
          { hint: 'Color the rug with colored pencil.' },
          { hint: 'Color the window with chalk.' }
        ]
      },
      questions: [
        { q: 'Why does Joseph end up in prison?', options: ['Potiphar believes a lie', 'Joseph stole something', 'Joseph ran away'] },
        { q: 'Who trusts Joseph in prison?', options: ['the jailer', 'Potiphar', 'the Pharaoh'] }
      ]
    },
    {
      title: 'Two Dreams in Prison',
      ref: 'Genesis 40',
      audio: rec(7),
      text: [
        'Soon two servants of the Pharaoh are in prison as well: his cupbearer, who pours his wine, and his baker. Both have upset the Pharaoh, and Joseph is to look after them. One morning they are very sad. “We had a dream,” they say, “and nobody can explain it.” Joseph says, “God can explain dreams. Tell me about them.”',
        'The cupbearer dreams of a vine with three branches. The grapes ripen, and he squeezes them into the Pharaoh’s cup. “In three days you may go back to the Pharaoh,” says Joseph. “Please remember me then! I have done nothing wrong.”',
        'To the baker, Joseph says that his dream means something sad. It happens just as Joseph said. The cupbearer may go back to the Pharaoh, but he forgets Joseph, and Joseph stays in prison.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: {
          pairs: [
            { text: 'The vine: This is what the cupbearer dreams of.' },
            { text: 'The Pharaoh’s cup: The cupbearer squeezes the grapes into it.' },
            { text: 'The cupbearer: He pours the wine for the Pharaoh.' },
            { text: 'The Pharaoh: The cupbearer may go back to him.' },
            { text: 'Joseph: He explains the dreams.' },
            { text: 'God: He can explain dreams, says Joseph.' }
          ]
        }
      },
      questions: [
        {
          q: 'What does Joseph say to the cupbearer?',
          options: ['In three days you may go back to the Pharaoh.', 'You will stay in prison forever.', 'You will get a sack full of gold.']
        },
        { q: 'What does Joseph ask of the cupbearer?', options: ['to remember him', 'to bring him food', 'to give him a new coat'] }
      ]
    },
    {
      title: 'The Pharaoh’s Dream',
      ref: 'Genesis 41:1–32',
      audio: rec(8),
      text: [
        'Two years later, the Pharaoh himself has a dream. He is standing by the Nile, and seven fat, beautiful cows come up out of the water and graze on the bank. Then seven thin, ugly cows come and eat up the fat ones. The Pharaoh wakes up and falls asleep again. He dreams of seven full ears of grain, and seven thin ears swallow them up.',
        'In the morning the Pharaoh is troubled. He sends for all the wise men of the land, but nobody can explain the dream. Then the cupbearer remembers Joseph. Joseph is brought out of prison, he is given fresh clothes, and he stands before the Pharaoh.',
        '“I cannot explain it,” he says, “but God will give the Pharaoh the answer.” Both dreams mean the same thing: Seven good years are coming, with a big harvest. After that come seven years of hunger.'
      ],
      task: { hint: 'Tap every cow and count along: the fat ones and the thin ones.', question: 'How many cows are there altogether?' },
      questions: [
        { q: 'Who gives the Pharaoh the answer?', options: ['God', 'the wise men', 'the cupbearer'] },
        { q: 'What comes after the seven good years?', options: ['seven years of hunger', 'seven years of rain', 'a big feast'] }
      ]
    },
    {
      title: 'The Storehouses',
      ref: 'Genesis 41:33–57',
      audio: rec(9),
      text: [
        'Joseph also tells the Pharaoh what to do: “Find a wise man and put him in charge of the land. In the good years he should gather a lot of grain, so that there is enough in the years of hunger.”',
        'The Pharaoh answers, “Who could be wiser than you? The Spirit of God is in you.” He makes Joseph ruler over all of Egypt. He gives him his signet ring, fine clothes, and a golden chain. Joseph is thirty years old by now. He was seventeen when he was sold to Egypt; now he stands next to the Pharaoh and rules the land.',
        'In the good years Joseph gathers so much grain that nobody can count it. Then the years of hunger come, and not only in Egypt. Joseph opens the storehouses. People from many countries come to Egypt to buy bread.'
      ],
      task: {
        hint: 'Drag each sack of grain into the storehouse with the same color or shape.',
        sort: {
          rounds: [
            { hint: 'Round 1: Drag each sack into the storehouse of the same color.' },
            { hint: 'Round 2: The color is missing! Look at the shape on the sack and find it on the storehouse.' },
            { hint: 'Round 3: Now all the colors are gone. Only the shapes can help you.' }
          ]
        }
      },
      questions: [
        { q: 'What does the Pharaoh give to Joseph?', options: ['a signet ring', 'a silver crown', 'a sword'] },
        { q: 'Why does Joseph gather the grain?', options: ['for the years of hunger', 'for a feast of the Pharaoh', 'for the trip to Canaan'] }
      ]
    },
    {
      title: 'The Brothers Come',
      ref: 'Genesis 42–44',
      audio: rec(10),
      text: [
        'In the land of Canaan, too, there is hardly any bread left. Jacob sends ten of his sons to Egypt to buy grain. Only Benjamin, the youngest, he keeps at home, because he is afraid that something might happen to him.',
        'The brothers stand before the ruler of Egypt and bow low before him. They do not know that he is Joseph. Joseph recognizes them at once. He speaks sternly to them and says they are spies. “Bring your youngest brother to me,” he says, “then I will believe you.” Simeon has to stay with him until they come back.',
        'When the hunger at home does not end, Jacob lets them go once more. Judah promises him to take care of Benjamin, and this time Benjamin goes with them. Joseph invites the brothers to eat in his house.',
        'Then Joseph has his silver cup put into Benjamin’s sack. When the cup is found, Joseph says, “Benjamin will stay with me. The rest of you may go home to your father in peace.” Then Judah steps forward. “Let me stay in his place,” he pleads. “I do not want my father to be so sad again.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Whom does Jacob keep at home?', options: ['Benjamin', 'Reuben', 'Judah'] },
        { q: 'What does Joseph first take the brothers for?', options: ['spies', 'friends', 'neighbors'] },
        { q: 'Who offers to stay in Benjamin’s place?', options: ['Judah', 'Reuben', 'Jacob'] }
      ]
    },
    {
      title: 'Joseph Tells Who He Is',
      ref: 'Genesis 45:1–15',
      audio: rec(11),
      text: [
        'After Judah’s words, Joseph cannot hold back any longer. He sends all his servants out so that he is alone with his brothers. He weeps so loudly that the whole house hears it. “I am Joseph!” he says. “Is my father still alive?” The brothers are so frightened that they cannot say a word.',
        '“Come closer to me,” Joseph says kindly. “I am your brother, the one you sold to Egypt. Do not be sad, and do not blame yourselves. God sent me ahead of you so that he could keep people alive.”',
        'Then Joseph hugs Benjamin, and both of them weep. He kisses all the other brothers, too. Everyone weeps. And at last the brothers talk with him.'
      ],
      task: {
        hint: 'Color the whole picture.',
        jobs: [
          { hint: 'Color the sky blue.' },
          { hint: 'Color the big jug brown.' },
          { hint: 'Color Joseph’s robe with watercolor.' },
          { hint: 'Color Joseph’s robe with colored pencil.' },
          { hint: 'Color the boy’s coat with the felt-tip marker.' },
          { hint: 'Color the boy’s coat with chalk.' },
          { hint: 'Color the pillars with colored pencil.' },
          { hint: 'Color the pillars with chalk.' }
        ]
      },
      questions: [
        { q: 'What does Joseph ask right after he says his name?', options: ['whether his father is still alive', 'whether they are hungry', 'whether Benjamin is well'] },
        { q: 'Who sent Joseph to Egypt, he says?', options: ['God', 'the Pharaoh', 'the merchants'] }
      ]
    },
    {
      title: 'Together Again',
      ref: 'Genesis 45:16–28; 46:1–4, 28–30; 47:28; 50:15–21',
      audio: rec(12),
      text: [
        'The Pharaoh is glad about Joseph’s brothers. “Bring your father and all your families,” he says. “You shall have the best of the land.” Joseph gives them wagons and food for the journey and says, “Do not quarrel on the way!”',
        'At home the brothers say, “Joseph is alive! He is ruler over all of Egypt.” At first Jacob cannot believe it. But when he sees the wagons, he becomes happy again. “Joseph is still alive! I want to see him before I die,” he says.',
        'Jacob sets out with his whole family. In the night God speaks to him: “Do not be afraid to go down to Egypt. I will go with you.” When Joseph sees his father coming, he rides out to meet him, throws his arms around his neck, and weeps for a long time.',
        'Jacob lives in Egypt for seventeen more years, and then he dies. The brothers are afraid that Joseph will take revenge now. But Joseph says, “Do not be afraid! You meant to do me harm, but God turned it into good.” He speaks kindly to them and comforts them.'
      ],
      task: { hint: 'Find the eleven brothers on the road to Egypt. Some of them are hiding!' },
      questions: [
        { q: 'What does Joseph do when he sees his father?', options: ['He throws his arms around him', 'He turns away', 'He bows down before him'] },
        { q: 'What does Joseph say to his brothers after Jacob’s death?', options: ['“Do not be afraid!”', '“Go away!”', '“Give me silver!”'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Jacob give to Joseph?', options: ['a colorful coat', 'a sword', 'a boat'] },
    { q: 'Where does the caravan take Joseph?', options: ['to Egypt', 'home', 'to the sea'] },
    { q: 'Who is with Joseph in Egypt?', options: ['God', 'nobody', 'the cupbearer'] },
    { q: 'What does Joseph gather in the good years?', options: ['grain', 'silver', 'sheep'] },
    { q: 'Who offers to stay in Benjamin’s place?', options: ['Judah', 'Reuben', 'Jacob'] },
    { q: 'How does the story end?', options: ['Joseph forgives his brothers', 'Joseph stays in prison', 'The brothers go away'] }
  ]
}
