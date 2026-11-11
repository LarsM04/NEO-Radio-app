// Kleuren en hulpfuncties voor het beheergedeelte (scores invoeren langs het veld).
import { Alert, Platform } from 'react-native';

import { kleuren } from '../../constants/kleuren';

// Kleuren uit het ontwerpdocument die (nog) niet in constants/kleuren.js staan.
// Donkergroen gebruiken we niet meer (aantekeningen bij het ontwerp, 9 november 2026):
// knoppen zijn NEO-zwart, en op NEO-groen staat zwarte tekst.
export const beheerKleuren = {
  ...kleuren,
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

// Na deze minuten kan er blessuretijd komen: 45+2, 90+3.
export const EINDE_HELFT = [45, 90];

// De minuut waarin een wedstrijd nu is, als { minuut, extra }. Rekent hetzelfde als de plugin:
// eerste helft vanaf de aftrap, tweede helft 45 plus de tijd sinds de rust.
// Na 45 en 90 minuten wordt het blessuretijd: { minuut: 45, extra: 2 } = 45+2.
// Geeft null als de wedstrijd niet bezig is.
export function huidigeMinuut(wedstrijd, nu = Date.now()) {
  if (wedstrijd.status !== 'bezig') {
    return null;
  }
  const tweedeHelft = !!wedstrijd.start_tweede_helft;
  const start = Date.parse(tweedeHelft ? wedstrijd.start_tweede_helft : wedstrijd.aftrap);
  const gespeeld = (tweedeHelft ? 46 : 1) + Math.floor(Math.max(0, nu - start) / 60000);
  const einde = tweedeHelft ? 90 : 45;

  if (gespeeld > einde) {
    return { minuut: einde, extra: Math.min(30, gespeeld - einde) };
  }
  return { minuut: gespeeld, extra: null };
}

// { minuut: 45, extra: 2 } -> "45+2", { minuut: 67 } -> "67", null -> null
export function minuutTekst(tijdstip) {
  if (!tijdstip || tijdstip.minuut == null) {
    return null;
  }
  return tijdstip.extra ? `${tijdstip.minuut}+${tijdstip.extra}` : String(tijdstip.minuut);
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
