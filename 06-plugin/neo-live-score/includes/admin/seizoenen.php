<?php
// Scherm "Seizoenen en klassen": per seizoen leg je de klassen vast, met de volledige naam
// en een korte naam voor de app. De volgorde hier is ook de volgorde in de app.

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_neo_ls_seizoen_opslaan', 'neo_ls_seizoen_opslaan' );
add_action( 'admin_post_neo_ls_seizoen_actief', 'neo_ls_seizoen_actief_zetten' );
add_action( 'admin_post_neo_ls_klasse_opslaan', 'neo_ls_klasse_opslaan' );
add_action( 'admin_post_neo_ls_klasse_verplaatsen', 'neo_ls_klasse_verplaatsen' );
add_action( 'admin_post_neo_ls_klasse_verwijderen', 'neo_ls_klasse_verwijderen' );

function neo_ls_pagina_seizoenen() {
	global $wpdb;

	$seizoenen = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT s.*, (SELECT COUNT(*) FROM %i k WHERE k.seizoen_id = s.id) AS aantal_klassen FROM %i s ORDER BY s.naam DESC',
			neo_ls_tabel( 'klasse' ),
			neo_ls_tabel( 'seizoen' )
		)
	);

	// Welk seizoen staat open? Standaard het actieve.
	$gekozen_id = absint( $_GET['seizoen'] ?? 0 );
	$gekozen    = null;
	foreach ( $seizoenen as $seizoen ) {
		if ( ( $gekozen_id && (int) $seizoen->id === $gekozen_id ) || ( ! $gekozen_id && $seizoen->actief ) ) {
			$gekozen = $seizoen;
		}
	}
	if ( ! $gekozen && $seizoenen ) {
		$gekozen = $seizoenen[0];
	}

	neo_ls_kop( 'Seizoenen en klassen', 'Elk seizoen heeft eigen klassen. Afgesloten seizoenen en hun wedstrijden blijven bewaard.' );
	echo '<div class="neo-ls-kolommen smal-breed">';

	// Links: seizoenen.
	echo '<div class="neo-ls-kaart"><h2>Seizoenen</h2>';
	foreach ( $seizoenen as $seizoen ) {
		printf(
			'<a class="neo-ls-seizoen%s" href="%s"><span><strong>%s</strong><span class="neo-ls-klein">%s · %d %s</span></span><span>›</span></a>',
			$gekozen && $gekozen->id === $seizoen->id ? ' gekozen' : '',
			esc_url( neo_ls_admin_url( 'neo-live-score-seizoenen', array( 'seizoen' => $seizoen->id ) ) ),
			esc_html( $seizoen->naam ),
			$seizoen->actief ? 'Huidig seizoen' : 'Afgesloten',
			(int) $seizoen->aantal_klassen,
			1 === (int) $seizoen->aantal_klassen ? 'klasse' : 'klassen'
		);
	}
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin-top:12px">';
	wp_nonce_field( 'neo_ls_seizoen_opslaan' );
	echo '<input type="hidden" name="action" value="neo_ls_seizoen_opslaan">';
	echo '<div class="neo-ls-veld"><label for="neo-seizoen-naam">Nieuw seizoen</label><input type="text" id="neo-seizoen-naam" name="naam" placeholder="Bijv. 2027-2028" pattern="\d{4}-\d{4}" required></div>';
	echo '<button class="button">+ Seizoen toevoegen</button>';
	echo '</form></div>';

	// Rechts: klassen van het gekozen seizoen.
	echo '<div>';
	if ( $gekozen ) {
		neo_ls_klassen_kaart( $gekozen );
	} else {
		echo '<div class="neo-ls-kaart"><p class="neo-ls-leeg">Voeg eerst een seizoen toe, bijvoorbeeld 2026-2027.</p></div>';
	}
	echo '</div>';

	echo '</div>';
	neo_ls_voet();
}

