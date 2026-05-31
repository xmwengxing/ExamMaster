import type { ChapterStepProps } from "../../registry/types";
import "./SopRule.css";

export default function SopRule({ step }: ChapterStepProps) {
  return (
    <div className="t5sr-root scene-pad">
      <div className="t5sr-layout">
        <div className="t5sr-left">
          <span className="t5sr-title">S3 核心回顾</span>
          <div className="t5sr-cards">
            <div className="t5sr-card">
              <span className="t5sr-card-icon">🌨️</span>
              <span className="t5sr-card-title">雪花噪点清洗</span>
              <span className="t5sr-card-desc">时序滤波 + 反射率阈值 · 组合策略</span>
            </div>
            <div className="t5sr-card">
              <span className="t5sr-card-icon">📏</span>
              <span className="t5sr-card-title">地面分割</span>
              <span className="t5sr-card-desc">15cm高差 + 相邻点聚类 · 规则文档</span>
            </div>
          </div>
        </div>
        <div className="t5sr-right">
          {step >= 1 && (
            <div className="t5sr-motto">
              <span className="t5sr-motto-text">训练师 = 物理世界 → 数字世界的转译者</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5sr-next">
              <span className="t5sr-next-text">S4：多传感器融合仲裁 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
