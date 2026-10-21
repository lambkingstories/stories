/**
 * English texts of the adventure "Adam and Eve" (8 to 10 years): the same shape as `../adamEva.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Adam, Eve, Eden, Cain, cherubim); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Adam-Eva/ENGLISCH/.
 * The words of the gap sentences (stage 5) keep the order of the German words, so that the right answers fit both languages.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const adamEvaEn: TextOverlay<Journey> = {
  title: 'Adam and Eve',
  subtitle: 'The Garden of Eden',
  gift: { title: 'Adam and Eve in the Garden with the Animals' },
  stages: [
    {
      title: 'In the Beginning',
      ref: 'Genesis 1:1–13',
      text: [
        'At the very beginning God creates the heavens and the earth. The earth is empty and barren, and darkness lies over the water.',
        'Then God speaks, “Let there be light!” And there is light. God calls the light day and the darkness night. It becomes evening and morning: the first day.',
        'On the second day God stretches out a wide dome and calls it sky. Again it becomes evening and morning.',
        'On the third day God gathers the water in one place, and dry land appears. “Let the earth turn green!” he says. Grass grows, plants appear, and trees with fruit, and God sees that it is good.'
      ],
      task: { hint: 'Put the pictures in the order of the story.', order: { cards: [{ label: 'Darkness, with warm light breaking out' }, { label: 'The sky over the water' }, { label: 'Dry land rises from the sea' }, { label: 'Grass and trees grow' }], rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now without dots: What comes first, and what comes next?' }] } },
      questions: [
        { q: 'What does God say to make it bright?', options: ['“Let there be light!”', '“Let there be day!”', '“Let there be warmth!”'] },
        { q: 'What does God call the light?', options: ['day', 'night', 'sky'] }
      ]
    },
    {
      title: 'Sun, Moon, and Stars',
      ref: 'Genesis 1:14–23',
      text: [
        'On the fourth day God says, “Let there be lights in the sky! They shall separate day from night and show the seasons.”',
        'And so it happens. God makes two great lights, the sun for the day and the moon for the night, and the stars as well. He sees that it is good.',
        'On the fifth day God says, “Let the water teem with life, and let birds fly!” There are great sea creatures and small fish and birds in the air.',
        'God blesses them, “Be fruitful and become many!” Then it becomes evening and morning: the fifth day.'
      ],
      task: { hint: 'Tap the lights in the sky until it shines.', lights: { rounds: [{ hint: 'Round 1: Tap every light that lights up.' }, { hint: 'Round 2: Now several light up at once, and they are smaller.' }] } },
      questions: [
        { q: 'What are the lights in the sky for?', options: ['They separate day and night.', 'They warm the animals.', 'They water the garden.'] },
        { q: 'What does God say to the animals in the water and in the air?', options: ['“Be fruitful and become many!”', '“Be quiet!”', '“Move on!”'] }
      ]
    },
    {
      title: 'Animals and People',
      ref: 'Genesis 1:24 to 2:3',
      text: [
        'On the sixth day the land is to be full of life, too. God speaks, and the cattle, the wild animals, and everything that crawls on the ground appear. God sees that it is good.',
        'Then God says, “Let us make people in our image!” And he creates human beings, as man and as woman.',
        'God blesses them and trusts the earth to their care. For food he gives them the plants with seeds and the trees with fruit.',
        'God looks at everything he has made: It is very good. On the seventh day God rests from his work. He blesses this day and makes it a special day.'
      ],
      task: { hint: 'Lead the herd gently with your finger to the resting place.', herd: { rounds: [{ hint: 'Round 1: Drag the lead animal to the resting place. The others follow it.', leader: { label: 'Sheep' }, followers: [{ label: 'Sheep' }, { label: 'Sheep' }, { label: 'Sheep' }] }, { hint: 'Round 2: Now a pond is in the way. Drag the lead animal around the pond to the watering place.', leader: { label: 'Stag' }, followers: [{ label: 'Doe' }, { label: 'Goat' }, { label: 'Sheep' }, { label: 'Stag' }] }] } },
      questions: [
        { q: 'What does God do on the seventh day?', options: ['He rests from his work.', 'He makes new animals.', 'He builds a garden.'] },
        { q: 'What does God say about everything he has made?', options: ['It is very good.', 'It is almost finished.', 'It is still too empty.'] }
      ]
    },
    {
      title: 'The Garden of Eden',
      ref: 'Genesis 2:4–17',
      text: [
        'Now the Bible tells once more how people began. God takes earth and shapes Adam out of it. Then he breathes breath into his nose, and Adam begins to live.',
        'In the east God plants a garden, the Garden of Eden. Trees with beautiful fruit grow there. A river rises in Eden and waters the garden. In the middle stand two special trees: the tree of life and the tree of the knowledge of good and evil.',
        'God puts Adam in the garden to take care of it. “You may eat from every tree,” says God. “Only from the tree of the knowledge of good and evil you must not eat, for if you eat from it, you will die.”'
      ],
      task: { hint: 'Turn the channel pieces until the water flows to the trees.', channels: { goals: { feige: { label: 'Fig tree' }, granatapfel: { label: 'Pomegranate tree' }, dattel: { label: 'Date palm' }, wein: { label: 'Grapevine' } }, rounds: [{ hint: 'Round 1: Tap a channel piece to turn it. Lead the water to the trees.' }, { hint: 'Round 2: The river divides. Lead the water to all three trees.' }] } },
      questions: [
        { q: 'What does God shape Adam from?', options: ['earth', 'water', 'wood'] },
        { q: 'From which tree must Adam not eat?', options: ['the tree of the knowledge of good and evil', 'the tree of life', 'the fig trees'] }
      ]
    },
    {
      title: 'Adam Names the Animals',
      ref: 'Genesis 2:18–20',
      text: [
        'Adam lives in the garden and has everything he needs. And yet God says, “It is not good for the man to be alone. I will make him a helper who fits him.”',
        'God has made all the animals of the field and all the birds of the sky. Now he leads them to Adam and wants to see what Adam will call them.',
        'Adam gives names to the cattle, the birds, and the wild animals. He looks at each animal and finds a name for it.',
        'But among all the animals there is none that really fits him and could be a helper to him. Adam is still alone.'
      ],
      task: { hint: 'Put the missing words into the sentence.', verse: { rounds: [{ hint: 'Round 1: Drag the right leaf into the gap.', parts: ['God has made all the ', ' of the field and all the birds of the sky.'], words: ['animals', 'stones', 'clouds'] }, { hint: 'Round 2: Now two words are missing.', parts: ['Adam gives names to the ', ', the ', ', and the wild animals.'], words: ['cattle', 'birds', 'fish', 'flowers'] }] } },
      questions: [
        { q: 'What does God say about Adam?', options: ['It is not good for him to be alone.', 'It is good for him to be alone.', 'He should move on soon.'] },
        { q: 'What is missing for Adam, although he gives the animals names?', options: ['someone who fits him', 'a house', 'a boat'] }
      ]
    },
    {
      title: 'Eve',
      ref: 'Genesis 2:21–25',
      text: [
        'Then God lets a deep sleep fall on Adam. While Adam sleeps peacefully, God takes one of his ribs. He closes the place again and builds a woman out of the rib.',
        'Then God leads the woman to Adam, and Adam is glad, “This is bone of my bones and flesh of my flesh!” Now he is no longer alone.',
        'That is why a man later leaves his father and mother and holds on to his wife, and the two belong together.',
        'Adam and the woman are happy to be together. They are naked, and they are not ashamed in front of each other.'
      ],
      task: { hint: 'Complete the other side so that both sides match.', mirror: { stones: [{ label: 'red flower stone (rose)' }, { label: 'yellow flower stone (sunflower)' }, { label: 'blue flower stone (bellflower)' }], rounds: [{ hint: 'Round 1: Place the blossoms so that both halves look the same.' }, { hint: 'Round 2: The pattern is bigger and has more colors.' }] } },
      questions: [
        { q: 'What does God do with Adam before he builds the woman?', options: ['He lets him sleep deeply.', 'He sends him away.', 'He shows him the stars.'] },
        { q: 'What does God build the woman from?', options: ['from a rib of Adam', 'from dust and water', 'from a piece of wood'] }
      ]
    },
    {
      title: 'The Snake',
      ref: 'Genesis 3:1–7',
      text: [
        'In the garden lives the snake, too, more cunning than all the other animals. It asks the woman, “Did God really say: You may not eat from any tree in the garden?”',
        '“We may eat the fruit of the trees,” answers the woman. “Only about the tree in the middle God said: Do not eat from it, do not touch it, or you will die.” But the snake says, “You will not die. God knows that your eyes will be opened when you eat from it.”',
        'The woman looks at the tree. Its fruit looks beautiful, and it is supposed to make you wise. She takes a piece of fruit, eats, and gives some to Adam, who is with her.',
        'Then the eyes of both are opened. They realize that they are naked. They sew fig leaves together.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who speaks to the woman in the garden?', options: ['the snake', 'Adam', 'a bird'] },
        { q: 'What do the two do after their eyes are opened?', options: ['They sew fig leaves together.', 'They build a boat.', 'They pick dates.'] }
      ]
    },
    {
      title: 'Where Are You?',
      ref: 'Genesis 3:8–21',
      text: [
        'In the evening a cool wind blows through the garden. Adam and his wife hear God walking in the garden and hide among the trees.',
        '“Adam, where are you?” calls God. “I heard you and I was afraid,” answers Adam. “That is why I hid.”',
        'God asks whether Adam has eaten from the forbidden tree. Adam says the woman gave him some, and the woman says the snake tricked her. Because Adam has eaten, says God, work in the field will now be hard.',
        'Adam calls his wife Eve, because she will be the mother of all who live. And God makes clothes of animal skin for Adam and Eve and dresses them.'
      ],
      task: { hint: 'Listen or look closely and answer with the same blossoms.', echo: { rounds: [{ hint: 'Round 1: Listen or look closely: The call lights up, too. Tap the blossoms in the same order.' }, { hint: 'Round 2: The call is longer. You can listen to it and watch it again at any time.' }] } },
      questions: [
        { q: 'When do Adam and his wife hear God in the garden?', options: ['in the evening', 'in the morning', 'in the middle of the night'] },
        { q: 'What does God make for Adam and Eve?', options: ['clothes of animal skin', 'a house of wood', 'a new garden'] }
      ]
    },
    {
      title: 'The Way Out of the Garden',
      ref: 'Genesis 3:22–24',
      text: [
        'God says, “Now the man knows what is good and evil. He must not also eat from the tree of life and live forever.”',
        'So God sends Adam and Eve out of the Garden of Eden. Outside, they are to work the ground from which Adam was taken.',
        'In the east of the garden God sets cherubim. With a flaming sword they guard the way to the tree of life.',
        'Quietly Adam and Eve walk the path out. They wear the clothes of animal skin that God made for them. The garden stays behind them, and ahead of them lies the wide land.'
      ],
      task: { hint: 'Pull the seed bag back and let go. The seeds fall into the furrows.', sow: { rounds: [{ hint: 'Round 1: The furrows are close. Pull back and let go.' }, { hint: 'Round 2: One furrow more, and a light wind blows.' }] } },
      questions: [
        { q: 'Who guards the way to the tree of life?', options: ['cherubim with a flaming sword', 'the snake', 'Adam'] },
        { q: 'Where do Adam and Eve go in the end?', options: ['out of the garden', 'back to the animals', 'up a high mountain'] }
      ]
    }
  ],
  exam: [
    { q: 'What does God say to make it bright?', options: ['“Let there be light!”', '“Let there be day!”', '“Let there be warmth!”'] },
    { q: 'What does God do on the seventh day?', options: ['He rests from his work.', 'He makes new animals.', 'He builds a garden.'] },
    { q: 'From which tree must Adam not eat?', options: ['the tree of the knowledge of good and evil', 'the tree of life', 'the fig trees'] },
    { q: 'What does God build the woman from?', options: ['from a rib of Adam', 'from dust and water', 'from a piece of wood'] },
    { q: 'What does God make for Adam and Eve?', options: ['clothes of animal skin', 'a house of wood', 'a new garden'] },
    { q: 'Where do Adam and Eve go in the end?', options: ['out of the garden', 'back to the animals', 'up a high mountain'] }
  ]
}
