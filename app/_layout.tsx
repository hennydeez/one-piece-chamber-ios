import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { RootProviders } from '@/src/providers/RootProviders';
import { chamber, chamberTheme } from '@/src/theme/chamber';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...chamberTheme.colors,
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navTheme}>
      <RootProviders>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: chamber.bgElevated },
            headerTintColor: chamber.goldSoft,
            headerTitleStyle: { color: chamber.ink, fontWeight: '700' },
            contentStyle: { backgroundColor: chamber.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="card/[id]" options={{ title: 'Card' }} />
          <Stack.Screen
            name="capture"
            options={{ title: 'Photograph', presentation: 'modal' }}
          />
        </Stack>
      </RootProviders>
    </ThemeProvider>
  );
}
