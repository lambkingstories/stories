/**
 * English texts of the adventure "Samson" (7 to 10 years): the same shape as `../simson.ts`, only the words. Laid over the German data by `localize()`; the right answer is the first option,
 * exactly as in the German data. Names and wording follow the public-domain King James Version (Judges 13 to 16); the stories are retold in our own words.
 * The source as a readable file: D:/Claude/Abenteuer-Simson/ENGLISCH. Generated from the readable file by D:/Claude/Abenteuer-Simson/tools/bauen_simson.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const simsonEn: TextOverlay<Journey> = {
  title: 'Samson',
  subtitle: 'From the angel in Zorah to the house in Gaza',
  gift: { title: 'Honey in the Vineyard' },
  stages: [
    {
      title: 'The Angel Comes',
      ref: 'Judges 13:1–5',
      text: [
        'The Israelites do evil in the sight of the LORD. So the LORD gives them into the hand of the Philistines for forty years.',
        'In Zorah lives a man named Manoah. He belongs to the tribe of Dan. His wife has no children.',
        'One day the angel of the LORD appears to the woman. “Until now you have no children,” he says. “But you will have a son.”',
        '“Take care,” says the angel. “Drink no wine and no strong drink, and eat nothing unclean.”',
        '“No razor may ever touch your son’s head. He belongs to God from the womb. He will begin to save Israel from the hand of the Philistines.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What is the name of the man who lives in Zorah?', options: ['Manoah', 'Gideon', 'Barak'] },
        { q: 'To whom does the angel of the LORD appear?', options: ['to the woman', 'to a shepherd', 'to the Philistines'] },
        { q: 'What may never touch her son’s head?', options: ['a razor', 'a crown', 'a wreath'] }
      ]
    },
    {
      title: 'Manoah Asks',
      ref: 'Judges 13:6–14',
      text: [
        'The woman tells her husband Manoah. “A man of God came to me,” she says. “He looked like an angel of God.”',
        'Then Manoah prays: “O LORD, please let the man of God come to us again. Let him teach us what we shall do for the boy.”',
        'God listens to Manoah. The angel comes again to the woman as she sits in the field. Manoah is not with her, and she runs and fetches him.',
        '“Are you the man who spoke to my wife?” asks Manoah. “I am,” says the angel. “When what you have said comes true,” asks Manoah, “how shall the boy live, and what shall he do?”',
        '“She must not eat anything that comes from the vine,” says the angel. “She must not drink wine or strong drink, and she must not eat anything unclean. All that I have commanded her, she must keep.”'
      ],
      task: {
        hint: 'Put into the basket what the woman may eat and drink. Put the rest aside.',
        avoid: {
          items: [{ label: 'a jug of water' }, { label: 'a jug of milk' }, { label: 'a cup of wine' }, { label: 'a jug of strong drink' }, { label: 'a flatbread' }, { label: 'figs' }, { label: 'a bowl of olives' }, { label: 'grapes' }, { label: 'a bowl of raisins' }, { label: 'a jug of grape juice' }],
          rounds: [{ hint: 'What may the woman drink? The angel forbade wine and strong drink.' }, { hint: 'What may the woman eat? She must avoid everything that comes from the vine.' }]
        }
      },
      questions: [
        { q: 'Where is the woman sitting when the angel comes to her again?', options: ['in the field', 'in the house', 'at the well'] },
        { q: 'What does Manoah pray for?', options: ['That the man of God may come once more.', 'That the Philistines may go away.', 'That it may rain.'] }
      ]
    },
    {
      title: 'On the Rock',
      ref: 'Judges 13:15–23',
      text: [
        '“Please stay,” says Manoah to the angel. “We want to prepare a young goat for you.” “I will not eat of your food,” answers the angel. “But if you want to bring a burnt offering to the LORD, then do it.” Manoah does not know that it is the angel of the LORD.',
        '“What is your name?” asks Manoah. “We want to honor you when what you have said comes true.” “Why do you ask my name?” says the angel. “It is wonderful.”',
        'Manoah offers a young goat on a rock. The flame goes up from the altar toward heaven, and the angel of the LORD goes up in the flame. Manoah and his wife fall with their faces to the ground.',
        'The angel does not appear to them again. Then Manoah knows that it was the angel of the LORD. “We shall die,” he says, “for we have seen God.” “If the LORD wanted to kill us,” answers his wife, “he would not have accepted our offering.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What does the angel say to Manoah when he asks his name?', options: ['It is wonderful.', 'It is a king’s name.', 'It is a shepherd’s name.'] },
        { q: 'Where does Manoah offer the young goat?', options: ['on a rock', 'on the roof', 'by the brook'] },
        { q: 'What does the woman say to Manoah?', options: ['The LORD has accepted our offering.', 'The angel will come again tomorrow.', 'We are going to Gaza.'] }
      ]
    },
    {
      title: 'Samson and the Lion',
      ref: 'Judges 13:24–25; 14:5–9',
      text: [
        'The woman has a son and calls him Samson. The boy grows, and the LORD blesses him. The Spirit of the LORD begins to move him in the camp of Dan, between Zorah and Eshtaol.',
        'Later Samson goes down to Timnah with his father and his mother. At the vineyards a young lion comes roaring toward him. The Spirit of the LORD comes upon Samson, and he overcomes the lion. He has nothing in his hand. He does not tell his father and his mother what he has done.',
        'After some days Samson comes along the same road again. He steps aside to look at the dead lion. In the lion there is a swarm of bees, and there is honey. Samson takes the honey in his hands and eats as he walks. He gives some to his father and his mother, too. Where he got the honey, he does not tell them.'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['And the child grew, and the LORD ', ' him.'], words: ['blessed', 'forgot', 'chased'] },
            { hint: 'Now two words are missing.', parts: ['And the ', ' grew, and the LORD ', ' him.'], words: ['child', 'blessed', 'lion', 'forgot'] }
          ]
        }
      },
      questions: [
        { q: 'Where do Samson and his parents go?', options: ['to Timnah', 'to Gaza', 'to Hebron'] },
        { q: 'Who does not hear where the honey came from?', options: ['his father and his mother', 'his brothers', 'the Philistines'] }
      ]
    },
    {
      title: 'The Riddle',
      ref: 'Judges 14:10–14, 18a',
      text: [
        'In Timnah Samson gives a feast, as the young men there do. It is to last seven days. He says to the guests: “I will give you a riddle. You have seven days to guess it.”',
        '“Tell us your riddle,” they say. “We want to hear it.”',
        'Samson says: “Out of the eater came food, and out of the strong came sweetness.”',
        'For three days the guests try to guess, and they cannot find the answer.',
        'On the seventh day, before the sun goes down, the men of the city say to Samson: “What is sweeter than honey? What is stronger than a lion?”',
        'They did not find the answer themselves. Someone had told them.'
      ],
      task: {
        hint: 'Lay the cards in a row: the sweetest and the strongest go to the very top.',
        riddle: {
          rounds: [{ hint: 'What is the sweetest? Put it at the very top.', ladderLabel: 'the sweetest', cards: [{ label: 'Bread' }, { label: 'Grapes' }, { label: 'Honey' }] }, { hint: 'Who is the strongest? Put him at the very top.', ladderLabel: 'the strongest', cards: [{ label: 'Hare' }, { label: 'Sheep' }, { label: 'Donkey' }, { label: 'Lion' }] }]
        }
      },
      questions: [
        { q: 'For how many days do the guests try to guess without finding the answer?', options: ['three days', 'one day', 'ten days'] },
        { q: 'When do the men of the city come to Samson?', options: ['on the seventh day, before the sun goes down', 'on the first morning', 'in the middle of the night'] }
      ]
    },
    {
      title: 'Water from the Hollow',
      ref: 'Judges 15:18–19',
      text: [
        'The Philistines come to Lehi to capture Samson. Then the Spirit of the LORD comes upon him, and the LORD gives him a great victory over the Philistines. After that he is very thirsty.',
        'He calls on the LORD: “You have given such a great rescue by the hand of your servant. Now I must die of thirst and fall into the hands of the Philistines.”',
        'Then God splits open a hollow place in Lehi, and water comes out. Samson drinks. His spirit comes back, and he is refreshed.',
        'That is why the spring is still called “the Well of the Caller” today.'
      ],
      task: {
        hint: 'Color the spring in the cave.',
        jobs: [{ hint: 'Colour the sky blue.' }, { hint: 'Colour the pond blue.' }, { hint: 'Colour the rocks brown.' }, { hint: 'Colour the grass green.' }, { hint: 'Colour the tree green.' }, { hint: 'Colour the flowers with the felt pen.' }, { hint: 'Colour the clouds with chalk.' }, { hint: 'Paint the water of the spring with watercolour.' }]
      },
      questions: [
        { q: 'Where does God split open the hollow place?', options: ['in Lehi', 'in Gaza', 'in Zorah'] },
        { q: 'What does Samson do when he is so thirsty?', options: ['He calls on the LORD.', 'He looks for honey.', 'He goes home.'] }
      ]
    },
    {
      title: 'The Gate of Gaza',
      ref: 'Judges 16:1–3',
      text: [
        'Samson goes to Gaza, a city of the Philistines.',
        'The men of Gaza are told: “Samson has come into the city.” They lie in wait for him all night at the city gate. They keep quiet and say: “Wait until morning.”',
        'But Samson lies there until midnight. Then he gets up and takes hold of both doors of the city gate, with the two posts. He lifts them out, bar and all, and puts them on his shoulders.',
        'He carries them up to the top of the hill in front of Hebron.'
      ],
      task: {
        hint: 'Lift out the gate. What still holds cannot be lifted.',
        gateLift: {
          rounds: [{ hint: 'Lift out the parts of the gate. What still holds cannot be lifted.', parts: [{ label: 'The bar' }, { label: 'The left door' }, { label: 'The right door' }] }, { hint: 'The big gate: lift out all the parts, one after the other.', parts: [{ label: 'The bar' }, { label: 'The left door' }, { label: 'The right door' }, { label: 'The left post' }, { label: 'The right post' }] }]
        }
      },
      questions: [
        { q: 'When does Samson get up?', options: ['at midnight', 'in the morning', 'in the evening'] },
        { q: 'Where does Samson carry the doors?', options: ['to the top of the hill in front of Hebron', 'to the valley of Sorek', 'to Zorah'] }
      ]
    },
    {
      title: 'Delilah Asks',
      ref: 'Judges 16:4–14',
      text: [
        'In the valley of Sorek lives a woman named Delilah. Samson loves her.',
        'The lords of the Philistines come to her. “Persuade him,” they say. “Find out where his great strength comes from and how we can bind him. Then each of us will give you eleven hundred pieces of silver.”',
        'Delilah asks Samson: “Tell me, where does your great strength come from? How can you be bound?” Samson says: “With seven fresh cords of green bark.” She binds him with them and calls: “The Philistines are coming, Samson!” He snaps the cords like a thread.',
        'Twice more she asks him, and twice he says something different. Both times she calls: “The Philistines are coming, Samson!” And both times he is free.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Where does Delilah live?', options: ['in the valley of Sorek', 'in Gaza', 'in Timnah'] },
        { q: 'What will Delilah get from each lord if she finds the secret?', options: ['eleven hundred pieces of silver', 'a donkey', 'a sheep'] },
        { q: 'What does Delilah call each time she has bound Samson?', options: ['The Philistines are coming, Samson!', 'Run away, Samson!', 'Eat with us, Samson!'] }
      ]
    },
    {
      title: 'The Secret',
      ref: 'Judges 16:15–20',
      text: [
        '“How can you say you love me?” says Delilah. “Three times you have deceived me.” She asks him every day until he cannot bear it any more. Then he tells her everything: “No razor has ever touched my head. I belong to God from my mother’s womb. If my hair is cut off, my strength will be gone.”',
        'Delilah lets him fall asleep on her lap. She calls a man who cuts off his seven locks. Then she calls: “The Philistines are coming, Samson!” Samson wakes up and thinks: I will shake myself free, as I have done many times. He does not know that the LORD has left him.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'How many times has Samson deceived Delilah so far?', options: ['three times', 'once', 'seven times'] },
        { q: 'To whom does Samson belong from his mother’s womb?', options: ['to God', 'to the Philistines', 'to Delilah'] },
        { q: 'What does Samson not know when he wakes up?', options: ['that the LORD has left him', 'that Delilah has gone away', 'that it is already evening'] }
      ]
    },
    {
      title: 'In Gaza',
      ref: 'Judges 16:21–27',
      text: [
        'The Philistines seize Samson. They bind him with two chains of bronze and bring him to Gaza. There he has to grind grain in the prison. But his hair begins to grow again.',
        'The lords of the Philistines hold a great feast for their god Dagon. “Fetch Samson,” they shout. “Let him perform for us!” A boy leads Samson by the hand between the pillars of the great house. The house is full. Many people are on the roof, too.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'With what do the Philistines bind Samson?', options: ['with two chains of bronze', 'with seven cords', 'with a rope'] },
        { q: 'What does Samson have to do in the prison?', options: ['grind grain', 'carry stones', 'fetch water'] },
        { q: 'Who leads Samson by the hand between the pillars?', options: ['a boy', 'Delilah', 'a lord'] }
      ]
    },
    {
      title: 'The House',
      ref: 'Judges 16:25b–31',
      text: [
        '“Let me feel the pillars that the house stands on,” says Samson to the boy. “I want to lean on them.”',
        'Samson calls to the LORD: “O LORD, remember me. Give me strength once more, O God, just this one time.” Then he takes hold of the two middle pillars, one with his right hand and the other with his left, and leans against them. The house falls down. Samson dies, too.',
        'His brothers and all his family come, carry him up, and bury him in the grave of his father Manoah. For twenty years he was a judge in Israel.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does Samson ask the LORD for?', options: ['for strength once more', 'for water', 'for a feast'] },
        { q: 'Where is Samson buried?', options: ['in the grave of his father Manoah', 'in the valley of Sorek', 'in Gaza'] },
        { q: 'For how long was Samson a judge in Israel?', options: ['twenty years', 'forty years', 'seven years'] }
      ]
    }
  ],
  exam: [
    { q: 'To whom does the angel of the LORD appear?', options: ['to the woman', 'to a shepherd', 'to the Philistines'] },
    { q: 'Where does Manoah offer the young goat?', options: ['on a rock', 'on the roof', 'by the brook'] },
    { q: 'Where do Samson and his parents go?', options: ['to Timnah', 'to Gaza', 'to Hebron'] },
    { q: 'Where does Samson carry the doors of the city gate?', options: ['to the top of the hill in front of Hebron', 'to the valley of Sorek', 'to Zorah'] },
    { q: 'To whom does Samson belong from his mother’s womb?', options: ['to God', 'to the Philistines', 'to Delilah'] },
    { q: 'Where is Samson buried?', options: ['in the grave of his father Manoah', 'in the valley of Sorek', 'in Gaza'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-vK.mp3 (K = version); a stage without a number in this list is read with the voice of the device
const ENGLISH_RECORDING_VERSION: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 8, 9: 2, 10: 2, 11: 2 }
simsonEn.stages!.forEach((s, i) => {
  const version = ENGLISH_RECORDING_VERSION[i + 1]
  if (version) s.audio = `audio/abenteuer/simson/geschichte-${String(i + 1).padStart(2, '0')}-en-v${version}.mp3`
})
