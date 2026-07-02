// Point this at your backend. When testing on a physical device, "localhost"
// refers to the device itself, so use your computer's LAN IP instead
// (e.g. "http://192.168.1.10:3000").
export const API_BASE_URL = "http://localhost:3000";

// The phrase that triggers automatic recording.
export const WAKE_WORD = "appunta";

// Locale used for both the always-on wake-word recognizer and transcription hints.
export const SPEECH_RECOGNITION_LOCALE = "it-IT";

// Stop recording automatically after this much silence follows speech.
export const SILENCE_TIMEOUT_MS = 1800;

// Hard cap so a stuck recording can't run forever.
export const MAX_RECORDING_MS = 30000;
