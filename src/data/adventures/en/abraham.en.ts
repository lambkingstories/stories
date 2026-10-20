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
      ref: 'Genesis 12:1–9',
      audio: 'audio/abenteuer/abraham/geschichte-01-en-v3.mp3',
      text: [
        'After the tower of Babel, the people spread out over the whole earth, but God did not lose sight of them. In the city of Haran lives a man named Abram with his wife Sarai, and God calls him in particular, so that something completely new can begin through him.',
        'One day God says to him, “Leave your country, your relatives, and your father’s house, and go to the land that I will show you. I will make you a great nation and bless you, and you will be a blessing yourself. Through you all the families of the earth will be blessed.”',
        'Abram does not stop to ask where he is going. He trusts God and sets out, even though he is already seventy-five years old. His wife Sarai goes with him, and so does his nephew Lot, along with all the people who belong to them, and they take everything they own.',
        'So they travel into the land of Canaan, as far as the great trees at Shechem. There God says to Abram, “I will give this land to your descendants.” Then Abram builds an altar to thank God. After that he moves on to the hills near Bethel, pitches his tent, builds another altar, and prays to God.'
      ],
      task: { hint: 'Put the packs in the baskets so that the camel stands straight.', balance: { packs: [{ label: 'small sack' }, { label: 'small sack' }, { label: 'small sack' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'water skin' }, { label: 'big sack' }, { label: 'big sack' }, { label: 'big sack' }], rounds: [{ hint: 'Round 1: Spread the three packs over both sides.' }, { hint: 'Round 2: Now there are more and heavier packs.' }] } },
      questions: [
        { q: 'Where is Abram to go?', options: ['to the land God will show him', 'back home', 'to the sea'] },
        { q: 'Who goes with Abram and Sarai?', options: ['Lot', 'a king', 'Isaac'] }
      ]
    },
    {
      title: 'Abram and Lot',
      ref: 'Genesis 13',
      audio: 'audio/abenteuer/abraham/geschichte-02-en-v2.mp3',
      text: [
        'Abram has become rich, and Lot, too, has large herds and many tents. But the land is too small for the two of them. Soon there is quarreling between Abram’s shepherds and Lot’s shepherds.',
        'When Abram hears this, he goes to Lot and says, “There must be no quarreling between you and me, or between our shepherds, because we are family. The whole land lies before you. Let us part. Choose where you want to go, and I will go the other way.” Abram is the older one, and yet he lets Lot choose first.',
        'Lot looks around. He sees the wide plain along the Jordan River, green and well watered, as lovely as a garden of God. Lot chooses this plain and goes east with his herds, and he pitches his tents near the city of Sodom. But the people of Sodom are wicked in God’s eyes.',
        'Abram stays in the land of Canaan. Then God says to him, “Look around, to the north and the south, to the east and the west! All the land that you see I will give to you and your descendants forever. They will be as many as the dust of the earth.” So Abram moves on and pitches his tent by the great oaks of Mamre.'
      ],
      task: { hint: 'Tap the animals and count them.', question: 'How many animals are there together?' },
      questions: [
        { q: 'Why can’t Abram and Lot stay together?', options: ['The land is too small for both herds.', 'They got lost.', 'It is too cold.'] },
        { q: 'Who chooses a land first?', options: ['Lot', 'Abram', 'the shepherds'] }
      ]
    },
    {
      title: 'The Stars',
      ref: 'Genesis 15:1–6',
      audio: 'audio/abenteuer/abraham/geschichte-03-en-v3.mp3',
      text: [
        'Many years have passed, and Abram and Sarai still have no child. One day God’s word comes to Abram: “Do not be afraid, Abram! I am your shield, and I will reward you greatly.”',
        'Sadly, Abram answers: “Lord, what can you give me? I have no son. When I die, one of my servants will get everything I own.” But God says, “No, this servant will not be your heir, but your own son.”',
        'Then God leads Abram outside, under the night sky. “Look up at the sky,” he says, “and count the stars, if you can!” Abram looks up. The sky sparkles with countless stars. “That is how many descendants you will have,” says God.',
        'Abram cannot count them, there are so many. But he believes what God promises him, even though he and Sarai are old and still have no child. And God counts this trust as righteousness: in God’s eyes, Abram stands right before him.'
      ],
      task: { hint: 'Place the stars the way you see them in the model.', constellation: { rounds: [{ hint: 'Round 1: The model stays visible: four stars.' }, { hint: 'Round 2: Look closely: The model disappears. Six stars.' }] } },
      questions: [
        { q: 'What is Abram to count at night?', options: ['the stars', 'the sheep', 'the tents'] },
        { q: 'How many descendants does God promise Abram?', options: ['as many as the stars in the sky', 'only one', 'none'] }
      ]
    },
    {
      title: 'Hagar and the Well',
      ref: 'Genesis 16',
      text: [
        'Many years have passed since God’s promise, and Abram and Sarai still have no child. Sarai has a maidservant from Egypt named Hagar. Because Sarai cannot have children herself, she gives Hagar to her husband, hoping that Hagar will give him a child.',
        'Soon Hagar really is expecting a child. But there is quarreling between the two women, and in her distress Hagar runs away, out into the desert. Exhausted, she sits down at a well beside the road.',
        'But God has seen Hagar. A messenger of God finds her at the well and asks, “Hagar, where have you come from, and where are you going?” “I am running away from Sarai,” she answers. Then the messenger says, “Go back to her. You will have a son, and you are to name him Ishmael, which means: God hears. For God has heard how badly things are going for you.”',
        'Hagar is deeply moved. “You are a God who sees me,” she says, for now she knows that God has not forgotten her. From then on the well has a special name: the well of the Living One who sees me. Hagar goes back and has her son, and Abram names him Ishmael.'
      ],
      task: { hint: 'Tap where the flight paths of the birds meet.', birds: { rounds: [{ hint: 'The birds fly to the water. Tap where their paths meet.' }, { hint: 'Now more birds are flying, and one flies somewhere else. Follow only the lines that meet.' }] } },
      questions: [
        { q: 'Where does the messenger of God find Hagar when she has run away?', options: ['at a well in the desert', 'in a tent', 'on a high mountain'] },
        { q: 'What does Hagar call God?', options: ['a God who sees me', 'a God who sleeps', 'a God who lives far away'] }
      ]
    },
    {
      title: 'The Covenant and the New Names',
      ref: 'Genesis 17:1–8, 15–19',
      text: [
        'Thirteen years later, when Abram is ninety-nine years old, God speaks to him again: “I am God Almighty. Walk before me and live as pleases me. I will make a covenant with you, a firm promise, and I will make you very numerous.”',
        'Then Abram throws himself to the ground before God. God says, “You shall no longer be called Abram, but Abraham, for I am making you the father of many nations. My promise holds for you and for all your descendants, forever: I will be your God, and the land of Canaan shall belong to you.”',
        'Sarai receives a new name, too. “She shall be called Sarah,” says God. “I will bless her, and she will have a son. Nations shall come from her.”',
        'Abraham has to laugh, he is so surprised. “Can a man of a hundred still become a father?” he thinks, “and Sarah is ninety!” But God says, “Yes, Sarah will give you a son. You shall call him Isaac, and with him I will keep my covenant.”'
      ],
      task: { hint: 'Turn the rings until the light shines through.', rings: { rounds: [{ hint: 'Turn each ring until its gap is at the top. Then the light shines through.' }, { hint: 'These rings are joined: when you turn the first one, the second one turns the other way with it.' }] } },
      questions: [
        { q: 'What new name does Abram receive?', options: ['Abraham', 'Isaac', 'Ishmael'] },
        { q: 'How old is Abram when God gives him the new name?', options: ['ninety-nine years old', 'seventy-five years old', 'twenty years old'] }
      ]
    },
    {
      title: 'A Visit at the Oaks',
      ref: 'Genesis 18:1–15',
      audio: 'audio/abenteuer/abraham/geschichte-06-en-v3.mp3',
      text: [
        'By now God has given Abram and Sarai new names: Abram is now called Abraham, which means “father of many,” and Sarai is called Sarah. Both have grown very old.',
        'It is noon and hot. Abraham is sitting at the entrance of his tent by the great oaks of Mamre when God visits him. He looks up and sees three men standing in front of him.',
        'At once he runs to meet them and bows low. “Please stay with me,” he says. “I will have water brought so you can wash your feet, and you can rest under the tree. I will fetch a bit of bread.” Then he hurries into the tent and says to Sarah, “Quick, bake bread for our guests!” And he picks out a young calf.',
        'When everything is ready, Abraham sets bread, butter, milk, and meat in front of the men. “Where is Sarah, your wife?” they ask. “In the tent,” he answers. Then one of them says, “In a year I will come back to you, and Sarah will have a son.”',
        'Sarah is standing behind the tent door and hears it. She laughs quietly to herself: “I am much too old for that!” “Why is Sarah laughing?” asks the guest. “Is anything too hard for God?” Sarah is startled: “I did not laugh.” But he answers, “Yes, you did laugh.”'
      ],
      task: { hint: 'Fill the jug at the well and pour the water into the guests’ bowls.', water: { plants: [{ label: 'Bowl for the first guest' }, { label: 'Bowl for the second guest' }, { label: 'Bowl for the third guest' }, { label: 'Deep bowl for the first guest' }, { label: 'Deep bowl for the second guest' }, { label: 'Deep bowl for the third guest' }], rounds: [{ hint: 'Round 1: Each bowl needs one jug.' }, { hint: 'Round 2: The deep bowls need two jugs.' }] } },
      questions: [
        { q: 'What does Abraham serve his guests?', options: ['bread, butter, milk, and meat', 'fish and dates', 'only water'] },
        { q: 'What does Sarah do when she hears she will have a son?', options: ['She laughs quietly.', 'She cries.', 'She sings.'] }
      ]
    },
    {
      title: 'Abraham Pleads for Sodom',
      ref: 'Genesis 18:16–33',
      text: [
        'Two of the three men set out toward Sodom, and Abraham walks with them for a while. But God himself stays behind with him and says, “A great nation shall come from Abraham, and all nations shall be blessed through him. So I will not hide from him what I plan to do. I have heard how bad things are in Sodom, and I will go and see for myself.”',
        'Abraham steps close to God and asks boldly, “Will you destroy the good along with the wicked? Perhaps fifty good people live in the city. Will you not forgive them?” God answers, “If I find fifty good people in Sodom, I will spare the whole city.”',
        'But Abraham asks once more, very carefully, “Forgive me for asking so much. And if there are only forty-five? Or forty? Or thirty? Or twenty?” And every time God answers, “Then I will spare the city for their sake.”',
        'At last Abraham asks, “And if there are only ten good people?” “For the sake of ten I will not destroy the city,” says God. Then God goes away, and Abraham returns home to his tent. Later God remembers Abraham and brings Lot to safety.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'How many good people does it take in the end for God to spare the city?', options: ['ten', 'fifty', 'one hundred'] },
        { q: 'Whom does God bring to safety?', options: ['Lot', 'Hagar', 'Isaac'] }
      ]
    },
    {
      title: 'Isaac',
      ref: 'Genesis 21:1–7',
      audio: 'audio/abenteuer/abraham/geschichte-08-en-v2.mp3',
      text: [
        'A year goes by, and then exactly what God promised happens: Sarah has a son, at the very time God had named. Twenty-five years have passed since Abraham left Haran, and now he is one hundred years old.',
        'Abraham gives the child the name God told him: Isaac. It means “he laughs,” and no name could fit this story better.',
        'Sarah holds her son in her arms and says, “God has given me laughter. Everyone who hears about it will laugh with me.” And she adds, “Who would ever have told Abraham that Sarah would have a child at her breast? And now I have borne him a son, even though he is so old.”',
        'Now there is a baby in the tent, one that the two of them have waited for so long. Sarah laughs, Abraham laughs, and both know: God has kept his word.'
      ],
      task: { hint: 'Put the family picture together.' },
      questions: [
        { q: 'What does Abraham name his son?', options: ['Isaac', 'Lot', 'Abram'] },
        { q: 'How old is Abraham when Isaac is born?', options: ['one hundred years', 'fifty years', 'twenty years'] }
      ]
    },
    {
      title: 'God Provides',
      ref: 'Genesis 22:1–19',
      text: [
        'Isaac has grown into a boy, and God wants to see whether Abraham trusts him completely. “Abraham!” he calls. “Here I am.” “Take Isaac, your son, whom you love so much, and go with him to the land of Moriah. There, on a mountain, you are to offer him to me.” It is a hard test, but Abraham trusts God.',
        'The next morning he loads wood onto his donkey and sets out with Isaac and two servants. On the third day he sees the mountain and leaves the servants behind with the donkey: “The boy and I will go up there to pray, and then we will come back to you.”',
        'On the way Isaac asks, “Father, where is the animal for the offering?” “My son,” Abraham answers, “God himself will provide the animal for the offering.”',
        'At the top Abraham builds an altar. Then a voice calls from heaven, “Abraham! Do not harm the boy! Now I know that you trust God.” Abraham sees a ram caught by its horns in a thicket. He offers it to God in Isaac’s place. Isaac is safe, and Abraham calls the place “God Provides.”',
        'Once more the voice calls, “Because you did not hold back your son from me, I will bless you. Your descendants will be as many as the stars, and through them all nations shall be blessed.”'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'What does Abraham answer when Isaac asks about the animal for the offering?', options: ['God will provide it.', 'I have forgotten it.', 'We will buy it on the way.'] },
        { q: 'What does Abraham see in the thicket?', options: ['a ram', 'a deer', 'a donkey'] },
        { q: 'What does God promise Abraham at the end?', options: ['All nations shall be blessed through his descendants.', 'He shall become king over Canaan.', 'He shall move to Egypt.'] }
      ]
    },
    {
      title: 'Sarah’s Grave',
      ref: 'Genesis 23',
      text: [
        'Many years have passed. Sarah is a hundred and twenty-seven years old when she dies in Hebron, and Abraham mourns for her. Then he gets up and goes to the men of the town: “I am a stranger and a guest among you. Give me a piece of land so that I can bury my wife.”',
        'The men answer kindly, “You are a man whom God has made great. Bury your wife in the finest of our graves; none of us will refuse you.” Abraham bows and asks for the cave of Machpelah at the edge of a field that belongs to a man named Ephron.',
        'Ephron wants to give it to him, together with the whole field. But Abraham does not want a gift; he wants to pay for the land. “Take my money,” he says. Then Ephron names the price: four hundred pieces of silver. Abraham weighs out the silver and gives it to him in front of all the witnesses.',
        'Now the field and the cave belong to Abraham as a grave. There he buries Sarah. It is the first piece of land that Abraham owns in Canaan, in the land that God promised to him and his descendants.'
      ],
      task: { hint: 'Pay for the land with exactly four hundred pieces of silver.', silver: { rounds: [{ hint: 'Pay for the land with exactly four hundred pieces of silver. The sum on the cloth helps you.' }, { hint: 'Four hundred once more. Now you reckon it yourself.' }] } },
      questions: [
        { q: 'From whom does Abraham buy the field with the cave?', options: ['From Ephron', 'From Lot', 'From Isaac'] },
        { q: 'What does Abraham need this piece of land for?', options: ['as a grave for Sarah', 'as pasture for his herds', 'for a new house'] }
      ]
    },
    {
      title: 'A Wife for Isaac',
      ref: 'Genesis 24',
      text: [
        'Abraham is very old now, and Isaac is to have a wife from his own relatives. So Abraham sends his oldest servant with ten camels to the far-off land of his family. “God will send his messenger ahead of you,” he says, “and there you will find a wife for my son.”',
        'In the evening the servant comes to a well outside the town, lets the camels kneel down, and prays, “God, help me! If a girl comes and I ask her for a drink of water, and she says, ‘Drink, and I will water your camels, too,’ then let her be the right one.”',
        'He has not even finished praying when Rebekah comes to the well with her jar on her shoulder. She gives him a drink and says, “I will draw water for your camels, too, until they have had enough.” The servant watches her quietly.',
        'The servant thanks God and tells Rebekah’s family what has happened. Her father and her brother Laban say, “This comes from God.” And Rebekah says, “Yes, I will go with him.”',
        'When the caravan reaches Canaan, Isaac is out in the field that evening to think. He looks up and sees the camels coming. Rebekah becomes his wife, he loves her, and after the death of his mother he is happy again.'
      ],
      task: { hint: 'Put the blankets on the camels so that all the clue cards are true.', clues: { blankets: [{ label: 'Red', pattern: 'striped' }, { label: 'Blue', pattern: 'dotted' }, { label: 'Yellow', pattern: 'checked' }, { label: 'Green', pattern: 'wavy' }], rounds: [{ hint: 'Put the blankets on the camels so that all the clue cards are true.' }, { hint: 'Now four camels and four cards. Take your time to think.' }] } },
      questions: [
        { q: 'Whom does Abraham send to the land of his family?', options: ['his oldest servant', 'his son Isaac', 'his nephew Lot'] },
        { q: 'How does the servant recognize the right woman?', options: ['She gives the camels water to drink, too.', 'She wears a red veil.', 'She sings at the well.'] }
      ]
    }
  ],
  exam: [
    { q: 'Where does God call Abram to go?', options: ['to a land God will show him', 'back to Haran', 'to the sea'] },
    { q: 'Who chooses first when Abram and Lot part?', options: ['Lot', 'Abram', 'the shepherds'] },
    { q: 'How many descendants does God promise Abram on the starry night?', options: ['as many as the stars in the sky', 'only twelve', 'as many as sheep'] },
    { q: 'What does Sarah do when the guests promise her a son?', options: ['She laughs quietly.', 'She cries.', 'She runs away.'] },
    { q: 'What is the name of Abraham and Sarah’s son?', options: ['Isaac', 'Lot', 'Eliezer'] },
    { q: 'Who provides the animal for the offering on the mountain?', options: ['God', 'Isaac', 'the servants'] }
  ]
}
