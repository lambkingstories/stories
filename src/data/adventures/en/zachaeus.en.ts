/**
 * English texts of the adventure "Zacchaeus and Lazarus" (8 to 10 years): the same shape as `../zachaeus.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Luke 19, John 11: Zacchaeus, Martha, Bethany, Jericho); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Zachaeus/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Zachaeus/tools/bauen_zachaeus.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const zachaeusEn: TextOverlay<Journey> = {
  title: 'Zacchaeus and Lazarus',
  subtitle: 'Jesus comes in and calls his friend out',
  gift: { title: 'The Sycomore Tree' },
  stages: [
    {
      title: 'Little Zacchaeus',
      ref: 'Luke 19:1–3',
      text: [
        'Jesus comes to Jericho and walks through the town. People run together from everywhere, because everyone wants to see him.',
        'In Jericho lives a man called Zacchaeus. He is a chief among the tax collectors, a boss over other tax collectors, and he is rich. He, too, longs to know who this Jesus is.',
        'But Zacchaeus is small. The crowd pushes along the street, and all he sees are backs and shoulders. However much he stretches, he cannot see Jesus.'
      ],
      task: {
        hint: 'Find Zacchaeus in the crowd, and also Jesus, the child and the donkey.',
        find: { labels: ['Zacchaeus, small, with a money bag', 'Jesus', 'The child on the shoulders', 'The loaded donkey'], doneText: 'You have found them all: Zacchaeus, Jesus, the child on the shoulders and the donkey.' }
      },
      questions: [
        { q: 'What is Zacchaeus’ job?', options: ['He is a chief tax collector.', 'He is a shepherd.', 'He is a fisherman.'] },
        { q: 'Why can Zacchaeus not see Jesus?', options: ['He is small, and the crowd is in the way.', 'He has his eyes closed.', 'Jesus has already gone.'] }
      ]
    },
    {
      title: 'Up the Tree',
      ref: 'Luke 19:4',
      text: [
        'Zacchaeus has an idea. He runs ahead of the crowd, because he knows where Jesus will pass by.',
        'A sycomore tree with wide branches stands there. Zacchaeus climbs up, from branch to branch, until he sits above all the heads, because from up there he wants to see Jesus. The rich, important man holds on to the trunk and looks down the road.',
        'Below, the people crowd closer, and nobody looks up. Zacchaeus waits among the leaves, very quietly. Jesus must come soon.'
      ],
      task: {
        hint: 'Climb from branch to branch. Always choose the strong branch.',
        climb: {
          climber: { label: 'Zacchaeus at the trunk' },
          strong: { label: 'A thick green branch with leaves' },
          weak: { label: 'A thin dry branch with a bend' },
          rounds: [
            { hint: 'Climb to the top. Always choose the strong branch.' },
            { hint: 'Now the tree is taller. Choose the strong branch again.' }
          ]
        }
      },
      questions: [
        { q: 'Where does Zacchaeus climb?', options: ['up a sycomore tree', 'onto a roof', 'onto a rock'] },
        { q: 'Why does he climb up?', options: ['He wants to see Jesus.', 'He wants to hide.', 'He wants to pick fruit.'] }
      ]
    },
    {
      title: 'Make Haste and Come Down',
      ref: 'Luke 19:5–7',
      text: [
        'Jesus comes to the place. He stops and looks up into the tree. “Zacchaeus,” he says, “make haste and come down! For today I must stay at your house.”',
        'It is quiet around the tree, and every eye looks up. Zacchaeus hurries down. He welcomes Jesus with great joy.',
        'But the people in the crowd grumble. “He has gone to be a guest with a sinner!” they say. Jesus goes with Zacchaeus into his house.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Zacchaeus,” he says, “make haste and come ', '!”'], words: ['down', 'up', 'along'] },
            { hint: 'Now two words are missing.', parts: ['“For today I must ', ' at your ', '.”'], words: ['stay', 'house', 'sleep', 'tree'] }
          ]
        }
      },
      questions: [
        { q: 'What does Jesus say to Zacchaeus?', options: ['Make haste and come down, today I must stay at your house.', 'Go home.', 'Stay up in the tree.'] },
        { q: 'How does Zacchaeus welcome Jesus?', options: ['with joy', 'with fear', 'not at all'] }
      ]
    },
    {
      title: 'Today Is Salvation Come',
      ref: 'Luke 19:8–10',
      text: [
        'But Zacchaeus steps forward before Jesus. The man who sat in the tree a moment ago now stands upright in front of him. “Lord,” he says, “half of everything I have I give to the poor. And if I have cheated anyone, I give it back to him four times over.”',
        'Jesus answers him: “Today salvation has come to this house, for he too is a son of Abraham.”',
        'Then Jesus says to all who listen: “The Son of man has come to seek and to save that which was lost.”'
      ],
      task: {
        hint: 'Divide the coins exactly in the middle.',
        halve: {
          coin: { label: 'A silver coin' },
          divider: { label: 'The wooden divider' },
          bowlSelf: { label: 'The bowl for Zacchaeus' },
          bowlPoor: { label: 'The bowl for the poor' },
          poor: { label: 'A woman with a child and an old man' },
          rounds: [
            { hint: 'Divide the coins exactly in the middle. Half is for the poor.' },
            { hint: 'Now there are more coins. Divide them exactly in the middle again.' }
          ]
        }
      },
      questions: [
        { q: 'What will Zacchaeus give to the poor?', options: ['half of everything he has', 'nothing', 'only one coin'] },
        { q: 'How much does he give back if he has cheated someone?', options: ['four times as much', 'nothing', 'half'] }
      ]
    },
    {
      title: 'The Friend Is Sick',
      ref: 'John 11:1–6, 11–15',
      text: [
        'In Bethany, a village near Jerusalem, Mary and Martha live with their brother Lazarus. Lazarus is sick. The sisters send a messenger to Jesus. “Lord, he whom you love is sick,” they let him know.',
        'Jesus loves Martha, Mary and Lazarus. When he hears the news, he stays two more days where he is.',
        'Then he says to his disciples: “Our friend Lazarus sleeps. I am going to wake him up.” The disciples think he is speaking about sleep. So Jesus says it plainly: “Lazarus is dead. Let us go to him.”'
      ],
      task: {
        hint: 'Put the four pictures in the right order.',
        order: {
          cards: [{ label: 'Lazarus lies sick in the house, Mary and Martha are with him' }, { label: 'A messenger runs along the road to Jesus' }, { label: 'Jesus stays with the disciples where he is' }, { label: 'Jesus goes with the disciples to Bethany' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning in the house in Bethany and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Where do Mary, Martha and Lazarus live?', options: ['in Bethany', 'in Jericho', 'in Nazareth'] },
        { q: 'What do the sisters send word to Jesus?', options: ['He whom you love is sick.', 'Come to the feast at once.', 'We need a boat.'] }
      ]
    },
    {
      title: 'I Am the Resurrection',
      ref: 'John 11:17–27',
      text: [
        'When Jesus comes to Bethany, Lazarus has already been in the grave four days. Many people have come to Martha and Mary to comfort them.',
        'Martha hears that Jesus is coming, and goes to meet him. Mary stays in the house. “Lord, if you had been here, my brother would not have died,” says Martha. “But I know: whatever you ask of God, God will give you.”',
        '“Your brother will rise again,” says Jesus. “I know,” says Martha, “he will rise again on the last day.”',
        '“I am the resurrection and the life,” says Jesus. “Whoever believes in me will live, even if he dies. Do you believe this?” “Yes, Lord,” answers Martha. “I believe that you are the Christ, the Son of God.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How long has Lazarus been in the grave when Jesus comes?', options: ['four days', 'one day', 'two days'] },
        { q: 'Who goes to meet Jesus first?', options: ['Martha', 'Mary', 'Thomas'] },
        { q: 'What does Jesus say about himself?', options: ['I am the resurrection and the life.', 'I am a fisherman.', 'I am the king of Jericho.'] }
      ]
    },
    {
      title: 'Jesus Wept',
      ref: 'John 11:28–37',
      text: [
        'Martha goes back and quietly calls her sister aside. “The Master is here and is calling for you.” Mary gets up quickly and goes to him. The mourners in the house follow her.',
        'When Mary comes to Jesus, she falls at his feet. “Lord, if you had been here, my brother would not have died,” she says. She weeps, and the people around her weep too. Jesus is deeply moved and troubled.',
        '“Where have you laid him?” he asks. “Lord, come and see,” they answer. Then Jesus weeps. “See how he loved him!” say the people.'
      ],
      task: { hint: 'Put the picture of Bethany together.' },
      questions: [
        { q: 'Where does Mary fall when she sees Jesus?', options: ['at his feet', 'on the street', 'in the garden'] },
        { q: 'What comes to Jesus when they want to show him the way to the grave?', options: ['tears', 'laughter', 'he walks away'] }
      ]
    },
    {
      title: 'Take Away the Stone',
      ref: 'John 11:38–42',
      text: [
        'Jesus comes to the grave. It is a cave in the rock, and a stone lies in front of it. “Take away the stone!” says Jesus.',
        'Martha says: “Lord, he has been there four days.” Jesus answers her: “Did I not tell you that if you believe, you will see the glory of God?”',
        'So the men take away the stone. Jesus looks up to heaven. “Father, I thank you that you have heard me. I know that you always hear me. But because of the people who stand here, I say it: they should believe that you have sent me.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What lies in front of the grave?', options: ['a stone', 'a carpet', 'a tree'] },
        { q: 'What does Jesus say to the men?', options: ['Take away the stone!', 'Leave the grave closed.', 'Go home.'] },
        { q: 'Where does Jesus look when he prays?', options: ['up to heaven', 'at the ground', 'at the mountains'] }
      ]
    },
    {
      title: 'Lazarus, Come Out',
      ref: 'John 11:43–45',
      text: [
        'Jesus cries with a loud voice: “Lazarus, come out!”',
        'Then the dead man comes out of the cave. His hands and feet are wrapped in grave cloths, and his face is covered with a cloth. Everyone stands still and watches, and nobody says a word.',
        'Jesus says to the people: “Loose him, and let him go!”',
        'Many of those who had come to Mary and saw what Jesus did believe in him.'
      ],
      task: {
        hint: 'Unwind the grave cloths.',
        unwrap: {
          lazarus: { label: 'Lazarus at the entrance of the cave' },
          free: { label: 'Lazarus, free, with a raised hand' },
          maria: { label: 'Mary runs up with open arms' },
          hint: 'Pull at the cloths until Lazarus is free.',
          strips: [{ label: 'The cloth on the hands' }, { label: 'The cloth on the feet' }, { label: 'The cloth round the body' }, { label: 'The cloth round the arms' }, { label: 'The cloth on the head' }]
        }
      },
      questions: [
        { q: 'What does Jesus call with a loud voice?', options: ['Lazarus, come out!', 'Go home!', 'Close the grave!'] },
        { q: 'What does Jesus say to the people?', options: ['Loose him, and let him go!', 'Run away!', 'Bring the stone back!'] }
      ]
    }
  ],
  exam: [
    { q: 'Why does Zacchaeus climb the tree?', options: ['He wants to see Jesus.', 'He wants to eat figs.', 'He wants to hide.'] },
    { q: 'What does Jesus say to Zacchaeus?', options: ['Make haste and come down, today I must stay at your house.', 'Go home.', 'Stay up there.'] },
    { q: 'What will Zacchaeus give to the poor?', options: ['half of everything he has', 'nothing', 'only one coin'] },
    { q: 'Where do Mary, Martha and Lazarus live?', options: ['in Bethany', 'in Jericho', 'in Nazareth'] },
    { q: 'What does Jesus say to Martha about himself?', options: ['I am the resurrection and the life.', 'I am a fisherman.', 'I am a tax collector.'] },
    { q: 'What does Jesus call in front of the grave?', options: ['Lazarus, come out!', 'Go home!', 'Close the grave!'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
zachaeusEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/zachaeus/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
