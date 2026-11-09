<?php
// WP-CLI-commando dat de tabellen vult met de voorbeelden uit het ontwerpdocument
// (speelrondes van 3 en 10 oktober 2026). Alleen voor de testomgeving.
//
//   wp neo-livescore testdata --leeg          alles leegmaken en opnieuw vullen
//   wp neo-livescore testdata --leeg --live   idem, plus een speelronde van vandaag die nu bezig is

defined( 'ABSPATH' ) || exit;

WP_CLI::add_command(
	'neo-livescore testdata',
	'neo_ls_cli_testdata',
	array(
		'shortdesc' => 'Vult de live-score-tabellen met de voorbeelden uit het ontwerpdocument.',
		'synopsis'  => array(
			array(
				'type'        => 'flag',
				'name'        => 'leeg',
				'description' => 'Maakt eerst alle tabellen van de plugin leeg.',
				'optional'    => true,
			),
			array(
				'type'        => 'flag',
				'name'        => 'live',
				'description' => 'Maakt ook een speelronde van vandaag met wedstrijden die bezig, in de rust en gepland zijn.',
				'optional'    => true,
			),
		),
	)
);

function neo_ls_cli_testdata( $args, $opties ) {
	global $wpdb;
	$tabellen = array( 'gebeurtenis', 'wedstrijd', 'klasse_club', 'club', 'klasse', 'seizoen' );

	if ( ! empty( $opties['leeg'] ) ) {
		foreach ( $tabellen as $tabel ) {
			$wpdb->query( $wpdb->prepare( 'TRUNCATE TABLE %i', neo_ls_tabel( $tabel ) ) );
		}
	} elseif ( $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', neo_ls_tabel( 'club' ) ) ) > 0 ) {
		WP_CLI::error( 'Er staat al data in de tabellen. Gebruik --leeg om alles te vervangen.' );
	}

	// Seizoen en klassen.
	$wpdb->insert( neo_ls_tabel( 'seizoen' ), array( 'naam' => '2025-2026', 'actief' => 0 ) );
	$wpdb->insert( neo_ls_tabel( 'seizoen' ), array( 'naam' => '2026-2027', 'actief' => 1 ) );
	$seizoen = (int) $wpdb->insert_id;

	$klasse2 = neo_ls_td_klasse( $seizoen, 'Tweede Klasse C West 2', '2e klasse', 1 );
	$klasse4 = neo_ls_td_klasse( $seizoen, 'Vierde Klasse B West 2', '4e klasse', 2 );
	$klasse5 = neo_ls_td_klasse( $seizoen, 'Vijfde Klasse B West 2', '5e klasse', 3 );

	// Clubs. Logo's halen we uit Soccer Live Scores als die club daar al in staat.
	$logos = neo_ls_td_logos_uit_soccer_live_scores();
	$club  = array();
	foreach ( array( 'Nieuwkoop', 'Wippolder', 'Forum Sport', 'Argon' ) as $naam ) {
		$club[ $naam ] = neo_ls_td_club( $naam, $logos, $klasse2 );
	}
	foreach ( array( 'TAVV', 'Woerden', 'Altior', 'AVV Alphen', 'Zwammerdam', 'Nicolaas Boys', "NSV'46", 'Linschoten', 'Aarlanderveen', 'Woubrugge', 'KDO', 'Koudekerk', "SIVEO'60", 'ROAC' ) as $naam ) {
		$club[ $naam ] = neo_ls_td_club( $naam, $logos, $klasse4 );
	}
	$club['ASW']      = neo_ls_td_club( 'ASW', $logos, $klasse5 );
	$club['Gouderak'] = neo_ls_td_club( 'Gouderak', $logos, $klasse5, false );

	// Zaterdag 3 oktober (de "Eerdere uitslagen" uit het ontwerp).
	neo_ls_td_wedstrijd( $klasse2, $club['Forum Sport'], $club['Nieuwkoop'], '2026-10-03 14:30', 'afgelopen', array( 1, 0 ) );
	neo_ls_td_wedstrijd( $klasse4, $club['Zwammerdam'], $club['TAVV'], '2026-10-03 14:30', 'afgelopen', array( 3, 0 ) );
	neo_ls_td_wedstrijd( $klasse4, $club['Nicolaas Boys'], $club['Altior'], '2026-10-03 14:30', 'afgelopen', array( 1, 1 ) );
	neo_ls_td_wedstrijd( $klasse4, $club["NSV'46"], $club['Linschoten'], '2026-10-03 14:30', 'afgelopen', array( 1, 2 ) );
	neo_ls_td_wedstrijd( $klasse4, $club['Aarlanderveen'], $club['Woubrugge'], '2026-10-03 14:30', 'afgelopen', array( 1, 2 ) );
	neo_ls_td_wedstrijd( $klasse4, $club['AVV Alphen'], $club['KDO'], '2026-10-03 14:30', 'afgelopen', array( 1, 4 ) );
	neo_ls_td_wedstrijd( $klasse4, $club['Woerden'], $club['Koudekerk'], '2026-10-03 14:30', 'afgelopen', array( 2, 2 ) );

	// Zaterdag 10 oktober (de speelronde uit het ontwerp), met doelpunten en kaarten.
	neo_ls_td_wedstrijd(
		$klasse2, $club['Nieuwkoop'], $club['Wippolder'], '2026-10-10 14:30', 'afgelopen', null, array( 1, 1 ),
		array(
			array( 'thuis', 'doelpunt', 12, 'S. de Jong' ),
			array( 'uit', 'doelpunt', 34, '' ),
			array( 'thuis', 'doelpunt', 52, 'S. de Jong' ),
			array( 'uit', 'geel', 58, 'M. Kok' ),
			array( 'uit', 'doelpunt', 61, 'T. Bos' ),
			array( 'thuis', 'doelpunt', 69, 'R. Verkerk' ),
		)
	);
	neo_ls_td_wedstrijd(
		$klasse4, $club['TAVV'], $club['Woerden'], '2026-10-10 15:00', 'afgelopen', null, array( 0, 0 ),
		array(
			array( 'uit', 'geel', 44, '' ),
			array( 'thuis', 'doelpunt', 71, '' ),
		)
	);
	neo_ls_td_wedstrijd(
		$klasse4, $club['Altior'], $club['AVV Alphen'], '2026-10-10 14:30', 'afgelopen', null, array( 3, 0 ),
		array(
			array( 'thuis', 'doelpunt', 8, '' ),
			array( 'thuis', 'doelpunt', 19, '' ),
			array( 'thuis', 'doelpunt', 33, '' ),
			array( 'thuis', 'doelpunt', 47, '' ),
			array( 'thuis', 'doelpunt', 56, '' ),
			array( 'uit', 'doelpunt', 64, '' ),
			array( 'thuis', 'doelpunt', 70, '' ),
			array( 'thuis', 'doelpunt', 84, '' ),
		)
	);

	// Optioneel: een speelronde van vandaag, zodat je het verversen in de app kunt testen.
	if ( ! empty( $opties['live'] ) ) {
		$nu = time();

		// Bezig in de 67e minuut: aftrap 82 minuten geleden, tweede helft 21 minuten geleden.
		neo_ls_td_wedstrijd(
			$klasse2, $club['Forum Sport'], $club['Wippolder'], wp_date( 'Y-m-d H:i', $nu - 82 * 60 ), 'bezig', null, array( 1, 1 ),
			array(
				array( 'thuis', 'doelpunt', 12, 'S. de Jong' ),
				array( 'uit', 'doelpunt', 34, '' ),
				array( 'uit', 'geel', 58, 'M. Kok' ),
				array( 'uit', 'doelpunt', 61, 'T. Bos' ),
			),
			wp_date( 'Y-m-d H:i:s', $nu - 21 * 60 )
		);
		// In de rust.
		neo_ls_td_wedstrijd(
			$klasse4, $club['TAVV'], $club['Woerden'], wp_date( 'Y-m-d H:i', $nu - 50 * 60 ), 'rust', null, array( 0, 0 ),
			array( array( 'uit', 'geel', 44, '' ) )
		);
		// Begint over een uur.
		neo_ls_td_wedstrijd( $klasse4, $club['Altior'], $club['AVV Alphen'], wp_date( 'Y-m-d H:i', $nu + 60 * 60 ), 'gepland' );
	}

	WP_CLI::success( 'Testdata staat klaar. Bekijk /wp-json/neo/v1/livescore.' );
}

