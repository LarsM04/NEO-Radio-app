// Ververst de shortcode [neo_livescore] elke 10 seconden, maar alleen zolang er een wedstrijd
// bezig is (of vandaag nog begint) en het tabblad zichtbaar is. Zo blijft het licht voor de website.
document.querySelectorAll('.neo-ls-score').forEach((blok) => {
	setInterval(async () => {
		if (blok.dataset.ververs !== '1' || document.hidden) {
			return;
		}
		try {
			const antwoord = await fetch(blok.dataset.url, { cache: 'no-store' });
			if (antwoord.ok) {
				const data = await antwoord.json();
				blok.innerHTML = data.html;
				blok.dataset.ververs = data.ververs ? '1' : '0';
			}
		} catch {
			// Even geen verbinding: de volgende keer opnieuw.
		}
	}, 10000);
});
