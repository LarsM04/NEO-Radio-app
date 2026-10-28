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
    │   └── live/
    │       ├── luisteren.js
    │       └── kijken.js
    ├── api/wordpress.js    Alle verzoeken naar de WordPress-website
    ├── components/         Herbruikbare onderdelen (knoppen, kaarten, ...)
    └── constants/          Kleuren van de huisstijl
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
