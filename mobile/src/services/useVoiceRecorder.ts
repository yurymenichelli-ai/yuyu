import { useState } from "react";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const start = async (): Promise<void> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permesso microfono negato");
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  const stop = async (): Promise<string | null> => {
    await recorder.stop();
    setIsRecording(false);
    return recorder.uri;
  };

  return { isRecording, start, stop };
}
