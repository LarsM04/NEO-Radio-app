<?php
// Endpoints voor het beheergedeelte in de app: inloggen en scores bijhouden langs het veld.
// Alleen voor WordPress-gebruikers met het recht neo_livescore_invoeren.
//
// Inloggen geeft een token terug. De app stuurt dat mee in de header X-NEO-Token.
//
//   POST   /neo/v1/inloggen                              { gebruikersnaam, wachtwoord }
//   POST   /neo/v1/uitloggen
//   GET    /neo/v1/beheer/wedstrijden?datum=2026-10-10   wedstrijden van één dag (standaard vandaag)
//   GET    /neo/v1/beheer/wedstrijden/{id}
//   POST   /neo/v1/beheer/wedstrijden/{id}/bijhouden     { overnemen? }
//   POST   /neo/v1/beheer/wedstrijden/{id}/status        { status }
//   POST   /neo/v1/beheer/wedstrijden/{id}/gebeurtenissen { kant, type, minuut?, extra?, speler? }
//   PUT    /neo/v1/beheer/gebeurtenissen/{id}            { kant, type, minuut, extra, speler }
//   DELETE /neo/v1/beheer/gebeurtenissen/{id}

defined( 'ABSPATH' ) || exit;

const NEO_LS_TOKEN_DAGEN    = 30;
const NEO_LS_MAX_POGINGEN   = 5;
const NEO_LS_TOKEN_META_KEY = 'neo_ls_tokens';

add_action( 'rest_api_init', 'neo_ls_beheer_routes_registreren' );

// De webversie van de app (PWA) mag onze eigen header meesturen.
add_filter(
	'rest_allowed_cors_headers',
	function ( $headers ) {
		$headers[] = 'X-NEO-Token';
		return $headers;
	}
);

function neo_ls_beheer_routes_registreren() {
	$ns = 'neo/v1';

	register_rest_route(
		$ns,
		'/inloggen',
		array(
			'methods'             => 'POST',
			'callback'            => 'neo_ls_rest_inloggen',
			'permission_callback' => '__return_true',
			'args'                => array(
				'gebruikersnaam' => array(
					'required' => true,
					'type'     => 'string',
				),
				'wachtwoord'     => array(
					'required' => true,
					'type'     => 'string',
				),
			),
		)
	);

	register_rest_route(
		$ns,
		'/uitloggen',
		array(
			'methods'             => 'POST',
			'callback'            => 'neo_ls_rest_uitloggen',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
		)
	);

	register_rest_route(
		$ns,
		'/beheer/wedstrijden',
		array(
			'methods'             => 'GET',
			'callback'            => 'neo_ls_rest_beheer_wedstrijden',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
			'args'                => array(
				'datum' => array(
					'type'    => 'string',
					'pattern' => '^\d{4}-\d{2}-\d{2}$',
				),
			),
		)
	);

	register_rest_route(
		$ns,
		'/beheer/wedstrijden/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'neo_ls_rest_beheer_wedstrijd',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
		)
	);

	register_rest_route(
		$ns,
		'/beheer/wedstrijden/(?P<id>\d+)/bijhouden',
		array(
			'methods'             => 'POST',
			'callback'            => 'neo_ls_rest_bijhouden',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
		)
	);

	register_rest_route(
		$ns,
		'/beheer/wedstrijden/(?P<id>\d+)/status',
		array(
			'methods'             => 'POST',
			'callback'            => 'neo_ls_rest_status',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
			'args'                => array(
				'status' => array(
					'required' => true,
					'type'     => 'string',
					'enum'     => NEO_LS_STATUSSEN,
				),
			),
		)
	);

	$gebeurtenis_args = array(
		'kant'   => array(
			'required' => true,
			'type'     => 'string',
			'enum'     => NEO_LS_KANTEN,
		),
		'type'   => array(
			'required' => true,
			'type'     => 'string',
			'enum'     => NEO_LS_TYPES,
		),
		'minuut' => array(
			'type'    => array( 'integer', 'null' ),
			'minimum' => 1,
			'maximum' => 130,
		),
		// Blessuretijd: bij minuut 45 of 90 het aantal minuten erbij (45+2 = minuut 45, extra 2).
		'extra'  => array(
			'type'    => array( 'integer', 'null' ),
			'minimum' => 1,
			'maximum' => 30,
		),
		'speler' => array(
			'type'      => 'string',
			'maxLength' => 100,
		),
	);

	register_rest_route(
		$ns,
		'/beheer/wedstrijden/(?P<id>\d+)/gebeurtenissen',
		array(
			'methods'             => 'POST',
			'callback'            => 'neo_ls_rest_gebeurtenis_toevoegen',
			'permission_callback' => 'neo_ls_rest_is_medewerker',
			'args'                => $gebeurtenis_args,
		)
	);

	register_rest_route(
		$ns,
		'/beheer/gebeurtenissen/(?P<id>\d+)',
		array(
			array(
				'methods'             => 'PUT',
				'callback'            => 'neo_ls_rest_gebeurtenis_aanpassen',
				'permission_callback' => 'neo_ls_rest_is_medewerker',
				'args'                => $gebeurtenis_args,
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => 'neo_ls_rest_gebeurtenis_verwijderen',
				'permission_callback' => 'neo_ls_rest_is_medewerker',
			),
		)
	);
}

