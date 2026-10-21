# Konzept: LambKing Plus (Abo) für die LambKing-Stories-App

Stand: 21.10.2026. Verfasst als Entscheidungsgrundlage für Anton. Nur ein Konzept: Es wurde kein Code geändert, nichts in einen Store eingetragen, nichts gekauft. Alle Aussagen zu Preisen und Store-Regeln stammen aus den unten genannten Quellen (Abruf am 21.10.2026). Wo eine Quelle nicht eindeutig war oder nichts hergab, steht das ausdrücklich dabei. Das Dokument ist keine Rechtsberatung.

---

## 0. Zusammenfassung (eine Seite)

**Empfehlung in zehn Zeilen**

1. **Ein Abo „LambKing Plus“, zwei Laufzeiten (monatlich und jährlich), dazu optional ein Einzelkauf je Malbuch.** Kein eigenes „Familien-Abo“: Eine Familie teilt über die Familienfreigabe der Stores (Apple: bis zu fünf Familienmitglieder, siehe Abschnitt 5).
2. **Nichts, was Kinder heute schon kostenlos haben, wird weggenommen.** Plus beginnt mit *neuen* Inhalten und mit Extras. Das schützt Bewertungen und passt zu Apples Regel, dass Nutzer, die schon alles hatten, es behalten sollen (Guideline 3.1.2(a), sinngemäß).
3. **Gratis bleiben immer:** Abenteuer „Josef“ komplett, von jedem weiteren Abenteuer die ersten drei Etappen, die Sterne und Auszeichnungen, die Grundstifte und das freie Malen, die ersten fünf Bilder jedes Malbuchs, der Anfang jeder Geschichte, Hören mit der Gerätestimme, Eltern-Bereich und der Weg zum gedruckten Buch.
4. **Hinter Plus liegen:** alle Etappen der weiteren Abenteuer, alle Malbücher in voller Länge, die Stiftebox und die Farbkästen (Wasser, Öl), das Vorlesen mit aufgenommener Stimme, die ganzen Geschichten (Stories) und der Offline-Download der Abenteuer-Pakete.
5. **Preisvorschlag:** 3,99 € im Monat, 24,99 € im Jahr (rechnerisch 2,08 € im Monat). Zum Start keine Probezeit: Die Gratis-Teile sind die Probe; eine 7-tägige Probezeit beim Jahres-Abo ist später möglich. Einzel-Malbuch einmalig 3,99 €.
6. **Zum Vergleich** (Quellen in Abschnitt 4): Epic 9,99 US-$ im Monat, Lingokids 13,49 US-$ im Monat, ANTON-Plus 7,99 bis 14,99 € im Jahr; Khan Academy Kids und die Bible App for Kids sind kostenlos ohne Werbung. LambKing liegt bewusst im unteren Bereich, weil die direkten Mitbewerber im christlichen Bereich gratis sind.
7. **Technik:** Das vorhandene Tauri-Plugin `tauri-plugin-iap` kann Abos auf iOS (StoreKit 2) und Android (Play Billing). Es ist im Projekt aber nur für iOS eingebunden und nur für Trinkgeld benutzt. Empfohlen: zuerst ohne eigenen Server und ohne Drittanbieter-Dienst (RevenueCat nicht, siehe Abschnitt 6.3), Freischaltung kommt direkt vom Store auf dem Gerät, ein Server zur Belegprüfung kommt später als zweite Stufe.
8. **Datenschutz:** Die App erfasst heute nichts Persönliches. Das soll so bleiben: keine Konten, keine Werbung, keine Analyse-Dienste. Gekauft wird nur hinter dem Eltern-Gate, das es schon gibt.
9. **Aufwand (grobe Schätzung, meine eigene):** Stufe 1 Teaser ohne Kauf 2 bis 3 Arbeitstage, Stufe 2 Kauf in der Testphase 8 bis 12 Arbeitstage, Stufe 3 Veröffentlichung 4 bis 6 Arbeitstage, dazu Antons Zeit für Konten, Verträge und Produkte in den Stores.
10. **Nicht ohne Antons Entscheidung:** Kinderkategorie bei Apple ja oder nein, Altersfreigabe (heute 18+, Ziel 4+), Preise, Umfang des Gratis-Teils bei den Geschichten (Abschnitt 3.2).

**Die nächsten drei Schritte**

1. Anton entscheidet die sechs offenen Punkte aus Abschnitt 7 (mit meinen Empfehlungen).
2. Eine Sitzung baut Stufe 1: Plus-Seite für Eltern (hinter dem Gate), Gratis-Grenzen je Abenteuer, ehrliche Texte. Noch kein Kauf, nur Test-Build.
3. Anton legt in den Stores die Verträge und Abo-Produkte an (Abschnitt 6.2 und 8), danach baut eine Sitzung Stufe 2 mit Sandbox-/Testkäufen.

---

## 1. Ziel und Grundsätze

LambKing Stories ist eine christliche Kinder-App für Kinder von 4 bis 12 Jahren (Bereiche: Malen, Lesen mit Stories, Books und Malbücher, Abenteuer, Hören, Ich). Plus soll die Arbeit an neuen Inhalten tragen helfen, ohne dass die App ein Geschäft mit Kindern wird. Daraus folgen feste Grundsätze:

- **Keine Werbung, keine Tracker.** Weder Werbung noch Analyse-Dienste (Apple verlangt das für die Kinderkategorie ohnehin weitgehend, Guideline 1.3).
- **Kinder kaufen nie selbst.** Jede Stelle, die Geld kostet, liegt hinter dem Eltern-Gate (`useParentalGate.ts`: Zahlwort abtippen). Das Kind sieht höchstens ein freundliches „Frag eine erwachsene Person“.
- **Kein Druck.** Keine Zähler, keine Zeitlimits, keine roten Ausrufezeichen, kein automatisch aufspringendes Fenster. Die Plus-Hinweise erscheinen nur, wenn ein Kind etwas Gesperrtes selbst antippt (so ist der vorhandene Teaser schon gebaut).
- **Ehrlich.** Preis, Laufzeit, Verlängerung und Kündigung stehen klar da, bevor jemand zahlt. Kein „kostenlos“, wenn es nach der Probezeit kostet.
- **Sterne und Auszeichnungen sind nie gesperrt.** Sie sind Belohnung, keine Ware.
- **Das gedruckte Buch bleibt sichtbar.** Der Weg zum Store (`lambking.store`) läuft weiter über `openExternal` mit Eltern-Gate. Gedruckte Bücher sind physische Ware und dürfen verlinkt werden (Apple 3.1.3(e), Google Payments Policy Abschnitt 3).
- **Das Abo ersetzt kein Spendenangebot.** Trinkgeld über StoreKit (iOS) und PayPal/Ko-fi (Android, Web) bleiben getrennt vom Abo. Auf iOS darf es keinen Link zu PayPal/Ko-fi geben (steht schon so im Code und in `tests/iosNoExternalPayment.test.ts`).

---

## 2. Was es im Code heute schon gibt

