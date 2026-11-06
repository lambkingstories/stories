/**
 * English texts of the adventure "All the Way to Rome" (8 to 10 years): the same shape as `../paulusrom.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Acts 17; 20; 21–23; 24–26; 27; 28); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-PaulusRom/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-PaulusRom/tools/bauen_paulusrom.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const paulusromEn: TextOverlay<Journey> = {
  title: 'All the Way to Rome',
  subtitle: 'Paul travels to the capital of the world',
  gift: { title: 'The Ship off Malta' },
  stages: [
    {
      title: 'To the Unknown God',
      ref: 'Acts 17:15–34',
      text: [
        'Before Paul comes to Corinth, he stays for a while in Athens. There he waits for his friends Silas and Timotheus. He walks through the city and sees how full it is of images of gods. His spirit is stirred in him. Every day he speaks in the synagogue and in the market.',
        'Some philosophers argue with him. “What will this babbler say?” some of them mock. Others think he is bringing strange gods, because he tells them about Jesus and the resurrection. On Mars’ hill they ask him: “What is this new teaching?”',
        'Paul stands in the middle of the hill. “You men of Athens,” he says, “in your city I found an altar. On it is written: To the Unknown God. He is the one I tell you about. God made the world and everything in it. He does not live in temples that people have built. He gives life and breath to all. He is not far from any one of us.”',
        'When they hear about the resurrection of the dead, some laugh at him. Others say: “We will hear you again about this.” But some believe, among them Dionysius the Areopagite and a woman named Damaris.'
      ],
      task: {
        hint: 'Look for the altars among the many images of gods in Athens.',
        find: { labels: ['A small altar with flowers', 'A round altar with a bowl of smoke', 'The plain altar with the empty tablet', 'A marble altar with a laurel wreath'], doneText: 'You have found all four altars. On the plain one was written: To the Unknown God.' }
      },
      questions: [
        { q: 'What is written on the altar that Paul finds?', options: ['To the Unknown God', 'To the Great King', 'To the God of the Sea'] },
        { q: 'Who believes after Paul’s speech?', options: ['Dionysius and Damaris', 'Peter and John', 'Felix and Festus'] }
      ]
    },
    {
      title: 'Eutychus in the Window',
      ref: 'Acts 20:7–12',
      text: [
        'Some years later Paul is in the city of Troas with his companions. On the first day of the week the disciples come together to break bread. Paul wants to travel on the next morning. So he speaks for a long time, until midnight. Up in the upper room many lights are burning.',
        'A young man named Eutychus sits in the window. Paul speaks on and on, and Eutychus grows more and more tired. He sinks into a deep sleep and falls down from the third loft. When they pick him up below, he has died.',
        'Paul goes down, lies over him and puts his arms around him. “Trouble not yourselves,” he says to the others. “His life is in him.”',
        'Then Paul goes up again, breaks the bread and eats. He talks with them for a long time, until the day breaks, and then he goes on his way. But they bring Eutychus in alive, and everyone is greatly comforted.'
      ],
      task: {
        hint: 'Look at the shadow on the wall and tap the person who casts it.',
        wallShadows: {
          people: [{ name: 'Paul', shadowName: 'Shadow of a man with a raised hand' }, { name: 'The woman with the jug', shadowName: 'Shadow with a jug on the shoulder' }, { name: 'The old man with the staff', shadowName: 'Shadow with a bent back and a staff' }, { name: 'The girl with the braid', shadowName: 'Shadow with a long braid' }, { name: 'The man with the scroll', shadowName: 'Shadow with a scroll under the arm' }, { name: 'The mother with the child', shadowName: 'Shadow with a child on the arm' }, { name: 'The boy with the bread basket', shadowName: 'Shadow with a basket' }, { name: 'Eutychus in the window', shadowName: 'Shadow of a young man with his knees drawn up' }],
          rounds: [{ hint: 'Look at the shadow on the wall and tap the person who casts it.' }, { hint: 'Now there are six listeners, and some shadows are bigger or turned round. The lamp stands somewhere else.' }]
        }
      },
      questions: [
        { q: 'Where does Eutychus sit while Paul is speaking?', options: ['in the window', 'on the stairs', 'beside the door'] },
        { q: 'What does Paul say as he holds Eutychus in his arms?', options: ['His life is in him.', 'Carry him home quickly.', 'Fetch a doctor from the town.'] }
      ]
    },
    {
      title: 'Farewell at Miletus',
      ref: 'Acts 20:13–38',
      text: [
        'Paul sails on. He wants to be in Jerusalem for the day of Pentecost. In the harbour town of Miletus he sends for the elders of the church from Ephesus.',
        '“You know how I have been with you all the time,” he says. “I have told you everything that is good for you. Now I am going to Jerusalem, and I do not know what will happen to me there. But my life is not so dear to me. I want to finish my course with joy.”',
        '“You will not see my face again. Take heed to yourselves and to all the flock. I have wanted no one’s silver or gold or clothes. With these hands I worked for myself and for those who were with me. Remember the words of the Lord Jesus: It is more blessed to give than to receive.”',
        'Then Paul kneels down and prays with them all. They weep very much, fall on his neck and kiss him. What hurts them most is his word that they will not see him again. Then they bring him to the ship.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Whom does Paul call to Miletus?', options: ['the elders of the church from Ephesus', 'the fishermen from the harbour', 'the soldiers of the emperor'] },
        { q: 'Which words of Jesus does Paul give them?', options: ['It is more blessed to give than to receive.', 'It is better to take than to give.', 'Everyone looks after himself.'] },
        { q: 'What does Paul do before he goes to the ship?', options: ['He kneels down and prays with them all.', 'He sings a song on the beach.', 'He holds a great feast.'] }
      ]
    },
    {
      title: 'Paul’s Nephew',
      ref: 'Acts 21:27–23:24',
      text: [
        'In Jerusalem some people seize Paul in the temple, and the whole city is in an uproar. The chief captain takes him into the castle of the soldiers. In the night the Lord stands by him and says: “Be of good cheer, Paul! You must bear witness of me in Rome as well.”',
        'In the morning more than forty men band together against Paul. They swear to eat nothing and drink nothing until Paul is no longer alive. They want to lie in wait for him on the way to the council.',
        'But the son of Paul’s sister hears of the plan. He goes into the castle and tells Paul. Paul calls one of the centurions: “Bring this young man to the chief captain. He has something to tell him.” The chief captain takes him by the hand, goes with him to a place where they are alone, and asks: “What is it that you have to tell me?” Then the young man tells him everything: “Do not trust them!”',
        '“Tell no one that you told me this,” says the chief captain, and lets him go. In the night he has many soldiers and horsemen made ready. On a riding animal they bring Paul safely to Caesarea, to Felix the governor.'
      ],
      task: {
        hint: 'Bring the two to a place where no one is listening.',
        quietSpot: {
          rounds: [{ hint: 'Bring the two to a place where no one is listening.' }, { hint: 'Now there are more soldiers, and the rings show only when you come near. Watch the soldiers.' }]
        }
      },
      questions: [
        { q: 'Who hears about the men’s plan?', options: ['the son of Paul’s sister', 'the high priest in the temple', 'Felix the governor'] },
        { q: 'Where do the soldiers take Paul in the night?', options: ['to Caesarea, to Felix', 'to Athens, to the philosophers', 'to Troas, to the disciples'] }
      ]
    },
    {
      title: 'Before King Agrippa',
      ref: 'Acts 24:27–26:32',
      text: [
        'For two years Paul stays a prisoner in Caesarea. Then a new governor comes, named Festus. “I appeal unto Caesar,” Paul says to him. “Unto Caesar shalt thou go,” Festus answers. Soon after, King Agrippa and Bernice come into the hall with great pomp, and Paul is brought in.',
        '“You are permitted to speak for yourself,” says Agrippa. Paul stretches out his hand and tells about his life. “From my youth I lived in Jerusalem, as a strict Pharisee. I thought I had to do many things against the name of Jesus. I shut many of the church up in prison.”',
        '“Then, on the way to Damascus, at midday, I saw a light from heaven, brighter than the sun. I heard a voice: Saul, Saul, why do you persecute me? I am Jesus, whom you persecute. Stand up! I send you to the nations, so that they may turn from darkness to light.”',
        '“Paul, you are beside yourself!” Festus calls out loudly. “I am not mad,” Paul answers. Agrippa says: “Almost you persuade me to be a Christian.” Afterwards they say to one another: “This man has done nothing for which he should be a prisoner.”'
      ],
      task: {
        hint: 'Put the pictures from Paul’s life in the right order.',
        order: {
          cards: [{ label: 'Saul with a scroll in the temple of Jerusalem' }, { label: 'Saul receives sealed letters from the chief priests' }, { label: 'A bright light on the road to Damascus' }, { label: 'Paul tells people of many nations in a square' }, { label: 'Paul before King Agrippa in the hall' }],
          rounds: [{ hint: 'Put the pictures from the life of Paul in the right order. The dots show where they go.' }, { hint: 'Now one more picture is added, and the dots are gone. What came first, what came after?' }]
        }
      },
      questions: [
        { q: 'What does Paul see on the way to Damascus?', options: ['a light from heaven, brighter than the sun', 'a chariot of gold on the road', 'a great storm over the sea'] },
        { q: 'What does Agrippa say to Paul?', options: ['Almost you persuade me.', 'You must leave the city today.', 'I will give you a house in Caesarea.'] }
      ]
    },
    {
      title: 'Storm at Sea',
      ref: 'Acts 27:1–26',
      text: [
        'Now Paul is to sail to Italy. A centurion named Julius guards him and other prisoners, and he is kind to Paul. Often the wind is against them. Near Crete Paul warns them: “Sirs, this voyage will bring much harm and loss.” But the centurion believes the master of the ship more.',
        'Soon after, a strong wind falls upon the ship, called Euroclydon. The ship cannot sail against the wind, and they let it drive. With ropes they bind it together underneath. The next day they throw cargo into the sea, and on the third day the ship’s tackle.',
        'For many days they see neither sun nor stars. For a long time no one has eaten, and they have no hope left. Then Paul stands up in the midst of them.',
        '“Be of good cheer!” he says. “No one among us will lose his life, only the ship. This night the angel of God stood by me and said: Fear not, Paul! You must be brought before Caesar. All who sail with you, God has given to you. I believe God, it shall be so. We must be cast upon a certain island.”'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Who guards Paul on the voyage to Italy?', options: ['a centurion named Julius', 'King Agrippa with his servants', 'the master of the ship'] },
        { q: 'What do they not see for many days?', options: ['the sun and the stars', 'the sails of other ships', 'the lights of Rome'] },
        { q: 'What does Paul say to everyone on the ship?', options: ['Be of good cheer!', 'Everyone jump into the sea!', 'Sail back to Crete!'] }
      ]
    },
    {
      title: 'Everyone Comes to Land',
      ref: 'Acts 27:27–44',
      text: [
        'In the fourteenth night the sailors notice that land is near. They let down the sounding line: twenty fathoms deep, a little further only fifteen. They cast four anchors out of the stern and wish for the day.',
        'As the day comes on, Paul says to them all: “Eat something! For fourteen days you have eaten nothing. Not a hair shall fall from the head of any of you.” He takes bread, gives thanks to God in front of them all, breaks it and begins to eat. Then they all take heart again and eat too. Two hundred and seventy-six people are on the ship.',
        'In the daylight they see a bay with a flat shore. They cut the anchors, hoist the sail and make for it. But the ship runs aground. The front sticks fast, and at the back the waves break it apart.',
        'The centurion Julius wants to save Paul. “Whoever can swim, jump into the water first and get to land,” he commands. The others hold on to boards and to pieces of the ship. And so they all come safely to land.'
      ],
      task: {
        hint: 'Let each board into the water where the waves will carry it to the shore.',
        planks: {
          items: [{ name: 'A sailor on a board' }, { name: 'A soldier without a weapon on a board' }, { name: 'A bearded prisoner on a board' }, { name: 'An older traveller on a board' }, { name: 'A person on a hatch cover' }, { name: 'A person on a big barrel' }],
          rounds: [{ hint: 'Let each board into the water where the waves will carry it to the shore.' }, { hint: 'Now there are six boards, and only two narrow streaks lead to the shore. Look closely.' }]
        }
      },
      questions: [
        { q: 'What does Paul do with the bread?', options: ['He gives thanks to God, breaks it and eats.', 'He throws it into the sea.', 'He hides it in the ship.'] },
        { q: 'What do the people who cannot swim hold on to?', options: ['boards and pieces of the ship', 'a long rope from the shore', 'the manes of the horses'] }
      ]
    },
    {
      title: 'Melita',
      ref: 'Acts 28:1–10',
      text: [
        'Only on the shore do they learn that the island is called Melita, which is Malta. The people of the island are very kind to them. It is raining, and it is cold. So they kindle a fire and take them all in.',
        'Paul gathers a bundle of sticks and lays them on the fire. Because of the heat a viper, a snake, comes out and fastens on his hand. The people see it and say among themselves: “This man has surely done something bad.” But Paul shakes the creature off into the fire, and nothing happens to him.',
        'The people wait for his hand to swell or for him to fall down. They wait a long time, but nothing happens. Then they change their minds about him and say that he is a god.',
        'Nearby lives Publius, the chief man of the island. He takes them in and looks after them kindly for three days. His father lies sick with a fever. Paul goes in to him, prays, lays his hands on him and heals him. Then the other sick people on the island come too and are healed.'
      ],
      task: {
        hint: 'Draw a circle with your finger around the dry sticks.',
        brushwood: {
          rounds: [{ hint: 'Draw a circle with your finger around the dry sticks.', things: [{ name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'A stone' }, { name: 'A stone' }, { name: 'A shell' }] }, { hint: 'Now the sticks lie between stones and wet wood. Draw the circle tight.', things: [{ name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'Dry sticks' }, { name: 'A stone' }, { name: 'A stone' }, { name: 'A stone' }, { name: 'Wet seaweed' }, { name: 'Wet driftwood' }, { name: 'A shell' }] }]
        }
      },
      questions: [
        { q: 'Why do the people kindle a fire?', options: ['because of the rain and the cold', 'to roast fish', 'to give a sign to the ships'] },
        { q: 'What does Paul do for the father of Publius?', options: ['He prays and lays his hands on him.', 'He cooks him a warm soup.', 'He sings him a song.'] }
      ]
    },
    {
      title: 'No Man Forbidding Him',
      ref: 'Acts 28:10–31',
      text: [
        'After three months they sail on in another ship. The people of Malta load them with everything they need. In Puteoli they find brethren and stay with them for seven days. Then they go on toward Rome.',
        'The brethren in Rome hear that Paul is coming. They go out a long way to meet him, as far as Appii forum and The three taverns. When Paul sees them, he thanks God and takes courage.',
        'In Rome Paul may live where he wishes, with a soldier who guards him. He wears a chain. On one day many people come to him. From early morning until evening he tells them about Jesus, out of the law of Moses and out of the prophets. Some believe what he says, and some do not.',
        'For two whole years Paul stays in his own hired house. He receives all who come to him. He preaches the kingdom of God and teaches about the Lord Jesus with all confidence, no man forbidding him.'
      ],
      task: {
        hint: 'Put the soldier’s stool where Paul can reach every guest.',
        visitors: {
          guests: [{ name: 'A Jewish elder' }, { name: 'A mother with a child' }, { name: 'A Roman soldier without a weapon' }, { name: 'A merchant' }, { name: 'A young man' }, { name: 'An old woman' }],
          rounds: [{ hint: 'Put the soldier’s stool where Paul can reach every guest.' }, { hint: 'Now the circle of the chain is gone, and sometimes two guests come at once. One place reaches both.' }]
        }
      },
      questions: [
        { q: 'Who goes a long way out of Rome to meet Paul?', options: ['the brethren from Rome', 'the emperor’s soldiers', 'the people of Malta'] },
        { q: 'How long does Paul stay in his house in Rome?', options: ['two years', 'two days', 'twenty years'] }
      ]
    }
  ],
  exam: [
    { q: 'What is written on the altar in Athens?', options: ['To the Unknown God', 'To the Great King', 'To the God of the Sea'] },
    { q: 'Who falls asleep in the window at Troas?', options: ['Eutychus', 'Timotheus', 'Dionysius'] },
    { q: 'Who tells the chief captain about the wicked plan?', options: ['the son of Paul’s sister', 'King Agrippa', 'the high priest'] },
    { q: 'Before which king does Paul tell about his life?', options: ['before King Agrippa', 'before King Solomon', 'before King David'] },
    { q: 'Which of the people on the ship come to land?', options: ['all of them', 'only the sailors', 'only the soldiers'] },
    { q: 'How does Paul teach about the Lord Jesus in Rome?', options: ['with all confidence, no man forbidding him', 'quietly and only in secret', 'only at night behind a closed door'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
paulusromEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/paulusrom/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
