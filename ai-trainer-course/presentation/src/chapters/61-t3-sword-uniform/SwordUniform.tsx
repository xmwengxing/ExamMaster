import type { ChapterStepProps } from "../../registry/types";
import "./SwordUniform.css";

export default function SwordUniform({ step }: ChapterStepProps) {
  return (
    <div className="t3su-root scene-pad">
      <div className="t3su-layout">
        <div className="t3su-left">
          <div className="t3su-header">
            <span className="t3su-num">第一剑</span>
            <span className="t3su-name">均匀抽帧</span>
            <span className="t3su-freq">1 FPS · 固定间隔</span>
          </div>
          <div className="t3su-fit">
            <span className="t3su-fit-label">✅ 适用场景</span>
            <div className="t3su-fit-items">
              <span className="t3su-fit-item">🏭 工业流水线产品质检</span>
              <span className="t3su-fit-item">🌾 农作物生长定期拍摄</span>
              <span className="t3su-fit-item">🚦 交通路口车流量统计</span>
            </div>
          </div>
        </div>
        <div className="t3su-right">
          {step >= 1 && (
            <div className="t3su-contradiction">
              <span className="t3su-ct-title">核心矛盾</span>
              <div className="t3su-ct-pair">
                <span>帧率低 → 漏关键信息</span>
                <span>帧率高 → 冗余爆炸</span>
              </div>
            </div>
          )}
          {step >= 2 && (
            <div className="t3su-highway">
              <span className="t3su-hw-title">❌ 绝对不能用</span>
              <span className="t3su-hw-scene">高速公路拍车 — 1 FPS → 全是残影</span>
              <span className="t3su-hw-data">汽车 30m/s · 1帧内位移3米 · 运动模糊无法标注</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t3su-rule">
              <span className="t3su-rule-text">运动速度均匀 + 状态变化平缓 → 才用均匀抽帧</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
