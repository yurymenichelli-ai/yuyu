import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { SPEECH_RECOGNITION_LOCALE, WAKE_WORD } from "../config";
import { setWakeWordDebug } from "./wakeWordDebug";

export interface CaptureResult {
  transcript: string;
  audioUri: string | null;
}

type Mode =
  | "idle"
  | "wake-listening"
  | "transitioning-to-wake-capture"
  | "capturing-wake"
  | "transitioning-to-manual-capture"
  | "capturing-manual";

let mode: Mode = "idle";
let wakeWordEnabled = false;
let latestTranscript = "";
let latestAudioUri: string | null = null;
let manualCaptureResolve: ((result: CaptureResult) => void) | null = null;
let onWakeNoteCaptured: ((result: CaptureResult) => void) | null = null;

function stripWakeWord(transcript: string): string {
  const idx = transcript.toLowerCase().indexOf(WAKE_WORD);
  if (idx === -1) return transcript.trim();
  return transcript
    .slice(idx + WAKE_WORD.length)
    .replace(/^[\s,:.]+/, "")
    .trim();
}

function startWakeListening(): void {
  mode = "wake-listening";
  setWakeWordDebug({ status: `in ascolto di "${WAKE_WORD}"...` });
  ExpoSpeechRecognitionModule.start({
    lang: SPEECH_RECOGNITION_LOCALE,
    continuous: true,
    interimResults: true,
    requiresOnDeviceRecognition: true,
  });
}

function beginWakeCaptureSession(): void {
  mode = "capturing-wake";
  latestTranscript = "";
  latestAudioUri = null;
  setWakeWordDebug({ status: "registro l'appunto..." });
  ExpoSpeechRecognitionModule.start({
    lang: SPEECH_RECOGNITION_LOCALE,
    continuous: false,
    interimResults: true,
    requiresOnDeviceRecognition: true,
    recordingOptions: { persist: true },
  });
}

function beginManualCaptureSession(): void {
  mode = "capturing-manual";
  latestTranscript = "";
  latestAudioUri = null;
  ExpoSpeechRecognitionModule.start({
    lang: SPEECH_RECOGNITION_LOCALE,
    continuous: true,
    interimResults: true,
    requiresOnDeviceRecognition: true,
    recordingOptions: { persist: true },
  });
}

ExpoSpeechRecognitionModule.addListener("result", (event) => {
  const transcript = event.results[0]?.transcript ?? "";

  if (mode === "wake-listening") {
    setWakeWordDebug({ lastTranscript: transcript });
    if (transcript.toLowerCase().includes(WAKE_WORD)) {
      mode = "transitioning-to-wake-capture";
      ExpoSpeechRecognitionModule.stop();
    }
  } else if (mode === "capturing-wake" || mode === "capturing-manual") {
    latestTranscript = transcript;
    setWakeWordDebug({ lastTranscript: transcript });
  }
});

ExpoSpeechRecognitionModule.addListener("audioend", (event) => {
  latestAudioUri = event.uri;
});

ExpoSpeechRecognitionModule.addListener("end", () => {
  switch (mode) {
    case "transitioning-to-wake-capture":
      beginWakeCaptureSession();
      return;
    case "transitioning-to-manual-capture":
      beginManualCaptureSession();
      return;
    case "capturing-wake": {
      mode = "idle";
      const result: CaptureResult = { transcript: stripWakeWord(latestTranscript), audioUri: latestAudioUri };
      onWakeNoteCaptured?.(result);
      if (wakeWordEnabled) startWakeListening();
      return;
    }
    case "capturing-manual": {
      mode = "idle";
      const result: CaptureResult = { transcript: latestTranscript.trim(), audioUri: latestAudioUri };
      manualCaptureResolve?.(result);
      manualCaptureResolve = null;
      if (wakeWordEnabled) startWakeListening();
      return;
    }
    case "wake-listening":
      // Ended on its own (e.g. a quiet moment timed out) — resume.
      if (wakeWordEnabled) startWakeListening();
      return;
    default:
      return;
  }
});

ExpoSpeechRecognitionModule.addListener("error", (event) => {
  setWakeWordDebug({ lastError: `${event.error}: ${event.message}` });
});

export async function enableWakeWordListening(onNoteCaptured: (result: CaptureResult) => void): Promise<boolean> {
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    setWakeWordDebug({ status: "permesso negato" });
    return false;
  }
  onWakeNoteCaptured = onNoteCaptured;
  wakeWordEnabled = true;
  if (mode === "idle") startWakeListening();
  return true;
}

export function disableWakeWordListening(): void {
  wakeWordEnabled = false;
  onWakeNoteCaptured = null;
  if (mode === "wake-listening") {
    ExpoSpeechRecognitionModule.stop();
    mode = "idle";
  }
}

export async function startManualCapture(): Promise<void> {
  if (mode !== "idle" && mode !== "wake-listening") {
    throw new Error("Il riconoscimento vocale è già occupato, riprova tra poco.");
  }

  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permesso riconoscimento vocale negato");
  }

  if (mode === "wake-listening") {
    mode = "transitioning-to-manual-capture";
    ExpoSpeechRecognitionModule.stop();
  } else {
    beginManualCaptureSession();
  }
}

export function stopManualCapture(): Promise<CaptureResult> {
  return new Promise((resolve) => {
    manualCaptureResolve = resolve;
    ExpoSpeechRecognitionModule.stop();
  });
}
