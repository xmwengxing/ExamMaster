import type { ChapterStepProps } from "../../registry/types";
import "./IronyExample.css";

export default function IronyExample({ step }: ChapterStepProps) {
  return (
    <div className="ie-root scene-pad">
      <div className="ie-layout">
        <div className="ie-left">
          <div className="ie-review-area">
            <span className="ie-review-platform">🛒 电商平台 · 用户评论</span>
            <div className="ie-review-card">
              <span className="ie-review-text">这衣服绝了，穿上直接去要饭</span>
              {step >= 2 && (
                <div className="ie-buttons">
                  <span className={`ie-btn ie-btn-good ${step >= 2 ? "ie-btn-hover" : ""}`}>👍 好评</span>
                  <span className={`ie-btn ie-btn-bad ${step >= 3 ? "ie-btn-hover" : ""}`}>👎 差评</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="ie-right">
          {step >= 2 && (
            <div className="ie-analysis">
              <span className="ie-analysis-title">为什么两个判断都说得通？</span>
              <div className="ie-analysis-grid">
                <div className={`ie-arg ${step >= 3 ? "ie-arg-on" : ""}`}>
                  <span className="ie-arg-icon">😍</span>
                  <span className="ie-arg-word">"绝了"</span>
                  <span className="ie-arg-reason">日常口语表示极好的</span>
                  <span className="ie-arg-badge ie-badge-good">→ 好评</span>
                </div>
                <div className={`ie-arg ${step >= 4 ? "ie-arg-on" : ""}`}>
                  <span className="ie-arg-icon">😰</span>
                  <span className="ie-arg-word">"要饭"</span>
                  <span className="ie-arg-reason">极端负面的生活场景</span>
                  <span className="ie-arg-badge ie-badge-bad">→ 差评</span>
                </div>
              </div>
            </div>
          )}
          {step >= 4 && (
            <div className="ie-verdict">
              <span className="ie-verdict-text">同一条文本 · 两个相反的判断</span>
              <span className="ie-verdict-sub">这就是反讽——表面在夸，实际在损</span>
            </div>
          )}
          {step >= 5 && (
            <div className="ie-task">
              <span className="ie-task-text">训练师的任务：不是在好评和差评之间赌一把</span>
              <span className="ie-task-sub">而是建立规则，让标注员有章可循</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
