// Alle verzoeken naar de WordPress-website van NEO Radio staan in dit bestand
// (en in beheer.js voor het beheergedeelte). Zie het technisch ontwerp
// (04-ontwerp/technisch-ontwerp) voor de endpoints.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BASIS_URL = 'https://www.neoradio.nl/wp-json';

// Het adres waar Expo Go de app vandaan haalt, bijvoorbeeld "192.168.1.20" of "localhost".
// Met `npx expo start --tunnel` is dat een adres op internet (eindigt op .exp.direct).
const EXPO_HOST =
  Platform.OS === 'web' ? window.location.hostname : Constants.expoConfig?.hostUri?.split(':')[0];

// De live-score-plugin draait nog niet op de echte website, alleen op onze lokale
// testsite (LocalWP). Tijdens het ontwikkelen gaan live-score-verzoeken daarom naar het
// doorgeefluik op de laptop waar `npx expo start` draait (zie 06-plugin/README.md), op
// hetzelfde adres als waar Expo Go de app vandaan haalt.
// Een ander adres kun je instellen met EXPO_PUBLIC_LIVESCORE_URL in 05-app/.env.
export const LIVESCORE_URL =
  process.env.EXPO_PUBLIC_LIVESCORE_URL ||
  (__DEV__ && EXPO_HOST ? `http://${EXPO_HOST}:8787/wp-json` : BASIS_URL);

// True als de app via `--tunnel` draait. Het doorgeefluik op de laptop is dan niet te bereiken.
export const VIA_TUNNEL =
  __DEV__ && !process.env.EXPO_PUBLIC_LIVESCORE_URL && !!EXPO_HOST && EXPO_HOST.endsWith('.exp.direct');

async function haalOp(pad, basis = BASIS_URL) {
  const antwoord = await fetch(basis + pad);
  if (!antwoord.ok) {
    throw new Error(`Ophalen mislukt (${antwoord.status}): ${pad}`);
  }
  return antwoord.json();
}

// Nieuws
export function haalNieuwsOp(categorieId) {
  const filter = categorieId ? `&categories=${categorieId}` : '';
  return haalOp(`/wp/v2/posts?_embed&per_page=20${filter}`);
}

export function haalBerichtOp(id) {
  return haalOp(`/wp/v2/posts/${id}?_embed`);
}

export function haalCategorieenOp() {
  return haalOp('/wp/v2/categories?per_page=100');
}

// Info
export function haalPaginasOp() {
  return haalOp('/wp/v2/pages?per_page=100');
}

// Live score (eigen plugin). Voorbeelden van de antwoorden staan in src/data/.
export function haalKlassenOp() {
  return haalOp('/neo/v1/klassen', LIVESCORE_URL);
}

export function haalLivescoreOp() {
  return haalOp('/neo/v1/livescore', LIVESCORE_URL);
}

export function haalUitslagenOp(klasseId) {
  return haalOp(`/neo/v1/uitslagen?klasse=${klasseId}`, LIVESCORE_URL);
}
