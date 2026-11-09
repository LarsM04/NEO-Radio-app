// JavaScript voor de live-score-schermen in het WordPress-beheer.
// Gewoon JavaScript, zonder build-stap.
(function () {
	'use strict';

	// Formulieren met data-neo-bevestig vragen eerst om bevestiging (bijv. bij verwijderen).
	document.querySelectorAll('form[data-neo-bevestig]').forEach(function (form) {
		form.addEventListener('submit', function (e) {
			if (!window.confirm(form.dataset.neoBevestig)) {
				e.preventDefault();
			}
		});
	});

	logoKiezer();
	speelronde();

	// ------------------------------------------------------------------
	// Clubs: logo kiezen uit de mediabibliotheek van WordPress.
	// ------------------------------------------------------------------
	function logoKiezer() {
		var kiezer = document.querySelector('[data-neo-logo-kiezer]');
		if (!kiezer || !window.wp || !wp.media) {
			return;
		}
		var url = kiezer.querySelector('[data-neo-logo-url]');
		var voorbeeld = kiezer.querySelector('[data-neo-logo-voorbeeld]');
		var weg = kiezer.querySelector('[data-neo-logo-weg]');
		var venster;

		function zet(adres) {
			url.value = adres;
			voorbeeld.src = adres;
			voorbeeld.hidden = !adres;
			weg.hidden = !adres;
		}

		kiezer.querySelector('[data-neo-logo-kies]').addEventListener('click', function () {
			if (!venster) {
				venster = wp.media({
					title: 'Kies het logo van de club',
					button: { text: 'Dit logo gebruiken' },
					library: { type: 'image' },
					multiple: false,
				});
				venster.on('select', function () {
					zet(venster.state().get('selection').first().toJSON().url);
				});
			}
			venster.open();
		});
		weg.addEventListener('click', function () {
			zet('');
		});
	}

	// ------------------------------------------------------------------
	// Speelronde aanmaken: rijen met thuis- en uitclub.
	// ------------------------------------------------------------------
	function speelronde() {
		var form = document.querySelector('[data-neo-speelronde]');
		if (!form) {
			return;
		}
		var gegevens = JSON.parse(form.dataset.neoSpeelronde);
		var klasseVeld = form.querySelector('[data-neo-klasse]');
		var standaardVeld = form.querySelector('[data-neo-standaard]');
		var tbody = form.querySelector('[data-neo-rijen]');
		var chips = form.querySelector('[data-neo-chips]');
		var teller = form.querySelector('[data-neo-teller]');
		var nogTeller = form.querySelector('[data-neo-nog-teller]');
		var geenClubs = form.querySelector('[data-neo-geen-clubs]');
		var namen = {};
		gegevens.clubs.forEach(function (club) {
			namen[club.id] = club.naam;
		});
		var vorigeStandaard = standaardVeld.value;
		var volgnummer = 0;

		function clubsInKlasse() {
			var ids = gegevens.perKlasse[klasseVeld.value] || [];
			// Alleen actieve clubs (die staan in gegevens.clubs).
			return ids.filter(function (id) {
				return namen[id] !== undefined;
			});
		}

		function keuzelijst(naam, gekozen) {
			var select = document.createElement('select');
			select.name = naam;
			select.dataset.neoClub = '';
			var inKlasse = clubsInKlasse();

			select.add(new Option('Kies club', ''));
			var groepKlasse = document.createElement('optgroup');
			groepKlasse.label = 'In deze klasse';
			var groepAnders = document.createElement('optgroup');
			groepAnders.label = 'Andere clubs';
			gegevens.clubs.forEach(function (club) {
				var optie = new Option(club.naam, club.id, false, String(club.id) === String(gekozen));
				(inKlasse.indexOf(club.id) !== -1 ? groepKlasse : groepAnders).appendChild(optie);
			});
			if (groepKlasse.children.length) {
				select.appendChild(groepKlasse);
			}
			if (groepAnders.children.length) {
				select.appendChild(groepAnders);
			}
			select.addEventListener('change', bijwerken);
			return select;
		}

		function rijToevoegen(thuis, uit, aftrap) {
			var i = volgnummer++;
			var tr = document.createElement('tr');
			tr.innerHTML = '<td class="neo-ls-klein" data-neo-nummer></td><td></td><td>–</td><td></td><td></td><td></td>';
			tr.children[1].appendChild(keuzelijst('wedstrijden[' + i + '][thuis]', thuis));
			tr.children[3].appendChild(keuzelijst('wedstrijden[' + i + '][uit]', uit));

			var tijd = document.createElement('input');
			tijd.type = 'time';
			tijd.name = 'wedstrijden[' + i + '][aftrap]';
			tijd.value = aftrap || standaardVeld.value;
			tijd.required = true;
			tijd.dataset.neoAftrap = '';
			tr.children[4].appendChild(tijd);

			var weg = document.createElement('button');
			weg.type = 'button';
			weg.className = 'button-link button-link-delete';
			weg.innerHTML = '<span class="dashicons dashicons-trash"></span>';
			weg.setAttribute('aria-label', 'Wedstrijd weghalen');
			weg.addEventListener('click', function () {
				tr.remove();
				bijwerken();
			});
			tr.children[5].appendChild(weg);

			tbody.appendChild(tr);
		}

		function lijsten() {
			return Array.prototype.slice.call(tbody.querySelectorAll('[data-neo-club]'));
		}

		// Nummers, uitgeschakelde clubs, chips en tellers opnieuw berekenen.
		function bijwerken() {
			var gekozen = lijsten()
				.map(function (s) {
					return s.value;
				})
				.filter(Boolean);

			// Een club die al gekozen is, kun je niet nog een keer kiezen.
			lijsten().forEach(function (select) {
				Array.prototype.forEach.call(select.options, function (optie) {
					optie.disabled = optie.value !== '' && optie.value !== select.value && gekozen.indexOf(optie.value) !== -1;
				});
			});

			tbody.querySelectorAll('[data-neo-nummer]').forEach(function (td, i) {
				td.textContent = i + 1;
			});

			var inKlasse = clubsInKlasse();
			var nog = inKlasse.filter(function (id) {
				return gekozen.indexOf(String(id)) === -1;
			});
			chips.innerHTML = '';
			nog.forEach(function (id) {
				var chip = document.createElement('button');
				chip.type = 'button';
				chip.className = 'neo-ls-chip';
				chip.textContent = namen[id];
				chip.addEventListener('click', function () {
					zetOpEersteLegePlek(id);
				});
				chips.appendChild(chip);
			});
			nogTeller.textContent = nog.length + ' van ' + inKlasse.length;
			geenClubs.hidden = inKlasse.length > 0;

			var compleet = Array.prototype.filter.call(tbody.children, function (tr) {
				var s = tr.querySelectorAll('[data-neo-club]');
				return s[0].value && s[1].value;
			}).length;
			teller.textContent = compleet + (compleet === 1 ? ' wedstrijd klaar' : ' wedstrijden klaar');
		}

		function zetOpEersteLegePlek(id) {
			var leeg = lijsten().filter(function (s) {
				return !s.value;
			})[0];
			if (!leeg) {
				rijToevoegen();
				leeg = lijsten().filter(function (s) {
					return !s.value;
				})[0];
			}
			leeg.value = id;
			bijwerken();
		}

		// Nieuwe lege rijen: genoeg voor alle clubs in de klasse.
		function legeRijen() {
			tbody.innerHTML = '';
			var aantal = Math.max(1, Math.ceil(clubsInKlasse().length / 2));
			for (var i = 0; i < aantal; i++) {
				rijToevoegen();
			}
			bijwerken();
		}

		klasseVeld.addEventListener('change', function () {
			var ingevuld = lijsten().some(function (s) {
				return s.value;
			});
			if (!ingevuld || window.confirm('De ingevulde wedstrijden worden leeggemaakt. Doorgaan?')) {
				legeRijen();
			}
		});

		// Rijen die nog de oude standaardtijd hadden, krijgen de nieuwe.
		standaardVeld.addEventListener('change', function () {
			tbody.querySelectorAll('[data-neo-aftrap]').forEach(function (tijd) {
				if (tijd.value === vorigeStandaard) {
					tijd.value = standaardVeld.value;
				}
			});
			vorigeStandaard = standaardVeld.value;
		});

		form.querySelector('[data-neo-rij-erbij]').addEventListener('click', function () {
			rijToevoegen();
			bijwerken();
		});

		// Begin: wat er de vorige keer was ingevuld, of lege rijen.
		if (gegevens.rijen && gegevens.rijen.length) {
			gegevens.rijen.forEach(function (rij) {
				rijToevoegen(rij.thuis, rij.uit, rij.aftrap);
			});
			bijwerken();
		} else {
			legeRijen();
		}
	}
})();
