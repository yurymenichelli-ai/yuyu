import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { uploadNote } from "../api/notes";
import { SILENCE_TIMEOUT_MS, MAX_RECORDING_MS, SPEECH_RECOGNITION_LOCALE, WAKE_WORD } from "../config";
import { isWakeWordEnabled } from "./wakeWordSettings";
import { setWakeWordDebug } from "./wakeWordDebug";

const SILENCE_THRESHOLD_DB = -40;
const POLL_INTERVAL_MS = 250;

/**
 * Mounted once while the user is logged in. Renders nothing — it keeps the
 * device's on-device speech recognizer listening continuously and, as soon
 * as a transcript contains "appunta", records the note that follows until a
 * pause in speech (or a hard time cap), uploads it, then resumes listening.
 *
 * This uses the phone's built-in speech recognition (no external account
 * needed) rather than a dedicated wake-word engine, so it's a bit less
 * battery-efficient and reacts slightly slower than a purpose-built one.
 */
export default function WakeWordListener() {
  const isRecordingNoteRef = useRef(false);
  const isFinishingRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const lastLoudAtRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const isEnabledRef = useRef(false);

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, POLL_INTERVAL_MS);

  const startListening = () => {
    setWakeWordDebug({ status: `in ascolto di "${WAKE_WORD}"...` });
    ExpoSpeechRecognitionModule.start({
      lang: SPEECH_RECOGNITION_LOCALE,
      continuous: true,
      interimResults: true,
      requiresOnDeviceRecognition: true,
    });
  };

  const finishRecording = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    isRecordingNoteRef.current = false;
    setWakeWordDebug({ status: "carico l'appunto..." });

    try {
      await recorder.stop();
      if (recorder.uri) {
        await uploadNote({ audioUri: recorder.uri, source: "wake_word" });
        setWakeWordDebug({ status: "appunto caricato" });
      }
    } catch (err) {
      setWakeWordDebug({ lastError: `upload fallito: ${String(err)}` });
    } finally {
      isFinishingRef.current = false;
      hasTriggeredRef.current = false;
      if (isEnabledRef.current) startListening();
    }
  };

  useEffect(() => {
    if (!isRecordingNoteRef.current || isFinishingRef.current) return;

    const now = Date.now();
    if ((recorderState.metering ?? -160) > SILENCE_THRESHOLD_DB) {
      lastLoudAtRef.current = now;
    }

    const silentFor = now - lastLoudAtRef.current;
    const recordingFor = now - recordingStartedAtRef.current;
    if (silentFor > SILENCE_TIMEOUT_MS || recordingFor > MAX_RECORDING_MS) {
      finishRecording();
    }
  }, [recorderState.metering, recorderState.durationMillis]);

  const onWakeWordDetected = async () => {
    if (hasTriggeredRef.current || isRecordingNoteRef.current) return;
    hasTriggeredRef.current = true;
    setWakeWordDebug({ status: "parola chiave rilevata, registro..." });

    try {
      ExpoSpeechRecognitionModule.stop();
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingNoteRef.current = true;
      recordingStartedAtRef.current = Date.now();
      lastLoudAtRef.current = Date.now();
    } catch (err) {
      setWakeWordDebug({ lastError: `avvio registrazione fallito: ${String(err)}` });
      hasTriggeredRef.current = false;
      startListening();
    }
  };

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript?.toLowerCase() ?? "";
    setWakeWordDebug({ lastTranscript: transcript });
    if (isRecordingNoteRef.current || hasTriggeredRef.current) return;
    if (transcript.includes(WAKE_WORD)) {
      onWakeWordDetected();
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setWakeWordDebug({ status: "riconoscimento terminato dal sistema" });
    // The OS can stop the recognizer on its own (timeouts, interruptions).
    // Restart it unless we're the ones who stopped it to record a note.
    if (isEnabledRef.current && !isRecordingNoteRef.current && !hasTriggeredRef.current) {
      startListening();
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    setWakeWordDebug({ lastError: `${event.error}: ${event.message}` });
    if (event.error === "no-speech") return;
    Alert.alert("Errore ascolto vocale", event.message || event.error);
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setWakeWordDebug({ status: "controllo impostazioni..." });
      const enabled = await isWakeWordEnabled();
      if (!enabled) {
        setWakeWordDebug({ status: "disattivato nelle impostazioni" });
        return;
      }
      if (cancelled) return;

      setWakeWordDebug({ status: "richiedo permesso riconoscimento vocale..." });
      const recognitionPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!recognitionPermission.granted) {
        setWakeWordDebug({ status: "permesso riconoscimento vocale negato" });
        return;
      }

      setWakeWordDebug({ status: "richiedo permesso microfono..." });
      const recordingPermission = await requestRecordingPermissionsAsync();
      if (!recordingPermission.granted) {
        setWakeWordDebug({ status: "permesso microfono negato" });
        return;
      }
      if (cancelled) return;

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true });

      isEnabledRef.current = true;
      startListening();
    })();

    return () => {
      cancelled = true;
      isEnabledRef.current = false;
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  return null;
}
