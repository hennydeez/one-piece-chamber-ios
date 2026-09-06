import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { chamber } from '@/src/theme/chamber';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Lost in the chamber' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This passage does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Collections</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: chamber.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: chamber.ink,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: chamber.gold,
  },
});
