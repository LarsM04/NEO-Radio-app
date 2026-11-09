<?php
// Wedstrijden en gebeurtenissen ophalen en aanpassen.
// De REST API, de invoerpagina en (later) de shortcode gebruiken allemaal deze functies,
// zodat de website en de app precies dezelfde gegevens tonen.

defined( 'ABSPATH' ) || exit;

const NEO_LS_STATUSSEN = array( 'gepland', 'bezig', 'rust', 'afgelopen' );
const NEO_LS_TYPES     = array( 'doelpunt', 'geel', 'rood' );
const NEO_LS_KANTEN    = array( 'thuis', 'uit' );

/* ------------------------------------------------------------------
 * Tijd
 * Alle tijden staan in de database in de tijdzone van de website
 * (Europe/Amsterdam), zoals WordPress zelf ook doet.
 * ------------------------------------------------------------------ */

/**
 * Huidige tijd voor de database, bijvoorbeeld "2026-10-10 15:45:00".
 */
function neo_ls_nu() {
	return current_time( 'mysql' );
}

/**
 * Een tijd uit de database als Unix-tijdstempel.
 */
function neo_ls_tijdstempel( $datumtijd ) {
	return ( new DateTimeImmutable( $datumtijd, wp_timezone() ) )->getTimestamp();
}

/**
 * Een tijd uit de database in ISO 8601, bijvoorbeeld "2026-10-10T14:30:00+02:00".
 * Dat formaat kan JavaScript direct lezen met new Date(...).
 */
function neo_ls_iso( $datumtijd ) {
	if ( ! $datumtijd ) {
		return null;
	}
	return ( new DateTimeImmutable( $datumtijd, wp_timezone() ) )->format( DATE_ATOM );
}

/**
 * De minuut waarin een wedstrijd nu is. Eerste helft: vanaf de aftrap (maximaal 45).
 * Tweede helft: 45 plus de tijd sinds start_tweede_helft (maximaal 90).
 * Geeft null als de wedstrijd niet bezig is.
 */
function neo_ls_huidige_minuut( $wedstrijd ) {
	if ( 'bezig' !== $wedstrijd->status ) {
		return null;
	}

	if ( $wedstrijd->start_tweede_helft ) {
		$seconden = time() - neo_ls_tijdstempel( $wedstrijd->start_tweede_helft );
		return min( 90, 46 + intdiv( max( 0, $seconden ), 60 ) );
	}

	$seconden = time() - neo_ls_tijdstempel( $wedstrijd->aftrap );
	return min( 45, 1 + intdiv( max( 0, $seconden ), 60 ) );
}

/* ------------------------------------------------------------------
 * Ophalen
 * ------------------------------------------------------------------ */

/**
 * Het seizoen dat nu actief is, of null.
 */
function neo_ls_actief_seizoen() {
	global $wpdb;
	return $wpdb->get_row(
		$wpdb->prepare( 'SELECT * FROM %i WHERE actief = 1 ORDER BY id DESC LIMIT 1', neo_ls_tabel( 'seizoen' ) )
	);
}

/**
 * De klassen van een seizoen, in de volgorde die in het beheer is ingesteld.
 */
function neo_ls_klassen( $seizoen_id ) {
	global $wpdb;
	return $wpdb->get_results(
		$wpdb->prepare(
			'SELECT * FROM %i WHERE seizoen_id = %d ORDER BY volgorde, naam',
			neo_ls_tabel( 'klasse' ),
			$seizoen_id
		)
	);
}

/**
 * Eén klasse, of null.
 */
function neo_ls_klasse( $klasse_id ) {
	global $wpdb;
	return $wpdb->get_row(
		$wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', neo_ls_tabel( 'klasse' ), $klasse_id )
	);
}

/**
 * Eén wedstrijd (de ruwe rij uit de database), of null.
 */
