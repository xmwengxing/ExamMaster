import type { ChapterStepProps } from "../../registry/types";
import "./Augment.css";

const TECHNIQUES = [
  { name: "同义词替换", ex: "很好 → 非常棒 · 超级好 · 特别赞" },
  { name: "句式变换", ex: "陈述句 → 疑问句 · 被动转主动" },
  { name: "回译增强", ex: "中文 → 英文 → 中文" },
];

export default function Augment({ step }: ChapterStepProps) {
  return (
    <div className="t2au-root scene-pad">
      <div className="t2au-center">
        {step <= 2 && (
          <div className="t2au-expand-stage">
            <div className="t2au-count-group">
              <div className={`t2au-count ${step >= 0 ? "t2au-count-on" : ""}`}>
                <span className="t2au-count-num">100</span>
                <span className="t2au-count-label">条数据</span>
              </div>
              <div className="t2au-multiply">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <line x1="8" y1="20" x2="32" y2="20" stroke="var(--accent)" strokeWidth="2" />
                  <line x1="20" y1="8" x2="20" y2="32" stroke="var(--accent)" strokeWidth="2" />
                </svg>
              </div>
              <div className={`t2au-count t2au-count-big ${step >= 1 ? "t2au-count-on" : ""}`}>
                <span className="t2au-count-num">500</span>
                <span className="t2au-count-label">高质量样本</span>
              </div>
            </div>
            <div className="t2au-techniques">
              {TECHNIQUES.map((t, i) => (
                <div key={t.name} className={`t2au-tech-card ${i <= step - 1 ? "t2au-tech-show" : ""}`}>
                  <span className="t2au-tech-name">{t.name}</span>
                  <span className="t2au-tech-ex">{t.ex}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="t2au-warning-stage">
            <div className="t2au-warn-card">
              <span className="t2au-warn-icon">⚠️</span>
              <span className="t2au-warn-text">顺序不能乱：脱敏 → 清洗 → 转换 → 增强</span>
              <div className="t2au-warn-flow">
                <span className="t2au-warn-bad">脏数据 × 增强</span>
                <span className="t2au-warn-arrow">=</span>
                <span className="t2au-warn-bad">批量垃圾</span>
              </div>
            </div>
          </div>
        )}
        {step >= 4 && (
          <div className="t2au-tagline">
            <span className="t2au-tagline-text">五步走完，数据完成从业余到专业的蜕变</span>
          </div>
        )}
        {step >= 5 && (
          <div className="t2au-bridge">
            <span className="t2au-bridge-text">实战检验：看一个真实案例 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
