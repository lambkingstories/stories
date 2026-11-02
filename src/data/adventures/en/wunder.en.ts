/**
 * English texts of the adventure "The Miracles at the Lake" (8 to 10 years): the same shape as `../wunder.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Lake of Gennesaret, Simon called Peter, Jairus, Talitha cumi, the country of the Gerasenes, Nazareth); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Wunder/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Wunder/tools/bauen_wunder_neu.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const wunderEn: TextOverlay<Journey> = {
  title: 'The Miracles at the Lake',
  subtitle: 'From the Storm to the Hem of His Garment',
  gift: { title: 'Five Loaves and Two Fish' },
  stages: [
    {
      title: 'Over to the Other Side',
      ref: 'Mark 4:35–36',
      text: [
        'All day long Jesus has been teaching the people by the Lake of Gennesaret. He sits in a boat, and the crowd stands on the shore. He has told them stories, for example about a farmer who scatters seed on his field.',
        'Now evening is coming. Jesus says to his disciples: “Let us go over to the other side.”',
        'The disciples send the people home. Jesus stays in the boat, just as he is, and they push off. Other boats sail out with them.',
        'Behind them the shore grows smaller and smaller. On the water it becomes quiet.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Let us go over to the other ', '.”'], words: ['side', 'hill', 'house'] },
            { hint: 'Now two words are missing.', parts: ['Jesus says to his ', ': “Let us ', ' to the other side.”'], words: ['disciples', 'go over', 'neighbors', 'turn back'] }
          ]
        }
      },
      questions: [
        { q: 'What has Jesus done all day long?', options: ['He has taught the people by the lake.', 'He has caught fish.', 'He has slept in the boat.'] },
        { q: 'What does Jesus say to his disciples in the evening?', options: ['Let us go over to the other side.', 'We are staying here.', 'Go without me.'] }
      ]
    },
    {
      title: 'The Storm',
      ref: 'Mark 4:37–38',
      text: [
        'In the middle of the lake a great storm rises. The wind whirls, and the waves beat into the boat. More and more water runs in, until the boat is full.',
        'Jesus lies at the back of the boat, asleep. His head rests on a pillow. He has had a long day.',
        'The disciples try to bail the water out of the boat, but it comes in faster than they can bail. They wake him up. “Master,” they cry, “do you not care that we are going under?”',
        'The wind howls. The other boats dance on the waves. The disciples are very afraid.'
      ],
      task: {
        hint: 'Bail the water out of the boat: tap a puddle.',
        bail: {
          rounds: [
            { hint: 'Bail the water out of the boat: tap a puddle. Every puddle takes three scoops.' },
            { hint: 'Once more, the waves come faster now. Keep bailing.' }
          ]
        }
      },
      questions: [
        { q: 'What happens to the boat in the storm?', options: ['It fills with water.', 'It stays dry.', 'It flies away.'] },
        { q: 'What does Jesus do when the storm breaks out?', options: ['He sleeps at the back of the boat.', 'He rows.', 'He stands on the shore.'] }
      ]
    },
    {
      title: 'A Great Calm',
      ref: 'Mark 4:39–41',
      text: [
        'Jesus gets up. He speaks to the wind and to the sea: “Peace, be still!”',
        'Then the wind drops. The waves grow calm, and it becomes completely quiet on the lake. A moment ago everything was raging. Now all you can hear is the water against the boat. The disciples sit there and do not know what to say.',
        'Jesus says to the disciples: “Why are you so afraid? Do you have no faith?”',
        'The disciples are amazed and very much afraid. “Who is this?” they say to one another. “Even the wind and the sea obey him.”'
      ],
      task: {
        hint: 'Put the four pictures in the order of the story.',
        order: {
          cards: [{ label: 'The boats set out in the evening' }, { label: 'The storm breaks out' }, { label: 'The disciples wake Jesus' }, { label: 'It becomes completely calm' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the beginning in the evening and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does Jesus say to the wind and the sea?', options: ['Peace, be still!', 'Blow harder!', 'Bring us to the shore!'] },
        { q: 'What happens then?', options: ['It becomes completely quiet.', 'The storm grows even bigger.', 'The boat sinks.'] }
      ]
    },
    {
      title: 'The Man Among the Tombs',
      ref: 'Mark 5:1–20',
      text: [
        'On the other side of the lake, in the country of the Gerasenes, Jesus steps out of the boat. A man runs toward him. He lives out among the tombs, because an evil spirit torments him, and nobody can hold him.',
        'The man falls down before Jesus. Jesus commands the evil spirit to leave the man. The spirits beg to be allowed to go into a great herd of pigs on the mountain, and Jesus allows it. Then the animals rush down the slope into the lake.',
        'The herdsmen run into the town. When the people come, the man sits there quietly, with clothes on and a clear mind. They become afraid and ask Jesus to leave.',
        'The man wants to go with Jesus. But Jesus says: “Go home and tell what the Lord has done for you.” He does, and everyone is amazed.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does the man live when Jesus arrives?', options: ['among the tombs', 'in a house by the lake', 'on a ship'] },
        { q: 'What happens to the herd of pigs?', options: ['It rushes down the slope into the lake.', 'It runs home.', 'It stays in the pasture.'] },
        { q: 'What is the man to tell at home?', options: ['what the Lord has done for him', 'where Jesus is going', 'where the pigs are'] }
      ]
    },
    {
      title: 'Jairus Asks for Help',
      ref: 'Mark 5:21–24',
      text: [
        'Jesus sails back across the lake. A great crowd is already waiting for him on the shore. Everyone wants to see him.',
        'Then a man comes running through the people. His name is Jairus, and he is a ruler of the synagogue. When he sees Jesus, he falls down before him.',
        '“My little daughter is dying,” he begs. “Please come and lay your hand on her, so that she may be well and live.”',
        'Jesus goes with him. The whole crowd follows and presses around them from every side. Jairus has to push his way through the crush, for every step takes a long time.'
      ],
      task: {
        hint: 'Get Jesus and Jairus through the crowd: tap the people so that they make room.',
        crowd: {
          pair: { label: 'Jesus and Jairus' },
          people: [{ label: 'A person in the crowd' }, { label: 'A person in the crowd' }, { label: 'A person in the crowd' }, { label: 'A person in the crowd' }, { label: 'A person in the crowd' }, { label: 'A person in the crowd' }],
          rounds: [
            { hint: 'Jesus and Jairus want to reach the house. Tap the people so that they make room.' },
            { hint: 'Once more, the crowd is bigger.' }
          ]
        }
      },
      questions: [
        { q: 'What is the name of the man who asks Jesus for help?', options: ['Jairus', 'Simon', 'Levi'] },
        { q: 'What is wrong with his daughter?', options: ['She is dying.', 'She has run away.', 'She is in the boat.'] }
      ]
    },
    {
      title: 'The Hem of His Garment',
      ref: 'Mark 5:25–34',
      text: [
        'A woman is walking along in the crowd. For twelve years she has been sick. Many doctors have not helped her, and all her money is gone.',
        'She has heard about Jesus. “If I can only touch his clothes,” she thinks, “I will be well.” From behind she pushes close and touches them. At once she feels it: she is well.',
        'Jesus stops and turns around. “Who touched my clothes?” The disciples wonder: “You can see how the people are pressing around you!”',
        'Then the woman comes, trembling, and falls down before him. She tells him everything. Jesus says: “Daughter, your faith has made you well. Go in peace.”'
      ],
      task: {
        hint: 'Search the crowd: find the four people from the story.',
        find: { labels: ['The woman with the head cloth', 'Jairus', 'Jesus', 'Simon, a disciple'], doneText: 'You have found all four: the woman, Jairus, Jesus and Simon. They were all in the crowd by the lake.' }
      },
      questions: [
        { q: 'How long has the woman been sick?', options: ['twelve years', 'two days', 'ten years'] },
        { q: 'What does she touch?', options: ['Jesus’ clothes', 'Jesus’ hand', 'the boat'] }
      ]
    },
    {
      title: 'The Girl Is Asleep',
      ref: 'Mark 5:35–43',
      text: [
        'While Jesus is still speaking, people come from the house of Jairus. “Your daughter is dead,” they say. “Why trouble the Master any further?”',
        'Jesus hears it and says to Jairus: “Do not be afraid, only believe!” Only Peter, James and John may go along.',
        'In the house many are weeping and wailing. Jesus says: “The child is not dead, she is asleep.” They laugh at him. He sends everyone out. Then he goes with the father, the mother and the three disciples to the child.',
        'He takes her by the hand: “Talitha cumi! Little girl, I say to you: get up!” At once she gets up and walks about. She is twelve years old. Jesus asks them not to tell anyone, and says that she should be given something to eat.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Jesus say to Jairus?', options: ['Do not be afraid, only believe!', 'Go home.', 'We are too late.'] },
        { q: 'How many disciples go into the house with Jesus?', options: ['three', 'all twelve', 'none'] },
        { q: 'What should be given to the girl?', options: ['something to eat', 'a new dress', 'medicine'] }
      ]
    },
    {
      title: 'Two by Two',
      ref: 'Mark 6:1–13',
      text: [
        'Jesus comes to his hometown, Nazareth. On the Sabbath he teaches in the synagogue. The people are amazed, but they are also offended: “Is this not the carpenter, the son of Mary?” Jesus marvels at their unbelief.',
        'Then he calls the twelve to him. He sends them out, always two by two.',
        '“Take nothing for the journey,” he says, “only a staff. No bread, no bag and no money in your belt. Wear sandals, and only one shirt.”',
        'The disciples set out. They tell people about God, anoint many sick people with oil and make them well.'
      ],
      task: {
        hint: 'Pack the bundle for the journey: tap what Jesus allowed.',
        bundle: {
          things: [{ label: 'Staff' }, { label: 'Sandals' }, { label: 'Shirt' }, { label: 'Bread' }, { label: 'Bag' }, { label: 'Money bag' }, { label: 'Second shirt' }],
          bundle: { label: 'The bundle for the journey' },
          disciple: { label: 'A disciple' },
          rounds: [
            { hint: 'Jesus says: take nothing for the journey except a staff and sandals. Tap what may go into the bundle.' },
            { hint: 'Once more: only one shirt, no bag, no second shirt, and the staff.' }
          ]
        }
      },
      questions: [
        { q: 'How does Jesus send the disciples out?', options: ['always two by two', 'all together', 'each one alone'] },
        { q: 'What may they take along?', options: ['a staff, sandals and one shirt', 'bread and money', 'a big bag'] }
      ]
    },
    {
      title: 'A Quiet Place',
      ref: 'Mark 6:30–34',
      text: [
        'The disciples come back to Jesus and tell him everything they have done. So many people are around that they do not even have time to eat.',
        'Jesus says: “Come, let us go to a lonely place and rest a little.” They set off in the boat.',
        'But the people see them leaving. From all the towns they run on foot along the shore, and they are already there when the boat arrives.',
        'Jesus steps out and sees the many people. He feels sorry for them, because they are like sheep without a shepherd. He begins to tell them many things.'
      ],
      task: { hint: 'Put the picture of the people on the green meadow together.' },
      questions: [
        { q: 'Where does Jesus want to go with the disciples?', options: ['to a lonely place', 'home', 'to Jerusalem'] },
        { q: 'How do the people get there?', options: ['They run on foot along the shore.', 'They sail in boats.', 'They ride on donkeys.'] }
      ]
    },
    {
      title: 'Five Loaves and Two Fishes',
      ref: 'Mark 6:35–44',
      text: [
        'The day is almost over. The disciples say: “Send the people away, so that they can buy something to eat.” But Jesus answers: “You give them something to eat!”',
        '“How many loaves do you have?” Jesus asks. The disciples go and look. “Five,” they say, “and two fishes.”',
        'Jesus has the people sit down in groups on the green grass. Then he takes the loaves and the fishes, looks up to heaven and gives thanks. He breaks the bread and gives it to the disciples to hand out.',
        'Everyone eats and is full. The disciples gather up twelve baskets full of what is left over. There were five thousand men.'
      ],
      task: {
        hint: 'Share the bread: tap a group, then gather the baskets.',
        bread: {
          groups: [{ label: 'A group of people on the grass' }, { label: 'A group of people on the grass' }, { label: 'A group of people on the grass' }, { label: 'A group of people on the grass' }, { label: 'A group of people on the grass' }],
          basket: { label: 'Basket with five loaves and two fish' },
          leftover: { label: 'Basket with leftovers' },
          rounds: [
            { hint: 'Jesus gives thanks and has the bread and fish handed out. Tap a group so that a disciple feeds them.' },
            { hint: 'A lot is left over. Gather the baskets with the leftovers: twelve baskets full.' }
          ]
        }
      },
      questions: [
        { q: 'What do the disciples have to eat?', options: ['five loaves and two fishes', 'twelve loaves', 'nothing'] },
        { q: 'How do the people sit?', options: ['in groups on the green grass', 'all in one row', 'in the boat'] }
      ]
    },
    {
      title: 'Jesus Comes Over the Water',
      ref: 'Mark 6:45–52',
      text: [
        'Jesus sends the disciples ahead in the boat to the other side. He himself goes up a mountain alone to pray.',
        'In the evening the boat is in the middle of the lake. The wind is blowing against them, and they make little headway. From the land Jesus sees how hard they are struggling.',
        'In the last watch of the night he walks out to them on the water. The disciples see him and cry out. They think it is a ghost.',
        'But Jesus calls: “Be of good cheer! It is I, do not be afraid!” He climbs into the boat, and the wind drops.'
      ],
      task: {
        hint: 'Row against the wind: tap left and right in turn.',
        row: {
          boat: { label: 'The boat with two oars' },
          jesus: { label: 'Jesus on the water' },
          rounds: [
            { hint: 'Row left and right in turn. The wind wants to turn the boat.' },
            { hint: 'Once more, the wind is stronger. Row a little more against the wind.' }
          ]
        }
      },
      questions: [
        { q: 'Where does Jesus go to pray?', options: ['up a mountain', 'into the town', 'into the boat'] },
        { q: 'Why do the disciples make so little headway?', options: ['The wind is blowing against them.', 'The boat is too heavy.', 'The oars are broken.'] }
      ]
    },
    {
      title: 'At the Hem of His Garment',
      ref: 'Mark 6:53–56',
      text: [
        'The boat comes to land in the country of Gennesaret. Jesus steps out, and at once the people know him. “Jesus is here!” they cry.',
        'They run into all the villages around and spread the news everywhere, as fast as they can. Then they carry their sick on beds to the places where Jesus is.',
        'Wherever he goes, into villages, towns and marketplaces, they lay the sick in the open places. They beg him: “Let us only touch the hem of your garment.”',
        'And all who touch him are made well. The marketplaces fill with happy people.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does the boat come to land?', options: ['in the country of Gennesaret', 'at Nazareth', 'at Jerusalem'] },
        { q: 'How do the people bring the sick to Jesus?', options: ['on beds', 'on a boat', 'on donkeys'] },
        { q: 'What do they ask Jesus for?', options: ['only to touch the hem of his garment', 'to give them bread', 'to eat with them'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Jesus’ head rest on when he sleeps in the storm?', options: ['a pillow', 'a net', 'an oar'] },
    { q: 'What does Jesus say to the wind and the sea?', options: ['Peace, be still!', 'Blow harder!', 'Take us home!'] },
    { q: 'What is the name of the man who asks Jesus for help for his daughter?', options: ['Jairus', 'Peter', 'Levi'] },
    { q: 'How long has the woman been sick who touches Jesus’ clothes?', options: ['twelve years', 'two days', 'one year'] },
    { q: 'How many baskets full of leftovers remain after the meal?', options: ['twelve', 'five', 'two'] },
    { q: 'What does Jesus call out to the disciples on the water?', options: ['Be of good cheer! It is I, do not be afraid!', 'Row faster!', 'Sail back!'] }
  ]
}
