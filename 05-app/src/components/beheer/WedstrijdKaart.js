// Eén wedstrijd in de lijst "Mijn wedstrijden" (ontwerp, Beheer · 13).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { beheerKleuren as k } from './hulp';
import { ClubLogo, Knop, StatusLabel } from './onderdelen';

export default function WedstrijdKaart({ wedstrijd, minuut, magOvernemen, bezig, onOpen, onBijhouden }) {
  const { door_mij: doorMij, bijgehouden_door: door, score } = wedstrijd;
  const vrij = !door;

  return (
    <Pressable
      onPress={doorMij ? onOpen : undefined}
      disabled={!doorMij}
      accessibilityRole={doorMij ? 'button' : undefined}
      style={({ pressed }) => [styles.kaart, pressed && { opacity: 0.85 }]}
    >
      {['thuis', 'uit'].map((kant) => (
        <View key={kant} style={styles.club}>
          <ClubLogo logo={wedstrijd[kant].logo} grootte={30} />
          <Text style={styles.naam} numberOfLines={1}>
            {wedstrijd[kant].naam}
          </Text>
          <Text style={styles.score}>{score ? score[kant] : '–'}</Text>
        </View>
      ))}

      <View style={styles.voet}>
        <StatusLabel wedstrijd={wedstrijd} minuut={minuut} />
        <Text style={styles.wie} numberOfLines={2}>
          {doorMij ? 'Jij houdt deze bij' : vrij ? 'Nog niemand' : `${door.naam} houdt deze bij`}
        </Text>
        {doorMij && (
          <View style={styles.jij}>
            <Text style={styles.jijTekst}>Jij</Text>
            <Text style={styles.pijl}>›</Text>
          </View>
        )}
        {vrij && <Knop tekst="Bijhouden" onPress={onBijhouden} bezig={bezig} style={styles.knop} />}
        {!vrij && !doorMij && magOvernemen && (
          <Knop tekst="Overnemen" soort="rand" onPress={onBijhouden} bezig={bezig} style={styles.knop} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kaart: {
    backgroundColor: k.wit,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    padding: 14,
    marginBottom: 12,
  },
  club: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  naam: {
    flex: 1,
    fontSize: 17,
    color: k.zwart,
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
    color: k.zwart,
    minWidth: 20,
    textAlign: 'right',
  },
  voet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  wie: {
    flex: 1,
    fontSize: 14,
    color: k.grijs,
  },
  jij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jijTekst: {
    backgroundColor: k.groen,
    color: k.zwart,
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pijl: {
    fontSize: 26,
    color: k.zwart,
  },
  knop: {
    minHeight: 44,
  },
});
