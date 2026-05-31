import type { ChapterStepProps } from "../../registry/types";
import "./S3Blood.css";

export default function S3Blood({ step }: ChapterStepProps) {
  const dotCount = 100;
  const dots = Array.from({ length: dotCount }, (_, i) => ({
    x: ((i * 137 + 50) % 1920),
    y: ((i * 251 + 80) % 1080),
    r: (i % 3) + 1,
    o: step >= 0 ? (0.04 + (i % 6) * 0.015) : 0,
  }));
  return (
    <div className="s3b-root scene-pad">
      <div className="s3b-center">
        <svg className="s3b-particles" viewBox="0 0 1920 1080" preserveAspectRatio="none">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="var(--accent)" opacity={d.o} />
          ))}
        </svg>
        <div className="s3b-hero">
          {step >= 0 && <span className="s3b-question">流程中流淌的是什么？</span>}
          {step >= 1 && <span className="s3b-answer">数据</span>}
        </div>
        {step >= 2 && <span className="s3b-sub">五齿轮之间持续流动的血液</span>}
        {step >= 3 && (
          <div className="s3b-asset">
            <span className="s3b-asset-label">你必须建立</span>
            <span className="s3b-asset-big">数据资产视角</span>
          </div>
        )}
      </div>
    </div>
  );
}
