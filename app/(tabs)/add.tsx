import { router } from 'expo-router';
import { CardDraftEditor } from '@/src/components/CardDraftEditor';

export default function AddCardScreen() {
  return (
    <CardDraftEditor
      title="Add Card"
      subtitle="Snap a photo, or type a code to find card art."
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
