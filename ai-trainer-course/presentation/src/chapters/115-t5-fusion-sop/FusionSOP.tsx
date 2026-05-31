import type { ChapterStepProps } from "../../registry/types";
import "./FusionSOP.css";

export default function FusionSOP({ step }: ChapterStepProps) {
  return (
    <div className="t5fs-root scene-pad">
      <div className="t5fs-layout">
        <div className="t5fs-header">
          <span className="t5fs-eyebrow">S4 收尾</span>
          <h2 className="t5fs-title">专家级SOP：降维打击思维</h2>
        </div>

        {step >= 1 && (
          <div className="t5fs-mindset">
            <span className="t5fs-mindset-text">
              训练师的工作 = 物理矛盾 → 模型教材
            </span>
          </div>
        )}

        <div className="t5fs-elements">
          <div className={`t5fs-element ${step >= 2 ? "t5fs-element--on" : ""}`}>
            <div className="t5fs-element-icon">📋</div>
            <div className="t5fs-element-body">
              <span className="t5fs-element-title">三级置信度定义</span>
              <span className="t5fs-element-desc">每级的触发条件清清楚楚写明白</span>
            </div>
          </div>
          <div className={`t5fs-element ${step >= 3 ? "t5fs-element--on" : ""}`}>
            <div className="t5fs-element-icon">📐</div>
            <div className="t5fs-element-body">
              <span className="t5fs-element-title">虚拟3D框插值方法</span>
              <span className="t5fs-element-desc">何时可插值、怎么插、参考哪些帧</span>
            </div>
          </div>
          <div className={`t5fs-element ${step >= 4 ? "t5fs-element--on" : ""}`}>
            <div className="t5fs-element-icon">🏷️</div>
            <div className="t5fs-element-body">
              <span className="t5fs-element-title">特殊标签使用规范</span>
              <span className="t5fs-element-desc">什么情况打什么标签、标签含义</span>
            </div>
          </div>
        </div>

        {step >= 2 && (
          <div className="t5fs-quote">
            <span>「你能讲清楚数据打架背后的物理逻辑」</span>
            <span className="t5fs-quote-sub">——这就是你不可替代的价值</span>
          </div>
        )}
      </div>
    </div>
  );
}