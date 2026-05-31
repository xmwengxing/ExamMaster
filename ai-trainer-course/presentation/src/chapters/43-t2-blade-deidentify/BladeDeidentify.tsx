import type { ChapterStepProps } from "../../registry/types";
import "./BladeDeidentify.css";

export default function BladeDeidentify({ step }: ChapterStepProps) {
  return (
    <div className="bd-root scene-pad">
      <div className="bd-layout">
        <div className="bd-left">
          <div className="bd-knife-header">
            <span className="bd-knife-num">第二刀</span>
            <span className="bd-knife-name">脱敏</span>
          </div>
          <div className="bd-transform-stage">
            <div className="bd-before">
              <span className="bd-before-label">原始日志片段</span>
              <span className="bd-before-text">帮我导航到 <em>138xxxx5678</em> 那个...</span>
            </div>
            <div className="bd-arrow-big">
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path d="M0 20 L70 20 M60 10 L74 20 L60 30"
                  stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div className="bd-after">
              <span className="bd-after-label">脱敏后</span>
              <span className="bd-after-text">帮我导航到 <strong>[PHONE]</strong> 那个...</span>
            </div>
          </div>
          {step >= 2 && (
            <div className="bd-after-log">
              <span className="bd-after-log-label">经过第一刀和第二刀之后</span>
              <div className="bd-after-log-box">
                <span className="bd-after-log-text">[2026-05-26] User: 帮我导航到 [PHONE] 那个老王家开的超市，顺便放点 #导航失败#</span>
              </div>
            </div>
          )}
        </div>
        <div className="bd-right">
          {step >= 0 && (
            <div className="bd-principle">
              <span className="bd-principle-title">脱敏核心</span>
              <span className="bd-principle-text">识别PII模式 → 替换为不可逆标签</span>
              <span className="bd-principle-rule">合规优先：数据可用性保留 · 隐私风险切断</span>
            </div>
          )}
          {step >= 3 && (
            <div className="bd-warning">
              <span className="bd-warning-icon">⚠️</span>
              <span className="bd-warning-text">如果跳过这一刀，一旦发生泄露，面临的不只是项目失败，而是法律制裁和职业生涯终结。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
