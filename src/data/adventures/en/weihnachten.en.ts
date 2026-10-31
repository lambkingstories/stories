/**
 * English texts of the adventure "Christmas" (8 to 10 years): the same shape as `../weihnachten.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Mary, Joseph, Gabriel, Elisabeth, Zacharias, Augustus, Cyrenius, Bethlehem, Herod); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Weihnachten/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Weihnachten/tools/bauen_weihnachten.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const weihnachtenEn: TextOverlay<Journey> = {
  title: 'Christmas',
  subtitle: 'The Story of the Birth of Jesus',
  gift: { title: 'The Manger' },
  stages: [
    {
      title: 'The angel comes to Mary',
      ref: 'Luke 1:26–38',
      text: [
        'In the town of Nazareth in Galilee lives a young woman. Her name is Mary, and she is engaged to Joseph, a man from the house of David. One day the angel Gabriel comes to her. "Greetings, you who are highly favored!" he says. "The Lord is with you."',
        'Mary is afraid and wonders what this greeting means. "Do not be afraid, Mary," says the angel. "You will have a son, and you shall call him Jesus. He will be great and will be called the Son of the Highest. His kingdom will have no end."',
        '"How can this be? I have no husband," asks Mary. The angel answers: "The Holy Spirit will come upon you. Therefore the child will be called the Son of God. With God nothing is impossible." Then Mary says: "Behold, I am the servant of the Lord. Let it be to me according to your word." Then the angel leaves her.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Behold, I am the ', ' of the Lord. Let it be to me according to your word.”'], words: ['servant', 'king', 'shepherd'] },
            { hint: 'Now two words are missing.', parts: ['“With God ', ' is ', '.”'], words: ['nothing', 'impossible', 'everything', 'hard'] }
          ]
        }
      },
      questions: [
        { q: 'What is the name of the angel who comes to Mary?', options: ['Gabriel', 'Michael', 'Raphael'] },
        { q: 'What is Mary to call her son?', options: ['Jesus', 'John', 'David'] }
      ]
    },
    {
      title: 'Mary visits Elisabeth',
      ref: 'Luke 1:39–56',
      text: [
        'Mary sets out in haste. The angel has told her that Elisabeth, too, is expecting a son, although she is already old. Mary goes into the hill country of Judah, to the house of the priest Zacharias, and greets Elisabeth, his wife. When Elisabeth hears Mary’s greeting, the child leaps in her womb.',
        'Elisabeth is filled with the Holy Spirit and cries out in a loud voice: "Blessed are you among women! Why is this granted to me, that the mother of my Lord should come to me?" And she says: "Blessed is she who believed!"',
        'Then Mary praises God: "My soul magnifies the Lord, and my spirit rejoices in God my Savior. He has done great things for me. He fills the hungry with good things." Mary stays with Elisabeth about three months. Then she goes back home.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'To whom does Mary go in the hill country?', options: ['to Elisabeth', 'to Hannah', 'to Ruth'] },
        { q: 'What does the child in Elisabeth’s womb do when she hears Mary’s greeting?', options: ['It leaps.', 'It cries.', 'It sleeps.'] },
        { q: 'How long does Mary stay with Elisabeth?', options: ['three months', 'three days', 'a year'] }
      ]
    },
    {
      title: 'Joseph’s dream',
      ref: 'Matthew 1:18–24',
      text: [
        'Mary is to become Joseph’s wife. Then Joseph notices that she is expecting a child. He is a righteous man and does not want to shame her. So he thinks of leaving her quietly.',
        'While he is still thinking about it, an angel of the Lord appears to him in a dream. "Joseph, son of David," he says, "do not be afraid to take Mary to you. The child is from the Holy Spirit. She will bear a son, and you shall call him Jesus. For he will save his people from their sins."',
        'Joseph wakes up and does what the angel of the Lord told him. He takes Mary to him.'
      ],
      task: {
        hint: 'Put the pictures in the order of the story.',
        order: {
          cards: [{ label: 'Joseph thinks and worries' }, { label: 'Joseph sleeps and dreams' }, { label: 'Joseph wakes up' }, { label: 'Joseph takes Mary to him' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with Joseph’s worries and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does Joseph first want to do?', options: ['leave Mary quietly', 'go away with Mary at once', 'send Mary to his parents'] },
        { q: 'What is the child to be called, says the angel?', options: ['Jesus', 'Joseph', 'David'] }
      ]
    },
    {
      title: 'On to Bethlehem',
      ref: 'Luke 2:1–5',
      text: [
        'Emperor Augustus commands that all people in his empire be counted. It is the very first such counting, and in Syria Cyrenius is governor at that time. Everyone is to go to his own city and be registered there.',
        'Joseph also sets out. He belongs to the house of David, so he must go to Bethlehem, the city of David. From Nazareth in Galilee the way leads up into the land of Judea.',
        'Joseph wants to be registered together with Mary. Mary, his betrothed, goes with him. She is expecting her child. Many others are on the road too, for everyone is going to his own city.'
      ],
      task: {
        hint: 'Find Joseph, Mary and three other travelers on the crowded road to Bethlehem.',
        find: { labels: ['Joseph', 'Old man with a walking staff', 'Mary', 'Girl with a basket', 'Merchant with a clay jar'], doneText: 'You have found all five travelers: Joseph, Mary, the merchant, the old man and the girl with the basket!' }
      },
      questions: [
        { q: 'Who commands that everyone be counted?', options: ['Emperor Augustus', 'King Herod', 'Pilate'] },
        { q: 'To which city does Joseph go?', options: ['to Bethlehem', 'to Jericho', 'to Jerusalem'] }
      ]
    },
    {
      title: 'No room in the inn',
      ref: 'Luke 2:6–7, 21',
      text: [
        'When Joseph and Mary are in Bethlehem, the time comes for Mary to give birth. She has her firstborn son. She wraps him in swaddling cloths and lays him in a manger. For there is no room for them in the inn.',
        'A manger is a feeding trough for animals. An inn is a place where guests stay overnight. Joseph is with Mary and with the child.',
        'On the eighth day the boy is given his name. He is called Jesus. The angel had said so before Mary was expecting the child. Joseph and Mary do what they were told.'
      ],
      task: {
        hint: 'Help Mary to wrap the child and to lay him in the manger.',
        crib: {
          items: [
            { label: 'Swaddling cloths' },
            { label: 'Royal robe' },
            { label: 'Animal fur' },
            { label: 'Manger' },
            { label: 'Golden bed' },
            { label: 'Basket' }
          ],
          rounds: [
            { hint: 'Mary wants to wrap the child. What does she wrap him in? Choose the right cloth.' },
            { hint: 'Now Mary lays the child down. Where does she lay him? Choose the right bed.' }
          ]
        }
      },
      questions: [
        { q: 'Where does Mary lay the child?', options: ['in a manger', 'in a bed', 'in a basket'] },
        { q: 'Why does the child lie in a manger?', options: ['There is no room in the inn.', 'The child likes it there.', 'The emperor commanded it.'] }
      ]
    },
    {
      title: 'The shepherds and the angel',
      ref: 'Luke 2:8–14',
      text: [
        'Not far from Bethlehem shepherds are in the field by the sheepfolds, the pens for the sheep. They keep watch over their flock by night. Then an angel of the Lord stands before them, and the glory of the Lord shines around them. The shepherds are very afraid.',
        '"Do not be afraid!" says the angel. "I bring you good news of great joy for all people. Today a Savior is born to you, Christ the Lord, in the city of David. This will be the sign: you will find the child wrapped in swaddling cloths and lying in a manger."',
        'Suddenly a great company of angels from heaven is with the angel. They praise God: "Glory to God in the highest, and on earth peace among those with whom he is pleased!"'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The shepherd’s staff: The shepherds keep watch over their flock by night.' }, { text: 'The sheep: The shepherds keep their flock.' }, { text: 'The lantern: It is night in the field.' }, { text: 'The swaddling cloths: The child is wrapped in swaddling cloths.' }, { text: 'The manger: The child lies in a manger.' }, { text: 'The sheepfold: The shepherds are in the field by the sheepfolds.' }] }
      },
      questions: [
        { q: 'What do the shepherds do at night?', options: ['They keep watch over their flock.', 'They sleep in the house.', 'They harvest the grain.'] },
        { q: 'How are the shepherds to know the child?', options: ['wrapped in swaddling cloths, in a manger', 'with a crown, on a throne', 'in a royal robe, in a palace'] }
      ]
    },
    {
      title: 'The shepherds at the manger',
      ref: 'Luke 2:15–20',
      text: [
        'When the angels have gone, the shepherds say to one another: "Come, let us go to Bethlehem and see what has happened. The Lord has told us."',
        'They hurry there. They find Mary and Joseph and the child lying in the manger. They tell everywhere what was said to them about this child. All who hear it wonder at what the shepherds say.',
        'But Mary keeps all these words and thinks about them in her heart. The shepherds return. They praise and glorify God for all that they have heard and seen, just as it was told them.'
      ],
      task: {
        hint: 'Find the place with the sign: the child in swaddling cloths, in a manger.',
        sign: {
          places: [
            { label: 'A house full of travelers' },
            { label: 'An inn full of guests' },
            { label: 'A house with laundry' },
            { label: 'A house with a cart' },
            { label: 'An empty house' },
            { label: 'The shelter with the manger' }
          ],
          rounds: [
            { hint: 'The angel said: You will find the child wrapped in swaddling cloths and lying in a manger. Look for the sign. Tap a place.' },
            { hint: 'Once more: Where does the child lie in the manger? The places stand differently now.' },
            { hint: 'For the third time: Find the place with the sign.' }
          ]
        }
      },
      questions: [
        { q: 'What do the shepherds do when the angels have gone?', options: ['They go to Bethlehem.', 'They stay with their flock.', 'They travel to Jerusalem.'] },
        { q: 'What does Mary keep?', options: ['all these words in her heart', 'a piece of wool', 'the swaddling cloths'] }
      ]
    },
    {
      title: 'The wise men and the star',
      ref: 'Matthew 2:1–12',
      text: [
        'In the time of King Herod wise men from the east come to Jerusalem. "Where is the one who has been born king of the Jews?" they ask. "We have seen his star and want to worship him."',
        'Herod is troubled. He asks the chief priests and scribes where the Christ is to be born. "In Bethlehem," they say. Then Herod sends the wise men there secretly: "When you find the child, tell me."',
        'The star that the wise men saw in the east goes before them. It stops over the house where the child is. They find him with Mary, his mother. They fall down and worship him. They give him gold, frankincense and myrrh. God tells them in a dream not to go back to Herod. They go home another way.'
      ],
      task: { hint: 'Put the picture of the star over Bethlehem together.' },
      questions: [
        { q: 'What did the wise men see in the east?', options: ['a star', 'a cloud', 'a pillar of fire'] },
        { q: 'What do the wise men give the child?', options: ['gold, frankincense and myrrh', 'bread, wine and oil', 'wool, honey and figs'] }
      ]
    },
    {
      title: 'To Egypt and back home',
      ref: 'Matthew 2:13–15, 19–23',
      text: [
        'After the wise men have left, an angel of the Lord appears to Joseph in a dream. "Get up," he says, "take the child and his mother and flee to Egypt. Stay there until I tell you. For Herod will seek the child to do him harm."',
        'Joseph gets up. By night he takes the child and Mary and goes to Egypt. They stay there until Herod has died.',
        'Then the angel appears to Joseph in a dream once more. "Get up and go back to the land of Israel," he says. Joseph comes back with the child and Mary. But in Judea a son of Herod is now king, and Joseph is afraid of that. Then God tells him in a dream where to go. So he goes to Galilee. There they live in the town of Nazareth.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Joseph flee with Mary and the child?', options: ['to Egypt', 'to Babylon', 'to Rome'] },
        { q: 'How does Joseph learn what he is to do?', options: ['An angel speaks to him in a dream.', 'A letter comes to him.', 'The wise men tell him.'] },
        { q: 'Where do they live in the end?', options: ['in Nazareth', 'in Jerusalem', 'in Bethlehem'] }
      ]
    }
  ],
  exam: [
    { q: 'What is the name of the angel who comes to Mary?', options: ['Gabriel', 'Michael', 'Raphael'] },
    { q: 'How long does Mary stay with Elisabeth?', options: ['three months', 'three days', 'a year'] },
    { q: 'To which city do Joseph and Mary go for the counting?', options: ['to Bethlehem', 'to Jericho', 'to Jerusalem'] },
    { q: 'Where does Mary lay the child?', options: ['in a manger', 'in a bed', 'in a basket'] },
    { q: 'What do the angels call out when they praise God?', options: ['Glory to God in the highest', 'Come all to the temple', 'Go home quickly'] },
    { q: 'What do the wise men give the child?', options: ['gold, frankincense and myrrh', 'bread, wine and oil', 'wool, honey and figs'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
weihnachtenEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/weihnachten/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
