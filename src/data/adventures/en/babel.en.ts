/**
 * English texts of the adventure "The Tower of Babel" (8 to 10 years): the same shape as `../babel.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Shinar, Babel); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Babel/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const babelEn: TextOverlay<Journey> = {
  title: 'The Tower of Babel',
  subtitle: 'A City and a Tower',
  gift: { title: 'The Tower of Bricks' },
  stages: [
    {
      title: 'One Language',
      ref: 'Genesis 11:1–2',
      text: [
        'After the great flood God has said to Noah and his sons, “Fill the earth!” Now their families grow larger and larger, and soon many people live on the earth.',
        'They all speak the same language. When one person calls out, everyone understands, and every word means the same thing to all.',
        'One day they set out together, families with their bundles, in a long line. They talk with one another, and nobody has to ask what the other means. At last they find a wide, flat plain in the land of Shinar.',
        'There is room enough for everyone. They settle down and live side by side.'
      ],
      task: { hint: 'Look closely: Who is missing from the caravan?', missing: { people: [{ label: 'Man with a blue headscarf' }, { label: 'Woman with an ochre cloth and a water jug' }, { label: 'Boy with a red cloth' }, { label: 'Man with an olive-green cloth and a big bundle' }, { label: 'Woman in blue with a basket' }, { label: 'Young woman with a braid' }], rounds: [{ hint: 'Round 1: Four people are walking. Who is gone when the dust cloud has passed?' }, { hint: 'Round 2: Now two are missing.' }] } },
      questions: [
        { q: 'Which language do the people speak at the beginning?', options: ['all the same one', 'a different one in every family', 'none at all'] },
        { q: 'What do the people find in the land of Shinar?', options: ['a wide plain', 'a high mountain', 'a deep forest'] }
      ]
    },
    {
      title: 'Bricks and Pitch',
      ref: 'Genesis 11:3',
      text: [
        'One day someone has an idea. “Come,” he calls, “let us make bricks and bake them in the fire!” “Yes, let us do it!” the others shout.',
        'They dig clay out of the ground and shape it into bricks. Then they bake the bricks in the fire. Whoever takes a finished brick in the hand feels it: the soft clay has become hard as stone.',
        'Instead of mortar they use pitch. It is black and sticky and holds the bricks firmly together.',
        'Everyone lends a hand, and each one understands the others at once. Whatever one suggests, the others do.'
      ],
      task: { hint: 'Pass bricks and pitch from hand to hand to the stack.', chain: { rounds: [{ hint: 'Round 1: Tap the one who is holding something, and he passes it on.' }, { hint: 'Round 2: Now pots of pitch come, too, and one more person helps.' }] } },
      questions: [
        { q: 'What do the people do to the bricks to make them hard?', options: ['They bake them.', 'They paint them.', 'They cut them.'] },
        { q: 'How do the people work?', options: ['together', 'each one alone', 'not at all'] }
      ]
    },
    {
      title: 'A City with a Tower',
      ref: 'Genesis 11:4',
      text: [
        'The people want more than just a few houses. “Come,” they say, “let us build a city and a tower whose top reaches up to the sky!”',
        '“Let us make a name for ourselves,” they cry, “or we will be scattered over the whole earth.”',
        'They begin right away, and everyone helps. They carry brick after brick. Houses and lanes appear, and row by row the tower grows higher.',
        'Again and again the people look up at it. It is taller than anything else in the city, and you can already see it from far away.'
      ],
      task: { hint: 'Place the rows of bricks of the tower piece by piece.', stack: { rounds: [{ hint: 'Round 1: Tap when the block is above the row.' }, { hint: 'Round 2: The rows get narrower.' }] } },
      questions: [
        { q: 'How high is the tower supposed to reach?', options: ['up to the sky', 'up to the city wall', 'up to the sea'] },
        { q: 'What do the people want to make for themselves?', options: ['a name', 'a treasure', 'a garden'] }
      ]
    },
    {
      title: 'God Sees the Building',
      ref: 'Genesis 11:5–6',
      text: [
        'The tower grows and grows, taller than all the houses. Then God comes down to see what the people are building, the city and the tower.',
        'God sees the many people working together and understanding one another well. “They are one people, and they all have one language,” he says. “This is only the beginning. They will not let go of what they plan to do.”',
        'Down in the city evening comes, and the sun turns the tower golden. The builders call to one another, and everyone understands every word. They keep working a little longer.'
      ],
      task: { hint: 'Wipe away the fog so that you can see the tower and the city.', wipe: { rounds: [{ hint: 'Round 1: Wipe the fog from the tower.' }, { hint: 'Round 2: Now the people.' }] } },
      questions: [
        { q: 'Who comes down to see the city and the tower?', options: ['God', 'an angel', 'the king'] },
        { q: 'What does God see about the people?', options: ['They are one people and have one language.', 'They are quarreling.', 'They are already finished.'] }
      ]
    },
    {
      title: 'Many Languages',
      ref: 'Genesis 11:7–8',
      text: [
        'Then God says, “Come, let us go down and confuse their language, so that no one understands what the other says.”',
        'And so it happens. A man calls something to his neighbor, but the neighbor only looks at him blankly. The words sound strange, as if they came from another country.',
        'The builders point at the bricks, shake their heads, ask, and gesture. But nobody understands anybody else, however hard they try.',
        'They can no longer plan together. The work grinds to a halt, and tools and bricks stay where they were put down.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does God confuse?', options: ['their language', 'their roads', 'their bricks'] },
        { q: 'What can the builders no longer do?', options: ['plan together', 'walk', 'see'] }
      ]
    },
    {
      title: 'The Name Babel',
      ref: 'Genesis 11:8–9',
      text: [
        'From there God scatters the people into all the countries, and they have to stop building the city. They pack their bundles and go apart, family by family, on many roads in every direction. Some still wave to one another.',
        'Behind them the city stays, and the tower stands unfinished in the morning light. Nobody builds on.',
        'That is why the city is called Babel. It sounds like the word for “confusion,” because there God confused the language of all the people.',
        'From the many families grow many nations. People now live in all the countries, and each nation speaks its own language.'
      ],
      task: { hint: 'Trace the roads with your finger.', trace: { rounds: [{ hint: 'Round 1: Trace the two roads.' }, { hint: 'Round 2: Now three roads in different directions.' }] } },
      questions: [
        { q: 'What is the city called?', options: ['Babel', 'Eden', 'Ur'] },
        { q: 'What does the name Babel remind us of?', options: ['the word for “confusion”', 'the word for “brick”', 'the word for “tower”'] }
      ]
    }
  ],
  exam: [
    { q: 'Which language do the people speak at the beginning?', options: ['all the same one', 'a different one in every family', 'none at all'] },
    { q: 'What do the people use instead of mortar?', options: ['pitch', 'water', 'straw'] },
    { q: 'How high is the tower supposed to reach?', options: ['up to the sky', 'up to the city wall', 'up to the sea'] },
    { q: 'Who comes down to see the city and the tower?', options: ['God', 'an angel', 'the king'] },
    { q: 'What happens when God confuses the language?', options: ['The people no longer understand one another.', 'The people fall silent.', 'The people build faster.'] },
    { q: 'What is the city called in the end?', options: ['Babel', 'Eden', 'Ur'] }
  ]
}