| Baustein | Datei | Stand |
|---|---|---|
| Schaltkasten für Plus | `src/use/usePremium.ts` | Funktionen `hasFeature`, `hasBook`, `showUpsell`, `setEntitlements`, `setOwnedBooks`. Features: `pencilBox`, `paintBoxes`, `readAloud`, `allBooks`, `book`. Standard: alles frei. Flags: `VITE_PREMIUM_TEASER` (sperren und Hinweis zeigen), `VITE_PREMIUM_PREVIEW` (wie ein Abonnent testen). Kein Kauf angebunden. |
| Gratis-Anteil bei Büchern | `src/use/useBookAccess.ts` | Malbuch: 5 Bilder (oder eigener Wert `freePages` je Buch aus dem AdminUI), andere Bücher: 15 % des Textes bis zum Absatzende. Nur mit Teaser-Flag aktiv. |
| Hinweisfenster | `src/components/molecules/PremiumSheet.vue` | Zeigt „Kommt bald“ und den Link zum gedruckten Buch. Kein Kaufknopf. |
| Eltern-Gate | `src/use/useParentalGate.ts` | Zahl 21 bis 99 als Wort abtippen, in nativen Builds an. Vor externen Links und Trinkgeld. |
| Kauf-Plugin | `@choochmeque/tauri-plugin-iap-api` 0.9.1 und `tauri-plugin-iap` 0.9 | Nur für iOS eingebunden (`src-tauri/Cargo.toml`: „iOS only … Google Play Billing, which the Play release neither uses nor should declare“). Heute nur für fünf Trinkgeld-Beträge (`useTips.ts`). |
| Kaufprüfung iOS | `src-tauri/plugins/tauri-plugin-purchase-check` | Fragt `SKPaymentQueue.canMakePayments()`, damit die App sagen kann „Käufe sind auf diesem Gerät ausgeschaltet“ (Bildschirmzeit, Arbeits-iPad). |
| Backend | `server/` | Bücher, Serien, Kategorien, Uploads, Aufrufzähler. **Keine Benutzer, keine Käufe.** Die App sendet laut Kommentar in `apiHeaders.ts` nichts Identifizierendes. |

**Wo Plus später eingreift:** Die Sperrstellen gibt es schon in `AppColoringView` (Stiftekästen, Seitengrenze), `AppColoringBookView` (Seiten sperren), `AppReaderView` und `AppBookDetailView` (Textgrenze, Vorlesen). Für die Abenteuer gibt es noch **keine** Sperrstelle (`AppAdventureView`, `AppAdventureStageView`); sie müsste neu geschaffen werden.

**Was an Inhalten da ist (Stand heute):**

- **Abenteuer:** öffentlich ist nur „Josef“ (`journeys = [josef]` in `src/data/adventures/index.ts`). Weitere acht sind fertig gebaut, aber versteckt (Adam und Eva, Noah, Babel, Abraham, Jakob, Josua, Gideon, Mose), geplant ist eine Gesamtreise von 31 Abenteuern. Jedes hat 12 bis 15 Etappen, Minispiele, Sterne, einen Pokal und ein Download-Paket von etwa 10 bis 17 MB.
- **Stories:** laut Live-Backend 256 Bücher in sechs Reihen (Talheim 90, Christus-Code 100, Lina und Ben 20, Gute Nacht Lilly 22, Levi 13, Frucht-Agenten 10; Stand der öffentlichen Liste am 21.10.2026), dazu die Malbücher.
- **Malbücher:** vorbereitet sind 13 neue Bücher (9 der Reihe „Mit Buntstift durch die Bibel“, 4 der Reihe „Bibelgeschichten zum Ausmalen“), eingespielt wird es von Anton (siehe `D:\Claude\ausmalbuch-import\LIESMICH-Malbuecher-Stand-2026-10-21.md`).
- **Mal-Werkzeuge:** sechs Stiftekästen (bunt, Filz, Wasser, Öl, Bleistift, Kreide), Pipette, Eimer mit Lückenschluss, Hintergründe.
- **Vorlesen:** Bei Etappen mit Aufnahme wird die Aufnahme gespielt (`public/audio/abenteuer/…`), sonst liest die Gerätestimme (Sprachausgabe des Telefons, es wird nichts gesendet). Es entstehen also **keine laufenden Kosten je Vorlesen** (nur Speicher und Auslieferung der Dateien).
- **Hören:** Hörgeschichten aus dem Backend (`AppHoerenView`).
- **Englisch:** Die Oberfläche ist zweisprachig. Bücher haben teils englische Fassungen, die neuen Malbücher der Reihe 9 bis 12 sind zweisprachig.
- **Offline:** Abenteuer-Pakete und Bücher werden auf dem Gerät gespeichert (IndexedDB).

---

## 3. Was bleibt gratis, was liegt hinter Plus

Die Leitfrage jeder Säule: **Was braucht ein Kind, damit die App allein schon etwas wert ist, und was ist so aufwendig, dass es Unterstützung verdient?** Apple will außerdem, dass die App ohne Zahlung nützlich bleibt und Abos „laufenden Wert“ bieten (Guideline 3.1.2(a)). Dafür sprechen die laufend neuen Abenteuer und Malbücher.

### 3.1 Abenteuer (Kernstück der App)

| Variante | Inhalt | Vorteile | Nachteile |
|---|---|---|---|
| **A: Zwei gratis, Rest Plus** | Josef (und Noah, wenn er erscheint) komplett gratis, alle anderen komplett mit Plus | Sehr einfach zu erklären, klare Grenze | Kinder sehen die anderen Abenteuer nur als Schloss; kaum Probe; hohe Hürde, wenn Josef schon durchgespielt ist |
| **B: Probe je Abenteuer** | Josef komplett gratis; von jedem weiteren Abenteuer die ersten 3 Etappen (Karte, Sterne, Minispiele inklusive), der Rest mit Plus | Jedes Abenteuer lässt sich ausprobieren; die Eltern sehen die Qualität vor dem Kauf; wächst mit jedem neuen Abenteuer mit | Etwas mehr Bau-Aufwand (Grenze je Abenteuer, Sperrbild je Etappe); halb gespielte Abenteuer können enttäuschen |
| **C: Abenteuer ganz gratis** | Alle Abenteuer frei, Plus nur für Malbücher, Mal-Boxen, Vorlesen | Einfachster Start, Abenteuer wirken wie Werbung für die Bücher | Das teuerste Stück an Arbeit bringt gar nichts ein; später schwer einzuschränken (Wegnehmen) |

**Empfehlung: B.** Josef bleibt der große Gratis-Einstieg. Jedes neue Abenteuer ist am Anfang spielbar. Die Gratis-Grenze steht in der Daten-Datei des Abenteuers (z. B. ein Feld `freeStages: 3`), damit sie je Abenteuer änderbar ist. Der Sperrhinweis kommt nur, wenn ein Kind eine gesperrte Etappe antippt.

### 3.2 Stories und Bücher (Lesen)

Anton hat am 11./12.10.2026 gewünscht: alle Bücher nur etwa 15 % des Textes sichtbar (bis zum Absatzende), danach Hinweis „digital mit Plus oder als Buch im Shop“. Das ist gebaut (Variante A).

