/**
 * English texts of the adventure "Pentecost" (8 to 10 years): the same shape as `../pfingsten.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (Acts 1; 2; 3; 4; 8; 10; 12); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-Pfingsten/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-Pfingsten/tools/bauen_pfingsten.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

export const pfingstenEn: TextOverlay<Journey> = {
  title: 'Pentecost',
  subtitle: 'Ye shall be witnesses unto me',
  gift: { title: 'The Sheet with the Animals' },
  stages: [
    {
      title: 'Unto the Uttermost Part of the Earth',
      ref: 'Acts 1:3–14',
      text: [
        'For forty days after he rose from the dead, Jesus shows himself to the apostles and speaks with them about the kingdom of God. “Do not leave Jerusalem,” he tells them. “Wait for what the Father has promised. John baptized with water. But you shall be baptized with the Holy Ghost, not many days from now.”',
        'Then he says: “You shall receive power when the Holy Ghost comes upon you. And you shall be witnesses unto me in Jerusalem, in all Judaea and Samaria, and unto the uttermost part of the earth.”',
        'When he has said this, he is taken up while they watch, and a cloud receives him out of their sight. As they look after him, two men in white clothes stand beside them. “You men of Galilee, why do you stand gazing up into heaven?” they ask. “This same Jesus shall come again in the same way as you have seen him go into heaven.”',
        'The apostles walk back from the mount called Olivet to Jerusalem and go up into an upper room. There they stay together and pray, with the women, with Mary the mother of Jesus, and with his brothers.'
      ],
      task: {
        hint: 'Carry the message from Jerusalem ring by ring to the uttermost part of the earth.',
        witness: {
          places: [{ name: 'Jerusalem' }, { name: 'Judaea' }, { name: 'Samaria' }, { name: 'The uttermost part of the earth' }],
          rounds: [{ hint: 'Carry the message from Jerusalem ring by ring to the uttermost part of the earth.' }, { hint: 'Pull the light as far as the next ring and let go.' }]
        }
      },
      questions: [
        { q: 'What takes Jesus up before the apostles’ eyes?', options: ['a cloud', 'a chariot of fire', 'a rushing storm'] },
        { q: 'Who prays with the apostles in the upper room?', options: ['Mary, the mother of Jesus', 'Pilate and his wife', 'the shepherds from Bethlehem'] }
      ]
    },
    {
      title: 'Pentecost',
      ref: 'Acts 2:1–13',
      text: [
        'It is the day of Pentecost, and the disciples are all together in one house. Suddenly there comes from heaven a sound like a rushing mighty wind, and it fills the whole house. Then they see tongues like fire, parted among them, and one sits upon each of them. They are all filled with the Holy Ghost and begin to speak in other tongues, as the Spirit gives them the words.',
        'Devout Jews from many nations are living in Jerusalem. When the sound is heard, a great crowd comes running together. Every one of them hears the disciples speak in his own language. “Are not all these men from Galilee?” they ask in wonder. “How is it that each of us hears them in the language he was born with?”',
        'There stand Parthians and Medes, people from Mesopotamia and Egypt, strangers from Rome, Cretes and Arabians. “We hear them speak in our own tongues about the wonderful works of God,” they say.',
        '“What does this mean?” they ask one another. But others mock: “They are full of new wine.”'
      ],
      task: {
        hint: 'Bring each visitor to the land he comes from.',
        tongues: {
          lands: [{ name: 'Egypt' }, { name: 'Crete' }, { name: 'Arabia' }, { name: 'Rome' }, { name: 'Mesopotamia' }, { name: 'The land of the Parthians' }, { name: 'The land of the Medes' }],
          guests: [{ name: 'A visitor from Egypt' }, { name: 'A visitor from Crete' }, { name: 'A visitor from Arabia' }, { name: 'A visitor from Rome' }, { name: 'A visitor from Mesopotamia' }, { name: 'A visitor from the land of the Parthians' }, { name: 'A visitor from the land of the Medes' }],
          rounds: [{ hint: 'Bring each visitor to the land he comes from.' }, { hint: 'Now there are seven visitors, and the little pictures are gone. Look at their clothes and at what they hold in their hands.' }]
        }
      },
      questions: [
        { q: 'What fills the whole house?', options: ['a sound like a rushing mighty wind', 'loud singing of many people', 'heavy rain on the roof'] },
        { q: 'What sits upon each of the disciples?', options: ['a tongue like fire', 'a wreath of flowers', 'a drop of oil'] }
      ]
    },
    {
      title: 'Peter Preaches',
      ref: 'Acts 2:14–41',
      text: [
        'Then Peter stands up with the eleven other apostles and calls out to the crowd: “People of Jerusalem, listen to me! These men are not drunk, for it is only the third hour of the day. This is what the prophet Joel spoke of. God says: I will pour out my Spirit upon all people.”',
        'Then Peter tells them about Jesus of Nazareth. “God did miracles and wonders and signs among you through him, as you yourselves know. You crucified him. This Jesus God has raised up, and we are all witnesses of it. Now he has poured out the Holy Ghost, as you see and hear.”',
        'The words cut them to the heart. “What shall we do?” they ask Peter and the other apostles. “Repent,” Peter answers, “and let every one of you be baptized in the name of Jesus Christ for the forgiveness of sins. Then you shall receive the gift of the Holy Ghost. This promise is for you and your children, and for all who are far off.”',
        'Many gladly receive his word and are baptized. That day about three thousand people are added to them.'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Drag the right leaf into the gap.', parts: ['This Jesus God has raised up, and we are all ', ' of it.'], words: ['witnesses', 'children', 'servants'] },
            { hint: 'Now two words are missing.', parts: ['This ', ' God has ', ' up, and we are all witnesses of it.'], words: ['Jesus', 'raised', 'Moses', 'sent'] }
          ]
        }
      },
      questions: [
        { q: 'What do the people ask Peter and the other apostles?', options: ['What shall we do?', 'Where is your house?', 'When will the king come?'] },
        { q: 'How many people are added that day?', options: ['about three thousand', 'about three hundred', 'about thirty'] }
      ]
    },
    {
      title: 'They Share Everything',
      ref: 'Acts 2:42–47; 4:32–37',
      text: [
        'The new church in Jerusalem holds firmly together. They listen to what the apostles teach, they keep fellowship, they break bread and they pray. And many wonders and signs are done by the apostles.',
        'All who believe stay together, and what they have belongs to all of them. Every day they meet with one accord in the temple. In their houses they break bread and eat together, with gladness and with simple hearts. They praise God, and all the people think well of them. And every day the Lord adds new people to the church.',
        'No one among them is in need. Some who have fields or houses sell them, bring the money and lay it down at the apostles’ feet. From it everyone receives as much as he needs.',
        'One of them is called Joses, a Levite from the island of Cyprus. The apostles call him Barnabas, which means son of consolation. Barnabas has a field. He sells it, brings the money and lays it at the apostles’ feet.'
      ],
      task: {
        hint: 'Share the gifts so that every family has enough.',
        fill: {
          gifts: [{ name: 'A flat loaf' }, { name: 'A small basket' }, { name: 'A big basket' }, { name: 'A sack full of bread' }],
          families: [{ name: 'The old woman' }, { name: 'The father with his child' }, { name: 'The mother with two children' }, { name: 'The big family' }],
          rounds: [{ hint: 'Share out the gifts so that every family has enough.' }, { hint: 'Now there are four families and more gifts. No family should get too much, and at the end nothing is left over.' }]
        }
      },
      questions: [
        { q: 'Where do they break bread and eat together?', options: ['in their houses', 'out in the field', 'in the king’s palace'] },
        { q: 'What does Barnabas do with his field?', options: ['He sells it and brings the money.', 'He sows wheat in it.', 'He builds a house on it.'] }
      ]
    },
    {
      title: 'Silver and Gold Have I None',
      ref: 'Acts 3:1–10',
      text: [
        'One afternoon Peter and John go up to the temple. It is the ninth hour, the hour of prayer. At the gate called Beautiful sits a man who has been lame since he was born. Every day people carry him there. There he asks everyone who goes into the temple for alms, a small gift. He asks Peter and John too.',
        'Peter and John look at him. “Look on us!” says Peter. The man looks at them and waits to receive something from them.',
        '“Silver and gold have I none,” says Peter, “but such as I have give I thee: in the name of Jesus Christ of Nazareth, rise up and walk!” He takes him by the right hand and lifts him up. At once his feet and ankle bones become strong.',
        'The man leaps up; he can stand and walk. He goes with them into the temple, walking and leaping and praising God. All the people see him, and they wonder. Is that not the man who always sat begging at the Beautiful gate?'
      ],
      task: {
        hint: 'Leap with the man up the steps to the temple.',
        hop: {
          rounds: [{ hint: 'Leap with the man up the steps to the temple.' }, { hint: 'Now the stairs are longer. On a landing he stops and praises God.' }]
        }
      },
      questions: [
        { q: 'Where does the lame man sit every day?', options: ['at the Beautiful gate of the temple', 'at the well outside the town', 'on the shore of the lake'] },
        { q: 'What does Peter not have?', options: ['silver and gold', 'bread and water', 'shoes and a cloak'] }
      ]
    },
    {
      title: 'We Cannot but Speak',
      ref: 'Acts 4:1–31',
      text: [
        'Peter and John are still speaking to the people when the priests, the captain of the temple and the Sadducees come. They are angry that the apostles say Jesus has risen from the dead. They keep the two locked up until the morning.',
        'In the morning the council asks: “By what name have you done this?” Peter, filled with the Holy Ghost, answers: “By the name of Jesus Christ of Nazareth this man stands before you whole. God has raised Jesus from the dead. Neither is there salvation in any other.”',
        'The man who was healed is standing with them, and no one can say anything against it. So they command the two never again to speak in the name of Jesus. But Peter and John answer: “We cannot but speak the things which we have seen and heard.”',
        'The council threatens them and lets them go. The two go back to their own company, and they all pray together: “Lord, behold their threatenings, and grant unto thy servants that with all boldness they may speak thy word.” Then the place where they are gathered is shaken. They are filled with the Holy Ghost and speak the word of God boldly.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What makes the priests and the Sadducees angry?', options: ['that the apostles say Jesus has risen', 'that the apostles sell bread in the temple', 'that the apostles sing too loudly'] },
        { q: 'What does the council forbid the two?', options: ['to speak in the name of Jesus', 'to go into the temple', 'to break bread together'] },
        { q: 'What do Peter and John answer?', options: ['We cannot but speak of it.', 'From now on we will be silent.', 'We are going back to Galilee.'] }
      ]
    },
    {
      title: 'Philip and the Treasurer',
      ref: 'Acts 8:26–40',
      text: [
        'Philip tells the people in a city of Samaria about Christ. One day the angel of the Lord sends him south, to the lonely road from Jerusalem to Gaza.',
        'There a man of Ethiopia is riding in his chariot, the treasurer of Candace, queen of the Ethiopians. He has been to Jerusalem to worship and is reading the prophet Isaiah. The Spirit says to Philip: “Go near, and join thyself to this chariot!”',
        'Philip runs to him. “Understandest thou what thou readest?” he asks. “How can I, unless someone guides me?” says the treasurer, and he lets him come up. He is reading: “Like a lamb dumb before his shearer, so opened he not his mouth.” Beginning at this scripture, Philip tells him the good news of Jesus.',
        'They come to some water. “What doth hinder me to be baptized?” asks the treasurer. “If thou believest with all thine heart, thou mayest,” says Philip. “I believe that Jesus Christ is the Son of God,” the treasurer answers. They both go down into the water, and Philip baptizes him. Afterward the Spirit of the Lord catches Philip away. The treasurer goes on his way rejoicing.'
      ],
      task: {
        hint: 'Run with Philip beside the chariot and stay at the window.',
        chariot: {
          rounds: [{ hint: 'Run with Philip beside the chariot and stay at the window.' }, { hint: 'Now the chariot goes faster and then slower. Stay at the window, but do not run in front of the horses.' }]
        }
      },
      questions: [
        { q: 'What is the man reading in his chariot?', options: ['the prophet Isaiah', 'the queen’s letters', 'a list of her treasures'] },
        { q: 'What does the treasurer want when they come to some water?', options: ['to be baptized', 'to water the horses', 'to rest and sleep'] }
      ]
    },
    {
      title: 'The Sheet with the Animals',
      ref: 'Acts 10',
      text: [
        'In Caesarea lives a centurion named Cornelius, who fears God. In a vision an angel of God says to him: “Call for Simon Peter from Joppa.” Cornelius sends three men.',
        'The next day, about noon, Peter is praying on the housetop in Joppa. Then he sees heaven opened. Something like a great sheet, knit at the four corners, is let down, full of four-footed beasts, creeping things and birds. “Rise, Peter; kill, and eat!” says a voice. “Not so, Lord,” answers Peter, “for I have never eaten anything that is unclean.” The voice says: “What God hath cleansed, that call not thou common.” This happens three times.',
        'Just then the men from Cornelius are standing at the gate. The Spirit says to Peter: “Go with them, doubting nothing.”',
        'In the house of Cornelius in Caesarea, Peter says: “God has shown me that I should not call anyone unclean.” Then he listens to Cornelius and says: “Now I see that God is no respecter of persons. In every nation he that fears him and works righteousness is accepted with him.” While Peter is telling them about Jesus, the Holy Ghost falls on all who hear the word. And Peter has them baptized.'
      ],
      task: {
        hint: 'Find the animals in the great sheet.',
        find: { labels: ['A camel', 'A hare', 'A raven', 'A lizard'], doneText: 'You have found all four animals in the great sheet.' }
      },
      questions: [
        { q: 'Who is Cornelius?', options: ['a centurion in Caesarea', 'a fisherman in Joppa', 'a priest in the temple'] },
        { q: 'What falls on all who are listening to Peter?', options: ['the Holy Ghost', 'a great storm', 'a deep sleep'] }
      ]
    },
    {
      title: 'Rhoda at the Gate',
      ref: 'Acts 12:1–17',
      text: [
        'King Herod has Peter taken prisoner. Four groups of four soldiers each guard him in the prison. But the church prays to God for him without ceasing.',
        'In the night Peter sleeps between two soldiers, bound with two chains. Then the angel of the Lord comes, and a light shines in the prison. “Arise up quickly!” he says, and the chains fall off Peter’s hands. “Cast thy garment about thee, and follow me!” Peter follows, thinking it is only a vision. The iron gate into the city opens by itself. After one street the angel is gone.',
        'Peter goes to the house of Mary, the mother of John whose surname was Mark, where many are praying. He knocks at the gate. A girl named Rhoda comes to listen. She knows Peter’s voice, and for gladness she does not open the gate. She runs in and calls: “Peter is standing at the gate!” “You are out of your mind,” the others say. But Rhoda keeps saying it is so.',
        'Peter goes on knocking. When at last they open, they can hardly believe it. He beckons to them to be quiet and tells them how the Lord has brought him out of the prison.'
      ],
      task: {
        hint: 'Rhoda hears Peter’s voice; look through the cracks with her and tap when it is really Peter outside.',
        peek: {
          people: [{ name: 'Peter' }, { name: 'A man with a curly beard and a red tunic' }, { name: 'A man without a beard in a blue-grey tunic and a brown cloak' }, { name: 'An old man with a long grey beard and a staff' }, { name: 'A man with a curly beard and a water jug, without a cloak' }, { name: 'A woman with a head cloth and a basket' }, { name: 'A boy with a little lamp' }],
          rounds: [{ hint: 'Rhoda hears Peter’s voice. Look through the cracks with her and tap when he is really standing at the gate.' }, { hint: 'The cracks are narrow. Tap only when it is really Peter.' }]
        }
      },
      questions: [
        { q: 'What does the church do while Peter is in prison?', options: ['It prays for him without ceasing.', 'It sleeps quietly at home.', 'It secretly leaves the city.'] },
        { q: 'Why does Rhoda not open the gate?', options: ['for gladness', 'for fear', 'because she is looking for the key'] }
      ]
    }
  ],
  exam: [
    { q: 'What shall the apostles receive, Jesus says before the cloud?', options: ['power, when the Holy Ghost comes upon them', 'a great house in Jerusalem', 'a ship for the journey'] },
    { q: 'At Pentecost, how does each person in the crowd hear the disciples?', options: ['in his own language', 'only very quietly, in a whisper', 'not at all, because it is too loud'] },
    { q: 'What does Peter say to the lame man at the Beautiful gate?', options: ['Silver and gold have I none.', 'Come back tomorrow.', 'I have no time today.'] },
    { q: 'Who is reading the prophet Isaiah in the chariot?', options: ['a treasurer from Ethiopia', 'a centurion from Caesarea', 'a girl from Jerusalem'] },
    { q: 'What did God show Peter with the sheet?', options: ['that he should not call anyone unclean', 'that he should become a fisherman again', 'that he should travel to Egypt'] },
    { q: 'Who knows Peter’s voice when he knocks at the gate?', options: ['Rhoda', 'Barnabas', 'Cornelius'] }
  ]
}
