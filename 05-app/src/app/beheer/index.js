// Beheer: inloggen, en daarna "Mijn wedstrijden" (ontwerp, Beheer · 13).
// Alle wedstrijden van vandaag per klasse, met stand, status en wie hem bijhoudt.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  gaBijhouden,
  haalBeheerWedstrijdenOp,
  haalLoginOp,
  inloggen,
  NietIngelogdFout,
  uitloggen,
} from '../../api/beheer';
import { bevestig, beheerKleuren as k, datumTekst, huidigeMinuut, toonFout } from '../../components/beheer/hulp';
import { Knop } from '../../components/beheer/onderdelen';
import WedstrijdKaart from '../../components/beheer/WedstrijdKaart';

const VERVERS_SECONDEN = 15;

export default function BeheerScherm() {
  // undefined = nog aan het kijken of er een login is, null = niet ingelogd
  const [gebruiker, setGebruiker] = useState(undefined);

  useEffect(() => {
    haalLoginOp().then((login) => setGebruiker(login ? login.gebruiker : null));
  }, []);

  // Vaste functie (useCallback), anders haalt Mijn wedstrijden bij elke render opnieuw op.
  const uitgelogd = useCallback(() => setGebruiker(null), []);

  if (gebruiker === undefined) {
    return (
      <View style={styles.midden}>
        <ActivityIndicator color={k.groen} />
      </View>
    );
  }
  if (!gebruiker) {
    return <Inloggen onIngelogd={setGebruiker} />;
  }
  return <MijnWedstrijden gebruiker={gebruiker} onUitgelogd={uitgelogd} />;
}

// Terug naar de gewone app. Is het beheer direct geopend (bijv. via een link), dan naar Home.
function terugNaarApp() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

function Logo() {
  return (
    <Image
      source={require('../../../assets/neo-radio-logo.png')}
      style={styles.logo}
      resizeMode="contain"
      accessibilityLabel="NEO Radio"
    />
  );
}

// --- Inloggen ----------------------------------------------------------------

