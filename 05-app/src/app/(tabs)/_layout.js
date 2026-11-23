// De navbar (de balk met knoppen onderin de app), en op de tablet de zijbalk links.
// Alles van de navbar staat in dit ene bestand.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { kleuren } from '../../constants/kleuren';
import { useTablet } from '../../constants/scherm';

// De knoppen in de zijbalk, in de volgorde van het ontwerp (iPad · 6 en 7).
// tab = een scherm uit de tabbalk, href = een los scherm (Live luisteren en Live kijken).
const MENU = [
  { tekst: 'Home', icoon: 'home-outline', tab: 'index' },
  { tekst: 'Live score', icoon: 'scoreboard-outline', tab: 'livescore' },
  { tekst: 'Nieuws', icoon: 'newspaper-variant-outline', tab: 'nieuws' },
  { tekst: 'Live luisteren', icoon: 'radio', href: '/live/luisteren', live: true },
  { tekst: 'Info', icoon: 'information-outline', tab: 'info' },
  { tekst: 'Live kijken', icoon: 'television-play', href: '/live/kijken' },
];

// De zijbalk op de tablet: logo, menu met de volledige namen en onderin de radiospeler.
function Zijbalk({ state, navigation, insets }) {
  const huidig = state.routes[state.index].name;

  return (
    <View style={[styles.zijbalk, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <Image
        source={require('../../../assets/neo-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="NEO Radio"
      />

      {MENU.map((item) => {
        const actief = item.tab === huidig;
        const kleur = item.live ? kleuren.liveRood : kleuren.zwart;
        return (
          <Pressable
            key={item.tekst}
            onPress={() => (item.tab ? navigation.navigate(item.tab) : router.push(item.href))}
            accessibilityRole="link"
            accessibilityState={{ selected: actief }}
            style={[styles.menuKnop, actief && { backgroundColor: kleuren.groen }]}
          >
            <MaterialCommunityIcons name={item.icoon} size={22} color={kleur} />
            <Text style={[styles.menuTekst, { color: kleur }, actief && { fontWeight: '800' }]}>{item.tekst}</Text>
            {item.live && <View style={styles.liveStip} />}
          </Pressable>
        );
      })}

      {/* shortcut: er is nog geen echte speler en programmagids; dit blok opent Live luisteren. Vervang het als expo-audio er is. */}
      <Pressable
        onPress={() => router.push('/live/luisteren')}
        accessibilityRole="button"
        accessibilityLabel="Live luisteren naar NEO Radio"
        style={styles.speler}
      >
        <Text style={styles.spelerLive}>
          <Text style={{ color: kleuren.liveRood }}>● </Text>Live · NEO Radio
        </Text>
        <Text style={styles.spelerTitel}>NEO Radio</Text>
        <View style={styles.spelerRij}>
          <View style={styles.speelKnop}>
            <MaterialCommunityIcons name="play" size={26} color={kleuren.wit} />
          </View>
          <Text style={styles.spelerTekst}>Tik om te luisteren</Text>
        </View>
      </Pressable>
    </View>
  );
}

// Maakt één knop van de navbar.
// tekst = het woord onder het icoon
// icoon = welk plaatje (icoon) we laten zien
// live = true maakt de knop rood (alleen voor de Live-knop)
function knop(tekst, icoon, live = false) {
  return {
    title: tekst,

    // Het icoon. "focused" is true als je op dit scherm bent.
    tabBarIcon: ({ focused }) => (
      <View
        style={{
          width: 56,
          height: 32,
          borderRadius: 16, // ronde hoeken: een pilletje
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? kleuren.groen : 'transparent', // groen als je hier bent
        }}
      >
        <MaterialCommunityIcons
          name={icoon}
          size={24}
          color={focused ? kleuren.zwart : live ? kleuren.liveRood : kleuren.grijs}
        />
      </View>
    ),

    // Het woord onder het icoon.
    tabBarLabel: ({ focused }) => (
      <Text
        style={{
          fontSize: 13,
          fontWeight: focused ? 'bold' : 'normal', // dikgedrukt als je hier bent
          color: live ? kleuren.liveRood : focused ? kleuren.zwart : kleuren.grijs,
        }}
      >
        {tekst}
      </Text>
    ),
  };
}

export default function TabsLayout() {
  // Hoeveel ruimte de telefoon onderin zelf nodig heeft (bijv. het streepje op een iPhone).
  const onderRuimte = useSafeAreaInsets().bottom;
  // Op de tablet de zijbalk in plaats van de balk onderin.
  const tablet = useTablet();

  return (
    // De balk zelf: wit, 66 hoog + de ruimte onderin, zodat alles er goed in past.
    <Tabs
      tabBar={tablet ? (props) => <Zijbalk {...props} /> : undefined}
      screenOptions={{
        tabBarPosition: tablet ? 'left' : 'bottom',
        tabBarStyle: { backgroundColor: kleuren.wit, height: 66 + onderRuimte, paddingTop: 6 },
      }}
    >
      {/* name = de naam van het bestand van dat scherm */}
      <Tabs.Screen
        name="index"
        options={{
          ...knop('Home', 'home'), // de Home-knop, net als hierboven
          headerTitleAlign: 'left', // logo links bovenin, zoals in het ontwerp
          // Bovenin het Home-scherm: het NEO-logo in plaats van het woord "Home".
          headerTitle: () => (
            <Image
              source={require('../../../assets/neo-logo.png')} // het plaatje uit de map assets
              style={{ width: 81, height: 32 }} // breedte en hoogte, in dezelfde verhouding als het plaatje
              resizeMode="contain" // het logo past er helemaal in, niks wordt afgeknipt
            />
          ),
        }}
      />
      {/* Live score heeft zijn eigen grote titel bovenin, zoals in het ontwerp. */}
      <Tabs.Screen name="livescore" options={{ ...knop('Score', 'scoreboard'), headerShown: false }} />
      <Tabs.Screen name="nieuws" options={knop('Nieuws', 'newspaper-variant')} />
      <Tabs.Screen name="live" options={knop('Live', 'radio', true)} />
      <Tabs.Screen name="info" options={knop('Info', 'information')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  zijbalk: {
    width: 260,
    backgroundColor: kleuren.wit,
    borderRightWidth: 1,
    borderRightColor: '#e3ead8', // lichtgroene rand uit het ontwerp
    paddingHorizontal: 16,
    gap: 6,
  },
  logo: {
    width: 96,
    height: 38,
    marginLeft: 8,
    marginBottom: 24,
  },
  menuKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuTekst: {
    flex: 1,
    fontSize: 17,
  },
  liveStip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: kleuren.liveRood,
  },
  speler: {
    marginTop: 'auto', // onderin de zijbalk
    backgroundColor: kleuren.zwart,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  spelerLive: {
    fontSize: 12,
    color: kleuren.wit,
  },
  spelerTitel: {
    fontSize: 17,
    fontWeight: '800',
    color: kleuren.wit,
  },
  spelerRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  speelKnop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kleuren.liveRood,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spelerTekst: {
    fontSize: 15,
    fontWeight: '600',
    color: kleuren.wit,
  },
});
