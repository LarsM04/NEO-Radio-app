// De navbar (de balk met knoppen onderin de app).
// Alles van de navbar staat in dit ene bestand.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { kleuren } from '../../constants/kleuren';

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

  return (
    // De balk zelf: wit, 66 hoog + de ruimte onderin, zodat alles er goed in past.
    <Tabs
      screenOptions={{
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
      <Tabs.Screen name="livescore" options={knop('Score', 'scoreboard')} />
      <Tabs.Screen name="nieuws" options={knop('Nieuws', 'newspaper-variant')} />
      <Tabs.Screen name="live" options={knop('Live', 'radio', true)} />
      <Tabs.Screen name="info" options={knop('Info', 'information')} />
    </Tabs>
  );
}
