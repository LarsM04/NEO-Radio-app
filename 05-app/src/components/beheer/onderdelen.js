// Kleine onderdelen die de beheerschermen delen: clublogo, statuslabel, knoppen en een
// onderblad (het venster dat van onderen in beeld schuift).
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { beheerKleuren as k, tijd } from './hulp';

export function ClubLogo({ logo, grootte = 32, opDonker = false }) {
  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={[styles.logo, { width: grootte, height: grootte, borderRadius: grootte / 2 }]}
        resizeMode="contain"
      />
    );
  }
  return (
    <View
      style={[
        styles.logo,
        styles.logoLeeg,
        { width: grootte, height: grootte, borderRadius: grootte / 2 },
        opDonker && { backgroundColor: k.wit, borderColor: k.wit },
      ]}
    />
  );
}

// "● Live 67'", "Rust", "Afgelopen" of "Aftrap 16:30"
export function StatusLabel({ wedstrijd, minuut }) {
  const { status } = wedstrijd;
  if (status === 'bezig') {
    return (
      <View style={[styles.label, { backgroundColor: k.liveRood }]}>
        <Text style={[styles.labelTekst, { color: k.wit }]}>● Live{minuut ? ` ${minuut}'` : ''}</Text>
      </View>
    );
  }
  if (status === 'rust') {
    return (
      <View style={[styles.label, { backgroundColor: k.zwart }]}>
        <Text style={[styles.labelTekst, { color: k.wit }]}>Rust</Text>
      </View>
    );
  }
  if (status === 'afgelopen') {
    return (
      <View style={[styles.label, { backgroundColor: k.donkergroen }]}>
        <Text style={[styles.labelTekst, { color: k.wit }]}>Afgelopen</Text>
      </View>
    );
  }
  return (
    <View style={[styles.label, styles.labelRand]}>
      <Text style={styles.labelTekst}>Aftrap {tijd(wedstrijd.aftrap)}</Text>
    </View>
  );
}

// Knop in drie soorten: 'donker' (donkergroen), 'rand' (wit met rand) en 'licht' (lichtgroen).
export function Knop({ tekst, onPress, soort = 'donker', bezig = false, uit = false, style }) {
  const kleur = {
    donker: { achter: k.donkergroen, tekst: k.wit, rand: k.donkergroen },
    rand: { achter: k.wit, tekst: k.zwart, rand: k.zwart },
    licht: { achter: k.lichtgroen, tekst: k.zwart, rand: k.rand },
  }[soort];

  return (
    <Pressable
      onPress={onPress}
      disabled={uit || bezig}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.knop,
        { backgroundColor: kleur.achter, borderColor: kleur.rand },
        (pressed || uit) && { opacity: 0.6 },
        style,
      ]}
    >
      {bezig ? (
        <ActivityIndicator color={kleur.tekst} />
      ) : (
        <Text style={[styles.knopTekst, { color: kleur.tekst }]}>{tekst}</Text>
      )}
    </Pressable>
  );
}

// Een rij knoppen waarvan er één gekozen is, zoals Gepland | Bezig | Rust | Afgelopen.
export function Keuzes({ opties, gekozen, onKies, uit = false }) {
  return (
    <View style={styles.keuzes}>
      {opties.map((optie) => {
        const actief = optie.waarde === gekozen;
        return (
          <Pressable
            key={optie.waarde}
            onPress={() => !actief && onKies(optie.waarde)}
            disabled={uit}
            accessibilityRole="button"
            accessibilityState={{ selected: actief }}
            style={[styles.keuze, actief && { backgroundColor: k.zwart }]}
          >
            <Text style={[styles.keuzeTekst, actief && { color: k.wit }]}>{optie.tekst}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Onderblad met een titel en een sluitknop.
export function OnderBlad({ zichtbaar, titel, onSluit, children }) {
  return (
    <Modal visible={zichtbaar} transparent animationType="slide" onRequestClose={onSluit}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bladAchtergrond}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluit} accessibilityLabel="Sluiten" />
        <View style={styles.blad}>
          <View style={styles.bladGreep} />
          <View style={styles.bladKop}>
            <Text style={styles.bladTitel}>{titel}</Text>
            <Pressable onPress={onSluit} style={styles.sluit} accessibilityLabel="Sluiten">
              <Text style={styles.sluitTekst}>✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: k.wit,
  },
  logoLeeg: {
    backgroundColor: k.lichtgroen,
    borderWidth: 1,
    borderColor: k.rand,
  },
  label: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  labelRand: {
    borderWidth: 1.5,
    borderColor: k.zwart,
    backgroundColor: k.wit,
  },
  labelTekst: {
    fontSize: 13,
    fontWeight: '700',
    color: k.zwart,
  },
  knop: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knopTekst: {
    fontSize: 16,
    fontWeight: '700',
  },
  keuzes: {
    flexDirection: 'row',
    backgroundColor: k.lichtgroen,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: k.rand,
    padding: 4,
  },
  keuze: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keuzeTekst: {
    fontSize: 15,
    fontWeight: '600',
    color: k.zwart,
  },
  bladAchtergrond: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  blad: {
    backgroundColor: k.wit,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  bladGreep: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d0d0',
    marginBottom: 12,
  },
  bladKop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bladTitel: {
    fontSize: 22,
    fontWeight: '800',
    color: k.zwart,
  },
  sluit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: k.lichtgroen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sluitTekst: {
    fontSize: 18,
    color: k.zwart,
  },
});
