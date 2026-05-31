import type { ChapterStepProps } from "../../registry/types";
import "./Sparsity.css";

export default function Sparsity({ step }: ChapterStepProps) {
  return (
    <div className="t5sp-root scene-pad">
      <div className="t5sp-layout">
        <div className="t5sp-left">
          <div className="t5sp-header">
            <span className="t5sp-num">盲区 01</span>
            <span className="t5sp-name">稀疏性</span>
          </div>
          <div className="t5sp-demo">
            <div className="t5sp-demo-near">
              <span className="t5sp-demo-label">10m 处</span>
              <div className="t5sp-demo-row">
                {Array.from({length:12}).map((_,i)=><div key={i} className="t5sp-demo-dot t5sp-dot-dense"/>)}
              </div>
            </div>
            <div className="t5sp-demo-far">
              <span className="t5sp-demo-label">100m 处</span>
              <div className="t5sp-demo-row">
                {Array.from({length:3}).map((_,i)=><div key={i} className="t5sp-demo-dot t5sp-dot-sparse"/>)}
              </div>
              <span className="t5sp-demo-note">仅 3~8 个点 · 无法分辨是人还是电线杆</span>
            </div>
          </div>
        </div>
        <div className="t5sp-right">
          {step >= 2 && (
            <div className="t5sp-sop">
              <span className="t5sp-sop-title">SOP 分级标注标准</span>
              <span className="t5sp-sop-item">0~50m → 完整3D框 (长宽高+航向角)</span>
              <span className="t5sp-sop-item">50~100m → 类别+大致朝向</span>
              <span className="t5sp-sop-item">100m+ 行人 → 区域+置信度</span>
            </div>
          )}
          {step >= 3 && (
            <div className="t5sp-principle">
              <span className="t5sp-principle-text">不同距离不同标准 = 对物理特性的尊重</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
