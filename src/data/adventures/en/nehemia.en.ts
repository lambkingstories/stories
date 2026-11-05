/**
 * English texts of the adventure "Nehemiah" (8 to 10 years): the same shape as `../nehemia.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Nehemiah, Hanani, Artaxerxes, Shushan, Sanballat, Tobiah, Ezra); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Nehemia/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Nehemia/tools/bauen_nehemia.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const nehemiaEn: TextOverlay<Journey> = {
  title: 'Nehemiah',
  subtitle: 'The Wall of Jerusalem',
  gift: { title: 'The Wall of Jerusalem' },
  stages: [
    {
      title: 'The news from Jerusalem',
      ref: 'Nehemiah 1',
      text: [
        'Nehemiah lives in the fortress of Shushan. He is the cupbearer of King Artaxerxes and brings him his wine. One day his brother Hanani comes to visit with some men from Judah. "How are the Jews in Jerusalem?" asks Nehemiah.',
        '"Not well," say the men. "They live in great trouble. The walls of Jerusalem are broken down, and its gates are burned."',
        'Then Nehemiah sits down and weeps. For several days he mourns and eats nothing. He prays to God: "O Lord, God of heaven, let your ears listen to the prayer of your servant. Your people belong to you, you have redeemed them." Then he asks that the king may be kind to him.'
      ],
      task: { hint: 'Put the picture of the broken wall together.' },
      questions: [
        { q: 'What is Nehemiah at the court of King Artaxerxes?', options: ['the cupbearer', 'the cook', 'the guard'] },
        { q: 'Who comes with men from Judah to visit?', options: ['his brother Hanani', 'the king', 'Ezra'] }
      ]
    },
    {
      title: 'The sad cupbearer',
      ref: 'Nehemiah 2:1–8',
      text: [
        'Some months later wine stands before the king again. Nehemiah takes the cup and hands it to Artaxerxes. The king sees his face. "Why do you look so sad?" he asks. "You are not ill."',
        'Nehemiah is very frightened. "May the king live forever," he says. "How could I not be sad? The city where my fathers are buried lies in ruins, and its gates are burned." "What do you wish?" asks the king.',
        'Then Nehemiah prays to God. After that he asks: "Send me to Judah, so that I may build the city again." The queen sits beside the king. "How long will your journey be?" asks the king. He lets Nehemiah go and gives him letters for the governors and for Asaph, the keeper of the forest, who is to give timber for the gates. Horsemen ride with him.'
      ],
      task: {
        hint: 'Carry the full cup to the king without spilling any wine.',
        cupCarry: {
          walker: { label: 'Nehemiah with the cup' },
          cup: { label: 'The cup' },
          rounds: [
            { hint: 'Bring the cup to the king. Move your finger slowly ahead of Nehemiah, or the wine will slosh.', things: [{ label: 'Big jar' }, { label: 'Potted palm' }] },
            { hint: 'Now more things stand in the hall, and the cup is even fuller. Walk calmly around them.', things: [{ label: 'Potted palm' }, { label: 'Big jar' }, { label: 'Potted palm' }, { label: 'Big jar' }, { label: 'Big jar' }, { label: 'Potted palm' }] }
          ]
        }
      },
      questions: [
        { q: 'What does Nehemiah hand to the king?', options: ['a cup of wine', 'a loaf of bread', 'a letter'] },
        { q: 'What does Nehemiah ask the king for?', options: ['to be sent to Judah to build the city again', 'for a lot of gold', 'for a house in Shushan'] }
      ]
    },
    {
      title: 'Around the city by night',
      ref: 'Nehemiah 2:9–20',
      text: [
        'Nehemiah travels to Jerusalem and waits three days. Then he gets up by night with only a few men. He has told no one what God put into his heart. He rides on his animal out through the Valley Gate, to the Serpent Well and to the Dung Gate. Then he goes on to the Fountain Gate and the King’s Pool.',
        'There is no room there for his animal. Nehemiah goes up the brook in the dark. He sees the broken walls, and it hurts him. Then he returns through the Valley Gate.',
        'After that he calls the priests and the leaders together. "You see the trouble we are in," he says. "Come, let us build the wall!" They cry: "Let us rise up and build!"'
      ],
      task: {
        hint: 'Ride around the city by night, just as Nehemiah did.',
        ride: {
          spots: [{ label: 'Valley Gate' }, { label: 'Serpent Well' }, { label: 'Dung Gate' }, { label: 'Fountain Gate' }, { label: 'King’s Pool' }],
          rounds: [
            { hint: 'Ride to the places in the order of the text. The list above helps you.' },
            { hint: 'Once more, now without the list: Where does Nehemiah ride first, where next?' }
          ]
        }
      },
      questions: [
        { q: 'How long does Nehemiah wait after arriving before he rides out by night?', options: ['three days', 'one day', 'two weeks'] },
        { q: 'Why does Nehemiah’s animal not get any further?', options: ['There is no room.', 'It is tired.', 'It is thirsty.'] }
      ]
    },
    {
      title: 'Everyone builds a piece',
      ref: 'Nehemiah 3',
      text: [
        'Now many lend a hand. The high priest Eliashib and the priests build the Sheep Gate and put in its doors. Next to them the men of Jericho build. The sons of Hassenaah build the Fish Gate with doors, locks and bars.',
        'A goldsmith named Uzziel builds a piece of the wall, and next to him Hananiah, one of the perfume makers. A ruler of the city, Shallum, comes with his daughters and builds too. Many build exactly the piece that lies in front of their own house.',
        'So the wall grows around the city, piece by piece. Goldsmiths and merchants build too. At every gate other people are at work.'
      ],
      task: {
        hint: 'Find the builders: the priest, the goldsmith, the perfume maker and two of Shallum’s daughters.',
        find: { labels: ['Priest', 'Goldsmith', 'Perfume maker', 'Daughter of Shallum', 'Daughter of Shallum'], doneText: 'You have found all five builders: the priest, the goldsmith, the perfume maker and two of Shallum’s daughters!' }
      },
      questions: [
        { q: 'Who builds the Sheep Gate?', options: ['the priests', 'the men of Jericho', 'the sons of Hassenaah'] },
        { q: 'What is Uzziel’s trade?', options: ['goldsmith', 'carpenter', 'shepherd'] }
      ]
    },
    {
      title: 'Scorn and watch',
      ref: 'Nehemiah 4:1–14',
      text: [
        'When Sanballat hears that the Jews are building, he becomes angry and scorns them. "What are these feeble people doing?" he cries. "Do they think they can bring the stones back to life out of the rubble?" Tobiah says: "If a fox jumps on their wall, it will break down."',
        'Nehemiah hears it and prays. The people keep building, and soon the wall is already half as high as it should be. The people work with a will.',
        'Then Sanballat, Tobiah and their allies become very angry. They want to surprise the builders and stop the work. Nehemiah sets a watch day and night. Behind the wall stand families with spears and bows. "Do not be afraid of them!" he cries. "Remember the great Lord."'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who scorns the builders?', options: ['Sanballat and Tobiah', 'Ezra and Hanani', 'the king'] },
        { q: 'How high is the wall when the enemies become angry?', options: ['half as high as it should be', 'already finished', 'only one stone high'] },
        { q: 'What does Nehemiah call to the people?', options: ['"Do not be afraid of them!"', '"Run away!"', '"Stop building!"'] }
      ]
    },
    {
      title: 'The trumpet calls',
      ref: 'Nehemiah 4:15–23',
      text: [
        'When the enemies see that their plan is known, it comes to nothing. Everyone goes back to the wall and works on. From now on only half of the young men build while the other half keep watch with spears, shields and bows. Whoever carries stones has the load in one hand and the weapon in the other.',
        'The wall is long, and the people stand far from one another. So a man with a trumpet stands beside Nehemiah. "Where you hear the trumpet, gather to us there," says Nehemiah. "Our God will fight for us."',
        'So they work from early morning until the stars come out. At night all stay in Jerusalem, ready to keep watch.'
      ],
      task: {
        hint: 'Tap the builders: they run to the trumpet.',
        post: {
          rounds: [
            { hint: 'The trumpet calls! Tap the builders: they run to Nehemiah and the trumpeter.' },
            { hint: 'Now the trumpet stands at the left end of the wall. Call everyone to it.' },
            { hint: 'Last at the right end. Call everyone to the trumpet.' }
          ]
        }
      },
      questions: [
        { q: 'Who keeps watch and who builds?', options: ['One half builds, the other half keeps watch.', 'Everyone builds, no one keeps watch.', 'Only the priests build.'] },
        { q: 'Why does a man with a trumpet stand beside Nehemiah?', options: ['Whoever hears it is to gather there.', 'It calls them to dinner.', 'It calls them to sleep.'] }
      ]
    },
    {
      title: 'The debts are forgiven',
      ref: 'Nehemiah 5',
      text: [
        'One day a great cry rises among the people. Many families have nothing left to eat. They had to pledge their fields, vineyards and houses to buy grain. The leaders lent them money and demand interest on top.',
        'Nehemiah becomes very angry. "What you are doing is not good!" he says to the leaders. "We are brothers." He calls the whole people together, and the leaders fall silent.',
        '"I too have lent money," says Nehemiah. "Let us forgive this debt. Give them back their fields, vineyards, olive groves and houses today." "We will give everything back," say the leaders. They promise it before the priests. All the people cry "Amen!" and praise God.'
      ],
      task: {
        hint: 'Give every family its pledge back.',
        pledges: {
          chest: { label: 'The chest with the pledges' },
          families: [{ label: 'The family with the son' }, { label: 'The family with the baby' }, { label: 'The grandmother with her grandchildren' }, { label: 'The family with two daughters' }],
          slips: { acker: { label: 'The field' }, weinberg: { label: 'The vineyard' }, oelgarten: { label: 'The olive grove' }, haus: { label: 'The house' } },
          rounds: [
            { hint: 'Pull a pledge out of the chest and bring it to the family it belongs to. Above every family you see what it gave as a pledge.' },
            { hint: 'Now four families are waiting. Look closely: the vineyard and the olive grove look alike.' }
          ]
        }
      },
      questions: [
        { q: 'What must the families pledge to buy grain?', options: ['fields, vineyards and houses', 'sheep and donkeys', 'pots and carpets'] },
        { q: 'How does Nehemiah react to the need of the families?', options: ['He becomes angry and calls the people together.', 'He looks away.', 'He travels away.'] }
      ]
    },
    {
      title: 'The wall is finished',
      ref: 'Nehemiah 6',
      text: [
        'Sanballat, Tobiah and Geshem hear that the wall is finished and no gap is left. Only the doors are not yet hung in the gates. So Sanballat and Geshem send messengers to Nehemiah. "Come, let us meet in the plain of Ono," they say. They mean to harm him.',
        'Nehemiah answers: "I am doing a great work. I cannot come down." Four times they ask, four times he answers the same. Then a false letter comes, and a man tries to lure him into the temple to frighten him. "Should a man like me run away?" says Nehemiah. "I will not go in."',
        'After only fifty-two days the wall is finished. When the enemies hear it, their courage fails. They see: this work is from God.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where do the messengers invite Nehemiah to?', options: ['to the plain of Ono', 'to Shushan', 'to the King’s Pool'] },
        { q: 'What does Nehemiah answer four times?', options: ['"I am doing a great work."', '"I will come tomorrow."', '"I have no time to eat."'] },
        { q: 'How many days does it take to build the wall?', options: ['fifty-two days', 'seven days', 'a hundred days'] }
      ]
    },
    {
      title: 'The joy of the Lord',
      ref: 'Nehemiah 8',
      text: [
        'When the seventh month comes, all the people gather in the square before the Water Gate. Ezra the scribe stands on a high wooden platform and reads from the book of the Law, from early morning until noon. Everyone listens closely. The Levites explain it so that everyone understands.',
        'When the people hear the words, many weep. But Nehemiah and Ezra say: "This day is holy. Do not be sad! Go, eat and drink, and send some of it to those who have nothing. For the joy of the Lord is your strength."',
        'Then everyone goes home glad. The next day they read in the Law that they are to build huts. They fetch branches and make huts, on the roofs and in the courtyards. It is a great feast of joy.'
      ],
      task: {
        hint: 'Fetch branches of olive, myrtle and palm and build the booth on the roof.',
        booths: {
          walker: { label: 'The man with the basket' },
          trees: { oel: { label: 'Olive tree' }, myrte: { label: 'Myrtle' }, palme: { label: 'Palm tree' }, dorn: { label: 'Dry thorn bush' } },
          boughs: { oel: { label: 'olive branch', plural: 'Olive branches' }, myrte: { label: 'myrtle branch', plural: 'Myrtle branches' }, palme: { label: 'palm branch', plural: 'Palm branches' } },
          rounds: [
            { hint: 'Tap the trees: the man fetches branches. Then tap the house: he takes them up to the roof.' },
            { hint: 'Now the booth needs more branches. The dry thorn bush has no leaves.' }
          ]
        }
      },
      questions: [
        { q: 'Who reads to the people from the book of the Law?', options: ['Ezra', 'Hanani', 'Tobiah'] },
        { q: 'What are the people to send to those who have nothing?', options: ['some of the food and drink', 'their houses', 'their clothes'] }
      ]
    }
  ],
  exam: [
    { q: 'Who brings King Artaxerxes his wine?', options: ['Nehemiah', 'Ezra', 'Hanani'] },
    { q: 'What news does Hanani bring from Jerusalem?', options: ['The walls are broken down.', 'The city is rich.', 'The king is dead.'] },
    { q: 'How long does Nehemiah wait in Jerusalem before he rides out by night?', options: ['three days', 'a week', 'a month'] },
    { q: 'Who builds on the wall with his daughters?', options: ['Shallum', 'Uzziel', 'Tobiah'] },
    { q: 'What are the people to do when they hear the trumpet?', options: ['gather there', 'go home', 'sleep'] },
    { q: 'What is the strength of the people, says Nehemiah?', options: ['the joy of the Lord', 'the high wall', 'lots of gold'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
nehemiaEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/nehemia/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
