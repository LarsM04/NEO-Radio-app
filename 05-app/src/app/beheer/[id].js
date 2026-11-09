// Wedstrijd bijhouden langs het veld (ontwerp, Beheer · 13 en 14).
// De stand groot in beeld, de knoppen +1 onder je duim, de status met één tik.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  gaBijhouden,
  haalBeheerWedstrijdOp,
  NietIngelogdFout,
  pasGebeurtenisAan,
  verwijderGebeurtenis,
  voegGebeurtenisToe,
  zetStatus,
} from '../../api/beheer';
import AfrondenBlad from '../../components/beheer/AfrondenBlad';
import DoelpuntMelding from '../../components/beheer/DoelpuntMelding';
import GebeurtenisBlad from '../../components/beheer/GebeurtenisBlad';
import { bevestig, beheerKleuren as k, huidigeMinuut, NAAM_VAN_TYPE, tijd, toonFout } from '../../components/beheer/hulp';
import { ClubLogo, Keuzes, Knop, StatusLabel } from '../../components/beheer/onderdelen';

const STATUSSEN = [
  { waarde: 'gepland', tekst: 'Gepland' },
  { waarde: 'bezig', tekst: 'Bezig' },
  { waarde: 'rust', tekst: 'Rust' },
  { waarde: 'afgelopen', tekst: 'Afgelopen' },
];

