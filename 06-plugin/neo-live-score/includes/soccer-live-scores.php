<?php
// Clubs en logo's één keer overzetten uit de oude plugin Soccer Live Scores.
// Die plugin bewaart alleen wedstrijden met twee teamnamen en logo's, geen datum of klasse,
// dus meer dan clubs en logo's valt er niet over te zetten.

defined( 'ABSPATH' ) || exit;

/**
 * Alle clubs uit Soccer Live Scores: naam => logo (of '' als er geen logo is).
 * Leeg als die plugin er niet (meer) is.
 */
function neo_ls_sls_clubs() {
	global $wpdb;
	$tabel = $wpdb->prefix . 'daextsolisc_match';
	if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $tabel ) ) !== $tabel ) {
		return array();
	}

	$clubs = array();
	// Oudste eerst, zodat het logo van de nieuwste wedstrijd wint.
	foreach ( $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i ORDER BY match_id', $tabel ) ) as $rij ) {
		foreach ( array( 1, 2 ) as $team ) {
			$naam = neo_ls_sls_naam( $rij->{"team_{$team}_name"}, $team );
			$logo = esc_url_raw( $rij->{"team_{$team}_logo"} );
			if ( '' !== $naam && ( $logo || ! isset( $clubs[ $naam ] ) ) ) {
				$clubs[ $naam ] = $logo;
			}
		}
	}
	return $clubs;
}

/**
 * Maakt een teamnaam uit Soccer Live Scores schoon:
 * "Zwammerdam – TAVV" (hele wedstrijd als naam) → "Zwammerdam" voor team 1, "TAVV" voor team 2,
 * "Nieuwkoop (15.00 uur)" → "Nieuwkoop", en "NSV’46" → "NSV'46".
 */
function neo_ls_sls_naam( $naam, $team ) {
	$naam  = html_entity_decode( (string) $naam, ENT_QUOTES, 'UTF-8' );
	$delen = preg_split( '/\s+[-–—]\s+/u', $naam );
	if ( 2 === count( $delen ) ) {
		$naam = $delen[ $team - 1 ];
	}
	$naam = preg_replace( '/\s*\(.*$/u', '', $naam );
	$naam = str_replace( array( '’', '‘', '`' ), "'", $naam );
	return sanitize_text_field( $naam );
}

/**
 * De clubs die nog niet bij ons staan, of bij ons nog geen logo hebben.
 * naam => array( 'id' => onze club-id of 0, 'logo' => logo-URL ).
 */
function neo_ls_sls_ontbrekend() {
	global $wpdb;
	$bestaand = array();
	foreach ( $wpdb->get_results( $wpdb->prepare( 'SELECT id, naam, logo FROM %i', neo_ls_tabel( 'club' ) ) ) as $club ) {
		$bestaand[ mb_strtolower( $club->naam ) ] = $club;
	}

	$ontbrekend = array();
	foreach ( neo_ls_sls_clubs() as $naam => $logo ) {
		$club = $bestaand[ mb_strtolower( $naam ) ] ?? null;
		if ( ! $club || ( '' === $club->logo && $logo ) ) {
			$ontbrekend[ $naam ] = array(
				'id'   => $club ? (int) $club->id : 0,
				'logo' => $logo,
			);
		}
	}
	return $ontbrekend;
}

/**
 * Zet de ontbrekende clubs over. Bestaande clubs en logo's blijven zoals ze zijn;
 * alleen een leeg logo wordt aangevuld. Je kunt het dus vaker doen zonder dat er iets dubbel komt.
 *
 * @return array( 'nieuw' => aantal nieuwe clubs, 'logo' => aantal aangevulde logo's )
 */
function neo_ls_sls_overzetten() {
	global $wpdb;
	$tabel  = neo_ls_tabel( 'club' );
	$aantal = array(
		'nieuw' => 0,
		'logo'  => 0,
	);

	foreach ( neo_ls_sls_ontbrekend() as $naam => $club ) {
		if ( $club['id'] ) {
			$wpdb->update( $tabel, array( 'logo' => $club['logo'] ), array( 'id' => $club['id'] ) );
			++$aantal['logo'];
		} elseif ( $wpdb->insert(
			$tabel,
			array(
				'naam'   => $naam,
				'logo'   => $club['logo'],
				'actief' => 1,
			)
		) ) {
			++$aantal['nieuw'];
		}
	}
	return $aantal;
}
