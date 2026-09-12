/**
 * Expo config wrapper.
 * Live comps: EXPO_PUBLIC_COMPS_API_URL
 *   default/example: https://whitesmoke-woodpecker-609130.hostingersite.com/api/comps.php
 *   EAS: eas.json build.*.env
 *   local: copy .env.example → .env
 * Unset / blank → UnconfiguredCompsService (empty solds, no samples).
 */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      compsApiUrl: process.env.EXPO_PUBLIC_COMPS_API_URL ?? '',
    },
  },
};
