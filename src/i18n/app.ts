export default {
  en: {
    app: {
      nav: {
        home: 'Start',
        series: 'Series',
        hoeren: 'Listen',
        color: 'Color',
        profile: 'My Area'
      },
      welcome: {
        cta: 'Let\'s go!',
        // The heading and subtitle are part of the artwork, so the alt text
        // repeats them for screen readers.
        artAlt: 'Welcome! Discover children\'s stories that strengthen faith and bring God\'s good news to life.'
      },
      // Shared by ZLanguageSwitcher — the flags carry no visible text, so
      // these strings are what a screen reader announces.
      language: {
        aria: 'Language',
        english: 'English',
        german: 'German'
      },
      main: {
        hello: 'Hello, Explorer!',
        helloName: 'Hello, {name}!',
        subtitle: 'Ready for a new story?',
        searchPlaceholder: 'Search story …',
        unlock: 'Unlock',
        newReleased: 'NEW',
        continueListening: 'CONTINUE LISTENING',
        continueReading: 'Continue reading',
        page: 'Page {n} of {total}',
        continue: 'Continue',
        newInLibrary: 'New in the library',
        upcoming: 'Coming soon',
        seeAll: 'See all',
        missionOfDay: 'Mission of the day',
        missionDone: 'Done!',
        missionSub: 'Be a peacemaker today.',
        searchResultsTitle: 'Search results',
        searchEmpty: 'No books found.',
        discoverBooks: 'Discover',
        // Screen-reader name for the PayPal / Ko-fi donate buttons, which
        // show only a brand glyph plus the brand word.
        donateVia: 'Donate via {method}',
        welcomeTitle0: 'Welcome!',
        welcomeText0: 'Discover stories about the Bible - to read, listen to and color.',
        welcomeTitle1: 'Support our mission',
        welcomeText1: 'Help us enable new stories, audiobooks and coloring pages for children.',
        welcomeTitle2: 'Discover our book world',
        welcomeText2: 'Beautiful printed children\'s books with biblical stories to read aloud and give as gifts.',
        categories: 'Categories'
      },
      // Display names for catalogue metadata the API only stores in German:
      // series keyed by `seriesId`, categories keyed by a slug of the German
      // name (the name IS the category's id server-side). Read through
      // `useCatalogNames`; an id without an entry falls back to the API name.
      catalog: {
        series: {
          'bibelgeschichten-zum-ausmalen': 'Bible Stories to Color',
          'der-christus-code': 'The Christ Code',
          'die-tiere-von-talheim': 'The Animals of Talheim',
          'einzelne-bucher': 'Standalone Books',
          'frucht-agenten': 'Fruit Agents',
          'gute-nacht-lilly': 'Good Night, Lilly',
          'levi-in-der-welt-der-bibel': 'Levi in the World of the Bible',
          'lina-und-ben': 'Lina and Ben'
        },
        category: {
          abenteuer: 'Adventure',
          ausmalbuecher: 'Coloring Books',
          'bibel-geschichten': 'Bible Stories',
          forscher: 'Explorers',
          'gute-nacht-geschichten': 'Bedtime Stories',
          kindergeschichten: 'Children\'s Stories'
        },
        // Age badges are generated from `badgeAge` instead of listed here,
        // so a new "ab 8 Jahren" needs no code change.
        badgeAge: 'Ages {n}+',
        badge: {
          abenteuer: 'Adventure',
          ausmalen: 'Coloring',
          bibel: 'Bible',
          'bibel-entdecken': 'Discover the Bible',
          bibelgeschichte: 'Bible Story',
          forscher: 'Explorers',
          'gute-nacht': 'Good Night',
          kindergeschichte: 'Children\'s Story',
          '6min': '6 min',
          '7min': '7 min',
          '15min': '15 min',
          'ca-5-min': 'approx. 5 min',
          'ca-8-min': 'approx. 8 min'
        }
      },
      categories: {
        books: 'Books',
        empty: 'No books in this category yet.'
      },
      allBooks: {
        title: 'Series',
        searchPlaceholder: 'Search …',
        filterAll: 'All',
        emptyTitle: 'No series yet',
        emptySub: 'Series will appear here once added.',
        bookCount: '{n} book | {n} books',
        // Noun only — the tile renders the number in its own styled span.
        bookLabel: 'book | books'
      },
      newBooks: {
        title: 'New Books',
        breadcrumb: 'NEW IN THE LIBRARY',
        empty: 'No new books in the past 3 months.'
      },
      hoeren: {
        title: 'Listen',
        breadcrumb: 'Audiobooks',
        empty: 'No audio stories available yet.'
      },
      bookSeries: {
        title: 'Series',
        tagline: 'In the King\'s service',
        overview: 'OVERVIEW',
        books: 'Books in series',
        bandLabel: 'Band {n}',
        comingSoon: 'Coming soon',
        new: 'New',
        layoutThree: '3-column grid',
        layoutTwo: '2-column grid',
        layoutList: 'List view',
        pagesShort: '{n} pages',
        empty: 'No books in this series yet.'
      },
      bookDetail: {
        story: 'Story',
        pages: 'PAGES',
        save: 'Save',
        saved: 'Saved',
        notFound: 'Story not found.',
        back: 'Back',
        listen: 'Listen',
        readMyself: 'Read',
        download: 'Download',
        nowListening: 'NOW LISTENING',
        followAlong: 'FOLLOW ALONG',
        noText: 'No text available.',
        progressLabel: 'Reading progress',
        progress: 'Reading progress {pct}',
        completed: 'Finished!',
        thisAwaitsYou: 'What awaits you',
        attachmentsTitle: 'Bonus material',
        attachmentSaveToPhone: 'Save to phone',
        attachmentUseInColoring: 'Use in coloring app',
        attachmentClose: 'Close'
      },
      coloring: {
        title: 'Coloring',
        greeting: 'Get creative',
        emptyTitle: 'Pick something to color',
        emptySub: 'Pick a coloring sheet from a book to start.',
        uploadHint: 'Upload a PDF or drop one here.',
        uploadButton: 'Choose file',
        loading: 'Loading…',
        toolbox: 'Tools',
        toolFelt: 'Marker',
        toolWatercolor: 'Brush',
        toolPencil: 'Crayon',
        toolGraphite: 'Pencil',
        toolFill: 'Bucket',
        toolEraser: 'Eraser',
        size: 'Size',
        transparency: 'Transparency',
        undo: 'Undo',
        redo: 'Redo',
        clear: 'Clear',
        upload: 'Upload',
        savePng: 'Save as PNG',
        share: 'Share',
        back: 'Back',
        leaveTitle: 'Leave coloring page?',
        leaveBody: 'Your coloring is not saved yet. If you leave, your changes will be lost.',
        leaveStay: 'Keep coloring',
        leaveDiscard: 'Leave anyway',
        customColor: 'Pick a color',
        minimize: 'Minimize',
        fullscreen: 'Fullscreen',
        fullscreenExit: 'Exit fullscreen',
        shellNote: 'Coloring tools coming soon — image is loaded.',
        pdfPending: 'PDF coloring is coming soon.',
        openOriginal: 'Open the PDF'
      },
      reader: {
        back: 'Back',
        loading: 'Loading…',
        notFound: 'Story not found.',
        cover: 'Cover',
        finished: 'Done',
        congratsTitle: 'You did it!',
        congratsSub: 'You finished the story.',
        nextStoryWaiting: 'The next story is waiting for you!',
        openColoring: 'Open coloring page'
      },
      awards: {
        title: 'Awards',
        keepGoing: 'Keep going',
        achievements: 'ACHIEVEMENTS'
      },
      // In-app tip, iOS only — the App Store build cannot link out to
      // PayPal / Ko-fi, so it offers a StoreKit tip instead. See `useTips`.
      tip: {
        label: 'Support us',
        labelWithPrice: 'Support us · {price}',
        purchasing: 'Please wait …',
        thanks: 'Thank you!',
        retry: 'Try again'
      },
      legal: {
        title: 'Privacy & Legal notice',
        linkLabel: 'Privacy & Legal notice',
        privacyTitle: 'Privacy policy',
        germanOnly: 'Our privacy policy and legal notice are only available in German.'
      },
      profile: {
        title: 'My Area',
        greeting: 'My Area',
        adventurer: 'Adventurer of the King',
        level: 'Level {n}',
        xp: '{cur} / {total}',
        littleReader: 'Little Reader',
        settings: 'SETTINGS',
        language: 'Language',
        english: 'English',
        german: 'German',
        watchList: 'WATCH LIST',
        emptyWatchList: 'Your watch list is empty. Tap the bookmark on a story to save it here.',
        favorites: 'Favorites',
        progress: 'Progress',
        achievements: 'Achievements',
        myWorks: 'My works',
        remove: 'Remove',
        chooseAvatar: 'Choose avatar',
        editName: 'Edit name',
        saveName: 'Save name',
        cancelName: 'Cancel',
        namePlaceholder: 'Your name',
        localBackend: 'Local backend',
        localBackendOn: 'Local · {url}',
        localBackendOff: 'Remote · {url}',
        localBackendHint: 'Switches the API host. Reloads the app so the cache is rebuilt against the new server.'
      }
    }
  },
  de: {
    app: {
      nav: {
        home: 'Start',
        series: 'Serien',
        hoeren: 'Hören',
        color: 'Malen',
        profile: 'Mein Bereich'
      },
      welcome: {
        cta: 'Los geht\'s!',
        // Überschrift und Untertitel stecken im Bild — der Alt-Text
        // wiederholt sie für Screenreader.
        artAlt: 'Willkommen! Entdecke Kindergeschichten, die Glauben stärken und Gottes gute Botschaft lebendig machen.'
      },
      // Von ZLanguageSwitcher genutzt — die Flaggen tragen keinen sichtbaren
      // Text, diese Strings liest der Screenreader vor.
      language: {
        aria: 'Sprache',
        english: 'Englisch',
        german: 'Deutsch'
      },
      main: {
        hello: 'Hallo, Entdecker!',
        helloName: 'Hallo, {name}!',
        subtitle: 'Bereit für eine neue Geschichte?',
        searchPlaceholder: 'Geschichte suchen …',
        unlock: 'Freischalten',
        newReleased: 'NEU ERSCHIENEN',
        continueListening: 'WEITERHÖREN',
        continueReading: 'Weiterlesen',
        page: 'Seite {n} von {total}',
        continue: 'Fortsetzen',
        newInLibrary: 'Neu in der Bibliothek',
        upcoming: 'Demnächst',
        seeAll: 'Alle anzeigen',
        missionOfDay: 'Mission des Tages',
        missionDone: 'Geschafft!',
        missionSub: 'Sei heute ein Friedensstifter.',
        searchResultsTitle: 'Suchergebnisse',
        searchEmpty: 'Keine Bücher gefunden.',
        discoverBooks: 'Entdecke',
        donateVia: 'Spenden über {method}',
        welcomeTitle0: 'Willkommen!',
        welcomeText0: 'Entdecke Geschichten rund um die Bibel - zum Lesen, Anhören und Ausmalen.',
        welcomeTitle1: 'Unterstütze unsere Mission',
        welcomeText1: 'Hilf uns neue Geschichten, Hörbücher und Ausmalbilder für Kinder zu ermöglichen.',
        welcomeTitle2: 'Entdecke unsere Bücherwelt',
        welcomeText2: 'Wunderschöne gedruckte Kinderbücher mit biblischen Geschichten zum Vorlesen und Verschenken.',
        categories: 'Kategorien'
      },
      // Anzeigenamen für Katalog-Metadaten, die die API nur auf Deutsch
      // führt: Serien über die `seriesId`, Kategorien über einen Slug des
      // deutschen Namens (der Name IST serverseitig die Id). Zugriff über
      // `useCatalogNames`; fehlt eine Id, greift der API-Name.
      catalog: {
        series: {
          'bibelgeschichten-zum-ausmalen': 'Bibelgeschichten zum Ausmalen',
          'der-christus-code': 'Der Christus Code',
          'die-tiere-von-talheim': 'Die Tiere von Talheim',
          'einzelne-bucher': 'Einzelne Bücher',
          'frucht-agenten': 'Frucht Agenten',
          'gute-nacht-lilly': 'Gute Nacht Lilly',
          'levi-in-der-welt-der-bibel': 'Levi in der Welt der Bibel',
          'lina-und-ben': 'Lina und Ben'
        },
        category: {
          abenteuer: 'Abenteuer',
          ausmalbuecher: 'Ausmalbücher',
          'bibel-geschichten': 'Bibel Geschichten',
          forscher: 'Forscher',
          'gute-nacht-geschichten': 'Gute Nacht Geschichten',
          kindergeschichten: 'Kindergeschichten'
        },
        // Altersangaben entstehen aus `badgeAge` statt aus der Liste, damit
        // ein neues „ab 8 Jahren" ohne Code-Änderung auskommt.
        badgeAge: 'ab {n} Jahren',
        badge: {
          abenteuer: 'Abenteuer',
          ausmalen: 'Ausmalen',
          bibel: 'Bibel',
          'bibel-entdecken': 'Bibel entdecken',
          bibelgeschichte: 'Bibelgeschichte',
          forscher: 'Forscher',
          'gute-nacht': 'Gute Nacht',
          kindergeschichte: 'Kindergeschichte',
          '6min': '6min',
          '7min': '7min',
          '15min': '15min',
          'ca-5-min': 'ca. 5 Min.',
          'ca-8-min': 'ca. 8 Min.'
        }
      },
      categories: {
        books: 'Bücher',
        empty: 'Noch keine Bücher in dieser Kategorie.'
      },
      allBooks: {
        title: 'Serien',
        searchPlaceholder: 'Suchen …',
        filterAll: 'Alle',
        emptyTitle: 'Noch keine Serien',
        emptySub: 'Hier erscheinen deine Buchreihen.',
        bookCount: '{n} Buch | {n} Bücher',
        // Nur das Substantiv — die Zahl rendert die Kachel in eigenem Span.
        bookLabel: 'Buch | Bücher'
      },
      newBooks: {
        title: 'Neue Bücher',
        breadcrumb: 'NEU IN DER BIBLIOTHEK',
        empty: 'Keine neuen Bücher in den letzten 3 Monaten.'
      },
      hoeren: {
        title: 'Hörgeschichten',
        breadcrumb: 'Hörbücher',
        empty: 'Es gibt noch keine Hörgeschichten.'
      },
      bookSeries: {
        title: 'Serie',
        tagline: 'Im Auftrag des Königs',
        overview: 'ÜBERSICHT',
        books: 'Bücher der Serie',
        bandLabel: 'Band {n}',
        comingSoon: 'Demnächst',
        new: 'Neu',
        layoutThree: '3-Spalten-Raster',
        layoutTwo: '2-Spalten-Raster',
        layoutList: 'Listenansicht',
        pagesShort: '{n} Seiten',
        empty: 'Noch keine Bücher in dieser Serie.'
      },
      bookDetail: {
        story: 'Geschichte',
        pages: 'SEITEN',
        save: 'Merken',
        saved: 'Gemerkt',
        notFound: 'Geschichte nicht gefunden.',
        back: 'Zurück',
        listen: 'Anhören',
        readMyself: 'Lesen',
        download: 'Herunterladen',
        nowListening: 'HÖRST GERADE',
        followAlong: 'MITLESEN',
        noText: 'Kein Text verfügbar.',
        progressLabel: 'Lesefortschritt',
        progress: 'Lesefortschritt {pct}',
        completed: 'Geschafft!',
        thisAwaitsYou: 'Das erwartet dich',
        attachmentsTitle: 'Extras',
        attachmentSaveToPhone: 'Aufs Handy speichern',
        attachmentUseInColoring: 'In der Ausmal-App öffnen',
        attachmentClose: 'Schließen'
      },
      coloring: {
        title: 'Ausmalen',
        greeting: 'Werde kreativ',
        emptyTitle: 'Ausmalbild laden',
        emptySub: 'Wähle ein Ausmal-Bild in einer Geschichte aus, um zu starten.',
        uploadHint: 'PDF hochladen oder per Drag & Drop ablegen.',
        uploadButton: 'Datei auswählen',
        loading: 'Bild wird geladen…',
        toolbox: 'Werkzeuge',
        toolFelt: 'Filzstift',
        toolWatercolor: 'Pinsel',
        toolPencil: 'Buntstift',
        toolGraphite: 'Bleistift',
        toolFill: 'Eimer',
        toolEraser: 'Radierer',
        size: 'Größe',
        transparency: 'Transparenz',
        undo: 'Zurück',
        redo: 'Vor',
        clear: 'Löschen',
        upload: 'Hochladen',
        savePng: 'Als PNG speichern',
        share: 'Teilen',
        back: 'Zurück',
        leaveTitle: 'Ausmal-Seite verlassen?',
        leaveBody: 'Dein Ausmalbild ist noch nicht gespeichert. Beim Verlassen gehen die Änderungen verloren.',
        leaveStay: 'Weiter ausmalen',
        leaveDiscard: 'Trotzdem verlassen',
        customColor: 'Eigene Farbe wählen',
        minimize: 'Minimieren',
        fullscreen: 'Vollbild',
        fullscreenExit: 'Verlassen',
        shellNote: 'Mal-Werkzeuge folgen bald — Bild ist geladen.',
        pdfPending: 'PDF-Ausmalen folgt bald.',
        openOriginal: 'PDF öffnen'
      },
      reader: {
        back: 'Zurück',
        loading: 'Lade …',
        notFound: 'Geschichte nicht gefunden.',
        cover: 'Cover',
        finished: 'Fertig',
        congratsTitle: 'Geschafft!',
        congratsSub: 'Du hast die Geschichte zu Ende gelesen.',
        nextStoryWaiting: 'Die nächste Geschichte wartet auf dich!',
        openColoring: 'Ausmalbild öffnen'
      },
      awards: {
        title: 'Auszeichnungen',
        keepGoing: 'Weiter so',
        achievements: 'ERFOLGE'
      },
      // In-app tip, iOS only — the App Store build cannot link out to
      // PayPal / Ko-fi, so it offers a StoreKit tip instead. See `useTips`.
      tip: {
        label: 'Unterstützen',
        labelWithPrice: 'Unterstützen · {price}',
        purchasing: 'Bitte warten …',
        thanks: 'Danke!',
        retry: 'Erneut versuchen'
      },
      legal: {
        title: 'Datenschutz & Impressum',
        linkLabel: 'Datenschutz & Impressum',
        privacyTitle: 'Datenschutzerklärung',
        germanOnly: 'Die Datenschutzerklärung und das Impressum gibt es nur auf Deutsch.'
      },
      profile: {
        title: 'Mein Bereich',
        greeting: 'Mein Bereich',
        adventurer: 'Abenteurer des Königs',
        level: 'Level {n}',
        xp: '{cur} / {total}',
        littleReader: 'Kleiner Leser',
        settings: 'EINSTELLUNGEN',
        language: 'Sprache',
        english: 'Englisch',
        german: 'Deutsch',
        watchList: 'MERKLISTE',
        emptyWatchList: 'Deine Merkliste ist leer. Tippe auf das Lesezeichen einer Geschichte, um sie hier zu speichern.',
        favorites: 'Favoriten',
        progress: 'Fortschritt',
        achievements: 'Errungenschaften',
        myWorks: 'Meine Werke',
        remove: 'Entfernen',
        chooseAvatar: 'Profilbild wählen',
        editName: 'Name ändern',
        saveName: 'Name speichern',
        cancelName: 'Abbrechen',
        namePlaceholder: 'Dein Name'
      }
    }
  }
}
