/**
 * English texts of the adventure "The Last Week" (8 to 10 years): the same shape as `../letztewoche.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Matthew 21 to 27: Mount of Olives, Gethsemane, Pilate, Barabbas, Golgotha, Joseph of Arimathaea); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-LetzteWoche/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-LetzteWoche/tools/bauen_letztewoche.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const letztewocheEn: TextOverlay<Journey> = {
  title: 'The Last Week',
  subtitle: 'From Jerusalem to the tomb',
  gift: { title: 'The Palm Branch' },
  stages: [
    {
      title: 'The King on the Donkey',
      ref: 'Matthew 21:1–11',
      text: [
        'Jesus and his disciples are almost at Jerusalem. At the Mount of Olives Jesus sends two disciples ahead. “Go into the village over there,” he says. “You will find a donkey tied up, and her colt with her. Untie them and bring them to me. And if anyone asks, say: The Lord needs them.”',
        'The disciples go, and everything is just as Jesus said. They lay their cloaks on the donkey, and Jesus sits down on her. This is what the prophet said: “Your king is coming to you, gentle, riding on a donkey.”',
        'On the road, many people spread their cloaks in front of him. Others cut branches from the trees and scatter them on the path. Everyone shouts: “Hosanna to the Son of David! Blessed is he who comes in the name of the Lord!”',
        'The whole city is stirred. “Who is this?” the people ask. “This is Jesus, the prophet from Nazareth in Galilee,” the others say.'
      ],
      task: {
        hint: 'Lay cloaks and branches on the road. Stones do not belong on the street.',
        prepare: {
          donkey: { label: 'Jesus on the donkey, the colt walking beside her' },
          cloaks: [{ label: 'A red cloak' }, { label: 'A blue cloak' }, { label: 'An ochre cloak' }],
          branches: [{ label: 'A palm branch' }, { label: 'An olive branch' }],
          stone: { label: 'A field stone' },
          crowd: { label: 'Cheering people with palm branches at the roadside' },
          gate: { label: 'The gate of Jerusalem' },
          rounds: [{ hint: 'Cover the three bare places with cloaks and branches.' }, { hint: 'Now there are five places. The donkey waits at every bare place.' }]
        }
      },
      questions: [
        { q: 'Where does Jesus send the two disciples?', options: ['to a village, to fetch a donkey and her colt', 'to the sea to fish', 'to the temple'] },
        { q: 'What do the people put on the road?', options: ['their cloaks and branches from the trees', 'stones', 'baskets of flowers'] }
      ]
    },
    {
      title: 'In the Temple',
      ref: 'Matthew 21:12–17',
      text: [
        'Jesus goes into the temple. In the courtyard there are tables where money is changed, and sellers offer doves. Then Jesus overturns the tables and sends the sellers out. “It is written: My house shall be called a house of prayer,” he says. “But you are making it a den of thieves.”',
        'Then blind and lame people come to him in the temple, and Jesus heals them.',
        'Children are in the temple too, and they cry out loudly: “Hosanna to the Son of David!” The chief priests and scribes see the wonders and hear the children, and they are angry. “Do you hear what they are saying?” they ask.',
        '“Yes,” says Jesus. “Have you never read: Out of the mouth of little children you have prepared praise?” In the evening he leaves the city and goes to Bethany.'
      ],
      task: {
        hint: 'Find Jesus, a child, a dove seller and a blind man in the temple courtyard.',
        find: { labels: ['Jesus', 'A child with a palm branch', 'A dove seller with a cage', 'A blind man with a staff'], doneText: 'You have found them all: Jesus, the child, the dove seller and the blind man.' }
      },
      questions: [
        { q: 'What do the sellers sell in the temple?', options: ['doves', 'sheep’s wool', 'bread'] },
        { q: 'Who comes to Jesus in the temple?', options: ['blind and lame people', 'soldiers', 'fishermen'] }
      ]
    },
    {
      title: 'The Greatest Commandment',
      ref: 'Matthew 22:34–40',
      text: [
        'Once more, people come to Jesus who want to test him. A teacher of the law, who knows God’s law well, steps up to him. “Master,” he asks, “which is the greatest commandment?”',
        'Jesus answers him: “You shall love the Lord your God with all your heart, with all your soul and with all your mind. This is the first and greatest commandment.”',
        'Then he says: “And the second is like it: You shall love your neighbor as yourself. On these two commandments hang all the law and the prophets.”'
      ],
      task: {
        hint: 'Turn the halves, put them together and bring each picture to the right heart.',
        commandment: {
          heart: { label: 'A red heart: on the left the sky with sunlight, on the right the neighbors' },
          cards: [{ label: 'A girl prays at the window in the evening' }, { label: 'A boy shares his bread with the boy next door' }, { label: 'A family sings a song of praise in the morning' }, { label: 'A family gives thanks before the meal' }, { label: 'A young woman carries the jug for her old neighbor' }, { label: 'A girl brings soup to her sick neighbor' }],
          rounds: [{ hint: 'Turn the halves and put two pictures together. Do they belong to God or to the neighbor?' }, { hint: 'Now there are four pictures, and some halves are upside down.' }]
        }
      },
      questions: [
        { q: 'Whom does the teacher of the law ask?', options: ['Jesus', 'Pilate', 'a shepherd'] },
        { q: 'What is the greatest commandment?', options: ['to love God with all your heart', 'to get up early', 'never to laugh'] }
      ]
    },
    {
      title: 'The Ten Lamps',
      ref: 'Matthew 25:1–13',
      text: [
        'Jesus tells a story. Ten young women are waiting for a bridegroom. Each of them has a lamp. Five of them are wise and five are foolish. The foolish ones take no oil with their lamps. But the wise ones take oil in jars.',
        'The bridegroom is slow to come, and the young women grow tired and fall asleep. In the middle of the night someone cries out: “The bridegroom is coming! Go out to meet him!”',
        'They all get up and make their lamps ready. The lamps of the five foolish ones are going out. “Give us some of your oil,” they ask. “There would not be enough for all of us,” say the wise ones. “Go to the sellers and buy some for yourselves.”',
        'While they are away, the bridegroom comes. Those who are ready go in with him to the wedding feast, and the door is shut. “Watch therefore,” says Jesus, “for you do not know the day or the hour when the Son of man comes.”'
      ],
      task: {
        hint: 'Hold the jar and let go when the oil reaches the golden mark.',
        lamps: {
          lamp: { label: 'An empty clay lamp' },
          lit: { label: 'The lamp is burning' },
          out: { label: 'The lamp has gone out, a thin thread of smoke rises' },
          oil: { label: 'Oil' },
          mark: { label: 'A golden mark' },
          jug: { label: 'A jug of oil' },
          rounds: [{ hint: 'Hold the jug and let go when the oil reaches the mark.' }, { hint: 'Now you have to be even more exact.' }]
        }
      },
      questions: [
        { q: 'How many young women wait for the bridegroom?', options: ['ten', 'three', 'twelve'] },
        { q: 'What do the wise ones take with them?', options: ['oil in jars', 'bread', 'nothing'] }
      ]
    },
    {
      title: 'What You Have Done',
      ref: 'Matthew 25:31–40',
      text: [
        'Jesus tells how it will be one day, when he, the Son of man, comes as king. To the righteous the King will say: “Come, you blessed of my Father! The kingdom is ready for you. For I was hungry, and you gave me food. I was thirsty, and you gave me drink. I was a stranger, and you took me in.”',
        '“I was naked, and you clothed me. I was sick, and you visited me. I was in prison, and you came to me.”',
        'The righteous ask in surprise: “Lord, when did we see you hungry and give you food?”',
        'The King answers: “Whatever you did for one of the least of my brothers, you did for me.”'
      ],
      task: {
        hint: 'Who needs what? Bring everyone what he or she needs.',
        help: {
          people: [{ label: 'A hungry man', cardLabel: 'Bread' }, { label: 'A thirsty woman', cardLabel: 'A jug of water' }, { label: 'A stranger with a bundle in front of a door', cardLabel: 'An open door with a lamp' }, { label: 'A freezing man without a cloak', cardLabel: 'A cloak' }, { label: 'A sick woman in bed', cardLabel: 'A visit at the bed with a cloth and a bowl' }, { label: 'A prisoner behind a small barred window', cardLabel: 'A visit at the bars with a basket' }],
          rounds: [{ hint: 'Bring the hungry man, the thirsty woman and the stranger what they need.' }, { hint: 'Now the freezing man, the sick woman and the prisoner.' }]
        }
      },
      questions: [
        { q: 'What did the King need?', options: ['food, drink and clothes', 'gold', 'a sword'] },
        { q: 'What did the righteous do for the sick?', options: ['They visited him.', 'They ran away.', 'They laughed at him.'] }
      ]
    },
    {
      title: 'The Last Supper',
      ref: 'Matthew 26:14–30',
      text: [
        'One of the twelve, Judas Iscariot, goes to the chief priests. “What will you give me if I hand Jesus over to you?” he asks. They offer him thirty pieces of silver.',
        'On the first day of the Passover feast, the disciples prepare the meal. In the evening Jesus sits down at the table with the twelve. “One of you will betray me,” he says. The disciples are very sad, and one after another they ask: “Lord, is it I?”',
        'Then Jesus takes the bread, gives thanks, breaks it and gives it to the disciples. “Take and eat,” he says, “this is my body.” He takes the cup, gives thanks and gives it to them. “Drink from it, all of you. This is my blood of the new covenant, which is poured out for many for the forgiveness of sins.”',
        'After they have sung a hymn, they go out to the Mount of Olives.'
      ],
      task: {
        hint: 'Put the four pictures in the right order.',
        order: {
          cards: [{ label: 'The disciples prepare the table in the room upstairs' }, { label: 'Jesus sits at the table with the twelve' }, { label: 'Jesus breaks the bread and gives it to the disciples' }, { label: 'The disciples go out to the Mount of Olives with Jesus, singing' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning in the room and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What do they offer Judas for the betrayal?', options: ['thirty pieces of silver', 'a donkey', 'a house'] },
        { q: 'What does Jesus do with the bread?', options: ['He gives thanks, breaks it and gives it to the disciples.', 'He throws it away.', 'He hides it.'] }
      ]
    },
    {
      title: 'In the Garden of Gethsemane',
      ref: 'Matthew 26:36–46',
      text: [
        'After the meal Jesus comes with his disciples to a garden called Gethsemane. “Sit here,” he says, “while I go over there and pray.” He takes Peter, James and John with him. Jesus becomes sad, and he is troubled. “My soul is very sorrowful, even to death,” he says. “Stay here and watch with me.”',
        'He goes a little farther, falls on the ground and prays: “My Father, if it is possible, let this cup pass from me. But not as I will, but as you will.”',
        'When he comes back to the disciples, they are asleep. “Could you not watch with me one hour?” he asks. “The spirit is willing, but the flesh is weak.”',
        'Twice more Jesus goes away to pray, with the same words. The second time he finds the disciples asleep again, their eyes heavy with sleep. “Get up, let us go,” he says. “Look, the one who is betraying me is here.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is the garden called?', options: ['Gethsemane', 'Eden', 'Jericho'] },
        { q: 'What does Jesus do in the garden?', options: ['He prays.', 'He sleeps.', 'He builds a house.'] },
        { q: 'What are the disciples doing when Jesus comes back?', options: ['They are asleep.', 'They are singing.', 'They are running away.'] }
      ]
    },
    {
      title: 'Jesus Is Arrested',
      ref: 'Matthew 26:47–56',
      text: [
        'While Jesus is still speaking, Judas, one of the twelve, arrives. With him comes a great crowd of men with swords and clubs, sent by the chief priests and elders. Judas has agreed a sign with them: “The one I kiss is the man. Seize him.”',
        'Judas goes straight to Jesus. “Hail, Master!” he says, and kisses him. “Friend,” says Jesus, “why have you come?” Then the men step forward, take hold of Jesus and arrest him.',
        'One of the disciples reaches for his sword. “Put your sword away,” says Jesus.',
        'Then he says to the crowd: “Every day I sat teaching in the temple, and you did not arrest me.” Then all the disciples leave him and run away.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who leads the crowd to Jesus?', options: ['Judas', 'Peter', 'Pilate'] },
        { q: 'How do the men know which one is Jesus?', options: ['Judas kisses him.', 'He wears a crown.', 'He shouts loudly.'] },
        { q: 'What does Jesus say to the disciple with the sword?', options: ['Put your sword away.', 'Strike!', 'Run away.'] }
      ]
    },
    {
      title: 'The Rooster Crows',
      ref: 'Matthew 26:33–35, 69–75',
      text: [
        'Peter had said to Jesus: “Even if everyone else turns away from you, I never will.” But Jesus had answered him: “This very night, before the rooster crows, you will deny me three times.”',
        'Peter has followed Jesus from a distance, and now he sits outside in the courtyard of the high priest. A servant girl comes to him. “You were with Jesus of Galilee, too,” she says. “I do not know what you mean,” says Peter in front of everyone.',
        'As he goes toward the gate, another girl sees him. “This man was with Jesus of Nazareth!” “I do not know the man,” says Peter. Soon after, the people standing there say: “You are one of them. Your way of speaking gives you away.” And for the third time Peter says: “I do not know the man!”',
        'Then a rooster crows. Peter remembers the words of Jesus, goes outside and weeps bitterly.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where is Peter sitting?', options: ['in the courtyard of the high priest', 'in a boat', 'in the temple'] },
        { q: 'What does Peter say to the people?', options: ['I do not know the man.', 'I am his friend.', 'I am the king.'] },
        { q: 'What happens when Peter says it for the third time?', options: ['A rooster crows.', 'It rains.', 'The door opens.'] }
      ]
    },
    {
      title: 'Before Pilate',
      ref: 'Matthew 27:11–26',
      text: [
        'In the morning the chief priests and elders bring Jesus to the Roman governor, Pilate. “Are you the King of the Jews?” asks Pilate. “You say so,” answers Jesus. They bring many charges against him, but Jesus does not say a word. Pilate is greatly amazed.',
        'At the feast the governor always lets one prisoner go free, the one the people want. At that time there is a well-known prisoner called Barabbas. “Whom shall I set free?” asks Pilate. “Barabbas or Jesus?” He knows that the chief priests have handed Jesus over out of envy. His wife sends him a message: “Have nothing to do with this just man.”',
        'But the chief priests persuade the crowd. “Barabbas!” the people shout. “And what shall I do with Jesus?” asks Pilate. “Crucify him!” they shout.',
        'Then Pilate washes his hands in front of everyone: “I am innocent of the death of this just man.” He sets Barabbas free. But Jesus he hands over to the soldiers, to be crucified.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who is Pilate?', options: ['the Roman governor', 'a fisherman', 'a disciple'] },
        { q: 'What does Jesus say to the charges?', options: ['He says nothing.', 'He shouts.', 'He runs away.'] },
        { q: 'Whom does Pilate set free?', options: ['Barabbas', 'Peter', 'Judas'] }
      ]
    },
    {
      title: 'On the Hill of Golgotha',
      ref: 'Matthew 27, selection',
      text: [
        'Soldiers lead Jesus out of the city. On the way they force a man to carry the cross of Jesus. His name is Simon, and he comes from Cyrene. On a hill called Golgotha they crucify Jesus, and with him two robbers, one on the right and one on the left. Above him is written: This is Jesus, the King of the Jews.',
        'About noon it grows dark over the whole land, and the darkness lasts three hours. About the ninth hour Jesus cries out with a loud voice: “My God, my God, why have you forsaken me?” Then he cries out once more with a loud voice and dies.',
        'At that moment the curtain in the temple is torn in two, from top to bottom, the earth shakes, and the rocks split. The centurion and the soldiers with him are very afraid. “Truly, this was the Son of God!” they say. Many women are watching from far away, women who followed Jesus from Galilee.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who carries the cross of Jesus for a part of the way?', options: ['Simon of Cyrene', 'Peter', 'Pilate'] },
        { q: 'What happens around noon?', options: ['It grows dark over the land.', 'It snows.', 'A feast begins.'] },
        { q: 'What does the centurion say?', options: ['Truly, this was the Son of God!', 'That was a mistake.', 'We are going home.'] }
      ]
    },
    {
      title: 'The Tomb',
      ref: 'Matthew 27:57–66',
      text: [
        'Evening comes. A rich man from Arimathaea comes to Pilate. His name is Joseph, and he is also a disciple of Jesus. He asks for the body of Jesus, and Pilate allows it.',
        'Joseph wraps it in a clean linen cloth and lays it in his own tomb, which he has had cut out of the rock. He rolls a great stone in front of the entrance and goes away. Mary Magdalene and the other Mary stay and sit down opposite the tomb.',
        'The next day the chief priests and Pharisees go to Pilate. “That deceiver said: After three days I will rise again,” they say. “Have the tomb guarded, so that his disciples cannot steal him away.” “You have a guard,” says Pilate, “go and make it as secure as you can.” They seal the stone and set the guards in front of it.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who asks Pilate for the body of Jesus?', options: ['Joseph of Arimathaea', 'Judas', 'Barabbas'] },
        { q: 'Where does Joseph lay Jesus?', options: ['in his own tomb in the rock', 'in a boat', 'in the temple'] },
        { q: 'What do the chief priests do the next day?', options: ['They have the tomb guarded.', 'They build a house.', 'They leave town.'] }
      ]
    }
  ],
  exam: [
    { q: 'What do the people put on the road?', options: ['their cloaks and branches from the trees', 'stones', 'baskets of flowers'] },
    { q: 'What do the wise ones take with them?', options: ['oil in jars', 'bread', 'nothing'] },
    { q: 'What did the righteous do for the sick?', options: ['They visited him.', 'They ran away.', 'They laughed at him.'] },
    { q: 'What do they offer Judas for the betrayal?', options: ['thirty pieces of silver', 'a donkey', 'a house'] },
    { q: 'What happens when Peter says it for the third time?', options: ['A rooster crows.', 'It rains.', 'The door opens.'] },
    { q: 'Who asks Pilate for the body of Jesus?', options: ['Joseph of Arimathaea', 'Judas', 'Barabbas'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
letztewocheEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/letztewoche/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
