import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/animations.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AutoStartGate } from "./components/AutoStartGate";
import { AutoToggle } from "./components/AutoToggle";
import { ChapterMenu } from "./components/ChapterMenu";
import type { CourseDef } from "./components/ChapterMenu";
import { PlaybackControls } from "./components/PlaybackControls";
import { ProgressBar } from "./components/ProgressBar";
import { Stage } from "./components/Stage";
import { Subtitle } from "./components/Subtitle";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useAutoMode } from "./hooks/useAutoMode";
import { useStepper } from "./hooks/useStepper";
import { CHAPTERS } from "./registry/chapters";

type ChunkTiming = { text: string; ms: number };
type TimingMap = Record<string, Record<string, ChunkTiming[]>>;

function estimateMs(text: string): number {
  if (!text) return 1500;
  return Math.max(1500, text.length * 250);
}

export default function App() {
  const stepper = useStepper(CHAPTERS);
  const ch = CHAPTERS[stepper.cursor.chapter]!;
  const Cmp = ch.Component;
  const stepText = ch.narrations[stepper.cursor.step] ?? "";
  const [timingMap, setTimingMap] = useState<TimingMap | null>(null);
  const [courseDef, setCourseDef] = useState<CourseDef | null>(null);

  // Build chapter id → index map
  const chapterIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    CHAPTERS.forEach((c, i) => map.set(c.id, i));
    return map;
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}subtitle-timing.json?t=${Date.now()}`)
      .then((r) => r.json())
      .then(setTimingMap)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}course.json?t=${Date.now()}`)
      .then((r) => r.json())
      .then(setCourseDef)
      .catch(() => {});
  }, []);

  const { mode, cycleMode, autoStarted, setAutoStarted, paused, pause, resume } = useAutoMode();

  // Detect interactive steps — auto-pause when entering one
  const isInteractive =
    ch.interactiveSteps?.includes(stepper.cursor.step) ?? false;
  const prevInteractiveRef = useRef(false);

  useEffect(() => {
    if (mode === "auto" && autoStarted && isInteractive && !prevInteractiveRef.current) {
      pause();
    }
    prevInteractiveRef.current = isInteractive;
  }, [mode, autoStarted, isInteractive, pause]);

  const effectiveNext = useCallback(() => {
    const isCurrent = ch.interactiveSteps?.includes(stepper.cursor.step);
    if (paused && !isCurrent) {
      resume();
    }
    stepper.next();
  }, [stepper, ch, paused, resume]);

  const audioSrc =
    mode === "manual" || stepText === "" || paused
      ? null
      : `${import.meta.env.BASE_URL}audio/${ch.id}/${stepper.cursor.step + 1}.mp3`;

  const onAutoAdvance = useCallback(() => effectiveNext(), [effectiveNext]);

  useAudioPlayer({
    src: audioSrc, mode, trailMs: 200,
    estimateFallbackMs: estimateMs(stepText),
    onAutoAdvance, autoStarted, paused,
  });

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleJumpChapter = useCallback((chId: string) => {
    const idx = chapterIndexMap.get(chId);
    if (idx !== undefined) stepper.jumpToChapter(idx, 0);
  }, [stepper, chapterIndexMap]);

  return (
    <>
      {courseDef && (
        <ChapterMenu
          course={courseDef}
          activeChapterId={ch.id}
          onJumpChapter={handleJumpChapter}
        />
      )}
      <Stage onAdvance={effectiveNext}>
        <div key={ch.id} className="scene">
          <Cmp step={stepper.cursor.step} />
        </div>
        <Subtitle text={stepText} chapterId={ch.id} stepIndex={stepper.cursor.step} timingMap={timingMap} />
      </Stage>
      <ProgressBar chapters={CHAPTERS} cursor={stepper.cursor} onJumpChapter={stepper.jumpToChapter} />
      <AutoToggle mode={mode} onCycle={cycleMode} />
      <AutoStartGate visible={mode === "auto" && !autoStarted} onStart={() => setAutoStarted(true)} />
      <PlaybackControls
        visible={autoStarted} isPlaying={!paused}
        onTogglePlay={() => paused ? resume() : pause()}
        onFullscreen={toggleFullscreen}
      />
    </>
  );
}