function Inloggen({ onIngelogd }) {
  const [naam, setNaam] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  async function versturen() {
    if (!naam.trim() || !wachtwoord) {
      setFout('Vul je gebruikersnaam en wachtwoord in.');
      return;
    }
    setBezig(true);
    setFout(null);
    try {
      onIngelogd(await inloggen(naam.trim(), wachtwoord));
    } catch (e) {
      setFout(e.message);
      setBezig(false);
    }
  }

  return (
    <SafeAreaView style={styles.scherm}>
      <ScrollView contentContainerStyle={styles.inhoud} keyboardShouldPersistTaps="handled">
        <Pressable onPress={terugNaarApp} style={styles.terug} accessibilityRole="button">
          <Text style={styles.terugTekst}>‹ Terug naar de app</Text>
        </Pressable>
        <Logo />
        <Text style={styles.titel}>Live score invoeren</Text>
        <Text style={styles.uitleg}>
          Voor medewerkers van NEO Radio. Log in met je account van de website.
        </Text>

        <Text style={styles.veldnaam}>Gebruikersnaam of e-mailadres</Text>
        <TextInput
          value={naam}
          onChangeText={setNaam}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          style={styles.invoer}
          returnKeyType="next"
        />
        <Text style={styles.veldnaam}>Wachtwoord</Text>
        <TextInput
          value={wachtwoord}
          onChangeText={setWachtwoord}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          style={styles.invoer}
          returnKeyType="go"
          onSubmitEditing={versturen}
        />
        {fout && <Text style={styles.fout}>{fout}</Text>}
        <Knop tekst="Inloggen" onPress={versturen} bezig={bezig} style={{ marginTop: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Mijn wedstrijden --------------------------------------------------------

function MijnWedstrijden({ gebruiker, onUitgelogd }) {
  const [data, setData] = useState(null);
  const [fout, setFout] = useState(null);
  const [verversen, setVerversen] = useState(false);
  const [bezigMet, setBezigMet] = useState(null);
  const [nu, setNu] = useState(Date.now());

  const ophalen = useCallback(async () => {
    try {
      setData(await haalBeheerWedstrijdenOp());
      setFout(null);
    } catch (e) {
      if (e instanceof NietIngelogdFout) {
        onUitgelogd();
      } else {
        setFout(e.message);
      }
    }
  }, [onUitgelogd]);

  // Zolang dit scherm open is: ophalen, en elke 15 seconden opnieuw
  // (zo zie je ook wedstrijden die een collega net is gaan bijhouden).
  useFocusEffect(
    useCallback(() => {
      ophalen();
      const klok = setInterval(() => {
        setNu(Date.now());
        ophalen();
      }, VERVERS_SECONDEN * 1000);
      return () => clearInterval(klok);
    }, [ophalen])
  );

  async function bijhouden(wedstrijd) {
    const overnemen = !!wedstrijd.bijgehouden_door;
    if (
      overnemen &&
      !(await bevestig(
        'Wedstrijd overnemen?',
        `${wedstrijd.bijgehouden_door.naam} houdt deze wedstrijd nu bij. Daarna kan alleen jij hem nog aanpassen.`,
        'Overnemen'
      ))
    ) {
      return;
    }
    setBezigMet(wedstrijd.id);
    try {
      await gaBijhouden(wedstrijd.id, overnemen);
      router.push(`/beheer/${wedstrijd.id}`);
    } catch (e) {
      toonFout(e.message);
      ophalen();
    } finally {
      setBezigMet(null);
    }
  }

  async function afmelden() {
    if (await bevestig('Uitloggen?', 'Je moet daarna opnieuw inloggen om scores in te voeren.', 'Uitloggen')) {
      await uitloggen().catch(() => {});
      onUitgelogd();
    }
  }

  return (
    <SafeAreaView style={styles.scherm}>
      <ScrollView
        contentContainerStyle={styles.inhoud}
        refreshControl={
          <RefreshControl
            refreshing={verversen}
            onRefresh={async () => {
              setVerversen(true);
              await ophalen();
              setVerversen(false);
            }}
          />
        }
      >
        <View style={styles.kop}>
          <Pressable onPress={terugNaarApp} accessibilityRole="button" accessibilityLabel="Terug naar de app">
            <Logo />
          </Pressable>
          <Pressable onPress={afmelden} accessibilityRole="button">
            <Text style={styles.ingelogd}>Ingelogd als {gebruiker.naam}</Text>
            <Text style={styles.uitloggen}>Uitloggen</Text>
          </Pressable>
        </View>

        <Text style={styles.titel}>Mijn wedstrijden</Text>
        {data && <Text style={styles.datum}>{datumTekst(data.datum)}</Text>}
        <Text style={styles.hint}>↻ Wat je invult, staat binnen een paar seconden in de app.</Text>

        {fout && <Text style={styles.fout}>{fout}</Text>}
        {!data && !fout && <ActivityIndicator color={k.groen} style={{ marginTop: 32 }} />}
        {data && data.klassen.length === 0 && (
          <Text style={styles.leeg}>Vandaag zijn er geen wedstrijden.</Text>
        )}

        {data?.klassen.map((klasse) => (
          <View key={klasse.id}>
            <Text style={styles.klasse}>{klasse.naam}</Text>
            {klasse.wedstrijden.map((wedstrijd) => (
              <WedstrijdKaart
                key={wedstrijd.id}
                wedstrijd={wedstrijd}
                minuut={huidigeMinuut(wedstrijd, nu)}
                magOvernemen={gebruiker.beheren}
                bezig={bezigMet === wedstrijd.id}
                onOpen={() => router.push(`/beheer/${wedstrijd.id}`)}
                onBijhouden={() => bijhouden(wedstrijd)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scherm: {
    flex: 1,
    backgroundColor: '#f7f8f9',
  },
  inhoud: {
    padding: 20,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  midden: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 38,
  },
  kop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingelogd: {
    fontSize: 14,
    color: k.grijs,
    textAlign: 'right',
  },
  uitloggen: {
    fontSize: 14,
    fontWeight: '700',
    color: k.donkergroen,
    textAlign: 'right',
  },
  terug: {
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },
  terugTekst: {
    fontSize: 16,
    fontWeight: '700',
    color: k.donkergroen,
  },
  titel: {
    fontSize: 30,
    fontWeight: '800',
    color: k.zwart,
    marginTop: 8,
  },
  datum: {
    fontSize: 17,
    color: k.zwart,
    marginTop: 2,
  },
  hint: {
    fontSize: 15,
    color: k.grijs,
    marginTop: 8,
    marginBottom: 8,
  },
  uitleg: {
    fontSize: 17,
    lineHeight: 24,
    color: k.grijs,
    marginTop: 6,
    marginBottom: 12,
  },
  klasse: {
    fontSize: 16,
    fontWeight: '800',
    color: k.zwart,
    marginTop: 16,
    marginBottom: 8,
  },
  veldnaam: {
    fontSize: 15,
    fontWeight: '700',
    color: k.zwart,
    marginTop: 14,
    marginBottom: 6,
  },
  invoer: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: k.wit,
    paddingHorizontal: 14,
    fontSize: 17,
    color: k.zwart,
  },
  fout: {
    marginTop: 14,
    fontSize: 16,
    color: k.rood,
  },
  leeg: {
    marginTop: 32,
    fontSize: 17,
    color: k.grijs,
    textAlign: 'center',
  },
});
