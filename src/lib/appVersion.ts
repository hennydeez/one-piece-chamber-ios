/** Fallback only if Expo config is missing — keep in sync with app.json. */
export const APP_VERSION_FALLBACK = '0.8.0';

export function versionFromExpoConfig(
  config: { version?: string | null } | null | undefined,
  fallback = APP_VERSION_FALLBACK,
): string {
  const version = config?.version?.trim();
  return version || fallback;
}

/**
 * App version from app.json via Constants.expoConfig.
 * Lazy-require so Node tests do not load Expo native modules.
 */
export function appVersion(): string {
  try {
    const Constants = require('expo-constants').default as {
      expoConfig?: { version?: string | null };
      nativeAppVersion?: string | null;
    };
    return versionFromExpoConfig(Constants.expoConfig, Constants.nativeAppVersion ?? APP_VERSION_FALLBACK);
  } catch {
    return APP_VERSION_FALLBACK;
  }
}

export function appVersionLabel(version = appVersion()): string {
  return `v${version}`;
}