/* ------------------------------------------------------------------
 * Inloggen met een token
 * Een token ziet eruit als "12.abc…" (gebruikers-id, punt, 40 willekeurige tekens).
 * In de database staat alleen een hash, net als bij wachtwoorden.
 * ------------------------------------------------------------------ */

function neo_ls_rest_inloggen( WP_REST_Request $verzoek ) {
	$naam     = trim( (string) $verzoek['gebruikersnaam'] );
	$sleutel  = 'neo_ls_pogingen_' . md5( strtolower( $naam ) );
	$pogingen = (int) get_transient( $sleutel );

	// Na 5 foute pogingen een kwartier wachten, tegen het raden van wachtwoorden.
	if ( $pogingen >= NEO_LS_MAX_POGINGEN ) {
		return new WP_Error( 'neo_te_vaak', 'Te vaak een verkeerd wachtwoord. Probeer het over een kwartier opnieuw.', array( 'status' => 429 ) );
	}

	$gebruiker = wp_authenticate( $naam, (string) $verzoek['wachtwoord'] );
	if ( is_wp_error( $gebruiker ) ) {
		set_transient( $sleutel, $pogingen + 1, 15 * MINUTE_IN_SECONDS );
		return new WP_Error( 'neo_inloggen_mislukt', 'Gebruikersnaam of wachtwoord klopt niet.', array( 'status' => 401 ) );
	}
	delete_transient( $sleutel );

	if ( ! user_can( $gebruiker, 'neo_livescore_invoeren' ) ) {
		return new WP_Error( 'neo_geen_recht', 'Je account mag geen live scores invoeren. Vraag een beheerder om de rol Live-score medewerker.', array( 'status' => 403 ) );
	}

	$geheim = wp_generate_password( 40, false, false );
	$tokens = neo_ls_geldige_tokens( $gebruiker->ID );
	$tokens[] = array(
		'hash' => hash( 'sha256', $geheim ),
		'tot'  => time() + NEO_LS_TOKEN_DAGEN * DAY_IN_SECONDS,
	);
	// Maximaal 10 apparaten tegelijk ingelogd; de oudste vervalt.
	update_user_meta( $gebruiker->ID, NEO_LS_TOKEN_META_KEY, array_slice( $tokens, -10 ) );

	return neo_ls_antwoord(
		array(
			'token'     => $gebruiker->ID . '.' . $geheim,
			'gebruiker' => neo_ls_gebruiker_als_json( $gebruiker ),
		)
	);
}

function neo_ls_rest_uitloggen( WP_REST_Request $verzoek ) {
	$delen = explode( '.', (string) $verzoek->get_header( 'X-NEO-Token' ), 2 );
	$hash  = hash( 'sha256', $delen[1] ?? '' );
	$over  = array_filter( neo_ls_geldige_tokens( get_current_user_id() ), fn( $t ) => ! hash_equals( $t['hash'], $hash ) );
	update_user_meta( get_current_user_id(), NEO_LS_TOKEN_META_KEY, array_values( $over ) );
	return neo_ls_antwoord( array( 'uitgelogd' => true ) );
}

/**
 * Tokens van een gebruiker die nog niet verlopen zijn.
 */
function neo_ls_geldige_tokens( $gebruiker_id ) {
	$tokens = get_user_meta( $gebruiker_id, NEO_LS_TOKEN_META_KEY, true );
	return array_values( array_filter( is_array( $tokens ) ? $tokens : array(), fn( $t ) => $t['tot'] > time() ) );
}