| Variante | Inhalt | Vorteile | Nachteile |
|---|---|---|---|
| **A: 15 % bei allem** (so gebaut) | Jede Geschichte nur anfangs frei | Starker Anreiz für Plus und für den Buchkauf | Betrifft 256 bisher freie Bücher: Das ist ein **Wegnehmen**. Viele Geschichten sind Einschlafgeschichten (Talheim), ein Abbruch nach 15 % ist für Eltern am Bett schlecht |
| **B: Reihen-Probe** | Von jeder Reihe die ersten 2 bis 3 Bücher ganz gratis, alle anderen 15 % | Jede Reihe lässt sich richtig kennenlernen; weniger hart | Regel ist etwas schwerer zu erklären |
| **C: Stories gratis** | Alle Geschichten frei, Plus bringt Vorlesen mit Stimme, Malbücher, Abenteuer | Maximale Reichweite für die Bibelgeschichten | Keine Einnahme aus dem größten Inhaltsbestand; Stories würden die gedruckten Bücher weniger anschieben |

**Empfehlung: B als Start, A erst, wenn der Bestand an Plus-Extras groß genug ist.** Begründung: Wer eine Gute-Nacht-Geschichte nach 15 % abbricht, wird die App eher löschen als abonnieren. Bei B zeigt jede Reihe zuerst ihre besten Anfänge ganz, danach greift die 15-%-Regel (Anton kann das später verschärfen). Für „Books“ (gedruckte Bücher im Store) gilt nichts davon: Das sind Hinweise zum Store, kein Inhalt.

### 3.3 Malbücher

Anton will fünf Bilder frei, den Rest per Abo oder Einzelkauf (so gebaut, mit `freePages` je Buch einstellbar).

| Variante | Inhalt | Bewertung |
|---|---|---|
| **A: 5 Bilder gratis, Rest Plus oder Einzelkauf** (so gebaut) | Wie gewünscht | Gut: klare Probe, Einzelkauf gibt Eltern, die kein Abo wollen, eine Möglichkeit |
| **B: 1 Buch ganz gratis** (z. B. ein Band), alle anderen 5 Bilder | Ein vollständiges Buch zum Verlieben | Zusätzlich möglich, kostet kein Entwickeln (nur `freePages` des Buchs auf die Seitenzahl setzen) |
| **C: Alle Malbücher mit Plus** | Nur Plus | Zu hart, Eltern sehen nichts |

**Empfehlung: A, ergänzt um B** (ein Buch, z. B. Band 1 „Gott erschafft die Welt“, ganz gratis). Der Einzelkauf pro Buch (einmalig, nicht verbraucht) bleibt als Alternative zum Abo. Er deckt die Eltern ab, die „nur dieses eine Buch“ wollen, und ist der natürliche Übergang zum gedruckten Buch.

### 3.4 Mal-Werkzeuge

Heute vorbereitet: `pencilBox` (große Stiftebox), `paintBoxes` (Wasser und Öl). Grundstifte, Eimer, Radierer, freies Blatt bleiben gratis, sonst ist das Malen keine Malen-App mehr. **Empfehlung:** wie vorbereitet: Stiftebox und Farbkästen hinter Plus; Auszeichnungen und Sicherung der Bilder (ZIP hinter dem Gate) bleiben gratis. Eigene Bilder des Kindes dürfen nie gesperrt werden, auch nicht nach Ablauf des Abos (Ausnahme nur: Zusatz-Werkzeuge werden nicht mehr angeboten; bereits gemalte Bilder bleiben).

### 3.5 Vorlesen mit KI-Stimme

Die Gerätestimme ist gratis und kostet nichts. Die **aufgenommene** Stimme (die Dateien in `public/audio/abenteuer/…`, später auch für Geschichten) ist ein klarer Plus-Wert, weil sie viel besser klingt und Produktionsarbeit steckt darin. **Empfehlung:** Gerätestimme gratis, aufgenommene Stimme mit Plus. Sonderfall: Bei den gratis Etappen (Josef, die ersten drei Etappen der anderen) spielt die Aufnahme auch gratis, sonst klingt die Probe schlechter als das Produkt.

### 3.6 Englische Fassung

Die Sprache selbst bleibt immer gratis (kein Sprachzugang hinter einer Schranke). Gesperrt wird nach denselben Regeln wie die deutsche Fassung. **Empfehlung:** kein eigener Plus-Punkt.

### 3.7 Download und Offline

Heute gibt es Abenteuer-Pakete (10 bis 17 MB). **Empfehlung:** Download ist Teil von Plus nur für die Plus-Etappen (ohnehin bei Plus-Inhalt); die gratis Etappen sind wie bisher ladbar. Es gibt keinen Grund, den Offline-Modus künstlich zu sperren, und für Familien im Auto oder Flugzeug ist er ein guter Plus-Satz („auch ohne Netz“).

### 3.8 Hören

Die Hörgeschichten aus dem Backend (z. B. Talheim) liegen als fertige Aufnahmen vor. **Empfehlung:** wie bei den Geschichten: Reihen-Probe gratis (Variante B aus 3.2), der Rest mit Plus. Solange die Hörfassung von der Textfassung abhängt, gilt dieselbe Grenze.

### 3.9 Sterne, Pokale, Auszeichnungen

**Immer gratis** (Grundsatz in Abschnitt 1). Sie gehören zum Spielverlauf und sind keine Ware.

### 3.10 Gesamtbild (Empfehlung)

| | Gratis | LambKing Plus |
|---|---|---|
| Abenteuer | Josef komplett; erste 3 Etappen jedes weiteren | Alle Etappen aller Abenteuer, auch neue |
| Stories | Von jeder Reihe die ersten 2 bis 3 Bücher ganz, sonst Anfang (15 %) | Alle Geschichten in voller Länge |
| Books | Ansicht und Weg zum Store | (nicht betroffen) |
| Malbücher | Je Buch 5 Bilder, ein Buch ganz | Alle Bilder aller Malbücher; Einzelkauf je Buch möglich |
| Mal-Werkzeuge | Grundstifte, Eimer, Radierer, freies Blatt | Stiftebox, Wasser- und Ölfarben |
| Vorlesen | Gerätestimme; Aufnahme bei den Gratis-Etappen | Aufgenommene Stimme überall |
| Hören | Probe je Reihe | Alles |
| Offline | Gratis-Etappen | Alle Pakete |
| Sterne, Auszeichnungen, Sicherung | immer | immer |

---

## 4. Preismodell

### 4.1 Preise ähnlicher Apps (Abruf 21.10.2026)

