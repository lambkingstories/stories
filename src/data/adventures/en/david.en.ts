/**
 * English texts of the adventure "David" (8 to 10 years): the same shape as `../david.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Jesse, Eliab, Samuel, Saul, Goliath, Jonathan, Abigail, Nabal, Engedi, Ziklag, Gilboa, Hebron, Jerusalem, Zion, Obed-edom, Nathan); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-David/ENGLISCH/David_English_Texte.md.
 * Generated from the readable file by D:/Claude/Abenteuer-David/tools/bauen_david.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const davidEn: TextOverlay<Journey> = {
  title: 'David',
  subtitle: 'The Shepherd Boy Becomes King',
  gift: { title: 'David and the Harp' },
  stages: [
    {
      title: 'The Youngest in the Pasture',
      ref: '1 Samuel 16:1–13',
      text: [
        'God sends Samuel to Bethlehem. “Fill your horn with oil,” he says. “Among the sons of Jesse I have chosen a king.” Samuel is afraid of Saul, but he goes, and the elders of the town ask him, “Do you come in peace?”',
        'Jesse calls his sons. The first is Eliab, tall and strong. “This must be the one,” thinks Samuel. But God says, “Do not look at his looks. A man looks at what is in front of his eyes, but God looks at the heart.” Seven sons walk past Samuel, and God has chosen none of them.',
        '“Are these all your sons?” asks Samuel. “The youngest is missing,” says Jesse. “He is looking after the sheep.” “Send for him! We will not sit down until he comes.” David comes, ruddy, with beautiful eyes. “Get up,” says God, “and anoint him! He is the one.” Then Samuel takes the horn and anoints David in the middle of his brothers.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“God looks at the ', '.”'], words: ['heart', 'hair', 'robe'] },
            { hint: 'Now two words are missing.', parts: ['“A man looks at what is in front of his ', ', but God looks at the ', '.”'], words: ['eyes', 'heart', 'robe', 'hair'] }
          ]
        }
      },
      questions: [
        { q: 'Where does God send Samuel?', options: ['to Bethlehem', 'to Shiloh', 'to Jericho'] },
        { q: 'What is David doing when Samuel asks about the sons?', options: ['He is looking after the sheep.', 'He is sleeping at home.', 'He is fighting in the army.'] },
        { q: 'What does Samuel do with the horn?', options: ['He anoints David.', 'He drinks from it.', 'He gives it away.'] }
      ]
    },
    {
      title: 'The Harp for Saul',
      ref: '1 Samuel 16:14–23',
      text: [
        'Saul is restless and sad, because God’s Spirit has left him. “Find a man who plays the harp well,” his servants say. “When the restlessness comes over you, he will play for you, and you will feel better.”',
        '“I know one,” says one of them. “A son of Jesse in Bethlehem. He plays well, he is brave and wise in what he says, and God is with him.” So Saul sends word to Jesse: “Send me your son David, who is with the sheep.”',
        'Jesse loads a donkey with bread, a skin of wine and a young goat, and sends David with them to Saul. David stays with him. Saul loves him very much, and David carries his weapons. When the restlessness comes over Saul, David takes the harp and plays. Then Saul grows calm, and he feels better.'
      ],
      task: {
        hint: 'Stroke slowly over the strings, and Saul will grow calm.',
        harp: { rounds: [{ hint: 'Stroke slowly over the strings, like David. Then Saul grows calm.' }, { hint: 'Now Saul is more restless. Play even more calmly.' }] }
      },
      questions: [
        { q: 'What is David to play for Saul?', options: ['the harp', 'the flute', 'the drum'] },
        { q: 'What does Jesse send with David to Saul?', options: ['bread, wine and a young goat', 'a sword and a shield', 'gold and silver'] },
        { q: 'What happens when David plays?', options: ['Saul grows calm.', 'Saul grows angry.', 'Saul falls asleep.'] }
      ]
    },
    {
      title: 'Bread for the Brothers',
      ref: '1 Samuel 17:1–30',
      text: [
        'The Philistines and the army of Israel stand on two mountains, and a valley lies between them. Every morning and every evening Goliath steps forward, a giant, six cubits and a span tall, with a helmet, armor and a spear like a weaver’s beam. “Send me a man to fight!” he shouts. For forty days Saul and all Israel are very afraid.',
        'David’s three oldest brothers are with the army. Jesse gives David roasted grain, ten loaves and ten cheeses for them. David leaves the sheep with a keeper and sets out early. As he greets his brothers, Goliath steps forward again, and David hears him.',
        '“Who is this Philistine, that he mocks the army of the living God?” asks David. His oldest brother Eliab grows angry: “Why are you here? Who did you leave the sheep with?” But David keeps asking. The men tell Saul, and Saul sends for David.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How tall is Goliath?', options: ['six cubits and a span', 'as tall as a man', 'as small as a child'] },
        { q: 'What does David bring to his brothers?', options: ['roasted grain, loaves and cheeses', 'weapons and shields', 'wine and meat'] },
        { q: 'What does David ask?', options: ['Who is this Philistine, that he mocks the army of the living God?', 'How much gold do I get?', 'When is it time to eat?'] }
      ]
    },
    {
      title: 'The Armor Is Too Heavy',
      ref: '1 Samuel 17:31–39',
      text: [
        '“Let nobody lose heart,” David says to Saul. “Your servant will go and fight the Philistine.” “You cannot do that,” says Saul. “You are only a boy, and he has been a warrior since his youth.”',
        '“I look after my father’s sheep,” says David. “When a lion or a bear took a lamb from the flock, I ran after it and rescued it from its mouth. God saved me from the lion and the bear, and he will save me from this Philistine too.” “Go,” says Saul, “and God be with you.”',
        'Saul gives David his helmet, his armor and his sword. David tries to walk, but he has never worn armor. “I cannot walk like this,” he says. “I am not used to it.” He takes it all off again.'
      ],
      task: {
        hint: 'Stand David between the animal and the lamb.',
        shepherd: {
          rounds: [
            { hint: 'A lion wants to take a lamb. Stand David between the animal and the lamb.' },
            { hint: 'Now two animals come from both sides. Protect both lambs.' }
          ]
        }
      },
      questions: [
        { q: 'What does David tell about his flock?', options: ['A lion and a bear took a lamb, and he rescued it.', 'A wolf guarded the flock.', 'All the sheep ran away.'] },
        { q: 'Who gives David the armor?', options: ['Saul', 'Goliath', 'Jesse'] },
        { q: 'Why does David take the armor off?', options: ['He is not used to it.', 'It is too small.', 'It is broken.'] }
      ]
    },
    {
      title: 'Five Smooth Stones',
      ref: '1 Samuel 17:40–47',
      text: [
        'David takes his shepherd’s staff. At the brook he picks five smooth stones and puts them into his shepherd’s bag. In his other hand he holds the sling. So he walks toward the Philistine.',
        'Goliath comes closer, and his shield-bearer walks in front of him. He looks at David and laughs at him, for David is only a boy, ruddy and handsome. “Am I a dog, that you come to me with a stick?” he shouts.',
        'David stays calm. “You come to me with sword, spear and shield,” he says. “But I come in the name of the Lord, the God of Israel’s army, which you have mocked. The Lord does not save with sword and spear. The battle belongs to him.”'
      ],
      task: {
        hint: 'Tap the smooth stones.',
        pebbles: { rounds: [{ hint: 'David needs smooth stones. Tap three smooth stones.' }, { hint: 'Now five smooth stones, like David. The rough ones stay.' }] }
      },
      questions: [
        { q: 'How many stones does David pick from the brook?', options: ['five', 'two', 'ten'] },
        { q: 'Where does David put the stones?', options: ['into his shepherd’s bag', 'into his belt', 'into a basket'] },
        { q: 'What does David bring to Goliath?', options: ['a staff and a sling', 'sword and spear', 'bow and arrow'] }
      ]
    },
    {
      title: 'David and Goliath',
      ref: '1 Samuel 17:48–54',
      text: [
        'Goliath comes closer and closer. But David runs toward him. He reaches into his bag, takes a stone and puts it into the sling. He swings it and lets the stone fly.',
        'The stone hits Goliath on the forehead, and the giant falls to the ground. So David defeats the Philistine with a sling and a stone, and he has no sword in his hand.',
        'When the Philistines see that their strongest man is on the ground, they run away. The men of Israel and Judah shout for joy. The battle belongs to God, just as David said.'
      ],
      task: {
        hint: 'Tap when the stone points at Goliath.',
        sling: { rounds: [{ hint: 'David swings the sling. Tap when the stone points at Goliath.' }, { hint: 'Now Goliath stands nearer and the stone turns faster. Aim carefully.' }] }
      },
      questions: [
        { q: 'What does David defeat Goliath with?', options: ['a sling and a stone', 'a sword', 'a spear'] },
        { q: 'What do the Philistines do when Goliath is on the ground?', options: ['They run away.', 'They attack.', 'They stand still.'] },
        { q: 'Who helps Israel?', options: ['God', 'the shield-bearer', 'the king alone'] }
      ]
    },
    {
      title: 'Jonathan and David',
      ref: '1 Samuel 18:1–5',
      text: [
        'When David has finished speaking with Saul, the heart of Saul’s son Jonathan is bound to David’s heart. He loves David as his own life.',
        'Jonathan and David make a covenant with each other. As a sign, Jonathan takes off the robe he is wearing and gives it to David, with his cloak, his sword, his bow and his belt.',
        'Saul takes David into his house and does not let him go home again. David goes wherever Saul sends him, and he acts wisely. Saul puts him over his soldiers. All the people like David, and so do Saul’s servants.'
      ],
      task: {
        hint: 'Find the matching cards. Remember where each one lies.',
        memory: { pairs: [{ text: 'The robe: Jonathan takes it off and gives it to David.' }, { text: 'The cloak: Jonathan puts it around David’s shoulders.' }, { text: 'The sword: Jonathan gives it to David.' }, { text: 'The bow: Jonathan gives his friend this too.' }, { text: 'The belt: the last gift, a sign of the covenant.' }] }
      },
      questions: [
        { q: 'Who is Jonathan?', options: ['Saul’s son', 'David’s brother', 'a shepherd'] },
        { q: 'What does Jonathan give David?', options: ['his robe, cloak, sword, bow and belt', 'a horse', 'a house'] },
        { q: 'What do Jonathan and David make with each other?', options: ['a covenant', 'a race', 'a feast'] }
      ]
    },
    {
      title: 'Saul Becomes Jealous',
      ref: '1 Samuel 18:6–16',
      text: [
        'When David comes home from the victory, women from all the towns go out to meet the king. They sing and dance with tambourines and shouts of joy. “Saul has slain his thousands,” they sing, “but David his ten thousands.”',
        'Then Saul grows very angry. “They give David ten thousands and me only thousands,” he thinks. “All he lacks now is the kingdom.” From that day on he looks at David with dark eyes.',
        'The next day the restlessness comes over Saul again. David plays the harp as every day, but Saul throws a spear at him. David dodges, twice. Saul is afraid of David, for God is with David and no longer with him. He sends David away and puts him over a thousand men. All Israel loves David.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do the women sing?', options: ['Saul has slain his thousands, but David his ten thousands.', 'David is the king.', 'Saul is the strongest.'] },
        { q: 'How does Saul look at David from that day on?', options: ['darkly', 'kindly', 'not at all'] },
        { q: 'Why is Saul afraid of David?', options: ['God is with David.', 'David is taller than he is.', 'David has a sword.'] }
      ]
    },
    {
      title: 'The Sign of the Arrows',
      ref: '1 Samuel 20',
      text: [
        'David flees to Jonathan. “What have I done?” he asks. “Your father wants to kill me.” “I will do for you whatever you want,” says Jonathan. They make a plan: David hides in the field, and Jonathan sends a boy to fetch the arrows he shoots. If an arrow lies behind the boy, David may come back. If it lies farther on, David must flee.',
        'On the third day Jonathan goes into the field with a little boy. “Run and find the arrows I shoot!” he says, and he shoots an arrow over the boy’s head. “The arrow is farther on!” he calls. The boy understands nothing of it and brings the arrows back.',
        'Jonathan sends him back to the town with the bow. Then David comes out from behind the stone. The friends weep, and Jonathan says, “Go in peace. God is between us, forever.”'
      ],
      task: {
        hint: 'Pull the string so that the arrow lands in the marked stretch.',
        arrow: {
          rounds: [
            { hint: 'Jonathan sends the sign of peace: the arrow must land behind the boy.' },
            { hint: 'Now the sign to flee: the arrow must land before the boy, farther away.' }
          ]
        }
      },
      questions: [
        { q: 'Where does Jonathan go with the boy?', options: ['into the field', 'into the town', 'into the desert'] },
        { q: 'What does the arrow that lies farther on mean?', options: ['David must flee.', 'David may come back.', 'Dinner is ready.'] },
        { q: 'Where does David hide?', options: ['behind a stone', 'in a tent', 'in a house'] }
      ]
    },
    {
      title: 'In the Cave',
      ref: '1 Samuel 24',
      text: [
        'Saul goes into the desert near Engedi with three thousand men and looks for David. By the road there is a cave, and Saul goes in. David and his men are sitting at the back in the dark.',
        '“This is the day God spoke about!” David’s men whisper. “Do with him what you want.” David stands up and quietly cuts off a corner of Saul’s robe. A moment later his heart pounds. “God forbid that I do this,” he says to his men. “Saul is the king God has anointed. I will not lay a hand on him.”',
        'When Saul leaves the cave, David calls after him, “My lord the king!” He bows and holds up the corner. “Look, I could have harmed you. But I did not.” Then Saul weeps. “You are better than I,” he says. “You have done good to me, and I have done evil to you.”'
      ],
      task: {
        hint: 'Follow the seam with your finger, very quietly.',
        hem: { rounds: [{ hint: 'Follow the seam with your finger, very quietly.' }, { hint: 'Once more: the seam is curved. Stay on the track.' }] }
      },
      questions: [
        { q: 'Where are David and his men?', options: ['in a cave', 'in a city', 'on a ship'] },
        { q: 'What does David cut off?', options: ['a corner of Saul’s robe', 'Saul’s beard', 'Saul’s sword'] },
        { q: 'What does Saul do when David shows him the corner?', options: ['He weeps.', 'He laughs.', 'He attacks.'] }
      ]
    },
    {
      title: 'Abigail Brings Bread',
      ref: '1 Samuel 25',
      text: [
        'Samuel has died, and all Israel mourns for him. David lives in the desert with his men. A rich man named Nabal has three thousand sheep there. He is hard, but his wife Abigail is wise and kind.',
        'David asks Nabal for something to eat, because his men have protected Nabal’s shepherds. “Who is David?” says Nabal, and he sends the messengers away. David grows angry and sets out with four hundred men.',
        'A servant tells Abigail. She quickly loads two hundred loaves, two skins of wine, sheep, flour, raisin cakes and fig cakes onto donkeys and rides to meet David. She bows before him. “Listen to me,” she says. “God has kept you from taking justice into your own hands.” “Blessed be God, who sent you to me,” says David. “Go in peace.”'
      ],
      task: {
        hint: 'Put the pictures in the order of the story.',
        order: {
          cards: [{ label: 'Nabal sends the messengers away' }, { label: 'Abigail loads the donkeys' }, { label: 'Abigail kneels before David' }, { label: 'David accepts the gifts' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the story. The dots show where they go.' }, { hint: 'Round 2: Now with Nabal and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'Who sends the messengers away?', options: ['Nabal', 'Abigail', 'Saul'] },
        { q: 'What does Abigail load onto the donkeys?', options: ['bread, wine, sheep and cakes', 'swords and shields', 'gold and silver'] },
        { q: 'What does David say to Abigail?', options: ['Blessed be God, who sent you to me.', 'Go away!', 'I have not seen you.'] }
      ]
    },
    {
      title: 'David’s Lament',
      ref: '1 Samuel 31; 2 Samuel 1',
      text: [
        'The Philistines fight against Israel on Mount Gilboa. There Saul and his sons fall, and Jonathan with them. David is in Ziklag when a messenger comes. He wears torn clothes and has dust on his head.',
        'David hears what has happened. He tears his clothes, and all his men do the same. They mourn, they weep, and they eat nothing until evening. They mourn for Saul, for Jonathan and for the people of God.',
        'Then David sings a song. “How the mighty have fallen!” he sings. “I am sorry for you, my brother Jonathan. You were very dear to me.” He orders that everybody in Judah learn the Song of the Bow.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where do the Philistines fight against Israel?', options: ['on Mount Gilboa', 'in Bethlehem', 'in the Valley of Elah'] },
        { q: 'What does David do when he hears what has happened?', options: ['He tears his clothes and mourns.', 'He holds a feast.', 'He goes to war.'] },
        { q: 'Whom does David especially mourn?', options: ['Jonathan', 'Goliath', 'Nabal'] }
      ]
    },
    {
      title: 'King in Hebron and Jerusalem',
      ref: '2 Samuel 2:1–4; 5:1–12',
      text: [
        'David asks God, “Shall I go up to one of the cities of Judah?” “Go up to Hebron,” says God. There the men of Judah anoint David king.',
        'Later all the tribes of Israel come to Hebron. “We belong together,” they say. “Even when Saul was king, you led us. God has said: You shall shepherd my people Israel.” The elders make a covenant with David and anoint him king over all Israel. David is thirty years old, and he reigns for forty years.',
        'Then David goes to Jerusalem with his men. The people there say, “You will not come in here!” But David takes the fortress of Zion. From now on it is called the City of David, and David builds it up. He grows greater and greater, for God is with him.'
      ],
      task: { hint: 'Put the picture of the City of David together.' },
      questions: [
        { q: 'Where does David go at God’s word?', options: ['to Hebron', 'to Shiloh', 'to Gilgal'] },
        { q: 'How old is David when he becomes king?', options: ['thirty years', 'ten years', 'a hundred years'] },
        { q: 'What is the fortress called that David takes?', options: ['Zion, the City of David', 'Bethlehem', 'Gibeah'] }
      ]
    },
    {
      title: 'The Ark Comes Home',
      ref: '2 Samuel 6',
      text: [
        'David fetches the ark of God to Jerusalem. They set out with it on a new cart, and David and all Israel play before God with harps, tambourines, rattles and cymbals. Then a misfortune happens. David is frightened and asks, “How can the ark of God come to me?” He takes it to the house of Obed-edom. It stays there for three months. God blesses the house of Obed-edom.',
        'When David hears that, he fetches the ark with joy. After six steps they bring an offering. David dances with all his might before God, in a linen robe. All Israel brings up the ark with shouting and trumpets.',
        'In the city they put the ark in the tent that David has pitched for it. David blesses the people and gives everyone a loaf of bread, a piece of meat and some wine. Then they all go home.'
      ],
      task: {
        hint: 'Put the words into the strip in the right order.',
        words: {
          rounds: [
            { hint: 'Put the words into the strip in the right order.', sentences: ['God blesses the house of Obed-edom.', 'Then they all go home.'] },
            { hint: 'Now longer sentences.', sentences: ['All Israel brings up the ark with shouting and trumpets.', 'David dances with all his might before God, in a linen robe.'] }
          ]
        }
      },
      questions: [
        { q: 'What do David and Israel play before God?', options: ['harps, tambourines, rattles and cymbals', 'swords', 'stones'] },
        { q: 'Where does the ark stay for three months?', options: ['in the house of Obed-edom', 'in David’s tent', 'in Shiloh'] },
        { q: 'What does David do before the ark?', options: ['He dances with all his might.', 'He sleeps.', 'He runs away.'] }
      ]
    },
    {
      title: 'A House for God?',
      ref: '2 Samuel 7',
      text: [
        'David lives in a house of cedar, but the ark of God stands in a tent. “That is not right,” he says to the prophet Nathan. “I want to build God a house.” “Do what is in your heart,” says Nathan. “God is with you.”',
        'In the night God speaks to Nathan: “Tell David: I took you from the pasture to be a prince over my people. I have been with you wherever you went. I will make a house for you. Your house and your kingdom shall last forever.”',
        'Nathan tells David everything. Then David goes to the tent of the ark, sits down before God and prays. “Who am I, Lord, and what is my house, that you have brought me this far? There is no one like you, and there is no God but you.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does the ark of God stand?', options: ['in a tent', 'in a cedar house', 'on the mountain'] },
        { q: 'Whom does David speak to first?', options: ['the prophet Nathan', 'Jesse', 'Jonathan'] },
        { q: 'What does God promise David?', options: ['I will make a house for you.', 'You will get gold.', 'You will never be ill.'] }
      ]
    }
  ],
  exam: [
    { q: 'What is David doing when Samuel asks about the sons?', options: ['He is looking after the sheep.', 'He is sleeping at home.', 'He is fighting in the army.'] },
    { q: 'What does David play for Saul?', options: ['the harp', 'the flute', 'the drum'] },
    { q: 'What does David defeat Goliath with?', options: ['a sling and a stone', 'a sword', 'a spear'] },
    { q: 'What does Jonathan give David?', options: ['his cloak, sword, bow and belt', 'a horse', 'a house'] },
    { q: 'What does David cut off Saul’s robe in the cave?', options: ['a corner', 'the sleeve', 'the hem'] },
    { q: 'Where is the ark of God when David wants to build a house?', options: ['in a tent', 'in a cedar house', 'in Shiloh'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
davidEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/david/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
