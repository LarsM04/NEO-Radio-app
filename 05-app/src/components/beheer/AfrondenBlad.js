// Onderblad "Wedstrijd afronden?" (ontwerp, Beheer · 14). Afgelopen vraagt eerst om
// bevestiging, zodat je niet per ongeluk afrondt.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { beheerKleuren as k } from './hulp';
import { Knop, OnderBlad } from './onderdelen';

export default function AfrondenBlad({ wedstrijd, zichtbaar, onAfronden, onSluit }) {
  const [bezig, setBezig] = useState(false);

  if (!wedstrijd) {
    return null;
  }
  const score = wedstrijd.score || { thuis: 0, uit: 0 };

  async function afronden() {
    setBezig(true);
    await onAfronden();
    setBezig(false);
  }

  return (
    <OnderBlad zichtbaar={zichtbaar} titel="Wedstrijd afronden?" onSluit={onSluit}>
      <View style={styles.uitslag}>
        <Text style={styles.club} numberOfLines={2}>
          {wedstrijd.thuis.naam}
        </Text>
        <Text style={styles.score}>
          {score.thuis} - {score.uit}
        </Text>
        <Text style={[styles.club, { textAlign: 'right' }]} numberOfLines={2}>
          {wedstrijd.uit.naam}
        </Text>
      </View>
      <Text style={styles.klein}>
        Eindstand
        {wedstrijd.rust ? ` · ruststand ${wedstrijd.rust.thuis}-${wedstrijd.rust.uit}` : ''}
      </Text>
      <Text style={styles.uitleg}>
        De uitslag staat daarna als Afgelopen in de app. Een fout gezien? Gebeurtenissen kun je
        daarna nog aanpassen.
      </Text>
      <Knop tekst="Ja, afronden" onPress={afronden} bezig={bezig} />
      <Knop tekst="Nog niet" soort="rand" onPress={onSluit} style={{ marginTop: 10 }} />
    </OnderBlad>
  );
}

const styles = StyleSheet.create({
  uitslag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: k.lichtgroen,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  club: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: k.zwart,
  },
  score: {
    fontSize: 30,
    fontWeight: '800',
    color: k.zwart,
  },
  klein: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: k.grijs,
  },
  uitleg: {
    fontSize: 16,
    lineHeight: 23,
    color: k.zwart,
    marginVertical: 16,
  },
});
