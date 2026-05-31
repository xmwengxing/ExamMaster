import type { ChapterStepProps } from "../../registry/types";
import "./BladeSplit.css";

export default function BladeSplit({ step }: ChapterStepProps) {
  return (
    <div className="bs-root scene-pad">
      <div className="bs-layout">
        <div className="bs-left">
          <div className="bs-knife-header">
            <span className="bs-knife-num">第三刀</span>
            <span className="bs-knife-name">意图拆分</span>
          </div>
          <div className="bs-merged">
            <span className="bs-merged-label">拆分前 (一条样本)</span>
            <div className="bs-merged-box">
              <span className="bs-merged-text">帮我导航到 [PHONE] 那个老王家开的超市，顺便放点</span>
              <div className="bs-merged-conflict">
                <span className="bs-conflict-label">意图混淆</span>
                <span className="bs-conflict-detail">导航意图 + 媒体播放意图</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bs-split-arrow">
          <svg width="60" height="180" viewBox="0 0 60 180">
            <path d="M30 0 L30 180" stroke="var(--accent)" strokeWidth="2" strokeDasharray="8 4" />
            <path d="M10 70 L30 90 L10 110 M50 130 L30 150 L50 170" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div className="bs-right">
          {step >= 1 && (
            <div className="bs-sample-group">
              <div className="bs-sample bs-sample-a">
                <span className="bs-sample-label">样本 A</span>
                <span className="bs-sample-intent">导航意图</span>
                <span className="bs-sample-text">帮我导航到 [PHONE] 那个老王家开的超市</span>
              </div>
              <div className="bs-sample bs-sample-b">
                <span className="bs-sample-label">样本 B</span>
                <span className="bs-sample-intent">媒体播放意图</span>
                <span className="bs-sample-text">顺便放点</span>
              </div>
            </div>
          )}
          {step >= 3 && (
            <div className="bs-value">
              <span className="bs-value-title">化腐朽为神奇</span>
              <span className="bs-value-text">一条会污染模型的数据 → 两条高质量独立训练样本</span>
            </div>
          )}
          {step >= 4 && (
            <div className="bs-final">
              <span className="bs-final-text">最终结果 →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
