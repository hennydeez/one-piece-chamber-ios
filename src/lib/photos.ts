import { createId } from './ids';
import { optionalNativeModule } from './nativeModules';

export type LegacyFileSystemNative = {
  documentDirectory?: string | null;
  makeDirectoryAsync?: (dir: string, options?: { intermediates?: boolean }) => Promise<void>;
  copyAsync?: (options: { from: string; to: string }) => Promise<void>;
};

export interface PhotoPersistRuntime {
  getLegacyFileSystem(): LegacyFileSystemNative | null;
  createDestName(): string;
}

/**
 * Copy a picker/camera photo into the app document directory when the
 * *native* ExponentFileSystem module is already present.
 *
 * Never import `expo-file-system` or `expo-asset` JS here. Those packages
 * call requireNativeModule at evaluation time (`FileSystem` / `ExpoAsset`).
 * In Expo Go a failed evaluation red-screens and unregisters `main` even
 * when the caller try/catches the dynamic import — and the card never
 * reaches SQLite.
 */
export function defaultPhotoPersistRuntime(): PhotoPersistRuntime {
  return {
    getLegacyFileSystem() {
      return optionalNativeModule<LegacyFileSystemNative>('ExponentFileSystem');
    },
    createDestName() {
      return createId('img');
    },
  };
}

export async function persistCardPhoto(
  sourceUri: string,
  runtime: PhotoPersistRuntime = defaultPhotoPersistRuntime(),
): Promise<string> {
  if (!sourceUri) return sourceUri;
  try {
    const fs = runtime.getLegacyFileSystem();
    const documentDirectory = fs?.documentDirectory;
    if (
      !documentDirectory ||
      typeof fs.makeDirectoryAsync !== 'function' ||
      typeof fs.copyAsync !== 'function'
    ) {
      return sourceUri;
    }
    const dir = `${documentDirectory}cards/`;
    await fs.makeDirectoryAsync(dir, { intermediates: true });
    const dest = `${dir}${runtime.createDestName()}.jpg`;
    await fs.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}
