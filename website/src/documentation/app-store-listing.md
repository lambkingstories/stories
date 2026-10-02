# App Store listing — LambKing Stories (iOS)

Draft of 2026-09-19 for App Store Connect → App „LambKing Stories“ (Apple-ID `6813696761`,
bundle ID `com.stories.lambking`, SKU `lamb-king-stories`). Primary language: German.
Everything marked ✏️ is still Anton's decision.

## Fields that are the same in every language

| Field | Value                                                                                    |
|---|------------------------------------------------------------------------------------------|
| Category | primary **Books** · secondary **Education**. **Not** the Kids category — see the note below |
| Age rating | questionnaire answered truthfully (no mature content → 4+), then **Age Rating Override → 18+** |
| Copyright | `2026 Anton Bernt`                                                                       |
| Support URL | `https://lambking.store`                                                                 |
| Marketing URL | `https://lambking.store`                                                                 |
| Privacy policy URL | `https://lambking.store/datenschutz` — Anton fügt dort zuerst den App-Abschnitt ein (Text: `handover-datenschutz-app-abschnitt.md`, gitignored). Bis er online ist, ersatzweise `https://lambkingstories.github.io/stories/lamb-king/?privacy-policy=de` |
| Price | free, **five in-app purchases**: „Unterstützen" / "Support us" at 3, 10, 20, 50 and 100 € (consumables) |
| Devices | iPhone and iPad                                                                          |
| Screenshots | 6.9" iPhone 1320×2868 and 13" iPad 2064×2752, five each per language                     |

### Why 18+, and what it costs

The Kids category bans in-app purchases that aren't clearly for parents, requires a
parental gate on every outgoing link, and forbids donation CTAs. Leaving it is what
makes the tip purchase possible.

The rating is set the honest way: **answer the content questionnaire truthfully**
(this app has no mature content, so the questionnaire yields 4+) and then raise the
result with the **Age Rating Override** field to 18+. Never answer the questionnaire
with content the app does not contain — that is a false declaration and a 2.3.6
rejection.

Be aware of what 18+ costs, because it is not free:
- The App Store hides the app from accounts with Screen Time / Ask to Buy age limits
  below 18 — i.e. from a large part of the actual audience. Parents of young children
  will not find it under a child account.
- The listing may not use „für Kinder" / "for kids" phrasing in a way that contradicts
  the rating (2.3.8). The copy below keeps „für Kinder" as a description of the
  *stories*, and the store's own age gate does the rest.

If the goal is reach rather than the tip button, the alternative is: stay 4+ outside
the Kids category (IAP is still allowed there, only the Kids-category rules are
stricter) — that keeps both the tip and the young audience. Worth revisiting with
Anton before submission.

## Deutsch (primary)

**Name** (max. 30): LambKing Stories

**Untertitel** (max. 30): Bibelgeschichten für Kinder

**Werbetext** (max. 170):
Geschichten rund um die Bibel – zum Lesen, Anhören und Ausmalen. Ohne Werbung, ohne Konto. Alle Geschichten sind kostenlos.

**Stichwörter** (max. 100): Bibel,Kinderbibel,Bibelgeschichten,Gutenachtgeschichten,Hörbuch,Ausmalen,christlich,Glaube

**Beschreibung:**

LambKing Stories bringt biblische Geschichten liebevoll illustriert zu Kindern – zum Vorlesen, Selberlesen, Anhören und Ausmalen.

GESCHICHTEN ENTDECKEN
• Über 50 illustrierte Bücher in Reihen wie „Die Tiere von Talheim“, „Frucht-Agenten“, „Gute Nacht, Lilly“, „Levi in der Welt der Bibel“ und „Lina und Ben“
• Kategorien wie Gute-Nacht-Geschichten, Abenteuer und Forscher
• Die Bibliothek wächst weiter

LESEN UND ANHÖREN
• Ein ruhiger Buchleser für iPhone und iPad
• Hörbücher mit Mitlese-Funktion: der gesprochene Text wird im Buch mitmarkiert
• Lesefortschritt, Merkliste und Auszeichnungen für gelesene Geschichten

