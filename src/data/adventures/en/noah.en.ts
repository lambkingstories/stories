/**
 * English texts of the adventure "Noah" (8 to 10 years): the same shape as `../noah.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World
 * English Bible (Noah, Shem, Ham, Japheth, the mountains of Ararat); the stories are retold in our own words. The source as a readable
 * file: D:/Claude/Abenteuer-Noah/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

const REC = 'audio/abenteuer/noah/'
const rec = (n: number) => `${REC}geschichte-${String(n).padStart(2, '0')}-en-v1.mp3`

export const noahEn: TextOverlay<Journey> = {
  title: 'Noah',
  subtitle: 'The Ark and the Rainbow',
  gift: { title: 'The Ark Under the Rainbow' },
  stages: [
    {
      title: 'Noah Walks with God',
      ref: 'Genesis 6:5–10',
      audio: rec(1),
      text: [
        'Long ago, many people live on the earth. But they have forgotten God. In their hearts everything has turned bad, and what they do is not good. The earth that God made so beautiful is full of wrong. God sees it, and it makes him sad. It hurts him deeply.',
        'But one man lives differently. His name is Noah. While the others no longer ask about God, Noah stays close to him. He listens to God and walks his way with him. God finds nothing to blame in him, and God is good to Noah.',
        'Noah has a wife and three sons. The sons are called Shem, Ham, and Japheth.'
      ],
      task: {
        hint: 'Find Noah and his three sons in the hills.',
        find: { labels: ['Noah', 'Shem', 'Ham', 'Japheth'], doneText: 'You found Noah and all three sons!' }
      },
      questions: [
        { q: 'What are Noah’s three sons called?', options: ['Shem, Ham, and Japheth', 'Isaac, Jacob, and Joseph', 'Moses, Aaron, and Joshua'] },
        { q: 'Who lives with God when the others no longer listen to him?', options: ['Noah', 'Shem', 'Japheth'] }
      ]
    },
    {
      title: 'God’s Building Plan',
      ref: 'Genesis 6:13–22',
      audio: rec(2),
      text: [
        'God has seen how things are on the earth. One day he speaks to Noah. He says, “A great flood will come over the earth. But with you I will make a covenant, a firm promise: You and your family will be safe. Build an ark of wood.”',
        'And God tells him exactly how it should look: a huge box with many rooms and three floors. A door goes into the side, and at the very top, under the roof, there should be windows. Noah is to cover the wood with pitch, inside and out, so that everything is watertight.',
        'Noah and his wife, his three sons and their wives are to go into the ark. Animals are to come along, too.',
        'It is an enormous task. But Noah listens carefully, gets started, and does everything exactly as God told him.'
      ],
      task: {
        hint: 'Build the ark and seal it with pitch at the end.',
        build: {
          pieces: [
            { label: 'the top deck' },
            { label: 'the middle deck' },
            { label: 'the bottom deck' },
            { label: 'the door' },
            { label: 'the window band' },
            { label: 'the ramp' }
          ],
          rounds: [
            { hint: 'Round 1: Drag each part to its place in the outline.' },
            { hint: 'Round 2: Take the pitch and run your finger along each seam. Stay on the seam.' }
          ]
        }
      },
      questions: [
        { q: 'What will come over the earth, God says?', options: ['a great flood', 'a long winter', 'a long drought'] },
        { q: 'Who goes into the ark with Noah?', options: ['his wife, his three sons, and their wives', 'his wife and the neighbors', 'only his three sons'] }
      ]
    },
    {
      title: 'Supplies for Everyone',
      ref: 'Genesis 6:21–22; 7:5',
      audio: rec(3),
      text: [
        'The ark is ready. But God has told Noah to do one more thing: “Gather all the food you need and bring it into the ark. There must be enough for you and for the animals.”',
        'Noah gets to work. He fills baskets with grain, he gathers fruit, he piles up feed for the animals. Basket after basket he carries into the rooms of the ark and stacks it all up, until it smells of grain and hay in there. It is a lot of work, because many have to be fed, people and animals.',
        'Noah does everything God told him to do. He leaves nothing out.'
      ],
      task: {
        hint: 'Push the right food to those who need it.',
        share: {
          receivers: [
            {
              label: 'Noah’s family',
              rejects: { heu: 'Noah’s family does not eat hay.', korn: 'Noah’s family does not eat feed grain.' }
            },
            { label: 'the dove', rejects: { heu: 'The dove does not eat hay.', '*': 'That is nothing for the dove.' } },
            { label: 'the camel', rejects: { korn: 'The camel does not like grain.', '*': 'That is nothing for the camel.' } },
            { label: 'the sheep', rejects: { korn: 'The sheep does not like grain.', '*': 'That is nothing for the sheep.' } },
            { label: 'the goat', rejects: { korn: 'The goat does not like grain.', '*': 'That is nothing for the goat.' } },
            { label: 'the donkey', rejects: { korn: 'The donkey does not like grain.', '*': 'That is nothing for the donkey.' } }
          ],
          baskets: [
            { label: 'figs' },
            { label: 'dates' },
            { label: 'grapes' },
            { label: 'pomegranates' },
            { label: 'olives' },
            { label: 'hay' },
            { label: 'feed grain' },
            { label: 'an empty jug' },
            { label: 'a wooden mallet' }
          ],
          rounds: [
            { hint: 'Round 1: Who needs what? Push each kind of food to those who need it. Nobody here needs some of it.' },
            { hint: 'Round 2: Now there are more animals. Nobody should be left with nothing. Then tap Done.' }
          ]
        }
      },
      questions: [
        { q: 'How much of God’s task does Noah do?', options: ['all of it', 'half of it', 'none of it'] },
        { q: 'Who tells Noah to gather food?', options: ['God', 'his wife', 'his son Shem'] }
      ]
    },
    {
      title: 'The Animals Come',
      ref: 'Genesis 6:19–20; 7:1–9',
      audio: rec(4),
      text: [
        'When everything is ready, God speaks to Noah once more: “Go into the ark, you and all your family. I have seen that you live the way I like. In seven days I will send rain.” Noah does it. He goes into the ark with his wife, his sons, and their wives.',
        'And then the animals come. From every direction they come, animals from the fields and from the wild, birds of the air and small creatures from the ground. Of every kind, male and female come to Noah.',
        'Noah does not have to look for them or call them. They come to him, and all of them go into the ark, just as God said. Now there is nothing left to do but wait, for seven days.'
      ],
      task: {
        hint: 'Find the male and the female. You only see a few kinds of animals as examples.',
        memory: {
          pairs: [
            { text: 'Stag and doe: Animals from the wild. The male and the female go into the ark.', labels: ['Stag', 'Doe'] },
            { text: 'Ram and ewe: Animals from the field. The male and the female go into the ark.', labels: ['Ram', 'Ewe'] },
            { text: 'Peacock and peahen: Birds of the air. Males and females of the birds come, too.', labels: ['Peacock', 'Peahen'] },
            { text: 'Bull and cow: Animals from the field. Of every kind, male and female come to Noah.', labels: ['Bull', 'Cow'] },
            { text: 'Rooster and hen: They belong there, too. Male and female go into the ark.', labels: ['Rooster', 'Hen'] },
            { text: 'Drake and duck: A male and a female. They go into the ark, too, just as God said.', labels: ['Drake', 'Duck'] }
          ]
        }
      },
      questions: [
        { q: 'Does Noah have to look for the animals?', options: ['no, they come to him', 'yes, he looks everywhere', 'yes, he calls them with a horn'] },
        { q: 'How long is it until the rain begins?', options: ['seven days', 'two days', 'ten days'] }
      ]
    },
    {
      title: 'The Flood',
      ref: 'Genesis 7:10–24',
      audio: rec(5),
      text: [
        'Seven days have passed. Noah is in the ark, with his wife, his sons and their wives, and all the animals. Then God himself shuts the door behind them.',
        'And it begins to rain, just as God said. Water pours from the sky, and water wells up out of the earth. For forty days and forty nights it rains.',
        'The water rises. It lifts the ark off the ground, and the ark floats. The water rises higher and higher, until even the high mountains are covered. Only Noah and all who are with him in the ark are left.',
        'Inside, they are safe. They hear the rain drumming on the roof. God has closed the door, and the ark carries them.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How long does it rain?', options: ['forty days and nights', 'ten days and nights', 'seven days and nights'] },
        { q: 'Who shuts the door of the ark?', options: ['God', 'Noah', 'Shem'] },
        { q: 'What does the water cover in the end?', options: ['even the high mountains', 'only the fields', 'only the valley'] }
      ]
    },
    {
      title: 'God Remembers Noah',
      ref: 'Genesis 8:1–5',
      audio: rec(6),
      text: [
        'For many weeks the ark floats on the water. Outside there is nothing but water, as far as the eye can see. But God has not forgotten Noah. He remembers Noah and all the animals in the ark.',
        'God sends a wind over the earth. The rain stops, and all at once it is quiet on the roof. The water goes down.',
        'One day there is a jolt. The ark is stuck! It has come to rest on a mountain range, the mountains of Ararat.',
        'The water keeps sinking. First only one peak sticks out, then another, then many: The tops of the mountains appear.'
      ],
      task: { hint: 'Tap the numbers in order. The peaks appear.' },
      questions: [
        { q: 'What does God send to make the water go down?', options: ['a wind', 'more rain', 'a rainbow'] },
        { q: 'Where does the ark come to rest?', options: ['in the mountains of Ararat', 'on a green meadow', 'in the middle of a village'] }
      ]
    },
    {
      title: 'Raven and Dove',
      ref: 'Genesis 8:6–12',
      audio: rec(7),
      text: [
        'Forty days have passed since the mountain peaks became visible. The ark is still stuck on the mountains. Then Noah opens a window of the ark and lets a raven out. The raven flies away, back and forth, and Noah watches it go.',
        'Then Noah sends out a dove. She is to see whether the water has gone down. But the dove cannot find a place to rest. She flies back, and Noah takes her into the ark again.',
        'Noah waits seven days. Then he sends the dove out once more. In the evening she comes back, and in her beak she carries a fresh leaf from an olive tree, an olive leaf! Now Noah knows: The water has gone down.',
        'Again he waits seven days. This time he sends the dove out for the third time, and she does not come back.'
      ],
      task: {
        hint: 'Steer the dove with your finger.',
        fly: {
          rounds: [
            { hint: 'Round 1: Fly through the lights above the water and then back to the ark.' },
            { hint: 'Round 2: Steer the dove to the tree and then back to the ark.' }
          ]
        }
      },
      questions: [
        { q: 'How many days does Noah wait before he sends the dove out again?', options: ['seven', 'three', 'ten'] },
        { q: 'Which bird does Noah let out first?', options: ['the raven', 'the dove', 'an eagle'] }
      ]
    },
    {
      title: 'Out of the Ark',
      ref: 'Genesis 8:13–22',
      audio: rec(8),
      text: [
        'The dove has not come back, and Noah keeps waiting. More time has passed. Then he opens the roof of the ark and looks out. The ground is dry! Another while goes by, and then the earth is completely dry. And God speaks to Noah: “Come out of the ark, you and your family, and let all the animals out, too.”',
        'Noah goes out, with his wife, his sons, and their wives. All the animals go out, too, kind by kind. At last everyone is standing on firm ground again.',
        'Then Noah builds an altar and brings an offering to God, to say thank you.',
        'And God says, “As long as the earth lasts, there will be seedtime and harvest, summer and winter, day and night.”'
      ],
      task: {
        hint: 'Build the altar from twelve stones, from the bottom to the top. Tap a stone to turn it.',
        build: {
          pieces: [
            { label: 'Stone 1' },
            { label: 'Stone 2' },
            { label: 'Stone 3' },
            { label: 'Stone 4' },
            { label: 'Stone 5' },
            { label: 'Stone 6' },
            { label: 'Stone 7' },
            { label: 'Stone 8' },
            { label: 'Stone 9' },
            { label: 'Stone 10' },
            { label: 'Stone 11' },
            { label: 'Stone 12' }
          ],
          rounds: [{ hint: 'Put each stone into its outline.' }]
        }
      },
      questions: [
        { q: 'What does Noah see when he looks out?', options: ['dry ground', 'still a lot of water', 'a new mountain'] },
        { q: 'Who tells Noah to leave the ark?', options: ['God', 'his son', 'the raven'] }
      ]
    },
    {
      title: 'The Rainbow',
      ref: 'Genesis 9:1–17',
      audio: rec(9),
      text: [
        'Once more God speaks to Noah and his sons. He blesses them: They shall have many children, and people shall spread out over the earth.',
        'Then God keeps what he promised Noah. He says, “I make my covenant with you and your children and with all the animals that came out of the ark. It is a promise for all time: Never again will a flood come that destroys all life.”',
        'And God names a sign for his promise: “I set my bow in the clouds.” That is the rainbow. When clouds gather over the earth and the bow shines, God sees it and remembers his promise. The promise is for all time, for all people and all animals.'
      ],
      task: {
        hint: 'Color the whole picture.',
        jobs: [
          { hint: 'Color the rainbow with watercolor.' },
          { hint: 'Color the rainbow with the felt-tip marker.' },
          { hint: 'Color the rainbow with colored pencil.' },
          { hint: 'Color the rainbow with chalk.' },
          { hint: 'Color the sun yellow.' },
          { hint: 'Color the sun yellow with colored pencil.' },
          { hint: 'Color the ark brown.' },
          { hint: 'Color the ark brown with colored pencil.' },
          { hint: 'Color the clouds blue.' },
          { hint: 'Color the meadow green.' },
          { hint: 'Color the tree green.' },
          { hint: 'Color the sky blue.' }
        ]
      },
      questions: [
        { q: 'What is the sign of God’s promise?', options: ['the rainbow', 'a golden star', 'a white dove'] },
        { q: 'What does God promise?', options: ['Never again will a flood come that destroys all life.', 'It will never rain again.', 'There will never be clouds again.'] }
      ]
    }
  ],
  exam: [
    { q: 'What are Noah’s three sons called?', options: ['Shem, Ham, and Japheth', 'Isaac, Jacob, and Joseph', 'Moses, Aaron, and Joshua'] },
    { q: 'What is Noah to build, according to God’s plan?', options: ['an ark of wood', 'a wall of stone', 'a tower of clay'] },
    { q: 'How long does it rain?', options: ['forty days and nights', 'ten days and nights', 'seven days and nights'] },
    { q: 'What does the dove bring in her beak?', options: ['a fresh olive leaf', 'a small stone', 'a colorful feather'] },
    { q: 'What does Noah build to say thank you to God?', options: ['an altar', 'a house', 'a wall'] },
    { q: 'What is the sign of God’s promise?', options: ['the rainbow', 'a golden star', 'a white dove'] }
  ]
}
