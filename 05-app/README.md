# 05 – App

De code van de NEO Radio app, gebouwd met **React Native + Expo** (JavaScript) en
**Expo Router**. Hoe de app technisch in elkaar zit, staat in het
[technisch ontwerp](../04-ontwerp/technisch-ontwerp/technisch-ontwerp-neo-radio-app.pdf).

## Wat heb je nodig?

- [Node.js](https://nodejs.org) (LTS-versie)
- De app **Expo Go** op je telefoon (App Store of Google Play)
- Visual Studio Code

## App starten

```bash
cd 05-app
npm install        # alleen de eerste keer, of als package.json is veranderd
npx expo start
```

Scan de QR-code met Expo Go (Android) of met de camera (iPhone). Je telefoon en laptop
moeten op hetzelfde wifi-netwerk zitten. Lukt dat niet (bijv. op het schoolnetwerk), gebruik
dan `npx expo start --tunnel`.

Een package toevoegen doe je altijd met `npx expo install <naam>` (niet met `npm install`),
zodat je een versie krijgt die bij onze Expo-versie past.

## Mappen

```
05-app/
├── assets/                 Iconen en afbeeldingen
└── src/
    ├── app/                Schermen. Elk bestand is een scherm (Expo Router)
    │   ├── _layout.js      Hoofdlayout
    │   ├── (tabs)/         De tabbalk onderin
    │   │   ├── _layout.js  Instellingen van de tabbalk
    │   │   ├── index.js    Home
    │   │   ├── livescore.js
    │   │   ├── nieuws.js
    │   │   ├── live.js     Keuze tussen luisteren en kijken
    │   │   └── info.js
    │   ├── nieuws/[id].js  Eén nieuwsbericht
    │   ├── beheer/         Live score invoeren, alleen voor medewerkers
    │   │   ├── index.js    Inloggen en Mijn wedstrijden
    │   │   └── [id].js     Wedstrijd bijhouden
    │   └── live/
    │       ├── luisteren.js
    │       └── kijken.js
    ├── api/wordpress.js    Alle verzoeken naar de WordPress-website
    ├── api/beheer.js       Inloggen en scores invoeren (beheer)
    ├── components/         Herbruikbare onderdelen (knoppen, kaarten, ...)
    │   └── beheer/         Onderdelen van de beheerschermen
    ├── constants/          Kleuren van de huisstijl
    └── data/               Voorbeeldantwoorden van de live-score-plugin (zie 06-plugin)
```

Alleen schermen horen in `src/app/`. Componenten, hulpfuncties en dergelijke zet je in de
andere mappen.

`nieuws.js` haalt al echte berichten op van neoradio.nl. Gebruik dat als voorbeeld voor
hoe je data ophaalt. De overige schermen zijn nog placeholders.

## Wie werkt waaraan?

| Onderdeel                                  | Bestanden                                             | Wie |
| ------------------------------------------ | ----------------------------------------------------- | --- |
| Home, Nieuws, Nieuwsbericht, Info          | `(tabs)/index.js`, `(tabs)/nieuws.js`, `nieuws/[id].js`, `(tabs)/info.js` |     |
| Live score (scherm + WordPress-plugin)     | `(tabs)/livescore.js`                                 |     |
| Live luisteren en live kijken              | `(tabs)/live.js`, `live/luisteren.js`, `live/kijken.js` |     |

Gedeelde bestanden (`_layout.js`, `api/wordpress.js`, `constants/`) pas je alleen aan na
overleg, en dan in een kleine aparte commit. Zo voorkom je merge-conflicten.

## Beheer: live score invoeren

Medewerkers van NEO Radio houden de stand bij in de app zelf, in een apart deel dat alleen
na inloggen werkt (ontwerpdocument, Beheer · 13 en 14). Je komt er via de link onderaan het
scherm **Info**, of direct via `/beheer` in de webversie. Inloggen gaat met een
WordPress-account met de rol *Live-score medewerker* (of beheerder/redacteur).

De live-score-plugin draait nu alleen op onze lokale testsite. Zo test je het met Expo Go:

1. Start de site **neoradio** in Local.
2. Start in een tweede terminal het doorgeefluik, zodat je telefoon de lokale site bereikt:
   `node 06-plugin/ontwikkelen/doorgeefluik.js` (vanuit de map van de repository).
3. Start de app zoals altijd met `npx expo start` en open hem in Expo Go.
4. Ga naar **Info → Medewerker? Live score invoeren** en log in. Testaccounts maak je met
   `wp neo-livescore testdata --leeg --live` (zie [06-plugin](../06-plugin/README.md)).

De app vindt het doorgeefluik vanzelf: hij gebruikt hetzelfde adres als waar Expo Go de app
vandaan haalt, met poort 8787. Een ander adres kun je zetten in `05-app/.env`:

```
EXPO_PUBLIC_LIVESCORE_URL=http://192.168.1.20:8787/wp-json
```

**Telefoon en laptop moeten op hetzelfde netwerk zitten, en je start de app zónder `--tunnel`.**
Met `--tunnel` kan de telefoon de testsite op je laptop niet bereiken. Op school (eduroam) kunnen
apparaten elkaar meestal niet zien. Zet daar een **hotspot** aan op je telefoon, verbind je laptop
met die hotspot en start de app met `npx expo start`.

