import type { ChapterStepProps } from "../../registry/types";
import "./Conflict.css";

export default function Conflict({ step }: ChapterStepProps) {
  return (
    <div className="cf-root scene-pad">
      <div className="cf-center">
        <div className="cf-split">
          <div className="cf-side cf-side-left">
            <div className="cf-side-label">算法工程师</div>
            {step >= 0 && (
              <div className="cf-quote-block">
                <span className="cf-quote-line">我的模型准确率</span>
                {step >= 1 && <span className="cf-quote-big">99%</span>}
                {step >= 2 && <span className="cf-quote-line">凭什么说我不行？</span>}
              </div>
            )}
          </div>
          {step >= 3 && (
            <div className="cf-crack">
              <svg width="10" height="280" viewBox="0 0 10 280" preserveAspectRatio="none">
                <path
                  d="M5 0 L5 30 L2 48 L7 58 L3 72 L8 86 L2 102 L6 116 L1 132 L8 146 L3 162 L7 176 L2 192 L6 208 L1 224 L8 238 L3 254 L5 280"
                  stroke="var(--accent)" strokeWidth="3" fill="none"
                  strokeDasharray="300" strokeDashoffset="0" />
              </svg>
            </div>
          )}
          <div className="cf-side cf-side-right">
            {step >= 3 && <div className="cf-side-label">业务部门</div>}
            {step >= 4 && (
              <div className="cf-quote-block cf-quote-right">
                <span className="cf-quote-line">你这推荐的</span>
                {step >= 5 && <span className="cf-quote-line">什么玩意</span>}
                {step >= 5 && (
                  <span className="cf-quote-big cf-quote-accent">根本不符合操作习惯</span>
                )}
              </div>
            )}
            {step >= 6 && (
              <div className="cf-closing">技术指标 与 业务需求 之间的裂痕</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
