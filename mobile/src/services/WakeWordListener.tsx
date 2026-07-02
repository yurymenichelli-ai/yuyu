import { useEffect } from "react";
import { Alert } from "react-native";
import { uploadNote } from "../api/notes";
import { isWakeWordEnabled } from "./wakeWordSettings";
import { setWakeWordDebug } from "./wakeWordDebug";
import { disableWakeWordListening, enableWakeWordListening } from "./speechCapture";

/**
 * Mounted once while the user is logged in. Renders nothing — it keeps the
 * device's on-device speech recognizer listening continuously and, as soon
 * as a transcript contains "appunta", captures the note that follows (text
 * and audio) until a pause in speech, uploads it, then resumes listening.
 *
 * This uses the phone's built-in speech recognition (no external account or
 * paid API needed) rather than a dedicated wake-word engine, so it's a bit
 * less battery-efficient and reacts slightly slower than a purpose-built one.
 */
export default function WakeWordListener() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setWakeWordDebug({ status: "controllo impostazioni..." });
      const enabled = await isWakeWordEnabled();
      if (!enabled || cancelled) {
        setWakeWordDebug({ status: "disattivato nelle impostazioni" });
        return;
      }

      const started = await enableWakeWordListening(async ({ transcript, audioUri }) => {
        if (!transcript || !audioUri) return;
        setWakeWordDebug({ status: "carico l'appunto..." });
        try {
          await uploadNote({ audioUri, transcript, source: "wake_word" });
          setWakeWordDebug({ status: "appunto caricato" });
        } catch (err) {
          setWakeWordDebug({ lastError: `upload fallito: ${String(err)}` });
        }
      });

      if (!started) {
        Alert.alert("Ascolto vocale non attivo", "Permesso di riconoscimento vocale negato.");
      }
    })();

    return () => {
      cancelled = true;
      disableWakeWordListening();
    };
  }, []);

  return null;
}
