/** Fallback only if Expo config is missing — keep in sync with app.json. */
export const APP_VERSION_FALLBACK = '0.9.1';

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
 * Never uses nativeAppVersion — that is Expo Go's host version, not Chamber.
 */
export function appVersion(): string {
  try {
    const Constants = require('expo-constants').default as {
      expoConfig?: { version?: string | null };
    };
    return versionFromExpoConfig(Constants.expoConfig, APP_VERSION_FALLBACK);
  } catch {
    return APP_VERSION_FALLBACK;
  }
}

export function appVersionLabel(version = appVersion()): string {
  return `v${version}`;
}