/**
 * De gebruiker bij het token in de header, of null.
 */
function neo_ls_gebruiker_uit_token( WP_REST_Request $verzoek ) {
	$token = (string) $verzoek->get_header( 'X-NEO-Token' );
	if ( ! preg_match( '/^(\d+)\.([A-Za-z0-9]{40})$/', $token, $delen ) ) {
		return null;
	}
	$hash = hash( 'sha256', $delen[2] );
	foreach ( neo_ls_geldige_tokens( (int) $delen[1] ) as $opgeslagen ) {
		if ( hash_equals( $opgeslagen['hash'], $hash ) ) {
			return get_userdata( (int) $delen[1] );
		}
	}
	return null;
}

/**
 * Toegangscontrole voor alle beheer-endpoints.
 */
function neo_ls_rest_is_medewerker( WP_REST_Request $verzoek ) {
	$gebruiker = neo_ls_gebruiker_uit_token( $verzoek );
	if ( ! $gebruiker ) {
		return new WP_Error( 'neo_niet_ingelogd', 'Je bent niet (meer) ingelogd. Log opnieuw in.', array( 'status' => 401 ) );
	}
	if ( ! user_can( $gebruiker, 'neo_livescore_invoeren' ) ) {
		return new WP_Error( 'neo_geen_recht', 'Je account mag geen live scores invoeren.', array( 'status' => 403 ) );
	}
	wp_set_current_user( $gebruiker->ID );
	return true;
}

function neo_ls_gebruiker_als_json( $gebruiker ) {
	return array(
		'id'      => (int) $gebruiker->ID,
		'naam'    => $gebruiker->display_name,
		'beheren' => user_can( $gebruiker, 'neo_livescore_beheren' ),
	);
}

/* ------------------------------------------------------------------
 * Wedstrijden bekijken en bijhouden
 * ------------------------------------------------------------------ */

/**
 * Een wedstrijd voor het beheer: het gewone JSON-formaat plus wie hem bijhoudt
 * en de tijden die de app nodig heeft om de minuut voor te stellen.
 */
function neo_ls_beheer_json( $wedstrijd_id ) {
	$json = neo_ls_wedstrijd_json( $wedstrijd_id );
	if ( ! $json ) {
		return null;
	}
	$ruw    = neo_ls_wedstrijd( $wedstrijd_id );
	$klasse = neo_ls_klasse( $ruw->klasse_id );
	$door   = $ruw->bijgehouden_door ? get_userdata( $ruw->bijgehouden_door ) : null;

	return $json + array(
		'klasse'             => $klasse ? neo_ls_klasse_als_json( $klasse ) : null,
		'start_tweede_helft' => neo_ls_iso( $ruw->start_tweede_helft ),
		'bijgehouden_door'   => $door ? array(
			'id'   => (int) $door->ID,
			'naam' => $door->display_name,
		) : null,
		'door_mij'           => (int) $ruw->bijgehouden_door === get_current_user_id(),
		// Namen die eerder bij deze clubs zijn ingevuld, zodat je ze met één tik kiest.
		'spelers'            => array(
			'thuis' => neo_ls_bekende_spelers( (int) $ruw->thuisclub_id ),
			'uit'   => neo_ls_bekende_spelers( (int) $ruw->uitclub_id ),
		),
	);
}

/**
 * Spelersnamen die eerder bij een club zijn ingevuld (bij doelpunten en kaarten),
 * de laatst gebruikte eerst. Zo hoeft langs het veld niemand namen opnieuw te typen.
 */
function neo_ls_bekende_spelers( $club_id, $maximaal = 30 ) {
	global $wpdb;
	return $wpdb->get_col(
		$wpdb->prepare(
			"SELECT g.speler
			FROM %i g
			JOIN %i w ON w.id = g.wedstrijd_id
			WHERE g.speler <> ''
				AND ( ( g.kant = 'thuis' AND w.thuisclub_id = %d ) OR ( g.kant = 'uit' AND w.uitclub_id = %d ) )
			GROUP BY g.speler
			ORDER BY MAX(g.aangemaakt) DESC, g.speler
			LIMIT %d",
			neo_ls_tabel( 'gebeurtenis' ),
			neo_ls_tabel( 'wedstrijd' ),
			$club_id,
			$club_id,
			$maximaal
		)
	);
}

