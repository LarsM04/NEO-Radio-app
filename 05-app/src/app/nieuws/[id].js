import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as wordpress from '../../api/wordpress';
import { K, maakDatum, naarBericht } from '../../lib/nieuwsHelpers';

// Gebruikt haalBerichtOp(id) als die bestaat, anders zoekt hij het bericht in de nieuwslijst.
async function laadBericht(id) {
  if (typeof wordpress.haalBerichtOp === 'function') {
    return naarBericht(await wordpress.haalBerichtOp(id));
  }
  const lijst = await wordpress.haalNieuwsOp();
  const gevonden = lijst.find((p) => String(p.id) === String(id));
  return gevonden ? naarBericht(gevonden) : null;
}

export default function NieuwsberichtScherm() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [bericht, setBericht] = useState(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    laadBericht(id)
      .then(setBericht)
      .catch((e) => setFout(e.message))
      .finally(() => setLaden(false));
  }, [id]);

  return (
    <SafeAreaView style={s.scherm} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable onPress={() => router.back()} style={s.terug} accessibilityRole="button" accessibilityLabel="Terug">
        <Text style={s.terugTekst}>‹ Terug</Text>
      </Pressable>

      {laden ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={K.donkergroen} />
      ) : !bericht ? (
        <Text style={s.leeg}>{fout ?? 'Dit bericht is niet gevonden.'}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {bericht.afbeelding && <Image source={{ uri: bericht.afbeelding }} style={s.foto} />}
          <View style={{ padding: 16 }}>
            <View style={s.pil}><Text style={s.pilTekst}>{bericht.rubriek}</Text></View>
            <Text style={s.titel} accessibilityRole="header">{bericht.titel}</Text>
            <Text style={s.meta}>{maakDatum(bericht.datum)} · door {bericht.auteur}</Text>
            <View style={s.lijn} />
            {bericht.alineas.map((a, i) => (
              <Text key={i} style={s.tekst}>{a}</Text>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: K.wit },
  terug: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  terugTekst: { color: K.donkergroen, fontWeight: '700', fontSize: 17 },
  foto: { width: '100%', aspectRatio: 16 / 9 },
  pil: {
    alignSelf: 'flex-start', backgroundColor: K.licht, borderColor: K.rand, borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  pilTekst: { color: K.donkergroen, fontWeight: '700', fontSize: 15 },
  titel: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: K.zwart },
  meta: { fontSize: 15, color: K.grijs, marginTop: 12 },
  lijn: { height: 1, backgroundColor: K.rand, marginVertical: 18 },
  tekst: { fontSize: 18, lineHeight: 28, color: K.zwart, marginBottom: 16 },
  leeg: { fontSize: 17, color: K.grijs, textAlign: 'center', marginTop: 40, paddingHorizontal: 16 },
});