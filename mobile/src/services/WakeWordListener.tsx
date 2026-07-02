import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { uploadNote } from "../api/notes";
import { SILENCE_TIMEOUT_MS, MAX_RECORDING_MS, SPEECH_RECOGNITION_LOCALE, WAKE_WORD } from "../config";
import { isWakeWordEnabled } from "./wakeWordSettings";

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

    try {
      await recorder.stop();
      if (recorder.uri) {
        await uploadNote({ audioUri: recorder.uri, source: "wake_word" });
      }
    } catch {
      // A missed note is better than crashing the always-on listener.
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

    try {
      ExpoSpeechRecognitionModule.stop();
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingNoteRef.current = true;
      recordingStartedAtRef.current = Date.now();
      lastLoudAtRef.current = Date.now();
    } catch {
      hasTriggeredRef.current = false;
      startListening();
    }
  };

  useSpeechRecognitionEvent("result", (event) => {
    if (isRecordingNoteRef.current || hasTriggeredRef.current) return;
    const transcript = event.results[0]?.transcript?.toLowerCase() ?? "";
    if (transcript.includes(WAKE_WORD)) {
      onWakeWordDetected();
    }
  });

  useSpeechRecognitionEvent("end", () => {
    // The OS can stop the recognizer on its own (timeouts, interruptions).
    // Restart it unless we're the ones who stopped it to record a note.
    if (isEnabledRef.current && !isRecordingNoteRef.current && !hasTriggeredRef.current) {
      startListening();
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "no-speech") return;
    Alert.alert("Errore ascolto vocale", event.message || event.error);
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const enabled = await isWakeWordEnabled();
      if (!enabled || cancelled) return;

      const recognitionPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!recognitionPermission.granted) return;

      const recordingPermission = await requestRecordingPermissionsAsync();
      if (!recordingPermission.granted) return;
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
