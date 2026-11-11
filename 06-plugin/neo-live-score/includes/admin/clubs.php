<?php
// Scherm "Clubs": een club voer je één keer in, met naam en logo.
// Daarna kies je hem bij elke speelronde uit de lijst.

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_neo_ls_club_opslaan', 'neo_ls_club_opslaan' );
add_action( 'admin_post_neo_ls_club_actief', 'neo_ls_club_actief_zetten' );
add_action( 'admin_post_neo_ls_sls_overzetten', 'neo_ls_sls_overzetten_formulier' );

/**
 * Staan er in Soccer Live Scores nog clubs of logo's die wij niet hebben, dan komt er een knop
 * om ze over te zetten. Als alles over is, verdwijnt de knop vanzelf.
 */
function neo_ls_sls_melding() {
	$ontbrekend = neo_ls_sls_ontbrekend();
	if ( ! $ontbrekend ) {
		return;
	}
	$nieuw = count( array_filter( wp_list_pluck( $ontbrekend, 'id' ), fn( $id ) => ! $id ) );
	$logo  = count( $ontbrekend ) - $nieuw;

	echo '<div class="neo-ls-kaart">';
	echo '<h2>Overzetten uit Soccer Live Scores</h2>';
	printf(
		'<p>In Soccer Live Scores staan %s die hier nog niet staan, en %s voor clubs die hier nog geen logo hebben. Bestaande clubs en logo\'s blijven zoals ze zijn.</p>',
		esc_html( 1 === $nieuw ? '1 club' : "$nieuw clubs" ),
		esc_html( 1 === $logo ? '1 logo' : "$logo logo's" )
	);
	printf( '<p class="neo-ls-klein">%s</p>', esc_html( implode( ', ', array_keys( $ontbrekend ) ) ) );
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_sls_overzetten' );
	echo '<input type="hidden" name="action" value="neo_ls_sls_overzetten">';
	echo '<button class="button button-primary">Clubs overzetten</button>';
	echo '</form></div>';
}

function neo_ls_sls_overzetten_formulier() {
	neo_ls_beheer_controleren( 'neo_ls_sls_overzetten' );
	$aantal = neo_ls_sls_overzetten();
	neo_ls_terug(
		'neo-live-score-clubs',
		array(),
		"Overgezet: {$aantal['nieuw']} nieuwe clubs en {$aantal['logo']} logo's. Vink bij elke club nog aan in welke klasse hij speelt."
	);
}

function neo_ls_pagina_clubs() {
	global $wpdb;
	$club_tabel = neo_ls_tabel( 'club' );

	$filter    = sanitize_key( $_GET['filter'] ?? 'alle' );
	$zoek      = sanitize_text_field( wp_unslash( $_GET['zoek'] ?? '' ) );
	$bewerk_id = absint( $_GET['bewerk'] ?? 0 );
	$bewerk    = $bewerk_id ? $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', $club_tabel, $bewerk_id ) ) : null;

	// Aantallen voor de filterknoppen.
	$aantal_actief = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE actief = 1', $club_tabel ) );
	$aantal_alle   = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $club_tabel ) );

	// Clubs met de laatste wedstrijd die ze gespeeld hebben.
	$sql  = 'SELECT c.*, w.aftrap AS laatst, k.korte_naam AS laatst_klasse
		FROM %i c
		LEFT JOIN %i w ON w.id = (
			SELECT w2.id FROM %i w2
			WHERE w2.thuisclub_id = c.id OR w2.uitclub_id = c.id
			ORDER BY w2.aftrap DESC LIMIT 1
		)
		LEFT JOIN %i k ON k.id = w.klasse_id
		WHERE 1 = 1';
	$args = array( $club_tabel, neo_ls_tabel( 'wedstrijd' ), neo_ls_tabel( 'wedstrijd' ), neo_ls_tabel( 'klasse' ) );
	if ( 'actief' === $filter ) {
		$sql .= ' AND c.actief = 1';
	} elseif ( 'niet-actief' === $filter ) {
		$sql .= ' AND c.actief = 0';
	}
	if ( '' !== $zoek ) {
		$sql   .= ' AND c.naam LIKE %s';
		$args[] = '%' . $wpdb->esc_like( $zoek ) . '%';
	}
	$sql  .= ' ORDER BY c.naam';
	$clubs = $wpdb->get_results( $wpdb->prepare( $sql, $args ) );

	neo_ls_kop(
		'Clubs',
		'Een club voer je één keer in. Daarna kies je hem bij elke speelronde uit de lijst.',
		$bewerk ? array(
			'url'   => neo_ls_admin_url( 'neo-live-score-clubs' ),
			'tekst' => '+ Club toevoegen',
		) : null
	);

	neo_ls_sls_melding();

	echo '<div class="neo-ls-kolommen">';

	// Links: de lijst met clubs.
	echo '<div class="neo-ls-kaart">';
	echo '<div class="neo-ls-filters">';
	printf(
		'<form method="get"><input type="hidden" name="page" value="neo-live-score-clubs"><input type="hidden" name="filter" value="%s"><input type="search" name="zoek" value="%s" placeholder="Zoek club"> <button class="button">Zoeken</button></form>',
		esc_attr( $filter ),
		esc_attr( $zoek )
	);
	echo '<span class="neo-ls-tabs">';
	foreach (
		array(
			'alle'        => 'Alle (' . $aantal_alle . ')',
			'actief'      => 'Actief (' . $aantal_actief . ')',
			'niet-actief' => 'Niet-actief (' . ( $aantal_alle - $aantal_actief ) . ')',
		) as $sleutel => $tekst
	) {
		printf(
			'<a href="%s" class="%s">%s</a>',
			esc_url( neo_ls_admin_url( 'neo-live-score-clubs', array( 'filter' => $sleutel ) ) ),
			$filter === $sleutel ? 'actief' : '',
			esc_html( $tekst )
		);
	}
	echo '</span></div>';

	if ( ! $clubs ) {
		echo '<p class="neo-ls-leeg">Geen clubs gevonden.</p>';
	} else {
		echo '<table class="widefat striped"><thead><tr><th style="width:40px">Logo</th><th>Naam · laatst gespeeld</th><th>Status</th><th></th></tr></thead><tbody>';
		foreach ( $clubs as $club ) {
			$laatst = $club->laatst
				? wp_date( 'D j M', neo_ls_tijdstempel( $club->laatst ) ) . ' · ' . $club->laatst_klasse
				: 'Nog niet gespeeld';

			echo '<tr>';
			echo '<td>' . neo_ls_logo_html( $club->logo ) . '</td>';
			printf( '<td><strong>%s</strong><br><span class="neo-ls-klein">%s</span></td>', esc_html( $club->naam ), esc_html( $laatst ) );
			echo '<td>';
			neo_ls_club_actief_knop( $club );
			echo '</td>';
			printf(
				'<td style="text-align:right"><a class="button" href="%s">Bewerken</a></td>',
				esc_url( neo_ls_admin_url( 'neo-live-score-clubs', array( 'bewerk' => $club->id ) ) )
			);
			echo '</tr>';
		}
		echo '</tbody></table>';
	}
	echo '</div>';

	// Rechts: club toevoegen of bewerken.
	neo_ls_club_formulier( $bewerk );

	echo '</div>';
	neo_ls_voet();
}

