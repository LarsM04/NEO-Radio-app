<?php
// De endpoints die de app (en straks de website) gebruiken om live scores te lezen.
// Iedereen mag ze lezen; ze kunnen niets aanpassen.
//
//   GET /wp-json/neo/v1/klassen               klassen van het huidige seizoen
//   GET /wp-json/neo/v1/livescore             huidige speelronde per klasse
//   GET /wp-json/neo/v1/uitslagen?klasse={id} afgelopen wedstrijden van één klasse

defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', 'neo_ls_routes_registreren' );

function neo_ls_routes_registreren() {
	register_rest_route(
		'neo/v1',
		'/klassen',
		array(
			'methods'             => 'GET',
			'callback'            => 'neo_ls_rest_klassen',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'neo/v1',
		'/livescore',
		array(
			'methods'             => 'GET',
			'callback'            => 'neo_ls_rest_livescore',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'neo/v1',
		'/uitslagen',
		array(
			'methods'             => 'GET',
			'callback'            => 'neo_ls_rest_uitslagen',
			'permission_callback' => '__return_true',
			'args'                => array(
				'klasse' => array(
					'required' => true,
					'type'     => 'integer',
					'minimum'  => 1,
				),
			),
		)
	);
}

/**
 * Antwoord dat nooit uit een cache mag komen, anders ziet de app een oude stand.
 */
function neo_ls_antwoord( $data ) {
	$antwoord = rest_ensure_response( $data );
	$antwoord->header( 'Cache-Control', 'no-store, max-age=0' );
	return $antwoord;
}

function neo_ls_rest_klassen() {
	$seizoen = neo_ls_actief_seizoen();
	if ( ! $seizoen ) {
		return neo_ls_antwoord( array() );
	}
	return neo_ls_antwoord( array_map( 'neo_ls_klasse_als_json', neo_ls_klassen( $seizoen->id ) ) );
}

function neo_ls_rest_livescore() {
	$seizoen = neo_ls_actief_seizoen();
	$klassen = array();
	$live    = false;

	if ( $seizoen ) {
		foreach ( neo_ls_klassen( $seizoen->id ) as $klasse ) {
			$datum = neo_ls_rondedatum( $klasse->id );
			if ( ! $datum ) {
				continue; // Nog geen wedstrijden in deze klasse.
			}

			$wedstrijden = neo_ls_wedstrijden_ophalen( $klasse->id, $datum );
			foreach ( $wedstrijden as $wedstrijd ) {
				if ( 'bezig' === $wedstrijd['status'] || 'rust' === $wedstrijd['status'] ) {
					$live = true;
				}
			}

			$klassen[] = neo_ls_klasse_als_json( $klasse ) + array(
				'datum'       => $datum,
				'wedstrijden' => $wedstrijden,
			);
		}
	}

	return neo_ls_antwoord(
		array(
			'seizoen'    => $seizoen ? $seizoen->naam : null,
			// true als er een wedstrijd bezig of in de rust is: dan ververst de app elke 10 seconden.
			'live'       => $live,
			'bijgewerkt' => neo_ls_laatst_bijgewerkt(),
			'klassen'    => $klassen,
		)
	);
}

function neo_ls_rest_uitslagen( WP_REST_Request $verzoek ) {
	$klasse = neo_ls_klasse( $verzoek['klasse'] );
	if ( ! $klasse ) {
		return new WP_Error( 'neo_klasse_onbekend', 'Deze klasse bestaat niet.', array( 'status' => 404 ) );
	}

	// Alleen afgelopen wedstrijden, per speeldag gegroepeerd.
	// Wedstrijden die nog bezig zijn, staan in /livescore.
	$per_dag = array();
	foreach ( neo_ls_wedstrijden_ophalen( $klasse->id ) as $wedstrijd ) {
		if ( 'afgelopen' === $wedstrijd['status'] ) {
			$datum               = substr( $wedstrijd['aftrap'], 0, 10 );
			$per_dag[ $datum ][] = $wedstrijd;
		}
	}
	krsort( $per_dag ); // Nieuwste speelronde bovenaan.

	$speelrondes = array();
	foreach ( $per_dag as $datum => $wedstrijden ) {
		$speelrondes[] = array(
			'datum'       => $datum,
			'wedstrijden' => $wedstrijden,
		);
	}

	return neo_ls_antwoord(
		array(
			'klasse'      => neo_ls_klasse_als_json( $klasse ),
			'speelrondes' => $speelrondes,
		)
	);
}
