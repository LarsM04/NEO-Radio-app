# NEO Radio app

Een app voor **NEO Radio**, de lokale internetradio uit Noorden. Met de app kun je
live luisteren, live kijken, de voetbaluitslagen volgen en het laatste nieuws lezen.
Alles wat op de website staat, komt ook in de app.

Dit is een schoolproject van de opleiding **Software Development**, in opdracht van NEO Radio.

## Over NEO Radio

NEO Radio is een lokale internetradio met verschillende programma's, zoals:

- **Aanvallen en Verdedigen**: live sportverslag op zaterdag en zondag
- **Nathans Nummers**
- **Kale Kenner**
- **Politiek**
- en nog veel meer

Naast de website [neoradio.nl](https://www.neoradio.nl) wil NEO Radio nu ook een eigen app.

## Wat gaat de app doen?

| Onderdeel          | Wat kun je ermee                                                  |
| ------------------ | ----------------------------------------------------------------- |
| **Home**           | Overzicht van wat er nu speelt en het laatste nieuws              |
| **Live score**     | Live voetbaluitslagen die automatisch bijwerken                   |
| **Nieuws**         | Nieuwsartikelen en voetbalverslagen lezen                         |
| **Live luisteren** | De live audiostream van NEO Radio                                 |
| **Live kijken**    | De live videostream van NEO Radio                                 |
| **Info**           | Informatie over NEO Radio, de programma's en contactgegevens      |

## Eisen van de opdrachtgever

- De app werkt op **iPhone, iPad en Android**.
- NEO Radio kan de content **zelf aanpassen** via een eenvoudig **admin-systeem**.
- **Live scores en nieuws werken automatisch bij** zodra NEO Radio de website bijwerkt.
- De app gebruikt de **vormgeving en huisstijl van NEO Radio**.

Binnen NEO Radio is al een prototype gemaakt, deels met AI, als voorbeeld van hoe de
app eruit kan zien. Dat gebruiken we als startpunt.

## Status

🟡 **Ontwerp.** Het onderzoek is afgerond en het eerste ontwerpdocument staat klaar.

| Fase                          | Status | Document                                                                                  |
| ----------------------------- | :----: | ----------------------------------------------------------------------------------------- |
| Debriefing met de klant       | ✅     | [Debriefing](01-documenten/opdracht/debriefing-neo-radio-app.pdf)                         |
| Plan van aanpak               | ✅     | [Plan van aanpak](01-documenten/plan-van-aanpak/plan-van-aanpak-neo-radio.odt)            |
| Huisstijl-onderzoek           | ✅     | [Huisstijl-onderzoek](03-onderzoek/huisstijl/huisstijl-onderzoek.md)                      |
| Onderzoek techniek en hosting | ✅     | [Techniek en hosting](03-onderzoek/techniek-en-hosting/onderzoek-techniek-en-hosting.pdf) |
| Ontwerp van de app            | 🟡     | [Ontwerpdocument](04-ontwerp/designs/ontwerpdocument-neo-radio-app.pdf)                   |
| Bouwen van de app             | ⬜     | [`05-app`](05-app/)                                                                       |

**Gekozen techniek** (uit het onderzoek techniek en hosting):

- De app bouwen we met **React Native + Expo** (één codebase voor iPhone, iPad en Android).
- De content komt uit de bestaande **WordPress**-website via de WordPress REST API.
- Voor de live scores maken we een **eigen WordPress-plugin**, zodat NEO Radio alles in één
  admin-systeem beheert. Er is geen extra server of hosting nodig.

## Team

| Naam          | Rol |
| ------------- | --- |
| _Lars_        |     |
| _Sultan_        |     |
| _Duzyano_        |     |

## Opdrachtgever

**NEO Radio**, Noorden
Website: [neoradio.nl](https://www.neoradio.nl)

## Waar vind je wat?

| Map                                                   | Inhoud                                           |
| ----------------------------------------------------- | ------------------------------------------------ |
| [`01-documenten`](01-documenten/)                     | Debriefing, plan van aanpak, notulen, feedback   |
| [`02-trello`](02-trello/)                             | Link naar ons Trello-bord en de voortgang        |
| [`03-onderzoek`](03-onderzoek/)                       | Huisstijl-onderzoek en onderzoek techniek/hosting |
| [`04-ontwerp`](04-ontwerp/)                           | Ontwerpdocument, schetsen, wireframes, prototype |
| [`05-app`](05-app/)                                   | De code van de app                               |

Hoe we bestanden toevoegen, staat in [WERKAFSPRAKEN.md](WERKAFSPRAKEN.md).
