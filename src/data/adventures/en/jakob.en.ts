/**
 * English texts of the adventure "Jacob" (8 to 10 years): the same shape as `../jakob.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Jacob, Esau, Rebekah, Laban, Bethel, Israel); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Jakob/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const jakobEn: TextOverlay<Journey> = {
  title: 'Jacob',
  subtitle: 'A Road with Detours',
  gift: { title: 'Jacob and the Heavenly Stairway in a Dream' },
  stages: [
    {
      title: 'Twins',
      ref: 'Genesis 25:19–34',
      audio: 'audio/abenteuer/jakob/geschichte-01-en-v1.mp3',
      text: [
        'Isaac, the son Abraham had waited for so long, became a father himself. He and his wife Rebekah wait a long time for a child. Isaac prays to God, and Rebekah has twins.',
        'The first boy is reddish and covered with hair. They name him Esau. The second one comes right behind and holds on to his brother’s heel. That is why they name him Jacob.',
        'The two grow up and are very different. Esau becomes a hunter and likes to be outside in the fields. Jacob is quiet and stays near the tents. Isaac is especially fond of Esau, and Rebekah is especially fond of Jacob.',
        'One day Esau comes home tired and hungry. Jacob is just cooking a lentil stew. “Give me some of that red stew, quick!” says Esau. Jacob answers, “Then give me your birthright.” That is the special place of the oldest son in the family. Esau swears it to him, eats, and goes away. His birthright did not matter to him.'
      ],
      task: { hint: 'Tap the sheep and count them.' },
      questions: [
        { q: 'What are the twins of Isaac and Rebekah called?', options: ['Esau and Jacob', 'Isaac and Lot', 'Cain and Abel'] },
        { q: 'What does Esau give away for the lentil stew?', options: ['his birthright', 'his tent', 'his bow'] }
      ]
    },
    {
      title: 'The Blessing',
      ref: 'Genesis 27:1–45',
      audio: 'audio/abenteuer/jakob/geschichte-02-en-v1.mp3',
      text: [
        'Isaac has grown old, and his eyes are so weak that he can hardly see anything. He calls Esau, “Hunt some game for me and make my favorite meal. Then I will bless you.”',
        'Rebekah hears it. She says to Jacob, “Get the blessing in Esau’s place!” Jacob hesitates, but he does it. He puts on Esau’s clothes and lays goatskin on his hands and neck so that he feels like his brother. Then he brings his father the meal.',
        '“Are you really Esau?” asks Isaac. He feels the fur and smells the clothes. “Yes,” says Jacob. That is not true. Isaac believes it and blesses him.',
        'Hardly has Jacob left when Esau comes back. Isaac is shocked when he realizes what has happened. Esau is sad and disappointed, “Bless me, too!” But the blessing has been given. Esau is angry with his brother.',
        'So Rebekah sends Jacob to her brother Laban in Haran, far away. Jacob packs his bundle and goes. He has deceived his father, and that has consequences: He has to leave his home.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who is old and can hardly see?', options: ['Isaac', 'Laban', 'Esau'] },
        { q: 'What does Jacob put on his hands and neck?', options: ['goatskin', 'flour', 'clay'] },
        { q: 'Where does Rebekah send Jacob?', options: ['to her brother Laban', 'to Esau', 'to the sea'] }
      ]
    },
    {
      title: 'The Heavenly Stairway',
      ref: 'Genesis 28:10–22',
      audio: 'audio/abenteuer/jakob/geschichte-03-en-v1.mp3',
      text: [
        'Jacob is traveling alone toward Haran. When it gets dark, he stops at a lonely place. He takes a stone for a pillow and lies down to sleep.',
        'Then he dreams: A stairway stands on the earth, and its top reaches up to heaven. It glows in the night. Messengers of God go up and down on it.',
        'At the top God speaks to him, “I am the God of your fathers Abraham and Isaac. The land you are lying on I will give to you and your descendants. I am with you and watch over you wherever you go. I will bring you back to this land, and I will not leave you.”',
        'Jacob wakes up. “God is in this place,” he says, “and I did not know it!” In the morning he sets up the stone as a sign and pours oil over it. He calls the place Bethel, which means “house of God.” Then he travels on.'
      ],
      task: { hint: 'Slide the tiles until the stairway to heaven is whole again.', slide: { rounds: [{ hint: 'Round 1: Slide a tile into the free gap.' }, { hint: 'Round 2: Now there are more tiles.' }] } },
      questions: [
        { q: 'What does Jacob use as a pillow?', options: ['a stone', 'a fur', 'a sack'] },
        { q: 'What does Jacob call the place?', options: ['Bethel', 'Haran', 'Mamre'] }
      ]
    },
    {
      title: 'At Laban’s',
      ref: 'Genesis 29:1–30',
      audio: 'audio/abenteuer/jakob/geschichte-04-en-v1.mp3',
      text: [
        'Jacob comes to the land of his relatives. In a field he sees a well covered by a large stone. Shepherds with their sheep are waiting there. “Do you know Laban?” asks Jacob. “Yes,” they say, “and here comes his daughter Rachel with the sheep!”',
        'Jacob rolls the stone away from the well and waters Laban’s sheep. He tells Rachel that he is the son of her aunt Rebekah. Rachel runs home, and Laban hurries out and welcomes Jacob warmly.',
        'Jacob works for Laban. He loves Rachel very much. “I will work seven years for you,” he says to Laban, “if I may marry Rachel.” The seven years seem like only a few days to him, because he loves her so much.',
        'But on the wedding day Laban brings not Rachel but her older sister Leah to him. “In our country the older one marries first,” says Laban. Jacob works another seven years, and then he may marry Rachel, too. So he stays with Laban for many years.'
      ],
      task: { hint: 'Turn the crank in a circle with your finger.', crank: { rounds: [{ hint: 'Round 1: Fetch a bucket of water for the sheep.' }, { hint: 'Round 2: Now the whole flock is drinking: three buckets.' }] } },
      questions: [
        { q: 'Whom does Jacob meet at the well?', options: ['Rachel', 'Leah', 'Rebekah'] },
        { q: 'How many years does Jacob work for Rachel at first?', options: ['seven', 'two', 'twenty'] }
      ]
    },
    {
      title: 'Wrestling at the River',
      ref: 'Genesis 32:22–32',
      audio: 'audio/abenteuer/jakob/geschichte-05-en-v1.mp3',
      text: [
        'Many years later Jacob travels back with his big family and his herds to the land God promised him. He hears that Esau is coming to meet him with many men. Jacob is afraid that his brother may still be angry. He sends gifts from his herds ahead.',
        'In the night he brings his family and everything he has across the Jabbok River. He himself stays behind alone on the other side.',
        'Then a man wrestles with him until morning comes. When it gets light, the man says, “Let me go!” Jacob answers, “I will not let you go unless you bless me.”',
        '“What is your name?” asks the man. “Jacob,” he answers. “You will no longer be called Jacob, but Israel. For you have struggled with God and with people and have not given up.” He blesses Jacob there.',
        'Jacob calls the place Peniel. “I have seen God,” he says, “and I am still alive.” The sun rises. Jacob walks on, limping, because his hip hurts.'
      ],
      task: { hint: 'Hold the light until morning comes.', hold: { rounds: [{ hint: 'Round 1: Put your finger on the light and hold it.' }, { hint: 'Round 2: Now the light moves along the bank: go with it.' }] } },
      questions: [
        { q: 'At which river is Jacob that night?', options: ['the Jabbok', 'the Jordan', 'the Nile'] },
        { q: 'What new name does the man give Jacob?', options: ['Israel', 'Esau', 'Isaac'] }
      ]
    },
    {
      title: 'Reunion',
      ref: 'Genesis 33:1–11',
      audio: 'audio/abenteuer/jakob/geschichte-06-en-v1.mp3',
      text: [
        'In the morning Jacob sees Esau coming with many men. Jacob lines up his family. He himself goes ahead and bows down to his brother, again and again, seven times to the ground.',
        'But Esau runs to meet him! He throws his arms around Jacob’s neck and kisses him. They both weep for joy.',
        '“Who are these women and children?” asks Esau. “They are the children God has given me,” says Jacob. They all come forward and bow.',
        'Then Jacob points to the herds. “This is my gift for you,” he says. “I have enough, keep what you have,” says Esau. But Jacob pleads, “Please take it! Seeing your face is like seeing the face of God, you have welcomed me so kindly.” Then Esau accepts the gift. God was with Jacob, just as he had promised.'
      ],
      task: { hint: 'Put the picture of the reunion together.' },
      questions: [
        { q: 'What does Esau do when he sees Jacob?', options: ['He runs to him and hugs him.', 'He runs away.', 'He sends him away.'] },
        { q: 'What does Jacob bring his brother?', options: ['animals as a gift', 'a sword', 'a tent'] }
      ]
    }
  ],
  exam: [
    { q: 'What are the twins of Isaac and Rebekah called?', options: ['Esau and Jacob', 'Isaac and Lot', 'Cain and Abel'] },
    { q: 'What does Jacob put on his hands so that his father takes him for Esau?', options: ['goatskin', 'flour', 'clay'] },
    { q: 'What does Jacob use as a pillow in the night?', options: ['a stone', 'a fur', 'a sack'] },
    { q: 'Whom does Jacob meet at the well?', options: ['Rachel', 'Leah', 'Rebekah'] },
    { q: 'What is Jacob called after that night at the river?', options: ['Israel', 'Esau', 'Isaac'] },
    { q: 'What does Esau do when he sees Jacob again?', options: ['He runs to him and hugs him.', 'He runs away.', 'He sends him away.'] }
  ]
}
