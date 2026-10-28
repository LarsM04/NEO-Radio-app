import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { kleuren } from '../constants/kleuren';

// Hoofdlayout: de tabbalk plus de schermen die je vanuit een tab opent.
export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: kleuren.zwart,
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="nieuws/[id]" options={{ title: 'Nieuwsbericht' }} />
        <Stack.Screen name="live/luisteren" options={{ title: 'Live luisteren' }} />
        <Stack.Screen name="live/kijken" options={{ title: 'Live kijken' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
