// Melding na een +1 (ontwerp, Beheer · 13): het doelpunt staat al in de app. Acht seconden
// lang kun je het ongedaan maken of de speler toevoegen. Daarna verdwijnt de melding.
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { beheerKleuren as k } from './hulp';

const SECONDEN = 8;

// melding: { tekst } of null
export default function DoelpuntMelding({ melding, onSpeler, onOngedaan, onWeg }) {
  useEffect(() => {
    if (!melding) {
      return undefined;
    }
    const klok = setTimeout(onWeg, SECONDEN * 1000);
    return () => clearTimeout(klok);
  }, [melding, onWeg]);

  if (!melding) {
    return null;
  }

  return (
    <View style={styles.melding} accessibilityLiveRegion="polite">
      <View style={styles.kop}>
        <Text style={styles.bal}>⚽</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.titel}>{melding.tekst}</Text>
          <Text style={styles.klein}>Staat nu in de app</Text>
        </View>
      </View>
      <View style={styles.knoppen}>
        <Pressable style={[styles.knop, styles.knopGroen]} onPress={onSpeler} accessibilityRole="button">
          <Text style={styles.knopTekstDonker}>Speler toevoegen</Text>
        </Pressable>
        <Pressable style={[styles.knop, styles.knopRand]} onPress={onOngedaan} accessibilityRole="button">
          <Text style={styles.knopTekstLicht}>↶ Ongedaan maken</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  melding: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: k.zwart,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  kop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  bal: {
    fontSize: 22,
  },
  titel: {
    color: k.wit,
    fontSize: 16,
    fontWeight: '800',
  },
  klein: {
    color: '#c9c9c9',
    fontSize: 14,
  },
  knoppen: {
    flexDirection: 'row',
    gap: 10,
  },
  knop: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  knopGroen: {
    backgroundColor: k.groen,
  },
  knopRand: {
    borderWidth: 1.5,
    borderColor: k.wit,
  },
  knopTekstDonker: {
    color: k.zwart,
    fontSize: 15,
    fontWeight: '800',
  },
  knopTekstLicht: {
    color: k.wit,
    fontSize: 15,
    fontWeight: '800',
  },
});
