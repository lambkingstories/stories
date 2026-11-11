/**
 * English texts of the adventure "Jesus Tells About Himself" (8 to 10 years): the same shape as `../ichbin.ts`, only the words. Laid over the German data by
 * `localize()`; the right answer is the first option, exactly as in the German data. Names and wording follow the public-domain King James Version
 * (John 3, 4 and 10, Matthew 16 and 17); the stories are retold in our own words. The source as a readable file: D:/Claude/Abenteuer-IchBin/ENGLISCH
 * Generated from the readable file by D:/Claude/Abenteuer-IchBin/tools/bauen_ichbin.py (do not change by hand).
 */
import type { Journey } from '@/types/adventure'
import type { TextOverlay } from '../localize'

/** The texts of the game "From house to house" that replace the ones of Christmas (`TellGame.texts`, see ANMELDUNG.md point 10); spread into the overlay so that the type of the overlay does not have to know them yet. */
const TELL_TEXTS_EN = { texts: { field: 'The village of Sychar from above. The woman stands at the well.', walkers: 'The woman', keys: 'With the arrow keys you choose a house, with Enter the woman goes there. The backspace key takes back the last path.', helpUndo: 'The way ends here. The woman goes one path back.', done: 'Come, see a man, which told me all things that ever I did: is not this the Christ?' } }

