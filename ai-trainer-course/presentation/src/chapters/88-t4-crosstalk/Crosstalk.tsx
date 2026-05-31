import type { ChapterStepProps } from "../../registry/types";
import "./Crosstalk.css";

export default function Crosstalk({ step }: ChapterStepProps) {
  return (
    <div className="t4ct-root scene-pad">
      <div className="t4ct-layout">
        <div className="t4ct-left">
          <div className="t4ct-header">
            <span className="t4ct-name">Crosstalk 重叠音</span>
            <span className="t4ct-sub">串音 · 多人同时说话</span>
          </div>
          <div className="t4ct-demo">
            <div className="t4ct-wave-demo">
              <svg width="100%" height="60" viewBox="0 0 400 60">
                <line x1="0" y1="30" x2="80" y2="30" stroke="var(--accent)" strokeWidth="2" opacity=".4"/>
                <line x1="80" y1="5" x2="200" y2="5" stroke="var(--accent)" strokeWidth="3"/>
                <line x1="80" y1="55" x2="200" y2="55" stroke="var(--accent)" strokeWidth="3" opacity=".6"/>
                <line x1="200" y1="30" x2="400" y2="30" stroke="var(--accent)" strokeWidth="2" opacity=".4"/>
                <text x="100" y="0" fill="var(--accent)" fontSize="12" fontFamily="monospace">🏷️ Crosstalk 区域</text>
              </svg>
            </div>
          </div>
        </div>
        <div className="t4ct-right">
          {step >= 0 && (
            <div className="t4ct-two-sides">
              <div className="t4ct-side t4ct-side-bad">
                <span className="t4ct-side-label">ASR 任务</span>
                <span className="t4ct-side-verdict">❌ 脏数据 · 丢弃</span>
                <span className="t4ct-side-reason">转写准确率严重下降</span>
              </div>
              <div className="t4ct-side t4ct-side-good">
                <span className="t4ct-side-label">情绪打断分析</span>
                <span className="t4ct-side-verdict">⭐ 核心资产 · 保留</span>
                <span className="t4ct-side-reason">每次重叠=沟通障碍爆发点</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="t4ct-principle">
              <span className="t4ct-principle-text">数据好坏 = 由业务目标定义</span>
              <span className="t4ct-principle-sub">没有绝对标准，只有适用场景</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t4ct-next">
              <span className="t4ct-next-text">转写Guideline三大拷问 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