function neo_ls_wedstrijd( $wedstrijd_id ) {
	global $wpdb;
	return $wpdb->get_row(
		$wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', neo_ls_tabel( 'wedstrijd' ), $wedstrijd_id )
	);
}

/**
 * De datum van de huidige speelronde van een klasse: de laatste speeldag tot en met
 * vandaag. Is er in deze klasse nog niets gespeeld, dan de eerstvolgende speeldag.
 * Geeft null als de klasse nog geen wedstrijden heeft.
 */
function neo_ls_rondedatum( $klasse_id ) {
	global $wpdb;
	$tabel   = neo_ls_tabel( 'wedstrijd' );
	$vandaag = wp_date( 'Y-m-d' );

	$datum = $wpdb->get_var(
		$wpdb->prepare(
			'SELECT MAX(DATE(aftrap)) FROM %i WHERE klasse_id = %d AND DATE(aftrap) <= %s',
			$tabel,
			$klasse_id,
			$vandaag
		)
	);

	if ( ! $datum ) {
		$datum = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT MIN(DATE(aftrap)) FROM %i WHERE klasse_id = %d AND DATE(aftrap) > %s',
				$tabel,
				$klasse_id,
				$vandaag
			)
		);
	}

	return $datum ? $datum : null;
}

/**
 * Alle wedstrijden van een klasse, met clubs en gebeurtenissen, klaar voor JSON.
 * Met $datum ("2026-10-10") alleen de wedstrijden van die dag.
 */
function neo_ls_wedstrijden_ophalen( $klasse_id, $datum = null ) {
	global $wpdb;

	$sql  = 'SELECT w.*, t.naam AS thuis_naam, t.logo AS thuis_logo, u.naam AS uit_naam, u.logo AS uit_logo
		FROM %i w
		JOIN %i t ON t.id = w.thuisclub_id
		JOIN %i u ON u.id = w.uitclub_id
		WHERE w.klasse_id = %d';
	$args = array( neo_ls_tabel( 'wedstrijd' ), neo_ls_tabel( 'club' ), neo_ls_tabel( 'club' ), $klasse_id );

	if ( $datum ) {
		$sql   .= ' AND DATE(w.aftrap) = %s';
		$args[] = $datum;
	}
	$sql .= ' ORDER BY w.aftrap, w.id';

	$wedstrijden = $wpdb->get_results( $wpdb->prepare( $sql, $args ) );

	// Alle gebeurtenissen in één query ophalen en per wedstrijd verdelen.
	$per_wedstrijd = array();
	$ids           = wp_list_pluck( $wedstrijden, 'id' );
	if ( $ids ) {
		$plekken = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		$rijen   = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM %i WHERE wedstrijd_id IN ($plekken) ORDER BY minuut IS NULL, minuut, id",
				array_merge( array( neo_ls_tabel( 'gebeurtenis' ) ), $ids )
			)
		);
		foreach ( $rijen as $rij ) {
			$per_wedstrijd[ $rij->wedstrijd_id ][] = $rij;
		}
	}

	$resultaat = array();
	foreach ( $wedstrijden as $wedstrijd ) {
		$resultaat[] = neo_ls_wedstrijd_als_json( $wedstrijd, $per_wedstrijd[ $wedstrijd->id ] ?? array() );
	}
	return $resultaat;
}

/**
 * Het tijdstip waarop voor het laatst iets aan een wedstrijd is veranderd.
 */
function neo_ls_laatst_bijgewerkt() {
	global $wpdb;
	return neo_ls_iso(
		$wpdb->get_var( $wpdb->prepare( 'SELECT MAX(bijgewerkt) FROM %i', neo_ls_tabel( 'wedstrijd' ) ) )
	);
}

/* ------------------------------------------------------------------
 * JSON-formaat
 * Zie 06-plugin/README.md voor een voorbeeld van wat de app krijgt.
 * ------------------------------------------------------------------ */

