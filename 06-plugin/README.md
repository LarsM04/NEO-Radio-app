# 06 – Plugin

**NEO Live Score** is onze eigen WordPress-plugin voor de live scores. Hij vervangt Soccer Live
Scores. NEO Radio voert de scores in WordPress in, en de app leest ze via de REST API. Hoe
het in elkaar zit, staat in het
[technisch ontwerp](../04-ontwerp/technisch-ontwerp/technisch-ontwerp-neo-radio-app.pdf).

## Wat is er al?

| Onderdeel | Status |
| --- | --- |
| Tabellen uit het datamodel (seizoen, klasse, club, klasse_club, wedstrijd, gebeurtenis) | ✅ |
| Rechten: `neo_livescore_beheren`, `neo_livescore_invoeren` en de rol "Live-score medewerker" | ✅ |
| Endpoints om te lezen: `/klassen`, `/livescore`, `/uitslagen` | ✅ |
| Logica voor doelpunten, kaarten en status (stand en ruststand gaan vanzelf) | ✅ |
| Testdata met WP-CLI | ✅ |
| Beheerschermen: wedstrijden per dag, speelronde aanmaken, clubs, seizoenen en klassen | ✅ |
| Inloggen vanuit de app en endpoints om te schrijven (voor het beheer in de app) | ✅ |
| Doorgeefluik om de lokale site vanaf je telefoon te bereiken | ✅ |
| Shortcode voor de website | ✅ |
| Clubs en logo's overzetten uit Soccer Live Scores | ✅ |

## Mappen

```
06-plugin/neo-live-score/
├── neo-live-score.php      Hoofdbestand: laadt de rest en registreert de activatie
└── includes/
    ├── database.php        Tabellen (dbDelta) en rechten
    ├── wedstrijden.php     Ophalen en aanpassen van wedstrijden, doelpunten en kaarten
    ├── rest-api.php        De endpoints die de app gebruikt om te lezen
    ├── rest-beheer.php     Inloggen en scores invoeren vanuit de app
    ├── soccer-live-scores.php  Clubs en logo's overzetten uit Soccer Live Scores
    ├── shortcode.php       Shortcode [neo_livescore] voor de website
    ├── testdata.php        WP-CLI-commando met de voorbeelden uit het ontwerpdocument
    └── admin/              De schermen onder "Live score" in het WordPress-beheer
        ├── algemeen.php    Menu en hulpfuncties
        ├── wedstrijden.php Wedstrijden van één speeldag
        ├── speelronde.php  Speelronde aanmaken
        ├── clubs.php       Clubs met logo
        └── seizoenen.php   Seizoenen en klassen
06-plugin/ontwikkelen/
└── doorgeefluik.js         Maakt de lokale site bereikbaar voor de app op je telefoon
06-plugin/neo-live-score/assets/
├── admin.css               Opmaak van de beheerschermen
├── admin.js                Logo kiezen en de rijen bij Speelronde aanmaken
├── livescore.css           Opmaak van de shortcode op de website
└── livescore.js            Ververst de shortcode tijdens wedstrijden
```

## In WordPress

Na het activeren staat links in het beheer het menu **Live score**:

| Scherm | Wat je er doet |
| --- | --- |
| Wedstrijden | Alle wedstrijden van één speeldag, met stand, status en doelpunten. Aftrap aanpassen of een wedstrijd verwijderen |
| Speelronde aanmaken | Kies klasse, datum en standaard aftrap, en daarna per wedstrijd de thuis- en uitclub. Rechts staan de clubs die nog geen wedstrijd hebben |
| Clubs | Een club met logo één keer invoeren, aangeven in welke klasse hij speelt, en op niet-actief zetten. Staan er in Soccer Live Scores nog clubs of logo's die hier ontbreken, dan staat bovenaan de knop **Clubs overzetten** |
| Seizoenen en klassen | Seizoenen aanmaken, het huidige seizoen kiezen, en klassen toevoegen en op volgorde zetten |

Alleen gebruikers met het recht `neo_livescore_beheren` (beheerders) zien dit menu.

### Overzetten uit Soccer Live Scores

