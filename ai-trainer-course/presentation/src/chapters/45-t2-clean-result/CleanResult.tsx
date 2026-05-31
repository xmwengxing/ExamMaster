import type { ChapterStepProps } from "../../registry/types";
import "./CleanResult.css";

export default function CleanResult({ step }: ChapterStepProps) {
  return (
    <div className="cr-root scene-pad">
      <div className="cr-layout">
        <div className="cr-compare">
          <div className="cr-panel cr-panel-dirty">
            <div className="cr-panel-header">
              <span className="cr-header-icon">❌</span>
              <span className="cr-header-title">手术前 · 原始日志</span>
            </div>
            <div className="cr-panel-body">
              <span className="cr-line cr-line-tag">{"<br>"}</span>
              <span className="cr-line">[2026-05-26] User:</span>
              <span className="cr-line cr-line-highlight">帮我导航到 138xxxx5678</span>
              <span className="cr-line">那个老王家开的超市，</span>
              <span className="cr-line cr-line-highlight">顺便放点...噪音...</span>
              <span className="cr-line cr-line-tag">#导航失败#</span>
            </div>
          </div>
          <div className="cr-vs">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path d="M10 10 L50 50 M50 10 L10 50" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="cr-vs-label">三刀手术</span>
          </div>
          <div className="cr-panel cr-panel-clean">
            <div className="cr-panel-header">
              <span className="cr-header-icon">✅</span>
              <span className="cr-header-title">手术后 · 训练样本</span>
            </div>
            <div className="cr-panel-body">
              {step >= 1 && (
                <div className="cr-result-block">
                  <span className="cr-result-intent">导航意图</span>
                  <span className="cr-result-text">帮我导航到 [PHONE] 那个老王家开的超市</span>
                </div>
              )}
              {step >= 1 && (
                <div className="cr-result-block">
                  <span className="cr-result-intent">媒体播放意图</span>
                  <span className="cr-result-text">顺便放点</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {step >= 2 && (
          <div className="cr-motto">
            <span className="cr-motto-main">从泥巴到燃料</span>
            <span className="cr-motto-sub">清洗·脱敏·拆分 — 三条训练样本，结构清晰、隐私安全、意图纯净</span>
          </div>
        )}
        {step >= 3 && (
          <div className="cr-next">
            <span className="cr-next-text">接下来：更难的问题 — 语义歧义 →</span>
          </div>
        )}
      </div>
    </div>
  );
}
