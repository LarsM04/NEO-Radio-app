// Verzoeken voor het beheergedeelte: inloggen en scores bijhouden langs het veld.
// Alleen voor medewerkers met een WordPress-account met de juiste rol.
// De endpoints staan beschreven in 06-plugin/neo-live-score/includes/rest-beheer.php.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { LIVESCORE_URL, VIA_TUNNEL } from './wordpress';

const OPSLAG_SLEUTEL = 'neo-beheer-login';

// De ingelogde medewerker: { token, gebruiker: { id, naam, beheren } }, of null.
let login = null;

// Fout als het token niet (meer) geldig is. Het scherm stuurt je dan naar het inlogscherm.
export class NietIngelogdFout extends Error {}

async function verzoek(pad, { methode = 'GET', body } = {}) {
  // Wordt een beheerscherm direct geopend (bijv. na herladen), dan is de bewaarde
  // login nog niet ingelezen. Doe dat eerst, anders gaat er geen token mee.
  if (!login && pad !== '/inloggen') {
    await haalLoginOp();
  }

  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (login) {
    headers['X-NEO-Token'] = login.token;
  }

  let antwoord;
  try {
    antwoord = await fetch(`${LIVESCORE_URL}/neo/v1${pad}`, {
      method: methode,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    if (VIA_TUNNEL) {
      throw new Error(
        'De app draait via --tunnel, en dan kan hij de testsite op je laptop niet bereiken. ' +
          'Zet een hotspot aan op je telefoon, verbind je laptop daarmee en start de app met `npx expo start` (zonder --tunnel).'
      );
    }
    throw new Error(
      `Geen verbinding met de website (${LIVESCORE_URL}). Staat het doorgeefluik aan en zit je telefoon op hetzelfde netwerk als de laptop?`
    );
  }

  const data = await antwoord.json().catch(() => null);
  if (!antwoord.ok) {
    if (antwoord.status === 401 && login) {
      await wisLogin();
      throw new NietIngelogdFout(data?.message || 'Je bent niet meer ingelogd.');
    }
    throw new Error(data?.message || `Er ging iets mis (${antwoord.status}).`);
  }
  return data;
}

// --- Inloggen ---------------------------------------------------------------

// De bewaarde login van dit toestel (na het opnieuw openen van de app), of null.
export async function haalLoginOp() {
  if (!login) {
    const tekst =
      Platform.OS === 'web'
        ? window.localStorage.getItem(OPSLAG_SLEUTEL)
        : await SecureStore.getItemAsync(OPSLAG_SLEUTEL);
    login = tekst ? JSON.parse(tekst) : null;
  }
  return login;
}

export async function inloggen(gebruikersnaam, wachtwoord) {
  login = null;
  const data = await verzoek('/inloggen', {
    methode: 'POST',
    body: { gebruikersnaam, wachtwoord },
  });
  login = data;

  const tekst = JSON.stringify(data);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(OPSLAG_SLEUTEL, tekst);
  } else {
    await SecureStore.setItemAsync(OPSLAG_SLEUTEL, tekst);
  }
  return data.gebruiker;
}

export async function uitloggen() {
  try {
    await verzoek('/uitloggen', { methode: 'POST' });
  } finally {
    await wisLogin();
  }
}

async function wisLogin() {
  login = null;
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(OPSLAG_SLEUTEL);
  } else {
    await SecureStore.deleteItemAsync(OPSLAG_SLEUTEL);
  }
}

// --- Wedstrijden ------------------------------------------------------------

// Wedstrijden van één dag (standaard vandaag), per klasse.
export function haalBeheerWedstrijdenOp(datum) {
  return verzoek(`/beheer/wedstrijden${datum ? `?datum=${datum}` : ''}`);
}

export function haalBeheerWedstrijdOp(id) {
  return verzoek(`/beheer/wedstrijden/${id}`);
}

// Een vrije wedstrijd gaan bijhouden. Beheerders kunnen met overnemen = true
// ook een wedstrijd van iemand anders overnemen.
export function gaBijhouden(id, overnemen = false) {
  return verzoek(`/beheer/wedstrijden/${id}/bijhouden`, {
    methode: 'POST',
    body: { overnemen },
  });
}

// status: 'gepland', 'bezig', 'rust' of 'afgelopen'
export function zetStatus(id, status) {
  return verzoek(`/beheer/wedstrijden/${id}/status`, { methode: 'POST', body: { status } });
}

// gebeurtenis: { kant: 'thuis'|'uit', type: 'doelpunt'|'geel'|'rood', minuut?, speler? }
// Zonder minuut vult de website de minuut in waarin de wedstrijd nu is.
// Geeft { gebeurtenis_id, wedstrijd }.
export function voegGebeurtenisToe(wedstrijdId, gebeurtenis) {
  return verzoek(`/beheer/wedstrijden/${wedstrijdId}/gebeurtenissen`, {
    methode: 'POST',
    body: gebeurtenis,
  });
}

export function pasGebeurtenisAan(gebeurtenisId, gebeurtenis) {
  return verzoek(`/beheer/gebeurtenissen/${gebeurtenisId}`, { methode: 'PUT', body: gebeurtenis });
}

export function verwijderGebeurtenis(gebeurtenisId) {
  return verzoek(`/beheer/gebeurtenissen/${gebeurtenisId}`, { methode: 'DELETE' });
}
