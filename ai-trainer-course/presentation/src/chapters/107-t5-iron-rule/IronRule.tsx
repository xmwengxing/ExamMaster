import type { ChapterStepProps } from "../../registry/types";
import "./IronRule.css";

export default function IronRule({ step }: ChapterStepProps) {
  return (
    <div className="t5ir-root scene-pad">
      <div className="t5ir-layout">
        <div className="t5ir-left">
          <span className="t5ir-title">S2 核心回顾</span>
          <div className="t5ir-summary">
            <div className="t5ir-card">
              <span className="t5ir-card-icon">📐</span>
              <span className="t5ir-card-title">四个维度</span>
              <span className="t5ir-card-desc">XYZ=位置 · Intensity=材质</span>
            </div>
            <div className="t5ir-card t5ir-card-warn">
              <span className="t5ir-card-icon">🕳️</span>
              <span className="t5ir-card-title">两个盲区</span>
              <span className="t5ir-card-desc">稀疏性 · 玻璃穿透</span>
            </div>
          </div>
        </div>
        <div className="t5ir-right">
          {step >= 0 && (
            <div className="t5ir-solution">
              <span className="t5ir-sol-text">不是靠算法补 · 是靠标注指南兜底</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5ir-next">
              <span className="t5ir-next-text">S3：实战清洗 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