/**
 * Knop die een club actief of niet-actief zet.
 */
function neo_ls_club_actief_knop( $club ) {
	echo '<form class="inline" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_club_actief' );
	echo '<input type="hidden" name="action" value="neo_ls_club_actief">';
	printf( '<input type="hidden" name="id" value="%d">', (int) $club->id );
	printf( '<input type="hidden" name="actief" value="%d">', $club->actief ? 0 : 1 );
	printf(
		'<button class="neo-ls-schakel%s" role="switch" aria-checked="%s" title="%s"><span class="neo-ls-schakel-knop"></span>%s</button>',
		$club->actief ? ' aan' : '',
		$club->actief ? 'true' : 'false',
		$club->actief ? 'Klik om op niet-actief te zetten' : 'Klik om op actief te zetten',
		$club->actief ? 'Actief' : 'Niet-actief'
	);
	echo '</form>';
}

function neo_ls_club_formulier( $club ) {
	global $wpdb;

	// De klassen van het huidige seizoen, om aan te vinken waar de club speelt.
	$seizoen = neo_ls_actief_seizoen();
	$klassen = $seizoen ? neo_ls_klassen( $seizoen->id ) : array();
	$gekozen = $club
		? array_map( 'intval', $wpdb->get_col( $wpdb->prepare( 'SELECT klasse_id FROM %i WHERE club_id = %d', neo_ls_tabel( 'klasse_club' ), $club->id ) ) )
		: array();

	echo '<div class="neo-ls-kaart">';
	echo '<h2>' . ( $club ? 'Club bewerken' : 'Club toevoegen' ) . '</h2>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'neo_ls_club_opslaan' );
	echo '<input type="hidden" name="action" value="neo_ls_club_opslaan">';
	printf( '<input type="hidden" name="id" value="%d">', $club ? (int) $club->id : 0 );

	// Logo uit de mediabibliotheek (zie admin.js).
	$logo = $club ? $club->logo : '';
	echo '<div class="neo-ls-veld"><span class="neo-ls-veldnaam">Logo</span>';
	echo '<div class="neo-ls-logo-kiezer" data-neo-logo-kiezer>';
	printf( '<img class="neo-ls-logo" data-neo-logo-voorbeeld src="%s" width="56" height="56" alt=""%s>', esc_url( $logo ), $logo ? '' : ' hidden' );
	echo '<div class="neo-ls-knoppen">';
	echo '<button type="button" class="button" data-neo-logo-kies>Kies een logo</button>';
	printf( '<button type="button" class="button-link button-link-delete" data-neo-logo-weg%s>Verwijderen</button>', $logo ? '' : ' hidden' );
	echo '</div>';
	printf( '<input type="hidden" name="logo" value="%s" data-neo-logo-url>', esc_attr( $logo ) );
	echo '</div><p class="neo-ls-klein">PNG of SVG, vierkant.</p></div>';

	printf(
		'<div class="neo-ls-veld"><label for="neo-club-naam">Naam</label><input type="text" id="neo-club-naam" name="naam" value="%s" placeholder="Naam van de club" required maxlength="100"></div>',
		esc_attr( $club ? $club->naam : '' )
	);

	echo '<div class="neo-ls-veld"><span class="neo-ls-veldnaam">Speelt dit seizoen in</span>';
	if ( ! $klassen ) {
		printf(
			'<p class="neo-ls-klein">Er is nog geen actief seizoen met klassen. <a href="%s">Maak eerst een seizoen aan.</a></p>',
			esc_url( neo_ls_admin_url( 'neo-live-score-seizoenen' ) )
		);
	}
	foreach ( $klassen as $klasse ) {
		printf(
			'<label style="font-weight:normal"><input type="checkbox" name="klassen[]" value="%d"%s> %s <span class="neo-ls-klein">(%s)</span></label>',
			(int) $klasse->id,
			checked( in_array( (int) $klasse->id, $gekozen, true ), true, false ),
			esc_html( $klasse->naam ),
			esc_html( $klasse->korte_naam )
		);
	}
	echo '</div>';

	printf(
		'<div class="neo-ls-veld"><label style="font-weight:normal"><input type="checkbox" name="actief" value="1"%s> <strong>Actief</strong></label><p class="neo-ls-klein">Een niet-actieve club staat niet in de keuzelijst. Oude uitslagen blijven bewaard.</p></div>',
		checked( ! $club || $club->actief, true, false )
	);

	echo '<div class="neo-ls-knoppen"><button class="button button-primary">Opslaan</button>';
	if ( $club ) {
		printf( '<a class="button" href="%s">Annuleren</a>', esc_url( neo_ls_admin_url( 'neo-live-score-clubs' ) ) );
	}
	echo '</div></form></div>';
}

