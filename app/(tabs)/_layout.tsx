import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { appVersionLabel } from '@/src/lib/appVersion';
import { chamber } from '@/src/theme/chamber';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: chamber.gold,
        tabBarInactiveTintColor: chamber.faint,
        tabBarStyle: {
          backgroundColor: chamber.bgElevated,
          borderTopColor: chamber.gold,
          borderTopWidth: 1.5,
        },
        headerStyle: { backgroundColor: chamber.bgElevated },
        headerTintColor: chamber.goldSoft,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <Text style={{ color: chamber.faint, fontSize: 12, fontWeight: '600', marginRight: 16 }}>
            {appVersionLabel()}
          </Text>
        ),
        sceneStyle: { backgroundColor: chamber.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Card',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'plus.viewfinder', android: 'add_a_photo', web: 'add_a_photo' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="comps"
        options={{
          title: 'Comps',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
