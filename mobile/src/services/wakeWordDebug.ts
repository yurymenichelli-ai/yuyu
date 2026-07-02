import { useEffect, useState } from "react";

interface WakeWordDebugState {
  status: string;
  lastTranscript: string;
  lastError: string;
}

let state: WakeWordDebugState = { status: "non avviato", lastTranscript: "", lastError: "" };
const listeners = new Set<(s: WakeWordDebugState) => void>();

export function setWakeWordDebug(partial: Partial<WakeWordDebugState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener(state));
}

export function useWakeWordDebug(): WakeWordDebugState {
  const [value, setValue] = useState(state);
  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}
