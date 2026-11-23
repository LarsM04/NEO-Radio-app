import { Ionicons } from '@expo/vector-icons';
import { Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { kleuren } from '../../constants/kleuren';

// Kleuren: eerst die van jullie kleuren.js, anders de huisstijlkleur uit het onderzoek.
const K = {
  groen: kleuren.groen ?? '#81BB19',
  donkergroen: kleuren.donkergroen ?? '#355F13',
  zwart: kleuren.zwart ?? '#171614',
  wit: kleuren.wit ?? '#FFFFFF',
  licht: '#F3F6EE',
  rand: '#E3EAD8',
  grijs: '#575760',
};

// ---- Gegevens (uit het onderzoek en de ontwerp-pdf) ----
const ADRES = 'Gerberastraat 46, 2431 XN Noorden';
const CONTACT = [
  { icoon: 'call', titel: 'Bel de studio', sub: '0172-727 808', url: 'tel:0172727808' },
  { icoon: 'logo-whatsapp', titel: 'WhatsApp', sub: '0631-052 528', url: 'https://wa.me/31631052528' },
  { icoon: 'mail', titel: 'E-mail', sub: 'info@neoradio.nl', url: 'mailto:info@neoradio.nl' },
];
const PROGRAMMAS = [
  { icoon: 'football', titel: 'Aanvallen en Verdedigen', sub: 'Zaterdag en zondag · live sport' },
  { icoon: 'musical-notes', titel: 'Nathans Nummers', sub: 'Muziek' },
  { icoon: 'mic', titel: 'De Kale Kenners', sub: 'Sport' },
  { icoon: 'business', titel: 'Politiek', sub: 'Lokale politiek' },
  { icoon: 'musical-note', titel: 'Willem bruist verder', sub: 'Woensdag 10:00–12:00, om de week' },
  { icoon: 'create', titel: "Theo's Mening", sub: 'Column' },
];
const DOE_MEE = ['Vrijwilliger worden', 'Stage lopen', 'Sponsor worden'];
// Vul de andere links in zodra NEO Radio ze heeft doorgegeven. Knoppen zonder link blijven verborgen.
const SOCIAL = [
  { naam: 'Facebook', url: null },
  { naam: 'Instagram', url: null },
  { naam: 'YouTube', url: null },
  { naam: 'TikTok', url: 'https://www.tiktok.com/@neo.jeugd' },
  { naam: 'Bluesky', url: null },
];

// Zet hier later de luchtfoto en het logo uit de map beeldmateriaal/ en logo/ van het onderzoek:
// bijv. require('../../../assets/luchtfoto.jpg'). Zolang het null is, zie je een groene balk.
const LUCHTFOTO = null;
const LOGO = null;

const open = (url) => Linking.openURL(url).catch(() => { });

function Rij({ icoon, titel, sub, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${titel} ${sub ?? ''}`}
      style={({ pressed }) => [s.rij, pressed && { opacity: 0.8 }]}>
      <View style={s.icoonCirkel}>
        <Ionicons name={icoon} size={22} color={K.donkergroen} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rijTitel}>{titel}</Text>
        {sub ? <Text style={s.rijSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={K.donkergroen} />
    </Pressable>
  );
}

export default function InfoScherm() {
  return (
    <SafeAreaView style={s.scherm} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Bovenkant met luchtfoto */}
        {LUCHTFOTO ? (
          <ImageBackground source={LUCHTFOTO} style={s.hero} accessibilityLabel="Luchtfoto van Nieuwkoop" />
        ) : (
          <View style={[s.hero, { backgroundColor: K.groen }]} />
        )}

        {/* Over NEO Radio */}
        <View style={s.overKaart}>
          {LOGO ? (
            <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityLabel="NEO Radio" />
          ) : (
            <Text style={s.logoTekst}>NEO <Text style={{ color: K.zwart }}>RADIO</Text></Text>
          )}
          <Text style={s.motto}>Voor en door jou</Text>
          <Text style={s.overTekst}>
            De lokale radio van de gemeente Nieuwkoop, met sport, nieuws en muziek uit de regio.
            NEO Radio maakt ook video: live kijken, samenvattingen en interviews.
          </Text>
        </View>

        <View style={s.inhoud}>
          {/* Contact */}
          <Text style={s.kop} accessibilityRole="header">Neem contact op</Text>
          {CONTACT.map((c) => (
            <Rij key={c.titel} icoon={c.icoon} titel={c.titel} sub={c.sub} onPress={() => open(c.url)} />
          ))}

          {/* Studio */}
          <Text style={s.kop} accessibilityRole="header">Bezoek de studio</Text>
          <View style={s.studioKaart}>
            <Text style={s.studioTekst}>NEO Radio studio in Sportpark De Koet</Text>
            <Text style={s.studioTekst}>{ADRES}</Text>
            <Pressable
              onPress={() => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADRES)}`)}
              accessibilityRole="button" accessibilityLabel="Route plannen naar de studio"
              style={s.routeKnop}>
              <Ionicons name="navigate" size={20} color={K.wit} />
              <Text style={s.routeTekst}>Route plannen</Text>
            </Pressable>
          </View>

          {/* Programma's */}
          <Text style={s.kop} accessibilityRole="header">Programma's</Text>
          <View style={s.lijst}>
            {PROGRAMMAS.map((p, i) => (
              <View key={p.titel} style={[s.programma, i < PROGRAMMAS.length - 1 && s.programmaLijn]}>
                <View style={s.icoonCirkel}>
                  <Ionicons name={p.icoon} size={22} color={K.donkergroen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rijTitel}>{p.titel}</Text>
                  <Text style={s.rijSub}>{p.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Doe mee */}
          <Text style={s.kop} accessibilityRole="header">Doe mee</Text>
          {DOE_MEE.map((t) => (
            <Pressable key={t} accessibilityRole="button" style={({ pressed }) => [s.doeMee, pressed && { opacity: 0.8 }]}
              onPress={() => open(`mailto:info@neoradio.nl?subject=${encodeURIComponent(t)}`)}>
              <Text style={s.doeMeeTekst}>{t}</Text>
              <Ionicons name="chevron-forward" size={22} color={K.donkergroen} />
            </Pressable>
          ))}

          {/* Social */}
          <Text style={s.kop} accessibilityRole="header">Volg ons</Text>
          <View style={s.socialRij}>
            {SOCIAL.filter((x) => x.url).map((x) => (
              <Pressable key={x.naam} onPress={() => open(x.url)} accessibilityRole="button" style={s.socialKnop}>
                <Text style={s.socialTekst}>{x.naam}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scherm: { flex: 1, backgroundColor: K.wit },
  hero: { height: 150, width: '100%' },
  overKaart: {
    marginHorizontal: 16, marginTop: -40, padding: 20, borderRadius: 16, alignItems: 'center',
    backgroundColor: K.wit, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 200, height: 80 },
  logoTekst: { fontSize: 40, fontWeight: '900', color: K.groen },
  motto: { fontSize: 20, fontWeight: '800', color: K.zwart, marginTop: 8 },
  overTekst: { fontSize: 17, lineHeight: 25, color: K.grijs, textAlign: 'center', marginTop: 8 },
  inhoud: { padding: 16 },
  kop: { fontSize: 22, fontWeight: '800', color: K.zwart, marginTop: 24, marginBottom: 12 },
  rij: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 12, marginBottom: 8,
    backgroundColor: K.licht, borderColor: K.rand, borderWidth: 1, borderRadius: 14,
  },
  icoonCirkel: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: K.wit, alignItems: 'center', justifyContent: 'center',
  },
  rijTitel: { fontSize: 17, fontWeight: '700', color: K.zwart },
  rijSub: { fontSize: 15, color: K.grijs, marginTop: 2 },
  studioKaart: { borderWidth: 1, borderColor: K.rand, borderRadius: 14, padding: 16 },
  studioTekst: { fontSize: 17, lineHeight: 25, color: K.zwart },
  routeKnop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
    marginTop: 14, borderRadius: 10, backgroundColor: K.donkergroen,
  },
  routeTekst: { color: K.wit, fontSize: 17, fontWeight: '700' },
  lijst: { borderWidth: 1, borderColor: K.rand, borderRadius: 14, paddingHorizontal: 12 },
  programma: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
  programmaLijn: { borderBottomWidth: 1, borderBottomColor: K.rand },
  doeMee: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52,
    paddingHorizontal: 16, marginBottom: 8, backgroundColor: K.licht, borderColor: K.rand, borderWidth: 1, borderRadius: 12,
  },
  doeMeeTekst: { fontSize: 17, fontWeight: '700', color: K.zwart },
  socialRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialKnop: {
    minHeight: 48, paddingHorizontal: 20, justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: K.rand, backgroundColor: K.wit,
  },
  socialTekst: { fontSize: 16, fontWeight: '700', color: K.zwart },
});