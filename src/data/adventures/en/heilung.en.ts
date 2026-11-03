/**
 * English texts of the adventure "Jesus Heals" (8 to 10 years): the same shape as `../heilung.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Capernaum, Nain, Jericho, Bartimaeus, Samaritan, Rabboni); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Heilung/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Heilung/tools/bauen_heilung.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const heilungEn: TextOverlay<Journey> = {
  title: 'Jesus Heals',
  subtitle: 'From the Man with Leprosy to Bartimaeus',
  gift: { title: 'The Cloak by the Road' },
  stages: [
    {
      title: 'If You Will',
      ref: 'Luke 5:12–14',
      text: [
        'In a town in Galilee Jesus meets a man who has leprosy. That is a skin disease that everyone is afraid of, and so the man has to live alone.',
        'When he sees Jesus, he throws himself down on the ground. “Lord,” he begs, “if you will, you can make me clean.”',
        'Jesus stretches out his hand and touches him. “I will,” he says. “Be clean!” At once the disease is gone.',
        'Then Jesus says to him: “Tell no one. Go and show yourself to the priest, as Moses commanded.”'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Lord, if you will, you can make me ', '.”'], words: ['clean', 'loud', 'tired'] },
            { hint: 'Now two words are missing.', parts: ['Jesus stretches out his ', ' and says: “I will. Be ', '!”'], words: ['hand', 'clean', 'fist', 'quiet'] }
          ]
        }
      },
      questions: [
        { q: 'What does the man ask?', options: ['That Jesus will make him clean.', 'That Jesus will give him bread.', 'That Jesus will take him home.'] },
        { q: 'What does Jesus do when the man asks?', options: ['He stretches out his hand and touches him.', 'He walks on.', 'He sends him away.'] }
      ]
    },
    {
      title: 'The Captain Asks',
      ref: 'Luke 7:1–6',
      text: [
        'In Capernaum lives a captain. He has soldiers under him. His servant lies at death’s door in bed, and the captain is very fond of him.',
        'He has heard about Jesus. So he sends some elders to him. They are to ask Jesus to come and make the servant well.',
        'The elders find Jesus and plead with him: “He deserves to have you help him. He loves our people, and he built the synagogue for us.”',
        'Jesus sets out and goes with them through the streets of Capernaum.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: {
          pairs: [
            { text: 'The helmet: The captain has soldiers under him.' },
            { text: 'The bed: His servant lies at death’s door in it.' },
            { text: 'The synagogue: The captain built it for the people.' },
            { text: 'The scroll: The elders of the Jews plead for him.' },
            { text: 'The house: Jesus goes there with the elders.' },
            { text: 'The sandals: Jesus sets out through the streets of Capernaum.' }
          ]
        }
      },
      questions: [
        { q: 'Who is at death’s door?', options: ['the captain’s servant', 'the captain himself', 'a priest'] },
        { q: 'Whom does the captain send to Jesus?', options: ['some elders', 'his children', 'the disciples'] }
      ]
    },
    {
      title: 'Only Say the Word',
      ref: 'Luke 7:6–10',
      text: [
        'They are almost at the captain’s house when friends of the captain come to meet them. They pass on what the captain told them: “Lord, do not trouble yourself. I am not worthy that you should come into my house. Only say the word, and my servant will be healed.”',
        'The captain knows how an order works. When he says to a soldier, “Go!”, the soldier goes. And when he says to his servant, “Do this!”, the servant does it.',
        'Jesus hears it and is amazed. He turns to the people who follow him: “I have not found such faith in Israel.”',
        'The messengers go back to the house. There they find the servant well.'
      ],
      task: {
        hint: 'Put the four pictures in the order of the story.',
        order: {
          cards: [{ label: 'The elders ask Jesus for help' }, { label: 'Jesus goes with the elders' }, { label: 'The friends say: Only say the word' }, { label: 'The servant is well' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning at the elders and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What do the friends say in the captain’s name?', options: ['Only say the word.', 'Come quickly into my house.', 'Bring a bed with you.'] },
        { q: 'How does Jesus react?', options: ['He is amazed.', 'He laughs.', 'He walks away sadly.'] }
      ]
    },
    {
      title: 'Do Not Weep',
      ref: 'Luke 7:11–17',
      text: [
        'Jesus comes to the town of Nain with his disciples and many people. At the town gate a funeral procession meets them. A young man has died, the only son of his mother. She is a widow, and many people from the town walk with her.',
        'Jesus sees the woman, and his heart goes out to her. “Do not weep!” he says to her. Then he steps up and touches the bier. The bearers stand still.',
        '“Young man,” says Jesus, “I say to you: Get up!” The dead man sits up and begins to speak. Jesus gives him back to his mother.',
        'Everyone is full of awe and praises God. “A great prophet has risen among us!” they cry.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is the name of the town?', options: ['Nain', 'Jericho', 'Capernaum'] },
        { q: 'What does Jesus say to the widow?', options: ['Do not weep!', 'Go home!', 'Do not be afraid of the gate!'] },
        { q: 'Who is the young man to the widow?', options: ['her only son', 'her brother', 'her neighbor'] }
      ]
    },
    {
      title: 'Ten Men Cry Out',
      ref: 'Luke 17:11–14',
      text: [
        'Jesus is on his way to Jerusalem. He passes through Samaria and Galilee and comes to a village. There ten men with leprosy meet him. They are not allowed to come near the others, so they stay far away.',
        'Together they lift their voices and cry as loud as they can: “Jesus, Master, have mercy on us!”',
        'Jesus looks at them. “Go,” he says, “and show yourselves to the priests!”',
        'The men are still sick. But they set out on the way to the priests, all ten together.'
      ],
      task: { hint: 'Put the picture of the village edge with the ten men together.' },
      questions: [
        { q: 'How many men call to Jesus?', options: ['ten', 'two', 'twelve'] },
        { q: 'Where do the men stand?', options: ['far away at the edge of the village', 'in the middle of the marketplace', 'in a boat'] }
      ]
    },
    {
      title: 'One Turns Back',
      ref: 'Luke 17:14–19',
      text: [
        'On the way the ten men notice that they have become clean. The disease is gone.',
        'One of them stops. He turns around and runs back to Jesus. He praises God with a loud voice, throws himself down at Jesus’ feet and thanks him. This man is a Samaritan.',
        'Jesus asks: “Were there not ten made clean? Where are the nine? Has no one come back to give glory to God, except this stranger?”',
        'And to the man he says: “Get up and go. Your faith has made you well.”'
      ],
      task: {
        hint: 'Tap the man who turns around and runs back to Jesus.',
        turnBack: {
          men: [{ label: 'A man on the way to the priests' }, { label: 'A man on the way to the priests' }, { label: 'A man on the way to the priests' }, { label: 'A man on the way to the priests' }, { label: 'A man on the way to the priests' }, { label: 'A man on the way to the priests' }],
          samaritan: { label: 'The Samaritan with the blue and white striped head cloth' },
          jesus: { label: 'Jesus with two disciples' },
          rounds: [
            { hint: 'The men walk to the house of the priests. Tap the one who turns back.' },
            { hint: 'Now they cross each other. Watch the stripe on the head cloth.' }
          ]
        }
      },
      questions: [
        { q: 'How many men turn back and thank Jesus?', options: ['one', 'ten', 'all nine'] },
        { q: 'Where does this man come from?', options: ['from Samaria', 'from Jerusalem', 'from Nain'] }
      ]
    },
    {
      title: 'Let the Children Come to Me',
      ref: 'Mark 10:13–16',
      text: [
        'Mothers and fathers bring their children to Jesus, even the very little ones in their arms. He is to touch them and bless them. But the disciples scold the people and want to send them away.',
        'Jesus sees it, and he is displeased. “Let the children come to me,” he says, “and do not stop them. For the kingdom of God belongs to such as these. Whoever does not receive it like a child will not enter it.”',
        'Then he takes the children in his arms, lays his hands on them and blesses them.'
      ],
      task: {
        hint: 'Search the courtyard: find the four children who come to Jesus.',
        find: { labels: ['The girl with the braid', 'The boy with the curls', 'The boy with the little lamb', 'The little child in the arms'], doneText: 'You have found all four children. Jesus took them all in his arms and blessed them.' }
      },
      questions: [
        { q: 'Who tries to keep the people with the children away?', options: ['the disciples', 'the priests', 'the soldiers'] },
        { q: 'What does Jesus say?', options: ['Let the children come to me.', 'Send them home.', 'Come back later.'] }
      ]
    },
    {
      title: 'Calling Louder',
      ref: 'Mark 10:46–49',
      text: [
        'Later Jesus leaves the city of Jericho with his disciples and a great crowd. By the road sits a blind man, begging. His name is Bartimaeus. He cannot see, but he hears that many people are passing by.',
        'Then he hears that Jesus of Nazareth is there. “Jesus, you Son of David!” he cries. “Have mercy on me!”',
        'Many sharply tell him: “Be quiet!” But Bartimaeus cries out even louder: “Son of David, have mercy on me!”',
        'Then Jesus stands still. “Call him!” he says. The people call to the blind man: “Cheer up! Get up, he is calling you!”'
      ],
      task: {
        hint: 'Tap the button so that Bartimaeus calls louder than the others.',
        shout: {
          bartimaeus: { label: 'Bartimaeus by the road' },
          group: { label: 'Jesus, his disciples and a crowd' },
          waver: { label: 'A man waves' },
          rounds: [
            { hint: 'Tap “Call” quickly so that Jesus hears you.' },
            { hint: 'Once more. The crowd is louder. Call louder!' }
          ]
        }
      },
      questions: [
        { q: 'What is the blind man’s name?', options: ['Bartimaeus', 'Jairus', 'Simon'] },
        { q: 'What does Bartimaeus do when the people tell him to be quiet?', options: ['He cries out even louder.', 'He is quiet.', 'He goes away.'] }
      ]
    },
    {
      title: 'I Want to See',
      ref: 'Mark 10:50–52',
      text: [
        'Bartimaeus throws off his cloak, jumps up and comes to Jesus. “What do you want me to do for you?” Jesus asks him.',
        '“Rabboni,” says the blind man, which means “my master”. “I want to see.”',
        '“Go,” says Jesus, “your faith has made you well.” In that very moment Bartimaeus can see.',
        'He does not go back to his place by the road. He follows Jesus on the way where he has been sitting, in the middle of the many people, and sees everything around him.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Bartimaeus do with his cloak?', options: ['He throws it off.', 'He sells it.', 'He gives it to Jesus.'] },
        { q: 'What does Bartimaeus wish for?', options: ['To be able to see.', 'To have money.', 'To go home.'] },
        { q: 'What does Bartimaeus do after he can see?', options: ['He follows Jesus on the way.', 'He goes home.', 'He stays sitting by the road.'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Jesus say to the man with leprosy?', options: ['I will; be clean!', 'Go away from here!', 'Come back tomorrow!'] },
    { q: 'What does the captain have his friends say to Jesus?', options: ['Only say the word.', 'Come quickly to me.', 'Bring a bed.'] },
    { q: 'What does Jesus say to the weeping widow of Nain?', options: ['Do not weep!', 'Go home!', 'Be quiet!'] },
    { q: 'How many men with leprosy cry out to Jesus?', options: ['ten', 'two', 'twelve'] },
    { q: 'How many come back to thank Jesus?', options: ['one', 'five', 'all ten'] },
    { q: 'What does Bartimaeus cry out although the people want him quiet?', options: ['Son of David, have mercy on me!', 'Help me with my cloak!', 'Come and sit with me!'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
heilungEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/heilung/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
