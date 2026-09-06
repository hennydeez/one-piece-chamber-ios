import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ChamberProvider } from '@/src/context/ChamberContext';
import { migrateChamberDb } from '@/src/db/migrate';
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
        <SQLiteProvider databaseName="chamber.db" onInit={migrateChamberDb} useSuspense={false}>
        <ChamberProvider>
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
        </ChamberProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
