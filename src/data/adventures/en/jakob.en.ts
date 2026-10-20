/**
 * English texts of the adventure "Jacob" (8 to 10 years): the same shape as `../jakob.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain World English Bible
 * (Jacob, Esau, Rebekah, Laban, Bethel, Israel); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Jakob/ENGLISCH/.
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const jakobEn: TextOverlay<Journey> = {
  title: 'Jacob',
  subtitle: 'A Road with Detours',
  gift: { title: 'Jacob and the Heavenly Stairway in a Dream' },
  stages: [
    {
      title: 'Twins',
      ref: 'Genesis 25:19–34',
      audio: 'audio/abenteuer/jakob/geschichte-01-en-v2.mp3',
      text: [
        'Isaac, the son Abraham waited for so long, has grown up and married Rebekah. The two of them also have to wait a long time for a child, and Isaac prays to God. God hears him, and Rebekah gives birth to twins.',
        'Even at birth you can see how different the two boys are. The first comes out reddish and covered with hair like a fur coat, and they name him Esau. Right behind him comes his brother, holding on to the heel of the firstborn, and they name him Jacob.',
        'The boys grow up. Esau becomes a hunter who likes best to be out in the fields, and Jacob stays quietly near the tents. Isaac is especially fond of Esau, and Rebekah is especially fond of Jacob.',
        'One day Esau comes home from hunting, tired and hungry, and Jacob has just cooked a lentil stew. “Give me some of that red stew, quick, I am worn out!” begs Esau. “You can have it,” says Jacob, “if you give me your birthright.” That is the special place of the oldest son in the family. “I am dying of hunger,” cries Esau, “what good is it to me?” He swears it to Jacob, eats and drinks, and goes away. His birthright does not matter to him.'
      ],
      task: { hint: 'Tap the sheep and count them.' },
      questions: [
        { q: 'What are the twins of Isaac and Rebekah called?', options: ['Esau and Jacob', 'Isaac and Lot', 'Cain and Abel'] },
        { q: 'What does Esau give away for the lentil stew?', options: ['his birthright', 'his tent', 'his bow'] }
      ]
    },
    {
      title: 'The Blessing',
      ref: 'Genesis 27:1–45',
      audio: 'audio/abenteuer/jakob/geschichte-02-en-v2.mp3',
      text: [
        'Isaac has grown old, and his eyes are so weak that he can hardly see anything. One day he calls Esau to him, “My son, go hunting and prepare my favorite meal for me. Then I will bless you before I die.”',
        'Rebekah has heard it. She says to Jacob, “Get the blessing in Esau’s place! I will cook the meal, and you bring it to your father.” Jacob hesitates, because his father might recognize him. But Rebekah ties goatskin around his hands and neck so that he is as rough as Esau, and he puts on Esau’s clothes.',
        'So Jacob comes to his father. “Who are you, my son?” asks Isaac. “I am Esau, your oldest,” answers Jacob. That is not true. Isaac wonders about the voice, but the hands feel like Esau’s hands. So he blesses him.',
        'Hardly has Jacob left when Esau comes with the meal. When Isaac realizes what has happened, he is shocked, and Esau cries out in pain, “Bless me, too, Father!” But the blessing has already been given. Esau is so angry that Rebekah becomes afraid for Jacob and sends him to her brother Laban in Haran, far away.',
        'Jacob packs his bundle and goes. He has deceived his father, and that has consequences: He has to leave his home.'
      ],
      task: { hint: 'This stage is serious. Listen carefully and answer the questions.' },
      questions: [
        { q: 'Who is old and can hardly see?', options: ['Isaac', 'Laban', 'Esau'] },
        { q: 'What does Jacob put on his hands and neck?', options: ['goatskin', 'flour', 'clay'] },
        { q: 'Where does Rebekah send Jacob?', options: ['to her brother Laban', 'to Esau', 'to the sea'] }
      ]
    },
    {
      title: 'The Heavenly Stairway',
      ref: 'Genesis 28:10–22',
      audio: 'audio/abenteuer/jakob/geschichte-03-en-v3.mp3',
      text: [
        'Jacob walks far, away from home. When the sun goes down, he stops for the night at a place among stones. He pushes a stone under his head and falls asleep.',
        'Then he has a dream. A stairway stands on the earth, and its top reaches up to heaven, and angels of God go up and down on it.',
        'And at the top God speaks to him, “I am the God of your fathers Abraham and Isaac. The land you are lying on I will give to you and your descendants. They will be as many as the dust of the earth, and through you all the families of the earth will be blessed. Look, I am with you and watch over you wherever you go. I will bring you back to this land, and I will not leave you.”',
        'When Jacob wakes up, he is quiet with wonder. “God is in this place,” he says, “and I did not know it!” Early in the morning he sets up the stone he slept on as a sign and pours oil over it. He calls the place Bethel, which means “house of God.” And he promises, “If God stays with me and watches over me on my way, then he will be my God.” Then he travels on, no longer as alone as he was the evening before.'
      ],
      task: { hint: 'Slide the tiles until the stairway to heaven is whole again.', slide: { rounds: [{ hint: 'Round 1: Slide a tile into the free gap.' }, { hint: 'Round 2: Now there are more tiles.' }] } },
      questions: [
        { q: 'What does Jacob use as a pillow?', options: ['a stone', 'a fur', 'a sack'] },
        { q: 'What does Jacob call the place?', options: ['Bethel', 'Haran', 'Mamre'] }
      ]
    },
    {
      title: 'At the Well',
      ref: 'Genesis 29:1–14',
      audio: 'audio/abenteuer/jakob/geschichte-04-en-v2.mp3',
      text: [
        'After many days Jacob reaches the land of his relatives. In an open field he sees a well with a large stone over its opening, and shepherds are waiting beside it with their flocks. “Where are you from?” asks Jacob. “From Haran.” “Do you know Laban?” “We know him. And here comes his daughter Rachel with the sheep!”',
        'The shepherds water their animals only when all the flocks have arrived and they can roll away the heavy stone together. But when Jacob sees Rachel with her father’s sheep, he steps forward, rolls the stone from the well all by himself, and waters her sheep.',
        'Then he tells Rachel who he is: a relative, the son of Rebekah, her father’s sister. He weeps aloud for joy. Rachel runs home and tells her father everything.',
        'Laban hurries to meet Jacob, throws his arms around him, and takes him into his house. Jacob tells him what has happened, and Laban says, “You truly belong to my family!” After the long journey, Jacob has found a place where he can stay.'
      ],
      task: { hint: 'Turn the crank in a circle with your finger.', crank: { rounds: [{ hint: 'Round 1: Fetch a bucket of water for the sheep.' }, { hint: 'Round 2: Now the whole flock is drinking: three buckets.' }] } },
      questions: [
        { q: 'What lies over the well that Jacob finds?', options: ['a large stone', 'a wooden lid', 'a cloth'] },
        { q: 'Whom does Jacob meet at the well?', options: ['Rachel', 'Leah', 'Rebekah'] }
      ]
    },
    {
      title: 'Seven Years for Rachel',
      ref: 'Genesis 29:15–30',
      audio: 'audio/abenteuer/jakob/geschichte-05-en-v2.mp3',
      text: [
        'Jacob has been staying with Laban for a month when Laban says, “You are my relative, and you should not work for me for nothing. Tell me, what should your wages be?” Laban has two daughters, Leah, the older, and Rachel, the younger. Jacob loves Rachel with all his heart.',
        '“I will serve you seven years,” he says, “if I may marry Rachel.” Laban agrees. Jacob works for seven years, and because he loves Rachel so much, they seem to him like only a few days.',
        'Then Laban invites all the people to the wedding feast. But in the evening he brings not Rachel to Jacob but his older daughter Leah, and Jacob does not notice until morning. It is a bitter surprise. “Why have you done this?” he asks Laban. “In our country we do not give the younger daughter before the older,” answers Laban.',
        '“Finish the wedding week with Leah,” he says, “then you will get Rachel, too, if you work for me another seven years.” Jacob agrees, and after the week Rachel becomes his wife as well. So he stays with Laban another seven years.'
      ],
      task: { hint: 'Drag the seasons into the gaps, year after year.', cycle: { tokens: [{ label: 'Spring: a branch with blossoms' }, { label: 'Summer: a sun with ears of grain' }, { label: 'Autumn: falling leaves' }, { label: 'Winter: a rain cloud with drops' }], rounds: [{ hint: 'Two years go by. Which sign is missing in the gap?' }, { hint: 'Seven years go by. Fill in the missing signs, even at the end of the row.' }] } },
      questions: [
        { q: 'How many years does Jacob work for Rachel at first?', options: ['seven', 'two', 'twenty'] },
        { q: 'Whom does Laban bring to Jacob on the wedding evening?', options: ['Leah', 'Rachel', 'Rebekah'] }
      ]
    },
    {
      title: 'The Big Family',
      ref: 'Genesis 29:31 to 30:24',
      audio: 'audio/abenteuer/jakob/geschichte-06-en-v2.mp3',
      text: [
        'Jacob loves Rachel more than Leah, but God sees that Leah is loved less, and he gives her a son. She names him Reuben, for she says, “God has seen my misery.” Then she has Simeon and Levi, and when her fourth son is born, she cries, “Now I will thank God!” So she names him Judah.',
        'But Rachel has no child, and that makes her sad, because her sister has so many sons. Her maid Bilhah and Leah’s maid Zilpah also have sons: Dan, Naphtali, Gad, and Asher. Besides these come Leah’s sons Issachar and Zebulun and a daughter, Dinah.',
        'Rachel waits and prays. At last God remembers her, and she has a son. “His name shall be Joseph,” she says, “which means: May he add. God has taken my shame away from me, and I ask him for one more son.”',
        'Jacob’s tent is now full of children: eleven sons and one daughter. And the youngest of all, Joseph, is the son of Rachel, whom Jacob loves the most.'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'What is Rachel’s first son called?', options: ['Joseph', 'Reuben', 'Judah'] },
        { q: 'Whom does Leah want to thank after Judah is born?', options: ['God', 'Rachel', 'Jacob'] }
      ]
    },
    {
      title: 'The Herds Grow',
      ref: 'Genesis 30:25 to 31:16',
      audio: 'audio/abenteuer/jakob/geschichte-07-en-v2.mp3',
      text: [
        'When Joseph is born, Jacob says to Laban, “Let me go home to my own land now with my family. You know how faithfully I have served you.” But Laban does not want to let him go, “I have noticed that God blesses me because of you. Tell me what I should give you as wages.”',
        'Jacob asks for the speckled and dark animals of the herd as his wages, and Laban agrees. But God blesses Jacob, and his herds grow larger and larger. He owns sheep, goats, camels, and donkeys, and many servants.',
        'Laban’s sons grumble that Jacob has taken everything from their father, and Laban’s face is no longer as friendly as before. Then God says to Jacob, “Go back to the land of your fathers, to your family. I will be with you.”',
        'Jacob calls Rachel and Leah out into the field and tells them how often their father has changed his wages and how God has kept him safe all the same. “We will go with you,” both say. “Do what God has told you.”'
      ],
      task: { hint: 'Compare the herds and guess how many animals there are.', guess: { rounds: [{ hint: 'Which herd is bigger? Tap it.' }, { hint: 'About how many animals are there? Choose what fits best.' }] } },
      questions: [
        { q: 'What does Jacob want to do after Joseph is born?', options: ['return to his homeland', 'build a new tent', 'stay with Laban'] },
        { q: 'What does God say to Jacob?', options: ['Go back to the land of your fathers.', 'Stay with Laban.', 'Build a city.'] }
      ]
    },
    {
      title: 'The Way Home',
      ref: 'Genesis 31:17–55',
      audio: 'audio/abenteuer/jakob/geschichte-08-en-v2.mp3',
      text: [
        'Jacob sets out. He puts his wives and children on the camels, gathers his herds, and takes with him everything he has gained. Laban has just gone off to shear his sheep, and so Jacob leaves in secret, across the river toward the mountains of Gilead.',
        'On the third day Laban finds out. At once he chases after Jacob with his men, for seven days, until he catches up with him in the mountains. But the night before, God has spoken to Laban in a dream, “Be careful not to speak harshly to Jacob!”',
        '“Why did you run away in secret?” asks Laban. “I would have sent you off with music, and I would have liked to kiss my grandchildren and daughters goodbye.” Jacob reminds him of the twenty years in which he worked for him day and night, in heat and in frost. “If God had not been with me,” he says, “you would have sent me away empty-handed.”',
        'Then Laban gives in. The two make peace. Jacob sets up a large stone, and the others gather stones into a heap, on which they eat together. The heap is to be a witness and is called Mizpah, which means “watchtower,” because Laban says, “May God keep watch between you and me when we are out of each other’s sight.” The next morning Laban kisses his grandchildren and daughters and goes home.'
      ],
      task: { hint: "Push Jacob's and Laban's stones to the middle together.", cairn: { rounds: [{ hint: 'Push both stones to the middle together. Tap left and right in turn, or use two fingers.' }, { hint: 'Once more, with longer ways. The heap grows higher.' }] } },
      questions: [
        { q: 'Who speaks to Laban in a dream?', options: ['God', 'Jacob', 'Isaac'] },
        { q: 'What does the heap of stones between Jacob and Laban stand for?', options: ['their peace', 'a house', 'a grave'] }
      ]
    },
    {
      title: 'Angels and Gifts',
      ref: 'Genesis 32:1–21',
      audio: 'audio/abenteuer/jakob/geschichte-09-en-v2.mp3',
      text: [
        'Laban is gone, and Jacob travels on. On the way, angels of God meet him. “This is God’s camp!” cries Jacob, and he names the place Mahanaim, which means “two camps.”',
        'But soon the worry comes back, for ahead of him lies the land of his brother Esau. Jacob sends messengers ahead, “Your servant Jacob sends you greetings. I stayed with Laban a long time, but now I have sheep, cattle, donkeys, and servants, and I hope you will welcome me kindly.” The messengers return, “Esau is coming to meet you, with four hundred men.”',
        'Jacob becomes very afraid. He divides his people and herds into two camps, so that at least one can escape if Esau attacks the other. Then he prays, “God of my fathers, you said to me: Go home, I will do you good. I am too small for all you have given me. I crossed the Jordan with only my staff, and now I have two camps. Save me from my brother!”',
        'Then Jacob chooses a gift for Esau from his herds: goats, sheep, camels, cows, and donkeys, each kind as a herd of its own. His servants are to drive them toward Esau one by one, with space between them. “I will make peace with him through the gift,” Jacob thinks, “maybe then he will welcome me kindly.”'
      ],
      task: { hint: 'Listen carefully and answer the questions.' },
      questions: [
        { q: 'Whom does Jacob meet on the way?', options: ['angels of God', 'robbers', 'shepherds'] },
        { q: 'What does Jacob send ahead to meet Esau?', options: ['animals as a gift', 'a letter', 'a sword'] }
      ]
    },
    {
      title: 'Wrestling at the River',
      ref: 'Genesis 32:22–32',
      audio: 'audio/abenteuer/jakob/geschichte-10-en-v2.mp3',
      text: [
        'The gifts go ahead, and Jacob stays in the camp that night. In the middle of the night he gets up, takes his wives, his children, and everything he has, and brings them safely across the ford of the Jabbok River. He himself stays behind alone on the other side.',
        'Then a man comes and wrestles with him until daybreak. The man touches Jacob’s hip, and from then on it hurts him.',
        'When dawn comes, the man says, “Let me go, the day is breaking!” But Jacob holds on, “I will not let you go unless you bless me.” “What is your name?” asks the man. “Jacob.” “You will no longer be called Jacob, but Israel, for you have struggled with God and with people and have not given up.” And he blesses him there.',
        'Jacob names the place Peniel, which means “face of God.” “I have seen God face to face,” he says, “and I am still alive.” As the sun rises, he travels on, limping. But he has a new name and God’s blessing.'
      ],
      task: { hint: 'Hold the light until morning comes.', hold: { rounds: [{ hint: 'Round 1: Put your finger on the light and hold it.' }, { hint: 'Round 2: Now the light moves along the bank: go with it.' }] } },
      questions: [
        { q: 'At which river is Jacob that night?', options: ['the Jabbok', 'the Jordan', 'the Nile'] },
        { q: 'What new name does Jacob receive?', options: ['Israel', 'Esau', 'Isaac'] }
      ]
    },
    {
      title: 'Reunion',
      ref: 'Genesis 33:1–11',
      audio: 'audio/abenteuer/jakob/geschichte-11-en-v2.mp3',
      text: [
        'When Jacob looks up, he sees Esau coming, with four hundred men. He arranges his family: the maids with their children in front, then Leah with hers, and Rachel with Joseph at the very back. He himself goes ahead of them all and bows down to the ground seven times as he comes closer to his brother.',
        'But Esau runs to meet him! He hugs him, throws his arms around his neck, and kisses him, and both weep for joy.',
        '“Who are these with you?” asks Esau when he sees the women and children. “They are the children God has given me,” answers Jacob. They all come forward and bow.',
        '“What are all these herds I met?” asks Esau. “They are a gift for you,” says Jacob. “I have enough, my brother, keep what is yours.” But Jacob pleads, “Please take it! Seeing your face is like seeing the face of God, you have welcomed me so kindly.” Then Esau accepts the gift. The quarrel of the brothers has turned into peace.'
      ],
      task: { hint: 'Put the picture of the reunion together.' },
      questions: [
        { q: 'What does Esau do when he sees Jacob?', options: ['He runs to him and hugs him.', 'He runs away.', 'He sends him away.'] },
        { q: 'What does Jacob bring his brother?', options: ['animals as a gift', 'a sword', 'a tent'] }
      ]
    },
    {
      title: 'Twelve Sons',
      ref: 'Genesis 35:1–20; 35:22–26; 37:1–4',
      audio: 'audio/abenteuer/jakob/geschichte-12-en-v2.mp3',
      text: [
        'God says to Jacob, “Go to Bethel and build an altar there.” Jacob sets out with his whole family, and in Bethel, where he once slept alone on a stone, he builds the altar. God speaks to him once more, “Your name is Jacob, but you shall be called Israel. Many nations will come from you, and the land I gave to Abraham and Isaac I will give to you and your descendants.” Jacob sets up a stone again and pours oil over it.',
        'Then they travel on. Shortly before Ephrath, Rachel’s second son is born, Benjamin, and Rachel dies. Jacob is very sad and sets up a stone on her grave.',
        'Now Jacob has twelve sons: Reuben, Simeon, Levi, Judah, Issachar, and Zebulun, Joseph and Benjamin, Dan and Naphtali, Gad and Asher. From them the people of Israel will come, who carry their father’s new name.',
        'Jacob lives in the land of Canaan, where his father lived as a stranger. Joseph, the son of his old age, is the dearest to him, and he has a colorful robe made for him. When the brothers see that their father loves Joseph more than them, they become angry with him and can no longer speak a friendly word to him. Here a new story begins, the story of Joseph.'
      ],
      task: { hint: 'Place the twelve sons evenly round the altar.', ring: { rounds: [{ hint: 'Place the four sons round the altar, with the same gap between them.' }, { hint: 'Now all twelve sons. They stand like the hours of a clock.' }] } },
      questions: [
        { q: 'Where does Jacob go at God’s word?', options: ['to Bethel', 'to Haran', 'to Egypt'] },
        { q: 'Which son does Jacob love best?', options: ['Joseph', 'Benjamin', 'Reuben'] }
      ]
    }
  ],
  exam: [
    { q: 'What are the twins of Isaac and Rebekah called?', options: ['Esau and Jacob', 'Isaac and Lot', 'Cain and Abel'] },
    { q: 'What does Jacob put on his hands so that his father takes him for Esau?', options: ['goatskin', 'flour', 'clay'] },
    { q: 'What does Jacob use as a pillow in the night?', options: ['a stone', 'a fur', 'a sack'] },
    { q: 'How many sons does Jacob have in the end?', options: ['twelve', 'seven', 'three'] },
    { q: 'What is Jacob called after that night at the river?', options: ['Israel', 'Esau', 'Isaac'] },
    { q: 'What does Esau do when he sees Jacob again?', options: ['He runs to him and hugs him.', 'He runs away.', 'He sends him away.'] }
  ]

}