Soccer Live Scores bewaart alleen wedstrijden met twee teamnamen en logo's, zonder datum of
klasse. Daarom zetten we alleen de clubs en logo's over. De namen worden daarbij opgeschoond:
`Zwammerdam – TAVV` wordt twee clubs, `Nieuwkoop (15.00 uur)` wordt `Nieuwkoop`, en `NSV’46`
wordt `NSV'46`. Bestaande clubs en logo's blijven zoals ze zijn; alleen een leeg logo wordt
aangevuld. Je kunt het dus vaker doen zonder dat er iets dubbel komt. Daarna vink je bij elke
club nog aan in welke klasse hij speelt.

## Op de website

Zet op een pagina een blok *Shortcode* met:

| Shortcode | Toont |
| --- | --- |
| `[neo_livescore]` | De huidige speelronde van alle klassen, met een kopje en de datum per klasse |
| `[neo_livescore klasse="2"]` | Alleen één klasse. De juiste shortcode staat bij *Seizoenen en klassen* onder de naam van de klasse |

Dit vervangt de losse `[soccer-live-scores id="…"]` per wedstrijd en de kopjes per klasse die
nu met de hand op de pagina's *Home*, *Live Score* en *Live score – Alle wedstrijden* staan.
Na een nieuwe speelronde hoef je de pagina's dus niet meer aan te passen.

Zolang er een wedstrijd bezig is of vandaag nog begint, ververst het blok zichzelf elke
10 seconden (alleen als het tabblad open staat). Daarvoor gebruikt het
`/wp-json/neo/v1/livescore/html`, dat dezelfde gegevens geeft als `/livescore`, maar als HTML.

## Installeren op je lokale site (LocalWP)

Je hoeft de plugin niet te kopiëren. Met een *junction* leest WordPress hem direct uit de
repository, dus elke wijziging zie je meteen. Pas de paden aan naar je eigen computer en voer
dit uit in PowerShell:

```powershell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\Local Sites\neoradio\app\public\wp-content\plugins\neo-live-score" `
  -Target "C:\pad\naar\NEO-Radio-app\06-plugin\neo-live-score"
