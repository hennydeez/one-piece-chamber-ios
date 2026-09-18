import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { CardDraftEditor } from '@/src/components/CardDraftEditor';
import { ChamberScreen } from '@/src/components/ChamberScreen';
import { useChamber } from '@/src/context/ChamberContext';
import type { CollectionCard } from '@/src/models/card';
import { chamber } from '@/src/theme/chamber';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findCard } = useChamber();
  const [card, setCard] = useState<CollectionCard | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setCard(null);
      return;
    }
    void findCard(id).then(setCard);
  }, [id, findCard]);

  if (card === undefined) {
    return (
      <ChamberScreen title="Edit">
        <Text style={styles.muted}>Loading…</Text>
      </ChamberScreen>
    );
  }

  if (!card) {
    return (
      <ChamberScreen title="Edit">
        <Text style={styles.muted}>Card not found.</Text>
      </ChamberScreen>
    );
  }

  return (
    <CardDraftEditor
      existing={card}
      title="Edit card"
      subtitle="Fix the fields. Cancel keeps the saved card."
      saveLabel="Save"
      showCancel
      onSaved={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  muted: {
    color: chamber.muted,
  },
});