function neo_ls_rest_beheer_wedstrijden( WP_REST_Request $verzoek ) {
	global $wpdb;
	$datum   = $verzoek['datum'] ? $verzoek['datum'] : wp_date( 'Y-m-d' );
	$seizoen = neo_ls_actief_seizoen();
	$klassen = array();

	foreach ( $seizoen ? neo_ls_klassen( $seizoen->id ) : array() as $klasse ) {
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				'SELECT id FROM %i WHERE klasse_id = %d AND DATE(aftrap) = %s ORDER BY aftrap, id',
				neo_ls_tabel( 'wedstrijd' ),
				$klasse->id,
				$datum
			)
		);
		if ( $ids ) {
			$klassen[] = neo_ls_klasse_als_json( $klasse ) + array(
				'wedstrijden' => array_map( 'neo_ls_beheer_json', $ids ),
			);
		}
	}

	return neo_ls_antwoord(
		array(
			'datum'     => $datum,
			'gebruiker' => neo_ls_gebruiker_als_json( wp_get_current_user() ),
			'klassen'   => $klassen,
		)
	);
}

function neo_ls_rest_beheer_wedstrijd( WP_REST_Request $verzoek ) {
	$json = neo_ls_beheer_json( (int) $verzoek['id'] );
	return $json ? neo_ls_antwoord( $json ) : neo_ls_rest_onbekend();
}

/**
 * Een wedstrijd gaan bijhouden. Een wedstrijd die iemand anders al bijhoudt,
 * kan alleen een beheerder overnemen (met overnemen = true).
 */
function neo_ls_rest_bijhouden( WP_REST_Request $verzoek ) {
	global $wpdb;
	$wedstrijd = neo_ls_wedstrijd( (int) $verzoek['id'] );
	if ( ! $wedstrijd ) {
		return neo_ls_rest_onbekend();
	}

	$ik   = get_current_user_id();
	$door = (int) $wedstrijd->bijgehouden_door;
	if ( $door && $door !== $ik ) {
		$naam = get_userdata( $door ) ? get_userdata( $door )->display_name : 'Iemand anders';
		if ( ! $verzoek['overnemen'] || ! current_user_can( 'neo_livescore_beheren' ) ) {
			return new WP_Error( 'neo_al_bezet', "$naam houdt deze wedstrijd al bij.", array( 'status' => 409 ) );
		}
	}

	$wpdb->update( neo_ls_tabel( 'wedstrijd' ), array( 'bijgehouden_door' => $ik ), array( 'id' => $wedstrijd->id ) );
	return neo_ls_antwoord( neo_ls_beheer_json( $wedstrijd->id ) );
}

/**
 * Mag de huidige gebruiker deze wedstrijd aanpassen? Een vrije wedstrijd wordt
 * meteen van jou; een wedstrijd van iemand anders niet.
 */
function neo_ls_mag_aanpassen( $wedstrijd ) {
	global $wpdb;
	$ik   = get_current_user_id();
	$door = (int) $wedstrijd->bijgehouden_door;

	if ( ! $door ) {
		$wpdb->update( neo_ls_tabel( 'wedstrijd' ), array( 'bijgehouden_door' => $ik ), array( 'id' => $wedstrijd->id ) );
		return true;
	}
	if ( $door !== $ik ) {
		$naam = get_userdata( $door ) ? get_userdata( $door )->display_name : 'Iemand anders';
		return new WP_Error( 'neo_al_bezet', "$naam houdt deze wedstrijd bij. Neem hem eerst over.", array( 'status' => 409 ) );
	}
	return true;
}

function neo_ls_rest_status( WP_REST_Request $verzoek ) {
	$wedstrijd = neo_ls_wedstrijd( (int) $verzoek['id'] );
	if ( ! $wedstrijd ) {
		return neo_ls_rest_onbekend();
	}
	$mag = neo_ls_mag_aanpassen( $wedstrijd );
	if ( is_wp_error( $mag ) ) {
		return $mag;
	}

	$resultaat = neo_ls_status_zetten( $wedstrijd->id, $verzoek['status'] );
	if ( is_wp_error( $resultaat ) ) {
		return neo_ls_rest_fout( $resultaat );
	}
	return neo_ls_antwoord( neo_ls_beheer_json( $wedstrijd->id ) );
}

