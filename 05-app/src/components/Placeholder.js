import { StyleSheet, Text, View } from 'react-native';

import { kleuren } from '../constants/kleuren';

// Tijdelijk scherm. Vervang dit door je eigen scherm zodra je eraan begint.
export default function Placeholder({ titel, uitleg }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titel}>{titel}</Text>
      {uitleg ? <Text style={styles.uitleg}>{uitleg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: kleuren.achtergrond,
  },
  titel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: kleuren.zwart,
  },
  uitleg: {
    marginTop: 8,
    textAlign: 'center',
    color: kleuren.grijs,
  },
});
