import AsyncStorage from "@react-native-async-storage/async-storage";

const ENABLED_STORAGE_KEY = "voice-notes/wake-word-enabled";

export async function isWakeWordEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_STORAGE_KEY)) === "true";
}

export async function setWakeWordEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_STORAGE_KEY, enabled ? "true" : "false");
}
