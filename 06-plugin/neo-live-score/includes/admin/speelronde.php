<?php
// Scherm "Speelronde aanmaken": alle wedstrijden van één klasse in één keer aanmaken.
// De rijen met thuis- en uitclub bouwt admin.js op uit de clubs die we hier meegeven.

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_neo_ls_speelronde_opslaan', 'neo_ls_speelronde_opslaan' );

function neo_ls_pagina_speelronde() {
	global $wpdb;
	$seizoen = neo_ls_actief_seizoen();

	neo_ls_kop( 'Speelronde aanmaken', 'Maak alle wedstrijden van één klasse in één keer aan. Clubs kies je uit de lijst.' );

	$klassen = $seizoen ? neo_ls_klassen( $seizoen->id ) : array();
	if ( ! $klassen ) {
		printf(
			'<div class="neo-ls-kaart"><p class="neo-ls-leeg">Er is nog geen huidig seizoen met klassen. <a href="%s">Maak eerst een seizoen en klassen aan.</a></p></div>',
			esc_url( neo_ls_admin_url( 'neo-live-score-seizoenen' ) )
		);
		neo_ls_voet();
		return;
	}

	// Wat er de vorige keer is ingevuld, als het opslaan mislukte.
	$sleutel = 'neo_ls_speelronde_' . get_current_user_id();
	$vorige  = get_transient( $sleutel );
	delete_transient( $sleutel );

	$klasse_id = absint( $vorige['klasse'] ?? ( $_GET['klasse'] ?? $klassen[0]->id ) );
	$datum     = $vorige['datum'] ?? sanitize_text_field( wp_unslash( $_GET['datum'] ?? neo_ls_volgende_zaterdag() ) );
	$standaard = $vorige['standaard'] ?? '14:30';

	// Alle actieve clubs, en per klasse welke clubs erin spelen.
	$clubs = $wpdb->get_results( $wpdb->prepare( 'SELECT id, naam, logo FROM %i WHERE actief = 1 ORDER BY naam', neo_ls_tabel( 'club' ) ) );
	$per_klasse = array();
	foreach ( $klassen as $klasse ) {
		$per_klasse[ $klasse->id ] = array_map(
			'intval',
			$wpdb->get_col( $wpdb->prepare( 'SELECT club_id FROM %i WHERE klasse_id = %d', neo_ls_tabel( 'klasse_club' ), $klasse->id ) )
		);
	}

	$gegevens = array(
		'clubs'     => array_map(
			fn( $c ) => array(
				'id'   => (int) $c->id,
				'naam' => $c->naam,
			),
			$clubs
		),
		'perKlasse' => $per_klasse,
		'rijen'     => $vorige['wedstrijden'] ?? null,
	);

	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" data-neo-speelronde="' . esc_attr( wp_json_encode( $gegevens ) ) . '">';
	wp_nonce_field( 'neo_ls_speelronde_opslaan' );
	echo '<input type="hidden" name="action" value="neo_ls_speelronde_opslaan">';

	// Bovenste kaart: seizoen, klasse, datum en standaard aftrap.
	echo '<div class="neo-ls-kaart" style="margin-top:16px"><div class="neo-ls-velden-rij">';
	printf( '<div class="neo-ls-veld"><label>Seizoen</label><input type="text" value="%s" disabled></div>', esc_attr( $seizoen->naam ) );
	echo '<div class="neo-ls-veld"><label for="neo-klasse">Klasse</label><select id="neo-klasse" name="klasse" data-neo-klasse>';
	foreach ( $klassen as $klasse ) {
		printf( '<option value="%d"%s>%s</option>', (int) $klasse->id, selected( $klasse_id, (int) $klasse->id, false ), esc_html( $klasse->naam ) );
	}
	echo '</select></div>';
	printf( '<div class="neo-ls-veld"><label for="neo-datum">Datum</label><input type="date" id="neo-datum" name="datum" value="%s" required></div>', esc_attr( $datum ) );
	printf( '<div class="neo-ls-veld"><label for="neo-standaard">Standaard aftrap</label><input type="time" id="neo-standaard" name="standaard" value="%s" required data-neo-standaard></div>', esc_attr( $standaard ) );
	echo '</div></div>';

	echo '<div class="neo-ls-kolommen">';

	// Links: de wedstrijden.
	echo '<div class="neo-ls-kaart">';
	echo '<table class="neo-ls-ronde" style="width:100%"><thead><tr><th style="width:24px">#</th><th style="text-align:left">Thuisclub</th><th></th><th style="text-align:left">Uitclub</th><th style="text-align:left">Aftrap</th><th></th></tr></thead>';
	echo '<tbody data-neo-rijen></tbody></table>';
	echo '<div class="neo-ls-knoppen" style="justify-content:space-between;margin-top:16px">';
	echo '<button type="button" class="button" data-neo-rij-erbij>+ Wedstrijd toevoegen</button>';
	echo '<span class="neo-ls-knoppen"><span class="neo-ls-klein" data-neo-teller></span><button class="button button-primary">Wedstrijden aanmaken</button></span>';
	echo '</div></div>';

	// Rechts: clubs uit deze klasse die nog geen wedstrijd hebben.
	echo '<div class="neo-ls-kaart">';
	echo '<div class="neo-ls-kaart-kop"><h2>Nog niet ingepland</h2><span class="neo-ls-klein" data-neo-nog-teller></span></div>';
	echo '<p class="neo-ls-klein">Clubs uit deze klasse zonder wedstrijd. Klik om ze op de eerste lege plek te zetten.</p>';
	echo '<div class="neo-ls-chips" data-neo-chips></div>';
	printf(
		'<p class="neo-ls-klein" data-neo-geen-clubs hidden>Er zijn nog geen clubs aan deze klasse gekoppeld. Dat doe je bij <a href="%s">Clubs</a>.</p>',
		esc_url( neo_ls_admin_url( 'neo-live-score-clubs' ) )
	);
	echo '</div>';

	echo '</div></form>';
	neo_ls_voet();
}