| App | Preismodell | Quelle und Hinweis |
|---|---|---|
| **Epic** (Kinderbücher, USA) | Monatlich 9,99 US-$ (App-Store-Eintrag listet weitere Stufen von 4,99 bis 13,99 US-$), 7 Tage Probezeit | App-Store-Eintrag USA (siehe Quellen 11). Mehrere Einträge mit gleichem Namen, die Zuordnung der Stufen ist nicht belegt. Altersfreigabe 4+. |
| **ANTON** (Lern-App, Deutschland, solocode GmbH) | „ANTON-Plus“ 7,99 bis 14,99 € (Einzelperson) und Familie 19,99 bis 49,99 €; Lehrkraft 39,99 € | App-Store-Eintrag Deutschland (Quelle 12). Die Laufzeit (nach einer Auswertung von Adapty: Jahreszahlung) steht im Eintrag nicht; nur die Preise sind belegt. |
| **Lingokids** (Englisch lernen, 2 bis 8 Jahre) | 13,49 US-$ monatlich nach 7 Tagen Probezeit oder 161,88 US-$ im Jahr | Hilfeseite des Anbieters (Quelle 13, Seite lieferte beim Abruf 403; Zahlen stammen aus dem Suchergebnis). Preis je Land und Store verschieden. |
| **Hopster** (Kinder-Video) | 7,99 US-$ im Monat oder 60,99 US-$ im Jahr, 7 Tage Probezeit | Nur Aggregator-Seiten, nicht die Seite des Anbieters (Quelle 14). Die Anbieter-Seite nennt nur „Start 7 day free trial“. Mit Vorsicht benutzen. |
| **Noggin** (Nick Jr.) | früher 7,99 US-$ im Monat; Dienst nach einer Seite von noggin.com eingestellt | Quelle 15; Datum der Einstellung nicht belegt. |
| **Khan Academy Kids** | kostenlos, „no ads or subscriptions“ | App-Store-Eintrag (Quelle 16), Altersfreigabe 4+. |
| **Bible App for Kids** (YouVersion/OneHope) | kostenlos, keine Werbung, keine In-App-Käufe | Aussage in mehreren Quellen (Quelle 17), nicht im offiziellen Eintrag nachgeprüft. |
| **Superbuch/Superbook Kids Bible** | App kostenlos | App-Store-Eintrag (Quelle 18). Das bezahlte „Superbook Academy“ (25 US-$ im Monat oder 250 US-$ im Jahr) ist ein Sonntagsschul-Dienst, kein Vergleich zur App. |
| **Sinti- und Kalderasch-Kinderbibel** (deutsch) | kostenlos | App-Store-Einträge (Quelle 19) |

**Was daraus folgt:** Die großen Lern- und Lese-Apps (Epic, Lingokids, ANTON) liegen bei etwa 8 bis 14 € bzw. US-$ **im Jahr** (ANTON, Jahresausrichtung nicht sicher) bis etwa 10 bis 13 US-$ **im Monat** (Epic, Lingokids). Die direkten christlichen Mitbewerber sind kostenlos. Keine Quelle konnte mir belastbare Umwandlungsraten (wie viele Gratis-Nutzer zahlen) für Kinder-Apps nennen; die Berichte von RevenueCat und Adapty sind nur zusammengefasst auffindbar, nicht nach Kinder-Apps aufgeschlüsselt (Quellen 20). Deshalb gibt es unten nur Rechenbeispiele, keine Prognose.

### 4.2 Vorschlag

| Produkt | Preis (inkl. Steuer) | Bemerkung |
|---|---|---|
| **Plus monatlich** | 3,99 € | Für Eltern, die „mal ausprobieren“ wollen; jederzeit kündbar |
| **Plus jährlich** | 24,99 € (2,08 €/Monat, etwa 48 % unter zwölf Monatsbeiträgen) | Das Standardangebot, hervorgehoben; **7 Tage Probezeit nur später, falls gewünscht** (Apple: Einführungsangebot „kostenlose Testphase“ je Abo-Gruppe einmalig; Apple verlangt die Angabe von Dauer und Folgepreis, Quelle 4) |
| **Einzel-Malbuch** | 3,99 € je Buch, einmalig, nicht verbrauchbar | „Nur dieses Buch“, bleibt für immer; Wiederherstellung nötig (Apple 3.1.1) |
| **Familie** | kein eigenes Produkt | Familienfreigabe der Stores deckt das ab (Apple: bis zu fünf Familienmitglieder, in App Store Connect je Abo einzuschalten und **nicht rücknehmbar**, Quelle 5). Für Google ist das Teilen von Abos hier nicht belegt: vor dem Zusagen prüfen. |
| **Lebenslang (Einmalkauf)** | nicht empfohlen | Würde alle späteren Abenteuer ewig verschenken; Apple fordert bei Systemwechsel auch Schutz der bisherigen Käufer (3.1.2(a)). |

Begründung der Höhe: 24,99 € im Jahr entspricht etwa zwei gedruckten Malbüchern (Preisvorschlag 11,90 € in `00_LIESMICH_KDP_Upload.md`, bei Buntstift Band 1 laut Notiz 11,99 € bei Amazon.de). Das ist für Familien eine überschaubare Summe, liegt unter den großen Lern-Apps und über dem kostenlosen christlichen Wettbewerb, weil hier ständig neue, aufwendig gebaute Abenteuer dazukommen.

### 4.3 Was bei Anton ankommt (Rechenbeispiel)

Annahmen: 19 % Umsatzsteuer in Deutschland, Apple und Google führen die Steuer ab (so ist es meines Wissens bei beiden Stores üblich, hier nicht geprüft). **Provision:** Apple-Kleinunternehmerprogramm 15 % auf Käufe und Abos bis 1 Mio. US-$ Umsatz im Jahr (Quelle 6). Ohne das Programm gibt Apple 70 % im ersten Abo-Jahr, danach 85 % (Quelle 4). Google: 15 % Servicegebühr auf Abos (Quelle 7).

| Produkt | Preis | ohne Steuer (÷ 1,19) | nach 15 % Provision |
|---|---|---|---|
| Jahres-Abo | 24,99 € | 21,00 € | **17,85 €** |
| Monats-Abo | 3,99 € | 3,35 € | **2,85 €** |
| Einzel-Malbuch | 3,99 € | 3,35 € | **2,85 €** |

Das ist vor Einkommensteuer und vor den Kosten für Hosting (Render, Cloudflare) und Arbeit. Beispiel zur Größenordnung, **keine Prognose**: Zahlen 40 Familien das Jahres-Abo, bleiben etwa 714 € im Jahr. Das deckt keine Arbeitszeit. Plus ist also **eine Unterstützung der laufenden Arbeit**, kein Geschäftsmodell für den Anfang. Das spricht für niedrigen Einstieg (kein Server, kein Drittanbieter) und gegen Preise, die Familien vergraulen.

### 4.4 Testzeitraum

- 7 Tage kostenlos nur beim Jahres-Abo (die Zahl 7 benutzen Epic, Lingokids und Hopster auch).
- Kein Testzeitraum beim Monats-Abo und beim Einzelkauf.
- **Wichtig für Eltern:** Der Text sagt „7 Tage kostenlos, danach 24,99 € im Jahr, jederzeit in den Einstellungen des Stores kündbar“. Apple verlangt, dass der abgerechnete Betrag die auffälligste Preisangabe ist und Ersparnis-Angaben kleiner stehen (Quelle 4).
- Alternative ohne Kauf-Risiko: Gratis-Etappen und Gratis-Bilder (Abschnitt 3) *sind* die Probe. Dann braucht es keinen Testzeitraum. Das wäre die einfachste Wahl für Stufe 2.

---

## 5. Store-Regeln (nur was in den offiziellen Texten steht)

Abruf aller Texte am 21.10.2026. Die Seiten nennen nicht immer ein Datum (siehe Hinweise). Das ist keine Rechtsberatung; bei Zweifeln fragt Anton Apple/Google (Entwickler-Support) oder eine fachkundige Person.

### 5.1 Apple (App Review Guidelines, Quelle 1; Kinder-Apps-Seite, Quelle 2)