function neo_ls_klassen_kaart( $seizoen ) {
	global $wpdb;

	$klassen = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT k.*, (SELECT MAX(DATE(w.aftrap)) FROM %i w WHERE w.klasse_id = k.id) AS laatste_ronde,
				(SELECT COUNT(*) FROM %i w WHERE w.klasse_id = k.id) AS aantal_wedstrijden
			FROM %i k WHERE k.seizoen_id = %d ORDER BY k.volgorde, k.naam',
			neo_ls_tabel( 'wedstrijd' ),
			neo_ls_tabel( 'wedstrijd' ),
			neo_ls_tabel( 'klasse' ),
			$seizoen->id
		)
	);
	$bewerk_id = absint( $_GET['bewerk_klasse'] ?? 0 );

	echo '<div class="neo-ls-kaart">';
	echo '<div class="neo-ls-kaart-kop"><h2>Klassen in ' . esc_html( $seizoen->naam ) . '</h2>';
	if ( ! $seizoen->actief ) {
		echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( 'neo_ls_seizoen_actief' );
		echo '<input type="hidden" name="action" value="neo_ls_seizoen_actief">';
		printf( '<input type="hidden" name="id" value="%d">', (int) $seizoen->id );
		echo '<button class="button button-primary">Maak dit het huidige seizoen</button></form>';
	}
	echo '</div>';

	if ( $klassen ) {
		echo '<table class="widefat striped"><thead><tr><th style="width:90px">Volgorde</th><th>Naam</th><th>Korte naam in de app</th><th>Laatste speelronde</th><th></th></tr></thead><tbody>';
		foreach ( $klassen as $i => $klasse ) {
			echo '<tr>';

			echo '<td>';
			neo_ls_verplaats_knop( $klasse, 'op', '↑', 0 === $i );
			neo_ls_verplaats_knop( $klasse, 'neer', '↓', count( $klassen ) - 1 === $i );
			echo '</td>';

			if ( (int) $klasse->id === $bewerk_id ) {
				// Deze klasse wordt bewerkt: velden in de rij zelf.
				echo '<td colspan="4">';
				neo_ls_klasse_formulier( $seizoen, $klasse );
				echo '</td>';
			} else {
				printf( '<td><strong>%s</strong></td>', esc_html( $klasse->naam ) );
				printf( '<td><span class="neo-ls-label">%s</span></td>', esc_html( $klasse->korte_naam ) );
				printf(
					'<td>%s</td>',
					$klasse->laatste_ronde ? esc_html( neo_ls_datum_tekst( $klasse->laatste_ronde, false ) ) : '<span class="neo-ls-klein">Nog geen</span>'
				);
				echo '<td style="text-align:right;white-space:nowrap">';
				printf(
					'<a class="button" href="%s">Bewerken</a> ',
					esc_url(
						neo_ls_admin_url(
							'neo-live-score-seizoenen',
							array(
								'seizoen'       => $seizoen->id,
								'bewerk_klasse' => $klasse->id,
							)
						)
					)
				);
				if ( 0 === (int) $klasse->aantal_wedstrijden ) {
					echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" data-neo-bevestig="Deze klasse verwijderen?">';
					wp_nonce_field( 'neo_ls_klasse_verwijderen' );
					echo '<input type="hidden" name="action" value="neo_ls_klasse_verwijderen">';
					printf( '<input type="hidden" name="id" value="%d">', (int) $klasse->id );
					echo '<button class="button-link button-link-delete">Verwijderen</button></form>';
				}
				echo '</td>';
			}
			echo '</tr>';
		}
		echo '</tbody></table>';
	} else {
		echo '<p class="neo-ls-leeg">Dit seizoen heeft nog geen klassen.</p>';
	}

	if ( ! $bewerk_id ) {
		echo '<div class="neo-ls-kaart" style="background:var(--neo-lichtgroen);margin:16px 0 0"><h2>Nieuwe klasse</h2>';
		neo_ls_klasse_formulier( $seizoen, null );
		echo '</div>';
	}
	echo '<p class="neo-ls-klein">ⓘ De volgorde hier is ook de volgorde in de app.</p>';
	echo '</div>';
}

