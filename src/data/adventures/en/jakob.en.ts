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
      text: [
        'Isaac and his wife Rebekah have twins. The first is red and hairy, and his name is Esau. The second holds on to his brother’s heel at birth, so they call him Jacob.',
        'The two grow up. Esau becomes a hunter and loves to roam the fields. Jacob prefers to stay near the tents.',
        'One day Esau comes home tired and hungry. Jacob has just cooked red lentils. “Let me eat some of that red stew,” begs Esau, “I am starving!”',
        'Jacob answers, “Then sell me your birthright today.” That is the special place of the oldest son in the family. “What good is it to me if I starve?” says Esau. He eats, gets up, and goes away. His birthright does not matter to him.'
      ],
      task: { hint: 'Cook the soup before Esau arrives: tap lentils, water and wood.', stew: { hint: 'Cook the soup before Esau arrives: tap lentils, water and wood.' } },
      questions: [
        { q: 'What does Esau give away for the lentil stew?', options: ['his birthright', 'his tent', 'his bow'] },
        { q: 'What does Jacob hold on to at birth?', options: ['his brother’s heel', 'his father’s hand', 'his mother’s staff'] }
      ]
    },
    {
      title: 'The Blessing',
      ref: 'Genesis 27:1–45',
      text: [
        'Isaac has grown old and can hardly see. He calls Esau, “Go hunting and cook my favorite meal. Then I will bless you.”',
        'But Rebekah has been listening. She helps Jacob dress up as Esau and sends him to his father with the food.',
        '“Who are you?” asks Isaac. “I am Esau,” says Jacob. That is not true. Isaac feels his hands and wonders, “The voice is Jacob’s voice, but the hands are Esau’s hands.” Still, he blesses him: God shall give him much good.',
        'When Esau comes home, he understands everything and weeps aloud. The blessing has already been given. Esau is sad and angry, and Jacob has to flee. Rebekah sends him to her brother Laban. Jacob packs his bundle and goes, far away from home.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who can hardly see?', options: ['Isaac', 'Laban', 'Esau'] },
        { q: 'Where does Jacob have to go afterward?', options: ['to Laban', 'to Esau', 'to the sea'] }
      ]
    },
    {
      title: 'The Heavenly Stairway',
      ref: 'Genesis 28:10–19',
      text: [
        'Jacob is traveling alone. When it gets dark, he lies down outside and pushes a stone under his head.',
        'Then he dreams of a stairway that reaches from the earth up to heaven. Angels of God go up and down on it.',
        'And God speaks, “I am the God of your fathers Abraham and Isaac. I will give you this land. I am with you and will watch over you wherever you go. I will bring you back home and will not leave you.”',
        'Jacob wakes up. “How holy this place is!” he cries. “God is here, and I did not know it.” He sets up the stone that was his pillow and calls the place Bethel, which means House of God.'
      ],
      task: { hint: 'Slide the tiles until the stairway to heaven is whole again.', slide: { rounds: [{ hint: 'Round 1: Slide a tile into the free gap.' }, { hint: 'Round 2: Now there are more tiles.' }] } },
      questions: [
        { q: 'What does Jacob use as a pillow?', options: ['a stone', 'a fur', 'a sack'] },
        { q: 'What does God say to Jacob?', options: ['“I am with you.”', '“Go back to Esau.”', '“Stay here forever.”'] }
      ]
    },
    {
      title: 'At the Well',
      ref: 'Genesis 29:1–14',
      text: [
        'Jacob reaches the land of his relatives. In a field lies a well with a heavy stone over it, and shepherds are waiting there with their sheep. “We can only roll the stone away when all the flocks are here,” they say.',
        'Then Rachel comes with the sheep of her father Laban. Jacob pushes the stone from the well all by himself and waters her sheep.',
        'Then he tells her who he is: “I am your relative, the son of Rebekah.” He kisses her in greeting and weeps for joy. Rachel runs home and tells her father.',
        'Laban comes running, hugs Jacob, and takes him into his house. After the long journey, Jacob has found a place where he may stay.'
      ],
      task: { hint: 'Turn the crank in a circle with your finger.', crank: { rounds: [{ hint: 'Round 1: Fetch a bucket of water for the sheep.' }, { hint: 'Round 2: Now the sheep need two buckets.' }] } },
      questions: [
        { q: 'What lies over the well that Jacob finds?', options: ['a heavy stone', 'a wooden lid', 'a cloth'] },
        { q: 'Who comes to the well with the sheep?', options: ['Rachel', 'Leah', 'Rebekah'] }
      ]
    },
    {
      title: 'Seven Years for Rachel',
      ref: 'Genesis 29:15–30',
      text: [
        'Jacob stays with Laban and helps with the herds. “You should not work for nothing,” says Laban. “What do you want as wages?”',
        'Jacob loves Rachel. “I will serve you seven years for Rachel,” he says. Laban agrees. The seven years seem to Jacob like only a few days, so much does he love her.',
        'Then they celebrate the wedding, but in the morning Jacob notices that Laban has deceived him. He has not given him Rachel but her older sister Leah. “Why have you done this?” asks Jacob. “In our country the older one marries first,” says Laban.',
        '“Serve me another seven years,” says Laban, “then you will get Rachel, too.” Jacob agrees and stays.'
      ],
      task: { hint: 'Drag the seasons into the gaps, year after year.', cycle: { tokens: [{ label: 'Spring: a branch with blossoms' }, { label: 'Summer: a sun with ears of grain' }, { label: 'Autumn: falling leaves' }, { label: 'Winter: a rain cloud with drops' }], rounds: [{ hint: 'Two years go by. Which sign is missing?' }, { hint: 'The years go by. Fill in the missing signs, even at the end.' }] } },
      questions: [
        { q: 'How many years does Jacob serve for Rachel at first?', options: ['seven', 'two', 'twenty'] },
        { q: 'Whom does Jacob marry first?', options: ['Leah', 'Rachel', 'Rebekah'] }
      ]
    },
    {
      title: 'The Big Family',
      ref: 'Genesis 29:31 to 30:24',
      text: [
        'Jacob loves Rachel more than Leah. But God sees that Leah is sad, and he gives her a son. “God has seen my misery,” says Leah, and she names him Reuben.',
        'After that she has more sons, and at the fourth she cries, “Now I will thank God!” His name is Judah.',
        'But Rachel has no child. That makes her sad, because her sister has so many. She waits and prays, year after year.',
        'At last God gives her a son, too. “God has taken my shame away,” says Rachel happily, and she names him Joseph. Jacob’s tents are now full of children.'
      ],
      task: { hint: 'Tap the children, they run to the tent.', catch: { rounds: [{ hint: 'Tap the children. Each one runs to the tent.' }, { hint: 'The family grows. Call five more children.' }] } },
      questions: [
        { q: 'What does Leah cry when Judah is born?', options: ['“Now I will thank God!”', '“Now I will sleep!”', '“I want to leave!”'] },
        { q: 'What is Rachel’s son called?', options: ['Joseph', 'Reuben', 'Judah'] }
      ]
    },
    {
      title: 'The Herds Grow',
      ref: 'Genesis 30:25 to 31:16',
      text: [
        'Jacob works for Laban for many years, and God blesses him. He becomes very rich, and his herds of sheep, goats, and camels grow larger and larger.',
        '“Let me go home,” he asks Laban. But Laban does not want to let him go, for he has noticed that God blesses him because of Jacob. Jacob sees it, too: soon Laban does not look friendly anymore.',
        'Then God speaks to Jacob, “Go back to the land of your fathers. I will be with you.”',
        'Jacob calls Rachel and Leah out into the field and tells them. “Do everything God has told you,” the two say. So Jacob gets ready.'
      ],
      task: { hint: 'Compare the herds and guess how many animals there are.', guess: { rounds: [{ hint: 'Which herd is bigger? Tap it.' }, { hint: 'About how many animals are there? Choose what fits best.' }] } },
      questions: [
        { q: 'What does Jacob ask Laban?', options: ['to let him go home', 'to give him more sheep', 'to build him a tent'] },
        { q: 'What does God say to Jacob?', options: ['“Go back to the land of your fathers.”', '“Stay with Laban.”', '“Build a city.”'] }
      ]
    },
    {
      title: 'The Way Home',
      ref: 'Genesis 31:17–55',
      text: [
        'Jacob loads his wives and children onto the camels, gathers the herds, and sets out in secret. Laban is far away with his sheep just then.',
        'After seven days Laban catches up with him in the hills. But the night before, God has spoken to Laban in a dream, “Be careful not to speak harshly to Jacob!”',
        '“Why did you leave in secret?” asks Laban. “I served you for twenty years,” says Jacob. “If God had not been with me, you would have sent me away empty-handed.”',
        'Then the two make peace. They pile up stones into a heap and eat beside it. “This heap shall be a witness between you and me,” says Laban. The next morning he kisses his daughters and grandchildren, blesses them, and goes home.'
      ],
      task: { hint: "Push Jacob's and Laban's stones to the middle together.", cairn: { rounds: [{ hint: 'Push both stones to the middle together. Tap left and right in turn.' }, { hint: 'Once more, now with four stones.' }] } },
      questions: [
        { q: 'Who speaks to Laban in a dream?', options: ['God', 'Jacob', 'Isaac'] },
        { q: 'What does the heap of stones between Jacob and Laban stand for?', options: ['It is to be a witness of their peace.', 'It is a house for Laban.', 'It is a grave.'] }
      ]
    },
    {
      title: 'Angels and Gifts',
      ref: 'Genesis 32:1–21',
      text: [
        'Jacob travels on. Angels of God meet him. “This is God’s camp!” he cries.',
        'Then the messengers he sent ahead to his brother return, “Esau is coming to meet you, with four hundred men.” Jacob is very afraid.',
        'He prays, “God, you said you would do me good. I am too small for all you have given me. Save me from the hand of my brother!”',
        'Then Jacob picks out gifts for Esau: herds of goats, sheep, and camels. His servants are to drive them ahead of him. “Leave space between one herd and the next,” he says. Maybe Esau will be friendly when he sees the gifts.'
      ],
      task: { hint: 'Send the herds off with room between them.', relay: { rounds: [{ hint: 'Send the herds off one after the other. Leave room between them.' }, { hint: 'Four more herds. The room may be a little narrower now.' }] } },
      questions: [
        { q: 'Whom does Jacob meet on the way?', options: ['angels of God', 'robbers', 'shepherds'] },
        { q: 'What does Jacob do when he hears about Esau’s men?', options: ['He prays to God.', 'He runs away.', 'He builds a wall.'] }
      ]
    },
    {
      title: 'Wrestling at the River',
      ref: 'Genesis 32:22–32',
      text: [
        'In the night Jacob brings his family across the Jabbok River. He himself stays behind alone. Then a man wrestles with him until morning comes and touches his hip. From then on it hurts.',
        '“Let me go,” says the man, “the day is breaking.” “I will not let you go,” says Jacob, “unless you bless me!”',
        '“You will no longer be called Jacob, but Israel,” says the man, “for you have struggled with God and with people and have not given up.” And he blesses him.',
        'The sun rises. “I have seen God face to face,” says Jacob, “and I am still alive.” He walks on, limping, but he has a new name and God’s blessing.'
      ],
      task: { hint: 'Hold the light until morning comes.', hold: { rounds: [{ hint: 'Round 1: Put your finger on the light and hold it.' }, { hint: 'Round 2: Now the light moves along the bank: go with it.' }] } },
      questions: [
        { q: 'At which river is Jacob that night?', options: ['the Jabbok', 'the Jordan', 'the Nile'] },
        { q: 'What new name does Jacob receive?', options: ['Israel', 'Esau', 'Isaac'] }
      ]
    },
    {
      title: 'Reunion',
      ref: 'Genesis 33:1–11',
      text: [
        'In the morning Jacob sees Esau coming, with four hundred men. He walks ahead of everyone alone and bows low.',
        'But Esau runs to meet him! He hugs Jacob, throws his arms around his neck, and kisses him. Both weep for joy.',
        '“Who are these with you?” asks Esau when he sees the women and children. “The children God has given me,” says Jacob.',
        'Then Jacob offers him his herds as a gift. “I have enough, my brother,” says Esau. But Jacob pleads, “Please take it! Seeing your face is like seeing the face of God, you are so kind to me.” Then Esau accepts the gift. The quarrel of the brothers is over.'
      ],
      task: { hint: 'Put the picture of the reunion together.' },
      questions: [
        { q: 'What does Esau do when he sees Jacob?', options: ['He runs to him and hugs him.', 'He runs away.', 'He sends him away.'] },
        { q: 'What does Jacob offer his brother?', options: ['his herds as a gift', 'his tent', 'his staff'] }
      ]
    },
    {
      title: 'Twelve Sons',
      ref: 'Genesis 35:1–18; 35:22–26; 37:1–4',
      text: [
        'God says to Jacob, “Go to Bethel and build an altar there.” Jacob goes there with his whole family and builds the altar. God speaks to him once more, “You shall be called Israel.”',
        'On the way Benjamin is born, and his mother Rachel dies. Jacob is very sad and sets up a stone on her grave.',
        'Now Jacob has twelve sons, and from them a great people shall come, as God promised. He loves Joseph best, the son of his old age.',
        'Joseph is seventeen years old and tends the sheep with his brothers. Jacob loves him so much that he has a colorful robe made for him.'
      ],
      task: { hint: 'Place the twelve sons evenly round the altar.', ring: { rounds: [{ hint: 'Place the four sons on the places round the altar.' }, { hint: 'Now all twelve. Each one has his place.' }] } },
      questions: [
        { q: 'Where does Jacob go at God’s word?', options: ['to Bethel', 'to Haran', 'to Egypt'] },
        { q: 'Which son does Jacob love best?', options: ['Joseph', 'Benjamin', 'Reuben'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Esau give away for a plate of lentils?', options: ['his birthright', 'his tent', 'his bow'] },
    { q: 'What does Jacob use as a pillow in Bethel?', options: ['a stone', 'a fur', 'a sack'] },
    { q: 'Whom does Jacob meet at the well?', options: ['Rachel', 'Leah', 'Rebekah'] },
    { q: 'Who speaks to Laban in a dream?', options: ['God', 'Jacob', 'Isaac'] },
    { q: 'What new name does Jacob receive at the river?', options: ['Israel', 'Esau', 'Isaac'] },
    { q: 'Which son does Jacob love best?', options: ['Joseph', 'Benjamin', 'Reuben'] }
  ]

}
