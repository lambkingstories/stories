/**
 * English texts of the adventure "The King Is Coming" (8 to 10 years): the same shape as `../propheten.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Isaiah, Micah, Zebulun, Naphtali, Jesse, Bethlehem Ephratah); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Propheten/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Propheten/tools/bauen_propheten.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const prophetenEn: TextOverlay<Journey> = {
  title: 'The King Is Coming',
  subtitle: 'What the Prophets Say',
  gift: { title: 'Lion and Lamb' },
  stages: [
    {
      title: 'The great light',
      ref: 'Isaiah 9:1–4',
      text: [
        'The prophet Isaiah speaks to the people. In Zebulun and Naphtali, in Galilee by the way of the sea, people are afraid. It has grown dark around them. "But it will not stay dark," says Isaiah.',
        '"The people that walked in darkness have seen a great light," he cries. "Upon those who live in the land of the shadow of darkness, the light has shined."',
        'Then Isaiah speaks to God: "You make their joy great, as men rejoice in the harvest. You break the heavy yoke on their shoulder and the rod of their driver, as in the day of Midian."'
      ],
      task: { hint: 'Put the picture of the light over the land together.' },
      questions: [
        { q: 'Where are the people afraid?', options: ['in Zebulun and Naphtali', 'in Egypt', 'in Babylon'] },
        { q: 'What do the people who walk in darkness see?', options: ['a great light', 'a high tower', 'a great army'] }
      ]
    },
    {
      title: 'Unto us a child is born',
      ref: 'Isaiah 9:5–7',
      text: [
        'Isaiah calls out something great to the people. All the armor of the soldiers, who march with a great noise, will be burned and eaten up by the fire.',
        '"For unto us a child is born," he says, "unto us a son is given. The government rests upon his shoulder." He names the child: Wonderful, Counsellor, Mighty God, Everlasting Father, Prince of Peace.',
        'His rule will grow great. Of the increase of his peace there will be no end, upon the throne of David and over his kingdom. He will establish it with justice and righteousness, from now on and for ever. The zeal of the Lord of hosts will do this.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“For unto us a child is ', ', unto us a son is given.”'], words: ['born', 'found', 'lost'] },
            { hint: 'Now two words are missing.', parts: ['“Of the increase of his peace there will be no ', ' upon the ', ' of David.”'], words: ['end', 'throne', 'beginning', 'tower'] }
          ]
        }
      },
      questions: [
        { q: 'What happens to the soldiers’ armor?', options: ['It is burned.', 'It is sold.', 'It is buried.'] },
        { q: 'On whose throne will the peace have no end?', options: ['on the throne of David', 'on the throne of Pharaoh', 'on the throne of Saul'] }
      ]
    },
    {
      title: 'Bethlehem',
      ref: 'Micah 5:2; Matthew 2:1–6',
      text: [
        'The prophet Micah also speaks of a ruler. "And you, Bethlehem Ephratah," says the Lord through Micah, "you are little among the thousands of Judah. Out of you will come to me the one who is to be ruler in Israel." His goings forth are from of old, from everlasting. In Bethlehem David once kept his father’s sheep.',
        'Many hundreds of years later wise men from the east ask in Jerusalem about the newborn king. King Herod calls together the chief priests and scribes. He asks them where the new king is to be born.',
        '"In Bethlehem," they answer, "for so it is written by the prophet."'
      ],
      task: {
        hint: 'Find the five lambs in Bethlehem: one has a red, one a blue, one a yellow and one a green ribbon, and one wears a little bell.',
        find: { labels: ['Lamb with a red ribbon', 'Lamb with a yellow ribbon', 'Lamb with a blue ribbon', 'Lamb with a green ribbon', 'Lamb with a bell'], doneText: 'You have found all five lambs: the red, blue, yellow and green ones and the one with the bell!' }
      },
      questions: [
        { q: 'What does the Lord call the town of Bethlehem through Micah?', options: ['little among the thousands of Judah', 'the biggest city in the land', 'the king’s capital'] },
        { q: 'Whom does King Herod call together?', options: ['the chief priests and scribes', 'the shepherds', 'the soldiers'] }
      ]
    },
    {
      title: 'A branch from the stem of Jesse',
      ref: 'Isaiah 11:1–5',
      text: [
        'Isaiah speaks of the stem of Jesse. Jesse is the father of King David. "There will come forth a rod out of the stem of Jesse," he says, a young shoot. "A branch will grow out of his roots and bear fruit."',
        'On this branch the Spirit of the Lord will rest. It is the spirit of wisdom and understanding. It is the spirit of counsel and might. It is the spirit of knowledge and of the fear of the Lord.',
        'Isaiah speaks of the branch as of a man. He will not judge by what his eyes see. He will not decide by what his ears hear. With righteousness he will judge the poor and decide for the meek of the earth. Righteousness will be the belt around his waist.'
      ],
      task: {
        hint: 'Put the pictures in the order in which the branch grows.',
        order: {
          cards: [{ label: 'The old tree stump' }, { label: 'A first young shoot' }, { label: 'A branch with many leaves' }, { label: 'A strong branch with fruit' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order in which the branch grows. The dots show where they go.' }, { hint: 'Round 2: Now with the stump and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Who is Jesse?', options: ['the father of King David', 'a prophet', 'a king of Babylon'] },
        { q: 'What will come forth from the stem of Jesse?', options: ['a rod and a branch', 'a wall', 'a tent'] }
      ]
    },
    {
      title: 'The servant of God',
      ref: 'Isaiah 53:1–6',
      text: [
        'Isaiah speaks of a servant of God. He grows up like a branch in dry ground. He has no beauty that we would want. "We thought nothing of him," says Isaiah. "We hid our faces from him. He was despised and full of pain."',
        '"But he has borne our griefs and carried our sorrows. We thought God had struck him. But he was wounded for our sins. The punishment is upon him, so that we may have peace. With his stripes we are healed."',
        '"All we like sheep have gone astray," says Isaiah, "each one turned to his own way. But the Lord laid on him the sin of us all."'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How does Isaiah describe the servant of God?', options: ['despised and full of pain', 'rich and powerful', 'strong like a soldier'] },
        { q: 'What does Isaiah compare the people to?', options: ['sheep that go astray', 'birds in the wind', 'wolves in the forest'] },
        { q: 'What lies on the servant so that we may have peace?', options: ['the punishment', 'the crown', 'the gold'] }
      ]
    },
    {
      title: 'Wolf and lamb',
      ref: 'Isaiah 11:6–9',
      text: [
        'Isaiah goes on to say how it will be. "The wolf will dwell with the lamb," he says, "and the leopard will lie down with the young goat."',
        'The calf and the young lion will go together, and a little child will lead them. Cows and bears will feed side by side, and their young ones will lie down together. The lion will eat straw like the ox. A baby will have joy at the hole of the asp. The asp is a poisonous snake.',
        '"They will not hurt or destroy in all my holy mountain," says the Lord through Isaiah. "For the earth will be full of the knowledge of the Lord, as the waters cover the sea."'
      ],
      task: {
        hint: 'Bring the animals together, as Isaiah says.',
        peace: {
          animals: [
            { label: 'Wolf' },
            { label: 'Leopard' },
            { label: 'Lion' },
            { label: 'Bear' },
            { label: 'Lamb' },
            { label: 'Young goat' },
            { label: 'Calf' },
            { label: 'Cow' }
          ],
          rounds: [
            { hint: 'Bring the animals together, as Isaiah says. The list above helps you: tap one animal and then its partner.' },
            { hint: 'Once more, now without the list: Who lives with whom?' }
          ]
        }
      },
      questions: [
        { q: 'With whom will the wolf dwell?', options: ['with the lamb', 'with the eagle', 'with the fox'] },
        { q: 'What will the lion eat, according to Isaiah?', options: ['straw', 'meat', 'fish'] }
      ]
    },
    {
      title: 'Like a lamb',
      ref: 'Isaiah 53:7–12',
      text: [
        'Isaiah speaks once more of the servant. He is hurt, but he does not open his mouth. He is quiet like a lamb that is led away, and like a sheep before the one who shears it.',
        'He dies, although he has done no wrong to anyone and there was no deceit in his mouth. They give him his grave with the wicked and with the rich.',
        'But the Lord willed it so. The servant gives his life as an offering for sin. Then he will live long, and through him what the Lord has planned will succeed. After his toil he will be glad and have fullness. "My righteous servant will make many righteous," says the Lord. He has borne the sin of many and prayed for the wrongdoers.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'How does the servant behave when he is hurt?', options: ['He stays quiet like a lamb.', 'He cries out loud.', 'He fights back.'] },
        { q: 'Has the servant done wrong to anyone?', options: ['No, to no one.', 'Yes, to many.', 'Yes, to the king.'] },
        { q: 'For whom has he prayed?', options: ['for the wrongdoers', 'for the soldiers', 'for the angels'] }
      ]
    },
    {
      title: 'Swords into plowshares',
      ref: 'Micah 4:1–4',
      text: [
        'Micah says what it will be like in the last days. The mountain with the house of the Lord will be higher than all mountains. Many nations will hurry there and call: "Come, let us go up to the house of the God of Jacob! He will teach us his ways, and we will walk in his paths!"',
        'The Lord will judge among the nations. Then they will beat their swords into plowshares and their spears into pruning hooks. No nation will lift up a sword against another. No one will learn to fight any more.',
        '"Everyone will sit under his vine and under his fig tree, and no one will make them afraid," says Micah. And Micah adds: "The mouth of the Lord of hosts has spoken it."'
      ],
      task: {
        hint: 'Beat the weapons into tools for the fields.',
        forge: {
          items: [
            { label: 'Sword' },
            { label: 'Spear' },
            { label: 'Plowshare' },
            { label: 'Pruning hook' },
            { label: 'Hammer' },
            { label: 'Glowing metal' }
          ],
          rounds: [
            { hint: 'Strike the anvil three times. Then choose what the sword is to become, as Micah says.' },
            { hint: 'Now a spearhead lies on the anvil. What does it become?' },
            { hint: 'A sword once more. Think of Micah’s words.' },
            { hint: 'At the end the spearhead again.' }
          ]
        }
      },
      questions: [
        { q: 'What do the nations make of their swords?', options: ['plowshares', 'cups', 'walls'] },
        { q: 'What do they make of their spears?', options: ['pruning hooks', 'hammers', 'nails'] }
      ]
    },
    {
      title: 'The peace and the king',
      ref: 'Micah 4:6–7; 5:4–5',
      text: [
        'Micah says what the Lord will do. "In that day I will gather those who limp and bring together those who were driven away," says the Lord. "Those who limp will have an inheritance, and I will make a strong nation of those who were driven away." The Lord will be king over them on Mount Zion. That is from now on and for ever.',
        'And once more Micah speaks of the ruler from Bethlehem. He will stand and feed his flock in the strength of the Lord and in the name of the Lord, his God. They will live there, and he will be great to the ends of the earth.',
        '"And this man will be the peace," says Micah.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The shepherd’s staff: He will stand and feed his flock.' }, { text: 'The crown: The Lord will be king over them.' }, { text: 'The plowshare: Swords are beaten into plowshares.' }, { text: 'The pruning hook: Spears are beaten into pruning hooks.' }, { text: 'The grapes: Everyone will sit under his vine.' }, { text: 'The fig: Everyone will sit under his fig tree.' }] }
      },
      questions: [
        { q: 'Whom will the Lord gather according to Micah?', options: ['those who limp and those who were driven away', 'only the rich', 'only the soldiers'] },
        { q: 'What does Micah say about the ruler from Bethlehem?', options: ['He will be our peace.', 'He will make us rich.', 'He will build a city.'] }
      ]
    }
  ],
  exam: [
    { q: 'What do the people who walk in darkness see?', options: ['a great light', 'a high tower', 'a great army'] },
    { q: 'From which town will the ruler come, says Micah?', options: ['from Bethlehem', 'from Jericho', 'from Shushan'] },
    { q: 'Who is Jesse?', options: ['the father of King David', 'the brother of Moses', 'a king of Babylon'] },
    { q: 'What does Isaiah compare the people who go astray to?', options: ['sheep', 'birds', 'wolves'] },
    { q: 'What will the lion eat, according to Isaiah?', options: ['straw', 'meat', 'fish'] },
    { q: 'What do the nations make of their swords?', options: ['plowshares', 'cups', 'walls'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
prophetenEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/propheten/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
