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
      audio: 'audio/abenteuer/adam-eva/geschichte-01-en-v1.mp3',
      text: [
        'In the beginning, God creates the heavens and the earth. The earth is still empty and dark, darkness lies over the water, and God’s Spirit hovers above it. Then God speaks: “Let there be light!” And there is light.',
        'God looks at the light, and it is good. He separates the light from the darkness. He calls the light day, and he calls the darkness night. It becomes evening, and it becomes morning: the first day.',
        'On the second day, God speaks again. Between the water below and the water above, a wide dome stretches out. God calls it sky. Again it becomes evening and morning: the second day.',
        'On the third day, God lets the water gather in one place. Dry land appears. He calls the land earth, and he calls the water sea. Then he says, “Let the earth turn green!” Grass grows, plants with seeds, and trees with fruit, each of its own kind. God looks at it, and it is good.'
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
      audio: 'audio/abenteuer/adam-eva/geschichte-02-en-v1.mp3',
      text: [
        'On the fourth day God says, “Let there be lights in the sky! They shall separate day from night and show the seasons, the days, and the years.”',
        'God makes two great lights, the sun for the day and the moon for the night. He also makes the stars. He sets them in the sky so that they shine on the earth. God looks at them, and it is good. It becomes evening and morning: the fourth day.',
        'On the fifth day the water is to teem with life, and birds are to fly through the air. God makes the great sea creatures and everything that moves in the water, and all the birds, each of its own kind. God looks at them, and it is good.',
        'And God blesses them. They shall become many and fill the sea, and the birds shall multiply on the earth. It becomes evening and morning: the fifth day.'
      ],
      task: { hint: 'Tap the lights in the sky until it shines.', lights: { rounds: [{ hint: 'Round 1: Tap every light that lights up.' }, { hint: 'Round 2: Now several light up at once, and they are smaller.' }] } },
      questions: [
        { q: 'What are the lights in the sky for?', options: ['They separate day and night.', 'They warm the animals.', 'They water the garden.'] },
        { q: 'What does God say to the creatures of the sea and the sky?', options: ['They shall become many.', 'They shall be quiet.', 'They shall move on.'] }
      ]
    },
    {
      title: 'Animals and People',
      ref: 'Genesis 1:24–2:3',
      audio: 'audio/abenteuer/adam-eva/geschichte-03-en-v1.mp3',
      text: [
        'On the sixth day God speaks once more. Now the land is to be full of life, too. He makes the cattle, the wild animals, and everything that crawls on the ground, each of its own kind. God looks at them, and it is good.',
        'Then God says, “I will make people who are like me.” And he creates human beings in his own image, as man and as woman.',
        'God blesses them. They shall become many and fill the earth, and he trusts the earth and all the animals to their care. For food he gives them plants with seeds and trees with fruit. To the animals he gives the green plants.',
        'God looks at everything he has made. It is very good. It becomes evening and morning: the sixth day.',
        'So heaven and earth are finished. On the seventh day God rests from his work. He blesses this day and makes it a special day.'
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
      audio: 'audio/abenteuer/adam-eva/geschichte-04-en-v1.mp3',
      text: [
        'Now the Bible tells more exactly how people began. God takes earth from the ground and shapes a man out of it: Adam. Then he breathes his own breath into his nose, and Adam begins to live.',
        'In the east, God plants a garden, the Garden of Eden, and puts Adam in it. Out of the ground he makes trees grow that are beautiful to look at and good to eat. In the middle of the garden stand two special trees: the tree of life and the tree of the knowledge of good and evil.',
        'A river flows through the garden and waters it. After that it divides into four rivers.',
        'Adam is to work in the garden and take care of it. God says to him, “You may eat from every tree in the garden. Only from the tree of the knowledge of good and evil you must not eat. If you eat from it, you will die.”'
      ],
      task: { hint: 'Turn the channel pieces until the water flows to the trees.', channels: { goals: { feige: { label: 'Fig tree' }, granatapfel: { label: 'Pomegranate tree' }, dattel: { label: 'Date palm' }, wein: { label: 'Grapevine' } }, rounds: [{ hint: 'Round 1: Tap a channel piece to turn it. Lead the water to the trees.' }, { hint: 'Round 2: The river divides. Lead the water to all four trees.' }] } },
      questions: [
        { q: 'What does God make the man from?', options: ['earth', 'water', 'wood'] },
        { q: 'Which tree must Adam not eat from?', options: ['the tree of knowledge', 'the tree of life', 'the fig trees'] }
      ]
    },
    {
      title: 'Adam Names the Animals',
      ref: 'Genesis 2:18–20',
      audio: 'audio/abenteuer/adam-eva/geschichte-05-en-v1.mp3',
      text: [
        'Adam lives in the garden and has everything he needs. And yet God says, “It is not good for the man to be alone. I will make him a helper who fits him.”',
        'God forms all the animals of the field and all the birds of the sky out of the ground and brings them to Adam. He wants to see what Adam will call them. And whatever Adam calls each animal, that is to be its name.',
        'Adam gives names to all the animals, the cattle, the birds, and the wild animals. One after the other they come to him. He looks at them and finds a name for each. But among them all there is none that really fits him.'
      ],
      task: { hint: 'Put the missing words into the sentence.', verse: { rounds: [{ hint: 'Round 1: Drag the right leaf into the gap.', parts: ['God forms all the ', ' of the field and all the birds of the sky out of the ground.'], words: ['animals', 'stones', 'clouds'] }, { hint: 'Round 2: Now two words are missing.', parts: ['Adam gives names to all the animals, the ', ', the ', ', and the wild animals.'], words: ['cattle', 'birds', 'fish', 'flowers'] }] } },
      questions: [
        { q: 'What does God say about Adam?', options: ['It is not good for him to be alone.', 'It is good for him to be alone.', 'He should move on soon.'] },
        { q: 'What does Adam still lack, although he knows all the animals?', options: ['someone who fits him', 'a house', 'a boat'] }
      ]
    },
    {
      title: 'Eve',
      ref: 'Genesis 2:21–25',
      audio: 'audio/abenteuer/adam-eva/geschichte-06-en-v1.mp3',
      text: [
        'Then God lets a deep sleep fall on Adam. Adam sleeps peacefully. God takes one of his ribs and closes the place again. Out of the rib God builds a woman.',
        'Then God brings the woman to Adam. Adam is happy: “At last! She belongs to me like a part of myself.” The woman’s name is Eve.',
        'That is why a man later leaves his father and mother and holds on to his wife, and the two belong together. So it is with Adam and Eve. They are happy to be together, and they are not ashamed in front of each other.'
      ],
      task: { hint: 'Complete the other side so that both sides match.', mirror: { stones: [{ label: 'red flower stone (rose)' }, { label: 'yellow flower stone (sunflower)' }, { label: 'blue flower stone (bellflower)' }], rounds: [{ hint: 'Round 1: Place the blossoms so that both halves look the same.' }, { hint: 'Round 2: The pattern is bigger and has more colors.' }] } },
      questions: [
        { q: 'What does God do with Adam before he builds the woman?', options: ['He lets him sleep deeply.', 'He sends him away.', 'He shows him the stars.'] },
        { q: 'What does God build the woman from?', options: ['one of Adam’s ribs', 'dust and water', 'a piece of wood'] }
      ]
    },
    {
      title: 'The Snake',
      ref: 'Genesis 3:1–7',
      audio: 'audio/abenteuer/adam-eva/geschichte-07-en-v1.mp3',
      text: [
        'A snake lives in the garden, too. It is smarter than all the other animals, quiet and cunning. One day it speaks to Eve: “Did God really say you may not eat from any tree in the garden?”',
        'Eve answers, “We may eat the fruit of the trees. Only about the tree in the middle of the garden God said: Do not eat from it, do not touch it, or you will die.”',
        'The snake says, “No, you will not die. God knows that your eyes will be opened when you eat from it. Then you will be like God and know what is good and what is evil.”',
        'Eve looks at the tree. Its fruit looks good, and it is supposed to make you wise. She takes a piece of fruit and eats. She also gives some to Adam, who is with her, and he eats.',
        'Then the eyes of both are opened. They realize what they have done, and they are ashamed. They sew fig leaves together and make aprons out of them.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who speaks to Eve?', options: ['the snake', 'Adam', 'a bird'] },
        { q: 'What did God say about the tree in the middle of the garden?', options: ['Do not eat from it, or you will die.', 'Eat a lot of it.', 'Plant another one.'] },
        { q: 'What do the two do after their eyes are opened?', options: ['They sew fig leaves together.', 'They build a boat.', 'They pick dates.'] }
      ]
    },
    {
      title: 'Where Are You?',
      ref: 'Genesis 3:8–21',
      audio: 'audio/abenteuer/adam-eva/geschichte-08-en-v1.mp3',
      text: [
        'In the evening, when a cool wind blows, Adam and Eve hear God walking in the garden. Then they hide among the trees.',
        'God calls, “Adam, where are you?” Adam answers, “I heard you and I was afraid. That is why I hid.”',
        'God asks whether Adam has eaten from the tree he was not to eat from. Adam says, “The woman you gave me gave me some.” Eve says, “The snake tricked me.” Both of them blame somebody else.',
        'God tells them what will be different now: Life will be harder. Adam will have to work hard so that the field gives him bread, and thorns and thistles will grow in it. For Eve, too, it will be difficult. The world is no longer as whole as it was in the garden.',
        'But God does not leave the two alone. Adam says to his wife, “You will be the mother of all people.” And God makes clothes of animal skins for Adam and Eve and puts them on them. That is how he takes care of them.'
      ],
      task: { hint: 'Listen or look closely and answer with the same blossoms.', echo: { rounds: [{ hint: 'Round 1: Listen or look closely: The call lights up, too. Tap the blossoms in the same order.' }, { hint: 'Round 2: The call is longer. You can listen to it and watch it again at any time.' }] } },
      questions: [
        { q: 'When do Adam and Eve hear God in the garden?', options: ['in the evening', 'in the morning', 'in the middle of the night'] },
        { q: 'What does God say about life from now on?', options: ['It will be harder.', 'It will be easier.', 'It will stay as in the garden.'] }
      ]
    },
    {
      title: 'The Way Out of the Garden',
      ref: 'Genesis 3:22–24; 4:1',
      audio: 'audio/abenteuer/adam-eva/geschichte-09-en-v1.mp3',
      text: [
        'Now everything is no longer as before. God says, “The man must not also eat from the tree of life and stay like this forever.”',
        'So God sends Adam and Eve out of the Garden of Eden. Outside, they are to work the ground from which Adam was taken. Quietly they walk the path out, and the garden stays behind them. In the east of the garden, God sets cherubim, mighty angels, and a flaming sword. They guard the way to the tree of life.',
        'But Adam and Eve are not alone. God has made them clothes of animal skins, and he helps them outside, too. Later Eve has a son and calls him Cain. “I have had a son,” she says, “with God’s help.”'
      ],
      task: { hint: 'Pull the seed bag back and let go. The seeds fall into the furrows.', sow: { rounds: [{ hint: 'Round 1: The furrows are close. Pull back and let go.' }, { hint: 'Round 2: The furrows are farther away, and a light wind blows.' }] } },
      questions: [
        { q: 'Who guards the way to the tree of life?', options: ['cherubim with a flaming sword', 'the snake', 'Adam'] },
        { q: 'Where do Adam and Eve go in the end?', options: ['out of the garden', 'back to the animals', 'up a high mountain'] }
      ]
    }
  ],
  exam: [
    { q: 'What does God say to make it bright?', options: ['“Let there be light!”', '“Let there be day!”', '“Let there be warmth!”'] },
    { q: 'What does God do on the seventh day?', options: ['He rests from his work.', 'He makes new animals.', 'He builds a garden.'] },
    { q: 'Which tree must Adam not eat from?', options: ['the tree of knowledge', 'the tree of life', 'the fig trees'] },
    { q: 'What does God build the woman from?', options: ['one of Adam’s ribs', 'dust and water', 'a piece of wood'] },
    { q: 'What does God make for Adam and Eve?', options: ['clothes of animal skins', 'a house of wood', 'a new garden'] },
    { q: 'Where do Adam and Eve go in the end?', options: ['out of the garden', 'back to the animals', 'up a high mountain'] }
  ]
}
