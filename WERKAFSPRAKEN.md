# Werkafspraken

## Werken aan de code (branches)

`main` is altijd de werkende versie. Daar werkt niemand rechtstreeks op.

1. **Haal eerst de nieuwste versie op:** `git checkout main` en dan `git pull`.
2. **Maak een branch per onderdeel**, met je naam erin:
   `git checkout -b lars/livescore` (bijv. `sultan/nieuws`, `duzyano/live-luisteren`).
3. **Commit vaak** met een duidelijke beschrijving, en push je branch naar GitHub:
   `git push -u origin lars/livescore`.
4. **Klaar met een onderdeel?** Maak op GitHub een **pull request** naar `main`. Iemand
   anders uit het team kijkt er even naar en klikt op **Merge**.
5. **Begin daarna aan een nieuwe branch** vanaf de nieuwste `main` (terug naar stap 1).

Werk je langer dan een paar dagen aan één branch? Haal dan tussendoor de wijzigingen van
de anderen binnen met `git pull origin main`, zodat je branch niet te ver achterloopt.

## Bestanden toevoegen

**Via de website van GitHub (makkelijkst):**

1. Ga naar de juiste map in de repository.
2. Klik op **Add file → Upload files**.
3. Sleep je bestanden erin, schrijf een korte beschrijving en klik op **Commit changes**.

**Via GitHub Desktop of de terminal:** zet het bestand in de juiste map, maak een commit
met een duidelijke beschrijving (bijv. "Screenshots homepage toegevoegd") en push.

> Het bestand `.gitkeep` in lege mappen zorgt er alleen voor dat de map op GitHub
> zichtbaar is. Je mag het laten staan of verwijderen zodra er iets in de map staat.
