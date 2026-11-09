import { Stack } from 'expo-router';

// Het beheergedeelte: alleen voor medewerkers die live scores invoeren.
// De schermen tekenen hun eigen kop, zoals in het ontwerp.
export default function BeheerLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
