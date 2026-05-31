import type { ChapterStepProps } from "../../registry/types";
import "./BusinessValue.css";

export default function BusinessValue({ step }: ChapterStepProps) {
  return (
    <div className="t3bv-root scene-pad">
      <div className="t3bv-layout">
        <div className="t3bv-left">
          <div className="t3bv-upgrade">
            <span className="t3bv-up-title">思维升级</span>
            <div className="t3bv-up-pair">
              <div className="t3bv-up-before">
                <span className="t3bv-up-label">标注员关注</span>
                <span className="t3bv-up-text">怎么标好这一张图</span>
              </div>
              <span className="t3bv-up-arrow">→</span>
              <div className="t3bv-up-after">
                <span className="t3bv-up-label">训练师关注</span>
                <span className="t3bv-up-text">这一张图有没有必要标</span>
              </div>
            </div>
          </div>
        </div>
        <div className="t3bv-right">
          {step >= 1 && (
            <div className="t3bv-transfer">
              <span className="t3bv-tf-title">高度可迁移</span>
              <div className="t3bv-tf-scenes">
                <span className="t3bv-tf-scene">🏗 工地安全帽 →</span>
                <span className="t3bv-tf-scene">🚗 自动驾驶路面识别 →</span>
                <span className="t3bv-tf-scene">🛒 零售客流热力图</span>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="t3bv-sentence">
              <span className="t3bv-sen-quote">先分析关键信息帧占比</span>
              <span className="t3bv-sen-sub">训练师的专业价值 · 第一句话</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3bv-next">
              <span className="t3bv-next-text">S4：隐私脱敏与幽灵跟踪 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
