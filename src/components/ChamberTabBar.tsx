import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, Text, View } from 'react-native';
import { appVersionLabel } from '@/src/lib/appVersion';
import { chamber } from '@/src/theme/chamber';

/** Slim version chip above the tab icons so Expo Go always shows it. */
export function ChamberTabBar(props: BottomTabBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.versionBar}>
        <Text style={styles.version}>{appVersionLabel()}</Text>
      </View>
      <BottomTabBar {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: chamber.bgElevated,
    borderTopWidth: 1.5,
    borderTopColor: chamber.gold,
  },
  versionBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 2,
  },
  version: {
    color: chamber.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
