import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { ChamberTabBar } from '@/src/components/ChamberTabBar';
import { chamber } from '@/src/theme/chamber';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ChamberTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: chamber.gold,
        tabBarInactiveTintColor: chamber.faint,
        tabBarStyle: {
          backgroundColor: chamber.bgElevated,
          borderTopColor: chamber.panelEdge,
          borderTopWidth: 0,
        },
        headerStyle: { backgroundColor: chamber.bgElevated },
        headerTintColor: chamber.goldSoft,
        headerShown: useClientOnlyValue(false, true),
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
