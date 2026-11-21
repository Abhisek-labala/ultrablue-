import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_API_KEY = 'ultrablue_custom_api_url';

// Automatically detect host computer LAN IP from Expo Metro bundler
const getDetectedHostIp = (): string | null => {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

// Default development API host detection
const getDefaultApiUrl = () => {
  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Auto-detected IP from Expo Metro Bundler (e.g. 192.168.1.9)
  const detectedIp = getDetectedHostIp();
  if (detectedIp) {
    return `http://${detectedIp}:8000/api`;
  }

  // 3. Fallback to this workstation's Wi-Fi LAN IP
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return 'http://192.168.1.9:8000/api';
  }

  // 4. Default for Web / Desktop
  return 'http://localhost:8000/api';
};

export const DEFAULT_API_URL = getDefaultApiUrl();

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const saved = await SecureStore.getItemAsync(STORAGE_API_KEY);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch {
    // Fallback if secure store fails
  }
  return getDefaultApiUrl();
};

export const setCustomApiBaseUrl = async (url: string): Promise<void> => {
  try {
    if (!url || url.trim().length === 0) {
      await SecureStore.deleteItemAsync(STORAGE_API_KEY);
    } else {
      await SecureStore.setItemAsync(STORAGE_API_KEY, url.trim());
    }
  } catch (err) {
    console.warn('Failed to save custom API base URL:', err);
  }
};
