<?php
// Shortcode voor de website, zodat de website dezelfde live score toont als de app.
// Vervangt de losse [soccer-live-scores id="…"] per wedstrijd.
//
//   [neo_livescore]              huidige speelronde van alle klassen
//   [neo_livescore klasse="2"]   alleen deze klasse (de shortcode staat bij Seizoenen en klassen)
//
// Zolang er een wedstrijd bezig is, of vandaag nog begint, ververst het blok zich elke
// 10 seconden via /wp-json/neo/v1/livescore/html (zie assets/livescore.js).

defined( 'ABSPATH' ) || exit;

add_shortcode( 'neo_livescore', 'neo_ls_shortcode' );

function neo_ls_shortcode( $atts ) {
	$atts   = shortcode_atts( array( 'klasse' => 0 ), $atts, 'neo_livescore' );
	$klasse = absint( $atts['klasse'] );

	wp_enqueue_style( 'neo-ls-livescore', plugins_url( 'assets/livescore.css', NEO_LS_BESTAND ), array(), NEO_LS_VERSIE );
	wp_enqueue_script( 'neo-ls-livescore', plugins_url( 'assets/livescore.js', NEO_LS_BESTAND ), array(), NEO_LS_VERSIE, true );

	$blok = neo_ls_livescore_html( $klasse );
	return sprintf(
		'<div class="neo-ls-score" data-url="%s" data-ververs="%d">%s</div>',
		esc_url( add_query_arg( 'klasse', $klasse, rest_url( 'neo/v1/livescore/html' ) ) ),
		$blok['ververs'] ? 1 : 0,
		$blok['html']
	);
}

function neo_ls_rest_livescore_html( WP_REST_Request $verzoek ) {
	return neo_ls_antwoord( neo_ls_livescore_html( (int) $verzoek['klasse'] ) );
}

/**
 * De huidige speelronde als HTML. Met $klasse_id alleen die klasse.
 * ververs is true als er een wedstrijd bezig of in de rust is, of vandaag nog begint.
 *
 * @return array( 'html' => string, 'ververs' => bool )
 */
function neo_ls_livescore_html( $klasse_id = 0 ) {
	$html    = '';
	$ververs = false;
	$vandaag = wp_date( 'Y-m-d' );

	foreach ( neo_ls_livescore_gegevens()['klassen'] as $klasse ) {
		if ( $klasse_id && $klasse['id'] !== $klasse_id ) {
			continue;
		}

		$html .= '<div class="neo-ls-klasse">';
		$html .= sprintf(
			'<p class="neo-ls-klasse-naam">%s<span>%s</span></p>',
			esc_html( $klasse['naam'] ),
			esc_html( wp_date( 'l j F', strtotime( $klasse['datum'] . ' 12:00' ) ) )
		);
		foreach ( $klasse['wedstrijden'] as $wedstrijd ) {
			$html .= neo_ls_wedstrijd_html( $wedstrijd );
			if ( in_array( $wedstrijd['status'], array( 'bezig', 'rust' ), true )
				|| ( 'gepland' === $wedstrijd['status'] && $klasse['datum'] === $vandaag ) ) {
				$ververs = true;
			}
		}
		$html .= '</div>';
	}

	if ( '' === $html ) {
		$html = '<p class="neo-ls-leeg">Er zijn nog geen wedstrijden.</p>';
	}
	return array(
		'html'    => $html,
		'ververs' => $ververs,
	);
}

/**
 * Eén wedstrijd: thuisclub, stand (of aftraptijd) en uitclub.
 */
function neo_ls_wedstrijd_html( $wedstrijd ) {
	if ( 'gepland' === $wedstrijd['status'] ) {
		$midden = sprintf( '<span class="neo-ls-aftrap">%s</span>', esc_html( wp_date( 'H:i', strtotime( $wedstrijd['aftrap'] ) ) ) );
	} else {
		$midden = sprintf(
			'<span class="neo-ls-stand">%d - %d</span>',
			$wedstrijd['score']['thuis'],
			$wedstrijd['score']['uit']
		);
		if ( 'bezig' === $wedstrijd['status'] ) {
			$tekst   = $wedstrijd['minuut_tekst'] ? $wedstrijd['minuut_tekst'] . "'" : 'Live';
			$midden .= '<span class="neo-ls-status neo-ls-live">' . esc_html( $tekst ) . '</span>';
		} else {
			$midden .= '<span class="neo-ls-status">' . ( 'rust' === $wedstrijd['status'] ? 'Rust' : 'Afgelopen' ) . '</span>';
		}
	}

	return sprintf(
		'<div class="neo-ls-wedstrijd">%s<span class="neo-ls-midden">%s</span>%s</div>',
		neo_ls_club_html( $wedstrijd['thuis'], 'thuis' ),
		$midden,
		neo_ls_club_html( $wedstrijd['uit'], 'uit' )
	);
}

function neo_ls_club_html( $club, $kant ) {
	$logo = $club['logo']
		? sprintf( '<img class="neo-ls-logo" src="%s" alt="" width="44" height="44" loading="lazy">', esc_url( $club['logo'] ) )
		: '<span class="neo-ls-logo neo-ls-logo-leeg"></span>';
	return sprintf(
		'<span class="neo-ls-club neo-ls-%s">%s<span class="neo-ls-clubnaam">%s</span></span>',
		esc_attr( $kant ),
		$logo,
		esc_html( $club['naam'] )
	);
}
