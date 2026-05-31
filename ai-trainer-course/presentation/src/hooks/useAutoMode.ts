import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackMode } from "./useAudioPlayer";

const ORDER: PlaybackMode[] = ["manual", "audio", "auto"];

function readModeFromURL(): PlaybackMode {
  if (typeof window === "undefined") return "manual";
  const q = new URLSearchParams(window.location.search);
  if (q.get("auto") === "1") return "auto";
  if (q.get("audio") === "1") return "audio";
  return "manual";
}

/**
 * Playback mode state machine + URL sync + keyboard toggle + pause/resume.
 */
export function useAutoMode() {
  const [mode, setModeState] = useState<PlaybackMode>(() => readModeFromURL());
  const [autoStarted, setAutoStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const setMode = useCallback((m: PlaybackMode) => {
    setModeState(m);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("audio");
    url.searchParams.delete("auto");
    if (m === "audio") url.searchParams.set("audio", "1");
    if (m === "auto") url.searchParams.set("auto", "1");
    window.history.replaceState(null, "", url.toString());
    if (m !== "auto") { setAutoStarted(false); setPaused(false); pausedRef.current = false; }
  }, []);

  const cycleMode = useCallback(() => {
    setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]!);
  }, [mode, setMode]);

  const pause = useCallback(() => { setPaused(true); pausedRef.current = true; }, []);
  const resume = useCallback(() => { setPaused(false); pausedRef.current = false; }, []);

  // Keyboard: `M` cycles mode. `Space` starts auto if gated / toggles pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        cycleMode();
      } else if (e.key === " " && mode === "auto") {
        e.preventDefault();
        if (!autoStarted) { setAutoStarted(true); }
        else { setPaused(p => !p); pausedRef.current = !pausedRef.current; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, autoStarted, cycleMode]);

  return { mode, setMode, cycleMode, autoStarted, setAutoStarted, paused, pause, resume };
}
