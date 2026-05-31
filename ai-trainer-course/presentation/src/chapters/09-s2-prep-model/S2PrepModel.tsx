import type { ChapterStepProps } from "../../registry/types";
import "./S2PrepModel.css";

export default function S2PrepModel({ step }: ChapterStepProps) {
  const cards = ["采集", "清洗", "标注"];
  return (
    <div className="pm-root scene-pad">
      <div className="pm-center">
        {step <= 3 && (
          <>
            <span className="pm-gear-label">数据准备</span>
            <div className="pm-cards">
              {cards.map((c, i) => (
                <div key={c} className={`pm-card ${step > i ? "pm-card-on" : "pm-card-off"}`}>
                  <span className="pm-card-text">{c}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {step >= 3 && (
          <div className="pm-nn-row">
            <span className="pm-gear-label">模型训练与评估</span>
            <svg width="160" height="90" viewBox="0 0 160 90">
              {[40,80,120].map((x, xi) =>
                [20,45,70].map((y, yi) => (
                  <circle key={`${xi}${yi}`} cx={x} cy={y} r="7" fill="var(--accent)" opacity="0.65" />
                ))
              )}
              {[40,80,120].flatMap((x1, xi) =>
                [20,45,70].flatMap((y1, yi) =>
                  [80,120].map((x2) =>
                    [20,45,70].map((y2) =>
                      x2 > x1 ? <line key={`${xi}${yi}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="var(--accent)" strokeWidth="0.6" opacity="0.18" /> : null
                    )
                  )
                )
              )}
            </svg>
          </div>
        )}
        {step >= 4 && (
          <span className="pm-question">
            {step >= 5 ? "业务场景 vs 实验室 — 你对标的是哪一个？" : "模型评估报告，你真的看懂了吗？"}
          </span>
        )}
      </div>
    </div>
  );
}
