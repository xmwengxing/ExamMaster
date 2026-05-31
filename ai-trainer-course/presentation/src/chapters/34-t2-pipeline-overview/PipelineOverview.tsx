import type { ChapterStepProps } from "../../registry/types";
import "./PipelineOverview.css";

const NODES = [
  { label: "采集", sub: "Collect" },
  { label: "清洗", sub: "Clean" },
  { label: "脱敏", sub: "De-identify", accent: true },
  { label: "转换", sub: "Transform" },
  { label: "增强", sub: "Augment" },
];

export default function PipelineOverview({ step }: ChapterStepProps) {
  return (
    <div className="t2po-root scene-pad">
      <div className="t2po-center">
        <div className="t2po-pipeline">
          {NODES.map((n, i) => (
            <div key={n.label} className="t2po-node-group">
              <div className={`t2po-node ${n.accent ? "t2po-node-accent" : ""} ${i <= Math.min(step, 4) ? "t2po-node-on" : "t2po-node-off"}`}>
                <span className="t2po-node-label">{n.label}</span>
                {i <= Math.min(step, 4) && <span className="t2po-node-sub">{n.sub}</span>}
              </div>
              {i < NODES.length - 1 && (
                <div className={`t2po-arrow ${i < Math.min(step, 4) ? "t2po-arrow-on" : "t2po-arrow-off"}`}>
                  <svg width="48" height="16" viewBox="0 0 48 16">
                    <path d="M0 8 L40 8 M32 2 L42 8 L32 14"
                      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        {step >= 2 && (
          <div className="t2po-quality">
            <span className="t2po-quality-tag">采集 · 清洗 · 转换 · 增强 → 模型好不好用</span>
          </div>
        )}
        {step >= 3 && (
          <div className="t2po-warning">
            <span className="t2po-warning-icon">⚠</span>
            <span className="t2po-warning-text">脱敏 → 项目能不能活下来</span>
          </div>
        )}
        {step >= 4 && (
          <div className="t2po-title">
            <span className="t2po-title-text">五步流水线，缺一不可</span>
          </div>
        )}
        {step >= 5 && (
          <div className="t2po-bridge">
            <span className="t2po-bridge-text">先看最关键的一步：脱敏</span>
          </div>
        )}
      </div>
    </div>
  );
}
