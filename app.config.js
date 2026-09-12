/**
 * Expo config wrapper.
 * Live comps: EXPO_PUBLIC_COMPS_API_URL
 *   default (baked in — Expo Go does not load eas.json env):
 *   https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php
 *   EAS: eas.json build.*.env
 *   local: .env optional; restart Expo Go with `npx expo start -c` after pull
 */
const DEFAULT_COMPS_API_URL =
  'https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php';

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      compsApiUrl: process.env.EXPO_PUBLIC_COMPS_API_URL?.trim() || DEFAULT_COMPS_API_URL,
    },
  },
};
