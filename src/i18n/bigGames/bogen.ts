/** The texts of the big game "bogen" (Jonatan's arrows; german, english, spanish), merged into `app.bigGames.bogen` (see `index.ts`). */
export default {
  de: {
    title: 'Jonatans Pfeile',
    story:
      'Jonatan ist der beste Freund von David. Als Saul böse wird, hilft er ihm mit Pfeilen (1. Samuel 18,1; 20).',
    task: 'Deine Aufgabe: Sei Jonatan. Ziehe den Bogen und triff die Ziele.',
    chapters: [
      {
        name: 'Der Übungsplatz',
        ref: '1. Samuel 18,1–4',
        story: 'Jonatan und David werden Freunde. Jonatan übt mit dem Bogen.',
        task: 'Deine Aufgabe: Triff Scheiben, Glocken, Krüge und Fahnen.'
      },
      {
        name: 'Der Hügel bei Gibea',
        ref: '1. Samuel 19,1–7',
        story: 'Saul ist böse auf David. Jonatan spricht gut über ihn.',
        task: 'Deine Aufgabe: Schieße über Hügel oder lass den Pfeil abprallen.'
      },
      {
        name: 'Wind und Steine',
        ref: '1. Samuel 20,1–23',
        story: 'Jonatan und David machen ein Zeichen mit Pfeilen aus.',
        task: 'Deine Aufgabe: Der Wind schiebt den Pfeil. Ziele dagegen.'
      },
      {
        name: 'Das Zeichen für David',
        ref: '1. Samuel 20,35–42',
        story: 'Jonatan geht aufs Feld und schießt die Pfeile weit hinaus.',
        task: 'Deine Aufgabe: Schieße das Zeichen für David.'
      }
    ],
    names: [
      'Die erste Scheibe', 'Weiter weg', 'Auf dem Turm', 'Zwei Scheiben', 'Die Glocke', 'Die Hütte', 'Das Seil', 'Die Krüge', 'Die Fahnen', 'Die Mauer', 'Die Prüfung',
      'Über den Hügel', 'Das Tal', 'Der Stein', 'Der Schild', 'Die Pendelglocke', 'Der Wagen', 'Das Gewicht', 'Zwei Seile', 'Hinter dem Hügel', 'Die Treppe', 'Tor von Gibea',
      'Der Wind', 'Gegenwind', 'Turm im Wind', 'Der Aufwind', 'Der Fallwind', 'Die Böe', 'Stein und Wind', 'Seil im Wind', 'Pendel im Wind', 'Wagen und Tor', 'Der Sturm',
      'Drei Pfeile', 'Hügelkrüge', 'Das Stadttor', 'Zwei Tore', 'Zwei Glocken', 'Das rollende Tor', 'Schild und Wind', 'Aufwind und Seil', 'Fest von Gibea', 'Die letzte Prüfung', 'Das Zeichen'
    ],
    ending: {
      title: 'Das Zeichen',
      ref: '1. Samuel 20,35–42',
      text: 'Jonatan schießt die Pfeile weit hinaus. So weiß David Bescheid. Die Freunde umarmen sich. Jonatan sagt: Geh hin in Frieden!',
      done: 'Alle Level geschafft. Jonatan war ein treuer Freund.'
    },
    level: 'Level',
    arrows: 'Pfeile',
    wind: 'Wind',
    goals: 'Ziele',
    starRules: 'Ein Stern: geschafft. Mehr Sterne: Pfeile übrig.',
    howTitle: 'So geht es',
    howPull: 'Ziehe zurück und lass los.',
    howPower: 'Weiter ziehen, weiter fliegen.',
    howGoal: 'Triff alle Ziele.',
    go: 'Los!',
    pause: 'Pause',
    resume: 'Weiter spielen',
    again: 'Nochmal',
    menu: 'Zur Übersicht',
    next: 'Nächstes Level',
    leave: 'Zurück',
    restart: 'Neu starten',
    tip: 'Tipp',
    tipWait: 'Schieße, wenn der Bogen grün leuchtet.',
    tipNone: 'Kein Schuss gefunden. Probiere einen anderen Winkel.',
    tipThink: 'Ich überlege …',
    won1: 'Geschafft! Alle Ziele getroffen.',
    won2: 'Gut geschossen!',
    won3: 'Meisterhaft!',
    lost: 'Die Pfeile sind alle. Nochmal!',
    leftLine: 'Pfeile übrig: {n}',
    tooWeak: 'Zieh noch ein Stück weiter.',
    turn: 'Dreh dein Handy quer.',
    hint: {
      pull: 'Ziehe zurück und lass los. Triff die Scheibe.',
      power: 'Weiter ziehen, weiter fliegen.',
      height: 'Ziele höher. Der Pfeil fliegt im Bogen.',
      bell: 'Triff die Glocke und die Scheibe.',
      switch: 'Triff den Schalter: Das Tor sinkt.',
      rope: 'Schieße das Seil durch: Der Stein fällt.',
      jar: 'Der Pfeil fliegt durch Krüge hindurch.',
      flag: 'Triff die Fahne, dann weht sie auf.',
      hill: 'Schieße im hohen Bogen über den Hügel.',
      stone: 'Steine werfen den Pfeil zurück.',
      shield: 'Der Schild wirft den Pfeil kräftig zurück.',
      swing: 'Die Glocke schwingt. Lass im richtigen Moment los.',
      slide: 'Das Ziel fährt hin und her. Warte ab.',
      drop: 'Ein fallender Stein kann einen Schalter drücken.',
      wind: 'Wind! Die Fahne oben rechts zeigt die Richtung.',
      zone: 'In der Windzone ändert sich der Flug.',
      sign: 'Schieße die Pfeile weit hinaus.'
    }
  },
  en: {
    title: "Jonathan's Arrows",
    story:
      'Jonathan is the best friend of David. When Saul turns angry, he helps him with arrows (1 Samuel 18:1; 20).',
    task: 'Your task: be Jonathan. Pull the bow and hit the goals.',
    chapters: [
      {
        name: 'The Practice Ground',
        ref: '1 Samuel 18:1–4',
        story: 'Jonathan and David become friends. Jonathan practises with his bow.',
        task: 'Your task: hit targets, bells, jars and flags.'
      },
      {
        name: 'The Hill at Gibeah',
        ref: '1 Samuel 19:1–7',
        story: 'Saul is angry with David. Jonathan speaks well of him.',
        task: 'Your task: shoot over hills or let the arrow bounce.'
      },
      {
        name: 'Wind and Stones',
        ref: '1 Samuel 20:1–23',
        story: 'Jonathan and David agree on a sign with arrows.',
        task: 'Your task: the wind pushes the arrow. Aim against it.'
      },
      {
        name: 'The Sign for David',
        ref: '1 Samuel 20:35–42',
        story: 'Jonathan goes out into the field and shoots the arrows far out.',
        task: 'Your task: shoot the sign for David.'
      }
    ],
    names: [
      'The First Target', 'Farther Away', 'On the Tower', 'Two Targets', 'The Bell', 'The Hut', 'The Rope', 'The Jars', 'The Flags', 'The Wall', 'The Test',
      'Over the Hill', 'The Valley', 'The Stone', 'The Shield', 'The Swinging Bell', 'The Cart', 'The Weight', 'Two Ropes', 'Behind the Hill', 'The Steps', 'Gibeah Gate',
      'The Wind', 'Headwind', 'Windy Tower', 'The Updraft', 'The Downdraft', 'The Gust', 'Stone and Wind', 'Windy Rope', 'Windy Pendulum', 'Cart and Gate', 'The Storm',
      'Three Arrows', 'Hill Jars', 'The City Gate', 'Two Gates', 'Two Bells', 'The Rolling Gate', 'Shield and Wind', 'Updraft and Rope', 'Gibeah Feast', 'The Last Test', 'The Sign'
    ],
    ending: {
      title: 'The Sign',
      ref: '1 Samuel 20:35–42',
      text: 'Jonathan shoots the arrows far out. So David knows. The friends hug each other. Jonathan says: Go in peace!',
      done: 'All levels done. Jonathan was a faithful friend.'
    },
    level: 'Level',
    arrows: 'Arrows',
    wind: 'Wind',
    goals: 'Goals',
    starRules: 'One star: done. More stars: arrows left.',
    howTitle: 'How to play',
    howPull: 'Pull back and let go.',
    howPower: 'Pull further to fly further.',
    howGoal: 'Hit all the goals.',
    go: 'Go!',
    pause: 'Pause',
    resume: 'Keep playing',
    again: 'Again',
    menu: 'To the overview',
    next: 'Next level',
    leave: 'Back',
    restart: 'Restart',
    tip: 'Hint',
    tipWait: 'Shoot when the bow glows green.',
    tipNone: 'No shot found. Try a different angle.',
    tipThink: 'Thinking …',
    won1: 'Done! All goals hit.',
    won2: 'Well shot!',
    won3: 'Masterly!',
    lost: 'No arrows left. Try again!',
    leftLine: 'Arrows left: {n}',
    tooWeak: 'Pull a little further.',
    turn: 'Turn your phone sideways.',
    hint: {
      pull: 'Pull back and let go. Hit the target.',
      power: 'Pull further to fly further.',
      height: 'Aim higher. The arrow flies in an arc.',
      bell: 'Hit the bell and the target.',
      switch: 'Hit the switch: the gate sinks.',
      rope: 'Shoot through the rope: the stone falls.',
      jar: 'The arrow flies through jars.',
      flag: 'Hit the flag and it unfurls.',
      hill: 'Shoot in a high arc over the hill.',
      stone: 'Stones throw the arrow back.',
      shield: 'The shield throws the arrow back strongly.',
      swing: 'The bell swings. Let go at the right moment.',
      slide: 'The target moves back and forth. Wait.',
      drop: 'A falling stone can press a switch.',
      wind: 'Wind! The flag at the top right shows the way.',
      zone: 'In the wind zone the flight changes.',
      sign: 'Shoot the arrows far out.'
    }
  },
  es: {
    title: 'Las flechas de Jonatán',
    story:
      'Jonatán es el mejor amigo de David. Cuando Saúl se enoja, lo ayuda con flechas (1 Samuel 18:1; 20).',
    task: 'Tu tarea: sé Jonatán. Tensa el arco y acierta en las metas.',
    chapters: [
      {
        name: 'El campo de práctica',
        ref: '1 Samuel 18:1–4',
        story: 'Jonatán y David se hacen amigos. Jonatán practica con el arco.',
        task: 'Tu tarea: acierta en blancos, campanas, jarras y banderas.'
      },
      {
        name: 'La colina de Gabaa',
        ref: '1 Samuel 19:1–7',
        story: 'Saúl se enoja con David. Jonatán habla bien de él.',
        task: 'Tu tarea: dispara por encima o deja que la flecha rebote.'
      },
      {
        name: 'Viento y piedras',
        ref: '1 Samuel 20:1–23',
        story: 'Jonatán y David acuerdan una señal con flechas.',
        task: 'Tu tarea: el viento empuja la flecha. Apunta en contra.'
      },
      {
        name: 'La señal para David',
        ref: '1 Samuel 20:35–42',
        story: 'Jonatán sale al campo y dispara las flechas lejos.',
        task: 'Tu tarea: dispara la señal para David.'
      }
    ],
    names: [
      'El primer blanco', 'Más lejos', 'En la torre', 'Dos blancos', 'La campana', 'La cabaña', 'La cuerda', 'Las jarras', 'Las banderas', 'El muro', 'La prueba',
      'Sobre la colina', 'El valle', 'La piedra', 'El escudo', 'La campana colgante', 'El carro', 'El peso', 'Dos cuerdas', 'Tras la colina', 'La escalera', 'Puerta de Gabaa',
      'El viento', 'Viento en contra', 'Torre ventosa', 'La corriente ascendente', 'La corriente descendente', 'La ráfaga', 'Piedra y viento', 'Cuerda ventosa', 'Péndulo ventoso', 'Carro y puerta', 'La tormenta',
      'Tres flechas', 'Jarras de colina', 'La puerta mayor', 'Dos puertas', 'Dos campanas', 'La puerta rodante', 'Escudo y viento', 'Corriente y cuerda', 'Fiesta de Gabaa', 'La última prueba', 'La señal'
    ],
    ending: {
      title: 'La señal',
      ref: '1 Samuel 20:35–42',
      text: 'Jonatán dispara las flechas lejos. Así David lo sabe. Los amigos se abrazan. Jonatán dice: ¡Vete en paz!',
      done: 'Todos los niveles terminados. Jonatán fue un amigo fiel.'
    },
    level: 'Nivel',
    arrows: 'Flechas',
    wind: 'Viento',
    goals: 'Metas',
    starRules: 'Una estrella: logrado. Más estrellas: flechas de sobra.',
    howTitle: 'Cómo se juega',
    howPull: 'Tira hacia atrás y suelta.',
    howPower: 'Tira más para llegar más lejos.',
    howGoal: 'Acierta todas las metas.',
    go: '¡Vamos!',
    pause: 'Pausa',
    resume: 'Seguir jugando',
    again: 'Otra vez',
    menu: 'Al resumen',
    next: 'Siguiente nivel',
    leave: 'Atrás',
    restart: 'Empezar de nuevo',
    tip: 'Pista',
    tipWait: 'Dispara cuando el arco brille en verde.',
    tipNone: 'No hay disparo. Prueba otro ángulo.',
    tipThink: 'Pienso …',
    won1: '¡Logrado! Todas las metas alcanzadas.',
    won2: '¡Bien disparado!',
    won3: '¡De maestro!',
    lost: 'No quedan flechas. ¡Otra vez!',
    leftLine: 'Flechas de sobra: {n}',
    tooWeak: 'Tira un poco más.',
    turn: 'Gira el móvil de lado.',
    hint: {
      pull: 'Tira hacia atrás y suelta. Acierta el blanco.',
      power: 'Tira más para llegar más lejos.',
      height: 'Apunta más alto. La flecha vuela en arco.',
      bell: 'Acierta la campana y el blanco.',
      switch: 'Acierta el interruptor: la puerta baja.',
      rope: 'Corta la cuerda: cae la piedra.',
      jar: 'La flecha atraviesa las jarras.',
      flag: 'Acierta la bandera y ondea.',
      hill: 'Dispara en arco alto sobre la colina.',
      stone: 'Las piedras devuelven la flecha.',
      shield: 'El escudo devuelve la flecha con fuerza.',
      swing: 'La campana se balancea. Suelta en el momento justo.',
      slide: 'El blanco va de un lado a otro. Espera.',
      drop: 'Una piedra que cae puede pulsar un interruptor.',
      wind: '¡Viento! La bandera de arriba muestra la dirección.',
      zone: 'En la zona de viento cambia el vuelo.',
      sign: 'Dispara las flechas lejos.'
    }
  }
}
