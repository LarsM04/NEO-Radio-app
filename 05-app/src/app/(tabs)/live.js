import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { kleuren } from '../../constants/kleuren';

// Keuzescherm: live luisteren of live kijken.
export default function LiveScherm() {
  return (
    <View style={styles.container}>
      <Link href="/live/luisteren" asChild>
        <Pressable style={styles.knop}>
          <Text style={styles.knopTekst}>Live luisteren</Text>
        </Pressable>
      </Link>
      <Link href="/live/kijken" asChild>
        <Pressable style={styles.knop}>
          <Text style={styles.knopTekst}>Live kijken</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: kleuren.achtergrond,
  },
  knop: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: kleuren.groen,
  },
  knopTekst: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: kleuren.wit,
  },
});