- **1.3 Kinderkategorie:** Keine Links aus der App hinaus, keine Kaufmöglichkeiten und keine Ablenkungen, außer in einem eigenen Bereich **hinter einem Eltern-Gate**. Keine Werbung von Dritten (eng begrenzte Ausnahme), keine Analyse von Dritten (eng begrenzte Ausnahme, ohne IDFA, ohne Daten über Kinder, Standort oder Gerät/Netzwerk). Personenbezogene und Geräte-Daten dürfen nicht an Dritte gehen. Kinder-Apps müssen die Kinder-Datenschutz-Gesetze erfüllen.
- **Altersbänder:** In App Store Connect wählt man bei der Kinderkategorie ein Band: 5 und jünger, 6 bis 8 oder 9 bis 11 (Kinder-Apps-Seite). Die Guidelines-Seite nennt die Bänder nicht.
- **Eltern-Gate (Kinder-Apps-Seite):** Aufgabe auf Erwachsenen-Niveau (Beispiele: Rechenaufgabe, Fragen), schützt vor Käufen und Links nach draußen. Zusätzlich gibt es für Käufe „Ask to Buy“ (Anfrage ans Elternteil). Das vorhandene Zahlwort-Gate passt zu dieser Beschreibung.
- **3.1.1:** Freischalten von Funktionen oder Inhalten (Abos, Premium-Inhalte, Vollversionen) **muss** über In-App-Kauf laufen; eigene Wege (Lizenzschlüssel, QR-Codes usw.) sind nicht erlaubt. Käufe, die man wiederherstellen kann, brauchen eine **Wiederherstellen-Funktion**. Trinkgeld über In-App-Kauf ist erlaubt (das nutzt die App schon).
- **3.1.2 Abos:** Mindestlaufzeit 7 Tage; muss auf allen Geräten des Nutzers funktionieren; Abos dürfen neben Einzelkäufen angeboten werden; **wer früher eine Vollversion gekauft hat, soll bei einem Wechsel auf Abo seinen Zugang behalten**; vor dem Abschluss muss klar stehen, was man für den Preis bekommt (Pflichtangaben nach Schedule 2 des Entwicklervertrags). Kostenlose Testphasen stellt man in App Store Connect ein.
- **Was die App-Store-Seite zusätzlich verlangt (Quelle 4):** Auf dem Kaufbildschirm Name, Dauer, Leistung und vollständiger Verlängerungspreis; Links zu **Nutzungsbedingungen und Datenschutzerklärung** in der App und in den Store-Angaben; ein Weg zum Wiederherstellen für bestehende Abonnenten; Testphasen nennen Länge und Folgepreis. Eine Abo-Gruppe für alles empfohlen, damit niemand zwei Abos überschneidend abschließt. Familienfreigabe: bis zu fünf Familienmitglieder (nicht umkehrbar). Preise: 800 Preisstufen; Preissenkungen gelten automatisch, Preiserhöhungen können die Zustimmung der Abonnenten brauchen.
- **3.1.3(e):** Physische Waren und Dienste, die außerhalb der App genutzt werden, dürfen außerhalb des In-App-Kaufs verkauft werden. Das deckt den Link zum gedruckten Buch. Die App darf aber keine anderen Kaufwege für digitale Inhalte bewerben (3.1.3, mit der Ausnahme für die US-Storefront, hier nicht benutzt).
- **5.1.4:** Kinder-Daten sorgfältig behandeln (COPPA, DSGVO). **Ein Eltern-Gate ist nicht dasselbe wie überprüfbare elterliche Einwilligung** nach diesen Gesetzen (wörtlich sinngemäß aus der Seite). Apps für Kinder brauchen eine Datenschutzerklärung. „Für Kinder“ in den Store-Texten ist der Kinderkategorie vorbehalten (2.3.8): wer die Kategorie nicht wählt, darf Kinder nicht als Hauptzielgruppe nennen.
- **Provision:** Kleinunternehmerprogramm 15 % bis 1 Mio. US-$ (Quelle 6). Auf der Seite steht außerdem eine Senkung für Abos nach dem ersten Jahr (10 %), die Zuordnung ist dort unklar; **nicht darauf rechnen**.
- **Nicht gefunden:** Die Guidelines-Seite nennt keine Versionsnummer und kein Datum („our latest guidelines“). Der letzte Teil der Seite (14.428 Zeichen) wurde nicht gelesen.

### 5.2 Google Play (Families Policy, Quelle 8; Payments Policy, Quelle 9; Gebühren, Quelle 7; Abrechnungs-Sicherheit, Quelle 10)

- **Zielgruppe:** Vor der Veröffentlichung gibt man die Altersgruppen an; Google kann sie überschreiben, wenn Bilder oder Wörter eine andere Zielgruppe nahelegen. Falsche Angaben können zur Sperre führen. Antworten zu Zielgruppe, Datensicherheit und Inhaltsbewertung (IARC) aktuell halten.
- **Datenpraxis:** Alle personenbezogenen Daten von Kindern angeben, auch aus SDKs. In reinen Kinder-Apps keine Werbe-ID übertragen, keine Standortabfrage; nur für Kinder zugelassene SDKs.
- **Werbung:** Nur selbstzertifizierte Werbe-SDKs; Beschränkungen bei Formaten. (LambKing hat keine Werbung.)
- **Käufe in Kinder-Apps:** Die Families-Seite sagt zu Eltern-Gate oder Prüfung bei Käufen **nichts** (nur zu Werbeformaten und dazu, dass virtuelle Münzen von echtem Geld klar unterscheidbar sein müssen). Käufe laufen deshalb nur über die Play-eigenen Eltern-Freigaben (Family Link, Quelle 21) plus das Eltern-Gate der App; das Gate ist hier nicht vorgeschrieben, aber sinnvoll.
- **Zahlungen:** Für Abos und digitale Inhalte **muss** Google Play Billing benutzt werden (Payments Policy, Abschnitte 1 und 2). **Verweise auf andere Zahlwege sind in der App untersagt** (Abschnitt 4: Store-Seite, Hinweise in der App, Webansichten, Knöpfe). Ausnahme: Physische Waren (Abschnitt 3); damit bleibt der Link zum gedruckten Buch erlaubt. Preise in der App müssen den Preisen in der Play-Abrechnung entsprechen (Abschnitt 6). Zu Testphase, Abrechnungsabstand und Kündigung enthält die Seite nichts.
- **Gebühr:** 15 % Servicegebühr auf Abos (Quelle 7). Die Seite nennt Sonderraten für einzelne Regionen mit Daten (30.06.2026 und 30.09.2026); die Regeln sind in Bewegung, vor dem Start neu nachsehen.
- **Technik-Hinweis von Google (Quelle 10):** Kauf **auf dem eigenen Server prüfen** (Play Developer API `subscriptionsv2`), Kauf erst bei Status PURCHASED freischalten (nicht bei PENDING), **innerhalb von drei Tagen bestätigen** („acknowledge“), sonst wird automatisch erstattet.
- **Kein Datum:** Die Policy-Seiten zeigen nur „©2026 Google“, keine Version.

### 5.3 Datenschutz

