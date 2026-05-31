import type { ChapterStepProps } from "../../registry/types";
import "./Slicing.css";

export default function Slicing({ step }: ChapterStepProps) {
  return (
    <div className="t4sl-root scene-pad">
      <div className="t4sl-layout">
        <div className="t4sl-left">
          <div className="t4sl-header">
            <span className="t4sl-title">语义级平滑切片</span>
            <span className="t4sl-sub">Semantic Smooth Slicing</span>
          </div>
          <div className="t4sl-wrong">
            <span className="t4sl-wrong-label">❌ 错误切法</span>
            <div className="t4sl-wrong-demo">
              <span className="t4sl-demo-word">我要</span>
              <span className="t4sl-demo-cut">退</span>
              <span className="t4sl-demo-word">款</span>
            </div>
            <span className="t4sl-wrong-note">从词语中间切断 → 语义碎片化</span>
          </div>
          <div className="t4sl-right-demo">
            <span className="t4sl-right-label">✅ 正确切法</span>
            <div className="t4sl-overlap-demo">
              <svg width="100%" height="40" viewBox="0 0 400 40">
                <rect x="0" y="8" width="175" height="24" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1"/>
                <rect x="155" y="8" width="175" height="24" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1"/>
                <text x="40" y="25" fill="var(--accent)" fontSize="14" fontFamily="monospace">片段A 12s</text>
                <text x="85" y="36" fill="var(--text-mute)" fontSize="11" fontFamily="monospace">Overlap</text>
                <text x="230" y="25" fill="var(--accent)" fontSize="14" fontFamily="monospace">片段B 12s</text>
              </svg>
              <span className="t4sl-overlap-label">重叠区 200~500ms</span>
            </div>
          </div>
        </div>
        <div className="t4sl-right-panel">
          {step >= 0 && (
            <div className="t4sl-params">
              <span className="t4sl-params-title">切片参数</span>
              <span className="t4sl-params-item">🎯 目标时长: 10~15s/片段</span>
              <span className="t4sl-params-item">🔗 Overlap: 200~500ms</span>
            </div>
          )}
          {step >= 4 && (
            <div className="t4sl-next">
              <span className="t4sl-next-text">重叠音：脏数据还是无价之宝？→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