function neo_ls_td_klasse( $seizoen_id, $naam, $korte_naam, $volgorde ) {
	global $wpdb;
	$wpdb->insert(
		neo_ls_tabel( 'klasse' ),
		array(
			'seizoen_id' => $seizoen_id,
			'naam'       => $naam,
			'korte_naam' => $korte_naam,
			'volgorde'   => $volgorde,
		)
	);
	return (int) $wpdb->insert_id;
}

function neo_ls_td_club( $naam, $logos, $klasse_id, $actief = true ) {
	global $wpdb;
	$wpdb->insert(
		neo_ls_tabel( 'club' ),
		array(
			'naam'   => $naam,
			'logo'   => $logos[ strtolower( $naam ) ] ?? '',
			'actief' => $actief ? 1 : 0,
		)
	);
	$id = (int) $wpdb->insert_id;
	$wpdb->insert(
		neo_ls_tabel( 'klasse_club' ),
		array(
			'klasse_id' => $klasse_id,
			'club_id'   => $id,
		)
	);
	return $id;
}

/**
 * Maakt een wedstrijd aan. Doelpunten en kaarten gaan via neo_ls_gebeurtenis_toevoegen,
 * zodat de stand op dezelfde manier wordt bijgehouden als langs het veld.
 * Zonder gebeurtenissen geef je de eindstand mee in $score.
 */