AUSMALEN
• Ausmalbilder zu den Geschichten – mit Filzstift, Pinsel, Wachsmalstift, Bleistift und Farbeimer
• Fertige Bilder speichern und teilen

FÜR ELTERN
• Keine Werbung, kein Konto, keine Bezahlschranke – alle Geschichten sind kostenlos
• Wer mag, kann uns mit einem einmaligen Trinkgeld unterstützen; nichts in der App wird dadurch freigeschaltet
• Auf Deutsch und Englisch

## English (U.S.)

**Name**: LambKing Stories

**Subtitle** (max. 30): Bible stories for children

**Promotional text** (max. 170):
Stories from the Bible – to read, listen to and color. No ads, no account. Every story is free.

**Keywords** (max. 100): bible,kids bible,bible stories,bedtime stories,audiobook,coloring,christian,faith

**Description:**

LambKing Stories brings lovingly illustrated Bible stories to children – to read aloud, read alone, listen to and color.

DISCOVER STORIES
• More than 50 illustrated books in series such as “The Animals of Talheim”, “Fruit Agents”, “Good Night, Lilly”, “Levi in the World of the Bible” and “Lina and Ben”
• Categories such as bedtime stories, adventure and explorers
• The library keeps growing

READ AND LISTEN
• A calm book reader for iPhone and iPad
• Audiobooks with read-along: the spoken words are highlighted in the book
• Reading progress, a watch list and awards for finished stories

COLOR
• Coloring pages for the stories – with marker, brush, crayon, pencil and paint bucket
• Save and share finished pictures

FOR PARENTS
• No ads, no account, no paywall – every story is free
• If you like it, you can leave us a one-off tip; it unlocks nothing in the app
• In German and English

## App Review information

Sign-in required: **no**. Contact: Anton Bernt, hello@lambking.store, +49 176 24693524.

Notes (English, in „Notizen“ since 2026-10-02 — set over the App Store Connect API, 3373 of 4,000 characters).
They carry the answers Apple asked for under Guideline 2.1, so future submissions have them on file:

```text
LambKing Stories (version 1.0) - information requested under Guideline 2.1.

1. SCREEN RECORDING
https://youtu.be/kNHE3gFljwg - captured on a physical iPhone Air running the latest iOS, with the submitted build installed from TestFlight. It starts with launching the app and shows: the welcome screen, browsing the library, opening a book and reading, listening to an audiobook, a coloring page, "My Area" (name, avatar, language), the in-app privacy policy, and a complete in-app purchase (tip).

The app has no account registration, no login and therefore no account deletion. It has no user-generated content: the name, avatar, watch list, reading progress and colored pictures stay on the device and are never uploaded or shown to other users. A colored picture can only leave the app through the standard iOS share sheet, on the user's own action.

2. PURPOSE AND AUDIENCE
LambKing Stories is a free library of illustrated Bible stories for children, to read aloud, read alone, listen to and color. It is aimed at parents and families who want calm, trustworthy, ad-free story content for their children, in German and English. All stories are free; nothing is behind a paywall.

3. SETUP AND ACCESS
No setup, credentials or sample files are needed. Launch the app, tap the button on the welcome screen, and the full library is available. An internet connection is needed on first launch to load the stories; they are then cached on the device. The app supports iPhone and iPad in portrait and landscape.

4. EXTERNAL SERVICES
- Our own backend server, which delivers the story texts, images and audio.
- Apple StoreKit (In-App Purchase) for the voluntary tips.
There are no ads, no analytics or tracking SDKs, no authentication service, no third-party payment processor and no AI services.

5. REGIONAL DIFFERENCES
The app functions identically in all regions. The only variation is the interface and story language (German or English), which the user can switch in "My Area".

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
The app does not operate in a regulated industry. All story texts, illustrations and audio recordings are original works, and all rights to them are owned by the developer, Anton Bernt. The app contains no protected third-party material.

7. IN-APP PURCHASES
The app offers five consumable In-App Purchases, "Support us" at 3, 10, 20, 50 and 100 EUR (com.stories.lambking.support.3 / .10 / .20 / .50 / .100). They are voluntary tips to the developer as permitted by Guideline 3.1.1. They unlock no content and change nothing in the app; the only result is a thank-you message. They are tips, not charitable donations, and the purchase sheet says so.

To reach the purchase flow: open the app, continue from the welcome screen to the home screen, swipe the banner at the top to the second slide ("Support our mission"), and tap "Support us" below the text. A sheet opens with the five amounts; tapping one starts the purchase. The iOS app contains no links to PayPal, Ko-fi or any other payment method outside In-App Purchase.

PRIVACY
The privacy policy is in the app under "My Area" > "Privacy & Legal notice" (bottom of the page). The app collects no data. It mints no identifier, stores none and sends none; our server only increments a per-day counter of how often a book detail page was opened - a date and a number for all users together.
```

