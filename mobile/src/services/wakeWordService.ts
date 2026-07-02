import { Asset } from "expo-asset";
import { PorcupineManager, PorcupineErrors } from "@picovoice/porcupine-react-native";

let manager: PorcupineManager | null = null;

async function resolveAssetUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  if (!asset.localUri) {
    throw new Error("Impossibile risolvere il file del modello Porcupine");
  }
  return asset.localUri;
}

export async function startWakeWordListener(params: {
  accessKey: string;
  onWakeWord: () => void;
  onError: (message: string) => void;
}): Promise<void> {
  if (manager) return;

  // These placeholders must be replaced with real files downloaded from the
  // Picovoice Console (see mobile/SETUP.md) before this will actually detect
  // anything — Porcupine will throw a clear error otherwise, caught below.
  const keywordPath = await resolveAssetUri(require("../../assets/porcupine/appunta_ios.ppn"));
  const modelPath = await resolveAssetUri(require("../../assets/porcupine/porcupine_params_it.pv"));

  manager = await PorcupineManager.fromKeywordPaths(
    params.accessKey,
    [keywordPath],
    () => params.onWakeWord(),
    (error: PorcupineErrors.PorcupineError) => params.onError(error.message),
    modelPath
  );
  await manager.start();
}

export async function pauseWakeWordListener(): Promise<void> {
  await manager?.stop();
}

export async function resumeWakeWordListener(): Promise<void> {
  await manager?.start();
}

export async function stopWakeWordListener(): Promise<void> {
  await manager?.stop();
  manager?.delete();
  manager = null;
}

export function isWakeWordListenerActive(): boolean {
  return manager !== null;
}
