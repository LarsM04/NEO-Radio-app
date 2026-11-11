<?php
// De databasetabellen en rechten van de plugin.
// Het datamodel staat in het technisch ontwerp (04-ontwerp/technisch-ontwerp).

defined( 'ABSPATH' ) || exit;

/**
 * Volledige tabelnaam, bijvoorbeeld neo_ls_tabel( 'club' ) geeft "wp_neo_club".
 */
function neo_ls_tabel( $naam ) {
	global $wpdb;
	return $wpdb->prefix . 'neo_' . $naam;
}

/**
 * Draait één keer als de plugin wordt geactiveerd.
 */
function neo_ls_activeren() {
	neo_ls_tabellen_maken();
	neo_ls_rechten_toevoegen();
}

/**
 * Past de tabellen aan als de plugin is bijgewerkt en NEO_LS_DB_VERSIE is verhoogd.
 */
function neo_ls_database_bijwerken() {
	if ( get_option( 'neo_ls_db_versie' ) !== NEO_LS_DB_VERSIE ) {
		neo_ls_tabellen_maken();
	}
}

/**
 * Maakt de tabellen aan, of past ze aan als ze al bestaan.
 * dbDelta is streng over de opmaak: elk veld op een eigen regel en
 * twee spaties na PRIMARY KEY.
 */
function neo_ls_tabellen_maken() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	$charset     = $wpdb->get_charset_collate();
	$seizoen     = neo_ls_tabel( 'seizoen' );
	$klasse      = neo_ls_tabel( 'klasse' );
	$club        = neo_ls_tabel( 'club' );
	$klasse_club = neo_ls_tabel( 'klasse_club' );
	$wedstrijd   = neo_ls_tabel( 'wedstrijd' );
	$gebeurtenis = neo_ls_tabel( 'gebeurtenis' );

	$sql = "CREATE TABLE $seizoen (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  naam varchar(20) NOT NULL,
  actief tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY  (id)
) $charset;
CREATE TABLE $klasse (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  seizoen_id bigint(20) unsigned NOT NULL,
  naam varchar(100) NOT NULL,
  korte_naam varchar(30) NOT NULL,
  volgorde int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY  (id),
  KEY seizoen_id (seizoen_id)
) $charset;
CREATE TABLE $club (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  naam varchar(100) NOT NULL,
  logo varchar(255) NOT NULL DEFAULT '',
  actief tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY  (id)
) $charset;
CREATE TABLE $klasse_club (
  klasse_id bigint(20) unsigned NOT NULL,
  club_id bigint(20) unsigned NOT NULL,
  PRIMARY KEY  (klasse_id,club_id),
  KEY club_id (club_id)
) $charset;
CREATE TABLE $wedstrijd (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  klasse_id bigint(20) unsigned NOT NULL,
  thuisclub_id bigint(20) unsigned NOT NULL,
  uitclub_id bigint(20) unsigned NOT NULL,
  aftrap datetime NOT NULL,
  start_tweede_helft datetime DEFAULT NULL,
  status varchar(20) NOT NULL DEFAULT 'gepland',
  bijgehouden_door bigint(20) unsigned DEFAULT NULL,
  score_thuis smallint(5) unsigned NOT NULL DEFAULT 0,
  score_uit smallint(5) unsigned NOT NULL DEFAULT 0,
  rust_thuis smallint(5) unsigned DEFAULT NULL,
  rust_uit smallint(5) unsigned DEFAULT NULL,
  bijgewerkt datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY klasse_aftrap (klasse_id,aftrap)
) $charset;
CREATE TABLE $gebeurtenis (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  wedstrijd_id bigint(20) unsigned NOT NULL,
  kant varchar(5) NOT NULL,
  type varchar(10) NOT NULL,
  minuut smallint(5) unsigned DEFAULT NULL,
  extra smallint(5) unsigned DEFAULT NULL,
  speler varchar(100) NOT NULL DEFAULT '',
  aangemaakt datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY wedstrijd_id (wedstrijd_id)
) $charset;";

	dbDelta( $sql );
	update_option( 'neo_ls_db_versie', NEO_LS_DB_VERSIE );
}

/**
 * Wie mag wat:
 * - neo_livescore_beheren: seizoenen, klassen, clubs en speelrondes beheren (beheerders)
 * - neo_livescore_invoeren: scores bijhouden langs het veld (beheerders, redacteuren
 *   en de nieuwe rol "Live-score medewerker")
 */
function neo_ls_rechten_toevoegen() {
	$beheerder = get_role( 'administrator' );
	if ( $beheerder ) {
		$beheerder->add_cap( 'neo_livescore_beheren' );
		$beheerder->add_cap( 'neo_livescore_invoeren' );
	}

	$redacteur = get_role( 'editor' );
	if ( $redacteur ) {
		$redacteur->add_cap( 'neo_livescore_invoeren' );
	}

	if ( ! get_role( 'neo_livescore_medewerker' ) ) {
		add_role(
			'neo_livescore_medewerker',
			'Live-score medewerker',
			array(
				'read'                   => true,
				'neo_livescore_invoeren' => true,
			)
		);
	}
}