## Reply to the 2.1 "Information Needed" rejection

The first submission came back on 2026-10-02 with *Guideline 2.1 – Information
Needed – New App Submission* (developer account with limited review history).
Apple wants a screen recording from a physical device plus answers to six
questions, both as a reply in App Store Connect and in the „Notizen“ field.

The text below is that reply, sent on 2026-10-02. For a future reply of this kind:

- Fill in the video line in section 1 (attachment or a link that opens without a login).
- Section 1 lists the screens the recording shows — drop any that were not recorded.
- „Notizen“ holds 4,000 characters, so the notes above are a trimmed version of this
  text (no greeting, privacy paragraph kept) rather than both together.

```text
Hello,

Thank you for the review. Here is the requested information for LambKing Stories (version 1.0).

1. SCREEN RECORDING
A screen recording is available on Youtube https://youtu.be/kNHE3gFljwg?si=uKhRmO0E6AeOKaV2. It was captured on a physical iPhone Air running the latest iOS, with the submitted build installed from TestFlight. It starts with launching the app and shows: 
the welcome screen, browsing the library, opening a book and reading, an audiobook listening, a coloring page, "My Area" (name, avatar, language), the in-app privacy policy, and a complete in-app purchase for tips 3...100€ .

The app has no account registration, no login and therefore no account deletion. It has no user-generated content: the name, avatar, watch list, reading progress and colored pictures stay on the device and are never uploaded or shown to other users. A colored picture can only leave the app through the standard iOS share sheet, on the user's own action.

2. PURPOSE AND AUDIENCE
LambKing Stories is a free library of illustrated Bible stories for children, to read aloud, read alone, listen to and color. It is aimed at parents and families who want calm, trustworthy, ad-free story content for their children, in German and English. All stories are free; nothing is behind a paywall.

3. SETUP AND ACCESS
No setup, credentials or sample files are needed. Launch the app, tap the button on the welcome screen, and the full library is available. An internet connection is needed on first launch to load the stories; they are then cached on the device.

4. EXTERNAL SERVICES
- Our own backend server, which delivers the story texts, images and audio.
- Apple StoreKit (In-App Purchase) for the voluntary tips.
There are no ads, no analytics or tracking SDKs, no authentication service, no third-party payment processor and no AI services.

5. REGIONAL DIFFERENCES
The app functions identically in all regions. The only variation is the interface and story language (German or English), which the user can switch in "My Area".

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
The app does not operate in a regulated industry. All story texts, illustrations and audio recordings are original works, and all rights to them are owned by the developer, Anton Bernt. The app contains no protected third-party material.

7. IN-APP PURCHASES
The app offers five consumable In-App Purchases, "Support us" at 3, 10, 20, 50 and 100 EUR (com.stories.lambking.support.3 / .10 / .20 / .50 / .100). They are voluntary tips to the developer as permitted by Guideline 3.1.1. They unlock no content and change nothing in the app; the only result is a thank-you message. They are tips, not charitable donations, and the purchase sheet says so.

To reach the purchase flow: open the app, continue from the welcome screen to the home screen, swipe the banner at the top to the second slide ("Support our mission"), and tap "Support us" below the text. A sheet opens with the five amounts; tapping one starts the purchase. The iOS app contains no links to PayPal, Ko-fi or any other payment method outside In-App Purchase.

Contact: Anton Bernt, hello@lambking.store

Kind regards
```

