// Onderblad om een doelpunt of kaart toe te voegen of aan te passen (ontwerp, Beheer · 14).
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { beheerKleuren as k, EINDE_HELFT, huidigeMinuut, NAAM_VAN_TYPE, tijd } from './hulp';
import { Keuzes, Knop, OnderBlad } from './onderdelen';

const SOORTEN = [
  { waarde: 'doelpunt', tekst: 'Doelpunt' },
  { waarde: 'geel', tekst: 'Gele kaart' },
  { waarde: 'rood', tekst: 'Rode kaart' },
];

// Hoeveel bekende spelers we als knop laten zien.
const MAX_SPELERS = 8;

// gebeurtenis: een bestaande gebeurtenis (met id) om aan te passen,
// of een nieuwe zonder id, bijvoorbeeld { type: 'geel' }.
export default function GebeurtenisBlad({ wedstrijd, gebeurtenis, onOpslaan, onVerwijder, onSluit }) {
  const [type, setType] = useState('doelpunt');
  const [kant, setKant] = useState('thuis');
  const [minuut, setMinuut] = useState(null);
  const [extra, setExtra] = useState(null); // blessuretijd: 45+2 is minuut 45, extra 2
  const [speler, setSpeler] = useState('');
  const [bezig, setBezig] = useState(false);

  const nieuw = !gebeurtenis?.id;

  // Elke keer dat het blad opengaat, de velden opnieuw vullen.
  useEffect(() => {
    if (gebeurtenis) {
      const voorstel = gebeurtenis.id ? gebeurtenis : huidigeMinuut(wedstrijd);
      setType(gebeurtenis.type || 'doelpunt');
      setKant(gebeurtenis.kant || 'thuis');
      setMinuut(voorstel?.minuut ?? null);
      setExtra(voorstel?.extra ?? null);
      setSpeler(gebeurtenis.speler || '');
      setBezig(false);
    }
  }, [gebeurtenis, wedstrijd]);

  if (!wedstrijd) {
    return null;
  }

  async function opslaan() {
    setBezig(true);
    const gelukt = await onOpslaan({ type, kant, minuut, extra, speler: speler.trim() });
    if (!gelukt) {
      setBezig(false);
    }
  }

  async function verwijderen() {
    setBezig(true);
    const gelukt = await onVerwijder();
    if (!gelukt) {
      setBezig(false);
    }
  }

  function minuutAanpassen(verschil) {
    const basis = minuut ?? huidigeMinuut(wedstrijd)?.minuut ?? (verschil > 0 ? 0 : 2);
    const nieuweMinuut = Math.min(130, Math.max(1, basis + verschil));
    setMinuut(nieuweMinuut);
    // Blessuretijd hoort alleen bij de 45e en 90e minuut.
    if (!EINDE_HELFT.includes(nieuweMinuut)) {
      setExtra(null);
    }
  }

  function extraAanpassen(verschil) {
    const nieuw = Math.min(30, (extra ?? 0) + verschil);
    setExtra(nieuw > 0 ? nieuw : null);
  }

  // Bekende spelers van de gekozen ploeg, gefilterd op wat je al hebt getypt.
  const zoek = speler.trim().toLowerCase();
  const bekend = (wedstrijd.spelers?.[kant] || [])
    .filter((naam) => naam.toLowerCase() !== zoek && naam.toLowerCase().includes(zoek))
    .slice(0, MAX_SPELERS);

  const minuutTekst = minuut ? `${minuut}${extra ? `+${extra}` : ''}'` : '–';
  const blessuretijdMogelijk = EINDE_HELFT.includes(minuut);

  return (
    <OnderBlad
      zichtbaar={!!gebeurtenis}
      titel={`${NAAM_VAN_TYPE[type]} ${nieuw ? 'toevoegen' : 'aanpassen'}`}
      onSluit={onSluit}
    >
      {!nieuw && <Origineel wedstrijd={wedstrijd} gebeurtenis={gebeurtenis} />}

      <Text style={styles.veldnaam}>Soort</Text>
      <Keuzes opties={SOORTEN} gekozen={type} onKies={setType} />

      <Text style={styles.veldnaam}>Ploeg</Text>
      <View style={styles.rij}>
        {['thuis', 'uit'].map((optie) => {
          const actief = kant === optie;
          return (
            <Pressable
              key={optie}
              onPress={() => setKant(optie)}
              accessibilityRole="button"
              accessibilityState={{ selected: actief }}
              style={[styles.ploeg, actief && styles.ploegActief]}
            >
              <Text style={styles.ploegTekst} numberOfLines={1}>
                {actief ? '✓ ' : ''}
                {wedstrijd[optie].naam}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.veldnaam}>Minuut</Text>
      <View style={styles.rij}>
        <Stapknop tekst="−" label="Minuut lager" onPress={() => minuutAanpassen(-1)} />
        <View style={styles.minuut}>
          <Text style={styles.minuutTekst}>{minuutTekst}</Text>
        </View>
        <Stapknop tekst="+" label="Minuut hoger" onPress={() => minuutAanpassen(1)} />
      </View>

      {blessuretijdMogelijk && (
        <View style={[styles.rij, styles.blessuretijd]}>
          <Text style={styles.blessuretijdTekst}>Blessuretijd</Text>
          <Stapknop tekst="−" label="Minder blessuretijd" klein onPress={() => extraAanpassen(-1)} />
          <Text style={styles.blessuretijdWaarde}>{extra ? `+${extra}` : 'geen'}</Text>
          <Stapknop tekst="+" label="Meer blessuretijd" klein onPress={() => extraAanpassen(1)} />
        </View>
      )}
      <Text style={styles.hint}>
        {minuut === null
          ? 'Geen minuut ingevuld. Dat mag.'
          : `Voorgesteld vanaf de aftrap om ${tijd(wedstrijd.aftrap)}`}
      </Text>

      <Text style={styles.veldnaam}>Speler (niet verplicht)</Text>
      <TextInput
        value={speler}
        onChangeText={setSpeler}
        placeholder="Naam van de speler"
        placeholderTextColor="#8a8a8a"
        style={styles.invoer}
        maxLength={100}
        autoCapitalize="words"
        returnKeyType="done"
      />
      {bekend.length > 0 && (
        <View style={styles.spelers}>
          {bekend.map((naam) => (
            <Pressable
              key={naam}
              onPress={() => setSpeler(naam)}
              accessibilityRole="button"
              accessibilityLabel={`Speler ${naam}`}
              style={({ pressed }) => [styles.speler, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.spelerTekst}>{naam}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Knop tekst="Opslaan" onPress={opslaan} bezig={bezig} style={{ marginTop: 20 }} />
      {!nieuw && (
        <Pressable onPress={verwijderen} disabled={bezig} style={styles.verwijder} accessibilityRole="button">
          <Text style={styles.verwijderTekst}>🗑 Verwijderen</Text>
        </Pressable>
      )}
    </OnderBlad>
  );
}

// Bovenaan bij het aanpassen: welke gebeurtenis je hebt geopend, zoals hij nu is opgeslagen.
// Bij een doelpunt ook de stand die het werd, zodat je twee doelpunten van dezelfde
// club uit elkaar houdt.
function Origineel({ wedstrijd, gebeurtenis }) {
  const icoon = { doelpunt: '⚽', geel: '🟨', rood: '🟥' }[gebeurtenis.type];
  const minuut = gebeurtenis.minuut_tekst ? `${gebeurtenis.minuut_tekst}' · ` : '';
  const regels = [`${NAAM_VAN_TYPE[gebeurtenis.type]} ${wedstrijd[gebeurtenis.kant].naam}`];
  if (gebeurtenis.speler) {
    regels.push(gebeurtenis.speler);
  }
  const stand = gebeurtenis.type === 'doelpunt' ? standNaDoelpunt(wedstrijd, gebeurtenis.id) : null;

  return (
    <View style={styles.origineel} accessibilityLabel={`Je past aan: ${minuut}${regels.join(', ')}`}>
      <Text style={styles.origineelIcoon}>{icoon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.origineelKop}>Je past aan</Text>
        <Text style={styles.origineelTekst}>
          {minuut}
          {regels.join(' · ')}
        </Text>
        {stand && (
          <Text style={styles.origineelStand}>
            Maakte het {stand.thuis}-{stand.uit}
          </Text>
        )}
      </View>
    </View>
  );
}

// De stand direct na een doelpunt: alle doelpunten tot en met dit doelpunt, op volgorde van minuut.
function standNaDoelpunt(wedstrijd, doelpuntId) {
  const opVolgorde = [...wedstrijd.gebeurtenissen].sort(
    (a, b) => (a.minuut ?? 0) - (b.minuut ?? 0) || (a.extra ?? 0) - (b.extra ?? 0) || a.id - b.id
  );
  const stand = { thuis: 0, uit: 0 };
  for (const g of opVolgorde) {
    if (g.type === 'doelpunt') {
      stand[g.kant] += 1;
    }
    if (g.id === doelpuntId) {
      return stand;
    }
  }
  return null;
}

function Stapknop({ tekst, label, onPress, klein = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.stap, klein && styles.stapKlein]}
    >
      <Text style={styles.stapTekst}>{tekst}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  origineel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: k.lichtgroen,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: k.rand,
    padding: 12,
    marginBottom: 2,
  },
  origineelIcoon: {
    fontSize: 24,
  },
  origineelKop: {
    fontSize: 13,
    fontWeight: '700',
    color: k.grijs,
  },
  origineelTekst: {
    fontSize: 17,
    fontWeight: '700',
    color: k.zwart,
    marginTop: 2,
  },
  origineelStand: {
    fontSize: 15,
    color: k.zwart,
    marginTop: 2,
  },
  veldnaam: {
    fontSize: 15,
    fontWeight: '700',
    color: k.zwart,
    marginTop: 14,
    marginBottom: 8,
  },
  rij: {
    flexDirection: 'row',
    gap: 10,
  },
  ploeg: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: k.rand,
    backgroundColor: k.lichtgroen,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ploegActief: {
    backgroundColor: k.groen,
    borderColor: k.groen,
  },
  ploegTekst: {
    fontSize: 16,
    fontWeight: '700',
    color: k.zwart,
  },
  stap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: k.lichtgroen,
    borderWidth: 1,
    borderColor: k.rand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stapKlein: {
    width: 48,
    height: 48,
  },
  stapTekst: {
    fontSize: 24,
    color: k.zwart,
  },
  minuut: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuutTekst: {
    fontSize: 24,
    fontWeight: '800',
    color: k.zwart,
  },
  blessuretijd: {
    alignItems: 'center',
    marginTop: 10,
  },
  blessuretijdTekst: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: k.zwart,
  },
  blessuretijdWaarde: {
    minWidth: 52,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: k.zwart,
  },
  hint: {
    marginTop: 6,
    fontSize: 14,
    color: k.grijs,
  },
  invoer: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    paddingHorizontal: 14,
    fontSize: 17,
    color: k.zwart,
  },
  spelers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  speler: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: k.rand,
    backgroundColor: k.lichtgroen,
    justifyContent: 'center',
  },
  spelerTekst: {
    fontSize: 15,
    fontWeight: '600',
    color: k.zwart,
  },
  verwijder: {
    marginTop: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verwijderTekst: {
    fontSize: 16,
    fontWeight: '700',
    color: k.rood,
  },
});
