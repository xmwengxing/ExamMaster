import type { ChapterStepProps } from "../../registry/types";
import "./GroundSeg.css";

export default function GroundSeg({ step }: ChapterStepProps) {
  return (
    <div className="t5gs-root scene-pad">
      <div className="t5gs-layout">
        <div className="t5gs-left">
          <div className="t5gs-header">
            <span className="t5gs-title">地面分割</span>
            <span className="t5gs-sub">Ground Segmentation — 马路 vs 障碍物</span>
          </div>
          <div className="t5gs-demo">
            <div className="t5gs-side-view">
              <svg width="100%" height="160" viewBox="0 0 500 160">
                <line x1="0" y1="80" x2="500" y2="80" stroke="var(--accent)" strokeWidth="1" strokeDasharray="6 4" opacity=".4"/>
                <text x="10" y="72" fill="var(--text-mute)" fontSize="13" fontFamily="monospace">地面分割线 · 15cm阈值</text>
                <rect x="80" y="78" width="40" height="4" rx="2" fill="var(--accent)" opacity=".5"><title>井盖 / 减速带 — 高出1cm — 非障碍物</title></rect>
                <rect x="200" y="50" width="60" height="30" rx="6" fill="var(--accent)" opacity=".8"><title>车辆 — 高出30cm+ — 有效障碍物</title></rect>
                <text x="100" y="96" fill="var(--text-mute)" fontSize="14" fontFamily="monospace">井盖·1cm↑ 忽略</text>
                <text x="205" y="100" fill="var(--accent)" fontSize="16" fontFamily="monospace">车辆·30cm↑ 障碍物</text>
              </svg>
            </div>
          </div>
        </div>
        <div className="t5gs-right">
          {step >= 1 && (
            <div className="t5gs-rule">
              <span className="t5gs-rule-title">SOP判定规则</span>
              <span className="t5gs-rule-item">垂直高度差 &gt; 15cm</span>
              <span className="t5gs-rule-item">水平方向 ≥ N个相邻点聚集</span>
              <span className="t5gs-rule-note">→ 认定为有效障碍物</span>
            </div>
          )}
          {step >= 2 && (
            <div className="t5gs-pits">
              <span className="t5gs-pit-title">⚠️ 常见陷阱</span>
              <span className="t5gs-pit-item">井盖高出1~2cm → 误标为障碍 → 车辆蛇形绕行</span>
              <span className="t5gs-pit-item">路沿石/碎片 → 误标为地面 → 忽略真实危险</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5gs-value">
              <span className="t5gs-value-text">你产出的不是代码，是白纸黑字的标注规则文档</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
