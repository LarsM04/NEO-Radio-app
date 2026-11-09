<?php
// Het menu "Live score" in het WordPress-beheer, en hulpfuncties die alle schermen gebruiken.

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', 'neo_ls_menu' );
add_action( 'admin_enqueue_scripts', 'neo_ls_admin_bestanden' );

function neo_ls_menu() {
	$recht = 'neo_livescore_beheren';

	add_menu_page( 'Live score', 'Live score', $recht, 'neo-live-score', 'neo_ls_pagina_wedstrijden', 'dashicons-awards', 26 );
	add_submenu_page( 'neo-live-score', 'Wedstrijden', 'Wedstrijden', $recht, 'neo-live-score', 'neo_ls_pagina_wedstrijden' );
	add_submenu_page( 'neo-live-score', 'Speelronde aanmaken', 'Speelronde aanmaken', $recht, 'neo-live-score-speelronde', 'neo_ls_pagina_speelronde' );
	add_submenu_page( 'neo-live-score', 'Clubs', 'Clubs', $recht, 'neo-live-score-clubs', 'neo_ls_pagina_clubs' );
	add_submenu_page( 'neo-live-score', 'Seizoenen en klassen', 'Seizoenen en klassen', $recht, 'neo-live-score-seizoenen', 'neo_ls_pagina_seizoenen' );
}

/**
 * CSS en JavaScript, alleen op onze eigen pagina's.
 */
function neo_ls_admin_bestanden( $hook ) {
	if ( false === strpos( $hook, 'neo-live-score' ) ) {
		return;
	}
	wp_enqueue_style( 'neo-ls-admin', plugins_url( 'assets/admin.css', NEO_LS_BESTAND ), array(), NEO_LS_VERSIE );
	wp_enqueue_script( 'neo-ls-admin', plugins_url( 'assets/admin.js', NEO_LS_BESTAND ), array(), NEO_LS_VERSIE, true );

	// De mediabibliotheek, om een clublogo te kiezen.
	if ( false !== strpos( $hook, 'neo-live-score-clubs' ) ) {
		wp_enqueue_media();
	}
}

/**
 * Link naar een van onze pagina's, bijvoorbeeld neo_ls_admin_url( 'neo-live-score-clubs', array( 'bewerk' => 3 ) ).
 */
function neo_ls_admin_url( $pagina, $args = array() ) {
	return add_query_arg( array_merge( array( 'page' => $pagina ), $args ), admin_url( 'admin.php' ) );
}

/**
 * Controleert bij elk formulier of de gebruiker dit mag en of het formulier echt van ons komt.
 */
function neo_ls_beheer_controleren( $actie ) {
	if ( ! current_user_can( 'neo_livescore_beheren' ) ) {
		wp_die( 'Je hebt geen toegang tot het beheer van de live score.', 403 );
	}
	check_admin_referer( $actie );
}

/**
 * Bewaart een melding en stuurt de gebruiker terug naar een pagina.
 * De melding verschijnt bovenaan die pagina (zie neo_ls_melding_tonen).
 */
function neo_ls_terug( $pagina, $args, $tekst, $soort = 'success' ) {
	set_transient(
		'neo_ls_melding_' . get_current_user_id(),
		array(
			'soort' => $soort,
			'tekst' => $tekst,
		),
		60
	);
	wp_safe_redirect( neo_ls_admin_url( $pagina, $args ) );
	exit;
}

function neo_ls_melding_tonen() {
	$sleutel = 'neo_ls_melding_' . get_current_user_id();
	$melding = get_transient( $sleutel );
	if ( ! $melding ) {
		return;
	}
	delete_transient( $sleutel );
	printf(
		'<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
		esc_attr( 'error' === $melding['soort'] ? 'error' : 'success' ),
		esc_html( $melding['tekst'] )
	);
}

/**
 * Een datum als tekst, bijvoorbeeld "zaterdag 10 oktober 2026".
 */
function neo_ls_datum_tekst( $datum, $met_jaar = true ) {
	$tijd = ( new DateTimeImmutable( $datum . ' 12:00', wp_timezone() ) )->getTimestamp();
	return wp_date( $met_jaar ? 'l j F Y' : 'l j F', $tijd );
}

/**
 * Een rond clublogo, of een lege cirkel als er geen logo is.
 */
function neo_ls_logo_html( $logo, $grootte = 28 ) {
	if ( $logo ) {
		return sprintf(
			'<img class="neo-ls-logo" src="%s" alt="" width="%d" height="%d">',
			esc_url( $logo ),
			$grootte,
			$grootte
		);
	}
	return sprintf( '<span class="neo-ls-logo neo-ls-logo-leeg" style="width:%1$dpx;height:%1$dpx"></span>', $grootte );
}

/**
 * Bovenkant van elke pagina: titel, uitleg en meldingen.
 */
function neo_ls_kop( $titel, $uitleg, $knop = null ) {
	echo '<div class="wrap neo-ls">';
	echo '<div class="neo-ls-kop"><div>';
	echo '<h1>' . esc_html( $titel ) . '</h1>';
	echo '<p class="neo-ls-uitleg">' . esc_html( $uitleg ) . '</p>';
	echo '</div>';
	if ( $knop ) {
		printf( '<a class="button button-primary" href="%s">%s</a>', esc_url( $knop['url'] ), esc_html( $knop['tekst'] ) );
	}
	echo '</div>';
	echo '<hr class="wp-header-end">';
	neo_ls_melding_tonen();
}

function neo_ls_voet() {
	echo '</div>';
}
