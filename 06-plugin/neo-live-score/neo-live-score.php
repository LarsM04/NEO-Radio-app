<?php
/**
 * Plugin Name:       NEO Live Score
 * Description:       Live scores van het amateurvoetbal invoeren en tonen op de website en in de NEO Radio-app. Vervangt Soccer Live Scores.
 * Version:           0.1.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            Lars Mudde, Sultan Avdi, Duzyano Ramkhelawan
 * Text Domain:       neo-live-score
 */

defined( 'ABSPATH' ) || exit;

define( 'NEO_LS_VERSIE', '0.1.0' );
define( 'NEO_LS_DB_VERSIE', '3' );
define( 'NEO_LS_BESTAND', __FILE__ );
define( 'NEO_LS_PAD', plugin_dir_path( __FILE__ ) );

require_once NEO_LS_PAD . 'includes/database.php';
require_once NEO_LS_PAD . 'includes/wedstrijden.php';
require_once NEO_LS_PAD . 'includes/rest-api.php';
require_once NEO_LS_PAD . 'includes/rest-beheer.php';
require_once NEO_LS_PAD . 'includes/soccer-live-scores.php';
require_once NEO_LS_PAD . 'includes/shortcode.php';

// De schermen in het WordPress-beheer.
if ( is_admin() ) {
	require_once NEO_LS_PAD . 'includes/admin/algemeen.php';
	require_once NEO_LS_PAD . 'includes/admin/wedstrijden.php';
	require_once NEO_LS_PAD . 'includes/admin/speelronde.php';
	require_once NEO_LS_PAD . 'includes/admin/clubs.php';
	require_once NEO_LS_PAD . 'includes/admin/seizoenen.php';
}

// Het WP-CLI-commando voor testdata laden we alleen als WP-CLI draait.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once NEO_LS_PAD . 'includes/testdata.php';
}

register_activation_hook( __FILE__, 'neo_ls_activeren' );
add_action( 'plugins_loaded', 'neo_ls_database_bijwerken' );
