import type { ChapterStepProps } from "../../registry/types";
import "./GoldenSamples.css";

const SAMPLES = [
  "款式太潮了，潮到我不敢穿出门。",
  "质量特别好，好到我穿了两次就开线了。",
  "这客服态度堪称业界楷模，我问了三个小时愣是没人理我。",
  "发货速度快到让我怀疑人生，下单十天后还在等待揽件。",
  "包装非常精美，光拆包装就拆了二十分钟。",
];

export default function GoldenSamples({ step }: ChapterStepProps) {
  return (
    <div className="gs-root scene-pad">
      <div className="gs-layout">
        <div className="gs-left">
          <div className="gs-header">
            <span className="gs-badge">Golden Samples</span>
            <span className="gs-rule-ref">规则：褒义词 + 负面场景 → 反讽 · 差评</span>
          </div>
          <div className="gs-samples">
            {SAMPLES.map((s, i) => (
              <div key={i} className={`gs-sample ${i <= step - 1 ? "gs-sample-on" : "gs-sample-off"}`}>
                <span className="gs-sample-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="gs-sample-text">{s}</span>
                <span className="gs-sample-tag">差评</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gs-right">
          {step >= 0 && (
            <div className="gs-principle">
              <span className="gs-principle-title">Golden Samples 的作用</span>
              <span className="gs-principle-text">把抽象规则变成具象的参照标准</span>
              <span className="gs-principle-note">标注员看完例子 → 遇到新情况立刻能判断</span>
            </div>
          )}
          {step >= 3 && (
            <div className="gs-scale">
              <span className="gs-scale-title">完整指南的规模</span>
              <div className="gs-scale-grid">
                <div className="gs-scale-item">
                  <span className="gs-scale-num">10~20</span>
                  <span className="gs-scale-label">条判定规则</span>
                </div>
                <div className="gs-scale-item">
                  <span className="gs-scale-num">5+</span>
                  <span className="gs-scale-label">条 Golden Samples / 规则</span>
                </div>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="gs-value">
              <span className="gs-value-text">100人还是1000人，结果高度一致</span>
              <span className="gs-value-sub">这是训练师无可替代的核心价值</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
