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

Notes (English, pasted into „Notizen“):

> LambKing Stories is a free Bible story app. No account or login is needed; all stories are loaded from our own server and cached on the device. There are no ads and no third-party SDKs, and every story is free — nothing in the app is behind a paywall.
>
> In-app purchases: the app offers five consumables, "Support us" at 3, 10, 20, 50 and 100 €. They are voluntary tips for the developer, exactly as Guideline 3.1.1 permits. They unlock no content and change nothing in the app — the only feedback is a thank-you message. This is a tip, not a charitable donation, and the app says so in the sheet itself. To see it, open the home screen, swipe the welcome banner to the second slide ("Support our mission") and tap "Support us"; the five amounts appear in a sheet. The iOS build contains no links to PayPal, Ko-fi or any other payment outside in-app purchase.
>
> Privacy: the privacy policy is in the app under "My Area" → "Privacy & Legal notice" (bottom of the page). The app collects no data at all. It mints no identifier, stores none and sends none; our server only increments a per-day counter of how often a book detail page was opened, which is a date and a number for all users together.
>
> The app supports iPhone and iPad in portrait and landscape.

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
territories and a price schedule based on Germany. State: *Missing Metadata*
until the review screenshot is attached.

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

**Blocker:** the product cannot be sold until the **Paid Apps agreement** is
accepted in App Store Connect → Business, with bank and tax details filled in.
Until then StoreKit returns no products and the button hides itself — the app still
builds, ships and passes review-readiness without it, so this does not block a
TestFlight build.