- **COPPA (USA):** Gilt für Dienste, die an Kinder unter 13 gerichtet sind (FTC-Seite, Quelle 22). Geänderte Regel im Federal Register vom 22.04.2025 (90 FR 16918), in Kraft seit 23.06.2025, Frist für die meisten Teile **22.04.2026** (nach einer Zusammenfassung; drei Teilregeln ausgenommen; Quelle 23, die Original-Seite des Federal Register wurde nicht gelesen). Die Frist ist also vorbei. Wenn LambKing keine persönlichen Daten erfasst (auch keine festen Kennungen), gibt es wenig zu regeln; das gilt es vor jeder Anbindung (Server, Drittanbieter) neu zu prüfen.
- **DSGVO Art. 8 (EU):** Einwilligung eines Kindes in einen Online-Dienst ist unter 16 Jahren nur mit Zustimmung der Eltern wirksam; Mitgliedstaaten dürfen auf bis zu 13 absenken. Der Anbieter muss „angemessene Anstrengungen“ unternehmen, die Zustimmung zu prüfen (Quelle 24). Wirksamkeit des Kaufvertrags richtet sich nach nationalem Recht und bleibt unberührt. **Für LambKing heißt das:** Kauf nur durch Eltern; keine Daten von Kindern; keine Konten.
- **Datenschutzerklärung:** Der App-Abschnitt auf `lambking.store/datenschutz` muss vor dem Abo aktualisiert werden (laut Projektnotiz noch alte Aussagen wie „keine In-App-Käufe“). Apple und Google verlangen sie ausdrücklich.
- **Unsicherheit:** Welche deutschen Verbraucherregeln (Widerruf bei digitalen Inhalten, Preisangaben, Hinweis zur Kündigung) zusätzlich beim Verkauf über die Stores gelten und wer als Verkäufer auftritt, habe ich nicht geprüft. Dazu bitte kurze fachliche Auskunft einholen (Abschnitt 8).

---

## 6. Technische Umsetzung im vorhandenen Aufbau

### 6.1 Beurteilung des vorhandenen Plugins

`tauri-plugin-iap` (0.9, JS-Paket `@choochmeque/tauri-plugin-iap-api` 0.9.1; Quelle: README im Paket, lokal gelesen):

- **Kann:** Produkte abfragen (`getProducts`), kaufen (`purchase`, Abos und Einmalkäufe), wiederherstellen (`restorePurchases`), Besitz und Abo-Status prüfen (`getProductStatus` mit `isOwned`, `isAutoRenewing`), Käufe bestätigen (`acknowledgePurchase`), Ereignisse (`onPurchaseUpdated`), Einführungsangebote und Testphasen, auf Android Angebots-Token, Fraud-Prevention-IDs und Upgrade/Downgrade. iOS: StoreKit 2 (iOS 15+), Android: Play Billing Library 8.
- **Passt zu uns, weil:** Kein Benutzerkonto nötig (der Store-Account ist das Konto), kein Drittanbieter-Server, bereits auf iOS im Einsatz (Trinkgeld) und dort bewährt, Erweiterung für Abos ohne neues Plugin.
- **Offen/zu klären:**
  1. **Android ist im Projekt nicht eingebunden** (`Cargo.toml` nur für `target_os = "ios"`). Das ist bewusst so, weil das Plugin sonst die Billing-Berechtigung in die Android-App zieht. Mit Plus wird das nötig; dann muss die Play-Seite (Console-Angaben, Berechtigung) neu beurteilt werden.
  2. Das Plugin ist ein kleines Drittprojekt (ein Betreuer). Vor dem Verlassen darauf: Stand der Pflege, offene Fehler, Android-Verhalten (Abo-Status, Bestätigen innerhalb von 3 Tagen) in einem Test-Build prüfen. Als Rückfallweg bleibt ein eigenes Plugin wie `purchase-check`.
  3. **Windows (Electron) und Web** haben keinen Store-Kauf in dieser App. Plus wäre dort nicht kaufbar; die Web-Version bleibt ein Demo, die Windows-Version bleibt gratis oder ohne Plus-Inhalt. Sagen, nicht verstecken.

### 6.2 StoreKit 2 und Play Billing, das Wesentliche

- **Produkte** in beiden Stores anlegen: ein Abo mit zwei Laufzeiten (eine Abo-Gruppe bei Apple), ein Einzelkauf je Malbuch (nicht verbrauchbar), später weitere. Produkt-IDs wie `com.stories.lambking.plus.monthly`, `….plus.yearly`, `….book.<bookId>` (Bücher-ID aus dem Backend). Das Muster der Trinkgeld-IDs ist `com.stories.lambking.support.N`.
- **Wiederherstellen:** Auf iOS `restorePurchases`/`Transaction.currentEntitlements`, auf Android `queryPurchases`. Eine gut sichtbare „Käufe wiederherstellen“-Schaltfläche **im Eltern-Bereich** (Apple verlangt sie, 3.1.1).
- **Familienfreigabe:** iOS: je Abo in App Store Connect einschalten (nicht rücknehmbar), Zugang kommt über die Transaktion der Familie. Android: Teilen von Abos nicht belegt, prüfen.
- **Test:** iOS: Sandbox-Testkonten und StoreKit-Konfigurationsdatei, TestFlight; Android: Lizenztester und Test-Spur (geschlossener Test). Anton legt Testkonten an, eine Sitzung baut und beschreibt den Test.

### 6.3 RevenueCat oder ähnliches: ja oder nein?

**Empfehlung: nein (für den Anfang).**

| | Eigene Anbindung (Plugin + Store) | RevenueCat o. ä. |
|---|---|---|
| Kosten | keine | RevenueCat „Pro“: gratis bis 2.500 US-$ „monthly tracked revenue“, darüber 1 % (Quelle 25) |
| Datenschutz | Kein Dienst im Spiel, die App sendet nichts | Ein Drittanbieter bekommt Käufe und Gerätekennungen (genau was belegt ist, habe ich nicht gefunden: die Anbieter-Seite zur Kinderkategorie lieferte 404) |
| Apple 1.3 | Keine Frage | Apple schreibt: **keine** personenbezogenen oder Geräte-Daten an Dritte in der Kinderkategorie, Analyse von Dritten nur in engsten Ausnahmen. Ein RevenueCat-Mitarbeiter hat in einem Forum 2021 gesagt, mehrere Kinder-Apps nutzten es, solange man AdSupport, Analyse-Plugins und die automatische Suchanzeigen-Erfassung meidet (Quelle 26, alt) |
| Aufwand | etwas mehr eigene Arbeit (Status, Cache, Wiederherstellen) | weniger Code, dafür Konten bei einem weiteren Dienst |
| Plattformen | Plugin für iOS und Android | SDK für Tauri/Web nicht belegt (nicht geprüft) |

Das Risiko bei einem Drittanbieter in einer Kinder-App ist größer als der Zeitgewinn. Wenn später Familien-Konten, mehrere Plattformen oder Web-Abos dazukommen, kann man neu entscheiden.

### 6.4 Belegprüfung im Backend (`server/`)