## App privacy („App-Datenschutz“) answers

- Data collected: **no** — answer "Nein, wir erfassen keine Daten von dieser App".
- The app mints no identifier, stores none on the device and sends none. The only thing the server records is a per-day counter of how often a book detail page was opened: one document holding a date and a number, for all users together. Nothing in it refers to a device or a person, so it is not "data collected from this app" in Apple's sense.
- Nothing else is collected either: no contact info, location, contacts, user content, health, purchases or diagnostics leave the device. Name, avatar, watch list and reading progress stay on the device.
- The tip purchase does not change this. StoreKit handles it end to end; the app never sends the transaction, the receipt or anything derived from it to our server, so "Purchases" stays unchecked.

> This replaced an earlier answer of *Device ID + Product Interaction, both Analytics*. That was accurate for the previous build, which sent a random per-install id on every request. Both the id and the per-install rows are gone — if a future build reintroduces any identifier, this section and the privacy policy have to change back together.

## In-app purchase — „Unterstützen" / "Support us"

Five consumables, one per amount. All share the same type, wording pattern and
review screenshot; only the amount differs.

All five exist in App Store Connect, each with both localizations, all 175
territories, a price schedule based on Germany and the review screenshot
(uploaded 2026-09-24 over the API: the amount sheet at 1320×2868). State:
*Ready to Submit*.

| Product ID | Apple ID | Price | Display name (de / en) |
|---|---|---|---|
| `com.stories.lambking.support.3` | 6815237420 | 3,00 € | Unterstützen · 3 € / Support us · €3 |
| `com.stories.lambking.support.10` | 6815237433 | 10,00 € | Unterstützen · 10 € / Support us · €10 |
| `com.stories.lambking.support.20` | 6815237469 | 20,00 € | Unterstützen · 20 € / Support us · €20 |
| `com.stories.lambking.support.50` | 6815237633 | 50,00 € | Unterstützen · 50 € / Support us · €50 |
| `com.stories.lambking.support.100` | 6815237534 | 100,00 € | Unterstützen · 100 € / Support us · €100 |

Round euro amounts are not in Apple's default price list (which is all x,99) —
they live behind *Weitere Preise anzeigen* in the picker, or come for free when
the products are configured through the App Store Connect API.

| Field | Value |
|---|---|
| Type | **Consumable** (can be given more than once) |
| Reference name | LambKing Stories Support <amount> |
| Description (de) | Ein freiwilliges Trinkgeld für die Entwicklung neuer Geschichten. Schaltet nichts frei. |
| Description (en) | A voluntary tip towards new stories. Unlocks nothing. |
| Base region | Deutschland (EUR) — Apple derives every other currency |
| Review screenshot | home screen, welcome banner on slide 2 („Unterstütze unsere Mission"), amount sheet open |

Guideline 3.1.1 allows tips explicitly ("Apps may enable customers to tip the
developer"). Everything user-facing therefore says *Trinkgeld* / *tip* and never
*Spende* / *donation*: a donation to a registered nonprofit may **not** go through
in-app purchase (3.2.1(vi)), so a donation label on these products invites a
rejection. The sheet spells this out in its footnote.

`com.stories.lambking.tip` (2,99 €) was an earlier single-amount product,
superseded by the five above and deleted on 2026-09-23. It had never been
submitted or sold, so nothing depended on it.

**Blocker:** the product cannot be sold — not even in TestFlight or the sandbox —
until the **Paid Apps agreement** is active in App Store Connect → Business, with
bank and tax details filled in. Until then StoreKit returns no products: the sheet
still opens with the plain euro amounts, and tapping one says the App Store is not
offering tips right now. The sheet asks StoreKit again every time it opens, so the
prices appear without reinstalling once the agreement is active. The first
purchase also has to go to review together with an app version (*Add for Review*
on the product, then add it to the version's submission).
