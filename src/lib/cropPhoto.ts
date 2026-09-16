import { optionalNativeModule } from './nativeModules';
import {
  cropForCameraSnap,
  cropForLibraryPick,
  isUsableSize,
  type FrameKind,
  type PixelCrop,
  type Size,
} from './cardFrame';

export type ImageCropRect = PixelCrop;

export type ManipulatorModule = {
  manipulateAsync?: (
    uri: string,
    actions: { crop: ImageCropRect }[],
    options?: { compress?: number; format?: string },
  ) => Promise<{ uri?: string } | null | undefined>;
  ImageManipulator?: {
    manipulate: (uri: string) => {
      crop: (rect: ImageCropRect) => {
        renderAsync: () => Promise<{
          saveAsync: (opts?: { compress?: number; format?: string }) => Promise<{ uri?: string }>;
        }>;
      };
    };
  };
};

export interface CropRuntime {
  hasNativeModule(): boolean;
  loadManipulator(): Promise<ManipulatorModule>;
  getSize(uri: string): Promise<Size | null>;
}

/**
 * Crop via expo-image-manipulator when the *native* module is already present.
 *
 * Never import `expo-image-manipulator` JS until that probe succeeds.
 * The package talks to `ExpoImageManipulator` at evaluation time; a miss
 * red-screens Expo Go even when the caller try/catches the dynamic import.
 * Missing native bits keep the full photo — confirm still runs.
 */
export function defaultCropRuntime(): CropRuntime {
  return {
    hasNativeModule() {
      return (
        optionalNativeModule('ExpoImageManipulator') != null ||
        optionalNativeModule('ExponentImageManipulator') != null
      );
    },
    async loadManipulator() {
      return (await import('expo-image-manipulator')) as ManipulatorModule;
    },
    getSize(uri) {
      return getImageSize(uri);
    },
  };
}

export async function cropPhotoIfPossible(
  sourceUri: string,
  crop: PixelCrop,
  runtime: CropRuntime = defaultCropRuntime(),
): Promise<string> {
  if (!sourceUri) return sourceUri;
  try {
    if (!runtime.hasNativeModule()) return sourceUri;
    const manipulator = await runtime.loadManipulator();
    const uri = await runManipulatorCrop(manipulator, sourceUri, crop);
    return uri || sourceUri;
  } catch {
    return sourceUri;
  }
}

export async function cropCameraPhoto(
  input: {
    uri: string;
    kind: FrameKind;
    imageWidth?: number;
    imageHeight?: number;
    preview?: Size | null;
  },
  runtime: CropRuntime = defaultCropRuntime(),
): Promise<string> {
  const image = await resolveImageSize(input.uri, input, runtime);
  if (!image) return input.uri;
  if (!input.preview || !isUsableSize(input.preview)) {
    return cropLibraryPhoto({ uri: input.uri, kind: input.kind, ...image }, runtime);
  }
  const crop = cropForCameraSnap({ preview: input.preview, image, kind: input.kind });
  if (!crop) return input.uri;
  return cropPhotoIfPossible(input.uri, crop, runtime);
}

export async function cropLibraryPhoto(
  input: {
    uri: string;
    kind: FrameKind;
    imageWidth?: number;
    imageHeight?: number;
  },
  runtime: CropRuntime = defaultCropRuntime(),
): Promise<string> {
  const image = await resolveImageSize(input.uri, input, runtime);
  if (!image) return input.uri;
  const crop = cropForLibraryPick(image, input.kind);
  if (!crop) return input.uri;
  return cropPhotoIfPossible(input.uri, crop, runtime);
}

async function resolveImageSize(
  uri: string,
  hinted: { imageWidth?: number; imageHeight?: number },
  runtime: CropRuntime,
): Promise<Size | null> {
  const hintedSize = { width: hinted.imageWidth ?? 0, height: hinted.imageHeight ?? 0 };
  if (isUsableSize(hintedSize)) return hintedSize;
  try {
    return (await runtime.getSize(uri)) ?? null;
  } catch {
    return null;
  }
}

async function runManipulatorCrop(
  manipulator: ManipulatorModule,
  uri: string,
  crop: PixelCrop,
): Promise<string | undefined> {
  if (typeof manipulator.manipulateAsync === 'function') {
    const result = await manipulator.manipulateAsync(uri, [{ crop }], {
      compress: 0.85,
      format: 'jpeg',
    });
    return result?.uri;
  }

  const context = manipulator.ImageManipulator?.manipulate(uri);
  if (!context) return undefined;
  const rendered = await context.crop(crop).renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.85, format: 'jpeg' });
  return saved?.uri;
}

function getImageSize(uri: string): Promise<Size | null> {
  return new Promise((resolve) => {
    try {
      const { Image } = require('react-native') as {
        Image?: {
          getSize?: (
            nextUri: string,
            success: (width: number, height: number) => void,
            failure?: (error: unknown) => void,
          ) => void;
        };
      };
      if (typeof Image?.getSize !== 'function') {
        resolve(null);
        return;
      }
      Image.getSize(
        uri,
        (width, height) => resolve(width >= 1 && height >= 1 ? { width, height } : null),
        () => resolve(null),
      );
    } catch {
      resolve(null);
    }
  });
}