function neo_ls_klasse_als_json( $klasse ) {
	return array(
		'id'         => (int) $klasse->id,
		'naam'       => $klasse->naam,
		'korte_naam' => $klasse->korte_naam,
	);
}

function neo_ls_wedstrijd_als_json( $wedstrijd, $gebeurtenissen ) {
	$gestart = 'gepland' !== $wedstrijd->status;

	return array(
		'id'             => (int) $wedstrijd->id,
		'aftrap'         => neo_ls_iso( $wedstrijd->aftrap ),
		'status'         => $wedstrijd->status,
		'minuut'         => neo_ls_huidige_minuut( $wedstrijd ),
		'thuis'          => array(
			'id'   => (int) $wedstrijd->thuisclub_id,
			'naam' => $wedstrijd->thuis_naam,
			'logo' => $wedstrijd->thuis_logo ? $wedstrijd->thuis_logo : null,
		),
		'uit'            => array(
			'id'   => (int) $wedstrijd->uitclub_id,
			'naam' => $wedstrijd->uit_naam,
			'logo' => $wedstrijd->uit_logo ? $wedstrijd->uit_logo : null,
		),
		'score'          => $gestart
			? array(
				'thuis' => (int) $wedstrijd->score_thuis,
				'uit'   => (int) $wedstrijd->score_uit,
			)
			: null,
		'rust'           => null === $wedstrijd->rust_thuis
			? null
			: array(
				'thuis' => (int) $wedstrijd->rust_thuis,
				'uit'   => (int) $wedstrijd->rust_uit,
			),
		'gebeurtenissen' => array_map( 'neo_ls_gebeurtenis_als_json', $gebeurtenissen ),
	);
}

function neo_ls_gebeurtenis_als_json( $gebeurtenis ) {
	return array(
		'id'     => (int) $gebeurtenis->id,
		'kant'   => $gebeurtenis->kant,
		'type'   => $gebeurtenis->type,
		'minuut' => null === $gebeurtenis->minuut ? null : (int) $gebeurtenis->minuut,
		'speler' => '' !== $gebeurtenis->speler ? $gebeurtenis->speler : null,
	);
}

/* ------------------------------------------------------------------
 * Aanpassen
 * Deze functies controleren alleen de gegevens zelf. Wie het mag doen,
 * controleert de pagina of het endpoint dat ze aanroept.
 * ------------------------------------------------------------------ */

/**
 * Voegt een doelpunt of kaart toe. Bij een doelpunt gaat de stand vanzelf omhoog.
 * Geeft het id van de nieuwe gebeurtenis, of een WP_Error.
 */
function neo_ls_gebeurtenis_toevoegen( $wedstrijd_id, $kant, $type, $minuut = null, $speler = '' ) {
	global $wpdb;

	if ( ! neo_ls_wedstrijd( $wedstrijd_id ) ) {
		return new WP_Error( 'neo_wedstrijd_onbekend', 'Deze wedstrijd bestaat niet.' );
	}
	if ( ! in_array( $kant, NEO_LS_KANTEN, true ) || ! in_array( $type, NEO_LS_TYPES, true ) ) {
		return new WP_Error( 'neo_ongeldig', 'Kies thuis of uit, en doelpunt, gele of rode kaart.' );
	}
	if ( null !== $minuut && ( $minuut < 1 || $minuut > 130 ) ) {
		return new WP_Error( 'neo_ongeldig', 'De minuut moet tussen 1 en 130 liggen.' );
	}

	$gelukt = $wpdb->insert(
		neo_ls_tabel( 'gebeurtenis' ),
		array(
			'wedstrijd_id' => $wedstrijd_id,
			'kant'         => $kant,
			'type'         => $type,
			'minuut'       => $minuut,
			'speler'       => sanitize_text_field( $speler ),
			'aangemaakt'   => neo_ls_nu(),
		)
	);
	if ( ! $gelukt ) {
		// Niet opgeslagen, dan ook de stand niet aanpassen.
		return new WP_Error( 'neo_opslaan_mislukt', 'De gebeurtenis kon niet worden opgeslagen.' );
	}
	$id = (int) $wpdb->insert_id;

	if ( 'doelpunt' === $type ) {
		neo_ls_score_aanpassen( $wedstrijd_id, $kant, 1 );
	} else {
		neo_ls_wedstrijd_aangeraakt( $wedstrijd_id );
	}

	return $id;
}

