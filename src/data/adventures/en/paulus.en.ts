/**
 * English texts of the adventure "Paul" (8 to 10 years): the same shape as `../paulus.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Acts 7; 8; 9; 11; 13; 15; 16; 18); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Paulus/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Paulus/tools/bauen_paulus.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const paulusEn: TextOverlay<Journey> = {
  title: 'Paul',
  subtitle: 'From Persecutor to Messenger',
  gift: { title: 'In a Basket over the Wall' },
  stages: [
    {
      title: 'Light on the Way',
      ref: 'Acts 9:1–9',
      text: [
        'In Jerusalem lives a young man named Saul. Saul was there when Stephen was killed. After that he goes into the houses of the church, takes out men and women and brings them to prison.',
        'Now Saul wants to go to Damascus too. The high priest gives him letters. Whoever there believes in Jesus, Saul is to bring bound to Jerusalem.',
        'Near Damascus, suddenly a light from heaven shines round about him. Saul falls to the earth and hears a voice: “Saul, Saul, why persecutest thou me?” “Who art thou, Lord?” he asks. “I am Jesus whom thou persecutest,” says the voice. “Arise, and go into the city, and it shall be told thee what thou must do.”',
        'The men who travel with him stand speechless. They hear the voice, but they see no man. Saul gets up. He opens his eyes and sees nothing. So they lead him by the hand and bring him into Damascus. For three days he cannot see, and he neither eats nor drinks.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What shines round about Saul near Damascus?', options: ['a light from heaven', 'a fire from the forest', 'a storm from the desert'] },
        { q: 'What does the voice ask?', options: ['“Saul, Saul, why persecutest thou me?”', '“Saul, where are you going so early?”', '“Saul, why are you sleeping here?”'] },
        { q: 'How long can Saul not see?', options: ['three days', 'seven days', 'one day'] }
      ]
    },
    {
      title: 'Ananias',
      ref: 'Acts 9:10–19',
      text: [
        'In Damascus lives a disciple named Ananias. In a vision the Lord calls him: “Ananias!” “Behold, I am here, Lord,” he answers. “Go into the street which is called Straight,” says the Lord. “Ask in the house of Judas for Saul of Tarsus. He is praying. In a vision he has seen a man named Ananias coming in and putting his hand on him, so that he might receive his sight.”',
        '“Lord,” Ananias answers, “I have heard from many how much evil this man has done to your people in Jerusalem.” But the Lord says: “Go thy way! I have chosen him. He shall bear my name before the Gentiles, and kings, and the children of Israel.”',
        'So Ananias goes his way and enters into the house. He puts his hands on Saul and says: “Brother Saul, the Lord, even Jesus, that appeared unto thee in the way, has sent me. You shall receive your sight and be filled with the Holy Ghost.”',
        'At once something like scales falls from Saul’s eyes, and he can see again. He gets up and is baptized. Then he eats and is strengthened.'
      ],
      task: {
        hint: 'Lead Ananias across the streets to the house of Judas; go only when the way is clear.',
        straightStreet: {
          rounds: [{ hint: 'Lead Ananias across the streets to the house of Judas. Go only when the way is clear.' }, { hint: 'Now there are more streets, and the animals come from both sides. The Straight street has two lanes.' }]
        }
      },
      questions: [
        { q: 'Into which street shall Ananias go?', options: ['the street which is called Straight', 'the street by the city gate', 'the street of the potters'] },
        { q: 'What falls from Saul’s eyes?', options: ['something like scales', 'a dark cloth', 'a drop of oil'] }
      ]
    },
    {
      title: 'In a Basket over the Wall',
      ref: 'Acts 9:19–26',
      text: [
        'Saul stays for some days with the disciples in Damascus. Soon he preaches Christ in the synagogues: “He is the Son of God.” All who hear him are amazed. “Is not this the man who in Jerusalem persecuted all who call on this name?”',
        'Saul speaks more and more strongly. He shows the Jews in Damascus that Jesus is the Christ. After many days some of them decide to kill him. Day and night they watch the gates of the city.',
        'But Saul learns of their plan. In the night the disciples take him to the city wall. They put him into a basket and let him down through an opening in the wall.',
        'At the bottom Saul climbs out of the basket. He is outside the city and sets off on the way to Jerusalem.'
      ],
      task: {
        hint: 'Let the basket with Saul down, but only when no guard is near.',
        lower: {
          rounds: [{ hint: 'Hold the rope and the basket goes down. Let go when the guard comes.' }, { hint: 'Down once more, and now the guard comes twice.' }],
          texts: { field: 'The wall of Damascus: the basket is let down', done: 'Saul is safely down.' }
        }
      },
      questions: [
        { q: 'What does Saul say about Jesus in the synagogues?', options: ['He is the Son of God.', 'He is a fisherman.', 'He is a teacher from Rome.'] },
        { q: 'When do the disciples bring Saul to the wall?', options: ['in the night', 'at noon', 'in the early evening'] }
      ]
    },
    {
      title: 'Barnabas Stands by Him',
      ref: 'Acts 9:26–30; 11:22–26',
      text: [
        'Saul comes to Jerusalem and wants to join himself to the disciples. But they are all afraid of him. They do not believe that he is really a disciple.',
        'Then Barnabas takes him and brings him to the apostles. He tells them how Saul saw the Lord in the way and that the Lord spoke to him. And he tells how Saul preached boldly at Damascus in the name of Jesus. Now Saul stays with them and goes in and out in Jerusalem. But some want to kill him. So the brethren bring him down to Caesarea and send him on to Tarsus.',
        'After a while the church sends Barnabas to Antioch. There many people believe in the Lord, and Barnabas is glad.',
        'Then Barnabas departs to Tarsus to seek Saul. When he has found him, he brings him to Antioch. For a whole year the two of them teach much people there. In Antioch the disciples are called Christians for the first time.'
      ],
      task: {
        hint: 'Remember what Saul looks like and tap him when he walks by in Tarsus.',
        refind: {
          people: [{ name: 'A man with a black beard and a grey cloak, bareheaded' }, { name: 'A man with a grey beard and a grey cloak' }, { name: 'A man with a black beard and a brown cloak' }, { name: 'A man with a black beard, a grey cloak and a white turban' }, { name: 'A plump merchant in a striped robe' }, { name: 'A woman with a water jar' }, { name: 'A boy with a basket of figs' }],
          rounds: [{ hint: 'Remember what Saul looks like. Tap him when he walks by in Tarsus.' }, { hint: 'Now more people walk by, in two rows. Three look very like Saul.' }]
        }
      },
      questions: [
        { q: 'Who brings Saul to the apostles?', options: ['Barnabas', 'Ananias', 'Stephen'] },
        { q: 'What are the disciples called for the first time in Antioch?', options: ['Christians', 'Galileans', 'pilgrims'] }
      ]
    },
    {
      title: 'Sent Forth',
      ref: 'Acts 13:1–6, 9; 4:36',
      text: [
        'The church in Antioch has prophets and teachers. Barnabas and Saul are among them, and three other men. Once, as they minister to the Lord, they fast, which means they eat nothing for a while. Then the Holy Ghost says: “Separate me Barnabas and Saul for the work whereunto I have called them.”',
        'The church fasts and prays. Then they lay their hands on the two and send them away.',
        'Barnabas and Saul go to Seleucia by the sea. There they board a ship and sail to the island of Cyprus. Barnabas comes from this island. A man named John goes with them as a helper.',
        'In the city of Salamis they preach the word of God in the synagogues. Then they go through the whole island. Saul has a second name: Paul. From then on the book of Acts calls him Paul.'
      ],
      task: {
        hint: 'Turn the sail so that the wind fills it, and sail to Cyprus.',
        sailTrim: {
          rounds: [{ hint: 'Turn the sail so that the wind fills it, and sail to Cyprus.' }, { hint: 'Now the wind turns more often. In a gust you need not turn anything.' }]
        }
      },
      questions: [
        { q: 'Whom shall the church separate for the work?', options: ['Barnabas and Saul', 'Peter and John', 'Ananias and Judas'] },
        { q: 'Where do the two sail?', options: ['to the island of Cyprus', 'to Egypt', 'to Rome'] }
      ]
    },
    {
      title: 'The Call to Macedonia',
      ref: 'Acts 15:40; 16:1–11',
      text: [
        'Some time later Paul sets out again, this time with Silas. In the town of Lystra a disciple named Timotheus joins them.',
        'They go throughout Phrygia and the region of Galatia. But the Holy Ghost forbids them to preach the word in the province of Asia. At the border of Mysia they try to go into Bithynia. But the Spirit does not allow it.',
        'So they pass by Mysia and come down to Troas by the sea. In the night Paul has a vision. A man of Macedonia stands there and begs him: “Come over into Macedonia, and help us!”',
        'At once they get ready for the journey. They are sure that the Lord has called them to preach the gospel to the people there. From Troas they sail across.'
      ],
      task: {
        hint: 'At every fork, find the way that is open.',
        way: {
          texts: { hint: 'Fork {n} of {total}: find the way that is open.', right: 'This way is open.', wrong: 'Here the Spirit does not let them go on. Find the other way.', done: 'Troas! And now over to Macedonia.' }
        }
      },
      questions: [
        { q: 'Where does the Spirit not let them go?', options: ['into Bithynia', 'to Troas', 'to Galatia'] },
        { q: 'What does the man of Macedonia ask?', options: ['Come over and help us!', 'Stay in Troas and rest!', 'Go back to Antioch!'] }
      ]
    },
    {
      title: 'Lydia by the River',
      ref: 'Acts 16:12–15',
      text: [
        'Paul and his companions come to Philippi. It is the chief city of that part of Macedonia. They stay there for some days.',
        'On the sabbath they go out of the city by a river side. People come together there to pray. Paul and the others sit down and speak to the women who have come.',
        'One of them is named Lydia. She comes from the city of Thyatira and is a seller of purple, a precious colour for cloth. Lydia worships God. She listens, and the Lord opens her heart. She pays close attention to what Paul says.',
        'Lydia is baptized, together with all who live in her house. Then she asks: “If you judge that I am faithful to the Lord, come into my house and abide there.” She does not give up until the men come with her.'
      ],
      task: {
        hint: 'Dye each cloth exactly like the sample; every dip makes the colour stronger.',
        dye: {
          customers: [{ name: 'A customer from Philippi' }, { name: 'A man from Philippi' }, { name: 'An old woman from Philippi' }],
          rounds: [{ hint: 'Dye each cloth exactly like the sample. Every dip makes the colour stronger.' }, { hint: 'Now the colour comes from both vats. Look closely at the sample.' }]
        }
      },
      questions: [
        { q: 'What does Lydia sell?', options: ['purple', 'spices', 'fish'] },
        { q: 'Where do Paul and the others speak with Lydia?', options: ['outside by the river', 'in the market place', 'at the harbour'] }
      ]
    },
    {
      title: 'Songs at Midnight',
      ref: 'Acts 16:16–34',
      text: [
        'In Philippi, in the name of Jesus, Paul has helped a girl through whom her masters made much money. Now that is over. So her masters become angry with Paul and Silas. They bring the two before the rulers of the city. The rulers have Paul and Silas beaten and cast into prison. The keeper shuts them in the inner prison and makes their feet fast in the stocks.',
        'At midnight Paul and Silas pray and sing praises unto God. The other prisoners hear them. Suddenly there is a great earthquake. The ground under the prison is shaken, all the doors are opened, and everyone’s bands are loosed.',
        'The keeper wakes up and sees the open doors. He thinks the prisoners are gone. But Paul cries with a loud voice: “We are all here!” The keeper calls for a light, springs in and falls down trembling before Paul and Silas. “What must I do to be saved?” he asks.',
        '“Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house,” they answer. That same night he washes their wounds. He and all his house are baptized. Then he sets food before them and rejoices with everyone in his house.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What do Paul and Silas do at midnight?', options: ['They pray and sing praises.', 'They sleep soundly in the straw.', 'They shout loudly for help.'] },
        { q: 'What does Paul call out to the keeper?', options: ['“We are all here!”', '“Let us out at once!”', '“Bring us something to eat!”'] },
        { q: 'What does the keeper ask?', options: ['“What must I do to be saved?”', '“Who opened the doors?”', '“When will morning come?”'] }
      ]
    },
    {
      title: 'Tentmakers in Corinth',
      ref: 'Acts 18:1–5',
      text: [
        'Later Paul comes to the city of Corinth. There he finds a Jew named Aquila. He was born in Pontus and has lately come from Italy with his wife Priscilla. For the emperor Claudius has commanded all Jews to depart from Rome.',
        'Paul goes to the two of them. Aquila and Priscilla are tentmakers, and Paul has the same craft. So he stays with them, and they make tents together.',
        'Every sabbath Paul goes to the synagogue. There he reasons with Jews and Greeks and tries to persuade them.',
        'Then Silas and Timotheus come from Macedonia to Corinth. Now Paul testifies to the Jews that Jesus is the Christ.'
      ],
      task: {
        hint: 'Bring every piece to the right table: first cut, then sew, then the ropes.',
        tentShop: {
          tables: [{ name: 'The table for cutting, with Aquila' }, { name: 'The table for sewing, with Priscilla' }, { name: 'The table for the ropes, with Paul' }],
          rounds: [{ hint: 'Bring every piece to the right table: first cut, then sew, then the ropes.' }, { hint: 'Now four pieces come, and new cloth comes as soon as the first table is free.' }]
        }
      },
      questions: [
        { q: 'Where have Aquila and Priscilla come from?', options: ['from Italy', 'from Egypt', 'from Damascus'] },
        { q: 'When does Paul go to the synagogue?', options: ['every sabbath', 'every morning', 'once a year'] }
      ]
    }
  ],
  exam: [
    { q: 'What shines round about Saul near Damascus?', options: ['a light from heaven', 'a rainbow', 'a fire on the mountain'] },
    { q: 'Who puts his hands on Saul in Damascus?', options: ['Ananias', 'Barnabas', 'Silas'] },
    { q: 'How does Saul get out of Damascus?', options: ['in a basket over the wall', 'on a horse through the gate', 'in a boat across the river'] },
    { q: 'Who asks Paul in the night to come to Macedonia?', options: ['a man of Macedonia', 'a captain from Troas', 'a king from Rome'] },
    { q: 'What do Paul and Silas answer the keeper?', options: ['Believe on the Lord Jesus Christ.', 'Let us go free.', 'Take us to Rome.'] },
    { q: 'What craft do Paul, Aquila and Priscilla have?', options: ['They make tents.', 'They build ships.', 'They bake bread.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-v1.mp3; a stage without a number in this list is read with the voice of the device
const WITH_ENGLISH_RECORDING = [1, 2, 3, 4, 5, 6, 7, 8, 9]
paulusEn.stages!.forEach((s, i) => {
  if (WITH_ENGLISH_RECORDING.includes(i + 1)) s.audio = `audio/abenteuer/paulus/geschichte-${String(i + 1).padStart(2, '0')}-en-v1.mp3`
})
