/**
 * English texts of the adventure "All Things New" (8 to 10 years): the same shape as `../offenbarung.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Revelation 1; 2; 3; 4; 5; 7; 21; 22); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Offenbarung/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Offenbarung/tools/bauen_offenbarung.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const offenbarungEn: TextOverlay<Journey> = {
  title: 'All Things New',
  subtitle: 'A selection from Revelation: the chapters of hope',
  gift: { title: 'The City and the River' },
  stages: [
    {
      title: 'John on Patmos',
      ref: 'Revelation 1:1–11',
      text: [
        'The last book of the Bible is called the Revelation. A man named John wrote it down. Right at the beginning it says: “Blessed is he that readeth, and they that hear the words.” John writes to seven churches in Asia, which is what the land in the west of what is now Turkey was called then. “Grace be unto you, and peace,” he greets them.',
        'John calls himself their brother. He is on a small island in the sea called Patmos. He is there for the word of God and for the testimony of Jesus Christ.',
        'On the Lord’s day John is in the Spirit. Then he hears behind him a great voice, loud like a trumpet.',
        '“I am Alpha and Omega, the first and the last,” says the voice. “What you see, write in a book, and send it to the churches.” The voice names seven cities: Ephesus, Smyrna, Pergamos, Thyatira, Sardis, Philadelphia and Laodicea.'
      ],
      task: {
        hint: 'Write line by line with John and dip the pen in time.',
        write: {
          rounds: [{ hint: 'Three short lines. Dip the pen before the ink runs out.' }, { hint: 'Now there are five longer lines. You have to dip more often.' }]
        }
      },
      questions: [
        { q: 'What is the island called where John is?', options: ['Patmos', 'Crete', 'Cyprus'] },
        { q: 'What shall John do with what he sees?', options: ['write it in a book', 'paint it on a stone', 'tell all the fishermen'] }
      ]
    },
    {
      title: 'Fear Not',
      ref: 'Revelation 1:12–20',
      text: [
        'John turns around. He wants to see who is speaking with him. He sees seven golden lampstands, and in the midst of them one like the Son of man. He wears a long garment and a golden belt around his chest.',
        'His hair is white like wool, as white as snow. His voice sounds like many waters. In his right hand he holds seven stars, and his face shines like the sun in its strength.',
        'When John sees him, he falls at his feet as if he were dead. Then he lays his right hand on John.',
        '“Fear not!” he says. “I am the first and the last and the one who lives. I was dead, and, behold, I am alive for evermore. Write the things which you have seen.” And he tells him: “The seven lampstands are the seven churches.” It is Jesus, the one who lives.'
      ],
      task: { hint: 'This stage is quiet and solemn. Listen well and answer the questions.' },
      questions: [
        { q: 'What does John see when he turns around?', options: ['seven golden lampstands', 'seven white ships', 'seven tall towers'] },
        { q: 'What does he do when John lies before him as if dead?', options: ['He lays his right hand on him.', 'He gives him a cup of water.', 'He calls loudly for the fishermen.'] },
        { q: 'What does he say to John first?', options: ['Fear not!', 'Go back home!', 'Get up quickly and run!'] }
      ]
    },
    {
      title: 'Letters to the Churches',
      ref: 'Revelation 2–3, a selection',
      text: [
        'Then Jesus tells John seven letters, one for each church. John is to write them all down.',
        'To the church in Ephesus he has him write: “I know your labour and your patience. For my name’s sake you have laboured and have not fainted. Nevertheless I have somewhat against you, because you have left your first love. Repent, and do the first works again!” And he promises: “To him that overcometh will I give to eat of the tree of life, which is in the midst of the paradise of God.”',
        'To Philadelphia he has him write: “Behold, I have set before you an open door, and no man can shut it. You have a little strength, and you have kept my word.” And further: “Behold, I come quickly. Hold fast what you have.”',
        'In every one of the seven letters stand the same words: “He that hath an ear, let him hear what the Spirit saith unto the churches.”'
      ],
      task: {
        hint: 'Give the messenger the right letter in every city.',
        letters: {
          cities: [{ name: 'Ephesus' }, { name: 'Smyrna' }, { name: 'Pergamos' }, { name: 'Thyatira' }, { name: 'Sardis' }, { name: 'Philadelphia' }, { name: 'Laodicea' }],
          rounds: [{ hint: 'Give the messenger the right letter in every city. The name is at the gate and on the roll.' }, { hint: 'Now seven letters go on the journey. There is no name at the gate any more: look at the seal and at the landmark of the city.' }]
        }
      },
      questions: [
        { q: 'What has the church in Ephesus left?', options: ['its first love', 'its big house', 'its old harbour'] },
        { q: 'What does the church in Philadelphia have before it?', options: ['an open door', 'a high wall', 'a deep ditch'] }
      ]
    },
    {
      title: 'I Stand at the Door',
      ref: 'Revelation 3:14–22',
      text: [
        'The last of the seven letters goes to the church in Laodicea. The people there say: “I am rich, and increased with goods, and have need of nothing.”',
        'But Jesus has them told: “You do not know that you are poor, and blind, and naked. I counsel you to buy of me gold, that you may be rich, and white clothes, that you may be clothed. And anoint your eyes, that you may see. Be zealous therefore, and repent!”',
        'Then he says: “Behold, I stand at the door, and knock. If any man hear my voice, and open the door, I will come in to him, and will eat with him, and he with me.”',
        '“To him that overcometh,” it goes on, “will I grant to sit with me on my throne.”'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['Behold, I stand at the ', ', and knock.'], words: ['door', 'wall', 'city'] },
            { hint: 'Now two words are missing.', parts: ['If any man hear my ', ', and ', ' the door, I will come in to him, and will eat with him, and he with me.'], words: ['voice', 'open', 'steps', 'shut'] }
          ]
        }
      },
      questions: [
        { q: 'What do the people in Laodicea say about themselves?', options: ['I am rich and need nothing.', 'We are tired and sick.', 'We are very hungry.'] },
        { q: 'What does Jesus do at the door?', options: ['He knocks.', 'He sits down.', 'He walks on.'] }
      ]
    },
    {
      title: 'The Rainbow Round the Throne',
      ref: 'Revelation 4',
      text: [
        'After this John sees a door opened in heaven. The first voice, loud like a trumpet, says to him: “Come up hither, and I will show you things which must be hereafter.”',
        'There in heaven John sees a throne, and one sits on the throne. He shines like the precious stones jasper and sardius. Round about the throne is a rainbow that shines like a green emerald. Before the throne there is something like a sea of glass, clear as crystal.',
        'Round about the throne stand twenty-four seats. On them sit twenty-four elders in white clothes, with crowns of gold on their heads. Four living creatures call out day and night: “Holy, holy, holy, Lord God Almighty, which was, and is, and is to come!”',
        'Then the twenty-four elders fall down and lay their crowns before the throne. “Thou art worthy, O Lord, to receive glory and honour and power,” they say, “for thou hast created all things.”'
      ],
      task: { hint: 'This stage is quiet and solemn. Listen well and answer the questions.' },
      questions: [
        { q: 'What shines round the throne like an emerald?', options: ['a rainbow', 'a big fire', 'a bright star'] },
        { q: 'What do the elders have on their heads?', options: ['crowns of gold', 'white cloths', 'green wreaths'] },
        { q: 'Where do the elders lay their crowns?', options: ['before the throne', 'under their seats', 'in a chest'] }
      ]
    },
    {
      title: 'The Lamb Is Worthy',
      ref: 'Revelation 5',
      text: [
        'In the right hand of him that sits on the throne John sees a book. It is written inside and on the back, and sealed with seven seals. A strong angel calls with a loud voice: “Who is worthy to open the book, and to loose the seals thereof?” But no one in heaven or on earth is able to open it. Then John weeps much.',
        'One of the elders says to him: “Weep not! Behold, the Lion of the tribe of Judah, the Root of David, has prevailed. He can open the book.”',
        'John looks. In the midst, between the throne and the elders, stands a Lamb as it had been slain. It comes and takes the book. Then the elders fall down before the Lamb and sing a new song: “Thou art worthy to take the book. For thou wast slain, and hast redeemed people to God out of every kindred, and tongue, and people, and nation.”',
        'Thousands upon thousands of angels call out: “Worthy is the Lamb to receive power, and riches, and wisdom, and strength, and honour, and glory, and blessing.” And everything that lives in heaven and on the earth and in the sea joins in.'
      ],
      task: {
        hint: 'Call heaven, earth and sea to praise, just as John hears it.',
        praise: {
          zones: [{ name: 'Heaven', place: 'in heaven' }, { name: 'The earth', place: 'on the earth' }, { name: 'The sea', place: 'in the sea' }],
          rounds: [{ hint: 'Call heaven, earth and sea to praise, just as John hears it.' }, { hint: 'Keep them all singing until the Amen comes.' }]
        }
      },
      questions: [
        { q: 'Why does John weep?', options: ['No one can open the book.', 'He is hungry and thirsty.', 'He has lost his pen.'] },
        { q: 'Who takes the book?', options: ['the Lamb', 'the angel', 'John'] }
      ]
    },
    {
      title: 'From All Nations',
      ref: 'Revelation 7:9–17',
      text: [
        'After this John sees a great multitude, which no man can number. The people come from all nations and kindreds and peoples and tongues. They stand before the throne and before the Lamb, in white robes, with palms in their hands.',
        'With a loud voice they cry: “Salvation to our God which sitteth upon the throne, and unto the Lamb!”',
        'One of the elders asks John: “What are these which are arrayed in white robes? And whence came they?” “Sir, thou knowest,” John answers. Then the elder says: “These are they which came out of great tribulation. Therefore are they before the throne of God, and serve him day and night.”',
        '“They shall hunger no more, neither thirst any more,” he goes on. “Neither shall the sun light on them, nor any heat. For the Lamb shall feed them, and shall lead them unto living fountains of waters. And God shall wipe away all tears from their eyes.”'
      ],
      task: {
        hint: 'Stroke calmly across the crowd and the palm branches rise like a wave.',
        palms: {
          rounds: [{ hint: 'Stroke calmly across the crowd and the palm branches rise like a wave.' }, { hint: 'Now there are three rows. The back ones are longer, so the wave goes a little slower there.' }]
        }
      },
      questions: [
        { q: 'What do the people have in their hands?', options: ['palm branches', 'torches', 'baskets'] },
        { q: 'What will God wipe away from their eyes?', options: ['all tears', 'the dust of the road', 'the sleep of the night'] }
      ]
    },
    {
      title: 'All Things New',
      ref: 'Revelation 21:1–7',
      text: [
        'At the very end John sees a new heaven and a new earth. The first heaven and the first earth have passed away, and there is no more sea.',
        'He sees the holy city, new Jerusalem, coming down from God out of heaven. It is prepared as a bride adorned for her husband.',
        'A great voice out of heaven says: “Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people. And God shall wipe away all tears from their eyes. And there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain. For the former things are passed away.”',
        'He that sits upon the throne says: “Behold, I make all things new!” And he says to John: “Write: for these words are true and faithful. I will give unto him that is athirst of the fountain of the water of life freely.”'
      ],
      task: { hint: 'Put the picture of the new earth together.' },
      questions: [
        { q: 'What does John see coming down out of heaven?', options: ['the holy city, new Jerusalem', 'a big golden chariot', 'an ark full of animals'] },
        { q: 'What will there be no more when God dwells with men?', options: ['death and sorrow', 'houses and gardens', 'songs and feasts'] }
      ]
    },
    {
      title: 'The City and the River',
      ref: 'Revelation 21:10–25; 22:1–5, 20',
      text: [
        'An angel carries John to a great and high mountain and shows him the city. It has a great and high wall with twelve gates, three on every side. Every gate is made of one single pearl. The foundations of the wall are garnished with precious stones, and the streets are pure gold, like transparent glass.',
        'John sees no temple in it. The city has no need of the sun or the moon, for the glory of God lightens it, and the Lamb is the light of it. Its gates shall not be shut at all by day: for there shall be no night there.',
        'Then the angel shows him a pure river of water of life, clear as crystal. It flows out of the throne of God and of the Lamb. In the midst of the street, and on either side of the river, stands the tree of life and bears fruit every month. The Bible tells of the tree of life right at the beginning: it stood in the midst of the garden of Eden.',
        'At the end of the book Jesus says: “Surely I come quickly.” And John writes: “Amen. Even so, come, Lord Jesus.”'
      ],
      task: {
        hint: 'Put three gates of pearl on every side of the wall.',
        gates: {
          sides: [{ word: 'East', part: 'On the east three gates', name: 'East side' }, { word: 'West', part: 'On the west three gates', name: 'West side' }, { word: 'North', part: 'On the north three gates', name: 'North side' }, { word: 'South', part: 'On the south three gates', name: 'South side' }],
          rounds: [{ hint: 'Put three gates of pearl on every side of the wall. First morning and evening, the sides across from each other.' }, { hint: 'Now come the two other sides: midnight and noon.' }]
        }
      },
      questions: [
        { q: 'What is every gate of the city made of?', options: ['one single pearl', 'dark wood', 'red clay'] },
        { q: 'What stands on either side of the river?', options: ['the tree of life', 'a tall tower', 'a wall of stone'] }
      ]
    }
  ],
  exam: [
    { q: 'On which island does John hear the great voice?', options: ['Patmos', 'Crete', 'Cyprus'] },
    { q: 'What does Jesus say to John when John falls down as if dead?', options: ['Fear not!', 'Go back home!', 'Get up quickly and run!'] },
    { q: 'Who stands at the door and knocks?', options: ['Jesus', 'Peter', 'John'] },
    { q: 'Who takes the book with the seven seals?', options: ['the Lamb', 'the angel', 'John'] },
    { q: 'What does he that sits upon the throne say?', options: ['Behold, I make all things new!', 'Behold, I build a house!', 'Behold, I go away!'] },
    { q: 'What does John answer when Jesus says: “Surely I come quickly”?', options: ['Amen. Even so, come, Lord Jesus.', 'I am going to sleep now.', 'I am sailing home to Ephesus.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
offenbarungEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/offenbarung/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
