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
      audio: 'audio/abenteuer/babel/geschichte-01-en-v1.mp3',
      text: [
        'After the great flood, many people are living on the earth again. They all speak the same language. When one person calls out, everyone understands, and every word means the same thing to all.',
        'One day the people set out and travel on together, families with their children, with animals and bundles. They talk and laugh along the way, and nobody has to ask another what he means.',
        'At last they find a wide, flat plain in the land of Shinar. There is so much room here that everyone can live side by side. They settle there.'
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
      audio: 'audio/abenteuer/babel/geschichte-02-en-v1.mp3',
      text: [
        'In the plain there are no big stones lying around, but there is clay. The people say to one another, “Come, let us make bricks and bake them in the fire!”',
        'They dig the clay out of the ground and press it into wooden molds. They let it dry in the sun and bake the bricks in the oven until they are hard. Soon whole stacks of them lie in the plain.',
        'Instead of stones they build with these bricks. And instead of mortar they use pitch, black and sticky, which holds the bricks firmly together. Everyone lends a hand, and everyone understands one another. Whatever one suggests, the others do.'
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
      audio: 'audio/abenteuer/babel/geschichte-03-en-v1.mp3',
      text: [
        'The people want more than just a few houses. “Come,” they say, “let us build a city and a tower whose top reaches up to the sky!”',
        'They want to make a name for themselves, so that everyone talks about them. And they want to stay together and not be scattered over the whole earth.',
        'Then the building begins. Day after day they carry bricks and stack them up. Step by step the tower grows higher, and around it houses and lanes appear. The people look up at it.'
      ],
      task: { hint: 'Place the steps of the tower piece by piece.', stack: { rounds: [{ hint: 'Round 1: Tap when the block is above the step.' }, { hint: 'Round 2: The steps get narrower.' }] } },
      questions: [
        { q: 'How high is the tower supposed to reach?', options: ['up to the sky', 'up to the city wall', 'up to the sea'] },
        { q: 'What do the people want to make for themselves?', options: ['a name', 'a treasure', 'a garden'] }
      ]
    },
    {
      title: 'God Sees the Building',
      ref: 'Genesis 11:5–6',
      audio: 'audio/abenteuer/babel/geschichte-04-en-v1.mp3',
      text: [
        'The tower rises high above the houses of the city. Then God comes down to see what the people are building there: the city and the tower.',
        'God sees: They are one people, and they all speak the same language. This is only the beginning of what they will do. If they go on like this, nothing they plan to do will be impossible for them.',
        'Down in the city, evening is coming. The people go on working for a little while and call out to one another.'
      ],
      task: { hint: 'Wipe away the fog so that you can see the tower and the city.', wipe: { rounds: [{ hint: 'Round 1: Wipe the fog from the tower.' }, { hint: 'Round 2: Now the city.' }] } },
      questions: [
        { q: 'Who comes down to see the city and the tower?', options: ['God', 'an angel', 'the king'] },
        { q: 'What does God see about the people?', options: ['They are one people and speak the same language.', 'They are quarreling.', 'They are already finished.'] }
      ]
    },
    {
      title: 'Many Languages',
      ref: 'Genesis 11:7–8',
      audio: 'audio/abenteuer/babel/geschichte-05-en-v1.mp3',
      text: [
        'God says, “I will go down and confuse their language, so that nobody understands anyone else.”',
        'And so it happens. A man calls something out to his neighbor, but the neighbor does not understand him. He hears strange words. The builders ask and point at the bricks, they shake their heads, but nobody understands anybody else.',
        'Now they can no longer plan together or build together. So God scatters the people from there over the whole earth. They pack their bundles and set out on many different roads. They do not finish the city.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does God confuse?', options: ['their language', 'their roads', 'their bricks'] },
        { q: 'Where does God spread the people?', options: ['over the whole earth', 'into the city', 'onto the tower'] },
        { q: 'What happens to the building of the city?', options: ['They stop building.', 'They build even faster.', 'They build a second tower.'] }
      ]
    },
    {
      title: 'The Name Babel',
      ref: 'Genesis 11:9',
      audio: 'audio/abenteuer/babel/geschichte-06-en-v1.mp3',
      text: [
        'That is why the city is called Babel. The name reminds us of the word for “confuse,” because there God confused the language of all the people.',
        'From there God scatters the people over the whole earth. They go apart on many roads, families with their children, with animals and bundles, each group in its own direction.',
        'Behind them the plain stays with the city and the tower. It stands unfinished in the morning light. So people come to all the countries of the earth, and out of the many families, many nations grow.'
      ],
      task: { hint: 'Trace the roads with your finger.', trace: { rounds: [{ hint: 'Round 1: Trace the two roads.' }, { hint: 'Round 2: Now four roads in all directions.' }] } },
      questions: [
        { q: 'What is the city called?', options: ['Babel', 'Eden', 'Shinar'] },
        { q: 'What does the name Babel remind us of?', options: ['the word for “confuse”', 'the word for “brick”', 'the word for “tower”'] }
      ]
    }
  ],
  exam: [
    { q: 'Which language do the people speak at the beginning?', options: ['all the same one', 'a different one in every family', 'none at all'] },
    { q: 'What do the people use instead of mortar?', options: ['pitch', 'water', 'straw'] },
    { q: 'How high is the tower supposed to reach?', options: ['up to the sky', 'up to the city wall', 'up to the sea'] },
    { q: 'Who comes down to see the city and the tower?', options: ['God', 'an angel', 'the king'] },
    { q: 'What happens when God confuses the language?', options: ['The people no longer understand one another.', 'The people fall silent.', 'The people build faster.'] },
    { q: 'What is the city called in the end?', options: ['Babel', 'Eden', 'Shinar'] }
  ]
}