/**
 * Verwijdert een gebeurtenis. Was het een doelpunt, dan gaat de stand weer omlaag.
 */
function neo_ls_gebeurtenis_verwijderen( $gebeurtenis_id ) {
	global $wpdb;
	$tabel       = neo_ls_tabel( 'gebeurtenis' );
	$gebeurtenis = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', $tabel, $gebeurtenis_id ) );

	if ( ! $gebeurtenis ) {
		return new WP_Error( 'neo_gebeurtenis_onbekend', 'Deze gebeurtenis bestaat niet.' );
	}

	$wpdb->delete( $tabel, array( 'id' => $gebeurtenis_id ) );

	if ( 'doelpunt' === $gebeurtenis->type ) {
		neo_ls_score_aanpassen( $gebeurtenis->wedstrijd_id, $gebeurtenis->kant, -1 );
	} else {
		neo_ls_wedstrijd_aangeraakt( $gebeurtenis->wedstrijd_id );
	}
	return true;
}

/**
 * Zet de status van een wedstrijd.
 * - Naar rust: de huidige stand wordt de ruststand.
 * - Van rust naar bezig: de tweede helft begint nu (voor de meelopende minuut).
 */
function neo_ls_status_zetten( $wedstrijd_id, $status ) {
	global $wpdb;
	$wedstrijd = neo_ls_wedstrijd( $wedstrijd_id );

	if ( ! $wedstrijd ) {
		return new WP_Error( 'neo_wedstrijd_onbekend', 'Deze wedstrijd bestaat niet.' );
	}
	if ( ! in_array( $status, NEO_LS_STATUSSEN, true ) ) {
		return new WP_Error( 'neo_ongeldig', 'Onbekende status.' );
	}

	$velden = array(
		'status'     => $status,
		'bijgewerkt' => neo_ls_nu(),
	);
	if ( 'rust' === $status ) {
		$velden['rust_thuis'] = $wedstrijd->score_thuis;
		$velden['rust_uit']   = $wedstrijd->score_uit;
	}
	if ( 'rust' === $wedstrijd->status && 'bezig' === $status ) {
		$velden['start_tweede_helft'] = neo_ls_nu();
	}

	$wpdb->update( neo_ls_tabel( 'wedstrijd' ), $velden, array( 'id' => $wedstrijd_id ) );
	return true;
}

/**
 * Telt $verschil (+1 of -1) op bij de score van één kant. Nooit lager dan 0.
 */
function neo_ls_score_aanpassen( $wedstrijd_id, $kant, $verschil ) {
	global $wpdb;
	$kolom = 'thuis' === $kant ? 'score_thuis' : 'score_uit';

	$wpdb->query(
		$wpdb->prepare(
			'UPDATE %i SET %i = GREATEST(0, CAST(%i AS SIGNED) + %d), bijgewerkt = %s WHERE id = %d',
			neo_ls_tabel( 'wedstrijd' ),
			$kolom,
			$kolom,
			$verschil,
			neo_ls_nu(),
			$wedstrijd_id
		)
	);
}

/**
 * Zet "bijgewerkt" op nu, zodat de app ziet dat er iets is veranderd.
 */
function neo_ls_wedstrijd_aangeraakt( $wedstrijd_id ) {
	global $wpdb;
	$wpdb->update( neo_ls_tabel( 'wedstrijd' ), array( 'bijgewerkt' => neo_ls_nu() ), array( 'id' => $wedstrijd_id ) );
}