function neo_ls_verplaats_knop( $klasse, $richting, $pijl, $uit ) {
	echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_klasse_verplaatsen' );
	echo '<input type="hidden" name="action" value="neo_ls_klasse_verplaatsen">';
	printf( '<input type="hidden" name="id" value="%d">', (int) $klasse->id );
	printf( '<input type="hidden" name="richting" value="%s">', esc_attr( $richting ) );
	printf( '<button class="button button-small"%s aria-label="%s">%s</button> ', disabled( $uit, true, false ), 'op' === $richting ? 'Omhoog' : 'Omlaag', esc_html( $pijl ) );
	echo '</form>';
}

function neo_ls_klasse_formulier( $seizoen, $klasse ) {
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_klasse_opslaan' );
	echo '<input type="hidden" name="action" value="neo_ls_klasse_opslaan">';
	printf( '<input type="hidden" name="seizoen_id" value="%d">', (int) $seizoen->id );
	printf( '<input type="hidden" name="id" value="%d">', $klasse ? (int) $klasse->id : 0 );
	echo '<div class="neo-ls-knoppen" style="align-items:flex-end">';
	printf(
		'<div class="neo-ls-veld" style="flex:2;margin:0"><label>Naam</label><input type="text" name="naam" value="%s" placeholder="Bijv. Derde Klasse A West 2" required maxlength="100"></div>',
		esc_attr( $klasse ? $klasse->naam : '' )
	);
	printf(
		'<div class="neo-ls-veld" style="flex:1;margin:0"><label>Korte naam</label><input type="text" name="korte_naam" value="%s" placeholder="Bijv. 3e klasse" required maxlength="30"></div>',
		esc_attr( $klasse ? $klasse->korte_naam : '' )
	);
	echo '<button class="button button-primary">Opslaan</button>';
	if ( $klasse ) {
		printf( '<a class="button" href="%s">Annuleren</a>', esc_url( neo_ls_admin_url( 'neo-live-score-seizoenen', array( 'seizoen' => $seizoen->id ) ) ) );
	}
	echo '</div></form>';
}

function neo_ls_seizoen_opslaan() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_seizoen_opslaan' );

	$naam  = sanitize_text_field( wp_unslash( $_POST['naam'] ?? '' ) );
	$tabel = neo_ls_tabel( 'seizoen' );

	if ( ! preg_match( '/^(\d{4})-(\d{4})$/', $naam, $jaren ) || (int) $jaren[2] !== (int) $jaren[1] + 1 ) {
		neo_ls_terug( 'neo-live-score-seizoenen', array(), 'Schrijf het seizoen als twee jaren na elkaar, bijvoorbeeld 2027-2028.', 'error' );
	}
	if ( $wpdb->get_var( $wpdb->prepare( 'SELECT id FROM %i WHERE naam = %s', $tabel, $naam ) ) ) {
		neo_ls_terug( 'neo-live-score-seizoenen', array(), "Seizoen $naam bestaat al.", 'error' );
	}

	// Het eerste seizoen wordt meteen het huidige.
	$eerste = 0 === (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $tabel ) );
	$wpdb->insert(
		$tabel,
		array(
			'naam'   => $naam,
			'actief' => $eerste ? 1 : 0,
		)
	);
	neo_ls_terug( 'neo-live-score-seizoenen', array( 'seizoen' => $wpdb->insert_id ), "Seizoen $naam is toegevoegd." );
}

function neo_ls_seizoen_actief_zetten() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_seizoen_actief' );

	$id    = absint( $_POST['id'] ?? 0 );
	$tabel = neo_ls_tabel( 'seizoen' );
	$wpdb->query( $wpdb->prepare( 'UPDATE %i SET actief = (id = %d)', $tabel, $id ) );

	$naam = $wpdb->get_var( $wpdb->prepare( 'SELECT naam FROM %i WHERE id = %d', $tabel, $id ) );
	neo_ls_terug( 'neo-live-score-seizoenen', array( 'seizoen' => $id ), "$naam is nu het huidige seizoen. De app toont vanaf nu dit seizoen." );
}

