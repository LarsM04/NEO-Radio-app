import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { haalNieuwsOp } from '../../api/wordpress';
import { K, RUBRIEKEN, maakDatum, naarBericht } from '../../lib/nieuwsHelpers';

export default function NieuwsScherm() {
  const [berichten, setBerichten] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(null);
  const [rubriek, setRubriek] = useState('Alles');

  useEffect(() => {
    haalNieuwsOp()
      .then((lijst) => setBerichten(lijst.map(naarBericht)))
      .catch((e) => setFout(e.message))
      .finally(() => setLaden(false));
  }, []);

  const getoond = useMemo(
    () => (rubriek === 'Alles' ? berichten : berichten.filter((b) => b.rubriek === rubriek)),
    [berichten, rubriek]
  );

  return (
    <SafeAreaView style={s.scherm} edges={['top']}>
      <Text style={s.kop} accessibilityRole="header">Nieuws</Text>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.knoppen}>
          {RUBRIEKEN.map((r) => (
            <Pressable key={r} onPress={() => setRubriek(r)} accessibilityRole="button"
              style={[s.knop, r === rubriek && s.knopActief]}>
              <Text style={s.knopTekst}>{r}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {laden ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={K.donkergroen} />
      ) : fout ? (
        <Text style={s.leeg}>{fout}</Text>
      ) : (
        <FlatList
          data={getoond}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          ListEmptyComponent={<Text style={s.leeg}>Er is nog geen nieuws in deze rubriek.</Text>}
          renderItem={({ item }) => (
            <Link href={`/nieuws/${item.id}`} asChild>
              <Pressable style={s.kaart} accessibilityRole="button" accessibilityLabel={`Lees meer: ${item.titel}`}>
                {item.afbeelding ? (
                  <Image source={{ uri: item.afbeelding }} style={s.foto} />
                ) : (
                  <View style={[s.foto, { backgroundColor: K.licht }]} />
                )}
                <View style={{ padding: 16 }}>
                  <Text style={s.rubriek}>{item.rubriek}</Text>
                  <Text style={s.titel}>{item.titel}</Text>
                  <View style={s.rij}>
                    <Text style={s.datum}>{maakDatum(item.datum)}</Text>
                    <Text style={s.meer}>LEES MEER →</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: K.wit },
  kop: { fontSize: 32, fontWeight: '800', color: K.zwart, paddingHorizontal: 16, paddingTop: 8 },
  knoppen: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  knop: {
    minHeight: 48, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 24,
    backgroundColor: K.licht, borderWidth: 1, borderColor: K.rand,
  },
  knopActief: { backgroundColor: K.groen, borderColor: K.groen },
  knopTekst: { fontSize: 16, fontWeight: '700', color: K.zwart },
  kaart: {
    backgroundColor: K.wit, borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  foto: { width: '100%', aspectRatio: 16 / 9 },
  rubriek: { color: K.donkergroen, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  titel: { color: K.zwart, fontWeight: '800', fontSize: 20, lineHeight: 26 },
  rij: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, minHeight: 32 },
  datum: { color: K.grijs, fontSize: 14 },
  meer: { color: K.zwart, fontWeight: '800', fontSize: 13 },
  leeg: { fontSize: 17, color: K.grijs, textAlign: 'center', marginTop: 40, paddingHorizontal: 16 },
});