import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { haalNieuwsOp } from '../../api/wordpress';
import { kleuren } from '../../constants/kleuren';

// Voorbeeld van data ophalen uit WordPress. Gebruik dit als patroon voor andere schermen.
export default function NieuwsScherm() {
  const [berichten, setBerichten] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    haalNieuwsOp()
      .then(setBerichten)
      .catch((e) => setFout(e.message))
      .finally(() => setLaden(false));
  }, []);

  if (laden) {
    return (
      <View style={styles.midden}>
        <ActivityIndicator color={kleuren.groen} />
      </View>
    );
  }

  if (fout) {
    return (
      <View style={styles.midden}>
        <Text>{fout}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={berichten}
      keyExtractor={(bericht) => String(bericht.id)}
      renderItem={({ item }) => (
        <Link href={`/nieuws/${item.id}`} asChild>
          <Pressable style={styles.bericht}>
            <Text style={styles.titel}>{item.title.rendered}</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  midden: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bericht: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3ead8',
    backgroundColor: kleuren.wit,
  },
  titel: {
    fontSize: 16,
    color: kleuren.zwart,
  },
});