function neo_ls_klasse_opslaan() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_klasse_opslaan' );

	$id         = absint( $_POST['id'] ?? 0 );
	$seizoen_id = absint( $_POST['seizoen_id'] ?? 0 );
	$naam       = sanitize_text_field( wp_unslash( $_POST['naam'] ?? '' ) );
	$korte_naam = sanitize_text_field( wp_unslash( $_POST['korte_naam'] ?? '' ) );
	$tabel      = neo_ls_tabel( 'klasse' );
	$terug      = array( 'seizoen' => $seizoen_id );

	if ( '' === $naam || '' === $korte_naam ) {
		neo_ls_terug( 'neo-live-score-seizoenen', $terug, 'Vul de naam en de korte naam in.', 'error' );
	}

	if ( $id ) {
		$wpdb->update(
			$tabel,
			array(
				'naam'       => $naam,
				'korte_naam' => $korte_naam,
			),
			array( 'id' => $id )
		);
	} else {
		$volgorde = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COALESCE(MAX(volgorde), 0) FROM %i WHERE seizoen_id = %d', $tabel, $seizoen_id ) );
		$wpdb->insert(
			$tabel,
			array(
				'seizoen_id' => $seizoen_id,
				'naam'       => $naam,
				'korte_naam' => $korte_naam,
				'volgorde'   => $volgorde + 1,
			)
		);
	}
	neo_ls_terug( 'neo-live-score-seizoenen', $terug, "$naam is opgeslagen." );
}

/**
 * Wisselt een klasse van plek met de klasse erboven of eronder.
 */
function neo_ls_klasse_verplaatsen() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_klasse_verplaatsen' );

	$id     = absint( $_POST['id'] ?? 0 );
	$tabel  = neo_ls_tabel( 'klasse' );
	$klasse = neo_ls_klasse( $id );
	if ( ! $klasse ) {
		neo_ls_terug( 'neo-live-score-seizoenen', array(), 'Deze klasse bestaat niet.', 'error' );
	}

	// Eerst de volgorde netjes nummeren (1, 2, 3 ...), daarna wisselen.
	$ids = array_map( 'intval', wp_list_pluck( neo_ls_klassen( $klasse->seizoen_id ), 'id' ) );
	$plek = array_search( $id, $ids, true );
	$ander = 'op' === ( $_POST['richting'] ?? '' ) ? $plek - 1 : $plek + 1;
	if ( isset( $ids[ $ander ] ) ) {
		list( $ids[ $plek ], $ids[ $ander ] ) = array( $ids[ $ander ], $ids[ $plek ] );
	}
	foreach ( $ids as $nummer => $klasse_id ) {
		$wpdb->update( $tabel, array( 'volgorde' => $nummer + 1 ), array( 'id' => $klasse_id ) );
	}

	wp_safe_redirect( neo_ls_admin_url( 'neo-live-score-seizoenen', array( 'seizoen' => $klasse->seizoen_id ) ) );
	exit;
}

function neo_ls_klasse_verwijderen() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_klasse_verwijderen' );

	$id     = absint( $_POST['id'] ?? 0 );
	$klasse = neo_ls_klasse( $id );
	if ( ! $klasse ) {
		neo_ls_terug( 'neo-live-score-seizoenen', array(), 'Deze klasse bestaat niet.', 'error' );
	}

	$terug = array( 'seizoen' => $klasse->seizoen_id );
	if ( $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE klasse_id = %d', neo_ls_tabel( 'wedstrijd' ), $id ) ) ) {
		neo_ls_terug( 'neo-live-score-seizoenen', $terug, 'Deze klasse heeft al wedstrijden en kan niet worden verwijderd.', 'error' );
	}

	$wpdb->delete( neo_ls_tabel( 'klasse_club' ), array( 'klasse_id' => $id ) );
	$wpdb->delete( neo_ls_tabel( 'klasse' ), array( 'id' => $id ) );
	neo_ls_terug( 'neo-live-score-seizoenen', $terug, "{$klasse->naam} is verwijderd." );
}