function neo_ls_td_wedstrijd( $klasse_id, $thuis, $uit, $aftrap, $status, $score = null, $rust = null, $gebeurtenissen = array(), $start_tweede_helft = null ) {
	global $wpdb;
	$wpdb->insert(
		neo_ls_tabel( 'wedstrijd' ),
		array(
			'klasse_id'          => $klasse_id,
			'thuisclub_id'       => $thuis,
			'uitclub_id'         => $uit,
			'aftrap'             => $aftrap . ':00',
			'start_tweede_helft' => $start_tweede_helft,
			'status'             => $status,
			'score_thuis'        => $score ? $score[0] : 0,
			'score_uit'          => $score ? $score[1] : 0,
			'rust_thuis'         => $rust ? $rust[0] : null,
			'rust_uit'           => $rust ? $rust[1] : null,
			'bijgewerkt'         => neo_ls_nu(),
		)
	);
	$id = (int) $wpdb->insert_id;

	foreach ( $gebeurtenissen as $g ) {
		$resultaat = neo_ls_gebeurtenis_toevoegen( $id, $g[0], $g[1], $g[2], $g[3] );
		if ( is_wp_error( $resultaat ) ) {
			WP_CLI::error( $resultaat->get_error_message() );
		}
	}
	return $id;
}

/**
 * Zoekt de logo's op in de tabel van Soccer Live Scores, met de clubnaam als sleutel.
 * Daar staat de aftraptijd soms in de naam, zoals "Nieuwkoop (15.00 uur)"; die halen we eraf.
 */
function neo_ls_td_logos_uit_soccer_live_scores() {
	global $wpdb;
	$tabel = $wpdb->prefix . 'daextsolisc_match';
	if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $tabel ) ) !== $tabel ) {
		return array();
	}

	$logos = array();
	foreach ( $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i', $tabel ) ) as $rij ) {
		foreach ( array( 1, 2 ) as $team ) {
			$naam = trim( preg_replace( '/\s*\(.*$/', '', $rij->{"team_{$team}_name"} ) );
			$logo = $rij->{"team_{$team}_logo"};
			if ( $naam && $logo ) {
				$logos[ strtolower( $naam ) ] = $logo;
			}
		}
	}
	return $logos;
}