export default function WedstrijdBijhoudenScherm() {
  const { id } = useLocalSearchParams();
  const [wedstrijd, setWedstrijd] = useState(null);
  const [fout, setFout] = useState(null);
  const [opslaan, setOpslaan] = useState('opgeslagen'); // 'opgeslagen', 'bezig' of 'fout'
  const [nu, setNu] = useState(Date.now());
  const [blad, setBlad] = useState(null); // gebeurtenis die in het onderblad openstaat
  const [afronden, setAfronden] = useState(false);
  const [melding, setMelding] = useState(null); // { tekst, gebeurtenisId }
  const meldingWeg = useCallback(() => setMelding(null), []);

  const ophalen = useCallback(async () => {
    try {
      setWedstrijd(await haalBeheerWedstrijdOp(id));
      setFout(null);
    } catch (e) {
      afhandelen(e);
    }
  }, [id]);

  // Ophalen bij openen; de minuut elke 15 seconden bijwerken.
  useFocusEffect(
    useCallback(() => {
      ophalen();
      const klok = setInterval(() => setNu(Date.now()), 15000);
      return () => clearInterval(klok);
    }, [ophalen])
  );

  function afhandelen(e) {
    if (e instanceof NietIngelogdFout) {
      router.replace('/beheer');
    } else if (wedstrijd) {
      toonFout(e.message);
    } else {
      setFout(e.message);
    }
  }

  // Voert een wijziging uit en toont "Opslaan…" en daarna "Opgeslagen".
  // Geeft het antwoord van de website, of null als het mislukte.
  async function bewaar(actie) {
    setOpslaan('bezig');
    try {
      const antwoord = await actie();
      setOpslaan('opgeslagen');
      return antwoord;
    } catch (e) {
      setOpslaan('fout');
      afhandelen(e);
      ophalen();
      return null;
    }
  }

  async function plusEen(kant) {
    const antwoord = await bewaar(() => voegGebeurtenisToe(wedstrijd.id, { kant, type: 'doelpunt' }));
    if (antwoord) {
      setWedstrijd(antwoord.wedstrijd);
      const gebeurtenis = antwoord.wedstrijd.gebeurtenissen.find((g) => g.id === antwoord.gebeurtenis_id);
      const minuut = gebeurtenis?.minuut ? ` · ${gebeurtenis.minuut}'` : '';
      setMelding({ tekst: `Doelpunt ${wedstrijd[kant].naam}${minuut}`, gebeurtenisId: antwoord.gebeurtenis_id });
    }
  }

  async function ongedaanMaken() {
    const gebeurtenisId = melding.gebeurtenisId;
    setMelding(null);
    const antwoord = await bewaar(() => verwijderGebeurtenis(gebeurtenisId));
    if (antwoord) {
      setWedstrijd(antwoord);
    }
  }

  function spelerToevoegen() {
    const gebeurtenis = wedstrijd.gebeurtenissen.find((g) => g.id === melding.gebeurtenisId);
    setMelding(null);
    if (gebeurtenis) {
      setBlad(gebeurtenis);
    }
  }

  async function gebeurtenisOpslaan(gegevens) {
    const nieuw = !blad.id;
    const antwoord = await bewaar(() =>
      nieuw ? voegGebeurtenisToe(wedstrijd.id, gegevens) : pasGebeurtenisAan(blad.id, gegevens)
    );
    if (!antwoord) {
      return false;
    }
    setWedstrijd(nieuw ? antwoord.wedstrijd : antwoord);
    setBlad(null);
    return true;
  }

  async function gebeurtenisVerwijderen() {
    const antwoord = await bewaar(() => verwijderGebeurtenis(blad.id));
    if (!antwoord) {
      return false;
    }
    setWedstrijd(antwoord);
    setBlad(null);
    return true;
  }

  async function statusKiezen(status) {
    if (status === 'afgelopen') {
      setAfronden(true);
      return;
    }
    const antwoord = await bewaar(() => zetStatus(wedstrijd.id, status));
    if (antwoord) {
      setWedstrijd(antwoord);
    }
  }

  async function wedstrijdAfronden() {
    const antwoord = await bewaar(() => zetStatus(wedstrijd.id, 'afgelopen'));
    if (antwoord) {
      setWedstrijd(antwoord);
    }
    setAfronden(false);
  }

  async function overnemen() {
    if (
      await bevestig(
        'Wedstrijd overnemen?',
        `${wedstrijd.bijgehouden_door.naam} houdt deze wedstrijd nu bij.`,
        'Overnemen'
      )
    ) {
      const antwoord = await bewaar(() => gaBijhouden(wedstrijd.id, true));
      if (antwoord) {
        setWedstrijd(antwoord);
      }
    }
  }

  if (!wedstrijd) {
    return (
      <SafeAreaView style={[styles.scherm, styles.midden]}>
        {fout ? (
          <>
            <Text style={styles.fout}>{fout}</Text>
            <Knop tekst="Terug naar wedstrijden" soort="rand" onPress={() => router.replace('/beheer')} />
          </>
        ) : (
          <ActivityIndicator color={k.groen} />
        )}
      </SafeAreaView>
    );
  }

  const minuut = huidigeMinuut(wedstrijd, nu);
  const score = wedstrijd.score || { thuis: 0, uit: 0 };
  const vanIemandAnders = !wedstrijd.door_mij && !!wedstrijd.bijgehouden_door;
  // Nieuwste bovenaan: eerst op minuut, dan op volgorde van invoeren.
  const gebeurtenissen = [...wedstrijd.gebeurtenissen].sort(
    (a, b) => (b.minuut ?? 0) - (a.minuut ?? 0) || b.id - a.id
  );

  return (
    <SafeAreaView style={styles.scherm}>
      <ScrollView contentContainerStyle={styles.inhoud}>
        <View style={styles.kop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/beheer'))}
            style={styles.terug}
            accessibilityRole="button"
          >
            <Text style={styles.terugTekst}>‹ Wedstrijden</Text>
          </Pressable>
          <OpslaanStatus status={opslaan} />
        </View>
        <Text style={styles.klein}>
          {wedstrijd.klasse?.naam} · aftrap {tijd(wedstrijd.aftrap)}
        </Text>

        {/* Scorebord */}
        <View style={styles.bord}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <StatusLabel wedstrijd={wedstrijd} minuut={minuut} />
          </View>
          <View style={styles.bordRij}>
            <BordClub club={wedstrijd.thuis} />
            <Text style={styles.bordScore}>
              {score.thuis} – {score.uit}
            </Text>
            <BordClub club={wedstrijd.uit} />
          </View>
          {wedstrijd.rust && (
            <Text style={styles.bordRust}>
              Ruststand {wedstrijd.rust.thuis}-{wedstrijd.rust.uit}
            </Text>
          )}
        </View>

        {vanIemandAnders ? (
          <View style={styles.melding}>
            <Text style={styles.meldingTekst}>
              {wedstrijd.bijgehouden_door.naam} houdt deze wedstrijd bij. Je kunt meekijken, maar niets aanpassen.
            </Text>
            <Knop tekst="Overnemen" soort="rand" onPress={overnemen} style={{ marginTop: 10 }} />
          </View>
        ) : (
          <>
            {/* +1 onder je duim */}
            <View style={styles.rij}>
              {['thuis', 'uit'].map((kant) => (
                <Pressable
                  key={kant}
                  onPress={() => plusEen(kant)}
                  disabled={opslaan === 'bezig'}
                  accessibilityRole="button"
                  accessibilityLabel={`Doelpunt ${wedstrijd[kant].naam}`}
                  style={({ pressed }) => [styles.plus, pressed && { opacity: 0.75 }]}
                >
                  <Text style={styles.plusKant}>{kant === 'thuis' ? 'Thuis' : 'Uit'}</Text>
                  <Text style={styles.plusEen}>+1</Text>
                  <Text style={styles.plusNaam} numberOfLines={1}>
                    {wedstrijd[kant].naam}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rij}>
              <KaartKnop kleur="#f2c200" tekst="Gele kaart" onPress={() => setBlad({ type: 'geel', kant: 'thuis' })} />
              <KaartKnop kleur={k.liveRood} tekst="Rode kaart" onPress={() => setBlad({ type: 'rood', kant: 'thuis' })} />
            </View>

            <Text style={styles.kopje}>Status</Text>
            <Keuzes opties={STATUSSEN} gekozen={wedstrijd.status} onKies={statusKiezen} uit={opslaan === 'bezig'} />
            <Text style={styles.klein}>Bij Rust wordt de ruststand vanzelf opgeslagen.</Text>
          </>
        )}

        <View style={styles.gebeurtenissenKop}>
          <Text style={styles.kopje}>Gebeurtenissen</Text>
          <Text style={styles.klein}>Nieuwste bovenaan</Text>
        </View>
        {gebeurtenissen.length === 0 && <Text style={styles.leeg}>Nog geen doelpunten of kaarten.</Text>}
        <View style={styles.lijst}>
          {gebeurtenissen.map((g) => (
            <View key={g.id} style={styles.gebeurtenis}>
              <Text style={styles.icoon}>{g.type === 'doelpunt' ? '⚽' : g.type === 'geel' ? '🟨' : '🟥'}</Text>
              <Text style={styles.gebeurtenisMinuut}>{g.minuut ? `${g.minuut}'` : '–'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.gebeurtenisTitel}>
                  {NAAM_VAN_TYPE[g.type]} {wedstrijd[g.kant].naam}
                </Text>
                {g.speler && <Text style={styles.klein}>{g.speler}</Text>}
              </View>
              {!vanIemandAnders && (
                <Pressable onPress={() => setBlad(g)} style={styles.aanpassen} accessibilityRole="button">
                  <Text style={styles.aanpassenTekst}>✎ Aanpassen</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <DoelpuntMelding
        melding={melding}
        onSpeler={spelerToevoegen}
        onOngedaan={ongedaanMaken}
        onWeg={meldingWeg}
      />
      <GebeurtenisBlad
        wedstrijd={wedstrijd}
        gebeurtenis={blad}
        onOpslaan={gebeurtenisOpslaan}
        onVerwijder={gebeurtenisVerwijderen}
        onSluit={() => setBlad(null)}
      />
      <AfrondenBlad
        wedstrijd={wedstrijd}
        zichtbaar={afronden}
        onAfronden={wedstrijdAfronden}
        onSluit={() => setAfronden(false)}
      />
    </SafeAreaView>
  );
}

function OpslaanStatus({ status }) {
  const tekst = { opgeslagen: 'Opgeslagen', bezig: 'Opslaan…', fout: 'Niet opgeslagen' }[status];
  const kleur = { opgeslagen: k.groen, bezig: k.grijs, fout: k.rood }[status];
  return (
    <Text style={[styles.opslaan, { color: status === 'opgeslagen' ? k.donkergroen : kleur }]}>
      <Text style={{ color: kleur }}>● </Text>
      {tekst}
    </Text>
  );
}

function BordClub({ club }) {
  return (
    <View style={styles.bordClub}>
      <ClubLogo logo={club.logo} grootte={48} opDonker />
      <Text style={styles.bordNaam} numberOfLines={2}>
        {club.naam}
      </Text>
    </View>
  );
}

function KaartKnop({ kleur, tekst, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.kaartKnop, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.kaartje, { backgroundColor: kleur }]} />
      <Text style={styles.kaartTekst}>{tekst}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scherm: {
    flex: 1,
    backgroundColor: k.wit,
  },
  midden: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  inhoud: {
    padding: 16,
    paddingBottom: 160,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  kop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  terug: {
    minHeight: 44,
    justifyContent: 'center',
  },
  terugTekst: {
    fontSize: 17,
    fontWeight: '700',
    color: k.donkergroen,
  },
  opslaan: {
    fontSize: 14,
    fontWeight: '700',
  },
  klein: {
    fontSize: 14,
    color: k.grijs,
    marginTop: 4,
  },
  bord: {
    backgroundColor: k.zwart,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  bordRij: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bordClub: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bordNaam: {
    color: k.wit,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  bordScore: {
    color: k.wit,
    fontSize: 48,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  bordRust: {
    color: '#c9c9c9',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  rij: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  plus: {
    flex: 1,
    backgroundColor: k.groen,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#5f8c12',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  plusKant: {
    fontSize: 15,
    fontWeight: '700',
    color: k.zwart,
  },
  plusEen: {
    fontSize: 44,
    fontWeight: '900',
    color: k.zwart,
    lineHeight: 50,
  },
  plusNaam: {
    fontSize: 16,
    fontWeight: '700',
    color: k.zwart,
  },
  kaartKnop: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  kaartje: {
    width: 14,
    height: 20,
    borderRadius: 3,
  },
  kaartTekst: {
    fontSize: 16,
    fontWeight: '700',
    color: k.zwart,
  },
  kopje: {
    fontSize: 19,
    fontWeight: '800',
    color: k.zwart,
    marginTop: 14,
    marginBottom: 8,
  },
  melding: {
    backgroundColor: k.lichtgroen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: k.rand,
    padding: 14,
  },
  meldingTekst: {
    fontSize: 16,
    lineHeight: 22,
    color: k.zwart,
  },
  gebeurtenissenKop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  leeg: {
    fontSize: 16,
    color: k.grijs,
    marginTop: 4,
  },
  lijst: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    overflow: 'hidden',
  },
  gebeurtenis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  icoon: {
    fontSize: 18,
  },
  gebeurtenisMinuut: {
    width: 38,
    fontSize: 16,
    fontWeight: '800',
    color: k.zwart,
  },
  gebeurtenisTitel: {
    fontSize: 16,
    color: k.zwart,
  },
  aanpassen: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: k.lichtgroen,
    borderWidth: 1,
    borderColor: k.rand,
    justifyContent: 'center',
  },
  aanpassenTekst: {
    fontSize: 14,
    fontWeight: '700',
    color: k.zwart,
  },
  fout: {
    fontSize: 16,
    color: k.rood,
    textAlign: 'center',
  },
});
