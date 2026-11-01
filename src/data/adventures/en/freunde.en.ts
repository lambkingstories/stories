/**
 * English texts of the adventure "Jesus Calls His Friends" (8 to 10 years): the same shape as `../freunde.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Lake of Gennesaret, Simon called Peter, Andrew, James, John, Zebedee, Capernaum, Levi, Alphaeus); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Freunde/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Freunde/tools/bauen_freunde.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const freundeEn: TextOverlay<Journey> = {
  title: 'Jesus Calls His Friends',
  subtitle: 'From the Boat on the Lake to the Mountain',
  gift: { title: 'The Full Net' },
  stages: [
    {
      title: 'The Boat as a Pulpit',
      ref: 'Luke 5:1–3',
      text: [
        'Jesus is standing by the Lake of Gennesaret. The people press closer and closer around him, because they want to hear the word of God.',
        'Two boats lie at the shore. The fishermen have already stepped out and are washing their nets. Among them are Simon and his partners James and John, the sons of Zebedee.',
        'Jesus sees the boats and walks toward them. He steps into the boat that belongs to Simon. He asks him to push out a little way from the land.',
        'Then Jesus sits down in the boat and teaches the people from the water. So everyone can see him and hear him.'
      ],
      task: { hint: 'Put the picture of the boats at the shore together.' },
      questions: [
        { q: 'Where is Jesus standing when the people press around him?', options: ['by the Lake of Gennesaret', 'by the Jordan', 'in the temple'] },
        { q: 'What are the fishermen doing at the shore?', options: ['They are washing their nets.', 'They are sleeping.', 'They are selling fish.'] }
      ]
    },
    {
      title: 'At Your Word',
      ref: 'Luke 5:4–5',
      text: [
        'When Jesus has finished speaking, he says to Simon: “Launch out into the deep. Let down your nets, so that you may catch some fish.”',
        'Simon answers: “Master, we have worked all night. We have caught nothing.” All night long their nets were empty.',
        'But then Simon says: “At your word I will let down the net.”',
        'From the boat Jesus has just been speaking to the people on the shore. Now Simon does what Jesus has said. They sail out onto the lake, and Jesus is with them in the boat.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“At your ', ' I will let down the net.”'], words: ['word', 'sign', 'command'] },
            { hint: 'Now two words are missing.', parts: ['“Launch out into the ', '. Let down your ', ', so that you may catch some fish.”'], words: ['deep', 'nets', 'shore', 'anchor'] }
          ]
        }
      },
      questions: [
        { q: 'What does Jesus say to Simon?', options: ['Launch out into the deep and let down your nets.', 'Go home.', 'Bring me a fish.'] },
        { q: 'What has Simon caught in the night?', options: ['nothing', 'a hundred fish', 'one big fish'] }
      ]
    },
    {
      title: 'The Full Net',
      ref: 'Luke 5:6–7',
      text: [
        'Simon and the others in the boat let down the nets, just as Jesus has said. All night they caught nothing. The net that was empty a moment ago grows heavy. Suddenly they catch so many fish that their net begins to break.',
        'They cannot pull the net in alone. They wave to their partners in the other boat. They are to come and help them.',
        'The partners come over. These are James and John. Together they fill both boats with fish. The boats become so full that they almost sink.'
      ],
      task: {
        hint: 'Fill both boats up to the mark: tap a boat, and a fish jumps in.',
        boats: {
          boats: [{ label: 'Small boat' }, { label: 'Large boat' }],
          rounds: [
            { hint: 'Fill both boats up to the mark: tap a boat, and a fish jumps in.' },
            { hint: 'Once more, this time with more fish. Fill both boats again.' }
          ]
        }
      },
      questions: [
        { q: 'What happens to the net when they catch so many fish?', options: ['It begins to break.', 'It stays empty.', 'It sinks in the lake.'] },
        { q: 'Whom do they call to help?', options: ['their partners in the other boat', 'the people on the shore', 'Jesus'] }
      ]
    },
    {
      title: 'Catching People',
      ref: 'Luke 5:8–11',
      text: [
        'When Simon Peter sees it, he falls down on his knees before Jesus in the boat. “Lord, go away from me,” he says, “for I am a sinful man.” A great fear has seized him and all who are with him, because of the catch of fish they have made.',
        'James and John, the sons of Zebedee, are afraid too. They are Simon’s partners and were in the other boat.',
        'Jesus says to Simon: “Do not be afraid. From now on you will catch people.”',
        'Then they bring the boats to land. They leave everything behind and go with Jesus.'
      ],
      task: {
        hint: 'Put the four pictures in the order of the story.',
        order: {
          cards: [{ label: 'Jesus teaches from the boat' }, { label: 'Simon lets down the net' }, { label: 'Both boats are full of fish' }, { label: 'They leave everything and follow Jesus' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning at the shore and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does Jesus say to Simon?', options: ['Do not be afraid. From now on you will catch people.', 'Go out again.', 'Sell the fish.'] },
        { q: 'What are the names of the sons of Zebedee?', options: ['James and John', 'Andrew and Philip', 'Thomas and Matthew'] }
      ]
    },
    {
      title: 'Through the Roof',
      ref: 'Mark 2:1–12',
      text: [
        'A few days later Jesus is back in Capernaum. The word gets around that he is in the house, and so many people come that there is no room left, not even at the door. Jesus tells them the word of God.',
        'Four men carry a man who cannot walk to Jesus on his bed. Because of the crowd they cannot get in. So they take off the roof right above the place where Jesus is, and they let the bed down with the sick man on it.',
        'When Jesus sees their faith, he says to the man: “Son, your sins are forgiven.”',
        'He wants to show that he has power to forgive sins. Then he says: “Get up, take your bed, and go home!” The man gets up, takes his bed and walks out in front of everyone. All are amazed and praise God.'
      ],
      task: {
        hint: 'Open the roof right above Jesus: tap the pieces of the roof there.',
        roof: {
          jesus: { label: 'Jesus sits and teaches' },
          people: [{ label: 'Two bearded men' }, { label: 'Woman with a child' }, { label: 'Old man with a stick' }, { label: 'Three young men' }, { label: 'Girl and boy' }, { label: 'Two women with head cloths' }],
          mat: { label: 'The man who cannot walk on his bed' },
          rounds: [
            { hint: 'Open the roof right above Jesus: tap the pieces of the roof there. People are sitting under the others.' },
            { hint: 'Now Jesus sits in another place. Open the roof right above him again.' }
          ]
        }
      },
      questions: [
        { q: 'How many men carry the man who cannot walk?', options: ['four', 'two', 'ten'] },
        { q: 'How do they get to Jesus when they cannot come through the door?', options: ['They open the roof and let the bed down.', 'They wait outside until evening.', 'They climb through a window.'] }
      ]
    },
    {
      title: 'Levi at the Toll Booth',
      ref: 'Mark 2:13–14; Luke 5:27–28',
      text: [
        'Jesus goes out to the lake again. All the people come to him, and he teaches them. Then he walks on a little way.',
        'Jesus has already called four fishermen: Simon, Andrew, James and John. Now he comes to a place where a man sits at the toll booth.',
        'This man is called Levi, and he is the son of Alphaeus. He is a tax collector: he collects the tax from the people who pass by. Whoever comes by with goods has to pay him.',
        'Jesus sees him and says: “Follow me!” Levi gets up, leaves everything behind and follows Jesus.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who is sitting at the toll booth?', options: ['Levi, the son of Alphaeus', 'Simon, the fisherman', 'John, the son of Zebedee'] },
        { q: 'What does Jesus say to him?', options: ['Follow me!', 'Stay sitting here.', 'Count your money.'] },
        { q: 'What does Levi do?', options: ['He gets up and follows Jesus.', 'He stays at the booth.', 'He runs away.'] }
      ]
    },
    {
      title: 'The Feast at Levi’s House',
      ref: 'Mark 2:15–17; Luke 5:29–32',
      text: [
        'Later Levi invites Jesus to a big meal in his house. Many tax collectors and sinners sit down at the table with Jesus and his disciples. There are many who follow him.',
        'The scribes and the Pharisees see this and grumble. They ask the disciples: “Why does he eat and drink with tax collectors and sinners?”',
        'Jesus hears what they say. He answers them: “Those who are well do not need a doctor, but those who are sick.”',
        'Then he says: “I have not come to call the righteous. I have come to call sinners, so that they turn back.”'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The bread: Jesus eats with the tax collectors and sinners.' }, { text: 'The jug: Levi gives a big meal in his house.' }, { text: 'The bowl: Many tax collectors and sinners eat with Jesus.' }, { text: 'The ointment pot: Those who are well do not need a doctor, but those who are sick.' }, { text: 'The scroll: The scribes ask: Why does he eat with the sinners?' }, { text: 'The coin pouch: Levi is a tax collector and collects the tax.' }] }
      },
      questions: [
        { q: 'At whose table does Jesus sit?', options: ['at Levi’s', 'at Simon’s', 'at Zebedee’s'] },
        { q: 'Who eats with Jesus?', options: ['many tax collectors and sinners', 'only the scribes', 'only fishermen'] }
      ]
    },
    {
      title: 'Twelve Friends on the Mountain',
      ref: 'Mark 3:13–19; Luke 6:13',
      text: [
        'Jesus climbs up a mountain and calls to himself the ones he wants. They come to him.',
        'He chooses twelve of them, whom he also calls apostles. They are to be with him, and he wants to send them out so that they tell people the word of God. They are also to have power to heal the sick.',
        'Jesus gives Simon the name Peter. James and John, the sons of Zebedee, he calls “sons of thunder.” Then come Andrew, Philip, Bartholomew, Matthew and Thomas.',
        'And James, the son of Alphaeus, Thaddaeus, Simon the Zealot and Judas Iscariot. He later betrayed him.'
      ],
      task: {
        hint: 'Look on the mountain: find the four fishermen whom Jesus called at the lake.',
        find: { labels: ['Simon with the casting net', 'Andrew with the fish basket', 'James with the rope', 'John with the oar'], doneText: 'You have found all four: Simon, Andrew, James and John. They are among the twelve friends of Jesus.' }
      },
      questions: [
        { q: 'Where does Jesus go when he calls the twelve?', options: ['up a mountain', 'to the lake', 'to the temple'] },
        { q: 'What name does Jesus give to Simon?', options: ['Peter', 'John', 'Thaddaeus'] }
      ]
    },
    {
      title: 'Who Belongs to Jesus?',
      ref: 'Mark 3:31–35',
      text: [
        'Jesus is in a house, and many people sit in a circle around him. Outside, his mother and his brothers arrive. They stay standing in front of the house and send for him.',
        'The people in the house say to Jesus: “Your mother and your brothers are outside. They are asking for you.”',
        'Jesus answers: “Who is my mother, and who are my brothers?” He looks at those who sit in a circle around him.',
        'Then he says: “Here are my mother and my brothers! For whoever does the will of God is my brother and my sister and my mother.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who is standing outside the house?', options: ['Jesus’ mother and his brothers', 'the twelve disciples', 'the fishermen from the lake'] },
        { q: 'Where does Jesus look when he answers?', options: ['at those who sit in a circle around him', 'out of the door', 'up at the sky'] },
        { q: 'Who is Jesus’ brother and sister and mother?', options: ['whoever does the will of God', 'whoever has the most money', 'whoever runs fastest'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Simon say before he lets down the net?', options: ['At your word I will let down the net.', 'That is too far for me.', 'I have no time.'] },
    { q: 'How full do the two boats become?', options: ['so full that they almost sink', 'only half full', 'not full at all'] },
    { q: 'What does Jesus say to Simon in the boat?', options: ['Do not be afraid. From now on you will catch people.', 'Go out again.', 'Sell the fish.'] },
    { q: 'How many men carry the man who cannot walk to Jesus?', options: ['four', 'two', 'ten'] },
    { q: 'Who needs the doctor, says Jesus?', options: ['the sick', 'the well', 'nobody'] },
    { q: 'What name does Jesus give to Simon?', options: ['Peter', 'John', 'Thaddaeus'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
freundeEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/freunde/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
