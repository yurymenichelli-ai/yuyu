import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY_STORAGE_KEY = "voice-notes/picovoice-access-key";
const ENABLED_STORAGE_KEY = "voice-notes/wake-word-enabled";

export async function getPicovoiceAccessKey(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY_STORAGE_KEY);
}

export async function setPicovoiceAccessKey(key: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_KEY_STORAGE_KEY, key);
}

export async function isWakeWordEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_STORAGE_KEY)) === "true";
}

export async function setWakeWordEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_STORAGE_KEY, enabled ? "true" : "false");
}
