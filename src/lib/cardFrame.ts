import { isSlab, type CardType } from '../models/card';

export const FRAME_KINDS = ['raw', 'slab'] as const;
export type FrameKind = (typeof FRAME_KINDS)[number];

/** Standard One Piece TCG card (63 × 88 mm / 2.5 × 3.5 in). */
export const RAW_CARD_MM = { width: 63, height: 88 } as const;

/** Typical PSA / BGS / TAG slab (~3.25 × 5.375 in). */
export const SLAB_CARD_MM = { width: 82.55, height: 136.53 } as const;

/** Keep the hole off the preview edges so the frame is obvious. */
export const VIEWFINDER_INSET = 0.07;
export const VIEWFINDER_MIN_PAD = 16;
export const MIN_CROP_EDGE = 8;

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelCrop {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export function frameKindFromCardType(type: CardType): FrameKind {
  return isSlab(type) ? 'slab' : 'raw';
}

export function parseFrameKind(value: unknown): FrameKind {
  return value === 'slab' ? 'slab' : 'raw';
}

export function frameAspect(kind: FrameKind): number {
  const mm = kind === 'slab' ? SLAB_CARD_MM : RAW_CARD_MM;
  return mm.width / mm.height;
}

export function isUsableSize(size: Size | null | undefined): size is Size {
  return Boolean(size && size.width >= 1 && size.height >= 1);
}

/**
 * Largest card-shaped rectangle that fits in the preview, inset from the edges.
 */
export function viewfinderRect(
  preview: Size,
  kind: FrameKind,
  insetRatio = VIEWFINDER_INSET,
): Rect | null {
  if (!isUsableSize(preview)) return null;
  const aspect = frameAspect(kind);
  const padX = Math.max(VIEWFINDER_MIN_PAD, preview.width * insetRatio);
  const padY = Math.max(VIEWFINDER_MIN_PAD, preview.height * insetRatio);
  const maxWidth = Math.max(1, preview.width - padX * 2);
  const maxHeight = Math.max(1, preview.height - padY * 2);
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return {
    x: (preview.width - width) / 2,
    y: (preview.height - height) / 2,
    width,
    height,
  };
}

/**
 * Largest centered card-shaped crop that fits inside an already-taken photo.
 * Used for library picks (no live viewfinder).
 */
export function inscribedCenteredCrop(image: Size, kind: FrameKind): Rect | null {
  if (!isUsableSize(image)) return null;
  const aspect = frameAspect(kind);
  let width = image.width;
  let height = width / aspect;
  if (height > image.height) {
    height = image.height;
    width = height * aspect;
  }
  return {
    x: (image.width - width) / 2,
    y: (image.height - height) / 2,
    width,
    height,
  };
}

/**
 * Map a viewfinder rect from a cover-fitted preview onto image pixels.
 * CameraView fills its box (cover), so the photo is scaled and centered.
 */
export function mapCoverFrameToImage(input: {
  preview: Size;
  image: Size;
  frame: Rect;
}): Rect | null {
  const { preview, image, frame } = input;
  if (!isUsableSize(preview) || !isUsableSize(image)) return null;
  if (frame.width < 1 || frame.height < 1) return null;

  const scale = Math.max(preview.width / image.width, preview.height / image.height);
  if (!Number.isFinite(scale) || scale <= 0) return null;

  const displayedWidth = image.width * scale;
  const displayedHeight = image.height * scale;
  const offsetX = (preview.width - displayedWidth) / 2;
  const offsetY = (preview.height - displayedHeight) / 2;

  return {
    x: (frame.x - offsetX) / scale,
    y: (frame.y - offsetY) / scale,
    width: frame.width / scale,
    height: frame.height / scale,
  };
}

export function toPixelCrop(rect: Rect, image: Size): PixelCrop | null {
  if (!isUsableSize(image)) return null;
  const originX = clampInt(Math.round(rect.x), 0, Math.floor(image.width) - 1);
  const originY = clampInt(Math.round(rect.y), 0, Math.floor(image.height) - 1);
  const width = clampInt(Math.round(rect.width), 1, Math.floor(image.width) - originX);
  const height = clampInt(Math.round(rect.height), 1, Math.floor(image.height) - originY);
  if (width < MIN_CROP_EDGE || height < MIN_CROP_EDGE) return null;
  return { originX, originY, width, height };
}

export function isNearlyFullImage(crop: PixelCrop, image: Size): boolean {
  if (!isUsableSize(image)) return true;
  return (
    crop.originX <= 1 &&
    crop.originY <= 1 &&
    crop.width >= image.width - 2 &&
    crop.height >= image.height - 2
  );
}

export function cropForCameraSnap(input: {
  preview: Size;
  image: Size;
  kind: FrameKind;
}): PixelCrop | null {
  const frame = viewfinderRect(input.preview, input.kind);
  if (!frame) return null;
  const mapped = mapCoverFrameToImage({
    preview: input.preview,
    image: input.image,
    frame,
  });
  if (!mapped) return null;
  const crop = toPixelCrop(mapped, input.image);
  if (!crop || isNearlyFullImage(crop, input.image)) return null;
  return crop;
}

export function cropForLibraryPick(image: Size, kind: FrameKind): PixelCrop | null {
  const rect = inscribedCenteredCrop(image, kind);
  if (!rect) return null;
  const crop = toPixelCrop(rect, image);
  if (!crop || isNearlyFullImage(crop, image)) return null;
  return crop;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
