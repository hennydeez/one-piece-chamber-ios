/**
 * Safe native-module probes. Never call requireNativeModule here —
 * that red-screens Expo Go even when the caller try/catches.
 */

export function optionalNativeModule<T = Record<string, unknown>>(name: string): T | null {
  try {
    const core = require('expo-modules-core') as {
      requireOptionalNativeModule?: (moduleName: string) => T | null;
    };
    if (typeof core.requireOptionalNativeModule !== 'function') {
      return null;
    }
    return core.requireOptionalNativeModule(name) ?? null;
  } catch {
    return null;
  }
}

export function isExpoGoHost(): boolean {
  // Do not import expo-constants JS. It warns "No native ExponentConstants
  // module found" and can trip requireNativeModule during evaluation.
  const constants =
    optionalNativeModule<{ executionEnvironment?: string; appOwnership?: string }>(
      'ExponentConstants',
    ) ??
    optionalNativeModule<{ executionEnvironment?: string; appOwnership?: string }>('ExpoConstants');
  const env = constants?.executionEnvironment ?? constants?.appOwnership;
  return env === 'storeClient' || env === 'expo';
}
