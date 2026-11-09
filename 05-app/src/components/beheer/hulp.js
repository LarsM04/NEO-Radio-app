// Kleuren en hulpfuncties voor het beheergedeelte (scores invoeren langs het veld).
import { Alert, Platform } from 'react-native';

import { kleuren } from '../../constants/kleuren';

// Kleuren uit het ontwerpdocument die (nog) niet in constants/kleuren.js staan.
export const beheerKleuren = {
  ...kleuren,
  donkergroen: '#355f13',
  lichtgroen: '#f3f6ee',
  rand: '#e3ead8',
};

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// "2026-10-10" -> "Zaterdag 10 oktober"
export function datumTekst(datum) {
  const [jaar, maand, dag] = datum.split('-').map(Number);
  const weekdag = new Date(Date.UTC(jaar, maand - 1, dag)).getUTCDay();
  const tekst = `${DAGEN[weekdag]} ${dag} ${MAANDEN[maand - 1]}`;
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

// "2026-10-10T14:30:00+02:00" -> "14:30" (de tijd zoals die op de website staat)
export function tijd(iso) {
  return iso ? iso.slice(11, 16) : '';
}

// De minuut waarin een wedstrijd nu is. Rekent hetzelfde als de plugin:
// eerste helft vanaf de aftrap (max. 45), tweede helft 45 plus de tijd sinds de rust (max. 90).
export function huidigeMinuut(wedstrijd, nu = Date.now()) {
  if (wedstrijd.status !== 'bezig') {
    return null;
  }
  if (wedstrijd.start_tweede_helft) {
    const minuten = Math.floor(Math.max(0, nu - Date.parse(wedstrijd.start_tweede_helft)) / 60000);
    return Math.min(90, 46 + minuten);
  }
  const minuten = Math.floor(Math.max(0, nu - Date.parse(wedstrijd.aftrap)) / 60000);
  return Math.min(45, 1 + minuten);
}

// Vraagt om bevestiging. Werkt in Expo Go én in de browser (daar doet Alert niets).
export function bevestig(titel, tekst, knop = 'Ja') {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titel}\n\n${tekst}`));
  }
  return new Promise((klaar) => {
    Alert.alert(titel, tekst, [
      { text: 'Annuleren', style: 'cancel', onPress: () => klaar(false) },
      { text: knop, onPress: () => klaar(true) },
    ]);
  });
}

// Toont een foutmelding. Werkt in Expo Go én in de browser.
export function toonFout(tekst) {
  if (Platform.OS === 'web') {
    window.alert(tekst);
  } else {
    Alert.alert('Dat lukte niet', tekst);
  }
}

export const NAAM_VAN_TYPE = {
  doelpunt: 'Doelpunt',
  geel: 'Gele kaart',
  rood: 'Rode kaart',
};
