import { Linking } from 'react-native';

export async function openExternalUrl(url: string): Promise<void> {
  try {
    const WebBrowser = await import('expo-web-browser');
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}
