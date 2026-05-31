import type { ChapterStepProps } from "../../registry/types";
import "./CleanTransform.css";

const CLEAN_ACTIONS = [
  { icon: "◇", label: "去HTML标签", raw: "<br>", clean: "✓" },
  { icon: "○", label: "过滤乱码", raw: "���", clean: "✓" },
  { icon: "□", label: "统一格式", raw: "2026/5/26", clean: "2026-05-26" },
];

export default function CleanTransform({ step }: ChapterStepProps) {
  return (
    <div className="t2ct-root scene-pad">
      <div className="t2ct-center">
        {step <= 2 && (
          <div className="t2ct-clean-stage">
            <span className="t2ct-clean-title">清洗：去伪存真</span>
            <div className="t2ct-clean-grid">
              {CLEAN_ACTIONS.map((a, i) => (
                <div key={a.label} className={`t2ct-clean-card ${i <= step - 1 ? "t2ct-clean-done" : "t2ct-clean-pending"}`}>
                  <span className="t2ct-clean-icon">{a.icon}</span>
                  <span className="t2ct-clean-label">{a.label}</span>
                  {i <= step - 1 ? (
                    <span className="t2ct-clean-arrow">{a.raw} → {a.clean}</span>
                  ) : (
                    <span className="t2ct-clean-wait">...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="t2ct-transform-stage">
            <span className="t2ct-transform-title">转换：文本 → 结构化</span>
            <div className="t2ct-transform-demo">
              <div className="t2ct-t-left">
                <span className="t2ct-t-label">原始文本</span>
                <span className="t2ct-t-text">用户说太贵了，能不能便宜点</span>
              </div>
              <svg width="60" height="16" viewBox="0 0 60 16">
                <path d="M0 8 L52 8 M44 2 L54 8 L44 14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <div className="t2ct-t-right">
                <span className="t2ct-t-label">结构化输出</span>
                <div className="t2ct-t-json">
                  <span className="t2ct-t-json-line">intent: 议价</span>
                  <span className="t2ct-t-json-line">sentiment: negative</span>
                  <span className="t2ct-t-json-line">entity: 价格</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="t2ct-tip">
            <span className="t2ct-tip-text">清洗 + 转换 = 从泥巴到燃料的关键两步</span>
          </div>
        )}
        {step >= 4 && (
          <div className="t2ct-bridge">
            <span className="t2ct-bridge-text">最后一步：增强 → 拉开你和初级训练师的差距</span>
          </div>
        )}
      </div>
    </div>
  );
}
