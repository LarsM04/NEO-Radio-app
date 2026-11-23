import { useWindowDimensions } from 'react-native';

// true = tabletindeling: zijbalk links en schermen in kolommen (ontwerp iPad · 6 t/m 11).
// We kijken naar de breedte, niet of de tablet staat of ligt. Elke iPad staand is hooguit 1032 breed
// (dan de telefoonindeling), liggend minstens 1133. In split view kan de app ook liggend smal zijn.
export function useTablet() {
  return useWindowDimensions().width >= 1100;
}
