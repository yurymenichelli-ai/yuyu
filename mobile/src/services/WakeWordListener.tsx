import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { uploadNote } from "../api/notes";
import { SILENCE_TIMEOUT_MS, MAX_RECORDING_MS } from "../config";
import { getPicovoiceAccessKey, isWakeWordEnabled } from "./wakeWordSettings";
import { pauseWakeWordListener, resumeWakeWordListener, startWakeWordListener, stopWakeWordListener } from "./wakeWordService";

const SILENCE_THRESHOLD_DB = -40;
const POLL_INTERVAL_MS = 250;

/**
 * Mounted once while the user is logged in. Renders nothing — it just keeps
 * Porcupine listening for "appunta" and, on detection, records the note that
 * follows until a pause in speech (or a hard time cap), uploads it, then goes
 * back to listening.
 */
export default function WakeWordListener() {
  const isRecordingNoteRef = useRef(false);
  const isFinishingRef = useRef(false);
  const lastLoudAtRef = useRef(0);
  const recordingStartedAtRef = useRef(0);

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, POLL_INTERVAL_MS);

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
      await resumeWakeWordListener();
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

  const onWakeWord = async () => {
    if (isRecordingNoteRef.current) return;
    try {
      await pauseWakeWordListener();
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingNoteRef.current = true;
      recordingStartedAtRef.current = Date.now();
      lastLoudAtRef.current = Date.now();
    } catch {
      await resumeWakeWordListener();
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const enabled = await isWakeWordEnabled();
      if (!enabled) return;

      const accessKey = await getPicovoiceAccessKey();
      if (!accessKey) return;

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      if (cancelled) return;

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true });

      try {
        await startWakeWordListener({
          accessKey,
          onWakeWord,
          onError: (message) => Alert.alert("Errore ascolto vocale", message),
        });
      } catch {
        Alert.alert(
          "Ascolto vocale non attivo",
          "Controlla la chiave Picovoice e i file del modello 'appunta' nelle Impostazioni."
        );
      }
    })();

    return () => {
      cancelled = true;
      stopWakeWordListener();
    };
  }, []);

  return null;
}