/**
 * De datum van de eerstvolgende zaterdag (of vandaag als het zaterdag is).
 */
function neo_ls_volgende_zaterdag() {
	$vandaag = new DateTimeImmutable( 'today', wp_timezone() );
	return '6' === $vandaag->format( 'w' ) ? $vandaag->format( 'Y-m-d' ) : $vandaag->modify( 'next saturday' )->format( 'Y-m-d' );
}

function neo_ls_speelronde_opslaan() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_speelronde_opslaan' );

	$klasse_id = absint( $_POST['klasse'] ?? 0 );
	$datum     = sanitize_text_field( wp_unslash( $_POST['datum'] ?? '' ) );
	$standaard = sanitize_text_field( wp_unslash( $_POST['standaard'] ?? '' ) );
	$invoer    = (array) wp_unslash( $_POST['wedstrijden'] ?? array() );

	// Wat er is ingevuld, opgeschoond. Lege rijen slaan we over.
	$rijen = array();
	foreach ( $invoer as $rij ) {
		$rij    = (array) $rij;
		$thuis  = absint( $rij['thuis'] ?? 0 );
		$uit    = absint( $rij['uit'] ?? 0 );
		$aftrap = sanitize_text_field( $rij['aftrap'] ?? '' );
		if ( $thuis || $uit ) {
			$rijen[] = compact( 'thuis', 'uit', 'aftrap' );
		}
	}

	// Bij een fout gaan we terug naar het formulier, met alles nog ingevuld.
	$fout = function ( $tekst ) use ( $klasse_id, $datum, $standaard, $rijen ) {
		set_transient(
			'neo_ls_speelronde_' . get_current_user_id(),
			array(
				'klasse'      => $klasse_id,
				'datum'       => $datum,
				'standaard'   => $standaard,
				'wedstrijden' => $rijen,
			),
			300
		);
		neo_ls_terug( 'neo-live-score-speelronde', array(), $tekst, 'error' );
	};

	$seizoen = neo_ls_actief_seizoen();
	$klasse  = neo_ls_klasse( $klasse_id );
	if ( ! $seizoen || ! $klasse || (int) $klasse->seizoen_id !== (int) $seizoen->id ) {
		$fout( 'Kies een klasse uit het huidige seizoen.' );
	}
	if ( ! DateTimeImmutable::createFromFormat( '!Y-m-d', $datum ) ) {
		$fout( 'Kies een geldige datum.' );
	}
	if ( ! $rijen ) {
		$fout( 'Vul minstens één wedstrijd in.' );
	}

	// Welke clubs spelen die dag al (in welke klasse dan ook)?
	$al_bezet = array_map(
		'intval',
		$wpdb->get_col(
			$wpdb->prepare(
				'SELECT thuisclub_id FROM %i WHERE DATE(aftrap) = %s UNION SELECT uitclub_id FROM %i WHERE DATE(aftrap) = %s',
				neo_ls_tabel( 'wedstrijd' ),
				$datum,
				neo_ls_tabel( 'wedstrijd' ),
				$datum
			)
		)
	);
	$namen = wp_list_pluck( $wpdb->get_results( $wpdb->prepare( 'SELECT id, naam FROM %i', neo_ls_tabel( 'club' ) ) ), 'naam', 'id' );

	$gebruikt = array();
	foreach ( $rijen as $nummer => $rij ) {
		$wedstrijd = 'Wedstrijd ' . ( $nummer + 1 );
		if ( ! $rij['thuis'] || ! $rij['uit'] ) {
			$fout( "$wedstrijd: kies een thuisclub én een uitclub." );
		}
		if ( $rij['thuis'] === $rij['uit'] ) {
			$fout( "$wedstrijd: een club kan niet tegen zichzelf spelen." );
		}
		if ( ! preg_match( '/^([01]\d|2[0-3]):[0-5]\d$/', $rij['aftrap'] ) ) {
			$fout( "$wedstrijd: vul een geldige aftraptijd in, bijvoorbeeld 14:30." );
		}
		foreach ( array( $rij['thuis'], $rij['uit'] ) as $club_id ) {
			$naam = $namen[ $club_id ] ?? 'Onbekende club';
			if ( ! isset( $namen[ $club_id ] ) ) {
				$fout( "$wedstrijd: deze club bestaat niet meer." );
			}
			if ( in_array( $club_id, $gebruikt, true ) ) {
				$fout( "$naam staat twee keer in deze speelronde." );
			}
			if ( in_array( $club_id, $al_bezet, true ) ) {
				$fout( "$naam speelt op deze dag al een wedstrijd." );
			}
			$gebruikt[] = $club_id;
		}
	}

	// Alles klopt: wedstrijden aanmaken.
	foreach ( $rijen as $rij ) {
		$wpdb->insert(
			neo_ls_tabel( 'wedstrijd' ),
			array(
				'klasse_id'    => $klasse_id,
				'thuisclub_id' => $rij['thuis'],
				'uitclub_id'   => $rij['uit'],
				'aftrap'       => "$datum {$rij['aftrap']}:00",
				'status'       => 'gepland',
				'bijgewerkt'   => neo_ls_nu(),
			)
		);
	}

	$aantal = count( $rijen );
	neo_ls_terug(
		'neo-live-score',
		array( 'datum' => $datum ),
		sprintf( '%d %s aangemaakt voor de %s.', $aantal, 1 === $aantal ? 'wedstrijd' : 'wedstrijden', $klasse->korte_naam )
	);
}
