import { createId } from './ids';

export async function persistCardPhoto(sourceUri: string): Promise<string> {
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const dir = `${FileSystem.documentDirectory ?? ''}cards/`;
    if (!FileSystem.documentDirectory) return sourceUri;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = `${dir}${createId('img')}.jpg`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}
