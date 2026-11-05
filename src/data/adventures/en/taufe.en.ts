/**
 * English texts of the adventure "The Young Jesus and His Baptism" (8 to 10 years): the same shape as `../taufe.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Mary, Joseph, John the Baptist, Jordan, Capernaum, Simon called Peter, Andrew, James, Zebedee); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Taufe/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Taufe/tools/bauen_taufe.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const taufeEn: TextOverlay<Journey> = {
  title: 'The Young Jesus and His Baptism',
  subtitle: 'From the Temple in Jerusalem to the Lake',
  gift: { title: 'The Fishing Boat' },
  stages: [
    {
      title: 'Jesus Stays in Jerusalem',
      ref: 'Luke 2:41–45',
      text: [
        'Every year Mary and Joseph go to Jerusalem for the Passover. When Jesus is twelve years old, they take him along. A large group travels up from Nazareth, and relatives and friends are with them.',
        'After the days of the feast, everyone goes home again. But the boy Jesus stays behind in Jerusalem, and his parents do not notice. They think he is somewhere in the group.',
        'They walk on for a whole day. Then they look for him among their relatives and friends, but they cannot find him. So they turn around and go back to Jerusalem to look for him.'
      ],
      task: {
        hint: 'Look in the group: find five relatives and friends.',
        find: { labels: ['Uncle with a walking staff', 'Aunt with a water jar', 'Neighbor with a bundle', 'Grandmother with a stick', 'Girl with a basket'], doneText: 'You have found all five: the uncle, the aunt, the neighbor, the grandmother and the girl. But Jesus is not with them.' }
      },
      questions: [
        { q: 'How old is Jesus when he goes to Jerusalem?', options: ['twelve years old', 'seven years old', 'thirty years old'] },
        { q: 'Where do Mary and Joseph go every year for the Passover?', options: ['to Jerusalem', 'to Bethlehem', 'to Jericho'] }
      ]
    },
    {
      title: 'In His Father’s House',
      ref: 'Luke 2:46–52',
      text: [
        'After three days they find Jesus in the temple. He sits in the middle of the teachers, listens to them and asks them questions. Everyone who hears him is amazed at his understanding and his answers.',
        'Mary and Joseph are amazed when they see him. “Son, why have you done this to us?” says Mary. “Your father and I have looked for you in great distress.”',
        '“Why did you look for me?” asks Jesus. “Did you not know that I must be in my Father’s house?” They do not understand the words he says to them.',
        'Jesus goes down with them to Nazareth and obeys them. Mary keeps all these words in her heart. Jesus grows in wisdom and in stature, and in favor with God and with people.'
      ],
      task: {
        hint: 'Roll the scroll up and down and find the pictures you are looking for.',
        scroll: {
          tiles: [{ label: 'the temple' }, { label: 'the lamb' }, { label: 'the donkey' }, { label: 'the jar' }, { label: 'the bread basket' }, { label: 'the city gate' }, { label: 'the palm tree' }, { label: 'the oil lamp' }],
          rounds: [{ hint: 'Jesus sits in the temple among the teachers. Roll the scroll until the picture you are looking for stands in the middle.' }, { hint: 'Now the scroll is longer, and the picture must stand exactly in the middle.' }]
        }
      },
      questions: [
        { q: 'Where do Mary and Joseph find the boy Jesus?', options: ['in the temple', 'in the market', 'at the city gate'] },
        { q: 'What does Jesus do among the teachers?', options: ['He listens to them and asks them questions.', 'He sleeps.', 'He runs away.'] }
      ]
    },
    {
      title: 'John Calls in the Wilderness',
      ref: 'Matthew 3:1–12',
      text: [
        'Many years later John the Baptist comes into the wilderness of Judea. He wears clothes made of camel’s hair and a leather belt. He eats locusts and wild honey.',
        'John calls to the people: “Turn back to God! The kingdom of heaven is near.” The prophet Isaiah spoke of him: A voice cries in the wilderness: “Prepare the way of the Lord and make his paths straight!”',
        'The people come out to him, from Jerusalem, from all Judea and from the land along the Jordan. They confess their sins, and John baptizes them in the Jordan.',
        '“I baptize you with water,” he says. “But one is coming after me who is stronger than I am. I am not good enough to carry his sandals. He will baptize you with the Holy Spirit.”'
      ],
      task: {
        hint: 'Clear the road for the Lord: tap the stones, thorns and branches.',
        road: {
          items: [
            { label: 'Boulder' },
            { label: 'Heap of stones' },
            { label: 'Thornbush' },
            { label: 'Fallen branch' },
            { label: 'Traveler with a staff' },
            { label: 'Woman with a child' }
          ],
          rounds: [
            { hint: 'Clear the road: tap stones, thorns and branches. Leave the travelers alone.' },
            { hint: 'There is more on the road. Clear it all.' }
          ]
        }
      },
      questions: [
        { q: 'What does John the Baptist wear?', options: ['clothes made of camel’s hair', 'a royal robe', 'a sheepskin'] },
        { q: 'What does John eat?', options: ['locusts and wild honey', 'bread and fish', 'dates and milk'] }
      ]
    },
    {
      title: 'Jesus Is Baptized',
      ref: 'Matthew 3:13–17',
      text: [
        'One day Jesus comes from Galilee to the Jordan, to John. He wants John to baptize him. John tries to stop him: “I need to be baptized by you, and you come to me?”',
        'Jesus answers: “Let it be so now. In this way we do what is right before God.” Then John agrees and baptizes Jesus in the Jordan.',
        'As Jesus comes up out of the water, heaven opens above him. He sees the Spirit of God coming down like a dove and resting on him.',
        'And a voice from heaven says: “This is my beloved Son. I am well pleased with him.”'
      ],
      task: {
        hint: 'Put the four pictures in the order of the story.',
        order: {
          cards: [{ label: 'Jesus comes to the Jordan' }, { label: 'John baptizes Jesus in the Jordan' }, { label: 'Jesus comes up out of the water' }, { label: 'Heaven opens' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the way to the Jordan and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Who baptizes Jesus?', options: ['John', 'Peter', 'Joseph'] },
        { q: 'Where is Jesus baptized?', options: ['in the Jordan', 'in the Sea of Galilee', 'in the sea'] }
      ]
    },
    {
      title: 'Forty Days in the Wilderness',
      ref: 'Matthew 4:1–4',
      text: [
        'Afterward the Spirit leads Jesus into the wilderness. There he is to be tempted. The wilderness is dry, and stones lie everywhere. For forty days and forty nights Jesus fasts and eats nothing. After that he is very hungry.',
        'Then the tempter comes to him. “If you are the Son of God,” he says, “tell these stones to become bread.”',
        'Jesus does not make bread out of the stones. He answers with a word from Scripture that God has said: “It is written: A person does not live on bread alone, but on every word that comes out of the mouth of God.”'
      ],
      task: {
        hint: 'Tap a shadow. Jesus walks there and stays in the shade.',
        shadowWalk: {
          things: [{ label: 'the boulder' }, { label: 'the tall rock' }, { label: 'the flat rock' }, { label: 'the thornbush' }, { label: 'the tamarisk bush' }, { label: 'the big rock' }],
          rounds: [{ hint: 'The sun moves across the wilderness. Lead Jesus from shade to shade to the big rock.' }, { hint: 'The way is longer and the sun is hotter. Do not stay in the sun too long.' }]
        }
      },
      questions: [
        { q: 'How long does Jesus fast in the wilderness?', options: ['forty days and forty nights', 'seven days', 'three days'] },
        { q: 'What should the stones become, says the tempter?', options: ['bread', 'gold', 'water'] }
      ]
    },
    {
      title: 'On the Temple and on the Mountain',
      ref: 'Matthew 4:5–11',
      text: [
        'Then the tempter takes Jesus to the Holy City and sets him on the highest point of the temple. “If you are the Son of God, throw yourself down,” he says. “For it is written: His angels will carry you in their hands.” Jesus answers: “It is also written: You shall not put the Lord your God to the test.”',
        'Last, the tempter takes him up a very high mountain. He shows him all the kingdoms of the world in their splendor. “All this I will give you,” he says, “if you kneel down and worship me.”',
        'Then Jesus says: “Get away, Satan! It is written: You shall worship the Lord your God and serve him alone.”',
        'Then the tempter leaves him. And angels come to Jesus and serve him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does the tempter put Jesus on in the Holy City?', options: ['the highest point of the temple', 'a rooftop', 'the city wall'] },
        { q: 'What does the tempter show Jesus on the very high mountain?', options: ['all the kingdoms of the world', 'a great sea', 'his hometown'] },
        { q: 'Whom should one serve alone, says Jesus?', options: ['God, the Lord', 'the tempter', 'the kings'] }
      ]
    },
    {
      title: 'Jesus Moves to Capernaum',
      ref: 'Matthew 4:12–17',
      text: [
        'Jesus hears that John has been arrested. So he goes to Galilee. He leaves Nazareth and lives in Capernaum, a town by the lake, in the land of Zebulun and Naphtali. He lives there by the lake now.',
        'So it happens as the prophet Isaiah said about this land by the way to the sea: “The people who sat in darkness have seen a great light. For those who live in the dark, a light has dawned.”',
        'From then on Jesus begins to preach. He tells the people: “Turn back to God! The kingdom of heaven is near.”'
      ],
      task: {
        hint: 'Pull the sun up along the arc until there is light over every village by the lake.',
        sunrise: {
          rounds: [
            { hint: 'It is still dark over the land by the lake. Pull the sun up along the arc until there is light over every village.', villages: [{ name: 'Capernaum' }, { name: 'a village by the lake' }, { name: 'a village on the hillside' }, { name: 'a fishing village' }] },
            { hint: 'Now there are more villages. Find the place on the arc where there is light everywhere.', villages: [{ name: 'Capernaum' }, { name: 'a village by the lake' }, { name: 'a village on the hillside' }, { name: 'a larger village' }, { name: 'a fishing village' }, { name: 'a village with a well' }] }
          ]
        }
      },
      questions: [
        { q: 'Where does Jesus live now?', options: ['in Capernaum', 'in Nazareth', 'in Jerusalem'] },
        { q: 'What did the people who sat in darkness see?', options: ['a great light', 'a great star', 'a great fire'] }
      ]
    },
    {
      title: 'Jesus Calls Four Fishermen',
      ref: 'Matthew 4:18–22',
      text: [
        'Jesus walks along the Sea of Galilee and sees two brothers: Simon, who is called Peter, and Andrew. They are fishermen and are casting their nets into the lake.',
        '“Follow me!” says Jesus. “I will make you fishers of people.” At once they leave their nets lying there and go with him.',
        'A little farther on, Jesus sees two other brothers: James, the son of Zebedee, and his brother John. They are sitting in the boat with their father Zebedee, mending their nets. Jesus calls them.',
        'At once they leave the boat and their father and follow Jesus.'
      ],
      task: {
        hint: 'Cast the net: tap where the fish are swimming.',
        net: {
          rounds: [
            { hint: 'Cast the net: tap where the fish are swimming.' },
            { hint: 'Once more. This time more fish are swimming in the lake.' }
          ]
        }
      },
      questions: [
        { q: 'What are Simon and Andrew by trade?', options: ['fishermen', 'shepherds', 'tax collectors'] },
        { q: 'What does Jesus want to make them?', options: ['fishers of people', 'shepherds', 'farmers'] }
      ]
    },
    {
      title: 'Jesus Teaches and Heals',
      ref: 'Matthew 4:23–25',
      text: [
        'Jesus goes through all of Galilee. He teaches in the synagogues, the houses where the people come together to hear God’s word. He tells about the kingdom of God. He heals the people of every sickness and pain.',
        'The news about him spreads as far as Syria. The people bring all the sick to him, even those who are in great pain. Jesus heals them all.',
        'A great crowd of people follows him. They come from Galilee, from the Ten Towns, from Jerusalem, from Judea and from across the Jordan.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Jesus teach in Galilee?', options: ['in the synagogues', 'on the sea', 'only in the temple'] },
        { q: 'What does Jesus do with the sick who are brought to him?', options: ['He heals them.', 'He sends them away.', 'He gives them money.'] },
        { q: 'Where do the people who follow him come from?', options: ['from Galilee, Jerusalem and Judea', 'only from Nazareth', 'only from Rome'] }
      ]
    }
  ],
  exam: [
    { q: 'Where do Mary and Joseph find the boy Jesus?', options: ['in the temple', 'in the market', 'at the city gate'] },
    { q: 'What does John the Baptist eat?', options: ['locusts and wild honey', 'bread and fish', 'dates and milk'] },
    { q: 'How does the Spirit of God come down on Jesus?', options: ['like a dove', 'like an eagle', 'like a storm'] },
    { q: 'How long does Jesus fast in the wilderness?', options: ['forty days and forty nights', 'seven days', 'three days'] },
    { q: 'Whom should one serve alone, says Jesus?', options: ['God, the Lord', 'the tempter', 'the kings'] },
    { q: 'What does Jesus want to make Simon and Andrew?', options: ['fishers of people', 'shepherds', 'farmers'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
taufeEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/taufe/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
