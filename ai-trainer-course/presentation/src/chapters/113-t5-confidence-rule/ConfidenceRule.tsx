import type { ChapterStepProps } from "../../registry/types";
import "./ConfidenceRule.css";

export default function ConfidenceRule({ step }: ChapterStepProps) {
  return (
    <div className="t5cr-root scene-pad">
      <div className="t5cr-layout">
        <h2 className="t5cr-title">置信度分级与仲裁规则</h2>

        <div className="t5cr-levels">
          <div className={`t5cr-level ${step >= 1 ? "t5cr-level--visible" : ""} ${step >= 2 ? "t5cr-level--active" : ""}`}>
            <div className="t5cr-level-header">
              <span className="t5cr-level-badge t5cr-level-badge--high">高置信度</span>
              <span className="t5cr-level-icon">✅</span>
            </div>
            <div className="t5cr-level-content">
              <p className="t5cr-level-desc">图像 + 点云同时确认目标</p>
              <p className="t5cr-level-desc">数量充足，边界清晰</p>
            </div>
            {step >= 3 && (
              <div className="t5cr-level-action">
                <span>→ 正常流程标注</span>
              </div>
            )}
          </div>

          <div className={`t5cr-level ${step >= 1 ? "t5cr-level--visible" : ""} ${step >= 2 ? "t5cr-level--active" : ""}`}>
            <div className="t5cr-level-header">
              <span className="t5cr-level-badge t5cr-level-badge--mid">中置信度</span>
              <span className="t5cr-level-icon">⚠️</span>
            </div>
            <div className="t5cr-level-content">
              <p className="t5cr-level-desc">图像确认，点云稀疏/部分遮挡</p>
              <p className="t5cr-level-desc">需要插值补齐</p>
            </div>
            {step >= 3 && (
              <div className="t5cr-level-action">
                <span>→ 图像2D边界 + 前后帧轨迹 → 虚拟3D框插值</span>
              </div>
            )}
          </div>

          <div className={`t5cr-level ${step >= 1 ? "t5cr-level--visible" : ""} ${step >= 2 ? "t5cr-level--active" : ""}`}>
            <div className="t5cr-level-header">
              <span className="t5cr-level-badge t5cr-level-badge--low">低置信度 / 失效</span>
              <span className="t5cr-level-icon">🚫</span>
            </div>
            <div className="t5cr-level-content">
              <p className="t5cr-level-desc">点云完全缺失或严重失效</p>
              <p className="t5cr-level-desc">玻璃幕墙反光等导致雷达失效</p>
            </div>
            {step >= 3 && (
              <div className="t5cr-level-action">
                <span>→ 打上 &lt;LiDAR_Occlusion&gt; 特殊标签</span>
              </div>
            )}
          </div>
        </div>

        {step >= 4 && (
          <div className="t5cr-insight">
            <span className="t5cr-insight-text">
              把物理世界的矛盾 → 模型学习的「特殊教材」
            </span>
          </div>
        )}
      </div>
    </div>
  );
}