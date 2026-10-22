/**
 * English texts of the adventure "Abraham" (8 to 10 years): the same shape as `../abraham.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Abram, Sarai, Sarah, Isaac); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Abraham/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const abrahamEn: TextOverlay<Journey> = {
  title: 'Abraham',
  subtitle: 'God Calls, God Keeps His Word',
  gift: { title: 'Abraham and Sarah in Front of the Tent under the Starry Sky' },
  stages: [
    {
      title: 'The Call',
      ref: 'Genesis 11:27–12:4',
      text: [
        'Abram lives in the city of Ur, in the land of the Chaldeans, with his wife Sarai and his nephew Lot. Abram and Sarai have no child.',
        'One day God speaks to Abram: “Leave your country and your father’s house. Go to the land that I will show you. I will make you a great nation and bless you. Through you all people will be blessed.”',
        'Where God is leading him, Abram does not know. But he trusts God. He packs up everything he owns and sets out with Sarai and Lot. His father Terah goes with them as far as Haran. Abram is seventy-five years old when he leaves Haran.'
      ],
      task: { hint: 'Put the packs in the baskets so that the camel stands straight.', balance: { packs: [{ label: 'small sack' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'big sack' }], rounds: [{ hint: 'Round 1: Spread the three packs over both sides.' }, { hint: 'Round 2: Now there are more and heavier packs.' }] } },
      questions: [
        { q: 'Where is Abram to go?', options: ['to the land God will show him', 'back to his father', 'to the sea'] },
        { q: 'What does God promise Abram?', options: ['He will make him a great nation and bless him.', 'He will give him a castle.', 'He will make him king of Ur.'] }
      ]
    },
    {
      title: 'Abram and Lot',
      ref: 'Genesis 13',
      text: [
        'Abram has become rich, and Lot, too, has many sheep, cattle, and tents. But the land is too small for both herds. Their shepherds begin to quarrel.',
        'So Abram says to Lot, “We do not want a quarrel, we are family. Choose where you want to go. If you go left, I will go right.”',
        'Lot looks down into the valley. The Jordan flows through a green plain there, as lovely as a garden. Lot moves there with his herds. Abram stays in the land of Canaan.',
        'Then God speaks to Abram, “Look around you in every direction. All the land that you see I will give to you and your descendants. They will be as many as the dust of the earth.”'
      ],
      task: { hint: 'Tap the animals and count them.', question: 'How many animals are there together?' },
      questions: [
        { q: 'Why can Abram and Lot not stay together?', options: ['The land is too small for both herds.', 'They got lost.', 'It is too cold.'] },
        { q: 'Who gets to choose first where to go?', options: ['Lot', 'Abram', 'the shepherds'] }
      ]
    },
    {
      title: 'The Stars',
      ref: 'Genesis 15:1–7',
      text: [
        'Abram and Sarai have grown old, and they still have no child. That makes Abram sad. Then God speaks to him, “Do not be afraid, Abram! I will protect you and give you a great reward.”',
        '“Lord, what can you give me?” asks Abram. “I have no son. A servant of my household will inherit everything.” “No,” says God, “your own son will be your heir.”',
        'Then God leads him outside. “Look up at the sky and count the stars, if you can,” he says. “That is how many descendants you will have.” Abram looks up, but there are far too many stars to count.',
        'Abram believes God. And God counts it to him as righteousness: because Abram trusts him, he stands right before God. “I brought you out of Ur,” he reminds him, “to give you this land.”'
      ],
      task: { hint: 'Place the stars the way you see them in the model.', constellation: { rounds: [{ hint: 'Round 1: The model stays visible: four stars.' }, { hint: 'Round 2: Look closely: The model disappears. Six stars.' }] } },
      questions: [
        { q: 'What is Abram to count?', options: ['the stars', 'the sheep', 'the tents'] },
        { q: 'How many descendants does God promise Abram?', options: ['as many as the stars in the sky', 'only one', 'twelve'] }
      ]
    },
    {
      title: 'Hagar and the Well',
      ref: 'Genesis 16',
      text: [
        'Many years have passed, and Sarai still has no child. She has a maidservant from Egypt named Hagar. “Perhaps I will get a child through Hagar,” Sarai says to Abram, and he agrees. Soon Hagar is expecting a baby.',
        'But the two women quarrel, and Hagar runs away, out into the desert. Exhausted, she sits down at a well.',
        'Then a messenger of God speaks to her, “Hagar, where have you come from, and where are you going?” “I am running away from Sarai,” she says. “Go back,” says the messenger. “You will have a son. Name him Ishmael, which means: God hears. For God has heard how sad you are.”',
        'Hagar is deeply moved. “You are a God who sees me,” she says, for now she knows that God has not forgotten her. Hagar goes back, and her son is born.'
      ],
      task: { hint: 'The birds fly to the water. Tap where their paths meet.', birds: { rounds: [{ hint: 'The birds fly to the water. Tap where their paths meet.' }, { hint: 'Now three birds fly to each spring. Tap where their paths meet.' }] } },
      questions: [
        { q: 'Where does Hagar sit down after she has run away?', options: ['at a well in the desert', 'under a palm by the sea', 'on a high mountain'] },
        { q: 'What does the name Ishmael mean?', options: ['God hears', 'God laughs', 'God gives'] }
      ]
    },
    {
      title: 'The Covenant and the New Names',
      ref: 'Genesis 17:1–19',
      text: [
        'Abram is ninety-nine years old when God speaks to him again, “I make a covenant with you, a firm promise. I will be your God and the God of your descendants, forever. You will be the father of many nations.” Then Abram throws himself to the ground before God.',
        '“So you shall no longer be called Abram, but Abraham,” says God. “It means: father of many. And Sarai shall be called Sarah. I will bless her, and she will give you a son.”',
        'Abraham has to laugh. “I am almost a hundred years old, and Sarah is ninety,” he thinks. “How can that be?” But God says, “Yes, Sarah will have a son. You shall name him Isaac.”'
      ],
      task: { hint: 'Turn the rings until the light shines through.', rings: { rounds: [{ hint: 'Turn each ring until its gap is at the top. Then the light shines through.' }, { hint: 'Now there are three rings. Turn them until the light shines through.' }] } },
      questions: [
        { q: 'What new name does God give Abram?', options: ['Abraham', 'Isaac', 'Ishmael'] },
        { q: 'What shall the son that Sarah will have be called?', options: ['Isaac', 'Lot', 'Ishmael'] }
      ]
    },
    {
      title: 'A Visit at the Oaks',
      ref: 'Genesis 18:1–15',
      text: [
        'It is hot at noon, and Abraham is sitting at the entrance of his tent under the great oaks of Mamre. God is visiting him. When Abraham looks up, three men are standing in front of him.',
        'Abraham runs to meet them and bows low. “Stay with me,” he says. “Rest under the tree, and I will bring water for your feet and something to eat.” Quickly he asks Sarah to bake bread.',
        'Then Abraham sets bread, milk, and meat in front of the guests. “Where is Sarah, your wife?” they ask. “In the tent,” he says. Then one of them says, “In a year I will come back, and Sarah will have a son.”',
        'Sarah is standing behind the tent door and hears it. She laughs quietly, “I am much too old!” But the guest asks, “Is anything too hard for God?”'
      ],
      task: { hint: 'Fetch water and fill the bowls so that the guests can wash their feet.', water: { plants: [{ label: 'Bowl for the first guest' }, { label: 'Bowl for the second guest' }, { label: 'Bowl for the third guest' }, { label: 'Deep bowl for the first guest' }, { label: 'Deep bowl for the second guest' }], rounds: [{ hint: 'Round 1: Each bowl needs one jug.' }, { hint: 'Round 2: The deep bowls need two jugs.' }] } },
      questions: [
        { q: 'What does Abraham set before the guests?', options: ['bread, milk, and meat', 'fish and dates', 'only water'] },
        { q: 'What does Sarah do when she hears the promise?', options: ['She laughs quietly.', 'She cries.', 'She sings.'] }
      ]
    },
    {
      title: 'Abraham Pleads for Sodom',
      ref: 'Genesis 18:16–33',
      text: [
        'The men get up and go on, and Abraham walks with them a little way. Then God says, “I have heard how bad things are in the city of Sodom. I will go and see for myself.”',
        'Abraham steps up to God and asks boldly, “Will you punish the good people along with the wicked? Perhaps there are fifty good people in the city.” “Then I will spare the whole city for the sake of the fifty,” says God.',
        'Abraham asks once more, very humbly, “And if there are only forty? Or thirty? Or twenty?” Each time God answers, “I will spare the city for their sake, too.” At last Abraham asks, “And if there are only ten?” “Even for the sake of ten,” says God.',
        'Then God goes away, and Abraham returns home. Later, however, God’s judgment comes over Sodom. But God remembers Abraham and brings Lot to safety.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'For how many righteous people does Abraham plead in the end?', options: ['ten', 'fifty', 'a hundred'] },
        { q: 'Whom does God bring to safety?', options: ['Lot', 'Hagar', 'Isaac'] }
      ]
    },
    {
      title: 'Isaac',
      ref: 'Genesis 21:1–7',
      text: [
        'A year goes by. Then what God promised happens: Sarah has a son, and Abraham is one hundred years old. He names the child Isaac, just as God told him.',
        'Isaac means: he laughs. No name could fit better, because Sarah holds her baby in her arms and beams.',
        '“God has given me laughter,” she says. “Everyone who hears about it will laugh with me. Who would have thought that I would have a child? And now I have borne Abraham a son!”',
        'Now Sarah laughs for joy. They have waited so long, and God has kept his word.'
      ],
      task: { hint: 'Put the family picture together.' },
      questions: [
        { q: 'What does Abraham name his son?', options: ['Isaac', 'Lot', 'Ishmael'] },
        { q: 'What does the name Isaac mean?', options: ['He laughs.', 'He runs.', 'He sings.'] }
      ]
    },
    {
      title: 'God Provides',
      ref: 'Genesis 22:1–19',
      text: [
        'Isaac has grown into a boy. Then God wants to see whether Abraham trusts him completely: “Take Isaac, your son, whom you love, and go with him to the land of Moriah. There, on a mountain, you are to offer him to me.”',
        'In the morning Abraham loads wood onto his donkey and sets out with Isaac and two servants. On the third day he sees the mountain. “Stay here,” he says to the servants. “The boy and I will go up and pray, and then we will come back.”',
        'Isaac carries the wood. “Father, where is the animal for the offering?” he asks. “My son,” says Abraham, “God himself will provide it.”',
        'At the top a voice calls from heaven, “Abraham! Do not harm the boy! Now I know that you honor God and obey him.” Abraham sees a ram in a thicket and offers it in Isaac’s place. Isaac is safe. And God promises, “Through your descendants all nations will be blessed.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Abraham answer when Isaac asks about the animal for the offering?', options: ['God will provide it.', 'We will buy one on the way.', 'I have forgotten it.'] },
        { q: 'What does Abraham see in the thicket?', options: ['a ram', 'a deer', 'a donkey'] }
      ]
    },
    {
      title: 'Sarah’s Grave',
      ref: 'Genesis 23',
      text: [
        'Sarah has died, and Abraham weeps for her. Then he gets up and goes to the men of the city of Hebron.',
        '“I am a stranger among you and own no piece of land,” he says. “Give me a place where I can bury Sarah.” The men answer kindly, “You are a prince of God among us. Bury your wife in our finest grave.”',
        'Abraham bows and asks for the cave of Machpelah at the edge of a field. It belongs to Ephron, and he wants to give it to him as a gift. But Abraham says, “No, I want to pay for it.” In front of all the witnesses he weighs out four hundred shekels of silver, the way people paid in those days.',
        'Now Abraham owns a piece of land in Canaan: a field, trees, and a cave. There he buries Sarah. The grave now belongs to Abraham and his family.'
      ],
      task: { hint: 'Lay silver on the cloth: exactly four hundred.', silver: { rounds: [{ hint: 'Lay silver on the cloth: exactly four hundred. The sum helps you.' }, { hint: 'Four hundred once more. Now you reckon it yourself.' }] } },
      questions: [
        { q: 'How does Abraham get the cave for Sarah’s grave?', options: ['He pays for it with silver.', 'He is given it as a gift.', 'He trades it for sheep.'] },
        { q: 'Who owns the cave at first?', options: ['Ephron', 'Lot', 'Isaac'] }
      ]
    },
    {
      title: 'The Servant at the Well',
      ref: 'Genesis 24:1–27',
      text: [
        'Abraham is old, and Isaac is grown up. Isaac is to have a wife from Abraham’s own relatives. So Abraham calls his oldest servant: “Go to the land of my family. God will show you the way.”',
        'The servant travels with ten camels. In the evening he comes to a well outside the town and lets the animals kneel down. He prays, “God, help me! I will ask a girl for water. If she says, ‘Drink, and I will give your camels water, too,’ then she is the right one.”',
        'Then Rebekah comes with a jar on her shoulder. She gives the stranger a drink and says, “I will draw water for your camels, too, until they have had enough.” The servant watches her quietly.',
        'Then he asks her, “Whose daughter are you?” “Bethuel’s daughter, the son of Nahor,” she says. Nahor is Abraham’s brother! Then the servant bows and thanks God.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Whom does Abraham send to the land of his family?', options: ['his oldest servant', 'his son Isaac', 'his nephew Lot'] },
        { q: 'How does the servant recognize the right woman?', options: ['She gives the camels water, too.', 'She wears a red veil.', 'She sings at the well.'] }
      ]
    },
    {
      title: 'Isaac and Rebekah',
      ref: 'Genesis 24:28–67',
      text: [
        'The servant goes with Rebekah to her family and tells them everything. Her father and her brother Laban say, “This comes from God.” The next morning they ask Rebekah, “Will you go with this man?” “Yes,” she says, “I will go.”',
        'Rebekah sits on a camel and travels to the land of Canaan. That evening Isaac is out in the field, praying. He looks up and sees camels coming.',
        'Rebekah sees him, too. “Who is that man in the field?” she asks the servant. “That is my master Isaac,” he says. Then Rebekah covers herself with her cloak.',
        'Isaac leads Rebekah into the tent of his mother Sarah. He loves her, and she becomes his wife. After the death of his mother he is comforted again.'
      ],
      task: { hint: 'Drag the slider until the picture is sharp.', focus: { rounds: [{ hint: 'Drag the slider until the picture is sharp. What is coming there in the distance?' }, { hint: 'And now very close: drag the slider until the picture is sharp.' }] } },
      questions: [
        { q: 'What does Rebekah answer when they ask her whether she will go along?', options: ['Yes, I will go.', 'No, I will stay.', 'I do not know.'] },
        { q: 'What is Isaac doing when the camels come?', options: ['He is out in the field, praying.', 'He is asleep in the tent.', 'He is tending the sheep.'] }
      ]
    }
  ],
  exam: [
    { q: 'Which city does God call Abram out of?', options: ['Ur', 'Babel', 'Egypt'] },
    { q: 'Who gets to choose first when Abram and Lot part?', options: ['Lot', 'Abram', 'the shepherds'] },
    { q: 'What does Hagar call God at the well?', options: ['a God who sees me', 'a God who sleeps', 'a God who lives far away'] },
    { q: 'What does Sarah do when the guests promise her a son?', options: ['She laughs quietly.', 'She cries.', 'She runs away.'] },
    { q: 'For how many righteous people does Abraham plead for Sodom in the end?', options: ['ten', 'fifty', 'a hundred'] },
    { q: 'Who provides the animal for the offering on the mountain?', options: ['God', 'Isaac', 'the servants'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini, 22.10.2026): geschichte-NN-en-v4.mp3, one per stage in the order of the stages
abrahamEn.stages!.forEach((s, i) => {
  s.audio = `audio/abenteuer/abraham/geschichte-${String(i + 1).padStart(2, '0')}-en-v4.mp3`
})
