/** The texts of the big game "bogen" (Jonatan's arrows; german, english, spanish), merged into `app.bigGames.bogen` (see `index.ts`). */
export default {
  de: {
    title: 'Jonatans Pfeile',
    story:
      'Hier geht es um Jonatan. Er war der Sohn von König Saul und ein guter Bogenschütze (2. Samuel 1,22). Er war der beste Freund von David und hatte ihn lieb wie sich selbst (1. Samuel 18,1). Als König Saul auf David böse wurde, half Jonatan ihm. Mit Pfeilen gab er David ein Zeichen (1. Samuel 20).',
    task: 'Deine Aufgabe: Sei Jonatan. Ziehe den Bogen, ziele und lass los. Triff Scheiben, Glocken, Krüge und Fahnen, drücke Schalter und schieße Seile durch. In jedem Level hast du nur wenige Pfeile.',
    chapters: [
      {
        name: 'Der Übungsplatz',
        ref: '1. Samuel 18,1–4',
        story: 'Jonatan und David wurden Freunde. Jonatan hatte David lieb wie sich selbst. Auf dem Übungsplatz schießt Jonatan mit dem Bogen auf Ziele.',
        task: 'Übe mit dem Bogen. Triff die Scheiben, die Glocke, die Krüge und die Fahnen. Öffne die Tore mit den Schaltern.'
      },
      {
        name: 'Der Hügel bei Gibea',
        ref: '1. Samuel 19,1–7',
        story: 'Jonatan lebte mit seinem Vater, König Saul, in Gibea. Saul war böse auf David geworden. Da sprach Jonatan mit seinem Vater und sagte Gutes über David. Saul hörte auf ihn.',
        task: 'Auf den Hügeln liegen Berge und Steine im Weg. Schieße darüber hinweg oder lass den Pfeil von Steinen und Schilden abprallen.'
      },
      {
        name: 'Wind und Steine',
        ref: '1. Samuel 20,1–23',
        story: 'Bald war David wieder in Gefahr. Jonatan und David machten ein Zeichen aus: Jonatan würde auf dem Feld Pfeile schießen. So würde David erfahren, ob er bleiben darf oder gehen muss (1. Samuel 20,20–22). Auf dem Feld weht der Wind.',
        task: 'Der Wind schiebt den Pfeil zur Seite. Lies die Windfahne oben rechts und ziele dagegen.'
      },
      {
        name: 'Das Zeichen für David',
        ref: '1. Samuel 20,35–42',
        story: 'Am Morgen ging Jonatan aufs Feld, so wie er es mit David ausgemacht hatte. Ein kleiner Junge war bei ihm. Jonatan schoss die Pfeile weit hinaus.',
        task: 'Zeige, was du gelernt hast. Im letzten Level schießt du das Zeichen für David.'
      }
    ],
    names: [
      'Die erste Scheibe', 'Weiter weg', 'Auf dem Turm', 'Zwei Scheiben', 'Die Glocke', 'Die Hütte', 'Das Seil', 'Die Krüge', 'Die Fahnen', 'Die Mauer', 'Die Prüfung',
      'Über den Hügel', 'Das Tal', 'Der Stein', 'Der Schild', 'Die Pendelglocke', 'Der Wagen', 'Das Gewicht', 'Zwei Seile', 'Hinter dem Hügel', 'Die Treppe', 'Das Tor von Gibea',
      'Der Wind', 'Gegenwind', 'Der Turm im Wind', 'Der Aufwind', 'Der Fallwind', 'Die Böe', 'Stein und Wind', 'Seil im Wind', 'Pendel im Wind', 'Wagen und Tor', 'Der Sturm',
      'Drei Pfeile', 'Hügelkrüge', 'Das Stadttor', 'Zwei Tore', 'Zwei Glocken', 'Das rollende Tor', 'Schild und Wind', 'Aufwind und Seil', 'Das Fest von Gibea', 'Die letzte Prüfung', 'Das Zeichen'
    ],
    ending: {
      title: 'Das Zeichen',
      ref: '1. Samuel 20,35–42',
      text: 'Der Junge lief los, um die Pfeile zu suchen. Jonatan schoss einen Pfeil über ihn hinaus und rief ihm nach: Der Pfeil liegt weiter hinaus! So wusste David Bescheid. Er kam aus seinem Versteck. Die beiden Freunde umarmten sich und weinten. Jonatan sagte zu David: Geh hin in Frieden!',
      done: 'Du hast alle Level geschafft. Jonatan war ein treuer Freund.'
    },
    level: 'Level',
    arrows: 'Pfeile',
    wind: 'Wind',
    goals: 'Ziele',
    starRules: 'Drei Sterne: mindestens zwei Pfeile übrig. Zwei Sterne: ein Pfeil übrig. Ein Stern: geschafft.',
    howTitle: 'So geht es',
    howPull: 'Setze den Finger irgendwo auf den Bildschirm und ziehe nach hinten. Wenn du loslässt, fliegt der Pfeil in die andere Richtung.',
    howPower: 'Je weiter du ziehst, desto kräftiger fliegt der Pfeil. Die gestrichelte Linie zeigt den Anfang des Flugs.',
    howWind: 'Der Wind schiebt den Pfeil. Oben rechts siehst du, woher er weht.',
    howGoal: 'Triff alle Ziele: Scheiben, Glocken, Krüge und Fahnen. Schalter öffnen Tore. Durchgeschossene Seile lassen Steine fallen.',
    howStars: 'Du hast nur wenige Pfeile. Behalte mindestens zwei für drei Sterne. Der Knopf mit der Lampe zeigt dir einen Schuss.',
    go: 'Los!',
    pause: 'Pause',
    resume: 'Weiter spielen',
    again: 'Nochmal',
    menu: 'Zur Übersicht',
    next: 'Nächstes Level',
    leave: 'Zurück',
    restart: 'Neu starten',
    tip: 'Tipp',
    tipWait: 'Gleich: schieße, wenn der Bogen grün leuchtet.',
    tipNone: 'Hier sehe ich gerade keinen Schuss. Probiere einen anderen Winkel.',
    tipThink: 'Ich überlege …',
    won1: 'Geschafft! Alle Ziele getroffen.',
    won2: 'Gut geschossen! Ein Pfeil war noch übrig.',
    won3: 'Meisterhaft! Du hast viele Pfeile übrig.',
    lost: 'Die Pfeile sind alle. Versuche es noch einmal.',
    leftLine: 'Pfeile übrig: {n}',
    tooWeak: 'Zieh noch ein Stück weiter, dann fliegt der Pfeil.',
    hint: {
      pull: 'Ziehe den Finger nach hinten und lass los. Der Pfeil fliegt in die andere Richtung. Triff die Scheibe.',
      power: 'Je weiter du ziehst, desto weiter fliegt der Pfeil.',
      height: 'Ziele höher. Der Pfeil fliegt in einem Bogen. Die Linie hilft dir.',
      bell: 'Triff die Glocke, dann läutet sie. Du musst sie und die Scheibe treffen.',
      switch: 'Triff den Schalter, dann sinkt das Tor in den Boden. Dahinter wartet das Ziel.',
      rope: 'Schieße das Seil durch. Dann fällt der Stein und zerbricht den Krug. Du kannst den Krug auch direkt treffen.',
      jar: 'Der Pfeil fliegt durch Krüge hindurch. Vielleicht triffst du mehrere mit einem Schuss.',
      flag: 'Triff die Fahne, dann weht sie auf.',
      hill: 'Schieße im hohen Bogen über den Hügel.',
      stone: 'Steine werfen den Pfeil zurück. Treffe die Wand, dann springt der Pfeil unter das Dach.',
      shield: 'Der Schild wirft den Pfeil kräftig zurück. Probiere es aus.',
      swing: 'Die Glocke schwingt hin und her. Lass los, wenn sie an der richtigen Stelle ist.',
      slide: 'Das Ziel fährt hin und her. Warte auf den richtigen Augenblick.',
      drop: 'Ein fallender Stein kann einen Schalter drücken. Schieße das Seil durch.',
      wind: 'Der Wind weht! Die Fahne oben rechts zeigt, wohin er den Pfeil schiebt.',
      zone: 'In der Windzone verändert sich der Flug. Die gestrichelte Linie zeigt dir den Weg.',
      sign: 'Schieße die Pfeile weit hinaus. Das ist das Zeichen für David.'
    }
  },
  en: {
    title: "Jonathan's Arrows",
    story:
      'This is about Jonathan. He was the son of King Saul and a fine archer (2 Samuel 1:22). He was the best friend of David and loved him as himself (1 Samuel 18:1). When King Saul turned against David, Jonathan helped him. With arrows he gave David a sign (1 Samuel 20).',
    task: 'Your task: be Jonathan. Pull the bow, aim and let go. Hit targets, bells, jars and flags, press switches and shoot through ropes. In every level you only have a few arrows.',
    chapters: [
      {
        name: 'The Practice Ground',
        ref: '1 Samuel 18:1–4',
        story: 'Jonathan and David became friends. Jonathan loved David as himself. On the practice ground Jonathan shoots his bow at targets.',
        task: 'Practise with the bow. Hit the targets, the bell, the jars and the flags. Open the gates with the switches.'
      },
      {
        name: 'The Hill at Gibeah',
        ref: '1 Samuel 19:1–7',
        story: 'Jonathan lived with his father, King Saul, in Gibeah. Saul had become angry with David. So Jonathan spoke to his father and said good things about David. Saul listened to him.',
        task: 'Hills and stones are in the way. Shoot over them, or let the arrow bounce off stones and shields.'
      },
      {
        name: 'Wind and Stones',
        ref: '1 Samuel 20:1–23',
        story: 'Soon David was in danger again. Jonathan and David agreed on a sign: Jonathan would shoot arrows in the field. That way David would learn whether he could stay or had to go (1 Samuel 20:20–22). In the field the wind blows.',
        task: 'The wind pushes the arrow sideways. Read the wind flag at the top right and aim against it.'
      },
      {
        name: 'The Sign for David',
        ref: '1 Samuel 20:35–42',
        story: 'In the morning Jonathan went out into the field, just as he had agreed with David. A small boy was with him. Jonathan shot the arrows far out.',
        task: 'Show what you have learned. In the last level you shoot the sign for David.'
      }
    ],
    names: [
      'The First Target', 'Farther Away', 'On the Tower', 'Two Targets', 'The Bell', 'The Hut', 'The Rope', 'The Jars', 'The Flags', 'The Wall', 'The Test',
      'Over the Hill', 'The Valley', 'The Stone', 'The Shield', 'The Swinging Bell', 'The Cart', 'The Weight', 'Two Ropes', 'Behind the Hill', 'The Steps', 'The Gate of Gibeah',
      'The Wind', 'Headwind', 'The Tower in the Wind', 'The Updraft', 'The Downdraft', 'The Gust', 'Stone and Wind', 'Rope in the Wind', 'Pendulum in the Wind', 'Cart and Gate', 'The Storm',
      'Three Arrows', 'Jars on the Hill', 'The City Gate', 'Two Gates', 'Two Bells', 'The Rolling Gate', 'Shield and Wind', 'Updraft and Rope', 'The Feast of Gibeah', 'The Last Test', 'The Sign'
    ],
    ending: {
      title: 'The Sign',
      ref: '1 Samuel 20:35–42',
      text: 'The boy ran off to look for the arrows. Jonathan shot an arrow past him and called after him: The arrow is farther out! So David knew. He came out of his hiding place. The two friends hugged each other and wept. Jonathan said to David: Go in peace!',
      done: 'You have finished all levels. Jonathan was a faithful friend.'
    },
    level: 'Level',
    arrows: 'Arrows',
    wind: 'Wind',
    goals: 'Goals',
    starRules: 'Three stars: at least two arrows left. Two stars: one arrow left. One star: done.',
    howTitle: 'How to play',
    howPull: 'Put your finger anywhere on the screen and pull back. When you let go, the arrow flies the other way.',
    howPower: 'The farther you pull, the stronger the arrow flies. The dotted line shows the start of the flight.',
    howWind: 'The wind pushes the arrow. At the top right you see where it blows from.',
    howGoal: 'Hit all the goals: targets, bells, jars and flags. Switches open gates. Ropes that you shoot through let stones fall.',
    howStars: 'You only have a few arrows. Keep at least two for three stars. The lamp button shows you a shot.',
    go: 'Go!',
    pause: 'Pause',
    resume: 'Keep playing',
    again: 'Again',
    menu: 'To the overview',
    next: 'Next level',
    leave: 'Back',
    restart: 'Restart',
    tip: 'Hint',
    tipWait: 'Soon: shoot when the bow glows green.',
    tipNone: 'I do not see a shot right now. Try a different angle.',
    tipThink: 'Thinking …',
    won1: 'Done! All goals hit.',
    won2: 'Well shot! One arrow was left.',
    won3: 'Masterly! You have many arrows left.',
    lost: 'No arrows left. Try again.',
    leftLine: 'Arrows left: {n}',
    tooWeak: 'Pull a little farther and the arrow flies.',
    hint: {
      pull: 'Pull your finger back and let go. The arrow flies the other way. Hit the target.',
      power: 'The farther you pull, the farther the arrow flies.',
      height: 'Aim higher. The arrow flies in an arc. The line helps you.',
      bell: 'Hit the bell and it rings. You have to hit it and the target.',
      switch: 'Hit the switch and the gate sinks into the ground. The goal waits behind it.',
      rope: 'Shoot through the rope. Then the stone falls and breaks the jar. You can also hit the jar directly.',
      jar: 'The arrow flies through jars. Maybe you hit several with one shot.',
      flag: 'Hit the flag and it unfurls.',
      hill: 'Shoot in a high arc over the hill.',
      stone: 'Stones throw the arrow back. Hit the wall and the arrow bounces under the roof.',
      shield: 'The shield throws the arrow back strongly. Try it out.',
      swing: 'The bell swings back and forth. Let go when it is in the right place.',
      slide: 'The target moves back and forth. Wait for the right moment.',
      drop: 'A falling stone can press a switch. Shoot through the rope.',
      wind: 'The wind blows! The flag at the top right shows where it pushes the arrow.',
      zone: 'In the wind zone the flight changes. The dotted line shows you the way.',
      sign: 'Shoot the arrows far out. That is the sign for David.'
    }
  },
  es: {
    title: 'Las flechas de Jonatán',
    story:
      'Esto trata de Jonatán. Era hijo del rey Saúl y un buen arquero (2 Samuel 1:22). Era el mejor amigo de David y lo amaba como a sí mismo (1 Samuel 18:1). Cuando el rey Saúl se enojó con David, Jonatán lo ayudó. Con flechas le dio una señal a David (1 Samuel 20).',
    task: 'Tu tarea: sé Jonatán. Tensa el arco, apunta y suelta. Acierta en blancos, campanas, jarras y banderas, pulsa interruptores y corta cuerdas con una flecha. En cada nivel solo tienes pocas flechas.',
    chapters: [
      {
        name: 'El campo de práctica',
        ref: '1 Samuel 18:1–4',
        story: 'Jonatán y David se hicieron amigos. Jonatán amaba a David como a sí mismo. En el campo de práctica Jonatán dispara su arco a los blancos.',
        task: 'Practica con el arco. Acierta en los blancos, la campana, las jarras y las banderas. Abre las puertas con los interruptores.'
      },
      {
        name: 'La colina de Gabaa',
        ref: '1 Samuel 19:1–7',
        story: 'Jonatán vivía con su padre, el rey Saúl, en Gabaa. Saúl se había enojado con David. Entonces Jonatán habló con su padre y dijo cosas buenas de David. Saúl lo escuchó.',
        task: 'Colinas y piedras estorban el camino. Dispara por encima o deja que la flecha rebote en piedras y escudos.'
      },
      {
        name: 'Viento y piedras',
        ref: '1 Samuel 20:1–23',
        story: 'Pronto David estuvo otra vez en peligro. Jonatán y David acordaron una señal: Jonatán dispararía flechas en el campo. Así David sabría si podía quedarse o tenía que irse (1 Samuel 20:20–22). En el campo sopla el viento.',
        task: 'El viento empuja la flecha hacia un lado. Mira la bandera de viento arriba a la derecha y apunta en contra.'
      },
      {
        name: 'La señal para David',
        ref: '1 Samuel 20:35–42',
        story: 'Por la mañana Jonatán salió al campo, como había acordado con David. Un muchacho pequeño iba con él. Jonatán disparó las flechas lejos.',
        task: 'Muestra lo que has aprendido. En el último nivel disparas la señal para David.'
      }
    ],
    names: [
      'El primer blanco', 'Más lejos', 'En la torre', 'Dos blancos', 'La campana', 'La cabaña', 'La cuerda', 'Las jarras', 'Las banderas', 'El muro', 'La prueba',
      'Sobre la colina', 'El valle', 'La piedra', 'El escudo', 'La campana colgante', 'El carro', 'El peso', 'Dos cuerdas', 'Detrás de la colina', 'La escalera', 'La puerta de Gabaa',
      'El viento', 'Viento en contra', 'La torre en el viento', 'La corriente ascendente', 'La corriente descendente', 'La ráfaga', 'Piedra y viento', 'Cuerda en el viento', 'Péndulo en el viento', 'Carro y puerta', 'La tormenta',
      'Tres flechas', 'Jarras en la colina', 'La puerta de la ciudad', 'Dos puertas', 'Dos campanas', 'La puerta rodante', 'Escudo y viento', 'Corriente y cuerda', 'La fiesta de Gabaa', 'La última prueba', 'La señal'
    ],
    ending: {
      title: 'La señal',
      ref: '1 Samuel 20:35–42',
      text: 'El muchacho salió corriendo a buscar las flechas. Jonatán disparó una flecha más allá de él y le gritó: ¡La flecha está más lejos! Así David lo supo. Salió de su escondite. Los dos amigos se abrazaron y lloraron. Jonatán le dijo a David: ¡Vete en paz!',
      done: 'Has terminado todos los niveles. Jonatán fue un amigo fiel.'
    },
    level: 'Nivel',
    arrows: 'Flechas',
    wind: 'Viento',
    goals: 'Metas',
    starRules: 'Tres estrellas: al menos dos flechas de sobra. Dos estrellas: una flecha de sobra. Una estrella: logrado.',
    howTitle: 'Cómo se juega',
    howPull: 'Pon el dedo en cualquier parte de la pantalla y tira hacia atrás. Al soltar, la flecha vuela hacia el otro lado.',
    howPower: 'Cuanto más tiras, con más fuerza vuela la flecha. La línea de puntos muestra el comienzo del vuelo.',
    howWind: 'El viento empuja la flecha. Arriba a la derecha ves de dónde sopla.',
    howGoal: 'Acierta todas las metas: blancos, campanas, jarras y banderas. Los interruptores abren puertas. Las cuerdas que cortas hacen caer piedras.',
    howStars: 'Solo tienes pocas flechas. Guarda al menos dos para tres estrellas. El botón de la lámpara te muestra un disparo.',
    go: '¡Vamos!',
    pause: 'Pausa',
    resume: 'Seguir jugando',
    again: 'Otra vez',
    menu: 'Al resumen',
    next: 'Siguiente nivel',
    leave: 'Atrás',
    restart: 'Empezar de nuevo',
    tip: 'Pista',
    tipWait: 'Enseguida: dispara cuando el arco brille en verde.',
    tipNone: 'Ahora no veo ningún disparo. Prueba otro ángulo.',
    tipThink: 'Pienso …',
    won1: '¡Logrado! Todas las metas alcanzadas.',
    won2: '¡Bien disparado! Quedó una flecha.',
    won3: '¡De maestro! Te quedan muchas flechas.',
    lost: 'No quedan flechas. Inténtalo otra vez.',
    leftLine: 'Flechas de sobra: {n}',
    tooWeak: 'Tira un poco más y la flecha vuela.',
    hint: {
      pull: 'Tira del dedo hacia atrás y suelta. La flecha vuela hacia el otro lado. Acierta el blanco.',
      power: 'Cuanto más tiras, más lejos vuela la flecha.',
      height: 'Apunta más alto. La flecha vuela en arco. La línea te ayuda.',
      bell: 'Acierta la campana y suena. Tienes que acertarla a ella y al blanco.',
      switch: 'Acierta el interruptor y la puerta se hunde en el suelo. Detrás espera la meta.',
      rope: 'Corta la cuerda con una flecha. Entonces cae la piedra y rompe la jarra. También puedes acertar la jarra directamente.',
      jar: 'La flecha atraviesa las jarras. Quizás aciertes varias de un disparo.',
      flag: 'Acierta la bandera y se despliega.',
      hill: 'Dispara en arco alto sobre la colina.',
      stone: 'Las piedras devuelven la flecha. Acierta el muro y la flecha rebota bajo el techo.',
      shield: 'El escudo devuelve la flecha con fuerza. Pruébalo.',
      swing: 'La campana se balancea. Suelta cuando esté en el lugar adecuado.',
      slide: 'El blanco va de un lado a otro. Espera el momento justo.',
      drop: 'Una piedra que cae puede pulsar un interruptor. Corta la cuerda.',
      wind: '¡Sopla el viento! La bandera de arriba a la derecha muestra hacia dónde empuja la flecha.',
      zone: 'En la zona de viento cambia el vuelo. La línea de puntos te muestra el camino.',
      sign: 'Dispara las flechas lejos. Esa es la señal para David.'
    }
  }
}
