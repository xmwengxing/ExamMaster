import type { ChapterStepProps } from "../../registry/types";
import "./DeidentifyTech.css";

export default function DeidentifyTech({ step }: ChapterStepProps) {
  return (
    <div className="t2dt-root scene-pad">
      <div className="t2dt-center">
        {step <= 2 && (
          <div className="t2dt-tools">
            <div className={`t2dt-tool-card ${step >= 0 ? "t2dt-tool-on" : ""}`}>
              <span className="t2dt-tool-title">正则表达式</span>
              <span className="t2dt-tool-desc">模式匹配 · 固定格式</span>
              <span className="t2dt-tool-arrow">→</span>
              <span className="t2dt-tool-result">[PHONE]</span>
            </div>
            <div className={`t2dt-tool-card ${step >= 0 ? "t2dt-tool-on" : ""}`}>
              <span className="t2dt-tool-title">NER 实体识别</span>
              <span className="t2dt-tool-desc">语义理解 · 灵活识别</span>
              <span className="t2dt-tool-arrow">→</span>
              <span className="t2dt-tool-result">[NAME]</span>
            </div>
          </div>
        )}
        {step >= 1 && (
          <div className="t2dt-demo">
            <div className="t2dt-demo-row">
              <span className="t2dt-demo-raw">13812345678</span>
              <svg className="t2dt-demo-arrow-svg" width="60" height="16" viewBox="0 0 60 16">
                <path d="M0 8 L52 8 M44 2 L54 8 L44 14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="t2dt-demo-clean">[PHONE]</span>
            </div>
            {step >= 2 && (
              <div className="t2dt-demo-row t2dt-demo-row-delay">
                <span className="t2dt-demo-raw">翁某某</span>
                <svg className="t2dt-demo-arrow-svg" width="60" height="16" viewBox="0 0 60 16">
                  <path d="M0 8 L52 8 M44 2 L54 8 L44 14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span className="t2dt-demo-clean">[NAME]</span>
              </div>
            )}
          </div>
        )}
        {step >= 3 && (
          <div className="t2dt-summary">
            <span className="t2dt-summary-text">敏感信息 → 标签化 → 可用性保留 · 风险切断</span>
            <span className="t2dt-summary-sub">脱敏之后的数据，算法可以放心使用</span>
          </div>
        )}
        {step >= 4 && (
          <div className="t2dt-bridge">
            <span className="t2dt-bridge-text">接下来：清洗与转换 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