```

Activeer daarna **NEO Live Score** bij *Plugins* in WordPress. De tabellen worden dan
vanzelf aangemaakt.

## Testdata

Open in Local de site met rechtermuisknop → **Open site shell** en voer uit:

```bash
wp neo-livescore testdata --leeg          # speelrondes van 3 en 10 oktober uit het ontwerp
wp neo-livescore testdata --leeg --live   # plus een ronde van vandaag: bezig, rust en gepland
```

`--leeg` maakt eerst alle tabellen van de plugin leeg. Met `--live` kun je het automatisch
verversen in de app testen.

Het commando maakt ook twee testaccounts met de rol *Live-score medewerker*: `test-medewerker`
en `test-theo` (Theo houdt in de `--live`-ronde de wedstrijd in de rust bij). Het wachtwoord
staat bovenaan [`includes/testdata.php`](neo-live-score/includes/testdata.php). Deze accounts zijn
alleen voor de lokale testsite.

## De app op je telefoon laten praten met je lokale site

LocalWP is alleen op je eigen laptop bereikbaar. Het doorgeefluik maakt de live-score-API
(en alleen die) bereikbaar op je wifi-netwerk:

```bash
node 06-plugin/ontwikkelen/doorgeefluik.js
```

Het laat zien op welk adres het bereikbaar is. De app vindt het vanzelf; zie
[05-app/README.md](../05-app/README.md#beheer-live-score-invoeren). Vraagt Windows of Node.js
het netwerk op mag, klik dan op *Toestaan*.

## Endpoints

Iedereen mag ze lezen; ze kunnen niets aanpassen. Ze sturen `Cache-Control: no-store` mee,
zodat de app nooit een oude stand krijgt.

| Endpoint | Geeft terug |
| --- | --- |
| `GET /wp-json/neo/v1/klassen` | De klassen van het huidige seizoen, in de volgorde uit het beheer |
| `GET /wp-json/neo/v1/livescore` | Per klasse de huidige speelronde: de laatste speeldag tot en met vandaag |
| `GET /wp-json/neo/v1/livescore/html?klasse=` | Hetzelfde als HTML, voor de shortcode. `klasse` mag weg (alle klassen) |
| `GET /wp-json/neo/v1/uitslagen?klasse={id}` | Alle afgelopen wedstrijden van één klasse, per speeldag, nieuwste bovenaan |

Voorbeelden van de antwoorden staan in [`05-app/src/data/`](../05-app/src/data/). Daarmee
kun je het live-score-scherm bouwen zonder de lokale WordPress.

### Een wedstrijd

```json
{
  "id": 11,
  "aftrap": "2026-11-09T10:32:00+01:00",
  "status": "bezig",
  "minuut": 67,
  "extra": null,
  "minuut_tekst": "67",
  "thuis": { "id": 3, "naam": "Forum Sport", "logo": "https://neoradio.nl/wp-content/uploads/…png" },
  "uit": { "id": 2, "naam": "Wippolder", "logo": null },
  "score": { "thuis": 1, "uit": 2 },
  "rust": { "thuis": 1, "uit": 1 },
  "gebeurtenissen": [
    { "id": 1, "kant": "thuis", "type": "doelpunt", "minuut": 12, "extra": null, "minuut_tekst": "12", "speler": "S. de Jong" },
    { "id": 3, "kant": "uit", "type": "geel", "minuut": 45, "extra": 2, "minuut_tekst": "45+2", "speler": "M. Kok" }
  ]
}
```

| Veld | Uitleg |
| --- | --- |
| `aftrap` | Datum en tijd in ISO 8601. In JavaScript: `new Date(wedstrijd.aftrap)` |
| `status` | `gepland`, `bezig`, `rust` of `afgelopen` |
| `minuut` | De minuut waarin de wedstrijd nu is. Alleen bij `bezig`, anders `null`. In blessuretijd is dit 45 of 90 |
| `extra` | Blessuretijd: het aantal minuten na de 45e of 90e minuut, anders `null` |
| `minuut_tekst` | De minuut om te tonen, bijvoorbeeld `"67"` of `"45+2"`. Gebruik dit in de app |
| `logo` | Link naar het clublogo, of `null` als er geen logo is |
| `score` | `null` zolang de wedstrijd nog niet is begonnen |
| `rust` | De ruststand, of `null` als die er (nog) niet is |
| `gebeurtenissen` | Op volgorde van minuut. `type` is `doelpunt`, `geel` of `rood`. Ook hier `minuut`, `extra` en `minuut_tekst` (bijv. `"90+3"`). `minuut` en `speler` kunnen `null` zijn |

Bovenaan `/livescore` staat ook `"live": true` als er ergens een wedstrijd bezig of in de rust
is. Alleen dan hoeft de app elke 10 seconden te verversen.

## Endpoints voor het beheer in de app

Voor medewerkers met het recht `neo_livescore_invoeren`. Na het inloggen stuurt de app het token
mee in de header `X-NEO-Token`. In de database staat alleen een hash van het token; een token
is 30 dagen geldig. Na 5 verkeerde wachtwoorden moet je een kwartier wachten.

| Endpoint | Wat het doet |
| --- | --- |
| `POST /neo/v1/inloggen` | `{ gebruikersnaam, wachtwoord }` → `{ token, gebruiker }` |
| `POST /neo/v1/uitloggen` | Maakt het token ongeldig |
| `GET /neo/v1/beheer/wedstrijden?datum=` | Wedstrijden van één dag (standaard vandaag), met wie ze bijhoudt |
| `GET /neo/v1/beheer/wedstrijden/{id}` | Eén wedstrijd |
| `POST /neo/v1/beheer/wedstrijden/{id}/bijhouden` | Wedstrijd gaan bijhouden. `{ overnemen: true }` kan alleen een beheerder |
| `POST /neo/v1/beheer/wedstrijden/{id}/status` | `{ status }`: gepland, bezig, rust of afgelopen |
| `POST /neo/v1/beheer/wedstrijden/{id}/gebeurtenissen` | `{ kant, type, minuut?, extra?, speler? }`. Zonder minuut: de minuut van nu, ook in blessuretijd. `extra` mag alleen bij minuut 45 of 90 |
| `PUT /neo/v1/beheer/gebeurtenissen/{id}` | Gebeurtenis aanpassen; de stand past zich aan |
| `DELETE /neo/v1/beheer/gebeurtenissen/{id}` | Gebeurtenis verwijderen (ook voor *Ongedaan maken*) |

Een beheer-wedstrijd heeft ook `spelers`: de namen die eerder bij de thuis- en uitclub zijn
ingevuld, de laatst gebruikte eerst. De app toont ze als tikknoppen, zodat je namen niet steeds
opnieuw hoeft te typen.

Een wedstrijd die iemand anders bijhoudt, kun je niet aanpassen (fout 409). Een vrije wedstrijd
wordt vanzelf van jou zodra je iets invoert.