- **Stufe 1 ohne Server:** iOS: StoreKit 2 prüft Transaktionen auf dem Gerät (signierte Belege), die App fragt Besitz beim Start und beim Fortsetzen. Android: Play Billing meldet den Status. Es gibt **keine Konten**, also reicht „der Store sagt, es gehört dem Gerät-Konto“. Ergebnis wird mit Ablaufzeit lokal gespeichert (damit Offline funktioniert, z. B. 7 Tage Kulanz).
- **Stufe 2 mit Server (optional, empfohlen vor großer Reichweite):** Google empfiehlt ausdrücklich Prüfung und Bestätigung auf einem eigenen Server (Play Developer API `subscriptionsv2`, Status PURCHASED, Bestätigung, `purchaseToken` als Schlüssel; Quelle 10). Apple liefert die App Store Server API und Benachrichtigungen (Quelle 4). Das Backend (`server/`, Express, MongoDB) bräuchte: eine Tabelle `entitlements` (nur Token-Hash, Produkt, Ablauf, kein Gerät, keine Person), zwei Eingänge für Store-Benachrichtigungen, eine Abfrage „ist dieser Beleg gültig?“. Wichtig für den Datenschutz: **kein Benutzer-Bezug**. Für Android die „obfuscatedAccountId“ als zufälliger Wert je Installation, nicht aus Konto-Daten.
- **Warum nicht gleich Stufe 2?** Ohne Konten und bei kleinem Umsatz ist das Betrugsrisiko gering; der Server wäre die erste Stelle, die Käufer-Daten berührt. Das sollte bewusst und mit angepasster Datenschutzerklärung geschehen.

### 6.5 Wie Freischaltung und Gratis-Teile im Code aussähen

(Beschreibung, kein Code.)

- `usePremium.ts` bleibt der einzige Ort. `setEntitlements()` und `setOwnedBooks()` füllt ein neues `usePurchases`: beim Start Besitz abfragen, auf `onPurchaseUpdated` hören, Ergebnis lokal speichern. Features: `allBooks` und die Abenteuer-Freigabe bekommen ein neues Feature `adventures` (alle Etappen). `useBookAccess` bekommt die Reihen-Probe (Abschnitt 3.2).
- **Abenteuer:** In jeder Abenteuer-Datei ein Feld `freeStages` (Standard 3; Josef: alle). `AppAdventureView` zeigt ab dieser Etappe ein Schloss, `AppAdventureStageView` fragt `hasFeature('adventures')` und öffnet bei gesperrten Etappen das Hinweisfenster. Die Download-Pakete (`journeyFiles.ts`) laden gesperrte Etappen nicht (spart Platz und Traffic).
- **Hinweisfenster (`PremiumSheet.vue`):** Zwei Stufen: Das Kind sieht den freundlichen Hinweis und „Für Eltern“. Erst danach, nach dem Gate, kommt ein eigener Bildschirm im Eltern-Bereich mit Preisen, Leistungen, Probezeit-Text, Kaufknöpfen, **Wiederherstellen**, Links zu Bedingungen und Datenschutz. Dort liegen auch „Abo verwalten“ (Link auf die Abo-Seite des Stores) und ein Abschnitt „Kündigen“.
- **Wenn das Abo endet:** Bereits Gemaltes bleibt, bereits Gelesenes bleibt als Anfang sichtbar; es werden nur die Plus-Inhalte wieder gesperrt. Fortschritt (Sterne) bleibt.
- **Bestehende Nutzer nicht bestrafen (Idee, vor Umsetzung zu prüfen):** Apple stellt bei StoreKit 2 die Information über die erste installierte App-Version bereit (`AppTransaction`). Damit ließe sich „wer vor dem Plus-Start installiert hat, behält die heutigen Inhalte“ ohne Konto umsetzen. Das steht nicht in den für dieses Dokument gelesenen Quellen; vor dem Einplanen in der Apple-Dokumentation nachlesen. Für Android gibt es keinen gleichwertigen Weg ohne eigene Merkung beim ersten Start (die App könnte beim ersten Start nach dem Update lokal „Gründer-Gerät“ merken; eine Sitzung muss das beurteilen).

### 6.6 Stufenplan mit grober Aufwandsschätzung

(Arbeitstage einer Sitzung, eigene Schätzung ohne Gewähr; ohne Wartezeiten der Stores und ohne Antons Zeit.)

| Stufe | Was | Aufwand | Wer |
|---|---|---|---|
| **1. Teaser ohne Kauf** | Gratis-Grenzen je Abenteuer und Reihe, Sperrbilder, zweistufiges Hinweisfenster mit Eltern-Seite (ohne Kaufknopf, mit „Kommt bald“), Texte DE/EN, Tests | 2 bis 3 Tage | Sitzung |
| **2. Kauf in der Testphase** | Plugin auf Android einbinden, Produkte abfragen, Kaufen, Wiederherstellen, Besitz speichern, Gate vor Kauf, Eltern-Seite mit Preisen, Probezeit, Einzelkauf Malbuch, Sandbox-Anleitung, Tests | 8 bis 12 Tage | Sitzung (und Anton für Store-Produkte und Testkonten) |
| **2b. Server-Prüfung (optional)** | Belegprüfung, Benachrichtigungen, Datenschutztext | 4 bis 6 Tage | Sitzung |
| **3. Veröffentlichung** | Store-Texte (Abo-Beschreibung), Screenshots für die Prüfung, Datenschutzerklärung, Altersfreigabe, Prüfdurchläufe | 4 bis 6 Tage | Sitzung + Anton |

Zusammen etwa 14 bis 21 Arbeitstage bis zur Veröffentlichung (ohne 2b). Unsicherster Teil ist Android (neue Anbindung) und die Apple-Prüfung (Kinderkategorie).

---

## 7. Risiken und offene Entscheidungen (mit Empfehlung)

| # | Frage an Anton | Empfehlung |
|---|---|---|
| 1 | **Kinderkategorie bei Apple?** Mit Kinderkategorie: Eltern-Gate Pflicht (haben wir), keine Dritt-Werbung, kaum Dritt-Analyse, Band wählen (6 bis 8 oder 9 bis 11). Ohne: Altersfreigabe 4+ geht trotzdem, aber „für Kinder“ darf nicht in den Texten stehen (2.3.8) | **Ja**, weil die App von Anfang an gate-fähig und werbefrei ist und die Zielgruppe 4 bis 12 so ehrlich beschrieben wird. Band: 6 bis 8. |
| 2 | **Altersfreigabe:** heute 18+ (Notizen), Plan 4+ | 4+ vor dem Abo. Mit Abo und Link in den Store ist 4+ nach den bisherigen Notizen möglich (Eltern-Gate). |
| 3 | **Stories-Grenze:** A 15 % bei allem, B Reihen-Probe, C gratis | **B** (Abschnitt 3.2) |
| 4 | **Abenteuer:** A, B oder C | **B**, Josef komplett gratis |
| 5 | **Preis** | 3,99 €/Monat, 24,99 €/Jahr, Einzel-Malbuch 3,99 € |
| 6 | **Probezeit:** 7 Tage beim Jahres-Abo oder nur die Gratis-Teile als Probe | Beim Start **nur Gratis-Teile** (einfacher, weniger Druck), Probezeit später wenn nötig |
| 7 | **Bestehende Nutzer behalten, was sie haben?** | Ja, über „Plus beginnt mit neuen Inhalten“ und nur wo nötig die Gründer-Regel |
| 8 | **Kleinunternehmerprogramm bei Apple?** | Ja beantragen (15 % statt 30 % im ersten Jahr) |

**Risiken**