function neo_ls_club_opslaan() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_club_opslaan' );

	$id      = absint( $_POST['id'] ?? 0 );
	$naam    = sanitize_text_field( wp_unslash( $_POST['naam'] ?? '' ) );
	$logo    = esc_url_raw( wp_unslash( $_POST['logo'] ?? '' ) );
	$actief  = empty( $_POST['actief'] ) ? 0 : 1;
	$klassen = array_map( 'absint', (array) ( $_POST['klassen'] ?? array() ) );
	$tabel   = neo_ls_tabel( 'club' );
	$terug   = $id ? array( 'bewerk' => $id ) : array();

	if ( '' === $naam ) {
		neo_ls_terug( 'neo-live-score-clubs', $terug, 'Vul een naam in.', 'error' );
	}
	$dubbel = $wpdb->get_var( $wpdb->prepare( 'SELECT id FROM %i WHERE naam = %s AND id <> %d', $tabel, $naam, $id ) );
	if ( $dubbel ) {
		neo_ls_terug( 'neo-live-score-clubs', $terug, "Er bestaat al een club met de naam $naam.", 'error' );
	}

	$velden = array(
		'naam'   => $naam,
		'logo'   => $logo,
		'actief' => $actief,
	);
	if ( $id ) {
		$wpdb->update( $tabel, $velden, array( 'id' => $id ) );
	} else {
		$wpdb->insert( $tabel, $velden );
		$id = (int) $wpdb->insert_id;
	}

	// Klassen van het huidige seizoen opnieuw vastleggen. Klassen van oude seizoenen blijven staan.
	$seizoen = neo_ls_actief_seizoen();
	if ( $seizoen ) {
		$kc_tabel        = neo_ls_tabel( 'klasse_club' );
		$seizoen_klassen = array_map( 'intval', wp_list_pluck( neo_ls_klassen( $seizoen->id ), 'id' ) );
		foreach ( $seizoen_klassen as $klasse_id ) {
			$wpdb->delete(
				$kc_tabel,
				array(
					'klasse_id' => $klasse_id,
					'club_id'   => $id,
				)
			);
			if ( in_array( $klasse_id, $klassen, true ) ) {
				$wpdb->insert(
					$kc_tabel,
					array(
						'klasse_id' => $klasse_id,
						'club_id'   => $id,
					)
				);
			}
		}
	}

	neo_ls_terug( 'neo-live-score-clubs', array(), "$naam is opgeslagen." );
}

function neo_ls_club_actief_zetten() {
	global $wpdb;
	neo_ls_beheer_controleren( 'neo_ls_club_actief' );

	$id     = absint( $_POST['id'] ?? 0 );
	$actief = empty( $_POST['actief'] ) ? 0 : 1;
	$wpdb->update( neo_ls_tabel( 'club' ), array( 'actief' => $actief ), array( 'id' => $id ) );

	$naam = $wpdb->get_var( $wpdb->prepare( 'SELECT naam FROM %i WHERE id = %d', neo_ls_tabel( 'club' ), $id ) );
	neo_ls_terug( 'neo-live-score-clubs', array(), $actief ? "$naam staat weer op actief." : "$naam staat op niet-actief." );
}
