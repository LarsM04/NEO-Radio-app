<?php
// Scherm "Wedstrijden": alle wedstrijden van één speeldag, per klasse.
// De stand bijhouden gebeurt straks op de invoerpagina langs het veld.

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_neo_ls_wedstrijd_aanpassen', 'neo_ls_wedstrijd_aanpassen' );
add_action( 'admin_post_neo_ls_wedstrijd_verwijderen', 'neo_ls_wedstrijd_verwijderen' );

function neo_ls_pagina_wedstrijden() {
	global $wpdb;
	$tabel = neo_ls_tabel( 'wedstrijd' );

	// Alle speeldagen, om tussen te kunnen bladeren.
	$dagen   = $wpdb->get_col( $wpdb->prepare( 'SELECT DISTINCT DATE(aftrap) AS dag FROM %i ORDER BY dag', $tabel ) );
	$vandaag = wp_date( 'Y-m-d' );

	// Welke dag tonen we? Gekozen dag, anders vandaag of de eerstvolgende speeldag, anders de laatste.
	$datum = sanitize_text_field( wp_unslash( $_GET['datum'] ?? '' ) );
	if ( ! DateTimeImmutable::createFromFormat( '!Y-m-d', $datum ) ) {
		$datum = $vandaag;
		foreach ( $dagen as $dag ) {
			if ( $dag >= $vandaag ) {
				$datum = $dag;
				break;
			}
			$datum = $dag;
		}
	}

	$eerder = null;
	$later  = null;
	foreach ( $dagen as $dag ) {
		if ( $dag < $datum ) {
			$eerder = $dag;
		}
		if ( $dag > $datum && ! $later ) {
			$later = $dag;
		}
	}

	neo_ls_kop(
		'Wedstrijden',
		'Alle wedstrijden van één speeldag. De stand bijhouden doe je langs het veld op de invoerpagina.',
		array(
			'url'   => neo_ls_admin_url( 'neo-live-score-speelronde', array( 'datum' => $datum ) ),
			'tekst' => '+ Speelronde aanmaken',
		)
	);

	// Bladeren tussen speeldagen.
	echo '<div class="neo-ls-datumnav">';
	neo_ls_dag_knop( $eerder, '‹ Vorige speeldag' );
	echo '<h2>' . esc_html( ucfirst( neo_ls_datum_tekst( $datum ) ) ) . '</h2>';
	neo_ls_dag_knop( $later, 'Volgende speeldag ›' );
	printf(
		'<form method="get" style="margin-left:auto"><input type="hidden" name="page" value="neo-live-score"><input type="date" name="datum" value="%s"> <button class="button">Ga naar datum</button></form>',
		esc_attr( $datum )
	);
	echo '</div>';

	$seizoen = neo_ls_actief_seizoen();
	$klassen = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT DISTINCT k.* FROM %i k JOIN %i w ON w.klasse_id = k.id WHERE DATE(w.aftrap) = %s ORDER BY k.volgorde, k.naam',
			neo_ls_tabel( 'klasse' ),
			$tabel,
			$datum
		)
	);

	if ( ! $klassen ) {
		echo '<div class="neo-ls-kaart"><p class="neo-ls-leeg">Op deze dag zijn geen wedstrijden.</p></div>';
	}

	foreach ( $klassen as $klasse ) {
		echo '<div class="neo-ls-kaart">';
		printf( '<div class="neo-ls-kaart-kop"><h2>%s</h2><span class="neo-ls-label">%s</span></div>', esc_html( $klasse->naam ), esc_html( $klasse->korte_naam ) );
		echo '<table class="widefat striped"><thead><tr><th style="width:70px">Aftrap</th><th>Thuis</th><th style="width:90px;text-align:center">Stand</th><th>Uit</th><th>Status</th><th>Bijgehouden door</th><th></th></tr></thead><tbody>';

		foreach ( neo_ls_wedstrijden_ophalen( $klasse->id, $datum ) as $w ) {
			$ruw    = neo_ls_wedstrijd( $w['id'] );
			$door   = $ruw->bijgehouden_door ? get_userdata( $ruw->bijgehouden_door ) : null;
			$status = $w['status'];
			if ( 'bezig' === $status && $w['minuut'] ) {
				$status_tekst = 'Live ' . $w['minuut'] . "'";
			} else {
				$status_tekst = ucfirst( $status );
			}

			echo '<tr>';
			printf( '<td>%s</td>', esc_html( wp_date( 'H:i', strtotime( $w['aftrap'] ) ) ) );
			printf( '<td><span class="neo-ls-club">%s %s</span></td>', neo_ls_logo_html( $w['thuis']['logo'] ), esc_html( $w['thuis']['naam'] ) );
			echo '<td style="text-align:center"><span class="neo-ls-stand">';
			echo $w['score'] ? esc_html( $w['score']['thuis'] . ' - ' . $w['score']['uit'] ) : '–';
			echo '</span>';
			if ( $w['rust'] ) {
				printf( '<br><span class="neo-ls-klein">rust %d-%d</span>', $w['rust']['thuis'], $w['rust']['uit'] );
			}
			echo '</td>';
			printf( '<td><span class="neo-ls-club">%s %s</span></td>', neo_ls_logo_html( $w['uit']['logo'] ), esc_html( $w['uit']['naam'] ) );
			printf( '<td><span class="neo-ls-status neo-ls-status-%s">%s</span></td>', esc_attr( $status ), esc_html( $status_tekst ) );
			printf( '<td>%s</td>', $door ? esc_html( $door->display_name ) : '<span class="neo-ls-klein">Nog niemand</span>' );

			echo '<td style="text-align:right;white-space:nowrap">';
			if ( 'gepland' === $w['status'] ) {
				neo_ls_aftrap_formulier( $w );
			}
			echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" data-neo-bevestig="' . esc_attr( sprintf( '%s - %s verwijderen? Doelpunten en kaarten gaan ook weg.', $w['thuis']['naam'], $w['uit']['naam'] ) ) . '">';
			wp_nonce_field( 'neo_ls_wedstrijd_verwijderen' );
			echo '<input type="hidden" name="action" value="neo_ls_wedstrijd_verwijderen">';
			printf( '<input type="hidden" name="id" value="%d">', $w['id'] );
			echo ' <button class="button-link button-link-delete">Verwijderen</button></form>';
			echo '</td></tr>';

			if ( $w['gebeurtenissen'] ) {
				echo '<tr><td></td><td colspan="6" class="neo-ls-klein">';
				$regels = array();
				foreach ( $w['gebeurtenissen'] as $g ) {
					$soort    = array(
						'doelpunt' => '⚽',
						'geel'     => '🟨',
						'rood'     => '🟥',
					)[ $g['type'] ];
					$club     = $w[ $g['kant'] ]['naam'];
					$regels[] = trim( $soort . ' ' . ( $g['minuut'] ? $g['minuut'] . "' " : '' ) . ( $g['speler'] ? $g['speler'] . ' ' : '' ) . "($club)" );
				}
				echo esc_html( implode( '   ·   ', $regels ) );
				echo '</td></tr>';
			}
		}
		echo '</tbody></table></div>';
	}

	if ( ! $seizoen ) {
		printf(
			'<p class="neo-ls-klein">Er is nog geen huidig seizoen. <a href="%s">Maak eerst een seizoen aan.</a></p>',
			esc_url( neo_ls_admin_url( 'neo-live-score-seizoenen' ) )
		);
	}

	neo_ls_voet();
}

