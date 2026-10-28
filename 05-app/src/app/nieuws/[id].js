import { useLocalSearchParams } from 'expo-router';

import Placeholder from '../../components/Placeholder';

export default function NieuwsberichtScherm() {
  const { id } = useLocalSearchParams();

  return (
    <Placeholder
      titel={`Nieuwsbericht ${id}`}
      uitleg="Eén volledig artikel met foto, op te halen met haalBerichtOp(id)."
    />
  );
}