function neo_ls_rest_gebeurtenis_toevoegen( WP_REST_Request $verzoek ) {
	$wedstrijd = neo_ls_wedstrijd( (int) $verzoek['id'] );
	if ( ! $wedstrijd ) {
		return neo_ls_rest_onbekend();
	}
	$mag = neo_ls_mag_aanpassen( $wedstrijd );
	if ( is_wp_error( $mag ) ) {
		return $mag;
	}

	// Een doelpunt of kaart terwijl de wedstrijd nog op Gepland staat? Dan is hij dus
	// begonnen en is alleen vergeten de status te zetten. Eerst op Bezig zetten, anders
	// toont de app nog geen stand en is er geen minuut.
	if ( 'gepland' === $wedstrijd->status ) {
		neo_ls_status_zetten( $wedstrijd->id, 'bezig' );
		$wedstrijd = neo_ls_wedstrijd( $wedstrijd->id );
	}

	// Geen minuut meegegeven? Dan de minuut waarin de wedstrijd nu is (ook in blessuretijd).
	if ( $verzoek->has_param( 'minuut' ) ) {
		$minuut = $verzoek['minuut'];
		$extra  = $verzoek['extra'];
	} else {
		$nu     = neo_ls_huidige_minuut( $wedstrijd );
		$minuut = $nu['minuut'] ?? null;
		$extra  = $nu['extra'] ?? null;
	}

	$id = neo_ls_gebeurtenis_toevoegen( $wedstrijd->id, $verzoek['kant'], $verzoek['type'], $minuut, (string) $verzoek['speler'], $extra );
	if ( is_wp_error( $id ) ) {
		return neo_ls_rest_fout( $id );
	}
	return neo_ls_antwoord(
		array(
			'gebeurtenis_id' => $id,
			'wedstrijd'      => neo_ls_beheer_json( $wedstrijd->id ),
		)
	);
}

function neo_ls_rest_gebeurtenis_aanpassen( WP_REST_Request $verzoek ) {
	$wedstrijd = neo_ls_wedstrijd_van_gebeurtenis( (int) $verzoek['id'] );
	if ( ! $wedstrijd ) {
		return neo_ls_rest_onbekend( 'Deze gebeurtenis bestaat niet (meer).' );
	}
	$mag = neo_ls_mag_aanpassen( $wedstrijd );
	if ( is_wp_error( $mag ) ) {
		return $mag;
	}

	$resultaat = neo_ls_gebeurtenis_aanpassen( (int) $verzoek['id'], $verzoek['kant'], $verzoek['type'], $verzoek['minuut'], (string) $verzoek['speler'], $verzoek['extra'] );
	if ( is_wp_error( $resultaat ) ) {
		return neo_ls_rest_fout( $resultaat );
	}
	return neo_ls_antwoord( neo_ls_beheer_json( $wedstrijd->id ) );
}

function neo_ls_rest_gebeurtenis_verwijderen( WP_REST_Request $verzoek ) {
	$wedstrijd = neo_ls_wedstrijd_van_gebeurtenis( (int) $verzoek['id'] );
	if ( ! $wedstrijd ) {
		return neo_ls_rest_onbekend( 'Deze gebeurtenis bestaat niet (meer).' );
	}
	$mag = neo_ls_mag_aanpassen( $wedstrijd );
	if ( is_wp_error( $mag ) ) {
		return $mag;
	}

	neo_ls_gebeurtenis_verwijderen( (int) $verzoek['id'] );
	return neo_ls_antwoord( neo_ls_beheer_json( $wedstrijd->id ) );
}

function neo_ls_wedstrijd_van_gebeurtenis( $gebeurtenis_id ) {
	global $wpdb;
	$wedstrijd_id = $wpdb->get_var(
		$wpdb->prepare( 'SELECT wedstrijd_id FROM %i WHERE id = %d', neo_ls_tabel( 'gebeurtenis' ), $gebeurtenis_id )
	);
	return $wedstrijd_id ? neo_ls_wedstrijd( $wedstrijd_id ) : null;
}

function neo_ls_rest_onbekend( $tekst = 'Deze wedstrijd bestaat niet (meer).' ) {
	return new WP_Error( 'neo_onbekend', $tekst, array( 'status' => 404 ) );
}

/**
 * Een fout uit wedstrijden.php als REST-fout met status 400.
 */
function neo_ls_rest_fout( WP_Error $fout ) {
	return new WP_Error( $fout->get_error_code(), $fout->get_error_message(), array( 'status' => 400 ) );
}
