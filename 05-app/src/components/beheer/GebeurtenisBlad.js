// Onderblad om een doelpunt of kaart toe te voegen of aan te passen (ontwerp, Beheer · 14).
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { beheerKleuren as k, huidigeMinuut, NAAM_VAN_TYPE, tijd } from './hulp';
import { Keuzes, Knop, OnderBlad } from './onderdelen';

const SOORTEN = [
  { waarde: 'doelpunt', tekst: 'Doelpunt' },
  { waarde: 'geel', tekst: 'Gele kaart' },
  { waarde: 'rood', tekst: 'Rode kaart' },
];

// gebeurtenis: een bestaande gebeurtenis (met id) om aan te passen,
// of een nieuwe zonder id, bijvoorbeeld { type: 'geel' }.
export default function GebeurtenisBlad({ wedstrijd, gebeurtenis, onOpslaan, onVerwijder, onSluit }) {
  const [type, setType] = useState('doelpunt');
  const [kant, setKant] = useState('thuis');
  const [minuut, setMinuut] = useState(null);
  const [speler, setSpeler] = useState('');
  const [bezig, setBezig] = useState(false);

  const nieuw = !gebeurtenis?.id;

  // Elke keer dat het blad opengaat, de velden opnieuw vullen.
  useEffect(() => {
    if (gebeurtenis) {
      setType(gebeurtenis.type || 'doelpunt');
      setKant(gebeurtenis.kant || 'thuis');
      setMinuut(gebeurtenis.id ? gebeurtenis.minuut : huidigeMinuut(wedstrijd));
      setSpeler(gebeurtenis.speler || '');
      setBezig(false);
    }
  }, [gebeurtenis, wedstrijd]);

  if (!wedstrijd) {
    return null;
  }

  async function opslaan() {
    setBezig(true);
    const gelukt = await onOpslaan({ type, kant, minuut, speler: speler.trim() });
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
    const basis = minuut ?? huidigeMinuut(wedstrijd) ?? (verschil > 0 ? 0 : 2);
    setMinuut(Math.min(130, Math.max(1, basis + verschil)));
  }

  return (
    <OnderBlad
      zichtbaar={!!gebeurtenis}
      titel={`${NAAM_VAN_TYPE[type]} ${nieuw ? 'toevoegen' : 'aanpassen'}`}
      onSluit={onSluit}
    >
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
        <Pressable style={styles.stap} onPress={() => minuutAanpassen(-1)} accessibilityLabel="Minuut lager">
          <Text style={styles.stapTekst}>−</Text>
        </Pressable>
        <View style={styles.minuut}>
          <Text style={styles.minuutTekst}>{minuut ? `${minuut}'` : '–'}</Text>
        </View>
        <Pressable style={styles.stap} onPress={() => minuutAanpassen(1)} accessibilityLabel="Minuut hoger">
          <Text style={styles.stapTekst}>+</Text>
        </Pressable>
      </View>
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

      <Knop tekst="Opslaan" onPress={opslaan} bezig={bezig} style={{ marginTop: 20 }} />
      {!nieuw && (
        <Pressable onPress={verwijderen} disabled={bezig} style={styles.verwijder} accessibilityRole="button">
          <Text style={styles.verwijderTekst}>🗑 Verwijderen</Text>
        </Pressable>
      )}
    </OnderBlad>
  );
}

const styles = StyleSheet.create({
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