function neo_ls_dag_knop( $dag, $tekst ) {
	if ( $dag ) {
		printf( '<a class="button" href="%s">%s</a>', esc_url( neo_ls_admin_url( 'neo-live-score', array( 'datum' => $dag ) ) ), esc_html( $tekst ) );
	} else {
		printf( '<button class="button" disabled>%s</button>', esc_html( $tekst ) );
	}
}

/**
 * Aftraptijd aanpassen, zolang de wedstrijd nog niet is begonnen.
 */
function neo_ls_aftrap_formulier( $w ) {
	echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_wedstrijd_aanpassen' );
	echo '<input type="hidden" name="action" value="neo_ls_wedstrijd_aanpassen">';
	printf( '<input type="hidden" name="id" value="%d">', $w['id'] );
	printf( '<input type="time" name="aftrap" value="%s" style="width:100px" aria-label="Aftraptijd"> ', esc_attr( wp_date( 'H:i', strtotime( $w['aftrap'] ) ) ) );
	echo '<button class="button button-small">Opslaan</button></form>';
}

function neo_ls_wedstrijd_aanpassen() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_wedstrijd_aanpassen' );

	$id        = absint( $_POST['id'] ?? 0 );
	$aftrap    = sanitize_text_field( wp_unslash( $_POST['aftrap'] ?? '' ) );
	$wedstrijd = neo_ls_wedstrijd( $id );
	if ( ! $wedstrijd ) {
		neo_ls_terug( 'neo-live-score', array(), 'Deze wedstrijd bestaat niet.', 'error' );
	}

	$datum = substr( $wedstrijd->aftrap, 0, 10 );
	if ( ! preg_match( '/^([01]\d|2[0-3]):[0-5]\d$/', $aftrap ) ) {
		neo_ls_terug( 'neo-live-score', array( 'datum' => $datum ), 'Vul een geldige aftraptijd in, bijvoorbeeld 14:30.', 'error' );
	}

	$wpdb->update(
		neo_ls_tabel( 'wedstrijd' ),
		array(
			'aftrap'     => "$datum $aftrap:00",
			'bijgewerkt' => neo_ls_nu(),
		),
		array( 'id' => $id )
	);
	neo_ls_terug( 'neo-live-score', array( 'datum' => $datum ), "De aftrap is aangepast naar $aftrap." );
}

function neo_ls_wedstrijd_verwijderen() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_wedstrijd_verwijderen' );

	$id        = absint( $_POST['id'] ?? 0 );
	$wedstrijd = neo_ls_wedstrijd( $id );
	if ( ! $wedstrijd ) {
		neo_ls_terug( 'neo-live-score', array(), 'Deze wedstrijd bestaat niet.', 'error' );
	}

	$wpdb->delete( neo_ls_tabel( 'gebeurtenis' ), array( 'wedstrijd_id' => $id ) );
	$wpdb->delete( neo_ls_tabel( 'wedstrijd' ), array( 'id' => $id ) );
	neo_ls_terug( 'neo-live-score', array( 'datum' => substr( $wedstrijd->aftrap, 0, 10 ) ), 'De wedstrijd is verwijderd.' );
}
