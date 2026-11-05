/**
 * English texts of the adventure "Easter" (8 to 10 years): the same shape as `../ostern.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Luke 24; John 20 and 21: Mary Magdalene, Simon Peter, Cleopas, Emmaus, Thomas, the sea of Tiberias, Bethany); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Ostern/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Ostern/tools/bauen_ostern.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const osternEn: TextOverlay<Journey> = {
  title: 'Easter',
  subtitle: 'Jesus is alive',
  gift: { title: 'The Catch of Fish' },
  stages: [
    {
      title: 'The Tomb Is Empty',
      ref: 'John 20:1–10',
      text: [
        'It is the first day of the week and still dark when Mary Magdalene comes to the tomb. The great stone in front of the entrance has been rolled away. Mary runs to Simon Peter and to the other disciple, the one Jesus loves. “They have taken the Lord out of the tomb,” she cries, “and we do not know where they have laid him!”',
        'The two men start to run, and the other disciple is faster than Peter. He reaches the tomb first, stoops down and looks in. He sees the linen cloths lying there, but he does not go in.',
        'Then Peter comes and goes straight into the tomb. The linen cloths are lying there. The cloth that was wrapped around the head of Jesus is not with them, but lies folded up in a place by itself. Now the other disciple goes in too. He sees it and believes. From the Scripture they do not yet know that Jesus must rise from the dead. The two go home again.'
      ],
      task: {
        hint: 'Find Mary Magdalene, Peter, the other disciple and the linen cloths in the garden.',
        find: { labels: ['Mary Magdalene', 'Peter', 'The other disciple', 'The linen cloths'], doneText: 'You have found them all: Mary Magdalene, Peter, the other disciple and the linen cloths.' }
      },
      questions: [
        { q: 'Who comes to the tomb early?', options: ['Mary Magdalene', 'Pilate', 'a shepherd'] },
        { q: 'What do the disciples see in the tomb?', options: ['the linen cloths', 'a treasure', 'a fire'] }
      ]
    },
    {
      title: 'Mary!',
      ref: 'John 20:11–18',
      text: [
        'Mary stands outside the tomb and weeps. Through her tears she looks in. Two angels in white are sitting there. “Woman, why are you weeping?” they ask. “They have taken away my Lord,” says Mary, “and I do not know where they have laid him.”',
        'Then she turns around and sees someone standing there. It is Jesus, but she does not know it. “Woman, why are you weeping? Whom are you looking for?” he asks. Mary thinks he is the gardener. “Sir, if you have carried him away, tell me where you have laid him. I will take him.”',
        '“Mary!” says Jesus. Then she turns to him. “Rabboni!” she cries, which means Master. “Go to my brothers,” says Jesus, “and tell them: I am going up to my Father and your Father, to my God and your God.”',
        'Mary Magdalene goes to the disciples. “I have seen the Lord!” she tells them, and she says what he said to her.'
      ],
      task: {
        hint: 'Bring Mary through the lanes to the disciples.',
        errand: {
          rounds: [{ hint: 'Mary runs from the garden to the disciples. Tap the lane she should run along.' }, { hint: 'Now there are more lanes. Where there is a well, the lane ends.' }]
        }
      },
      questions: [
        { q: 'What does Mary think the man at the tomb is?', options: ['the gardener', 'a soldier', 'a merchant'] },
        { q: 'What does Jesus call out?', options: ['Mary!', 'Peter!', 'Thomas!'] }
      ]
    },
    {
      title: 'Two Travelers',
      ref: 'Luke 24:13–27',
      text: [
        'On the same day two disciples are walking to Emmaus, a village a little way from Jerusalem. One of them is called Cleopas. On the road they talk about everything that has happened in these days.',
        'Then Jesus himself comes up and walks with them, but they do not know him. “What are you talking about on the road?” he asks. The two stand still, sad.',
        '“You must be the only one in Jerusalem who does not know what has happened there,” says Cleopas. “What do you mean?” asks Jesus. “The story of Jesus of Nazareth,” they say. “He was a prophet, mighty in deed and word. He was crucified. We had hoped that he was the one who would redeem Israel. This morning some women were at the tomb. They did not find his body, and they say that he is alive.”',
        '“Did not the Christ have to suffer all this and then enter into his glory?” asks Jesus. And he explains to them what is written about him in all the Scriptures, beginning with Moses and going through all the prophets.'
      ],
      task: {
        hint: 'Lead the two walkers to Emmaus.',
        wander: {
          rounds: [{ hint: 'Lead the two walkers up the road to the milestone. Keep away from the stones and thornbushes.', obstacles: [{ name: 'A stone' }, { name: 'A thornbush' }, { name: 'A stone' }, { name: 'A stone' }, { name: 'A thornbush' }], goal: { name: 'The milestone' } }, { hint: 'Now the road is longer and there are more stones on it.', obstacles: [{ name: 'A stone' }, { name: 'A thornbush' }, { name: 'A stone' }, { name: 'A thornbush' }, { name: 'A stone' }, { name: 'A stone' }, { name: 'A thornbush' }, { name: 'A stone' }], goal: { name: 'The milestone' } }]
        }
      },
      questions: [
        { q: 'Where are the two disciples going?', options: ['to Emmaus', 'to Bethlehem', 'to the sea'] },
        { q: 'What does Jesus explain to them?', options: ['what is written about him in the Scriptures', 'how to catch fish', 'the way to Jerusalem'] }
      ]
    },
    {
      title: 'The Bread in Emmaus',
      ref: 'Luke 24:28–35',
      text: [
        'The two come close to the village where they are going. Jesus acts as if he were going farther. But they urge him: “Stay with us! It is evening, and the day is nearly over.” So he goes in to stay with them.',
        'At the table Jesus takes the bread, gives thanks, breaks it and gives it to them. Then their eyes are opened, and they know him. But he vanishes from their sight. “Did not our heart burn within us,” they say to each other, “while he talked with us on the road and opened the Scriptures to us?”',
        'In the same hour they get up and go back to Jerusalem. There the disciples are gathered together. “The Lord is risen indeed,” they tell them, “and he has appeared to Simon!” Then the two tell what happened on the road, and how they knew him: he broke the bread.'
      ],
      task: {
        hint: 'Set the table in Emmaus.',
        table: {
          slots: [{ name: 'The place on the left' }, { name: 'The place of the guest' }, { name: 'The place on the right' }, { name: 'The middle of the table' }, { name: 'The basket beside the table' }],
          rounds: [{ hint: 'The two ask the stranger: Abide with us! Put a cup and a bowl at every place.', items: [{ name: 'A cup' }, { name: 'A cup' }, { name: 'A cup' }, { name: 'A bowl' }, { name: 'A bowl' }, { name: 'A bowl' }] }, { hint: 'The lamp and the jug go in the middle, the bread to the guest. What does not belong on the table goes into the basket.', items: [{ name: 'The oil lamp' }, { name: 'The jug' }, { name: 'The flatbread' }, { name: 'A fishing net' }, { name: 'A shepherd’s staff' }] }]
        }
      },
      questions: [
        { q: 'What do the two say to Jesus before the village?', options: ['Stay with us!', 'Go on!', 'We do not know you.'] },
        { q: 'How do they know Jesus?', options: ['He breaks the bread.', 'He sings a song.', 'He shows them a net.'] }
      ]
    },
    {
      title: 'Peace Be with You',
      ref: 'Luke 24:36–43; John 20:19–20',
      text: [
        'In Jerusalem the disciples are still talking about what the two from Emmaus have told them. It is evening, and the doors are shut, for they are afraid. Suddenly Jesus is standing among them. “Peace be with you!” he says.',
        'The disciples are startled and afraid. They think they are seeing a ghost. “Why are you so frightened?” asks Jesus. “Look at my hands and my feet: it is I myself! Touch me and see: a ghost does not have flesh and bones, as you see that I have.” And he shows them his hands. Then the disciples are glad when they see the Lord.',
        'But for sheer joy they still cannot believe it, and they wonder. “Do you have anything to eat?” asks Jesus. They give him a piece of broiled fish. He takes it and eats it before their eyes.'
      ],
      task: {
        hint: 'Open all the shutters of the room.',
        shutters: {
          rounds: [{ hint: 'Jesus stands in the midst of the disciples. Open all the shutters. A shutter takes its neighbours with it.' }, { hint: 'Now the house has two rows. In each row the neighbours on the left and right move too.' }]
        }
      },
      questions: [
        { q: 'What does Jesus say when he stands among the disciples?', options: ['Peace be with you!', 'Be afraid!', 'Go home!'] },
        { q: 'What does Jesus eat in front of them?', options: ['a piece of broiled fish', 'a piece of bread', 'a bowl of grapes'] }
      ]
    },
    {
      title: 'Thomas',
      ref: 'John 20:24–29',
      text: [
        'Thomas, one of the twelve, who is called the Twin, was not there when Jesus came to the disciples. “We have seen the Lord!” they tell him. But Thomas answers: “I will not believe it unless I see him myself.”',
        'Eight days later the disciples are together in the house again, and this time Thomas is with them. The doors are shut. Then Jesus comes and stands among them. “Peace be with you!” he says.',
        'Then he turns to Thomas. “Look at my hands,” he says, “and do not doubt, but believe!”',
        'Thomas answers: “My Lord and my God!”',
        '“You believe because you have seen me,” says Jesus. “Blessed are those who have not seen and yet have believed!”'
      ],
      task: {
        hint: 'Find what is missing in the left picture.',
        diff: {
          rounds: [{ hint: 'Eight days later the disciples are in the house again. The right picture has a few more things. Tap what is missing on the left.' }, { hint: 'Once more, with smaller things.' }]
        }
      },
      questions: [
        { q: 'What does Thomas say to the other disciples?', options: ['I will not believe it unless I see him myself.', 'I believe you at once.', 'I do not want to hear about it.'] },
        { q: 'What does Thomas say to Jesus?', options: ['My Lord and my God!', 'I do not know you!', 'Go away!'] }
      ]
    },
    {
      title: 'The Catch of Fish at the Lake',
      ref: 'John 21:1–14',
      text: [
        'After this Jesus shows himself to his disciples once more, at the sea of Tiberias. Seven of them are together there, among them Simon Peter and Thomas. “I am going fishing,” says Peter. “We will go with you,” say the others. All night long they catch nothing.',
        'In the morning someone is standing on the shore, but the disciples do not know that it is Jesus. “Children, have you any food?” he calls. “No,” they call back. “Cast the net on the right side of the boat,” he says, “and you will find some.” They cast it, and now they cannot pull it in for the many fish.',
        '“It is the Lord!” says the disciple whom Jesus loves to Peter. Then Peter pulls his cloak around him and jumps into the water. The others follow in the boat. On the shore there is a fire of coals, with fish and bread lying on it. “Bring some of the fish you have caught,” says Jesus. Peter draws the net to land, full of great fish, a hundred and fifty-three of them, and the net does not break. “Come and eat,” says Jesus, and he gives them bread and fish.'
      ],
      task: {
        hint: 'Cast the net to where the fish are swimming.',
        fischzug: {
          boat: { label: 'The boat with the seven fishermen' },
          net: { label: 'The net' },
          fish: [{ label: 'A fish' }, { label: 'A fish' }, { label: 'A fish' }],
          basket: { label: 'The fish basket' },
          rounds: [{ hint: 'Pull the net to where the fish are swimming, and let go.' }, { hint: 'Now there are two swarms. Pull the net to where most fish are swimming.' }]
        }
      },
      questions: [
        { q: 'What do the disciples catch in the night?', options: ['nothing', 'a great many fish', 'only small fish'] },
        { q: 'What does Peter do when he hears: It is the Lord?', options: ['He jumps into the water.', 'He hides in the boat.', 'He runs into the hills.'] }
      ]
    },
    {
      title: 'Feed My Lambs',
      ref: 'John 21:15–19',
      text: [
        'The meal by the fire of coals is over. Then Jesus turns to Simon Peter. “Simon, son of Jonas,” he asks, “do you love me more than these?” “Yes, Lord,” answers Peter, “you know that I love you.” “Feed my lambs,” says Jesus.',
        'Again he asks: “Simon, son of Jonas, do you love me?” “Yes, Lord, you know that I love you.” “Feed my sheep,” says Jesus.',
        'For the third time he asks: “Simon, son of Jonas, do you love me?” Peter is sad because Jesus asks him for the third time. “Lord, you know everything,” he says, “you know that I love you.” “Feed my sheep,” says Jesus.',
        'Then he says to Peter: “Follow me!”'
      ],
      task: {
        hint: 'Lead the lambs to the pasture.',
        graze: {
          hirte: { label: 'The shepherd' },
          kinds: [{ label: 'A lamb' }, { label: 'A lamb' }, { label: 'A sheep' }],
          thorn: { label: 'A thornbush' },
          pen: { label: 'The pen with the open gate' },
          bridge: { label: 'The bridge over the brook' },
          rounds: [{ title: 'Feed my lambs!', hint: 'Lead the lambs to the pasture: go ahead, and keep away from the thorns.' }, { title: 'Feed my sheep!', hint: 'Now a brook runs through the meadow. Lead the animals over the bridge and keep away from the thorns.' }]
        }
      },
      questions: [
        { q: 'What does Jesus ask Peter?', options: ['Do you love me?', 'Do you want to go back home?', 'Are you hungry?'] },
        { q: 'What does Jesus say to Peter at the end?', options: ['Follow me!', 'Stay here by the fire!', 'Row back to the boat!'] }
      ]
    },
    {
      title: 'You Are Witnesses',
      ref: 'Luke 24:44–53',
      text: [
        'Jesus says to his disciples: “Everything must be fulfilled that is written about me in the law of Moses, in the prophets and in the psalms.” Then he opens their minds, so that they understand the Scriptures.',
        '“So it is written,” he says. “The Christ must suffer and rise from the dead on the third day. In his name repentance and forgiveness of sins shall be preached to all nations, beginning in Jerusalem. And you are witnesses of all this. I will send upon you what my Father has promised. Stay in the city of Jerusalem until you are clothed with power from on high.”',
        'Then Jesus leads them out as far as Bethany. He lifts up his hands and blesses them. While he blesses them, he leaves them and is carried up into heaven. The disciples worship him and go back to Jerusalem with great joy. There they are in the temple every day, praising God.'
      ],
      task: {
        hint: 'Pass the light on as far as Jerusalem.',
        flame: {
          rounds: [{ hint: 'The disciples go back to Jerusalem with great joy. Pull the flame from lamp to lamp until they all burn.', people: [{ name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }] }, { hint: 'Now the way divides. All the lamps should burn, on both ways.', people: [{ name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }, { name: 'Someone with an oil lamp' }] }]
        }
      },
      questions: [
        { q: 'What does Jesus do there with raised hands?', options: ['He blesses them.', 'He calls soldiers.', 'He builds a tent.'] },
        { q: 'How do the disciples go back to Jerusalem?', options: ['with great joy', 'with fear', 'sad and silent'] }
      ]
    }
  ],
  exam: [
    { q: 'What has happened to the stone in front of the tomb?', options: ['It has been rolled away.', 'It is still in front.', 'It is broken.'] },
    { q: 'Who walks with them without their knowing him?', options: ['Jesus', 'Peter', 'a shepherd'] },
    { q: 'How do they know Jesus?', options: ['He breaks the bread.', 'He sings a song.', 'He shows them a net.'] },
    { q: 'What does Thomas say to Jesus?', options: ['My Lord and my God!', 'I do not know you!', 'Go away!'] },
    { q: 'Where are they to cast the net?', options: ['on the right side of the boat', 'on the left side of the boat', 'onto the shore'] },
    { q: 'What does Jesus say to Peter at the end?', options: ['Follow me!', 'Stay here by the fire!', 'Row back to the boat!'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
osternEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/ostern/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
