import { router } from 'expo-router';
import { CardDraftEditor } from '@/src/components/CardDraftEditor';

export default function AddCardScreen() {
  return (
    <CardDraftEditor
      title="Add Card"
      subtitle="Snap or pick a photo. Fix the fields if OCR misses."
      saveLabel="Save"
      onSaved={(card) => {
        try {
          router.push(`/card/${card.id}`);
        } catch {
          router.replace('/(tabs)');
        }
      }}
    />
  );
}
