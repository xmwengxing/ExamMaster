import { useEffect, useState, useRef, useMemo } from "react";
import "./Subtitle.css";

type ChunkTiming = { text: string; ms: number };
type TimingMap = Record<string, Record<string, ChunkTiming[]>>;

interface Props {
  text: string;
  chapterId: string;
  stepIndex: number;
  timingMap: TimingMap | null;
}

function ChunkCycle({ chunks, delays }: { chunks: string[]; delays: number[] }) {
  const [idx, setIdx] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const cumulative = useMemo(() => {
    const arr: number[] = [];
    let acc = 0;
    for (const d of delays) { acc += d; arr.push(acc); }
    return arr;
  }, [delays.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIdx(0);
    if (chunks.length <= 1) return;

    startRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      let newIdx = 0;
      for (let i = 0; i < cumulative.length; i++) {
        if (elapsed >= cumulative[i]) newIdx = i + 1;
      }
      if (newIdx >= chunks.length) return; // all chunks shown, stop
      setIdx(newIdx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [chunks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="sub-text">
      {chunks.map((c, i) => (
        <span key={i} className={`sub-chunk ${i === idx ? "sub-on" : ""}`}>
          {c}
        </span>
      ))}
    </span>
  );
}

export function Subtitle({ text, chapterId, stepIndex, timingMap }: Props) {
  const stepTimings = timingMap?.[chapterId]?.[String(stepIndex)] ?? null;

  const { chunks, delays, cycleKey } = useMemo(() => {
    if (stepTimings && stepTimings.length > 0) {
      // Use text from timing JSON (may have been manually edited)
      const c = stepTimings.map((t) => t.text);
      const d = stepTimings.map((t) => t.ms);
      return {
        chunks: c,
        delays: d,
        cycleKey: `${chapterId}-${stepIndex}-${d.join(",")}`,
      };
    }
    // Fallback: split text, auto-estimate
    const segments = text.split(/(?<=[。！？，、])/);
    const raw: string[] = [];
    let cur = "";
    for (const s of segments) {
      if ((cur + s).length > 60 && cur) { raw.push(cur); cur = s; }
      else { cur += s; }
    }
    if (cur) raw.push(cur);
    const c = raw.length ? raw : [text];
    const totalS = Math.max(text.length / 3, 3);
    const msPer = Math.round((totalS * 1000) / c.length);
    return {
      chunks: c,
      delays: Array(c.length).fill(Math.max(msPer, 2000)),
      cycleKey: `${chapterId}-${stepIndex}-auto`,
    };
  }, [text, chapterId, stepIndex, stepTimings]);

  if (!text) return null;

  return (
    <div className="sub-bar">
      <ChunkCycle key={cycleKey} chunks={chunks} delays={delays} />
    </div>
  );
}
