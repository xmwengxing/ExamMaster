import type { ChapterStepProps } from "../../registry/types";
import "./Guideline.css";

export default function Guideline({ step }: ChapterStepProps) {
  return (
    <div className="gl-root scene-pad">
      <div className="gl-layout">
        <div className="gl-left">
          <div className="gl-vs">
            <div className={`gl-approach gl-bad ${step >= 0 ? "gl-show" : ""}`}>
              <span className="gl-approach-icon">❌</span>
              <span className="gl-approach-title">依赖人的常识</span>
              <span className="gl-approach-desc">模糊 · 主观 · 情绪波动 · 因人而异</span>
            </div>
            <div className="gl-vs-arrow">
              <span className="gl-vs-text">→</span>
            </div>
            <div className={`gl-approach gl-good ${step >= 0 ? "gl-show" : ""}`}>
              <span className="gl-approach-icon">✅</span>
              <span className="gl-approach-title">白纸黑字的指南</span>
              <span className="gl-approach-desc">客观 · 统一 · 可反复执行 · 零歧义</span>
            </div>
          </div>
          {step >= 3 && (
            <div className="gl-rule-demo">
              <span className="gl-rule-label">规则示例：反讽判定</span>
              <div className="gl-rule-box">
                <span className="gl-rule-condition">当评论文本中同时出现</span>
                <div className="gl-rule-features">
                  <span className="gl-feature">极端褒义词（如"绝了""神了"）</span>
                  <span className="gl-feature-plus">+</span>
                  <span className="gl-feature">极端负面场景（如"要饭""破产"）</span>
                </div>
                <span className="gl-rule-arrow">→</span>
                <span className="gl-rule-result">判定为反讽 · 标注为差评</span>
              </div>
            </div>
          )}
        </div>
        <div className="gl-right">
          {step >= 1 && (
            <div className="gl-elements">
              <span className="gl-elements-title">标注指南三要素</span>
              {[
                { num: "01", label: "概念定义", desc: "清晰定义标注目标", show: step >= 1 },
                { num: "02", label: "判断规则", desc: "正/负例充要条件", show: step >= 2 },
                { num: "03", label: "边界案例", desc: "灰色地带+正确答案", show: step >= 2 },
              ].map((e) => (
                <div key={e.num} className={`gl-element ${e.show ? "gl-el-on" : "gl-el-off"}`}>
                  <span className="gl-el-num">{e.num}</span>
                  <span className="gl-el-label">{e.label}</span>
                  <span className="gl-el-desc">{e.desc}</span>
                </div>
              ))}
            </div>
          )}
          {step >= 4 && (
            <div className="gl-insight">
              <span className="gl-insight-text">把模糊语感 → 翻译成文本特征</span>
              <span className="gl-insight-sub">标注员不需要猜，只需要扫描</span>
            </div>
          )}
          {step >= 5 && (
            <div className="gl-next">
              <span className="gl-next-text">每条规则配 Golden Samples →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