export const ichbinEn: TextOverlay<Journey> = {
  title: 'Jesus Tells About Himself',
  subtitle: 'What Jesus says about himself',
  gift: { title: 'The Jar at the Well' },
  stages: [
    {
      title: 'The Visit by Night',
      ref: 'John 3:1–7',
      text: [
        'It is night in Jerusalem. Nicodemus is a Pharisee and one of the leaders of the people. He comes to Jesus.',
        '“Master,” he says, “we know that you are a teacher sent by God. No one can do the miracles that you do unless God is with him.”',
        'Jesus answers him: “I tell you the truth. Unless a man is born again, he cannot see the kingdom of God.”',
        'Nicodemus asks: “How can a man be born when he is old? He cannot go back into his mother’s womb a second time and be born!”',
        'Jesus answers: “I tell you the truth. Unless a man is born of water and of the Spirit, he cannot enter into the kingdom of God. What is born of the flesh is flesh. What is born of the Spirit is spirit. Do not marvel that I said to you: You must be born again.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'When does Nicodemus come to Jesus?', options: ['at night', 'at noon', 'early in the morning'] },
        { q: 'What must a person be to see the kingdom of God, says Jesus?', options: ['born again', 'a Pharisee', 'very rich'] },
        { q: 'What does Nicodemus ask?', options: ['how an old man can be born', 'where Jesus lives', 'when the kingdom of God will come'] }
      ]
    },
    {
      title: 'Like the Wind',
      ref: 'John 3:8–15',
      text: [
        '“The wind blows where it wants to. You hear the sound of it, but you cannot tell where it comes from or where it goes. So it is with everyone who is born of the Spirit.”',
        'Nicodemus asks: “How can this be?”',
        'Jesus answers: “You are a teacher in Israel and you do not know this? I tell you the truth: We speak of what we know, and tell what we have seen. But you do not accept it.”',
        '“I have told you about earthly things, and you do not believe. How will you believe if I tell you about heavenly things?”',
        '“No one has gone up to heaven except the one who came down from heaven, the Son of man, who is in heaven.”',
        '“Moses lifted up a serpent in the wilderness. So the Son of man must be lifted up, so that everyone who believes in him will have eternal life.”'
      ],
      task: {
        hint: 'You cannot see the wind. Look at what it moves, and tap the way it blows.',
        breeze: {
          things: [{ label: 'the flame of the lamp' }, { label: 'a cloth on the line' }, { label: 'an olive twig' }, { label: 'grass' }, { label: 'a leaf' }],
          rounds: [{ hint: 'You cannot see the wind. Look at what it moves, and tap the way it blows.' }, { hint: 'The wind turns. Tap the way it blows at the end, or the calm.' }]
        }
      },
      questions: [
        { q: 'What does Nicodemus not know about the wind?', options: ['where it comes from and where it goes', 'how fast it blows', 'when it will stop'] },
        { q: 'What did Moses lift up in the wilderness?', options: ['a serpent', 'a staff', 'a tent'] }
      ]
    },
    {
      title: 'God So Loved the World',
      ref: 'John 3:16–21',
      text: [
        '“God loved the world so much that he gave his only Son. Everyone who believes in him will not be lost, but will have everlasting life.”',
        '“God did not send his Son into the world to condemn it, but so that the world might be saved through him.”',
        '“If anyone believes in him, he is not condemned. If anyone does not believe, he is condemned already, because he has not believed in the name of God’s only Son.”',
        '“The light has come into the world. But people loved darkness more than light, because their deeds were evil.”',
        '“If anyone does evil, he hates the light and does not come to the light, so that his deeds will not be seen. But if anyone does the truth, he comes to the light, so that it can be seen: His deeds are done in God.”'
      ],
      task: {
        hint: 'Put the missing word into the verse.',
        verse: {
          rounds: [
            { hint: 'Put the missing word into the verse.', parts: ['For God so loved the ', ', that he gave his only begotten Son.'], words: ['world', 'night', 'city'] },
            { hint: 'Now two words are missing.', parts: ['For God so loved the world, that he gave his only begotten ', ', that whosoever believeth in him should not perish, but have everlasting ', '.'], words: ['Son', 'life', 'servant', 'bread'] }
          ]
        }
      },
      questions: [
        { q: 'Why did God send his Son into the world?', options: ['so that the world might be saved', 'so that the world might be condemned', 'so that the world might be afraid'] },
        { q: 'What did people love more than the light?', options: ['the darkness', 'the fire', 'the stars'] }
      ]
    },
    {
      title: 'Give Me a Drink',
      ref: 'John 4:1–9',
      text: [
        'Jesus learns that the Pharisees have heard: He makes more disciples and baptizes more than John the Baptist. Jesus does not baptize himself, his disciples do. So Jesus leaves the land of Judaea and goes again to Galilee. He must go through Samaria.',
        'It is noon. Jesus is tired from the journey. In the city of Sychar he sits down at Jacob’s well. His disciples have gone into the city to buy food.',
        'A woman of Samaria comes to draw water. Jesus says to her: “Give me a drink.”',
        'The woman asks: “You are a Jew, and I am a woman of Samaria. How can you ask me for a drink?” Jews and Samaritans have nothing to do with each other.'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where does Jesus sit down?', options: ['at a well', 'under a tree', 'on a wall'] },
        { q: 'Where have the disciples gone?', options: ['into the city to buy food', 'to the lake to fish', 'to the temple to pray'] },
        { q: 'What does Jesus say to the woman?', options: ['Give me a drink.', 'Show me the way.', 'Bring me bread.'] }
      ]
    },
    {
      title: 'Living Water',
      ref: 'John 4:10–15',
      text: [
        'Jesus answers her: “If you knew what God wants to give you, and who it is that says to you, ‘Give me a drink,’ you would have asked him, and he would have given you living water.”',
        'The woman says: “Sir, you have nothing to draw with, and the well is deep. Where would you get living water? Are you greater than our father Jacob, who gave us this well? He drank from it himself, and his children, and his animals.”',
        'Jesus answers: “Whoever drinks of this water will be thirsty again. But whoever drinks of the water that I give will never be thirsty again. It will become in him a spring of water, rising up to everlasting life.”',
        'The woman says: “Sir, give me this water! Then I will not be thirsty, and I will not have to come here to draw water.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What kind of water does Jesus want to give the woman?', options: ['living water', 'water from the river', 'water from the mountain'] },
        { q: 'What does the woman say about the well?', options: ['It is deep.', 'It is empty.', 'It is new.'] },
        { q: 'What does the woman not want to have to do any more?', options: ['come here and draw water', 'travel far away', 'buy food'] }
      ]
    },
    {
      title: 'The Woman and Her Life',
      ref: 'John 4:16–24',
      text: [
        'Jesus says to the woman: “Go, call your husband, and come back here.” The woman answers: “I have no husband.”',
        'Jesus says: “You are right. You have had five husbands, and the one you have now is not your husband.”',
        'The woman says: “Sir, I see that you are a prophet. Our fathers prayed to God on this mountain. But you say that in Jerusalem is the place where people should pray.”',
        'Jesus says: “Believe me, woman: The time is coming when you will worship the Father neither on this mountain nor in Jerusalem. You worship what you do not know. We know what we worship, for salvation comes from the Jews.”',
        '“But the time is coming, and it is here now: The true worshippers will worship the Father in spirit and in truth. For the Father looks for such worshippers. God is Spirit, and those who worship him must worship him in spirit and in truth.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What does Jesus say about the woman’s husbands?', options: ['She has had five husbands.', 'She has had three husbands.', 'She has had seven husbands.'] },
        { q: 'Whom does the woman take Jesus for?', options: ['a prophet', 'a king', 'a merchant'] },
        { q: 'Where did the woman’s fathers pray to God?', options: ['on this mountain', 'in Jerusalem', 'by the lake'] }
      ]
    },
    {
      title: 'I Am He',
      ref: 'John 4:25–34',
      text: [
        'The woman says: “I know that the Messiah is coming, who is called Christ. When he comes, he will tell us everything.”',
        'Jesus says to her: “I am he, the one who is speaking to you.”',
        'Then his disciples come back. They are surprised that he is talking with a woman. But nobody asks him: “What are you talking with her about?”',
        'The woman leaves her jar and goes into the city. She says to the people: “Come, see a man who told me everything I ever did. Could he be the Christ?” Then they go out of the city and come to him.',
        'Meanwhile the disciples ask Jesus: “Master, eat!” He says to them: “I have food to eat that you do not know about.” The disciples ask one another: “Has anyone brought him something to eat?” Jesus says: “My food is to do the will of him who sent me, and to finish his work.”'
      ],
      task: {
        hint: 'Lead the woman from house to house. The paths must not cross.',
        tell: {
          ...TELL_TEXTS_EN,
          rounds: [{ hint: 'Lead the woman from house to house. The paths must not cross.', start: { name: 'The well with the jar' }, houses: [{ name: 'The potter’s house' }, { name: 'The weaver’s house' }, { name: 'The baker’s house' }] }, { hint: 'Now there are more houses. Think about the order in which the woman goes, so that she does not get stuck.', start: { name: 'The well with the jar' }, houses: [{ name: 'The potter’s house' }, { name: 'The weaver’s house' }, { name: 'The baker’s house' }, { name: 'The carpenter’s house' }, { name: 'The miller’s house' }] }]
        }
      },
      questions: [
        { q: 'What does the woman leave behind?', options: ['her jar', 'her cloak', 'her staff'] },
        { q: 'What does Jesus say when the woman speaks of the Messiah?', options: ['I am he, the one who is speaking to you.', 'He has not come yet.', 'He will come soon.'] }
      ]
    },
    {
      title: 'The Fields Are White',
      ref: 'John 4:35–42',
      text: [
        'Jesus says to the disciples: “Do you not say: There are still four months, and then comes the harvest? Look, I tell you: Lift up your eyes and look at the fields! They are already white for harvest.”',
        '“Whoever reaps receives wages and gathers fruit for eternal life, so that the one who sows and the one who reaps may rejoice together. One sows, and another reaps.”',
        '“I sent you to reap what you have not worked for. Others have worked, and you have come into their work.”',
        'Many Samaritans from the city believe in Jesus because the woman said: “He told me everything I ever did.” They come to him and ask him to stay with them. He stays there two days. Many more believe because of his words.',
        'They say to the woman: “We no longer believe only because of what you said. We have heard him ourselves, and we know: He is truly the Christ, the Saviour of the world.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What are the fields like, says Jesus?', options: ['already white for harvest', 'still green', 'quite empty'] },
        { q: 'How long does Jesus stay with the Samaritans?', options: ['two days', 'a week', 'one night'] },
        { q: 'Why do even more Samaritans believe?', options: ['They heard Jesus himself.', 'They saw a miracle.', 'They received a letter.'] }
      ]
    },
    {
      title: 'Who Do You Say That I Am?',
      ref: 'Matthew 16:13–20',
      text: [
        'Jesus comes with his disciples to the region of the city of Caesarea Philippi. There he asks them: “Who do people say that the Son of man is?”',
        'They answer: “Some say you are John the Baptist, others Elias, still others Jeremias or one of the prophets.”',
        'Jesus asks them: “But who do you say that I am?”',
        'Simon Peter answers: “You are the Christ, the Son of the living God!”',
        'Jesus says to him: “You are blessed, Simon, son of Jonah. No man told you this, but my Father in heaven.”',
        '“And I tell you: You are Peter, and on this rock I will build my church. The gates of the realm of the dead will not overcome it.”',
        '“I will give you the keys of the kingdom of heaven. Whatever you bind on earth will be bound in heaven, and whatever you loose on earth will be loosed in heaven.”',
        'Then Jesus forbids the disciples to tell anyone that he is the Christ.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does Jesus ask his disciples first?', options: ['Who people say that he is', 'Where they want to go', 'What they would like to eat'] },
        { q: 'What does Peter answer?', options: ['You are the Christ, the Son of the living God.', 'You are a prophet like Elijah.', 'You are a teacher in Israel.'] },
        { q: 'On what does Jesus want to build his church?', options: ['on this rock', 'on a mountain', 'on a house'] }
      ]
    },
    {
      title: 'On the Mountain',
      ref: 'Matthew 17:1–5',
      text: [
        'Six days later Jesus takes Peter, James and his brother John with him. He leads them up a high mountain, alone.',
        'There Jesus is changed before their eyes. His face shines like the sun, and his clothes become white as the light. Moses and Elijah appear to the disciples and talk with Jesus.',
        'Peter says to Jesus: “Lord, it is good for us to be here. If you wish, let us make three tents here: one for you, one for Moses and one for Elijah.”',
        'While he is still speaking, a bright cloud comes and covers them. A voice out of the cloud says: “This is my beloved Son, with whom I am well pleased. Listen to him!”'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'Whom does Jesus take up the mountain?', options: ['Peter, James and John', 'Peter, Andrew and Thomas', 'all his disciples'] },
        { q: 'What happens to Jesus on the mountain?', options: ['His face shines like the sun.', 'He becomes invisible.', 'He falls asleep.'] },
        { q: 'What does the voice out of the cloud say about Jesus?', options: ['He is my beloved Son.', 'He is a prophet.', 'He is a teacher.'] }
      ]
    },
    {
      title: 'Get Up and Do Not Be Afraid',
      ref: 'Matthew 17:6–13',
      text: [
        'When the disciples hear it, they fall on their faces and are very afraid. Jesus comes to them, touches them and says: “Get up and do not be afraid.” When they look up, they see no one but Jesus alone.',
        'They go down from the mountain. Jesus commands them: “Tell no one what you have seen until the Son of man has risen from the dead.”',
        'The disciples ask him: “Why do the scribes say that Elijah must come first?”',
        'Jesus answers: “Elijah comes first and puts everything in order. But I tell you: Elijah has already come, and they did not know him, but did to him whatever they wished. So the Son of man will also suffer at their hands.”',
        'Then the disciples understand that he was speaking about John the Baptist.'
      ],
      task: { hint: 'This stage is serious. Listen well and answer the questions.' },
      questions: [
        { q: 'What does Jesus say to the disciples lying on their faces?', options: ['Get up and do not be afraid.', 'Stay down.', 'Run away quickly.'] },
        { q: 'Whom do the disciples see when they look up?', options: ['no one but Jesus', 'Moses and Elijah', 'a cloud'] },
        { q: 'Whom does Jesus mean by the Elijah who has already come?', options: ['John the Baptist', 'Moses', 'Peter'] }
      ]
    },
    {
      title: 'He Calls Them by Name',
      ref: 'John 10:1–10',
      text: [
        'Jesus says to the people: “I tell you the truth: If anyone does not enter the sheepfold through the door, but climbs in some other way, he is a thief and a robber. But the shepherd of the sheep goes in through the door.”',
        '“The doorkeeper opens it for him, and the sheep hear his voice. He calls his own sheep by name and leads them out.”',
        '“Then he walks in front of them, and the sheep follow him, for they know his voice. They will not follow a stranger, but will run away from him, for they do not know the voice of strangers.”',
        'The people do not understand what Jesus means by this.',
        'Then Jesus says to them again: “I am the door of the sheep. All who came before me are thieves and robbers, but the sheep did not hear them. If anyone enters in through me, he will be saved. He will go in and out and find pasture.”',
        '“A thief comes only to steal and to destroy. I have come so that they may have life, and have it more than enough.”'
      ],
      task: {
        hint: 'Tap the shepherd. Each call reaches a little farther.',
        herdCall: {
          rounds: [{ hint: 'Tap the shepherd. Each call reaches a little farther.' }, { hint: 'Look which way the sheep run, and tap the shepherd.' }]
        }
      },
      questions: [
        { q: 'How does the shepherd enter the sheepfold?', options: ['through the door', 'over the wall', 'through the fence'] },
        { q: 'What does the shepherd do when he has led the sheep out?', options: ['He walks in front of them.', 'He walks behind them.', 'He carries them all.'] }
      ]
    },
    {
      title: 'I Am the Good Shepherd',
      ref: 'John 10:11–18',
      text: [
        'Jesus says: “I am the good shepherd. The good shepherd gives his life for the sheep. A hired man, who does not own the sheep, sees the wolf coming. He leaves the sheep alone and runs away, and the wolf catches some and scatters the others. The hired man runs away, because he is only paid and does not care about the sheep.”',
        '“I am the good shepherd. I know my sheep, and my sheep know me, just as my Father knows me and I know the Father. I give my life for the sheep.”',
        '“I have other sheep that are not in this fold. I must bring them, too. They will hear my voice, and there will be one flock and one shepherd.”',
        '“For this my Father loves me: I give my life, in order to take it again. No one takes it from me, I give it of my own will. I have power to give it, and power to take it again. This command I have received from my Father.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'What does the good shepherd give for the sheep?', options: ['his life', 'his money', 'his staff'] },
        { q: 'What does the hired man do when he sees the wolf coming?', options: ['He runs away.', 'He fights the wolf.', 'He calls the shepherd.'] },
        { q: 'What does Jesus say about the other sheep?', options: ['He must bring them, too.', 'They must stay outside.', 'They belong to a stranger.'] }
      ]
    },
    {
      title: 'Out of My Hand',
      ref: 'John 10:19–30',
      text: [
        'Because of these words the people argue again. Many say: “He has an evil spirit and talks nonsense.” Others say: “Can an evil spirit open the eyes of the blind?”',
        'It is winter in Jerusalem, and the city is celebrating the Feast of Dedication. Jesus walks about in the temple, in Solomon’s porch. Then the people gather around him and ask: “How long are you going to keep us waiting? Are you the Christ? Then tell us plainly!”',
        'Jesus answers: “I told you, and you do not believe. The works that I do in my Father’s name show who I am. But you do not believe, because you are not my sheep, as I told you.”',
        '“My sheep hear my voice, and I know them, and they follow me. I give them eternal life. They will never be lost, and no one will pluck them out of my hand. My Father, who gave them to me, is greater than all. No one can pluck them out of my Father’s hand. I and my Father are one.”'
      ],
      task: { hint: 'Listen well and answer the questions.' },
      questions: [
        { q: 'Where does Jesus walk in the temple?', options: ['in Solomon’s porch', 'in the women’s court', 'at the well in Sychar'] },
        { q: 'What do the people want to know from Jesus?', options: ['whether he is the Christ', 'where he lives', 'when the feast ends'] },
        { q: 'What does Jesus say about his sheep?', options: ['No one will pluck them out of his hand.', 'They have to manage alone.', 'They may not come to him.'] }
      ]
    }
  ],
  exam: [
    { q: 'Why did God send his Son into the world?', options: ['so that the world might be saved', 'so that the world might be condemned', 'so that the world might be afraid'] },
    { q: 'What kind of water does Jesus want to give the woman at the well?', options: ['living water', 'water from the river', 'water from the mountain'] },
    { q: 'What does Jesus say when the woman speaks of the Messiah?', options: ['I am he, the one who is speaking to you.', 'He has not come yet.', 'He will come soon.'] },
    { q: 'What does Peter answer when Jesus asks who he is?', options: ['You are the Christ, the Son of the living God.', 'You are a prophet like Elijah.', 'You are a teacher in Israel.'] },
    { q: 'What does the voice out of the cloud say about Jesus?', options: ['He is my beloved Son.', 'He is a prophet.', 'He is a teacher.'] },
    { q: 'What does Jesus say about his sheep?', options: ['No one will pluck them out of his hand.', 'They have to manage alone.', 'They may not come to him.'] }
  ]
}

// the English recordings of the stories (voice Achernar, Gemini): geschichte-NN-en-vK.mp3 (K = version); a stage without a number in this list is read with the voice of the device
const ENGLISH_RECORDING_VERSION: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1 }
ichbinEn.stages!.forEach((s, i) => {
  const version = ENGLISH_RECORDING_VERSION[i + 1]
  if (version) s.audio = `audio/abenteuer/ichbin/geschichte-${String(i + 1).padStart(2, '0')}-en-v${version}.mp3`
})
