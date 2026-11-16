import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Placeholder from '../../components/Placeholder';
import { kleuren } from '../../constants/kleuren';

export default function InfoScherm() {
  return (
    <View style={styles.scherm}>
      <Placeholder
        titel="Info"
        uitleg="Contactgegevens, programmering en informatie over NEO Radio."
      />
      {/* Ingang naar het beheer (live score invoeren). Laat deze link staan als je dit
          scherm ontwerpt; hij mag onderaan, klein en rustig. */}
      <Link href="/beheer" style={styles.medewerkers}>
        <Text style={styles.medewerkersTekst}>Medewerker? Live score invoeren ›</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  scherm: {
    flex: 1,
    backgroundColor: kleuren.achtergrond,
  },
  medewerkers: {
    alignSelf: 'center',
    padding: 16,
    marginBottom: 8,
  },
  medewerkersTekst: {
    fontSize: 15,
    fontWeight: '600',
    color: kleuren.grijs,
  },
});