- **Wenig Zahlende, kleiner Ertrag:** Siehe Abschnitt 4.3. Plus trägt am Anfang keine Arbeitszeit. Gegenmittel: niedrige Kosten, kein Server in Stufe 1.
- **Ablehnung bei Apple:** Kinderkategorie, Abo-Angaben, fehlende Wiederherstellen-Funktion oder fehlende Links zu Bedingungen sind häufige Gründe (Apple-Texte, Quelle 1 und 4). Gegenmittel: die Checkliste in Abschnitt 5.1 vor der Einreichung abarbeiten.
- **Android-Anbindung:** Neue Berechtigung und neue Console-Angaben; Play-Prüfung der Familien-Richtlinie. Gegenmittel: eigener Test-Build, geschlossener Test.
- **Plugin-Risiko:** Kleines Drittprojekt. Gegenmittel: früh testen, Rückfall auf eigenes Plugin.
- **Wegnehmen von Gratis-Inhalt:** Schlechte Bewertungen. Gegenmittel: Plus beginnt mit neuem Inhalt (Abschnitt 3.10).
- **Drittanbieter-Daten:** vermieden durch den Verzicht auf RevenueCat.
- **Regeln ändern sich:** Google nennt kommende Gebührenänderungen (30.06. und 30.09.2026), Apple nennt keine Version. Vor der Einreichung alle Quellen aus Abschnitt 9 neu lesen.

---

## 8. Rechtliches und Organisatorisches

**Anton selbst (nur er darf Konten, Bank, Steuern und Zusagen):**

- Apple Developer Programm (läuft laut Notizen) und in App Store Connect: **Vereinbarung für bezahlte Apps** („Paid Applications“) mit Bank- und Steuerangaben, **Kleinunternehmerprogramm** beantragen, Abo-Gruppe und Produkte anlegen, Testkonten, Steuer-Kategorie.
- Google Play Console: Händler-/Zahlungsprofil mit Bank- und Steuerangaben, Abo-Produkte, Lizenztester.
- **Impressum, Datenschutz** auf `lambking.store`: Abschnitt 8 der Datenschutzerklärung aktualisieren (laut Notizen sind dort noch alte Aussagen).
- **Steuer und Verkäuferrolle:** Klären, wie die Einnahmen aus den Stores in Deutschland steuerlich behandelt werden (Steuerberatung; nicht von mir geprüft).
- **Widerruf, Kündigung, Preisangaben:** Welche deutschen und europäischen Pflichttexte zusätzlich nötig sind, fachlich klären lassen (nicht von mir geprüft).
- **Entscheidungen** aus Abschnitt 7.

**Was Sitzungen vorbereiten können:**

- Abo-Beschreibungstexte (Name, Dauer, Leistung, Preis, Verlängerung, Kündigungshinweis, Links) für beide Stores auf Deutsch und Englisch.
- Texte für die Eltern-Seite und die Hinweisfenster (kindgerecht und elterngerecht, getrennt).
- Entwurf der Datenschutzerklärung (App-Abschnitt) zur Prüfung durch Anton.
- Screenshots der Kaufbildschirme für die Apple-Prüfung (die Trinkgeld-Produkte zeigten, dass Apple einen Screenshot der Kauf-Oberfläche verlangt, bevor es Produkte freigibt: Kommentar in `useTips.ts`).
- Test-Anleitung (Sandbox, Lizenztester) in drei Schritten.
- Checkliste vor jeder Einreichung (Abschnitt 5).

---

## 9. Quellenverzeichnis (alle abgerufen am 21.10.2026)

1. Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (kein Datum auf der Seite; der letzte Teil wurde nicht gelesen)
2. Apple, Kinder-Apps (Kinderkategorie, Eltern-Gate, Altersbänder): https://developer.apple.com/app-store/kids-apps/
3. Apple, Kleinunternehmerprogramm: https://developer.apple.com/app-store/small-business-program/ (Unklarheit zum 10-%-Satz, siehe 5.1)
4. Apple, Abonnements (Pflichtangaben, Probezeit, Familienfreigabe, Server-Schnittstellen, 70/85 %): https://developer.apple.com/app-store/subscriptions/
5. Apple, Familienfreigabe für Abos (Suchergebnis, Hinweis „nicht rücknehmbar“ steht in Quelle 4; Detailseiten nicht gelesen): https://developer.apple.com/documentation/storekit/supporting-family-sharing-in-your-app
6. = Quelle 3 (Provision 15 %).
7. Google Play, Servicegebühren: https://support.google.com/googleplay/android-developer/answer/112622
8. Google Play, Families Policy: https://support.google.com/googleplay/android-developer/answer/9893335 (kein Datum)
9. Google Play, Payments Policy: https://support.google.com/googleplay/android-developer/answer/9858738 (kein Datum)
10. Google, Käufe sicher prüfen (Play Billing): https://developer.android.com/google/play/billing/security
11. Epic im US-App-Store: https://apps.apple.com/us/app/-/id719219382 ; Epic-Nutzungsbedingungen-Übersicht (9,99 US-$): https://terms.law/ToS-Watchdog/childrens-apps/epic/
12. ANTON im deutschen App Store: https://apps.apple.com/de/app/anton-lernen-schule/id1180554775 ; Preise nach App Pricing Lab (28.03.2026): https://apppricinglab.com/iap/apple/1180554775 ; Jahreszahlung laut Adapty: https://adapty.io/paywall-library/anton-preschool-grade-8/
13. Lingokids, Preise: https://help.lingokids.com/hc/en-us/articles/9522217000209-How-much-does-Plus-subscription-cost (403 beim Abruf; Zahlen aus dem Suchergebnis der Hilfeseite https://help.lingokids.com/hc/en-us/articles/115005120505-Lingokids-Plus-Pricing-Currency)
14. Hopster, Aggregator: https://agoodmovietowatch.com/platforms/hopster-tv/ ; Anbieter: https://www.hopster.tv/ (nur „7 day free trial“)
15. Noggin, Hinweis auf Einstellung: https://noggin.com/?p=103070
16. Khan Academy Kids, App-Store-Eintrag: https://apps.apple.com/us/app/khan-academy-kids/id1378467217
17. Bible App for Kids: https://faith.tools/app/bible-app-for-kids ; https://apps.apple.com/app/id668692393
18. Superbook Kids Bible: https://apps.apple.com/US/app/id606378030 ; Superbook Academy: https://superbookacademy.com/?p=30272
19. Sinti-Kinderbibel: https://apps.apple.com/app/id1492065770 ; Kalderasch Kinderbibel: https://apps.apple.com/app/id1483768488
20. RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps (Zahlen für Kinder-Apps nicht gefunden)
21. Google, Eltern-Freigaben für Käufe (Family Link): https://support.google.com/googleplay/answer/7039872
22. FTC, COPPA: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
23. COPPA-Änderung, Federal Register 22.04.2025: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule (nur nach Suchergebnis zusammengefasst)
24. DSGVO Artikel 8: https://gdpr-info.eu/art-8-gdpr/
25. RevenueCat, Preise: https://www.revenuecat.com/pricing/
26. RevenueCat-Forum, Kinderkategorie (2021): https://community.revenuecat.com/sdks-51/we-rejected-depends-on-adsupport-guideline-1-3-safety-kids-category-729
27. Projektstand: `src/use/usePremium.ts`, `src/use/useBookAccess.ts`, `src/components/molecules/PremiumSheet.vue`, `src/use/useParentalGate.ts`, `src/use/useTips.ts`, `src-tauri/Cargo.toml`, `src-tauri/plugins/tauri-plugin-purchase-check`, `node_modules/@choochmeque/tauri-plugin-iap-api/README.md`, `src/data/adventures/index.ts`; Live-Backend-Liste vom 21.10.2026 (öffentliche Schnittstelle).
