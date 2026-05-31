import { useEffect, useRef } from "react";

export type PlaybackMode = "manual" | "audio" | "auto";

interface Options {
  /** Audio file path. `null` = no audio for this step (silent). */
  src: string | null;
  /** `manual` = no playback. `audio` = play but don't auto-advance.
   *  `auto` = play and auto-advance when finished. */
  mode: PlaybackMode;
  /** Small breathing pad (ms) after audio finishes before advancing. */
  trailMs?: number;
  /** Fallback duration (ms) for auto when audio file is missing. */
  estimateFallbackMs?: number;
  /** Called when `auto` determines the step is finished. */
  onAutoAdvance: () => void;
  /** Has the user started auto playback? */
  autoStarted: boolean;
  /** Paused by user interaction or interactive step — suppress all advance. */
  paused?: boolean;
}

/**
 * Per-step audio playback for the presentation.
 *
 * Manages a single hidden `<audio>` element. Switches `src` whenever the
 * current step changes.
 *
 * In `auto` mode:
 *   • Audio file present → advance `trailMs` after the audio's `ended` event.
 *   • Audio file missing / blocked / src = null → advance after
 *     `estimateFallbackMs` (so previews and silent steps still work).
 *
 * Audio playback is the sole driver of step duration — there is intentionally
 * no "minimum hold" knob. If a chapter's visual animation needs more time,
 * the chapter should write longer narration, split the step, or speed the
 * animation up. This keeps Auto-mode behavior trivially predictable.
 */
export function useAudioPlayer({
  src,
  mode,
  trailMs = 200,
  estimateFallbackMs = 1500,
  onAutoAdvance,
  autoStarted,
  paused = false,
}: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onAdvanceRef = useRef(onAutoAdvance);
  onAdvanceRef.current = onAutoAdvance;

  useEffect(() => {
    const prev = audioRef.current;
    if (prev) {
      prev.pause();
      prev.removeAttribute("src");
      prev.load();
      audioRef.current = null;
    }

    if (mode === "manual") return;
    if (mode === "auto" && !autoStarted) return;
    if (paused) return; // paused by user / interactive step — don't advance

    let advanced = false;
    let timer: number | null = null;

    const advanceAfter = (ms: number) => {
      if (mode !== "auto" || advanced) return;
      timer = window.setTimeout(() => {
        if (advanced) return;
        advanced = true;
        onAdvanceRef.current();
      }, Math.max(0, ms));
    };

    if (src) {
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.preload = "auto";

      audio.addEventListener("ended", () => advanceAfter(trailMs));
      audio.addEventListener("error", () => {
        // Audio file missing or undecodable — fall back to estimate.
        if (mode === "auto") advanceAfter(estimateFallbackMs);
      });

      audio.play().catch((err) => {
        // Autoplay blocked (rare, AutoStartGate should prevent this) or
        // file missing — fall back to estimate in auto mode.
        console.warn("audio play failed:", err);
        if (mode === "auto") advanceAfter(estimateFallbackMs);
      });
    } else if (mode === "auto") {
      // No audio for this step (silent / empty narration) — use estimate.
      advanceAfter(estimateFallbackMs);
    }

    return () => {
      advanced = true;
      if (timer != null) clearTimeout(timer);
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
        a.load();
        audioRef.current = null;
      }
    };
  }, [src, mode, trailMs, estimateFallbackMs, autoStarted, paused]);
}
