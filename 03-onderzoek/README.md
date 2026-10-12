# 03 – Onderzoek

Alle onderzoeken die we voor de NEO Radio app hebben gedaan.

| Map                                             | Onderzoek                                                   | Verslag                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`huisstijl/`](huisstijl/)                      | Huisstijl van de huidige NEO Radio website                  | [huisstijl-onderzoek.md](huisstijl/huisstijl-onderzoek.md)                       |
| [`techniek-en-hosting/`](techniek-en-hosting/)  | Welke techniek en hosting het handigst zijn voor de app     | [onderzoek-techniek-en-hosting.pdf](techniek-en-hosting/onderzoek-techniek-en-hosting.pdf) |
| [`website-kopie/`](website-kopie/)              | Hoe de live score en andere content op de website staan     | [onderzoek-website-kopie.pdf](website-kopie/onderzoek-website-kopie.pdf) |

## Belangrijkste conclusies

- **Huisstijl:** de app krijgt dezelfde uitstraling als de website (NEO-groen, NEO-rood,
  logo en beeldstijl). Zie de conclusie in het [huisstijl-onderzoek](huisstijl/huisstijl-onderzoek.md#11-conclusie-wat-nemen-we-mee-naar-de-app).
- **Techniek:** React Native + Expo, met de content uit WordPress (REST API).
- **Admin-systeem live scores:** een eigen WordPress-plugin, zodat alles in één systeem blijft.
- **Live score nu:** de site gebruikt de plugin Soccer Live Scores. Die heeft geen REST API en
  bewaart geen datum, klasse of oude uitslagen. Onze plugin vervangt hem.
- **Hosting:** geen eigen server nodig. Wel een App Store-account (± €99 per jaar) en een
  Google Play-account (eenmalig ± $25), op naam van NEO Radio.

Nieuw onderzoek? Maak een eigen submap aan, bijv. `03-onderzoek/doelgroep/`.
