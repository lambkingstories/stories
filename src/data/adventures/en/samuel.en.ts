/**
 * English texts of the adventure "Samuel and Saul" (8 to 10 years): the same shape as `../samuel.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Elkanah, Peninnah, Hannah, Eli, Shiloh, Samuel, Ramah, Ashdod, Kirjath-jearim, Beth-shemesh, Mizpeh, Ebenezer, Saul, Kish, Zuph, Gibeah, Gilgal, Amalekites); the stories are retold in our own words, "God" everywhere. The source as a readable file: D:/Claude/Abenteuer-Samuel/ENGLISCH/Samuel_English_Texte.md.
 * There are no English recordings yet (no `audio`): the app then reads with the voice of the device.
 * Generated from the readable file by D:/Claude/Abenteuer-Samuel/tools/bauen_samuel.py.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const samuelEn: TextOverlay<Journey> = {
  title: 'Samuel and Saul',
  subtitle: 'Speak, for Your Servant Is Listening',
  gift: { title: 'Samuel and the Lamp' },
  stages: [
    {
      title: 'Hannah Prays',
      ref: '1 Samuel 1:1–20',
      text: [
        'Every year Elkanah goes to Shiloh with his family to worship God. His wife Peninnah has children, but his wife Hannah has none. Peninnah teases Hannah about it, and Hannah weeps and cannot eat. “Why are you weeping?” asks Elkanah. “Am I not worth more to you than ten sons?”',
        'Then Hannah goes to the house of God, where the priest Eli sits. She prays for a long time and weeps, and only her lips move. “Lord, give me a son,” she prays, “and I will give him back to you all his life.” Eli sees her lips tremble and thinks she has drunk too much wine.',
        '“No, my lord,” says Hannah, “I am very sad, and I have poured out my heart before God.” “Go in peace,” says Eli. “God will give you what you have asked.” Soon Hannah has a son. She names him Samuel, because she asked God for him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where does Elkanah go every year with his family?', options: ['to Shiloh', 'to Jericho', 'to Bethlehem'] },
        { q: 'What does Hannah promise God for a son?', options: ['She will give him back to God all his life.', 'She will hold a big feast.', 'She will build a house.'] },
        { q: 'What does Hannah name her son?', options: ['Samuel', 'Elkanah', 'Eli'] }
      ]
    },
    {
      title: 'The Little Robe',
      ref: '1 Samuel 1:21 – 2:26',
      text: [
        'When Samuel is old enough, Hannah brings him to Eli in Shiloh. “I am the woman who prayed here,” she says. “I asked for this boy, and God has granted my request. Now I give him back to God for as long as he lives.” There they worship God.',
        'Samuel stays with Eli and serves God in the house of God, though he is still a little boy. And every year, when Hannah goes up to Shiloh with her husband, she brings him a little robe that she has made for him.',
        'Eli blesses Elkanah and Hannah. Later God gives Hannah three more sons and two daughters. But Samuel grows up in the house of God, and God and people love him.'
      ],
      task: {
        hint: 'Tap the little robe that fits Samuel.',
        coat: {
          rounds: [
            { hint: 'Which little robe fits Samuel?' },
            { hint: 'Samuel has grown. Which one fits now?' },
            { hint: 'Another year later. Which one fits?' }
          ]
        }
      },
      questions: [
        { q: 'With whom does Samuel stay in the house of God?', options: ['with Eli', 'with Elkanah', 'with Peninnah'] },
        { q: 'What does Hannah bring him every year?', options: ['a little robe', 'a sheep', 'a jug of wine'] }
      ]
    },
    {
      title: 'God Calls Samuel',
      ref: '1 Samuel 3',
      text: [
        'Samuel serves God with Eli. Eli is very old, and his eyes are weak. One night Samuel is lying where the ark of God stands, and the lamp is still burning. Then he hears someone call: “Samuel!”',
        '“Here I am!” says Samuel, runs to Eli and cries: “You called me.” “I did not call you,” says Eli. “Go back to sleep.” This happens a second and a third time, for Samuel does not yet know God. Then Eli realizes that God is calling the boy.',
        '“When you are called, say: Speak, Lord, for your servant hears,” he says. Samuel lies down again. Again God calls: “Samuel, Samuel!” “Speak, for your servant hears,” says Samuel. God tells him a serious word for Eli, and in the morning Samuel tells it, hiding nothing. From then on all Israel knows: Samuel is a prophet of God.'
      ],
      task: {
        hint: 'Drag the right leaf into the gap.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['“Speak, Lord, for your ', ' is listening.”'], words: ['servant', 'priest', 'king'] },
            { hint: 'Now two words are missing.', parts: ['“Here I ', '! You ', ' me.”'], words: ['am', 'called', 'was', 'slept'] }
          ]
        }
      },
      questions: [
        { q: 'To whom does Samuel run in the night?', options: ['to Eli', 'to Hannah', 'to Elkanah'] },
        { q: 'Who realizes that God is calling the boy?', options: ['Eli', 'Samuel', 'Elkanah'] },
        { q: 'What does all Israel know?', options: ['Samuel is a prophet of God.', 'Samuel is a judge.', 'Samuel is a king.'] }
      ]
    },
    {
      title: 'The Ark Among the Philistines',
      ref: '1 Samuel 4–5',
      text: [
        'Israel goes out to fight the Philistines and loses. Then the Israelites bring the ark of the covenant from Shiloh into the camp. The people shout so loudly that the earth shakes, and the Philistines are afraid. But they fight anyway, and Israel loses again. Many men fall, and the Philistines take the ark of God away.',
        'They bring the ark into the house of their god Dagon in Ashdod and set it beside him. The next morning they find Dagon fallen down before the ark. They set him up again. The next morning he is lying there again, and this time he is broken.',
        'The people of Ashdod fall ill, and fear grows. “The hand of the God of Israel lies too heavily on us,” they say. “The ark must not stay with us.” They carry the ark from town to town, but nowhere does it get better.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do the Israelites bring from Shiloh into the camp?', options: ['the ark of the covenant', 'a banner', 'a sword'] },
        { q: 'Where do the Philistines take the ark?', options: ['into the house of their god Dagon', 'into their king’s palace', 'into a tent by the sea'] },
        { q: 'What do the people of Ashdod find in the morning?', options: ['Dagon lies fallen before the ark.', 'The ark has vanished.', 'The ark is shining.'] }
      ]
    },
    {
      title: 'Two Cows Pull It Home',
      ref: '1 Samuel 6:1 – 7:2',
      text: [
        'For seven months the ark is with the Philistines. Then they ask their priests: “What shall we do with the ark?” “Do not send it back empty,” say the priests. “Give the God of Israel a gift of gold. Build a new cart and take two young cows that have never worn a yoke. Leave their calves at home.”',
        '“Put the ark on the cart and let the cows go. If they go to Beth-shemesh, then the God of Israel has sent us this trouble.” The Philistines do it. And the cows go straight toward Beth-shemesh, lowing, but they turn neither to the right nor to the left.',
        'In Beth-shemesh the people are cutting wheat in the valley. They see the ark and are glad. The cart stops in a field beside a big stone. Later men from Kirjath-jearim bring the ark to a house on the hill.'
      ],
      task: {
        hint: 'Keep the cart on the road. Tap the side it should go back to.',
        cows: { rounds: [{ hint: 'The cows want to go to the grass. Tap the side the cart should go back to.' }, { hint: 'Now they pull harder. Keep the cart on the road.' }] }
      },
      questions: [
        { q: 'What stays at home with the cows?', options: ['the calves', 'the cart', 'the yoke'] },
        { q: 'Where do the cows go?', options: ['straight toward Beth-shemesh', 'back to Ashdod', 'to the sea'] },
        { q: 'What are the people in Beth-shemesh doing?', options: ['They are cutting wheat.', 'They are baking bread.', 'They are building a house.'] }
      ]
    },
    {
      title: 'Eben-ezer',
      ref: '1 Samuel 7:3–14',
      text: [
        'For twenty years the ark stays in Kirjath-jearim, and the people are sad. Then Samuel says: “If you turn back to God with all your heart and serve him alone, he will save you.” The people put away their foreign idols. Samuel calls everyone to Mizpeh to pray for them. There they pour out water before God and say: “We have sinned against God.”',
        'When the Philistines hear that Israel has gathered at Mizpeh, they march there. The people are afraid. “Do not stop crying to God for us!” they beg Samuel. Samuel offers a lamb and cries to God, and God answers him. When the Philistines attack, God sends a mighty thunder over them. They are terrified and run away.',
        'Then Samuel takes a stone and sets it up between Mizpeh and Shen. He calls it Eben-ezer and says: “Thus far God has helped us.”'
      ],
      task: {
        hint: 'Drag the stone exactly into the middle between the two places.',
        stone: { rounds: [{ hint: 'Set the stone exactly in the middle between the two places. The notch helps you.' }, { hint: 'Once more, now without the notch. Guess the middle.' }] }
      },
      questions: [
        { q: 'What do the people pour out before God in Mizpeh?', options: ['water', 'wine', 'oil'] },
        { q: 'What does God send over the Philistines?', options: ['a mighty thunder', 'a rain of stones', 'a storm'] },
        { q: 'What does Samuel call the stone?', options: ['Eben-ezer', 'Shiloh', 'Ramah'] }
      ]
    },
    {
      title: 'We Want a King',
      ref: '1 Samuel 8',
      text: [
        'Samuel grows old. He makes his sons judges, but they do not follow his way: they take gifts and bend the law. Then all the elders of Israel come to Samuel at Ramah. “You are old, and your sons do not walk in your ways,” they say. “Give us a king, like all the nations have.”',
        'Samuel does not like it, and he prays. God says to him: “Listen to the people. They have not rejected you, but me. But warn them and tell them what a king will do to them.”',
        'Samuel warns the people: “A king will take your sons and daughters to work for him. He will take your best fields and a tenth of everything.” But the people will not listen. “No,” they cry, “we want a king! He shall fight our wars.” And God says to Samuel: “Give them a king.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Where do the elders of Israel come?', options: ['to Samuel at Ramah', 'to Eli at Shiloh', 'to Mizpeh'] },
        { q: 'Why do the elders want a king?', options: ['Samuel is old, and his sons do not follow his ways.', 'The Philistines ordered it.', 'Samuel has fallen ill.'] },
        { q: 'What does Samuel say a king will do?', options: ['He will take your sons and your best fields.', 'He will give you gold.', 'He will build you houses.'] }
      ]
    },
    {
      title: 'Saul Looks for the Donkeys',
      ref: '1 Samuel 9:1–14',
      text: [
        'In Benjamin lives a rich man, Kish. His young son Saul is a head taller than everyone else among the people. One day Kish’s donkeys are lost. “Take a servant with you and look for them,” he says to Saul.',
        'Saul and the servant go through the hill country of Ephraim, through the land of Shalisha, through the land of Shaalim and through the land of Benjamin. But they find the donkeys nowhere. When they come to the land of Zuph, Saul says: “Come, let us go home. Otherwise my father will worry about us.”',
        'The servant says: “In this town lives a man of God. What he says comes true. Perhaps he can tell us which way to go.” “But what can we bring him? Our bread is gone,” says Saul. “I have a quarter of a silver coin,” says the servant. So they go up to the town and ask the girls at the well: “Is the seer here?”'
      ],
      task: {
        hint: 'Tap the places in the order of the story.',
        search: {
          places: [{ label: 'Ephraim' }, { label: 'Shalisha' }, { label: 'Shaalim' }, { label: 'Benjamin' }, { label: 'Zuph' }],
          rounds: [{ hint: 'Saul is looking for the lost donkeys. Follow the footprints from place to place.' }, { hint: 'Now without footprints: first Ephraim, then Shalisha, Shaalim, Benjamin and last Zuph.' }]
        }
      },
      questions: [
        { q: 'Whose son is Saul?', options: ['Kish’s', 'Eli’s', 'Elkanah’s'] },
        { q: 'What have Saul and the servant lost and are looking for?', options: ['Kish’s donkeys', 'their tent', 'their bread'] },
        { q: 'What does the servant have with him for the man of God?', options: ['a quarter of a silver coin', 'a jug of wine', 'a lamb'] }
      ]
    },
    {
      title: 'Samuel Anoints Saul',
      ref: '1 Samuel 9:15 – 10:8',
      text: [
        'The day before, God had said to Samuel: “Tomorrow I will send you a man from Benjamin. You shall anoint him as prince over my people.” When Samuel sees Saul, God says: “This is the man.” “Do not worry about the donkeys any more, they have been found,” Samuel says to Saul. Saul is amazed: “I am from the smallest tribe of Israel.”',
        'Samuel seats Saul at the head of the feast. In the morning Samuel sends the servant ahead. Then he pours oil on Saul’s head, kisses him and says: “God has anointed you prince over his people.”',
        'Samuel tells Saul three signs: Two men will tell him the donkeys have been found. At the oak three men will give him two loaves. And a band of prophets will meet him with harps and flutes. As Saul turns to go, God gives him another heart.'
      ],
      task: {
        hint: 'Put the cards in the order of the signs.',
        order: {
          cards: [{ label: 'Samuel anoints Saul' }, { label: 'Two men at Rachel’s tomb' }, { label: 'Three men at the oak' }, { label: 'The prophets with harps and flutes' }],
          rounds: [{ hint: 'Round 1: Put the pictures in the order of the signs. The dots show where they go.' }, { hint: 'Round 2: Now with the anointing and without dots: What comes first, what comes next?' }]
        }
      },
      questions: [
        { q: 'What does Samuel pour on Saul’s head?', options: ['oil', 'water', 'wine'] },
        { q: 'What does Samuel say about the donkeys?', options: ['They have been found.', 'They have been sold.', 'They have run away.'] },
        { q: 'What does God give Saul when he turns to go?', options: ['another heart', 'a sword', 'a crown'] }
      ]
    },
    {
      title: 'Saul Becomes King',
      ref: '1 Samuel 10:17–27',
      text: [
        'Samuel calls the people to Mizpeh. “So says God: I brought you out of Egypt, and you have rejected me and want a king. Now come before God, tribe by tribe.” Samuel casts lots. It falls on the tribe of Benjamin, and then on Saul, the son of Kish.',
        'But when they look for Saul, he is not there. “Will he still come?” they ask God. “See, he has hidden among the baggage,” God answers. They run there and bring him out. When Saul steps out among the people, he is a head taller than all of them.',
        '“See, God has chosen him!” cries Samuel. “There is no one like him among the people.” Then the people shout: “Long live the king!” Then Saul goes to Gibeah, and men whose hearts God has touched go with him. A few people despise him. Saul acts as if he does not hear it.'
      ],
      task: {
        hint: 'Lift the piles of baggage and find Saul.',
        baggage: { rounds: [{ hint: 'Saul is taller than everybody. Behind which pile can he hide?' }, { hint: 'Now eight piles, and Saul stands somewhere else. Lift them.' }] }
      },
      questions: [
        { q: 'Where does Samuel call the people?', options: ['to Mizpeh', 'to Shiloh', 'to Gilgal'] },
        { q: 'What does the people shout when Saul stands before them?', options: ['Long live the king!', 'We want to go home!', 'Where is Samuel?'] },
        { q: 'Where does Saul go afterwards?', options: ['to Gibeah', 'to Ramah', 'to Shiloh'] }
      ]
    },
    {
      title: 'Saul Cannot Wait',
      ref: '1 Samuel 13:1–14',
      text: [
        'Saul has been king for a while when the Philistines gather a huge army against Israel, with chariots, horsemen and men as many as the sand by the sea. The Israelites are afraid and hide in caves, cracks in the rocks and pits. Saul waits in Gilgal, and his people tremble behind him.',
        'Samuel had said to Saul: “Wait seven days until I come.” Saul waits seven days, but Samuel does not come. The people run away from him, one after the other. Then Saul grows restless. “Bring me the offering!” he cries, and he offers it himself.',
        'Hardly is he finished when Samuel comes. “What have you done?” “The people ran away from me, you did not come, and the Philistines are waiting for me,” says Saul. “You have acted foolishly,” says Samuel. “You have not kept God’s command. Your kingdom will not last. God has looked for a man who is dear to his heart.”'
      ],
      task: {
        hint: 'Tap every man who walks away and keep the people with Saul.',
        gather: { rounds: [{ hint: 'Saul is waiting for Samuel. Tap every man who walks away: he comes back.' }, { hint: 'Now for seven days. Keep the men with Saul.' }] }
      },
      questions: [
        { q: 'Where do the Israelites hide from the Philistines?', options: ['in caves, cracks in the rocks and pits', 'in the town of Shiloh', 'behind the ark'] },
        { q: 'What does Saul do when the people run away?', options: ['He offers the offering himself.', 'He runs away too.', 'He attacks alone.'] },
        { q: 'What does Samuel say to Saul?', options: ['You have acted foolishly.', 'You have waited well.', 'You are a brave king.'] }
      ]
    },
    {
      title: 'Obedience Is Better Than Sacrifice',
      ref: '1 Samuel 15',
      text: [
        'God sends Samuel to Saul: “March against the Amalekites and do everything God tells you.” Saul sets out and wins. But he and the people keep the best sheep and cattle.',
        'Then God says to Samuel: “I am sorry that I made Saul king. He does not listen to me.” Samuel cries to God all night. In the morning he asks Saul: “What is this bleating of sheep?” “The people have kept the best ones to offer them to God,” says Saul.',
        '“Does God have more joy in sacrifices than in obedience?” asks Samuel. “Obedience is better than sacrifice. God has rejected you.” Saul admits: “I have sinned.” As Samuel turns to leave, Saul holds him by his cloak, and the cloak tears. “So God tears the kingdom from you,” says Samuel. He never sees Saul again, but he mourns for him.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What do Saul and the people keep?', options: ['the best sheep and cattle', 'the gold of the Amalekites', 'their houses'] },
        { q: 'What does Samuel say to Saul?', options: ['Obedience is better than sacrifice.', 'Sacrifice is better than obedience.', 'You are the best king.'] },
        { q: 'What happens to Samuel’s cloak?', options: ['It tears.', 'It burns.', 'It is given away.'] }
      ]
    }
  ],
  exam: [
    { q: 'What does Hannah name her son?', options: ['Samuel', 'Elkanah', 'Eli'] },
    { q: 'What does Samuel answer when God calls him?', options: ['Speak, for your servant hears.', 'I do not want to.', 'I am too small.'] },
    { q: 'What stays at home when the cows pull the ark?', options: ['the calves', 'the cart', 'the yoke'] },
    { q: 'What does Samuel say about the stone Eben-ezer?', options: ['Thus far God has helped us.', 'Here God lives.', 'Here the land ends.'] },
    { q: 'What is Saul looking for when he comes to Samuel?', options: ['his father’s donkeys', 'a sword', 'a new way'] },
    { q: 'What is better than sacrifice?', options: ['obedience', 'gold', 'sheep'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
samuelEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/samuel/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
