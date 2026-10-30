/**
 * English texts of the adventure "Esther" (8 to 10 years): the same shape as `../ester.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Ahasuerus, Vashti, Shushan, Mordecai, Esther, Haman, Hegai, Hatach, Purim); the stories are retold in our own words. The book never names God, so no words of God and no prayer are added. The source as a readable file: D:/Claude/Abenteuer-Ester/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Ester/tools/bauen_ester.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const esterEn: TextOverlay<Journey> = {
  title: 'Esther',
  subtitle: 'The Queen Who Saves Her People',
  gift: { title: 'Queen Esther' },
  stages: [
    {
      title: 'The feast in Shushan',
      ref: 'Esther 1',
      text: [
        'Ahasuerus is king over a hundred and twenty-seven lands, from India to Ethiopia. In his palace in Shushan he gives a feast that lasts a hundred and eighty days. All the princes and servants are to see how rich he is.',
        'After that he invites all the people of Shushan to the garden of the palace for seven days. White, red and blue cloths hang between the marble pillars. The floor is made of green, white, yellow and black marble. The wine comes in golden cups, and every cup looks different.',
        'On the seventh day the king sends for Queen Vashti. She is to come wearing her crown, so that everyone can see how beautiful she is. But Vashti does not come. Then the king is angry, and on the advice of his princes she is never to stand before him again.'
      ],
      task: {
        hint: 'Decorate the festive garden just as the text says.',
        decor: {
          rounds: [
            { hint: 'Hang the cloths on the pillars: first white, then red, then blue, from left to right.' },
            { hint: 'Lay the floor: green, white, yellow and black, from left to right.' },
            { hint: 'Put the golden cups on the table. Every cup looks different.' }
          ]
        }
      },
      questions: [
        { q: 'How long does the king’s great feast for the princes last?', options: ['a hundred and eighty days', 'seven days', 'three days'] },
        { q: 'What colors are the cloths between the pillars?', options: ['white, red and blue', 'yellow and green', 'black and brown'] }
      ]
    },
    {
      title: 'Hadassah, who is called Esther',
      ref: 'Esther 2:1–11',
      text: [
        'The king is looking for a new queen. His servants bring young women from all over the land to the palace in Shushan. The woman the king likes best is to become queen in Vashti’s place.',
        'In Shushan lives a Jew named Mordecai. Long ago he was carried away from Jerusalem. He has taken in a girl who has neither father nor mother: Hadassah, who is also called Esther, the daughter of his uncle. She is beautiful and kind.',
        'Esther is brought to the palace too, to Hegai, who watches over the women. He likes her and gives her seven maids and the best place in the house. Esther tells no one which people she comes from, because Mordecai has told her not to. Every day he walks up and down in front of the court and wants to know how she is.'
      ],
      task: { hint: 'Put the picture of the palace gate together.' },
      questions: [
        { q: 'Who took Esther in?', options: ['Mordecai', 'the king', 'Hegai'] },
        { q: 'How many maids does Hegai give her?', options: ['seven', 'three', 'twelve'] }
      ]
    },
    {
      title: 'The new queen',
      ref: 'Esther 2:12–23',
      text: [
        'For a whole year every young woman is made ready for the king with ointments, sweet oils and spices. Then she may choose what she wants to take with her into the palace. Esther asks for nothing but what Hegai advises. Everyone who sees her likes her.',
        'The king loves Esther more than all the others. He sets the crown on her head and makes her queen. Then he gives a great feast for her and hands out rich gifts.',
        'Mordecai sits at the king’s gate. There he hears that two doorkeepers want to harm the king. He tells Esther, and Esther tells the king in Mordecai’s name. People look into it, and it is true. The two men are punished, and Mordecai’s help is written down in the king’s chronicle.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The ointment: for a year every woman is made ready with ointments and sweet oils.' }, { text: 'The spices: spices are part of it too.' }, { text: 'The crown: the king sets the crown on Esther’s head.' }, { text: 'The feast: the king gives a great feast for Esther.' }, { text: 'The gifts: the king gives rich gifts.' }, { text: 'The chronicle: Mordecai’s help is written in the king’s chronicle.' }] }
      },
      questions: [
        { q: 'What does the king set on Esther’s head?', options: ['the crown', 'a wreath', 'a veil'] },
        { q: 'Who hears at the gate that two doorkeepers want to harm the king?', options: ['Mordecai', 'Hegai', 'Esther'] }
      ]
    },
    {
      title: 'Haman’s plan',
      ref: 'Esther 3',
      text: [
        'The king makes a man named Haman the highest prince in the kingdom. All the servants at the gate bow down before him, as the king has commanded. Only Mordecai does not. He has told them that he is a Jew.',
        'Then Haman is seized with rage. To punish Mordecai alone is too little for him. He wants to destroy the whole people of the Jews, everywhere in the kingdom. He has the lot cast to choose a day for it.',
        'Then Haman goes to the king. "There is a people in your kingdom that has other laws," he says. "Give the order to destroy it." The king gives Haman his signet ring. Runners carry the letters to all the lands. The king and Haman sit down to drink, but the city of Shushan is full of fear.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What has the king commanded all the servants at the gate to do?', options: ['bow down before Haman', 'bring gifts to Haman', 'serve Haman'] },
        { q: 'Who does not bow down before Haman?', options: ['Mordecai', 'Hegai', 'Esther'] },
        { q: 'Who does the king give his signet ring to?', options: ['Haman', 'Mordecai', 'Esther'] }
      ]
    },
    {
      title: 'Who knows?',
      ref: 'Esther 4',
      text: [
        'When Mordecai hears about the order, he tears his clothes. He puts on sackcloth, throws ashes on his head and cries out loudly in the middle of the city. In all the lands many Jews weep and fast.',
        'Esther is frightened when her maids tell her. She sends Hatach to Mordecai to find out what has happened. Mordecai gives him a copy of the order. "Go to the king and plead for your people," he sends word to her.',
        'Esther answers: "Whoever goes to the king without being called must die. Only if the king holds out the golden scepter may he live. I have not been called for thirty days." Mordecai sends word: "Who knows whether you have not become queen for just such a time as this?" Then Esther says: "Fast for me for three days. Then I will go to the king."'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“And who ', ' whether you have not come to the kingdom for such a time as this?”'], words: ['knows', 'says', 'counts'] },
            { hint: 'Now two words are missing.', parts: ['“Fast for me, and neither eat nor drink ', ' days, ', ' or day.”'], words: ['three', 'night', 'ten', 'noon'] }
          ]
        }
      },
      questions: [
        { q: 'What does Mordecai do when he hears about the order?', options: ['He tears his clothes and puts on sackcloth.', 'He goes to the king.', 'He leaves the city.'] },
        { q: 'Whom does Esther send to Mordecai?', options: ['Hatach', 'Hegai', 'Haman'] }
      ]
    },
    {
      title: 'Before the king',
      ref: 'Esther 5',
      text: [
        'On the third day Esther puts on her royal clothes. She steps into the inner court of the palace. The king is sitting on his throne and sees her standing there. Then he holds out the golden scepter to her, and Esther touches its tip.',
        '"What is it, Queen Esther?" asks the king. "What do you want? Even half the kingdom shall be yours." Esther says only: "Let the king and Haman come today to the feast I have prepared."',
        'At the feast the king asks again. But Esther invites both of them to a second feast the next day. Haman goes home glad, but at the gate he sees Mordecai. He does not rise before him. So Haman has a tall pole put up for Mordecai.'
      ],
      task: {
        hint: 'Put the pictures in the order of the story.',
        order: {
          cards: [{ label: 'Esther puts on her royal clothes' }, { label: 'Esther steps into the inner court' }, { label: 'The king holds out the golden scepter' }, { label: 'Esther invites the king and Haman to a feast' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with the dressing and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does the king hold out to Esther?', options: ['the golden scepter', 'his crown', 'a letter'] },
        { q: 'Whom does Esther invite to the feast?', options: ['the king and Haman', 'Mordecai and Hegai', 'the king and Hatach'] }
      ]
    },
    {
      title: 'The sleepless night',
      ref: 'Esther 6',
      text: [
        'That night the king cannot sleep. He has the chronicle read to him. It says there that Mordecai saved him from the two doorkeepers. "What honor have we given him for it?" asks the king. "None," say his servants.',
        'Just then Haman is standing in the court, to ask the king about Mordecai’s punishment. The king has him called in. "What shall be done for the man the king wants to honor?" he asks. Haman thinks: Who could that be, if not me? "Let royal clothes be brought, a horse of the king and a crown," he says. "Let a prince lead him through the city and call out: This is what is done for the man the king wants to honor."',
        '"Do it at once," says the king, "for Mordecai the Jew at the gate." Haman obeys and leads Mordecai through the city himself. Afterwards he hurries home, his head covered.'
      ],
      task: {
        hint: 'Find what Haman names for the man the king wants to honor.',
        honor: {
          rounds: [
            { hint: 'Haman names the king’s clothes first. Tap the royal robe.', choices: [{ label: 'A plain brown woolen robe' }, { label: 'A green shepherd’s cloak' }, { label: 'The royal blue-and-white robe' }, { label: 'A gray sackcloth' }] },
            { hint: 'Then he names something for the head: the crown. Tap it.', choices: [{ label: 'A golden crown' }, { label: 'A straw hat' }, { label: 'A wreath of olive leaves' }, { label: 'A light head cloth' }] },
            { hint: 'Last he names an animal: the king’s horse. Tap it.', choices: [{ label: 'A gray donkey' }, { label: 'An ox' }, { label: 'A camel' }, { label: 'The king’s horse' }] }
          ]
        }
      },
      questions: [
        { q: 'What does the king have read to him in the sleepless night?', options: ['the chronicle', 'a letter', 'songs'] },
        { q: 'Whom does the king want to honor?', options: ['Mordecai', 'Haman', 'Hatach'] }
      ]
    },
    {
      title: 'The queen’s feast',
      ref: 'Esther 7',
      text: [
        'On the second day the king and Haman again sit at table with Esther. "What do you wish, Queen Esther?" asks the king. "Even half the kingdom shall be yours."',
        'Then Esther answers: "If I have found favor with you, O king, then give me my life and the life of my people. We have been sold to be destroyed." "Who dares to do this?" cries the king. Esther says: "The enemy is this wicked Haman." Haman is terrified.',
        'The king rises in anger and goes out into the garden. Haman begs Esther for his life. When the king comes back, his anger has not passed. They cover Haman’s face. The pole that Haman put up for Mordecai becomes his own. After that the king’s anger settles.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Esther ask the king for?', options: ['for her life and the life of her people', 'for gold', 'for a new house'] },
        { q: 'Whom does Esther call the enemy?', options: ['Haman', 'Hegai', 'Hatach'] },
        { q: 'Where does the king go when he grows angry?', options: ['into the garden', 'to the market', 'to the gate'] }
      ]
    },
    {
      title: 'Light and joy',
      ref: 'Esther 8–9',
      text: [
        'The king gives Esther the house of Haman. Mordecai comes before him and receives the signet ring. Esther falls at the king’s feet and begs him in tears. Then the king holds out the golden scepter. "How can I bear to see my people destroyed?" she asks.',
        'An order of the king cannot be taken back. So the scribes write a new letter, in the language of every people. The Jews may defend their lives. Riders on young mules carry it to all the lands.',
        'Mordecai leaves the king in blue and white clothes, with a golden crown and a purple cloak. Shushan rejoices. To the Jews there has come light and gladness and joy and honor. On the day when they were to be attacked, they stand up for their lives, and no one can withstand them. After that they keep the feast of Purim. They send one another gifts and share with the poor.'
      ],
      task: {
        hint: 'Find the six messengers who carry the letter to all the lands.',
        find: { labels: ['Messenger 1', 'Messenger 2', 'Messenger 3', 'Messenger 4', 'Messenger 5', 'Messenger 6'], doneText: 'You have found all six messengers who carry the letter to all the lands!' }
      },
      questions: [
        { q: 'Who carries the new letter to all the lands?', options: ['riders on mules', 'ships', 'carrier pigeons'] },
        { q: 'What does the king give Mordecai?', options: ['the signet ring', 'a sword', 'silver'] }
      ]
    }
  ],
  exam: [
    { q: 'From India to Ethiopia: how many lands is Ahasuerus king over?', options: ['a hundred and twenty-seven', 'seven', 'thirty'] },
    { q: 'What is Hadassah’s other name?', options: ['Esther', 'Vashti', 'Hegai'] },
    { q: 'What does the king set on Esther’s head?', options: ['the crown', 'a veil', 'a wreath'] },
    { q: 'How long are the Jews to fast for Esther?', options: ['three days', 'one day', 'twelve days'] },
    { q: 'What does the king hold out to Esther when she comes before him?', options: ['the golden scepter', 'his sword', 'a letter'] },
    { q: 'What is the feast called that the Jews keep?', options: ['Purim', 'Passover', 'the Feast of Booths'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
esterEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/ester/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
