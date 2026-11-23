// Live score, zoals in het ontwerpdocument (pagina 3, en pagina 7 voor "Eerdere uitslagen").
// "Deze ronde" komt uit /neo/v1/livescore van de live-score-plugin. Is er een wedstrijd bezig,
// dan ververst het scherm elke 10 seconden, anders elke minuut.
// "Eerdere uitslagen" komt uit /neo/v1/klassen en /neo/v1/uitslagen.
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haalKlassenOp, haalLivescoreOp, haalUitslagenOp } from '../../api/wordpress';
import { beheerKleuren as k, datumTekst, tijd } from '../../components/beheer/hulp';
import { ClubLogo, Keuzes } from '../../components/beheer/onderdelen';
import { useTablet } from '../../constants/scherm';

const GEEL = '#f5c400';

export default function LivescoreScherm() {
  const boven = useSafeAreaInsets().top;
  // Tablet (ontwerp iPad · 7): "Deze ronde" en "Eerdere uitslagen" naast elkaar, zonder tabs.
  const tablet = useTablet();
  const breedte = tablet ? styles.breedteTablet : styles.breedte;
  const [tab, setTab] = useState('ronde');
  const [data, setData] = useState(null);
  const [fout, setFout] = useState(null);
  const [verversen, setVerversen] = useState(false);

  const ophalen = useCallback(async () => {
    try {
      setData(await haalLivescoreOp());
      setFout(null);
    } catch (e) {
      setFout(e.message);
    }
  }, []);

  const live = !!data?.live;

  // Alleen ophalen zolang dit scherm open is.
  useFocusEffect(
    useCallback(() => {
      ophalen();
      const timer = setInterval(ophalen, (live ? 10 : 60) * 1000);
      return () => clearInterval(timer);
    }, [ophalen, live])
  );

  const datum = data?.klassen[0]?.datum;

  const titel = (
    <>
      <Text style={styles.titel} accessibilityRole="header">
        Live score
      </Text>
      {datum && <Text style={styles.ondertitel}>Laatste speelronde · {datumTekst(datum).toLowerCase()}</Text>}
    </>
  );

  return (
    <View style={[styles.scherm, tablet && styles.schermTablet]}>
      {/* Op de tablet geen vaste kopbalk: de titel staat boven de kolommen en scrolt mee (ontwerp iPad · 7). */}
      {!tablet && (
        <View style={[styles.kop, { paddingTop: boven + 16 }]}>
          <View style={breedte}>
            {titel}
            <View style={styles.tabs}>
              <Keuzes
                opties={[
                  { waarde: 'ronde', tekst: 'Deze ronde' },
                  { waarde: 'eerder', tekst: 'Eerdere uitslagen' },
                ]}
                gekozen={tab}
                onKies={setTab}
              />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[breedte, styles.inhoud, tablet && { paddingTop: boven + 32, paddingHorizontal: 32 }]}
        refreshControl={
          tab === 'ronde' || tablet ? (
            <RefreshControl
              refreshing={verversen}
              onRefresh={async () => {
                setVerversen(true);
                await ophalen();
                setVerversen(false);
              }}
            />
          ) : undefined
        }
      >
        {tablet ? (
          <>
            <View style={styles.titelTablet}>{titel}</View>
            <View style={styles.kolommen}>
              <View style={styles.kolom}>
                <DezeRonde data={data} fout={fout} />
              </View>
              <View style={styles.kolom}>
                <Text style={styles.kolomTitel} accessibilityRole="header">
                  Eerdere uitslagen
                </Text>
                <EerdereUitslagen livescore={data} />
              </View>
            </View>
          </>
        ) : tab === 'ronde' ? (
          <DezeRonde data={data} fout={fout} />
        ) : (
          <EerdereUitslagen livescore={data} />
        )}
      </ScrollView>
    </View>
  );
}

function DezeRonde({ data, fout }) {
  const klassen = data?.klassen ?? [];
  const nogBezig = klassen.some((klasse) => klasse.wedstrijden.some((w) => w.status !== 'afgelopen'));

  return (
    <>
      {/* Een oude stand blijft staan als verversen even mislukt; de melding staat erboven. */}
      {fout && <Text style={styles.fout}>{fout}</Text>}
      {!data && !fout && <ActivityIndicator color={k.groen} style={styles.laden} />}
      {data && klassen.length === 0 && (
        <Text style={styles.leeg}>Er zijn nog geen wedstrijden gespeeld dit seizoen.</Text>
      )}

      {klassen.length > 0 && (
        <>
          {/* shortcut: de datum van de eerste klasse staat in de balk; spelen klassen op verschillende dagen, zet de datum dan per klasse. */}
          <View style={styles.balk}>
            <Text style={styles.balkTekst}>
              {datumTekst(klassen[0].datum)} {nogBezig ? 'worden' : 'zijn'} de volgende competitiewedstrijden
              gespeeld
            </Text>
          </View>

          <View style={styles.kaart}>
            {klassen.map((klasse) => (
              <View key={klasse.id}>
                <KlasseNaam naam={klasse.naam} />
                {klasse.wedstrijden.map((wedstrijd, i) => (
                  <Wedstrijd key={wedstrijd.id} wedstrijd={wedstrijd} eerste={i === 0} />
                ))}
              </View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

function KlasseNaam({ naam, lijn = true }) {
  return (
    <View style={[styles.klasse, !lijn && { borderBottomWidth: 0, paddingTop: 16 }]}>
      <View style={styles.klassePil}>
        <Text style={styles.klasseTekst}>{naam}</Text>
      </View>
    </View>
  );
}

// "Afgelopen", "Rust", "Live 67'" of "Aftrap 14:30", onder de score.
function statusTekst(wedstrijd) {
  switch (wedstrijd.status) {
    case 'afgelopen':
      return 'Afgelopen';
    case 'rust':
      return 'Rust';
    case 'bezig':
      return `● Live${wedstrijd.minuut_tekst ? ` ${wedstrijd.minuut_tekst}'` : ''}`;
    default:
      return `Aftrap ${tijd(wedstrijd.aftrap)}`;
  }
}

function Wedstrijd({ wedstrijd, eerste }) {
  const { score, rust, status, gebeurtenissen } = wedstrijd;
  const gepland = status === 'gepland';
  const scoreTekst = gepland ? '-' : `${score.thuis} - ${score.uit}`;

  return (
    <View
      style={[styles.wedstrijd, !eerste && styles.wedstrijdLijn]}
      accessible
      accessibilityLabel={`${wedstrijd.thuis.naam} tegen ${wedstrijd.uit.naam}, ${scoreTekst}, ${statusTekst(wedstrijd)}`}
    >
      <View style={styles.rij}>
        <Club club={wedstrijd.thuis} />
        <View style={styles.midden}>
          <Text style={styles.score}>{scoreTekst}</Text>
          <Text style={[styles.status, status === 'bezig' && { color: k.liveRood, fontWeight: '700' }]}>
            {statusTekst(wedstrijd)}
          </Text>
          {rust && status !== 'rust' && !gepland && (
            <Text style={styles.status}>
              rust {rust.thuis}-{rust.uit}
            </Text>
          )}
        </View>
        <Club club={wedstrijd.uit} />
      </View>

      {gebeurtenissen.length > 0 && (
        <View style={styles.gebeurtenissen}>
          {['thuis', 'uit'].map((kant) => (
            <View key={kant} style={[styles.kant, kant === 'uit' && { alignItems: 'flex-end' }]}>
              {gebeurtenissen
                .filter((g) => g.kant === kant)
                .map((g) => (
                  <View key={g.id} style={styles.gebeurtenis}>
                    <Icoon type={g.type} />
                    <Text style={styles.gebeurtenisTekst}>
                      <Text style={styles.minuut}>{g.minuut_tekst}'</Text>
                      {g.speler ? `  ${g.speler}` : ''}
                    </Text>
                  </View>
                ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Club({ club }) {
  return (
    <View style={styles.club}>
      <ClubLogo logo={club.logo} grootte={44} />
      <Text style={styles.clubNaam} numberOfLines={2}>
        {club.naam}
      </Text>
    </View>
  );
}

function Icoon({ type }) {
  if (type === 'doelpunt') {
    return <MaterialCommunityIcons name="soccer" size={15} color={k.groen} accessibilityLabel="Doelpunt" />;
  }
  return (
    <View
      style={[styles.kaartje, { backgroundColor: type === 'rood' ? k.rood : GEEL }]}
      accessibilityLabel={type === 'rood' ? 'Rode kaart' : 'Gele kaart'}
    />
  );
}

function EerdereUitslagen({ livescore }) {
  const [klassen, setKlassen] = useState(null);
  const [klasseId, setKlasseId] = useState(null);
  const [uitslagen, setUitslagen] = useState(null);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    haalKlassenOp()
      .then((lijst) => {
        setKlassen(lijst);
        setKlasseId(lijst[0]?.id ?? null);
      })
      .catch((e) => setFout(e.message));
  }, []);

  useEffect(() => {
    if (klasseId == null) return;
    let actief = true;
    setUitslagen(null);
    haalUitslagenOp(klasseId)
      .then((antwoord) => actief && (setUitslagen(antwoord), setFout(null)))
      .catch((e) => actief && setFout(e.message));
    return () => {
      actief = false;
    };
  }, [klasseId]);

  // De laatste speelronde staat al onder "Deze ronde".
  const huidigeDatum = livescore?.klassen.find((kl) => kl.id === klasseId)?.datum;
  const speelrondes = uitslagen?.speelrondes.filter((r) => r.datum !== huidigeDatum) ?? [];

  return (
    <>
      {fout && <Text style={styles.fout}>{fout}</Text>}
      {!klassen && !fout && <ActivityIndicator color={k.groen} style={styles.laden} />}

      {klassen?.length > 0 && (
        <View style={styles.chips}>
          {klassen.map((klasse) => {
            const actief = klasse.id === klasseId;
            return (
              <Pressable
                key={klasse.id}
                onPress={() => setKlasseId(klasse.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: actief }}
                style={[styles.chip, actief && styles.chipActief]}
              >
                <Text style={[styles.chipTekst, actief && { color: k.wit }]}>{klasse.korte_naam}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {uitslagen && (
        <>
          <KlasseNaam naam={uitslagen.klasse.naam} lijn={false} />
          {speelrondes.length === 0 && <Text style={styles.leeg}>Nog geen eerdere uitslagen in deze klasse.</Text>}
          {speelrondes.map((ronde) => (
            <View key={ronde.datum}>
              <Text style={styles.rondeDatum}>{datumTekst(ronde.datum)}</Text>
              <View style={[styles.kaart, styles.uitslagen]}>
                {ronde.wedstrijden.map((w, i) => (
                  <View key={w.id} style={[styles.uitslag, i > 0 && styles.uitslagLijn]}>
                    <ClubLogo logo={w.thuis.logo} grootte={24} />
                    <Text style={styles.uitslagNaam} numberOfLines={1}>
                      {w.thuis.naam}
                    </Text>
                    <Text style={styles.uitslagScore}>
                      {w.score.thuis} - {w.score.uit}
                    </Text>
                    <Text style={[styles.uitslagNaam, { textAlign: 'right' }]} numberOfLines={1}>
                      {w.uit.naam}
                    </Text>
                    <ClubLogo logo={w.uit.logo} grootte={24} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
      {klasseId != null && !uitslagen && !fout && <ActivityIndicator color={k.groen} style={styles.laden} />}
    </>
  );
}

const styles = StyleSheet.create({
  scherm: {
    flex: 1,
    backgroundColor: k.achtergrond,
  },
  breedte: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  schermTablet: {
    backgroundColor: k.wit,
  },
  titelTablet: {
    marginBottom: 20,
  },
  breedteTablet: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  kolommen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  kolom: {
    flex: 1,
  },
  kolomTitel: {
    fontSize: 22,
    fontWeight: '900',
    color: k.zwart,
    marginBottom: 12,
  },
  kop: {
    backgroundColor: k.wit,
    borderBottomWidth: 1,
    borderBottomColor: k.rand,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  titel: {
    fontSize: 32,
    fontWeight: '900',
    color: k.zwart,
  },
  ondertitel: {
    fontSize: 15,
    color: k.grijs,
    marginTop: 2,
  },
  tabs: {
    marginTop: 14,
  },
  inhoud: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  fout: {
    color: k.liveRood,
    fontSize: 15,
    marginBottom: 12,
  },
  laden: {
    marginTop: 32,
  },
  leeg: {
    color: k.grijs,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  balk: {
    backgroundColor: k.groen,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  balkTekst: {
    fontSize: 16,
    fontWeight: '800',
    color: k.zwart,
    textAlign: 'center',
  },
  kaart: {
    backgroundColor: k.wit,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  klasse: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: k.rand,
    marginBottom: 4,
  },
  klassePil: {
    backgroundColor: k.lichtgroen,
    borderWidth: 1,
    borderColor: k.rand,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  klasseTekst: {
    fontSize: 15,
    fontWeight: '900',
    color: k.zwart,
  },
  wedstrijd: {
    paddingTop: 14,
    paddingBottom: 16,
  },
  wedstrijdLijn: {
    borderTopWidth: 1,
    borderTopColor: k.rand,
  },
  rij: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  club: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  clubNaam: {
    fontSize: 16,
    color: k.zwart,
    textAlign: 'center',
  },
  midden: {
    width: 100,
    alignItems: 'center',
  },
  score: {
    fontSize: 26,
    fontWeight: '500',
    color: k.zwart,
    marginBottom: 2,
  },
  status: {
    fontSize: 13,
    color: k.grijs,
  },
  gebeurtenissen: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  kant: {
    flex: 1,
    gap: 6,
  },
  gebeurtenis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gebeurtenisTekst: {
    fontSize: 15,
    color: k.zwart,
  },
  minuut: {
    fontWeight: '800',
  },
  kaartje: {
    width: 10,
    height: 14,
    borderRadius: 2,
    marginHorizontal: 2.5,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: k.rand,
    backgroundColor: k.lichtgroen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActief: {
    backgroundColor: k.zwart,
    borderColor: k.zwart,
  },
  chipTekst: {
    fontSize: 15,
    fontWeight: '800',
    color: k.zwart,
  },
  rondeDatum: {
    fontSize: 18,
    fontWeight: '900',
    color: k.zwart,
    marginTop: 20,
    marginBottom: 10,
  },
  uitslagen: {
    paddingBottom: 0,
  },
  uitslag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  uitslagLijn: {
    borderTopWidth: 1,
    borderTopColor: k.rand,
  },
  uitslagNaam: {
    flex: 1,
    fontSize: 15,
    color: k.zwart,
  },
  uitslagScore: {
    fontSize: 18,
    fontWeight: '500',
    color: k.zwart,
    minWidth: 52,
    textAlign: 'center',
  },
});
